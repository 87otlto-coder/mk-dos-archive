#!/usr/bin/env python3
"""P82: direct-from-installation MK2 Tomb/Portal native-width source-layer ZIP.

Uses the previously independently verified O132 renderer/source evidence:
uncropped 896-column floors, native uncropped sprite index/opacity planes and
setup-local mosaics. These are NOT complete native stage composites, animated
scenes, proven camera/world placements, or runtime parallax relationships.

Commercial EXE/GRA bytes remain in the user's private FIXTURES, never in Git
or in the output archive. Original game resources are read but never modified.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
O132 = ROOT / "tools" / "mk2_native_stage_palettes"
ORIGINAL_HASHES = {
    "MK2.EXE": "fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65",
    "TOMB.GRA": "be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613",
    "PORTAL.GRA": "cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82",
    "IMAGES.GRA": "2b26796a64c2aebfee75832696aeae9bbcf9df56d82cb9a39df58a557d3ad8cf",
}
FORMAT = "mkdos_p82_mk2_uncropped_source_layer_pack_v1"
STAGE_DATA = {"tomb": (896, 48, 16, 6), "portal": (896, 40, 13, 2)}


def require(ok: object, reason: str) -> None:
    if not ok:
        raise ValueError("P82 original MK2 source layer pack: " + reason)


def digest(blob: bytes) -> str:
    return hashlib.sha256(blob).hexdigest()


def beneath(path: Path, directory: Path) -> bool:
    return path == directory or path.is_relative_to(directory)


def load_original_folder(folder: Path) -> tuple[dict[str, bytes], dict[str, str]]:
    require(folder.is_dir(), "original installation directory absent")
    require(not beneath(folder.resolve(), ROOT.resolve()),
            "commercial game files must remain outside SOURCE")
    available = list(folder.iterdir())
    source: dict[str, bytes] = {}
    locations: dict[str, str] = {}
    for name, expected in ORIGINAL_HASHES.items():
        matching = [p for p in available if p.is_file() and p.name.upper() == name]
        require(len(matching) == 1, "original file missing or duplicated: " + name)
        raw = matching[0].read_bytes()
        require(digest(raw) == expected,
                "original game source fingerprint mismatch: " + name)
        source[name] = raw
        locations[name] = matching[0].name
    return source, locations


def verify_manifest(report: dict, files: dict[str, bytes],
                    originals: dict[str, bytes], stages: tuple[str, ...]) -> dict:
    require(report.get("schema") == "mk2_o132_native_source_layer_pack_v1"
            and report.get("status") == "STATIC_CAMERA_INDEPENDENT_LAYER_EXPORT",
            "O132 production stage-source result not qualified")
    require(report.get("sourceExecutableSHA256") == digest(originals["MK2.EXE"]),
            "original EXE source provenance changed")
    require(report.get("motion", {}).get("parallaxMotionRulesRecovered") is False
            and report.get("motion", {}).get("animationFrameOrderingRecovered") is False
            and report.get("motion", {}).get("animationDurationsRecovered") is False,
            "unverified native animation/parallax assertion")
    require(report.get("compositing", {}).get("finalDrawOrderRecovered") is False
            and report.get("compositing", {}).get("liveCameraPositionRecovered") is False
            and report.get("compositing", {}).get("interSetupLayerPositionRecovered") is False,
            "unverified live renderer/scene placement assertion")
    assert list(STAGE_DATA) == ["tomb", "portal"]
    require([x.get("stage") for x in report.get("stages", [])] == list(stages),
            "wrong original stage identity or order")
    expected_pngs = 0
    for stage in report["stages"]:
        key = stage["stage"]
        width, height, sprite_count, setup_count = STAGE_DATA[key]
        require(stage["packedFloor"]["nativeDimensions"] == [width, height]
                and stage["packedFloor"]["cameraCropApplied"] is False,
                key + " original floor cropped or resized")
        require(len(stage["nativeSpriteDescriptors"]) == sprite_count
                and len(stage["setupLocalLayers"]) == setup_count,
                key + " source sprite/setup census changed")
        require(all(row.get("unalteredNativeSpriteBounds") is True
                    and row.get("originalGameAnimationMembershipKnown") is False
                    for row in stage["nativeSpriteDescriptors"]),
                key + " source native bounds or animation caveat changed")
        require(all(row.get("registeredStageWorldPosition") is None
                    and row.get("parallaxMovementRecovered") is False
                    and row.get("animationFramesRecovered") is False
                    for row in stage["setupLocalLayers"]),
                key + " stage placement/animation invented")
        expected_pngs += 2 + 3 * (sprite_count + setup_count)
    require(len(report["files"]) == len(files) == expected_pngs,
            "original stage source PNG census changed")
    by_name = {x.get("path"): x for x in report["files"]}
    require(len(by_name) == len(files) and set(by_name) == set(files),
            "source layer archive file list changed")
    for name, payload in files.items():
        require(isinstance(name, str) and
                name.split("/")[0] in stages and name.endswith(".png") and
                all(part and part not in (".", "..") for part in name.split("/")) and
                "\\" not in name and not name.startswith("/"),
                "unsafe or unexpected source PNG path")
        row = by_name[name]
        require(row.get("bytes") == len(payload) and
                row.get("sha256") == digest(payload) and
                row.get("format") in ("INDEX8_PNG", "ALPHA8_PNG", "RGBA_PNG"),
                "source PNG byte/digest/type provenance mismatch: " + name)
    return {"originalNativeSpriteCount": sum(STAGE_DATA[s][2] for s in stages),
            "originalSetupLocalLayerCount": sum(STAGE_DATA[s][3] for s in stages),
            "nativeFloorWidths": [STAGE_DATA[s][0] for s in stages],
            "sourcePngFiles": len(files)}


def pack_bytes(report: dict, files: dict[str, bytes],
               originals: dict[str, bytes], stages: tuple[str, ...]) -> tuple[dict[str, bytes], dict]:
    summary = verify_manifest(report, files, originals, stages)
    policy = {
        "format": FORMAT,
        "stageNames": list(stages),
        "originalInputSha256": {name: digest(originals[name])
                                for name in sorted(ORIGINAL_HASHES)},
        "sourceModule": "tools/mk2_native_stage_palettes/export_o132_scene_layer_pack.py",
        "originalSourceIndexAndOpacityPreserved": True,
        "nativeCameraOrFinalStageCompositingProven": False,
        "originalAnimationOrParallaxTimingProven": False,
        "nativeSpriteStreamsUncropped": True,
        "allOriginalCommercialGameFilesExcludedFromExport": True,
        "summary": summary,
    }
    content = dict(files)
    content["O132_SCENE_LAYERS.json"] = (
        json.dumps(report, sort_keys=True, indent=2) + "\n").encode("utf-8")
    content["P82_EXPORT_PROVENANCE.json"] = (
        json.dumps(policy, sort_keys=True, indent=2) + "\n").encode("utf-8")
    require(len(content) == len(files) + 2, "duplicate provenance filenames")
    return content, policy


def write_zip_new(out: Path, files: dict[str, bytes]) -> int:
    require(out.suffix.lower() == ".zip", "private output must be a ZIP")
    require(not out.exists(), "will never overwrite an existing ZIP")
    require(out.parent.is_dir(), "private output parent directory must already exist")
    require(not beneath(out.resolve(), ROOT.resolve()),
            "private output must be outside source repository")
    total = 0
    try:
        # 'xb' guarantees an existing file cannot be truncated or replaced.
        with out.open("xb") as fh, zipfile.ZipFile(fh, mode="w",
                                compression=zipfile.ZIP_STORED, allowZip64=True) as archive:
            for name, payload in sorted(files.items()):
                require(name and not name.startswith("/") and "\\" not in name
                        and all(part not in ("", ".", "..") for part in name.split("/")),
                        "unsafe ZIP member path")
                info = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_STORED
                archive.writestr(info, payload)
                total += len(payload)
    except BaseException:
        # Only clean up a newly-created partial archive, never an existing file.
        if out.exists():
            out.unlink()
        raise
    return total


def build_original_pack(folder: Path, out: Path, stages: tuple[str, ...]) -> dict:
    require(stages in (("tomb",), ("portal",), ("tomb", "portal")),
            "noncanonical stage selection")
    source, _ = load_original_folder(folder)
    require(not beneath(out.resolve(), folder.resolve()),
            "output must be outside the original commercial game directory")
    # Reuse O132 verified implementation, do not port its RLE, palette or
    # setup-local compositor into a new unqualified interpretation.
    sys.path.insert(0, str(O132))
    from export_o132_scene_layer_pack import build_pack  # noqa: E402
    report, files = build_pack(source["MK2.EXE"],
                               {k: source[k] for k in ("TOMB.GRA", "PORTAL.GRA", "IMAGES.GRA")},
                               stages)
    archive, policy = pack_bytes(report, files, source, stages)
    size = write_zip_new(out, archive)
    return {"pass": "P82_EXPORT", "status": "PASS",
            "originalGame": "mk2", "stages": list(stages),
            "nativeFloorSourceWidths": policy["summary"]["nativeFloorWidths"],
            "originalUncroppedSprites": policy["summary"]["originalNativeSpriteCount"],
            "setupLocalLayers": policy["summary"]["originalSetupLocalLayerCount"],
            "independentSourcePngFiles": policy["summary"]["sourcePngFiles"],
            "zipMembers": len(archive), "uncompressedBytes": size,
            "originalSourceFilesCopiedIntoZip": 0,
            "finalNativeStageAssemblyClaimed": False,
            "nativeAnimationOrParallaxTimingClaimed": False,
            "privateArchive": str(out)}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    parser.add_argument("--original-mk2", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--stage", choices=["tomb", "portal", "both"], default="both")
    args = parser.parse_args()
    stages = ("tomb", "portal") if args.stage == "both" else (args.stage,)
    result = build_original_pack(args.original_mk2, args.out, stages)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
