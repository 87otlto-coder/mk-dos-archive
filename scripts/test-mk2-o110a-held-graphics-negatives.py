#!/usr/bin/env python3
"""O110A falsification tests, including a recomputed manifest (no stale-hash shortcut)."""
import json,zipfile,subprocess,sys,tempfile
from pathlib import Path
exe,root,archive,verifier=map(Path,sys.argv[1:5])
with zipfile.ZipFile(archive) as z:
    manifest=json.loads(z.read('MANIFEST_O110A.json'))
    source_files={i.filename:z.read(i.filename) for i in z.infolist() if i.filename!='MANIFEST_O110A.json'}

def cases(m,c):
    if c==0:m['resources'][0]['descriptors'][0]['pixelSha256']='0'*64
    if c==1:m['resources'][0]['raw896']['rowStrideBytes']=895
    if c==2:m['resources'][0]['fullyKnownAsIndexedGraphics']=True
    if c==3:m['resources'][0]['byteCoverage']['qualifiedUnion']-=1
with tempfile.TemporaryDirectory() as tmp:
    for c in range(4):
        m=json.loads(json.dumps(manifest));cases(m,c)
        zz=Path(tmp)/f'bad{c}.zip'
        with zipfile.ZipFile(zz,'w',compression=zipfile.ZIP_DEFLATED) as z:
            for nm,v in source_files.items():z.writestr(nm,v)
            z.writestr('MANIFEST_O110A.json',json.dumps(m,indent=2)+'\n')
        result=subprocess.run([sys.executable,str(verifier),str(exe),str(root),str(zz)],text=True,capture_output=True)
        assert result.returncode!=0,(c,result.stdout,result.stderr)
        print(f'NEGATIVE {c+1}/4 REJECTED')
result=subprocess.run([sys.executable,str(verifier),str(exe),str(root),str(archive)],text=True,capture_output=True)
assert result.returncode==0,(result.stdout,result.stderr)
print('PRISTINE PASS',result.stdout.strip())
