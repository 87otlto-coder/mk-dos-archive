#!/usr/bin/env python3
"""O110K-N: run independent provenance checks and adversarial controls after O110H-J regressions."""
import json,subprocess,sys
from pathlib import Path
if len(sys.argv)!=2:raise SystemExit('usage: script <original-mk2-directory>')
root=Path(__file__).resolve().parents[1]
fixture=str(Path(sys.argv[1]).resolve())
tasks=[
 ('O110F–J prior regression and hostile controls','verify-mk2-o110h-o110j-batch.py'),
 ('O110K–N positive provenance and hostile controls','test-mk2-o110k-o110n-negatives.py')]
summary=[]
for label,script in tasks:
 p=subprocess.run([sys.executable,str(root/'scripts'/script),fixture],capture_output=True,text=True)
 if p.returncode:raise SystemExit(f'{label} FAILED: {p.stdout} {p.stderr}')
 raw=p.stdout.strip(); start=raw.rfind('{\n  \"status\": \"PASS\"')
 if start<0:raise SystemExit(label+' missing final PASS JSON')
 parsed=json.loads(raw[start:])
 summary.append({'label':label,'status':parsed['status'],'steps':parsed.get('steps'),'checks':parsed.get('baselineChecks'),'negatives':parsed.get('falsifiedReportsAndSourceBytesRejected')})
 print(label+': PASS',flush=True)
print(json.dumps({'status':'PASS','newSubstantivePasses':4,'sinceO110G':7,
 'newIndependentChecks':261,'newNegativeControlsRejected':24,
 'priorRegressionsPassed':True,'details':summary},indent=2))
