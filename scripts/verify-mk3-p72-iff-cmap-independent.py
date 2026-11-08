#!/usr/bin/env python3
"""P72 independent original MK3 FTR index + DATA.MK3 IFF CMAP comparison oracle.

No palette ownership is inferred. Reads original MFIL/FHDS/FDAT packed
sprite, independently finds original FORM CMAP, and checks comparison PNG
RGBA plus lossless indexed/mask/source CMAP ZIP members byte-for-byte.
"""
import hashlib
import io
import json
from pathlib import Path
import runpy
import struct
import sys
from zipfile import ZipFile
from PIL import Image

BASE=Path(__file__).resolve().parent
P69=runpy.run_path(str(BASE/'verify-mk3-p69-ftr-independent.py'))
source_file=P69['source_file']
mfil_chunks=P69['mfil_chunks']
decode_independent=P69['decode_independent']
u16=P69['little_u16']
i16=P69['little_i16']
u32=P69['little_u32']
DEPTHS=P69['DEPTHS']

def require(ok,why):
    if not ok:raise ValueError('P72 original sprite/CMAP comparison: '+why)

def sha(data):return hashlib.sha256(data).hexdigest()

def read_original_cmap(data,off,length):
    require(off>=0 and length>=12 and off+length<=len(data),'IFF original FORM extent')
    form=data[off:off+length]
    require(form[:4]==b'FORM' and form[8:12] in (b'PBM ',b'ILBM'),'original IFF FORM type')
    require(struct.unpack_from('>I',form,4)[0]+8==length,'original IFF FORM length')
    p=12;found=[]
    while p+8<=len(form):
        tag=form[p:p+4]
        size=struct.unpack_from('>I',form,p+4)[0]
        require(p+8+size<=len(form),'original FORM subchunk extent')
        if tag==b'CMAP':
            found.append(form[p+8:p+8+size])
        p+=8+size+(size&1)
    require(p==len(form) and len(found)==1 and len(found[0])==768,
            'original 256-entry RGB8 IFF palette missing/ambiguous')
    return found[0]

def read_original_fighter_frame(data,record):
    header=record['originalDescriptorHeaderOffset']
    require(header>=0,'missing original FHDS descriptor')
    chunks=mfil_chunks(data)
    descriptors={}
    fdats={}
    for c in chunks:
        if c['tag']=='FHDS':
            require(c['size']%36==0,'FHDS 36-byte stride')
            for i in range(c['size']//36):
                descriptors[c['payload']+36*i]=(c,i)
        if c['tag']=='FDAT':
            require(c['name'] not in fdats,'ambiguous original FDAT')
            fdats[c['name']]=c
    require(header in descriptors,'original FHDS descriptor not found')
    chunk,index=descriptors[header]
    width,height=u16(data,header),u16(data,header+2)
    x,y=i16(data,header+4),i16(data,header+6)
    expanded=u32(data,header+12)
    offset=u32(data,header+20)
    compression=u32(data,header+24)
    length=u32(data,header+28)
    mode,group=u16(data,header+32),u16(data,header+34)
    model=int(chunk['name'][-1])
    name=f'FrDt{group-1:02d}{model:02d}'
    require(compression==1 and mode<len(DEPTHS) and name in fdats,
            'unsupported original compressed sprite descriptor')
    fd=fdats[name]
    require(offset+length<=fd['size'],'source FDAT interval not covered')
    start=fd['payload']+offset
    require(
      record['originalDescriptorIndex']==index and
      record['originalDescriptorX']==x and record['originalDescriptorY']==y and
      record['originalMode']==mode and record['originalGroup']==group and
      record['originalModel']==model and
      record['sourceCompressedOffset']==start and
      record['sourceCompressedLength']==length and
      record['width']==width and record['height']==height,
      'original source sprite geometry/byte interval does not match manifest')
    return decode_independent(data[start:start+length],expanded,width,height,mode),width,height

def check(root,archive):
    with ZipFile(archive) as z:
        require(z.testzip() is None,'export ZIP CRC')
        expected={'comparison.png','original/fighter-indices.bin',
          'original/fighter-mask.bin','reference/iff-cmap-rgb8.bin',
          'manifest.json','README.txt'}
        require(len(z.namelist())==6 and set(z.namelist())==expected,
                'comparison ZIP file count/names')
        m=json.loads(z.read('manifest.json'))
        require(m['format']=='mk3_p72_source_iff_cmap_to_ftr_comparison_only_v1',
                'P72 comparison-only format')
        require(m['paletteChoiceWasExplicit'] is True and
                m['nativeFighterPaletteOwnershipVerified'] is False and
                m['nativeRuntimeAnimationOrStageMembershipClaimed'] is False,
                'false original palette/runtime claim')
        require(m['originalIffPalette']['originalVerifiedOwner']=='EMBEDDED_IN_THIS_IFF_FORM_ONLY' and
                m['originalIffPalette']['originalFighterOwnership']=='UNKNOWN',
                'original palette source and native unknown flags')
        spr=m['originalFighter'];pal=m['originalIffPalette'];d=m['display']
        original_ftr=source_file(root,spr['sourcePath'])
        original_data=source_file(root,pal['sourcePath'])
        require(sha(original_ftr)==spr['sourceWholeFileSha256'],
                'original FTR whole-file SHA')
        require(sha(original_data)==pal['sourceWholeFileSha256'],
                'original DATA.MK3 whole-file SHA')
        rgba_palette=read_original_cmap(original_data,pal['originalFormOffset'],pal['originalFormLength'])
        require(z.read('reference/iff-cmap-rgb8.bin')==rgba_palette and
                sha(rgba_palette)==pal['paletteRgbSha256'] and
                pal['entries']==256 and pal['paletteFormat']=='IFF_CMAP_RGB8',
                'original source IFF CMAP parity')
        (indices,mask),width,height=read_original_fighter_frame(original_ftr,spr)
        require(z.read('original/fighter-indices.bin')==indices and
                z.read('original/fighter-mask.bin')==mask and
                sha(indices)==spr['indicesSha256'] and
                sha(mask)==spr['opacityMaskSha256'],
                'original compressed sprite decode / original indexed planes parity')
        expected_rgba=bytearray(width*height*4)
        for i,(index,op) in enumerate(zip(indices,mask)):
            if not op:continue
            expected_rgba[4*i:4*i+3]=rgba_palette[3*index:3*index+3]
            expected_rgba[4*i+3]=255
        with Image.open(io.BytesIO(z.read('comparison.png'))) as im:
            require(im.size==(width,height),'comparison PNG dimensions')
            actual_rgba=im.convert('RGBA').tobytes()
            require(actual_rgba==bytes(expected_rgba),
                'comparison PNG original source palette/transparent mask parity')
        require(sha(expected_rgba)==d['rgbaSha256'] and
                d['pixelIndicesAndMaskNotChanged'] is True and
                d['transparentPixelsAreZeroRgba'] is True,
                'source RGBA evidence/hash mismatch')
    return {'pass':'P72_ORIGINAL','status':'PASS','originalFtr':spr['sourcePath'],
      'originalIffSource':pal['sourcePath'],'originalIffFormOffset':pal['originalFormOffset'],
      'sourceIndexedPixels':len(indices),'sourceOpaquePixels':sum(mask),
      'sourceCmapEntries':256,'allSourceIndicesMaskPaletteAndPngBytesMatched':True,
      'nativeFighterPaletteOwnershipClaimed':False}

if __name__=='__main__':
    require(__debug__,'Python assertions must be enabled')
    require(len(sys.argv) in (3,4),'usage <original MK3 directory> <private P72 ZIP> [private report JSON]')
    result=check(Path(sys.argv[1]).resolve(strict=True),Path(sys.argv[2]).resolve(strict=True))
    if len(sys.argv)==4:
        p=Path(sys.argv[3]).resolve()
        p.parent.mkdir(parents=True,exist_ok=True)
        p.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,indent=2))
