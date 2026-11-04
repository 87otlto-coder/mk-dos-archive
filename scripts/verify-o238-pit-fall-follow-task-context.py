#!/usr/bin/env python3
"""O238: read-only Pit II camera-task registration/context round trip.

Verifies original MK2 code bytes and direct near-call targets. It does not
assert actual runtime actor identity, executed schedule, or displayed frames.
"""
import argparse, hashlib, json, struct, zipfile
from pathlib import Path
H=lambda b:hashlib.sha256(b).hexdigest()
EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
PIT='af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96'
FALL='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
def m(e,p,h):
    v=bytes.fromhex(h)
    assert e[p:p+len(v)]==v,(hex(p),h)
def u(e,p):return struct.unpack_from('<I',e,p)[0]
def edge(e,p,dest):
    assert e[p]==0xe8,hex(p)
    assert p+5+struct.unpack_from('<i',e,p+1)[0]==dest,(hex(p),hex(dest))
def verify(e):
    # Allocates/looks up a task, sets the callback, and seeds the owner object.
    m(e,0x801a9,'b804000000')
    edge(e,0x801ae,0x672c7)
    m(e,0x801b3,'ba ae e5 01 00')
    edge(e,0x801b8,0x86ac3)
    m(e,0x801bd,'89 78 0c')  # task +0x0C <- EDI
    # Explicitly verify physical/LE-code-offset mapping by two independently
    # linked caller continuations with no adjacent code assumptions.
    m(e,0x80004,'ba ab e4 01 00')
    m(e,0x801f1,'c7 45 00 a9 e5 01 00')
    m(e,0x801f8,'e9 43 37 fe ff')
    m(e,0x801fd,'e9 7c 4e fe ff')
    base=0x801fd-0x1e5a9
    assert base==0x61c54
    assert 0x1e4ab+base==0x800ff
    assert u(e,0x801b4)+base==0x80202
    # The generic task initializer installs callback in task+0x1C.
    m(e,0x86ac3,'50 66 c7 40 06 01 00 89 50 1c 8d 90 18 03 00 00 89 50 08 58 c3')
    # A yield stores task working globals and owner's pointer in +0x0C.
    m(e,0x6710f,'5a 66 89 46 06 89 56 1c 89 6e 08')
    m(e,0x6711a,'52 8b 15 80 5a 07 00 89 56 0c 5a')
    m(e,0x67125,'52 8b 15 7c 5a 07 00 89 56 10 5a')
    m(e,0x67130,'52 8b 15 78 5a 07 00 89 56 14 5a')
    m(e,0x6713b,'89 7e 18')
    # Dispatcher resumes the task and restores +0x0C into global 0x75A80
    # before indirect jumping to the task callback.
    m(e,0x67158,'66 ff 4e 06 7f f4 8b 6e 08')
    m(e,0x67161,'52 8b 56 0c 89 15 80 5a 07 00 5a')
    m(e,0x6716c,'52 8b 56 10 89 15 7c 5a 07 00 5a')
    m(e,0x67177,'52 8b 56 14 89 15 78 5a 07 00 5a')
    m(e,0x67182,'8b 7e 18 ff 66 1c')
    # Original camera task starts at physical 0x80202, consumes the selected
    # actor from the task-context-restored global, then its +0x14 velocity.
    edge(e,0x80202,0x826fa)
    m(e,0x80207,'33 c0 a3 e4 42 08 00')
    m(e,0x802fe,'a1 80 5a 07 00 0f bf 40 1a')
    m(e,0x8033d,'a1 80 5a 07 00 52 8b 50 14')
    m(e,0x80359,'a1 80 5a 07 00 0f bf 40 1e')
    m(e,0x8037b,'89 15 e4 42 08 00')
    return {
      'callback_registration': {'task_lookup_call':'0x801AE -> 0x672C7','callback_logical_code_offset':'0x1E5AE','task_initializer_call':'0x801B8 -> 0x86AC3','registered_callback_physical':'0x80202','parent_EDI_to_task_owner_slot':'0x801BD -> task+0x0C'},
      'code_offset_rebase': {'base_physical_minus_logical':'0x61C54','independent_anchor_A':'0x1E5A9 -> 0x801FD','independent_anchor_B':'0x1E4AB -> 0x800FF'},
      'initializer_slot':'0x86ACA: task+0x1C = callback pointer in EDX',
      'scheduler_save':'0x6711A: active global 0x75A80 -> task+0x0C',
      'scheduler_restore':'0x67161: task+0x0C -> active global 0x75A80',
      'scheduler_dispatch':'0x67185: jump through task+0x1C',
      'camera_task_consumption':['0x802FE: global owner -> signed X+0x1A','0x8033D: global owner -> dword motion+0x14','0x80359: global owner -> signed Y+0x1E','0x8037B: motion to 0x842E4'],
      'classification':'VERIFIED source connection and saved/restored task object pointer; actor identity at parent EDI and live activation remain unresolved',
      'not_proven':['specific fighter instance corresponding to parent EDI','runtime fall speed and camera trajectory','exact graphics 58 presentation','fatality dispatcher entry and activation']}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--game-zip',type=Path,required=True);ap.add_argument('--out',type=Path,required=True); a=ap.parse_args()
    assert not a.out.exists(),'Fresh destination required'
    with zipfile.ZipFile(a.game_zip) as z:
        e=z.read('mk2/mk2.exe');p=z.read('mk2/pit.gra');f=z.read('mk2/fall.gra')
    assert (H(e),H(p),H(f))==(EXE,PIT,FALL),'Canonical original game fixture required'
    result=verify(e)
    probes={'task_allocator':0x801ae,'callback_immediate':0x801b4,'task_initializer':0x801b8,'owner_binding':0x801bd,'mapping_anchor_1':0x801f4,'mapping_anchor_2':0x80005,'initializer_owner_context':0x86aca,'yield_save':0x67120,'yield_context_other':0x6712a,'restore_context':0x67165,'restore_callback_jump':0x67185,'camera_callback_entry':0x80203,'owner_X_read':0x80300,'owner_motion_read':0x80345,'owner_Y_read':0x80361,'camera_motion_store':0x8037d}
    rejected=[]
    for name,at in probes.items():
        c=bytearray(e);c[at]^=1
        try:verify(c)
        except AssertionError:rejected.append(name)
        else:raise AssertionError('undetected mutation '+name)
    assert len(rejected)==len(probes)
    report={'schema':'o238_pit_fall_camera_task_owner_context_v1','canonical_source_sha256':{'exe':EXE,'pit':PIT,'fall':FALL},'source':result,'mutations_rejected':rejected}
    a.out.mkdir(parents=True)
    dst=a.out/'O238_PIT_FALL_CAMERA_TASK_OWNER_CONTEXT.json';dst.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'report':str(dst),'sha256':H(dst.read_bytes()),'mutations_rejected':len(rejected)}))
if __name__=='__main__':main()
