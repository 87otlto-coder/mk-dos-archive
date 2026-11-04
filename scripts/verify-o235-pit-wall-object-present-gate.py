#!/usr/bin/env python3
"""O235: source-level fatality wall object insertion through shared frame maintenance.
No assertions of live graphic 58 presentation or runtime branch selection.
"""
import argparse,hashlib,json,struct,zipfile
from pathlib import Path
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
FH='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
H=lambda b:hashlib.sha256(b).hexdigest()
def chk(e,p,s):assert e[p:p+len(s)//2]==bytes.fromhex(s),(hex(p),s)
def edge(e,p,t,opcode=0xe8):assert e[p]==opcode and p+5+struct.unpack_from('<i',e,p+1)[0]==t,(hex(p),hex(t))
def verify(e):
 chk(e,0xb4d84,('05'*12+'04'*6+'03'*5+'02'*4+'01'*3+'00'*2+'ff'))
 # Entry selection and per-tile insertion; sprite 58 index3 is present, but
 # whether it enters a *shown* page is beyond static evidence.
 chk(e,0x80721,'60a16b370100f68030410100ff7903')
 chk(e,0x80742,'0fb68030410100')
 chk(e,0x8074a,'8b14c551410100')
 chk(e,0x80758,'8b1cc555410100')
 edge(e,0x80771,0x64548); edge(e,0x80789,0x646b4)
 chk(e,0x8078e,'66c747400b07')
 chk(e,0x80796,'ff056b370100')
 # Task's registered release of previous 0x70B objects ahead of next tile run.
 chk(e,0x80733,'b80b070000');edge(e,0x80738,0x86bb1)
 chk(e,0x86bb1,'bbffffffffe984000000')
 for i,h in enumerate([0x84358,0x84360,0x84364]):
  p=0x86c44+10*i;assert e[p]==0xbf and struct.unpack_from('<I',e,p+1)[0]==h
  edge(e,p+5,0x86c66)
 chk(e,0x86c6e,'0fb7574023d33bd0')
 chk(e,0x86c82,'8b078901')
 # Object commit is a direct jump into sorted first-list insertion.
 chk(e,0x646b4,'8bc7');edge(e,0x646b6,0x665eb,0xe9)
 chk(e,0x665eb,'53ff35645a07005152ff356c5a0700ba58430800')
 chk(e,0x665ff,'8b5820528b501c89156c5a07005a')
 chk(e,0x66613,'8b12f7c2ffffffff7414')
 chk(e,0x6661d,'8b4a203bd97fe97c0b8b4a1c390d6c5a07007fdc')
 chk(e,0x66631,'8910518b0d645a0700890159')
 # Original repeating main frame loop invokes update/sort first.
 edge(e,0x66e34,0x67050)
 edge(e,0x67057,0x935e6)
 for i,(p,head) in enumerate([(0x935f0,0x84358),(0x93610,0x84360),(0x93630,0x84364)]):
  assert e[p]==0xb8 and struct.unpack_from('<I',e,p+1)[0]==head
  edge(e,p+5,0x93647)
 chk(e,0x93651,'8b1085d27501c3')
 chk(e,0x93658,'8b7a208b721c')
 # Conditional rendering path, explicit palette/retrace and video copying:
 # not proof of which tile was on a particular swapped framebuffer.
 edge(e,0x670bd,0x933c2);edge(e,0x670c2,0x7b30b)
 edge(e,0x670d3,0x7b30b);edge(e,0x670d8,0x65420)
 chk(e,0x7b325,'66bada03eca80874fb')
 chk(e,0x65441,'be24650500bf00000a00')
 edge(e,0x6544b,0x65521)
 chk(e,0x65465,'be245f0600bf00000a00')
 edge(e,0x6546f,0x65521)
 # This tests a reachable static source chain, not live execution / VSync.
 return {'source_selector':'0x80721', 'selected_58_index':3,'selector_table':'0xB4D84',
 'tile_alloc':'0x80771 -> 0x64548','tile_commit':'0x80789 -> 0x646B4 -> 0x665EB',
 'committed_list_head':'0x84358','sort_fields':['object+0x20','object+0x1C'],
 'remove_previous_tag':'0x80733: 0x70B -> 0x86BB1 -> 0x86C3F; all three list heads',
 'original_frame_entry':'0x66E34 -> 0x67050',
 'list_maintenance_per_frame':'0x67057 -> 0x935E6 -> 0x93647, 3 list heads',
 'conditional_frame_composition':'0x670BD -> 0x933C2',
 'vga_retrace_routine':'0x670C2 -> 0x7B30B; status port 0x3DA',
 'video_memory_copy_branch':'0x670D8 -> 0x65420 -> 0x65521; destination 0xA0000 on checked paths',
 'unverified':'No live evidence of frame buffer contents, stage selected render branches, exact swap time, or presented frames of source58. No claim all list objects are drawn or survive occlusion.'}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--game-zip',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);a=ap.parse_args()
 assert not a.out.exists(),'new destination required'
 with zipfile.ZipFile(a.game_zip) as z:e=z.read('mk2/mk2.exe');f=z.read('mk2/fall.gra')
 assert (H(e),H(f))==(EH,FH)
 result=verify(e)
 muts=[('sprite58_slot',0xb4d84+19),('selector_load',0x80745),('create_object',0x80772),('commit_object',0x8078a),('object_tag',0x80793),('old_object_remove',0x80739),('sort_commit_dispatch',0x646b7),('first_list_head',0x665fb),('sort_primary_key',0x665ff),('object_insert_link',0x66632),('frame_loop_call',0x66e35),('object_sort_loop',0x67058),('sort_first_head',0x935f1),('sort_second_head',0x93611),('sort_third_head',0x93631),('render_branch_call',0x670be),('retrace_port',0x7b327),('vram_destination',0x65449),('copy_destination',0x6546d)]
 failures=[]
 for label,p in muts:
  x=bytearray(e);x[p]^=1
  try:verify(x)
  except AssertionError:failures.append(label)
  else:raise AssertionError('Undetected modification '+label)
 assert len(failures)==len(muts)
 r={'schema':'o235_pit_fatality_tile_object_list_to_conditional_video_source_v1','original_hashes':{'exe':EH,'fall':FH},'source':result,'rejected_mutations':failures}
 a.out.mkdir(parents=True);f=a.out/'O235_PIT_FATALITY_TILE_LIST_TO_PRESENTATION_SOURCE.json';f.write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'report':str(f),'sha256':H(f.read_bytes()),'rejected':len(failures)},indent=2))
if __name__=='__main__':main()
