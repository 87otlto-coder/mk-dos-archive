#!/usr/bin/env python3
"""Independent O137 Tower animation audit: no producer import."""
import argparse,hashlib,json,struct,zipfile
from pathlib import Path
from PIL import Image
EX='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
GRA_SHA='7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8'
OBJ1=0x61c54;OBJ2=0xa0c54
def sha(data):return hashlib.sha256(data).hexdigest()
def chk(ok,why):
 if not ok:raise AssertionError('O137 independent: '+why)
def u32(b,p):return struct.unpack_from('<I',b,p)[0]
def render_sprite(data,first,w,h):
 ix=bytearray(w*h);a=bytearray(w*h);p=first
 for y in range(h):
  x=0
  while x<w:
   chk(p+4<=len(data),'invalid source command');word=u32(data,p);p+=4
   if word&1:n=word>>1
   elif word&2:
    n=word>>10;v=(word>>2)&255
    chk(n>0 and n<=w-x,'RLE row');
    for i in range(n):ix[y*w+x+i]=v;a[y*w+x+i]=1
   else:
    n=word>>2;chk(0<n<=64 and p+n<=len(data),'literal boundary')
    for i in range(n):ix[y*w+x+i]=data[p+i];a[y*w+x+i]=1
    p+=(n+3)&~3
   chk(n>0 and n<=w-x,'sprite row overrun');x+=n
 return bytes(ix),bytes(a),p

def color_words(exe):
 start=0x89468;chk(struct.unpack_from('<H',exe,start)[0]==80,'palette record count')
 out={}
 for i in range(80):
  word=struct.unpack_from('<H',exe,start+2+2*i)[0]
  channels=[((word>>9)&63)|1,((word>>4)&63)|1,((word<<1)&63)|1]
  out[i+1]=tuple((v<<2)|(v>>4) for v in channels)
 return out

def audit(exe,gamezip,folder,manifest=None):
 n=0
 def test(value,why):
  nonlocal n;chk(value,why);n+=1
 test(sha(exe)==EX,'original executable')
 if manifest is None:manifest=json.loads((folder/'O137_TOWER_SOURCE_FRAMES.json').read_text())
 test(manifest['schema']=='mk2_o137_tower_conditional_original_effect_frames_v1','schema')
 test(manifest['status']=='PASS_TOWER_SOURCE_FRAMES_STATIC_PALETTE_CANDIDATE','status')
 test(manifest['originalExeSHA256']==EX,'reported EXE hash')
 test(manifest['sourceFrameListObject2']==0x16490,'frame list pointer')
 test(manifest['originalSourceFrameCount']==7 and len(manifest['frames'])==7,'frame count')
 test(manifest['originalSequenceControl']=={'endMarker':1,'loopBackTo':0x16490},'source loopback')
 test(u32(exe,OBJ2+0x16490+28)==1 and u32(exe,OBJ2+0x16490+32)==0x16490,'original command list control tokens')
 test(manifest['palette']['sourceRecordPhysical']==0x89468 and manifest['palette']['originalCount']==80,'palette record metadata')
 test(manifest['palette']['setupObject2']==0x1795c and manifest['palette']['palettePointerTableObject2']==0x17a18,'setup pointer source')
 test(u32(exe,OBJ2+0x1795c+0xe)==0x17a18,'original setup pointer')
 for j in range(7):test(u32(exe,OBJ2+0x17a18+j*4)==0x27814,'original palette pointer')
 test(manifest['palette']['gameplayPaletteSelectionVerified'] is False,'forged palette gameplay claim')
 test(manifest['limits']['actualFPSKnown'] is False,'forged timing')
 test(manifest['limits']['liveRoutineExecutionObserved'] is False,'forged runtime activation')
 test(manifest['limits']['inGameObjectPlacementRecovered'] is False,'forged world-space location')
 test(exe[0x82e6c:0x82e72]==bytes.fromhex('c7056c5a0700') and u32(exe,0x82e72)==0x16490,'source list writer')
 test(exe[0x82e38:0x82e3f]==bytes.fromhex('833d4c01030000') and exe[0x82e54:0x82e5b]==bytes.fromhex('833d4c01030001'),'stage mode branch')
 # Original EXE resource registry, independently parsed.
 registry=[v for v in exe[0xa0ef1:0xa13a7].split(b'\0') if v]
 test(registry[30]==b'TOWER.GRA','original registry ID 30')
 with zipfile.ZipFile(gamezip) as z:
  match=[p for p in z.namelist() if p.lower().endswith('/tower.gra')]
  test(len(match)==1,'single original Tower source');gra=z.read(match[0])
 test(sha(gra)==GRA_SHA and manifest['originalGRA_SHA256']==GRA_SHA,'original GRA bytes')
 colors=color_words(exe);paths={'O137_TOWER_SOURCE_FRAMES.json'};end=None
 for i,row in enumerate(manifest['frames']):
  test(row['frameOrdinal']==i,'source order')
  entry=0x16490+4*i;desc=u32(exe,OBJ2+entry)
  test(row['originalPointerEntryObject2']==entry and row['originalDescriptorObject2']==desc,'source pointer')
  w,ht,x,y,packed=struct.unpack_from('<HHhhI',exe,OBJ2+desc)
  test(packed>>24==30 and row['resourceId']==30 and row['resourceName']=='TOWER.GRA','packed source resource')
  start=packed&0xffffff;idx,mask,stop=render_sprite(gra,start,w,ht)
  test(row['sourceOffset']==start and row['sourceEndExclusive']==stop,'source byte span')
  test(end is None or end==start,'consecutive source frames')
  end=stop
  test((row['originalWidth'],row['originalHeight'],row['originalX'],row['originalY'])==(w,ht,x,y),'source descriptor geometry')
  test(row['sourceStreamSHA256']==sha(gra[start:stop]),'source stream fingerprint')
  test(row['indicesSHA256']==sha(idx),'index fingerprint')
  test(row['maskSHA256']==sha(mask),'mask fingerprint')
  test(row['sourceOpaquePixels']==sum(mask),'count')
  prefix=f'tower_original_effect/frame_{i:02d}'
  names=[prefix+'.png',prefix+'.indices.bin',prefix+'.mask.bin']
  test(row['paths']==names,'output path identity')
  for path in names:test((folder/path).is_file(),'missing file '+path);paths.add(path)
  test((folder/names[1]).read_bytes()==idx,'exact original indices')
  test((folder/names[2]).read_bytes()==mask,'exact original mask')
  png=(folder/names[0]).read_bytes()
  test(sha(png)==row['pngSHA256'],'PNG fingerprint')
  image=Image.open(folder/names[0]).convert('RGBA');test(image.size==(w,ht),'PNG dimensions')
  expected=bytearray()
  for value,opaque in zip(idx,mask):expected.extend((*colors[value],255) if opaque else (0,0,0,0))
  test(sha(bytes(expected))==row['rgbaSHA256'],'RGBA hash')
  test(image.tobytes()==bytes(expected),'PNG pixel agreement')
 test(manifest['frames'][0]['sourceOffset']==0x9f48 and end==0xdbcc,'source range')
 test({str(p.relative_to(folder)) for p in folder.rglob('*') if p.is_file()}==paths,'manifest covers all files')
 return {'status':'PASS_O137_INDEPENDENT_TOWER_SOURCE_FRAMES','checks':n,'sourceFrameCount':7,'files':len(paths)}
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True,type=Path);a.add_argument('--game-zip',required=True,type=Path);a.add_argument('--folder',required=True,type=Path);a.add_argument('--out',type=Path);r=a.parse_args()
 result=audit(r.exe.read_bytes(),r.game_zip,r.folder)
 if r.out:
  chk(not r.out.exists(),'refusing to overwrite output');r.out.write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps(result))
