#!/usr/bin/env python3
"""Independent O96R fixture reader, six-record census, LE relocation check and hypothesis gates."""
import sys,json,struct,hashlib
from pathlib import Path
if len(sys.argv)!=3:raise SystemExit('usage: verifier.py <mk2-directory> <O96R-report>')
b=(Path(sys.argv[1])/'mk2.exe').read_bytes();r=json.loads(Path(sys.argv[2]).read_text());n=0
H=lambda x:hashlib.sha256(x).hexdigest()
def check(cond,explain):
 global n
 n+=1
 if not cond:raise AssertionError('O96R: '+explain)
def U(p):return struct.unpack_from('<I',b,p)[0]
def W(p):return struct.unpack_from('<h',b,p)[0]
def S(p):return struct.unpack_from('<h',b,p)[0]
def code(p,h):check(b[p:p+len(h)//2]==bytes.fromhex(h),'machine bytes '+hex(p))
sha='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
check(H(b)==sha==r['fixtureSha256'],'EXE fixture hash')
check(r['status']=='SUCCESS' and r['format']=='mk2_o96r_indexed_word_records_v1','format')
pre=(Path(__file__).resolve().parent.parent/'mk2_runtime_word_stream_source_writer_ancestry_o96q_2026-10-09.json').read_bytes()
check(H(pre)==r['o96qReportSha256'] and json.loads(pre)['status']=='SUCCESS','O96Q evidence prerequisite')
for p,h in [(0x97fa0,'b806000000'),(0x97fa5,'e83bc6fcff'),(0x97faa,'48c1e002'),(0x97fae,'0580af0200'),(0x97fb3,'8b00'),(0x97fcd,'b878b00200'),(0x97fd2,'a326650700c3'),(0x645e5,'52538bd8'),(0x645e9,'e8d2ffffff'),(0x645ee,'f7e38bc240'),(0x645f3,'5b5ac3'),(0x86015,'0fbf0183c102'),(0x8601b,'a9ffffffff'),(0x86020,'781f'),(0x86022,'83f80d'),(0x86025,'741a')]:code(p,h)
check(r['object2FileBackedPhysicalBase']==0xa0c54,'file-backed object2 phys')
sel=r['selector']
for key,value in {'helperEntry':0x645e5,'callerAt':0x97fa0,'argument':6,'multiplyAt':0x645ee,'incrementAt':0x645f2,'decrementAt':0x97faa,'provableTableIndexRange':[0,5],'runtimeSelectionUnknown':True,'conditionalOverrideAt':0x97fcd,'overrideTargetOffset':0x2b078}.items():check(sel[key]==value,'selector '+key)
check(r['tableBaseOffset']==0x2af80 and len(r['entries'])==6,'six table entries')
records=[]
for i,entry in enumerate(r['entries']):
 off=0x2af80+4*i;target=U(0xa0c54+off);words=[W(0xa0c54+target+2*j) for j in range(16)]
 check(off==entry['entryOffset'] and i==entry['index'],'indexed entry')
 check(target==entry['targetOffset']==0x2af98+i*32,'table pointer slot '+str(i))
 check(entry['physicalOffset']==0xa0c54+target,'physical entry')
 for j,value in enumerate(words):check(entry['words'][j]==value,'word '+str(i)+':'+str(j))
 check(sorted(words)==[-1]+list(range(15)),'complete sorted permutation '+str(i))
 check(words[14:]==[13,-1],'terminators 13 preceding -1 at fixed positions')
 check(entry['sha256']==H(b[0xa0c54+target:0xa0c54+target+32]),'body hash')
 records.append(words)
check(records[2]==records[3] and len({tuple(x) for x in records})==5,'exact duplicate and five bodies')
check(r['override']['offset']==0x2b078 and r['override']['physicalOffset']==0xcbccc,'override offsets')
check(r['override']['words']==[W(0xcbccc+2*i) for i in range(16)],'override byte content')
check(r['override']['words'][14:]==[13,-1] and r['override']['words'][:14]!=[13]*14,'nonempty override')
# LE topology & relocation independently reconstructed, including all six POINTER TABLE ENTRIES.
mz=0x26654;le=mz+U(mz+0x3c);base=mz+U(le+0x80);pages=U(le+0x14);page_size=U(le+0x28);ft=le+U(le+0x68);fr=le+U(le+0x6c)
check((le,base,pages,page_size)==(0x28f0c,0x61c54,113,4096),'authentic LE topology')
wanted={0xa0c54+0x2af80+i*4:(7,2,0x2af98+i*32) for i in range(6)};found={};cnt=0
for pg in range(pages):
 pos=fr+U(ft+4*pg);end=fr+U(ft+4*(pg+1))
 while pos<end:
  typ=b[pos]&15;flags=b[pos+1];off=S(pos+2);pos+=4
  check((flags&3)==0,'fixup target flags')
  target=struct.unpack_from('<H',b,pos)[0] if flags&64 else b[pos];pos+=2 if flags&64 else 1
  val=None
  if typ!=2:val=U(pos) if flags&16 else struct.unpack_from('<H',b,pos)[0];pos+=4 if flags&16 else 2
  if flags&4:pos+=4 if flags&32 else 2
  phys=base+pg*4096+off
  if phys in wanted:found[phys]=(typ,target,val)
  check(pos<=end,'fixup page bounds');cnt+=1
 check(pos==end,'fixup page end')
check(cnt==27004,'all relocations parsed')
check(found==wanted,'six relocation-backed Object2 table entry pointers')
verdict={x['id']:x['verdict'] for x in r['hypotheses']}
check(verdict=={'H1':'SUPPORTED_STRUCTURALLY','H2':'REJECTED_BY_EARLIER_13_TERMINATOR','H3':'REJECTED_BY_RECORD_BYTES','H4':'UNPROVEN'},'explicit hypothesis status')
check(r['boundary']=={'sixSelectorEntriesStructurallyBounded':True,'selectedRuntimeVariantUnknown':True,'overrideConditionsUnresolved':True,'streamGameplaySemanticsUnknown':True,'stageReconstructionCompleted':False},'conservative boundary')
print(json.dumps({'pass':'O96R','status':'PASS','checks':n,'failures':0,'fixupsReparsed':cnt,'sixRecords':6,'uniqueBodies':5}))
