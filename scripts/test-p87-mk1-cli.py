#!/usr/bin/env python3
"""P87 original-free MK1 headless P65 source package and refusal controls."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import runpy
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import Mock

ROOT = Path(__file__).resolve().parents[1]
P = runpy.run_path(str(ROOT / "scripts" / "mk1_p87_cli.py"))
BASE = [sys.executable, str(ROOT / "scripts" / "mkext.py")]
BYTES = b"P87 synthetic and absolutely NOT commercial indexed content"
P65 = dict(P["EXPECTED_P65"])


def accepted(action: str, source_bytes: bytes = BYTES) -> dict:
    result = {
        "pass": "P87_CLI_MK1_" + action.upper(),
        "status": "PASS", "game": "mk1",
        "sourceIdentity": "CANONICAL_P65_MK1_EXE",
        "originalMk1ExeSha256": P["CANONICAL_EXE"],
        "originalCatalogAssetsObserved": 2656,
        "originalAnitabTables": 8, "originalAnitabTableEntries": 739,
        "sourceExecutableStreamStarts": 514,
        "originalIndexedDescriptorRecords": 1102,
        "originalIndexedBinaryBytes": 27,
        "packageMembers": 4,
        "nativePaletteOrTimingClaimed": False,
        "nativeRuntimeTraversalVerified": False,
        "finalActorPlacementOrStageCompositeClaimed": False,
        "completeMk1CatalogExportClaimed": False,
        "previewPngsCreated": 0, "browserRequired": False,
    }
    if action != "scan":
        result.update({
            "sourcePackageByteIdentical": True,
            "recomputedPackageSha256": hashlib.sha256(source_bytes).hexdigest(),
            "independentOriginalP65Verifier": dict(P65),
        })
    return result


def command_result(data: dict, exit_status: int = 0) -> subprocess.CompletedProcess:
    return subprocess.CompletedProcess(
        args=["node", "no-original-data"],
        returncode=exit_status,
        stdout=json.dumps(data) if exit_status == 0 else "",
        stderr="synthetic original-P65 oracle refused" if exit_status else "",
    )


class P87OriginalFreeCLI(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="p87-cli-synthetic-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.original = self.root / "private-mk1"
        self.original.mkdir()
        self.output = self.root / "private-p65.zip"

    def args(self, action: str, **updates) -> argparse.Namespace:
        params = dict(game="mk1", action=action, source=self.original,
                      out=self.output, archive=self.output, stage="both")
        params.update(updates)
        return argparse.Namespace(**params)

    def test_supported_mk1_help_and_unknown_game_refused_before_io(self):
        result = subprocess.run(BASE + ["scan", "--help"],
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("mk1", result.stdout)
        unknown = subprocess.run(BASE + [
            "scan", "--game", "mk4", "--source", "nonexistent"],
            capture_output=True, text=True)
        self.assertNotEqual(unknown.returncode, 0)
        self.assertIn("invalid choice", unknown.stderr)

    def test_scan_reports_only_indexed_source_not_native_animation(self):
        runner = Mock(return_value=command_result(accepted("scan")))
        data = P["run_mk1"](self.args("scan"), runner=runner)
        self.assertEqual(data["pass"], "P87_CLI_MK1_SCAN")
        self.assertEqual(data["sourceExecutableStreamStarts"], 514)
        self.assertEqual(data["originalIndexedDescriptorRecords"], 1102)
        self.assertFalse(data["nativePaletteOrTimingClaimed"])
        self.assertEqual(data["previewPngsCreated"], 0)
        call = runner.call_args.args[0]
        self.assertEqual(call[2], "scan")
        self.assertEqual(call[3], str(self.original.resolve()))
        self.assertEqual(len(call), 4)
        self.assertFalse(self.output.exists())

    def test_extract_requires_original_p65_oracle_and_zip_byte_parity(self):
        data = accepted("extract")
        data["privateArchive"] = str(self.output.resolve())
        def runner(*_args, **_kwargs):
            self.output.write_bytes(BYTES)
            return command_result(data)
        result = P["run_mk1"](self.args("extract"), runner=runner)
        self.assertTrue(result["sourcePackageByteIdentical"])
        self.assertEqual(result["independentOriginalP65Verifier"]["verifiedAnitabCells"], 739)

    def test_verify_recomputes_exact_private_source_archive(self):
        self.output.write_bytes(BYTES)
        data = accepted("verify")
        data["privateArchive"] = str(self.output.resolve())
        checked = P["run_mk1"](
            self.args("verify"), runner=Mock(return_value=command_result(data)))
        self.assertEqual(checked["pass"], "P87_CLI_MK1_VERIFY")
        self.output.write_bytes(BYTES + b"changed")
        with self.assertRaisesRegex(ValueError, "ZIP differs"):
            P["run_mk1"](
                self.args("verify"), runner=Mock(return_value=command_result(data)))

    def test_rejects_counterfeit_census_native_claims_or_oracle(self):
        invalid = [
            ("originalCatalogAssetsObserved", 2655),
            ("sourceExecutableStreamStarts", 513),
            ("originalIndexedDescriptorRecords", 1101),
            ("packageMembers", 5),
            ("nativePaletteOrTimingClaimed", True),
            ("nativeRuntimeTraversalVerified", True),
            ("finalActorPlacementOrStageCompositeClaimed", True),
            ("completeMk1CatalogExportClaimed", True),
            ("browserRequired", True),
        ]
        for key, wrong in invalid:
            with self.subTest(key=key):
                bad = accepted("scan")
                bad[key] = wrong
                with self.assertRaisesRegex(ValueError, "mismatch"):
                    P["run_mk1"](self.args("scan"), runner=Mock(
                        return_value=command_result(bad)))
        self.output.write_bytes(BYTES)
        for key, wrong in (
            ("originalExecutableOpcodesAndPointersMatched", False),
            ("originalO60IndexedBytesByteIdentical", False),
            ("verifiedAnitabCells", 738),
            ("noOriginalPaletteOrTimingAssigned", False),
        ):
            with self.subTest(oracleField=key):
                bad = accepted("verify")
                bad["privateArchive"] = str(self.output.resolve())
                bad["independentOriginalP65Verifier"][key] = wrong
                with self.assertRaisesRegex(ValueError, "independent MK1 original P65 oracle"):
                    P["run_mk1"](self.args("verify"), runner=Mock(
                        return_value=command_result(bad)))

    def test_refuses_existing_output_and_original_installation_output(self):
        self.output.write_bytes(BYTES)
        runner = Mock()
        with self.assertRaisesRegex(ValueError, "overwrite"):
            P["run_mk1"](self.args("extract"), runner=runner)
        with self.assertRaisesRegex(ValueError, "outside Git and original input"):
            P["run_mk1"](self.args("extract",
                             out=self.original / "source-indexed.zip"), runner=runner)
        with self.assertRaisesRegex(ValueError, "Tomb/Portal selections only"):
            P["run_mk1"](self.args("extract", stage="tomb"), runner=runner)
        with self.assertRaisesRegex(ValueError, "outside Git and original input"):
            P["run_mk1"](self.args("verify",
                             archive=ROOT / "not-real-source.zip"), runner=runner)
        self.assertEqual(runner.call_count, 0)

    def test_refuses_missing_original_source_before_bridge(self):
        runner = Mock()
        with self.assertRaises(FileNotFoundError):
            P["run_mk1"](self.args("scan", source=self.root / "missing"),
                          runner=runner)
        self.assertEqual(runner.call_count, 0)

    def test_bridge_nonzero_and_contaminated_stdout_not_a_pass(self):
        with self.assertRaisesRegex(ValueError, "original MK1 bridge failed"):
            P["run_mk1"](self.args("scan"), runner=Mock(
                return_value=command_result({}, 2)))
        with self.assertRaisesRegex(ValueError, "did not produce JSON"):
            P["run_mk1"](self.args("scan"), runner=Mock(
                return_value=subprocess.CompletedProcess([], 0, "debug log\n{}", "")))

    def test_actual_node_bridge_rejects_noncanonical_exe_without_export(self):
        self.original.joinpath("MK1.EXE").write_bytes(b"fake non-original MK1 EXE")
        child = subprocess.run(["node", "scripts/mk1_p87_source_bridge.cjs",
                                "extract", str(self.original), str(self.output)],
                               cwd=ROOT, capture_output=True, text=True,
                               timeout=120)
        self.assertNotEqual(child.returncode, 0)
        self.assertIn("fingerprint mismatch", child.stderr)
        self.assertFalse(self.output.exists())

    def test_actual_node_bridge_rejects_source_checkout_as_commercial_root(self):
        child = subprocess.run(["node", "scripts/mk1_p87_source_bridge.cjs",
                                "scan", str(ROOT)],
                               cwd=ROOT, capture_output=True, text=True,
                               timeout=120)
        self.assertNotEqual(child.returncode, 0)
        self.assertIn("commercial original folder cannot be in Git", child.stderr)


if __name__ == "__main__":
    unittest.main(verbosity=2)
