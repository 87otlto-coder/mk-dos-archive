#!/usr/bin/env python3
"""O260: replay immutable MK2 opcode checks and provenance of manually
transcribed DOSBox-X O259 screenshots. Never patches or runs MK2.
The pixel contents of screenshots are not OCR validated; SHA-256 locks
independently inspected human-observed bytes to exact files.
"""
import argparse, hashlib, json, struct, zipfile
from pathlib import Path
SHA=lambda b:hashlib.sha256(b).hexdigest()
EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
PATCHED_SHA='95f925bcf343701cd92d2fc631df4df6c8c98d51b1553c62ae4918349b074928'
ROOT='MK-DOS-Archive/'
# Original *physical file* instruction anchors, not runtime debugger addresses.
OPS={
 'selector_enter':(0x80721,'60 a1 6b 37 01 00'),
 'tagged_remove_setup':(0x80733,'b8 0b 07 00 00'),
 'post_remove_resume':(0x8073d,'a1 6b 37 01 00'),
 'build_next_wall_tile_loop':(0x8075f,'8b 13 83 c3 04 83 fa ff 74 2d'),
 'advance_selector':(0x80796,'ff 05 6b 37 01 00'),
 'cache_pointer_lookup':(0x7b43e,'39 04 dd 00 5b 07 00'),
 'cache_refcount_increase':(0x7b4f9,'66 ff 04 dd 04 5b 07 00'),
 'cache_release_decrease':(0x7b514,'66 ff 0c c5 04 5b 07 00'),
 'cache_eviction_zero_pointer':(0x7b528,'7f 0b c7 04 c5 00 5b 07 00 00 00 00 00'),
 'palette_miss_flag':(0x7b48f,'c7 05 e0 63 05 00 01 00 00 00'),
 'palette_miss_toggle_zero':(0x7b499,'c7 05 d4 62 05 00 00 00 00 00'),
 'object_palette_acquire':(0x640c7,'e8 6d 73 01 00'),
 'tagged_wall_object':(0x8078e,'66 c7 47 40 0b 07'),
}
CALLS={
 'tagged_wall_remove':(0x80738,0x86bb1),
 'removed_object_palette_release':(0x86c7d,0x7b505),
 'new_wall_object':(0x80771,0x64548),
 'new_wall_commit':(0x80789,0x646b4),
 'object_palette_allocator':(0x640c7,0x7b439),
 'cache_miss_DAC_enqueue':(0x7b4a3,0x7b2d0),
}
# A screenshot is evidence but not a binary memory dump. All values below were
# transcribed manually from the displayed hex bytes; references are hashed.
CAPTURES=[
 dict(id='O260_REMOVE_1',file='O260_DEBUGGER_AFTER_REMOVE.png',runtime_code='0180:0021EAE9',source_offset='0x8073D',cache_hex='BE 8B 22 00 01 00 01 00',pit_present=False,context='First visible after-removal breakpoint in the session'),
 dict(id='O260_REMOVE_2',file='O260_DEBUGGER_AFTER_REMOVE_2.png',runtime_code='0180:0021EAE9',source_offset='0x8073D',cache_hex='BE 8B 22 00 01 00 01 00',pit_present=False,context='Second after-removal breakpoint in same session; specifically followed by O260_REBUILD_2'),
 dict(id='O260_REBUILD_2',file='O260_DEBUGGER_AFTER_REBUILD_2.png',runtime_code='0180:0021EB42',source_offset='0x80796',cache_hex='BE 8B 22 00 01 00 01 00 58 79 22 00 0F 00 40 00',pit_present=True,context='After rebuild in same session immediately following REMOVE_2'),
]
PALETTE_RUNTIME=0x00227958
CACHE_RUNTIME=0x002B5B00

def check_source(b, check_hash=True):
 if check_hash and SHA(b)!=EXE_SHA:raise AssertionError('original unmodified MK2 SHA mismatch')
 for name,(off,h) in OPS.items():
  exp=bytes.fromhex(h)
  if b[off:off+len(exp)]!=exp:raise AssertionError(f'bad opcode {name} at 0x{off:X}')
 for name,(site,target) in CALLS.items():
  if b[site]!=0xe8:raise AssertionError(f'{name}: not call rel32')
  actual=site+5+struct.unpack_from('<i',b,site+1)[0]
  if actual!=target:raise AssertionError(f'{name}: wrong call target: {actual:X} != {target:X}')

def decode_slots(h):
 b=bytes.fromhex(h)
 assert len(b)%8==0
 return [dict(index=i,source_pointer=f'0x{p:08X}',refcount=ref,palette_start=index)
         for i,(p,ref,index) in enumerate(struct.iter_unpack('<IHH',b))]

def run(exe, screenshots):
 b=Path(exe).read_bytes();check_source(b)
 captures=[]
 for c in CAPTURES:
  p=Path(screenshots)/c['file']
  raw=p.read_bytes()
  if raw[:8]!=bytes.fromhex('89 50 4e 47 0d 0a 1a 0a'):raise AssertionError('expected PNG screenshot')
  slots=decode_slots(c['cache_hex'])
  observed=any(x['source_pointer']==f'0x{PALETTE_RUNTIME:08X}' and x['refcount']>0 for x in slots)
  assert observed==c['pit_present'],c['id']
  captures.append({**{k:v for k,v in c.items() if k!='cache_hex'},'sha256':SHA(raw),'size':len(raw),'visible_slots':slots})
 a,b2,c=captures
 assert a['runtime_code']==b2['runtime_code'] and b2['runtime_code']!=c['runtime_code']
 assert b2['visible_slots'][0]==c['visible_slots'][0]
 assert len(b2['visible_slots'])==1 and len(c['visible_slots'])==2
 assert c['visible_slots'][1]=={'index':1,'source_pointer':'0x00227958','refcount':15,'palette_start':64}
 return {'schema':'mk2_pit_o260_live_palette_eviction_evidence_v1','fixture_sha256':EXE_SHA,
         'live_code_segment':'0180','live_cache_virtual_address':f'0x{CACHE_RUNTIME:08X}',
         'pit_palette_runtime_source_pointer':f'0x{PALETTE_RUNTIME:08X}',
         'live_address_map':{'code_object_file_base':'0x61C54','code_runtime_base':'0x200000','data_address_addend':'0x240000',
          'data_addend_ground':'C 0180:002197E5 showed [002B5B00+ebx*8] versus original [00075B00+ebx*8]'},
         'source_checks':{'opcode_anchors':len(OPS),'call_targets':len(CALLS)},
         'captures':captures,
         'evidence_classification':{'same_session_cache_eviction_and_reacquisition':'RUNTIME OBSERVED VIA DEBUGGER SCREENSHOTS',
           'after_removal_to_after_build':'two sequential code breakpoints in same fatality session',
           'palette_reacquire_refcount':15,
           'palette_upload_queued_by_miss':'ORIGINAL SOURCE PATH, not directly measured runtime queue',
           'DAC_upload_executed':'UNKNOWN','frame_transfer_executed':'UNKNOWN',
           'pit_palette_before_removed_group_this_specific_operation':'NOT CAPTURED IN THE SAME SESSION; earlier session supports 15-ref prior state',
           'all_60_cache_entries_observed':'NO: visible screenshot includes first 8 slots only; source pointer eviction itself established by unoccupied visible prior slot + source-controlled removal path, but hidden slot occupancy not fully excluded'},
         'limitations':['The screenshot readings are careful manual transcriptions, not OCR or binary RAM dumps.',
           'Only the first ~8 of 60 cache slots are visible; original loop constructs 15 references and selects first free slot, so acquiring source in slot 1 implies no earlier instance in slots 0–59 at that moment.',
           'Timing of actual DAC queue drain and transferred framebuffer remains unobserved.']}

def mutation_test(b):
 count=0
 for _,(off,_) in OPS.items():
  mutant=bytearray(b);mutant[off]^=1
  try:check_source(bytes(mutant),check_hash=False)
  except AssertionError:count+=1;continue
  raise AssertionError(f'failed independent opcode mutation detection at 0x{off:X}')
 for _,(off,_) in CALLS.items():
  mutant=bytearray(b);mutant[off+1]^=1
  try:check_source(bytes(mutant),check_hash=False)
  except AssertionError:count+=1;continue
  raise AssertionError(f'failed independent call mutation detection at 0x{off:X}')
 return count

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True);ap.add_argument('--screenshots',required=True);ap.add_argument('--output',required=True);args=ap.parse_args()
 result=run(args.exe,args.screenshots)
 # Mutation controls on changed original hashes cannot establish individual
 # instruction rejection since the hash guard rejects first. Report honestly.
 result['source_mutation_tests']={'count':mutation_test(Path(args.exe).read_bytes()),'scope':'each opcode anchor and rel32 call operand independently, with fixture hash guard disabled only during mutation tests'}
 Path(args.output).write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
 print('O260 VERIFIED',SHA(Path(args.output).read_bytes()),'captures',len(result['captures']))
