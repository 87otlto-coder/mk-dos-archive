#!/usr/bin/env python3
"""O240: bounded read-only original-source gravity-consumer qualification.

Establishes the 16.16 falling-object acceleration, direct frame-composition
call edges and conditional camera gate. Does not assume that a frame composition
is a presented frame, or that the scheduled owner is definitely one of the two
active fighter globals in every phase.
"""
import argparse, hashlib, json, struct, zipfile
from pathlib import Path

HASHES = {
 'exe':'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',
 'pit':'af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96',
 'fall':'60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0',
}
def sha(b): return hashlib.sha256(b).hexdigest()
def match(e,off,h):
 x=bytes.fromhex(h)
 assert e[off:off+len(x)]==x, f'original bytes mismatch {off:#x}'
def rel(e,at,target):
 assert e[at]==0xe8 and at+5+struct.unpack_from('<i',e,at+1)[0]==target, f'call edge mismatch {at:#x}'
def verify(e):
 # Prior O239 caller and callee -- exact original motion initialization.
 match(e,0x801d0,'bb 00 00 f7 ff')
 match(e,0x801d5,'c7 05 64 5a 07 00 00 48 00 00')
 match(e,0x6395c,'89 5f 14')
 match(e,0x6395f,'83 3d 64 5a 07 00 0d 74 0b')
 match(e,0x63969,'8b 15 64 5a 07 00')
 match(e,0x6396f,'89 57 0c')
 # O238 registered camera task, O237 velocity consumer / camera conditions.
 match(e,0x801bd,'89 78 0c')
 match(e,0x80343,'8b 50 14')
 match(e,0x8034d,'f7 05 70 5a 07 00 ff ff ff ff 78 8f')
 match(e,0x8036b,'83 f8 60')
 match(e,0x8037b,'89 15 e4 42 08 00')
 # Original frame-composition calls the same actor updater for each available
 # main fighter pointer; both conditions are checked.
 match(e,0x933c2,'f7 05 d4 62 05 00 01 00 00 00')
 match(e,0x9340d,'8b 3d c2 5f 07 00')
 match(e,0x93413,'f7 c7 ff ff ff ff 74 05')
 rel(e,0x9341b,0x93884)
 match(e,0x93420,'8b 3d 46 61 07 00')
 match(e,0x93426,'f7 c7 ff ff ff ff 74 05')
 rel(e,0x9342e,0x93884)
 match(e,0x93884,'0f b7 4f 1a')
 # Both x-limit paths converge on gravity tail; 0x9389E can jump directly to
 # 0x938B6 when no clamp is required.
 match(e,0x9389e,'3b cb 7c 14')
 match(e,0x938b6,'8b 77 0c f7 c6 ff ff ff ff 74 08 8b 4f 14 03 ce 89 4f 14 c3')
 # Distinguish composition calls from actual frame presentation. Frame loop
 # can reach composition by multiple conditions.
 for p in (0x6707b,0x670a2,0x670bd):rel(e,p,0x933c2)
 # The stage camera gets its separately accumulated vertical motion.
 match(e,0x93433,'a1 e4 42 08 00 01 05 e8 42 08 00')
 match(e,0x934b5,'8b 15 e4 42 08 00')
 match(e,0x934d1,'8b 15 74 5a 07 00')
 v0=struct.unpack_from('<i',e,0x801d1)[0]
 accel=struct.unpack_from('<I',e,0x801db)[0]
 assert v0==-9*65536 and accel==0x4800
 vals=[(n,(v0+n*accel)/65536) for n in range(33)]
 assert vals[31][1]<0 and vals[32][1]==0
 return {
 'original_binary_motion': {'motion_setup_at':'0x801D0', 'velocity_initial_s16_16':v0,'initial_pixels_per_update_if_applicable':v0/65536,'increment_s16_16':accel,'increment_per_integration':accel/65536,'shared_initializer':'0x63940','velocity_field':'object+0x14','increment_field':'object+0x0C'},
 'frame_composition_calls': {'composition_entry':'0x933C2','available_actor_1_global':'0x75FC2','available_actor_2_global':'0x76146','first_actor_call':'0x9341B -> 0x93884','second_actor_call':'0x9342E -> 0x93884','caller_edges_from_shared_loop':['0x6707B','0x670A2','0x670BD'],'caveat':'Actor update occurs on active-pointer paths in composition routine, not necessarily once per displayed refresh'},
 'velocity_integration':{'function':'0x93884','tail':'0x938B6..0x938C9','test':'nonzero object+0x0C','update':'signed wraparound dword object+0x14 += object+0x0C','explanation':'Velocity increments exactly by 0x4800 for the canonical initializer unless the fields are modified elsewhere'},
 'camera_gate':{'owner_velocity_read':'0x80343','nonnegative_gate':'0x8034D','vertical_screen_relative_threshold_pixels':96,'stage_velocity_store':'0x8037B -> 0x842E4','stage_accumulator_update':'0x93433..0x934EB'},
 'conditional_prediction':{'velocity_negative_after_31_updates':vals[31][1], 'velocity_zero_after_32_updates':vals[32][1], 'updates_to_nonnegative':32,'nominal_seconds_if_one_update_per_50hz_presentation':32/50,'caveat':'No assertion that these are exact runtime game-frame or display durations'},
 'confidence':{'byte_edges':'VERIFIED original source','per-composition_increment':'VERIFIED conditional code behavior','32_update_prediction':'DEDUCED conditional arithmetic','displayed_0_64_seconds':'HYPOTHESIS; unverified correspondence'},
 'not_proven':['Owner task is guaranteed to be a main fighter global on every update','Exact actor 16.16 position advance and original tick rate','Physically displayed camera trajectory','Visibility of graphic 58']}

def main():
 a=argparse.ArgumentParser();a.add_argument('--game-zip',type=Path,required=True);a.add_argument('--out',type=Path,required=True);p=a.parse_args()
 assert not p.out.exists(),'Fresh output directory required'
 with zipfile.ZipFile(p.game_zip) as z:
  bb={k:z.read('mk2/'+name) for k,name in [('exe','mk2.exe'),('pit','pit.gra'),('fall','fall.gra')]}
 assert {k:sha(x) for k,x in bb.items()}==HASHES,'Original fixture fingerprint changed'
 res=verify(bb['exe']); e=bb['exe']
 probes={'v0_imm':0x801d2,'increment_imm':0x801db,'v_write':0x6395d,'a_write':0x63970,'actor1':0x9340f,'actor1_branch':0x93414,'actor1_call':0x9341c,'actor2':0x93421,'actor2_branch':0x93427,'actor2_call':0x9342f,'gravity_read':0x938b7,'gravity_nonzero':0x938ba,'gravity_skip':0x938bf,'velocity_read':0x938c2,'gravity_add':0x938c4,'velocity_store':0x938c7,'camera_gate':0x8036d,'camera_store':0x8037e,'frame_entry':0x933c3,'present_path_a':0x6707c,'present_path_b':0x670a3,'present_path_c':0x670be,'accumulator':0x93439}
 rejects=[]
 for name,i in probes.items():
  x=bytearray(e);x[i]^=1
  try: verify(x)
  except AssertionError: rejects.append(name)
  else:raise AssertionError(f'control undetected: {name}')
 assert len(rejects)==len(probes)
 p.out.mkdir(parents=True)
 target=p.out/'O240_PIT_FALL_GRAVITY_CONSUMER.json'
 target.write_text(json.dumps({'schema':'o240_pit_fall_gravity_consumer_source_v1','fixture_sha256':HASHES,'source':res,'mutations_rejected':rejects},indent=2)+'\n')
 print(json.dumps({'report':str(target),'sha256':sha(target.read_bytes()),'mutation_controls':len(rejects)}))
if __name__=='__main__':main()
