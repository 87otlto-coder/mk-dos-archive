/**
 * P72: deliberate original IFF CMAP comparison against original MK3 FTR
 * indexed sprites. A referenced DATA.MK3 FORM owns its embedded IFF CMAP;
 * there is NO verified native fighter palette join. RGB output is exclusively
 * a user-selected comparison and never replaces the original indices/masks.
 */
import type { Asset } from './model';
import { hash, safeName, utf8 } from './model';
import { png } from './export';
import { buildStoredZip } from '../research/researchArtifactDownloads';

export const MK3_P72_FORMAT='mk3_p72_source_iff_cmap_to_ftr_comparison_only_v1';

export interface MK3PaletteComparisonChoiceP72 {
  sourceIffAsset:Asset;
  identicalSourceCmaps:number;
}
export interface MK3PaletteComparisonP72 {
  rgba:Uint8Array;
  width:number;
  height:number;
  originalSourceSprite:Asset;
  originalSourceIff:Asset;
  originalIndexedPixels:Uint8Array;
  originalMask:Uint8Array;
  originalEmbeddedCmap:Uint8Array;
}
function requireEvidence(ok:unknown, reason:string):asserts ok {
  if(!ok)throw new Error('P72 MK3 source palette comparison: '+reason);
}
function positive(n:unknown):n is number {
  return typeof n==='number'&&Number.isSafeInteger(n)&&n>0;
}
function nonnegative(n:unknown):n is number {
  return typeof n==='number'&&Number.isSafeInteger(n)&&n>=0;
}
function originalPath(p:string):boolean {
  return !!p&&!p.startsWith('/')&&!p.includes('\\')&&
    p.split('/').every(s=>!!s&&s!=='.'&&s!=='..');
}
function folder(p:string):string {
  const n=p.lastIndexOf('/');return n>=0?p.slice(0,n+1):'';
}
function qualifiedSource(asset:Asset){
  requireEvidence(originalPath(asset.source.path)&&nonnegative(asset.source.offset)&&
    positive(asset.source.length)&&
    /^[0-9a-f]{64}$/.test(asset.source.sha256??''),
    'original source path, byte extent or source SHA-256 missing');
}
function qualifiesIff(asset:Asset):boolean {
  return asset.kind==='image'&&/(^|\/)DATA\.MK3$/i.test(asset.source.path)&&
    asset.metadata.paletteFormat==='IFF_CMAP_RGB8'&&
    asset.metadata.paletteSource==='Embedded CMAP in this source FORM'&&
    asset.metadata.paletteRuntimeOwnershipKnown===false&&
    asset.metadata.paletteRgb instanceof Uint8Array&&
    asset.metadata.paletteRgb.length===768;
}
/**
 * Dedupe only BYTE-IDENTICAL original image palettes. There is no closeness
 * score, color-distance ranking or claim that any image palette owns a fighter.
 */
export function listMK3IffPaletteComparisonsP72(
  assets:readonly Asset[],
):MK3PaletteComparisonChoiceP72[]{
  const keys=new Map<string,MK3PaletteComparisonChoiceP72>();
  for(const asset of assets){
    if(!qualifiesIff(asset))continue;
    const pal=asset.metadata.paletteRgb as Uint8Array;
    const key=Array.from(pal,b=>b.toString(16).padStart(2,'0')).join('');
    const previous=keys.get(key);
    if(previous){previous.identicalSourceCmaps++;continue;}
    keys.set(key,{sourceIffAsset:asset,identicalSourceCmaps:1});
  }
  return [...keys.values()].sort((a,b)=>
    a.sourceIffAsset.source.offset-b.sourceIffAsset.source.offset);
}

/** Explicit UI-selected source CMAP. Never native fighter palette binding. */
export function compareMK3FighterWithIffCmapP72(
  fighter:Asset,iffImage:Asset,
):MK3PaletteComparisonP72{
  requireEvidence(fighter.kind==='sprite'&&/\.FTR$/i.test(fighter.source.path),
    'expected an original MK3 fighter indexed sprite');
  qualifiedSource(fighter);
  requireEvidence(positive(fighter.width)&&positive(fighter.height)&&
    fighter.width*fighter.height<=1_000_000,
    'original fighter sprite geometry');
  const indices=fighter.metadata.indices,mask=fighter.metadata.mask;
  requireEvidence(indices instanceof Uint8Array&&mask instanceof Uint8Array&&
    indices.length===fighter.width*fighter.height&&
    mask.length===indices.length,'original indexed pixels and paint mask missing');
  requireEvidence(mask.every(x=>x===0||x===1),'original mask is not binary');
  requireEvidence(fighter.metadata.palette==='UNKNOWN'&&
    fighter.metadata.visualization==='GRAYSCALE_INDEX_MAP'&&
    fighter.metadata.paletteRgb===undefined,
    'fighter already has a different palette/evidence classification');

  requireEvidence(qualifiesIff(iffImage),
    'chosen palette is not an explicit, source-owned MK3 IFF CMAP');
  qualifiedSource(iffImage);
  requireEvidence(iffImage.source.offset>=0 && iffImage.source.length>=12 &&
    iffImage.id===iffImage.source.path+'@'+iffImage.source.offset,
    'original IFF FORM source extent/identity');
  requireEvidence(folder(fighter.source.path)===folder(iffImage.source.path),
    'original fighter and IFF palette from different installation roots');
  // The original CMAP is 256 RGB8 entries; this fact alone does NOT
  // establish any runtime or palette ownership of the fighter sprite.
  const pal=iffImage.metadata.paletteRgb as Uint8Array;
  const rgba=new Uint8Array(indices.length*4);
  for(let i=0;i<indices.length;i++){
    if(mask[i]===0)continue;
    const j=indices[i]*3,k=i*4;
    rgba[k]=pal[j];rgba[k+1]=pal[j+1];rgba[k+2]=pal[j+2];rgba[k+3]=255;
  }
  return {rgba,width:fighter.width,height:fighter.height,
    originalSourceSprite:fighter,originalSourceIff:iffImage,
    originalIndexedPixels:indices,originalMask:mask,originalEmbeddedCmap:pal};
}

export async function exportMK3PaletteComparisonP72(
  fighter:Asset,iffImage:Asset,
):Promise<{name:string;bytes:Uint8Array;comparison:MK3PaletteComparisonP72}>{
  const comparison=compareMK3FighterWithIffCmapP72(fighter,iffImage);
  const {rgba,width,height,originalIndexedPixels:indices,
    originalMask:mask,originalEmbeddedCmap:palette}=comparison;
  const [indicesSha,maskSha,paletteSha,rgbaSha]=await Promise.all([
    hash(indices),hash(mask),hash(palette),hash(rgba)]);
  const manifest={
    format:MK3_P72_FORMAT,
    provenanceConfidence:'VERIFIED_SOURCE_PLANES_AND_IFF_CMAP__UNVERIFIED_CROSS_RESOURCE_PALETTE_BINDING',
    outputPurpose:'USER_SELECTED_COLOR_COMPARISON_ONLY',
    nativeFighterPaletteOwnershipVerified:false,
    nativeRuntimeAnimationOrStageMembershipClaimed:false,
    paletteChoiceWasExplicit:true,
    originalFighter:{
      assetId:fighter.id,sourcePath:fighter.source.path,
      sourceWholeFileSha256:fighter.source.sha256,
      sourceCompressedOffset:fighter.source.offset,
      sourceCompressedLength:fighter.source.length,width,height,
      indicesSha256:indicesSha,opacityMaskSha256:maskSha,
    },
    originalIffPalette:{
      assetId:iffImage.id,sourcePath:iffImage.source.path,
      sourceWholeFileSha256:iffImage.source.sha256,
      originalFormOffset:iffImage.source.offset,
      originalFormLength:iffImage.source.length,
      paletteFormat:'IFF_CMAP_RGB8',entries:256,
      paletteRgbSha256:paletteSha,
      originalVerifiedOwner:'EMBEDDED_IN_THIS_IFF_FORM_ONLY',
      originalFighterOwnership:'UNKNOWN',
    },
    display:{
      comparisonOnlyPng:'comparison.png',
      rgbaSha256:rgbaSha,
      indexPlane:'original/fighter-indices.bin',
      opacityPlane:'original/fighter-mask.bin',
      sourceCmap:'reference/iff-cmap-rgb8.bin',
      transparentPixelsAreZeroRgba:true,
      pixelIndicesAndMaskNotChanged:true,
    },
  };
  const files=[
    {name:'comparison.png',bytes:png(width,height,rgba)},
    {name:'original/fighter-indices.bin',bytes:indices},
    {name:'original/fighter-mask.bin',bytes:mask},
    {name:'reference/iff-cmap-rgb8.bin',bytes:palette},
    {name:'manifest.json',bytes:utf8.encode(JSON.stringify(manifest,null,2)+'\n')},
    {name:'README.txt',bytes:utf8.encode(
      'P72 MK3 ORIGINAL IFF CMAP / FTR FIGHTER SOURCE COMPARISON\n\n'+
      'This colorized PNG is an EXPLICIT USER-SELECTED COMPARISON. The '+ 
      'palette is embedded in one original DATA.MK3 IFF source image, but '+ 
      'has NOT been authenticated as the native palette of the fighter.\n'+
      'Original fighter indices and mask are preserved unchanged; original '+ 
      'source CMAP bytes are also included. This ZIP is NOT a canonically '+ 
      'palette-resolved fighter sprite, animation or stage reconstruction.\n')},
  ];
  return {
    name:'MK3_P72_'+safeName(fighter.id)+'_CMAP_COMPARISON.zip',
    bytes:buildStoredZip(files),
    comparison,
  };
}
