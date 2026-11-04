#!/usr/bin/env node
/** O96O/O96P: bounded process-construction and dual-stream continuation evidence. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [fixtureDir, outputDir=here]=process.argv.slice(2);
if(!fixtureDir)throw Error('Usage: node script <MK2 directory> [output directory]');
const exe=fs.readFileSync(path.join(fixtureDir,'mk2.exe'));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const canonical='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const ck=(ok,why)=>{if(!ok)throw Error(why)};
const u=p=>exe.readUInt32LE(p), s=p=>exe.readInt32LE(p);
const hex=(p,x)=>ck(exe.subarray(p,p+x.length/2).toString('hex')===x,`machine mismatch ${p.toString(16)}`);
const near=(p,t)=>ck(exe[p]===0xe8&&p+5+s(p+1)===t,`CALL ${p.toString(16)} -> ${t.toString(16)}`);
ck(hash(exe)===canonical,'MK2 fixture SHA-256 mismatch');
const nRaw=fs.readFileSync(path.join(here,'mk2_process_callback_scheduler_dispatch_o96n_2026-10-08.json'));
const n=JSON.parse(nRaw);ck(n.status==='SUCCESS'&&n.fixtureSha256===canonical&&n.scheduler.indirectDispatchAt===0x67185,'O96N prerequisite');
const fRaw=fs.readFileSync(path.join(here,'mk2_runtime_control_direct_callers_o96f_2026-10-08.json'));
const f=JSON.parse(fRaw);ck(f.exeSha256===canonical,'O96F prerequisite');
const writer=f.groups.find(x=>x.name==='indexWriter');
ck(writer?.callCount===9,'O96F 9 writer callers prerequisite');
const list=writer.calls.map(x=>x.callPhysical);
ck(JSON.stringify(list)===JSON.stringify([0x74d4d,0x758cc,0x771e6,0x77a08,0x77d8b,0x84d32,0x84eee,0x85fae,0x94965]),'callsite list drift');
const calls=list.map(p=>{
  near(p,0x82321);
  const adj=exe.subarray(p-10,p-4).toString('hex')==='c705805a0700'?u(p-4):null;
  ck((writer.calls.find(x=>x.callPhysical===p)?.adjacentLiteral?.value??null)===adj,'source value drift');
  return {callsite:p,adjacentScalar:adj,localWriterEntry:0x82321,processConstructorInWriter:0x8236b};
});
// One concrete callee body: selecting a table entry, calling the resource-related helper,
// and immediately constructing a scheduler process with the producer loop entry.
hex(0x82321,'a1805a0700'); hex(0x82326,'a37f740700');
hex(0x8232b,'52c1e002');
for(const [at,body] of [[0x8232f,'baec5b0100'],[0x8233d,'ba685c0100'],[0x8234b,'bae45c0100']])hex(at,body);
hex(0x82350,'03c25a8b00a3805a0700'); near(0x8235a,0x81eb2);
hex(0x8235f,'5251bb05000000ba44ff0100'); near(0x8236b,0x67222);
hex(0x82370,'595ac3');
ck(u(0x82367)===0x1ff44,'process callback relative address');
const o={format:'mk2_o96o_writer_to_producer_process_constructor_v1',status:'SUCCESS',fixtureSha256:canonical,o96nReportSha256:hash(nRaw),o96fReportSha256:hash(fRaw),writer:0x82321,authenticatedCallers:calls,adjacentLiteralValues:calls.filter(x=>x.adjacentScalar!==null).map(x=>x.adjacentScalar),calleeSequence:{indexCaptureAt:0x82326,tableBases:[0x15bec,0x15c68,0x15ce4],pointerReadAt:0x82353,pointerStoreAt:0x82355,setupHelperCall:0x8235a,setupHelper:0x81eb2,constructorCall:0x8236b,constructor:0x67222,callbackValue:0x1ff44,callbackEntryPhysical:0x81b98,returnAt:0x82372},classification:{allNineSitesHaveSameConditionalProcessConstructionContinuation:true,fiveLiteralInputsEnterWriterWithDownstreamConstructor:true,selectedTableIndexLimitProven:false,individualCallsGuaranteedGameplayExecuted:false,helperAlwaysReturnsSafely:false,constructorAlwaysAllocates:false,stageIdentityProven:false,sourceIndexPersistingToRowRendererProven:false,mk2Closed:false}};
// O96P: the literal-13 caller continues through a separate, conditional two-source loop
// before a second process-constructor call. The input WORD stream is runtime-sourced;
// its values must not be fabricated from Object-2 records.
hex(0x85fa4,'c705805a07000d000000');near(0x85fae,0x82321);
hex(0x85fb3,'b805000000');near(0x85fb8,0x86bbb);
hex(0x86000,'b858430800');near(0x86005,0x6513b);
hex(0x8600a,'8b0d26650700'); hex(0x86010,'bbc6c20100');
hex(0x86015,'0fbf0183c102a9ffffffff781f83f80d741a');
hex(0x86027,'0fbf1383c302c1e21081c2c5000000');
hex(0x86036,'5351');near(0x86038,0x8608c);hex(0x8603d,'595bebd4');
near(0x86041,0x81bb3);near(0x86046,0x860c1);
hex(0x8604b,'b848430800');near(0x86050,0x6513b);
hex(0x86055,'b801000000a35b740700');near(0x8605f,0x81bb3);
hex(0x86064,'5251bb05000000ba44ff0100');near(0x86070,0x67222);
hex(0x86075,'595a');near(0x86077,0x650d9);hex(0x8607c,'b801000000');near(0x86081,0x6710f);
hex(0x8608c,'52c1e0020564c20100528b1089156c5a07005a');near(0x8609f,0x64548);near(0x860a5,0x860fd);
const q={format:'mk2_o96p_runtime_word_dual_source_conditional_producer_v1',status:'SUCCESS',fixtureSha256:canonical,o96oReportSha256:null,literal13WriterCall:0x85fae,writerFollowupCall:0x85fb8,pointerListHeadSetup:{loadAt:0x86000,head:0x84358,helperCall:0x86005},loop:{runtimeSourceGlobal:0x76526,runtimeLoadAt:0x8600a,pairedStaticSourceOffset:0x1c2c6,pairedStaticLoadAt:0x86010,readSignedRuntimeWordAt:0x86015,negativeOr13Exit:0x86041,exitSentinelWord:13,readSignedStaticWordAt:0x86027,combineHighWordAndLowConstantAt:0x8602d,lowConstant:0xc5,innerCall:0x86038,innerTarget:0x8608c,backJumpAt:0x8603f,backTarget:0x86015},inner:{indexedObject2Base:0x1c264,indexedTableLoadAt:0x86096,globalWriteAt:0x86098,consumerCallAt:0x8609f},afterLoop:{firstProducerCall:0x86041,secondProducerCall:0x8605f,slotHeadLoad:0x8604b,slotHead:0x84348,callbackSetup:0x86066,processSpawnAt:0x86070,callbackEntryRelative:0x1ff44,postSpawnYieldAt:0x86081},classification:{pairedWordInputsAndSentinelBranchesBounded:true,secondProcessConstructionPathAfterLoopQualified:true,actualRuntimeWordStreamKnown:false,terminationForEveryRuntimeStreamGuaranteed:false,arrayIndexLegalRangeEstablished:false,loopExecutionInGameplayObserved:false,secondProcessGuaranteedAllocated:false,sceneOrStageNameProven:false,paletteOrScreenGeometryProven:false,mk2Closed:false}};
fs.mkdirSync(outputDir,{recursive:true});q.o96oReportSha256=hash(Buffer.from(JSON.stringify(o,null,2)+'\n'));
const op=path.join(outputDir,'mk2_writer_to_producer_process_constructor_o96o_2026-10-09.json'),pp=path.join(outputDir,'mk2_runtime_word_dual_source_conditional_producer_o96p_2026-10-09.json');
fs.writeFileSync(op,JSON.stringify(o,null,2)+'\n');fs.writeFileSync(pp,JSON.stringify(q,null,2)+'\n');
console.log(JSON.stringify({passes:['O96O','O96P'],status:'PASS',writerCallers:calls.length,adjacentValues:o.adjacentLiteralValues,conditionalSecondSpawn:q.afterLoop.processSpawnAt,reports:[op,pp]}));
