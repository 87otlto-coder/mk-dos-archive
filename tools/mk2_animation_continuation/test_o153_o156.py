#!/usr/bin/env python3
"""Adversarial checks for O153-O156; independent checker must reject forged runtime assertions."""
import argparse,copy,pathlib,sys,unittest
from trace_o153_o156_frame_counter_origin import report as produce
from verify_o153_o156_independent import verify
B=b'';R={}
class Tests(unittest.TestCase):
 def test_original_exe(self):self.assertEqual(len(B),861133)
 def test_baseline(self):self.assertGreater(verify(B,R),80)
 def test_recomputed_report(self):self.assertEqual(verify(B,produce(B)),verify(B,R))
 def test_wrong_input_source_rejected(self):
  for off in (0x62205,0x61e39,0x66f05,0x67158):
   with self.subTest(off=off):
    x=bytearray(B);x[off]^=1
    with self.assertRaises(ValueError):produce(bytes(x))
    with self.assertRaises(ValueError):verify(bytes(x),R)
 def test_reject_changed_schema(self):
  for k in R:
   with self.subTest(k=k):
    rr=copy.deepcopy(R);rr[k]['schema']='unverified_prediction'
    with self.assertRaises(ValueError):verify(B,rr)
 def test_reject_forged_timing_flags(self):
  for k in R:
   for flag,value in R[k]['limits'].items():
    with self.subTest(passid=k,flag=flag):
     rr=copy.deepcopy(R);rr[k]['limits'][flag]=not value
     with self.assertRaises(ValueError):verify(B,rr)
 def test_reject_claimed_FPS_field(self):
  rr=copy.deepcopy(R);rr['O154']['limits']['animationFPSProven']=True
  with self.assertRaises(ValueError):verify(B,rr)
 def test_reject_forged_pointer(self):
  for key in ('requestedBytes','pointerGlobalObject2','aliasGlobalObject2','counterField'):
   rr=copy.deepcopy(R);rr['O155'][key]+=1
   with self.assertRaises(ValueError):verify(B,rr)
 def test_reject_forged_source_site(self):
  for k in R:
   with self.subTest(k=k):
    rr=copy.deepcopy(R);rr[k]['witnesses'][0]['bytes']='ff'
    with self.assertRaises(ValueError):verify(B,rr)
 def test_reject_wrong_call_edge(self):
  for k in ('O153','O155','O156'):
   with self.subTest(k=k):
    rr=copy.deepcopy(R);rr[k]['originalDirectCalls'][0]['targetPhysical']='0x00001'
    with self.assertRaises(ValueError):verify(B,rr)
 def test_reject_missing_site(self):
  rr=copy.deepcopy(R);rr['O154']['witnesses'].pop()
  with self.assertRaises(ValueError):verify(B,rr)
 def test_reject_invented_extra_milestone(self):
  rr=copy.deepcopy(R);rr['O157']={}
  with self.assertRaises(ValueError):verify(B,rr)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);a=p.parse_args();B=pathlib.Path(a.exe).read_bytes();R=produce(B)
 result=unittest.TextTestRunner(verbosity=1).run(unittest.defaultTestLoader.loadTestsFromTestCase(Tests))
 if not result.wasSuccessful():sys.exit(1)
