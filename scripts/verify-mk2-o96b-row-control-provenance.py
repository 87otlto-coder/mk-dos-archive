#!/usr/bin/env python3
"""Separate O96B LE relocation and exact guarded command-code verifier."""
import sys,json,hashlib,struct
from pathlib import Path
if len(sys.argv)!=4:raise SystemExit('usage: verify-mk2-o96b-row-control-provenance.py <fixture> <o96a> <o96b>')
root=Path(sys.argv[1]);aBytes=Path(sys.argv[2]).read_bytes();a=json.loads(aBytes);x=json.loads(Path(sys.argv[3]).read_text());b=(root/'mk2.exe').read_bytes();checks=0
def c(k,t):
 global checks
 checks+=1
 if not t:raise AssertionError(k)
def H(z):return hashlib.sha256(z).hexdigest()
def u(o):return struct.unpack_from('<I',b,o)[0]
def w(o):return struct.unpack_from('<H',b,o)[0]
L=0x28f0c;start=0x26654;dataStart=start+u(L+0x80);c('bound LE',u(start+0x3c)==L-start and dataStart==0x61c54)
c('fixture',H(b)==x['originalExeSha256']=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
c('O96A digest',x['source']['o96aSha256']==H(aBytes) and a['status']=='SUCCESS')
P=u(L+0x28);np=u(L+0x14);tab=L+u(L+0x40);endsTab=L+u(L+0x68);fixBase=L+u(L+0x6c)
ob=[(u(tab+24*i+12),u(tab+24*i+16)) for i in range(2)];c('objects',P==4096 and np==113 and ob==[(1,63),(64,50)])
ends=[u(endsTab+4*j) for j in range(np+1)];recordCount=0;targets={}
for pg in range(np):
 owner=next(i+1 for i,(beg,count) in enumerate(ob) if beg<=pg+1<beg+count)
 q=fixBase+ends[pg];end=fixBase+ends[pg+1];of=(pg+1-ob[owner-1][0])*P
 while q<end:
  typ=b[q]&15;flags=b[q+1];src=struct.unpack_from('<h',b,q+2)[0];q+=4
  c('fixup flags',flags&3==0)
  destObj=w(q) if flags&0x40 else b[q];q+=2 if flags&0x40 else 1
  dest=0
  if typ!=2:dest=u(q) if flags&0x10 else w(q);q+=4 if flags&0x10 else 2
  if flags&4:q+=4 if flags&0x20 else 2
  where=(owner,of+src)
  if where[0]==1 and where[1] in [0x82330-dataStart,0x8233e-dataStart,0x8234c-dataStart]:targets[where[1]]=(typ,destObj,dest)
  recordCount+=1
 c('page ending',q==end)
c('fixups',recordCount==x['reparsedFixups']==27004)
s=x['indexSource'];t=x['controlStream'];bases=[0x15bec,0x15c68,0x15ce4];immediates=[0x82330,0x8233e,0x8234c]
c('base list',s['tableBasesObject2']==bases and s['relocatedImmediatePhysical']==immediates)
for ip,base in zip(immediates,bases):
 c('loader fixed pointer',targets.get(ip-dataStart)==(7,2,base) and u(ip)==base)
c('index copied',b[0x82321:0x8232b].hex()=='a1805a0700a37f740700')
c('index shift',b[0x8232b:0x82334].hex()=='52c1e002baec5b0100')
c('switch table',b[0x82334:0x82350].hex()=='833d4c010300027413ba685c0100833d4c010300017405bae45c0100')
c('dereference replacement',b[0x82350:0x8235f].hex()=='03c25a8b00a3805a0700e853fbffff')
c('producer call',0x8235a+5+struct.unpack_from('<i',b,0x8235b)[0]==0x81eb2)
c('source hash',s['codeSha256']==H(b[0x82321:0x82373]))
c('global provenance',s['entryPhysical']==0x82321 and s['copyPhysical']==0x82326 and s['copiedFromGlobal']==0x75a80 and s['copiedIntoGlobal']==0x7747f)
c('counter and switch',s['indexMultiplyBy4'] is True and s['selectionSwitchGlobal']==0x3014c and s['tableLengthOrValidIndexRangeEstablished'] is False)
c('control read and token dispatch',b[0x93547:0x9355e].hex()=='8b0d985a07008b0183c104a9ffffffff74517931407410')
c('special 3-word tuple',b[0x9356e:0x9358c].hex()=='8b3183c1048b368b3983c1048b1983c104890d985a0700e88eab0000ebbb')
c('call to guard',0x93585+5+struct.unpack_from('<i',b,0x93586)[0]==0x9e118==t['callTargetPhysical'])
c('guarded command hash',t['codeSha256']==H(b[0x93547:0x935aa]))
c('special token',t['tokenByteLength']==4 and t['negativeOneTokenGuardedTuple'] and t['negativeOneTokenHasThreeDwordFields'] and t['firstTupleFieldDereferencedTwice'])
c('register destinations',t['firstTupleFieldToRegister']=='ESI' and t['secondTupleFieldToRegister']=='EDI' and t['thirdTupleFieldToRegister']=='EBX')
c('control flow',t['cursorGlobal']==0x75a98 and t['zeroTokenBranchesToExit'] is True and t['cursorAdvancedPastTupleBeforeCall'] is True)
c('callsite',t['directCallPhysical']==0x93585 and t['positiveAndOtherNegativeTokensRemainSeparatePaths'] is True)
for key in ('localProvenanceForIndexedTableReaderEstablished','localControlWordToConsumerEstablished'):c(key,x['classification'][key] is True)
for key in ('globalIndexNumericalValueAndRuntimeBoundingEstablished','stageOrFighterIdentityAssignmentEstablished','runtimeCallOrderingBetweenWriterAndRendererEstablished','universalControlGrammarEstablished','timingAndPaletteOwnershipEstablished','mk2ResearchClosed'):c(key,x['classification'][key] is False)
print(json.dumps({'status':'PASS','checks':checks,'failures':0,'relocations':recordCount,'tableBases':bases,'call':'0x93585->0x9E118'}))
