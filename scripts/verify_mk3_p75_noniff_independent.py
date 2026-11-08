#!/usr/bin/env python3
"""P75 independent original MK3 source/row-map/PNG reader; no P75 imports.

Original DOS fixture and private export bytes are read locally only.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import struct
import zipfile

from verify_mk3_p74_noniff_independent import png_readback

CANON_SHA = '72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517'
FORMAT = 'mk3_p75_noniff_source_row_table_indexed_canvases_v1'


def require(ok, what):
    if not ok:
        raise ValueError('Independent P75: '+what)


def sha(x):return hashlib.sha256(x).hexdigest()


def load_data(input_path):
    p=Path(input_path)
    if p.is_dir():
        matches=[x for x in p.rglob('*') if x.is_file() and x.name.upper()=='DATA.MK3']
        require(len(matches)==1,'unique original DATA.MK3')
        return matches[0].read_bytes()
    if p.name.upper()=='DATA.MK3' and p.is_file():return p.read_bytes()
    with zipfile.ZipFile(p) as z:
        matches=[name for name in z.namelist() if name.rsplit('/',1)[-1].upper()=='DATA.MK3']
        require(len(matches)==1,'one original DATA.MK3 in ZIP')
        return z.read(matches[0])


def original_noniff_regions(data):
    forms=[]
    cursor=0
    while cursor+12<=len(data):
        if data[cursor:cursor+4]!=b'FORM' or data[cursor+8:cursor+12] not in (b'PBM ',b'ILBM'):
            cursor+=1;continue
        size=struct.unpack_from('>I',data,cursor+4)[0]+8
        require(20<=size<=len(data)-cursor,'IFF FORM length')
        walk=cursor+12
        tags=set()
        while walk<cursor+size:
            require(walk+8<=cursor+size,'IFF chunk size')
            tag=data[walk:walk+4];length=struct.unpack_from('>I',data,walk+4)[0]
            require(walk+8+length<=cursor+size,'IFF chunk bounds')
            tags.add(tag)
            walk+=8+length+(length&1)
        require(walk==cursor+size and {b'BMHD',b'CMAP',b'BODY'}<=tags,'IFF boundary and chunk inventory')
        forms.append((cursor,cursor+size))
        cursor+=size
    gaps=[];end=0
    for a,b in forms:
        if a>end:gaps.append((end,a))
        end=b
    if end<len(data):gaps.append((end,len(data)))
    return forms,gaps


def independent_row_decode(data,begin,packed_length,width,height,lefts,starts):
    require(len(lefts)==height and len(starts)==height,'row tables lengths')
    positions=bytes(width*height)
    pixels=bytearray(positions)
    alpha=bytearray(positions)
    source_rows=[y for y in range(height) if lefts[y]>=0]
    require(source_rows,'some source rows')
    require(starts[source_rows[0]]==0,'first source row starts at 0')
    require(all(lefts[y]==-1 and starts[y]==0 for y in range(height) if y not in source_rows),
            'omitted row sentinel and packed offset parity')
    total=0;trailing=b''
    for i,y in enumerate(source_rows):
        offset=starts[y]
        end=starts[source_rows[i+1]] if i+1<len(source_rows) else packed_length
        require(0<=offset<end<=packed_length,'packed row starts/ends')
        x=lefts[y]
        require(0<=x<width,'original X location in full image')
        current=begin+offset
        bound=begin+end
        while True:
            require(current+2<=bound,'row command terminator')
            command=int.from_bytes(data[current:current+2],'little',signed=True)
            current+=2
            if command==0:break
            if command<0:
                x+=abs(command)
            else:
                require(current+command<=bound,'literal available')
                require(x+command<=width,'literal inside image')
                left=y*width+x
                pixels[left:left+command]=data[current:current+command]
                alpha[left:left+command]=bytes((1,))*command
                total+=command
                current+=command
                x+=command
            require(x<=width,'row spans image width')
        remainder=data[current:bound]
        require(len(remainder)==0 or (len(remainder)==1 and i==len(source_rows)-1),
                'only final packed source byte may be unexplained')
        if remainder:trailing=remainder
    return bytes(pixels),bytes(alpha),total,len(source_rows),trailing


def verify(source,archive):
    require(sha(source)==CANON_SHA,'unexpected DOS DATA.MK3 source')
    forms,gaps=original_noniff_regions(source)
    require(len(forms)==416 and len(gaps)==20,'independent source IFF/non-IFF interval census')
    with zipfile.ZipFile(archive) as z:
        require(z.testzip() is None,'private ZIP CRC')
        names=z.namelist()
        require(len(names)==len(set(names))==154,'exact original private output entry inventory')
        manifest=json.loads(z.read('manifest.json'))
        require(manifest['format']==FORMAT and manifest['originalSourceWholeSha256']==CANON_SHA,
                'manifest format and original source fingerprint')
        require(manifest['nativePaletteOwnershipVerified'] is False and
                manifest['nativeStageOrSequenceTimingVerified'] is False and
                manifest['applicationAssetCatalogueModified'] is False,
                'no native stage/palette/app claims')
        require(len(manifest['records'])==19,'row canvas records')
        rows,absents,pixcount,painted,remainder=0,0,0,0,0
        for n,record in enumerate(manifest['records'],1):
            start,end=gaps[n]
            require(record['regionOrdinal']==n and record['regionOffset']==start and
                    record['regionLength']==end-start,'gap partition source identity')
            width,height=struct.unpack_from('<HH',source,start)
            compressed=struct.unpack_from('<I',source,start+20)[0]
            packed_begin=start+792
            packed_end=packed_begin+compressed
            x_begin=packed_end
            off_begin=x_begin+4*height
            maps_end=off_begin+4*height
            require(maps_end<=end,'packed stream and row metadata source bounds')
            require(record['width']==width and record['height']==height and
                    record['sourceCompressedFirstStreamOffset']==packed_begin and
                    record['sourceCompressedFirstStreamLength']==compressed and
                    record['sourceRowXTableOffset']==x_begin and
                    record['sourceRowCompressedOffsetTableOffset']==off_begin and
                    record['sourceAfterRowTablesOffset']==maps_end and
                    record['sourceAfterRowTablesLength']==end-maps_end,
                    'all source extents match independent directory')
            xs=struct.unpack_from('<'+str(height)+'i',source,x_begin)
            offs=struct.unpack_from('<'+str(height)+'I',source,off_begin)
            candidate=source[start+24:packed_begin]
            original_map={
              'firstCompressedStream':source[packed_begin:packed_end],
              'sourceRowXTable':source[x_begin:off_begin],
              'sourceRowOffsetTable':source[off_begin:maps_end],
              'adjacentUnlabeledRgb8Candidate':candidate,
            }
            idx,mask,actual_painted,present,trailing=independent_row_decode(
                source,packed_begin,compressed,width,height,xs,offs)
            original_map.update({'sourceMappedIndices':idx,'sourceMappedOpacityMask':mask})
            require(record['sourceRowsWithPackedData']==present and
                    record['sourceMinusOneRowsWithoutPackedData']==height-present and
                    record['firstStreamUnexplainedTrailingByteHex']==trailing.hex() and
                    record['paintedPixels']==actual_painted,
                    'independent row metadata/paint census')
            require(record['allDeclaredRowsAccountedForViaSourceTables'] is True and
                    record['nativeFighterPaletteOwnershipVerified'] is False and
                    record['nativeStageMembershipOrFrameTimingClaimed'] is False and
                    record['sourceAdjacentRgb8IsOnlyExperimental'] is True and
                    record['sourceRemainderAfterRowTablesDecoded'] is False,
                    'false source/native claims')
            outputs=record['outputs']
            for key,expected in original_map.items():
                desc=outputs[key]
                require(desc['length']==len(expected) and desc['sha256']==sha(expected) and
                        z.read(desc['path'])==expected,'source/readback exact byte parity: '+key)
            for is_color,key in ((False,'grayscaleIndexedPreview'),(True,'adjacentRgb8ComparisonOnlyPreview')):
                desc=outputs[key]
                image=z.read(desc['path'])
                require(len(image)==desc['length'] and sha(image)==desc['sha256'],
                        'PNG bytes/manifest hash match')
                w,h,rgba=png_readback(image)
                require((w,h)==(width,height),'PNG geometry')
                for j,opaque in enumerate(mask):
                    value=rgba[j*4:j*4+4]
                    if not opaque:
                        require(value==b'\0\0\0\0','PNG absent pixel transparent')
                    else:
                        index=idx[j]
                        if is_color: rgb=candidate[3*index:3*index+3]
                        else:
                            grey=32+(index*223+127)//255
                            rgb=bytes((grey,grey,grey))
                        require(value==rgb+b'\xff','PNG original indexed pixel mismatch')
            rows+=height;absents+=height-present;pixcount+=width*height
            painted+=actual_painted;remainder+=end-maps_end
        require(rows==3015 and absents==271 and pixcount==2050843 and
                painted==996697 and remainder==1611110,'independent original census match')
        for k,value in [('sourceRowsDeclared',rows),('sourceMinusOneRows',absents),
                        ('sourceIndexedCanvasPixelPositions',pixcount),
                        ('sourceExplicitPaintedPixels',painted),
                        ('undecodedBytesAfterSourceRowTables',remainder)]:
            require(manifest[k]==value,'manifest source census '+k)
        return {'pass':'P75_INDEPENDENT','status':'PASS','originalSourceSha256':CANON_SHA,
                'rowMappedCanvases':19,'sourceRowsDeclared':rows,
                'sourceAbsentRows':absents,'indexedPositionsPerPlane':pixcount,
                'paintedPixels':painted,'pngImagesCheckedPixelwise':38,
                'undecodedPostTableSourceBytes':remainder,
                'nativePaletteOwnershipVerified':False}


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('original_mk3',type=Path)
    p.add_argument('private_p75_zip',type=Path)
    args=p.parse_args()
    print(json.dumps(verify(load_data(args.original_mk3),args.private_p75_zip)))


if __name__=='__main__':main()
