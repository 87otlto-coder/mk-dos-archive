#!/usr/bin/env python3
"""O122 independent sprite-command decoder, exact stream-chain and PNG audit.

Does not import O122's producer or its decoding function. Reads original resources
and LE-verified O121 descriptor report; checks O122 evidence, then independently
cross-examines the Portal unmodified gameplay screenshot for a bounded region.
"""
from __future__ import annotations
import argparse, hashlib, json, struct, zipfile
from pathlib import Path
from PIL import Image
from trace_o121_control_bindings import load_game_files, EXPECTED_RESOURCE
from verify_o121_independent import verify as verify_o121
from native_stage_palettes import decode_record

BASELINE20_SHA='19858a54a7d9d3b09542dbcba06ff501aa29e9b9186cc07c3bbf3bdcde367f07'

def guard(ok,msg):
    if not ok:raise ValueError('INDEPENDENT_O122_AUDIT: '+msg)

def hs(b):return hashlib.sha256(b).hexdigest()

def independently_decode(raw,offset,width,height):
    pix=bytearray(width*height);visible=bytearray(width*height);cursor=offset;stats=[0,0,0]
    for y in range(height):
        col=0
        while col<width:
            guard(cursor+4<=len(raw),'truncated command')
            op=int.from_bytes(raw[cursor:cursor+4],'little');cursor+=4
            if op%2:
                take=op//2;stats[0]+=1
            elif op%4==2:
                take=op//1024;value=(op//4)%256;stats[1]+=1
                guard(0<take<=width-col,'RLE overrun')
                for j in range(take):
                    pix[y*width+col+j]=value;visible[y*width+col+j]=1
            else:
                take=op//4;stats[2]+=1
                guard(0<take<=64 and take<=width-col and cursor+take<=len(raw),'literal overrun')
                for j in range(take):
                    pix[y*width+col+j]=raw[cursor+j];visible[y*width+col+j]=1
                cursor+=(take+3)//4*4
            guard(0<take<=width-col,'row overrun/empty run')
            col+=take
    return cursor,pix,visible,stats

def screenshot_alignment(portal_rgba:bytes, png_reference:Path):
    p=png_reference.read_bytes();guard(hs(p)==BASELINE20_SHA,'noncanonical O113 control image')
    target=Image.open(png_reference).convert('RGB');guard(target.size==(639,397),'unexpected control screenshot dimensions')
    raw=target.tobytes();w=target.width
    # Source-defined 320x168 Portal backdrop. Holdout rectangle not obscured by fighters.
    def compare(dx,dy):
        ok=used=0
        for y in range(70,90):
            for x in range(100,210):
                pos=(y*320+x)*4
                if portal_rgba[pos+3]==0:continue
                tx=x*2+dx;ty=y*2+dy
                if not(0<=tx<target.width and 0<=ty<target.height):continue
                b=(ty*w+tx)*3;used+=1
                ok+=portal_rgba[pos:pos+3]==raw[b:b+3]
        return ok,used
    best=compare(-4,-18);guard(best==(2151,2151),'Portal screenshot alignment does not match independently')
    distractors={(dx,dy):compare(dx,dy) for dx,dy in [(-6,-18),(-2,-18),(-4,-16),(-4,-20),(0,0)]}
    guard(all(v[0]<best[0] for v in distractors.values()),'false camera/crop alignment not rejected')
    return {'source':'O113_ORIGINAL_PORTAL_CONTROL_20.png','screenshotSHA256':hs(p),
            'mode':'2x nearest, screenshot crop shift (-4,-18) for THIS capture only',
            'sourceRectangleXYXY':[100,70,210,90],
            'exactRGBMatches':best[0],'visiblePixelsCompared':best[1],
            'wrongAlignmentMatches':{f'{dx},{dy}':ok for (dx,dy),(ok,n) in distractors.items()},
            'limit':'Not the game camera RAM, not proof of final stage compositing'}

def audit(exe:bytes,game_zip:bytes,o121raw:bytes,o122raw:bytes,portal_control:Path):
    verify_o121(exe,game_zip,o121raw)
    original=json.loads(o121raw);report=json.loads(o122raw)
    guard(report.get('format')=='mk2_o122_indexed_sprite_mosaics_v1','wrong O122 format')
    guard(report.get('originalEXE_SHA256')==hs(exe),'wrong EXE source hash')
    guard(report.get('o121Format')==original.get('format'),'wrong predecessor format')
    with zipfile.ZipFile(__import__('io').BytesIO(game_zip)) as z:
        data={name:z.read(next(n for n in z.namelist() if n.rsplit('/',1)[-1].upper()==name))
              for name in ('TOMB.GRA','PORTAL.GRA','IMAGES.GRA')}
    used={};family_count=0;layers=[];portal_rgba=None;independent_checks=0
    for family in original['families']:
        pal=decode_record(exe,family['palettePhysical'],family['paletteCount'],1)
        for layer in family['setups']:
            width,height=layer['rawSizeWords'];mask=bytearray(width*height);index=bytearray(width*height);image=bytearray(width*height*4)
            clipped=overdraw=source_opaque=0
            for r in layer['rows']:
                key=(family['resourceName'],r['packedResourceOffset'],r['spriteWidth'],r['spriteHeight'])
                if key not in used:
                    end,pixels,opacity,counters=independently_decode(data[key[0]],*key[1:])
                    guard(all(1<=p<=family['paletteCount'] for p,m in zip(pixels,opacity) if m),'palette index invalid')
                    used[key]=(end,pixels,opacity,counters)
                end,pixels,opacity,counters=used[key];sw=r['spriteWidth']
                for ordinal in range(len(pixels)):
                    if not opacity[ordinal]:continue
                    source_opaque+=1
                    x=r['signedX']+ordinal%sw;y=r['signedY']+ordinal//sw
                    if x<0 or y<0 or x>=width or y>=height:
                        clipped+=1;continue
                    at=y*width+x
                    if mask[at]:overdraw+=1
                    index[at]=pixels[ordinal];mask[at]=1
                    image[4*at:4*at+4]=bytes((*pal[pixels[ordinal]],255))
            a=next((entry for entry in report['mosaics'] if entry['family']==family['familyLabel'] and entry['setupObject2Offset']==layer['setupObject2Offset']),None)
            guard(a is not None,'missing mosaic')
            expected={'dimensions':[width,height],'controlEntries':layer['count'],
                     'opaqueCanvasPixels':mask.count(1),'transparentCanvasPixels':mask.count(0),
                     'clippedOpaqueSourcePixels':clipped,'overdrawOpaquePixels':overdraw,
                     'sourceOpaquePixelsVisited':source_opaque,'indexCanvasSHA256':hs(index),
                     'alphaCanvasSHA256':hs(mask),'rgbaSHA256':hs(image),
                     'resourceName':family['resourceName'],'paletteRecordPhysical':family['palettePhysical'],
                     'paletteCount':family['paletteCount']}
            for k,v in expected.items():
                guard(a.get(k)==v,'mosaic claim diverges from independent decoder: '+str((family['familyLabel'],k)))
                independent_checks+=1
            if family['familyLabel']=='portal80' and layer['setupObject2Offset']==0x16526:
                portal_rgba=bytes(image)
            family_count+=1
    guard(family_count==10 and len(report['mosaics'])==10,'unexpected mosaic count')
    guard(len(used)==49 and report['streamCount']==49,'unexpected descriptor count')
    chains=[]
    for name in ('TOMB.GRA','PORTAL.GRA','IMAGES.GRA'):
        members=sorted((off,v[0],v[1],v[2],v[3]) for (resource,off,w,h),v in used.items() if resource==name)
        guard(all(e==members[n+1][0] for n,(off,e,*_) in enumerate(members[:-1])),'streams are not contiguous')
        chain=next((c for c in report['chains'] if c['resourceName']==name),None)
        guard(chain is not None,'missing chain')
        expected={'decodedSprites':len(members),'firstOffset':members[0][0],'lastExclusive':members[-1][1],
                  'byteSpan':members[-1][1]-members[0][0],
                  'sourceBytesSHA256':hs(data[name][members[0][0]:members[-1][1]]),
                  'opaquePixels':sum(m[3].count(1) for m in members),
                  'transparentPixels':sum(m[3].count(0) for m in members),
                  'commands':dict(zip(('transparentSkip','indexedRLE','indexedLiteral'),
                                   [sum(m[4][j] for m in members) for j in range(3)]))}
        for k,v in expected.items():
            guard(chain.get(k)==v,'wrong original-data stream chain: '+name+' '+k)
            independent_checks+=1
        chains.append({'name':name,'sprites':len(members),'offsets':[members[0][0],members[-1][1]]})
    guard(portal_rgba is not None,'no indexed Portal layer')
    witness=screenshot_alignment(portal_rgba,portal_control)
    return {'status':'INDEPENDENT_PASS','o122FileSHA256':hs(o122raw),
            'sourceExeSHA256':hs(exe),'sourceO121ReportSHA256':hs(o121raw),
            'independentAssertions':independent_checks,'decodedSprites':len(used),
            'mosaics':family_count,'contiguousChains':chains,'portalGameplayControl':witness,
            'limits':['Indexed command grammar derives from original EXE',
                      '79-color IMAGES sprite appearance remains conditional, not runtime-confirmed',
                      'Full stage layout, sprite ordering, live palette handles remain open']}

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--exe',type=Path,required=True);ap.add_argument('--game-zip',type=Path,required=True)
    ap.add_argument('--o121',type=Path,required=True);ap.add_argument('--o122',type=Path,required=True)
    ap.add_argument('--portal-control',type=Path,required=True);ap.add_argument('--out',type=Path,required=True)
    a=ap.parse_args();guard(not a.out.exists(),'refusing to overwrite report')
    report=audit(a.exe.read_bytes(),a.game_zip.read_bytes(),a.o121.read_bytes(),a.o122.read_bytes(),a.portal_control)
    with a.out.open('xb') as f:f.write((json.dumps(report,indent=2)+'\n').encode())
    print(json.dumps({'status':report['status'],'independentAssertions':report['independentAssertions'],
                      'portalExactPixels':report['portalGameplayControl']['exactRGBMatches']}))
if __name__=='__main__':main()
