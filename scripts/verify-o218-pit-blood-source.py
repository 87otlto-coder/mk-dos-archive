#!/usr/bin/env python3
"""O218: bounded original BLOOD.GRA sprite177 pixel/color witness at repeated post-impact blobs.
RGB mapping learned on ONE visible blood blob and tested on FOUR OTHER blobs. Geometry and
source index pixels decode from verified EXE descriptor/source GRA; not original DAC trace.
"""
import argparse,hashlib,json,struct,zipfile
from pathlib import Path
import cv2,numpy as np
from PIL import Image,ImageDraw
ap=argparse.ArgumentParser();ap.add_argument('--game-zip',required=True,type=Path);ap.add_argument('--video',required=True,type=Path);ap.add_argument('--out',required=True,type=Path);a=ap.parse_args()
assert not a.out.exists(),'Evidence output exists';a.out.mkdir(parents=True)
with zipfile.ZipFile(a.game_zip) as z:exe=z.read('mk2/mk2.exe');blood=z.read('mk2/blood.gra')
expected={'exe':'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','video':'198b5ecccb1cca898e4da7ba1282104fac71c2e3bc8a6009638420deb9dede48','blood':'9a47dd926c27a6570bcd81cbb0a3ff1bae2106a26e0f5360c8018fea6f16a5a9'}
actual={'exe':hashlib.sha256(exe).hexdigest(),'video':hashlib.sha256(a.video.read_bytes()).hexdigest(),'blood':hashlib.sha256(blood).hexdigest()}
if actual['blood']!=expected['blood']:print('actual blood sha',actual['blood']);raise AssertionError('Update only after independently verifying canonical BLOOD.GRA SHA')
assert actual==expected
w,h,x,y=struct.unpack_from('<HHhh',exe,0xC1350);pack=struct.unpack_from('<I',exe,0xC1358)[0];rid=pack>>24;start=pack&0xffffff
assert (w,h,x,y,rid,start,len(blood))==(14,9,7,3,9,111552,111780)
p=np.zeros((h,w),np.uint8);m=np.zeros((h,w),np.uint8);at=start;commands=[]
for y0 in range(h):
 xx=0
 while xx<w:
  cmd=struct.unpack_from('<I',blood,at)[0];at+=4
  if cmd&1:mode='skip';n=cmd>>1
  elif cmd&2:mode='repeat';n=cmd>>10;p[y0,xx:xx+n]=(cmd>>2)&255;m[y0,xx:xx+n]=1
  else:mode='literal';n=cmd>>2;p[y0,xx:xx+n]=np.frombuffer(blood,dtype=np.uint8,count=n,offset=at);m[y0,xx:xx+n]=1;at+=(n+3)&~3
  assert 0<n<=w-xx;(commands.append(mode));xx+=n
assert at==len(blood) and int(m.sum())==73
used=sorted(set(p[m>0].tolist()));print('unique source blood indices',used,'commands',len(commands))
cap=cv2.VideoCapture(str(a.video));assert cap.isOpened() and cap.get(cv2.CAP_PROP_FPS)==30
def frame(f):
 cap.set(cv2.CAP_PROP_POS_FRAMES,f);ok,im=cap.read();assert ok
 return cv2.cvtColor(cv2.resize(im[25:425,10:650],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB)
train_frame=930;im=frame(train_frame);trainxy=(108,80)
region=im[trainxy[1]:trainxy[1]+h,trainxy[0]:trainxy[0]+w]
lut=np.zeros((64,3),float);counts={}
for v in used:
 pixels=region[(p==v)&(m>0)].astype(float);assert len(pixels)>0;counts[str(v)]=len(pixels);lut[v]=np.mean(pixels,axis=0)
pred=lut[p]
items=[('train',trainxy),('holdout_a',(180,80)),('holdout_b',(198,116)),('holdout_c',(204,140)),('holdout_d',(108,140))]
rows=[]
for f in (903,909,930):
 video=frame(f)
 for label,(bx,by) in items:
  clip=video[by:by+h,bx:bx+w].astype(float)
  valmask=(m>0);base=float(np.abs(clip[valmask]-pred[valmask]).mean())
  shifted=video[by:by+h,bx+2:bx+2+w].astype(float)
  sh_err=float(np.abs(shifted[valmask]-pred[valmask]).mean())
  base_l2=float(np.square(clip[valmask]-pred[valmask]).mean())
  redmask=(clip[:,:,0]>110)&(clip[:,:,0]>clip[:,:,1]*1.4)&(clip[:,:,0]>clip[:,:,2]*1.4)
  tp=int((redmask&valmask).sum());prec=tp/max(1,int(valmask.sum()));recall=tp/max(1,int(redmask.sum()));f1=2*prec*recall/(prec+recall) if prec+recall else 0
  rows.append({'frame':f,'blob':label,'xy':[bx,by],'source_mask_pixels':int(valmask.sum()),'source_rgb_mae255':round(base,5),'shift_plus2_rgb_mae255':round(sh_err,5),'rgb_mean_square_error':round(base_l2,5),'red_threshold_overlap_f1':round(f1,5)})
cap.release()
report={'schema':'o218_blood177_bounded_source_rgb_reuse','original_descriptor_physical':'0xC1350','original_resource_id':rid,'original_source_name':'BLOOD.GRA','gra_offset':start,'sprite_size':[w,h],'opaque_pixels':int(m.sum()),'original_index_values':used,'train_blob_pixel_counts_by_source_index':counts,'trained_at':{'capture_frame':930,'xy':list(trainxy)},'source_color_lut_video_fit_only':{str(v):[round(float(a),2) for a in lut[v]] for v in used},'input_sha256':actual,'holdout_samples':rows,'limits':['Input BGR video capture converted to RGB native 320x200','Color LUT fitted on one captured source blob; not original EXE/DAC palette','Foreground red threshold may exclude anti-aliased pixels','Original BLOOD.GRA has 178 fully decoded sources in inherited O69 census, but only source177 tested','A recurring image source is not proof of original emission state machine or sprite batching']}
(a.out/'O218_BLOOD177_SOURCE_VIDEO_REPORT.json').write_text(json.dumps(report,indent=2)+'\n')
for row in rows:print(row['frame'],row['blob'],'mae',row['source_rgb_mae255'],'shift+',row['shift_plus2_rgb_mae255'],'maskF1',row['red_threshold_overlap_f1'])
