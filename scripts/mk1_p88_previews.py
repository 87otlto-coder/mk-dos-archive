#!/usr/bin/env python3
"""P88: source-preserving MK1 ANITAB descriptor previews.

P87/P65 supplies *original* indexed pixels and source paint masks. This adds
diagnostic index-value RGBA PNGs and individual lossless binary sidecars.
It deliberately does NOT assign native colours, frame playback, or Z order.
The public CLI first reruns the independent original-P65 oracle through P87.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import sys
import zipfile
import zlib

ROOT = Path(__file__).resolve().parents[1]
CANONICAL = "750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14"
P65_NAMES = {
    "manifests/mk1_source_streams.json",
    "indexed/descriptor_manifest.json",
    "indexed/descriptor_pixels.bin",
    "README.txt",
}
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def require(ok: object, message: str) -> None:
    if not ok:
        raise ValueError("P88: " + message)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def chunk(kind: bytes, payload: bytes) -> bytes:
    return (struct.pack(">I", len(payload)) + kind + payload +
            struct.pack(">I", zlib.crc32(kind + payload) & 0xffffffff))


def gray_rgba_png(indices: bytes, mask: bytes, width: int, height: int) -> bytes:
    """A diagnostic PNG: R=G=B=raw index, A=255*original paint mask.

    Even transparent RGB retains its original index value. This PNG is NOT a
    source-verified palette rendering or proof of native compositing opacity.
    """
    require(width > 0 and height > 0 and width * height == len(indices) == len(mask),
            "invalid original descriptor dimensions/planes")
    scan = bytearray()
    for y in range(height):
        scan.append(0)  # PNG filter None; deterministic source-index roundtrip
        for i in range(y * width, (y + 1) * width):
            require(mask[i] in (0, 1), "nonbinary original source paint mask")
            scan.extend((indices[i], indices[i], indices[i], 255 * mask[i]))
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return (PNG_SIGNATURE + chunk(b"IHDR", ihdr) +
            chunk(b"IDAT", zlib.compress(bytes(scan), level=9)) +
            chunk(b"IEND", b""))


def p65_data(archive: bytes, *, canonical: bool = True):
    """Read and bound all original P65 index/mask spans, never mutate them.

    canonical=False is only for source-free synthetic tests, never CLI output.
    """
    import io
    with zipfile.ZipFile(io.BytesIO(archive)) as z:
        names = z.namelist()
        require(len(names) == len(P65_NAMES) and set(names) == P65_NAMES,
                "four-member P65 package structure or duplicate paths changed")
        streams_bytes = z.read("manifests/mk1_source_streams.json")
        manifest_bytes = z.read("indexed/descriptor_manifest.json")
        pixels = z.read("indexed/descriptor_pixels.bin")
    streams = json.loads(streams_bytes)
    manifest = json.loads(manifest_bytes)
    require(streams.get("format") == "mk1_p65_lossless_anitab_source_streams_v1",
            "unrecognized P65 source stream format")
    require(manifest.get("format") == "mk1_animation_indexed_descriptor_payload_manifest_v1",
            "unrecognized O60 descriptor manifest")
    rows = manifest.get("descriptors")
    require(isinstance(rows, list) and len(rows) == manifest.get("descriptorCount"),
            "O60 descriptor census mismatch")
    require(streams.get("originalIndexedBinarySha256") == digest(pixels) and
            streams.get("originalIndexedBinaryByteLength") == len(pixels) and
            streams.get("originalIndexedManifestSha256") == digest(manifest_bytes),
            "original P65 indexed payload or manifest changed")
    require(streams.get("originalPalettesNotAssigned") is True and
            streams.get("nativeAnimationMillisecondsVerified") is False and
            streams.get("nativeRuntimeTraversalVerified", False) is False and
            streams.get("worldPlacementAndStageCompositionVerified") is False,
            "P65 claims unresolved native relationships")
    if canonical:
        require(streams.get("originalExeSha256") == CANONICAL and
                streams.get("sourceTableCount") == 8 and
                streams.get("originalTableEntries") == 739 and
                streams.get("uniqueSourceExecutableStreams") == 514 and
                streams.get("indexedDescriptorCount") == 1102 and
                len(rows) == 1102, "not the canonical original MK1 P65 package")
    seen = set()
    cursor = 0
    resolved = []
    for row in rows:
        key = str(row["tableSymbol"]) + ":" + str(row["descriptorWatcomOffset"])
        require(key not in seen, "duplicate original descriptor key")
        seen.add(key)
        width, height, count = row["width"], row["height"], row["pixelCount"]
        require(type(width) is int and type(height) is int and
                width > 0 and height > 0 and count == width * height,
                "invalid source geometry " + key)
        start = row["indicesOffset"]
        mid = row["maskOffset"]
        end = mid + count
        require(type(start) is int and type(mid) is int and
                start == cursor and mid == start + count and end <= len(pixels),
                "noncontiguous or truncated original planes " + key)
        indices = pixels[start:mid]
        mask = pixels[mid:end]
        require(set(mask) <= {0, 1}, "invalid original mask " + key)
        resolved.append((key, row, indices, mask))
        cursor = end
    require(cursor == len(pixels), "unaccounted original indexed source payload")
    return streams, manifest, resolved


def stored_zip(entries: list[tuple[str, bytes]]) -> bytes:
    import io
    out = io.BytesIO()
    with zipfile.ZipFile(out, mode="w", compression=zipfile.ZIP_STORED,
                         allowZip64=True) as z:
        for name, data in entries:
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_STORED
            info.external_attr = 0o600 << 16
            z.writestr(info, data)
    return out.getvalue()


def build_export(p65_zip: bytes, keys: list[str] | None, *, canonical: bool = True) -> bytes:
    streams, _, rows = p65_data(p65_zip, canonical=canonical)
    wanted = None if keys is None else set(keys)
    require(wanted is None or (len(wanted) == len(keys) and len(wanted) > 0),
            "duplicate or empty requested descriptor keys")
    found = set()
    members: list[tuple[str, bytes]] = []
    output_rows = []
    for ordinal, (key, source, indices, mask) in enumerate(rows):
        if wanted is not None and key not in wanted:
            continue
        found.add(key)
        prefix = "frames/" + str(ordinal).zfill(4) + "/"
        rgba = gray_rgba_png(indices, mask, source["width"], source["height"])
        file_names = {
            "indices": prefix + "original-indices.bin",
            "mask": prefix + "original-paint-mask.bin",
            "preview": prefix + "diagnostic-index-rgba.png",
        }
        members.extend([
            (file_names["indices"], indices),
            (file_names["mask"], mask),
            (file_names["preview"], rgba),
        ])
        output_rows.append({
            "key": key,
            "originalDescriptorOrdinal": ordinal,
            "originalDescriptor": source,
            "files": file_names,
            "sha256": {"indices": digest(indices), "mask": digest(mask),
                       "preview": digest(rgba)},
            "previewInterpretation": "GRAYSCALE_NUMERIC_INDEX_NOT_NATIVE_PALETTE",
            "alphaInterpretation": "ORIGINAL_SOURCE_PAINT_MASK_NOT_RUNTIME_Z_ORDER",
        })
    require(wanted is None or wanted == found,
            "requested descriptor key missing from P65 source package")
    require(bool(output_rows), "no descriptors selected")
    index = {
        "format": "mk1_p88_indexed_descriptor_previews_v1",
        "originalExeSha256": streams["originalExeSha256"],
        "originalP65ZipSha256": digest(p65_zip),
        "originalO60IndexedBinarySha256": streams["originalIndexedBinarySha256"],
        "sourceDescriptorCount": len(rows),
        "exportedDescriptorCount": len(output_rows),
        "originalFrameOrderOrDurationVerified": False,
        "nativePaletteOwnershipVerified": False,
        "nativeStagePlacementOrZOrderVerified": False,
        "originalIndicesAndPaintMaskSidecarsExact": True,
        "previewsAreDiagnosticNotNativeGameplayRGB": True,
        "descriptors": output_rows,
    }
    readme = (
        "MK1 P88 ORIGINAL INDEX + PAINT MASK DESCRIPTOR PREVIEWS\n"
        "Every preview PNG has R=G=B=the original numeric index and alpha "
        "255 for source-painted pixels, 0 otherwise. Transparent RGB still "
        "retains its original numeric index. The two .bin sidecars are exact "
        "source planes, not transcoded artwork.\n"
        "NO source-authenticated runtime palette, native gameplay timing, "
        "frame traversal, part Z order or stage placement is claimed. "
        "See manifest.json for original descriptor offsets and identities.\n"
    ).encode("utf-8")
    return stored_zip([
        ("manifest.json", (json.dumps(index, indent=2, sort_keys=True) + "\n").encode()),
        ("README.txt", readme),
        *members,
    ])


def private_paths(source_arg: str, archive_arg: str, output_arg: str | None):
    source = Path(source_arg).resolve(strict=True)
    archive = Path(archive_arg).resolve(strict=True)
    require(source.is_dir() and archive.is_file(), "source directory/P87 archive missing")
    require(not source.is_relative_to(ROOT.resolve()) and
            not archive.is_relative_to(ROOT.resolve()) and
            not archive.is_relative_to(source),
            "commercial source and P87 archive must be outside Git and separate")
    output = None
    if output_arg is not None:
        requested = Path(output_arg)
        require(requested.suffix.lower() == ".zip" and requested.parent.is_dir(),
                "output must be a new ZIP in an existing private directory")
        output = requested.resolve(strict=False)
        require(not output.exists() and not output.is_relative_to(source) and
                not output.is_relative_to(ROOT.resolve()) and output != archive,
                "refusing overwrite or source/Git output path")
    return source, archive, output


def check_original_p87(source: Path, archive: Path) -> None:
    proc = subprocess.run(
        [sys.executable, str(ROOT / "scripts/mkext.py"), "verify",
         "--game", "mk1", "--source", str(source), "--archive", str(archive)],
        cwd=ROOT, capture_output=True, text=True, timeout=5400, check=False,
    )
    require(proc.returncode == 0, "independent P87 original-source verification failed: " +
            (proc.stderr or proc.stdout)[-3000:])
    result = json.loads(proc.stdout)
    require(result.get("pass") == "P87_CLI_MK1_VERIFY" and
            result.get("status") == "PASS" and
            result.get("sourcePackageByteIdentical") is True and
            result.get("independentOriginalP65Verifier", {}).get("status") == "PASS",
            "P87 original DOS byte oracle did not accept this P65 ZIP")


def main() -> int:
    parser = argparse.ArgumentParser(description="P88 original MK1 indexed descriptor previews")
    parser.add_argument("action", choices=("list", "export"))
    parser.add_argument("--source", required=True, help="Private canonical original MK1 installation")
    parser.add_argument("--archive", required=True, help="Already verified private P87/P65 source ZIP")
    parser.add_argument("--out", help="NEW private P88 preview ZIP; export only")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--all", action="store_true", help="Export all 1102 descriptors")
    group.add_argument("--key", action="append", help="Exact TABLE:watcomOffset key; repeatable")
    args = parser.parse_args()
    try:
        require((args.action == "export") == bool(args.out),
                "only export accepts --out")
        require(args.action != "export" or args.all or args.key,
                "export requires explicit --all or at least one --key")
        require(not (args.action == "list" and args.all), "--all is export-only")
        source, archive, out = private_paths(args.source, args.archive, args.out)
        check_original_p87(source, archive)
        raw = archive.read_bytes()
        _, _, rows = p65_data(raw)
        if args.action == "list":
            listing = [
                {"key": key, "width": row["width"], "height": row["height"],
                 "resourcePath": row["resourcePath"],
                 "descriptorWatcomOffset": row["descriptorWatcomOffset"]}
                for key, row, _, _ in rows
                if not args.key or key in args.key
            ]
            require(not args.key or set(args.key) == {v["key"] for v in listing},
                    "unknown requested descriptor key")
            print(json.dumps({"pass": "P88_MK1_LIST", "status": "PASS",
                              "descriptors": listing}, indent=2))
            return 0
        assert out is not None
        generated = build_export(raw, None if args.all else args.key)
        with out.open("xb") as stream:
            stream.write(generated)
        with zipfile.ZipFile(out) as z:
            count = json.loads(z.read("manifest.json"))["exportedDescriptorCount"]
        print(json.dumps({"pass": "P88_MK1_EXPORT", "status": "PASS",
                          "sourceP87ZipSha256": digest(raw),
                          "previewZipSha256": digest(generated),
                          "exportedDescriptors": count,
                          "privatePreviewZip": str(out),
                          "nativePaletteOrTimingClaimed": False}, indent=2))
        return 0
    except (OSError, ValueError, KeyError, IndexError, zipfile.BadZipFile,
            subprocess.TimeoutExpired, json.JSONDecodeError) as error:
        print("P88 MK1 PREVIEWS ERROR: " + str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
