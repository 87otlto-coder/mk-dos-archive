#!/usr/bin/env python3
"""O171-O173 adversarial regression; each case checks original byte/report fail closed."""
import argparse,copy,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import trace_o171_o173_interpreters_order as producer
import verify_o171_o173_independent as independent
P=None;EXE=None
class Verify(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.b=EXE;cls.r=producer.make(cls.b)
 def test_00_original(self):self.assertGreaterEqual(independent.check(self.b,self.r),80)
 def assert_invalid(self,fn):
  v=copy.deepcopy(self.r);fn(v)
  with self.assertRaises(ValueError):independent.check(self.b,v)
 def test_01_bad_program_sha(self):self.assert_invalid(lambda x:x['O171'].update(originalExeSHA256='0'*64))
 def test_02_bad_table_location(self):self.assert_invalid(lambda x:x['O171']['table'].update(object2Offset=0x800))
 def test_03_bad_target(self):self.assert_invalid(lambda x:x['O171']['table']['entries'][2].update(physicalHandler=0x63ef9))
 def test_04_bad_token(self):self.assert_invalid(lambda x:x['O171']['table']['entries'][0].update(token=9))
 def test_05_callback_lied(self):self.assert_invalid(lambda x:x['O171']['limits'].update(callbacksEverExecutedInFight=True))
 def test_06_unbounded_parser_lied(self):self.assert_invalid(lambda x:x['O171']['limits'].update(safeToBlindlyDecodeAllListsAsThisGrammar=True))
 def test_07_source_zero_lied(self):self.assert_invalid(lambda x:x['O171']['limits'].update(zeroTokenSetsCarry=True))
 def test_08_fps_lied(self):self.assert_invalid(lambda x:x['O171']['limits'].update(animationTimingKnown=True))
 def test_09_wrong_unknown(self):self.assert_invalid(lambda x:x['O171'].update(unknownCommand='call 0x640DF and set carry'))
 def test_10_first_report_witness_removed(self):self.assert_invalid(lambda x:x['O171']['witnesses'].pop())
 def test_11_second_report_witness_forged(self):self.assert_invalid(lambda x:x['O172']['witnesses'][0].update(originalBytes='00'))
 def test_12_special_flag_wrong(self):self.assert_invalid(lambda x:x['O172']['specialClass'].update(constructedPrefix=0x10000))
 def test_13_special_flag_confident(self):self.assert_invalid(lambda x:x['O172']['limits'].update(specialFlagMeaningFullyKnown=True))
 def test_14_normal_effect_fps_claimed(self):self.assert_invalid(lambda x:x['O172']['limits'].update(actualDrawStateProven=True))
 def test_15_wrong_sentinel(self):self.assert_invalid(lambda x:x['O172'].update(sourceLoopToken=4))
 def test_16_wrong_render_sort_field(self):self.assert_invalid(lambda x:x['O173'].update(insertKeyOffsets=[0x18,0x1c]))
 def test_17_wrong_traversal_field(self):self.assert_invalid(lambda x:x['O173']['positiveControlTokenToRenderer'].update(nextField=0x8))
 def test_18_overclaim_interlist(self):self.assert_invalid(lambda x:x['O173']['limits'].update(interListDrawOrderProven=True))
 def test_19_overclaim_sorted_after_motion(self):self.assert_invalid(lambda x:x['O173']['limits'].update(alwaysCurrentlySorted=True))
 def test_20_fake_observation(self):self.assert_invalid(lambda x:x['O173']['limits'].update(runtimeListContentsObserved=True))
 def test_21_changed_original_opcode(self):
  b=bytearray(self.b);b[0x63ea7]^=1
  with self.assertRaises(ValueError):producer.make(bytes(b))
 def test_22_changed_original_table(self):
  b=bytearray(self.b);b[0xa13f8]^=1
  with self.assertRaises(ValueError):independent.check(bytes(b),self.r)
 def test_23_source_origin_wrong(self):
  b=bytearray(self.b);b[0]^=1
  with self.assertRaises(ValueError):producer.make(bytes(b))
 def test_24_bad_duplicate_source(self):self.assert_invalid(lambda x:x['O173']['witnesses'].append(copy.deepcopy(x['O173']['witnesses'][0])))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);a=p.parse_args();EXE=Path(a.exe).read_bytes();unittest.main(argv=[sys.argv[0]],verbosity=1)
