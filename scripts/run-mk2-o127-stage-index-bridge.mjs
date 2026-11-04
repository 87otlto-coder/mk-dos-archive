#!/usr/bin/env node
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {readMK2StageIndexConsumersO127} from '../src/games/mk2/research/stageIndexConsumersO127.ts';
if(process.argv.length!==4)throw Error('usage: node --experimental-strip-types scripts/run-mk2-o127-stage-index-bridge.mjs ORIGINAL_MK2.EXE O127_REPORT.json');
const exe=new Uint8Array(await fs.readFile(process.argv[2]));
const report=JSON.parse(await fs.readFile(process.argv[3],'utf8'));
const actual=await readMK2StageIndexConsumersO127(exe);let assertions=0;
assert.deepEqual(actual.directCallers,report.directCallers.map(x=>x.callPhysical));assertions++;
assert.deepEqual(actual.adjacentConstantCallers,
 report.directCallers.filter(x=>x.immediatePreCallValue!==undefined).map(x=>({callPhysical:x.callPhysical,writtenIndex:x.immediatePreCallValue})));assertions++;
for(const [i,n] of report.renderer.renderTableDWORDs.entries()){
 assert.equal(actual.renderAdjustments[i],n);assertions++;
}
assert.equal(actual.tombSourceIndex,1);assertions++;
assert.equal(actual.portalSourceIndex,7);assertions++;
assert.equal(actual.tombRawAdjustment,report.renderer.renderTableDWORDs[1]);assertions++;
assert.equal(actual.portalRawAdjustment,report.renderer.renderTableDWORDs[7]);assertions++;
assert.equal(actual.runtimeIndexObserved,false);assertions++;
assert.equal(actual.runtimeCameraObserved,false);assertions++;
assert.equal(actual.screenMeaningEstablished,false);assertions++;
const tampered=Uint8Array.from(exe);tampered[0x9e16a]^=1;
await assert.rejects(readMK2StageIndexConsumersO127(tampered),/fingerprint/);assertions++;
console.log(JSON.stringify({status:'PASS_O127_BROWSER_PYTHON_INDEX_ADJUSTMENT_PARITY',assertions}));
