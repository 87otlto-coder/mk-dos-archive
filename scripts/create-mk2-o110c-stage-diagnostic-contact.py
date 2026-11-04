from PIL import Image,ImageDraw,ImageFont
import zipfile,io,os,json,sys
z=zipfile.ZipFile(sys.argv[1] if len(sys.argv)>1 else '/mnt/data/o110c_work/MK2_PACKED_STAGE_7_PARAMETERIZED_VIEWPORTS_O110C.zip');m=json.loads(z.read('MANIFEST.json'))
view=Image.new('RGB',(1050,7*150+65),(24,24,26));d=ImageDraw.Draw(view)
d.text((18,15),'MK2 packed-stage renderer • normalized palettes/cameras (NOT GAMEPLAY)',fill=(240,240,240))
d.text((18,36),'Center x=288: actual source indices, contrast-enhanced for diagnosis. Side strips: x=176 / x=400, 16 rows.',fill=(180,180,180))
for i,row in enumerate(m['rows']):
 y=60+i*150;n=row['resource'].split('.')[0];h=row['rows'];d.text((8,y+30),f'{n}\n{h} rows',fill=(255,255,255))
 for j,x in enumerate((176,288,400)):
  c=next(c for c in row['cases'] if c['x']==x and c['hypotheticalBankStart']==1)
  raw=z.read(c['outputFile']);pix=Image.frombytes('L',(320,c['height']),raw)
  # Contrast transform displayed ONLY: scale 0..80 to visible 0..255, no authentic palette.
  pix=pix.point(lambda v:min(255,int(v*3.1))).convert('RGB')
  if x==288:
   pix=pix.resize((280,round(h*1.5)),Image.Resampling.NEAREST)
   view.paste(pix,(120+j*305,y+23))
  else:
   pix=pix.resize((280,48),Image.Resampling.NEAREST)
   view.paste(pix,(120+j*305,y+23))
  d.text((120+j*305,y+5),f'x={x}, source index preview',fill=(215,215,215))
view.save(sys.argv[2] if len(sys.argv)>2 else '/mnt/data/MK2_STAGE_VIEWPORTS_O110C_DIAGNOSTIC_CONTACT.png')
