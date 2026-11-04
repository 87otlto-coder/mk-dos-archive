#!/usr/bin/env python3
"""Independent Python verification of exact O95U physical-window claims."""
from pathlib import Path
import json,hashlib,struct,sys
if len(sys.argv)!=5:raise SystemExit('usage: verify... <MK2.EXE> <O95U.json> <source> <window>')
b=Path(sys.argv[1]).read_bytes(); rep=json.loads(Path(sys.argv[2]).read_text()); root=Path(sys.argv[3]);window=int(sys.argv[4]);num=0
def ck(msg,cond):
 global num
 num+=1
 if not cond:raise AssertionError(msg)
def sha(b):return hashlib.sha256(b).hexdigest()
ck('EXE',sha(b)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
ck('report',rep['status']=='SUCCESS' and rep['format']=='mk2_animation_copy_identity_local_lookup_proximity_o95u_v1' and rep['windowBytes']==window==128)
tbytes=(root/'mk2_animation_identity_copy_provenance_o95t_2026-10-08.json').read_bytes();rbytes=(root/'mk2_animation_adjacent_index_extent_o95r_2026-10-08.json').read_bytes();t=json.loads(tbytes);r=json.loads(rbytes)
ck('inputs',rep['source']==dict(exeSha256=sha(b),o95tSha256=sha(tbytes),o95rSha256=sha(rbytes)))
lookups=r['literalCallsites']+r['nonAdjacentCallsites'];ck('253',len(lookups)==253)
ck('12 rows',len(rep['sites'])==len(t['sites'])==12)
candidates=[]
for s,row in zip(t['sites'],rep['sites']):
 p=s['identityWriterPhysical'];ck('write identity',p==row['writerPhysical'] and b[p:p+3].hex()==s['writerInstructionHex'])
 ck('source kind',s['sourceKind']==row['sourceKind'] and s['pointerBaseProvenance']==row['pointerBaseProvenance'])
 expected=sorted([l for l in lookups if p<l['lookupCallPhysical']<=p+window],key=lambda l:l['lookupCallPhysical']);ck('candidate cardinality',len(expected)==len(row['nearbyLookups']))
 for l,v in zip(expected,row['nearbyLookups']):
  a=l['lookupCallPhysical'];target=a+5+struct.unpack_from('<i',b,a+1)[0]
  ck('authentic call target',b[a]==0xe8 and target==(0x918f1 if l['family']=='A' else 0x91909))
  ck('candidate record',v['lookupPhysical']==a and v['family']==l['family'] and v['distanceBytes']==a-p and v['callTargetPhysical']==target and v['index']==l['index'])
  ck('byte hash',v['intervalSha256']==sha(b[p:a+5]))
  ck('no invented numerical join',v['sourceValueNumericallyKnown'] is False and v['copyValueReachesLookupProven'] is False)
 if row['sourceKind']=='OBJECT_FIELD_COPY' and expected:candidates.append(p)
ck('candidate set',candidates==[0x95237,0x95d57,0x96228]);ck('counts',rep['counts']['copySitesWithFollowingLookupWithin128Bytes']==3 and rep['counts']['copySitesWithoutFollowingLookupWithin128Bytes']==7)
for k in ('codeAddressProximityNotExecutionReachability','objectIdentityNumericalValueNotProven','helperOrBranchProvenanceNotAssumed','noNewFixedIdentityWitness','witnessesStill7','terminalConsumersStill210','strongConsumersStill239','heldStill14'):
 ck('boundary '+k,rep['boundary'][k] is True)
ck('research open',rep['boundary']['mk2ResearchClosed'] is False)
print(json.dumps({'status':'PASS','checks':num,'failures':0,'copySitesWithLocalCandidateLookups':len(candidates),'newAnimationWitnesses':0}))
