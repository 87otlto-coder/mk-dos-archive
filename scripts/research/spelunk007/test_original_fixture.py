#!/usr/bin/env python3
"""Spelunk007 original-file regressions, private only.

Requires owner-supplied unchanged DOS mk2.zip. Read-only originals; all
mutation controls edit in-memory copies. Intentionally absent from public CI.
"""
import argparse, json, pathlib, subprocess, sys, tempfile, unittest
import trace_blood_source_lists as s

p=argparse.ArgumentParser();p.add_argument("--game-zip",required=True,type=pathlib.Path)
opts=p.parse_args()

class OriginalBloodSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.exe,cls.gra=s.original(opts.game_zip)
        cls.result=s.audit(cls.exe,cls.gra)
        cls.fx=s.core.relocations(cls.exe)
        cls.desc=s.scan_descriptors(cls.exe,cls.gra)
        cls.listmap={x["rootObject2"]:x for x in cls.result["sourceLists"]}

    def test_original_fixture_identity(self):
        s.source_identity(self.exe,self.gra)
        self.assertEqual((len(self.exe),len(self.gra)),(861133,111780))

    def test_descriptor_census_unchanged_o69(self):
        self.assertEqual(len(self.desc),178)
        self.assertEqual(self.result["resourceRegistryId"],9)

    def test_all_original_resource_bytes_tile_without_gaps(self):
        ranges=sorted((x["sourceStart"],x["sourceEndExclusive"]) for x in self.desc.values())
        self.assertEqual(ranges[0][0],0)
        self.assertEqual(ranges[-1][1],111780)
        self.assertTrue(all(a[1]==b[0] for a,b in zip(ranges,ranges[1:])))

    def test_eighteen_list_155_ordered_153_unique(self):
        self.assertEqual((self.result["sourceListCount"],
                          self.result["sourceListEntryReferences"],
                          self.result["distinctSpritesInLists"]),(18,155,153))
        self.assertEqual(self.result["otherSpritesNotInTheseLists"],25)

    def test_twelve_direct_one_indirect_five_unknown(self):
        values=[x["codeLinked"] for x in self.result["sourceLists"]]
        self.assertEqual(values.count("DIRECT_SOURCE_CURSOR_WRITER"),12)
        self.assertEqual(values.count("INDIRECT_VARIANT_SELECTION"),1)
        self.assertEqual(values.count("NO_DIRECT_WRITER_OBSERVED"),5)

    def test_first_midlist_rewind(self):
        r=self.listmap[0x1d08c]
        self.assertEqual((r["sourceEntryCount"],r["marker"],r["rewindObject2"],
                          r["introEntriesBeforeRewind"],r["rewindCycleEntryCount"]),
                         (18,1,0x1d0a4,6,12))

    def test_second_midlist_rewind(self):
        r=self.listmap[0x1d178]
        self.assertEqual((r["sourceEntryCount"],r["marker"],r["rewindObject2"],
                          r["introEntriesBeforeRewind"],r["rewindCycleEntryCount"]),
                         (14,1,0x1d194,7,7))

    def test_rewind_control_is_original_reader_instruction(self):
        self.assertEqual(self.exe[0x86d14:0x86d26].hex(),
                         "83fb0175c3528b52048915785a07005aeb9f")

    def test_variant_table_four_entry_positions(self):
        c=self.result["sourceReaderAndVariantControls"]
        self.assertEqual(c["variantPointerDestinationsObject2"],
                         [0x1d038,0x1d044,0x1d04c,0x1d058])
        self.assertEqual(c["variantEntryIndices"],[0,3,5,8])
        self.assertFalse(c["variantRuntimeBoundsVerified"])

    def test_repeated_frames_preserved(self):
        r=self.listmap[0x1d240]
        self.assertEqual((r["sourceEntryCount"],r["uniqueSpriteDescriptors"]),(8,6))
        f=r["originalDescriptorOrderObject2"]
        self.assertEqual(f[:4],[0x20264,0x20264,0x20274,0x20274])

    def test_prior_o218_o228_source177_unchanged(self):
        r=self.result["source177PreviouslyKnownPitWitness"]
        self.assertEqual((r["descriptorObject2"],r["physical"],
                          r["resourceLastStreamStart"],r["opaquePixels"]),
                         (0x206fc,0xc1350,111552,73))
        self.assertFalse(r["verifiedOriginalDACAllocation"])

    def test_exact_code_sourced_cursor_write(self):
        root=0x1d178
        writer=self.listmap[root]["directCodeCursorWritePhysical"][0]
        self.assertEqual(writer,0x90e59)
        self.assertEqual(self.exe[writer:writer+6].hex(),"c705785a0700")

    def test_bad_original_exe_hash_refused(self):
        b=bytearray(self.exe);b[0x86d14]^=1
        with self.assertRaisesRegex(ValueError,"canonical MK2.EXE"):
            s.audit(bytes(b),self.gra)

    def test_bad_control_opcode_refused_directly(self):
        b=bytearray(self.exe);b[0x86d14]^=1
        with self.assertRaisesRegex(ValueError,"original rewind opcode"):
            s.source_control(bytes(b),self.fx)

    def test_bad_original_gra_hash_refused(self):
        b=bytearray(self.gra);b[0]^=1
        with self.assertRaisesRegex(ValueError,"canonical BLOOD.GRA"):
            s.audit(self.exe,bytes(b))

    def test_bad_first_loop_marker_refused(self):
        b=bytearray(self.exe);b[s.O2+0x1d08c+18*4]^=1
        with self.assertRaisesRegex(ValueError,"list original terminator"):
            s.read_lists(bytes(b),self.fx,self.desc)

    def test_bad_second_loop_backpointer_refused(self):
        b=bytearray(self.exe);b[s.O2+0x1d178+14*4+4]^=1
        with self.assertRaisesRegex(ValueError,"raw relocated pointer"):
            s.read_lists(bytes(b),self.fx,self.desc)

    def test_wrong_variant_table_pointer_refused(self):
        b=bytearray(self.exe);b[s.O2+0x1d028]^=1
        with self.assertRaisesRegex(ValueError,"raw relocated pointer"):
            s.source_control(bytes(b),self.fx)

    def test_bad_source_list_descriptor_refused(self):
        b=bytearray(self.exe);b[s.O2+0x1d1dc]^=1
        with self.assertRaisesRegex(ValueError,"raw relocated pointer"):
            s.read_lists(bytes(b),self.fx,self.desc)

    def test_all_indexed_frame_hashes_consistent(self):
        r=self.result
        self.assertTrue(all(len(x["indexedSha256"])==64 and
                            len(x["opacityMaskSha256"])==64
                            for x in r["allSprites"]))
        self.assertFalse(any(r["runtimeUnknown"].values()))

    def test_repeat_is_deterministic(self):
        other=s.audit(self.exe,self.gra)
        self.assertEqual(json.dumps(other,sort_keys=True),
                         json.dumps(self.result,sort_keys=True))

    def test_refuse_overwriting_existing_evidence_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            target=pathlib.Path(tmp)/"evidence.json"
            target.write_text("PRESERVE",encoding="utf-8")
            cmd=[sys.executable,str(pathlib.Path(s.__file__).resolve()),
                 "--game-zip",str(opts.game_zip),"--out",str(target)]
            proc=subprocess.run(cmd,capture_output=True,text=True)
            self.assertNotEqual(proc.returncode,0)
            self.assertIn("refusing to overwrite",proc.stderr)
            self.assertEqual(target.read_text(encoding="utf-8"),"PRESERVE")

if __name__=="__main__":unittest.main(argv=[sys.argv[0]],verbosity=2)
