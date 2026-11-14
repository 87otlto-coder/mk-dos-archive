#!/usr/bin/env python3
"""Independent P88 original index/mask and PNG acceptance.

Does not import P88's exporter, image writer or parser. Validates P87
against original DOS separately before checking every selected PNG, its
binary planes, source offsets and provenance. Synthetic tests may call
verify_bytes() directly with noncommercial dummy source packages.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path
import struct
import subprocess
import sys
import zipfile
import zlib

ROOT = Path(__file__).resolve().parents[1]
EXE_SHA = "750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14"
SIG = b"\x89PNG\r\n\x1a\n"


def check(ok, reason):
    if not ok:
        raise ValueError("P88 INDEPENDENT: " + reason)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def png_rgba(data):
    """Read RGB8+alpha PNG independently; reject unhandled PNG features."""
    check(data.startswith(SIG), "PNG signature")
    pos, ihdr, compressed, ended = 8, None, bytearray(), False
    while pos < len(data):
        check(pos + 12 <= len(data), "truncated PNG chunk")
        n = struct.unpack_from(">I", data, pos)[0]
        kind = data[pos + 4:pos + 8]
        check(n <= len(data) - pos - 12, "PNG chunk length")
        payload = data[pos + 8:pos + 8 + n]
        crc = struct.unpack_from(">I", data, pos + 8 + n)[0]
        check(zlib.crc32(kind + payload) & 0xffffffff == crc, "PNG CRC")
        pos += 12 + n
        if kind == b"IHDR":
            check(ihdr is None and len(payload) == 13, "PNG duplicate/invalid IHDR")
            width, height, depth, colour, compression, filtering, interlace = struct.unpack(">IIBBBBB", payload)
            check(depth == 8 and colour == 6 and
                  compression == filtering == interlace == 0 and
                  width > 0 and height > 0, "PNG format not diagnostic RGBA8")
            ihdr = (width, height)
        elif kind == b"IDAT":
            check(ihdr is not None, "PNG IDAT without header")
            compressed.extend(payload)
        elif kind == b"IEND":
            check(len(payload) == 0 and pos == len(data), "trailing PNG data")
            ended = True
            break
        else:
            check(False, "unexpected PNG chunk " + repr(kind))
    check(ihdr is not None and ended, "incomplete diagnostic PNG")
    width, height = ihdr
    decomp = zlib.decompressobj()
    maxsize = height * (1 + width * 4)
    raw = decomp.decompress(bytes(compressed), maxsize + 1)
    check(len(raw) == maxsize and decomp.eof and
          not decomp.unused_data and not decomp.unconsumed_tail,
          "PNG decompression length/trailing bytes")
    plane = bytearray()
    pos = 0
    for _ in range(height):
        check(raw[pos] == 0, "PNG unexpected row filter")
        pos += 1
        plane.extend(raw[pos:pos + width * 4])
        pos += width * 4
    return width, height, bytes(plane)


def members(z):
    names = z.namelist()
    check(len(names) == len(set(names)), "duplicate ZIP member")
    check(all(not n.startswith("/") and "\\" not in n and
              ".." not in n.split("/") for n in names), "unsafe ZIP member name")
    return set(names)


def verify_bytes(p65_zip: bytes, p88_zip: bytes, *, canonical=True):
    with zipfile.ZipFile(io.BytesIO(p65_zip)) as original:
        original_names = members(original)
        check(original_names == {
            "manifests/mk1_source_streams.json",
            "indexed/descriptor_manifest.json",
            "indexed/descriptor_pixels.bin",
            "README.txt",
        }, "original P65 ZIP structure")
        streams = json.loads(original.read("manifests/mk1_source_streams.json"))
        source_manifest = original.read("indexed/descriptor_manifest.json")
        desc = json.loads(source_manifest)
        pixels = original.read("indexed/descriptor_pixels.bin")
    check(streams.get("format") == "mk1_p65_lossless_anitab_source_streams_v1" and
          desc.get("format") == "mk1_animation_indexed_descriptor_payload_manifest_v1",
          "original P65/O60 format identity")
    check(sha(pixels) == streams.get("originalIndexedBinarySha256") and
          sha(source_manifest) == streams.get("originalIndexedManifestSha256"),
          "original descriptor/source hash")
    sources = desc["descriptors"]
    check(desc["descriptorCount"] == len(sources) and
          streams["indexedDescriptorCount"] == len(sources), "original source census")
    if canonical:
        check(streams.get("originalExeSha256") == EXE_SHA and
              len(sources) == 1102, "canonical source input")
    with zipfile.ZipFile(io.BytesIO(p88_zip)) as preview:
        names = members(preview)
        check("manifest.json" in names and "README.txt" in names, "missing P88 manifest")
        manifest = json.loads(preview.read("manifest.json"))
        check(manifest.get("format") == "mk1_p88_indexed_descriptor_previews_v1" and
              manifest.get("originalExeSha256") == streams["originalExeSha256"] and
              manifest.get("originalP65ZipSha256") == sha(p65_zip) and
              manifest.get("originalO60IndexedBinarySha256") == sha(pixels),
              "P88 original-source provenance")
        check(manifest.get("sourceDescriptorCount") == len(sources) and
              manifest.get("originalFrameOrderOrDurationVerified") is False and
              manifest.get("nativePaletteOwnershipVerified") is False and
              manifest.get("nativeStagePlacementOrZOrderVerified") is False and
              manifest.get("originalIndicesAndPaintMaskSidecarsExact") is True and
              manifest.get("previewsAreDiagnosticNotNativeGameplayRGB") is True,
              "unsupported native relationship or missing lossless claim")
        selected = manifest["descriptors"]
        check(isinstance(selected, list) and bool(selected) and
              len(selected) == manifest["exportedDescriptorCount"],
              "selected descriptor count")
        expected_names = {"manifest.json", "README.txt"}
        previous = -1
        total = 0
        for item in selected:
            ordinal = item["originalDescriptorOrdinal"]
            check(type(ordinal) is int and previous < ordinal < len(sources),
                  "descriptor source order or duplicate")
            previous = ordinal
            row = sources[ordinal]
            key = str(row["tableSymbol"]) + ":" + str(row["descriptorWatcomOffset"])
            check(item["key"] == key and item["originalDescriptor"] == row and
                  item["previewInterpretation"] == "GRAYSCALE_NUMERIC_INDEX_NOT_NATIVE_PALETTE" and
                  item["alphaInterpretation"] == "ORIGINAL_SOURCE_PAINT_MASK_NOT_RUNTIME_Z_ORDER",
                  "original descriptor mapping or invented interpretation")
            count = row["width"] * row["height"]
            first, middle = row["indicesOffset"], row["maskOffset"]
            check(row["pixelCount"] == count and
                  middle == first + count and middle + count <= len(pixels),
                  "invalid source index/mask offsets")
            raw_indices = pixels[first:middle]
            raw_mask = pixels[middle:middle + count]
            check(set(raw_mask) <= {0, 1}, "original mask not binary")
            fs = item["files"]
            prefix = "frames/" + str(ordinal).zfill(4) + "/"
            required_paths = {
                "indices": prefix + "original-indices.bin",
                "mask": prefix + "original-paint-mask.bin",
                "preview": prefix + "diagnostic-index-rgba.png",
            }
            check(fs == required_paths and
                  set(item["sha256"]) == {"indices", "mask", "preview"},
                  "source plane member paths/sha schema")
            for kind, source_bytes in (("indices", raw_indices), ("mask", raw_mask)):
                actual = preview.read(fs[kind])
                check(actual == source_bytes and sha(actual) == item["sha256"][kind],
                      "original " + kind + " plane mismatch " + key)
                expected_names.add(fs[kind])
            png_data = preview.read(fs["preview"])
            check(sha(png_data) == item["sha256"]["preview"], "PNG digest mismatch")
            w, h, rgba = png_rgba(png_data)
            check((w, h) == (row["width"], row["height"]), "PNG geometry mismatch")
            check(len(rgba) == 4 * count, "PNG pixel count")
            for i, (value, opaque) in enumerate(zip(raw_indices, raw_mask)):
                if rgba[i * 4:i * 4 + 4] != bytes((value, value, value, opaque * 255)):
                    raise ValueError("P88 INDEPENDENT: source index/RGBA difference " + key +
                                     " position " + str(i))
            expected_names.add(fs["preview"])
            total += count
        check(names == expected_names, "missing or unaccounted P88 ZIP members")
        return {
            "pass": "P88_INDEPENDENT",
            "status": "PASS",
            "exportedDescriptors": len(selected),
            "sourceIndexedPixelPositionsChecked": total,
            "originalSourcePackageSha256": sha(p65_zip),
            "previewPackageSha256": sha(p88_zip),
            "originalIndexAndMaskAndPreviewPixelParity": True,
            "nativePaletteOrTimingClaimed": False,
        }


def main():
    parser = argparse.ArgumentParser(description="P88 independent original-source and PNG oracle")
    parser.add_argument("--source", required=True, help="Canonical private original MK1 directory")
    parser.add_argument("--archive", required=True, help="Private P87/P65 ZIP")
    parser.add_argument("--preview", required=True, help="Private P88 PNG ZIP")
    args = parser.parse_args()
    try:
        root = ROOT.resolve()
        source = Path(args.source).resolve(strict=True)
        archive = Path(args.archive).resolve(strict=True)
        preview = Path(args.preview).resolve(strict=True)
        check(source.is_dir() and archive.is_file() and preview.is_file(),
              "missing original source/ZIP")
        check(not source.is_relative_to(root) and
              not archive.is_relative_to(root) and not preview.is_relative_to(root) and
              not archive.is_relative_to(source) and not preview.is_relative_to(source) and
              preview != archive, "original/private files must be outside Git/source")
        prior = subprocess.run(
            [sys.executable, str(ROOT / "scripts/mkext.py"), "verify",
             "--game", "mk1", "--source", str(source), "--archive", str(archive)],
            cwd=ROOT, capture_output=True, text=True, timeout=5400, check=False,
        )
        check(prior.returncode == 0, "P87 independent original byte oracle failed: " +
              (prior.stderr or prior.stdout)[-3000:])
        accepted = json.loads(prior.stdout)
        check(accepted.get("pass") == "P87_CLI_MK1_VERIFY" and
              accepted.get("status") == "PASS" and
              accepted.get("independentOriginalP65Verifier", {}).get("status") == "PASS",
              "P87 original fixture acceptance contract")
        print(json.dumps(verify_bytes(archive.read_bytes(), preview.read_bytes()),
                         indent=2))
        return 0
    except (OSError, ValueError, KeyError, IndexError, struct.error,
            zipfile.BadZipFile, zlib.error, json.JSONDecodeError,
            subprocess.TimeoutExpired) as error:
        print("P88 INDEPENDENT ERROR: " + str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
