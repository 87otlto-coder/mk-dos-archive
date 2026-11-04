#!/usr/bin/env node
/** Independent Node verifier. Reads authentic native resources, does not import Python producer. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const [exePath,fixtureDir,sourceDir,reportsDir,only]=process.argv.slice(2);
if(!reportsDir)throw Error('args: exe fixture source reports [onlyPass]');
const exe=fs.readFileSync(exePath), sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const U=(b,p)=>b.readUInt32LE(p),S=(b,p)=>b.readUInt16LE(p),read=n=>fs.readFileSync(path.join(fixtureDir,n.toLowerCase()));let checks=0;function eq(a,b,t){checks++;assert.deepStrictEqual(a,b,t)}function yes(a,t){checks++;assert.ok(a,t)}
const fixedHash='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';eq(sha(exe),fixedHash,'authentic executable');
// Reparse LE relocation pages, separate from all research producers.
const le=0x28f0c,table=le+U(exe,le+0x68),body=le+U(exe,le+0x6c),pages=U(exe,le+20);let relocations=0;
for(let page=0;page<pages;page++){
 let p=body+U(exe,table+page*4),end=body+U(exe,table+(page+1)*4);
 while(p<end){let type=exe[p]&15,flags=exe[p+1];p+=4;yes((flags&3)===0,'LE relocation flags');let wide=!!(flags&64),target=wide?S(exe,p):exe[p];p+=wide?2:1;yes(target>0&&target<20,'relocation target');if(type!==2)p+=(flags&16)?4:2;if(flags&4)p+=(flags&32)?4:2;yes(p<=end,'LE boundary');relocations++}
 eq(p,end,'relocation page boundary');
}
eq(relocations,27004,'fixture relocation count');
const pool=exe.subarray(0xa0ef1,0xa13a7).toString('latin1').split('\0');
const loadFile=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const priorRows=new Map();for(const file of ['mk2_o99h_tower-arena-pit-title-vframe-mixed_2026-10-09.json','mk2_o99i_battle-cave-fonts-playsta-boundaries_2026-10-09.json'])for(const x of loadFile(path.join(sourceDir,'evidence/mk2_o98p_o99i',file)).resourceEvidence)priorRows.set(x.resource,x);
const o69=loadFile(path.join(sourceDir,'docs/evidence/1E3O69/mk2_broad_indexed_graphics_corpus_census_2026-10-02.json'));
const old=new Map(o69.partialOrAmbiguousResources.map(x=>[x.resourceName,x]));
function raster(data,ptr,w,h){
 const pixels=Buffer.alloc(w*h),alpha=Buffer.alloc(w*h),initial=ptr;
 for(let row=0;row<h;row++)for(let col=0;col<w;){
  if(ptr+4>data.length)throw Error('command beyond EOF');let c=U(data,ptr);ptr+=4;let n=0;
  if(c&1)n=c>>>1;
  else if(c&2){n=c>>>10;if(!n||n>w-col)throw Error('rle bad');pixels.fill((c>>>2)&255,row*w+col,row*w+col+n);alpha.fill(1,row*w+col,row*w+col+n)}
  else{n=c>>>2;if(n>64||n===0||ptr+n>data.length)throw Error('literal bad');data.copy(pixels,row*w+col,ptr,ptr+n);alpha.fill(1,row*w+col,row*w+col+n);ptr+=(n+3)&~3}
  if(n<1||n>w-col)throw Error('row bad');col+=n;
 }
 return {end:ptr,colors:pixels,mask:alpha,opaque:alpha.reduce((a,b)=>a+b,0),length:ptr-initial};
}
function desc(resource){
 const resourceBytes=read(resource),prior=priorRows.get(resource);yes(!!prior,'prior resource evidence');return prior.records.map(r=>{
 const p=0xa0c54+r.object2Offset,x=S(exe,p),y=S(exe,p+2),packed=U(exe,p+4),offset=packed&0xffffff;
 eq(packed>>>24,pool.indexOf(resource),'resource binding '+resource);let result=raster(resourceBytes,offset,x,y);eq(result.end,r.endExclusive,'decoded boundary');return {begin:offset,end:result.end,width:x,height:y,colors:sha(result.colors),mask:sha(result.mask),opaque:result.opaque};
 });
}
function tableCandidates(resource){
 const bytes=read(resource),id=pool.indexOf(resource),a=[];
 for(let p=0xa0c54;p+8<exe.length;p+=4){let packed=U(exe,p+4),x=S(exe,p),y=S(exe,p+2);if((packed>>>24)===id&&(packed&0xffffff)<bytes.length&&x>=1&&x<=640&&y>=1&&y<=512)a.push([p-0xa0c54,x,y,packed&0xffffff]);}
 return a;
}
const cave=desc('CAVE.GRA'),vf=desc('VFRAME.GRA'),ps=[...old.get('PLAYSTA.GRA').streams].sort((a,b)=>a.graOffset-b.graOffset),fonts=[...old.get('FONTS.GRA').streams].sort((a,b)=>a.graOffset-b.graOffset);
const tailSpecs=[['TOMB.GRA',0,63776],['BATTLE.GRA',1,59436],['TOWER.GRA',2,56268],['FOREST.GRA',3,198116],['ARMORY.GRA',4,126336],['PORTAL.GRA',6,56916],['ARENA.GRA',7,90488]];
const tails=tailSpecs.map(([name,slot,start])=>{
 const binary=read(name),word=U(exe,0xcfbac+4*slot);eq(word>>>24,pool.indexOf(name),'tail resource pool');eq(word&0xffffff,start,'tail physical offset');
 const bytes=binary.subarray(start);yes(bytes.length%896===0,'row stride');const rows=[];for(let p=0;p<bytes.length;p+=896)rows.push(bytes.subarray(p,p+896));
 const first=Buffer.concat(rows.map(r=>r.subarray(0,320))),last=Buffer.concat(rows.map(r=>r.subarray(320)));
 return {name,slot,offset:start,rows:rows.length,sha:sha(bytes),firstBytes:first.length,remainingBytes:last.length,firstZero:first.reduce((s,x)=>s+(x===0),0),remainingZero:last.reduce((s,x)=>s+(x===0),0),firstOver63:first.reduce((s,x)=>s+(x>63),0),remainingOver63:last.reduce((s,x)=>s+(x>63),0),firstUnique:new Set(first).size,remainingUnique:new Set(last).size,firstSha:sha(first),remainingSha:sha(last),rowHashes:rows.map(sha),rowFirstHashes:rows.map(r=>sha(r.subarray(0,320))),rowRemainingHashes:rows.map(r=>sha(r.subarray(320))) };
});
const drivers=['AWE.BIN','GRV.BIN','SCC.BIN','GMI.BIN','SBL.BIN','LAP.BIN'].map(name=>({name,b:read(name)}));
const passes=[['O100D','cave-prefix-unique-small-image'],['O100E','cave-prefix-descriptor-ownership'],['O100F','cave-forty-nine-image-chain'],['O100G','vframe-competing-pixel-images'],['O100H','vframe-mixed-tiling'],['O100I','vframe-descriptor-reference-family'],['O100J','playsta-overlap-reproduction'],['O100K','playsta-alternative-suffix-chain'],['O100L','fonts-prefix-descriptor-boundary'],['O100M','probe-raw-geometry-fingerprint'],['O100N','acclaim-header-byte-accounting'],['O100O','monks-constant-run-provenance'],['O100P','monks-two-length-groups'],['O100Q','packed-rows-transferred-span'],['O100R','packed-rows-untransferred-span'],['O100S','packed-rows-cross-resource-integrity'],['O100T','packed-rows-seven-slot-join'],['O100U','audio-driver-byte-identities'],['O100V','audio-driver-header-fingerprints'],['O100W','conservative-held-resource-accounting']];
eq(passes.length,20,'pass count');let matched=0;
for(let [id,slug] of passes){if(only && id!==only)continue;
 const report=loadFile(path.join(reportsDir,`mk2_${id.toLowerCase()}_${slug}_2026-10-09.json`));
 eq(report.passId,id,'pass ID');eq(report.topic,slug,'topic');eq(report.format,'mk2_o100d_o100w_20pass_independent_format_tests_v1','format');eq(report.fixtureExeSha256,fixedHash,'source hash');
 eq(report.claims,{correctColorGameplayProven:false,newFullGraphicsResources:0,measuredTiming:false,stageRuntimeCoactivationProven:false},'no unsupported runtime claims');let expected,classification;
 switch(id){
 case 'O100D':{
  const bytes=read('CAVE.GRA'),result=raster(bytes,0,46,1);eq(result.end,120,'prefix endpoint');const candidates=[];
  for(let x=1;x<=320;x++)for(let y=1;y<150;y++){
   try{if(raster(bytes.subarray(0,120),0,x,y).end===120)candidates.push([x,y])}catch{}
  }
  eq(candidates,[[46,1]],'finite alternate decoder search');
  expected={prefixBytes:120,candidateGeometry:[46,1],withinSearchCandidates:candidates,pixelSha:sha(result.colors),maskSha:sha(result.mask),opaque:result.opaque,indexMax:Math.max(...result.colors),completePrefixDecode:true,searchWidthMax:320,searchHeightMax:149};classification='UNIQUE_BOUNDED_DECODE_NO_AUTHENTIC_DESCRIPTOR';break;
 }
 case 'O100E':{
  let r=tableCandidates('CAVE.GRA');eq(r.length,49,'existing Cave descriptor count');expected={plausibleRelocatedDescriptorCount:r.length,first:r[0],last:r.at(-1),referencesToZero:r.filter(x=>x[3]===0),cavePrefixSha:sha(read('CAVE.GRA').subarray(0,120))};classification='CAVE_ZERO_OFFSET_NO_8BYTE_DESCRIPTOR';break;
 }
 case 'O100F':expected={images:cave.length,allAdjacent:cave.slice(1).every((x,i)=>cave[i].end===x.begin),starts:cave.map(x=>x.begin),ends:cave.map(x=>x.end),uniqueImageHashes:new Set(cave.map(x=>x.colors)).size,indexedBytes:read('CAVE.GRA').length-120};classification='PREFIX_CANDIDATE_PLUS_49_QUALIFIED_IMAGE_STREAMS';break;
 case 'O100G':{
  let b=read('VFRAME.GRA'),large=raster(b,0,256,100),colors=Buffer.alloc(25600),mask=Buffer.alloc(25600);
  for(let i=0;i<4;i++){const tile=raster(b,vf[i].begin,64,100);for(let y=0;y<100;y++){
   tile.colors.copy(colors,y*256+i*64,y*64,(y+1)*64);tile.mask.copy(mask,y*256+i*64,y*64,(y+1)*64);
  }}
  let dif=0,mdif=0;for(let i=0;i<25600;i++){dif+=(colors[i]!==large.colors[i]);mdif+=(mask[i]!==large.mask[i])}
  expected={largeColor:sha(large.colors),largeMask:sha(large.mask),tiledColor:sha(colors),tiledMask:sha(mask),colorDifferences:dif,alphaDifferences:mdif,byteInterval:[0,19152],sameDecode:large.colors.equals(colors)&&large.mask.equals(mask)};
  yes(dif>0&&mdif>0,'reject graphical equivalence');classification='NON_EQUIVALENT_GRAPHICS_INTERPRETATIONS';break;
 }
 case 'O100H':{
  const s=old.get('VFRAME.GRA').streams.filter(x=>x.graOffset>=47384);
  expected={eightByteTileCount:vf.length,eightByteTiles:vf.map(x=>[x.begin,x.end]),suffix12ByteCount:s.length,suffix:s.map(x=>[x.graOffset,x.encodedEndExclusive]),resourceLength:read('VFRAME.GRA').length,gapFree:vf.slice(1).every((x,i)=>vf[i].end===x.begin)&&s.slice(1).every((x,i)=>s[i].encodedEndExclusive===x.graOffset)&&vf.at(-1).end===s[0].graOffset};classification='ALTERNATE_FULL_TILING_WITH_COMPETING_PREFIX';break;
 }
 case 'O100I':{
  let r=tableCandidates('VFRAME.GRA');expected={eightByteDescriptors:r,offsetZeroDescriptorCount:r.filter(x=>x[3]===0).length,firstFourEnd:vf[3].end,eightByteDecodedFirstFourPixels:vf.slice(0,4).map(x=>x.colors)};classification='8BYTE_DESCRIPTOR_FAMILY_VERIFIED_12BYTE_CONFLICT_HELD';break;
 }
 case 'O100J':{
  const b=read('PLAYSTA.GRA'),a=ps[0],x=ps[1],u=raster(b,a.graOffset,a.width,a.height),v=raster(b,x.graOffset,x.width,x.height);
  expected={first:[a.graOffset,a.encodedEndExclusive,a.width,a.height,sha(u.colors),sha(u.mask)],second:[x.graOffset,x.encodedEndExclusive,x.width,x.height,sha(v.colors),sha(v.mask)],overlapBytes:68};classification='TWO_VALID_OVERLAPPING_WITNESSES_NOT_COOWNED';break;
 }
 case 'O100K':{
  let s=ps.slice(1);expected={totalWitnesses:ps.length,suffixWitnesses:s.length,alternativeStart:s[0].graOffset,alternativeEnd:s.at(-1).encodedEndExclusive,consecutive:s.slice(1).every((x,i)=>s[i].encodedEndExclusive===x.graOffset),prefixExcluded:8,suffixHash:sha(read('PLAYSTA.GRA').subarray(8))};classification='GAPLESS_SUFFIX_BUT_OVERLAPPING_PREFIX_CONFLICT';break;
 }
 case 'O100L':{
  let s=fonts,begin=s[0].graOffset,r=tableCandidates('FONTS.GRA');expected={prefixLength:begin,suffixCount:s.length,suffixLast:s.at(-1).encodedEndExclusive,candidateEightByteDescriptors:r,zeroOffsetEightByteCandidates:r.filter(x=>x[3]===0),prefixHash:sha(read('FONTS.GRA').subarray(0,begin))};classification='FONT_PREFIX_STILL_UNQUALIFIED';break;
 }
 case 'O100M':{
  let b=read('PROBE.GRA');expected={length:b.length,start16:b.subarray(0,16).toString('hex'),firstTwoDwords:[U(b,0),U(b,4)],wholeHash:sha(b),first1024Hash:sha(b.subarray(0,1024)),tailHash:sha(b.subarray(1024)),zeroByteCount:b.reduce((s,v)=>s+(v===0),0),uniqueValues:new Set(b).size,eightByteCandidates:tableCandidates('PROBE.GRA')};classification='RAW_RESOURCE_NOT_AUTHENTIC_INDEXED_DESCRIPTOR';break;
 }
 case 'O100N':{
  let b=read('ACCLAIM.GRA');expected={length:b.length,firstEightWords:Array.from({length:8},(_,i)=>S(b,i*2)),start32:b.subarray(0,32).toString('hex'),wholeHash:sha(b),uniqueValues:new Set(b).size,eightByteCandidates:tableCandidates('ACCLAIM.GRA')};classification='UNQUALIFIED_HEADER_NO_8BYTE_DESCRIPTORS';break;
 }
 case 'O100O':case 'O100P':{
  const b=read('MONKS.GRA'),rs=[];for(let p=0;p<b.length;p+=4){let n=U(b,p);if(rs.length&&rs.at(-1)[0]===n)rs.at(-1)[1]++;else rs.push([n,1]);}
  eq(rs.length,10,'Monks ten runs');
  if(id==='O100O'){expected={dwordCount:b.length/4,uniqueValues:new Set(rs.map(x=>x[0])).size,runs:rs,sumRunLengths:rs.reduce((a,x)=>a+x[1],0),wholeHash:sha(b)};classification='EXACT_TEN_RUN_INTEGER_SEQUENCE';}
  else{expected={firstSevenRuns:rs.slice(0,7),lastThreeRuns:rs.slice(7),firstSevenWords:rs.slice(0,7).reduce((a,x)=>a+x[1],0),lastThreeWords:rs.slice(7).reduce((a,x)=>a+x[1],0),containsNoZeroDword:rs.every(x=>x[0]!==0)};classification='RUN_LENGTH_REGULARITY_NOT_ANIMATION_SEMANTICS';}
  break;
 }
 case 'O100Q':expected={perResource:tails.map(x=>Object.fromEntries(['name','rows','firstBytes','firstZero','firstOver63','firstUnique','firstSha'].map(k=>[k,x[k]]))),totalFirstBytes:tails.reduce((s,x)=>s+x.firstBytes,0),allFirstNonzero:tails.every(x=>x.firstZero===0)};classification='TRANSFERRED_320_BYTES_ARE_NONZERO';break;
 case 'O100R':expected={perResource:tails.map(x=>Object.fromEntries(['name','rows','remainingBytes','remainingZero','remainingOver63','remainingUnique','remainingSha'].map(k=>[k,x[k]]))),totalRemainingBytes:tails.reduce((s,x)=>s+x.remainingBytes,0),allRemainingNonzero:tails.every(x=>x.remainingZero===0)};classification='UNTRANSFERRED_576_BYTES_ARE_NOT_ZERO_PADDING';break;
 case 'O100S':expected={resources:tails.map(x=>({name:x.name,rows:x.rows,sourceSha:x.sha,rowHashes:x.rowHashes})),totalRows:tails.reduce((s,x)=>s+x.rows,0),uniqueRows:new Set(tails.flatMap(x=>x.rowHashes)).size};classification='LOSSLESS_320_RAW_ROW_HASHES';break;
 case 'O100T':expected={slots:tails.map(x=>({name:x.name,slot:x.slot,offset:x.offset,rows:x.rows,first320Sha:x.firstSha,remaining576Sha:x.remainingSha})),table:Array.from({length:8},(_,i)=>U(exe,0xcfbac+4*i)),emptySlotFive:U(exe,0xcfbac+20)===0,total896Rows:tails.reduce((s,x)=>s+x.rows,0),totalRawBytes:tails.reduce((s,x)=>s+x.rows*896,0)};classification='SEVEN_PACKED_REFERENCES_CORRESPOND_TO_RAW_SUFFIXES';break;
 case 'O100U':expected={drivers:drivers.map(({name,b})=>({name,length:b.length,sha:sha(b)})),identicalDriverPair:['GMI.BIN','SCC.BIN'],identicalBytes:read('GMI.BIN').equals(read('SCC.BIN')),uniquePayloadHashes:new Set(drivers.map(x=>sha(x.b))).size};classification='EXACT_BYTE_IDENTITY_NOT_DRIVER_EQUIVALENCE';break;
 case 'O100V':expected={headers:drivers.map(({name,b})=>({name,first32:b.subarray(0,32).toString('hex'),first128Sha:sha(b.subarray(0,128)),zeroBytes:b.reduce((s,v)=>s+(v===0),0),size:b.length})),gmiSccFirst128Equal:read('GMI.BIN').subarray(0,128).equals(read('SCC.BIN').subarray(0,128)),lapSccFirst128Equal:read('LAP.BIN').subarray(0,128).equals(read('SCC.BIN').subarray(0,128))};classification='DEVICE_DRIVER_BINARY_HEADER_EVIDENCE_NOT_MUSIC_DECODE';break;
 case 'O100W':expected={held:['PORTAL.GRA','ARMORY.GRA','FOREST.GRA','TOMB.GRA','TOWER.GRA','ARENA.GRA','VFRAME.GRA','BATTLE.GRA','CAVE.GRA','FONTS.GRA','PLAYSTA.GRA','PROBE.GRA','ACCLAIM.GRA','MONKS.GRA'],heldCount:14,previousExactFull:110,promotedThisBatch:0,nowExactFull:110,totalGRA:124};classification='CONSERVATIVE_COVERAGE_NO_UNPROVEN_PROMOTION';break;
 }
 eq(report.classification,classification,'bounded classification');eq(report.evidence,expected,'independently recomputed source evidence '+id);matched++;console.log(JSON.stringify({pass:id,status:'PASS'}));
}
if(!only)eq(matched,20,'all twenty verified');else eq(matched,1,'selected report');
console.log(JSON.stringify({status:'PASS',passes:matched,independentChecks:checks,relocations,failures:0}));
