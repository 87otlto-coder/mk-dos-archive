#!/usr/bin/env python3
"""O215: Source-original PIT palette + O214 texture selection unlocks falling-figure silhouettes.
This tests captured frame identities, not the game scheduler. Read-only, input hashes pinned.
"""
import argparse,hashlib,importlib.util,json,struct,zipfile
from pathlib import Path
import cv2,numpy as np
ap=argparse.ArgumentParser();ap.add_argument('--game-zip',required=True,type=Path);ap.add_argument('--video',required=True,type=Path);ap.add_argument('--o210-script',required=True,type=Path);ap.add_argument('--o214-report',required=True,type=Path);ap.add_argument('--out',required=True,type=Path);a=ap.parse_args()
assert not a.out.exists(),'Evidence output already exists; refusing overwrite';a.out.mkdir(parents=True)
s=importlib.util.spec_from_file_location('o210',str(a.o210_script));m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
with zipfile.ZipFile(a.game_zip) as z:e=z.read('mk2/mk2.exe');g=z.read('mk2/fall.gra')
vhash=hashlib.sha256(a.video.read_bytes()).hexdigest();assert (m.sha(e),m.sha(g),vhash)==(m.EXPECTED['exe'],m.EXPECTED['fall'],m.EXPECTED['video'])
source,meta=m.decode(e,g)
report=json.loads(a.o214_report.read_text());assert report['input_hashes']=={'exe':m.sha(e),'fall':m.sha(g),'video':vhash}
rows={r['capture_frame']:r for r in report['rows']}
ptr=struct.unpack_from('<I',e,0xa0c54+0x18d40)[0];phys=0x61c54+ptr;assert phys==0x895ac
pal=np.zeros((82,3),dtype=float)
for k in range(1,82):
 w=struct.unpack_from('<H',e,phys+2*k)[0];d=[((w>>9)&63)|1,((w>>4)&63)|1,((w<<1)&63)|1];pal[k]=[(v<<2)|(v>>4) for v in d]
cap=cv2.VideoCapture(str(a.video));assert cap.isOpened() and cap.get(cv2.CAP_PROP_FPS)==30
out=[]
for f in sorted(rows):
 if f>900:continue
 cap.set(cv2.CAP_PROP_POS_FRAMES,f);ok,im=cap.read();assert ok and im.shape[:2]==(430,660)
 rgb=cv2.cvtColor(cv2.resize(im[25:425,10:650],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB)
 row=rows[f]['selected_on_training_patch'];idx=row['original_sprite'];x,y=row['phase_xy'];Y,X=np.mgrid[:200,:320];pix=source[idx][0];h,w=pix.shape
 bg=np.clip(pal[pix[(Y-y)%h,(X-x)%w]],0,255).astype('uint8')
 ranked=m.silhouette_rank(source,rgb,bg,topn=4)
 out.append({'capture_frame':f,'second':round(f/30,5),'background_source':idx,'background_phase':[x,y], 'top_source_pose':ranked[0], 'runners_up':ranked[1:]})
cap.release();result={'schema':'O215_original_lower_fall_pose_timeline','inputs_sha256':report['input_hashes'],'palette_origin':'original PIT 81 color exe-linked record','pose_source':'FALL.GRA graphics 0-53','limitations':['Thresholded silhouettes compared to source-authenticated graphics; native capture sampled at 30fps, not original tick timing','Red effects and title contaminate last few frames','Independent executable dispatch or draw callback not proven'],'records':out}
(a.out/'O215_FALL_POSE_TIMELINE.json').write_text(json.dumps(result,indent=2)+'\n')
for r in out:print(f"{r['capture_frame']}  bg {r['background_source']}  pose {r['top_source_pose']['spriteID']}   F1 {r['top_source_pose']['f1']:.4f}  xy {r['top_source_pose']['sourceXY']}")
