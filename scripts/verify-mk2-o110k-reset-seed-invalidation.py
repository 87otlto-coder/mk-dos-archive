#!/usr/bin/env python3
"""Independent source-byte verifier of O110K nested reset/seed report."""
import hashlib,json,struct,sys
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
EXPECTED=[(0x779ea,0x64695),(0x64695,0x64659),(0x64659,0x7b41f),
 (0x6466a,0x7b439),(0x6466f,0x81b18),(0x66d51,0x7b41f),
 (0x66d76,0x81b18),(0x779f4,0x7b439)]

def verify(b,parent,report):
 count=0
 def check(condition,detail):
  nonlocal count
  assert condition,detail;count+=1
 check(hashlib.sha256(b).hexdigest()==SHA,'original fixture hash')
 check(report['format']=='mk2_o110k_nested_reset_seed_invalidation_v1','format')
 check(report['status']=='PASS_STATIC_CONTROL_PATH','status')
 check(report['exeSHA256']==SHA,'report original hash')
 check(report['parentO110HSHA256']==hashlib.sha256(parent).hexdigest(),'parent evidence digest')
 previous=json.loads(parent)
 check(previous['format']=='mk2_o110h_palette_handle_lifecycle_v1','parent identity')
 check(previous['entryTable']['resetTotalBytes']==480,'reset bytes')
 check(len(report['calls'])==len(EXPECTED),'calls count')
 for record,(at,target) in zip(report['calls'],EXPECTED):
  check(record['at']==at and record['target']==target,'reported call address')
  check(b[at]==0xe8,'call opcode')
  check(at+5+struct.unpack_from('<i',b,at+1)[0]==target,'call rel32 target')
  check(record['encoding']==b[at:at+5].hex(),'call raw hex')
 check(len(report['jumps'])==2,'jump count')
 for record, (at,target) in zip(report['jumps'],[(0x64680,0x66d04),(0x646a1,0x6728b)]):
  check(record['at']==at and record['target']==target,'jump address')
  check(b[at]==0xe9 and at+5+struct.unpack_from('<i',b,at+1)[0]==target,'exact destination')
  check(record['encoding']==b[at:at+5].hex(),'jump encoding')
 witness={0x64665:'b8c46c0200',0x779ef:'b8c46c0200',
  0x7b427:'bf005b0700b97800000033c0f3ab',
  0x64659:'e8c16d0100c6053666070001b8c46c0200e8ca6d0100',
  0x66d51:'e8c9460100b801000000a3da620700',
  0x779f4:'e8403a0000e89bc5feff',0x66de4:'c3'}
 check(len(report['witnesses'])==len(witness),'witness count')
 for rec in report['witnesses']:
  at=rec['at'];expected=witness.get(at)
  check(expected is not None and rec['hex']==expected,'witness anchored')
  check(b[at:at+len(expected)//2].hex()==expected,'witness exact bytes')
 check(b[0x7b427:0x7b438].hex().startswith('bf005b0700b97800000033c0f3ab'),'clear 120 dwords')
 result=report['conditionalConclusion']
 check(result['nestedSetupReachesPreSeedRequest'] is True,'preseed')
 check(result['laterResetClearsEarlierSeedHandleState'] is True,'second reset')
 for key in ('initialSeedGuaranteedLiveAtIndex6SecondRequest','secondRequestGuaranteedHandleIndexOne',
             'allInterveningHelperSideEffectsKnown','runtimeStageActivationObserved'):
  check(result[key] is False,'no overstatement: '+key)
 check(len(report['timeline'])==5 and len(report['limits'])==3,'bounded claims')
 return count
if __name__=='__main__':
 if len(sys.argv)!=4:raise SystemExit('usage: verifier <mk2-dir> <O110H-json> <O110K-json>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes();prior=Path(sys.argv[2]).read_bytes();r=json.loads(Path(sys.argv[3]).read_text())
 print(json.dumps({'status':'PASS','pass':'O110K','checks':verify(b,prior,r),'failures':0}))
