#!/usr/bin/env python3
"""Adversarial wrong-source/carry/camera cases; recomputes manifest changes to evade metadata-only checks."""
import sys,io,json,zipfile,subprocess,tempfile,pathlib,copy,hashlib
exe,fixture,archive,verifier=sys.argv[1:]
with zipfile.ZipFile(archive) as z: original={n:z.read(n) for n in z.namelist()}
manifest=json.loads(original['MANIFEST.json']);sha=lambda b:hashlib.sha256(b).hexdigest()
tests=[]
# 1 source-index bytes corrupted, evidence hash changed to match tamper
mod=copy.deepcopy(original);m=copy.deepcopy(manifest);r=m['rows'][0];c=r['cases'][1];fname=c['outputFile'];buf=bytearray(mod[fname]);buf[45]^=0x1;mod[fname]=bytes(buf);c['indexSHA256']=sha(mod[fname]);mod['MANIFEST.json']=(json.dumps(m,indent=2)+'\n').encode();tests.append(('rehash_and_forge_index',mod))
# 2 attempt to masquerade as a different valid perspective source position
mod=copy.deepcopy(original);m=copy.deepcopy(manifest);m['rows'][2]['cases'][0]['x']=400;mod['MANIFEST.json']=(json.dumps(m,indent=2)+'\n').encode();tests.append(('forged_camera',mod))
# 3 claim the 32-bit palette offset is harmless and has no per-pixel carries
mod=copy.deepcopy(original);m=copy.deepcopy(manifest);m['rows'][5]['cases'][2]['uniformByteShiftWouldDiffer']=False;mod['MANIFEST.json']=(json.dumps(m,indent=2)+'\n').encode();tests.append(('false_no_carry',mod))
# 4 forged source packed-resource slot
mod=copy.deepcopy(original);m=copy.deepcopy(manifest);m['rows'][3]['packedOffset']+=4;mod['MANIFEST.json']=(json.dumps(m,indent=2)+'\n').encode();tests.append(('false_packed_offset',mod))
with tempfile.TemporaryDirectory(prefix='o110c_adversarial_') as root:
 for i,(name,content) in enumerate(tests):
  path=pathlib.Path(root)/f'{i}.zip'
  with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:
   for n,v in content.items():z.writestr(n,v)
  q=subprocess.run(['node',verifier,exe,fixture,str(path)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=50)
  if q.returncode==0:raise RuntimeError('wrongly ACCEPTED '+name)
  print(name,'REJECTED',q.stderr.decode().splitlines()[0][:140])
q=subprocess.run(['node',verifier,exe,fixture,archive],stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=50)
if q.returncode:raise RuntimeError('pristine failed '+q.stderr.decode())
print('pristine PASSED',json.loads(q.stdout)['checks'],'; negatives rejected',len(tests))
