#!/usr/bin/env python3
"""Twenty independent report-tampering tests; pristine reports remain unchanged."""
import json,subprocess,tempfile,shutil,sys
from pathlib import Path
exe,fixture,prior,reports,verifier=map(Path,sys.argv[1:6]);source=sorted(reports.glob('mk2_o*_2026-10-09.json'))
source=[p for p in source if json.loads(p.read_text()).get('format')=='mk2_o99j_o100c_20pass_raw_mixed_gap_tests_v1']
assert len(source)==20,(len(source),source)
ok=0
with tempfile.TemporaryDirectory(prefix='mk2_o99j_negative_') as t:
 temp=Path(t)
 for f in source:shutil.copyfile(f,temp/f.name)
 for f in source:
  p=temp/f.name;data=json.loads(p.read_text());tag=data['passId'];item=data['evidence'];key=next(k for k in item if k!='classification');old=item[key]
  if isinstance(old,int):item[key]=old+1
  elif isinstance(old,str):item[key]='falsified_'+old
  elif isinstance(old,list):item[key]=old+[999999]
  elif isinstance(old,dict):item[key]={'falsified':True}
  else:raise TypeError((tag,key,type(old)))
  p.write_text(json.dumps(data,indent=2)+'\n')
  cmd=['node',str(verifier),str(exe),str(fixture),str(prior),str(temp),tag]
  bad=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
  if bad.returncode==0:raise AssertionError(f'{tag} mutated evidence was NOT rejected')
  shutil.copyfile(f,p)
  good=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
  if good.returncode!=0:raise AssertionError(f'{tag} good evidence unexpectedly failed: {good.stderr[-800:]}')
  ok+=1;print(json.dumps({'pass':tag,'falsification':'REJECTED','restored':'PASS'}))
print(json.dumps({'result':'PASS','negativeControlsRejected':ok,'pristineRestorations':ok}))
