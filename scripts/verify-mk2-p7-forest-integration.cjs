#!/usr/bin/env node
/** P7 cumulative source-fixture and asset-library test.
 * Usage: node scripts/verify-mk2-p7-forest-integration.cjs /path/to/mk2 [report.json] [export.zip]
 * Source must be an untouched original MK2 installation.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,allowImportingTsExtensions:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {buildMK2ForestLayersP7}=require('../src/core/assets/mk2ForestLayersP7.ts');
const {runO197ForestLayers,o197LayerPng}=require('../src/core/experiments/o197.ts');
const {assetBytes,selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const root=process.argv[2];if(!root)throw Error('Usage: verify-mk2-p7-forest-integration.cjs <original MK2 dir> [report.json] [export.zip]');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');let checks=0;
function eq(a,b,msg){assert.deepStrictEqual(a,b,msg);checks++}
const all=new Map();function walk(dir,prefix=''){for(const d of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix?prefix+'/'+d.name:d.name;if(d.isDirectory())walk(path.join(dir,d.name),rel);else if(d.isFile())all.set(rel,new Uint8Array(fs.readFileSync(path.join(dir,d.name))));}}walk(root);
function source(entries=all){return {directoryName:'original mk2',isSynthetic:false,
 async listRecursive(){return [...entries].map(([name,b])=>({path:name,name:path.basename(name),extension:path.extname(name).slice(1).toUpperCase(),size:b.length}));},
 async readSlice(name,start,n){const b=entries.get(name);if(!b)throw Error('Unavailable '+name);return b.slice(start,start+n);}};}
function altered(name,mode){const newMap=new Map(all);const actual=[...all.keys()].find(k=>path.basename(k).toLowerCase()===name.toLowerCase());if(!actual)throw Error('missing '+name);const v=all.get(actual);
 if(mode==='remove')newMap.delete(actual);else if(mode==='mutate'){const copy=v.slice();copy[Math.floor(copy.length/2)]^=1;newMap.set(actual,copy);}else if(mode==='duplicate')newMap.set('duplicate/'+name,v);return newMap;}
(async()=>{const start=Date.now();
 const originals=await runO197ForestLayers(source());
 const p7=await buildMK2ForestLayersP7(source());
 eq(p7.status.status,'VERIFIED','P7 source authenticated');eq(p7.assets.length,10,'5 indices + 5 candidate RGB');eq(p7.packages.length,1,'research package retained');
 eq(originals.layers.map(x=>[x.width,x.height]),[[968,184],[728,160],[640,112],[616,96],[384,56]],'source dimensions');
 for(const layer of originals.layers){for(const mode of ['indices-preview','candidate-colors']){
  const a=p7.assets.find(x=>x.id===`mk2-forest-setup:${layer.variant}:${mode}`);eq(Boolean(a),true,'asset '+layer.variant+' '+mode);
  eq(a.width,layer.width,'width '+mode);eq(a.height,layer.height,'height '+mode);
  eq(sha(a.metadata.indices),layer.indicesSHA256,'source index parity');eq(sha(a.metadata.mask),layer.opacitySHA256,'source mask parity');
  eq(a.metadata.paletteRuntimeSelected,false,'color not promoted');eq(a.metadata.interLayerPlacementVerified,false,'no unverified composition');
  eq(a.rgba.length,4*layer.width*layer.height,'complete RGBA');
  const expected=o197LayerPng(layer,mode==='indices-preview'?'index':'color');
  eq(sha(assetBytes(a)),sha(expected),'PNG matches canonical O197');
 }}
 const pkg=parseAnimationStoreZip(p7.packages[0].bytes);eq(pkg.size,40,'full O197 provenance ZIP');
 const inspect=p7.assets.filter(a=>a.id.endsWith('indices-preview')).slice(0,2).concat(p7.assets.find(a=>a.id.endsWith('candidate-colors')));
 const selected=selectedZip(inspect),parsed=parseAnimationStoreZip(selected);const manifest=JSON.parse(new TextDecoder().decode(parsed.get('manifest.json').bytes));
 eq(manifest.selectionOrder.length,3,'three-asset selective ZIP');eq([...parsed.keys()].filter(n=>n.startsWith('assets/')).length,3,'three PNGs');
 eq([...parsed.keys()].filter(n=>n.startsWith('indexed/')).length,6,'3 exact index/mask pairs in ZIP');
 for(const mode of ['remove','mutate','duplicate']){
  const f=await buildMK2ForestLayersP7(source(altered('forest.gra',mode)));
  eq(f.status.status,'UNAVAILABLE','Forest '+mode+' rejected');eq(f.assets.length,0,'no pseudo-verified assets '+mode);
 }
 const changedExe=await buildMK2ForestLayersP7(source(altered('mk2.exe','mutate')));
 eq(changedExe.status.status,'UNAVAILABLE','changed exe rejected');eq(changedExe.assets.length,0,'changed exe no assets');
 const missingPortal=await buildMK2ForestLayersP7(source(altered('portal.gra','remove')));
 eq(missingPortal.status.status,'VERIFIED','independent Forest not blocked by Portal');
 // Full scanner remains the release-quality census, not merely the P7 builder.
 const scan=await scanAssets(source(),'mk2',()=>{}),ids=new Set(scan.assets.map(a=>a.id));
 eq(scan.assets.length,5026,'P6 5016 + P7 10');eq(ids.size,5026,'IDs unique');
 eq(scan.assets.filter(a=>a.id.startsWith('u8:')).length,312,'no regression WAV');
 eq(scan.assets.filter(a=>a.id.startsWith('mk2-stage-effect:')).length,43,'no regression stage effect');
 eq(scan.assets.filter(a=>a.id.startsWith('mk2-stage-setup:')).length,8,'no regression Tomb/Portal');
 eq(scan.assets.filter(a=>a.id.startsWith('mk2-floor:')).length,15,'no regression stage floors');
 eq(scan.reports.p7ForestLayers.status,'VERIFIED','P7 included in main scan');
 eq(scan.packages.some(p=>p.name==='MKDOS_O197_Forest_Five_Original_Layers_Forensic.zip'),true,'O197 package exposed');
 const report={pass:'P7',status:'PASS',checks,assetTotal:scan.assets.length,addedAssetRepresentations:10,
  originalIndependentForestSetups:5,placements:60,uniqueOriginalStreams:43,sourceVerified:true,runtimePaletteVerified:false,
  finalStageCompositionVerified:false,uiBuildValidated:false,
  cumulative:{p1:4950,p2:43,p3:8,p4:7,p5:8,p7:10,sourceSoundWAV:312},
  rejectionTests:['missing FOREST.GRA','mutated FOREST.GRA','duplicate FOREST.GRA','mutated MK2.EXE'],
  independentFromMissingPortal:true,selectedExport:{graphics:3,indexBuffers:3,opacityMasks:3,bytes:selected.length,sha256:sha(selected)},
  elapsedMs:Date.now()-start};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2));
 if(process.argv[4])fs.writeFileSync(process.argv[4],Buffer.from(selected));
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
