#!/usr/bin/env python3
"""O170: original keyboard interrupt-routing mode setters and key table zeroing."""
import argparse,hashlib,json,struct
from pathlib import Path
E_HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
D_HASH='87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546'
E={
 'modeEnablePairA':(0x9b320,'a17c170300c6403dffc3'),
 'modeClearAndResetPairA':(0x9b32a,'a17c170300c6403d008bd78d7850b92000000033c0f3ab8bfac3'),
 'modeEnablePairB':(0x9d5bc,'a17c170300c6403dffc3'),
 'modeClearAndResetPairB':(0x9d5c6,'a17c170300c6403d008bd78d7850b92000000033c0f3ab8bfac3'),
 'mainLoopModeTest':(0x66ec6,'a17c170300f6403dff'),
 'mainLoopSkipBIOSPoll':(0x66ecf,'750d'),
 'biosKeyboardStatusCall':(0x66ed1,'b800010000cd16'),
 'biosKeyboardReadCall':(0x66eda,'33c0cd16'),
 'modeSelectOneCaller':(0x9d5e0,'e8d7ffffff')}
D={'modeTest':(0x3bc,'f6063d00ff'), 'passthroughPriorIRQ9Branch':(0x3c1,'752b'),
 'selfHandleScancode':(0x3c3,'e460'),'passthroughOldIRQ9':(0x3f1,'2eff2e1000')}

def make(e,d):
 if len(e)!=861133 or hashlib.sha256(e).hexdigest()!=E_HASH:raise ValueError('Original executable required')
 if len(d)!=2522 or hashlib.sha256(d).hexdigest()!=D_HASH:raise ValueError('Original driver required')
 for b,dict_ in ((e,E),(d,D)):
  for label,(off,v) in dict_.items():
   bs=bytes.fromhex(v)
   if b[off:off+len(bs)]!=bs:raise ValueError('Wrong original '+label)
 if e[0x9b320:0x9b344]!=e[0x9d5bc:0x9d5e0]:raise ValueError('Source helper duplication incorrect')
 if 0x3c1+2+struct.unpack_from('<b',d,0x3c2)[0]!=0x3ee:raise ValueError('IRQ9 mode branch')
 if 0x66ecf+2+struct.unpack_from('<b',e,0x66ed0)[0]!=0x66ede:raise ValueError('BIOS poll branch')
 if 0x9d5e0+5+struct.unpack_from('<i',e,0x9d5e1)[0]!=0x9d5bc:raise ValueError('Unexpected mode enable call')
 return {'schema':'mk2_o170_original_irq9_mode_setters_and_key_table_clear_v1',
  'originalExeSHA256':E_HASH,'originalDriverSHA256':D_HASH,
  'exeWitnesses':[{'name':k,'physicalOffset':f'0x{at:X}','originalBytes':s} for k,(at,s) in E.items()],
  'driverWitnesses':[{'name':k,'physicalOffset':f'0x{at:X}','originalBytes':s} for k,(at,s) in D.items()],
  'sharedModeField':0x3d,'sharedInputBlockPointer':0x3177c,
  'modeSetters':[0x9b320,0x9d5bc],
  'modeClearAndKeyTableResetters':[0x9b32a,0x9d5c6],
  'resetGeometry':{'keyTableStart':0x50,'dwordCount':0x20,'dwordBytes':4,'totalBytes':0x80},
  'modeConditionalBranches':{'driverIfNonzeroChainPriorIRQ9At':0x3ee,
    'driverIfZeroReadPort60At':0x3c3,
    'gameIfNonzeroSkipBIOSPollAt':0x66ede,
    'gameIfZeroBIOSStatusAndReadAt':[0x66ed1,0x66eda]},
  'limits':{'sourceModesAndKeyStateResetVerified':True,'whichModeActiveDuringStageUnknown':True,
    'actualAltCombinationsObserved':False,'runtimeInputSemanticsAssigned':False,
    'animationFPSInferredFromInputModes':False}}
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True);ap.add_argument('--driver',required=True);ap.add_argument('--out',required=True);a=ap.parse_args()
 dst=Path(a.out)
 if dst.exists():raise ValueError('No overwrite')
 dst.parent.mkdir(parents=True,exist_ok=True);dst.write_text(json.dumps(make(Path(a.exe).read_bytes(),Path(a.driver).read_bytes()),indent=2)+'\n')
 print('PASS O170 shared IRQ9/BIOs keyboard routing mode and table reset source evidence')
