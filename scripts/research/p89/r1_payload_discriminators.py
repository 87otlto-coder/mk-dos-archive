#!/usr/bin/env python3
"""P89 R1: original-anchored MK3 P79 compressed-record discriminators.

Observes source boundaries and falsifies two SPECIFIC naive byte-RLE grammars.
Does NOT decode images, identify gameplay frames or assign palettes/timing.
Read-only original data; optional JSON report is exclusive in a private folder.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import struct
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[3]
DATA_SHA = '72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517'
START, END = 667866, 2508500
PFX = b'\x80\x81\x00'


def ensure(ok: object, why: str) -> None:
    if not ok:
        raise ValueError('P89 R1: ' + why)


def sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def source_file(path: Path) -> bytes:
    """Require exact DATA.MK3 identity; no extraction to disk."""
    source = path.resolve(strict=True)
    ensure(source.is_file() and not source.is_relative_to(ROOT.resolve()),
           'original source must be a private file outside Git')
    if zipfile.is_zipfile(source):
        with zipfile.ZipFile(source) as archive:
            names = [name for name in archive.namelist()
                     if name.replace('\\', '/').upper().split('/')[-1] == 'DATA.MK3']
            ensure(len(names) == 1, 'exactly one original DATA.MK3 required in private ZIP')
            info = archive.getinfo(names[0])
            ensure(info.file_size == 9015508 and info.compress_size <= source.stat().st_size,
                   'original DATA.MK3 ZIP member size/fingerprint not canonical')
            data = archive.read(names[0])
    else:
        data = source.read_bytes()
    ensure(len(data) == 9015508 and sha(data) == DATA_SHA,
           'unknown commercial DATA.MK3 fingerprint')
    return data


def packbits_count(payload: bytes) -> dict:
    """Independent *rejected candidate* PackBits: 0x80 noop; signed count."""
    pos = produced = 0
    while pos < len(payload):
        control = payload[pos]
        pos += 1
        if control == 128:
            continue
        if control < 128:
            count = control + 1
            if pos + count > len(payload):
                return {'status': 'TRUNCATED_LITERAL', 'inputOffset': pos-1}
            produced += count
            pos += count
        else:
            if pos >= len(payload):
                return {'status': 'TRUNCATED_REPEAT', 'inputOffset': pos-1}
            produced += 257 - control
            pos += 1
    return {'status': 'PARSED', 'producedPositions': produced}


def naive_escape_count(payload: bytes) -> dict:
    """Independent *rejected candidate*: 0x80 + (u8 count,u8 value)."""
    pos = produced = 0
    while pos < len(payload):
        if payload[pos] == 128:
            if pos + 3 > len(payload):
                return {'status': 'TRUNCATED_ESCAPE', 'inputOffset': pos}
            produced += payload[pos + 1]
            pos += 3
        else:
            produced += 1
            pos += 1
    return {'status': 'PARSED', 'producedPositions': produced}


def examine_span(span: bytes, *, source_start: int = START,
                 original_source_sha: str | None = None, canonical: bool = True) -> dict:
    ensure(len(span) >= 6 + 768 + 8, 'P79 source too short')
    count, width, height = struct.unpack_from('<HHH', span)
    reserved, base_count = struct.unpack_from('<II', span, 774)
    ensure(0 < count <= 216 and 0 < width <= 320 and 0 < height <= 200 and
           width * height == base_count and reserved == 0,
           'unrecognized P79 count/dimensions/base source header')
    cursor = 782 + base_count
    ensure(cursor <= len(span), 'P79 source base exceeds span')
    records = []
    for ordinal in range(count):
        ensure(cursor + 14 <= len(span), 'truncated original continuation header')
        tag, field_a, field_b, length = struct.unpack_from('<HIII', span, cursor)
        begin = cursor + 14
        finish = begin + length
        ensure(tag == 3 and finish <= len(span), 'invalid tag or payload extent')
        ensure(length != 0 or (field_a == 0 and field_b == 0),
               'invalid empty-record source fields')
        payload = span[begin:finish]
        observation = {
            'ordinal': ordinal,
            'originalHeaderOffset': source_start + cursor,
            'originalPayloadOffset': source_start + begin,
            'payloadLength': length,
            'fieldA': field_a, 'fieldB': field_b,
            'fieldDifference': field_b-field_a,
            'payloadSha256': sha(payload),
        }
        if length:
            observation.update({
                'firstThreeAre808100': payload.startswith(PFX),
                'lastTwoAre0000': payload.endswith(b'\x00\x00'),
                'marker808100Occurrences': payload.count(PFX),
                'marker80fff9Occurrences': payload.count(b'\x80\xff\xf9'),
            })
            tests = {
                'naivePackBits': packbits_count(payload),
                'naiveEscapeU8Run': naive_escape_count(payload),
            }
            # The declared range is a discriminator, NOT verified output semantics.
            for result in tests.values():
                result['matchesDeclaredFieldDifference'] = (
                    result.get('status') == 'PARSED' and
                    result.get('producedPositions') == field_b-field_a
                )
            observation['rejectedCandidateGrammarTests'] = tests
        records.append(observation)
        cursor = finish
    ensure(cursor == len(span), 'unaccounted original span bytes')
    groups = Counter((r['fieldA'], r['fieldB']) for r in records)
    filled = [r for r in records if r['payloadLength']]
    empty = [r['ordinal'] for r in records if r['payloadLength'] == 0]
    counts = {
        'records': len(records), 'nonempty': len(filled), 'emptyOrdinals': empty,
        'payloadBytes': sum(r['payloadLength'] for r in records),
        'fieldGroups': [dict(fieldA=a,fieldB=b,count=v)
                        for (a,b),v in sorted(groups.items())],
        'distinctNonemptyPayloadHashes': len(set(r['payloadSha256'] for r in filled)),
        'marker808100Beginnings': sum(r.get('firstThreeAre808100',False) for r in filled),
        'marker0000Endings': sum(r.get('lastTwoAre0000',False) for r in filled),
        'naivePackBitsMatchesFieldSpan': sum(
            r['rejectedCandidateGrammarTests']['naivePackBits']['matchesDeclaredFieldDifference']
            for r in filled),
        'naiveEscapeU8MatchesFieldSpan': sum(
            r['rejectedCandidateGrammarTests']['naiveEscapeU8Run']['matchesDeclaredFieldDifference']
            for r in filled),
    }
    if canonical:
        ensure(source_start == START and len(span) == END-START and
               (count, width, height) == (216, 320, 200) and
               (len(filled), empty, counts['payloadBytes']) ==
               (210, list(range(120,126)), 1772828) and
               groups == {(0, 0): 6, (0, 64000): 209, (47679, 51839): 1} and
               counts['distinctNonemptyPayloadHashes'] == 210 and
               counts['marker808100Beginnings'] == 209 and
               counts['marker0000Endings'] == 209,
               'canonical original R1 invariant changed')
    return {
        'format': 'mk3_p89_r1_original_payload_discriminators_v1',
        'originalDataSha256': original_source_sha,
        'sourceSpanOffset': source_start,
        'sourceSpanBytes': len(span),
        'sourceSpanSha256': sha(span),
        'baseWidth': width, 'baseHeight': height, 'basePlaneSha256': sha(span[782:782+base_count]),
        'classification': 'VERIFIED_SOURCE_STRUCTURE_AND_REJECTED_TWO_NAIVE_GRAMMARS',
        'nativeFramesVerified': 0,
        'decodedContinuationImagesVerified': 0,
        'nativeCodecKnown': False, 'paletteOwnershipVerified': False,
        'recordFieldSemanticsVerified': False,
        'nativePlaybackVerified': False,
        'declaredFieldDifferencesAreHypotheticalOutputBounds': True,
        'counts': counts, 'observations': records,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--original', type=Path, required=True,
                        help='Private canonical DATA.MK3 or mk3.zip outside Git')
    parser.add_argument('--report', type=Path,
                        help='NEW private JSON report outside Git and original installation')
    args = parser.parse_args()
    try:
        data = source_file(args.original)
        result = examine_span(data[START:END], original_source_sha=DATA_SHA)
        if args.report is not None:
            out = args.report.resolve(strict=False)
            source = args.original.resolve(strict=True)
            ensure(out.suffix.lower() == '.json' and out.parent.is_dir() and
                   not out.exists() and not out.is_relative_to(ROOT.resolve()) and
                   out != source and not out.is_relative_to(source.parent),
                   'report path must be a new private JSON outside original/source folders')
            with out.open('x', encoding='utf-8') as stream:
                json.dump(result, stream, indent=2, sort_keys=True)
                stream.write('\n')
        print(json.dumps({key:result[key] for key in (
            'format','originalDataSha256','sourceSpanSha256','classification',
            'nativeFramesVerified','decodedContinuationImagesVerified','counts')}, indent=2))
        return 0
    except (OSError, ValueError, KeyError, IndexError, struct.error,
            zipfile.BadZipFile) as error:
        print('P89 R1 ERROR: '+str(error), file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
