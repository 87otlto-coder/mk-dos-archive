#!/usr/bin/env python3
"""P89 R1: find canonical MK3 P79 raw payload signatures in private memory dumps.

A signature match only witnesses raw source bytes being in a captured memory
buffer. It does NOT identify a decompressor or prove any indexed image.
No original payload bytes/images are emitted. Reports are private metadata.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct
import sys

from r1_payload_discriminators import ROOT, START, END, source_file

SIGNATURE_SIZE = 48
MAX_CAPTURE_BYTES = 64 * 1024 * 1024
DEFAULT_ORDINALS = (0, 23, 66, 68, 126, 215)


def require(value: object, reason: str) -> None:
    if not value:
        raise ValueError("P89 R1 witness: " + reason)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def source_records(source: bytes) -> list[dict]:
    require(len(source) == 9015508, "original file size mismatch")
    span = source[START:END]
    count, width, height = struct.unpack_from("<HHH", span)
    reserved, size = struct.unpack_from("<II", span, 774)
    require((count, width, height, reserved, size) == (216, 320, 200, 0, 64000),
            "unexpected canonical P79 layout")
    cursor = 782 + size
    records: list[dict] = []
    for ordinal in range(count):
        require(cursor + 14 <= len(span), "truncated record header")
        tag, field_a, field_b, length = struct.unpack_from("<HIII", span, cursor)
        begin, finish = cursor+14, cursor+14+length
        require(tag == 3 and finish <= len(span) and
                (length != 0 or (field_a, field_b) == (0, 0)),
                "invalid original record extent/header")
        records.append({
            "ordinal": ordinal, "payloadAbsoluteOffset": START+begin,
            "payload": span[begin:finish],
        })
        cursor = finish
    require(cursor == len(span) and
            [r["ordinal"] for r in records if not r["payload"]] == list(range(120, 126)),
            "original P79 record partition changed")
    return records


def select_anchor(original_file: bytes, payload: bytes, payload_absolute_offset: int,
                  *, size: int = SIGNATURE_SIZE) -> dict:
    require(16 <= size <= 128 and len(payload) >= size,
            "payload too short to select meaningful anchor")
    # Fixed source-relative, deterministic stride. First valid 48 bytes are
    # adequately varied, not an all-zero/padding/identical-frame window,
    # and occur exactly once in the *entire* original DATA.MK3.
    for start in range(0, len(payload)-size+1, 8):
        candidate = payload[start:start+size]
        if len(set(candidate)) < 11 or candidate.count(0) > size//8:
            continue
        if original_file.count(candidate) == 1:
            return {
                "sourceOriginalByteOffset": payload_absolute_offset+start,
                "relativePayloadOffset": start,
                "signatureBytes": size,
                "signatureSha256": sha(candidate),
            }
    raise ValueError("P89 R1 witness: no independently unique source signature")


def locate(capture: bytes, signature: bytes, *, max_locations: int = 100) -> list[int]:
    require(16 <= len(signature) <= 128, "invalid signature length")
    matches: list[int] = []
    cursor = 0
    while True:
        found = capture.find(signature, cursor)
        if found < 0:
            break
        matches.append(found)
        require(len(matches) <= max_locations, "ambiguous repeated capture signatures")
        cursor = found+1
    return matches


def analyze(original_file: bytes, capture: bytes | None = None,
            ordinals: tuple[int, ...] = DEFAULT_ORDINALS) -> dict:
    records = source_records(original_file)
    require(bool(ordinals) and len(ordinals) == len(set(ordinals))
            and all(type(i) is int and 0 <= i < len(records) for i in ordinals),
            "invalid or duplicate record selection")
    if capture is not None:
        require(len(capture) <= MAX_CAPTURE_BYTES, "private capture exceeds 64MiB limit")
        require(sha(capture) != sha(original_file), "original DATA.MK3 is not an emulator memory capture")
    anchors = []
    for ordinal in ordinals:
        row = records[ordinal]
        require(bool(row["payload"]), "no signature for empty source record")
        marker = select_anchor(original_file, row["payload"], row["payloadAbsoluteOffset"])
        signature = row["payload"][marker["relativePayloadOffset"]:
                                   marker["relativePayloadOffset"]+marker["signatureBytes"]]
        locations = locate(capture, signature) if capture is not None else []
        anchors.append({
            "ordinal": ordinal,
            "payloadSourceByteOffset": row["payloadAbsoluteOffset"],
            "payloadSourceBytes": len(row["payload"]),
            **marker,
            "captureMatchOffsets": locations,
            "captureOccurrences": len(locations),
        })
    return {
        "format": "mk3_p89_r1_original_raw_input_memory_witness_v1",
        "sourceDataSha256": sha(original_file),
        "captureSha256": sha(capture) if capture is not None else None,
        "captureByteCount": len(capture) if capture is not None else None,
        "status": ("SOURCE_ANCHORS_ONLY" if capture is None else
                   "RAW_INPUT_BUFFER_WITNESSED" if any(x["captureOccurrences"] for x in anchors)
                   else "SOURCE_ANCHORS_NOT_OBSERVED"),
        "matchingRecords": sum(bool(x["captureOccurrences"]) for x in anchors),
        "sourceSignatureUniquenessVerified": True,
        "originalDecoderRoutineVerified": False,
        "originalOutputPixelsVerified": False,
        "newContinuationImagesVerified": 0,
        "nativeFrameOrderOrTimingVerified": False,
        "evidenceLimit": "RAW_SOURCE_BUFFER_PRESENCE_ONLY_NEVER_DECODER_OUTPUT",
        "anchors": anchors,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--original", type=Path, required=True,
                        help="Canonical private original DATA.MK3, folder, or mk3.zip")
    parser.add_argument("--capture", type=Path,
                        help="Optional private DOSBox-X binary memory dump outside Git")
    parser.add_argument("--ordinal", type=int, action="append",
                        help="Exact source ordinal; repeat; default 0,23,66,68,126,215")
    parser.add_argument("--report", type=Path,
                        help="New metadata-only JSON under a private validation folder")
    args = parser.parse_args()
    try:
        source = args.original.resolve(strict=True)
        data = source_file(source)
        capture = None
        if args.capture:
            capture_path = args.capture.resolve(strict=True)
            require(capture_path.is_file() and not capture_path.is_relative_to(ROOT.resolve())
                    and capture_path != source, "capture must be a different private file")
            require(capture_path.stat().st_size <= MAX_CAPTURE_BYTES,
                    "capture exceeds 64MiB guard")
            capture = capture_path.read_bytes()
        result = analyze(data, capture, tuple(args.ordinal) if args.ordinal else DEFAULT_ORDINALS)
        if args.report:
            path = args.report.resolve(strict=False)
            require(path.suffix.lower() == ".json" and path.parent.is_dir()
                    and not path.exists() and not path.is_relative_to(ROOT.resolve())
                    and (not path.is_relative_to(source) if source.is_dir() else path != source),
                    "refusing unsafe report path or overwrite")
            with path.open("x", encoding="utf-8") as output:
                json.dump(result, output, sort_keys=True, indent=2)
                output.write("\n")
        print(json.dumps(result, sort_keys=True, indent=2))
        return 0
    except (ValueError, OSError, struct.error) as error:
        print("P89 R1 witness error: " + str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
