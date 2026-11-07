#!/usr/bin/env node
/** P60 original-source Tomb independent-component acceptance.
 * Usage: node scripts/verify-mk2-p60-tomb.cjs <original MK2 directory> [private result.json]
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{
 fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {parseAnimationStoreZip,decodeAnimationBundlePng}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const args=process.argv.slice(2);assert(args.length===1||args.length===2,'Usage: original MK2 directory, optional private result path');
const root=fs.realpathSync(path.resolve(__dirname,'..')),original=fs.realpathSync(args[0]);
const inside=(p,q)=>{const rel=path.relative(p,q);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));};
assert(fs.statSync(original).isDirectory()&&!inside(root,original),'original game must be outside source checkout');
if(args[1]){const output=path.resolve(args[1]);assert(!inside(root,output)&&!inside(original,output),'report must remain outside source and original game folders');}
const data=new Map();
function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
 const p=prefix?prefix+'/'+e.name:e.name,full=path.join(dir,e.name);
 if(e.isDirectory())walk(full,p);else if(e.isFile())data.set(p,new Uint8Array(fs.readFileSync(full)));
}}walk(original);
const entries=[...data].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));
function orig(name,expected){
 const files=entries.filter(e=>e.name.toLowerCase()===name.toLowerCase());
 assert.equal(files.length,1,'one '+name+' source file required');
 const b=data.get(files[0].path);assert.equal(sha(b),expected,'original '+name+' hash');
 return b;
}
const source={directoryName:'P60 canonical original MK2',isSynthetic:false,
 async listRecursive(){return entries;},
 async readSlice(p,start,len){const b=data.get(p);if(!b)throw Error('Missing '+p);return b.slice(start,start+len);}};
function pkg(c,name){
 const found=c.packages.filter(x=>x.name===name);assert.equal(found.length,1,'package identity: '+name);
 return parseAnimationStoreZip(found[0].bytes);
}
function member(z,name){const e=z.get(name);assert(e,'missing export member '+name);return e.bytes;}
(async()=>{
 const tomb=orig('TOMB.GRA','be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613');
 orig('MK2.EXE','fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65');
 const c=await scanAssets(source,'mk2',()=>{});
 assert.equal(c.assets.length,5369);
 assert.equal(new Set(c.assets.map(x=>x.id)).size,5369);
 assert.equal(c.reports.p59TombWitness.status,'VERIFIED');
 assert.equal(c.reports.p60TombComponents.status,'VERIFIED');
 const z59=pkg(c,'MK2_P59_TOMB_SCREENSHOT_SAMPLES.zip');
 const z15=pkg(c,'MK2_P15_TWO_SCREENSHOT_WITNESSED_STAGE_FLOORS.zip');
 const z60=pkg(c,'MK2_P60_TOMB_INDEPENDENT_COMPONENTS.zip');
 assert.equal(z60.size,11);
 const manifest=JSON.parse(new TextDecoder().decode(member(z60,'manifest.json')));
 assert.equal(manifest.format,'mk2_p60_tomb_independent_components_v1');
 assert.equal(manifest.componentCount,3);
 assert.equal(manifest.originalAssetCensusDelta,0);
 for(const name of ['originalAssetsModified','commonRuntimeCameraKnown','fullStageCompositionVerified',
   'nativePaletteOwnershipKnown','originalLayerOrderKnown','nativeAnimationTimingKnown'])
   assert.equal(manifest[name],false,name);
 assert.equal(manifest.coordinateFramesIndependent,true);
 assert.equal(manifest.components.length,3);
 assert.equal(manifest.components[0].sampleCount,2650);
 assert.equal(manifest.components[1].sampleCount,823);
 assert.equal(manifest.components[2].screenshotMatches,12222);
 assert.equal(manifest.components[2].registeredAgainstO123,false);
 let total=0;
 for(const [i,s] of ['architecture','sky'].entries()){
  const base='components/'+s+'/',rawBase=s+'.';
  for(const [a,b] of [['sampled.png','png'],['indices.bin','indices.bin'],['sample-mask.bin','mask.bin']]){
   assert.deepStrictEqual(member(z60,base+a),member(z59,rawBase+b),'P59 source bytes not preserved '+s+'/'+a);
  }
  const mask=member(z60,base+'sample-mask.bin'),indices=member(z60,base+'indices.bin');
  const png=decodeAnimationBundlePng(member(z60,base+'sampled.png'));
  assert.equal(png.width,319);assert.equal(png.height,199);
  assert.equal(mask.length,319*199);assert.equal(indices.length,mask.length);
  const expected=[2650,823][i],count=mask.reduce((n,v)=>n+v,0);assert.equal(count,expected);
  for(let j=0;j<mask.length;j++){
   assert(mask[j]===0||mask[j]===1);
   if(mask[j])assert.equal(png.rgba[j*4+3],255);
   else assert.equal(png.rgba[j*4+3],0);
  }
  total+=count;
 }
 assert.equal(total,3473);
 const floorIndices=member(z60,'components/floor/indices.bin'),floorMask=member(z60,'components/floor/paint-mask.bin'),
  known=member(z60,'components/floor/native-palette-known-mask.bin');
 const rebuilt=new Uint8Array(320*48);
 for(let y=0;y<48;y++)rebuilt.set(tomb.subarray(63776+y*896+291,63776+y*896+291+320),y*320);
 assert.deepStrictEqual(floorIndices,rebuilt,'original native packed floor sample indices');
 assert.equal(floorIndices.length,320*48);
 assert(floorMask.every(v=>v===1));
 assert(known.every(v=>v===0),'no native DAC ownership or palette known mask');
 assert.deepStrictEqual(floorIndices,member(z15,'indexed/tomb.indices.bin'));
 assert.deepStrictEqual(floorMask,member(z15,'indexed/tomb.mask.bin'));
 assert.deepStrictEqual(known,member(z15,'indexed/tomb.native-palette-known.bin'));
 const floorPNG=member(z60,'components/floor/conditional-rgb.png'),floorImg=decodeAnimationBundlePng(floorPNG);
 const legacyPNG=decodeAnimationBundlePng(member(z15,'preview/tomb_observed_floor_320x48.png'));
 assert.equal(floorImg.width,320);assert.equal(floorImg.height,48);
 assert.deepStrictEqual(floorImg.rgba,legacyPNG.rgba,'floor RGB changed from accepted P15 export');
 const floorRec=manifest.components[2];
 assert.equal(sha(floorIndices),floorRec.originalIndicesSHA256);
 assert.equal(sha(floorImg.rgba),floorRec.conditionalRGBSHA256);
 assert.equal(sha(floorPNG),floorRec.pngSHA256);
 const result={pass:'P60',status:'PASS',mk2Assets:5369,
  independentlyPackagedComponents:3,p59OpaqueSourceSamples:total,
  architectureSamples:2650,skySamples:823,originalPackedFloorPixels:320*48,
  p59ArchitectureSkyFilesByteIdentical:true,p15FloorIndexedMasksByteIdentical:true,
  p15FloorRgbaPixelIdentical:true,originalTombResourceSha256:sha(tomb),
  originalSharedCameraClaimed:false,fullStageCompositionClaimed:false,nativeDACOwnershipClaimed:false,
  originalAssetRepresentationsChanged:false,actualBrowserExportVerified:false};
 if(args[1]){fs.mkdirSync(path.dirname(args[1]),{recursive:true});
 fs.writeFileSync(args[1],JSON.stringify(result,null,2)+'\n');}
 console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
