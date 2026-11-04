#!/usr/bin/env python3
"""O229: original Pit II blood177 11-position mask test; ten visible at three independent capture times.

Does not assert whether the WINS-text-covered eleventh sprite existed underneath.
"""
import argparse,hashlib,json,struct,zipfile
from pathlib import Path
import cv2,numpy as np
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
BH='9a47dd926c27a6570bcd81cbb0a3ff1bae2106a26e0f5360c8018fea6f16a5a9'
VH='198b5ecccb1cca898e4da7ba1282104fac71c2e3bc8a6009638420deb9dede48'
def sha(b):return hashlib.sha256(b).hexdigest()
def sprite(b,offset,w,h):
    ix=np.zeros((h,w),np.uint8);mask=np.zeros((h,w),bool);at=offset
    for r in range(h):
        x=0
        while x<w:
            command=struct.unpack_from('<I',b,at)[0];at+=4
            if command&1: count=command>>1
            elif command&2:count=command>>10;ix[r,x:x+count]=(command>>2)&255;mask[r,x:x+count]=True
            else:
                count=command>>2;ix[r,x:x+count]=np.frombuffer(b,dtype=np.uint8,count=count,offset=at);mask[r,x:x+count]=True;at+=(count+3)&~3
            assert 0<count<=w-x
            x+=count
    assert at==len(b) and int(mask.sum())==73
    return ix,mask
def colors(e,phys,count):
    assert struct.unpack_from('<H',e,phys)[0]==count
    rgb=np.zeros((count+1,3),np.uint8)
    for i in range(1,count+1):
        v=struct.unpack_from('<H',e,phys+2*i)[0]
        parts=[((v>>9)&63)|1,((v>>4)&63)|1,((v<<1)&63)|1]
        rgb[i]=[(p<<2)|(p>>4) for p in parts]
    return rgb
def calc_placement(raw_x,raw_y,dx=0,dy=-4):return (raw_x-raw_x//4+dx,raw_y-raw_y//4+dy)
def match_frame(native,idx,mask,palette,points,shift):
    tiled=palette[idx]
    scores=[]
    for index,raw in enumerate(points):
        x,y=calc_placement(*raw,dx=shift[0],dy=shift[1]);h,w=idx.shape
        clip=native[y:y+h,x:x+w]
        assert clip.shape==tiled.shape
        mae=float(np.abs(clip[mask].astype(np.int16)-tiled[mask].astype(np.int16)).mean())
        scores.append({'list_index':index,'source_xy':list(raw),'screen_xy':[x,y],'source_rgb_mae255':round(mae,5),'visible_rgb_match_under_16':mae<16})
    return scores
def main():
    p=argparse.ArgumentParser();p.add_argument('--game-zip',type=Path,required=True);p.add_argument('--video',type=Path,required=True);p.add_argument('--project',type=Path,default=Path(__file__).resolve().parents[1]);p.add_argument('--out',type=Path,required=True);a=p.parse_args();assert not a.out.exists()
    with zipfile.ZipFile(a.game_zip) as z:exe=z.read('mk2/mk2.exe');blood=z.read('mk2/blood.gra')
    assert sha(exe)==EH and sha(blood)==BH and sha(a.video.read_bytes())==VH
    prior=json.loads((a.project/'research_outputs/O228_PIT_BLOOD177_SPAWNER_PALETTE_AND_PLACEMENT.json').read_text());assert prior['fixture_sha256']['exe']==EH
    src=prior['original_source']['original_11_blood177_placement_entries'];points=[tuple(r['source_xy']) for r in src]
    assert len(points)==11
    w,h,x,y,packed=struct.unpack_from('<HHhhI',exe,0xc1350)
    assert (w,h,packed>>24,packed&0xffffff)==(14,9,9,111552)
    idx,mask=sprite(blood,packed&0xffffff,w,h);pal=colors(exe,0x88918,48)
    reader=cv2.VideoCapture(str(a.video));assert reader.isOpened() and reader.get(cv2.CAP_PROP_FPS)==30
    sampled=[]
    for frame in [895,903,930]:
        reader.set(cv2.CAP_PROP_POS_FRAMES,frame);ok,f=reader.read();assert ok and f.shape[:2]==(430,660)
        native=cv2.cvtColor(cv2.resize(f[25:425,10:650],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB)
        selected=match_frame(native,idx,mask,pal,points,(0,-4))
        matched=[r['list_index'] for r in selected if r['visible_rgb_match_under_16']]
        assert matched==[0,2,3,4,5,6,7,8,9,10],(frame,matched)
        assert selected[1]['source_rgb_mae255']>100
        sampled.append({'captured_frame':frame,'source_color_scores':selected,'visible_original_sprite_matches':len(matched),'occluded_location_under_winner_lettering':selected[1]['screen_xy']})
    reader.set(cv2.CAP_PROP_POS_FRAMES,930);ok,f=reader.read();assert ok
    native=cv2.cvtColor(cv2.resize(f[25:425,10:650],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB)
    controls=[]
    for dx,dy in [(0,-4),(0,0),(-3,-4),(3,-4),(0,-1),(0,-7)]:
        test=match_frame(native,idx,mask,pal,points,(dx,dy))
        visible=[r['source_rgb_mae255'] for r in test if r['list_index']!=1]
        low=sum(r['visible_rgb_match_under_16'] for r in test)
        controls.append({'additional_shift':[dx,dy],'visible_under_16':low,'mean_mae_excluding_occluded_slot':round(float(np.mean(visible)),5)})
    assert [c['visible_under_16'] for c in controls]==[10,0,0,0,0,0]
    report={'schema':'o229_pit_blood177_source_all_positions_native_video_controls_v1','original_hashes':{'exe':EH,'blood':BH,'video':VH},'native_crop':{'x':10,'y':25,'width':640,'height':400,'native':[320,200]},'sprite_size':[w,h],'sprite_opaque_pixels':int(mask.sum()),'original_palette_offset':'0x88918','source_11_positions_original_exe':src,'sampled_frames':sampled,'control_offsets':controls,'limits':'Eleventh original sprite is not a positive RGB match in these frames; video inspection shows WINS lettering in this ROI. This does not independently prove that sprite lies beneath the lettering, nor does it prove original code palette DAC installation or object draw order.'}
    a.out.mkdir(parents=True);fp=a.out/'O229_PIT_BLOOD177_ALL_POSITIONS_VIDEO_TEST.json';fp.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'report':str(fp),'sha256':sha(fp.read_bytes()),'frames':[r['captured_frame'] for r in sampled],'matching_source_positions_per_frame':[r['visible_original_sprite_matches'] for r in sampled],'shift_controls':[c['visible_under_16'] for c in controls]},indent=2))
if __name__=='__main__':main()
