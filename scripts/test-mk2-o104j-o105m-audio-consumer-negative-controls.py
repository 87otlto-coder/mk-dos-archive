#!/usr/bin/env python3
"""Tamper one independently consumed source field in every pass; restore exact bytes after each test."""
import sys,subprocess,json,pathlib
exe,install,folder,verifier=sys.argv[1:]; folder=pathlib.Path(folder)
ids=['O104'+x for x in 'JKLMNOPQRSTUVWXYZ']+['O105'+x for x in 'ABCDEFGHIJKLM'];formats=['mid','lap','gvs','sbl','awe'];types=['loader_suffix_branch','marker_to_offset_correlation','cross_hardware_binary_identity','candidate_command_arity','offset_partition_profiles','hardware_driver_inventory']
rej=0
for j,pid in enumerate(ids):
 ext=formats[j%5];kind=types[j//5];fn=folder/f'mk2_{pid.lower()}_audio_{kind}_{ext}_2026-10-09.json';raw=fn.read_bytes();rep=json.loads(raw)
 if kind=='loader_suffix_branch':rep['loaderCase']['selectorGlobal']='0xFAKE'
 elif kind=='marker_to_offset_correlation':rep['files'][0]['offsetCount']+=1
 elif kind=='cross_hardware_binary_identity':rep['files'][0]['sha256']='0'*64
 elif kind=='candidate_command_arity':rep['files'][0]['opcodeStats'][0]['occurrences']+=1
 elif kind=='offset_partition_profiles':rep['files'][0]['spans'][0]['sha256']='0'*64
 elif kind=='hardware_driver_inventory':rep['files'][0]['driverSha256']='0'*64
 else:raise ValueError(kind)
 args=['node',verifier,exe,install,str(folder),pid]
 try:
  fn.write_text(json.dumps(rep))
  altered=subprocess.run(args,capture_output=True,text=True)
 finally:fn.write_bytes(raw)
 pristine=subprocess.run(args,capture_output=True,text=True)
 if altered.returncode==0 or pristine.returncode!=0:raise RuntimeError(f'FAILED negative control {pid}, tampered {altered.returncode}, pristine {pristine.returncode}, {pristine.stderr[:300]}')
 rej+=1;print(pid,'REJECTED tampered; pristine PASS')
print(json.dumps({'status':'PASS','falseEvidenceRejected':rej,'originalReportsRestored':rej,'failures':0}))
