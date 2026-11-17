#!/usr/bin/env python3
"""Private-only original MK2 Spelunk005 regression source.

Requires owner's exact mk2.zip and does NOT run on GitHub Actions. Negative
controls work on in-memory copies, not commercial files. This suite is
unexecuted unless a separate private validation report explicitly records it.
"""
import argparse,copy,json,subprocess,sys,tempfile,unittest
from pathlib import Path
import trace_bang_suck_sources as s

ap=argparse.ArgumentParser()
ap.add_argument("--game-zip",type=Path,required=True)
opts=ap.parse_args()

class OriginalFixture(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.data=s.original(opts.game_zip)
  cls.result=s.audit(cls.data)
  cls.exe=cls.data["MK2.EXE"]
  cls.fx=s.common.fixups(cls.exe)

 def test_original_source_identity(self):
  self.assertEqual(s.sha(self.exe),s.EXE_SHA)
  self.assertEqual(s.sha(self.data["BANG.GRA"]),s.RES["BANG.GRA"]["sha256"])
  self.assertEqual(s.sha(self.data["SUCK.GRA"]),s.RES["SUCK.GRA"]["sha256"])

 def test_original_bang_table_and_full_resource(self):
  b=self.result["BANG"]
  self.assertEqual((b["selectorListCount"],b["sourceOrderedListEntries"],b["distinctListSprites"]),(11,95,93))
  self.assertEqual((b["otherDistinctSourceDescriptors"],b["allDistinctSpriteStreams"]),(8,101))
  self.assertTrue(b["resourceFullyPartitionedByDistinctDescriptors"])
  self.assertEqual((b["mainEncodedSpan"],b["otherEncodedSpan"]),([0,24692],[24692,29556]))

 def test_original_bang_list_terminal_and_deduplication(self):
  families=self.result["BANG"]["sourceListFamilies"]
  self.assertEqual([x["entryCount"] for x in families],list(s.BANG_SIZES))
  self.assertEqual([x["terminator"] for x in families],[1,1,1,1,1,0,0,1,1,1,1])
  self.assertEqual(families[5]["distinctDescriptors"],6)
  self.assertEqual(families[5]["orderedEntries"][-1]["descriptorObject2"],
                   families[5]["orderedEntries"][-2]["descriptorObject2"])

 def test_source_connected_bang_signed_zero_stop(self):
  records=self.result["BANG"]["pairedDescriptorCoordinateBlocks"]
  self.assertTrue(records[0]["directCodeReferenceObserved"])
  self.assertTrue(records[0]["readerStopsBeforeDrawingThatPointer"])
  self.assertEqual(records[0]["firstZeroSignedXAt"],5)
  self.assertFalse(records[1]["directCodeReferenceObserved"])
  self.assertTrue(records[1]["containsNonuniformInterveningZero"])
  self.assertTrue(records[1]["otherFieldsNotClassified"])

 def test_suck_three_list_consumers_and_separate_lookup(self):
  a=self.result["SUCK"]
  self.assertEqual([x["entryCount"] for x in a["sourceListFamilies"]],[5,5,8])
  self.assertEqual([x["terminator"] for x in a["sourceListFamilies"]],[0,0,1])
  self.assertEqual([x["descriptorObject2"] for x in a["separateSingleDescriptorLookup"]],
                   [0x217c0,0x217d0,0x217f4,0x217f4])
  self.assertFalse(a["resourceFullyPartitioned"])
  self.assertEqual(a["linkedEncodedSpan"],[117872,122000])

 def test_runtime_claims_explicitly_false(self):
  self.assertFalse(any(self.result["runtime"].values()))

 def test_deterministic_report(self):
  self.assertEqual(json.dumps(self.result,sort_keys=True),
                   json.dumps(s.audit(self.data),sort_keys=True))

 def test_original_bang_selector_pointer_mutation_refused(self):
  bad=bytearray(self.exe)
  bad[s.O2+s.BANG_BASE]^=1
  with self.assertRaisesRegex(ValueError,"raw relocated pointer"):
   s.common.ptr(bad,self.fx,2,s.BANG_BASE,2,s.BANG_ROOTS[0])

 def test_original_suck_list_pointer_mutation_refused(self):
  bad=bytearray(self.exe)
  bad[s.O2+0x1bf00]^=1
  with self.assertRaisesRegex(ValueError,"raw relocated pointer"):
   s.sequence(bad,self.fx,self.data["SUCK.GRA"],14,0x1bf00,5,0,None)

 def test_wrong_bang_loop_marker_refused(self):
  bad=bytearray(self.exe)
  bad[s.O2+0x1b540+32]^=1
  with self.assertRaisesRegex(ValueError,"source end marker"):
   s.sequence(bad,self.fx,self.data["BANG.GRA"],12,0x1b540,8,1,0x1b540)

 def test_wrong_suck_loop_marker_refused(self):
  bad=bytearray(self.exe)
  bad[s.O2+0x1bf30+32]^=1
  with self.assertRaisesRegex(ValueError,"source end marker"):
   s.sequence(bad,self.fx,self.data["SUCK.GRA"],14,0x1bf30,8,1,0x1bf30)

 def test_original_source_mutation_refused_by_hash(self):
  bad=dict(self.data);gra=bytearray(bad["BANG.GRA"])
  gra[0]^=1;bad["BANG.GRA"]=bytes(gra)
  with self.assertRaisesRegex(ValueError,"canonical BANG.GRA"):
   s.audit(bad)

 def test_wrong_suck_single_descriptor_lookup_refused(self):
  bad=bytearray(self.exe);bad[s.O2+0x1bf60]^=1
  with self.assertRaisesRegex(ValueError,"raw relocated pointer"):
   s.common.ptr(bad,self.fx,2,0x1bf60,2,0x217f4)

 def test_no_private_output_overwrite(self):
  with tempfile.TemporaryDirectory() as tmp:
   dest=Path(tmp)/"original-source.json";dest.write_text("KEEP")
   q=subprocess.run([sys.executable,str(Path(s.__file__).resolve()),
                     "--game-zip",str(opts.game_zip),"--out",str(dest)],
                    capture_output=True,text=True)
   self.assertNotEqual(q.returncode,0)
   self.assertIn("refusing to overwrite",q.stderr)
   self.assertEqual(dest.read_text(),"KEEP")

if __name__=="__main__":
 unittest.main(argv=[sys.argv[0]],verbosity=2)
