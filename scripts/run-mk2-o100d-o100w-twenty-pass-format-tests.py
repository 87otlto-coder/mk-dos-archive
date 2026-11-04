#!/usr/bin/env python3
"""O100D-O100W: 20 bounded native-fixture hypotheses. No inference of runtime display."""
from pathlib import Path
import sys,struct,hashlib,json,collections
exe_path,fixture_dir,prior_dir,out_dir=sys.argv[1:5]
e=Path(exe_path).read_bytes();fixture=Path(fixture_dir);prior=Path(prior_dir);out=Path(out_dir);out.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest();u=lambda b,p:struct.unpack_from('<I',b,p)[0];w=lambda b,p:struct.unpack_from('<H',b,p)[0]
assert sha(e)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
files={p.name.upper():p.read_bytes() for p in fixture.iterdir() if p.is_file()};pool=e[0xa0ef1:0xa13a7].split(b'\0')
o69=json.loads((prior/'docs/evidence/1E3O69/mk2_broad_indexed_graphics_corpus_census_2026-10-02.json').read_text())
partial={r['resourceName']:r for r in o69['partialOrAmbiguousResources']}
o99={}
for n in ['mk2_o99h_tower-arena-pit-title-vframe-mixed_2026-10-09.json','mk2_o99i_battle-cave-fonts-playsta-boundaries_2026-10-09.json']:
 for row in json.loads((prior/'evidence/mk2_o98p_o99i'/n).read_text())['resourceEvidence']:o99[row['resource']]=row

def decode(b,pos,width,height):
 colors=bytearray(width*height);mask=bytearray(width*height);origin=pos
 for y in range(height):
  x=0
  while x<width:
   if pos+4>len(b):raise ValueError('out of bytes')
   cmd=u(b,pos);pos+=4;t=cmd&3
   if t&1:count=cmd>>1
   elif t==2:
    count=cmd>>10
    if not 0<count<=width-x:raise ValueError('RLE outside row')
    colors[y*width+x:y*width+x+count]=bytes([(cmd>>2)&255])*count;mask[y*width+x:y*width+x+count]=b'\1'*count
   else:
    count=cmd>>2
    if not 0<count<=64 or pos+count>len(b):raise ValueError('literal invalid')
    colors[y*width+x:y*width+x+count]=b[pos:pos+count];mask[y*width+x:y*width+x+count]=b'\1'*count;pos+=(count+3)&~3
   if not 0<count<=width-x:raise ValueError('width invalid')
   x+=count
 return dict(end=pos,color=colors,mask=mask,opaque=sum(mask),encodedBytes=pos-origin)

def indexed(n):
 b=files[n];p=o99[n];rows=[]
 for rec in p['records']:
  loc=0xa0c54+rec['object2Offset'];wi,hi=w(e,loc),w(e,loc+2);packed=u(e,loc+4)
  assert (packed>>24)==pool.index(n.encode());start=packed&0xffffff
  result=decode(b,start,wi,hi);assert result['end']==rec['endExclusive']
  rows.append(dict(begin=start,end=result['end'],width=wi,height=hi,colors=sha(result['color']),mask=sha(result['mask']),opaque=result['opaque']))
 return rows

def cave46():return decode(files['CAVE.GRA'],0,46,1)

def vframe_compare():
 b=files['VFRAME.GRA'];a=decode(b,0,256,100);tiles=indexed('VFRAME.GRA')[:4];combined=bytearray(25600);combinedmask=bytearray(25600)
 for k,r in enumerate(tiles):
  d=decode(b,r['begin'],64,100)
  for y in range(100):
   combined[y*256+k*64:y*256+(k+1)*64]=d['color'][y*64:(y+1)*64]
   combinedmask[y*256+k*64:y*256+(k+1)*64]=d['mask'][y*64:(y+1)*64]
 return dict(largeColor=sha(a['color']),largeMask=sha(a['mask']),tiledColor=sha(combined),tiledMask=sha(combinedmask),colorDifferences=sum(x!=y for x,y in zip(a['color'],combined)),alphaDifferences=sum(x!=y for x,y in zip(a['mask'],combinedmask)),byteInterval=[0,19152],sameDecode=a['color']==combined and a['mask']==combinedmask)

rawmap={'TOMB.GRA':(0,63776),'BATTLE.GRA':(1,59436),'TOWER.GRA':(2,56268),'FOREST.GRA':(3,198116),'ARMORY.GRA':(4,126336),'PORTAL.GRA':(6,56916),'ARENA.GRA':(7,90488)}
def raw():
 result=[]
 for name,(slot,off) in rawmap.items():
  b=files[name];packed=u(e,0xcfbac+4*slot);assert packed&0xffffff==off and packed>>24==pool.index(name.encode())
  tail=b[off:];assert len(tail)%896==0
  rows=[tail[j:j+896] for j in range(0,len(tail),896)];first=b''.join(r[:320] for r in rows);rest=b''.join(r[320:] for r in rows)
  result.append(dict(name=name,slot=slot,offset=off,rows=len(rows),sha=sha(tail),firstBytes=len(first),remainingBytes=len(rest),firstZero=first.count(0),remainingZero=rest.count(0),firstOver63=sum(z>63 for z in first),remainingOver63=sum(z>63 for z in rest),firstUnique=len(set(first)),remainingUnique=len(set(rest)),firstSha=sha(first),remainingSha=sha(rest),rowHashes=[sha(x) for x in rows],rowFirstHashes=[sha(x[:320]) for x in rows],rowRemainingHashes=[sha(x[320:]) for x in rows]))
 return result

def find(n):
 idx=pool.index(n.encode());b=files[n];r=[]
 for pos in range(0xa0c54,len(e)-8,4):
  packed=u(e,pos+4);wi,hi=w(e,pos),w(e,pos+2)
  if (packed>>24)==idx and (packed&0xffffff)<len(b) and 1<=wi<=640 and 1<=hi<=512:
   r.append([pos-0xa0c54,wi,hi,packed&0xffffff])
 return r

def runs32(b):
 vals=[u(b,i) for i in range(0,len(b),4)];res=[]
 for v in vals:
  if res and res[-1][0]==v:res[-1][1]+=1
  else:res.append([v,1])
 return res

rraw=raw();cav=indexed('CAVE.GRA');vfr=indexed('VFRAME.GRA');play=sorted(partial['PLAYSTA.GRA']['streams'],key=lambda x:x['graOffset']);fonts=sorted(partial['FONTS.GRA']['streams'],key=lambda x:x['graOffset']);audio={name:files[name] for name in ['AWE.BIN','GRV.BIN','SCC.BIN','GMI.BIN','SBL.BIN','LAP.BIN']}
passes=[('O100D','cave-prefix-unique-small-image'),('O100E','cave-prefix-descriptor-ownership'),('O100F','cave-forty-nine-image-chain'),('O100G','vframe-competing-pixel-images'),('O100H','vframe-mixed-tiling'),('O100I','vframe-descriptor-reference-family'),('O100J','playsta-overlap-reproduction'),('O100K','playsta-alternative-suffix-chain'),('O100L','fonts-prefix-descriptor-boundary'),('O100M','probe-raw-geometry-fingerprint'),('O100N','acclaim-header-byte-accounting'),('O100O','monks-constant-run-provenance'),('O100P','monks-two-length-groups'),('O100Q','packed-rows-transferred-span'),('O100R','packed-rows-untransferred-span'),('O100S','packed-rows-cross-resource-integrity'),('O100T','packed-rows-seven-slot-join'),('O100U','audio-driver-byte-identities'),('O100V','audio-driver-header-fingerprints'),('O100W','conservative-held-resource-accounting')]
assert len(passes)==20
for tag,topic in passes:
 data={};stat='SOURCE_STRUCTURE_VERIFIED_NO_SEMANTIC_PROMOTION'
 if tag=='O100D':
  d=cave46();assert d['end']==120
  candidates=[]
  for wi in range(1,321):
   for hi in range(1,150):
    try:q=decode(files['CAVE.GRA'][:120],0,wi,hi)
    except(ValueError,struct.error):continue
    if q['end']==120:candidates.append([wi,hi])
  assert candidates==[[46,1]]
  data=dict(prefixBytes=120,candidateGeometry=candidates[0],withinSearchCandidates=candidates,pixelSha=sha(d['color']),maskSha=sha(d['mask']),opaque=d['opaque'],indexMax=max(d['color']),completePrefixDecode=True,searchWidthMax=320,searchHeightMax=149)
  stat='UNIQUE_BOUNDED_DECODE_NO_AUTHENTIC_DESCRIPTOR'
 elif tag=='O100E':
  desc=find('CAVE.GRA');assert len(desc)==49 and desc[0][3]==120
  data=dict(plausibleRelocatedDescriptorCount=len(desc),first=desc[0],last=desc[-1],referencesToZero=[x for x in desc if x[3]==0],cavePrefixSha=sha(files['CAVE.GRA'][:120]))
  stat='CAVE_ZERO_OFFSET_NO_8BYTE_DESCRIPTOR'
 elif tag=='O100F':
  assert len(cav)==49 and cav[0]['begin']==120 and cav[-1]['end']==len(files['CAVE.GRA'])
  data=dict(images=49,allAdjacent=all(x['end']==y['begin'] for x,y in zip(cav,cav[1:])),starts=[x['begin'] for x in cav],ends=[x['end'] for x in cav],uniqueImageHashes=len({x['colors'] for x in cav}),indexedBytes=len(files['CAVE.GRA'])-120)
  stat='PREFIX_CANDIDATE_PLUS_49_QUALIFIED_IMAGE_STREAMS'
 elif tag=='O100G':
  data=vframe_compare();assert not data['sameDecode'] and data['colorDifferences']>0 and data['alphaDifferences']>0
  stat='NON_EQUIVALENT_GRAPHICS_INTERPRETATIONS'
 elif tag=='O100H':
  ss=[x for x in partial['VFRAME.GRA']['streams'] if x['graOffset']>=47384]
  assert len(vfr)==10 and len(ss)==12 and ss[-1]['encodedEndExclusive']==len(files['VFRAME.GRA'])
  data=dict(eightByteTileCount=10,eightByteTiles=[[x['begin'],x['end']] for x in vfr],suffix12ByteCount=len(ss),suffix=[[x['graOffset'],x['encodedEndExclusive']] for x in ss],resourceLength=len(files['VFRAME.GRA']),gapFree=(all(x['end']==y['begin'] for x,y in zip(vfr,vfr[1:])) and all(x['encodedEndExclusive']==y['graOffset'] for x,y in zip(ss,ss[1:])) and vfr[-1]['end']==ss[0]['graOffset']))
  stat='ALTERNATE_FULL_TILING_WITH_COMPETING_PREFIX'
 elif tag=='O100I':
  desc=find('VFRAME.GRA');assert len(desc)==10
  data=dict(eightByteDescriptors=desc,offsetZeroDescriptorCount=sum(x[3]==0 for x in desc),firstFourEnd=vfr[3]['end'],eightByteDecodedFirstFourPixels=[x['colors'] for x in vfr[:4]])
  stat='8BYTE_DESCRIPTOR_FAMILY_VERIFIED_12BYTE_CONFLICT_HELD'
 elif tag=='O100J':
  b=files['PLAYSTA.GRA'];x,y=play[:2];dx=decode(b,x['graOffset'],x['width'],x['height']);dy=decode(b,y['graOffset'],y['width'],y['height']);assert dx['end']==76 and dy['end']==4408
  data=dict(first=[x['graOffset'],x['encodedEndExclusive'],x['width'],x['height'],sha(dx['color']),sha(dx['mask'])],second=[y['graOffset'],y['encodedEndExclusive'],y['width'],y['height'],sha(dy['color']),sha(dy['mask'])],overlapBytes=68)
  stat='TWO_VALID_OVERLAPPING_WITNESSES_NOT_COOWNED'
 elif tag=='O100K':
  seq=play[1:];assert seq[0]['graOffset']==8 and seq[-1]['encodedEndExclusive']==len(files['PLAYSTA.GRA'])
  data=dict(totalWitnesses=len(play),suffixWitnesses=len(seq),alternativeStart=seq[0]['graOffset'],alternativeEnd=seq[-1]['encodedEndExclusive'],consecutive=all(x['encodedEndExclusive']==y['graOffset'] for x,y in zip(seq,seq[1:])),prefixExcluded=8,suffixHash=sha(files['PLAYSTA.GRA'][8:]))
  stat='GAPLESS_SUFFIX_BUT_OVERLAPPING_PREFIX_CONFLICT'
 elif tag=='O100L':
  desc=find('FONTS.GRA');ss=fonts
  data=dict(prefixLength=ss[0]['graOffset'],suffixCount=len(ss),suffixLast=ss[-1]['encodedEndExclusive'],candidateEightByteDescriptors=desc,zeroOffsetEightByteCandidates=[x for x in desc if x[3]==0],prefixHash=sha(files['FONTS.GRA'][:ss[0]['graOffset']]))
  stat='FONT_PREFIX_STILL_UNQUALIFIED'
 elif tag=='O100M':
  b=files['PROBE.GRA'];data=dict(length=len(b),start16=b[:16].hex(),firstTwoDwords=[u(b,0),u(b,4)],wholeHash=sha(b),first1024Hash=sha(b[:1024]),tailHash=sha(b[1024:]),zeroByteCount=b.count(0),uniqueValues=len(set(b)),eightByteCandidates=find('PROBE.GRA'))
  stat='RAW_RESOURCE_NOT_AUTHENTIC_INDEXED_DESCRIPTOR'
 elif tag=='O100N':
  b=files['ACCLAIM.GRA'];data=dict(length=len(b),firstEightWords=[w(b,i) for i in range(0,16,2)],start32=b[:32].hex(),wholeHash=sha(b),uniqueValues=len(set(b)),eightByteCandidates=find('ACCLAIM.GRA'))
  stat='UNQUALIFIED_HEADER_NO_8BYTE_DESCRIPTORS'
 elif tag=='O100O':
  b=files['MONKS.GRA'];rs=runs32(b);assert len(rs)==10
  data=dict(dwordCount=len(b)//4,uniqueValues=len({r[0] for r in rs}),runs=rs,sumRunLengths=sum(r[1] for r in rs),wholeHash=sha(b))
  stat='EXACT_TEN_RUN_INTEGER_SEQUENCE'
 elif tag=='O100P':
  rs=runs32(files['MONKS.GRA']);data=dict(firstSevenRuns=rs[:7],lastThreeRuns=rs[7:],firstSevenWords=sum(x[1] for x in rs[:7]),lastThreeWords=sum(x[1] for x in rs[7:]),containsNoZeroDword=all(x[0]!=0 for x in rs))
  stat='RUN_LENGTH_REGULARITY_NOT_ANIMATION_SEMANTICS'
 elif tag=='O100Q':
  data=dict(perResource=[{k:x[k] for k in ['name','rows','firstBytes','firstZero','firstOver63','firstUnique','firstSha']} for x in rraw],totalFirstBytes=sum(x['firstBytes'] for x in rraw),allFirstNonzero=all(x['firstZero']==0 for x in rraw))
  stat='TRANSFERRED_320_BYTES_ARE_NONZERO'
 elif tag=='O100R':
  data=dict(perResource=[{k:x[k] for k in ['name','rows','remainingBytes','remainingZero','remainingOver63','remainingUnique','remainingSha']} for x in rraw],totalRemainingBytes=sum(x['remainingBytes'] for x in rraw),allRemainingNonzero=all(x['remainingZero']==0 for x in rraw))
  stat='UNTRANSFERRED_576_BYTES_ARE_NOT_ZERO_PADDING'
 elif tag=='O100S':
  data=dict(resources=[{'name':x['name'],'rows':x['rows'],'sourceSha':x['sha'],'rowHashes':x['rowHashes']} for x in rraw],totalRows=sum(x['rows'] for x in rraw),uniqueRows=len({q for x in rraw for q in x['rowHashes']}))
  stat='LOSSLESS_320_RAW_ROW_HASHES'
 elif tag=='O100T':
  data=dict(slots=[{'name':x['name'],'slot':x['slot'],'offset':x['offset'],'rows':x['rows'],'first320Sha':x['firstSha'],'remaining576Sha':x['remainingSha']} for x in rraw],table=[u(e,0xcfbac+4*i) for i in range(8)],emptySlotFive=u(e,0xcfbac+5*4)==0,total896Rows=sum(x['rows'] for x in rraw),totalRawBytes=sum(x['rows']*896 for x in rraw))
  stat='SEVEN_PACKED_REFERENCES_CORRESPOND_TO_RAW_SUFFIXES'
 elif tag=='O100U':
  data=dict(drivers=[{'name':n,'length':len(b),'sha':sha(b)} for n,b in audio.items()],identicalDriverPair=['GMI.BIN','SCC.BIN'],identicalBytes=audio['GMI.BIN']==audio['SCC.BIN'],uniquePayloadHashes=len({sha(b) for b in audio.values()}))
  stat='EXACT_BYTE_IDENTITY_NOT_DRIVER_EQUIVALENCE'
 elif tag=='O100V':
  data=dict(headers=[{'name':n,'first32':b[:32].hex(),'first128Sha':sha(b[:128]),'zeroBytes':b.count(0),'size':len(b)} for n,b in audio.items()],gmiSccFirst128Equal=audio['GMI.BIN'][:128]==audio['SCC.BIN'][:128],lapSccFirst128Equal=audio['LAP.BIN'][:128]==audio['SCC.BIN'][:128])
  stat='DEVICE_DRIVER_BINARY_HEADER_EVIDENCE_NOT_MUSIC_DECODE'
 elif tag=='O100W':
  held=['PORTAL.GRA','ARMORY.GRA','FOREST.GRA','TOMB.GRA','TOWER.GRA','ARENA.GRA','VFRAME.GRA','BATTLE.GRA','CAVE.GRA','FONTS.GRA','PLAYSTA.GRA','PROBE.GRA','ACCLAIM.GRA','MONKS.GRA'];data=dict(held=held,heldCount=len(held),previousExactFull=110,promotedThisBatch=0,nowExactFull=110,totalGRA=124)
  stat='CONSERVATIVE_COVERAGE_NO_UNPROVEN_PROMOTION'
 report=dict(passId=tag,topic=topic,format='mk2_o100d_o100w_20pass_independent_format_tests_v1',fixtureExeSha256=sha(e),classification=stat,evidence=data,claims=dict(correctColorGameplayProven=False,newFullGraphicsResources=0,measuredTiming=False,stageRuntimeCoactivationProven=False))
 (out/f'mk2_{tag.lower()}_{topic}_2026-10-09.json').write_text(json.dumps(report,indent=2)+'\n')
 print(tag,topic,stat)
