#!/usr/bin/env python3
"""Falsification suite: one unique tampered report per pass. Reinstates pristine bytes after each test."""
import json,sys,subprocess
from pathlib import Path
exe=Path(sys.argv[1]);root=Path(sys.argv[2]);ver=root/'scripts/verify-mk2-o97t-o98c-ten-pass-stress.mjs'
names={'O97T':'early_profile_constructor','O97U':'late_dual_process_construction','O97V':'secondary_callback_three_phases','O97W':'secondary_helper_scheduler_yield','O97X':'late_setup_events_yields','O97Y':'multiplexed_global_roles','O97Z':'relocated_dual_callback_objects','O98A':'renderer_visibility_branches','O98B':'ten_accumulator_update_walk','O98C':'distinct_global_selector_contexts'}
for p,slug in names.items():
 path=root/f'mk2_{slug}_{p.lower()}_2026-10-09.json'; original=path.read_bytes(); j=json.loads(original)
 try:
  d=j['observations']
  if p=='O97T':d['modeValues'][0]=99
  if p=='O97U':d['constructorParameters'][1]['target']=0x6710f
  if p=='O97V':d['phases'][2]['packed']['value']=99
  if p=='O97W':d['schedulerTailJump']=0
  if p=='O97X':d['eventValues'][2]=0
  if p=='O97Y':d['copyFromGlobal']=0
  if p=='O97Z':d['entryPhysicalTargets'][1]=0
  if p=='O98A':d['gateTarget']=0
  if p=='O98B':d['updates'][8]['srcGlobal']=0
  if p=='O98C':j['finding']='The literal 13 proves guaranteed battle-plan activation in live gameplay.'
  path.write_text(json.dumps(j,indent=2)+'\n')
  run=subprocess.run(['node',str(ver),str(exe),str(root),p],capture_output=True,text=True,timeout=30)
  assert run.returncode!=0,(p,'false report unexpectedly passed')
 finally: path.write_bytes(original)
 run=subprocess.run(['node',str(ver),str(exe),str(root),p],capture_output=True,text=True,timeout=30)
 assert run.returncode==0,(p,'original report failed',run.stderr[-1000:])
 print(json.dumps({'pass':p,'fabrication':'REJECTED','pristineReport':'PASS'}))
print(json.dumps({'negativeControls':len(names),'rejected':len(names),'restored':len(names),'status':'PASS'}))
