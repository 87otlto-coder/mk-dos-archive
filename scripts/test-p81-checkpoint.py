#!/usr/bin/env python3
"""P81 source-only fail-closed checkpoint controls; no original game files."""
from pathlib import Path
import runpy
import unittest

ROOT = Path(__file__).resolve().parents[1]
P = runpy.run_path(str(ROOT / "scripts/verify-p81-checkpoint.py"))


class P81OriginalCheckpointGuards(unittest.TestCase):
    def test_nine_required_groups_include_inherited_three_games_and_real_chrome(self):
        steps = P["STEPS"]
        self.assertEqual(len(steps), 9)
        self.assertEqual(len(set(steps)), 9)
        self.assertEqual(steps[0], "p76_inherited_three_game_original_and_chrome")
        for fragment in ("p77_", "p79_", "p78_", "p80_", "real_chrome"):
            self.assertTrue(any(fragment in s for s in steps), fragment)
        self.assertEqual(P["CENSUS"], {"mk1": 2656, "mk2": 5369, "mk3": 9186})

    def test_no_forged_mixed_stdout(self):
        p = P["json_stdout"]
        self.assertEqual(p(b'{"pass":"P81","status":"PASS"}', "synthetic")["pass"], "P81")
        for source in (b'hello\n{"status":"PASS"}',
                       b'{"status":"PASS"}\n{"status":"PASS"}',
                       b'["PASS"]', b'\xff'):
            with self.subTest(source=source), self.assertRaises(ValueError):
                p(source, "synthetic invalid")

    def test_exact_bool_and_int_type_boundaries(self):
        e = P["exact"]
        e({"int": 0, "bool": False}, {"int": 0, "bool": False}, "positive")
        for bad, exp in (({"int": False}, {"int": 0}),
                         ({"bool": 0}, {"bool": False}),
                         ({"int": "0"}, {"int": 0}),
                         ({"bool": "false"}, {"bool": False}),
                         ({"n": True}, {"n": 1})):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                e(bad, exp, "false evidence")

    def test_p76_inherited_source_identity_is_not_dropped(self):
        good = {
            "pass": "P76", "status": "PASS",
            "sourceCommit": "a" * 40, "sourceTree": "b" * 40,
            "requiredGroupsPassed": 6,
            "originalThreeGameBaseline": 17211,
            "newOptInSourceRowImages": 19,
            "optInThreeGameRepresentations": 17230,
            "originalDosFixtureAndChromeP72P76Verified": True,
            "sourceAuditUnchanged": True,
            "nativePaletteOrRendererPlacementAsserted": False,
            "mainPromoted": False,
        }
        self.assertTrue(P["original_compatibility"](good, "a"*40, "b"*40)["sourceAndTreeMatched"])
        for changes in ({"sourceCommit":"c"*40},
                        {"sourceTree":"c"*40},
                        {"requiredGroupsPassed": 5},
                        {"originalDosFixtureAndChromeP72P76Verified": False},
                        {"nativePaletteOrRendererPlacementAsserted": True}):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                P["original_compatibility"]({**good, **changes}, "a"*40, "b"*40)

    def test_p78_original_complete_source_oracle_can_not_be_forged(self):
        good = {
            "pass":"P78_ORIGINAL","status":"PASS","game":"mk3",
            "originalSourceSha256":
                "72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517",
            "originalGameFilesLoaded":66,"baselineAssets":9186,
            "acceptedP76FirstImages":19,"additionalSourceIndexedImages":197,
            "visibleAfterExplicitOptIn":9402,
            "additionalIndexedPositionsPerPlane":6616595,
            "additionalPaintedOriginalPixels":1167687,
            "additionalSourceAbsentRows":8475,
            "exactOriginalSidecarHashesAndZIPsChecked":1182,
            "independentOriginalSourceAnd432PngOraclePass":True,
            "p76OriginalAssetIDsUnchanged":True,
            "nativePaletteOrAnimationOrStageMembershipClaimed":False,
            "originalChromeBrowserVerified":False
        }
        self.assertEqual(P["original_p78"](good)["originalVerifiedSidecars"],1182)
        for key,val in (("originalGameFilesLoaded",65),
                        ("additionalSourceIndexedImages",196),
                        ("independentOriginalSourceAnd432PngOraclePass",False),
                        ("p76OriginalAssetIDsUnchanged",False),
                        ("nativePaletteOrAnimationOrStageMembershipClaimed",True)):
            with self.subTest(field=key), self.assertRaises(ValueError):
                P["original_p78"]({**good,key:val})

    def test_p78_browser_download_does_not_substitute_source_oracle(self):
        good = {
            "pass":"P78_BROWSER","status":"PASS","originalGame":"mk3",
            "defaultOriginalAssets":9186,
            "preservedP76FirstIndexedImages":19,
            "additionalOriginalSourceIndexedImages":197,
            "explicitlyVisibleAssets":9402,
            "sourceIndexedPixelsOfFirstNewRecordVerified":7950,
            "originalSourceStreamRowTablesAndPngPixelParity":True,
            "sourceRecordOrderNotClaimedAsNativeAnimation":True,
            "nativePaletteOrStageMembershipClaimed":False,
        }
        P["chrome_p78"](good)
        for key,value in (("sourceIndexedPixelsOfFirstNewRecordVerified",0),
                          ("originalSourceStreamRowTablesAndPngPixelParity",False),
                          ("sourceRecordOrderNotClaimedAsNativeAnimation",False)):
            with self.subTest(field=key), self.assertRaises(ValueError):
                P["chrome_p78"]({**good,key:value})

    def test_p80_original_accepts_raw_records_not_frames(self):
        good = {
            "pass":"P80_ORIGINAL","status":"PASS","originalGame":"mk3",
            "originalDataSha256":
                "72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517",
            "genuineOriginalGameFilesLoaded":66,
            "acceptedOriginalMk3Baseline":9186,
            "acceptedP76FirstImages":19,"acceptedP78AdditionalIndexed":197,
            "previousOptInTotal":9402,"newVisibleAfterExplicitOptIn":9619,
            "sourceBaseIndexedPositionsVerified":64000,
            "originalSourceBaseIndexSha256":
                "3553eead898a40d15788ef8072634cef04b2047cf7d4055682e7129aa6e7dd2e",
            "originalRawContinuationRecordsIndividuallyByteVerified":216,
            "preservedEmptyRawRecords":6,
            "exactOriginalContinuationBytesVerified":1775852,
            "independentlyVerifiedP79SourceParts":220,
            "independentlyVerifiedP79PngPixels":128000,
            "acceptedP76P78SourceIdsUnchanged":True,
            "originalNativeOpacityOrPaletteAssigned":False,
            "originalContinuationFramesDecoded":0,
            "realChromeBrowserVerified":False
        }
        self.assertEqual(P["original_p80"](good)["originalContinuationFramesDecoded"],0)
        for key,val in (("preservedEmptyRawRecords",0),
                        ("exactOriginalContinuationBytesVerified",1775851),
                        ("originalRawContinuationRecordsIndividuallyByteVerified",215),
                        ("originalNativeOpacityOrPaletteAssigned",True),
                        ("originalContinuationFramesDecoded",216),
                        ("independentlyVerifiedP79PngPixels",0)):
            with self.subTest(field=key), self.assertRaises(ValueError):
                P["original_p80"]({**good,key:val})

    def test_p80_real_chrome_checks_opaque_index_and_raw_downloads(self):
        good = {
            "pass":"P80_BROWSER","status":"PASS","game":"mk3",
            "acceptedOriginalBaseline":9186,"p76ImageOptIn":19,
            "p78ImageOptIn":197,"newP80BaseImages":1,
            "newOriginalRawContinuationRecords":216,
            "visibleAfterExplicitOptIn":9619,
            "originalBaseIndexedPngPixelsVerified":64000,
            "originalDownloadedRawRecordBytesVerified":2,
            "emptyOriginalRecordDownloadVerified":True,
            "acceptedP76AndP78GroupsPreserved":True,
            "nativePaletteOrOpacityVerified":False,
            "nativeAnimationFramesFromContinuationsDecoded":0,
            "independentOriginalIndexedZipAndRawRecordParity":True,
        }
        P["chrome_p80"](good)
        for key,val in (("newOriginalRawContinuationRecords",215),
                        ("originalDownloadedRawRecordBytesVerified",1),
                        ("emptyOriginalRecordDownloadVerified",False),
                        ("nativePaletteOrOpacityVerified",True),
                        ("nativeAnimationFramesFromContinuationsDecoded",1),
                        ("independentOriginalIndexedZipAndRawRecordParity",False)):
            with self.subTest(field=key), self.assertRaises(ValueError):
                P["chrome_p80"]({**good,key:val})

    def test_unit_counts_require_unittest_success(self):
        good = b"Ran 9 tests in 0.3s\n\nOK\n"
        self.assertEqual(P["check_unittest"](b"",good,9,"P77")["sourceTests"],9)
        for stderr in (b"Ran 9 tests in 0.3s\nFAILED",
                       b"Ran 8 tests in 0.3s\n\nOK",
                       b"Ran 9 tests in 0.3s\nOK\nERROR: failed"):
            with self.subTest(stderr=stderr), self.assertRaises(ValueError):
                P["check_unittest"](b"",stderr,9,"test")

    def test_exact_interim_branch_allowlist_preserves_commit_audit(self):
        p61=(ROOT/"scripts/verify-p61-checkpoint.cjs").read_text(encoding="utf-8")
        p66=(ROOT/"scripts/verify-p66-checkpoint.py").read_text(encoding="utf-8")
        for content in (p61,p66):
            self.assertIn("interim/p79-original-extraction",content)
            self.assertIn("develop",content)
        self.assertIn("opening == closing", (ROOT/"scripts/verify-p81-checkpoint.py").read_text())
        self.assertIn('private_temp = work / "private-temporary"',
                      (ROOT/"scripts/verify-p81-checkpoint.py").read_text())
        self.assertIn('"TMPDIR": str(private_temp)',
                      (ROOT/"scripts/verify-p81-checkpoint.py").read_text())
        self.assertIn("P71[\"preflight\"]", (ROOT/"scripts/verify-p81-checkpoint.py").read_text())
        self.assertIn("len(nested_report[\"steps\"]) == 6",
                      (ROOT/"scripts/verify-p81-checkpoint.py").read_text())

    def test_no_unsupported_bypass_or_change_of_record_counts(self):
        source=(ROOT/"scripts/verify-p81-checkpoint.py").read_text(encoding="utf-8")
        self.assertIn("optInThreeGameAssetRepresentations\": 17644",source)
        self.assertIn("\"additionalOriginalRawStoredRecords\": 216",source)
        self.assertIn("\"nativePaletteOpacityStageOrAnimationOwnershipClaimed\": False",source)
        self.assertIn("\"originalDosAndRealChromeP76P78P80Verified\": True",source)
        self.assertNotIn("--skip-original",source)
        self.assertNotIn("--skip-browser",source)


if __name__ == "__main__":
    unittest.main(verbosity=2)
