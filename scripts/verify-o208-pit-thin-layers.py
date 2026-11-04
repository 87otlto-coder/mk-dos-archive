#!/usr/bin/env python3
"""O208 conditional test of two low-texture Pit source layers; do not promote weak evidence."""
import argparse,hashlib,json
from pathlib import Path
import cv2,numpy as np
from PIL import Image
INPUT_VIDEO_SHA='3fecb35f35fb6786528b64ac5b6322ef65564885bf735405955cb1f11f928d94'
def run(args):
 if hashlib.file_digest(open(args.video,'rb'),'sha256').hexdigest()!=INPUT_VIDEO_SHA:raise ValueError('Pit recording hash differs from original')
 r=json.loads((args.evidence/'o208_result.json').read_text())['observed_runtime']['per_sample']
 cap=cv2.VideoCapture(str(args.video));summ={}
 specs=[(3,147,-613,[0,1,2,3,4],2),(5,127,-284,[0,.25,.5,.75,1],.5)]
 for i,y,baseline,rates,expected in specs:
  src=np.asarray(Image.open(args.evidence/'source_derived_setups'/f'the_pit_source_setup_{i}.png').convert('RGBA'))
  scores={str(rate):[] for rate in rates}
  for item in r:
   x4=item['setup4_source_x']
   if x4 is None or item['setup4_feature_votes']<5 or abs(x4+30)<5:continue
   cap.set(cv2.CAP_PROP_POS_MSEC,round(item['time_seconds']*1000));ok,f=cap.read()
   if not ok:raise ValueError('Video frame decode failed')
   video=cv2.cvtColor(cv2.resize(f[26:426,:638],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB)
   for rate in rates:
    x=round(baseline+rate*(x4+30));cy=y+item['shared_camera_vertical_adjustment']
    xmin=max(0,x);xmax=min(320,x+src.shape[1]);ymin=max(0,cy);ymax=min(200,cy+src.shape[0])
    if xmin>=xmax or ymin>=ymax:continue
    sub=src[ymin-cy:ymax-cy,xmin-x:xmax-x]
    mask=sub[:,:,3]>230;n=int(mask.sum())
    if n<20:continue
    err=float(np.abs(sub[:,:,:3].astype('int16')-video[ymin:ymax,xmin:xmax].astype('int16'))[mask].mean())
    scores[str(rate)].append({'time_seconds':item['time_seconds'],'rgb_mae_255':round(err,6),'opaque_pixels':n})
  avgs={k:round(float(np.mean([v['rgb_mae_255'] for v in vals])),6) if vals else None for k,vals in scores.items()}
  winner=min((k for k in avgs if avgs[k] is not None),key=lambda k:avgs[k]);summ[str(i)]={'source_ratio_expected':expected,'source_x_baseline_fitted':baseline,'model_rgb_mae_255':avgs,'best_empirical_candidate':float(winner),'classification':'source_ratio_correlated' if float(winner)==expected and i==3 else 'inconclusive'}
 cap.release()
 report={'schema':'mkdos_o208_thin_source_layer_diagnostic_v1','scope':'15 movement samples; color errors from two translucent, low-detail source planes. Identical footage to O208 primary. These values do not establish runtime positioning.', 'results':summ}
 args.out.mkdir(parents=True,exist_ok=True); (args.out/'O208_thin_layer_candidate_motion.json').write_text(json.dumps(report,indent=2,sort_keys=True)+'\n')
 print(json.dumps(report['results'],indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--evidence',type=Path,required=True);p.add_argument('--video',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
 run(p.parse_args())
