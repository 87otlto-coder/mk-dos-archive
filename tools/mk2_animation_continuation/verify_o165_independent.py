#!/usr/bin/env python3
"""Independent O165 IRQ9->IRQ8 key-state gate source verifier; no producer imports."""
import argparse,hashlib,json,struct
from pathlib import Path
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
DH='87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546'
S={3:'e9af03',0x3b5:'50531e8ccb8edb',0x3bc:'f6063d00ff',0x3c1:'752b',0x3c3:'e460',0x3c5:'8ae0',0x3d5:'8ac4',0x3d7:'8ad8',0x3d9:'83e37f',0x3dc:'c687500080',0x3e1:'84c0',0x3e3:'7805',0x3e5:'c687500040',0x3ed:'cf',0x3f1:'2eff2e1000',0x81c:'f6068800ff',0x821:'0f848300',0x825:'0f887f00',0x837:'f6066900ff',0x83c:'741c',0x83e:'781a',0x840:'ff06e400',0x846:'80363c00ff',0x8a8:'f6063c00ff'}
KEY={'baseOffset':0x50,'indexMask':0x7f,'keyDownMarker':0x40,'keyUpMarker':0x80,'readPort':0x60,'handlerOffset':0x3b5,'interrupt9EntryOffset':3,'prerequisiteOneTableOffset':0x88,'prerequisiteOneScanCodeIndex':0x38,'prerequisiteTwoTableOffset':0x69,'prerequisiteTwoScanCodeIndex':0x19}
LIMIT={'sourceKeyIndexRelationshipVerified':True,'keyboardStateEncodingVerified':True,'keyNameLabelFromConventionalScanSet1Only':True,'liveKeysPressedObserved':False,'specificGameplayPauseFunctionProven':False,'animationFrameRateProven':False}
def verify(e,d,r):
 if len(e)!=861133 or hashlib.sha256(e).hexdigest()!=EH:raise ValueError('Wrong EXE')
 if len(d)!=2522 or hashlib.sha256(d).hexdigest()!=DH:raise ValueError('Wrong original driver')
 if r.get('schema')!='mk2_o165_irq9_keyboard_state_original_irq8_gate_join_v1' or r.get('originalExeSHA256')!=EH or r.get('originalDriverSHA256')!=DH:raise ValueError('Provenance')
 if r.get('keyStateTable')!=KEY or r.get('limits')!=LIMIT:raise ValueError('Invented runtime/name/scan-code fields')
 ws=r.get('driverWitnesses',[])
 if len(ws)!=len(S):raise ValueError('Incomplete witness list')
 got={}
 for w in ws:
  at=int(w['physical'],16)
  if at in got or at not in S or S[at]!=w['bytes'].lower():raise ValueError('Wrong witness')
  if d[at:at+len(bytes.fromhex(S[at]))]!=bytes.fromhex(S[at]):raise ValueError('Original opcode mismatch')
  got[at]=w['bytes'];
 if set(got)!=set(S):raise ValueError('Missing witness')
 if d[3]!=0xe9 or 6+struct.unpack_from('<h',d,4)[0]!=0x3b5:raise ValueError('No original INT9 entry')
 for at,dest in ((0x3c1,0x3ee),(0x3e3,0x3ea),(0x83c,0x85a),(0x83e,0x85a)):
  if at+2+struct.unpack_from('<b',d,at+1)[0]!=dest:raise ValueError('Wrong branch')
 if (0x88-KEY['baseOffset'],0x69-KEY['baseOffset'])!=(0x38,0x19):raise ValueError('Index mapping wrong')
 if set(r.get('interpretation',{}))!={'keyboardHandler','timerUsesThoseKeyStates'}:raise ValueError('Interpretation missing')
 return len(S)+17
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True);a.add_argument('--driver',required=True);a.add_argument('--report',required=True);o=a.parse_args()
 print('PASS O165 independently verified source assertions:',verify(Path(o.exe).read_bytes(),Path(o.driver).read_bytes(),json.loads(Path(o.report).read_text())))
