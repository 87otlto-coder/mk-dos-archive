#!/usr/bin/env python3
"""O201 — reproducible visual witness comparison for DOS MK2 Forest.

Reads a user-made DOSBox recording plus the O196 and O197 evidence ZIPs.
It neither changes any game file nor claims to recover an executable camera transform.
Requires: pip install pillow numpy opencv-python.
"""
import argparse, csv, hashlib, io, json, zipfile
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import cv2

W,H = 320,200
VERTICAL_0 = {1:0, 2:-2, 3:44, 4:50, 5:68}   # observed via multiple frame matches
HORIZONTAL_CANDIDATES = {
  1:[-336,-552,-111,-113], 2:[-213,-25,-447,208],
  3:[-168,155,2,-393,-23,-418,-563], 4:[150,-154,-386],
  5:[-129,-33,63,159,255],
}
INITIAL_H = {1:-336,2:-213,3:-168,4:-154,5:-129}
FLOOR_ORIGIN = (-300,168)   # a t=0 template match, not a global camera constant


def digest(path):
 h=hashlib.sha256()
 with Path(path).open('rb') as fh:
  for chunk in iter(lambda:fh.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()


def load_layers(zpath):
 with zipfile.ZipFile(zpath) as z:
  if z.testzip() is not None:raise ValueError('Corrupted O197 ZIP')
  d={}
  for i in range(1,6):
   choices=[n for n in z.namelist() if n.startswith(f'variants/{i}_') and n.endswith('/candidate_color.png')]
   if len(choices)!=1:raise ValueError(f'No unique layer {i}')
   d[i]=np.array(Image.open(io.BytesIO(z.read(choices[0]))).convert('RGBA'))
  return d


def load_floor(zpath):
 with zipfile.ZipFile(zpath) as z:
  if z.testzip() is not None:raise ValueError('Corrupted O196 ZIP')
  return np.array(Image.open(io.BytesIO(z.read('results/forest_896x32_candidate_rgba.png'))).convert('RGBA'))


def video_frame(cap,t):
 cap.set(cv2.CAP_PROP_POS_MSEC,t*1000.0)
 ok,bgr=cap.read()
 if not ok:raise ValueError(f'Unable to read video at {t}s')
 rgb=cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB)
 if rgb.shape[0]!=430 or rgb.shape[1]!=642:
  raise ValueError(f'This calibration expects the supplied 642x430 DOSBox window capture, got {rgb.shape}')
 # The rendered viewport is 640x400 at x=1, y=30. The output is 320x200, with AREA averaging compressed duplicate pixels.
 return cv2.resize(rgb[30:430,1:641],(W,H),interpolation=cv2.INTER_AREA)


def stage_mask():
 # Diagnostic-only mask to exclude upper HUD and most of Liu Kang and Jax at t=0.
 mask=np.zeros((H,W),dtype=bool)
 mask[36:199,:]=True
 mask[85:199,17:80]=False
 mask[75:199,234:294]=False
 return mask


def paste(dst,rgba,x,y):
 h,w=rgba.shape[:2]; x1=max(0,x);x2=min(W,x+w);y1=max(0,y);y2=min(H,y+h)
 if x2<=x1 or y2<=y1:return
 a=rgba[y1-y:y2-y,x1-x:x2-x].astype(np.float32)
 alpha=a[:,:,3:4]/255.0
 dst[y1:y2,x1:x2]=(1-alpha)*dst[y1:y2,x1:x2]+alpha*a[:,:,:3]


def render(layers,floor,offs,layer_count=5):
 im=np.zeros((H,W,3),dtype=np.float32)
 paste(im,floor,*FLOOR_ORIGIN)
 for i in [5,4,3,2,1]:
  if layer_count==3 and i in (3,4):continue
  paste(im,layers[i],offs[i],VERTICAL_0[i])
 return np.uint8(np.clip(im,0,255))


def error_stats(im,video,mask):
 err=np.abs(im.astype(np.float32)-video.astype(np.float32)).mean(axis=2)
 return dict(average_rgb_abs_error=round(float(np.mean(err[mask])),4),
             truncated_error_40=round(float(np.clip(err[mask],0,40).mean()),4),
             evaluated_pixels=int(mask.sum()))


def optimize(layers,floor,video,mask):
 offsets=dict(INITIAL_H)
 for _ in range(3):
  for i in [1,2,3,4,5]:
   trial=[]
   for x in HORIZONTAL_CANDIDATES[i]:
    attempt={**offsets,i:x}
    metric=error_stats(render(layers,floor,attempt),video,mask)['truncated_error_40']
    trial.append((metric,x))
   offsets[i]=min(trial)[1]
 return offsets


def sift_match_table(layers,cap,times):
 sift=cv2.SIFT_create(nfeatures=1000,contrastThreshold=.012,edgeThreshold=15)
 matcher=cv2.BFMatcher()
 loaded={}
 for i,src in layers.items():
  gray=cv2.cvtColor(src[:,:,:3],cv2.COLOR_RGB2GRAY)
  keypoints,desc=sift.detectAndCompute(gray,np.where(src[:,:,3]>200,255,0).astype('uint8'))
  loaded[i]=(keypoints,desc)
 data=[]
 for t in times:
  actual=video_frame(cap,t)
  tgray=cv2.cvtColor(actual,cv2.COLOR_RGB2GRAY)
  kp,desc=sift.detectAndCompute(tgray,None)
  for i in range(1,6):
   kl,dl=loaded[i]
   votes=[]
   if desc is not None and dl is not None:
    for pair in matcher.knnMatch(dl,desc,k=2):
     if len(pair)<2:continue
     a,b=pair
     if a.distance>=.65*b.distance:continue
     p1=kl[a.queryIdx].pt; p2=kp[a.trainIdx].pt
     votes.append((round(p2[0]-p1[0]),round(p2[1]-p1[1])))
   ys={y:sum(v[1]==y for v in votes) for _,y in votes}
   if not ys:
    row=dict(time_seconds=t,layer=i,feature_matches=0,vertical_offset=None,
             vertical_votes=0,vertical_support_ratio=0,horizontal_offset_example=None)
   else:
    dy=max(sorted(ys),key=lambda y:ys[y])
    qualifying=[x for x,y in votes if abs(y-dy)<=1]
    xs={x:qualifying.count(x) for x in set(qualifying)}
    dominant_x=max(sorted(xs),key=lambda x:xs[x]) if xs else None
    row=dict(time_seconds=t,layer=i,feature_matches=len(votes),vertical_offset=dy,
             vertical_votes=ys[dy],vertical_support_ratio=round(ys[dy]/len(votes),3),
             horizontal_offset_example=dominant_x)
   data.append(row)
 return data


def floor_anchor(floor,video):
 src=cv2.cvtColor(floor[:,:,:3],cv2.COLOR_RGB2GRAY)
 results=[]
 for vx,vy in [(90,168),(95,172),(130,172),(155,172)]:
  patch=cv2.cvtColor(video[vy:vy+16,vx:vx+50],cv2.COLOR_RGB2GRAY)
  scores=cv2.matchTemplate(src,patch,cv2.TM_CCOEFF_NORMED)
  _,score,_,(sx,sy)=cv2.minMaxLoc(scores)
  results.append(dict(game_patch_xy=[vx,vy],original_floor_xy=[sx,sy],
                      source_to_screen_offset=[vx-sx,vy-sy],normalized_correlation=round(float(score),4)))
 return results


def witness_patches(layers,video):
 # Four independent sample patches, chosen from transparent-free source regions.
 anchors=[(1,240,48,129,48),(1,480,48,144,48),(2,300,64,87,62),(3,600,16,37,60)]
 r=[]
 for layer,sx,sy,vx,vy in anchors:
  S=layers[layer][sy:sy+24,sx:sx+24,:3].astype(float)
  V=video[vy:vy+24,vx:vx+24].astype(float)
  a=layers[layer][sy:sy+24,sx:sx+24,3]>0
  if not np.all(a):raise ValueError('Witness patch unexpectedly nonopaque')
  r.append(dict(layer=layer,source_patch_xy=[sx,sy],video_patch_xy=[vx,vy],width=24,height=24,
                mean_absolute_rgb_error=round(float(np.abs(S-V).mean()),4)))
 return r


def sheet(video,five,three,score5,score3):
 # Full resolution 320x200 panels scaled 2x by nearest neighbor.
 bg=Image.new('RGB',(3*640+4*20,530),'#0e1720');d=ImageDraw.Draw(bg)
 names=['GAMEPLAY WITNESS','FIVE-LAYER CALIBRATION','THREE-LAYER CONTROL']
 for k,(name,img) in enumerate(zip(names,[video,five,three])):
  x=20+k*640; y=52
  d.text((x,y-29),name,fill='#ffffff')
  bg.paste(Image.fromarray(img,'RGB').resize((640,400),Image.Resampling.NEAREST),(x,y))
  d.text((x,y+416),['From user DOSBox video; fighters and HUD are live','Original O197/O196 pixel sources; no fighters / HUD','Same calibrated offsets, excluding layers 3 & 4'][k],fill='#b7c9dd')
 d.text((20,6),'O201  |  MK2 FOREST ORIGINAL-PIXEL RUNTIME WITNESS',fill='#e2edff')
 d.text((20,490),f'Masked 320x200 average RGB error per channel: FIVE {score5["average_rgb_abs_error"]}  vs  THREE {score3["average_rgb_abs_error"]}.',fill='#e3f4ec')
 d.text((20,512),'Exploratory fit to one recording, not proof of game-mode value or full runtime camera math. Fighters/HUD deliberately absent from reconstruction.',fill='#ffcd92')
 return bg


def main():
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--video',required=True,type=Path)
 ap.add_argument('--o197',required=True,type=Path)
 ap.add_argument('--o196',required=True,type=Path)
 ap.add_argument('--output',default=Path('o201_runtime_evidence'),type=Path)
 args=ap.parse_args();args.output.mkdir(parents=True,exist_ok=True)
 layers=load_layers(args.o197); floor=load_floor(args.o196)
 cap=cv2.VideoCapture(str(args.video))
 if not cap.isOpened():raise ValueError('Cannot open supplied recording')
 duration=cap.get(cv2.CAP_PROP_FRAME_COUNT)/cap.get(cv2.CAP_PROP_FPS)
 times=[t for t in range(0,30,2) if t < duration]
 actual=video_frame(cap,0)
 table=sift_match_table(layers,cap,times)
 mask=stage_mask()
 offsets=optimize(layers,floor,actual,mask)
 five=render(layers,floor,offsets,5);three=render(layers,floor,offsets,3)
 score5=error_stats(five,actual,mask);score3=error_stats(three,actual,mask)
 anchor=floor_anchor(floor,actual)
 patches=witness_patches(layers,actual)
 report={
   'version':'mkdos_O201_forest_runtime_visual_v1','observation':'user_supplied_dosbox_video',
   'source_hashes_sha256': {'video':digest(args.video),'O197_evidence_zip':digest(args.o197),'O196_evidence_zip':digest(args.o196)},
   'recording':{'duration_seconds':round(duration,3),'video_capture_size':[642,430],
                'viewport_crop_px':[1,30,640,400],'normalized_native_size':[320,200]},
   'source_layers': {str(i):list(layers[i].shape[:2][::-1]) for i in range(1,6)},
   'matches':table,'anchor_patches':patches,'floor_matches':anchor,
   't0_reconstruction':{'calibrated_layer_y_px':VERTICAL_0, 'candidate_layer_x_px':offsets,
      'original_floor_x_y_px':FLOOR_ORIGIN, 'layer_draw_order_assumption':[5,4,3,2,1],
      'scoring_mask':'y>=36 and y<199, exclude x17:80 above y85 and x234:294 above y75'},
   'comparison_scores':{'five_layers':score5,'three_layers':score3},
   'limitations':['Measured pixel alignment is not proof that game mode global =2',
      'Source textures repeat; some horizontal translations are ambiguous',
      'The five-layer source positions are fitted to one video frame and do not reconstruct original camera formulas',
      'Video capture is lossy H.264 and contains sprites, HUD, compression and dynamic camera movement',
      'Candidate source-linked palette is strongly pixel-consistent with witnessed regions, but live palette-bank selection remains a separate code question',
      'The 24-second common +12 px vertical motion has not been mapped to its original runtime code path']}
 with (args.output/'REPORT.json').open('w') as f:json.dump(report,f,indent=2)
 with (args.output/'runtime_match_table.csv').open('w',newline='') as f:
  writer=csv.DictWriter(f,fieldnames=list(table[0]));writer.writeheader();writer.writerows(table)
 Image.fromarray(actual,'RGB').save(args.output/'witness_t00_320x200.png')
 Image.fromarray(five,'RGB').save(args.output/'five_layer_t00_320x200.png')
 Image.fromarray(three,'RGB').save(args.output/'three_layer_control_t00_320x200.png')
 sheet(actual,five,three,score5,score3).save(args.output/'O201_runtime_visual_comparison.png',optimize=True)
 for t in [10,24]:
  if duration>t:
   Image.fromarray(video_frame(cap,t),'RGB').save(args.output/f'witness_t{t:02d}_320x200.png')
 cap.release()
 print('O201 runtime witness comparison complete')
 print('t=0 candidate offsets',offsets)
 print('five-layer masked MAE',score5['average_rgb_abs_error'],'three-layer masked MAE',score3['average_rgb_abs_error'])
 print('matched feature observations',len(table),'output',args.output)

if __name__=='__main__': main()
