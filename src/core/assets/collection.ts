import { DirectorySource } from '../filesystem/DirectorySource';
import { Asset, AssetCollection, Game, safeName } from './model';
import { runMK1Pipeline } from './mk1Pipeline';
import { scanMK1ReadOnlyFallback } from './mk1ReadOnlyFallback';
import { runMK2Pipeline } from './mk2Pipeline';
import { indexedRgba, scanMK3 } from './mk3Collection';
import { parseAnimationStoreZip, decodeAnimationBundlePng } from '../../games/mk1/research/browserAnimationExportBundleValidation';
import { executeVerifiedIdentityBundleO90 } from '../../games/mk2/research/verifiedIdentityBundleO90';
import { decodeMK2Music,writeMidi } from './mk2Music';
import { hash } from './model';
import { buildMK2P5SourceFloorAssets, P5_MK2_SOURCE_FLOOR_LIMITATION } from './mk2P5SourceFloors';
import { buildMK2StageVisualAssetsP2P4, MK2_STAGE_P2P4_LIMITATIONS } from './mk2StageVisualIntegrationP2P4';
import { buildMK2ForestLayersP7, MK2_P7_FOREST_LIMITATION } from './mk2ForestLayersP7';
import { buildMK2PitLowerWallP8, P8_PIT_LOWER_WALL_LIMITATION } from './mk2PitLowerWallP8';
import { buildMK2PitUpperLayersP9, MK2_P9_PIT_UPPER_LIMITATION } from './mk2PitUpperLayersP9';
import { buildMK2PitBridgeActorsP10, MK2_P10_PIT_BRIDGE_LIMITATION } from './mk2PitBridgeActorsP10';
import { buildMK2IntroLzwP12, MK2_P12_INTRO_LIMITATION } from './mk2IntroLzwP12';
import { buildMK2MountainSourceP13, MK2_P13_MOUNTAIN_LIMITATION } from './mk2MountainSourceP13';
import { buildMK2NativeViewportFloorsP14, MK2_P14_VIEWPORT_LIMITATION } from './mk2NativeFloorViewportsP14';
import { buildMK2ObservedFloorsP15, MK2_P15_OBSERVED_FLOOR_LIMITATION } from './mk2ObservedFloorColorsP15';
import { buildMK2ImagesSetupsP17, MK2_P17_IMAGES_SETUP_LIMITATION } from './mk2ImagesSetupP17';
import { buildMK2OrderedSequenceBundlesP18, MK2_P18_SOURCE_SEQUENCE_LIMITATION } from './mk2OrderedSequenceBundlesP18';
import { buildMK2CaveSourceP22, MK2_P22_CAVE_LIMITATION } from './mk2CaveSourceP22';
import { buildMK2ArmorySourceP23, MK2_P23_ARMORY_LIMITATION } from './mk2ArmorySourceP23';
import { buildMK2BattleSourceP24, MK2_P24_BATTLE_LIMITATION } from './mk2BattleSourceP24';
import { buildMK2ArenaSourceP25, MK2_P25_ARENA_LIMITATION } from './mk2ArenaSourceP25';
import { buildMK2ArenaTailSourceP35, MK2_P35_ARENA_TAIL_LIMITATION } from './mk2ArenaTailSourceP35';
import { buildMK2ArmoryTailSourceP34, MK2_P34_ARMORY_TAIL_LIMITATION } from './mk2ArmoryTailSourceP34';
import { buildMK2PitSourceP33, MK2_P33_PIT_LIMITATION } from './mk2PitSourceP33';
import { buildMK2ForestTailSourceP32, MK2_P32_FOREST_TAIL_LIMITATION } from './mk2ForestTailSourceP32';
import { buildMK2ForestSourceP30, MK2_P30_FOREST_LIMITATION } from './mk2ForestSourceP30';
import { buildMK2TowerSourceP29, MK2_P29_TOWER_LIMITATION } from './mk2TowerSourceP29';
import { buildMK2PortalSourceP28, MK2_P28_PORTAL_LIMITATION } from './mk2PortalSourceP28';
import { buildMK2TombSourceP27, MK2_P27_TOMB_LIMITATION } from './mk2TombSourceP27';

export async function scanAssets(source:DirectorySource,game:Game,progress:(s:string)=>void,signal?:AbortSignal):Promise<AssetCollection> {
  if(game==='mk3')return scanMK3(source,progress,signal);
  const assets:Asset[]=[],packages:AssetCollection['packages']=[];
  const addPng=(id:string,bytes:Uint8Array,group:string,kind:Asset['kind'],confidence:string,meta:Record<string,unknown>={})=>{
    const decoded=decodeAnimationBundlePng(bytes);
    assets.push({id,name:id.split('/').at(-1)!,group,kind,format:'PNG',confidence,source:{path:String(meta.resourcePath??meta.resourceName??id),offset:Number(meta.graOffset??0),length:0},metadata:{...meta,sourceExtent:'See evidence package for original resource extent'},...decoded,filename:safeName(id)+'.png'});
  };
  if(game==='mk1') {
    // Canonical-only research/editors must not block ordinary browsing of a
    // user-modified MK1 installation. Preserve the strict gates; provide a
    // separate read-only path instead of bypassing source identity checks.
    const entries = await source.listRecursive();
    const exe = entries.find(e => e.name.toUpperCase() === 'MK1.EXE');
    if (!exe) return scanMK1ReadOnlyFallback(source, progress, signal, 'MK1.EXE not found');
    const bytes = await source.readSlice(exe.path, 0, exe.size);
    const actualSha = await hash(bytes);
    const canonicalSha = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
    if (actualSha !== canonicalSha) {
      return scanMK1ReadOnlyFallback(source, progress, signal,
        `Selected MK1.EXE SHA-256 ${actualSha} differs from the qualified research fixture ${canonicalSha}`);
    }
    let result;
    try {
      result = await runMK1Pipeline(source,progress,signal);
    } catch (error) {
      if (signal?.aborted) throw error;
      return scanMK1ReadOnlyFallback(source, progress, signal,
        error instanceof Error ? error.message : String(error));
    }
    const w=result.animationAssetsWorkspace;
    for(const a of w.characterAssets)addPng(a.path,a.pngBytes,`${a.identityLabel} · ${a.mode} · ${a.paletteSymbols.join('+')}`,'sprite','Explicit character palette context',a as unknown as Record<string,unknown>);
    for(const a of w.effectAssets)addPng(a.path,a.pngBytes,'Verified effects','sprite',a.tier);
    for(const a of w.unresolvedAssets)assets.push({id:`unresolved:${a.tableSymbol}:${a.descriptorWatcomOffset}`,name:a.symbol,group:'Unresolved palette',kind:'sprite',format:'PNG index preview',confidence:'Grayscale indices; palette unknown',source:{path:a.resourcePath,offset:0,length:0},metadata:{descriptorWatcomOffset:a.descriptorWatcomOffset},width:a.width,height:a.height,rgba:a.indexVisualizationRgba,filename:safeName(a.symbol)+'_index-preview.png'});
    for(const [name,bundle] of [['stages',result.browserBundle],['animations',result.animationBundle],['audio',result.audioBundle]] as const){
      packages.push({name:`MK1_${name}_evidence.zip`,bytes:bundle.zipBytes});
      if(name==='animations')continue;
      for(const [path,f] of parseAnimationStoreZip(bundle.zipBytes)){
        if(path.endsWith('.png'))addPng(path,f.bytes,path.split('/').slice(0,-1).join('/'),'stage','Qualified bounded stage composition; see evidence');
        if(path.toLowerCase().endsWith('.wav'))assets.push({id:path,name:path.split('/').at(-1)!,group:'MK1 audio',kind:'audio',format:'WAV',confidence:'Validated PCM export',source:{path,offset:0,length:f.bytes.length},metadata:{provenance:'Generated path; original offsets in audio evidence package'},bytes:f.bytes,mime:'audio/wav',filename:safeName(path)});
      }
    }
    return {game,assets,packages,reports:{workspace:w.report,stages:result.browserBundleValidation,audio:result.audioBundleValidation,animationGraph:result.fighterAnimationComparison,timing:result.streamControlTiming},limitations:['Animation chaining uses your chosen presentation timing. Gameplay timing and canonical animation names are not inferred.','Stage images represent the qualified snapshots named in their evidence packages.']};
  }
  const r=await runMK2Pipeline(source,progress,signal),o90=await executeVerifiedIdentityBundleO90(r.w88,r.x89);
  packages.push({name:'MK2_indexed_evidence.zip',bytes:r.d.zipBytes},{name:o90.report.package.downloadFileName,bytes:o90.zipBytes});
  const indexed=parseAnimationStoreZip(r.d.zipBytes),manifest=JSON.parse(new TextDecoder().decode(indexed.get('manifests/indexed_graphics_assets.json')!.bytes));
  for(const resource of manifest.resources)for(const s of resource.streams){
    const indices=indexed.get(s.indicesPath)!.bytes,mask=indexed.get(s.maskPath)!.bytes;
    assets.push({id:s.indicesPath,name:`${resource.resourceName} #${s.ordinal}`,group:`${resource.resourceName} · indexed`,kind:'sprite',format:'PNG index preview',confidence:'Exact indexed decode; palette unassigned',source:{path:resource.resourceName,offset:s.graOffset,length:s.encodedByteLength,sha256:resource.sha256},metadata:{...s,indices,mask},width:s.width,height:s.height,rgba:indexedRgba(indices,mask),filename:`${resource.resourceName}_${s.ordinal}_index-preview.png`});
  }
  for(const [key,bundle]of Object.entries({i:r.i,k:r.k,l:r.l,n:r.n,p:r.p,r:r.r,t85:r.t85,v87:r.v87,x89:r.x89})){
    const zip=parseAnimationStoreZip(bundle.zipBytes),m=JSON.parse(new TextDecoder().decode(zip.get('manifests/assets.json')!.bytes));
    for(const a of m.assets)addPng(`${key}/${a.pngPath}`,zip.get(a.pngPath)!.bytes,`${m.resourceName} · ${a.structuralContext??a.context}`,'sprite','Verified bounded identity/resource palette context',{...a,resourceName:m.resourceName});
  }
  // O94D already proves the exact mixer-readable interval, mono signed 8-bit
  // source data, and 11,025/22,050 Hz rates for the canonical 312-file corpus.
  // Make those qualified WAVs discoverable; keep the authoritative original U8s
  // (including excluded/unknown tails) in the existing O94D evidence ZIP.
  if(r.u8){
    const rows=new Map(r.u8.report.corpus.assets.map(a=>[a.path,a]));
    for(const wav of r.u8.wavAssets){
      const evidence=rows.get(wav.sourcePath);
      if(!evidence)throw new Error(`O94D evidence missing for ${wav.sourcePath}`);
      assets.push({id:`u8:${wav.sourcePath}`,name:wav.filename,group:'MK2 original sound effects',kind:'audio',format:'WAV · mono 8-bit PCM',confidence:'O94D verified source-domain WAV; runtime mixer output not claimed',
        source:{path:wav.sourcePath,offset:evidence.start,length:evidence.activeBytes,sha256:evidence.sourceSha256},
        metadata:{sourceFormat:'U8',sourceSampleRate:wav.sampleRate,originalFileBytes:evidence.fileBytes,
          excludedTailBytes:evidence.unreadBytes,activeEndExclusive:evidence.endExclusive,
          activeSha256:evidence.activeSha256,wavSha256:evidence.wavSha256,provenance:'MK2 O94D'},
        bytes:wav.bytes,mime:'audio/wav',filename:wav.filename});
    }
    packages.push({name:r.u8.report.package.fileName,bytes:r.u8.zipBytes});
  }
  // Qualified stage source assets recovered from the unchanged O177/O122/O132/O196
  // research code. P2–P4 are independent of P5 and retain uncertainty labels.
  progress('MK2 stage effects, setup layers and original floors (P2–P4)');
  const stageVisuals = await buildMK2StageVisualAssetsP2P4(source);
  assets.push(...stageVisuals.assets);
  packages.push(...stageVisuals.packages);
  const p5Floors = await buildMK2P5SourceFloorAssets(source);
  assets.push(...p5Floors.assets);
  progress('MK2 Forest original setup-local layers (P7)');
  const p7Forest = await buildMK2ForestLayersP7(source);
  assets.push(...p7Forest.assets);
  packages.push(...p7Forest.packages);
  progress('MK2 original Pit II lower-wall source graphics (P8)');
  const p8Pit = await buildMK2PitLowerWallP8(source);
  assets.push(...p8Pit.assets);
  packages.push(...p8Pit.packages);
  progress('MK2 original Pit II upper setup-local background layers (P9)');
  const p9PitUpper = await buildMK2PitUpperLayersP9(source);
  assets.push(...p9PitUpper.assets);
  packages.push(...p9PitUpper.packages);
  progress('MK2 original Pit II far-bridge actor sprite loops (P10)');
  const p10Bridge = await buildMK2PitBridgeActorsP10(source);
  assets.push(...p10Bridge.assets);
  packages.push(...p10Bridge.packages);
  progress('MK2 source-qualified Probe / Acclaim LZW intro images (P12)');
  const p12Intro=await buildMK2IntroLzwP12(source);
  assets.push(...p12Intro.assets);
  progress('MK2 source-qualified MOUNTAIN.GRA original indexed object images (P13)');
  const p13Mountain=await buildMK2MountainSourceP13(source);
  assets.push(...p13Mountain.assets);
  packages.push(...p13Mountain.packages);
  progress('MK2 seven original native 320-column stage floor viewport projections (P14)');
  const p14NativeViewports=await buildMK2NativeViewportFloorsP14(source);
  assets.push(...p14NativeViewports.assets);
  packages.push(...p14NativeViewports.packages);
  progress('MK2 Tomb/Portal original packed floors with conditional screenshot-witnessed RGB (P15)');
  const p15ObservedFloors=await buildMK2ObservedFloorsP15(source);
  assets.push(...p15ObservedFloors.assets);
  packages.push(...p15ObservedFloors.packages);
  progress('MK2 original source-verified IMAGES.GRA setup-local indexed mosaics (P17)');
  const p17Images=await buildMK2ImagesSetupsP17(source);
  assets.push(...p17Images.assets);
  packages.push(...p17Images.packages);
  progress('MK2 source-ordered original stage effect and Pit II bridge animation groups (P18)');
  const p18OrderedSequences=buildMK2OrderedSequenceBundlesP18(stageVisuals.assets,p10Bridge.assets);
  assets.push(...p18OrderedSequences.assets);
  packages.push(...p18OrderedSequences.packages);
  signal?.throwIfAborted();
  progress('MK2 CAVE.GRA original descriptor-backed indexed images (P22)');
  const p22Cave=await buildMK2CaveSourceP22(source);
  assets.push(...p22Cave.assets);
  packages.push(...p22Cave.packages);
  signal?.throwIfAborted();
  progress('MK2 ARMORY.GRA original descriptor-backed indexed images (P23)');
  const p23Armory=await buildMK2ArmorySourceP23(source);
  assets.push(...p23Armory.assets);
  packages.push(...p23Armory.packages);
  signal?.throwIfAborted();
  progress('MK2 BATTLE.GRA original indexed images with duplicate descriptor provenance (P24)');
  const p24Battle=await buildMK2BattleSourceP24(source);
  assets.push(...p24Battle.assets);
  packages.push(...p24Battle.packages);
  signal?.throwIfAborted();
  progress('MK2 ARENA.GRA original descriptor-backed indexed images (P25)');
  const p25Arena=await buildMK2ArenaSourceP25(source);
  assets.push(...p25Arena.assets);
  packages.push(...p25Arena.packages);
  signal?.throwIfAborted();
  progress('MK2 TOMB.GRA full original components of existing setup mosaics (P27)');
  const p27Tomb=await buildMK2TombSourceP27(source);
  assets.push(...p27Tomb.assets);
  packages.push(...p27Tomb.packages);
  signal?.throwIfAborted();
  progress('MK2 PORTAL.GRA full original components of existing setup mosaics (P28)');
  const p28Portal=await buildMK2PortalSourceP28(source);
  assets.push(...p28Portal.assets);
  packages.push(...p28Portal.packages);
  signal?.throwIfAborted();
  progress('MK2 TOWER.GRA original mixed-descriptor components (P29)');
  const p29Tower=await buildMK2TowerSourceP29(source);
  assets.push(...p29Tower.assets);
  packages.push(...p29Tower.packages);
  signal?.throwIfAborted();
  progress('MK2 FOREST.GRA full original components and P7 layer provenance (P30)');
  const p30Forest=await buildMK2ForestSourceP30(source);
  assets.push(...p30Forest.assets);
  packages.push(...p30Forest.packages);
  signal?.throwIfAborted();
  progress('MK2 FOREST.GRA additional original descriptors (P32)');
  const p32ForestTail=await buildMK2ForestTailSourceP32(source);
  assets.push(...p32ForestTail.assets);
  packages.push(...p32ForestTail.packages);
  signal?.throwIfAborted();
  progress('MK2 PIT.GRA original components of existing P9 layers (P33)');
  const p33Pit=await buildMK2PitSourceP33(source);
  assets.push(...p33Pit.assets);
  packages.push(...p33Pit.packages);
  signal?.throwIfAborted();
  progress('MK2 ARMORY.GRA additional original descriptors (P34)');
  const p34ArmoryTail=await buildMK2ArmoryTailSourceP34(source);
  assets.push(...p34ArmoryTail.assets);
  packages.push(...p34ArmoryTail.packages);
  signal?.throwIfAborted();
  progress('MK2 ARENA.GRA additional original descriptors (P35)');
  const p35ArenaTail=await buildMK2ArenaTailSourceP35(source);
  assets.push(...p35ArenaTail.assets);
  packages.push(...p35ArenaTail.packages);
  const music=[];
  for(const e of await source.listRecursive())if(e.extension.toUpperCase()==='MID'){
    const bytes=await source.readSlice(e.path,0,e.size);
    assets.push({id:`raw:${e.path}`,name:e.name+' (original)',group:'Original music sequences',kind:'raw',format:'Sound Images Gen2',confidence:'Original bytes',source:{path:e.path,offset:0,length:bytes.length},metadata:{},bytes,filename:e.name+'.soundimages.bin'});
    try{const sequence=decodeMK2Music(bytes);music.push({path:e.path,...sequence});assets.push({id:`midi:${e.path}`,name:e.name,group:'MK2 MIDI music',kind:'sequence',format:'MIDI',confidence:'Driver-derived MIDI events; one traversal, loops in metadata',source:{path:e.path,offset:0,length:bytes.length},metadata:sequence,bytes:writeMidi(sequence),filename:e.name,mime:'audio/midi'});}catch(error){music.push({path:e.path,error:String(error)});}
  }
  return {game,assets,packages,reports:{integration:o90.report,indexed:manifest,music,
    u8Audio:r.u8?.report ?? {status:'NOT_QUALIFIED',reason:r.u8Failure ?? 'O94D pipeline unavailable'},
    p2p4StageVisuals:stageVisuals.status,
    p5SourceFloors:p5Floors.stageResults,
    p7ForestLayers:p7Forest.status,
    p8PitLowerWall:p8Pit.status,
    p9PitUpper:p9PitUpper.status,
    p10PitBridgeActors:p10Bridge.status,
    p12IntroLzw:p12Intro.status,
    p13MountainSource:p13Mountain.status,
    p14NativeViewports:p14NativeViewports.status,
    p15ObservedFloors:p15ObservedFloors.status,
    p17ImagesSetups:p17Images.status,
    p18OrderedSequences:p18OrderedSequences.status,
    p22CaveSource:p22Cave.status,
    p23ArmorySource:p23Armory.status,
    p24BattleSource:p24Battle.status,
    p25ArenaSource:p25Arena.status,
    p27TombSource:p27Tomb.status,p28PortalSource:p28Portal.status,p29TowerSource:p29Tower.status,p30ForestSource:p30Forest.status,p32ForestTailSource:p32ForestTail.status,p33PitSource:p33Pit.status,p34ArmoryTailSource:p34ArmoryTail.status,p35ArenaTailSource:p35ArenaTail.status},
    limitations:[...MK2_STAGE_P2P4_LIMITATIONS,P5_MK2_SOURCE_FLOOR_LIMITATION,MK2_P7_FOREST_LIMITATION,P8_PIT_LOWER_WALL_LIMITATION,MK2_P9_PIT_UPPER_LIMITATION,MK2_P10_PIT_BRIDGE_LIMITATION,MK2_P12_INTRO_LIMITATION,MK2_P13_MOUNTAIN_LIMITATION,MK2_P14_VIEWPORT_LIMITATION,MK2_P15_OBSERVED_FLOOR_LIMITATION,MK2_P17_IMAGES_SETUP_LIMITATION,MK2_P18_SOURCE_SEQUENCE_LIMITATION,MK2_P22_CAVE_LIMITATION,MK2_P23_ARMORY_LIMITATION,MK2_P24_BATTLE_LIMITATION,MK2_P25_ARENA_LIMITATION,MK2_P27_TOMB_LIMITATION,MK2_P28_PORTAL_LIMITATION,MK2_P29_TOWER_LIMITATION,MK2_P30_FOREST_LIMITATION,MK2_P32_FOREST_TAIL_LIMITATION,MK2_P33_PIT_LIMITATION,MK2_P34_ARMORY_TAIL_LIMITATION,MK2_P35_ARENA_TAIL_LIMITATION,'94 exact-full resources provide 3,790 indexed sprites; nine bounded palette contracts provide 782 color variants.',
      'Stage assembly and gameplay animation ordering/timing remain unresolved.',
      ...(r.u8 ? ['312 original MK2 digital samples are source-domain WAV exports, not bit-exact runtime mixer recordings. Original U8 files and semantically unknown tails are retained in the O94D package.']
        : [`MK2 digital sample WAV export unavailable: ${r.u8Failure ?? 'O94D qualification did not complete'}. No speculative PCM conversion was attempted.`]),
      'Music exports contain one traversal. Loop points are retained in metadata; soundbank choice changes the preview sound.']};
}
