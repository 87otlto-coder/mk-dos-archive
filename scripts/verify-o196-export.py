#!/usr/bin/env python3
"""Independent stdlib-only verifier for O196 fixture and browser-produced forensic ZIP.
Parses original DOS LE fixups without importing the browser TS implementation.
Verifies image pixels, RGB palette words, source setup/descriptor links, provenance and hashes.
"""
import collections,hashlib,json,struct,sys,zipfile,zlib
from pathlib import Path

OBJ1,OBJ2,LE=0x61c54,0xa0c54,0x28f0c
E_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
G_SHA='8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9'
SETUPS=[0x16f8c,0x16f9e,0x16fb0,0x16fc2,0x16fd4]

def chk(value,msg):
 if not value:raise ValueError('O196 independent verification: '+msg)
def sha(x):return hashlib.sha256(x).hexdigest()
def u16(b,p):return struct.unpack_from('<H',b,p)[0]
def u32(b,p):return struct.unpack_from('<I',b,p)[0]

def parse_le_fixups(b):
 chk(b[LE:LE+2]==b'LE' and u32(b,LE+0x14)==113,'LE image header and pages')
 tab=LE+u32(b,LE+0x68);blk=LE+u32(b,LE+0x6c)
 result={};total=0
 for page in range(113):
  p=blk+u32(b,tab+4*page);end=blk+u32(b,tab+4*(page+1))
  obj,source_page=(1,page) if page<63 else (2,page-63)
  while p<end:
   typ=b[p]&15;flags=b[p+1];offset=struct.unpack_from('<h',b,p+2)[0];p+=4
   chk(flags&3==0,'unsupported fixup flags')
   target_obj=u16(b,p) if flags&64 else b[p];p+=2 if flags&64 else 1
   dest=0
   if typ!=2:
    dest=u32(b,p) if flags&16 else u16(b,p);p+=4 if flags&16 else 2
   if flags&4:p+=4 if flags&32 else 2
   key=(obj,source_page*4096+offset)
   if key in result:chk(result[key]==(typ,flags,target_obj,dest),'duplicate LE relocation divergent')
   result[key]=(typ,flags,target_obj,dest);total+=1
  chk(p==end,'LE relocation page end')
 chk(total==27004,'original LE relocation count')
 return result

def expect_edge(b,fix,obj,p,target_obj,dest):
 chk(fix.get((obj,p))==(7,16,target_obj,dest),f'pointer at object{obj}+0x{p:x} does not have authenticated fixup')
 chk(u32(b,(OBJ1 if obj==1 else OBJ2)+p)==dest,'raw original pointer disagrees with LE fixup')

def png_rgba(raw):
 chk(raw[:8]==b'\x89PNG\r\n\x1a\n','PNG signature')
 pos=8;idat=b'';size=None
 while pos<len(raw):
  n=struct.unpack_from('>I',raw,pos)[0]
  typ=raw[pos+4:pos+8];payload=raw[pos+8:pos+8+n]
  crc=struct.unpack_from('>I',raw,pos+8+n)[0]
  chk(zlib.crc32(typ+payload)&0xffffffff==crc,'PNG CRC')
  if typ==b'IHDR':
   w,h,depth,mode,comp,filter_,interlace=struct.unpack('>IIBBBBB',payload)
   chk((w,h,depth,mode,comp,filter_,interlace)==(896,32,8,6,0,0,0),'native PNG parameters')
   size=(w,h)
  if typ==b'IDAT':idat+=payload
  pos+=12+n
  if typ==b'IEND':break
 chk(pos==len(raw),'PNG trailing bytes');chk(size==(896,32),'PNG geometry')
 pixel=zlib.decompress(idat)
 chk(len(pixel)==32*(1+896*4),'PNG decoded payload size')
 chk(all(pixel[y*(896*4+1)]==0 for y in range(32)),'PNG must be original unfiltered pixels')
 return b''.join(pixel[y*(896*4+1)+1:(y+1)*(896*4+1)] for y in range(32))

def run(folder,archive):
 exep=next((p for p in (folder/'mk2.exe',folder/'MK2.EXE') if p.exists()),None)
 grap=next((p for p in (folder/'forest.gra',folder/'FOREST.GRA') if p.exists()),None)
 chk(exep is not None and grap is not None,'original EXE/GRA fixture needed')
 exe=exep.read_bytes();gra=grap.read_bytes()
 chk(len(exe)==861133 and sha(exe)==E_SHA,'original EXE checksum')
 chk(len(gra)==226788 and sha(gra)==G_SHA,'original FOREST.GRA checksum')
 fx=parse_le_fixups(exe)
 chk(u16(exe,0x89324)==80,'80-color counted record')
 expect_edge(exe,fx,2,0x171d8,1,0x89324-OBJ1)
 for j in range(8):expect_edge(exe,fx,2,0x171d0+j*4,1,0x89324-OBJ1)
 chk(u32(exe,OBJ2+0x2ef54+4*4)==((27<<24)|198116),'Forest packed original source token')
 expected=[];descriptors=[]
 for at in SETUPS:
  physical=OBJ2+at;width,height,n=struct.unpack_from('<HHH',exe,physical)
  c=u32(exe,physical+6);d=u32(exe,physical+10);t=u32(exe,physical+14)
  for rel,target in [(6,c),(10,d),(14,t)]:expect_edge(exe,fx,2,at+rel,2,target)
  chk(t==0x171d0,'Forest setup palette pointer identity')
  controls=[]
  for i in range(n):
   ctrl=c+i*8;flags,x,y,pair=struct.unpack_from('<HHHH',exe,OBJ2+ctrl)
   slot=(flags&15)|((pair&0xf000)>>8)
   desc=d+((pair&0x0fff)*4)
   dw,dh,packed=struct.unpack_from('<HHI',exe,OBJ2+desc)
   rid=packed>>24;offset=packed&0xffffff
   chk(slot==2 and rid==27 and offset<len(gra) and dw>0 and dh>0,'Forest sprite descriptor and palette selector source association')
   controls.append({'ordinal':i,'controlObject2':ctrl,'flags':flags,'sourceX':x if x<32768 else x-65536,
     'sourceY':y if y<32768 else y-65536,'paletteSlot':slot,'descriptorObject2':desc,
     'width':dw,'height':dh,'graOffset':offset,'resourceID':rid})
  expected.append({'object2Offset':at,'physical':physical,'width':width,'height':height,'controlCount':n,'controlObject2':c,
   'descriptorTableObject2':d,'paletteTableObject2':t,'resourceIDs':[27],'controls':controls})
 chk([s['controlCount'] for s in expected]==[18,10,13,15,4],'five Forest setups source record sizes')
 pixels=gra[198116:];chk(len(pixels)==28672,'uncropped original floor suffix 896x32')
 histogram=collections.Counter(pixels)
 chk(min(histogram)==2 and max(histogram)==76 and len(histogram)==37,'original source-index domain')
 records=[]
 for ix in range(1,81):
  p=0x89324+ix*2;raw=u16(exe,p)
  dac=[((raw>>9)&63)|1,((raw>>4)&63)|1,((raw<<1)&63)|1]
  records.append({'index':ix,'wordPhysical':p,'rawWord':raw,'dac6':dac,'rgb8':[(x<<2)|(x>>4) for x in dac]})
 rgba=bytes(c for ix in pixels for c in (*records[ix-1]['rgb8'],255))
 shade=bytes(c for ix in pixels for c in (ix,ix,ix,255))
 with zipfile.ZipFile(archive) as z:
  chk(z.testzip() is None,'ZIP member CRC')
  files=set(z.namelist())
  chk(not any(s.lower().endswith(('.gra','.exe')) for s in files),'commercial original game-file members')
  manifest=json.loads(z.read('MANIFEST.json'))
  chk(manifest['sourceGameFilesBundled'] is False and manifest['derivedOriginalPixelsIncluded'] is True,'ZIP provenance')
  chk(manifest['original']['exeSHA256']==E_SHA and manifest['original']['forestSHA256']==G_SHA,'ZIP source hash witnesses')
  chk(z.read('results/forest_896x32_original_indices.bin')==pixels,'original source bytes in export')
  chk(png_rgba(z.read('results/forest_896x32_candidate_rgba.png'))==rgba,'candidate-color PNG pixels match independently decoded words')
  chk(png_rgba(z.read('results/forest_896x32_index_preview.png'))==shade,'gray index PNG preserves exact byte indices')
  links=json.loads(z.read('evidence/forest_setup_palette_descriptor_links.json'))
  chk(links==expected,'original five setup/60 control byte provenance')
  pal=json.loads(z.read('evidence/palette_80_original_words_and_candidate_rgb.json'))
  chk(pal['colors']==records and pal['runtimeSelectionVerified'] is False,'original palette words, source provenance and runtime disclaimer')
  hist=json.loads(z.read('results/source_index_histogram.json'))
  chk(hist==[{'index':i,'count':n} for i,n in sorted(histogram.items())],'source-byte histogram')
  evidence=json.loads(z.read('evidence/original_offsets_and_hashes.json'))
  chk(evidence['floor']['indicesSHA256']==sha(pixels) and evidence['floor']['rgbaSHA256']==sha(rgba),'original bytes and mapped RGBA hash')
  chk(evidence['palette']['recordSHA256']==sha(exe[0x89324:0x89324+162]),'original 80-color palette hash')
  chk(evidence['rendererEvidence']['stageIndex']==4 and evidence['rendererEvidence']['rawDestinationY']==172,'static renderer stage provenance')
  chk(json.loads(z.read('reproduce/parameters.json'))['sourcePaletteIsCandidate'] is True,'not runtime witnessed')
 print(f'O196 independent PASS: {len(fx)} unique original LE fixup sites, 5 Forest setup records / 60 controls, 80 original palette words, 896x32 source indices, two pixel-perfect exported PNGs, complete ZIP.')

if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit('Usage: python scripts/verify-o196-export.py <original-mk2-folder> <O196-evidence.zip>')
 run(Path(sys.argv[1]),Path(sys.argv[2]))
