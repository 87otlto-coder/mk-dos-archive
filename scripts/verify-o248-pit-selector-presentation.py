#!/usr/bin/env python3
"""O248: read-only 30fps presentation feasibility against O224/O246/O247 evidence.

Uses the original-source selector record, positive-control capture qualification and
source-palette image rankings from independently verified earlier experiments.
It does not claim to replay the renderer, interrupt loop or game state machine.
"""
from __future__ import annotations
import argparse, hashlib, json, zipfile
from pathlib import Path
import cv2
import numpy as np

ORIG = {
 'known': 'e346c8de3f5b6d646ff5e5bd313a3f64c37b55b5801c99957ad71c99bacc4953',
 'graphic58':'caa583e0880d05e0ad76b4e9f3da9c1fd2a04fb6c3881d7d252ad2d2fe72cb91',
 'game_exe':'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',
 'game_fall':'60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0',
}
ROOT='MK-DOS-Archive/research_outputs/'
def h(b):return hashlib.sha256(b).hexdigest()
def filehash(p):
 x=hashlib.sha256()
 with open(p,'rb') as f:
  for b in iter(lambda:f.read(1<<20),b''):x.update(b)
 return x.hexdigest()
def extract_roi(video,first,last):
 c=cv2.VideoCapture(str(video))
 assert c.isOpened() and abs(c.get(cv2.CAP_PROP_FPS)-30)<0.0001
 assert int(c.get(cv2.CAP_PROP_FRAME_COUNT))>=last+1
 assert c.set(cv2.CAP_PROP_POS_FRAMES,first)
 result=[];previous=None
 for n in range(first,last+1):
  ok,f=c.read();assert ok,('frame read',n)
  native=cv2.resize(f[30:,4:f.shape[1]-4],(320,200),interpolation=cv2.INTER_AREA)
  roi=native[75:145,35:125].astype(np.int16)
  if previous is None:diff=None;changed=None
  else:
   dif=np.abs(roi-previous)
   diff=round(float(dif.mean()),6)
   changed=int(np.count_nonzero(np.any(dif>0,axis=2)))
  result.append({'frame':n,'time_s':round(n/30,6),'wall_roi_sha256':h(roi.tobytes()),'previous_roi_rgb_mae':diff,'previous_roi_changed_pixels':changed})
  previous=roi
 c.release()
 return result

def labels_for(name,rows,diag):
 ids=sorted(int(v['frame']) for v in rows)
 assert ids==list(range(ids[0],ids[-1]+1))
 d={int(v['frame']):int(v['holdout_best']) for v in rows}
 for n in diag:d[n]=59 if name=='graphic59_control' else 58
 return ids,[d[n] for n in ids]

def best_models(ids,labels):
 src=np.array([60]*12+[59]*6+[58]*5+[57]*4+[56]*3+[55]*250,np.int16)
 n=np.asarray(ids,int);obs=np.asarray(labels,int)
 rates=[50.0,60.0]
 all_rates=np.arange(40,80.000001,.25)
 phases=np.arange(0,12,.01)
 def best(rate):
  ind=np.floor(phases[:,None]+(n[None,:]-n[0])*rate/30).astype(int)
  err=np.count_nonzero(src[ind]!=obs[None,:],axis=1)
  idx=int(np.argmin(err));ph=float(phases[idx])
  pred=src[ind[idx]].tolist()
  return {'rate_steps_per_second':round(float(rate),3),'minimum_frame_mismatches':int(err[idx]),'selector_index_at_first_frame':round(ph,3),'predicted_labels':pred,'mismatched_capture_frames':[int(fr) for fr,a,b in zip(ids,labels,pred) if a!=b]}
 standards={str(int(rate)):best(rate) for rate in rates}
 fitted=min((best(float(x)) for x in all_rates),key=lambda d:(d['minimum_frame_mismatches'],abs(d['rate_steps_per_second']-60),d['rate_steps_per_second']))
 return {'fixed_50_steps_per_second':standards['50'],'fixed_60_steps_per_second':standards['60'],'best_grid_40_to_80_steps_per_second':fitted, 'search_phase_increment_steps':0.01,'search_rate_increment_steps_per_second':0.25}

def main():
 p=argparse.ArgumentParser()
 for k in ['source_zip','known','graphic58','game_zip','out']:p.add_argument('--'+k.replace('_','-'),type=Path,required=True)
 a=p.parse_args()
 assert not a.out.exists(), 'output exists; use a fresh path'
 assert filehash(a.known)==ORIG['known']
 assert filehash(a.graphic58)==ORIG['graphic58']
 with zipfile.ZipFile(a.game_zip) as z:
  assert h(z.read('mk2/mk2.exe'))==ORIG['game_exe']
  assert h(z.read('mk2/fall.gra'))==ORIG['game_fall']
 with zipfile.ZipFile(a.source_zip) as z:
  o224=json.loads(z.read(ROOT+'O224_PIT_FATALITY_BACKGROUND_SOURCE_TIMED_SEQUENCE.json'))
  o246=json.loads(z.read(ROOT+'O246_PIT_GRAPHIC58_RUNTIME_WITNESS.json'))
  o247=json.loads(z.read(ROOT+'O247_PIT_ORIGINAL_TILE58_CROSS_CONTROL.json'))
 assert o247['fixture']['mk2_exe_sha256']==ORIG['game_exe']
 assert o247['fixture']['known_video_sha256']==ORIG['known']
 assert o247['fixture']['graphic58_video_sha256']==ORIG['graphic58']
 assert o246['graphic59_positive_control']['sha256']==ORIG['known']
 assert o246['graphic58_test']['sha256']==ORIG['graphic58']
 r=o224['source_static_facts']['selector_runs_in_original_execution_order']
 assert [(x['tile_sprite'],x['selector_steps']) for x in r]==[(60,12),(59,6),(58,5),(57,4),(56,3),(55,2)]
 assert o224['source_static_facts']['source_yield_per_selector_step']==1
 d59=[int(x['index']) for x in o246['graphic59_positive_control']['qualifying_frames']]
 d58=[int(x['index']) for x in o246['graphic58_test']['qualifying_frames']]
 assert d59==[449,450,451] and d58==[501,502]
 result={}
 for key,video,diags in [('graphic59_control',a.known,d59),('graphic58_experiment',a.graphic58,d58)]:
  frames,labels=labels_for(key,o247['results'][key],diags)
  pos=[{'frame':f,'sprite':v} for f,v in zip(frames,labels)]
  run=[]
  for f,v in zip(frames,labels):
   if not run or run[-1]['source_sprite']!=v:run.append({'source_sprite':v,'start_frame':f,'end_frame':f,'captured_frames':1})
   else:run[-1]['end_frame']=f;run[-1]['captured_frames']+=1
  assert [x['source_sprite'] for x in run]==[60,59,58,57,56,55]
  delta=extract_roi(video,frames[0],frames[-1]);assert [x['frame'] for x in delta]==frames
  result[key]={'runs':run,'frame_observations':pos,'roi_frame_changes':delta,'model_fit':best_models(frames,labels)}
 # Phase-independent proof for the positive control, under *continuous immediate display*:
 # One 30fps sample of 58 surrounded on both sides implies a displayed
 # five-step interval strictly shorter than 2*(1/30)s => rate > 75.
 # Three 30fps samples of 56 require its three-step interval >=2*(1/30)s => rate <=45.
 k=result['graphic59_control']['runs']
 assert [(x['source_sprite'],x['captured_frames']) for x in k]==[(60,7),(59,3),(58,1),(57,2),(56,3),(55,2)]
 assert result['graphic58_experiment']['runs'][3]['captured_frames']==3
 # Independent captured-frame check that held walls can be exact duplicates (not classification noise).
 roi58={x['frame']:x['wall_roi_sha256'] for x in result['graphic58_experiment']['roi_frame_changes']}
 assert roi58[503]==roi58[504]==roi58[505]
 proof={'argument':'Assuming each selector entry persists for 1/r seconds, immediate continuous display, and strictly periodic 30fps sampling, in 59-control: source 58 has 5 entries but is present only frame 452, between non-58 frames 451 and 453. Its interval must be <2/30 seconds, demanding r>75 steps/s. Source 56 has 3 entries and appears frames 455,456,457, demanding its interval >=2/30 seconds and r<=45 steps/s. No constant r satisfies both.', 'result':'Uniform constant-rate immediate presentation model refuted by positive-control capture under those assumptions','source58_requires_rate_strictly_above_steps_per_s':75,'source56_requires_rate_at_most_steps_per_s':45,'limitations':['No proof that the selector task actually executes at one uniform rate.','A captured 30fps frame can repeat while the underlying game runs at ~50fps.','A compositor can hold stale objects or skip newly selected objects; this test does not isolate the exact cause.','Original source graphic identity rankings use independently verified O247 measurements, not a new source image decoder.','Captured frame counts are not measured task ticks.']}
 out={'format':'mk2_o248_pit_selector_presentation_feasibility_v1','inputs':{'source_zip':filehash(a.source_zip),'known_video':ORIG['known'],'graphic58_video':ORIG['graphic58'],'game_exe':ORIG['game_exe'],'fall_gra':ORIG['game_fall']},'selector_runs':r,'fps_capture':30,'roi_native_window_xyxy':[35,75,125,145],'trials':result,'phase_independent_uniform_rate_disproof':proof,'summary':'Both recordings independently confirm source order 60,59,58,57,56,55. Continuous immediate-display uniform-rate presentation cannot explain the 59 positive control. Timers, object replacement, compositor and capture remain distinct untraced mechanisms.'}
 a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(out,indent=2,sort_keys=True)+'\n')
 print('O248 report',str(a.out),h(a.out.read_bytes()))
 for key,v in result.items():
  print(key,'runs',[(x['source_sprite'],x['captured_frames']) for x in v['runs']]);print('model',[(k,x['minimum_frame_mismatches'],x['rate_steps_per_second']) for k,x in v['model_fit'].items() if isinstance(x,dict)])
if __name__=='__main__':main()
