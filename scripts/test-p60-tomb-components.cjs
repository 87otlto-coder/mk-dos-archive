#!/usr/bin/env node
/** P60 source-only component package controls; synthetic pixels, NO commercial game media. */
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{
 fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildStoredZip}=require('../src/core/research/researchArtifactDownloads.ts');
const {encodeOriginalEffectRgbaPngO177}=require('../src/games/mk2/research/stageSourcePngO177.ts');
const {parseAnimationStoreZip,decodeAnimationBundlePng}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const {buildTombComponentsP60}=require('../src/core/assets/mk2TombComponentsP60.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const E='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const T='be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613';
const S='5cd8f5ed5d75a4098df714b45a24ba2d7fe6ab43881add8e9c1043aa2b8e9ec9';
const specs=[{name:'architecture',setup:0x1737c,width:850,height:224,dx:267,dy:57,count:2650},
 {name:'sky',setup:0x173b2,width:320,height:80,dx:2,dy:-47,count:823}];
const n=319*199;
function makeP59(modifier=()=>{}){
 const files=[],records=[];
 for(const spec of specs){
  const mask=new Uint8Array(n),indices=new Uint8Array(n),rgba=new Uint8Array(n*4);
  for(let i=0;i<spec.count;i++){
   mask[i]=1;indices[i]=i%256;
   rgba.set(Uint8Array.from([i%256,(i+7)%256,(i+13)%256,255]),i*4);
  }
  files.push({name:spec.name+'.png',bytes:encodeOriginalEffectRgbaPngO177(319,199,rgba)},
   {name:spec.name+'.indices.bin',bytes:indices},{name:spec.name+'.mask.bin',bytes:mask});
  records.push({...spec,sourceAssetId:'mk2-stage-setup:tomb:object2_'+spec.setup.toString(16).toUpperCase(),
   rgba:'a'.repeat(64),indices:'b'.repeat(64),mask:'c'.repeat(64),regions:[[0,7,0,7]]});
 }
 const manifest={format:'mk2-p59-tomb-heldout-v1',exeSha256:E,tombSha256:T,screenshotSha256:S,layers:records};
 modifier({files,manifest});
 files.push({name:'manifest.json',bytes:new TextEncoder().encode(JSON.stringify(manifest))});
 return {name:'MK2_P59_TOMB_SCREENSHOT_SAMPLES.zip',bytes:buildStoredZip(files)};
}
function makeFloor(modify=()=>{}){
 const size=320*48,indices=new Uint8Array(size),mask=new Uint8Array(size).fill(1),
 known=new Uint8Array(size),rgba=new Uint8Array(size*4);
 for(let i=0;i<size;i++){indices[i]=i%256;rgba.set([i%256,90,120,255],i*4);}
 const floor={
  id:'mk2-witnessed-floor:tomb:x291',kind:'stage',width:320,height:48,
  source:{path:'tomb.gra',offset:63776,length:896*48,sha256:T},rgba,
  metadata:{originalGRAOffset:63776,originalSourceRows:48,sourceStride:896,sourceLeft:291,sourceFirstRow:0,
   screenshotObservedRGB:true,sourceIndicesVerified:true,originalScreenshotHeldOutExactMatches:12222,
   runtimeNativeDACBankKnown:false,runtimeCameraKnown:false,fullStageScene:false,
   originalAnimationTimingKnown:false,nativePaletteKnown:false,indices,mask,paletteKnownMask:known,
   sourcePixelSha256:sha(indices),observedRgbPreviewSha256:sha(rgba),
   originalScreenshotPaletteSourceSHA256:'d'.repeat(64)}
 };
 modify(floor);return floor;
}
async function reject(label,p59,assets,reason){
 await assert.rejects(buildTombComponentsP60(p59,assets),new RegExp(reason),label);return label;
}
(async()=>{
 const p59=makeP59(),floor=makeFloor();
 const result=await buildTombComponentsP60(p59,[floor]);
 assert.equal(result.name,'MK2_P60_TOMB_INDEPENDENT_COMPONENTS.zip');
 const zipped=parseAnimationStoreZip(result.bytes);
 assert.equal(zipped.size,11);
 const manifest=JSON.parse(new TextDecoder().decode(zipped.get('manifest.json').bytes));
 assert.equal(manifest.format,'mk2_p60_tomb_independent_components_v1');
 assert.equal(manifest.componentCount,3);assert.equal(manifest.originalAssetCensusDelta,0);
 assert.equal(manifest.coordinateFramesIndependent,true);
 assert.equal(manifest.commonRuntimeCameraKnown,false);
 assert.equal(manifest.fullStageCompositionVerified,false);
 assert.equal(manifest.originalLayerOrderKnown,false);
 assert.equal(manifest.nativePaletteOwnershipKnown,false);
 assert.equal(manifest.nativeAnimationTimingKnown,false);
 assert.equal(manifest.components[0].sampleCount,2650);assert.equal(manifest.components[1].sampleCount,823);
 assert.equal(manifest.components[2].screenshotMatches,12222);
 assert.equal(manifest.components[2].registeredAgainstO123,false);
 const original=parseAnimationStoreZip(p59.bytes);
 for(const s of specs){
  const prefix='components/'+s.name+'/';
  for(const [out,src]of [['sampled.png',s.name+'.png'],['indices.bin',s.name+'.indices.bin'],
   ['sample-mask.bin',s.name+'.mask.bin']]){
   assert.deepStrictEqual(zipped.get(prefix+out).bytes,original.get(src).bytes,'P59 bytes changed');
  }
 }
 const f='components/floor/';
 assert.deepStrictEqual(zipped.get(f+'indices.bin').bytes,floor.metadata.indices);
 assert.deepStrictEqual(zipped.get(f+'paint-mask.bin').bytes,floor.metadata.mask);
 assert.deepStrictEqual(zipped.get(f+'native-palette-known-mask.bin').bytes,floor.metadata.paletteKnownMask);
 const png=decodeAnimationBundlePng(zipped.get(f+'conditional-rgb.png').bytes);
 assert.equal(png.width,320);assert.equal(png.height,48);assert.deepStrictEqual(png.rgba,floor.rgba);
 const errors=[];
 errors.push(await reject('P59 missing bundle',{name:'WRONG',bytes:p59.bytes},[floor],'name'));
 errors.push(await reject('P59 screenshot changed',makeP59(v=>{v.manifest.screenshotSha256='f'.repeat(64)}),[floor],'provenance'));
 errors.push(await reject('P59 count fabricated',makeP59(v=>{v.manifest.layers[0].count=500}),[floor],'provenance'));
 errors.push(await reject('P59 duplicated sample',makeP59(v=>{v.files.push(v.files[0])}),[floor],'entries'));
 errors.push(await reject('P59 wrong opaque count',makeP59(v=>{
  const bad=v.files.find(x=>x.name==='architecture.mask.bin');bad.bytes[0]=0;
 }),[floor],'count'));
 errors.push(await reject('P59 unseen pixel altered',makeP59(v=>{
  const rgba=new Uint8Array(n*4);rgba[4000*4]=255;
  v.files.find(x=>x.name==='architecture.png').bytes=encodeOriginalEffectRgbaPngO177(319,199,rgba);
 }),[floor],'sampled alpha|unsampled'));
 errors.push(await reject('floor missing',p59,[],'unique original P15'));
 errors.push(await reject('floor duplicate',p59,[floor,floor],'unique original P15'));
 errors.push(await reject('floor fake source',p59,[makeFloor(x=>{x.source.sha256='0'.repeat(64)})],'source'));
 errors.push(await reject('floor fake index',p59,[makeFloor(x=>{x.metadata.indices[0]^=1})],'hashes'));
 errors.push(await reject('floor unknown palette wrongly asserted',p59,[makeFloor(x=>{x.metadata.nativePaletteKnown=true})],'uncertainty'));
 errors.push(await reject('floor known palette mask',p59,[makeFloor(x=>{x.metadata.paletteKnownMask[0]=1})],'masks'));
 errors.push(await reject('floor nonopaque mask',p59,[makeFloor(x=>{x.metadata.mask[0]=0})],'masks'));
 errors.push(await reject('floor wrong screenshot match count',p59,[makeFloor(x=>{x.metadata.originalScreenshotHeldOutExactMatches=10})],'uncertainty'));
 errors.push(await reject('floor incorrect camera',p59,[makeFloor(x=>{x.metadata.sourceLeft=288})],'uncertainty'));
 console.log(JSON.stringify({pass:'P60_TOMB_INDEPENDENT_COMPONENTS',status:'PASS',
  componentCount:3,p59ByteForBytePreserved:true,p15FloorsPreserved:true,
  falsifiedInputsRejected:errors.length,liveCameraClaimed:false,fullSceneClaimed:false,
  nativePaletteOwnershipClaimed:false,sourceOnly:true},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
