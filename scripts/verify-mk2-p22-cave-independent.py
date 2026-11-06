#!/usr/bin/env python3
"""Independent original-file CAVE 8-byte descriptor/row decoder and PNG verifier.

Writes hashes/geometry only to a reference JSON. Optional --export checks the
TypeScript evidence ZIP against independently decoded original bytes. Its PNG
reader uses Python zlib/CRC and supports all five row filters for RGBA8 exports.
"""
import argparse, hashlib, json, struct, zipfile, zlib
from pathlib import Path

EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
GRA_SHA='11e7988cabae63c8ee618700da47de648ef3bb1d9f7f8a8b23332c0513c83cb7'
H=lambda b:hashlib.sha256(b).hexdigest()

def read_png(data):
    assert data[:8]==b'\x89PNG\r\n\x1a\n'
    pos=8; compressed=bytearray(); header=None; ended=False
    while pos<len(data):
        assert pos+12<=len(data)
        size=struct.unpack_from('>I',data,pos)[0];kind=data[pos+4:pos+8];body=data[pos+8:pos+8+size]
        assert pos+12+size<=len(data)
        assert zlib.crc32(kind+body)&0xffffffff==struct.unpack_from('>I',data,pos+8+size)[0]
        pos+=12+size
        if kind==b'IHDR':
            assert header is None and size==13
            header=struct.unpack('>IIBBBBB',body)
        elif kind==b'IDAT':compressed.extend(body)
        elif kind==b'IEND':
            assert size==0 and pos==len(data);ended=True;break
    assert ended and header is not None
    width,height,depth,color,compression,filtering,interlace=header
    assert depth==8 and color==6 and compression==filtering==interlace==0
    raw=zlib.decompress(compressed);stride=width*4
    assert len(raw)==height*(stride+1)
    result=bytearray();previous=bytearray(stride)
    for y in range(height):
        offset=y*(stride+1);method=raw[offset];row=bytearray(raw[offset+1:offset+1+stride]);assert method<=4
        for x in range(stride):
            left=row[x-4] if x>=4 else 0;up=previous[x];diagonal=previous[x-4] if x>=4 else 0
            if method==1:predictor=left
            elif method==2:predictor=up
            elif method==3:predictor=(left+up)//2
            elif method==4:
                p=left+up-diagonal;distances=[abs(p-left),abs(p-up),abs(p-diagonal)]
                predictor=[left,up,diagonal][distances.index(min(distances))]
            else:predictor=0
            row[x]=(row[x]+predictor)&255
        result.extend(row);previous=row
    return width,height,bytes(result)

def originals(root):
    entries={}
    for p in root.rglob('*'):
        if p.is_file(): entries.setdefault(p.name.lower(),[]).append(p)
    assert len(entries.get('mk2.exe',[]))==1 and len(entries.get('cave.gra',[]))==1
    exe=entries['mk2.exe'][0].read_bytes(); gra=entries['cave.gra'][0].read_bytes()
    assert H(exe)==EXE_SHA and H(gra)==GRA_SHA
    assert exe[0xa0ef1:0xa13a7].split(b'\0')[29]==b'CAVE.GRA'
    rows=[]; planes=[]; previous=120; checks=3
    for ordinal in range(49):
        physical=0xa0c54+0x18260+ordinal*8
        width,height,ref=struct.unpack_from('<HHI',exe,physical)
        assert ref>>24==29 and ref&0xffffff==previous
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
    assert previous==len(gra)==57312
    return {'schema':'mkdos_p22_cave_independent_reference_v1','exeSha256':EXE_SHA,'graSha256':GRA_SHA,
            'sourcePrefixUnqualifiedBytes':120,'sourceEndExclusive':57312,'images':rows},planes,checks+1

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
                assert asset['id']==f'mk2-cave-source:{ordinal}:original-indices'
                assert asset['source']['offset']==row['start'] and asset['source']['length']==row['endExclusive']-row['start']
                assert asset['metadata']['sourceDescriptorPhysical']==row['descriptorPhysical']
                for flag in ['runtimePaletteKnown','stageOwnershipKnown','nativeTimingKnown','fullStageScene']:
                    assert asset['metadata'][flag] is False
                assert z.read(f'indexed/{ordinal:05}_indices.bin')==ix
                assert z.read(f'indexed/{ordinal:05}_mask.bin')==mask
                assert z.read(f'indexed/{ordinal:05}_paletteKnownMask.bin')==bytes(len(ix))
                width,height,pixels=read_png(z.read(pngs[ordinal]))
                assert (width,height)==(row['width'],row['height']) and pixels==rgba
                checks+=len(ix)*4+12
    result={'pass':'P22','status':'PASS','checks':checks,'originalCaveImages':49,
            'indexedPixels':sum(len(ix) for ix,_,_ in planes),'sourceSuffixBytes':57192,
            'unqualifiedPrefixBytes':120,'exportPngAndSidecarParity':bool(args.export),
            'nativePaletteKnown':False,'fullStageScene':False}
    if args.report:args.report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,indent=2))

if __name__=='__main__':main()
