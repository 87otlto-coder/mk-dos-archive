"""Audit the P59 ZIP with original EXE descriptors and the independent O122 decoder."""
import argparse
import hashlib
import json
import sys
from pathlib import Path
from zipfile import ZipFile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools/mk2_native_stage_palettes"))
from verify_o123_architecture_independent import (
    GRA_HASHES, HOLD, SKY_HOLD, SCREEN_SHA, independent_layer,
)
from verify_o122_independent import independently_decode
from trace_o121_control_bindings import build
from PIL import Image


def check(ok, message):
    if not ok:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def audit(game_dir, archive, screenshot=None):
    def original(name):
        matches = [p for p in game_dir.rglob("*") if p.is_file() and p.name.upper() == name]
        check(len(matches) == 1, "expected one original " + name)
        return matches[0].read_bytes()

    files = {name: original(name) for name in GRA_HASHES}
    for name, expected in GRA_HASHES.items():
        check(digest(files[name]) == expected, name)
    exe = original("MK2.EXE")
    family = next(f for f in build(exe, files)["families"] if f["familyLabel"] == "tomb80")
    shot = None
    if screenshot:
        check(digest(screenshot.read_bytes()) == SCREEN_SHA, "screenshot identity")
        shot = Image.open(screenshot).convert("RGB")
        check(shot.size == (637, 397), "screenshot geometry")
    with ZipFile(archive) as bundle:
        expected_files = {"manifest.json"} | {
            layer + suffix for layer in ("architecture", "sky")
            for suffix in (".png", ".indices.bin", ".mask.bin")
        }
        check(sorted(bundle.namelist()) == sorted(expected_files), "archive membership")
        manifest = json.loads(bundle.read("manifest.json"))
        check(manifest["screenshotSha256"] == SCREEN_SHA, "witness identity")
        check(manifest["format"] == "mk2-p59-tomb-heldout-v1", "manifest format")
        check(manifest["exeSha256"] == digest(exe) and manifest["tombSha256"] == GRA_HASHES["TOMB.GRA"], "source identity")
        check([r["name"] for r in manifest["layers"]] == ["architecture", "sky"], "manifest layers")
        for label, setup_id, regions, dx, dy, expected in [
            ("architecture", 0x1737c, HOLD, 267, 57, 2650),
            ("sky", 0x173b2, SKY_HOLD, 2, -47, 823),
        ]:
            layer, width, height = independent_layer(exe, files, setup_id)
            setup = next(s for s in family["setups"] if s["setupObject2Offset"] == setup_id)
            record = next(r for r in manifest["layers"] if r["name"] == label)
            check((record["dx"], record["dy"], record["count"]) == (dx, dy, expected), "capture registration")
            check(record["regions"] == [list(region) for region in regions], "holdout regions")
            check((record["setup"], record["width"], record["height"]) == (setup_id, width, height), "source setup")
            check(record["sourceAssetId"] == f"mk2-stage-setup:tomb:object2_{setup_id:X}", "source asset")
            check(record["rgba"] == digest(layer), "source RGBA digest")
            source_indices = bytearray(width * height)
            for row in setup["rows"]:
                w = row["spriteWidth"]
                _, indices, painted, _ = independently_decode(files["TOMB.GRA"], row["packedResourceOffset"], w, row["spriteHeight"])
                for j, visible in enumerate(painted):
                    x, y = row["signedX"] + j % w, row["signedY"] + j // w
                    if visible and 0 <= x < width and 0 <= y < height:
                        source_indices[y * width + x] = indices[j]
            check(record["indices"] == digest(source_indices), "source index digest")
            check(record["mask"] == digest(bytes(bool(alpha) for alpha in layer[3::4])), "source mask digest")
            mask = bytearray(319 * 199)
            indices = bytearray(len(mask))
            rgba = bytearray(len(mask) * 4)
            for y in range(199):
                for x in range(319):
                    if not any(l <= 2*x < r and t <= 2*y < b for l, r, t, b in regions):
                        continue
                    sx, sy = x + dx, y + dy
                    if not (0 <= sx < width and 0 <= sy < height):
                        continue
                    src, dst = sy * width + sx, y * 319 + x
                    pixel = layer[4*src:4*src+4]
                    if pixel[3]:
                        mask[dst], indices[dst] = 1, source_indices[src]
                        rgba[4*dst:4*dst+4] = pixel
                        if shot:
                            check(shot.getpixel((2*x, 2*y)) == tuple(pixel[:3]), "screenshot RGB")
            check(sum(mask) == expected, "wrong sample count")
            check(bundle.read(label + ".indices.bin") == indices, "source indices")
            check(bundle.read(label + ".mask.bin") == mask, "sample mask")
            with bundle.open(label + ".png") as stream:
                png = Image.open(stream)
                check(png.size == (319, 199) and png.mode == "RGBA" and png.tobytes() == rgba, "PNG pixels")
            print(label, expected, "samples PASS")
    print("Original screenshot compared:", bool(shot))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("game_dir", type=Path)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--screenshot", type=Path)
    args = parser.parse_args()
    audit(args.game_dir, args.archive, args.screenshot)
