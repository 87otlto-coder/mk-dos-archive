#!/usr/bin/env python3
"""Tamper one O97I/J/K evidence item per test; verify rejection and restoration; run regressions."""
from pathlib import Path
import json,subprocess,copy,sys
fixture,root=map(Path,sys.argv[1:3]); scripts=root/'scripts'
cases=[
('O97I','mk2_mountain_dual_setup_producer_row_join_o97i_2026-10-09.json',scripts/'verify-mk2-o97i-mountain-dual-setup-producer-join.mjs','node',[('firstThreeAfterConditionalInstaller',1,'action','call_0x81BF2_conditional'),('hypotheses','twoSetupsDefinitelyRenderedInSameFrame','SUPPORTED')]),
('O97J','mk2_mountain_installed_positive_cursor_join_o97j_2026-10-09.json',scripts/'verify-mk2-o97j-mountain-installed-positive-cursor-join.py','python',[('producerHeadCoverage','installedSetupRows',0,'positiveCursorPairIndex',6),('hypotheses','runtimeProcessCallObserved','SUPPORTED')]),
('O97K','mk2_mountain_positive_control_word_accumulators_o97k_2026-10-09.json',scripts/'verify-mk2-o97k-mountain-control-offset-accumulators.mjs','node',[('positivePairJoins',5,'updateDestination',123),('hypotheses','eachIncrementMeansOneGameFrame','SUPPORTED')])]
rejected=0
for nm,name,script,exe,mutations in cases:
 path=root/name;original=path.read_bytes();data=json.loads(original)
 try:
  for mut in mutations:
   changed=copy.deepcopy(data);obj=changed
   for key in mut[:-2]:obj=obj[key]
   obj[mut[-2]]=mut[-1];path.write_text(json.dumps(changed,indent=2)+'\n')
   proc=subprocess.run([exe,str(script),str(fixture),str(root)],capture_output=True,text=True)
   assert proc.returncode!=0,f'{nm} verifier failed to reject tamper at {mut[:-1]}';rejected+=1
 finally:path.write_bytes(original)
 good=subprocess.run([exe,str(script),str(fixture),str(root)],capture_output=True,text=True)
 assert good.returncode==0,(nm,good.stderr)
 print('RESTORED',nm,good.stdout.strip())
for nm,cmd in [
 ('O97F',['node',str(scripts/'verify-mk2-o97f-mountain-scene-index-join.mjs'),str(fixture),str(root/'mk2_mountain_scene_selector_13_o97f_2026-10-09.json')]),
 ('O97G',['node',str(scripts/'verify-mk2-o97g-mountain-runtime-install.mjs'),str(fixture),str(root)]),
 ('O97H',['python',str(scripts/'verify-mk2-o97h-mountain-callback-qualification.py'),str(fixture),str(root)])]:
 run=subprocess.run(cmd,capture_output=True,text=True);assert run.returncode==0,(nm,run.stderr);print('REGRESSION',nm,run.stdout.strip())
print(json.dumps({'status':'PASS','falseReportsRejected':rejected,'regressionsPassed':3}))
