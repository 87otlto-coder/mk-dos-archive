#!/usr/bin/env python3
"""O221. Original Pit bridge fighters: 7+7 descriptor list and source callback byte proof.
Read-only, fixture-hash pinned, deliberately NOT a runtime FPS or trigger trace.
"""
import argparse,hashlib,json,struct,sys,zipfile
from pathlib import Path
BASE1=0x61c54;BASE2=0xa0c54
SHA_EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
SHA_PIT='af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96'
PHYS=[0xB98E4,0xB98F4]+[0xB9900+12*i for i in range(5)]+[0xB993C,0xB994C]+[0xB9958+12*i for i in range(5)]

def sha(b):return hashlib.sha256(b).hexdigest()
def u32(b,o):return struct.unpack_from('<I',b,o)[0]
def signed32(b,o):return struct.unpack_from('<i',b,o)[0]
def check(b,fx):
    def typed(obj,off,target):
        f=fx.get((obj,off))
        assert f and f['kind']==7 and f['flags']==16 and f['targetObject']==2 and f['targetOffset']==target,('typed relocation',obj,hex(off),hex(target),f)
        assert u32(b,(BASE1 if obj==1 else BASE2)+off)==target,('pointer value',hex(off))
    for p in PHYS:
        w,h,x,y,word=struct.unpack_from('<HHhhI',b,p)
        assert w==16 and h==(24 if p<0xb993c else 32) and x==0 and y==0 and word>>24==32,hex(p)
    group=[]
    for name,start,pointers in [('green',0x18afc,PHYS[:7]),('flame',0x18b20,PHYS[7:])]:
        for i,p in enumerate(pointers):typed(2,start+4*i,p-BASE2)
        assert u32(b,BASE2+start+28)==1,(name,'loop token')
        typed(2,start+32,start)
        group.append({'actor':name,'list_object2':hex(start),'list_physical':hex(BASE2+start),
                      'source_descriptors':[hex(p) for p in pointers], 'terminator':1,'loop_target_object2':hex(start)})
    # Original code installs first pose of each actor into common sprite-selector global,
    # builds both object contexts, assigns the two animation cursors, and advances both.
    # All exact instructions are asserted; typed relocations confirm their pointer target identity.
    insns={
      'first_sprite_seed':(0x831d8,'c7056c5a0700908c0100'),
      'green_list_seed':(0x831f2,'c705805a0700fc8a0100'),
      'second_sprite_seed':(0x831fc,'c7056c5a0700e88c0100'),
      'flame_list_seed':(0x83210,'c705785a0700208b0100'),
      'reader_first':(0x8321a,'e8a63a0000'),
      'reader_second':(0x8323a,'e8863a0000'),
      'yield_count_and_call':(0x83254,'b806000000e8b13efeff'),
      'back_loop':(0x8325e,'ebba')}
    for label,(at,hexbytes) in insns.items():
        assert b[at:at+len(hexbytes)//2]==bytes.fromhex(hexbytes),(label,hex(at))
    for at,target in [(0x831de,0x18c90),(0x831f8,0x18afc),(0x83202,0x18ce8),(0x83216,0x18b20)]:typed(1,at-BASE1,target)
    for at,target in [(0x831e7,0x83260),(0x8320b,0x83260),(0x8321a,0x86cc5),(0x8323a,0x86cc5),(0x83259,0x6710f)]:
        assert b[at]==0xe8
        assert at+5+signed32(b,at+1)==target,('call destination',hex(at),hex(target))
    assert b[0x8325e]==0xeb and 0x83260+struct.unpack_from('<b',b,0x8325f)[0]==0x8321a
    # Original list reader consumes the cursor from 0x75A78, list token 1 rewinds through back-pointer.
    assert b[0x86cc5:0x86ccb].hex()=='8b15785a0700', 'cursor reader identity'
    return {'source_actor_lists':group,'selector_global_object2':'0x75A6C',
      'animation_cursor_global_object2':'0x75A78', 'second_list_cursor_saved_global':'0x75A80',
      'object_setup_helper':'0x83260','reader_call_sites':['0x8321A','0x8323A'],
      'original_reader':'0x86CC5','yield_call':'0x6710F','literal_scheduler_yield_count':6,
      'repeated_code_region':'0x8321A..0x8325F','direct_code_byte_checks':len(insns),
      'claims':'Static original machine code and LE-relocated pointers; source lists loop 7 sprites each, and callback path calls known cursor reader for both with literal scheduler yield 6. Actual live trigger, game tick-to-wall-clock conversion, DOSBox cycle cadence and pixel draw order are NOT verified here.'}

def main():
    a=argparse.ArgumentParser();a.add_argument('--game-zip',type=Path,required=True);a.add_argument('--project',type=Path,default=Path(__file__).resolve().parents[1]);a.add_argument('--out',type=Path,required=True);args=a.parse_args()
    assert not args.out.exists(),'No overwrites';
    with zipfile.ZipFile(args.game_zip) as z: b=z.read('mk2/mk2.exe');g=z.read('mk2/pit.gra')
    assert (sha(b),sha(g))==(SHA_EXE,SHA_PIT),'Wrong owner fixture'
    sys.path.insert(0,str(args.project/'tools/mk2_native_stage_palettes'))
    from trace_o120_setup_graph import fixups
    fx=fixups(b)
    result=check(b,fx)
    mutations={
       'remove_green_list_loop':(BASE2+0x18afc+28,0),
       'swap_flame_sprite_second':(BASE2+0x18b20+4,0),
       'rewrite_green_seed':(0x831de,0),
       'wrong_second_reader_call':(0x8323b,0),
       'different_yield_count':(0x83255,7)}
    rejected=[]
    for label,(pos,value) in mutations.items():
      bb=bytearray(b);bb[pos]=value
      try:check(bb,fx)
      except AssertionError:rejected.append(label)
      else:raise AssertionError('mutation escaped '+label)
    assert len(rejected)==len(mutations)
    result.update({'schema':'o221_original_pit_bridge_animation_source_control_v1',
      'original_exe_sha256':sha(b),'original_pit_sha256':sha(g), 'typed_LE_fixup_count':len(fx),
      'deliberate_mutations_rejected':rejected})
    args.out.mkdir(parents=True)
    (args.out/'O221_PIT_BRIDGE_ANIMATION_SOURCE_CONTROL.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'source_lists':[(s['actor'],len(s['source_descriptors'])) for s in result['source_actor_lists']],
      'source_yield_count':result['literal_scheduler_yield_count'],'mutation_rejections':len(rejected)},indent=2))
if __name__=='__main__':main()
