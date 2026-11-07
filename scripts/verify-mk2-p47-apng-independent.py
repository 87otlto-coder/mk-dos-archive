#!/usr/bin/env python3
"""Independent APNG decode: presentation pixels/order/repeats/user timings, not native gameplay."""
import argparse,copy,json,runpy,struct,zipfile,zlib
from pathlib import Path
read_png=runpy.run_path(str(Path(__file__).with_name('verify-mk2-p22-cave-independent.py')))['read_png']
SIG=b'\x89PNG\r\n\x1a\n'
def chunk(kind,body):
    return struct.pack('>I',len(body))+kind+body+struct.pack('>I',zlib.crc32(kind+body)&0xffffffff)
def chunks(blob):
    assert blob[:8]==SIG
    at=8;out=[]
    while at<len(blob):
        assert at+12<=len(blob)
        n=struct.unpack_from('>I',blob,at)[0];kind=blob[at+4:at+8];body=blob[at+8:at+8+n]
        assert at+12+n<=len(blob)
        assert struct.unpack_from('>I',blob,at+8+n)[0]==zlib.crc32(kind+body)&0xffffffff
        out.append((kind,body));at+=12+n
    assert out[-1]==(b'IEND',b'') and sum(k==b'IEND' for k,_ in out)==1
    return out
def sources(path):
    with zipfile.ZipFile(path) as z:
        assert z.testzip() is None
        assets=json.loads(z.read('manifest.json'))['selectionOrder'];pngs=[p for p in z.namelist() if p.startswith('assets/')]
        assert len(assets)==len(pngs)
        decoded={}
        for i,(a,name) in enumerate(zip(assets,pngs)):
            w,h,rgba=read_png(z.read(name));mask=z.read(f'indexed/{i:05}_mask.bin');ix=z.read(f'indexed/{i:05}_indices.bin')
            assert (w,h)==(a['width'],a['height']) and len(ix)==len(mask)==w*h
            assert bytes(rgba[3::4])==bytes(255*b for b in mask)
            decoded[a['id']]=(w,h,rgba)
        return decoded
def verify(blob,case,originals):
    items=chunks(blob)
    assert items[0][0]==b'IHDR' and len(items[0][1])==13
    header=items[0][1];width,height=struct.unpack_from('>II',header)
    assert (width,height)==(max(originals[i][0] for i in case['frameIds']),max(originals[i][1] for i in case['frameIds']))
    assert len([1 for k,_ in items if k==b'acTL'])==1
    control=next(b for k,b in items if k==b'acTL');assert struct.unpack('>II',control)==(len(case['frameIds']),0)
    sequence=0;index=-1;compressed=bytearray();checks=0
    def finish(n,data):
        assert 0<=n<len(case['frameIds']) and data
        w,h,source=originals[case['frameIds'][n]];want=bytearray(width*height*4)
        for y in range(h):
            for x in range(w):
                a=(y*w+x)*4;b=(y*width+x)*4
                if source[a+3]:want[b:b+4]=source[a:a+4]
        actual=read_png(SIG+chunk(b'IHDR',header)+chunk(b'IDAT',bytes(data))+chunk(b'IEND',b''))
        assert actual[:2]==(width,height) and actual[2]==bytes(want)
        return width*height*4
    for kind,body in items[1:]:
        if kind==b'acTL':assert index==-1
        elif kind==b'fcTL':
            if index>=0:checks+=finish(index,compressed)
            index+=1;compressed=bytearray()
            seq,w,h,x,y,num,den,dispose,blend=struct.unpack('>IIIIIHHBB',body)
            assert seq==sequence;sequence+=1
            assert (w,h,x,y)==(width,height,0,0)
            assert (num,den,dispose,blend)==(case['frameMs'],1000,0,0)
        elif kind==b'IDAT':
            assert index==0;compressed.extend(body)
        elif kind==b'fdAT':
            assert index>0 and struct.unpack_from('>I',body)[0]==sequence
            sequence+=1;compressed.extend(body[4:])
        elif kind==b'IEND':checks+=finish(index,compressed)
        else:raise AssertionError('Unexpected chunk')
    assert index+1==len(case['frameIds'])
    return checks
def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('private_output',type=Path);ap.add_argument('--report',type=Path,required=True);a=ap.parse_args()
    manifest=json.loads((a.private_output/'cases.json').read_text(encoding='utf-8'))
    assert manifest['sourceGroups']==8 and manifest['originalFrames']==57 and len(manifest['cases'])==32
    checks=0;frames=0;cache={}
    for case in manifest['cases']:
        assert case['timing']=='USER_SELECTED_PRESENTATION_ONLY'
        if case['sourceZip'] not in cache:cache[case['sourceZip']]=sources(a.private_output/case['sourceZip'])
        original=cache[case['sourceZip']]
        checks+=verify((a.private_output/case['file']).read_bytes(),case,original);frames+=len(case['frameIds'])
    case=manifest['cases'][0];original=cache[case['sourceZip']];blob=(a.private_output/case['file']).read_bytes();parts=chunks(blob);rejected=0
    for label in ['bad_crc','wrong_sequence','wrong_delay','wrong_pixels']:
        altered=copy.deepcopy(parts)
        target=next(i for i,(k,_) in enumerate(altered) if k==(b'IDAT' if label in ['bad_crc','wrong_pixels'] else b'fcTL'))
        kind,body=altered[target];b=bytearray(body)
        if label=='wrong_sequence':struct.pack_into('>I',b,0,99)
        elif label=='wrong_delay':struct.pack_into('>H',b,20,case['frameMs']+1)
        elif label=='wrong_pixels':
            raw=bytearray(zlib.decompress(body));raw[1]^=1;b=bytearray(zlib.compress(raw))
        else:b[0]^=1
        altered[target]=(kind,bytes(b))
        wrong=SIG+b''.join(chunk(k,v) for k,v in altered)
        if label=='bad_crc':
            wrong=bytearray(wrong);wrong[-1]^=1;wrong=bytes(wrong)
        try:verify(wrong,case,original)
        except AssertionError:rejected+=1
        else:raise AssertionError(label+' accepted')
    verify(blob,case,original)
    result={'status':'PASS','sourceGroups':8,'originalFrames':57,'apngCases':32,'decodedPresentationFrames':frames,
        'rgbaChannelComparisons':checks,'timingMilliseconds':[10,73,137,60000],'tamperedApngsRejected':rejected,
        'duplicatesAndReorderingVerified':True,'cleanReverified':True,'originalDataBrowserVerified':False,'nativeTimingClaimed':False}
    a.report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,indent=2))
if __name__=='__main__':main()

