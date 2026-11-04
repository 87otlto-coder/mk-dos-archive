#!/usr/bin/env python3
import argparse,copy,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import trace_o174_original_keyboard_phase_model as tr
import verify_o174_independent as vi
DRIVER=None
class Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.d=DRIVER;cls.r=tr.report(cls.d)
 def fails(self,mut):
  x=copy.deepcopy(self.r);mut(x)
  with self.assertRaises(ValueError):vi.verify(self.d,x)
 def test_00_original(self):self.assertGreaterEqual(vi.verify(self.d,self.r),40)
 def test_01_phase(self):self.assertEqual(tr.advance(65535,0,True,True),(0,255,True))
 def test_02_held(self):self.assertEqual(tr.advance(0,255,True,True),(1,255,False))
 def test_03_release_under_alt(self):self.assertEqual(tr.advance(5,255,True,False),(65535,255,False))
 def test_04_release_alt_first(self):self.assertEqual(tr.advance(5,255,False,False),(5,255,False))
 def test_05_invalid_source(self):
  b=bytearray(self.d);b[0x840]^=1
  with self.assertRaises(ValueError):tr.report(bytes(b))
 def test_06_modified_original_hash(self):
  b=bytearray(self.d);b[2000]^=1
  with self.assertRaises(ValueError):vi.verify(bytes(b),self.r)
 def test_07_wrong_phase_word(self):self.fails(lambda r:r['model']['phaseWordFields'].__setitem__(0,0xe5))
 def test_08_wrong_wrap_cadence(self):self.fails(lambda r:r['model'].update(nextContinuousWrapRequiresAdditionalEligibleCalls=1))
 def test_09_false_fps(self):self.fails(lambda r:r['limits'].update(animationFPSKnown=True))
 def test_10_forged_runtime(self):self.fails(lambda r:r['limits'].update(realInterruptDeliveryMeasured=True))
 def test_11_wrong_modifier(self):self.fails(lambda r:r['model'].update(modifierTableField=0x80))
 def test_12_wrong_gate(self):self.fails(lambda r:r['model'].update(schedulerTickGateByte=0x3b))
 def test_13_alt_release_wrong(self):self.fails(lambda r:r['model'].update(ALTNotPositiveSkipsPhaseReset=False))
 def test_14_phase_example_changed(self):self.fails(lambda r:r['examplePOnly'][1].update(toggled=True))
 def test_15_source_missing(self):self.fails(lambda r:r['sourceWitnesses'].pop())
 def test_16_source_changed(self):self.fails(lambda r:r['sourceWitnesses'][0].update(bytes='00'))
 def test_17_duplicate_source(self):self.fails(lambda r:r['sourceWitnesses'].append(copy.deepcopy(r['sourceWitnesses'][0])))
 def test_18_overclaim_pause(self):self.fails(lambda r:r['limits'].update(userVisiblePauseShortcutVerified=True))
 def test_19_bad_first_toggle(self):self.fails(lambda r:r['model'].update(firstEligibleHandlerAfterFFFFWrapsToZeroAndToggles=False))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--driver',required=True);a=p.parse_args();DRIVER=Path(a.driver).read_bytes();unittest.main(argv=[sys.argv[0]])
