/** Dependency-light O200 static Forest callback verification. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
let ts;try{ts=require('typescript');}catch{ts=require(process.env.TYPESCRIPT_PATH||'/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');}
require('node:module')._extensions['.ts']=function(mod,file){
 const r=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}});
 const errs=(r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
 if(errs.length)throw new Error(file+': '+errs.map(e=>ts.flattenDiagnosticMessageText(e.messageText,' ')).join('; '));
 mod._compile(r.outputText,file);
};
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const {MemoryDirectorySource}=require('../src/core/filesystem/DirectorySource.ts');
const {runO200ForestCallbackCoordinates,buildO200ForestEvidenceZip}=require('../src/core/experiments/o200.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const root=process.argv[2];assert(root,'usage: node scripts/verify-o200-fixture.cjs <original MK2 folder>');
const filename=fs.existsSync(path.join(root,'MK2.EXE'))?'MK2.EXE':'mk2.exe';
const exe=fs.readFileSync(path.join(root,filename));
function wrap(b){let source=new MemoryDirectorySource('Original MK2');source.setFile('MK2.EXE',new Uint8Array(b));return source;}
(async()=>{
 const report=await runO200ForestCallbackCoordinates(wrap(exe));
 assert.equal(report.objects.length,3);
 assert.deepEqual(report.objects.map(x=>[x.outputField1A,x.outputField1E]),[[197,76],[422,76],[638,76]]);
 assert.deepEqual(report.objects.map(x=>x.packedEdx),[0x650106,0x650232,0x650352]);
 assert.equal(report.firstCallback.originalLoopCount,3);
 assert.equal(report.verifiedByGameplay,false);
 const zip=buildO200ForestEvidenceZip(report);
 assert.deepEqual(zip,buildO200ForestEvidenceZip(report));
 const entries=parseAnimationStoreZip(zip);
 assert.equal(entries.size,8);
 assert.deepEqual(JSON.parse(new TextDecoder().decode(entries.get('evidence/report.json').bytes)),report);
 assert(![...entries.keys()].some(n=>/\.(exe|gra)$/i.test(n)));
 const altered=new Uint8Array(exe);altered[0x64a2a]^=1;
 await assert.rejects(runO200ForestCallbackCoordinates(wrap(altered)),/canonical/);
 if(process.env.O200_ZIP_PATH)fs.writeFileSync(process.env.O200_ZIP_PATH,zip);
 if(process.env.O200_REPORT_PATH)fs.writeFileSync(process.env.O200_REPORT_PATH,JSON.stringify(report,null,2)+'\n');
 console.log('PASS O200: 3 original packed coordinate operands, signed 16-bit transforms and original stores; first callback conditional loop; deterministic 8-entry ZIP; modified original rejected');
})().catch(e=>{console.error(e);process.exitCode=1;});
