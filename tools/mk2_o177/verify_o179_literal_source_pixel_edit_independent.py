#!/usr/bin/env python3
"""Independent whole-GRA diff and RLE decoder validation for O179, fail-closed."""
import argparse,hashlib,json,struct
from pathlib import Path
sha=lambda b:hashlib.sha256(b).hexdigest()
def plain_decode(g,a,w,h):
    at=a;idx=bytearray();mask=bytearray()
    for _ in range(h):
        remaining=w
        while remaining:
            cmd,=struct.unpack_from('<I',g,at);at+=4
            if cmd&1:n=cmd//2;idx.extend(bytes(n));mask.extend(bytes(n))
            elif cmd&2:n=cmd>>10;idx.extend(bytes([(cmd>>2)&255])*n);mask.extend(bytes([1])*n)
            else:
                n=cmd>>2;assert n<=64;idx.extend(g[at:at+n]);mask.extend(bytes([1])*n);at+=(n+3)&~3
            assert 0<n<=remaining;remaining-=n
    return bytes(idx),bytes(mask),at

def verify(exe_path,source_path,edited_path,report_path):
    exe=Path(exe_path).read_bytes();old=Path(source_path).read_bytes();new=Path(edited_path).read_bytes();j=json.loads(Path(report_path).read_text())
    assert sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
    assert j['schema']=='mk2_o179_original_stage_effect_literal_pixel_source_edit_v1'
    assert j['status']=='STATIC_IN_PLACE_LITERAL_PIXEL_EDIT_VALIDATED_RUNTIME_UNVERIFIED'
    assert j['gameplayEffectVerified'] is False and j['runtimePaletteSelectionVerified'] is False and j['variableLengthRepackEnabled'] is False
    canonical={'tomb':('be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',28),'portal':('cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82',25),'tower':('7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8',30)}
    assert j['stage'] in canonical and sha(old)==j['graSourceSHA256']==canonical[j['stage']][0]
    assert sha(new)==j['graEditedSHA256'] and len(new)==len(old)==j['graLengthBytes']
    diff=[i for i,(a,b) in enumerate(zip(old,new)) if a!=b]
    assert diff==[j['literalSourceByteOffset']] and j['editedByteCount']==1
    off=diff[0];assert (old[off],new[off])==(j['oldOriginalPaletteIndex'],j['newOriginalPaletteIndex'])
    start,end=j['sourceDescriptorFrameStart'],j['sourceDescriptorFrameEndExclusive']
    assert 0<=start<off<end<=len(old)
    descriptor=0xa0c54+j['sourceDescriptorObject2']
    w,h,dx,dy,packed=struct.unpack_from('<HHhhI',exe,descriptor)
    assert (w,h)==(j['sourceFrameWidth'],j['sourceFrameHeight']) and (packed>>24)==canonical[j['stage']][1] and (packed&0xffffff)==start
    oldidx,oldmask,oldstop=plain_decode(old,start,w,h);newidx,newmask,newstop=plain_decode(new,start,w,h)
    assert oldstop==newstop==end and sha(oldidx)==j['originalIndexedPixelsSHA256'] and sha(newidx)==j['editedIndexedPixelsSHA256']
    assert oldmask==newmask and sha(oldmask)==j['originalOpacityMaskSHA256']==j['editedOpacityMaskSHA256']
    changed_pixels=[n for n,(a,b) in enumerate(zip(oldidx,newidx)) if a!=b]
    assert changed_pixels==[j['pixelLinearIndex']] and j['pixelX']==changed_pixels[0]%w and j['pixelY']==changed_pixels[0]//w
    assert oldmask[changed_pixels[0]]==1 and oldidx[changed_pixels[0]]==old[off] and newidx[changed_pixels[0]]==new[off]
    assert j['encodedStreamLengthUnchanged'] is True and j['maskAndRLELayoutUnchanged'] is True
    reverse=bytearray(new);reverse[off]=old[off];assert sha(reverse)==sha(old)==j['wholeResourceReverseSHA256']
    return {'status':'PASS_INDEPENDENT_O179_SINGLE_SOURCE_PIXEL_EDIT','wholeResourceByteDiffs':len(diff),'sourcePixelDiffs':len(changed_pixels),'assertions':21}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('exe');p.add_argument('original');p.add_argument('edited');p.add_argument('report');a=p.parse_args();print(json.dumps(verify(a.exe,a.original,a.edited,a.report),indent=2))
