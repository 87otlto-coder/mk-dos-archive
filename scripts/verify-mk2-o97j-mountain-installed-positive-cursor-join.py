#!/usr/bin/env python3
"""O97J independent verification, not importing the Node producer."""
import json,struct,hashlib,sys
from pathlib import Path
fixture,root=map(Path,sys.argv[1:3]);b=(fixture/'mk2.exe').read_bytes();h=lambda x:hashlib.sha256(x).hexdigest();u=lambda p:struct.unpack_from('<I',b,p)[0];src=lambda p:0xa0c54+p
raw=(root/'mk2_mountain_installed_positive_cursor_join_o97j_2026-10-09.json').read_bytes();r=json.loads(raw);g=(root/'mk2_mountain_runtime_setup_install_o97g_2026-10-09.json').read_bytes();i=(root/'mk2_mountain_dual_setup_producer_row_join_o97i_2026-10-09.json').read_bytes();prior=json.loads(i);checks=0
def ck(test,why):
 global checks
 checks+=1
 if not test:raise AssertionError('O97J independently rejected: '+why)
ck(h(b)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','fixture');ck(r['fixtureSha256']==h(b) and r['o97gSha256']==h(g) and r['o97iSha256']==h(i),'parents');ck(r['format']=='mk2_o97j_mountain_installed_positive_cursor_consumer_join_v1' and r['status']=='PASS','contract')
le=0x26654+u(0x26654+0x3c);idx=le+u(le+0x68);rec=le+u(le+0x6c);base=0x26654+u(le+0x80);loc={};n=0
ck((le,base,u(le+0x14))==(0x28f0c,0x61c54,113),'LE geometry')
for page in range(113):
 pos=rec+u(idx+page*4);end=rec+u(idx+(page+1)*4)
 while pos<end:
  kind=b[pos]&15;flags=b[pos+1];offset=struct.unpack_from('<h',b,pos+2)[0];pos+=4
  if flags&64:obj=struct.unpack_from('<H',b,pos)[0];pos+=2
  else:obj=b[pos];pos+=1
  target=None
  if kind!=2:
   if flags&16:target=u(pos);pos+=4
   else:target=struct.unpack_from('<H',b,pos)[0];pos+=2
  if flags&4:pos+=4 if flags&32 else 2
  ck(pos<=end,'reloc bounds');loc[base+page*4096+offset]=(kind,flags,obj,target);n+=1
 ck(pos==end,'page records complete')
ck(n==27004 and r['LErelocationCount']==n,'reloc count')
def ptr(offset,target):
 ck(loc.get(src(offset))==(7,16,2,target) and u(src(offset))==target,'pointer '+hex(offset))
ptr(0x1c2fe,0x15d60);ck(r['installedControlCursor']==0x15d60 and r['installedSourceObject2Offset']==0x1c2fe,'installed cursor')
rows=prior['rows'];ck(len(rows)==8 and rows[0]['listHead']==0x84350 and rows[2]['listHead']==0x84348,'producer list heads')
seen=[]
for index in range(10):
 offset=0x15d60+index*8;first=u(src(offset));second=u(src(offset+4));ptr(offset,first);ptr(offset+4,second)
 ck(0<first<0x80000000,'positive control token')
 associated=[x['row'] for x in rows if x['listHead']==first]
 expected={'pairIndex':index,'sourceObject2Offset':offset,'firstListHead':first,'secondWordSource':second,'matchesProducerRows':associated}
 ck(r['record']['pairs'][index]==expected,'pair '+str(index));seen.append(first)
ck(u(src(0x15d60+80))==0 and r['record']['terminalDWORD']==0 and r['record']['terminalObject2Offset']==0x15db0 and r['record']['pairCount']==10,'termination')
ck(len(set(seen))==10,'no duplicate list heads')
for row in rows:ck(seen.count(row['listHead'])==1,'row head included')
found=[]
for k in [0,2]:
 row=rows[k];ind=seen.index(row['listHead']);second=u(src(0x15d60+ind*8+4));found.append({'row':k,'listHead':row['listHead'],'positiveCursorPairIndex':ind,'secondWordSource':second})
ck(found==r['producerHeadCoverage']['installedSetupRows'],'source-to-consumer joined')
ck([x['positiveCursorPairIndex'] for x in found]==[7,5],'pair indexes')
ck(r['producerHeadCoverage']['matchedRowCount']==8 and r['producerHeadCoverage']['producerRowsMatched']==list(range(8)),'producer map')
code={'sceneControlStore':(0x81f55,'8b1883c004891df65c0700'),'cursorCopy':(0x93500,'8b15f65c07008915985a0700'),'cursorStart':(0x93547,'8b0d985a07008b0183c104a9ffffffff74517931'),'positiveBranch':(0x9358c,'8b3183c104668b36668935685a0700890d985a07008be8e8e8fdffffeb9d'),'listAdvance':(0x93390,'8b6d0085ed0f8549feffffc3')}
ck(len(r['machine'])==len(code),'machine records')
for witness in r['machine']:
 at,hexcode=code[witness['name']]
 ck(witness['at']==at and witness['hex']==hexcode and b[at:at+len(hexcode)//2].hex()==hexcode,'machine '+witness['name'])
ck(r['cursorCopy']=={'readGlobal':0x75cf6,'writeGlobal':0x75a98,'physical':0x93500},'cursor globals')
for key,status in {'bothInstalledSetupListHeadsPresentInSameControlRecord':'SUPPORTED','positiveTokenConsumerCanIterateBothListHeads':'SUPPORTED_CONDITIONALLY','cursorRecordContainsNegativeOneDirectRowCommands':'REJECTED','runtimeProcessCallObserved':'UNPROVEN','bothGraphicsLayersActuallyDrawnSameFrame':'UNPROVEN','runtimeLayerVisibilityAndOrder':'UNPROVEN'}.items():ck(r['hypotheses'][key]==status,'classification '+key)
print(json.dumps({'pass':'O97J','status':'PASS','independent_checks':checks,'failures':0,'LE_relocations':n,'pairs':len(seen),'setup_pairs':[[x['row'],x['positiveCursorPairIndex']] for x in found]}))
