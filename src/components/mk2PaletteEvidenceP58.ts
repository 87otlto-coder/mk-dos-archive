/** P58 — MK2 palette evidence comparisons, never a reconstructed scene or DAC bank.
 * Existing P7 Forest source-index/candidate-RGB pairs and P15 screenshot-conditioned
 * Tomb/Portal floor-only RGB are exposed without modifying exported pixels.
 */
import type { Asset } from '../core/assets/model';

export type MK2PaletteComparisonP58 = {
  key: string;
  label: string;
  diagnostic: Asset;
  candidate: Asset;
  limitation: string;
};
export type MK2FloorWitnessP58 = {
  stage: 'TOMB.GRA' | 'PORTAL.GRA';
  asset: Asset;
  limitation: string;
};
export type MK2PaletteEvidenceP58 = {
  forestComparisons: MK2PaletteComparisonP58[];
  screenshotFloors: Map<string, MK2FloorWitnessP58>;
  errors: string[];
};
const FOREST_SHA='8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9';
const FLOORS=[
  {stage:'TOMB.GRA',key:'tomb',left:291,rows:48,offset:63776,
   sha:'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
   screenshotMatches:12222},
  {stage:'PORTAL.GRA',key:'portal',left:292,rows:40,offset:56916,
   sha:'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82',
   screenshotMatches:4420},
] as const;
const validImage=(a:Asset) => Number.isSafeInteger(a.width)&&Number.isSafeInteger(a.height)&&
 (a.width??0)>0&&(a.height??0)>0&&a.rgba instanceof Uint8Array&&
 a.rgba.length===(a.width??0)*(a.height??0)*4;
const bytesEqual=(a:Uint8Array,b:Uint8Array)=>{
 if(a.length!==b.length)return false;
 for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;
 return true;
};
const sourceSame=(a:Asset,b:Asset)=>a.source.path.toLowerCase()===b.source.path.toLowerCase()&&
 a.source.offset===b.source.offset&&a.source.length===b.source.length&&
 a.source.sha256===b.source.sha256;
const plane=(x:unknown,length:number):x is Uint8Array=>x instanceof Uint8Array&&x.length===length;

export function buildMK2PaletteEvidenceP58(assets:readonly Asset[]):MK2PaletteEvidenceP58{
 const result:MK2PaletteEvidenceP58={forestComparisons:[],screenshotFloors:new Map(),errors:[]};
 const byID=new Map<string,Asset[]>(),forestVariants=new Set<string>();
 for(const a of assets){
  const hits=byID.get(a.id)??[];hits.push(a);byID.set(a.id,hits);
  const match=/^mk2-forest-setup:([^:]+):(indices-preview|candidate-colors)$/.exec(a.id);
  if(match)forestVariants.add(match[1]);
 }
 for(const variant of [...forestVariants].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))){
  const diagnosticID=`mk2-forest-setup:${variant}:indices-preview`;
  const candidateID=`mk2-forest-setup:${variant}:candidate-colors`;
  const left=byID.get(diagnosticID)??[],right=byID.get(candidateID)??[];
  if(left.length!==1||right.length!==1){
   result.errors.push(`P58 Forest setup ${variant}: qualified pair missing or duplicated`);
   continue;
  }
  const diagnostic=left[0],candidate=right[0],n=(diagnostic.width??0)*(diagnostic.height??0);
  const lm=diagnostic.metadata,rm=candidate.metadata;
  const ok=diagnostic.kind==='stage'&&candidate.kind==='stage'&&validImage(diagnostic)&&validImage(candidate)&&
   diagnostic.width===candidate.width&&diagnostic.height===candidate.height&&
   diagnostic.source.path.toLowerCase().endsWith('forest.gra')&&diagnostic.source.sha256===FOREST_SHA&&
   sourceSame(diagnostic,candidate)&&
   lm.stage==='forest'&&rm.stage==='forest'&&
   String(lm.originalSetupVariant)===variant&&String(rm.originalSetupVariant)===variant&&
   lm.setupObject2Offset===rm.setupObject2Offset&&lm.sourcePalettePhysical===rm.sourcePalettePhysical&&
   lm.previewMode==='index-values'&&rm.previewMode==='candidate-rgb'&&
   lm.paletteRuntimeSelected===false&&rm.paletteRuntimeSelected===false&&
   lm.interLayerPlacementVerified===false&&rm.interLayerPlacementVerified===false&&
   lm.finalDrawOrderVerified===false&&rm.finalDrawOrderVerified===false&&
   lm.nativeAnimationTimingVerified===false&&rm.nativeAnimationTimingVerified===false&&
   plane(lm.indices,n)&&plane(rm.indices,n)&&bytesEqual(lm.indices,rm.indices)&&
   plane(lm.mask,n)&&plane(rm.mask,n)&&bytesEqual(lm.mask,rm.mask);
  if(!ok){
   result.errors.push(`P58 Forest setup ${variant}: source planes, provenance or palette status disagree`);
   continue;
  }
  result.forestComparisons.push({
   key:variant,label:`Forest setup ${variant}`,diagnostic,candidate,
   limitation:'Same original indexed pixels. Candidate colours are linked to an original EXE record, NOT a verified runtime VGA palette or complete scene.',
  });
 }
 for(const spec of FLOORS){
  const id=`mk2-witnessed-floor:${spec.key}:x${spec.left}`;
  const found=byID.get(id)??[];
  if(found.length===0)continue;
  if(found.length!==1){result.errors.push(`P58 ${spec.stage}: duplicate original floor witness`);continue;}
  const a=found[0],m=a.metadata,n=320*spec.rows;
  const ok=a.kind==='stage'&&validImage(a)&&a.width===320&&a.height===spec.rows&&
   a.source.path.toLowerCase().endsWith(spec.key+'.gra')&&a.source.sha256===spec.sha&&
   a.source.offset===spec.offset&&a.source.length===896*spec.rows&&
   m.screenshotObservedRGB===true&&m.sourceIndicesVerified===true&&
   m.originalScreenshotHeldOutExactMatches===spec.screenshotMatches&&
   m.sourceLeft===spec.left&&m.originalGRAOffset===spec.offset&&m.sourceStride===896&&
   m.runtimeNativeDACBankKnown===false&&m.runtimeCameraKnown===false&&
   m.fullStageScene===false&&m.originalAnimationTimingKnown===false&&
   m.nativePaletteKnown===false&&
   plane(m.indices,n)&&plane(m.mask,n)&&plane(m.paletteKnownMask,n)&&
   m.paletteKnownMask.every((v:number)=>v===0)&&m.mask.every((v:number)=>v===1)&&
   typeof m.sourcePixelSha256==='string'&&/^[a-f0-9]{64}$/i.test(m.sourcePixelSha256)&&
   typeof m.observedRgbPreviewSha256==='string'&&/^[a-f0-9]{64}$/i.test(m.observedRgbPreviewSha256);
  if(!ok){result.errors.push(`P58 ${spec.stage}: original floor RGB witness provenance invalid`);continue;}
  result.screenshotFloors.set(spec.stage,{
   stage:spec.stage,asset:a,
   limitation:`Floor only · ${spec.screenshotMatches.toLocaleString('en-US')} source/screenshot pixel matches · conditional captured RGB, NOT live VGA DAC ownership, camera, or complete scene.`,
  });
 }
 return result;
}
