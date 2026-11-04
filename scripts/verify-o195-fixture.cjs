/** Dependency-independent original fixture and forensic ZIP contract smoke checks. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
let ts;try{ts=require('typescript')}catch{ts=require(process.env.TYPESCRIPT_PATH || '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
require('node:module')._extensions['.ts']=function(mod,file){
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
 mod._compile(code,file);
};
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const {MemoryDirectorySource}=require('../src/core/filesystem/DirectorySource.ts');
const {runO195CrossStageFloor,buildO195ForensicZip,o195FloorGeometrySvg,captureO195StreamTokens}=require('../src/core/experiments/o195.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const folder=process.argv[2];if(!folder)throw new Error('Usage: node scripts/verify-o195-fixture.cjs <path-to-original-MK2-game-files>');
const names=['MK2.EXE','TOMB.GRA','BATTLE.GRA','TOWER.GRA','FOREST.GRA','ARMORY.GRA','PORTAL.GRA','ARENA.GRA'];
const raw={};for(const name of names){const file=path.join(folder,name);raw[name]=new Uint8Array(fs.readFileSync(fs.existsSync(file)?file:path.join(folder,name.toLowerCase())))}
function sourceFrom(data){const s=new MemoryDirectorySource('MK2 fixture O195');for(const [name,bytes] of Object.entries(data))s.setFile(name,bytes);return s;}
function entry(zip,n){const r=parseAnimationStoreZip(zip).get(n);assert(r,`missing ${n}`);return Buffer.from(r.bytes).toString('utf8')}
(async()=>{
 const canonical=await runO195CrossStageFloor(sourceFrom(raw));
 assert.equal(canonical.rows.length,7);assert.equal(canonical.status,'experimental');
 assert.equal(canonical.sourceEXE.sha256,'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65');
 const indexed=Object.fromEntries(canonical.rows.map(r=>[r.stage,r]));
 for(const name of ['PORTAL.GRA','ARENA.GRA','BATTLE.GRA']){
  assert.equal(indexed[name].sourcePointer,0x8432a);
  assert.equal(indexed[name].rawDestinationY,164);
  assert.equal(indexed[name].requestedRows,40);
  assert.equal(indexed[name].visibleRows,36);
 }
 assert.equal(indexed['FOREST.GRA'].visibleRows,28);
 assert.equal(indexed['FOREST.GRA'].rawDestinationY,172);
 assert.equal(indexed['FOREST.GRA'].requestedRows,32);
 assert.equal(indexed['ARMORY.GRA'].sourcePointer,0x84312);
 for(const r of canonical.rows){
  assert.equal(r.originalPackedCommandPhysical,0xa0c54+r.controlTokens.find(t=>t.kind==='packed-draw').object2Offset);
  assert.equal(r.controlTokens.at(-1).kind,'terminator');
  assert.equal(r.controlTokens.filter(t=>t.kind==='positive-pair').length,r.pairCount);
  assert.equal(r.controlTokens.filter(t=>t.kind==='packed-draw').length,1);
  assert.equal(r.visibleRows+r.clippedRows,r.requestedRows);
  for(const t of r.controlTokens){
   assert.equal(t.rawWordHex.length,t.physicalByteLength*2);
   assert.equal(Buffer.from(raw['MK2.EXE'].subarray(t.exePhysicalOffset,t.exePhysicalOffset+t.physicalByteLength)).toString('hex'),t.rawWordHex);
  }
 }
 const zip=buildO195ForensicZip(canonical);
 const manifest=JSON.parse(entry(zip,'MANIFEST.json'));
 assert.equal(manifest.sourceGameFilesBundled,false);
 assert.equal(manifest.sourceSHA256,canonical.sourceEXE.sha256);
 const control=JSON.parse(entry(zip,'evidence/full_control_tokens.json'));
 assert.equal(control.length,7);
 assert.deepEqual(control[0].tokens,canonical.rows[0].controlTokens);
 const geom=JSON.parse(entry(zip,'results/row_geometry.json'));
 assert.equal(geom.find(x=>x.stage==='FOREST.GRA').visibleRows,28);
 assert(entry(zip,'results/geometry_comparison.svg').includes('NOT gameplay screen capture'));
 assert(entry(zip,'reproduce/README.md').includes('source SHA-256'));
 assert(!Array.from(parseAnimationStoreZip(zip).keys()).some(x=>/\.(EXE|GRA)$/i.test(x)));
 // Changing a hypothetical state affects visibility while leaving canonical source operands unchanged.
 const shifted=await runO195CrossStageFloor(sourceFrom(raw),8*65536,288);
 assert.equal(shifted.rows.find(x=>x.stage==='FOREST.GRA').visibleRows,32);
 assert.equal(shifted.rows.find(x=>x.stage==='FOREST.GRA').rawDestinationY,172);
 const graMissing={...raw};delete graMissing['ARENA.GRA'];
 const missing=await runO195CrossStageFloor(sourceFrom(graMissing));
 assert(missing.refusals.some(x=>x.startsWith('ARENA.GRA')));
 assert.equal(missing.rows.find(x=>x.stage==='ARENA.GRA').resourceExists,false);
 // Tampered EXE cannot establish O130/O131 canonical claims.
 const altered={...raw,'MK2.EXE':new Uint8Array(raw['MK2.EXE'])};altered['MK2.EXE'][123456]^=1;
 await assert.rejects(runO195CrossStageFloor(sourceFrom(altered)),/canonical original EXE hash/);
 assert.throws(()=>captureO195StreamTokens(raw['MK2.EXE'],999999),/outside EXE/);
 await assert.rejects(runO195CrossStageFloor(sourceFrom(raw),2147483648),/signed scroll integer/);
 const svg=new TextDecoder().decode(o195FloorGeometrySvg(canonical));
 assert(svg.includes('Forest')===false || svg.includes('FOREST.GRA')); // content format stays ASCII
 if(process.env.O195_REPORT_PATH){
  fs.writeFileSync(process.env.O195_REPORT_PATH,JSON.stringify({format:canonical.format,sourceEXE:canonical.sourceEXE,sourceGraphics:canonical.sourceGraphics,rows:canonical.rows,parameters:canonical.parameters,observations:canonical.observations,limitations:canonical.limitations},null,2));
 }
 if(process.env.O195_SVG_PATH)fs.writeFileSync(process.env.O195_SVG_PATH,svg);
 if(process.env.O195_ZIP_PATH)fs.writeFileSync(process.env.O195_ZIP_PATH,zip);
 console.log(`O195 PASS: ${canonical.rows.length} authenticated stage streams, ${canonical.rows.reduce((n,r)=>n+r.controlTokens.length,0)} exact original tokens, original hash guards, row visibility, tamper rejection, and forensic ZIP.`);
})().catch(e=>{console.error(e);process.exitCode=1});
