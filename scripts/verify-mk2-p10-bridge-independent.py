#!/usr/bin/env python3
"""Independent P10 parity against original O220 descriptor/RLE/palette equations.
No video fitting, no app decoder imports, does not infer animation timing.
"""
import json,struct,hashlib,sys,zipfile,io
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw

game,export,report,preview=map(Path,sys.argv[1:5])
exe=(game/'mk2.exe').read_bytes();gra=(game/'pit.gra').read_bytes()
sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
assert sha(gra)=='af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96'
assert struct.unpack_from('<H',exe,0x895ac)[0]==81
pal=[(0,0,0)]
for i in range(1,82):
 word=struct.unpack_from('<H',exe,0x895ac+2*i)[0]
 cs=[((word>>9)&63)|1,((word>>4)&63)|1,((word<<1)&63)|1]
 pal.append(tuple((c<<2)|(c>>4) for c in cs))
phis=[0xb98e4,0xb98f4]+[0xb9900+12*i for i in range(5)]+[0xb993c,0xb994c]+[0xb9958+12*i for i in range(5)]
checks=0
with zipfile.ZipFile(export) as z:
 manifest=json.loads(z.read('manifest.json'))
 assert len(manifest['originalFrameLists'])==2 and len(manifest['frames'])==14;checks+=1
 atlas=Image.new('RGB',(7*100,2*130),(32,35,40));draw=ImageDraw.Draw(atlas)
 for i,off in enumerate(phis):
  w,h,x,y,packed=struct.unpack_from('<HHhhI',exe,off)
  assert (w,h,x,y,packed>>24)==(16,24 if i<7 else 32,0,0,32)
  offset=packed&0xffffff
  raw=bytearray(w*h);mask=bytearray(w*h);at=offset
  for row in range(h):
   col=0
   while col<w:
    command=struct.unpack_from('<I',gra,at)[0];at+=4
    if command&1: length=command>>1
    elif command&2:
     length=command>>10
     for col2 in range(col,col+length):raw[row*w+col2]=(command>>2)&255;mask[row*w+col2]=1
    else:
     length=command>>2
     raw[row*w+col:row*w+col+length]=gra[at:at+length]
     mask[row*w+col:row*w+col+length]=bytes([1])*length
     at+=(length+3)&~3
    assert length>0 and col+length<=w
    col+=length
  entry=manifest['frames'][i]
  assert (entry['originalDescriptorPhysical'],entry['originalGraOffset'],entry['originalEncodedEndExclusive'])==(off,offset,at);checks+=1
  assert z.read(entry['paths']['indices'])==raw;checks+=1
  assert z.read(entry['paths']['mask'])==mask;checks+=1
  rgba=bytes(channel for p in range(w*h) for channel in (*pal[raw[p]],255 if mask[p] else 0))
  png=Image.open(io.BytesIO(z.read(entry['paths']['png']))).convert('RGBA')
  assert png.size==(w,h) and png.tobytes()==rgba;checks+=1
  tile=png.resize((w*4,h*3),resample=Image.Resampling.NEAREST)
  back=Image.new('RGBA',tile.size,(55,58,67,255));back.alpha_composite(tile)
  xx=(i%7)*100+18;yy=(i//7)*130+20
  atlas.paste(back.convert('RGB'),(xx,yy));draw.text(((i%7)*100+12,(i//7)*130+5),f'{"Green" if i<7 else "Flame"} {i%7+1}',fill=(235,230,215))
 # Check original pointer-list order without reusing TS code
 for g,start in enumerate((0x18afc,0x18b20)):
  original=[struct.unpack_from('<I',exe,0xa0c54+start+4*n)[0] for n in range(9)]
  expect=[p-0xa0c54 for p in phis[g*7:(g+1)*7]]+[1,start]
  assert original==expect;checks+=1
  assert manifest['originalFrameLists'][g]['orderedFrameOrdinals']==list(range(7*g,7*g+7));checks+=1
 atlas.save(preview)
result={'status':'PASS','checks':checks,'source':'Original O220 independently implemented sprite RLE and palette equations; O221 original pointer loop values',
 'originalSourcedFrames':14,'originalLists':2,'PNGRGBAExact':True,'sourceIndexAndMaskExact':True,'loopOrderExact':True,
 'nativePresentationTimingClaimed':False,'archiveSha256':sha(export.read_bytes())}
report.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
