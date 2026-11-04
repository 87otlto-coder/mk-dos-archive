#!/usr/bin/env python3
"""Run new O110H–J independent verifiers + negative suites and O110F/G regression.

This script deliberately does not modify canonical game files or generate
synthetic passing proof. Incomplete commands abort immediately.
"""
import json,subprocess,sys
from pathlib import Path
if len(sys.argv)!=2:raise SystemExit('usage: script <original-mk2-dir>')
root=Path(__file__).resolve().parents[1]
fixture=str(Path(sys.argv[1]).resolve())
def evidence(key,base):return str(root/'evidence'/('mk2_'+key)/base)
f=evidence('o110f','MK2_O110F_PALETTE_CALLSITE_EVIDENCE.json')
g=evidence('o110g','MK2_O110G_STAGE_PALETTE_SELECTOR_ADJACENCY.json')
h=evidence('o110h','MK2_O110H_PALETTE_HANDLE_LIFECYCLE.json')
i=evidence('o110i','MK2_O110I_DYNAMIC_PALETTE_ORIGINS.json')
j=evidence('o110j','MK2_O110J_STAGE_PALETTE_REQUEST_RETURN_BOUNDARY.json')
tasks=[
 ('O110F regression',['verify-mk2-o110f-palette-callsite-census.py',fixture,f]),
 ('O110G regression',['verify-mk2-o110g-stage-palette-adjacency.py',fixture,f,g]),
 ('O110H',['verify-mk2-o110h-palette-handle-lifecycle.py',fixture,h]),
 ('O110H negatives',['test-mk2-o110h-palette-handle-negatives.py',fixture,h,str(root/'scripts/verify-mk2-o110h-palette-handle-lifecycle.py')]),
 ('O110I',['verify-mk2-o110i-dynamic-palette-origins.py',fixture,f,i]),
 ('O110I negatives',['test-mk2-o110i-dynamic-palette-negatives.py',fixture,f,i,str(root/'scripts/verify-mk2-o110i-dynamic-palette-origins.py')]),
 ('O110J',['verify-mk2-o110j-stage-request-return-boundary.py',fixture,g,j]),
 ('O110J negatives',['test-mk2-o110j-stage-request-negatives.py',fixture,g,j,str(root/'scripts/verify-mk2-o110j-stage-request-return-boundary.py')]),
]
items=[]
for label,args in tasks:
 print('Running',label,flush=True)
 proc=subprocess.run([sys.executable,str(root/'scripts'/args[0]),*args[1:]],capture_output=True,text=True)
 if proc.returncode:raise SystemExit(label+' FAILED:\n'+proc.stdout+proc.stderr)
 print(proc.stdout.strip(),flush=True)
 items.append({'step':label,'result':json.loads(proc.stdout)})
print(json.dumps({'status':'PASS','steps':len(items),'newPasses':3,'allSourceChecksPassed':True,'results':items},indent=2))
