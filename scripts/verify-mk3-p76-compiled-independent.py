#!/usr/bin/env python3
"""Original-only independent PNG/sidecar validation of 19 built P76 ZIP exports.

Requires private original P75 ZIP and compiled-production-export folder; never
writes source game media to the Git repository. Python Pillow required.
"""
from __future__ import annotations
import argparse
import hashlib
import io
import json
from pathlib import Path
import zipfile
from PIL import Image

ORIGINAL_SHA = '72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517'
SIDECARS = {
    'indices': 'sourceMappedIndices',
    'mask': 'sourceMappedOpacityMask',
    'firstStream': 'firstCompressedStream',
    'rowXTable': 'sourceRowXTable',
    'rowPointerTable': 'sourceRowOffsetTable',
    'sourceAdjacentRgb8Candidate': 'adjacentUnlabeledRgb8Candidate',
}

def require(ok, why):
    if not ok:
        raise ValueError('P76 independent compiled bundle: ' + why)

def sha(b):
    return hashlib.sha256(b).hexdigest()

def verify(p75_zip: Path, exports: Path):
    count = positions = sidecars = checked_bytes = members = 0
    with zipfile.ZipFile(p75_zip) as ref:
        require(ref.testzip() is None, 'P75 private oracle ZIP CRC')
        manifest=json.loads(ref.read('manifest.json'))
        require(manifest['originalSourceWholeSha256']==ORIGINAL_SHA,
                'P75 original source fingerprint is not recognized')
        records=manifest['records']
        require(len(records)==19, 'P75 original 19-region census')
        for i, record in enumerate(records, 1):
            exported=exports / f'region-{i:02d}-indexed.zip'
            require(exported.is_file(), f'P76 compiled export {i} not found')
            with zipfile.ZipFile(exported) as z:
                require(z.testzip() is None, f'P76 region {i} ZIP CRC')
                names=z.namelist()
                require(len(names)==len(set(names))==8, f'P76 region {i} ZIP census/duplicates')
                root=json.loads(z.read('manifest.json'))
                require(root['format']=='mkdos_selected_assets_v1' and
                        len(root['selectionOrder'])==1, f'P76 region {i} selected asset manifest')
                a=root['selectionOrder'][0]
                require(a['source']['sha256']==ORIGINAL_SHA and
                        a['source']['offset']==record['regionOffset'] and
                        a['source']['length']==record['regionLength'],
                        f'P76 region {i} original source provenance')
                require((a['width'],a['height'])==(record['width'],record['height']),
                        f'P76 region {i} image geometry')
                m=a['metadata']
                require(m['sourceRowMapFormat']=='MK3_P76_SOURCE_ROW_MAPPED_INDEXED_V1' and
                        m['palette']=='UNKNOWN' and m.get('paletteRgb') is None and
                        m['nativePaletteOwnershipVerified'] is False and
                        m['originalRendererPlacementVerified'] is False and
                        m['originalStageOrAnimationMembershipVerified'] is False and
                        m['candidateColorsNotAppliedToPreview'] is True,
                        f'P76 region {i} unverified native palette/renderer claim')
                require(m['originalNonIffRegionOrdinal']==i and
                        m['sourceUnparsedRemainderBytes']==record['sourceAfterRowTablesLength'] and
                        m['sourceAbsentRows']==record['sourceMinusOneRowsWithoutPackedData'] and
                        m['sourcePaintedPixels']==record['paintedPixels'] and
                        m['sourceRowXTableOffset']==record['sourceRowXTableOffset'] and
                        m['sourceRowPointerTableOffset']==record['sourceRowCompressedOffsetTableOffset'],
                        f'P76 region {i} original row metadata mismatch')
                for field, original_key in SIDECARS.items():
                    matches=[n for n in names if n.startswith('indexed/') and n.endswith('_'+field+'.bin')]
                    require(len(matches)==1, f'P76 region {i} unique ZIP sidecar: {field}')
                    actual=z.read(matches[0]);expected=ref.read(record['outputs'][original_key]['path'])
                    require(actual==expected and sha(actual)==record['outputs'][original_key]['sha256'],
                            f'P76 region {i} original sidecar bytes differ: {field}')
                    checked_bytes+=len(actual);sidecars+=1
                pngs=[n for n in names if n.startswith('assets/') and n.lower().endswith('.png')]
                require(len(pngs)==1, f'P76 region {i} grayscale PNG count')
                with Image.open(io.BytesIO(z.read(pngs[0]))) as picture, Image.open(
                     io.BytesIO(ref.read(record['outputs']['grayscaleIndexedPreview']['path']))) as truth:
                    require(picture.size==truth.size and picture.convert('RGBA').tobytes()==truth.convert('RGBA').tobytes(),
                            f'P76 region {i} independent source RGBA PNG mismatch')
                positions+=record['width']*record['height'];count+=1;members+=len(names)
    require(count==19 and positions==2050843 and sidecars==114 and members==152,
            'P76 original source and ZIP acceptance census changed')
    return {'pass':'P76_COMPILED_INDEPENDENT','status':'PASS',
            'originalDATA_MK3_SHA256':ORIGINAL_SHA,
            'compiledIndexedZipFiles':count,'uniqueZipEntries':members,
            'originalSidecarsByteIdentical':sidecars,'originalSidecarBytesVerified':checked_bytes,
            'compiledPngPixelsSourceMatched':positions,
            'originalRuntimeRendererVerified':False,'nativePaletteOwnershipVerified':False,
            'realChromeBrowserWorkflowVerified':False,'fullOriginalMK3CatalogScannerReExecuted':False}

if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('private_p75_oracle_zip',type=Path)
    ap.add_argument('private_production_indexed_zips_dir',type=Path)
    a=ap.parse_args()
    print(json.dumps(verify(a.private_p75_oracle_zip,a.private_production_indexed_zips_dir)))
