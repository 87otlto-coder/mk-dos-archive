#!/usr/bin/env python3
"""Verify a private passive P79 read-return capture against original DATA.MK3.

Original bytes stay in FIXTURES, never in GitHub. Only acceptance metadata
and hashes are printed. This proves returned source bytes reached the DOS
guest buffer, NOT decoder identity, native pixel output or frame timing.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys

from r1_payload_discriminators import source_file

DATA_SHA256 = "72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517"
PAYLOAD_ABSOLUTE = 732662
PAYLOAD_LENGTH = 1506
PAYLOAD_SHA256 = "0efcbfd8fba8738a5485c9d434c432aee64aacc34627e3999550772579e01213"


def require(value: object, reason: str) -> None:
    if not value:
        raise ValueError("P89 passive read-return: " + reason)


def digest(blob: bytes) -> str:
    return hashlib.sha256(blob).hexdigest()


def validate(source: bytes, raw_capture: bytes, tsv: str) -> dict:
    require(len(source) == 9015508 and digest(source) == DATA_SHA256,
            "original source not canonical DATA.MK3")
    expected = source[PAYLOAD_ABSOLUTE:PAYLOAD_ABSOLUTE + PAYLOAD_LENGTH]
    require(len(expected) == PAYLOAD_LENGTH and digest(expected) == PAYLOAD_SHA256,
            "original P79 ordinal-0 payload fingerprint mismatch")
    require(len(raw_capture) == PAYLOAD_LENGTH and raw_capture == expected,
            "returned guest source differs from canonical ordinal-0 payload")
    lines = [l.strip() for l in tsv.splitlines() if l.strip()]
    require(1 <= len(lines) <= 64, "expected one or more bounded return-witness entries")
    seen = []
    for line in lines:
        cols = line.split("\t")
        require(len(cols) == 10 and cols[0] == "DATA.MK3",
                "malformed return-witness TSV row")
        try:
            (offset, requested, returned, succeeded, selector, dx,
             physical, guest_matches, capture_status) = (
                int(cols[1]), int(cols[2]), int(cols[3]), int(cols[4]),
                int(cols[5], 16), int(cols[6], 16), int(cols[7], 16),
                int(cols[8]), int(cols[9]))
        except ValueError as error:
            raise ValueError("P89 passive read-return: invalid numeric field") from error
        require(offset == PAYLOAD_ABSOLUTE and requested == PAYLOAD_LENGTH,
                "unexpected offset or DOS read request length")
        require(0 <= returned <= PAYLOAD_LENGTH and succeeded in (0, 1)
                and guest_matches in (0, 1) and capture_status in (-1, 0, 1, 2),
                "invalid return state")
        require(0 <= selector <= 0xFFFF and 0 <= dx <= 0xFFFF
                and 0 <= physical <= 0xFFFFFFFF,
                "guest selector/address out of bound")
        require(returned == PAYLOAD_LENGTH and succeeded == 1
                and guest_matches == 1 and capture_status in (1, 2),
                "incomplete read or guest memory parity not established")
        seen.append({
            "guestSegmentSelector": selector,
            "guestOffset": dx,
            "guestPhysicalAddress": physical,
            "actualBytesReturned": returned,
            "guestByteParity": True,
            "privateRawCaptureStatus": capture_status,
        })
    return {
        "status": "VERIFIED_SOURCE_READ_RETURN_AND_GUEST_COPY",
        "classification": "P79_ORDINAL0_COMPRESSED_INPUT_ONLY",
        "originalSourceSha256": DATA_SHA256,
        "payloadAbsoluteOffset": PAYLOAD_ABSOLUTE,
        "payloadLength": PAYLOAD_LENGTH,
        "payloadSha256": PAYLOAD_SHA256,
        "observations": seen,
        "nativeDecompressorVerified": False,
        "indexedPixelOutputVerified": False,
        "nativeFrameTimingVerified": False,
    }


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--data", type=Path, required=True,
                   help="canonical private DATA.MK3 (not GitHub source)")
    p.add_argument("--capture-dir", type=Path, required=True,
                   help="private FIXTURES/VALIDATION output folder")
    p.add_argument("--report", type=Path, required=True,
                   help="NEW private JSON report path under capture folder")
    a = p.parse_args()
    try:
        capture_dir = a.capture_dir.resolve(strict=True)
        require(capture_dir.is_dir() and "FIXTURES" in capture_dir.parts
                and "VALIDATION" in capture_dir.parts,
                "capture folder must be private FIXTURES/VALIDATION")
        report = a.report.resolve()
        require(report.parent == capture_dir and not report.exists(),
                "JSON output must be a new file directly in capture folder")
        raw = capture_dir / "p89-record0-return.bin"
        tsv = capture_dir / "p89-record0-read-return.tsv"
        require(raw.is_file() and tsv.is_file(),
                "original binary return or witness metadata missing")
        result = validate(source_file(a.data),
                          raw.read_bytes(), tsv.read_text(encoding="ascii"))
        with report.open("x", encoding="utf-8") as stream:
            json.dump(result, stream, indent=2, sort_keys=True)
            stream.write("\n")
        print(json.dumps(result, indent=2, sort_keys=True))
        return 0
    except (OSError, ValueError, UnicodeError) as error:
        print(str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
