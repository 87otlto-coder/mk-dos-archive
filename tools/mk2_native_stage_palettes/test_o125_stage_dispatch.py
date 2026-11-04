#!/usr/bin/env python3
"""O125 isolated positive and tamper regression tests for the three stage-root arrays."""
import copy,json,sys,tempfile,unittest
from pathlib import Path
from trace_o125_stage_dispatch import produce,assert_dispatch_instructions
from verify_o125_dispatch_independent import audit

class O125(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  if len(cls.files)!=1:raise unittest.SkipTest('Supply original canonical MK2.EXE')
  cls.orig=Path(cls.files[0]).read_bytes()
  cls.report=produce(cls.orig)
  cls.original_json=(json.dumps(cls.report,indent=2)+'\n').encode()
 def verify(self,record=None,game=None):
  return audit(game if game is not None else self.orig,
               (json.dumps(record if record is not None else self.report,indent=2)+'\n').encode())
 def corrupt(self,fn):
  x=copy.deepcopy(self.report);fn(x)
  with self.assertRaises(ValueError):self.verify(x)
 def test_original_source_authentication(self):self.assertEqual(len(self.orig),861133)
 def test_three_thirty_one_entry_tables(self):self.assertEqual([len(t['entries']) for t in self.report['tables'].values()],[31]*3)
 def test_all_three_share_missing_indices(self):
  for t in self.report['tables'].values():self.assertEqual([e['index'] for e in t['entries'] if e['rootObject2'] is None],[10,11,21])
 def test_exact_mode_sensitive_indices(self):self.assertEqual(self.report['changingIndicesByMode'],list(range(8)))
 def test_tomb_stage_index(self):
  for t in self.report['tables'].values():self.assertEqual(t['entries'][1]['stageResourceLabel'],'Kombat Tomb')
 def test_portal_stage_index(self):
  for t in self.report['tables'].values():self.assertEqual(t['entries'][7]['stageResourceLabel'],'The Portal')
 def test_tomb_mode_variants(self):
  self.assertEqual([t['entries'][1]['rootObject2'] for t in self.report['tables'].values()],[0x171f0,0x1726c,0x1726c])
 def test_portal_mode_variants(self):
  self.assertEqual([t['entries'][7]['rootObject2'] for t in self.report['tables'].values()],[0x16378,0x163d0,0x163d0])
 def test_all_eight_staging_pointers(self):
  self.assertEqual([e['fields'][-1] for e in self.report['stagingLoop']['entries']],[0x77453+4*n for n in range(8)])
 def test_source_is_read_only(self):
  import hashlib
  start=hashlib.sha256(self.orig).hexdigest();produce(self.orig);self.assertEqual(hashlib.sha256(self.orig).hexdigest(),start)
 def test_independent_reconstruction(self):self.assertGreaterEqual(self.verify()['verifiedAssertions'],280)
 def test_byte_for_byte_determinism(self):self.assertEqual(self.original_json,(json.dumps(produce(self.orig),indent=2)+'\n').encode())
 def test_reject_modified_exe(self):
  x=bytearray(self.orig);x[0x82334]^=1
  with self.assertRaises(ValueError):produce(bytes(x))
 def test_reject_short_exe(self):
  with self.assertRaises(ValueError):produce(self.orig[:-1])
 def test_reject_missing_table_slot(self):self.corrupt(lambda d:d['tables']['mode_equals_2']['entries'][1].update(rootObject2=0))
 def test_reject_changed_portal_variant(self):self.corrupt(lambda d:d['tables']['mode_other']['entries'][7].update(rootObject2=0x16378))
 def test_reject_forged_stage_name(self):self.corrupt(lambda d:d['tables']['mode_equals_1']['entries'][7].update(stageResourceLabel='Arena'))
 def test_reject_forged_setup_pointer(self):self.corrupt(lambda d:d['tables']['mode_equals_2']['entries'][1]['rootEvidence']['setupLinks'][0].update(setupObject2=0x16514))
 def test_reject_missing_setup_link(self):self.corrupt(lambda d:d['tables']['mode_equals_2']['entries'][1]['rootEvidence']['setupLinks'].pop())
 def test_reject_forged_root_hash(self):self.corrupt(lambda d:d['tables']['mode_equals_2']['entries'][7]['rootEvidence'].update(rootSHA256='0'*64))
 def test_reject_false_live_mode_claim(self):self.corrupt(lambda d:d['controlState'].update(runtimeModeValueObserved=True))
 def test_reject_false_runtime_index(self):self.corrupt(lambda d:d['controlState'].update(runtimeStageIndexObserved=True))
 def test_reject_fake_mode_difference(self):self.corrupt(lambda d:d.update(changingIndicesByMode=[0,1,2]))
 def test_reject_forged_null_slot(self):self.corrupt(lambda d:d['tables']['mode_other']['entries'][10].update(rootObject2=0x999))
 def test_reject_stage_count_inflation(self):self.corrupt(lambda d:d['tables']['mode_equals_2'].update(nonnull=29))
 def test_reject_forged_staging_slot(self):self.corrupt(lambda d:d['stagingLoop']['entries'][0]['fields'].__setitem__(3,0x77457))
 def test_reject_forged_instruction_signature(self):self.corrupt(lambda d:d['dispatchInstructionBytes'].update({'0x82353':'c3'}))
 def test_reject_changed_instruction_site_set(self):self.corrupt(lambda d:d['dispatchInstructionBytes'].pop('0x82353'))
 def test_reject_added_fake_runtime_field(self):self.corrupt(lambda d:d.update(runtimeHandle=1))
 def test_stage_root_provenance_complete(self):
  for table in self.report['tables'].values():
   for i in (1,7):
    self.assertTrue(table['entries'][i]['rootEvidence']['setupLinks'])
    self.assertEqual(table['entries'][i]['rootEvidence']['pointersAt14_18_1C'][-1]['targetObject2'],0x77453)

if __name__=='__main__':
 O125.files=sys.argv[1:];sys.argv=sys.argv[:1];unittest.main(verbosity=2)
