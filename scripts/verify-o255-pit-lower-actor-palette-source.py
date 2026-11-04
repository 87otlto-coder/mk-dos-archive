#!/usr/bin/env python3
"""O255: identify lower-scene actor palette table domain, independently of PIT tiles."""
import hashlib,zipfile,struct,json,argparse
from pathlib import Path
H=lambda b:hashlib.sha256(b).hexdigest()
EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
FALL='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
OPS={
 'lower_actor_index_from_task':(0x8055b,'8b 46 60'),
 'lower_actor_create':(0x8056a,'e8 74 56 00 00'),
 'lower_actor_palette_primary_table':(0x85bfa,'b9 b8 c1 01 00'),
 'lower_actor_palette_mode_gate':(0x85c05,'83 fa 04 74 31'),
 'lower_actor_palette_alternate_selection':(0x85c36,'b9 fc c1 01 00'),
 'lower_actor_palette_index_x4':(0x85c3b,'c1 e0 02 03 c1'),
 'lower_actor_lookup_palette_source':(0x85c77,'8b 00'),
 'lower_actor_save_palette_slot':(0x85c7e,'66 89 47 30'),
 'lower_palette_force_via_existing_object':(0x74685,'56 8b 76 30'),
 'lower_palette_copy_source_to_existing_slot':(0x746c3,'89 04 dd 00 5b 07 00'),
 'lower_palette_force_pending':(0x746d5,'c7 05 e0 63 05 00 01 00 00 00'),
}
CALLS={
 'lower_actor_creation_call':(0x8056a,0x85be3),
 'lower_actor_palette_acquisition':(0x85c79,0x7b439),
 'lower_setup_other_palette_processing':(0x805ea,0x74685),
 'palette_queue_while_actor_recolor':(0x746d0,0x7b2d0),
}
OBJ2=0xa0c54

def check(b):
 for name,(p,hexb) in OPS.items():
  if b[p:p+len(bytes.fromhex(hexb))]!=bytes.fromhex(hexb):raise AssertionError(('op',name))
 for name,(p,d) in CALLS.items():
  if b[p]!=0xe8 or p+5+struct.unpack_from('<i',b,p+1)[0]!=d:raise AssertionError(('call',name))
 tables={}
 for name,off in [('primary',0x1c1b8),('alternate',0x1c1fc)]:
  x=[struct.unpack_from('<I',b,OBJ2+off+4*i)[0] for i in range(17)]
  if len(set(x))<12 or 0x27958 in x or not all(0x24000<=v<=0x2b000 for v in x):raise AssertionError(('table',name))
  tables[name]=[hex(v) for v in x]
 return {'schema':'mkdos_o255_lower_actor_palette_table_vs_shared_pit_palette_v1',
  'original_exe_sha256':EXE,'original_fall_sha256':FALL,
  'lower_actor_source_call':'0x8055B -> 0x8056A -> 0x85BE3 -> 0x85C79 -> 0x7B439',
  'lower_actor_palette_table_paths':['0x1C1B8','0x1C1FC'],
  'table_verified_first_17_source_pointers':tables,'wall_palette_pointer':'0x27958',
  'all_34_original_table_entries_differ_from_wall_palette':True,
  'additional_palette_queued_by_actor_mode':'0x805EA -> 0x74685 -> 0x746B7 -> 0x746D0/0x746D5',
  'limitations':['17 entries per table constitute a bounded source check, not proof of every possible fighter state or call-context index.',
   'The lower-scene actor does not acquire 0x27958 through these bounded 17-per-table palette records; other tasks or objects could still acquire that palette.',
   'The direct palette update helper can set pending state separately from the wall palette cache, so pending is not exclusively attributable to wall misses.']}

def main():
 pa=argparse.ArgumentParser();pa.add_argument('--game-zip',type=Path,required=True);pa.add_argument('--source-zip',type=Path,required=True);pa.add_argument('--out',type=Path,required=True);a=pa.parse_args();assert not a.out.exists()
 with zipfile.ZipFile(a.game_zip) as z:b=z.read('mk2/mk2.exe');f=z.read('mk2/fall.gra')
 assert (H(b),H(f))==(EXE,FALL)
 with zipfile.ZipFile(a.source_zip) as z:prev=z.read('MK-DOS-Archive/research_outputs/O251_PIT_FALL_SHARED_PALETTE_CACHE.json')
 assert H(prev)=='cc62364e19e4a01e1e21b6ee111fc1156ec4cb0e9fa8f802342f8a983ac8e1ec'
 r=check(b);rejected=[]
 for name,(p,h) in OPS.items():
  c=bytearray(b);c[p+len(bytes.fromhex(h))-1]^=1
  try:check(c)
  except AssertionError:rejected.append('op:'+name)
  else:raise AssertionError(name)
 for name,(p,d) in CALLS.items():
  c=bytearray(b);c[p+1]^=1
  try:check(c)
  except AssertionError:rejected.append('call:'+name)
  else:raise AssertionError(name)
 for name,p in [('table_primary',OBJ2+0x1c1b8),('table_alternate',OBJ2+0x1c1fc)]:
  c=bytearray(b);struct.pack_into('<I',c,p,0x27958)
  try:check(c)
  except AssertionError:rejected.append(name)
  else:raise AssertionError(name)
 r['rejected_mutations']=rejected;r['inherited_O251_sha256']=H(prev)
 a.out.mkdir(parents=True);dest=a.out/'O255_PIT_LOWER_ACTOR_PALETTE_SOURCE.json';dest.write_text(json.dumps(r,sort_keys=True,indent=2)+'\n')
 print(json.dumps({'report':str(dest),'sha256':H(dest.read_bytes()),'controls_rejected':len(rejected)}))
if __name__=='__main__':main()
