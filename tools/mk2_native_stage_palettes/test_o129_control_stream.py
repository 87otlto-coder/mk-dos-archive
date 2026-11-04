#!/usr/bin/env python3
"""O129 independent/integration regression, including forged-evidence rejection."""
import argparse,copy,hashlib,json,subprocess,sys,tempfile,unittest
from pathlib import Path
from trace_o129_control_stream import produce
from verify_o129_control_stream_independent import verify
P=argparse.ArgumentParser(add_help=False);P.add_argument('exe',type=Path);A,_=P.parse_known_args()
EXE=A.exe.read_bytes();REPORT=produce(EXE);RAW=(json.dumps(REPORT,indent=2)+'\n').encode()
class O129Tests(unittest.TestCase):
 def test_01_canonical_original(self): self.assertEqual(REPORT['status'],'PASS_STATIC_FIXED_STREAMS_AND_DYNAMIC_BOUNDARY')
 def test_02_independent_verifier(self):self.assertGreaterEqual(verify(EXE,RAW)['assertions'],200)
 def test_03_three_different_static_starts(self):self.assertEqual([x['object2Offset'] for x in REPORT['fixedStreams']],[0x13CEC,0x1410C,0x15D60])
 def test_04_pair_counts(self):self.assertEqual([x['positiveCount'] for x in REPORT['fixedStreams']],[10,4,10])
 def test_05_no_fake_runtime_observation(self):self.assertIs(REPORT['dynamicPointerLoad']['observedValue'],False)
 def test_06_negative_opcode_path(self):self.assertIn('advance 16 bytes',REPORT['controlGrammar']['minusOneToken'])
 def test_07_guard_separate(self):self.assertEqual(REPORT['controlGrammar']['guardedPackedRenderer'],0x9e118)
 def test_08_unknown_dynamic_lists(self):self.assertIs(REPORT['controlGrammar']['allPossibleDynamicListsExcludeMinusOne'],False)
 def test_09_wrong_hash_rejected(self):
  bad=bytearray(EXE);bad[-1]^=1
  with self.assertRaises(ValueError):produce(bytes(bad))
 def test_10_short_exe_rejected(self):
  with self.assertRaises(ValueError):produce(EXE[:-1])
 def test_11_report_deterministic(self):self.assertEqual(produce(EXE),REPORT)
 def test_12_forge_zero_terminator(self):
  d=copy.deepcopy(REPORT);d['fixedStreams'][0]['terminatorObject2Offset']+=4
  with self.assertRaises(ValueError):verify(EXE,json.dumps(d).encode())
 def test_13_forge_pointer_pair(self):
  d=copy.deepcopy(REPORT);d['fixedStreams'][1]['positivePairs'][2]['payloadPointerObject2']+=4
  with self.assertRaises(ValueError):verify(EXE,json.dumps(d).encode())
 def test_14_forge_source_hash(self):
  d=copy.deepcopy(REPORT);d['fixedStreams'][2]['streamSHA256']='0'*64
  with self.assertRaises(ValueError):verify(EXE,json.dumps(d).encode())
 def test_15_forge_runtime_binding(self):
  d=copy.deepcopy(REPORT);d['dynamicPointerLoad']['observedValue']=True
  with self.assertRaises(ValueError):verify(EXE,json.dumps(d).encode())
 def test_16_forge_exhaustiveness(self):
  d=copy.deepcopy(REPORT);d['dynamicPointerLoad']['fixedStreamExhaustivenessProven']=True
  with self.assertRaises(ValueError):verify(EXE,json.dumps(d).encode())
 def test_17_forge_dynamic_absence(self):
  d=copy.deepcopy(REPORT);d['controlGrammar']['allPossibleDynamicListsExcludeMinusOne']=True
  with self.assertRaises(ValueError):verify(EXE,json.dumps(d).encode())
 def test_18_forge_opcode_semantics(self):
  d=copy.deepcopy(REPORT);d['controlGrammar']['minusOneToken']='advance 20 bytes'
  with self.assertRaises(ValueError):verify(EXE,json.dumps(d).encode())
 def test_19_forge_setter_location(self):
  d=copy.deepcopy(REPORT);d['fixedStreams'][2]['directEAXImmediateSetters']=[0x80191]
  with self.assertRaises(ValueError):verify(EXE,json.dumps(d).encode())
 def test_20_unknown_top_level_field(self):
  d=copy.deepcopy(REPORT);d['runtimePaletteHandle']=1
  with self.assertRaises(ValueError):verify(EXE,json.dumps(d).encode())
 def test_21_forge_le_fixup_census(self):
  d=copy.deepcopy(REPORT);d['typedStreamPointerReferenceSites'].pop()
  with self.assertRaises(ValueError):verify(EXE,json.dumps(d).encode())
 def test_22_refuses_to_overwrite(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'evidence.json';p.write_bytes(RAW)
   r=subprocess.run([sys.executable,str(Path(__file__).with_name('trace_o129_control_stream.py')),'--exe',str(A.exe),'--out',str(p)],capture_output=True,text=True)
   self.assertNotEqual(r.returncode,0);self.assertEqual(p.read_bytes(),RAW)
 def test_23_report_exact_bytes(self): self.assertEqual(hashlib.sha256(RAW).hexdigest(), verify(EXE,RAW)['reportSHA256'])
 def test_24_no_minus_one_in_any_pinned_fixed_list(self):self.assertTrue(all(not x['containsMinusOne'] for x in REPORT['fixedStreams']))
if __name__=='__main__':
 unittest.main(argv=[sys.argv[0]],verbosity=1)
