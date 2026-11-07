#!/usr/bin/env node
/** P54 current-source original MK1 acceptance. Original files stay outside Git.
 * node scripts/verify-mk1-p54-stage-joins.cjs <original MK1 folder> [private-report.json]
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {buildMK1StageHeaderBindingsP54}=require('../src/core/assets/mk1StageHeaderBindingsP54.ts');
const root=process.argv[2];assert(root,'Provide original MK1 folder');
const data=new Map();
function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=prefix?prefix+'/'+e.name:e.name,full=path.join(dir,e.name);if(e.isDirectory())walk(full,p);else if(e.isFile())data.set(p,new Uint8Array(fs.readFileSync(full)));}}
walk(root);
const source={directoryName:'P54 original MK1',isSynthetic:false,
 async listRecursive(){return [...data].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));},
 async readSlice(p,start,count){const b=data.get(p);if(!b)throw Error('Missing source '+p);return b.slice(start,start+count);}};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const e=[...data].filter(([p])=>path.basename(p).toUpperCase()==='MK1.EXE');assert.equal(e.length,1);
 assert.equal(sha(e[0][1]),'750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14');
 const report=await scanAssets(source,'mk1',()=>{});
 assert.equal(report.assets.length,2656);
 const joined=report.reports.stageHeaderBindings;
 assert(joined);assert.equal(joined.schema,'mk1_p54_header_module_preview_joins_v1');
 assert.equal(joined.summary.sourceModules,24);
 assert.equal(joined.summary.exactPreviewJoins,24);
 assert.equal(joined.summary.missingPreviewJoins,0);
 assert.deepStrictEqual(joined.summary.unjoinedNormalizedPreviews,[]);
 assert.equal(joined.arcadeStageNamesVerified,false);
 assert.equal(joined.canonicalGameplayScenesVerified,false);
 for(const m of joined.modules){
  assert.equal(m.status,'EXACT_JOIN');
  assert(m.normalizedPreviewAssetId);
  const matches=report.assets.filter(a=>a.id===m.normalizedPreviewAssetId);
  assert.equal(matches.length,1);
  assert(matches[0].rgba&&matches[0].rgba.length===matches[0].width*matches[0].height*4);
  assert([...data.keys()].some(p=>path.basename(p).toUpperCase()===m.headerResource),'missing original header '+m.headerResource);
 }
 const pkg=report.packages.find(p=>p.name==='MK1_P54_VERIFIED_HEADER_MODULE_PREVIEW_JOINS.json');
 assert(pkg);assert.deepStrictEqual(JSON.parse(new TextDecoder().decode(pkg.bytes)),joined);
 const before=JSON.stringify(joined);
 const mutated=report.assets.map(a=>a.id===joined.modules[0].normalizedPreviewAssetId?
  {...a,rgba:new Uint8Array(1)}:a);
 // Mutation is applied to the same qualified graph captured by the canonical pipeline.
 // Report construction must reject the false preview geometry independently.
 const graphLike={status:'SUCCESS',validation:{allChecksPassed:true},
  decision:{backgroundModuleGrammarBounded:true,packedRootResourcesResolved:true,sceneBmodReferenceSurfaceEstablished:true,arcadeStageNameMappingEstablished:false},
  topLevelModules:joined.modules.map(m=>({symbol:m.moduleSymbol,resourcePath:m.resourcePath,
   sceneEntries:m.sceneBmodSymbols.map(bmodSymbol=>({kind:'BMOD_WITH_PACKED_I16_PAIR',bmodSymbol}))}))};
 assert.throws(()=>buildMK1StageHeaderBindingsP54(graphLike,mutated));
 assert.deepStrictEqual(JSON.stringify(joined),before);
 const result={pass:'P54',status:'PASS',mk1Assets:2656,modules:joined.summary.sourceModules,
  uniqueHeaderResources:joined.summary.headerResources,exactPreviewJoins:joined.summary.exactPreviewJoins,
  unknownGameplaySceneClaims:false,invalidPreviewRejected:true,
  reportSha256:sha(pkg.bytes),originalDataBrowserInteractionVerified:false};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
