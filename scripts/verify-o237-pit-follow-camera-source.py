#!/usr/bin/env python3
"""O237: verify bounded original Pit fall-camera velocity-follow control.
Source-only, read-only; this cannot establish live actor identity or video timing.
"""
import argparse, hashlib, json, struct, zipfile
from pathlib import Path
EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
PIT='af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96'
FALL='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
H=lambda b:hashlib.sha256(b).hexdigest()
U=lambda e,p:struct.unpack_from('<I',e,p)[0]
def match(e,p,s):
 expected=bytes.fromhex(s)
 assert e[p:p+len(expected)]==expected, (hex(p),s)
def edge(e,p,target,op):
 assert e[p:p+len(op)]==op,(hex(p),'bad opcode')
 assert p+len(op)+4+struct.unpack_from('<i',e,p+len(op))[0]==target,(hex(p),hex(target))
def verify(e):
 # The six-list source-to-screen fatality handoff resets stage y-increment.
 match(e,0x80207,'33c0a3e4420800')
 assert U(e,0x8020a)==0x842e4
 # Fall-follow task allocation sits directly after six-stage-list rebasing.
 match(e,0x802cc,'b805000000')
 edge(e,0x802d1,0x672c7,b'\xe8')
 match(e,0x802de,'c7057c5a070068000000')
 assert U(e,0x802e0)==0x75a7c and U(e,0x802e4)==0x68
 match(e,0x802e8,'b801000000')
 edge(e,0x802ed,0x6710f,b'\xe8')
 match(e,0x802f2,'ff0d7c5a0700')
 edge(e,0x802f8,0x803f6,bytes.fromhex('0f84'))
 # The selected object's +0x1A X is compared with camera X +159 and +/-6.
 match(e,0x802fe,'a1805a07000fbf401a0fbf1d2e43080081c39f000000')
 match(e,0x8031e,'8bc82bcbf7c1ffffffff7902f7d983f9067206')
 # The object callback is conditional on horizontal screen-center steering.
 match(e,0x80337,'ff156c5a0700')
 # Read selected object +0x14 dword, and stage it at 0x75A70.
 match(e,0x8033d,'a1805a0700528b50148915705a07005a')
 match(e,0x8034d,'f705705a0700ffffffff')
 assert e[0x80357:0x80359]==b'\x78\x8f' # JS -> 0x802E8 if negative
 assert 0x80359+struct.unpack_from('<b',e,0x80358)[0]==0x802e8 # JS target
 # Test Y-distance = selected object's signed Y - origin Y, threshold 0x60.
 match(e,0x80359,'a1805a07000fbf401e0fbf1dea4208002bc383f860')
 edge(e,0x8036e,0x802e8,bytes.fromhex('0f8c'))
 # If downward and >=96 screen rows, copy original object +0x14 DWORD
 # to exactly the 0x842E4 vertical motion increment used by O236.
 match(e,0x80374,'528b15705a07008915e44208005a')
 assert U(e,0x80377)==0x75a70 and U(e,0x8037d)==0x842e4
 edge(e,0x80382,0x802e8,b'\xe9')
 # Countdown exit and downstream fatality transition.
 match(e,0x803f6,'52a1805a0700528b5046')
 edge(e,0x8045b,0x8054a,b'\xe9')
 # Cross-check original 16.16 accumulator and screen high word (O236).
 match(e,0x93433,'a1e44208000105e8420800')
 match(e,0x8050b,'520fbf15ea420800')
 return {
  'fatality_predecessor':'0x80202: six-stage-list relative-coordinate conversion + camera velocity clear',
  'loop_entry':'0x802E8','task_yield_call':'0x802ED -> 0x6710F',
  'loop_count_initialized':104,'countdown_global':'0x75A7C','countdown_exit':'0x803F6',
  'selected_object_global':'0x75A80','object_x_field_signed_word':'0x1A',
  'horizontal_actor_vs_camera_center':{'stage_x_origin':'0x8432E','center_delta':159,'near_center_delta':6,'conditional_callback':'0x80337'},
  'object_motion_dword_offset':'0x14','object_motion_staging_global':'0x75A70',
  'skip_when_motion_negative':'0x8034D..0x80357 -> 0x802E8',
  'object_y_field_signed_word':'0x1E','camera_y_origin_word':'0x842EA',
  'stage_y_motion_gate':{'comparison':'signed(obj_y - screen_y_origin) >= 96','decision':'0x8036B..0x8036E'},
  'qualified_source_copy':'0x80375: global 0x75A70 -> 0x8037B: vertical-velocity global 0x842E4',
  'link_to_frame_accumulator':'0x93433 reads 0x842E4, adds to 0x842E8, whose high word is 0x842EA',
  'continue_to_lower_fatality':'0x8045B -> 0x8054A',
  'source_classification':'VERIFIED original code structure and arithmetic with two branch gates',
  'not_established':['which runtime actor instance is selected at 0x75A80','actual actor velocity values or executed branch counts','rendering-frame or task cadence','absolute pillar camera trajectory','whether FALL graphic58 is presented','original fully authenticated stage-fatality dispatcher']
 }
def main():
 a=argparse.ArgumentParser();a.add_argument('--game-zip',type=Path,required=True);a.add_argument('--out',type=Path,required=True);x=a.parse_args();assert not x.out.exists(),'Fresh result directory required'
 with zipfile.ZipFile(x.game_zip) as z:
  exe=z.read('mk2/mk2.exe');pit=z.read('mk2/pit.gra');fall=z.read('mk2/fall.gra')
 assert (H(exe),H(pit),H(fall))==(EXE,PIT,FALL),'Original canonical game sources only'
 source=verify(exe)
 tests=[('velocity_clear',0x8020a),('task_allocation',0x802d3),('countdown_value',0x802e5),('yield',0x802ee),('countdown_branch',0x802fa),('object_x_field',0x80306),('horizontal_threshold',0x8032e),('object_callback',0x80338),('object_velocity_field',0x80345),('velocity_staging',0x80348),('nonnegative_gate',0x80357),('object_y_field',0x80361),('screen_origin_y',0x80366),('96_row_threshold',0x8036d),('vertical_threshold_branch',0x80370),('source_motion_global',0x80377),('camera_velocity_global',0x8037d),('back_edge',0x80385),('next_phase_edge',0x8045c),('frame_accumulator_add',0x93439)]
 rejected=[]
 for label,p in tests:
  changed=bytearray(exe);changed[p]^=1
  try:verify(changed)
  except AssertionError:rejected.append(label)
  else:raise AssertionError('Source corruption not detected: '+label)
 assert len(rejected)==len(tests)
 report={'schema':'o237_pit_fatality_falling_actor_camera_follow_source_v1','canonical_input_sha256':{'exe':EXE,'pit':PIT,'fall':FALL},'source':source,'mutations_rejected':rejected}
 x.out.mkdir(parents=True)
 f=x.out/'O237_PIT_FALL_ACTOR_CAMERA_FOLLOW_SOURCE.json'
 f.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'file':str(f),'sha256':H(f.read_bytes()),'mutation_controls':len(rejected)},indent=2))
if __name__=='__main__':main()
