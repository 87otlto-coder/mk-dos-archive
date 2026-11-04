#!/usr/bin/env python3
"""O97I: authenticate conditional join from installed slots to eight-row producer."""
import hashlib,json,struct,sys
from pathlib import Path
fixture,root=map(Path,sys.argv[1:3]); b=(fixture/'mk2.exe').read_bytes();u=lambda p:struct.unpack_from('<I',b,p)[0];h=lambda x:hashlib.sha256(x).hexdigest(); src=lambda off:0xa0c54+off
assert h(b)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
prev=json.loads((root/'mk2_mountain_runtime_setup_install_o97g_2026-10-09.json').read_text()); assert prev['status']=='PASS'
assert [(x['runtimeSlot'],x['storedValue']) for x in prev['assignments']]==[(0x77453,0x1c306),(0x77457,1),(0x7745b,0x1c312)]
# Parse only genuine LE fixups; never assign pointer status merely from a numeric match.
le=0x26654+u(0x26654+0x3c); ix=le+u(le+0x68);records=le+u(le+0x6c);base=0x26654+u(le+0x80)
assert le==0x28f0c and base==0x61c54
loc={};count=0
for page in range(u(le+0x14)):
 x=records+u(ix+page*4);stop=records+u(ix+(page+1)*4)
 while x<stop:
  k=b[x]&15;f=b[x+1];delta=struct.unpack_from('<h',b,x+2)[0];x+=4
  if f&64:ob=struct.unpack_from('<H',b,x)[0];x+=2
  else:ob=b[x];x+=1
  target=None
  if k!=2:
   if f&16:target=u(x);x+=4
   else:target=struct.unpack_from('<H',b,x)[0];x+=2
  if f&4:x+=4 if f&32 else 2
  loc[base+4096*page+delta]=(k,f,ob,target);count+=1
 assert x==stop
assert count==27004
rows=[]
for i in range(8):
 off=0x15b68+16*i; fields=[u(src(off+4*n)) for n in range(4)];head=0x84350-4*i
 for n,v in enumerate(fields): assert loc.get(src(off+4*n))==(7,16,2,v),(i,n)
 assert fields[3]==0x77453+4*i
 rows.append({'row':i,'tableObject2Offset':off,'fields':[hex(v) for v in fields],'slot':fields[3],'listHead':head})
assert rows[0]['slot']==0x77453 and rows[1]['slot']==0x77457 and rows[2]['slot']==0x7745b
for item in [(0x1c302,0x77453),(0x1c306,0x1c31e),(0x1c312,0x1c330)]: assert loc.get(src(item[0]))==(7,16,2,item[1])
# Emulate solely first 3 slot tests; do not assume runtime state for rows 3-7.
assignment={a['runtimeSlot']:a['storedValue'] for a in prev['assignments']}
first=[]
for row in rows[:3]:
 value=assignment[row['slot']]
 action='skip_sentinel_1' if value==1 else ('return_sentinel_0x30240' if value==0x30240 else 'call_0x81BF2_conditional')
 resolved=u(src(value)) if value not in (1,0x30240) else None
 first.append({'row':row['row'],'runtimeSlot':row['slot'],'storedValue':value,'resolvedSetupOffset':resolved,'action':action,'listHead':row['listHead']})
assert [p['action'] for p in first]==['call_0x81BF2_conditional','skip_sentinel_1','call_0x81BF2_conditional']
assert [p['resolvedSetupOffset'] for p in first]==[0x1c31e,None,0x1c330]
code={
 'row_table_loop':(0x81bb3,'565755bb685b0100bf544308008b2b8b53048b4b088b430c83c31083ef0481ff3043080074158b0083f80174e03d400203007407e806000000ebd25d5f5ec3'),
 'conditional_parameter_deref':(0x81bf2,'53578b098b12c1e91081e20000ffff0bca8bd1e8030000005f5bc3'),
 'cursor_write':(0x81c48,'893d985a0700e8c30100008b30'),
 'object_insertion':(0x81e07,'8bc5e8c647feff'),
 'slot_install':(0x81f9c,'890383c30483c008ebbf')}
for name,(p,c) in code.items():assert b[p:p+len(c)//2].hex()==c,name
res={'format':'mk2_o97i_mountain_dual_setup_producer_join_v1','status':'PASS','fixtureSha256':h(b),'o97gSha256':h((root/'mk2_mountain_runtime_setup_install_o97g_2026-10-09.json').read_bytes()),'relocations':count,'rowTableObject2Offset':0x15b68,'rowCount':8,'rows':rows,'firstThreeAfterConditionalInstaller':first,'instructionWitnesses':[{'name':name,'at':p,'hex':c} for name,(p,c) in code.items()], 'hypotheses':{'sameProducerInvocationCanVisitBothSetupRows':'SUPPORTED_CONDITIONALLY','middleRowHasExplicitSkipSentinel':'SUPPORTED','allEightListsPopulated':'UNPROVEN','twoSetupsDefinitelyRenderedInSameFrame':'UNPROVEN','allLaterRowsProcessSuccessfully':'UNPROVEN','runtimeEntryObserved':'UNPROVEN'},'limits':'The installer must execute, producer callback must be scheduled and each earlier row/callee must return without exit. The two setup references are eligible in one traversal; per-object tests can reject all proposed allocations. No observed drawing order, crop or RGB.'}
(root/'mk2_mountain_dual_setup_producer_row_join_o97i_2026-10-09.json').write_text(json.dumps(res,indent=2)+'\n')
print(json.dumps({'pass':'O97I','status':'PASS','relocations':count,'setupRows':[(x['row'],hex(x['resolvedSetupOffset'] or 0),x['action']) for x in first]}))
