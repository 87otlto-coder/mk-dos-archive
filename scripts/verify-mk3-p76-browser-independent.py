#!/usr/bin/env python3
"""Independent ORIGINAL MK3 source check of P76 Chrome-downloaded indexed ZIP.

Does NOT import P76 TypeScript or Python P75 exporter. Original source bytes
are compared against indexed/mask/row streams and decoded PNG pixels.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import struct
import zipfile

from PIL import Image
from verify_mk3_p75_noniff_independent import (
    original_noniff_regions, independent_row_decode, load_data,
)

SHA = '72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517'


def check(ok, what):
    if not ok:
        raise ValueError('P76 Chrome original indexed ZIP: '+what)


def main():
    a=argparse.ArgumentParser(description=__doc__)
    a.add_argument('original_mk3',type=Path)
    a.add_argument('browser_downloaded_indexed_zip',type=Path)
    args=a.parse_args()
    data=load_data(args.original_mk3)
    check(hashlib.sha256(data).hexdigest()==SHA,'original DATA.MK3 SHA-256 mismatch')
    forms,gaps=original_noniff_regions(data)
    check(len(forms)==416 and len(gaps)==20,'IFF/non-IFF source census')
    region_start,region_end=gaps[1]
    width,height=struct.unpack_from('<HH',data,region_start)
    packed_len=struct.unpack_from('<I',data,region_start+20)[0]
    stream_start=region_start+792
    stream_end=stream_start+packed_len
    rowx_end=stream_end+height*4
    rows_end=rowx_end+height*4
    check(rows_end<=region_end,'source row arrays extend past region')
    lefts=struct.unpack_from('<'+str(height)+'i',data,stream_end)
    offsets=struct.unpack_from('<'+str(height)+'I',data,rowx_end)
    indices,mask,painted,packed_rows,tail=independent_row_decode(
        data,stream_start,packed_len,width,height,lefts,offsets)
    oracle={
        'indices':indices,'mask':mask,
        'firstStream':data[stream_start:stream_end],
        'rowXTable':data[stream_end:rowx_end],
        'rowPointerTable':data[rowx_end:rows_end],
        'sourceAdjacentRgb8Candidate':data[region_start+24:stream_start],
    }
    with zipfile.ZipFile(args.browser_downloaded_indexed_zip) as z:
        check(z.testzip() is None,'invalid ZIP CRC')
        names=z.namelist()
        check(len(names)==len(set(names)),'duplicate ZIP members')
        manifest=json.loads(z.read('manifest.json'))
        check(manifest['format']=='mkdos_selected_assets_v1' and
              len(manifest['selectionOrder'])==1,'selected indexed ZIP manifest')
        asset=manifest['selectionOrder'][0]
        m=asset['metadata']
        check(m['sourceRowMapFormat']=='MK3_P76_SOURCE_ROW_MAPPED_INDEXED_V1' and
              m['palette']=='UNKNOWN' and m['visualization']=='GRAYSCALE_INDEX_MAP' and
              m['nativePaletteOwnershipVerified'] is False and
              m['originalRendererPlacementVerified'] is False and
              m['originalStageOrAnimationMembershipVerified'] is False,
              'native ownership or source identity accidentally promoted')
        check(asset['source']['path'].upper().endswith('DATA.MK3') and
              asset['source']['sha256']==SHA and
              asset['source']['offset']==region_start and
              asset['source']['length']==region_end-region_start,
              'original source interval/identity wrong')
        check(m['originalNonIffRegionOrdinal']==1 and
              m['sourceRowXTableOffset']==stream_end and
              m['sourceRowPointerTableOffset']==rowx_end and
              m['sourceUnparsedRemainderBytes']==region_end-rows_end and
              m['sourceAbsentRows']==height-packed_rows and
              m['sourcePaintedPixels']==painted,
              'source mapping and missing-row metadata mismatch')
        for field,expected in oracle.items():
            matches=[n for n in names if n.startswith('indexed/') and
                     n.endswith('_'+field+'.bin')]
            check(len(matches)==1,'missing or duplicated indexed '+field)
            check(z.read(matches[0])==expected,'source bytes differ: '+field)
        graphics=[n for n in names if n.startswith('assets/') and n.lower().endswith('.png')]
        check(len(graphics)==1,'expected one indexed grayscale preview PNG')
        with Image.open(io.BytesIO(z.read(graphics[0]))) as img:
            check(img.size==(width,height),'PNG geometry mismatch')
            rgba=img.convert('RGBA').tobytes()
        check(len(rgba)==width*height*4,'RGBA count')
        for n,visible in enumerate(mask):
            pixel=rgba[n*4:n*4+4]
            if visible:
                c=32+round(indices[n]*223/255)
                check(pixel==bytes((c,c,c,255)),'source grayscale PNG pixel mismatch')
            else:
                check(pixel==b'\0\0\0\0','transparent pixel must be zero RGBA')
    print(json.dumps({
        'pass':'P76_BROWSER_INDEPENDENT','status':'PASS',
        'sourceOriginalSha256':SHA,
        'sourceNonIffRegionOrdinal':1,
        'indexedPixelsChecked':len(indices),
        'packedRows':packed_rows,'explicitPaintedPixels':painted,
        'originalStreamAndTwoRowTablesAndRgbCandidateMatched':True,
        'sourceAlphaAndGrayscalePngMatched':True,
        'nativePaletteOrRuntimeClaimsVerified':False,
    }))


if __name__=='__main__':main()
