/** O194 dependency-independent fixture smoke test. Requires original game files locally.
 * Invoke node scripts/verify-o194-fixture.cjs /absolute/path/to/MK2-files
 */
const fs=require('node:fs');
const path=require('node:path');
let ts; try { ts=require('typescript'); } catch { ts=require(process.env.TYPESCRIPT_PATH || '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const Module=require('node:module');
Module._extensions['.ts']=function(m,file){
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
 m._compile(code,file);
};
const assert=require('node:assert/strict');
const { webcrypto }=require('node:crypto');
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const fixture=process.argv[2];
if(!fixture)throw new Error('Pass a path containing original MK2.EXE, FOREST.GRA, PORTAL.GRA, TOMB.GRA and TOWER.GRA');
const {MemoryDirectorySource}=require('../src/core/filesystem/DirectorySource.ts');
const {runPortalForestHypothesis,compileAllKnowns,buildKnownEvidenceZip,buildHypothesisEvidenceZip,importHypothesisZip}=require('../src/core/experiments/o194.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
function document(zip,name){const data=parseAnimationStoreZip(zip).get(name);assert(data,`Missing ZIP entry ${name}`);return JSON.parse(Buffer.from(data.bytes).toString());}
(async()=>{
 const source=new MemoryDirectorySource('MK2 original fixture');
 for(const f of ['MK2.EXE','FOREST.GRA','PORTAL.GRA','TOMB.GRA','TOWER.GRA'])source.setFile(f,new Uint8Array(fs.readFileSync(path.join(fixture,f))));
 const assumptions=['packed-draw','portal-frame-list','palette','placement'];
 const r=await runPortalForestHypothesis(source,assumptions);
 assert.equal(r.assumptions.length,4);
 assert.equal(r.assumptions[0].status,'partial');
 assert(r.assumptions.every(s=>s.status!=='compiled'),'No hypothesis is automatically verified');
 assert.equal(r.sourceWitnesses.length,3);
 const zipped=buildHypothesisEvidenceZip(r,'forensic');
 const imported=importHypothesisZip(zipped);
 assert.equal(imported.assumptions.length,4);
 assert(imported.limitations.some(s=>s.includes('untrusted')));
 assert.equal(document(zipped,'MANIFEST.json').sourceGameFilesBundled,false);
 assert(parseAnimationStoreZip(zipped).has('results/control_stream_comparison.svg'));
 assert.equal(document(zipped,'evidence/source_hashes.json').length,3);
 assert.throws(()=>importHypothesisZip(new Uint8Array([1,2,3])));
 const run=await compileAllKnowns(source,'mk2',undefined,undefined,false);
 assert.equal(run.assets.length,43);
 assert.equal(run.steps.filter(s=>s.status==='compiled'&&s.id.startsWith('effects-')).length,3);
 const assetZip=buildKnownEvidenceZip(run,'forensic');
 assert.equal(document(assetZip,'results/catalogue.json').length,43);
 assert.equal(document(assetZip,'MANIFEST.json').sourceGameFilesBundled,false);
 assert(parseAnimationStoreZip(assetZip).has('diagnostics/execution_trace.json'));
 // An intentionally tampered source must not silently inherit verified sprite status.
 const corrupt=new MemoryDirectorySource('MK2 tampered fixture');
 for(const f of ['MK2.EXE','FOREST.GRA','PORTAL.GRA','TOMB.GRA','TOWER.GRA']){
  const b=new Uint8Array(fs.readFileSync(path.join(fixture,f)));
  if(f==='PORTAL.GRA')b[700]^=1;
  corrupt.setFile(f,b);
 }
 const negative=await compileAllKnowns(corrupt,'mk2',undefined,undefined,false);
 assert.equal(negative.steps.find(s=>s.id==='effects-portal').status,'unsupported');
 assert(negative.assets.length<43);
 const aborted=new AbortController();
 const interrupted=await compileAllKnowns(source,'mk2',aborted.signal,step=>{if(step.id==='stage-resources')aborted.abort();},false);
 assert(interrupted.steps.some(s=>s.id==='compilation-interruption'&&s.status==='partial'));
 assert(interrupted.steps.some(s=>s.id==='inventory'&&s.status==='compiled'));
 
 console.log('O194 fixture checks passed: 43 original frames; 4 conservative assumptions; ZIP import/export; corrupted Portal rejected; partial catalogue retained.');
})().catch(err=>{console.error(err);process.exitCode=1;});
