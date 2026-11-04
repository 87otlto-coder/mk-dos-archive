#!/usr/bin/env python3
"""O122: authenticated MK2 GRA indexed-sprite streams -> bounded setup mosaics.

The 49 descriptors come from O121's exact LE-typed control graph, NOT a blind scan.
The renderer command grammar is anchored in original MK2.EXE (O68). The 80-color
records have O119 runtime perturbation support; the 79-color IMAGES records do
NOT. Placement is setup-local, NOT a proven screen-space position/draw order.
Original game bytes remain read-only. Only brand-new outputs may be written.
"""
from __future__ import annotations
import argparse, hashlib, io, json, struct, sys, zipfile
from pathlib import Path
from collections import Counter
from PIL import Image
from trace_o121_control_bindings import build, load_game_files, EXPECTED_RESOURCE
from native_stage_palettes import decode_record

RESOURCE_NAMES={x[1] for x in EXPECTED_RESOURCE.values()}
CANONICAL_GRA_SHA256={
    'TOMB.GRA':'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
    'PORTAL.GRA':'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82',
    'IMAGES.GRA':'2b26796a64c2aebfee75832696aeae9bbcf9df56d82cb9a39df58a557d3ad8cf',
}
SIGNATURES=((0x3b600+0x2e90c,'8b06d1e8722ad1e8723e8d580380e3fc8d741e0483f840'),
            (0x3b600+0x2ee6c,'8bd081e2ff0000008b14958410000003d3c1e808'))

def require(cond:bool,message:str)->None:
    if not cond:raise ValueError('O122: '+message)

def sha(data:bytes)->str:return hashlib.sha256(data).hexdigest()

def decode_stream(source:bytes,offset:int,width:int,height:int)->dict:
    require(width>0 and height>0 and width*height<=250000,'invalid dimensions')
    require(offset>=0 and offset<len(source),'stream start outside resource')
    index=bytearray(width*height);mask=bytearray(width*height);pos=offset
    counts=Counter();positions=0
    for y in range(height):
        x=0
        while x<width:
            require(pos+4<=len(source),'stream command outside resource')
            cmd=struct.unpack_from('<I',source,pos)[0];pos+=4
            if cmd&1:
                n=cmd>>1;counts['transparentSkip']+=1
            elif cmd&2:
                n=cmd>>10;value=(cmd>>2)&255;counts['indexedRLE']+=1
                require(0<n<=width-x,'RLE crosses a source row')
                start=y*width+x
                index[start:start+n]=bytes([value])*n
                mask[start:start+n]=b'\x01'*n
            else:
                n=cmd>>2;counts['indexedLiteral']+=1
                require(0<n<=0x40 and n<=width-x and pos+n<=len(source),'literal crosses row/file')
                start=y*width+x
                index[start:start+n]=source[pos:pos+n]
                mask[start:start+n]=b'\x01'*n
                pos+=(n+3)&~3
            require(0<n<=width-x,'transparent run crosses row / zero length')
            x+=n;positions+=1
            require(positions<=250000,'run loop limit')
    require(len(index)==width*height and len(mask)==width*height,'pixel shape incorrect')
    return {'start':offset,'end':pos,'width':width,'height':height,'indices':bytes(index),
            'mask':bytes(mask),'opaque':mask.count(1),'transparent':mask.count(0),
            'commands':{k:counts[k] for k in ('transparentSkip','indexedRLE','indexedLiteral')},
            'opaqueIndices':sorted({n for n,m in zip(index,mask) if m})}

def evidence(exe:bytes,game:dict[str,bytes]):
    for name,expected in CANONICAL_GRA_SHA256.items():
        require(name in game and sha(game[name])==expected,'noncanonical original GRA resource: '+name)
    for at,raw in SIGNATURES:
        require(exe[at:at+len(raw)//2].hex()==raw,'original renderer command grammar not authenticated')
    o121=build(exe,game)
    streams={};families=[]
    for fam in o121['families']:
        raw=game[fam['resourceName']];palette=decode_record(exe,fam['palettePhysical'],fam['paletteCount'],1)
        layers=[]
        for setup in fam['setups']:
            width,height=setup['rawSizeWords'];require(width*height<=300000,'unbounded mosaic')
            layer_rgba=bytearray(width*height*4);index_canvas=bytearray(width*height);alpha=bytearray(width*height)
            drawn=0;clipped=0;opaque_overdraw=0
            for descriptor in setup['rows']:
                key=(fam['resourceName'],descriptor['packedResourceOffset'],descriptor['spriteWidth'],descriptor['spriteHeight'])
                if key not in streams:
                    d=decode_stream(raw,key[1],key[2],key[3]);require(all(1<=i<=fam['paletteCount'] for i in d['opaqueIndices']),
                            f'sprite palette index outside counted record: {key}')
                    streams[key]=d
                d=streams[key];sw,sh=d['width'],d['height'];base_x,base_y=descriptor['signedX'],descriptor['signedY']
                for j,v in enumerate(d['indices']):
                    if not d['mask'][j]:continue
                    x=base_x+j%sw;y=base_y+j//sw
                    if not(0<=x<width and 0<=y<height):clipped+=1;continue
                    at=y*width+x
                    if alpha[at]:opaque_overdraw+=1
                    alpha[at]=1;index_canvas[at]=v
                    layer_rgba[4*at:4*at+4]=bytes((*palette[v],255));drawn+=1
            image=Image.frombytes('RGBA',(width,height),bytes(layer_rgba));png=io.BytesIO();image.save(png,format='PNG')
            layer={'family':fam['familyLabel'],'setupObject2Offset':setup['setupObject2Offset'],
                   'resourceName':fam['resourceName'],'paletteRecordPhysical':fam['palettePhysical'],
                   'paletteCount':fam['paletteCount'],'paletteIndexOrigin':'HYPOTHESIS_ONE_BASED' if fam['paletteCount']==79 else 'EVIDENCED_ONE_BASED_O119',
                   'dimensions':[width,height],'controlEntries':setup['count'],
                   'opaqueCanvasPixels':sum(alpha),'transparentCanvasPixels':len(alpha)-sum(alpha),
                   'clippedOpaqueSourcePixels':clipped,'overdrawOpaquePixels':opaque_overdraw,
                   'sourceOpaquePixelsVisited':drawn+clipped,'indexCanvasSHA256':sha(bytes(index_canvas)),
                   'alphaCanvasSHA256':sha(bytes(alpha)),'rgbaSHA256':sha(bytes(layer_rgba)),
                   'previewPNG_SHA256':sha(png.getvalue()),
                   'qualification':'SETUP_LOCAL_INDEXED_LAYER_NOT_PROVEN_FINAL_STAGE_FRAME'}
            layers.append((layer,png.getvalue()))
        families.append((fam,layers))
    byresource={}
    for (name,off,w,h),d in streams.items():
        byresource.setdefault(name,[]).append((off,d['end'],w,h,d))
    chains=[]
    for name,parts in sorted(byresource.items()):
        parts.sort();require(len({p[0] for p in parts})==len(parts),'duplicate stream start ambiguity')
        require(all(e==parts[i+1][0] for i,(start,e,_,__,d) in enumerate(parts[:-1])),
                'authenticated streams do not partition into an exact contiguous chain')
        chains.append({'resourceName':name,'firstOffset':parts[0][0], 'lastExclusive':parts[-1][1],
                       'byteSpan':parts[-1][1]-parts[0][0], 'decodedSprites':len(parts),
                       'opaquePixels':sum(x[4]['opaque'] for x in parts),
                       'transparentPixels':sum(x[4]['transparent'] for x in parts),
                       'commands':{k:sum(x[4]['commands'][k] for x in parts) for k in ('transparentSkip','indexedRLE','indexedLiteral')},
                       'sourceBytesSHA256':sha(game[name][parts[0][0]:parts[-1][1]])})
    return {'format':'mk2_o122_indexed_sprite_mosaics_v1',
            'originalEXE_SHA256':sha(exe),'o121Format':o121['format'],
            'status':'PASS_STATIC_DECODE_AND_SETUP_LOCAL_COMPOSITES',
            'streamCount':len(streams),'chainCount':len(chains),'chains':chains,
            'familyCount':len(families),'setupCount':sum(len(ls) for _,ls in families),
            'mosaics':[entry for _,layers in families for entry,_ in layers],
            'limits':{'runtimeSelectedSetup':False,'fullStageCompositing':False,
                      'screenLayerCoordinates':False,'79ColorRecordsRuntimeUse':False,
                      'exactTransparencyAndIndexStreams':True}},families

def write_new(path:Path,data:bytes):
    require(not path.exists(),'output already exists: '+str(path))
    path.parent.mkdir(parents=True,exist_ok=True)
    with path.open('xb') as f:f.write(data)

def main():
    cli=argparse.ArgumentParser(description=__doc__)
    cli.add_argument('--exe',type=Path,required=True)
    cli.add_argument('--game-zip',type=Path,required=True)
    cli.add_argument('--out',type=Path,required=True,help='Fresh output directory')
    cli.add_argument('--pngs',action='store_true',help='Include 10 optional generated previews (personal analysis only)')
    opt=cli.parse_args();require(not opt.out.exists(),'output directory already exists')
    exe=opt.exe.read_bytes();game=load_game_files(opt.game_zip,RESOURCE_NAMES)
    report,families=evidence(exe,game)
    opt.out.mkdir(parents=True)
    for fam,layers in families:
        if opt.pngs:
            for entry,png in layers:
                write_new(opt.out/(fam['familyLabel']+'_'+hex(entry['setupObject2Offset'])+'.png'),png)
    write_new(opt.out/'O122_INDEXED_LAYER_REPORT.json',(json.dumps(report,indent=2)+'\n').encode())
    print(json.dumps({'status':report['status'],'streamCount':report['streamCount'],
                      'chains':[(r['resourceName'],r['decodedSprites'],r['byteSpan']) for r in report['chains']],
                      'setupCount':report['setupCount']}))
if __name__=='__main__':main()
