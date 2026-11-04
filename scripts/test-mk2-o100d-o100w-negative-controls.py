#!/usr/bin/env python3
"""Mutate a distinct source assertion in each of twenty reports and demand independent rejection."""
import sys,subprocess,json,copy
from pathlib import Path
exe,fixture,source,reportdir,verifier=map(str,sys.argv[1:6]);p=Path(reportdir)
files=sorted(p.glob('mk2_o100*_2026-10-09.json'));assert len(files)==20,len(files)
def run(tag):return subprocess.run(['node',verifier,exe,fixture,source,reportdir,tag],capture_output=True,text=True)
rejected=0
for file in files:
 original=file.read_bytes();data=json.loads(original);tag=data['passId'];assert tag.startswith('O100')
 def tamper(x):
  if isinstance(x,bool):return not x
  if isinstance(x,int):return x+1
  if isinstance(x,str):return x+'-false'
  if isinstance(x,list):
   if not x:return ['falsified']
   return [tamper(x[0])]+x[1:]
  if isinstance(x,dict):
   assert x;first=next(iter(x));return {**x,first:tamper(x[first])}
  raise TypeError(type(x))
 bad=copy.deepcopy(data);bad['evidence']=tamper(bad['evidence'])
 try:
  file.write_text(json.dumps(bad,indent=2)+'\n')
  test=run(tag)
  if test.returncode==0:raise AssertionError(f'{tag}: verifier accepted falsified evidence')
  rejected+=1
 finally:file.write_bytes(original)
 pristine=run(tag)
 if pristine.returncode:raise AssertionError(f'{tag}: pristine report rejected {pristine.stderr[-250:]}')
 print(f'{tag} REJECTED_FALSIFICATION / ORIGINAL_PASS',flush=True)
assert rejected==20
print(f'NEGATIVE_TESTS_PASS rejected={rejected} original_verified={rejected}')
