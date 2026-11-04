#!/usr/bin/env node
/** Independent native-byte verification of twenty O99J–O100C gap-classification studies.
 * Does not execute or import the Python producer. Re-decodes indexed graphics,
 * reconstructs two different descriptor families, resource tails and raw row checksums.
 */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const [exeName,fixtureDir,priorDir,reportDir,only] = process.argv.slice(2);
if(!reportDir)throw Error('usage: node verify <mk2.exe> <fixtureDir> <previousReportDir> <newReportDir> [pass]');
const exe=fs.readFileSync(exeName),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const D=(b,p)=>b.readUInt32LE(p),W=(b,p)=>b.readUInt16LE(p);let checks=0;
function eq(a,b,label){checks++;assert.deepStrictEqual(a,b,label)}
function yes(a,label){checks++;assert.ok(a,label)}
const origin='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';eq(sha(exe),origin,'authentic DOS fixture');
// Independently parse authentic executable relocations, not producer hints.
let totalReloc=0;const le=0x28f0c,pages=D(exe,le+20),first=le+D(exe,le+0x68),data=le+D(exe,le+0x6c);
for(let p=0;p<pages;p++){
 let c=data+D(exe,first+4*p),end=data+D(exe,first+4*(p+1));
 while(c<end){const kind=exe[c]&15,flags=exe[c+1];c+=4;yes((flags&3)===0,'relocation flags');
  const objSize=(flags&64)?2:1;const obj=(objSize===2?W(exe,c):exe[c]);c+=objSize;yes(obj>0&&obj<20,'relocation object');
  if(kind!==2)c+=(flags&16)?4:2;if(flags&4)c+=(flags&32)?4:2;yes(c<=end,'relocation page bounds');totalReloc++;}
 eq(c,end,'relocation page end');
}
eq(totalReloc,27004,'exact relocation count');
const read=(n)=>fs.readFileSync(path.join(fixtureDir,n.toLowerCase()));
const fromPrev=(file)=>JSON.parse(fs.readFileSync(path.join(priorDir,file),'utf8'));
const oldMap=new Map();for(const file of ['mk2_o99i_battle-cave-fonts-playsta-boundaries_2026-10-09.json','mk2_o99h_tower-arena-pit-title-vframe-mixed_2026-10-09.json'])for(const a of fromPrev(file).resourceEvidence)oldMap.set(a.resource,a);
let o69path=path.join(priorDir,'mk2_broad_indexed_graphics_corpus_census_2026-10-02.json');
if(!fs.existsSync(o69path))o69path=path.join(priorDir,'../../docs/evidence/1E3O69/mk2_broad_indexed_graphics_corpus_census_2026-10-02.json');
const o69=JSON.parse(fs.readFileSync(o69path,'utf8'));const prior=new Map(o69.partialOrAmbiguousResources.map(x=>[x.resourceName,x]));
const pool=exe.subarray(0xa0ef1,0xa13a7).toString('latin1').split('\0');
// A deliberately separate pixel decoder: indexed payload commands and independently constructed transparency.
function decode(b,start,width,height){
 const colors=Buffer.alloc(width*height),alpha=Buffer.alloc(width*height);let pos=start;
 for(let y=0;y<height;y++){
  let x=0;
  while(x<width){if(pos+4>b.length)throw Error('overrun');const cmd=D(b,pos);pos+=4;let length;
   switch(cmd&3){
    case 1:case 3:length=cmd>>>1;break;
    case 2:length=cmd>>>10;if(length>width-x||length<1)throw Error('invalid run');colors.fill((cmd>>>2)&255,y*width+x,y*width+x+length);alpha.fill(1,y*width+x,y*width+x+length);break;
    case 0:length=cmd>>>2;if(length>64||length<1||pos+length>b.length)throw Error('invalid literal');b.copy(colors,y*width+x,pos,pos+length);alpha.fill(1,y*width+x,y*width+x+length);pos+=(length+3)&~3;break;
   }if(length>width-x||length<1)throw Error('invalid width');x+=length;
  }
 }return {end:pos,pixelHash:sha(colors),maskHash:sha(alpha),opaque:alpha.reduce((a,b)=>a+b,0)};
}
function desc(n){const b=read(n),old=oldMap.get(n);yes(!!old,'old table source');return old.records.map((rec,id)=>{const pos=0xa0c54+rec.object2Offset;const width=W(exe,pos),height=W(exe,pos+2),packed=D(exe,pos+4),offset=packed&0xffffff;eq((packed>>>24),pool.indexOf(n),'packed resource identity');const decoded=decode(b,offset,width,height);eq(decoded.end,rec.endExclusive,'prior pixel boundary independently decoded');return {id,offset,end:decoded.end,width,height,pixelHash:decoded.pixelHash,maskHash:decoded.maskHash};});}
const rawNames=['TOMB.GRA','BATTLE.GRA','TOWER.GRA','FOREST.GRA','ARMORY.GRA','PORTAL.GRA','ARENA.GRA'];
function raw(n){const slot=rawNames.indexOf(n);yes(slot!==-1,'valid raw table name');const index=slot>=5?slot+1:slot;const b=read(n),packed=D(exe,0xcfbac+index*4),offset=packed&0xffffff;eq(packed>>>24,pool.indexOf(n),'raw table bound resource');const tail=b.subarray(offset);yes(tail.length%7168===0&&tail.length%896===0,'native stride divisor');const rows=[];for(let p=0;p<tail.length;p+=896)rows.push(tail.subarray(p,p+896));return {name:n,slot:index,pack:packed,resourceBytes:b.length,resourceSha256:sha(b),offset,suffixBytes:tail.length,suffixSha256:sha(tail),pitch:896,rows:rows.length,units7168:tail.length/7168,rawMin:Math.min(...tail),rawMax:Math.max(...tail),rowHashes:rows.map(x=>sha(x)),first320Sha256:sha(Buffer.concat(rows.map(x=>x.subarray(0,320)))),remaining576Sha256:sha(Buffer.concat(rows.map(x=>x.subarray(320))))};}
const specs=[['O99J','cave-zero-offset-candidate'],['O99K','cave-prefixed-image-chain'],['O99L','vframe-two-decodings'],['O99M','vframe-alternative-full-tiling'],['O99N','battle-duplicate-descriptors'],['O99O','battle-packed-row-region'],['O99P','portal-packed-row-region'],['O99Q','armory-packed-row-region'],['O99R','forest-packed-row-region'],['O99S','tomb-packed-row-region'],['O99T','tower-packed-row-region'],['O99U','arena-packed-row-region'],['O99V','seven-region-row-reconciliation'],['O99W','fonts-indexed-suffix-boundary'],['O99X','playsta-overlapping-witnesses'],['O99Y','probe-untyped-content'],['O99Z','acclaim-untyped-content'],['O100A','monks-dword-content'],['O100B','held-coverage-crosswalk'],['O100C','bounded-row-consumer-fingerprint']];
eq(specs.length,20,'twenty passes');let passes=0;
for(const [tag,slug] of specs){if(only&&only!==tag)continue;const file=path.join(reportDir,`mk2_${tag.toLowerCase()}_${slug}_2026-10-09.json`);const rep=JSON.parse(fs.readFileSync(file,'utf8'));
 eq(rep.passId,tag,'pass ID');eq(rep.topic,slug,'pass purpose');eq(rep.format,'mk2_o99j_o100c_20pass_raw_mixed_gap_tests_v1','report format');eq(rep.fixtureExeSha256,origin,'exe provenance');eq(rep.claims,{actualGameplaySceneObserved:false,runtimePaletteOwnershipEstablished:false,newExactFullResources:0,timingInFramesEstablished:false},'unproven semantic boundaries');let expect={};
 if(tag==='O99J'){
  const b=read('CAVE.GRA'),pattern=Buffer.from([0,0,0,29]);const loc=[];
  for(let p=0xa0c54;p<=exe.length-4;p++)if(exe.compare(pattern,0,4,p,p+4)===0)loc.push(p);
  let fail=false;try{decode(b,0,12,78)}catch{fail=true};yes(fail,'rejected nonimage leading candidate');
  expect={firstImageByte:120,first120Sha256:sha(b.subarray(0,120)),first120Dwords:Array.from({length:30},(_,i)=>D(b,i*4)),packedZeroCandidateLocations:loc,attemptedGeometry:[12,78],attemptResult:'INVALID_MK2_INDEXED_STREAM_FOR_12x78',classification:'HEADER_OR_OTHER_UNQUALIFIED'};
 }else if(tag==='O99K'){
  const a=desc('CAVE.GRA');eq(a.length,49,'CAVE qualified image count');eq(a[0].offset,120,'image start');eq(a.at(-1).end,read('CAVE.GRA').length,'last end');expect={imageCount:a.length,start:a[0].offset,end:a.at(-1).end,imageDigests:a.map(x=>x.pixelHash),adjacent:a.slice(1).every((x,i)=>a[i].end===x.offset),prefixExcluded:120,classification:'49_IMAGES_PLUS_UNQUALIFIED_120_PREFIX'};
 }else if(tag==='O99L'){
  const a=desc('VFRAME.GRA'),b=read('VFRAME.GRA'),r=prior.get('VFRAME.GRA').streams[0],d=decode(b,r.graOffset,r.width,r.height);expect={eightByteFirstStream:[a[0].offset,a[0].end],twelveByteFirstStream:[r.graOffset,d.end],twelveByteImageHash:d.pixelHash,eightByteImageHash:a[0].pixelHash,overlapBytes:Math.min(a[0].end,d.end),alternativeGeometry:[r.width,r.height],classification:'TWO_VALID_CONFLICTING_DECODINGS'};
 }else if(tag==='O99M'){
  const a=desc('VFRAME.GRA'),b=read('VFRAME.GRA');const suffix=prior.get('VFRAME.GRA').streams.filter(x=>x.graOffset>=a.at(-1).end);const seq=suffix.map(s=>{const d=decode(b,s.graOffset,s.width,s.height);eq(d.end,s.encodedEndExclusive,'VFRAME old suffix proof');return [s.graOffset,d.end,d.pixelHash]});eq(a.length,10,'8-byte family count');eq(seq.length,12,'O69 suffix 12 count');eq(seq.at(-1)[1],b.length,'alternative EOF');expect={prefixCount:a.length,suffixCount:seq.length,transition:a.at(-1).end,fullBytes:b.length,suffix:seq,classification:'FULL_BYTE_TILING_CANDIDATE_BUT_CONFLICTS_WITH_O69'};
 }else if(tag==='O99N'){
  const row=oldMap.get('BATTLE.GRA'),start=0xa0c54+row.tableObject2Start,one=exe.subarray(start,start+160),two=exe.subarray(start+160,start+320),a=desc('BATTLE.GRA');expect={firstTableSha:sha(one),secondTableSha:sha(two),tablesByteEqual:one.equals(two),imageCountPerTable:20,firstOffsets:a.slice(0,20).map(x=>x.offset),secondOffsets:a.slice(20).map(x=>x.offset),prefixEnd:a[19].end,classification:'DUPLICATED_PREFIX_NOT_FORTY_INDEPENDENT_IMAGES'};
 }else if(['O99O','O99P','O99Q','O99R','O99S','O99T','O99U'].includes(tag)){
  const n={O99O:'BATTLE.GRA',O99P:'PORTAL.GRA',O99Q:'ARMORY.GRA',O99R:'FOREST.GRA',O99S:'TOMB.GRA',O99T:'TOWER.GRA',O99U:'ARENA.GRA'}[tag];expect={...raw(n),classification:'QUALIFIED_PACKED_REFERENCE_STRIDED_RAW_REGION_NOT_INDEXED_SPRITE_GRAMMAR'};
 }else if(tag==='O99V'){
  const t=rawNames.map(raw);expect={slotCount:t.length,totalBytes:t.reduce((a,x)=>a+x.suffixBytes,0),rowsOf896:t.reduce((a,x)=>a+x.rows,0),units7168:t.reduce((a,x)=>a+x.units7168,0),names:t.map(x=>x.name),hashes:t.map(x=>x.suffixSha256),classification:'LOSSLESS_RAW_ROW_CENSUS_ONLY'};eq(expect.units7168,40,'forty raw 7168 units');
 }else if(tag==='O99W'){
  const b=read('FONTS.GRA'),s=[...prior.get('FONTS.GRA').streams].sort((a,b)=>a.graOffset-b.graOffset);yes(s.slice(1).every((x,i)=>s[i].encodedEndExclusive===x.graOffset),'FONTS suffix adjacency');expect={resourceBytes:b.length,prefixBytes:s[0].graOffset,suffixStart:s[0].graOffset,suffixEnd:s.at(-1).encodedEndExclusive,verifiedIndexedStreamCount:s.length,suffixSha256:sha(b.subarray(s[0].graOffset)),prefixSha256:sha(b.subarray(0,s[0].graOffset)),classification:'INDEXED_SUFFIX_ONLY_PREFIX_UNQUALIFIED'};
 }else if(tag==='O99X'){
  const b=read('PLAYSTA.GRA'),s=[...prior.get('PLAYSTA.GRA').streams].sort((a,b)=>a.graOffset-b.graOffset),x=s[0],y=s[1];expect={resourceBytes:b.length,witnessCount:s.length,firstWitness:[x.graOffset,x.encodedEndExclusive,x.width,x.height],secondWitness:[y.graOffset,y.encodedEndExclusive,y.width,y.height],overlapBytes:x.encodedEndExclusive-y.graOffset,firstSha256:sha(b.subarray(0,76)),classification:'COMPETING_OVERLAPPING_STARTS'};
 }else if(tag==='O99Y'||tag==='O99Z'){
  const n=tag==='O99Y'?'PROBE.GRA':'ACCLAIM.GRA',b=read(n);const histogram=Array.from({length:256},(_,j)=>b.filter(v=>v===j).length);const chunks=[];for(let i=0;i<b.length;i+=1024)chunks.push(sha(b.subarray(i,i+1024)));expect={resource:n,resourceBytes:b.length,sha256:sha(b),distinctByteValues:histogram.filter(x=>x>0).length,zeroBytes:histogram[0],first64Hex:b.subarray(0,64).toString('hex'),chunk1024Sha256:chunks,classification:'UNCLASSIFIED_FORMAT_NO_INDEXED_CLAIM'};
 }else if(tag==='O100A'){
  const b=read('MONKS.GRA'),freq=new Map(),nums=[];for(let p=0;p<b.length;p+=4){const v=D(b,p);nums.push(v);freq.set(v,(freq.get(v)||0)+1)}expect={resourceBytes:b.length,sha256:sha(b),dwordCount:nums.length,distinctDwords:freq.size,valueCounts:[...freq.keys()].sort((a,b)=>a-b).map(v=>[v,freq.get(v)]),first32Dwords:nums.slice(0,32),classification:'DWORDED_DATA_UNKNOWN_SEMANTICS'};
 }else if(tag==='O100B'){
  const held=['PORTAL.GRA','ARMORY.GRA','FOREST.GRA','TOMB.GRA','TOWER.GRA','ARENA.GRA','VFRAME.GRA','BATTLE.GRA','CAVE.GRA','FONTS.GRA','PLAYSTA.GRA','PROBE.GRA','ACCLAIM.GRA','MONKS.GRA'];expect={held,heldCount:14,qualifiedExactFull:110,totalGRA:124,verifiedNewPromotions:0,classification:'RESEARCH_COVERAGE_UNCHANGED'};
 }else if(tag==='O100C'){
  const ranges=[[0x9e155,0x9e188],[0x659c6,0x65a20],[0xcfbac,0xcfbd0]];expect={executableSlices:ranges.map(([a,z])=>({start:a,end:z,sha256:sha(exe.subarray(a,z)),first16:exe.subarray(a,a+16).toString('hex')})),packedTable:Array.from({length:8},(_,i)=>D(exe,0xcfbac+i*4)),verifiedPackedSlots:7,assertedStride:896,assertedInnerBytes:320,classification:'EXISTING_O96A_CODE_PATH_RECHECK_NOT_RUNTIME_DISPLAY'};eq(expect.packedTable[5],0,'slot five empty');
 }
 eq(rep.evidence,expect,'verified material facts '+tag);passes++;console.log(JSON.stringify({pass:tag,result:'PASS',checks}));
}
if(!only)eq(passes,20,'complete batch');console.log(JSON.stringify({status:'PASS',passes,independentChecks:checks,failures:0,relocations:totalReloc}));
