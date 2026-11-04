#!/usr/bin/env python3
"""O97C/D: lossless 39-sprite source-coordinate atlas + setup-defined conditional diagnostic crop.
Color PNGs are CANDIDATE renderings, never authenticated DOS gameplay frames.
"""
import hashlib,json,struct,sys
from pathlib import Path
from PIL import Image
if len(sys.argv)!=3: raise SystemExit('usage: fixture-dir source-root')
fixture=Path(sys.argv[1]);root=Path(sys.argv[2]);h=lambda v:hashlib.sha256(v).hexdigest()
exe=(fixture/'mk2.exe').read_bytes();gra=(fixture/'mountain.gra').read_bytes();P=lambda o:0xa0c54+o
assert h(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
assert h(gra)=='0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6'
qname='mk2_mountain_49_control_placement_grid_o97a_2026-10-09.json';yname='mk2_mountain_exact_full_64_indexed_images_o96y_2026-10-09.json'
qpath=root/qname;ypath=root/yname;q=json.loads(qpath.read_bytes());yb=json.loads(ypath.read_bytes());rows=[x for x in q['controls'] if x['setupOffset']==0x1c31e]
assert len(rows)==39 and sorted(t['descriptorOrdinal'] for t in rows)==sorted(set(t['descriptorOrdinal'] for t in rows))
minx=min(t['signedXDelta'] for t in rows);miny=min(t['signedYDelta'] for t in rows);maxx=max(t['extentXExclusive'] for t in rows);maxy=max(t['extentYExclusive'] for t in rows)
assert (minx,miny,maxx,maxy)==(-8,-48,320,848)
w=maxx-minx;ht=maxy-miny;idx=bytearray(w*ht);alpha=bytearray(w*ht);rect_owner=bytearray(w*ht);opaque_owner=bytearray(w*ht)
records=[];source_opaque=0
for c in rows:
 sp=yb['sprites'][c['descriptorOrdinal']];source=P(c['descriptorOffset']);width=struct.unpack_from('<H',exe,source)[0];height=struct.unpack_from('<H',exe,source+2)[0]
 packed=struct.unpack_from('<I',exe,source+4)[0];start=packed&0xffffff
 assert packed>>24==37 and (width,height,start)==(sp['width'],sp['height'],sp['graStart'])
 p=start;decoded_pixel=bytearray(width*height);decoded_alpha=bytearray(width*height)
 for yy in range(height):
  xx=0
  while xx<width:
   command=struct.unpack_from('<I',gra,p)[0];p+=4
   if command&1:run=command>>1;data=None
   elif command&2:run=command>>10;data=bytes([(command>>2)&255])*run
   else:run=command>>2;data=gra[p:p+run];p+=(run+3)&~3
   assert 0<run<=width-xx
   pos=yy*width+xx
   if data is not None:decoded_pixel[pos:pos+run]=data;decoded_alpha[pos:pos+run]=bytes([1])*run
   xx+=run
 assert p==sp['endExclusive'] and h(decoded_pixel)==sp['pixelSha256'] and h(decoded_alpha)==sp['maskSha256']
 opaque=sum(decoded_alpha);assert opaque==sp['opaquePixels'];source_opaque+=opaque
 for yy in range(height):
  for xx in range(width):
   dst=(c['signedYDelta']-miny+yy)*w+(c['signedXDelta']-minx+xx);pidx=yy*width+xx
   rect_owner[dst]+=1
   if decoded_alpha[pidx]:
    opaque_owner[dst]+=1
    alpha[dst]=1;idx[dst]=decoded_pixel[pidx]
 records.append({'entryIndex':c['entryIndex'],'descriptorOrdinal':c['descriptorOrdinal'],'x':c['signedXDelta'],'y':c['signedYDelta'],'width':width,'height':height,'opaqueSource':opaque})
assert max(rect_owner)==2 and max(opaque_owner)<=2
rect_covered=sum(bool(v) for v in rect_owner);rect_double=sum(v>1 for v in rect_owner);opaque_canvas=sum(alpha);opaque_double=sum(v>1 for v in opaque_owner)
# O97D: data-defined setup sizes, not assumed viewport geometry or game framebuffer.
setup39=[struct.unpack_from('<H',exe,P(0x1c31e)+2*i)[0] for i in range(3)]
setup10=[struct.unpack_from('<H',exe,P(0x1c330)+2*i)[0] for i in range(3)]
assert setup39==[320,768,39] and setup10==[320,200,10]
cw,ch=setup39[:2];crop_idx=bytearray(cw*ch);crop_alpha=bytearray(cw*ch);crop_rect=bytearray(cw*ch)
for cy in range(ch):
 for cx in range(cw):
  src=(cy-miny)*w+(cx-minx);dst=cy*cw+cx;crop_idx[dst]=idx[src];crop_alpha[dst]=alpha[src];crop_rect[dst]=rect_owner[src]
# Explicitly count source rectangle bytes above/below/sides of declared data dimensions.
outside_rect=0;outside_opaque=0
for yy in range(miny,maxy):
 for xx in range(minx,maxx):
  src=(yy-miny)*w+xx-minx
  if not(0<=xx<cw and 0<=yy<ch):
   outside_rect+=int(rect_owner[src]>0);outside_opaque+=int(alpha[src]>0)
palette=[struct.unpack_from('<H',exe,0x8d180+2*i)[0] for i in range(207)]
assert max(idx)<len(palette)
def preview(pix,mask,width,height):
 rgba=bytearray(width*height*4)
 for i,p in enumerate(pix):
  if not mask[i]:continue
  v=palette[p];t=i*4;rgba[t:t+4]=bytes((round(255*(((v>>9)&63)|1)/63),round(255*(((v>>4)&63)|1)/63),round(255*(((v<<1)&63)|1)/63),255))
 return Image.frombytes('RGBA',(width,height),bytes(rgba))
folder=root/'evidence'/'mk2_mountain_o97c_o97d';folder.mkdir(parents=True,exist_ok=True)
outputs={}
for key,payload in [('atlasIndices',idx),('atlasOpacity',alpha),('atlasRectangleOwners',rect_owner),('atlasOpaqueOwners',opaque_owner),('cropIndices',crop_idx),('cropOpacity',crop_alpha)]:
 name={'atlasIndices':'mountain_39_indexed_atlas_328x896.bin','atlasOpacity':'mountain_39_opacity_atlas_328x896.bin','atlasRectangleOwners':'mountain_39_rectangle_owners_328x896.bin','atlasOpaqueOwners':'mountain_39_opaque_owners_328x896.bin','cropIndices':'mountain_39_setup_crop_indices_320x768.bin','cropOpacity':'mountain_39_setup_crop_opacity_320x768.bin'}[key]
 f=folder/name;f.write_bytes(payload);outputs[key]={'path':f.relative_to(root).as_posix(),'bytes':len(payload),'sha256':h(payload)}
for key,pixels,mask,ww,hh,name in [('atlasPreview',idx,alpha,w,ht,'mountain_39_atlas_palette_candidate.png'),('cropPreview',crop_idx,crop_alpha,cw,ch,'mountain_39_setup_crop_palette_candidate.png')]:
 f=folder/name;preview(pixels,mask,ww,hh).save(f,optimize=True);outputs[key]={'path':f.relative_to(root).as_posix(),'bytes':f.stat().st_size,'sha256':h(f.read_bytes())}
report={'format':'mk2_o97c_o97d_mountain_tall_conditional_source_layer_v1','status':'SUCCESS','fixture':{'exeSha256':h(exe),'graSha256':h(gra)},'parent':{'o97aSha256':h(qpath.read_bytes()),'o96ySha256':h(ypath.read_bytes())},'o97c':{'setupOffset':0x1c31e,'atlasOrigin':{'x':minx,'y':miny},'atlasDimensions':{'width':w,'height':ht},'sourceRecords':records,'rectPositionsCovered':rect_covered,'rectPositionsDoubleOwned':rect_double,'sourceOpaquePixelInstances':source_opaque,'finalOpaqueAtlasPixels':opaque_canvas,'opaquePositionsDoubleOwned':opaque_double,'opaqueAtlasTransparentPixels':len(alpha)-opaque_canvas,'drawOrder':'serialized control entry order; transparency retains previously written pixel'},'o97d':{'setupRecords':[{'offset':0x1c31e,'width':320,'height':768,'entries':39},{'offset':0x1c330,'width':320,'height':200,'entries':10}],'cropDimensions':{'width':cw,'height':ch},'cropOpaquePixels':sum(crop_alpha),'cropTransparentPixels':len(crop_alpha)-sum(crop_alpha),'cropRectPositionsCovered':sum(bool(x) for x in crop_rect),'outsideDeclaredRectPositionsCovered':outside_rect,'outsideDeclaredOpaquePixels':outside_opaque,'croppingInterpretation':'diagnostic only, not verified runtime camera or blitter'},'outputs':outputs,'hypotheses':{'all39SpritesDecodeAndCanBePositioned':'SUPPORTED_CONDITIONAL','setupDeclares320By768Versus320By200':'SUPPORTED_STATIC_DATA','tallAtlasIsObservedStageFrame':'REJECTED','drawOrderIsActualGameZOrder':'UNPROVEN','tenTileAnd39SpriteLayersSimultaneouslyActive':'UNPROVEN','candidateRgbIsFinalGameplayColor':'UNPROVEN'}}
file=root/'mk2_mountain_tall_layer_atlas_and_setup_crop_o97c_o97d_2026-10-09.json';file.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'PASS','39records':len(records),'sourceOpaqueInstances':source_opaque,'atlasOpaquePixels':opaque_canvas,'rectDouble':rect_double,'opaqueDouble':opaque_double,'cropOpaque':sum(crop_alpha),'cropTransparent':len(crop_alpha)-sum(crop_alpha),'outsideOpaque':outside_opaque,'atlasPNG':outputs['atlasPreview']['path'],'report':str(file)}))
