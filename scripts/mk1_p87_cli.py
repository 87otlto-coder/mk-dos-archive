#!/usr/bin/env python3
"""P87 MK1 original ANITAB/O60 indexed-source headless CLI adapter.

Invokes existing P65 production package and original-EXE/O60 readback via
the Node bridge. This adapter never implements a graphics codec, assigns a
native palette or claims original animation timing/frame traversal.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
from typing import Any, Callable

ROOT = Path(__file__).resolve().parents[1]
BRIDGE = ROOT / "scripts" / "mk1_p87_source_bridge.cjs"
CANONICAL_EXE = "750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14"
EXPECTED_P65 = {
    "pass": "P65", "status": "PASS", "mk1Assets": 2656,
    "originalTables": 8, "verifiedAnitabCells": 739,
    "uniqueOriginalSourceStreams": 514,
    "sourceInstructionFrameOccurrences": 1824,
    "sourceInstructionControlOccurrences": 786,
    "indexedDescriptorRecords": 1102,
    "indexedSourceFramePartsVerified": 1853,
    "distinctLinkedDescriptorKeys": 1102,
    "originalExecutableOpcodesAndPointersMatched": True,
    "originalO60IndexedBytesByteIdentical": True,
    "noOriginalPaletteOrTimingAssigned": True,
    "fullThreeGameRegressionPerformed": False,
    "browserPackageDownloadVerified": False,
}


def require(ok: object, reason: str) -> None:
    if not ok:
        raise ValueError("P87: " + reason)


def _exact(result: Any, fields: dict, label: str) -> None:
    require(isinstance(result, dict), label + " must be an object")
    for name, expected in fields.items():
        require(name in result and type(result[name]) is type(expected)
                and result[name] == expected,
                label + " " + name + " mismatch")


def _archive_digest(path: Path) -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def run_mk1(
    args: argparse.Namespace,
    *,
    runner: Callable[..., Any] = subprocess.run,
) -> dict:
    require(args.game == "mk1", "MK1 adapter only accepts --game mk1")
    require(args.action in ("scan", "extract", "verify"),
            "unsupported original MK1 source action")
    require(getattr(args, "stage", "both") == "both",
            "--stage Tomb/Portal selections only apply to MK2")
    source = Path(args.source).resolve(strict=True)
    require(source.is_dir(), "original MK1 source must be a directory")
    require(not source.is_relative_to(ROOT.resolve()),
            "original MK1 commercial sources must remain outside Git checkout")
    archive: Path | None = None
    if args.action != "scan":
        archive = Path(args.out if args.action == "extract" else args.archive)
        require(archive.suffix.lower() == ".zip", "private output must have .zip extension")
        require(archive.parent.is_dir(), "private output parent folder must exist")
        archive = archive.resolve(strict=False)
        require(not archive.is_relative_to(ROOT.resolve())
                and not archive.is_relative_to(source),
                "private indexed source archive must remain outside Git and original input")
        if args.action == "extract":
            require(not archive.exists(), "refusing to overwrite existing private ZIP")
        else:
            require(archive.is_file(), "verify requires existing private source ZIP")
    argv = ["node", str(BRIDGE), args.action, str(source)]
    if archive is not None:
        argv.append(str(archive))
    completed = runner(
        argv, cwd=ROOT, capture_output=True, text=True,
        check=False, timeout=5400,
    )
    if completed.returncode != 0:
        raise ValueError("P87 original MK1 bridge failed: " +
                         (completed.stderr or completed.stdout)[-8000:])
    try:
        result = json.loads(completed.stdout)
    except (TypeError, json.JSONDecodeError) as error:
        raise ValueError("P87 original MK1 bridge did not produce JSON") from error
    _exact(result, {
        "pass": "P87_CLI_MK1_" + args.action.upper(),
        "status": "PASS", "game": "mk1",
        "sourceIdentity": "CANONICAL_P65_MK1_EXE",
        "originalMk1ExeSha256": CANONICAL_EXE,
        "originalCatalogAssetsObserved": 2656,
        "originalAnitabTables": 8,
        "originalAnitabTableEntries": 739,
        "sourceExecutableStreamStarts": 514,
        "originalIndexedDescriptorRecords": 1102,
        "packageMembers": 4,
        "nativePaletteOrTimingClaimed": False,
        "nativeRuntimeTraversalVerified": False,
        "finalActorPlacementOrStageCompositeClaimed": False,
        "completeMk1CatalogExportClaimed": False,
        "previewPngsCreated": 0,
        "browserRequired": False,
    }, "MK1 source bridge")
    require(type(result.get("originalIndexedBinaryBytes")) is int
            and result["originalIndexedBinaryBytes"] > 0,
            "source indexed-plane byte length must be positive")
    if archive is not None:
        _exact(result, {
            "privateArchive": str(archive),
            "sourcePackageByteIdentical": True,
        }, "MK1 private source ZIP")
        _exact(result.get("independentOriginalP65Verifier"),
               EXPECTED_P65, "independent MK1 original P65 oracle")
        digest = result.get("recomputedPackageSha256")
        require(isinstance(digest, str) and len(digest) == 64,
                "independent source ZIP checksum missing")
        require(_archive_digest(archive) == digest,
                "private original source ZIP differs from recomputed package")
    return result
