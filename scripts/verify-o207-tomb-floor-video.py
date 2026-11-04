#!/usr/bin/env python3
"""O207. Original TOMB.GRA packed floor vs DOSBox video; qualified x motion model.

Relies on independent O206 architectural motion measurement and original O131
packed-floor placement (EXE control opcode at stage stream 0x17300). Does not
assert original camera equation, renderer callback, or stage selected mode.
"""
from __future__ import annotations
import argparse,csv,hashlib,importlib.util,json,struct,math
from pathlib import Path
import cv2,numpy as np
from PIL import Image,ImageDraw

EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
TOMB_SHA='be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613'
VIDEO_SHA='5295afece147c8de1978ab67db6aaa1cd0beb1db4a32b369dfd0ff289de16c44'
FLOOR_OFFSET=63776; FLOOR_W=896; FLOOR_H=48; FLOOR_DST_Y=158

def sha(b):return hashlib.sha256(b).hexdigest()
def need(x,msg):
 if not x:raise ValueError('O207 floor study: '+msg)
def video_frame(cap,t):
 cap.set(cv2.CAP_PROP_POS_MSEC,int(round(t*1000)));ok,img=cap.read()
 need(ok and img.shape[:2]==(432,644),'unexpected video frame '+str(t))
 return cv2.resize(img[32:432,2:642],(320,200),interpolation=cv2.INTER_AREA)
def full_read_model(exe,gra,project):
 need(len(exe)==861133 and sha(exe)==EXE_SHA,'original EXE identity')
 need(sha(gra)==TOMB_SHA,'original TOMB.GRA identity')
 # Stage Tomb original control negative marker at Object2 0x17320, packed row
 # operand occupies following three dwords; compare exact source words.
 o=0xa0c54+0x17320
 words=list(struct.unpack_from('<4Ii',exe,o)) # includes opcode -1 represented as u32
 need(words[0]==0xffffffff and words[1]==0x8432a and words[2]==158 and words[3]==56,'original stage floor opcode/args')
 need(words[4]==0x8434c,'following original control pointer')
 need(len(gra)-FLOOR_OFFSET==FLOOR_W*FLOOR_H,'full original packed floor bounds')
 # Use identical source-linked palette record as the previous O205 original
 # decoder, never a borrowed Forest or Portal color table.
 import importlib.util
 f=project/'scripts/verify-o205-kombat-tomb-pit-identity.py'
 spec=importlib.util.spec_from_file_location('o205_floor',f);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
 pal,*_=m.palette(exe,m.STAGES['tomb'])
 idx=np.frombuffer(gra[FLOOR_OFFSET:],dtype=np.uint8).reshape((FLOOR_H,FLOOR_W))
 need(idx.max()<len(pal),'original floor index outside palette record')
 rgb=np.asarray(pal,dtype=np.uint8)[idx][:,:,:3][:,:,::-1].copy()  # native BGR for OpenCV
 return rgb,idx

def alpha_paste(background,picture,x,y):
 background.alpha_composite(picture,(int(x),int(y)))

def run(args):
 need(not args.out.exists(),'refusing to overwrite O207 evidence')
 args.out.mkdir(parents=True)
 exe=args.exe.read_bytes();gra=args.tomb.read_bytes();floor,idx=full_read_model(exe,gra,args.project)
 need(sha(args.video.read_bytes())==VIDEO_SHA,'video identity')
 o206=json.loads((args.o206/'O206_report.json').read_text())
 need(o206['format']=='mkdos_o206_tomb_runtime_vertical_offsets_pit_roots_v1','O206 input format')
 need(o206['input_sha256']['exe']==EXE_SHA and o206['input_sha256']['tomb']==TOMB_SHA and o206['input_sha256']['video']==VIDEO_SHA,'O206 provenance')
 source_rows=list(csv.DictReader((args.o206/'tomb_video_samples.csv').open()))
 need(len(source_rows)==39,'O206 required sample count')
 # Independent bound source floor; include the entire 896 x 48 native plane.
 Image.fromarray(floor[:,:,::-1],'RGB').save(args.out/'original_tomb_floor_896x48.png')
 Image.fromarray(idx,'L').save(args.out/'original_tomb_floor_indices.png')
 cap=cv2.VideoCapture(str(args.video));need(cap.isOpened(),'video cannot open')
 offsets=(-12,-8,-4,-2,-1,0,1,2,4,8,12)
 results=[]
 for row in source_rows:
  t=float(row['second']);frame=video_frame(cap,t)
  camera_dy=int(row['architecture_source_y'])-(-58)
  floor_origin_predicted=FLOOR_DST_Y+camera_dy
  source_y_at_frame181=181-floor_origin_predicted
  scores={}
  for delta in offsets:
   s_y=source_y_at_frame181-delta
   if s_y<0 or s_y+17>FLOOR_H:continue
   probe=cv2.matchTemplate(floor[s_y:s_y+17],frame[181:198],cv2.TM_SQDIFF_NORMED)
   score,_,pt,_=cv2.minMaxLoc(probe)
   scores[delta]={'sqdiff_normalized':round(float(score),6),'source_window_x':int(pt[0]),'source_window_row':int(s_y)}
  need(0 in scores,'predicted floor y incompatible with native floor')
  win=min(scores,key=lambda k:scores[k]['sqdiff_normalized'])
  results.append({'second':t,'architecture_y':int(row['architecture_source_y']),
     'source_pinned_floor_y':floor_origin_predicted,'best_tested_floor_y_shift':win,
     'best_tested_floor_y':floor_origin_predicted+win,'best_test_score':scores[win]['sqdiff_normalized'],
     'original_floor_y_source_x':scores[0]['source_window_x'],
     'original_floor_y_score':scores[0]['sqdiff_normalized'],
     'alternative_displacements':{str(k):v for k,v in scores.items()}})
 cap.release()
 floor_matches=sum(abs(q['best_tested_floor_y_shift'])<=1 for q in results)
 plus=sum(q['original_floor_y_score']<q['alternative_displacements'].get('8',{'sqdiff_normalized':2})['sqdiff_normalized'] for q in results if '8' in q['alternative_displacements'])
 minus=sum(q['original_floor_y_score']<q['alternative_displacements'].get('-8',{'sqdiff_normalized':2})['sqdiff_normalized'] for q in results if '-8' in q['alternative_displacements'])
 qualified=[]
 for row,q in zip(source_rows,results):
  if q['original_floor_y_score']>=.10 or q['original_floor_y_source_x']>=576:continue
  qualified.append({'t':q['second'],'arch_source_x':float(row['architecture_source_x_candidate']),
      'floor_source_x':float(q['original_floor_y_source_x']), 'floor_score':q['original_floor_y_score']})
 train=[r for r in qualified if r['t']<=8.5]
 holdout=[r for r in qualified if 20.5<=r['t']<=30.5]
 need(len(train)>=8 and len(holdout)>=8,'insufficient independent movement sweeps')
 x=np.array([-r['floor_source_x'] for r in train]);y=np.array([r['arch_source_x'] for r in train]);slope,inter=np.polyfit(x,y,1)
 xe=np.array([-r['floor_source_x'] for r in holdout]);ye=np.array([r['arch_source_x'] for r in holdout])
 test_mae=float(np.mean(abs(ye-(slope*xe+inter))))
 controls={}
 for factor in (.75,.8,.82,.825,5/6,1.0):
  candidate_intercept=float(np.mean(y-factor*x))
  controls[f'{factor:.9f}']={'training_mae_px':round(float(np.mean(abs(y-factor*x-candidate_intercept))),5),
    'holdout_mae_px':round(float(np.mean(abs(ye-factor*xe-candidate_intercept))),5)}
 need(floor_matches>=36 and .79<slope<.85 and test_mae<4,'floor height or empirical source displacement model failed validation')
 (args.out/'floor_matches.json').write_text(json.dumps(results,indent=2)+'\n')
 # Human-readable video samples; note these are source-coordinate window matches,
 # not an authenticated original scroll/camera register.
 with (args.out/'floor_motion_qualified_matches.csv').open('w',newline='') as f:
  ww=csv.DictWriter(f,fieldnames=['t','arch_source_x','floor_source_x','floor_score']);ww.writeheader();ww.writerows(qualified)
 # Visual diagnostic at two separately selected moments. Source frame uses O205
 # layer-3/6 art and original full-width packed floor, never an extracted video
 # background. Source x origins are candidate matches from the footage.
 arch=Image.open(args.o206/'derived_original_tomb_setups/kombat_tomb_source_setup_3.png').convert('RGBA')
 sky=Image.open(args.o206/'derived_original_tomb_setups/kombat_tomb_source_setup_6.png').convert('RGBA')
 source_floor=Image.fromarray(np.dstack([floor[:,:,::-1],np.full((48,896),255,dtype=np.uint8)]),'RGBA')
 cap=cv2.VideoCapture(str(args.video))
 for t in (3.5,24.5):
  row=next(r for r in source_rows if float(r['second'])==t)
  q=next(r for r in results if r['second']==t)
  original=video_frame(cap,t)
  candidate=Image.new('RGBA',(320,200),(12,17,24,255))
  cam_y=int(row['architecture_source_y'])+58
  # Floor is full-width source indexed data; x is separately fitted at the
  # source-predicted vertical alignment, not a code-verified camera register.
  alpha_paste(candidate,sky,0,46+cam_y)
  alpha_paste(candidate,arch,-6 if t==3.5 else int(row['architecture_source_x_candidate']),-58+cam_y)
  alpha_paste(candidate,source_floor,-q['original_floor_y_source_x'],q['source_pinned_floor_y'])
  bg=candidate.convert('RGB');native=Image.fromarray(original[:,:,::-1])
  page=Image.new('RGB',(960,245),(12,22,35));draw=ImageDraw.Draw(page)
  delta=np.minimum(abs(np.asarray(native,dtype='i2')-np.asarray(bg,dtype='i2'))*3,255).astype('u1')
  for i,(pic,name) in enumerate(((native,'DOSBOX WITNESS'),(bg,'SOURCE: SKY + ARCH + FLOOR'),(Image.fromarray(delta),'3x DIFFERENCE'))):
   page.paste(pic,(i*320,26));draw.text((i*320+6,7),name,fill='white')
  draw.text((6,230),f't={t:.1f}s; source floor y={q["source_pinned_floor_y"]}; x crop={q["original_floor_y_source_x"]}; sprites and UI intentionally absent',fill=(180,207,229))
  page.save(args.out/f'full_floor_control_{str(t).replace(".","p")}.png')
 cap.release()
 # Empirical held-out scatter visualization, no invented smooth camera.
 chart=Image.new('RGB',(1060,530),(14,23,35));draw=ImageDraw.Draw(chart)
 draw.text((24,18),'O207 | KOMBAT TOMB: TWO INDEPENDENT VIDEO MOVEMENT SWEEPS',fill=(242,247,255))
 draw.text((24,44),'Original floor row 158 + observed common vertical shift; each horizontal x is fitted independently',fill=(169,194,224))
 ox,oy=80,92
 for wrow in qualified:
  xp=ox+int(wrow['floor_source_x']*1.25);yp=oy+int((-wrow['arch_source_x'])*.88)
  if 0<=xp<1040 and 0<=yp<455:
   color=(88,222,160) if wrow['t']<=8.5 else (250,192,101) if 20.5<=wrow['t']<=30.5 else (113,144,184)
   draw.ellipse((xp-4,yp-4,xp+4,yp+4),fill=color)
 draw.text((25,465),f'Train first sweep (green): {len(train)} samples; empirical slope {slope:.5f}',fill=(100,227,174))
 draw.text((25,488),f'Test return sweep (orange): {len(holdout)} samples; held-out MAE {test_mae:.2f} px; ratio is empirical, not original-source speed',fill=(255,205,122))
 chart.save(args.out/'empirical_horizontal_motion_scatter.png')
 evidence={'format':'mkdos_o207_tomb_floor_motion_source_video_v1',
  'source_SHA256':{'exe':sha(exe),'tomb':sha(gra),'video':sha(args.video.read_bytes()),'original_floor_plane_indices':sha(idx.tobytes())},
  'original_floor_source':{'file':'TOMB.GRA','source_byte_offset':FLOOR_OFFSET,'source_pixels':[896,48],
    'original_control_stage_index':1,'original_destination_y_at_zero_scroll':FLOOR_DST_Y,
    'original_requested_rows':56,'runtime_scroll_global_value_observed':False},
  'source_height_test':{'source_pinned_predicted_floor_top':'158 + (observed architecture screen Y - (-58))',
    'sample_count':len(results),'best_vertical_match_within_one_row':floor_matches,
    'zero_offset_beats_plus_8':plus,'plus_8_eligible':sum('8' in r['alternative_displacements'] for r in results),
    'zero_offset_beats_minus_8':minus,'minus_8_eligible':sum('-8' in r['alternative_displacements'] for r in results),
    't_15_5_outlier':next(r for r in results if r['second']==15.5),
    'objective':'OpenCV TM_SQDIFF_NORMED to unscaled original RGB indexed floor; native video y181:198, all full-width source X positions, tested signed Y offsets -12 .. +12',
    'source_plane_index_sha256':sha(idx.tobytes())},
  'horizontal_empirical_model':{'definition':'architecture source-to-screen translation = intercept - slope * independently matched floor source X',
    'calibration_times':[r['t'] for r in train],'heldout_times':[r['t'] for r in holdout],
    'training_samples':len(train),'heldout_samples':len(holdout),
    'fit_slope':float(slope),'fit_intercept':float(inter),'test_mean_absolute_error_pixels':test_mae,
    'alternative_controls':controls,'original_executable_equation_proved':False},
  'limitations':['Horizontal camera model is an empirical video regression, not source-verified renderer mathematics.',
  'Floor template is selected at the source-predicted vertical position; independent vertical candidate offsets were tested separately.',
  'Floor has repeated bands and visible fighter shadows, creating source-X aliases and occasional failed vertical fits.',
  'Arched stage background has repeated skull motifs; source-to-video architecture X is not guaranteed unique.',
  'Video and reconstruction retain HUD and fighters in the difference graphic; only original recovered background pixels were composited.',
  'Neither selected stage mode nor exact DMA palette activation is established by these measurements.']}
 (args.out/'O207_floor_report.json').write_text(json.dumps(evidence,indent=2)+'\n')
 print('PASS O207 floor:',floor_matches,'of',len(results),'source-predicted vertical wins ±1;',plus,'+8 controls;',minus,'-8 controls')
 print('Empirical sweep slope',round(slope,6),'holdout MAE',round(test_mae,4),'px','vs 0.75 ratio',controls['0.750000000']['holdout_mae_px'])

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__)
 for k in ('exe','tomb','video','project','o206','out'):p.add_argument('--'+k,type=Path,required=True)
 run(p.parse_args())
