#!/usr/bin/env python3
"""O123: bounded pixel-exact registration of O122 Tomb indexed architecture.

This measures a screenshot-relative registration, NOT the original game's camera
RAM, live setup pointer, stage-wide render order or palette handle.
Original commercial EXE/GRA inputs remain read-only. Requires the canonical O117
untouched Tomb screenshot and canonical MK2 binary/resource fingerprints.
"""
from __future__ import annotations
import argparse, hashlib, io, json
from pathlib import Path
import numpy as np
from PIL import Image
from export_o122_indexed_mosaics import evidence, require
from trace_o121_control_bindings import load_game_files, EXPECTED_RESOURCE

TOMB_SCREEN_SHA='5cd8f5ed5d75a4098df714b45a24ba2d7fe6ab43881add8e9c1043aa2b8e9ec9'
TOMB_SETUP=0x1737c
SKY_SETUP=0x173b2
SKY_FIT_ROIS=((290,350,112,150),(350,397,108,150))
SKY_HOLD_ROIS=((295,350,158,190),(350,395,155,190))
# Fit regions are intentionally disjoint from holdout regions; both were
# selected where the stage architecture is visible and characters are absent.
FIT_ROIS=((0,120,280,318),(520,632,280,318),(126,225,82,126),(407,509,82,126))
HOLDOUT_ROIS=((0,115,85,158),(390,514,85,158),(125,237,85,158),(520,632,85,158),
              (0,115,160,199),(520,632,160,199))


def sha(b:bytes)->str:return hashlib.sha256(b).hexdigest()

def points(rois,step=4):
    coords=[]
    for x0,x1,y0,y1 in rois:
        for yy in range(y0+(y0%2),y1,step):
            for xx in range(x0+(x0%2),x1,step):coords.append((xx,yy))
    coords=np.array(coords,dtype=np.int32)
    return coords[:,0],coords[:,1]

def score(layer:np.ndarray,screen:np.ndarray,xx:np.ndarray,yy:np.ndarray,xshift:int,yshift:int):
    sx=xx//2+xshift;sy=yy//2+yshift
    valid_bounds=(sx>=0)&(sx<layer.shape[1])&(sy>=0)&(sy<layer.shape[0])
    if not valid_bounds.any():return 0,0
    sx=sx[valid_bounds];sy=sy[valid_bounds];tx=xx[valid_bounds];ty=yy[valid_bounds]
    pixels=layer[sy,sx];mask=pixels[:,3]!=0
    n=int(mask.sum())
    matched=int(np.count_nonzero(np.all(pixels[mask,:3]==screen[ty[mask],tx[mask],:3],axis=1)))
    return matched,n

def fit_layer(layer:np.ndarray,screen:np.ndarray):
    require(screen.shape[:2]==(397,637),'unexpected original screenshot dimensions')
    xx,yy=points(FIT_ROIS)
    candidates=[]
    # Defined static search bounds are for screenshot-relative registration only.
    # Screen pixels are 2x nearest-neighbor copies; no screen image resampling.
    for yshift in range(0,101):
        for xshift in range(0,531):
            matched,n=score(layer,screen,xx,yy,xshift,yshift)
            if n>=800:
                candidates.append((matched,n,xshift,yshift))
    require(bool(candidates),'no alignment with sufficient opaque coverage')
    candidates.sort(key=lambda a:(a[0],a[0]/a[1],-a[2],-a[3]),reverse=True)
    m,n,xshift,yshift=candidates[0]
    require((xshift,yshift)==(267,57),'unexpected best alignment')
    require(m==n and m>=900,'fit does not exactly match sufficient visible samples')
    hx,hy=points(HOLDOUT_ROIS,2)
    hm,hn=score(layer,screen,hx,hy,xshift,yshift)
    require(hm==hn and hn>=2600,'held-out architecture pixels not exact')
    contrasts=[]
    for dx,dy in [(266,57),(268,57),(267,56),(267,58),(447,57),(87,57),(182,57),(352,57)]:
        cm,cn=score(layer,screen,xx,yy,dx,dy)
        contrasts.append({'xShift':dx,'yShift':dy,'fitMatches':cm,'fitVisible':cn})
        require(cm<m,'competing exact/aligned architecture model')
    return {'xShift':xshift,'yShift':yshift,'pixelModel':'screenX=2*(mosaicX-xShift) on sampled even/odd 2x pixels; screenY=2*(mosaicY-yShift)',
            'fitExact':m,'fitVisible':n,'heldoutExact':hm,'heldoutVisible':hn,
            'fitRegionsXYXY':[list(x) for x in FIT_ROIS],
            'heldoutRegionsXYXY':[list(x) for x in HOLDOUT_ROIS],
            'competitors':contrasts,'candidateCountPassingCoverage':len(candidates)}

def fit_sky(layer:np.ndarray,screen:np.ndarray):
    require(layer.shape==(80,320,4),'unexpected sky layer dimensions')
    xx,yy=points(SKY_FIT_ROIS,2)
    candidates=[]
    for dy in range(-70,1):
        for dx in range(-3,8):
            m,n=score(layer,screen,xx,yy,dx,dy)
            if n>=800:candidates.append((m,n,dx,dy))
    candidates.sort(key=lambda t:(t[0],t[0]/t[1],-abs(t[2])),reverse=True)
    require(bool(candidates),'no sky candidates')
    m,n,dx,dy=candidates[0]
    require((dx,dy)==(2,-47) and (m,n)==(1074,1074),'sky fitting failed')
    hx,hy=points(SKY_HOLD_ROIS,2);hm,hn=score(layer,screen,hx,hy,dx,dy)
    require((hm,hn)==(823,823),'sky holdout failed')
    negatives=[]
    for altx,alty in [(1,-47),(3,-47),(0,-47),(4,-47),(2,-48),(2,-46)]:
        am,an=score(layer,screen,xx,yy,altx,alty)
        require(am<m,'wrong sky alignment not excluded')
        negatives.append({'xShift':altx,'yShift':alty,'fitMatches':am,'fitVisible':an})
    return {'xShift':dx,'yShift':dy,'fitExact':m,'fitVisible':n,
            'heldoutExact':hm,'heldoutVisible':hn,
            'fitRegionsXYXY':[list(x) for x in SKY_FIT_ROIS],
            'heldoutRegionsXYXY':[list(x) for x in SKY_HOLD_ROIS],
            'competitors':negatives,'candidateCountPassingCoverage':len(candidates),
            'qualification':'Separate screenshot-relative placement of native 320x80 sky; not the game camera'}

def build_report(exe:bytes,game:dict[str,bytes],screen_png:bytes):
    require(sha(screen_png)==TOMB_SCREEN_SHA,'expected original unmodified Tomb screenshot')
    summary,families=evidence(exe,game)
    layer_entry=None;rgba=None;sky_entry=None;sky_rgba=None
    for fam,layers in families:
        if fam['familyLabel']=='tomb80':
            for m,png in layers:
                if m['setupObject2Offset']==TOMB_SETUP:
                    layer_entry=m
                    rgba=np.asarray(Image.open(io.BytesIO(png)).convert('RGBA')).copy()
                elif m['setupObject2Offset']==SKY_SETUP:
                    sky_entry=m
                    sky_rgba=np.asarray(Image.open(io.BytesIO(png)).convert('RGBA')).copy()
    require(layer_entry is not None and rgba.shape==(224,850,4),'Tomb architecture not reconstructed')
    original=np.asarray(Image.open(io.BytesIO(screen_png)).convert('RGB')).copy()
    result=fit_layer(rgba,original)
    sky_result=fit_sky(sky_rgba,original)
    return {'format':'mk2_o123_tomb_architecture_screenshot_registration_v1',
            'status':'PASS_SCREENSHOT_RELATIVE_PIXEL_REGISTRATION',
            'originalEXE_SHA256':sha(exe),
            'screenshotSHA256':sha(screen_png),
            'gameResourcesSHA256':{key:sha(game[key]) for key in ('TOMB.GRA','PORTAL.GRA','IMAGES.GRA')},
            'layerSetupObject2Offset':TOMB_SETUP,
            'layerRGBA_SHA256':layer_entry['rgbaSHA256'],
            'layerDimensions':layer_entry['dimensions'],
            'registration':result,
            'skySetupObject2Offset':SKY_SETUP,'skyLayerRGBA_SHA256':sky_entry['rgbaSHA256'],
            'skyLayerDimensions':sky_entry['dimensions'],'skyRegistration':sky_result,
            'limitations':{
               'originalGameplayScreenshotPixelsCompared':True,
               'screenSpaceReferenceOnly':True,
               'liveCameraVariable':False,'runtimeSetupPointer':False,
               'runtimePaletteHandle':False,'fullStageCompositor':False,
               'occludedPixelsExcludedByRegions':True,
               'distinctSourceCoordinateSystemsObserved':True}}

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--exe',type=Path,required=True);ap.add_argument('--game-zip',type=Path,required=True)
    ap.add_argument('--screenshot',type=Path,required=True);ap.add_argument('--out',type=Path,required=True)
    a=ap.parse_args()
    require(not a.out.exists(),'will not overwrite output')
    game=load_game_files(a.game_zip,{name for _,name in EXPECTED_RESOURCE.values()})
    report=build_report(a.exe.read_bytes(),game,a.screenshot.read_bytes())
    with a.out.open('xb') as f:f.write((json.dumps(report,indent=2)+'\n').encode())
    print(json.dumps({'status':report['status'],'registration':report['registration']}))
if __name__=='__main__':main()
