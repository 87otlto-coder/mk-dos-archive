#!/usr/bin/env node
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {readMK2StageDynamicStreamsO130} from '../src/games/mk2/research/stageDynamicStreamsO130.ts';
import {readMK2StageRowGeometryO131,illustrateMK2StageRowGeometryO131} from '../src/games/mk2/research/stagePackedFloorGeometryO131.ts';
if(process.argv.length!==4)throw Error('usage: node --experimental-strip-types SCRIPT MK2.EXE O131_GEOMETRY.json');
const exe=new Uint8Array(await fs.readFile(process.argv[2]));const report=JSON.parse(await fs.readFile(process.argv[3],'utf8'));
const auth=await readMK2StageDynamicStreamsO130(exe),got=readMK2StageRowGeometryO131(exe,auth);
let assertions=0;assert.equal(got.length,7);assertions++;
for(let i=0;i<got.length;i++){
 const a=got[i],b=report.stages[i];
 for(const [left,right] of [['stageIndex','stageIndex'],['resourceID','resourceID'],['resourceName','resourceName'],
  ['commandObject2','commandObject2'],['packedSourceDWORD','packedSourceDWORD'],['packedSuffixStart','packedSuffixStart'],
  ['sourceRuntimePointerObject2','sourceRuntimePointerObject2'],['rawDestinationY','rawDestinationY'],['requestedRows','requestedRows']]){
  assert.equal(a[left],b[right]);assertions++;
 }
 assert.equal(a.illustratedZeroScrollVisibleRows,b.zeroScrollIllustration.visibleRows);assertions++;
 assert.equal(a.liveValuesObserved,false);assertions++;
}
for(const y of [147,158,159,164,172])for(const scroll of [-8,-1,0,1,8])for(const cam of [280,287,288,289,300]){
 const v=illustrateMK2StageRowGeometryO131(y,56,scroll*65536,cam);
 const dest=(y-scroll)>>>0,expected=dest>=200?0:Math.min(56,200-dest);
 assert.equal(v.visibleRows,expected);assertions++;
 assert.equal(v.step16_16,Math.trunc((288-cam)*65536/112));assertions++;
}
const modified=Uint8Array.from(exe);modified[0x9e15b]^=1;
await assert.rejects(readMK2StageDynamicStreamsO130(modified),/canonical/);assertions++;
assert.throws(()=>readMK2StageRowGeometryO131(modified,auth),/opcode/);assertions++;
console.log(JSON.stringify({status:'PASS_O131_BROWSER_PYTHON_SOURCE_PARITY',assertions,stageEntries:got.length}));
