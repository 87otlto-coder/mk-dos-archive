#!/usr/bin/env python3
"""O124 independent original-byte validator. Does NOT import O124 producer or O122 producer.
Uses the separately authored O122 independent command decoder, O121 canonical
control-descriptor evidence, original EXE palette words, and screenshot pixels.
"""
from __future__ import annotations
import argparse,hashlib,io,json,sys,zipfile
from pathlib import Path
import numpy as np
from PIL import Image
from verify_o122_independent import independently_decode

SHA_EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
SHAS={'TOMB.GRA':'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
      'PORTAL.GRA':'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82',
      'IMAGES.GRA':'2b26796a64c2aebfee75832696aeae9bbcf9df56d82cb9a39df58a557d3ad8cf'}
CONTROL_SHA='bc4cde02aa2a0624ea867a264324321e6e166356e606af670204a85af21be8a4'
CAPS={'tomb':('5cd8f5ed5d75a4098df714b45a24ba2d7fe6ab43881add8e9c1043aa2b8e9ec9',637,397),
      'portal':('19858a54a7d9d3b09542dbcba06ff501aa29e9b9186cc07c3bbf3bdcde367f07',639,397)}
SETS={'tomb':{'architecture':0x1737c,'sky':0x173b2},'portal':{'backdrop':0x16526}}
COLOURS={'architecture':(55,170,230),'sky':(252,170,60),'floor':(85,200,100),
         'backdrop':(154,115,227),'ambiguous':(250,250,250),'unattributed':(30,30,36)}

def sha(b):return hashlib.sha256(b).hexdigest()
def check(cond,msg):
    if not cond:raise ValueError('O124 independent rejection: '+msg)

def dac(exe,base,count):
    check(int.from_bytes(exe[base:base+2],'little')==count,'original counted palette header mismatch')
    out={}
    for i in range(count):
        word=int.from_bytes(exe[base+2+i*2:base+4+i*2],'little')
        channels=[((word//512)%64)|1,((word//16)%64)|1,((word*2)%64)|1]
        out[i+1]=tuple(4*a+a//16 for a in channels)
    return out

def reconstruct(exe,files,control):
    result={}
    for stage in SETS:
        family=next(a for a in control['families'] if a['familyLabel']==stage+'80')
        pal=dac(exe,family['palettePhysical'],80)
        for label,off in SETS[stage].items():
            s=next(x for x in family['setups'] if x['setupObject2Offset']==off)
            width,height=s['rawSizeWords']
            canvas=np.zeros((height,width,4),dtype=np.uint8)
            for entry in s['rows']:
                sx,sy=entry['signedX'],entry['signedY']
                w,h=entry['spriteWidth'],entry['spriteHeight'];start=entry['packedResourceOffset']
                end,index,opaque,_=independently_decode(files[family['resourceName']],start,w,h)
                check(end<=len(files[family['resourceName']]),'malformed stream')
                for i,marked in enumerate(opaque):
                    if not marked:continue
                    x=sx+i%w;y=sy+i//w
                    if not(0<=x<width and 0<=y<height):continue
                    idx=index[i];check(idx in pal,'source index not in verified record')
                    canvas[y,x]=(*pal[idx],255)
            result[(stage,label)]=canvas
    return result

def original_game(game_zip):
    with zipfile.ZipFile(io.BytesIO(game_zip)) as z:
        out={}
        for name,expected in SHAS.items():
            paths=[p for p in z.namelist() if p.rsplit('/',1)[-1].upper()==name]
            check(len(paths)==1,'missing/ambiguous commercial input '+name)
            out[name]=z.read(paths[0]);check(sha(out[name])==expected,'wrong original input '+name)
        return out

def independent(exe,archive,screens,control,report,atlas_pngs):
    check(sha(exe)==SHA_EXE and len(exe)==861133,'wrong EXE')
    files=original_game(archive)
    check(control['totals']['controlEntries']==135 and control['canonicalExeSHA256']==SHA_EXE,'different source control graph')
    check(report['schema']=='mk2_o124_screenshot_source_attribution_v1','wrong report type')
    check(report['canonicalExeSHA256']==sha(exe),'wrong report EXE hash')
    check(report['originalResourceSHA256']=={k:sha(v) for k,v in sorted(files.items())},'wrong resource provenance')
    for text in report['limitations']:
        check(isinstance(text,str),'unexpected limits')
    check(len(report['limitations'])==6 and report['status']=='PASS_CONDITIONAL_SCREENSHOT_SOURCE_ATTRIBUTION','limits/status mismatch')
    mosaics=reconstruct(exe,files,control)
    counts={};checks=0
    for stage in ('tomb','portal'):
        image_bytes=screens[stage];w,h=CAPS[stage][1:]
        check(sha(image_bytes)==CAPS[stage][0],'noncanonical screenshot')
        screen=np.asarray(Image.open(io.BytesIO(image_bytes)).convert('RGB'))
        check(screen.shape==(h,w,3),'screenshot shape')
        reg=np.zeros((h,w),np.uint8);rgb_layers={};layer_masks={}
        y,x=np.indices((h,w))
        for label in SETS[stage]:
            tile=mosaics[(stage,label)]
            if label=='architecture':u=x//2+267;v=y//2+57
            elif label=='sky':u=x//2+2;v=y//2-47
            else:u=(x+4)//2;v=(y+18)//2
            inside=(u>=0)&(u<tile.shape[1])&(v>=0)&(v<tile.shape[0])
            predicted=np.zeros((h,w,4),dtype=np.uint8);predicted[inside]=tile[v[inside],u[inside]]
            rgb_layers[label]=predicted
        raw=files[stage.upper()+'.GRA'];height=48 if stage=='tomb' else 40
        base=len(raw)-height*896;check(base>=0,'invalid original packed suffix')
        packed=np.frombuffer(raw[base:],np.uint8).reshape(height,896)
        py=(y-(318 if stage=='tomb' else 321))//2
        px=x//2 if stage=='tomb' else np.minimum(319,((x+.5)*320/w).astype(int))
        valid=(py>=0)&(py<height)&(px>=0)&(px<320)
        floor=np.zeros((h,w,4),np.uint8);original_indices=packed[py[valid],(291 if stage=='tomb' else 292)+px[valid]]
        pal=dac(exe,0x893c6 if stage=='tomb' else 0x891e0,80)
        values=np.zeros((256,4),np.uint8)
        for i,color in pal.items():values[i]=(*color,255)
        check(all(int(idx) in pal for idx in original_indices),'unqualified floor index')
        floor[valid]=values[original_indices];rgb_layers['floor']=floor
        counts[stage]={}
        for label,a in rgb_layers.items():
            match=(a[:,:,3]==255)&np.all(a[:,:,:3]==screen,axis=2)
            layer_masks[label]=match;reg+=match.astype(np.uint8)
        output=np.zeros((h,w,3),np.uint8);output[:]=COLOURS['unattributed']
        for label,m in layer_masks.items():output[m&(reg==1)]=COLOURS[label]
        output[reg>1]=COLOURS['ambiguous']
        s=report['screens'][stage]
        for label,a in rgb_layers.items():
            expected={'projectedOpaquePixels':int(np.count_nonzero(a[:,:,3])),
                      'exactRGBPixels':int(layer_masks[label].sum()),
                      'exclusiveExactRGBPixels':int((layer_masks[label]&(reg==1)).sum())}
            check(s['sourceLayers'][label]==expected,stage+'/'+label+' counts falsified');checks+=3
        expected={'imagePixels':w*h,'explainedByAtLeastOne':int(np.count_nonzero(reg)),
                  'explainedUniquely':int(np.count_nonzero(reg==1)),
                  'ambiguousMultipleMatches':int(np.count_nonzero(reg>1)),
                  'unattributed':int(np.count_nonzero(reg==0)),
                  'imageAttributionSHA256':sha(output.tobytes()),'gameplayScreenshotSHA256':sha(image_bytes),
                  'screenshotDimensions':[w,h], 'attributionPNGSHA256':sha(atlas_pngs[stage])}
        expected_rows={}
        for name,(lo,hi) in {'top':(0,110),'middle':(110,318),'floorBand':(318,h)}.items():
            expected_rows[name]={'sourceExplained':int(np.count_nonzero(reg[lo:hi])),
                                 'capturePixels':int((hi-lo)*w)}
        expected['coverageByScreenBand']=expected_rows
        for k,v in expected.items():check(s[k]==v,stage+'/'+k+' report altered');checks+=1
        picture=np.asarray(Image.open(io.BytesIO(atlas_pngs[stage])).convert('RGB'))
        check(picture.shape==output.shape and np.array_equal(picture,output),'image atlas altered')
        checks+=w*h
        counts[stage]={'explained':expected['explainedByAtLeastOne'],'pixelCount':expected['imagePixels']}
    return {'status':'PASS','independentPixelAssertions':checks,'sourceAttribution':counts,
            'limits':'Source-compatible screenshot RGB only; no runtime compositor, active setup or live palette handle'}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    for key in ('exe','game-zip','tomb-screenshot','portal-screenshot','o121','report','tomb-atlas','portal-atlas'):
        p.add_argument('--'+key,type=Path,required=True)
    a=p.parse_args();check(sha(a.o121.read_bytes())==CONTROL_SHA,'forged O121 descriptor graph');result=independent(a.exe.read_bytes(),a.game_zip.read_bytes(),
       {'tomb':a.tomb_screenshot.read_bytes(),'portal':a.portal_screenshot.read_bytes()},
       json.loads(a.o121.read_text()),json.loads(a.report.read_text()),
       {'tomb':a.tomb_atlas.read_bytes(),'portal':a.portal_atlas.read_bytes()})
    print(json.dumps(result,indent=2))
if __name__=='__main__':main()
