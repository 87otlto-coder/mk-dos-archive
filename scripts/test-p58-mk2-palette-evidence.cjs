#!/usr/bin/env node
/** P58 source-only palette evidence qualifications. No original media, no gameplay palette assertions. */
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK2PaletteEvidenceP58}=require('../src/components/mk2PaletteEvidenceP58.ts');
const FOREST='8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9';
const SHA={tomb:'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
 portal:'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82'};
function setup(variant,mode) {
 const indices=Uint8Array.from([0,1,2,3,1,0]),mask=Uint8Array.from([0,1,1,0,1,1]);
 return {id:`mk2-forest-setup:${variant}:${mode==='index-values'?'indices-preview':'candidate-colors'}`,
  kind:'stage',name:'Forest',width:3,height:2,rgba:new Uint8Array(24),metadata:{
   stage:'forest',originalSetupVariant:variant,setupObject2Offset:300+Number(variant),
   sourcePalettePhysical:700,previewMode:mode,paletteRuntimeSelected:false,
   interLayerPlacementVerified:false,finalDrawOrderVerified:false,nativeAnimationTimingVerified:false,
   indices,mask
  },source:{path:'forest.gra',offset:0,length:198116,sha256:FOREST}};
}
function floor(which){
 const tomb=which==='tomb',rows=tomb?48:40,left=tomb?291:292,offset=tomb?63776:56916;
 const n=320*rows;
 return {id:`mk2-witnessed-floor:${which}:x${left}`,name:`${which} screenshot witness`,
  kind:'stage',width:320,height:rows,rgba:new Uint8Array(n*4),
  source:{path:which+'.gra',offset,length:896*rows,sha256:SHA[which]},
  metadata:{screenshotObservedRGB:true,sourceIndicesVerified:true,
   originalScreenshotHeldOutExactMatches:tomb?12222:4420,sourceLeft:left,originalGRAOffset:offset,
   sourceStride:896,runtimeNativeDACBankKnown:false,runtimeCameraKnown:false,fullStageScene:false,
   originalAnimationTimingKnown:false,nativePaletteKnown:false,indices:new Uint8Array(n),
   mask:new Uint8Array(n).fill(1),paletteKnownMask:new Uint8Array(n),
   sourcePixelSha256:'a'.repeat(64),observedRgbPreviewSha256:'b'.repeat(64)}};
}
const forest=Array.from({length:5},(_,n)=>[setup(String(n+1),'index-values'),setup(String(n+1),'candidate-rgb')]).flat();
const floors=[floor('tomb'),floor('portal')];
const correct=buildMK2PaletteEvidenceP58([...forest,...floors]);
assert.equal(correct.errors.length,0);
assert.equal(correct.forestComparisons.length,5);
assert.equal(correct.screenshotFloors.size,2);
assert(correct.forestComparisons.every(p=>p.limitation.includes('NOT a verified runtime VGA palette')));
assert([...correct.screenshotFloors.values()].every(p=>p.limitation.includes('NOT live VGA DAC ownership')));
const changed=(target,transform)=>[...forest,...floors].map(a=>a.id===target?transform(a):a);
const forestID=forest[1].id,portalID=floors[1].id;
const failures=[];
function rejects(name,assets,expected){
 const r=buildMK2PaletteEvidenceP58(assets);
 assert.equal(r.errors.length,1,name+' did not reject evidence');
 assert.equal(r.forestComparisons.length,expected==='forest'?4:5,name+' Forest isolation');
 assert.equal(r.screenshotFloors.size,expected==='floor'?1:2,name+' floor isolation');
 failures.push(name);
}
rejects('candidate absent',[...forest.filter(a=>a.id!==forestID),...floors],'forest');
rejects('duplicate candidate',[...forest,...floors,forest[1]],'forest');
rejects('candidate index changed',changed(forestID,a=>({...a,metadata:{...a.metadata,indices:Uint8Array.from([4,1,2,3,1,0])}})),'forest');
rejects('candidate mask changed',changed(forestID,a=>({...a,metadata:{...a.metadata,mask:new Uint8Array(6)}})),'forest');
rejects('palette falsely runtime-assigned',changed(forestID,a=>({...a,metadata:{...a.metadata,paletteRuntimeSelected:true}})),'forest');
rejects('candidate source checksum changed',changed(forestID,a=>({...a,source:{...a.source,sha256:'0'.repeat(64)}})),'forest');
rejects('candidate source extent changed',changed(forestID,a=>({...a,source:{...a.source,length:a.source.length-1}})),'forest');
rejects('candidate geometry corrupted',changed(forestID,a=>({...a,rgba:new Uint8Array(3)})),'forest');
rejects('candidate draw-order invented',changed(forestID,a=>({...a,metadata:{...a.metadata,finalDrawOrderVerified:true}})),'forest');
rejects('floor false screenshot matches',changed(portalID,a=>({...a,metadata:{...a.metadata,originalScreenshotHeldOutExactMatches:99}})),'floor');
rejects('floor palette bank invented',changed(portalID,a=>({...a,metadata:{...a.metadata,runtimeNativeDACBankKnown:true}})),'floor');
rejects('floor source-left changed',changed(portalID,a=>({...a,metadata:{...a.metadata,sourceLeft:300}})),'floor');
rejects('floor native palette-known pixels invented',changed(portalID,a=>({...a,metadata:{...a.metadata,paletteKnownMask:Uint8Array.from([1,...new Uint8Array(320*40-1)])}})),'floor');
rejects('floor source checksum changed',changed(portalID,a=>({...a,source:{...a.source,sha256:'0'.repeat(64)}})),'floor');
rejects('floor invalid row geometry',changed(portalID,a=>({...a,width:321})),'floor');
const empty=buildMK2PaletteEvidenceP58([]);assert.equal(empty.forestComparisons.length,0);
assert.equal(empty.screenshotFloors.size,0);assert.equal(empty.errors.length,0);
console.log(JSON.stringify({pass:'P58_MK2_PALETTE_EVIDENCE',status:'PASS',originalForestPairs:5,
 screenshotWitnessedFloorStrips:2,negativeControlsRejected:failures.length,
 originalIndexedPlanesUnchanged:true,runtimeDACClaimed:false,completeSceneClaimed:false,sourceOnly:true},null,2));
