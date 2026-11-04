#!/usr/bin/env node
/** O96R: candidate six-way selector and bounded 16-WORD record hypothesis. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [fixture,out=root]=process.argv.slice(2);if(!fixture)throw Error('usage: <mk2-directory> [report-dir]');
const bytes=fs.readFileSync(path.join(fixture,'mk2.exe'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const check=(a,m)=>{if(!a)throw Error(`O96R FAIL: ${m}`)};
check(sha(bytes)===SHA,'authentic MK2.EXE');
const pre=fs.readFileSync(path.join(root,'mk2_runtime_word_stream_source_writer_ancestry_o96q_2026-10-09.json'));
check(JSON.parse(pre).status==='SUCCESS','O96Q prerequisite');
const hex=(p,h)=>check(bytes.subarray(p,p+h.length/2).toString('hex')===h,`machine bytes ${p.toString(16)}`);
const u=(p)=>bytes.readUInt32LE(p);const w=(p)=>bytes.readInt16LE(p);
const base=0xa0c54; const physical=(offset)=>base+offset;
for(const [p,h] of [[0x97fa0,'b806000000'],[0x97fa5,'e83bc6fcff'],[0x97faa,'48c1e002'],[0x97fae,'0580af0200'],[0x97fb3,'8b00'],[0x97fcd,'b878b00200'],[0x97fd2,'a326650700c3'],[0x645e5,'52538bd8'],[0x645ee,'f7e38bc240'],[0x645f3,'5b5ac3'],[0x86015,'0fbf0183c102'],[0x8601b,'a9ffffffff'],[0x86020,'781f'],[0x86022,'83f80d'],[0x86025,'741a']])hex(p,h);
const table=Array.from({length:6},(_,i)=>{
 const entryOffset=0x2af80+i*4,target=u(physical(entryOffset));
 check(target===0x2af98+i*32,'contiguous 32-byte pointer target '+i);
 const words=Array.from({length:16},(_,j)=>w(physical(target+j*2)));
 check(words.slice().sort((a,b)=>a-b).join(',')===Array.from({length:16},(_,j)=>j-1).join(','),'permutation domain '+i);
 check(words[14]===13&&words[15]===-1,'two distinct stop tokens order '+i);
 return {index:i,entryOffset,targetOffset:target,physicalOffset:physical(target),words,sha256:sha(bytes.subarray(physical(target),physical(target)+32))};
});
const overrideOffset=0x2b078,overrideWords=Array.from({length:16},(_,j)=>w(physical(overrideOffset+2*j)));
check(overrideWords[14]===13&&overrideWords[15]===-1,'override stop positions');
const uniq=new Set(table.map(x=>x.sha256));check(uniq.size===5&&table[2].sha256===table[3].sha256,'five unique sequences and exact repeat pair');
const report={format:'mk2_o96r_indexed_word_records_v1',status:'SUCCESS',fixtureSha256:SHA,o96qReportSha256:sha(pre),object2FileBackedPhysicalBase:base,selector:{helperEntry:0x645e5,callerAt:0x97fa0,argument:6,multiplyAt:0x645ee,incrementAt:0x645f2,decrementAt:0x97faa,provableTableIndexRange:[0,5],runtimeSelectionUnknown:true,conditionalOverrideAt:0x97fcd,overrideTargetOffset:overrideOffset},tableBaseOffset:0x2af80,entries:table,override:{offset:overrideOffset,physicalOffset:physical(overrideOffset),words:overrideWords},hypotheses:[{id:'H1',claim:'The six selectable records are fixed signed-WORD permutations of 0..14 terminated by -1',verdict:'SUPPORTED_STRUCTURALLY'},{id:'H2',claim:'The 0x86015 loop necessarily runs through each -1 terminator',verdict:'REJECTED_BY_EARLIER_13_TERMINATOR'},{id:'H3',claim:'The conditional override is an empty or immediate-stop stream',verdict:'REJECTED_BY_RECORD_BYTES'},{id:'H4',claim:'These records identify a named MK2 stage or timing units',verdict:'UNPROVEN'}],boundary:{sixSelectorEntriesStructurallyBounded:true,selectedRuntimeVariantUnknown:true,overrideConditionsUnresolved:true,streamGameplaySemanticsUnknown:true,stageReconstructionCompleted:false}};
fs.mkdirSync(out,{recursive:true});const name='mk2_six_way_signed_word_stream_records_o96r_2026-10-09.json';fs.writeFileSync(path.join(out,name),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:'O96R',status:'PASS',slots:table.length,distinctRecordBodies:uniq.size,selectorRange:report.selector.provableTableIndexRange,report:path.join(out,name)}));
