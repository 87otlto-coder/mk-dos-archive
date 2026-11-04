#!/usr/bin/env python3
"""O131: source-authenticated argument semantics for MK2's stage packed-row renderer.

No live game state is available: the first -1 argument points to mutable emulated
memory beyond the file-backed Object-2 image. Mathematical examples are not observations.
"""
from __future__ import annotations
import argparse, hashlib, json, struct
from pathlib import Path
from trace_o120_setup_graph import EXE_SHA, OBJ2, fixups, require
from trace_o130_dynamic_stage_streams import produce as o130

SOURCES={
  1:('TOMB.GRA',28,63776,48), 2:('BATTLE.GRA',34,59436,40),
  3:('TOWER.GRA',30,56268,64), 4:('FOREST.GRA',27,198116,32),
  5:('ARMORY.GRA',26,126336,56), 7:('PORTAL.GRA',25,56916,40),
  8:('ARENA.GRA',31,90488,40),
}
PINS={
  0x9356e:'8b3183c1048b368b3983c1048b1983c104890d985a0700',
  0x93585:'e88eab0000',
  0x9e118:'f705d4620500010000007473',
  0x9e124:'c7057374070000000000',
  0x9e12e:'c7057774070000000000',
  0x9e138:'8bcb81e6ffff00008bc62d200100007412f7d8c1e01099bb70000000f7fb',
  0x9e156:'a373740700',
  0x9e15b:'a1685a0700c1f8102bf8',
  0x9e165:'a17f74070003348554ef0200',
  0x9e171:'8bc781ffc8000000731c03c13dc80000007207b9c80000002bcf',
  0x9e18b:'b80100000055e83078fcff5d',
  0x659c6:'67e3738bdec1eb188d2cdd00000000c1e3048b9c2b34f4020081e6ffffff0003f3',
  0x659ea:'8a04c5065b07004825ff0000008b148584100000',
  0x65a0f:'b950000000ad03c2abe2faa177740700030573740700a377740700c1f81081c5800300008bf52bf04b75d5',
}

def sha(b):return hashlib.sha256(b).hexdigest()
def u32(b,at):return struct.unpack_from('<I',b,at)[0]
def trunc_div(a,b):
  if not (type(a)==int and type(b)==int and b>0):raise ValueError('signed numerator and positive integer divisor required')
  return (1 if a>=0 else -1)*(abs(a)//b)
def signed32(x):return (x&0xffffffff)-(0x100000000 if x&0x80000000 else 0)
def hypothetical_geometry(start_y,requested_rows,*,vertical_scroll_fixed=0,camera_low16=288):
  """Pure 32-bit instruction model. vertical_scroll_fixed == global 0x75A68.

  The camera word is [firstPointer] & 0xffff; not a verified camera coordinate.
  Only examples using bounded, unambiguous inputs are supported by this helper.
  """
  if not (type(start_y)==int and type(requested_rows)==int and 0<=start_y<0x10000 and 0<=requested_rows<0x10000):raise ValueError('raw command scalars out of range')
  if not (type(camera_low16)==int and 0<=camera_low16<=0xffff):raise ValueError('camera input not 16-bit')
  if not (type(vertical_scroll_fixed)==int and -0x80000000<=vertical_scroll_fixed<=0x7fffffff):raise ValueError('vertical scroll not signed 32-bit')
  shift=vertical_scroll_fixed>>16
  dest=(start_y-shift)&0xffffffff
  draw=0 if dest>=200 else min(requested_rows,200-dest)
  step=trunc_div((288-camera_low16)*65536,112)
  acc=0;source_row_shifts=[]
  for _ in range(draw):
    source_row_shifts.append(signed32(acc)>>16)
    acc=(acc+step)&0xffffffff
  return {'drawStartY':dest if dest<200 else None,'effectiveRows':draw,
          'clipped':draw!=requested_rows,'verticalAdjustmentSignedPixels':shift,
          'cameraLow16Hypothesis':camera_low16,'rowStep16_16':step,
          'sourceRowShiftPixels':source_row_shifts}

def produce(exe):
  require(len(exe)==861133 and sha(exe)==EXE_SHA,'canonical original MK2.EXE')
  for at,bytesig in PINS.items():require(exe[at:at+len(bytesig)//2].hex()==bytesig,'opcode anchor '+hex(at))
  fx=fixups(exe)
  for physical,target in [(0x93581,0x75a98),(0x9e11a,0x562d4),(0x9e126,0x77473),
                          (0x9e130,0x77477),(0x9e157,0x77473),(0x9e15c,0x75a68),
                          (0x9e166,0x7747f),(0x9e16d,0x2ef54),
                          (0x659db,0x2f434),(0x659ed,0x75b06),(0x65a01,0x357e4),
                          (0x65a07,0x7662a),(0x65a1b,0x77477),(0x65a21,0x77473),(0x65a26,0x77477)]:
    r=fx.get((1,physical-0x61c54))
    require(r is not None and (r['kind'],r['flags'],r['targetObject'],r['targetOffset'])==(7,16,2,target),'LE relocated operand '+hex(physical))
  prior=o130(exe)
  stages=[]
  for item in prior['firstTenConfigurationSummary']:
    i=item['configurationIndex']
    if i not in SOURCES:continue
    name,rid,source_start,source_rows=SOURCES[i]
    require(item['resourceName']==name and item['resourceID']==rid and item['drawCount']==1,'stage+command authenticated')
    cmd=item['drawCommands'][0]
    p=cmd['sourcePointerObject2']
    require(p in (0x84312,0x8432a),'first parameter points to expected runtime storage')
    require(p>len(exe)-OBJ2,'runtime first pointer is NOT file-backed Object2 data')
    word=u32(exe,OBJ2+0x2ef54+i*4)
    require((word>>24,word&0xffffff)==(rid,source_start),'renderer packed entry matches authenticated O111 source suffix')
    base=OBJ2+0x2f434+rid*24
    require(u32(exe,base)==0,'packed resource mapping base zero in original EXE')
    raw_y=cmd['rawParameter2'];requested=cmd['rawParameter3']
    require(0<raw_y<200 and 0<requested<=200 and raw_y+requested>200,'all seven source commands exercise clipping at zero scroll')
    g=hypothetical_geometry(raw_y,requested)
    stages.append({'stageIndex':i,'resourceName':name,'resourceID':rid,
      'controlStreamObject2':item['streamObject2'],'commandObject2':cmd['object2Offset'],
      'sourceRuntimePointerObject2':p,'sourcePointerFileBacked':False,
      'packedSourceDWORD':word,'packedSuffixStart':source_start,'sourceRowsInOriginalResource':source_rows,
      'rawDestinationY':raw_y,'requestedRows':requested,'zeroScrollIllustration':{
        'startY':g['drawStartY'],'visibleRows':g['effectiveRows'],'endExclusiveY':raw_y+g['effectiveRows'],
        'requestedEndExclusiveY':raw_y+requested,'sourceCameraWordAssumed':288},
      'liveDestinationYKnown':False,'liveSourceCameraWordKnown':False})
  require([s['stageIndex'] for s in stages]==[1,2,3,4,5,7,8],'full supported stage families')
  return {'schema':'mk2_o131_guarded_stage_floor_geometry_static_v1',
    'status':'PASS_SOURCE_AUTHENTICATED_RENDERER_ROW_GEOMETRY',
    'canonicalExeSHA256':EXE_SHA,'originalRelocationCount':len(fx),
    'renderer':{'controlInterpreterPhysical':0x9356e,'gatePhysical':0x9e118,
      'verticalAdjustmentGlobalObject2':0x75a68,'drawStartYCalculationPhysical':0x9e15b,
      'requestedRowCountPhysical':0x9e138,'clipGuardPhysical':0x9e173,'displayHeight':200,
      'packedStageTableObject2':0x2ef54,'stageIndexGlobalObject2':0x7747f,
      'packedRowConsumerPhysical':0x659c6,'rowSourceStride':896,'rowWidthBytes':320,
      'cameraWordMask':0xffff,'cameraReferenceWord':288,'cameraNormalizationDivisor':112,
      'rowStepAccumulation16_16Physical':0x65a1a,'stagePaletteHandleKnown':False,
      'firstPointerIsOriginalObject2FileBacked':False,
      'semantics':'rawDestinationY minus signed high16(global 0x75A68); rows from third command DWORD clipped at 200; source offset from runtime pointer + packed table; 896-byte rows; camera-derived signed fixed-point per-row correction'},
    'stages':stages,'limitations':[
      'All visible row-count figures assume a zero vertical adjustment and are NOT gameplay measurements.',
      'The first draw-command pointer targets mutable emulated Object-2 storage beyond the original EXE file-backed data; its live DWORD was not captured.',
      'The two numeric command parameters are provably used for destination-row and requested transfer-row calculations; this does not identify a game camera or stage-object owner.',
      'The clip test is an unsigned comparison; a negative wrapped destination can suppress drawing.',
      'Source data operations are 32-bit adds (with carries) and 16.16 stepping; do not simplify to independent byte addition or fractional resampling.',
      'Other renderer activation/ordering, actual mode, flag, palette allocation handle, and VGA output remain unmeasured.']}

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 if a.out.exists():raise SystemExit('refusing to overwrite '+str(a.out))
 r=produce(a.exe.read_bytes());a.out.write_text(json.dumps(r,indent=2)+'\n')
 print(json.dumps({'status':r['status'],'stages':len(r['stages']),'zeroScrollVisibleRows':{s['resourceName']:s['zeroScrollIllustration']['visibleRows'] for s in r['stages']}}))
