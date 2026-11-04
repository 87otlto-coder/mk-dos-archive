#!/usr/bin/env python3
"""O121 static MK2 indexed stage setup controls -> sprite and palette source.

Does not identify the scene setup activated in DOSBox or an allocated VGA handle.
Uses the original canonical EXE and user's original GRA resources; never mutates input.
"""
from __future__ import annotations
import argparse, hashlib, json, struct, zipfile
from pathlib import Path
from trace_o120_setup_graph import main_report, fixups, SPECS, OBJ1, OBJ2, EXE_SHA, require

EXPECTED_RESOURCE={'tomb80':(28,'TOMB.GRA'),'portal80':(25,'PORTAL.GRA'),
                   'tomb79':(22,'IMAGES.GRA'),'portal79':(22,'IMAGES.GRA')}
POOL_START=0xA0EF1
POOL_END=0xA13A7

def digest(x:bytes)->str: return hashlib.sha256(x).hexdigest()

def resource_pool(exe:bytes)->list[str]:
    names=[s.decode('ascii') for s in exe[POOL_START:POOL_END].split(b'\x00') if s]
    require(names[22]=='IMAGES.GRA' and names[25]=='PORTAL.GRA' and names[28]=='TOMB.GRA',
            'resource registry mapping mismatch')
    return names

def load_game_files(game_zip:Path,resource_names:set[str])->dict[str,bytes]:
    with zipfile.ZipFile(game_zip) as z:
        result={}
        for name in sorted(resource_names):
            matches=[x for x in z.namelist() if x.rsplit('/',1)[-1].upper()==name]
            require(len(matches)==1,'missing or duplicate original GRA '+name)
            result[name]=z.read(matches[0])
    return result

def i16(value:int)->int:return value-65536 if value>=32768 else value

def build(exe:bytes,source_gra:dict[str,bytes])->dict:
    require(len(exe)==861133 and digest(exe)==EXE_SHA, 'noncanonical MK2.EXE')
    pool=resource_pool(exe)
    graph=main_report(exe)
    typed=fixups(exe)
    out=[]
    for family,(record,count,table,setup_offsets,number_of_direct_references) in SPECS.items():
        rid,resource_name=EXPECTED_RESOURCE[family]
        require(pool[rid]==resource_name,'wrong file ID')
        require(resource_name in source_gra,'resource required: '+resource_name)
        gra=source_gra[resource_name]
        require(table==graph['records'][family]['palettePointerTableObject2'], 'prior graph table mismatch')
        pal_fx=typed.get((2,table+8))
        require(pal_fx and pal_fx['targetObject']==1 and pal_fx['targetOffset']==record-OBJ1,
                'index-2 palette pointer fixup disagrees with counted palette source')
        require(struct.unpack_from('<I',exe,OBJ2+table+8)[0]==record-OBJ1,'palette raw pointer mismatch')
        setups=[]
        for setup in setup_offsets:
            width,height,n=struct.unpack_from('<HHH',exe,OBJ2+setup)
            ctl=typed[(2,setup+6)]['targetOffset']
            sprite_table=typed[(2,setup+10)]['targetOffset']
            ptable=typed[(2,setup+14)]['targetOffset']
            require(ptable==table,'palette table mismatch')
            rows=[]
            for ordinal in range(n):
                loc=OBJ2+ctl+ordinal*8
                flags,x,y,pair=struct.unpack_from('<HHHH',exe,loc)
                palette_slot=(flags&0x0F)|((pair&0xF000)>>8)
                # The 0x81d3e/0x81d43/0x81d46 shift sequence: low twelve bits * 4.
                sprite_word_offset=(pair&0x0FFF)*4
                require(sprite_word_offset%8==0,'sprite descriptor offset is not aligned to an 8-byte entry')
                sprite_loc=OBJ2+sprite_table+sprite_word_offset
                require(OBJ2<=sprite_loc and sprite_loc+8<=len(exe), 'sprite descriptor outside EXE')
                sw,sh=struct.unpack_from('<HH',exe,sprite_loc)
                resource_token=struct.unpack_from('<I',exe,sprite_loc+4)[0]
                resource_id=resource_token>>24
                start=resource_token&0xFFFFFF
                require(resource_id==rid, 'unexpected graphic file ownership')
                require(0<=start<len(gra), 'graphic resource offset outside file')
                require(sw>0 and sh>0,'empty sprite descriptor')
                require(palette_slot==2,'palette selector differs from 2')
                rows.append({'controlIndex':ordinal,'controlOffsetObject2':ctl+ordinal*8,
                             'rawControlWords':[flags,x,y,pair],
                             'signedX':i16(x),'signedY':i16(y),
                             'paletteSlot':palette_slot,'spriteOrdinal':sprite_word_offset//8,
                             'spriteDescriptorOffsetObject2':sprite_table+sprite_word_offset,
                             'spriteWidth':sw,'spriteHeight':sh,
                             'packedResourceID':resource_id,'packedResourceOffset':start})
            setups.append({'setupObject2Offset':setup,'controlObject2Offset':ctl,
                           'spriteDescriptorTableObject2Offset':sprite_table,
                           'count':n,'rawSizeWords':[width,height],
                           'rows':rows})
        out.append({'familyLabel':family,'runtimeEffect': 'CONFIRMED_80_RECORD' if count==80 else 'NEGATIVE_SELECTED_79_TEST',
                    'palettePhysical':record,'paletteCount':count,
                    'paletteTableObject2Offset':table,'verifiedSlot':2,
                    'slot2PointerObject2Offset':table+8,
                    'slot2TargetObject1Offset':record-OBJ1,
                    'resourceID':rid,'resourceName':resource_name,
                    'resourceByteSize':len(gra),'resourceSHA256':digest(gra),
                    'setupCount':len(setups),'controlCount':sum(x['count'] for x in setups),
                    'distinctDescriptorOffsets':len({r['spriteDescriptorOffsetObject2'] for s in setups for r in s['rows']}),
                    'setups':setups})
    require(sum(g['controlCount'] for g in out)==135, 'total control corpus')
    return {'format':'mk2_o121_palette_slot_sprite_resource_conditional_v1',
            'status':'PASS_STATIC_CONDITIONAL_BINDINGS',
            'canonicalExeSHA256':EXE_SHA,
            'parentReport': 'O120_STAGE_PALETTE_SETUP_GRAPH.json',
            'resourcePoolOffset':POOL_START,
            'codeSites':{'readControlTable':0x81caa,'readControlFirstWord':0x81daf,
                         'readControlDescriptorIndex':0x81dbd,'maskPaletteNibble':0x81dc4,
                         'maskControlHighNibble':0x81dc7,'shiftControlHighNibble':0x81dcd,
                         'combinePaletteSlot':0x81dd0,'scaleIndex':0x81dd2,
                         'paletteArrayBase':0x81dd5,'readPaletteRecord':0x81dd8,
                         'callPaletteAllocator':0x81dda},
            'totals':{'setupRecords':sum(g['setupCount'] for g in out),
                      'controlEntries':sum(g['controlCount'] for g in out),
                      'uniqueDescriptorOffsets':len({r['spriteDescriptorOffsetObject2'] for g in out for s in g['setups'] for r in s['rows']}),
                      'runtime80ControlEntries':sum(g['controlCount'] for g in out if g['paletteCount']==80),
                      'alternative79ControlEntries':sum(g['controlCount'] for g in out if g['paletteCount']==79)},
            'families':out,
            'limitations':{'activatedSetupObjectAtRuntime':False,'livePaletteHandle':False,
                           'vgaDACStartingIndex':False,'finalSpriteCompositing':False,
                           '79PalettesNeverUsed':False,
                           'stagePaletteSourceRecordPerturbationO119':True}}

if __name__=='__main__':
    a=argparse.ArgumentParser(description=__doc__)
    a.add_argument('--exe',required=True,type=Path)
    a.add_argument('--game-zip',required=True,type=Path,help='User-supplied original game ZIP containing .GRA files')
    a.add_argument('--out',required=True,type=Path)
    opt=a.parse_args()
    if opt.out.exists():raise SystemExit('O121 refuses to overwrite: '+str(opt.out))
    report=build(opt.exe.read_bytes(),load_game_files(opt.game_zip,set(x[1] for x in EXPECTED_RESOURCE.values())))
    opt.out.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'status':report['status'],'totals':report['totals'],
                      'resourceOwnership':[(f['familyLabel'],f['resourceName']) for f in report['families']]}))
