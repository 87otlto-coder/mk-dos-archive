"""O114 screenshot regressions including historic negative controls and synthetic inputs."""
from __future__ import annotations
from pathlib import Path
import tempfile
import unittest

from fit_o113_ruler import fit,RULER,STAGES

ROOT=Path(__file__).resolve().parents[2]
NEW=ROOT/'evidence/mk2_o114'
OLDER=ROOT/'evidence/mk2_o110z/runtime_screenshots'

class WitnessRegression(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  try:from PIL import Image
  except ImportError:raise unittest.SkipTest('Pillow unavailable')

 def test_exact_o113_ruler_sequence(self):
  self.assertEqual(len(RULER),32)
  self.assertEqual(len({tuple(RULER[(i+j)%32] for j in range(5)) for i in range(32)}),32)

 def test_tomb_runtime_recognized(self):
  d=fit(NEW/'21.png','tomb')
  self.assertTrue(d['patternRecognized'])
  self.assertGreaterEqual(d['qualifiedRows'],40)
  self.assertEqual(d['offsetSpanOnQualifiedRows'],[290,291])
  self.assertEqual(d['observedPolarity'],'direct')
  self.assertEqual(d['inferredRgbForRawIndex'],{'2':[93,36,12],'51':[52,12,12]})
  self.assertGreater(d['medianMatchFraction'],.97)

 def test_portal_runtime_recognized(self):
  d=fit(NEW/'24.png','portal')
  self.assertTrue(d['patternRecognized'])
  self.assertGreaterEqual(d['qualifiedRows'],30)
  self.assertEqual(d['offsetSpanOnQualifiedRows'],[317,326])
  self.assertEqual(d['observedPolarity'],'inverted')
  self.assertEqual(d['inferredRgbForRawIndex'],{'3':[36,4,4],'80':[101,69,36]})
  self.assertGreater(d['medianMatchFraction'],.94)

 def test_new_original_control_not_detected(self):
  self.assertFalse(fit(NEW/'20.png','portal')['patternRecognized'])

 def test_prior_portal_original_control_not_detected(self):
  self.assertFalse(fit(OLDER/'10.png','portal')['patternRecognized'])

 def test_prior_tomb_checker_not_detected(self):
  self.assertFalse(fit(OLDER/'11.png','tomb')['patternRecognized'])

 def test_prior_tomb_flat_not_detected(self):
  self.assertFalse(fit(OLDER/'12.png','tomb')['patternRecognized'])

 def test_prior_portal_checker_not_detected(self):
  self.assertFalse(fit(OLDER/'13.png','portal')['patternRecognized'])

 def _synthetic(self,stage,offset,*,reversed_mapping=False,clear=False,scale=1):
  from PIL import Image
  rgb0,rgb1=STAGES[stage]['colors']
  if reversed_mapping:rgb0,rgb1=rgb1,rgb0
  img=Image.new('RGB',(320,200),'black')
  px=img.load()
  for y in range(150,200):
   for x in range(320):
    bit=int(RULER[(offset+x)//28]) if not clear else (x//3)%2
    px[x,y]=rgb1 if bit else rgb0
  if scale>1:img=img.resize((320*scale,200*scale),Image.Resampling.NEAREST)
  return img

 def test_synthetic_native_tomb_known_offset(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t)/'synthetic.png';self._synthetic('tomb',288).save(p)
   d=fit(p,'tomb');self.assertTrue(d['patternRecognized'])
   self.assertEqual(d['offsetSpanOnQualifiedRows'],[288,288]);self.assertEqual(d['observedPolarity'],'direct')

 def test_synthetic_scaled_portal_known_offset(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t)/'synthetic.png';self._synthetic('portal',320,reversed_mapping=True,scale=2).save(p)
   d=fit(p,'portal');self.assertTrue(d['patternRecognized'])
   self.assertEqual(d['offsetSpanOnQualifiedRows'],[320,320]);self.assertEqual(d['observedPolarity'],'inverted')

 def test_synthetic_high_frequency_not_recognized(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t)/'synthetic.png';self._synthetic('portal',320,clear=True).save(p)
   self.assertFalse(fit(p,'portal')['patternRecognized'])

 def test_wrong_stage_rejected(self):
  with self.assertRaises(ValueError):fit(NEW/'21.png','arena')

 def test_input_limits(self):
  with self.assertRaises(ValueError):fit(NEW/'24.png','portal',row_stride=0)

if __name__=='__main__':unittest.main()
