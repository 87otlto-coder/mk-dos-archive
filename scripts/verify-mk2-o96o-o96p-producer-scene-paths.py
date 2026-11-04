#!/usr/bin/env python3
"""Independent fixture-only verifier for O96O and O96P. Fails closed."""
import json,sys,struct,hashlib
from pathlib import Path
if len(sys.argv)!=7:
 raise SystemExit('usage: verifier MK2_DIR O96F_JSON O96N_JSON O96O_JSON O96P_JSON [ignored]')
# Final argument reserved for explicit mode to avoid accidentally checking an unrelated report.
fd,nfile,of,pf,mode=[Path(x) if i<4 else x for i,x in enumerate(sys.argv[2:])]
assert mode=='strict','strict mode required'
fixture=Path(sys.argv[1]);b=(fixture/'mk2.exe').read_bytes();Fraw=fd.read_bytes();Nraw=nfile.read_bytes();Oraw=of.read_bytes();O=json.loads(Oraw);P=json.loads(Path(pf).read_text());F=json.loads(Fraw);N=json.loads(Nraw)
EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
counts={'O96O':0,'O96P':0};active='O96O'
def ck(c,msg):
 counts[active]+=1
 if not c:raise AssertionError(f'{active} verifier: {msg}')
def byte(at,h):ck(b[at:at+len(h)//2].hex()==h,'machine bytes '+hex(at))
def u(at):return struct.unpack_from('<I',b,at)[0]
def s(at):return struct.unpack_from('<i',b,at)[0]
def w(at):return struct.unpack_from('<H',b,at)[0]
def sh(at):return struct.unpack_from('<h',b,at)[0]
def sha(buf):return hashlib.sha256(buf).hexdigest()
def call(at,target):ck(b[at]==0xe8 and at+5+s(at+1)==target,f'near-call {at:06x}->{target:06x}')
ck(sha(b)==EXE==O['fixtureSha256'],'fixture');ck(N['status']=='SUCCESS' and O['o96nReportSha256']==sha(Nraw),'O96N provenance');ck(F['exeSha256']==EXE and O['o96fReportSha256']==sha(Fraw),'O96F provenance');ck(O['status']=='SUCCESS' and O['format']=='mk2_o96o_writer_to_producer_process_constructor_v1','report schema');ck(N['originalCreationCalls']==[0x8236b,0x86070] and N['scheduler']['indirectDispatchAt']==0x67185,'prior constructor entry');
expected=[0x74d4d,0x758cc,0x771e6,0x77a08,0x77d8b,0x84d32,0x84eee,0x85fae,0x94965]
# Reconstruct entire raw direct-near byte census independently from the authentic code pages.
found=[p for p in range(0x61c54,0xa0c54-4) if b[p]==0xe8 and p+5+s(p+1)==0x82321]
ck(found==expected,'complete nine-call raw census');calls=[]
for at in found:
 call(at,0x82321)
 lit=u(at-4) if b[at-10:at-4]==bytes.fromhex('c705805a0700') else None
 calls.append(dict(callsite=at,adjacentScalar=lit,localWriterEntry=0x82321,processConstructorInWriter=0x8236b))
ck(O['authenticatedCallers']==calls,'recomputed caller rows');ck([x['adjacentScalar'] for x in calls if x['adjacentScalar'] is not None]==[7,6,5,30,13]==O['adjacentLiteralValues'],'five immediate inputs');
for at,h in [(0x82321,'a1805a0700'),(0x82326,'a37f740700'),(0x8232b,'52c1e002'),(0x8232f,'baec5b0100'),(0x8233d,'ba685c0100'),(0x8234b,'bae45c0100'),(0x82350,'03c25a8b00a3805a0700'),(0x8235f,'5251bb05000000ba44ff0100'),(0x82370,'595ac3'),(0x67248,'89501c'),(0x67185,'ff661c')]:byte(at,h)
call(0x8235a,0x81eb2);call(0x8236b,0x67222)
ck(u(0x82367)==0x1ff44 and 0x61c54+0x1ff44==0x81b98,'exact callback address')
seq=dict(indexCaptureAt=0x82326,tableBases=[0x15bec,0x15c68,0x15ce4],pointerReadAt=0x82353,pointerStoreAt=0x82355,setupHelperCall=0x8235a,setupHelper=0x81eb2,constructorCall=0x8236b,constructor=0x67222,callbackValue=0x1ff44,callbackEntryPhysical=0x81b98,returnAt=0x82372)
ck(O['writer']==0x82321 and O['calleeSequence']==seq,'report same callee sequence')
for key,val in {'allNineSitesHaveSameConditionalProcessConstructionContinuation':True,'fiveLiteralInputsEnterWriterWithDownstreamConstructor':True,'selectedTableIndexLimitProven':False,'individualCallsGuaranteedGameplayExecuted':False,'helperAlwaysReturnsSafely':False,'constructorAlwaysAllocates':False,'stageIdentityProven':False,'sourceIndexPersistingToRowRendererProven':False,'mk2Closed':False}.items():ck(O['classification'].get(key) is val,'O96O no promotion '+key)
active='O96P'
ck(P['status']=='SUCCESS' and P['format']=='mk2_o96p_runtime_word_dual_source_conditional_producer_v1','format')
ck(P['fixtureSha256']==EXE and P['o96oReportSha256']==sha(Oraw),'O96O precursor')
for at,h in [(0x85fa4,'c705805a07000d000000'),(0x85fb3,'b805000000'),(0x86000,'b858430800'),(0x8600a,'8b0d26650700'),(0x86010,'bbc6c20100'),(0x86015,'0fbf0183c102a9ffffffff781f83f80d741a'),(0x86027,'0fbf1383c302c1e21081c2c5000000'),(0x86036,'5351'),(0x8603d,'595bebd4'),(0x8604b,'b848430800'),(0x86055,'b801000000a35b740700'),(0x86064,'5251bb05000000ba44ff0100'),(0x86075,'595a'),(0x8607c,'b801000000'),(0x8608c,'52c1e0020564c20100528b1089156c5a07005a')]:byte(at,h)
for at,to in [(0x85fae,0x82321),(0x85fb8,0x86bbb),(0x86005,0x6513b),(0x86038,0x8608c),(0x86041,0x81bb3),(0x86046,0x860c1),(0x86050,0x6513b),(0x8605f,0x81bb3),(0x86070,0x67222),(0x86077,0x650d9),(0x86081,0x6710f),(0x8609f,0x64548),(0x860a5,0x860fd)]:call(at,to)
# Full LE fixup reparse, verifies that the static helper tables are real Object-2 pointers.
mz=0x26654;le=mz+u(mz+0x3c);base=mz+u(le+0x80);size=u(le+0x28);np=u(le+0x14);ot=le+u(le+0x40);ft=le+u(le+0x68);fr=le+u(le+0x6c);objfirst=[u(ot+12),u(ot+36)];
ck(le==0x28f0c and base==0x61c54 and size==4096 and np==113 and objfirst==[1,64],'canonical bound LE');
watch={0x82330:(7,2,0x15bec),0x8233e:(7,2,0x15c68),0x8234c:(7,2,0x15ce4),0x86001:(7,2,0x84358),0x86011:(7,2,0x1c2c6),0x86091:(7,2,0x1c264),0x8606c:(7,1,0x1ff44)}
selected={};nfix=0
for pg in range(np):
 ob=0 if pg+1<objfirst[1] else 1;cur=fr+u(ft+4*pg);end=fr+u(ft+4*(pg+1))
 while cur<end:
  typ=b[cur]&15;flags=b[cur+1];loc=sh(cur+2);cur+=4
  ck((flags&3)==0,'relocation flags')
  target=w(cur) if flags&64 else b[cur];cur+=2 if flags&64 else 1
  value=None
  if typ!=2:value=u(cur) if flags&16 else w(cur);cur+=4 if flags&16 else 2
  if flags&4:cur+=4 if flags&32 else 2
  physical=base+(pg+1-objfirst[ob])*size+loc
  if physical in watch:selected[physical]=(typ,target,value)
  nfix+=1;ck(cur<=end,'relocation record bound')
 ck(cur==end,'relocation page boundary')
ck(nfix==27004,'27,004 relocs')
ck(selected==watch,'all seven exact table/callback relocations')
# This loop reads two independent signed WORDs, and only runtime-source sentinel governs exit.
ck(0x86022+struct.unpack_from('<b',b,0x86021)[0]==0x86041,'negative signed-token exit')
ck(0x86027+struct.unpack_from('<b',b,0x86026)[0]==0x86041,'sentinel 13 exit')
ck(0x86041+struct.unpack_from('<b',b,0x86040)[0]==0x86015,'loop back edge')
ck(P['literal13WriterCall']==0x85fae and P['writerFollowupCall']==0x85fb8,'entry sequence')
ck(P['pointerListHeadSetup']==dict(loadAt=0x86000,head=0x84358,helperCall=0x86005),'head init')
ck(P['loop']==dict(runtimeSourceGlobal=0x76526,runtimeLoadAt=0x8600a,pairedStaticSourceOffset=0x1c2c6,pairedStaticLoadAt=0x86010,readSignedRuntimeWordAt=0x86015,negativeOr13Exit=0x86041,exitSentinelWord=13,readSignedStaticWordAt=0x86027,combineHighWordAndLowConstantAt=0x8602d,lowConstant=0xc5,innerCall=0x86038,innerTarget=0x8608c,backJumpAt=0x8603f,backTarget=0x86015),'loop evidence')
ck(P['inner']==dict(indexedObject2Base=0x1c264,indexedTableLoadAt=0x86096,globalWriteAt=0x86098,consumerCallAt=0x8609f),'inner pointer consumer')
ck(P['afterLoop']==dict(firstProducerCall=0x86041,secondProducerCall=0x8605f,slotHeadLoad=0x8604b,slotHead=0x84348,callbackSetup=0x86066,processSpawnAt=0x86070,callbackEntryRelative=0x1ff44,postSpawnYieldAt=0x86081),'post-loop control path')
for key,val in {'pairedWordInputsAndSentinelBranchesBounded':True,'secondProcessConstructionPathAfterLoopQualified':True,'actualRuntimeWordStreamKnown':False,'terminationForEveryRuntimeStreamGuaranteed':False,'arrayIndexLegalRangeEstablished':False,'loopExecutionInGameplayObserved':False,'secondProcessGuaranteedAllocated':False,'sceneOrStageNameProven':False,'paletteOrScreenGeometryProven':False,'mk2Closed':False}.items():ck(P['classification'].get(key) is val,'O96P no promotion '+key)
print(json.dumps({'status':'PASS','passes':{'O96O':{'checks':counts['O96O'],'failures':0},'O96P':{'checks':counts['O96P'],'failures':0}},'totalChecks':sum(counts.values()),'fixtureSha256':EXE,'relocationsReparsed':nfix,'negativeRuntimeClaimsRetained':True}))
