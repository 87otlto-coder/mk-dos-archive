#!/usr/bin/env python3
"""P89 bounded R1/R2/R3 evidence inventories for *existing verified* ZIPs.

This is a READ-ONLY preparation probe, not an original runtime decoder.
No new graphic, native palette, stage composite, animation or asset is created.
Original DOS oracle gates are rerun separately when --original is provided.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import io
import json
import math
from pathlib import Path
import struct
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[3]
P79_DATA_SHA = "72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517"
P65_EXE_SHA = "750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14"
P82_EXE_SHA = "fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65"


def require(ok, why):
    if not ok:
        raise ValueError("P89 STRUCTURE: " + why)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read_zip(content: bytes):
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        names = archive.namelist()
        require(len(names) == len(set(names)), "duplicate ZIP name")
        require(all(not p.startswith("/") and "\\" not in p and
                    all(part not in ("", ".", "..") for part in p.split("/"))
                    for p in names), "unsafe ZIP path")
        require(archive.testzip() is None, "ZIP CRC mismatch")
        return {name: archive.read(name) for name in names}


def source_span(parts, files, *, source_start):
    cursor = source_start
    for part in parts:
        key = part["path"]
        require(key in files, "missing original source part " + key)
        data = files[key]
        require(part["offset"] == cursor and part["length"] == len(data) and
                part["sha256"] == sha(data), "source partition mismatch " + key)
        cursor += len(data)
    return cursor


def entropy_bits(payload: bytes) -> float:
    if not payload:
        return 0.0
    n = len(payload)
    return round(-sum((count / n) * math.log2(count / n)
                      for count in Counter(payload).values()), 5)


def r1_mk3_p79(archive_bytes: bytes, *, canonical=True) -> dict:
    files = read_zip(archive_bytes)
    require("manifest.json" in files, "P79 manifest missing")
    manifest = json.loads(files["manifest.json"])
    require(manifest.get("format") == "mk3_p79_leading_span_v1" and
            manifest.get("nativePaletteVerified") is False and
            manifest.get("continuationRenderingVerified") is False and
            manifest.get("stageMembershipVerified") is False,
            "unqualified P79 source or false native claim")
    count = manifest["continuationCount"]
    require(type(count) is int and 0 < count <= 216, "invalid bounded source count")
    parts = manifest["sourceParts"]
    require(len(parts) == count + 4, "source part count")
    expected = {"manifest.json", "header.bin", "adjacent-rgb8.bin",
                "base-header.bin", "base-indices.bin",
                "index-preview.png", "adjacent-rgb8-comparison.png"}
    expected.update(f"records/{i:03d}.bin" for i in range(count))
    require(set(files) == expected, "P79 source archive member census")
    start = manifest["spanOffset"]
    width, height = manifest["width"], manifest["height"]
    require(len(files["header.bin"]) == 6 and
            len(files["adjacent-rgb8.bin"]) == 768 and
            len(files["base-header.bin"]) == 8 and
            len(files["base-indices.bin"]) == width * height,
            "P79 original base parts changed")
    declared_count, declared_width, declared_height = struct.unpack("<HHH", files["header.bin"])
    reserved, size = struct.unpack("<II", files["base-header.bin"])
    require((declared_count, declared_width, declared_height, reserved, size) ==
            (count, width, height, 0, width * height), "source header versus manifest mismatch")
    end = source_span(parts, files, source_start=start)
    require(end - start == manifest["spanLength"], "P79 original interval not tiled")
    if canonical:
        require((start, end, width, height, count) ==
                (667866, 2508500, 320, 200, 216) and
                manifest["sourceSha256"] == P79_DATA_SHA,
                "not the canonical verified MK3 leading source")
    records = []
    for i in range(count):
        member = f"records/{i:03d}.bin"
        record = files[member]
        require(len(record) >= 14, "truncated P79 continuation header")
        tag, field_a, field_b, payload_length = struct.unpack_from("<HIII", record)
        require(tag == 3 and payload_length == len(record) - 14 and
                (payload_length > 0 or (field_a == 0 and field_b == 0)),
                "original continuation tag/length/empty-record mismatch")
        part = parts[4+i]
        require((part["path"], part["fieldA"], part["fieldB"], part["payloadLength"],
                 part["payloadOffset"]) ==
                (member, field_a, field_b, payload_length, part["offset"]+14),
                "P79 source field provenance")
        payload = record[14:]
        records.append({
            "ordinal": i, "sourceOffset": part["offset"],
            "storedLength": len(record), "payloadLength": payload_length,
            "fieldA": field_a, "fieldB": field_b,
            "payloadSha256": sha(payload),
            "zeroByteFraction": round(payload.count(0) / len(payload), 6) if payload else None,
            "shannonEntropyBitsPerByte": entropy_bits(payload) if payload else None,
            "classification": "RAW_UNDECODED",
        })
    if canonical:
        require([r["ordinal"] for r in records if r["payloadLength"] == 0] ==
                list(range(120, 126)), "P79 six zero-length record identity changed")
        require(sum(r["payloadLength"] for r in records) == 1772828,
                "original continuation payload census changed")
    return {
        "pass": "P89_R1_STRUCTURE", "status": "PASS",
        "dataFamily": "MK3_P79_RAW_CONTINUATIONS_NOT_P77_216_DECODED_IMAGES",
        "inputArchiveSha256": sha(archive_bytes), "sourceManifestSha256": sha(files["manifest.json"]),
        "sourceSpanOffset": start, "sourceSpanEndExclusive": end,
        "sourceIntervalBytesAccounted": end-start,
        "records": records, "recordCount": count,
        "totalPayloadBytes": sum(r["payloadLength"] for r in records),
        "zeroLengthOrdinals": [r["ordinal"] for r in records if r["payloadLength"] == 0],
        "nativeContinuationImagesDecoded": 0,
        "fieldABOrCompressionMeaningVerified": False,
        "statisticsDoNotProveCodecOrAnimation": True,
    }


def r2_mk1_p65(archive_bytes: bytes, *, canonical=True) -> dict:
    files = read_zip(archive_bytes)
    require(set(files) == {
        "manifests/mk1_source_streams.json", "indexed/descriptor_manifest.json",
        "indexed/descriptor_pixels.bin", "README.txt",
    }, "P65 source manifest member census")
    stream_manifest = json.loads(files["manifests/mk1_source_streams.json"])
    desc_manifest = json.loads(files["indexed/descriptor_manifest.json"])
    indexed = files["indexed/descriptor_pixels.bin"]
    require(stream_manifest.get("format") == "mk1_p65_lossless_anitab_source_streams_v1" and
            desc_manifest.get("format") == "mk1_animation_indexed_descriptor_payload_manifest_v1",
            "MK1 original stream/index manifest format")
    require(sha(indexed) == stream_manifest.get("originalIndexedBinarySha256") and
            len(indexed) == stream_manifest.get("originalIndexedBinaryByteLength") and
            sha(files["indexed/descriptor_manifest.json"]) ==
            stream_manifest.get("originalIndexedManifestSha256"), "P65 original O60 payload identity")
    require(stream_manifest.get("originalPalettesNotAssigned") is True and
            stream_manifest.get("nativeAnimationMillisecondsVerified") is False and
            stream_manifest.get("worldPlacementAndStageCompositionVerified") is False,
            "unsupported native interpretation in original MK1 source package")
    drows = desc_manifest["descriptors"]
    require(desc_manifest["descriptorCount"] == stream_manifest["indexedDescriptorCount"] ==
            len(drows), "P65 indexed descriptor census")
    desc_keys = {str(row["tableSymbol"])+":"+str(row["descriptorWatcomOffset"]) for row in drows}
    require(len(desc_keys) == len(drows), "duplicate source descriptor key")
    tables = stream_manifest["tables"]
    require(len(tables) == stream_manifest["sourceTableCount"], "ANITAB table census")
    streams = set()
    total_frames = total_controls = total_parts = 0
    summaries = []
    for table in tables:
        symbol = table["symbol"]
        rows = table["sourceStreams"]
        starts = {r["sourceStreamWatcomOffset"] for r in rows}
        require(len(starts) == len(rows), "duplicate source stream inside table")
        for entry in table["entries"]:
            ref = entry["sourceStreamWatcomOffset"]
            require(ref is None or ref in starts, "unresolved original source stream entry")
            dkey = entry["sourceDescriptorKey"]
            require(dkey is None or dkey in desc_keys, "unresolved original descriptor entry")
        for item in rows:
            offset = item["sourceStreamWatcomOffset"]
            streams.add(offset)
            events = item["events"]
            frames = controls = 0
            kinds = Counter()
            require(item["sourceInstructionEncounterOrderOnly"] is True and
                    item["nativeRuntimeTraversalVerified"] is False and
                    item["termination"] in ("END", "LOOP"), "false source stream playback claim")
            for ordinal, event in enumerate(events):
                require(event["eventOrdinal"] == ordinal, "source instruction order mutated")
                kind = event["kind"]
                kinds[kind] += 1
                if kind == "frame":
                    keys = event["sourceFramePartDescriptorKeys"]
                    require(len(keys) > 0 and all(key in desc_keys for key in keys) and
                            event["frameTimingMilliseconds"] is None and
                            event["nativePaletteSelected"] is None and
                            event["runtimeCompositionVerified"] is False,
                            "incorrect MK1 descriptor link or invented playback claim")
                    frames += 1
                    total_parts += len(keys)
                else:
                    controls += 1
            total_frames += frames
            total_controls += controls
            summaries.append({
                "table": symbol, "sourceStreamWatcomOffset": offset,
                "originalSourceInstructions": len(events),
                "sourceFrameInstructions": frames, "sourceControlInstructions": controls,
                "observedControlKinds": dict(sorted(kinds.items())),
                "sourceTermination": item["termination"],
                "classification": "SOURCE_GRAPH_ONLY_NOT_NATIVE_PLAYBACK",
            })
    if canonical:
        require(stream_manifest.get("originalExeSha256") == P65_EXE_SHA and
                len(tables) == 8 and len(drows) == 1102 and
                len(streams) == 514 and total_frames == 1824 and
                total_controls == 786 and total_parts == 1853 and
                sum(len(table["entries"]) for table in tables) == 739,
                "canonical original MK1 P65 stream/part event census")
    return {
        "pass": "P89_R2_STRUCTURE", "status": "PASS",
        "inputArchiveSha256": sha(archive_bytes),
        "sourceTableCount": len(tables),
        "sourceStreamCountDistinct": len(streams),
        "sourceFrameOccurrences": total_frames,
        "sourceControlOccurrences": total_controls,
        "sourceFramePartOccurrences": total_parts,
        "descriptorsReferenced": len(desc_keys),
        "streams": summaries,
        "nativeFrameDurationsOrTraversalVerified": False,
        "originalSourceEncounterOrderIsNotNativePlayback": True,
    }


def r3_mk2_p82(archive_bytes: bytes, *, canonical=True) -> dict:
    files = read_zip(archive_bytes)
    require("O132_SCENE_LAYERS.json" in files and
            "P82_EXPORT_PROVENANCE.json" in files, "P82 stage evidence manifests absent")
    report = json.loads(files["O132_SCENE_LAYERS.json"])
    policy = json.loads(files["P82_EXPORT_PROVENANCE.json"])
    require(report.get("schema") == "mk2_o132_native_source_layer_pack_v1" and
            report.get("status") == "STATIC_CAMERA_INDEPENDENT_LAYER_EXPORT" and
            policy.get("format") == "mkdos_p82_mk2_uncropped_source_layer_pack_v1",
            "unsupported original MK2 stage layer pack")
    require(policy.get("nativeCameraOrFinalStageCompositingProven") is False and
            policy.get("originalAnimationOrParallaxTimingProven") is False and
            policy.get("originalSourceIndexAndOpacityPreserved") is True and
            policy.get("allOriginalCommercialGameFilesExcludedFromExport") is True,
            "native composition claim or lossless-stage source omission")
    stages = report["stages"]
    require([s["stage"] for s in stages] == policy["stageNames"],
            "stage order/identity mismatch")
    declared = {f["path"]: f for f in report["files"]}
    require(len(declared) == len(report["files"]) and
            set(files) == set(declared) | {"O132_SCENE_LAYERS.json", "P82_EXPORT_PROVENANCE.json"},
            "P82 source layer membership mismatch")
    for name, row in declared.items():
        require(name.endswith(".png") and name.split("/")[0] in policy["stageNames"]
                and row["sha256"] == sha(files[name]) and
                row["bytes"] == len(files[name]),
                "stage PNG identity mismatch " + name)
    summaries = []
    for stage in stages:
        name = stage["stage"]
        floor = stage["packedFloor"]
        w, h = floor["nativeDimensions"]
        native_sprites = stage["nativeSpriteDescriptors"]
        setup_layers = stage["setupLocalLayers"]
        require(w > 0 and h > 0 and floor["cameraCropApplied"] is False and
                all(s.get("unalteredNativeSpriteBounds") is True and
                    s.get("originalGameAnimationMembershipKnown") is False
                    for s in native_sprites) and
                all(s.get("registeredStageWorldPosition") is None and
                    s.get("animationFramesRecovered") is False and
                    s.get("parallaxMovementRecovered") is False
                    for s in setup_layers), "false native stage placement/animation claim")
        summaries.append({
            "stage": name, "nativeFloorSourceDimensions": [w,h],
            "uncroppedSpriteSources": len(native_sprites),
            "sourceSetupLocalLayerGroups": len(setup_layers),
            "nativeFinalDrawOrderVerified": False, "liveCameraVerified": False,
            "interSetupWorldPlacementVerified": False,
            "classification": "CAMERA_INDEPENDENT_SOURCE_LAYERS_ONLY",
        })
    if canonical:
        require([s["stage"] for s in stages] == ["tomb", "portal"] and
                [s["nativeFloorSourceDimensions"] for s in summaries] ==
                [[896,48],[896,40]] and
                [s["uncroppedSpriteSources"] for s in summaries] == [16,13] and
                [s["sourceSetupLocalLayerGroups"] for s in summaries] == [6,2] and
                len(declared) == 115 and len(files) == 117 and
                policy["originalInputSha256"]["MK2.EXE"] == P82_EXE_SHA,
                "not the canonical P82 Tomb/Portal source layer pack")
    return {
        "pass": "P89_R3_STRUCTURE", "status": "PASS",
        "inputArchiveSha256": sha(archive_bytes),
        "sourcePngFiles": len(declared),
        "stageSourceEvidence": summaries,
        "nativeCompositesProduced": 0,
        "nativeCameraOrDrawOrderVerified": False,
        "metadataAloneDoesNotProveStagePlacement": True,
    }


PROBES = {"r1": r1_mk3_p79, "r2": r2_mk1_p65, "r3": r3_mk2_p82}
ORIGINAL_SCRIPTS = {
    "r1": lambda source, archive: [
        sys.executable, str(ROOT / "scripts/verify_mk3_p79_leading_span.py"), str(source), str(archive)],
    "r2": lambda source, archive: [
        sys.executable, str(ROOT / "scripts/mkext.py"), "verify", "--game", "mk1",
        "--source", str(source), "--archive", str(archive)],
    "r3": lambda source, archive: [
        sys.executable, str(ROOT / "scripts/verify-mk2-p82-native-stage-independent.py"),
        "--original-mk2", str(source), "--archive", str(archive)],
}


def verified_original_gate(family: str, source: Path, archive: Path) -> str:
    result = subprocess.run(ORIGINAL_SCRIPTS[family](source, archive),
                            cwd=ROOT, capture_output=True, text=True, timeout=5400,
                            check=False)
    require(result.returncode == 0, "prior accepted independent original DOS oracle FAILED: " +
            (result.stderr or result.stdout)[-1700:])
    parsed = json.loads(result.stdout)
    require(parsed.get("status") == "PASS", "prior source verifier did not report PASS")
    expected = {"r1": ("passName", "P79_ORIGINAL"),
                "r2": ("pass", "P87_CLI_MK1_VERIFY"),
                "r3": ("pass", "P82_INDEPENDENT")}[family]
    require(parsed.get(expected[0]) == expected[1], "wrong original source verifier")
    return "VERIFIED_BY_EXISTING_INDEPENDENT_ORIGINAL_ORACLE"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("family", choices=PROBES)
    parser.add_argument("--archive", required=True, type=Path,
                        help="Private P79/P65/P82 existing original-source ZIP")
    parser.add_argument("--original", type=Path,
                        help="Corresponding private DOS original; required to establish original-byte PASS")
    parser.add_argument("--report", type=Path, help="NEW private JSON report path")
    args = parser.parse_args()
    try:
        archive = args.archive.resolve(strict=True)
        require(archive.is_file() and not archive.is_relative_to(ROOT.resolve()),
                "archive must be private and outside Git")
        source = args.original.resolve(strict=True) if args.original else None
        if source:
            require(not source.is_relative_to(ROOT.resolve()), "commercial input inside source checkout")
        if args.report:
            report = args.report.resolve(strict=False)
            require(args.report.suffix.lower() == ".json" and args.report.parent.is_dir()
                    and not report.exists() and not report.is_relative_to(ROOT.resolve())
                    and (source is None or not report.is_relative_to(source)),
                    "private report path missing/unsafe/existing")
        result = PROBES[args.family](archive.read_bytes())
        result["originalDOSFixtureVerification"] = (
            verified_original_gate(args.family, source, archive)
            if source is not None else "UNAVAILABLE_NOT_TESTED")
        result["probeDoesNotValidateNativeRuntimeRelationships"] = True
        if args.report:
            with report.open("x", encoding="utf-8") as output:
                json.dump(result, output, indent=2, sort_keys=True)
                output.write("\n")
        print(json.dumps(result, indent=2))
        return 0
    except (ValueError, OSError, KeyError, TypeError, IndexError,
            zipfile.BadZipFile, struct.error, json.JSONDecodeError,
            subprocess.TimeoutExpired) as error:
        print("P89 STRUCTURE ERROR: " + str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
