#!/usr/bin/env python3
"""O241: read-only, bounded original MK2 fixed-point position integration.

Source authenticates position advance and its location in the frame-composition
path; does not infer the exact live fighter-list membership, gate state, FPS,
or a complete observed fatality trajectory.
"""
import argparse
import hashlib
import json
import struct
import zipfile
from pathlib import Path

HASH = {
 'exe':'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',
 'pit':'af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96',
 'fall':'60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0',
}
def sha(b): return hashlib.sha256(b).hexdigest()
def match(e,at,s):
 v=bytes.fromhex(s)
 assert e[at:at+len(v)]==v, f'original source mismatch {at:#x}'
def branch(e,at,ins,target):
 b=bytes.fromhex(ins)
 assert e[at:at+len(b)]==b, f'bad branch opcode {at:#x}'
 size=(1 if len(b)==1 and b[0] in (0x74,0x75,0x78,0x79) else 4)
 disp=struct.unpack_from('<b' if size==1 else '<i',e,at+len(b))[0]
 assert at+len(b)+size+disp==target, f'bad original branch target {at:#x}'

def verify(e):
 # Original signed 16.16 movement values from O239.
 match(e,0x801d0,'bb 00 00 f7 ff')
 match(e,0x801d5,'c7 05 64 5a 07 00 00 48 00 00')
 match(e,0x6395c,'89 5f 14')
 match(e,0x63969,'8b 15 64 5a 07 00 89 57 0c')
 # Pre-composition actor updater: velocity += acceleration.
 branch(e,0x9341b,'e8',0x93884)
 branch(e,0x9342e,'e8',0x93884)
 match(e,0x938b6,'8b 77 0c f7 c6 ff ff ff ff 74 08 8b 4f 14 03 ce 89 4f 14 c3')
 # Then original stage fixed-point camera moves before the list dispatch.
 match(e,0x93433,'a1 e4 42 08 00 01 05 e8 42 08 00')
 match(e,0x93539,'52 8b 15 de 62 07 00 89 15 88 5a 07 00 5a')
 # A live per-list cursor from 0x75A98 is advanced; the nonnegative entry
 # at 0x9358C selects the list head and enters the shared object walker.
 match(e,0x93547,'8b 0d 98 5a 07 00 8b 01 83 c1 04 a9 ff ff ff ff')
 match(e,0x9358c,'8b 31 83 c1 04 66 8b 36 66 89 35 68 5a 07 00')
 match(e,0x9359b,'89 0d 98 5a 07 00 8b e8')
 branch(e,0x935a3,'e8',0x93390)
 # Walker chooses next list object, then reaches movement code.
 match(e,0x93390,'8b 6d 00 85 ed')
 branch(e,0x93395,'0f 85',0x931e4)
 match(e,0x931e4,'0f b7 45 30 a3 7b 74 07 00 8b 7d 28 89 3d 94 74 07 00')
 # Movement gate: when global 0x75A88 is nonzero, both position additions
 # are skipped, but draw/other processing continues.
 match(e,0x931f6,'f7 05 88 5a 07 00 ff ff ff ff')
 branch(e,0x93200,'75',0x9320e)
 # Literal +0x10/+0x14 source velocities, +0x18/+0x1C destination positions.
 match(e,0x93202,'8b 5d 10 01 5d 18 8b 5d 14 01 5d 1c')
 match(e,0x9320e,'f7 05 d4 62 05 00 01 00 00 00')
 branch(e,0x93218,'0f 84',0x93390)
 # Main frame loop can conditionally invoke the same composition routine
 # in three distinct paths, and transfer to VGA does not have the same gate.
 for a in (0x6707b,0x670a2,0x670bd): branch(e,a,'e8',0x933c2)
 # Independently confirm stage-follow source reads existing owner velocity.
 match(e,0x8033d,'a1 80 5a 07 00 52 8b 50 14')
 match(e,0x80374,'52 8b 15 70 5a 07 00 89 15 e4 42 08 00 5a')
 v0=-9*65536; accel=0x4800
 assert struct.unpack_from('<i',e,0x801d1)[0]==v0
 assert struct.unpack_from('<I',e,0x801db)[0]==accel
 trajectories={}
 for rule in ('gravity_before_position','position_before_gravity'):
  v=v0; p=0; frames=[]
  for i in range(1,33):
   if rule=='gravity_before_position':v+=accel;p+=v
   else:p+=v;v+=accel
   if i in (1,8,16,31,32): frames.append({'integrations':i,'velocity_16_16':v,'relative_position_16_16':p,'velocity_pixels':v/65536,'displacement_pixels':p/65536})
  trajectories[rule]={'samples':frames,'displacement_after_32_integrations_pixels':p/65536}
 return {'positions':{'routine_entry':'0x931E4','entry_loop_from':'0x93395 -> 0x931E4','x_source':'object+0x10','x_destination':'object+0x18','y_source':'object+0x14','y_destination':'object+0x1C','arith':'signed wrapping 32-bit add (16.16 values in canonical use)','source_addresses':['0x93202','0x93205','0x93208','0x9320B']},'gating':{'skip_integrator_when':'global 0x75A88 != 0','gate_at':'0x931F6..0x93200','gate_value_loaded_from':'global 0x762DE at 0x9353A..0x93540','draw_flag_gate_separate':'global 0x562D4 bit 0 at 0x9320E','live_values_unresolved':True},'ordering_evidence':{'composition':'0x933C2','gravity_actor_calls':['0x9341B','0x9342E'],'camera_advance':'0x93433','object_iterator_in_same_composition':'0x935A3 -> 0x93390 -> 0x931E4 (for linked objects)','conditional_source_order':'actor acceleration before walker position advance along the qualified composition/list path','not_guaranteed':'the saved fatality task owner participates in both calls as same entity under all runtime gates'},'hypothetical_trajectory':{'notes':'Conditional arithmetic only: velocity=-9.0, acceleration=+0.28125, no other writes, exactly one gravity and position advance per event, both gates active. Neither order is claimed as live trajectory; actor/video frame cadence and initial position not known.','trajectories':trajectories},'confidence':{'source_arithmetic':'VERIFIED','frame_composition_order':'VERIFIED for linked code path','runtime_actor_membership':'UNKNOWN','gate_runtime_state':'UNKNOWN','timebase':'UNKNOWN; 50fps presentation observation is separate','fully_reconstructed_pillar_camera':'NOT YET'}}

def main():
 p=argparse.ArgumentParser()
 p.add_argument('--game-zip',type=Path,required=True)
 p.add_argument('--out',type=Path,required=True)
 a=p.parse_args()
 assert not a.out.exists(),'Use a fresh output directory'
 with zipfile.ZipFile(a.game_zip) as z:
  bs={k:z.read('mk2/'+n) for k,n in [('exe','mk2.exe'),('pit','pit.gra'),('fall','fall.gra')]}
 assert {k:sha(v) for k,v in bs.items()}==HASH,'Original MK2 fixture fingerprint changed'
 e=bs['exe']; result=verify(e)
 controls={
  'gravity_source':0x801d2,'gravity_increment':0x801db,'gravity_actor1_call':0x9341c,'gravity_actor2_call':0x9342f,
  'gravity_write':0x938c4,'stage_advance':0x93439,'draw_gate_origin':0x9353c,
  'walker_list':0x93548,'walker_descriptor':0x9358e,'walker_start_edge':0x935a4,
  'walker_next':0x93390,'walker_back_edge':0x93397,'walker_first_field':0x931e5,
  'walker_y_gate_address':0x931f8,'walker_y_gate_branch':0x93200,
  'object_x_velocity_field':0x93204,'object_x_add':0x93206,
  'object_y_velocity_field':0x9320a,'object_y_add':0x9320c,
  'render_gate':0x9320f,'render_branch':0x9321a,
  'frame_path_1':0x6707c,'frame_path_2':0x670a3,'frame_path_3':0x670be,'camera_owner_velocity':0x80344,
 }
 rejected=[]
 for name,off in controls.items():
  bad=bytearray(e);bad[off]^=1
  try:verify(bad)
  except AssertionError:rejected.append(name)
  else:raise AssertionError('Mutation was not detected: '+name)
 assert len(rejected)==len(controls)
 a.out.mkdir(parents=True)
 r=a.out/'O241_PIT_FALL_FIXED_POINT_POSITION_INTEGRATOR.json'
 r.write_text(json.dumps({'schema':'o241_pit_fall_position_integrator_original_source_v1','input_sha256':HASH,'source':result,'mutations_rejected':rejected},indent=2)+'\n')
 print(json.dumps({'report':str(r),'sha256':sha(r.read_bytes()),'mutation_controls':len(rejected)}))
if __name__=='__main__':main()
