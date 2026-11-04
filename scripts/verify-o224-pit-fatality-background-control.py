#!/usr/bin/env python3
"""O224: six original Pit II fatality lower-wall tiles, timed selector, palette pointers.
Canonical EXE/FALL fixture required; previous O214 captured-frame classifications explicitly retained.
This does not execute DOS code or assume a one-IRQ-per-scheduler-task runtime equivalence.
"""
import argparse, collections, hashlib, itertools, json, struct, sys, zipfile
from pathlib import Path
BASE1=0x61c54;BASE2=0xa0c54
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
FH='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
VH='198b5ecccb1cca898e4da7ba1282104fac71c2e3bc8a6009638420deb9dede48'
def h(b):return hashlib.sha256(b).hexdigest()
def u32(b,at):return struct.unpack_from('<I',b,at)[0]
def check(e,fx):
    # We use the e argument (not module state) so mutation controls are executable.
    def typed(obj,off,targetobj,target):
        f=fx.get((obj,off));assert f and f['kind']==7 and f['flags']==16 and f['targetObject']==targetobj and f['targetOffset']==target,(hex(off),f)
        assert u32(e,(BASE1 if obj==1 else BASE2)+off)==target
    assert struct.unpack_from('<H',e,0x895ac)[0]==81
    # Original palette pointer in the seventh extra DWORD of seven complete 16-byte records.
    pal=[]
    for sprite in range(54,61):
        at=0xc3c40+(sprite-54)*16
        w,hh,x,y,packed=struct.unpack_from('<HHhhI',e,at)
        assert (w,hh)=={54:(96,96),55:(96,96),56:(80,80),57:(64,64),58:(96,96),59:(96,96),60:(96,96)}[sprite]
        assert x==y==0 and packed>>24==123
        typed(2,at+12-BASE2,1,0x27958)
        pal.append({'sprite_id':sprite,'original_descriptor_physical':hex(at),'original_PIT_palette_pointer_physical':hex(at+12),'source_palette_record_physical':'0x895AC','original_tile_dimensions':[w,hh]})
    # Selector original array is backed by exact code that reads index and looks up six 8-byte paired records.
    seq=list(e[0xb4d84:0xb4da4]);assert len(seq)==32 and e[0xb4da4]==255
    runs=[{'tile_sprite':55+key,'selector_steps':len(list(group))} for key,group in itertools.groupby(seq)]
    assert [(r['tile_sprite'],r['selector_steps']) for r in runs]==[(60,12),(59,6),(58,5),(57,4),(56,3),(55,2)]
    pair=[]
    for index in range(6):
        ptr=0x14151+8*index
        desc=0x22ffc+16*index
        typed(2,ptr,2,desc)
        control=u32(e,BASE2+ptr+4)
        assert control in (0x14181,0x141c1,0x14201)
        typed(2,ptr+4,2,control)
        pair.append({'selector_index':index,'FALL_sprite':55+index,'descriptor_object2':hex(desc),'instruction_stream_object2':hex(control)})
    # After selector termination, original source initializes the crack overlay sprite54.
    typed(1,0x8064b-BASE1,2,0x22fec)
    assert e[0x80645:0x8064f]==bytes.fromhex('c7056c5a0700ec2f0200'), 'crack descriptor seed after selector loop'
    assert e[0x8064f]==0xe8 and 0x80654+struct.unpack_from('<i',e,0x80650)[0]==0x64548, 'crack object/setup call'
    # Original code: clear cursor, one-count scheduler yield, call selector, loop on CF=0.
    exact={'zero_selector_cursor':(0x805a6,'c7056b37010000000000'),
           'one_scheduler_yield':(0x805f4,'b801000000e8116bfeff'),
           'selector_call':(0x805fe,'e81e010000'),
           'loop_if_no_carry':(0x80603,'73ea'),
           'check_signed_selector':(0x80721,'60a16b370100f68030410100ff7903'),
           'load_selector_byte':(0x8073d,'a16b3701000fb68030410100'),
           'indexed_descriptor_pointer':(0x8074a,'8b14c551410100'),
           'indexed_instruction_pointer':(0x80758,'8b1cc555410100'),
           'advance_selector_cursor':(0x80796,'ff056b370100'),
           'return_stop':(0x80730,'61f9c3'),
           'return_continue':(0x8079c,'61f8c3')}
    for label,(p,s) in exact.items():assert e[p:p+len(s)//2]==bytes.fromhex(s),(label,hex(p))
    for p,target in [(0x805f9,0x6710f),(0x805fe,0x80721),(0x80738,0x86bb1)]:
        assert e[p]==0xe8 and p+5+struct.unpack_from('<i',e,p+1)[0]==target,(hex(p),hex(target))
    # Physical code relocations for selector table and associated paired pointer list.
    typed(1,0x80729-BASE1,2,0x14130)
    typed(1,0x80745-BASE1,2,0x14130)
    typed(1,0x8074d-BASE1,2,0x14151)
    typed(1,0x8075b-BASE1,2,0x14155)
    return {'original_7_special_descriptor_palette_field_refs':pal,'shared_palette_source_81_color_record':'0x895AC',
      'original_selector_table_object2':'0x14130','original_selector_array_physical':'0xB4D84',
      'selector_sequence':seq,'selector_runs_in_original_execution_order':runs,'selector_terminator_byte':255,
      'descriptor_and_draw_instruction_pairs':pair,'original_cursor_global':'0x1376B',
      'original_cursor_clear_code':'0x805A6','original_timed_loop_source':'0x805F4..0x80605',
      'original_selector_subroutine':'0x80721..0x8079F','selector_callback_renderer_seed_global':'0x75A6C',
      'source_yield_per_selector_step':1,'source_scheduler_yield_target':'0x6710F',
      'post_selector_crack_source_54_seed_physical':'0x80645','post_selector_crack_object_setup_call_physical':'0x8064F',
      'source_condition':'CALL selector; while carry clear, re-enter one scheduler yield; carry set on 0xFF sentinel',
      'original_code_exact_fragments_checked':len(exact)}
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--game-zip',type=Path,required=True);ap.add_argument('--project',type=Path,default=Path(__file__).resolve().parents[1]);ap.add_argument('--o214-report',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);args=ap.parse_args()
    assert not args.out.exists(),'New destination only'
    with zipfile.ZipFile(args.game_zip) as z:e=z.read('mk2/mk2.exe');f=z.read('mk2/fall.gra')
    assert (h(e),h(f))==(EH,FH),'Original owner fixture only'
    sys.path.insert(0,str(args.project/'tools/mk2_native_stage_palettes'))
    from trace_o120_setup_graph import fixups
    fx=fixups(e)
    d=check(e,fx)
    o214=json.loads(args.o214_report.read_text());assert o214['input_hashes']=={'exe':EH,'fall':FH,'video':VH}
    selected=[int(r['selected_on_training_patch']['original_sprite']) for r in o214['rows']]
    assert selected and 58 not in selected and set(selected)=={55,56,57,59,60},set(selected)
    d['prior_o214_video_only_source_sprite_selection']={'prior_o214_captured_frames':len(selected),
       'observed_selected_original_sprite_set':sorted(set(selected)),
       'source_58_not_selected_on_o214_30fps_frames':True,
       'meaning':'O224 source unambiguously selects source58 on five of 32 table steps; O214 video patches do not select it. No assertion of why the runtime and sampled video observations differ.'}
    tamper={'selector_entry58':(0xb4d84+18,0x7e),'selector_terminator':(0xb4da4,0),
       'descriptor58_pointer':(0xb4dbd,0),'descriptor58_palette':(0xc3c80+12,0),
       'selector_yield_literal':(0x805f5,2),'selector_call':(0x805ff,0),
       'selector_lookup_instr':(0x8074d,0),'selector_cursor_advance':(0x80796,0), 'post_loop_crack_source':(0x8064b,0)}
    rejected=[]
    for name,(pos,value) in tamper.items():
        e2=bytearray(e);e2[pos]=value
        try:check(e2,fx)
        except AssertionError:rejected.append(name)
        else:raise AssertionError('Tamper escaped: '+name)
    assert len(rejected)==len(tamper)
    out={'schema':'o224_original_pit_fatality_timed_tile_selector_palette_pairs_v1',
      'canonical_hashes':{'exe':EH,'fall':FH,'fatality_video_from_O214_report':VH},
      'source_static_facts':d,'typed_LE_fixup_count':len(fx),'tamper_controls_rejected':rejected,
      'limitations':'This is original static executable control-flow/relocation evidence plus older O214 video matches, not a live instruction trace. Sprite58 original intended run proven; missing O214 sample match remains unresolved. One scheduler yield count not exact milliseconds without task-timer/live runtime proof. No DAC register trace or foreground effect render ordering.'}
    args.out.mkdir(parents=True);(args.out/'O224_PIT_FATALITY_BACKGROUND_SOURCE_TIMED_SEQUENCE.json').write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps({'selector_entries':32,'tile_order':[r['tile_sprite'] for r in d['selector_runs_in_original_execution_order']],
      'selector_yield':1,'special_palette_links':len(d['original_7_special_descriptor_palette_field_refs']),
      'original_relocation_count':len(fx),'negative_controls_rejected':len(rejected)},indent=2))
if __name__=='__main__':main()
