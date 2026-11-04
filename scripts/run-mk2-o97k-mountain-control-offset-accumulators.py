#!/usr/bin/env python3
"""O97K: exact additive accumulator update feeding the installed positive cursor's word selectors."""
import json,struct,sys,hashlib
from pathlib import Path
fixture,root=map(Path,sys.argv[1:3]);b=(fixture/'mk2.exe').read_bytes();u=lambda p:struct.unpack_from('<I',b,p)[0];h=lambda d:hashlib.sha256(d).hexdigest()
prior_bytes=(root/'mk2_mountain_installed_positive_cursor_join_o97j_2026-10-09.json').read_bytes();prior=json.loads(prior_bytes);assert prior['status']=='PASS'
assert h(b)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
# Two-instruction groups: mov r32,[global], add [global],r32; independently enumerate exact source/destination addresses.
start=0x93433; cursor=start;updates=[]
for i in range(10):
 beginning=cursor
 if b[cursor]==0xa1:register=0;source=u(cursor+1);cursor+=5
 else:
  assert b[cursor:cursor+2] in (b'\x8b\x1d',b'\x8b\x0d',b'\x8b\x15')
  register={0x1d:3,0x0d:1,0x15:2}[b[cursor+1]];source=u(cursor+2);cursor+=6
 assert b[cursor]==0x01 and b[cursor+1]=={0:0x05,1:0x0d,2:0x15,3:0x1d}[register]
 target=u(cursor+2);cursor+=6
 updates.append({'index':i,'physical':beginning,'source':source,'destination':target,'bytes':b[beginning:cursor].hex()})
assert cursor==0x934a8
assert [x['source'] for x in updates]==[0x842e4]+[0x842ec+4*i for i in range(9)]
assert [x['destination'] for x in updates]==[0x842e8]+[0x84310+4*i for i in range(9)]
# Check dynamic word read into global before linked-object walker.
assert b[0x9358c:0x9359b].hex()=='8b3183c104668b36668935685a0700'
selector_sources=sorted(set(x['secondWordSource'] for x in prior['record']['pairs']))
assert selector_sources==[0x84312+4*i for i in range(8)]
joined=[]
for q in prior['record']['pairs']:
 match=[x for x in updates if x['destination']+2==q['secondWordSource']]
 assert len(match)==1
 joined.append({'pairIndex':q['pairIndex'],'head':q['firstListHead'],'secondWordPointer':q['secondWordSource'],'accumulatorUpdateIndex':match[0]['index'],'updateSource':match[0]['source'],'updateDestination':match[0]['destination']})
assert [x['accumulatorUpdateIndex'] for x in joined]==[1,2,3,4,5,6,7,8,8,8]
# The selected controller can load signed 16-bit words from accumulator upper halves, but no unit/temporal rate inferred.
report={'format':'mk2_o97k_mountain_positive_control_word_accumulator_joins_v1','status':'PASS','fixtureSha256':h(b),'priorO97jSha256':h(prior_bytes),'updateRangePhysical':[start,cursor],'updates':updates,'positivePairJoins':joined,'uniqueSecondWordSources':selector_sources,'machineRead':{'at':0x9358c,'hex':b[0x9358c:0x9359b].hex(),'globalTarget':0x75a68},'hypotheses':{'controllerUpdatesPositivePairWordSources':'SUPPORTED','threeLastPairsShareOneWordSource':'SUPPORTED','accumulatorsAreCameraPositions':'UNPROVEN','eachIncrementMeansOneGameFrame':'UNPROVEN','specificScrollSpeedFPS':'UNPROVEN','runtimeSceneActuallyDrawn':'UNPROVEN'},'limits':'Proof is exact machine-code linkage from additive DWORD state updates to high-half-word sources read by positive-list walker. Initial accumulator values, per-scene execution, units, temporal cadence, scrolling direction, and output crop not established.'}
(root/'mk2_mountain_positive_control_word_accumulators_o97k_2026-10-09.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'pass':'O97K','status':'PASS','updatePairs':len(updates),'wordSources':len(selector_sources),'controlPairs':len(joined),'positions':[hex(x) for x in selector_sources]}))
