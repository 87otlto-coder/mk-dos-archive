#!/usr/bin/env python3
"""Independent O181 source witness table vs untouched O136/O137 research manifests."""
import argparse, json, re
from pathlib import Path

def verify(ts_file,o136_file,o137_file):
    text=Path(ts_file).read_text()
    marker='ORIGINAL_FRAME_WITNESSES_O181:Readonly<Record<string,readonly SourceFrameWitnessO181[]>> = '
    assert text.count(marker)==1
    raw=text.split(marker,1)[1].split(' as const;',1)[0]
    observed=json.loads(raw)
    a=json.loads(Path(o136_file).read_text());b=json.loads(Path(o137_file).read_text())
    authoritative={}
    for t in a['tracks']:
        authoritative[t['name']]=[{'w':f['sourceWidth'],'h':f['sourceHeight'],'x':f['signedSourceX'],'y':f['signedSourceY'], 'd':f['descriptorObject2'],'a':f['streamStart'],'b':f['streamEndExclusive'], 'index':f['paletteIndexSHA256'],'mask':f['opacityMaskSHA256'],'rgba':f['rgbaSHA256']} for f in t['frames']]
    authoritative['tower_original_effect']=[{'w':f['originalWidth'],'h':f['originalHeight'],'x':f['originalX'],'y':f['originalY'], 'd':f['originalDescriptorObject2'],'a':f['sourceOffset'],'b':f['sourceEndExclusive'], 'index':f['indicesSHA256'],'mask':f['maskSHA256'],'rgba':f['rgbaSHA256']} for f in b['frames']]
    assert set(observed)==set(authoritative) and len(observed)==6
    assertions=1;frames=0
    for k,original in authoritative.items():
        assert len(observed[k])==len(original);assertions+=1
        for i,ref in enumerate(original):
            assert observed[k][i]==ref,f'O181 frame witness mismatch: {k}/{i}'
            assertions+=len(ref);frames+=1
    assert frames==43 and assertions==1+6+43*10
    assert 'await verifySourceFrameWitnessO181(name,i,f);' in Path(ts_file).parent.joinpath('stageOriginalEffectArchiveO177.ts').read_text(),'witness integration missing'
    return {'status':'PASS_INDEPENDENT_O181_SOURCE_HASH_WITNESSES','verifiedFrames':frames,'witnessAssertions':assertions,'all43FrameIdentityTuplesMatchPython':True}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('witness_ts');p.add_argument('o136');p.add_argument('o137');a=p.parse_args()
    print(json.dumps(verify(a.witness_ts,a.o136,a.o137),indent=2))
