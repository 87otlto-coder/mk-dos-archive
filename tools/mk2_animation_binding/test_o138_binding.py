#!/usr/bin/env python3
import argparse,copy,json,sys,unittest
from pathlib import Path
from trace_o138_effect_binding import produce
from verify_o138_independent import verify
p=argparse.ArgumentParser();p.add_argument('--exe',type=Path,required=True);a=p.parse_args();sys.argv=sys.argv[:1]
EXE=a.exe.read_bytes();REPORT=produce(EXE)
class Tests(unittest.TestCase):
 def tamper(self,edit):
  bad=copy.deepcopy(REPORT);edit(bad)
  with self.assertRaises((AssertionError,KeyError)):verify(EXE,bad)
 def test_canonical_original(self):self.assertEqual(REPORT['totalOriginalFrames'],43)
 def test_independent_verifier(self):self.assertGreaterEqual(verify(EXE,REPORT)['assertions'],60)
 def test_six_original_lists(self):self.assertEqual(len(REPORT['sourceLists']),6)
 def test_source_order_only(self):self.assertTrue(all(x['sourceOrderedNotRuntimeTimed'] for x in REPORT['sourceLists']))
 def test_source_consumer_code(self):self.assertEqual(REPORT['consumerFunctionPhysical'],0x9377c)
 def test_list_reader(self):self.assertEqual(REPORT['sourceReaderPhysical'],0x86cc5)
 def test_no_fps(self):self.assertFalse(REPORT['limits']['animationFPSKnown'])
 def test_no_visibility_proof(self):self.assertFalse(REPORT['limits']['actualSpriteVisibilityVerified'])
 def test_forged_object_field(self):self.tamper(lambda x:x.__setitem__('consumerObjectDescriptorField',0x40))
 def test_forged_pointer(self):self.tamper(lambda x:x['sourceLists'][0]['rawSourceDescriptorPointersObject2'].__setitem__(0,1))
 def test_forged_order(self):self.tamper(lambda x:x['sourceLists'][1].__setitem__('sourceListObject2',0x1000))
 def test_forged_timing(self):self.tamper(lambda x:x['limits'].__setitem__('animationFPSKnown',True))
 def test_forged_world_position(self):self.tamper(lambda x:x['limits'].__setitem__('spriteWorldPositionKnown',True))
 def test_forged_machine_word(self):self.tamper(lambda x:x['witnessInstructions']['consumerWriteNextDescriptorPointer'].__setitem__('bytes','000000'))
 def test_corrupted_original(self):
  with self.assertRaises(ValueError):produce(EXE[:-1])
if __name__=='__main__':unittest.main(verbosity=1)
