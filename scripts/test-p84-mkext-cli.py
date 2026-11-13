#!/usr/bin/env python3
"""P84 CLI source-only synthetic and refusal controls. No game data."""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
import runpy
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import Mock

ROOT = Path(__file__).resolve().parents[1]
CLI = runpy.run_path(str(ROOT / "scripts" / "mkext.py"))
P82 = runpy.run_path(str(ROOT / "scripts" / "export-mk2-p82-native-stage-pack.py"))


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def source_backend():
    contents = {name: name.encode("ascii") for name in (
        "MK2.EXE", "TOMB.GRA", "PORTAL.GRA", "IMAGES.GRA")}
    return {
        "load_original_folder": Mock(return_value=(
            contents, {name: name.lower() for name in contents})),
        "digest": sha,
        "ORIGINAL_HASHES": {name: sha(data) for name, data in contents.items()},
        "STAGE_DATA": {"tomb": (896, 48, 16, 6), "portal": (896, 40, 13, 2)},
    }


def accepted_oracle(stages=("tomb", "portal"), pngs=115, sprites=29, setups=8):
    return {
        "pass": "P82_INDEPENDENT",
        "status": "PASS",
        "originalStages": list(stages),
        "sourcePngFilesIndependentPixelParity": pngs,
        "sourceNativeSprites": sprites,
        "sourceSetupLocalLayers": setups,
        "originalSourceIndexPositionsRechecked": 939425,
        "nativeCameraOrStageCompositeClaimed": False,
        "nativeAnimationOrParallaxTimingClaimed": False,
    }


def accepted_production(pngs=115, sprites=29, setups=8):
    return {
        "pass": "P82_EXPORT",
        "status": "PASS",
        "independentSourcePngFiles": pngs,
        "originalUncroppedSprites": sprites,
        "setupLocalLayers": setups,
    }


class P84CliSourceOnly(unittest.TestCase):
    def test_help_and_unsupported_game_are_explicit_and_do_not_read_files(self):
        base = [sys.executable, str(ROOT / "scripts" / "mkext.py")]
        help_result = subprocess.run(base + ["--help"], capture_output=True, text=True)
        self.assertEqual(help_result.returncode, 0, help_result.stderr)
        self.assertIn("scan", help_result.stdout)
        self.assertIn("extract", help_result.stdout)
        self.assertIn("verify", help_result.stdout)
        unsupported = subprocess.run(
            base + ["scan", "--game", "mk1", "--source", "nonexistent"],
            capture_output=True, text=True)
        self.assertNotEqual(unsupported.returncode, 0)
        self.assertIn("invalid choice", unsupported.stderr)

    def test_scan_reports_only_authenticated_p82_stage_capabilities(self):
        backend = source_backend()
        args = argparse.Namespace(action="scan", game="mk2", source=Path("private/MK2"))
        result = CLI["run_command"](args, producer=backend)
        self.assertEqual(result["pass"], "P84_CLI_SCAN")
        self.assertEqual(result["sourcePngFilesAvailableIfExported"], 115)
        self.assertEqual(result["stageSourceExportCoverage"]["tomb"]["originalFloorSourceDimensions"], [896, 48])
        self.assertEqual(result["stageSourceExportCoverage"]["portal"]["uncroppedSourceSpriteStreams"], 13)
        self.assertFalse(result["fullGameAssetCatalogScanned"])
        self.assertFalse(result["nativeSceneCompositionOrAnimationClaimed"])
        backend["load_original_folder"].assert_called_once_with(Path("private/MK2"))

    def test_scan_rejects_changed_original_fingerprint(self):
        backend = source_backend()
        backend["ORIGINAL_HASHES"]["IMAGES.GRA"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "fingerprints"):
            CLI["run_command"](argparse.Namespace(action="scan", game="mk2", source=Path("fixture")),
                               producer=backend)

    def test_real_backend_refuses_noncanonical_synthetic_directory(self):
        with tempfile.TemporaryDirectory(prefix="mkext-cli-synthetic-") as temp:
            folder = Path(temp)
            for name in P82["ORIGINAL_HASHES"]:
                (folder / name).write_bytes(b"FAKE_NOT_A_COMMERCIAL_GAME_FILE")
            run = subprocess.run([
                sys.executable, str(ROOT / "scripts" / "mkext.py"), "scan",
                "--game", "mk2", "--source", str(folder),
            ], capture_output=True, text=True)
            self.assertEqual(run.returncode, 2, run.stdout + run.stderr)
            self.assertIn("fingerprint mismatch", run.stderr)
            self.assertNotIn('"status": "PASS"', run.stdout)

    def test_extract_reuses_producer_then_independent_oracle(self):
        producer = source_backend()
        producer["build_original_pack"] = Mock(return_value=accepted_production())
        oracle = {"verify": Mock(return_value=accepted_oracle())}
        folder, archive = Path("private/mk2"), Path("private/validation/new.zip")
        result = CLI["run_command"](
            argparse.Namespace(action="extract", game="mk2", source=folder,
                               out=archive, stage="both"),
            producer=producer, verifier=oracle)
        producer["build_original_pack"].assert_called_once_with(
            folder, archive, ("tomb", "portal"))
        oracle["verify"].assert_called_once_with(folder, archive)
        self.assertEqual(result["pass"], "P84_CLI_EXTRACT")
        self.assertFalse(result["fullGameAssetCatalogClaimed"])
        self.assertFalse(result["browserRequired"])
        self.assertEqual(result["independentOriginalByteAndPngVerification"]["status"], "PASS")

    def test_single_stage_passthrough_does_not_invent_second_stage(self):
        producer = source_backend()
        producer["build_original_pack"] = Mock(return_value=accepted_production(68,16,6))
        oracle = {"verify": Mock(return_value=accepted_oracle(("tomb",),68,16,6))}
        result = CLI["run_command"](
            argparse.Namespace(action="extract", game="mk2", source=Path("source"),
                               out=Path("new.zip"), stage="tomb"),
            producer=producer, verifier=oracle)
        self.assertEqual(result["producer"]["independentSourcePngFiles"], 68)
        self.assertEqual(producer["build_original_pack"].call_args.args[2], ("tomb",))

    def test_extract_cannot_claim_pass_on_independent_mismatch(self):
        producer = source_backend()
        producer["build_original_pack"] = Mock(return_value=accepted_production())
        changed = accepted_oracle()
        changed["sourcePngFilesIndependentPixelParity"] = 114
        with self.assertRaisesRegex(ValueError, "acceptance failed"):
            CLI["run_command"](
                argparse.Namespace(action="extract", game="mk2", source=Path("source"),
                                   out=Path("new.zip"), stage="both"),
                producer=producer, verifier={"verify": Mock(return_value=changed)})

    def test_extract_cannot_claim_pass_when_producer_fails(self):
        producer = source_backend()
        producer["build_original_pack"] = Mock(side_effect=ValueError("will never overwrite an existing ZIP"))
        oracle = {"verify": Mock()}
        with self.assertRaisesRegex(ValueError, "never overwrite"):
            CLI["run_command"](
                argparse.Namespace(action="extract", game="mk2", source=Path("source"),
                                   out=Path("existing.zip"), stage="both"),
                producer=producer, verifier=oracle)
        oracle["verify"].assert_not_called()

    def test_verify_reports_only_independent_oracle(self):
        check = {"verify": Mock(return_value=accepted_oracle())}
        result = CLI["run_command"](
            argparse.Namespace(action="verify", game="mk2", source=Path("private/mk2"),
                               archive=Path("private/output.zip")),
            producer=source_backend(), verifier=check)
        self.assertEqual(result["pass"], "P84_CLI_VERIFY")
        self.assertFalse(result["browserRequired"])
        check["verify"].assert_called_once_with(Path("private/mk2"), Path("private/output.zip"))

    def test_verify_rejects_unqualified_native_scene_claims(self):
        check = accepted_oracle()
        check["nativeAnimationOrParallaxTimingClaimed"] = True
        with self.assertRaisesRegex(ValueError, "verification failed"):
            CLI["run_command"](
                argparse.Namespace(action="verify", game="mk2", source=Path("source"),
                                   archive=Path("archive.zip")),
                producer=source_backend(), verifier={"verify": lambda *_: check})


if __name__ == "__main__":
    unittest.main()
