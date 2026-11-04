#!/usr/bin/env python3
"""Independent O110F fixture verifier. Does not import/run the producer.

Reconstructs source-to-target relocation witnesses and examines every byte of
Object-1 for exact E8 rel32 calls into MK2 palette allocator. Fail-closed claims.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path

FIXTURE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
# Addresses independently inspected and checked against authentic instruction spans.
EXPECTED_CALLS=[0x640c7,0x64600,0x6466a,0x707cd,0x74cee,0x771ba,
 0x779f4,0x77d7c,0x81dda,0x85abf,0x85c79,0x86b1f,0x989af,
 0x98c65,0x98c79,0x98d6f,0x995a6,0x9964f,0x997ba,
 0x9ab0e,0x9abd9,0x9d626,0x9e3be]
OLD=[0x81dda,0x85abf,0x85c79,0x86b1f,0x989af,0x98c65,0x98c79,
 0x98d6f,0x995a6,0x9964f,0x997ba,0x9ab0e,0x9abd9,0x9d626,0x9e3be]
STAGES=[('TOMB',63776,28,0),('BATTLE',59436,34,1),('TOWER',56268,30,2),
('FOREST',198116,27,3),('ARMORY',126336,26,4),('PORTAL',56916,25,6),('ARENA',90488,31,7)]

if len(sys.argv)!=3:
 raise SystemExit('usage: verify-mk2-o110f-palette-callsite-census.py <original-mk2-dir> <O110F-report.json>')
folder=Path(sys.argv[1]);b=(folder/'mk2.exe').read_bytes();r=json.loads(Path(sys.argv[2]).read_text())
u=lambda p:struct.unpack_from('<I',b,p)[0]
w=lambda p:struct.unpack_from('<H',b,p)[0]
si=lambda p:struct.unpack_from('<i',b,p)[0]
short=lambda p:struct.unpack_from('<h',b,p)[0]
H=lambda x:hashlib.sha256(x).hexdigest()
checks=0
def check(statement,msg):
 global checks
 checks+=1
 if not statement:raise AssertionError('O110F independent verification: '+msg)
check(H(b)==FIXTURE_SHA==r['sourceExecutableSHA256'],'original source SHA')
check(r['format']=='mk2_o110f_palette_allocator_callsite_census_v1' and r['status']=='PASS_STATIC_ONLY','format, status')
check(r['method'].startswith('Exact E8 rel32 byte encodings'),'method')
check(r['object1FileImage']==[0x61c54,0xa0c54] and r['allocationTargetPhysical']==0x7b439,'original Object-1 limits and palette allocator')
check(b[0x7b439:0x7b445].hex()=='53515233db3904dd005b0700','allocator bytes')
check(b[0x7b489:0x7b48f].hex()=='668b1883c002','color-count parser bytes')
# Re-derive 27,004 relocation entries, not by calling the producer.
le=0x26654+u(0x26654+0x3c)
check(le==0x28f0c and u(le+0x14)==113,'LE header and page count')
fix_table=le+u(le+0x68);fix_stream=le+u(le+0x6c)
relocated={};fix_total=0
for page in range(113):
 offset=fix_stream+u(fix_table+4*page)
 stop=fix_stream+u(fix_table+4*(page+1))
 while offset<stop:
  record=offset;kind=b[record]&0x0f;attr=b[record+1]
  check(not attr & 3,'unsupported fixup field flags')
  delta=short(record+2)
  cursor=record+4
  target_obj=(w(cursor) if attr&64 else b[cursor]);cursor+=2 if attr&64 else 1
  target_value=None
  if kind!=2:
   target_value=(u(cursor) if attr&16 else w(cursor));cursor+=4 if attr&16 else 2
  if attr&4:cursor+=4 if attr&32 else 2
  check(cursor<=stop,'fixup overran page')
  src=0x61c54+page*4096+delta
  relocated.setdefault(src,[]).append((kind,attr,target_obj,target_value))
  offset=cursor;fix_total+=1
 check(offset==stop,'page exact fixup consumption')
check(fix_total==27004==r['fixupEntriesParsed'],'27,004 fixups')
# All exact rel32 byte matches, with no assumption that every encoding executes.
found=[]
for pos in range(0x61c54,0xa0c54-4):
 if b[pos]==0xe8 and pos+5+si(pos+1)==0x7b439:
  found.append(pos)
check(found==EXPECTED_CALLS and len(found)==23==r['allExactRel32SitesCount'],'complete 23-site instruction-byte census')
check(OLD==r['historicalO71Sites'] and r['historicalO71Count']==15,'O71 bounded older census')
check(r['newSitesNotInO71']==[p for p in found if p not in OLD] and len(r['newSitesNotInO71'])==8,'eight additional direct caller encodings')
check(len(r['callSites'])==23,'callsite record count')
expected_palettes={0x26cc4:(48,13),0x2ab28:(64,1)}
counts={}
for addr, rec in zip(found,r['callSites']):
 check(rec['callPhysical']==addr,'caller physical '+hex(addr))
 check(rec['callHex']==b[addr:addr+5].hex(),'caller opcode bytes '+hex(addr))
 check(rec['previouslyEnumeratedO71']==(addr in OLD),'historical status '+hex(addr))
 imm=b[addr-5]==0xb8
 check(rec['immediatelyPrecedingMovEaxImmediate']==imm,'MOV EAX immediate identification '+hex(addr))
 if imm:
  raw=u(addr-4)
  check(rec['loadPhysical']==addr-5 and rec['relocationSourcePhysical']==addr-4,'immediate physical provenance '+hex(addr))
  check(relocated.get(addr-4)==[(7,16,1,raw)],'exact typed relocation at immediate '+hex(addr))
  check(rec['paletteTargetObject']==1 and rec['paletteTargetOffset']==raw,'typed palette target '+hex(addr))
  check(rec['paletteRecordPhysical']==0x61c54+raw,'palette image mapping '+hex(addr))
  check(rec['paletteRecordColorCount']==w(0x61c54+raw),'palette source count '+hex(addr))
  counts[raw]=counts.get(raw,0)+1
 else:
  for f in ('loadPhysical','relocationSourcePhysical','paletteTargetOffset','paletteRecordColorCount'):
   check(f not in rec,'unsupported immediately-preceding palette claims '+hex(addr))
check(counts=={k:v[1] for k,v in expected_palettes.items()},'source palette immediate population')
check(r['directPrecedingRelocatedPaletteLoadsCount']==14 and r['remainingDynamicOrNonImmediateCallsites']==9,'classification counts')
check(len(r['sourcePaletteRecords'])==2,'palette record count')
for data,offset in zip(r['sourcePaletteRecords'],sorted(expected_palettes)):
 physical=0x61c54+offset
 n=w(physical)
 raw=b[physical:physical+2+2*n]
 words=list(struct.unpack_from('<'+str(n)+'H',b,physical+2))
 check(n==expected_palettes[offset][0], 'record count original '+hex(offset))
 check(data['object1Offset']==offset and data['filePhysical']==physical,'record position '+hex(offset))
 check(data['colors']==n and data['recordLength']==len(raw),'record size '+hex(offset))
 check(data['sha256']==H(raw),'record content '+hex(offset))
 check(data['allWords15Bit']==all(x<=32767 for x in words),'color high-bit '+hex(offset))
 check(data['distinctWords']==len(set(words)),'color diversity '+hex(offset))
 sample=[[(x>>9&63)|1,(x>>4&63)|1,(x<<1&63)|1] for x in words[:3]]
 check(data['dac6FirstThree']==sample,'native 6bit conversion sample '+hex(offset))
check(len(r['packedStageSuffixIndexDomains'])==7,'seven raw index suffixes')
for data,(name,start,resource_id,slot) in zip(r['packedStageSuffixIndexDomains'],STAGES):
 gra=(folder/(name.lower()+'.gra')).read_bytes()
 check(u(0xcfbac+4*slot)==resource_id*(1<<24)+start,'original packed reference '+name)
 chunk=gra[start:]
 check(len(chunk)%896==0 and chunk,'native suffix rows '+name)
 check(data['name']==name+'.GRA' and data['fileId']==resource_id and data['sourceOffset']==start,'source name/id/offset '+name)
 check(data['rows896']==len(chunk)//896 and data['sourceSHA256']==H(chunk),'source row count and raw sha '+name)
 check(data['sourceIndexMin']==min(chunk) and data['sourceIndexMax']==max(chunk),'original raw index extrema '+name)
 check(data['rawIndexFits48EntryPaletteWithoutRemap']==(max(chunk)<48),'48-ordinal conditional compatibility '+name)
 check(data['rawIndexFits64EntryPaletteWithoutRemap']==(max(chunk)<64),'64-ordinal conditional compatibility '+name)
required={'directE8ByteShapeMeansRuntimeExecution':False,
 'immediatePaletteLoadMeansStageOwnership':False,
 'stagePaletteBankSlot1IdentityProven':False,
 'fullyColoredStageReady':False,
 'noRemapIndexRangeCompatibilityProvesPaletteOwnership':False,
 'paletteAllocatorMayAllocateOrReuseHandlesDynamically':True}
check(r['researchBoundaries']==required,'fail-closed research boundaries')
print(json.dumps({'status':'PASS','checks':checks,'failures':0,'exactDirectCallBytes':23,
 'notInHistoricalO71':8,'relocatedImmediatePaletteCalls':14,
 'sourcePaletteRecords':{'48':13,'64':1}, 'runtimeStagePaletteIdentityProven':False}))
