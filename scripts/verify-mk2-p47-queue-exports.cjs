#!/usr/bin/env node
/* P47 original-fixture source-order export acceptance.
 * node scripts/verify-mk2-p47-queue-exports.cjs <original MK2> <private-output>
 * Shared export API only; does not establish browser interaction or native timing.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,allowImportingTsExtensions:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK2StageVisualAssetsP2P4}=require('../src/core/assets/mk2StageVisualIntegrationP2P4.ts');
const {buildMK2PitBridgeActorsP10}=require('../src/core/assets/mk2PitBridgeActorsP10.ts');
const {buildMK2OrderedSequenceBundlesP18}=require('../src/core/assets/mk2OrderedSequenceBundlesP18.ts');
const {resolveMK2OriginalSourceOrder}=require('../src/core/assets/mk2SourceOrderQueueP19.ts');
const {animatedPng,selectedZip}=require('../src/core/assets/export.ts');
const root=process.argv[2];if(!root)throw Error('Pass original MK2 directory and private output directory');
const entries=[];function walk(dir,prefix=''){for(const f of fs.readdirSync(dir,{withFileTypes:true})){
 const name=prefix?prefix+'/'+f.name:f.name,full=path.join(dir,f.name);
 if(f.isDirectory())walk(full,name);else if(f.isFile())entries.push({path:name,name:f.name,extension:path.extname(name).slice(1).toUpperCase(),size:fs.statSync(full).size});}}
walk(root);const source={directoryName:'Original DOS MK2',isSynthetic:false,
 async listRecursive(){return entries;},async readSlice(p,at,n){const fd=fs.openSync(path.join(root,p),'r');try{const buf=Buffer.alloc(n);const got=fs.readSync(fd,buf,0,n,at);return new Uint8Array(buf.subarray(0,got));}finally{fs.closeSync(fd);}}};
const output=path.resolve(process.argv[3]||'');assert.ok(process.argv[3],'Provide private output directory');
const sourceRoot=fs.realpathSync(root),repo=fs.realpathSync(path.join(__dirname,'..'));
const inside=(base,p)=>{const rel=path.relative(base,p);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));};
function canonical(p){let at=path.resolve(p),tail=[];while(!fs.existsSync(at)){tail.unshift(path.basename(at));at=path.dirname(at);}return path.resolve(fs.realpathSync(at),...tail);}
const privateOutput=canonical(output);assert.ok(!inside(repo,privateOutput)&&!inside(sourceRoot,privateOutput),'Output must be outside repository and original fixtures');
(async()=>{
 const stages=await buildMK2StageVisualAssetsP2P4(source),bridge=await buildMK2PitBridgeActorsP10(source);
 assert.equal(stages.status.P2.status,'VERIFIED');assert.equal(bridge.status.status,'VERIFIED');
 const sheets=buildMK2OrderedSequenceBundlesP18(stages.assets,bridge.assets);assert.equal(sheets.status.status,'VERIFIED');
 const all=[...stages.assets,...bridge.assets,...sheets.assets],lookup=new Map(all.map(a=>[a.id,a])),cases=[];
 fs.mkdirSync(privateOutput,{recursive:true});
 let sourceFrames=0;
 for(const [i,sheet]of sheets.assets.entries()){
  const q=resolveMK2OriginalSourceOrder(sheet,lookup);sourceFrames+=q.frames.length;
  const originalZip='source-'+i+'.zip';fs.writeFileSync(path.join(privateOutput,originalZip),selectedZip(q.frames));
  const edited=[q.frames.at(-1),q.frames[0],q.frames[0],...q.frames.slice(1,-1)];
  for(const [label,frames,ms]of [['original',q.frames,137],['reordered-duplicate',edited,73],['minimum',q.frames,10],['maximum',q.frames,60000]]){
   const file=i+'-'+label+'.png';fs.writeFileSync(path.join(privateOutput,file),animatedPng(frames,ms));
   cases.push({file,sourceZip:originalZip,frameIds:frames.map(a=>a.id),frameMs:ms,
    originalControl:q.originalControl,timing:q.timing,sourceListObject2:q.sourceListObject2});
  }
 }
 assert.equal(sheets.assets.length,8);assert.equal(sourceFrames,57);
 const manifest={schema:'mkdos_p47_queue_export_acceptance_v1',status:'PASS',sourceGroups:8,originalFrames:sourceFrames,cases,
  originalDataBrowserVerified:false,nativeTimingClaimed:false};
 fs.writeFileSync(path.join(privateOutput,'cases.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({status:'PASS',sourceGroups:8,originalFrames:sourceFrames,apngCases:cases.length,
  exportedFrames:cases.reduce((n,c)=>n+c.frameIds.length,0),originalDataBrowserVerified:false,nativeTimingClaimed:false},null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
