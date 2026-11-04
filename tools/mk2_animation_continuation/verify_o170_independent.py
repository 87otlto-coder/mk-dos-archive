#!/usr/bin/env python3
"""Independent original-byte and branch/memory-model verification for O170."""
import argparse,hashlib,json,struct
from pathlib import Path
EXEH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
DRVH='87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546'
ORIGINAL_EXE={0x9b320:'a17c170300c6403dffc3',0x9b32a:'a17c170300c6403d008bd78d7850b92000000033c0f3ab8bfac3',
 0x9d5bc:'a17c170300c6403dffc3',0x9d5c6:'a17c170300c6403d008bd78d7850b92000000033c0f3ab8bfac3',
 0x66ec6:'a17c170300f6403dff',0x66ecf:'750d',0x66ed1:'b800010000cd16',0x66eda:'33c0cd16',0x9d5e0:'e8d7ffffff'}
ORIGINAL_DRV={0x3bc:'f6063d00ff',0x3c1:'752b',0x3c3:'e460',0x3f1:'2eff2e1000'}

def verify(original,driver,report):
 if len(original)!=861133 or hashlib.sha256(original).hexdigest()!=EXEH:raise ValueError('Wrong executable')
 if len(driver)!=2522 or hashlib.sha256(driver).hexdigest()!=DRVH:raise ValueError('Wrong driver')
 if report.get('schema')!='mk2_o170_original_irq9_mode_setters_and_key_table_clear_v1' or report.get('originalExeSHA256')!=EXEH or report.get('originalDriverSHA256')!=DRVH:raise ValueError('Provenance')
 checks=0
 for contents,wlist,valid in ((original,report.get('exeWitnesses',[]),ORIGINAL_EXE),(driver,report.get('driverWitnesses',[]),ORIGINAL_DRV)):
  if len(wlist)!=len(valid):raise ValueError('Incomplete original witnesses')
  covered=set()
  for w in wlist:
   at=int(w['physicalOffset'],16)
   if at not in valid or at in covered or w['originalBytes']!=valid[at]:raise ValueError('Incorrect source witness')
   raw=bytes.fromhex(valid[at]);
   if contents[at:at+len(raw)]!=raw:raise ValueError('Original opcode mismatch')
   covered.add(at);checks+=1
  if covered!=set(valid):raise ValueError('Lost original source witness')
 if original[0x9b320:0x9b344]!=original[0x9d5bc:0x9d5e0]:raise ValueError('Mode setter pair not duplicated')
 if original[0x9b325:0x9b329]!=b'\xc6\x40\x3d\xff' or original[0x9b32f:0x9b333]!=b'\xc6\x40\x3d\x00':raise ValueError('Mode value failed')
 if original[0x9b335:0x9b33f]!=bytes.fromhex('8d7850b92000000033c0'):raise ValueError('Table clearing geometry opcode')
 if original[0x9b33f:0x9b341]!=b'\xf3\xab':raise ValueError('Not rep stosd')
 if driver[0x3c1]==0x75 and 0x3c1+2+struct.unpack_from('<b',driver,0x3c2)[0]!=0x3ee:raise ValueError('Driver chain target')
 if 0x66ecf+2+struct.unpack_from('<b',original,0x66ed0)[0]!=0x66ede:raise ValueError('EXE poll skip target')
 if 0x9d5e0+5+struct.unpack_from('<i',original,0x9d5e1)[0]!=0x9d5bc:raise ValueError('Source relative call')
 if report.get('sharedModeField')!=0x3d or report.get('sharedInputBlockPointer')!=0x3177c:raise ValueError('Incorrect mode source')
 if report.get('modeSetters')!=[0x9b320,0x9d5bc] or report.get('modeClearAndKeyTableResetters')!=[0x9b32a,0x9d5c6]:raise ValueError('Mode setter addresses')
 if report.get('resetGeometry')!={'keyTableStart':0x50,'dwordCount':0x20,'dwordBytes':4,'totalBytes':0x80}:raise ValueError('Wrong key table span')
 if report.get('modeConditionalBranches')!={'driverIfNonzeroChainPriorIRQ9At':0x3ee,'driverIfZeroReadPort60At':0x3c3,'gameIfNonzeroSkipBIOSPollAt':0x66ede,'gameIfZeroBIOSStatusAndReadAt':[0x66ed1,0x66eda]}:raise ValueError('Different conditional behavior')
 if report.get('limits')!={'sourceModesAndKeyStateResetVerified':True,'whichModeActiveDuringStageUnknown':True,'actualAltCombinationsObserved':False,'runtimeInputSemanticsAssigned':False,'animationFPSInferredFromInputModes':False}:raise ValueError('Runtime assumptions inserted')
 return checks+15
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--driver',required=True);p.add_argument('--report',required=True);a=p.parse_args()
 print('PASS O170 independent source assertions:',verify(Path(a.exe).read_bytes(),Path(a.driver).read_bytes(),json.loads(Path(a.report).read_text())))
