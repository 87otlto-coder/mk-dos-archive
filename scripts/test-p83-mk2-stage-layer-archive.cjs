#!/usr/bin/env node
/** P83 original-free MK2 source ZIP import, provenance/geometry/refusal checks. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),zlib=require('node:zlib');
const ts=require('typescript');
for(const ext of ['.ts','.tsx']) require.extensions[ext]=(mod,file)=>{
 mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}
 }).outputText,file);
};
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {validateMK2P83StageZip,importMK2P83StageZip,MK2_P83_CANONICAL_SHA}=
 require('../src/core/assets/mk2NativeStageZipP83.ts');
const {buildStoredZip}=require('../src/core/research/researchArtifactDownloads.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function crc32(data){let crc=~0;for(const v of data){crc^=v;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^~0)>>>0;}
const be32=n=>{let b=Buffer.alloc(4);b.writeUInt32BE(n>>>0);return b;};
function chunk(name,payload){
 const s=Buffer.from(name,'ascii'),body=Buffer.concat([s,payload]);
 return Buffer.concat([be32(payload.length),body,be32(crc32(body))]);
}
function png(w,h,format){
 const channel=format==='RGBA_PNG'?4:1;let lines=Buffer.alloc(h*(1+w*channel));
 const head=Buffer.alloc(13);head.writeUInt32BE(w,0);head.writeUInt32BE(h,4);
 head[8]=8;head[9]=channel===4?6:0;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR',head),chunk('IDAT',zlib.deflateSync(lines)),chunk('IEND',Buffer.alloc(0))]);
}
const formatToColor=k=>k==='rgba'?'RGBA_PNG':k==='opacity'?'ALPHA8_PNG':'INDEX8_PNG';
function fixture(){
 const originals=Object.fromEntries(Object.keys(MK2_P83_CANONICAL_SHA).map((k,i)=>
  [k,String('abcdef'[i]).repeat(64)]));
 const files=[],entries=[],stages=[];
 for(const [key,width,height,spriteCount,setupCount,pal] of [
  ['tomb',896,48,16,6,0x893c6],['portal',896,40,13,2,0x891e0]]){
  const nativeSpriteDescriptors=[],setupLocalLayers=[];
  const add=(p,kind,aid,w,h)=>{
   const data=png(w,h,formatToColor(kind));
   entries.push({name:p,bytes:data});
   files.push({path:p,bytes:data.length,sha256:sha(data),
    dimensions:[w,h],format:formatToColor(kind),assetId:aid});
  };
  const floorId=key+'_packed_floor';
  for(const kind of ['rgba','indices'])add(key+'/floor_'+kind+'.png',kind,floorId,width,height);
  for(let i=0;i<spriteCount;i++){
   const id=key+'_sprite_'+i.toString(16).padStart(6,'0'),start=100+i*20;
   nativeSpriteDescriptors.push({assetId:id,dimensions:[2,2],
    sourcePackedOffset:start,sourcePackedEndExclusive:start+16,
    unalteredNativeSpriteBounds:true,originalGameAnimationMembershipKnown:false});
   for(const kind of ['rgba','indices','opacity'])
    add(key+'/native_sprites/'+id+'_'+kind+'.png',kind,id,2,2);
  }
  for(let i=0;i<setupCount;i++){
   const id=key+'_setup_'+i.toString(16).padStart(5,'0');
   setupLocalLayers.push({assetId:id,dimensions:[3,3],sourceCoordinateSystem:'SETUP_LOCAL_NOT_SCENE_WORLD',
    registeredStageWorldPosition:null,parallaxMovementRecovered:false,animationFramesRecovered:false});
   for(const kind of ['rgba','indices','opacity'])
    add(key+'/setups/'+id+'_'+kind+'.png',kind,id,3,3);
  }
  stages.push({stage:key,packedFloor:{nativeDimensions:[width,height],sourceOffset:50000,
   cameraCropApplied:false,registeredStageWorldPosition:null},
   nativeSpriteDescriptors,setupLocalLayers});
 }
 assert.equal(files.length,115);
 const report={
  schema:'mk2_o132_native_source_layer_pack_v1',
  status:'STATIC_CAMERA_INDEPENDENT_LAYER_EXPORT',
  sourceExecutableSHA256:originals['MK2.EXE'],stages,files,
  compositing:{finalDrawOrderRecovered:false,liveCameraPositionRecovered:false,
   interSetupLayerPositionRecovered:false},
  motion:{parallaxMotionRulesRecovered:false,animationFrameOrderingRecovered:false,
   animationDurationsRecovered:false}
 };
 const wrapper={format:'mkdos_p82_mk2_uncropped_source_layer_pack_v1',
  originalInputSha256:originals,stageNames:['tomb','portal'],
  nativeCameraOrFinalStageCompositingProven:false,
  originalAnimationOrParallaxTimingProven:false,
  allOriginalCommercialGameFilesExcludedFromExport:true,
  summary:{sourcePngFiles:115,originalNativeSpriteCount:29,originalSetupLocalLayerCount:8}};
 const encoder=new TextEncoder();
 function bytes(r=report,w=wrapper,extras=entries){
  return buildStoredZip([...extras,
   {name:'O132_SCENE_LAYERS.json',bytes:encoder.encode(JSON.stringify(r))},
   {name:'P82_EXPORT_PROVENANCE.json',bytes:encoder.encode(JSON.stringify(w))}]);
 }
 return {originals,files,entries,report,wrapper,bytes};
}
async function test(){
 const f=fixture(),zip=f.bytes();
 const result=await validateMK2P83StageZip(zip,f.originals);
 assert.equal(result.assets.length,115);
 assert.equal(result.report.separatelyImportedPngs,115);
 assert.equal(result.report.originalNativeSprites,29);
 assert.equal(result.report.originalSetupLocalLayers,8);
 assert.deepEqual(result.report.nativeWidthsPreserved,[896,896]);
 assert.equal(result.report.originalMk2AssetsPreserved,5369);
 assert.equal(result.report.livePaletteOrCameraOrAnimationClaimed,false);
 for(let i=0;i<115;i++){
  const asset=result.assets[i];
  assert.equal(asset.mime,'image/png');assert.equal(asset.kind,'image');
  assert.equal(asset.rgba,undefined);
  assert.equal(asset.metadata.livePaletteOwnershipVerified,false);
  assert.equal(asset.metadata.nativeAnimationTimingRecovered,false);
  assert.equal(asset.metadata.sceneWorldPositionRecovered,false);
  assert.equal(asset.metadata.originalP82SourceDecodedInApp,false);
  assert.equal(sha(asset.bytes),f.files[i].sha256);
 }
 assert.equal(new Set(result.assets.map(a=>a.id)).size,115);
 assert.equal(result.assets.filter(a=>a.group.includes('native-width floor')).length,4);
 assert.equal(result.assets.filter(a=>a.group.includes('uncropped source sprites')).length,87);
 assert.equal(result.assets.filter(a=>a.group.includes('setup-local layers')).length,24);
 let rejected=0;
 async function refuse(label,bytes,signatures=f.originals,pattern=/P83/){
  await assert.rejects(validateMK2P83StageZip(bytes,signatures),pattern,label);
  rejected++;
 }
 await refuse('wrong original source sha',zip,{...f.originals,'MK2.EXE':'0'.repeat(64)});
 await refuse('missing original input sha',zip,{...f.originals,'MK2.EXE':undefined});
 await refuse('missing member',f.bytes(f.report,f.wrapper,f.entries.slice(1)));
 await refuse('changed source image bytes',f.bytes(f.report,f.wrapper,
  f.entries.map((row,i)=>i===0?{...row,bytes:png(320,48,'RGBA_PNG')}:row)));
 await refuse('extra member',buildStoredZip([...f.entries,
  {name:'extra/external.bin',bytes:Buffer.from('bad')},
  {name:'O132_SCENE_LAYERS.json',bytes:Buffer.from(JSON.stringify(f.report))},
  {name:'P82_EXPORT_PROVENANCE.json',bytes:Buffer.from(JSON.stringify(f.wrapper))}]));
 for(const [which,field,value] of [
  ['compositing','finalDrawOrderRecovered',true],
  ['compositing','liveCameraPositionRecovered',true],
  ['motion','animationFrameOrderingRecovered',true],
  ['motion','animationDurationsRecovered',true],
  ['motion','parallaxMotionRulesRecovered',true]]){
  const report=structuredClone(f.report);report[which][field]=value;
  await refuse('invented native renderer '+field,f.bytes(report));
 }
 {
  const report=structuredClone(f.report);
  report.stages[0].packedFloor.nativeDimensions=[320,48];
  await refuse('cropped original floor',f.bytes(report));
 }
 {
  const report=structuredClone(f.report);
  report.files[0].dimensions=[320,48];
  await refuse('source PNG incorrect geometry',f.bytes(report));
 }
 {
  const report=structuredClone(f.report);
  report.files[0].path='../escape.png';
  await refuse('unsafe path',f.bytes(report));
 }
 {
  const report=structuredClone(f.report);
  report.stages[1].nativeSpriteDescriptors.pop();
  await refuse('missing original sprite',f.bytes(report));
 }
 {
  const wrapper=structuredClone(f.wrapper);
  wrapper.originalAnimationOrParallaxTimingProven=true;
  await refuse('false timing claim',f.bytes(f.report,wrapper));
 }
 {
  const controller=new AbortController();controller.abort();
  await assert.rejects(validateMK2P83StageZip(zip,f.originals,controller.signal));
  rejected++;
 }
 await assert.rejects(importMK2P83StageZip({
  listRecursive:async()=>[],
  readSlice:async()=>new Uint8Array(),
 },[],zip),/5,369-asset baseline/);
 rejected++;
 await assert.rejects(importMK2P83StageZip({
  listRecursive:async()=>[],
  readSlice:async()=>new Uint8Array(),
 },Array(5369).fill({id:'dummy'}),zip),/original DOS MK2 source file/);
 rejected++;
 const browser=fs.readFileSync(require.resolve('../src/components/AssetBrowser.tsx'),'utf8');
 assert(browser.includes('Import P82 stage-layer ZIP'));
 assert(browser.includes("collection.assets.length === 5369"));
 assert(browser.includes('p83NativeSourceLayerZip'));
 assert(browser.includes('p83Abort.current?.abort()'));
 assert(browser.includes('asset.mime===\'image/png\''));
 console.log(JSON.stringify({pass:'P83_SOURCE',status:'PASS',syntheticSourcePngFiles:115,
  nativeFloors:2,nativeSprites:29,setupLocalLayers:8,
  falseNativeOrSourceClaimsRejected:rejected,
  defaultMk2BaselineRemains:5369,postOptInSourceImages:115,
  originalDosCommercialFilesUsed:false,realOriginalChromeVerified:false,
  nativePaletteStageOrAnimationAsserted:false},null,2));
}
test().catch(e=>{console.error(e.stack||e);process.exitCode=1});
