#!/usr/bin/env python3
"""P78 independent original DOS MK3 browser-downloaded chained indexed ZIP.

Verifies one real Chrome P78 recovered record against original source record
two of original DATA.MK3 non-IFF region one. Does not import P78 code.
"""
import argparse
import json
from pathlib import Path
import struct
import zipfile
from verify_mk3_p75_noniff_independent import (
    load_data, original_noniff_regions, independent_row_decode,
    png_readback,sha,CANON_SHA,
)

def require(ok,why):
    if not ok:raise ValueError('P78 original browser ZIP: '+why)

def source_record(data,at,end):
    require(at+792<=end,'source record header')
    w,h=struct.unpack_from('<HH',data,at)
    packed=struct.unpack_from('<I',data,at+20)[0]
    s=at+792;x=s+packed;p=x+4*h;tail=p+4*h
    require(1<=w<=2048 and 1<=h<=1024 and w*h<=1_000_000 and
            packed>=2 and tail<=end,'source record limits')
    xs=struct.unpack_from('<'+'i'*h,data,x)
    offsets=struct.unpack_from('<'+'I'*h,data,p)
    indices,mask,painted,active,last=independent_row_decode(
        data,s,packed,w,h,xs,offsets)
    return {'offset':at,'end':tail,'w':w,'h':h,'packed':packed,
            's':s,'x':x,'p':p,'indices':indices,'mask':mask,'painted':painted,
            'absent':h-active,'tail':last,'stream':data[s:x],
            'rowX':data[x:p],'rowPointer':data[p:tail],
            'candidate':data[at+24:s]}

def verify(original,download):
    require(sha(original)==CANON_SHA,'unrecognized original DOS DATA.MK3')
    forms,gaps=original_noniff_regions(original)
    require(len(forms)==416 and len(gaps)==20,'original source IFF/non-IFF inventory')
    a,b=gaps[1]
    first=source_record(original,a,b)
    second=source_record(original,first['end'],b)
    with zipfile.ZipFile(download) as z:
        require(z.testzip() is None,'browser ZIP CRC integrity')
        names=z.namelist()
        require(len(names)==len(set(names))==8,'unique browser indexed export inventory')
        manifest=json.loads(z.read('manifest.json'))
        require(manifest['format']=='mkdos_selected_assets_v1' and
                len(manifest['selectionOrder'])==1,'selected source-image manifest')
        asset=manifest['selectionOrder'][0]
        meta=asset['metadata']
        require(asset['source']['sha256']==CANON_SHA and
                asset['source']['path'].upper().endswith('DATA.MK3') and
                asset['source']['offset']==second['offset'] and
                asset['source']['length']==second['end']-second['offset'],
                'P78 browser original source identity and exact record interval')
        require(asset['width']==second['w'] and asset['height']==second['h'],
                'original source dimensions')
        require(meta['sourceRecordFormat']=='MK3_P78_ADDITIONAL_CHAINED_SOURCE_INDEXED_V1' and
                meta['sourceRowMapFormat']=='MK3_P76_SOURCE_ROW_MAPPED_INDEXED_V1' and
                meta['originalNonIffRegionOrdinal']==1 and
                meta['sourceRecordOrdinalWithinRegion']==1 and
                meta['sourceFirstP76Offset']==a and
                meta['sourceRecordEndOffset']==second['end'] and
                meta['sourceFirstStreamOffset']==second['s'] and
                meta['sourceFirstStreamLength']==second['packed'] and
                meta['sourceRowXTableOffset']==second['x'] and
                meta['sourceRowPointerTableOffset']==second['p'] and
                meta['sourceAbsentRows']==second['absent'] and
                meta['sourcePaintedPixels']==second['painted'] and
                meta['unexplainedFinalSourceByteHex']==second['tail'].hex(),
                'P78 indexed record source-row metadata mismatch')
        require(meta['palette']=='UNKNOWN' and
                'paletteRgb' not in meta and
                meta['candidateColorsNotAppliedToPreview'] is True and
                meta['nativePaletteOwnershipVerified'] is False and
                meta['originalRendererPlacementVerified'] is False and
                meta['originalStageOrAnimationMembershipVerified'] is False and
                meta['sourceRecordOrderIsNotNativeAnimationOrder'] is True,
                'unsupported native palette, stage, renderer or timing assignment')
        evidence={
          'indices':second['indices'],
          'mask':second['mask'],
          'firstStream':second['stream'],
          'rowXTable':second['rowX'],
          'rowPointerTable':second['rowPointer'],
          'sourceAdjacentRgb8Candidate':second['candidate'],
        }
        for field,original_bytes in evidence.items():
            paths=[name for name in names if name.startswith('indexed/') and
                   name.endswith('_'+field+'.bin')]
            require(len(paths)==1 and z.read(paths[0])==original_bytes,
                    'original indexed bytes/source table differ: '+field)
        images=[name for name in names if name.startswith('assets/') and
                name.lower().endswith('.png')]
        require(len(images)==1,'one source index grayscale PNG')
        w,h,rgba=png_readback(z.read(images[0]))
        require((w,h)==(second['w'],second['h']),'PNG geometry')
        for i,opaque in enumerate(second['mask']):
            pixel=rgba[4*i:4*i+4]
            if opaque:
                g=32+(second['indices'][i]*223+127)//255
                require(pixel==bytes((g,g,g,255)),'original indexed PNG grayscale pixel')
            else:require(pixel==b'\0\0\0\0','transparent source absence PNG pixel')
    return {'pass':'P78_BROWSER_INDEPENDENT','status':'PASS',
        'sourceOriginalSha256':CANON_SHA,
        'originalRegionOrdinal':1,'sourceRecordOrdinal':1,
        'originalIndexedPositions':len(second['indices']),
        'originalPaintedPixels':second['painted'],
        'binaryEvidenceSidecarsChecked':len(evidence),
        'originalSourceAndPngPixelwiseParity':True,
        'sourceRowPlacementIsNativeExeVerified':False,
        'nativePaletteOrAnimationOrStageClaimed':False}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('original_mk3',type=Path)
    p.add_argument('browser_downloaded_zip',type=Path)
    a=p.parse_args()
    print(json.dumps(verify(load_data(a.original_mk3),a.browser_downloaded_zip)))

if __name__=='__main__':main()
