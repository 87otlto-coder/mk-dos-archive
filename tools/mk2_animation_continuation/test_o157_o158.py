#!/usr/bin/env python3
"""Adversarial validation of installed-IRQ-vector source relationship, not observed Hz."""
import argparse,copy,pathlib,sys,unittest
from trace_o157_o158_irq_vector_join import analyze
from verify_o157_o158_independent import verify
B=b'';R={}
class Regression(unittest.TestCase):
 def test_fixture(self):self.assertEqual(len(B),861133)
 def test_base_verifier(self):self.assertGreater(verify(B,R),80)
 def test_original_output_parity(self):self.assertEqual(verify(B,analyze(B)),verify(B,R))
 def test_wrong_exe_rejected(self):
  for i in (0x6215d,0x61f45,0x66f60):
   with self.subTest(i=i):
    b=bytearray(B);b[i]^=1
    for f in (analyze,lambda x:verify(x,R)):
     with self.assertRaises(ValueError):f(bytes(b))
 def test_wrong_installed_vector(self):
  for i in range(5):
   rr=copy.deepcopy(R);rr['O157']['installedVectors'][i]['vector']=0x78
   with self.assertRaises(ValueError):verify(B,rr)
 def test_wrong_installed_offset(self):
  for i in range(5):
   rr=copy.deepcopy(R);rr['O157']['installedVectors'][i]['handlerOffset']=42
   with self.assertRaises(ValueError):verify(B,rr)
 def test_false_irq_to_counter_dataflow(self):
  rr=copy.deepcopy(R);rr['O158']['limits']['PITIRQ8ToCounterFieldDataflowProven']=True
  with self.assertRaises(ValueError):verify(B,rr)
 def test_fabricated_fps(self):
  rr=copy.deepcopy(R);rr['O158']['limits']['animationFPSEstablished']=True
  with self.assertRaises(ValueError):verify(B,rr)
 def test_wrong_original_pointer(self):
  rr=copy.deepcopy(R);rr['O158']['join']['allocatedSharedInputPointerObject2']=12345
  with self.assertRaises(ValueError):verify(B,rr)
 def test_false_vector_metadata(self):
  for key in R['O157']['limits']:
   rr=copy.deepcopy(R);rr['O157']['limits'][key]=not rr['O157']['limits'][key]
   with self.assertRaises(ValueError):verify(B,rr)
 def test_corrupt_instruction_witness(self):
  rr=copy.deepcopy(R);rr['O157']['sourceAnchors'][0]['bytes']='deadbeef'
  with self.assertRaises(ValueError):verify(B,rr)
 def test_fake_call_helper(self):
  rr=copy.deepcopy(R);rr['O157']['installedVectors'][0]['setterHelperPhysical']='0x65420'
  with self.assertRaises(ValueError):verify(B,rr)
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True);v=a.parse_args();B=pathlib.Path(v.exe).read_bytes();R=analyze(B)
 result=unittest.TextTestRunner(verbosity=1).run(unittest.defaultTestLoader.loadTestsFromTestCase(Regression))
 if not result.wasSuccessful():sys.exit(1)
