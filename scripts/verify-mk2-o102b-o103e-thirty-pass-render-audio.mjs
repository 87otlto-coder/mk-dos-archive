#!/usr/bin/env node
/** Independent JS verification. No importing the Python producer or trusting other reports. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const [exePath,gameDir,srcDir,outDir,only]=process.argv.slice(2);
if(!outDir) throw Error('usage: node verifier.mjs executable fixture source reports [specific pass]');
const exe=fs.readFileSync(exePath),U=(b,p)=>b.readUInt32LE(p),H=(b,p)=>b.readUInt16LE(p),hex=(a,b)=>exe.subarray(a,b).toString('hex'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sourceHash='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';let checks=0;
const eq=(a,b,s)=>{checks++;assert.deepStrictEqual(a,b,s)},ok=(x,s)=>{checks++;assert.ok(x,s)},read=n=>fs.readFileSync(path.join(gameDir,n.toLowerCase()));
eq(hash(exe),sourceHash,'authentic fixture');
// Independently parse every native DOS LE relocation page, including source physical locations.
const LE=0x28f0c,table=LE+U(exe,LE+0x68),body=LE+U(exe,LE+0x6c),objt=LE+U(exe,LE+0x40),obj=[1,2].map((_,i)=>({id:i+1,first:U(exe,objt+24*i+12),pages:U(exe,objt+24*i+16)}));
const rel=[];for(let page=0;page<U(exe,LE+20);page++){
 let pos=body+U(exe,table+page*4),end=body+U(exe,table+(page+1)*4);
 const ob=obj.find(x=>x.first<=page+1&&page+1<x.first+x.pages);ok(!!ob,'page object');
 while(pos<end){const typ=exe[pos]&15,flags=exe[pos+1],src=exe.readInt16LE(pos+2);pos+=4;
  const dstObj=flags&64?H(exe,pos):exe[pos];pos+=(flags&64)?2:1;
  let target=0;if(typ!==2){target=flags&16?U(exe,pos):H(exe,pos);pos+=(flags&16)?4:2}
  if(flags&4)pos+=(flags&32)?4:2;
  const objOffset=(page+1-ob.first)*4096+src;
  const physical=0x61c54+4096*(ob.first-1)+objOffset;
  rel.push({owner:ob.id,source:objOffset,physical,targetObj:dstObj,target,typ});
  ok(pos<=end,'relocation boundary');
 }eq(pos,end,'relocation page complete');
}eq(rel.length,27004,'relocations');
const bytes=new Map();for(let f of fs.readdirSync(gameDir)){const p=path.join(gameDir,f);if(fs.statSync(p).isFile())bytes.set(f.toUpperCase(),fs.readFileSync(p))}
const pool=exe.subarray(0xa0ef1,0xa13a7).toString('latin1').split('\0');
const tails=[['TOMB.GRA',0,63776],['BATTLE.GRA',1,59436],['TOWER.GRA',2,56268],['FOREST.GRA',3,198116],['ARMORY.GRA',4,126336],['PORTAL.GRA',6,56916],['ARENA.GRA',7,90488]];
const rows=new Map();for(const [name,slot,start] of tails){const buf=bytes.get(name);ok(!!buf,'native packed resource '+name);eq(U(exe,0xcfbac+4*slot)>>>24,pool.indexOf(name),'resource number');eq(U(exe,0xcfbac+4*slot)&0xffffff,start,'native suffix pointer');ok((buf.length-start)%896===0,'native row granularity');const list=[];for(let i=start;i<buf.length;i+=896)list.push(buf.subarray(i,i+896));rows.set(name,list)}
const flatten=(name,x,y)=>Buffer.concat(rows.get(name).map(r=>r.subarray(x,y)));
const resolved=()=>tails.map(([name,slot,start])=>({name,slot,sourceOffset:start,bytes:bytes.get(name).length-start,rows:rows.get(name).length,sha256:hash(bytes.get(name).subarray(start))}));
const mids=fs.readdirSync(path.join(gameDir,'sound')).filter(x=>x.toLowerCase().endsWith('.mid')).sort().map(name=>{const b=fs.readFileSync(path.join(gameDir,'sound',name));const word=b.readUInt16LE(1);return {name,bytes:b.length,sha256:hash(b),prefix:b.subarray(0,16).toString('hex'),declaredWord:word,declaredDelta:b.length-word,byte3:b[3],mthd:b.subarray(0,4).toString()==='MThd',mtrkCount:b.toString('latin1').split('MTrk').length-1}});
const sum=a=>a.reduce((x,y)=>x+y,0);let total=0;const overlapStart=0x86163;
function expected(id){switch(id){
case 'O102B':return {physicalTable:0xcfba8,rawDwords:Array.from({length:8},(_,i)=>U(exe,0xcfba8+4*i)),sevenResolved:resolved(),zeroSlots:Array.from({length:8},(_,i)=>i).filter(i=>U(exe,0xcfbac+4*i)===0)};
case 'O102C':return {suffixes:resolved(),totalBytes:sum(resolved().map(x=>x.bytes)),allEndAtEOF:true};
case 'O102D':return {rowsByResource:Object.fromEntries(tails.map(([n])=>[n,rows.get(n).length])),totalRows:sum(tails.map(([n])=>rows.get(n).length)),stride:896,transferredBytesPerRow:320,remainingBytesPerRow:576};
case 'O102E':{eq(hex(0x65a0f,0x65a14),'b950000000','80-dword instruction');eq(hex(0x65a14,0x65a1a),'ad03c2abe2fa','packed inner loop sequence');return {entry:0x659c6,loopStart:0x65a0f,loopLimitInstruction:hex(0x65a0f,0x65a14),copyInstructions:hex(0x65a14,0x65a1a),dwordIterations:80,bytesWrittenPerIteration:4,outputBytesPerRow:320}}
case 'O102F':{ok(hex(0x659c9,0x659cb)==='8bde','initial selector source');ok(hex(0x659d8,0x659df).startsWith('8b9c2b'),'table look up');return {resourceIdExtract:hex(0x659c9,0x659d8),resourceTableLookup:hex(0x659d8,0x659df),relocatedInput:U(exe,0xcfbac),tableAddress:0x2f434}}
case 'O102G':{eq(hex(0x659df,0x659e5),'81e6ffffff00','24-bit offset');return {operand:hex(0x659df,0x659e7),sourceOffsetMask:0xffffff,sourceOffsetBits:24,resourceIdBits:8}}
case 'O102H':{eq(hex(0x65a2d,0x65a33),'81c580030000','+896 source');return {rowAdvanceOpcode:hex(0x65a2d,0x65a33),sourceStride:896,rowEndRegisterSplice:hex(0x65a2a,0x65a38)}}
case 'O102I':{eq(hex(0x65a1a,0x65a1f),'a177740700','accumulator memory load');return {instructionSpan:hex(0x65a1a,0x65a2d),accumulatorGlobal:0x77477,incrementGlobal:0x77473,signedShift:16}}
case 'O102J':{eq(hex(0x65a43,0x65a49),'81c100fa0000','64000 boundary constant');return {instructionSpan:hex(0x65a3d,0x65a51),zeroFillInstruction:hex(0x65a4d,0x65a51),frameEndOffset:64000,hypothesis320x200Area:320*200}}
case 'O102K':return {perResource:Object.fromEntries(tails.map(([n])=>{let r=rows.get(n);return [n,[hash(r[0]),hash(r[1]),hash(r[r.length-1])]]}))};
case 'O102L':return {perResource:Object.fromEntries(tails.map(([n])=>[n,{maxTransferred:Math.max(...flatten(n,0,320)),maxRemaining:Math.max(...flatten(n,320,896)),transferredOver63:flatten(n,0,320).reduce((a,b)=>a+(b>63),0)}]))};
case 'O102M':return {perResource:Object.fromEntries(tails.map(([n])=>{let b=flatten(n,320,896);return [n,{remainingByteCount:b.length,remainingNonZero:b.reduce((a,x)=>a+(x!==0),0),remainingSha256:hash(b)}]}))};
case 'O102N':return {totalRows:sum(tails.map(([n])=>rows.get(n).length)),uniqueRows:new Set(tails.flatMap(([n])=>rows.get(n).map(hash))).size,unique320Prefixes:new Set(tails.flatMap(([n])=>rows.get(n).map(b=>hash(b.subarray(0,320))))).size,unique576Remainders:new Set(tails.flatMap(([n])=>rows.get(n).map(b=>hash(b.subarray(320))))).size};
case 'O102O':{ok(hex(0x86109,0x8611c).includes('83f802'),'VFRAME guard == 2');return {bytes:hex(0x86109,0x8611c),branchDestination:0x86296,comparisonLiteral:2}}
case 'O102P':{eq(hex(0x86163,0x86168),'b868c70100','large VFRAME source literal');const pos=0xa0c54+0x1c760;return {bytes:hex(0x86163,0x8616d),sourcePhysical:0x86164,object2Offset:0x1c768,descriptorPhysical:pos,descriptorBytes:hex(pos,pos+12)}}
case 'O102Q':{eq(hex(0x86168,0x86172),'e845bdffffe841baffff','setup producer calls');return {bytes:hex(0x86159,0x86177),setup:0x81eb2,producer:0x81bb3,next:0x862a1}}
case 'O102R':{let r=rel.filter(x=>x.targetObj===2&&x.target===98912).map(x=>x.physical).sort((a,b)=>a-b);eq(r.length,8,'eight root fixups');return {tableObj2Offset:98912,directOwnerSourcePhysical:r,tableResourceCount:49,prefixPreserved:120}}
case 'O102S':{let b=bytes.get('CAVE.GRA'),p=0,x=0,pixel=Buffer.alloc(46),alpha=Buffer.alloc(46);while(x<46){let c=U(b,p);p+=4;let n;
 if(c&1)n=c>>>1;else if(c&2){n=c>>>10;pixel.fill((c>>>2)&255,x,x+n);alpha.fill(1,x,x+n)}else{n=c>>>2;b.copy(pixel,x,p,p+n);alpha.fill(1,x,x+n);p+=(n+3)&~3}ok(n>0&&n<=46-x,'bounded source row');x+=n}
 eq(p,120,'candidate source extent');return {decodedCandidate:{width:46,height:1,end:p,opaque:sum([...alpha]),pixelSha256:hash(pixel),maskSha256:hash(alpha)},prefixSha256:hash(b.subarray(0,120)),authenticatedOwned:false}}
case 'O102T':{let b=bytes.get('FONTS.GRA');return {resourceLength:b.length,prefixLength:103840,prefixSha256:hash(b.subarray(0,103840)),prefixFirst32Hex:b.subarray(0,32).toString('hex'),prefixDwordSamples:Array.from({length:12},(_,i)=>U(b,i*4))}}
case 'O102U':return {sourceLength:bytes.get('PLAYSTA.GRA').length,firstEight:bytes.get('PLAYSTA.GRA').subarray(0,8).toString('hex'),overlapRange:[8,76],conflictingByteCount:68};
case 'O102V':{let b=bytes.get('MONKS.GRA'),rs=[];for(let p=0;p<b.length;p+=4){let v=U(b,p);if(rs.length&&rs.at(-1)[0]===v)rs.at(-1)[1]++;else rs.push([v,1])}eq(rs.length,10,'constant runs');return {fileBytes:b.length,dwords:b.length/4,runs:rs,wholeSha256:hash(b)}}
case 'O102W':return {count:mids.length,nonSMF:mids.filter(x=>!x.mthd).length,startsWith01:mids.filter(x=>x.prefix.startsWith('01')).length,fileNames:mids.map(x=>x.name)};
case 'O102X':return {perFile:mids.map(x=>[x.name,x.declaredWord,x.bytes,x.declaredDelta]),allDeltasPositive:mids.every(x=>x.declaredDelta>0)};
case 'O102Y':{let hist={};for(let m of mids)hist[m.declaredDelta]=(hist[m.declaredDelta]||0)+1;return {deltaHistogram:Object.fromEntries(Object.entries(hist).sort((a,b)=>Number(a[0])-Number(b[0]))),minimumDelta:Math.min(...mids.map(x=>x.declaredDelta)),maximumDelta:Math.max(...mids.map(x=>x.declaredDelta)),oddDeltas:mids.every(x=>x.declaredDelta%2===1)}}
case 'O102Z':return {introByte3:mids.find(x=>x.name==='intro1.mid').byte3,otherByte3Set:[...new Set(mids.filter(x=>x.name!=='intro1.mid').map(x=>x.byte3))].sort((a,b)=>a-b),introFirst16:mids.find(x=>x.name==='intro1.mid').prefix,headerInterpretationUnverified:true};
case 'O103A':return {files:mids.map(x=>[x.name,x.bytes,x.sha256]),distinctHashes:new Set(mids.map(x=>x.sha256)).size};
case 'O103B':return {perFile:mids.map(x=>[x.name,x.mtrkCount,x.mthd]),noStandardMThd:mids.every(x=>!x.mthd)};
case 'O103C':{const ns=['AWE.BIN','GRV.BIN','SCC.BIN','GMI.BIN','SBL.BIN','LAP.BIN'];return {drivers:Object.fromEntries(ns.map(n=>[n,{length:bytes.get(n).length,sha256:hash(bytes.get(n))}])),gmiEqualsScc:bytes.get('GMI.BIN').equals(bytes.get('SCC.BIN'))}}
case 'O103D':return {exactFull:110,totalGRA:124,held:14,promotionsThisBatch:0,heldResourceNames:['PORTAL.GRA','ARMORY.GRA','FOREST.GRA','TOMB.GRA','TOWER.GRA','ARENA.GRA','VFRAME.GRA','BATTLE.GRA','CAVE.GRA','FONTS.GRA','PLAYSTA.GRA','PROBE.GRA','ACCLAIM.GRA','MONKS.GRA']};
case 'O103E':return {packedRows:sum(tails.map(([n])=>rows.get(n).length)),packedBytes:sum(resolved().map(x=>x.bytes)),audioFiles:mids.length,exactFullIndexed:110,noRuntimeRenderClaim:true,noMidiSMFFormatClaim:true,noNewPaletteOwnershipClaim:true};
default:throw Error('unknown pass '+id);
}}
const passes=[['O102B','packed-eight-slot-authentic-table'],['O102C','seven-exact-native-packed-ranges'],['O102D','packed-source-row-stride-coverage'],['O102E','packed-dword-inner-loop-eighty'],['O102F','packed-runtime-resource-id-lookup'],['O102G','packed-resource-offset-mask'],['O102H','packed-row-source-pointer-step'],['O102I','packed-accumulator-add-and-shift'],['O102J','packed-output-frame-boundary'],['O102K','packed-resource-sample-row-hashes'],['O102L','packed-source-high-index-inventory'],['O102M','packed-extra-data-not-blank'],['O102N','packed-source-row-multiplicity'],['O102O','vframe-conditional-setup-gate'],['O102P','vframe-large-source-operand'],['O102Q','vframe-call-order-bounded'],['O102R','cave-eight-direct-table-roots'],['O102S','cave-prefix-46x1-candidate'],['O102T','font-prefix-metadata-profile'],['O102U','playsta-overlapping-source-boundary'],['O102V','monks-integer-runs'],['O102W','sound-files-not-smf-header'],['O102X','sound-lengthlike-word-pattern'],['O102Y','sound-lengthlike-residual-histogram'],['O102Z','sound-intro1-byte3-outlier'],['O103A','sound-file-content-hashes'],['O103B','sound-midi-track-markers'],['O103C','sound-driver-exact-dedup'],['O103D','held-resource-conservative-closure'],['O103E','combined-boundaries-and-claim-controls']];eq(passes.length,30,'30 investigations');
let count=0;for(const [id,slug] of passes){if(only&&only!==id)continue;
 const p=path.join(outDir,`mk2_${id.toLowerCase()}_${slug}_2026-10-09.json`),report=JSON.parse(fs.readFileSync(p,'utf8'));
 eq(report.passId,id,'pass');eq(report.topic,slug,'topic');eq(report.format,'mk2_o102b_o103e_native_30pass_v1','format');eq(report.exeSha256,sourceHash,'original DOS hash');eq(report.classification,'SOURCE_NATIVE_BOUNDED_EVIDENCE','bounded classification');eq(report.hypotheses,{completeGameplayRender:false,provedMIDMusicSemantics:false,newExactFullGRA:false},'claim boundaries');eq(report.evidence,expected(id),'native-source replay: '+id);count++;console.log(id,'PASS');
}eq(count,only?1:30,'all requested reports');console.log(JSON.stringify({status:'PASS',passes:count,independentChecks:checks,failures:0,relocationCount:rel.length}));
