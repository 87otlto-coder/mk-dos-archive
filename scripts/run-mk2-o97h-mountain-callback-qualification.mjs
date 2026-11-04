#!/usr/bin/env node
/** O97H narrowly resolves the selected configuration's one-instruction callback. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const [fixture,root]=process.argv.slice(2);if(!root)throw Error('usage fixture_dir source_root');
const exe=fs.readFileSync(path.join(fixture,'mk2.exe'));
const parent=fs.readFileSync(path.join(root,'mk2_mountain_runtime_setup_install_o97g_2026-10-09.json'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');const P=x=>x+0xa0c54;
if(sha(exe)!=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')throw Error('not authentic MK2 fixture');
const sourcePointer=0x1c2f6,sourcePhysical=P(sourcePointer),callbackObject1=exe.readUInt32LE(sourcePhysical);
const codeBase=0x61c54, callbackPhysical=codeBase+callbackObject1;
if(callbackObject1!==0x21227 || callbackPhysical!==0x82e7b || exe[callbackPhysical]!==0xc3)throw Error('not bare RET callback');
const sequences=[[0x81f41,'8b1883c00450ffd358'],[0x81f4a,'8b1883c004891d225d0700'],[0x81f55,'8b1883c004891df65c0700'],[0x81f60,'8b1883c004']];
for(const [at,hex] of sequences)if(exe.subarray(at,at+hex.length/2).toString('hex')!==hex)throw Error('machine mismatch '+at.toString(16));
const r={format:'mk2_o97h_mountain_preinstaller_callback_bare_return_v1',status:'PASS',fixtureSha256:sha(exe),parentO97gSha256:sha(parent),callback:{fileBackedObject:1,pointerSourceObject2:sourcePointer,pointerSourcePhysical:sourcePhysical,targetObject1Offset:callbackObject1,codeObject1BasePhysical:codeBase,callbackEntryPhysical:callbackPhysical,firstOpcode:exe[callbackPhysical],opcodeMeaning:'RET near',codeBytes:exe.subarray(callbackPhysical,callbackPhysical+1).toString('hex'),pointerLoad:0x81f41,callAt:0x81f47,postCallRestore:0x81f49},machineWitnesses:sequences.map(([at,hex])=>({at,hex})),hypotheses:{callbackMutatesStateBeforeReturn:'REJECTED',callbackReturnsImmediatelyWhenReached:'SUPPORTED',precedingResourceCallsAlwaysReturn:'UNPROVEN',index13ConfigurationExecutesInGameplay:'UNPROVEN',runtimeDrawOfBothSetups:'UNPROVEN',jumpFatalityMeaning:'UNPROVEN'},limitations:'Single-byte RET qualifies only this callback. Invocation, earlier resource-load calls, the remaining installer and actual renderer/scheduler execution remain conditional.'};
const out=path.join(root,'mk2_mountain_preinstaller_bare_ret_o97h_2026-10-09.json');fs.writeFileSync(out,JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({pass:'O97H',status:'PASS',callbackPhysical:callbackPhysical.toString(16),opcode:'C3',sourcePointer:sourcePointer.toString(16)}));
