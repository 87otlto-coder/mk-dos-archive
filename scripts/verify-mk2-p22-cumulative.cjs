#!/usr/bin/env node
/* P22 full current-source cumulative original-fixture regression. No UI/backend network required.
 * node scripts/verify-mk2-p22-cumulative.cjs <canonical MK2 folder> [report.json]
 * Only source-verified assets/metadata are counted; not final composite scenes.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,allowImportingTsExtensions:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const root=process.argv[2];if(!root)throw Error('Usage: verify-mk2-p22-cumulative.cjs <MK2 folder> [report.json]');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');let checks=0;
function eq(a,b,msg){assert.deepStrictEqual(a,b,msg);checks++}
const map=new Map();function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
 const name=prefix?prefix+'/'+e.name:e.name, full=path.join(dir,e.name);
 if(e.isDirectory())walk(full,name);else if(e.isFile())map.set(name,new Uint8Array(fs.readFileSync(full)));
}}walk(root);
const fixture={directoryName:'P20 authenticated MK2',isSynthetic:false,
 async listRecursive(){return [...map].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));},
 async readSlice(p,start,count){const b=map.get(p);if(!b)throw Error('Missing original source '+p);return b.slice(start,start+count);}};
(async()=>{
 const report=await scanAssets(fixture,'mk2',()=>{});
 eq(report.assets.length,5167,'P16-P19 cumulative original asset representations');
 eq(new Set(report.assets.map(a=>a.id)).size,5167,'all unique asset IDs');
 const groups={
 'u8:':312,'mk2-stage-effect:':43,'mk2-stage-setup:':8,'mk2-floor:':15,
 'mk2-forest-setup:':10,'mk2-pit-fall-source:':7,'mk2-pit-upper-setup:':6,'mk2-pit-bridge:':14,'mk2-intro-lzw:':31,'mk2-mountain-source:':15,'mk2-viewport-floor:':7,'mk2-witnessed-floor:':2,'mk2-images-setup:':2,'mk2-source-animation-sheet:':8,'mk2-cave-source:':49};
 for(const [prefix,count]of Object.entries(groups)) eq(report.assets.filter(x=>x.id.startsWith(prefix)).length,count,'group '+prefix);
 for(const [field] of [['p7ForestLayers'],['p8PitLowerWall'],['p9PitUpper'],['p10PitBridgeActors'],['p12IntroLzw'],['p13MountainSource'],['p14NativeViewports'],['p15ObservedFloors']]) {
  const r=report.reports[field];eq(Boolean(r),true,'report '+field);
  eq(r.status,'VERIFIED','source status '+field);
 }
 const packages={
 'MK2_P8_PIT_II_SEVEN_ORIGINAL_LOWER_WALL_SOURCES.zip':'7832bae102ab952024f8fa2b48f86379d5a519f2302491757027b4568654bdd5',
 'MK2_P9_PIT_II_SIX_ORIGINAL_UPPER_SETUP_LAYERS.zip':'25abe08f1471a46c9e205bed3693559499afd7b0893bd277c5c51130769f652d',
 'MK2_P10_PIT_II_ORIGINAL_BRIDGE_ACTOR_FRAMES.zip':'6aedb63e4b974468c64a2a80afc4270be0815d716fa265cee21278b612ddf79c'};
 for(const [name,hash] of Object.entries(packages)){
  const pkg=report.packages.find(p=>p.name===name);eq(Boolean(pkg),true,'original package present '+name);
  eq(sha(pkg.bytes),hash,'byte-for-byte P8-P10 package parity '+name);
 }
 const forest=report.packages.find(p=>p.name==='MKDOS_O197_Forest_Five_Original_Layers_Forensic.zip');
 eq(Boolean(forest),true,'Forest O197 provenance bundle retained');
 const ids=['mk2-forest-setup:','mk2-pit-fall-source:','mk2-pit-upper-setup:','mk2-pit-bridge:','mk2-intro-lzw:','mk2-mountain-source:','mk2-viewport-floor:','mk2-witnessed-floor:'];
 const selected=ids.map(prefix=>report.assets.find(a=>a.id.startsWith(prefix)));
 eq(selected.every(Boolean),true,'select P7-P10 stage assets, P12 intro, P13 Mountain and P14 viewports');
 const archive=parseAnimationStoreZip(selectedZip(selected));
 eq([...archive.keys()].filter(k=>k.startsWith('assets/')).length,8,'eight mixed stage/intro/Mountain/viewport PNG assets exported');
 eq([...archive.keys()].filter(k=>k.startsWith('indexed/')).length,20,'indexed/opacity and color-known masks exported, including P14');
 for(const a of selected){eq(a.metadata.indices instanceof Uint8Array,true,'source pixels '+a.id);
  eq(a.metadata.mask instanceof Uint8Array,true,'source opacity '+a.id);}
 for(const p of ['P7','P8','P9','P10']){
  const group=ids[Number(p.slice(1))-7];eq(report.assets.some(a=>a.id.startsWith(group)),true,'pass '+p+' retained');
 }
 eq(report.assets.filter(a=>a.id.startsWith('mk2-intro-lzw:')).length,31,'31 integrated O110B/O110E intro frames');
 eq(report.reports.p12IntroLzw.count,31,'qualified source LZW intro frame count');
 eq(report.assets.filter(a=>a.id.startsWith('mk2-mountain-source:')).length,15,'15 qualified selected/adjacent MOUNTAIN graphics');
 eq(report.reports.p13MountainSource.selectedCount,14,'14 O96S consumer-selected originals');
 eq(report.reports.p13MountainSource.adjacentUnselectedCount,1,'one O96T adjacent but unselected original');
 const mountainEvidence=report.packages.find(p=>p.name==='MK2_P13_MOUNTAIN_FIFTEEN_ORIGINAL_INDEXED_GRAPHICS.zip');
 eq(Boolean(mountainEvidence),true,'Mountain source ZIP present');
 eq(sha(mountainEvidence.bytes),'e7eabb5d6444d249b7b08a1197c7cc7767a8e70df668f661d5d0eff762d67c86','P13 15-image original index evidence ZIP hash unchanged');
 eq(report.assets.filter(a=>a.id.startsWith('mk2-viewport-floor:')).length,7,'seven O110C native source-floor projections');
 eq(report.reports.p14NativeViewports.count,7,'seven qualified source projected floors');
 const viewportEvidence=report.packages.find(p=>p.name==='MK2_P14_SEVEN_NATIVE_PACKED_FLOOR_VIEWPORTS.zip');
 eq(Boolean(viewportEvidence),true,'O110C P14 normalized source evidence ZIP present');
 eq(sha(viewportEvidence.bytes),'e7b588f7f84807b3dab054e0b8ce99336570f29256056617b6c38bafad2b36ca','P14 source floor projection archive parity');
 eq(report.assets.filter(a=>a.id.startsWith('mk2-witnessed-floor:')).length,2,'two observed RGB original Tomb/Portal floors');
 eq(report.reports.p15ObservedFloors.count,2,'two independently qualified screenshot-RGB source floors');
 const witnessedEvidence=report.packages.find(p=>p.name==='MK2_P15_TWO_SCREENSHOT_WITNESSED_STAGE_FLOORS.zip');
 eq(Boolean(witnessedEvidence),true,'P15 screenshot palette floor ZIP present');
 eq(sha(witnessedEvidence.bytes),'1ded7e25adc7043e908cf2268fc208321fed6afa8779526dda1e17739455454b','P15 screenshot RGB floor ZIP identity');
 for(const stage of ['tomb','portal']){
  const a=report.assets.find(a=>a.id.startsWith(`mk2-witnessed-floor:${stage}:`));
  eq(Boolean(a),true,'P15 witnessed source '+stage);
  eq(a.metadata.nativePaletteKnown,false,'native palette unknown '+stage);
  eq(a.metadata.paletteKnownMask.every(x=>x===0),true,'native palette unknown mask '+stage);
  eq(a.metadata.fullStageScene,false,'no complete stage claims '+stage);
 }

 // P17-P19 must work in the complete collection, not only isolated adapters.
 eq(report.reports.p17ImagesSetups.status,'VERIFIED','P17 source status');
 eq(report.reports.p17ImagesSetups.count,2,'P17 two source mosaics');
 eq(report.reports.p17ImagesSetups.sourceChain,{start:351472,endExclusive:460192,streams:20},'P17 exact source partition');
 eq(report.reports.p18OrderedSequences.status,'VERIFIED','P18 source groups');
 eq(report.reports.p18OrderedSequences.count,8,'P18 eight groups');
 eq(report.reports.p18OrderedSequences.sourceFrames,57,'P18 original frame count');
 const p17=report.assets.filter(a=>a.id.startsWith('mk2-images-setup:'));
 for(const a of p17){
  eq([a.width,a.height],[320,200],'P17 original geometry');
  eq(a.metadata.stageOwnershipKnown,false,'unassigned stage ownership');
  eq(a.metadata.runtimePaletteKnown,false,'unknown runtime palette');
  eq(a.metadata.paletteKnownMask instanceof Uint8Array,true,'explicit palette-known plane');
  eq(a.metadata.paletteKnownMask.every(v=>v===0),true,'no invented palette ownership');
 }
 const mosaics=report.packages.find(p=>p.name==='MK2_P17_IMAGES_TWO_UNASSIGNED_INDEXED_SETUP_LAYERS.zip');
 eq(Boolean(mosaics),true,'P17 evidence bundle');
 const mosaicZip=parseAnimationStoreZip(mosaics.bytes);
 eq([...mosaicZip.keys()].filter(k=>k.startsWith('assets/')).length,2,'P17 two PNGs');
 eq([...mosaicZip.keys()].filter(k=>k.startsWith('indexed/')).length,6,'P17 all three planes');
 const lookup=new Map(report.assets.map(a=>[a.id,a]));
 const {resolveMK2OriginalSourceOrder}=require('../src/core/assets/mk2SourceOrderQueueP19.ts');
 const sheets=report.assets.filter(a=>a.id.startsWith('mk2-source-animation-sheet:'));
 let queuedFrames=0;
 for(const sheet of sheets){
  const queue=resolveMK2OriginalSourceOrder(sheet,lookup);
  eq(queue.frames.map(a=>a.id),sheet.metadata.sourceOrderAssetIds,'full-collection original order');
  eq(queue.timing,'USER_SELECTED_PRESENTATION_ONLY','native timing remains unknown');
  eq(queue.originalControl,sheet.metadata.sourceControl,'original source control');
  const exported=parseAnimationStoreZip(selectedZip(queue.frames));
  eq([...exported.keys()].filter(k=>k.startsWith('assets/')).length,queue.frames.length,'queue PNG exports');
  for(const [ordinal,frame] of queue.frames.entries()){
   eq(frame,lookup.get(frame.id),'queue retains collection asset');
   for(const plane of ['indices','mask']){
    eq(frame.metadata[plane] instanceof Uint8Array,true,'queue retains original '+plane);
    const key=`indexed/${String(ordinal).padStart(5,'0')}_${plane}.bin`;
    eq(Boolean(exported.get(key)),true,'queue sidecar exists '+key);
    eq(Buffer.from(exported.get(key).bytes),Buffer.from(frame.metadata[plane]),'full-collection queue export byte parity '+key);
   }
  }
  queuedFrames+=queue.frames.length;
 }
 eq(queuedFrames,57,'all 57 original frames resolve in complete collection');

 eq(report.reports.p22CaveSource.status,'VERIFIED','P22 source status');
 eq(report.reports.p22CaveSource.sourceSuffix,{start:120,endExclusive:57312,encodedBytes:57192},'P22 exact suffix');
 const cave=report.assets.filter(a=>a.id.startsWith('mk2-cave-source:'));
 eq(cave.length,49,'49 newly integrated Cave images');
 const cavePackage=report.packages.find(p=>p.name==='MK2_P22_CAVE_49_ORIGINAL_INDEXED_IMAGES.zip');
 eq(Boolean(cavePackage),true,'P22 evidence package');
 eq(sha(cavePackage.bytes),'e7c407cd1727b003387eb95c91a7e5a131c3eed0c5967fb1d7761ee3f81e9745','independently verified Cave package identity');
 for(const a of cave){
  eq(a.source.path.toLowerCase().endsWith('cave.gra'),true,'original Cave source');
  eq(a.metadata.stageOwnershipKnown,false,'Cave ownership unassigned');
  eq(a.metadata.runtimePaletteKnown,false,'Cave native palette unassigned');
 }

 const result={pass:'P22',status:'PASS',checks,assets:report.assets.length,uniqueAssets:5167,
  originalMK2FixtureOnly:true,fullCurrentSourceRegression:true,p22AddedImages:49,sourceOrderQueueFrames:queuedFrames,groups,originalArchiveParity:packages,selectedExportAssets:8,
  browserUIVerified:false,fullSceneAssemblyVerified:false,nativeAnimationTimingVerified:false,
  copyrightGameFilesIncludedInRepository:false};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
})().catch(err=>{console.error(err.stack||err);process.exitCode=1});
