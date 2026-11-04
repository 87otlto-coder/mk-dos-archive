#!/usr/bin/env python3
"""O219 read-only source-palette control for original BLOOD.GRA sprite 177 on Pit II impact.
Source original 48-color record was independently recovered in earlier O110 palette work.
Strong visual compatibility does NOT by itself prove actual runtime palette handle ownership.
"""
import argparse,json,hashlib,struct,zipfile
from pathlib import Path
import cv2,numpy as np
A=argparse.ArgumentParser();A.add_argument('--game-zip',required=True,type=Path);A.add_argument('--video',required=True,type=Path);A.add_argument('--o218-report',required=True,type=Path);A.add_argument('--out',required=True,type=Path);a=A.parse_args()
assert not a.out.exists(),'Refusing overwrite';a.out.mkdir(parents=True)
with zipfile.ZipFile(a.game_zip) as z:exe=z.read('mk2/mk2.exe');blood=z.read('mk2/blood.gra')
actual={'exe':hashlib.sha256(exe).hexdigest(),'video':hashlib.sha256(a.video.read_bytes()).hexdigest(),'blood':hashlib.sha256(blood).hexdigest()}
assert actual=={'exe':'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','video':'198b5ecccb1cca898e4da7ba1282104fac71c2e3bc8a6009638420deb9dede48','blood':'9a47dd926c27a6570bcd81cbb0a3ff1bae2106a26e0f5360c8018fea6f16a5a9'}
previous=json.loads(a.o218_report.read_text());assert previous['input_sha256']==actual
w,h,x,y=struct.unpack_from('<HHhh',exe,0xC1350);packed=struct.unpack_from('<I',exe,0xC1358)[0];assert (w,h,x,y,packed>>24,packed&0xffffff)==(14,9,7,3,9,111552)
p=np.zeros((h,w),np.uint8);m=np.zeros((h,w),bool);at=packed&0xffffff
for row in range(h):
 col=0
 while col<w:
  cmd=struct.unpack_from('<I',blood,at)[0];at+=4
  if cmd&1:n=cmd>>1
  elif cmd&2:n=cmd>>10;p[row,col:col+n]=(cmd>>2)&255;m[row,col:col+n]=1
  else:n=cmd>>2;p[row,col:col+n]=np.frombuffer(blood,dtype=np.uint8,count=n,offset=at);m[row,col:col+n]=1;at+=(n+3)&~3
  assert 0<n<=w-col;col+=n
assert at==len(blood) and int(m.sum())==73
cap=cv2.VideoCapture(str(a.video));cap.set(cv2.CAP_PROP_POS_FRAMES,930);ok,f=cap.read();assert ok and f.shape[:2]==(430,660)
video=cv2.cvtColor(cv2.resize(f[25:425,10:650],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB);cap.release()
def colors(pos,count):
 assert struct.unpack_from('<H',exe,pos)[0]==count
 colors=np.zeros((count+1,3),np.uint8)
 for i in range(1,count+1):
  v=struct.unpack_from('<H',exe,pos+2*i)[0];d=[((v>>9)&63)|1,((v>>4)&63)|1,((v<<1)&63)|1]
  colors[i]=[(u<<2)|(u>>4) for u in d]
 return colors
points=[('train_one_blood_blob',[108,80]),('holdout_a',[180,80]),('holdout_b',[198,116]),('holdout_c',[204,140]),('holdout_d',[108,140])]
records=[]
for label,paloff,n in [('exe_48_record_a',0x88918,48),('exe_48_record_b',0x8897a,48),('exe_48_record_c',0x889dc,48),('wrong_stage_pit_81_palette',0x895ac,81)]:
 cc=colors(paloff,n);pred=cc[p];rows=[]
 for name,(xx,yy) in points:
  captured=video[yy:yy+h,xx:xx+w]
  mae=float(np.abs(captured[m].astype('int16')-pred[m].astype('int16')).mean())
  rows.append({'blob':name,'xy':[xx,yy],'source_mask_rgb_mae255':round(mae,5)})
 records.append({'palette_role_label':label,'physical_record_offset':hex(paloff),'color_count':n,'samples':rows,'mean_mae255':round(float(np.mean([t['source_mask_rgb_mae255'] for t in rows])),5)})
assert records[0]['mean_mae255']<13 and records[3]['mean_mae255']>60
summary={'schema':'O219_original_blood_palette_candidate_controls','original_exe_blood_resource_id':9,'original_exe_blood_sprite_descriptor':'0xC1350','original_blood_sprite_index':177,'original_blood_source_offset':111552,'original_48_color_record_offsets':['0x88918','0x8897a','0x889dc'],'fixture_sha256':actual,'sampled_video_capture_frame':930,'compared_source_palette_records':records,'assessment':'Source-linked blood sprite and color-consistent 48-entry original EXE palette family; palette callsite lifecycle, actual resident register bank and callback timing not proven. Triple source candidate same scores on source indices 36-48.'}
(a.out/'O219_BLOOD177_ORIGINAL_PALETTE_CONTROLS.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({'palette_comparisons':[(r['palette_role_label'],r['mean_mae255']) for r in records]},indent=2))
