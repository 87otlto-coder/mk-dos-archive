#!/usr/bin/env python3
"""O110B: Reproducible native-LZW frame/palette extraction and bounded font opcode tape.

The producer never substitutes derived GIF wrappers for native source. Native 555 colour
interpretation is exported as a *candidate* alongside exact 16-bit words and index bytes.
"""
import collections, hashlib, io, json, struct, sys, zipfile
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
MK2=Path(sys.argv[1]); OUT=Path(sys.argv[2]);OUT.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
fixture={'probe':(327672,'4e1a30228a05103972ca3838acd76b6bafcc4c4af91e341789a1d84b9338f186',520,30), 'acclaim':(2036,'d95976f318b22266d38511285d5a623def4c3761889a230c2dd80465eef2672e',84,1)}
def lzw_decode(payload):
 base=256;start=258;table={i:bytes([i]) for i in range(256)};width=9;next_id=start
 pos=0;bits=0;avail=0;prev=None;out=bytearray();clear=0;stop=0
 while True:
  while avail<width:
   if pos>=len(payload):raise ValueError('Missing LZW stop command')
   bits|=payload[pos]<<avail;avail+=8;pos+=1
  c=bits&((1<<width)-1);bits>>=width;avail-=width
  if c==256:
   clear+=1;table={i:bytes([i]) for i in range(256)};width=9;next_id=start;prev=None;continue
  if c==257:stop+=1;break
  if c in table:v=table[c]
  elif c==next_id and prev is not None:v=prev+prev[:1]
  else:raise ValueError('invalid LZW command')
  out.extend(v)
  if prev is not None and next_id<4096:
   table[next_id]=prev+v[:1];next_id+=1
   if next_id==1<<width and width<12:width+=1
  prev=v
 if len(out)!=64000:raise ValueError('Wrong expanded image size')
 return bytes(out),{'clearCommands':clear,'stopCommands':stop}
def get_subblock(b,offset):
 if b[offset]!=8:raise ValueError('GIF-compatible 8-bit code-size marker missing')
 p=offset+1;data=bytearray();nums=[];terminated=False
 while p<len(b):
  n=b[p];p+=1;nums.append(n)
  if n==0:terminated=True;break
  if p+n>len(b):raise ValueError('truncated length-indexed subblock')
  data.extend(b[p:p+n]);p+=n
 return bytes(data),p,nums,terminated

def candidate_palette(b,start):
 vals=struct.unpack_from('<256H',b,start)
 pal=bytearray()
 for v in vals:pal.extend(((v>>10&31)*255//31,(v>>5&31)*255//31,(v&31)*255//31))
 return bytes(pal)
def indexed_png(idx,pal):
 im=Image.frombytes('P',(320,200),idx);im.putpalette(pal);res=io.BytesIO();im.save(res,format='PNG');return res.getvalue()

def text_json(x):return (json.dumps(x,indent=2,sort_keys=True)+'\n').encode()
archive=OUT/'MK2_LZW31_AND_FONT_OPCODE_TAPE_O110B.zip'
manifest={'format':'mk2_lzw31_and_font_command_tape_o110b','status':'31 exact index frames; RGB555 words preserved with candidate color conversion; timing unknown; font glyph boundaries unknown','resources':{},'fontPrefix':{},'cavePrefix':{},'monksOpcodeRuns':{},'verification':{'independentLzw':True,'color': '555 candidate (no executable runtime color binding)','unknownSemanticsNotPromoted':True}}
previews=[]
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name,(sz,hsh,start,count) in fixture.items():
  b=(MK2/(name+'.gra')).read_bytes();assert len(b)==sz and sha(b)==hsh
  z.writestr(name+'/ORIGINAL.GRA',b)
  palette_region=b[4:start];z.writestr(name+'/palette_original_words.bin',palette_region)
  pal=candidate_palette(b,4);z.writestr(name+'/palette_555_CANDIDATE.rgb24',pal)
  ent={'sourceBytes':len(b),'sourceSha256':sha(b),'paletteBytes':len(palette_region),'paletteSourceOffset':4,'paletteSha256':sha(palette_region),'paletteCandidate':'first 256 16-bit little-endian words, xRGB1555 (5-5-5), diagnostic not runtime-bound','rgbCandidateHash':sha(pal),'frames':[],'preFrameWord0':struct.unpack_from('<H',b,0)[0],'preFrameWord2':struct.unpack_from('<H',b,2)[0]}
  p=start
  for index in range(count):
   assert b[p:p+4]==b'\x40\x01\xc8\x00'
   sub=p+4;data,end,blocks,terminated=get_subblock(b,sub)
   idx,meta=lzw_decode(data)
   ident=f'{name}/frames/{index:03}'
   png=indexed_png(idx,pal)
   z.writestr(ident+'.idx8',idx);z.writestr(ident+'.rgb555_CANDIDATE.png',png)
   pic=Image.open(io.BytesIO(png)).convert('RGB');previews.append((name,index,pic))
   pad=0
   if index<count-1:
    while end+pad<len(b) and b[end+pad]==0:pad+=1
    assert pad in (1,2)
    assert b[end+pad:end+pad+4]==b'\x40\x01\xc8\x00'
   else:assert end==len(b)
   ent['frames'].append({'ordinal':index,'frameHeaderStart':p,'compressedStart':sub,'compressedEnd':end,'paddingAfter':pad,'terminatedByZeroSubblock':terminated,'lzwStopCodePresent':meta['stopCommands']==1,'clearCommands':meta['clearCommands'],'compressedPayloadBytes':len(data),'subblockCount':len(blocks),'usedPaletteIndices':len(set(idx)),'maxPaletteIndex':max(idx),'pixelsSha256':sha(idx),'pngSha256':sha(png),'pixelMember':ident+'.idx8','pngMember':ident+'.rgb555_CANDIDATE.png'})
   p=end+pad
  assert p==len(b)
  manifest['resources'][name+'.gra']=ent
 # Independently useful source-backed font *opcode tape*; no claimed glyph boundaries
 font=(MK2/'fonts.gra').read_bytes();prefix=font[:103840];tokens=[];tape=bytearray();mask=bytearray();p=0
 while p<len(prefix):
  at=p;v=struct.unpack_from('<I',prefix,p)[0];p+=4
  if v&1:
   n=v>>1;kind='transparent';index=None;sprite=bytes(n);opacity=bytes(n)
  elif v&2:
   n=v>>10;kind='repeat';index=(v>>2)&255;sprite=bytes([index])*n;opacity=bytes([1])*n
  else:
   n=v>>2;kind='literal';index=None;sprite=prefix[p:p+n];opacity=bytes([1])*n;p+=(n+3)&~3
  assert 1<=n<=109 and (kind=='transparent' or n<=64) and p<=len(prefix)
  tape.extend(sprite);mask.extend(opacity)
  tokens.append({'byteStart':at,'byteEnd':p,'operation':kind,'pixels':n,'repeatIndex':index})
 assert p==103840 and len(tokens)==13981 and len(tape)==135716
 z.writestr('fonts/unqualified_prefix_original.bin',prefix)
 z.writestr('fonts/linear_index_tape.idx8',tape);z.writestr('fonts/linear_mask_tape.mask8',mask)
 z.writestr('fonts/command_boundaries.json',text_json(tokens))
 manifest['fontPrefix']={'byteStart':0,'byteEnd':103840,'sourceSha256':sha(prefix),'commands':len(tokens),'expandedPixelCount':len(tape),'indexSha256':sha(tape),'maskSha256':sha(mask),'streamsKnown':False,'glyphLocationsKnown':False,'fontConversionQualified':False,'provenance':'same bitfield RLE grammar as source-backed MK2 indexed sprites, but no authenticated width/height/glyph ownership'}
 # Cave 120-byte prefix is a single exact 46-output-pixel opcode tape; width/height not authenticated
 cave=(MK2/'cave.gra').read_bytes()[:120]; p=0;out=bytearray();msk=bytearray();nc=0
 while p<len(cave):
  v=struct.unpack_from('<I',cave,p)[0];p+=4;nc+=1
  if v&1:n=v>>1;out.extend(bytes(n));msk.extend(bytes(n))
  elif v&2:n=v>>10;out.extend(bytes([v>>2&255])*n);msk.extend(bytes([1])*n)
  else:n=v>>2;out.extend(cave[p:p+n]);msk.extend(bytes([1])*n);p+=(n+3)&~3
 assert len(out)==46 and nc==18 and p==120
 z.writestr('cave/prefix_120_original.bin',cave);z.writestr('cave/prefix_linear_46.idx8',out);z.writestr('cave/prefix_linear_46.mask8',msk)
 manifest['cavePrefix']={'sourceBytes':120,'commands':nc,'outputPixels':46,'opaquePixels':sum(msk),'sourceSha256':sha(cave),'pixelsSha256':sha(out),'maskSha256':sha(msk),'ownerQualified':False}
 monks=(MK2/'monks.gra').read_bytes();values=struct.unpack('<608I',monks);runs=[]
 for v,grp in __import__('itertools').groupby(values):
  n=len(list(grp));runs.append({'commandValue':v,'transparentRunPixels':v>>1,'repeatCount':n})
 assert len(runs)==10 and all(v&1 for v in values)
 z.writestr('monks/transparent_opcode_runs.json',text_json(runs))
 manifest['monksOpcodeRuns']={'sourceSize':len(monks),'sourceSha256':sha(monks),'transparentOnlyOpcodeCount':608,'runs':runs,'meaningKnown':False,'qualification':'compatible with transparency skip opcode word; no runtime resource ownership or sprite geometry'}
 # Contact sheet (diagnostic 30-frame progression, never original animation FPS).
 ims=[pic for name,idx,pic in previews if name=='probe']
 w,h=160,100;sheet=Image.new('RGB',(6*w,5*(h+16)),'#202020');draw=ImageDraw.Draw(sheet)
 for i,im in enumerate(ims):
  px=(i%6)*w;py=(i//6)*(h+16);sheet.paste(im.resize((w,h)),(px,py));draw.text((px+4,py+h+2),f'Frame {i:02d}',fill='#ffffff')
 buf=io.BytesIO();sheet.save(buf,format='PNG');z.writestr('probe/CONTACT_SHEET_CANDIDATE.png',buf.getvalue());(OUT/'MK2_PROBE_30_FRAMES_CONTACT_SHEET_O110B.png').write_bytes(buf.getvalue())
 z.writestr('MANIFEST_O110B.json',text_json(manifest))
 z.writestr('README.txt','O110B source-derived 320x200 LZW graphics recovery. Full native bytes preserved.\n31 exact index planes plus RGB555 candidate png. Original palette words included.\nProbe last subblock lacks standard zero-length end; LZW end CODE is present and no bytes are missing.\nFont and Cave prefix are source-validated RLE opcode tapes WITHOUT independently qualified glyph/frame geometry.\nMonks has only odd DWORDs, structurally compatible with transparent skip runs; owner remains unidentified.\nNo timing, exact runtime palette DAC interpretation or executable-owned glyph mapping claimed.\n')
 (OUT/'MK2_O110B_SOURCE_EVIDENCE.json').write_bytes(text_json(manifest))
print(json.dumps({'frames':sum(len(v['frames']) for v in manifest['resources'].values()),'fontCommands':len(tokens),'fontPixels':len(tape),'archive':str(archive),'archiveBytes':archive.stat().st_size}))
