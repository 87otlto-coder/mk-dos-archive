#!/usr/bin/env python3
"""Independent authenticated-EXE verification of O96K extra linked-list insertion wrappers."""
import struct,json,hashlib,sys
from pathlib import Path
if len(sys.argv)!=5:raise SystemExit('usage: verifier <mk2-dir> <o96i> <o96j> <o96k>')
fixdir,ip,jp,kp=map(Path,sys.argv[1:]);b=(fixdir/'mk2.exe').read_bytes();i_bytes=ip.read_bytes();j_bytes=jp.read_bytes();I=json.loads(i_bytes);J=json.loads(j_bytes);K=json.loads(kp.read_text());count=[0]
def ck(condition,why):
 count[0]+=1
 if not condition:raise AssertionError(why)
def u(n):return struct.unpack_from('<I',b,n)[0]
def w(n):return struct.unpack_from('<H',b,n)[0]
def s(n):return struct.unpack_from('<h',b,n)[0]
def i32(n):return struct.unpack_from('<i',b,n)[0]
def sha(d):return hashlib.sha256(d).hexdigest()
exe='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
ck(sha(b)==exe and K['exeSha256']==exe,'fixture')
ck(K['format']=='mk2_o96k_explicit_runtime_object_list_insertion_coverage_v1' and K['status']=='SUCCESS','format')
ck(K['prerequisites']=={'o96i':sha(i_bytes),'o96j':sha(j_bytes)},'prior hashes')
ck(I['status']==J['status']=='SUCCESS','previous status')
mz=0x26654;le=mz+u(mz+0x3c);base=mz+u(le+0x80);p=u(le+0x28);np=u(le+0x14);ot=le+u(le+0x40);ft=le+u(le+0x68);fr=le+u(le+0x6c)
first=[u(ot+12),u(ot+36)];pages=[u(ot+16),u(ot+40)]
for val,exp in [(base,0x61c54),(np,113),(p,4096),(le,0x28f0c)]:ck(val==exp,'loader')
fixups={};n=0
for pg in range(np):
 owner=0 if pg+1<first[1] else 1;cur=fr+u(ft+pg*4);end=fr+u(ft+(pg+1)*4)
 while cur<end:
  typ=b[cur]&15;fl=b[cur+1];off=s(cur+2);cur+=4;ck((fl&3)==0,'flags')
  targetobj=w(cur) if fl&64 else b[cur];cur+=2 if fl&64 else 1
  dest=None
  if typ!=2:dest=u(cur) if fl&16 else w(cur);cur+=4 if fl&16 else 2
  if fl&4:cur+=4 if fl&32 else 2
  pos=base+(pg+1-first[owner])*p+off
  if pos in (0x665fb,0x93719,0x93732):fixups[pos]=(typ,targetobj,dest)
  n+=1;ck(cur<=end,'fixup record bounds')
 ck(cur==end,'fixup end')
ck(n==27004 and n==K['relocationCount'],'all relocations')
rawhex='53ff35645a07005152ff356c5a0700'
original=[(0x665eb,0x665fa,0x84358,'fallthrough'),(0x93709,0x93718,0x84364,'jmp_rel32'),(0x93722,0x93731,0x84360,'jmp_rel32')]
wrappers=[]
for entry,move,head,mode in original:
 ck(b[entry:entry+15].hex()==rawhex,'wrapper registers preserved')
 ck(b[move]==0xba and u(move+1)==head,'list-head immediate')
 ck(fixups.get(move+1)==(7,2,head),'relocation address proof')
 if mode=='jmp_rel32':ck(b[move+5]==0xe9 and move+10+i32(move+6)==0x665ff,'jump reaches inserter')
 else:ck(move+5==0x665ff,'fall-through reaches inserter')
 wrappers.append({'entry':entry,'move':move,'head':head,'transfer':0x665ff,'flow':mode,'relocationOperand':move+1})
ck(K['wrappers']==wrappers,'precise wrapper details')
ck(b[0x665ff:0x6660d].hex()=='8b5820528b501c89156c5a07005a','inserter reads object fields')
ck(b[0x66631:0x6663d].hex()=='8910518b0d645a0700890159','inserter pointer chain update')
producerHeads=[r['selectedRuntimeListHead'] for r in I['sourceTable']['rows']]
consumerHeads=J['listConsumer']['allPositiveCursorHeadPointers']
ck(len(producerHeads)==8 and len(set(producerHeads))==8,'producer eight')
ck(len(consumerHeads)==10 and len(set(consumerHeads))==10,'positive ten')
covered=sorted(set(producerHeads+[w['head'] for w in wrappers])&set(consumerHeads))
ck(len(covered)==10,'all positive heads can be inserted by some qualified code')
ck(K['previousEightProducerHeads']==producerHeads and K['positiveListHeadUniverse']==consumerHeads and K['coveredPositiveListHeads']==covered,'coverage fields')
ck(K['unrelatedExtraWrapperHead']==0x84364 and 0x84364 not in consumerHeads,'extra wrapper distinct')
for name,expected in {'allTenPositiveHeadsHaveAuthenticatedConditionalInsertionPaths':True,'eightFromO96iTableTwoFromExplicitWrappers':True,'everyHeadHasProvenLiveRuntimePopulation':False,'provenSameSceneOrdering':False,'allStagesReconstructed':False,'correctPaletteProven':False,'mk2ResearchClosed':False}.items():ck(K['classification'][name] is expected,'epistemic gate '+name)
print(json.dumps({'pass':'O96K','result':'PASS','checks':count[0],'failures':0,'fixupsParsed':n,'distinctWrappers':len(wrappers),'coveredPositiveHeads':len(covered),'provenLivePopulation':False}))
