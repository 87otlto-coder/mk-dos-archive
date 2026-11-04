#!/usr/bin/env python3
"""O95Z independent rehashing of authentic MK2 resource bytes. No renderer semantics."""
import sys,json,hashlib,collections
from pathlib import Path
if len(sys.argv)!=4:raise SystemExit('usage: verify-mk2-o95z-tail-fingerprint-census.py <fixture> <o95y> <o95z>')
fix=Path(sys.argv[1]);yb=Path(sys.argv[2]).read_bytes();y=json.loads(yb);z=json.loads(Path(sys.argv[3]).read_text());n=0
def sha(b):return hashlib.sha256(b).hexdigest()
def ck(lbl,p):
 global n
 n+=1
 if not p:raise AssertionError(lbl)
ck('schema',z['format']=='mk2_packed_eof_tail_fingerprint_census_o95z_v1' and z['status']=='SUCCESS')
ck('source identity',z['source']=={'o95ySha256':sha(yb),'exeSha256':sha((fix/'mk2.exe').read_bytes())})
units=[256,1024,7168];ck('units',z['partitionUnitCandidates']==units)
refs=[r for r in y['table']['slots'] if r['kind']=='PACKED_RESOURCE_SUFFIX_REFERENCE'];ck('refs',len(refs)==len(z['resources'])==7)
allHashes={u:[] for u in units};total=0
for ref,r in zip(refs,z['resources']):
 raw=(fix/ref['resource'].lower()).read_bytes();part=raw[ref['graOffset']:];total+=len(part)
 ck('metadata',r['resource']==ref['resource'] and r['graOffset']==ref['graOffset'] and r['entryPhysical']==ref['entryPhysical'])
 ck('bytes',r['byteLength']==len(part) and len(part)%7168==0 and r['tailSha256']==ref['suffixSha256']==sha(part))
 ck('range',r['minimumByte']==min(part) and r['maximumByte']==max(part) and r['bytesAbove63']==sum(v>63 for v in part))
 ck('partitions',len(r['partitions'])==3)
 for u,p in zip(units,r['partitions']):
  hashes=[sha(part[i:i+u]) for i in range(0,len(part),u)]
  ck('granularity',p['unitBytes']==u and p['blocks']==len(hashes) and p['uniqueBlockHashes']==len(set(hashes)))
  for j,h in enumerate(hashes):ck('block hash',p['blockSha256'][j]==h)
  ck('block count',len(p['blockSha256'])==len(hashes))
  allHashes[u]+=hashes
ck('total',total==286720)
for u,row in zip(units,z['summary']):
 freq=collections.Counter(allHashes[u]);ck('population',row=={'unitBytes':u,'blocks':len(allHashes[u]),'distinctBlockHashes':len(freq),'duplicateHashGroups':sum(v>1 for v in freq.values()),'duplicateOccurrencesAboveUnique':len(allHashes[u])-len(freq)})
ck('counts',z['counts']=={'referencedResources':7,'totalBytes':286720,'exact7168Units':40,'exact1024Units':280,'unique1024Units':280,'unique7168Units':40})
for k in ('unitLengthArithmeticNotProvenRecordGrammar','hashUniquenessNotEvidenceOfRenderedTiles','noPaletteIdentityOrRGBBinding','noGeometryOrDisplayWidth','noGameStageNameAssignment','noRuntimeConsumersQualified'):ck('scope '+k,z['boundary'][k] is True)
ck('research open',z['boundary']['mk2ResearchClosed'] is False)
print(json.dumps({'status':'PASS','checks':n,'failures':0,'blockPopulations':{u:len(v) for u,v in allHashes.items()}}))
