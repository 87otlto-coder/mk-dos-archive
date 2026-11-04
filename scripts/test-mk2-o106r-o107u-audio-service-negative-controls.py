#!/usr/bin/env python3
"""Mutate each O106R–O107U report; recompute its manifest hash; require source-backed rejection."""
import json,hashlib,subprocess,sys,pathlib
exe,root,out,verifier=sys.argv[1:];out=pathlib.Path(out);lp=out/'mk2_o107u_audio_service_thirty_pass_ledger_2026-10-09.json';original=lp.read_bytes();led=json.loads(original);success=0
for i,e in enumerate(led['reports']):
 p=out/e['filename'];old=p.read_bytes();r=json.loads(old);k=r['kind']
 if k=='PROTECTED_AUDIO_INT80_CALL':r['ah']=(r['ah']+1)%256
 elif k=='NATIVE_DRIVER_DUAL_ENTRY':r['sharedCallTarget']+=1
 elif k=='UNINDEXED_INTERIOR_MARKER':r['interiorByteOffset']+=1
 elif k=='EXECUTABLE_MUSIC_FILENAME_BRANCH':r['hardwareSelector']+=1
 elif k=='REALMODE_PCM_SAMPLE_API_CALL':r['requestAh']=42
 elif k=='REALMODE_INT80_CHANNEL_QUERY':r['queryFailureSentinel']=0
 elif k=='REALMODE_PCM_VOLUME_HELPER':r['volumeFieldOffset']=0
 else:raise ValueError(k)
 try:
  p.write_text(json.dumps(r,indent=2)+'\n');led['reports'][i]['sha256']=hashlib.sha256(p.read_bytes()).hexdigest();lp.write_text(json.dumps(led,indent=2)+'\n')
  t=subprocess.run(['node',verifier,exe,root,str(out)],capture_output=True,text=True)
  if t.returncode==0:raise RuntimeError('false report accepted '+e['pass'])
  success+=1
 finally:
  p.write_bytes(old);led['reports'][i]['sha256']=e['sha256'];lp.write_bytes(original)
check=subprocess.run(['node',verifier,exe,root,str(out)],capture_output=True,text=True)
if check.returncode:raise RuntimeError(check.stderr)
print(json.dumps({'status':'PASS','rejectedFalseReports':success,'originalReportsPass':True,'manifestHashesRecomputedInMutations':True}))
