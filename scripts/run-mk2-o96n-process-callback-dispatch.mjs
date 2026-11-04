#!/usr/bin/env node
/** O96N: bounded conditional scheduler dispatch via process field +0x1c. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),[fix,out=root]=process.argv.slice(2);if(!fix)throw Error('usage <mk2-dir> [output-dir]');
const b=fs.readFileSync(path.join(path.resolve(fix),'mk2.exe'));const sha=d=>crypto.createHash('sha256').update(d).digest('hex'),ck=(x,m)=>{if(!x)throw Error('O96N '+m)};
const xe='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';ck(sha(b)===xe,'fixture');
const lbuf=fs.readFileSync(path.join(root,'mk2_producer_process_entry_provenance_o96l_2026-10-08.json')),L=JSON.parse(lbuf);ck(L.status==='SUCCESS'&&L.fixtureSha256===xe&&L.instantiations.length===2,'O96L prerequisite');
const bytes=(at,s)=>ck(b.subarray(at,at+s.length/2).toString('hex')===s,`machine ${at.toString(16)}`);
const pointers=[{position:0x67248,encoding:'89501c',role:'constructor_writes_EDX_to_new_process_plus_1c'}, {position:0x67114,encoding:'89561c',role:'yield_saves_return_address_to_current_process_plus_1c'}, {position:0x67185,encoding:'ff661c',role:'scheduler_indirect_jump_via_current_process_plus_1c'}];
for(const v of pointers)bytes(v.position,v.encoding);
// Scheduler unconditionally returns from a saved/process state into a conditional next-process path.
bytes(0x67108,'be045b0300');ck(b[0x6710d]===0xeb&&0x6710f+b.readInt8(0x6710e)===0x67152,'head sentinel to schedule list');
bytes(0x67152,'8b3685f67430');bytes(0x67158,'66ff4e067ff4');bytes(0x6715e,'8b6e08');
const restores=[{at:0x67162,from:0x0c,to:0x75a80,store:0x67165},{at:0x6716d,from:0x10,to:0x75a7c,store:0x67170},{at:0x67178,from:0x14,to:0x75a78,store:0x6717b}];
for(const {at,from,to,store} of restores){bytes(at,'8b56'+from.toString(16).padStart(2,'0'));ck(b[store]===0x89&&b[store+1]===0x15&&b.readUInt32LE(store+2)===to,'restored global');}
bytes(0x67182,'8b7e18');bytes(0x67235,'8b0e89088906');bytes(0x67242,'66c740060100');bytes(0x6710f,'5a66894606');
const report={format:'mk2_o96n_process_callback_scheduler_dispatch_v1',status:'SUCCESS',fixtureSha256:xe,o96lReportSha256:sha(lbuf),originalEntry:0x81b98,originalObject1Relative:0x1ff44,originalCreationCalls:L.instantiations.map(e=>e.call),processFieldOffset:0x1c,pointerUses:pointers,constructor:{entry:0x67222,activeHeadLinkWrite:0x67239,entryFieldWrite:0x67248,initialCountFieldAt:0x67242},yield:{entry:0x6710f,savesReturnToField:0x67114},scheduler:{listSentinel:0x67108,listIteration:0x67152,emptyListBranchAt:0x67156,countDecrementAt:0x67158,countPositiveJumpAt:0x6715c,restoreBasePointerAt:0x6715e,restoreGlobals:restores,restoreEDIAt:0x67182,indirectDispatchAt:0x67185},classification:{sameFieldReadWriteAndIndirectDispatchQualified:true,constructorToCallbackRuntimeMechanismQualified:true,processSchedulingConditional:true,liveExecutionOfSpecificProcessObserved:false,everyFrameProducerInvocationEstablished:false,schedulerUnitsMappedToWallClock:false,stageIdentityProven:false,mk2Closed:false}};
fs.mkdirSync(out,{recursive:true});const filename=path.join(out,'mk2_process_callback_scheduler_dispatch_o96n_2026-10-08.json');fs.writeFileSync(filename,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:'O96N',result:'PASS',producerProcessCalls:report.originalCreationCalls,savedAndDispatchedField:'0x1c',target:report.originalEntry,report:filename}));
