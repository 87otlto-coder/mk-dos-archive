#!/usr/bin/env python3
"""P81 fifth-pass, fail-closed original MK1/MK2/MK3 + real Chrome checkpoint.

Run from a clean source checkout with the verified original DOS installations:
  python scripts/verify-p81-checkpoint.py --mk1 ORIGINAL_MK1_DIR \
    --mk2 ORIGINAL_MK2_DIR --mk3 ORIGINAL_MK3_DIR \
    --work NEW_PRIVATE_OUTPUT_DIRECTORY

Consolidates inherited P76/P71 3-game/Chrome gates, P77/P79 source
refusal tests, P78 complete original + Chrome ZIP, and P80 complete
original indexed/raw + Chrome download. Never writes commercial data to Git.
A source-only CI PASS is NOT equivalent to this original/browser checkpoint.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import runpy
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
P71 = runpy.run_path(str(ROOT / "scripts/verify-p71-checkpoint.py"))
P76 = runpy.run_path(str(ROOT / "scripts/verify-p76-checkpoint.py"))
STEPS = (
    "p76_inherited_three_game_original_and_chrome",
    "p77_chained_original_source_refusals",
    "p79_leading_original_source_refusals",
    "p78_additional_images_source_refusals",
    "p80_leading_index_and_raw_source_refusals",
    "p78_complete_original_index_and_zip",
    "p78_real_chrome_index_and_zip",
    "p80_complete_original_index_and_raw",
    "p80_real_chrome_index_and_raw",
)
CENSUS = {"mk1": 2656, "mk2": 5369, "mk3": 9186}


def require(ok: object, why: str) -> None:
    if not ok:
        raise ValueError("P81: " + why)


def exact(item: object, expected: dict, label: str) -> None:
    """Typed equality: False must not satisfy 0, and True must not satisfy 1."""
    require(isinstance(item, dict), label + " must be a JSON object")
    for key, val in expected.items():
        require(key in item and type(item[key]) is type(val) and item[key] == val,
                label + " " + key + " mismatch " + repr(item.get(key)))


def json_stdout(out: bytes, label: str) -> dict:
    try:
        obj = json.loads(out.decode("utf-8"))
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise ValueError("P81: " + label + " invalid or contaminated JSON stdout") from exc
    require(isinstance(obj, dict), label + " result must be an object")
    return obj


def p76_progress_summary(stdout: bytes, nested_summary: dict, label: str) -> dict:
    """Read only the canonical six P76 progress lines plus final JSON.

    P76 emits a human-readable progress line before each original/browser
    group. Earlier P81 incorrectly passed the whole output to json.loads.
    Accept no extra lines, missing/reordered progress, duplicate trailing
    JSON, or disagreement with the independently saved private summary.
    """
    require(isinstance(nested_summary, dict),
            "inherited P76 saved summary must be a JSON object")
    try:
        text = stdout.decode("utf-8")
    except UnicodeError as exc:
        raise ValueError("P81: " + label + " invalid UTF-8 stdout") from exc
    normalized = text.replace("\r\n", "\n")
    progress = "".join("P76: " + step + "\n" for step in P76["STEPS"])
    require(normalized.startswith(progress),
            "inherited P76 missing, altered or reordered progress markers")
    result = json_stdout(normalized[len(progress):].encode("utf-8"), label)
    require(result == nested_summary,
            "inherited P76 final JSON does not match saved private summary")
    return result


def original_compatibility(p76: dict, commit: str, tree: str) -> dict:
    exact(p76, {
        "pass": "P76", "status": "PASS",
        "sourceCommit": commit, "sourceTree": tree,
        "requiredGroupsPassed": 6,
        "originalThreeGameBaseline": 17211,
        "newOptInSourceRowImages": 19,
        "optInThreeGameRepresentations": 17230,
        "originalDosFixtureAndChromeP72P76Verified": True,
        "sourceAuditUnchanged": True,
        "nativePaletteOrRendererPlacementAsserted": False,
        "mainPromoted": False,
    }, "inherited P76 original three-game and Chrome")
    return {"inheritedP71OriginalGroups": 10, "inheritedP76OriginalGroups": 6,
            "originalBaseline": 17211, "sourceAndTreeMatched": True}


def original_p78(data: dict) -> dict:
    exact(data, {
        "pass": "P78_ORIGINAL", "status": "PASS", "game": "mk3",
        "originalSourceSha256":
            "72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517",
        "originalGameFilesLoaded": 66,
        "baselineAssets": 9186, "acceptedP76FirstImages": 19,
        "additionalSourceIndexedImages": 197,
        "visibleAfterExplicitOptIn": 9402,
        "additionalIndexedPositionsPerPlane": 6616595,
        "additionalPaintedOriginalPixels": 1167687,
        "additionalSourceAbsentRows": 8475,
        "exactOriginalSidecarHashesAndZIPsChecked": 1182,
        "independentOriginalSourceAnd432PngOraclePass": True,
        "p76OriginalAssetIDsUnchanged": True,
        "nativePaletteOrAnimationOrStageMembershipClaimed": False,
        "originalChromeBrowserVerified": False,
    }, "P78 complete original MK3")
    return {"originalIndexedImagesAdded": 197,
            "originalSourceIndexPositions": 6616595,
            "originalVerifiedSidecars": 1182,
            "p77Independent432SourcePngOracle": True}


def chrome_p78(data: dict) -> dict:
    exact(data, {
        "pass": "P78_BROWSER", "status": "PASS", "originalGame": "mk3",
        "defaultOriginalAssets": 9186,
        "preservedP76FirstIndexedImages": 19,
        "additionalOriginalSourceIndexedImages": 197,
        "explicitlyVisibleAssets": 9402,
        "sourceIndexedPixelsOfFirstNewRecordVerified": 7950,
        "originalSourceStreamRowTablesAndPngPixelParity": True,
        "sourceRecordOrderNotClaimedAsNativeAnimation": True,
        "nativePaletteOrStageMembershipClaimed": False,
    }, "P78 original Chrome ZIP")
    return {"mk3OptInAfterP78": 9402, "originalChrome": True}


def original_p80(data: dict) -> dict:
    exact(data, {
        "pass": "P80_ORIGINAL", "status": "PASS", "originalGame": "mk3",
        "originalDataSha256":
            "72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517",
        "genuineOriginalGameFilesLoaded": 66,
        "acceptedOriginalMk3Baseline": 9186,
        "acceptedP76FirstImages": 19,
        "acceptedP78AdditionalIndexed": 197,
        "previousOptInTotal": 9402,
        "newVisibleAfterExplicitOptIn": 9619,
        "sourceBaseIndexedPositionsVerified": 64000,
        "originalSourceBaseIndexSha256":
            "3553eead898a40d15788ef8072634cef04b2047cf7d4055682e7129aa6e7dd2e",
        "originalRawContinuationRecordsIndividuallyByteVerified": 216,
        "preservedEmptyRawRecords": 6,
        "exactOriginalContinuationBytesVerified": 1775852,
        "independentlyVerifiedP79SourceParts": 220,
        "independentlyVerifiedP79PngPixels": 128000,
        "acceptedP76P78SourceIdsUnchanged": True,
        "originalNativeOpacityOrPaletteAssigned": False,
        "originalContinuationFramesDecoded": 0,
        "realChromeBrowserVerified": False,
    }, "P80 full original indexed base and raw source")
    return {"originalBaseIndexPositions": 64000,
            "originalStoredRawRecords": 216,
            "originalHeaderPlusPayloadBytes": 1775852,
            "independentP79OriginalSourceParts": 220,
            "originalContinuationFramesDecoded": 0}


def chrome_p80(data: dict) -> dict:
    exact(data, {
        "pass": "P80_BROWSER", "status": "PASS", "game": "mk3",
        "acceptedOriginalBaseline": 9186,
        "p76ImageOptIn": 19, "p78ImageOptIn": 197,
        "newP80BaseImages": 1,
        "newOriginalRawContinuationRecords": 216,
        "visibleAfterExplicitOptIn": 9619,
        "originalBaseIndexedPngPixelsVerified": 64000,
        "originalDownloadedRawRecordBytesVerified": 2,
        "emptyOriginalRecordDownloadVerified": True,
        "acceptedP76AndP78GroupsPreserved": True,
        "nativePaletteOrOpacityVerified": False,
        "nativeAnimationFramesFromContinuationsDecoded": 0,
        "independentOriginalIndexedZipAndRawRecordParity": True,
    }, "P80 real original Chrome indexed image and two raw exports")
    return {"mk3OptInAfterP80": 9619,
            "originalChromeIndexedPngPixels": 64000,
            "rawOriginalDownloadsVerified": 2,
            "originalEmptyRecordDownloadVerified": True}


def source_p78(data: dict) -> dict:
    exact(data, {
        "pass": "P78_SOURCE", "status": "PASS",
        "newOriginalChainedSourceRecords": 197,
        "nativePaletteOrRuntimeTimingClaimed": False,
        "originalCommercialGameDataUsed": False,
    }, "P78 source refusal controls")
    require(data.get("malformedChainedSourceAndFalseEvidenceRejected", 0) >= 11,
            "P78 malformed/false-source refusal coverage incomplete")
    return {"sourceOriginalDataUsed": False, "malformedCasesRefused": True}


def source_p80(data: dict) -> dict:
    exact(data, {
        "pass": "P80_SOURCE", "status": "PASS",
        "userOptInRequired": True,
        "originalSourceGameDataUsed": False,
        "originalOpaqueAlphaProven": False,
        "nativePaletteVerified": False,
        "actualContinuationFramesDecoded": 0,
        "existingP78AssetsReplaced": False,
    }, "P80 source refusal controls")
    require(data.get("malformedOrFalseEvidenceRejected", 0) >= 12,
            "P80 malformed/false-source refusal coverage incomplete")
    return {"sourceOriginalDataUsed": False, "malformedCasesRefused": True}


def check_unittest(out: bytes, err: bytes, n: int, label: str) -> dict:
    # Both P77/P79 scripts use unittest.main(): success must include the
    # expected number of tests and an OK footer; a zero exit code alone is not enough.
    combined = (out + b"\n" + err).decode("utf-8", "replace")
    require(re.search(r"\bRan\s+" + str(n) + r"\s+tests?\b", combined),
            label + " expected source test census missing")
    require(re.search(r"(?m)^OK\s*$", combined),
            label + " unittest OK not present")
    require("FAILED" not in combined and "ERROR:" not in combined,
            label + " unittest failure marker present")
    return {"sourceTests": n, "syntheticOnly": True}


def checkpoint(args: argparse.Namespace) -> dict:
    require(__debug__ and not os.environ.get("PYTHONOPTIMIZE"),
            "Python assertions may not be disabled")
    games, work, identities, opening = P71["preflight"](
        {g: getattr(args, g) for g in CENSUS}, args.work)
    require(opening["status"] == "PASS",
            "full original three-game source audit must pass")
    # The approved interim branch is explicitly audited by P61/P66 as well.
    result = subprocess.run(["git", "branch", "--show-current"], cwd=ROOT,
                            capture_output=True, text=True, check=True)
    branch = result.stdout.strip()
    require(branch in P71["P66"]["APPROVED_CHECKPOINT_BRANCHES"],
            "source checkout must be audited develop, historical P81 or approved P86 interim")
    require("sourceTree" not in opening, "unexpected source audit schema")
    work.mkdir(parents=True, exist_ok=False)
    # Keep all temporary original-derived source, PNG/ZIP and browser downloads
    # inside the private fixture workspace rather than the OS default temp.
    private_temp = work / "private-temporary"
    private_temp.mkdir()
    started = datetime.now(timezone.utc).isoformat()
    report = {
        "pass": "P81", "status": "RUNNING", "startedUtc": started,
        "sourceBranch": branch, "sourceAuditAtStart": opening,
        "originalExecutableSha256": identities,
        "privateTemporaryDirectory": str(private_temp),
        "originalThreeGameExpectedBaseline": CENSUS,
        "expectedOriginalMk3OptIn": [9186, 9205, 9402, 9619],
        "commercialGameFilesCommitted": False,
        "nativePaletteOrOpacityOrStageOrAnimationProven": False,
        "mainOrDevelopPromoted": False,
        "steps": {},
    }

    def save():
        temp = work / "report.tmp"
        temp.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        temp.replace(work / "report.json")

    def execute(label: str, argv: list, timeout: int = 5400) -> tuple[bytes, bytes]:
        require(label in STEPS and label not in report["steps"],
                "unknown or repeated P81 group " + label)
        print("P81: " + label, flush=True)
        run = subprocess.run([str(x) for x in argv], cwd=ROOT,
                             capture_output=True, timeout=timeout, check=False,
                             env={**os.environ, "PYTHON": sys.executable,
                                  "PYTHONDONTWRITEBYTECODE": "1",
                                  "TEMP": str(private_temp),
                                  "TMP": str(private_temp),
                                  "TMPDIR": str(private_temp)})
        (work / (label + ".stdout.txt")).write_bytes(run.stdout)
        (work / (label + ".stderr.txt")).write_bytes(run.stderr)
        require(run.returncode == 0,
                label + " failed; see private stdout/stderr")
        return run.stdout, run.stderr

    def record(label: str, output: bytes, stderr: bytes, checked: dict):
        require(label in STEPS and label not in report["steps"],
                "unexpected or duplicate P81 check record")
        report["steps"][label] = {
            "status": "PASS", "verified": checked,
            "stdoutSha256": hashlib.sha256(output).hexdigest(),
            "stderrSha256": hashlib.sha256(stderr).hexdigest(),
        }
        save()

    save()
    try:
        mk1, mk2, mk3 = (games[g] for g in CENSUS)
        p76_dir = work / "p76-original-three-game"
        label = STEPS[0]
        out, err = execute(label, [
            sys.executable, "scripts/verify-p76-checkpoint.py",
            "--mk1", mk1, "--mk2", mk2, "--mk3", mk3,
            "--work", p76_dir], timeout=10800)
        nested = json.loads((p76_dir / "summary.json").read_text(encoding="utf-8"))
        p76 = p76_progress_summary(out, nested, label)
        checked = original_compatibility(
            p76, opening["commit"], opening["treeSha"])
        nested_report = json.loads((p76_dir / "report.json").read_text(encoding="utf-8"))
        require(nested_report.get("pass") == "P76" and
                nested_report.get("status") == "PASS" and
                isinstance(nested_report.get("steps"), dict) and
                tuple(nested_report["steps"]) == P76["STEPS"] and
                all(step.get("status") == "PASS"
                    for step in nested_report["steps"].values()),
                "P76 inherited original Chrome groups incomplete")
        require(nested_report.get("originalSourceAudit") == opening and
                nested_report.get("closingSourceAudit") == opening,
                "P76 nested source audit disagrees with P81 opening commit/tree")
        require(nested_report.get("originalExecutableIdentitySha256") == identities,
                "P76 original game EXE fingerprints changed inside checkpoint")
        require(p76.get("privateReport") == str(p76_dir / "report.json"),
                "P76 reported private path disagrees with nested report")
        record(label, out, err, checked)

        for label, script, n in [
            (STEPS[1], "scripts/test_mk3_p77_chained_source_export.py", 9),
            (STEPS[2], "scripts/test_mk3_p79_leading_span.py", 4),
        ]:
            out, err = execute(label, [sys.executable, script])
            record(label, out, err, check_unittest(out, err, n, label))

        for label, script, checker in [
            (STEPS[3], "scripts/test-p78-mk3-chained-indexed.cjs", source_p78),
            (STEPS[4], "scripts/test-p80-leading-source.cjs", source_p80),
        ]:
            out, err = execute(label, ["node", script])
            record(label, out, err, checker(json_stdout(out, label)))

        for label, cmd, checker in [
            (STEPS[5], ["node", "scripts/verify-mk3-p78-original.cjs", mk3],
             original_p78),
            (STEPS[6], ["node", "scripts/verify-p78-browser-chained.cjs", mk3],
             chrome_p78),
            (STEPS[7], ["node", "scripts/verify-mk3-p80-original.cjs", mk3],
             original_p80),
            (STEPS[8], ["node", "scripts/verify-p80-browser-leading.cjs", mk3],
             chrome_p80),
        ]:
            out, err = execute(label, cmd)
            record(label, out, err, checker(json_stdout(out, label)))

        require(tuple(report["steps"]) == STEPS,
                "P81 missing original data or real Chrome acceptance groups")
        closing = P71["P66"]["audit_source"]()
        require(opening == closing,
                "source commit or tree changed during full P81 original checkpoint")
        report["sourceAuditAtEnd"] = closing
        report["status"] = "PASS"
    except BaseException as exc:
        report["status"] = "FAIL"
        report["failure"] = {
            "type": type(exc).__name__, "message": str(exc),
            "lastCompletedGroup": next(reversed(report["steps"]), None),
        }
        raise
    finally:
        report["finishedUtc"] = datetime.now(timezone.utc).isoformat()
        save()

    summary = {
        "pass": "P81", "status": "PASS",
        "sourceBranch": branch,
        "sourceCommit": opening["commit"],
        "sourceTree": opening["treeSha"],
        "requiredGroupsPassed": len(report["steps"]),
        "inheritedP76OriginalGroups": 6,
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
        "privateReport": str(work / "report.json"),
    }
    (work / "summary.json").write_text(
        json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    for opt in ("mk1", "mk2", "mk3", "work"):
        parser.add_argument("--" + opt, required=True)
    checkpoint(parser.parse_args())
