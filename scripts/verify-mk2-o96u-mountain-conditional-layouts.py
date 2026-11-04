#!/usr/bin/env python3
"""Independent O96U permutation/descriptor/pixel join, reading fixture directly."""
import sys,struct,json,hashlib
from pathlib import Path
if len(sys.argv)!=3:raise SystemExit('usage: verifier <mk2-dir> <O96U json>')
fx=Path(sys.argv[1]);b=(fx/'mk2.exe').read_bytes();r=json.loads(Path(sys.argv[2]).read_text());root=Path(__file__).resolve().parent.parent;n=0
H=lambda z:hashlib.sha256(z).hexdigest()
def ck(a,m):
 global n
 n+=1
 if not a:raise AssertionError('O96U '+m)
ck(H(b)==r['exeSha256']=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','fixture')
sbytes=(root/'mk2_static_word_stream_descriptor_consumer_join_o96s_2026-10-09.json').read_bytes();tbytes=(root/'mk2_mountain_selected_indexed_graphics_o96t_2026-10-09.json').read_bytes()
ck(H(sbytes)==r['o96sSha256'] and H(tbytes)==r['o96tSha256'],'two prerequisite hashes')
s=json.loads(sbytes);t=json.loads(tbytes)
ck(s['status']==t['status']=='SUCCESS','prerequisites')
ck(r['status']=='SUCCESS' and r['format']=='mk2_o96u_mountain_conditional_indexed_layouts_v1','format')
ck(r['variantCount']==len(r['variants'])==6,'six alternatives')
arrangements=[]
for i,v in enumerate(r['variants']):
 orig=0xa0c54+0x2af98+32*i
 raw=[struct.unpack_from('<h',b,orig+2*j)[0] for j in range(16)]
 ck(raw[14:]==[13,-1] and sorted(raw)==[-1]+list(range(15)),f'variant {i} token domain')
 ck(v['choice']==i and v['streamOffset']==0x2af98+32*i and v['conditionalObjects']==14 and v['stopToken']==13,'variant contract')
 ck(len(v['rows'])==14,'14 rows')
 seen=set();ordered=[]
 for j,q in enumerate(v['rows']):
  token=raw[j];ptr=struct.unpack_from('<I',b,0xa0c54+0x1c264+4*token)[0]
  ck(token in set(range(15))-{13} and ptr==0x1c4cc+16*min(token,13),'selected pointer')
  desc=struct.unpack_from('<HHIII',b,0xa0c54+ptr)
  ck(desc[0:3]==(35,41,0) and (desc[3]>>24)==37 and desc[4]==0x2b52a,'record join')
  off=desc[3]&0xffffff;param=struct.unpack_from('<h',b,0xa0c54+0x1c2c6+j*2)[0]
  ck(param==771-47*j,'record param')
  expected={'ordinal':j,'token':token,'decodedImageOrdinal':min(token,13),'descriptorOffset':ptr,'graOffset':off,'pixelSha256':t['records'][min(token,13)]['pixelSha256'],'lowWordObjectPlus1A':197,'highWordObjectPlus1E':param}
  for k,z in expected.items():ck(q.get(k)==z,f'{i}:{j} {k}')
  seen.add(ptr);ordered.append(min(token,13))
 ck(len(seen)==14 and len(set(ordered))==14,'14 distinct selected sprites per variant')
 arrangements.append(tuple(ordered))
ck(arrangements[2]==arrangements[3] and len(set(arrangements))==5,'five arrangements with duplicate 2/3')
ck(r['uniqueOrderedArrangements']==5 and r['knownDuplicateSelections']==[2,3] and r['distinctIndexedSpritesPerVariant']==14,'summary')
ck({q['id']:q['verdict'] for q in r['hypotheses']}=={'U1':'SUPPORTED_CONDITIONAL','U2':'REJECTED_ALIASES_SLOT_13','U3':'UNPROVEN','U4':'UNPROVEN'},'hypotheses verified')
ck(r['boundary']=={'gameplaySelectionObserved':False,'objectSpawnGuaranteed':False,'screenCoordinateScaleProven':False,'paletteProven':False,'stageExportReady':False},'conservative boundary')
print(json.dumps({'pass':'O96U','status':'PASS','checks':n,'failures':0,'sixAlternatives':6,'distinctArrangements':5,'imagesPerConditionalLayout':14}))
