#!/usr/bin/env node
// Usage: node --experimental-strip-types scripts/run-mk2-o116-observed-floor-bridge.mjs <user-owned-original-GRA-directory>
// SHA256 cross-language output digests are O116 independently generated from the original MK2 fixture and pinned O115 evidence.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

if(!process.argv[2])throw new Error('Provide your original TOMB.GRA and PORTAL.GRA directory; no game files bundled.');
const bridge=await import(pathToFileURL(resolve('src/games/mk2/research/observedStageFloorPreviewO116.ts')).href);
const expected={
 portal:{sha:'7847decd98d78d2e23cd1dcf6550eb676c6cbe08e268fd2f16cf426e2e177200',rows:40},
 tomb:{sha:'836860df914d45c5db111312c9ba0e08308f72232f0833f8fd6d4bab5e1f244f',rows:48},
};
let checks=0;
function demand(ok,msg){if(!ok)throw Error('O116 browser bridge: '+msg);checks++;}
async function rejects(f,msg){let failed=false;try{await f();}catch{failed=true;}demand(failed,msg);}
const original={};
for(const stage of ['tomb','portal']){
 const orig=new Uint8Array(await readFile(resolve(process.argv[2],`${stage}.gra`)));
 original[stage]=orig;
 const result=await bridge.renderMK2ObservedStageFloorO116(stage,orig);
 demand(result.width===320&&result.height===expected[stage].rows,`${stage} geometry`);
 demand(result.provenance===bridge.O116_FLOOR_QUALIFICATION,`${stage} witness boundary`);
 demand(result.originalWitnessScreenshotSHA256.length===64,`${stage} screenshot sha`);
 const got=createHash('sha256').update(result.rgba).digest('hex');
 demand(got===expected[stage].sha,`${stage} independently generated Python RGBA bytes mismatch: ${got}`);
 demand([...result.rgba].filter((_,i)=>i%4===3).every(x=>x===255),`${stage} RGBA opacity`);
 await rejects(()=>bridge.renderMK2ObservedStageFloorO116(stage,orig,-1),`${stage} reject negative crop`);
 await rejects(()=>bridge.renderMK2ObservedStageFloorO116(stage,orig,577),`${stage} reject overflow crop`);
 await rejects(()=>bridge.renderMK2ObservedStageFloorO116(stage,orig,0,-1),`${stage} reject negative source row`);
 await rejects(()=>bridge.renderMK2ObservedStageFloorO116(stage,orig,0,expected[stage].rows),`${stage} reject row overflow`);
 const tampered=orig.slice();tampered[tampered.length-1]^=1;
 await rejects(()=>bridge.renderMK2ObservedStageFloorO116(stage,tampered),`${stage} reject modified GRA`);
}
const fakeSource={isSynthetic:false,async listRecursive(){return Object.entries(original).map(([s,b])=>({name:s.toUpperCase()+'.GRA',path:s,size:b.length}));},async readSlice(s,o,n){return original[s].subarray(o,o+n)}};
for(const stage of ['tomb','portal']){
 const result=await bridge.previewMK2ObservedFloorFromDirectoryO116(fakeSource,stage);
 demand(result.height===expected[stage].rows,`${stage} real directory path`);
}
await rejects(()=>bridge.previewMK2ObservedFloorFromDirectoryO116({...fakeSource,isSynthetic:true},'portal'),'no synthetic source accepted');
await rejects(()=>bridge.previewMK2ObservedFloorFromDirectoryO116({...fakeSource,listRecursive:async()=>[]},'portal'),'missing source rejected');
await rejects(()=>bridge.previewMK2ObservedFloorFromDirectoryO116({...fakeSource,listRecursive:async()=>[...(await fakeSource.listRecursive()),{name:'PORTAL.GRA',path:'duplicate',size:0}]},'portal'),'duplicates rejected');
await rejects(()=>bridge.previewMK2ObservedFloorFromDirectoryO116({...fakeSource,readSlice:async()=>new Uint8Array(0)},'portal'),'truncated read rejected');
console.log(JSON.stringify({status:'PASS',checks,stages:2,expectedRGBA_SHA256:expected,qualifier:bridge.O116_FLOOR_QUALIFICATION},null,2));
