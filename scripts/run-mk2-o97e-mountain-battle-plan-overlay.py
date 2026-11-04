#!/usr/bin/env python3
"""O97E: conditional six-variant portrait-to-tall-artwork overlays from authentic source streams.
An exploratory pixel join; never implies the two allocation paths execute simultaneously.
"""
import json,hashlib,struct,sys
from pathlib import Path
from PIL import Image
if len(sys.argv)!=3: raise SystemExit('usage: fixture-root source-root')
fx=Path(sys.argv[1]);root=Path(sys.argv[2]);gra=(fx/'mountain.gra').read_bytes();exe=(fx/'mk2.exe').read_bytes();H=lambda v:hashlib.sha256(v).hexdigest()
parent=root/'mk2_mountain_tall_layer_atlas_and_setup_crop_o97c_o97d_2026-10-09.json';r=json.loads(parent.read_bytes());u=root/'mk2_mountain_conditional_image_layouts_o96u_2026-10-09.json';v=json.loads(u.read_bytes())
assert H(gra)==r['fixture']['graSha256'] and H(exe)==r['fixture']['exeSha256'] and len(v['variants'])==6
w,h=328,896;folder=root/'evidence'/'mk2_mountain_o97c_o97d';background=bytes((root/r['outputs']['atlasIndices']['path']).read_bytes());back_mask=bytes((root/r['outputs']['atlasOpacity']['path']).read_bytes());assert len(background)==w*h and len(back_mask)==w*h
images={}
for ordinal in range(15):
 phys=0xa0c54+0x1c4cc+16*ordinal
 width,height=struct.unpack_from('<HH',exe,phys);packed=struct.unpack_from('<I',exe,phys+8)[0];assert width==35 and height==41 and packed>>24==37
 src=packed&0xffffff;buf=bytearray(width*height);mask=bytearray(width*height)
 for yy in range(height):
  xx=0
  while xx<width:
   c=struct.unpack_from('<I',gra,src)[0];src+=4
   if c&1:n=c>>1;data=None
   elif c&2:n=c>>10;data=bytes([(c>>2)&255])*n
   else:n=c>>2;data=gra[src:src+n];src+=(n+3)&~3
   assert 0<n<=width-xx
   if data is not None:buf[yy*width+xx:yy*width+xx+n]=data;mask[yy*width+xx:yy*width+xx+n]=bytes([1])*n
   xx+=n
 images[ordinal]=(bytes(buf),bytes(mask))
 assert sum(mask)==width*height
palette=[struct.unpack_from('<H',exe,0x8d180+i*2)[0] for i in range(207)]
results=[];seen=set()
for variant in v['variants']:
 choice=variant['choice'];rows=variant['rows'];assert len(rows)==14
 canvas=bytearray(background);alpha=bytearray(back_mask);portrait_owners=bytearray(w*h);added=0;overwritten=0
 used=[]
 for entry in rows:
  token=entry['decodedImageOrdinal'];x=entry['lowWordObjectPlus1A'];y=entry['highWordObjectPlus1E'];assert token!=14 and x==197 and 160<=y<=771
  pix,opacity=images[token];used.append(token)
  for yy in range(41):
   for xx in range(35):
    p=(y+48+yy)*w+x+8+xx;sp=yy*35+xx
    if opacity[sp]:
     assert not portrait_owners[p]
     portrait_owners[p]=1
     if alpha[p]:overwritten+=1
     else:added+=1
     canvas[p]=pix[sp];alpha[p]=1
 assert len(set(used))==14 and sorted(used)==list(range(14))
 f=folder/f'mountain_39_plus_14_portraits_variant_{choice}_indices_328x896.bin';f.write_bytes(canvas)
 out={'choice':choice,'sourceImageTokens':used,'sourceRecordOffset':variant['streamOffset'],'indexSha256':H(canvas),'maskSha256':H(alpha),'addedOpaquePixels':added,'overwrittenOpaquePixels':overwritten,'finalOpaquePixels':sum(alpha),'portraitPixels':added+overwritten,'indices':{'path':f.relative_to(root).as_posix(),'sha256':H(f.read_bytes()),'bytes':f.stat().st_size},'uniqueAgainstPreviousVariants':H(canvas) not in seen}
 seen.add(H(canvas));results.append(out)
 if choice==0:
  rgba=bytearray(w*h*4)
  for n,b in enumerate(canvas):
   if alpha[n]:
    color=palette[b];rgba[n*4:n*4+4]=bytes((round(255*(((color>>9)&63)|1)/63),round(255*(((color>>4)&63)|1)/63),round(255*(((color<<1)&63)|1)/63),255))
  png=folder/'mountain_39_plus_14_portraits_variant_0_palette_candidate.png';Image.frombytes('RGBA',(w,h),bytes(rgba)).save(png,optimize=True)
  preview={'path':png.relative_to(root).as_posix(),'sha256':H(png.read_bytes()),'bytes':png.stat().st_size}
assert len(seen)==5
report={'format':'mk2_o97e_mountain_conditional_portrait_tower_overlay_hypothesis_v1','status':'SUCCESS','fixtureExeSha256':H(exe),'fixtureGraSha256':H(gra),'parentO97cSha256':H(parent.read_bytes()),'parentO96uSha256':H(u.read_bytes()),'canvas':{'width':w,'height':h,'originX':-8,'originY':-48},'variants':results,'uniqueComposites':len(seen),'previewCandidateVariant0':preview,'hypotheses':{'fourteenSpritesAreSourcePlacedAtX197And47YStep':'SUPPORTED_STATIC','fiveUniqueSixConditionalVariants':'SUPPORTED_STATIC','combinedCompositionMatchesAnObservedGameFrame':'UNPROVEN','portraitSpritesActuallyActiveWithTallSetupAtRuntime':'UNPROVEN','selectedOrderIsTimeline':'UNPROVEN','paletteRgbIsInGameVerified':'UNPROVEN'}}
file=root/'mk2_mountain_conditional_portrait_tower_overlays_o97e_2026-10-09.json';file.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'status':'PASS','variants':6,'unique':len(seen),'portraitPixels':results[0]['portraitPixels'],'firstVariantAdded':results[0]['addedOpaquePixels'],'firstVariantOverwritten':results[0]['overwrittenOpaquePixels'],'preview':preview['path']}))
