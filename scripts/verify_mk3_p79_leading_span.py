"""Independent original source, complete archive partition and PNG readback for P79."""
import argparse
import hashlib
import io
import json
import zipfile
from pathlib import Path

from PIL import Image
from mk3_p73_noniff_palette_candidates import DATA_SHA256, read_original_data


def require(condition, why):
    if not condition:
        raise ValueError(why)


def verify(source, output):
    data = read_original_data(source)
    digest = lambda value: hashlib.sha256(value).hexdigest()
    require(digest(data) == DATA_SHA256, "Unknown original")
    start, end = 667866, 2508500
    require(data[end:end + 4] == b"FORM", "Missing next FORM")
    with zipfile.ZipFile(output) as z:
        manifest = json.loads(z.read("manifest.json"))
        require((manifest["spanOffset"], manifest["spanLength"], manifest["sourceSha256"],
                 manifest["width"], manifest["height"], manifest["continuationCount"]) ==
                (start, end-start, DATA_SHA256, 320, 200, 216), "Wrong manifest identity")
        require(all(manifest[k] is False for k in ("nativePaletteVerified",
                    "continuationRenderingVerified", "stageMembershipVerified")), "Unsupported claim")
        names = ["header.bin", "adjacent-rgb8.bin", "base-header.bin", "base-indices.bin"]
        lengths = [6, 768, 8, 64000]
        parts = manifest["sourceParts"]
        require(len(parts) == 220, "Wrong part count")
        cursor = start
        for i, part in enumerate(parts):
            if i >= 4:
                names.append(f"records/{i-4:03d}.bin")
                fields = [int.from_bytes(data[cursor+j:cursor+j+4], "little") for j in (2, 6, 10)]
                require(data[cursor:cursor+2] == bytes([3, 0]) and
                        [part["fieldA"], part["fieldB"], part["payloadLength"]] == fields and
                        part["payloadOffset"] == cursor + 14, "Wrong record header")
                lengths.append(14 + fields[-1])
            name, size = names[i], lengths[i]
            actual = z.read(name)
            require(part["path"] == name and part["offset"] == cursor and part["length"] == size and
                    part["sha256"] == digest(actual) and actual == data[cursor:cursor+size],
                    "Source mismatch: " + name)
            cursor += size
        require(cursor == end, "Incomplete interval")
        plane = data[start+782:start+64782]
        palette = data[start+6:start+774]
        for name, comparison in [("index-preview.png", False), ("adjacent-rgb8-comparison.png", True)]:
            names.append(name)
            with Image.open(io.BytesIO(z.read(name))) as image:
                require(image.format == "PNG" and image.size == (320, 200), "Wrong preview")
                lookup = [((palette[3*i:3*i+3] if comparison else bytes([32+round(i*223/255)])*3)
                           + bytes([255])) for i in range(256)]
                require(image.convert("RGBA").tobytes() == b"".join(lookup[i] for i in plane),
                        "PNG pixel mismatch")
        require(sorted(z.namelist()) == sorted(names + ["manifest.json"]), "Unexpected ZIP members")
    return dict(passName="P79_ORIGINAL", status="PASS", sourceParts=220, records=216,
                storedPayloadBytes=sum(lengths[4:])-216*14, intervalBytes=end-start,
                baseIndexedPositions=len(plane), pngPixelsCompared=2*len(plane), zipMembers=223)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("archive", type=Path)
    args = parser.parse_args()
    print(json.dumps(verify(args.source, args.archive)))
