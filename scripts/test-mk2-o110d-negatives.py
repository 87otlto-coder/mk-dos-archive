#!/usr/bin/env python3
"""Adversarial timing/frame falsifications for the separately implemented intro verifier."""
import json,tempfile,subprocess,copy,sys,hashlib
from pathlib import Path
exe,game,asset,timeline,gif,verifier=sys.argv[1:]
raw=json.loads(Path(timeline).read_text())
with tempfile.TemporaryDirectory(prefix='o110d_neg_') as td:
 root=Path(td);cases=[]
 for label,mutate in [
  ('false_first_dwell',lambda t:t['probeFrames'][0].update(nominalTicksUntilNextTransition=99)),
  ('false_source_frame_offset',lambda t:t['probeFrames'][15].update(sourceHeaderOffset=t['probeFrames'][15]['sourceHeaderOffset']+2)),
  ('false_frame_order',lambda t:t['probeFrames'][20].update(frame=17)),
  ('false_final_wait',lambda t:t['probeFrames'][-1].update(nominalTicksUntilNextTransition=1))
 ]:
  t=copy.deepcopy(raw);mutate(t);p=root/(label+'.json');p.write_text(json.dumps(t,indent=2)+'\n');cases.append((label,p))
 for label,p in cases:
  q=subprocess.run(['python',verifier,exe,game,asset,str(p),gif],capture_output=True,timeout=80)
  if q.returncode==0:raise AssertionError('accepted forged evidence '+label)
  print(label,'REJECTED')
 q=subprocess.run(['python',verifier,exe,game,asset,timeline,gif],capture_output=True,timeout=80)
 if q.returncode:raise AssertionError('clean failed '+q.stderr.decode()[:200])
 print('restored passes',json.loads(q.stdout)['checks'],'negative controls',len(cases))
