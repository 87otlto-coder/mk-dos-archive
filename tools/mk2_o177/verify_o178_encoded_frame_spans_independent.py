#!/usr/bin/env python3
"""Independent O178 report audit: byte-checks original EXE+GRA, source control lists and spans.
Not importing producer or assuming the JSON report itself is trustworthy.
"""
import argparse, hashlib, json, struct
from pathlib import Path
sha=lambda v:hashlib.sha256(v).hexdigest()
GRA_IDS={'tomb':28,'portal':25,'tower':30}
OBJECT2_FILE=0xa0c54
LIST_ROOTS={'tomb_flying_a':0x17814,'tomb_flying_b':0x177ec,'portal_swaying':0x164b4,'portal_hanging':0x164d8,'portal_electric':0x164f8,'tower_original_effect':0x16490}
def verify(exe_path,gra_paths,report_path):
    exe=Path(exe_path).read_bytes();report=json.loads(Path(report_path).read_text());assert sha(exe)==report['sourceEXE_SHA256']=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
    assert report['schema']=='mk2_o178_original_effect_encoded_source_span_no_edit_preflight_v1'
    assert report['status']=='SOURCE_VALIDATED_NO_EDIT_ONLY' and report['totalOriginalFrames']==43
    assert all(report[k] is False for k in ['variableLengthRepackAllowed','modifiedEncodedStreamsAllowed','relocationAllowed','runtimeAnimationObserved'])
    assert set(r['stage'] for r in report['stages'])==set(GRA_IDS)
    verified=0;checks=5
    for group in report['stages']:
        stage=group['stage'];gra=Path(gra_paths[stage]).read_bytes();assert sha(gra)==group['originalResourceSHA256'] and len(gra)==group['originalResourceLength'];checks+=1
        assert group['resourceId']==GRA_IDS[stage] and group['frameCount']==len(group['spans']);checks+=1
        spans=sorted(group['spans'],key=lambda r:r['start']);assert (spans[0]['start'],spans[-1]['endExclusive'])==(group['contiguousSourceStart'],group['contiguousSourceEndExclusive']);checks+=1
        assert sum(s['byteLength'] for s in spans)==group['contiguousSourceByteLength'];checks+=1
        changed=bytearray(gra);last=None
        for span in spans:
            start,end=span['start'],span['endExclusive'];assert 0<=start<end<=len(gra) and end-start==span['byteLength'];checks+=1
            if last is not None:assert start==last;checks+=1
            d=span['descriptorObject2'];off=OBJECT2_FILE+d
            w,h,x,y,packed=struct.unpack_from('<HHhhI',exe,off)
            assert (packed>>24)==GRA_IDS[stage] and (packed&0xffffff)==start;checks+=1
            root=LIST_ROOTS[span['track']];ordinal=span['ordinal']
            # Two canonical Tomb lists, three Portal and one Tower list are individually rooted in original EXE.
            assert struct.unpack_from('<I',exe,OBJECT2_FILE+root+4*ordinal)[0]==d,'source pointer list mismatch';checks+=1
            assert sha(gra[start:end])==span['encodedSegmentSHA256'],'source fragment mismatch';checks+=1
            changed[start:end]=gra[start:end];last=end;verified+=1
        assert sha(changed)==group['noEditWholeResourceRebuiltSHA256']==sha(gra),'non-lossless no-edit round trip';checks+=1
        assert group['exactNoEditWholeResourceRoundTrip'] is True and group['sourceSegmentsNonOverlappingAndGapless'] is True;checks+=1
    assert verified==43;checks+=1
    return {'status':'PASS_INDEPENDENT_O178_SOURCE_RLE_SPANS','sourceFrames':verified,'stages':3,'assertions':checks}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--tomb',required=True);p.add_argument('--portal',required=True);p.add_argument('--tower',required=True);p.add_argument('--report',required=True);a=p.parse_args()
    print(json.dumps(verify(a.exe,{'tomb':a.tomb,'portal':a.portal,'tower':a.tower},a.report),indent=2))
