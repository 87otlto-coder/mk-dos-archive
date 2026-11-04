#!/usr/bin/env python3
"""O130 independent regression including adversarial evidence and safety checks."""
import copy,hashlib,json,subprocess,sys,tempfile,unittest
from pathlib import Path
from trace_o130_dynamic_stage_streams import produce
from verify_o130_dynamic_stage_streams_independent import verify
P=Path(sys.argv[1]);B=P.read_bytes();R=produce(B);RAW=(json.dumps(R,indent=2)+'\n').encode()
class Tests(unittest.TestCase):
 def reject(self,mutate):
  j=copy.deepcopy(R);mutate(j)
  with self.assertRaises((AssertionError,ValueError,KeyError)):
   verify(B,(json.dumps(j)+'\n').encode())
 def test_01_source_digest(self):self.assertEqual(R['sourceExeSHA256'],hashlib.sha256(B).hexdigest())
 def test_02_independent_pass(self):self.assertGreaterEqual(verify(B,RAW)['assertions'],1000)
 def test_03_3_tables(self):self.assertEqual(len(R['rootTables']),3)
 def test_04_31_entries_each(self):self.assertEqual([len(v) for v in R['rootTables'].values()],[31]*3)
 def test_05_distinct_roots(self):self.assertEqual(len(R['rootRecords']),38)
 def test_06_distinct_streams(self):self.assertEqual(len(R['streams']),10)
 def test_07_seven_packed_renderer_commands(self):self.assertEqual([x['configurationIndex'] for x in R['firstTenConfigurationSummary'] if x['drawCount']],[1,2,3,4,5,7,8])
 def test_08_no_draw_indices(self):self.assertEqual([x['configurationIndex'] for x in R['firstTenConfigurationSummary'] if not x['drawCount']],[0,6,9])
 def test_09_tomb_source(self):self.assertEqual((R['firstTenConfigurationSummary'][1]['resourceName'],R['firstTenConfigurationSummary'][1]['streamObject2']),('TOMB.GRA',0x17300))
 def test_10_portal_source(self):self.assertEqual((R['firstTenConfigurationSummary'][7]['resourceName'],R['firstTenConfigurationSummary'][7]['streamObject2']),('PORTAL.GRA',0x16440))
 def test_11_armory_source_pointer_distinct(self):self.assertEqual(R['firstTenConfigurationSummary'][5]['drawCommands'][0]['sourcePointerObject2'],0x84312)
 def test_12_other_six_source_pointer(self):self.assertEqual({R['firstTenConfigurationSummary'][i]['drawCommands'][0]['sourcePointerObject2'] for i in (1,2,3,4,7,8)},{0x8432A})
 def test_13_draw_lengths(self):self.assertTrue(all(x['lengthBytes']%4==0 for x in R['streams']))
 def test_14_root_dynamic_pointer_offsets(self):self.assertTrue(all(r['streamFieldObject2']==r['rootObject2']+24 for r in R['rootRecords']))
 def test_15_mode_variants_same_stream(self):
  self.assertTrue(all(len({R['rootTables'][m][i]['streamObject2'] for m in R['rootTables']})==1 for i in range(10)))
 def test_16_live_claims_false(self):self.assertFalse(R['trace']['allPointersLoadedAtRuntimeObserved'])
 def test_17_tomb_parameter_values(self):self.assertEqual([R['firstTenConfigurationSummary'][1]['drawCommands'][0][x] for x in ('rawParameter2','rawParameter3')],[158,56])
 def test_18_portal_parameter_values(self):self.assertEqual([R['firstTenConfigurationSummary'][7]['drawCommands'][0][x] for x in ('rawParameter2','rawParameter3')],[164,40])
 def test_19_resource_names(self):self.assertEqual([x['resourceName'] for x in R['firstTenConfigurationSummary']],['DEDPOOL.GRA','TOMB.GRA','BATTLE.GRA','TOWER.GRA','FOREST.GRA','ARMORY.GRA','PIT.GRA','PORTAL.GRA','ARENA.GRA','CAVE.GRA'])
 def test_20_tampered_exe_rejected(self):
  b=bytearray(B);b[0x81f55]^=1
  with self.assertRaises(ValueError):produce(bytes(b))
 def test_21_tampered_exe_independent_rejected(self):
  b=bytearray(B);b[0x93585]^=1
  with self.assertRaises(AssertionError):verify(bytes(b),RAW)
 def test_22_forged_root_pointer_rejected(self):self.reject(lambda j:j['rootTables']['mode_equals_2'][1].__setitem__('rootObject2',0x17300))
 def test_23_forged_draw_count_rejected(self):self.reject(lambda j:j['firstTenConfigurationSummary'][7].__setitem__('drawCount',0))
 def test_24_forged_draw_arg_rejected(self):self.reject(lambda j:j['streams'][0]['operations'][0].__setitem__('object2Offset',0))
 def test_25_forged_source_record_rejected(self):self.reject(lambda j:j['rootRecords'][0].__setitem__('streamFieldObject2',0xdead))
 def test_26_forged_stream_hash_rejected(self):self.reject(lambda j:j['streams'][2].__setitem__('sourceSHA256','0'*64))
 def test_27_forged_ui_draw_indices_rejected(self):self.reject(lambda j:j['firstTenConfigurationSummary'][6].__setitem__('drawCount',1))
 def test_28_forged_runtime_claim_rejected(self):self.reject(lambda j:j['trace'].__setitem__('allPointersLoadedAtRuntimeObserved',True))
 def test_29_forged_opcode_path_rejected(self):self.reject(lambda j:j['trace'].__setitem__('streamPointerLoadPhysical',0x81F56))
 def test_30_forged_table_extent_rejected(self):self.reject(lambda j:j['rootTables']['mode_other'].pop())
 def test_31_forged_terminator_rejected(self):self.reject(lambda j:j['streams'][4].__setitem__('terminatorObject2',0))
 def test_32_forged_stage_family_rejected(self):self.reject(lambda j:j['firstTenConfigurationSummary'][1].__setitem__('resourceName','PORTAL.GRA'))
 def test_33_forged_guard_rejected(self):self.reject(lambda j:j['trace'].__setitem__('gateGlobalObject2',0x0))
 def test_34_append_unexpected_evidence_rejected(self):self.reject(lambda j:j.__setitem__('runtimeObserved',True))
 def test_35_cli_refuses_overwrite(self):
  with tempfile.TemporaryDirectory() as t:
   out=Path(t)/'data.json';out.write_bytes(RAW)
   cp=subprocess.run([sys.executable,str(Path(__file__).with_name('trace_o130_dynamic_stage_streams.py')),'--exe',str(P),'--out',str(out)],capture_output=True,text=True)
   self.assertNotEqual(cp.returncode,0);self.assertEqual(out.read_bytes(),RAW)
 def test_36_report_serialization_stable(self):self.assertEqual(verify(B,RAW)['reportSHA256'],hashlib.sha256(RAW).hexdigest())
if __name__=='__main__':unittest.main(argv=[sys.argv[0]],verbosity=1)
