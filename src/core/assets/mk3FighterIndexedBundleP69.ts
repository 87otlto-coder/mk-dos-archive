/**
 * P69: per-original-FTR lossless MK3 fighter indexed-plane export.
 * Package members contain SOURCE-QUALIFIED decoded indices and paint masks,
 * not guessed display RGB or an invented game animation sequence.
 *
 * Built on demand from the existing MK3 Asset Library; registers no assets.
 */
import type { Asset } from './model';
import { hash, safeName, utf8 } from './model';
import { buildStoredZip } from '../research/researchArtifactDownloads';

export const MK3_P69_FORMAT = 'mk3_p69_original_ftr_indexed_sprites_v1';

function requireEvidence(ok: unknown, detail: string): asserts ok {
  if (!ok) throw new Error('P69 MK3 indexed fighter source: ' + detail);
}
function nonnegative(n: unknown): n is number {
  return typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
}
function positive(n: unknown): n is number {
  return nonnegative(n) && n > 0;
}
function originalSourcePath(p: string): boolean {
  return !!p && !p.includes('\\') && !p.startsWith('/') &&
    !p.split('/').some(part => !part || part === '.' || part === '..') &&
    /\.FTR$/i.test(p);
}

export interface MK3FighterIndexedBundleP69 {
  name: string;
  bytes: Uint8Array;
  report: {
    status: 'VERIFIED';
    originalFtrPath: string;
    frames: number;
    indexAndMaskBytes: number;
    originalIndexedPlanesPreserved: true;
    runtimeAnimationOrPaletteClaimed: false;
  };
}

/** Call with the CURRENT selected game's complete AssetCollection.assets. */
export async function buildMK3FighterIndexedBundleP69(
  assets: readonly Asset[], originalFtrPath: string, signal?: AbortSignal,
): Promise<MK3FighterIndexedBundleP69> {
  signal?.throwIfAborted();
  requireEvidence(originalSourcePath(originalFtrPath), 'invalid original FTR source path');
  const selected = assets.filter(a => a.kind === 'sprite' &&
    a.source.path === originalFtrPath);
  requireEvidence(selected.length > 0, 'no original indexed fighter sprite assets in this FTR');
  requireEvidence(selected.length <= 10_000, 'unexpectedly large fighter source group');

  const sourceHashes = new Set(selected.map(a => a.source.sha256));
  requireEvidence(sourceHashes.size === 1 &&
    /^[a-f0-9]{64}$/.test(selected[0].source.sha256 ?? ''),
    'all source sprites must share the exact original container SHA-256');
  const originalSha256 = selected[0].source.sha256!;
  const uniqueIds = new Set<string>(), uniqueDescriptors = new Set<string>();
  let decodedPlaneBytes = 0;
  for (const a of selected) {
    signal?.throwIfAborted();
    const m = a.metadata;
    requireEvidence(!uniqueIds.has(a.id), 'duplicate source sprite asset ID ' + a.id);
    uniqueIds.add(a.id);
    requireEvidence(nonnegative(a.source.offset) && positive(a.source.length),
      'missing or invalid original compressed source byte interval ' + a.id);
    requireEvidence(positive(a.width) && positive(a.height) &&
      a.width * a.height <= 1_000_000,
      'invalid original indexed sprite dimensions ' + a.id);
    requireEvidence(m.indices instanceof Uint8Array &&
      m.mask instanceof Uint8Array &&
      m.indices.length === a.width * a.height && m.mask.length === m.indices.length,
      'source indexed pixels/opacity mask incomplete ' + a.id);
    requireEvidence(m.mask.every(value => value === 0 || value === 1),
      'source sprite opacity mask must be binary ' + a.id);
    requireEvidence(m.palette === 'UNKNOWN' &&
      m.visualization === 'GRAYSCALE_INDEX_MAP' &&
      m.paletteRgb === undefined,
      'cannot promote display palette ownership without source evidence ' + a.id);
    requireEvidence(nonnegative(m.headerOffset) && nonnegative(m.descriptorIndex) &&
      nonnegative(m.mode) && positive(m.expandedSize) &&
      positive(m.bitDepth) && nonnegative(m.group) && nonnegative(m.model),
      'incomplete original frame descriptor provenance ' + a.id);
    requireEvidence(Number.isSafeInteger(m.descriptorX) &&
      Number.isSafeInteger(m.descriptorY), 'invalid original descriptor X/Y '+a.id);
    const descKey = String(m.headerOffset) + ':' + String(m.descriptorIndex);
    requireEvidence(!uniqueDescriptors.has(descKey),
      'duplicate original FHDS descriptor identifier ' + descKey);
    uniqueDescriptors.add(descKey);
    decodedPlaneBytes += m.indices.length * 2;
  }

  // Each frame retains its actual FHDS source order; this order is expressly
  // NOT an animation timeline, layer order, character identity or stage join.
  const ordered = [...selected].sort((a,b) =>
    Number(a.metadata.headerOffset) - Number(b.metadata.headerOffset) ||
    Number(a.metadata.descriptorIndex) - Number(b.metadata.descriptorIndex));

  const files: Array<{name:string;bytes:Uint8Array}> = [];
  const records: Array<Record<string,unknown>> = [];
  for (const [ordinal, a] of ordered.entries()) {
    signal?.throwIfAborted();
    const indices = a.metadata.indices as Uint8Array;
    const mask = a.metadata.mask as Uint8Array;
    const stem = 'frames/' + String(ordinal).padStart(5,'0');
    const indicesPath = stem + '_indices.bin';
    const maskPath = stem + '_mask.bin';
    files.push({name:indicesPath,bytes:indices},{name:maskPath,bytes:mask});
    records.push({
      sourceAssetId:a.id,
      originalSourcePath:a.source.path,
      originalSourceOffset:a.source.offset,
      originalCompressedByteLength:a.source.length,
      originalFhdsDescriptorHeaderOffset:a.metadata.headerOffset,
      originalDescriptorIndex:a.metadata.descriptorIndex,
      originalDescriptorX:a.metadata.descriptorX,
      originalDescriptorY:a.metadata.descriptorY,
      originalMode:a.metadata.mode,
      originalGroup:a.metadata.group,
      originalModel:a.metadata.model,
      originalExpandedSize:a.metadata.expandedSize,
      originalBitDepth:a.metadata.bitDepth,
      width:a.width,height:a.height,
      indexedPixelCount:indices.length,
      opaquePixelCount:mask.reduce((n,v)=>n+v,0),
      indicesPath,maskPath,
      indicesSha256:await hash(indices),maskSha256:await hash(mask),
      nativePaletteVerified:false,
      runtimeAnimationOrderVerified:false,
      gameplaySpriteIdentityVerified:false,
    });
  }
  const manifest = {
    format: MK3_P69_FORMAT,
    originalFtrPath, originalFtrWholeFileSha256:originalSha256,
    sourceDescriptorOrder:'FHDS_RECORD_ENCOUNTER_ORDER_ONLY',
    originalFhdsDescriptorOffsetsAreFileRelative:true,
    sourceCompressedIntervalsAreFileRelative:true,
    indexedPixelOrder:'ROW_MAJOR',
    maskMeaning:'ONE_MEANS_OPAQUE_ZERO_MEANS_TRANSPARENT',
    spriteCount:records.length,sourceIndexAndMaskBytes:decodedPlaneBytes,
    sourceIndexedPixelsPreserved:true,
    nativePaletteOwnershipVerified:false,
    nativeAnimationTimingVerified:false,
    nativeAnimationSequenceOrderVerified:false,
    runtimeWorldPlacementOrCompositorOrderVerified:false,
    originalDescriptors:records,
  };
  files.push({name:'manifest.json',bytes:utf8.encode(JSON.stringify(manifest,null,2)+'\n')});
  files.push({name:'README.txt',bytes:utf8.encode(
    'MK3 P69 ORIGINAL FTR INDEXED SPRITES\n\n' +
    'This lossless package contains the existing verified FTR-decoded row-major '+
    'palette INDICES and binary transparency MASK per source FHDS frame descriptor.\n'+
    'Each record has original FTR file SHA-256 and original compressed-data '+
    'source byte interval. Native compressed bytes are not copied into this bundle; '+
    'retain your original FTR source file.\n'+
    'Do not infer fighter identity, sequence order, frame timing, sprite Z-order, '+
    'stage membership or VGA palette from file/descriptor order or preview grayscale.\n')});
  const name = 'MK3_P69_' + safeName(originalFtrPath).replace(/\.FTR$/i,'') +
    '_ORIGINAL_INDEXED_SPRITES.zip';
  const bytes = buildStoredZip(files);
  return {name,bytes,report:{
    status:'VERIFIED',originalFtrPath,frames:records.length,
    indexAndMaskBytes:decodedPlaneBytes,
    originalIndexedPlanesPreserved:true,runtimeAnimationOrPaletteClaimed:false,
  }};
}
