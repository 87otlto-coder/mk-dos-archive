#!/usr/bin/env python3
"""Independent O96I/O96J raw-fixture verifier; rejects invented runtime guarantees."""
import sys, json, struct, hashlib
from pathlib import Path

if len(sys.argv)!=4:
    raise SystemExit('usage: verify-mk2-o96i-o96j-runtime-list-lifecycle.py <mk2-dir> <producer-report.json> <consumer-report.json>')
fixture, pi, pj = map(Path,sys.argv[1:]); exe=fixture/'mk2.exe'; data=exe.read_bytes()
I=json.loads(pi.read_text()); J=json.loads(pj.read_text()); count=[0]
def ok(test,why):
    count[0]+=1
    if not test: raise AssertionError(f'independent verification FAILED: {why}')
def u(i): return struct.unpack_from('<I',data,i)[0]
def w(i): return struct.unpack_from('<H',data,i)[0]
def s(i): return struct.unpack_from('<h',data,i)[0]
def hash_(d): return hashlib.sha256(d).hexdigest()
def raw(at,hexstr,label): ok(data[at:at+len(bytes.fromhex(hexstr))]==bytes.fromhex(hexstr), label)
expected='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
ok(hash_(data)==expected,'original exe'); mz=0x26654; le=mz+u(mz+0x3c); codebase=mz+u(le+0x80); pgsize=u(le+0x28); total=u(le+0x14)
ot=le+u(le+0x40);ft=le+u(le+0x68);fr=le+u(le+0x6c)
objects=[{'id':i+1,'first':u(ot+24*i+12),'pages':u(ot+24*i+16),'virtual':u(ot+24*i)} for i in range(2)]
o2base=codebase+objects[0]['pages']*pgsize
for v,a in [(le,0x28f0c),(codebase,0x61c54),(pgsize,4096),(total,113),(o2base,0xa0c54),(objects[1]['pages'],50),(objects[1]['virtual'],0x86660)]: ok(v==a,'independent LE layout')
fix={}; nfix=0
for page in range(total):
    owner=next((obj for obj in objects if obj['first']<=page+1<obj['first']+obj['pages']),None)
    ok(owner is not None,'fixup page owner')
    cur=fr+u(ft+page*4); end=fr+u(ft+(page+1)*4)
    while cur<end:
        tag=data[cur]&15; flags=data[cur+1]; delta=s(cur+2);cur+=4
        ok((flags&3)==0,'reloc flags')
        dst=w(cur) if flags&64 else data[cur];cur+=2 if flags&64 else 1
        target=None
        if tag!=2:
            target=u(cur) if flags&16 else w(cur);cur+=4 if flags&16 else 2
        if flags&4: cur+=4 if flags&32 else 2
        fix[(owner['id'],(page+1-owner['first'])*pgsize+delta)]=(tag,dst,target);nfix+=1
        ok(cur<=end,'relocation bounds')
    ok(cur==end,'fixup page terminator')
ok(nfix==27004,'fixup population')
prior=pi.parent/'mk2_control_cursor_file_backed_positive_pointer_pair_lists_o96h_2026-10-08.json'
ok(prior.exists(),'predecessor report exists')
for report,mark in [(I,'I'),(J,'J')]:
    ok(report['priorO96hSha256']==hash_(prior.read_bytes()), mark+' previous evidence hash')
    ok(report['status']=='SUCCESS' and report['fixtureSha256']==expected,mark+' identity')
    ok(report['boundLe']=={'object1Base':codebase,'object2PhysicalBase':o2base,'object2VirtualSize':objects[1]['virtual'],'object2BackedSize':objects[1]['pages']*pgsize,'verifiedRelocations':nfix},mark+' topology')

# Independent discovery of eight table rows from pointer/coordinate progression and LE fixups.
entry=0x15b68
raw(0x81bb3,'565755bb685b0100bf54430800','row producer starts')
ok(fix.get((1,0x81bb7-codebase))==(7,2,entry),'producer table fixup')
ok(fix.get((1,0x81bbc-codebase))==(7,2,0x84354),'head base relocation')
raw(0x81bc0,'8b2b8b53048b4b088b430c83c31083ef04','producer loop')
raw(0x81bd1,'81ff304308007415','break when edi = 0x84330')
raw(0x81bd9,'8b0083f80174e03d400203007407','runtime branch conditions')
raw(0x81bf2,'53578b098b12c1e91081e20000ffff0bca8bd1e803000000','two independent derefs')
raw(0x81c48,'893d985a0700e8c3010000','bind cursor to slot and remove path')
raw(0x81caa,'8b7e06e8c6010000','conditional test')
raw(0x81d77,'5355e858190100','conditional allocation')
raw(0x81d84,'c6441d00ff8d4c1d00894808','allocation flag field')
raw(0x81e07,'8bc5e8c647feff','allocated object inserted')
raw(0x665d4,'53ff35645a07005152ff356c5a07008b15985a0700eb14','runtime slot head chosen')
raw(0x665ff,'8b5820528b501c89156c5a07005a8915645a07008b12','linked object sort comparison')
raw(0x66631,'8910518b0d645a0700890159','pointer chain insertion')
raw(0x81e16,'50568bf78b3e85ff7455','removal loop')
raw(0x81e5a,'8b4708c600008b078906','unlink and clear membership byte')
rows=[]
for i in range(8):
    off=entry+16*i; v=[u(o2base+off+4*j) for j in range(4)]
    ok(v[0]==0x767cf+400*i,'entry first column')
    ok(v[1]==0x842e8,'entry second column')
    ok(v[2]==0x8432c-4*i,'entry third column')
    ok(v[3]==0x77453+4*i,'entry fourth column')
    for j,target in enumerate(v):
        ok(fix.get((2,off+j*4))==(7,2,target),'independent serialized pointer fixup')
        ok(objects[1]['pages']*pgsize<=target<objects[1]['virtual'],'unbacked runtime address')
    rows.append({'row':i,'object2Offset':off,'originalFilePhysical':o2base+off,'fields':v,'selectedRuntimeListHead':0x84350-i*4})
ok(I['sourceTable']['rows']==rows,'full producer row audit')
ok(I['sourceTable']['object2Offset']==entry and I['sourceTable']['bytes']==128 and I['sourceTable']['physical']==o2base+entry,'table bounds')
ok(I['sourceTable']['sha256']==hash_(data[o2base+entry:o2base+entry+128]),'serialized table hash')
for k in ['all32FieldsRelocationBacked','sourceIsFileBacked','destinationsAreUnbackedRuntimeState']:
    ok(I['sourceTable'][k] is True,'source truth '+k)
ok(I['producer']=={'entry':0x81bb3,'endExclusive':0x81bf2,'loopAt':0x81bc0,'stopCompareAt':0x81bd1,'stopAddress':0x84330,'sentinelBranchAt':0x81bd9,'parameterLoad':0x81bf2,'cursorAssignment':0x81c48,'conditionalObjectTestAt':0x81d77,'insertPathAt':0x81e07,'insertWrapperAt':0x665d4,'listInsertAt':0x665ff},'producer machine callsites')
for k,v in {'eightRowProducerTableQualified':True,'runtimeListHeadBindingQualified':True,'conditionalObjectAllocationAndInsertionPathQualified':True,'eightListHeadsGuaranteedPopulated':False,'verifiedDuringGameplay':False,'stageIdentityKnown':False,'mk2Closed':False}.items():ok(I['classification'][k] is v,'I certainty '+k)

# Independent consumer proof: O96H's original three serialized records, positive token, linked chain.
raw(0x9358c,'8b3183c104668b36668935685a0700890d985a07008be8e8e8fdffff','control positive token')
raw(0x93390,'8b6d0085ed0f8549feffffc3','linked chain consumer')
raw(0x93647,'bb00000080bd000000808b1085d27501c3','optional list sorter')
raw(0x93668,'89118b0a890889028bca','sorter pointer rewrites')
raw(0x93686,'8b1085d275cc','sort loop')
referenceHeads=set()
for start,pairs in [(0x13cec,10),(0x1410c,4),(0x15d60,10)]:
    for j in range(pairs):
        first=u(o2base+start+j*8); second=u(o2base+start+j*8+4)
        ok(fix.get((2,start+j*8))==(7,2,first),'positive list pointer field 1')
        ok(fix.get((2,start+j*8+4))==(7,2,second),'positive list pointer field 2')
        referenceHeads.add(first)
    ok(u(o2base+start+pairs*8)==0,'list terminator')
headSequence=[r['selectedRuntimeListHead'] for r in rows]
shared=sorted(referenceHeads & set(headSequence))
ok(len(shared)==8,'all eight producer slots have serialized positive-token references')
ok(J['listProducer']=={'source':entry,'headSequence':headSequence,'conditionalInsertCall':0x81e09,'insertWrapper':0x665d4,'sortKeys':[0x20,0x1c],'listLinkHeadWrite':0x6663a,'conditionalUnlink':0x81e16},'source bridge')
ok(J['listConsumer']=={'sourceO96hRecordOffsets':[0x13cec,0x1410c,0x15d60],'allPositiveCursorHeadPointers':sorted(referenceHeads),'headsSharedWithProducer':shared,'consumerHeadDerefAt':0x93390,'conditionalContinuationAt':0x93395,'objectChainLoopBack':0x931e4,'sorterEntry':0x93647,'sorterHeads':[0x84358,0x84360,0x84364],'sortComparisonFields':[0x20,0x1c],'sortWrites':[0x93668,0x9366c,0x9366e]},'consumer bridge exact')
for k,v in {'sharedHeadAddressJoinVerified':True,'positiveTokenConsumerUsesRuntimeLinkedObjects':True,'conditionalInsertionUsesCompatibleRuntimeListRepresentation':True,'everyPositiveHeadProducedByEightRowProcedure':False,'guaranteedSameRuntimeExecutionOrFrame':False,'serializedGraphicsPixelsInRuntimeSlots':False,'mk2Closed':False}.items():ok(J['classification'][k] is v,'J certainty '+k)
print(json.dumps({'pass':'O96I+O96J','verdict':'PASS','independentChecks':count[0],'failures':0,'relocationsParsed':nfix,'producerRows':len(rows),'sharedProducerConsumerHeadSlots':len(shared),'runtimeSceneClaim':False}))
