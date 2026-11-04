#!/usr/bin/env python3
"""O210: Source-to-DOS-video verification of MK2 Pit II fatality lower scene.

Read-only. No game executables modified or distributed.
Requires numpy, pillow, opencv-python and user's original MK2 archive + recording.
This is a visual-source match, NOT a complete recovered camera/disptacher program.
"""
from __future__ import annotations
import argparse, collections, csv, hashlib, json, struct, zipfile
from pathlib import Path
import cv2
import numpy as np
from PIL import Image,ImageDraw

EXPECTED={
 'exe':'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',
 'fall':'60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0',
 'video':'198b5ecccb1cca898e4da7ba1282104fac71c2e3bc8a6009638420deb9dede48',
}
def sha(data):return hashlib.sha256(data).hexdigest()
def u32(a,i):return struct.unpack_from('<I',a,i)[0]
def source_descriptor_offset(i):return 0xC39B8+12*i if i<54 else 0xC3C40+16*(i-54)
def decode(exe,gra):
 assert len(gra)==250804
 out={};meta=[]
 for i in range(61):
  d=source_descriptor_offset(i);w,h,x,y=struct.unpack_from('<HHhh',exe,d);packed=u32(exe,d+8)
  start=packed&0xffffff;rid=packed>>24
  assert rid==123 and 1<=w<=160 and 1<=h<=140,(i,packed,w,h)
  p=np.zeros((h,w),dtype=np.uint8);m=np.zeros((h,w),dtype=np.uint8);at=start
  for ry in range(h):
   xx=0
   while xx<w:
    assert at+4<=len(gra)
    cmd=u32(gra,at);at+=4
    if cmd&1:n=cmd>>1
    elif cmd&2:
     n=cmd>>10;p[ry,xx:xx+n]=(cmd>>2)&255;m[ry,xx:xx+n]=255
    else:
     n=cmd>>2;assert at+n<=len(gra)
     p[ry,xx:xx+n]=np.frombuffer(gra,dtype=np.uint8,count=n,offset=at)
     m[ry,xx:xx+n]=255;at+=(n+3)&~3
    assert 0<n<=w-xx,(i,ry,xx,cmd,n)
    xx+=n
  meta.append({'index':i,'descriptorPhysical':hex(d),'resourceID':rid,'graStart':start,'graEnd':at,'width':w,'height':h,'x':x,'y':y,'alphaPixels':int((m>0).sum())})
  out[i]=(p,m)
 for i,row in enumerate(meta):
  assert row['graStart']==(0 if i==0 else meta[i-1]['graEnd']),(i,'tiling gap')
 assert meta[-1]['graEnd']==len(gra),'not fully tiled'
 return out,meta

def native(video,t):
 video.set(cv2.CAP_PROP_POS_MSEC,round(t*1000));ok,frame=video.read()
 assert ok and frame.shape[:2]==(430,660),(t,frame.shape if ok else None)
 return cv2.cvtColor(cv2.resize(frame[25:425,10:650],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB)
Y,X=np.mgrid[:200,:320]
SAFE=((((X>=13)&(X<=95))|((X>=224)&(X<=309)))&(Y>=40)&(Y<190))
TRAIN=SAFE&((X+Y)%2==0);TEST=SAFE&~((X+Y)%2==0)
def texindex(src,i,x0,y0):
 p,_=src[i];h,w=p.shape
 return p[(Y-y0)%h,(X-x0)%w]
def fitted_colors(ix,video,train=TRAIN):
 lut=np.zeros((64,3),dtype=float)
 ind=ix[train];rgb=video[train].astype(float);counts=np.bincount(ind,minlength=64)
 for c in range(3):
  sums=np.bincount(ind,weights=rgb[:,c],minlength=64)
  lut[:,c]=np.divide(sums,counts,out=np.zeros(64),where=counts>0)
 return lut
def r2_color(pred,observed,mask):
 p=pred[mask].astype(float);v=observed[mask].astype(float)
 residual=float(((p-v)**2).mean());var=float(((v-v.mean(axis=0))**2).mean())
 return {'mae255':round(float(np.abs(p-v).mean()),5),'rgbR2':round(1-residual/var,6),'pixels':len(v)}
def silhouette_rank(sources,frame,bg,topn=4):
 delta=np.abs(frame.astype('i2')-bg.astype('i2')).max(axis=2)
 fg=(delta>40).astype('uint8');fg[:,:90]=0;fg[:,230:]=0
 results=[]
 for i in range(54):
  _,mask=sources[i];tmp=(mask>0).astype('uint8')
  votes=cv2.matchTemplate(fg,tmp,cv2.TM_CCORR)
  votes[:15,:]=0;votes[:,:100]=0;votes[:,185:]=0
  _,matches,_,(x,y)=cv2.minMaxLoc(votes)
  score=2*matches/(float(tmp.sum())+float(fg.sum()))
  results.append({'spriteID':i,'f1':round(score,6),'sourceXY':[x,y],
                  'matchedForegroundPixels':int(matches),'allObservedForegroundPixels':int(fg.sum())})
 return sorted(results,key=lambda a:-a['f1'])[:topn]
def color_pose(sources,frame,pose,x,y):
 p,m=sources[pose];h,w=p.shape
 crop=frame[y:y+h,x:x+w];alpha=m>0;ys,xs=np.mgrid[:h,:w]
 train=alpha&((xs+ys)%2==0);test=alpha&~((xs+ys)%2==0)
 ix=p//4 # SOURCE decoder indexes are 0..63 (not 4x); corrected below
 return ix

def main():
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--game-zip',required=True,type=Path)
 ap.add_argument('--video',required=True,type=Path)
 ap.add_argument('--out',required=True,type=Path)
 args=ap.parse_args();out=args.out
 if out.exists():raise SystemExit('Refusing to overwrite evidence directory: '+str(out))
 out.mkdir(parents=True)
 with zipfile.ZipFile(args.game_zip) as z:
  exe=z.read('mk2/mk2.exe');gra=z.read('mk2/fall.gra')
 vh=hashlib.file_digest(open(args.video,'rb'),'sha256').hexdigest()
 actual={'exe':sha(exe),'fall':sha(gra),'video':vh}
 if actual!=EXPECTED:raise ValueError('Input SHA256 mismatch: '+str(actual))
 sprites,meta=decode(exe,gra)
 (out/'original_fall_descriptor_census.json').write_text(json.dumps(meta,indent=2)+'\n')
 v=cv2.VideoCapture(str(args.video));assert v.isOpened()
 f295=native(v,29.5);f31=native(v,31.0);f298=native(v,29.8)
 ix55=texindex(sprites,55,48,12);ix60=texindex(sprites,60,0,16)
 pal55=fitted_colors(ix55,f31);pal60=fitted_colors(ix60,f295)
 bg55=np.clip(pal55[ix55],0,255).astype('uint8');bg60=np.clip(pal60[ix60],0,255).astype('uint8')
 # Derive phase-specific source matches in held-out pixels, never call palette source-executable.
 wall_score=r2_color(bg55,f31,TEST);transition_score=r2_color(bg60,f295,TEST)
 pose_rows={}
 for t,bgidx,x0,y0 in [(29.3,60,0,16),(29.4,60,0,16),(29.5,60,0,16),(29.8,55,48,16)]:
  fr=native(v,t);ind=texindex(sprites,bgidx,x0,y0);colors=pal60 if bgidx==60 else pal55
  bg=np.clip(colors[ind],0,255).astype('uint8')
  pose_rows[str(t)]=silhouette_rank(sprites,fr,bg)
 assert [pose_rows[str(t)][0]['spriteID'] for t in (29.3,29.4,29.5,29.8)]==[42,44,46,42]
 assert pose_rows['29.8'][0]['f1']>.94
 # The indexed source sprite 42 matches RGB colors at exactly (133,63), tested on held-out alternate pixels.
 sp,sm=sprites[42];sx,sy=133,63;h,w=sp.shape;observed=f298[sy:sy+h,sx:sx+w]
 gy,gx=np.mgrid[:h,:w];valid=(sm>0);train=valid&((gy+gx)%2==0);test=valid&((gy+gx)%2==1)
 chars=fitted_colors(sp,observed,train)
 char_pred=np.clip(chars[sp],0,255).astype('uint8')
 color_score=r2_color(char_pred,observed,test)
 # Video-control test: original sprite42 shifted 5 px or an alternative source pose is not a credible fit.
 def control(sprite,xx,yy):
  im,alpha=sprites[sprite];hh,ww=im.shape;vcut=f298[yy:yy+hh,xx:xx+ww]
  Y2,X2=np.mgrid[:hh,:ww];a=alpha>0;training=a&((Y2+X2)%2==0);testing=a&~((Y2+X2)%2==0)
  colors=fitted_colors(im,vcut,training)
  return r2_color(np.clip(colors[im],0,255).astype('uint8'),vcut,testing)
 controls={'sprite42_correct':color_score,'sprite42_right_plus5':control(42,138,63),
           'sprite42_down_plus5':control(42,133,68),'sprite43_alternative':control(43,130,70)}
 assert color_score['rgbR2']>.95 and controls['sprite42_right_plus5']['rgbR2']<.3
 # Apply same video-learned fighter palette to original independently decoded final-impact sprite47.
 render_samples=[]
 for t,bg_i,bx,by,spid,px,py in [(29.5,60,0,16,46,129,69),(29.8,55,48,16,42,133,63),(31.,55,48,12,47,117,50)]:
  fr=native(v,t);base=np.clip((pal60 if bg_i==60 else pal55)[texindex(sprites,bg_i,bx,by)],0,255).astype('uint8')
  pp,pm=sprites[spid];ph,pw=pp.shape
  rgba=np.zeros((ph,pw,4),dtype='uint8');rgba[:,:,:3]=np.clip(chars[pp],0,255).astype('uint8');rgba[:,:,3]=pm
  im=Image.fromarray(base,'RGB').convert('RGBA');im.alpha_composite(Image.fromarray(rgba,'RGBA'),(px,py))
  rendered=np.asarray(im.convert('RGB'));mae=round(float(np.abs(rendered.astype('int16')-fr.astype('int16')).mean()),6)
  comparison=Image.new('RGB',(960,236),(16,22,32));d=ImageDraw.Draw(comparison)
  delta=np.uint8(np.clip(np.abs(rendered.astype('int16')-fr.astype('int16'))*3,0,255))
  for j,(shot,text) in enumerate([(fr,'Original DOS video'),(rendered,'FALL.GRA tile + source pose; colors video-calibrated'),(delta,'RGB difference x3')]):
   comparison.paste(Image.fromarray(shot),(j*320,24));d.text((j*320+3,4),text,fill='white')
  name=f'o210_original_source_vs_runtime_{t:.1f}s.png';comparison.save(out/name)
  render_samples.append({'time':t,'sourceBackground':bg_i,'sourceCharacterPose':spid,'video_calibratedXY':[px,py],
                         'fullFrameMAE255':mae,'comparison':name})
 # Sampled transition distinction against a fixed-model control: accurate except changing modes around 29.6-29.7.
 transition=[]
 for ti in range(293,306):
  t=ti/10;fr=native(v,t);value={}
  for bg_i,bx,pal in [(55,48,pal55),(60,0,pal60)]:
   best=min((float(np.abs(fr[TEST].astype('float32')-pal[texindex(sprites,bg_i,bx,dy)][TEST]).mean()),dy) for dy in range(96))
   value[bg_i]=best
  transition.append({'t':t,'tile60BestMAE':round(value[60][0],5),'tile60PhaseY':value[60][1],
                     'tile55BestMAE':round(value[55][0],5),'tile55PhaseY':value[55][1]})
 report={
  'checkpoint':'O210', 'role':'independently reproduced visual-source witness, NOT verified DOS renderer/disptacher',
  'inputsSHA256':actual,'sourceResource':'FALL.GRA','originalResourceID':123,'spritesDecoded':61,
  'allEncodedBytesAccountedFor':len(gra),'descriptorPhysicalWindows':['0xC39B8..0xC3C34/12byte','0xC3C40..0xC3CA0/16byte'],
  'nativeViewportFromCapture':[10,25,640,400],'nativeResolution':[320,200],
  'wallSprite55':wall_score,'transitionSprite60':transition_score,
  'silhouetteLeadingPoses':pose_rows,'pose42PixelControl':controls,
  'fullFrameOriginalGraphicsCompositions':render_samples,'backgroundTransitionSampled':transition,
  'caveats':['FALL.GRA includes additional sprite/effect candidates not runtime-proven; e.g. source frame54 crack position/mode unresolved.',
   'Video-derived palette lookup is not the executable palette or verified DAC state.',
   'Foreground fighter, blood, win text and effects can obscure background and pixels.',
   'The original camera equation, fatality dispatcher, precise cadence, impact effects, audio timing, and upper-scene draw order are not proven by this checkpoint.',
   'Video source is the uploaded direct DOSBox session; no hotkey use is inferred.']
 }
 assert 61==len(meta) and report['fullFrameOriginalGraphicsCompositions'][1]['fullFrameMAE255']<5
 (out/'O210_SOURCE_VIDEO_REPORT.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'decodedSprites':61,'wallR2':wall_score['rgbR2'],'transitionR2':transition_score['rgbR2'],
   'fallingPoseRGB_R2':color_score['rgbR2'],'29p8FullSceneMae':render_samples[1]['fullFrameMAE255'],'out':str(out)},indent=2))
 v.release()
if __name__=='__main__':main()
