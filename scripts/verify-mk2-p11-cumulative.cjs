#!/usr/bin/env node
/* P11 multi-pass headless fixture validation. No UI/backend network required.
 * node scripts/verify-mk2-p11-cumulative.cjs <canonical MK2 folder> [report.json]
 * Only source-verified assets/metadata are counted; not final composite scenes.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,allowImportingTsExtensions:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const root=process.argv[2];if(!root)throw Error('Usage: verify-mk2-p11-cumulative.cjs <MK2 folder> [report.json]');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');let checks=0;
function eq(a,b,msg){assert.deepStrictEqual(a,b,msg);checks++}
const map=new Map();function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
 const name=prefix?prefix+'/'+e.name:e.name, full=path.join(dir,e.name);
 if(e.isDirectory())walk(full,name);else if(e.isFile())map.set(name,new Uint8Array(fs.readFileSync(full)));
}}walk(root);
const fixture={directoryName:'P11 authenticated MK2',isSynthetic:false,
 async listRecursive(){return [...map].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));},
 async readSlice(p,start,count){const b=map.get(p);if(!b)throw Error('Missing original source '+p);return b.slice(start,start+count);}};
(async()=>{
 const report=await scanAssets(fixture,'mk2',()=>{});
 eq(report.assets.length,5053,'P6 + P7-P10 cumulative census');
 eq(new Set(report.assets.map(a=>a.id)).size,5053,'all unique asset IDs');
 const groups={
 'u8:':312,'mk2-stage-effect:':43,'mk2-stage-setup:':8,'mk2-floor:':15,
 'mk2-forest-setup:':10,'mk2-pit-fall-source:':7,'mk2-pit-upper-setup:':6,'mk2-pit-bridge:':14};
 for(const [prefix,count]of Object.entries(groups)) eq(report.assets.filter(x=>x.id.startsWith(prefix)).length,count,'group '+prefix);
 for(const [field] of [['p7ForestLayers'],['p8PitLowerWall'],['p9PitUpper'],['p10PitBridgeActors']]) {
  const r=report.reports[field];eq(Boolean(r),true,'report '+field);
  eq(r.status,'VERIFIED','source status '+field);
 }
 const packages={
 'MK2_P8_PIT_II_SEVEN_ORIGINAL_LOWER_WALL_SOURCES.zip':'7832bae102ab952024f8fa2b48f86379d5a519f2302491757027b4568654bdd5',
 'MK2_P9_PIT_II_SIX_ORIGINAL_UPPER_SETUP_LAYERS.zip':'25abe08f1471a46c9e205bed3693559499afd7b0893bd277c5c51130769f652d',
 'MK2_P10_PIT_II_ORIGINAL_BRIDGE_ACTOR_FRAMES.zip':'6aedb63e4b974468c64a2a80afc4270be0815d716fa265cee21278b612ddf79c'};
 for(const [name,hash] of Object.entries(packages)){
  const pkg=report.packages.find(p=>p.name===name);eq(Boolean(pkg),true,'original package present '+name);
  eq(sha(pkg.bytes),hash,'byte-for-byte P8-P10 package parity '+name);
 }
 const forest=report.packages.find(p=>p.name==='MKDOS_O197_Forest_Five_Original_Layers_Forensic.zip');
 eq(Boolean(forest),true,'Forest O197 provenance bundle retained');
 const ids=['mk2-forest-setup:','mk2-pit-fall-source:','mk2-pit-upper-setup:','mk2-pit-bridge:'];
 const selected=ids.map(prefix=>report.assets.find(a=>a.id.startsWith(prefix)));
 eq(selected.every(Boolean),true,'select across all four interim passes');
 const archive=parseAnimationStoreZip(selectedZip(selected));
 eq([...archive.keys()].filter(k=>k.startsWith('assets/')).length,4,'four mixed-stage PNG assets exported');
 eq([...archive.keys()].filter(k=>k.startsWith('indexed/')).length,8,'four index/opacity pairs exported');
 for(const a of selected){eq(a.metadata.indices instanceof Uint8Array,true,'source pixels '+a.id);
  eq(a.metadata.mask instanceof Uint8Array,true,'source opacity '+a.id);}
 for(const p of ['P7','P8','P9','P10']){
  const group=ids[Number(p.slice(1))-7];eq(report.assets.some(a=>a.id.startsWith(group)),true,'pass '+p+' retained');
 }
 const result={pass:'P11',status:'PASS',checks,assets:report.assets.length,uniqueAssets:5053,
  originalMK2FixtureOnly:true,groups,originalArchiveParity:packages,selectedExportAssets:4,
  browserUIVerified:false,fullSceneAssemblyVerified:false,nativeAnimationTimingVerified:false,
  copyrightGameFilesIncludedInRepository:false};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
})().catch(err=>{console.error(err.stack||err);process.exitCode=1});
