#!/usr/bin/env node
/** P10 original MK2 Pit II bridge actor integration smoke. npm install not required.
 * node scripts/verify-mk2-p10-pit-bridge.cjs <canonical MK2 dir> [report.json] [package.zip]
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,allowImportingTsExtensions:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {buildMK2PitBridgeActorsP10}=require('../src/core/assets/mk2PitBridgeActorsP10.ts');
const {scanAssets}=require('../src/core/assets/collection.ts');
const {assetBytes,selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const root=process.argv[2];if(!root)throw Error('Usage: verify-mk2-p10-pit-bridge.cjs <MK2 dir> [report.json] [zip]');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');let checks=0;
function eq(actual,expected,label){assert.deepStrictEqual(actual,expected,label);checks++;}
const files=new Map();(function walk(dir,prefix=''){for(const x of fs.readdirSync(dir,{withFileTypes:true})){
 const rel=prefix?prefix+'/'+x.name:x.name,p=path.join(dir,x.name);
 if(x.isDirectory())walk(p,rel);else if(x.isFile())files.set(rel,new Uint8Array(fs.readFileSync(p)));
}})(root);
function source(m=files){return {directoryName:'canonical MK2',isSynthetic:false,
 async listRecursive(){return [...m].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));},
 async readSlice(p,start,count){const b=m.get(p);if(!b)throw Error('file missing '+p);return b.slice(start,start+count);}};}
function modified(basename,mode){const m=new Map(files);const name=[...files.keys()].find(p=>path.basename(p).toLowerCase()===basename);
 assert(name);const b=m.get(name);
 if(mode==='remove')m.delete(name);
 else if(mode==='mutate'){const bytes=b.slice();bytes[Math.floor(bytes.length/2)]^=1;m.set(name,bytes);}
 else if(mode==='duplicate')m.set('duplicate/'+basename,b);
 return m;
}
(async()=>{
 const original=await buildMK2PitBridgeActorsP10(source());
 eq(original.status.status,'VERIFIED','canonical fixture accepted');
 eq(original.assets.length,14,'all fourteen original bridge frames');
 eq(original.status.actorGroups,2,'both original loop groups');
 eq(original.packages.length,1,'one original source package');
 const zipped=parseAnimationStoreZip(original.packages[0].bytes),manifest=JSON.parse(new TextDecoder().decode(zipped.get('manifest.json').bytes));
 eq(zipped.size,44,'42 source payloads plus manifest and README');
 eq(manifest.originalFrameLists.length,2,'two original lists');
 eq(manifest.frames.length,14,'14 source frame entries');
 eq(manifest.nativeFrameDurationsKnown,false,'no invented ms durations');
 eq(manifest.liveActivationKnown,false,'no invented activation');
 eq(manifest.finalStageCompositionKnown,false,'no invented full scene');
 eq(manifest.sourceCallbackLiteralSchedulerYieldCount,6,'original literal 6 yields, not milliseconds');
 for(let g=0;g<2;g++){
  const list=manifest.originalFrameLists[g];
  eq(list.orderedFrameOrdinals,Array.from({length:7},(_,i)=>g*7+i),`loop ${g} source order`);
  eq(list.loopBackToStart,true,`loop ${g} back-pointer`);
  eq(list.terminatorToken,1,`loop ${g} terminator`);
 }
 for(let i=0;i<14;i++){
  const a=original.assets[i],m=manifest.frames[i],dims=[16,i<7?24:32];
  eq([a.width,a.height],dims,`native dimensions ${i}`);
  eq(a.metadata.sourceFrameOrdinal,i,`source ordinal ${i}`);
  eq(a.metadata.sourceLoopEstablished,true,`source list verified ${i}`);
  eq(a.metadata.nativeFrameDurationVerified,false,`no timing claim ${i}`);
  eq(a.metadata.finalStagePlacementVerified,false,`no scene pose claim ${i}`);
  eq(a.metadata.indices.length,dims[0]*dims[1],`indices extent ${i}`);
  eq(a.metadata.mask.length,dims[0]*dims[1],`mask extent ${i}`);
  eq(a.metadata.mask.every(x=>x===0||x===1),true,`mask binary ${i}`);
  eq(sha(a.metadata.indices),sha(zipped.get(m.paths.indices).bytes),`indexed data ${i}`);
  eq(sha(a.metadata.mask),sha(zipped.get(m.paths.mask).bytes),`mask data ${i}`);
  eq(sha(assetBytes(a)),sha(zipped.get(m.paths.png).bytes),`PNG bytes ${i}`);
  eq(a.source.offset,m.originalGraOffset,`original GRA source offset ${i}`);
  eq(a.source.length,m.originalEncodedEndExclusive-m.originalGraOffset,`original GRA length ${i}`);
 }
 for(const name of ['mk2.exe','pit.gra'])for(const mode of ['remove','mutate','duplicate']){
  const bad=await buildMK2PitBridgeActorsP10(source(modified(name,mode)));
  eq(bad.status.status,'UNAVAILABLE',`reject ${name} ${mode}`);
  eq(bad.assets.length,0,`no untrusted assets ${name} ${mode}`);
 }
 eq((await buildMK2PitBridgeActorsP10(source(modified('portal.gra','remove')))).status.status,'VERIFIED','Portal unrelated');
 const selected=selectedZip([original.assets[0],original.assets[7]]);
 eq(parseAnimationStoreZip(selected).size,7,'two PNG + two index/mask + manifest');
 const whole=await scanAssets(source(),'mk2',()=>{});
 eq(whole.assets.length,5053,'P9 5039 + P10 14');
 eq(new Set(whole.assets.map(a=>a.id)).size,5053,'all IDs unique');
 for(const [id,count]of [['u8:',312],['mk2-stage-effect:',43],['mk2-stage-setup:',8],['mk2-floor:',15],
 ['mk2-forest-setup:',10],['mk2-pit-fall-source:',7],['mk2-pit-upper-setup:',6],['mk2-pit-bridge:',14]]){
  eq(whole.assets.filter(x=>x.id.startsWith(id)).length,count,`${id} preserved`);
 }
 eq(whole.reports.p10PitBridgeActors.status,'VERIFIED','report surfaced');
 eq(whole.packages.some(x=>x.name==='MK2_P10_PIT_II_ORIGINAL_BRIDGE_ACTOR_FRAMES.zip'),true,'source package surfaced');
 const report={pass:'P10',status:'PASS',checks,assets:whole.assets.length,newAssets:14,
 sourceSprites:14,sourceLoopGroups:2,originalSchedulerYieldLiteral:6,nativeFrameDurationVerified:false,
 completeStageCompositionVerified:false,browserBuildValidated:false,
 sourcePackage:{name:original.packages[0].name,bytes:original.packages[0].bytes.length,sha256:sha(original.packages[0].bytes)},
 selectedExport:{assets:2,bytes:selected.length,sha256:sha(selected)},
 negativeCases:['missing/corrupt/duplicate MK2.EXE','missing/corrupt/duplicate PIT.GRA','missing Portal independent']};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');
 if(process.argv[4])fs.writeFileSync(process.argv[4],original.packages[0].bytes);
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
