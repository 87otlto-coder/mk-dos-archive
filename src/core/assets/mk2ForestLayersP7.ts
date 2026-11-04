/** P7: extractor-facing original Forest setup layers from unchanged O197 research.
 * Source indexed pixels, transparency and setup-local placement are verified.
 * The EXE-linked colors are ONLY candidate previews, never claimed runtime DAC.
 */
import type { DirectorySource } from '../filesystem/DirectorySource';
import type { Asset } from './model';
import { buildO197ForestForensicZip, runO197ForestLayers } from '../experiments/o197';

export const MK2_P7_FOREST_LIMITATION =
 'P7 Forest has five authentic independent setup-local canvases. Candidate RGB is NOT the observed runtime palette. No relative inter-layer placement, camera, parallax, render order or live animation timing is claimed.';

export type P7ForestResult = {
 assets: Asset[];
 packages: Array<{name:string;bytes:Uint8Array}>;
 status: {status:'VERIFIED'|'UNAVAILABLE';count:number;detail?:string};
};

function grayscaleIndexPreview(indices: Uint8Array, mask: Uint8Array): Uint8Array {
 const rgba = new Uint8Array(indices.length * 4);
 for (let i=0;i<indices.length;i++) {
  const n=i*4,v=indices[i];
  rgba[n]=v;rgba[n+1]=v;rgba[n+2]=v;rgba[n+3]=mask[i] ? 255 : 0;
 }
 return rgba;
}

export async function buildMK2ForestLayersP7(source: DirectorySource): Promise<P7ForestResult> {
 try {
  // O197 rechecks canonical MK2.EXE, FOREST.GRA, O196 ancestor provenance,
  // exactly five setups, 60 placements and 43 unique encoded sprite streams.
  const r=await runO197ForestLayers(source);
  const assets:Asset[]=[];
  for (const layer of r.layers) {
   const common={stage:'forest',originalSetupVariant:layer.variant,
    setupObject2Offset:layer.setupObject2Offset,setupPhysical:layer.setupPhysical,
    placementRecords:layer.placementCount,uniqueStreams:layer.streams.length,
    opaquePixels:layer.opaquePixels,clippedOpaqueSourcePixels:layer.clippedOpaquePixels,
    sourcePalettePhysical:r.palette.sourcePhysical,
    paletteRuntimeSelected:false,interLayerPlacementVerified:false,parallaxVerified:false,
    finalDrawOrderVerified:false,nativeAnimationTimingVerified:false,
    sourceFloorIsSeparate:true,indices:layer.indices,mask:layer.opacity,
    sourceProvenance:'O196/O197; original control positions are setup-local only',
    qualification:layer.qualification};
   const src={path:r.original.forestPath,offset:0,length:r.sourceRenderer.originalGRAFloorStart,
    sha256:r.original.forestSHA256};
   assets.push({id:`mk2-forest-setup:${layer.variant}:indices-preview`,
    name:`Living Forest · source layer ${layer.variant} · index preview`,
    group:'MK2 original Forest setup-local layers',kind:'stage',
    format:'PNG · exact source indices as grayscale (not game colors)',
    confidence:'O197 exact source-index canvas; grayscale is a visualization, NOT gameplay RGB',
    source:src,metadata:{...common,previewMode:'index-values'},
    width:layer.width,height:layer.height,
    rgba:grayscaleIndexPreview(layer.indices,layer.opacity),
    filename:`MK2_Forest_setup_${layer.variant}_original_indices_preview.png`});
   assets.push({id:`mk2-forest-setup:${layer.variant}:candidate-colors`,
    name:`Living Forest · source layer ${layer.variant} · candidate colors`,
    group:'MK2 original Forest setup-local layers',kind:'stage',
    format:'PNG · candidate color preview (not verified runtime palette)',
    confidence:'O197 source-linked 80-word palette CANDIDATE; NOT runtime DAC verified',
    source:src,metadata:{...common,previewMode:'candidate-rgb'},
    width:layer.width,height:layer.height,rgba:layer.rgba,
    filename:`MK2_Forest_setup_${layer.variant}_CANDIDATE_RGB.png`});
  }
  if(assets.length!==10)throw Error(`Expected 10 Forest asset representations; got ${assets.length}`);
  return {assets,
   packages:[{name:'MKDOS_O197_Forest_Five_Original_Layers_Forensic.zip',bytes:buildO197ForestForensicZip(r)}],
   status:{status:'VERIFIED',count:assets.length}};
 } catch(error) {
  return {assets:[],packages:[],status:{status:'UNAVAILABLE',count:0,detail:String(error)}};
 }
}
