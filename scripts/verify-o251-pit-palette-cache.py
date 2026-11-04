#!/usr/bin/env python3
"""O251 read-only source: FALL palette shared across 54..60 and palette cache-hit branch."""
import argparse, hashlib, json, struct, zipfile
from pathlib import Path
H=lambda b:hashlib.sha256(b).hexdigest()
EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
FALL_SHA='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
O250_SHA='675b635c95c39ef712e5d8cd5d50d8492b217b3759ca508907d1e989c0afa1e5'
OPS={
 'cache_start_7b439':(0x7b439,'53 51 52 33 db'),
 'compare_cached_source_ptr_7b43e':(0x7b43e,'39 04 dd 00 5b 07 00'),
 'cache_hit_jump_7b445':(0x7b445,'0f 84 ac 00 00 00'),
 'cache_slot_advance_7b44b':(0x7b44b,'43 80 fb 3c 7c ed'),
 'cache_miss_begin_7b451':(0x7b451,'33 db ba 01 00 00 00'),
 'cache_miss_slot_empty_7b458':(0x7b458,'66 f7 04 dd 04 5b 07 00 ff ff'),
 'cache_miss_slot_empty_jump_7b462':(0x7b462,'74 23'),
 'cache_miss_enqueue_pending_flag_7b48f':(0x7b48f,'c7 05 e0 63 05 00 01 00 00 00'),
 'cache_miss_enqueue_reset_toggle_7b499':(0x7b499,'c7 05 d4 62 05 00 00 00 00 00'),
 'cache_miss_record_palette_7b4aa':(0x7b4aa,'89 04 dd 00 5b 07 00'),
 'cache_miss_record_start_index_7b4b1':(0x7b4b1,'88 14 dd 06 5b 07 00'),
 'cache_hit_entry_7b4f7':(0x7b4f7,'8b c3'),
 'cache_hit_reference_increment_7b4f9':(0x7b4f9,'66 ff 04 dd 04 5b 07 00'),
 'cache_release_check_slot_7b505':(0x7b505,'83 f8 3c 72 0a'),
 'cache_release_dec_ref_7b514':(0x7b514,'66 ff 0c c5 04 5b 07 00'),
 'cache_release_remove_on_zero_7b52a':(0x7b52a,'c7 04 c5 00 5b 07 00 00 00 00 00'),
 'frame_special_branch_6708c':(0x6708c,'f7 05 e0 63 05 00 ff ff ff ff'),
 'fall_selector_60_first_0xb4d84':(0xb4d84,'05 05 05 05 05 05 05 05 05 05 05 05'),
}
CALLS={'cache_new_queue':(0x7b4a3,0x7b2d0),'cache_adjusted_requeue':(0x7b4ed,0x7b2d0)}

def verify(b):
 for name,(at,s) in OPS.items():
  test=bytes.fromhex(s);assert b[at:at+len(test)]==test,(name,hex(at))
 for name,(at,d) in CALLS.items():
  assert b[at]==0xe8 and at+5+struct.unpack_from('<i',b,at+1)[0]==d,name
 refs=[]
 for sp in range(54,61):
  at=0xc3c40+(sp-54)*16
  desc=struct.unpack_from('<4I',b,at)
  assert desc[3]==0x27958 and (desc[2]>>24)==0x7b,(sp,'not shared palette')
  refs.append({'sprite':sp,'descriptor_physical':hex(at),'palette_field_physical':hex(at+12),
               'palette_object1_offset':hex(desc[3]),'source_gra_packed_ref':hex(desc[2])})
 # Cache hit jumps directly to EAX=slot index, reference increment, bypassing enqueue/dirty.
 assert 0x7b445+6+struct.unpack_from('<i',b,0x7b447)[0]==0x7b4f7
 assert 0x7b462+2+struct.unpack_from('<b',b,0x7b463)[0]==0x7b487
 assert len(set(e['palette_object1_offset'] for e in refs))==1
 return {'schema':'mk2_o251_shared_fall_palette_cache_hit_qualification_v1',
   'exe_sha256':EXE_SHA,'fall_sha256':FALL_SHA,
   'fall_descriptors':refs,'palette_object1_offset':'0x27958','palette_physical':'0x895AC',
   'source_cache':{'routine':'0x7B439','slot_count':60,'source_pointer_compare':'0x7B43E',
      'on_hit_jump':'0x7B445 -> 0x7B4F7','hit_refcount_increment':'0x7B4F9',
      'hit_queues_palette':False,'hit_sets_pending_flag':False,
      'on_miss_pending_palette_set':'0x7B48F',
      'on_miss_alternating_toggle_reset':'0x7B499',
      'on_miss_enqueue_palette':'0x7B4A3 -> 0x7B2D0',
      'release_refcount':'0x7B514','release_zero_clears_slot':'0x7B52A'},
   'source_instructions_checked':len(OPS),'direct_calls_checked':len(CALLS),
   'conclusions':['All seven special FALL.GRA descriptors 54–60 contain the exact same original palette pointer 0x27958 (physical source record 0x895AC).',
   'If this palette is already registered with positive reference count in the game palette cache, another request via 0x7B439 follows the hit branch and does not set 0x563E0 or enqueue a palette upload.',
   'An expired, freed, or overwritten palette-cache slot would instead permit the miss path; original wall object lifetime and live cache occupancy are not established.',
   'Therefore a new FALL sprite selected from the 60..55 sequence is not sufficient by itself to prove a fresh VGA palette upload or forced video-transfer branch.',
   'Source does not establish that the cache routine is invoked on every texture change, nor the live cache occupancy or display-timing path during the recordings.']}

def main():
 ap=argparse.ArgumentParser(); ap.add_argument('--game-zip',required=True,type=Path);ap.add_argument('--source-zip',required=True,type=Path);ap.add_argument('--out',required=True,type=Path)
 a=ap.parse_args();assert not a.out.exists()
 with zipfile.ZipFile(a.game_zip) as z:b=z.read('mk2/mk2.exe');f=z.read('mk2/fall.gra')
 assert H(b)==EXE_SHA and H(f)==FALL_SHA,'fixture mismatch'
 with zipfile.ZipFile(a.source_zip) as z:prior=z.read('MK-DOS-Archive/research_outputs/O250_PIT_PALETTE_FRAME_GATE_SOURCE.json')
 assert H(prior)==O250_SHA,'O250 predecessor mismatch'
 rep=verify(b);tamper=[]
 for name,(at,s) in OPS.items():
  x=bytearray(b);x[at+len(bytes.fromhex(s))-1]^=1
  try:verify(x)
  except AssertionError:tamper.append(name)
  else:raise AssertionError(name)
 for name,(at,d) in CALLS.items():
  x=bytearray(b);x[at+1]^=1
  try:verify(x)
  except AssertionError:tamper.append(name)
  else:raise AssertionError(name)
 for sp in range(54,61):
  x=bytearray(b);x[0xc3c40+(sp-54)*16+12]^=1
  try:verify(x)
  except AssertionError:tamper.append('FALL_sprite_'+str(sp)+'_palette_ref')
  else:raise AssertionError(str(sp))
 rep['rejected_mutation_controls']=tamper;rep['inherited_O250_report_sha256']=H(prior)
 a.out.mkdir(parents=True)
 path=a.out/'O251_PIT_FALL_SHARED_PALETTE_CACHE.json'
 path.write_text(json.dumps(rep,indent=2,sort_keys=True)+'\n')
 print(json.dumps({'report':str(path),'sha256':H(path.read_bytes()),'mutations_rejected':len(tamper)}))
if __name__=='__main__': main()
