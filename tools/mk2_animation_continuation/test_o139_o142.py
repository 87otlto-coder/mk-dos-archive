#!/usr/bin/env python3
"""Hostile mutation/regression tests on original MK2 fixture. Requires original EXE."""
import argparse,copy,importlib.util,json,sys,unittest
from pathlib import Path
ROOT=Path(__file__).parent
for n in ('trace_o139_o141','verify_o139_o141_independent','trace_o142_initial_spatial_inputs','verify_o142_independent','trace_o143_renderer_registration','verify_o143_independent','trace_o144_stage_position_normalization','verify_o144_independent'):
 spec=importlib.util.spec_from_file_location(n,ROOT/(n+'.py'));mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);globals()[n]=mod
EXE=None
class TestStaticContinuation(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.exe=EXE;cls.reports=trace_o139_o141.make_reports(EXE);cls.o142=trace_o142_initial_spatial_inputs.trace(EXE);cls.o143=trace_o143_renderer_registration.analyze(EXE);cls.o144=trace_o144_stage_position_normalization.produce(EXE)
 def test_producer_canonical_fixture(self):self.assertEqual(set(self.reports),{'O139','O140','O141'})
 def test_independent_source_consumer(self):self.assertEqual(verify_o139_o141_independent.verify(self.exe,self.reports)['assertions'],328)
 def test_independent_spatial(self):self.assertEqual(verify_o142_independent.verify(self.exe,self.o142)['assertions'],68)
 def test_corrupt_executable(self):
  b=bytearray(self.exe);b[0x82737]^=1
  with self.assertRaises((ValueError,AssertionError)):trace_o142_initial_spatial_inputs.trace(bytes(b))
  with self.assertRaises((ValueError,AssertionError)):verify_o139_o141_independent.verify(bytes(b),self.reports)
 def test_producer_rejects_wrong_original(self):
  b=bytearray(self.exe);b[0x86ccb]^=1
  with self.assertRaises(ValueError):trace_o139_o141.make_reports(bytes(b))
 def test_audit_rejects_wrong_executable(self):
  b=bytearray(self.exe);b[0x937d3]^=1
  with self.assertRaises(AssertionError):verify_o139_o141_independent.verify(bytes(b),self.reports)
 def test_source_report_fake_verified_fps(self):
  r=copy.deepcopy(self.reports);r['O140']['notEstablished'].remove('wall clock seconds per effect frame')
  with self.assertRaises(AssertionError):verify_o139_o141_independent.verify(self.exe,r)
 def test_source_report_fake_world_positions(self):
  r=copy.deepcopy(self.reports);r['O141']['notEstablished'].remove('actual in-game world position')
  with self.assertRaises(AssertionError):verify_o139_o141_independent.verify(self.exe,r)
 def test_source_report_fake_runtime_visibility(self):
  r=copy.deepcopy(self.reports);r['O139']['notEstablished'].remove('effect actually visible')
  with self.assertRaises(AssertionError):verify_o139_o141_independent.verify(self.exe,r)
 def test_swapped_origin_list(self):
  r=copy.deepcopy(self.reports);r['O140']['frameTracks'][2]['originalListObject2']=0x16490
  with self.assertRaises(AssertionError):verify_o139_o141_independent.verify(self.exe,r)
 def test_forged_original_descriptor(self):
  r=copy.deepcopy(self.reports);r['O140']['frameTracks'][0]['originalDescriptorPointersObject2'][0]^=4
  with self.assertRaises(AssertionError):verify_o139_o141_independent.verify(self.exe,r)
 def test_forged_countdown(self):
  r=copy.deepcopy(self.reports);r['O140']['sourceCountdownInitialValues']['portalSwayAndTower']=5
  with self.assertRaises(AssertionError):verify_o139_o141_independent.verify(self.exe,r)
 def test_forged_scheduler_wait(self):
  r=copy.deepcopy(self.reports);r['O140']['sourceSchedulerYields']['portalElectric']=4
  with self.assertRaises(AssertionError):verify_o139_o141_independent.verify(self.exe,r)
 def test_wrong_render_pointer_field(self):
  r=copy.deepcopy(self.reports);r['O139']['taskSavedRenderObjectField']=0x1c
  with self.assertRaises(AssertionError):verify_o139_o141_independent.verify(self.exe,r)
 def test_fake_edge(self):
  r=copy.deepcopy(self.reports);r['O139']['source']['edges']['towerToSharedHelper']['targetPhysical']=0x8280c
  with self.assertRaises(AssertionError):verify_o139_o141_independent.verify(self.exe,r)
 def test_forged_object_anchor(self):
  r=copy.deepcopy(self.reports);r['O141']['objectPositionFixedPointFields']=[0x1a,0x1e]
  with self.assertRaises(AssertionError):verify_o139_o141_independent.verify(self.exe,r)
 def test_fake_coordinate(self):
  r=copy.deepcopy(self.o142);r['sourceArgumentSites'][0]['initialObjectHighWordAtPlus1A']=421
  with self.assertRaises(AssertionError):verify_o142_independent.verify(self.exe,r)
 def test_fake_packed_coordinate(self):
  r=copy.deepcopy(self.o142);r['sourceArgumentSites'][2]['packedOriginalEDXSourceImmediate']=0x630241
  with self.assertRaises(AssertionError):verify_o142_independent.verify(self.exe,r)
 def test_fake_stage_link(self):
  r=copy.deepcopy(self.o142);r['sourceArgumentSites'][2]['stage']='Portal'
  with self.assertRaises(AssertionError):verify_o142_independent.verify(self.exe,r)
 def test_fake_real_world_position_claim(self):
  r=copy.deepcopy(self.o142);r['sourceArgumentSites'][1]['qualifiedAsRuntimeWorldCoordinate']=True
  with self.assertRaises(AssertionError):verify_o142_independent.verify(self.exe,r)
 def test_fake_live_activation(self):
  r=copy.deepcopy(self.o142);r['limits']['runtimeObjectInstancesVerified']=True
  with self.assertRaises(AssertionError):verify_o142_independent.verify(self.exe,r)
 def test_fake_timing(self):
  r=copy.deepcopy(self.o142);r['limits']['timingVerified']=True
  with self.assertRaises(AssertionError):verify_o142_independent.verify(self.exe,r)
 def test_independent_renderer_registration(self):
  self.assertEqual(verify_o143_independent.verify(self.exe,self.o143)['assertions'],52)
 def test_forged_draw_traversal(self):
  r=copy.deepcopy(self.o143);r['limits']['actualRendererDrawTraversalVerified']=True
  with self.assertRaises(AssertionError):verify_o143_independent.verify(self.exe,r)
 def test_forged_sort_order(self):
  r=copy.deepcopy(self.o143);r['sortKeys'].reverse()
  with self.assertRaises(AssertionError):verify_o143_independent.verify(self.exe,r)
 def test_forged_occlusion(self):
  r=copy.deepcopy(self.o143);r['limits']['finalCompositingOcclusionVerified']=True
  with self.assertRaises(AssertionError):verify_o143_independent.verify(self.exe,r)
 def test_forged_tomb_list(self):
  r=copy.deepcopy(self.o143);r['listHeadSelectedBySource']['tomb']='0x84344'
  with self.assertRaises(AssertionError):verify_o143_independent.verify(self.exe,r)
 def test_forged_object_link(self):
  r=copy.deepcopy(self.o143);r['objectNextLinkOffset']=4
  with self.assertRaises(AssertionError):verify_o143_independent.verify(self.exe,r)
 def test_forged_registration_jump(self):
  r=copy.deepcopy(self.o143);r['originalTailJumps'][0]['target']=0x66600
  with self.assertRaises(AssertionError):verify_o143_independent.verify(self.exe,r)
 def test_render_corruption_rejected(self):
  b=bytearray(self.exe);b[0x66624]^=1
  with self.assertRaises(ValueError):trace_o143_renderer_registration.analyze(bytes(b))
  with self.assertRaises(AssertionError):verify_o143_independent.verify(bytes(b),self.o143)
 def test_independent_stage_position_normalization(self):
  self.assertEqual(verify_o144_independent.verify(self.exe,self.o144)['assertions'],62)
 def test_forged_normalization_list_root(self):
  r=copy.deepcopy(self.o144);r['sourceListNormalizationSites'][2]['listHeadAddress']=0x84344
  with self.assertRaises(AssertionError):verify_o144_independent.verify(self.exe,r)
 def test_forged_normalization_offset(self):
  r=copy.deepcopy(self.o144);r['sourceListNormalizationSites'][1]['horizontalSourceSignedWordAddress']=0x8431e
  with self.assertRaises(AssertionError):verify_o144_independent.verify(self.exe,r)
 def test_forged_normalization_runtime_values(self):
  r=copy.deepcopy(self.o144);r['limits']['offsetActualRuntimeValuesKnown']=True
  with self.assertRaises(AssertionError):verify_o144_independent.verify(self.exe,r)
 def test_forged_normalization_runtime_draw(self):
  r=copy.deepcopy(self.o144);r['limits']['drawRasterTraversalVerified']=True
  with self.assertRaises(AssertionError):verify_o144_independent.verify(self.exe,r)
 def test_forged_normalization_physical(self):
  r=copy.deepcopy(self.o144);r['normalizerPhysical']=0x8050c
  with self.assertRaises(AssertionError):verify_o144_independent.verify(self.exe,r)
 def test_reject_corrupted_normalizer_source(self):
  b=bytearray(self.exe);b[0x80528]^=1
  with self.assertRaises(ValueError):trace_o144_stage_position_normalization.produce(bytes(b))
  with self.assertRaises(AssertionError):verify_o144_independent.verify(bytes(b),self.o144)
 def test_negative_coordinate_arithmetic(self):
  q=trace_o142_initial_spatial_inputs.translated_s16
  self.assertEqual(q(0xfffc),-3)
  self.assertEqual(q(0x8000),-24576)
 def test_original_stages_and_computed_coordinates(self):
  rows=self.o142['sourceArgumentSites']
  self.assertEqual([(r['stage'],r['initialObjectHighWordAtPlus1A'],r['initialObjectHighWordAtPlus1E']) for r in rows],
     [('Portal',420,71),('Portal',594,71),('Tower',432,75)])
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True);args=a.parse_args();EXE=Path(args.exe).read_bytes()
 # No unittest flag passthrough by design.
 unittest.main(argv=[sys.argv[0]],verbosity=2)
