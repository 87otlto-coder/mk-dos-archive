#!/usr/bin/env python3
"""O217: bounded video-only dynamic bridge-actor witness. Not original sprite-source attribution.
Compare actor-local temporal change to static control areas, with cloud background registration.
"""
import argparse,hashlib,json
from pathlib import Path
import cv2,numpy as np
from PIL import Image,ImageDraw
A=argparse.ArgumentParser();A.add_argument('--pit-video',required=True,type=Path);A.add_argument('--out',required=True,type=Path);a=A.parse_args();assert not a.out.exists();a.out.mkdir(parents=True)
assert hashlib.sha256(a.pit_video.read_bytes()).hexdigest()=='3fecb35f35fb6786528b64ac5b6322ef65564885bf735405955cb1f11f928d94'
c=cv2.VideoCapture(str(a.pit_video));assert c.isOpened() and c.get(cv2.CAP_PROP_FPS)==30
frames=list(range(15,136,5))
def native(f):
 c.set(cv2.CAP_PROP_POS_FRAMES,f);ok,img=c.read();assert ok and img.shape[:2]==(426,638)
 return cv2.cvtColor(cv2.resize(img[26:426,:638],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB)
ref=native(frames[0]);sample={k:native(k) for k in frames};ctrl=(slice(66,80),slice(123,197))
rows=[]
for f,im in sample.items():
 # Find purely camera drift in cloud backdrop, NOT in animated actors or fighting foreground.
 scores=[]
 for dx in range(-3,4):
  for dy in range(-2,3):
   if 0<=ctrl[0].start+dy and ctrl[0].stop+dy<=200 and 0<=ctrl[1].start+dx and ctrl[1].stop+dx<=320:
    other=im[ctrl[0].start+dy:ctrl[0].stop+dy,ctrl[1].start+dx:ctrl[1].stop+dx]
    score=float(np.abs(other.astype('int16')-ref[ctrl].astype('int16')).mean())
    scores.append((score,dx,dy))
 _,dx,dy=min(scores)
 regions={'left_bridge_fighter':(137,154,91,119),'right_bridge_fighter':(163,182,90,119),'empty_left_sky':(111,128,91,119),'empty_right_sky':(190,209,90,119)}
 outcome={}
 for name,(x0,x1,y0,y1) in regions.items():
  curr=im[y0+dy:y1+dy,x0+dx:x1+dx];original=ref[y0:y1,x0:x1];outcome[name]=round(float(np.abs(curr.astype('int16')-original.astype('int16')).mean()),4)
 rows.append({'frame':f,'time_s':round(f/30,5),'registration_xy':[dx,dy],'registration_background_mae':round(min(scores)[0],4),'color_diff_region_mae_from_0p5s':outcome})
c.release()
R={'schema':'o217_bridge_anim_video_variation_only','video_sha256':hashlib.sha256(a.pit_video.read_bytes()).hexdigest(),'regions_pixel_crop_x0_x1_y0_y1':{'left_bridge_fighter':[137,154,91,119],'right_bridge_fighter':[163,182,90,119],'empty_left_sky':[111,128,91,119],'empty_right_sky':[190,209,90,119]},'video_frame_samples':rows,'limitation':'Video motion / temporal color variation, not evidence of original actor art, animation resource, renderer callback, sprite dimensions or exact original game tick rate; small camera motion and overlapping effects can confound'}
(a.out/'O217_BRIDGE_ACTORS_OBSERVED_VIDEO_VARIATION.json').write_text(json.dumps(R,indent=2)+'\n');print(json.dumps({'samples':len(rows),'registered_motions':{str(x):sum(tuple(r['registration_xy'])==x for r in rows) for x in sorted(set(tuple(r['registration_xy']) for r in rows))},'temporal_ranges':{name:[min(r['color_diff_region_mae_from_0p5s'][name] for r in rows),max(r['color_diff_region_mae_from_0p5s'][name] for r in rows)] for name in rows[0]['color_diff_region_mae_from_0p5s']}}))
