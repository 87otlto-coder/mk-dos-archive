#!/usr/bin/env python3
"""Independent P8 check: O210 Python decoder vs the TS-generated source ZIP.
Requires numpy/PIL/cv2 from existing legacy research environment.
Usage: python scripts/verify-mk2-p8-source-parity.py <canonical-mk2.zip> <p8-output.zip>
"""
import hashlib, importlib.util, io, json, struct, sys, zipfile
from pathlib import Path
import numpy as np
from PIL import Image
EXPECTED_EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
EXPECTED_FALL='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
def sha(x):return hashlib.sha256(x).hexdigest()
def main():
 src=Path(sys.argv[1]);export=Path(sys.argv[2]);checks=0
 with zipfile.ZipFile(src) as z:
  exe=next(z.read(n) for n in z.namelist() if n.lower().endswith('/mk2.exe'))
  fall=next(z.read(n) for n in z.namelist() if n.lower().endswith('/fall.gra'))
 assert sha(exe)==EXPECTED_EXE and sha(fall)==EXPECTED_FALL;checks+=2
 old=Path(__file__).parent/'verify-o210-pit-fatality.py'
 spec=importlib.util.spec_from_file_location('original_o210',old);o210=importlib.util.module_from_spec(spec);spec.loader.exec_module(o210)
 sprites,meta=o210.decode(exe,fall)
 assert len(sprites)==61 and len(meta)==61 and meta[-1]['graEnd']==len(fall);checks+=3
 count=struct.unpack_from('<H',exe,0x895ac)[0];assert count==81;checks+=1
 pal=np.zeros((82,3),dtype=np.uint8)
 for i in range(1,82):
  w=struct.unpack_from('<H',exe,0x895ac+2*i)[0]
  dac=[((w>>9)&63)|1,((w>>4)&63)|1,((w<<1)&63)|1]
  pal[i]=[(v<<2)|(v>>4) for v in dac]
 with zipfile.ZipFile(export) as z:
  manifest=json.loads(z.read('manifest.json'))
  assert manifest['selectorStepCount']==32 and len(manifest['sprites'])==7;checks+=2
  for item in manifest['sprites']:
   i=item['sourceSprite'];index,mask=sprites[i]
   raw_ix=z.read(item['paths']['indices']);raw_mask=z.read(item['paths']['mask'])
   assert np.array_equal(np.frombuffer(raw_ix,dtype='uint8').reshape(index.shape),index),i;checks+=1
   assert np.array_equal(np.frombuffer(raw_mask,dtype='uint8').reshape(mask.shape),(mask>0).astype('uint8')),i;checks+=1
   actual=np.array(Image.open(io.BytesIO(z.read(item['paths']['png']))).convert('RGBA'))
   expected=np.zeros((index.shape[0],index.shape[1],4),dtype='uint8')
   expected[:,:,:3]=pal[index];expected[:,:,3]=mask
   assert np.array_equal(actual,expected),i;checks+=1
   assert item['originalPackedGraOffset']==meta[i]['graStart'] and item['originalEncodedEndExclusive']==meta[i]['graEnd'];checks+=1
  for i in range(32):
   assert manifest['originalSelectorSteps'][i]['originalSprite']==55+exe[0xb4d84+i];checks+=1
 print(json.dumps({'status':'PASS','independent':'O210 original Python 61-sprite decoder','checks':checks,
  'sourceSprites':7,'exactIndexMaskRgbaParity':True,'sourceSelectorSteps':32,
  'sourcePaletteIsRuntimeDACObserved':False},indent=2))
if __name__=='__main__':main()
