#!/usr/bin/env python3
import copy,json,subprocess,sys,tempfile
from pathlib import Path
if len(sys.argv)!=5:raise SystemExit('usage: script <mk2-dir> <O110G> <O110J> <verifier>')
original=json.loads(Path(sys.argv[3]).read_text())
base=subprocess.run([sys.executable,sys.argv[4],sys.argv[1],sys.argv[2],sys.argv[3]],capture_output=True,text=True)
assert base.returncode==0,(base.stdout,base.stderr)
cases={}
for name in ('direct_source','index_5','index_6','helper','request','proven','colors','writer'):
 r=copy.deepcopy(original)
 if name=='direct_source':r['conclusions']['selectorLiteralsAreAllocatorReturnValues']=True
 if name=='index_5':r['sourceToWriterPaths'][0]['selectorLiteral']=4
 if name=='index_6':r['sourceToWriterPaths'][1]['selectorLiteral']=5
 if name=='helper':r['index6Helper']['firstInstruction']='MOV EAX,EAX'
 if name=='request':r['sourceToWriterPaths'][0]['allocatorCall']+=1
 if name=='proven':r['conclusions']['allocationAtSlotOneProven']=True
 if name=='colors':r['conclusions']['runtimeSceneColorOwnershipProven']=True
 if name=='writer':r['writer']['sourceGlobal']=0x75a84
 cases[name]=r
with tempfile.TemporaryDirectory(prefix='mk2-o110j-negative-') as d:
 for name,r in cases.items():
  target=Path(d)/(name+'.json');target.write_text(json.dumps(r))
  p=subprocess.run([sys.executable,sys.argv[4],sys.argv[1],sys.argv[2],str(target)],capture_output=True,text=True)
  assert p.returncode !=0 and 'AssertionError' in p.stderr,(name,p.stdout,p.stderr)
print(json.dumps({'status':'PASS','tamperedReportsRejected':len(cases)}))
