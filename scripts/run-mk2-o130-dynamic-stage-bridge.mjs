#!/usr/bin/env node
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {readMK2StageDynamicStreamsO130} from '../src/games/mk2/research/stageDynamicStreamsO130.ts';
if(process.argv.length!==4)throw Error('usage: node --experimental-strip-types script original_MK2.EXE O130_REPORT.json');
const b=new Uint8Array(await fs.readFile(process.argv[2]));
const doc=JSON.parse(await fs.readFile(process.argv[3],'utf8'));
const browser=await readMK2StageDynamicStreamsO130(b);let n=0;
assert.equal(browser.stages.length,10);n++;
for(const v of browser.stages){
 const r=doc.firstTenConfigurationSummary[v.index];assert.equal(v.index,r.configurationIndex);n++;
 assert.equal(v.resourceID,r.resourceID);n++;
 assert.equal(v.resourceName,r.resourceName);n++;
 assert.equal(v.streamObject2,r.streamObject2);n++;
 assert.equal(v.drawCommands.length,r.drawCount);n++;
 for(let mode=0;mode<3;mode++){const root=doc.rootTables[['mode_equals_2','mode_equals_1','mode_other'][mode]][v.index].rootObject2;assert.equal(v.rootsByMode[mode],root);n++;}
 const item=doc.streams.find(s=>s.object2Offset===v.streamObject2);assert.ok(item);n++;
 assert.equal(v.pairCount,item.pairCount);n++;
 assert.equal(v.otherNegativeCount,item.otherNegativeCount);n++;
 for(let i=0;i<v.drawCommands.length;i++){
  const d=v.drawCommands[i],want=r.drawCommands[i];
  assert.equal(d.at,want.object2Offset);n++;
  assert.equal(d.sourcePointer,want.sourcePointerObject2);n++;
  assert.equal(d.rawParameter2,want.rawParameter2);n++;
  assert.equal(d.rawParameter3,want.rawParameter3);n++;
 }
}
assert.equal(browser.liveValuesObserved,false);n++;
const modified=Uint8Array.from(b);modified[0x81f55]^=1;
await assert.rejects(readMK2StageDynamicStreamsO130(modified),/canonical/);n++;
console.log(JSON.stringify({status:'PASS_O130_BROWSER_PYTHON_PARITY',assertions:n}));
