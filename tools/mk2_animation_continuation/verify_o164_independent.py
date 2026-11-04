#!/usr/bin/env python3
"""O164 independently verify original driver/game gate witnesses, strict no-FPS-report semantics."""
import argparse,hashlib,json,struct
from pathlib import Path
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
DH='87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546'
X={0x66ede:'a17c170300',0x66ee3:'f6403cff',0x66ee7:'7406',0x66ee9:'f6403cff',0x66eed:'75fa',0x66eef:'f6403bff',0x670dd:'8b357c170300',0x670e3:'8b4624'}
Y={0x81c:'f6068800ff',0x821:'0f848300',0x825:'0f887f00',0x837:'f6066900ff',0x83c:'741c',0x83e:'781a',0x840:'ff06e400',0x844:'751a',0x846:'80363c00ff',0x84e:'f6063c00ff',0x85a:'c706e400ffff',0x8a8:'f6063c00ff',0x8ad:'7551',0x8af:'ff062400'}
J={'driverPrereqZeroOrSignSkipTo':0x8a8,'inactiveOrSignPhaseResetTo':0x85a,'phaseNonOverflowSkipTo':0x860,'counterGateNonzeroSkipTo':0x900,'gameZeroFlagFastExitTo':0x66eef,'gameNonzeroFlagSpinBackTo':0x66ee9}
F={'driverGate':0x3c,'prereq88':0x88,'prereq69':0x69,'phaseWord':0xe4,'gameSharedInputBlockPointerObject2':0x3177c,'gameGateField':0x3c,'schedulerTickField':0x24}
L={'sameSourceFieldAcrossGameAndOriginalDriver':True,'conditionalGateWriterVerified':True,'frameLoopConditionalGateReadVerified':True,'timerFlagLiveStateKnown':False,'whichInputActivatesPrerequisite88Or69Known':False,'actualIRQRateMeasured':False,'animationFrameRateProven':False}
def verify(e,d,r):
 if len(e)!=861133 or hashlib.sha256(e).hexdigest()!=EH:raise ValueError('Original game identity mismatch')
 if len(d)!=2522 or hashlib.sha256(d).hexdigest()!=DH:raise ValueError('Original driver identity mismatch')
 if r.get('schema')!='mk2_o164_conditional_driver_gate_to_main_loop_handshake_v1' or r.get('originalExeSHA256')!=EH or r.get('originalDriverSHA256')!=DH:raise ValueError('Report provenance')
 if r.get('sourceFields')!=F or r.get('branchTargets')!=J or r.get('limits')!=L:raise ValueError('Forged field/branch/FPS claims')
 checks=5
 for buf,source,n in ((e,X,'exeWitnesses'),(d,Y,'driverWitnesses')):
  w=r.get(n)
  if len(w)!=len(source):raise ValueError('Wrong witness count')
  seen=set()
  for entry in w:
   at=int(entry['physical'],16)
   if at in seen or at not in source or entry['bytes'].lower()!=source[at]:raise ValueError('Wrong/repeated witness')
   if buf[at:at+len(bytes.fromhex(source[at]))]!=bytes.fromhex(source[at]):raise ValueError('Not present in actual original source')
   seen.add(at);checks+=1
  if seen!=set(source):raise ValueError('Missing original source')
 for site,dest in ((0x821,0x8a8),(0x825,0x8a8)):
  if site+4+struct.unpack_from('<h',d,site+2)[0]!=dest:raise ValueError('Wrong original two-byte conditional jump')
  checks+=1
 for site,dest in ((0x83c,0x85a),(0x83e,0x85a),(0x844,0x860),(0x8ad,0x900)):
  if site+2+struct.unpack_from('<b',d,site+1)[0]!=dest:raise ValueError('Wrong original driver branch')
  checks+=1
 for site,dest in ((0x66ee7,0x66eef),(0x66eed,0x66ee9)):
  if site+2+struct.unpack_from('<b',e,site+1)[0]!=dest:raise ValueError('Wrong original game branch')
  checks+=1
 # Independently require exact original writer form and three mapped source fields.
 if d[0x846:0x84b]!=bytes([0x80,0x36,0x3c,0x00,0xff]) or e[0x66ee3:0x66ee7]!=b'\xf6\x40\x3c\xff':raise ValueError('Gate writer/consumer byte mismatch')
 if r.get('interpretation',{}).keys()!={'conditionalFlagToggle','frameLoopSpin','counterSkip'}:raise ValueError('Source-bounded interpretation keys missing')
 return checks+5
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--driver',required=True);p.add_argument('--report',required=True);a=p.parse_args()
 r=json.loads(Path(a.report).read_text())
 print('PASS O164 independent original two-source gate assertions:',verify(Path(a.exe).read_bytes(),Path(a.driver).read_bytes(),r))
