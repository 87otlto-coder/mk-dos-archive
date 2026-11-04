#!/usr/bin/env python3
"""Independent O180 all-frame re-derivation from EXE and GRA, no producer import."""
import argparse,hashlib,json,struct
from pathlib import Path
from verify_o179_literal_source_pixel_edit_independent import plain_decode
sha=lambda b:hashlib.sha256(b).hexdigest()
ROOTS={'tomb_flying_a':0x17814,'tomb_flying_b':0x177ec,'portal_swaying':0x164b4,'portal_hanging':0x164d8,'portal_electric':0x164f8,'tower_original_effect':0x16490}
RESOURCE_ID={'tomb':28,'portal':25,'tower':30}
ORIGINAL_SHA={'tomb':'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613','portal':'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82','tower':'7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8'}
def verify(exe_file,gra_paths,report_file):
    exe=Path(exe_file).read_bytes();assert sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
    report=json.loads(Path(report_file).read_text());assert report['schema']=='mk2_o180_all_43_original_effect_frames_literal_edit_reversibility_census_v1'
    assert report['status']=='STATIC_SOURCE_PIXEL_EDIT_CENSUS_VERIFIED_NO_RUNTIME' and report['runtimeGameplayValidated'] is False and report['arbitraryReplacementEncodingEnabled'] is False
    assert report['frameCount']==43 and len(report['sourceEdits'])==43 and report['stageCounts']=={'tomb':16,'portal':20,'tower':7}
    assert all(report[k] is True for k in ['oneOpaquePixelAlteredPerProof','oneByteOriginalRLELiteralChangePerProof','originalRLEStreamGeometryPreserved','wholeGRAReversibleWithoutMutationToOriginal'])
    source={k:Path(p).read_bytes() for k,p in gra_paths.items()};assert set(source)==set(RESOURCE_ID)
    for k,v in source.items():assert sha(v)==ORIGINAL_SHA[k]
    assertions=9;seen=set()
    for r in report['sourceEdits']:
        s=r['stage'];t=r['track'];i=r['ordinal'];assert t in ROOTS and s in RESOURCE_ID and 0<=i<8;assertions+=1
        g=source[s];a=r['sourceDescriptorFrameStart'];z=r['sourceDescriptorFrameEndExclusive'];off=r['literalSourceByteOffset']
        d=r['sourceDescriptorObject2'];dw,dh,x,y,packed=struct.unpack_from('<HHhhI',exe,0xa0c54+d)
        assert (dw,dh)==(r['sourceFrameWidth'],r['sourceFrameHeight']) and packed>>24==RESOURCE_ID[s] and packed&0xffffff==a;assertions+=1
        assert struct.unpack_from('<I',exe,0xa0c54+ROOTS[t]+4*i)[0]==d;assertions+=1
        assert 0<=a<off<z<=len(g) and r['graSourceSHA256']==sha(g);assertions+=1
        old,new=r['oldOriginalPaletteIndex'],r['newOriginalPaletteIndex']
        assert 1<=old<=255 and 1<=new<=255 and new!=old and g[off]==old;assertions+=1
        aidx,amask,aend=plain_decode(g,a,dw,dh)
        clone=bytearray(g);clone[off]=new
        bidx,bmask,bend=plain_decode(clone,a,dw,dh)
        assert aend==bend==z and amask==bmask and sha(amask)==r['originalOpacityMaskSHA256']==r['editedOpacityMaskSHA256'];assertions+=1
        diff=[j for j,(v,w) in enumerate(zip(aidx,bidx)) if v!=w]
        assert diff==[r['pixelLinearIndex']] and amask[diff[0]]==1 and r['pixelX']==diff[0]%dw and r['pixelY']==diff[0]//dw;assertions+=1
        assert sha(aidx)==r['originalIndexedPixelsSHA256'] and sha(bidx)==r['editedIndexedPixelsSHA256'] and aidx[diff[0]]==old and bidx[diff[0]]==new;assertions+=1
        assert sha(clone)==r['graEditedSHA256'] and len(clone)==len(g);assertions+=1
        clone[off]=old;assert sha(clone)==sha(g)==r['wholeResourceReverseSHA256'];assertions+=1
        assert r['editedByteCount']==1 and r['gameplayEffectVerified'] is False and r['variableLengthRepackEnabled'] is False;assertions+=1
        key=(s,t,i);assert key not in seen;seen.add(key);assertions+=1
    assert len(seen)==43 and {s:sum(k[0]==s for k in seen) for s in RESOURCE_ID}=={'tomb':16,'portal':20,'tower':7};assertions+=1
    return {'status':'PASS_INDEPENDENT_O180_43_LITERAL_PIXEL_EDITS','originalSourceFramesVerified':len(seen),'assertions':assertions}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--tomb',required=True);p.add_argument('--portal',required=True);p.add_argument('--tower',required=True);p.add_argument('--report',required=True);a=p.parse_args()
    print(json.dumps(verify(a.exe,{'tomb':a.tomb,'portal':a.portal,'tower':a.tower},a.report),indent=2))
