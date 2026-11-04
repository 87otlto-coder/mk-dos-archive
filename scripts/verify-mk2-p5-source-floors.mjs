#!/usr/bin/env node
// Usage: node --experimental-strip-types scripts/verify-mk2-p5-source-floors.mjs /path/to/mk2
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildMK2P5SourceFloorAssets} from '../src/core/assets/mk2P5SourceFloors.ts';

const root=process.argv[2];if(!root)throw Error('Pass canonical MK2 installation directory');
const names=['mk2.exe','battle.gra','tower.gra','armory.gra','arena.gra'];
const files=new Map();for(const n of names)files.set(n,new Uint8Array(await fs.readFile(path.join(root,n))));
function makeSource(map=files){return {
 directoryName:'P5 canonical MK2',isSynthetic:true,
 async listRecursive(){return Array.from(map,([name,bytes])=>({path:name,name:path.basename(name),extension:name.split('.').at(-1).toUpperCase(),size:bytes.length}));},
 async readSlice(p,o,n){const b=map.get(p.toLowerCase());if(!b)throw Error('Not found '+p);return b.slice(o,o+n);}
};}
const sha=b=>createHash('sha256').update(b).digest('hex');
const expected={battle:[59436,40,'4ba70a5724b78e35d583a8b18b86d743c8eaa94e4dc07e124c87473260e343e6'],
 tower:[56268,64,'39433e089201493902762ddefc891a7fc62653ea3c1a06f8a85c7c509bd2193a'],
 armory:[126336,56,'7f8c956a82b7f7b062b05a1f37b90f604a7e7a1c284c6209ba81bd03f7125226'],
 arena:[90488,40,'c0a80a4ae3adec186475fd04dbd597b2f4d79f37a43a6e30cfe359a5da442ac5']};
let checks=0;const check=(actual,expected,msg)=>{assert.deepEqual(actual,expected,msg);checks++;};
const run=await buildMK2P5SourceFloorAssets(makeSource());
check(run.assets.length,8,'all 4 floors yield both preview and indices');
check(run.stageResults.map(x=>x.status),Array(4).fill('VERIFIED'));
check(new Set(run.assets.map(x=>x.id)).size,8);
for(const [stage,[offset,rows,planeSha]] of Object.entries(expected)){
 const base=files.get(stage+'.gra'),plane=base.subarray(offset);const asset=run.assets.find(x=>x.id===`mk2-floor:${stage}:indices`),preview=run.assets.find(x=>x.id===`mk2-floor:${stage}:indices-preview`);
 check(asset.bytes.length,rows*896);check(sha(asset.bytes),planeSha);check(sha(plane),planeSha);
 check(Buffer.compare(Buffer.from(asset.bytes),Buffer.from(plane)),0);
 check(preview.width,896);check(preview.height,rows);check(preview.rgba.length,rows*896*4);
 check(preview.metadata.originalPaletteKnown,false);
 check(preview.source.offset,offset);check(preview.source.length,rows*896);
 for(let i=0;i<plane.length;i+=Math.max(1,Math.floor(plane.length/251))){
  const v=plane[i];check([...preview.rgba.subarray(i*4,i*4+4)],[v,v,v,255]);
 }
}
let wrong= new Map(files);const badExe=Uint8Array.from(wrong.get('mk2.exe'));badExe[200]^=1;wrong.set('mk2.exe',badExe);
await assert.rejects(buildMK2P5SourceFloorAssets(makeSource(wrong)),/canonical MK2\.EXE/);checks++;
wrong=new Map(files);wrong.delete('tower.gra');const absent=await buildMK2P5SourceFloorAssets(makeSource(wrong));
check(absent.assets.length,6);check(absent.stageResults.find(x=>x.stage==='tower').status,'UNAVAILABLE');
wrong=new Map(files);const bad=Uint8Array.from(wrong.get('armory.gra'));bad[bad.length-1]^=1;wrong.set('armory.gra',bad);
const tampered=await buildMK2P5SourceFloorAssets(makeSource(wrong));check(tampered.assets.length,6);
check(tampered.stageResults.find(x=>x.stage==='armory').reason,'canonical GRA SHA-256 mismatch');
wrong=new Map(files);wrong.set('subdir/battle.gra',wrong.get('battle.gra'));
const ambiguous=await buildMK2P5SourceFloorAssets(makeSource(wrong));
// Synthetic map source lists both files; independent battle stage is rejected.
check(ambiguous.assets.length,6);check(ambiguous.stageResults.find(x=>x.stage==='battle').status,'UNAVAILABLE');
const report={pass:'P5',status:'PASS',checks,assetCount:run.assets.length,authenticatedStageCount:4,
 dimensions:Object.fromEntries(Object.entries(expected).map(([k,v])=>[k,{width:896,height:v[1],offset:v[0],planeSha256:v[2]}])),
 negativeTests:['corrupt original MK2.EXE rejected','missing Tower rejected locally','tampered Armory rejected locally','duplicate Battle resource rejected locally'],
 claims:{originalIndexedPixels:'VERIFIED',nativeWidth:896,paletteBinding:'UNKNOWN',cameraPosition:'UNKNOWN',drawOrder:'UNKNOWN',animationTiming:'UNKNOWN'}};
console.log(JSON.stringify(report,null,2));
