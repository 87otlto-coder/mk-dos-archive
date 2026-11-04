#!/usr/bin/env python3
"""Independent O121 audit: re-read canonical MK2.EXE + original GRA data.

Does NOT import the O121 producer. Check every raw selector, sprite descriptor,
resource ID/offset, relocated palette-table slot, source hashes and limitations.
"""
from __future__ import annotations
import hashlib, json, struct, sys, zipfile
from pathlib import Path
from verify_o120_independent import parse_fixups

SHA=lambda b:hashlib.sha256(b).hexdigest()
ROOT=0xa0c54; IMAGE=0x61c54
CASES=(('tomb80',0x893c6,80,0x177d0,(0x17358,0x1736a,0x1737c,0x1738e,0x173a0,0x173b2),28,'TOMB.GRA'),
       ('portal80',0x891e0,80,0x16538,(0x16514,0x16526),25,'PORTAL.GRA'),
       ('tomb79',0x8cdbe,79,0x2e848,(0x2e7e4,),22,'IMAGES.GRA'),
       ('portal79',0x8cd1e,79,0x2e784,(0x2e720,),22,'IMAGES.GRA'))

def insist(ok,msg):
    if not ok:raise AssertionError('O121 independent: '+msg)

def verify(exe:bytes,zip_bytes:bytes,raw:bytes)->dict:
    from io import BytesIO
    insist(SHA(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65' and len(exe)==861133,'canonical EXE')
    # Independently validate earlier LE object-typed reference census.
    typed,fixup_count=parse_fixups(exe)
    insist(fixup_count==27004,'relocation count')
    names=[b.decode('ascii') for b in exe[0xa0ef1:0xa13a7].split(b'\0') if b]
    with zipfile.ZipFile(BytesIO(zip_bytes)) as archive:
        gra={}
        for n in ('TOMB.GRA','PORTAL.GRA','IMAGES.GRA'):
            paths=[k for k in archive.namelist() if k.rsplit('/',1)[-1].upper()==n]
            insist(len(paths)==1,'missing or duplicate resource '+n)
            gra[n]=archive.read(paths[0])
    def U(at):return struct.unpack_from('<I',exe,at)[0]
    def W(at):return struct.unpack_from('<H',exe,at)[0]
    def S(at):return struct.unpack_from('<h',exe,at)[0]
    q=json.loads(raw)
    insist(set(q)=={'format','status','canonicalExeSHA256','parentReport','resourcePoolOffset','codeSites','totals','families','limitations'},'top-level schema')
    insist(q['format']=='mk2_o121_palette_slot_sprite_resource_conditional_v1' and q['status']=='PASS_STATIC_CONDITIONAL_BINDINGS','status')
    insist(q['canonicalExeSHA256']==SHA(exe) and q['parentReport']=='O120_STAGE_PALETTE_SETUP_GRAPH.json' and q['resourcePoolOffset']==0xa0ef1,'anchor')
    sites={'readControlTable':0x81caa,'readControlFirstWord':0x81daf,
           'readControlDescriptorIndex':0x81dbd,'maskPaletteNibble':0x81dc4,
           'maskControlHighNibble':0x81dc7,'shiftControlHighNibble':0x81dcd,
           'combinePaletteSlot':0x81dd0,'scaleIndex':0x81dd2,
           'paletteArrayBase':0x81dd5,'readPaletteRecord':0x81dd8,
           'callPaletteAllocator':0x81dda}
    insist(q['codeSites']==sites,'machine instruction offsets')
    machine={0x81caa:'8b7e06',0x81daf:'0fb70cdf',0x81dbd:'668b54d706',0x81dc4:'83e00f',
             0x81dc7:'81e200f00000',0x81dcd:'c1ea08',0x81dd0:'0bd0',0x81dd2:'c1e202',
             0x81dd5:'03560e',0x81dd8:'8b02',0x81dda:'e85a96ffff'}
    for at,code in machine.items():
        insist(exe[at:at+len(code)//2].hex()==code,'code signature at '+hex(at))
    insist(len(q['families'])==4,'four families')
    setups_total=controls_total=runtime_total=alternative_total=0
    uniq=set();assertions=0
    for result,spec in zip(q['families'],CASES):
        label,pos,count,table,setup_offsets,resource_id,file_name=spec
        insist(names[resource_id]==file_name,'resource ID registry link')
        insist(result['familyLabel']==label and result['runtimeEffect']==('CONFIRMED_80_RECORD' if count==80 else 'NEGATIVE_SELECTED_79_TEST'),'label/effect')
        insist(result['palettePhysical']==pos and result['paletteCount']==count and W(pos)==count,'palette origin')
        insist(result['paletteTableObject2Offset']==table and result['verifiedSlot']==2,'palette table/slot')
        insist(result['slot2PointerObject2Offset']==table+8 and result['slot2TargetObject1Offset']==pos-IMAGE,'selected table pointer')
        insist(typed[(2,table+8)]==(7,16,1,pos-IMAGE) and U(ROOT+table+8)==pos-IMAGE,'LE authenticated selected palette')
        insist(result['resourceID']==resource_id and result['resourceName']==file_name,'resource ownership')
        source=gra[file_name]
        insist(result['resourceByteSize']==len(source) and result['resourceSHA256']==SHA(source),'source size and checksum')
        insist(result['setupCount']==len(setup_offsets) and len(result['setups'])==len(setup_offsets),'setup count')
        local=set();family_controls=0
        for group,setup in zip(result['setups'],setup_offsets):
            n=W(ROOT+setup+4)
            ctl=U(ROOT+setup+6);sprite_table=U(ROOT+setup+10);palette_table=U(ROOT+setup+14)
            insist(typed[(2,setup+6)]==(7,16,2,ctl),'control pointer relocation')
            insist(typed[(2,setup+10)]==(7,16,2,sprite_table),'sprite pointer relocation')
            insist(typed[(2,setup+14)]==(7,16,2,table) and palette_table==table,'palette pointer relocation')
            insist(group['setupObject2Offset']==setup and group['controlObject2Offset']==ctl and group['spriteDescriptorTableObject2Offset']==sprite_table,'setup pointers')
            insist(group['count']==n and group['rawSizeWords']==[W(ROOT+setup),W(ROOT+setup+2)] and len(group['rows'])==n,'setup raw fields')
            for i,row in enumerate(group['rows']):
                at=ROOT+ctl+i*8
                flag=W(at);u=W(at+2);v=W(at+4);selector=W(at+6)
                pal=(flag%16)+((selector>>12)*16)
                desc_offset=(selector%4096)*4
                insist(desc_offset%8==0,'unaligned descriptor')
                desc=ROOT+sprite_table+desc_offset
                insist(desc>=ROOT and desc+8<=len(exe),'descriptor outside image')
                width,height=W(desc),W(desc+2)
                resource_token=U(desc+4)
                rid=resource_token>>24
                start=resource_token&0xffffff
                insist(rid==resource_id and start<len(source),'resource ID/offset')
                insist(width>0 and height>0 and pal==2,'sprite size and selector')
                signed_x=S(at+2);signed_y=S(at+4)
                expected={'controlIndex':i,'controlOffsetObject2':ctl+i*8,
                          'rawControlWords':[flag,u,v,selector],
                          'signedX':signed_x,'signedY':signed_y,
                          'paletteSlot':pal,'spriteOrdinal':desc_offset//8,
                          'spriteDescriptorOffsetObject2':sprite_table+desc_offset,
                          'spriteWidth':width,'spriteHeight':height,
                          'packedResourceID':rid,'packedResourceOffset':start}
                insist(row==expected, f'{label} setup {setup:x} row {i}')
                local.add(sprite_table+desc_offset);uniq.add(sprite_table+desc_offset)
                assertions+=15
            family_controls+=n
        insist(result['controlCount']==family_controls and result['distinctDescriptorOffsets']==len(local),'family statistics')
        controls_total+=family_controls;setups_total+=len(setup_offsets)
        if count==80:runtime_total+=family_controls
        else: alternative_total+=family_controls
    insist(q['totals']=={'setupRecords':setups_total,'controlEntries':controls_total,
            'uniqueDescriptorOffsets':len(uniq),'runtime80ControlEntries':runtime_total,
            'alternative79ControlEntries':alternative_total},'totals mismatch')
    insist((setups_total,controls_total,len(uniq),runtime_total,alternative_total)==(10,135,49,115,20),'corpus census')
    insist(q['limitations']=={'activatedSetupObjectAtRuntime':False,'livePaletteHandle':False,
                             'vgaDACStartingIndex':False,'finalSpriteCompositing':False,
                             '79PalettesNeverUsed':False,
                             'stagePaletteSourceRecordPerturbationO119':True},'unsupported runtime semantics')
    return {'status':'PASS_INDEPENDENT_O121','authenticatedLEFixups':fixup_count,
            'allControlEntries':controls_total,'distinctSourceDescriptors':len(uniq),
            'sourceFamilies':{s[0]:s[6] for s in CASES},
            'controlFieldAssertions':assertions,'reportSHA256':SHA(raw)}

if __name__=='__main__':
    if len(sys.argv)!=4:raise SystemExit('usage: verify_o121_independent.py ORIGINAL_MK2.EXE ORIGINAL_MK2.ZIP O121_REPORT.json')
    print(json.dumps(verify(Path(sys.argv[1]).read_bytes(),Path(sys.argv[2]).read_bytes(),Path(sys.argv[3]).read_bytes()),indent=2))
