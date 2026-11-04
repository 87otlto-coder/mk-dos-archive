"""O115 integration, negative-control and adversarial screenshot-report regressions."""
from __future__ import annotations
import copy,json,tempfile,unittest
from pathlib import Path
from fit_o115_y_ramp import y_fit,ramp_fit
from verify_o115_witness_independent import verify,CONFIG

THIS=Path(__file__).resolve().parent
ROOT=THIS.parents[1]
CAP=ROOT/'evidence'/'mk2_o115'
PREV=ROOT/'evidence'/'mk2_o114'
REPORTS=ROOT/'research_outputs'

class O115WitnessTests(unittest.TestCase):
 def test_vertical_tomb(self):
  d=y_fit(CAP/'22.png','tomb');self.assertTrue(d['rulerRecognized'])
  self.assertEqual(d['candidateStartImageRow'],318);self.assertEqual(d['matchedImageRows'],81)
 def test_vertical_portal(self):
  d=y_fit(CAP/'25.png','portal');self.assertTrue(d['rulerRecognized'])
  self.assertEqual(d['candidateStartImageRow'],323);self.assertEqual(d['matchedImageRows'],70)
 def test_ramp_tomb_complete(self):
  d=ramp_fit(CAP/'23.png','tomb');self.assertTrue(d['completeObservedColorTable'])
  self.assertEqual(d['qualifiedIndexCount'],50);self.assertEqual(d['sourceMinimumAnchorStarts'],[223,623])
 def test_ramp_portal_complete(self):
  d=ramp_fit(CAP/'26.png','portal');self.assertTrue(d['completeObservedColorTable'])
  self.assertEqual(d['qualifiedIndexCount'],78);self.assertEqual(d['chosenMinimumAnchor'],42)
 def test_tomb_palette_collisions(self):
  d=ramp_fit(CAP/'23.png','tomb');self.assertEqual(d['distinctObservedRGB'],48)
 def test_portal_palette_collisions(self):
  d=ramp_fit(CAP/'26.png','portal');self.assertEqual(d['distinctObservedRGB'],77)
 def test_prior_control_does_not_match(self):
  self.assertFalse(y_fit(PREV/'20.png','portal')['rulerRecognized'])
  self.assertFalse(ramp_fit(PREV/'20.png','portal')['completeObservedColorTable'])
 def test_prior_tomb_x_ruler_does_not_match_y(self):
  self.assertFalse(y_fit(PREV/'21.png','tomb')['rulerRecognized'])
 def test_prior_portal_x_ruler_does_not_match_y(self):
  self.assertFalse(y_fit(PREV/'24.png','portal')['rulerRecognized'])
 def test_wrong_stage_rejects(self):
  self.assertFalse(ramp_fit(CAP/'23.png','portal')['completeObservedColorTable'])
  self.assertFalse(ramp_fit(CAP/'26.png','tomb')['completeObservedColorTable'])
 def test_independent_four_original_reports(self):
  d=verify(CAP,REPORTS)
  self.assertGreaterEqual(d['totalAssertions'],250)
  self.assertEqual(d['witnesses']['23']['indicesVerified'],50)
  self.assertEqual(d['witnesses']['26']['indicesVerified'],78)
 def test_forged_source_palette_color_rejected(self):
  self._forge('O115_TOMB_23_RAMP.json', lambda d:d['indexToObservedColor']['8'].update({'observedRGB':[0,0,0]}))
 def test_forged_origin_rejected(self):
  self._forge('O115_PORTAL_25_Y.json', lambda d:d.update({'candidateStartImageRow':327}))
 def test_forged_rgb_entry_rejected(self):
  self._forge('O115_PORTAL_26_RAMP.json', lambda d:d['indexToObservedColor']['60'].update({'observedRGB':[123,8,9]}))
 def test_forged_fingerprint_rejected(self):
  self._forge('O115_TOMB_22_Y.json', lambda d:d['input'].update({'sha256':'00'*32}))
 def _forge(self,name,mutator):
  with tempfile.TemporaryDirectory() as tmp:
   out=Path(tmp)
   for number,(_,_,_,_,_,_,_,filename) in CONFIG.items():
    d=json.loads((REPORTS/filename).read_text())
    if filename==name:mutator(d)
    (out/filename).write_text(json.dumps(d))
   with self.assertRaises(AssertionError):verify(CAP,out)

if __name__=='__main__':unittest.main()
