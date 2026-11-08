#!/usr/bin/env python3
"""P75 original-source 19-region sparse-row indexed graphic extraction.

Bounded to the SHA-fingerprinted DOS DATA.MK3 fixture. The two source-local
row arrays make 19 declared canvases reconstructable, with -1 rows absent
from the source stream. Their purpose is inferred, not EXE-proven. RGB
comparison is optional and not a native palette assignment.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import struct
import zipfile

import mk3_p73_noniff_palette_candidates as p73
from mk3_p74_noniff_indexed_graphics import png_rgba, rgba_from_planes

FORMAT = 'mk3_p75_noniff_source_row_table_indexed_canvases_v1'
EXPECTED_REGIONS = 19
EXPECTED_ROW_COUNT = 3015
EXPECTED_ABSENT_ROWS = 271
EXPECTED_INDEXED_POSITIONS = None  # computed from original geometry below
EXPECTED_POST_ROW_TABLE_BYTES = 1611110
MAX_PIXELS = 1_000_000


def require(condition: object, detail: str) -> None:
    if not condition:
        raise ValueError('P75 source row table: '+detail)


def reconstruct_region(data: bytes, offset: int, length: int) -> dict:
    require(offset >= 0 and length >= 24+768+2 and offset+length <= len(data),
            'invalid original non-IFF region extent')
    width,height = struct.unpack_from('<HH', data, offset)
    require(0 < width <= 2048 and 0 < height <= 1024 and width*height <= MAX_PIXELS,
            'out-of-bounds source dimensions')
    size = struct.unpack_from('<I',data,offset+20)[0]
    stream_at=offset+24+768
    end=stream_at+size
    row_x_at=end
    row_offset_at=row_x_at+4*height
    mapped_end=row_offset_at+4*height
    require(size>=2 and mapped_end<=offset+length,'row table or stream exceeds source region')
    x_values=struct.unpack_from('<'+'i'*height, data, row_x_at)
    offsets=struct.unpack_from('<'+'I'*height, data, row_offset_at)
    active=[i for i,x in enumerate(x_values) if x!=-1]
    require(active,'no original rows have source pixel streams')
    require(all(x == -1 or 0 <= x < width for x in x_values),
            'unsupported row X value other than -1 or in-range coordinate')
    require(all(offsets[i]==0 for i,x in enumerate(x_values) if x==-1),
            'absent source row has nonzero stream pointer')
    require(offsets[active[0]] == 0, 'first recorded physical row does not begin at stream offset zero')
    require(all(offsets[a]<offsets[b] for a,b in zip(active,active[1:])),
            'active row pointers must increase strictly')
    require(offsets[active[-1]]<size,'last row pointer outside stream')
    pixels=bytearray(width*height)
    opacity=bytearray(width*height)
    total_painted=0
    last_tail=b''
    per_row=[]
    for n,y in enumerate(active):
        next_bound=offsets[active[n+1]] if n+1<len(active) else size
        pos=stream_at+offsets[y]
        limit=stream_at+next_bound
        x=x_values[y]
        require(pos+2<=limit, f'row {y} has no command')
        while True:
            require(pos+2<=limit,f'row {y} lacks a terminator')
            command=struct.unpack_from('<h',data,pos)[0]
            pos+=2
            if command==0:
                break
            if command<0:
                x+=-command
                require(x<=width,f'row {y} transparent skip exceeds source width')
            else:
                require(x+command<=width,f'row {y} pixel run exceeds source width')
                require(pos+command<=limit,f'row {y} literal exceeds row pointer boundary')
                dest=y*width+x
                pixels[dest:dest+command]=data[pos:pos+command]
                opacity[dest:dest+command]=b'\x01'*command
                pos+=command
                x+=command
                total_painted+=command
        tail=data[pos:limit]
        require(not tail or (len(tail)==1 and n==len(active)-1),
                f'row {y} has unsupported data after terminator')
        if tail:
            last_tail=tail
        per_row.append({'sourceRow':y,'sourceX':x_values[y],
                        'sourceStreamRelativeStart':offsets[y],
                        'sourceStreamRelativeEnd':next_bound})
    assert len(per_row)==len(active)
    return {
        'regionOffset':offset,'regionLength':length,
        'width':width,'height':height,
        'sourceCompressedFirstStreamOffset':stream_at,
        'sourceCompressedFirstStreamLength':size,
        'sourceAdjacentRgb8CandidateOffset':offset+24,
        'sourceRowXTableOffset':row_x_at,'sourceRowXTableLength':4*height,
        'sourceRowCompressedOffsetTableOffset':row_offset_at,
        'sourceRowCompressedOffsetTableLength':4*height,
        'sourceAfterRowTablesOffset':mapped_end,
        'sourceAfterRowTablesLength':offset+length-mapped_end,
        'sourceRowsWithPackedData':len(active),
        'sourceMinusOneRowsWithoutPackedData':height-len(active),
        'activeRows':per_row,
        'firstStreamUnexplainedTrailingByteHex':last_tail.hex(),
        'paintedPixels':total_painted,
        'indices':bytes(pixels),'mask':bytes(opacity),
        'firstStream':data[stream_at:end],
        'rowXTable':data[row_x_at:row_offset_at],
        'rowCompressedOffsets':data[row_offset_at:mapped_end],
        'rgb8Candidate':data[offset+24:offset+792],
    }


def extract(original: bytes, *, canonical: bool = True) -> tuple[dict,list[tuple[str,bytes]]]:
    if canonical:
        require(p73.sha(original)==p73.DATA_SHA256,'unsupported DATA.MK3 source SHA-256')
    forms,gaps=p73.iff_forms_and_gaps(original)
    if canonical:
        require(len(forms)==416 and len(gaps)==20,'canonical IFF/non-IFF census mismatch')
    entries=[];records=[]
    total_rows=0;skipped_rows=0;positions=0;painted=0;remaining=0
    for ordinal,region in enumerate(gaps[1:],1):
        r=reconstruct_region(original,region['offset'],region['length'])
        name=f'region-{ordinal:02d}'
        outputs={
            'firstCompressedStream':(f'{name}/source-first-compressed-stream.bin',r['firstStream']),
            'sourceRowXTable':(f'{name}/source-row-x-i32le.bin',r['rowXTable']),
            'sourceRowOffsetTable':(f'{name}/source-row-stream-offset-u32le.bin',r['rowCompressedOffsets']),
            'adjacentUnlabeledRgb8Candidate':(f'{name}/reference-source-adjacent-rgb8.bin',r['rgb8Candidate']),
            'sourceMappedIndices':(f'{name}/source-row-mapped-indices.bin',r['indices']),
            'sourceMappedOpacityMask':(f'{name}/source-row-mapped-opacity.bin',r['mask']),
            'grayscaleIndexedPreview':(f'{name}/source-row-mapped-index-preview.png',
                                       png_rgba(r['width'],r['height'],rgba_from_planes(r['indices'],r['mask']))),
            'adjacentRgb8ComparisonOnlyPreview':(f'{name}/experimental-adjacent-rgb8-comparison.png',
                                                 png_rgba(r['width'],r['height'],rgba_from_planes(r['indices'],r['mask'],r['rgb8Candidate']))),
        }
        for path,buf in outputs.values():entries.append((path,buf))
        record={k:v for k,v in r.items() if k not in ('indices','mask','firstStream','rowXTable','rowCompressedOffsets','rgb8Candidate')}
        record.update({
            'regionOrdinal':ordinal,
            'sourceTableQualification':'INFERRED_ROW_X_AND_OFFSET_SEMANTICS__FULL_BYTE_AND_ROW_PARITY',
            'sourceMinusOneRowInterpretation':'NO_SOURCE_RLE_BYTES__TRANSPARENT_PREVIEW_ONLY',
            'allDeclaredRowsAccountedForViaSourceTables':True,
            'nativeFighterPaletteOwnershipVerified':False,
            'nativeStageMembershipOrFrameTimingClaimed':False,
            'sourceAdjacentRgb8IsOnlyExperimental':True,
            'sourceRemainderAfterRowTablesDecoded':False,
            'outputs':{k:{'path':v[0],'sha256':p73.sha(v[1]),'length':len(v[1])}
                       for k,v in outputs.items()},
        })
        records.append(record)
        total_rows+=r['height']; skipped_rows+=r['sourceMinusOneRowsWithoutPackedData']
        positions+=r['width']*r['height']; painted+=r['paintedPixels']
        remaining+=r['sourceAfterRowTablesLength']
    report={
        'format':FORMAT,'originalSourcePath':'DATA.MK3',
        'originalSourceWholeSha256':p73.sha(original),
        'originalSourceFingerprintVerified':p73.sha(original)==p73.DATA_SHA256,
        'originalIffForms':len(forms),'nonIffIntervals':len(gaps),
        'sourceRowTableMappedCanvasCount':len(records),
        'sourceRowsDeclared':total_rows,'sourceMinusOneRows':skipped_rows,
        'sourceIndexedCanvasPixelPositions':positions,
        'sourceExplicitPaintedPixels':painted,
        'undecodedBytesAfterSourceRowTables':remaining,
        'allOriginalNonIffSourceBytesStillPreserved':True,
        'nativePaletteOwnershipVerified':False,
        'nativeStageOrSequenceTimingVerified':False,
        'applicationAssetCatalogueModified':False,
        'records':records,
    }
    if canonical:
        require(len(records)==EXPECTED_REGIONS and total_rows==EXPECTED_ROW_COUNT
                and skipped_rows==EXPECTED_ABSENT_ROWS
                and remaining==EXPECTED_POST_ROW_TABLE_BYTES,
                'original source sparse-row/candidate census changed')
    entries.append(('manifest.json',(json.dumps(report,indent=2)+'\n').encode()))
    entries.append(('README.txt',(
        'MK3 original DATA.MK3 P75 source row-table indexed canvas extraction.\n'
        'Each of 19 non-IFF regions has a declared first RLE stream followed by\n'
        'two source-owned arrays, signed per-row X and unsigned compressed row offset.\n'
        '-1 row X corresponds to no packed row data, so this archive shows that\n'
        'row as transparent in a source-table interpretation, not a native\n'
        'runtime renderer assertion. The pixel plane is NOT a palette RGB image.\n'
        'Neighboring unlabeled RGB8 is used ONLY for separately identified\n'
        'comparison preview PNGs; native palette ownership is UNKNOWN.\n'
        'Residual bytes after source row tables are NOT decoded. No animation\n'
        'order, time, stage assignment or native character association is claimed.\n'
        'Keep this archive and commercial source bytes outside GitHub.\n').encode()))
    return report,entries


def main() -> None:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('original_mk3',type=Path)
    parser.add_argument('private_output_zip',type=Path)
    a=parser.parse_args()
    source=p73.read_original_data(a.original_mk3)
    report,entries=extract(source)
    require(not a.private_output_zip.exists(),'private output already exists')
    a.private_output_zip.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(a.private_output_zip,'x',compression=zipfile.ZIP_DEFLATED) as z:
        for path,buf in entries:z.writestr(path,buf)
    print(json.dumps({'pass':'P75','status':'PASS',
                      'originalSourceSha256':report['originalSourceWholeSha256'],
                      'sourceRowMappedCanvases':report['sourceRowTableMappedCanvasCount'],
                      'sourceExplicitAbsentRows':report['sourceMinusOneRows'],
                      'sourceIndexedPositions':report['sourceIndexedCanvasPixelPositions'],
                      'undecodedBytesAfterRowTables':report['undecodedBytesAfterSourceRowTables'],
                      'nativePaletteOwnershipVerified':False,
                      'privateOutput':str(a.private_output_zip)}))


if __name__=='__main__':
    main()
