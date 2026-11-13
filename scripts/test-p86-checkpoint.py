#!/usr/bin/env python3
"""P86 source-only independent acceptance and counterfeit-result refusals."""
from __future__ import annotations

import json
from pathlib import Path
import runpy
import unittest

ROOT = Path(__file__).resolve().parents[1]
P = runpy.run_path(str(ROOT / "scripts" / "verify-p86-checkpoint.py"))


def mk2_scan():
    return {
        "pass": "P84_CLI_SCAN", "status": "PASS", "game": "mk2",
        "sourceIdentity": "CANONICAL_P82_FOUR_ORIGINAL_FILES",
        "sourcePngFilesAvailableIfExported": 115,
        "fullGameAssetCatalogScanned": False,
        "nativeSceneCompositionOrAnimationClaimed": False,
        "originalFileSha256": dict.fromkeys(
            ("MK2.EXE","IMAGES.GRA","PORTAL.GRA","TOMB.GRA"), "f"*64),
        "stageSourceExportCoverage": {
            "tomb": {
                "originalFloorSourceDimensions": [896,48],
                "uncroppedSourceSpriteStreams": 16,
                "setupLocalLayerGroups": 6, "exportedSourcePngFiles": 68,
            },
            "portal": {
                "originalFloorSourceDimensions": [896,40],
                "uncroppedSourceSpriteStreams": 13,
                "setupLocalLayerGroups": 2, "exportedSourcePngFiles": 47,
            },
        },
    }


def mk2_result(action):
    data = {
        "pass": "P84_CLI_EXTRACT" if action=="extract" else "P84_CLI_VERIFY",
        "status": "PASS", "game": "mk2", "browserRequired": False,
        "fullGameAssetCatalogClaimed": False,
        "independentOriginalByteAndPngVerification": {
            "pass": "P82_INDEPENDENT", "status": "PASS",
            "originalGame": "mk2",
            "originalFileSourceFingerprintsVerified": 4,
            "originalSourceIndexPositionsRechecked": 939425,
            "originalSourcesIncludedInZip": False,
            "originalStages": ["tomb","portal"],
            "sourceNativeFloors": 2, "sourceNativeSprites": 29,
            "sourcePngFilesIndependentPixelParity": 115,
            "sourceSetupLocalLayers": 8,
            "nativeCameraOrStageCompositeClaimed": False,
            "nativeAnimationOrParallaxTimingClaimed": False,
        },
    }
    if action == "extract":
        data["producer"] = {
            "pass": "P82_EXPORT", "status": "PASS", "originalGame": "mk2",
            "originalSourceFilesCopiedIntoZip": 0,
            "independentSourcePngFiles": 115,
            "originalUncroppedSprites": 29,
            "setupLocalLayers": 8, "zipMembers": 117,
            "finalNativeStageAssemblyClaimed": False,
            "nativeAnimationOrParallaxTimingClaimed": False,
        }
    return data


def mk3_scan():
    return {
        "pass":"P85_CLI_MK3_SCAN","status":"PASS","game":"mk3",
        "sourceIdentity":"CANONICAL_P79_DATA_MK3",
        "originalDataMk3Sha256":"72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517",
        "sourceIndexedBaseDimensions":[320,200],
        "sourceBaseIndexedPositions":64000,
        "sourceRawContinuationRecords":216,
        "sourcePartsIfExtracted":220,
        "sourcePreviewPngsIfExtracted":2,
        "privateZipMembersIfExtracted":223,
        "fullGameAssetCatalogScanned":False,
        "nativePaletteOrOpacityVerified":False,
        "continuationFramesDecoded":0,
        "nativeStageMembershipOrAnimationTimingClaimed":False,
    }


def mk3_result(action):
    return {
        "pass": "P85_CLI_MK3_EXTRACT" if action == "extract" else "P85_CLI_MK3_VERIFY",
        "status":"PASS", "game":"mk3", "browserRequired":False,
        "sourceRawContinuationRecords":216,
        "sourcePreviewPngsVerified":2,
        "nativePaletteOrOpacityVerified":False,
        "continuationFramesDecoded":0,
        "nativeStageMembershipOrAnimationTimingClaimed":False,
        "fullGameAssetCatalogClaimed":False,
        "independentOriginalSourceAndPngVerification": {
            "passName":"P79_ORIGINAL","status":"PASS",
            "sourceParts":220,"records":216,
            "baseIndexedPositions":64000,
            "pngPixelsCompared":128000,
            "intervalBytes":1840634,
            "storedPayloadBytes":1772828,
            "zipMembers":223,
        },
    }


class P86SyntheticCheckpoint(unittest.TestCase):
    def test_four_required_groups_without_invented_native_claims(self):
        self.assertEqual(P["STEPS"], (
            "p81_original_three_game_and_chrome",
            "p84_original_mk2_cli_source",
            "p83_original_mk2_real_chrome",
            "p85_original_mk3_cli_source",
        ))

    def test_json_stdout_refuses_progress_contamination(self):
        self.assertEqual(P["read_json_output"](b'{"status":"PASS"}',"synthetic")["status"],"PASS")
        for bogus in [b'progress\n{"status":"PASS"}',b'{"status":"PASS"}\nPASS',
                      b'{"status":"PASS"}{"status":"PASS"}', b'\xff', b'[]']:
            with self.subTest(bogus=bogus), self.assertRaises(ValueError):
                P["read_json_output"](bogus,"synthetic")

    def test_mk2_original_source_scan_and_false_provenance(self):
        good=mk2_scan()
        P["check_p84_scan"](good)
        for change in ({"sourcePngFilesAvailableIfExported":114},
                       {"nativeSceneCompositionOrAnimationClaimed":True},
                       {"fullGameAssetCatalogScanned":True},
                       {"sourceIdentity":"SYNTHETIC"}):
            with self.subTest(change=change),self.assertRaises(ValueError):
                P["check_p84_scan"]({**good,**change})
        wrong=mk2_scan()
        wrong["stageSourceExportCoverage"]["portal"]["originalFloorSourceDimensions"]=[896,48]
        with self.assertRaises(ValueError):P["check_p84_scan"](wrong)

    def test_mk2_independent_oracle_must_not_be_skippped(self):
        for action in ("extract","verify"):
            good=mk2_result(action)
            P["check_p84_result"](good,action)
            for key,value in (("sourcePngFilesIndependentPixelParity",114),
                              ("originalSourceIndexPositionsRechecked",939424),
                              ("nativeCameraOrStageCompositeClaimed",True)):
                bad=mk2_result(action)
                bad["independentOriginalByteAndPngVerification"][key]=value
                with self.subTest(action=action,key=key),self.assertRaises(ValueError):
                    P["check_p84_result"](bad,action)

    def test_mk3_raw_is_never_promoted_to_animation(self):
        good=mk3_scan()
        P["check_p85_scan"](good)
        for change in ({"continuationFramesDecoded":216},
                       {"nativePaletteOrOpacityVerified":True},
                       {"sourceRawContinuationRecords":215},
                       {"fullGameAssetCatalogScanned":True}):
            with self.subTest(change=change),self.assertRaises(ValueError):
                P["check_p85_scan"]({**good,**change})

    def test_mk3_independent_oracle_requires_full_interval_and_png_parity(self):
        for action in ("extract","verify"):
            P["check_p85_result"](mk3_result(action),action)
            for key,value in (("records",215),("pngPixelsCompared",127999),
                              ("intervalBytes",1840633),("zipMembers",222),
                              ("status","FAIL")):
                bad=mk3_result(action)
                bad["independentOriginalSourceAndPngVerification"][key]=value
                with self.subTest(action=action,key=key),self.assertRaises(ValueError):
                    P["check_p85_result"](bad,action)

    def test_int_bool_false_evidence_cannot_pass(self):
        for value in (False,True, "0", None):
            bad=mk3_result("verify")
            bad["continuationFramesDecoded"]=value
            with self.subTest(value=value),self.assertRaises(ValueError):
                P["check_p85_result"](bad,"verify")

    def test_summary_audit_cannot_accept_forged_source_commit(self):
        good={
            "pass":"P81","status":"PASS","sourceCommit":"a"*40,
            "sourceTree":"b"*40,"requiredGroupsPassed":9,
            "inheritedP76OriginalGroups":6,"inheritedP71OriginalGroups":10,
            "originalThreeGameBaseline":17211,
            "originalMk3AssetCounts":[9186,9205,9402,9619],
            "additionalIndexedImageRepresentations":217,
            "additionalOriginalRawStoredRecords":216,
            "optInThreeGameAssetRepresentations":17644,
            "originalDosAndRealChromeP76P78P80Verified":True,
            "originalP77P79SourceVerifiedViaIndependentOracles":True,
            "sourceAuditUnchanged":True,
            "nativePaletteOpacityStageOrAnimationOwnershipClaimed":False,
            "mainOrDevelopPromoted":False,
        }
        P["check_p81"](good,"a"*40,"b"*40)
        for change in ({"sourceCommit":"c"*40},
                       {"requiredGroupsPassed":8},
                       {"originalDosAndRealChromeP76P78P80Verified":False},
                       {"mainOrDevelopPromoted":True}):
            with self.subTest(change=change),self.assertRaises(ValueError):
                P["check_p81"]({**good,**change},"a"*40,"b"*40)

    def test_p83_chrome_download_and_independent_oracle_not_dropped(self):
        good={
            "pass":"P83_BROWSER","status":"PASS","originalGame":"mk2",
            "acceptedDefaultMk2Assets":5369,
            "explicitAdditionalStageSourcePngs":115,
            "visibleAfterExplicitImport":5484,
            "originalNativeFloorColumns":896,
            "originalStagesVerified":["tomb","portal"],
            "originalNativeSpritesRepresented":29,
            "setupLocalSourceLayersRepresented":8,
            "originalP82SourcePngsIndependentlyRechecked":115,
            "sourceIndexedPositionsIndependent":939425,
            "originalChromePngDownloadsByteExact":3,
            "sourceStageImageFilesRemainByteExact":True,
            "originalNativePaletteCameraStageCompositionOrAnimationClaimed":False,
            "originalCommercialGameSourcesIncludedInExport":False,
        }
        P["check_p83"](good)
        for change in ({"originalChromePngDownloadsByteExact":2},
                       {"visibleAfterExplicitImport":5483},
                       {"sourceStageImageFilesRemainByteExact":False},
                       {"originalNativePaletteCameraStageCompositionOrAnimationClaimed":True}):
            with self.subTest(change=change),self.assertRaises(ValueError):
                P["check_p83"]({**good,**change})


if __name__ == "__main__":
    unittest.main(verbosity=2)
