#!/usr/bin/env python3
"""O152 decode the original unrolled screen-buffer transfer instruction geometry."""
import argparse,hashlib,json,struct
from pathlib import Path
HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
def analyze(b):
 if len(b)!=861133 or hashlib.sha256(b).hexdigest()!=HASH:raise ValueError('Only unmodified original MK2.EXE supported')
 if b[0x65521:0x65524]!=bytes.fromhex('b1c890'):raise ValueError('O152 row counter start')
 cursor=0x65524
 rows=[]
 for n in range(80):
  d=n*4
  if d==0:
   r,w=bytes.fromhex('8b06'),bytes.fromhex('8907')
  elif d<128:
   r=bytes([0x8b,0x46,d]);w=bytes([0x89,0x47,d])
  else:
   r=bytes.fromhex('8b86')+struct.pack('<I',d)
   w=bytes.fromhex('8987')+struct.pack('<I',d)
  if b[cursor:cursor+len(r)]!=r:raise ValueError(f'O152 row {n} load opcode/offset')
  cursor+=len(r)
  if b[cursor:cursor+len(w)]!=w:raise ValueError(f'O152 row {n} store opcode/offset')
  cursor+=len(w)
  rows.append(d)
 if cursor!=0x65822:raise ValueError('O152 original unroll end')
 endings={0x65822:'81c640010000',0x65828:'81c740010000',0x6582e:'fec9',0x65830:'0f85eefcffff',0x65836:'c3'}
 for at,h in endings.items():
  if b[at:at+len(bytes.fromhex(h))]!=bytes.fromhex(h):raise ValueError('O152 loop instruction '+hex(at))
 target=0x65836+struct.unpack_from('<i',b,0x65832)[0]
 if target!=0x65524:raise ValueError('O152 JNE incorrect backedge')
 return {'schema':'mk2_o152_original_unrolled_320x200_screen_copy_v1', 'originalSHA256':HASH,
  'copyRoutinePhysical':'0x65521','firstLoadPhysical':'0x65524','lastLoadPhysical':'0x65816',
  'nextRowPhysical':'0x65822','loopJumpPhysical':'0x65830','loopTargetPhysical':'0x65524',
  'rowCount':200,'dwordsPerRow':len(rows),'bytesPerRow':320,'copiedBytesPerPass':64000,
  'sourceOffsetsBytes':rows,
  'evidence':'Original code writes 80 consecutive DWORDs per row, advances source and destination 320 bytes, decrements CL initialized to 200, loops until zero',
  'limits':{'staticTransferGeometryVerified':True,'entireStageNativeBackgroundWidth':None,'actualObservedVRAMContentsKnown':False,'hostMonitorFPSKnown':False}}
def main():
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True);a.add_argument('--out',required=True);v=a.parse_args()
 out=Path(v.out)
 if out.exists():raise ValueError('Refuse to overwrite')
 out.write_text(json.dumps(analyze(Path(v.exe).read_bytes()),indent=2)+'\n');print('PASS O152 original 320x200 buffer transfer, not original world/stage dimensions')
if __name__=='__main__':main()
