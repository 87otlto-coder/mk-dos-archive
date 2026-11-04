/** O176: independent Python O137 source output vs browser Tower extension parity.
 * A single original descriptor must match geometry, pixels/masks, and source-candidate RGBA.
 */
import fs from 'node:fs';import crypto from 'node:crypto';
import {readMK2OriginalEffectFramesO136} from '../src/games/mk2/research/stageOriginalEffectFramesO136.ts';
const [exeFile,graFile,manifestFile]=process.argv.slice(2);
if(!manifestFile)throw Error('Usage: node --experimental-strip-types scripts/run-mk2-o176-tower-original-effect-bridge.mjs MK2.EXE TOWER.GRA O137_TOWER_SOURCE_FRAMES.json');
const raw=p=>new Uint8Array(fs.readFileSync(p)),hash=buf=>crypto.createHash('sha256').update(buf).digest('hex');
const source=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
const tracks=await readMK2OriginalEffectFramesO136(raw(exeFile),raw(graFile),'tower');
let checks=0;
function eq(a,b,msg){if(JSON.stringify(a)!==JSON.stringify(b))throw Error('O176 '+msg+' difference: '+a+' != '+b);checks++;}
eq(tracks.length,1,'Tower track count');const track=tracks[0];
eq(track.name,'tower_original_effect','Tower original track');
eq(track.sourcePointerObject2,source.sourceFrameListObject2,'Tower list pointer');
eq(track.frames.length,source.originalSourceFrameCount,'Tower count');
eq(track.controlType,'ONE_MARKER_BACK_REFERENCE','Tower loop');
eq(track.paletteIsSourceLinkedCandidate,true,'Tower source-candidate palette');
eq(track.paletteQualifiedByRuntime,false,'Tower runtime palette unverified');
eq(track.animationFPSKnown,false,'Tower FPS unverified');
eq(track.runtimeActivationKnown,false,'Tower activation unverified');
for(const [i,f] of track.frames.entries()){
 const m=source.frames[i];
 eq(f.ordinal,m.frameOrdinal,'frame ordinal');eq(f.descriptorObject2,m.originalDescriptorObject2,'descriptor pointer');
 eq(f.width,m.originalWidth,'width');eq(f.height,m.originalHeight,'height');
 eq(f.sourceX,m.originalX,'source x');eq(f.sourceY,m.originalY,'source y');
 eq(f.graStart,m.sourceOffset,'source start');eq(f.graEnd,m.sourceEndExclusive,'source end');
 eq(hash(f.indices),m.indicesSHA256,'original raw indices');eq(hash(f.mask),m.maskSHA256,'original opacity mask');
 eq(hash(f.rgba),m.rgbaSHA256,'source-palette-candidate RGBA');
}
console.log(JSON.stringify({status:'PASS_O176_TOWER_SOURCE_RGBA_PARITY',checks,frames:track.frames.length,candidatePaletteOnly:true}));
