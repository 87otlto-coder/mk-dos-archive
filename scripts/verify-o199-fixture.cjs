/** O199 dependency-light original MK2 initializer and evidence package test */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
let ts; try { ts=require('typescript'); } catch { ts=require(process.env.TYPESCRIPT_PATH || '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
require('node:module')._extensions['.ts']=function(mod,file){
 const transpiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}});
 const errors=(transpiled.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
 if(errors.length)throw new Error('TypeScript syntax error in '+file+': '+errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; '));
 mod._compile(transpiled.outputText,file);
};
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const {MemoryDirectorySource}=require('../src/core/filesystem/DirectorySource.ts');
const {runO199ForestInitializer,buildO199ForestEvidenceZip}=require('../src/core/experiments/o199.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const root=process.argv[2];assert(root,'usage: node scripts/verify-o199-fixture.cjs <original MK2 directory>');
const exe=fs.readFileSync(path.join(root,fs.existsSync(path.join(root,'MK2.EXE'))?'MK2.EXE':'mk2.exe'));
const mk=(input)=>{let s=new MemoryDirectorySource('Original executable');for(const [name,bytes]of Object.entries(input))s.setFile(name,new Uint8Array(bytes));return s;};
(async()=>{
 const report=await runO199ForestInitializer(mk({'MK2.EXE':exe}));
 assert.equal(report.registrations.length,2);
 assert.deepEqual(report.registrations.map(r=>r.targetPhysical),[0x82b04,0x82c44]);
 assert.deepEqual(report.modes.map(r=>r.setupVariantsReferenced),[[1,2,5],[1,2,5],[1,2,3,4,5],[1,2,5]]);
 assert.deepEqual(report.modes.map(r=>r.initializerRegistrationsReached.length),[1,2,2,2]);
 assert(report.registrations.every(r=>!r.liveObjectAllocated&&!r.functionExecutedDuringGameplay));
 assert.equal(report.source.taskCallbackFieldOffset,0x1c);
 const zip=buildO199ForestEvidenceZip(report);
 assert.deepEqual(zip,buildO199ForestEvidenceZip(report));
 const entries=parseAnimationStoreZip(zip);assert.equal(entries.size,9);
 const exported=JSON.parse(new TextDecoder().decode(entries.get('evidence/report.json').bytes));
 assert.deepEqual(exported,report);
 assert(![...entries.keys()].some(n=>/\.(exe|gra)$/i.test(n)));
 const corrupt=new Uint8Array(exe);corrupt[0x82ae7]^=1;
 await assert.rejects(runO199ForestInitializer(mk({'MK2.EXE':corrupt})),/canonical/);
 await assert.rejects(runO199ForestInitializer(mk({'FOREST.GRA':exe})),/one MK2.EXE/);
 if(process.env.O199_ZIP_PATH)fs.writeFileSync(process.env.O199_ZIP_PATH,zip);
 if(process.env.O199_REPORT_PATH)fs.writeFileSync(process.env.O199_REPORT_PATH,JSON.stringify(report,null,2)+'\n');
 console.log('PASS O199: authenticated Forest initializer, 2 registration pointers, 4 conditional mode cases, pool helper and deterministic forensic ZIP; modified source rejected');
})().catch(e=>{console.error(e);process.exitCode=1;});
