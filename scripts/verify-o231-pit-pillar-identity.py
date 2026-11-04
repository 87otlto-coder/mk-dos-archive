import json, hashlib, zipfile, importlib.util, struct
from pathlib import Path
import cv2,numpy as np
from PIL import Image, ImageDraw
ROOT=Path('/mnt/data');
source=ROOT/'pit_investigation/results/pit_six_sources/the_pit_source_setup_2.png'
meta=ROOT/'pit_investigation/results/pit_six_sources/meta.json'
video=ROOT/'Recording 2026-10-17 151933(1).mp4'
zfile=ROOT/'mk2(2).zip'
png=np.asarray(Image.open(source).convert('RGBA'))
sgray=cv2.cvtColor(png[:,:,:3],cv2.COLOR_RGB2GRAY)
cap=cv2.VideoCapture(str(video))
arr=[];pilvideos=[]
for idx in [864,870,876]:
 cap.set(cv2.CAP_PROP_POS_FRAMES,idx); ok,fr=cap.read();assert ok
 fr=cv2.cvtColor(cv2.resize(fr[25:425,10:650],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB)
 pilvideos.append((idx,Image.fromarray(fr)))
 vg=cv2.cvtColor(fr,cv2.COLOR_RGB2GRAY)
 strip=[]
 for sx,sy,w,h in [(269,200,20,52),(270,300,19,42),(273,400,14,55)]:
  temple=sgray[sy:sy+h,sx:sx+w]
  reg=vg[70:196,170:260]
  mat=cv2.matchTemplate(reg,temple,cv2.TM_CCOEFF_NORMED)
  _,score,_,(xx,yy)=cv2.minMaxLoc(mat)
  vx=170+xx;vy=70+yy
  sc=np.array(png[sy:sy+h,sx:sx+w,:3],dtype=np.int16)
  vc=np.array(fr[vy:vy+h,vx:vx+w],dtype=np.int16)
  mae=float(np.abs(sc-vc).mean())
  alpha=(png[sy:sy+h,sx:sx+w,3]>0).mean()
  def srch_shift(dx):
   crop=vg[vy:vy+h,vx+dx:vx+dx+w];return float(np.corrcoef(temple.flatten(),crop.flatten())[0,1])
  strip.append({'source_patch': [sx,sy,w,h], 'recorded_xy':[vx,vy], 'source_to_video_xy':[vx-sx,vy-sy], 'gray_zncc':round(score,5), 'source_palette_rgb_mae255':round(mae,5),'source_opaque_fraction':round(float(alpha),5), 'horizontal_controls_zncc':{'right_plus_4':round(srch_shift(4),5),'left_minus_4':round(srch_shift(-4),5)}})
 arr.append({'frame':idx,'seconds':idx/30,'patches':strip})
cap.release()
with zipfile.ZipFile(zfile) as z:
 exe=z.read('mk2/mk2.exe');fall=z.read('mk2/fall.gra');pit=z.read('mk2/pit.gra')
spec=importlib.util.spec_from_file_location('o210','/mnt/data/pit_investigation/MK-DOS-Archive/scripts/verify-o210-pit-fatality.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
sprites,sm=m.decode(exe,fall)
p58,mask58=sprites[58]
phys=0x895ac
count=struct.unpack_from('<H',exe,phys)[0];assert count==81
pal=np.zeros((count+1,3),dtype=np.uint8)
for i in range(1,count+1):
 word=struct.unpack_from('<H',exe,phys+2*i)[0]
 dac=[((word>>9)&63)|1,((word>>4)&63)|1,((word<<1)&63)|1]
 pal[i]=[(v<<2)|(v>>4) for v in dac]
tex=Image.fromarray(pal[p58],'RGB')
assert p58.shape==(96,96)
# Image comparison layout (original source, 3 video frames, FALL 58)
fig=Image.new('RGB',(1080,365),(16,21,30));d=ImageDraw.Draw(fig)
d.text((15,11),'PIT.GRA original bridge column',fill='white')
d.text((286,11),'28.8s — recording',fill='white')
d.text((535,11),'29.0s — recording',fill='white')
d.text((784,11),'29.2s — recording',fill='white')
# source zoom is 50x150 within decoded setup. Video ROIs approximate tracked pillar center x235,218,206
layer=Image.fromarray(png).convert('RGBA')
scrop=layer.crop((252,75,306,245)); bg=Image.new('RGBA',scrop.size,(4,11,29,255));bg.alpha_composite(scrop)
fig.paste(bg.convert('RGB').resize((162,300),Image.Resampling.NEAREST),(15,43))
for n,(idx,frame) in enumerate(pilvideos):
 colx=[238,220,208][n]
 # 54px wide,150px tall video and source, centered on column
 roi=frame.crop((colx-27,42,colx+27,192)).resize((162,300),Image.Resampling.NEAREST)
 fig.paste(roi,(275+249*n,43))
img='/mnt/data/MK2_Pit_II_Pillar_Original_Source_vs_Recording.png';fig.save(img)
# Display FALL.GRA58 image separate
fallfig=Image.new('RGB',(500,240),(17,20,30));draw=ImageDraw.Draw(fallfig)
fallfig.paste(tex.resize((192,192),Image.Resampling.NEAREST),(12,35));draw.text((12,12),'FALL.GRA graphic 58 (original Pit palette)',fill='white');draw.text((225,62),'96 x 96 rocky texture',fill='white');draw.text((225,89),'Intrinsic repeat: 48 x 48',fill='white');draw.text((225,133),'Not the bridge column',fill='white');fallfig.save('/mnt/data/MK2_Pit_II_FALL_GRA58_Source_Tile.png')
report={'classification':'PIT.GRA upper-stage setup-2 column independently witnessed during pre-FALL segment','source_identity':{'pit_sha256':hashlib.sha256(pit).hexdigest(),'exe_sha256':hashlib.sha256(exe).hexdigest(),'fall_sha256':hashlib.sha256(fall).hexdigest(),'recording_sha256':hashlib.sha256(video.read_bytes()).hexdigest()},'setup2':{'source_file':'PIT.GRA','source_index':2,'full_index_canvas':[1400,768],'column_sprite_gra_offset':56728,'column_sprite_dims':[48,96],'column_repeated_placements':70},'original_fall58':{'source_file':'FALL.GRA','index':58,'dimensions':[96,96],'true_index_repeat':[48,48]},'sampled_video_matches':arr,'limitations':['Source pillar tile has repeated patterns; individual absolute vertical camera offset is ambiguous modulo 96 or shorter internal period.','Video similarity confirms source identity, but does not recover executable fatality-specific camera path.','FALL.GRA58 source selector remains an independent unresolved timing/display question.']}
with open('/mnt/data/MK2_Pit_II_Pillar_Source_Identity_Evidence.json','w') as f:json.dump(report,f,indent=2);f.write('\n')
print(json.dumps(arr,indent=2))
print('image',img)
