#!/usr/bin/env python3
"""Independently read back one P69 Chrome-downloaded FTR indexed sprite ZIP.

Uses the independently maintained Python MK3 MFIL and packed-bitstream oracle.
No original artwork is written into the checkout.
"""
import json
from pathlib import Path
import runpy
import sys
from zipfile import ZipFile

oracle = runpy.run_path(str(Path(__file__).with_name('verify-mk3-p69-ftr-independent.py')))
sha=oracle['sha']; require=oracle['require']; original=oracle['source_file']
mfil=oracle['mfil_chunks']; decode=oracle['decode_independent']
u16=oracle['little_u16'];i16=oracle['little_i16'];u32=oracle['little_u32']
DEPTHS=oracle['DEPTHS']

def check(originals, archive):
    with ZipFile(archive) as z:
        require(z.testzip() is None,'download CRC')
        m=json.loads(z.read('manifest.json'))
        require(m['format']=='mk3_p69_original_ftr_indexed_sprites_v1','download manifest format')
        source=original(originals,m['originalFtrPath'])
        require(sha(source)==m['originalFtrWholeFileSha256'],'original FTR source SHA')
        chunks=mfil(source);by_name={c['name']:c for c in chunks if c['tag']=='FDAT'}
        headers={}
        for c in chunks:
            if c['tag']!='FHDS':continue
            require(c['size']%36==0,'FHDS size')
            for ordinal in range(c['size']//36):
                headers[c['payload']+ordinal*36]=(c,ordinal)
        frames=m['originalDescriptors']
        require(len(frames)==m['spriteCount'] and len(frames)>0,'download frames')
        seen=set();order=-1;pixels=0;opaque=0;names={'manifest.json','README.txt'}
        for f in frames:
            h=f['originalFhdsDescriptorHeaderOffset']
            require(h in headers and h>order,'original FHDS source order')
            order=h
            header,index=headers[h]
            require(index==f['originalDescriptorIndex'],'source descriptor ordinal')
            width,height=u16(source,h),u16(source,h+2)
            x,y=i16(source,h+4),i16(source,h+6)
            expanded=u32(source,h+12)
            src,compression,length=u32(source,h+20),u32(source,h+24),u32(source,h+28)
            mode,group=u16(source,h+32),u16(source,h+34)
            require(compression==1 and mode<len(DEPTHS),'source compressor header')
            model=int(header['name'][-1])
            fdname=f'FrDt{group-1:02d}{model:02d}'
            require(fdname in by_name,'original source FDAT join')
            d=by_name[fdname]
            start=d['payload']+src
            require(src+length<=d['size'],'source interval bounds')
            require(f['originalSourceOffset']==start and
                    f['originalCompressedByteLength']==length and
                    f['originalDescriptorX']==x and f['originalDescriptorY']==y and
                    f['width']==width and f['height']==height and
                    f['originalMode']==mode and f['originalBitDepth']==DEPTHS[mode] and
                    f['originalExpandedSize']==expanded and
                    f['originalGroup']==group and f['originalModel']==model,
                    'original descriptor provenance')
            ix,mask=decode(source[start:start+length],expanded,width,height,mode)
            ip,mp=f['indicesPath'],f['maskPath']
            require(ip not in names and mp not in names,'duplicate ZIP planes')
            names.update([ip,mp])
            require(z.read(ip)==ix and z.read(mp)==mask,'source pixel/mask parity')
            require(f['indicesSha256']==sha(ix) and f['maskSha256']==sha(mask) and
                    f['indexedPixelCount']==len(ix) and f['opaquePixelCount']==sum(mask),
                    'source index/mask hashes/geometry')
            require(f['nativePaletteVerified'] is False and
                    f['runtimeAnimationOrderVerified'] is False,'unqualified runtime claims')
            require(h not in seen,'duplicate FHDS record')
            seen.add(h)
            pixels+=len(ix);opaque+=sum(mask)
        require(set(z.namelist())==names,'unknown downloaded ZIP entries')
        require(m['nativePaletteOwnershipVerified'] is False and
                m['nativeAnimationSequenceOrderVerified'] is False and
                m['nativeAnimationTimingVerified'] is False,'invalid original runtime claims')
    print(json.dumps({'pass':'P69_BROWSER','status':'PASS','originalFtr':m['originalFtrPath'],
      'independentlyCheckedFrames':len(frames),'nativeIndexPixels':pixels,
      'originalOpaqueMaskPixels':opaque,'originalSourceByteIntervalsMatched':True,
      'browserDownloadVerified':True,'originalRuntimePaletteOrAnimationClaimed':False},indent=2))

if __name__=='__main__':
    require(__debug__,'python asserts enabled')
    require(len(sys.argv)==3,'usage <original mk3 dir> <downloaded FTR zip>')
    check(Path(sys.argv[1]),Path(sys.argv[2]))
