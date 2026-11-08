#!/usr/bin/env node
/** P68 source-only monotonic scan / cancel / stale-result controls; no game assets. */
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(m,file)=>m._compile(
 ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {DirectorySwitchGateP68}=require('../src/core/discovery/directorySwitchGateP68.ts');
const gate=new DirectorySwitchGateP68();const trace=[];
let source='MK1',queue=['audio/wav/001.WAV'],preview='001.WAV',packageName='MK1_P65_INDEXED_ANITAB_SOURCE_STREAMS.zip';
const commit=(token,next)=>{
 if(!gate.isCurrent(token)){trace.push('stale refused');return false;}
 source=next;queue=[];preview=null;packageName=next==='MK2'?'MK2_indexed_evidence.zip':'MK3 source';
 trace.push('accepted '+next);return true;
};
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {resolve,promise};};
(async()=>{
 assert.equal(gate.isCurrent(0),false);assert.equal(gate.isCurrent(-1),false);
 assert.equal(gate.isCurrent(1.2),false);assert.equal(gate.isCurrent(Number.NaN),false);
 const first=gate.begin();assert.equal(gate.isCurrent(first),true);
 const scan1=deferred(),work1=scan1.promise.then(next=>commit(first,next));
 gate.cancel();assert.equal(gate.isCurrent(first),false);
 scan1.resolve('MK2');assert.equal(await work1,false);
 assert.equal(source,'MK1');assert.deepEqual(queue,['audio/wav/001.WAV']);
 assert.equal(preview,'001.WAV');
 assert.equal(packageName,'MK1_P65_INDEXED_ANITAB_SOURCE_STREAMS.zip');

 const second=gate.begin(),scan2=deferred(),work2=scan2.promise.then(next=>commit(second,next));
 const third=gate.begin(),scan3=deferred(),work3=scan3.promise.then(next=>commit(third,next));
 scan3.resolve('MK3');assert.equal(await work3,true);
 scan2.resolve('MK2');assert.equal(await work2,false);
 assert.equal(source,'MK3');assert.deepEqual(queue,[]);assert.equal(preview,null);
 assert.equal(packageName,'MK3 source');

 const repeated=gate.begin();assert.equal(commit(repeated,'MK2'),true);
 assert.equal(source,'MK2');assert.deepEqual(queue,[]);
 assert.equal(packageName,'MK2_indexed_evidence.zip');
 gate.cancel();assert.equal(commit(repeated,'MK1'),false);
 assert.equal(source,'MK2');
 assert.deepEqual(trace,['stale refused','accepted MK3','stale refused','accepted MK2','stale refused']);

 console.log(JSON.stringify({pass:'P68_SOURCE',status:'PASS',
  cancelledPickerRetainsActiveAssets:true,lateScanCannotOverwriteLaterAcceptedGame:true,
  staleAssetPreviewAndEvidenceNotPromoted:true,reusedDirectoryNameMustReceiveNewSessionId:true,
  invalidTokenRejected:4,syntheticOnly:true},null,2));
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
