#!/usr/bin/env python3
"""O97M–O97O tamper tests: report falsification must fail, clean fixture must pass."""
import json,subprocess,sys
from pathlib import Path
fixture,root=map(Path,sys.argv[1:3]);scripts=root/'scripts'
tests=[
 ('O97M','mk2_mountain_accumulator_initializers_o97m_2026-10-09.json',['node',str(scripts/'verify-mk2-o97m-accumulator-initializers.mjs'),str(fixture),str(root)],lambda o:o['broadcastTargets'].__setitem__(0,0x8432c)),
 ('O97N','mk2_mountain_nine_value_transform_bank_o97n_2026-10-09.json',['node',str(scripts/'verify-mk2-o97n-nine-value-transform-bank.mjs'),str(fixture),str(root)],lambda o:o['profiles'][0]['examples'][2].__setitem__('outputDword',0)),
 ('O97O','mk2_mountain_scene_nine_source_values_and_conditional_profiles_o97o_2026-10-09.json',[sys.executable,str(scripts/'verify-mk2-o97o-mountain-nine-input-profile-matrix.py'),str(fixture),str(root)],lambda o:o['hypotheses'].__setitem__('storedWordsArePixelsPerFrame','SUPPORTED'))]
for label,name,cmd,mutate in tests:
 p=root/name;original=p.read_bytes()
 try:
  obj=json.loads(original);mutate(obj);p.write_text(json.dumps(obj,indent=2)+'\n');ret=subprocess.run(cmd,capture_output=True,text=True);assert ret.returncode!=0,label+' failed to reject falsification'
 finally:p.write_bytes(original)
 clean=subprocess.run(cmd,capture_output=True,text=True);assert clean.returncode==0,(label,clean.stderr);print(label,'tamper REJECTED, restored PASS')
print('O97M-O97O negative controls: 3/3 correctly rejected')
