#!/usr/bin/env node
/** P55 source-only stage navigation safeguards; no original binaries or artwork. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {verifiedMK1HeaderPreviewLinks}=require('../src/components/stageGalleryModel.ts');
const {matchesAssetSearchP55,exactAssetSearchP55}=require('../src/core/assets/assetSearchP55.ts');
const modules=[
 {moduleSymbol:'ARENA_MOD',headerResource:'ARENAHDRS.GRA',resourcePath:'ARENAHDRS.GRA',status:'EXACT_JOIN',normalizedPreviewAssetId:'stages/arena_mod/normalized_combined_background.png'},
 {moduleSymbol:'ARENA_MOD_ALT',headerResource:'ARENAHDRS.GRA',resourcePath:'ARENAHDRS.GRA',status:'EXACT_JOIN',normalizedPreviewAssetId:'stages/arena_mod_alt/normalized_combined_background.png'},
 {moduleSymbol:'CAVE_MOD',headerResource:'CAVEHDRS.GRA',resourcePath:'CAVEHDRS.GRA',status:'EXACT_JOIN',normalizedPreviewAssetId:'stages/cave_mod/normalized_combined_background.png'},
];
const resources=[
 {headerResource:'ARENAHDRS.GRA',moduleSymbols:['ARENA_MOD','ARENA_MOD_ALT'],normalizedPreviewAssetIds:[
  'stages/arena_mod/normalized_combined_background.png','stages/arena_mod_alt/normalized_combined_background.png']},
 {headerResource:'CAVEHDRS.GRA',moduleSymbols:['CAVE_MOD'],normalizedPreviewAssetIds:['stages/cave_mod/normalized_combined_background.png']},
];
const report={schema:'mk1_p54_header_module_preview_joins_v1',arcadeStageNamesVerified:false,
 livePaletteOwnershipVerified:false,canonicalGameplayScenesVerified:false,
 modules,resources,summary:{sourceModules:3,headerResources:2,exactPreviewJoins:3,missingPreviewJoins:0,unjoinedNormalizedPreviews:[]}};
function verified(r){return verifiedMK1HeaderPreviewLinks(r)}
const links=verified(report);
assert.equal(links.size,2);
assert.deepStrictEqual(links.get('ARENAHDRS.GRA').map(x=>x.moduleSymbol),['ARENA_MOD','ARENA_MOD_ALT']);
assert.equal(links.get('CAVEHDRS.GRA')[0].assetId,'stages/cave_mod/normalized_combined_background.png');
assert.equal(links.get('OTHERHDRS.GRA'),undefined);
const makeAsset=(id,group)=>({id,name:'normalized_combined_background.png',group,confidence:'bounded stage',
 source:{path:'not a HDRS file',offset:0,length:0},metadata:{},kind:'stage',format:'PNG',filename:'normalized.png'});
const a=makeAsset(links.get('ARENAHDRS.GRA')[0].assetId,'stages/arena_mod');
const near=makeAsset('stages/arena_mod_alt/normalized_combined_background.png','stages/arena_mod_alt');
assert(matchesAssetSearchP55(a,exactAssetSearchP55(a.id)));
assert(!matchesAssetSearchP55(near,exactAssetSearchP55(a.id)),'targeted search must not include sibling module');
assert(matchesAssetSearchP55(a,'normalized_combined_background'));
assert(matchesAssetSearchP55(a,'STAGES/ARENA_MOD'),'ordinary text search must remain case insensitive');
assert(!matchesAssetSearchP55(a,'FIGHTER'),'unrelated normal search must remain excluded');
const copy=()=>JSON.parse(JSON.stringify(report));
const bad=[];
function reject(name,fn){const v=copy();fn(v);assert.equal(verified(v).size,0,name);bad.push(name)}
reject('invented stage claim',v=>v.arcadeStageNamesVerified=true);
reject('palette claim',v=>v.livePaletteOwnershipVerified=true);
reject('schema mismatch',v=>v.schema='untrusted');
reject('duplicate module symbol',v=>v.modules[1].moduleSymbol=v.modules[0].moduleSymbol);
reject('spoofed preview ID',v=>v.modules[0].normalizedPreviewAssetId='stages/wrong/normalized_combined_background.png');
reject('duplicate preview ID',v=>v.modules[1].normalizedPreviewAssetId=v.modules[0].normalizedPreviewAssetId);
reject('unknown header',v=>v.modules[0].headerResource='UNKNOWN.GRA');
reject('resource module mismatch',v=>v.resources[0].moduleSymbols=['UNPROVEN']);
reject('false reference list',v=>v.resources[0].normalizedPreviewAssetIds=['stages/fake/normalized_combined_background.png']);
reject('false count',v=>v.summary.exactPreviewJoins=1000);
reject('unfinished extra image',v=>v.summary.unjoinedNormalizedPreviews=['stages/unknown/normalized_combined_background.png']);
assert.equal(verified(null).size,0,'no scan must not offer links');
const missing=copy();
missing.modules[0].status='PREVIEW_UNAVAILABLE';missing.modules[0].normalizedPreviewAssetId=null;
missing.resources[0].normalizedPreviewAssetIds=missing.resources[0].normalizedPreviewAssetIds.slice(1);
missing.summary.exactPreviewJoins=2;missing.summary.missingPreviewJoins=1;
assert.equal(verified(missing).get('ARENAHDRS.GRA').length,1,'unavailable preview is not guessed');
console.log(JSON.stringify({pass:'P55_SOURCE_NAVIGATION',status:'PASS',linkedHeaders:2,linkedModules:3,
 deliberateFalseReportsRejected:bad.length,unavailablePreviewNotInvented:true,
 exactIdSearch:true,ordinarySearchPreserved:true,sourceOnly:true},null,2));
