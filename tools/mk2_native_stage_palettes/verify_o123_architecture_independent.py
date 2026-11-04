#!/usr/bin/env python3
"""O123 independent decoder and screenshot witness audit; never calls O123 fitter/O122 producer."""
from __future__ import annotations
import argparse, hashlib, io, json, zipfile
from pathlib import Path
from PIL import Image
from trace_o121_control_bindings import build, EXPECTED_RESOURCE, load_game_files
from verify_o122_independent import independently_decode
from native_stage_palettes import decode_record

SCREEN_SHA='5cd8f5ed5d75a4098df714b45a24ba2d7fe6ab43881add8e9c1043aa2b8e9ec9'
GRA_HASHES={'TOMB.GRA':'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
            'PORTAL.GRA':'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82',
            'IMAGES.GRA':'2b26796a64c2aebfee75832696aeae9bbcf9df56d82cb9a39df58a557d3ad8cf'}
FIT=((0,120,280,318),(520,632,280,318),(126,225,82,126),(407,509,82,126))
HOLD=((0,115,85,158),(390,514,85,158),(125,237,85,158),(520,632,85,158),
      (0,115,160,199),(520,632,160,199))
SKY_FIT=((290,350,112,150),(350,397,108,150))
SKY_HOLD=((295,350,158,190),(350,395,155,190))
SKY_DISTRACTORS=((1,-47),(3,-47),(0,-47),(4,-47),(2,-48),(2,-46))
DISTRACTORS=((266,57),(268,57),(267,56),(267,58),(447,57),(87,57),(182,57),(352,57))

def hs(b:bytes)->str:return hashlib.sha256(b).hexdigest()
def need(test,msg):
    if not test:raise ValueError('O123_INDEPENDENT: '+msg)

def independent_layer(exe:bytes,game:dict[str,bytes],setup_id=0x1737c):
    prior=build(exe,game)
    family=next(f for f in prior['families'] if f['familyLabel']=='tomb80')
    setup=next(s for s in family['setups'] if s['setupObject2Offset']==setup_id)
    w,h=setup['rawSizeWords'];need((w,h)==((850,224) if setup_id==0x1737c else (320,80)),'source geometry changed')
    rgba=bytearray(w*h*4);pal=decode_record(exe,family['palettePhysical'],80,1)
    for row in setup['rows']:
        end,pixels,mask,counts=independently_decode(game['TOMB.GRA'],row['packedResourceOffset'],row['spriteWidth'],row['spriteHeight'])
        for j in range(len(pixels)):
            if not mask[j]:continue
            x=row['signedX']+j%row['spriteWidth'];y=row['signedY']+j//row['spriteWidth']
            if 0<=x<w and 0<=y<h:
                rgba[(y*w+x)*4:(y*w+x)*4+4]=bytes((*pal[pixels[j]],255))
    return bytes(rgba),w,h

def match_count(img_bytes:bytes,w:int,h:int,screenshot:Image.Image,rois,step,dx,dy):
    sz=screenshot.size
    img=screenshot.load()
    agree=opaque=0
    for x0,x1,y0,y1 in rois:
        for y in range(y0+(y0%2),y1,step):
            for x in range(x0+(x0%2),x1,step):
                sx=x//2+dx;sy=y//2+dy
                if not (0<=sx<w and 0<=sy<h and 0<=x<sz[0] and 0<=y<sz[1]):continue
                off=(sy*w+sx)*4
                if img_bytes[off+3]==0:continue
                opaque+=1
                agree+=tuple(img_bytes[off:off+3])==img[x,y]
    return agree,opaque

def audit(exe:bytes,game:dict[str,bytes],screenshot_bytes:bytes,report_bytes:bytes):
    need(hs(screenshot_bytes)==SCREEN_SHA,'original Tomb screenshot hash mismatch')
    for name,digest in GRA_HASHES.items():need(hs(game[name])==digest,'source resource mismatch: '+name)
    report=json.loads(report_bytes)
    need(report.get('format')=='mk2_o123_tomb_architecture_screenshot_registration_v1','report format')
    need(report.get('originalEXE_SHA256')==hs(exe),'exe hash claim')
    need(report.get('screenshotSHA256')==hs(screenshot_bytes),'screenshot hash claim')
    need(report.get('gameResourcesSHA256')=={k:hs(game[k]) for k in GRA_HASHES},'resource claims')
    need(report.get('layerSetupObject2Offset')==0x1737c and report.get('layerDimensions')==[850,224],'wrong setup or shape')
    layer,w,h=independent_layer(exe,game)
    need(report.get('layerRGBA_SHA256')==hs(layer),'image bytes diverge from independent stream decoder')
    shot=Image.open(io.BytesIO(screenshot_bytes)).convert('RGB')
    need(shot.size==(637,397),'wrong screenshot geometry')
    fitted=match_count(layer,w,h,shot,FIT,4,267,57)
    heldout=match_count(layer,w,h,shot,HOLD,2,267,57)
    need(fitted==(960,960),'independent fit mismatch')
    need(heldout==(2650,2650),'independent heldout mismatch')
    r=report.get('registration',{})
    need((r.get('xShift'),r.get('yShift'))==(267,57),'reported offset wrong')
    need((r.get('fitExact'),r.get('fitVisible'))==fitted,'reported fit counts wrong')
    need((r.get('heldoutExact'),r.get('heldoutVisible'))==heldout,'reported heldout counts wrong')
    need(r.get('fitRegionsXYXY')==[list(x) for x in FIT],'fit region changed')
    need(r.get('heldoutRegionsXYXY')==[list(x) for x in HOLD],'holdout region changed')
    controls=[]
    for dx,dy in DISTRACTORS:
        m,n=match_count(layer,w,h,shot,FIT,4,dx,dy)
        controls.append({'xShift':dx,'yShift':dy,'fitMatches':m,'fitVisible':n})
        need(m<960,'distractor matched all training points')
    need(r.get('competitors')==controls,'wrong negative controls')
    # Sky is independently rebuilt from its own authenticated setup controls.
    sky,sw,sh=independent_layer(exe,game,0x173b2)
    need(report.get('skyLayerRGBA_SHA256')==hs(sky),'sky RGBA mismatches independently decoded source')
    need(report.get('skySetupObject2Offset')==0x173b2 and report.get('skyLayerDimensions')==[320,80],'sky source identity')
    sr=report.get('skyRegistration',{})
    need((sr.get('xShift'),sr.get('yShift'))==(2,-47),'sky screenshot placement wrong')
    sky_fit=match_count(sky,sw,sh,shot,SKY_FIT,2,2,-47)
    sky_hold=match_count(sky,sw,sh,shot,SKY_HOLD,2,2,-47)
    need(sky_fit==(1074,1074) and sky_hold==(823,823),'independent sky screenshot mismatch')
    need((sr.get('fitExact'),sr.get('fitVisible'))==sky_fit,'sky fit report mismatch')
    need((sr.get('heldoutExact'),sr.get('heldoutVisible'))==sky_hold,'sky holdout report mismatch')
    need(sr.get('fitRegionsXYXY')==[list(x) for x in SKY_FIT] and sr.get('heldoutRegionsXYXY')==[list(x) for x in SKY_HOLD],'sky ROI report mismatch')
    sky_controls=[]
    for dx,dy in SKY_DISTRACTORS:
        m,n=match_count(sky,sw,sh,shot,SKY_FIT,2,dx,dy)
        need(m<1074,'false sky candidate')
        sky_controls.append({'xShift':dx,'yShift':dy,'fitMatches':m,'fitVisible':n})
    need(sr.get('competitors')==sky_controls,'wrong sky negative controls')
    limits=report.get('limitations',{})
    for name in ('liveCameraVariable','runtimeSetupPointer','runtimePaletteHandle','fullStageCompositor'):
        need(limits.get(name) is False,'unproven runtime claim: '+name)
    return {'status':'PASS_INDEPENDENT_O123','fittedPixels':fitted[0],
            'heldoutPixels':heldout[0],'skyFitPixels':sky_fit[0],
            'skyHoldoutPixels':sky_hold[0],
            'distractorsRejected':len(controls)+len(sky_controls),
            'originalScreenshotSHA256':hs(screenshot_bytes),
            'sourceStageRGBA_SHA256':hs(layer),
            'sourceSkyRGBA_SHA256':hs(sky),
            'qualification':'Screenshot-relative structural placement, not live camera or compositor'}

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--exe',type=Path,required=True);ap.add_argument('--game-zip',type=Path,required=True)
    ap.add_argument('--screenshot',type=Path,required=True);ap.add_argument('--report',type=Path,required=True)
    ap.add_argument('--out',type=Path,required=True)
    opts=ap.parse_args();need(not opts.out.exists(),'output file already exists')
    game=load_game_files(opts.game_zip,{name for _,name in EXPECTED_RESOURCE.values()})
    result=audit(opts.exe.read_bytes(),game,opts.screenshot.read_bytes(),opts.report.read_bytes())
    opts.out.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result))
if __name__=='__main__':main()
