#!/usr/bin/env python3
"""Second independent bytecode/mode/no-FPS audit for O151."""
import argparse,hashlib,json,struct
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
OFFSETS=[0x66f46,0x66f48,0x66f50,0x66f54,0x66f59,0x66f5a,0x66f5c,0x66f60,0x66f64,0x66f68,0x66f6a,0x66f6c,0x66f81,0x67158,0x670dd,0x670e3,0x67101,0x7b325,0x7b32a]
FUND={0x66f5a:'b036',0x66f5c:'e643',0x66f60:'66b89d4d',0x66f64:'e640',0x66f68:'86c4',0x66f6a:'e640',0x67101:'c7462400000000',0x7b325:'66bada03',0x7b32a:'a808'}
LIMIT={'hardwareTimerProgrammingVerified':True,'PITInterruptProducerToCounterProven':False,'originalClockFrequencyMeasured':False,'runtimeSchedulerHzProven':False,'VGARefreshRateMeasured':False,'animationsFPSProven':False}
def check(b,r):
 if len(b)!=861133 or hashlib.sha256(b).hexdigest()!=SHA:raise ValueError('Wrong canonical EXE')
 if r.get('schema')!='mk2_o151_pit_divisor_and_distinct_scheduler_inputs_v1' or r.get('originalSHA256')!=SHA:raise ValueError('Wrong provenance')
 if r.get('limits')!=LIMIT:raise ValueError('False timing claims')
 ws=r.get('witnesses',[])
 if len(ws)!=len(OFFSETS):raise ValueError('Witness cardinality')
 observed={}
 for x in ws:
  at=int(x['at'],16); raw=bytes.fromhex(x['raw'])
  if at in observed or not raw or b[at:at+len(raw)]!=raw:raise ValueError('Tampered witness')
  observed[at]=x['raw'].lower()
 if set(observed)!=set(OFFSETS):raise ValueError('Missing/extra original instruction')
 for at,h in FUND.items():
  if observed[at]!=h:raise ValueError('Invalid independently derived PIT or VGA source')
 if r.get('pitSetup')!={'channel':0,'modeControl':0x36,'divisor':0x4d9d,'divisorDecimal':19869,'controlIOPort':'0x43','dataIOPort':'0x40'}:raise ValueError('False PIT spec')
 if r.get('otherTimingPaths')!={'vgaRetracePort':'0x3DA','vgaRetraceStatusBit':3,'frameSchedulerObjectPointerGlobal':'0x3177C','schedulerCounterStructField':0x24}:raise ValueError('False scheduler and VGA distinction')
 calls=r.get('calls')
 if calls!=[{'at':'0x66F81','target':'0x671B9'}]:raise ValueError('Missing original task constructor')
 at=0x66f81
 if b[at]!=0xe8 or at+5+struct.unpack_from('<i',b,at+1)[0]!=0x671b9:raise ValueError('Invalid task initializer call')
 return len(OFFSETS)+len(FUND)+len(LIMIT)+10
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True);a.add_argument('--report',required=True);v=a.parse_args()
 print('PASS O151 independent source checks:',check(Path(v.exe).read_bytes(),json.loads(Path(v.report).read_text())))
