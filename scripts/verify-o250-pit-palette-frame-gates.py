#!/usr/bin/env python3
"""O250: read-only, original-source qualification of MK2 frame-gate writers and DAC palette queue.

No assumption is made that a particular branch or flag value was active in the owner's
Pit II runtime recordings. Static source behavior and conditional consequences only.
"""
import argparse,hashlib,json,struct,zipfile
from pathlib import Path
sha=lambda b:hashlib.sha256(b).hexdigest()
EXPECTED_EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
EXPECTED_FALL='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
OLD_SHA='73cd71592b0193125c27133276f1207333571cfd095e59d285ec6ebf6907bc6c'
OLD_FILE='MK-DOS-Archive/research_outputs/O249_PIT_FRAME_CONTROLLER_PRESENTATION_BRANCHES.json'
# Original physical offsets: exact individual machine-instruction gates and side-effects.
OPS={
 'render_disable_entry_650ce': (0x650ce,'c7 05 f2 5c 07 00 00 00 00 00'),
 'render_enable_entry_650d9': (0x650d9,'c7 05 f2 5c 07 00 01 00 00 00'),
 'render_clear_8678e': (0x8678e,'a3 f2 5c 07 00'),
 'render_clear_9d610': (0x9d610,'c7 05 f2 5c 07 00 00 00 00 00'),
 'render_enable_9d66c': (0x9d66c,'c7 05 f2 5c 07 00 01 00 00 00'),
 'render_enable_9e3e0': (0x9e3e0,'c7 05 f2 5c 07 00 01 00 00 00'),
 'mode_initial_2_651ba': (0x651ba,'c7 05 4c 01 03 00 02 00 00 00'),
 'mode_3_temp_A_9b284': (0x9b284,'c7 05 4c 01 03 00 03 00 00 00'),
 'mode_3_temp_B_9b2de': (0x9b2de,'c7 05 4c 01 03 00 03 00 00 00'),
 'mode_restore_A_9b2a4': (0x9b2a4,'89 15 4c 01 03 00'),
 'mode_restore_B_9b2fe': (0x9b2fe,'89 15 4c 01 03 00'),
 'mode_save_A_9b277': (0x9b277,'8b 15 4c 01 03 00'),
 'mode_save_B_9b2d1': (0x9b2d1,'8b 15 4c 01 03 00'),
 'palette_queue_init_7b2c0':(0x7b2c0,'b8 d8 62 05 00'),
 'palette_queue_enqueue_7b2d1':(0x7b2d1,'8b 0d dc 63 05 00'),
 'palette_queue_write_record_7b2d7':(0x7b2d7,'89 01 66 89 51 04 66 89 59 06'),
 'palette_queue_move_write_7b2f1':(0x7b2f1,'89 0d dc 63 05 00'),
 'palette_queue_start_at_retrace_7b373':(0x7b373,'8b 2d d8 63 05 00 8b 1d dc 63 05 00'),
 'palette_command_fetch_7b381':(0x7b381,'0f b7 4d 06 8b 75 00 0f b7 7d 04'),
 'palette_dac_index_port_7b3a4':(0x7b3a4,'ba c8 03 00 00'),
 'palette_dac_index_write_7b3a9':(0x7b3a9,'8b c7 ee 42'),
 'palette_dac_rgb_word_7b3b1':(0x7b3b1,'66 ad'),
 'palette_dac_rgb_r_write_7b3bc':(0x7b3bc,'ee'),
 'palette_dac_rgb_g_write_7b3c8':(0x7b3c8,'ee'),
 'palette_dac_rgb_b_write_7b3d3':(0x7b3d3,'ee'),
 'palette_queue_commit_read_7b3e7':(0x7b3e7,'89 2d d8 63 05 00'),
 'palette_pending_clear_7b3ed':(0x7b3ed,'c7 05 e0 63 05 00 00 00 00 00'),
 'palette_pending_set_746d5':(0x746d5,'c7 05 e0 63 05 00 01 00 00 00'),
 'palette_pending_set_76c58':(0x76c58,'c7 05 e0 63 05 00 01 00 00 00'),
 'palette_pending_set_7b48f':(0x7b48f,'c7 05 e0 63 05 00 01 00 00 00'),
 'palette_pending_set_94f97':(0x94f97,'c7 05 e0 63 05 00 01 00 00 00'),
 'palette_queue_toggle_reset_7b499':(0x7b499,'c7 05 d4 62 05 00 00 00 00 00'),
 'frame_toggle_entry_67050':(0x67050,'83 35 d4 62 05 00 01'),
 'frame_render_gate_6705c':(0x6705c,'f7 05 f2 5c 07 00 ff ff ff ff'),
 'frame_mode_gate_67068':(0x67068,'83 3d 4c 01 03 00 03'),
 'frame_palette_gate_6708c':(0x6708c,'f7 05 e0 63 05 00 ff ff ff ff'),
 'frame_alternating_gate_670c7':(0x670c7,'f7 05 d4 62 05 00 01 00 00 00'),
 'retrace_port_7b325':(0x7b325,'66 ba da 03'),
 'retrace_input_7b329':(0x7b329,'ec a8 08 74 fb'),
 'frame_compositor_toggle_933c2':(0x933c2,'f7 05 d4 62 05 00 01 00 00 00'),
 'object_walker_toggle_9320e':(0x9320e,'f7 05 d4 62 05 00 01 00 00 00'),
}
CALLS={
 'palette_queue_request_746d0':(0x746d0,0x7b2d0),
 'palette_queue_request_7b4a3':(0x7b4a3,0x7b2d0),
 'palette_retrace_mode3_67080':(0x67080,0x7b30b),
 'palette_retrace_force_670a7':(0x670a7,0x7b30b),
 'palette_retrace_normal_670c2':(0x670c2,0x7b30b),
 'palette_retrace_transfer_670d3':(0x670d3,0x7b30b),
 'frame_composite_mode3_6707b':(0x6707b,0x933c2),
 'frame_composite_force_670a2':(0x670a2,0x933c2),
 'frame_composite_normal_670bd':(0x670bd,0x933c2),
 'frame_copy_mode3_67085':(0x67085,0x65420),
 'frame_copy_force_670ac':(0x670ac,0x65420),
 'frame_copy_normal_670d8':(0x670d8,0x65420),
}

def verify(b):
 for name,(loc,hexstr) in OPS.items():
  expected=bytes.fromhex(hexstr)
  assert b[loc:loc+len(expected)]==expected,(name,hex(loc))
 for name,(loc,dest) in CALLS.items():
  assert b[loc]==0xe8,(name,'call')
  actual=loc+5+struct.unpack_from('<i',b,loc+1)[0]
  assert actual==dest,(name,hex(actual))
 # Validate queue flag is set after enqueue and cleared after direct DAC port writes.
 assert 0x746d0<0x746d5 and 0x7b4a3<0x7b48f+30
 assert 0x7b3a9<0x7b3ed and 0x7b3b1<0x7b3ed
 # Static consequences, not claims of sampled game states.
 cases=[]
 for render in (0,1):
  for mode in (2,3):
   for pending in (0,1):
    for toggle in (0,1):
     toggle_after_entry=toggle^1
     if not render: branch='render_disabled';compose=0;copies=1;last_toggle=toggle_after_entry
     elif mode==3:branch='mode3';compose=1;copies=1;last_toggle=1
     elif pending:branch='pending_palette';compose=1;copies=1;last_toggle=0
     else:branch='normal_alternating';compose=1;copies=int(toggle_after_entry==0);last_toggle=toggle_after_entry
     cases.append({'render_enabled':render,'mode_value':mode,'pending_palette_before_frame':pending,
       'prior_toggle_low_bit':toggle,'branch':branch,'compositor_calls':compose,
       'video_transfer_wrapper_calls':copies,'ending_toggle_low_bit':last_toggle})
 return {'schema':'mk2_o250_palette_queue_frame_transfer_gate_qualification_v1',
  'exe_sha256':EXPECTED_EXE,'fall_sha256':EXPECTED_FALL,
  'source_instructions_checked':len(OPS),'direct_rel32_calls_checked':len(CALLS),
  'original_gate_sources':{
   'render_flag_0x75CF2':{'setter_zero':['0x650CE','0x8678E (EAX=0 from preceding XOR)','0x9D610'],
     'setter_one':['0x650D9','0x9D66C','0x9E3E0']},
   'mode_0x3014C':{'setup_literal_two':'0x651BA','temporary_literal_three':['0x9B284','0x9B2DE'],
     'saved_by':['0x9B277','0x9B2D1'],'restored_by':['0x9B2A4','0x9B2FE']},
   'pending_palette_0x563E0':{'set_to_one':['0x746D5','0x76C58','0x7B48F','0x94F97'],
     'cleared_by':'0x7B3ED after palette queue DAC emission'},
   'toggle_0x562D4':{'frame_entry_xor':'0x67050','palette_enqueue_helper_resets_zero':'0x7B499',
     'compositor_tests_toggle':'0x933C2','object_walker_tests_toggle':'0x9320E'}},
  'palette_queue_source':{'enqueue':'0x7B2D0','record_bytes':8,'initial_read_pointer':'0x562D8',
     'write_pointer':'0x563DC','read_pointer':'0x563D8','dac_retrace_consumer':'0x7B30B',
     'dac_index_port':'0x3C8','dac_data_port':'0x3C9',
     'dequeues_in':'0x7B381..0x7B3E7','clears_pending':'0x7B3ED'},
  'conditional_frame_cases':cases,
  'interpretation':['Original source directly links 0x563E0 to pending/queued palette handling; the pending state can select the forced-copy controller path.',
    '0x3014C is set to two during one initialization and temporarily forced to three in two state-wrappers; it is not a proven constant for Pit fatality.',
    '0x562D4 gates both video-copy decision and part of drawing/object-list work. It cannot be interpreted solely as a copy toggle.',
    'Palette flush at 0x7B30B uses 0x3C8/0x3C9 VGA DAC ports; these are original executable instructions.',
    'No runtime readout establishes which conditions were active during the owner Pit II recordings.',
    'These source mechanisms are compatible with presentation holds but do not resolve the O248 frame-duration inconsistency.']}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--game-zip',required=True,type=Path);ap.add_argument('--source-zip',required=True,type=Path);ap.add_argument('--out',required=True,type=Path)
 args=ap.parse_args();assert not args.out.exists(),'Output must not exist'
 with zipfile.ZipFile(args.game_zip) as z:
  b=z.read('mk2/mk2.exe');fall=z.read('mk2/fall.gra')
 assert sha(b)==EXPECTED_EXE and sha(fall)==EXPECTED_FALL,'Canonical originals required'
 with zipfile.ZipFile(args.source_zip) as z:
  old=z.read(OLD_FILE)
 assert sha(old)==OLD_SHA,'Predecessor O249 evidence not recognized'
 rep=verify(b);controls=[]
 for name,(loc,hexstr) in OPS.items():
  mutated=bytearray(b);mutated[loc+len(bytes.fromhex(hexstr))-1]^=1
  try:verify(mutated)
  except AssertionError:controls.append(name)
  else:raise AssertionError('Undetected opcode mutation '+name)
 for name,(loc,dest) in CALLS.items():
  mutated=bytearray(b);mutated[loc+1]^=1
  try:verify(mutated)
  except AssertionError:controls.append(name)
  else:raise AssertionError('Undetected call mutation '+name)
 rep['rejected_mutation_checks']=controls
 rep['inherited_O249_report_sha256']=sha(old)
 args.out.mkdir(parents=True)
 dest=args.out/'O250_PIT_PALETTE_FRAME_GATE_SOURCE.json'
 dest.write_text(json.dumps(rep,sort_keys=True,indent=2)+'\n')
 print(json.dumps({'report':str(dest),'sha256':sha(dest.read_bytes()),'opcodes':len(OPS),'calls':len(CALLS),'mutations_rejected':len(controls)}))
if __name__=='__main__':main()
