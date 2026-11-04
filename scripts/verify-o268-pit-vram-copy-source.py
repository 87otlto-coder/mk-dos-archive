#!/usr/bin/env python3
"""O268: original-source-only destination branching after the O266 call.
The user stopped *before* the transfer CALL executes.  This static trace
cannot prove a particular VGA write or presented frame in that session.
"""
import argparse,hashlib,json,struct
from pathlib import Path
H=lambda b:hashlib.sha256(b).hexdigest()
EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
OPCODES={
 'palette_branch_callsite':(0x670ac,'e8 6f e3 ff ff'),
 'transfer_mode_gate':(0x65420,'83 3d 4c 01 03 00 03 75 70'),
 'normal_mode_special_flag_test':(0x65499,'f7 05 ee 5c 07 00 ff ff ff ff'),
 'normal_mode_special_flag_branch':(0x654a3,'75 5e'),
 'normal_mode_double_buffer_choice':(0x654a5,'81 3d 2a 66 07 00 24 65 05 00'),
 'normal_mode_first_esi':(0x654b1,'be 24 65 05 00'),
 'normal_mode_first_edi':(0x654b6,'bf 24 5f 06 00'),
 'normal_mode_first_vram':(0x654bb,'bd 00 00 0a 00'),
 'normal_mode_second_esi':(0x654da,'be 24 5f 06 00'),
 'normal_mode_second_edi':(0x654df,'bf 24 65 05 00'),
 'normal_mode_second_vram':(0x654e4,'bd 00 00 0a 00'),
 'normal_mode_special_esi':(0x65503,'be 24 65 05 00'),
 'normal_mode_special_edi':(0x65508,'bf 24 5f 06 00'),
 'normal_mode_special_vram':(0x6550d,'bd 00 00 0a 00'),
 'delta_compare_first_dword':(0x65a56,'8b 06 39 07'),
 'delta_mismatch_writes_vram':(0x65f50,'89 45 00'),
 'delta_mismatch_next_dword':(0x65f5f,'89 45 04'),
 'full_copy_word':(0x65524,'8b 06 89 07'),
 'mode3_first_vram':(0x65446,'bf 00 00 0a 00'),
 'mode3_alternate_vram':(0x6546a,'bf 00 00 0a 00'),
 'mode3_override_vram':(0x6548e,'bf 00 00 0a 00'),
}
CALLS={
 'controller_to_transfer':(0x670ac,0x65420),
 'normal_first_delta':(0x654c0,0x65a54),
 'normal_second_delta':(0x654e9,0x65a54),
 'normal_special_delta':(0x65512,0x65a54),
 'mode3_full_first':(0x6544b,0x65521),
 'mode3_full_second':(0x6546f,0x65521),
 'mode3_full_override':(0x65493,0x65521),
}
def checks(data,sha=True):
 if sha and H(data)!=EXE_SHA:raise AssertionError('fixture mismatch')
 for n,(i,x) in OPCODES.items():
  pattern=bytes.fromhex(x)
  if data[i:i+len(pattern)]!=pattern:raise AssertionError('opcode '+n)
 for n,(i,target) in CALLS.items():
  if data[i]!=0xe8 or i+5+struct.unpack_from('<i',data,i+1)[0]!=target:raise AssertionError('call '+n)

def run(exe):
 data=Path(exe).read_bytes();checks(data)
 mutations=0
 for name,(off,_) in OPCODES.items():
  altered=bytearray(data);altered[off]^=1
  try:checks(altered,False)
  except AssertionError:mutations+=1
  else:raise AssertionError('undetected mutated instruction '+name)
 for name,(off,_) in CALLS.items():
  altered=bytearray(data);altered[off+1]^=1
  try:checks(altered,False)
  except AssertionError:mutations+=1
  else:raise AssertionError('undetected mutated CALL '+name)
 return {'schema':'mk2_pit_o268_original_frame_copy_path_v1','fixture_sha256':EXE_SHA,
  'source_validation':{'opcode_checks':len(OPCODES),'direct_calls':len(CALLS),'mutations_rejected':mutations},
  'observed_handoff':{'runtime_ip':'0180:00205458','original_physical_offset':'0x670AC','classification':'O266 LIVE AT CALL INSTRUCTION; destination has NOT been executed in screenshot'},
  'source_derived_path':[
   {'step':'selected pending-palette frame controller branch','address':'0x670AC','action':'CALL 0x65420 transfer wrapper','status':'LIVE CALL SITE OBSERVED'},
   {'step':'transfer wrapper mode condition','address':'0x65420','action':'mode==3 routes to full VGA copy, otherwise routes to nonmode3 processing at 0x65499','status':'SOURCE VERIFIED; O266 previously entered controller nonmode3 branch'},
   {'step':'normal-mode special buffer flag','address':'0x65499','action':'value at 0x75CEE selects standard alternating source buffers or special processing','status':'SOURCE VERIFIED; 0x75CEE runtime value UNKNOWN'},
   {'step':'normal-mode delta transfer','address':'0x654C0 / 0x654E9 / 0x65512','action':'each eligible normal branch calls original 0x65A54 delta-copy helper with EBP=0xA0000','status':'SOURCE VERIFIED conditional'},
   {'step':'delta helper','address':'0x65A54','action':'compares source/background DWORDs; unequal values jump to code like 0x65F50 which writes to [EBP] (VGA destination)','status':'SOURCE VERIFIED; whether a particular difference was found UNKNOWN'},
   {'step':'mode3 full copy','address':'0x65441 / 0x65465 / 0x65489','action':'selects VGA address 0xA0000 and copies via 0x65521','status':'SOURCE VERIFIED, NOT observed O266 branch'},
  ],
  'limitations':['The observed O266 instruction had not yet executed; hitting a CALL breakpoint is not proof of entering its callee.',
   'Which normal-mode branch and which changed pixel words were actually written require additional runtime evidence.',
   'No absolute display-time or video-capture frame is inferred from these source paths.']}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--output',required=True);a=p.parse_args()
 out=run(a.exe);Path(a.output).write_text(json.dumps(out,indent=2,sort_keys=True)+'\n');print('O268 verified',H(Path(a.output).read_bytes()), 'mutation controls',out['source_validation']['mutations_rejected'])
