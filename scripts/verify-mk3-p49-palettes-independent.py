#!/usr/bin/env python3
"""Independent original IFF CMAP/BODY comparison for P49 indexed archives."""
import argparse,hashlib,json,struct,zipfile
from pathlib import Path
def original(blob):
    assert blob[:4]==b'FORM';kind=blob[8:12];chunks={};at=12
    while at+8<=len(blob):
        size=struct.unpack_from('>I',blob,at+4)[0];chunks[blob[at:at+4]]=blob[at+8:at+8+size];at+=8+size+(size&1)
    h=chunks[b'BMHD'];w,height=struct.unpack_from('>HH',h);planes,masking,compression=h[8:11];transparent=struct.unpack_from('>H',h,12)[0]
    palette=chunks[b'CMAP'];body=chunks[b'BODY'];at=0
    stride=w if kind==b'PBM ' else ((w+7)//8 if chunks.get(b'ANNO',b'').startswith(b'GWS/Windows 1.1n') else (w+15)//16*2)
    def row():
        nonlocal at
        out=bytearray()
        while len(out)<stride:
            if not compression:out.extend(body[at:at+stride]);at+=stride;break
            op=body[at];at+=1
            if op==128:continue
            count=op+1 if op<128 else 257-op
            if op<128:out.extend(body[at:at+count]);at+=count
            else:out.extend(bytes([body[at]])*count);at+=1
        assert len(out)==stride
        return out
    indices=bytearray();mask=bytearray()
    for y in range(height):
        lines=[row() for _ in range(1 if kind==b'PBM ' else planes+(masking==1))]
        for x in range(w):
            ix=lines[0][x] if kind==b'PBM ' else sum(((lines[p][x//8]>>(7-x%8))&1)<<p for p in range(planes))
            assert ix*3+2<len(palette);indices.append(ix)
            mask.append(int(ix!=transparent) if masking==2 else ((lines[planes][x//8]>>(7-x%8))&1 if masking==1 else 1))
    return palette,bytes(indices),bytes(mask)
def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('root',type=Path);ap.add_argument('output',type=Path);ap.add_argument('--report',type=Path,required=True);a=ap.parse_args()
    files=[p for p in a.root.rglob('*') if p.is_file() and p.name.lower()=='data.mk3'];assert len(files)==1;data=files[0].read_bytes()
    cases=json.loads((a.output/'cases.json').read_text());assert len(cases)==416
    pixels=0;palette_bytes=0
    for c in cases:
        pal,ix,mask=original(data[c['offset']:c['offset']+c['length']])
        with zipfile.ZipFile(a.output/c['file']) as z:
            assert z.testzip() is None
            assert z.read('indexed/00000_paletteRgb.bin')==pal
            assert z.read('indexed/00000_indices.bin')==ix and z.read('indexed/00000_mask.bin')==mask
            m=json.loads(z.read('manifest.json'))['selectionOrder'][0]['metadata']
            assert m['paletteFormat']=='IFF_CMAP_RGB8' and m['paletteRuntimeOwnershipKnown'] is False
        pixels+=len(ix);palette_bytes+=len(pal)
    j={'status':'PASS','sourceIffImages':416,'nativePixelsCompared':pixels,'originalCmapBytesCompared':palette_bytes,'dataMk3Sha256':hashlib.sha256(data).hexdigest(),'runtimePaletteOwnershipClaimed':False}
    a.report.write_text(json.dumps(j,indent=2)+'\n',encoding='utf-8');print(json.dumps(j,indent=2))
if __name__=='__main__':main()

