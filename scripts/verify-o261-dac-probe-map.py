#!/usr/bin/env python3
"""O261 source-qualified *candidate* runtime watch locations. No DOS execution.
Uses two independent debugger screenshot anchors to derive a data relocation
addend, then qualifies each source operand at its unmodified physical offset.
Derived pointers other than already witnessed cache and selector remain PROPOSED.
"""
import argparse,json,hashlib,struct
from pathlib import Path
H=lambda b:hashlib.sha256(b).hexdigest()
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
ADDEND=0x240000;CODE_FILE_BASE=0x61C54;CODE_LOADED_BASE=0x200000
FIELDS=[
 ('cache',0x7b43e,0x75b00,'source-pointer cache first lookup; live address already confirmed'),
 ('selector_index',0x80722,0x1376b,'selector index; live relocation confirmed in 0180:0021EAE9 screenshot'),
 ('pending_dac',0x7b48f,0x563e0,'miss writes pending palette signal to 1; proposed watch'),
 ('toggle',0x7b499,0x562d4,'miss resets alternating frame toggle; proposed watch'),
 ('queue_write_cursor',0x7b2d1,0x563dc,'read queue write cursor; proposed watch'),
 ('queue_read_cursor',0x7b30b,0x563d8,'DAC queue read pointer; proposed watch'),
 ('frame_pending_test',0x6708c,0x563e0,'frame controller tests pending DAC flag; proposed watch'),
 ('flush_pending_clear',0x7b3ed,0x563e0,'DAC flush clears pending signal; proposed watch'),
]
# Explicit raw-instruction verifiers, not vague near-code assertions.
RAW=[
 ('cache_look',0x7b43e,'39 04 dd 00 5b 07 00'),
 ('selector_idx_read',0x80722,'a1 6b 37 01 00'),
 ('set_pending',0x7b48f,'c7 05 e0 63 05 00 01 00 00 00'),
 ('reset_toggle',0x7b499,'c7 05 d4 62 05 00 00 00 00 00'),
 ('queue_write_read',0x7b2d1,'8b 0d dc 63 05 00'),
 ('pending_test',0x6708c,'f7 05 e0 63 05 00 ff ff ff ff'),
 ('pending_clear',0x7b3ed,'c7 05 e0 63 05 00 00 00 00 00'),
 ('selector_read_after_remove',0x8073d,'a1 6b 37 01 00'),
]
def check(data):
 if H(data)!=SHA:raise AssertionError('original fixture identity mismatch')
 for label,offset,pattern in RAW:
  b=bytes.fromhex(pattern)
  if data[offset:offset+len(b)]!=b:raise AssertionError(label)

def run(exe):
 b=Path(exe).read_bytes();check(b)
 return {'schema':'mk2_o261_dac_probe_map_v1','original_fixture_sha256':SHA,
  'grounded_live_anchors':[
   {'source_operand':'0x75B00','observed_debugger_operand':'0x002B5B00','offset_difference':'0x240000', 'screen':'20261018-162751.png'},
   {'source_operand':'0x1376B','observed_debugger_operand':'0x0025376B','offset_difference':'0x240000','screen':'20261018-165559.png'},
   {'source_code_file_offset':'0x80721','observed_runtime_code':'0180:0021EACD','code_file_image_base':'0x61C54','code_runtime_base':'0x200000'}],
  'candidate_runtime_watches':[
    {'name':name,'source_operand':f'0x{src:05X}','physical_opcode_offset':f'0x{site:05X}',
     'proposed_loaded_linear':f'0x{src+ADDEND:08X}', 'expected_runtime_cs':'0180',
     'classification':('LIVE WITNESSED' if name in ('cache','selector_index') else 'DERIVED / REQUIRES LIVE CONFIRMATION'),
     'meaning':note} for name,site,src,note in FIELDS],
  'already_witnessed_cache_rebuild':{'cache_virtual':'0x002B5B00','palette_runtime_pointer':'0x00227958','refcount':15,'start_index':64},
  'scope_limits':['No actual queued DAC command or pending flag value was captured.',
      'The source data address relocation +0x240000 is supported by two independent live anchor operands; candidate locations must be checked against their disassembly before claiming live telemetry.',
      'Do not mistake source code file offset for loaded virtual address.',
      'A queue command, DAC port write, transfer call and displayed frame remain separate events.'],
  'byte_verified_opcode_anchors':len(RAW)}
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True);ap.add_argument('--output',required=True);args=ap.parse_args()
 result=run(args.exe);Path(args.output).write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
 print('O261 SOURCE MAP VERIFIED',H(Path(args.output).read_bytes()))
