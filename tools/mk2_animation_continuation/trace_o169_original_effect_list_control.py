#!/usr/bin/env python3
"""O169: finite-vs-looping original sprite cursor semantics, *not* timed animation playback."""
import argparse,hashlib,json,struct
from pathlib import Path
HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
BASE=0xa0c54
LISTS=[('tomb_flying_a',0x17814,8,'loop','Tomb'),('tomb_flying_b',0x177ec,8,'loop','Tomb'),
 ('portal_swaying',0x164b4,7,'loop','Portal'),('portal_hanging',0x164d8,7,'finite','Portal'),
 ('portal_electric',0x164f8,6,'finite','Portal'),('tower_original_effect',0x16490,7,'loop','Tower')]
W={'streamLoadCursor':(0x86cc5,'8b15785a0700'), 'loadFirstToken':(0x86ccb,'8b1a'),
 'advanceCursorBy4':(0x86ccd,'8305785a070004'),
 'testPointerLikeBits':(0x86cd4,'f7c30000f0ff'),
 'readLookahead':(0x86d2b,'8b15785a07008b1a'),
 'lookaheadTestPointerLikeBits':(0x86d33,'f7c30000f0ff'),
 'lookaheadTestZero':(0x86d3b,'83fb00'),
 'lookaheadZeroCarries':(0x86d3e,'7412'),
 'lookaheadTestLoopToken':(0x86d40,'83fb01'),
 'lookaheadReadBackPointer':(0x86d46,'8b5204'),
 'lookaheadWriteCursor':(0x86d49,'8915785a0700'),
 'clearCarryReturn':(0x86d50,'f8c3'),
 'setCarryReturn':(0x86d52,'f9c3'),
 'callerCallsCursor':(0x86ca1,'e81f000000'),
 'callerExitsOnCarry':(0x86ca6,'720a'),
 'callerWaitsOnNoncarry':(0x86cab,'e85f04feff')}

def build(b):
 if len(b)!=861133 or hashlib.sha256(b).hexdigest()!=HASH:raise ValueError('Expected original MK2.EXE')
 for label,(at,h) in W.items():
  if b[at:at+len(bytes.fromhex(h))]!=bytes.fromhex(h):raise ValueError('Source mismatch '+label)
 if 0x86ca1+5+struct.unpack_from('<i',b,0x86ca2)[0]!=0x86cc5:raise ValueError('Frame cursor caller incorrect')
 if 0x86ca6+2+struct.unpack_from('<b',b,0x86ca7)[0]!=0x86cb2:raise ValueError('Carry exit wrong')
 out=[];allptr=[]
 for name,loc,n,kind,stage in LISTS:
  at=BASE+loc;ptrs=[struct.unpack_from('<I',b,at+4*i)[0] for i in range(n)];
  if not all(0<p<0x30000 for p in ptrs):raise ValueError('Pointer segment invalid')
  end=at+4*n;endtoken=struct.unpack_from('<I',b,end)[0]
  if kind=='loop':
   if endtoken!=1 or struct.unpack_from('<I',b,end+4)[0]!=loc:raise ValueError('Loop terminator invalid')
  elif endtoken!=0:raise ValueError('Finite terminator invalid')
  out.append({'name':name,'stage':stage,'sourceListObject2':loc,'sourceListPhysical':at,
   'originalDescriptorPointersObject2':ptrs,'frameCount':n,
   'terminalToken':endtoken,'termination':'loop_to_original_list_start' if kind=='loop' else 'zero_marker_carry_exit',
   'terminalPointerObject2':loc if kind=='loop' else None,
   'postDescriptorCursorBehavior':'rewind_to_beginning_on_loop_lookahead' if kind=='loop' else 'caller_exits_on_carry_marker'})
  allptr.extend(ptrs)
 if len(allptr)!=43 or len(set(allptr))!=43:raise ValueError('Original frame count and identities')
 return {'schema':'mk2_o169_original_effect_list_loop_and_carry_semantics_v1',
  'originalExeSHA256':HASH,'originalExeLength':len(b),
  'witnesses':[{'label':k,'physicalOffset':f'0x{at:X}','originalBytes':h} for k,(at,h) in W.items()],
  'originalExeObject2FileBase':BASE,'tracks':out,'distinctDescriptorCount':len(set(allptr)),
  'sourceMechanism':{'cursorGlobalAddressOperand':0x75a78,'sentinelLoopToken':1,'sentinelStopToken':0,
   'callSite':0x86ca1,'streamReader':0x86cc5,'postReaderStopFlag':'carry',
   'carryExitDestination':0x86cb2,'noncarryTaskYieldCall':0x86cab},
  'limits':{'sourceLoopTerminationVerified':True,'loopIterationTimeMeasured':False,
   'liveObjectActivationObserved':False,'allEffectsActiveAtOnceProven':False,
   'renderedFPSProven':False,'runtimeFramePlacementProven':False}}
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True);ap.add_argument('--out',required=True);a=ap.parse_args()
 p=Path(a.out)
 if p.exists():raise ValueError('Refuse overwrite')
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(build(Path(a.exe).read_bytes()),indent=2)+'\n')
 print('PASS O169 original source sprite list cursor loops/carry semantics (no FPS)')
