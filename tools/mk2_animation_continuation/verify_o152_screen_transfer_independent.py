#!/usr/bin/env python3
"""Independent loop and copy geometry check for O152; does not import tracer."""
import argparse,hashlib,json,struct
from pathlib import Path
EXPECTED_HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
def verify(exe,r):
 if hashlib.sha256(exe).hexdigest()!=EXPECTED_HASH or len(exe)!=861133:raise ValueError('Wrong source')
 if r.get('schema')!='mk2_o152_original_unrolled_320x200_screen_copy_v1' or r.get('originalSHA256')!=EXPECTED_HASH:raise ValueError('Wrong identity')
 if (r.get('rowCount'),r.get('dwordsPerRow'),r.get('bytesPerRow'),r.get('copiedBytesPerPass'))!=(200,80,320,64000):raise ValueError('Wrong geometry')
 offsets=r.get('sourceOffsetsBytes')
 if offsets!=list(range(0,320,4)):raise ValueError('Incorrect DWORD ordering')
 if r.get('limits')!={'staticTransferGeometryVerified':True,'entireStageNativeBackgroundWidth':None,'actualObservedVRAMContentsKnown':False,'hostMonitorFPSKnown':False}:raise ValueError('Unverified render assumption')
 if exe[0x65521:0x65524]!=b'\xb1\xc8\x90':raise ValueError('Wrong row loop')
 pos=0x65524;verified=0
 for displacement in offsets:
  for op,reg in [(0x8b,0x46),(0x89,0x47)]:
   if displacement==0:sample=bytes([op, 0x06 if op==0x8b else 0x07])
   elif displacement<128:sample=bytes([op,reg,displacement])
   else:sample=bytes([op, 0x86 if op==0x8b else 0x87])+struct.pack('<I',displacement)
   if exe[pos:pos+len(sample)]!=sample:raise ValueError('Nonidentical indexed MOV bytecode')
   pos+=len(sample);verified+=1
 if pos!=0x65822:raise ValueError('Incorrect loop end')
 if exe[pos:0x65837]!=bytes.fromhex('81c64001000081c740010000fec90f85eefcffffc3'):raise ValueError('Wrong byte step, branch or RET')
 if 0x65836+struct.unpack_from('<i',exe,0x65832)[0]!=0x65524:raise ValueError('Wrong branch target')
 if any(r.get(f) != v for f,v in [('copyRoutinePhysical','0x65521'),('firstLoadPhysical','0x65524'),('nextRowPhysical','0x65822'),('loopJumpPhysical','0x65830'),('loopTargetPhysical','0x65524')]):raise ValueError('False offset')
 return verified+len(offsets)+10
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True);ap.add_argument('--report',required=True);a=ap.parse_args()
 print('PASS O152 independently verified',verify(Path(a.exe).read_bytes(),json.loads(Path(a.report).read_text())),'row load/store and report assertions')
