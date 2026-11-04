#!/usr/bin/env python3
"""O211 independent additive, read-only Pit II research: capture-frame timeline and source art exclusions.
No game binary writes. Observed RGB differences do not constitute runtime draw calls or timing semantics.
"""
import argparse,collections,hashlib,importlib.util,json,struct,zipfile
from pathlib import Path
import cv2,numpy as np
from PIL import Image,ImageDraw
H={"exe":"fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65",
"fall":"60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0",
"pit":"af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96",
"video_fatal":"198b5ecccb1cca898e4da7ba1282104fac71c2e3bc8a6009638420deb9dede48",
"video_pit":"3fecb35f35fb6786528b64ac5b6322ef65564885bf735405955cb1f11f928d94"}
def sha(x):return hashlib.sha256(x).hexdigest()
def grab(cap,index,mode):
 cap.set(cv2.CAP_PROP_POS_FRAMES,index);ok,frame=cap.read()
 if not ok:raise RuntimeError('Missing frame '+str(index))
 if mode=='fatal':assert frame.shape[:2]==(430,660);cut=frame[25:425,10:650]
 else:assert frame.shape[:2]==(426,638);cut=frame[26:426,:638]
 return cv2.cvtColor(cv2.resize(cut,(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB)
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--game-zip',required=True,type=Path);ap.add_argument('--fatal-video',required=True,type=Path);ap.add_argument('--pit-video',required=True,type=Path);ap.add_argument('--o210-script',required=True,type=Path);ap.add_argument('--out',required=True,type=Path);a=ap.parse_args()
 assert not a.out.exists(),'Never overwrite existing evidence';a.out.mkdir(parents=True)
 with zipfile.ZipFile(a.game_zip) as z:
  exe=z.read('mk2/mk2.exe');fall=z.read('mk2/fall.gra');pit=z.read('mk2/pit.gra');monks=z.read('mk2/monks.gra')
 got={'exe':sha(exe),'fall':sha(fall),'pit':sha(pit),'video_fatal':sha(a.fatal_video.read_bytes()),'video_pit':sha(a.pit_video.read_bytes())}
 assert got==H,('canonical input identity mismatch',got)
 s=importlib.util.spec_from_file_location('o210_origin',str(a.o210_script));mod=importlib.util.module_from_spec(s);s.loader.exec_module(mod)
 sprites,meta=mod.decode(exe,fall)
 cv=cv2.VideoCapture(str(a.fatal_video));assert cv.isOpened() and cv.get(cv2.CAP_PROP_FPS)==30
 # Compare precise source frames, not approximate seeking by ms: exact capture frame indices.
 fine_idx=mod.texindex(sprites,60,0,16);wall_idx12=mod.texindex(sprites,55,48,12);wall_idx16=mod.texindex(sprites,55,48,16)
 pal_fine=mod.fitted_colors(fine_idx,grab(cv,885,'fatal'));pal_wall=mod.fitted_colors(wall_idx12,grab(cv,930,'fatal'))
 fine=np.clip(pal_fine[fine_idx],0,255).astype(np.uint8);wall12=np.clip(pal_wall[wall_idx12],0,255).astype(np.uint8);wall16=np.clip(pal_wall[wall_idx16],0,255).astype(np.uint8)
 m=mod.SAFE&((mod.X+mod.Y)%2==1)
 fits=[];prev=None
 for f in range(873,916):
  im=grab(cv,f,'fatal');errors={}
  for label,bg in [('fine_60_xy_0_16',fine),('wall_55_xy_48_12',wall12),('wall_55_xy_48_16',wall16)]:errors[label]=round(float(np.abs(im[m].astype('int16')-bg[m]).mean()),3)
  winner=min(errors,key=errors.get);change=round(float(np.abs(im.astype('int16')-prev.astype('int16')).mean()),4) if prev is not None else None
  fits.append({'capture_frame':f,'time_s_nominal':round(f/30,6),'model_errors_rgb255_on_fixed_unoccluded_mask':errors,'best_of_three_fixed_models':winner,'adjacent_full_frame_mae255':change})
  prev=im
 cv.release()
 # Identifies coarse observed source dominance, NOT whether intermediate is affine/zoom/scroll/palette fade.
 stable_fine=[x['capture_frame'] for x in fits if x['model_errors_rgb255_on_fixed_unoccluded_mask']['fine_60_xy_0_16']<10]
 stable_wall=[x['capture_frame'] for x in fits if min(x['model_errors_rgb255_on_fixed_unoccluded_mask']['wall_55_xy_48_12'],x['model_errors_rgb255_on_fixed_unoccluded_mask']['wall_55_xy_48_16'])<10]
 ambiguous=[x['capture_frame'] for x in fits if x['capture_frame'] not in stable_fine and x['capture_frame'] not in stable_wall]
 # All known O205 setup 4 art, sprite roles compare to runtime (full original source setup 4 devoid of bridge fighters).
 # Analyze uploaded MONKS.GRA only under independently established MK2 packed run grammar, without claiming other possible file roles.
 vals=struct.unpack('<'+str(len(monks)//4)+'I',monks)
 runs=[{'word':hex(w),'occurrences':sum(1 for a in vals if a==w)} for w in sorted(set(vals))]
 monks_graphics={'installed_file_size_bytes':len(monks),'words':len(vals),'all_word_low_bits_mark_skip_under_known_MK2_grammar':all(bool(v&1) for v in vals),'opaque_draw_commands_if_using_MK2_grammar':sum(1 for v in vals if not v&1),'word_values':runs,
 'interpretation':'No drawable artwork under known MK2 packed format; unknown other intended file semantics; not a proven actor source'}
 # Source graphic 54's mask is a potential impact crack, check apparent position against wall RGB residual at several frames.
 cap=cv2.VideoCapture(str(a.fatal_video));sp,alpha=sprites[54];hh,ww=sp.shape;assert (hh,ww)==(96,96)
 body,bodymask=sprites[47];bh,bw=body.shape
 mask_body=np.zeros((200,320),dtype=bool);mask_body[50:50+bh,117:117+bw]=bodymask>0
 roi=(mod.X>=65)&(mod.X<245)&(mod.Y>=42)&(mod.Y<185)&~mask_body
 crack_test=[];crack_masks=[]
 for frame in (894,900,904,909,930):
  img=grab(cap,frame,'fatal');res=img.astype('float32')-wall12.astype('float32')
  # Exclude chroma effects and letters (bright white or blood-red); retained dark residual must be substantially darker in at least 2 channels.
  dark=(np.sum(res < -17,axis=2)>=2)&(np.mean(res,axis=2)<-14)&roi
  dark &=~((img[:,:,0]>img[:,:,1]*1.6)&(img[:,:,0]>95))
  vals=[]
  for y in range(28,95,2):
   for x in range(74,153,2):
    cm=np.zeros((200,320),dtype=bool);cm[y:y+hh,x:x+ww]=(alpha>0)
    test=cm&roi;tp=(test&dark).sum();fp=(test&~dark).sum();fn=(~test&dark&roi).sum()
    precision=float(tp)/max(1,tp+fp);recall=float(tp)/max(1,tp+fn)
    f1=2*precision*recall/(precision+recall+1e-12)
    vals.append((f1,int(x),int(y),int(tp),int(fp),int(fn)))
  vals.sort(reverse=True)
  controls=[]
  for x,y in [(104,44),(124,64),(74,44),(144,84)]:
   cm=np.zeros((200,320),dtype=bool);cm[y:y+96,x:x+96]=alpha>0
   test=cm&roi;tp=int((test&dark).sum());fp=int((test&~dark).sum());fn=int((~test&dark&roi).sum());f1=2*tp/max(1,2*tp+fp+fn)
   controls.append({'xy':[x,y],'f1':round(f1,4),'tp':tp})
  crack_test.append({'frame':frame,'time':round(frame/30,4),'top_3_f1_masks':[{'f1':round(v[0],5),'xy':[v[1],v[2]],'tp':v[3],'fp':v[4],'fn':v[5]} for v in vals[:3]],'prespecified_position_controls':controls,'dark_residual_pixel_count_in_roi':int(dark.sum()),'caveat':'mask only, highly confounded by shadowing/effect/overlay and lacks a learned original palette'})
  if frame==909:
   best=vals[0];overlay=Image.fromarray(img).convert('RGBA');ov=Image.new('RGBA',(320,200));aa=np.zeros((200,320,4),dtype=np.uint8);aa[:,:,0]=255;aa[best[2]:best[2]+96,best[1]:best[1]+96,3]=(alpha>0)*105
   ov=Image.fromarray(aa,'RGBA');overlay=Image.alpha_composite(overlay,ov)
   display=Image.new('RGB',(960,220));display.paste(Image.fromarray(img),(0,20));display.paste(overlay.convert('RGB'),(320,20));display.paste(Image.fromarray((dark*255).astype('uint8')).convert('RGB'),(640,20));dd=ImageDraw.Draw(display);dd.text((3,2),'recorded 30.3s',fill='white');dd.text((323,2),f'candidate 54 mask best {best[1:3]}',fill='white');dd.text((643,2),'dark residual mask (not ground truth)',fill='white');display.save(a.out/'crack_candidate_diagnostic.png')
 cap.release()
 # Controlled source identity exclusion, no unsupported runtime claims about literal MONKS.GRA format.
 report={'schema':'mkdos_pit_ii_o211_partial_evidence_v1','inputs_sha256':got,'inherited_O210_61_encoded_graphics_reproduced':len(sprites)==61 and meta[-1]['graEnd']==len(fall),
 'sampled_fatality_capture_frames':{'nominal_fps':30,'sample_start':873,'sample_end_inclusive':915,'fine_match_below_mae10':stable_fine,'wall_match_below_mae10':stable_wall,'no_fixed_model_below_mae10':ambiguous,'full_table_file':'capture_timeline.json',
 'qualification':'Capture-frame classifications only; not original game tick schedule, frame callbacks, transition mode or DAC palette'},
 'monks_candidate_test':monks_graphics,'crack_source54_mask_test':crack_test,
 'unresolved':['30-fps recording undersamples possible game transitions','Intermediate descent zoom/scroll/layering not proved','No verified exact original DAC','Source sprite54 crack placement or active drawing not proved','Blood/debris/title origin and original compositor not proved','Small background figures require independent EXE/resource path','No source-executable fatality dispatcher/preconditions','Full six-layer PIT scene ordering and camera transforms need tracing']}
 (a.out/'O211_PARTIAL_EVIDENCE.json').write_text(json.dumps(report,indent=2)+'\n');(a.out/'capture_timeline.json').write_text(json.dumps(fits,indent=2)+'\n')
 print(json.dumps({'fine':stable_fine,'wall':stable_wall,'unresolved_captured_frames':ambiguous,'monks_skip_only':monks_graphics['all_word_low_bits_mark_skip_under_known_MK2_grammar'],'crack_top':[(x['time'],x['top_3_f1_masks'][0]) for x in crack_test]},indent=2))
if __name__=='__main__':main()
