#!/usr/bin/env python3
import argparse,copy,sys,unittest
from pathlib import Path
from trace_o165_keyboard_timer_gate import make
from verify_o165_independent import verify
E=D=b'';R={}
class TestKeyboardGate(unittest.TestCase):
 def test_verified_original(self):self.assertEqual(verify(E,D,R),41)
 def test_producer_agrees(self):self.assertEqual(make(E,D),R)
 def test_corrupt_driver_rejected(self):
  for i in (3,0x3c3,0x3d9,0x3dc,0x3e5,0x81c,0x837):
   b=bytearray(D);b[i]^=1
   with self.subTest(i=hex(i)),self.assertRaises(ValueError):make(E,bytes(b))
   with self.assertRaises(ValueError):verify(E,bytes(b),R)
 def test_corrupt_executable_rejected(self):
  b=bytearray(E);b[0x670e3]^=1
  with self.assertRaises(ValueError):make(bytes(b),D)
  with self.assertRaises(ValueError):verify(bytes(b),D,R)
 def test_bad_key_state_index_rejected(self):
  for key in ('prerequisiteOneScanCodeIndex','prerequisiteTwoScanCodeIndex','baseOffset','keyDownMarker'):
   r=copy.deepcopy(R);r['keyStateTable'][key]+=1
   with self.subTest(key=key),self.assertRaises(ValueError):verify(E,D,r)
 def test_forged_conclusion_pause_rejected(self):
  r=copy.deepcopy(R);r['limits']['specificGameplayPauseFunctionProven']=True
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_forged_live_keys_rejected(self):
  r=copy.deepcopy(R);r['limits']['liveKeysPressedObserved']=True
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_forged_fps_rejected(self):
  r=copy.deepcopy(R);r['limits']['animationFrameRateProven']=True
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_forged_timer_opcode_rejected(self):
  r=copy.deepcopy(R);r['driverWitnesses'][-1]['bytes']='ffff'
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_missing_keyboard_provenance_rejected(self):
  r=copy.deepcopy(R);r['driverWitnesses'].pop(0)
  with self.assertRaises(ValueError):verify(E,D,r)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--driver',required=True);a=p.parse_args()
 E=Path(a.exe).read_bytes();D=Path(a.driver).read_bytes();R=make(E,D)
 unittest.main(argv=[sys.argv[0]])
