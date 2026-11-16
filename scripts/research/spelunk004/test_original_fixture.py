#!/usr/bin/env python3
"""Private original-file Spelunk 004 regression/falsification controls.

Run only with the user's canonical DOS mk2.zip, never in public CI. Tests
mutate in-memory clones only. No GRA bytes or native sprites are exported.
"""
import argparse,copy,json,subprocess,sys,tempfile,unittest
from pathlib import Path
import trace_soul_fireskel_source as s

ap=argparse.ArgumentParser()
ap.add_argument("--game-zip",required=True,type=Path)
ARGS=ap.parse_args()

class SourceOriginalTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.input=s.read_original_zip(ARGS.game_zip)
  cls.report=s.audit(cls.input)
  cls.exe=cls.input["MK2.EXE"]
  cls.fx=s.fixups(cls.exe)
  cls.by={t["track"]:t for t in cls.report["tracks"]}

 def test_full_soul_file_covered_without_pretending_fire_complete(self):
  self.assertEqual(self.report["SOUL"]["sourceByteCoverage"],47612)
  self.assertTrue(self.report["SOUL"]["completeNativeIndexedResourcePartition"])
  self.assertFalse(self.report["FIRESKEL"]["completeResourcePartition"])
  self.assertEqual(self.report["FIRESKEL"]["sourceSelectedSpan"],[0xd354,0xde34])

 def test_four_lists_29_unique_original_frames(self):
  self.assertEqual([t["entryCount"] for t in self.report["tracks"]],[3,14,6,6])
  self.assertEqual(self.report["newSourceOrderedEntries"],29)
  self.assertEqual(self.report["newDistinctSourceSprites"],29)

 def test_source_control_is_not_runtime_timing(self):
  self.assertEqual(self.report["SOUL"]["sourceControl"]["sourceSchedulerYieldLiterals"],[4,4])
  self.assertEqual(self.report["SOUL"]["sourceControl"]["sourceFirstRepeatCounterLiteral"],16)
  self.assertEqual(self.report["FIRESKEL"]["sourceControl"]["signSourceGlobalObject2"],0x75ac4)
  self.assertFalse(any(self.report["runtimeVerification"].values()))

 def test_source_names_and_exact_original_resource_id(self):
  for t in self.report["tracks"]:
   for f in t["sourceOrderedFrames"]:
    self.assertEqual(f["sourceResourceId"],s.RESOURCES[t["sourceResource"]]["id"])
    self.assertGreater(f["opaqueCount"],0)
    self.assertTrue(0<f["width"]*f["height"]<=64000)

 def test_loop_and_zero_commands_distinct(self):
  self.assertEqual([t["sourceLoopToken"] for t in self.report["tracks"]],[1,0,1,1])
  self.assertEqual([t["sourceBackPointerObject2"] for t in self.report["tracks"]],
                   [0x1dd28,None,0x1d938,0x1d958])

 def test_exe_modified_rejected(self):
  bad=dict(self.input);b=bytearray(self.exe);b[0x94634]^=1;bad["MK2.EXE"]=bytes(b)
  with self.assertRaisesRegex(ValueError,"MK2.EXE identity"):
   s.audit(bad)

 def test_soul_source_code_corruption_refused(self):
  b=bytearray(self.exe);b[0x9468d]^=1
  with self.assertRaisesRegex(ValueError,"original code differs"):
   s.code_joins(bytes(b),self.fx)

 def test_fireskel_condition_corruption_refused(self):
  b=bytearray(self.exe);b[0x94097]^=1
  with self.assertRaisesRegex(ValueError,"original code differs"):
   s.code_joins(bytes(b),self.fx)

 def test_wrong_list_relocation_target_refused(self):
  b=bytearray(self.exe)
  first=s.O2+0x1dd28
  b[first]^=1
  with self.assertRaisesRegex(ValueError,"raw relocated pointer differs"):
   s.track(bytes(b),self.fx,self.input["SOUL.GRA"],s.TRACKS[0])

 def test_wrong_loop_terminal_refused(self):
  b=bytearray(self.exe)
  b[s.O2+0x1dd28+12]^=1
  with self.assertRaisesRegex(ValueError,"terminal token"):
   s.track(bytes(b),self.fx,self.input["SOUL.GRA"],s.TRACKS[0])

 def test_wrong_source_resource_rejected(self):
  bad=dict(self.input);b=bytearray(bad["FIRESKEL.GRA"]);b[-1]^=1
  bad["FIRESKEL.GRA"]=bytes(b)
  with self.assertRaisesRegex(ValueError,"FIRESKEL.GRA identity"):
   s.audit(bad)

 def test_mutated_indexed_rle_rejected(self):
  raw=bytearray(self.input["SOUL.GRA"])
  raw[:4]=b"\0\0\0\0"
  with self.assertRaisesRegex(ValueError,"literal crosses"):
   s.decode_rle(bytes(raw),0,55,96)

 def test_repeat_original_audit_deterministic(self):
  self.assertEqual(json.dumps(self.report,sort_keys=True),
                   json.dumps(s.audit(self.input),sort_keys=True))

 def test_no_overwrite_cli(self):
  with tempfile.TemporaryDirectory() as folder:
   target=Path(folder)/"save.json"
   target.write_text("PRESERVE",encoding="utf-8")
   argv=[sys.executable,str(Path(s.__file__).resolve()),
         "--game-zip",str(ARGS.game_zip),"--out",str(target)]
   proc=subprocess.run(argv,capture_output=True,text=True)
   self.assertNotEqual(proc.returncode,0)
   self.assertIn("refuse existing report",proc.stderr)
   self.assertEqual(target.read_text(encoding="utf-8"),"PRESERVE")

if __name__=="__main__":
 unittest.main(argv=[sys.argv[0]],verbosity=2)
