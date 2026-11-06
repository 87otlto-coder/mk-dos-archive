#!/usr/bin/env node
/** P17 independent source-golden parity + negative fixtures + asset ZIP check.
 * Usage: node scripts/verify-mk2-p17-unassigned-images.cjs <MK2 folder>
 * No commercial bytes are written to the repository or verification output.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,allowImportingTsExtensions:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK2ImagesSetupsP17}=require('../src/core/assets/mk2ImagesSetupP17.ts');
const {selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip,decodeAnimationBundlePng}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const ref=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/mk2-p17-images-o122-independent-parity.json')));
const root=process.argv[2];if(!root)throw Error('Usage: node scripts/verify-mk2-p17-unassigned-images.cjs <MK2 folder>');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const originals=new Map();for(const f of ['mk2.exe','images.gra'])originals.set(f,new Uint8Array(fs.readFileSync(path.join(root,f))));
let checks=0;
function eq(a,b,reason){assert.deepStrictEqual(a,b,reason);checks++;}
function fixture(map=originals,{synthetic=false,duplicates=[],cut=0}={}){
 const entries=[...map].map(([name,b])=>({path:name,name,extension:path.extname(name).slice(1).toUpperCase(),size:b.length}));
 entries.push(...duplicates.map(name=>({path:`duplicate/${name}`,name,extension:path.extname(name).slice(1).toUpperCase(),size:map.get(name)?.length||0})));
 return {directoryName:'P17 original fixture',isSynthetic:synthetic,async listRecursive(){return entries;},
  async readSlice(p,start,count){const key=p.startsWith('duplicate/')?p.slice(10):p;const b=map.get(key);if(!b)throw Error('Fixture path unavailable');return b.subarray(start,start+count-(cut?1:0));}};
}
(async()=>{
 eq(hash(originals.get('mk2.exe')),ref.originalExeSHA256,'canonical original executable');
 eq(hash(originals.get('images.gra')),ref.imagesGraSHA256,'canonical original IMAGES.GRA');
 const r=await buildMK2ImagesSetupsP17(fixture());eq(r.status.status,'VERIFIED','P17 source qualified');
 eq(r.assets.length,2,'both O122 source setup families exposed');
 eq(r.status.sourceChain,ref.imagesSourceChain,'O122 authenticated twenty-stream source chain');
 for(const golden of ref.setups){
  const a=r.assets.find(x=>x.metadata.setupObject2Offset===golden.setupObject2Offset);
  eq(Boolean(a),true,'source setup preserved');
  eq(a.kind,'stage','setup-local resource classification');eq(a.width,golden.width,'native canvas width');
  eq(a.height,golden.height,'native canvas height');
  eq(a.metadata.paletteRecordPhysical,golden.paletteRecordPhysical,'source palette record location only');
  eq(a.metadata.sourceControlEntries.length,golden.sourceControls,'original descriptor controls');
  eq(a.metadata.paletteEntryCount,79,'79-colour candidate record exact count');
  eq(hash(a.metadata.indices),golden.sourceIndexSHA256,'independent O122 ORIGINAL index digest');
  eq(hash(a.metadata.mask),golden.opacityMaskSHA256,'independent O122 ORIGINAL opacity digest');
  eq(a.metadata.mask.reduce((sum,n)=>sum+n,0),golden.opaquePixels,'original opaque canvas pixel count');
  eq(a.metadata.paletteKnownMask.length,a.width*a.height,'native palette uncertainty plane retained');
  eq(a.metadata.paletteKnownMask.every(v=>v===0),true,'native palette must remain unknown');
  eq(a.metadata.runtimePaletteKnown,false,'runtime palette not invented');
  eq(a.metadata.stageOwnershipKnown,false,'stage/arena assignment not invented');
  eq(a.metadata.fullStageScene,false,'complete stage scene not invented');
  const decoded=decodeAnimationBundlePng(require('../src/core/assets/export.ts').assetBytes(a));
  eq(hash(decoded.rgba),hash(a.rgba),'single PNG export exactly preserves diagnostic RGBA');
 }
 const zip=parseAnimationStoreZip(selectedZip(r.assets));
 eq([...zip.keys()].filter(x=>x.startsWith('assets/')).length,2,'selected original setup PNG count');
 eq([...zip.keys()].filter(x=>x.startsWith('indexed/')).length,6,'source indices + opacity + palette-unknown masks each');
 for(let i=0;i<2;i++){
  const a=r.assets[i],prefix=`indexed/${String(i).padStart(5,'0')}_`;
  for(const k of ['indices','mask','paletteKnownMask']){
   const file=zip.get(prefix+k+'.bin');eq(Boolean(file),true,'indexed ZIP member '+k);
   eq(hash(file.bytes),hash(a.metadata[k]),'ZIP exact source bytes '+k);
  }
 }
 const manifest=JSON.parse(new TextDecoder().decode(zip.get('manifest.json').bytes));
 eq(manifest.selectionOrder.length,2,'selection manifest length');
 eq(manifest.selectionOrder.every(a=>a.metadata.runtimePaletteKnown===false&&a.metadata.stageOwnershipKnown===false),true,
  'source-uncertainty fields preserved in selected ZIP manifest');
 const reject=async(src,label)=>{const x=await buildMK2ImagesSetupsP17(src);eq(x.status.status,'UNAVAILABLE',label);
  eq(x.assets.length,0,label+' assets suppressed');eq(x.packages.length,0,label+' packages suppressed');};
 await reject(fixture(originals,{synthetic:true}),'synthetic fixture');
 await reject(fixture(new Map([['mk2.exe',originals.get('mk2.exe')]])),'images missing');
 await reject(fixture(new Map([['images.gra',originals.get('images.gra')]])),'EXE missing');
 await reject(fixture(originals,{duplicates:['mk2.exe']}),'duplicate EXE');
 await reject(fixture(originals,{duplicates:['images.gra']}),'duplicate graphics');
 await reject(fixture(originals,{cut:1}),'truncated original input');
 for(const name of ['mk2.exe','images.gra']){
  const broken=new Map(originals),bytes=originals.get(name).slice();bytes[bytes.length-7]^=0x80;broken.set(name,bytes);
  await reject(fixture(broken),'mutated '+name);
 }
 console.log(JSON.stringify({pass:'P17',status:'PASS',checks,originalIndexedMosaics:r.assets.length,
  originalIndexPixels:r.assets.reduce((n,a)=>n+a.width*a.height,0),
  independentO122SourceHashes:true,sourceBundleIntegrity:true,negativeFixtures:8,
  nativePaletteOwnershipKnown:false,completeStageSceneVerified:false,
  cumulativeP16RegressionRerun:false,gameBrowserVerified:false},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
