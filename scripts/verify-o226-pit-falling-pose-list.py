#!/usr/bin/env python3
"""O226: source-typed original Pit fatality pose-loop and separate impact graphic47.
Read-only canonical source and prior independently verified video pose records.
"""
import argparse,hashlib,json,struct,sys,zipfile
from pathlib import Path
BASE=0xa0c54
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
FH='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
VH='198b5ecccb1cca898e4da7ba1282104fac71c2e3bc8a6009638420deb9dede48'
def sha(x):return hashlib.sha256(x).hexdigest()
def u32(e,p):return struct.unpack_from('<I',e,p)[0]
def verify(e,fx):
    def typed(src,target):
        f=fx.get((2,src));assert f and f['kind']==7 and f['flags']==16 and f['targetObject']==2 and f['targetOffset']==target,(hex(src),f)
        assert u32(e,BASE+src)==target
    sprites=[]
    for ix,i in enumerate(range(42,47)):
        obj2=0x14084+8*ix
        expected_physical=0xc39b8+12*i
        assert expected_physical==BASE+0x22f5c+12*ix
        descriptor=0x22f5c+12*ix
        typed(0x1405c+4*ix,obj2)
        typed(obj2,descriptor)  # Every 8-byte list unit points to canonical descriptor
        assert u32(e,BASE+obj2+4)==0,('descriptor list unit second word',i)
        w,h,x,y,packed=struct.unpack_from('<HHhhI',e,expected_physical)
        assert packed>>24==123 and 20<=w<=120 and 20<=h<=120
        sprites.append({'sprite':i,'original_descriptor_physical':hex(expected_physical),'source_descriptor_object2':hex(descriptor),'list_pointer_object2':hex(0x1405c+4*ix)})
    assert u32(e,BASE+0x14070)==1,'Original animation-list loop marker'
    typed(0x14074,0x1405c)
    for slot in (0x13de4,0x13de8,0x13dec):typed(slot,0x1405c)
    assert u32(e,BASE+0x14078)==0 and u32(e,BASE+0x14080)==0
    typed(0x1407c,0x140ac)
    typed(0x140ac,0x22f98)
    assert u32(e,BASE+0x140b0)==0
    w,h,x,y,word=struct.unpack_from('<HHhhI',e,BASE+0x22f98)
    assert word>>24==123
    return {'looping_original_falling_graphics':[x['sprite'] for x in sprites],
            'descriptor_chain':sprites,'original_loop_list_object2':'0x1405C',
            'five_descriptor_relocs':True,'original_loop_marker_object2':'0x14070',
            'relocated_loop_backpointer_object2':'0x14074','loop_backpointer_target':'0x1405C',
            'three_source_data_references_to_same_loop':['0x13DE4','0x13DE8','0x13DEC'],
            'separate_source_pose47_descriptor_physical':hex(BASE+0x22f98),
            'separate_pose47_single_reference_object2':'0x1407C',
            'qualification':'Source-typed loop list and separate pose47 identity only. Consumer path, actual loop advancement, screen pose capture schedule and impact trigger not established.'}
def main():
    p=argparse.ArgumentParser();p.add_argument('--game-zip',type=Path,required=True);p.add_argument('--project',type=Path,default=Path(__file__).resolve().parents[1]);p.add_argument('--o215-report',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
    assert not a.out.exists(),'No overwrite'
    with zipfile.ZipFile(a.game_zip) as z:e=z.read('mk2/mk2.exe');gra=z.read('mk2/fall.gra')
    assert (sha(e),sha(gra))==(EH,FH)
    sys.path.insert(0,str(a.project/'tools/mk2_native_stage_palettes'))
    from trace_o120_setup_graph import fixups
    fx=fixups(e);d=verify(e,fx)
    video=json.loads(a.o215_report.read_text());assert video['inputs_sha256']=={'exe':EH,'fall':FH,'video':VH}
    record=video['records'];observed=[int(r['top_source_pose']['spriteID']) for r in record if 878<=r['capture_frame']<=894]
    assert set(observed)=={42,43,44,45,46} and observed[:2]==[42,42]
    assert int(next(r for r in record if r['capture_frame']==895)['top_source_pose']['spriteID'])==47
    negatives=[]
    for name,src in [('first_frame',BASE+0x1405c),('middle_frame',BASE+0x14064),('loop_marker',BASE+0x14070),
                     ('loop_backref',BASE+0x14074),('first_source_reference',BASE+0x13de4),('impact_reference',BASE+0x1407c)]:
        modified=bytearray(e);modified[src]^=0x01
        try:verify(modified,fx)
        except AssertionError:negatives.append(name)
        else:raise AssertionError('Tamper missed '+name)
    assert len(negatives)==6
    out={'schema':'o226_pit_fatality_five_frame_loop_and_impact_source_v1','hashes':{'exe':EH,'fall':FH,'o215_video':VH},
         'source':d,'earlier_independent_o215_video_sample':{'frame_range':[878,894],
             'observed_30fps_video_sprite_poses':observed,'subsequent_impact_pose_at_frame895':47,
             'caveat':'Video sample order differs from original 42,43,44,45,46 list order. Do not infer exact missed poses or game-task cadence from source order alone.'},
         'typed_fixups':len(fx),'negative_controls_rejected':negatives,
         'limitations':'The original list is authentic but no live callback trace; object animation task/physics can select poses with independent delays. Selected captured video silhouettes alone do not prove list playback schedule.'}
    a.out.mkdir(parents=True);(a.out/'O226_FALLING_FIGHTER_SOURCE_POSE_LIST.json').write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps({'source_loop':d['looping_original_falling_graphics'],'single_impact_pose':47,'negative_controls':len(negatives)},indent=2))
if __name__=='__main__':main()
