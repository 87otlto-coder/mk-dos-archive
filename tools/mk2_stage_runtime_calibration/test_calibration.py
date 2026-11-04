import sys,unittest,zipfile
from pathlib import Path
from collections import Counter
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
from calibration import *
ORIGINAL=Path('/mnt/data/mk2.zip')
class CalibrationTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  if not ORIGINAL.exists():raise unittest.SkipTest('canonical mk2.zip unavailable')
  with zipfile.ZipFile(ORIGINAL) as z:
   cls.src={n:z.read('mk2/'+n) for n in RESOURCES}
   cls.exe=z.read('mk2/mk2.exe')
 def test_debruijn_unique_windows(self):
  for k in (1,2,3,4,5,6,7):
   b=debruijn_binary(k)
   self.assertEqual(len(b),2**k)
   self.assertEqual(len({tuple(b[(s+i)%len(b)] for i in range(k)) for s in range(len(b))}),len(b))
 def test_full_ruler_cells(self):
  self.assertEqual(32*CELL_WIDTH,STRIDE)
  self.assertEqual(len(source_column_codes()),32)
 def test_original_cheat_patch_and_reverse(self):
  exe=cheat_exe(self.exe)
  self.assertEqual(exe[:CHEAT_OFFSET],self.exe[:CHEAT_OFFSET])
  self.assertEqual(exe[CHEAT_OFFSET+11:],self.exe[CHEAT_OFFSET+11:])
  self.assertEqual(exe[:CHEAT_OFFSET]+CHEAT_BEFORE+exe[CHEAT_OFFSET+11:],self.exe)
 def test_noncanonical_rejected(self):
  bad=bytearray(self.exe);bad[500]^=1
  with self.assertRaises(ValueError):cheat_exe(bytes(bad))
 def test_patterns_all_stages(self):
  for name,src in self.src.items():
   for mode in ('x-ruler','y-ruler','ramp'):
    with self.subTest(name=name,mode=mode):
     patched,d=pattern_plane(name,src,mode)
     offset=d['packedOffset'];rows=d['rows']
     self.assertEqual(patched[:offset],src[:offset]);self.assertEqual(len(patched),len(src))
     self.assertEqual(len(patched[offset:]),rows*STRIDE)
     self.assertEqual(d['originalSha256'],sha(src))
     self.assertEqual(d['patchedSha256'],sha(patched))
     self.assertGreater(d['changedBytes'],0)
 def test_ruler_bit_cells(self):
  for name,src in self.src.items():
   patched,d=pattern_plane(name,src,'x-ruler');plane=patched[d['packedOffset']:];bits=debruijn_binary(5)
   low,hi=d['indexDomain']
   for i in range(32):
    block=plane[i*CELL_WIDTH:(i+1)*CELL_WIDTH]
    self.assertEqual(block,bytes([hi if bits[i] else low])*CELL_WIDTH)
 def test_row_ruler_bits(self):
  for name,src in self.src.items():
   patched,d=pattern_plane(name,src,'y-ruler');plane=patched[d['packedOffset']:];bits=debruijn_binary(6)
   low,hi=d['indexDomain']
   for y in range(d['rows']):self.assertEqual(plane[y*STRIDE:y*STRIDE+STRIDE],bytes([hi if bits[y] else low])*STRIDE)
 def test_ramp_dword_cells(self):
  for name,src in self.src.items():
   patched,d=pattern_plane(name,src,'ramp');plane=patched[d['packedOffset']:];lo,hi=d['indexDomain']
   for x in range(0,STRIDE,4):self.assertEqual(plane[x:x+4],bytes([lo+(x//4)%(hi-lo+1)])*4)
 def test_strict_source_qualification(self):
  b=bytearray(self.src['tomb.gra']);b[0]^=1
  with self.assertRaises(ValueError):pattern_plane('tomb.gra',bytes(b),'x-ruler')
  with self.assertRaises(ValueError):pattern_plane('foo.gra',self.src['tomb.gra'],'x-ruler')
  with self.assertRaises(ValueError):pattern_plane('tomb.gra',self.src['tomb.gra'],'unknown')
 def test_all_stage_21_pattern_documents(self):
  d=full_pattern_report(self.src);self.assertEqual(len(d),7)
  self.assertEqual(sum(len(x) for x in d.values()),21)
 def test_no_modification_without_stage_change(self):
  output,_=pattern_plane('portal.gra',self.src['portal.gra'],'ramp')
  for key in ('tomb.gra','tower.gra','arena.gra'):
   self.assertEqual(sha(self.src[key]),RESOURCES[key][-1])
  self.assertNotEqual(output,self.src['portal.gra'])

if __name__=='__main__':unittest.main()

class ScreenshotTests(unittest.TestCase):
 def test_synthetic_ruler_detected(self):
  try:from PIL import Image
  except ImportError:raise unittest.SkipTest('Pillow unavailable')
  from tempfile import TemporaryDirectory
  from inspect_screenshot import inspect
  b=debruijn_binary(5)
  im=Image.new('RGB',(320,200),(0,0,0));p=im.load()
  for y in range(154,195):
   for x in range(320):p[x,y]=(128,48,24) if b[(288+x)//CELL_WIDTH] else (20,20,20)
  with TemporaryDirectory() as td:
   path=Path(td)/'synthetic.png';im.save(path);r=inspect(path)
  self.assertEqual(r['patternRecognitionStatus'],'TENTATIVE_X_RULER_DETECTED')
  self.assertGreaterEqual(r['qualifiedScreenRows'],3)
  self.assertTrue(any(f['candidateLeftSourceOffset']==288 for f in r['conditionalXrulerFits']))
 def test_prior_checker_not_misidentified(self):
  try:from PIL import Image
  except ImportError:raise unittest.SkipTest('Pillow unavailable')
  from inspect_screenshot import inspect
  f=Path(__file__).resolve().parents[2]/'evidence/mk2_o110z/runtime_screenshots/11.png'
  self.assertTrue(f.exists())
  r=inspect(f)
  self.assertEqual(r['patternRecognitionStatus'],'UNCONFIRMED_PATTERN')

class PriorWitnessTests(unittest.TestCase):
 def test_previous_floor_rgb_swatches(self):
  from analyze_o110z_witness import inspect
  p=Path(__file__).resolve().parents[2]/'evidence/mk2_o110z/runtime_screenshots'
  d=inspect(p)['observations']
  assert d['11.png']['top5'][0]['rgb']==[52,12,12]
  assert d['11.png']['top5'][1]['rgb']==[93,36,12]
  assert d['12.png']['top5'][0]['rgb']==[142,101,85]
  assert d['13.png']['top5'][0]['rgb']==[101,69,36]
  assert d['13.png']['top5'][1]['rgb']==[36,4,4]
  assert d['11.png']['twoTopColorCoverage']>0.90
  assert d['13.png']['twoTopColorCoverage']>0.75
