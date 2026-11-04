#!/usr/bin/env python3
"""O256: read-only, original-fixture-bound VGA palette queue / presentation study.

This checks original source machine instructions and computes conditional models.
It does NOT execute DOSBox or assert that a conditional branch was live in the video.
"""
import argparse
import hashlib
import json
import struct
import zipfile
from pathlib import Path

EXE = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
FALL = '60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
PREVIOUS = 'b5a5118a1ba67ca69842268bae6955fe89a9ade96740ab44ca4ebbdc19719a25'
PREVIOUS_NAME = 'MK-DOS-Archive/research_outputs/O255_PIT_LOWER_ACTOR_PALETTE_SOURCE.json'
O1_FILE_BASE = 0x61c54

OPS = {
    'allocator_60_slot_compare': (0x7b43e, '39 04 dd 00 5b 07 00'),
    'allocator_60_slot_bound': (0x7b44c, '80 fb 3c'),
    'allocator_cache_empty_test': (0x7b458, '66 f7 04 dd 04 5b 07 00 ff ff'),
    'palette_miss_sets_pending': (0x7b48f, 'c7 05 e0 63 05 00 01 00 00 00'),
    'palette_miss_resets_toggle': (0x7b499, 'c7 05 d4 62 05 00 00 00 00 00'),
    'cache_write_pointer': (0x7b4aa, '89 04 dd 00 5b 07 00'),
    'cache_write_index': (0x7b4b1, '88 14 dd 06 5b 07 00'),
    'cache_hit_ref_increment': (0x7b4f9, '66 ff 04 dd 04 5b 07 00'),
    'cache_release_ref_decrement': (0x7b514, '66 ff 0c c5 04 5b 07 00'),
    'cache_zero_clears_source': (0x7b52a, 'c7 04 c5 00 5b 07 00 00 00 00 00'),
    'queue_write_cursor_load': (0x7b2d1, '8b 0d dc 63 05 00'),
    'queue_write_pointer': (0x7b2d7, '89 01'),
    'queue_write_index': (0x7b2d9, '66 89 51 04'),
    'queue_write_color_count': (0x7b2dd, '66 89 59 06'),
    'queue_stride_8': (0x7b2e1, '83 c1 08'),
    'queue_end_boundary': (0x7b2e4, '81 f9 d8 63 05 00'),
    'queue_wrap_start': (0x7b2ec, 'b9 d8 62 05 00'),
    'queue_write_cursor_store': (0x7b2f1, '89 0d dc 63 05 00'),
    'queue_overflow_compare': (0x7b2f7, '3b 0d d8 63 05 00'),
    'DAC_load_read_cursor': (0x7b373, '8b 2d d8 63 05 00'),
    'DAC_load_write_cursor': (0x7b379, '8b 1d dc 63 05 00'),
    'DAC_record_source': (0x7b385, '8b 75 00'),
    'DAC_record_dest_index': (0x7b388, '0f b7 7d 04'),
    'DAC_record_stride': (0x7b38c, '83 c5 08'),
    'DAC_palette_destination_port': (0x7b3a4, 'ba c8 03 00 00'),
    'DAC_update_read_cursor': (0x7b3e7, '89 2d d8 63 05 00'),
    'DAC_clear_pending': (0x7b3ed, 'c7 05 e0 63 05 00 00 00 00 00'),
    'frame_toggle': (0x67050, '83 35 d4 62 05 00 01'),
    'frame_render_enable_test': (0x6705c, 'f7 05 f2 5c 07 00 ff ff ff ff'),
    'frame_mode_3_test': (0x67068, '83 3d 4c 01 03 00 03'),
    'frame_pending_palette_test': (0x6708c, 'f7 05 e0 63 05 00 ff ff ff ff'),
    'frame_force_toggle_1': (0x67098, 'c7 05 d4 62 05 00 01 00 00 00'),
    'frame_force_toggle_0': (0x670b1, 'c7 05 d4 62 05 00 00 00 00 00'),
    'frame_normal_toggle_test': (0x670c7, 'f7 05 d4 62 05 00 01 00 00 00'),
    'selector_tag': (0x80733, 'b8 0b 07 00 00'),
    'selector_advance': (0x80796, 'ff 05 6b 37 01 00'),
}
CALLS = {
    'miss_queues_DAC': (0x7b4a3, 0x7b2d0),
    'frame_mode3_flushes_DAC': (0x67080, 0x7b30b),
    'frame_mode3_transfer': (0x67085, 0x65420),
    'frame_pending_flushes_DAC': (0x670a7, 0x7b30b),
    'frame_pending_transfer': (0x670ac, 0x65420),
    'frame_normal_flushes_DAC': (0x670c2, 0x7b30b),
    'frame_skipped_transfer_flushes_DAC': (0x670d3, 0x7b30b),
    'selector_release_objects': (0x80738, 0x86bb1),
    'selector_tile_creation': (0x80771, 0x64548),
    'selector_commit': (0x80789, 0x646b4),
}


def h(d): return hashlib.sha256(d).hexdigest()


def check(b):
    for label, (p, code) in OPS.items():
        data = bytes.fromhex(code)
        if b[p:p + len(data)] != data:
            raise AssertionError(('original opcode', label, hex(p)))
    for label, (p, target) in CALLS.items():
        if b[p] != 0xe8 or p + 5 + struct.unpack_from('<i', b, p + 1)[0] != target:
            raise AssertionError(('original rel32 call', label, hex(p)))
    # Authenticated O224 selector: source graphic 60 down to 55.
    selector = b[0xb4d84:0xb4da5]
    if selector != bytes([5]*12 + [4]*6 + [3]*5 + [2]*4 + [1]*3 + [0]*2 + [255]):
        raise AssertionError('original selector')
    ring_first, ring_end, stride = 0x562d8, 0x563d8, 8
    if (ring_end - ring_first) // stride != 32:
        raise AssertionError('DAC ring layout')
    return {'queue_start':ring_first, 'queue_end_exclusive':ring_end,
            'queue_command_bytes':stride, 'queue_capacity':32,
            'cache_capacity':60,'selector_graphics':[55+x for x in selector[:-1]]}


def model():
    # This is explicitly a conditional state machine, NOT a DOS execution trace.
    branch=[]
    for enabled, mode, pending, toggle in (
        (False,2,0,0), (True,3,0,0), (True,2,1,0),
        (True,2,0,0), (True,2,0,1),
    ):
        # Source toggles the bit first, then mode 3 and pending paths override it.
        xorbit=toggle ^ 1
        if not enabled: name,compose,flush,transfer='disabled',False,True,True
        elif mode==3: name,compose,flush,transfer='mode3',True,True,True
        elif pending: name,compose,flush,transfer='pending_palette',True,True,True
        else: name,compose,flush,transfer='normal_alternating',True,True,not bool(xorbit)
        branch.append(dict(render_enabled=enabled,mode=mode,pending_palette=pending,
            toggle_before_controller=toggle,toggle_after_controller_xor=xorbit,
            source_branch=name,compose=compose,DAC_flush_called=flush,transfer_called=transfer))
    return branch


def report(b, prior):
    facts=check(b)
    return dict(schema='mkdos_o256_pit_palette_queue_transfer_order_source_v1',
        scope='Original source machine-code assertions and conditional model, NO live runtime execution',
        original_exe_sha256=EXE,original_fall_sha256=FALL,inherited_O255_report_sha256=h(prior),
        source_opcode_checks=len(OPS),source_call_checks=len(CALLS),
        source_data=facts, source_code_physical_to_object1_relative=lambda_placeholder(),
        model_branch_examples=model(),
        event_chain=['releasing last wall tile may clear cache pointer at 0x7B52A',
            'first tile reacquire misses -> pending flag at 0x7B48F and toggle=0 at 0x7B499',
            'palette command recorded in 32-slot queue at 0x7B2D0',
            'if pending at next controller gate 0x6708C, forced compose + DAC flush + transfer calls',
            'DAC routine drains queue at 0x7B381..0x7B3ED, clears pending flag',
            'without pending, mode3 or render-disable branch, normal toggle gates transfer'],
        practical_debugger_targets=[dict(name=name,physical_file_offset=f'0x{offset:05X}',
             object1_offset=f'0x{offset-O1_FILE_BASE:05X}',
             note='Loaded protected-mode address requires observed Object-1 runtime base; do NOT use physical file offset as debugger address')
             for name,offset in [('selector',0x80721),('object_release',0x86c7d),
               ('palette_release',0x7b505),('palette_acquire',0x7b439),
               ('queue_write',0x7b2d0),('DAC_flush',0x7b30b),
               ('frame_controller',0x67050),('forced_transfer_call',0x670ac),
               ('normal_transfer_call',0x670d8)]],
        limits=['No DOSBox executable/debugger is available in the execution environment; no live palette-slot counts or game-frame timestamps were collected.',
                '32 misses requires that no separate persistent same-source palette holder exists and each group removal reaches zero.',
                'Palette-pending state can be set by unrelated actor/FX changes, so a forced transfer cannot alone prove a wall palette miss.',
                'A palette cache miss can occur between two frame-controller passes, and multiple queue commands may be combined before a DAC flush.',
                '50fps empirically observed presentation, ~60Hz configured timer, and 30fps capture are distinct cadences.'])


def lambda_placeholder(): return {'code_file_image_base':f'0x{O1_FILE_BASE:X}',
     'runtime_mapping_status':'not established in this source-only pass'}


def main():
    p=argparse.ArgumentParser(); p.add_argument('--game-zip',type=Path,required=True)
    p.add_argument('--source-zip',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
    a=p.parse_args();
    if a.out.exists(): raise AssertionError('Destination must not exist')
    with zipfile.ZipFile(a.game_zip) as z:
        exe=z.read('mk2/mk2.exe');fall=z.read('mk2/fall.gra')
    if (h(exe),h(fall))!=(EXE,FALL):raise AssertionError('Original fixture changed')
    with zipfile.ZipFile(a.source_zip) as z:prior=z.read(PREVIOUS_NAME)
    if h(prior)!=PREVIOUS: raise AssertionError('Inherited O255 source changed')
    r=report(exe,prior)
    controls=[]
    for label,(offset,code) in OPS.items():
        x=bytearray(exe);x[offset+len(bytes.fromhex(code))-1]^=1
        try: check(x)
        except AssertionError:controls.append('opcode:'+label)
        else:raise AssertionError('Mutation passed '+label)
    for label,(offset,_) in CALLS.items():
        x=bytearray(exe);x[offset+1]^=1
        try:check(x)
        except AssertionError:controls.append('call:'+label)
        else:raise AssertionError('Mutation passed '+label)
    x=bytearray(exe);x[0xb4d84]^=1
    try:check(x)
    except AssertionError:controls.append('selector')
    else:raise AssertionError('Selector mutation passed')
    r['mutation_controls_rejected']=len(controls)
    r['mutation_control_labels']=controls
    a.out.mkdir(parents=True)
    output=a.out/'O256_PIT_PALETTE_QUEUE_PRESENTATION_SOURCE.json'
    output.write_text(json.dumps(r,indent=2,sort_keys=True)+'\n',encoding='utf-8')
    print(json.dumps({'sha256':h(output.read_bytes()),'original_opcode_checks':len(OPS),
          'call_checks':len(CALLS),'rejected_mutations':len(controls), 'path':str(output)}))
if __name__=='__main__':main()
