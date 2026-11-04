#!/usr/bin/env python3
"""Independent O97L tamper rejection, restoration and previous 3-pass revalidation."""
from pathlib import Path
import json,copy,subprocess,sys
fixture,root=map(Path,sys.argv[1:3]);path=root/'mk2_mountain_base_accumulator_double_add_o97l_2026-10-09.json';raw=path.read_bytes();orig=json.loads(raw);v=root/'scripts/verify-mk2-o97l-mountain-double-add-and-scalar-multiplex.py';rejected=0
try:
 for change in [('formulaModulo32','A_after_writeback = (A_before + D_before) mod 2^32'),('hypotheses','oneAdditionPerVideoFrame','SUPPORTED'),('examples',1,'afterSecondAdd',999)]:
  test=copy.deepcopy(orig);cur=test
  for part in change[:-2]:cur=cur[part]
  cur[change[-2]]=change[-1];path.write_text(json.dumps(test,indent=2)+'\n')
  result=subprocess.run(['python',str(v),str(fixture),str(root)],capture_output=True,text=True)
  assert result.returncode!=0,'verifier accepted tampered evidence '+str(change);rejected+=1
finally:path.write_bytes(raw)
result=subprocess.run(['python',str(v),str(fixture),str(root)],capture_output=True,text=True);assert result.returncode==0,result.stderr
print('RESTORED',result.stdout.strip())
for label,cmd in [('O97I',['node',str(root/'scripts/verify-mk2-o97i-mountain-dual-setup-producer-join.mjs'),str(fixture),str(root)]),('O97J',['python',str(root/'scripts/verify-mk2-o97j-mountain-installed-positive-cursor-join.py'),str(fixture),str(root)]),('O97K',['node',str(root/'scripts/verify-mk2-o97k-mountain-control-offset-accumulators.mjs'),str(fixture),str(root)])]:
 result=subprocess.run(cmd,capture_output=True,text=True);assert result.returncode==0,(label,result.stderr);print('REGRESSION',label,result.stdout.strip())
print(json.dumps({'status':'PASS','falseClaimsRejected':rejected,'regressionsPassed':3}))
