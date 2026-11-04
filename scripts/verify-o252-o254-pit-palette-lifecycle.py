#!/usr/bin/env python3
"""O252-O254 bounded read-only verification of Pit II palette lifetime and presentation.
Original EXE source assertions, typed prior-research inputs, mutation controls,
conditional cache lifetime models. Does NOT execute DOS, claim runtime cache state,
or mutate proprietary files.
"""
import argparse, hashlib, json, struct, zipfile
from pathlib import Path
sha=lambda data:hashlib.sha256(data).hexdigest()
EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
FALL='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
OLD='cc62364e19e4a01e1e21b6ee111fc1156ec4cb0e9fa8f802342f8a983ac8e1ec'
OLDNAME='MK-DOS-Archive/research_outputs/O251_PIT_FALL_SHARED_PALETTE_CACHE.json'
# The main opcode/call checks are deliberately paired with explicit dataflow conditions.
OPS={
 'wall_removal_tag':(0x80733,'b8 0b 07 00 00'),
 'mask_remove_entry':(0x86bb1,'bb ff ff ff ff'),
 'tag_match_start':(0x86c66,'8b cf 8b 39 85 ff 74 2a'),
 'tag_compare':(0x86c6e,'0f b7 57 40 23 d3 3b d0'),
 'removed_object_palette_slot':(0x86c79,'0f b7 47 30'),
 'unlink_matching_object':(0x86c82,'8b 07 89 01'),
 'return_object_to_pool':(0x86c86,'a1 a6 5f 07 00 89 07 89 3d a6 5f 07 00'),
 'wall_new_descriptor_seed':(0x80751,'89 15 6c 5a 07 00'),
 'tile_new_object_creation_loop':(0x8075f,'8b 13 83 c3 04 83 fa ff 74 2d'),
 'tag_new_object':(0x8078e,'66 c7 47 40 0b 07'),
 'advance_every_step':(0x80796,'ff 05 6b 37 01 00'),
 'object_descriptor_palette_source':(0x640b8,'8b 1d 6c 5a 07 00 8b 43 0c'),
 'conditional_object_palette_acquire':(0x640c2,'83 f8 00 74 09'),
 'object_palette_slot_saved':(0x640cc,'66 89 47 30'),
 'palette_release_via_object_slot':(0x7b3f9,'0f b7 40 30'),
 'cache_release_decrement':(0x7b514,'66 ff 0c c5 04 5b 07 00'),
 'cache_release_clear_if_zero':(0x7b528,'7f 0b c7 04 c5 00 5b 07 00 00 00 00 00'),
 'cache_hit_source_pointer_compare':(0x7b43e,'39 04 dd 00 5b 07 00'),
 'cache_miss_empty_slot_test':(0x7b458,'66 f7 04 dd 04 5b 07 00 ff ff'),
 'palette_miss_pending_upload':(0x7b48f,'c7 05 e0 63 05 00 01 00 00 00'),
 'palette_miss_toggle_reset':(0x7b499,'c7 05 d4 62 05 00 00 00 00 00'),
 'palette_cache_hit_ref_inc':(0x7b4f9,'66 ff 04 dd 04 5b 07 00'),
 'cache_initializer_zeroes_120_words':(0x7b427,'bf 00 5b 07 00 b9 78 00 00 00 33 c0 f3 ab'),
 'stage_reset_clears_actor_slot1':(0x64674,'33 c0 a3 c2 5f 07 00'),
 'stage_reset_clears_actor_slot2':(0x6467b,'a3 46 61 07 00'),
 'object_reset_head1':(0x81b1b,'33 c0 a3 5c 43 08 00'),
 'object_reset_head2':(0x81b2c,'a3 48 43 08 00'),
 'object_reset_head3':(0x81b45,'a3 34 43 08 00'),
 'object_reset_pool_initialization':(0x66da7,'bb a4 74 07 00 89 1d a6 5f 07 00'),
 'lower_actor_created_after_reset':(0x8056a,'e8 74 56 00 00'),
 'lower_palette_record_setup':(0x80590,'b8 40 3d 01 00'),
 'lower_selector_initialization':(0x805a6,'c7 05 6b 37 01 00 00 00 00 00'),
 'lower_palette_mode_set':(0x805b0,'b8 05 00 00 00 a3 e8 5c 07 00'),
 'lower_frame_list_set':(0x805c4,'b8 0c 41 01 00 a3 f6 5c 07 00'),
 'palette_force_gate':(0x6708c,'f7 05 e0 63 05 00 ff ff ff ff'),
 'palette_force_toggle_one':(0x67098,'c7 05 d4 62 05 00 01 00 00 00'),
 'palette_force_toggle_zero':(0x670b1,'c7 05 d4 62 05 00 00 00 00 00'),
 'normal_toggle_copy_gate':(0x670c7,'f7 05 d4 62 05 00 01 00 00 00'),
 'DAC_clear_pending_after_flush':(0x7b3ed,'c7 05 e0 63 05 00 00 00 00 00'),
 'frame_controller_toggles':(0x67050,'83 35 d4 62 05 00 01'),
}
CALLS={
 'wall_remove':(0x80738,0x86bb1,0xe8),
 'mask_remover':(0x86bb6,0x86c3f,0xe9),
 'first_object_list':(0x86c49,0x86c66,0xe8),
 'second_object_list':(0x86c53,0x86c66,0xe8),
 'third_object_list':(0x86c5d,0x86c66,0xe8),
 'removed_tile_releases_palette':(0x86c7d,0x7b505,0xe8),
 'new_wall_object':(0x80771,0x64548,0xe8),
 'new_wall_object_commit':(0x80789,0x646b4,0xe8),
 'new_object_setup':(0x64548,0x64522,0xe8),
 'new_object_allocate':(0x64522,0x640a4,0xe8),
 'new_object_palette_acquire':(0x640c7,0x7b439,0xe8),
 'release_cache':(0x7b3fd,0x7b505,0xe8),
 'palette_miss_queue':(0x7b4a3,0x7b2d0,0xe8),
 'first_reset_from_fatality':(0x80436,0x64685,0xe8),
 'reset_wrapper':(0x64685,0x64695,0xe8),
 'reset_second':(0x6468a,0x6664d,0xe8),
 'reset_palette_entry':(0x64695,0x64659,0xe8),
 'reset_cache_first':(0x64659,0x7b41f,0xe8),
 'reset_cache_second_chain':(0x64680,0x66d04,0xe9),
 'reset_cache_second':(0x66d51,0x7b41f,0xe8),
 'reset_stage_heads_first':(0x6466f,0x81b18,0xe8),
 'reset_stage_heads_second':(0x66d76,0x81b18,0xe8),
 'resume_lower_after_yield':(0x8045b,0x8054a,0xe9),
 'yield_before_lower':(0x80451,0x6710f,0xe8),
 'selector_once_per_pass':(0x805fe,0x80721,0xe8),
 'one_wait_before_selector':(0x805f9,0x6710f,0xe8),
 'pending_DAC_retrace':(0x670a7,0x7b30b,0xe8),
 'forced_frame_transfer':(0x670ac,0x65420,0xe8),
 'DAC_queue_flush':(0x7b4a3,0x7b2d0,0xe8),
}

def assert_original(b):
 for label,(p,hexb) in OPS.items():
  expect=bytes.fromhex(hexb)
  if b[p:p+len(expect)]!=expect:raise AssertionError(('opcode',label,hex(p)))
 for label,(p,target,op) in CALLS.items():
  if b[p]!=op or p+5+struct.unpack_from('<i',b,p+1)[0]!=target:
   raise AssertionError(('call',label,hex(p)))
 # Tag remover iterates three non-upper-background heads only.
 heads=[struct.unpack_from('<I',b,x)[0] for x in (0x86c45,0x86c4f,0x86c59)]
 if heads!=[0x84358,0x84360,0x84364]:raise AssertionError(('removal_heads',heads))
 # Lower scene's fixed command list excludes six upper-stage heads but includes tagged wall list.
 lower=0xa0c54+0x1410c
 listed=[struct.unpack_from('<I',b,lower+8*i)[0] for i in range(4)]
 if listed!=[0x8434c,0x84350,0x84358,0x84360]:raise AssertionError(('lower_heads',listed))
 seq=b[0xb4d84:0xb4da5]
 if seq!=bytes([5]*12+[4]*6+[3]*5+[2]*4+[1]*3+[0]*2+[255]):raise AssertionError('selector')
 # O225 three grids: source four-byte packed coordinate pairs terminated by 0xffffffff.
 group_count={0x14181:15,0x141c1:15,0x14201:20}
 for stream,count in group_count.items():
  at=0xa0c54+stream
  if struct.unpack_from('<I',b,at+count*4)[0]!=0xffffffff:raise AssertionError(('grid_end',hex(stream)))
  if any(struct.unpack_from('<I',b,at+i*4)[0]==0xffffffff for i in range(count)):raise AssertionError(('early_grid_end',hex(stream)))
 expected_ptrs=[0x14181,0x141c1,0x14201,0x14181,0x14181,0x14181]
 # Source selector array index maps 0..5 to sprite55..60, check actual descriptor grids using canonical pairs.
 real_ptrs=[struct.unpack_from('<I',b,0xa0c54+0x14155+8*i)[0] for i in range(6)]
 if real_ptrs!=expected_ptrs:raise AssertionError(('grid_map',real_ptrs))
 return {'heads':heads,'lower_renderer_heads':listed,'selector':list(seq[:-1]),'counts_by_sprite':{str(55+i):group_count[x] for i,x in enumerate(real_ptrs)}}

def branch_model(seq,grid_counts,external_holders):
 # A strict *conditional* abstraction: every new object refers to the same Pit pointer;
 # there are external_holders surviving across the 32 selector steps.
 ref=external_holders;misses=hits=clearings=created=0;row=[]
 for step,index in enumerate(seq):
  old_count=grid_counts[str(55+seq[step-1])] if step else 0
  if old_count:
   ref-=old_count
   if ref==0:clearings+=1
  if ref<0:raise AssertionError('bad model')
  count=grid_counts[str(55+index)]
  miss=(ref==0)
  if miss:misses+=1
  else:hits+=1
  # Only the first tile of a new group may miss; all subsequent tiles hit.
  hits+=count-1
  ref+=count
  created+=count
  row.append({'step':step,'sprite':55+index,'old_removed':old_count,'new_created':count,
   'first_tile_cache_miss':miss,'cache_refcount_after_group':ref})
 return {'model_external_persistent_Pit_palette_holders':external_holders,
   'model_cache_misses':misses,'model_cache_hits':hits,
   'cache_zero_events':clearings,'total_created_wall_objects':created,
   'refcount_after_final_step':ref,'per_step':row}

def reports(b,base):
 shared=assert_original(b)
 # Count retained *external* palette holders deliberately as a model variable, not a measured fact.
 models=[branch_model(shared['selector'],shared['counts_by_sprite'],n) for n in (0,1,2)]
 evidence={'fixture_sha256':EXE,'fall_sha256':FALL,'original_source_opcode_checks':len(OPS),'original_rel32_checks':len(CALLS)}
 a={**evidence,'schema':'mkdos_o252_pit_wall_object_palette_release_and_reacquire_v1',
   'paths':{'tag_removal':'0x80733 -> 0x86BB1 -> 0x86C3F -> 0x86C66 -> 0x7B505',
    'per_object_release':'0x86C79 loads object+0x30 palette-slot -> 0x7B505 decrements count, clears source pointer on zero',
    'creation':'0x80771 -> 0x64548 -> 0x64522 -> 0x640A4 -> 0x7B439 -> object+0x30',
    'per_step_removal_and_recreation':'0x80721 removes tag 0x70B prior to regenerating object group on every selector entry'},
   'selector_steps':len(shared['selector']),'wall_objects_created_in_source_iteration_model':models[0]['total_created_wall_objects'],
   'original_tile_counts_by_sprite':shared['counts_by_sprite'],
   'limitations':['Object deletion releases cached palette references. This does NOT alone prove a cache miss if other live objects have the same pointer.',
       '500 objects is the count produced by following the authenticated 32 source entries and coordinate-list sizes once, not a measured runtime allocation count.']}
 bb={**evidence,'schema':'mkdos_o253_pit_fatality_palette_and_object_pool_double_reset_v1',
     'paths':{'entry':'0x80436 -> 0x64685 -> 0x64695 -> 0x64659 -> 0x7B41F',
      'reset_first_object_lists':'0x6466F -> 0x81B18',
      'reset_2':'0x64680 -> 0x66D04 -> 0x66D51 -> 0x7B41F',
      'reset_2_object_lists':'0x66D76 -> 0x81B18',
      'fresh_object_pool':'0x66D7B..0x66DC9 (free list chain rebuilt)',
      'later_lower_scene':'0x8045B -> 0x8054A; 0x8056A new character; 0x805FE wall selector'},
     'cache_initializer':'0x7B41F zeros 120 dwords = 60 8-byte entries and reinitializes palette-queue via 0x7B2C0',
     'original_palette_pointer':'0x27958',
     'additional_pre_selector_palette_owner_possible':True,
     'yield_between_reset_and_lower_scene':True,
     'limitations':['The two source-call chains are real, but the interposed yield allows unrelated tasks to execute before lower scene setup.',
     'The original upper-stage palette references cannot be inferred to remain cached across the reset; other post-reset owners have not been ruled out.',
     'The reset rebuilds storage; it is not evidence every prior palette received a deallocation callback.']}
 cc={**evidence,'schema':'mkdos_o254_pit_palette_lifetime_conditional_frame_presentation_v1',
    'conditional_cache_models':models,
    'allocator_on_miss':{'sets_pending_palette':'0x7B48F','resets_toggle':'0x7B499','enqueues_DAC_command':'0x7B4A3 -> 0x7B2D0'},
    'allocator_on_hit':{'increases_refcount':'0x7B4F9','queues_upload':False},
    'presentation':{'pending_gate':'0x6708C','forced_composite':'0x670A2','flush_queue':'0x670A7 -> 0x7B30B',
      'transfer':'0x670AC -> 0x65420','clear_pending_after_DAC':'0x7B3ED',
      'normal_alternating_gate':'0x670C7'},
    'implications':['With zero unrelated Pit palette references, each of the 32 replacement groups can fully release and reacquire the same source palette, producing 32 cache misses in this conditional model, even when the graphic does not change.',
       'With one or more independent persistent palette references, all new wall tile acquisitions are cache hits in the same conditional model.',
       'A miss flags a pending DAC update, which may cause the frame controller to take the forced-transfer branch if the flag is pending at the controller gate.',
       'Neither cache occupancy nor exact controller branch at each real-time presentation has been observed. The models cannot determine which DOSBox recording frames correspond to individual selector steps.']}
 return a,bb,cc

def main():
 p=argparse.ArgumentParser();p.add_argument('--game-zip',type=Path,required=True);p.add_argument('--source-zip',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
 a=p.parse_args();assert not a.out.exists(),'Do not overwrite existing evidence'
 with zipfile.ZipFile(a.game_zip) as z:b=z.read('mk2/mk2.exe'); f=z.read('mk2/fall.gra')
 assert (sha(b),sha(f))==(EXE,FALL),'Wrong original fixture'
 with zipfile.ZipFile(a.source_zip) as z:prior=z.read(OLDNAME)
 assert sha(prior)==OLD,'Wrong inherited O251 source'
 rr=reports(b,None)
 # Independent mutation rejection for all directly tested instruction/call relationships.
 rejected=[]
 for label,(off,expected) in OPS.items():
  edited=bytearray(b); edited[off+len(bytes.fromhex(expected))-1]^=1
  try:assert_original(edited)
  except AssertionError:rejected.append('opcode:'+label)
  else:raise AssertionError('Missed mutation '+label)
 for label,(off,dest,op) in CALLS.items():
  edited=bytearray(b);edited[off+1]^=1
  try:assert_original(edited)
  except AssertionError:rejected.append('call:'+label)
  else:raise AssertionError('Missed mutation '+label)
 for label,off in [('selector_first',0xb4d84),('selector_final',0xb4da3),('lower_list',0xa0c54+0x1410c),('wall_grid_map',0xa0c54+0x14155)]:
  edited=bytearray(b);edited[off]^=1
  try:assert_original(edited)
  except AssertionError:rejected.append('structure:'+label)
  else:raise AssertionError('Missed mutation '+label)
 assert len(rejected)==len(OPS)+len(CALLS)+4
 a.out.mkdir(parents=True)
 names=['O252_PIT_TAGGED_WALL_PALETTE_LIFETIME.json','O253_PIT_DOUBLE_RESET_AND_LOWER_PHASE.json','O254_PIT_CONDITIONAL_PALETTE_PRESENTATION_MODEL.json']
 result={}
 for idx,(name,rep) in enumerate(zip(names,rr)):
  rep['inherited_O251_sha256']=sha(prior)
  rep['control_count_total']=len(rejected)
  rep['rejected_controls']=rejected
  blob=json.dumps(rep,indent=2,sort_keys=True)+'\n'
  path=a.out/name;path.write_text(blob)
  result[name]={'bytes':len(blob),'sha256':sha(path.read_bytes())}
 print(json.dumps({'generated':result,'controls_rejected':len(rejected),'model_zero_holder_misses':rr[2]['conditional_cache_models'][0]['model_cache_misses'],'object_creation_count':rr[0]['wall_objects_created_in_source_iteration_model']}))
if __name__=='__main__':main()
