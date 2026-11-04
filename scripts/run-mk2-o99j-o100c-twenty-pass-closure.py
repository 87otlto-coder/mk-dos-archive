#!/usr/bin/env python3
"""O99J–O100C. Finite, negative-aware source research; does not infer screen ownership.
Reads authentic native executable/GRA and a frozen earlier witness corpus; writes twenty JSON reports.
"""
import sys,struct,json,hashlib,collections,math
from pathlib import Path
exe_path,fixture_arg,prev_arg,out_arg=sys.argv[1:5]
e=Path(exe_path).read_bytes();fixture=Path(fixture_arg);prev=Path(prev_arg);out=Path(out_arg);out.mkdir(parents=True,exist_ok=True)
H=lambda a:hashlib.sha256(a).hexdigest();U=lambda a,p:struct.unpack_from('<I',a,p)[0];W=lambda a,p:struct.unpack_from('<H',a,p)[0]
assert H(e)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
original=json.loads((prev/'mk2_o99i_battle-cave-fonts-playsta-boundaries_2026-10-09.json').read_text())
old={r['resource']:r for f in [original,'mk2_o99h_tower-arena-pit-title-vframe-mixed_2026-10-09.json'] for r in (f['resourceEvidence'] if isinstance(f,dict) else json.loads((prev/f).read_text())['resourceEvidence'])}
o69_file=prev/'mk2_broad_indexed_graphics_corpus_census_2026-10-02.json'
if not o69_file.exists():o69_file=prev.parent.parent/'docs/evidence/1E3O69/mk2_broad_indexed_graphics_corpus_census_2026-10-02.json'
o69=json.loads(o69_file.read_text())
prior={r['resourceName']:r for r in o69['partialOrAmbiguousResources']}
fixture_cache={}
def resource(n):
 if n not in fixture_cache:fixture_cache[n]=(fixture/(n.decode() if isinstance(n,bytes) else n).lower()).read_bytes()
 return fixture_cache[n]
def img(b,p,w,h):
 cur=p;px=bytearray(w*h);mask=bytearray(w*h)
 for row in range(h):
  col=0
  while col<w:
   assert cur+4<=len(b);cmd=U(b,cur);cur+=4
   if cmd&1:num=cmd>>1
   elif cmd&2:
    num=cmd>>10; val=(cmd>>2)&255
    assert num>0 and num<=w-col
    px[row*w+col:row*w+col+num]=bytes([val])*num;mask[row*w+col:row*w+col+num]=b'\1'*num
   else:
    num=cmd>>2
    assert 0<num<=64 and cur+num<=len(b)
    px[row*w+col:row*w+col+num]=b[cur:cur+num];mask[row*w+col:row*w+col+num]=b'\1'*num;cur+=(num+3)&~3
   assert 0<num<=w-col;col+=num
 return dict(end=cur,pixelHash=H(px),maskHash=H(mask),opaque=sum(mask))
def row_tail(n,idx):
 b=resource(n);pack=U(e,0xcfbac+4*idx);start=pack&0xffffff;tail=b[start:];assert (pack>>24)==(e[0xa0ef1:0xa13a7].split(b'\0')).index(n)
 assert len(tail)%896==0 and len(tail)%7168==0
 chunks=[tail[i:i+896] for i in range(0,len(tail),896)]
 return dict(name=n.decode(),slot=idx,pack=pack,resourceBytes=len(b),resourceSha256=H(b),offset=start,suffixBytes=len(tail),suffixSha256=H(tail),pitch=896,rows=len(chunks),units7168=len(tail)//7168,rawMin=min(tail),rawMax=max(tail),rowHashes=[H(c) for c in chunks],first320Sha256=H(b''.join(c[:320] for c in chunks)),remaining576Sha256=H(b''.join(c[320:] for c in chunks)))
names=[b'TOMB.GRA',b'BATTLE.GRA',b'TOWER.GRA',b'FOREST.GRA',b'ARMORY.GRA',b'PORTAL.GRA',b'ARENA.GRA']
tails={name.decode():row_tail(name,slot) for slot,name in zip([0,1,2,3,4,6,7],names)}
def decoder_report(n):
 b=resource(n);r=old[n]
 entries=[]
 for i,x in enumerate(r['records']):
  loc=0xa0c54+x['object2Offset'];w=W(e,loc);h=W(e,loc+2);packed=U(e,loc+4);p=packed&0xffffff
  d=img(b,p,w,h);assert p==x['graStart'] and d['end']==x['endExclusive']
  entries.append({'id':i,'offset':p,'end':d['end'],'width':w,'height':h,'pixelHash':d['pixelHash'],'maskHash':d['maskHash']})
 return entries
specs=[('O99J','cave-zero-offset-candidate'),('O99K','cave-prefixed-image-chain'),('O99L','vframe-two-decodings'),('O99M','vframe-alternative-full-tiling'),('O99N','battle-duplicate-descriptors'),('O99O','battle-packed-row-region'),('O99P','portal-packed-row-region'),('O99Q','armory-packed-row-region'),('O99R','forest-packed-row-region'),('O99S','tomb-packed-row-region'),('O99T','tower-packed-row-region'),('O99U','arena-packed-row-region'),('O99V','seven-region-row-reconciliation'),('O99W','fonts-indexed-suffix-boundary'),('O99X','playsta-overlapping-witnesses'),('O99Y','probe-untyped-content'),('O99Z','acclaim-untyped-content'),('O100A','monks-dword-content'),('O100B','held-coverage-crosswalk'),('O100C','bounded-row-consumer-fingerprint')]
assert len(specs)==20
for pass_,topic in specs:
 data={};assert pass_ in [x[0] for x in specs]
 if pass_=='O99J':
  b=resource('CAVE.GRA');pack=struct.pack('<I',29<<24);occ=[p for p in range(0,len(e)-3) if e[p:p+4]==pack and p>=0xa0c54];
  candidate=(12,78);failed=''
  try:img(b,0,*candidate)
  except (AssertionError,struct.error,IndexError) as exc:failed='INVALID_MK2_INDEXED_STREAM_FOR_12x78'
  assert failed and len(occ)>=1
  data=dict(firstImageByte=120,first120Sha256=H(b[:120]),first120Dwords=[U(b,i) for i in range(0,120,4)],packedZeroCandidateLocations=occ,attemptedGeometry=list(candidate),attemptResult=failed,classification='HEADER_OR_OTHER_UNQUALIFIED')
 elif pass_=='O99K':
  a=decoder_report('CAVE.GRA');assert len(a)==49 and a[0]['offset']==120 and a[-1]['end']==len(resource('CAVE.GRA'))
  data=dict(imageCount=49,start=a[0]['offset'],end=a[-1]['end'],imageDigests=[x['pixelHash'] for x in a],adjacent=all(x['end']==y['offset'] for x,y in zip(a,a[1:])),prefixExcluded=120,classification='49_IMAGES_PLUS_UNQUALIFIED_120_PREFIX')
 elif pass_=='O99L':
  a=decoder_report('VFRAME.GRA');b=resource('VFRAME.GRA');r=prior['VFRAME.GRA']['streams'][0];d=img(b,r['graOffset'],r['width'],r['height'])
  data=dict(eightByteFirstStream=[a[0]['offset'],a[0]['end']],twelveByteFirstStream=[r['graOffset'],d['end']],twelveByteImageHash=d['pixelHash'],eightByteImageHash=a[0]['pixelHash'],overlapBytes=min(a[0]['end'],d['end']),alternativeGeometry=[r['width'],r['height']],classification='TWO_VALID_CONFLICTING_DECODINGS')
 elif pass_=='O99M':
  a=decoder_report('VFRAME.GRA');b=resource('VFRAME.GRA');suffix=[x for x in prior['VFRAME.GRA']['streams'] if x['graOffset']>=a[-1]['end']];s=[]
  for x in suffix:
   d=img(b,x['graOffset'],x['width'],x['height']);assert d['end']==x['encodedEndExclusive'];s.append([x['graOffset'],d['end'],d['pixelHash']])
  assert len(a)==10 and len(s)==12 and s[0][0]==a[-1]['end'] and s[-1][1]==len(b)
  data=dict(prefixCount=len(a),suffixCount=len(s),transition=a[-1]['end'],fullBytes=len(b),suffix=s,classification='FULL_BYTE_TILING_CANDIDATE_BUT_CONFLICTS_WITH_O69')
 elif pass_=='O99N':
  r=old['BATTLE.GRA'];b=resource('BATTLE.GRA');loc=0xa0c54+r['tableObject2Start'];first=e[loc:loc+20*8];second=e[loc+20*8:loc+40*8]
  a=decoder_report('BATTLE.GRA');assert len(a)==40
  data=dict(firstTableSha=H(first),secondTableSha=H(second),tablesByteEqual=first==second,imageCountPerTable=20,firstOffsets=[x['offset'] for x in a[:20]],secondOffsets=[x['offset'] for x in a[20:]],prefixEnd=a[19]['end'],classification='DUPLICATED_PREFIX_NOT_FORTY_INDEPENDENT_IMAGES')
 elif pass_ in ['O99O','O99P','O99Q','O99R','O99S','O99T','O99U']:
  nm=dict(O99O='BATTLE.GRA',O99P='PORTAL.GRA',O99Q='ARMORY.GRA',O99R='FOREST.GRA',O99S='TOMB.GRA',O99T='TOWER.GRA',O99U='ARENA.GRA')[pass_]
  data=dict(tails[nm],classification='QUALIFIED_PACKED_REFERENCE_STRIDED_RAW_REGION_NOT_INDEXED_SPRITE_GRAMMAR')
 elif pass_=='O99V':
  t=list(tails.values());assert sum(x['rows'] for x in t)==320 and sum(x['units7168'] for x in t)==40
  data=dict(slotCount=len(t),totalBytes=sum(x['suffixBytes'] for x in t),rowsOf896=sum(x['rows'] for x in t),units7168=sum(x['units7168'] for x in t),names=[x['name'] for x in t],hashes=[x['suffixSha256'] for x in t],classification='LOSSLESS_RAW_ROW_CENSUS_ONLY')
 elif pass_=='O99W':
  b=resource('FONTS.GRA');s=prior['FONTS.GRA']['streams'];s=sorted(s,key=lambda x:x['graOffset']);assert len(s)==172
  assert all(x['encodedEndExclusive']==y['graOffset'] for x,y in zip(s,s[1:]))
  data=dict(resourceBytes=len(b),prefixBytes=s[0]['graOffset'],suffixStart=s[0]['graOffset'],suffixEnd=s[-1]['encodedEndExclusive'],verifiedIndexedStreamCount=len(s),suffixSha256=H(b[s[0]['graOffset']:]),prefixSha256=H(b[:s[0]['graOffset']]),classification='INDEXED_SUFFIX_ONLY_PREFIX_UNQUALIFIED')
 elif pass_=='O99X':
  b=resource('PLAYSTA.GRA');s=sorted(prior['PLAYSTA.GRA']['streams'],key=lambda x:x['graOffset']);assert len(s)==91
  x,y=s[:2];assert x['graOffset']==0 and y['graOffset']==8 and x['encodedEndExclusive']==76
  data=dict(resourceBytes=len(b),witnessCount=len(s),firstWitness=[x['graOffset'],x['encodedEndExclusive'],x['width'],x['height']],secondWitness=[y['graOffset'],y['encodedEndExclusive'],y['width'],y['height']],overlapBytes=x['encodedEndExclusive']-y['graOffset'],firstSha256=H(b[:76]),classification='COMPETING_OVERLAPPING_STARTS')
 elif pass_ in ['O99Y','O99Z']:
  nm='PROBE.GRA' if pass_=='O99Y' else 'ACCLAIM.GRA';b=resource(nm);count=collections.Counter(b)
  data=dict(resource=nm,resourceBytes=len(b),sha256=H(b),distinctByteValues=len(count),zeroBytes=count[0],first64Hex=b[:64].hex(),chunk1024Sha256=[H(b[i:i+1024]) for i in range(0,len(b),1024)],classification='UNCLASSIFIED_FORMAT_NO_INDEXED_CLAIM')
 elif pass_=='O100A':
  b=resource('MONKS.GRA');assert len(b)%4==0;vals=[U(b,i) for i in range(0,len(b),4)];counts=collections.Counter(vals)
  data=dict(resourceBytes=len(b),sha256=H(b),dwordCount=len(vals),distinctDwords=len(counts),valueCounts=[[k,counts[k]] for k in sorted(counts)],first32Dwords=vals[:32],classification='DWORDED_DATA_UNKNOWN_SEMANTICS')
 elif pass_=='O100B':
  held=['PORTAL.GRA','ARMORY.GRA','FOREST.GRA','TOMB.GRA','TOWER.GRA','ARENA.GRA','VFRAME.GRA','BATTLE.GRA','CAVE.GRA','FONTS.GRA','PLAYSTA.GRA','PROBE.GRA','ACCLAIM.GRA','MONKS.GRA']
  data=dict(held=held,heldCount=len(held),qualifiedExactFull=110,totalGRA=124,verifiedNewPromotions=0,classification='RESEARCH_COVERAGE_UNCHANGED')
 elif pass_=='O100C':
  bounds=[(0x9e155,0x9e188),(0x659c6,0x65a20),(0xcfbac,0xcfbd0)];
  data=dict(executableSlices=[{'start':a,'end':z,'sha256':H(e[a:z]),'first16':e[a:a+16].hex()} for a,z in bounds],packedTable=[U(e,0xcfbac+i*4) for i in range(8)],verifiedPackedSlots=7,assertedStride=896,assertedInnerBytes=320,classification='EXISTING_O96A_CODE_PATH_RECHECK_NOT_RUNTIME_DISPLAY')
 assert data
 report=dict(passId=pass_,topic=topic,format='mk2_o99j_o100c_20pass_raw_mixed_gap_tests_v1',fixtureExeSha256=H(e),evidence=data,claims={'actualGameplaySceneObserved':False,'runtimePaletteOwnershipEstablished':False,'newExactFullResources':0,'timingInFramesEstablished':False})
 (out/f'mk2_{pass_.lower()}_{topic}_2026-10-09.json').write_text(json.dumps(report,indent=2)+'\n')
 print(f'{pass_} {topic} VERIFIED_SOURCE_PRODUCER')
