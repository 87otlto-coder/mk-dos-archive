#!/usr/bin/env python3
"""O220: original small PIT.GRA bridge sprites, source-only palette & captured-video holdouts.
Read-only, hash-pin original owner MK2 fixture and recording; never assert runtime tick schedule.
"""
import argparse, hashlib, json, struct, zipfile
from pathlib import Path
import cv2,numpy as np
A=argparse.ArgumentParser();A.add_argument('--game-zip',type=Path,required=True);A.add_argument('--pit-video',type=Path,required=True);A.add_argument('--out',type=Path,required=True);a=A.parse_args()
assert not a.out.exists(),'Refusing to replace evidence';a.out.mkdir(parents=True)
with zipfile.ZipFile(a.game_zip) as z:e=z.read('mk2/mk2.exe');gra=z.read('mk2/pit.gra')
sha=lambda x:hashlib.sha256(x).hexdigest()
hashes={'exe':sha(e),'pit':sha(gra),'video':sha(a.pit_video.read_bytes())}
assert hashes=={'exe':'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','pit':'af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96','video':'3fecb35f35fb6786528b64ac5b6322ef65564885bf735405955cb1f11f928d94'}
# Exact source descriptors verified independently against EXE, including 16-byte first record of each group.
phys=[0xB98E4,0xB98F4]+[0xB9900+12*i for i in range(5)]+[0xB993C,0xB994C]+[0xB9958+12*i for i in range(5)]
assert len(phys)==14 and phys[-1]==0xB9988
pix=[];meta=[]
for i,off in enumerate(phys):
 w,h,x,y,packed=struct.unpack_from('<HHhhI',e,off)
 assert w==16 and h==(24 if i<7 else 32) and x==y==0 and packed>>24==32,(i,off,w,h,x,y,hex(packed))
 at=packed&0xFFFFFF;start=at;p=np.zeros((h,w),np.uint8);m=np.zeros((h,w),bool)
 for ry in range(h):
  xx=0
  while xx<w:
   cmd=struct.unpack_from('<I',gra,at)[0];at+=4
   if cmd&1:n=cmd>>1
   elif cmd&2:n=cmd>>10;p[ry,xx:xx+n]=(cmd>>2)&255;m[ry,xx:xx+n]=True
   else:n=cmd>>2;p[ry,xx:xx+n]=np.frombuffer(gra,np.uint8,count=n,offset=at);m[ry,xx:xx+n]=True;at+=(n+3)&~3
   assert 0<n<=w-xx;xx+=n
 assert 0<m.sum()<w*h
 meta.append({'i':i,'descriptorPhysical':hex(off),'graOffset':start,'graEnd':at,'width':w,'height':h,'sourceOpaquePixels':int(m.sum())})
 pix.append((p,m))
for i,s in enumerate(meta):assert s['graOffset']==(61620 if i==0 else meta[i-1]['graEnd'])
assert meta[-1]['graEnd']==len(gra)==69384
# Original Pit source-linked 81-entry record from O205, pointer joined through confirmed LE mappings.
assert (0x61C54+struct.unpack_from('<I',e,0xA0C54+0x18D40)[0])==0x895AC
assert struct.unpack_from('<H',e,0x895AC)[0]==81
pal=np.zeros((82,3),np.uint8)
for i in range(1,82):
 word=struct.unpack_from('<H',e,0x895AC+2*i)[0]
 rgb=[((word>>9)&63)|1,((word>>4)&63)|1,((word<<1)&63)|1]
 pal[i]=[(v<<2)|(v>>4) for v in rgb]
source=[(pal[p],m) for p,m in pix]
cap=cv2.VideoCapture(str(a.pit_video));assert cap.isOpened() and cap.get(cv2.CAP_PROP_FPS)==30
candidates={'green_actor':{'group':list(range(7)),'x':range(135,143),'y':range(86,95)},'fire_actor':{'group':list(range(7,14)),'x':range(160,169),'y':range(79,90)}}
rows=[]
for frame in range(0,151,3):
 cap.set(cv2.CAP_PROP_POS_FRAMES,frame);ok,img=cap.read();assert ok and img.shape[:2]==(426,638)
 observed=cv2.cvtColor(cv2.resize(img[26:426,:638],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB)
 out={'video_frame':frame,'video_time_seconds':round(frame/30,5)}
 for name,cfg in candidates.items():
  matches=[]
  for j in cfg['group']:
   rgb,mask=source[j];hh,ww=mask.shape;yy,xx=np.indices((hh,ww));train=mask&((xx+yy)&1==0);test=mask&~train
   for x in cfg['x']:
    for y in cfg['y']:
     view=observed[y:y+hh,x:x+ww]
     t=float(np.abs(view[train].astype('int16')-rgb[train].astype('int16')).mean())
     matches.append((round(t,5),j,x,y))
  best=sorted(matches)[0];err,i,x,y=best;rgb,mask=source[i];hh,ww=mask.shape;yy,xx=np.indices((hh,ww));train=mask&((xx+yy)&1==0);test=mask&~train
  view=observed[y:y+hh,x:x+ww]
  val=float(np.abs(view[test].astype('int16')-rgb[test].astype('int16')).mean())
  control=observed[y:y+hh,x+3:x+3+ww];val_shift=float(np.abs(control[test].astype('int16')-rgb[test].astype('int16')).mean())
  # Wrong-color original stage sprite from other actor group, matched on source-aligned visible patch.
  other=range(7,14) if i<7 else range(7)
  color_control=[]
  for k in other:
   r,m=source[k]
   h2=min(hh,r.shape[0]);w2=ww
   # Keep exactly the selected sprite's test region within its original geometry.
   shared=test[:h2,:w2]
   color_control.append(float(np.abs(observed[y:y+h2,x:x+w2][shared].astype('int16')-r[:h2,:w2][shared].astype('int16')).mean()))
  out[name]={'selected_source_sprite':i,'original_source_origin_xy':[x,y],'checkerboard_train_rgb_mae255':round(err,5),'independent_checkerboard_holdout_mae255':round(val,5),'same_original_sprite_shift_plus_3_x_holdout_mae255':round(val_shift,5),'best_wrong_actor_group_at_same_origin_mae255':round(min(color_control),5),'second_train_candidate':list(sorted(matches)[1])}
 rows.append(out)
cap.release()
for n in candidates:
 v=[r[n] for r in rows];print(n,'count',len(v),'selected sprite coverage',sorted(set(x['selected_source_sprite'] for x in v)),
  'median holdout',round(float(np.median([x['independent_checkerboard_holdout_mae255'] for x in v])),3),
  'median shifted',round(float(np.median([x['same_original_sprite_shift_plus_3_x_holdout_mae255'] for x in v])),3),
  'median wrong group',round(float(np.median([x['best_wrong_actor_group_at_same_origin_mae255'] for x in v])),3),
  'origins',sorted(set(tuple(x['original_source_origin_xy']) for x in v)))
result={'schema':'o220_pit14_original_bridge_sprites_video_holdout_v1','fixture_sha256':hashes,'source_resource':'PIT.GRA','source_resource_id':32,'source_sprite_coverage':'14 consecutive graphics at last 7,764 bytes of original PIT.GRA, with two seven-pose groups','original_source_pal_81_physical':'0x895AC','all_descriptors':meta,'capture_fps':30,'video_samples':rows,'constraints':'Native-source indices and original EXE palette, no video color fitting. Candidate source sprite and XY chosen on checkerboard half opaque pixels; other half for RGB holdout. Native 30fps samples not original callback/tick schedule; source gfx identity not original runtime dispatcher/actor control path. Some capture frames may be occluded by foreground.'}
(a.out/'O220_PIT_BRIDGE_ORIGINAL_14_SPRITE_MATCH.json').write_text(json.dumps(result,indent=2)+'\n')
