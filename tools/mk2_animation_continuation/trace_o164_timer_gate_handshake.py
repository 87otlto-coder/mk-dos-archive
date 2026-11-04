#!/usr/bin/env python3
"""O164: original RM.DRV + protected-mode timer gate handshake; static byte evidence only."""
import argparse,hashlib,json,struct
from pathlib import Path
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
DH='87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546'
D={
 'gateBlockPrereq88':(0x81c,'f6068800ff'),
 'skipCounterGateOnZero88':(0x821,'0f848300'),
 'skipCounterGateOnSign88':(0x825,'0f887f00'),
 'gateTogglePrereq69':(0x837,'f6066900ff'),
 'gateInactiveZeroBranch':(0x83c,'741c'),
 'gateInactiveSignBranch':(0x83e,'781a'),
 'incrementGatePhaseCounter':(0x840,'ff06e400'),
 'skipToggleUnlessOverflow':(0x844,'751a'),
 'toggleGate3COnOverflow':(0x846,'80363c00ff'),
 'gateFlagTestAfterToggle':(0x84e,'f6063c00ff'),
 'inactiveGatePhaseReset':(0x85a,'c706e400ffff'),
 'timerGateCounterRead':(0x8a8,'f6063c00ff'),
 'skipCounterWritesWhenNonzero':(0x8ad,'7551'),
 'advanceTickCounter':(0x8af,'ff062400'),
}
E={
 'readSharedInputBlock':(0x66ede,'a17c170300'),
 'gameLoopStatusTest':(0x66ee3,'f6403cff'),
 'ifZeroSkipSpin':(0x66ee7,'7406'),
 'gameLoopSpinTest':(0x66ee9,'f6403cff'),
 'gameLoopSpinWhileNonzero':(0x66eed,'75fa'),
 'anotherInputFlag':(0x66eef,'f6403bff'),
 'schedulerReadRuntimeBlock':(0x670dd,'8b357c170300'),
 'schedulerReadTickDword':(0x670e3,'8b4624'),
}
def u8branch(b,p):return p+2+struct.unpack_from('<b',b,p+1)[0]
def u32branch(b,p):return p+4+struct.unpack_from('<i',b,p)[0]
def make(e,d):
 if len(e)!=861133 or hashlib.sha256(e).hexdigest()!=EH:raise ValueError('Require canonical original MK2.EXE')
 if len(d)!=2522 or hashlib.sha256(d).hexdigest()!=DH:raise ValueError('Require canonical original RM.DRV')
 for name,(i,v) in E.items():
  if e[i:i+len(bytes.fromhex(v))]!=bytes.fromhex(v):raise ValueError('EXE '+name)
 for name,(i,v) in D.items():
  if d[i:i+len(bytes.fromhex(v))]!=bytes.fromhex(v):raise ValueError('DRV '+name)
 for site,target in ((0x821,0x8a8),(0x825,0x8a8)):
  if site+4+struct.unpack_from('<h',d,site+2)[0]!=target:raise ValueError('Wrong 16bit near conditional branch '+hex(site))
 for site,target in ((0x83c,0x85a),(0x83e,0x85a),(0x844,0x860),(0x8ad,0x900)):
  if u8branch(d,site)!=target:raise ValueError('Wrong 16bit short jump '+hex(site))
 for site,target in ((0x66ee7,0x66eef),(0x66eed,0x66ee9)):
  if u8branch(e,site)!=target:raise ValueError('Wrong 32bit game loop short jump')
 return {'schema':'mk2_o164_conditional_driver_gate_to_main_loop_handshake_v1',
  'originalExeSHA256':EH,'originalDriverSHA256':DH,
  'exeWitnesses':[{'name':k,'physical':f'0x{i:05X}','bytes':v} for k,(i,v) in E.items()],
  'driverWitnesses':[{'name':k,'physical':f'0x{i:04X}','bytes':v} for k,(i,v) in D.items()],
  'branchTargets':{'driverPrereqZeroOrSignSkipTo':0x8a8,
                   'inactiveOrSignPhaseResetTo':0x85a,
                   'phaseNonOverflowSkipTo':0x860,
                   'counterGateNonzeroSkipTo':0x900,
                   'gameZeroFlagFastExitTo':0x66eef,
                   'gameNonzeroFlagSpinBackTo':0x66ee9},
  'sourceFields':{'driverGate':0x3c,'prereq88':0x88,'prereq69':0x69,'phaseWord':0xe4,
   'gameSharedInputBlockPointerObject2':0x3177c,'gameGateField':0x3c,'schedulerTickField':0x24},
  'interpretation':{
   'conditionalFlagToggle':'Within IRQ8 handler, prerequisites select an increment of phase word 0xE4; overflow toggles gate byte +0x3C. Inactive +0x69 path resets phase word to 0xFFFF',
   'frameLoopSpin':'Main game frame loop reads +0x3C of shared input block and spins while nonzero, on a source-conditional branch',
   'counterSkip':'Driver independently skips +0x24 and +0x28 counter increments when +0x3C tests nonzero'},
  'limits':{'sameSourceFieldAcrossGameAndOriginalDriver':True,'conditionalGateWriterVerified':True,
    'frameLoopConditionalGateReadVerified':True,'timerFlagLiveStateKnown':False,
    'whichInputActivatesPrerequisite88Or69Known':False,
    'actualIRQRateMeasured':False,'animationFrameRateProven':False}}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--driver',required=True);p.add_argument('--out',required=True);a=p.parse_args()
 o=Path(a.out)
 if o.exists():raise ValueError('No overwrite')
 o.parent.mkdir(parents=True,exist_ok=True)
 o.write_text(json.dumps(make(Path(a.exe).read_bytes(),Path(a.driver).read_bytes()),indent=2)+'\n')
 print('PASS O164 original timer-gate writer/game-loop conditional handshake (not measured animation FPS)')
