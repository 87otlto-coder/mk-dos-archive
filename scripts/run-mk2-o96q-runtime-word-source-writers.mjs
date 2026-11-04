#!/usr/bin/env node
/** O96Q: executable direct-write ancestry of O96P's runtime signed-WORD source. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const [fix,out=root]=process.argv.slice(2);if(!fix)throw Error('usage: <mk2 directory> [output]');
const b=fs.readFileSync(path.join(fix,'mk2.exe')), sha=x=>crypto.createHash('sha256').update(x).digest('hex');const h='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';const ck=(x,m)=>{if(!x)throw Error('O96Q '+m)};ck(sha(b)===h,'fixture');
const pb=fs.readFileSync(path.join(root,'mk2_runtime_word_dual_source_conditional_producer_o96p_2026-10-09.json'));const prev=JSON.parse(pb);ck(prev.status==='SUCCESS'&&prev.fixtureSha256===h,'O96P');const u=p=>b.readUInt32LE(p);const patch=(p,s)=>ck(b.subarray(p,p+s.length/2).toString('hex')===s,'bytes '+p.toString(16));const near=(p,d)=>ck(b[p]===0xe8&&p+5+b.readInt32LE(p+1)===d,'CALL '+p.toString(16));
const needle=Buffer.from('26650700','hex'),ops=[];for(let i=0x61c54;i<0xa0c54-3;i++)if(b.subarray(i,i+4).equals(needle))ops.push(i);
ck(JSON.stringify(ops)===JSON.stringify([0x757ad,0x763e9,0x76470,0x85d76,0x8600c,0x97fd3]),'direct operand sites');
patch(0x757aa,'33c0');patch(0x757ac,'a326650700');near(0x757ca,0x97fa0);
patch(0x97fa0,'b806000000');near(0x97fa5,0x645e5);
patch(0x97faa,'48c1e002');patch(0x97fae,'0580af0200');patch(0x97fb3,'8b00');
patch(0x97fb5,'f705dacf0200ffffffff');patch(0x97fc1,'f70506d00200ffffffff');
patch(0x97fcd,'b878b00200');patch(0x97fd2,'a326650700c3');
patch(0x8600a,'8b0d26650700');patch(0x85d75,'a126650700');patch(0x7646f,'a126650700');
const result={format:'mk2_o96q_runtime_word_stream_source_writer_ancestry_v1',status:'SUCCESS',fixtureSha256:h,o96pReportSha256:sha(pb),sourceGlobal:0x76526,directOperandPositions:ops,directStores:[{at:0x757ac,source:'ZERO_EAX',value:0},{at:0x97fd2,source:'DYNAMIC_EAX',sourceSelectors:['INDEXED_DWORD_AT_OBJECT2_0x2AF80','CONDITIONAL_OVERRIDE_OBJECT2_0x2B078']}],directReaders:[0x763e9,0x76470,0x85d76,0x8600c],localInitializationPath:{zeroStoreAt:0x757ac,callDynamicInstallerAt:0x757ca,dynamicInstaller:0x97fa0},installer:{entry:0x97fa0,scalarHelperAt:0x97fa5,selectorBase:0x2af80,selectorTableReadAt:0x97fb3,firstConditionalTestAt:0x97fb5,secondConditionalTestAt:0x97fc1,overrideValue:0x2b078,overrideAt:0x97fcd,finalStoreAt:0x97fd2},classification:{twoDirectStoresAndFourDirectReadsExact:true,localZeroThenInstallerCallProven:true,tableOrOverrideValueCanSourceGlobal:true,runtimeWordContentsEnumerated:false,tableIndexBoundsProven:false,callAndProducerSceneCoexecutionProven:false,stageIdentificationEstablished:false,mk2Closed:false}};
fs.mkdirSync(out,{recursive:true});let file=path.join(out,'mk2_runtime_word_stream_source_writer_ancestry_o96q_2026-10-09.json');fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({pass:'O96Q',status:'PASS',global:'0x76526',stores:result.directStores.length,readers:result.directReaders.length,report:file}));
