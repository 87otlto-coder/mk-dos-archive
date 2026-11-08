#!/usr/bin/env python3
"""Independent original-byte/ZIP/PNG readback for P74 non-IFF indexed previews.

This verifier does not import/use the P74 decoder. Original commercial files stay local.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import zipfile
import zlib

EXPECTED_DATA_SHA = '72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517'
EXPECTED_FULL = {1,2,5,6,8,9,10,11,12,13,14,15,17,18}
EXPECTED_PARTIAL = {3,4,7,16,19}


def require(condition, message):
    if not condition:
        raise ValueError('Independent P74 readback: ' + message)


def get_data(input_path):
    path=Path(input_path)
    if path.is_dir():
        matches=[v for v in (list(path.glob('DATA.MK3'))+list(path.glob('mk3/DATA.MK3')))
                 if v.is_file()]
        require(len(matches)==1,'original DATA.MK3 file is unique')
        return matches[0].read_bytes()
    if path.name.upper()=='DATA.MK3':
        return path.read_bytes()
    with zipfile.ZipFile(path) as z:
        names=[n for n in z.namelist() if n.upper().endswith('/DATA.MK3') or n.upper()=='DATA.MK3']
        require(len(names)==1,'private archive has one DATA.MK3')
        return z.read(names[0])


def sha(buf):
    return hashlib.sha256(buf).hexdigest()


def decode_independent_stream(packed,width,height):
    # An independent row parser; all values are decoded as signed little-endian
    # commands and every byte boundary is checked against the original stream.
    planes=bytearray(width*height)
    opacity=bytearray(width*height)
    i=0; row=0; rendered=0
    while row<height and i+2<=len(packed):
        x=0
        while True:
            require(i+2<=len(packed),'truncated command in row')
            v=int.from_bytes(packed[i:i+2], 'little', signed=True);i+=2
            if v==0:break
            if v<0:
                x+=abs(v)
                require(x<=width,'negative skip outside row')
            else:
                require(x+v<=width and i+v<=len(packed),'literal outside row/source')
                a=row*width+x
                planes[a:a+v]=packed[i:i+v]
                opacity[a:a+v]=b'\1'*v
                rendered+=v
                i+=v;x+=v
        row+=1
    require(len(packed)-i in (0,1),'unaccounted packed source trailing bytes')
    return bytes(planes),bytes(opacity),row,rendered,packed[i:]


def png_readback(source):
    require(source.startswith(b'\x89PNG\r\n\x1a\n'),'invalid PNG magic')
    offset=8;parts=[];size=None;end=False
    while offset<len(source):
        require(offset+12<=len(source),'truncated PNG chunk')
        n=struct.unpack_from('>I',source,offset)[0];tag=source[offset+4:offset+8]
        require(offset+12+n<=len(source),'invalid PNG chunk length')
        value=source[offset+8:offset+8+n]
        check=struct.unpack_from('>I',source,offset+8+n)[0]
        require((zlib.crc32(tag+value)&0xffffffff)==check,'PNG chunk CRC mismatch')
        offset+=12+n
        if tag==b'IHDR':
            require(size is None and n==13,'PNG IHDR')
            w,h,depth,color,comp,flt,interlace=struct.unpack('>IIBBBBB',value)
            require((depth,color,comp,flt,interlace)==(8,6,0,0,0),'PNG is not RGBA8 non-interlaced')
            size=(w,h)
        elif tag==b'IDAT':parts.append(value)
        elif tag==b'IEND':require(n==0,'PNG IEND');end=True;break
        else:require(False,'unrecognized PNG chunk '+str(tag))
    require(end and offset==len(source) and size is not None,'PNG incomplete/trailing bytes')
    width,height=size
    raw=zlib.decompress(b''.join(parts))
    require(len(raw)==height*(width*4+1),'PNG decompressed scanline count')
    rgba=bytearray(width*height*4)
    for y in range(height):
        src=y*(width*4+1)
        require(raw[src]==0,'unexpected PNG filter')
        rgba[y*width*4:(y+1)*width*4]=raw[src+1:src+1+width*4]
    return width,height,bytes(rgba)


def verify(data, archive):
    require(sha(data)==EXPECTED_DATA_SHA,'original DATA.MK3 fingerprint mismatch')
    with zipfile.ZipFile(archive) as z:
        require(len(z.namelist())==len(set(z.namelist())),'duplicate private ZIP paths')
        records=json.loads(z.read('manifest.json'))
        require(records['format']=='mk3_p74_source_first_stream_indexed_graphics_v1','unexpected manifest format')
        require(records['sourceWholeFileSha256']==sha(data),'ZIP source identity')
        require(records['fullFirstImageCount']==14 and records['partialFirstImageCount']==5,
                'first-source region counts')
        require(records['newCanonicalNativeFighterPaletteOwnershipClaimed'] is False and
                records['nativeStageMembershipOrTimelineClaimed'] is False and
                records['remainderBeyondFirstStreamsDecoded'] is False,
                'false runtime/native ownership claim')
        full=set();partial=set();pixels=0
        for r in records['records']:
            ordinal=r['regionOrdinal']
            loc=r['sourceFirstStreamOffset'];end=loc+r['sourceFirstStreamLength']
            palette_loc=r['sourceLocalCandidateRgb8Offset']
            require(0<=r['regionOffset']<loc<end<=r['regionOffset']+r['regionLength']<=len(data),
                    'source region / packed stream boundaries')
            require(loc==r['regionOffset']+792 and palette_loc==r['regionOffset']+24,
                    'source-local palette and RLE offset join')
            require(struct.unpack_from('<HH',data,r['regionOffset'])==(r['width'],r['height']),
                    'independent source dimensions')
            require(struct.unpack_from('<I',data,r['regionOffset']+20)[0]==r['sourceFirstStreamLength'],
                    'independent source packed length')
            original_packed=data[loc:end]
            packed=z.read(r['sourceFirstStreamPrivateZipPath'])
            require(original_packed==packed and sha(packed)==r['firstStreamSha256'],
                    'compressed stream original bytes mismatch')
            palette=data[palette_loc:palette_loc+768]
            require(palette==z.read(r['sourceLocalCandidateRgb8PrivateZipPath']) and
                    sha(palette)==r['sourceLocalCandidateRgb8Sha256'],'source-local RGB bytes mismatch')
            require(r['nativeFighterPaletteOwnershipVerified'] is False and
                    r['unlabeledRgb8NativePaletteOwnershipVerified'] is False and
                    r['stageCompositionOrRuntimeTimingVerified'] is False,
                    'false ownership or runtime claim')
            idx,mask,rows,paint,tail=decode_independent_stream(packed,r['width'],r['height'])
            require(rows==r['explicitDecodedRows'] and paint==r['literalPixelCount'] and
                    len(tail)==r['firstStreamUnparsedTrailingBytes'] and
                    tail.hex()==r['firstStreamUnparsedTrailingByteHex'],
                    'independent parser/source row census mismatch')
            if r['fullFirstImageReconstruction']:
                full.add(ordinal)
                require(rows==r['height'] and r['unresolvedTrailingRows']==0,'full means all rows parsed')
                require(idx==z.read(r['indexedPixelsPrivateZipPath']) and
                        mask==z.read(r['opacityMaskPrivateZipPath']),'original indexed planes readback mismatch')
                require(sha(idx)==r['indexedPixelsSha256'] and sha(mask)==r['opacityMaskSha256'],
                        'indexed plane provenance mismatch')
                for is_color, path in [(False,r['indexedGrayscalePng']),(True,r['sourceAdjacentRgb8ComparisonPng'])]:
                    w,h,rgba=png_readback(z.read(path))
                    require((w,h)==(r['width'],r['height']),'PNG size mismatch')
                    for i,opaque in enumerate(mask):
                        actual=rgba[4*i:4*i+4]
                        if opaque:
                            v=idx[i]
                            if is_color:rgb=palette[v*3:v*3+3]
                            else:
                                c=32+(v*223+127)//255;rgb=bytes((c,c,c))
                            require(actual==rgb+b'\xff','PNG RGBA vs original pixel mismatch')
                        else:require(actual==b'\0\0\0\0','PNG transparent source mismatch')
                pixels+=len(idx)
            else:
                partial.add(ordinal)
                require(rows<r['height'] and r['unresolvedTrailingRows']==r['height']-rows,
                        'partial region must not silently fill unknown rows')
                require(r['indexedPixelsSha256'] is None and r['opacityMaskSha256'] is None,
                        'partial region incorrectly exported as complete')
        require(full==EXPECTED_FULL and partial==EXPECTED_PARTIAL,
                'expected complete and partial original source region identities')
        return {'pass':'P74_INDEPENDENT','status':'PASS','sourceSha256':sha(data),
                'fullyReconstructedIndexedImages':len(full),'partialFirstStreams':len(partial),
                'independentlyCheckedPixelsPerPlane':pixels,
                'independentlyCheckedRGBAImageCount':2*len(full),
                'noNativePaletteOwnershipClaimed':True}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('original_mk3',type=Path)
    parser.add_argument('private_p74_zip',type=Path)
    a=parser.parse_args()
    print(json.dumps(verify(get_data(a.original_mk3), a.private_p74_zip)))


if __name__ == '__main__':
    main()
