#!/usr/bin/env python3
"""Independent original-file ARMORY mixed descriptor/row decoder and PNG verifier.

Writes hashes/geometry only to a reference JSON. Optional --export checks the
TypeScript evidence ZIP against independently decoded original bytes. Its PNG
reader uses Python zlib/CRC and supports all five row filters for RGBA8 exports.
"""
import argparse, hashlib, json, struct, zipfile, zlib
from pathlib import Path

EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
GRA_SHA='fb68c5fb70267dc64cf176056c7711f43973f9b8b8a2e53513f43afc7c56c612'
H=lambda b:hashlib.sha256(b).hexdigest()

import runpy
read_png=runpy.run_path(str(Path(__file__).with_name('verify-mk2-p22-cave-independent.py')))['read_png']

def originals(root):
    entries={}
    for p in root.rglob('*'):
        if p.is_file(): entries.setdefault(p.name.lower(),[]).append(p)
    assert len(entries.get('mk2.exe',[]))==1 and len(entries.get('armory.gra',[]))==1
    exe=entries['mk2.exe'][0].read_bytes(); gra=entries['armory.gra'][0].read_bytes()
    assert H(exe)==EXE_SHA and H(gra)==GRA_SHA
    assert exe[0xa0ef1:0xa13a7].split(b'\0')[26]==b'ARMORY.GRA'
    rows=[]; planes=[]; previous=116608; checks=3
    offsets=[92652, 92668, 92680, 92692, 92704, 92716, 92728, 92740, 92752, 92764, 92776, 92788]
    for ordinal,offset in enumerate(offsets):
        physical=0xa0c54+offset
        descriptor_bytes=12
        width,height,anchor_x,anchor_y,ref=struct.unpack_from('<HHhhI',exe,physical)
        anchor={'x':anchor_x,'y':anchor_y}
        assert ref>>24==26 and ref&0xffffff==previous
        assert 0<width<=640 and 0<height<=480
        pixels=[]; alpha=[]; pos=previous
        for y in range(height):
            line=[]; opacity=[]
            while len(line)<width:
                command=int.from_bytes(gra[pos:pos+4],'little'); assert pos+4<=len(gra); pos+=4
                if command&1:
                    count=command//2; values=[0]*count; mask=[0]*count
                elif command&2:
                    count=command//1024; values=[(command//4)%256]*count; mask=[1]*count
                else:
                    count=command//4; assert 0<count<=64 and pos+((count+3)//4)*4<=len(gra)
                    values=list(gra[pos:pos+count]);mask=[1]*count;pos+=((count+3)//4)*4
                assert 0<count<=width-len(line)
                line.extend(values);opacity.extend(mask)
            pixels.extend(line);alpha.extend(opacity)
        ix=bytes(pixels);mask=bytes(alpha);known=bytes(len(ix))
        rgba=b''.join(bytes((v,v,v,255*a)) for v,a in zip(ix,mask))
        row=dict(ordinal=ordinal,descriptorPhysical=physical,descriptorBytes=descriptor_bytes,sourceDescriptorAnchor=anchor,width=width,height=height,
                 start=previous,endExclusive=pos,indicesSha256=H(ix),maskSha256=H(mask),
                 paletteKnownSha256=H(known),rgbaSha256=H(rgba),encodedSha256=H(gra[previous:pos]))
        rows.append(row);planes.append((ix,mask,rgba));previous=pos;checks+=len(ix)*2+5
    assert previous==126336 and len(gra)==176512
    assert struct.unpack_from('<I',exe,0xcfbac+4*4)[0]==(26<<24|126336)
    for row in rows:row['sourceSetupUses']=[]
    return {'schema':'mkdos_p34_armory_tail_independent_reference_v1','exeSha256':EXE_SHA,'graSha256':GRA_SHA,
            'outsideImageFamilyBytes':166784,'sourceStart':116608,'sourceEndExclusive':126336,'images':rows,
            'nativeFloorStart':126336,'nativeFloorIndicesSha256':H(gra[126336:]),
            'setupRelationshipsQualified':False},planes,checks+1


def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('root',type=Path)
    ap.add_argument('--reference',type=Path);ap.add_argument('--export',type=Path);ap.add_argument('--report',type=Path)
    args=ap.parse_args();reference,planes,checks=originals(args.root)
    if args.reference:
        args.reference.parent.mkdir(parents=True,exist_ok=True)
        args.reference.write_text(json.dumps(reference,indent=2)+'\n',encoding='utf-8')
    if args.export:
        with zipfile.ZipFile(args.export) as z:
            assert z.testzip() is None
            manifest=json.loads(z.read('manifest.json'));assets=manifest['selectionOrder']
            assert len(assets)==12 and len(z.namelist())==49
            pngs=[n for n in z.namelist() if n.startswith('assets/')];assert len(pngs)==12
            for ordinal,(row,asset,(ix,mask,rgba)) in enumerate(zip(reference['images'],assets,planes)):
                assert asset['id']==f'mk2-armory-tail-source:{ordinal}:original-indices'
                assert asset['source']['offset']==row['start'] and asset['source']['length']==row['endExclusive']-row['start']
                assert asset['metadata']['sourceDescriptorPhysical']==row['descriptorPhysical']
                assert asset['metadata']['sourceSetupUses']==[]
                assert asset['metadata']['sourceSetupUsesKnown'] is False
                assert asset['metadata']['maskIsRuntimeAlpha'] is False
                assert asset['metadata']['sourceDescriptorBytes']==row['descriptorBytes']
                assert asset['metadata']['sourceDescriptorAnchor']==row['sourceDescriptorAnchor']
                assert asset['metadata']['sourceTableOrderIsAnimation'] is False
                assert asset['metadata']['worldPlacementKnown'] is False
                assert asset['metadata']['newlyDiscoveredSourceImage'] is False
                for flag in ['runtimePaletteKnown','stageOwnershipKnown','nativeTimingKnown','fullStageScene','setupRelationshipsAreRuntimePlacement']:
                    assert asset['metadata'][flag] is False
                assert z.read(f'indexed/{ordinal:05}_indices.bin')==ix
                assert z.read(f'indexed/{ordinal:05}_mask.bin')==mask
                assert z.read(f'indexed/{ordinal:05}_paletteKnownMask.bin')==bytes(len(ix))
                width,height,pixels=read_png(z.read(pngs[ordinal]))
                assert (width,height)==(row['width'],row['height']) and pixels==rgba
                checks+=len(ix)*4+12
    result={'pass':'P34','status':'PASS','checks':checks,'originalArmoryTailImages':12,
            'setupRelationshipsQualified':False,'newlyDiscoveredSourceImages':0,
            'indexedPixels':sum(len(ix) for ix,_,_ in planes),'sourceImageInterval':{'start':116608,'endExclusive':126336,'encodedBytes':9728},
            'outsideImageFamilyBytes':166784,'exportPngAndSidecarParity':bool(args.export),
            'nativePaletteKnown':False,'fullStageScene':False}
    if args.report:args.report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,indent=2))

if __name__=='__main__':main()
