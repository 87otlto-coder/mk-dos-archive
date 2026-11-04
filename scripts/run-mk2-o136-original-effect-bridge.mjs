import fs from 'node:fs';import crypto from 'node:crypto';
import {readMK2OriginalEffectFramesO136} from '../src/games/mk2/research/stageOriginalEffectFramesO136.ts';
const [exePath,graTomb,graPortal,manifestPath]=process.argv.slice(2);
if(!manifestPath)throw Error('Usage: node scripts/run-mk2-o136-original-effect-bridge.mjs MK2.EXE TOMB.GRA PORTAL.GRA O136_FRAME_SEQUENCE_MANIFEST.json');
const b=p=>new Uint8Array(fs.readFileSync(p)), exe=b(exePath),manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');let checks=0;
function eq(a,b,label){if(JSON.stringify(a)!==JSON.stringify(b))throw Error('O136 TS bridge '+label+': '+a+' != '+b);checks++;}
for(const [stage,path] of [['tomb',graTomb],['portal',graPortal]]){
 const tracks=await readMK2OriginalEffectFramesO136(exe,b(path),stage);
 eq(tracks.length,stage==='tomb'?2:3,'original source-ordered tracks');
 for(const t of tracks){
  const py=manifest.tracks.find(x=>x.name===t.name);if(!py)throw Error('track missing');
  eq(t.sourcePointerObject2,py.sourceFrameListObject2,'source list');
  eq(t.controlType,py.sourceControlFlow,'loop semantics');
  eq(t.frames.length,py.sourceFrameCount,'count');
  eq(t.animationFPSKnown,false,'unverified fps');eq(t.runtimeActivationKnown,false,'unverified runtime');
  for(let i=0;i<t.frames.length;i++){
   const f=t.frames[i],record=py.frames[i];
   eq(f.ordinal,i,'ordinal');eq(f.width,record.sourceWidth,'width');eq(f.height,record.sourceHeight,'height');
   eq(f.sourceX,record.signedSourceX,'descriptor x');eq(f.sourceY,record.signedSourceY,'descriptor y');
   eq(f.graStart,record.streamStart,'stream start');eq(f.graEnd,record.streamEndExclusive,'stream end');
   eq(f.descriptorObject2,record.descriptorObject2,'descriptor pointer');
   eq(sha(f.indices),record.paletteIndexSHA256,'source indices');
   eq(sha(f.mask),record.opacityMaskSHA256,'alpha mask');eq(sha(f.rgba),record.rgbaSHA256,'RGBA pixels');
  }
 }
}
console.log(JSON.stringify({status:'PASS_O136_ORIGINAL_EFFECT_FRAMES_PARITY',checks}));
