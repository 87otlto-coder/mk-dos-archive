#!/usr/bin/env python3
"""O165: original IRQ9 key-state table joins original IRQ8 conditional timer gate."""
import argparse,hashlib,json,struct
from pathlib import Path
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
DH='87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546'
W={
 'interrupt9Jump':(3,'e9af03'),
 'interrupt9HandlerEntry':(0x3b5,'50531e8ccb8edb'),
 'interrupt9PassthroughStatus':(0x3bc,'f6063d00ff'),
 'interrupt9PassthroughBranch':(0x3c1,'752b'),
 'readKeyboardPort60':(0x3c3,'e460'),
 'saveRawScancodeAH':(0x3c5,'8ae0'),
 'reacquireScancode':(0x3d5,'8ac4'),
 'moveScancodeToBX':(0x3d7,'8ad8'),
 'maskOffBreakBit':(0x3d9,'83e37f'),
 'defaultKeyUpValue':(0x3dc,'c687500080'),
 'testScancodeSign':(0x3e1,'84c0'),
 'skipKeyDownOnBreak':(0x3e3,'7805'),
 'keyDownValue':(0x3e5,'c687500040'),
 'handlerReturn':(0x3ed,'cf'),
 'passthroughOldInt9':(0x3f1,'2eff2e1000'),
 'interrupt8TestKeyIndex38':(0x81c,'f6068800ff'),
 'interrupt8SkipIfZero':(0x821,'0f848300'),
 'interrupt8SkipIfNegative':(0x825,'0f887f00'),
 'interrupt8TestKeyIndex19':(0x837,'f6066900ff'),
 'interrupt8SkipIfSecondZero':(0x83c,'741c'),
 'interrupt8SkipIfSecondNegative':(0x83e,'781a'),
 'interrupt8IncrementGatePhase':(0x840,'ff06e400'),
 'interrupt8GateXorOnOverflow':(0x846,'80363c00ff'),
 'interrupt8CounterGate':(0x8a8,'f6063c00ff')}
EX={0x62169:'a17c170300',0x62170:'c1e804'} # inspect if necessary

def make(e,d):
 if len(e)!=861133 or hashlib.sha256(e).hexdigest()!=EH:raise ValueError('Canonical original MK2 executable required')
 if len(d)!=2522 or hashlib.sha256(d).hexdigest()!=DH:raise ValueError('Canonical original RM.DRV required')
 for k,(p,h) in W.items():
  if d[p:p+len(bytes.fromhex(h))]!=bytes.fromhex(h):raise ValueError('Original driver site '+k)
 if 3+3+struct.unpack_from('<h',d,4)[0]!=0x3b5:raise ValueError('Not IRQ9 handler')
 if 0x3e3+2+struct.unpack_from('<b',d,0x3e4)[0]!=0x3ea:raise ValueError('Original break-key branch')
 if 0x3c1+2+struct.unpack_from('<b',d,0x3c2)[0]!=0x3ee:raise ValueError('Original keyboard passthrough branch')
 if 0x50+0x38!=0x88 or 0x50+0x19!=0x69:raise ValueError('Input table index')
 return {'schema':'mk2_o165_irq9_keyboard_state_original_irq8_gate_join_v1',
 'originalExeSHA256':EH,'originalDriverSHA256':DH,
 'driverWitnesses':[{'name':k,'physical':f'0x{p:04X}','bytes':h} for k,(p,h) in W.items()],
 'keyStateTable':{'baseOffset':0x50,'indexMask':0x7f,'keyDownMarker':0x40,'keyUpMarker':0x80,
                  'readPort':0x60,'handlerOffset':0x3b5,'interrupt9EntryOffset':3,
                  'prerequisiteOneTableOffset':0x88,'prerequisiteOneScanCodeIndex':0x38,
                  'prerequisiteTwoTableOffset':0x69,'prerequisiteTwoScanCodeIndex':0x19},
 'interpretation':{'keyboardHandler':'Original RM.DRV INT9 handler reads port 0x60, masks scan code to low 7 bits, and records 0x40 or 0x80 at base 0x50 plus index; conditional passthrough can chain prior INT9.',
 'timerUsesThoseKeyStates':'Original IRQ8 handler tests key-state entries 0x88 and 0x69, with branches that skip or reset a timer-phase counter before conditionally toggling field 0x3C.'},
 'limits':{'sourceKeyIndexRelationshipVerified':True,'keyboardStateEncodingVerified':True,
   'keyNameLabelFromConventionalScanSet1Only':True,'liveKeysPressedObserved':False,
   'specificGameplayPauseFunctionProven':False,'animationFrameRateProven':False}}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--driver',required=True);p.add_argument('--out',required=True);a=p.parse_args();out=Path(a.out)
 if out.exists():raise ValueError('Refusing overwrite')
 out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(make(Path(a.exe).read_bytes(),Path(a.driver).read_bytes()),indent=2)+'\n')
 print('PASS O165 original IRQ9 scan-code-state writer → IRQ8 gate key-state join')
