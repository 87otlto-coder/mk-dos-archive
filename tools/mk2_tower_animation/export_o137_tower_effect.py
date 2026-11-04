#!/usr/bin/env python3
"""O137: Tower original source sprite sequence + conditional 80-color source palette.

No claims of runtime-selected palette/DAC, FPS, placement or active scene mode.
"""
from __future__ import annotations
import argparse,hashlib,io,json,struct,sys,zipfile
from pathlib import Path
from PIL import Image
LIB=Path(__file__).resolve().parents[1]/'mk2_native_stage_palettes';sys.path.insert(0,str(LIB))
from trace_o120_setup_graph import OBJ1,OBJ2,EXE_SHA,fixups
from trace_o121_control_bindings import resource_pool
from export_o122_indexed_mosaics import decode_stream
from native_stage_palettes import decode_record
GRA_SHA='7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8'
FRAME_BASE=0x16490
PALETTE_RECORD=0x89468
ROOT=0x1783c
SETUP=0x1795c
PALETTE_TABLE=0x17a18

def check(ok,why):
 if not ok:raise ValueError('O137: '+why)
def sha(b):return hashlib.sha256(b).hexdigest()
def u32(b,p):return struct.unpack_from('<I',b,p)[0]

def produce(exe:bytes,gra:bytes):
 check(len(exe)==861133 and sha(exe)==EXE_SHA,'canonical MK2.EXE required')
 check(sha(gra)==GRA_SHA,'canonical TOWER.GRA required')
 check(resource_pool(exe)[30]=='TOWER.GRA','original resource registry changed')
 f=fixups(exe)
 def ptr(obj,at,tobj,target):
  fix=f.get((obj,at))
  check(fix and (fix['kind'],fix['flags'],fix['targetObject'],fix['targetOffset'])==(7,16,tobj,target),
        'typed original relocation not found at '+hex(at))
  check(u32(exe,(OBJ1 if obj==1 else OBJ2)+at)==target,'relocated raw target changed')
 # Original TOWER stage-root callback and initialization path.
 ptr(2,ROOT+0x10,1,0x82e38-OBJ1)
 check(exe[0x82e38:0x82e3f]==bytes.fromhex('833d4c01030000'),'Tower callback mode test')
 check(exe[0x82e54:0x82e5b]==bytes.fromhex('833d4c01030001'),'Tower mode 1 exclusion')
 check(exe[0x82e6c:0x82e72]==bytes.fromhex('c7056c5a0700'),'Tower source-list assignment')
 ptr(1,0x82e72-OBJ1,2,FRAME_BASE)
 check(exe[0x82e76]==0xe8 and 0x82e7b+struct.unpack_from('<i',exe,0x82e77)[0]==0x827df,
       'Tower calls nested animation-object registration helper')
 # Tower-specific 80-color record, connected to a known stage palette setup.
 check(struct.unpack_from('<H',exe,PALETTE_RECORD)[0]==80,'Tower counted palette record')
 check(exe[OBJ2+SETUP+0x0:OBJ2+SETUP+0x6]==struct.pack('<HHH',0x407,0x40,0x2),'Tower palette setup identity')
 ptr(2,SETUP+0x0e,2,PALETTE_TABLE)
 for i in range(7):ptr(2,PALETTE_TABLE+4*i,1,PALETTE_RECORD-OBJ1)
 palette=decode_record(exe,PALETTE_RECORD,80,1)
 frames=[];output={};prev=None
 for i in range(7):
  at=FRAME_BASE+4*i;desc=u32(exe,OBJ2+at);ptr(2,at,2,desc)
  w,h,x,y,packed=struct.unpack_from('<HHhhI',exe,OBJ2+desc)
  rid=packed>>24;start=packed&0xffffff
  check(rid==30,'Tower descriptor must reference resource ID 30')
  decoded=decode_stream(gra,start,w,h)
  check(prev is None or prev==start,'Tower stream offsets noncontiguous');prev=decoded['end']
  check(1<=min(decoded['opaqueIndices']) and max(decoded['opaqueIndices'])<=80,'source indices outside counted candidate palette')
  rgba=bytearray();ix=decoded['indices'];mask=decoded['mask']
  for idx,a in zip(ix,mask):rgba.extend((*palette[idx],255) if a else (0,0,0,0))
  fbuf=io.BytesIO();Image.frombytes('RGBA',(w,h),bytes(rgba)).save(fbuf,format='PNG')
  prefix=f'tower_original_effect/frame_{i:02d}'
  for suffix,content in (('.png',fbuf.getvalue()),('.indices.bin',ix),('.mask.bin',mask)):
   output[prefix+suffix]=content
  frames.append({'frameOrdinal':i,'originalPointerEntryObject2':at,'originalDescriptorObject2':desc,
                 'resourceName':'TOWER.GRA','resourceId':rid,'sourceOffset':start,'sourceEndExclusive':prev,
                 'originalWidth':w,'originalHeight':h,'originalX':x,'originalY':y,
                 'sourceStreamSHA256':sha(gra[start:prev]),
                 'indicesSHA256':sha(ix),'maskSHA256':sha(mask),'rgbaSHA256':sha(bytes(rgba)),
                 'pngSHA256':sha(fbuf.getvalue()),'sourceOpaquePixels':decoded['opaque'],
                 'paths':[prefix+s for s in ('.png','.indices.bin','.mask.bin')]})
 check(u32(exe,OBJ2+FRAME_BASE+28)==1,'Tower original sequence-loop token')
 ptr(2,FRAME_BASE+32,2,FRAME_BASE)
 check(frames[0]['sourceOffset']==0x9f48 and frames[-1]['sourceEndExclusive']==0xdbcc,
       'Tower original stream range')
 report={'schema':'mk2_o137_tower_conditional_original_effect_frames_v1',
   'status':'PASS_TOWER_SOURCE_FRAMES_STATIC_PALETTE_CANDIDATE',
   'originalExeSHA256':EXE_SHA,'originalGRA_SHA256':GRA_SHA,
   'sourceFrameListObject2':FRAME_BASE,'sourceInitCodePhysical':0x82e38,
   'sourceFrameListAssignmentPhysical':0x82e6c,'sourceNestedHelperPhysical':0x827df,
   'modeConditionSourceCode':'SKIPS_INITIALIZATION_WHEN_MODE_0_OR_1',
   'originalSourceFrameCount':len(frames),'palette':{
      'sourceRecordPhysical':PALETTE_RECORD,'originalCount':80,
      'setupObject2':SETUP,'palettePointerTableObject2':PALETTE_TABLE,
      'paletteSourceGraphAuthenticated':True,
      'gameplayPaletteSelectionVerified':False,'paletteDACOrHandleKnown':False,
      'sourceColorIndicesOneBasedConditional':True},
   'originalSequenceControl':{'endMarker':1,'loopBackTo':FRAME_BASE},
   'frames':frames,
   'limits':{'framesOrderedFromOriginalEXE':True,'fullNativeSourceSprites':True,
      'sourcePaletteConditional':True,'liveRoutineExecutionObserved':False,
      'actualFPSKnown':False,'frameDurationsKnown':False,
      'inGameObjectPlacementRecovered':False,'stageParallaxRecovered':False},
   'notes':['Separate Tower sequence, not a Portal resource despite adjacent EXE data layout.',
            'Conditional Tower setup points to a counted 80-color palette; unlike Tomb/Portal, this Tower palette has no O119 gameplay recolor witness.',
            'Source frame pointer array has seven original descriptors, a one-marker and LE relocation-backed return pointer.']}
 return report,output

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True,type=Path);ap.add_argument('--game-zip',type=Path,required=True);ap.add_argument('--out',required=True,type=Path);a=ap.parse_args()
 check(not a.out.exists(),'refusing existing output')
 with zipfile.ZipFile(a.game_zip) as z:
  names=[n for n in z.namelist() if n.lower().endswith('/tower.gra')];check(len(names)==1,'original tower gra')
  source=z.read(names[0])
 report,assets=produce(a.exe.read_bytes(),source)
 a.out.mkdir(parents=True)
 for name,raw in assets.items():
  p=a.out/name;p.parent.mkdir(parents=True,exist_ok=True)
  with p.open('xb') as f:f.write(raw)
 with (a.out/'O137_TOWER_SOURCE_FRAMES.json').open('x') as f:json.dump(report,f,indent=2)
 print('PASS Tower original frames',len(report['frames']),'files',len(assets))
if __name__=='__main__':main()
