#!/usr/bin/env python3
"""O234: bounded original MK2 fatality stage-layer coordinate handoff.

Read-only exact original fixture. Verifies *static* executable code, never claims
live framebuffer selection or a complete camera trajectory.
"""
import argparse, hashlib, json, struct, zipfile
from pathlib import Path
EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
PIT='af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96'
FALL='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
H=lambda b:hashlib.sha256(b).hexdigest()
U=lambda e,p:struct.unpack_from('<I',e,p)[0]
def match(e,p,s):assert e[p:p+len(s)//2]==bytes.fromhex(s),(hex(p),s)
def call(e,p,dest,opcode=0xe8):
 assert e[p]==opcode and p+5+struct.unpack_from('<i',e,p+1)[0]==dest,(hex(p),hex(dest))
def verify(e):
 match(e,0x80202,'e8f324000033c0a3e4420800')
 # Six separate stage list heads and matching native horizontal origins.
 lists=[]
 for i in range(6):
  p=0x8020e+25*i
  assert e[p]==0xb8 and U(e,p+1)==0x84348-4*i
  match(e,p+5,'520fbf15')
  assert U(e,p+9)==0x84326-4*i
  match(e,p+13,'89156c5a07005a')
  call(e,p+20,0x8050b)
  lists.append({'object_list_head':hex(U(e,p+1)),'source_x_offset_word':hex(U(e,p+9)),'callsite':hex(p+20)})
 # The original transfer walks a singly linked list and subtracts list X
 # and the global Y camera origin from object +0x1A/+0x1E.
 match(e,0x8050b,'520fbf15ea4208008915705a07005a')
 match(e,0x8051a,'8b38f7c7ffffffff7425')
 match(e,0x80524,'0fbf471a2b056c5a07006689471a')
 match(e,0x80532,'0fbf471e2b05705a07006689471e')
 call(e,0x80540,0x64576)
 match(e,0x80545,'8bc7ebd1c3')
 # Six layer-specific flags set immediately after stage list conversion.
 match(e,0x802a4,'b801000000')
 for i in range(6):
  at=0x802a9+i*5
  assert e[at]==0xa3 and U(e,at+1)==0x7745b+4*i
 # In the same pre-fatality chain, the player's local Y position is
 # compared with current global camera Y, triggering vertical motion.
 match(e,0x80359,'a1805a07000fbf401e0fbf1dea4208002bc383f860')
 assert e[0x8036e:0x80374]==bytes.fromhex('0f8c74ffffff')
 # Original prior O227 hand-off (local edge, NOT upstream dispatcher proof).
 call(e,0x8045b,0x8054a,0xe9)
 # Independent list-culling code uses both scroll origins on original objects.
 match(e,0x9368d,'668b571a662b152e430800')
 match(e,0x936ae,'668b571e662b15ea420800')
 # A distinct source loop increments the vertical scroll origin by an
 # explicitly updated accumulator and yields, without proving that loop
 # is the active fatality descent camera algorithm.
 match(e,0x80cd2,'c705805a070006000000')
 match(e,0x80cdc,'c7057c5a070008000000')
 match(e,0x80ce6,'a1805a0700c1f8022905805a0700')
 match(e,0x80cf4,'a1ea4208000305805a0700a3ea420800')
 call(e,0x80d09,0x6710f)
 match(e,0x80d0e,'f71d805a0700ff0d7c5a070075d8')
 return {'layer_list_conversion_entry':'0x80202','clears_motion_accumulator':'0x842E4',
 'six_layer_list_heads_and_x_origin_words':lists,'list_conversion_helper':'0x8050B',
 'object_x_word_field':'0x1A','object_y_word_field':'0x1E','object_next_pointer_field':'0x00',
 'shared_current_y_origin':'0x842EA','unmodified_scene_culling_x_origin':'0x8432E',
 'six_layer_flag_words':[hex(0x7745b+4*i) for i in range(6)],
 'pre_fatality_player_y_gate':'0x80359: [object+0x1E] minus [0x842EA] compared with 0x60',
 'local_fatality_continuation_jump':'0x8045B -> 0x8054A',
 'distinct_y_accumulator_update':'0x80CD2..0x80D1C; active during fatality unproven',
 'limitation':'Static original code. Does not establish live active callback, absolute pillar Y travel, framebuffer presentations or fate of FALL graphic58.'}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--game-zip',required=True,type=Path);ap.add_argument('--out',required=True,type=Path);a=ap.parse_args()
 assert not a.out.exists(),'Output must be new'
 with zipfile.ZipFile(a.game_zip) as z:e=z.read('mk2/mk2.exe');pit=z.read('mk2/pit.gra');fall=z.read('mk2/fall.gra')
 assert (H(e),H(pit),H(fall))==(EXE,PIT,FALL),'Unrecognized owner fixture'
 src=verify(e)
 bad=[('y_accumulator_clear',0x80209),('first_stage_head',0x8020f),('second_stage_x',0x80230),('third_stage_call',0x80255),('last_stage_head',0x8028c),('shared_y_load',0x8050f),('object_x_sub',0x80529),('object_y_sub',0x80537),('sixth_layer_flag',0x802c4),('fighter_y_gate',0x80368),('local_fatality_jump',0x8045c),('scene_x_cull',0x93693),('scene_y_cull',0x936b4),('secondary_y_accumulator',0x80cf8)]
 rejected=[]
 for label,p in bad:
  changed=bytearray(e);changed[p]^=1
  try:verify(changed)
  except AssertionError:rejected.append(label)
  else:raise AssertionError('Mutation escaped: '+label)
 assert len(rejected)==len(bad)
 report={'schema':'o234_pit_fatality_six_layer_camera_origin_normalization_source_v1','fixture_sha256':{'mk2_exe':EXE,'pit_gra':PIT,'fall_gra':FALL},'source':src,'mutation_controls_rejected':rejected}
 a.out.mkdir(parents=True);f=a.out/'O234_PIT_FATALITY_SIX_LAYER_CAMERA_ORIGIN_HANDOFF.json';f.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'out':str(f),'sha256':H(f.read_bytes()),'rejected':len(rejected)},indent=2))
if __name__=='__main__':main()
