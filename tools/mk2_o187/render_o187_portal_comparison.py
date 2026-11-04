#!/usr/bin/env python3
"""Re-render the O187 comparison from user video and original O177 source archive.
Requires opencv-python, numpy and Pillow; source/output binaries not bundled.
"""
import argparse,io,json,zipfile
from pathlib import Path
import cv2,numpy as np
from PIL import Image,ImageDraw,ImageFont

def main():
 p=argparse.ArgumentParser();p.add_argument('--video',type=Path,required=True);p.add_argument('--frames-zip',type=Path,required=True);p.add_argument('--report',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 if a.out.exists():p.error('Refuse to overwrite image')
 r=json.loads(a.report.read_text())
 z=zipfile.ZipFile(a.frames_zip);manifest=json.loads(z.read('manifest.json'))
 source=next(t for t in manifest['tracks'] if t['name']=='portal_swaying')['frames']
 cap=cv2.VideoCapture(str(a.video))
 try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',19);small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
 except OSError:font=ImageFont.load_default();small=font
 w=900;h=7*155+90
 im=Image.new('RGB',(w,h),(16,19,27));dr=ImageDraw.Draw(im)
 dr.text((25,14),'O187 · Source-verified Portal swaying poses in recorded gameplay',font=font,fill='#f3f5fa')
 dr.text((25,43),'Left: source-palette sprite with index remap 54→63, 55→64   Right: user capture, 2× on-screen pixels',font=small,fill='#adbece')
 # Source palette candidate from original electric sequence; runtime-selection is observed visually, not proven from capture.
 e=next(t for t in manifest['tracks'] if t['name']=='portal_electric')['frames'][0]
 e_idx=np.frombuffer(z.read(e['paths']['indexedPixels']),np.uint8)
 e_rgba=np.array(Image.open(io.BytesIO(z.read(e['paths']['rgbaPng']))).convert('RGBA')).reshape(-1,4)
 rgb={int(index):tuple(map(int,e_rgba[np.where(e_idx==index)[0][0]][:3])) for index in [63,64]}
 for row,o in enumerate(r['observations']):
  f=source[o['expectedSourceFrameOrdinal']];y0=90+row*155
  pbytes=z.read(f['paths']['indexedPixels']);a_index=np.frombuffer(pbytes,np.uint8).reshape(f['height'],f['width'])
  sprite=Image.open(io.BytesIO(z.read(f['paths']['rgbaPng']))).convert('RGBA')
  pix=np.array(sprite)
  for source_ind,new_ind in [(54,63),(55,64)]:pix[(a_index==source_ind)&(pix[:,:,3]!=0),:3]=rgb[new_ind]
  sp=Image.fromarray(pix,'RGBA').resize((f['width']*2,f['height']*2),Image.Resampling.NEAREST)
  back=Image.new('RGBA',sp.size,(37,21,31,255));back.alpha_composite(sp)
  im.paste(back.convert('RGB'),(280,y0+6))
  sec=o['captureSecond'];cap.set(cv2.CAP_PROP_POS_FRAMES,o['captureFrameNumberZeroBased']);ok,frame=cap.read();assert ok
  x,y=o['topMatch']['screenTopLeftXY'];sh,sw=sp.height,sp.width
  crop=frame[y:y+sh,x:x+sw];assert crop.shape[:2]==(sh,sw)
  im.paste(Image.fromarray(cv2.cvtColor(crop,cv2.COLOR_BGR2RGB)),(595,y0+6))
  dr.text((25,y0+12),f"Pose {o['expectedSourceFrameOrdinal']:02d}",font=font,fill='#ffffff')
  dr.text((25,y0+43),f"t={sec:.2f}s",font=small,fill='#9cafc4')
  dr.text((25,y0+65),f"F1={o['topMatch']['score']:.3f}",font=small,fill='#c5e4ff')
  dr.text((25,y0+83),f"margin={o['marginToSecond']:.3f}",font=small,fill='#9cafc4')
  if row<6:dr.line((25,y0+145,w-25,y0+145),fill='#3c4555')
 dr.text((25,h-20),'Sampling proves seven source poses, not native FPS, per-pose duration, or file hashes on the user machine.',font=small,fill='#adbece')
 im.save(a.out,optimize=True)
 cap.release()
 print(a.out, a.out.stat().st_size)
if __name__=='__main__':main()
