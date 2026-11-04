#!/usr/bin/env python3
"""O205. Source-backed correction of O203 stage identity.

Captures recorded gameplay as the Kombat Tomb (TOMB.GRA), while preserving
The Pit's distinct PIT.GRA resource. Read-only. Requires numpy/Pillow/OpenCV.
No assumption of complete scene composition, live palette selection, or
motion/parallax is implied by the source-local setup previews.
"""
from __future__ import annotations
import argparse, hashlib, json, struct
from pathlib import Path
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

EXPECTED = {
    'exe': 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',
    'tomb': 'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
    'pit': 'af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96',
    'video': '5295afece147c8de1978ab67db6aaa1cd0beb1db4a32b369dfd0ff289de16c44',
}
STAGES = {
    'tomb': {'name':'Kombat Tomb','resource_id':28,'setups':[0x17358,0x1736a,0x1737c,0x1738e,0x173a0,0x173b2], 'palette_phys':0x893c6},
    'pit': {'name':'The Pit','resource_id':32,'setups':[0x18b44,0x18b56,0x18b68,0x18b7a,0x18b8c,0x18b9e], 'palette_pointer_field':0x18d40},
}
OBJ1=0x61c54; OBJ2=0xa0c54

def sha(b):return hashlib.sha256(b).hexdigest()
def u16(b,p):return struct.unpack_from('<H',b,p)[0]
def u32(b,p):return struct.unpack_from('<I',b,p)[0]
def s16(x):return x-65536 if x&0x8000 else x

def palette(exe,stage):
    palphys=stage.get('palette_phys', OBJ1+u32(exe,OBJ2+stage['palette_pointer_field']) if 'palette_pointer_field' in stage else -1)
    n=u16(exe,palphys)
    assert n in (80,81),(stage['name'],'unexpected palette size',n)
    out=[(0,0,0,0)]
    for i in range(n):
        word=u16(exe,palphys+2+2*i)
        dac=[((word>>9)&63)|1,((word>>4)&63)|1,((word<<1)&63)|1]
        out.append(tuple((v<<2)|(v>>4) for v in dac)+(255,))
    return out,palphys,n

def render_stage(exe,gra,stage,output):
    colors,pp,pc=palette(exe,stage)
    output.mkdir(parents=True,exist_ok=True)
    cache={};all_layers=[];reports=[]
    for idx,offset in enumerate(stage['setups'],1):
        w,h,n=u16(exe,OBJ2+offset),u16(exe,OBJ2+offset+2),u16(exe,OBJ2+offset+4)
        ctl=u32(exe,OBJ2+offset+6);desc=u32(exe,OBJ2+offset+10)
        assert 0<w<=2000 and 0<h<=900 and 0<n<128, (w,h,n)
        out=bytearray(w*h*4);opaque=bytearray(w*h);clipped=0;painted=0;rows=[]
        for j in range(n):
            flags,x,y,p=struct.unpack_from('<HHHH',exe,OBJ2+ctl+8*j);x=s16(x);y=s16(y)
            palette_slot=(flags&15)|((p&0xf000)>>8)
            assert palette_slot==2,(stage['name'],idx,j,palette_slot)
            at=desc+(p&0xfff)*4;dw,dh=u16(exe,OBJ2+at),u16(exe,OBJ2+at+2)
            packed=u32(exe,OBJ2+at+4);rid=packed>>24;start=packed&0xffffff
            assert rid==stage['resource_id'],(rid,stage['resource_id'])
            key=(start,dw,dh)
            if key not in cache:
                assert 0<dw<=896 and 0<dh<=800 and dw*dh<=250000
                pix=bytearray(dw*dh);mask=bytearray(dw*dh);cur=start;count=0
                for yy in range(dh):
                    xx=0
                    while xx<dw:
                        assert cur+4<=len(gra)
                        cmd=u32(gra,cur);cur+=4
                        mode='skip' if cmd&1 else 'rle' if cmd&2 else 'literal'
                        amount=cmd>>1 if mode=='skip' else cmd>>10 if mode=='rle' else cmd>>2
                        assert 0<amount<=dw-xx,(stage['name'],idx,j,yy,xx,cmd)
                        startpix=yy*dw+xx
                        if mode=='rle':
                            pix[startpix:startpix+amount]=bytes([(cmd>>2)&255])*amount
                            mask[startpix:startpix+amount]=b'\1'*amount
                        elif mode=='literal':
                            assert cur+amount<=len(gra)
                            pix[startpix:startpix+amount]=gra[cur:cur+amount]
                            mask[startpix:startpix+amount]=b'\1'*amount
                            cur+=(amount+3)&~3
                        xx+=amount;count+=1
                cache[key]=(pix,mask,cur,count)
            pix,mask,finish,commands=cache[key]
            for q,i in enumerate(pix):
                if not mask[q]:continue
                xx=x+q%dw;yy=y+q//dw
                if 0<=xx<w and 0<=yy<h:
                    assert i<len(colors),(stage['name'],i,len(colors))
                    out[(yy*w+xx)*4:(yy*w+xx)*4+4]=bytes(colors[i]);opaque[yy*w+xx]=1;painted+=1
                else:clipped+=1
            rows.append({'control_ordinal':j,'x':x,'y':y,'sprite_descriptor_object2':at,'source_gra_offset':start,'width':dw,'height':dh,'decoded_commands':commands})
        im=Image.frombytes('RGBA',(w,h),bytes(out))
        name=f'{stage["name"].lower().replace(" ","_")}_source_setup_{idx}.png'
        im.save(output/name)
        all_layers.append(im)
        reports.append({'source_setup_index':idx,'object2_offset':offset,'setup_file_physical':OBJ2+offset,'source_canvas':[w,h],'original_control_count':n,'control_array_object2':ctl,'descriptor_table_object2':desc,'painted_writes':painted,'opaque_pixels':sum(opaque),'clipped_writes':clipped,'rgba_sha256':sha(bytes(out)),'preview':name,'placements':rows})
    return all_layers,{'stage':stage['name'],'resource_id':stage['resource_id'],'palette_physical':pp,'palette_count':pc,'source_local_setups':reports}

def frame(video,second):
    cap=cv2.VideoCapture(str(video))
    assert cap.isOpened()
    cap.set(cv2.CAP_PROP_POS_MSEC,second*1000)
    ok,fr=cap.read();cap.release()
    assert ok and fr.shape[:2]==(432,644),(fr.shape if ok else None)
    return cv2.resize(fr[32:432,2:642],(320,200),interpolation=cv2.INTER_AREA)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for x in EXPECTED:parser.add_argument('--'+x,required=True,type=Path)
    parser.add_argument('--out',required=True,type=Path)
    args=parser.parse_args();out=args.out;out.mkdir(parents=True,exist_ok=True)
    data={x:getattr(args,x).read_bytes() for x in ('exe','tomb','pit')}
    hashes={x:sha(data[x] if x!='video' else args.video.read_bytes()) for x in EXPECTED}
    for key,expected in EXPECTED.items():
        assert hashes[key]==expected, (key,'canonical fixture mismatch',hashes[key],expected)
    results={};images={}
    for label,spec in STAGES.items():
        images[label],results[label]=render_stage(data['exe'],data[label],spec,out/'original_source_layers'/label)
    v=frame(args.video,3.5)
    # Fixed native-size patch chosen from a distinct original skull, avoiding fighters.
    x,y,w,h=136,85,35,30
    s=np.array(images['tomb'][2])[y:y+h,x:x+w,:3][:,:,::-1]
    m=np.array(images['tomb'][2])[y:y+h,x:x+w,3]
    fit=cv2.matchTemplate(v[10:105],s,cv2.TM_SQDIFF_NORMED,mask=m)
    # The upper-stage y bound avoids matching the same skull motif on the floor.
    y0,x0=np.unravel_index(np.argmin(fit[:70]),fit[:70].shape);y0+=10
    target=v[y0:y0+h,x0:x0+w]
    raw_mae=float(np.abs(s.astype(np.int16)-target.astype(np.int16))[m>0].mean())
    assert x0==130 and y0==27,('unexpected source-video alignment',x0,y0)
    assert raw_mae<22,('source patch did not match recording',raw_mae)
    samples=[]
    for second in [0.5,3.5,7,12,18,24,30,35]:
        fb=frame(args.video,second)
        scores=cv2.matchTemplate(fb[10:105],s,cv2.TM_SQDIFF_NORMED,mask=m)[:70,:]
        yy,xx=np.unravel_index(np.argmin(scores),scores.shape); yy+=10
        patch=fb[yy:yy+h,xx:xx+w]
        mae=float(np.abs(s.astype(np.int16)-patch.astype(np.int16))[m>0].mean())
        samples.append({'time_seconds':second, 'matched_screen_origin_xy':[int(xx),int(yy)],
            'candidate_offset_from_source_xy':[int(xx-x),int(yy-y)],
            'normalized_sq_error':round(float(scores[yy-10,xx]),6),
            'opaque_pixel_rgb_mae_255':round(mae,6),
            'classification':'matched source detail; horizontal camera offset may be aliased by repeating pillars'})
    (out/'O205_source_feature_matches.json').write_text(json.dumps(samples,indent=2)+'\n')
    # Compose transparent source layer at explicitly measured *local* offset.
    im=Image.new('RGBA',(320,200),(29,31,36,255))
    im.alpha_composite(images['tomb'][2],(-6,-58))
    source_local_scene=out/'recorded_tomb_setup3_source_local_alignment.png'
    im.convert('RGB').save(source_local_scene)
    src_patch=Image.fromarray(cv2.cvtColor(s,cv2.COLOR_BGR2RGB))
    video_patch=Image.fromarray(cv2.cvtColor(target,cv2.COLOR_BGR2RGB))
    wpx=480;W=1530;H=735
    canvas=Image.new('RGB',(W,H),(19,24,31));d=ImageDraw.Draw(canvas)
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
    bold=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',23)
    small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
    d.text((30,24),'O205 | CORRECTED STAGE IDENTIFICATION',fill=(245,245,250),font=bold)
    d.text((30,62),'Recording matches TOMB.GRA / Kombat Tomb, not PIT.GRA / The Pit.',fill=(174,196,218),font=font)
    for i,(name,source) in enumerate([
        ('Recorded DOSBox game, 3.5s',Image.fromarray(cv2.cvtColor(v,cv2.COLOR_BGR2RGB)).convert('RGBA')),
        ('TOMB.GRA, source setup 3',images['tomb'][2].crop((105,0,425,214))),
        ('PIT.GRA, source setup 2',images['pit'][1].crop((160,0,480,214))),
    ]):
        panel_x=30+i*500;d.text((panel_x,119),name,fill=(235,240,250),font=small)
        bg=Image.new('RGBA',(480,320),(32,35,40,255))
        bg.alpha_composite(source.resize((480,300 if i==0 else 321),Image.Resampling.NEAREST))
        canvas.paste(bg.convert('RGB'),(panel_x,148));d.rectangle((panel_x-1,147,panel_x+480,469),outline=(72,86,102),width=2)
    d.text((30,505),'Native-pixel source-to-recording match: the same skull motif',fill=(239,242,249),font=font)
    canvas.paste(video_patch.resize((175,150),Image.Resampling.NEAREST),(30,545))
    canvas.paste(src_patch.resize((175,150),Image.Resampling.NEAREST),(255,545))
    d.text((468,563),'Left: gameplay. Right: original TOMB.GRA.',fill=(186,205,226),font=small)
    d.text((468,595),f'Exact native patch: ({x},{y},{w},{h}) matched at ({x0},{y0})',fill=(186,205,226),font=small)
    d.text((468,630),f'Average absolute RGB difference: {raw_mae:.2f} / 255',fill=(251,218,154),font=small)
    canvas.save(out/'stage_identity_comparison.png')
    summary={
        'schema':'o205_corrected_stage_identity_source_video_v1',
        'original_fixture_sha256':hashes,
        'correction':{
            'previous_recording_label':'The Pit II (O203 intake)',
            'confirmed_original_source_stage':'Kombat Tomb',
            'recording':'Recording 2026-10-15 215828.mp4',
            'matching_resource':'TOMB.GRA',
            'different_stage_resource':'PIT.GRA',
            'distinct_original_stage_resource_ids':{'Kombat Tomb':28,'The Pit':32},
            'previous_o203_raw_video_feature_matches_still_valid':True,
            'previous_o203_pit_source_mapping_superseded':True,
        },
        'native_pixel_witness':{'time_seconds':3.5,'original_tomb_setup':3,'source_patch_xywh':[136,85,35,30],
            'game_patch_xywh':[int(x0),int(y0),35,30], 'opaque_pixels':int((m>0).sum()),
            'rgb_abs_error_mean_255':round(raw_mae,6),'match_translation_xy':[int(x0-x),int(y0-y)],
            'match_source_role':'graphic identity and local placement witness; NOT a complete camera or stage scene model'},
        'source_graph':results,
        'sampled_source_feature_matches':samples,
        'limitations':['TOMB and PIT source previews use original candidate stage-linked palette records, not a logged hardware palette during gameplay.',
             'The game video is compressed; matched pixel differences are expected.',
             'Source-local setups do not imply full original runtime layer stacking or movement.',
             'The 0.5–35s O203 video motion data is valid observation but pertains to Kombat Tomb rather than The Pit.',
             'A separate authentic The Pit gameplay recording is still required for a source-to-runtime Pit validation.'],
        'historical_handoff':['O203 remains unmodified; this checkpoint explicitly supersedes only its stage identification.',
                              'O204 Portal frame matches are unaffected.']
    }
    (out/'O205_corrected_stage_identity.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps({'stage':'Kombat Tomb','tomb_source_layers':len(images['tomb']),'pit_source_layers':len(images['pit']),
         'matched_video_pixel_origin':(int(x0),int(y0)),'pixel_mae':round(raw_mae,3),'output':str(out)},indent=2))

if __name__=='__main__':main()
