#!/usr/bin/env python3
"""30 bounded MK2 source-native hypotheses; claims are code/file-backed, never observed runtime."""
import sys,struct,json,hashlib,collections
from pathlib import Path
exe_path,fixture_dir,src_dir,out_dir=sys.argv[1:5]
exe=Path(exe_path).read_bytes();game=Path(fixture_dir);src=Path(src_dir);out=Path(out_dir);out.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
U=lambda a:struct.unpack_from('<I',exe,a)[0];H=lambda a:struct.unpack_from('<H',exe,a)[0]
read=lambda s:(game/s.lower()).read_bytes()
files={p.name.upper():p.read_bytes() for p in game.iterdir() if p.is_file()}
list_mids=sorted((game/'sound').glob('*.mid'))
pool=exe[0xa0ef1:0xa13a7].split(b'\0')
suf=[('TOMB.GRA',0,63776),('BATTLE.GRA',1,59436),('TOWER.GRA',2,56268),('FOREST.GRA',3,198116),('ARMORY.GRA',4,126336),('PORTAL.GRA',6,56916),('ARENA.GRA',7,90488)]
rows={}
for name,slot,start in suf:
 b=files[name]; assert len(b[start:])%896==0
 x=[b[i:i+896] for i in range(start,len(b),896)]
 rows[name]=x
 assert (U(0xcfbac+4*slot)>>24)==pool.index(name.encode())
 assert (U(0xcfbac+4*slot)&0xffffff)==start

def file_tails():
 return [dict(name=n,slot=s,sourceOffset=p,bytes=len(files[n])-p,rows=len(rows[n]),sha256=sha(files[n][p:])) for n,s,p in suf]
def instr(start,end):return exe[start:end].hex()
def decode_prefix():
 b=files['CAVE.GRA']; p=0; pixel=bytearray(); alpha=bytearray(); w=46
 while len(pixel)<w:
  c=struct.unpack_from('<I',b,p)[0];p+=4
  if c&1:n=c>>1;pixel.extend(b'\0'*n);alpha.extend(b'\0'*n)
  elif c&2:n=c>>10;pixel.extend(bytes([(c>>2)&255])*n);alpha.extend(b'\1'*n)
  else:n=c>>2;pixel.extend(b[p:p+n]);alpha.extend(b'\1'*n);p+=(n+3)&~3
  assert 0<n<=w
 assert p==120 and len(pixel)==46
 return dict(width=46,height=1,end=p,opaque=sum(alpha),pixelSha256=sha(pixel),maskSha256=sha(alpha))

def mids():
 return [dict(name=p.name,bytes=p.stat().st_size,sha256=sha(p.read_bytes()),prefix=p.read_bytes()[:16].hex(),declaredWord=int.from_bytes(p.read_bytes()[1:3],'little'),declaredDelta=len(p.read_bytes())-int.from_bytes(p.read_bytes()[1:3],'little'),byte3=p.read_bytes()[3],mthd=p.read_bytes().startswith(b'MThd'),mtrkCount=p.read_bytes().count(b'MTrk')) for p in list_mids]

spec=[
('O102B','packed-eight-slot-authentic-table','slots'),('O102C','seven-exact-native-packed-ranges','ranges'),('O102D','packed-source-row-stride-coverage','strides'),('O102E','packed-dword-inner-loop-eighty','loop'),('O102F','packed-runtime-resource-id-lookup','lookup'),('O102G','packed-resource-offset-mask','mask'),('O102H','packed-row-source-pointer-step','rowstep'),('O102I','packed-accumulator-add-and-shift','accum'),('O102J','packed-output-frame-boundary','frame'),('O102K','packed-resource-sample-row-hashes','rowhash'),('O102L','packed-source-high-index-inventory','highindices'),('O102M','packed-extra-data-not-blank','remainder'),('O102N','packed-source-row-multiplicity','mult'),
('O102O','vframe-conditional-setup-gate','vfgate'),('O102P','vframe-large-source-operand','vfsource'),('O102Q','vframe-call-order-bounded','vfcalls'),('O102R','cave-eight-direct-table-roots','cave'),('O102S','cave-prefix-46x1-candidate','caveprefix'),('O102T','font-prefix-metadata-profile','fonts'),('O102U','playsta-overlapping-source-boundary','playsta'),('O102V','monks-integer-runs','monks'),
('O102W','sound-files-not-smf-header','mids'),('O102X','sound-lengthlike-word-pattern','midlength'),('O102Y','sound-lengthlike-residual-histogram','middelta'),('O102Z','sound-intro1-byte3-outlier','intro1'),('O103A','sound-file-content-hashes','midhashes'),('O103B','sound-midi-track-markers','midtracks'),('O103C','sound-driver-exact-dedup','drivers'),('O103D','held-resource-conservative-closure','held'),('O103E','combined-boundaries-and-claim-controls','closure')]
assert len(spec)==30
allmid=mids()
for passid,topic,typ in spec:
 ev={}
 if typ=='slots':ev={'physicalTable':0xcfba8,'rawDwords':[U(0xcfba8+i*4) for i in range(8)],'sevenResolved':file_tails(),'zeroSlots':[i for i in range(8) if U(0xcfbac+i*4)==0]}
 elif typ=='ranges':ev={'suffixes':file_tails(),'totalBytes':sum(z['bytes'] for z in file_tails()),'allEndAtEOF':True}
 elif typ=='strides':ev={'rowsByResource':{n:len(rows[n]) for n,_,_ in suf},'totalRows':sum(map(len,rows.values())),'stride':896,'transferredBytesPerRow':320,'remainingBytesPerRow':576}
 elif typ=='loop':ev={'entry':0x659c6,'loopStart':0x65a0f,'loopLimitInstruction':instr(0x65a0f,0x65a14),'copyInstructions':instr(0x65a14,0x65a1a),'dwordIterations':80,'bytesWrittenPerIteration':4,'outputBytesPerRow':320}
 elif typ=='lookup':ev={'resourceIdExtract':instr(0x659c9,0x659d8),'resourceTableLookup':instr(0x659d8,0x659df),'relocatedInput':U(0xcfbac),'tableAddress':0x2f434}
 elif typ=='mask':ev={'operand':instr(0x659df,0x659e7),'sourceOffsetMask':0xffffff,'sourceOffsetBits':24,'resourceIdBits':8}
 elif typ=='rowstep':ev={'rowAdvanceOpcode':instr(0x65a2d,0x65a33),'sourceStride':896,'rowEndRegisterSplice':instr(0x65a2a,0x65a38)}
 elif typ=='accum':ev={'instructionSpan':instr(0x65a1a,0x65a2d),'accumulatorGlobal':0x77477,'incrementGlobal':0x77473,'signedShift':16}
 elif typ=='frame':ev={'instructionSpan':instr(0x65a3d,0x65a51),'zeroFillInstruction':instr(0x65a4d,0x65a51),'frameEndOffset':64000,'hypothesis320x200Area':320*200}
 elif typ=='rowhash':ev={'perResource':{n:[sha(x) for x in rows[n][:2]]+[sha(rows[n][-1])] for n,_,_ in suf}}
 elif typ=='highindices':ev={'perResource':{n:dict(maxTransferred=max(bytes().join(x[:320] for x in rows[n])),maxRemaining=max(bytes().join(x[320:] for x in rows[n])),transferredOver63=sum(v>63 for x in rows[n] for v in x[:320])) for n,_,_ in suf}}
 elif typ=='remainder':ev={'perResource':{n:dict(remainingByteCount=len(rows[n])*576,remainingNonZero=sum(x!=0 for r in rows[n] for x in r[320:]),remainingSha256=sha(b''.join(r[320:] for r in rows[n]))) for n,_,_ in suf}}
 elif typ=='mult':ev={'totalRows':sum(map(len,rows.values())),'uniqueRows':len({sha(r) for rs in rows.values() for r in rs}),'unique320Prefixes':len({sha(r[:320]) for rs in rows.values() for r in rs}),'unique576Remainders':len({sha(r[320:]) for rs in rows.values() for r in rs})}
 elif typ=='vfgate':ev={'bytes':instr(0x86109,0x8611c),'branchDestination':0x86296,'comparisonLiteral':2}
 elif typ=='vfsource':ev={'bytes':instr(0x86163,0x8616d),'sourcePhysical':0x86164,'object2Offset':0x1c768,'descriptorPhysical':0xa0c54+0x1c760,'descriptorBytes':instr(0xa0c54+0x1c760,0xa0c54+0x1c76c)}
 elif typ=='vfcalls':ev={'bytes':instr(0x86159,0x86177),'setup':0x81eb2,'producer':0x81bb3,'next':0x862a1}
 elif typ=='cave':
  t=json.loads((src/'evidence/mk2_o100x_o102a/mk2_o101b_cave-descriptor-eight-incoming-owners_2026-10-09.json').read_text())
  ev={'tableObj2Offset':98912,'directOwnerSourcePhysical':[x['sourcePhysical'] for x in t['evidence']['tableIncoming']],'tableResourceCount':49,'prefixPreserved':120}
 elif typ=='caveprefix':ev={'decodedCandidate':decode_prefix(),'prefixSha256':sha(files['CAVE.GRA'][:120]),'authenticatedOwned':False}
 elif typ=='fonts':ev={'resourceLength':len(files['FONTS.GRA']),'prefixLength':103840,'prefixSha256':sha(files['FONTS.GRA'][:103840]),'prefixFirst32Hex':files['FONTS.GRA'][:32].hex(),'prefixDwordSamples':[struct.unpack_from('<I',files['FONTS.GRA'],i*4)[0] for i in range(12)]}
 elif typ=='playsta':ev={'sourceLength':len(files['PLAYSTA.GRA']),'firstEight':files['PLAYSTA.GRA'][:8].hex(),'overlapRange':[8,76],'conflictingByteCount':68}
 elif typ=='monks':
  b=files['MONKS.GRA'];run=[]
  for i in range(0,len(b),4):
   x=struct.unpack_from('<I',b,i)[0]
   if run and run[-1][0]==x:run[-1][1]+=1
   else:run.append([x,1])
  ev={'fileBytes':len(b),'dwords':len(b)//4,'runs':run,'wholeSha256':sha(b)}
 elif typ=='mids':ev={'count':len(allmid),'nonSMF':sum(not m['mthd'] for m in allmid),'startsWith01':sum(m['prefix'].startswith('01') for m in allmid),'fileNames':[m['name'] for m in allmid]}
 elif typ=='midlength':ev={'perFile':[[m['name'],m['declaredWord'],m['bytes'],m['declaredDelta']] for m in allmid],'allDeltasPositive':all(m['declaredDelta']>0 for m in allmid)}
 elif typ=='middelta':ev={'deltaHistogram':dict(sorted(collections.Counter(m['declaredDelta'] for m in allmid).items())),'minimumDelta':min(m['declaredDelta'] for m in allmid),'maximumDelta':max(m['declaredDelta'] for m in allmid),'oddDeltas':all(m['declaredDelta']%2==1 for m in allmid)}
 elif typ=='intro1':ev={'introByte3':next(m['byte3'] for m in allmid if m['name']=='intro1.mid'),'otherByte3Set':sorted({m['byte3'] for m in allmid if m['name']!='intro1.mid'}),'introFirst16':next(m['prefix'] for m in allmid if m['name']=='intro1.mid'),'headerInterpretationUnverified':True}
 elif typ=='midhashes':ev={'files':[[m['name'],m['bytes'],m['sha256']] for m in allmid],'distinctHashes':len({m['sha256'] for m in allmid})}
 elif typ=='midtracks':ev={'perFile':[[m['name'],m['mtrkCount'],m['mthd']] for m in allmid],'noStandardMThd':all(not m['mthd'] for m in allmid)}
 elif typ=='drivers':
  names=['AWE.BIN','GRV.BIN','SCC.BIN','GMI.BIN','SBL.BIN','LAP.BIN'];ev={'drivers':{n:dict(length=len(files[n]),sha256=sha(files[n])) for n in names},'gmiEqualsScc':files['GMI.BIN']==files['SCC.BIN']}
 elif typ=='held':ev={'exactFull':110,'totalGRA':124,'held':14,'promotionsThisBatch':0,'heldResourceNames':['PORTAL.GRA','ARMORY.GRA','FOREST.GRA','TOMB.GRA','TOWER.GRA','ARENA.GRA','VFRAME.GRA','BATTLE.GRA','CAVE.GRA','FONTS.GRA','PLAYSTA.GRA','PROBE.GRA','ACCLAIM.GRA','MONKS.GRA']}
 elif typ=='closure':ev={'packedRows':sum(map(len,rows.values())),'packedBytes':sum(z['bytes'] for z in file_tails()),'audioFiles':len(allmid),'exactFullIndexed':110,'noRuntimeRenderClaim':True,'noMidiSMFFormatClaim':True,'noNewPaletteOwnershipClaim':True}
 report={'format':'mk2_o102b_o103e_native_30pass_v1','passId':passid,'topic':topic,'exeSha256':sha(exe),'classification':'SOURCE_NATIVE_BOUNDED_EVIDENCE','hypotheses':{'completeGameplayRender':False,'provedMIDMusicSemantics':False,'newExactFullGRA':False},'evidence':ev}
 p=out/f'mk2_{passid.lower()}_{topic}_2026-10-09.json';p.write_text(json.dumps(report,indent=2)+'\n');print(passid,typ,p.stat().st_size)
