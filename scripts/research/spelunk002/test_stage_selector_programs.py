#!/usr/bin/env python3
"""Spelunk 002 original-file positive/negative regression suite.

Run locally with the owner-supplied exact original MK2.EXE or mk2.zip.
Mutation tests bypass only the whole-file digest in order to test the deeper
relocation, bytecode, stream and trust-boundary checks.
Never writes original files or extracted assets.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import trace_stage_selector_programs as m

ap=argparse.ArgumentParser()
ap.add_argument("original",type=Path)
opts=ap.parse_args()
ORIGINAL=opts.original

class StageProgramTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.b=m.original_bytes(ORIGINAL)
        cls.fx=m.parse_fixups(cls.b)
        cls.report=m.produce(cls.b,fx=cls.fx)

    def tamper(self,physical,pattern,why):
        bad=bytearray(self.b)
        bad[physical:physical+len(pattern)]=pattern
        with self.assertRaisesRegex(ValueError,why):
            m.produce(bytes(bad),check_digest=False,fx=self.fx)

    def test_static_summary_and_limits(self):
        r=self.report
        self.assertEqual((r["firstTenSelectionCases"],r["uniqueProgramRoots"]),(30,20))
        self.assertEqual((r["fixupCount"],r["uniqueFixupSites"]),(27004,26994))
        self.assertEqual(r["classification"],"VERIFIED_STATIC_CONDITIONAL")
        self.assertFalse(any(v is True for k,v in r["limitations"].items()
                             if k!="sourceSetupPalettePointersCarriedFromO120O121"))

    def test_mode_counts(self):
        self.assertEqual(self.report["modeTotals"],{
            "mode_equals_2":{"setupAssignments":44,"skipSentinels":21,"scaledGlobalWrites":39},
            "mode_equals_1":{"setupAssignments":30,"skipSentinels":35,"scaledGlobalWrites":25},
            "mode_other":{"setupAssignments":30,"skipSentinels":35,"scaledGlobalWrites":25}})

    def test_tomb_exact_channels(self):
        cases=[c for c in self.report["cases"] if c["configurationIndex"]==1]
        self.assertEqual([[s["channel"] for s in c["activeSetupChannels"]] for c in cases],
                         [[0,1,2,3,5],[0,1,2,5],[0,1,2,5]])
        self.assertEqual([c["explicitSkipChannels"] for c in cases],
                         [[4],[3,4],[3,4]])

    def test_portal_corrected_first_channel(self):
        cases=[c for c in self.report["cases"] if c["configurationIndex"]==7]
        self.assertEqual([[s["channel"] for s in c["activeSetupChannels"]] for c in cases],
                         [[1,5],[5],[5]])
        self.assertEqual([c["explicitSkipChannels"] for c in cases],
                         [[0,2,3,4],[0,1,2,3,4],[0,1,2,3,4]])
        self.assertEqual(cases[0]["activeSetupChannels"][0]["setupObject2"],0x16514)

    def test_tomb_portal_scalars_are_not_timing(self):
        for p in self.report["programs"]:
            for d in p["derivedHighHalfWrites"]:
                self.assertIn(d["destinationGlobalObject2"],
                              range(0x84310,0x84330,4))
                self.assertEqual(d["computedRaw32"] & 0xFFFF,0)
        self.assertFalse(self.report["limitations"]["runtimeAnimationTiming"])

    def test_default_state_distinct_from_skip(self):
        for p in self.report["programs"]:
            self.assertTrue(all(c["kind"]=="explicit_skip"
                                for c in p["cells"] if c["kind"]!="setup_pair"))
            self.assertEqual(p["unwrittenDefaultChannels"],
                             list(range(p["nextUnwrittenChannel"],8)))
        self.assertNotEqual(m.DEFAULT,1)

    def test_repeat_report_is_deterministic(self):
        next_report=m.produce(self.b,fx=self.fx)
        self.assertEqual(json.dumps(self.report,sort_keys=True),
                         json.dumps(next_report,sort_keys=True))

    def test_original_digest_guard_refuses_mutation(self):
        bad=bytearray(self.b);bad[0x81F9C]^=1
        with self.assertRaisesRegex(ValueError,"canonical original MK2"):
            m.produce(bytes(bad))

    def test_loader_instruction_mutation(self):
        self.tamper(0x81F9C,b"\x90\x90","original opcode mismatch")

    def test_loop_sentinel_instruction_mutation(self):
        self.tamper(0x81BE0,b"\x90","original opcode mismatch")

    def test_mode_table_pointer_mutation(self):
        self.tamper(m.OBJ2+0x15BEC+4,b"\xAA","wrong typed pointer")

    def test_root_selector_pointer_mutation(self):
        self.tamper(m.OBJ2+0x171F0+0x1C,b"\xAA","pointer bytes disagree")

    def test_portal_explicit_skip_mutation(self):
        self.tamper(m.OBJ2+0x16398,b"\x02","wrong typed pointer")

    def test_tomb_setup_pointer_mutation(self):
        self.tamper(m.OBJ2+0x17210,b"\xAA","wrong typed pointer")

    def test_tomb_scaled_destination_pointer_mutation(self):
        self.tamper(m.OBJ2+0x17244,b"\xAA","wrong typed pointer")

    def test_tomb_scaled_width_mutation(self):
        # Width is an input scalar, not a typed relocation: a different width
        # changes the derived value. Compare outputs rather than guessing it is
        # an invalid input or that the result would be a camera coordinate.
        bad=bytearray(self.b)
        bad[m.OBJ2+0x17358]^=1
        changed=m.produce(bytes(bad),check_digest=False,fx=self.fx)
        before=next(x for x in self.report["programs"] if x["rootObject2"]==0x171F0)
        after=next(x for x in changed["programs"] if x["rootObject2"]==0x171F0)
        self.assertNotEqual(before["derivedHighHalfWrites"][0]["setupFirstSignedWord"],
                            after["derivedHighHalfWrites"][0]["setupFirstSignedWord"])

    def test_untype_scaled_pointer_is_refused(self):
        fx=dict(self.fx)
        fx[(2,0x17244)]=(7,16,2,0x84310)
        with self.assertRaisesRegex(ValueError,"wrong typed pointer"):
            m.produce(self.b,fx=fx)

    def test_cli_does_not_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            output=Path(tmp)/"evidence.json"
            output.write_text("preserve",encoding="utf-8")
            command=[sys.executable,str(Path(m.__file__).resolve()),str(ORIGINAL),
                     "--out",str(output)]
            proc=subprocess.run(command,capture_output=True,text=True)
            self.assertNotEqual(proc.returncode,0)
            self.assertIn("refusing to overwrite",proc.stderr)
            self.assertEqual(output.read_text(encoding="utf-8"),"preserve")

if __name__=="__main__":
    unittest.main(argv=[sys.argv[0]],verbosity=2)
