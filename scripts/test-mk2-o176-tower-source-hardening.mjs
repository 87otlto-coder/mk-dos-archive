/** O176 negative original-fixture tests; no game assets bundled. */
import fs from 'node:fs';import {readMK2OriginalEffectFramesO136} from '../src/games/mk2/research/stageOriginalEffectFramesO136.ts';
const [exep,graTower,graPortal]=process.argv.slice(2);if(!graPortal)throw Error('Usage: node --experimental-strip-types scripts/test-mk2-o176-tower-source-hardening.mjs MK2.EXE TOWER.GRA PORTAL.GRA');
const src=p=>new Uint8Array(fs.readFileSync(p));const exe=src(exep),tower=src(graTower),portal=src(graPortal);let checks=0;
async function fails(p,description){let caught=false;try{await p;}catch{caught=true}if(!caught)throw Error('O176 wrongly accepted '+description);checks++}
const orig=await readMK2OriginalEffectFramesO136(exe,tower,'tower');if(orig.length!==1||orig[0].frames.length!==7||orig[0].paletteIsSourceLinkedCandidate!==true||orig[0].paletteQualifiedByRuntime!==false)throw Error('O176 canonical fixture failed');checks++;
await fails(readMK2OriginalEffectFramesO136(exe,portal,'tower'),'wrong resource');
await fails(readMK2OriginalEffectFramesO136(exe,tower,'portal'),'wrong stage');
const e=exe.slice();e[0x89468]^=1;await fails(readMK2OriginalEffectFramesO136(e,tower,'tower'),'replaced palette source');
const e2=exe.slice();e2[0x82e6c]^=1;await fails(readMK2OriginalEffectFramesO136(e2,tower,'tower'),'altered Tower writer opcode');
const e3=exe.slice();e3[0xa0c54+0x16490]^=1;await fails(readMK2OriginalEffectFramesO136(e3,tower,'tower'),'altered descriptor pointer');
const g=tower.slice();g[g.length-2]^=1;await fails(readMK2OriginalEffectFramesO136(exe,g,'tower'),'modified resource bytes');
const pt=await readMK2OriginalEffectFramesO136(exe,portal,'portal');if(pt.length!==3||pt.some(t=>t.paletteIsSourceLinkedCandidate!==false))throw Error('Legacy Portal regression');checks++;
console.log(JSON.stringify({status:'PASS_O176_TOWER_REJECTS_ALTERED_SOURCES',checks}));
