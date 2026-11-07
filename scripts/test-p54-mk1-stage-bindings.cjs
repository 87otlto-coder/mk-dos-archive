#!/usr/bin/env node
/** P54 source-only controls, no original commercial data. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK1StageHeaderBindingsP54}=require('../src/core/assets/mk1StageHeaderBindingsP54.ts');
const root={status:'SUCCESS',validation:{allChecksPassed:true},
 decision:{backgroundModuleGrammarBounded:true,packedRootResourcesResolved:true,sceneBmodReferenceSurfaceEstablished:true,arcadeStageNameMappingEstablished:false},
 topLevelModules:[
  {symbol:'ARENA_BAK',resourcePath:'ARENAHDRS.GRA',sceneEntries:[{kind:'BMOD_WITH_PACKED_I16_PAIR',bmodSymbol:'ARENA_BMOD'}]},
  {symbol:'ARENA_BAK_ALT',resourcePath:'ARENAHDRS.GRA',sceneEntries:[{kind:'LITERAL_ONE'}]},
  {symbol:'CAVE_BAK',resourcePath:'CAVEHDRS.GRA',sceneEntries:[]}
 ]};
const preview=(id)=>({id,kind:'stage',width:2,height:2,rgba:new Uint8Array(16)});
const assets=[preview('stages/arena_bak/normalized_combined_background.png'),
preview('stages/arena_bak_alt/normalized_combined_background.png'),
preview('stages/cave_bak/normalized_combined_background.png')];
const result=buildMK1StageHeaderBindingsP54(root,assets);
assert.equal(result.schema,'mk1_p54_header_module_preview_joins_v1');
assert.equal(result.summary.sourceModules,3);
assert.equal(result.summary.headerResources,2);
assert.equal(result.summary.exactPreviewJoins,3);
assert.equal(result.summary.missingPreviewJoins,0);
assert.deepStrictEqual(result.summary.unjoinedNormalizedPreviews,[]);
assert.deepStrictEqual(result.resources[0].moduleSymbols,['ARENA_BAK','ARENA_BAK_ALT']);
assert.equal(result.modules[0].sceneBmodSymbols[0],'ARENA_BMOD');
assert.equal(result.arcadeStageNamesVerified,false);
assert.equal(result.canonicalGameplayScenesVerified,false);
const missing=buildMK1StageHeaderBindingsP54(root,assets.slice(1));
assert.equal(missing.summary.exactPreviewJoins,2);
assert.equal(missing.summary.missingPreviewJoins,1);
assert.equal(missing.modules[0].status,'PREVIEW_UNAVAILABLE');
const bad=[
  [{...root,validation:{allChecksPassed:false}},assets],
  [{...root,decision:{...root.decision,arcadeStageNameMappingEstablished:true}},assets],
  [{...root,topLevelModules:[root.topLevelModules[0],root.topLevelModules[0]]},assets],
  [root,[...assets,assets[0]]],
  [root,assets.map((a,i)=>i? a:{...a,rgba:new Uint8Array(15)})],
  [{...root,topLevelModules:[{...root.topLevelModules[0],resourcePath:'NOT_A_HEADER.GRA'}]},assets],
];
for(const [g,a] of bad)assert.throws(()=>buildMK1StageHeaderBindingsP54(g,a));
console.log(JSON.stringify({pass:'P54',status:'PASS',qualifiedModuleJoins:3,headerResources:2,
  missingPreviewHandled:true,negativeControlsRejected:bad.length,
  sourceOnly:true,stageNamesInvented:false,originalGameDataUsed:false},null,2));
