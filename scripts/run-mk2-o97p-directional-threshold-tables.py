#!/usr/bin/env python3
"""Source-backed O97P: two signed-direction threshold->nine-value-transform tables."""
import struct,hashlib,json,sys
from pathlib import Path
fixture,root=map(Path,sys.argv[1:3]); b=(fixture/'mk2.exe').read_bytes()
h=lambda x:hashlib.sha256(x).hexdigest()
assert h(b)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
u=lambda p:struct.unpack_from('<I',b,p)[0]
w=lambda p:struct.unpack_from('<H',b,p)[0]
le=0x28f0c; ix=le+u(le+0x68); rec=le+u(le+0x6c)
rel={};count=0
for pg in range(u(le+0x14)):
 c=rec+u(ix+pg*4);e=rec+u(ix+(pg+1)*4)
 while c<e:
  kind=b[c]&15; fl=b[c+1]; delta=struct.unpack_from('<h',b,c+2)[0];c+=4
  obj=w(c) if fl&64 else b[c];c+=2 if fl&64 else 1
  target=None
  if kind!=2:target=u(c) if fl&16 else w(c);c+=4 if fl&16 else 2
  if fl&4:c+=4 if fl&32 else 2
  rel[0x61c54+pg*4096+delta]=(kind,fl,obj,target);count+=1
 assert c==e
assert count==27004
profiles=json.loads((root/'mk2_mountain_nine_value_transform_bank_o97n_2026-10-09.json').read_text())['profiles']
assert len(profiles)==18
results=[]
for side,table,term,store,backup,start_index in [('positive',0x15f90,0x15fd8,0x8217e,0x2086c,0),('negative',0x15fdc,0x16024,0x821b0,0x209a3,9)]:
 code=b[store-6:store+4]
 assert b[store-6:store]==bytes.fromhex('c705645a0700')
 assert u(store)==table and rel.get(store)==(7,16,2,table)
 rows=[]
 for j in range(9):
  t=0xa0c54+table+j*8
  threshold=u(t);pointer=u(t+4); physical=0x61c54+pointer
  assert rel.get(t+4)==(7,16,1,pointer)
  matched=next((pr for pr in profiles if pr['entryPhysical']==physical),None)
  assert matched and (matched['index']<9)==(side=='positive')
  assert b[physical:matched['endPhysical']].hex()==matched['codeHex']
  rows.append({'ordinal':j,'thresholdObject2Offset':table+8*j,'threshold':threshold,'pointerFieldObject2Offset':table+8*j+4,'pointerObject1Offset':pointer,'codePhysical':physical,'profileIndex':matched['index'],'operation':matched['operation']})
 assert u(0xa0c54+term)==0 and (0xa0c54+term) not in rel
 assert len({x['profileIndex'] for x in rows})==9
 results.append({'direction':side,'tableObject2Start':table,'sentinelObject2Offset':term,'codeRelocationOperand':store,'defaultFunctionObject1Offset':backup,'rows':rows,'entryOrderMonotone':all(rows[j]['threshold']<=rows[j+1]['threshold'] for j in range(8)),'tableSha256':h(b[0xa0c54+table:0xa0c54+term+4])})
assert results[0]['rows'][-2]['threshold']==0xa0000 and results[0]['rows'][-1]['threshold']==0x80000
assert results[1]['rows'][-2]['threshold']==0xa0000 and results[1]['rows'][-1]['threshold']==0x80000
assert b[0x82182:0x82187].hex()=='b96c080200' and b[0x821b4:0x821b9].hex()=='b9a3090200'
assert b[0x8224b:0x8224d].hex()=='ffd1'
report={'format':'mk2_o97p_two_direction_transform_threshold_tables_v1','status':'PASS','fixtureSha256':h(b),'relocationRecords':count,'priorO97nSha256':h((root/'mk2_mountain_nine_value_transform_bank_o97n_2026-10-09.json').read_bytes()),'tables':results,'binaryWitnesses':[{'at':pos,'bytes':b[pos:pos+n].hex()} for pos,n in [(0x82178,15),(0x821aa,15),(0x821b9,51),(0x8220d,64),(0x8224b,2),(0x82317,9)]], 'hypotheses':{'twoTablesOfNineRelocatedCodePointers':'SUPPORTED','everyTablePointerResolvesToO97NArithmeticFunction':'SUPPORTED','tablesAreSortedAscending':'REJECTED','tableProximityEstablishesActiveMountainFunction':'UNPROVEN','timeOrPixelsPerFrame':'UNPROVEN'},'limits':'These 18 code relocations establish a two-direction table of available arithmetic functions. Neither table is sorted at its tail: 0xA0000 precedes 0x80000. The actual scalar inputs are runtime state; no particular profile is proven to execute for Mountain.'}
out=root/'mk2_mountain_directional_transform_threshold_tables_o97p_2026-10-09.json';out.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'pass':'O97P','status':'PASS','relocationRecords':count,'tables':len(results),'entries':sum(len(x['rows']) for x in results),'sorted': [x['entryOrderMonotone'] for x in results]}))
