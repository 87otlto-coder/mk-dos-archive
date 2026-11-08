#!/usr/bin/env python3
"""P73 bounded MK3 DATA.MK3 non-IFF palette-candidate extraction.

Only the independently fingerprinted original DATA.MK3 version is accepted by
CLI. Read-only input; extracted commercial source bytes stay outside GitHub.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct
import zipfile

DATA_SHA256 = '72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517'
FORMAT = 'mk3_p73_data_noniff_rgb8_candidate_audit_v1'


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_original_data(source: Path) -> bytes:
    if source.is_dir():
        candidates = [p for p in source.iterdir() if p.is_file() and p.name.upper() == 'DATA.MK3']
        if not candidates and (source / 'mk3').is_dir():
            candidates = [p for p in (source / 'mk3').iterdir() if p.is_file() and p.name.upper() == 'DATA.MK3']
        if len(candidates) != 1:
            raise ValueError('Expected exactly one DATA.MK3 under the installation folder')
        return candidates[0].read_bytes()
    if source.is_file() and source.name.upper() == 'DATA.MK3':
        return source.read_bytes()
    if source.is_file() and zipfile.is_zipfile(source):
        with zipfile.ZipFile(source) as archive:
            names = [n for n in archive.namelist() if not n.endswith('/') and
                     n.rsplit('/', 1)[-1].upper() == 'DATA.MK3']
            if len(names) != 1:
                raise ValueError('Expected exactly one DATA.MK3 in original private ZIP')
            return archive.read(names[0])
    raise ValueError('Input must be original DATA.MK3, its installation directory, or a private installation ZIP')


def iff_forms_and_gaps(data: bytes) -> tuple[list[dict], list[dict]]:
    """Locate fully parsed embedded IFF image FORM ranges, preserving all gaps.

    Searches the source stream, as the app does, but requires complete BMHD,
    CMAP and BODY structure rather than guessing at unparsed bytes.
    """
    forms: list[dict] = []
    p = 0
    while p + 12 <= len(data):
        if data[p:p+4] != b'FORM' or data[p+8:p+12] not in (b'PBM ', b'ILBM'):
            p += 1
            continue
        n = struct.unpack_from('>I', data, p+4)[0] + 8
        if n < 20 or p+n > len(data):
            raise ValueError(f'Truncated/invalid IFF FORM at {p}')
        end, q = p+n, p+12
        cmap = None
        tags: set[bytes] = set()
        while q < end:
            if q+8 > end:
                raise ValueError(f'Truncated IFF subchunk at {q}')
            tag, size = data[q:q+4], struct.unpack_from('>I', data, q+4)[0]
            chunk_end = q+8+size
            if chunk_end > end:
                raise ValueError(f'IFF subchunk exceeds FORM at {q}')
            if tag == b'CMAP':
                if cmap is not None or size != 768:
                    raise ValueError(f'Duplicate/non-RGB8 CMAP at {q}')
                cmap = {'offset': q+8, 'length': size, 'bytes': data[q+8:chunk_end]}
            tags.add(tag)
            q = chunk_end + (size & 1)
        if q != end or not {b'BMHD', b'CMAP', b'BODY'} <= tags or cmap is None:
            raise ValueError(f'Unqualified IFF image at {p}')
        forms.append({'offset': p, 'length': n, 'cmap': cmap})
        p = end
    gaps: list[dict] = []
    cursor = 0
    for f in forms:
        if f['offset'] > cursor:
            gaps.append({'offset': cursor, 'length': f['offset']-cursor})
        cursor = f['offset'] + f['length']
    if cursor < len(data):
        gaps.append({'offset': cursor, 'length': len(data)-cursor})
    return forms, gaps


def audit(data: bytes, *, canonical: bool = True) -> tuple[dict, list[tuple[str, bytes]]]:
    digest = sha(data)
    if canonical and digest != DATA_SHA256:
        raise ValueError('Unrecognized DATA.MK3 SHA-256: fail closed; record layout is not generalized')
    forms, gaps = iff_forms_and_gaps(data)
    # The first original gap is a differently structured 1.84 MiB region.
    # Do not interpret it with the repeated 24+768-byte candidate layout.
    candidates = []
    source_palettes: dict[bytes, list[int]] = {}
    for form in forms:
        source_palettes.setdefault(form['cmap']['bytes'], []).append(form['offset'])
    entries: list[tuple[str, bytes]] = []
    for ordinal, region in enumerate(gaps[1:], 1):
        start, length = region['offset'], region['length']
        if length < 24 + 768:
            if canonical:
                raise ValueError(f'Non-IFF region {ordinal} too short for P73 candidate')
            continue
        start_of_table = start+24
        pal = data[start_of_table:start_of_table+768]
        label = f'palette-candidates/region-{ordinal:02d}-offset-{start_of_table:08x}.rgb8'
        entries.append((label, pal))
        match_offsets = source_palettes.get(pal, [])
        candidates.append({
            'regionOrdinal': ordinal,
            'sourceRegionOffset': start,
            'sourceRegionLength': length,
            'sourceTableOffset': start_of_table,
            'sourceTableLength': 768,
            'sourceTableSha256': sha(pal),
            'originalHeaderU16LE_0': struct.unpack_from('<H', data, start)[0],
            'originalHeaderU16LE_2': struct.unpack_from('<H', data, start+2)[0],
            'exactIffCmapMatchOffsets': match_offsets,
            'classification': ('VERIFIED_BYTE_IDENTICAL_TO_SOURCE_IFF_CMAP'
                               if match_offsets else 'INFERRED_RGB8_LAYOUT_ONLY'),
            'privateZipPath': label,
            'nativeFighterPaletteOwnershipVerified': False,
        })
    unique = set(x[1] for x in entries)
    reused = set(x for x in unique if x in source_palettes)
    report = {
        'format': FORMAT,
        'sourcePath': 'DATA.MK3',
        'sourceWholeFileSha256': digest,
        'sourceBytes': len(data),
        'originalVersionFingerprintVerified': digest == DATA_SHA256,
        'iffForms': len(forms),
        'iffDistinctCmaps': len(source_palettes),
        'iffCoveredBytes': sum(f['length'] for f in forms),
        'unparsedRegionCount': len(gaps),
        'unparsedRegionBytes': sum(g['length'] for g in gaps),
        'firstNonIffRegionExcludedFromCandidateLayout': gaps[0] if gaps else None,
        'nonIffCandidateTables': len(candidates),
        'nonIffCandidateDistinctRgb8Tables': len(unique),
        'candidateOccurrencesByteIdenticalToIffCmap': sum(bool(c['exactIffCmapMatchOffsets']) for c in candidates),
        'candidateDistinctTablesByteIdenticalToIffCmap': len(reused),
        'candidateDistinctTablesNotFoundAsIffCmap': len(unique - reused),
        'candidateInterpretation': 'INFERRED_24_BYTE_PREFIX_AND_768_RGB8_BYTES',
        'nativeFighterPaletteOwnershipVerified': False,
        'nativeFrameTimingOrStageMembershipVerified': False,
        'rawSourceRegionsMustRemainPreserved': True,
        'candidates': candidates,
    }
    if canonical:
        expect = {
            'sourceBytes': 9015508, 'iffForms': 416, 'iffDistinctCmaps': 125,
            'unparsedRegionCount': 20, 'unparsedRegionBytes': 4532786,
            'nonIffCandidateTables': 19, 'nonIffCandidateDistinctRgb8Tables': 17,
            'candidateOccurrencesByteIdenticalToIffCmap': 11,
            'candidateDistinctTablesByteIdenticalToIffCmap': 9,
            'candidateDistinctTablesNotFoundAsIffCmap': 8,
        }
        for k, expected in expect.items():
            if report[k] != expected:
                raise ValueError(f'Canonical P73 source invariant failed: {k}: {report[k]} != {expected}')
    return report, entries


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('original_mk3', type=Path, help='Original installation folder, DATA.MK3, or private mk3.zip')
    ap.add_argument('private_output_zip', type=Path, help='Local private ZIP output; do not put under Git')
    args = ap.parse_args()
    data = read_original_data(args.original_mk3)
    report, entries = audit(data)
    output = args.private_output_zip
    if output.exists():
        raise ValueError('Refusing to overwrite an existing private result')
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'x', compression=zipfile.ZIP_STORED) as z:
        for path, buf in entries:
            z.writestr(path, buf)
        z.writestr('manifest.json', json.dumps(report, indent=2) + '\n')
        z.writestr('README.txt',
            'P73 MK3 original DATA.MK3 non-IFF RGB8 table candidate export.\n'
            'The original source exposes 19 repeated 24-byte-prefix plus 768-byte regions.\n'
            'Byte-identical overlap with some independently validated IFF CMAPs is\n'
            'source evidence; it does NOT authenticate this layout as a native fighter\n'
            'palette, display timing, stage affiliation, or a decoded bitmap.\n'
            'These are source bytes, not game-ready palette assignments. Preserve\n'
            'all original unparsed regions and use this ZIP only for private research.\n')
    print(json.dumps({'pass': 'P73', 'status': 'PASS', 'privateOutput': str(output),
                      'sourceWholeFileSha256': report['sourceWholeFileSha256'],
                      'sourceFingerprintVerified': report['originalVersionFingerprintVerified'],
                      'candidateTables': report['nonIffCandidateTables'],
                      'distinctCandidateTables': report['nonIffCandidateDistinctRgb8Tables'],
                      'byteIdenticalIffOccurrences': report['candidateOccurrencesByteIdenticalToIffCmap'],
                      'distinctTablesNotInIff': report['candidateDistinctTablesNotFoundAsIffCmap'],
                      'nativeFighterOwnershipVerified': False}))


if __name__ == '__main__':
    main()
