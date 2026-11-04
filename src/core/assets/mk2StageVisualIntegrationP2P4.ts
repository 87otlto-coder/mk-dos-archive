/** P6 reconciliation of extractor-facing P2–P4 stage assets.
 * Calls the existing, unchanged O136/O177, O122, O132 and O196
 * source-qualified modules. Does NOT infer native clocks, compositing order,
 * camera position, activation, or Forest/Tower runtime palette ownership.
 * Original DOS game resources are read only.
 */
import type { DirectorySource, SourceFileEntry } from '../filesystem/DirectorySource';
import type { Asset } from './model';
import { hash } from './model';
import { selectedZip } from './export';
import { readMK2OriginalEffectFramesO136 } from '../../games/mk2/research/stageOriginalEffectFramesO136';
import { buildAllOriginalEffectFramesArchiveO177 } from '../../games/mk2/research/stageOriginalEffectArchiveO177';
import { O122_SETUP_ROWS } from '../../games/mk2/research/stageIndexedPlacementsO122';
import { renderMK2IndexedSetupLayerO122 } from '../../games/mk2/research/stageIndexedMosaicsO122';
import { renderMK2FullSourceFloorO132 } from '../../games/mk2/research/stageNativeSourceFloorO132';
import { runO196ForestFloor } from '../experiments/o196';

const EXE_SHA = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const STAGE_HASH: Record<string, string> = {
 tomb: 'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
 portal: 'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82',
 tower: '7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8',
 forest: '8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9',
};
export const MK2_STAGE_P2P4_LIMITATIONS = [
 'P2 original stage effects have source-order frames only. FPS, activation, positions and draw order are unverified.',
 'P3 Tomb/Portal layers are setup-local source compositions, not final stage screenshots or playable-stage scenes.',
 'P4 floor planes retain all 896 original source columns. No camera crop, parallax, placement, or timing is inferred.',
 'P2 Tower and P4 Forest colors include source-linked candidates; neither is a runtime DAC palette witness.',
];

type StageFamily = 'P2' | 'P3' | 'P4';
type StageStatus = { status: 'VERIFIED' | 'UNAVAILABLE'; count: number; detail?: string };
export type StageIntegrationResult = {
 assets: Asset[];
 packages: Array<{ name: string; bytes: Uint8Array }>;
 status: Record<StageFamily, StageStatus>;
};
function entry(files: SourceFileEntry[], filename: string): SourceFileEntry {
 const matches = files.filter(f => f.name.toLowerCase() === filename.toLowerCase());
 if (matches.length !== 1) throw Error(`Exactly one original ${filename} required; found ${matches.length}`);
 return matches[0];
}
async function read(source: DirectorySource, f: SourceFileEntry): Promise<Uint8Array> {
 const bytes = await source.readSlice(f.path, 0, f.size);
 if (bytes.length !== f.size) throw Error(`Truncated ${f.path}`);
 return bytes;
}
function rgbIndexPreview(indices: Uint8Array): Uint8Array {
 const rgba = new Uint8Array(indices.length * 4);
 for (let i=0;i<indices.length;i++) {
  const v=indices[i],o=i*4;rgba[o]=v;rgba[o+1]=v;rgba[o+2]=v;rgba[o+3]=255;
 }
 return rgba;
}

export async function buildMK2StageVisualAssetsP2P4(source: DirectorySource): Promise<StageIntegrationResult> {
 const files = await source.listRecursive();
 const assets: Asset[] = [], packages: StageIntegrationResult['packages'] = [];
 const status: StageIntegrationResult['status'] = {
  P2: {status:'UNAVAILABLE',count:0}, P3:{status:'UNAVAILABLE',count:0}, P4:{status:'UNAVAILABLE',count:0},
 };
 let exe: Uint8Array;
 try {
  exe = await read(source, entry(files, 'MK2.EXE'));
  if (exe.length !== 861133 || await hash(exe) !== EXE_SHA) throw Error('Original MK2.EXE identity mismatch');
 } catch (error) {
  const detail = String(error);
  for (const pass of ['P2','P3','P4'] as const) status[pass] = {status:'UNAVAILABLE',count:0,detail};
  return {assets,packages,status};
 }
 const resources = new Map<string,Uint8Array>();
 async function resource(stage: string): Promise<Uint8Array> {
  const cached=resources.get(stage);if(cached)return cached;
  const bytes=await read(source,entry(files,stage+'.GRA'));
  if(await hash(bytes)!==STAGE_HASH[stage])throw Error(`Canonical ${stage.toUpperCase()}.GRA SHA-256 mismatch`);
  resources.set(stage,bytes);return bytes;
 }
 // P2 is an all-six-track, all-43-frame contract. Never silently publish a partial
 // O177 archive as though it represented the complete qualified source group.
 try {
  const tracks=[];
  for(const stage of ['tomb','portal','tower'] as const)
   tracks.push(...await readMK2OriginalEffectFramesO136(exe,await resource(stage),stage));
  const archive=await buildAllOriginalEffectFramesArchiveO177(tracks);
  for(const track of tracks)for(const frame of track.frames) {
   const stem=String(frame.ordinal).padStart(2,'0');
   const group=`MK2 source-ordered stage effects / ${track.stage} / ${track.name}`;
   assets.push({id:`mk2-stage-effect:${track.name}:${stem}`,name:`${track.name} frame ${stem}`,group,
    kind:'sprite',format:'PNG · O177 source-frame preview',
    confidence:track.paletteIsSourceLinkedCandidate ? 'Source-linked palette CANDIDATE; NOT runtime-selected' :
      'O177 source-decoded palette context; NOT verified live DAC',
    source:{path:`${track.stage}.gra`,offset:frame.graStart,length:frame.graEnd-frame.graStart,sha256:STAGE_HASH[track.stage]},
    metadata:{stage:track.stage,sequence:track.name,sourceFrameOrdinal:frame.ordinal,
     controlType:track.controlType,sourcePointerObject2:track.sourcePointerObject2,
     descriptorObject2:frame.descriptorObject2,sourceX:frame.sourceX,sourceY:frame.sourceY,
     indices:frame.indices,mask:frame.mask,animationFPSKnown:false,runtimeActivationKnown:false,
     finalScreenCoordinatesKnown:false,runtimePaletteSelected:false,sourceEvidence:'O136/O177/O181'},
    width:frame.width,height:frame.height,rgba:frame.rgba,
    filename:`MK2_${track.name}_frame_${stem}.png`});
  }
  if(assets.length!==43)throw Error('Expected 43 O177 frames');
  packages.push({name:archive.filename,bytes:archive.zipBytes});
  status.P2={status:'VERIFIED',count:43};
 }catch(error){
  assets.length=0;
  status.P2={status:'UNAVAILABLE',count:0,detail:String(error)};
 }
 // P3 remains available when Tower is absent: P3 needs only Tomb and Portal.
 const p3:Asset[]=[];
 try {
  for(const stage of ['tomb','portal'] as const){
   const gra=await resource(stage);
   for(const setup of O122_SETUP_ROWS[stage]){
    const layer=await renderMK2IndexedSetupLayerO122(exe,gra,stage,setup.setupObject2Offset);
    const code=setup.setupObject2Offset.toString(16).toUpperCase();
    p3.push({id:`mk2-stage-setup:${stage}:object2_${code}`,name:`${stage==='tomb'?'Kombat Tomb':'The Portal'} · object2_${code}`,
     group:`MK2 setup-local background layers / ${stage}`,kind:'stage',format:'PNG · original setup layer',
     confidence:'O122 static authenticated layer; NOT a final full-stage scene',
     source:{path:`${stage}.gra`,offset:0,length:gra.length,sha256:STAGE_HASH[stage]},
     metadata:{stage,setupObject2Offset:setup.setupObject2Offset,sourceExecutable:'mk2.exe',
      paletteRecordPhysical:layer.paletteSourceRecordPhysical,qualification:layer.qualification,
      descriptorCount:layer.descriptorCount,placements:setup.placements,
      opaqueCanvasPixels:layer.opaqueCanvasPixels,overdrawOpaquePixels:layer.overdrawOpaquePixels,
      clippedOpaqueSourcePixels:layer.clippedOpaquePixels,indices:layer.indices,mask:layer.opacity,
      runtimeScreenPlacementKnown:false,finalDrawOrderKnown:false,nativeAnimationTimingKnown:false,
      provenance:'O118/O121/O122'},
     width:layer.width,height:layer.height,rgba:layer.rgba,
     filename:`MK2_${stage}_object2_${code}_setup_layer.png`});
   }
  }
  if(p3.length!==8)throw Error('Expected eight O122 setup layers');
  assets.push(...p3);
  packages.push({name:'MK2_P3_8_STATIC_SETUP_LAYERS.zip',bytes:selectedZip(p3)});
  status.P3={status:'VERIFIED',count:p3.length};
 }catch(error){status.P3={status:'UNAVAILABLE',count:0,detail:String(error)};}

 // P4: two O132 color-qualified source planes and an independently verified
 // Forest source plane whose palette is only candidate-linked (O196).
 const p4:Asset[]=[];
 const p4Problems:string[]=[];
 for (const stage of ['tomb','portal'] as const){
  try{
   const floor=await renderMK2FullSourceFloorO132(exe,await resource(stage),stage);
   const start=stage==='tomb'?63776:56916;
   const group=`MK2 native-width packed floors / ${stage}`;
   const common={stage,width:floor.width,height:floor.height,sourceOffset:start,
    paletteRecordPhysical:floor.palettePhysical,cameraCropApplied:false,screenRowClippingApplied:false,
    animationRecovered:false,parallaxRecovered:false,finalSceneKnown:false,qualification:floor.qualification};
   const s={path:`${stage}.gra`,offset:start,length:floor.indices.length,sha256:STAGE_HASH[stage]};
   p4.push({id:`mk2-floor:${stage}:rgba`,name:`${stage} · full original floor · colors`,group,
    kind:'stage',format:'PNG · 896px original floor',confidence:'O132 original source + O118 matched color record; no full-scene placement',
    source:s,metadata:{...common,indices:floor.indices},width:896,height:floor.height,rgba:floor.rgba,
    filename:`MK2_${stage}_896x${floor.height}_native_floor.png`});
   p4.push({id:`mk2-floor:${stage}:indices`,name:`${stage} · original floor indices`,group,
    kind:'raw',format:'8-bit indexed floor source',confidence:'Exact O132 original GRA bytes; not camera-clipped',
    source:s,metadata:common,bytes:floor.indices,mime:'application/octet-stream',
    filename:`MK2_${stage}_896x${floor.height}_indices.bin`});
  } catch(error){p4Problems.push(`${stage}: ${String(error)}`);}
 }
 try{
  const forest=await runO196ForestFloor(source);
  const group='MK2 native-width packed floors / forest';
  const common={stage:'forest',width:896,height:32,sourceOffset:forest.floor.sourceGRAOffset,
   paletteRecordPhysical:forest.palette.sourcePhysical,paletteRuntimeSelected:false,
   sourcePaletteAssociation:'O196 5 source setup variants / 60 controls / slot 2',
   fullSceneKnown:false,animationRecovered:false,screenPlacementKnown:false,qualification:forest.status};
  const s={path:forest.original.forestPath,offset:forest.floor.sourceGRAOffset,
   length:forest.floor.sourceByteLength,sha256:forest.original.forestSHA256};
  p4.push({id:'mk2-floor:forest:indices-preview',name:'forest · exact index-value preview',group,
   kind:'stage',format:'PNG · original index values (grayscale)',
   confidence:'O196 original source indices; grayscale is visualization, NOT gameplay color',
   source:s,metadata:{...common,indices:forest.floor.indices},width:896,height:32,
   rgba:rgbIndexPreview(forest.floor.indices),filename:'MK2_forest_896x32_original_index_preview.png'});
  p4.push({id:'mk2-floor:forest:candidate-rgba',name:'forest · source-linked candidate colors',group,
   kind:'stage',format:'PNG · candidate source palette preview',
   confidence:'O196 source palette CANDIDATE, runtime DAC selection UNVERIFIED',
   source:s,metadata:{...common,indices:forest.floor.indices},width:896,height:32,
   rgba:forest.floor.rgba,filename:'MK2_forest_896x32_candidate_colors.png'});
  p4.push({id:'mk2-floor:forest:indices',name:'forest · original indexed source bytes',group,
   kind:'raw',format:'8-bit indexed floor source',confidence:'Exact original FOREST.GRA 28,672 bytes',
   source:s,metadata:common,bytes:forest.floor.indices,mime:'application/octet-stream',
   filename:'MK2_forest_896x32_original_indices.bin'});
 }catch(error){p4Problems.push(`forest: ${String(error)}`);}
 if(p4.length){
  assets.push(...p4);
  packages.push({name:'MK2_P4_AUTHENTICATED_NATIVE_FLOOR_SOURCE_PACK.zip',bytes:selectedZip(p4)});
 }
 status.P4={status:p4.length===7?'VERIFIED':'UNAVAILABLE',count:p4.length,
  ...(p4Problems.length?{detail:p4Problems.join(' | ')}:{})};
 return {assets,packages,status};
}
