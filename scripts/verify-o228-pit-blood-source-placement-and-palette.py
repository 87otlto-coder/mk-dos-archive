#!/usr/bin/env python3
"""O228: relocated original Pit II blood177 spawn, DAC-record pointer and scaled coordinates.

Read-only canonical originals; compare exact independent O219 source-video sample positions.
"""
import argparse, hashlib, json, struct, sys, zipfile
from pathlib import Path
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
BH='9a47dd926c27a6570bcd81cbb0a3ff1bae2106a26e0f5360c8018fea6f16a5a9'
VH='198b5ecccb1cca898e4da7ba1282104fac71c2e3bc8a6009638420deb9dede48'
B1=0x61c54; B2=0xa0c54
def sha(data):return hashlib.sha256(data).hexdigest()
def u32(e,p):return struct.unpack_from('<I',e,p)[0]
def check(e,fx):
    def relocated(physical,sourceobj,targetobj,target):
        base=B1 if sourceobj==1 else B2
        f=fx.get((sourceobj,physical-base))
        assert f and f['kind']==7 and f['flags']==16 and f['targetObject']==targetobj and f['targetOffset']==target, (hex(physical),f)
        assert u32(e,physical)==target
    def op(pos,s,name):assert e[pos:pos+len(s)//2]==bytes.fromhex(s),(name,hex(pos))
    def call(pos,target):assert e[pos]==0xe8 and pos+5+struct.unpack_from('<i',e,pos+1)[0]==target,hex(pos)
    relocated(0x8066f,1,2,0x13da0)  # paired smaller special-effects list
    relocated(0x80691,1,2,0x206d4)  # parent sprite for paired effects
    relocated(0x806ca,1,2,0x13d70)  # eleven position list
    relocated(0x806ec,1,2,0x206fc)  # blood177 object initializer
    relocated(0xc1334,2,1,0x26cc4)
    relocated(0xc135c,2,1,0x26cc4)
    assert B1+0x26cc4==0x88918 and struct.unpack_from('<H',e,0x88918)[0]==48
    w,h,x,y,packed=struct.unpack_from('<HHhhI',e,0xc1350)
    assert (w,h,x,y,packed>>24,packed&0xffffff)==(14,9,7,3,9,111552)
    paired=[]
    for index in range(4):
        ptr=B2+0x13da0+index*8
        graphic=u32(e,ptr)
        coord=u32(e,ptr+4)
        assert graphic==(0x206e4 if index%2==0 else 0x206f0)
        relocated(ptr,2,2,graphic)
        paired.append({'sprite_descriptor_object2':hex(graphic),'raw_xy':[coord&0xffff,coord>>16]})
    assert u32(e,B2+0x13dc0)==0
    points=[]
    expected_points=[(160,48),(256,64),(128,80),(144,112),(136,160),(144,192),(240,48),(264,80),(240,112),(264,160),(272,192)]
    for i in range(11):
        v=u32(e,B2+0x13d70+i*4);x=v&65535;y=(v>>16)&65535
        assert (x,y)==expected_points[i], (i,x,y)
        # Original signed arithmetic: v - floor(v/4), equal ceil(3v/4).
        native_x=x-(x//4);native_y=y-(y//4)
        points.append({'source_xy':[x,y],'code_transformed_xy':[native_x,native_y]})
    assert u32(e,B2+0x13d9c)==0
    op(0x80669,'c705745a0700a03d0100','first list initialization')
    op(0x806c4,'c705745a0700703d0100','11-entry placement cursor initialization')
    op(0x806e6,'c7056c5a0700fc060200','blood177 renderer descriptor selection')
    call(0x806f0,0x64548)
    op(0x806f5,'8bd3','copy packed coordinate to EDX')
    call(0x806f7,0x64a19)
    call(0x806fc,0x646b4)
    op(0x806ce,'50','second sequence loop start')
    op(0x806d6,'8305745a070004','increment placement cursor by four')
    op(0x806de,'f7c3ffffffff741d','terminate zero-sentinel at 0x80703')
    op(0x64a19,'508915845a0700c1fa108bc2c1f8022bd06689571e','Y extract, divide by 4, subtract and store')
    op(0x64a2e,'8b15845a0700c1e210c1fa108bc2c1f8022bd06689571a','X extract, divide by 4, subtract and store')
    return {'descriptor_177':{'physical':'0xC1350','resource_id':9,'resource_offset':111552,'size':[14,9], 'source_xy':[7,3], 'original_palette_reference_field':'0xC135C','original_palette_source_physical':'0x88918'},
            'original_paired_sibling_effects':paired,'original_11_blood177_placement_entries':points,
            'original_fatality_loop_blood177_spawn':'0x806E6 -> 0x64548 -> 0x64A19 -> 0x646B4',
            'coordinate_transform':'signed v - floor(v/4), X and Y independently; observed remaining screen offset separately measured',
            'original_palette_48_color_source_pointer':'Object2 0x206FC+12 to Object1 0x26CC4 (physical EXE 0x88918)'}
def main():
    p=argparse.ArgumentParser();p.add_argument('--game-zip',type=Path,required=True);p.add_argument('--project',type=Path,default=Path(__file__).resolve().parents[1]);p.add_argument('--out',type=Path,required=True);a=p.parse_args();assert not a.out.exists()
    with zipfile.ZipFile(a.game_zip) as z: exe=z.read('mk2/mk2.exe');blood=z.read('mk2/blood.gra')
    assert sha(exe)==EH and sha(blood)==BH
    sys.path.insert(0,str(a.project/'tools/mk2_native_stage_palettes'))
    from trace_o120_setup_graph import fixups
    fx=fixups(exe);src=check(exe,fx)
    o219=json.loads((a.project/'research_outputs/O219_BLOOD177_ORIGINAL_PALETTE_CONTROLS.json').read_text())
    assert o219['fixture_sha256']=={'exe':EH,'video':VH,'blood':BH}
    assert o219['original_exe_blood_sprite_descriptor']=='0xC1350'
    samples=o219['compared_source_palette_records'][0]['samples']
    video=[tuple(r['xy']) for r in samples]
    assert len(video)==5 and len(set(video))==5
    calc={tuple(v['code_transformed_xy']) for v in src['original_11_blood177_placement_entries']}
    # Derive translations from one sample, require independent other four all support same translation.
    translations={(video[0][0]-x,video[0][1]-y) for x,y in calc}
    matched=[]
    for dx,dy in sorted(translations):
        members=[list(pt) for pt in video if (pt[0]-dx,pt[1]-dy) in calc]
        if len(members)>=3:matched.append({'translation':[dx,dy],'matched_video_points':members})
    assert matched==[{'translation':[0,-4], 'matched_video_points':[list(pt) for pt in video]}],matched
    negative=[]
    for name,pos in [('sprite177_palette_pointer',0xc135c),('sprite177_identity',0xc1358),('palette_record_count',0x88918),('position_table_pointer',0x806ca),('sprite177_code_pointer',0x806ec),('position_4',B2+0x13d7c),('position_table_terminator',B2+0x13d9c),('coordinate_integer_scale',0x64a25),('spawn_call',0x806f0),('sibling_effect_pointer',B2+0x13da0)]:
        edited=bytearray(exe);edited[pos]^=1
        try:check(edited,fx)
        except AssertionError:negative.append(name)
        else:raise AssertionError('Accepted tamper: '+name)
    assert len(negative)==10
    out={'schema':'o228_original_pit_fatality_blood177_spawner_scaled_coordinates_palette_v1',
        'fixture_sha256':{'exe':EH,'blood':BH,'video_earlier_o219':VH},'original_source':src,
        'o219_independent_video_blob_positions':[list(pt) for pt in video],
        'unique_translation_matching_all_five':matched[0],
        'candidate_translation_overlapping_three_or_more':matched,
        'original_relocation_count':len(fx),'mutation_controls_rejected':negative,
        'boundary':'Direct source relocation and code path to BLOOD.GRA sprite177, source 48-color palette, eleven placements, and X+Y*3/4 transform VERIFIED. Video positions independently corroborate all five with a common (0,-4) shift. Origin of final -4, active runtime compositor/DAC, and other effect timing NOT proven.'}
    a.out.mkdir(parents=True);fp=a.out/'O228_PIT_BLOOD177_SPAWNER_PALETTE_AND_PLACEMENT.json';fp.write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps({'report':str(fp),'sha256':sha(fp.read_bytes()),'five_video_matches':len(matched[0]['matched_video_points']), 'translation':matched[0]['translation'],'negative_controls_rejected':len(negative)},indent=2))
if __name__=='__main__':main()
