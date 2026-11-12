#!/usr/bin/env python3
"""P85 MK3 leading original-index/continuation source CLI adapter.

Thin integration of the ORIGINAL P79 producer and independent original-byte/
PNG oracle. A continuation record is NOT a decoded animation frame. Native
palette, opacity, frame order, timing and stage ownership remain UNKNOWN.
"""
from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_GAP = {"offset": 667866, "length": 1840634}
EXPECTED_SOURCE_PARTS = 220
EXPECTED_CONTINUATIONS = 216
EXPECTED_ZIP_MEMBERS = 223
EXPECTED_INDEX_POSITIONS = 320 * 200


def refuse_repo_paths(source: Path, archive: Path | None = None) -> None:
    """Keep original commercial files and exported copyrighted media out of Git."""
    repo = ROOT.resolve()
    if source.resolve().is_relative_to(repo):
        raise ValueError("P85 commercial source must remain outside SOURCE repository")
    if archive is not None:
        final = archive.resolve()
        if final.is_relative_to(repo):
            raise ValueError("P85 private ZIP cannot be written into SOURCE repository")
        if source.is_dir() and final.is_relative_to(source.resolve()):
            raise ValueError("P85 private ZIP cannot be written into original installation")
        if final == source.resolve():
            raise ValueError("P85 private ZIP cannot overwrite original input")


def validate_original_scan(producer: Any, source: Path) -> tuple[dict, str]:
    # P73 original reader supports source file or folder, or a private game ZIP.
    data = producer.read_original_data(source)
    signature = producer.sha(data)
    if signature != producer.DATA_SHA256:
        raise ValueError("P85 original MK3 DATA.MK3 SHA256 identity mismatch")
    forms, gaps = producer.iff_forms_and_gaps(data)
    if len(forms) != 416 or len(gaps) != 20 or gaps[0] != EXPECTED_GAP:
        raise ValueError("P85 original MK3 source interval/FORM topology mismatch")
    start, length = EXPECTED_GAP["offset"], EXPECTED_GAP["length"]
    if data[start + length:start + length + 4] != b"FORM":
        raise ValueError("P85 original MK3 leading interval does not end at FORM")
    manifest, entries = producer.parse_span(data[start:start + length], start)
    if (manifest["format"] != "mk3_p79_leading_span_v1"
            or manifest["spanOffset"] != start
            or manifest["spanLength"] != length
            or (manifest["width"], manifest["height"]) != (320, 200)
            or manifest["continuationCount"] != EXPECTED_CONTINUATIONS
            or len(manifest["sourceParts"]) != EXPECTED_SOURCE_PARTS
            or len(entries) != EXPECTED_ZIP_MEMBERS - 1
            or any(manifest[field] is not False for field in
                   ("nativePaletteVerified", "continuationRenderingVerified", "stageMembershipVerified"))):
        raise ValueError("P85 original MK3 source base/record census or confidence mismatch")
    return manifest, signature


def require_independent_result(result: dict) -> None:
    if not isinstance(result, dict) or any((
        result.get("passName") != "P79_ORIGINAL",
        result.get("status") != "PASS",
        result.get("sourceParts") != EXPECTED_SOURCE_PARTS,
        result.get("records") != EXPECTED_CONTINUATIONS,
        result.get("baseIndexedPositions") != EXPECTED_INDEX_POSITIONS,
        result.get("pngPixelsCompared") != 2 * EXPECTED_INDEX_POSITIONS,
        result.get("intervalBytes") != EXPECTED_GAP["length"],
        result.get("zipMembers") != EXPECTED_ZIP_MEMBERS,
    )):
        raise ValueError("P85 independent original MK3 source/index PNG acceptance failed")


def run_mk3(
    args: argparse.Namespace,
    *,
    producer: Any = None,
    oracle: Any = None,
) -> dict:
    """Source-only injectable backend makes acceptance and refusals testable."""
    if args.game != "mk3":
        raise ValueError("P85 MK3 adapter only supports --game mk3")
    if args.action == "extract" and getattr(args, "stage", "both") != "both":
        raise ValueError("P85 --stage is MK2-only; MK3 supports leading-index export")
    source = Path(args.source)
    archive = Path(args.out if args.action == "extract" else args.archive) \
        if args.action in ("extract", "verify") else None
    refuse_repo_paths(source, archive)

    if producer is None:
        import mk3_p79_leading_span as producer

    if args.action == "scan":
        manifest, signature = validate_original_scan(producer, source)
        return {
            "pass": "P85_CLI_MK3_SCAN",
            "status": "PASS",
            "game": "mk3",
            "sourceIdentity": "CANONICAL_P79_DATA_MK3",
            "originalDataMk3Sha256": signature,
            "sourceIndexedBaseDimensions": [manifest["width"], manifest["height"]],
            "sourceBaseIndexedPositions": EXPECTED_INDEX_POSITIONS,
            "sourceRawContinuationRecords": EXPECTED_CONTINUATIONS,
            "sourcePartsIfExtracted": EXPECTED_SOURCE_PARTS,
            "sourcePreviewPngsIfExtracted": 2,
            "privateZipMembersIfExtracted": EXPECTED_ZIP_MEMBERS,
            "fullGameAssetCatalogScanned": False,
            "nativePaletteOrOpacityVerified": False,
            "continuationFramesDecoded": 0,
            "nativeStageMembershipOrAnimationTimingClaimed": False,
        }

    if archive is None:
        raise ValueError("P85 private archive path required")
    if args.action == "extract":
        if archive.suffix.lower() != ".zip":
            raise ValueError("P85 output must use .zip extension")
        if archive.exists():
            raise ValueError("P85 refuses to overwrite an existing private ZIP")
        if not archive.parent.is_dir():
            raise ValueError("P85 private output parent directory must already exist")
        # Existing P79 producer creates the ZIP via an exclusive hardlink from
        # a same-directory temporary file. Never reimplement its decoder here.
        manifest = producer.export(source, archive)
        if (manifest.get("format") != "mk3_p79_leading_span_v1"
                or manifest.get("sourceSha256") != producer.DATA_SHA256
                or manifest.get("continuationCount") != EXPECTED_CONTINUATIONS
                or (manifest.get("width"), manifest.get("height")) != (320, 200)
                or any(manifest.get(field) is not False for field in (
                    "nativePaletteVerified", "continuationRenderingVerified",
                    "stageMembershipVerified"))):
            raise ValueError("P85 produced MK3 ZIP does not meet original P79 contract")

    elif args.action != "verify":
        raise ValueError("Unsupported P85 MK3 CLI action")

    if oracle is None:
        # The independent verifier depends on Pillow for actual PNG readback.
        import verify_mk3_p79_leading_span as oracle
    result = oracle.verify(source, archive)
    require_independent_result(result)
    return {
        "pass": ("P85_CLI_MK3_EXTRACT" if args.action == "extract"
                 else "P85_CLI_MK3_VERIFY"),
        "status": "PASS",
        "game": "mk3",
        "originalIndexedBaseDimensions": [320, 200],
        "sourceRawContinuationRecords": EXPECTED_CONTINUATIONS,
        "sourcePreviewPngsVerified": 2,
        "independentOriginalSourceAndPngVerification": result,
        "browserRequired": False,
        "nativePaletteOrOpacityVerified": False,
        "continuationFramesDecoded": 0,
        "nativeStageMembershipOrAnimationTimingClaimed": False,
        "fullGameAssetCatalogClaimed": False,
        **({"privateArchive": str(archive)} if args.action == "extract" else {}),
    }
