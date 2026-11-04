#!/usr/bin/env node
/** Independent O100X–O102A verifier: native EXE bytes, LE relocations, decoded pixels, raw resource rows.
 * No Python producer code or calculations imported. No runtime/semantic claims promoted.
 */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const [exePath,fixturePath,sourcePath,evidencePath,only]=process.argv.slice(2);
if(!evidencePath)throw Error('args: <exe> <fixture> <source> <reports> [pass]');
const exe=fs.readFileSync(exePath),S=crypto.createHash,hash=b=>S('sha256').update(b).digest('hex');
const U=p=>exe.readUInt32LE(p),H=p=>exe.readUInt16LE(p),I=p=>exe.readInt16LE(p),O=p=>p+0xa0c54;
const file=n=>fs.readFileSync(path.join(fixturePath,n.toLowerCase()));
const canonical='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
let checks=0;function check(bool,what){checks++;assert.ok(bool,what)}function eq(a,b,what){checks++;assert.deepStrictEqual(a,b,what)}
eq(hash(exe),canonical,'authentic exe hash');
const pool=exe.subarray(0xa0ef1,0xa13a7).toString('latin1').split('\0');
// Completely separate LE relocation reconstruction with signed source and object-page mapping.
const le=0x28f0c,ft=le+U(le+0x68),fr=le+U(le+0x6c),ot=le+U(le+0x40),count=U(le+20);
const objs=[0,1].map(k=>({object:k+1,start:U(ot+k*24+12),pages:U(ot+k*24+16)}));
const relations=[];
for(let page=0;page<count;page++){
 const owner=objs.find(x=>page+1>=x.start&&page+1<x.start+x.pages);check(!!owner,'object page owner');
 let p=fr+U(ft+page*4),end=fr+U(ft+page*4+4);
 while(p<end){const typ=exe[p]&15,fl=exe[p+1],src=I(p+2);p+=4;check((fl&3)===0,'unsupported relocation flags');
 const dest=(fl&64)?H(p):exe[p];p+=(fl&64)?2:1;let at=0;
 if(typ!==2){at=(fl&16)?U(p):H(p);p+=(fl&16)?4:2}
 if(fl&4)p+=(fl&32)?4:2;
 let srcOff=(page+1-owner.start)*4096+src,physical=0x61c54+(owner.start-1)*4096+srcOff;
 check(physical>=0&&physical<exe.length,'fixup source start file-backed; a terminal 4-byte extent is not assumed');
 relations.push({sourceObject:owner.object,sourceOffset:srcOff,sourcePhysical:physical,relocationType:typ,dest,targetOffset:at,rawDword:physical+4<=exe.length?U(physical):null});
 }eq(p,end,'relocation page aligned');
}
eq(relations.length,27004,'full relocation count');
function refs(target){return relations.filter(r=>r.dest===2&&r.targetOffset===target).map(({dest,...x})=>x).sort((a,b)=>a.targetOffset-b.targetOffset||a.sourceObject-b.sourceObject||a.sourceOffset-b.sourceOffset)}
function raster(data,origin,width,height,content=false){
 const px=Buffer.alloc(width*height),alpha=Buffer.alloc(width*height),types=[0,0,0];let offset=origin;
 for(let row=0;row<height;row++)for(let x=0;x<width;){
  check(offset+4<=data.length,'data header in stream');const c=data.readUInt32LE(offset);offset+=4;let n;
  if(c%2){n=Math.floor(c/2);types[0]++}
  else if(c&2){n=c>>>10;types[1]++;check(n>0&&n<=width-x,'rle geometry');px.fill((c>>>2)&255,row*width+x,row*width+x+n);alpha.fill(1,row*width+x,row*width+x+n)}
  else{n=c>>>2;types[2]++;check(n>0&&n<=64&&offset+n<=data.length,'literal geometry');data.copy(px,row*width+x,offset,offset+n);alpha.fill(1,row*width+x,row*width+x+n);offset+=Math.ceil(n/4)*4}
  check(n>0&&n<=width-x,'exact row width');x+=n;
 }
 return {summary:{start:origin,end:offset,width,height,opaque:alpha.reduce((s,x)=>s+x,0),pixels:hash(px),mask:hash(alpha),cmd:types,indexMax:Math.max(...px)},pixel:px,alpha};
}
function decoded8(name,start,n){const b=file(name),id=pool.indexOf(name),rows=[];
 for(let j=0;j<n;j++){const at=O(start+8*j),width=H(at),height=H(at+2),ref=U(at+4);eq(ref>>>24,id,'resource ordinal');
 const d=raster(b,ref&0xffffff,width,height);
 rows.push({object2Offset:start+j*8,packedRef:ref,...d.summary});
 }return rows}
function oldPartial(name){const o69=JSON.parse(fs.readFileSync(path.join(sourcePath,'docs/evidence/1E3O69/mk2_broad_indexed_graphics_corpus_census_2026-10-02.json')));return o69.partialOrAmbiguousResources.find(r=>r.resourceName===name)}
function validateRows(rows,name,offset,n){eq(rows,decoded8(name,offset,n),'all descriptors and decoded pixel/mask hashes');}
function packedRow(name,offset){const b=file(name),tail=b.subarray(offset);check(tail.length%896===0,'896-byte alignment');const rows=[];for(let j=0;j<tail.length;j+=896)rows.push(tail.subarray(j,j+896));const copied=Buffer.concat(rows.map(x=>x.subarray(0,320))),other=Buffer.concat(rows.map(x=>x.subarray(320)));return {resource:name,offset,sourceLen:tail.length,sourceSha:hash(tail),rowCount:rows.length,rowSha:rows.map(hash),transferredSha:hash(copied),remainingSha:hash(other),transferredZero:copied.reduce((s,x)=>s+(x===0),0),remainingZero:other.reduce((s,x)=>s+(x===0),0),transferredOver63:copied.reduce((s,x)=>s+(x>63),0),remainingOver63:other.reduce((s,x)=>s+(x>63),0),maxTransferred:Math.max(...copied),maxRemaining:Math.max(...other)}}
const tasks=[
 ['O100X','vframe-large-descriptor-code-owner','FILE_BACKED_256X100_PACKED_FIELD_DIRECT_SETUP_REFERENCE'],
 ['O100Y','vframe-eight-tile-owned-table','SEPARATE_RELOCATED_10_TILE_TABLE'],
 ['O100Z','vframe-two-metadata-pointer-routes','DISTINCT_SERIALIZED_POINTER_PATHS_NO_RUNTIME_COACTIVATION'],
 ['O101A','vframe-competing-pixels-remain-distinct','ALTERNATE_OWNED_DESCRIPTORS_DIFFERENT_SOURCE_PIXELS'],
 ['O101B','cave-descriptor-eight-incoming-owners','EIGHT_FILE_BACKED_SETUP_REFERENCES_TO_49_IMAGE_TABLE'],
 ['O101C','cave-setups-double-pointer-families','EIGHT_REPEATED_18_BYTE_TABLE_OWNERS'],
 ['O101D','cave-prefix-candidate-and-source-gap','DECODE_CANDIDATE_NOT_AN_AUTHENTIC_OWNED_SPRITE'],
 ['O101E','battle-duplicate-tables-owner-asymmetry','DUPLICATE_IMAGE_TABLES_WITH_DIFFERENT_OBSERVED_ROOTS'],
 ['O101F','battle-first-twenty-graphics','TWENTY_INDEXED_IMAGES_BEFORE_PACKED_SUFFIX'],
 ['O101G','fonts-first-suffix-descriptor-provenance','SOURCE_INDEXED_FONT_SUFFIX_OWNER_PREFIX_UNQUALIFIED'],
 ['O101H','fonts-prefix-candidate-diagnostics','FONT_PREFIX_BYTE_PRESERVED_FORMAT_HELD'],
 ['O101I','playsta-overlapping-head-witnesses','TWO_OVERLAPPING_AUTHENTIC_DESCRIPTIONS'],
 ['O101J','playsta-gapless-offset-eight-alternative','CONTIGUOUS_OFFSET_EIGHT_SUFFIX_WITH_OVERLAPPING_HEAD'],
 ['O101K','monks-ten-constant-dword-runs','TEN_CONSTANT_RUNS_NOT_PIXEL_GRAMMAR'],
 ['O101L','probe-resource-data-classification-boundary','OPAQUE_GRA_RESOURCE_FORMAT_NOT_PROMOTED'],
 ['O101M','acclaim-resource-data-classification-boundary','OPAQUE_GRA_RESOURCE_FORMAT_NOT_PROMOTED'],
 ['O101N','tomb-packed-suffix-preservation','LOSSLESS_PACKED_ROW_SUFFIX_NOT_FULL_INDEXED_RESOURCE'],
 ['O101O','tower-packed-suffix-preservation','LOSSLESS_PACKED_ROW_SUFFIX_NOT_FULL_INDEXED_RESOURCE'],
 ['O101P','forest-packed-suffix-preservation','LOSSLESS_PACKED_ROW_SUFFIX_NOT_FULL_INDEXED_RESOURCE'],
 ['O101Q','armory-packed-suffix-preservation','LOSSLESS_PACKED_ROW_SUFFIX_NOT_FULL_INDEXED_RESOURCE'],
 ['O101R','portal-packed-suffix-preservation','LOSSLESS_PACKED_ROW_SUFFIX_NOT_FULL_INDEXED_RESOURCE'],
 ['O101S','arena-packed-suffix-preservation','LOSSLESS_PACKED_ROW_SUFFIX_NOT_FULL_INDEXED_RESOURCE'],
 ['O101T','battle-packed-suffix-preservation','LOSSLESS_PACKED_ROW_SUFFIX_NOT_FULL_INDEXED_RESOURCE'],
 ['O101U','packed-row-copy-inner-loop-contract','CODE_QUALIFIED_896_SOURCE_STRIDE_320_TRANSFER'],
 ['O101V','packed-suffix-eight-slot-reference-table','SEVEN_RESOURCE_PACKED_POINTERS_WITH_EXECUTABLE_CONSUMER'],
 ['O101W','vframe-root-references-reconciled','DISTINCT_RELOCATED_DESCRIPTOR_OWNER_PATHS_UNJOINED'],
 ['O101X','cave-forty-nine-indexed-byte-closure','FORTY_NINE_QUALIFIED_IMAGES_LEADING_PREFIX_HELD'],
 ['O101Y','audio-exact-driver-deduplication','DRIVER_DEDUP_PROVEN_NO_AUDIO_DECODER'],
 ['O101Z','held-resource-coverage-invariant','NO_UNPROVEN_OWNERSHIP_BASED_PROMOTIONS'],
 ['O102A','relocation-reference-graph-summary','MIXED_FORMAT_RELOCATION_GRAPH_WITH_RUNTIME_GAPS']
];
eq(tasks.length,30,'exactly 30 passes');let verified=0;
for(const [tag,slug,status] of tasks){if(only&&only!==tag)continue;
 const r=JSON.parse(fs.readFileSync(path.join(evidencePath,`mk2_${tag.toLowerCase()}_${slug}_2026-10-09.json`)));
 eq(r.passId,tag,'pass identifier');eq(r.topic,slug,'source topic');eq(r.classification,status,'bounded classification');eq(r.format,'mk2_o100x_o102a_30pass_ownership_evidence_v1','report schema');eq(r.fixtureExeSha256,canonical,'evidence source hash');
 eq(r.limits,{actualGameplayExecutionObserved:false,correctColorOwnershipProven:false,newExactFullGraphicsResources:0,animationSequencePromotion:0,frameTimingQualified:false},'no unsupported promotions');
 const v=r.evidence;
 if(tag==='O100X'){
  eq(v.descriptorObject2Offset,116576,'256x100 obj2 offset');eq(v.dimension,[H(O(116576)),H(O(116576)+2)],'256x100 dims');eq(v.dimension,[256,100],'256x100');
  eq(v.signedOffsets,[I(O(116576)+4),I(O(116576)+6)],'serialized coordinate words');eq(v.packedRef,U(O(116576)+8),'native packed reference');
  eq(v.codeSite,0x86163,'code site');eq(v.relocationSource,0x86164,'immediate relocation site');eq(v.codeSequenceHex,exe.subarray(0x86163,0x86177).toString('hex'),'setup/producer opcode path');
  check(exe.subarray(0x86163,0x86168).equals(Buffer.from('b868c70100','hex')),'direct code load');
  eq(v.incomingDescriptorStart,refs(116576),'descriptor incoming');eq(v.incomingResourceField,refs(116584),'resource field incoming');eq(v.firstDecoded,raster(file('VFRAME.GRA'),0,256,100).summary,'large source pixels');
 }else if(tag==='O100Y'){
  validateRows(v.rows,'VFRAME.GRA',116764,10);eq(v.tableOwners,refs(116764),'nested pointer table incoming');eq(v.imageCount,10,'tile count');eq(v.decodedRange,[0,v.rows.at(-1).end],'byte coverage');check(v.rows.slice(1).every((x,i)=>v.rows[i].end===x.start),'gapless VFRAME first ten');
 }else if(tag==='O100Z'){
  const ns=[116710,116720,116728,116764,116628,116584];eq(Object.keys(v.nodes).sort(),ns.map(String).sort(),'nodes');for(const n of ns)eq(v.nodes[n],refs(n),'authentic graph node');
  for(const n of [116720,116724,116728,116732,116736])eq(v.directWords[n],U(O(n)),'native value');eq(v.windowHex,exe.subarray(O(116680),O(116764)).toString('hex'),'serialized metadata');
 }else if(tag==='O101A'){
  const b=file('VFRAME.GRA'),large=raster(b,0,256,100),rows=decoded8('VFRAME.GRA',116764,4),one=Buffer.alloc(25600),two=Buffer.alloc(25600);
  for(let k=0;k<4;k++){const small=raster(b,rows[k].start,64,100,true);for(let y=0;y<100;y++){small.pixel.copy(one,y*256+k*64,y*64,y*64+64);small.alpha.copy(two,y*256+k*64,y*64,y*64+64)}}
  eq(v.firstFourTileEnd,rows.at(-1).end,'matching source span');eq(v.single,large.summary,'large image proof');eq(v.pixelDiff,one.reduce((s,x,i)=>s+(x!==large.pixel[i]),0),'pixel collision count');eq(v.maskDiff,two.reduce((s,x,i)=>s+(x!==large.alpha[i]),0),'transparency difference count');
  eq(v.singlePixelSha,hash(large.pixel),'large pixel sha');eq(v.tiledPixelSha,hash(one),'tile pixel sha');eq(v.singleMaskSha,hash(large.alpha),'large mask sha');eq(v.tiledMaskSha,hash(two),'tile mask sha');check(v.pixelDiff>0&&v.maskDiff>0,'not same image');
 }else if(tag==='O101B'){
  eq(v.tableIncoming,refs(98912),'all cave incoming');const arr=decoded8('CAVE.GRA',98912,49);eq(v.first,arr[0],'first');eq(v.last,arr.at(-1),'last');eq(v.consecutive,arr.slice(1).every((x,i)=>arr[i].end===x.start),'chain');eq(v.resourceLength,file('CAVE.GRA').length,'resource length');eq(v.tableIncoming.length,8,'8 setup references');
 }else if(tag==='O101C'){
  const targets=[98864,98912,98524,98590,118340,118468];eq(Object.keys(v.incomingByTarget).sort(),targets.map(String).sort(),'Cave target set');for(const n of targets)eq(v.incomingByTarget[n],refs(n),'file-backed incoming edges');
  eq(v.firstEightRefs,Array.from({length:8},(_,i)=>U(O(98730+18*i))),'8 records first pointer');eq(v.secondEightRefs,Array.from({length:8},(_,i)=>U(O(98734+18*i))),'8 records second pointer');
 }else if(tag==='O101D'){
  const b=file('CAVE.GRA'),prefix=raster(b,0,46,1);eq(v.prefixCandidate,prefix.summary,'bounded prefix candidate');eq(prefix.summary.end,120,'prefix length');eq(v.descriptorOffsetZero,refs(98912),'Cave table root not offset zero');eq(v.actualFirstDescriptorGraOffset,U(O(98912)+4)&0xffffff,'first indexed descriptor offset');eq(v.prefixHash,hash(b.subarray(0,120)),'preserve prefix bytes');eq(v.candidateMatchesFirstDescriptor,false,'do not assert same desc');
 }else if(tag==='O101E'){
  eq(v.firstIncoming,refs(103296),'first twenty table roots');eq(v.secondIncoming,refs(103456),'second twenty table roots');
  const d1=exe.subarray(O(103296),O(103456)),d2=exe.subarray(O(103456),O(103616));eq(v.firstTableSha,hash(d1),'table sha 1');eq(v.secondTableSha,hash(d2),'table sha 2');
  eq(v.matchingRecordHashes,Array.from({length:20},(_,j)=>hash(d1.subarray(j*8,j*8+8))===hash(d2.subarray(j*8,j*8+8))),'every duplicated descriptor');check(v.matchingRecordHashes.every(Boolean),'full table identical');
 }else if(tag==='O101F'){
  validateRows(v.rows,'BATTLE.GRA',103296,20);eq(v.first,v.rows[0].start,'first source');eq(v.end,v.rows.at(-1).end,'last source');eq(v.resourceLength,file('BATTLE.GRA').length,'file length');eq(v.allAdjacent,v.rows.slice(1).every((x,i)=>v.rows[i].end===x.start),'exact contiguous');
 }else if(tag==='O101G'){
  const rr=oldPartial('FONTS.GRA').streams,first=rr[0];eq(v.firstDescriptor,first,'prior descriptor origin');eq(v.firstDescriptorObject2,first.descriptorPhysical-0xa0c54,'backing offset');eq(v.sourceOwners,refs(v.firstDescriptorObject2),'descriptor ownership edges');eq(v.streamCount,rr.length,'font witness count');eq(v.firstGraByte,first.graOffset,'first graphic source byte');eq(v.lastEnd,rr.at(-1).encodedEndExclusive,'last graphic source byte');
 }else if(tag==='O101H'){
  const bytes=file('FONTS.GRA'),h=bytes.subarray(0,103840);eq(v.prefixLength,h.length,'font prefix length');eq(v.sha,hash(h),'full prefix sha');eq(v.nonzero,h.reduce((s,x)=>s+(x!==0),0),'prefix occupancy');eq(v.unique,new Set(h).size,'byte alphabet');eq(v.first32,h.subarray(0,32).toString('hex'),'prefix beginning');eq(v.last32,h.subarray(h.length-32).toString('hex'),'prefix end');eq(v.suffixBoundaryHex,bytes.subarray(h.length,h.length+24).toString('hex'),'boundary bytes');
 }else if(tag==='O101I'){
  const r=oldPartial('PLAYSTA.GRA').streams.slice().sort((a,b)=>a.graOffset-b.graOffset);eq(v.overlapBytes,68,'overlap 0-76 with 8-4408');
  for(const [key,row] of [['first',r[0]],['second',r[1]]]){eq(v[key].descriptor,row,'authentic 12 descriptor');eq(v[key].decode,raster(file('PLAYSTA.GRA'),row.graOffset,row.width,row.height).summary,'decoded overlap witness');eq(v[key].incoming,refs(row.descriptorPhysical-0xa0c54),'owner references')}
 }else if(tag==='O101J'){
  const r=oldPartial('PLAYSTA.GRA').streams.slice().sort((a,b)=>a.graOffset-b.graOffset);eq(v.firstAlternativeStart,r[1].graOffset,'alternative source head');eq(v.remainderCount,r.length-1,'stream count');eq(v.ends,r.at(-1).encodedEndExclusive,'suffix EOF');eq(v.resourceLen,file('PLAYSTA.GRA').length,'length');eq(v.allAdjacent,r.slice(2).every((x,i)=>r[i+1].encodedEndExclusive===x.graOffset),'contiguous suffix');
 }else if(tag==='O101K'){
  const b=file('MONKS.GRA'),rs=[];for(let p=0;p<b.length;p+=4){let x=b.readUInt32LE(p);if(rs.length&&rs.at(-1)[0]===x)rs.at(-1)[1]++;else rs.push([x,1])}
  eq(v.dwordCount,b.length/4,'word count');eq(v.runs,rs,'all 10 runs');eq(v.fullSha,hash(b),'MONKS original hash');eq(v.totalRuns,10,'ten grouped runs');
 }else if(tag==='O101L'||tag==='O101M'){
  const n=tag==='O101L'?'PROBE.GRA':'ACCLAIM.GRA',b=file(n);eq(v.resource,n,'source name');eq(v.size,b.length,'source length');eq(v.sha,hash(b),'full resource sha');eq(v.first64,b.subarray(0,64).toString('hex'),'head bytes');eq(v.distinctValues,new Set(b).size,'byte alphabet');eq(v.zeroCount,b.reduce((s,x)=>s+(x===0),0),'zero count');const id=pool.indexOf(n),a=[],c=[];
  for(let p=0xa0c54;p<exe.length-12;p+=4){let w=H(p),h=H(p+2);if(w<1||h<1||w>640||h>480)continue;
   const p8=U(p+4),p12=U(p+8),x=I(p+4),y=I(p+6);
   if((p8>>>24)===id&&(p8&0xffffff)<b.length)a.push(p);
   if(x>=-1000&&x<=1000&&y>=-1000&&y<=1000&&(p12>>>24)===id&&(p12&0xffffff)<b.length)c.push(p);
  }
  eq(v.boundedEightByteCandidates,a,'bounded 8-byte geometry candidates');eq(v.boundedTwelveByteCandidates,c,'bounded 12-byte geometry candidates');eq(v.scanAlignment,4,'4-byte alignment bound');
 }else if(['O101N','O101O','O101P','O101Q','O101R','O101S','O101T'].includes(tag)){
  const spec={O101N:['TOMB.GRA',63776,0],O101O:['TOWER.GRA',56268,2],O101P:['FOREST.GRA',198116,3],O101Q:['ARMORY.GRA',126336,4],O101R:['PORTAL.GRA',56916,6],O101S:['ARENA.GRA',90488,7],O101T:['BATTLE.GRA',59436,1]}[tag];
  const [name,start,idx]=spec;eq(v.referenceIndex,idx,'table index');eq(v.referencePhysical,0xcfbac+4*idx,'word physical');eq(v.packedReference,U(v.referencePhysical),'native packed reference');eq(v.packedReference>>>24,pool.indexOf(name),'resource pool id');eq(v.packedReference&0xffffff,start,'resource offset');
  const rest={...v};delete rest.referenceIndex;delete rest.referencePhysical;delete rest.packedReference;eq(rest,packedRow(name,start),'entire independent raw-region row inventory');
 }else if(tag==='O101U'){
  eq(v.copyLoopHex,exe.subarray(0x65a0b,0x65a1a).toString('hex'),'source copy opcode');eq(v.strideLoopHex,exe.subarray(0x65a2d,0x65a3a).toString('hex'),'source advance opcode');eq(v.sourceDwordCount,80,'dwords per copy');eq(v.bytesPerCopy,320,'source copy bytes');eq(v.sourceStride,896,'source row increment');eq(v.callsite,0x9e191,'code target call');eq(v.callTarget,v.callsite+5+exe.readInt32LE(v.callsite+1),'relative call displacement');eq(v.callTarget,0x659c6,'packed copy routine');
 }else if(tag==='O101V'){
  eq(v.baseObject2,0x2ef54,'object2 table offset');eq(v.codeRelocationAt,0x9e16d,'code indexed base');eq(v.tableRaw,Array.from({length:10},(_,j)=>U(0xcfba8+4*j)),'all table values');eq(v.tableEntryIncoming,refs(0x2ef54),'reparsed table fixup');eq(v.resourceNames,['TOMB.GRA','BATTLE.GRA','TOWER.GRA','FOREST.GRA','ARMORY.GRA','PORTAL.GRA','ARENA.GRA'],'seven resources');
 }else if(tag==='O101W'){
  eq(v.singleDescriptor,refs(116584),'large owner');eq(v.tileTable,refs(116764),'small tile owner');eq(v.head12,refs(116576),'large desc first field owner');eq(v.codeWindow,exe.subarray(0x86163,0x86177).toString('hex'),'direct code site');eq(v.differentDrawingsProved,true,'VFRAME pixel disagreement');eq(v.sameRuntimeRenderingProved,false,'conditional runtime');
 }else if(tag==='O101X'){
  const rows=decoded8('CAVE.GRA',98912,49);eq(v.count,49,'49 descriptors');eq(v.firstOffset,rows[0].start,'prefix boundary');eq(v.end,rows.at(-1).end,'EOF boundary');eq(v.allAdjacent,rows.slice(1).every((x,i)=>rows[i].end===x.start),'source tiling');eq(v.uniqueHashes,new Set(rows.map(r=>r.pixels)).size,'different pixel records');eq(v.pixelCount,rows.reduce((s,r)=>s+r.width*r.height,0),'total indexed pixels');
 }else if(tag==='O101Y'){
  const names=['AWE.BIN','GRV.BIN','SCC.BIN','GMI.BIN','SBL.BIN','LAP.BIN'],rows=names.map(n=>({name:n,length:file(n).length,sha:hash(file(n)),head32:file(n).subarray(0,32).toString('hex')}));eq(v.rows,rows,'six native drivers');eq(v.uniqueSha,new Set(rows.map(x=>x.sha)).size,'deduplication');eq(v.sameGmiScc,file('GMI.BIN').equals(file('SCC.BIN')),'exact bytes match');
 }else if(tag==='O101Z'){
  eq(v.totalGRA,fs.readdirSync(fixturePath).filter(x=>x.toLowerCase().endsWith('.gra')).length,'native resource count');eq(v.exactFull,110,'existing qualified coverage');eq(v.held,['PORTAL.GRA','ARMORY.GRA','FOREST.GRA','TOMB.GRA','TOWER.GRA','ARENA.GRA','VFRAME.GRA','BATTLE.GRA','CAVE.GRA','FONTS.GRA','PLAYSTA.GRA','PROBE.GRA','ACCLAIM.GRA','MONKS.GRA'],'held ledger');eq(v.heldCount,14,'held count');eq(v.newExactFull,0,'no speculative promotions');
 }else if(tag==='O102A'){
  eq(v.fixups,27004,'relocation census');const totals={};for(const f of relations)totals[f.dest]=(totals[f.dest]??0)+1;eq(v.targetObjectCounts,totals,'target object totals');eq(v.fixtureExeSHA,canonical,'binary hash');for(const off of [116584,116764,98912,103296,103456,0x2ef54])eq(v.roots[off],refs(off),'reparsed root target '+off);
 }
 verified++;console.log(JSON.stringify({pass:tag,status:'PASS'}));
}
eq(verified,only?1:30,'all requested passes verified');
console.log(JSON.stringify({status:'PASS',passes:verified,independentChecks:checks,relocations:relations.length,failures:0}));
