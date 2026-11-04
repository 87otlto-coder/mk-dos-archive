#!/usr/bin/env python3
"""O157/O158 code-backed interrupt-vector join; original DOS MK2 only, NO tick-rate claim."""
import argparse,hashlib,json,struct
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
# Each source call is an original rel32 CALL, not loaded debugger address.
SAVE=[(0x620f3,8,0x620f8),(0x62108,9,0x6210d),(0x62112,0x23,0x62121),(0x62126,0x1b,0x62135),(0x6213a,0x24,0x62149)]
INSTALL=[(0x6214e,8,0,0x62162),(0x62167,9,3,0x6217e),(0x62183,0x24,7,0x6219a),(0x6219f,0x23,6,0x621b6),(0x621bb,0x1b,6,0x621d2)]
W={
 'getRealModeVectorFunction':(0x61f0d,'ba00020000'),
 'getDPMIInterrupt':(0x61f12,'b831000000'),
 'getCallDPMI':(0x61f1e,'e867c60300'),
 'getReturnVectorLow':(0x61f23,'8b442408'),
 'getReturnVectorHigh':(0x61f2a,'8b44240c'),
 'setRealModeVectorFunction':(0x61f45,'b901020000'),
 'setDPMIInterrupt':(0x61f5b,'b831000000'),
 'setCallDPMI':(0x61f63,'e822c60300'),
 'allocationRequest':(0x62090,'b8da090000'),
 'allocationCall':(0x62095,'e892fdffff'),
 'allocationStore':(0x6209a,'a37c170300'),
 'getOldTimerVector':(0x620f3,'b808000000'),
 'getOldKeyboardVector':(0x62108,'b809000000'),
 'getOldCtrlBreakVector':(0x62126,'b81b000000'),
 'getOldCriticalErrorVector':(0x6213a,'b824000000'),
 'setTimerPointerLoad':(0x6214e,'a17c170300'),
 'setTimerSegmentHigh':(0x62155,'c1e804'),
 'setTimerOffsetZero':(0x62158,'31db'),
 'setTimerSegmentLow':(0x6215a,'6689c2'),
 'setTimerVectorNumber':(0x6215d,'b808000000'),
 'setKeyboardOffsetThree':(0x62171,'bb03000000'),
 'setCriticalErrorOffsetSeven':(0x6218d,'bb07000000'),
 'setBreakOffsetSix':(0x621a9,'bb06000000'),
 'setCtrlBreakOffsetSix':(0x621c5,'bb06000000'),
 'mainLoopEntry':(0x62205,'e8eb4b0000'),
 'pitSetupCall':(0x66e01,'e834010000'),
 'pitDivisor':(0x66f60,'66b89d4d'),
 'taskCounterSource':(0x670dd,'8b357c170300'),
 'taskCounterRead':(0x670e3,'8b4624'),
 'taskCounterClear':(0x67101,'c7462400000000')}
def rel(b,p):
 if b[p]!=0xe8:raise ValueError(f'Invalid CALL {p:#x}')
 return p+5+struct.unpack_from('<i',b,p+1)[0]
def analyze(b):
 if len(b)!=861133 or hashlib.sha256(b).hexdigest()!=SHA:raise ValueError('Original MK2.EXE only')
 for n,(p,h) in W.items():
  if b[p:p+len(bytes.fromhex(h))]!=bytes.fromhex(h):raise ValueError(f'Unexpected source bytes for {n}')
 for _,_,p in SAVE:
  if rel(b,p)!=0x61f00:raise ValueError('Vector-save call mismatch')
 for _,_,_,p in INSTALL:
  if rel(b,p)!=0x61f38:raise ValueError('Vector-install call mismatch')
 for p,t in [(0x61f1e,0x9e58a),(0x61f63,0x9e58a),(0x62095,0x61e2c),(0x62205,0x66df5),(0x66e01,0x66f3a)]:
  if rel(b,p)!=t:raise ValueError('Original DPMI/input/frame chain mismatch')
 for p,n,_ in SAVE:
  if struct.unpack_from('<I',b,p+1)[0]!=n:raise ValueError('Wrong saved vector number')
 for p,n,offset,_ in INSTALL:
  if b[p:p+5]!=bytes.fromhex('a17c170300') or b[p+5:p+9]!=bytes.fromhex('31d2c1e8')[:4]:
   raise ValueError('Installed shared pointer not proved')
  # Offset is verified using bounded nearby exact bytes for every install below.
  offs_bytes={0:bytes.fromhex('31db'),3:bytes.fromhex('bb03000000'),6:bytes.fromhex('bb06000000'),7:bytes.fromhex('bb07000000')}
  subsection=b[p:p+34]
  if offs_bytes[offset] not in subsection:raise ValueError('Installed offset missing')
  if bytes((0xb8,n,0,0,0)) not in subsection:raise ValueError('Installed vector number missing')
 r157={'schema':'mk2_o157_real_mode_vector_snapshot_and_installer_v1','originalExeSHA256':SHA,
  'sourceAnchors':[{'name':k,'physical':f'0x{p:05X}','bytes':h} for k,(p,h) in W.items()],
  'savedVectors':[{'vector':n,'callAtPhysical':f'0x{call:05X}','getVectorHelperPhysical':'0x61F00'} for _,n,call in SAVE],
  'installedVectors':[{'vector':n,'handlerOffset':offset,'callAtPhysical':f'0x{call:05X}','setterHelperPhysical':'0x61F38','segmentExpression':'low16((pointerGlobal0x3177C >>> 4))'} for _,n,offset,call in INSTALL],
  'helperFunctions':{'getRealModeVectorDPMI':0x200,'setRealModeVectorDPMI':0x201,'wrappedInterrupt':0x31},
  'limits':{'sourceVectorGetSetCallsVerified':True,'vector08TimerCandidateSourceLinked':True,'originalIRQHandlerInstructionsDecoded':False,'liveInterruptDeliveryObserved':False,'counterFieldWriterEstablished':False}}
 r158={'schema':'mk2_o158_original_timer_vector_pit_scheduler_static_join_v1','originalExeSHA256':SHA,
  'sourceAnchors':[{'name':k,'physical':f'0x{p:05X}','bytes':h} for k,(p,h) in W.items()],
  'join':{'allocatedSharedInputPointerObject2':0x3177c,'allocatedInputBytes':0x9da,
   'realModeTimerVector':8,'installedHandlerOffset':0,'originalTimerInitPhysical':0x66f3a,
   'PITDivisor':0x4d9d,'schedulerCounterStructOffset':0x24,
   'frameDriverPollPhysical':0x670dd,'mainLoopPhysical':0x66df5},
  'sourceFacts':['The same input pointer is used to install vector 08 and by the later game-code scheduler for +0x24 polling',
   'The game loop invokes 0x66F3A, which programs PIT channel zero, after the source startup installs interrupt vectors',
   'This makes vector 08 the priority live instrument target, not a verified source-level writer of +0x24'],
  'limits':{'timerVectorAndInputStructureSourceJoined':True,'PITIRQ8ToCounterFieldDataflowProven':False,'actualPITTickFrequencyCaptured':False,'animationFPSEstablished':False}}
 return {'O157':r157,'O158':r158}
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True);a.add_argument('--outdir',required=True);v=a.parse_args();out=Path(v.outdir)
 if out.exists():raise ValueError('Refuse overwrite')
 r=analyze(Path(v.exe).read_bytes());out.mkdir(parents=True)
 for k,data in r.items():(out/f'{k}_REPORT.json').write_text(json.dumps(data,indent=2)+'\n')
 print('PASS O157-O158 original real-mode vector and PIT join; actual IRQ delivery/FPS unresolved')
