#!/usr/bin/env node
/** P61 independent O123/P59 Tomb decoder readback using ORIGINAL MK2 and private P59 ZIP.
 * node scripts/verify-mk2-p61-tomb-independent.cjs <original-MK2-dir> <private-P59-zip-path> [private-report.json]
 * No commercial files or extracted graphics are written into Git.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(
 ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const root=fs.realpathSync(path.resolve(__dirname,'..'));
const input=process.argv.slice(2);
assert(input.length===2||input.length===3,'Usage: original MK2 dir, private P59 ZIP output, optional private JSON');
const original=fs.realpathSync(input[0]);assert(fs.statSync(original).isDirectory());
const contains=(parent,child)=>{const rel=path.relative(parent,child);
 return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));};
function canonical(target){
 let at=path.resolve(target),suffix=[];
 while(!fs.existsSync(at)){const parent=path.dirname(at);assert.notEqual(parent,at);suffix.unshift(path.basename(at));at=parent;}
 return path.resolve(fs.realpathSync(at),...suffix);
}
assert(!contains(root,original),'Original source must remain outside checkout');
const output=canonical(input[1]),report=input[2]&&canonical(input[2]);
for(const target of [output,report].filter(Boolean)){
 assert(!contains(root,target)&&!contains(original,target),'Private output must stay outside checkout and original DOS folder');
}
if(report)assert.notEqual(report,output,'ZIP and JSON destinations must differ');
const data=new Map();
function walk(dir,prefix=''){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 const name=prefix?prefix+'/'+entry.name:entry.name,full=path.join(dir,entry.name);
 if(entry.isDirectory())walk(full,name);else if(entry.isFile())data.set(name,new Uint8Array(fs.readFileSync(full)));
}}walk(original);
const entries=[...data].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));
const matches=entries.filter(e=>e.name.toUpperCase()==='MK2.EXE');
assert.equal(matches.length,1,'canonical MK2 executable required');
assert.equal(crypto.createHash('sha256').update(data.get(matches[0].path)).digest('hex'),
 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65');
const source={directoryName:'P61 original MK2 independent P59',isSynthetic:false,
 async listRecursive(){return entries;},
 async readSlice(p,start,len){const b=data.get(p);if(!b)throw Error('Missing original file '+p);return b.slice(start,start+len);}};
(async()=>{
 const c=await scanAssets(source,'mk2',()=>{});
 assert.equal(c.assets.length,5369);
 assert.equal(c.reports.p59TombWitness?.status,'VERIFIED');
 const packages=c.packages.filter(p=>p.name==='MK2_P59_TOMB_SCREENSHOT_SAMPLES.zip');
 assert.equal(packages.length,1,'one exact P59 original ZIP');
 const bytes=packages[0].bytes;
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,bytes);
 const py=process.env.PYTHON||'python';
 const result=spawnSync(py,['scripts/verify-mk2-p59-tomb.py',original,output],{
  cwd:root,encoding:'utf8',timeout:1800000,maxBuffer:8*1024*1024,windowsHide:true});
 if(result.error||result.status!==0)
  throw Error('Independent P59 decoder failed: '+[result.error?.message,result.stderr,result.stdout].filter(Boolean).join('\n'));
 assert.match(result.stdout,/architecture 2650 samples PASS/);
 assert.match(result.stdout,/sky 823 samples PASS/);
 assert.match(result.stdout,/Original screenshot compared:\s*False/);
 const record={pass:'P61_P59_INDEPENDENT',status:'PASS',mk2Assets:5369,
  architectureIndependentSamples:2650,skyIndependentSamples:823,originalScreenshotProvided:false,
  originalSourceDecoderCompared:true,
  p59ArchiveSha256:crypto.createHash('sha256').update(bytes).digest('hex'),
  nativeCameraOrPaletteOwnershipVerified:false,independentGameDataWrittenToGit:false};
 if(report){fs.mkdirSync(path.dirname(report),{recursive:true});fs.writeFileSync(report,JSON.stringify(record,null,2)+'\n');}
 console.log(JSON.stringify(record,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
