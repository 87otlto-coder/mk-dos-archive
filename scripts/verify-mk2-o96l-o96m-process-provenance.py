#!/usr/bin/env python3
"""Independent raw-MK2.EXE verifier of O96L process-code provenance and O96M near-target census."""
import sys,json,hashlib,struct
from pathlib import Path
if len(sys.argv)!=5:raise SystemExit('usage: verifier <mk2-dir> <o96l-json> <o96m-json> <output optional ignored>')
fix,lfile,mfile,_=map(Path,sys.argv[1:]); b=(fix/'mk2.exe').read_bytes(); lb=lfile.read_bytes();L=json.loads(lb);M=json.loads(mfile.read_text());tests=[0]
def ck(c,m):
 tests[0]+=1
 if not c:raise AssertionError(m)
def u(p):return struct.unpack_from('<I',b,p)[0]
def h(p):return struct.unpack_from('<H',b,p)[0]
def sh(p):return struct.unpack_from('<h',b,p)[0]
def signed(p):return struct.unpack_from('<i',b,p)[0]
def sha(p):return hashlib.sha256(p).hexdigest()
exe='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
ck(sha(b)==exe,'authentic MK2 fixture')
for r,form in ((L,'mk2_o96l_producer_loop_process_entry_provenance_v1'),(M,'mk2_o96m_list_producer_entry_reference_census_v1')):
 ck(r['format']==form and r['status']=='SUCCESS' and r['fixtureSha256']==exe,'schema fixture')
ck(M['priorO96LReportHash']==sha(lb),'O96L report exact prerequisite digest')
mz=0x26654; le=mz+u(mz+0x3c);filebase=mz+u(le+0x80);step=u(le+0x28);num=u(le+0x14);ot=le+u(le+0x40);ft=le+u(le+0x68);fr=le+u(le+0x6c)
first=[u(ot+12),u(ot+36)];pages=[u(ot+16),u(ot+40)]
ck((le,filebase,step,num)==(0x28f0c,0x61c54,4096,113),'LE header matches canonical layout')
rel={};total=0
for pg in range(num):
  owner=0 if pg+1<first[1] else 1
  cursor=fr+u(ft+4*pg); stop=fr+u(ft+4*(pg+1))
  while cursor<stop:
    kind=b[cursor]&15;flags=b[cursor+1];off=sh(cursor+2);cursor+=4
    ck((flags&3)==0,'known supported fixup flags')
    obj=h(cursor) if flags&64 else b[cursor];cursor+=2 if flags&64 else 1
    value=None
    if kind!=2:
      value=u(cursor) if flags&16 else h(cursor);cursor+=4 if flags&16 else 2
    if flags&4:cursor+=4 if flags&32 else 2
    where=filebase+(pg+1-first[owner])*step+off
    if where in (0x82367,0x8606c):rel[where]=(kind,obj,value)
    total+=1;ck(cursor<=stop,'fixup record bounds')
  ck(cursor==stop,'fixup page terminator')
ck(total==27004 and total==L['relocationCount'],'all 27004 independent fixup records')
entry=0x81b98; code_offset=entry-filebase; ck(code_offset==0x1ff44,'entry relative offset')
ck(L['object1']==dict(codeFileBase=filebase,loadedBase=0x10000,entryPhysical=entry,relativeEntry=code_offset,loadedEntry=code_offset+0x10000),'entry coordinate spaces')
def raw(p,s):ck(b[p:p+len(bytes.fromhex(s))]==bytes.fromhex(s),f'code bytes at {p:#x}')
def near(p,target,op=0xe8):ck(b[p]==op and p+5+signed(p+1)==target,f'near transfer at {p:#x}')
raw(0x81b98,'c7057c5a070008000000'); near(0x81ba2,0x81bb3);raw(0x81ba7,'a17c5a0700');near(0x81bac,0x6710f)
ck(b[0x81bb1]==0xeb and 0x81bb3+struct.unpack_from('<b',b,0x81bb2)[0]==0x81ba2,'actual short backward jump')
ck(L['repeatLoop']==dict(initialization=0x81b98,assignedGlobal=0x75a7c,initialValue=8,producerCall=0x81ba2,producer=0x81bb3,readGlobal=0x81ba7,schedulerCall=0x81bac,scheduler=0x6710f,backEdge=0x81bb1,backTarget=0x81ba2),'loop report')
raw(0x67222,'5551a1085b030085c07452');raw(0x67248,'89501c')
ck(b[0x6722b]==0x74 and 0x6722d+struct.unpack_from('<b',b,0x6722c)[0]==0x6727f,'constructor free-list conditional transfer')
ck(L['processConstructor']==dict(entry=0x67222,conditionalFreeListGate=0x67229,freeListAddress=0x35b08,storesCallbackAt=0x67248,objectFieldOffset=0x1c),'constructor semantic fields')
entries=[]
for setup,move,call in ((0x82361,0x82366,0x8236b),(0x86066,0x8606b,0x86070)):
 raw(setup,'bb05000000');ck(b[move]==0xba and u(move+1)==code_offset,'EDX callback code pointer')
 near(call,0x67222);ck(rel.get(move+1)==(7,1,code_offset),'type-7 Object1 relocation of EDX pointer')
 entries.append(dict(setup=setup,codePointerLoad=move,relocationOperand=move+1,call=call,callee=0x67222,relativeCodePointer=code_offset,codeEntry=entry,register='EDX',ebxInput=5))
ck(L['instantiations']==entries,'two exact construction sites')
for n,want in {'twoExecutableCodePointerAssignmentsAuthenticated':True,'constructorStoresCodePointerInProcessState':True,'repeatPathContainsProducerAndScheduler':True,'bothProcessInstantiationsGuaranteedExecuted':False,'producerGuaranteedRepeatedInGameplay':False,'preciseTimeUnitsEstablished':False,'stageOwnershipProven':False,'mk2Closed':False}.items():ck(L['classification'].get(n) is want,'O96L classification '+n)
expected=[('eightRowProducer',0x81bb3,18),('extraHead84358',0x665eb,38),('extraHead84364',0x93709,1),('extraHead84360',0x93722,5),('runtimeSlotInitializer',0x81b18,7)]
end=filebase+pages[0]*step
ck(M['codeRange']==dict(start=filebase,endExclusive=end) and end==0xa0c54,'Object-1 region')
census=[]
for name,addr,expected_count in expected:
 refs=[]
 for pos in range(filebase,end-4):
  if b[pos] in (0xe8,0xe9) and pos+5+signed(pos+1)==addr:
   refs.append(dict(physical=pos,operation='near_call' if b[pos]==0xe8 else 'near_jump'))
 ck(len(refs)==expected_count,f'{name}: exact direct-opcode matches')
 census.append(dict(name=name,address=addr,refs=refs,count=len(refs)))
ck(M['targets']==census,'O96M complete no-omission target callsite census')
raw(0x707eb,'e828130100');near(0x70810,0x81bb3);near(0x86041,0x81bb3);near(0x8605f,0x81bb3)
for p,d,t in [(0x646a6,0x646a8,0x93709),(0x646ad,0x646af,0x93722),(0x646b4,0x646b6,0x665eb)]:raw(p,'8bc7');near(d,t,0xe9)
ck(M['localSequentialWitnesses']==[dict(initializerCall=0x707eb,producerCall=0x70810),dict(producerCall=0x86041,laterProducerCall=0x8605f,laterProcessSpawnCall=0x86070)],'local sequence boundaries')
ck(M['trampolineBranches']==[dict(source=0x646a6,jump=0x646a8,target=0x93709),dict(source=0x646ad,jump=0x646af,target=0x93722),dict(source=0x646b4,jump=0x646b6,target=0x665eb)],'trampolines')
for n,want in {'directNearTransferBytesEnumerated':True,'allRawMatchesGuaranteedInstructionBoundaries':False,'localSequentialPathsQualifiedUnderNormalReturns':True,'guaranteedFrameOrSceneCoexecution':False,'palettesOrStageGeometryProven':False,'mk2Closed':False}.items():ck(M['classification'].get(n) is want,'O96M classification '+n)
print(json.dumps(dict(passes=['O96L','O96M'],status='PASS',checks=tests[0],failures=0,independentFixups=total,codePointers=2,referenceCounts={x[0]:x[2] for x in expected},guaranteedGameplayExecution=False)))
