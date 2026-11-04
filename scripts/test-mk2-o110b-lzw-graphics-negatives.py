#!/usr/bin/env python3
"""Five independently detectable O110B archive fabrications.
A changed PNG/IDX with updated reported hash must still fail source-to-pixel tests.
"""
import hashlib,io,json,subprocess,sys,tempfile,zipfile
from PIL import Image
from pathlib import Path
fixture=Path(sys.argv[1]);archive=Path(sys.argv[2]);verifier=Path(sys.argv[3]);
with zipfile.ZipFile(archive) as src:
 records={i.filename:src.read(i) for i in src.infolist() if not i.is_dir()}
manifest=json.loads(records['MANIFEST_O110B.json'])
scenarios=[]
def s1(d,m):
 k='probe/frames/000.idx8'; v=bytearray(d[k]);v[31840]^=0x01;d[k]=bytes(v)
 m['resources']['probe.gra']['frames'][0]['pixelsSha256']=hashlib.sha256(d[k]).hexdigest()
scenarios.append(('falsified_probe_index_and_updated_digest',s1))
def s2(d,m):
 m['resources']['probe.gra']['frames'][29]['terminatedByZeroSubblock']=True
scenarios.append(('invented_probe_last_subblock',s2))
def s3(d,m):
 k='fonts/linear_mask_tape.mask8';v=bytearray(d[k]);v[123]^=1;d[k]=bytes(v);m['fontPrefix']['maskSha256']=hashlib.sha256(d[k]).hexdigest()
scenarios.append(('falsified_font_mask_with_new_digest',s3))
def s4(d,m):
 k='acclaim/frames/000.rgb555_CANDIDATE.png';im=Image.open(io.BytesIO(d[k])).convert('RGB');im.putpixel((160,100),(255,0,0));out=io.BytesIO();im.save(out,format='PNG');d[k]=out.getvalue()
 m['resources']['acclaim.gra']['frames'][0]['pngSha256']=hashlib.sha256(d[k]).hexdigest()
scenarios.append(('corrupted_acclaim_png',s4))
def s5(d,m):
 m['monksOpcodeRuns']['meaningKnown']=True
scenarios.append(('fabricated_monks_semantics',s5))
results=[]
with tempfile.TemporaryDirectory() as td:
 for i,(name,change) in enumerate(scenarios):
  data=dict(records);m=json.loads(json.dumps(manifest));change(data,m)
  data['MANIFEST_O110B.json']=(json.dumps(m,indent=2,sort_keys=True)+'\n').encode()
  bad=Path(td)/f'false{i}.zip'
  with zipfile.ZipFile(bad,'w',compression=zipfile.ZIP_DEFLATED) as z:
   for k,v in data.items():z.writestr(k,v)
  proc=subprocess.run([sys.executable,str(verifier),str(fixture),str(bad)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=60)
  assert proc.returncode!=0,f'bad report accepted: {name}'
  results.append({'test':name,'rejected':True,'exitCode':proc.returncode})
 clean=subprocess.run([sys.executable,str(verifier),str(fixture),str(archive)],capture_output=True,text=True,timeout=60)
 assert clean.returncode==0,clean.stderr
print(json.dumps({'status':'PASS','negativeTests':results,'originalRestoredAndVerified':True},indent=2))
