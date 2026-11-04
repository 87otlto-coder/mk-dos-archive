#!/usr/bin/env python3
"""O112 strict, original-code-anchored 320-byte MK2 packed-stage viewport projector.

Output is palette *index bytes*, not RGB and not a verified gameplay screenshot.
Camera, row count, and bank start are explicit hypothetical parameters. Original
file is checked against its canonical hash; edits are bounded and reversible.
"""
from __future__ import annotations
import argparse
from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
import struct
import zlib
from mk2_packed_stage import (RESOURCES, STRIDE, VIEWPORT, EXE_SHA,
  STAGE_TABLE_OFFSET, resource_identity, replace_plane, write_new, require,
  QualificationError, sha)

BANK_LOOKUP_PHYSICAL=0xA1CD8
ANCHORS = {
  0x9e118:'f705d462050001000000',
  0x9e18b:'b80100000055e83078fcff5d',
  0x659e7:'0fb7e88a04c5065b07004825ff0000008b1485841000008b3cbde4570300',
  0x65a0f:'b950000000ad03c2abe2faa177740700030573740700a377740700c1f81081c5800300008bf52bf04b75d5',
}
@dataclass(frozen=True)
class Projection:
  data: bytes
  source_offsets: tuple[int,...]   # offsets within authenticated packed suffix per row
  width: int
  height: int
  camera_x: int
  palette_bank_start: int
  slope_16_16: int

def verify_exe(exe:bytes):
  require(len(exe)==861133 and sha(exe)==EXE_SHA, 'noncanonical MK2.EXE')
  for at,h in ANCHORS.items(): require(exe[at:at+len(h)//2].hex()==h, f'native code anchor missing 0x{at:x}')
  for i in range(256):
    require(struct.unpack_from('<I',exe,BANK_LOOKUP_PHYSICAL+4*i)[0]==i*0x01010101,
      f'EXE repeated-index table mismatch at {i}')
  return True

def signed32(u:int)->int:
  return (u&0xFFFFFFFF)-0x100000000 if u&0x80000000 else u&0xFFFFFFFF

def trunc_div(a:int,b:int)->int:
  require(b>0,'invalid divisor')
  return (abs(a)//b)*(1 if a>=0 else -1)

def camera_positions(rows:int,camera_x:int,height:int|None=None)->tuple[tuple[int,...],int]:
  require(type(rows)==int and rows>0,'invalid source rows')
  require(type(camera_x)==int,'camera must be integer')
  require(height is None or (type(height)==int and 1<=height<=rows),'invalid height')
  n=rows if height is None else height
  slope=trunc_div((288-camera_x)*65536,112)
  cursor=camera_x; accumulator=0; offsets=[]
  for r in range(n):
    require(0<=cursor-r*STRIDE<=STRIDE-VIEWPORT,
      f'viewport outside source row {r}; reduce row count or change camera')
    offsets.append(cursor)
    accumulator=(accumulator+slope)&0xFFFFFFFF
    cursor+=STRIDE-(signed32(accumulator)>>16)
  return tuple(offsets),slope

def project_plane(plane:bytes,rows:int,*,camera_x:int=288,bank_start:int=1,height:int|None=None)->Projection:
  require(len(plane)==rows*STRIDE,'packed suffix length mismatch')
  require(type(bank_start)==int and 1<=bank_start<=256,'hypothetical bank must be 1..256')
  positions,slope=camera_positions(rows,camera_x,height)
  correction=((bank_start-1)*0x01010101)&0xFFFFFFFF
  result=bytearray()
  for pos in positions:
    for x in range(0,VIEWPORT,4):
      v=int.from_bytes(plane[pos+x:pos+x+4],'little')
      result.extend(((v+correction)&0xFFFFFFFF).to_bytes(4,'little'))
  return Projection(bytes(result),positions,VIEWPORT,len(positions),camera_x,bank_start,slope)

def project_source(name:str,src:bytes,*,camera_x:int=288,bank_start:int=1,height:int|None=None,exe:bytes|None=None):
  _,_,ofs,rows=resource_identity(name,src)
  if exe is not None: verify_exe(exe)
  return project_plane(src[ofs:],rows,camera_x=camera_x,bank_start=bank_start,height=height)

def edit_projected(name:str,src:bytes,*,camera_x:int,bank_start:int,
                   x:int,y:int,width:int,height:int,new_index:int,
                   projection_height:int|None=None):
  """Paint the *simulated* displayed INDEX bytes, not literal RGB.

  Inverse DWORD arithmetic recovers exact source bytes. A one-output-byte
  change may require touching up to four source bytes, due to carry/borrow.
  """
  _,_,ofs,rows=resource_identity(name,src)
  require(all(type(v)==int for v in [x,y,width,height,new_index]),'integer rectangle and byte only')
  require(0<=new_index<=255 and 0<=x<VIEWPORT and 0<=y and width>0 and height>0,'invalid rectangle')
  view=project_plane(src[ofs:],rows,camera_x=camera_x,bank_start=bank_start,height=projection_height)
  require(x+width<=VIEWPORT and y+height<=view.height,'projection paint out of viewport bounds')
  modified=bytearray(src[ofs:]); before=bytearray(view.data)
  sub=((bank_start-1)*0x01010101)&0xffffffff
  for row in range(y,y+height):
    pos=view.source_offsets[row]
    for word_index in range((x//4)*4,((x+width+3)//4)*4,4):
      current=bytearray(before[row*VIEWPORT+word_index:row*VIEWPORT+word_index+4])
      for local in range(4):
        if x<=word_index+local<x+width:current[local]=new_index
      undo=(int.from_bytes(current,'little')-sub)&0xffffffff
      modified[pos+word_index:pos+word_index+4]=undo.to_bytes(4,'little')
  output,receipt=replace_plane(name,src,bytes(modified))
  projected=project_plane(output[ofs:],rows,camera_x=camera_x,bank_start=bank_start,height=projection_height)
  expected=bytearray(view.data)
  for row in range(y,y+height):expected[row*VIEWPORT+x:row*VIEWPORT+x+width]=bytes([new_index])*width
  require(projected.data==bytes(expected),'inverse paint failed to reproduce expected simulated viewport')
  receipt['projectionParameters']={'cameraX':camera_x,'hypotheticalPaletteBankStart':bank_start,
    'outputHeight':view.height,'rectangle':[x,y,width,height], 'sourceOutputIndex':new_index,
    'priorProjectedSha256':sha(view.data),'editedProjectedSha256':sha(projected.data),
    'semanticLimit':'SIMULATED_INDEX_VIEWPORT_NOT_RUNTIME_GAMEPLAY_RGB'}
  return output,receipt,view,projected


def diagnostic_grayscale_png(view:Projection)->bytes:
  """Lossless gray8 rendering of index numbers; NOT reconstructed VGA RGB."""
  require(len(view.data)==view.width*view.height,'invalid projection for diagnostic export')
  def chunk(tag:bytes,payload:bytes)->bytes:
    return struct.pack('>I',len(payload))+tag+payload+struct.pack('>I',zlib.crc32(tag+payload)&0xFFFFFFFF)
  header=struct.pack('>IIBBBBB',view.width,view.height,8,0,0,0,0)
  lines=b''.join(b'\x00'+view.data[i*view.width:(i+1)*view.width] for i in range(view.height))
  return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',header)+chunk(b'IDAT',zlib.compress(lines,9))+chunk(b'IEND',b'')

def main():
  p=argparse.ArgumentParser(description=__doc__)
  sub=p.add_subparsers(dest='command',required=True)
  a=sub.add_parser('project');a.add_argument('original');a.add_argument('output');a.add_argument('--exe');a.add_argument('--camera-x',type=int,default=288);a.add_argument('--bank-start',type=int,default=1);a.add_argument('--rows',type=int);a.add_argument('--report');a.add_argument('--diagnostic-png',help='Grayscale of index values ONLY; not original game colors')
  b=sub.add_parser('paint-projection');b.add_argument('original');b.add_argument('output');b.add_argument('receipt');b.add_argument('--camera-x',type=int,default=288);b.add_argument('--bank-start',type=int,default=1);b.add_argument('--rows',type=int);b.add_argument('--x',type=int,required=True);b.add_argument('--y',type=int,required=True);b.add_argument('--width',type=int,required=True);b.add_argument('--height',type=int,required=True);b.add_argument('--value',type=int,required=True)
  args=p.parse_args()
  original=Path(args.original)
  if args.command=='project':
    v=project_source(original.name,original.read_bytes(),camera_x=args.camera_x,bank_start=args.bank_start,height=args.rows,exe=Path(args.exe).read_bytes() if args.exe else None)
    report={'format':'mk2_o112_hypothetical_viewport_v1','resource':original.name,
      'cameraX':v.camera_x,'hypotheticalPaletteBankStart':v.palette_bank_start,
      'sourceOffsetsInSuffix':list(v.source_offsets),'slope16_16':v.slope_16_16,
      'width':v.width,'height':v.height,'outputSha256':sha(v.data),
      'limitation':'INDEX_BYTES_ONLY_NOT_RUNTIME_SCREEN_OR_PALETTE'}
    targets=[Path(args.output)]+([Path(args.report)] if args.report else [])+([Path(args.diagnostic_png)] if args.diagnostic_png else [])
    require(len({p.resolve() for p in targets})==len(targets),'project output paths must differ')
    require(all(not p.exists() for p in targets),'output already exists')
    write_new(Path(args.output),v.data)
    if args.report:write_new(Path(args.report),(json.dumps(report,indent=2)+'\n').encode())
    if args.diagnostic_png:write_new(Path(args.diagnostic_png),diagnostic_grayscale_png(v))
    print(json.dumps(report,indent=2))
  else:
    require(Path(args.output).resolve()!=Path(args.receipt).resolve(),'patched file and receipt paths collide')
    require(not Path(args.output).exists() and not Path(args.receipt).exists(),'output already exists')
    output,receipt,before,after=edit_projected(original.name,original.read_bytes(),camera_x=args.camera_x,bank_start=args.bank_start,
      projection_height=args.rows,x=args.x,y=args.y,width=args.width,height=args.height,new_index=args.value)
    write_new(Path(args.output),output)
    write_new(Path(args.receipt),(json.dumps(receipt,indent=2)+'\n').encode())
    print(json.dumps({'changedSourceBytes':receipt['changedCount'],'simulatedViewportSha256':sha(after.data),'receipt':str(args.receipt)},indent=2))
if __name__=='__main__':main()
