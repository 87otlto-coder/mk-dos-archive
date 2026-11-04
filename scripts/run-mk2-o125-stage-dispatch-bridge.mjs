#!/usr/bin/env node
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {readMK2ConditionalStageRootTablesO125} from '../src/games/mk2/research/stageConfigDispatchO125.ts';
if(process.argv.length!==4){console.error('usage: node --experimental-strip-types scripts/run-mk2-o125-stage-dispatch-bridge.mjs ORIGINAL_MK2.EXE O125_REPORT.json');process.exit(2)}
const [exe,report]=await Promise.all([fs.readFile(process.argv[2]),fs.readFile(process.argv[3],'utf8')]);
const truth=JSON.parse(report);const actual=await readMK2ConditionalStageRootTablesO125(new Uint8Array(exe));let checked=0;
for(const [name,table] of Object.entries(truth.tables)){
 assert.deepEqual(actual.tables[name],table.entries.map(e=>e.rootObject2));checked+=31;
 for(const i of [1,7]){
  const id=i===1?'tomb':'portal';assert.equal(actual.stageRoots[id][name],table.entries[i].rootObject2);checked++;
 }
}
assert.deepEqual(actual.changingIndices,truth.changingIndicesByMode);checked++;
assert.equal(actual.runtimeModeObserved,false);assert.equal(actual.runtimeStageIndexObserved,false);checked+=2;
await assert.rejects(readMK2ConditionalStageRootTablesO125(new Uint8Array(exe.subarray(0,800000))),/wrong original/);checked++;
const corrupt=Uint8Array.from(exe);corrupt[0x15bec+0xa0c54]^=1;
await assert.rejects(readMK2ConditionalStageRootTablesO125(corrupt),/not canonical/);checked++;
console.log(JSON.stringify({status:'PASS_BROWSER_PYTHON_O125_PARITY',checked,rootCount:actual.tables.mode_equals_2.length,modeDependent:actual.changingIndices}));
