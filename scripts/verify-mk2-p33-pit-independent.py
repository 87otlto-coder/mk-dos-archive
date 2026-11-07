#!/usr/bin/env python3
"""Independent original-file PIT 8-byte descriptor/row decoder and PNG verifier.

Writes hashes/geometry only to a reference JSON. Optional --export checks the
TypeScript evidence ZIP against independently decoded original bytes. Its PNG
reader uses Python zlib/CRC and supports all five row filters for RGBA8 exports.
"""
import argparse, hashlib, json, struct, zipfile, zlib
from pathlib import Path

EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
GRA_SHA='af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96'
H=lambda b:hashlib.sha256(b).hexdigest()

import runpy
read_png=runpy.run_path(str(Path(__file__).with_name('verify-mk2-p22-cave-independent.py')))['read_png']

def originals(root):
    entries={}
    for p in root.rglob('*'):
        if p.is_file(): entries.setdefault(p.name.lower(),[]).append(p)
    assert len(entries.get('mk2.exe',[]))==1 and len(entries.get('pit.gra',[]))==1
    exe=entries['mk2.exe'][0].read_bytes(); gra=entries['pit.gra'][0].read_bytes()
    assert H(exe)==EXE_SHA and H(gra)==GRA_SHA
    assert exe[0xa0ef1:0xa13a7].split(b'\0')[32]==b'PIT.GRA'
    rows=[]; planes=[]; previous=0; checks=3
    for ordinal in range(28):
        physical=0xa0c54+0x18bb0+ordinal*8
        width,height,ref=struct.unpack_from('<HHI',exe,physical)
        assert ref>>24==32 and ref&0xffffff==previous
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
        row['paintedIndexZeroPixels']=sum(a and v==0 for v,a in zip(ix,mask))
        rows.append(row);planes.append((ix,mask,rgba));previous=pos;checks+=len(ix)*2+5
    assert previous==61620 and len(gra)==69384
    setups=[]
    for setup in [0x18b44,0x18b56,0x18b68,0x18b7a,0x18b8c,0x18b9e]:
        base=0xa0c54; width,height,count=struct.unpack_from('<HHH',exe,base+setup)
        control,table,palette=struct.unpack_from('<III',exe,base+setup+6)
        assert table==0x18bb0 and palette==0x18d40
        canvas=bytearray(width*height);paint=bytearray(width*height);placements=[]
        for i in range(count):
            flags,x,y,pair=struct.unpack_from('<HHHH',exe,base+control+8*i)
            assert ((flags&15)|((pair&0xf000)>>8))==2
            displacement=(pair&0xfff)*4;assert displacement%8==0
            ordinal=displacement//8;assert 0<=ordinal<28
            row=rows[ordinal];ix,mask,_=planes[ordinal]
            x=x-65536 if x>=32768 else x;y=y-65536 if y>=32768 else y
            placements.append(dict(ordinal=ordinal,x=x,y=y))
            for j,value in enumerate(ix):
                if not mask[j]:continue
                px=x+j%row['width'];py=y+j//row['width']
                if 0<=px<width and 0<=py<height:canvas[py*width+px]=value;paint[py*width+px]=1
        setups.append(dict(setupObject2Offset=setup,assetId=f'mk2-pit-upper-setup:{len(setups)+1}:source-palette',width=width,height=height,
                           placements=placements,indicesSha256=H(canvas),maskSha256=H(paint)))
        checks+=2*len(canvas)+count
    for row in rows:
        uses=[]
        for setup in setups:
            chosen=[p for p in setup['placements'] if p['ordinal']==row['ordinal']]
            if chosen:uses.append(dict(assetId=setup['assetId'],setupObject2Offset=setup['setupObject2Offset'],occurrences=len(chosen),
                clippedPlacements=sum(p['x']<0 or p['y']<0 or p['x']+row['width']>setup['width'] or p['y']+row['height']>setup['height'] for p in chosen)))
        row['sourceSetupUses']=uses
    assert sum(len(s['placements']) for s in setups)==126
    assert all(r['sourceSetupUses'] for r in rows)
    bridge=[]
    for group,source_list in enumerate([0x18afc,0x18b20]):
        pointers=struct.unpack_from('<7I',exe,0xa0c54+source_list)
        assert struct.unpack_from('<II',exe,0xa0c54+source_list+28)==(1,source_list)
        for pose,offset in enumerate(pointers):
            physical=0xa0c54+offset;width,height,x,y,packed=struct.unpack_from('<HHhhI',exe,physical)
            assert packed>>24==32 and packed&0xffffff==previous
            assert (width,height)==(16,24 if group==0 else 32)
            pos=previous;values=[];coverage=[]
            for _ in range(height):
                line=[];paint=[]
                while len(line)<width:
                    word=struct.unpack_from('<I',gra,pos)[0];pos+=4
                    if word&1:n=word>>1;chunk=[0]*n;cm=[0]*n
                    elif word&2:n=word>>10;chunk=[(word>>2)&255]*n;cm=[1]*n
                    else:
                        n=word>>2;assert 0<n<=64
                        chunk=list(gra[pos:pos+n]);cm=[1]*n;pos+=(n+3)&~3
                    assert 0<n<=width-len(line)
                    line.extend(chunk);paint.extend(cm)
                values.extend(line);coverage.extend(paint)
            ix=bytes(values);mask=bytes(coverage)
            bridge.append(dict(assetId=f'mk2-pit-bridge:{["green","flame"][group]}:{pose}',descriptorPhysical=physical,
                width=width,height=height,start=previous,endExclusive=pos,indicesSha256=H(ix),maskSha256=H(mask)))
            previous=pos;checks+=2*len(ix)+5
    assert previous==len(gra)==69384 and len(bridge)==14
    return {'schema':'mkdos_p33_pit_independent_reference_v1','exeSha256':EXE_SHA,'graSha256':GRA_SHA,
            'outsideImageFamilyBytes':7764,'sourceEndExclusive':61620,'images':rows,'sourceSetupCanvases':setups,
            'existingBridgeFrames':bridge,'fullIndexedResourceEndExclusive':69384},planes,checks+1


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
            assert len(assets)==28 and len(z.namelist())==113
            pngs=[n for n in z.namelist() if n.startswith('assets/')];assert len(pngs)==28
            for ordinal,(row,asset,(ix,mask,rgba)) in enumerate(zip(reference['images'],assets,planes)):
                assert asset['id']==f'mk2-pit-source:{ordinal}:original-indices'
                assert asset['source']['offset']==row['start'] and asset['source']['length']==row['endExclusive']-row['start']
                assert asset['metadata']['sourceDescriptorPhysical']==row['descriptorPhysical']
                assert asset['metadata']['sourceSetupUses']==row['sourceSetupUses']
                assert asset['metadata']['maskIsRuntimeAlpha'] is False
                assert asset['metadata']['sourcePaintedIndexZeroPixels']==row['paintedIndexZeroPixels']
                assert asset['metadata']['componentPreviouslyUsedInMosaics'] == bool(row['sourceSetupUses'])
                assert asset['metadata']['newlyDiscoveredSourceImage'] is False
                for flag in ['runtimePaletteKnown','stageOwnershipKnown','nativeTimingKnown','fullStageScene','worldPlacementKnown','sourceTableOrderIsAnimation','setupRelationshipsAreRuntimePlacement']:
                    assert asset['metadata'][flag] is False
                assert z.read(f'indexed/{ordinal:05}_indices.bin')==ix
                assert z.read(f'indexed/{ordinal:05}_mask.bin')==mask
                assert z.read(f'indexed/{ordinal:05}_paletteKnownMask.bin')==bytes(len(ix))
                width,height,pixels=read_png(z.read(pngs[ordinal]))
                assert (width,height)==(row['width'],row['height']) and pixels==rgba
                checks+=len(ix)*4+12
    result={'pass':'P33','status':'PASS','checks':checks,'originalPitImages':28,
            'existingSetupLayers':6,'originalSetupPlacements':126,'newlyDiscoveredSourceImages':0,
            'indexedPixels':sum(len(ix) for ix,_,_ in planes),'sourceImagePrefixBytes':61620,
            'outsideImageFamilyBytes':7764,'paintedIndexZeroPixels':sum(r['paintedIndexZeroPixels'] for r in reference['images']),'existingBridgeFramesIndependentlyDecoded':14,'exportPngAndSidecarParity':bool(args.export),
            'nativePaletteKnown':False,'fullStageScene':False}
    if args.report:args.report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,indent=2))

if __name__=='__main__':main()
