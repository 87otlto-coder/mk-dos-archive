#!/usr/bin/env python3
"""Independent original DATA.MK3 readback for P80 browser indexed ZIP and
first/empty raw record downloads. Does not import any P80 implementation.
No commercial original/extracted bytes written to Git.
"""
import argparse
import hashlib
import io
import json
import struct
import zipfile
from pathlib import Path
from PIL import Image
from verify_mk3_p75_noniff_independent import load_data,original_noniff_regions,CANON_SHA

def req(ok,reason):
    if not ok:raise ValueError('Independent P80 original Chrome: '+reason)

def sha(buf):
    return hashlib.sha256(buf).hexdigest()

def validate(src,zip_path,raw_first,raw_empty):
    req(sha(src)==CANON_SHA,'unsupported original DOS source sha256')
    forms,gaps=original_noniff_regions(src)
    req(len(forms)==416 and len(gaps)==20,'original source extent census')
    start,end=gaps[0]
    req((start,end)==(667866,2508500),'original leading non-IFF source location')
    count,width,height=struct.unpack_from('<HHH',src,start)
    reserved,nbytes=struct.unpack_from('<II',src,start+774)
    req((count,width,height,reserved,nbytes)==(216,320,200,0,64000),
        'source first image record header')
    index_at=start+782
    indices=src[index_at:index_at+nbytes]
    candidate=src[start+6:start+774]
    req(sha(indices)=='3553eead898a40d15788ef8072634cef04b2047cf7d4055682e7129aa6e7dd2e',
        'base source index sha256')
    cursor=index_at+nbytes
    records=[]
    for i in range(count):
        req(cursor+14<=end,'truncated original continuation header')
        tag,a,b,n=struct.unpack_from('<HIII',src,cursor)
        finish=cursor+14+n
        req(tag==3 and finish<=end,'invalid original continuation')
        req(n!=0 or (a,b)==(0,0),'empty record auxiliary evidence')
        records.append((cursor,finish,a,b,n))
        cursor=finish
    req(cursor==end and len(records)==216,'source record chain must exactly tile interval')
    req([i for i,(_,_,_,_,length) in enumerate(records) if length==0]
        ==[120,121,122,123,124,125],'original empty source ordinal range')
    with zipfile.ZipFile(zip_path) as z:
        req(z.testzip() is None,'browser ZIP CRC mismatch')
        files=z.namelist()
        req(len(files)==len(set(files))==4,'indexed evidence ZIP exact member census')
        manifest=json.loads(z.read('manifest.json'))
        req(manifest['format']=='mkdos_selected_assets_v1' and
            len(manifest['selectionOrder'])==1,'selected asset manifest')
        a=manifest['selectionOrder'][0]; m=a['metadata']
        req(a['source']['sha256']==CANON_SHA and
            a['source']['offset']==index_at and
            a['source']['length']==64000 and
            (a['width'],a['height'])==(320,200),'base index original source offset')
        req(m['sourceFormat']=='MK3_P80_ORIGINAL_LEADING_INDEX_AND_RAW_RECORDS_V1' and
            m['originalLeadingSpanOffset']==start and
            m['originalLeadingSpanLength']==end-start and
            m['sourceBaseIndexOffset']==index_at and
            m['originalStoredRecordCount']==216,'source header and record provenance')
        req(m['palette']=='UNKNOWN' and 'paletteRgb' not in m and
            m['previewOpaqueForDisplayOnly'] is True and
            m['originalOpacityVerified'] is False and
            m['nativePaletteOwnershipVerified'] is False and
            m['nativeStageMembershipVerified'] is False and
            m['continuationFramesDecoded'] is False and
            m['nativeAnimationTimingVerified'] is False and
            m['candidateColorsNotAppliedToPreview'] is True,
            'unverified original alpha/color/stage/animation claims')
        req(not any(f.endswith('_mask.bin') for f in files),
            'fabricated original opacity mask sidecar')
        ind=[n for n in files if n.startswith('indexed/') and n.endswith('_indices.bin')]
        colors=[n for n in files if n.startswith('indexed/') and n.endswith('_sourceAdjacentRgb8Candidate.bin')]
        png=[n for n in files if n.startswith('assets/') and n.endswith('.png')]
        req(len(ind)==len(colors)==len(png)==1,'unique source index/candidate/PNG')
        req(z.read(ind[0])==indices and z.read(colors[0])==candidate,
            'indexed ZIP source indices or unlabeled candidate differs')
        with Image.open(io.BytesIO(z.read(png[0]))) as picture:
            req(picture.size==(320,200) and picture.format=='PNG','PNG original dimensions')
            raw=picture.convert('RGBA').tobytes()
        expected=bytearray(4*len(indices))
        for i,index in enumerate(indices):
            c=32+(int(index)*223+127)//255
            expected[i*4:i*4+4]=bytes([c,c,c,255])
        req(raw==bytes(expected),'source grayscale/index PNG pixel-by-pixel parity')
    for ordinal,p in [(0,raw_first),(120,raw_empty)]:
        begin,finish,a,b,n=records[ordinal]
        actual=Path(p).read_bytes()
        req(actual==src[begin:finish],'downloaded raw original record '+str(ordinal))
        req(len(actual)==14+n,'original record complete header+payload length')
    req(records[120][4]==0 and len(Path(raw_empty).read_bytes())==14,
        'empty record must not be discarded')
    return {'pass':'P80_BROWSER_INDEPENDENT','status':'PASS',
        'originalSourceSHA256':CANON_SHA,
        'originalSourceIndexedPositions':64000,
        'originalPNGPixelPositionsChecked':64000,
        'indexedSourceEvidenceFieldsChecked':2,
        'allOriginalRawRecordBoundariesVerified':216,
        'downloadedOriginalRawRecordsByteExact':2,
        'originalEmptyStoredRecordsPreserved':6,
        'unknownNativePaletteAndOpacityPreserved':True,
        'nativeContinuationFramesAsserted':False,
        'sourceZipAndRawExportOriginalParity':True}

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('original_mk3',type=Path)
    ap.add_argument('chrome_indexed_zip',type=Path)
    ap.add_argument('chrome_raw_000',type=Path)
    ap.add_argument('chrome_raw_120',type=Path)
    x=ap.parse_args()
    print(json.dumps(validate(load_data(x.original_mk3),
       x.chrome_indexed_zip,x.chrome_raw_000,x.chrome_raw_120)))
if __name__=='__main__':main()
