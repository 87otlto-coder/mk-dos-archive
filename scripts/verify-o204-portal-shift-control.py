import cv2,json,zipfile,numpy as np,collections,argparse
from pathlib import Path
ap=argparse.ArgumentParser();ap.add_argument('--results',required=True);ap.add_argument('--frames-dir',required=True);ap.add_argument('--o188',required=True);ap.add_argument('--output',required=True);args=ap.parse_args()
rows=json.load(open(args.results))
with zipfile.ZipFile(args.o188) as z:
 templates={}
 for typ in ('swaying','hanging'):
  templates[typ]=[cv2.imdecode(np.frombuffer(z.read(f'portal_frames/effects/portal/portal_{typ}/frame_{i:02}.png'),np.uint8),cv2.IMREAD_UNCHANGED) for i in range(7)]
base=Path(args.frames_dir);fl=sorted(base.glob('*.png'))
images=[cv2.imread(str(x)) for x in fl]; data=[]
for r in rows:
 idx=int(np.argmin([abs(i/4-r['t_s']) for i in range(len(images))]));im=images[idx];src=templates[r['asset']][r['frame']];h,w=src.shape[:2];x,y=r['x'],r['y'];mask=src[:,:,3]>=200
 def mae(dx):
  if x+dx<0 or x+dx+w>320 or y<0 or y+h>200:return None
  return float(np.mean(np.abs(im[y:y+h,x+dx:x+dx+w].astype('float32')[mask]-src[:,:,:3].astype('float32')[mask])))/255
 hit=mae(0); negs=[mae(-19),mae(19)]; negs=[e for e in negs if e is not None]
 data.append({'region':r['region'],'t_s':r['t_s'],'pose':r['frame'],'full_mask_mae':round(hit,5),'neighbor_19px_mae':round(min(negs),5) if negs else None,'contrast':round(min(negs)-hit,5) if negs else None})
summary={}
for reg in sorted({r['region'] for r in data}):
 a=[r for r in data if r['region']==reg];summary[reg]={'full_mask_mae_median':round(float(np.median([r['full_mask_mae'] for r in a])),4),'neighbor_19px_mae_median':round(float(np.median([r['neighbor_19px_mae'] for r in a if r['neighbor_19px_mae'] is not None])),4),'full_mask_better_than_neighbor_count':sum(r['contrast']>0 for r in a),'count':len(a),'note':'Off-target horizontal control is not a null distribution or gameplay proof'}
Path(args.output).write_text(json.dumps({'summary':summary,'records':data},indent=2))
print(json.dumps(summary,indent=2))
