#!/usr/bin/env python3
"""Independent O96S static selected-stream -> object-descriptor consumer proof, no stage-name inference."""
import sys,json,hashlib,struct
from pathlib import Path
if len(sys.argv)!=3:raise SystemExit('usage: verifier.py <mk2-directory> <O96S-report>')
root=Path(__file__).resolve().parent.parent
b=(Path(sys.argv[1])/'mk2.exe').read_bytes();r=json.loads(Path(sys.argv[2]).read_text());prior=(root/'mk2_six_way_signed_word_stream_records_o96r_2026-10-09.json').read_bytes();parent=json.loads(prior);num=0
H=lambda x:hashlib.sha256(x).hexdigest()
def check(ok,why):
 global num
 num+=1
 if not ok:raise AssertionError('O96S '+why)
def U(p):return struct.unpack_from('<I',b,p)[0]
def UW(p):return struct.unpack_from('<H',b,p)[0]
def W(p):return struct.unpack_from('<h',b,p)[0]
def code(p,h):check(b[p:p+len(h)//2].hex()==h,hex(p)+' executable bytes')
sha='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
check(H(b)==r['fixtureSha256']==sha,'authentic MK2')
check(H(prior)==r['o96rReportSha256'] and parent['status']=='SUCCESS','authoritative O96R prerequisite')
check(r['status']=='SUCCESS' and r['format']=='mk2_o96s_word_stream_descriptor_consumer_join_v1','O96S report type')
for p,h in [(0x86010,'bbc6c20100'),(0x86015,'0fbf01'),(0x86018,'83c102'),(0x8601b,'a9ffffffff'),(0x86020,'781f'),(0x86022,'83f80d'),(0x86025,'741a'),(0x86027,'0fbf13'),(0x8602a,'83c302'),(0x8602d,'c1e210'),(0x86030,'81c2c5000000'),(0x86038,'e84f000000'),(0x8603f,'ebd4'),(0x8608c,'52c1e0020564c20100528b10'),(0x86098,'89156c5a0700'),(0x8609f,'e8a4e4fdff'),(0x860a5,'e853000000'),(0x860aa,'e905e6fdff'),(0x64522,'e87dfbffff'),(0x64528,'a16c5a0700'),(0x6452d,'89473c'),(0x64531,'8b5008'),(0x64534,'895728'),(0x64539,'8b10'),(0x6453b,'89572c'),(0x64548,'e8d5ffffff'),(0x646b4,'8bc7e9301f0000'),(0x860fd,'6689571ac1fa106689571e')]:code(p,h)
expected={'entry':0x86015,'sentinel13At':0x86022,'negativeTokenExitAt':0x86020,'innerHelperCall':0x86038,'helper':0x8608c,'descriptorTableBase':0x1c264,'descriptorTableReadAt':0x86096,'selectedDescriptorGlobal':0x75a6c,'globalStoreAt':0x86098,'descriptorConsumerAt':0x64548,'positionWriterAt':0x860fd,'linkInsertionAt':0x646b4,'conditionalOnHelperReturn':True}
check(r['controlLoop']==expected,'control stream consumer chain')
check(r['object2FileBackedPhysicalBase']==0xa0c54,'Object 2 physical mapping')
slots=[]
check(len(r['descriptorSlots'])==15,'fifteen descriptor slots')
for i,v in enumerate(r['descriptorSlots']):
 ptr=U(0xa0c54+0x1c264+i*4);rec=b[0xa0c54+ptr:0xa0c54+ptr+16]
 check(v['index']==i and v['tableEntryOffset']==0x1c264+i*4,'slot coordinate')
 check(ptr==v['targetOffset']==0x1c4cc+16*min(i,13),'target pointer')
 check(v['recordRaw16']==rec.hex(),'record exact bytes')
 check(v['recordDwords']==list(struct.unpack('<4I',rec)),'record DWORD fields')
 check(struct.unpack_from('<HHI',rec)==(35,41,0),'common field prefix')
 slots.append(ptr)
check(len(set(slots))==14 and slots[13]==slots[14],'dedup pointer condition')
parameters=[W(0xa0c54+0x1c2c6+i*2) for i in range(14)]
check(r['secondInput']=={'offset':0x1c2c6,'words':parameters,'count':14,'constantDecrement':47},'exact 14-position input')
for i,x in enumerate(parameters):check(x==771-47*i,'arithmetic progression')
check(len(r['variants'])==6 and len(parent['entries'])==6,'six variant bodies')
for i,v in enumerate(r['variants']):
 src=parent['entries'][i]; tokens=[W(0xa0c54+src['targetOffset']+j*2) for j in range(16)]
 check(v['selectionIndex']==i and v['sourceRecordOffset']==src['targetOffset'],'variant source')
 check(len(v['conditionalRows'])==14,'first 14 conditional rows')
 check(tokens[14:]==[13,-1] and all(a not in (-1,13) for a in tokens[:14]),'stop found exactly at 13')
 for j,row in enumerate(v['conditionalRows']):
  d=parameters[j]; t=tokens[j]
  check(row['ordinal']==j and row['token']==t,'token provenance')
  check(row['selectedDescriptorOffset']==slots[t],'selected descriptor')
  check(row['sourceParameter']==d and row['packedEdxUnsigned']==(((d<<16)|0xc5)&0xffffffff),'parameter packing')
  check(row['lowWordToObjectPlus1A']==0xc5 and row['highWordToObjectPlus1E']==d,'two object word assignments')
 check(v['firstStopToken']==13 and v['firstStopOrdinal']==14 and v['minusOneTokenNotReached'] is True,'bound semantic stop')
# Independently parse LE FIXUPS again and qualify fifteen descriptor-table targets.
mz=0x26654;le=mz+U(mz+0x3c);base=mz+U(le+0x80);np=U(le+0x14);sz=U(le+0x28);ft=le+U(le+0x68);fr=le+U(le+0x6c)
check((le,base,np,sz)==(0x28f0c,0x61c54,113,4096),'LE topology')
wanted={0xa0c54+0x1c264+i*4:(7,2,slots[i]) for i in range(15)};got={};count=0
for pg in range(np):
 pos=fr+U(ft+4*pg);end=fr+U(ft+4*(pg+1))
 while pos<end:
  typ=b[pos]&15;flags=b[pos+1];off=W(pos+2);pos+=4
  check(flags&3==0,'fixup flags')
  dst=UW(pos) if flags&64 else b[pos];pos+=2 if flags&64 else 1
  val=None
  if typ!=2:val=U(pos) if flags&16 else UW(pos);pos+=4 if flags&16 else 2
  if flags&4:pos+=4 if flags&32 else 2
  physical=base+pg*4096+off
  if physical in wanted:got[physical]=(typ,dst,val)
  check(pos<=end,'relocation page bound');count+=1
 check(pos==end,'relocation page boundary')
check(count==27004 and got==wanted,'all LE relocations and descriptor pointers')
check({x['id']:x['verdict'] for x in r['hypotheses']}=={'H5':'SUPPORTED_CONDITIONAL_ON_HELPER_RETURN','H6':'REJECTED_STOP_ON_13','H7':'UNPROVEN','H8':'UNPROVEN'},'hypothesis test classifications')
check(r['boundary']=={'descriptorPointerConsumerQualified':True,'fullDynamicRuntimeTraceObserved':False,'selectedVariantKnown':False,'objectPositionsArePixelsProven':False,'fullStageExportReady':False},'conservative status')
print(json.dumps({'pass':'O96S','status':'PASS','checks':num,'failures':0,'relocationsReparsed':count,'descriptorPointerSlots':len(slots),'distinctTargets':len(set(slots)),'pairedRowsPerVariant':14}))
