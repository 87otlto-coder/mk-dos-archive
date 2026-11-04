#!/usr/bin/env python3
import unittest,sys,json,copy,tempfile,zipfile
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parent))
from analyze_o119_runtime_images import CASES,expected_patched_exe,inspect_png,build,read_original
from verify_o119_independent import audit
PROJECT=Path(__file__).resolve().parents[2]
E=PROJECT/'evidence/mk2_o119'
REPORT=PROJECT/'research_outputs/O119_80_VS_79_RUNTIME_PALETTE_IMAGES.json'
# Explicit fixture paths only: outside packaged source, never publish game data.
CANON=Path(sys.argv[1]) if len(sys.argv)>1 and sys.argv[1].endswith('.zip') else None
KIT=Path(sys.argv[2]) if len(sys.argv)>2 and sys.argv[2].endswith('.zip') else None
class O119RuntimeTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  if not CANON or not KIT:raise unittest.SkipTest('requires original MK2 and O118 full test kit ZIP')
  cls.exe=read_original(CANON)
  cls.blob=REPORT.read_bytes()
 def test_four_evidence_pngs(self):
  self.assertEqual(set(p.name for p in E.glob('*.png')),{'41.png','42.png','43.png','44.png'})
 def test_colors_are_exact_and_negative_controls_clean(self):
  observed={k:inspect_png(E/f'{k}.png',k)['exactInjectedRGBPixels'] for k in CASES}
  self.assertEqual(observed,{41:24143,42:0,43:8887,44:0})
 def test_floor_region_carries_patch(self):
  for k in (41,43):self.assertGreater(inspect_png(E/f'{k}.png',k)['exactInjectedRGBPixelsInLowerStageRegion'],1000)
 def test_distinct_patched_exes(self):
  hs=set()
  for k in CASES:
   b,p=expected_patched_exe(self.exe,k);self.assertEqual(len(b),len(self.exe));hs.add(p['expectedExeSHA256'])
  self.assertEqual(len(hs),4)
 def test_independent_verifier(self):
  result=audit(E,self.exe,KIT,self.blob);self.assertEqual(result['assertions'],114)
 def test_reject_forged_report_color_counts(self):
  for case in ('41','42','43','44'):
   r=json.loads(self.blob);r['cases'][case]['screenshot']['exactInjectedRGBPixels']+=1
   with self.subTest(case=case),self.assertRaises(AssertionError):audit(E,self.exe,KIT,json.dumps(r).encode())
 def test_reject_forged_report_word_address(self):
  for case in ('41','42','43','44'):
   r=json.loads(self.blob);r['cases'][case]['patch']['colorWordPhysical']+=2
   with self.subTest(case=case),self.assertRaises(AssertionError):audit(E,self.exe,KIT,json.dumps(r).encode())
 def test_reject_forged_screenshot_hash(self):
  r=json.loads(self.blob);r['cases']['43']['screenshot']['screenshotSHA256']='0'*64
  with self.assertRaises(AssertionError):audit(E,self.exe,KIT,json.dumps(r).encode())
 def test_reject_forged_kit_binary_hash(self):
  r=json.loads(self.blob);r['cases']['44']['patch']['expectedExeSHA256']='0'*64
  with self.assertRaises(AssertionError):audit(E,self.exe,KIT,json.dumps(r).encode())
 def test_paired_stage_record_offsets_are_different(self):
  r=json.loads(self.blob)
  self.assertNotEqual(r['cases']['41']['patch']['recordPhysical'],r['cases']['42']['patch']['recordPhysical'])
  self.assertNotEqual(r['cases']['43']['patch']['recordPhysical'],r['cases']['44']['patch']['recordPhysical'])
 def test_build_reproduces_report(self):
  self.assertEqual(build(E,self.exe,KIT),json.loads(self.blob))
 def test_no_false_live_handle_claim(self):
  r=json.loads(self.blob)
  self.assertIn('NOT_LIVE_ALLOCATOR_HANDLE',r['status'])
  self.assertGreater(len(r['unresolved']),3)
if __name__=='__main__':unittest.main(argv=[sys.argv[0]],verbosity=2)
