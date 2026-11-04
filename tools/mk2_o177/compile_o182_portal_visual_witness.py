#!/usr/bin/env python3
"""O182: exact-canonical, original Portal seven-frame x2 recolor witness.

Produces only source byte patch metadata. Never writes a modified commercial GRA.
Original-color index 55->64 and 54->63 in Portal swaying/hanging frames.
The palette selection and live animation activation remain runtime-unverified.
"""
import argparse, hashlib, json, struct
from collections import Counter
from pathlib import Path

EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
PORTAL_SHA='cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82'
REMAP={55:64,54:63}
TRACKS=('portal_swaying','portal_hanging')
sha=lambda b: hashlib.sha256(b).hexdigest()

def frame_decode(g, start, width, height):
    """Returns raster and command boundaries; rejects invalid streams."""
    at=start; raster=bytearray(width*height); mask=bytearray(width*height); commands=[]
    for y in range(height):
        x=0
        while x < width:
            assert at+4<=len(g),'truncated command'
            off=at; word,=struct.unpack_from('<I',g,at);at+=4
            if word&1:
                kind='skip'; n=word>>1
            elif word&2:
                kind='run';n=word>>10;v=(word>>2)&255
            else:
                kind='literal';n=word>>2
            assert 0<n<=width-x,'bad row length'
            if kind=='run':
                raster[y*width+x:y*width+x+n]=bytes((v,))*n
                mask[y*width+x:y*width+x+n]=bytes((1,))*n
                commands.append((kind,off,n,v,None))
            elif kind=='literal':
                assert n<=64 and at+((n+3)&~3)<=len(g),'bad literal bounds'
                raster[y*width+x:y*width+x+n]=g[at:at+n]
                mask[y*width+x:y*width+x+n]=bytes((1,))*n
                commands.append((kind,off,n,None,at))
                at+=(n+3)&~3
            else:commands.append((kind,off,n,None,None))
            x+=n
    return bytes(raster),bytes(mask),at,commands

def compile_patch(exe, gra, source):
    assert sha(exe)==EXE_SHA and sha(gra)==PORTAL_SHA,'wrong canonical MK2.EXE or PORTAL.GRA'
    assert source['originalExecutableSHA256']==EXE_SHA
    assert source['originalResourceSHA256']['portal']==PORTAL_SHA
    out=bytearray(gra); changes={};frames=[];source_count=Counter(); command_count=Counter()
    for name in TRACKS:
        track=next((t for t in source['tracks'] if t['name']==name and t['stage']=='portal'),None)
        assert track is not None and len(track['frames'])==7,'source track mismatch'
        for f in track['frames']:
            start,end,w,h=f['streamStart'],f['streamEndExclusive'],f['sourceWidth'],f['sourceHeight']
            desc=0xa0c54+f['descriptorObject2'];dw,dh,x,y,packed=struct.unpack_from('<HHhhI',exe,desc)
            assert (dw,dh,x,y,packed>>24,packed&0xffffff)==(w,h,f['signedSourceX'],f['signedSourceY'],25,start),'relocated descriptor mismatch'
            before,mask,stop,commands=frame_decode(gra,start,w,h)
            assert stop==end and sha(before)==f['paletteIndexSHA256'] and sha(mask)==f['opacityMaskSHA256'] and sha(gra[start:end])==f['sourceStreamSHA256'],'source manifest mismatch'
            baseline=Counter(v for v,m in zip(before,mask) if m and v in REMAP)
            for kind,off,n,v,data in commands:
                if kind=='run' and v in REMAP:
                    oldword,=struct.unpack_from('<I',gra,off)
                    newword=(oldword & ~0x3fc) | (REMAP[v]<<2)
                    assert newword&3==oldword&3 and newword>>10==oldword>>10
                    for i,(a,b) in enumerate(zip(gra[off:off+4],struct.pack('<I',newword))):
                        if a!=b:
                            assert off+i not in changes
                            changes[off+i]=(a,b);out[off+i]=b
                    command_count['run']+=1
                elif kind=='literal':
                    for i in range(n):
                        offset=data+i;v=gra[offset]
                        if v in REMAP:
                            assert offset not in changes
                            changes[offset]=(v,REMAP[v]);out[offset]=REMAP[v]
                            command_count['literal-pixel']+=1
            after,changedmask,changedend,cmd2=frame_decode(out,start,w,h)
            assert changedend==end and changedmask==mask
            assert [(c[0],c[2]) for c in commands]==[(c[0],c[2]) for c in cmd2], 'command structure changed'
            pixel_diffs=sum(a!=b for a,b in zip(before,after))
            assert pixel_diffs==sum(baseline.values()) and pixel_diffs>0,'expected indexed change not found'
            assert all((b==REMAP.get(a,a)) for a,b in zip(before,after))
            source_count.update(baseline)
            frames.append({'track':name,'ordinal':f['ordinal'],'descriptorObject2':f['descriptorObject2'],
                           'start':start,'endExclusive':end,'width':w,'height':h,
                           'originalIndicesSHA256':sha(before),'editedIndicesSHA256':sha(after),
                           'opacityMaskSHA256':sha(mask),'changedOpaquePixels':pixel_diffs,'sourceColorCounts':dict(baseline)})
    assert len(changes)>100 and len(frames)==14
    changed_positions=[i for i,(a,b) in enumerate(zip(gra,out)) if a!=b]
    assert changed_positions==sorted(changes) and len(out)==len(gra)
    revert=bytearray(out)
    for off,(old,new) in changes.items():
        assert revert[off]==new
        revert[off]=old
    assert sha(revert)==PORTAL_SHA
    return {'schema':'mk2_o182_original_portal_visual_witness_v1',
            'status':'STATIC_EQUAL_LENGTH_INDEX_REMAP_RUNTIME_UNVERIFIED',
            'originalExecutableSHA256':EXE_SHA,'originalResourceSHA256':PORTAL_SHA,
            'editedResourceSHA256':sha(out),'resourceName':'PORTAL.GRA','fileId':25,
            'originalResourceLength':len(gra),'editedResourceLength':len(out),
            'sourcePaletteRemap':{'54':63,'55':64},'sourceColorPixelsChanged':dict(source_count),
            'frameCount':len(frames),'frames':frames,'modifiedByteCount':len(changes),
            'modifiedBytes':[{'offset':off,'before':values[0],'after':values[1]} for off,values in sorted(changes.items())],
            'commandKindsChanged':False,'encodedFrameLengthsChanged':False,'opacityMasksChanged':False,
            'wholeResourceReverseSHA256':sha(revert),'runtimePaletteVerified':False,
            'gameplayActivationVerified':False,'gameplayBehaviorVerified':False,
            'warning':'Only a source-index remap of 14 known effect frames. The actual game display, stage activation, timing and palettes are not measured.'}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--portal',required=True);p.add_argument('--manifest',required=True);p.add_argument('--out',required=True)
    a=p.parse_args();dest=Path(a.out)
    if dest.exists():p.error('Refusing overwrite')
    report=compile_patch(Path(a.exe).read_bytes(),Path(a.portal).read_bytes(),json.loads(Path(a.manifest).read_text()))
    dest.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:report[k] for k in ('status','frameCount','modifiedByteCount','sourceColorPixelsChanged','editedResourceSHA256')},indent=2))
