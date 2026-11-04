#!/usr/bin/env python3
"""O177 independent ZIP payload verification, based on original O136/O137 manifests.
Does not import the TypeScript exporter or trust manifest-provided hashes as authority.
Verifies compressed PNG CRC/layout/pixel bytes with Python stdlib.
"""
import argparse, hashlib, json, struct, zipfile, zlib
from pathlib import Path

def sha(b):return hashlib.sha256(b).hexdigest()
def validate_png(png,w,h):
    assert png[:8]==b'\x89PNG\r\n\x1a\n','not PNG'
    at=8;idat=b'';seen=[]
    while at<len(png):
        assert at+12<=len(png),'truncated PNG chunk'
        n,=struct.unpack_from('>I',png,at);typ=png[at+4:at+8]
        assert n<2_000_000 and at+12+n<=len(png),'unbounded PNG chunk'
        payload=png[at+8:at+8+n];crc,=struct.unpack_from('>I',png,at+8+n)
        assert zlib.crc32(typ+payload)==crc,'PNG chunk CRC'
        seen.append(typ)
        if typ==b'IHDR': assert payload==struct.pack('>IIBBBBB',w,h,8,6,0,0,0),'PNG IHDR geometry or color'
        if typ==b'IDAT':idat+=payload
        at+=n+12
    assert seen==[b'IHDR',b'IDAT',b'IEND'],'PNG chunk grammar'
    raw=zlib.decompress(idat);stride=1+w*4
    assert len(raw)==stride*h,'scanline length'
    assert all(raw[y*stride]==0 for y in range(h)),'filter mode'
    return b''.join(raw[y*stride+1:(y+1)*stride] for y in range(h))

def verify(zip_path,o136_path,o137_path):
    py=json.loads(Path(o136_path).read_text());tow=json.loads(Path(o137_path).read_text())
    expected={t['name']:t for t in py['tracks']}
    assert len(expected)==5 and len(tow['frames'])==7
    assertions=0
    def check(x,msg):
        nonlocal assertions
        assert x,msg
        assertions+=1
    with zipfile.ZipFile(zip_path) as z:
        members=z.namelist();check(z.testzip() is None,'bad ZIP CRC')
        check(len(members)==131 and len(set(members))==131,'entry count/duplicates')
        check(all(not n.startswith('/') and '..' not in Path(n).parts for n in members),'bad path traversal')
        doc=json.loads(z.read('manifest.json'))
        check(doc['schema']=='mk2_o177_original_source_effect_frame_archive_v1','schema')
        check(doc['frameCount']==43 and doc['sequenceCount']==6,'full coverage')
        for key in ('runtimeFrameRateKnown','runtimeActivationKnown','actualScreenCoordinatesKnown','finalLayerOrderKnown','towerPaletteSelectedByRuntime'):
            check(doc[key] is False,'misleading runtime claim '+key)
        checks=set(['manifest.json','README.md']);total=0
        for track in doc['tracks']:
            name=track['name'];check(name in expected or name=='tower_original_effect','unknown source list')
            is_tower=name=='tower_original_effect'
            source=tow if is_tower else expected[name]
            frames=source['frames']
            check(track['sourceFrameCount']==len(frames),'frame count '+name)
            check(track['sourcePointerObject2']==(tow['sourceFrameListObject2'] if is_tower else source['sourceFrameListObject2']),'list pointer '+name)
            check(track['sourceControlFlow']==('ONE_MARKER_BACK_REFERENCE' if is_tower else source['sourceControlFlow']),'control grammar '+name)
            check(track['paletteStatus']==('SOURCE_LINKED_CANDIDATE_NOT_RUNTIME_CONFIRMED' if is_tower else 'SOURCE_DECODED_NOT_RUNTIME_CONFIRMED'),'palette qualifier '+name)
            for i,frame in enumerate(track['frames']):
                reference=frames[i]
                keys=(('frameOrdinal','originalWidth','originalHeight','originalX','originalY','originalDescriptorObject2','sourceOffset','sourceEndExclusive','indicesSHA256','maskSHA256','rgbaSHA256') if is_tower else
                      ('ordinal','sourceWidth','sourceHeight','signedSourceX','signedSourceY','descriptorObject2','streamStart','streamEndExclusive','paletteIndexSHA256','opacityMaskSHA256','rgbaSHA256'))
                mapping=['ordinal','width','height','descriptorX','descriptorY','descriptorObject2','encodedGraStart','encodedGraEndExclusive','indexedPixelsSHA256','opacityMaskSHA256','rgbaPixelsSHA256']
                for src,dst in zip(keys,mapping):check(frame[dst]==reference[src],f'source manifest {name} {i} {dst}')
                w,h=frame['width'],frame['height'];paths=frame['paths']
                check(set(paths)=={'rgbaPng','indexedPixels','opacityMask'},'file path schema')
                for file in paths.values():check(file in members and file not in checks,'missing/duplicate file '+file);checks.add(file)
                idx=z.read(paths['indexedPixels']);mask=z.read(paths['opacityMask']);png=z.read(paths['rgbaPng'])
                check(len(idx)==len(mask)==w*h,'indices and masks dimensions')
                check(set(mask)<=set((0,1)),'nonbinary alpha mask')
                check(sha(idx)==frame['indexedPixelsSHA256'],'source index hash')
                check(sha(mask)==frame['opacityMaskSHA256'],'mask hash')
                check(sha(png)==frame['pngSHA256'],'PNG hash')
                rgba=validate_png(png,w,h)
                check(sha(rgba)==frame['rgbaPixelsSHA256'],'RGBA independent PNG parse')
                check(all(rgba[j*4+3]==(255 if mask[j] else 0) for j in range(w*h)),'PNG alpha vs original mask')
                total+=1
        check(set(members)==checks,'unexpected files')
        check(total==43,'wrong total recovered sprites')
    return {'status':'PASS_INDEPENDENT_O177_ALL_ORIGINAL_EFFECT_FRAMES','sourceOriginalFrames':total,'sequenceCount':6,'archiveEntries':len(members),'assertions':assertions}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('archive');p.add_argument('original_o136');p.add_argument('original_o137');a=p.parse_args()
    print(json.dumps(verify(a.archive,a.original_o136,a.original_o137),indent=2))
