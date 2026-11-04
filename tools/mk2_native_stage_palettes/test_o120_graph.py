#!/usr/bin/env python3
"""Negative controls for O120 independent graph verifier. Pass original MK2.EXE path."""
import copy,importlib.util,json,sys,tempfile,unittest
from pathlib import Path
SCRIPT=Path(__file__).with_name('verify_o120_independent.py')
spec=importlib.util.spec_from_file_location('o120_independent',SCRIPT)
v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
REPORT=Path(__file__).resolve().parents[2]/'research_outputs'/'O120_STAGE_PALETTE_SETUP_GRAPH.json'

class TestO120(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.exe=Path(ORIGINAL).read_bytes();cls.report=json.loads(REPORT.read_text());cls.raw=REPORT.read_bytes()
 def test_01_authentic(self):
  x=v.verify(self.exe,self.raw);self.assertEqual(x['canonicalLeFixups'],27004);self.assertEqual(x['setupRecords'],10)
 def test_02_unique_sites(self):self.assertEqual(v.parse_fixups(self.exe)[0].__len__(),26994)
 def test_03_expected_pointer_counts(self):self.assertEqual(sum(x['consecutivePalettePointerCount'] for x in self.report['records'].values()),34)
 def test_04_setup_groups(self):self.assertEqual({k:len(x['setupRecords']) for k,x in self.report['records'].items()},{'tomb80':6,'portal80':2,'tomb79':1,'portal79':1})
 def test_05_explicit_code(self):self.assertEqual(self.exe[0x81dd5:0x81dd8],bytes.fromhex('03560e'))
 def test_06_source_record_mismatch(self):
  tampered=bytearray(self.exe);tampered[0x893c6]^=1
  with self.assertRaises(AssertionError):v.verify(bytes(tampered),self.raw)
 def check_reject(self,edit):
  draft=copy.deepcopy(self.report);edit(draft)
  with self.assertRaises((AssertionError,KeyError,TypeError)):
   v.verify(self.exe,json.dumps(draft).encode())
 def test_07_forced_runtime_claim(self):self.check_reject(lambda r:r['limitations'].__setitem__('livePaletteHandle',True))
 def test_08_fake_dac_start(self):self.check_reject(lambda r:r['limitations'].__setitem__('paletteDACStart',True))
 def test_09_forged_record_source(self):self.check_reject(lambda r:r['records']['tomb80'].__setitem__('recordPhysical',0x891e0))
 def test_10_forged_direct_pointer(self):self.check_reject(lambda r:r['records']['portal80']['directTypedPointers'][3].__setitem__('object2Offset',0))
 def test_11_forged_table_count(self):self.check_reject(lambda r:r['records']['tomb80'].__setitem__('consecutivePalettePointerCount',9))
 def test_12_forged_palette_table_link(self):self.check_reject(lambda r:r['records']['portal80']['setupRecords'][0]['links']['paletteTablePointer'].__setitem__('object2Offset',0x177d0))
 def test_13_forged_setup_data(self):self.check_reject(lambda r:r['records']['tomb80']['setupRecords'][4]['fields'].__setitem__('heightWord',999))
 def test_14_forged_setup_provenance(self):self.check_reject(lambda r:r['records']['tomb80']['setupRecords'][0].__setitem__('incomingTypedReferences',[]))
 def test_15_missing_setup(self):self.check_reject(lambda r:r['records']['tomb80']['setupRecords'].pop())
 def test_16_fake_alternative_unused(self):self.check_reject(lambda r:r['limitations'].__setitem__('alternative79RecordsNeverUsed',True))
 def test_17_forged_fixup_count(self):self.check_reject(lambda r:r.__setitem__('fixupsIndependentlyMapped',27004))
 def test_18_forged_untabled_pointer(self):self.check_reject(lambda r:r['records']['portal80'].__setitem__('otherTypedPointerPhysical',[]))
 def test_19_forged_consumer_location(self):self.check_reject(lambda r:r['consumer'].__setitem__('allocatorCallPhysical',0x7b439))
 def test_20_forged_color_record_digest(self):self.check_reject(lambda r:r['records']['portal79'].__setitem__('recordSHA256','00'*32))
 def test_21_forged_pointer_field_semantics(self):self.check_reject(lambda r:r['limitations'].__setitem__('setupRecordFieldLabelsBeyondVerifiedOffsets',True))
 def test_22_fake_runtime_setup_binding(self):self.check_reject(lambda r:r['consumer']['conditionalRuntimeSetupSelection'].__setitem__('observedRuntimeSelectedSetup',True))
 def test_23_output_refuses_overwrite(self):
  import subprocess
  with tempfile.TemporaryDirectory() as folder:
   tmp=Path(folder);source=tmp/'MK2.EXE';source.write_bytes(self.exe);target=tmp/'report.json';target.write_bytes(b'protected')
   cmd=[sys.executable,str(Path(__file__).with_name('trace_o120_setup_graph.py')),'--exe',str(source),'--out',str(target)]
   proc=subprocess.run(cmd,capture_output=True,text=True)
   self.assertNotEqual(proc.returncode,0);self.assertEqual(target.read_bytes(),b'protected')
if __name__=='__main__':
 ORIGINAL=sys.argv[1];sys.argv=[sys.argv[0]]
 unittest.main(verbosity=2)
