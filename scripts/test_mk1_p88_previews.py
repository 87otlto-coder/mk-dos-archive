#!/usr/bin/env python3
"""P88 synthetic source-only regressions: no DOS files, no media fixtures."""
from __future__ import annotations

import io
import json
from pathlib import Path
import sys
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parent))
import mk1_p88_previews as producer
import verify_mk1_p88_previews as independent


def made_source(*, corrupt_hash=False, corrupt_mask=False, corrupt_geometry=False):
    specs = [
        ("ALPHA", 12, 2, 2, bytes((0, 128, 255, 4)), bytes((1, 0, 1, 1))),
        ("BETA", 18, 2, 1, bytes((17, 34)), bytes((0, 1))),
        ("ALPHA", 29, 1, 3, bytes((160, 3, 2)), bytes((1, 1, 0))),
    ]
    parts = []
    rows = []
    cursor = 0
    for table, offset, w, h, indexes, mask in specs:
        if corrupt_mask and offset == 18:
            mask = bytes((2, 1))
        row = {
            "tableSymbol": table, "descriptorWatcomOffset": offset,
            "resourcePath": table + ".GRA", "graOffset": offset,
            "width": w + (1 if corrupt_geometry and offset == 29 else 0),
            "height": h, "pixelCount": len(indexes),
            "x": 0, "y": 0, "decodeChecksum": "synthetic:" + str(offset),
            "indicesOffset": cursor, "maskOffset": cursor + len(indexes),
        }
        rows.append(row)
        parts.extend((indexes, mask))
        cursor += 2 * len(indexes)
    binary = b"".join(parts)
    descriptor_manifest = (json.dumps({
        "format": "mk1_animation_indexed_descriptor_payload_manifest_v1",
        "descriptorCount": len(rows), "binaryFile": "descriptor_pixels.bin",
        "descriptors": rows,
    }, indent=2) + "\n").encode()
    stream_manifest = (json.dumps({
        "format": "mk1_p65_lossless_anitab_source_streams_v1",
        "originalExeSha256": producer.CANONICAL,
        "originalIndexedBinarySha256": (
            "f" * 64 if corrupt_hash else producer.digest(binary)
        ),
        "originalIndexedBinaryByteLength": len(binary),
        "originalIndexedManifestSha256": producer.digest(descriptor_manifest),
        "originalPalettesNotAssigned": True,
        "nativeAnimationMillisecondsVerified": False,
        "worldPlacementAndStageCompositionVerified": False,
        "sourceTableCount": 1, "originalTableEntries": 3,
        "uniqueSourceExecutableStreams": 2, "indexedDescriptorCount": 3,
    }, indent=2) + "\n").encode()
    return producer.stored_zip([
        ("manifests/mk1_source_streams.json", stream_manifest),
        ("indexed/descriptor_manifest.json", descriptor_manifest),
        ("indexed/descriptor_pixels.bin", binary),
        ("README.txt", b"synthetic fixture no game bytes\n"),
    ])


def replace_member(archive, member, transform):
    with zipfile.ZipFile(io.BytesIO(archive)) as z:
        entries = [(name, transform(z.read(name)) if name == member else z.read(name))
                   for name in z.namelist()]
    return producer.stored_zip(entries)


class P88Tests(unittest.TestCase):
    def setUp(self):
        self.source = made_source()
        self.all = producer.build_export(self.source, None, canonical=False)

    def rejected(self, action):
        with self.assertRaises((ValueError, KeyError, zipfile.BadZipFile)):
            action()

    def test_all_sources_and_pngs(self):
        result = independent.verify_bytes(self.source, self.all, canonical=False)
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["exportedDescriptors"], 3)
        self.assertEqual(result["sourceIndexedPixelPositionsChecked"], 9)

    def test_selected_one(self):
        archive = producer.build_export(self.source, ["ALPHA:12"], canonical=False)
        self.assertEqual(independent.verify_bytes(self.source, archive, canonical=False)["exportedDescriptors"], 1)

    def test_selection_keeps_original_order(self):
        archive = producer.build_export(self.source, ["ALPHA:29", "ALPHA:12"], canonical=False)
        with zipfile.ZipFile(io.BytesIO(archive)) as z:
            manifest = json.loads(z.read("manifest.json"))
        self.assertEqual([r["originalDescriptorOrdinal"] for r in manifest["descriptors"]], [0, 2])

    def test_deterministic(self):
        self.assertEqual(self.all, producer.build_export(self.source, None, canonical=False))

    def test_opaque_zero_and_transparent_nonzero(self):
        with zipfile.ZipFile(io.BytesIO(self.all)) as z:
            w, h, pixels = independent.png_rgba(z.read("frames/0000/diagnostic-index-rgba.png"))
        self.assertEqual((w, h), (2, 2))
        self.assertEqual(pixels[:4], bytes((0, 0, 0, 255)))
        self.assertEqual(pixels[4:8], bytes((128, 128, 128, 0)))

    def test_missing_key_rejected(self):
        self.rejected(lambda: producer.build_export(self.source, ["GAMMA:999"], canonical=False))

    def test_repeated_key_rejected(self):
        self.rejected(lambda: producer.build_export(self.source, ["ALPHA:12", "ALPHA:12"], canonical=False))

    def test_empty_selection_rejected(self):
        self.rejected(lambda: producer.build_export(self.source, [], canonical=False))

    def test_source_hash_tamper_rejected(self):
        self.rejected(lambda: producer.build_export(made_source(corrupt_hash=True), None, canonical=False))

    def test_geometry_tamper_rejected(self):
        self.rejected(lambda: producer.build_export(made_source(corrupt_geometry=True), None, canonical=False))

    def test_mask_tamper_rejected(self):
        self.rejected(lambda: producer.build_export(made_source(corrupt_mask=True), None, canonical=False))

    def test_canonical_original_required_for_public_contract(self):
        self.rejected(lambda: producer.build_export(self.source, None, canonical=True))
        self.rejected(lambda: independent.verify_bytes(self.source, self.all, canonical=True))

    def test_sidecar_change_rejected_by_independent_verifier(self):
        tampered = replace_member(self.all, "frames/0001/original-indices.bin",
                                  lambda data: bytes((data[0] ^ 1,)) + data[1:])
        self.rejected(lambda: independent.verify_bytes(self.source, tampered, canonical=False))

    def test_png_change_rejected_by_independent_verifier(self):
        tampered = replace_member(self.all, "frames/0000/diagnostic-index-rgba.png",
                                  lambda data: data[:-2] + bytes((data[-2] ^ 1, data[-1])))
        self.rejected(lambda: independent.verify_bytes(self.source, tampered, canonical=False))

    def test_false_native_palette_claim_rejected(self):
        def change(data):
            value = json.loads(data)
            value["nativePaletteOwnershipVerified"] = True
            return json.dumps(value).encode()
        tampered = replace_member(self.all, "manifest.json", change)
        self.rejected(lambda: independent.verify_bytes(self.source, tampered, canonical=False))

    def test_false_animation_claim_rejected(self):
        def change(data):
            value = json.loads(data)
            value["originalFrameOrderOrDurationVerified"] = True
            return json.dumps(value).encode()
        tampered = replace_member(self.all, "manifest.json", change)
        self.rejected(lambda: independent.verify_bytes(self.source, tampered, canonical=False))

    def test_reordered_manifest_source_rejected(self):
        def change(data):
            value = json.loads(data)
            value["descriptors"] = list(reversed(value["descriptors"]))
            return json.dumps(value).encode()
        tampered = replace_member(self.all, "manifest.json", change)
        self.rejected(lambda: independent.verify_bytes(self.source, tampered, canonical=False))

    def test_source_package_identity_rejected(self):
        def change(data):
            value = json.loads(data)
            value["originalP65ZipSha256"] = "0" * 64
            return json.dumps(value).encode()
        tampered = replace_member(self.all, "manifest.json", change)
        self.rejected(lambda: independent.verify_bytes(self.source, tampered, canonical=False))

    def test_missing_zip_entry_rejected(self):
        with zipfile.ZipFile(io.BytesIO(self.all)) as z:
            entries = [(name, z.read(name)) for name in z.namelist()
                       if name != "frames/0002/original-paint-mask.bin"]
        tampered = producer.stored_zip(entries)
        self.rejected(lambda: independent.verify_bytes(self.source, tampered, canonical=False))

    def test_extra_zip_entry_rejected(self):
        with zipfile.ZipFile(io.BytesIO(self.all)) as z:
            entries = [(name, z.read(name)) for name in z.namelist()]
        tampered = producer.stored_zip(entries + [("frames/9999/extra.bin", b"x")])
        self.rejected(lambda: independent.verify_bytes(self.source, tampered, canonical=False))


if __name__ == "__main__":
    unittest.main(verbosity=2)
