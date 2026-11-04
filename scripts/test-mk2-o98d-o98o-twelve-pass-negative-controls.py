#!/usr/bin/env python3
"""Twelve separate falsification controls, one per bounded research report. Restores originals."""
import sys,glob,subprocess,os,json,pathlib
exe=sys.argv[1];root=pathlib.Path(sys.argv[2]);ver=root/'scripts/verify-mk2-o98d-o98o-twelve-pass-batch.mjs'
passed=[]
for j,letter in enumerate('DEFGHIJKLMNO'):
 pid='O98'+letter;name=next(root.glob(f'mk2_*_{pid.lower()}_2026-10-09.json'))
 pristine=name.read_text();r=json.loads(pristine)
 # Rotate between falsified operands, source witness hash, and semantic labels.
 if j%3==0:r['facts'][0]['operand']=77777777
 elif j%3==1:r['window']['sha256']='0'*64
 else:r['hypotheses']['sharedRuntimeActivation']='PROVEN_IN_GAME'
 try:
  name.write_text(json.dumps(r,indent=2)+'\n')
  bad=subprocess.run(['node',str(ver),exe,str(root),pid],capture_output=True,text=True)
  if bad.returncode==0:raise RuntimeError('FALSIFIED REPORT ACCEPTED '+pid)
 finally:name.write_text(pristine)
 good=subprocess.run(['node',str(ver),exe,str(root),pid],capture_output=True,text=True)
 if good.returncode:raise RuntimeError('PRISTINE REJECTED '+pid+good.stdout+good.stderr)
 passed.append(pid)
 print(json.dumps({'pass':pid,'deliberateCorruption':'REJECTED','pristine':'PASS'}))
print(json.dumps({'negativeControls':len(passed),'rejected':len(passed),'restored':len(passed),'status':'PASS'}))
