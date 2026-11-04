#!/usr/bin/env python3
"""O236: exact original per-layer 16.16 stage-position accumulator operations.
Pure source-read check; no claim of runtime FPS or branch activation.
"""
import argparse,hashlib,json,struct,zipfile
from pathlib import Path
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
PH='af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96'
H=lambda b:hashlib.sha256(b).hexdigest()
U=lambda e,p:struct.unpack_from('<I',e,p)[0]
def check(e,p,s):assert e[p:p+len(s)//2]==bytes.fromhex(s),(hex(p),s)
def c(e):
 # Original frame-composition source. Stage X has nine accumulator pairs,
 # of which six are consumed by the fatality camera handoff.
 check(e,0x93433,'a1e44208000105e8420800')
 pairs=[]
 starts=[0x9343e,0x9344a,0x93456,0x93462,0x9346d,0x93479,0x93485,0x93491,0x9349c]
 for i,p in enumerate(starts):
  src=0x842ec+4*i;dest=src+0x24
  if e[p]==0xa1:
   assert U(e,p+1)==src and e[p+5:p+7]==bytes.fromhex('0105') and U(e,p+7)==dest
  else:
   assert e[p:p+2] in [bytes.fromhex('8b1d'),bytes.fromhex('8b0d'),bytes.fromhex('8b15')]
   assert U(e,p+2)==src
   # check the register-specific add exactly
   assert e[p+6:p+8] in [bytes.fromhex('011d'),bytes.fromhex('010d'),bytes.fromhex('0115')]
   assert U(e,p+8)==dest
  pairs.append({'velocity_dword':hex(src),'position_accumulator_dword':hex(dest),'display_position_high_word':hex(dest+2)})
 # Extra unconditioned vertical accumulator addition in same function:
 # 842E8 <- 842E8 + 842E4, then repeat through scratch globals.
 check(e,0x934b4,'528b15e44208008915745a07005a')
 check(e,0x934c2,'528b15e84208008915685a07005a')
 check(e,0x934d0,'528b15745a07000115685a07005a')
 check(e,0x934de,'528b15685a07008915e84208005a')
 # Identical high-word origins consumed by fatality 6-list coordinate rebase.
 for i,p in enumerate([0x8020e,0x80227,0x80240,0x80259,0x80272,0x8028b]):
  assert e[p]==0xb8 and U(e,p+1)==0x84348-4*i
  assert e[p+5:p+9]==bytes.fromhex('520fbf15')
  assert U(e,p+9)==0x84326-4*i
  assert 0x84326-4*i in [int(x['display_position_high_word'],16) for x in pairs]
 check(e,0x8050b,'520fbf15ea4208008915705a07005a')
 check(e,0x80532,'0fbf471e2b05705a07006689471e')
 # Source y camera origin 842EA is exactly the upper 16-bit half of 842E8.
 assert 0x842ea==0x842e8+2
 # Bounded 32-bit arithmetic qualification: each continuous composition invocation
 # reaches two adds of vertical velocity, yielding +2*v modulo 2^32;
 # not necessarily a stable video-visible frame interval.
 demos=[]
 for pos,v in [(0x12340000,0x00010000),(0x00000000,0x00008000),(0xffff0000,0x00010000)]:
  new=(pos+v+v)&0xffffffff
  demos.append({'old_acc':hex(pos),'vel':hex(v),'new_acc':hex(new),'old_visible_hi_word':(pos>>16)&0xffff,'new_visible_hi_word':(new>>16)&0xffff})
 return {'frame_compositor':'0x933C2','vertical_velocity_dword':'0x842E4','vertical_position_dword':'0x842E8',
 'vertical_screen_origin_high_word':'0x842EA','source_single_add':'0x93433','source_second_add':'0x934B4..0x934EB',
 'nine_source_x_accumulator_pairs':pairs,'six_used_by_fatality_handoff':list(reversed(pairs[:6])),
 'stage_rebase':'0x8020E..0x802A3 -> 0x8050B','arithmetic_demos':demos,
 'scope':'Addresses and unconditional path arithmetic original-source verified only. No proof of per-frame call count, original wall traversal camera trajectory, active original fatality mode, or presentation of graphic 58.'}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--game-zip',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);a=ap.parse_args();assert not a.out.exists()
 with zipfile.ZipFile(a.game_zip) as z:e=z.read('mk2/mk2.exe');p=z.read('mk2/pit.gra')
 assert (H(e),H(p))==(EH,PH)
 src=c(e)
 tests=[('y_first_increment',0x93435),('x_first_velocity',0x93440),('x_first_accumulator',0x93446),('x_second_velocity',0x9344c),('x_sixth_position',0x93474),('x_ninth_position',0x934a6),('y_scratch_velocity',0x934b8),('y_scratch_position',0x934c6),('y_second_add',0x934d8),('y_write_back',0x934e6),('list_x_origin',0x8021a),('sixth_list_x_origin',0x80297),('shared_y_origin',0x8050e)]
 bad=[]
 for label,p in tests:
  b=bytearray(e);b[p]^=1
  try:c(b)
  except AssertionError:bad.append(label)
  else:raise AssertionError('Uncaught source mutation '+label)
 assert len(bad)==len(tests)
 r={'schema':'o236_pit_camera_original_16_16_accumulator_connection_v1','original_hashes':{'exe':EH,'pit':PH},'source':src,'mutation_controls_rejected':bad}
 a.out.mkdir(parents=True);f=a.out/'O236_PIT_CAMERA_16_16_ACCUMULATOR_CONTROL.json';f.write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'sha256':H(f.read_bytes()),'negative_controls':len(bad)},indent=2))
if __name__=='__main__':main()
