#!/usr/bin/env python3
"""Independent O96Q direct operand census, control slices and exact relocation types."""
import sys,json,hashlib,struct
from pathlib import Path
if len(sys.argv)!=4:raise SystemExit('usage: verifier <mk2dir> <o96p-json> <o96q-json>')
b=(Path(sys.argv[1])/'mk2.exe').read_bytes();prior=Path(sys.argv[2]).read_bytes();v=json.loads(Path(sys.argv[3]).read_text());num=0
def check(cond,why):
 global num
 num+=1
 if not cond:raise AssertionError(why)
def hash(x):return hashlib.sha256(x).hexdigest()
def seq(at,h):check(b[at:at+len(h)//2].hex()==h,hex(at)+' byte sequence')
def U(p):return struct.unpack_from('<I',b,p)[0]
def W(p):return struct.unpack_from('<H',b,p)[0]
def S(p):return struct.unpack_from('<h',b,p)[0]
def call(at,t):check(b[at]==0xe8 and at+5+struct.unpack_from('<i',b,at+1)[0]==t,'CALL '+hex(at))
exe='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
check(hash(b)==v['fixtureSha256']==exe,'canonical fixture');check(hash(prior)==v['o96pReportSha256'] and json.loads(prior)['status']=='SUCCESS','O96P prerequisite');check(v['status']=='SUCCESS' and v['format']=='mk2_o96q_runtime_word_stream_source_writer_ancestry_v1','report format');
needle=bytes.fromhex('26650700');positions=[p for p in range(0x61c54,0xa0c54-3) if b[p:p+4]==needle]
check(positions==[0x757ad,0x763e9,0x76470,0x85d76,0x8600c,0x97fd3]==v['directOperandPositions'],'six exact direct operands');
for p,h in [(0x757aa,'33c0'),(0x757ac,'a326650700'),(0x97fa0,'b806000000'),(0x97faa,'48c1e002'),(0x97fae,'0580af0200'),(0x97fb3,'8b00'),(0x97fb5,'f705dacf0200ffffffff'),(0x97fc1,'f70506d00200ffffffff'),(0x97fcd,'b878b00200'),(0x97fd2,'a326650700c3'),(0x8600a,'8b0d26650700'),(0x85d75,'a126650700'),(0x7646f,'a126650700')]:seq(p,h)
call(0x757ca,0x97fa0);call(0x97fa5,0x645e5)
check(v['sourceGlobal']==0x76526,'global identity');
check(v['directStores']==[{'at':0x757ac,'source':'ZERO_EAX','value':0},{'at':0x97fd2,'source':'DYNAMIC_EAX','sourceSelectors':['INDEXED_DWORD_AT_OBJECT2_0x2AF80','CONDITIONAL_OVERRIDE_OBJECT2_0x2B078']}],'two stores');check(v['directReaders']==[0x763e9,0x76470,0x85d76,0x8600c],'reader sites');
check(v['localInitializationPath']=={'zeroStoreAt':0x757ac,'callDynamicInstallerAt':0x757ca,'dynamicInstaller':0x97fa0},'sequence');check(v['installer']=={'entry':0x97fa0,'scalarHelperAt':0x97fa5,'selectorBase':0x2af80,'selectorTableReadAt':0x97fb3,'firstConditionalTestAt':0x97fb5,'secondConditionalTestAt':0x97fc1,'overrideValue':0x2b078,'overrideAt':0x97fcd,'finalStoreAt':0x97fd2},'installer')
# Independently walk LE relocations and ensure the two source operands have exact Object-2 proven relocation targets.
mz=0x26654;le=mz+U(mz+0x3c);base=mz+U(le+0x80);np=U(le+0x14);sz=U(le+0x28);ot=le+U(le+0x40);ft=le+U(le+0x68);fr=le+U(le+0x6c);first=[U(ot+12),U(ot+36)]
check((le,base,np,sz,first)==(0x28f0c,0x61c54,113,4096,[1,64]),'LE topology')
wanted={0x97faf:(7,2,0x2af80),0x97fce:(7,2,0x2b078)};found={};total=0
for pg in range(np):
 ob=0 if pg+1<first[1] else 1;pos=fr+U(ft+4*pg);end=fr+U(ft+4*(pg+1))
 while pos<end:
  typ=b[pos]&15;flags=b[pos+1];offset=S(pos+2);pos+=4
  check((flags&3)==0,'relocation target flags')
  target=W(pos) if flags&64 else b[pos];pos+=2 if flags&64 else 1
  val=None
  if typ!=2:
   val=U(pos) if flags&16 else W(pos);pos+=4 if flags&16 else 2
  if flags&4:pos+=4 if flags&32 else 2
  phys=base+(pg+1-first[ob])*sz+offset
  if phys in wanted:found[phys]=(typ,target,val)
  check(pos<=end,'relocation record within page');total+=1
 check(pos==end,'relocation exact page end')
check(total==27004,'relocation total');check(found==wanted,'two direct Object2 relocations');
for key,expected in {'twoDirectStoresAndFourDirectReadsExact':True,'localZeroThenInstallerCallProven':True,'tableOrOverrideValueCanSourceGlobal':True,'runtimeWordContentsEnumerated':False,'tableIndexBoundsProven':False,'callAndProducerSceneCoexecutionProven':False,'stageIdentificationEstablished':False,'mk2Closed':False}.items():check(v['classification'].get(key) is expected,'classification '+key)
print(json.dumps({'pass':'O96Q','status':'PASS','checks':num,'failures':0,'relocationsReparsed':total,'directStores':2,'directReaders':4}))
