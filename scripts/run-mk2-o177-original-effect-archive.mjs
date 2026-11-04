/** Canonical fixture runner, outputs user-derived ZIP for independent Python audit. */
import fs from 'node:fs';
import {readMK2OriginalEffectFramesO136} from '../src/games/mk2/research/stageOriginalEffectFramesO136.ts';
import {buildAllOriginalEffectFramesArchiveO177} from '../src/games/mk2/research/stageOriginalEffectArchiveO177.ts';
const [exePath,tombPath,portalPath,towerPath,outPath]=process.argv.slice(2);
if(!outPath)throw Error('Usage: node --experimental-strip-types scripts/run-mk2-o177-original-effect-archive.mjs MK2.EXE TOMB.GRA PORTAL.GRA TOWER.GRA OUT.zip');
const b=p=>new Uint8Array(fs.readFileSync(p)),exe=b(exePath);
const tracks=[];for(const [s,p] of [['tomb',tombPath],['portal',portalPath],['tower',towerPath]])tracks.push(...await readMK2OriginalEffectFramesO136(exe,b(p),s));
const result=await buildAllOriginalEffectFramesArchiveO177(tracks);
fs.writeFileSync(outPath,result.zipBytes);
console.log(JSON.stringify({status:'O177_ARCHIVE_EMITTED_SOURCE_ONLY',file:outPath,tracks:result.manifest.sequenceCount,frames:result.manifest.frameCount,bytes:result.zipBytes.length}));
