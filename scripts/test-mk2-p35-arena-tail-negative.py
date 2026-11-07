#!/usr/bin/env python3
"""Reject re-CRC'd false export payloads/claims without touching source fixtures."""
import argparse, json, struct, subprocess, sys, zipfile, zlib
from pathlib import Path

def changed_png(data):
    pos=8;parts=[];compressed=bytearray()
    while pos<len(data):
        size=struct.unpack_from('>I',data,pos)[0];kind=data[pos+4:pos+8];body=data[pos+8:pos+8+size]
        if kind==b'IDAT':compressed.extend(body)
        else:parts.append((kind,body))
        pos+=12+size
    pixels=bytearray(zlib.decompress(compressed));pixels[1]^=1
    def chunk(kind,body):return struct.pack('>I',len(body))+kind+body+struct.pack('>I',zlib.crc32(kind+body)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+b''.join(chunk(k,v) for k,v in parts if k!=b'IEND')+chunk(b'IDAT',zlib.compress(pixels))+chunk(b'IEND',b'')

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('root',type=Path);ap.add_argument('archive',type=Path);ap.add_argument('output',type=Path);ap.add_argument('--report',type=Path)
    args=ap.parse_args()
    assert not args.output.resolve().is_relative_to(args.root.resolve()),'Output must be outside original fixture'
    args.output.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(args.archive) as z:original={n:z.read(n) for n in z.namelist()}
    verifier=Path(__file__).with_name('verify-mk2-p35-arena-tail-independent.py')
    for label in ['indices','valid_png_wrong_pixels','invented_palette_claim','invented_animation_claim','invented_alpha_claim','invented_setup_link']:
        files=original.copy()
        if label=='indices':
            key='indexed/00000_indices.bin';b=bytearray(files[key]);b[0]^=1;files[key]=bytes(b)
        elif label=='valid_png_wrong_pixels':
            key=next(k for k in files if k.startswith('assets/'));files[key]=changed_png(files[key])
        elif label=='invented_palette_claim':
            manifest=json.loads(files['manifest.json']);manifest['selectionOrder'][0]['metadata']['runtimePaletteKnown']=True
            files['manifest.json']=json.dumps(manifest).encode()
        elif label=='invented_animation_claim':
            manifest=json.loads(files['manifest.json']);manifest['selectionOrder'][0]['metadata']['sourceTableOrderIsAnimation']=True
            files['manifest.json']=json.dumps(manifest).encode()
        elif label=='invented_alpha_claim':
            manifest=json.loads(files['manifest.json']);manifest['selectionOrder'][0]['metadata']['maskIsRuntimeAlpha']=True
            files['manifest.json']=json.dumps(manifest).encode()
        else:
            manifest=json.loads(files['manifest.json']);manifest['selectionOrder'][0]['metadata']['sourceSetupUses']=[{'assetId':'mk2-arena-setup:unqualified'}]
            files['manifest.json']=json.dumps(manifest).encode()
        output=args.output/(label+'.zip')
        with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_STORED) as z:
            for key,value in files.items():z.writestr(key,value)
        result=subprocess.run([sys.executable,str(verifier),str(args.root),'--export',str(output)],capture_output=True,text=True)
        assert result.returncode!=0,label+' false export was accepted'
        assert 'AssertionError' in result.stderr,label+' failed for unrelated reason: '+result.stderr
    clean=subprocess.run([sys.executable,str(verifier),str(args.root),'--export',str(args.archive)],capture_output=True,text=True)
    assert clean.returncode==0,clean.stderr
    result={'pass':'P35','status':'PASS','falsifiedExportsRejected':6,'zipAndPngCrcRecomputed':True,'cleanExportReverified':True}
    if args.report:args.report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,indent=2))

if __name__=='__main__':main()
