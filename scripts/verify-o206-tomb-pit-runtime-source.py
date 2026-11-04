#!/usr/bin/env python3
"""O206: independently source-guarded Tomb video geometry + Pit root graph.

Read-only. Requires numpy, Pillow, OpenCV; calls the O205 original-source
sprite decoder (same explicitly pinned fixture, no source-game mutations).
No runtime mode, true camera equation or Pit gameplay claim is made.
"""
from __future__ import annotations
import argparse,collections,csv,hashlib,importlib.util,json,struct,sys,zipfile
from pathlib import Path
import cv2,numpy as np
from PIL import Image,ImageDraw

EXPECTED={
 'exe':'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',
 'tomb':'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
 'pit':'af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96',
 'video':'5295afece147c8de1978ab67db6aaa1cd0beb1db4a32b369dfd0ff289de16c44'}
BASE=0xa0c54
SPECS={
 'tomb':{
  'stage_index':1,'setups':[0x17358+0x12*i for i in range(6)],'inputs':0x172dc,
  'roots':[{'mode':'2','address':0x171f0,'length':0x7c,
     'fixed':[(1,0x20,-52),(2,0x28,158),(3,0x30,-58),(5,0x38,94),(6,0x44,46)],
     'dynamic':[(1,0x50,7),(2,0x58,6),(3,0x60,5),(5,0x68,4),(6,0x70,2)],'separator':0x4c,'terminator':0x78},
   {'mode':'1 and fallback','address':0x1726c,'length':0x70,
     'fixed':[(1,0x20,-52),(2,0x28,158),(4,0x30,-58),(6,0x40,46)],
     'dynamic':[(1,0x4c,7),(2,0x54,6),(3,0x5c,5),(6,0x64,2)],'separator':0x48,'terminator':0x6c}]},
 'pit':{
  'stage_index':6,'setups':[0x18b44+0x12*i for i in range(6)],'inputs':0x18a84,
  'roots':[{'mode':'2','address':0x18990,'length':0x8c,
    'fixed':[(1,0x20,182),(2,0x28,150),(3,0x30,150),(4,0x3c,32),(5,0x44,130),(6,0x4c,32)],
    'dynamic':[(1,0x58,7),(2,0x60,6),(3,0x68,5),(4,0x70,3),(5,0x78,2),(6,0x80,1)],
    'separator':0x54,'terminator':0x88},
   {'mode':'1 and fallback','address':0x18a1c,'length':0x68,
    'fixed':[(1,0x20,182),(2,0x28,150),(6,0x40,32)],
    'dynamic':[(1,0x4c,7),(2,0x54,6),(6,0x5c,1)],'separator':0x48,'terminator':0x64}]}}

def sha(b):return hashlib.sha256(b).hexdigest()
def u32(b,o):return struct.unpack_from('<I',b,BASE+o)[0]
def s32(b,o):return struct.unpack_from('<i',b,BASE+o)[0]
def required(x,why):
 if not x:raise ValueError('O206 source integrity: '+why)

def parse_original_roots(exe,fixups):
 # fx is independently parsed from every original LE relocation (O120 parser).
 roots={};modes=[('mode_equals_2',0x15bec),('mode_equals_1',0x15c68),('mode_other',0x15ce4)]
 for label,spec in SPECS.items():
  stage=spec['stage_index'];rt=[]
  observed=[u32(exe,t+4*stage) for _,t in modes]
  expected=[spec['roots'][0]['address'],spec['roots'][1]['address'],spec['roots'][1]['address']]
  required(observed==expected,f'{label} stage-index {stage} dispatch pointers {observed}')
  for (_,table),dest in zip(modes,observed):
   fx=fixups.get((2,table+stage*4))
   required(fx and fx['kind']==7 and fx['targetOffset']==dest and fx['targetObject']==2,f'{label} mode table LE fixup')
  vals=[s32(exe,spec['inputs']+4*k) for k in range(9)]
  for rr in spec['roots']:
   root=rr['address']
   required(u32(exe,root+0x14)==spec['inputs'],f'{label} input table ptr')
   required(u32(exe,root+0x1c)==0x77453,f'{label} scene state ptr')
   required(s32(exe,root+rr['separator'])==-2 and u32(exe,root+rr['terminator'])==0,f'{label} group marker')
   fixed=[];dyn=[]
   for kind in ('fixed','dynamic'):
    for variant,rel,target in rr[kind]:
     at=root+rel;offset=spec['setups'][variant-1]
     required(u32(exe,at)==offset,f'{label} {kind} setup {variant}')
     fx=fixups.get((2,at))
     required(fx and fx['kind']==7 and fx['flags']==16 and fx['targetObject']==2 and fx['targetOffset']==offset,f'{label} {kind} setup LE fixup')
     if kind=='fixed':
      value=s32(exe,at+4)
      required(value==target*65536,f'{label} fixed field {variant}')
      fixed.append({'setup':variant,'setup_object2':offset,'reference_field_object2':at,'reference_physical':BASE+at,
                    'original_signed_16_16':value,'integer_part':target})
     else:
      p=u32(exe,at+4)
      required(p==0x84310+4*target,f'{label} motion channel ptr {variant}')
      xf=fixups.get((2,at+4))
      required(xf and xf['kind']==7 and xf['flags']==16 and xf['targetObject']==2 and xf['targetOffset']==p,f'{label} channel pointer relocation')
      dyn.append({'setup':variant,'setup_object2':offset,'reference_field_object2':at,'reference_physical':BASE+at,
                  'accumulator_object2':p,'channel':target,'original_channel_input_16_16':vals[target]/65536})
   rt.append({'mode':rr['mode'],'root_object2':root,'root_physical':BASE+root,
              'root_sha256':sha(exe[BASE+root:BASE+root+rr['length']]),'root_length':rr['length'],
              'fixed_setup_links':fixed,'accumulator_setup_links':dyn,'live_mode_observed':False})
  roots[label]={'stage_index':stage,'root_table_values':observed,'motion_input_table_object2':spec['inputs'],
                'motion_input_words':vals,'source_inputs_16_16':[v/65536 for v in vals],'mode_roots':rt}
  if label=='pit':
   stream=u32(exe,rt[0]['root_object2']+0x18)
   required(stream==0x18aa8 and u32(exe,rt[1]['root_object2']+0x18)==stream,'Pit shared original stage stream pointer')
   entries=[]
   for j in range(10):
    p=stream+j*8;ptr=u32(exe,p);half=u32(exe,p+4)
    required(ptr>0 and ptr not in (0xfffffffe,0xffffffff),'Pit bounded stage stream marker')
    required(0x84312<=half<=0x8432e and (half-0x84312)%4==0,'Pit bounded stream accumulator high-word')
    entries.append({'entry':j,'object2':p,'physical':BASE+p,'object_global_ptr':ptr,'accumulator_high_word_object2':half,'channel':(half-0x84312)//4})
   required(u32(exe,stream+80)==0,'Pit stage stream terminator')
   required([r['channel'] for r in entries]==[0,1,2,3,4,5,6,7,7,7],'Pit original high-word channel sequence')
   roots[label]['original_stage_control_stream']={'object2':stream,'entry_count':10,'positive_pointer_pairs':entries,
     'terminator_object2':stream+80,'contains_negative_one_packed_floor_command':False,
     'qualification':'No -1 command in this bounded stage-control list; does not prove the game never renders a floor by other means'}
 return roots

def load_o205_source_tools(path):
 m=importlib.util.spec_from_file_location('o205',str(path));required(m is not None,'O205 source tool not available');mod=importlib.util.module_from_spec(m);m.loader.exec_module(mod)
 return mod

def crop(cap,t):
 cap.set(cv2.CAP_PROP_POS_MSEC,int(t*1000));ok,im=cap.read()
 required(ok and im.shape[:2]==(432,644),f'video native viewport t={t}')
 return cv2.resize(im[32:432,2:642],(320,200),interpolation=cv2.INTER_AREA)

def sift_sample(kl,dl,kv,dv,matcher):
 if dl is None or dv is None:return []
 v=[]
 for pair in matcher.knnMatch(dl,dv,k=2):
  if len(pair)<2:continue
  a,b=pair
  if a.distance>=0.73*b.distance:continue
  px,py=kl[a.queryIdx].pt;vx,vy=kv[a.trainIdx].pt
  v.append((round(vx-px),round(vy-py),round(a.distance,3)))
 return v

def highest_support(v):
 c=collections.Counter((x,y) for x,y,*_ in v)
 if not c:return None
 cand=c.most_common(100)
 px,py=max(((x,y) for (x,y),_ in cand),key=lambda p:sum(abs(qx-p[0])<=2 and abs(qy-p[1])<=2 for qx,qy,*_ in v))
 return {'x':px,'y':py,'support':sum(abs(qx-px)<=2 and abs(qy-py)<=2 for qx,qy,*_ in v)}

def compose(g,architecture,sky,xarch,yarch,ysky):
 # Strict preview of only TWO separate original setups. Uncovered areas left dark.
 im=Image.new('RGBA',(320,200),(12,17,24,255))
 im.alpha_composite(sky,(0,int(ysky)))
 # Pillow alpha_composite with negative coordinates supports clipping to viewport.
 im.alpha_composite(architecture,(int(xarch),int(yarch)))
 return im.convert('RGB')

def preview_page(g,arch,sky,x,y,t,source_to_runtime_anchored=False):
 expected_y_sky=y+104
 rec=compose(g,arch,sky,x,y,expected_y_sky)
 im=Image.new('RGB',(960,248),(14,20,30));d=ImageDraw.Draw(im)
 diff=np.minimum(np.abs(np.asarray(rec).astype('i2')-g[:,:,::-1].astype('i2'))*3,255).astype('uint8')
 panels=[Image.fromarray(g[:,:,::-1]),rec,Image.fromarray(diff)]
 for k,(panel,label) in enumerate(zip(panels,['DOSBOX RECORDING','TOMB SOURCE: ARCH + SKY ONLY','3x RGB DIFFERENCE'])):
  im.paste(panel,(320*k,28));d.text((320*k+6,7),label,fill=(230,239,255))
 d.text((6,232),f't={t:.1f}s; architecture ({x},{y}), sky (0,{expected_y_sky}); illustration only; no floor/fighters/HUD',fill=(196,217,238))
 return im

def run(args):
 out=args.out;required(not out.exists(),f'output path already exists: {out}');out.mkdir(parents=True)
 bs={k:getattr(args,k).read_bytes() for k in ('exe','tomb','pit')}
 hashes={k:sha(bs[k]) for k in bs};hashes['video']=sha(args.video.read_bytes())
 for k,v in EXPECTED.items():required(hashes[k]==v,f'{k} file fingerprint mismatch')
 sys.path.insert(0,str(args.project/'tools/mk2_native_stage_palettes'))
 from trace_o120_setup_graph import fixups
 fx=fixups(bs['exe']);required(len(fx)>=20000,'unexpected relocation census')
 roots=parse_original_roots(bs['exe'],fx)
 original_tools=load_o205_source_tools(args.project/'scripts/verify-o205-kombat-tomb-pit-identity.py')
 layers,orep=original_tools.render_stage(bs['exe'],bs['tomb'],original_tools.STAGES['tomb'],out/'derived_original_tomb_setups')
 required(len(layers)==6 and [im.size for im in layers]==[(896,56),(896,48),(850,224),(850,224),(800,30),(320,80)],'source stage dimensions')
 source={}
 sift=cv2.SIFT_create(nfeatures=2200,contrastThreshold=.014,edgeThreshold=13);bf=cv2.BFMatcher()
 for i in (3,6):
  rgba=np.asarray(layers[i-1].convert('RGBA'))
  gr=cv2.cvtColor(rgba[:,:,:3],cv2.COLOR_RGB2GRAY)
  kp,desc=sift.detectAndCompute(gr,np.where(rgba[:,:,3]>220,255,0).astype(np.uint8))
  required(desc is not None and len(kp)>25,f'source SIFT descriptors {i}');source[i]=(kp,desc)
 cap=cv2.VideoCapture(str(args.video));required(cap.isOpened(),'open recorded video');fps=cap.get(cv2.CAP_PROP_FPS);count=cap.get(cv2.CAP_PROP_FRAME_COUNT)
 report_rows=[];offset_hist=collections.Counter();raw_matches={}
 for t10 in range(5,386,10):
  t=t10/10;img=crop(cap,t)
  kv,dv=sift.detectAndCompute(cv2.cvtColor(img,cv2.COLOR_BGR2GRAY),None)
  arch=sift_sample(*source[3],kv,dv,bf);sky=sift_sample(*source[6],kv,dv,bf)
  a=highest_support(arch);required(a is not None and a['support']>=5,f'architecture localization at {t}')
  near=[(x,y) for x,y,*_ in sky if abs(x)<=6]
  offset_hist.update(y-a['y'] for x,y in near)
  support=sum(abs(y-a['y']-104)<=1 for x,y in near)
  neg_up=sum(abs(y-a['y']-96)<=1 for x,y in near)
  neg_down=sum(abs(y-a['y']-112)<=1 for x,y in near)
  report_rows.append({'second':t,'architecture_source_x_candidate':a['x'],'architecture_source_y':a['y'],
     'arch_matches_within_2_pixels':a['support'],'sky_raw_correspondences':len(sky),
     'sky_matches_near_x0':len(near),'sky_predicted_y':a['y']+104,
     'source_delta_104_inlier_votes':support,'wrong_delta_96_inlier_votes':neg_up,'wrong_delta_112_inlier_votes':neg_down,
     'camera_vertical_shift_from_signed_source':a['y']+58})
  raw_matches[str(t)]={'architecture':arch,'sky':sky}
  if t in (3.5,24.5):
   # O205 independently matched one unique skull patch at t=3.5, x -6; the
   # SIFT source repeats ~176px. Other previews retain leading SIFT position.
   x=-6 if t==3.5 else a['x']
   preview_page(img,layers[2],layers[5],x,a['y'],t).save(out/f'video_comparison_t{str(t).replace(".","p")}.png')
 cap.release()
 assert len(report_rows)==39
 with open(out/'tomb_video_samples.csv','w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=report_rows[0].keys());w.writeheader();w.writerows(report_rows)
 (out/'raw_source_video_feature_matches.json').write_text(json.dumps(raw_matches,separators=(',',':')))
 total=sum(r['source_delta_104_inlier_votes'] for r in report_rows);timestamps=sum(r['source_delta_104_inlier_votes']>0 for r in report_rows)
 neg=[sum(r[k] for r in report_rows) for k in ('wrong_delta_96_inlier_votes','wrong_delta_112_inlier_votes')]
 required(timestamps>=30 and total>=90,'source relative height not witnessed')
 # Produce an unfitted diagnostic: target +104 is pre-specified by authentic
 # source operands; the histogram of ALL near-zero-horizontal sky votes is raw.
 graph=Image.new('RGB',(1100,520),(13,23,36));d=ImageDraw.Draw(graph)
 d.text((25,18),'O206 | KOMBAT TOMB: ORIGINAL SOURCE HEIGHT DIFFERENCE vs DOSBOX VIDEO',fill=(244,247,251))
 d.text((25,46),'Original root: full architecture -58; sky +46; predicted separation +104 native rows',fill=(178,204,233))
 top=max(offset_hist.values());lo,hi=72,132
 for dy in range(lo,hi+1):
  x=36+(dy-lo)*16;votes=offset_hist[dy];height=int(votes/max(1,top)*260)
  color=(89,225,164) if abs(dy-104)<=1 else (93,134,182)
  d.rectangle((x,385-height,x+10,385),fill=color)
 for dy in [80,96,104,112,128]:
  x=36+(dy-lo)*16;d.text((x-8,398),str(dy),fill=(232,240,250))
 d.text((25,445),f'Video: {len(report_rows)} native-resolution samples, {timestamps} source-height-correlated samples; {total} predicted votes',fill=(245,218,155))
 d.text((25,469),f'Controls: +96 yields {neg[0]} votes; +112 yields {neg[1]} votes. Architecture horizontal repeats remain ambiguous.',fill=(187,213,232))
 graph.save(out/'source_height_holdout_comparison.png')
 # Distinct Pit graphic root chart
 pit=roots['pit'];pimg=Image.new('RGB',(1060,350),(15,24,37));p=ImageDraw.Draw(pimg)
 p.text((20,19),'THE PIT | SOURCE-VERIFIED MODE ROOTS (NOT OBSERVED GAMEPLAY)',fill=(238,243,250))
 for j,mode in enumerate(pit['mode_roots']):
  y=72+j*123;p.text((22,y),f'Mode {mode["mode"]} | root Object 2: {mode["root_object2"]:#x}',fill=(201,221,246))
  fset={v['setup'] for v in mode['fixed_setup_links']};aset={v['setup'] for v in mode['accumulator_setup_links']}
  for i in range(1,7):
   x=20+(i-1)*169;on=i in fset and i in aset
   p.rounded_rectangle((x,y+26,x+153,y+72),radius=6,fill=(24,79,65) if on else (49,52,65),outline=(102,210,163) if on else (111,123,145))
   p.text((x+11,y+42),f'Setup {i}: {"linked" if on else "absent"}',fill=(235,241,246))
  p.text((25,y+81),'Original first-group vertical values: '+', '.join(f'{q["setup"]}: {q["integer_part"]:+d}' for q in mode['fixed_setup_links']),fill=(210,197,161))
 pimg.save(out/'pit_conditional_source_graph.png')
 report={'format':'mkdos_o206_tomb_runtime_vertical_offsets_pit_roots_v1','status':'original-source-verified-and-video-feature-correlated',
  'input_sha256':hashes,'source_LE_fixup_count':len(fx),
  'stage_root_evidence':roots,
  'tomb_source_local_layers':[{'setup':i+1,'dimensions':im.size,'rgba_sha256':sha(im.tobytes())} for i,im in enumerate(layers)],
  'source_video_model':{'tomb_architecture_setup':3,'tomb_sky_setup':6,
    'mode2_original_signed_16_16_origin_values':{'arch':-58,'sky':46},
    'predicted_relative_y':104,'source_pinned_before_video_fit':True,
    'native_video_samples':len(report_rows),'sample_times':'0.5 through 38.5 seconds, 1-second steps',
    'architecture_localizations_at_all_timestamps':len(report_rows),'positive_height_witness_samples':timestamps,
    'positive_height_match_votes':total,'wrong_offset_controls':{'96':neg[0],'112':neg[1]},
    'sky_relative_height_histogram':{str(k):v for k,v in sorted(offset_hist.items())},
    'example_source_to_screen_registration':{'time_seconds':3.5,'architecture_screen_origin_x':-6,
    'architecture_screen_origin_y':-59,'architecture_x_basis':'Independent O205 exact original skull patch; horizontal periodic aliases remain',
    'sky_screen_origin_x':0,'sky_screen_origin_y':45},
    'method':'SIFT matching opaque original O205 Tomb setup-3 + setup-6 RGBA pixels to independent video native 320x200; all sky correspondences within x +/-6 retained in relative-y histogram, source-predicted delta 104 scored with tolerance 1; no per-timestamp sky y fitting'},
  'pit_live_video_available':False,
  'limitations':['Strong relative-layer height correlation does not identify active original scene-mode global.',
  'Architecture x position has 170-180px repeated-skull aliases; raw correspondences retained, not collapsed into a final parallax equation.',
  'Sky horizontal stationary assumption uses absolute video x 0 +/-6 and is source-inspired; alternative sky positioning requires gameplay instrumentation.',
  'The two-layer diagnostic PNG has no original floor, animated effects, fighter sprites, HUD or full draw-order reconstruction.',
  'The Pit stage index 6 has source-authenticated six/three layer roots and numerical movement inputs; a matching Pit gameplay video is not available.',
  'Original numeric channel inputs are not by themselves proven runtime velocities; no frame-time or palette-bank live-state claims.']}
 (out/'O206_report.json').write_text(json.dumps(report,indent=2)+'\n')
 (out/'REPRODUCE.md').write_text("""# O206 — Reproduction and limits

Use unmodified source files whose SHA-256s appear in O206_report.json.

```bash
python scripts/verify-o206-tomb-pit-runtime-source.py --exe /path/to/MK2.EXE --tomb /path/to/TOMB.GRA --pit /path/to/PIT.GRA --video /path/to/Recording.mp4 --project /path/to/MK-DOS-Archive --out /new/O206
```

Requires Python numpy, opencv-python, Pillow. Outputs original-derived layer PNGs separately from hypothesis comparison. The source-anchored 104-row prediction is not estimated from video. See CSV + raw correspondences for all controls and alias candidates. Gameplay mode and exact camera equation remain unverified.
""")
 print('PASS O206',len(fx),'typed LE entries;',timestamps,'/',len(report_rows),'timestamps match original signed vertical delta 104; votes',total,'controls',neg)
 print('Pit mode setup census:',[len(m['fixed_setup_links']) for m in roots['pit']['mode_roots']])

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__)
 for k in ('exe','tomb','pit','video'):p.add_argument('--'+k,type=Path,required=True)
 p.add_argument('--project',type=Path,required=True)
 p.add_argument('--out',type=Path,required=True)
 run(p.parse_args())
