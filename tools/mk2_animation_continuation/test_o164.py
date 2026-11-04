#!/usr/bin/env python3
"""O164 source/forged-report negative controls."""
import argparse,copy,sys,unittest
from pathlib import Path
from trace_o164_timer_gate_handshake import make
from verify_o164_independent import verify
E=D=b'';R={}
class Tests(unittest.TestCase):
 def test_original_identity(self):self.assertEqual((len(E),len(D)),(861133,2522))
 def test_independent_valid_source(self):self.assertGreaterEqual(verify(E,D,R),35)
 def test_producer_report_parity(self):self.assertEqual(make(E,D),R)
 def test_bad_real_exe_rejected(self):
  for site in (0x66ee3,0x66eed,0x670e3):
   b=bytearray(E);b[site]^=1
   with self.subTest(site=hex(site)),self.assertRaises(ValueError):make(bytes(b),D)
   with self.assertRaises(ValueError):verify(bytes(b),D,R)
 def test_bad_real_driver_rejected(self):
  for site in (0x821,0x846,0x8ad,0x8af):
   b=bytearray(D);b[site]^=1
   with self.subTest(site=hex(site)),self.assertRaises(ValueError):make(E,bytes(b))
   with self.assertRaises(ValueError):verify(E,bytes(b),R)
 def test_forged_tick_timing_claim(self):
  for key in ('actualIRQRateMeasured','animationFrameRateProven','timerFlagLiveStateKnown'):
   r=copy.deepcopy(R);r['limits'][key]=True
   with self.subTest(key=key),self.assertRaises(ValueError):verify(E,D,r)
 def test_forged_field(self):
  r=copy.deepcopy(R);r['sourceFields']['driverGate']=0x3d
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_forged_runtime_prereq(self):
  r=copy.deepcopy(R);r['limits']['whichInputActivatesPrerequisite88Or69Known']=True
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_forged_branch(self):
  r=copy.deepcopy(R);r['branchTargets']['gameNonzeroFlagSpinBackTo']=0x66ee3
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_forged_witness(self):
  r=copy.deepcopy(R);r['driverWitnesses'][6]['bytes']='00'
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_missing_witness(self):
  r=copy.deepcopy(R);r['exeWitnesses'].pop()
  with self.assertRaises(ValueError):verify(E,D,r)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--driver',required=True);a=p.parse_args()
 E=Path(a.exe).read_bytes();D=Path(a.driver).read_bytes();R=make(E,D)
 unittest.main(argv=[sys.argv[0]])
