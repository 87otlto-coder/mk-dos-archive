#!/usr/bin/env python3
"""O175 source-backed relative breakpoint plan verifier. No runtime addresses guessed."""
import argparse,hashlib,json
from pathlib import Path
H1='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
H2='87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546'
E={'realModeDriverAllocation':(0x62090,'b8da090000'),'originalDriverSharedPtrWrite':(0x6209a,'a37c170300'),'timerHandlerPtrRead':(0x6214e,'a17c170300'),'timerSegmentShift':(0x62155,'c1e804'),'timerOffsetZero':(0x62158,'31db'),'timerVectorNumber':(0x6215d,'b808000000'),'schedulerInputPointer':(0x670dd,'8b357c170300'),'schedulerCounterRead':(0x670e3,'8b4624'),'schedulerCounterZero':(0x67101,'c7462400000000'),'schedulerTaskWord':(0x67158,'66ff4e06'),'rendererStreamRead':(0x86cc5,'8b15785a0700'),'originalConsumerDescriptorWrite':(0x937d3,'895f3c'),'screenPresent':(0x65420,'833d4c01030003')}
D={'timerVectorEntryJump':(0,'e9eb07'),'keyboardVectorEntryJump':(3,'e9af03'),'keyboardScancodePortRead':(0x3c3,'e460'),'timerGateRead':(0x8a8,'f6063c00ff'),'timerTickLowInc':(0x8af,'ff062400'),'timerTickHighOverflowInc':(0x8b5,'ff062600'),'timerOldChainCountdown':(0x939,'fe0eec00')}
def check(exe,driver,r):
 if len(exe)!=861133 or hashlib.sha256(exe).hexdigest()!=H1 or len(driver)!=0x9da or hashlib.sha256(driver).hexdigest()!=H2:raise ValueError('Wrong original inputs')
 if r.get('schema')!='mk2_o175_runtime_capture_relative_watchpoint_contract_v1' or r.get('originalExeSHA256')!=H1 or r.get('originalDriverSHA256')!=H2:raise ValueError('Provenance mismatch')
 for raw,groups in ((exe,E),(driver,D)):
  for label,(pos,h) in groups.items():
   if raw[pos:pos+len(bytes.fromhex(h))]!=bytes.fromhex(h):raise ValueError('Wrong original bytes '+label)
 expected=[{'name':k,'file':'MK2.EXE','physicalFileOffset':p,'object1RelativeOffset':p-0x61c54,'originalBytes':v} for k,(p,v) in E.items()]
 expected.extend([{'name':k,'file':'RM.DRV','originalDriverRelativeOffset':p,'originalBytes':v} for k,(p,v) in D.items()])
 if r.get('watchpoints')!=expected:raise ValueError('Wrong debug breakpoints')
 if r.get('staticProvenance')!={'object1FileImageBase':0x61c54,'object2FileImageBase':0xa0c54,'runtimeLoadedObject1Base':None,'runtimeDriverSegment':None,'sourcePointerGlobalOperand':0x3177c,'originalInterruptVectorNumber':8,'driverRealModeVectorEntryOffset':0,'driverTimerHandlerOffset':0x7ee,'driverKeyboardVectorEntryOffset':3,'driverKeyboardHandlerOffset':0x3b5}:raise ValueError('Unverified loaded mapping inserted')
 if r.get('driverFieldsToSample')!={'tickDword':0x24,'secondTickDword':0x28,'keyboardMode':0x3d,'timerGateByte':0x3c,'AltState':0x88,'PState':0x69,'PPhaseWord':0xe4,'irqChainByte':0xec}:raise ValueError('Wrong shared driver structure')
 if r.get('captureMinimum')!=[
   'record actual IRQ0 vector segment:offset after installation, not on-disk physical file offset',
   'record runtime DPMI Object1 loaded base or translated selector mapping separately',
   'timestamp real IRQ8 entry, gate read, +0x24 writer, +0x24 scheduler read/clear',
   'record task ID +0x06 countdown and selected render-object +0x3C descriptor when changed',
   'record actual presented frame boundary and monotonically measured elapsed wall time',
   'record stage identity, runtime keyboard mode, rendering flags and trace coverage']:raise ValueError('Missing runtime minimum')
 if r.get('limits')!={'runtimeWatchpointAbsoluteAddressesKnown':False,'actualEmulatorTraceCollected':False,'wallClockCalibrationEstablished':False,'perFrameSecondsVerified':False,'rasterFrameOrderObserved':False,'recordedStageObjectPositions':False}:raise ValueError('False claimed runtime trace')
 return len(E)+len(D)+7
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--driver',required=True);p.add_argument('--report',required=True);a=p.parse_args()
 print('PASS O175 independent assertions:',check(Path(a.exe).read_bytes(),Path(a.driver).read_bytes(),json.loads(Path(a.report).read_text())))
