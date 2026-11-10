#!/usr/bin/env python3
"""Independent real-Chrome P83 MK2 PNG readback against original DOS sources.

Calls the existing P82 independent EXE/GRA and entire 115-PNG pixel oracle,
then compares the actual Chrome-downloaded native floor and one source opacity
PNG *byte-for-byte* to the independently verified ZIP. No import of P83 browser
source, and no original commercial files are written or uploaded.
"""
from __future__ import annotations

import argparse
import io
import json
from pathlib import Path
import runpy
import zipfile

from PIL import Image

ROOT = Path(__file__).resolve().parent
P82 = runpy.run_path(str(ROOT / "verify-mk2-p82-native-stage-independent.py"))


def require(value: object, reason: str) -> None:
    if not value:
        raise ValueError("P83 original MK2 browser ZIP independent: " + reason)


def verify(folder: Path, archive: Path,
           downloads: list[tuple[Path, str]]) -> dict:
    p82 = P82["verify"](folder, archive)
    require(p82["pass"] == "P82_INDEPENDENT"
            and p82["status"] == "PASS"
            and p82["sourcePngFilesIndependentPixelParity"] == 115
            and p82["originalSourceIndexPositionsRechecked"] == 939425,
            "complete independent original DOS O132/P82 pixel oracle missing")
    require(len(downloads) == 3, "two floors and source sprite opacity downloads required")
    kinds = set()
    with zipfile.ZipFile(archive) as z:
        source_names = [name for name in z.namelist() if name.endswith(".png")]
        saved = {("MK2_P83_" + name.replace("/", "_")):name for name in source_names}
        require(len(saved) == 115, "P83 downloaded filename aliases colliding")
        full_bytes = 0
        pixels = 0
        for local_file, filename in downloads:
            require(filename in saved, "unrecognized P83 downloaded source file name")
            member = saved[filename]
            original_png = z.read(member)
            downloaded = local_file.read_bytes()
            require(downloaded == original_png, "Chrome downloaded PNG differs from verified source "+member)
            with Image.open(io.BytesIO(downloaded)) as im:
                require(im.format == "PNG", "downloaded layer is not a PNG")
                if member == "tomb/floor_indices.png":
                    require(im.size == (896,48) and im.mode == "L",
                            "Tomb source floor cropped/recolored")
                    kinds.add("tomb_floor")
                elif member == "portal/floor_indices.png":
                    require(im.size == (896,40) and im.mode == "L",
                            "Portal source floor cropped/recolored")
                    kinds.add("portal_floor")
                elif member.startswith("tomb/native_sprites/") and member.endswith("_opacity.png"):
                    require(im.mode == "L", "source sprite opacity plane missing")
                    kinds.add("sprite_opacity")
                else:
                    raise ValueError("unqualified P83 selected downloaded original source layer "+member)
                pixels += im.width * im.height
            full_bytes += len(downloaded)
    require(kinds == {"tomb_floor","portal_floor","sprite_opacity"},
            "missing required original browser floor/sprite downloads")
    return {
        "pass":"P83_BROWSER_INDEPENDENT","status":"PASS",
        "originalGame":"mk2",
        "originalP82IndependentSourceAndPngOraclePass":True,
        "originalP82IndependentPixelPositions":p82["originalSourceIndexPositionsRechecked"],
        "allP82SourcePngsReopened":p82["sourcePngFilesIndependentPixelParity"],
        "realChromeDownloadedPngsByteExact":len(downloads),
        "realChromeDownloadedSourcePngPositions":pixels,
        "realChromeDownloadedPngByteCount":full_bytes,
        "uncroppedSourceFloorsVerified":2,
        "sourceSpriteOpacityByteExact":True,
        "sourceExeGRAOriginalHashesMatched":4,
        "nativeRuntimePaletteCameraAnimationClaimed":False,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,allow_abbrev=False)
    ap.add_argument("--original-mk2",required=True,type=Path)
    ap.add_argument("--archive",required=True,type=Path)
    ap.add_argument("--download",action="append",nargs=2,
                    metavar=("FILE","BROWSER_FILENAME"),required=True)
    a=ap.parse_args()
    downloads=[(Path(path),name) for path,name in a.download]
    print(json.dumps(verify(a.original_mk2,a.archive,downloads),indent=2))


if __name__ == "__main__":
    main()
