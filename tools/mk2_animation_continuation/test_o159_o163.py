#!/usr/bin/env python3
"""Genuine source and adversarial report tests for original RM.DRV timer research."""
import argparse,copy,pathlib,sys,unittest
from trace_o159_o163_rm_driver_timer import make as producer
from verify_o159_o163_independent import verify
E=D=b'';R={}
class Tests(unittest.TestCase):
 def test_canonical_sources(self):self.assertEqual((len(E),len(D)),(861133,2522))
 def test_independent_real_sources(self):self.assertGreater(verify(E,D,R),180)
 def test_producer_independent_parity(self):self.assertEqual(verify(E,D,producer(E,D)),verify(E,D,R))
 def test_corrupted_original_exe_rejected(self):
  for at in (0x620cd,0x66f60,0x670e3):
   b=bytearray(E);b[at]^=0x10
   for fn in (lambda:producer(bytes(b),D),lambda:verify(bytes(b),D,R)):
    with self.subTest(site=at),self.assertRaises(ValueError):fn()
 def test_corrupted_rm_driver_rejected(self):
  for at in (0,0x8af,0x8b5,0x8b9,0x93f):
   b=bytearray(D);b[at]^=0x80
   for fn in (lambda:producer(E,bytes(b)),lambda:verify(E,bytes(b),R)):
    with self.subTest(site=at),self.assertRaises(ValueError):fn()
 def test_forged_fps_claim_rejected(self):
  r=copy.deepcopy(R);r['O161']['limits']['gameFPSProven']=True
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_false_irq_unconditional_rejected(self):
  r=copy.deepcopy(R);r['O160']['limits']['unconditionalIRQ8IncrementsProven']=True
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_false_live_irq_proven_rejected(self):
  r=copy.deepcopy(R);r['O161']['limits']['liveIRQ8HandlerInvokedInDOSBox']=True
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_forged_wrong_counter_field(self):
  for key in ('tickCounterLowOffset','tickCounterHighOffset','secondCounterLowOffset','secondCounterHighOffset'):
   with self.subTest(key=key):
    r=copy.deepcopy(R);r['O160'][key]+=2
    with self.assertRaises(ValueError):verify(E,D,r)
 def test_forged_driver_filename(self):
  r=copy.deepcopy(R);r['O159']['resourceRecord']['resourceName']='RM_FAKE.DRV'
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_forged_wrong_hash(self):
  r=copy.deepcopy(R);r['O159']['originalDriverSHA256']='0'*64
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_forged_loader_opcode(self):
  r=copy.deepcopy(R);r['O159']['exeWitnesses'][0]['bytes']='00'
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_forged_handler_opcode(self):
  r=copy.deepcopy(R);r['O160']['driverWitnesses'][-1]['bytes']='00'
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_forged_pit_divisor(self):
  r=copy.deepcopy(R);r['O161']['join']['originalPITDivisor']=42
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_forged_second_counter(self):
  r=copy.deepcopy(R);r['O162']['secondCounterFieldOffset']=0x24
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_forged_pic_vector(self):
  r=copy.deepcopy(R);r['O163']['sourceSavedVectorFarPointerOffset']=0x24
  with self.assertRaises(ValueError):verify(E,D,r)
 def test_missing_resource_provenance(self):
  r=copy.deepcopy(R);r.pop('O159')
  with self.assertRaises(ValueError):verify(E,D,r)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--driver',required=True);args=p.parse_args()
 E=pathlib.Path(args.exe).read_bytes();D=pathlib.Path(args.driver).read_bytes();R=producer(E,D)
 result=unittest.TextTestRunner(verbosity=1).run(unittest.defaultTestLoader.loadTestsFromTestCase(Tests))
 if not result.wasSuccessful():sys.exit(1)
