#!/usr/bin/env node
/** P40 original-MK2 fixture integration and negative-control gate.
 * node scripts/verify-mk2-p40-portal-coverage.cjs <original MK2 folder> [private-report.json]
 * Source-only CI cannot replace this original-game test.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {buildMK2SourceCoverageP40}=require('../src/core/assets/mk2SourceCoverageP40.ts');
const reference=require('../docs/validation/P39_PORTAL_SOURCE_AUDIT_2026-11-07.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const root=process.argv[2];assert.ok(root,'Provide original MK2 directory');const data=new Map();
function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=prefix?prefix+'/'+e.name:e.name,full=path.join(dir,e.name);if(e.isDirectory())walk(full,p);else if(e.isFile())data.set(p,new Uint8Array(fs.readFileSync(full)));}}
walk(root);
const source={directoryName:'P40 original MK2',isSynthetic:false,
 async listRecursive(){return [...data].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));},
 async readSlice(p,start,count){const b=data.get(p);if(!b)throw Error('Missing '+p);return b.slice(start,start+count);}};
(async()=>{
 const c=await scanAssets(source,'mk2',()=>{});
 assert.equal(c.assets.length,5369);assert.equal(new Set(c.assets.map(a=>a.id)).size,5369);
 const p40=c.reports.p40SourceCoverage,p38=c.reports.p38SourceCoverage;
 assert.equal(p40.status,'VERIFIED_INTERVAL_ACCOUNTING');
 assert.equal(p40.portalEffectReconciliation.status,'VERIFIED');
 assert.equal(p40.sceneCompletenessClaimed,false);assert.equal(p40.originalDataIncluded,false);
 assert.equal(p40.resources.length,15);
 const portal=p40.resources.find(x=>x.name==='PORTAL.GRA');
 assert.equal(portal.qualifiedReferences,34);assert.equal(portal.coveredBytes,92756);
 assert.equal(portal.outsideScopeBytes,0);assert.equal(portal.duplicateOrOverlappingReferenceBytes,0);assert.deepStrictEqual(portal.gaps,[]);
 assert.equal(p40.resources.reduce((n,x)=>n+x.qualifiedReferences,0),308);
 for(const prev of p38.resources.filter(x=>x.name!=='PORTAL.GRA'))assert.deepStrictEqual(p40.resources.find(x=>x.name===prev.name),prev);
 const oldPkg=c.packages.find(p=>p.name==='MK2_P38_NATIVE_SOURCE_INTERVAL_COVERAGE.json');
 const newPkg=c.packages.find(p=>p.name==='MK2_P40_NATIVE_SOURCE_INTERVAL_COVERAGE.json');
 assert(oldPkg&&newPkg);assert.deepStrictEqual(JSON.parse(new TextDecoder().decode(oldPkg.bytes)),p38);
 assert.deepStrictEqual(JSON.parse(new TextDecoder().decode(newPkg.bytes)),p40);
 const p38Original=require('../docs/validation/P38_TOMB_EFFECT_COVERAGE_2026-11-07.json').coverage;
 assert.deepStrictEqual(p38,p38Original,'P38 evidence report unchanged');
 const targets=reference.frames.map(f=>{const a=c.assets.find(a=>a.id===f.assetId);assert(a,'missing '+f.assetId);
  assert.deepStrictEqual([a.width,a.height,a.source.offset,a.source.offset+a.source.length],[f.width,f.height,f.start,f.endExclusive]);
  assert.equal(sha(a.metadata.indices),f.indicesSha256);assert.equal(sha(a.metadata.mask),f.maskSha256);return a;});
 const before=JSON.stringify(targets.map(a=>({source:a.source,metadata:a.metadata,rgba:sha(a.rgba)})));
 const listing=await source.listRecursive(),target=targets[0],mapChange=(fn)=>c.assets.map(a=>a===target?fn(a):a);
 const negatives=[
  c.assets.filter(a=>a!==target),[...c.assets,target],
  mapChange(a=>({...a,source:{...a.source,offset:a.source.offset+4}})),
  mapChange(a=>({...a,width:a.width+1})),
  mapChange(a=>({...a,metadata:{...a.metadata,descriptorObject2:0}})),
  mapChange(a=>({...a,metadata:{...a.metadata,sourceX:999}})),
  mapChange(a=>({...a,metadata:{...a.metadata,animationFPSKnown:true}})),
  mapChange(a=>({...a,source:{...a.source,sha256:'0'.repeat(64)}})),
  mapChange(a=>({...a,metadata:{...a.metadata,indices:a.metadata.indices.map((v,i)=>i?v:v^1)}})),
  mapChange(a=>({...a,metadata:{...a.metadata,mask:a.metadata.mask.map((v,i)=>i?v:v^1)}})),
 ];
 for(const altered of negatives){const bad=await buildMK2SourceCoverageP40(listing,altered);
  assert.equal(bad.status,'PARTIAL');assert.equal(bad.portalEffectReconciliation.status,'UNAVAILABLE');
  assert.equal(bad.resources.find(x=>x.name==='PORTAL.GRA').status,'UNAVAILABLE');
 }
 assert.deepStrictEqual(await buildMK2SourceCoverageP40(listing,c.assets),p40);
 assert.equal(JSON.stringify(targets.map(a=>({source:a.source,metadata:a.metadata,rgba:sha(a.rgba)}))),before);
 const result={pass:'P40',status:'PASS',uniqueAssets:5369,newRepresentations:0,originalPortalEffects:20,
  qualifiedReferences:308,portalBytes:92756,portalOutsideScopeBytes:0,negativeFixturesRejected:negatives.length,
  priorP38ReportPreserved:true,unaffectedResourcesPreserved:14,originalDataBrowserVerified:false,
  originalFixture:true,reportSha256:sha(newPkg.bytes)};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
