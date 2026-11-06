#!/usr/bin/env python3
"""Independent original-file FOREST 8-byte descriptor/row decoder and PNG verifier.

Writes hashes/geometry only to a reference JSON. Optional --export checks the
TypeScript evidence ZIP against independently decoded original bytes. Its PNG
reader uses Python zlib/CRC and supports all five row filters for RGBA8 exports.
"""
import argparse, hashlib, json, struct, zipfile, zlib
from pathlib import Path

EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
GRA_SHA='8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9'
H=lambda b:hashlib.sha256(b).hexdigest()

import runpy
read_png=runpy.run_path(str(Path(__file__).with_name('verify-mk2-p22-cave-independent.py')))['read_png']

def originals(root):
    entries={}
    for p in root.rglob('*'):
        if p.is_file(): entries.setdefault(p.name.lower(),[]).append(p)
    assert len(entries.get('mk2.exe',[]))==1 and len(entries.get('forest.gra',[]))==1
    exe=entries['mk2.exe'][0].read_bytes(); gra=entries['forest.gra'][0].read_bytes()
    assert H(exe)==EXE_SHA and H(gra)==GRA_SHA
    assert exe[0xa0ef1:0xa13a7].split(b'\0')[27]==b'FOREST.GRA'
    rows=[]; planes=[]; previous=0; checks=3
    for ordinal in range(49):
        physical=0xa0c54+0x16d8c+ordinal*8
        width,height,ref=struct.unpack_from('<HHI',exe,physical)
        assert ref>>24==27 and ref&0xffffff==previous
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
        row=dict(ordinal=ordinal,descriptorPhysical=physical,width=width,height=height,
                 start=previous,endExclusive=pos,indicesSha256=H(ix),maskSha256=H(mask),
                 paletteKnownSha256=H(known),rgbaSha256=H(rgba),encodedSha256=H(gra[previous:pos]))
        rows.append(row);planes.append((ix,mask,rgba));previous=pos;checks+=len(ix)*2+5
    assert previous==164752 and len(gra)==226788
    setups=[]
    for setup in [0x16f8c,0x16f9e,0x16fb0,0x16fc2,0x16fd4]:
        base=0xa0c54; width,height,count=struct.unpack_from('<HHH',exe,base+setup)
        control,table,palette=struct.unpack_from('<III',exe,base+setup+6)
        assert table==0x16d8c and palette==0x171d0
        canvas=bytearray(width*height);paint=bytearray(width*height);placements=[]
        for i in range(count):
            flags,x,y,pair=struct.unpack_from('<HHHH',exe,base+control+8*i)
            assert ((flags&15)|((pair&0xf000)>>8))==2
            displacement=(pair&0xfff)*4;assert displacement%8==0
            ordinal=displacement//8;assert 0<=ordinal<49
            row=rows[ordinal];ix,mask,_=planes[ordinal]
            x=x-65536 if x>=32768 else x;y=y-65536 if y>=32768 else y
            placements.append(dict(ordinal=ordinal,x=x,y=y))
            for j,value in enumerate(ix):
                if not mask[j]:continue
                px=x+j%row['width'];py=y+j//row['width']
                if 0<=px<width and 0<=py<height:canvas[py*width+px]=value;paint[py*width+px]=1
        setups.append(dict(setupObject2Offset=setup,assetId=f'mk2-forest-setup:{len(setups)+1}:indices-preview',width=width,height=height,
                           placements=placements,indicesSha256=H(canvas),maskSha256=H(paint)))
        checks+=2*len(canvas)+count
    for row in rows:
        uses=[]
        for setup in setups:
            chosen=[p for p in setup['placements'] if p['ordinal']==row['ordinal']]
            if chosen:uses.append(dict(assetId=setup['assetId'],setupObject2Offset=setup['setupObject2Offset'],occurrences=len(chosen),
                clippedPlacements=sum(p['x']<0 or p['y']<0 or p['x']+row['width']>setup['width'] or p['y']+row['height']>setup['height'] for p in chosen)))
        row['sourceSetupUses']=uses
    assert sum(len(s['placements']) for s in setups)==60
    assert sum(bool(r['sourceSetupUses']) for r in rows)==43
    return {'schema':'mkdos_p30_forest_independent_reference_v1','exeSha256':EXE_SHA,'graSha256':GRA_SHA,
            'outsideImageFamilyBytes':62036,'sourceEndExclusive':164752,'images':rows,'sourceSetupCanvases':setups},planes,checks+1

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
            assert len(assets)==49 and len(z.namelist())==197
            pngs=[n for n in z.namelist() if n.startswith('assets/')];assert len(pngs)==49
            for ordinal,(row,asset,(ix,mask,rgba)) in enumerate(zip(reference['images'],assets,planes)):
                assert asset['id']==f'mk2-forest-source:{ordinal}:original-indices'
                assert asset['source']['offset']==row['start'] and asset['source']['length']==row['endExclusive']-row['start']
                assert asset['metadata']['sourceDescriptorPhysical']==row['descriptorPhysical']
                assert asset['metadata']['sourceSetupUses']==row['sourceSetupUses']
                assert asset['metadata']['componentPreviouslyUsedInMosaics'] == bool(row['sourceSetupUses'])
                assert asset['metadata']['newlyDiscoveredSourceImage'] is False
                for flag in ['runtimePaletteKnown','stageOwnershipKnown','nativeTimingKnown','fullStageScene']:
                    assert asset['metadata'][flag] is False
                assert z.read(f'indexed/{ordinal:05}_indices.bin')==ix
                assert z.read(f'indexed/{ordinal:05}_mask.bin')==mask
                assert z.read(f'indexed/{ordinal:05}_paletteKnownMask.bin')==bytes(len(ix))
                width,height,pixels=read_png(z.read(pngs[ordinal]))
                assert (width,height)==(row['width'],row['height']) and pixels==rgba
                checks+=len(ix)*4+12
    result={'pass':'P30','status':'PASS','checks':checks,'originalForestImages':49,
            'existingSetupLayers':5,'originalSetupPlacements':60,'newlyDiscoveredSourceImages':0,
            'indexedPixels':sum(len(ix) for ix,_,_ in planes),'sourceImagePrefixBytes':164752,
            'outsideImageFamilyBytes':62036,'exportPngAndSidecarParity':bool(args.export),
            'nativePaletteKnown':False,'fullStageScene':False}
    if args.report:args.report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,indent=2))

if __name__=='__main__':main()
