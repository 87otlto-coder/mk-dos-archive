#!/usr/bin/env python3
"""Independent O96C: parse original LE fixups, locate literal stores, prove unbacked targets."""
import sys,json,hashlib,struct
from pathlib import Path
if len(sys.argv)!=4:raise SystemExit('usage: verifier <mk2 dir> <O96B JSON> <O96C JSON>')
b=(Path(sys.argv[1])/'mk2.exe').read_bytes();p=Path(sys.argv[3]);z=json.loads(p.read_text());prior=Path(sys.argv[2]).read_bytes();checks=0
def ck(msg,pred):
 global checks
 checks+=1
 if not pred:raise AssertionError(msg)
def sha(t):return hashlib.sha256(t).hexdigest()
def u(i):return struct.unpack_from('<I',b,i)[0]
def w(i):return struct.unpack_from('<H',b,i)[0]
ck('canonical fixture',sha(b)==z['exeSha256']=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
ck('prior report hash',sha(prior)==z['source']['o96bSha256'] and json.loads(prior)['status']=='SUCCESS')
mz=0x26654;LE=mz+u(mz+0x3c);datas=mz+u(LE+0x80);size=u(LE+0x28);np=u(LE+0x14)
ck('LE topology',LE==0x28f0c and datas==0x61c54 and size==4096 and np==113)
OT=LE+u(LE+0x40);FT=LE+u(LE+0x68);FB=LE+u(LE+0x6c)
objects=[{'id':n+1,'virtualSize':u(OT+24*n),'relocationBase':u(OT+24*n+4),'firstPage':u(OT+24*n+12),'pageCount':u(OT+24*n+16)} for n in range(2)]
ck('objects exact',objects==[{'id':1,'virtualSize':0x3ee98,'relocationBase':0x10000,'firstPage':1,'pageCount':63},{'id':2,'virtualSize':0x86660,'relocationBase':0x50000,'firstPage':64,'pageCount':50}])
fix={};nfix=0
for pg in range(np):
 owner=next(o for o in objects if o['firstPage']<=pg+1<o['firstPage']+o['pageCount']);cur=FB+u(FT+pg*4);end=FB+u(FT+(pg+1)*4)
 while cur<end:
  typ=b[cur]&15;flags=b[cur+1];offs=struct.unpack_from('<h',b,cur+2)[0];cur+=4
  ck('fixup flags',flags&3==0)
  targetObj=w(cur) if flags&64 else b[cur];cur+=2 if flags&64 else 1
  target=0
  if typ!=2:target=u(cur) if flags&16 else w(cur);cur+=4 if flags&16 else 2
  if flags&4:cur+=4 if flags&32 else 2
  fix[(owner['id'],(pg+1-owner['firstPage'])*size+offs)]=(typ,targetObj,target);nfix+=1
 ck('page boundary',cur==end)
ck('fixup count',nfix==27004==z['loader']['totalFixups'])
ck('metadata',z['loader']['object2']==objects[1] and z['loader']['object2BackedCapacity']==0x32000 and z['loader']['object2UnbackedVirtualBytes']==0x54660)
needle=bytes.fromhex('c705985a0700');matches=[]
for i in range(datas,datas+objects[0]['pageCount']*size-len(needle)-4):
 if b[i:i+6]==needle:
  rel=fix.get((1,i+6-datas));raw=u(i+6);matches.append((i,i+6,raw,rel))
ck('15 code words',len(matches)==len(z['literalSites'])==15)
reloc=[];scalar=[]
for (ip,p,raw,rel),item in zip(matches,z['literalSites']):
 ck('site exact bytes',item['instructionPhysical']==ip and item['immediatePhysical']==p and item['immediateRaw']==raw)
 expected=None if rel is None else {'type':rel[0],'toObj':rel[1],'toOff':rel[2]}
 ck('site relocation',item['relocation']==expected)
 if rel==(7,2,raw):reloc.append((ip,raw))
 else:scalar.append((ip,raw))
ck('category count',len(reloc)==13 and len(scalar)==2 and z['classification']['relocationBackedObject2Sites']==13 and z['classification']['scalarSites']==2)
ck('scalar immediate',scalar==[(0x8538e,11),(0x8543d,0)])
targets=sorted({x for _,x in reloc});ck('7 distinct targets',targets==[0x84334,0x84338,0x8433c,0x84340,0x84344,0x84348,0x84350]==z['classification']['uniqueUnbackedTargetOffsets'])
for target in targets:ck('target in unbacked O2',0x32000<=target<objects[1]['virtualSize'])
ck('global',z['cursorGlobal']==0x75a98)
for flag in ('targetsFallInsideFileBackedObject2','theseTargetsHaveStaticSerializedControlRecords','actualRuntimeInitializationEstablished','mk2ResearchClosed'):ck(flag,z['classification'][flag] is False)
ck('limited census',z['classification']['scopeIsExactLiteralWritesOnly'] is True)
print(json.dumps({'pass':'O96C','status':'PASS','checks':checks,'failures':0,'relocationRecords':nfix,'controlLiteralStores':len(matches),'backedTargetCount':0,'unbackedTargetCount':len(targets)}))
