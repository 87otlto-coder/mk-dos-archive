#!/usr/bin/env python3
"""O124: source-grounded pixel attribution in *two particular* original MK2 screenshots.

A source layer explaining a screenshot pixel is NOT proof of game draw order,
active object setup, internal camera coordinates, or a complete screen compositor.
All projection parameters were established independently in O115/O117/O122/O123.
Inputs (EXE, original GRA, screenshots) are authenticated and read-only.
Exports only new confidence/attribution PNGs and an audit JSON; never game data.
"""
from __future__ import annotations
import argparse,hashlib,io,json,sys
from pathlib import Path
import numpy as np
from PIL import Image
from export_o122_indexed_mosaics import evidence
TOOLS_ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(TOOLS_ROOT/'mk2_packed_stage'))
from mk2_packed_stage import resource_identity,STRIDE
from trace_o121_control_bindings import load_game_files,EXPECTED_RESOURCE
from native_stage_palettes import source_palette

TOMB_SCREEN='5cd8f5ed5d75a4098df714b45a24ba2d7fe6ab43881add8e9c1043aa2b8e9ec9'
PORTAL_SCREEN='19858a54a7d9d3b09542dbcba06ff501aa29e9b9186cc07c3bbf3bdcde367f07'
SETUPS={'tomb':{'architecture':0x1737c,'sky':0x173b2},'portal':{'backdrop':0x16526}}
STAGES={'tomb':{'size':(637,397),'sha':TOMB_SCREEN,'column':291,'floor_y':318,'source_rows':48},
        'portal':{'size':(639,397),'sha':PORTAL_SCREEN,'column':292,'floor_y':321,'source_rows':40}}
# Fixed evidence colors of a *source explained pixel*, not a game render.
LEGEND={'architecture':(55,170,230),'sky':(252,170,60),'floor':(85,200,100),
        'backdrop':(154,115,227),'ambiguous':(250,250,250),'unattributed':(30,30,36)}

def require(ok,message):
    if not ok:raise ValueError('O124: '+message)

def digest(x):return hashlib.sha256(x).hexdigest()

def png_bytes(array):
    out=io.BytesIO();Image.fromarray(array,'RGB').save(out,format='PNG');return out.getvalue()

def project(stage:str,screenshot:bytes,exe:bytes,game:dict[str,bytes],layers:dict[int,np.ndarray]):
    require(stage in STAGES,'stage not witnessed')
    cfg=STAGES[stage];require(digest(screenshot)==cfg['sha'],'uncanonical original gameplay capture')
    screen=np.asarray(Image.open(io.BytesIO(screenshot)).convert('RGB'))
    h,w=screen.shape[:2];require((w,h)==cfg['size'],'screenshot size differs')
    yy,xx=np.mgrid[:h,:w]
    projected={}
    for label,setup in SETUPS[stage].items():
        source=layers[setup]
        if label=='architecture':sx=xx//2+267;sy=yy//2+57
        elif label=='sky':sx=xx//2+2;sy=yy//2-47
        else:sx=(xx+4)//2;sy=(yy+18)//2
        ok=(sx>=0)&(sx<source.shape[1])&(sy>=0)&(sy<source.shape[0])
        pixels=np.zeros((h,w,4),dtype=np.uint8)
        pixels[ok]=source[sy[ok],sx[ok]]
        projected[label]=pixels
    # Packed floor is a separate source suffix; the screenshot-derived crop is
    # intentionally not equated with the undocumented runtime camera variable.
    resource=game[stage.upper()+'.GRA']
    _,_,start,rows=resource_identity(stage+'.gra',resource)
    require(rows==cfg['source_rows'],'unexpected packed-floor source rows')
    raw=np.frombuffer(resource,dtype=np.uint8)[start:start+rows*STRIDE].reshape(rows,STRIDE)
    colors=source_palette(exe,stage)
    lut=np.zeros((256,4),np.uint8)
    for i,rgb in colors.items():lut[i]=(*rgb,255)
    if stage=='tomb': col=xx//2
    else:col=np.minimum(319,((xx+.5)*320/w).astype(int))
    source_row=(yy-cfg['floor_y'])//2
    ok=(source_row>=0)&(source_row<rows)&(col>=0)&(col<320)
    px=np.zeros((h,w,4),np.uint8)
    indices=raw[source_row[ok],cfg['column']+col[ok]]
    require(np.all(np.isin(indices,list(colors))),'floor byte lacks original 80-color source record')
    px[ok]=lut[indices]
    projected['floor']=px
    match={}
    for label,data in projected.items():
        match[label]=(data[:,:,3]!=0)&np.all(data[:,:,:3]==screen,axis=2)
    memberships=np.zeros((h,w),np.uint8)
    for mask in match.values():memberships+=mask.astype(np.uint8)
    atlas=np.zeros((h,w,3),np.uint8);atlas[:]=LEGEND['unattributed']
    for label,mask in match.items():atlas[mask&(memberships==1)]=LEGEND[label]
    atlas[memberships>1]=LEGEND['ambiguous']
    counts={label:{'projectedOpaquePixels':int(np.count_nonzero(data[:,:,3])),
                   'exactRGBPixels':int(np.count_nonzero(match[label])),
                   'exclusiveExactRGBPixels':int(np.count_nonzero(match[label]&(memberships==1)))}
            for label,data in projected.items()}
    row_bins={}
    for name,(lo,hi) in {'top':(0,110),'middle':(110,318),'floorBand':(318,h)}.items():
        row_bins[name]={'sourceExplained':int(np.count_nonzero(memberships[lo:hi])),
                        'capturePixels':int((hi-lo)*w)}
    report={'stage':stage,'gameplayScreenshotSHA256':digest(screenshot),'screenshotDimensions':[w,h],
            'sourceLayers':counts,'imagePixels':int(w*h),
            'explainedByAtLeastOne':int(np.count_nonzero(memberships)),
            'explainedUniquely':int(np.count_nonzero(memberships==1)),
            'ambiguousMultipleMatches':int(np.count_nonzero(memberships>1)),
            'unattributed':int(np.count_nonzero(memberships==0)),
            'coverageByScreenBand':row_bins,'imageAttributionSHA256':digest(atlas.tobytes())}
    require(sum([report['explainedUniquely'],report['ambiguousMultipleMatches'],report['unattributed']])==w*h,
            'membership partition mismatch')
    for label,c in counts.items():require(c['exactRGBPixels']>=c['exclusiveExactRGBPixels'],'invalid attribution')
    return report,atlas,match

def run(exe:bytes,game:dict[str,bytes],screenshots:dict[str,bytes]):
    # evidence() independently enforces original file digests and object/decoder grammar.
    summary,families=evidence(exe,game)
    require(summary['streamCount']==49,'stage stream corpus changed')
    layers={e['setupObject2Offset']:np.asarray(Image.open(io.BytesIO(png)).convert('RGBA')).copy()
            for _,family in families for e,png in family}
    results={};images={}
    for stage in ('tomb','portal'):
        result,atlas,_=project(stage,screenshots[stage],exe,game,layers)
        images[stage]=png_bytes(atlas);result['attributionPNGSHA256']=digest(images[stage]);results[stage]=result
    return {'schema':'mk2_o124_screenshot_source_attribution_v1','status':'PASS_CONDITIONAL_SCREENSHOT_SOURCE_ATTRIBUTION',
            'canonicalExeSHA256':digest(exe),'originalResourceSHA256':{k:digest(game[k]) for k in sorted(game)},
            'pixelMethod':'Compare exact RGB against each O122 source-layer pixel and original packed-floor pixel at separately O115/O117/O122/O123 verified screenshot-relative alignments',
            'screens':results,'limitations':[
                'Screenshot-relative fixed registrations only; NOT actual DOS runtime camera RAM',
                'Source RGB equality is evidence for a candidate explanation, NOT proof of unique layer identity where colors collide',
                'Attribution maps are not a source recreation of foreground/actors/UI/dynamic animation',
                'No inferred draw order or full stage compositor',
                'No observed live setup pointer, palette handle or DAC start',
                'Only original 2026-10-11 user-provided Tomb and Portal screenshots are authenticated'
            ]},images

def output_new(path:Path,data:bytes):
    require(not path.exists(),'refusing output overwrite: '+str(path));path.parent.mkdir(parents=True,exist_ok=True)
    with path.open('xb') as f:f.write(data)

def main():
    p=argparse.ArgumentParser(description=__doc__)
    for arg in ('exe','game-zip','tomb-screenshot','portal-screenshot','output-dir'):p.add_argument('--'+arg,required=True,type=Path)
    a=p.parse_args();require(not a.output_dir.exists(),'output directory exists')
    sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'mk2_packed_stage'))
    game=load_game_files(a.game_zip,{x[1] for x in EXPECTED_RESOURCE.values()})
    result,images=run(a.exe.read_bytes(),game,{'tomb':a.tomb_screenshot.read_bytes(),'portal':a.portal_screenshot.read_bytes()})
    a.output_dir.mkdir(parents=True)
    for stage,im in images.items():output_new(a.output_dir/(stage.upper()+'_SOURCE_ATTRIBUTION.png'),im)
    output_new(a.output_dir/'O124_SOURCE_ATTRIBUTION.json',(json.dumps(result,indent=2)+'\n').encode())
    print(json.dumps({'status':result['status'],'attributed':{s:{'explained':r['explainedByAtLeastOne'],'total':r['imagePixels']} for s,r in result['screens'].items()}}))

if __name__=='__main__':
    sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'mk2_packed_stage'))
    main()
