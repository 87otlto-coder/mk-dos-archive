#!/usr/bin/env python3
"""P89 original-free deterministic regression/false-source controls.

No commercial files, original pixels, sound or screenshots are used in tests.
Tests synthetic *structure*, not hypotheses about native MK3 codecs, MK1
playback or MK2 final stage compositing.
"""
from __future__ import annotations

import io
import json
from pathlib import Path
import struct
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parent))
import preflight
import structures


def zip_bytes(data):
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_STORED) as z:
        for name, payload in data.items():
            z.writestr(name, payload)
    return out.getvalue()


def json_bytes(value):
    return json.dumps(value, sort_keys=True, indent=2).encode()


def create_r1():
    entries = {
        "header.bin": struct.pack("<HHH", 2, 2, 1),
        "adjacent-rgb8.bin": b"z" * 768,
        "base-header.bin": struct.pack("<II", 0, 2),
        "base-indices.bin": bytes((3, 7)),
        "records/000.bin": struct.pack("<HIII", 3, 4, 5, 3) + b"abc",
        "records/001.bin": struct.pack("<HIII", 3, 0, 0, 0),
        "index-preview.png": b"synthetic-not-decoded",
        "adjacent-rgb8-comparison.png": b"synthetic-not-decoded",
    }
    source_names = [
        "header.bin", "adjacent-rgb8.bin", "base-header.bin",
        "base-indices.bin", "records/000.bin", "records/001.bin",
    ]
    cursor = 123
    parts = []
    for n in source_names:
        row = {"path": n, "offset": cursor,
               "length": len(entries[n]), "sha256": structures.sha(entries[n])}
        if n.startswith("records"):
            tag, a, b, length = struct.unpack_from("<HIII", entries[n])
            row.update(fieldA=a, fieldB=b, payloadLength=length,
                       payloadOffset=cursor+14)
        parts.append(row)
        cursor += len(entries[n])
    entries["manifest.json"] = json_bytes({
        "format": "mk3_p79_leading_span_v1",
        "spanOffset": 123, "spanLength": cursor-123,
        "width": 2, "height": 1, "continuationCount": 2,
        "sourceParts": parts, "sourceSha256": "synthetic-source",
        "nativePaletteVerified": False, "continuationRenderingVerified": False,
        "stageMembershipVerified": False,
    })
    return entries


def create_r2():
    pixels = bytes((0, 200, 1, 0))
    descriptor = json_bytes({
        "format": "mk1_animation_indexed_descriptor_payload_manifest_v1",
        "descriptorCount": 1,
        "descriptors": [{"tableSymbol": "SYNTHETIC", "descriptorWatcomOffset": 12,
                         "width": 2, "height": 1, "indicesOffset": 0,
                         "maskOffset": 2, "pixelCount": 2}],
    })
    streams = json_bytes({
        "format": "mk1_p65_lossless_anitab_source_streams_v1",
        "originalExeSha256": "SYNTHETIC-NOT-A-GAME",
        "sourceTableCount": 1, "indexedDescriptorCount": 1,
        "originalIndexedBinarySha256": structures.sha(pixels),
        "originalIndexedBinaryByteLength": len(pixels),
        "originalIndexedManifestSha256": structures.sha(descriptor),
        "originalPalettesNotAssigned": True,
        "nativeAnimationMillisecondsVerified": False,
        "worldPlacementAndStageCompositionVerified": False,
        "tables": [{
            "symbol": "SYNTHETIC", "entries": [
                {"sourceStreamWatcomOffset": 30, "sourceDescriptorKey": None}],
            "sourceStreams": [{
                "sourceStreamWatcomOffset": 30,
                "sourceInstructionEncounterOrderOnly": True,
                "nativeRuntimeTraversalVerified": False,
                "termination": "END",
                "events": [
                    {"eventOrdinal": 0, "kind": "frame",
                     "sourceFramePartDescriptorKeys": ["SYNTHETIC:12"],
                     "frameTimingMilliseconds": None,
                     "nativePaletteSelected": None, "runtimeCompositionVerified": False},
                    {"eventOrdinal": 1, "kind": "end"},
                ],
            }],
        }],
    })
    return {
        "manifests/mk1_source_streams.json": streams,
        "indexed/descriptor_manifest.json": descriptor,
        "indexed/descriptor_pixels.bin": pixels,
        "README.txt": b"synthetic original-free structure",
    }


def create_r3():
    png = b"synthetic-evidence-only"
    report = {
        "schema": "mk2_o132_native_source_layer_pack_v1",
        "status": "STATIC_CAMERA_INDEPENDENT_LAYER_EXPORT",
        "files": [{"path": "tomb/synthetic.png",
                   "sha256": structures.sha(png), "bytes": len(png)}],
        "stages": [{
            "stage": "tomb",
            "packedFloor": {"nativeDimensions": [4,2], "cameraCropApplied": False},
            "nativeSpriteDescriptors": [],
            "setupLocalLayers": [],
        }],
    }
    policy = {
        "format": "mkdos_p82_mk2_uncropped_source_layer_pack_v1",
        "stageNames": ["tomb"],
        "nativeCameraOrFinalStageCompositingProven": False,
        "originalAnimationOrParallaxTimingProven": False,
        "originalSourceIndexAndOpacityPreserved": True,
        "allOriginalCommercialGameFilesExcludedFromExport": True,
    }
    return {
        "tomb/synthetic.png": png,
        "O132_SCENE_LAYERS.json": json_bytes(report),
        "P82_EXPORT_PROVENANCE.json": json_bytes(policy),
    }


def alter_json(data, name, fn):
    payload = dict(data)
    item = json.loads(payload[name])
    fn(item)
    payload[name] = json_bytes(item)
    return zip_bytes(payload)


class P89Synthetic(unittest.TestCase):
    def rejected(self, call):
        with self.assertRaises((ValueError, KeyError, TypeError, IndexError, zipfile.BadZipFile)):
            call()

    def test_r1_structural_census_without_codec(self):
        result = structures.r1_mk3_p79(zip_bytes(create_r1()), canonical=False)
        self.assertEqual((result["recordCount"], result["totalPayloadBytes"]), (2,3))
        self.assertEqual(result["zeroLengthOrdinals"], [1])
        self.assertEqual(result["nativeContinuationImagesDecoded"], 0)

    def test_r1_wrong_tag_refused(self):
        parts = create_r1()
        blob = bytearray(parts["records/000.bin"])
        blob[:2] = b"\x04\x00"
        parts["records/000.bin"] = bytes(blob)
        self.rejected(lambda: structures.r1_mk3_p79(zip_bytes(parts), canonical=False))

    def test_r1_wrong_source_hash_refused(self):
        parts = create_r1()
        self.rejected(lambda: structures.r1_mk3_p79(alter_json(
            parts, "manifest.json",
            lambda v: v["sourceParts"][0].__setitem__("sha256", "f" * 64)), canonical=False))

    def test_r1_unknown_claim_refused(self):
        parts = create_r1()
        self.rejected(lambda: structures.r1_mk3_p79(alter_json(
            parts, "manifest.json",
            lambda v: v.__setitem__("continuationRenderingVerified", True)), canonical=False))

    def test_r1_extra_payload_refused(self):
        parts = create_r1()
        parts["records/001.bin"] += b"x"
        self.rejected(lambda: structures.r1_mk3_p79(zip_bytes(parts), canonical=False))

    def test_r1_original_canonical_gate_refuses_synthetic(self):
        self.rejected(lambda: structures.r1_mk3_p79(zip_bytes(create_r1()), canonical=True))

    def test_r2_source_frame_graph_no_playback(self):
        result = structures.r2_mk1_p65(zip_bytes(create_r2()), canonical=False)
        self.assertEqual((result["sourceFrameOccurrences"], result["sourceControlOccurrences"]), (1,1))
        self.assertEqual(result["sourceStreamCountDistinct"], 1)
        self.assertTrue(result["originalSourceEncounterOrderIsNotNativePlayback"])

    def test_r2_unknown_descriptor_refused(self):
        data = create_r2()
        self.rejected(lambda: structures.r2_mk1_p65(alter_json(
            data, "manifests/mk1_source_streams.json",
            lambda v: v["tables"][0]["sourceStreams"][0]["events"][0]
            ["sourceFramePartDescriptorKeys"].__setitem__(0, "UNPROVEN:99")), canonical=False))

    def test_r2_false_timing_refused(self):
        data = create_r2()
        self.rejected(lambda: structures.r2_mk1_p65(alter_json(
            data, "manifests/mk1_source_streams.json",
            lambda v: v["tables"][0]["sourceStreams"][0]["events"][0]
            .__setitem__("frameTimingMilliseconds", 30)), canonical=False))

    def test_r2_wrong_index_payload_refused(self):
        data = create_r2()
        data["indexed/descriptor_pixels.bin"] = b"abcd"
        self.rejected(lambda: structures.r2_mk1_p65(zip_bytes(data), canonical=False))

    def test_r2_synthetic_cannot_be_canonical(self):
        self.rejected(lambda: structures.r2_mk1_p65(zip_bytes(create_r2()), canonical=True))

    def test_r3_stage_source_only(self):
        result = structures.r3_mk2_p82(zip_bytes(create_r3()), canonical=False)
        self.assertEqual(result["sourcePngFiles"], 1)
        self.assertEqual(result["nativeCompositesProduced"], 0)
        self.assertFalse(result["nativeCameraOrDrawOrderVerified"])

    def test_r3_fake_native_composite_refused(self):
        data = create_r3()
        self.rejected(lambda: structures.r3_mk2_p82(alter_json(
            data, "P82_EXPORT_PROVENANCE.json",
            lambda v: v.__setitem__("nativeCameraOrFinalStageCompositingProven", True)),
            canonical=False))

    def test_r3_wrong_png_sha_refused(self):
        data = create_r3()
        data["tomb/synthetic.png"] = b"edited-source"
        self.rejected(lambda: structures.r3_mk2_p82(zip_bytes(data), canonical=False))

    def test_r3_wrong_stage_world_refused(self):
        data = create_r3()
        def falsify(value):
            value["stages"][0]["setupLocalLayers"] = [{
                "registeredStageWorldPosition": [42,20],
                "animationFramesRecovered": False, "parallaxMovementRecovered": False,
            }]
        self.rejected(lambda: structures.r3_mk2_p82(alter_json(
            data, "O132_SCENE_LAYERS.json", falsify), canonical=False))

    def test_r3_canonical_original_scope_refuses_synthetic(self):
        self.rejected(lambda: structures.r3_mk2_p82(zip_bytes(create_r3()), canonical=True))

    def test_duplicate_zip_member_refused(self):
        out = io.BytesIO()
        with zipfile.ZipFile(out, "w") as z:
            z.writestr("x", b"a")
            z.writestr("x", b"b")
        self.rejected(lambda: structures.read_zip(out.getvalue()))

    def test_preflight_private_report_safety(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "SOURCE"
            root.mkdir()
            fixture_root = Path(directory) / "FIXTURES"
            fixture_root.mkdir()
            fixture = fixture_root / "mk1"
            fixture.mkdir()
            private = fixture_root / "VALIDATION"
            private.mkdir()
            allowed = preflight.private_report_path(private / "new.json",
                {"mk1": fixture}, root=root)
            self.assertEqual(allowed, (private / "new.json").resolve())
            self.rejected(lambda: preflight.private_report_path(root / "out.json",
                {"mk1": fixture}, root=root))
            self.rejected(lambda: preflight.private_report_path(fixture / "in-original.json",
                {"mk1": fixture}, root=root))

    def test_preflight_unknown_original_never_passes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "SOURCE"
            root.mkdir()
            fixture = Path(directory) / "MK1"
            fixture.mkdir()
            (fixture / "MK1.EXE").write_bytes(b"synthetic not canonical")
            self.rejected(lambda: preflight.original_fixture("mk1", fixture, root=root))

    def test_source_only_preflight_distinguishes_missing_original(self):
        result = preflight.preflight()
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["originalInputsDirectlyTested"], 0)
        self.assertEqual({e["classification"] for e in result["originalFixtureEvidence"]},
                         {"UNAVAILABLE"})
        self.assertTrue(result["sourceOnlyPASSDoesNotMeanOriginalFixturePASS"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
