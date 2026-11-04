#!/usr/bin/env python3
"""Independent exact-byte gap union audit of O95W; no decoded-content semantic promotions."""
import json,sys,hashlib
from pathlib import Path
if len(sys.argv)!=5:raise SystemExit('usage: verify-mk2-o95w... <fixture> <freshO69> <report> <repo>')
fixture=Path(sys.argv[1]);cbuf=Path(sys.argv[2]).read_bytes();c=json.loads(cbuf);o=json.loads(Path(sys.argv[3]).read_text());checks=0
def ck(label,truth):
 global checks
 checks+=1
 if not truth:raise AssertionError(label)
def sha(x):return hashlib.sha256(x).hexdigest()
ck('format',o['format']=='mk2_partial_gra_exact_decoded_span_and_gap_map_o95w_v1' and o['status']=='SUCCESS')
ck('O69 source',o['source']['regeneratedO69Sha256']==sha(cbuf))
ck('canonical MK2 executable',o['source']['exeSha256']==sha((fixture/'mk2.exe').read_bytes())=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
ck('15 partial resources',len(c['partialOrAmbiguousResources'])==len(o['resources'])==15)
fully=[];sumGap=0;sumUnion=0;numGaps=0
for prior,row in zip(c['partialOrAmbiguousResources'],o['resources']):
 name=prior['resourceName'];data=(fixture/name.lower()).read_bytes();N=len(data)
 ck(name+' name and size',row['resourceName']==name and row['resourceSize']==prior['fileSize']==N and row['resourceId']==prior['resourceId'])
 ck(name+' raw SHA256',row['resourceSha256']==sha(data))
 ck(name+' prior counts',row['o69DecodedIntervals']==len(prior['streams']) and row['o69BoundaryMismatchCount']==prior['boundaryMismatchCount'] and row['o69AmbiguousOffsetCount']==prior['ambiguousOffsetCount'])
 intervals=sorted((s['graOffset'],s['encodedEndExclusive']) for s in prior['streams']);prev=[]
 for start,end in intervals:
  ck(name+' bounds',0<=start<end<=N)
  if prev and start<=prev[-1][1]:prev[-1][1]=max(prev[-1][1],end)
  else:prev.append([start,end])
 ck(name+' merge intervals',row['mergedDecodeSpans']==[{'start':a,'endExclusive':z} for a,z in prev] and row['mergedIntervalCount']==len(prev))
 uncovered=[];cursor=0
 for start,end in prev:
  if start>cursor:uncovered.append((cursor,start))
  cursor=max(cursor,end)
 if cursor<N:uncovered.append((cursor,N))
 ck(name+' missing gap count',len(row['uncoveredSpans'])==len(uncovered))
 for (a,z),gap in zip(uncovered,row['uncoveredSpans']):
  ck(name+' gap coords and size',(gap['start'],gap['endExclusive'],gap['length'])==(a,z,z-a))
  ck(name+' gap hash + first bytes',gap['sha256']==sha(data[a:z]) and gap['prefix16Hex']==data[a:min(z,a+16)].hex())
 union=sum(z-a for a,z in prev);missing=sum(z-a for a,z in uncovered)
 ck(name+' exact partition',union+missing==N and row['coveredByAnyKnownDecodeSpanBytes']==union and row['notCoveredByKnownDecodeSpanBytes']==missing)
 ck(name+' percent',row['coveredByAnyKnownDecodeSpanPercent']==round(union/N*100,2))
 ck(name+' overlap and held',row['hasOverlappingDecodeIntervals']==(len(prev)<len(intervals)) and row['exactFullResourcePromoted'] is False)
 sumGap+=missing;sumUnion+=union;numGaps+=len(uncovered)
 if missing==0:fully.append(name)
ck('only PLAYSTA union fully covered',fully==['PLAYSTA.GRA'])
ck('summary',o['counts']==dict(partialOrAmbiguousResources=15,partialResourcesWithNoUncoveredByteRegions=1,partialResourcesWithUncoveredByteRegions=14,totalUncoveredSpans=numGaps,unionCoveredBytes=sumUnion,notCoveredBytes=sumGap,fullExactGRAResourcesStill94=94,otherGRAResourcesStill30=30))
for k in ('aDecodableIntervalIsNotUniqueOwnershipWhenOverlaps','fullByteUnionDoesNotImplyExactFullClassification','uncoveredBytesDoNotAutomaticallyRepresentAnImage','resourceNamesNotSemanticTypes','mk2StageReconstructionOpen'):
 ck('boundary '+k,o['boundary'][k] is True)
ck('not closed',o['boundary']['mk2ResearchClosed'] is False)
print(json.dumps({'status':'PASS','checks':checks,'failures':0,'partialResources':15,'noGapButStillAmbiguous':fully,'uncoveredBytes':sumGap,'uncoveredIntervals':numGaps}))
