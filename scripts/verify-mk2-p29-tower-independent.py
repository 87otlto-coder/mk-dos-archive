#!/usr/bin/env python3
"""Independent original-file TOWER mixed descriptor/row decoder and PNG verifier.

Writes hashes/geometry only to a reference JSON. Optional --export checks the
TypeScript evidence ZIP against independently decoded original bytes. Its PNG
reader uses Python zlib/CRC and supports all five row filters for RGBA8 exports.
"""
import argparse, hashlib, json, struct, zipfile, zlib
from pathlib import Path

EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
GRA_SHA='7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8'
H=lambda b:hashlib.sha256(b).hexdigest()

import runpy
read_png=runpy.run_path(str(Path(__file__).with_name('verify-mk2-p22-cave-independent.py')))['read_png']

def originals(root):
    entries={}
    for p in root.rglob('*'):
        if p.is_file(): entries.setdefault(p.name.lower(),[]).append(p)
    assert len(entries.get('mk2.exe',[]))==1 and len(entries.get('tower.gra',[]))==1
    exe=entries['mk2.exe'][0].read_bytes(); gra=entries['tower.gra'][0].read_bytes()
    assert H(exe)==EXE_SHA and H(gra)==GRA_SHA
    assert exe[0xa0ef1:0xa13a7].split(b'\0')[30]==b'TOWER.GRA'
    rows=[]; planes=[]; previous=0; checks=3
    offsets=[0x17980,0x17988,0x17990,0x17998,0x179a0,0x179b0]
    effects=list(struct.unpack_from('<7I',exe,0xa0c54+0x16490))
    assert effects==[0x179c0,0x179d0,0x179dc,0x179e8,0x179f4,0x17a00,0x17a0c]
    assert struct.unpack_from('<II',exe,0xa0c54+0x16490+28)==(1,0x16490)
    for ordinal,offset in enumerate(offsets+effects):
        physical=0xa0c54+offset
        descriptor_bytes=8 if ordinal<4 else 12
        width,height=struct.unpack_from('<HH',exe,physical)
        anchor=None if descriptor_bytes==8 else dict(zip(['x','y'],struct.unpack_from('<hh',exe,physical+4)))
        ref=struct.unpack_from('<I',exe,physical+descriptor_bytes-4)[0]
        assert ref>>24==30 and ref&0xffffff==previous
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
    assert rows[5]['endExclusive']==40776 and previous==56268 and len(gra)==113612
    setups=[]
    for setup in [0x1795c,0x1796e]:
        base=0xa0c54; width,height,count=struct.unpack_from('<HHH',exe,base+setup)
        control,table,palette=struct.unpack_from('<III',exe,base+setup+6)
        assert (width,height)==(1031,64) and table==0x17980 and palette==0x17a18
        controls=[]
        for i in range(count):
            flags,x,y,pair=struct.unpack_from('<HHHH',exe,base+control+8*i)
            assert (flags&15)==2 and pair in [0,2,4,6]
            controls.append(dict(setupObject2Offset=setup,controlObject2Offset=control+i*8,ordinal=i,
                rawFlags=flags,sourceX=x-65536 if x>=32768 else x,sourceY=y-65536 if y>=32768 else y,rawPair=pair))
        setups.append(dict(setupObject2Offset=setup,width=width,height=height,controls=controls))
        checks+=count+3
    assert sum(len(s['controls']) for s in setups)==22
    for row in rows[:6]:
        row['sourceSetupControls']=[c for setup in setups for c in setup['controls'] if c['rawPair']*4==row['ordinal']*8] if row['ordinal']<4 else []
    assert all(row['sourceSetupControls'] for row in rows[:4])
    return {'schema':'mkdos_p29_tower_independent_reference_v1','exeSha256':EXE_SHA,'graSha256':GRA_SHA,
            'outsideImageFamilyBytes':72836,'sourceEndExclusive':40776,'images':rows[:6],
            'existingEffectFrames':rows[6:],'sourceSetups':setups,'fullEncodedPrefixEndExclusive':56268},planes[:6],checks+1


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
            assert len(assets)==6 and len(z.namelist())==25
            pngs=[n for n in z.namelist() if n.startswith('assets/')];assert len(pngs)==6
            for ordinal,(row,asset,(ix,mask,rgba)) in enumerate(zip(reference['images'],assets,planes)):
                assert asset['id']==f'mk2-tower-source:{ordinal}:original-indices'
                assert asset['source']['offset']==row['start'] and asset['source']['length']==row['endExclusive']-row['start']
                assert asset['metadata']['sourceDescriptorPhysical']==row['descriptorPhysical']
                assert asset['metadata']['sourceSetupControls']==row['sourceSetupControls']
                assert asset['metadata']['sourceDescriptorBytes']==row['descriptorBytes']
                assert asset['metadata']['sourceDescriptorAnchor']==row['sourceDescriptorAnchor']
                assert asset['metadata']['setupTransformSemanticsKnown'] is False
                assert asset['metadata']['newlyDiscoveredSourceImage'] is False
                for flag in ['runtimePaletteKnown','stageOwnershipKnown','nativeTimingKnown','fullStageScene']:
                    assert asset['metadata'][flag] is False
                assert z.read(f'indexed/{ordinal:05}_indices.bin')==ix
                assert z.read(f'indexed/{ordinal:05}_mask.bin')==mask
                assert z.read(f'indexed/{ordinal:05}_paletteKnownMask.bin')==bytes(len(ix))
                width,height,pixels=read_png(z.read(pngs[ordinal]))
                assert (width,height)==(row['width'],row['height']) and pixels==rgba
                checks+=len(ix)*4+12
    result={'pass':'P29','status':'PASS','checks':checks,'originalTowerImages':6,
            'sourceSetupRecords':2,'existingEffectFramesIndependentlyDecoded':7,'originalSetupControls':22,'newlyDiscoveredSourceImages':0,
            'indexedPixels':sum(len(ix) for ix,_,_ in planes),'sourceImagePrefixBytes':40776,
            'outsideImageFamilyBytes':72836,'exportPngAndSidecarParity':bool(args.export),
            'nativePaletteKnown':False,'fullStageScene':False}
    if args.report:args.report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,indent=2))

if __name__=='__main__':main()
