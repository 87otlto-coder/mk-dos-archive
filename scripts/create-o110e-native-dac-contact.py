from PIL import Image,ImageDraw
from pathlib import Path
import zipfile,io
z=zipfile.ZipFile('/mnt/data/o110c_work/MK2_PROBE_ACCLAIM_SOURCE_DAC6_PALETTES_O110E.zip')
w,h=5*264,6*183
sheet=Image.new('RGB',(w,h),(23,23,26));draw=ImageDraw.Draw(sheet)
for i in range(30):
 b=z.read(f'probe/frames/{i:03d}.INDEX0_BLACK_ONLY_PREVIEW.png')
 frame=Image.open(io.BytesIO(b)).convert('RGB').resize((256,160),Image.Resampling.NEAREST)
 x=(i%5)*264+4;y=(i//5)*183+4
 sheet.paste(frame,(x,y));draw.text((x+5,y+161),f'Probe frame {i:02}',fill=(212,212,212))
p=Path('/mnt/data/MK2_PROBE_30_FRAMES_SOURCE_DAC6_CONDITIONAL_CONTACT_O110E.png');sheet.save(p);print(p,p.stat().st_size)
