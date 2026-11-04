#!/usr/bin/env python3
"""Mutate a source-evidence field in each report and require independent-verifier rejection."""
import sys,subprocess,json,copy
from pathlib import Path
exe,install,ev,verifier=sys.argv[1:5]
folder=Path(ev); ids=['O103'+c for c in 'FGHIJKLMNOPQRSTUVWXYZ']+['O104'+c for c in 'ABCDEFGHI']
for pid in ids:
 p=next(folder.glob(f'mk2_{pid.lower()}_*.json')); original=p.read_text();data=json.loads(original)
 entry=data['evidence']
 if 'files' in entry and isinstance(entry['files'],list) and entry['files']:
  if 'byteLength' in entry['files'][0]:entry['files'][0]['byteLength']+=1
  elif 'metadataStart' in entry['files'][0]:entry['files'][0]['metadataStart']+=1
  elif 'offsetCount' in entry['files'][0]:entry['files'][0]['offsetCount']+=1
  elif 'partCount' in entry['files'][0]:entry['files'][0]['partCount']+=1
  elif 'sameParameterAllFive' in entry['files'][0]:entry['files'][0]['sameParameterAllFive']=not entry['files'][0]['sameParameterAllFive']
  else:raise ValueError(pid)
 elif pid=='O104E':entry['constantFamilies']-=1
 elif pid=='O104F':entry['count']+=1
 elif pid=='O104G':entry['totalOffsets']+=1
 elif pid=='O104H':entry['count']+=1
 elif pid=='O104I':entry['totalOffsetCount']+=1
 else:raise ValueError(pid)
 try:
  p.write_text(json.dumps(data,indent=2)+'\n')
  trial=subprocess.run(['node',verifier,exe,install,ev,pid],capture_output=True,text=True)
  if trial.returncode==0:raise AssertionError(f'False evidence was ACCEPTED {pid}')
 finally:p.write_text(original)
 original_result=subprocess.run(['node',verifier,exe,install,ev,pid],capture_output=True,text=True)
 if original_result.returncode:raise AssertionError(f'Original report rejected {pid}: {original_result.stderr[-500:]}')
 print(pid,'altered evidence REJECTED; pristine PASS')
print('30/30 falsified source-evidence reports rejected; pristine originals passed')
