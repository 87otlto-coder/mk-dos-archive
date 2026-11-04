#!/usr/bin/env python3
"""O169 hostile tests, validating loop/termination without inventing durations."""
import argparse,copy,importlib.util,unittest
from pathlib import Path
P=Path(__file__).parent

def load(name,path):
 spec=importlib.util.spec_from_file_location(name,P/path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
PROD=load('o169producer','trace_o169_original_effect_list_control.py')
VER=load('o169verifier','verify_o169_independent.py')
class O169Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.original=Path(CLI.exe).read_bytes();cls.report=PROD.build(cls.original)
 def falsify(self,fn):
  r=copy.deepcopy(self.report);fn(r)
  with self.assertRaises(ValueError):VER.verify(self.original,r)
 def test_valid(self):self.assertEqual(VER.verify(self.original,self.report),70)
 def test_bad_image_hash(self):
  src=bytearray(self.original);src[0x86d40]^=0xff
  with self.assertRaises(ValueError):PROD.build(bytes(src))
 def test_bad_report_hash(self):self.falsify(lambda r:r.update(originalExeSHA256='bad'))
 def test_wrong_list_base(self):self.falsify(lambda r:r.update(originalExeObject2FileBase=0xa0c58))
 def test_fake_fps(self):self.falsify(lambda r:r['limits'].update(renderedFPSProven=True))
 def test_fake_live_activation(self):self.falsify(lambda r:r['limits'].update(allEffectsActiveAtOnceProven=True))
 def test_wrong_terminator(self):self.falsify(lambda r:r['tracks'][3].update(terminalToken=1))
 def test_wrong_loop_target(self):self.falsify(lambda r:r['tracks'][0].update(terminalPointerObject2=0x17818))
 def test_wrong_loop_length(self):self.falsify(lambda r:r['tracks'][0].update(frameCount=9))
 def test_remove_original_frame(self):self.falsify(lambda r:r['tracks'][2]['originalDescriptorPointersObject2'].pop())
 def test_wrong_pointer(self):self.falsify(lambda r:r['tracks'][4]['originalDescriptorPointersObject2'].__setitem__(0,0x5000))
 def test_fake_finite(self):self.falsify(lambda r:r['tracks'][5].update(termination='zero_marker_carry_exit'))
 def test_missing_source_witness(self):self.falsify(lambda r:r['witnesses'].pop())
 def test_source_witness_forgery(self):self.falsify(lambda r:r['witnesses'][0].update(originalBytes='00'))
 def test_wrong_cursor(self):self.falsify(lambda r:r['sourceMechanism'].update(cursorGlobalAddressOperand=0x75a7c))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);CLI=p.parse_args();unittest.main(argv=['o169'],verbosity=1)
