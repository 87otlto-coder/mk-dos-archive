#!/usr/bin/env python3
"""O267: exact source anchors plus source-hashed user DOSBox-X screenshots.

User-visible debugger data is MANUALLY TRANSCRIBED, never presented as an
in-process debugger trace or a memory dump.  The PNG hashes bind the report to
precisely the images reviewed. No MK2 mutation or emulation is performed.
"""
import argparse, hashlib, json, struct
from pathlib import Path

SHA = lambda data: hashlib.sha256(data).hexdigest()
EXE_SHA = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
FILE_IMAGE_CODE_BASE = 0x61c54
LIVE_CODE_BASE = 0x200000
DATA_ADDEND = 0x240000
SRC_PAL = 0x27958
CODE_SELECTOR = '0180'
PNG_MAGIC = b'\x89PNG\r\n\x1a\n'

ANCHORS = {
 'palette_pending_set':(0x7b48f,'c7 05 e0 63 05 00 01 00 00 00'),
 'palette_toggle_reset':(0x7b499,'c7 05 d4 62 05 00 00 00 00 00'),
 'queue_write_8byte':(0x7b2d7,'89 01 66 89 51 04 66 89 59 06'),
 'queue_decode_read':(0x7b381,'0f b7 4d 06 8b 75 00 0f b7 7d 04'),
 'dac_color_index_port':(0x7b3a4,'ba c8 03 00 00 8b c7 ee'),
 'dac_color_output_port':(0x7b3ab,'ee 42 eb 00'),
 'dac_red_output':(0x7b3bc,'ee'),
 'dac_green_output':(0x7b3c8,'ee'),
 'dac_blue_output':(0x7b3d3,'ee'),
 'queue_read_cursor_store':(0x7b3e7,'89 2d d8 63 05 00'),
 'palette_pending_clear':(0x7b3ed,'c7 05 e0 63 05 00 00 00 00 00'),
 'frame_palette_gate':(0x6708c,'f7 05 e0 63 05 00 ff ff ff ff'),
 'frame_reset_bit':(0x67098,'c7 05 d4 62 05 00 01 00 00 00'),
 'frame_after_transfer_toggle_reset':(0x670b1,'c7 05 d4 62 05 00 00 00 00 00'),
 'alternating_transfer_call':(0x670d8,'e8 43 e3 ff ff'),
 'pit_wall_rebuild_advance':(0x80796,'ff 05 6b 37 01 00'),
}
CALLS = {
 'enqueue_palette_request':(0x7b4a3,0x7b2d0),
 'palette_branch_compositor':(0x670a2,0x933c2),
 'palette_branch_retrace_and_dac':(0x670a7,0x7b30b),
 'palette_branch_video_transfer':(0x670ac,0x65420),
}
IMAGES = [
 ('O262_PENDING_FLAG.png','1351c522447ce8c882eb59fea6708c1e19369d61408ebc59fb48a346fcd5def1'),
 ('O263_DAC_QUEUE_CURSORS.png','b400f03291ee56c326dd878d412a85789f9e2537e70013920fd8ef0d0a81808e'),
 ('O264_DAC_QUEUE_COMMAND.png','bd014ff5d4051e77fc81ded4084da6f942f2170e4c74cd1c8f087227553dffde'),
 ('O265_DAC_QUEUE_DRAIN.png','9433de434039af26a2135cecd5a3d970ab8c115464be1412125ded63ded9e19c'),
 ('O266_PALETTE_FORCED_TRANSFER.png','6ba2a2d38b816e4897819288d0ced63c7e0a687a7254ac4327b255b9f36b00cb'),
]

def check_source(data, hashguard=True):
 if hashguard and SHA(data) != EXE_SHA:
  raise AssertionError('Not the immutable canonical MK2.EXE')
 for key,(off,h) in ANCHORS.items():
  want=bytes.fromhex(h)
  if data[off:off+len(want)]!=want:raise AssertionError('Opcode mismatch '+key)
 for key,(site,target) in CALLS.items():
  if data[site]!=0xE8:raise AssertionError('CALL opcode mismatch '+key)
  actual=site+5+struct.unpack_from('<i',data,site+1)[0]
  if actual!=target:raise AssertionError('CALL destination mismatch '+key)

def negative_controls(data):
 tests=0
 for key,(off,_) in ANCHORS.items():
  m=bytearray(data);m[off]^=1
  try:check_source(m,False)
  except AssertionError: tests+=1
  else:raise AssertionError('Anchor mutation escaped: '+key)
 for key,(off,_) in CALLS.items():
  m=bytearray(data);m[off+1]^=1
  try:check_source(m,False)
  except AssertionError:tests+=1
  else:raise AssertionError('CALL mutation escaped: '+key)
 return tests

def run(exe,screenshot_dir):
 data=Path(exe).read_bytes();check_source(data)
 pics=[]
 for filename,want_hash in IMAGES:
  raw=(Path(screenshot_dir)/filename).read_bytes()
  if not raw.startswith(PNG_MAGIC) or SHA(raw)!=want_hash:
   raise AssertionError('Screenshot provenance mismatch: '+filename)
  pics.append({'filename':filename,'sha256':want_hash,'bytes':len(raw)})
 runtime=lambda physical:f'{CODE_SELECTOR}:{LIVE_CODE_BASE + physical-FILE_IMAGE_CODE_BASE:08X}'
 assert runtime(0x7b48f)=='0180:0021983B'
 assert runtime(0x7b3ed)=='0180:00219799'
 assert runtime(0x670ac)=='0180:00205458'
 assert 0x562f0+DATA_ADDEND==0x2962f0
 assert SRC_PAL+LIVE_CODE_BASE==0x227958
 # Manual readings from exact hash-locked PNGs; screenshots are NOT binary dumps.
 captured=[
  {'id':'O262','screenshot':IMAGES[0][0],'inspected_code':runtime(0x7b48f),'displayed_memory_address':'0x002963E0','pending_dword':1},
  {'id':'O263','screenshot':IMAGES[1][0],'displayed_memory_address':'0x002963D8','queue_read':'0x002962F0','queue_write':'0x002962F8','pending_dword':1},
  {'id':'O264','screenshot':IMAGES[2][0],'displayed_memory_address':'0x002962F0','queue_bytes':'5A 79 22 00 40 00 51 00','palette_color_data':'0x0022795A','vga_first_color_index':64,'color_count':81},
  {'id':'O265','screenshot':IMAGES[3][0],'execution_ip':runtime(0x7b3ed),'queue_read':'0x002962F8','queue_write':'0x002962F8','pending_dword_before_clear':1},
  {'id':'O266','screenshot':IMAGES[4][0],'execution_ip':runtime(0x670ac),'queue_read':'0x002962F8','queue_write':'0x002962F8','pending_dword':0,'called_runtime_code':'0180:002037CC'},
 ]
 queue=bytes.fromhex(captured[2]['queue_bytes'])
 src,start,count=struct.unpack('<IHH',queue)
 assert (src,start,count)==(SRC_PAL+LIVE_CODE_BASE+2,64,81)
 assert start+count<=256
 assert int(captured[1]['queue_write'],16)-int(captured[1]['queue_read'],16)==8
 assert captured[3]['queue_read']==captured[3]['queue_write']==captured[4]['queue_read']==captured[4]['queue_write']
 assert captured[0]['pending_dword']==captured[1]['pending_dword']==captured[3]['pending_dword_before_clear']==1
 assert captured[4]['pending_dword']==0
 return {
   'schema':'mk2_pit_o267_live_palette_dac_transfer_evidence_v1','original_MK2_SHA256':EXE_SHA,
   'image_source':'Five uploaded DOSBox-X screenshots, manually transcribed; SHA256 locks originals, no OCR or memory dump',
   'captured_observations':captured,'evidence_images':pics,
   'source_checks':{'opcode_anchors':len(ANCHORS),'rel32_call_edges':len(CALLS),'independent_mutations_rejected':negative_controls(data)},
   'runtime_map':{'code_selector':CODE_SELECTOR,'code_base':f'0x{LIVE_CODE_BASE:X}', 'original_code_file_base':f'0x{FILE_IMAGE_CODE_BASE:X}', 'data_addend':f'0x{DATA_ADDEND:X}', 'palette_source_addend':f'0x{LIVE_CODE_BASE:X}'},
   'source_and_runtime_join':{
      'palette_rebuild_reference':'O260 runtime verified cache eviction and 15-ref reacquisition, inherited unchanged',
      'pending_flag_set': 'LIVE OBSERVED',
      'pit_palette_81_color_command_queued':'LIVE OBSERVED',
      'queue_read_caught_up_to_write':'LIVE OBSERVED',
      'DAC_processor_has_VGA_OUT_instruction':'ORIGINAL SOURCE VERIFIED',
      'pending_flag_cleared':'LIVE OBSERVED after source-verified queue drain path',
      'palette_forced_transfer_call_reached':'LIVE OBSERVED: 0180:00205458',
      'actual_transfer_wrapper_entered':'NOT DIRECTLY OBSERVED (IP at CALL, before execution)',
      'particular_VRAM_byte_written':'NOT DIRECTLY OBSERVED',
      'exact_screen_presented_at_50fps':'UNKNOWN',
   },
   'limitations':[
     'The five screenshots are sequential user observations, not a machine-generated continuous execution log.',
     'Only queue head/tail difference is meaningful for pending commands; stale bytes elsewhere in queue storage are not live commands.',
     'The displayed image need not update before execution of the pending CALL.',
     '50 fps presentation, scheduler traversals, DAC writes and 30 fps video captures remain distinct clocks.',
   ]}

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True);ap.add_argument('--screenshots',required=True);ap.add_argument('--output',required=True);a=ap.parse_args()
 out=run(a.exe,a.screenshots)
 Path(a.output).write_text(json.dumps(out,indent=2,sort_keys=True)+'\n')
 print('O267 verified',SHA(Path(a.output).read_bytes()),'negative controls',out['source_checks']['independent_mutations_rejected'])
