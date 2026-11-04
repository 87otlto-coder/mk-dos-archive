#!/usr/bin/env python3
"""Separately implemented O166–O168 independent witness and fail-closed report verifier."""
import argparse,hashlib,json,struct
from pathlib import Path
EXE_HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
DRV_HASH='87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546'
# Independent byte identities, keyed on address. This checker imports nothing from the producer.
KEYS_DRV={0x3c3:'e460',0x3d9:'83e37f',0x3dc:'c687500080',0x3e5:'c687500040',
 0x80e:'f6065100ff',0x813:'7407',0x815:'7805',0x817:'c6063a00ff',
 0x81c:'f6068800ff',0x821:'0f848300',0x825:'0f887f00',
 0x829:'f6066000ff',0x82e:'7407',0x830:'7805',0x832:'c6063b00ff',
 0x837:'f6066900ff',0x83c:'741c',0x83e:'781a',0x840:'ff06e400',0x846:'80363c00ff',0x85a:'c706e400ffff',
 0x860:'f6068200ff',0x869:'ff06e600',0x86f:'8036ea00ff',0x886:'c706e600ffff',
 0x88c:'f6066f00ff',0x895:'ff06e800',0x89b:'8036eb00ff',0x8a2:'c706e800ffff',0x8a8:'f6063c00ff'}
KEYS_EXE={0x66eef:'f6403bff',0x66ef3:'0f8425ffffff',0x66ef9:'e8c9e3ffff',
 0x66ee3:'f6403cff',0x70a47:'f6403aff',0x74e6c:'f6403aff',0x66ecb:'f6403dff'}
CHAIN_DRV={0xec:'02',0:'e9eb07',0x8af:'ff062400',0x8b5:'ff062600',0x8b9:'ff062800',
 0x939:'fe0eec00',0x93d:'7914',0x93f:'c606ec0002',0x94e:'2eff2e0c00',0x953:'b060',0x955:'e620',0x961:'cf'}
CHAIN_EXE={0x66f5a:'b036',0x66f5c:'e643',0x66f60:'66b89d4d',0x66f64:'e640',0x66f6a:'e640'}
SCHED_EXE={0x67050:'8335d462050001',0x670dd:'8b357c170300',0x670e3:'8b4624',
 0x670e6:'85c0',0x670e8:'74f3',0x670ea:'a30c5b0300',0x670ef:'d1e0',
 0x670f1:'8b1d105b0300',0x670f7:'03d8',0x670f9:'d1eb',0x670fb:'891d105b0300',
 0x67101:'c7462400000000',0x67108:'be045b0300',0x67152:'8b36',
 0x67158:'66ff4e06',0x6715c:'7ff4',0x67182:'8b7e18',0x67185:'ff661c',0x67110:'66894606'}

def table_verify(raw,records,expected):
 if len(records)!=len(expected):raise ValueError('Missing/extra original witnesses')
 seen=set()
 for w in records:
  p=int(w['physicalOffset'],16)
  if p in seen or p not in expected or w.get('originalBytes')!=expected[p]:raise ValueError('Bogus/duplicate source byte witness')
  needle=bytes.fromhex(expected[p]);
  if raw[p:p+len(needle)]!=needle:raise ValueError('Original byte differs')
  seen.add(p)
 if seen!=set(expected):raise ValueError('Incomplete coverage')
 return len(seen)

def check(exe,drv,reports):
 if len(exe)!=861133 or hashlib.sha256(exe).hexdigest()!=EXE_HASH:raise ValueError('Unrecognized executable')
 if len(drv)!=2522 or hashlib.sha256(drv).hexdigest()!=DRV_HASH:raise ValueError('Unrecognized real-mode driver')
 count=0
 for name in ('O166','O167','O168'):
  r=reports[name]
  if r.get('schema')!={'O166':'mk2_o166_irq8_hotkey_matrix_and_protected_flag_consumers_v1','O167':'mk2_o167_irq0_chain_counter_and_pit_divisor_static_v1','O168':'mk2_o168_sampled_irq_ticks_are_not_task_countdown_units_v1'}[name]:raise ValueError('Wrong report schema')
  if r.get('originalExeSHA256')!=EXE_HASH or r.get('originalDriverSHA256')!=DRV_HASH or r.get('verificationScope')!='static canonical source bytes only':raise ValueError('Spoofed provenance')
  if name=='O166':count+=table_verify(drv,r['driverWitnesses'],KEYS_DRV)+table_verify(exe,r['exeWitnesses'],KEYS_EXE)
  if name=='O167':count+=table_verify(drv,r['driverWitnesses'],CHAIN_DRV)+table_verify(exe,r['exeWitnesses'],CHAIN_EXE)
  if name=='O168':count+=table_verify(exe,r['exeWitnesses'],SCHED_EXE)
 # Independently derive scan-code/key-state mapping from the original absolute displacements.
 key_base=struct.unpack_from('<H',drv,0x3de)[0]  # displacement in MOV [BX+0x50],0x80
 key_mask=drv[0x3db]
 if key_base!=0x50 or key_mask!=0x7f or drv[0x3e0]!=0x80 or drv[0x3e9]!=0x40:raise ValueError('Changed key-state table')
 intended=[(1,0x51,0x3a,False),(0x10,0x60,0x3b,True),(0x19,0x69,0x3c,True),(0x32,0x82,0xea,True),(0x1f,0x6f,0xeb,True)]
 r=reports['O166']
 rows=r.get('verifiedScanCodeToSourceField',[])
 if len(rows)!=5:raise ValueError('Missing input mapping')
 for row,(code,slot,flag,requires) in zip(rows,intended):
  if (row['scanCode'],row['driverKeySlot'],row['writtenFlag'],row['requiresAltTablePositive'])!=(code,slot,flag,requires):raise ValueError('Forged hotkey mapping')
  if slot-code!=key_base:raise ValueError('Key displacement mismatch')
 if r.get('altKeySlot')!=0x88 or r.get('altScanCode')!=0x38:raise ValueError('Modifier not anchored')
 if r['keyStates']!={'base':0x50,'makeMarker':0x40,'breakMarker':0x80,'breakMask':0x7f}:raise ValueError('Key status encoding')
 if r['limits']!={'keyLabelsRequireConventionalSet1Assumption':True,'altQSourceLevelLoopExitBranch':True,'escapeConditionalReadSourceVerified':True,'runtimeKeyBehaviorObserved':False,'altMAndAltSGameplayMeaningKnown':False,'noGuaranteedFrameRate':True}:raise ValueError('Forged hotkey confidence')
 # Explicit branches from original binary, including jump-to-loop rather than inferred runtime exit.
 for at,to in [(0x813,0x81c),(0x815,0x81c),(0x82e,0x837),(0x830,0x837),(0x83c,0x85a),(0x83e,0x85a),(0x93d,0x953)]:
  if at+2+struct.unpack_from('<b',drv,at+1)[0]!=to:raise ValueError('Wrong RM branch')
 for at in [0x821,0x825]:
  if at+4+struct.unpack_from('<h',drv,at+2)[0]!=0x8a8:raise ValueError('Alt conditional skip must bypass all three alt-combination routes')
 if 0x66ef3+6+struct.unpack_from('<i',exe,0x66ef5)[0]!=0x66e1e:raise ValueError('Non-exit path not verified')
 count+=18
 # Count chaining by executing a pure integer model. No hardware/emulator observation claimed.
 r=reports['O167']
 if r['chainLogic']!={'counterField':0xec,'decrementPhysical':0x939,'ifNegativeRestoreCounter':2,'savedOldIRQFarPointerOffset':0x0c,'otherwiseEOIValue':0x60,'otherwiseEOIPort':0x20,'conditionalEntryCycle':3}:raise ValueError('Chain semantics')
 if r['sourceInitialDriverChainCounter']!=drv[0xec] or r['sourceIRQ8EntryOffset']!=0x7ee:raise ValueError('Initial counter/handler offset')
 if struct.unpack_from('<H',exe,0x66f62)[0]!=0x4d9d or r['pitSetup']!={'modeControl':0x36,'divisor':0x4d9d,'decimalDivisor':19869,'dataPort':0x40}:raise ValueError('PIT source')
 c=drv[0xec]; observed=[]
 for tick in range(1,13):
  c=(c-1)&0xff
  if c&0x80:
   observed.append(tick);c=2
 if observed!=[3,6,9,12]:raise ValueError('Expected chain cadence')
 hz=r['nominalClockModel'];
 if hz['inputHzAssumption']!=1193182 or abs(hz['nominalIRQ0Hz'] - 1193182/19869)>1e-10 or abs(hz['nominalPriorHandlerChainHz']-1193182/19869/3)>1e-10:raise ValueError('Fake nominal clock')
 if r['limits']!={'sourceChainEveryThirdHandlerEntryUnderNormalCounterState':True,'actualInterruptsPerSecondMeasured':False,'gameFramesPerSecondMeasured':False,'actualBIOSChainingHzObserved':False}:raise ValueError('Fake measured rate')
 count+=19
 r=reports['O168']; s=r['scheduler'];
 if s!={'blockPointerGlobal':0x3177c,'counterField':0x24,'sampledValueGlobal':0x35b0c,'smoothedValueGlobal':0x35b10,'zeroCounterOffset':0x67101,'taskCountdownField':6,'taskCountdownWidthBits':16,'taskCountdownDecrementsPerVisitedTask':1,'samplesToTaskDecrementDirectMultiplier':False}:raise ValueError('Misrepresented scheduler')
 if r['modelExamples']!=[{'counterSample':1,'taskCounterBefore':6,'taskCounterAfterOneTraversal':5},{'counterSample':3,'taskCounterBefore':6,'taskCounterAfterOneTraversal':5},{'counterSample':5,'taskCounterBefore':1,'taskCounterAfterOneTraversal':0}]:raise ValueError('Counter sample cannot scale task decrements')
 if r['limits']!={'counterCanCarryMoreThanOneIncrementBetweenSchedulerObservations':True,'zeroCounterAfterSample':True,'notOneTaskDecrementPerIRQWhenTicksAccumulate':True,'schedulerFrequencyMeasured':False,'animationFrameRateMeasured':False}:raise ValueError('Fake scheduler rate')
 for at,to in [(0x670e8,0x670dd),(0x6715c,0x67152)]:
  if at+2+struct.unpack_from('<b',exe,at+1)[0]!=to:raise ValueError('Scheduler loop edge')
 count+=15
 return count
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True);ap.add_argument('--driver',required=True);ap.add_argument('--reports',required=True)
 a=ap.parse_args();p=Path(a.reports)
 rs={i:json.loads((p/(i+'_REPORT.json')).read_text()) for i in ['O166','O167','O168']}
 print('PASS O166-O168 independent source assertions:',check(Path(a.exe).read_bytes(),Path(a.driver).read_bytes(),rs))
