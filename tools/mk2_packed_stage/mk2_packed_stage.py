#!/usr/bin/env python3
"""Fail-closed, source-relative MK2 packed-stage GRA utility (O111).

This edits the authenticated EOF suffix at 896-byte *source* stride.
It does not infer screen pixels, stage palette, gameplay camera, or a full
scene bitmap. Strictly requires canonical source hash for each resource.
Outputs are written to NEW paths, never in-place. No bundled game data.
"""
from __future__ import annotations
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import struct

EXE_SHA = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
STAGE_TABLE_OFFSET=0xCFBAC
STRIDE=896
VIEWPORT=320
LEFT_MARGIN=288
# Exact source identities are from the user's canonical mk2.zip; not derived
# from filenames alone. Tuple (resource id, packed suffix start, rows, sha256).
RESOURCES = {
 'tomb.gra':   (28, 63776, 48, 'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613'),
 'battle.gra': (34, 59436, 40, 'ebc7cb5170ec8927f87b726a0d4e7f99a1dce1de615d4fd493fd38680be0be63'),
 'tower.gra':  (30, 56268, 64, '7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8'),
 'forest.gra': (27, 198116,32, '8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9'),
 'armory.gra': (26, 126336,56, 'fb68c5fb70267dc64cf176056c7711f43973f9b8b8a2e53513f43afc7c56c612'),
 'portal.gra': (25, 56916, 40, 'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82'),
 'arena.gra':  (31, 90488, 40, '37a3e8fa89ae55e7d03d88a8890eb51ea7df2ccbff71ccf5cdea4a2c647b0bfb'),
}
TABLE_NAMES=['tomb.gra','battle.gra','tower.gra','forest.gra','armory.gra',None,'portal.gra','arena.gra']
DOMAIN='MK2_AUTHENTIC_PACKED_GRA_SUFFIX_896_STRIDE'

class QualificationError(ValueError): pass

def sha(b: bytes)->str: return hashlib.sha256(b).hexdigest()

def require(cond: bool, message: str):
 if not cond: raise QualificationError(message)

def resource_identity(name: str, data: bytes, *, canonical: bool=True):
 key=Path(name).name.lower()
 require(key in RESOURCES, f'unsupported file name {name!r}; no guessed resource locations')
 rid, offset, rows, expected = RESOURCES[key]
 require(len(data)==offset+rows*STRIDE, 'unexpected resource size/packed suffix geometry')
 if canonical: require(sha(data)==expected, f'{key}: canonical SHA-256 mismatch; refusing to edit')
 return key, rid, offset, rows

def verify_native_reference(exe:bytes):
 require(len(exe)==861133 and sha(exe)==EXE_SHA, 'not the canonical source MK2.EXE')
 for slot,name in enumerate(TABLE_NAMES):
  actual=struct.unpack_from('<I',exe,STAGE_TABLE_OFFSET+slot*4)[0]
  expected=0 if name is None else (RESOURCES[name][0]<<24)|RESOURCES[name][1]
  require(actual==expected,f'original native pointer mismatch at slot {slot}')
 return True

def row_profile(data: bytes,offset:int,rows:int):
 suffix=data[offset:]
 freq=Counter(suffix)
 return {
  'packedSourceOffset':offset, 'sourceStride':STRIDE,'sourceRows':rows,
  'packedLength':len(suffix),'sourceSha256':sha(data),
  'packedSha256':sha(suffix),'prefixSha256':sha(data[:offset]),
  'valueDomain':{'min':min(freq),'max':max(freq),'distinct':len(freq),'top12':freq.most_common(12)},
  'rowSha256':[sha(suffix[i*STRIDE:(i+1)*STRIDE]) for i in range(rows)],
  'inner320Sha256':[sha(suffix[i*STRIDE+LEFT_MARGIN:i*STRIDE+LEFT_MARGIN+VIEWPORT]) for i in range(rows)],
  'outer576Sha256':[sha(suffix[i*STRIDE:i*STRIDE+LEFT_MARGIN]+suffix[i*STRIDE+LEFT_MARGIN+VIEWPORT:(i+1)*STRIDE]) for i in range(rows)]
 }

def inspect(name:str, data:bytes, *,exe:bytes|None=None):
 key,rid,offset,rows=resource_identity(name,data)
 if exe is not None:verify_native_reference(exe)
 return {'format':'mk2_packed_suffix_inspection_v1','researchBoundary':'SOURCE_PLANE_NOT_VERIFIED_GAMEPLAY_RGBA',
  'resource':key,'resourceId':rid,'packedPointer':(rid<<24)|offset,
  'exePointerTableChecked':exe is not None,**row_profile(data,offset,rows)}

def replace_plane(name:str, original:bytes, replacement:bytes):
 key,rid,offset,rows=resource_identity(name,original)
 require(len(replacement)==rows*STRIDE, f'wrong replacement plane size: expected {rows*STRIDE}')
 output=original[:offset]+replacement
 require(len(output)==len(original),'modified resource must preserve file size')
 require(output[:offset]==original[:offset],'prefix modification forbidden')
 require(output[offset:]==replacement,'replacement bytes not exact')
 diffs=[offset+i for i,(a,b) in enumerate(zip(original[offset:],replacement)) if a!=b]
 receipt={'format':'mk2_packed_stage_reversible_receipt_v1','domain':DOMAIN,'resource':key,
  'canonicalExeSha256':EXE_SHA,'canonicalResourceSha256':sha(original),
  'packedOffset':offset,'sourceRows':rows,'sourceStride':STRIDE,
  'originalPrefixSha256':sha(original[:offset]),'originalPlaneSha256':sha(original[offset:]),
  'patchedResourceSha256':sha(output),'patchedPlaneSha256':sha(replacement),
  'changedCount':len(diffs),'changedInterval':[min(diffs),max(diffs)+1] if diffs else None,
  'restoreOriginalPlaneHex':original[offset:].hex(),
  'claims':{'editorScope':'AUTHENTIC_SOURCE_SUFFIX_ONLY','palette':'UNRESOLVED','screenPlacement':'UNRESOLVED'}}
 return output,receipt

def paint_region(name:str, original:bytes, *,x:int,y:int,width:int,height:int,value:int):
 _,_,offset,rows=resource_identity(name,original)
 require(all(type(n) is int for n in (x,y,width,height,value)),'integer arguments required')
 require(0<=x<STRIDE and 0<=y<rows and width>0 and height>0,'invalid source rectangle')
 require(x+width<=STRIDE and y+height<=rows,'source rectangle outside authenticated region')
 require(0<=value<=255,'index byte must be 0..255')
 plane=bytearray(original[offset:])
 for yy in range(y,y+height): plane[yy*STRIDE+x:yy*STRIDE+x+width]=bytes([value])*width
 return replace_plane(name,original,bytes(plane))

def restore(name:str, patched:bytes, receipt:dict):
 key,rid,offset,rows=resource_identity(name,patched,canonical=False)
 require(receipt.get('format')=='mk2_packed_stage_reversible_receipt_v1' and receipt.get('domain')==DOMAIN,'invalid receipt schema/domain')
 require(receipt.get('resource')==key and receipt.get('packedOffset')==offset and receipt.get('sourceRows')==rows and receipt.get('sourceStride')==STRIDE,'receipt refers to a different resource or geometry')
 require(receipt.get('canonicalExeSha256')==EXE_SHA and receipt.get('canonicalResourceSha256')==RESOURCES[key][3], 'receipt source not canonical')
 require(sha(patched)==receipt.get('patchedResourceSha256') and sha(patched[offset:])==receipt.get('patchedPlaneSha256'),'modified file digest mismatch; refusal to restore')
 require(sha(patched[:offset])==receipt.get('originalPrefixSha256'),'prefix modified; refusal to restore')
 raw=receipt.get('restoreOriginalPlaneHex')
 require(isinstance(raw,str) and len(raw)==rows*STRIDE*2,'missing or malformed restoration data')
 try: plane=bytes.fromhex(raw)
 except ValueError as exc:raise QualificationError('corrupt receipt hex') from exc
 require(sha(plane)==receipt.get('originalPlaneSha256'),'restoration payload checksum mismatch')
 original=patched[:offset]+plane
 require(sha(original)==RESOURCES[key][3],'restoration did not match canonical original')
 require(sum(a!=b for a,b in zip(original,patched))==receipt.get('changedCount'),'changed-count mismatch')
 return original

def write_new(path:Path,data:bytes):
 require(not path.exists(),f'refusing to overwrite existing path {path}')
 path.parent.mkdir(parents=True,exist_ok=True)
 # exclusive create avoids accidental overwrite through CLI; no in-place edits.
 with path.open('xb') as f:f.write(data)

def main():
 ap=argparse.ArgumentParser(description=__doc__)
 sub=ap.add_subparsers(dest='command',required=True)
 i=sub.add_parser('inspect');i.add_argument('original');i.add_argument('--exe');i.add_argument('--report')
 e=sub.add_parser('export-plane');e.add_argument('original');e.add_argument('output');e.add_argument('--report')
 r=sub.add_parser('replace-plane');r.add_argument('original');r.add_argument('plane');r.add_argument('output');r.add_argument('receipt')
 p=sub.add_parser('paint');p.add_argument('original');p.add_argument('output');p.add_argument('receipt');p.add_argument('--x',type=int,required=True);p.add_argument('--y',type=int,required=True);p.add_argument('--width',type=int,required=True);p.add_argument('--height',type=int,required=True);p.add_argument('--value',type=int,required=True)
 u=sub.add_parser('restore');u.add_argument('patched');u.add_argument('receipt');u.add_argument('output')
 a=ap.parse_args();orig=Path(getattr(a,'original',getattr(a,'patched','')))
 if a.command=='inspect':
  info=inspect(orig.name,orig.read_bytes(),exe=Path(a.exe).read_bytes() if a.exe else None)
  if a.report:write_new(Path(a.report),(json.dumps(info,indent=2)+'\n').encode())
  print(json.dumps({k:v for k,v in info.items() if not k.endswith('Sha256') or k in ['sourceSha256','packedSha256']},indent=2))
 elif a.command=='export-plane':
  src=orig.read_bytes(); info=inspect(orig.name,src)
  write_new(Path(a.output),src[info['packedSourceOffset']:]);
  if a.report:write_new(Path(a.report),(json.dumps(info,indent=2)+'\n').encode())
  print(f"Extracted {info['packedLength']} authentic source-plane bytes; not an RGBA image")
 elif a.command in ('replace-plane','paint'):
  src=orig.read_bytes()
  if a.command=='replace-plane': output,receipt=replace_plane(orig.name,src,Path(a.plane).read_bytes())
  else:output,receipt=paint_region(orig.name,src,x=a.x,y=a.y,width=a.width,height=a.height,value=a.value)
  require(Path(a.output).resolve()!=Path(a.receipt).resolve(),'output and receipt paths must differ')
  require(not Path(a.output).exists() and not Path(a.receipt).exists(),'output files must not already exist')
  write_new(Path(a.output),output);write_new(Path(a.receipt),(json.dumps(receipt,indent=2)+'\n').encode())
  print(json.dumps({k:receipt[k] for k in ['resource','changedCount','changedInterval','patchedResourceSha256']},indent=2))
 else:
  rec=json.loads(Path(a.receipt).read_text())
  # A patched file may be named 'edited.gra' outside a DOS install; the
  # receipt carries its original resource name and is digest-validated.
  data=restore(rec.get('resource',''),orig.read_bytes(),rec)
  write_new(Path(a.output),data)
  print('Restored source-identical file:',sha(data))

if __name__=='__main__': main()
