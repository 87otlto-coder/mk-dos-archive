#!/usr/bin/env python3
"""O257: verify original palette allocator can shift and requeue later occupied cache slots.
Static original-source evidence only; no claim of observed live reflow.
"""
import argparse, hashlib, json, struct, zipfile
from pathlib import Path
H=lambda v: hashlib.sha256(v).hexdigest()
EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
FALL='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
PRIOR='b5a5118a1ba67ca69842268bae6955fe89a9ade96740ab44ca4ebbdc19719a25'
SRC='MK-DOS-Archive/research_outputs/O255_PIT_LOWER_ACTOR_PALETTE_SOURCE.json'
OPS={
 'miss_saves_new_pointer':(0x7b4aa,'89 04 dd 00 5b 07 00'),
 'miss_saves_start_index':(0x7b4b1,'88 14 dd 06 5b 07 00'),
 'reflow_saves_current_slot':(0x7b4b8,'53'),
 'reflow_advance_slot':(0x7b4b9,'43'),
 'reflow_capacity':(0x7b4ba,'80 fb 3c'),
 'reflow_early_end':(0x7b4bd,'7d 37'),
 'reflow_occupied_test':(0x7b4bf,'66 f7 04 dd 04 5b 07 00 ff ff'),
 'reflow_skip_empty':(0x7b4c9,'74 ee'),
 'reflow_increment_end_by_previous_size':(0x7b4cb,'66 03 10'),
 'reflow_compare_new_dest_to_previous_dest':(0x7b4ce,'38 14 dd 06 5b 07 00'),
 'reflow_stop_if_no_relocation':(0x7b4d5,'73 1f'),
 'reflow_write_new_dest':(0x7b4d7,'88 14 dd 06 5b 07 00'),
 'reflow_load_later_palette_ptr':(0x7b4de,'8b 04 dd 00 5b 07 00'),
 'reflow_read_later_palette_size':(0x7b4e7,'66 8b 18'),
 'reflow_skip_length_header':(0x7b4ea,'83 c0 02'),
 'reflow_continue_loop':(0x7b4f4,'eb c3'),
 'cache_zero_clears_previous_pointer':(0x7b52a,'c7 04 c5 00 5b 07 00 00 00 00 00'),
}
CALLS={'miss_enqueue':(0x7b4a3,0x7b2d0), 'relocation_enqueue':(0x7b4ed,0x7b2d0)}

def check(data):
 for lab,(p,c) in OPS.items():
  value=bytes.fromhex(c)
  if data[p:p+len(value)]!=value: raise AssertionError(('op',lab))
 for lab,(p,addr) in CALLS.items():
  if data[p]!=0xe8 or p+5+struct.unpack_from('<i',data,p+1)[0]!=addr:raise AssertionError(('call',lab))
 return True

def main():
 p=argparse.ArgumentParser();p.add_argument('--game-zip',type=Path,required=True);p.add_argument('--source-zip',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
 a=p.parse_args()
 if a.out.exists():raise AssertionError('Output destination exists')
 with zipfile.ZipFile(a.game_zip) as z: exe=z.read('mk2/mk2.exe');fall=z.read('mk2/fall.gra')
 if (H(exe),H(fall))!=(EXE,FALL):raise AssertionError('Fixture not canonical')
 with zipfile.ZipFile(a.source_zip) as z: parent=z.read(SRC)
 if H(parent)!=PRIOR:raise AssertionError('O255 inherited report differs')
 check(exe)
 mutations=[]
 for lab,(p,c) in OPS.items():
  v=bytearray(exe);v[p+len(bytes.fromhex(c))-1]^=1
  try: check(v)
  except AssertionError:mutations.append('op:'+lab)
  else:raise AssertionError('Undetected opcode mutation '+lab)
 for lab,(p,_) in CALLS.items():
  v=bytearray(exe);v[p+1]^=1
  try:check(v)
  except AssertionError:mutations.append('call:'+lab)
  else:raise AssertionError('Undetected call mutation '+lab)
 result={'schema':'mkdos_o257_original_palette_cache_reflow_source_v1',
 'scope':'Read-only original source instructions; not a runtime occupancy/command-count trace',
 'original_exe_sha256':EXE,'original_fall_sha256':FALL,'inherited_O255_report_sha256':PRIOR,
 'original_opcodes_verified':len(OPS),'original_calls_verified':len(CALLS),
 'adversarial_mutations_rejected':len(mutations),'mutation_labels':mutations,
 'source_mechanism':{
  'first_new_palette_DAC_command':'0x7B4A3 -> 0x7B2D0',
  'scan_later_occupied_cache_slots':'0x7B4B8..0x7B4C9',
  'add_prior_palette_size_to_next_destination':'0x7B4CB',
  'stop_if_existing_destination_at_or_above_new_one':'0x7B4CE..0x7B4D5',
  'update_later_palette_destination':'0x7B4D7',
  'queue_additional_DAC_command_from_later_palette':'0x7B4DE..0x7B4F2',
  'possible_amplification':'One cache miss may enqueue more than one DAC record when later occupied palette slots require relocation.'},
 'implications':['The O254 32-miss conditional model does not imply exactly 32 DAC write commands.',
  'Later cache occupancy, record sizes and allocation layout affect the number of queue entries.',
  'A recorded palette-pending frame alone cannot identify whether wall texture allocation or cache compaction enqueued its DAC work.'],
 'limits':['No observed number of palette reflow events during user Pit II runtime.',
  'No emulator available in this environment to observe real queue pressure or VGA transfers.',
  'Original code includes error checks for exhausted palette slots/queued records; no exact runtime frequency is asserted.']}
 a.out.mkdir(parents=True)
 dest=a.out/'O257_PIT_PALETTE_REFLOW_SOURCE.json'
 dest.write_text(json.dumps(result,sort_keys=True,indent=2)+'\n')
 print(json.dumps({'sha256':H(dest.read_bytes()),'opcodes':len(OPS),'calls':len(CALLS),'mutations_rejected':len(mutations)}))
if __name__=='__main__':main()
