#!/usr/bin/env python3
"""O249: bounded original MK2 frame-controller branch map; read-only.
Proves conditional renderer/transfer scheduling, not measured runtime mode or 50/60Hz rates.
"""
import argparse, hashlib, json, struct, zipfile
from pathlib import Path
SHA=lambda b:hashlib.sha256(b).hexdigest()
EXPECTED={'exe':'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',
 'fall':'60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'}
O248_SHA='7bd58deef684a267763d15cd1f8191cb3700584eec8507611de3c95042b54680'

def eq(b,a,s):
 x=bytes.fromhex(s)
 assert b[a:a+len(x)]==x,(hex(a),s)

def target(b,site,opcode=0xe8):
 assert b[site]==opcode,(hex(site),'op')
 return site+5+struct.unpack_from('<i',b,site+1)[0]

def j8(b,site,opcode):
 assert b[site]==opcode,(hex(site),'jump op')
 return site+2+struct.unpack_from('<b',b,site+1)[0]

def verify(b):
 # Full branch gates, including jump destinations; no assumption about runtime values.
 shape={
  0x67050:'83 35 d4 62 05 00 01',       # XOR 1 on 0x562d4
  0x6705c:'f7 05 f2 5c 07 00 ff ff ff ff',  # rendering enabled global
  0x67068:'83 3d 4c 01 03 00 03',       # mode==3
  0x67071:'c7 05 d4 62 05 00 01 00 00 00',
  0x6708c:'f7 05 e0 63 05 00 ff ff ff ff', # special setting
  0x67098:'c7 05 d4 62 05 00 01 00 00 00',
  0x670b1:'c7 05 d4 62 05 00 00 00 00 00',
  0x670c7:'f7 05 d4 62 05 00 01 00 00 00',
  0x670dd:'8b 35 7c 17 03 00 8b 46 24 85 c0',
  0x670ea:'a3 0c 5b 03 00',
  0x670ef:'d1 e0 8b 1d 10 5b 03 00 03 d8 d1 eb',
  0x670fb:'89 1d 10 5b 03 00',
  0x67101:'c7 46 24 00 00 00 00',
  0x67108:'be 04 5b 03 00',
  0x67110:'66 89 46 06',
  0x67114:'89 56 1c',
  0x67152:'8b 36 85 f6',
  0x67158:'66 ff 4e 06',
  0x6715c:'7f f4',
  0x67185:'ff 66 1c',
  0x66e2e:'ff 05 e0 17 03 00',
  0x65441:'be 24 65 05 00 bf 00 00 0a 00',
  0x65465:'be 24 5f 06 00 bf 00 00 0a 00',
  0x65521:'b1 c8 90 8b 06 89 07',
 }
 for p,s in shape.items():eq(b,p,s)
 calls={0x66e34:0x67050,0x67057:0x935e6,
 0x6707b:0x933c2,0x67080:0x7b30b,0x67085:0x65420,
 0x670a2:0x933c2,0x670a7:0x7b30b,0x670ac:0x65420,
 0x670bd:0x933c2,0x670c2:0x7b30b,
 0x670d3:0x7b30b,0x670d8:0x65420,
 0x6544b:0x65521,0x6546f:0x65521}
 for p,t in calls.items(): assert target(b,p)==t,(hex(p),hex(t))
 branches={0x67066:(0x74,0x670d3),0x6706f:(0x75,0x6708c),
 0x6708a:(0xeb,0x670dd),0x67096:(0x74,0x670bd),
 0x670bb:(0xeb,0x670dd),0x670d1:(0x75,0x670dd),
 0x670e8:(0x74,0x670dd),0x6710d:(0xeb,0x67152),
 0x6715c:(0x7f,0x67152)}
 for p,(op,dest) in branches.items():assert j8(b,p,op)==dest,(hex(p),hex(dest))
 assert b[0x67101:0x67108]==bytes.fromhex('c7462400000000')
 # Abstract path enumeration strictly following the verified branch instructions.
 matrix=[]
 for render_enabled in (False,True):
  for mode3 in (False,True):
   for special in (False,True):
    for previous_toggle in (0,1):
     toggled=previous_toggle^1
     if not render_enabled:
      mode='disabled';composition=0;waits=1;transfers=1;final_toggle=toggled
     elif mode3:
      mode='mode3_force_copy';composition=1;waits=1;transfers=1;final_toggle=1
     elif special:
      mode='special_force_copy';composition=1;waits=1;transfers=1;final_toggle=0
     else:
      mode='normal_alternating';composition=1;waits=1+(toggled==0);transfers=int(toggled==0);final_toggle=toggled
     matrix.append({'render_enabled':render_enabled,'mode3':mode3,'special':special,
       'previous_toggle_low_bit':previous_toggle,'selected_path':mode,
       'compositor_calls':composition,'retrace_wait_calls':waits,
       'video_transfer_calls':transfers,'ending_toggle_low_bit':final_toggle})
 assert [r['video_transfer_calls'] for r in matrix if r['selected_path']=='normal_alternating']==[0,1]
 return {'schema':'mk2_o249_original_frame_controller_conditional_transfer_v1',
 'source_original_sha256':EXPECTED['exe'],
 'addresses':{'main_loop_controller_call':'0x66E34 -> 0x67050','controller':'0x67050',
 'toggle_global':'0x562D4','render_gate':'0x75CF2','mode':'0x3014C','special_gate':'0x563E0',
 'object_maintenance':'0x935E6','compositor':'0x933C2',
 'vga_retrace_wait':'0x7B30B','video_transfer_wrapper':'0x65420',
 'sampled_interrupt_counter':'[global 0x3177C]+0x24','task_countdown':'[ESI]+0x06',
 'task_yield':'0x6710F'},
 'original_source_opcodes_checked':len(shape),'original_call_targets_checked':len(calls),
 'original_conditional_edges_checked':len(branches),
 'branch_matrix':matrix,
 'inference_limits':[
 'Source confirms normal-path compositor can run with NO video-transfer call, and another mode/gate path can transfer on every pass.',
 'Render-disabled path can call transfer without a compositor invocation in the same controller pass.',
 'The visual contents of the buffer and whether transfer changes the displayed pixels depend on nested runtime state.',
 'Source does not establish live render-enabled/mode/special/toggle global values during Pit fatality.',
 'One controller pass is gated by a nonzero accumulated external counter sample, but task countdown decrements once per visited scheduler task, not by sample value (O168).',
 'No schedule inferred in milliseconds or exact attribution of O248 unequal recorded texture holds to this branch alone.'
 ]}

def main():
 p=argparse.ArgumentParser();p.add_argument('--game-zip',type=Path,required=True);p.add_argument('--source-zip',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 assert not a.out.exists(),'out must be new, so no overwrites'
 with zipfile.ZipFile(a.game_zip) as z:exe=z.read('mk2/mk2.exe');fall=z.read('mk2/fall.gra')
 assert SHA(exe)==EXPECTED['exe'] and SHA(fall)==EXPECTED['fall'],'canonical MK2 fixture required'
 with zipfile.ZipFile(a.source_zip) as z:
  old=z.read('MK-DOS-Archive/research_outputs/O248_PIT_SELECTOR_PRESENTATION_FEASIBILITY.json')
 assert SHA(old)==O248_SHA,'unexpected predecessor report'
 rep=verify(exe)
 controls={'frame_entry_call':0x66e35,'toggle_opcode':0x67050,'list_maintenance':0x67058,'enable_global':0x6705e,
 'skip_render_branch':0x67067,'mode_gate':0x6706a,'mode_branch':0x67070,'mode3_compose':0x6707c,
 'mode3_transfer':0x67086,'special_gate':0x6708e,'special_branch':0x67097,'special_reset':0x670b7,
 'normal_compose':0x670be,'normal_wait':0x670c3,'normal_transfer_gate':0x670ca,
 'normal_skip_copy':0x670d2,'shared_copy':0x670d9,'irq_wait':0x670e8,
 'irq_counter_reset':0x67104,'task_decrement':0x67158,'task_jmp':0x67185,
 'transfer_vga_destination':0x65449,'writer':0x65526}
 rejected=[]
 for name,addr in controls.items():
  b=bytearray(exe);b[addr]^=1
  try:verify(b)
  except AssertionError:rejected.append(name)
  else:raise AssertionError('undetected mutation: '+name)
 rep['rejected_mutation_checks']=rejected
 rep['inherited_O248_SHA256']=SHA(old)
 a.out.mkdir(parents=True)
 f=a.out/'O249_PIT_FRAME_CONTROLLER_PRESENTATION_BRANCHES.json'
 f.write_text(json.dumps(rep,indent=2,sort_keys=True)+'\n')
 print(json.dumps({'report':str(f),'sha256':SHA(f.read_bytes()),'mutation_rejected':len(rejected), 'branch_rows':len(rep['branch_matrix'])}))
if __name__=='__main__':main()
