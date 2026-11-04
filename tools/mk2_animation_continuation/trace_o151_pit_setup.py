#!/usr/bin/env python3
"""O151 timer hardware setup vs renderer/scheduler timing, original MK2 static evidence only."""
import argparse, hashlib, struct, json
from pathlib import Path
HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
W={
 'readPriorTimerControl':(0x66f46,'e643'),
 'readPriorTimerCounterLow':(0x66f48,'e440'),
 'readPriorTimerCounterHigh':(0x66f50,'e440'),
 'storeReadback':(0x66f54,'a3c45a0700'),
 'interruptsDisabledForSetup':(0x66f59,'fa'),
 'programPITMode3ChannelZero':(0x66f5a,'b036'),
 'outputPITControl':(0x66f5c,'e643'),
 'loadPITDivisor':(0x66f60,'66b89d4d'),
 'sendDivisorLowByte':(0x66f64,'e640'),
 'swapDivisorBytes':(0x66f68,'86c4'),
 'sendDivisorHighByte':(0x66f6a,'e640'),
 'restoreInterruptsAfterSetup':(0x66f6c,'fb'),
 'initializeTaskStorage':(0x66f81,'e833020000'),
 'advanceScheduledTask':(0x67158,'66ff4e06'),
 'loadRuntimeCounterHost':(0x670dd,'8b357c170300'),
 'readRuntimeCounterField':(0x670e3,'8b4624'),
 'resetRuntimeCounterField':(0x67101,'c7462400000000'),
 'loadVGAStatusPort':(0x7b325,'66bada03'),
 'testVGARetrace':(0x7b32a,'a808'),
}
CALL={0x66f81:0x671b9}
def produce(b):
 if len(b)!=861133 or hashlib.sha256(b).hexdigest()!=HASH:raise ValueError('Canonical MK2.EXE required')
 for label,(at,h) in W.items():
  if b[at:at+len(bytes.fromhex(h))]!=bytes.fromhex(h):raise ValueError(f'O151 {label} witness')
 for at,dst in CALL.items():
  if b[at]!=0xe8 or at+5+struct.unpack_from('<i',b,at+1)[0]!=dst:raise ValueError('O151 original call')
 return {'schema':'mk2_o151_pit_divisor_and_distinct_scheduler_inputs_v1','originalSHA256':HASH,
  'witnesses':[{'name':name,'at':f'0x{at:05X}','raw':h} for name,(at,h) in W.items()],
  'calls':[{'at':f'0x{k:05X}','target':f'0x{v:05X}'} for k,v in CALL.items()],
  'pitSetup':{'channel':0,'modeControl':0x36,'divisor':0x4D9D,'divisorDecimal':19869,'controlIOPort':'0x43','dataIOPort':'0x40'},
  'otherTimingPaths':{'vgaRetracePort':'0x3DA','vgaRetraceStatusBit':3,'frameSchedulerObjectPointerGlobal':'0x3177C','schedulerCounterStructField':0x24},
  'limits':{'hardwareTimerProgrammingVerified':True,'PITInterruptProducerToCounterProven':False,'originalClockFrequencyMeasured':False,'runtimeSchedulerHzProven':False,'VGARefreshRateMeasured':False,'animationsFPSProven':False}}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True);ap.add_argument('--out',required=True);a=ap.parse_args()
 dest=Path(a.out)
 if dest.exists():raise ValueError('Refuse overwrite')
 dest.write_text(json.dumps(produce(Path(a.exe).read_bytes()),indent=2)+'\n');print('PASS O151 original PIT setup; scheduler rate still unknown')
if __name__=='__main__':main()
