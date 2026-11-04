#!/usr/bin/env node
/** Fail-closed/source-independence checks for P6 stage integration, without writing original files. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,allowImportingTsExtensions:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK2StageVisualAssetsP2P4}=require('../src/core/assets/mk2StageVisualIntegrationP2P4.ts');
const dir=process.argv[2];if(!dir)throw Error('Provide original MK2 directory');
const rootFiles=new Map();function scan(d,rel='') {for(const e of fs.readdirSync(d,{withFileTypes:true})){
 const p=rel?rel+'/'+e.name:e.name;if(e.isDirectory())scan(path.join(d,e.name),p);else if(e.isFile())rootFiles.set(p.toLowerCase(),new Uint8Array(fs.readFileSync(path.join(d,e.name))));
}}scan(dir);
function source(map){return {directoryName:'MK2 negative fixture',isSynthetic:false,
 async listRecursive(){return [...map].map(([p,b])=>({path:p,name:path.basename(p),size:b.length,extension:path.extname(p).slice(1).toUpperCase()}));},
 async readSlice(p,start,len){return map.get(p.toLowerCase()).slice(start,start+len);}};}
function altered(name,mode){const copy=new Map(rootFiles);if(mode==='delete')copy.delete(name);if(mode==='corrupt'){
 const v=Uint8Array.from(copy.get(name));v[Math.floor(v.length/2)]^=0x01;copy.set(name,v);
 }if(mode==='duplicate')copy.set('duplicates/'+name,copy.get(name));return copy;}
(async()=>{let n=0;const equal=(a,b,msg)=>{assert.deepEqual(a,b,msg);n++};
 const noTower=await buildMK2StageVisualAssetsP2P4(source(altered('tower.gra','delete')));
 equal(noTower.status.P2.status,'UNAVAILABLE','missing Tower blocks all-six O177');
 equal(noTower.status.P3.status,'VERIFIED','missing Tower does not block original Tomb/Portal O122');
 equal(noTower.status.P3.count,8,'P3 all eight preserved without Tower');
 const corruptPortal=await buildMK2StageVisualAssetsP2P4(source(altered('portal.gra','corrupt')));
 equal(corruptPortal.status.P2.status,'UNAVAILABLE','tampered Portal blocks O177');
 equal(corruptPortal.status.P3.status,'UNAVAILABLE','tampered Portal blocks combined O122');
 equal(corruptPortal.assets.some(x=>x.id==='mk2-floor:tomb:rgba'),true,'Tomb floor independently retained');
 const duplicateTomb=await buildMK2StageVisualAssetsP2P4(source(altered('tomb.gra','duplicate')));
 equal(duplicateTomb.status.P2.status,'UNAVAILABLE','ambiguous Tomb blocks O177');
 equal(duplicateTomb.status.P3.status,'UNAVAILABLE','ambiguous Tomb blocks O122');
 const changedExe=await buildMK2StageVisualAssetsP2P4(source(altered('mk2.exe','corrupt')));
 equal(changedExe.assets.length,0,'mutated EXE cannot produce qualified stage exports');
 equal(changedExe.status.P2.status,'UNAVAILABLE','modified EXE rejected');
 equal(changedExe.status.P3.status,'UNAVAILABLE','modified EXE rejected all source layers');
 equal(changedExe.status.P4.status,'UNAVAILABLE','modified EXE rejected floors');
 const report={pass:'P6',status:'PASS',checks:n,negativeScenarios:['missing Tower','corrupted Portal','duplicate Tomb','corrupted EXE'],noQualifiedGameplayTimingClaims:true};
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
