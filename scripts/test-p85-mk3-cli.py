#!/usr/bin/env python3
"""P85 MK3 CLI synthetic source, export, refusal and oracle tests; no game files."""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
import runpy
import subprocess
import sys
import tempfile
import types
import unittest
from unittest.mock import Mock

ROOT = Path(__file__).resolve().parents[1]
P85 = runpy.run_path(str(ROOT / "scripts" / "mk3_p85_cli.py"))
BASE = [sys.executable, str(ROOT / "scripts" / "mkext.py")]


def synthetic_producer():
    start = P85["EXPECTED_GAP"]["offset"]
    size = P85["EXPECTED_GAP"]["length"]
    data = b"\x00" * (start + size) + b"FORM"
    signature = hashlib.sha256(data).hexdigest()
    manifest = {
        "format": "mk3_p79_leading_span_v1",
        "spanOffset": start, "spanLength": size,
        "width": 320, "height": 200, "continuationCount": 216,
        "sourceParts": [{} for _ in range(220)],
        "nativePaletteVerified": False,
        "continuationRenderingVerified": False,
        "stageMembershipVerified": False,
        "sourceSha256": signature,
    }
    producer = types.SimpleNamespace(
        DATA_SHA256=signature,
        read_original_data=Mock(return_value=data),
        sha=hashlib.sha256,
        iff_forms_and_gaps=Mock(return_value=(
            [object()] * 416, [dict(offset=start, length=size)] +
            [dict(offset=0, length=0)] * 19,
        )),
        parse_span=Mock(return_value=(manifest, [
            ("mock-entry", b"") for _ in range(222)
        ])),
        export=Mock(return_value=manifest),
    )
    # Match the real P79 module's sha(data) -> hexdigest() interface.
    producer.sha = lambda value: hashlib.sha256(value).hexdigest()
    return producer


def accepted_oracle():
    return {
        "passName": "P79_ORIGINAL", "status": "PASS",
        "sourceParts": 220, "records": 216,
        "baseIndexedPositions": 64000, "pngPixelsCompared": 128000,
        "intervalBytes": 1840634, "zipMembers": 223,
    }


class P85Mk3Cli(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="mkext-p85-offline-")
        self.addCleanup(self.temp.cleanup)
        self.outside = Path(self.temp.name)
        self.original = self.outside / "original"
        self.original.mkdir()
        self.output = self.outside / "exports"
        self.output.mkdir()

    def args(self, action, *, stage="both", archive=None):
        return argparse.Namespace(
            game="mk3", action=action, source=self.original,
            out=self.output / "source.zip", archive=archive or self.output / "source.zip",
            stage=stage,
        )

    def test_help_and_unrecognized_game_explicitly_unsupported(self):
        result = subprocess.run(BASE + ["--help"], text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        bad = subprocess.run(
            BASE + ["scan", "--game", "mk4", "--source", str(self.original)],
            text=True, capture_output=True)
        self.assertNotEqual(bad.returncode, 0)
        self.assertIn("invalid choice", bad.stderr)

    def test_scan_authenticates_only_leading_source_and_classifies_unknowns(self):
        producer = synthetic_producer()
        result = P85["run_mk3"](self.args("scan"), producer=producer)
        self.assertEqual(result["pass"], "P85_CLI_MK3_SCAN")
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["sourceBaseIndexedPositions"], 64000)
        self.assertEqual(result["sourceRawContinuationRecords"], 216)
        self.assertEqual(result["sourcePartsIfExtracted"], 220)
        self.assertEqual(result["privateZipMembersIfExtracted"], 223)
        self.assertFalse(result["fullGameAssetCatalogScanned"])
        self.assertFalse(result["nativePaletteOrOpacityVerified"])
        self.assertEqual(result["continuationFramesDecoded"], 0)
        producer.read_original_data.assert_called_once_with(self.original)

    def test_scan_rejects_altered_original_sha(self):
        producer = synthetic_producer()
        producer.DATA_SHA256 = "0" * 64
        with self.assertRaisesRegex(ValueError, "SHA256 identity"):
            P85["run_mk3"](self.args("scan"), producer=producer)

    def test_scan_rejects_fake_form_intervals(self):
        producer = synthetic_producer()
        producer.iff_forms_and_gaps.return_value = ([], [])
        with self.assertRaisesRegex(ValueError, "source interval/FORM topology"):
            P85["run_mk3"](self.args("scan"), producer=producer)

    def test_scan_rejects_fabricated_animation_ownership(self):
        producer = synthetic_producer()
        fake = producer.parse_span.return_value[0].copy()
        fake["continuationRenderingVerified"] = True
        producer.parse_span.return_value = (fake, [("", b"")] * 222)
        with self.assertRaisesRegex(ValueError, "confidence mismatch"):
            P85["run_mk3"](self.args("scan"), producer=producer)

    def test_extract_calls_existing_producer_then_independent_verifier(self):
        producer = synthetic_producer()
        oracle = types.SimpleNamespace(verify=Mock(return_value=accepted_oracle()))
        result = P85["run_mk3"](self.args("extract"), producer=producer, oracle=oracle)
        self.assertEqual(result["pass"], "P85_CLI_MK3_EXTRACT")
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["sourceRawContinuationRecords"], 216)
        self.assertEqual(result["continuationFramesDecoded"], 0)
        self.assertFalse(result["nativePaletteOrOpacityVerified"])
        self.assertFalse(result["fullGameAssetCatalogClaimed"])
        producer.export.assert_called_once_with(self.original, self.output / "source.zip")
        oracle.verify.assert_called_once_with(self.original, self.output / "source.zip")

    def test_verify_reruns_original_oracle_without_producing_archive(self):
        producer = synthetic_producer()
        oracle = types.SimpleNamespace(verify=Mock(return_value=accepted_oracle()))
        result = P85["run_mk3"](self.args("verify"), producer=producer, oracle=oracle)
        self.assertEqual(result["pass"], "P85_CLI_MK3_VERIFY")
        self.assertEqual(result["independentOriginalSourceAndPngVerification"]["status"], "PASS")
        producer.export.assert_not_called()
        oracle.verify.assert_called_once()

    def test_extract_rejects_bad_independent_oracle(self):
        producer = synthetic_producer()
        bad = accepted_oracle()
        bad["pngPixelsCompared"] = 127999
        with self.assertRaisesRegex(ValueError, "acceptance failed"):
            P85["run_mk3"](
                self.args("extract"), producer=producer,
                oracle=types.SimpleNamespace(verify=lambda *_: bad))

    def test_rejects_existing_archive_without_overwriting_or_exporting(self):
        existing = self.output / "source.zip"
        existing.write_bytes(b"EXISTING_PRIVATE_FILE_MUST_STAY")
        producer = synthetic_producer()
        with self.assertRaisesRegex(ValueError, "overwrite"):
            P85["run_mk3"](self.args("extract"), producer=producer)
        self.assertEqual(existing.read_bytes(), b"EXISTING_PRIVATE_FILE_MUST_STAY")
        producer.export.assert_not_called()

    def test_rejects_output_inside_original_or_repository(self):
        producer = synthetic_producer()
        nested = self.args("extract")
        nested.out = self.original / "bad.zip"
        with self.assertRaisesRegex(ValueError, "original installation"):
            P85["run_mk3"](nested, producer=producer)
        nested.out = ROOT / "game-output.zip"
        with self.assertRaisesRegex(ValueError, "SOURCE repository"):
            P85["run_mk3"](nested, producer=producer)
        producer.export.assert_not_called()

    def test_rejects_original_inside_git_source(self):
        inner = self.args("scan")
        inner.source = ROOT / "scripts"
        with self.assertRaisesRegex(ValueError, "commercial source"):
            P85["run_mk3"](inner, producer=synthetic_producer())

    def test_rejects_mk2_only_stage_switch_for_mk3(self):
        with self.assertRaisesRegex(ValueError, "MK2-only"):
            P85["run_mk3"](self.args("extract", stage="tomb"), producer=synthetic_producer())

    def test_real_reader_refuses_fake_game_directory(self):
        (self.original / "DATA.MK3").write_bytes(b"NOT_ORIGINAL_MK3")
        child = subprocess.run(BASE + ["scan", "--game", "mk3",
                                       "--source", str(self.original)],
                               capture_output=True, text=True)
        self.assertEqual(child.returncode, 2, child.stdout + child.stderr)
        self.assertIn("SHA256 identity mismatch", child.stderr)
        self.assertNotIn('"status": "PASS"', child.stdout)


if __name__ == "__main__":
    unittest.main(verbosity=2)
