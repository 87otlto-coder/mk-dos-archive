#!/usr/bin/env python3
"""Spelunk 001: independently recheck the original MK2 channel->setup->palette bridge.

Read-only. The input is an owner-supplied original MK2.EXE or ZIP. Output
contains offsets, hashes and structural relationships, never executable bytes,
colour words, game images or palette-bank claims. This proves *conditional*
paths in original static structures, not an observed runtime setup selection.
"""
from __future__ import annotations
import argparse, hashlib, json, struct, zipfile
from pathlib import Path

SHA256='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
LE=0x28f0c
O1=0x61c54
O2=0xa0c54
ROWS=8
ROOT=0x15b68
CHANNEL=0x77453
# independently reproduce the selected links in the O120/O121 graph
SCRIPTS=(
    ('portal80',0x16394,8,0x16514,0x16538,0x891e0,80,'PORTAL.GRA'),
    ('tomb80_a',0x1720c,4,0x17358,0x177d0,0x893c6,80,'TOMB.GRA'),
    ('tomb80_b',0x17288,4,0x17358,0x177d0,0x893c6,80,'TOMB.GRA'),
    ('images79_a',0x2e7c4,8,0x2e7e4,0x2e848,0x8cdbe,79,'IMAGES.GRA'),
    ('images79_b',0x2e700,8,0x2e720,0x2e784,0x8cd1e,79,'IMAGES.GRA'),
)

def insist(p,reason):
    if not p:raise ValueError('Spelunk001: '+reason)

def u16(b,p):return struct.unpack_from('<H',b,p)[0]
def u32(b,p):return struct.unpack_from('<I',b,p)[0]
def digest(b):return hashlib.sha256(b).hexdigest()

def load_original(p:Path)->bytes:
    if p.suffix.lower()=='.zip':
        with zipfile.ZipFile(p) as z:
            hits=[i.filename for i in z.infolist() if i.filename.rsplit('/',1)[-1].upper()=='MK2.EXE']
            insist(len(hits)==1,'expected exactly one MK2.EXE in original ZIP')
            b=z.read(hits[0])
    else:b=p.read_bytes()
    insist(len(b)==861133 and digest(b)==SHA256,'original DOS MK2.EXE fingerprint')
    return b

def fixups(b):
    insist(b[LE:LE+2]==b'LE','LE header')
    object_table=LE+u32(b,LE+0x40)
    obj_count=u32(b,LE+0x44)
    insist(obj_count==2,'two LE objects')
    owners=[]
    for i in range(obj_count):
        at=object_table+24*i
        owners.append((i+1,u32(b,at+12),u32(b,at+16)))
    insist(owners==[(1,1,63),(2,64,50)],'canonical object/page ownership')
    offsets=LE+u32(b,LE+0x68)
    block=LE+u32(b,LE+0x6c)
    seen={};total=0
    for p in range(113):
        owner=1 if p<63 else 2
        first=1 if owner==1 else 64
        pos=block+u32(b,offsets+4*p)
        stop=block+u32(b,offsets+4*(p+1))
        insist(0<=pos<=stop<=len(b),'fixup bounds')
        while pos<stop:
            kind=b[pos]&15;flags=b[pos+1]
            relative=struct.unpack_from('<h',b,pos+2)[0];pos+=4
            insist(flags&3==0,'unsupported fixup flags')
            to_obj=u16(b,pos) if flags&64 else b[pos]
            pos+=2 if flags&64 else 1
            target=None
            if kind!=2:
                target=u32(b,pos) if flags&16 else u16(b,pos)
                pos+=4 if flags&16 else 2
            if flags&4:pos+=4 if flags&32 else 2
            src=(p+1-first)*4096+relative
            physical=(O1 if owner==1 else O2)+src
            insist(0<=physical<len(b),'typed LE fixup source outside backing')
            record=(kind,flags,to_obj,target)
            key=(owner,src)
            insist(key not in seen or seen[key]==record,'conflicting duplicate fixup')
            seen[key]=record
            total+=1
        insist(pos==stop,'LE page boundary mismatch')
    insist(total==27004 and len(seen)==26994,'canonical fixup census')
    return seen

def typed(b,fx,obj,at,to_obj,target):
    entry=fx.get((obj,at))
    insist(entry==(7,16,to_obj,target),
           'wrong typed LE relocation at %d:0x%x expected %d:0x%x'%(obj,at,to_obj,target))
    physical=(O1 if obj==1 else O2)+at
    insist(u32(b,physical)==target,'raw source pointer disagrees with LE relocation at 0x%x'%at)

def verify_machine(b):
    # Exact unmodified, instruction-aligned source witnesses; offsets physical.
    signatures={
       0x81bb6:'bb685b0100',    # EBX=8x4-DWORD static channel table
       0x81bbb:'bf54430800',    # EDI=0x84354
       0x81bc8:'8b430c',        # EAX=row fourth pointer
       0x81bcb:'83c310',        # next row +16
       0x81bce:'83ef04',        # channel index count
       0x81bd1:'81ff30430800',  # stop before reading ninth row
       0x81bd7:'7415',          # JE exit
       0x81bd9:'8b00',          # dereference selected channel state
       0x81bdb:'83f801',        # sentinel one
       0x81be0:'3d40020300',    # alternate sentinel 0x30240
       0x81c4e:'e8c3010000',    # call helper
       0x81c53:'8b30',          # ESI=[EAX] after helper preserves EAX
       0x81e16:'50568bf7',      # helper starts PUSH EAX,PUSH ESI,MOV ESI,EDI
       0x81e75:'5e58c3',        # helper ends POP ESI,POP EAX,RET
       0x81dd5:'03560e',        # EDX += palette table [ESI+0xe]
       0x81dd8:'8b02',          # EAX=[EDX]
       0x81dda:'e85a96ffff',    # counted palette allocator
       0x81ddf:'66894530',      # object palette handle at +0x30
       0x81f9c:'8903',          # conditional stream write [EBX] = EAX
    }
    for physical,h in signatures.items():
        value=bytes.fromhex(h)
        insist(b[physical:physical+len(value)]==value,'source opcode mismatch 0x%x'%physical)
    return len(signatures)

def audit(b,*,check_hash=True,fx_override=None):
    if check_hash:insist(len(b)==861133 and digest(b)==SHA256,'canonical EXE SHA256')
    fx=fx_override if fx_override is not None else fixups(b)
    source_checks=verify_machine(b)
    rows=[]
    for i in range(ROWS):
        row=ROOT+16*i
        expected=[0x767cf+0x190*i,0x842e8,0x8432c-4*i,CHANNEL+4*i]
        for j,target in enumerate(expected):typed(b,fx,2,row+4*j,2,target)
        rows.append({'ordinal':i,'tableObject2Offset':row,
                     'sourceStateObject2':expected[0],
                     'verticalStateObject2':expected[1],
                     'horizontalStateObject2':expected[2],
                     'activeSetupSelectorObject2':expected[3]})
    insist(u32(b,O2+ROOT+16*ROWS)==0,'ninth row zero first-field terminator')
    # O121's palette/resource setup families: independently join selected
    # command -> mutable channel0 -> setup -> palette pointer table slot2.
    links=[]
    for label,channel_at,delta,setup,ptable,physical,count,source in SCRIPTS:
        typed(b,fx,2,channel_at,2,CHANNEL)
        typed(b,fx,2,channel_at+delta,2,setup)
        typed(b,fx,2,setup+14,2,ptable)
        typed(b,fx,2,ptable+8,1,physical-O1)
        insist(u16(b,physical)==count,'counted palette record differs')
        links.append({'family':label,'commandSelectorObject2':channel_at,
                      'selectedChannelObject2':CHANNEL,
                      'relativeSetupPointer':delta,
                      'conditionalSetupObject2':setup,
                      'paletteTableObject2':ptable,
                      'paletteSlot':2,
                      'paletteRecordObject1Offset':physical-O1,
                      'paletteRecordPhysical':physical,
                      'countedWords':count,
                      'resourceFromPriorO121':source})
    counts=[]
    for i in range(ROWS):
        addr=CHANNEL+4*i
        refs=[(obj,at) for (obj,at),entry in fx.items()
              if entry[0]==7 and entry[2]==2 and entry[3]==addr]
        counts.append({'channel':i,'selectorObject2Offset':addr,
                       'typedIncomingCount':len(refs),
                       'incomingCodeCount':sum(obj==1 for obj,_ in refs),
                       'incomingDataCount':sum(obj==2 for obj,_ in refs)})
    insist([x['typedIncomingCount'] for x in counts]==[48,2,4,3,3,3,3,3],
           'channel-selector incoming reloc counts changed')
    return {'schema':'mk2_spelunk_001_channel_palette_bridge_v1',
            'classification':'VERIFIED_STATIC_CONDITIONAL',
            'canonicalExeSHA256':SHA256,'typedFixupEntries':27004,
            'uniqueFixupSites':26994,'activeChannels':ROWS,
            'sourceInstructionAnchors':source_checks,
            'loopSourcePhysical':0x81bb3,'loopSelectorReadPhysical':0x81bd9,
            'selectedSetupReadPhysical':0x81c53,
            'paletteHandleStorePhysical':0x81ddf,
            'channels':rows,'incomingSelectorReferences':counts,
            'stageScriptBridges':links,
            'runtimeEvidence':{'selectedSetupObserved':False,
                 'paletteHandleObserved':False,'dacStartObserved':False,
                 'framebufferReconstructionObserved':False},
            'notes':['Eight source-aligned rows are traversed before the ninth row; the ninth is not executed by this loop.',
                     'Script/selector/palette provenance is conditional and does not identify live ESI or palette handle.',
                     'Both 79-word families are IMAGES.GRA provenance per independently established O121, not Tomb or Portal stage resource ownership.',
                     'Channel selector addresses are writable Object2 virtual offsets beyond the file-backed Object2 pages. Do not read them as file bytes.']}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('original',type=Path,help='Original MK2.EXE or owner MK2 ZIP')
    parser.add_argument('--out',type=Path,required=True,help='New source-safe metadata JSON')
    args=parser.parse_args()
    insist(not args.out.exists(),'refuse output overwrite')
    b=load_original(args.original)
    result=audit(b)
    with args.out.open('x',encoding='utf-8') as dst:
        json.dump(result,dst,indent=2);dst.write('\n')
    print(json.dumps({'status':result['classification'],
                      'channels':len(result['channels']),
                      'scriptBridges':len(result['stageScriptBridges']),
                      'typedFixups':result['typedFixupEntries']}))
if __name__=='__main__':main()
