#!/usr/bin/env python3
"""Independent binary/instruction/source-idx->DAC6 and both presentation variants verifier; does not import producer."""
import sys,zipfile,struct,hashlib,json,io
from pathlib import Path
from PIL import Image
exe=Path(sys.argv[1]).read_bytes();game=Path(sys.argv[2]);zsrc=zipfile.ZipFile(sys.argv[3]);z=zipfile.ZipFile(sys.argv[4]);j=json.loads(Path(sys.argv[5]).read_text());checks=0
sha=lambda b:hashlib.sha256(b).hexdigest()
def ck(ok,why):
 global checks
 checks+=1
 if not ok:raise AssertionError(why)
ck(z.testzip() is None,'asset ZIP');ck(sha(exe)==j['exeSha256'],'exact executable')
# Authenticate disassembled instructions as raw opcode slices; source colors untouched.
for addr,raw in [(0x7b3b1,'66ad'),(0x7b3b5,'c1e809'),(0x7b3b8,'243f'),(0x7b3ba,'0c01'),(0x7b3bc,'ee'),(0x7b3c1,'c1e804'),(0x7b3c4,'243f'),(0x7b3c6,'0c01'),(0x7b3c8,'ee'),(0x7b3cd,'d1e0'),(0x7b3cf,'243f'),(0x7b3d1,'0c01'),(0x7b3d3,'ee'),(0x98c59,'0fb74ffe'),(0x98c84,'0fb604d5065b0700'),(0x7b453,'ba01000000'),(0x7b33a,'bac8030000'),(0x7b341,'ee'),(0x7b4b1,'8814dd065b0700'),(0x64659,'e8c16d0100')]:ck(exe[addr:addr+len(raw)//2].hex()==raw,f'exe inst {addr:#x}')
for src,dst in ((0x98c65,0x7b439),(0x98c79,0x7b439),(0x64659,0x7b41f)):
 ck(exe[src]==0xe8 and src+5+struct.unpack_from('<i',exe,src+1)[0]==dst,f'code link {src:#x}')
manifest=json.loads(z.read('MANIFEST_O110E.json'));ck(manifest==j,'provenance is packaged manifest')
m110b=json.loads(zsrc.read('MANIFEST_O110B.json'))
gif=Image.open(io.BytesIO(z.read('probe/PROBE_TIMING_BLACK_INDEX0_ILLUSTRATIVE_20MS_TICK.gif')));ck(gif.n_frames==30,'gif frames')
for res in ('probe','acclaim'):
 stem=res+'.gra';b=(game/stem).read_bytes();row=j['resources'][stem]
 ck(sha(b)==row['sourceSha256'],'source sha '+res)
 entries=[];groups=[];cur=2;recCount=int.from_bytes(b[:2],'little')
 ck(recCount==row['paletteRecordCount']==len(row['groups']),'header group count '+res)
 for k in range(recCount):
  p=cur;n=int.from_bytes(b[p:p+2],'little');cur+=2
  raw=b[cur:cur+n*2];ck(len(raw)==n*2,'complete word span')
  groups.append((p,cur,cur+2*n,n));entries.extend(int.from_bytes(raw[v:v+2],'little') for v in range(0,len(raw),2));cur+=2*n
  ck(row['groups'][k]['recordIndex']==k and row['groups'][k]['countWordByteOffset']==p and row['groups'][k]['colorsByteStart']==cur-2*n and row['groups'][k]['colorsByteEnd']==cur and row['groups'][k]['count']==n and sha(raw)==row['groups'][k]['sourceColorsSHA256'],'palette record '+res+str(k))
 ck(cur==row['paletteDataEndOffset']==(520 if res=='probe' else 84),'native image starts')
 ck(len(entries)==row['paletteWordCount']==(255 if res=='probe' else 40),'palette word totals')
 native6=bytearray();rgb=bytearray()
 for w in entries:
  # Reproduce instruction order without producer functions, and validate channel-by-channel.
  red=((int(w)//512)%64)|1;green=((int(w)//16)%64)|1;blue=((2*int(w))%64)|1
  native6+=bytes((red,green,blue));rgb+=bytes((red*255//63,green*255//63,blue*255//63))
 ck(sha(bytes(native6))==row['dac6SHA256'],'native dac hash');ck(sha(bytes(rgb))==row['expandedRGB8SHA256'],'expanded hash')
 ck(z.read(row['paletteFiles']['palette_native_dac6.rgb18'])==native6,'native DAC bytes')
 ck(z.read(row['paletteFiles']['palette_conventional_8bit.rgb24'])==rgb,'expanded RGB bytes')
 ck(z.read(row['paletteFiles']['palette_original_words_split.bin'])==b''.join(w.to_bytes(2,'little') for w in entries),'source 16-bit words')
 ck(len(row['frames'])==len(m110b['resources'][stem]['frames']),'source frame count')
 zeroTotal=0;overTotal=0
 for num,(frame,f110b) in enumerate(zip(row['frames'],m110b['resources'][stem]['frames'])):
  idx=zsrc.read(f110b['pixelMember']);ck(len(idx)==64000 and sha(idx)==frame['originalIndexSha256']==f110b['pixelsSha256'],'original index data')
  ck(frame['index']==num and frame['sourceFrameHeaderOffset']==f110b['frameHeaderStart'],'source frame start')
  mask=z.read(frame['paletteKnownMask']);ck(len(mask)==64000,'mask length')
  img=Image.open(io.BytesIO(z.read(frame['diagnosticPng']))).convert('RGB');ck(img.size==(320,200),'rgb PNG dimensions')
  black=Image.open(io.BytesIO(z.read(frame['blackIndex0Preview']))).convert('RGB');ck(black.size==(320,200),'black PNG dimensions')
  imrgb=img.tobytes();blackrgb=black.tobytes();zcount=0;ocount=0;kcount=0
  if res=='probe':
   gif.seek(num);ck(gif.info['duration']==(2000 if num==0 else 2020 if num==29 else 20),'viewer only scheduler-duration');gifrgb=gif.convert('RGB').tobytes()
  for q,paletteIndex in enumerate(idx):
   if paletteIndex==0 or paletteIndex>len(entries):
    if paletteIndex==0:zcount+=1
    else:ocount+=1
    ck(mask[q]==0 and imrgb[3*q:3*q+3]==b'\xff\x00\xff' and blackrgb[3*q:3*q+3]==b'\x00\x00\x00',f'unknown entry {res}/{num}/{q}')
   else:
    color=rgb[3*(paletteIndex-1):3*paletteIndex]
    ck(mask[q]==255 and imrgb[3*q:3*q+3]==color and blackrgb[3*q:3*q+3]==color,f'dac mapping {res}/{num}/{q}')
    kcount+=1
   if res=='probe':ck(gifrgb[3*q:3*q+3]==blackrgb[3*q:3*q+3],f'GIF pixel {num}/{q}')
  ck(zcount==frame['unknownIndexZeroCount'] and ocount==frame['unknownBeyondPaletteCount'] and kcount==frame['knownOneBasedPixelCount'],'pixel populations')
  zeroTotal+=zcount;overTotal+=ocount
 ck(zeroTotal==row['unknownZeroPixels'] and overTotal==row['unknownOverRangePixels'],'totals')
print(json.dumps({'verdict':'PASS','checks':checks,'sourceNativeColorWords':295,'LZWFramesAudited':31,'conditionalRgb8Pixels':31*64000,'nativeDac6Reconstructed':True,'gifPreview':'20 milliseconds per scheduler tick chosen by viewer, index0 deliberately black, not DOS timing or qualified runtime index0'},indent=2))
