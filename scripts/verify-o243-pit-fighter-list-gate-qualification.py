#!/usr/bin/env python3
"""O243: read-only qualification of two original MK2 fighter slots, list insertion,
position gate, and Pit fatality task owner. Intentionally does not infer live state.
"""
import argparse,hashlib,json,struct,zipfile
from pathlib import Path
HASH={'exe':'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','pit':'af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96','fall':'60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'}
def sha(x):return hashlib.sha256(x).hexdigest()
def match(b,o,h):
 v=bytes.fromhex(h);assert b[o:o+len(v)]==v,hex(o)
def call(b,at,target):
 assert b[at]==0xe8,hex(at)
 d=struct.unpack_from('<i',b,at+1)[0];assert at+5+d==target,(hex(at),hex(target))
def verify(b):
 # Original two fighter allocations -> EDI created object, stored into the two
 # player globals. Each object is inserted through the same list append helper.
 for at in (0x77a62,0x77af3):call(b,at,0x85be3)
 match(b,0x77a67,'89 3d c2 5f 07 00')
 match(b,0x77af8,'89 3d 46 61 07 00')
 for at in (0x77ace,0x77b4e):call(b,at,0x646b4)
 match(b,0x646b4,'8b c7 e9 30 1f 00 00') # mov eax,edi; JMP list insertion
 assert 0x646b6+5+struct.unpack_from('<i',b,0x646b7)[0]==0x665eb
 # Verified frame-composition actor pointers, exact same global addresses.
 match(b,0x9340d,'8b 3d c2 5f 07 00')
 match(b,0x93413,'f7 c7 ff ff ff ff 74 05')
 call(b,0x9341b,0x93884)
 match(b,0x93420,'8b 3d 46 61 07 00')
 match(b,0x93426,'f7 c7 ff ff ff ff 74 05')
 call(b,0x9342e,0x93884)
 match(b,0x938b6,'8b 77 0c f7 c6 ff ff ff ff 74 08 8b 4f 14 03 ce 89 4f 14 c3')
 # This same frame path advances the vertical stage accumulator before the
 # gate is loaded; the gate therefore cannot suppress this addition itself.
 match(b,0x93433,'a1 e4 42 08 00 01 05 e8 42 08 00')
 match(b,0x934d1,'8b 15 74 5a 07 00 01 15 68 5a 07 00')
 match(b,0x934df,'8b 15 68 5a 07 00 89 15 e8 42 08 00')
 # Same composition loads the position-integrator gate, then iterates objects.
 match(b,0x93539,'52 8b 15 de 62 07 00 89 15 88 5a 07 00 5a')
 match(b,0x931f6,'f7 05 88 5a 07 00 ff ff ff ff 75 0c')
 match(b,0x93202,'8b 5d 10 01 5d 18 8b 5d 14 01 5d 1c')
 # Pit stage fatality registers task callback and copies EDI into task-owner slot.
 match(b,0x801b3,'ba ae e5 01 00');call(b,0x801b8,0x86ac3)
 match(b,0x801bd,'89 78 0c')
 # Scheduler restores saved task owner into EAX-visible callback global.
 match(b,0x8033d,'a1 80 5a 07 00 52 8b 50 14')
 # Direct gate writers and representative scoped yield gates.
 for p,v in [(0x7092c,0),(0x70bf2,1),(0x766a2,1),(0x768b8,1),(0x77100,1),(0x77621,1),(0x77635,0),(0x77644,1),(0x77e40,1),(0x77e4f,0)]:
  match(b,p,'33 c0 a3 de 62 07 00' if not v else 'b8 01 00 00 00 a3 de 62 07 00')
 # These stages only demonstrate localized state toggles around a task yield,
 # not active Pit state or a universal meaning for other callers.
 call(b,0x7763f,0x6710f)
 call(b,0x77e59,0x6710f)
 # Verify limited negative search scoped to the chosen Pit fatality entry and
 # fall-camera loop. This doesn't rule out indirect calls/state changes.
 direct_store=bytes.fromhex('a3 de 62 07 00')
 assert not any(b.find(direct_store,a,c)!=-1 for a,c in ((0x80137,0x80202),(0x80202,0x80460)))
 return {
 'source_fighter_slots':[{'index':1,'create_call':'0x77A62 -> 0x85BE3','store':'0x77A67 -> 0x75FC2','list_insert':'0x77ACE -> 0x646B4 -> 0x665EB','frame_consumer':'0x9340D -> 0x9341B -> 0x93884'}, {'index':2,'create_call':'0x77AF3 -> 0x85BE3','store':'0x77AF8 -> 0x76146','list_insert':'0x77B4E -> 0x646B4 -> 0x665EB','frame_consumer':'0x93420 -> 0x9342E -> 0x93884'}],
 'composition_gate':{'source_state':'0x762DE','copy_to':'0x75A88 at 0x9353A..0x93540','skip_when_nonzero':'0x931F6 -> 0x9320E','normal_position_adds':'0x93202..0x9320D','fighter_acceleration_precedes_gate':'0x9341B/0x9342E before 0x9353A','camera_accumulation_precedes_gate':'0x93433 and 0x934D1 before 0x9353A','implication':'gate affects walker position arithmetic; does not directly stop earlier actor acceleration or camera accumulation','writer_count_reproduced':10},
 'temporary_gate_pairs':[{'set_to_1':'0x77621','set_to_0':'0x77635','yield':'0x7763F','restore_1':'0x77644'},{'set_to_1':'0x77E40','set_to_0':'0x77E4F','yield':'0x77E59'}],
 'fatality_task':{'register':'0x801B8 -> 0x86AC3','saved_EDI':'0x801BD to task+0x0C','camera_owner_read':'0x8033D from 0x75A80','scope_no_direct_gate_A3_store':'0x80137..0x80460'},
 'confidence':{'fighter_global_to_allocator_to_list_to_frame_consumer':'VERIFIED source edges','live_fatality_owner_matches_slot':'UNKNOWN, register EDI alone does not prove source slot membership at fatality invocation','gate_value_during_fall':'UNKNOWN, no direct writer in bounded fatality region is not a full runtime proof','position_integrator_runs_for_fall':'CONDITIONAL, not established'} }

def main():
 a=argparse.ArgumentParser();a.add_argument('--game-zip',type=Path,required=True);a.add_argument('--out',type=Path,required=True);s=a.parse_args()
 assert not s.out.exists(),'output must be new'
 with zipfile.ZipFile(s.game_zip) as z: d={k:z.read('mk2/'+n) for k,n in [('exe','mk2.exe'),('pit','pit.gra'),('fall','fall.gra')]}
 assert {k:sha(v) for k,v in d.items()}==HASH
 b=d['exe']; result=verify(b)
 mutations={'create_p1':0x77a63,'create_p2':0x77af4,'store_p1':0x77a69,'store_p2':0x77afa,'insert_p1':0x77acf,'insert_p2':0x77b4f,'insert_helper':0x646b5,'insert_jump':0x646b7,'consumer_p1':0x9340f,'consumer_p2':0x93422,'call_p1':0x9341c,'call_p2':0x9342f,'gravity_add':0x938c4,'camera_stage_add':0x93439,'camera_second_add':0x934d8,'camera_writeback':0x934e7,'gate_copy':0x9353c,'walker_gate':0x931fc,'walker_add':0x9320c,'task_callback':0x801b5,'task_register':0x801b9,'owner_save':0x801be,'owner_read':0x8033e,'timed_writer':0x70bf8,'turn_on_1':0x77627,'turn_off_1':0x77638,'turn_on_2':0x7764a,'turn_on_3':0x77e46,'turn_off_2':0x77e52,'yield_1':0x77640,'yield_2':0x77e5a}
 rejected=[]
 for key,i in mutations.items():
  c=bytearray(b);c[i]^=1
  try:verify(c)
  except AssertionError:rejected.append(key)
  else:raise AssertionError('Mutation not detected: '+key)
 s.out.mkdir(parents=True)
 fn=s.out/'O243_PIT_FALL_FIGHTER_SLOT_AND_GATE_PATH.json'
 fn.write_text(json.dumps({'schema':'o243_pit_fall_slot_gate_path_v1','canonical_fixture_sha256':HASH,'findings':result,'mutations_rejected':rejected},indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'report':str(fn),'sha256':sha(fn.read_bytes()),'controls_rejected':len(rejected)}))
if __name__=='__main__':main()
