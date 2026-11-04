#!/usr/bin/env python3
"""Falsify each of 30 reports and its ledger hash; native-file independent JS validation must reject."""
import pathlib,sys,json,hashlib,tempfile,subprocess,shutil
exe=pathlib.Path(sys.argv[1]);fixture=pathlib.Path(sys.argv[2]);directory=pathlib.Path(sys.argv[3]);verify=pathlib.Path(sys.argv[4]);sha=lambda b:hashlib.sha256(b).hexdigest()
orig=json.loads((directory/'mk2_o106q_audio_handoff_thirty_pass_ledger_2026-10-09.json').read_text());assert len(orig['reports'])==30
rejected=0
for i,rec in enumerate(orig['reports']):
 with tempfile.TemporaryDirectory(prefix='mk2-o106q-false-') as tmp:
  t=pathlib.Path(tmp)
  for row in orig['reports']:
   n=pathlib.Path(row['path']).name; (t/n).symlink_to(directory/n)
  key=pathlib.Path(rec['path']).name;target=json.loads((directory/key).read_text());k=target['kind']
  if k=='DOS_LOADER_HANDOFF':target['handoff']['int80RequestAh']=5
  elif k=='INDEXED_MARKER_BOUNDARIES':target['rows'][0]['indexAnchors'][0]['identifier']=255
  elif k=='SEGMENT_INTERVAL_INTEGRITY':target['rows'][0]['spans'][0]['sha256']='0'*64
  elif k=='RAW_COMMAND_CONTEXT_HYPOTHESES':target['rows'][0]['rawByteContext'][0]['rawCount']+=1
  elif k=='CROSS_HARDWARE_STRUCTURE':target['rows'][0]['metadataByte']^=1
  elif k=='NATIVE_DRIVER_SCOPE':target['driverEvidence']['length']+=1
  else:raise AssertionError(k)
  (t/key).unlink();(t/key).write_text(json.dumps(target,indent=2)+'\n')
  tampered=json.loads(json.dumps(orig));tampered['reports'][i]['sha256']=sha((t/key).read_bytes());(t/'mk2_o106q_audio_handoff_thirty_pass_ledger_2026-10-09.json').write_text(json.dumps(tampered,indent=2)+'\n')
  p=subprocess.run(['node',str(verify),str(exe),str(fixture),str(t)],capture_output=True,text=True)
  if p.returncode==0:raise RuntimeError('Falsification passed unexpectedly '+rec['pass'])
  if 'O106Q_REJECT' not in p.stderr:raise RuntimeError('Not a verifier rejection '+rec['pass']+' '+p.stderr[-500:])
  rejected+=1
print(json.dumps({'status':'PASS','tamperedReportsRejected':rejected,'originalUnmodified':True,'tamperedLedgerDigestUpdated':True}))
