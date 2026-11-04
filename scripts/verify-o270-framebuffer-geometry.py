#!/usr/bin/env python3
"""O270 read-only structural validation of original MK2 video-copy code.

All offsets address canonical executable file bytes (NOT runtime virtual addresses).
No emulator is executed; no runtime framebuffer-change claim is made.
"""
import argparse, hashlib, json, struct
from pathlib import Path

SHA = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'

def require(b,off,h,label):
    needle=bytes.fromhex(h)
    if b[off:off+len(needle)]!=needle:raise AssertionError(f'{label}: wrong bytes at {off:#x}')

def rel32(b,site,op):
    require(b,site,op, 'relative opcode')
    return site+len(bytes.fromhex(op))+4+struct.unpack_from('<i',b,site+len(bytes.fromhex(op)))[0]

def memmove_opcode(off,source=True):
    if off==0:return bytes.fromhex('8b 06' if source else '89 07')
    if off<=0x7c:return bytes([0x8b if source else 0x89,0x46 if source else 0x47,off])
    return bytes([0x8b if source else 0x89,0x86 if source else 0x87])+struct.pack('<I',off)

def comp_opcode(off):
    if off==0:return bytes.fromhex('39 07')
    if off<=0x7c:return bytes([0x39,0x47,off])
    return bytes.fromhex('39 87')+struct.pack('<I',off)

def mismatch_store(off):
    if off<=0x7c:return bytes([0x89,0x45,off])
    return bytes.fromhex('89 85')+struct.pack('<I',off)

def validate(b,identity=True):
    if identity and hashlib.sha256(b).hexdigest()!=SHA:raise AssertionError('canonical original MK2.EXE SHA mismatch')
    anchors={
       'controller_pending_palette_call':(0x670ac,'e8 6f e3 ff ff'),
       'wrapper_mode_test':(0x65420,'83 3d 4c 01 03 00 03'),
       'wrapper_not_mode3':(0x65427,'75 70'),
       'wrapper_special_test':(0x65499,'f7 05 ee 5c 07 00 ff ff ff ff'),
       'wrapper_special_branch':(0x654a3,'75 5e'),
       'wrapper_toggle_compare':(0x654a5,'81 3d 2a 66 07 00 24 65 05 00'),
       'normal_source_a':(0x654b1,'be 24 65 05 00 bf 24 5f 06 00 bd 00 00 0a 00'),
       'normal_source_b':(0x654da,'be 24 5f 06 00 bf 24 65 05 00 bd 00 00 0a 00'),
       'special_delta':(0x65503,'be 24 65 05 00 bf 24 5f 06 00 bd 00 00 0a 00'),
       'special_resync_fallthrough':(0x65517,'be 24 65 05 00 bf 24 5f 06 00 b1 c8 90'),
       'full_copy_counter':(0x65521,'b1 c8 90'),
       'full_copy_stride':(0x65822,'81 c6 40 01 00 00 81 c7 40 01 00 00'),
       'full_copy_loop':(0x6582e,'fe c9 0f 85 ee fc ff ff c3'),
       'delta_copy_counter':(0x65a54,'b1 c8'),
       'delta_copy_stride':(0x65f34,'81 c5 40 01 00 00 81 c6 40 01 00 00 81 c7 40 01 00 00'),
       'delta_copy_loop':(0x65f46,'fe c9 0f 85 08 fb ff ff c3'),
       'delta_safety_guard':(0x665b6,'81 fd 00 00 0a 00 7c 11 81 fd ff ff 0a 00 77 09'),
    }
    for label,(offset,h) in anchors.items():require(b,offset,h,label)
    assert rel32(b,0x670ac,'e8')==0x65420
    for site in [0x654c0,0x654e9,0x65512]:assert rel32(b,site,'e8')==0x65a54
    for site in [0x6544b,0x6546f,0x65493]:assert rel32(b,site,'e8')==0x65521
    assert rel32(b,0x65830,'0f85')==0x65524
    assert rel32(b,0x65f48,'0f85')==0x65a56
    # Exact 80 unrolled dword loads/stores per scanline in full-copy.
    ptr=0x65524
    full_locs=[]
    for index in range(80):
        off=index*4
        pattern=memmove_opcode(off,True)+memmove_opcode(off,False)
        if b[ptr:ptr+len(pattern)]!=pattern:raise AssertionError(f'full-copy dword {index} at {ptr:#x}')
        full_locs.append(ptr);ptr+=len(pattern)
    assert ptr==0x65822,(hex(ptr),'full-copy end')
    # Exact 80 unrolled dword comparisons each with a changed-word VGA write branch.
    ptr=0x65a56
    delta_locs=[]; stores=[]
    for index in range(80):
        off=index*4
        compare=memmove_opcode(off,True)+comp_opcode(off)
        if b[ptr:ptr+len(compare)]!=compare:raise AssertionError(f'delta compare dword {index} at {ptr:#x}')
        jsite=ptr+len(compare)
        dest=rel32(b,jsite,'0f85')
        store=mismatch_store(off)
        if b[dest:dest+len(store)]!=store:raise AssertionError(f'changed-word VGA store {index} at {dest:#x}')
        delta_locs.append(ptr);stores.append(dest)
        ptr=jsite+6
    assert ptr==0x65f34,(hex(ptr),'delta-compare end')
    assert stores[0]==0x65f50 and stores[-1]==0x6659e
    return {
       'schema':'mk2_o270_framebuffer_geometry_v1',
       'fixture_sha256':SHA,
       'classification':'ORIGINAL-SOURCE VERIFIED ONLY; not a new runtime witness',
       'framebuffer':{'row_bytes':0x140,'rows':0xc8,'total_bytes':0xfa00,'dwords_per_row':80,'destination_vga': '0xA0000','buffer_A_source_image':'0x56524','buffer_B_source_image':'0x65F24','buffers_separation_bytes':0xfa00},
       'wrapper':{'mode3':'direct full-copy to VGA, source A or B chosen by state','normal':'delta copy to VGA: source A versus B or B versus A','special_flag_nonzero':'delta A versus B to VGA then falls through to full-copy A into B (resynchronizes buffer B)','comparison_basis':'source versus opposite buffer, not a direct readback of prior VGA VRAM'},
       'original_source_code':{'controller_pending_call':'0x670AC','transfer_wrapper':'0x65420','full_copy_helper':'0x65521','delta_copy_helper':'0x65A54','special_resync_fallthrough':'0x65517','full_copy_loop_end':'0x65830','delta_loop_end':'0x65F48'},
       'checks':{'opcode_anchors':len(anchors),'direct_calls':7,'full_copy_dwords_per_row_checked':len(full_locs),'delta_compares_per_row_checked':len(delta_locs),'delta_mismatch_vga_stores_per_row_checked':len(stores),'loop_edges':2},
       'unresolved':['O266 breakpoint stopped before 0x65420 call executed; no live callee execution established','runtime value of the 0x75CEE special-buffer flag not observed','no direct live witness of changed VRAM dwords or full copy during Pit II','palette-driven DAC changes can alter on-screen colors even if unchanged pixel indices remain in VGA memory','does not prove controller-to-display timing or O248 unequal captured holds']}

def run(exe,out):
    b=Path(exe).read_bytes();result=validate(b)
    # Independent single-byte negative controls on every anchor plus selected unrolled interior sites.
    controls={f'anchor_{k}':v[0] for k,v in {
       'controller_pending_palette_call':(0x670ac,''),'wrapper_mode_test':(0x65420,''),
       'wrapper_not_mode3':(0x65427,''),'wrapper_special_test':(0x65499,''),
       'wrapper_special_branch':(0x654a3,''),'wrapper_toggle_compare':(0x654a5,''),
       'normal_source_a':(0x654b1,''),'normal_source_b':(0x654da,''),
       'special_delta':(0x65503,''),'special_resync_fallthrough':(0x65517,''),
       'full_copy_counter':(0x65521,''),'full_copy_stride':(0x65822,''),
       'full_copy_loop':(0x6582e,''),'delta_copy_counter':(0x65a54,''),
       'delta_copy_stride':(0x65f34,''),'delta_copy_loop':(0x65f46,''),
       'delta_safety_guard':(0x665b6,'')}.items()}
    # Representative interior instructions plus end-of-unroll entries.
    controls.update({
       'full_copy_first':0x65524,'full_copy_interior':0x65660,'full_copy_last':0x65816,
       'delta_first':0x65a56,'delta_interior':0x65c00,'delta_last':0x65f22,
       'changed_word_store_first':0x65f50,'changed_word_store_last':0x6659e,
       'delta_call_normal_first':0x654c0,'delta_call_normal_second':0x654e9,
       'delta_call_special':0x65512,'full_call_mode3':0x6544b,
       'delta_loop_branch':0x65f49,'full_loop_branch':0x65831
    })
    # Select verified aligned interior instruction rather than guessing offsets.
    fullptr=0x65524;deltaptr=0x65a56
    for i in range(80):
        off=i*4
        if i==30:controls['full_copy_interior']=fullptr;controls['delta_interior']=deltaptr
        if i==79:controls['full_copy_last']=fullptr;controls['delta_last']=deltaptr
        fullptr+=len(memmove_opcode(off,True)+memmove_opcode(off,False))
        deltaptr+=len(memmove_opcode(off,True)+comp_opcode(off))+6
    rejected=[]
    for name,off in controls.items():
        alt=bytearray(b);alt[off]^=1
        try:validate(alt,False)
        except AssertionError:rejected.append(name)
        else:raise AssertionError('mutation not rejected '+name)
    result['checks']['negative_controls_rejected']=len(rejected)
    result['checks']['negative_control_names']=sorted(rejected)
    Path(out).write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print('O270 VERIFIED',hashlib.sha256(Path(out).read_bytes()).hexdigest(), 'negative controls',len(rejected))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--out',required=True);a=p.parse_args();run(a.exe,a.out)
