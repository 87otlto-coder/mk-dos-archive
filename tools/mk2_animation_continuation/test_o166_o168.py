#!/usr/bin/env python3
"""Negative-case tests for O166–O168 provenance and interpretation. No mutation of originals."""
import argparse,copy,importlib.util,json,unittest
from pathlib import Path
P=Path(__file__).parent

def load(name,path):
 s=importlib.util.spec_from_file_location(name,P/path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
PROD=load('o166prod','trace_o166_o168_input_cadence.py')
VER=load('o166verify','verify_o166_o168_independent.py')
class Checks(unittest.TestCase):
 def setup_source(self):pass
 @classmethod
 def setUpClass(cls):
  cls.exe=Path(CLI.exe).read_bytes();cls.drv=Path(CLI.driver).read_bytes()
  cls.rs=PROD.make(cls.exe,cls.drv)
 def test_01_valid(self):self.assertGreaterEqual(VER.check(self.exe,self.drv,self.rs),120)
 def test_02_bad_executable(self):
  b=bytearray(self.exe);b[0x66eef]^=0x20
  with self.assertRaises(ValueError):PROD.make(bytes(b),self.drv)
 def test_03_bad_driver(self):
  b=bytearray(self.drv);b[0x82e]^=1
  with self.assertRaises(ValueError):PROD.make(self.exe,bytes(b))
 def test_04_verifier_rejects_mutated_executable(self):
  b=bytearray(self.exe);b[0x670e3]^=1
  with self.assertRaises(ValueError):VER.check(bytes(b),self.drv,self.rs)
 def test_05_verifier_rejects_mutated_driver(self):
  b=bytearray(self.drv);b[0x93f]^=1
  with self.assertRaises(ValueError):VER.check(self.exe,bytes(b),self.rs)
 def test_06_rejects_forged_hotkey_mapping(self):
  r=copy.deepcopy(self.rs);r['O166']['verifiedScanCodeToSourceField'][3]['writtenFlag']=0x3c
  with self.assertRaises(ValueError):VER.check(self.exe,self.drv,r)
 def test_07_rejects_forged_alt_modifier(self):
  r=copy.deepcopy(self.rs);r['O166']['altScanCode']=0x1d
  with self.assertRaises(ValueError):VER.check(self.exe,self.drv,r)
 def test_08_rejects_forged_gameplay_semantics(self):
  r=copy.deepcopy(self.rs);r['O166']['limits']['runtimeKeyBehaviorObserved']=True
  with self.assertRaises(ValueError):VER.check(self.exe,self.drv,r)
 def test_09_rejects_bad_chaining_cadence(self):
  r=copy.deepcopy(self.rs);r['O167']['chainLogic']['conditionalEntryCycle']=4
  with self.assertRaises(ValueError):VER.check(self.exe,self.drv,r)
 def test_10_rejects_fake_bios_hz(self):
  r=copy.deepcopy(self.rs);r['O167']['nominalClockModel']['nominalPriorHandlerChainHz']=18.2
  with self.assertRaises(ValueError):VER.check(self.exe,self.drv,r)
 def test_11_rejects_fake_clock_measurement(self):
  r=copy.deepcopy(self.rs);r['O167']['limits']['actualInterruptsPerSecondMeasured']=True
  with self.assertRaises(ValueError):VER.check(self.exe,self.drv,r)
 def test_12_rejects_scaled_task_yield(self):
  r=copy.deepcopy(self.rs);r['O168']['modelExamples'][1]['taskCounterAfterOneTraversal']=3
  with self.assertRaises(ValueError):VER.check(self.exe,self.drv,r)
 def test_13_rejects_task_counter_width(self):
  r=copy.deepcopy(self.rs);r['O168']['scheduler']['taskCountdownWidthBits']=32
  with self.assertRaises(ValueError):VER.check(self.exe,self.drv,r)
 def test_14_rejects_fake_fps(self):
  r=copy.deepcopy(self.rs);r['O168']['limits']['animationFrameRateMeasured']=True
  with self.assertRaises(ValueError):VER.check(self.exe,self.drv,r)
 def test_15_rejects_missing_witness(self):
  r=copy.deepcopy(self.rs);r['O166']['driverWitnesses'].pop()
  with self.assertRaises(ValueError):VER.check(self.exe,self.drv,r)
 def test_16_rejects_forged_original_bytes(self):
  r=copy.deepcopy(self.rs);r['O168']['exeWitnesses'][0]['originalBytes']='00'
  with self.assertRaises(ValueError):VER.check(self.exe,self.drv,r)
 def test_17_rejects_duplicate_witness(self):
  r=copy.deepcopy(self.rs);r['O167']['driverWitnesses'][0]=r['O167']['driverWitnesses'][1]
  with self.assertRaises(ValueError):VER.check(self.exe,self.drv,r)
 def test_18_rejects_wrong_source_provenance(self):
  r=copy.deepcopy(self.rs);r['O166']['originalDriverSHA256']='0'*64
  with self.assertRaises(ValueError):VER.check(self.exe,self.drv,r)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--driver',required=True);CLI=p.parse_args();unittest.main(argv=['o166_o168_tests'],verbosity=1)
