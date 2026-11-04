#!/usr/bin/env python3
"""Independent O174 raw-source and arithmetic verification, producer-free."""
import argparse,hashlib,json,struct
from pathlib import Path
SHA='87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546'
W={0x81c:'f6068800ff',0x821:'0f848300',0x825:'0f887f00',0x837:'f6066900ff',0x83c:'741c',0x83e:'781a',0x840:'ff06e400',0x844:'751a',0x846:'80363c00ff',0x85a:'c706e400ffff',0x860:'f6068200ff',0x869:'ff06e600',0x86f:'8036ea00ff',0x886:'c706e600ffff',0x88c:'f6066f00ff',0x895:'ff06e800',0x89b:'8036eb00ff',0x8a2:'c706e800ffff',0x8a8:'f6063c00ff',0xe4:'ffff',0xe6:'ffff',0xe8:'ffff'}
def independently_step(phase,gate,alt,p):
 if alt:
  if p:
   phase+=1
   if phase>65535:phase=0
   if phase==0:gate^=255
  else:phase=65535
 return phase,gate

def verify(d,r):
 if len(d)!=0x9da or hashlib.sha256(d).hexdigest()!=SHA:raise ValueError('Wrong original RM.DRV')
 for p,h in W.items():
  if d[p:p+len(bytes.fromhex(h))]!=bytes.fromhex(h):raise ValueError('Original handler mismatch '+hex(p))
 if r.get('schema')!='mk2_o174_irq8_phase_wrap_and_modifier_reset_source_model_v1' or r.get('originalDriverSHA256')!=SHA:raise ValueError('Provenance')
 seen=set()
 for w in r.get('sourceWitnesses',[]):
  p=int(w['offsetHex'],16)
  if p not in W or p in seen or w['bytes']!=W[p]:raise ValueError('Source report falsified')
  seen.add(p)
 if seen!=set(W):raise ValueError('Incomplete source evidence')
 for at,target in [(0x821,0x8a8),(0x825,0x8a8)]:
  if at+4+struct.unpack_from('<h',d,at+2)[0]!=target:raise ValueError('Modifier gate branch mismatch')
 for at,target in [(0x83c,0x85a),(0x83e,0x85a)]:
  if at+2+struct.unpack_from('<b',d,at+1)[0]!=target:raise ValueError('Phase reset branch mismatch')
 if r.get('model')!={'phaseWordBits':16,'initialPhaseWords':[65535,65535,65535],
   'modifierTableField':0x88,'phaseWordFields':[0xe4,0xe6,0xe8],
   'keyStateTableOffsets':[0x69,0x82,0x6f],'toggledStatusFields':[0x3c,0xea,0xeb],
   'pressCondition':'modifier and key both positive; release marker is negative',
   'firstEligibleHandlerAfterFFFFWrapsToZeroAndToggles':True,
   'nextContinuousWrapRequiresAdditionalEligibleCalls':65536,
   'resetOnlyWhenAltPositiveAndCorrespondingKeyNotPositive':True,
   'ALTNotPositiveSkipsPhaseReset':True,'schedulerTickGateByte':0x3c}:raise ValueError('Unfaithful model')
 if r.get('limits')!={'sourceBasedPureCounterModel':True,'realInterruptDeliveryMeasured':False,'actualKeyHoldDurationMeasured':False,'userVisiblePauseShortcutVerified':False,'wallClockPauseDurationKnown':False,'animationFPSKnown':False}:raise ValueError('Unsupported observation claim')
 x,y=65535,0;expected=[]
 for name,alt,p in [('press',True,True),('held',True,True),('release_p_while_alt_held',True,False),('press_again',True,True),('release_alt_first',False,True),('key_still_pressed_without_alt',False,True)]:
  old=y;x,y=independently_step(x,y,alt,p)
  expected.append({'event':name,'phaseAfter':x,'gateAfter':y,'toggled':y!=old})
 if r.get('examplePOnly')!=expected:raise ValueError('Phase example forged')
 # Clock-free cycle and modifier-not-held reset asymmetry, independently tested.
 a,gate=0,255
 for _ in range(65535):a,gate=independently_step(a,gate,True,True)
 if (a,gate)!=(65535,255):raise ValueError('Should not wrap until 65536th subsequent call')
 a,gate=independently_step(a,gate,True,True)
 if (a,gate)!=(0,0):raise ValueError('Phase wrap occurred at wrong eligible sample')
 a,gate=independently_step(a,gate,False,False)
 if (a,gate)!=(0,0):raise ValueError('ALT-absent should leave phase untouched')
 return len(W)+4+len(expected)+8
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--driver',required=True);p.add_argument('--report',required=True);a=p.parse_args()
 print('PASS O174 independent source assertions:',verify(Path(a.driver).read_bytes(),json.loads(Path(a.report).read_text())))
