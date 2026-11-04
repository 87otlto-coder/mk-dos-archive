#!/usr/bin/env python3
"""Independent O110A audit: reads game files and ZIP, replays image command grammar.

No producer imports, no trust in manifest counts/digests, no inferred palette.
"""
import hashlib, json, struct, zipfile, sys, io
from pathlib import Path
from PIL import Image
exe=Path(sys.argv[1]).read_bytes();root=Path(sys.argv[2]);archive=Path(sys.argv[3]); H=lambda b:hashlib.sha256(b).hexdigest()
assert H(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
word=lambda b,n: int.from_bytes(b[n:n+2],'little');dword=lambda b,n:int.from_bytes(b[n:n+4],'little')
pool=exe[0xa0ef1:0xa13a7].split(b'\x00')
expected=['PORTAL','ARMORY','FOREST','TOMB','TOWER','ARENA','VFRAME','BATTLE','CAVE','FONTS','PLAYSTA','PROBE','ACCLAIM','MONKS']
expected8={'PORTAL':(91484,13),'ARMORY':(92508,18),'FOREST':(93580,49),'TOMB':(95880,16),'TOWER':(96640,4),'ARENA':(99856,15),'VFRAME':(116764,10),'BATTLE':(103296,40),'CAVE':(98912,49)}
expectedslots={'TOMB':0,'BATTLE':1,'TOWER':2,'FOREST':3,'ARMORY':4,'PORTAL':6,'ARENA':7}

def decode_stream(buf,start,width,height):
    if width<=0 or height<=0 or width>640 or height>480:raise AssertionError('bad geometry')
    pixels=bytearray(width*height);opacity=bytearray(width*height);q=start
    for line in range(height):
        advance=0
        while advance<width:
            if q+4>len(buf):raise AssertionError('EOF in instruction')
            op=int.from_bytes(buf[q:q+4],'little');q+=4
            if op&1:
                step=op//2
            elif op&2:
                step=op>>10; col=(op>>2)&255
                if step>width-advance:raise AssertionError('run overrun')
                offset=line*width+advance
                for i in range(step):pixels[offset+i]=col;opacity[offset+i]=1
            else:
                step=op>>2
                if step>64 or q+step>len(buf):raise AssertionError('literal overrun')
                offset=line*width+advance
                for i in range(step):pixels[offset+i]=buf[q+i];opacity[offset+i]=1
                q+=(step+3)&~3
            if step<1 or advance+step>width:raise AssertionError('row overrun')
            advance+=step
    return q,bytes(pixels),bytes(opacity)

checks=0
with zipfile.ZipFile(archive) as arc:
    assert arc.testzip() is None
    manifest=json.loads(arc.read('MANIFEST_O110A.json'))
    assert manifest['priorExactFull']==110 and manifest['totalRootResources']==124 and manifest['heldSourceCount']==14
    assert len(manifest['resources'])==14 and [r['resource'] for r in manifest['resources']]==[n+'.GRA' for n in expected]
    all_indices=0;all_rows=0;unknown_total=0;fully_covered=0
    for r in manifest['resources']:
        n=r['resource'].removesuffix('.GRA');b=(root/(n+'.gra').lower()).read_bytes();rid=(pool.index(r['resource'].encode()) if r['resource'].encode() in pool else None)
        assert len(b)==r['sourceBytes'] and H(b)==r['sourceSha256']
        assert arc.read(n.lower()+'/original.gra')==b
        assert r['resourceId']==rid and r['sourceReconstructable'] is True and r['fullyKnownAsIndexedGraphics'] is False
        checks+=len(b)+3
        covered=bytearray(len(b));flags=bytearray(len(b)); d8=d12=0
        for d in r['descriptors']:
            width=d['width'];height=d['height'];pos=d['sourceStart']; p=d['descriptorPhysical']
            if d['kind']=='8byte':
                table,count=expected8[n];assert d['ordinal']<count and p==0xa0c54+table+8*d['ordinal']
                assert word(exe,p)==width and word(exe,p+2)==height
                assert dword(exe,p+4)==(rid<<24)|pos
                d8+=1; flag=1
            elif d['kind']=='12byte':
                assert word(exe,p)==width and word(exe,p+2)==height
                assert dword(exe,p+8)==(rid<<24)|pos
                d12+=1;flag=2
            else:raise AssertionError('unknown desc')
            ending, pixels, mask=decode_stream(b,pos,width,height)
            assert ending==d['sourceEnd'] and H(b[pos:ending])==d['encodedSha256']
            assert H(pixels)==d['pixelSha256'] and H(mask)==d['maskSha256']
            assert arc.read(d['idxMember'])==pixels and arc.read(d['maskMember'])==mask
            preview=Image.open(io.BytesIO(arc.read(d['previewMember']))).convert('RGBA')
            assert preview.size==(width,height)
            expected_pixels=((min(255,col*3),)*3+(255 if alpha else 0,) for col,alpha in zip(pixels,mask))
            assert all(actual==want for actual,want in zip(preview.getdata(),expected_pixels))
            assert len(pixels)==d['pixelBytes'] and sum(mask)==d['opaquePixels']
            for k in range(pos,ending):covered[k]=1;flags[k]|=flag
            checks+=len(pixels)*2+10
        assert d8==r['eightByteDescriptors'] and d12==r['twelveByteDescriptors']
        if n in expected8:assert d8==expected8[n][1]
        else:assert d8==0
        raw=r['raw896']
        if n in expectedslots:
            assert raw is not None
            packed=dword(exe,0xcfbac+4*expectedslots[n]);off=packed&0xffffff
            assert packed>>24==rid and raw['tablePhysical']==0xcfbac+4*expectedslots[n]
            assert raw['packedRef']==packed and raw['sourceStart']==off and raw['sourceEnd']==len(b)
            data=b[off:];assert len(data)%896==0 and raw['rowCount']==len(data)//896 and raw['rowStrideBytes']==896
            assert arc.read(raw['rawMember'])==data and H(data)==raw['rawSha256']
            first=b''.join(data[i:i+320] for i in range(0,len(data),896));remainder=b''.join(data[i+320:i+896] for i in range(0,len(data),896))
            assert H(first)==raw['first320ColumnSha256'] and H(remainder)==raw['remaining576ColumnSha256']
            preview=Image.open(io.BytesIO(arc.read(raw['grayscalePreview']))).convert('L')
            assert preview.size==(896,raw['rowCount']*4)
            # independently check each pixel value from the source rows
            for i,val in enumerate(data):
                y,x=divmod(i,896)
                assert preview.getpixel((x,y*4))==min(255,val*3)
            for k in range(off,len(b)):covered[k]=1;flags[k]|=4
            all_rows+=raw['rowCount'];checks+=len(data)+7
        else:assert raw is None
        missing=[];start=None
        for i,v in enumerate(covered):
            if not v and start is None:start=i
            if v and start is not None:missing.append((start,i));start=None
        if start is not None:missing.append((start,len(b)))
        assert [(x['start'],x['end']) for x in r['unqualified']]==missing
        for j,(a,e) in enumerate(missing):
            rec=r['unqualified'][j];blob=b[a:e]
            assert rec['sha256']==H(blob)
            path=f'{n.lower()}/unresolved/unqualified_{j:03}_{a:08x}_{e:08x}.bin'
            assert arc.read(path)==blob
        assert sum(not x for x in covered)==r['byteCoverage']['unqualified']
        assert sum(covered)==r['byteCoverage']['qualifiedUnion']
        assert sum(bool(x&3) for x in flags)==r['byteCoverage']['indexed']
        assert sum(bool(x&4) for x in flags)==r['byteCoverage']['raw896']
        if sum(covered)==len(b):fully_covered+=1
        unknown_total+=r['byteCoverage']['unqualified'];all_indices+=len(r['descriptors']);checks+=20
    assert all_indices==572 and all_rows==320 and fully_covered==9 and unknown_total==436100
    print(json.dumps({'independentAudit':'PASS','checks':checks,'failures':0,'resources':len(manifest['resources']),'decodedDescriptorInstances':all_indices,'packedRows':all_rows,'structuredByteCompleteResources':fully_covered,'remainingUnqualifiedBytes':unknown_total}))
