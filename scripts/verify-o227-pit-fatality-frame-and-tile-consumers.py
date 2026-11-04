#!/usr/bin/env python3
"""O227: original fatality frame-delay path and tagged tile replacement.

Read-only authenticated MK2 fixture, inherited O214/O215 observations; this
establishes static control flow, not live task traversal, timing or a dispatcher.
"""
import argparse, hashlib, json, struct, zipfile
from pathlib import Path
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
FH='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
VH='198b5ecccb1cca898e4da7ba1282104fac71c2e3bc8a6009638420deb9dede48'
def sha(b): return hashlib.sha256(b).hexdigest()
def u32(b,p): return struct.unpack_from('<I',b,p)[0]
def require(e,pos,hexbytes,label):
    assert e[pos:pos+len(hexbytes)//2]==bytes.fromhex(hexbytes),(label,hex(pos))
def relcall(e,p,to,op=0xe8):
    assert e[p]==op and p+5+struct.unpack_from('<i',e,p+1)[0]==to,(hex(p),hex(to))
def verify(e):
    # Main script: select the character-specific source animation head, initialize
    # three-count pose frame advance and update it on *each selector-loop pass*.
    require(e,0x805d1,'b8c43d0100','character-indexed animation-head source')
    relcall(e,0x805d6,0x64ed2)
    require(e,0x64ed2,'8b5f468b0498c3','animation-head array access uses object+0x46')
    require(e,0x805db,'a3785a0700','active animation cursor store')
    require(e,0x805e0,'b803000000','animation frame-delay initial value')
    relcall(e,0x805e5,0x6433f)
    require(e,0x6433f,'983dff0f0000740c89463cb801000000894640c3','delay setup handler')
    relcall(e,0x805ef,0x6435a)
    require(e,0x6435a,'ff4e40752e','decrement current count and conditional skip')
    require(e,0x6435f,'528b563c8956405a','restore delay from per-task field')
    require(e,0x64367,'8b1d785a07008b1bf7c3ffffffff7416','next instruction presence gate')
    require(e,0x64377,'8b5f34f7c3020000007506','object flag branch before animator')
    relcall(e,0x64382,0x86cc5)
    relcall(e,0x64388,0x63e79)
    # Script timing and selector: frame-delay update comes before yield/count1,
    # which itself comes before the draw selector. No assumption about real time.
    require(e,0x805f4,'b801000000','one-count task yield')
    relcall(e,0x805f9,0x6710f)
    relcall(e,0x805fe,0x80721)
    require(e,0x80603,'73ea','loop until selector terminal carry')
    # Called ahead of each actual sprite group replacement.
    require(e,0x80733,'b80b070000','sprite-list removal tag value')
    relcall(e,0x80738,0x86bb1)
    require(e,0x86bb1,'bbffffffffe984000000','full mask and branch to tag-list remover')
    require(e,0x86c3f,'50515723c3','tag-list matching helper prologue')
    require(e,0x86c44,'bf58430800','first object list head')
    relcall(e,0x86c49,0x86c66)
    require(e,0x86c4e,'bf60430800','second object list head')
    relcall(e,0x86c53,0x86c66)
    require(e,0x86c58,'bf64430800','third object list head')
    relcall(e,0x86c5d,0x86c66)
    require(e,0x86c6e,'0fb7574023d33bd0','compare existing object tag with target')
    require(e,0x86c82,'8b078901','unlink matching object from current linked list')
    require(e,0x8078e,'66c747400b07','write tag to each new tile object')
    relcall(e,0x80771,0x64548)
    relcall(e,0x80789,0x646b4)
    require(e,0x80796,'ff056b370100','advance selector only after full group')
    # Dispatcher entry existence, not its unknown predecessor or call preconditions.
    relcall(e,0x8045b,0x8054a,op=0xe9)
    require(e,0x80456,'e87e4cfeff','preceding source setup subcall')
    # Exact known table: 58 selected, even though earlier heldout frames skip it.
    table=e[0xb4d84:0xb4da5]
    assert table==bytes([5]*12+[4]*6+[3]*5+[2]*4+[1]*3+[0]*2+[255])
    return {
      'source_5_pose_list_character_indexed_by_field':'object + 0x46 through 0x64ED2, original head table at object2 0x13DC4',
      'fatality_script_pose_advance_setup':'0x805E0 count 3 into 0x6433F',
      'fatality_script_pose_advance_each_selector_pass':'0x805EF calls 0x6435A before yield/draw',
      'original_pose_advance':'0x6435A decreases [ESI+0x40], resets from [ESI+0x3C], conditionally calls 0x86CC5 or 0x63E79 based on object bit 1',
      'source_selector_yield':'0x805F4 count 1 to 0x6710F',
      'original_tile_group_disposal':'0x80733 count 0x70B -> 0x86BB1, masks tag across three object lists, unlinks matching objects',
      'new_tiles_labeled':'0x8078E sets [EDI+0x40] to 0x70B following object commit',
      'tile_sequence_verified_original': [60]*12+[59]*6+[58]*5+[57]*4+[56]*3+[55]*2,
      'entry_edge_qualification':'direct original JMP 0x8045B -> 0x8054A; incoming runtime dispatcher path not established',
      'important_limitation':'Static source shows tag-based group replacement and pose timer logic. DOES NOT prove 58 was presented, exact time-to-display conversion, selected character mode, live branch, palette DAC, or final compositor.'}
def main():
    p=argparse.ArgumentParser();p.add_argument('--game-zip',type=Path,required=True);p.add_argument('--project',type=Path,default=Path(__file__).resolve().parents[1]);p.add_argument('--out',type=Path,required=True)
    a=p.parse_args();assert not a.out.exists(),'Output path must not exist'
    with zipfile.ZipFile(a.game_zip) as z:e=z.read('mk2/mk2.exe');fall=z.read('mk2/fall.gra')
    assert sha(e)==EH and sha(fall)==FH
    source=verify(e)
    base=a.project/'research_outputs'
    o214=json.loads((base/'O214_SOURCE_PALETTE_TRANSITION_REPORT.json').read_text())
    o215=json.loads((base/'O215_FALL_POSE_TIMELINE.json').read_text())
    assert o214['input_hashes']=={'exe':EH,'fall':FH,'video':VH}
    assert o215['inputs_sha256']=={'exe':EH,'fall':FH,'video':VH}
    frames=[r for r in o214['rows'] if 878<=r['capture_frame']<=896]
    vis=[{'capture_frame':r['capture_frame'],'selected_source':r['selected_on_training_patch']['original_sprite']} for r in frames]
    assert len(vis)==19 and set(x['selected_source'] for x in vis)=={55,56,57,59,60}
    negatives=[]
    for label,p in [('anim_list_base',0x805d2),('delay_setup',0x805e1),('delay_routine',0x6435a),('anim_interpreter_branch',0x64383),('tile_remove_tag',0x80734),('tile_remove_call',0x80739),('tile_object_new_tag',0x80793),('selector_entry58',0xb4d84+18),('source_entry_edge',0x8045c)]:
        b=bytearray(e);b[p]^=1
        try:verify(b)
        except AssertionError:negatives.append(label)
        else:raise AssertionError('Unexpected accepted mutation '+label)
    assert len(negatives)==9
    report={'schema':'o227_pit_fatality_pose_advance_and_tile_replacement_static_v1','inputs':{'mk2_exe_sha256':EH,'fall_gra_sha256':FH,'video_sha256':VH},'source':source,'captured_video_selected_original_texture_by_frame':vis,'mutation_controls_rejected':negatives}
    a.out.mkdir(parents=True)
    path=a.out/'O227_PIT_FATALITY_POSE_ADVANCE_TILE_REPLACEMENT.json';path.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'report':str(path),'sha256':sha(path.read_bytes()),'negative_controls':len(negatives),'captured_frames':len(vis)},indent=2))
if __name__=='__main__':main()
