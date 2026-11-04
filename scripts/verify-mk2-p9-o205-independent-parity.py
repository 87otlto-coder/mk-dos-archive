#!/usr/bin/env python3
"""Independent P9 source-plane parity against original O205 Python renderer.

Original O205 decoder is invoked as-is for the six PIT.GRA source-local
layers. This is NOT validation of complete scene placement or runtime DAC.
"""
import argparse, hashlib, importlib.util, json, sys, tempfile, zipfile
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np

def sha(data):return hashlib.sha256(data).hexdigest()
def check(ok,what):
 if not ok: raise AssertionError(what)

ap=argparse.ArgumentParser();ap.add_argument('fixture',type=Path);ap.add_argument('package',type=Path);ap.add_argument('o205_script',type=Path);ap.add_argument('report',type=Path);ap.add_argument('contact',type=Path)
a=ap.parse_args();spec=importlib.util.spec_from_file_location('o205',a.o205_script);o205=importlib.util.module_from_spec(spec);spec.loader.exec_module(o205)
exe=(a.fixture/'mk2.exe').read_bytes();gra=(a.fixture/'pit.gra').read_bytes()
check(sha(exe)==o205.EXPECTED['exe'],'original executable identity')
check(sha(gra)==o205.EXPECTED['pit'],'original Pit resource identity')
assert o205.STAGES['pit']['setups']==[0x18b44+0x12*i for i in range(6)]
checks=3
with tempfile.TemporaryDirectory(prefix='p9-o205-') as d:
 layers,report=o205.render_stage(exe,gra,o205.STAGES['pit'],Path(d))
 assert len(layers)==6;checks+=1
 with zipfile.ZipFile(a.package) as z:
  manifest=json.loads(z.read('manifest.json'));check(len(manifest['layers'])==6,'P9 manifest has six layers');checks+=1
  check(report['palette_physical']==0x895ac and report['palette_count']==81,'O205 palette identity');checks+=1
  check(report['resource_id']==32,'O205 resource id');checks+=1
  previews=[];details=[]
  for i,(im,ref,pm) in enumerate(zip(layers,report['source_local_setups'],manifest['layers']),start=1):
   paths=pm['paths'];actual=Image.open(z.open(paths['png'])).convert('RGBA')
   check(actual.size==im.size,f'layer {i} dimensions');checks+=1
   check(actual.tobytes()==im.tobytes(),f'layer {i} O205 source RGBA mismatch');checks+=1
   check(sha(actual.tobytes())==ref['rgba_sha256'],f'layer {i} source RGBA hash');checks+=1
   check(pm['sourceObject2']==ref['object2_offset'],f'layer {i} setup pointer');checks+=1
   check(pm['controls']==ref['original_control_count'],f'layer {i} control count');checks+=1
   check(pm['clippedPixelWrites']==ref['clipped_writes'],f'layer {i} clipped pixels');checks+=1
   check(pm['paintedPixelWrites']==ref['painted_writes'],f'layer {i} painted pixels');checks+=1
   check(len(pm['originalPlacements'])==len(ref['placements']),f'layer {i} placement list');checks+=1
   for j,(p,q) in enumerate(zip(pm['originalPlacements'],ref['placements'])):
    check((p['ordinal'],p['x'],p['y'],p['descriptorObject2'],p['offset'],p['width'],p['height'],p['commands'])==
      (q['control_ordinal'],q['x'],q['y'],q['sprite_descriptor_object2'],q['source_gra_offset'],q['width'],q['height'],q['decoded_commands']),f'layer {i} placement {j}');checks+=1
   indices=z.read(paths['indices']);mask=z.read(paths['mask']);check(len(indices)==im.width*im.height and len(mask)==len(indices),f'layer {i} indexed buffers');checks+=1
   check(set(mask)<=set((0,1)),f'layer {i} binary mask');checks+=1
   # Source RGBA's opaque status for source indices >=1 must be compatible
   # with the exported command-coverage mask. Index zero is transparent in O205.
   rgbap=np.asarray(actual,dtype='u1');ma=np.frombuffer(mask,dtype='u1').reshape((im.height,im.width));idx=np.frombuffer(indices,dtype='u1').reshape((im.height,im.width))
   check(bool(np.all(rgbap[:,:,3][ma==0]==0)),f'layer {i} zero-mask transparency');checks+=1
   check(bool(np.all(rgbap[:,:,3][(ma==1)&(idx!=0)]==255)),f'layer {i} opaque nonzero indices');checks+=1
   # Checkerboard is a preview-only background, NOT a complete Pit scene.
   maxw,maxh=510,200;scale=min(maxw/im.width,maxh/im.height)
   thumb=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.NEAREST)
   bg=Image.new('RGBA',thumb.size,(24,28,38,255));back=np.asarray(bg).copy()
   back[:,:,0:3]=np.where((np.indices((thumb.height,thumb.width)).sum(axis=0)//12)%2==0,42,60)[:,:,None]
   bg=Image.fromarray(back,'RGBA');bg.alpha_composite(thumb)
   previews.append(bg.convert('RGB'));details.append({'setup':i,'size':[im.width,im.height],'originalControls':ref['original_control_count'],'O205RgbaSha256':ref['rgba_sha256']})
 # Contact sheet: original decoded setup-local layers, not assembled scene.
 sheet=Image.new('RGB',(1160,820),(13,18,27));draw=ImageDraw.Draw(sheet)
 draw.text((24,16),'P9 | The Pit II - six original PIT.GRA setup-local backgrounds',fill=(230,235,244))
 draw.text((24,36),'Source-linked palette PREVIEW only. Separate setup coordinate spaces. NOT a composed gameplay scene.',fill=(232,179,120))
 for i,prev in enumerate(previews):
  col=i%2;row=i//2;x=24+col*570;y=82+row*240
  draw.text((x,y-16),f'Setup {i+1}  |  {details[i]["size"][0]} x {details[i]["size"][1]}  |  {details[i]["originalControls"]} original controls',fill=(215,222,233))
  sheet.paste(prev,(x,y))
 sheet.save(a.contact)
 data={'pass':'P9','status':'PASS','checks':checks,'sourceRenderer':'Unmodified O205 Python render_stage','layers':details,'sourcePaletteRuntimeDACVerified':False,'finalStageCompositionVerified':False}
 a.report.write_text(json.dumps(data,indent=2)+'\n');print(json.dumps(data,indent=2))
