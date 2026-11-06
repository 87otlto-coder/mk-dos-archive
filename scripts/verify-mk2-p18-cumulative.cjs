#!/usr/bin/env node
/** P18 cumulative original MK2 fixture acceptance.
 * node scripts/verify-mk2-p18-cumulative.cjs <MK2 folder> [report.json]
 * --p11-p17-baseline is ONLY a local compatibility check for frozen P11 source + P18.
 * The default requires the full committed P16 source and 5,110 assets.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,allowImportingTsExtensions:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const root=process.argv[2];if(!root)throw Error('Usage: verify-mk2-p18-cumulative.cjs <MK2 folder> [report.json] [--p11-p17-baseline]');
const baseline=process.argv.includes('--p11-p17-baseline');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');let checks=0;
const eq=(a,b,msg)=>{assert.deepStrictEqual(a,b,msg);checks++};
const map=new Map();function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
 const rel=prefix?prefix+'/'+e.name:e.name,full=path.join(dir,e.name);
 if(e.isDirectory())walk(full,rel);else if(e.isFile())map.set(rel,new Uint8Array(fs.readFileSync(full)));
}}walk(root);
const fixture={directoryName:'Authenticated original DOS MK2',isSynthetic:false,
 async listRecursive(){return [...map].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));},
 async readSlice(p,s,c){const b=map.get(p);if(!b)throw Error('Original file missing '+p);return b.slice(s,s+c);}};
(async()=>{
 const r=await scanAssets(fixture,'mk2',()=>{});const expected=baseline?5063:5118;
 eq(r.assets.length,expected,'P17 unique MK2 asset count');
 eq(new Set(r.assets.map(a=>a.id)).size,expected,'no duplicate IDs');
 const groups={'mk2-stage-effect:':43,'mk2-stage-setup:':8,'mk2-pit-bridge:':14,'mk2-images-setup:':2,'mk2-source-animation-sheet:':8};
 if(!baseline) Object.assign(groups,{'mk2-intro-lzw:':31,'mk2-mountain-source:':15,'mk2-viewport-floor:':7,'mk2-witnessed-floor:':2});
 for(const [key,count]of Object.entries(groups))eq(r.assets.filter(x=>x.id.startsWith(key)).length,count,'group '+key);
 eq(r.reports.p17ImagesSetups.status,'VERIFIED','P17 source status');
 eq(r.reports.p18OrderedSequences.status,'VERIFIED','P18 source sequence group status');
 eq(r.reports.p18OrderedSequences.count,8,'8 verified original source animation groups');
 eq(r.reports.p18OrderedSequences.sourceFrames,57,'57 preexisting original source frames');
 eq(r.reports.p17ImagesSetups.count,2,'P17 two source composites');
 eq(r.reports.p17ImagesSetups.sourceChain,{start:351472,endExclusive:460192,streams:20},'IMAGES source stream partition');
 for(const p of ['p7ForestLayers','p8PitLowerWall','p9PitUpper','p10PitBridgeActors'])eq(r.reports[p].status,'VERIFIED',p+' source status');
 if(!baseline)for(const p of ['p12IntroLzw','p13MountainSource','p14NativeViewports','p15ObservedFloors'])eq(r.reports[p].status,'VERIFIED',p+' cumulative source status');
 const originalHashes={
 'MK2_P8_PIT_II_SEVEN_ORIGINAL_LOWER_WALL_SOURCES.zip':'7832bae102ab952024f8fa2b48f86379d5a519f2302491757027b4568654bdd5',
 'MK2_P9_PIT_II_SIX_ORIGINAL_UPPER_SETUP_LAYERS.zip':'25abe08f1471a46c9e205bed3693559499afd7b0893bd277c5c51130769f652d',
 'MK2_P10_PIT_II_ORIGINAL_BRIDGE_ACTOR_FRAMES.zip':'6aedb63e4b974468c64a2a80afc4270be0815d716fa265cee21278b612ddf79c'};
 for(const [name,digest]of Object.entries(originalHashes)){
  const b=r.packages.find(x=>x.name===name);eq(Boolean(b),true,'package exists '+name);eq(sha(b.bytes),digest,'package parity '+name);
 }
 const p17=r.assets.filter(a=>a.id.startsWith('mk2-images-setup:'));
 eq(p17.every(a=>a.width===320&&a.height===200),true,'P17 native setup dimensions');
 eq(p17.every(a=>a.metadata.stageOwnershipKnown===false),true,'P17 stage ownership remains unknown');
 eq(p17.every(a=>a.metadata.runtimePaletteKnown===false),true,'P17 runtime palette remains unknown');
 eq(p17.every(a=>a.metadata.paletteKnownMask instanceof Uint8Array),true,'native unknown colour mask remains indexed');
 eq(p17.every(a=>a.metadata.paletteKnownMask.every(v=>v===0)),true,'no fabricated palette entries');
 const pack=r.packages.find(x=>x.name==='MK2_P17_IMAGES_TWO_UNASSIGNED_INDEXED_SETUP_LAYERS.zip');
 eq(Boolean(pack),true,'P17 forensic bundle present');
 const zip=parseAnimationStoreZip(pack.bytes);eq([...zip.keys()].filter(x=>x.startsWith('assets/')).length,2,'P17 archive PNG count');
 eq([...zip.keys()].filter(x=>x.startsWith('indexed/')).length,6,'P17 exact indices, paint and unknown-colour masks');
 const selected=parseAnimationStoreZip(selectedZip(p17));
 eq([...selected.keys()].filter(x=>x.startsWith('assets/')).length,2,'selected ZIP P17 images');
 const result={pass:'P18',status:'PASS',checks,uniqueAssets:expected,source:'original MK2 files',
  mode:baseline?'P11_SOURCE_PLUS_P17_PLUS_P18_ONLY':'P16_SOURCE_PLUS_P17_PLUS_P18',p17AddedAssets:2,p18DerivedAnimationGroupRepresentations:8,
  originalP8P10PackageHashesUnchanged:true,originalO122IndexedMosaics:true,
  browserInteractionVerified:false,runtimePaletteAssignmentKnown:false,completeStageScene:false};
 if(process.argv[3]&&process.argv[3]!=='--p11-p17-baseline')fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
