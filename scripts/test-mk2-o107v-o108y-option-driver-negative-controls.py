#!/usr/bin/env python3
"""Falsify each semantic report, refresh its ledger digest, demand JS source-verifier rejection."""
import sys,json,hashlib,pathlib,subprocess
exe,fixture,folder,verifier=sys.argv[1:5];folder=pathlib.Path(folder)
ledgerpath=folder/'mk2_o108y_options_audio_30pass_ledger_2026-10-09.json'
orig=ledgerpath.read_bytes();ledger=json.loads(orig);n=0
for i,m in enumerate(ledger['reports']):
 path=folder/m['filename'];data=path.read_bytes();r=json.loads(data)
 try:
  if r['kind']=='OPTIONS_SNAPSHOT_REAPPLY':r['shadow']^=4
  elif r['kind']=='HARDWARE_FLAG_INITIALIZER':r['allocationRequest']+=1
  elif r['kind']=='MUSIC_EXTENSION_SELECTION':r['bit']*=2
  elif r['kind']=='NATIVE_DRIVER_TWO_ENTRY_STUBS':r['sharedTarget']+=1
  elif r['kind']=='OPTIONS_APPLY_STEP':r['offset']+=1
  elif r['kind']=='AUDIO_MUSIC_LOADER_STEP':r['offset']+=1
  else:raise AssertionError(r['kind'])
  path.write_text(json.dumps(r,indent=2)+'\n')
  ledger['reports'][i]['sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
  ledgerpath.write_text(json.dumps(ledger,indent=2)+'\n')
  res=subprocess.run(['node',verifier,exe,fixture,str(folder)],capture_output=True,text=True)
  if res.returncode==0:raise AssertionError(f'falsification {m["pass"]} was accepted')
  if 'ASSERTION_FAIL' not in res.stderr:raise AssertionError(f'incorrect rejection for {m["pass"]}: {res.stderr[-400:]}')
  n+=1
 finally:
  path.write_bytes(data); ledgerpath.write_bytes(orig)
  ledger=json.loads(orig)
res=subprocess.run(['node',verifier,exe,fixture,str(folder)],capture_output=True,text=True)
if res.returncode:raise AssertionError(res.stderr)
print(json.dumps({'tamperTestsRejected':n,'pristineVerification':json.loads(res.stdout),'allLedgerHashesRestored':ledgerpath.read_bytes()==orig}))
