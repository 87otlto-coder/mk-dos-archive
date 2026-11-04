#!/usr/bin/env python3
"""O222: read-only canonical source proof for The Pit stage roots -> distant actor task gate."""
import argparse,hashlib,json,struct,sys,zipfile
from pathlib import Path
EXE_HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';PIT_HASH='af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96'
OB1=0x61c54;OB2=0xa0c54
hexbytes='833d4c01030000741c833d4c0103000174135251bb06000000ba84150200e84d40feff595ac3'
def dword(e,at):return struct.unpack_from('<I',e,at)[0]
def check(exe,fx):
 def checkrel(obj,source,targetobj,target):
  f=fx.get((obj,source));assert f and f['kind']==7 and f['flags']==16 and f['targetObject']==targetobj and f['targetOffset']==target,(obj,hex(source),f)
  assert dword(exe,(OB1 if obj==1 else OB2)+source)==target
 for table,expected in [(0x15bec,0x18990),(0x15c68,0x18a1c),(0x15ce4,0x18a1c)]:checkrel(2,table+6*4,2,expected)
 for root in (0x18990,0x18a1c):checkrel(2,root+0x10,1,0x2155e)
 assert exe[0x831b2:0x831d8].hex()==hexbytes,'source mode gate and call bytes'
 assert 0x831b9+2+struct.unpack_from('<b',exe,0x831ba)[0]==0x831d7
 assert 0x831c2+2+struct.unpack_from('<b',exe,0x831c3)[0]==0x831d7
 checkrel(1,0x831cc-OB1,1,0x21584)
 assert exe[0x831d0]==0xe8 and 0x831d5+struct.unpack_from('<i',exe,0x831d1)[0]==0x67222
 assert 0x831d8==OB1+0x21584
 # callback details are O221; this pass only proves the incoming stage/root and task-gate relationship.
 return {'stage_index':6,'stage_root_mode2_object2':'0x18990','stage_root_mode1_fallback_object2':'0x18A1C',
  'stage_root_qualified_pointer_field_suffix':'0x10','source_callback_gate_code_physical':'0x831B2',
  'code_target_object1':'0x2155E','mode_global_code_operand':'0x3014C','mode_guard':'returns when value equals 0 or 1; otherwise creates scheduled task',
  'task_registration_EBX_immediate':6,'task_registration_EDX_callback_object1':'0x21584',
  'scheduled_callback_physical':'0x831D8','task_allocator_call_physical':'0x831D0','original_task_allocator_target_physical':'0x67222',
  'assertion_boundary':'Validated original relocation-typed stage dispatch, two stage roots, mode gate and task registration code. Does not prove actual selected root/mode, callback activation, 50fps task cadence, actor draw order or collision.'}
def main():
 p=argparse.ArgumentParser();p.add_argument('--game-zip',required=True,type=Path);p.add_argument('--project',type=Path,default=Path(__file__).resolve().parents[1]);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 assert not a.out.exists(),'Output cannot exist'
 with zipfile.ZipFile(a.game_zip) as z:exe=z.read('mk2/mk2.exe');pit=z.read('mk2/pit.gra')
 assert hashlib.sha256(exe).hexdigest()==EXE_HASH and hashlib.sha256(pit).hexdigest()==PIT_HASH,'Noncanonical owner fixture'
 sys.path.insert(0,str(a.project/'tools/mk2_native_stage_palettes'))
 from trace_o120_setup_graph import fixups
 fx=fixups(exe);d=check(exe,fx)
 tamper={'mode2_root_callback_pointer':(OB2+0x18990+0x10,0),
   'mode1_root_callback_pointer':(OB2+0x18a1c+0x10,0),
   'stage_table_index6':(OB2+0x15bec+24,0),
   'mode_guard_byte':(0x831b9,0),
   'callback_pointer':(0x831cc,0),
   'scheduler_task_call':(0x831d1,0)}
 rejected=[]
 for name,(at,value) in tamper.items():
  altered=bytearray(exe);altered[at]=value
  try:check(altered,fx)
  except AssertionError:rejected.append(name)
  else:raise AssertionError('Tamper not rejected: '+name)
 assert len(rejected)==6
 d.update({'schema':'o222_pit_bridge_stage_root_task_gate_v1','original_exe_sha256':EXE_HASH,'original_pit_sha256':PIT_HASH,'LE_fixups_parsed':len(fx),'tamper_controls_rejected':rejected})
 a.out.mkdir(parents=True);(a.out/'O222_PIT_BRIDGE_STAGE_ROOT_TASK_GATE.json').write_text(json.dumps(d,indent=2)+'\n')
 print(json.dumps({'stage_index':6,'roots':2,'mode_gate':'nonzero and not one','negative_controls_rejected':len(rejected)},indent=2))
if __name__=='__main__':main()
