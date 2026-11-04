#!/usr/bin/env python3
"""O96H independent MK2 LE relocation reparse, all source writes and 3 cursor pair-list checks."""
import sys,json,hashlib,struct
from pathlib import Path
if len(sys.argv)!=4: raise SystemExit('usage: verifier <mk2-dir> <O96D-report> <O96H-report>')
b=(Path(sys.argv[1])/'mk2.exe').read_bytes();src=Path(sys.argv[2]).read_bytes();z=json.loads(Path(sys.argv[3]).read_text());n=0
def ck(name,result):
 global n
 n+=1
 if not result:raise AssertionError(name)
def u(q):return struct.unpack_from('<I',b,q)[0]
def w(q):return struct.unpack_from('<H',b,q)[0]
def s(q):return struct.unpack_from('<h',b,q)[0]
def d(q):return struct.unpack_from('<i',b,q)[0]
def h(v):return hashlib.sha256(v).hexdigest()
ck('auth fixture',h(b)==z['exeSha256']=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
ck('prereq',h(src)==z['source']['o96dSha256'] and json.loads(src)['status']=='SUCCESS')
mz=0x26654;le=mz+u(mz+0x3c);data=mz+u(le+0x80);page_bytes=u(le+0x28);pages=u(le+0x14);ot=le+u(le+0x40);ft=le+u(le+0x68);fr=le+u(le+0x6c)
ck('loader',le==0x28f0c and data==0x61c54 and pages==113 and page_bytes==4096)
objs=[{'id':i+1,'size':u(ot+i*24),'start':u(ot+i*24+12),'count':u(ot+i*24+16)} for i in range(2)]
ck('object2 extent',objs[1]['size']==0x86660 and objs[1]['count']==50)
O2=data+objs[0]['count']*page_bytes;backed=objs[1]['count']*page_bytes;ck('object2 file base',O2==0xa0c54)
fix={};total=0
for pg in range(pages):
 obj=next((x for x in objs if x['start']<=pg+1<x['start']+x['count']),None);ck('page owner',obj is not None)
 q=fr+u(ft+pg*4);end=fr+u(ft+(pg+1)*4)
 while q<end:
  typ=b[q]&15;flags=b[q+1];off=s(q+2);q+=4
  ck('flags validated',(flags&3)==0)
  target_obj=w(q) if flags&64 else b[q];q+=2 if flags&64 else 1
  target=None
  if typ!=2:
   target=u(q) if flags&16 else w(q);q+=4 if flags&16 else 2
  if flags&4:q+=4 if flags&32 else 2
  fix[(obj['id'],(pg+1-obj['start'])*page_bytes+off)]=(typ,target_obj,target)
  total+=1
 ck('page record exact end',q==end)
ck('all fixups',total==27004==z['loader']['totalFixups'])
ck('source range',z['loader']['object1CodePhysical']==[data,data+objs[0]['count']*page_bytes]);ck('target backing',z['loader']['object2BackedBytes']==backed and z['loader']['object2VirtualBytes']==objs[1]['size'] and z['loader']['object2DataPhysical']==O2)
lo,hi=z['loader']['object1CodePhysical'];hits=[i for i in range(lo,hi-3) if b[i:i+4]==bytes.fromhex('f65c0700')]
ck('exact source reference population',hits==z['allEightExactDirectOperandOccurrences']==[0x80196,0x80557,0x805ca,0x81f5c,0x84c96,0x93502,0x98833,0x98a50])
exp=[(0x80190,0x13cec),(0x805c4,0x1410c),(0x84c90,0x15d60),(0x9882d,0x15d60),(0x98a4a,0x15d60)]
ck('five source sites',len(z['fiveRelocationBackedLiteralSourceSites'])==5)
for entry,(physical,target) in zip(z['fiveRelocationBackedLiteralSourceSites'],exp):
 ck('store evidence',b[physical]==0xb8 and u(physical+1)==target and b[physical+5]==0xa3 and u(physical+6)==0x75cf6)
 ck('matching report',entry=={'instruction':physical,'target':target,'globalStorePhysical':physical+5,'relocationSourcePhysical':physical+1})
 ck('LE relocation for source',fix.get((1,physical+1-data))==(7,2,target))
ck('reset branch',b[0x80554:0x8055b]==bytes.fromhex('33c0a3f65c0700'))
ck('dynamic slot value branch',b[0x81f55:0x81f60]==bytes.fromhex('8b1883c004891df65c0700'))
ck('source to cursor copy',b[0x93500:0x9350c]==bytes.fromhex('8b15f65c07008915985a0700'))
ck('report copy',z['otherSources']=={'zero':{'xorPhysical':0x80554,'globalStorePhysical':0x80556},'dynamic':{'dereferencePhysical':0x81f55,'globalStorePhysical':0x81f5a},'consumerReadPhysical':0x93500})
ck('records count',len(z['fileBackedRecords'])==3)
for r,(start,n_pairs) in zip(z['fileBackedRecords'],[(0x13cec,10),(0x1410c,4),(0x15d60,10)]):
 ck('record identity',r['object2Offset']==start and r['physical']==O2+start and r['pairCount']==n_pairs)
 ck('whole record bounds',start+n_pairs*8+4<=backed and r['byteLength']==n_pairs*8+4)
 ck('record checksum',r['originalRecordSha256']==h(b[O2+start:O2+start+n_pairs*8+4]))
 ck('pairs count',len(r['pairs'])==n_pairs)
 for k,item in enumerate(r['pairs']):
  offset=start+8*k
  raw0=u(O2+offset);raw1=u(O2+offset+4)
  ck('first fixup',fix.get((2,offset))==(7,2,raw0))
  ck('second fixup',fix.get((2,offset+4))==(7,2,raw1))
  ck('first pointer zone',0x84334<=raw0<=0x84360 and backed<=raw0<objs[1]['size'])
  ck('second pointer zone',0x84312<=raw1<=0x8432e and backed<=raw1<objs[1]['size'])
  ck('pair report',item=={'pairIndex':k,'firstPointerRaw':raw0,'secondPointerRaw':raw1,'firstFixupObject2Offset':offset,'secondFixupObject2Offset':offset+4})
 ck('exact trailing zero',u(O2+start+8*n_pairs)==0 and (2,start+8*n_pairs) not in fix)
 ck('term report',r['terminatorOffset']==start+8*n_pairs)
a,b4,c=z['fileBackedRecords'];ck('long lists identical',[(e['firstPointerRaw'],e['secondPointerRaw']) for e in a['pairs']]==[(e['firstPointerRaw'],e['secondPointerRaw']) for e in c['pairs']])
ck('short list matches first pointers',all(e['firstPointerRaw']==a['pairs'][j+6]['firstPointerRaw'] for j,e in enumerate(b4['pairs'])))
ck('short list first field differs',b4['pairs'][0]['secondPointerRaw']==0x8432e and a['pairs'][6]['secondPointerRaw']==0x8432a)
ck('short list last 3 pairs match',all(e['secondPointerRaw']==a['pairs'][j+6]['secondPointerRaw'] for j,e in enumerate(b4['pairs']) if j>0))
patterns={0x93547:'8b0d985a07008b0183c104a9ffffffff74517931',0x9358c:'8b3183c104668b36668935685a0700890d985a07008be8e8e8fdffff',0x93390:'8b6d0085ed0f8549feffffc3'}
for at,pattern in patterns.items():ck('walker authenticated '+hex(at),b[at:at+len(pattern)//2].hex()==pattern)
ck('positive branch',b[0x93559:0x9355b]==bytes.fromhex('7931'))
ck('positive route consumer',b[0x935a3]==0xe8 and 0x935a8+d(0x935a4)==0x93390)
ck('other branch row renderer',b[0x93585]==0xe8 and 0x9358a+d(0x93586)==0x9e118)
ck('walker report',z['walker']=={'cursorCopyPhysical':0x93506,'positiveTokenJumpAt':0x93559,'positiveBranchPhysical':0x9358c,'pairedWordPointerReadPhysical':0x93591,'positiveConsumerCallPhysical':0x935a3,'positiveConsumerTarget':0x93390,'firstSlotDerefPhysical':0x93390,'otherNegativeOneRenderCallPhysical':0x93585,'otherNegativeOneRenderTarget':0x9e118})
c=z['classification'];ck('positive classification',c['fiveRelocatedLiteralSourcesEstablished'] is True and c['threeDistinctFileBackedLists'] is True and c['pairCounts']==[10,4,10] and c['positiveTokenPointerPairBranchSupportedByCode'] is True and c['negativeOneRendererPathNotDirectlyObservedInTheseOriginalLists'] is True)
for k in ['theseRuntimeSlotsAreFileBacked','allReferencedRuntimeSlotContentsProvenPopulated','gameplayIdentityOrCorrectColorProven','mk2ResearchClosed']:ck('negative '+k,c[k] is False)
print(json.dumps({'pass':'O96H','status':'PASS','checks':n,'failures':0,'leFixupsReparsed':total,'staticPointerPairs':[10,4,10]}))
