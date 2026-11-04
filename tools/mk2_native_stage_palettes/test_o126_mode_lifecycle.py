#!/usr/bin/env python3
"""Source-verified and adversarial regressions for O126 mode-lifecycle research."""
import copy,hashlib,json,sys,unittest
from pathlib import Path
from trace_o126_mode_lifecycle import produce
from verify_o126_mode_independent import verify

class OriginalModeLifecycle(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  if len(cls.files)!=1:raise unittest.SkipTest('Provide canonical MK2.EXE')
  cls.exe=Path(cls.files[0]).read_bytes()
  cls.report=produce(cls.exe)
  cls.serial=json.dumps(cls.report,indent=2)+'\n'
 def audit(self,r=None,exe=None):
  return verify(self.exe if exe is None else exe,
       (json.dumps(r if r is not None else self.report,indent=2)+'\n').encode())
 def corrupted(self,edit):
  c=copy.deepcopy(self.report);edit(c)
  with self.assertRaises(ValueError):self.audit(c)
 def test_independent_original_audit(self):self.assertGreaterEqual(self.audit()['checks'],200)
 def test_original_byte_fingerprint(self):self.assertEqual(self.report['originalExeSHA256'],hashlib.sha256(self.exe).hexdigest())
 def test_mode_literal_site_total(self):self.assertEqual(self.report['modeOperandCount'],27)
 def test_two_code_dispatch_paths(self):self.assertEqual(self.report['dispatch']['paths'],[0x82321,0x98ba7])
 def test_all_code_refs_are_relocated(self):self.assertEqual(len(self.report['codeOperandSites']),27)
 def test_conditional_mode_2_reset(self):
  self.assertEqual(self.report['integrityReset']['mismatchSetsModeTo'],2)
  self.assertFalse(self.report['integrityReset']['unconditionalStartupValueEstablished'])
 def test_two_scoped_temporary_mode_3_writes(self):
  self.assertEqual([s['write3Physical'] for s in self.report['temporaryOverrides']],[0x9b284,0x9b2de])
 def test_snapshot_destination(self):self.assertEqual(self.report['backupRestore']['savedCopyObject2Offset'],0x3030f)
 def test_index0_and4_mode1_fallback_distinction(self):self.assertEqual(self.report['dispatch']['mode1VersusFallbackDifferentIndices'],[0,4])
 def test_eight_changed_mode2_to1(self):self.assertEqual(self.report['dispatch']['mode2VersusMode1DifferentIndices'],list(range(8)))
 def test_tomb_mode1_is_fallback(self):
  d=self.report['dispatch']['tombRootIndex1'];self.assertEqual(d['mode_equals_1'],d['mode_other'])
 def test_portal_mode1_is_fallback(self):
  d=self.report['dispatch']['portalRootIndex7'];self.assertEqual(d['mode_equals_1'],d['mode_other'])
 def test_no_runtime_claims(self):self.assertFalse(any(self.report['runtimeObserved'].values()))
 def test_source_untouched(self):
  before=hashlib.sha256(self.exe).digest();produce(self.exe);self.assertEqual(before,hashlib.sha256(self.exe).digest())
 def test_deterministic_report(self):self.assertEqual(self.serial,json.dumps(produce(self.exe),indent=2)+'\n')
 def test_reject_wrong_program(self):
  changed=bytearray(self.exe);changed[0x9b284]^=1
  with self.assertRaises(ValueError):produce(bytes(changed))
 def test_reject_truncated_program(self):
  with self.assertRaises(ValueError):produce(self.exe[:-8])
 def test_reject_false_unconditional_mode(self):self.corrupted(lambda r:r['integrityReset'].update(unconditionalStartupValueEstablished=True))
 def test_reject_fake_live_handle(self):self.corrupted(lambda r:r['runtimeObserved'].update(paletteHandle=True))
 def test_reject_fake_live_mode(self):self.corrupted(lambda r:r['runtimeObserved'].update(selectedMode=2))
 def test_reject_altered_mode_global(self):self.corrupted(lambda r:r.update(modeObject2Offset=0x30148))
 def test_reject_removed_operand(self):self.corrupted(lambda r:r['codeOperandSites'].pop(5))
 def test_reject_forged_kind(self):self.corrupted(lambda r:r['codeOperandSites'][0].update(kind='compare_2'))
 def test_reject_forged_immediate(self):self.corrupted(lambda r:r['codeOperandSites'][0].update(constant=3))
 def test_reject_forged_instruction(self):self.corrupted(lambda r:r['anchoredInstructionSites']['temporary_mode_3_a'].update(bytes='90'))
 def test_reject_forged_tomb_root(self):self.corrupted(lambda r:r['dispatch']['tombRootIndex1'].update(mode_equals_2=0))
 def test_reject_forged_table_difference(self):self.corrupted(lambda r:r['dispatch'].update(mode1VersusFallbackDifferentIndices=[0]))
 def test_reject_forged_snapshot(self):self.corrupted(lambda r:r['backupRestore'].update(savedCopyObject2Offset=0x30323))
 def test_reject_forged_overrides(self):self.corrupted(lambda r:r['temporaryOverrides'][1].update(restoreModePhysical=0x9b2f8))
 def test_reject_extra_fabricated_field(self):self.corrupted(lambda r:r.update(verifiedRuntimeMode=3))

if __name__=='__main__':
 OriginalModeLifecycle.files=sys.argv[1:];sys.argv=sys.argv[:1];unittest.main(verbosity=2)
