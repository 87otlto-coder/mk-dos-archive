#!/usr/bin/env python3
"""Independent O97Q verifier: replay executable branch semantics and threshold probes, no producer import."""
import json,hashlib,struct,sys
from pathlib import Path
fixture,root=map(Path,sys.argv[1:3]);b=(fixture/'mk2.exe').read_bytes();digest=lambda x:hashlib.sha256(x).hexdigest()
P=(root/'mk2_mountain_directional_transform_threshold_tables_o97p_2026-10-09.json').read_bytes()
Q=json.loads((root/'mk2_mountain_directional_threshold_dispatch_o97q_2026-10-09.json').read_bytes())
checks=0
def check(condition,label):
 global checks
 checks+=1
 if not condition:raise AssertionError(label)
check(digest(b)==Q['fixtureSha256'],'authentic fixture')
check(Q['priorO97pSha256']==digest(P),'parent hash')
tables=json.loads(P)['tables']
check(len(tables)==2,'table count')
# Decode direct machine bytes: a complete byte-contract of source operands, unsigned comparisons, zero-sentinel route.
contracts={0x82178:'c705645a0700905f0100',0x82182:'b96c080200',0x821aa:'c705645a0700dc5f0100',0x821b4:'b9a3090200',0x821b9:'8b15da5f0700',0x821c0:'8b155e610700',0x821cd:'f7c2ffffffff',0x821d5:'f7da',0x821e3:'f71d6c5a0700',0x821e9:'3b156c5a0700',0x821ef:'7306',0x821f7:'f7c2ffffffff',0x8220d:'8b0d6c5a0700',0x82213:'8b09',0x82215:'83056c5a070004',0x8221c:'f7c1ffffffff',0x82228:'3bca',0x8222a:'7309',0x8222c:'83056c5a070004',0x82235:'8b0d6c5a0700',0x8223b:'8b09',0x8224b:'ffd1',0x82317:'b80c00000033d2f7f2'}
for addr,raw in contracts.items():check(b[addr:addr+len(raw)//2]==bytes.fromhex(raw),'opcode '+hex(addr))
check(Q['scalars']['firstGlobal']==0x75fda and Q['scalars']['secondGlobal']==0x7615e,'scalar global identities')
checks_by_side={}
for tbl in tables:
 direction=tbl['direction']; start=0x15f90 if direction=='positive' else 0x15fdc
 check(tbl['tableObject2Start']==start,'table src')
 rows=[]
 for i in range(9):
  at=0xa0c54+start+8*i
  threshold,pointer=struct.unpack_from('<II',b,at)
  saved=tbl['rows'][i]
  check(saved['threshold']==threshold and saved['pointerObject1Offset']==pointer,'table reparse')
  rows.append((threshold,0x61c54+pointer))
 check(rows[7][0]==0xa0000 and rows[8][0]==0x80000,'tail order')
 zero_addr=0xa0c54+start+72
 check(struct.unpack_from('<I',b,zero_addr)[0]==0,'end zero')
 probes=Q['probes']; observed=[x for x in Q['selections'] if x['direction']==direction]
 check(len(observed)==len(probes),'probe count')
 used=set()
 for given,actual in zip(probes,observed):
  check(actual['magnitude']==given,'ordered input')
  if given==0: assumed={'type':'zero-default','profileIndex':2 if direction=='positive' else 11}
  else:
   chosen=next(((i,t,p) for i,(t,p) in enumerate(rows) if given<=t),None)
   if chosen is None:assumed={'type':'zero-sentinel','codePath':'0x82317 (zero divisor)','noSuccessfulProfile':True}
   else:
    i,t,p=chosen;linked=next(x['profileIndex'] for x in tbl['rows'] if x['pointerObject1Offset']==p-0x61c54)
    assumed={'type':'threshold','profileIndex':linked,'threshold':t,'ordinal':i}
  check(actual['selection']==assumed,f'case {direction} magnitude {given}')
  if 'profileIndex' in assumed: used.add(assumed['profileIndex'])
 check(sorted(used)==Q['demonstratedProfilesByProbes'][direction],'selected coverage')
 check((7 if direction=='positive' else 16) not in used,'trailing unreachable')
 checks_by_side[direction]=len(observed)
check(Q['hypotheses']['all18FunctionsReachableThroughThisWalker']=='REJECTED','no misleading total reachability')
check(Q['hypotheses']['executesSpecificMountainTransform']=='UNPROVEN','no invented runtime trace')
print(json.dumps({'pass':'O97Q','independent':'PASS','checks':checks,'failures':0,'probeCasesByDirection':checks_by_side}))
