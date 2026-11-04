#!/usr/bin/env node
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {readMK2ConditionalStageRootTablesO125} from '../src/games/mk2/research/stageConfigDispatchO125.ts';
if(process.argv.length!==4)throw Error('usage: node --experimental-strip-types scripts/run-mk2-o126-mode-lifecycle-bridge.mjs ORIGINAL_MK2.EXE O126_REPORT.json');
const exe=await fs.readFile(process.argv[2]);const report=JSON.parse(await fs.readFile(process.argv[3],'utf8'));
const actual=await readMK2ConditionalStageRootTablesO125(new Uint8Array(exe));let checks=0;
const source=actual.sourceModeLifecycle;
assert.equal(source.defaultMode2ConditionalOnChecksumMismatch,true);checks++;
assert.deepEqual(source.temporaryMode3Writes,report.temporaryOverrides.map(r=>r.write3Physical));checks+=2;
assert.equal(source.modeBackupAddress,report.backupRestore.savedCopyObject2Offset);checks++;
assert.deepEqual(source.mode1FallbackDifferentIndices,report.dispatch.mode1VersusFallbackDifferentIndices);checks+=31;
assert.equal(source.runtimeModeKnown,false);checks++;
for(const [name,index] of [['tomb',1],['portal',7]]){
 for(const [mode,roots] of Object.entries(report.dispatch.tombRootIndex1)){
  if(name==='portal')break;
  assert.equal(actual.stageRoots[name][mode],roots);checks++;
 }
 if(name==='portal')for(const [mode,root] of Object.entries(report.dispatch.portalRootIndex7)){
  assert.equal(actual.stageRoots[name][mode],root);checks++;
 }
}
for(let i=0;i<31;i++){
 const differs=actual.tables.mode_equals_1[i]!==actual.tables.mode_other[i];
 assert.equal(differs,[0,4].includes(i));checks++;
}
const bad=Uint8Array.from(exe);bad[0x9b284]^=0x01;
await assert.rejects(readMK2ConditionalStageRootTablesO125(bad),/not canonical/);checks++;
console.log(JSON.stringify({status:'PASS_BROWSER_PYTHON_O126_MODE_PARITY',checks,mode1FallbackDifferences:source.mode1FallbackDifferentIndices}));
