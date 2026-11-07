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
(async()=>{
 const c=await scanAssets(source,'mk2',()=>{}),r=c.reports.p37SourceCoverage;
 assert.equal(c.assets.length,5369);assert.equal(new Set(c.assets.map(a=>a.id)).size,5369);
 assert.equal(r.status,'VERIFIED_INTERVAL_ACCOUNTING');
 assert.equal(r.sceneCompletenessClaimed,false);assert.equal(r.originalDataIncluded,false);
 const pkg=c.packages.find(p=>p.name==='MK2_P37_NATIVE_SOURCE_INTERVAL_COVERAGE.json');assert.ok(pkg);
 assert.deepStrictEqual(JSON.parse(new TextDecoder().decode(pkg.bytes)),r);
 assert.equal(r.resources.length,15);
 const cave=r.resources.find(x=>x.name==='CAVE.GRA');assert.equal(cave.coveredBytes,57192);assert.deepStrictEqual(cave.gaps,[{start:0,endExclusive:120}]);
 for(const n of ['FOREST.GRA','PIT.GRA','ARMORY.GRA','ARENA.GRA'])assert.equal(r.resources.find(x=>x.name===n).outsideScopeBytes,0,n);
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(r,null,2)+'\n');
 const result={status:'PASS',uniqueAssets:c.assets.length,resources:r.resources.length,coverageStatus:r.status,packageSha256:crypto.createHash('sha256').update(pkg.bytes).digest('hex'),
 resourcesSummary:r.resources.map(x=>({name:x.name,status:x.status,registeredRepresentations:x.registeredRepresentations,qualifiedReferences:x.qualifiedReferences,coveredBytes:x.coveredBytes,outsideScopeBytes:x.outsideScopeBytes,gaps:x.gaps}))};
 console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});

