#!/usr/bin/env python3
"""O110G five tamper tests for the independent original-fixture verifier."""
import json,copy,subprocess,sys,tempfile
from pathlib import Path
if len(sys.argv)!=5:raise SystemExit('usage: negative.py <fixture> <O110F report> <O110G report> <verifier>')
fixture,prior,report,verifier=map(Path,sys.argv[1:]);orig=json.loads(report.read_text())
variants=[]
def test(name,fn):
 d=copy.deepcopy(orig);fn(d);variants.append((name,d))
test('faked stage-runtime palette ownership',lambda d:d['interpretation'].__setitem__('samePaletteUsedToRenderArmoryProven',True))
test('faked renderer palette-handle binding',lambda d:d['paletteSlotOne'].__setitem__('actualSlotOneRecordAtDraw','48 COLOR'))
test('forged slot-5 ARMORY pointer',lambda d:d['boundedCallsitePairs'][0].__setitem__('selectorToPackedTableValue',0x1a01ed84))
test('ignored intervening call for index 6',lambda d:d['boundedCallsitePairs'][1].__setitem__('interveningCalls',[]))
test('invented index-6 nonzero resource',lambda d:d['packedIndexedLookup'].__setitem__('slot6OriginalPacked',0x1a01ed80))
with tempfile.TemporaryDirectory() as td:
 for name,item in variants:
  bad=Path(td)/'bad.json';bad.write_text(json.dumps(item)+'\n')
  r=subprocess.run([sys.executable,str(verifier),str(fixture),str(prior),str(bad)],capture_output=True,text=True)
  assert r.returncode!=0,'false evidence accepted: '+name
  print('REJECTED:',name)
 clean=subprocess.run([sys.executable,str(verifier),str(fixture),str(prior),str(report)],capture_output=True,text=True)
 assert clean.returncode==0,clean.stderr
 print('CLEAN:',clean.stdout.strip())
print('NEGATIVE_CONTROLS_PASS:',len(variants),'of',len(variants))
