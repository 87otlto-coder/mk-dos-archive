#!/usr/bin/env python3
"""O175: derive correct *relative* debugging loci from ORIGINAL MK2 and RM.DRV.
No absolute emulator addresses, no sampled FPS, no execution/capture claimed.
"""
import argparse,hashlib,json
from pathlib import Path
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
DH='87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546'
O1=0x61c54; O2=0xa0c54
EXE={
 'realModeDriverAllocation':(0x62090,'b8da090000'),
 'originalDriverSharedPtrWrite':(0x6209a,'a37c170300'),
 'timerHandlerPtrRead':(0x6214e,'a17c170300'),
 'timerSegmentShift':(0x62155,'c1e804'),
 'timerOffsetZero':(0x62158,'31db'),
 'timerVectorNumber':(0x6215d,'b808000000'),
 'schedulerInputPointer':(0x670dd,'8b357c170300'),
 'schedulerCounterRead':(0x670e3,'8b4624'),
 'schedulerCounterZero':(0x67101,'c7462400000000'),
 'schedulerTaskWord':(0x67158,'66ff4e06'),
 'rendererStreamRead':(0x86cc5,'8b15785a0700'),
 'originalConsumerDescriptorWrite':(0x937d3,'895f3c'),
 'screenPresent':(0x65420,'833d4c01030003'),
}
DRV={
 'timerVectorEntryJump':(0,'e9eb07'),
 'keyboardVectorEntryJump':(3,'e9af03'),
 'keyboardScancodePortRead':(0x3c3,'e460'),
 'timerGateRead':(0x8a8,'f6063c00ff'),
 'timerTickLowInc':(0x8af,'ff062400'),
 'timerTickHighOverflowInc':(0x8b5,'ff062600'),
 'timerOldChainCountdown':(0x939,'fe0eec00'),
}

def make(e,d):
 if len(e)!=861133 or hashlib.sha256(e).hexdigest()!=EH:raise ValueError('Unexpected original MK2.EXE')
 if len(d)!=2522 or hashlib.sha256(d).hexdigest()!=DH:raise ValueError('Unexpected original RM.DRV')
 for b,table in ((e,EXE),(d,DRV)):
  for label,(p,s) in table.items():
   if b[p:p+len(bytes.fromhex(s))]!=bytes.fromhex(s):raise ValueError('Source changed '+label)
 return {'schema':'mk2_o175_runtime_capture_relative_watchpoint_contract_v1',
  'originalExeSHA256':EH,'originalDriverSHA256':DH,
  'staticProvenance':{'object1FileImageBase':O1,'object2FileImageBase':O2,
   'runtimeLoadedObject1Base':None,'runtimeDriverSegment':None,
   'sourcePointerGlobalOperand':0x3177c,'originalInterruptVectorNumber':8,
   'driverRealModeVectorEntryOffset':0,'driverTimerHandlerOffset':0x7ee,
   'driverKeyboardVectorEntryOffset':3,'driverKeyboardHandlerOffset':0x3b5},
  'watchpoints':[
   {'name':name,'file':'MK2.EXE','physicalFileOffset':pos,'object1RelativeOffset':pos-O1,'originalBytes':code}
   for name,(pos,code) in EXE.items()]+[
   {'name':name,'file':'RM.DRV','originalDriverRelativeOffset':pos,'originalBytes':code}
   for name,(pos,code) in DRV.items()],
  'driverFieldsToSample':{'tickDword':0x24,'secondTickDword':0x28,'keyboardMode':0x3d,
   'timerGateByte':0x3c,'AltState':0x88,'PState':0x69,'PPhaseWord':0xe4,'irqChainByte':0xec},
  'captureMinimum':[
   'record actual IRQ0 vector segment:offset after installation, not on-disk physical file offset',
   'record runtime DPMI Object1 loaded base or translated selector mapping separately',
   'timestamp real IRQ8 entry, gate read, +0x24 writer, +0x24 scheduler read/clear',
   'record task ID +0x06 countdown and selected render-object +0x3C descriptor when changed',
   'record actual presented frame boundary and monotonically measured elapsed wall time',
   'record stage identity, runtime keyboard mode, rendering flags and trace coverage'],
  'limits':{'runtimeWatchpointAbsoluteAddressesKnown':False,'actualEmulatorTraceCollected':False,
   'wallClockCalibrationEstablished':False,'perFrameSecondsVerified':False,
   'rasterFrameOrderObserved':False,'recordedStageObjectPositions':False}}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--driver',required=True);p.add_argument('--out',required=True);a=p.parse_args();out=Path(a.out)
 if out.exists():raise ValueError('Refuse overwrite')
 r=make(Path(a.exe).read_bytes(),Path(a.driver).read_bytes());out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(r,indent=2)+'\n')
 print('PASS O175 original watchpoint offset preflight; actual runtime load addresses and timing unverified')
