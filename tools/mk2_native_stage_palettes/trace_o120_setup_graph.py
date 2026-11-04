#!/usr/bin/env python3
"""O120: source-backed MK2 scene palette setup-table provenance, WITHOUT runtime-handle inference.

Uses canonical LE object ownership, typed type-7 fixups, complete setup-record
pointer trio (+6,+A,+E), and the established 0x81DD5 indirect palette request.
Nothing is written to the original EXE. A fixture must be user-supplied.
"""
from __future__ import annotations
import argparse,hashlib,json,struct
from collections import defaultdict
from pathlib import Path

EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
LE=0x28f0c; OBJ1=0x61c54; OBJ2=0xa0c54
# Tuples: source record physical, count, array obj2 offset, setup obj2 offsets,
#         number of contiguous palette-record references in array.
SPECS={
 'tomb80':(0x893c6,80,0x177d0,[0x17358,0x1736a,0x1737c,0x1738e,0x173a0,0x173b2],7),
 'portal80':(0x891e0,80,0x16538,[0x16514,0x16526],9),
 'tomb79':(0x8cdbe,79,0x2e848,[0x2e7e4],9),
 'portal79':(0x8cd1e,79,0x2e784,[0x2e720],9),
}

def u16(b,p):return struct.unpack_from('<H',b,p)[0]
def u32(b,p):return struct.unpack_from('<I',b,p)[0]
def sha(b):return hashlib.sha256(b).hexdigest()
def require(x,s):
 if not x:raise ValueError('O120: '+s)

def fixups(b):
 """Read page-owner boundaries from LE object table, not inferred from source offsets."""
 require(len(b)==861133 and sha(b)==EXE_SHA,'noncanonical executable')
 require(b[LE:LE+2]==b'LE' and u32(b,LE+0x14)==113,'LE header')
 ot=LE+u32(b,LE+0x40);objects=[]
 for ix in range(u32(b,LE+0x44)):
  p=ot+24*ix
  objects.append({'object':ix+1,'virtual':u32(b,p+4), 'startPage':u32(b,p+12),'pages':u32(b,p+16), 'physical':OBJ1 if ix==0 else OBJ2})
 require([(v['startPage'],v['pages']) for v in objects]==[(1,63),(64,50)],'page owners')
 page_off=LE+u32(b,LE+0x68);block=LE+u32(b,LE+0x6c)
 out={};all_count=0
 for page in range(113):
  own=next(o for o in objects if o['startPage']<=page+1<o['startPage']+o['pages'])
  at=block+u32(b,page_off+page*4);end=block+u32(b,page_off+(page+1)*4)
  while at<end:
   k=b[at]&15;flags=b[at+1];relative=struct.unpack_from('<h',b,at+2)[0];at+=4
   require(flags&3==0,'external fixup flags unsupported')
   target_obj=u16(b,at) if flags&64 else b[at];at+=2 if flags&64 else 1
   target=None
   if k!=2:
    target=u32(b,at) if flags&16 else u16(b,at);at+=4 if flags&16 else 2
   if flags&4:at+=4 if flags&32 else 2
   source_off=(page+1-own['startPage'])*4096+relative
   source_file=own['physical']+source_off
   require(0<=source_file<len(b),f'fixup outside file image {source_file:x} page {page} rel {relative} owner {own}')
   key=(own['object'],source_off)
   require(key not in out or (out[key]['kind']==k and out[key]['flags']==flags and out[key]['targetObject']==target_obj and out[key]['targetOffset']==target),f'divergent duplicate fixup source {key}')
   out[key]={'sourceObject':own['object'],'sourceObjectOffset':source_off,
             'sourcePhysical':source_file,'kind':k,'flags':flags,
             'targetObject':target_obj,'targetOffset':target}
   all_count+=1
  require(at==end,'page fixup boundary mismatch')
 require(all_count==27004,'fixup count')
 return out

def main_report(exe):
 fx=fixups(exe)
 def ptr(source_obj,at,obj,target):
  v=fx.get((source_obj,at))
  require(v and v['kind']==7 and v['flags']==16 and v['targetObject']==obj and v['targetOffset']==target,
          f'bad typed pointer {source_obj}:{at:x} to {obj}:{target:x}')
  physical=(OBJ1 if source_obj==1 else OBJ2)+at
  require(u32(exe,physical)==target,'raw DWORD disagrees with LE fixup')
  return physical
 records={}
 for label,(rec,n,table,setups,direct) in SPECS.items():
  require(u16(exe,rec)==n, 'palette source count')
  require(rec>=OBJ1 and rec+2+2*n<=OBJ2,'source record outside object1')
  palette_offset=rec-OBJ1
  direct_refs=[]
  for j in range(direct):
   src=table+4*j
   direct_refs.append({'object2Offset':src,'physical':ptr(2,src,1,palette_offset)})
  if table+4*direct in [v['sourceObjectOffset'] for v in fx.values() if v['sourceObject']==2]:
   require(fx[(2,table+4*direct)]['targetObject']!=1 or fx[(2,table+4*direct)]['targetOffset']!=palette_offset,'table has unexpected additional palette entry')
  setup_data=[]
  for setup in setups:
   width,height,control=struct.unpack_from('<HHH',exe,OBJ2+setup)
   links={}
   for suffix,key in [(6,'controlPointer'),(10,'spritePointer'),(14,'paletteTablePointer')]:
    source=setup+suffix;v=fx.get((2,source))
    require(v and v['kind']==7 and v['flags']==16 and v['targetObject']==2,'setup pointer type')
    target=v['targetOffset']
    ptr(2,source,2,target)
    if suffix==14:require(target==table,'palette pointer setup mismatch')
    links[key]={'object2Offset':target,'sourcePhysical':OBJ2+source}
   inbound=sorted([{'sourceObject':v['sourceObject'],'sourceObjectOffset':v['sourceObjectOffset'],
                     'sourcePhysical':v['sourcePhysical']}
                 for v in fx.values() if v['kind']==7 and v['targetObject']==2 and v['targetOffset']==setup],
                key=lambda x:(x['sourceObject'],x['sourceObjectOffset']))
   setup_data.append({'object2Offset':setup,'physical':OBJ2+setup,'raw18SHA256':sha(exe[OBJ2+setup:OBJ2+setup+18]),
                       'fields':{'widthWord':width,'heightWord':height,'controlWord':control},
                       'links':links,'incomingTypedReferences':inbound})
  outside=sorted([v['sourcePhysical'] for v in fx.values() if v['kind']==7 and v['targetObject']==1 and v['targetOffset']==palette_offset and not(table<=v['sourceObjectOffset']<table+direct*4 and v['sourceObject']==2)])
  records[label]={'recordPhysical':rec,'paletteCount':n,'object1Offset':palette_offset,
     'recordSHA256':sha(exe[rec:rec+2+n*2]),'palettePointerTableObject2':table,
     'consecutivePalettePointerCount':direct,'directTypedPointers':direct_refs,
     'otherTypedPointerPhysical':outside,'setupRecords':setup_data}
 require([len(records[k]['otherTypedPointerPhysical']) for k in SPECS]==[2,3,0,0], 'other ref counts unexpected')
 # Published O96W/O110F ESI+E consumer; authenticate actual instruction bytes.
 require(exe[0x81dd5:0x81de3].hex()=='03560e8b02e85a96ffff66894530','allocator consumer bytes')
 require(exe[0x7b439:0x7b43e].hex()=='53515233db','allocator entry signature')
 for pos,value in ((0x81c4e,'e8c3010000'),(0x81c53,'8b30'),(0x81c63,'66031e'),(0x81c79,'66035e02'),(0x81cba,'663b5e04'),(0x81caa,'8b7e06'),(0x81ce4,'03460a'),(0x81d49,'03460a')):
  require(exe[pos:pos+len(value)//2].hex()==value,'conditional setup read machine bytes at '+hex(pos))
 return {'format':'mk2_o120_typed_stage_palette_setup_graph_v1','status':'PASS_STATIC_STRUCTURE',
  'originalExeSHA256':sha(exe),'fixupsIndependentlyMapped':len(fx),'objectImageBases':{'object1':OBJ1,'object2':OBJ2},
  'records':records,'consumer':{'conditionalRuntimeSetupSelection':{'selectionHelperCallPhysical':0x81c4e,
         'setupLoadFromSelectedObjectPhysical':0x81c53,
         'axisSpan0ReadPhysical':0x81c63,'axisSpan1ReadPhysical':0x81c79,
         'entryCountCheckPhysical':0x81cba,'spriteControlFieldReadPhysical':0x81caa,
         'spriteTableFieldReadPhysical':[0x81ce4,0x81d49],
         'palettePointerFieldReadPhysical':0x81dd5,'observedRuntimeSelectedSetup':False},
  'setupPaletteArrayReadPhysical':0x81dd5,
          'pointerDerefPhysical':0x81dd8,'allocatorCallPhysical':0x81dda,'allocatorPhysical':0x7b439,
          'handleStorePhysical':0x81ddf,'setupFieldOffset':14,'recordType':'u16 colorCount; colorCount*u16 colorWords'},
  'limitations':{'actualRuntimeESISetupBinding':False,'livePaletteHandle':False,
                 'paletteDACStart':False,'sceneCompositorComplete':False,
                 'alternative79RecordsNeverUsed':False,
                 'setupRecordFieldLabelsBeyondVerifiedOffsets':False}}

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 if a.out.exists():raise SystemExit('O120 refuses to overwrite '+str(a.out))
 report=main_report(a.exe.read_bytes());a.out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':report['status'],'verifiedSetups':sum(len(v['setupRecords']) for v in report['records'].values()),'verifiedPointerEntries':sum(v['consecutivePalettePointerCount'] for v in report['records'].values())}))
