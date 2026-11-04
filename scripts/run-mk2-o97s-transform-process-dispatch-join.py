#!/usr/bin/env python3
"""O97S: conditional process-constructor -> scheduler -> profile chooser, without runtime stage inference."""
import struct,hashlib,json,sys
from pathlib import Path
fixture,root=map(Path,sys.argv[1:3]);b=(fixture/'mk2.exe').read_bytes();d=lambda x:hashlib.sha256(x).hexdigest();u=lambda a:struct.unpack_from('<I',b,a)[0];w=lambda a:struct.unpack_from('<H',b,a)[0]
assert d(b)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
prev=(root/'mk2_mountain_directional_threshold_dispatch_o97q_2026-10-09.json').read_bytes();assert json.loads(prev)['status']=='PASS'
le=0x28f0c;ix=le+u(le+0x68);recs=le+u(le+0x6c);rel={};count=0
for pg in range(u(le+0x14)):
 c=recs+u(ix+pg*4);e=recs+u(ix+(pg+1)*4)
 while c<e:
  kind=b[c]&15;fl=b[c+1];delta=struct.unpack_from('<h',b,c+2)[0];c+=4
  obj=w(c) if fl&64 else b[c];c+=2 if fl&64 else 1
  target=None
  if kind!=2:target=u(c) if fl&16 else w(c);c+=4 if fl&16 else 2
  if fl&4:c+=4 if fl&32 else 2
  rel[0x61c54+pg*4096+delta]=(kind,fl,obj,target);count+=1
assert count==27004
sites=[]
for start in [0x645ac,0x84b60]:
 dat=b[start:start+18]
 assert dat[:12]==bytes.fromhex('5251bb04000000ba8a030200')
 assert rel.get(start+8)==(7,16,1,0x2038a)
 assert dat[12]==0xe8
 target=start+17+struct.unpack_from('<i',dat,13)[0]
 assert target==0x67222
 sites.append({'entryPhysical':start,'entryObject1':start-0x61c54,'codeHex':dat.hex(),'pointerRelocationOperand':start+8,'entryObject1Pointer':0x2038a,'entryPhysicalTarget':0x81fde,'constructorCallAt':start+12,'constructorPhysical':target,'constructorParameterEBX':4})
assert b[0x67248:0x6724b].hex()=='89501c'
assert b[0x67185:0x67188].hex()=='ff661c'
assert b[0x81fde:0x81ff2].hex()=='33c0a3e4420800a1165d0700c1e010a3e8420800'
assert b[0x81ff2]==0xe8 and 0x81ff7+struct.unpack_from('<i',b,0x81ff3)[0]==0x82003
assert b[0x81ff7:0x82003].hex()=='b801000000e80e51feffebef'
assert b[0x82003:0x8200e].hex()=='0fbf471a0fbf1d2e430800'
assert b[0x82178:0x82182].hex()=='c705645a0700905f0100'
assert b[0x821aa:0x821b4].hex()=='c705645a0700dc5f0100'
assert b[0x8224b:0x8224d].hex()=='ffd1'
report={'format':'mk2_o97s_directional_transform_process_callback_join_v1','status':'PASS','fixtureSha256':d(b),'relocationRecords':count,'priorO97qSha256':d(prev),'constructorSites':sites,'callbackProcess':{'entryPhysical':0x81fde,'entryObject1':0x2038a,'loopCallAt':0x81ff2,'loopTarget':0x82003,'schedulerYieldAt':0x81ffc,'loopBackAt':0x82001,'selectorTablePositiveAt':0x8217e,'selectorTableNegativeAt':0x821b0,'indirectTransformCallAt':0x8224b},'processFieldContract':{'constructorStoresEntrypointAt':0x67248,'schedulerIndirectJumpAt':0x67185,'processFieldByteOffset':28},'hypotheses':{'twoSitesConstructCallbackForThresholdSelection':'SUPPORTED_CONDITIONALLY','schedulerCanResumeThisCallbackThroughField0x1c':'SUPPORTED','callbackLoopReachesThresholdSelectorUnderItsBranches':'SUPPORTED_CONDITIONALLY','mountainBattlePlanAlwaysRunsThisProcess':'UNPROVEN','runtimeDirectionOrMagnitudeKnown':'UNPROVEN','wallClockFrameRateOrScrollUnits':'UNPROVEN'},'limits':'Two typed relocation-backed process constructions can register callback 0x81FDE. Its loop calls 0x82003, which conditionally enters the two threshold tables. This does not prove either caller runs during Mountain/battle-plan gameplay, scalar values, execution cadence, or successful completion on every branch.'}
(root/'mk2_mountain_directional_transform_process_join_o97s_2026-10-09.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'pass':'O97S','status':'PASS','relocations':count,'sites':len(sites),'callback':hex(0x81fde)}))
