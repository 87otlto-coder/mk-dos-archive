/* O132 node bridge: read ONLY user-supplied EXE/GRA; match full source indices + RGBA hashes in manifest. */
import fs from 'node:fs';import crypto from 'node:crypto';
import {renderMK2FullSourceFloorO132} from '../src/games/mk2/research/stageNativeSourceFloorO132.ts';
const [exePath,tombPath,portalPath,manifestPath]=process.argv.slice(2);
if(!exePath||!tombPath||!portalPath||!manifestPath)throw Error('Usage: node --experimental-strip-types scripts/run-mk2-o132-full-source-bridge.mjs MK2.EXE TOMB.GRA PORTAL.GRA O132_SCENE_LAYERS.json');
const file=p=>new Uint8Array(fs.readFileSync(p));const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));const exe=file(exePath);
let tests=0;
for(const [stage,p] of [['tomb',tombPath],['portal',portalPath]]){
 const info=manifest.stages.find(s=>s.stage===stage);
 if(!info)throw Error('missing stage in manifest '+stage);
 const out=await renderMK2FullSourceFloorO132(exe,file(p),stage);
 function equal(a,b,label){if(a!==b)throw Error(stage+' mismatch '+label+' '+a+' '+b);tests++}
 equal(out.width,896,'width');equal(out.height,info.packedFloor.nativeDimensions[1],'height');
 equal(hash(out.indices),info.packedFloor.sourceIndexSHA256,'source indices');
 equal(hash(out.rgba),info.packedFloor.rgbaSHA256,'rgba');
 equal(out.cameraCropApplied,false,'crop');equal(out.screenRowClippingApplied,false,'clip');
 equal(out.animationRecovered,false,'animation');equal(out.parallaxRecovered,false,'parallax');
}
console.log(JSON.stringify({status:'PASS_O132_JS_PYTHON_SOURCE_PARITY',assertions:tests,nativeStageFloors:2}));
