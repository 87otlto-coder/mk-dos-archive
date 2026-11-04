#!/usr/bin/env python3
"""O204 native-pixel Portal animation/source-video witness. Uses user-supplied recording
and O188 decoded source frames. Does not require or modify game installation.

Scores are masked normalized RGB squared errors (cv2.TM_SQDIFF_NORMED).
The lowest score is an observation, not proof of frame-cycle timing or runtime callback.
"""
import argparse,cv2,hashlib,io,json,csv,zipfile,collections
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path

def sha(p):
 h=hashlib.sha256();
 with open(p,'rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--video',required=True);ap.add_argument('--o188',required=True);ap.add_argument('--out',required=True);ap.add_argument('--step',type=float,default=.25);ap.add_argument('--frames-dir',required=True);a=ap.parse_args()
 out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(a.o188) as z:
  assert z.testzip() is None
  sets={}
  for kind in ('swaying','hanging'):
   sets[kind]=[]
   for i in range(7):
    buf=np.frombuffer(z.read(f'portal_frames/effects/portal/portal_{kind}/frame_{i:02d}.png'),np.uint8)
    rgba=cv2.imdecode(buf,cv2.IMREAD_UNCHANGED)
    assert rgba is not None and rgba.shape[2]==4
    sets[kind].append(rgba)
 cap=cv2.VideoCapture(a.video); assert cap.isOpened()
 fps=cap.get(cv2.CAP_PROP_FPS); total=int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); duration=total/fps
 assert cap.get(cv2.CAP_PROP_FRAME_WIDTH)==638 and cap.get(cv2.CAP_PROP_FRAME_HEIGHT)==426
 frame_files=sorted(Path(a.frames_dir).glob('*.png'));times=np.array([i/4 for i in range(len(frame_files))],dtype=float)
 def frame(t):
  idx=int(np.argmin(np.abs(times-t))); im=cv2.imread(str(frame_files[idx]),cv2.IMREAD_COLOR); assert im is not None and im.shape[:2]==(200,320);return im
 # Search x/y areas are fixture/video-specific and therefore documented
 # as a video calibration, not generalized renderer coordinates.
 regions={
  'swaying_left':('swaying',(48,54),(39,103)),
  'swaying_right':('swaying',(223,229),(39,103)),
  'hanging_left':('hanging',(115,143),(89,137)),
  'hanging_right':('hanging',(166,190),(87,137)),
 }
 rows=[];images={}
 for t in times:
  im=frame(t)
  if any(abs(t-b)<.14 for b in (4,10,16,24)): images[round(t,1)]=im
  for region,(kind,(xmin,xmax),(ymin,ymax)) in regions.items():
   scores=[]
   for pose,src in enumerate(sets[kind]):
    hh,ww=src.shape[:2]; search=im[ymin:ymax+hh,xmin:xmax+ww,:]
    # Fast reproducible sparse alpha-masked native RGB comparison. Exhaustively
    # enumerate bounded x/y candidates; sample 96 deterministic opaque source
    # pixels per pose. Scores are average absolute RGB error / 255.
    yy,xx=np.nonzero(src[:,:,3]>=200)
    rng=np.random.default_rng(2110+pose)
    ids=np.sort(rng.choice(len(xx),size=min(96,len(xx)),replace=False))
    px=xx[ids];py=yy[ids]; srcpixels=src[py,px,:3].astype('int16')
    cxs=np.tile(np.arange(xmin,xmax+1),ymax-ymin+1)
    cys=np.repeat(np.arange(ymin,ymax+1),xmax-xmin+1)
    observed=im[cys[:,None]+py[None,:],cxs[:,None]+px[None,:],:].astype('int16')
    differences=np.mean(np.abs(observed-srcpixels[None,:,:]),axis=(1,2))/255.0
    best_index=int(np.argmin(differences))
    minval=float(differences[best_index]); xminpos=int(cxs[best_index]); yminpos=int(cys[best_index])
    scores.append((minval,pose,xminpos,yminpos))
   scores.sort()
   best,second=scores[0],scores[1]
   # thresholds are empirical and exploratory. Confidence *not* a physical likelihood.
   rows.append(dict(t_s=round(float(t),3),region=region,asset=kind,
      frame=best[1],x=best[2],y=best[3],score=round(best[0],6),
      runner_up_frame=second[1],runner_up_score=round(second[0],6),
      score_margin=round(second[0]-best[0],6),
      reliable_color_fit=(best[0]<.17),
      stage='Portal',source='O188 indexed GRA-derived PNG against original runtime video'))
 cap.release()
 with open(out/'portal_pose_matches.csv','w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=rows[0]);w.writeheader();w.writerows(rows)
 (out/'portal_pose_matches.json').write_text(json.dumps(rows,indent=2))
 summary={'name':'O204 Portal original-source animation video match','method':'Deterministic sparse opaque-pixel mean absolute BGR/255 error at native 320x200, best of seven source frames per region; bounded x/y search',
 'video':{'file':Path(a.video).name,'sha256':sha(a.video),'fps':fps,'frames':total,'native_crop':[0,26,638,400]},
 'o188':{'file':Path(a.o188).name,'sha256':sha(a.o188)},'sample_step_s':a.step,'video_sampling_method':'ffmpeg fps=4 crop=638:400:0:26 scale=320:200:flags=area with nominal 0.25-second video timestamp','samples':len(times),'results':{}}
 for reg in regions:
  r=[x for x in rows if x['region']==reg];valid=[x for x in r if x['reliable_color_fit']]
  counts=collections.Counter(x['frame'] for x in valid)
  trans=collections.Counter((valid[i-1]['frame'],valid[i]['frame']) for i in range(1,len(valid)) if valid[i]['t_s']-valid[i-1]['t_s']<a.step*1.1)
  summary['results'][reg]={'samples':len(r),'source_color_fit_lt_0_17':len(valid),
     'source_fit_percent':round(100*len(valid)/len(r),1),'median_score_valid':round(float(np.median([x['score'] for x in valid])),4) if valid else None,
     'frame_counts':{str(i):counts[i] for i in range(7)}, 'top_transitions':[{'from':a,'to':b,'count':n} for (a,b),n in trans.most_common(15)],
     'median_x':round(float(np.median([x['x'] for x in valid])),1) if valid else None,
     'median_y':round(float(np.median([x['y'] for x in valid])),1) if valid else None}
 (out/'SUMMARY.json').write_text(json.dumps(summary,indent=2))
 # visualize confidence and animation selections for both large swaying figures
 from PIL import Image,ImageDraw
 width=1280;height=610;cv=Image.new('RGB',(width,height),'#0c1522');draw=ImageDraw.Draw(cv)
 draw.text((25,14),'O204  |  PORTAL: original recovered sprite frames matched to new gameplay recording',fill='#f5f7fa')
 draw.text((25,34),'Seven O188 source poses, independent left/right search; low score = better RGB match; fighter occlusion/vertical scrolling can obscure matches',fill='#91a8bc')
 palette=['#e9acdb','#e7c14b','#68cabc','#64acf0','#b39af6','#f19770','#e9d2a8']
 for k,reg in enumerate(regions):
  rs=[x for x in rows if x['region']==reg]; ytop=70+k*132
  draw.text((25,ytop),f'{reg}    qualifying {summary["results"][reg]["source_fit_percent"]}% of samples',fill='white')
  for pose in range(7):draw.rectangle((990+pose*32,ytop+2,1016+pose*32,ytop+12),fill=palette[pose]);draw.text((995+pose*32,ytop+14),str(pose),fill='#d2dfea')
  for r in rs:
   x0=25+int(r['t_s']/36.6*920);y0=ytop+38+int(min(r['score'],.75)/.75*73)
   draw.rectangle((x0,y0,x0+2,y0+3),fill=palette[r['frame']] if r['reliable_color_fit'] else '#596575')
  draw.line((25,ytop+38,947,ytop+38),fill='#334155')
  draw.line((25,ytop+111,947,ytop+111),fill='#334155')
  for ss in (0,5,10,15,20,25,30,35):
   xx=25+int(ss/36.6*920);draw.line((xx,ytop+36,xx,ytop+113),fill='#233247');draw.text((xx,ytop+115),str(ss),fill='#8196ac')
 cv.save(out/'pose_match_timeline.png')
 # annotated original game frames; no composite or inserted source sprites
 for t,im in images.items():
  part=[r for r in rows if abs(r['t_s']-t)<.035]
  clone=cv2.resize(im,(640,400),interpolation=cv2.INTER_NEAREST)
  for r in part:
   src=sets[r['asset']][r['frame']];hh,ww=src.shape[:2]
   color=(70,215,120) if r['reliable_color_fit'] else (115,115,115)
   cv2.rectangle(clone,(r['x']*2,r['y']*2),((r['x']+ww)*2,(r['y']+hh)*2),color,1)
   cv2.putText(clone,f'{r["region"]}: {r["frame"]} s={r["score"]:.2f}',(r['x']*2,min(397,r['y']*2+12)),cv2.FONT_HERSHEY_PLAIN,.65,color,1)
  cv2.imwrite(str(out/f'frame_{t:g}s_source_match.png'),clone)
 print(json.dumps(summary['results'],indent=2))
if __name__=='__main__':main()
