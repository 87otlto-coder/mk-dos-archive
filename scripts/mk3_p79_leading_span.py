"""Extract the original MK3 leading non-IFF base image and bounded source records."""
import argparse
import json
import struct
import tempfile
import zipfile
from pathlib import Path

from mk3_p73_noniff_palette_candidates import DATA_SHA256, iff_forms_and_gaps, read_original_data, sha
from mk3_p74_noniff_indexed_graphics import png_rgba, rgba_from_planes


def parse_span(span, offset):
    if len(span) < 782:
        raise ValueError("Truncated base image header")
    count, width, height = struct.unpack_from("<HHH", span)
    reserved, size = struct.unpack_from("<II", span, 774)
    if reserved or not min(count, width, height) or size != width * height or size > 64000:
        raise ValueError("Unsupported base image layout")
    cursor = 782 + size
    if cursor > len(span):
        raise ValueError("Truncated base index plane")
    entries = []

    def source_entry(path, start, end):
        data = span[start:end]
        entries.append((path, data))
        return dict(path=path, offset=offset + start, length=len(data), sha256=sha(data))

    # These members, in source order, reconstruct the entire interval.
    parts = [
        source_entry("header.bin", 0, 6),
        source_entry("adjacent-rgb8.bin", 6, 774),
        source_entry("base-header.bin", 774, 782),
        source_entry("base-indices.bin", 782, cursor),
    ]
    for ordinal in range(count):
        if cursor + 14 > len(span):
            raise ValueError("Truncated continuation header")
        tag, field_a, field_b, length = struct.unpack_from("<HIII", span, cursor)
        end = cursor + 14 + length
        if tag != 3 or end > len(span) or (length == 0 and (field_a or field_b)):
            raise ValueError("Invalid continuation tag or extent")
        part = source_entry(f"records/{ordinal:03d}.bin", cursor, end)
        part.update(fieldA=field_a, fieldB=field_b, payloadOffset=offset + cursor + 14,
                    payloadLength=length)
        parts.append(part)
        cursor = end
    if cursor != len(span):
        raise ValueError("Unaccounted trailing bytes")
    for name, palette in [("index-preview.png", None), ("adjacent-rgb8-comparison.png", span[6:774])]:
        rgba = rgba_from_planes(span[782:782 + size], bytes([1]) * size, palette)
        entries.append((name, png_rgba(width, height, rgba)))
    manifest = dict(format="mk3_p79_leading_span_v1", spanOffset=offset, spanLength=len(span),
                    width=width, height=height, continuationCount=count, sourceParts=parts,
                    previewOpacity="opaque visualization", nativePaletteVerified=False,
                    continuationRenderingVerified=False, stageMembershipVerified=False)
    return manifest, entries


def export(source, output):
    data = read_original_data(source)
    if sha(data) != DATA_SHA256:
        raise ValueError("Unknown DATA.MK3 fingerprint")
    forms, gaps = iff_forms_and_gaps(data)
    if len(forms) != 416 or len(gaps) != 20 or gaps[0] != dict(offset=667866, length=1840634):
        raise ValueError("Original interval partition mismatch")
    start = gaps[0]["offset"]
    manifest, entries = parse_span(data[start:start + gaps[0]["length"]], start)
    manifest["sourceSha256"] = DATA_SHA256
    # Build privately before publishing. Exclusive linking refuses existing outputs.
    with tempfile.TemporaryDirectory(dir=output.parent) as directory:
        tmp = Path(directory) / "export.zip"
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as archive:
            for name, payload in entries:
                archive.writestr(name, payload)
            archive.writestr("manifest.json", json.dumps(manifest, indent=2))
        output.hardlink_to(tmp)
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path, help="New private ZIP on a hard-link capable filesystem")
    args = parser.parse_args()
    result = export(args.source, args.output)
    print(json.dumps(dict(passName="P79_EXPORT", status="PASS", records=result["continuationCount"],
                          basePixels=result["width"] * result["height"])))
