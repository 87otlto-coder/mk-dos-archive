#!/usr/bin/env python3
"""O180: one source-index literal edit/reverse proof per original stage-effect frame.
Each independent edit is tested on a private in-memory clone; no GRA output is emitted.
No gameplay/compiler/runtime claims.
"""
import argparse,hashlib,json
from pathlib import Path
from compile_o179_literal_source_pixel_edit import do_edit
sha=lambda b:hashlib.sha256(b).hexdigest()
def run(exe,gra_paths,o136,o137):
    source=json.loads(Path(o136).read_text());tower=json.loads(Path(o137).read_text());rows=[]
    tasks=[(t['stage'],t['name'],i,o136) for t in source['tracks'] for i in range(len(t['frames']))]
    tasks.extend(('tower','tower_original_effect',i,o137) for i in range(len(tower['frames'])))
    assert len(tasks)==43
    for stage,track,ordinal,manifest in tasks:
        _,r=do_edit(exe,gra_paths[stage],manifest,stage,track,ordinal)
        assert r['sourcePixelChangeVerified'] is True and r['gameplayEffectVerified'] is False
        assert r['graSourceSHA256']==r['wholeResourceReverseSHA256']
        rows.append(r)
    assert len({(r['stage'],r['literalSourceByteOffset']) for r in rows})==43
    assert {s:sum(r['stage']==s for r in rows) for s in gra_paths}=={'tomb':16,'portal':20,'tower':7}
    return {'schema':'mk2_o180_all_43_original_effect_frames_literal_edit_reversibility_census_v1','status':'STATIC_SOURCE_PIXEL_EDIT_CENSUS_VERIFIED_NO_RUNTIME','frameCount':43,'originalTracks':6,'stageCounts':{'tomb':16,'portal':20,'tower':7},'oneOpaquePixelAlteredPerProof':True,'oneByteOriginalRLELiteralChangePerProof':True,'originalRLEStreamGeometryPreserved':True,'wholeGRAReversibleWithoutMutationToOriginal':True,'runtimeGameplayValidated':False,'arbitraryReplacementEncodingEnabled':False,'sourceEdits':rows}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--tomb',required=True);p.add_argument('--portal',required=True);p.add_argument('--tower',required=True);p.add_argument('--o136',required=True);p.add_argument('--o137',required=True);p.add_argument('--out',required=True);a=p.parse_args()
    r=run(a.exe,{'tomb':a.tomb,'portal':a.portal,'tower':a.tower},a.o136,a.o137)
    out=Path(a.out);assert not out.exists(),'refusing overwrite';out.write_text(json.dumps(r,indent=2)+'\n')
    print(json.dumps({'status':r['status'],'sourceEditCases':len(r['sourceEdits']),'stages':r['stageCounts']},indent=2))
