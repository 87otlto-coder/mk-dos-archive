#!/usr/bin/env python3
"""O132: camera-independent MK2 source-layer pack for wide-scene editing.

Uses original canonical MK2.EXE + TOMB/PORTAL/IMAGES.GRA. Never extends,
stretches or invents stage pixels; preserves the *entire* 896-column packed
floor source and separate authenticated setup-local mosaics, plus the index
and opacity planes so later compositing/animation can remain reversible.

IMPORTANT: This is NOT a final complete stage, parallax simulation, animation
export, a stage-specific camera coordinate, or HD art. Motion/timing unknowns
are explicit and never replaced with fabricated frames.
"""
from __future__ import annotations
import argparse, hashlib, io, json, struct, zipfile
from pathlib import Path
from PIL import Image
from export_o122_indexed_mosaics import evidence,decode_stream,write_new,sha,CANONICAL_GRA_SHA256
from trace_o121_control_bindings import load_game_files
from native_stage_palettes import source_palette,authenticate_exe
from trace_o134_stage_behavior_callbacks import produce as o134_callback_sources
from trace_o135_stage_effect_coroutines import analyze as o135_coroutine_source
from sys import path as syspath
syspath.insert(0,str(Path(__file__).resolve().parents[1]/'mk2_packed_stage'))
from mk2_packed_stage import resource_identity, STRIDE

STAGE={'tomb':('TOMB.GRA','tomb80'),'portal':('PORTAL.GRA','portal80')}

def req(cond:bool,msg:str):
    if not cond:raise ValueError('O132: '+msg)

def png_bytes(mode:str,size:tuple[int,int],pixels:bytes)->bytes:
    picture=Image.frombytes(mode,size,pixels)
    stream=io.BytesIO();picture.save(stream,'PNG');return stream.getvalue()

def _indexed_mosaic(resource:bytes,setup:dict,colors:dict[int,tuple[int,int,int]])->tuple[bytes,bytes]:
    width,height=setup['rawSizeWords'];idx=bytearray(width*height);opacity=bytearray(width*height)
    for row in setup['rows']:
        spr=decode_stream(resource,row['packedResourceOffset'],row['spriteWidth'],row['spriteHeight'])
        for i,value in enumerate(spr['indices']):
            if not spr['mask'][i]:continue
            x=row['signedX']+i%spr['width'];y=row['signedY']+i//spr['width']
            if 0<=x<width and 0<=y<height:
                req(value in colors,'unmapped original sprite index')
                at=y*width+x;idx[at]=value;opacity[at]=255
    return bytes(idx),bytes(opacity)

def _stage_motion_input_candidate(exe:bytes,stage:str)->dict:
    # O133: source pointer is from the selected MODE-2 root at +0x14.
    # This is an authenticated nine-word input table, not an observed
    # parallax timeline, animation frame list or per-frame rate.
    root={'tomb':0x171f0,'portal':0x16378}[stage]
    source=struct.unpack_from('<I',exe,0xa0c54+root+0x14)[0]
    expected={'tomb':0x172dc,'portal':0x1641c}[stage]
    req(source==expected,'stage movement input pointer changed')
    raw=list(struct.unpack_from('<9i',exe,0xa0c54+source))
    return {'status':'STATIC_SOURCE_WORDS_ONLY','rootObject2':root,
            'sourceTableObject2':source,'numberFormat':'SIGNED_16_16',
            'originalSourceWords':raw,'animationFrameOrder':None,
            'animationDurationFrames':None,'livePositionChannelValues':None,
            'parallaxMultiplier':None,'activeTransform':None,
            'experimentalWidescreenTransform':None}

def build_pack(exe:bytes,game:dict[str,bytes],stages:tuple[str,...]=('tomb','portal')):
    authenticate_exe(exe)
    req(len(stages)>=1 and len(set(stages))==len(stages) and all(s in STAGE for s in stages),'invalid or repeated stage')
    report,families=evidence(exe,game)
    callback_sources=o134_callback_sources(exe)
    coroutine_sources=o135_coroutine_source(exe)
    by_family={fam['familyLabel']:(fam,layer_pairs) for fam,layer_pairs in families}
    result={'schema':'mk2_o132_native_source_layer_pack_v1','status':'STATIC_CAMERA_INDEPENDENT_LAYER_EXPORT',
            'sourceExecutableSHA256':sha(exe),
            'originalSourceSpace':{'packedFloorRowStridePixels':STRIDE,'gameplayRowTransferPixels':320,
              'viewportIsOnlyRuntimeSamplingNotExportBoundary':True},
            'wideCompositionReference':{'aspectRatio':[16,9],'optionalCanvas':[896,504],
              'canvasPixelsAreNotAutomatedStagePlacements':True,'assetPixelsNeverResampled':True},
            'compositing':{'setupLocalSpritePlacementRecovered':True,'interSetupLayerPositionRecovered':False,
              'finalDrawOrderRecovered':False,'liveCameraPositionRecovered':False,
              'runtimeSetupActivationRecovered':False},
            'motion':{'parallaxTrackCountAuthenticated':0,'animatedTrackCountAuthenticated':0,
              'parallaxMotionRulesRecovered':False,'animationFrameOrderingRecovered':False,
              'animationDurationsRecovered':False,'staticAssetsMayBelongToAnimatedScene':True,
              'note':'No inferred loops, animated sprites, duration, cadence or parallax speed. Preserve independent layers and raw indices pending executable/runtime research.'},
            'sourceEffectCoroutineEvidence':coroutine_sources,
            'stages':[], 'files':[]}
    payloads={}
    def emit(filename:str,content:bytes,size:tuple[int,int],fmt:str,asset_id:str):
        req(filename not in payloads,'duplicate generated path');payloads[filename]=content
        result['files'].append({'path':filename,'sha256':sha(content),'bytes':len(content),'dimensions':list(size),'format':fmt,'assetId':asset_id})
    for stage in stages:
        filename,family=STAGE[stage]
        data=game[filename]
        _,_,start,rows=resource_identity(filename,data)
        rgb=source_palette(exe,stage)
        plane=data[start:];req(len(plane)==STRIDE*rows,'incomplete packed source plane')
        rgba=bytearray(len(plane)*4)
        for i,n in enumerate(plane):
            req(n in rgb,stage+' original floor index missing from 80-color record')
            rgba[i*4:i*4+4]=bytes((*rgb[n],255))
        d=(STRIDE,rows);root=f'{stage}/floor'
        emit(root+'_rgba.png',png_bytes('RGBA',d,bytes(rgba)),d,'RGBA_PNG',stage+'_packed_floor')
        emit(root+'_indices.png',png_bytes('L',d,plane),d,'INDEX8_PNG',stage+'_packed_floor')
        stage_item={'stage':stage,'originalResource':filename,'resourceSHA256':sha(data),
                    'sourcePaletteRecordPhysical':0x893c6 if stage=='tomb' else 0x891e0,
                    'packedFloor':{'assetId':stage+'_packed_floor','sourceOffset':start,'nativeDimensions':list(d),
                      'sourceIndexSHA256':sha(plane),'rgbaSHA256':sha(bytes(rgba)),
                      'alpha':'fully_opaque_in_source_plane','cameraCropApplied':False,
                      'runtimePackedRowClipApplied':False,'registeredStageWorldPosition':None},
                    'setupLocalLayers':[],'nativeSpriteDescriptors':[],
                    'sourceMotionInputCandidate':_stage_motion_input_candidate(exe,stage),
                    'sourceBehaviorCallbackCandidate':{
                     'status':'STATIC_CODE_REFERENCES_ONLY',
                     'mode2StageRootObject2':{'tomb':0x171f0,'portal':0x16378}[stage],
                     'callbackObject1':callback_sources['examinedBehaviorCandidates'][stage]['callbackPhysical']-0x61c54,
                     'callbackPhysical':callback_sources['examinedBehaviorCandidates'][stage]['callbackPhysical'],
                     'sourceRegistrationSites':callback_sources['examinedBehaviorCandidates'][stage]['registrations'],
                     'staticCoroutineReportStage':stage,
                     'originalGameAnimationFrames':None,'animationTiming':None,
                     'runtimeActivation':None,'spriteStreamBindings':None,
                     'parallaxTrack':None}}
        family_record,layers=by_family[family]
        # A setup-local composite can clip an original sprite that crosses its
        # rectangle. Preserve EVERY source sprite in native dimensions as well.
        referenced={}
        for su in family_record['setups']:
            for r in su['rows']:
                key=(r['packedResourceOffset'],r['spriteWidth'],r['spriteHeight'])
                referenced.setdefault(key,[]).append({'setupObject2Offset':su['setupObject2Offset'],
                    'controlIndex':r['controlIndex'],'setupLocalX':r['signedX'],'setupLocalY':r['signedY']})
        for (byte_offset,sw,sh),occurrences in sorted(referenced.items()):
            sprite=decode_stream(data,byte_offset,sw,sh)
            indices=sprite['indices'];alpha=bytes(255 if x else 0 for x in sprite['mask'])
            native_rgba=bytearray(sw*sh*4)
            for p,n in enumerate(indices):
                if not sprite['mask'][p]:continue
                req(n in rgb,'native sprite has palette index outside authenticated record')
                native_rgba[4*p:4*p+4]=bytes((*rgb[n],255))
            asset_id=f'{stage}_sprite_{byte_offset:06x}';root=f'{stage}/native_sprites/{asset_id}';native_size=(sw,sh)
            emit(root+'_rgba.png',png_bytes('RGBA',native_size,bytes(native_rgba)),native_size,'RGBA_PNG',asset_id)
            emit(root+'_indices.png',png_bytes('L',native_size,indices),native_size,'INDEX8_PNG',asset_id)
            emit(root+'_opacity.png',png_bytes('L',native_size,alpha),native_size,'ALPHA8_PNG',asset_id)
            stage_item['nativeSpriteDescriptors'].append({'assetId':asset_id,'sourcePackedOffset':byte_offset,
              'sourcePackedEndExclusive':sprite['end'],'dimensions':[sw,sh],
              'sourceIndexSHA256':sha(indices),'opacitySHA256':sha(alpha),'rgbaSHA256':sha(bytes(native_rgba)),
              'opaqueSourcePixels':sprite['opaque'],'transparentSourcePixels':sprite['transparent'],
              'setupLocalOccurrences':occurrences,'unalteredNativeSpriteBounds':True,
              'originalGameAnimationMembershipKnown':False})
        for meta,rendered_png in layers:
            offset=meta['setupObject2Offset'];setup=next(a for a in family_record['setups'] if a['setupObject2Offset']==offset)
            dims=tuple(meta['dimensions']);indices,opacity=_indexed_mosaic(data,setup,rgb)
            req(sha(indices)==meta['indexCanvasSHA256'] and
                sha(bytes(1 if v else 0 for v in opacity))==meta['alphaCanvasSHA256'],
                'independent indexed mosaic reconstruction differs from O122')
            im_rgba=Image.open(io.BytesIO(rendered_png)).convert('RGBA').tobytes()
            req(sha(im_rgba)==meta['rgbaSHA256'],'O122 RGBA source reconstruction mismatch')
            asset_id=f'{stage}_setup_{offset:05x}';root=f'{stage}/setups/{asset_id}'
            emit(root+'_rgba.png',rendered_png,dims,'RGBA_PNG',asset_id)
            emit(root+'_indices.png',png_bytes('L',dims,indices),dims,'INDEX8_PNG',asset_id)
            emit(root+'_opacity.png',png_bytes('L',dims,opacity),dims,'ALPHA8_PNG',asset_id)
            stage_item['setupLocalLayers'].append({'assetId':asset_id,'setupObject2Offset':offset,
                'dimensions':list(dims),'sourceIndexSHA256':sha(indices),'opacitySHA256':sha(opacity),
                'rgbaSHA256':sha(im_rgba),'spriteControls':setup['count'],
                'sourceCoordinateSystem':'SETUP_LOCAL_NOT_SCENE_WORLD',
                'registeredStageWorldPosition':None,'activationDuringFightVerified':False,
                'animationFramesRecovered':False,'parallaxMovementRecovered':False})
        result['stages'].append(stage_item)
    result['files'].sort(key=lambda x:x['path'])
    result['limits']=['SOURCE_NATIVE_WIDTH_NOT_VIEWPORT_EXPORT','NO_16_TO_9_STRETCH',
        'NO_FABRICATED_WORLD_SPACE_OFFSETS','NO_FINAL_STATIC_COMPOSITE','NO_SYNTHETIC_ANIMATION_FRAMES',
        'ALL_NATIVE_SPRITE_SOURCE_EXTENTS_PRESERVED_EVEN_IF_O122_SETUP_COMPOSITE_CLIPPED',
        'NO_RUNTIME_PARALLAX_TIMING','NO_GAMEPLAY_CAMERA_VARIABLE_CLAIM',
        'PACKED_ROW_CLIPPING_REMAINS_RELEVANT_TO_ORIGINAL_RUNTIME_BUT_NOT_SOURCE_EXPORT']
    return result,payloads

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--exe',required=True,type=Path)
    ap.add_argument('--game-zip',required=True,type=Path)
    ap.add_argument('--out',required=True,type=Path,help='New directory; will not overwrite existing output')
    ap.add_argument('--stage',choices=['tomb','portal','both'],default='both')
    a=ap.parse_args();req(not a.out.exists(),'output directory already exists')
    exe=a.exe.read_bytes();game=load_game_files(a.game_zip,set(CANONICAL_GRA_SHA256))
    stages=('tomb','portal') if a.stage=='both' else (a.stage,)
    report,payloads=build_pack(exe,game,stages)
    # Finish all validation before writing any outputs.
    a.out.mkdir(parents=True,exist_ok=False)
    for name,blob in payloads.items():write_new(a.out/name,blob)
    write_new(a.out/'O132_SCENE_LAYERS.json',(json.dumps(report,indent=2)+'\n').encode())
    print(json.dumps({'status':report['status'],'stages':len(report['stages']),
                      'nativeFloorSizes':[s['packedFloor']['nativeDimensions'] for s in report['stages']],
                      'assets':len(report['files']),'motionRecovered':False},indent=2))
if __name__=='__main__':main()
