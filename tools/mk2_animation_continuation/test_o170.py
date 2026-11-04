#!/usr/bin/env python3
"""O170 executable and real-mode driver mode-switch adversarial checks."""
import argparse,copy,importlib.util,unittest
from pathlib import Path
P=Path(__file__).parent

def load(name,file):
 s=importlib.util.spec_from_file_location(name,P/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
PROD=load('o170p','trace_o170_keyboard_mode_switch.py')
VER=load('o170v','verify_o170_independent.py')
class Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.e=Path(CLI.exe).read_bytes();cls.d=Path(CLI.driver).read_bytes();cls.r=PROD.make(cls.e,cls.d)
 def reject(self,fun):
  r=copy.deepcopy(self.r);fun(r)
  with self.assertRaises(ValueError):VER.verify(self.e,self.d,r)
 def test_true_source(self):self.assertEqual(VER.verify(self.e,self.d,self.r),28)
 def test_forged_mode_value(self):self.reject(lambda r:r['modeSetters'].__setitem__(0,0x9b32a))
 def test_forged_clear_span(self):self.reject(lambda r:r['resetGeometry'].update(totalBytes=0x7c))
 def test_forged_key_base(self):self.reject(lambda r:r['resetGeometry'].update(keyTableStart=0x51))
 def test_fake_runtime_claim(self):self.reject(lambda r:r['limits'].update(actualAltCombinationsObserved=True))
 def test_fake_mode_claim(self):self.reject(lambda r:r['limits'].update(whichModeActiveDuringStageUnknown=False))
 def test_fake_input_mode(self):self.reject(lambda r:r['modeConditionalBranches'].update(gameIfNonzeroSkipBIOSPollAt=0x66ed1))
 def test_source_byte_forgery(self):self.reject(lambda r:r['exeWitnesses'][0].update(originalBytes='00'))
 def test_driver_byte_forgery(self):self.reject(lambda r:r['driverWitnesses'][0].update(originalBytes='00'))
 def test_missing_witness(self):self.reject(lambda r:r['exeWitnesses'].pop())
 def test_bad_fixture_exe(self):
  e=bytearray(self.e);e[0x9d5c1]^=1
  with self.assertRaises(ValueError):VER.verify(bytes(e),self.d,self.r)
 def test_bad_fixture_driver(self):
  d=bytearray(self.d);d[0x3c1]^=1
  with self.assertRaises(ValueError):VER.verify(self.e,bytes(d),self.r)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--driver',required=True);CLI=p.parse_args();unittest.main(argv=['o170'],verbosity=1)
