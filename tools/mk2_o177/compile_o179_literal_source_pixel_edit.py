#!/usr/bin/env python3
"""O179: bounded equal-length literal-only pixel edit to an ORIGINAL MK2 stage effect RLE.
Static source-edit research only: not a runtime-verified replacement compiler.
Canonical resources, exact source positions, source frame plane hashes required.
"""
import argparse, hashlib, json, struct
from pathlib import Path
SHAS={'tomb':'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613','portal':'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82','tower':'7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8'}
sha=lambda b:hashlib.sha256(b).hexdigest()
def decode_frame(gra,start,w,h):
    at=start;indices=bytearray(w*h);mask=bytearray(w*h);literals=[]
    for y in range(h):
        x=0
        while x<w:
            assert at+4<=len(gra),'truncated RLE instruction'
            cmd=struct.unpack_from('<I',gra,at)[0];at+=4
            if cmd&1:n=cmd>>1;kind='skip';v=None
            elif cmd&2:n=cmd>>10;kind='run';v=(cmd>>2)&255
            else:n=cmd>>2;kind='literal';v=None
            assert 0<n<=w-x,'decoded source row overflow'
            if kind=='run':
                indices[y*w+x:y*w+x+n]=bytes([v])*n;mask[y*w+x:y*w+x+n]=bytes([1])*n
            elif kind=='literal':
                assert n<=64 and at+n<=len(gra),'literal bounds';payload=gra[at:at+n]
                indices[y*w+x:y*w+x+n]=payload;mask[y*w+x:y*w+x+n]=bytes([1])*n
                for j,pix in enumerate(payload):literals.append((at+j,y*w+x+j,pix))
                at+=(n+3)&~3
            x+=n
    return bytes(indices),bytes(mask),at,literals

def do_edit(exe,original_gra,source_manifest,stage,track,ordinal):
    raw=Path(original_gra).read_bytes();assert sha(raw)==SHAS[stage],'requires exact canonical original GRA'
    assert sha(Path(exe).read_bytes())=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','requires exact canonical original EXE'
    data=json.loads(Path(source_manifest).read_text())
    if stage=='tower':
        assert track=='tower_original_effect';f=data['frames'][ordinal]
        start,end,w,h=f['sourceOffset'],f['sourceEndExclusive'],f['originalWidth'],f['originalHeight']
        expectedIndices,expectedMask=f['indicesSHA256'],f['maskSHA256']
    else:
        tr=next(t for t in data['tracks'] if t['name']==track and t['stage']==stage);f=tr['frames'][ordinal]
        start,end,w,h=f['streamStart'],f['streamEndExclusive'],f['sourceWidth'],f['sourceHeight']
        expectedIndices,expectedMask=f['paletteIndexSHA256'],f['opacityMaskSHA256']
    old_i,mask,stop,literals=decode_frame(raw,start,w,h)
    assert stop==end and sha(old_i)==expectedIndices and sha(mask)==expectedMask,'original source decoder identity'
    allowed=set(old_i)-{0};assert len(allowed)>1 and literals,'no source-backed distinct palette replacement'
    candidate=next(((off,pixel,old) for off,pixel,old in literals if old in allowed and any(q!=old for q in allowed)),None)
    assert candidate is not None,'no eligible original literal'
    off,pixel,old=candidate;new=next(v for v in sorted(allowed) if v!=old)
    assert 0<new<=255,'invalid exact source index'
    changed=bytearray(raw);changed[off]=new
    got_i,got_m,got_end,_=decode_frame(changed,start,w,h)
    assert got_end==end and got_m==mask and len(changed)==len(raw),'RLE structure/mask altered'
    differences=[i for i,(a,b) in enumerate(zip(old_i,got_i)) if a!=b]
    assert differences==[pixel] and old_i[pixel]==old and got_i[pixel]==new,'not exactly one opaque source pixel changed'
    restored=bytearray(changed);restored[off]=old
    assert sha(restored)==sha(raw),'failed whole-resource byte-exact reversal'
    report={'schema':'mk2_o179_original_stage_effect_literal_pixel_source_edit_v1','status':'STATIC_IN_PLACE_LITERAL_PIXEL_EDIT_VALIDATED_RUNTIME_UNVERIFIED',
     'stage':stage,'track':track,'ordinal':ordinal,'graSourceSHA256':sha(raw),'graEditedSHA256':sha(changed),'graLengthBytes':len(raw),
     'sourceDescriptorObject2':(f['originalDescriptorObject2'] if stage=='tower' else f['descriptorObject2']),'sourceFrameWidth':w,'sourceFrameHeight':h,'sourceDescriptorFrameStart':start,'sourceDescriptorFrameEndExclusive':end,'originalIndexedPixelsSHA256':sha(old_i),'editedIndexedPixelsSHA256':sha(got_i),
     'originalOpacityMaskSHA256':sha(mask),'editedOpacityMaskSHA256':sha(got_m),
     'literalSourceByteOffset':off,'pixelLinearIndex':pixel,'pixelX':pixel%w,'pixelY':pixel//w,'oldOriginalPaletteIndex':old,'newOriginalPaletteIndex':new,
     'editedByteCount':1,'encodedStreamLengthUnchanged':True,'maskAndRLELayoutUnchanged':True,'wholeResourceReverseSHA256':sha(restored),
     'sourcePixelChangeVerified':True,'gameplayEffectVerified':False,'runtimePaletteSelectionVerified':False,'variableLengthRepackEnabled':False}
    return changed,report
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--gra',required=True);p.add_argument('--manifest',required=True);p.add_argument('--stage',choices=['tomb','portal','tower'],required=True);p.add_argument('--track',required=True);p.add_argument('--ordinal',type=int,default=0);p.add_argument('--out-report',required=True);p.add_argument('--out-private-test-gra');a=p.parse_args()
    altered,report=do_edit(a.exe,a.gra,a.manifest,a.stage,a.track,a.ordinal)
    out=Path(a.out_report);assert not out.exists(),'refusing overwrite report';out.write_text(json.dumps(report,indent=2)+'\n')
    if a.out_private_test_gra:
        out=Path(a.out_private_test_gra);assert not out.exists(),'refusing overwrite test resource';out.write_bytes(altered)
    print(json.dumps({k:report[k] for k in ['status','stage','track','ordinal','literalSourceByteOffset','pixelX','pixelY','oldOriginalPaletteIndex','newOriginalPaletteIndex','editedByteCount']},indent=2))
