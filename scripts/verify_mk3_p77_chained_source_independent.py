#!/usr/bin/env python3
"""P77 independent original-DOS/source/216-image/432-PNG ZIP oracle.

Does NOT import P77 production exporter. Reuses the independently accepted
P75 source FORM and row-command oracle, and P74 independent PNG/CRC reader.
P75 original first-image private archive is cross-compared at all 19 offsets.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import struct
import zipfile
import verify_mk3_p75_noniff_independent as independent

FORMAT='mk3_p77_noniff_chained_row_mapped_indexed_records_v1'
COUNT_PER_SOURCE_REGION=(2,11,50,16,5,2,6,1,4,19,4,5,5,28,2,1,4,12,39)


def require(ok,why):
    if not ok:raise ValueError('Independent P77: '+why)


def render(indices:bytes,mask:bytes,candidate:bytes|None):
    rgba=bytearray(4*len(indices))
    for i,index in enumerate(indices):
        if mask[i]:
            if candidate is None:
                gray=32+(index*223+127)//255
                rgba[i*4:i*4+3]=bytes((gray,gray,gray))
            else:rgba[i*4:i*4+3]=candidate[3*index:3*index+3]
            rgba[i*4+3]=255
    return bytes(rgba)


def verify(original:bytes,p77_zip:Path,p75_zip:Path):
    require(independent.sha(original)==independent.CANON_SHA,'wrong original DATA.MK3 SHA256')
    forms,gaps=independent.original_noniff_regions(original)
    require(len(forms)==416 and len(gaps)==20 and gaps[0][1]-gaps[0][0]==1840634,
            'source FORM and unresolved leading interval census')
    counts={'records':0,'additional':0,'positions':0,'painted':0,
            'rows':0,'absent':0,'extraPositions':0,'extraPainted':0,
            'extraAbsent':0,'sourceBytes':0,'sidecars':0,'binaryBytes':0,
            'pngs':0,'oldParity':0}
    unique_planes=set()
    with zipfile.ZipFile(p77_zip) as z,zipfile.ZipFile(p75_zip) as earlier:
        require(z.testzip() is None and earlier.testzip() is None,'original private ZIP CRC error')
        require(len(z.namelist())==1730 and len(set(z.namelist()))==1730,
                'private P77 ZIP member inventory/duplicates')
        manifest=json.loads(z.read('manifest.json'))
        prior=json.loads(earlier.read('manifest.json'))
        require(manifest['format']==FORMAT and
                manifest['originalSourceWholeSha256']==independent.CANON_SHA and
                manifest['sourceFingerprintVerified'] is True and
                manifest['nativePaletteOwnershipVerified'] is False and
                manifest['nativeStageOrAnimationAssociationVerified'] is False and
                manifest['applicationCatalogueModified'] is False,
                'source identity and unverified native/classification claims')
        require(tuple(manifest['sourceRecordCountByRegion'])==COUNT_PER_SOURCE_REGION and
                len(manifest['records'])==216 and len(prior['records'])==19,
                'source chained record ordinal/census')
        for region,(start,end) in enumerate(gaps[1:],1):
            at=start
            for ordinal in range(COUNT_PER_SOURCE_REGION[region-1]):
                require(at+792<=end,'source record header outside original interval')
                w,h=struct.unpack_from('<HH',original,at)
                packed=struct.unpack_from('<I',original,at+20)[0]
                stream_at=at+792;stream_end=stream_at+packed
                x_at=stream_end;pointer_at=x_at+h*4;next_at=pointer_at+h*4
                require(0<w<=2048 and 0<h<=1024 and w*h<=1000000 and
                        packed>=2 and next_at<=end,'source record geometry or row table bounds')
                xs=struct.unpack_from('<'+'i'*h,original,x_at)
                offsets=struct.unpack_from('<'+'I'*h,original,pointer_at)
                indices,mask,painted,active,tail=independent.independent_row_decode(
                    original,stream_at,packed,w,h,xs,offsets)
                rec=manifest['records'][counts['records']]
                require(rec['nonIffRegionOrdinal']==region and
                        rec['sourceRecordOrdinalWithinRegion']==ordinal and
                        rec['recordOffset']==at and rec['recordLength']==next_at-at and
                        rec['sourceNextRecordOffset']==next_at and
                        rec['width']==w and rec['height']==h and
                        rec['sourceStreamOffset']==stream_at and
                        rec['sourceStreamLength']==packed and
                        rec['sourceRowXTableOffset']==x_at and
                        rec['sourceRowPointerTableOffset']==pointer_at and
                        rec['sourcePackedRows']==active and
                        rec['sourceMinusOneRows']==h-active and
                        rec['sourcePaintedPixels']==painted and
                        rec['unexplainedFinalByteHex']==tail.hex(),
                        'source record original geometry/stream/row correspondence')
                require(rec['nativePaletteOwnershipVerified'] is False and
                        rec['sourceAdjacentRgb8IsComparisonOnly'] is True and
                        rec['nativeStageOrAnimationAssociationVerified'] is False and
                        rec['notNativeAnimationFrameOrder'] is True,
                        'misleading original animation/stage/palette ownership')
                original_map={
                    'sourceCompressedFirstStream':original[stream_at:stream_end],
                    'sourceRowXTable':original[x_at:pointer_at],
                    'sourceRowPointerTable':original[pointer_at:next_at],
                    'sourceAdjacentUnlabeledRgb8':original[at+24:stream_at],
                    'sourceMappedIndices':indices,
                    'sourceMappedOpacityMask':mask,
                }
                outputs=rec['outputs']
                for key,expected in original_map.items():
                    field=outputs[key]
                    require(field['length']==len(expected) and
                            field['sha256']==independent.sha(expected) and
                            z.read(field['path'])==expected,
                            f'original record {region}/{ordinal} source bytes {key}')
                    counts['sidecars']+=1;counts['binaryBytes']+=len(expected)
                for kind,candidate in (
                    ('grayscaleIndexedPreview',None),
                    ('adjacentRgb8ExperimentOnlyPreview',original_map['sourceAdjacentUnlabeledRgb8']),
                ):
                    field=outputs[kind];image=z.read(field['path'])
                    require(len(image)==field['length'] and
                            independent.sha(image)==field['sha256'],
                            'original ZIP PNG SHA/length')
                    iw,ih,rgba=independent.png_readback(image)
                    require((iw,ih)==(w,h) and rgba==render(indices,mask,candidate),
                            f'216-record PNG pixel parity at {region}/{ordinal}')
                    counts['pngs']+=1
                if ordinal==0:
                    old=prior['records'][region-1]
                    require(old['regionOffset']==at,'original accepted P75 first record offset')
                    oldnames={'sourceCompressedFirstStream':'firstCompressedStream',
                              'sourceRowXTable':'sourceRowXTable',
                              'sourceRowPointerTable':'sourceRowOffsetTable',
                              'sourceAdjacentUnlabeledRgb8':'adjacentUnlabeledRgb8Candidate',
                              'sourceMappedIndices':'sourceMappedIndices',
                              'sourceMappedOpacityMask':'sourceMappedOpacityMask'}
                    for key,prior_key in oldnames.items():
                        require(earlier.read(old['outputs'][prior_key]['path'])==original_map[key],
                                'P77 first original record contradicts P75 independently verified source')
                        counts['oldParity']+=1
                else:
                    counts['additional']+=1
                    counts['extraPositions']+=w*h
                    counts['extraPainted']+=painted
                    counts['extraAbsent']+=h-active
                counts['records']+=1
                counts['positions']+=w*h
                counts['painted']+=painted
                counts['rows']+=h
                counts['absent']+=h-active
                counts['sourceBytes']+=next_at-at
                unique_planes.add((independent.sha(indices),independent.sha(mask)))
                at=next_at
            require(at==end,'original non-IFF region must be exactly tiled')
        require(counts=={
            'records':216,'additional':197,'positions':8667438,'painted':2164384,
            'rows':24811,'absent':8746,'extraPositions':6616595,
            'extraPainted':1167687,'extraAbsent':8475,'sourceBytes':2692152,
            'sidecars':1296,'binaryBytes':20021844,'pngs':432,'oldParity':114},
            'original source/indexed/row/PNG/P75 statistics mismatch')
        require(manifest['previousP75UndecodedPostTableBytesNowTiled']==1611110 and
                manifest['newlyChainedUndecodedTrailingBytes']==0 and
                manifest['unresolvedOriginalLeadingGapBytes']==1840634 and
                manifest['originalNonIffFirstRegionStillUnresolved'] is True,
                'original unresolved source interval claims misrepresented')
    return {'pass':'P77_INDEPENDENT','status':'PASS',
            'originalSourceSha256':independent.CANON_SHA,
            'sourceChainedRecords':counts['records'],
            'newOriginalSourceRecordsBeyondP75':counts['additional'],
            'uniqueIndexedAndMaskPlanes':len(unique_planes),
            'sourceIndexedPositionsPerPlane':counts['positions'],
            'sourcePaintedOriginalPixels':counts['painted'],
            'sourceMissingRows':counts['absent'],
            'sourceImagesCheckedPixelByPixel':counts['pngs'],
            'sourceBinaryMembersExact':counts['sidecars'],
            'sourceBytesOfIndexedAndOriginalEvidenceMatched':counts['binaryBytes'],
            'sourceFirstP75RecordsByteParity':counts['oldParity'],
            'originalP75PostTableBytesExhaustivelyTiled':1611110,
            'leadingNonIffBytesRemainUnresolved':1840634,
            'nativePaletteOrStageOrAnimationProven':False,
            'applicationCatalogueModified':False}


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('original_mk3',type=Path)
    ap.add_argument('p77_private_archive',type=Path)
    ap.add_argument('p75_private_prior_archive',type=Path)
    args=ap.parse_args()
    print(json.dumps(verify(independent.load_data(args.original_mk3),
                            args.p77_private_archive,args.p75_private_prior_archive)))


if __name__=='__main__':main()
