#!/usr/bin/env node
/* P27 full current-source cumulative original-fixture regression. No UI/backend network required.
 * node scripts/verify-mk2-p27-cumulative.cjs <canonical MK2 folder> [report.json]
 * Only source-verified assets/metadata are counted; not final composite scenes.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,allowImportingTsExtensions:true}}).outputText,file);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const {selectedZip}=require('../src/core/assets/export.ts');
const {parseAnimationStoreZip}=require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const root=process.argv[2];if(!root)throw Error('Usage: verify-mk2-p27-cumulative.cjs <MK2 folder> [report.json]');
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
 eq(report.assets.length,5236,'P16-P19 cumulative original asset representations');
 eq(new Set(report.assets.map(a=>a.id)).size,5236,'all unique asset IDs');
 const groups={
 'u8:':312,'mk2-stage-effect:':43,'mk2-stage-setup:':8,'mk2-floor:':15,
 'mk2-forest-setup:':10,'mk2-pit-fall-source:':7,'mk2-pit-upper-setup:':6,'mk2-pit-bridge:':14,'mk2-intro-lzw:':31,'mk2-mountain-source:':15,'mk2-viewport-floor:':7,'mk2-witnessed-floor:':2,'mk2-images-setup:':2,'mk2-source-animation-sheet:':8,'mk2-cave-source:':49,'mk2-armory-source:':18,'mk2-battle-source:':20,'mk2-arena-source:':15,'mk2-tomb-source:':16};
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

 eq(report.reports.p23ArmorySource.status,'VERIFIED','P23 source status');
 eq(report.reports.p23ArmorySource.sourceImagePrefix,{start:0,endExclusive:116608,encodedBytes:116608},'P23 original source prefix');
 const armory=report.assets.filter(a=>a.id.startsWith('mk2-armory-source:'));
 eq(armory.length,18,'18 added original Armory images');
 const legacyArmory=report.assets.filter(a=>a.source.path.toLowerCase().endsWith('armory.gra')&&!a.id.startsWith('mk2-armory-source:'));
 eq(legacyArmory.length,3,'three prior Armory floor representations retained');
 eq(legacyArmory.every(a=>a.source.offset===126336),true,'prior floor source extent retained');
 const originalArmory=[...map].find(([name])=>path.basename(name).toLowerCase()==='armory.gra')[1];
 const floor=report.assets.find(a=>a.id==='mk2-floor:armory:indices');
 eq(sha(floor.bytes),sha(originalArmory.subarray(126336)), 'original uncropped Armory floor bytes unchanged');
 const armoryPackage=report.packages.find(p=>p.name==='MK2_P23_ARMORY_18_ORIGINAL_INDEXED_IMAGES.zip');
 eq(Boolean(armoryPackage),true,'P23 source evidence package');
 eq(sha(armoryPackage.bytes),'7e5870cdeebf6c17c36a50024592115a1e3172b4a299f379e234ace86ed410ac','independently read-back Armory package hash');
 for(const a of armory){eq(a.metadata.runtimePaletteKnown,false,'unknown Armory palette');eq(a.metadata.sourceTableOrderIsAnimation,false,'Armory table order is not animation');}

 eq(report.reports.p24BattleSource.status,'VERIFIED','P24 source status');
 eq(report.reports.p24BattleSource.sourceImagePrefix,{start:0,endExclusive:59436,encodedBytes:59436},'P24 exact original prefix');
 eq(report.reports.p24BattleSource.sourceDescriptorWitnesses,40,'40 source descriptor witnesses');
 eq(report.reports.p24BattleSource.duplicateWitnessesPreserved,20,'20 duplicate witnesses retained');
 const battle=report.assets.filter(a=>a.id.startsWith('mk2-battle-source:'));
 eq(battle.length,20,'20 unique Battle image assets');
 eq(new Set(battle.map(a=>a.source.offset)).size,20,'deduplicated source intervals');
 const oldBattle=report.assets.filter(a=>a.source.path.toLowerCase().endsWith('battle.gra')&&!a.id.startsWith('mk2-battle-source:'));
 eq(oldBattle.length,3,'prior Battle floor representations retained');
 eq(oldBattle.every(a=>a.source.offset===59436),true,'prior Battle source extent retained');
 const originalBattle=[...map].find(([name])=>path.basename(name).toLowerCase()==='battle.gra')[1];
 eq(sha(report.assets.find(a=>a.id==='mk2-floor:battle:indices').bytes),sha(originalBattle.subarray(59436)),'original uncropped Battle floor bytes unchanged');
 const battlePackage=report.packages.find(p=>p.name==='MK2_P24_BATTLE_20_ORIGINAL_INDEXED_IMAGES.zip');
 eq(Boolean(battlePackage),true,'P24 source evidence package');
 eq(sha(battlePackage.bytes),'3faed3ece5808182446d64092184300da667719cc95948c3f8a2db1f2c06f5eb','independently verified Battle package');
 for(const [i,a]of battle.entries()){
  eq(a.metadata.sourceDescriptorOrdinals,[i,i+20],'original paired descriptor ordinals');
  eq(a.metadata.sourceDescriptorPhysicals,[0xa0c54+0x19380+8*i,0xa0c54+0x19380+8*(i+20)],'both descriptor physical addresses retained');
  eq(a.metadata.runtimePaletteKnown,false,'Battle palette remains unknown');
  eq(a.metadata.sourceTableOrderIsAnimation,false,'Battle order not promoted to animation');
 }

 eq(report.reports.p25ArenaSource.status,'VERIFIED','P25 source status');
 eq(report.reports.p25ArenaSource.sourceImagePrefix,{start:0,endExclusive:36172,encodedBytes:36172},'P25 original source prefix');
 const arena=report.assets.filter(a=>a.id.startsWith('mk2-arena-source:'));
 eq(arena.length,15,'15 added original Arena images');
 const oldArena=report.assets.filter(a=>a.source.path.toLowerCase().endsWith('arena.gra')&&!a.id.startsWith('mk2-arena-source:'));
 eq(oldArena.length,3,'three prior Arena floor representations retained');
 eq(oldArena.every(a=>a.source.offset===90488),true,'prior Arena floor extent retained');
 const originalArena=[...map].find(([name])=>path.basename(name).toLowerCase()==='arena.gra')[1];
 eq(sha(report.assets.find(a=>a.id==='mk2-floor:arena:indices').bytes),sha(originalArena.subarray(90488)),'original uncropped Arena floor bytes unchanged');
 const arenaPackage=report.packages.find(p=>p.name==='MK2_P25_ARENA_15_ORIGINAL_INDEXED_IMAGES.zip');
 eq(Boolean(arenaPackage),true,'P25 source evidence package');
 eq(sha(arenaPackage.bytes),'1cad7584431335343cf95a0c6cabda74d88a2a50b6f3c76a669ba03ed3f60dc5','independently verified Arena package hash');
 for(const a of arena){eq(a.metadata.runtimePaletteKnown,false,'Arena native palette unassigned');eq(a.metadata.sourceTableOrderIsAnimation,false,'Arena table order is not animation');}

 const tombReference=require('./fixtures/mk2-p27-tomb-independent-parity.json');
 const priorTomb=require('./fixtures/mk2-p27-tomb-registry-before.json');
 eq(report.reports.p27TombSource.status,'VERIFIED','P27 source status');
 eq(report.reports.p27TombSource.sourceImagePrefix,{start:0,endExclusive:54328,encodedBytes:54328},'P27 exact component prefix');
 eq(report.reports.p27TombSource.newlyDiscoveredSourceImages,0,'no source discovery inflation');
 const tomb=report.assets.filter(a=>a.id.startsWith('mk2-tomb-source:'));
 eq(tomb.length,16,'16 newly accessible full source components');
 const lookupAll=new Map(report.assets.map(a=>[a.id,a]));
 for(const observed of priorTomb.tombRepresentations){
  const a=lookupAll.get(observed.id);eq(Boolean(a),true,'prior TOMB representation retained');
  eq([a.width??null,a.height??null],observed.dimensions,'prior dimensions retained');
  eq([a.source.offset,a.source.length,a.source.sha256??null],[observed.sourceOffset,observed.sourceLength,observed.sourceSha256],'prior source extent retained');
  eq(a.metadata.indices?sha(a.metadata.indices):null,observed.indicesSha256,'prior indexed plane retained');
  eq(a.metadata.mask?sha(a.metadata.mask):null,observed.maskSha256,'prior opacity plane retained');
 }
 for(const canvas of tombReference.sourceSetupCanvases){
  const layer=lookupAll.get(canvas.assetId);eq(Boolean(layer),true,'existing setup linkage');
  eq(sha(layer.metadata.indices),canvas.indicesSha256,'independent original setup canvas');
  eq(sha(layer.metadata.mask),canvas.maskSha256,'independent original setup opacity');
 }
 for(const [i,a]of tomb.entries()){
  eq(a.metadata.sourceSetupUses,tombReference.images[i].sourceSetupUses,'original source-control uses retained');
  eq(a.metadata.componentPreviouslyUsedInMosaics,true,'preexisting component use recorded');
  eq(a.metadata.newlyDiscoveredSourceImage,false,'standalone access, not new discovery');
 }
 const originalTomb=[...map].find(([name])=>path.basename(name).toLowerCase()==='tomb.gra')[1];
 eq(sha(lookupAll.get('mk2-floor:tomb:indices').bytes),sha(originalTomb.subarray(63776)),'original Tomb floor retained');
 const pkg=report.packages.find(p=>p.name==='MK2_P27_TOMB_16_ORIGINAL_SETUP_COMPONENTS.zip');
 eq(Boolean(pkg),true,'P27 component archive present');eq(sha(pkg.bytes),'a408f7e4000e0bec4d2db717925ac9e4dfd31d05591a641eb02d30e7521faa90','verified component archive');

 const result={pass:'P27',status:'PASS',checks,assets:report.assets.length,uniqueAssets:5236,
  originalMK2FixtureOnly:true,fullCurrentSourceRegression:true,p22AddedImages:49,p23AddedImages:18,p24AddedImages:20,p25AddedImages:15,p27StandaloneComponentRepresentations:16,p27NewlyDiscoveredSourceImages:0,p24DescriptorWitnesses:40,sourceOrderQueueFrames:queuedFrames,groups,originalArchiveParity:packages,selectedExportAssets:8,
  browserUIVerified:false,fullSceneAssemblyVerified:false,nativeAnimationTimingVerified:false,
  copyrightGameFilesIncludedInRepository:false};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
})().catch(err=>{console.error(err.stack||err);process.exitCode=1});
