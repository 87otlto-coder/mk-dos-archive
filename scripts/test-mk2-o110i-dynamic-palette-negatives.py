#!/usr/bin/env python3
import copy,json,subprocess,sys,tempfile
from pathlib import Path
if len(sys.argv)!=5:raise SystemExit('usage: script <original-mk2-dir> <parent> <O110I> <verifier>')
original=json.loads(Path(sys.argv[3]).read_text())
cases={}
for label in ('count','proven','token','source','return','site','sourceHash','falseIntro'):
 r=copy.deepcopy(original)
 if label=='count':r['dynamicInputSiteCount']=8
 if label=='proven':r['tokenEight']['stagePaletteHandleOneBindingProven']=True
 if label=='token':r['tokenEight']['tokenLiteral']=9
 if label=='source':r['dynamicInputSites'][0]['preHex']='8b1d6c5a07008b430c5b83f8007408'
 if label=='return':r['dynamicInputSites'][4]['postHex']='66894731'
 if label=='site':r['dynamicInputSites'][7]['call']=0x98c78
 if label=='sourceHash':r['originalExeSHA256']='0'*64
 if label=='falseIntro':r['introFirstHandleBankBaseLookup']=0x98c8b
 cases[label]=r
baseline=subprocess.run([sys.executable,sys.argv[4],sys.argv[1],sys.argv[2],sys.argv[3]],capture_output=True,text=True)
assert baseline.returncode==0,(baseline.stdout,baseline.stderr)
with tempfile.TemporaryDirectory(prefix='mk2-o110i-negatives-') as d:
 for name,report in cases.items():
  f=Path(d)/(name+'.json');f.write_text(json.dumps(report))
  r=subprocess.run([sys.executable,sys.argv[4],sys.argv[1],sys.argv[2],str(f)],capture_output=True,text=True)
  assert r.returncode != 0 and ('AssertionError' in r.stderr),(name,r.stdout,r.stderr)
print(json.dumps({'status':'PASS','tamperedReportsRejected':len(cases)}))
