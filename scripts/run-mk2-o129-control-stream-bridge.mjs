#!/usr/bin/env node
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {readMK2FixedControlStreamsO129} from '../src/games/mk2/research/stageControlStreamsO129.ts';
if(process.argv.length!==4)throw Error('usage: node --experimental-strip-types scripts/run-mk2-o129-control-stream-bridge.mjs ORIGINAL_MK2.EXE O129_REPORT.json');
const e=new Uint8Array(await fs.readFile(process.argv[2]));
const r=JSON.parse(await fs.readFile(process.argv[3],'utf8'));
const actual=await readMK2FixedControlStreamsO129(e);let n=0;
for(let i=0;i<3;i++){
 const a=actual.fixedStreams[i],b=r.fixedStreams[i];
 assert.equal(a.object2Start,b.object2Offset);n++;
 assert.equal(a.terminatorObject2,b.terminatorObject2Offset);n++;
 assert.equal(a.containsMinusOne,b.containsMinusOne);n++;
 assert.equal(a.pointerPairs.length,b.positiveCount);n++;
 for(let j=0;j<a.pointerPairs.length;j++){
  assert.equal(a.pointerPairs[j][0],b.positivePairs[j].tokenPointerObject2);n++;
  assert.equal(a.pointerPairs[j][1],b.positivePairs[j].payloadPointerObject2);n++;
 }
}
assert.equal(actual.dynamicPointerLoadPhysical,r.dynamicPointerLoad.physical);n++;
assert.equal(actual.minusOneRendererCaller,0x93585);n++; // 0x93585
assert.equal(actual.liveStreamPointerObserved,false);n++;
assert.equal(actual.allDynamicStreamsEnumerated,false);n++;
const forged=Uint8Array.from(e);forged[0x93585]^=1;
await assert.rejects(readMK2FixedControlStreamsO129(forged),/canonical/);n++;
console.log(JSON.stringify({status:'PASS_O129_BROWSER_PYTHON_STREAM_PARITY',assertions:n}));
