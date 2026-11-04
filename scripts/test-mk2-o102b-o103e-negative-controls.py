#!/usr/bin/env python3
import sys,json,glob,subprocess
from pathlib import Path
exe,game,src,reports,verifier=sys.argv[1:6]
files=sorted(Path(reports).glob('mk2_o10*.json'));assert len(files)==30,len(files)
for i,f in enumerate(files):
 pristine=f.read_bytes();d=json.loads(pristine);ev=d['evidence'];key=next(iter(ev));obj=ev[key]
 # Corrupt an actual source-derived evidence field for every pass.
 if isinstance(obj,bool):ev[key]=not obj
 elif isinstance(obj,int):ev[key]=obj+1
 elif isinstance(obj,str):ev[key]='FALSIFIED_'+obj
 elif isinstance(obj,list):ev[key]=obj[1:] if obj else ['FALSIFIED']
 elif isinstance(obj,dict):ev[key]={'falsified':True}
 else:raise TypeError(type(obj))
 try:
  f.write_text(json.dumps(d,indent=2)+'\n');p=subprocess.run(['node',verifier,exe,game,src,reports,d['passId']],capture_output=True,text=True)
  assert p.returncode!=0,(d['passId'],p.stdout,p.stderr)
 finally:f.write_bytes(pristine)
 print(d['passId'],'REJECTED mutated',key)
print('NEGATIVE_CONTROLS_PASS',len(files))
