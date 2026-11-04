#!/usr/bin/env python3
"""O208 independent pixel check: compare original near-layer palette pixels with recorded Pit video.

Inputs: O208 source-derivative evidence folder plus original user's video. Read-only.
The scores are bounded single-layer diagnostics, NOT a complete scene reconstruction.
"""
import argparse,hashlib,json
from pathlib import Path
import cv2,numpy as np
from PIL import Image,ImageDraw
P='3fecb35f35fb6786528b64ac5b6322ef65564885bf735405955cb1f11f928d94'
def main(args):
 if hashlib.file_digest(open(args.video,'rb'),'sha256').hexdigest()!=P:raise ValueError('wrong original Pit gameplay witness')
 rows=json.loads((args.evidence/'o208_result.json').read_text())['observed_runtime']['per_sample']
 a=np.asarray(Image.open(args.evidence/'source_derived_setups/the_pit_source_setup_2.png').convert('RGBA'))
 cap=cv2.VideoCapture(str(args.video));scores={str(k):[] for k in (0,2,4,8,12)}
 for r in rows:
  x4=r['setup4_source_x']
  if x4 is None or r['setup4_feature_votes']<5 or abs(x4+30)<5:continue
  cap.set(cv2.CAP_PROP_POS_MSEC,round(r['time_seconds']*1000));ok,fr=cap.read()
  if not ok:raise ValueError('lost frame')
  video=cv2.cvtColor(cv2.resize(fr[26:426,:638],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB)
  for ratio in (0,2,4,8,12):
   x=-261+ratio*(x4+30)
   while x < -541:x+=280
   while x > -261:x-=280
   y=int(r['setup2_source_y']);x=int(x)
   sx=max(0,x);ex=min(320,x+a.shape[1]);sy=max(0,y);ey=min(200,y+a.shape[0])
   sub=a[sy-y:ey-y,sx-x:ex-x]
   mask=sub[:,:,3]>230
   n=int(mask.sum())
   if n<500:raise ValueError('not enough original source pixels to compare')
   diff=np.abs(sub[:,:,:3].astype('i2')-video[sy:ey,sx:ex].astype('i2'))
   scores[str(ratio)].append({'time_seconds':r['time_seconds'],'original_rgba_opaque_pixels':n,'rgb_mae_255':round(float(diff[mask].mean()),6)})
 cap.release()
 summary={'schema':'mkdos_o208_pit_original_pixels_ratio_controls_v1',
   'definition':'Near setup 2 opaque pixels compared to native-resolution DOSBox video; includes occluders. Horizontal coordinate aliases normalized modulo 280 source pixels.',
   'sample_filter':'setup4 >=5 native matched feature votes and displacement >=5 px from opening',
   'source_video_note':'This is a per-source-plane diagnostic, not a full scene or mask-aware reconstruction evaluation.',
   'models':{k:{'samples':len(v),'mean_rgb_mae_255':round(float(np.mean([x['rgb_mae_255'] for x in v])),6),'frame_scores':v} for k,v in scores.items()}}
 means={k:v['mean_rgb_mae_255'] for k,v in summary['models'].items()}
 if len(scores['8'])!=15 or min(means,key=means.get)!='8':raise ValueError('regression: source-ratio 8 failed independent pixel holdout')
 args.out.mkdir(parents=True,exist_ok=True)
 (args.out/'o208_independent_pixel_check.json').write_text(json.dumps(summary,indent=2,sort_keys=True)+'\n')
 canvas=Image.new('RGB',(950,500),(15,23,37));d=ImageDraw.Draw(canvas)
 d.text((25,22),'O208  |  THE PIT  |  ORIGINAL SOURCE PIXEL MODEL CONTROLS',fill=(242,246,253))
 d.text((25,48),'15 moving gameplay samples; mean absolute RGB per channel (lower is better)',fill=(175,202,225))
 maxv=max(means.values());low=min(means.values())
 for i,rate in enumerate([0,2,4,8,12]):
  y=99+i*72;value=means[str(rate)];width=int(value/50*650)
  d.text((35,y+10),f'{rate}:1',fill=(242,242,242))
  d.rounded_rectangle((135,y,135+width,y+40),radius=5,fill=(62,171,138) if rate==8 else (83,117,165))
  d.text((151+width,y+12),f'{value:.2f}/255',fill=(238,245,253))
 d.text((25,467),'Model 8:1 is pre-specified by original MK2 renderer inputs, not selected from these pixels.',fill=(207,217,232))
 canvas.save(args.out/'O208_pixel_model_alternatives.png')
 print(json.dumps({'n':len(scores['8']),'mae':means},indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--evidence',type=Path,required=True);p.add_argument('--video',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
 main(p.parse_args())
