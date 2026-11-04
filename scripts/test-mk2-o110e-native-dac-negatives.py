#!/usr/bin/env python3
import sys,json,zipfile,tempfile,subprocess,shutil,io,hashlib
from pathlib import Path
from PIL import Image
exe,native,old,arch,rep,ver=map(Path,sys.argv[1:]);good=json.loads(rep.read_text());member='probe/frames/000.DAC6_ONE_BASE_CONDITIONAL.png';runs=[]
def call(checkArch,checkRep,label):
 proc=subprocess.run([sys.executable,str(ver),str(exe),str(native),str(old),str(checkArch),str(checkRep)],capture_output=True,text=True)
 if proc.returncode==0:raise AssertionError(f'failed to reject {label}')
 runs.append({'mutation':label,'detected':True})
with tempfile.TemporaryDirectory() as tmp:
 tmp=Path(tmp)
 for i,(label,mutate) in enumerate([
  ('false native DAC color byte',lambda j:j['resources']['probe.gra'].__setitem__('dac6SHA256','0'*64)),
  ('false palette record boundary',lambda j:j['resources']['acclaim.gra']['groups'][0].__setitem__('colorsByteStart',13)),
  ('false known-pixel count',lambda j:j['resources']['probe.gra']['frames'][0].__setitem__('knownOneBasedPixelCount',4)),
  ('false source code SHA',lambda j:j.__setitem__('exeSha256','0'*64)),
 ]):
  j=json.loads(json.dumps(good));mutate(j);p=tmp/f'negative{i}.json';p.write_text(json.dumps(j));call(arch,p,label)
 with zipfile.ZipFile(arch) as z:
  base={n:z.read(n) for n in z.namelist()}
  image=Image.open(io.BytesIO(base[member])).convert('RGB');image.putpixel((120,60),(12,34,56));buf=io.BytesIO();image.save(buf,'PNG');base[member]=buf.getvalue()
  altered=tmp/'false_pixels.zip'
  with zipfile.ZipFile(altered,'w',compression=zipfile.ZIP_DEFLATED) as z:
   for k,v in base.items():z.writestr(k,v)
  call(altered,rep,'false original-index-to-color PNG even when ZIP CRC recomputed')
print(json.dumps({'negativeTests':len(runs),'allDetected':True,'tests':runs},indent=2))
