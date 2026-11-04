#!/usr/bin/env python3
"""O151/O152 original fixture and forged source/report regressions."""
import argparse,copy,pathlib,sys,unittest
from trace_o151_pit_setup import produce as pit
from verify_o151_pit_setup_independent import check as pit_check
from trace_o152_screen_transfer import analyze as screen
from verify_o152_screen_transfer_independent import verify as screen_check
SOURCE=b''; REPORTS=None
class StageTests(unittest.TestCase):
 def test_original_fixture_source(self):
  self.assertEqual(len(SOURCE),861133)
 def test_timer_real_fixtures(self):
  self.assertGreater(pit_check(SOURCE,REPORTS[0]),40)
 def test_screen_original_geometry(self):
  self.assertEqual(screen_check(SOURCE,REPORTS[1]),250)
 def test_wrong_exe_pit_rejected(self):
  b=bytearray(SOURCE);b[0x66f60]^=1
  for fn in [pit,pit_check]:
   with self.assertRaises(ValueError):fn(bytes(b),*([REPORTS[0]] if fn is pit_check else []))
 def test_wrong_exe_screen_rejected(self):
  b=bytearray(SOURCE);b[0x65822]^=1
  for fn in [screen,screen_check]:
   with self.assertRaises(ValueError):fn(bytes(b),*([REPORTS[1]] if fn is screen_check else []))
 def test_bad_timer_original_fields(self):
  for field in ['modeControl','divisor','channel','divisorDecimal']:
   with self.subTest(field=field):
    r=copy.deepcopy(REPORTS[0]);r['pitSetup'][field]+=1
    with self.assertRaises(ValueError):pit_check(SOURCE,r)
 def test_fake_timer_relationships(self):
  for name in REPORTS[0]['limits']:
   with self.subTest(name=name):
    r=copy.deepcopy(REPORTS[0]);r['limits'][name]=not r['limits'][name]
    with self.assertRaises(ValueError):pit_check(SOURCE,r)
 def test_bad_timer_witness(self):
  r=copy.deepcopy(REPORTS[0]);r['witnesses'][0]['raw']='00'
  with self.assertRaises(ValueError):pit_check(SOURCE,r)
 def test_bad_timer_call(self):
  r=copy.deepcopy(REPORTS[0]);r['calls'][0]['target']='0x00001'
  with self.assertRaises(ValueError):pit_check(SOURCE,r)
 def test_bad_screen_geometry(self):
  for key in ['rowCount','dwordsPerRow','bytesPerRow','copiedBytesPerPass']:
   with self.subTest(key=key):
    r=copy.deepcopy(REPORTS[1]);r[key]+=1
    with self.assertRaises(ValueError):screen_check(SOURCE,r)
 def test_bad_screen_offsets(self):
  r=copy.deepcopy(REPORTS[1]);r['sourceOffsetsBytes'][40]=161
  with self.assertRaises(ValueError):screen_check(SOURCE,r)
 def test_false_screen_claims(self):
  for name in REPORTS[1]['limits']:
   with self.subTest(name=name):
    r=copy.deepcopy(REPORTS[1]);r['limits'][name]=True if r['limits'][name] is False else False
    with self.assertRaises(ValueError):screen_check(SOURCE,r)
 def test_identity_corruption(self):
  for i,rp,fn in [(0,REPORTS[0],pit_check),(1,REPORTS[1],screen_check)]:
   with self.subTest(i=i):
    r=copy.deepcopy(rp);r['originalSHA256']='0'*64
    with self.assertRaises(ValueError):fn(SOURCE,r)
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True);v=a.parse_args()
 SOURCE=pathlib.Path(v.exe).read_bytes();REPORTS=pit(SOURCE),screen(SOURCE)
 tests=unittest.defaultTestLoader.loadTestsFromTestCase(StageTests)
 result=unittest.TextTestRunner(verbosity=1).run(tests)
 if not result.wasSuccessful():sys.exit(1)
