#!/usr/bin/env python3
"""O232: source-authenticated Pit II pillar pre-cut motion and distant-layer holdout.

Read-only canonical-fixture study. Does not assert a unique camera formula.
Usage: python verify-o232-pit-pillar-descent-motion.py --game-zip /path/to/mk2.zip
       --video /path/to/fatality.mp4 --project /path/to/MK-DOS-Archive --out NEWDIR
"""
import argparse,hashlib,importlib.util,json,zipfile,statistics
from pathlib import Path
import cv2,numpy as np

EXPECTED={'exe':'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',
'pit':'af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96',
'video':'198b5ecccb1cca898e4da7ba1282104fac71c2e3bc8a6009638420deb9dede48'}
PATCHES=[(269,200,20,52),(270,300,19,42),(273,400,14,55)]
FRAMES=list(range(861,878))
ANCHORS=[864,870,876]
REGION=(170,70,265,196)
BACK=(20,70,90,120)

def sha(b):return hashlib.sha256(b).hexdigest()
def video_frames(path,indices):
 cap=cv2.VideoCapture(str(path));frames={}
 if not cap.isOpened() or abs(cap.get(cv2.CAP_PROP_FPS)-30)>0.001 or tuple(int(cap.get(x)) for x in (cv2.CAP_PROP_FRAME_WIDTH,cv2.CAP_PROP_FRAME_HEIGHT))!=(660,430):
  raise ValueError('video capture FPS / dimensions mismatch')
 for idx in indices:
  cap.set(cv2.CAP_PROP_POS_FRAMES,idx);ok,f=cap.read()
  if not ok or f.shape[:2]!=(430,660):raise ValueError(f'video frame {idx} unavailable or invalid dimensions')
  if f.shape[0]<425 or f.shape[1]<650:raise ValueError(f'video geometry {f.shape} too small')
  video=cv2.cvtColor(cv2.resize(f[25:425,10:650],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB)
  frames[idx]=video
 cap.release();return frames

def corr(a,b):
 aa=a.astype('float64').ravel();bb=b.astype('float64').ravel()
 return float(np.corrcoef(aa,bb)[0,1]) if aa.std()>1e-8 and bb.std()>1e-8 else 0.

def main(args):
 dest=Path(args.out)
 if dest.exists():raise ValueError('refusing existing output dir')
 with zipfile.ZipFile(args.game_zip) as z:
  members={Path(n).name.lower():n for n in z.namelist() if n.lower().endswith(('mk2.exe','pit.gra'))}
  exe=z.read(members['mk2.exe']);pit=z.read(members['pit.gra'])
 hashes={'exe':sha(exe),'pit':sha(pit),'video':hashlib.file_digest(open(args.video,'rb'),'sha256').hexdigest()}
 if hashes!=EXPECTED:raise ValueError('canonical original fixture hash mismatch')
 spec=importlib.util.spec_from_file_location('o205_pit',str(Path(args.project)/'scripts/verify-o205-kombat-tomb-pit-identity.py'))
 m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
 dest.mkdir(parents=True)
 layers,_=m.render_stage(exe,pit,m.STAGES['pit'],dest/'original_six_setups')
 source=np.asarray(layers[1].convert('RGBA'))
 for sx,sy,w,h in PATCHES:
  if not np.array_equal(source[sy:sy+h,sx:sx+w],source[sy+96:sy+96+h,sx:sx+w]):
   raise ValueError('96-pixel original-pillar repeat was lost')
  if np.array_equal(source[sy:sy+h,sx:sx+w],source[sy+48:sy+48+h,sx:sx+w]):
   raise ValueError('unexpected 48-pixel exact repeat, check actual source')
 if source.shape!=(768,1400,4):raise ValueError('stage setup-2 dimensions corrupted')
 sgray=cv2.cvtColor(source[:,:,:3],cv2.COLOR_RGB2GRAY)
 video=video_frames(args.video,FRAMES)
 observed=[]
 x0,y0,x1,y1=REGION
 for frame in FRAMES:
  vgray=cv2.cvtColor(video[frame],cv2.COLOR_RGB2GRAY)
  patches=[]
  for sx,sy,w,h in PATCHES:
   patch=sgray[sy:sy+h,sx:sx+w]
   scores=cv2.matchTemplate(vgray[y0:y1,x0:x1],patch,cv2.TM_CCOEFF_NORMED)
   _,s,_,pt=cv2.minMaxLoc(scores)
   vx=x0+pt[0];vy=y0+pt[1]
   ctl={}
   for k in (-4,4):
    shifted=vgray[vy:vy+h,vx+k:vx+k+w]
    ctl[str(k)]=round(corr(patch,shifted),5)
   rgbdiff=np.abs(source[sy:sy+h,sx:sx+w,:3].astype('int16')-video[frame][vy:vy+h,vx:vx+w].astype('int16'))
   patches.append({'source_local_xy':[sx,sy],'video_xy':[vx,vy],
    'offset_x':vx-sx,'offset_y':vy-sy,'phase_y_mod96':(vy-sy)%96,
    'grayscale_zncc':round(s,5),'source_rgb_mae255':round(float(rgbdiff.mean()),5),
    'offset_horizontal_controls_zncc':ctl})
  selected=[p for p in patches if p['grayscale_zncc']>=0.93]
  xs=[p['offset_x'] for p in selected]
  valid=len(selected)>=2 and max(xs)==min(xs) and len({p['phase_y_mod96'] for p in selected})==1
  observed.append({'original_capture_frame':frame,'seconds':round(frame/30,6),
   'verified_common_x':int(xs[0]) if valid else None,
   'phase_y_mod96':int(selected[0]['phase_y_mod96']) if valid else None,
   'qualifying_independent_patches':len(selected),'qualified':bool(valid),'all_patch_tests':patches})
 selected=[o for o in observed if o['qualified']]
 first=next(r for r in selected if r['original_capture_frame']==861)
 last=next(r for r in selected if r['original_capture_frame']==874)
 assert first['verified_common_x']==-32 and last['verified_common_x']==-71
 assert len(selected)>=8
 # distant scenery remains stationary while bridge foreground translates. Exact zero is compressed-frame pixel equality.
 bg=[]
 a=video[864][BACK[1]:BACK[3],BACK[0]:BACK[2]].astype('int16')
 for frame in ANCHORS:
  b=video[frame][BACK[1]:BACK[3],BACK[0]:BACK[2]].astype('int16')
  other=video[frame][BACK[1]:BACK[3],BACK[0]+4:BACK[2]+4].astype('int16')
  bg.append({'frame':frame,'seconds':frame/30,'identical_pixels':int(np.all(a==b,axis=2).sum()),
   'tested_pixels':int(a.shape[0]*a.shape[1]),'rgb_mae255':round(float(np.abs(a-b).mean()),6),
   'shift_plus4_mae255':round(float(np.abs(a-other).mean()),6)})
 assert all(row['identical_pixels']==row['tested_pixels'] for row in bg)
 assert all(row['shift_plus4_mae255']>1 for row in bg)
 controls=[p['offset_horizontal_controls_zncc'][k] for row in selected for p in row['all_patch_tests'] if p['grayscale_zncc']>=.93 for k in ('-4','4')]
 assert max(controls)<.6, 'wrong-source or shifted control failed'
 result={'schema':'mkdos_o232_source_pillar_camera_video_motion_v1',
  'canonical_source_hashes':hashes,'original_source':{'resource':'PIT.GRA','stage_setup':2,'canvas':[1400,768],
   'source_patches_xy_wh':[list(q) for q in PATCHES],
   'source_original_encoded_column_offset':56728,'source_horizontal_alias_period':280,
   'source_column_vertical_visual_alias_period':96},
  'original_video':{'capture_fps':30,'native_roi':'frame[25:425,10:650] resized to (320,200)',
   'cut_last_pit_frame':877,'next_wall_frame':878,'patch_search_roi':list(REGION),'unobstructed_distant_region':list(BACK)},
  'qualified_range':{'first_capture_frame':first['original_capture_frame'],
   'last_capture_frame':last['original_capture_frame'],
   'first_x':first['verified_common_x'],'last_x':last['verified_common_x'],
   'delta_native_x':last['verified_common_x']-first['verified_common_x'],
   'seconds_between':round((last['original_capture_frame']-first['original_capture_frame'])/30,6),
   'qualified_samples':len(selected),'horizontal_shift_controls_max_corr':max(controls)},
  'per_video_frame_original_source_matches':observed,
  'independent_far_background_holdout':bg,
  'conclusions':['The original PIT.GRA source-setup-2 pillar continues through native-video frame 877 and moves left as a layer while distant bridge scenery is stationary.',
   'Its movement is independently witnessed by at least two original-source patch matches in each qualified captured frame.',
   'The bridge column is not FALL.GRA graphic58 and the bridge-to-FALL cut begins at frame 878.',
   'Vertical placement is only measured modulo 96 because the original source pillar itself repeats; no exact vertical camera travel is asserted.'],
  'limits':['30 fps video is a sampling of the approximately 50 fps DOS presentation; displayed frames and timer interrupts are separate.',
   'Neither absolute world-space X nor a complete stage camera codepath is established by the source-to-video offsets.',
   'The distant backdrop holdout verifies regional stationarity, not the complete upper-stage layer composition.',
   'No new evidence about the FALL.GRA graphic58 selector execution or hardware palette installation.']}
 (dest/'O232_PIT_PILLAR_DESCENT_PARALLAX.json').write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
 print(json.dumps({'qualified_samples':len(selected),'first_last':result['qualified_range'],'background_holdout':bg},indent=2))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--game-zip',type=Path,required=True);p.add_argument('--video',type=Path,required=True);p.add_argument('--project',type=Path,required=True);p.add_argument('--out',required=True);main(p.parse_args())
