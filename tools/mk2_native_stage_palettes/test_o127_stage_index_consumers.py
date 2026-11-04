#!/usr/bin/env python3
"""O127 static caller/source-render bridge regressions and hostile report checks."""
from __future__ import annotations
import copy,hashlib,json,sys,unittest
from pathlib import Path
from trace_o127_stage_index_consumers import produce
from verify_o127_index_consumers_independent import verify

class StaticCallerAndRenderTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.exe=Path(cls.files[0]).read_bytes()
  cls.report=produce(cls.exe)
 def audit(self,report=None,exe=None):
  return verify(self.exe if exe is None else exe,(json.dumps(self.report if report is None else report,indent=2)+'\n').encode())
 def forged(self,edit):
  r=copy.deepcopy(self.report);edit(r)
  with self.assertRaises(ValueError):self.audit(r)
 def test_independent_verifier(self):self.assertGreaterEqual(self.audit()['assertions'],170)
 def test_reproducible(self):self.assertEqual(produce(self.exe),self.report)
 def test_canonical_exe_hash(self):self.assertEqual(self.report['sourceExeSHA256'],hashlib.sha256(self.exe).hexdigest())
 def test_nine_callers(self):self.assertEqual(self.report['directCallerCount'],9)
 def test_verified_stage_constants(self):
  got={x['callPhysical']:x['immediatePreCallValue'] for x in self.report['directCallers'] if 'immediatePreCallValue' in x}
  self.assertEqual(got,{0x771e6:7,0x77a08:6,0x77d8b:5,0x84eee:30,0x85fae:13})
 def test_unknown_three_callers(self):
  unresolved=[x for x in self.report['directCallers'] if x['sourceClassification'].startswith('unresolved')]
  self.assertEqual([x['callPhysical'] for x in unresolved],[0x84d32,0x94965])
 def test_original_stage_selection_dynamic(self):
  a=self.report['directCallers'][0];self.assertEqual(a['possibleSourceFields'],[0x76512,0x2cff6]);self.assertEqual(a['overrideDecrements'],1)
 def test_two_intervening_calls_are_not_silently_ignored(self):
  x=self.report['directCallers'][1];self.assertEqual(x['interveningCalls'],[0x758c2,0x758c7]);self.assertNotIn('immediatePreCallValue',x)
 def test_index_30_restored(self):
  x=next(z for z in self.report['directCallers'] if z['callPhysical']==0x84eee)
  self.assertEqual(x['priorScratchRestoredPhysical'],0x84ef3)
 def test_index_snapshot_typed_refs(self):self.assertEqual(self.report['snapshot']['directRelocatedSitesForSavedIndex'],[0x82327,0x9e166])
 def test_scratch_overwritten_with_root(self):self.assertEqual(self.report['snapshot']['overwriteScratchWithRootPhysical'],0x82355)
 def test_renderer_31_DWORDs(self):self.assertEqual(len(self.report['renderer']['renderTableDWORDs']),31)
 def test_renderer_no_local_guard(self):self.assertFalse(self.report['renderer']['directTableIndexGuardPresentBetweenLoadAndAdd'])
 def test_render_table_has_zero_slots(self):
  vals=self.report['renderer']['renderTableDWORDs'];self.assertEqual([i for i in range(10) if vals[i]==0],[0,6,9])
 def test_portal_index_adjust_not_tomb_adjust(self):
  x=self.report['renderer']['renderTableDWORDs'];self.assertNotEqual(x[1],x[7])
 def test_no_live_camera_or_index(self):
  self.assertFalse(self.report['renderer']['runtimeRendererValuesObserved']);self.assertFalse(self.report['otherSelector']['runtimeValueProven'])
 def test_original_unchanged(self):
  h=hashlib.sha256(self.exe).digest();produce(self.exe);self.assertEqual(hashlib.sha256(self.exe).digest(),h)
 def test_wrong_program_rejected(self):
  b=bytearray(self.exe);b[0x9e16a]^=1
  with self.assertRaises(ValueError):produce(bytes(b))
 def test_truncation_rejected(self):
  with self.assertRaises(ValueError):produce(self.exe[:-1])
 def test_extra_schema_claim_rejected(self):self.forged(lambda r:r.update(liveCamera=42))
 def test_fake_live_value_rejected(self):self.forged(lambda r:r['renderer'].update(runtimeRendererValuesObserved=True))
 def test_fake_other_dispatch_runtime_rejected(self):self.forged(lambda r:r['otherSelector'].update(runtimeValueProven=True))
 def test_forged_caller_rejected(self):self.forged(lambda r:r['directCallers'][0].update(callPhysical=0x74d4e))
 def test_removed_caller_rejected(self):self.forged(lambda r:r['directCallers'].pop(3))
 def test_forged_constant_rejected(self):self.forged(lambda r:r['directCallers'][3].update(immediatePreCallValue=7))
 def test_wrong_root_rejected(self):self.forged(lambda r:r['directCallers'][3]['configurationRootByMode'].update(mode_equals_2=0))
 def test_forged_renderer_table_byte_rejected(self):self.forged(lambda r:r['renderer']['renderTableDWORDs'].__setitem__(7,12345))
 def test_wrong_renderer_table_address_rejected(self):self.forged(lambda r:r['renderer'].update(indexTableObject2=0x2ef58))
 def test_fake_local_guard_rejected(self):self.forged(lambda r:r['renderer'].update(directTableIndexGuardPresentBetweenLoadAndAdd=True))
 def test_fake_renderer_hash_rejected(self):self.forged(lambda r:r['renderer'].update(renderTableSHA256='0'*64))
 def test_missing_uncertainty_rejected(self):self.forged(lambda r:r.update(limitations=[]))
 def test_forged_index_save_rejected(self):self.forged(lambda r:r['snapshot'].update(saveIndexObject2=0x75a80))
 def test_forged_code_reference_rejected(self):self.forged(lambda r:r['snapshot']['directRelocatedSitesForSavedIndex'].__setitem__(1,0x9e168))
 def test_forged_mode_ref_rejected(self):self.forged(lambda r:r['directCallers'][4]['configurationRootByMode'].update(mode_equals_1=0))
if __name__=='__main__':
 if len(sys.argv)!=2:raise SystemExit('usage: test_o127_stage_index_consumers.py ORIGINAL_MK2.EXE')
 StaticCallerAndRenderTests.files=sys.argv[1:];sys.argv=sys.argv[:1];unittest.main(verbosity=2)
