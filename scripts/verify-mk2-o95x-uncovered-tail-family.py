#!/usr/bin/env python3
from pathlib import Path
import sys,json,hashlib,collections
if len(sys.argv)!=5:raise SystemExit('usage: verify-mk2-o95x... <fixture> <o95w> <o95x> <repo>')
fix=Path(sys.argv[1]);wb=Path(sys.argv[2]).read_bytes();w=json.loads(wb);o=json.loads(Path(sys.argv[3]).read_text());n=0
def ck(x,y):
 global n
 n+=1
 if not y:raise AssertionError(x)
def sha(b):return hashlib.sha256(b).hexdigest()
ck('format',o['format']=='mk2_partial_gra_suffix_alignment_byte_family_o95x_v1' and o['status']=='SUCCESS')
ck('sources',o['source']==dict(o95wSha256=sha(wb),originalExeSha256=sha((fix/'mk2.exe').read_bytes())))
expected=[]
for r in w['resources']:
 data=(fix/r['resourceName'].lower()).read_bytes();ck('input SHA '+r['resourceName'],sha(data)==r['resourceSha256'])
 for s in r['uncoveredSpans']:
  if s['start']>0 and s['endExclusive']==len(data) and s['length']%1024==0:
   expected.append((r,s,data[s['start']:s['endExclusive']]))
ck('member count',len(expected)==len(o['members'])==6)
for (r,s,data),entry in zip(expected,o['members']):
 ck('exact region',entry['resource']==r['resourceName'] and (entry['start'],entry['endExclusive'],entry['byteLength'],entry['blocks1024'])==(s['start'],s['endExclusive'],len(data),len(data)//1024))
 ck('region SHA',entry['tailSha256']==sha(data))
 cnt=collections.Counter(data);over63=sum(n for x,n in cnt.items() if x>63)
 ck('range and distinct',entry['minByte']==min(cnt) and entry['maxByte']==max(cnt) and entry['distinctByteValues']==len(cnt) and entry['byteCountAbove63']==over63)
 ck('above63 fraction',entry['fractionAbove63']==round(over63/len(data),6))
 ck('frequencies',entry['topByteFrequencies']==[dict(val=x,n=v) for x,v in sorted(cnt.items(),key=lambda z:(-z[1],z[0]))[:6]])
 ck('no semantic elevation',entry['semanticRasterWidthEstablished'] is False and entry['paletteOwnershipEstablished'] is False)
ck('specific six', [r['resourceName'] for r,s,data in expected]==['PORTAL.GRA','ARMORY.GRA','FOREST.GRA','TOMB.GRA','TOWER.GRA','ARENA.GRA'])
ck('counts',o['counts']==dict(members=6,alignedBytes=sum(len(d) for _,_,d in expected),byteValuesAbove63Members=sum(max(d)>63 for _,_,d in expected),byteValuesNotAbove63Members=sum(max(d)<=63 for _,_,d in expected)))
for k in ('alignmentNotEvidenceOfRasterDimensions','byteValueNotAutomaticallyPaletteIndex','stageAndCameraMappingUnproven','uncoveredSpanNotPartOfO69DecodedStream','doesNotPromoteFullGRAClassification'):
 ck(k,o['boundary'][k] is True)
ck('research open',o['boundary']['mk2ResearchClosed'] is False)
print(json.dumps({'status':'PASS','checks':n,'failures':0,'alignedSuffixes':6,'membersWithByteAbove63':sum(max(d)>63 for _,_,d in expected)}))
