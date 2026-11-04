#!/usr/bin/env python3
"""Four report-forgery controls; always restore pristine reports and reverify."""
import copy,json,subprocess,sys
from pathlib import Path
fixture,root=map(Path,sys.argv[1:3]);base=Path(__file__).parent
cases=[
 ('O97P','mk2_mountain_directional_transform_threshold_tables_o97p_2026-10-09.json',['node',str(base/'verify-mk2-o97p-directional-threshold-tables.mjs')],lambda r:r['tables'][0]['rows'][0].__setitem__('pointerObject1Offset',0x20834)),
 ('O97Q','mk2_mountain_directional_threshold_dispatch_o97q_2026-10-09.json',['python',str(base/'verify-mk2-o97q-threshold-dispatch.py')],lambda r:r['selections'][1]['selection'].__setitem__('profileIndex',15)),
 ('O97R','mk2_mountain_profile_magnitude_scalar_ancestry_o97r_2026-10-09.json',['node',str(base/'verify-mk2-o97r-directional-scalar-ancestry.mjs')],lambda r:r['initializer']['zeroedGlobalAddresses'][0].__setitem__('global',0xDEAD)),
 ('O97S','mk2_mountain_directional_transform_process_join_o97s_2026-10-09.json',['node',str(base/'verify-mk2-o97s-transform-process-dispatch-join.mjs')],lambda r:r['constructorSites'][0].__setitem__('entryPhysical',0x645ad)),
]
for label,name,cmd,mutate in cases:
 path=root/name; original=path.read_bytes()
 try:
  mutated=json.loads(original);mutate(mutated)
  path.write_text(json.dumps(mutated,indent=2)+'\n')
  p=subprocess.run(cmd+[str(fixture),str(root)],capture_output=True,text=True,timeout=30)
  if p.returncode==0:raise AssertionError('falsification ACCEPTED for '+label)
 finally:path.write_bytes(original)
 p=subprocess.run(cmd+[str(fixture),str(root)],capture_output=True,text=True,timeout=30)
 if p.returncode:raise AssertionError(f'{label} pristine rejected: {p.stdout} {p.stderr}')
 print(json.dumps({'case':label,'fabrication':'REJECTED','pristine':'PASS'}))
print(json.dumps({'negativeControls':len(cases),'rejected':len(cases),'status':'PASS'}))
