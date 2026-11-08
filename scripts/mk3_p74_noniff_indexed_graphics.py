#!/usr/bin/env python3
"""P74: bounded first-stream indexed graphics from fingerprinted original MK3 DATA.MK3.

Does not assert that adjacent unlabeled RGB tables are native palettes or that
undecoded bytes after the first stream belong to particular frames or stages.
Commercial data stays in private output archives, not Git.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct
import zlib
import zipfile

import mk3_p73_noniff_palette_candidates as p73

FORMAT = 'mk3_p74_source_first_stream_indexed_graphics_v1'
FIRST_STREAM_OFFSET_IN_REGION = 24 + 768
MAX_PIXELS = 1_000_000
CANONICAL_FULL_REGIONS = {1, 2, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18}
CANONICAL_PARTIAL_REGIONS = {3, 4, 7, 16, 19}


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError('P74 original non-IFF graphic: ' + reason)


def decode_first_stream(source: bytes, offset: int, length: int) -> dict:
    require(offset >= 0 and length >= FIRST_STREAM_OFFSET_IN_REGION + 2
            and offset + length <= len(source), 'source region extent')
    width, height = struct.unpack_from('<HH', source, offset)
    require(0 < width <= 2048 and 0 < height <= 1024 and width*height <= MAX_PIXELS,
            'bounded original two-word dimensions')
    stream_size = struct.unpack_from('<I', source, offset+20)[0]
    start = offset + FIRST_STREAM_OFFSET_IN_REGION
    limit = start + stream_size
    require(2 <= stream_size <= length-FIRST_STREAM_OFFSET_IN_REGION,
            'declared stream escapes original non-IFF region')
    indices = bytearray(width*height)
    mask = bytearray(width*height)
    cursor = start
    rows = 0
    painted = 0
    literal_ops = 0
    skipped = 0
    while rows < height and cursor < limit:
        if limit-cursor == 1:
            break  # single unparsed source byte, not a complete command
        x = 0
        while True:
            require(cursor + 2 <= limit, 'unterminated source row or command word')
            command = struct.unpack_from('<h', source, cursor)[0]
            cursor += 2
            if command == 0:
                break
            if command < 0:
                x += -command
                require(x <= width, 'transparent skip beyond source row width')
                skipped += -command
                continue
            require(cursor + command <= limit, 'literal exceeds declared first stream')
            require(x + command <= width, 'literal exceeds source row width')
            a = rows * width + x
            indices[a:a+command] = source[cursor:cursor+command]
            mask[a:a+command] = b'\x01'*command
            painted += command
            literal_ops += 1
            x += command
            cursor += command
        rows += 1
    # The explicit stream is frequently word-aligned with one trailing zero
    # pad byte. Do not interpret any other unmatched bytes as valid source.
    padding = limit-cursor
    require(padding in (0, 1), 'unexplained remaining compressed bytes')
    # Retain the unparsed byte verbatim in the exported compressed stream;
    # nonzero values occur in the original and have no proven padding meaning.
    require(rows <= height, 'source row count exceeds declared image height')
    return {
        'regionOffset': offset, 'regionLength': length, 'width': width, 'height': height,
        'sourcePrefixOffset': offset, 'sourcePrefixLength': 24,
        'sourceLocalCandidateRgb8Offset': offset+24,
        'sourceLocalCandidateRgb8Length': 768,
        'sourceFirstStreamOffset': start, 'sourceFirstStreamLength': stream_size,
        'firstStreamSha256': p73.sha(source[start:limit]),
        'sourceFirstStreamRleBytes': source[start:limit],
        'explicitDecodedRows': rows, 'unresolvedTrailingRows': height-rows,
        'firstStreamUnparsedTrailingBytes': padding,
        'firstStreamUnparsedTrailingByteHex': source[cursor:limit].hex(),
        'sourceBytesAfterFirstStream': offset+length-limit,
        'positiveLiteralCommands': literal_ops, 'literalPixelCount': painted,
        'transparentSkipPixelsInExplicitRows': skipped,
        'fullFirstImageReconstruction': rows == height,
        'indexedBytes': bytes(indices), 'maskBytes': bytes(mask),
        'candidateRgb8': source[offset+24:offset+792],
    }


def rgba_from_planes(indices: bytes, mask: bytes, rgb: bytes | None = None) -> bytes:
    require(len(indices) == len(mask), 'indices/mask length mismatch')
    require(rgb is None or len(rgb) == 768, 'source candidate RGB8 length mismatch')
    require(all(v in (0, 1) for v in mask), 'mask must be binary')
    out = bytearray(len(indices)*4)
    for i, (index, opaque) in enumerate(zip(indices, mask)):
        if not opaque:
            continue
        if rgb is None:
            c = 32 + (index*223+127)//255
            red = green = blue = c
        else:
            red, green, blue = rgb[index*3:index*3+3]
        out[4*i:4*i+4] = bytes((red, green, blue, 255))
    return bytes(out)


def png_rgba(width: int, height: int, rgba: bytes) -> bytes:
    require(len(rgba) == width*height*4, 'RGBA dimensions mismatch')
    def chunk(tag: bytes, payload: bytes) -> bytes:
        return struct.pack('>I', len(payload)) + tag + payload + struct.pack('>I', zlib.crc32(tag+payload) & 0xffffffff)
    raw = b''.join(b'\x00' + rgba[y*width*4:(y+1)*width*4] for y in range(height))
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB',width,height,8,6,0,0,0))
            + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))


def extract(data: bytes, *, canonical: bool = True) -> tuple[dict, list[tuple[str,bytes]]]:
    if canonical:
        require(p73.sha(data) == p73.DATA_SHA256, 'original DATA.MK3 SHA-256 not recognized')
    forms, gaps = p73.iff_forms_and_gaps(data)
    if canonical:
        require(len(forms) == 416 and len(gaps) == 20,
                'original IFF and non-IFF source boundary census')
    files: list[tuple[str,bytes]] = []
    records = []
    complete, partial = set(), set()
    for ordinal, region in enumerate(gaps[1:], 1):
        d = decode_first_stream(data, region['offset'], region['length'])
        full = d['fullFirstImageReconstruction']
        (complete if full else partial).add(ordinal)
        name = f'region-{ordinal:02d}'
        first = f'{name}/original-first-stream.bin'
        files.append((first, d['sourceFirstStreamRleBytes']))
        raw_color = f'{name}/reference-unlabeled-adjacent-rgb8.bin'
        files.append((raw_color, d['candidateRgb8']))
        r = {k:v for k,v in d.items() if k not in ('indexedBytes','maskBytes','candidateRgb8','sourceFirstStreamRleBytes')}
        r.update({
            'regionOrdinal': ordinal,
            'sourceFirstStreamPrivateZipPath': first,
            'sourceLocalCandidateRgb8PrivateZipPath': raw_color,
            'sourceLocalCandidateRgb8Sha256': p73.sha(d['candidateRgb8']),
            'unlabeledRgb8NativePaletteOwnershipVerified': False,
            'nativeFighterPaletteOwnershipVerified': False,
            'stageCompositionOrRuntimeTimingVerified': False,
            'unresolvedBytesAfterFirstStreamPreservedInOriginal': True,
            'sourceLiteralGrammarQualification': 'REPEATED_SOURCE_CONSTRAINED_NOT_EXE_RUNTIME_VERIFIED',
        })
        if full:
            indices, mask = d['indexedBytes'], d['maskBytes']
            idx_path = f'{name}/original-indexed-pixels.bin'
            mask_path = f'{name}/original-opacity-mask.bin'
            gray_path = f'{name}/indexed-grayscale-preview.png'
            color_path = f'{name}/experimental-source-adjacent-rgb8-comparison.png'
            files.extend([
                (idx_path, indices), (mask_path, mask),
                (gray_path, png_rgba(d['width'],d['height'],rgba_from_planes(indices,mask))),
                (color_path, png_rgba(d['width'],d['height'],rgba_from_planes(indices,mask,d['candidateRgb8']))),
            ])
            r.update({
                'indexedPixelsPrivateZipPath': idx_path, 'opacityMaskPrivateZipPath': mask_path,
                'indexedPixelsSha256': p73.sha(indices), 'opacityMaskSha256': p73.sha(mask),
                'indexedGrayscalePng': gray_path, 'sourceAdjacentRgb8ComparisonPng': color_path,
                'fullFirstImageQualification': 'ALL_DECLARED_ROWS_PARSED_UP_TO_ONE_UNEXPLAINED_SOURCE_BYTE',
                'colorPreviewMeaning': 'COMPARISON_ONLY_SOURCE_ADJACENT_UNLABELED_TABLE',
            })
        else:
            r.update({
                'fullFirstImageQualification': 'PARTIAL_ONLY_NO_TRANSPARENT_ROW_PADDING_ASSERTED',
                'indexedPixelsSha256': None, 'opacityMaskSha256': None,
            })
        records.append(r)
    if canonical:
        require(complete == CANONICAL_FULL_REGIONS and partial == CANONICAL_PARTIAL_REGIONS,
                '14 complete / 5 partial original source regression census')
    report = {
        'format': FORMAT, 'sourcePath': 'DATA.MK3',
        'sourceWholeFileSha256': p73.sha(data), 'sourceBytes':len(data),
        'sourceFingerprintVerified':p73.sha(data)==p73.DATA_SHA256,
        'originalIffImageCount':len(forms), 'nonIffRegionCount':len(gaps),
        'nonIffCandidateRegionCount':len(records),
        'fullFirstImageRegionOrdinals':sorted(complete),
        'partialFirstImageRegionOrdinals':sorted(partial),
        'fullFirstImageCount':len(complete),
        'partialFirstImageCount':len(partial),
        'appCatalogueModified':False,
        'newCanonicalNativeFighterPaletteOwnershipClaimed':False,
        'nativeStageMembershipOrTimelineClaimed':False,
        'remainderBeyondFirstStreamsDecoded':False,
        'originalNonIffSourceRegionsRetainedByExistingApp':True,
        'records': records,
    }
    files.append(('manifest.json', (json.dumps(report, indent=2)+'\n').encode('utf-8')))
    files.append(('README.txt',
        ('P74 original MK3 DATA.MK3 bounded non-IFF indexed graphics extraction.\n'
         '14 source-consistent first indexed image streams are entirely decoded;\n'
         'five first streams contain fewer explicit rows than their header heights.\n'
         'The five incomplete images are NOT padded or fabricated in any exported PNG.\n'
         'Original compressed first-stream source bytes and adjacent unlabeled RGB8\n'
         'source tables are always exported separately with exact offsets and hashes.\n'
         'Colored preview PNGs are EXPERIMENTAL comparisons only. The source-local\n'
         'adjacent 768-byte field is not an authenticated native graphics palette,\n'
         'nor is any native fighter or stage/runtime membership claimed.\n'
         'Undecoded source bytes after each first stream remain in the original.\n').encode('utf-8')))
    return report, files


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('original_mk3', type=Path,
                    help='Original MK3 install folder, DATA.MK3 file or private mk3.zip')
    ap.add_argument('private_output_zip', type=Path,
                    help='New private ZIP path outside Git; existing output refused')
    args = ap.parse_args()
    data = p73.read_original_data(args.original_mk3)
    report, files = extract(data)
    require(not args.private_output_zip.exists(), 'refusing overwrite of existing output')
    args.private_output_zip.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.private_output_zip,'x',compression=zipfile.ZIP_DEFLATED) as z:
        for name, payload in files:
            z.writestr(name, payload)
    print(json.dumps({'pass':'P74','status':'PASS', 'sourceSha256':report['sourceWholeFileSha256'],
          'firstStreams':report['nonIffCandidateRegionCount'],
          'completeIndexedImages':report['fullFirstImageCount'],
          'incompleteIndexedImages':report['partialFirstImageCount'],
          'nativeFighterPaletteOwnershipVerified':False,
          'privateOutput':str(args.private_output_zip)}))


if __name__ == '__main__':
    main()
