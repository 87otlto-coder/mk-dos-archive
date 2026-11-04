#!/usr/bin/env python3
"""Adversarial controls: require independent O110F verifier to reject forged evidence."""
import copy, json, subprocess, sys, tempfile
from pathlib import Path
if len(sys.argv)!=4:raise SystemExit('usage: script <fixture> <report.json> <verifier.py>')
fixture,report_path,verify=map(Path,sys.argv[1:]);original=json.loads(report_path.read_text())
variants=[]
def mut(name,func):
 data=copy.deepcopy(original);func(data);variants.append((name,data))
mut('invented stage palette ownership',lambda r:r['researchBoundaries'].__setitem__('stagePaletteBankSlot1IdentityProven',True))
mut('forged allocator callsite',lambda r:r['callSites'][0].__setitem__('callPhysical',0x640c8))
mut('relocation target corruption',lambda r:r['callSites'][2].__setitem__('paletteTargetOffset',0x26cc8))
mut('forged source palette digest',lambda r:r['sourcePaletteRecords'][0].__setitem__('sha256','0'*64))
mut('swapped raw stage index maximum',lambda r:r['packedStageSuffixIndexDomains'][0].__setitem__('sourceIndexMax',47))
with tempfile.TemporaryDirectory() as td:
 for name,variant in variants:
  p=Path(td)/'tampered.json';p.write_text(json.dumps(variant)+'\n')
  trial=subprocess.run([sys.executable,str(verify),str(fixture),str(p)],capture_output=True,text=True)
  if trial.returncode==0:raise AssertionError('verifier incorrectly accepted '+name)
  print('REJECTED:',name)
 clean=subprocess.run([sys.executable,str(verify),str(fixture),str(report_path)],capture_output=True,text=True)
 if clean.returncode:raise AssertionError('clean verifier regression: '+clean.stderr)
 print('CLEAN:',clean.stdout.strip())
print('NEGATIVE_CONTROLS_PASS:',len(variants),'of',len(variants))
