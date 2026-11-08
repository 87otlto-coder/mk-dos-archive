#!/usr/bin/env python3
"""P77: additional original DOS MK3 indexed records chained after P75.

Read-only, original DATA.MK3 SHA-fingerprinted; preserves exact indexed planes,
source row tables and compressed streams. Native palette/sequence/stage UNKNOWN.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import zipfile
import mk3_p73_noniff_palette_candidates as p73
import mk3_p75_noniff_row_tables as p75
from mk3_p74_noniff_indexed_graphics import png_rgba, rgba_from_planes

FORMAT='mk3_p77_noniff_chained_row_mapped_indexed_records_v1'
GROUP_COUNTS=(2,11,50,16,5,2,6,1,4,19,4,5,5,28,2,1,4,12,39)


def require(ok,why):
    if not ok:raise ValueError('P77 original chained records: '+why)


def extract(source:bytes,canonical:bool=True):
    if canonical:require(p73.sha(source)==p73.DATA_SHA256,'unknown original DATA.MK3 SHA')
    forms,gaps=p73.iff_forms_and_gaps(source)
    if canonical:require(len(forms)==416 and len(gaps)==20,'original FORM/non-IFF census')
    require(len(gaps)>1,'missing original source regions')
    files=[];rows=[];groups=[]
    totals=dict(pixels=0,painted=0,absent=0,sourceRows=0,additionalPixels=0,
                additionalPainted=0,additionalAbsent=0,bytes=0,originalFirstPixels=0)
    for region,span in enumerate(gaps[1:],1):
        begin=span['offset'];end=begin+span['length'];at=begin;group=0
        require(0<=begin<end<=len(source),'source region extent')
        while at<end:
            require(group<1000,'unbounded source record chain')
            rec=p75.reconstruct_region(source,at,end-at)
            next_at=rec['sourceAfterRowTablesOffset']
            require(at<next_at<=end,'source chain does not advance inside gap')
            stem=f'region-{region:02d}/record-{group:03d}'
            contents={
                'sourceCompressedFirstStream':(stem+'/original-first-stream.bin',rec['firstStream']),
                'sourceRowXTable':(stem+'/source-row-x-i32le.bin',rec['rowXTable']),
                'sourceRowPointerTable':(stem+'/source-row-pointer-u32le.bin',rec['rowCompressedOffsets']),
                'sourceAdjacentUnlabeledRgb8':(stem+'/comparison-only-unlabeled-rgb8.bin',rec['rgb8Candidate']),
                'sourceMappedIndices':(stem+'/source-indexed-plane.bin',rec['indices']),
                'sourceMappedOpacityMask':(stem+'/source-opacity-plane.bin',rec['mask']),
                'grayscaleIndexedPreview':(stem+'/source-grayscale-index-preview.png',png_rgba(
                    rec['width'],rec['height'],rgba_from_planes(rec['indices'],rec['mask']))),
                'adjacentRgb8ExperimentOnlyPreview':(stem+'/experimental-adjacent-rgb8-preview.png',png_rgba(
                    rec['width'],rec['height'],rgba_from_planes(rec['indices'],rec['mask'],rec['rgb8Candidate']))),
            }
            files.extend(contents.values())
            meta={
                'recordOffset':at,'recordLength':next_at-at,
                'width':rec['width'],'height':rec['height'],
                'sourceStreamOffset':rec['sourceCompressedFirstStreamOffset'],
                'sourceStreamLength':rec['sourceCompressedFirstStreamLength'],
                'sourceRowXTableOffset':rec['sourceRowXTableOffset'],
                'sourceRowPointerTableOffset':rec['sourceRowCompressedOffsetTableOffset'],
                'sourceNextRecordOffset':next_at,
                'sourcePackedRows':rec['sourceRowsWithPackedData'],
                'sourceMinusOneRows':rec['sourceMinusOneRowsWithoutPackedData'],
                'sourcePaintedPixels':rec['paintedPixels'],
                'unexplainedFinalByteHex':rec['firstStreamUnexplainedTrailingByteHex'],
                'nonIffRegionOrdinal':region,'sourceRecordOrdinalWithinRegion':group,
                'notNativeAnimationFrameOrder':True,
                'sourceRowMappingInterpretation':'INFERRED_SOURCE_TABLE_GEOMETRY_NOT_EXE_VERIFIED',
                'sourceMinusOneRowsInterpretation':'TRANSPARENT_PREVIEW_ONLY_NOT_EXE_VERIFIED',
                'nativePaletteOwnershipVerified':False,
                'sourceAdjacentRgb8IsComparisonOnly':True,
                'nativeStageOrAnimationAssociationVerified':False,
                'outputs':{k:{'path':path,'length':len(data),'sha256':p73.sha(data)}
                           for k,(path,data) in contents.items()},
            }
            rows.append(meta)
            positions=rec['width']*rec['height']
            totals['pixels']+=positions;totals['painted']+=rec['paintedPixels']
            totals['absent']+=rec['sourceMinusOneRowsWithoutPackedData']
            totals['sourceRows']+=rec['height'];totals['bytes']+=next_at-at
            if group:
                totals['additionalPixels']+=positions
                totals['additionalPainted']+=rec['paintedPixels']
                totals['additionalAbsent']+=rec['sourceMinusOneRowsWithoutPackedData']
            else:totals['originalFirstPixels']+=positions
            at=next_at;group+=1
        require(at==end,'source chain does not exactly tile original region')
        groups.append(group)
    if canonical:
        require(tuple(groups)==GROUP_COUNTS and len(rows)==216 and totals=={
            'pixels':8667438,'painted':2164384,'absent':8746,
            'sourceRows':24811,'additionalPixels':6616595,
            'additionalPainted':1167687,'additionalAbsent':8475,
            'bytes':2692152,'originalFirstPixels':2050843},
            'expected original 216-record/source plane and raw-byte census changed')
    first_gap=gaps[0]
    previous_tail=totals['bytes']-sum(r['recordLength'] for r in rows
                                       if r['sourceRecordOrdinalWithinRegion']==0)
    if canonical:require(previous_tail==1611110,'P75 trailing source bytes still unaccounted for')
    manifest={
        'format':FORMAT,'originalSourcePath':'DATA.MK3',
        'originalSourceWholeSha256':p73.sha(source),
        'sourceFingerprintVerified':p73.sha(source)==p73.DATA_SHA256,
        'originalIffFormCount':len(forms),
        'nonIffRegionCountIncludingUnresolvedLead':len(gaps),
        'unresolvedOriginalLeadingGapBytes':first_gap['length'],
        'chainedIndexedRegionCount':len(groups),
        'sourceRecordCount':len(rows),'previouslyRecoveredP75FirstRecords':len(groups),
        'additionalSourceRecordsAfterP75':len(rows)-len(groups),
        'sourceRecordCountByRegion':groups,
        'allNineteenSourceChainsFullyTiled':True,
        'previousP75UndecodedPostTableBytesNowTiled':previous_tail,
        'newlyChainedUndecodedTrailingBytes':0,
        'sourceTotalIndexedPositionsPerPlane':totals['pixels'],
        'sourcePaintedPixelCount':totals['painted'],
        'sourceRows':totals['sourceRows'],'sourceMinusOneRows':totals['absent'],
        'sourceAdditionalIndexedPositionsPerPlane':totals['additionalPixels'],
        'sourceAdditionalPaintedPixels':totals['additionalPainted'],
        'sourceAdditionalMinusOneRows':totals['additionalAbsent'],
        'originalNonIffFirstRegionStillUnresolved':True,
        'originalByteFallbackPreserved':True,
        'nativePaletteOwnershipVerified':False,
        'nativeStageOrAnimationAssociationVerified':False,
        'applicationCatalogueModified':False,
        'records':rows,
    }
    files.extend([
        ('manifest.json',(json.dumps(manifest,indent=2)+'\n').encode()),
        ('README.txt',(
            'P77 SOURCE indexed graphics: 216 source records from 19 non-IFF regions.\n'
            '197 additional original source records beyond P75. All original first\n'
            'streams and both row tables retained; indexing/masks not RGB colors.\n'
            'Source-table image geometry and transparent -1 rows are INFERRED,\n'
            'not verified as original DOS EXE renderer behavior.\n'
            'Original adjacent RGB8 is comparison-only; native palette UNKNOWN.\n'
            'No invented stage membership, animation timing, order or character.\n'
            'The original 1,840,634-byte leading non-IFF region remains UNKNOWN.\n'
            'Private copyrighted original-derived data: do not commit this ZIP.\n').encode()),
    ])
    return manifest,files


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('original_mk3',type=Path)
    ap.add_argument('private_output_zip',type=Path)
    a=ap.parse_args()
    require(not a.private_output_zip.exists(),'private ZIP already exists; refuse overwrite')
    report,entries=extract(p73.read_original_data(a.original_mk3))
    a.private_output_zip.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(a.private_output_zip,'x',compression=zipfile.ZIP_DEFLATED) as z:
        for name,data in entries:z.writestr(name,data)
    print(json.dumps({'pass':'P77','status':'PASS',
        'originalSourceSha256':report['originalSourceWholeSha256'],
        'sourceIndexedRecords':report['sourceRecordCount'],
        'additionalSourceIndexedRecords':report['additionalSourceRecordsAfterP75'],
        'indexedPositionsPerPlane':report['sourceTotalIndexedPositionsPerPlane'],
        'paintedSourcePixels':report['sourcePaintedPixelCount'],
        'originalP75PostTableBytesFullyTiled':report['previousP75UndecodedPostTableBytesNowTiled'],
        'originalLeadingNonIffRegionDecoded':False,
        'nativePaletteOrStageOrSequenceVerified':False,
        'privateOutput':str(a.private_output_zip)}))


if __name__=='__main__':main()
