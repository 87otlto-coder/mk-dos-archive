#!/usr/bin/env python3
"""O208: independent source-to-video witness for the actual MK2 Pit stage.

Dependencies numpy, Pillow, opencv-python; read only. Raw game files remain with owner.
Evidence records unverified assembly choices separately from executable values.
"""
from __future__ import annotations
import argparse, collections, csv, hashlib, importlib.util, json
from pathlib import Path
import cv2, numpy as np
from PIL import Image,ImageDraw
EXPECTED = {
 'exe':'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',
 'pit':'af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96',
 'video':'3fecb35f35fb6786528b64ac5b6322ef65564885bf735405955cb1f11f928d94'}
FIXED_Y=[182,150,150,32,130,32]
CHANNEL=[7,6,5,3,2,1]
MOTION=[1.5,1.5,.375,.1875,.09375,0]
PERIOD=280 # Verified duplicate bridge/floor source motifs; matching period, not necessarily runtime repeating rule.
def digest(p):
 with open(p,'rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def crop(cap,t):
 cap.set(cv2.CAP_PROP_POS_MSEC,round(t*1000));ok,f=cap.read()
 if not ok or f.shape[:2]!=(426,638):raise ValueError(f'video viewport format mismatch at {t}: {f.shape if ok else None}')
 return cv2.resize(f[26:426,:638],(320,200),interpolation=cv2.INTER_AREA)
def source_keypoints(im,sift):
 a=np.asarray(im.convert('RGBA'))
 return sift.detectAndCompute(cv2.cvtColor(a[:,:,:3],cv2.COLOR_RGB2GRAY),(a[:,:,3]>180).astype('uint8')*255)
def translations(src,video,bf,ratio=.75):
 k,d=src;kv,dv=video
 if d is None or dv is None:return []
 out=[]
 for pair in bf.knnMatch(d,dv,k=2):
  if len(pair)!=2 or pair[0].distance>=ratio*pair[1].distance:continue
  m=pair[0];sx,sy=k[m.queryIdx].pt;vx,vy=kv[m.trainIdx].pt
  out.append((round(vx-sx),round(vy-sy),round(m.distance,3)))
 return out
def nearby_votes(entries,x,y,spread=2,period=None):
 def dx(a):return min(abs(a-x+period*k) for k in range(-6,7)) if period else abs(a-x)
 return sum(dx(a)<=spread and abs(b-y)<=spread for a,b,_ in entries)
def best_x(entries,y,lo,hi):
 viable=[(x,q) for x,q,_ in entries if lo<=x<=hi and abs(q-y)<=2]
 if not viable:return (None,0)
 opts=sorted({x for x,_ in viable});z=[(nearby_votes(entries,x,y),x) for x in opts]
 support,x=max(z,key=lambda z:(z[0],-abs(z[1]+30)))
 return (x,support)
def paint_scene(layers,settings,dy=0,extended=False):
 w,h=(320,200)
 img=Image.new('RGBA',(w,h),(3,8,25,255))
 # Front-to-back is NOT verified. This order is an editable hypothesis.
 for i in (6,5,4,3,2,1):
  im=layers[i-1];x=round(settings[i-1]);y=FIXED_Y[i-1]-3+dy
  img.alpha_composite(im,(x,y))
 return img.convert('RGB')
def comparison(frame,source,second,positions,annotation):
 ref=Image.fromarray(cv2.cvtColor(frame,cv2.COLOR_BGR2RGB))
 a=np.asarray(ref,dtype='i2');b=np.asarray(source,dtype='i2')
 delta=Image.fromarray(np.clip(np.abs(a-b)*3,0,255).astype('uint8'))
 out=Image.new('RGB',(960,244),(12,18,28));d=ImageDraw.Draw(out)
 for k,(im,label) in enumerate(zip((ref,source,delta),('RECORDED PIT GAMEPLAY','O208: EXPERIMENTAL SOURCE COMPOSITION','ABS RGB DIFFERENCE x3'))):
  out.paste(im,(k*320,28));d.text((k*320+4,8),label,fill=(236,242,249))
 d.text((6,232),f'{second:.1f}s | x of setups 1-6 = {positions} | {annotation}',fill=(201,220,241))
 return out

def main(args):
 out=Path(args.out)
 if out.exists():raise ValueError('Use a new output directory; never overwrite evidence')
 out.mkdir(parents=True)
 inputs={'exe':args.exe,'pit':args.pit,'video':args.video}
 hashes={k:digest(p) for k,p in inputs.items()}
 if hashes!=EXPECTED:raise ValueError(f'input identity mismatch: {hashes}')
 m_spec=importlib.util.spec_from_file_location('o205_stage_decoder',str(Path(args.project)/'scripts/verify-o205-kombat-tomb-pit-identity.py'))
 m=importlib.util.module_from_spec(m_spec);m_spec.loader.exec_module(m)
 layers,decoded=m.render_stage(Path(args.exe).read_bytes(),Path(args.pit).read_bytes(),m.STAGES['pit'],out/'source_derived_setups')
 if [i.size for i in layers]!=[(1400,64),(1400,768),(832,24),(376,120),(504,120),(320,120)]:raise ValueError('wrong original setup geometry')
 sift=cv2.SIFT_create(nfeatures=2600,contrastThreshold=.015,edgeThreshold=12)
 bf=cv2.BFMatcher()
 original={i:source_keypoints(layers[i-1],sift) for i in (1,2,3,4,5,6)}
 cap=cv2.VideoCapture(str(args.video))
 if not cap.isOpened():raise ValueError('cannot open gameplay recording')
 duration=float(cap.get(cv2.CAP_PROP_FRAME_COUNT)/cap.get(cv2.CAP_PROP_FPS))
 report=[];raw={};base4=-30;base2=-261
 times=[x+0.5 for x in range(35)]
 for t in times:
  video=crop(cap,t)
  vv=sift.detectAndCompute(cv2.cvtColor(video,cv2.COLOR_BGR2GRAY),None)
  matches={i:translations(original[i],vv,bf) for i in (2,4,6)}
  # Source-six moon is fixed at x=-1. Its vertical offset is independently detected.
  c6=collections.Counter(y for x,y,_ in matches[6] if abs(x+1)<=2 and 17<=y<=58)
  y6=c6.most_common(1)[0][0] if c6 else None
  if y6 is None:dy=None;y4=None;x4=None;n4=0
  else:
   dy=y6-29;y4=29+dy;x4,n4=best_x(matches[4],y4,-100,100)
  y2=147+dy if dy is not None else None
  # Source channel 6 = 1.5, channel 3 = 0.1875 -> ratio 8.
  candidate2=base2+round((x4-base4)*8) if x4 is not None else None
  controls={}
  for rate in (0,2,4,8,12):
   controls[str(rate)] = nearby_votes(matches[2],base2+round((x4-base4)*rate),y2,2,PERIOD) if x4 is not None else 0
  matched2=best_x(matches[2],y2,-1300,320) if y2 is not None else (None,0)
  row={'time_seconds':t,'moon_source_x_estimate':-1,'moon_source_y':y6,'shared_camera_vertical_adjustment':dy,
      'setup4_source_x':x4,'setup4_source_y':y4,'setup4_feature_votes':n4,
      'setup2_source_x_aliased_peak':matched2[0],'setup2_source_y':y2,
      'setup2_candidate_x_from_source_ratio_8':candidate2,'setup2_feature_votes_at_candidate':controls.get('8',0),
      'control_votes_source2':controls,'raw_matches':{str(k):len(v) for k,v in matches.items()}}
  report.append(row)
  raw[str(t)]={str(k):matches[k] for k in matches}
 cap.release()
 # All totals documented; do not force a positive result into the verifier.
 aggregate={str(rate):sum(r['control_votes_source2'][str(rate)] for r in report) for rate in (0,2,4,8,12)}
 valid=[r for r in report if r['setup4_source_x'] is not None]
 y_confirm=sum(r['setup4_source_y']-r['moon_source_y']==0 and r['setup2_source_y']-r['moon_source_y']==118 for r in valid)
 matched_mode2=sum(r['setup4_feature_votes']>=5 for r in report)
 if not any(r['shared_camera_vertical_adjustment']==12 for r in report):raise ValueError('recorded jump vertical witness was lost')
 # Render sampled visual reconstruction, with the unproven thin-layer x placement documented.
 for t in (0.5,20.5,24.5,32.5):
  i=int(t-.5);r=report[i];cap=cv2.VideoCapture(str(args.video));frame=crop(cap,t);cap.release()
  x4=r['setup4_source_x'];dy=r['shared_camera_vertical_adjustment']
  if x4 is None or dy is None:continue
  delta=x4+30
  positions=[-261+8*delta,-261+8*delta,-613+2*delta,x4,-284+delta/2,-1]
  # positions for setups 3 and 5 are visually fitted anchors, not verified source origins.
  im=paint_scene(layers,positions,dy)
  fname=f'source_vs_gameplay_{str(t).replace(".","p")}s.png'
  comparison(frame,im,t,[round(x) for x in positions],'prototype; inferred layer order and thin-layer x').save(out/fname)
 # Source-only compilation of original 6 setups for review.
 gallery=Image.new('RGB',(1020,780),(18,23,33));d=ImageDraw.Draw(gallery)
 for i,im in enumerate(layers):
  thumb=im.copy();thumb.thumbnail((490,225)); x=i%2*510+7;y=i//2*260+26
  gallery.paste(thumb,(x,y),thumb);d.text((x,y-20),f'PIT.GRA setup {i+1}  ({im.width}x{im.height})',(230,240,245))
 gallery.save(out/'original_six_setups_contact_sheet.png')
 summary={'schema':'mkdos_o208_pit_runtime_source_video_v1','input_sha256':hashes,
  'video':{'duration_seconds':duration,'sample_times':times,'viewport':'original 638x426 cropped [x0:638,y26:426] and resized 320x200'},
  'verified_original_source':{'six_setup_catalogue':decoded,'source_vertical_setup_fixed_values':FIXED_Y,'renderer_channels':CHANNEL,
   'original_channel_motion_input_16_16':MOTION,'root_source_relationships':'O206/O207 mode2 references all six, reduced references 1,2,6'},
  'observed_runtime':{'successful_source4_matches_with_5_or_more_votes':matched_mode2,'vertical_relationship_confirmed_samples':y_confirm,
   'rate_comparison_votes_for_setup2':aggregate,'per_sample':report},
  'working_hypotheses':{'horizontal_ratio_of_setup2_to_setup4':8,'source2_duplicate_motif_period_for_alignment_pixels':280,
   'compositor_back_to_front_order':[6,5,4,3,2,1], 'unverified_first_frame_source_x':{'setup3':-613,'setup5':-284},
   'interpretation':'Source ratios are strongly supported if ratio 8 wins withheld sample votes. No claim of complete renderer, exact mode or distant fighter decoding.'},
  'limitations':['Recorded fighters and HUD are not part of the six decoded background setups.',
    'The tiny fighters on the distant bridge remain separate from the backdrop, not decoded here.',
    'Compositor order and two thin-layer positions are experimental and depend on first-frame alignment.',
    'Bridge motifs repeat at multiple source X values; near-layer position may be aliased by 280px.',
    'Values stored as original setup placements are not independently verified execution semantics.']}
 (out/'o208_result.json').write_text(json.dumps(summary,indent=2,sort_keys=True)+'\n')
 (out/'o208_raw_sift_matches.json').write_text(json.dumps(raw,separators=(',',':')))
 with (out/'sampled_layer_motion.csv').open('w',newline='') as f:
  cols=['time_seconds','moon_source_y','shared_camera_vertical_adjustment','setup4_source_x','setup4_source_y','setup4_feature_votes','setup2_source_x_aliased_peak','setup2_source_y','setup2_candidate_x_from_source_ratio_8','setup2_feature_votes_at_candidate']
  w=csv.DictWriter(f,fieldnames=cols);w.writeheader();w.writerows({k:r.get(k) for k in cols} for r in report)
 print(json.dumps({'seconds':duration,'samples':len(report),'valid_setup4':len(valid),'support_5plus':matched_mode2,
    'vertical_correlated_samples':y_confirm,'ratio_model_votes':aggregate,
    'camera_shifts':dict(collections.Counter(r['shared_camera_vertical_adjustment'] for r in report)),
    'first_10':[{k:r[k] for k in ('time_seconds','setup4_source_x','setup4_feature_votes','setup2_candidate_x_from_source_ratio_8')} for r in report[:10]]},indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__)
 for key in ('exe','pit','video','project','out'):p.add_argument('--'+key,required=True,type=Path)
 main(p.parse_args())
