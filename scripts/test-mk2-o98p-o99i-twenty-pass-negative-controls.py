#!/usr/bin/env python3
"""Tamper exactly one claim per O98P–O99I report; original reports are restored byte-for-byte."""
import json,subprocess,sys,hashlib
from pathlib import Path
exe,fixture,o69,folder,verifier=map(Path,sys.argv[1:]);files=sorted(folder.glob('mk2_o9*_2026-10-09.json'));names=[]
for f in files:
 try:
  p=json.loads(f.read_bytes());tag=p.get('pass','')
 except Exception:continue
 if tag and tag in ['O98P']+[f'O98{a}' for a in 'QRSTUVWXYZ']+[f'O99{a}' for a in 'ABCDEFGHI']:
  names.append((tag,f))
assert len(names)==20,(len(names),names)
for tag,f in names:
 original=f.read_bytes(); obj=json.loads(original)
 try:
  if tag=='O98P': obj['cursorEvidence']['identicalSceneActivationEstablished']=True
  else: obj['resourceEvidence'][0]['records'][0]['pixelsSha256']='0'*64
  f.write_text(json.dumps(obj,indent=2)+'\n')
  proc=subprocess.run(['node',str(verifier),str(exe),str(fixture),str(o69),str(folder),tag],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,timeout=90)
  assert proc.returncode!=0,(tag,'tamper erroneously accepted')
 finally:
  f.write_bytes(original)
 assert hashlib.sha256(f.read_bytes()).hexdigest()==hashlib.sha256(original).hexdigest()
 proc=subprocess.run(['node',str(verifier),str(exe),str(fixture),str(o69),str(folder),tag],stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=90)
 assert proc.returncode==0,(tag,proc.stderr.decode()[:1500])
 print(tag,'tamper REJECTED; original PASS')
print('20/20 tampered reports rejected; 20/20 originals restored and reverified')
