#!/usr/bin/env python3
"""O244: original MK2 Pit gameplay / fatality / lower-scene render command-list switch.
Read only, independently checks original file instructions and stream bytes.
Does not claim real-time activation/presentation or fatality dispatcher semantics.
"""
import argparse, hashlib, json, struct, zipfile
from pathlib import Path
EXPECTED={
 'exe':'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',
 'pit':'af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96',
 'fall':'60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'}
SHA=lambda b:hashlib.sha256(b).hexdigest()
U=lambda b,o:struct.unpack_from('<I',b,o)[0]
OBJ2_FILE_BASE=0xA0C54  # checked below against original O129 physical start
HEADS=[0x84334,0x84338,0x8433c,0x84340,0x84344,0x84348,0x8434c,0x84350,0x84358,0x84360]

def eq(b,off,h):
    raw=bytes.fromhex(h)
    assert b[off:off+len(raw)]==raw,(hex(off),h)

def call(b,off,target,opcode=b'\xe8'):
    assert b[off:off+len(opcode)]==opcode
    assert off+len(opcode)+4+struct.unpack_from('<i',b,off+len(opcode))[0]==target,(hex(off),hex(target))

def read_list(b,addr,count):
    p=OBJ2_FILE_BASE+addr
    rows=[]
    for i in range(count):
        tok=U(b,p+i*8); origin=U(b,p+i*8+4)
        assert tok in HEADS
        assert origin in [0x84312,0x84316,0x8431a,0x8431e,0x84322,0x84326,0x8432a,0x8432e]
        rows.append((tok,origin))
    assert U(b,p+count*8)==0
    return rows,b[p:p+count*8+4]

def verify(b):
    # The scene's camera actor script selects the ten-list explicitly.
    eq(b,0x80190,'b8 ec 3c 01 00 a3 f6 5c 07 00')
    # Stage drawing dispatcher reads the shared pointer, exits if zero,
    # and iterates positive token/origin pointer pairs.
    eq(b,0x93500,'8b 15 f6 5c 07 00 89 15 98 5a 07 00')
    eq(b,0x9350d,'f7 05 98 5a 07 00 ff ff ff ff 0f 84 8d 00 00 00')
    eq(b,0x93539,'52 8b 15 de 62 07 00 89 15 88 5a 07 00 5a')
    eq(b,0x93547,'8b 0d 98 5a 07 00 8b 01 83 c1 04')
    eq(b,0x9358c,'8b 31 83 c1 04 66 8b 36')
    call(b,0x935a3,0x93390)
    # Camera callback exits at end of descent; the next routine zeros the
    # command-list global, creates a lower-scene object, then selects 4-list.
    call(b,0x8045b,0x8054a,b'\xe9')
    eq(b,0x80554,'33 c0 a3 f6 5c 07 00')
    call(b,0x8056a,0x85be3)
    eq(b,0x805c4,'b8 0c 41 01 00 a3 f6 5c 07 00')
    call(b,0x805fe,0x80721)
    call(b,0x805f9,0x6710f)
    eq(b,0x80603,'73 ea')  # back to 0x805EF when selector still active
    initial,ib=read_list(b,0x18aa8,10)
    follow,fb=read_list(b,0x13cec,10)
    lower,lb=read_list(b,0x1410c,4)
    cave,cb=read_list(b,0x15d60,10)
    # The Pit stage stream and camera handoff stream have a final-pair ordering change.
    assert [v[0] for v in initial]==HEADS[:7]+[0x84358,0x84350,0x84360]
    assert [v[0] for v in follow]==HEADS
    assert [v[0] for v in lower]==[0x8434c,0x84350,0x84358,0x84360]
    assert follow==cave and fb==cb # independent identical 10-pair fixed stream
    assert all(x[0] not in [0x84334,0x84338,0x8433c,0x84340,0x84344,0x84348] for x in lower)
    assert all(v[0]<0x8434c for v in follow[:6])
    return {'original_gameplay_list':{'object2':hex(0x18aa8),'physical':hex(0x18aa8+OBJ2_FILE_BASE),'pair_count':len(initial),'pairs':[[hex(a),hex(d)] for a,d in initial],'sha256':SHA(ib)},
            'fatality_upper_list':{'object2':hex(0x13cec),'physical':hex(0x13cec+OBJ2_FILE_BASE),'pair_count':len(follow),'pairs':[[hex(a),hex(d)] for a,d in follow],'sha256':SHA(fb),'source_setter':'0x80190-0x80195'},
            'lower_list':{'object2':hex(0x1410c),'physical':hex(0x1410c+OBJ2_FILE_BASE),'pair_count':len(lower),'pairs':[[hex(a),hex(d)] for a,d in lower],'sha256':SHA(lb),'source_setter':'0x805C4-0x805C9'},
            'identical_existing_cave_list':{'object2':hex(0x15d60),'sha256':SHA(cb),'classification':'byte-identical command list, not evidence the Cave stage is active'},
            'transition_edges':{'stage_camera_to_lower_jump':'0x8045B -> 0x8054A','explicit_zero':'0x80554-0x8055A','lower_actor_creation':'0x8056A -> 0x85BE3','lower_background_loop':'0x805F9 yield 1; 0x805FE -> 0x80721; 0x80603 repeat'},
            'render_consumer':{'stream_load':'0x93500 from global 0x75CF6','loop':'0x93547','object_walker':'0x935A3 -> 0x93390','movement_gate_is_separate':'0x9353A -> 0x75A88 from 0x762DE'},
            'scope':'Source-backed scheduled scene-command-list transition, not live framebuffer evidence, runtime owner identity, actual camera trajectory or 58-presentation proof.'}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--game-zip',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);args=ap.parse_args()
 assert not args.out.exists(), 'Use fresh output directory'
 with zipfile.ZipFile(args.game_zip) as z:
  d={k:z.read('mk2/'+fn) for k,fn in [('exe','mk2.exe'),('pit','pit.gra'),('fall','fall.gra')]}
 assert {k:SHA(v) for k,v in d.items()}==EXPECTED,'Noncanonical game fixture'
 findings=verify(d['exe'])
 controls={'follow_setter':0x80192,'follow_setter_global':0x80196,'stream_load':0x93502,'dispatcher_branch':0x93517,'walker_call':0x935a4,'camera_to_lower':0x8045c,'lower_clear':0x80558,'object_create':0x8056b,'lower_setter':0x805c6,'lower_global':0x805ca,'loop_yield':0x805fa,'selector_call':0x805ff,'repeat_branch':0x80604,'gameplay_list_lastpair':OBJ2_FILE_BASE+0x18aa8+8*7,'follow_pair':OBJ2_FILE_BASE+0x13cec+8*5,'lower_pair':OBJ2_FILE_BASE+0x1410c+8,'cave_pair':OBJ2_FILE_BASE+0x15d60+8*9}
 rejected=[]
 for label,off in controls.items():
  altered=bytearray(d['exe']);altered[off]^=1
  try:verify(altered)
  except AssertionError: rejected.append(label)
  else: raise AssertionError('Failed to reject source mutation: '+label)
 args.out.mkdir(parents=True)
 report={'schema':'o244_pit_fatality_three_command_stream_phase_switch_v1','canonical_sha256':EXPECTED,'findings':findings,'rejected_controls':rejected}
 f=args.out/'O244_PIT_FATALITY_RENDER_LIST_PHASE_SWITCH.json'
 f.write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
 print(json.dumps({'report':str(f),'sha256':SHA(f.read_bytes()),'mutation_controls_rejected':len(rejected)}))
if __name__=='__main__': main()
