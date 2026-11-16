#!/usr/bin/env python3
"""Private original MK2 fixture regressions for Spelunk 003.

Run only with the owner's canonical mk2.zip. The original EXE/GRA files are
read-only. No game assets are written or uploaded. Mutation tests change
private in-memory copies exclusively. This file is intentionally NOT called
by public GitHub CI.
"""
import argparse,copy,hashlib,json,struct,subprocess,sys,tempfile,unittest
from pathlib import Path
import trace_original_stage_frame_lists as m

parser=argparse.ArgumentParser()
parser.add_argument("--game-zip",type=Path,required=True)
args=parser.parse_args()
GAMEZIP=args.game_zip

class OriginalAnimationEvidence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw=m.original_files(GAMEZIP)
        cls.fx=m.le_fixups(cls.raw["MK2.EXE"])
        cls.report=m.produce(cls.raw)
        cls.by={x["track"]:x for x in cls.report["tracks"]}

    def test_original_bytes_hashes(self):
        self.assertEqual(m.sha(self.raw["MK2.EXE"]),m.EXE_SHA)
        for t in m.TRACKS.values():
            self.assertEqual(m.sha(self.raw[t["resource"]]),t["graSHA256"])

    def test_verified_source_entry_counts(self):
        r=self.report
        self.assertEqual((r["typedLEFixups"],r["uniqueLEFixupSites"]),(27004,26994))
        self.assertEqual((r["trackCount"],r["sourceOrderedFrameEntries"],r["distinctSourceSprites"]),(2,32,19))

    def test_armory_twelve_distinct_consecutive_native_frames(self):
        f=self.by["armory_source_12"]
        self.assertEqual((f["nativeSourceFrameEntries"],f["distinctOriginalSprites"]),(12,12))
        self.assertEqual(f["uniqueEncodedSpan"],[0x1c780,0x1ed80])
        self.assertTrue(all(x["originalWidth"]==10 and x["originalHeight"]==64 for x in f["frames"]))
        self.assertEqual(f["ordinalToUniqueSprite"],list(range(12)))

    def test_forest_twenty_source_entries_reuse_seven_streams(self):
        f=self.by["forest_source_20"]
        self.assertEqual((f["nativeSourceFrameEntries"],f["distinctOriginalSprites"]),(20,7))
        self.assertEqual(f["uniqueEncodedSpan"],[0x28390,0x2f544])
        self.assertEqual(f["ordinalToUniqueSprite"],[0,1,2,3,4,5,6,5,6,5,6,5,6,5,6,4,3,2,1,0])
        self.assertTrue(all(x["originalWidth"]==64 and x["originalHeight"]==64 for x in f["frames"]))

    def test_stage_initializer_mode_and_task_join(self):
        for f in self.report["tracks"]:
            c=f["sourceCode"]
            self.assertEqual(len(c["stageRoots"]),3)
            self.assertTrue(c["stageModeZeroSkipsRegistration"])
            self.assertEqual(c["taskRegistrationHelperPhysical"],0x67222)
            self.assertEqual(c["readerCallSitesPhysical"],[0x82a8f,0x82aa4,0x82ab6])
            self.assertEqual(c["originalReaderPhysical"],0x86cc5)
            self.assertFalse(c["runtimeInvocationObserved"])

    def test_native_indices_masks_and_order_have_distinct_hashes(self):
        for f in self.report["tracks"]:
            for item in f["frames"]:
                self.assertEqual(len(item["indexedPlaneSha256"]),64)
                self.assertEqual(len(item["opacityPlaneSha256"]),64)
                self.assertGreater(item["opaquePixels"],0)
                self.assertLessEqual(item["opaquePixels"],item["originalWidth"]*item["originalHeight"])

    def test_no_runtime_timing_or_palette_claims(self):
        for f in self.report["tracks"]:
            self.assertEqual(f["terminalWord"],0)
            self.assertFalse(f["activeInGameplayVerified"])
            self.assertFalse(f["actualFrameDurationVerified"])
            self.assertFalse(f["sourcePaletteOwnedByVGA"])
        self.assertFalse(any(self.report["runtimeVerified"].values()))

    def test_bad_stage_writer_opcode_refused(self):
        b=bytearray(self.raw["MK2.EXE"])
        b[0x82a43]^=1
        with self.assertRaisesRegex(ValueError,"stream cursor writer opcode"):
            m.verify_control(bytes(b),self.fx,m.TRACKS["armory_source_12"])

    def test_corrupt_forest_mode_registration_refused(self):
        b=bytearray(self.raw["MK2.EXE"])
        b[0x82ae7]^=1
        with self.assertRaisesRegex(ValueError,"mode-zero registration gate"):
            m.verify_control(bytes(b),self.fx,m.TRACKS["forest_source_20"])

    def test_wrong_original_descriptor_pointer_refused(self):
        b=bytearray(self.raw["MK2.EXE"])
        pointer_location=m.OBJ2+0x168d4
        b[pointer_location]^=1
        with self.assertRaisesRegex(ValueError,"raw pointer mismatch"):
            m.pointer(bytes(b),self.fx,2,0x168d4,2,0x169ec)

    def test_corrupt_resource_hash_refused(self):
        modified=dict(self.raw)
        b=bytearray(modified["FOREST.GRA"])
        b[0]^=1
        modified["FOREST.GRA"]=bytes(b)
        with self.assertRaisesRegex(ValueError,"incorrect original FOREST"):
            m.produce(modified)

    def test_corrupt_rle_command_refused(self):
        b=bytearray(self.raw["ARMORY.GRA"])
        off=0x1c780
        b[off:off+4]=b"\x00\x00\x00\x00"
        with self.assertRaisesRegex(ValueError,"length invalid"):
            m.rle_index_mask(bytes(b),off,10,64)

    def test_reproduced_metadata_deterministic(self):
        again=m.produce(self.raw)
        self.assertEqual(json.dumps(again,sort_keys=True),json.dumps(self.report,sort_keys=True))

    def test_cli_refuses_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            out=Path(tmp)/"source-evidence.json"
            out.write_text("keep",encoding="utf-8")
            c=subprocess.run([sys.executable,str(Path(m.__file__).resolve()),
                              "--game-zip",str(GAMEZIP),"--out",str(out)],
                             capture_output=True,text=True)
            self.assertNotEqual(c.returncode,0)
            self.assertIn("refusing to overwrite",c.stderr)
            self.assertEqual(out.read_text(encoding="utf-8"),"keep")

if __name__=="__main__":
    unittest.main(argv=[sys.argv[0]],verbosity=2)
