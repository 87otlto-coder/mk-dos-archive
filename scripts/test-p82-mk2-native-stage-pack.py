#!/usr/bin/env python3
"""P82 source-only original-source/copy-safety controls; synthetic bytes only.

These tests cannot substitute for an original DOS MK2 export and independent
all-source-index/opacity/RGB pixel readback on the installed original game.
"""
from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
import runpy
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
P = runpy.run_path(str(ROOT / "scripts/export-mk2-p82-native-stage-pack.py"))


def synthetic():
    original = {k: k.encode("ascii") for k in P["ORIGINAL_HASHES"]}
    files = {f"tomb/synthetic_{i:03}.png": b"NOT_AN_ORIGINAL_PNG" + bytes([i])
             for i in range(68)}
    manifest = {
        "schema": "mk2_o132_native_source_layer_pack_v1",
        "status": "STATIC_CAMERA_INDEPENDENT_LAYER_EXPORT",
        "sourceExecutableSHA256": P["digest"](original["MK2.EXE"]),
        "motion": {
            "parallaxMotionRulesRecovered": False,
            "animationFrameOrderingRecovered": False,
            "animationDurationsRecovered": False,
        },
        "compositing": {
            "finalDrawOrderRecovered": False,
            "liveCameraPositionRecovered": False,
            "interSetupLayerPositionRecovered": False,
        },
        "stages": [{
            "stage": "tomb",
            "packedFloor": {
                "nativeDimensions": [896, 48], "cameraCropApplied": False,
            },
            "nativeSpriteDescriptors": [{
                "unalteredNativeSpriteBounds": True,
                "originalGameAnimationMembershipKnown": False,
            } for _ in range(16)],
            "setupLocalLayers": [{
                "registeredStageWorldPosition": None,
                "parallaxMovementRecovered": False,
                "animationFramesRecovered": False,
            } for _ in range(6)],
        }],
        "files": [{
            "path": name, "bytes": len(blob), "sha256": P["digest"](blob),
            "format": "INDEX8_PNG",
        } for name, blob in files.items()],
    }
    return manifest, files, original


class P82SourceOnly(unittest.TestCase):
    def test_strict_source_identity_is_explicit(self):
        self.assertEqual(P["ORIGINAL_HASHES"]["MK2.EXE"],
                         "fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65")
        self.assertEqual(set(P["ORIGINAL_HASHES"]),
                         {"MK2.EXE", "TOMB.GRA", "PORTAL.GRA", "IMAGES.GRA"})
        self.assertEqual(P["STAGE_DATA"]["tomb"], (896, 48, 16, 6))
        self.assertEqual(P["STAGE_DATA"]["portal"], (896, 40, 13, 2))
        with self.assertRaisesRegex(ValueError, "commercial game"):
            P["load_original_folder"](ROOT)

    def test_synthetic_provenance_packs_reproducibly_without_game_media(self):
        m, blobs, original = synthetic()
        data, policy = P["pack_bytes"](m, blobs, original, ("tomb",))
        self.assertEqual(len(data), 70)
        self.assertEqual(policy["summary"]["originalNativeSpriteCount"], 16)
        self.assertEqual(policy["summary"]["originalSetupLocalLayerCount"], 6)
        self.assertFalse(policy["originalAnimationOrParallaxTimingProven"])
        self.assertFalse(policy["nativeCameraOrFinalStageCompositingProven"])
        self.assertTrue(policy["allOriginalCommercialGameFilesExcludedFromExport"])
        self.assertEqual({k for k in data if k.endswith(".EXE") or k.endswith(".GRA")}, set())
        with tempfile.TemporaryDirectory(prefix="p82-source-only-") as tmp:
            a, b = Path(tmp) / "a.zip", Path(tmp) / "b.zip"
            P["write_zip_new"](a, data)
            P["write_zip_new"](b, data)
            self.assertEqual(a.read_bytes(), b.read_bytes())
            with zipfile.ZipFile(a) as z:
                self.assertEqual(len(z.namelist()), 70)
                self.assertIsNone(z.testzip())
                self.assertEqual(json.loads(z.read("P82_EXPORT_PROVENANCE.json"))["format"],
                                 P["FORMAT"])

    def test_no_overwriting_or_deleting_existing_files(self):
        with tempfile.TemporaryDirectory(prefix="p82-source-only-") as tmp:
            target = Path(tmp) / "existing.zip"
            target.write_bytes(b"USER_DO_NOT_REPLACE")
            with self.assertRaisesRegex(ValueError, "overwrite"):
                P["write_zip_new"](target, {"test/hello.txt": b"new"})
            self.assertEqual(target.read_bytes(), b"USER_DO_NOT_REPLACE")
            notexisting = Path(tmp) / "unsafe.zip"
            with self.assertRaisesRegex(ValueError, "unsafe ZIP member"):
                P["write_zip_new"](notexisting, {"../overwrite.txt": b"tamper"})
            self.assertFalse(notexisting.exists())

    def test_false_native_renderer_palette_or_frame_claims_rejected(self):
        m, blobs, original = synthetic()
        for section, field, value in (
            ("motion", "parallaxMotionRulesRecovered", True),
            ("motion", "animationFrameOrderingRecovered", True),
            ("motion", "animationDurationsRecovered", True),
            ("compositing", "finalDrawOrderRecovered", True),
            ("compositing", "liveCameraPositionRecovered", True),
            ("compositing", "interSetupLayerPositionRecovered", True),
        ):
            with self.subTest(section=section, field=field):
                faulty = copy.deepcopy(m)
                faulty[section][field] = value
                with self.assertRaises(ValueError):
                    P["pack_bytes"](faulty, blobs, original, ("tomb",))

    def test_malformed_or_unsafe_manifest_rejected(self):
        m, blobs, original = synthetic()
        bads = []
        bad = copy.deepcopy(m)
        bad["stages"][0]["packedFloor"]["nativeDimensions"] = [320, 48]
        bads.append(bad)
        bad = copy.deepcopy(m)
        bad["stages"][0]["nativeSpriteDescriptors"] = []
        bads.append(bad)
        bad = copy.deepcopy(m)
        bad["stages"][0]["setupLocalLayers"][0]["registeredStageWorldPosition"] = [0, 0]
        bads.append(bad)
        bad = copy.deepcopy(m)
        bad["sourceExecutableSHA256"] = "0" * 64
        bads.append(bad)
        bad = copy.deepcopy(m)
        bad["files"][0]["sha256"] = "f" * 64
        bads.append(bad)
        bad = copy.deepcopy(m)
        bad["files"][1]["path"] = bad["files"][0]["path"]
        bads.append(bad)
        for n, invalid in enumerate(bads):
            with self.subTest(index=n), self.assertRaises(ValueError):
                P["pack_bytes"](invalid, blobs, original, ("tomb",))
        bad = dict(blobs)
        bad["../escape.png"] = bad.pop("tomb/synthetic_000.png")
        with self.assertRaisesRegex(ValueError, "file list changed|unsafe"):
            P["pack_bytes"](m, bad, original, ("tomb",))

    def test_requested_stage_scope_cannot_be_repeated_or_unlisted(self):
        with self.assertRaisesRegex(ValueError, "noncanonical"):
            P["build_original_pack"](Path("/nonexistent"), Path("/nonexistent.zip"),
                                     ("tomb", "tomb"))
        with self.assertRaisesRegex(ValueError, "noncanonical"):
            P["build_original_pack"](Path("/nonexistent"), Path("/nonexistent.zip"),
                                     ("arena",))


if __name__ == "__main__":
    unittest.main(verbosity=2)
