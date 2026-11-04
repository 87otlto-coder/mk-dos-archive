#!/usr/bin/env python3
"""O178 canonical-source-only no-edit preservation preflight for MK2 stage-effect streams.
Never emits original GRA bytes, alters source files, or licenses resize/relocation.
"""
import argparse, hashlib, json, struct
from pathlib import Path
EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
GRA_HASHES={'tomb':'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613','portal':'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82','tower':'7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8'}
IDS={'tomb':28,'portal':25,'tower':30}
OBJ2=0xa0c54
sha=lambda b:hashlib.sha256(b).hexdigest()
def run(exe_path,gra_paths,o136_path,o137_path):
    exe=Path(exe_path).read_bytes();assert len(exe)==861133 and sha(exe)==EXE_SHA,'noncanonical original EXE'
    gra={k:Path(p).read_bytes() for k,p in gra_paths.items()};assert set(gra)==set(IDS),'stage list'
    for k,b in gra.items():assert sha(b)==GRA_HASHES[k],'noncanonical original GRA '+k
    j=json.loads(Path(o136_path).read_text());tow=json.loads(Path(o137_path).read_text())
    stages={s:[] for s in gra};counts={}
    for t in j['tracks']:
        s=t['stage'];assert s in ('portal','tomb');counts[t['name']]=len(t['frames'])
        for f in t['frames']:
            stages[s].append((t['name'],f['ordinal'],f['descriptorObject2'],f['streamStart'],f['streamEndExclusive'],f['sourceStreamSHA256'],f['sourceWidth'],f['sourceHeight'],f['signedSourceX'],f['signedSourceY']))
    counts['tower_original_effect']=len(tow['frames'])
    for f in tow['frames']:
        stages['tower'].append(('tower_original_effect',f['frameOrdinal'],f['originalDescriptorObject2'],f['sourceOffset'],f['sourceEndExclusive'],f['sourceStreamSHA256'],f['originalWidth'],f['originalHeight'],f['originalX'],f['originalY']))
    assert len(counts)==6 and sum(counts.values())==43
    stage_reports=[];checks=0
    for stage,source in stages.items():
        ordered=sorted(source,key=lambda item:item[3]);original=gra[stage];last=None;spans=[]
        clone=bytearray(original)
        for t,i,d,a,b,h,w,he,x,y in ordered:
            assert 0<=a<b<=len(original),'out-of-range encoded segment';checks+=1
            if last is not None:assert a==last,'gap/overlap in original effect segment';checks+=1
            da=OBJ2+d
            assert da+12<=len(exe),'descriptor out of file';checks+=1
            dw,dh,dx,dy,packed=struct.unpack_from('<HHhhI',exe,da)
            assert (dw,dh,dx,dy,packed>>24,packed&0xffffff)==(w,he,x,y,IDS[stage],a),'EXE/GRA descriptor mismatch';checks+=1
            assert sha(original[a:b])==h,'original source RLE checksum';checks+=1
            clone[a:b]=original[a:b]  # intentionally zero edits: prove exact preservation
            spans.append({'track':t,'ordinal':i,'descriptorObject2':d,'start':a,'endExclusive':b,'byteLength':b-a,'encodedSegmentSHA256':h})
            last=b
        assert sha(clone)==sha(original),'failed no-edit whole-GRA reconstruction';checks+=1
        stage_reports.append({'stage':stage,'resourceId':IDS[stage],'originalResourceSHA256':sha(original),'originalResourceLength':len(original),'frameCount':len(spans),'contiguousSourceStart':ordered[0][3],'contiguousSourceEndExclusive':ordered[-1][4], 'contiguousSourceByteLength':ordered[-1][4]-ordered[0][3], 'sourceSegmentsNonOverlappingAndGapless':True,'noEditWholeResourceRebuiltSHA256':sha(clone),'exactNoEditWholeResourceRoundTrip':True,'spans':spans})
    return {'schema':'mk2_o178_original_effect_encoded_source_span_no_edit_preflight_v1','status':'SOURCE_VALIDATED_NO_EDIT_ONLY','sourceEXE_SHA256':EXE_SHA,'totalOriginalFrames':43,'stages':stage_reports,'allSourceSegmentHashesVerified':True,'allSourceSpansDisjointAndContiguousPerResource':True,'allFullGRA_NoEditRoundTripsExact':True,'variableLengthRepackAllowed':False,'modifiedEncodedStreamsAllowed':False,'relocationAllowed':False,'runtimeAnimationObserved':False,'checks':checks}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--tomb',required=True);p.add_argument('--portal',required=True);p.add_argument('--tower',required=True);p.add_argument('--o136',required=True);p.add_argument('--o137',required=True);p.add_argument('--out',required=True);a=p.parse_args()
    report=run(a.exe,{'tomb':a.tomb,'portal':a.portal,'tower':a.tower},a.o136,a.o137)
    out=Path(a.out);assert not out.exists(),'refusing overwrite';out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':report['status'],'checks':report['checks'],'frames':43,'perStage':[{'stage':r['stage'],'frames':r['frameCount'],'contiguousBytes':r['contiguousSourceByteLength']} for r in report['stages']]},indent=2))
