#!/usr/bin/env python3
"""P84/P85 headless Windows entry point for independently qualified sources.

Original MK2 Tomb/Portal stage layers reuse P82; original MK3 leading indexed
source + raw continuation records reuse P79. The CLI does not implement new
sprite codecs, native palette ownership, scene assembly, or animation timing.

Private commercial inputs and exported media must remain outside the Git repo.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import runpy
import sys
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
P82_EXPORTER = ROOT / "scripts" / "export-mk2-p82-native-stage-pack.py"
P82_VERIFIER = ROOT / "scripts" / "verify-mk2-p82-native-stage-independent.py"


def exporter() -> dict[str, Any]:
    # run_path executes definitions only; it never invokes P82.main().
    return runpy.run_path(str(P82_EXPORTER))


def independent_verifier() -> dict[str, Any]:
    # PIL is needed only for real PNG export/independent verification, not scan.
    return runpy.run_path(str(P82_VERIFIER))


def describe_stage_support(producer: dict[str, Any]) -> dict[str, dict[str, Any]]:
    # Coverage is the already-qualified P82 exporter contract, not a new scan
    # of all 5,369 browser representations.
    return {
        name: {
            "originalFloorSourceDimensions": [width, height],
            "uncroppedSourceSpriteStreams": sprites,
            "setupLocalLayerGroups": setups,
            "exportedSourcePngFiles": 2 + 3 * (sprites + setups),
        }
        for name, (width, height, sprites, setups)
        in producer["STAGE_DATA"].items()
    }


def run_command(
    args: argparse.Namespace,
    *,
    producer: dict[str, Any] | None = None,
    verifier: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Execute a command. Optional injected backends are for synthetic tests."""
    if args.game == "mk3":
        # Branch before importing the MK2 producer. Preserve the independently
        # original-accepted P84 MK2 path exactly as it was tested.
        from mk3_p85_cli import run_mk3
        return run_mk3(args)
    if args.game != "mk2":
        raise ValueError("Only original DOS MK2 and MK3 source subsets are supported")
    producer = producer if producer is not None else exporter()
    folder = Path(args.source)

    if args.action == "scan":
        original, names = producer["load_original_folder"](folder)
        observed = {name: producer["digest"](original[name])
                    for name in sorted(producer["ORIGINAL_HASHES"])}
        if observed != dict(sorted(producer["ORIGINAL_HASHES"].items())):
            raise ValueError("P84 original source fingerprints did not match")
        stage_support = describe_stage_support(producer)
        return {
            "pass": "P84_CLI_SCAN",
            "status": "PASS",
            "game": "mk2",
            "sourceIdentity": "CANONICAL_P82_FOUR_ORIGINAL_FILES",
            "originalFileSha256": observed,
            "originalFileNamesInSelectedFolder": names,
            "stageSourceExportCoverage": stage_support,
            "sourcePngFilesAvailableIfExported": sum(
                item["exportedSourcePngFiles"] for item in stage_support.values()),
            "fullGameAssetCatalogScanned": False,
            "nativeSceneCompositionOrAnimationClaimed": False,
        }

    if args.action == "extract":
        stages = ("tomb", "portal") if args.stage == "both" else (args.stage,)
        destination = Path(args.out)
        # P82 enforces exact input SHA, exclusive nonoverwriting ZIP creation,
        # SOURCE/FIXTURES separation and absence of commercial game files.
        produced = producer["build_original_pack"](folder, destination, stages)
        oracle = verifier if verifier is not None else independent_verifier()
        checked = oracle["verify"](folder, destination)
        if (produced.get("pass") != "P82_EXPORT"
                or produced.get("status") != "PASS"
                or checked.get("pass") != "P82_INDEPENDENT"
                or checked.get("status") != "PASS"
                or checked.get("originalStages") != list(stages)
                or checked.get("sourcePngFilesIndependentPixelParity")
                    != produced.get("independentSourcePngFiles")
                or checked.get("sourceNativeSprites")
                    != produced.get("originalUncroppedSprites")
                or checked.get("sourceSetupLocalLayers")
                    != produced.get("setupLocalLayers")
                or checked.get("nativeCameraOrStageCompositeClaimed") is not False
                or checked.get("nativeAnimationOrParallaxTimingClaimed") is not False):
            raise ValueError("P84 independent original-source export acceptance failed")
        return {
            "pass": "P84_CLI_EXTRACT",
            "status": "PASS",
            "game": "mk2",
            "producer": produced,
            "independentOriginalByteAndPngVerification": checked,
            "browserRequired": False,
            "fullGameAssetCatalogClaimed": False,
        }

    if args.action == "verify":
        oracle = verifier if verifier is not None else independent_verifier()
        checked = oracle["verify"](folder, Path(args.archive))
        if (checked.get("pass") != "P82_INDEPENDENT"
                or checked.get("status") != "PASS"
                or checked.get("nativeCameraOrStageCompositeClaimed") is not False
                or checked.get("nativeAnimationOrParallaxTimingClaimed") is not False):
            raise ValueError("P84 independent original-source verification failed")
        return {
            "pass": "P84_CLI_VERIFY",
            "status": "PASS",
            "game": "mk2",
            "independentOriginalByteAndPngVerification": checked,
            "browserRequired": False,
        }

    raise ValueError("Unknown P84 headless extractor action")


def parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Headless original DOS MK2 stage sources / MK3 leading indexed sources (P85)",
        allow_abbrev=False,
    )
    sub = p.add_subparsers(dest="action", required=True)
    for name in ("scan", "extract", "verify"):
        cmd = sub.add_parser(name, allow_abbrev=False)
        cmd.add_argument("--game", choices=("mk2", "mk3"), required=True,
                         help="MK2 Tomb/Portal layers or MK3 P79 leading source records")
        cmd.add_argument("--source", type=Path, required=True,
                         help="Original game installation, MK3 DATA.MK3, or private MK3 ZIP outside SOURCE")
        if name == "extract":
            cmd.add_argument("--out", type=Path, required=True,
                             help="New, never-existing ZIP path outside SOURCE and original game folder")
            cmd.add_argument("--stage", choices=("both", "tomb", "portal"),
                             default="both", help="MK2 only; MK3 uses its qualified P79 leading source")
        if name == "verify":
            cmd.add_argument("--archive", type=Path, required=True,
                             help="Existing private P82 MK2 or P79 MK3 original-source ZIP")
    return p


def main() -> int:
    args = parser().parse_args()
    try:
        result = run_command(args)
    except (ValueError, OSError, ImportError) as exc:
        # Fail visibly, do not mislabel a partial ZIP or unsupported original
        # fixture as a successful export. Preserve unmodified private outputs.
        print("MKEXT_CLI ERROR: " + str(exc), file=sys.stderr)
        return 2
    print(json.dumps(result, sort_keys=True, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
