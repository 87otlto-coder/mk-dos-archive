#!/usr/bin/env python3
"""Independent process-list scheduler and callback dispatch proof for MK2 O96N."""
import json,sys,struct,hashlib
from pathlib import Path
if len(sys.argv)!=4:raise SystemExit('usage: verifier <mk2-dir> <o96l-report> <o96n-report>')
fix,lpath,npath=map(Path,sys.argv[1:]);b=(fix/'mk2.exe').read_bytes();lb=lpath.read_bytes();L=json.loads(lb);N=json.loads(npath.read_text());checks=[0]
def ck(ok,why):
 checks[0]+=1
 if not ok:raise AssertionError(why)
def code(offset,hexstring):ck(b[offset:offset+len(hexstring)//2].hex()==hexstring,f'original machine code {offset:x}')
def u(pos):return struct.unpack_from('<I',b,pos)[0]
def sha(data):return hashlib.sha256(data).hexdigest()
exe='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
ck(sha(b)==exe and N['fixtureSha256']==exe,'authentic executable')
ck(N['o96lReportSha256']==sha(lb) and L['status']=='SUCCESS' and L['fixtureSha256']==exe,'upstream verified report')
ck(N['format']=='mk2_o96n_process_callback_scheduler_dispatch_v1' and N['status']=='SUCCESS','report version')
ck(N['originalEntry']==0x81b98 and N['originalObject1Relative']==0x1ff44,'exact process entry coordinate')
ck(N['originalCreationCalls']==[0x8236b,0x86070] and [x['call'] for x in L['instantiations']]==N['originalCreationCalls'],'spawn to processor links')
ck(N['processFieldOffset']==0x1c,'callback field offset')
verified=[]
for loc,hx,meaning in [(0x67248,'89501c','constructor_writes_EDX_to_new_process_plus_1c'),(0x67114,'89561c','yield_saves_return_address_to_current_process_plus_1c'),(0x67185,'ff661c','scheduler_indirect_jump_via_current_process_plus_1c')]:
 code(loc,hx);verified.append(dict(position=loc,encoding=hx,role=meaning))
ck(N['pointerUses']==verified,'three required same-field machine consumers')
code(0x67108,'be045b0300');code(0x6710f,'5a66894606');code(0x67152,'8b3685f67430');code(0x67158,'66ff4e067ff4');code(0x6715e,'8b6e08')
ck(b[0x6710d]==0xeb and 0x6710f+struct.unpack_from('<b',b,0x6710e)[0]==0x67152,'scheduler sentinel to list dispatch')
code(0x67235,'8b0e89088906');code(0x67242,'66c740060100');code(0x67182,'8b7e18')
restores=[]
for src,dest,field,store in [(0x67162,0x75a80,0x0c,0x67165),(0x6716d,0x75a7c,0x10,0x67170),(0x67178,0x75a78,0x14,0x6717b)]:
 code(src,'8b56'+format(field,'02x'))
 ck(b[store:store+2]==bytes([0x89,0x15]) and u(store+2)==dest,'scheduler global restore')
 restores.append(dict(at=src,from_=field,to=dest,store=store))
expected=[{'at':x['at'],'from':x['from_'],'to':x['to'],'store':x['store']} for x in restores]
ck(N['scheduler']['restoreGlobals']==expected,'report save/restore field identity')
ck(N['constructor']==dict(entry=0x67222,activeHeadLinkWrite=0x67239,entryFieldWrite=0x67248,initialCountFieldAt=0x67242),'constructor contract')
ck(N['yield']==dict(entry=0x6710f,savesReturnToField=0x67114),'yield contract')
ck({k:v for k,v in N['scheduler'].items() if k!='restoreGlobals'}=={'listSentinel':0x67108,'listIteration':0x67152,'emptyListBranchAt':0x67156,'countDecrementAt':0x67158,'countPositiveJumpAt':0x6715c,'restoreBasePointerAt':0x6715e,'restoreEDIAt':0x67182,'indirectDispatchAt':0x67185},'scheduler contract')
for k,v in {'sameFieldReadWriteAndIndirectDispatchQualified':True,'constructorToCallbackRuntimeMechanismQualified':True,'processSchedulingConditional':True,'liveExecutionOfSpecificProcessObserved':False,'everyFrameProducerInvocationEstablished':False,'schedulerUnitsMappedToWallClock':False,'stageIdentityProven':False,'mk2Closed':False}.items():ck(N['classification'].get(k) is v,k)
print(json.dumps({'pass':'O96N','result':'PASS','checks':checks[0],'failures':0,'savedCallbackOffset':0x1c,'dispatchAt':0x67185,'observedRuntime':False}))
