#!/usr/bin/env python3
"""Source-bound MK2 intro VGA DAC6 palette records. Runtime palette bank placement remains conditional."""
import sys,zipfile,struct,json,hashlib,io,collections
from pathlib import Path
from PIL import Image
exe=Path(sys.argv[1]).read_bytes();native=Path(sys.argv[2]);o110b=Path(sys.argv[3]);out=Path(sys.argv[4]);out.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
# Real x86 code evidence for unpacking each 16bit source palette word into VGA DAC channels.
required={0x7b3b1:'66ad',0x7b3b5:'c1e809',0x7b3b8:'243f',0x7b3ba:'0c01',0x7b3bc:'ee',0x7b3c1:'c1e804',0x7b3c4:'243f',0x7b3c6:'0c01',0x7b3c8:'ee',0x7b3cd:'d1e0',0x7b3cf:'243f',0x7b3d1:'0c01',0x7b3d3:'ee',0x98c59:'0fb74ffe',0x98c65:'e8cf27feff',0x98c79:'e8bb27feff',0x98c84:'0fb604d5065b0700',0x64659:'e8c16d0100',0x7b453:'ba01000000'}
for pos,p in required.items(): assert exe[pos:pos+len(p)//2].hex()==p,hex(pos)
assert exe[0x98c65]==0xe8 and 0x98c65+5+struct.unpack_from('<i',exe,0x98c66)[0]==0x7b439
assert exe[0x64659]==0xe8 and 0x64659+5+struct.unpack_from('<i',exe,0x6465a)[0]==0x7b41f
# Source-native VGA colors: c6 are exact port 0x3C9 writes. c8 uses a declared conventional scaling, NOT native data.
def dac(w): return (((w>>9)&63)|1,((w>>4)&63)|1,((w<<1)&63)|1)
def rgb(c):return tuple(v*255//63 for v in c)
report={'format':'mk2_o110e_source_proven_dac6_intro_palette_records_v1','exeSha256':sha(exe),'nativeDacChannelFormula':{'red':'((w >> 9) & 63) | 1','green':'((w >> 4) & 63) | 1','blue':'((w << 1) & 63) | 1','writes':'VGA DAC data port 0x3C9; 6-bit values','codePhysicalOffsets':[0x7b3b1,0x7b3b5,0x7b3c1,0x7b3cd]},'imageInterpretation':{'indexedImageDecoding':'O110B original verified LZW pixels','paletteRecordOffsets':'first word is palette-group count; each group has word color count, then 16-bit color entries','paletteBank':'Image decoder uses start-index byte from registered first palette handle. Assumed palette start at index1 for diagnostic only. Live allocator state and index0 unresolved.','rgb8Scaling':'per channel floor(DAC6*255/63) as visual expansion, NOT hardware trace','unknownIndex0':'magenta in diagnostics ONLY; dedicated uncertainty mask generated'},'resources':{}}
assetbytes={}
with zipfile.ZipFile(o110b) as z:
 man=json.loads(z.read('MANIFEST_O110B.json'))
 for name in ('probe','acclaim'):
  src=(native/(name+'.gra')).read_bytes();assert sha(src)==man['resources'][name+'.gra']['sourceSha256']
  groupCount=struct.unpack_from('<H',src,0)[0];p=2;words=[];groups=[]
  for i in range(groupCount):
   start=p;count=struct.unpack_from('<H',src,p)[0];p+=2
   vals=list(struct.unpack_from('<%dH'%count,src,p));groups.append({'recordIndex':i,'countWordByteOffset':start,'colorsByteStart':p,'colorsByteEnd':p+count*2,'count':count,'sourceColorsSHA256':sha(src[p:p+count*2])});words+=vals;p+=count*2
  assert (groupCount,len(words),p)==({'probe':(4,255,520),'acclaim':(1,40,84)}[name])
  dacs=bytes(v for w in words for v in dac(w));expanded=bytes(v for w in words for v in rgb(dac(w)))
  members={}
  for filename,b in [('palette_native_dac6.rgb18',dacs),('palette_conventional_8bit.rgb24',expanded),('palette_original_words_split.bin',struct.pack('<%dH'%len(words),*words))]:
   mem=f'{name}/{filename}';assetbytes[mem]=b;members[filename]=mem
  paths=[];blackFrames=[];allIdx0=0;otherUnknown=0
  for i,frame in enumerate(man['resources'][name+'.gra']['frames']):
   idx=z.read(frame['pixelMember']);assert len(idx)==64000 and sha(idx)==frame['pixelsSha256']
   known=bytearray(64000);colors=bytearray(64000*3)
   for j,pix in enumerate(idx):
    # Conditional one-based placement; any pixel0 is unknown since VGA bank0 is separately initialized.
    if pix==0:colors[3*j:3*j+3]=b'\xff\x00\xff';allIdx0+=1
    elif pix<=len(words):colors[3*j:3*j+3]=expanded[3*(pix-1):3*pix];known[j]=255
    else:colors[3*j:3*j+3]=b'\xff\x00\xff';otherUnknown+=1
   image=Image.frombytes('RGB',(320,200),bytes(colors));ioBuf=io.BytesIO();image.save(ioBuf,'PNG')
   black=bytearray(colors)
   for j in range(len(known)):
    if known[j]==0:black[3*j:3*j+3]=b'\0\0\0'  # unknown palette0 BLACK display choice ONLY
   blackImage=Image.frombytes('RGB',(320,200),black);blackFrames.append(blackImage);blackPNG=io.BytesIO();blackImage.save(blackPNG,'PNG')
   prefix=f'{name}/frames/{i:03d}'
   for suffix,b in [('DAC6_ONE_BASE_CONDITIONAL.png',ioBuf.getvalue()),('palette_known.mask8',bytes(known)),('INDEX0_BLACK_ONLY_PREVIEW.png',blackPNG.getvalue())]:assetbytes[f'{prefix}.{suffix}']=b
   paths.append({'index':i,'originalIndexSha256':sha(idx),'sourceFrameHeaderOffset':frame['frameHeaderStart'],'diagnosticPng':f'{prefix}.DAC6_ONE_BASE_CONDITIONAL.png','paletteKnownMask':f'{prefix}.palette_known.mask8','blackIndex0Preview':f'{prefix}.INDEX0_BLACK_ONLY_PREVIEW.png','unknownIndexZeroCount':idx.count(0),'unknownBeyondPaletteCount':sum(x>len(words) for x in idx),'knownOneBasedPixelCount':sum(0<x<=len(words) for x in idx)})
  if name=='probe':
   gifBytes=io.BytesIO();timingMs=[2000]+[20]*28+[2020];assert sum(timingMs)==4580
   blackFrames[0].save(gifBytes,format='GIF',save_all=True,append_images=blackFrames[1:],duration=timingMs,disposal=2,optimize=False);assetbytes['probe/PROBE_TIMING_BLACK_INDEX0_ILLUSTRATIVE_20MS_TICK.gif']=gifBytes.getvalue()
  report['resources'][name+'.gra']={'sourceSha256':sha(src),'paletteRecordCount':groupCount,'groups':groups,'paletteDataEndOffset':p,'frameCount':len(paths),'paletteWordCount':len(words),'dac6SHA256':sha(dacs),'expandedRGB8SHA256':sha(expanded),'paletteFiles':members,'unknownZeroPixels':allIdx0,'unknownOverRangePixels':otherUnknown,'frames':paths}
assetbytes['MANIFEST_O110E.json']=json.dumps(report,indent=2).encode()+b'\n'
assets=out/'MK2_PROBE_ACCLAIM_SOURCE_DAC6_PALETTES_O110E.zip'
with zipfile.ZipFile(assets,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as zz:
 for k,v in sorted(assetbytes.items()):zz.writestr(k,v)
assert zipfile.ZipFile(assets).testzip() is None
(out/'MK2_PROBE_ACCLAIM_SOURCE_DAC6_PALETTE_PROVENANCE_O110E.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'asset':str(assets),'assetSha256':sha(assets.read_bytes()),'introResources':[(n,m['paletteWordCount'],m['frameCount'],m['unknownZeroPixels']) for n,m in report['resources'].items()],'sourceWordDacOperationsAuthenticated':len(required),'sourceLZWframes':31},indent=2))
