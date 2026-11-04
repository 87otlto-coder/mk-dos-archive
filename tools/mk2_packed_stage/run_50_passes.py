#!/usr/bin/env python3
"""50 independently bounded MK2 packed-source investigations.
Seven authentic resources × seven distinct evidence questions, and an
aggregate native-table integrity pass. Static only; runtime requires DOSBox.
"""
from __future__ import annotations
from collections import Counter
from datetime import datetime,timezone
import hashlib
import json
from pathlib import Path
import struct
import sys
import zipfile
from mk2_packed_stage import (DOMAIN, EXE_SHA, LEFT_MARGIN, RESOURCES, STAGE_TABLE_OFFSET,
 STRIDE, VIEWPORT, TABLE_NAMES, QualificationError, inspect,
 replace_plane, paint_region, resource_identity, restore, sha,verify_native_reference)

FIXTURE=Path('/mnt/data/mk2.zip')
TITLES=[
 'Native table slot and resource identity',
 'Complete source rows and non-padding margins',
 'Independent centered 320-byte projection isolation',
 'DWORD palette-base carry behavior, hypothetical bank 193',
 'Isolated one-row source-plane replacement',
 'Final-row boundary edit and canonical restoration',
 'Fail-closed source mutation and receipt corruption',
]

def make_passes(fixture:Path):
 with zipfile.ZipFile(fixture) as z:
  game={n: z.read('mk2/'+n) for n in RESOURCES}
  exe=z.read('mk2/mk2.exe')
 assert len(exe)==861133 and sha(exe)==EXE_SHA
 verify_native_reference(exe)
 lutstart=0xA1CD8
 assert all(struct.unpack_from('<I',exe,lutstart+4*n)[0]==n*0x01010101 for n in range(256))
 passes=[]
 def log(res,typ,details):
  passes.append({'passNumber':len(passes)+1,'id':f'O111_{len(passes)+1:02}',
                 'resource':res,'focus':typ,'outcome':'STATIC_VERIFIED','observed':details,
                 'runtimeQualification':'NO_NEW_GAMEPLAY_CLAIM'})
 # Category-first ordering keeps each inquiry independently auditable.
 for category in range(7):
  for name in TABLE_NAMES:
   if name is None:continue
   src=game[name];resource_id,offset,rows,_=RESOURCES[name]
   plane=src[offset:]
   if category==0:
    slot=TABLE_NAMES.index(name)
    expected=(resource_id<<24)|offset
    raw=struct.pack('<I',expected)
    assert exe[STAGE_TABLE_OFFSET+slot*4:STAGE_TABLE_OFFSET+slot*4+4]==raw
    assert exe.count(raw)==1
    assert sha(src)==RESOURCES[name][3]
    details={'sourceSha256':sha(src),'nativeSlot':slot,'packedPointerHex':hex(expected),
             'uniquePointerCountInExe':exe.count(raw),'offset':offset,'rows':rows,
             'resourceLength':len(src)}
   elif category==1:
    r=[plane[i*STRIDE:(i+1)*STRIDE] for i in range(rows)]
    margins=[line[:LEFT_MARGIN]+line[LEFT_MARGIN+VIEWPORT:] for line in r]
    assert len(set(map(sha,r)))==rows and all(len(line)==STRIDE for line in r)
    assert all(len(m)==576 for m in margins)
    details={'packedLength':len(plane),'distinctCompleteRows':len(set(map(sha,r))),
             'minimumRowDistinctIndices':min(map(lambda row:len(set(row)),r)),
             'outer576NonzeroByteCount':sum(v!=0 for m in margins for v in m),
             'outer576Sha256':sha(b''.join(margins)),
             'packedSourceIndexMinMax':[min(plane),max(plane)],'sourcePlaneSha256':sha(plane)}
   elif category==2:
    center=b''.join(plane[i*STRIDE+LEFT_MARGIN:i*STRIDE+LEFT_MARGIN+VIEWPORT] for i in range(rows))
    outside=b''.join(plane[i*STRIDE:i*STRIDE+LEFT_MARGIN]+plane[i*STRIDE+LEFT_MARGIN+VIEWPORT:(i+1)*STRIDE] for i in range(rows))
    restored=b''.join(outside[i*576:i*576+288]+center[i*320:(i+1)*320]+outside[i*576+288:(i+1)*576] for i in range(rows))
    assert restored==plane and len(center)==rows*320 and len(outside)==rows*576
    details={'centerSourceX':288,'centerWidth':320,'centerLength':len(center),
             'centerSha256':sha(center),'sideLength':len(outside),
             'sidesSha256':sha(outside),'completePlaneReassemblySha256':sha(restored)}
   elif category==3:
    base=192;baseword=0xc0c0c0c0
    src320=b''.join(plane[i*STRIDE+LEFT_MARGIN:i*STRIDE+LEFT_MARGIN+320] for i in range(rows))
    transformed=bytearray();naive=bytearray()
    for i in range(0,len(src320),4):
     raw=src320[i:i+4]
     word=struct.unpack('<I',raw)[0]
     transformed.extend(struct.pack('<I',(word+baseword)&0xFFFFFFFF))
     naive.extend(((v+base)&255 for v in raw))
    carry_count=sum(x!=y for x,y in zip(transformed,naive))
    assert len(transformed)==len(src320)
    assert (carry_count==0) if name=='tomb.gra' else (carry_count>0)
    details={'bankStart':'HYPOTHETICAL_193_NOT_RUNTIME','x':288,
             'rendererRule':'LE_U32_ADD_REPEATED_BYTE_LUT','centerLength':len(src320),
             'exact32Sha256':sha(transformed),'naiveBytewiseSha256':sha(naive),
             'byteMismatchCountVsNaive':carry_count}
   elif category==4:
    # Author a one-source-row replacement, not an assumed game-screen image.
    row=rows//2;val=src[offset+row*STRIDE+333]^255
    changed,receipt=paint_region(name,src,x=333,y=row,width=1,height=1,value=val)
    diff=[i for i,(a,b) in enumerate(zip(src,changed)) if a!=b]
    assert diff==[offset+row*STRIDE+333]
    assert changed[:offset]==src[:offset] and len(changed)==len(src)
    assert receipt['changedCount']==1 and receipt['changedInterval']==[diff[0],diff[0]+1]
    details={'sourceRow':row,'sourceX':333,'fileOffset':diff[0],
             'changedBytes':1,'untouchedPrefixSha256':sha(changed[:offset]),
             'patchedSourceSha256':sha(changed)}
   elif category==5:
    val=src[-1]^255
    changed,receipt=paint_region(name,src,x=895,y=rows-1,width=1,height=1,value=val)
    canonical=restore(name,changed,receipt)
    assert canonical==src and changed[-1]==val
    assert changed[:-1]==src[:-1] and receipt['changedCount']==1
    details={'edgeFileOffset':len(src)-1,'sourceX':895,'sourceRow':rows-1,
             'endOfFileEditSucceeded':True,'fullyRestoredSha256':sha(canonical),
             'canonicalResourceRestored':True}
   else:
    poison=bytearray(src);poison[0]^=1
    failures=0
    try:replace_plane(name,bytes(poison),plane)
    except QualificationError:failures+=1
    else:raise AssertionError(f'{name}: unsafe edit accepted corrupt original')
    changed,receipt=paint_region(name,src,x=0,y=0,width=1,height=1,value=src[offset]^255)
    bad=dict(receipt,changedCount=100_000)
    try:restore(name,changed,bad)
    except QualificationError:failures+=1
    else:raise AssertionError(f'{name}: unsafe restore accepted corrupted receipt')
    details={'corruptOriginalRejected':True,'poisonedRestoreReceiptRejected':True,
             'rejectedControls':failures,'originalResourceSha256':sha(src)}
   log(name,TITLES[category],details)
 # Pass 50 must check the entire linked source table, independent of 49 per-resource checks.
 exact = [struct.unpack_from('<I',exe,STAGE_TABLE_OFFSET+4*i)[0] for i in range(8)]
 assert exact[5]==0 and len([x for x in exact if x])==7
 assert len(set(x for x in exact if x))==7
 aggregate_bytes=b''.join(game[name][RESOURCES[name][1]:] for name in TABLE_NAMES if name)
 assert len(aggregate_bytes)==286720
 aggregate_digest=sha(aggregate_bytes)
 total=sum(len(game[n])-RESOURCES[n][1] for n in RESOURCES)
 assert total==286720 and sum(RESOURCES[n][2] for n in RESOURCES)==320
 # Explicit native-table corruption negative control; do not depend on stage row coincidence.
 poison_exe=bytearray(exe);poison_exe[STAGE_TABLE_OFFSET+5*4]=1
 try:verify_native_reference(bytes(poison_exe))
 except QualificationError:negative_pass=True
 else:raise AssertionError('corrupt native table not rejected')
 log('CORPUS','Authentic seven-resource total and zero-slot negative control',
     {'sourceTableOffsetHex':hex(STAGE_TABLE_OFFSET),
      'nativeSlotValues':[hex(x) for x in exact],
      'nonzeroPointerCount':7,'zeroSlotIndex':5,
      'authenticTotalRows':320,'authenticTotalSuffixBytes':total,
      'allSevenSourceSuffixesSha256':aggregate_digest,
      'canonicalExeSha256':sha(exe),'poisonedTableRejected':negative_pass})
 assert len(passes)==50
 return {'format':'mk2_packed_stage_50_bounded_research_passes_v1',
    'sourceCorpus':'CANONICAL_USER_SUPPLIED_MK2_ZIP',
    'canonicalExeSha256':EXE_SHA,
    'researchBoundary':'No new DOSBox runtime runs. Authenticated source-buffer and tool-contract research only.',
    'previouslyRuntimeWitnessedResources':['tomb.gra','portal.gra'],
    'sourceQualifiedPackedSuffixResources':list(RESOURCES),
    'passesAttempted':50,'passesStaticallyVerified':50,
    'sourceChanges':'editor and scripts only; originals never modified',
    'passes':passes}

if __name__=='__main__':
 if len(sys.argv)!=3:sys.exit('usage: python run_50_passes.py CANONICAL_MK2_ZIP OUTPUT_JSON')
 output=Path(sys.argv[2]);assert not output.exists(),'will not overwrite research evidence'
 doc=make_passes(Path(sys.argv[1]))
 output.parent.mkdir(parents=True,exist_ok=True)
 output.write_text(json.dumps(doc,indent=2)+'\n')
 print(json.dumps({'status':'PASS','attempted':doc['passesAttempted'],'verified':doc['passesStaticallyVerified'],'output':str(output)},indent=2))
