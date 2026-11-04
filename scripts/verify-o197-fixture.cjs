/** Fixture-level O197 validator; no Vite/npm dependency. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
let ts;try{ts=require('typescript')}catch{ts=require(process.env.TYPESCRIPT_PATH||'/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');}
require('node:module')._extensions['.ts']=function(mod,file){const s=fs.readFileSync(file,'utf8');const r=ts.transpileModule(s,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}});mod._compile(r.outputText,file);};
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const {MemoryDirectorySource}=require('../src/core/filesystem/DirectorySource.ts');
const {runO197ForestLayers,buildO197ForestForensicZip,o197LayerPng}=require('../src/core/experiments/o197.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const root=process.argv[2];assert(root,'Usage: node scripts/verify-o197-fixture.cjs <original MK2 game directory>');
const originals={};for(const n of ['MK2.EXE','FOREST.GRA'])originals[n]=new Uint8Array(fs.readFileSync(path.join(root,n.toLowerCase())));
const source=(files)=>{const s=new MemoryDirectorySource('O197 originals');for(const [n,b] of Object.entries(files))s.setFile(n,b);return s;};
const member=(z,name)=>{const m=parseAnimationStoreZip(z).get(name);assert(m,'Missing ZIP member '+name);return m.bytes;};
(async()=>{
 const r=await runO197ForestLayers(source(originals));assert.equal(r.layers.length,5);assert.equal(r.status,'source-verified-indexed-setup-layers-candidate-colors');
 assert.deepEqual(r.layers.map(v=>[v.width,v.height,v.placementCount,v.streams.length]),[[968,184,18,14],[728,160,10,10],[640,112,13,9],[616,96,15,9],[384,56,4,1]]);
 assert.deepEqual(r.layers.map(v=>v.opaquePixels),[56497,29650,16525,13577,7996]);
 assert.deepEqual(r.layers.map(v=>v.clippedOpaquePixels),[4080,0,0,0,6144]);
 assert(r.layers.every(v=>v.overdrawOpaquePixels===0));
 assert.equal(r.layers.flatMap(v=>v.placements).length,60);assert.equal(r.layers.flatMap(v=>v.streams).length,43);
 assert(r.layers.flatMap(v=>v.streams).every(s=>s.graEndExclusive<=198116&&s.encodedByteLength>0));
 assert(r.layers.every(v=>v.placements.every(p=>p.controlPhysical>0xa0c54&&p.descriptorPhysical>0xa0c54&&p.paletteSlot===2)));
 assert(r.layers.some(v=>v.streams.some(s=>s.commands.some(c=>c.kind==='skip'))));
 const zip=buildO197ForestForensicZip(r);assert.deepEqual(zip,buildO197ForestForensicZip(r),'forensic export must be byte-stable for identical report');const manifest=JSON.parse(new TextDecoder().decode(member(zip,'MANIFEST.json')));
 assert.equal(manifest.sourceGameFilesBundled,false);assert.equal(manifest.derivedOriginalPixelsIncluded,true);assert.equal(manifest.layerSummary.length,5);
 for(const l of r.layers){const dir=`variants/${l.variant}_${l.width}x${l.height}`;
  assert.deepEqual(member(zip,`${dir}/source_indices.bin`),l.indices);assert.deepEqual(member(zip,`${dir}/opacity_mask.bin`),l.opacity);
  for(const mode of ['color','index','mask']){const file=mode==='color'?'candidate_color.png':mode==='index'?'source_indices_preview.png':'opacity_mask_preview.png';assert.deepEqual(member(zip,`${dir}/${file}`),o197LayerPng(l,mode));}
  const trace=JSON.parse(new TextDecoder().decode(member(zip,`${dir}/indexed_stream_command_trace.json`)));
  assert.equal(trace.length,l.streams.length);assert(trace.every(s=>s.commands.length>0&&s.encodedByteLength>0));
 }
 assert.equal(parseAnimationStoreZip(zip).size,5+5*7);
 assert(![...parseAnimationStoreZip(zip).keys()].some(n=>/\.(GRA|EXE)$/i.test(n)));
 const changed={...originals,'FOREST.GRA':originals['FOREST.GRA'].slice()};changed['FOREST.GRA'][160000]^=1;
 await assert.rejects(runO197ForestLayers(source(changed)),/FOREST.GRA identity mismatch/);
 const changedExe={...originals,'MK2.EXE':originals['MK2.EXE'].slice()};changedExe['MK2.EXE'][0x89324+3]^=1;
 await assert.rejects(runO197ForestLayers(source(changedExe)),/MK2.EXE identity mismatch/);
 const absent={...originals};delete absent['FOREST.GRA'];await assert.rejects(runO197ForestLayers(source(absent)),/expected one FOREST.GRA/);
 const duplicates=source(originals);duplicates.setFile('duplicate/FOREST.GRA',originals['FOREST.GRA']);await assert.rejects(runO197ForestLayers(duplicates),/expected one FOREST.GRA/);
 if(process.env.O197_ZIP_PATH)fs.writeFileSync(process.env.O197_ZIP_PATH,zip);
 if(process.env.O197_REPORT_PATH){const slim={...r,layers:r.layers.map(({rgba,indices,opacity,...meta})=>meta)};fs.writeFileSync(process.env.O197_REPORT_PATH,JSON.stringify(slim,null,2));}
 if(process.env.O197_PREVIEW_DIR){fs.mkdirSync(process.env.O197_PREVIEW_DIR,{recursive:true});for(const l of r.layers){fs.writeFileSync(path.join(process.env.O197_PREVIEW_DIR,`Forest_O197_Original_Layer_${l.variant}_${l.width}x${l.height}_CANDIDATE_RGB.png`),o197LayerPng(l));}}
 console.log('O197 PASS: all five original Forest setup canvases, 60 placements, 43 streams, pixel/mask hashes, 40-member complete forensic package, mutation/missing/duplicate protection.');
})().catch(e=>{console.error(e);process.exitCode=1;});
