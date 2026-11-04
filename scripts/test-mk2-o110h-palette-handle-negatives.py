#!/usr/bin/env python3
"""Mutation tests: altered palette allocator evidence must be rejected."""
import copy
import json
import subprocess
import sys
import tempfile
from pathlib import Path
if len(sys.argv)!=4: raise SystemExit('usage: script <original-mk2-dir> <report> <verifier>')
original= json.loads(Path(sys.argv[2]).read_text())
cases={}
for label in ('slots','stage_handle','static_palette_claim','callsite','refcount','base','request','illustration'):
 r=copy.deepcopy(original)
 if label=='slots':r['entryTable']['entryCount']=61
 if label=='stage_handle':r['stageConsumer']['paletteHandleLiteral']=0
 if label=='static_palette_claim':r['stageConsumer']['resolvedRuntimeHandleOneRecord']='48_COLOR'
 if label=='callsite':r['exactE8DestinationEncodings']['request']['positions'][0]+=1
 if label=='refcount':r['release']['zeroCountClearsBankBase']=True
 if label=='base':r['targetByteAnchors']['requestBankStartStore']['hex']='8814dd065b0701'
 if label=='request':r['allocator']['initialBankBaseForNoPreviousLiveEntries']=0
 if label=='illustration':r['conditionalIllustrations'][1]['assignedBankBase']=49
 cases[label]=r
baseline=subprocess.run([sys.executable,sys.argv[3],sys.argv[1],sys.argv[2]],capture_output=True,text=True)
assert baseline.returncode==0,(baseline.stdout,baseline.stderr)
with tempfile.TemporaryDirectory(prefix='o110h-negatives-') as d:
 for name,r in cases.items():
  f=Path(d)/(name+'.json');f.write_text(json.dumps(r))
  p=subprocess.run([sys.executable,sys.argv[3],sys.argv[1],str(f)],capture_output=True,text=True)
  assert p.returncode!=0 and ('AssertionError' in p.stderr),(name,p.stdout,p.stderr)
 print(json.dumps({'status':'PASS','tamperedReportsRejected':len(cases)}))
