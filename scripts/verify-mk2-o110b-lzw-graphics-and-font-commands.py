#!/usr/bin/env python3
"""Independent O110B verifier: Pillow's separate GIF decoder + native file/palette boundaries.
This does NOT import the producer or its LZW implementation.
"""
import io,sys,json,struct,zipfile,hashlib,itertools,collections
from pathlib import Path
from PIL import Image
fixture=Path(sys.argv[1]);pkg=Path(sys.argv[2]);sha=lambda d:hashlib.sha256(d).hexdigest();checks=0
mdata=None
with zipfile.ZipFile(pkg) as z:
 assert z.testzip() is None;checks+=1
 m=json.loads(z.read('MANIFEST_O110B.json'))
 assert m['format']=='mk2_lzw31_and_font_command_tape_o110b';checks+=1
 for name,num in [('probe',30),('acclaim',1)]:
  b=(fixture/(name+'.gra')).read_bytes();d=m['resources'][name+'.gra'];checks+=1
  assert z.read(name+'/ORIGINAL.GRA')==b;checks+=len(b)
  assert d['sourceSha256']==sha(b) and d['sourceBytes']==len(b);checks+=2
  assert len(d['frames'])==num;checks+=1
  palregion=z.read(name+'/palette_original_words.bin')
  assert palregion==b[4:d['frames'][0]['frameHeaderStart']];checks+=len(palregion)
  palrgb=z.read(name+'/palette_555_CANDIDATE.rgb24')
  assert len(palrgb)==768;checks+=1
  for i in range(256):
   native=struct.unpack_from('<H',b,4+i*2)[0]; rgb=((native>>10&31)*255//31,(native>>5&31)*255//31,(native&31)*255//31)
   assert palrgb[3*i:3*i+3]==bytes(rgb);checks+=3
  cur=d['frames'][0]['frameHeaderStart']
  for idx,e in enumerate(d['frames']):
   assert e['ordinal']==idx and e['frameHeaderStart']==cur;checks+=2
   assert b[cur:cur+4]==b'\x40\x01\xc8\x00' and e['compressedStart']==cur+4;checks+=2
   q=cur+4;assert b[q]==8;checks+=1
   p=q+1;nsubs=0;finished=False
   while p<len(b):
    n=b[p];p+=1;nsubs+=1
    if n==0:finished=True;break
    assert p+n<=len(b);checks+=1;p+=n
   assert p==e['compressedEnd'];checks+=1
   assert nsubs==e['subblockCount'];checks+=1
   assert finished==e['terminatedByZeroSubblock'];checks+=1
   wrapped=(b'GIF89a'+struct.pack('<HHBBB',320,200,0xf7,0,0)+bytes(i for i in range(256) for _ in range(3))+b'\x2c'+struct.pack('<HHHHB',0,0,320,200,0)+b[q:p]+(b'' if finished else b'\0')+b'\x3b')
   pix=Image.open(io.BytesIO(wrapped));pix.load();vals=pix.convert('P').tobytes()
   assert len(vals)==64000;checks+=1
   pngname=e['pngMember'];idxname=e['pixelMember']
   assert z.read(idxname)==vals;checks+=64000
   assert sha(vals)==e['pixelsSha256'];checks+=1
   pngbytes=z.read(pngname);assert sha(pngbytes)==e['pngSha256'];checks+=1
   png=Image.open(io.BytesIO(pngbytes));png.load();rgb=png.convert('RGB').tobytes()
   assert png.size==(320,200);checks+=1
   for j,i in enumerate(vals):
    assert rgb[j*3:j*3+3]==palrgb[3*i:3*i+3];checks+=1
   assert e['maxPaletteIndex']==max(vals) and e['usedPaletteIndices']==len(set(vals));checks+=2
   cur=p
   if idx<num-1:
    assert b[cur:cur+e['paddingAfter']]==bytes(e['paddingAfter']);checks+=e['paddingAfter']
    cur+=e['paddingAfter']
  assert cur==len(b);checks+=1
 # FONTS independent grammar parse; verify byte range/stream integrity, every opcode pixel, mask
 font=(fixture/'fonts.gra').read_bytes();cut=103840;part=font[:cut];ed=m['fontPrefix'];checks+=1
 assert z.read('fonts/unqualified_prefix_original.bin')==part;checks+=cut
 pix=z.read('fonts/linear_index_tape.idx8');mask=z.read('fonts/linear_mask_tape.mask8');tokens=json.loads(z.read('fonts/command_boundaries.json'))
 assert len(tokens)==ed['commands']==13981 and len(pix)==len(mask)==ed['expandedPixelCount']==135716;checks+=3
 at=0;endpx=0
 for t in tokens:
  assert at==t['byteStart'];checks+=1
  v=struct.unpack_from('<I',part,at)[0];at+=4
  if v%2: amount=v//2;mode='transparent';data=bytes(amount);alpha=bytes(amount);color=None
  elif v%4==2:amount=v>>10;mode='repeat';color=(v>>2)&255;data=bytes([color])*amount;alpha=bytes([1])*amount
  else:
   amount=v>>2;mode='literal';color=None;data=part[at:at+amount];alpha=bytes([1])*amount;at+=((amount+3)//4)*4
  assert 0<amount<=109 and (mode=='transparent' or amount<=64);checks+=2
  assert t['byteEnd']==at and t['operation']==mode and t['pixels']==amount and t['repeatIndex']==color;checks+=4
  assert pix[endpx:endpx+amount]==data and mask[endpx:endpx+amount]==alpha;checks+=amount
  endpx+=amount
 assert at==cut and endpx==len(pix);checks+=2
 assert sha(part)==ed['sourceSha256'] and sha(pix)==ed['indexSha256'] and sha(mask)==ed['maskSha256'];checks+=3
 assert ed['streamsKnown'] is False and ed['fontConversionQualified'] is False;checks+=2
 # CAVE prefix parse with native control grammar
 cave=(fixture/'cave.gra').read_bytes()[:120];ci=z.read('cave/prefix_linear_46.idx8');cm=z.read('cave/prefix_linear_46.mask8');cw=m['cavePrefix']
 assert z.read('cave/prefix_120_original.bin')==cave;checks+=120
 at=0;pixels=bytearray();alpha=bytearray();tokens=0
 while at<120:
  cmd=int.from_bytes(cave[at:at+4],'little');at+=4;tokens+=1
  if cmd&1:n=cmd>>1;pixels+=bytes(n);alpha+=bytes(n)
  elif cmd&2:n=cmd>>10;pixels+=bytes([(cmd>>2)&255])*n;alpha+=bytes([1])*n
  else:n=cmd>>2;pixels+=cave[at:at+n];alpha+=bytes([1])*n;at+=(n+3)&~3
 assert at==120 and tokens==18 and len(pixels)==46;checks+=3
 assert pixels==ci and alpha==cm and cw['opaquePixels']==sum(cm) and cw['ownerQualified'] is False;checks+=len(pixels)+2
 # MONKS 608 little-endian transparent-run opcodes; all other semantics held
 monks=(fixture/'monks.gra').read_bytes();v=struct.unpack('<608I',monks);runs=[{'commandValue':k,'transparentRunPixels':k//2,'repeatCount':len(list(g))} for k,g in itertools.groupby(v)]
 assert len(monks)==2432 and all(k%2==1 for k in v);checks+=len(v)+1
 assert runs==json.loads(z.read('monks/transparent_opcode_runs.json'))==m['monksOpcodeRuns']['runs'];checks+=len(v)
 assert m['monksOpcodeRuns']['meaningKnown'] is False;checks+=1
 assert m['verification']['unknownSemanticsNotPromoted'] is True;checks+=1
print(json.dumps({'status':'PASS','checks':checks,'frameCount':31,'probeFrames':30,'fontCommands':13981,'fontPixelTape':135716,'imagePixels':1984000,'losslessNativePreserved':True}))
