#!/usr/bin/env node
/** P40 original-MK2 fixture integration and negative-control gate.
 * node scripts/verify-mk2-p40-portal-coverage.cjs <original MK2 folder> [private-report.json]
 * Source-only CI cannot replace this original-game test.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {buildMK2SourceCoverageP43}=require('../src/core/assets/mk2SourceCoverageP43.ts');
const reference=require('../docs/validation/P42_TOWER_SOURCE_AUDIT_2026-11-07.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const root=process.argv[2];assert.ok(root,'Provide original MK2 directory');const data=new Map();
function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=prefix?prefix+'/'+e.name:e.name,full=path.join(dir,e.name);if(e.isDirectory())walk(full,p);else if(e.isFile())data.set(p,new Uint8Array(fs.readFileSync(full)));}}
walk(root);
const source={directoryName:'P40 original MK2',isSynthetic:false,
 async listRecursive(){return [...data].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));},
 async readSlice(p,start,count){const b=data.get(p);if(!b)throw Error('Missing '+p);return b.slice(start,start+count);}};

const {selectedZip}=require('../src/core/assets/export.ts');
(async()=>{
 const c=await scanAssets(source,'mk2',()=>{}),r=c.reports.p43SourceCoverage,previous=c.reports.p40SourceCoverage;
 assert.equal(c.assets.length,5369);assert.equal(new Set(c.assets.map(a=>a.id)).size,5369);
 assert.equal(r.status,'VERIFIED_INTERVAL_ACCOUNTING');assert.equal(r.towerEffectReconciliation.status,'VERIFIED');
 assert.equal(r.sceneCompletenessClaimed,false);assert.equal(r.originalDataIncluded,false);
 const tower=r.resources.find(x=>x.name==='TOWER.GRA');
 assert.equal(tower.qualifiedReferences,14);assert.equal(tower.coveredBytes,113612);assert.equal(tower.outsideScopeBytes,0);assert.deepStrictEqual(tower.gaps,[]);
 assert.equal(r.resources.reduce((n,x)=>n+x.qualifiedReferences,0),315);
 for(const before of previous.resources.filter(x=>x.name!=='TOWER.GRA'))assert.deepStrictEqual(r.resources.find(x=>x.name===before.name),before);
 for(const [pass,digest]of [['P37','0796e016bd03f7ca8c3a9d518717a67095c7a1602f241b74c551894532d8c536'],['P38','38326a2096b6c89a68d788805fe6832a92dc48097e34d8190be3a599ea7fcf4a'],['P40','d7ce0a5e34b655bfe68cae6a8d450f4511d6efda2bed94a0e2dd7e837eda984c']]){
  assert.equal(sha(c.packages.find(p=>p.name==='MK2_'+pass+'_NATIVE_SOURCE_INTERVAL_COVERAGE.json').bytes),digest);
 }
 const pkg=c.packages.find(p=>p.name==='MK2_P43_NATIVE_SOURCE_INTERVAL_COVERAGE.json');
 assert.deepStrictEqual(JSON.parse(new TextDecoder().decode(pkg.bytes)),r);
 const targets=reference.frames.map(g=>{const a=c.assets.find(a=>a.id===g.assetId);assert(a);
  assert.deepStrictEqual([a.width,a.height,a.source.offset,a.source.offset+a.source.length],[g.width,g.height,g.start,g.endExclusive]);
  assert.equal(sha(a.metadata.indices),g.indicesSha256);assert.equal(sha(a.metadata.mask),g.maskSha256);return a;});
 const target=targets[0],change=fn=>c.assets.map(a=>a===target?fn(a):a),listing=await source.listRecursive();
 const snapshot=JSON.stringify(targets.map(a=>({source:a.source,metadata:a.metadata,rgba:sha(a.rgba)})));
 const negatives=[c.assets.filter(a=>a!==target),[...c.assets,target],
 change(a=>({...a,source:{...a.source,offset:a.source.offset+4}})),change(a=>({...a,width:a.width+1})),
 change(a=>({...a,metadata:{...a.metadata,descriptorObject2:0}})),change(a=>({...a,metadata:{...a.metadata,sourceX:999}})),
 change(a=>({...a,metadata:{...a.metadata,animationFPSKnown:true}})),change(a=>({...a,source:{...a.source,sha256:'0'.repeat(64)}})),
 change(a=>({...a,metadata:{...a.metadata,indices:a.metadata.indices.map((v,i)=>i?v:v^1)}})),
 change(a=>({...a,metadata:{...a.metadata,mask:a.metadata.mask.map((v,i)=>i?v:v^1)}}))];
 for(const badAssets of negatives){const bad=await buildMK2SourceCoverageP43(listing,badAssets);assert.equal(bad.status,'PARTIAL');assert.equal(bad.towerEffectReconciliation.status,'UNAVAILABLE');}
 assert.deepStrictEqual(await buildMK2SourceCoverageP43(listing,c.assets),r);
 assert.equal(JSON.stringify(targets.map(a=>({source:a.source,metadata:a.metadata,rgba:sha(a.rgba)}))),snapshot);
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(r,null,2)+'\n');
 const effects=c.assets.filter(a=>a.id.startsWith('mk2-stage-effect:'));assert.equal(effects.length,43);
 if(process.argv[4])fs.writeFileSync(process.argv[4],selectedZip(effects));
 console.log(JSON.stringify({status:'PASS',pass:'P43',uniqueAssets:5369,newRepresentations:0,towerEffects:7,qualifiedReferences:315,
  coveredResourceBytes:r.resources.reduce((n,x)=>n+x.coveredBytes,0),towerBytes:113612,invalidEffectSetsRejected:10,
  legacyP37P38P40PackagesByteIdentical:true,unaffectedResourcesPreserved:14,cleanReverified:true,reportSha256:sha(pkg.bytes),
  existingEffectExportFrames:effects.length,existingEffectPreviewRgbaSha256:Object.fromEntries(effects.map(a=>[a.id,sha(a.rgba)]))},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
