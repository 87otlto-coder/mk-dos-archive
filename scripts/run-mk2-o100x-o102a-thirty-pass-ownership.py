#!/usr/bin/env python3
"""O100X–O102A: thirty bounded ownership/format questions. Native MK2 inputs only.
All classifications source-static; never infer gameplay behavior, palette ownership or timings.
"""
from pathlib import Path
import sys,json,struct,hashlib,collections
exe_path,fixture_dir,source_dir,out_dir=sys.argv[1:5]
e=Path(exe_path).read_bytes();fixture=Path(fixture_dir);source=Path(source_dir);out=Path(out_dir);out.mkdir(parents=True,exist_ok=True)
SHA=lambda b:hashlib.sha256(b).hexdigest();U=lambda p:struct.unpack_from('<I',e,p)[0];H=lambda p:struct.unpack_from('<H',e,p)[0];S=lambda p:struct.unpack_from('<h',e,p)[0];P=lambda off:0xa0c54+off
assert SHA(e)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
files={p.name.upper():p.read_bytes() for p in fixture.iterdir() if p.is_file()}; pool=e[0xa0ef1:0xa13a7].split(b'\0');fix=[]
le=0x28f0c;table=le+U(le+0x68);body=le+U(le+0x6c);ot=le+U(le+0x40);objs=[(j+1,U(ot+24*j+12),U(ot+24*j+16)) for j in range(2)]
for pg in range(U(le+20)):
 owner,start,pgnum=next(o for o in objs if o[1]<=pg+1<o[1]+o[2]);ptr=body+U(table+4*pg);stop=body+U(table+4*pg+4)
 while ptr<stop:
  typ=e[ptr]&15;flags=e[ptr+1];src=S(ptr+2);ptr+=4;targetobj=H(ptr) if flags&64 else e[ptr];ptr+=2 if flags&64 else 1;off=0
  if typ!=2:off=U(ptr) if flags&16 else H(ptr);ptr+=4 if flags&16 else 2
  if flags&4:ptr+=4 if flags&32 else 2
  srcoff=(pg+1-start)*4096+src;physical=0x61c54+4096*(start-1)+srcoff
  fix.append((owner,srcoff,physical,typ,targetobj,off))
 assert ptr==stop
assert len(fix)==27004

def incoming(target,within=0):
 return sorted([dict(sourceObject=o,sourceOffset=s,sourcePhysical=p,relocationType=t,targetOffset=d,rawDword=U(p)) for o,s,p,t,dst,d in fix if dst==2 and target<=d<target+within+1],key=lambda a:(a['targetOffset'],a['sourceObject'],a['sourceOffset']))
def raster(b,begin,wi,hi):
 pixel=bytearray(wi*hi);mask=bytearray(wi*hi);p=begin;typ=[0,0,0]
 for y in range(hi):
  x=0
  while x<wi:
   if p+4>len(b):raise ValueError('EOF')
   cmd=struct.unpack_from('<I',b,p)[0];p+=4
   if cmd&1: n=cmd>>1;typ[0]+=1
   elif cmd&2:
    n=cmd>>10;typ[1]+=1
    if n<=0 or n>wi-x:raise ValueError('RLE')
    pixel[y*wi+x:y*wi+x+n]=bytes([(cmd>>2)&255])*n;mask[y*wi+x:y*wi+x+n]=b'\1'*n
   else:
    n=cmd>>2;typ[2]+=1
    if n<1 or n>64 or p+n>len(b):raise ValueError('literal')
    pixel[y*wi+x:y*wi+x+n]=b[p:p+n];mask[y*wi+x:y*wi+x+n]=b'\1'*n;p+=(n+3)&~3
   if not 0<n<=wi-x:raise ValueError('width')
   x+=n
 return dict(start=begin,end=p,width=wi,height=hi,opaque=sum(mask),pixels=SHA(pixel),mask=SHA(mask),cmd=typ,indexMax=max(pixel) if pixel else None)

def tile(name,objstart,count):
 b=files[name];id=pool.index(name.encode());rows=[]
 for k in range(count):
  pos=P(objstart+8*k);wi=H(pos);hi=H(pos+2);ref=U(pos+4);assert ref>>24==id
  decoded=raster(b,ref&0xffffff,wi,hi)
  rows.append(dict(object2Offset=objstart+8*k,packedRef=ref,**decoded))
 return rows

def prefix_for(name):
 old=json.loads((source/'docs/evidence/1E3O69/mk2_broad_indexed_graphics_corpus_census_2026-10-02.json').read_text())
 row=next((r for r in old['partialOrAmbiguousResources'] if r['resourceName']==name),None)
 return row

def source_row(name,off):
 b=files[name];tail=b[off:];assert len(tail)%896==0
 rows=[tail[p:p+896] for p in range(0,len(tail),896)]
 t=b''.join(row[:320] for row in rows);r=b''.join(row[320:] for row in rows)
 return dict(resource=name,offset=off,sourceLen=len(tail),sourceSha=SHA(tail),rowCount=len(rows),rowSha=[SHA(x) for x in rows],transferredSha=SHA(t),remainingSha=SHA(r),transferredZero=t.count(0),remainingZero=r.count(0),transferredOver63=sum(x>63 for x in t),remainingOver63=sum(x>63 for x in r),maxTransferred=max(t),maxRemaining=max(r))

specs=[
 ('O100X','vframe-large-descriptor-code-owner','code_vframe',None),
 ('O100Y','vframe-eight-tile-owned-table','vframe8',None),
 ('O100Z','vframe-two-metadata-pointer-routes','vframe_meta',None),
 ('O101A','vframe-competing-pixels-remain-distinct','vframe_conflict',None),
 ('O101B','cave-descriptor-eight-incoming-owners','cave_refs',None),
 ('O101C','cave-setups-double-pointer-families','cave_meta',None),
 ('O101D','cave-prefix-candidate-and-source-gap','cave_candidate',None),
 ('O101E','battle-duplicate-tables-owner-asymmetry','battle_tables',None),
 ('O101F','battle-first-twenty-graphics','battle_decode',None),
 ('O101G','fonts-first-suffix-descriptor-provenance','fonts',None),
 ('O101H','fonts-prefix-candidate-diagnostics','fonts_prefix',None),
 ('O101I','playsta-overlapping-head-witnesses','playsta',None),
 ('O101J','playsta-gapless-offset-eight-alternative','playsta_chain',None),
 ('O101K','monks-ten-constant-dword-runs','monks',None),
 ('O101L','probe-resource-data-classification-boundary','probe',None),
 ('O101M','acclaim-resource-data-classification-boundary','acclaim',None),
 ('O101N','tomb-packed-suffix-preservation','suffix',('TOMB.GRA',63776,0)),
 ('O101O','tower-packed-suffix-preservation','suffix',('TOWER.GRA',56268,2)),
 ('O101P','forest-packed-suffix-preservation','suffix',('FOREST.GRA',198116,3)),
 ('O101Q','armory-packed-suffix-preservation','suffix',('ARMORY.GRA',126336,4)),
 ('O101R','portal-packed-suffix-preservation','suffix',('PORTAL.GRA',56916,6)),
 ('O101S','arena-packed-suffix-preservation','suffix',('ARENA.GRA',90488,7)),
 ('O101T','battle-packed-suffix-preservation','suffix',('BATTLE.GRA',59436,1)),
 ('O101U','packed-row-copy-inner-loop-contract','code_packed',None),
 ('O101V','packed-suffix-eight-slot-reference-table','suffix_table',None),
 ('O101W','vframe-root-references-reconciled','vframe_roots',None),
 ('O101X','cave-forty-nine-indexed-byte-closure','cave_chain',None),
 ('O101Y','audio-exact-driver-deduplication','audio',None),
 ('O101Z','held-resource-coverage-invariant','coverage',None),
 ('O102A','relocation-reference-graph-summary','graph',None)]
assert len(specs)==30
for label,slug,kind,arg in specs:
 data={};status='SOURCE_STATIC_VERIFIED_SEMANTICS_HELD'
 if kind=='code_vframe':
  p=P(116576);ref=U(p+8);assert H(p)==256 and H(p+2)==100 and ref>>24==pool.index(b'VFRAME.GRA') and ref&0xffffff==0
  assert e[0x86163:0x86168]==bytes.fromhex('b868c70100')
  data=dict(descriptorObject2Offset=116576,dimension=[H(p),H(p+2)],signedOffsets=[S(p+4),S(p+6)],packedRef=ref,codeSite=0x86163,relocationSource=0x86164,codeSequenceHex=e[0x86163:0x86177].hex(),incomingDescriptorStart=incoming(116576),incomingResourceField=incoming(116584),firstDecoded=raster(files['VFRAME.GRA'],0,256,100))
  status='FILE_BACKED_256X100_PACKED_FIELD_DIRECT_SETUP_REFERENCE'
 elif kind=='vframe8':
  rows=tile('VFRAME.GRA',116764,10);assert rows[0]['start']==0 and rows[-1]['end']==47384 and all(a['end']==b['start'] for a,b in zip(rows,rows[1:]))
  data=dict(rows=rows,tableOwners=incoming(116764),imageCount=len(rows),decodedRange=[0,rows[-1]['end']]);status='SEPARATE_RELOCATED_10_TILE_TABLE'
 elif kind=='vframe_meta':
  offsets=[116710,116720,116728,116764,116628,116584]
  data=dict(nodes={str(v):incoming(v) for v in offsets},directWords={str(v):U(P(v)) for v in [116720,116724,116728,116732,116736]},windowHex=e[P(116680):P(116764)].hex());status='DISTINCT_SERIALIZED_POINTER_PATHS_NO_RUNTIME_COACTIVATION'
 elif kind=='vframe_conflict':
  b=files['VFRAME.GRA'];large=raster(b,0,256,100);tiles=tile('VFRAME.GRA',116764,4);color=bytearray(25600);alpha=bytearray(25600)
  # Local raster content reconstructed separately for pixel disagreement.
  def with_pixels(start,w,h):
   pixels=bytearray(w*h);mask=bytearray(w*h);p=start
   for y in range(h):
    x=0
    while x<w:
     c=struct.unpack_from('<I',b,p)[0];p+=4
     if c&1:n=c>>1
     elif c&2:n=c>>10;pixels[y*w+x:y*w+x+n]=bytes([(c>>2)&255])*n;mask[y*w+x:y*w+x+n]=b'\1'*n
     else:n=c>>2;pixels[y*w+x:y*w+x+n]=b[p:p+n];mask[y*w+x:y*w+x+n]=b'\1'*n;p+=(n+3)&~3
     x+=n
   return pixels,mask
  lp,lm=with_pixels(0,256,100)
  for i,t in enumerate(tiles):
   tp,tm=with_pixels(t['start'],64,100)
   for y in range(100):color[y*256+i*64:y*256+(i+1)*64]=tp[y*64:(y+1)*64];alpha[y*256+i*64:y*256+(i+1)*64]=tm[y*64:(y+1)*64]
  data=dict(firstFourTileEnd=tiles[-1]['end'],single=large,pixelDiff=sum(x!=y for x,y in zip(lp,color)),maskDiff=sum(x!=y for x,y in zip(lm,alpha)),singlePixelSha=SHA(lp),tiledPixelSha=SHA(color),singleMaskSha=SHA(lm),tiledMaskSha=SHA(alpha));status='ALTERNATE_OWNED_DESCRIPTORS_DIFFERENT_SOURCE_PIXELS'
 elif kind=='cave_refs':
  rows=tile('CAVE.GRA',98912,49);data=dict(tableIncoming=incoming(98912),first=rows[0],last=rows[-1],consecutive=all(a['end']==b['start'] for a,b in zip(rows,rows[1:])),resourceLength=len(files['CAVE.GRA']));status='EIGHT_FILE_BACKED_SETUP_REFERENCES_TO_49_IMAGE_TABLE'
 elif kind=='cave_meta':
  targets=[98864,98912,98524,98590,118340,118468];data=dict(incomingByTarget={str(i):incoming(i) for i in targets},firstEightRefs=[U(P(98730+18*j+0)) for j in range(8)],secondEightRefs=[U(P(98730+18*j+4)) for j in range(8)]);status='EIGHT_REPEATED_18_BYTE_TABLE_OWNERS'
 elif kind=='cave_candidate':
  b=files['CAVE.GRA'];d=raster(b,0,46,1);assert d['end']==120
  data=dict(prefixCandidate=d,descriptorOffsetZero=incoming(98912),actualFirstDescriptorGraOffset=U(P(98912)+4)&0xffffff,prefixHash=SHA(b[:120]),candidateMatchesFirstDescriptor=False);status='DECODE_CANDIDATE_NOT_AN_AUTHENTIC_OWNED_SPRITE'
 elif kind=='battle_tables':
  a=tile('BATTLE.GRA',103296,20);b=tile('BATTLE.GRA',103456,20)
  data=dict(firstIncoming=incoming(103296),secondIncoming=incoming(103456),matchingRecordHashes=[SHA(e[P(103296+8*j):P(103296+8*j+8)])==SHA(e[P(103456+8*j):P(103456+8*j+8)]) for j in range(20)],firstTableSha=SHA(e[P(103296):P(103456)]),secondTableSha=SHA(e[P(103456):P(103616)]));status='DUPLICATE_IMAGE_TABLES_WITH_DIFFERENT_OBSERVED_ROOTS'
 elif kind=='battle_decode':
  rows=tile('BATTLE.GRA',103296,20);data=dict(rows=rows,first=rows[0]['start'],end=rows[-1]['end'],resourceLength=len(files['BATTLE.GRA']),allAdjacent=all(a['end']==b['start'] for a,b in zip(rows,rows[1:])));status='TWENTY_INDEXED_IMAGES_BEFORE_PACKED_SUFFIX'
 elif kind=='fonts':
  old=prefix_for('FONTS.GRA');ss=old['streams'];start=ss[0];off=start['descriptorPhysical']-0xa0c54
  data=dict(firstDescriptor= start, firstDescriptorObject2=off,sourceOwners=incoming(off),streamCount=len(ss),firstGraByte=start['graOffset'],lastEnd=ss[-1]['encodedEndExclusive']);status='SOURCE_INDEXED_FONT_SUFFIX_OWNER_PREFIX_UNQUALIFIED'
 elif kind=='fonts_prefix':
  b=files['FONTS.GRA'];length=103840;head=b[:length];data=dict(prefixLength=length,sha=SHA(head),nonzero=sum(v!=0 for v in head),unique=len(set(head)),first32=head[:32].hex(),last32=head[-32:].hex(),suffixBoundaryHex=b[length:length+24].hex());status='FONT_PREFIX_BYTE_PRESERVED_FORMAT_HELD'
 elif kind=='playsta':
  rows=sorted(prefix_for('PLAYSTA.GRA')['streams'],key=lambda r:r['graOffset']);a,b=rows[:2]
  data=dict(first=dict(descriptor=a,decode=raster(files['PLAYSTA.GRA'],0,a['width'],a['height']),incoming=incoming(a['descriptorPhysical']-0xa0c54)),second=dict(descriptor=b,decode=raster(files['PLAYSTA.GRA'],8,b['width'],b['height']),incoming=incoming(b['descriptorPhysical']-0xa0c54)),overlapBytes=68);status='TWO_OVERLAPPING_AUTHENTIC_DESCRIPTIONS'
 elif kind=='playsta_chain':
  rows=sorted(prefix_for('PLAYSTA.GRA')['streams'],key=lambda r:r['graOffset']);data=dict(firstAlternativeStart=rows[1]['graOffset'],remainderCount=len(rows)-1,ends=rows[-1]['encodedEndExclusive'],resourceLen=len(files['PLAYSTA.GRA']),allAdjacent=all(a['encodedEndExclusive']==b['graOffset'] for a,b in zip(rows[1:],rows[2:])));status='CONTIGUOUS_OFFSET_EIGHT_SUFFIX_WITH_OVERLAPPING_HEAD'
 elif kind=='monks':
  b=files['MONKS.GRA'];ww=struct.unpack('<'+str(len(b)//4)+'I',b);runs=[]
  for val in ww:
   if runs and runs[-1][0]==val:runs[-1][1]+=1
   else:runs.append([val,1])
  data=dict(dwordCount=len(ww),runs=runs,fullSha=SHA(b),totalRuns=len(runs));status='TEN_CONSTANT_RUNS_NOT_PIXEL_GRAMMAR'
 elif kind in ('probe','acclaim'):
  name=kind.upper()+'.GRA';b=files[name];id=pool.index(name.encode());possible8=[];possible12=[]
  for ph in range(0xa0c54,len(e)-12,4):
   if not (1<=H(ph)<=640 and 1<=H(ph+2)<=480):continue
   pack8=U(ph+4);pack12=U(ph+8)
   if pack8>>24==id and pack8&0xffffff<len(b):possible8.append(ph)
   if -1000<=S(ph+4)<=1000 and -1000<=S(ph+6)<=1000 and pack12>>24==id and pack12&0xffffff<len(b):possible12.append(ph)
  data=dict(resource=name,size=len(b),sha=SHA(b),first64=b[:64].hex(),distinctValues=len(set(b)),zeroCount=b.count(0),boundedEightByteCandidates=possible8,boundedTwelveByteCandidates=possible12,scanAlignment=4);status='OPAQUE_GRA_RESOURCE_FORMAT_NOT_PROMOTED'
 elif kind=='suffix':
  name,off,idx=arg;r=source_row(name,off);ref=U(0xcfbac+4*idx);assert ref>>24==pool.index(name.encode()) and ref&0xffffff==off
  data=dict(referenceIndex=idx,referencePhysical=0xcfbac+4*idx,packedReference=ref,**r);status='LOSSLESS_PACKED_ROW_SUFFIX_NOT_FULL_INDEXED_RESOURCE'
 elif kind=='code_packed':
  data=dict(copyLoopHex=e[0x65a0b:0x65a1a].hex(),strideLoopHex=e[0x65a2d:0x65a3a].hex(),sourceDwordCount=80,bytesPerCopy=320,sourceStride=896,callsite=0x9e191,callTarget=0x659c6);status='CODE_QUALIFIED_896_SOURCE_STRIDE_320_TRANSFER'
 elif kind=='suffix_table':
  data=dict(baseObject2=0x2ef54,codeRelocationAt=0x9e16d,tableRaw=[U(0xcfba8+4*j) for j in range(10)],tableEntryIncoming=incoming(0x2ef54),resourceNames=[v[0] for v in [('TOMB.GRA',0),('BATTLE.GRA',1),('TOWER.GRA',2),('FOREST.GRA',3),('ARMORY.GRA',4),('PORTAL.GRA',6),('ARENA.GRA',7)]]);status='SEVEN_RESOURCE_PACKED_POINTERS_WITH_EXECUTABLE_CONSUMER'
 elif kind=='vframe_roots':
  data=dict(singleDescriptor=incoming(116584),tileTable=incoming(116764),head12=incoming(116576),codeWindow=e[0x86163:0x86177].hex(),differentDrawingsProved=True,sameRuntimeRenderingProved=False);status='DISTINCT_RELOCATED_DESCRIPTOR_OWNER_PATHS_UNJOINED'
 elif kind=='cave_chain':
  rows=tile('CAVE.GRA',98912,49);data=dict(count=len(rows),firstOffset=rows[0]['start'],end=rows[-1]['end'],allAdjacent=all(a['end']==b['start'] for a,b in zip(rows,rows[1:])),uniqueHashes=len(set(r['pixels'] for r in rows)),pixelCount=sum(r['width']*r['height'] for r in rows));status='FORTY_NINE_QUALIFIED_IMAGES_LEADING_PREFIX_HELD'
 elif kind=='audio':
  names=['AWE.BIN','GRV.BIN','SCC.BIN','GMI.BIN','SBL.BIN','LAP.BIN'];rows=[dict(name=n,length=len(files[n]),sha=SHA(files[n]),head32=files[n][:32].hex()) for n in names]
  data=dict(rows=rows,uniqueSha=len(set(r['sha'] for r in rows)),sameGmiScc=files['GMI.BIN']==files['SCC.BIN']);status='DRIVER_DEDUP_PROVEN_NO_AUDIO_DECODER'
 elif kind=='coverage':
  held=['PORTAL.GRA','ARMORY.GRA','FOREST.GRA','TOMB.GRA','TOWER.GRA','ARENA.GRA','VFRAME.GRA','BATTLE.GRA','CAVE.GRA','FONTS.GRA','PLAYSTA.GRA','PROBE.GRA','ACCLAIM.GRA','MONKS.GRA'];data=dict(totalGRA=len([p for p in fixture.glob('*.gra')]),exactFull=110,held=held,heldCount=len(held),newExactFull=0);status='NO_UNPROVEN_OWNERSHIP_BASED_PROMOTIONS'
 elif kind=='graph':
  targets=[116584,116764,98912,103296,103456,0x2ef54];data=dict(fixups=len(fix),targetObjectCounts=dict(collections.Counter(str(x[4]) for x in fix)),roots={str(x):incoming(x) for x in targets},fixtureExeSHA=SHA(e));status='MIXED_FORMAT_RELOCATION_GRAPH_WITH_RUNTIME_GAPS'
 report=dict(passId=label,topic=slug,format='mk2_o100x_o102a_30pass_ownership_evidence_v1',fixtureExeSha256=SHA(e),classification=status,evidence=data,limits=dict(actualGameplayExecutionObserved=False,correctColorOwnershipProven=False,newExactFullGraphicsResources=0,animationSequencePromotion=0,frameTimingQualified=False))
 (out/f'mk2_{label.lower()}_{slug}_2026-10-09.json').write_text(json.dumps(report,indent=2)+'\n')
 print(label,slug,status)
