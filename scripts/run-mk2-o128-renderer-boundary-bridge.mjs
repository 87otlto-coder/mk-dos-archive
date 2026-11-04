#!/usr/bin/env node
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {readMK2RendererBoundaryO128} from '../src/games/mk2/research/stageRenderGateBoundaryO128.ts';
if(process.argv.length!==4)throw Error('usage: node --experimental-strip-types scripts/run-mk2-o128-renderer-boundary-bridge.mjs ORIGINAL_MK2.EXE REPORT.json');
const exe=new Uint8Array(await fs.readFile(process.argv[2]));
const r=JSON.parse(await fs.readFile(process.argv[3],'utf8'));
const data=await readMK2RendererBoundaryO128(exe);
let n=0;
for(const [i,v] of data.firstTenDWORDs.entries()){assert.equal(v,r.indexedSource.sampledDWORDs[i]);n++;}
assert.equal(data.firstTenDWORDs.length,r.indexedSource.sourceDWORDsBeforeSeparatelyReferencedAddress);n++;
assert.equal(data.nextRegionObject2,r.followingRegion.object2Start);n++;
assert.equal(data.nextRegionPointerFieldObject2,r.followingRegion.independentPointerFieldObject2);n++;
assert.equal(data.directE8Caller,r.guardedDispatch.directCallerPhysical);n++;
assert.equal(data.flagObject2,r.guardedDispatch.guardGlobalObject2);n++;
assert.equal(data.flagRequiredBitMask,r.guardedDispatch.requiredBitMask);n++;
assert.equal(data.tombResourceId,r.indexedSource.tombResourceIdHighByte);n++;
assert.equal(data.portalResourceId,r.indexedSource.portalResourceIdHighByte);n++;
assert.equal(data.legalIndexMaximumObserved,false);n++;
assert.equal(data.fullRendererArrayLengthEstablished,false);n++;
assert.equal(data.liveFlagObserved,false);n++;
assert.equal(data.liveStageIndexObserved,false);n++;
const tampered=Uint8Array.from(exe);tampered[0x9e118]^=1;
await assert.rejects(readMK2RendererBoundaryO128(tampered),/canonical/);n++;
console.log(JSON.stringify({status:'PASS_O128_BOUNDARY_BROWSER_PYTHON_PARITY',assertions:n}));
