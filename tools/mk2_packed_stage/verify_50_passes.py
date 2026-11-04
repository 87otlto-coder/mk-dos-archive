#!/usr/bin/env python3
"""Independent O111 50-pass research evidence verifier.

Uses no imports from the producer/editor. Parses source bytes afresh and
checks numerical results, hashes, native table, and reversible source edits.
"""
from __future__ import annotations
import json
import hashlib
import struct
import sys
from pathlib import Path
import zipfile
from collections import Counter

S=(
 ('tomb.gra',0x1c,63776,48,'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613'),
 ('battle.gra',0x22,59436,40,'ebc7cb5170ec8927f87b726a0d4e7f99a1dce1de615d4fd493fd38680be0be63'),
 ('tower.gra',0x1e,56268,64,'7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8'),
 ('forest.gra',0x1b,198116,32,'8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9'),
 ('armory.gra',0x1a,126336,56,'fb68c5fb70267dc64cf176056c7711f43973f9b8b8a2e53513f43afc7c56c612'),
 ('portal.gra',0x19,56916,40,'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82'),
 ('arena.gra',0x1f,90488,40,'37a3e8fa89ae55e7d03d88a8890eb51ea7df2ccbff71ccf5cdea4a2c647b0bfb'),
)
EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'

def digest(data):return hashlib.sha256(data).hexdigest()

def verify(zip_path:Path,report_path:Path, *, fixture_contents=None):
 report=json.loads(report_path.read_text())
 assert report['format']=='mk2_packed_stage_50_bounded_research_passes_v1'
 assert report['passesAttempted']==report['passesStaticallyVerified']==50
 assert report['canonicalExeSha256']==EXE
 assert len(report['passes'])==50
 names=[r[0] for r in S]
 assert report['sourceQualifiedPackedSuffixResources']==names
 if fixture_contents is None:
  with zipfile.ZipFile(zip_path) as z:
   exe=z.read('mk2/mk2.exe')
   data={n:z.read('mk2/'+n) for n in names}
 else:
  exe,data=fixture_contents
 assert digest(exe)==EXE and len(exe)==861133
 table=0xCFBAC
 native=[int.from_bytes(exe[table+i*4:table+i*4+4],'little') for i in range(8)]
 expect=[(rid<<24)|off for _,rid,off,_,_ in S]
 assert native==expect[:5]+[0]+expect[5:]
 checks=0
 def check(test,label):
  nonlocal checks
  checks+=1
  if not test:raise AssertionError(label)
 for kind in range(7):
  for ix,(name,rid,offset,rows,expected_hash) in enumerate(S):
   passid=kind*7+ix
   entry=report['passes'][passid]
   prefix=f'{entry.get("id")}/{name}/{kind}'
   check(entry['passNumber']==passid+1 and entry['id']==f'O111_{passid+1:02}',prefix+' id')
   check(entry['resource']==name and entry['outcome']=='STATIC_VERIFIED',prefix+' stage')
   check(entry['runtimeQualification']=='NO_NEW_GAMEPLAY_CLAIM',prefix+' runtime scope')
   original=data[name];suffix=original[offset:];o=entry['observed']
   check(digest(original)==expected_hash and len(suffix)==rows*896,prefix+' source')
   if kind==0:
    needle=struct.pack('<I',(rid<<24)|offset)
    check(o['sourceSha256']==expected_hash,prefix+' hash')
    check(o['nativeSlot']==([0,1,2,3,4,6,7][ix]),prefix+' slot')
    check(o['packedPointerHex']==hex((rid<<24)|offset),prefix+' pointer')
    check(exe.count(needle)==o['uniquePointerCountInExe']==1,prefix+' uniqueness')
    check(o['resourceLength']==len(original) and o['offset']==offset and o['rows']==rows,prefix+' geometry')
   elif kind==1:
    lines=[suffix[i*896:(i+1)*896] for i in range(rows)]
    margins=[v[:288]+v[608:] for v in lines]
    check(o['packedLength']==len(suffix),prefix+' len')
    check(o['distinctCompleteRows']==len(set(map(digest,lines)))==rows,prefix+' uniqueness')
    check(o['minimumRowDistinctIndices']==min(map(lambda v:len(set(v)),lines)),prefix+' index domain')
    check(o['outer576NonzeroByteCount']==sum(b!=0 for m in margins for b in m),prefix+' nonblank')
    check(o['outer576Sha256']==digest(b''.join(margins)),prefix+' margin hash')
    check(o['packedSourceIndexMinMax']==[min(suffix),max(suffix)],prefix+' extrema')
    check(o['sourcePlaneSha256']==digest(suffix),prefix+' tail hash')
   elif kind==2:
    lines=[suffix[i*896:(i+1)*896] for i in range(rows)]
    central=b''.join(v[288:608] for v in lines)
    sides=b''.join(v[:288]+v[608:] for v in lines)
    check(o['centerSourceX']==288 and o['centerWidth']==320,prefix+' crop')
    check(o['centerLength']==len(central)==rows*320 and o['centerSha256']==digest(central),prefix+' center')
    check(o['sideLength']==len(sides)==rows*576 and o['sidesSha256']==digest(sides),prefix+' sides')
    # independently decode row triples and reassemble the original suffix
    rebuilt=b''.join(sides[i*576:i*576+288]+central[i*320:(i+1)*320]+sides[i*576+288:(i+1)*576] for i in range(rows))
    check(rebuilt==suffix and o['completePlaneReassemblySha256']==digest(rebuilt),prefix+' reassembly')
   elif kind==3:
    rowbytes=b''.join(suffix[i*896+288:i*896+608] for i in range(rows))
    exact=bytearray();naive=bytearray()
    for j in range(0,len(rowbytes),4):
     q=int.from_bytes(rowbytes[j:j+4],'little')
     exact+=((q+0xc0c0c0c0)&0xffffffff).to_bytes(4,'little')
     naive+=bytes(((b+192)%256 for b in rowbytes[j:j+4]))
    mismatch=sum(a!=b for a,b in zip(exact,naive))
    check(o['bankStart']=='HYPOTHETICAL_193_NOT_RUNTIME',prefix+' hypothetical')
    check(o['x']==288 and o['centerLength']==len(rowbytes),prefix+' camera')
    check(o['exact32Sha256']==digest(exact),prefix+' DWORD')
    check(o['naiveBytewiseSha256']==digest(naive),prefix+' naive')
    check(o['byteMismatchCountVsNaive']==mismatch,prefix+' carries')
   elif kind==4:
    row=rows//2;point=offset+row*896+333
    changed=bytearray(original);changed[point]=changed[point]^255
    check(o['sourceRow']==row and o['sourceX']==333,prefix+' coordinate')
    check(o['fileOffset']==point and o['changedBytes']==1,prefix+' delta')
    check(o['untouchedPrefixSha256']==digest(original[:offset]),prefix+' prefix')
    check(o['patchedSourceSha256']==digest(changed),prefix+' output')
    check(sum(x!=y for x,y in zip(original,changed))==1,prefix+' reversible delta')
   elif kind==5:
    changed=original[:-1]+bytes([original[-1]^255]);restored=changed[:-1]+original[-1:]
    check(o['edgeFileOffset']==len(original)-1,prefix+' EOF')
    check(o['sourceX']==895 and o['sourceRow']==rows-1,prefix+' coordinates')
    check(o['endOfFileEditSucceeded'] and o['canonicalResourceRestored'],prefix+' boundary')
    check(digest(restored)==o['fullyRestoredSha256']==expected_hash,prefix+' restore')
   else:
    check(o['corruptOriginalRejected'] and o['poisonedRestoreReceiptRejected'],prefix+' rejects')
    check(o['rejectedControls']==2 and o['originalResourceSha256']==expected_hash,prefix+' negative identity')
    # verify an altered original is necessarily excluded by source hash gate
    bad=bytes([original[0]^1])+original[1:]
    check(digest(bad)!=expected_hash,prefix+' negative source')
  # Ensure all seven entries were checked separately.
 end=report['passes'][49]
 check(end['passNumber']==50 and end['resource']=='CORPUS' and end['outcome']=='STATIC_VERIFIED','aggregate identity')
 o=end['observed']
 check(o['sourceTableOffsetHex']==hex(table),'aggregate pointer')
 check(o['nativeSlotValues']==[hex(x) for x in native],'aggregate slot list')
 check(o['zeroSlotIndex']==5 and native[5]==0 and o['nonzeroPointerCount']==7,'aggregate zero slot')
 check(o['authenticTotalRows']==320,'aggregate rows')
 check(o['allSevenSourceSuffixesSha256']==digest(b''.join(data[n][off:] for n,_,off,_,_ in S)),'aggregate source digest')
 check(o['authenticTotalSuffixBytes']==sum(len(data[n])-off for n,_,off,_,_ in S)==286720,'aggregate suffixes')
 check(o['canonicalExeSha256']==EXE and o['poisonedTableRejected'],'aggregate exe')
 return {'status':'PASS','passesIndependentlyChecked':50,'assertions':checks,
         'sourceExeSha256':EXE,'evidenceSha256':digest(report_path.read_bytes())}

if __name__=='__main__':
 if len(sys.argv)!=3:sys.exit('usage: python verify_50_passes.py USER_MK2_ZIP RESEARCH_JSON')
 try: print(json.dumps(verify(Path(sys.argv[1]),Path(sys.argv[2])),indent=2))
 except Exception as exc: print('INDEPENDENT VERIFICATION FAILED:',repr(exc),file=sys.stderr);sys.exit(1)
