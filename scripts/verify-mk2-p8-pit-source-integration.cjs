#!/usr/bin/env node
/** P8 fixture-backed independent extractor integration smoke. No npm install required.
 * node scripts/verify-mk2-p8-pit-source-integration.cjs <untouched mk2 dir> <report.json> <package.zip>
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,allowImportingTsExtensions:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {buildMK2PitLowerWallP8}=require('../src/core/assets/mk2PitLowerWallP8.ts');
const {assetBytes,selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const root=process.argv[2];if(!root)throw Error('Usage: verify-mk2-p8-pit-source-integration.cjs <original MK2 dir> [report.json] [package.zip]');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');let checks=0;
function eq(actual,expected,msg){assert.deepStrictEqual(actual,expected,msg);checks++}
const all=new Map();function walk(dir,prefix=''){for(const d of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix?prefix+'/'+d.name:d.name;if(d.isDirectory())walk(path.join(dir,d.name),rel);else if(d.isFile())all.set(rel,new Uint8Array(fs.readFileSync(path.join(dir,d.name))));}}walk(root);
function source(entries=all){return {directoryName:'original MK2',isSynthetic:false,
 async listRecursive(){return [...entries].map(([name,b])=>({path:name,name:path.basename(name),extension:path.extname(name).slice(1).toUpperCase(),size:b.length}));},
 async readSlice(name,start,n){const b=entries.get(name);if(!b)throw Error('Unavailable '+name);return b.slice(start,start+n);}};}
function altered(name,mode){const m=new Map(all),real=[...m.keys()].find(k=>path.basename(k).toLowerCase()===name.toLowerCase());if(!real)throw Error('missing '+name);const b=m.get(real);
 if(mode==='remove')m.delete(real);if(mode==='mutate'){const n=b.slice();n[Math.floor(n.length/2)]^=1;m.set(real,n);}if(mode==='duplicate')m.set('duplicate/'+name,b);return m;}
(async()=>{const start=Date.now();const p8=await buildMK2PitLowerWallP8(source());
 eq(p8.status.status,'VERIFIED','P8 source qualified');eq(p8.assets.length,7,'seven original source sprites');eq(p8.packages.length,1,'source ZIP');
 const names=p8.assets.map(a=>a.metadata.sourceSprite);eq(names,[54,55,56,57,58,59,60],'original sprite identifiers');
 const dims=[[96,96],[96,96],[80,80],[64,64],[96,96],[96,96],[96,96]];
 const z=parseAnimationStoreZip(p8.packages[0].bytes);eq(z.size,23,'seven pngs, fourteen index/mask buffers, manifest, README');
 const manifest=JSON.parse(new TextDecoder().decode(z.get('manifest.json').bytes));
 eq(manifest.originalFullResourceStreamsDecoded,61,'full stream consistency');eq(manifest.selectorStepCount,32,'32 original selector steps');
 eq(manifest.originalSelectorRuns,[[60,12],[59,6],[58,5],[57,4],[56,3],[55,2]],'original selector runs');
 eq(manifest.originalSelectorSteps.length,32,'selector order retained');
 eq(manifest.elapsedRuntimeTimingKnown,false,'do not infer wall timing');eq(manifest.finalStageSceneReconstructed,false,'not full scene');
 for(let i=0;i<7;i++){
  const a=p8.assets[i],id=54+i,m=manifest.sprites[i];
  eq([a.width,a.height],dims[i],`original dimensions ${id}`);
  eq(a.metadata.sourceSprite,id,`source name ${id}`);eq(a.metadata.runtimeDACDirectlyObserved,false,`no live DAC claim ${id}`);
  eq(a.metadata.originalSourceFPSKnown,false,`no original FPS ${id}`);
  eq(a.source.offset,m.originalPackedGraOffset,`original source offset ${id}`);
  eq(a.source.length,m.originalEncodedEndExclusive-m.originalPackedGraOffset,`source extent ${id}`);
  const ix=z.get(m.paths.indices).bytes,mask=z.get(m.paths.mask).bytes,png=z.get(m.paths.png).bytes;
  eq(hash(ix),hash(a.metadata.indices),`source index buffer ${id}`);
  eq(hash(mask),hash(a.metadata.mask),`source alpha mask ${id}`);
  eq(hash(png),hash(assetBytes(a)),`lossless PNG ${id}`);
  eq(ix.length,a.width*a.height,`index dimensions ${id}`);
  eq(mask.length,ix.length,`mask dimensions ${id}`);
  eq(mask.every(v=>v===0||v===1),true,`binary opacity ${id}`);
 }
 const selection=selectedZip([p8.assets[0],p8.assets[2],p8.assets[6]]),selected=parseAnimationStoreZip(selection);
 eq(selected.size,10,'three PNGs + six index/mask + manifest');
 const sm=JSON.parse(new TextDecoder().decode(selected.get('manifest.json').bytes));
 eq(sm.selectionOrder.length,3,'selective export preserved');
 for(const mode of ['remove','mutate','duplicate']){
  const r=await buildMK2PitLowerWallP8(source(altered('fall.gra',mode)));
  eq(r.status.status,'UNAVAILABLE',`bad FALL ${mode} rejected`);eq(r.assets.length,0,`bad FALL ${mode} yields no pseudo-assets`);
 }
 for(const mode of ['mutate','duplicate']){
  const r=await buildMK2PitLowerWallP8(source(altered('mk2.exe',mode)));
  eq(r.status.status,'UNAVAILABLE',`bad executable ${mode} rejected`);
 }
 const missingPortal=await buildMK2PitLowerWallP8(source(altered('portal.gra','remove')));
 eq(missingPortal.status.status,'VERIFIED','Pit II package independent of Portal');
 const scan=await scanAssets(source(),'mk2',()=>{});const ids=new Set(scan.assets.map(a=>a.id));
 eq(scan.assets.length,5033,'P7 5026 + seven P8 graphics');eq(ids.size,5033,'all IDs unique');
 eq(scan.assets.filter(a=>a.id.startsWith('u8:')).length,312,'312 original sound effects retained');
 eq(scan.assets.filter(a=>a.id.startsWith('mk2-stage-effect:')).length,43,'43 stage-effect frames retained');
 eq(scan.assets.filter(a=>a.id.startsWith('mk2-stage-setup:')).length,8,'8 Tomb/Portal setup layers retained');
 eq(scan.assets.filter(a=>a.id.startsWith('mk2-floor:')).length,15,'15 floor assets retained');
 eq(scan.assets.filter(a=>a.id.startsWith('mk2-forest-setup:')).length,10,'10 Forest representations retained');
 eq(scan.assets.filter(a=>a.id.startsWith('mk2-pit-fall-source:')).length,7,'seven Pit II originals in scanner');
 eq(scan.reports.p8PitLowerWall.status,'VERIFIED','P8 status reported');
 eq(scan.packages.some(x=>x.name==='MK2_P8_PIT_II_SEVEN_ORIGINAL_LOWER_WALL_SOURCES.zip'),true,'full source archive in library');
 // Cross-check every source indexed buffer with the already independent O70 broad
 // graphics census: same canonical physical starting offset, index and opacity.
 const broad=scan.assets.filter(a=>a.source.path.toLowerCase().endsWith('fall.gra')&&a.id.includes('.indices.bin'));
 for(const a of p8.assets){
  const match=broad.find(x=>x.source.offset===a.source.offset&&x.width===a.width&&x.height===a.height);
  eq(Boolean(match),true,`O70 indexed census includes sprite ${a.metadata.sourceSprite}`);
  if(match){eq(hash(match.metadata.indices),hash(a.metadata.indices),`O70 exact indexed bytes ${a.metadata.sourceSprite}`);
   eq(hash(match.metadata.mask),hash(a.metadata.mask),`O70 exact mask ${a.metadata.sourceSprite}`);}
 }
 const report={pass:'P8',status:'PASS',checks,assetTotal:scan.assets.length,
  newAssets:7,originalFallStreamsValidated:61,sourcePaletteColors:81,sourceSelectorSteps:32,
  originalWallGraphics:6,crackOverlayGraphics:1,sourcePaletteRuntimeDACVerified:false,
  runtimeTimelineOrFullSceneVerified:false,browserBuildValidated:false,
  regressions:{soundEffects:312,stageEffectFrames:43,tombPortalSetupLayers:8,stageFloorAssets:15,forestPreviewRepresentations:10},
  negativePaths:['missing FALL','mutated FALL','duplicate FALL','mutated MK2.EXE','duplicate MK2.EXE'],
  independentFromMissingPortal:true,selectedExport:{assets:3,bytes:selection.length,sha256:hash(selection)},
  sourceArchive:{bytes:p8.packages[0].bytes.length,sha256:hash(p8.packages[0].bytes)},elapsedMs:Date.now()-start};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');
 if(process.argv[4])fs.writeFileSync(process.argv[4],Buffer.from(p8.packages[0].bytes));
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
