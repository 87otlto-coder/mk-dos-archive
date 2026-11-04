#!/usr/bin/env python3
"""Independent O132 archive verifier; does not import O132/O122 exporter code.

Reopens the original game ZIP and original EXE, validates every exported PNG,
checks uncut 896-column packed source indices/color words pixel by pixel, and
crosschecks the independently audited O122 setup RGBA/index/mask witnesses.
"""
from __future__ import annotations
import argparse,hashlib,io,json,struct,zipfile
from pathlib import Path
from PIL import Image
from verify_o135_stage_effect_coroutines_independent import audit as audit_o135
CANON_EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
RES={'tomb':('TOMB.GRA',63776,48,0x893c6,'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613'),
     'portal':('PORTAL.GRA',56916,40,0x891e0,'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82')}
def h(b):return hashlib.sha256(b).hexdigest()
def check(cond,msg):
    if not cond:raise AssertionError('O132 independent: '+msg)
def load_member(z,name):
    choices=[p for p in z.namelist() if p.rsplit('/',1)[-1].upper()==name]
    check(len(choices)==1,name+' missing/duplicate');return z.read(choices[0])
def decoded_original_sprite(raw:bytes,offset:int,width:int,height:int):
    # Independent interpretation of O68's original indexed RLE/skip/literal words.
    idx=bytearray(width*height);mask=bytearray(width*height);at=offset
    for y in range(height):
        x=0
        while x<width:
            check(at+4<=len(raw),'native command outside original GRA')
            op=int.from_bytes(raw[at:at+4],'little');at+=4
            if op&1:n=op>>1
            elif op&2:
                n=op>>10;val=(op>>2)&255
                check(n>0 and n<=width-x,'native RLE crosses sprite row')
                for t in range(n):idx[y*width+x+t]=val;mask[y*width+x+t]=255
            else:
                n=op>>2;check(0<n<=64 and at+n<=len(raw),'invalid original native literal')
                for t in range(n):idx[y*width+x+t]=raw[at+t];mask[y*width+x+t]=255
                at+=(n+3)//4*4
            check(0<n<=width-x,'native sprite row overrun');x+=n
    return bytes(idx),bytes(mask),at

def audit(exe:bytes,gamezip:Path,folder:Path,o122_report:Path,o121_report:Path):
    check(h(exe)==CANON_EXE,'wrong EXE')
    data=json.loads((folder/'O132_SCENE_LAYERS.json').read_text())
    check(data['schema']=='mk2_o132_native_source_layer_pack_v1','wrong format')
    check(data['sourceExecutableSHA256']==CANON_EXE,'wrong EXE manifest')
    audit_o135(exe,data['sourceEffectCoroutineEvidence'])
    check(data['wideCompositionReference']['assetPixelsNeverResampled'] is True,'stretch claim')
    check(data['compositing']['finalDrawOrderRecovered'] is False,'fabricated compositor')
    for fld in ('parallaxMotionRulesRecovered','animationFrameOrderingRecovered','animationDurationsRecovered'):
        check(data['motion'][fld] is False,'fabricated motion result '+fld)
    entries=data['files'];check(len(entries)==len(set(e['path'] for e in entries)),'duplicate exported path')
    check({str(p.relative_to(folder)) for p in folder.rglob('*') if p.is_file()}==
          {e['path'] for e in entries}|{'O132_SCENE_LAYERS.json'},'unrecorded/missing asset')
    source_report=json.loads(o122_report.read_text());o121=json.loads(o121_report.read_text());samples=0;setup_layers=0;native_sprites=0
    with zipfile.ZipFile(gamezip) as z:
        for item in data['stages']:
            stage=item['stage'];check(stage in RES,'unexpected stage')
            if 'sourceMotionInputCandidate' in item:
                cand=item['sourceMotionInputCandidate']
                root={'tomb':0x171f0,'portal':0x16378}[stage]
                source=struct.unpack_from('<I',exe,0xa0c54+root+0x14)[0]
                check(source=={'tomb':0x172dc,'portal':0x1641c}[stage], 'motion source pointer mismatch')
                original=list(struct.unpack_from('<9i',exe,0xa0c54+source))
                check(cand['status']=='STATIC_SOURCE_WORDS_ONLY' and cand['rootObject2']==root and
                      cand['sourceTableObject2']==source and cand['originalSourceWords']==original and
                      cand['numberFormat']=='SIGNED_16_16', 'native motion source input tampered')
                for unknown in ('animationFrameOrder','animationDurationFrames','livePositionChannelValues',
                                'parallaxMultiplier','activeTransform','experimentalWidescreenTransform'):
                    check(cand[unknown] is None,'fabricated motion property '+unknown)
            if 'sourceBehaviorCallbackCandidate' in item:
                cand=item['sourceBehaviorCallbackCandidate']
                check(cand['staticCoroutineReportStage']==stage, 'O135 stage effect report ref falsified')
                stage_root={'tomb':0x171f0,'portal':0x16378}[stage]
                callback=struct.unpack_from('<I',exe,0xa0c54+stage_root+16)[0]
                check(cand['status']=='STATIC_CODE_REFERENCES_ONLY' and
                      cand['mode2StageRootObject2']==stage_root and
                      cand['callbackObject1']==callback and cand['callbackPhysical']==0x61c54+callback,
                      'scene initializer callback pointer falsified')
                sites={'tomb':(0x82ce7,0x82cfa),'portal':(0x82793,0x827bf,0x827d2,0x827e6)}[stage]
                check(len(cand['sourceRegistrationSites'])==len(sites),'callback registration count')
                for site,rec in zip(sites,cand['sourceRegistrationSites']):
                    target=struct.unpack_from('<I',exe,site+1)[0]
                    disp=struct.unpack_from('<i',exe,site+6)[0]
                    check(exe[site-5:site+1]==bytes.fromhex('bb06000000ba') and
                          exe[site+5]==0xe8 and site+10+disp==0x67222,
                          'callback registration opcode no longer matches')
                    check(rec['moveFunctionPointerPhysical']==site and
                          rec['registrationCallPhysical']==site+5 and
                          rec['registerRoutinePhysical']==0x67222 and
                          rec['argumentEBX']==6 and
                          rec['registeredFunctionObject1']==target and
                          rec['registeredFunctionPhysical']==0x61c54+target and
                          rec['scope']==('nested_helper' if site==0x827e6 else 'init_callback'),
                          'callback function pointer metadata changed')
                for field in ('originalGameAnimationFrames','animationTiming','runtimeActivation',
                              'spriteStreamBindings','parallaxTrack'):
                    check(cand[field] is None,'unproved effect animation property '+field)
            filename,start,rows,record,expected=RES[stage];gra=load_member(z,filename)
            check(h(gra)==expected and h(gra)==item['resourceSHA256'],'wrong source GRA')
            source=gra[start:];check(len(source)==896*rows,'original full floor geometry differs')
            rgb=[]
            check(struct.unpack_from('<H',exe,record)[0]==80,'original counted palette changed')
            for i in range(80):
                w=struct.unpack_from('<H',exe,record+2+i*2)[0]
                c=[((w>>9)&63)|1,((w>>4)&63)|1,((w<<1)&63)|1]
                rgb.append(tuple((x<<2)|(x>>4) for x in c))
            expected_rgba=bytearray()
            for n in source:
                check(1<=n<=80,'source index outside source EXE palette')
                expected_rgba.extend((*rgb[n-1],255))
            floor=item['packedFloor'];check(floor['nativeDimensions']==[896,rows],'floor falsely cropped')
            check(floor['sourceIndexSHA256']==h(source) and floor['rgbaSHA256']==h(expected_rgba),'floor manifest hash wrong')
            check(floor['cameraCropApplied'] is False and floor['runtimePackedRowClipApplied'] is False,'screen clipping incorrectly applied')
            def pixels(path,mode,size):
                raw=(folder/path).read_bytes()
                with Image.open(io.BytesIO(raw)) as img:
                    check(img.size==size and img.mode==mode,'PNG geometry or mode incorrect: '+path)
                    return img.tobytes()
            prefix=f'{stage}/floor'
            check(pixels(prefix+'_indices.png','L',(896,rows))==source,'full floor original indices not exact')
            check(pixels(prefix+'_rgba.png','RGBA',(896,rows))==expected_rgba,'full floor color pixels differ')
            samples+=896*rows
            family=next(f for f in o121['families'] if f['familyLabel']==stage+'80')
            source_sprites={}
            for setup in family['setups']:
                for rr in setup['rows']:
                    key=(rr['packedResourceOffset'],rr['spriteWidth'],rr['spriteHeight'])
                    source_sprites.setdefault(key,[]).append({'setupObject2Offset':setup['setupObject2Offset'],
                        'controlIndex':rr['controlIndex'],'setupLocalX':rr['signedX'],'setupLocalY':rr['signedY']})
            seen=set()
            for spr in item['nativeSpriteDescriptors']:
                off=spr['sourcePackedOffset'];w,hgt=spr['dimensions'];key=(off,w,hgt)
                check(key in source_sprites and key not in seen,'missing or duplicated authenticated native sprite');seen.add(key)
                check(spr['setupLocalOccurrences']==source_sprites[key],'source sprite placement metadata incorrect')
                idx,opacity,end=decoded_original_sprite(gra,off,w,hgt)
                check(spr['sourcePackedEndExclusive']==end,'native sprite compressed bounds corrupted')
                native_rgba=bytearray()
                for byte,value in enumerate(idx):
                    if opacity[byte]:
                        check(1<=value<=80,'native source sprite index out of palette');native_rgba.extend((*rgb[value-1],255))
                    else:native_rgba.extend((0,0,0,0))
                check(spr['sourceIndexSHA256']==h(idx) and spr['opacitySHA256']==h(opacity) and
                      spr['rgbaSHA256']==h(native_rgba),'native sprite data digest forged')
                root=f"{stage}/native_sprites/{spr['assetId']}";dims=(w,hgt)
                check(pixels(root+'_indices.png','L',dims)==idx,'native sprite raw indices are clipped/changed')
                check(pixels(root+'_opacity.png','L',dims)==opacity,'native sprite opacity differs')
                check(pixels(root+'_rgba.png','RGBA',dims)==native_rgba,'native sprite RGBA differs')
                check(spr['unalteredNativeSpriteBounds'] is True and
                      spr['originalGameAnimationMembershipKnown'] is False,'fabricated sprite animation claim')
                samples+=len(idx);native_sprites+=1
            check(seen==set(source_sprites),'a native sprite is missing from the pack')
            for layer in item['setupLocalLayers']:
                offset=layer['setupObject2Offset'];asset=layer['assetId'];dims=tuple(layer['dimensions'])
                match=next((m for m in source_report['mosaics'] if m['family']==stage+'80' and m['setupObject2Offset']==offset),None)
                check(match is not None,'unauthenticated setup layer');check(tuple(match['dimensions'])==dims,'wrong mosaic dimensions')
                root=f'{stage}/setups/{asset}'
                idx=pixels(root+'_indices.png','L',dims)
                mask=pixels(root+'_opacity.png','L',dims)
                rgba=pixels(root+'_rgba.png','RGBA',dims)
                check(h(idx)==match['indexCanvasSHA256']==layer['sourceIndexSHA256'],'mosaic indices do not match independently archived O122')
                check(h(bytes(1 if x else 0 for x in mask))==match['alphaCanvasSHA256'],'mosaic source opacity wrong')
                check(h(mask)==layer['opacitySHA256'],'mosaic manifest opacity altered')
                check(h(rgba)==match['rgbaSHA256']==layer['rgbaSHA256'],'mosaic RGBA differs from O122')
                check(all(v in (0,255) for v in mask),'invalid mask encoding')
                check(all(rgba[4*i+3]==v for i,v in enumerate(mask)),'RGBA alpha and source mask differ')
                check(layer['registeredStageWorldPosition'] is None and layer['animationFramesRecovered'] is False and
                      layer['parallaxMovementRecovered'] is False,'unsupported layer runtime claim')
                samples+=len(mask);setup_layers+=1
    for ent in entries:
        raw=(folder/ent['path']).read_bytes()
        check(h(raw)==ent['sha256'] and len(raw)==ent['bytes'],'file checksum differs from manifest')
    check(set(s['stage'] for s in data['stages'])<=set(RES),'wrong stage names')
    return {'status':'PASS_O132_INDEPENDENT','nativeFloorIndicesChecked':sum(896*RES[s['stage']][2] for s in data['stages']),
            'sourcePixelsOrSetupMasksChecked':samples,'setupLayersChecked':setup_layers,'unclippedSourceSpritesChecked':native_sprites,
            'assetsChecked':len(entries),'animationInference':False,'parallaxInference':False}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--exe',required=True,type=Path);p.add_argument('--game-zip',required=True,type=Path)
    p.add_argument('--bundle',required=True,type=Path);p.add_argument('--o122-report',required=True,type=Path);p.add_argument('--o121-report',required=True,type=Path)
    a=p.parse_args();print(json.dumps(audit(a.exe.read_bytes(),a.game_zip,a.bundle,a.o122_report,a.o121_report),indent=2))
