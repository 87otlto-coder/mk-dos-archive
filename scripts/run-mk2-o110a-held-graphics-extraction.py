#!/usr/bin/env python3
"""Evidence-preserving extraction of MK2's 14 still-held graphics resources.

This creates *lossless* source partitions and individually decoded indexed sprites
where descriptor witnesses exist. Unknown material remains unknown, and alternative
VFRAME/PLAYSTA interpretations are exported in parallel rather than guessed away.
"""
import hashlib, json, struct, sys, zipfile, io, collections
from pathlib import Path

src=Path(sys.argv[1]); exe=Path(sys.argv[2]); out=Path(sys.argv[3]); o69=Path(sys.argv[4]); prior=Path(sys.argv[5])
out.mkdir(parents=True,exist_ok=True)
e=exe.read_bytes();sha=lambda x:hashlib.sha256(x).hexdigest();assert sha(e)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
u16=lambda x,p:struct.unpack_from('<H',x,p)[0];u32=lambda x,p:struct.unpack_from('<I',x,p)[0]
pool=e[0xa0ef1:0xa13a7].split(b'\0'); base=0xa0c54
hold=['PORTAL','ARMORY','FOREST','TOMB','TOWER','ARENA','VFRAME','BATTLE','CAVE','FONTS','PLAYSTA','PROBE','ACCLAIM','MONKS']
tables={'PORTAL':(91484,13),'ARMORY':(92508,18),'FOREST':(93580,49),'TOMB':(95880,16),'TOWER':(96640,4),'ARENA':(99856,15),'VFRAME':(116764,10),'BATTLE':(103296,40),'CAVE':(98912,49)}
rawnames=['TOMB','BATTLE','TOWER','FOREST','ARMORY','PORTAL','ARENA']
slots={n:i for i,n in [(0,'TOMB'),(1,'BATTLE'),(2,'TOWER'),(3,'FOREST'),(4,'ARMORY'),(6,'PORTAL'),(7,'ARENA')]}
old=json.loads(o69.read_text()); partial={v['resourceName']:v for v in old['partialOrAmbiguousResources']}

def decode(b,start,w,h):
    if not 1<=w<=640 or not 1<=h<=480 or w*h>307200: raise ValueError('invalid descriptor geometry')
    pos=start; pixels=bytearray(w*h); mask=bytearray(w*h); counts=[0,0,0]
    for y in range(h):
        x=0
        while x<w:
            if pos+4>len(b):raise ValueError('command beyond EOF')
            cmd=u32(b,pos);pos+=4
            if cmd&1:
                n=cmd>>1;counts[0]+=1
            elif cmd&2:
                n=cmd>>10;v=(cmd>>2)&255;counts[1]+=1
                if n==0 or n>w-x:raise ValueError('invalid rle')
                off=y*w+x;pixels[off:off+n]=bytes((v,))*n;mask[off:off+n]=bytes((1,))*n
            else:
                n=cmd>>2;counts[2]+=1
                if n==0 or n>64 or n>w-x or pos+n>len(b):raise ValueError('invalid literal')
                off=y*w+x; pixels[off:off+n]=b[pos:pos+n]; mask[off:off+n]=bytes((1,))*n;pos+=(n+3)&~3
            if not 1<=n<=w-x:raise ValueError('invalid span')
            x+=n
    return pos,bytes(pixels),bytes(mask),counts

def addrange(mask,start,end,bit):
    if not 0<=start<=end<=len(mask):raise ValueError('bad interval')
    for q in range(start,end):mask[q]|=bit

def unknown_ranges(bits):
    a=[];start=None
    for i,val in enumerate(bits):
        if val==0 and start is None:start=i
        if val!=0 and start is not None:a.append((start,i));start=None
    if start is not None:a.append((start,len(bits)))
    return a

def png_gray(b,width,height,scale=1):
    from PIL import Image
    pic=Image.frombytes('L',(width,height),b)
    if scale != 1:pic=pic.resize((width, height*scale),Image.Resampling.NEAREST)
    # Diagnostic contrast only, never a claim of an authentic palette.
    pic=pic.point(lambda v:min(255,int(v)*3))
    buf=io.BytesIO();pic.save(buf,format='PNG');return buf.getvalue()

def png_sprite(pixels,mask,width,height):
    from PIL import Image
    indexed=Image.frombytes('L',(width,height),pixels).point(lambda v:min(255,v*3)).convert('RGBA')
    indexed.putalpha(Image.frombytes('L',(width,height),bytes(255*x for x in mask)))
    dst=io.BytesIO();indexed.save(dst,format='PNG');return dst.getvalue()

zip_path=out/'MK2_HELD14_LOSSLESS_COMPONENT_EXPORT_O110A.zip'
manifest={'format':'mk2_held14_lossless_components_o110a_v1','qualification':'mixed fidelity; original bytes preserved; unresolved semantics not promoted','exeSha256':sha(e),'priorExactFull':110,'totalRootResources':124,'heldSourceCount':14,'resources':[],'decodePolicy':{'8byte':'verified packed reference source bytes','12byte':'O69 descriptor evidence verified from executable','raw896':'file-backed packed pointer, 896-byte source row stride; no asserted palette or final geometry','ambiguities':'parallel candidates preserved','fullIndexedPromotions':0}}
checks=0
with zipfile.ZipFile(zip_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for name in hold:
        b=(src/(name+'.gra').lower()).read_bytes();rid=(pool.index((name+'.GRA').encode()) if (name+'.GRA').encode() in pool else None);bits=bytearray(len(b));spec=[];raw=None
        root=f'{name.lower()}/';z.writestr(root+'original.gra',b)
        if name in tables:
            tab,num=tables[name]
            for i in range(num):
                physical=base+tab+i*8; w=u16(e,physical);h=u16(e,physical+2);ref=u32(e,physical+4)
                if ref>>24!=rid:raise ValueError(f'bad id {name} {i}')
                off=ref&0xffffff;end,px,m,c=decode(b,off,w,h)
                if name=='BATTLE' and i>=20:
                    # Export duplicate *witnesses* without wasting twice the image payload.
                    assert px==decode(b,ref&0xffffff,w,h)[1]
                ident=f'indexed/8byte_{i:03}'
                z.writestr(root+ident+'.idx8',px);z.writestr(root+ident+'.mask8',m)
                z.writestr(root+ident+'.preview.png',png_sprite(px,m,w,h))
                addrange(bits,off,end,1)
                spec.append({'kind':'8byte','ordinal':i,'descriptorPhysical':physical,'descriptorObject2Offset':tab+i*8,'sourceStart':off,'sourceEnd':end,'width':w,'height':h,'pixelSha256':sha(px),'maskSha256':sha(m),'encodedSha256':sha(b[off:end]),'commands':c,'pixelBytes':len(px),'opaquePixels':sum(m),'idxMember':root+ident+'.idx8','maskMember':root+ident+'.mask8','previewMember':root+ident+'.preview.png'})
                checks+=5
        if name+'.GRA' in partial:
            seen=set()
            for i,s in enumerate(partial[name+'.GRA']['streams']):
                physical=s['descriptorPhysical'];off=s['graOffset'];w=s['width'];h=s['height']
                if (physical,off) in seen:continue
                seen.add((physical,off))
                assert u16(e,physical)==w and u16(e,physical+2)==h
                assert u32(e,physical+8)==(rid<<24|off)
                end,px,m,c=decode(b,off,w,h)
                assert end==s['encodedEndExclusive'],(name,i,end,s['encodedEndExclusive'])
                ident=f'indexed/12byte_{i:03}'
                z.writestr(root+ident+'.idx8',px);z.writestr(root+ident+'.mask8',m)
                z.writestr(root+ident+'.preview.png',png_sprite(px,m,w,h))
                addrange(bits,off,end,2)
                spec.append({'kind':'12byte','ordinal':i,'descriptorPhysical':physical,'sourceStart':off,'sourceEnd':end,'width':w,'height':h,'pixelSha256':sha(px),'maskSha256':sha(m),'encodedSha256':sha(b[off:end]),'commands':c,'pixelBytes':len(px),'opaquePixels':sum(m),'idxMember':root+ident+'.idx8','maskMember':root+ident+'.mask8','previewMember':root+ident+'.preview.png'})
                checks+=5
        if name in rawnames:
            slot=slots[name];packed=u32(e,0xcfbac+slot*4);assert packed>>24==rid
            start=packed&0xffffff;data=b[start:];assert len(data)>0 and len(data)%896==0
            addrange(bits,start,len(b),4)
            rows=len(data)//896
            z.writestr(root+'packed_raw896/source_rows.bin',data)
            z.writestr(root+'packed_raw896/diagnostic_grayscale.png',png_gray(data,896,rows,4))
            raw={'tablePhysical':0xcfbac+slot*4,'packedRef':packed,'sourceStart':start,'sourceEnd':len(b),'rowStrideBytes':896,'rowCount':rows,'rawSha256':sha(data),'first320ColumnSha256':sha(b''.join(data[j:j+320] for j in range(0,len(data),896))),'remaining576ColumnSha256':sha(b''.join(data[j+320:j+896] for j in range(0,len(data),896))),'rawMember':root+'packed_raw896/source_rows.bin','grayscalePreview':root+'packed_raw896/diagnostic_grayscale.png','caveat':'raw stride qualified, preview is diagnostic only; row origin/transforms/palette remain runtime-dependent'}
            checks+=5+rows
        unknown=unknown_ranges(bits)
        for j,(a,stop) in enumerate(unknown):z.writestr(root+f'unresolved/unqualified_{j:03}_{a:08x}_{stop:08x}.bin',b[a:stop])
        entry={'resource':name+'.GRA','resourceId':rid,'sourceBytes':len(b),'sourceSha256':sha(b),'eightByteDescriptors':len([q for q in spec if q['kind']=='8byte']),'twelveByteDescriptors':len([q for q in spec if q['kind']=='12byte']),'descriptors':spec,'raw896':raw,'unqualified': [{'start':a,'end':stop,'sha256':sha(b[a:stop])} for a,stop in unknown],'byteCoverage':{'indexed':sum(bool(v&3) for v in bits),'raw896':sum(bool(v&4) for v in bits),'qualifiedUnion':sum(bool(v) for v in bits),'unqualified':sum(not v for v in bits)},'sourceReconstructable':True,'fullyKnownAsIndexedGraphics':False}
        # Full-known-as-indexed remains false for all 14 while contested ownership/mixed formats persist.
        assert entry['byteCoverage']['qualifiedUnion']+entry['byteCoverage']['unqualified']==len(b)
        manifest['resources'].append(entry)
    z.writestr('MANIFEST_O110A.json',json.dumps(manifest,indent=2)+'\n')
    z.writestr('README.txt','MK2 held 14 resource extraction O110A. Every original resource preserved verbatim.\n'
               'idx8: width*height single-byte palette indices; mask8: 1 opaque, 0 transparent.\n'
               'preview.png: diagnostic grayscale rendering with alpha, NOT qualified game palette.\n'
               '8byte and 12byte variants are independent original-executable-backed descriptor interpretations.\n'
               'Overlaps are intentional. Do not merge/choose variants without executable consumer proof.\n'
               'raw896 rows: qualified source stride; image preview uses multiplied grayscale, NOT game colors.\n'
               'unresolved/*.bin: byte regions without a current qualified decoder.\n'
               'Original *.gra plus manifest hashes make every file exactly recoverable.\n')
with zipfile.ZipFile(zip_path) as z:assert z.testzip() is None
(out/'mk2_o110a_held14_component_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'resources':len(manifest['resources']),'descriptorImages':sum(len(x['descriptors']) for x in manifest['resources']),'rawRows':sum(x['raw896']['rowCount'] for x in manifest['resources'] if x['raw896']),'unknownIntervals':sum(len(x['unqualified']) for x in manifest['resources']),'unknownBytes':sum(x['byteCoverage']['unqualified'] for x in manifest['resources']),'checks':checks,'archiveBytes':zip_path.stat().st_size}))
