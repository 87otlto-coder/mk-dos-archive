#!/usr/bin/env python3
"""O239 bounded original-source fall object motion parameter qualification.
No binary writes or assumed per-frame integration/camera trajectory.
"""
import argparse,hashlib,json,struct,zipfile
from pathlib import Path
EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
PIT='af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96'
FALL='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
def H(b):return hashlib.sha256(b).hexdigest()
def m(e,p,s):
 z=bytes.fromhex(s);assert e[p:p+len(z)]==z,(hex(p),s)
def call(e,p,t,opcode=0xe8):
 assert e[p]==opcode,(hex(p),'opcode');assert p+5+struct.unpack_from('<i',e,p+1)[0]==t,(hex(p),'target')
def verify(e):
 # The same EDI owner passed into the fall-follow task at 0x801BD remains
 # the EDI used by the inline movement setup that jumps to 0x63940.
 m(e,0x801bd,'89 78 0c')
 m(e,0x801cb,'b8 00 80 01 00')
 m(e,0x801d0,'bb 00 00 f7 ff')
 m(e,0x801d5,'c7 05 64 5a 07 00 00 48 00 00')
 m(e,0x801df,'b9 05 00 00 00')
 m(e,0x801e4,'c7 05 78 5a 07 00 0f 00 00 00')
 m(e,0x801ee,'8d 6d fc')
 m(e,0x801f1,'c7 45 00 a9 e5 01 00')
 call(e,0x801f8,0x63940,0xe9)
 # The shared movement initializer writes the call-site EBX to owner+0x14
 # and the caller-supplied 0x75A64 DWORD to owner+0x0C.
 m(e,0x63940,'c7 05 70 5a 07 00 00 00 00 00')
 m(e,0x63956,'51 83 fb 0d 74 03')
 m(e,0x6395c,'89 5f 14')
 m(e,0x6395f,'83 3d 64 5a 07 00 0d 74 0b')
 m(e,0x63968,'52 8b 15 64 5a 07 00 89 57 0c 5a')
 m(e,0x63973,'83 f8 0d 74 05')
 call(e,0x63978,0x632e8)
 # O237's independently established camera source consumes the same +0x14.
 m(e,0x8033d,'a1 80 5a 07 00 52 8b 50 14')
 m(e,0x8034d,'f7 05 70 5a 07 00 ff ff ff ff 78 8f')
 m(e,0x8036b,'83 f8 60')
 m(e,0x80374,'52 8b 15 70 5a 07 00 89 15 e4 42 08 00')
 return {'fall_callback_parent_object':'EDI passed to newly configured task +0x0C at 0x801BD',
  'same_owner_motion_configuration': {'caller':'0x801CB..0x801F8','shared_initializer':'0x63940','immediate_EBX_signed_dword':'0xFFF70000','signed_fixed_16_16_initial_field_0x14':-9.0,'global_0x75A64':'0x00004800','fixed_16_16_second_field_0x0C':0.28125,'configured_EAX_raw':'0x00018000','ECX_raw':5,'frame_control_raw':15,'note':'The -9.0 and +0.28125 values are original stored operands; time-step application of the second field is not verified'},
  'write_field_0x14':'0x6395C: [EDI+0x14] = EBX if EBX != 13',
  'write_field_0x0C':'0x6396F: [EDI+0x0C] = [0x75A64] if global != 13',
  'camera_follow_read':'0x80343: [owner+0x14] into staged motion, with negative/96-pixel gates',
  'camera_motion_write':'0x8037B: source-staged motion to [0x842E4]',
  'classification':'VERIFIED original motion initialization and conditional camera field sharing; exact physics integrator/call cadence and live values unverified',
  'limitations':['0x4800 is parameter field +0x0C, not independently established as actual per-frame gravity','no claim of frame-rate-derived trajectory','no proof graphic58 presentation']}
def main():
 a=argparse.ArgumentParser();a.add_argument('--game-zip',type=Path,required=True);a.add_argument('--out',type=Path,required=True);c=a.parse_args();assert not c.out.exists()
 with zipfile.ZipFile(c.game_zip) as z:e=z.read('mk2/mk2.exe');p=z.read('mk2/pit.gra');f=z.read('mk2/fall.gra')
 assert (H(e),H(p),H(f))==(EXE,PIT,FALL)
 s=verify(e)
 probes={'owner':0x801bf,'initial_horizontal_operand':0x801cd,'initial_motion_value':0x801d2,'second_motion_parameter':0x801db,'special_argument':0x801e0,'frame_controls':0x801e9,'continuation':0x801f4,'initializer_jump':0x801fa,'movement_init':0x63941,'EBX_sentinel':0x6395a,'field_0x14_write':0x6395e,'gravity_gate':0x63962,'second_parameter_read':0x6396b,'field_0x0c_write':0x63971,'branch':0x63975,'initial_aux_call':0x63979,'camera_motion_read':0x80345,'nonnegative_motion_gate':0x80355,'vertical_gate_96':0x8036d,'camera_increment':0x8037d}
 rejected=[]
 for name,p in probes.items():
  b=bytearray(e);b[p]^=1
  try:verify(b)
  except AssertionError:rejected.append(name)
  else:raise AssertionError('failed corruption control: '+name)
 assert len(rejected)==len(probes)
 report={'schema':'o239_pit_fall_motion_initialization_to_camera_source_v1','canonical_source_sha256':{'exe':EXE,'pit':PIT,'fall':FALL},'source':s,'mutations_rejected':rejected}
 c.out.mkdir(parents=True);out=c.out/'O239_PIT_FALL_INITIAL_MOTION_TO_CAMERA.json';out.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'report':str(out),'sha256':H(out.read_bytes()),'rejected':len(rejected)}))
if __name__=='__main__':main()
