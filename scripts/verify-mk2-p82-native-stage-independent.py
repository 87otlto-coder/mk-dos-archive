#!/usr/bin/env python3
"""P82 independent original MK2 Tomb/Portal source-layer ZIP verifier.

Re-decodes floor index planes, packed sprite streams and setup-local mosaics
directly from canonical original EXE/GRA bytes. Does not import P82 or O132
exporter code. Reopens every image PNG and compares original index, opacity
and qualified fixed EXE-palette RGB pixels; no game timing/camera claims.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path
import struct
import zipfile

from PIL import Image

SHA = {
    "MK2.EXE": "fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65",
    "TOMB.GRA": "be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613",
    "PORTAL.GRA": "cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82",
    "IMAGES.GRA": "2b26796a64c2aebfee75832696aeae9bbcf9df56d82cb9a39df58a557d3ad8cf",
}
STAGES = {"tomb": ("TOMB.GRA", 63776, 48, 16, 6, 0x893c6),
          "portal": ("PORTAL.GRA", 56916, 40, 13, 2, 0x891e0)}
FORMAT = "mkdos_p82_mk2_uncropped_source_layer_pack_v1"


def check(ok: object, reason: str) -> None:
    if not ok:
        raise ValueError("P82 independent original MK2: " + reason)


def sha(blob: bytes) -> str:
    return hashlib.sha256(blob).hexdigest()


def originals(folder: Path) -> dict[str, bytes]:
    check(folder.is_dir(), "original MK2 installation directory missing")
    out = {}
    entries = list(folder.iterdir())
    for name, expected in SHA.items():
        matches = [p for p in entries if p.is_file() and p.name.upper() == name]
        check(len(matches) == 1, "missing/duplicated original " + name)
        value = matches[0].read_bytes()
        check(sha(value) == expected, name + " original source fingerprint mismatch")
        out[name] = value
    return out


def native_palette(exe: bytes, at: int) -> dict[int, tuple[int, int, int]]:
    check(struct.unpack_from("<H", exe, at)[0] == 80,
          "original 80-index source EXE palette header changed")
    colors = {}
    for index in range(1, 81):
        word = struct.unpack_from("<H", exe, at + 2 * index)[0]
        dac = (((word >> 9) & 63) | 1, ((word >> 4) & 63) | 1,
               ((word << 1) & 63) | 1)
        colors[index] = tuple((x << 2) | (x >> 4) for x in dac)
    return colors


def original_indexed_sprite(resource: bytes, offset: int,
                            width: int, height: int) -> tuple[bytes, bytes, int]:
    check(width > 0 and height > 0 and width * height <= 2_000_000,
          "invalid native original stream extent")
    idx = bytearray(width * height)
    mask = bytearray(width * height)
    p = offset
    for y in range(height):
        x = 0
        while x < width:
            check(0 <= p <= len(resource) - 4, "truncated source sprite word")
            op = struct.unpack_from("<I", resource, p)[0]
            p += 4
            if op & 1:
                run = op >> 1   # transparent native source run
            elif op & 2:
                run = op >> 10
                val = (op >> 2) & 255
                check(0 < run <= width - x, "source repeat run crosses row")
                for t in range(run):
                    idx[y * width + x + t] = val
                    mask[y * width + x + t] = 255
            else:
                run = op >> 2
                check(0 < run <= 64 and p + ((run + 3) // 4) * 4 <= len(resource),
                      "invalid source literal word extent or padding")
                for t in range(run):
                    idx[y * width + x + t] = resource[p + t]
                    mask[y * width + x + t] = 255
                p += ((run + 3) // 4) * 4
            check(0 < run <= width - x, "original packed sprite row overrun")
            x += run
    return bytes(idx), bytes(mask), p


def original_rgba(indices: bytes, opacity: bytes,
                  colors: dict[int, tuple[int, int, int]]) -> bytes:
    check(len(indices) == len(opacity), "index/opacity mismatch")
    rgba = bytearray(len(indices) * 4)
    for i, (idx, alpha) in enumerate(zip(indices, opacity)):
        if not alpha:
            continue
        check(alpha == 255 and idx in colors, "unqualified original source color")
        rgba[4 * i:4 * i + 4] = bytes((*colors[idx], 255))
    return bytes(rgba)


def compare_png(z: zipfile.ZipFile, name: str, mode: str,
                size: tuple[int, int], expected: bytes) -> None:
    with Image.open(io.BytesIO(z.read(name))) as image:
        check(image.format == "PNG" and image.mode == mode and image.size == size,
              "wrong source PNG format, mode or native dimensions: " + name)
        check(image.tobytes() == expected,
              "original source pixel/index/opacity mismatch: " + name)


def verify(folder: Path, package: Path) -> dict:
    source = originals(folder)
    with zipfile.ZipFile(package) as z:
        check(z.testzip() is None, "ZIP CRC mismatch")
        members = z.namelist()
        check(len(members) == len(set(members)), "duplicate ZIP member names")
        check(all(n and not n.startswith("/") and "\\" not in n
                  and all(s not in ("", ".", "..") for s in n.split("/"))
                  for n in members), "unsafe ZIP member")
        check("O132_SCENE_LAYERS.json" in members
              and "P82_EXPORT_PROVENANCE.json" in members,
              "original source and wrapper provenance manifests missing")
        report = json.loads(z.read("O132_SCENE_LAYERS.json"))
        wrapper = json.loads(z.read("P82_EXPORT_PROVENANCE.json"))
        check(report.get("schema") == "mk2_o132_native_source_layer_pack_v1"
              and report.get("status") == "STATIC_CAMERA_INDEPENDENT_LAYER_EXPORT",
              "noncanonical original layer source pack")
        check(wrapper.get("format") == FORMAT,
              "unexpected P82 source provenance format")
        check(wrapper.get("originalInputSha256") == dict(sorted(SHA.items())),
              "P82 original game source SHA set mismatch")
        check(report.get("sourceExecutableSHA256") == SHA["MK2.EXE"],
              "manifest original EXE not canonical")
        stage_names = [s.get("stage") for s in report["stages"]]
        check(stage_names in (["tomb"], ["portal"], ["tomb", "portal"])
              and wrapper["stageNames"] == stage_names,
              "original stage count/ordering changed")
        check(report["motion"]["parallaxMotionRulesRecovered"] is False
              and report["motion"]["animationFrameOrderingRecovered"] is False
              and report["motion"]["animationDurationsRecovered"] is False
              and report["compositing"]["finalDrawOrderRecovered"] is False
              and report["compositing"]["liveCameraPositionRecovered"] is False
              and wrapper["nativeCameraOrFinalStageCompositingProven"] is False
              and wrapper["originalAnimationOrParallaxTimingProven"] is False,
              "false native parallax/camera/animation claim")

        declared = report["files"]
        compare = {row["path"]: row for row in declared}
        check(len(compare) == len(declared)
              and set(compare) == set(members) - {
                  "O132_SCENE_LAYERS.json", "P82_EXPORT_PROVENANCE.json"},
              "original source PNG manifest/member census differs")
        for name, row in compare.items():
            data = z.read(name)
            check(name.endswith(".png")
                  and row["bytes"] == len(data) and row["sha256"] == sha(data),
                  "source PNG manifest digest wrong: " + name)

        native_sprite_count = 0
        setup_count = 0
        pixel_positions = 0
        for stage in report["stages"]:
            key = stage["stage"]
            resource_name, offset, rows, count, setups, pal_at = STAGES[key]
            raw = source[resource_name]
            check(offset + 896 * rows == len(raw), "native packed floor extent mismatch")
            floor = stage["packedFloor"]
            check(floor["nativeDimensions"] == [896, rows]
                  and floor["sourceOffset"] == offset
                  and floor["cameraCropApplied"] is False,
                  "original floor crop/camera claim")
            check(len(stage["nativeSpriteDescriptors"]) == count
                  and len(stage["setupLocalLayers"]) == setups,
                  "original sprite/setup source count mismatch")
            colors = native_palette(source["MK2.EXE"], pal_at)
            indices = raw[offset:]
            alpha = b"\xff" * len(indices)
            rgba = original_rgba(indices, alpha, colors)
            for label, mode, expected in (
                ("indices", "L", indices),
                ("rgba", "RGBA", rgba),
            ):
                compare_png(z, key + "/floor_" + label + ".png", mode,
                            (896, rows), expected)
            check(floor["sourceIndexSHA256"] == sha(indices)
                  and floor["rgbaSHA256"] == sha(rgba),
                  "source floor full-width plane hashes mismatch")
            pixel_positions += len(indices)

            decoded = {}
            occurrences = {}
            for entry in stage["nativeSpriteDescriptors"]:
                aid = entry["assetId"]
                w, h = entry["dimensions"]
                p = entry["sourcePackedOffset"]
                check(p < offset and entry["unalteredNativeSpriteBounds"] is True
                      and entry["originalGameAnimationMembershipKnown"] is False,
                      "sprite extent/animation unqualified")
                image, opacity, end = original_indexed_sprite(raw, p, w, h)
                check(end == entry["sourcePackedEndExclusive"],
                      "source sprite compressed stream end mismatch")
                rgb = original_rgba(image, opacity, colors)
                path = key + "/native_sprites/" + aid
                for kind, mode, pixels in (
                    ("indices", "L", image),
                    ("opacity", "L", opacity),
                    ("rgba", "RGBA", rgb),
                ):
                    compare_png(z, path + "_" + kind + ".png", mode,
                                (w, h), pixels)
                check(entry["sourceIndexSHA256"] == sha(image)
                      and entry["opacitySHA256"] == sha(opacity)
                      and entry["rgbaSHA256"] == sha(rgb),
                      "source sprite indexed/opacity/RGB hashes mismatch")
                decoded[aid] = (w, h, image, opacity)
                native_sprite_count += 1
                pixel_positions += w * h
                for use in entry["setupLocalOccurrences"]:
                    k = use["setupObject2Offset"]
                    occurrences.setdefault(k, []).append((
                        use["controlIndex"], aid,
                        use["setupLocalX"], use["setupLocalY"]))

            for item in stage["setupLocalLayers"]:
                aid = item["assetId"]
                width, height = item["dimensions"]
                setup_id = item["setupObject2Offset"]
                check(item["sourceCoordinateSystem"] == "SETUP_LOCAL_NOT_SCENE_WORLD"
                      and item["registeredStageWorldPosition"] is None
                      and item["parallaxMovementRecovered"] is False
                      and item["animationFramesRecovered"] is False,
                      "unknown stage world placement or timing asserted")
                work_index = bytearray(width * height)
                work_alpha = bytearray(width * height)
                uses = sorted(occurrences.get(setup_id, []), key=lambda use: use[0])
                check(len(uses) == item["spriteControls"]
                      and len({use[0] for use in uses}) == len(uses),
                      "setup original stream/control order incomplete")
                for _, key_id, dx, dy in uses:
                    sw, sh, sprite_idx, sprite_mask = decoded[key_id]
                    for pix, visible in enumerate(sprite_mask):
                        if not visible:
                            continue
                        x = dx + pix % sw
                        y = dy + pix // sw
                        if 0 <= x < width and 0 <= y < height:
                            dest = y * width + x
                            work_index[dest] = sprite_idx[pix]
                            work_alpha[dest] = 255
                orig_idx, orig_alpha = bytes(work_index), bytes(work_alpha)
                orig_rgba = original_rgba(orig_idx, orig_alpha, colors)
                path = key + "/setups/" + aid
                for kind, mode, pixels in (
                    ("indices", "L", orig_idx),
                    ("opacity", "L", orig_alpha),
                    ("rgba", "RGBA", orig_rgba),
                ):
                    compare_png(z, path + "_" + kind + ".png", mode,
                                (width, height), pixels)
                check(item["sourceIndexSHA256"] == sha(orig_idx)
                      and item["opacitySHA256"] == sha(orig_alpha)
                      and item["rgbaSHA256"] == sha(orig_rgba),
                      "setup original indexed/opacity/RGB hash mismatch")
                setup_count += 1
                pixel_positions += width * height

        expected_pngs = 2 * len(stage_names) + 3 * (native_sprite_count + setup_count)
        check(len(declared) == expected_pngs
              and len(members) == expected_pngs + 2,
              "source layer ZIP exact PNG count changed")
        check(wrapper["summary"]["sourcePngFiles"] == expected_pngs
              and wrapper["summary"]["originalNativeSpriteCount"] == native_sprite_count
              and wrapper["summary"]["originalSetupLocalLayerCount"] == setup_count
              and wrapper["allOriginalCommercialGameFilesExcludedFromExport"] is True,
              "P82 source provenance summary wrong")
    return {
        "pass": "P82_INDEPENDENT", "status": "PASS",
        "originalGame": "mk2", "originalStages": stage_names,
        "sourceNativeFloors": len(stage_names),
        "sourceNativeSprites": native_sprite_count,
        "sourceSetupLocalLayers": setup_count,
        "sourcePngFilesIndependentPixelParity": expected_pngs,
        "originalSourceIndexPositionsRechecked": pixel_positions,
        "originalFileSourceFingerprintsVerified": 4,
        "nativeCameraOrStageCompositeClaimed": False,
        "nativeAnimationOrParallaxTimingClaimed": False,
        "originalSourcesIncludedInZip": False,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    ap.add_argument("--original-mk2", type=Path, required=True)
    ap.add_argument("--archive", type=Path, required=True)
    args = ap.parse_args()
    print(json.dumps(verify(args.original_mk2, args.archive), indent=2))


if __name__ == "__main__":
    main()
