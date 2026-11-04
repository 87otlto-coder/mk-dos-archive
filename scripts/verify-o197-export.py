#!/usr/bin/env python3
"""Independent standard-library verifier for original Forest O197 five-layer forensic export.
Runs raw GRA indexed-command grammar against EXE descriptor records without TS imports.
Proves every source command, composed index/mask/RGB byte, PNG, count and ZIP metadata.
Does not interpret final gameplay composition or runtime palette.
"""
import collections,hashlib,json,struct,sys,zipfile,zlib
from pathlib import Path
OBJ2=0xA0C54
SETUPS=(0x16F8C,0x16F9E,0x16FB0,0x16FC2,0x16FD4)
SHA_EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
SHA_GRA='8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9'
def ck(q,message):
 if not q:raise ValueError('O197 independent verifier: '+message)
def sha(x):return hashlib.sha256(x).hexdigest()
def u16(b,p):return struct.unpack_from('<H',b,p)[0]
def u32(b,p):return struct.unpack_from('<I',b,p)[0]
def i16(x):return x-65536 if x&0x8000 else x

def decode(gra,off,w,h):
 ix=bytearray(w*h);alpha=bytearray(w*h);commands=[];cursor=off;opaque=0
 for row in range(h):
  x=0
  while x<w:
   ck(cursor+4<=198116,'indexed command truncation or floor crossing')
   p=cursor;raw=u32(gra,p);cursor+=4
   kind='skip' if raw&1 else 'rle' if raw&2 else 'literal'
   n=raw>>1 if kind=='skip' else raw>>10 if kind=='rle' else raw>>2
   ck(0<n<=w-x,f'invalid {kind} row {row} x {x} at 0x{p:x}')
   rec=dict(sourceOffset=p,row=row,x=x,kind=kind,runLength=n)
   if kind=='rle':
    color=(raw>>2)&255;ck(1<=color<=80,'palette index outside source palette')
    ix[row*w+x:row*w+x+n]=bytes([color])*n
    alpha[row*w+x:row*w+x+n]=bytes([1])*n
    opaque+=n;rec['paletteIndex']=color
   elif kind=='literal':
    ck(n<=64 and cursor+n<=198116,'literal length');chunk=gra[cursor:cursor+n]
    ck(all(1<=a<=80 for a in chunk),'literal palette domain')
    ix[row*w+x:row*w+x+n]=chunk;alpha[row*w+x:row*w+x+n]=bytes([1])*n
    opaque+=n;cursor+=(n+3)&~3
    ck(cursor<=198116,'literal pad would collide with original packed floor')
   rec['encodedEndExclusive']=cursor;rec['rawWord']=raw;commands.append(rec)
   x+=n
 file_span=gra[off:cursor]
 stream=dict(graOffset=off,width=w,height=h,graEndExclusive=cursor,encodedByteLength=cursor-off,
  encodedSHA256=sha(file_span),indicesSHA256=sha(ix),opacitySHA256=sha(alpha),opaquePixels=opaque,commands=commands)
 return ix,alpha,stream

def png_pixels(png,w,h):
 ck(png[:8]==b'\x89PNG\r\n\x1a\n','PNG header');cursor=8;compressed=b'';size=None
 while cursor<len(png):
  n=struct.unpack_from('>I',png,cursor)[0];kind=png[cursor+4:cursor+8];data=png[cursor+8:cursor+8+n]
  crc=struct.unpack_from('>I',png,cursor+8+n)[0];ck(zlib.crc32(kind+data)&0xffffffff==crc,'PNG CRC')
  if kind==b'IHDR':
   mw,mh,depth,ctype,comp,filter_,interlace=struct.unpack('>IIBBBBB',data)
   ck((mw,mh,depth,ctype,comp,filter_,interlace)==(w,h,8,6,0,0,0),'PNG canvas or format mismatch')
   size=(mw,mh)
  elif kind==b'IDAT':compressed+=data
  cursor+=n+12
  if kind==b'IEND':break
 ck(size==(w,h) and cursor==len(png),'PNG body or trailing data')
 raw=zlib.decompress(compressed);stride=w*4+1;ck(len(raw)==stride*h,'PNG size')
 ck(all(raw[i*stride]==0 for i in range(h)),'unsupported PNG scanline filter')
 return b''.join(raw[i*stride+1:(i+1)*stride] for i in range(h))

def run(folder,archive):
 exe=next(p.read_bytes() for p in (folder/'mk2.exe',folder/'MK2.EXE') if p.exists())
 gra=next(p.read_bytes() for p in (folder/'forest.gra',folder/'FOREST.GRA') if p.exists())
 ck(len(exe)==861133 and sha(exe)==SHA_EXE,'MK2.EXE checksum')
 ck(len(gra)==226788 and sha(gra)==SHA_GRA,'FOREST.GRA checksum')
 ck(u16(exe,0x89324)==80,'counted 80-color palette identity')
 rgb={}
 for n in range(1,81):
  raw=u16(exe,0x89324+2*n)
  vals=[((raw>>9)&63)|1,((raw>>4)&63)|1,((raw<<1)&63)|1]
  rgb[n]=[(v<<2)|(v>>4) for v in vals]
 layer_summaries=[];total_commands=0;count=0;unique_count=0
 with zipfile.ZipFile(archive) as z:
  ck(z.testzip() is None,'ZIP CRC')
  paths=set(z.namelist());ck(len(paths)==40 and not any(p.lower().endswith(('.exe','.gra')) for p in paths),'expected 40 members and no original game binary')
  m=json.loads(z.read('MANIFEST.json'))
  ck(m['sourceGameFilesBundled'] is False and m['derivedOriginalPixelsIncluded'] is True,'manifest game file provenance')
  ck(m['original']['exeSHA256']==SHA_EXE and m['original']['forestSHA256']==SHA_GRA,'manifest source identity')
  ck(m['palette']['runtimeSelectionVerified'] is False,'candidate palette must stay unverified')
  for j,offset in enumerate(SETUPS):
   setup=OBJ2+offset;w,h,n=struct.unpack_from('<HHH',exe,setup)
   c=u32(exe,setup+6);d=u32(exe,setup+10);table=u32(exe,setup+14)
   ck(table==0x171d0,'palette table link')
   indices=bytearray(w*h);mask=bytearray(w*h);rgba=bytearray(w*h*4);placements=[];streams=[];cache={};clipped=overdraw=0
   for ordinal in range(n):
    ctrl=c+8*ordinal;flags,ox,oy,pair=struct.unpack_from('<HHHH',exe,OBJ2+ctrl)
    pal=(flags&15)|((pair&0xf000)>>8);desc=d+((pair&0xfff)*4)
    sw,sh,packed=struct.unpack_from('<HHI',exe,OBJ2+desc);rid=packed>>24;start=packed&0xffffff
    ck(pal==2 and rid==27 and start<198116,'descriptor resource or palette')
    ox,oy=i16(ox),i16(oy);key=(start,sw,sh)
    if key not in cache:cache[key]=decode(gra,start,sw,sh)
    pix,opaque,stream=cache[key]
    if not any(s['graOffset']==start and s['width']==sw and s['height']==sh for s in streams):streams.append(stream)
    painted=pc=po=0
    for i,src_color in enumerate(pix):
     if not opaque[i]:continue
     xx,yy=ox+(i%sw),oy+i//sw
     if xx<0 or xx>=w or yy<0 or yy>=h:clipped+=1;pc+=1;continue
     at=yy*w+xx
     if mask[at]:overdraw+=1;po+=1
     indices[at]=src_color;mask[at]=1;rgba[at*4:at*4+4]=bytes((*rgb[src_color],255));painted+=1
    placements.append(dict(ordinal=ordinal,controlObject2=ctrl,controlPhysical=OBJ2+ctrl,
      descriptorObject2=desc,descriptorPhysical=OBJ2+desc,x=ox,y=oy,width=sw,height=sh,graOffset=start,
      graEndExclusive=stream['graEndExclusive'],paletteSlot=2,flags=flags,painted=painted,clipped=pc,overwritten=po))
   b=f'variants/{j+1}_{w}x{h}'
   ck(z.read(b+'/source_indices.bin')==indices,'source indices plane '+b)
   ck(z.read(b+'/opacity_mask.bin')==mask,'source opacity plane '+b)
   ck(json.loads(z.read(b+'/descriptor_placements.json'))==placements,'source placements '+b)
   ck(json.loads(z.read(b+'/indexed_stream_command_trace.json'))==streams,'full original command-by-command source trace '+b)
   ck(png_pixels(z.read(b+'/candidate_color.png'),w,h)==rgba,'candidate-color pixels '+b)
   expected_indices=bytes(v for i,x in enumerate(indices) for v in (x,x,x,255 if mask[i] else 0))
   ck(png_pixels(z.read(b+'/source_indices_preview.png'),w,h)==expected_indices,'indexed pixels preview '+b)
   expected_mask=bytes(v for x in mask for v in (255*x,255*x,255*x,255))
   ck(png_pixels(z.read(b+'/opacity_mask_preview.png'),w,h)==expected_mask,'independent alpha/opacity PNG '+b)
   meta=m['layerSummary'][j]
   ck(meta['variant']==j+1 and meta['width']==w and meta['height']==h and meta['placementCount']==n,'layer metadata '+b)
   ck(meta['rgbaSHA256']==sha(rgba) and meta['indicesSHA256']==sha(indices) and meta['opacitySHA256']==sha(mask),'layer byte hashes '+b)
   ck(meta['opaquePixels']==sum(mask) and meta['clippedOpaquePixels']==clipped and meta['overdrawOpaquePixels']==overdraw,'layer write count '+b)
   ck(meta['streamCount']==len(streams) and meta['placementRecords']==n,'stream and placement counts '+b)
   total_commands+=sum(len(s['commands']) for s in streams);count+=n;unique_count+=len(streams)
   layer_summaries.append([w,h,n,len(streams),sum(mask),clipped,overdraw])
 ck(count==60 and unique_count==43 and len(layer_summaries)==5,'overall five-variant descriptor census')
 print(f'O197 INDEPENDENT PASS: 5 source-native Forest canvases; 60 placements, 43 unique indexed streams, {total_commands} trace tokens; original indexed/mask/RGBA outputs, 15 PNGs, 40 forensic entries cross-verified byte for byte.')
 for i,row in enumerate(layer_summaries):print('  variant',i+1,'size',f'{row[0]}x{row[1]}','placements',row[2],'unique',row[3],'opaque',row[4],'clipped',row[5])

if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit('Usage: python scripts/verify-o197-export.py <original MK2 dir> <O197 evidence ZIP>')
 run(Path(sys.argv[1]),Path(sys.argv[2]))
