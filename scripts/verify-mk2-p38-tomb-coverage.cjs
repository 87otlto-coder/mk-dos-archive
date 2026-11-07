#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const root=process.argv[2];assert.ok(root,'Provide original MK2 directory');const files=new Map();
function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=prefix?prefix+'/'+e.name:e.name;if(e.isDirectory())walk(path.join(dir,e.name),p);else if(e.isFile())files.set(p,new Uint8Array(fs.readFileSync(path.join(dir,e.name))));}}walk(root);
const source={directoryName:'P37 original fixture',isSynthetic:false,
 async listRecursive(){return [...files].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));},
 async readSlice(p,start,count){return files.get(p).slice(start,start+count);}};
const {buildMK2SourceCoverageP38}=require('../src/core/assets/mk2SourceCoverageP38.ts');
const {selectedZip}=require('../src/core/assets/export.ts');
const reference=require('./fixtures/mk2-p38-tomb-effects-independent.json');
const H=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const c=await scanAssets(source,'mk2',()=>{}),r=c.reports.p38SourceCoverage,old=c.reports.p37SourceCoverage;
 assert.equal(c.assets.length,5369);assert.equal(new Set(c.assets.map(a=>a.id)).size,5369);
 assert.equal(r.status,'VERIFIED_INTERVAL_ACCOUNTING');assert.equal(r.tombEffectReconciliation.status,'VERIFIED');
 assert.equal(r.sceneCompletenessClaimed,false);assert.equal(r.originalDataIncluded,false);
 const pkg=c.packages.find(p=>p.name==='MK2_P38_NATIVE_SOURCE_INTERVAL_COVERAGE.json');assert.ok(pkg);
 assert.deepStrictEqual(JSON.parse(new TextDecoder().decode(pkg.bytes)),r);
 assert.equal(H(c.packages.find(p=>p.name==='MK2_P37_NATIVE_SOURCE_INTERVAL_COVERAGE.json').bytes),'0796e016bd03f7ca8c3a9d518717a67095c7a1602f241b74c551894532d8c536');
 assert.equal(r.resources.length,15);
 const tomb=r.resources.find(x=>x.name==='TOMB.GRA');assert.equal(tomb.coveredBytes,106784);assert.equal(tomb.qualifiedReferences,33);assert.deepStrictEqual(tomb.gaps,[]);
 assert.equal(r.resources.reduce((n,x)=>n+x.qualifiedReferences,0),288);
 for(const before of old.resources.filter(x=>x.name!=='TOMB.GRA'))assert.deepStrictEqual(r.resources.find(x=>x.name===before.name),before);
 const selected=reference.frames.map(g=>{
  const a=c.assets.find(a=>a.id===g.assetId);assert.ok(a);
  assert.deepStrictEqual([a.width,a.height,a.source.offset,a.source.offset+a.source.length],[g.width,g.height,g.start,g.endExclusive]);
  assert.equal(H(a.metadata.indices),g.indicesSha256);assert.equal(H(a.metadata.mask),g.maskSha256);return a;
 });
 const snapshot=JSON.stringify(selected.map(a=>({source:a.source,metadata:a.metadata,rgbaSha:H(a.rgba)})));
 const listing=await source.listRecursive();let rejected=0;
 const target=selected[0];
 const cases=[
  c.assets.filter(a=>a.id!==target.id),
  [...c.assets,target],
  c.assets.map(a=>a===target?{...a,source:{...a.source,offset:a.source.offset+4}}:a),
  c.assets.map(a=>a===target?{...a,width:a.width+1}:a),
  c.assets.map(a=>a===target?{...a,metadata:{...a.metadata,descriptorObject2:0}}:a),
  c.assets.map(a=>a===target?{...a,metadata:{...a.metadata,sourceX:999}}:a),
  c.assets.map(a=>a===target?{...a,metadata:{...a.metadata,animationFPSKnown:true}}:a),
  c.assets.map(a=>a===target?{...a,source:{...a.source,sha256:'0'.repeat(64)}}:a),
  c.assets.map(a=>a===target?{...a,metadata:{...a.metadata,indices:a.metadata.indices.map((v,i)=>i?v:v^1)}}:a),
  c.assets.map(a=>a===target?{...a,metadata:{...a.metadata,mask:a.metadata.mask.map((v,i)=>i?v:v^1)}}:a),
 ];
 for(const altered of cases){const bad=await buildMK2SourceCoverageP38(listing,altered);assert.equal(bad.status,'PARTIAL');assert.equal(bad.tombEffectReconciliation.status,'UNAVAILABLE');assert.equal(bad.resources.find(x=>x.name==='TOMB.GRA').status,'UNAVAILABLE');rejected++;}
 assert.deepStrictEqual(await buildMK2SourceCoverageP38(listing,c.assets),r);
 assert.equal(JSON.stringify(selected.map(a=>({source:a.source,metadata:a.metadata,rgbaSha:H(a.rgba)}))),snapshot);
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(r,null,2)+'\n');
 const zip=selectedZip(selected);if(process.argv[4])fs.writeFileSync(process.argv[4],zip);
 console.log(JSON.stringify({status:'PASS',uniqueAssets:c.assets.length,existingEffects:16,newRepresentations:0,qualifiedReferences:288,
  coveredResourceBytes:r.resources.reduce((n,x)=>n+x.coveredBytes,0),unaffectedResourcesPreserved:14,invalidEffectSetsRejected:rejected,cleanReverified:true,
  p37PackageByteIdentical:true,packageSha256:H(pkg.bytes),privateEffectZipSha256:H(zip)},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
