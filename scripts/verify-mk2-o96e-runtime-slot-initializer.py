#!/usr/bin/env python3
"""Independent O96E reproduction of zero-store run and Object-2 relocation targets."""
import sys, json,hashlib,struct
from pathlib import Path
if len(sys.argv)!=4:raise SystemExit('usage: O96Everify <fixture> <o96c> <o96e>')
b=(Path(sys.argv[1])/'mk2.exe').read_bytes();prior=Path(sys.argv[2]).read_bytes();z=json.loads(Path(sys.argv[3]).read_text());check=0
def ck(msg,val):
 global check
 check+=1
 if not val:raise AssertionError(msg)
def H(v):return hashlib.sha256(v).hexdigest()
def u(p):return struct.unpack_from('<I',b,p)[0]
def w(p):return struct.unpack_from('<H',b,p)[0]
ck('source hash',z['source']['o96cSha256']==H(prior) and json.loads(prior)['status']=='SUCCESS')
ck('canonical',H(b)==z['exeSha256']=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
m=0x26654;L=m+u(m+0x3c);d=m+u(L+0x80);P=u(L+0x28);np=u(L+0x14);OT=L+u(L+0x40);FT=L+u(L+0x68);FR=L+u(L+0x6c)
ck('LE',L==0x28f0c and d==0x61c54 and P==4096 and np==113)
objs=[(u(OT+24*i+12),u(OT+24*i+16),u(OT+24*i)) for i in range(2)];ck('O2',objs[1]==(64,50,0x86660))
fix={};count=0
for pg in range(np):
 owner=next(i+1 for i,(start,n,sz) in enumerate(objs) if start<=pg+1<start+n)
 cur=FR+u(FT+4*pg);end=FR+u(FT+4*(pg+1))
 while cur<end:
  typ=b[cur]&15;flags=b[cur+1];offs=struct.unpack_from('<h',b,cur+2)[0];cur+=4
  ck('flags',flags&3==0)
  destob=w(cur) if flags&64 else b[cur];cur+=2 if flags&64 else 1;target=0
  if typ!=2:target=u(cur) if flags&16 else w(cur);cur+=4 if flags&16 else 2
  if flags&4:cur+=4 if flags&32 else 2
  fix[(owner,(pg+1-objs[owner-1][0])*P+offs)]=(typ,destob,target);count+=1
 ck('end page',cur==end)
ck('count',count==27004)
a=z['initializer'];ck('zeroed EAX',b[0x81b18:0x81b1d].hex()=='50515733c0')
targets=[0x8435c,0x84350,0x8434c,0x84348,0x84344,0x84340,0x8433c,0x84338,0x84334];ck('stores',len(a['zeroWrites'])==len(targets)==9)
for i,(target,item) in enumerate(zip(targets,a['zeroWrites'])):
 at=0x81b1d+i*5
 ck('MOV moffs32',b[at]==0xa3 and u(at+1)==target)
 ck('fixup target',fix.get((1,at+1-d))==(7,2,target))
 ck('JSON source',item=={'instructionPhysical':at,'destinationRawOffsetObject2':target,'fixupSourcePhysical':at+1})
 ck('unbacked valid',0x32000<=target<0x86660)
ck('run exact',a['entryPhysical']==0x81b18 and a['endOfStoreRunExclusive']==0x81b4a and a['firstStorePhysical']==0x81b1d)
ck('code hash',a['codeSha256']==H(b[0x81b18:0x81b56]))
ck('rep stosd',b[0x81b4a:0x81b56].hex()=='bf3f660700b984030000f3ab')
ck('exact membership',set(json.loads(prior)['classification']['uniqueUnbackedTargetOffsets']).issubset(set(targets)))
ck('two additional slots',a['adjacentExtraTargets']==[0x8434c,0x8435c])
for f in ('allTargetsRelocationBackedObject2','allTargetOffsetsUnbacked','allSevenO96CReferencedSlotsZeroed'):ck(f,a[f] is True)
ck('one positive',z['classification']['boundedInitializerExists'] is True)
for f in ('initializerExecutionDuringGameProven','populationWithNonzeroCommandsEstablished','serializedRecordsAtTargetOffsetsEstablished','correctStageOrPaletteBindingsEstablished','mk2ResearchClosed'):ck(f,z['classification'][f] is False)
print(json.dumps({'pass':'O96E','status':'PASS','checks':check,'failures':0,'zeroedSlots':9,'allSevenCursorTargetsIncluded':True}))
