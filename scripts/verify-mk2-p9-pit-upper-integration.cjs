#!/usr/bin/env node
/** Read-only canonical MK2 fixture test for P9 Pit source-local setups. No npm install required.
 * node scripts/verify-mk2-p9-pit-upper-integration.cjs <mk2 dir> [report.json] [source-package.zip]
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,allowImportingTsExtensions:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK2PitUpperLayersP9}=require('../src/core/assets/mk2PitUpperLayersP9.ts');
const {scanAssets}=require('../src/core/assets/collection.ts');
const {assetBytes,selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const root=process.argv[2];if(!root)throw Error('Usage: verify-mk2-p9-pit-upper-integration.cjs <mk2 dir> [report.json] [zip]');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');let checks=0;const start=Date.now();
function eq(a,b,label){assert.deepStrictEqual(a,b,label);checks++;}
const files=new Map();(function walk(dir,prefix=''){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 const rel=prefix?prefix+'/'+entry.name:entry.name,p=path.join(dir,entry.name);
 if(entry.isDirectory())walk(p,rel);else if(entry.isFile())files.set(rel,new Uint8Array(fs.readFileSync(p)));
}})(root);
function source(m=files){return {directoryName:'canonical mk2',isSynthetic:false,
 async listRecursive(){return [...m].map(([name,b])=>({path:name,name:path.basename(name),extension:path.extname(name).slice(1).toUpperCase(),size:b.length}));},
 async readSlice(name,start,count){const b=m.get(name);if(!b)throw Error('missing '+name);return b.slice(start,start+count);}};}
function altered(name,mode){const m=new Map(files),target=[...m.keys()].find(x=>path.basename(x).toLowerCase()===name.toLowerCase());
 assert(target);const b=m.get(target);
 if(mode==='remove')m.delete(target);
 if(mode==='mutate'){const z=b.slice();z[z.length>>>1]^=1;m.set(target,z);}
 if(mode==='duplicate')m.set('dup/'+name,b);
 return m;
}
(async()=>{
 const p9=await buildMK2PitUpperLayersP9(source());
 eq(p9.status.status,'VERIFIED','canonical Pit source qualified');eq(p9.assets.length,6,'six original setups');
 eq(p9.packages.length,1,'one package');
 const z=parseAnimationStoreZip(p9.packages[0].bytes),manifest=JSON.parse(new TextDecoder().decode(z.get('manifest.json').bytes));
 eq(z.size,20,'six PNG + twelve indexed/mask + manifest + README');
 eq(manifest.layers.length,6,'all six sets in manifest');eq(manifest.sourceRootReducedModeContains,[1,2,6],'original reduced root');
 eq(manifest.runtimeStageModeKnown,false,'no runtime mode inference');eq(manifest.fullStageComposed,false,'no falsely full composition');
 const dims=[[1400,64],[1400,768],[832,24],[376,120],[504,120],[320,120]];
 for(let i=0;i<6;i++){
  const a=p9.assets[i],m=manifest.layers[i];eq([a.width,a.height],dims[i],`source canvas ${i+1}`);
  eq(a.metadata.sourceSetup,i+1,`source setup ${i+1}`);
  eq(a.metadata.finalInterLayerPositionsVerified,false,`no final position claim ${i+1}`);
  eq(a.metadata.sourcePaletteRuntimeDACVerified,false,`no direct DAC claim ${i+1}`);
  eq(a.metadata.originalControlCount,m.controls,`original control count ${i+1}`);
  eq(a.metadata.originalPlacements,m.originalPlacements,`original placements ${i+1}`);
  eq(a.metadata.indices.length,a.width*a.height,`source index byte length ${i+1}`);
  eq(a.metadata.mask.length,a.width*a.height,`source mask byte length ${i+1}`);
  eq(a.metadata.mask.every(v=>v===0||v===1),true,`mask binary ${i+1}`);
  eq(sha(a.metadata.indices),sha(z.get(m.paths.indices).bytes),`export indices ${i+1}`);
  eq(sha(a.metadata.mask),sha(z.get(m.paths.mask).bytes),`export mask ${i+1}`);
  eq(sha(assetBytes(a)),sha(z.get(m.paths.png).bytes),`export PNG ${i+1}`);
 }
 for(const name of ['pit.gra','mk2.exe'])for(const mode of ['remove','mutate','duplicate']){
  const bad=await buildMK2PitUpperLayersP9(source(altered(name,mode)));
  eq(bad.status.status,'UNAVAILABLE',`reject ${name} ${mode}`);eq(bad.assets.length,0,`no pseudo assets on ${name} ${mode}`);
 }
 const independent=await buildMK2PitUpperLayersP9(source(altered('portal.gra','remove')));
 eq(independent.status.status,'VERIFIED','independent of missing Portal');
 const selected=selectedZip([p9.assets[0],p9.assets[1],p9.assets[5]]),parsed=parseAnimationStoreZip(selected);
 eq(parsed.size,10,'three selected PNG + index/mask + manifest');
 const scan=await scanAssets(source(),'mk2',()=>{});
 const ids=new Set(scan.assets.map(a=>a.id));eq(scan.assets.length,5039,'P8 5033 + 6 Pit upper setups');eq(ids.size,5039,'unique IDs');
 eq(scan.assets.filter(a=>a.id.startsWith('u8:')).length,312,'sound effects preserved');
 eq(scan.assets.filter(a=>a.id.startsWith('mk2-stage-effect:')).length,43,'stage effects preserved');
 eq(scan.assets.filter(a=>a.id.startsWith('mk2-stage-setup:')).length,8,'Tomb/Portal preserved');
 eq(scan.assets.filter(a=>a.id.startsWith('mk2-floor:')).length,15,'floor assets preserved');
 eq(scan.assets.filter(a=>a.id.startsWith('mk2-forest-setup:')).length,10,'Forest representations preserved');
 eq(scan.assets.filter(a=>a.id.startsWith('mk2-pit-fall-source:')).length,7,'Pit lower graphics preserved');
 eq(scan.assets.filter(a=>a.id.startsWith('mk2-pit-upper-setup:')).length,6,'six Pit upper setups present');
 eq(scan.reports.p9PitUpper.status,'VERIFIED','P9 report visible');
 eq(scan.packages.some(x=>x.name==='MK2_P9_PIT_II_SIX_ORIGINAL_UPPER_SETUP_LAYERS.zip'),true,'P9 evidence in library');
 const report={pass:'P9',status:'PASS',checks,assets:scan.assets.length,newAssets:6,
  sourceOriginalSetups:6,sourceResource:'PIT.GRA',sourcePaletteColors:81,
  stageFullAssemblyVerified:false,livePaletteDACVerified:false,browserBuildValidated:false,
  negativePaths:['pit removed/mutated/duplicated','exe removed/mutated/duplicated'],
  selectedExport:{count:3,sha256:sha(selected),bytes:selected.length},
  sourcePackage:{sha256:sha(p9.packages[0].bytes),bytes:p9.packages[0].bytes.length},
  elapsedMs:Date.now()-start};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');
 if(process.argv[4])fs.writeFileSync(process.argv[4],p9.packages[0].bytes);
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
