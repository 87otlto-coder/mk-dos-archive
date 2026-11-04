/** O177: lossless source-index/mask + independently decodable RGBA PNG stage-effect archive.
 * Inputs MUST come from the canonical O136/O176 original EXE/GRA read-only decoder.
 * No animation clock, runtime palette choice, positions, or activation is invented.
 */
import {buildStoredZip} from '../../../core/research/researchArtifactDownloads.ts';
import {encodeOriginalEffectRgbaPngO177} from './stageSourcePngO177.ts';
import type {O136EffectTrack, StageO136} from './stageOriginalEffectFramesO136.ts';
import {verifySourceFrameWitnessO181} from './stageOriginalEffectWitnessO181.ts';

const expected:Readonly<Record<string,{stage:StageO136;count:number;control:string;source:number}>>={
 tomb_flying_a:{stage:'tomb',count:8,control:'ONE_MARKER_BACK_REFERENCE',source:0x17814},
 tomb_flying_b:{stage:'tomb',count:8,control:'ONE_MARKER_BACK_REFERENCE',source:0x177ec},
 portal_swaying:{stage:'portal',count:7,control:'ONE_MARKER_BACK_REFERENCE',source:0x164b4},
 portal_hanging:{stage:'portal',count:7,control:'ZERO_TERMINATED',source:0x164d8},
 portal_electric:{stage:'portal',count:6,control:'ZERO_TERMINATED',source:0x164f8},
 tower_original_effect:{stage:'tower',count:7,control:'ONE_MARKER_BACK_REFERENCE',source:0x16490}
};
const utf8=new TextEncoder();
function ensure(ok:unknown,msg:string):asserts ok {if(!ok)throw Error('O177 full original frame archive: '+msg)}
async function digest(bytes:Uint8Array):Promise<string>{const d=await crypto.subtle.digest('SHA-256',bytes.slice().buffer);return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,'0')).join('')}
export interface O177Bundle {zipBytes:Uint8Array;manifest:Record<string,unknown>;filename:'MK2_O177_ALL_43_ORIGINAL_EFFECT_FRAMES.zip'}
/** Strict full-set contract, rather than silently offering an incomplete authoritative export. */
export async function buildAllOriginalEffectFramesArchiveO177(tracks:readonly O136EffectTrack[]):Promise<O177Bundle>{
 ensure(tracks.length===6,'requires all six original stage-effect tracks');
 const byName=new Map<string,O136EffectTrack>();
 for(const t of tracks){ensure(Object.hasOwn(expected,t.name),'unexpected track '+t.name);ensure(!byName.has(t.name),'duplicate track');byName.set(t.name,t)}
 const files:Array<{name:string;bytes:Uint8Array}>=[],manifestTracks:Record<string,unknown>[]=[];
 let total=0;
 for(const [name,definition] of Object.entries(expected)){
  const t=byName.get(name);ensure(t,'missing '+name);
  ensure(t.stage===definition.stage&&t.frames.length===definition.count&&t.sourcePointerObject2===definition.source&&t.controlType===definition.control,'source track identity '+name);
  ensure(t.animationFPSKnown===false&&t.runtimeActivationKnown===false&&t.worldCoordinatesKnown===false&&t.paletteQualifiedByRuntime===false,'source uncertainty flags '+name);
  ensure(t.paletteIsSourceLinkedCandidate===(t.stage==='tower'),'Tower candidate palette qualification '+name);
  const frames:Record<string,unknown>[]=[];
  for(let i=0;i<t.frames.length;i++){
   const f=t.frames[i];const stem=`effects/${t.stage}/${name}/frame_${String(i).padStart(2,'0')}`;
   ensure(f.ordinal===i&&Number.isInteger(f.width)&&Number.isInteger(f.height)&&f.width>0&&f.height>0&&f.width*f.height<=4096,'frame geometry/index '+stem);
   ensure(f.indices.length===f.width*f.height&&f.mask.length===f.width*f.height&&f.rgba.length===f.width*f.height*4,'buffer dimensions '+stem);
   ensure(Number.isInteger(f.descriptorObject2)&&Number.isInteger(f.graStart)&&Number.isInteger(f.graEnd)&&f.graStart>=0&&f.graEnd>f.graStart,'source offsets '+stem);
   ensure(f.mask.every(v=>v===0||v===1),'binary mask '+stem);
   for(let p=0;p<f.mask.length;p++)ensure(f.mask[p] ? f.rgba[p*4+3]===255 : f.rgba[p*4+3]===0,'alpha matches original mask '+stem);
   await verifySourceFrameWitnessO181(name,i,f); // O181 source-identity hardening
   const png=encodeOriginalEffectRgbaPngO177(f.width,f.height,f.rgba);
   const paths={rgbaPng:`${stem}.png`,indexedPixels:`${stem}.indices.bin`,opacityMask:`${stem}.mask.bin`};
   files.push({name:paths.rgbaPng,bytes:png},{name:paths.indexedPixels,bytes:f.indices},{name:paths.opacityMask,bytes:f.mask});
   frames.push({ordinal:i,width:f.width,height:f.height,descriptorX:f.sourceX,descriptorY:f.sourceY,descriptorObject2:f.descriptorObject2,encodedGraStart:f.graStart,encodedGraEndExclusive:f.graEnd,paths,
    indexedPixelsSHA256:await digest(f.indices),opacityMaskSHA256:await digest(f.mask),rgbaPixelsSHA256:await digest(f.rgba),pngSHA256:await digest(png)});
   total++;
  }
  manifestTracks.push({name,stage:t.stage,sourcePointerObject2:t.sourcePointerObject2,sourceControlFlow:t.controlType,sourceFrameCount:frames.length,
   paletteStatus:t.paletteIsSourceLinkedCandidate?'SOURCE_LINKED_CANDIDATE_NOT_RUNTIME_CONFIRMED':'SOURCE_DECODED_NOT_RUNTIME_CONFIRMED',frames});
 }
 ensure(total===43&&files.length===129,'full original source frame coverage');
 const manifest={schema:'mk2_o177_original_source_effect_frame_archive_v1',frameCount:total,sequenceCount:manifestTracks.length,
  originalSourceOnly:true,originalIndexedPixelsAndBinaryOpacityMasks:true,originalSourceFrameOrder:true,
  runtimeFrameRateKnown:false,runtimeActivationKnown:false,actualScreenCoordinatesKnown:false,finalLayerOrderKnown:false,
  towerPaletteSelectedByRuntime:false,tracks:manifestTracks};
 files.push({name:'manifest.json',bytes:utf8.encode(JSON.stringify(manifest,null,2))});
 files.push({name:'README.md',bytes:utf8.encode('# MK2 original stage-effect source frames — O177\n\n43 original sprite frames from 6 EXE-linked source lists (Tomb 16, Portal 20, Tower 7). PNGs are deterministic source-palette previews; each source-index plane and binary opacity mask is independently retained. Tower uses an 80-color record linked by original setup code but NOT verified as the runtime-selected DAC palette. Original frame order and loop/termination controls are known; elapsed FPS, actual activation, parallax, screen positions, final draw order and audio synchronization are UNKNOWN. Do not flatten these elements into stage backgrounds or treat sequence ordinals as timestamps. This archive does NOT contain original commercial EXE/GRA files.\n')});
 return {zipBytes:buildStoredZip(files),manifest,filename:'MK2_O177_ALL_43_ORIGINAL_EFFECT_FRAMES.zip'};
}
