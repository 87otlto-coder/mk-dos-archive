#!/usr/bin/env python3
"""P86 Windows original MK1/MK2/MK3 + real-Chrome + headless CLI consolidation.

Read-only commercial sources; all generated ZIPs, PNGs, logs and reports remain
under a NEW F:\Dev\MKEXT\FIXTURES\VALIDATION directory. Git receives NONE.
This calls established original P81/P83/P84/P85 verification, not new decoders.
No final palette, actor, camera, stage-composition or frame-timing claim.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import runpy
import subprocess
import sys
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PRIVATE_VALIDATION = Path(r"F:\Dev\MKEXT\FIXTURES\VALIDATION")
P66 = runpy.run_path(str(ROOT / "scripts" / "verify-p66-checkpoint.py"))
STEPS = (
    "p81_original_three_game_and_chrome",
    "p84_original_mk2_cli_source",
    "p83_original_mk2_real_chrome",
    "p85_original_mk3_cli_source",
)


def require(condition: object, message: str) -> None:
    if not condition:
        raise ValueError("P86: " + message)


def exact(report: Any, expected: dict, label: str) -> None:
    require(isinstance(report, dict), label + " must be an object")
    for key, value in expected.items():
        require(key in report and type(report[key]) is type(value) and
                report[key] == value, label + ": " + key + " mismatch")


def read_json_output(raw: bytes, label: str) -> dict:
    try:
        data = json.loads(raw.decode("utf-8"))
    except (UnicodeError, json.JSONDecodeError) as error:
        raise ValueError("P86: non-JSON output for " + label) from error
    require(isinstance(data, dict), label + " JSON object required")
    return data


def check_p81(data: dict, expected_commit: str, expected_tree: str) -> None:
    exact(data, {
        "pass": "P81", "status": "PASS",
        "sourceCommit": expected_commit, "sourceTree": expected_tree,
        "requiredGroupsPassed": 9, "inheritedP76OriginalGroups": 6,
        "inheritedP71OriginalGroups": 10,
        "originalThreeGameBaseline": 17211,
        "originalMk3AssetCounts": [9186, 9205, 9402, 9619],
        "additionalIndexedImageRepresentations": 217,
        "additionalOriginalRawStoredRecords": 216,
        "optInThreeGameAssetRepresentations": 17644,
        "originalDosAndRealChromeP76P78P80Verified": True,
        "originalP77P79SourceVerifiedViaIndependentOracles": True,
        "sourceAuditUnchanged": True,
        "nativePaletteOpacityStageOrAnimationOwnershipClaimed": False,
        "mainOrDevelopPromoted": False,
    }, "inherited original three-game P81")


def check_p84_scan(data: dict) -> None:
    exact(data, {
        "pass": "P84_CLI_SCAN", "status": "PASS", "game": "mk2",
        "sourceIdentity": "CANONICAL_P82_FOUR_ORIGINAL_FILES",
        "sourcePngFilesAvailableIfExported": 115,
        "fullGameAssetCatalogScanned": False,
        "nativeSceneCompositionOrAnimationClaimed": False,
    }, "MK2 CLI scan")
    sha = data.get("originalFileSha256")
    require(isinstance(sha, dict) and
            set(sha) == {"MK2.EXE", "IMAGES.GRA", "PORTAL.GRA", "TOMB.GRA"} and
            all(isinstance(v, str) and len(v) == 64 for v in sha.values()),
            "MK2 scan must preserve four original source hashes")
    for stage, dims, sprites, setups, pngs in (
        ("tomb", [896, 48], 16, 6, 68),
        ("portal", [896, 40], 13, 2, 47),
    ):
        require(stage in data.get("stageSourceExportCoverage", {}),
                "MK2 scan missing source group " + stage)
        exact(data["stageSourceExportCoverage"][stage], {
            "originalFloorSourceDimensions": dims,
            "uncroppedSourceSpriteStreams": sprites,
            "setupLocalLayerGroups": setups,
            "exportedSourcePngFiles": pngs,
        }, "MK2 original stage " + stage)


def check_p84_result(data: dict, action: str) -> None:
    exact(data, {
        "pass": "P84_CLI_EXTRACT" if action == "extract" else "P84_CLI_VERIFY",
        "status": "PASS", "game": "mk2", "browserRequired": False,
    } if action == "verify" else {
        "pass": "P84_CLI_EXTRACT", "status": "PASS",
        "game": "mk2", "fullGameAssetCatalogClaimed": False,
    }, "MK2 CLI " + action)
    oracle = data.get("independentOriginalByteAndPngVerification")
    exact(oracle, {
        "pass": "P82_INDEPENDENT", "status": "PASS",
        "originalGame": "mk2", "originalFileSourceFingerprintsVerified": 4,
        "originalSourceIndexPositionsRechecked": 939425,
        "originalSourcesIncludedInZip": False,
        "originalStages": ["tomb", "portal"],
        "sourceNativeFloors": 2, "sourceNativeSprites": 29,
        "sourcePngFilesIndependentPixelParity": 115,
        "sourceSetupLocalLayers": 8,
        "nativeCameraOrStageCompositeClaimed": False,
        "nativeAnimationOrParallaxTimingClaimed": False,
    }, "MK2 independent source oracle")
    if action == "extract":
        exact(data.get("producer"), {
            "pass": "P82_EXPORT", "status": "PASS", "originalGame": "mk2",
            "originalSourceFilesCopiedIntoZip": 0,
            "independentSourcePngFiles": 115,
            "originalUncroppedSprites": 29,
            "setupLocalLayers": 8, "zipMembers": 117,
            "finalNativeStageAssemblyClaimed": False,
            "nativeAnimationOrParallaxTimingClaimed": False,
        }, "MK2 original source pack producer")


def check_p83(data: dict) -> None:
    exact(data, {
        "pass": "P83_BROWSER", "status": "PASS", "originalGame": "mk2",
        "acceptedDefaultMk2Assets": 5369,
        "explicitAdditionalStageSourcePngs": 115,
        "visibleAfterExplicitImport": 5484,
        "originalNativeFloorColumns": 896,
        "originalStagesVerified": ["tomb", "portal"],
        "originalNativeSpritesRepresented": 29,
        "setupLocalSourceLayersRepresented": 8,
        "originalP82SourcePngsIndependentlyRechecked": 115,
        "sourceIndexedPositionsIndependent": 939425,
        "originalChromePngDownloadsByteExact": 3,
        "sourceStageImageFilesRemainByteExact": True,
        "originalNativePaletteCameraStageCompositionOrAnimationClaimed": False,
        "originalCommercialGameSourcesIncludedInExport": False,
    }, "original MK2 P83 Chrome")


def check_p85_scan(data: dict) -> None:
    exact(data, {
        "pass": "P85_CLI_MK3_SCAN", "status": "PASS", "game": "mk3",
        "sourceIdentity": "CANONICAL_P79_DATA_MK3",
        "originalDataMk3Sha256":
            "72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517",
        "sourceIndexedBaseDimensions": [320, 200],
        "sourceBaseIndexedPositions": 64000,
        "sourceRawContinuationRecords": 216,
        "sourcePartsIfExtracted": 220,
        "sourcePreviewPngsIfExtracted": 2,
        "privateZipMembersIfExtracted": 223,
        "fullGameAssetCatalogScanned": False,
        "nativePaletteOrOpacityVerified": False,
        "continuationFramesDecoded": 0,
        "nativeStageMembershipOrAnimationTimingClaimed": False,
    }, "original MK3 leading-index CLI scan")


def check_p85_result(data: dict, action: str) -> None:
    exact(data, {
        "pass": "P85_CLI_MK3_EXTRACT" if action == "extract" else "P85_CLI_MK3_VERIFY",
        "status": "PASS", "game": "mk3", "browserRequired": False,
        "sourceRawContinuationRecords": 216,
        "sourcePreviewPngsVerified": 2,
        "nativePaletteOrOpacityVerified": False,
        "continuationFramesDecoded": 0,
        "nativeStageMembershipOrAnimationTimingClaimed": False,
        "fullGameAssetCatalogClaimed": False,
    }, "original MK3 CLI " + action)
    exact(data.get("independentOriginalSourceAndPngVerification"), {
        "passName": "P79_ORIGINAL", "status": "PASS",
        "sourceParts": 220, "records": 216,
        "baseIndexedPositions": 64000,
        "pngPixelsCompared": 128000, "intervalBytes": 1840634,
        "storedPayloadBytes": 1772828, "zipMembers": 223,
    }, "MK3 P79 independent original-byte/PNG oracle")


def checkpoint(args: argparse.Namespace) -> dict:
    require(sys.platform == "win32", "original checkpoint must run on Windows")
    require(__debug__ and not os.environ.get("PYTHONOPTIMIZE"),
            "optimized Python cannot run an original checkpoint")
    work = Path(args.work).resolve()
    private = PRIVATE_VALIDATION.resolve(strict=True)
    require(work.is_relative_to(private) and work != private,
            "all original-derived output must remain under FIXTURES/VALIDATION")
    require(not work.exists(), "work path already exists; preserve previous evidence")
    games = {name: Path(getattr(args, name)).resolve(strict=True)
             for name in ("mk1", "mk2", "mk3")}
    for name, folder in games.items():
        require(folder.is_dir(), name + " original source must be a directory")
    P66["separate"]([ROOT.resolve(), work, *games.values()])
    opening = P66["audit_source"]()
    require(opening.get("status") == "PASS", "source audit must pass")
    require(opening.get("commit") and opening.get("treeSha"),
            "source commit/tree identity absent")
    work.mkdir(parents=False, exist_ok=False)
    private_temp = work / "temp"
    private_temp.mkdir()
    report = {
        "pass": "P86", "status": "RUNNING",
        "startedUtc": datetime.now(timezone.utc).isoformat(),
        "originalSourceAuditAtStart": opening,
        "sourceBranch": "interim/p86-consolidation",
        "originalGameExecutablesUploaded": False,
        "privateSourceExportsUploaded": False,
        "nativePaletteCameraStageOrAnimationOwnershipClaimed": False,
        "steps": {},
    }
    environment = {
        **os.environ, "PYTHON": sys.executable,
        "PYTHONDONTWRITEBYTECODE": "1",
        "TEMP": str(private_temp), "TMP": str(private_temp),
        "TMPDIR": str(private_temp),
    }

    def save() -> None:
        tmp = work / "report.tmp"
        tmp.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        tmp.replace(work / "report.json")

    def command(label: str, arguments: list, timeout: int = 10800) -> bytes:
        require(not (work / (label + ".stdout.txt")).exists(),
                "P86 duplicate evidence command " + label)
        print("P86: " + label, flush=True)
        run = subprocess.run(
            [str(x) for x in arguments], cwd=ROOT, env=environment,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            timeout=timeout, check=False,
        )
        (work / (label + ".stdout.txt")).write_bytes(run.stdout)
        (work / (label + ".stderr.txt")).write_bytes(run.stderr)
        require(run.returncode == 0,
                label + " failed; inspect private stdout/stderr files")
        return run.stdout

    def verified(label: str, evidence: dict) -> None:
        require(label in STEPS and label not in report["steps"],
                "unknown/repeated P86 original acceptance group")
        report["steps"][label] = {"status": "PASS", **evidence}
        save()

    save()
    try:
        # Historical accepted 9-group three-game/Chrome source checkpoint,
        # now running against the exact current P86 source commit/tree.
        p81_dir = work / "p81"
        command("P81_full_three_game_original", [
            sys.executable, "scripts/verify-p81-checkpoint.py",
            "--mk1", games["mk1"], "--mk2", games["mk2"],
            "--mk3", games["mk3"], "--work", p81_dir,
        ], timeout=18000)
        p81 = json.loads((p81_dir / "summary.json").read_text(encoding="utf-8"))
        check_p81(p81, opening["commit"], opening["treeSha"])
        verified(STEPS[0], {"sourceThreeGameOriginalAndChrome": True,
                            "inheritedOriginalAcceptanceGroups": 9})

        # Original MK2 CLI: scan, produce new private ZIP, and reverify source
        # indices/opacity/PNGs independently before real Chrome import.
        cli = [sys.executable, "scripts/mkext.py"]
        mk2 = games["mk2"]
        check_p84_scan(read_json_output(command("P84_MK2_SCAN", [
            *cli, "scan", "--game", "mk2", "--source", mk2,
        ]), "P84 MK2 scan"))
        mk2_archive = work / "mk2-native-stage-source.zip"
        check_p84_result(read_json_output(command("P84_MK2_EXTRACT", [
            *cli, "extract", "--game", "mk2", "--source", mk2,
            "--stage", "both", "--out", mk2_archive,
        ]), "P84 MK2 extract"), "extract")
        check_p84_result(read_json_output(command("P84_MK2_VERIFY", [
            *cli, "verify", "--game", "mk2", "--source", mk2,
            "--archive", mk2_archive,
        ]), "P84 MK2 verify"), "verify")
        verified(STEPS[1], {"originalMk2Stages": ["tomb", "portal"],
                            "independentlyVerifiedSourcePngs": 115,
                            "originalIndexedPositions": 939425})

        # P83 Chrome validation includes full original ZIP oracle and three
        # byte-identical actual browser downloads. Fresh work under private.
        command("P83_VITE_PRODUCTION_BUILD", ["npm.cmd", "run", "build"], timeout=1800)
        p83 = read_json_output(command("P83_CHROME_ORIGINAL", [
            "node", "scripts/verify-p83-browser-stage-layers.cjs",
            mk2, mk2_archive, work / "p83-chrome",
        ], timeout=3600), "P83 real Chrome")
        check_p83(p83)
        verified(STEPS[2], {"originalMk2LibraryAssetsWithOptionalSources": 5484,
                            "realChromePngDownloadsByteExact": 3})

        # Original MK3: leading indexed base and RAW stored continuations.
        mk3 = games["mk3"]
        check_p85_scan(read_json_output(command("P85_MK3_SCAN", [
            *cli, "scan", "--game", "mk3", "--source", mk3,
        ]), "P85 MK3 scan"))
        mk3_archive = work / "mk3-leading-original-source.zip"
        check_p85_result(read_json_output(command("P85_MK3_EXTRACT", [
            *cli, "extract", "--game", "mk3", "--source", mk3,
            "--out", mk3_archive,
        ]), "P85 MK3 extract"), "extract")
        check_p85_result(read_json_output(command("P85_MK3_VERIFY", [
            *cli, "verify", "--game", "mk3", "--source", mk3,
            "--archive", mk3_archive,
        ]), "P85 MK3 verify"), "verify")
        verified(STEPS[3], {"originalMk3IndexPositions": 64000,
                            "rawStoredContinuationRecordsNotFrames": 216,
                            "independentlyVerifiedPngPixels": 128000})

        closing = P66["audit_source"]()
        require(closing == opening, "checkout/commit/tree changed during P86")
        require(tuple(report["steps"]) == STEPS,
                "missing/reordered original P86 consolidation groups")
        report["originalSourceAuditAtEnd"] = closing
        report["status"] = "PASS"
    except BaseException as error:
        report["status"] = "FAIL"
        report["failure"] = {
            "type": type(error).__name__, "message": str(error),
            "lastCompletedGroup": next(reversed(report["steps"]), None),
        }
        raise
    finally:
        report["finishedUtc"] = datetime.now(timezone.utc).isoformat()
        save()

    summary = {
        "pass": "P86", "status": "PASS",
        "sourceBranch": report["sourceBranch"],
        "sourceCommit": opening["commit"],
        "sourceTree": opening["treeSha"],
        "requiredGroupsPassed": len(STEPS),
        "inheritedP81OriginalGroupsPassed": 9,
        "inheritedOriginalThreeGameBaseline": 17211,
        "originalMk2NativeStageSourcePngsIndependentlyChecked": 115,
        "originalMk2ChromePngDownloadsByteExact": 3,
        "originalMk3LeadingRawRecordsNotAnimationFrames": 216,
        "originalMk3LeadingSourceIndexedPositions": 64000,
        "originalSourceAuditUnchanged": True,
        "nativePaletteCameraStageOrAnimationOwnershipClaimed": False,
        "commercialFilesOrPrivateExportsUploaded": False,
        "privateReport": str(work / "report.json"),
    }
    (work / "summary.json").write_text(
        json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return summary


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    for name in ("mk1", "mk2", "mk3", "work"):
        ap.add_argument("--" + name, type=Path, required=True)
    checkpoint(ap.parse_args())


if __name__ == "__main__":
    main()
