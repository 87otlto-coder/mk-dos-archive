#!/usr/bin/env python3
"""O135 hostile source report tests, machine-code checks and export metadata coverage."""
import argparse,copy,hashlib,json,sys,unittest
from pathlib import Path
from trace_o135_stage_effect_coroutines import analyze
from verify_o135_stage_effect_coroutines_independent import audit
p=argparse.ArgumentParser();p.add_argument('--exe',type=Path,required=True);a=p.parse_args();sys.argv=sys.argv[:1]
EXE=a.exe.read_bytes();REPORT=analyze(EXE)
class Tests(unittest.TestCase):
 def test_digest(self):self.assertEqual(REPORT['canonicalExeSHA256'],hashlib.sha256(EXE).hexdigest())
 def test_schema(self):self.assertTrue(REPORT['schema'].startswith('mk2_o135_'))
 def test_scheduler_registration(self):self.assertEqual(REPORT['scheduler']['registrationPhysical'],0x67222)
 def test_scheduler_resume(self):self.assertEqual(REPORT['scheduler']['resumeContinuationJumpPhysical'],0x67185)
 def test_scheduler_counter(self):self.assertEqual(REPORT['scheduler']['savedCountFieldOffset'],6)
 def test_scheduler_units_unknown(self):self.assertTrue(REPORT['scheduler']['countsAreNotSecondsOrProvenRenderFrames'])
 def test_tomb_functions(self):self.assertEqual({f['functionPhysical'] for f in REPORT['stages']['tomb']['functions']},{0x82d33,0x82d9a})
 def test_portal_functions(self):self.assertEqual({f['functionPhysical'] for f in REPORT['stages']['portal']['functions']},{0x8280c,0x828ff,0x8291f})
 def test_tomb_pointer_targets(self):self.assertEqual([x['targetObject2'] for x in REPORT['stages']['tomb']['sourcePointerAssignments']],[0x17814,0x177ec])
 def test_tomb_yield_counts(self):self.assertEqual(REPORT['stages']['tomb']['postLoopYieldCount'],96)
 def test_tomb_thresholds(self):self.assertEqual(REPORT['stages']['tomb']['comparisonThresholds'],[48,108])
 def test_portal_bounds(self):self.assertEqual((REPORT['stages']['portal']['boundedUpdate']['positiveThreshold'],REPORT['stages']['portal']['boundedUpdate']['negativeThreshold']),(24576,-24576))
 def test_portal_source_steps(self):self.assertEqual(len(REPORT['stages']['portal']['boundedUpdate']['sourceAscendingValues']),16)
 def test_portal_source_descend(self):self.assertEqual(len(REPORT['stages']['portal']['boundedUpdate']['sourceDescendingValues']),64)
 def test_unrecovered_frame_order(self):self.assertFalse(REPORT['limitations']['animationFrameSequenceRecovered'])
 def test_unrecovered_clock(self):self.assertFalse(REPORT['limitations']['animationFrameTimingRecovered'])
 def test_unrecovered_sprite_binding(self):self.assertFalse(REPORT['limitations']['specificSpriteBindingRecovered'])
 def test_unrecovered_parallax(self):self.assertFalse(REPORT['limitations']['parallaxRelativeToCameraRecovered'])
 def test_audit(self):self.assertGreater(audit(EXE,REPORT)['assertions'],160)
 def test_wrong_exe_rejected(self):
  mutated=bytearray(EXE);mutated[0x82849+2]^=1
  with self.assertRaises(ValueError):analyze(mutated)
 def test_wrong_exe_header_rejected(self):
  with self.assertRaises(ValueError):analyze(EXE[:-1])
 def forged(self,edit):
  altered=copy.deepcopy(REPORT);edit(altered)
  with self.assertRaises(AssertionError):audit(EXE,altered)
 def test_forged_scheduler(self):self.forged(lambda x:x['scheduler'].__setitem__('yieldPhysical',0))
 def test_forged_counter_units(self):self.forged(lambda x:x['scheduler'].__setitem__('countsAreNotSecondsOrProvenRenderFrames',False))
 def test_forged_sprite_binding(self):self.forged(lambda x:x['limitations'].__setitem__('specificSpriteBindingRecovered',True))
 def test_forged_frame_timing(self):self.forged(lambda x:x['limitations'].__setitem__('animationFrameTimingRecovered',True))
 def test_forged_frame_sequence(self):self.forged(lambda x:x['limitations'].__setitem__('animationFrameSequenceRecovered',True))
 def test_forged_parallax(self):self.forged(lambda x:x['limitations'].__setitem__('parallaxRelativeToCameraRecovered',True))
 def test_forged_portal_step(self):self.forged(lambda x:x['stages']['portal']['boundedUpdate']['sourceAscendingValues'].__setitem__(0,0))
 def test_forged_portal_object_field(self):self.forged(lambda x:x['stages']['portal']['boundedUpdate'].__setitem__('objectFieldWritten',0x10))
 def test_forged_tomb_pointer(self):self.forged(lambda x:x['stages']['tomb']['sourcePointerAssignments'][0].__setitem__('targetObject2',0))
 def test_forged_target_hash(self):self.forged(lambda x:x['stages']['portal']['functions'][0].__setitem__('examinedBytesSHA256','0'*64))
 def test_forged_portal_wait(self):self.forged(lambda x:x['stages']['portal']['boundedUpdate'].__setitem__('positiveYieldPhysical',0))
 def test_forged_tomb_threshold(self):self.forged(lambda x:x['stages']['tomb'].__setitem__('comparisonThresholds',[48,109]))
 def test_forged_portal_count(self):self.forged(lambda x:x['stages']['portal'].__setitem__('alternateRoutineCounterInitial',1))
if __name__=='__main__':unittest.main(verbosity=2)
