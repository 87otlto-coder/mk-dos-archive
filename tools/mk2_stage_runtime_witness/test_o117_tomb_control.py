#!/usr/bin/env python3
"""O117 runtime source reconstruction regression and deliberately falsified reports."""
from __future__ import annotations
import copy, os, sys, unittest
import json
from pathlib import Path

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
from fit_o117_tomb_control import fit, inputs, score, regions
from verify_o117_tomb_independent import verify_report

SRC=HERE.parents[1]
ZIP=Path(os.environ.get('MK2_ORIGINAL_ZIP','/mnt/data/mk2.zip'))
CONTROL=SRC/'evidence/mk2_o117/TOMB_ORIGINAL_CONTROL_20261011.png'
RAMP=SRC/'research_outputs/O115_TOMB_23_RAMP.json'
REPORT=SRC/'research_outputs/O117_TOMB_ORIGINAL_CONTROL_RECONSTRUCTION.json'

class O117Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.result=json.loads(REPORT.read_text())
  cls.source,cls.colors,cls.screen=inputs(ZIP,CONTROL,RAMP)

 def test_canonical_source_and_capture(self):self.assertEqual(self.screen.size,(637,397))
 def test_fit_parameters(self):self.assertEqual((self.result['observedStartSourceColumn'],self.result['floorSourceRow0AtScreenshotY']),(291,318))
 def test_training_exact(self):
  tr,_=regions();self.assertEqual(score(self.source,self.colors,self.screen,tr,291,318),310)
 def test_heldout_left(self):
  _,hold=regions();self.assertEqual(score(self.source,self.colors,self.screen,hold['leftUnoccluded'],291,318),4047)
 def test_heldout_center(self):
  _,hold=regions();self.assertEqual(score(self.source,self.colors,self.screen,hold['centerUnoccluded'],291,318),3900)
 def test_heldout_right(self):
  _,hold=regions();self.assertEqual(score(self.source,self.colors,self.screen,hold['rightUnoccluded'],291,318),4275)
 def test_wrong_left_never_perfect(self):
  _,hold=regions();pts=sum(hold.values(),[])
  self.assertLess(score(self.source,self.colors,self.screen,pts,290,318),len(pts))
  self.assertLess(score(self.source,self.colors,self.screen,pts,292,318),len(pts))
 def test_wrong_origin_never_perfect(self):
  _,hold=regions();pts=sum(hold.values(),[])
  for o in [317,319]:self.assertLess(score(self.source,self.colors,self.screen,pts,291,o),len(pts))
 def test_proportional_scaling_rejected(self):
  _,hold=regions();pts=sum(hold.values(),[])
  self.assertLess(score(self.source,self.colors,self.screen,pts,291,318,model='proportional'),len(pts))
 def test_independent_verifier(self):self.assertEqual(verify_report(self.result,ZIP,CONTROL,RAMP)['status'],'PASS')
 def test_forged_crop_rejected(self):
  bad=copy.deepcopy(self.result);bad['observedStartSourceColumn']=290
  with self.assertRaises(AssertionError):verify_report(bad,ZIP,CONTROL,RAMP)
 def test_forged_origin_rejected(self):
  bad=copy.deepcopy(self.result);bad['floorSourceRow0AtScreenshotY']=319
  with self.assertRaises(AssertionError):verify_report(bad,ZIP,CONTROL,RAMP)
 def test_forged_screenshot_hash_rejected(self):
  bad=copy.deepcopy(self.result);bad['originalGameplayScreenshotSHA256']='0'*64
  with self.assertRaises(AssertionError):verify_report(bad,ZIP,CONTROL,RAMP)
 def test_forged_palette_bank_claim_rejected(self):
  bad=copy.deepcopy(self.result);bad['qualification']='LIVE_VGA_PALETTE_BANK_CONFIRMED'
  with self.assertRaises(AssertionError):verify_report(bad,ZIP,CONTROL,RAMP)
 def test_forged_heldout_pixel_rejected(self):
  bad=copy.deepcopy(self.result);bad['disjointHeldOutRegions']['rightUnoccluded']['matched']-=1
  with self.assertRaises(AssertionError):verify_report(bad,ZIP,CONTROL,RAMP)
 def test_forged_negative_model_rejected(self):
  bad=copy.deepcopy(self.result);bad['negativeControlMatchedPixels']['wrongSourceLeftMinus1']=12222
  with self.assertRaises(AssertionError):verify_report(bad,ZIP,CONTROL,RAMP)

if __name__=='__main__':unittest.main()
