#!/usr/bin/env python3
"""O216: test original FALL 54 masked crack against original EXE-linked PIT palette.
Zero video color fitting. Video-based alpha exclusions remain bounded and declared.
"""
from pathlib import Path
import argparse,importlib.util,zipfile,cv2,numpy as np,json,hashlib,struct
ap=argparse.ArgumentParser();ap.add_argument('--game-zip',required=True,type=Path);ap.add_argument('--video',required=True,type=Path);ap.add_argument('--o210-script',required=True,type=Path);ap.add_argument('--out',required=True,type=Path);a=ap.parse_args()
assert not a.out.exists(),'Do not overwrite evidence';a.out.mkdir(parents=True)
s=importlib.util.spec_from_file_location('original',str(a.o210_script));o=importlib.util.module_from_spec(s);s.loader.exec_module(o)
with zipfile.ZipFile(a.game_zip) as z:e=z.read('mk2/mk2.exe');g=z.read('mk2/fall.gra')
assert (o.sha(e),o.sha(g),hashlib.sha256(a.video.read_bytes()).hexdigest())==(o.EXPECTED['exe'],o.EXPECTED['fall'],o.EXPECTED['video'])
src,meta=o.decode(e,g)
c=cv2.VideoCapture(str(a.video));assert c.isOpened() and c.get(cv2.CAP_PROP_FPS)==30
def f(n):
 c.set(cv2.CAP_PROP_POS_FRAMES,n);ok,v=c.read();assert ok
 return cv2.cvtColor(cv2.resize(v[25:425,10:650],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB)
Y,X=np.mgrid[:200,:320];wallidx=o.texindex(src,55,48,12);phys=0x61c54+struct.unpack_from('<I',e,0xa0c54+0x18d40)[0];assert phys==0x895ac;pal=np.zeros((82,3),dtype=float)
for i in range(1,82):
 w=struct.unpack_from('<H',e,phys+2*i)[0];d=[((w>>9)&63)|1,((w>>4)&63)|1,((w<<1)&63)|1];pal[i]=[(x<<2)|(x>>4) for x in d]
wall=np.clip(pal[wallidx],0,255).astype(np.uint8)
sp,msk=src[54];sh,sw=sp.shape;colors=np.clip(pal[sp],0,255).astype(np.uint8)
body,bm=src[47];bh,bw=bm.shape
bodymask=np.zeros((200,320),dtype=bool);bodymask[50:50+bh,117:117+bw]=bm>0
# Guard: original crack index values must be present in the source wall, even though no video palette fitting is performed.
counts=np.bincount(wallidx[o.TRAIN].ravel(),minlength=64);used=np.unique(sp[msk>0]);assert all(counts[i]>=50 for i in used),[(i,int(counts[i])) for i in used]
observations=[]
for frame in (894,900,903,904,905,909,930):
 observed=f(frame);region=(X>=55)&(X<246)&(Y>=42)&(Y<185)&~bodymask
 # Exclude bright winner text and blood, whose original bitmap/source have NOT been proven.
 white=(observed.min(axis=2)>125)&(observed.max(axis=2)-observed.min(axis=2)<45)
 red=(observed[:,:,0]>110)&(observed[:,:,0]>observed[:,:,1]*1.4)&(observed[:,:,0]>observed[:,:,2]*1.4)
 blue_text=(observed[:,:,2]>observed[:,:,0]*1.25)&(observed[:,:,2]>observed[:,:,1]*1.15)&(Y<94)&(X>=95)&(X<235)
 region &=~white&~red&~blue_text
 original_diff=np.abs(wall.astype(np.int16)-observed.astype(np.int16)).mean(axis=2)
 rows=[]
 for xx,yy in [(104,44),(104,48),(124,64),(74,44),(144,84),(94,44),(114,44),(104,54)]:
  cm=np.zeros((200,320),dtype=bool);cm[yy:yy+sh,xx:xx+sw]=msk>0
  pred=wall.copy();target=pred[yy:yy+sh,xx:xx+sw];target[msk>0]=colors[msk>0]
  before=float(original_diff[region].mean());after=float(np.abs(pred.astype('int16')-observed.astype('int16')).mean(axis=2)[region].mean())
  focus=(region&cm)
  before_focus=float(original_diff[focus].mean()) if focus.any() else None
  after_focus=float(np.abs(pred.astype('int16')-observed.astype('int16')).mean(axis=2)[focus].mean()) if focus.any() else None
  rows.append({'xy':[xx,yy],'observed_unoccluded_pixels':int(region.sum()),'source_crack_visible_pixels':int(focus.sum()),'baseline_mae':round(before,4),'composite_mae':round(after,4),'improvement':round(before-after,4),'crack_pixel_mae_before':round(before_focus,4),'crack_pixel_mae_after':round(after_focus,4)})
 observations.append({'capture_frame':frame,'sec':round(frame/30,4),'candidates':sorted(rows,key=lambda x:-x['improvement'])})
 print(frame,round(frame/30,4),[(x['xy'],x['improvement']) for x in sorted(rows,key=lambda r:-r['improvement'])])
report={'schema':'o216_exe_palette_source54_rgb_placement_controls','color_origin':'Original exe-linked PIT palette, no video color calibration; pointer at Object2 0x18d40', 'original_palette_physical':hex(phys),'crack_opaque_source_indices':used.tolist(),'original_wall_source_index_counts_at_video_calibration_mask':{str(x):int(counts[x]) for x in used},'results':observations,'confidence':'EVIDENCE FOR A STABLE ORIGINAL CRACK SPRITE54 RGB PLACEMENT; selection among bounded placements, not verified executable draw order or callback; still excludes red and title bitmaps'}
(a.out/'O216_SOURCE_PALETTE_CRACK_REPORT.json').write_text(json.dumps(report,indent=2)+'\n');c.release()
