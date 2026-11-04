#!/usr/bin/env python3
"""O134 producer/independent static-source regression; use original EXE."""
import argparse,copy,hashlib,json,unittest
from pathlib import Path
from trace_o134_stage_behavior_callbacks import produce
from verify_o134_callbacks_independent import audit
p=argparse.ArgumentParser();p.add_argument('--exe',required=True,type=Path);args=p.parse_args()
EXE=args.exe.read_bytes();RESULT=produce(EXE)
class Checks(unittest.TestCase):
 def test_schema(self):self.assertEqual(RESULT['schema'],'mk2_o134_stage_initializer_callback_sources_v1')
 def test_original_digest(self):self.assertEqual(hashlib.sha256(EXE).hexdigest(),RESULT['exeSHA256'])
 def test_callback_count(self):self.assertEqual(len(RESULT['firstTenStages']),10)
 def test_mode_repeats(self):
  for x in RESULT['firstTenStages']:
   with self.subTest(x=x['stageIndex']):self.assertEqual(len({y['callbackObject1'] for y in x['modeCandidates']}),1)
 def test_tomb_callback(self):self.assertEqual(RESULT['examinedBehaviorCandidates']['tomb']['callbackPhysical'],0x82cd7)
 def test_portal_callback(self):self.assertEqual(RESULT['examinedBehaviorCandidates']['portal']['callbackPhysical'],0x8272a)
 def test_two_tomb_calls(self):self.assertEqual(RESULT['examinedBehaviorCandidates']['tomb']['registrationSiteCount'],2)
 def test_four_portal_calls(self):self.assertEqual(RESULT['examinedBehaviorCandidates']['portal']['registrationSiteCount'],4)
 def test_distinct_targets(self):
  self.assertEqual([len(RESULT['examinedBehaviorCandidates'][s]['distinctFunctionTargets']) for s in ('tomb','portal')],[2,3])
 def test_no_invented_frames(self):self.assertFalse(RESULT['limitations']['animationFramesRecovered'])
 def test_no_invented_timing(self):self.assertFalse(RESULT['limitations']['animationLoopOrTimingRecovered'])
 def test_no_invented_runtime(self):self.assertFalse(RESULT['limitations']['registeredFunctionsExecuteDuringFight'])
 def test_independent(self):self.assertGreater(audit(EXE,RESULT)['assertions'],100)
 def test_mutated_exe_rejected(self):
  b=bytearray(EXE);b[0x82793+1]^=1
  with self.assertRaises(ValueError):produce(bytes(b))
 def test_mutated_exe_elsewhere_rejected(self):
  b=bytearray(EXE);b[0x82cd7]^=1
  with self.assertRaises(ValueError):produce(bytes(b))
 def bogus(self,fn):
  result=copy.deepcopy(RESULT);fn(result)
  with self.assertRaises(AssertionError):audit(EXE,result)
 def test_forged_callback(self):self.bogus(lambda x:x['firstTenStages'][7].__setitem__('callbackPhysical',0x8272b))
 def test_forged_mode_pointer(self):self.bogus(lambda x:x['firstTenStages'][1]['modeCandidates'][0].__setitem__('callbackObject1',0))
 def test_forged_register_call(self):self.bogus(lambda x:x['examinedBehaviorCandidates']['tomb']['registrations'][0].__setitem__('registerRoutinePhysical',0))
 def test_forged_behavior_address(self):self.bogus(lambda x:x['examinedBehaviorCandidates']['portal']['registrations'][1].__setitem__('registeredFunctionObject1',1))
 def test_forged_field_write(self):self.bogus(lambda x:x.__setitem__('portalObjectFieldWrites',[1,2,3]))
 def test_forged_frame_proof(self):self.bogus(lambda x:x['limitations'].__setitem__('animationFramesRecovered',True))
 def test_forged_runtime_proof(self):self.bogus(lambda x:x['limitations'].__setitem__('registeredFunctionsExecuteDuringFight',True))
 def test_forged_timing(self):self.bogus(lambda x:x['limitations'].__setitem__('animationLoopOrTimingRecovered',True))
 def test_forged_native_extent(self):self.bogus(lambda x:x['limitations'].__setitem__('sourceGraphicsRemainUncropped',False))
if __name__=='__main__':unittest.main(argv=['test_o134_callbacks.py'],verbosity=1)
