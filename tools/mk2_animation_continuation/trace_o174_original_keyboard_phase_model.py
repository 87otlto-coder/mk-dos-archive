#!/usr/bin/env python3
"""O174: exact bounded original IRQ8 phase-word gate behavior, not a DOSBox capture."""
import argparse,hashlib,json,struct
from pathlib import Path
H='87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546'
W={
 'altPressedTest':(0x81c,'f6068800ff'),'altAbsentSkip':(0x821,'0f848300'),
 'altReleasedSkip':(0x825,'0f887f00'),
 'pPressedTest':(0x837,'f6066900ff'),'pNotPressedSkip':(0x83c,'741c'),
 'pReleasedSkip':(0x83e,'781a'),'pPhaseInc':(0x840,'ff06e400'),
 'pWrapNotTaken':(0x844,'751a'),'pToggleByte':(0x846,'80363c00ff'),
 'pPhaseReset':(0x85a,'c706e400ffff'),
 'mPressedTest':(0x860,'f6068200ff'),'mPhaseInc':(0x869,'ff06e600'),
 'mToggleByte':(0x86f,'8036ea00ff'),'mPhaseReset':(0x886,'c706e600ffff'),
 'sPressedTest':(0x88c,'f6066f00ff'),'sPhaseInc':(0x895,'ff06e800'),
 'sToggleByte':(0x89b,'8036eb00ff'),'sPhaseReset':(0x8a2,'c706e800ffff'),
 'schedulerCounterGateRead':(0x8a8,'f6063c00ff'),
 'firstPhaseWord':(0xe4,'ffff'),'secondPhaseWord':(0xe6,'ffff'),'thirdPhaseWord':(0xe8,'ffff'),
}

def assert_source(raw):
 if len(raw)!=2522 or hashlib.sha256(raw).hexdigest()!=H:raise ValueError('Original RM.DRV required')
 for k,(at,s) in W.items():
  if raw[at:at+len(bytes.fromhex(s))]!=bytes.fromhex(s):raise ValueError('Source opcode not found '+k)
 for at,t in [(0x821,0x8a8),(0x825,0x8a8)]:
  if at+4+struct.unpack_from('<h',raw,at+2)[0]!=t:raise ValueError('ALT branch target')
 for at,t in [(0x83c,0x85a),(0x83e,0x85a)]:
  if at+2+struct.unpack_from('<b',raw,at+1)[0]!=t:raise ValueError('P reset source branch')
 return True

def advance(phase:int,gate:int,alt_positive:bool,key_positive:bool):
 """One hypothetical handler invocation: implements only P phase and gate byte.
 This is a pure byte/word arithmetic model; not actual interrupt dispatch.
 """
 if not alt_positive:return phase,gate,False
 if not key_positive:return 0xffff,gate,False
 phase=(phase+1)&0xffff
 toggled=phase==0
 return phase,gate^(0xff if toggled else 0),toggled

def report(raw):
 assert_source(raw)
 s=0xffff;gate=0;events=[]
 for label,alt,p in [('press',True,True),('held',True,True),('release_p_while_alt_held',True,False),('press_again',True,True),('release_alt_first',False,True),('key_still_pressed_without_alt',False,True)]:
  s,gate,tog=advance(s,gate,alt,p);events.append({'event':label,'phaseAfter':s,'gateAfter':gate,'toggled':tog})
 return {'schema':'mk2_o174_irq8_phase_wrap_and_modifier_reset_source_model_v1',
  'originalDriverSHA256':H,'sourceWitnesses':[{'label':k,'offsetHex':f'0x{at:X}','bytes':b} for k,(at,b) in W.items()],
  'model':{'phaseWordBits':16,'initialPhaseWords':[65535,65535,65535],
   'modifierTableField':0x88,'phaseWordFields':[0xe4,0xe6,0xe8],
   'keyStateTableOffsets':[0x69,0x82,0x6f],
   'toggledStatusFields':[0x3c,0xea,0xeb],
   'pressCondition':'modifier and key both positive; release marker is negative',
   'firstEligibleHandlerAfterFFFFWrapsToZeroAndToggles':True,
   'nextContinuousWrapRequiresAdditionalEligibleCalls':65536,
   'resetOnlyWhenAltPositiveAndCorrespondingKeyNotPositive':True,
   'ALTNotPositiveSkipsPhaseReset':True,
   'schedulerTickGateByte':0x3c},'examplePOnly':events,
  'limits':{'sourceBasedPureCounterModel':True,'realInterruptDeliveryMeasured':False,'actualKeyHoldDurationMeasured':False,
   'userVisiblePauseShortcutVerified':False,'wallClockPauseDurationKnown':False,'animationFPSKnown':False}}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--driver',required=True);p.add_argument('--out',required=True);a=p.parse_args();out=Path(a.out)
 if out.exists():raise ValueError('Refuse overwrite')
 r=report(Path(a.driver).read_bytes());out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(r,indent=2)+'\n')
 print('PASS O174 original 16-bit phase wrap/reset conditions; not runtime timing')
