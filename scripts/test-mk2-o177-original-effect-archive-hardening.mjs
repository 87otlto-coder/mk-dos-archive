/** O177 fail-closed bundle input tests on original user-supplied source assets. */
import fs from 'node:fs';
import {readMK2OriginalEffectFramesO136} from '../src/games/mk2/research/stageOriginalEffectFramesO136.ts';
import {buildAllOriginalEffectFramesArchiveO177} from '../src/games/mk2/research/stageOriginalEffectArchiveO177.ts';
const [exePath,tombPath,portalPath,towerPath]=process.argv.slice(2);
if(!towerPath)throw Error('Usage: node --experimental-strip-types scripts/test-mk2-o177-original-effect-archive-hardening.mjs MK2.EXE TOMB.GRA PORTAL.GRA TOWER.GRA');
const b=p=>new Uint8Array(fs.readFileSync(p)),exe=b(exePath);
const tracks=[];for(const [s,p] of [['tomb',tombPath],['portal',portalPath],['tower',towerPath]])tracks.push(...await readMK2OriginalEffectFramesO136(exe,b(p),s));
const original=await buildAllOriginalEffectFramesArchiveO177(tracks);if(original.manifest.frameCount!==43)throw Error('canonical archive missing frames');
let cases=0;
async function fails(items,why){let caught=false;try{await buildAllOriginalEffectFramesArchiveO177(items)}catch{caught=true}if(!caught)throw Error('O177 incorrectly accepted '+why);cases++}
await fails(tracks.slice(0,5),'missing Tower track');
await fails([...tracks.slice(0,5),tracks[0]],'duplicate Tomb track');
await fails([...tracks.slice(0,5),{...tracks[5],name:'not_real'}],'unknown source track');
await fails(tracks.map((t,i)=>i? t : {...t,sourcePointerObject2:1}),'forged pointer');
await fails(tracks.map((t,i)=>i? t : {...t,controlType:'ZERO_TERMINATED'}),'forged looping source');
await fails(tracks.map((t,i)=>i!==5? t : {...t,paletteQualifiedByRuntime:true}),'forged Tower runtime palette');
await fails(tracks.map((t,i)=>i? t : {...t,animationFPSKnown:true}),'invented timing');
await fails(tracks.map((t,i)=>i? t : {...t,runtimeActivationKnown:true}),'invented activation');
await fails(tracks.map((t,i)=>i? t : {...t,frames:t.frames.map((f,j)=>j?f:{...f,ordinal:55})}),'forged frame ordinal');
await fails(tracks.map((t,i)=>i? t : {...t,frames:t.frames.map((f,j)=>j?f:{...f,indices:new Uint8Array(1)})}),'shortened raw index plane');
await fails(tracks.map((t,i)=>i? t : {...t,frames:t.frames.map((f,j)=>j?f:{...f,mask:new Uint8Array(f.mask.length).fill(2)})}),'nonbinary source mask');
await fails(tracks.map((t,i)=>i? t : {...t,frames:t.frames.map((f,j)=>j?f:{...f,rgba:new Uint8Array(f.rgba.length)})}),'source mask-alpha mismatch');
await fails(tracks.map((t,i)=>i? t : {...t,frames:t.frames.map((f,j)=>j?f:{...f,indices:Uint8Array.from(f.indices,(b,k)=>k===3?b^1:b)})}),'valid-shape but forged index pixel');
await fails(tracks.map((t,i)=>i? t : {...t,frames:t.frames.map((f,j)=>j?f:{...f,rgba:Uint8Array.from(f.rgba,(b,k)=>k===0?b^1:b)})}),'valid-alpha but forged RGB pixel');
await fails(tracks.map((t,i)=>i? t : {...t,frames:t.frames.map((f,j)=>j?f:{...f,sourceX:f.sourceX+1})}),'forged original descriptor offset');
console.log(JSON.stringify({status:'PASS_O177_NEGATIVE_CANONICAL_EXPORT_TESTS',cases,positiveFrames:original.manifest.frameCount}));
