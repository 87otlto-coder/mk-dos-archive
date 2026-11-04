#!/usr/bin/env python3
"""O212 strict held-out test of original FALL.GRA transitional tiles in one canonical DOS capture.
Palette calibrated from 31.0 seconds (post-impact), source tile/phase trained on left patch,
validation is separate distant right, lower-left, and top-left patches not used in selection.
Run with owner's untouched MK2 game ZIP and exact DOSBox clip.
"""
from pathlib import Path
import argparse,importlib.util,zipfile,json,hashlib
import cv2,numpy as np
A=argparse.ArgumentParser();A.add_argument('--game-zip',required=True,type=Path);A.add_argument('--video',required=True,type=Path);A.add_argument('--o210-script',required=True,type=Path);A.add_argument('--out',required=True,type=Path);args=A.parse_args()
assert not args.out.exists(),'Output must be new';args.out.mkdir(parents=True)
s=importlib.util.spec_from_file_location('origin',str(args.o210_script));o=importlib.util.module_from_spec(s);s.loader.exec_module(o)
with zipfile.ZipFile(args.game_zip) as z:
 e=z.read('mk2/mk2.exe');g=z.read('mk2/fall.gra')
assert o.sha(e)==o.EXPECTED['exe'] and o.sha(g)==o.EXPECTED['fall'] and hashlib.sha256(args.video.read_bytes()).hexdigest()==o.EXPECTED['video']
sprites,meta=o.decode(e,g);cap=cv2.VideoCapture(str(args.video));assert cap.isOpened() and cap.get(5)==30

def grab(f):
 cap.set(cv2.CAP_PROP_POS_FRAMES,f);ok,im=cap.read();assert ok and im.shape[:2]==(430,660)
 return cv2.cvtColor(cv2.resize(im[25:425,10:650],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB)
# Calibration on a checkerboard of SAFE pixels of the final settled rock wall, NOT on transitional frames.
reference=grab(930);wallidx=o.texindex(sprites,55,48,12)
cal=o.fitted_colors(wallidx,reference,train=o.TRAIN)
train_region=(slice(111,156),slice(20,66))
holdouts=[(slice(111,156),slice(245,291)),(slice(160,187),slice(20,66)),(slice(45,82),slice(24,66)),(slice(156,186),slice(253,298))]
report=[]
for f in list(range(882,898))+[899,903,906,915,930]:
 frame=grab(f);train=frame[train_region].astype(np.float32);rank=[]
 for idx in range(55,61):
  pix=sprites[idx][0];h,w=pix.shape
  tile=np.clip(cal[pix],0,255).astype(np.float32)
  tiled=np.tile(tile,(3,3,1))
  err=cv2.matchTemplate(tiled,np.ascontiguousarray(train),cv2.TM_SQDIFF)
  score,_,(posx,posy),_=cv2.minMaxLoc(err)
  # Phase translation into the same absolute native screen coordinate system.
  ox=(train_region[1].start-posx)%w;oy=(train_region[0].start-posy)%h
  Y,X=np.mgrid[:200,:320];full=tile[(Y-oy)%h,(X-ox)%w]
  train_mae=float(np.abs(train-full[train_region]).mean());test_errors=[]
  for rr in holdouts:test_errors.append(round(float(np.abs(frame[rr].astype(np.float32)-full[rr]).mean()),4))
  rank.append({'original_sprite':idx,'phase_xy':[int(ox),int(oy)],'training_mae255':round(train_mae,5),'holdout_region_mae255':test_errors,'holdout_mean_mae255':round(float(np.mean(test_errors)),5)})
 rank.sort(key=lambda r:r['training_mae255'])
 report.append({'capture_frame':f,'time_s':round(f/30,5),'selected_on_training_patch':rank[0], 'all_source_ranked':rank,'best_holdout_source_independently':min(rank,key=lambda r:r['holdout_mean_mae255'])['original_sprite'], 'training_winner_beats_all_other_sources_in_holdout':rank[0]['holdout_mean_mae255'] < min(r['holdout_mean_mae255'] for r in rank[1:])})
cap.release()
assert all(r['training_winner_beats_all_other_sources_in_holdout'] for r in report if 882<=r['capture_frame']<=897), 'Holdout did not confirm original source source qualification'
out={'schema':'O212_independent_holdout_transition','input_hashes':{'exe':o.sha(e),'fall':o.sha(g),'video':hashlib.sha256(args.video.read_bytes()).hexdigest()},'palette':'common candidate learned at 31.0s from checkerboard training on source sprite55; not original DOS DAC','train_region_xyxy':[20,111,66,156],'holdout_regions_xyxy':[[245,111,291,156],[20,160,66,187],[24,45,66,82],[253,156,298,186]],'caveats':['Source video is 30fps capture, not exact DOS internal frame ticks','Single clip, captured at one game state','Palette derived from held-out source video, not source-executable DAC','Original sprite58 may participate in other transition contexts'],'rows':report}
(args.out/'O212_TRANSITION_HOLDOUT_REPORT.json').write_text(json.dumps(out,indent=2)+'\n')
for r in report:print('%03d %6.3fs source %d phase %s train %.2f holdout %.2f | next score %.2f' %(r['capture_frame'],r['time_s'],r['selected_on_training_patch']['original_sprite'],r['selected_on_training_patch']['phase_xy'],r['selected_on_training_patch']['training_mae255'],r['selected_on_training_patch']['holdout_mean_mae255'],r['all_source_ranked'][1]['holdout_mean_mae255']))
