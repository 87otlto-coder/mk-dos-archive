#!/usr/bin/env python3
"""O202: reproducible source-ratio / gameplay-translation test for MK2 Forest.

INPUTS: user's original unmodified DOSBox H.264 recording; O197 layer evidence;
O196 floor evidence. DO NOT MODIFY source files. Includes timestamps never used
in O201's two-second feature-match table as an out-of-sample check.

The layer-1 video translation is independently measured for EACH timestamp.
Each other layer's video translation is predicted from O198 original source ratios,
with NO per-time offset fitting. This tests relative movement, not the causal
runtime camera equation, and feature correspondences can alias on repeated trees.
"""
import argparse,csv,hashlib,io,json,zipfile,collections,math,sys
from pathlib import Path
import numpy as np
import cv2
from PIL import Image,ImageDraw

INITIAL_X={1:-336,2:-213,3:-168,4:-154,5:-129} # O201 t=0 candidate fits
INITIAL_Y={1:0,2:-2,3:44,4:50,5:68}  # O201 t=0 measured offsets
ORIGINAL_INPUT={1:1.5,2:1.125,3:0.9375,4:0.75,5:0}
RATIO={k:v/ORIGINAL_INPUT[1] for k,v in ORIGINAL_INPUT.items()}
W,H=320,200

def sha(p):
 h=hashlib.sha256()
 with open(p,'rb') as f:
  for c in iter(lambda:f.read(1024*1024),b''):h.update(c)
 return h.hexdigest()

def load_layers(p):
 with zipfile.ZipFile(p) as z:
  if z.testzip():raise ValueError('Corrupt original-layer ZIP')
  res={}
  for i in range(1,6):
   matches=[n for n in z.namelist() if n.startswith(f'variants/{i}_') and n.endswith('/candidate_color.png')]
   if len(matches)!=1:raise ValueError('Cannot locate unique original source layer '+str(i))
   res[i]=np.asarray(Image.open(io.BytesIO(z.read(matches[0]))).convert('RGBA'))
  return res

def load_floor(p):
 with zipfile.ZipFile(p) as z:
  if z.testzip():raise ValueError('Corrupt source floor ZIP')
  return np.asarray(Image.open(io.BytesIO(z.read('results/forest_896x32_candidate_rgba.png'))).convert('RGBA'))

def frame(cap,t):
 cap.set(cv2.CAP_PROP_POS_MSEC,1000*t)
 good,bgr=cap.read()
 if not good:raise ValueError('Missing frame '+str(t))
 if tuple(bgr.shape[:2])!=(430,642):raise ValueError('Unrecognized DOSBox capture bounds '+str(bgr.shape))
 return cv2.resize(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB)[30:430,1:641],(W,H),interpolation=cv2.INTER_AREA)

def vote_count(v,x,y,tolx=2,toly=1):
 return sum(abs(dx-x)<=tolx and abs(dy-y)<=toly for dx,dy in v)

def paste(dst,rgba,x,y):
 x,y=round(x),round(y)
 h,w=rgba.shape[:2]; a=max(0,x);b=min(W,x+w);c=max(0,y);d=min(H,y+h)
 if b<=a or d<=c:return
 patch=rgba[c-y:d-y,a-x:b-x]
 opacity=patch[:,:,3:4].astype(np.float32)/255.0
 dst[c:d,a:b]=(1-opacity)*dst[c:d,a:b]+opacity*patch[:,:,:3]

def reconstruct(layers,floor,trow,five=True):
 image=np.zeros((H,W,3),dtype=np.float32)
 cam_dx=trow['nearest_layer_translation_from_t0']
 dy=trow['common_vertical_shift_from_t0']
 # Floor's relative horizontal shift is only a candidate. The original O201
 # source floor origin is retained at t=0. Floor velocity is not independently proved.
 paste(image,floor,-300+cam_dx,168+dy)
 for i in (5,4,3,2,1):
  if not five and i in (3,4):continue
  x=INITIAL_X[i]+RATIO[i]*cam_dx
  y=INITIAL_Y[i]+dy
  paste(image,layers[i],x,y)
 return np.uint8(np.clip(image,0,255))

def comparison_image(witness,recon,trow):
 im=Image.new('RGB',(W*3,H+38),'#101925')
 im.paste(Image.fromarray(witness),(0,26));im.paste(Image.fromarray(recon),(W,26))
 # Original video minus reconstruction : helpful visual diagnostic but includes fighters + HUD.
 diff=np.minimum(np.abs(witness.astype('int16')-recon.astype('int16'))*3,255).astype('uint8')
 im.paste(Image.fromarray(diff),(W*2,26))
 draw=ImageDraw.Draw(im)
 for n,title in enumerate(['DOSBOX WITNESS','SOURCE-PARALLAX PREDICTION','3X PIXEL DIFFERENCE']):
  draw.text((n*W+4,6),title,fill='#ffffff')
 draw.text((4,H+28),f"t={trow['time_s']}s   primary layer dx={trow['nearest_layer_translation_from_t0']} px   vertical shift={trow['common_vertical_shift_from_t0']} px",fill='#cbd5e1')
 return im

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--video',type=Path,required=True)
 p.add_argument('--o197',type=Path,required=True)
 p.add_argument('--o196',type=Path,required=True)
 p.add_argument('--o198',type=Path,required=True,help='O198 source-linked motion-input forensic ZIP')
 p.add_argument('--output',type=Path,required=True)
 args=p.parse_args();out=args.output;out.mkdir(parents=True,exist_ok=True)
 layers=load_layers(args.o197);floor=load_floor(args.o196)
 with zipfile.ZipFile(args.o198) as auth:
  if auth.testzip():raise ValueError('Corrupt O198 source-input evidence ZIP')
  source=json.loads(auth.read('evidence/original_motion_inputs_16_16.json'))
  expected=sorted(set(ORIGINAL_INPUT.values()))
  if sorted(set(source['values']))!=expected or source.get('runtimeTransformVerified') is not False:
   raise ValueError('O198 original source values or qualification changed')
 cap=cv2.VideoCapture(str(args.video))
 if not cap.isOpened():raise ValueError('Cannot open video')
 duration=cap.get(cv2.CAP_PROP_FRAME_COUNT)/cap.get(cv2.CAP_PROP_FPS)
 if duration<29:raise ValueError('Video lacks the expected 29s recording span')
 sift=cv2.SIFT_create(nfeatures=1600,contrastThreshold=.012,edgeThreshold=15)
 bf=cv2.BFMatcher()
 descs={}
 for i,rgba in layers.items():
  k,d=sift.detectAndCompute(cv2.cvtColor(rgba[:,:,:3],cv2.COLOR_RGB2GRAY),np.where(rgba[:,:,3]>200,255,0).astype('uint8'))
  descs[i]=(k,d)
 all_frames=[];matches=[];raw={};holdout=[]
 for t in range(30):
  g=frame(cap,t)
  kt,dt=sift.detectAndCompute(cv2.cvtColor(g,cv2.COLOR_RGB2GRAY),None)
  this={}
  for i,(kp,desc) in descs.items():
   v=[]
   if desc is not None and dt is not None:
    for pair in bf.knnMatch(desc,dt,k=2):
     if len(pair)<2:continue
     a,b=pair
     if a.distance>=.65*b.distance:continue
     ps=kp[a.queryIdx].pt;pv=kt[a.trainIdx].pt
     v.append([round(pv[0]-ps[0]),round(pv[1]-ps[1])])
   this[i]=v
  raw[str(t)]={str(i):v for i,v in this.items()}
  first=collections.Counter(tuple(v) for v in this[1])
  # Get layer 1's strongest (x,y) cluster. Repeated trees make some secondary
  # x translations ambiguous; this is the winning source feature translation.
  if not first:raise ValueError('Cannot localize the reference layer at t='+str(t))
  x1,y1=first.most_common(1)[0][0]
  # Full x-mode rather than joint mode, conditional on y1, for stability.
  xx=collections.Counter(x for x,y in this[1] if abs(y-y1)<=1)
  x1=xx.most_common(1)[0][0]
  dy=y1-INITIAL_Y[1];dx=x1-INITIAL_X[1]
  all_frames.append(dict(time_s=t,nearest_layer_source_x=x1,nearest_layer_translation_from_t0=dx,
       nearest_layer_y=y1,common_vertical_shift_from_t0=dy,
       nearest_layer_support=vote_count(this[1],x1,y1),
       calibration_timestamp=(t==0),o201_previously_sampled_timestamp=(t%2==0)))
  for i,v in this.items():
   x=INITIAL_X[i]+RATIO[i]*dx;yy=INITIAL_Y[i]+dy
   support=vote_count(v,x,yy)
   stat=vote_count(v,INITIAL_X[i],yy)
   unif=vote_count(v,INITIAL_X[i]+dx,yy)
   matches.append(dict(time_s=t,layer=i,source_input=ORIGINAL_INPUT[i],predicted_ratio=RATIO[i],
             predicted_x=x,predicted_y=yy,match_votes_total=len(v),
             source_ratio_support=support,stationary_control_support=stat,
             uniform_motion_control_support=unif,
             split='odd-second-unseen-in-O201' if t%2 else 'O201-sampled-even-second'))
 # prevent accidental interpretation of O201 t=0 as blind holdout
 for i in range(1,6):
  subset=[a for a in matches if a['layer']==i and a['time_s']%2==1]
  def total(key):return sum(r[key] for r in subset)
  holdout.append(dict(layer=i,measured_samples=len(subset),source_ratio=RATIO[i],
                      source_model_votes=total('source_ratio_support'),
                      stationary_control_votes=total('stationary_control_support'),
                      uniform_motion_control_votes=total('uniform_motion_control_support'),
                      note='Layer 1 supplies the per-timestamp motion reference; not an independent model test' if i==1 else
                           'Video feature inlier counts conditional on layer 1 motion; source-to-screen baseline calibrated in O201'))
 with open(out/'source_motion_matches.csv','w',newline='',encoding='utf-8') as f:
  writer=csv.DictWriter(f,fieldnames=list(matches[0]));writer.writeheader();writer.writerows(matches)
 (out/'raw_sift_translation_votes.json').write_text(json.dumps(raw,separators=(',',':')))
 # Portable SVG showing measured nearest-tree movement and predicted motion of
 # each original layer. No source game screenshots or copied media in graph.
 svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="390" viewBox="0 0 1120 390">',
 '<rect width="1120" height="390" fill="#0d1723"/><text x="25" y="30" fill="#e8f2fd" font-family="sans-serif" font-size="19">MK2 FOREST — Original renderer ratios predict recorded movement</text>',
 '<text x="25" y="52" fill="#adc2da" font-family="sans-serif" font-size="12">Relative pixel shifts from initial source alignment • vertical source panel does not represent recovered camera code</text>']
 colors=['#fff9d1','#80c4ff','#65e0ba','#e9a8f5','#ffb379'];ox,oy=55,205;scale=1.17
 for tick in [-250,-125,0,125,270]:
  y=oy-tick*.43
  svg.append(f'<line x1="55" y1="{y:.1f}" x2="805" y2="{y:.1f}" stroke="#2b3e54"/><text x="14" y="{y+4:.1f}" fill="#90a9c3" font-size="11">{tick:+d}</text>')
 for i in range(1,6):
  pts=' '.join(f'{ox+r["time_s"]*25},{oy+(-r["nearest_layer_translation_from_t0"]*RATIO[i]*.43):.1f}' for r in all_frames)
  svg.append(f'<polyline fill="none" stroke="{colors[i-1]}" stroke-width="2" points="{pts}"/>')
  svg.append(f'<line x1="830" y1="{74+i*40}" x2="856" y2="{74+i*40}" stroke="{colors[i-1]}" stroke-width="3"/><text x="869" y="{78+i*40}" fill="#d7e9fc" font-family="sans-serif" font-size="13">Layer {i}: {100*RATIO[i]:g}%</text>')
 svg.append('<text x="38" y="372" fill="#91adc5" font-size="12">Seconds 0–29, sample interval 1 second; nearest layer movement is observed, other curves are original-source predictions</text></svg>')
 (out/'motion_ratios.svg').write_text('\n'.join(svg))
 preview_times=[0,2,4,10,16,20,24,28]
 gif_frames=[]
 for t in preview_times:
  original=frame(cap,t);prediction=reconstruct(layers,floor,all_frames[t]);comp=comparison_image(original,prediction,all_frames[t]);
  comp.save(out/f'comparison_t{t:02d}.png')
  gif_frames.append(comp.convert('P',palette=Image.Palette.ADAPTIVE,colors=192))
 gif_frames[0].save(out/'motion_prediction.gif',save_all=True,append_images=gif_frames[1:],duration=[1200]*len(gif_frames),loop=0,optimize=False)
 report={'version':'MKDOS_O202_Forest_O198_input_video_parallax_comparison_v1',
  'sha256':{'user_gameplay_video':sha(args.video),'O197_original_layer_evidence_zip':sha(args.o197),'O196_original_floor_evidence_zip':sha(args.o196),'O198_motion_inputs_evidence_zip':sha(args.o198)},
  'independent_source_values_O198':{str(i):{'original_16_16_input':ORIGINAL_INPUT[i],'ratio_against_layer1':RATIO[i]} for i in range(1,6)},
  'O201_calibration_source_to_screen_offsets':{str(i):{'x':INITIAL_X[i],'y':INITIAL_Y[i]} for i in range(1,6)},
  'O198_original_values_evidence':{'motion_input_original_object2':source['object2'],'original_16_16_raw_values':source['raw'],'original_16_16_values':source['values'],'runtime_transform_verified':source['runtimeTransformVerified']},
  'duration_seconds':round(duration,4),'capture_geometry':{'source_video':[642,430],'viewport':[1,30,640,400],'native_size':[320,200]},
  'reference_motion':all_frames,'odd_second_holdout_source_model_vs_controls':holdout,
  'method':'SIFT matching from original O197 color-candidate source layers to 320x200 normalized DOSBox pixels; source-only X origins from O201 opening; every timestamp uses only layer1 to estimate camera translation; test other layers at source ratios 0.75,0.625,0.5,0 with no per-time fitting; keep raw vote traces. Separate 1s odd timestamps were not in O201 2s sampled feature table.',
  'limitations':['The O201 t=0 per-layer horizontal origins are candidate positions chosen after fitting; they are not independent holdout data.',
   'SIFT ratio test may exhibit repeated-tree aliasing, weak coverage of layer5 and occlusion by fighters.',
   'The original source inputs are proven; assigning their ratios as relative parallax motion is a model tested by the recorded scene, not a proof of the original runtime instruction sequence.',
   'Layer 1 translation is derived from each video timestamp; model does not predict that movement from fighter/controller data.',
   'The preview floor follows layer1 horizontal translation for illustration; its true scroll equation is not separately verified.',
   'The renderer palette is source-linked and video-correlated; the exact live palette-bank activation remains to be traced.',
   'Gameplay recording does not prove stage mode register value or conditional callback activation.',
   'Gif frames show lossy game video and hypotheses juxtaposed; not source-original rendered gameplay frames.']}
 # Compare authentic motion ratios to two controlled alternatives on all
 # odd-second timestamps. SAME O201 t0 calibrated origins and moving floor are
 # used in each version. Only the parallax ratios differ. This diagnostic retains
 # live sprites/HUD; errors are clipped to 40 RGB levels per pixel/channel.
 pixel_rows=[]
 def render_control(layers,floor,row,mode):
  if mode in ('source_ratios','three_source_layers'):
   return reconstruct(layers,floor,row,mode=='source_ratios')
  dst=np.zeros((H,W,3),dtype=np.float32)
  d=row['nearest_layer_translation_from_t0'];y=row['common_vertical_shift_from_t0']
  paste(dst,floor,-300+d,168+y)
  for i in (5,4,3,2,1):
   rr=1 if mode=='uniform_motion' else 0
   paste(dst,layers[i],INITIAL_X[i]+d*rr,INITIAL_Y[i]+y)
  return np.uint8(np.clip(dst,0,255))
 for row in all_frames:
  if row['time_s']%2==0:continue
  witness=frame(cap,row['time_s']).astype(np.float32)
  area=(slice(36,198),slice(0,W))
  for mode in ['source_ratios','uniform_motion','stationary_layers','three_source_layers']:
   preview=render_control(layers,floor,row,mode).astype(np.float32)
   error=np.abs(preview-witness).mean(axis=2)[area]
   pixel_rows.append({'time_s':row['time_s'],'model':mode,'capped_rgb_mean_abs_error_40':round(float(np.minimum(error,40).mean()),4),'raw_rgb_mean_abs_error':round(float(error.mean()),4),'median_rgb_mean_abs_error':round(float(np.median(error)),4)})
 with open(out/'odd_second_pixel_scores.csv','w',newline='',encoding='utf8') as f:
  writer=csv.DictWriter(f,fieldnames=list(pixel_rows[0]));writer.writeheader();writer.writerows(pixel_rows)
 report['odd_second_pixel_scores']={mode:round(sum(q['capped_rgb_mean_abs_error_40'] for q in pixel_rows if q['model']==mode)/15,4) for mode in ['source_ratios','uniform_motion','stationary_layers','three_source_layers']}
 report['pixel_score_definition']='Across 15 odd-second frames: native 320x200, region rows 36..197, all x; mean(abs(RGB channel difference)) per pixel, capped at 40; same calibrated O201 x/y bases and candidate moving floor in every model. Includes fighters and HUD; not a fighter-masked native scene fidelity measurement.'
 (out/'REPORT.json').write_text(json.dumps(report,indent=2))
 cap.release()
 print('O202 output:',out)
 for r in holdout:print('Layer',r['layer'],'holdout votes O198 / static / uniform:',r['source_model_votes'],r['stationary_control_votes'],r['uniform_motion_control_votes'])

if __name__=='__main__':main()
