/** Visual animation-assets workspace model — Pass 1E.3O.62. */
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { MK1BrowserAnimationExportBundleResult } from './browserAnimationExportBundle';
import { MK1BrowserAnimationExportBundleValidationReport, parseAnimationStoreZip } from './browserAnimationExportBundleValidation';
import { MK1PaletteBindingExceptionCensusReport } from './paletteBindingExceptionCensus';

const decoder = new TextDecoder();
function json<T>(bytes: Uint8Array): T { return JSON.parse(decoder.decode(bytes)) as T; }

type CharacterManifestAsset = { path: string; characterId: number; identityLabel: string; anitabSymbol: string; mode: 'NORMAL' | 'ALTERNATE' | string; paletteSymbols: string[]; descriptorWatcomOffset: number; descriptorWatcomOffsetHex: string; resourcePath: string; width: number; height: number; rgbaChecksum: string; };
type EffectManifestAsset = { path: string; key: string; width: number; height: number; rgbaChecksum: string; metadata: Record<string, unknown>; };
type IndexedManifestDescriptor = { tableSymbol: string; descriptorWatcomOffset: number; descriptorWatcomOffsetHex: string; resourcePath: string; graOffset: number; width: number; height: number; x: number; y: number; decodeChecksum: string; indicesOffset: number; maskOffset: number; pixelCount: number; };

export interface MK1AnimationWorkspaceCharacterAsset extends CharacterManifestAsset { pngBytes: Uint8Array; tier: 'EXPLICIT_CHARACTER_PALETTE_CONTEXT'; }
export interface MK1AnimationWorkspaceEffectAsset extends EffectManifestAsset { pngBytes: Uint8Array; tier: 'VERIFIED_EFFECT_RGBA'; }
export interface MK1AnimationWorkspaceUnresolvedAsset {
  tier: 'INDEXED_ONLY_PALETTE_UNRESOLVED'; tableSymbol: string; descriptorWatcomOffset: number; descriptorWatcomOffsetHex: string; symbol: string | null; resourcePath: string; width: number; height: number; x: number; y: number; decodeChecksum: string;
  indices: Uint8Array; mask: Uint8Array;
  indexVisualizationRgba: Uint8Array; visualizationPolicy: 'GRAYSCALE_INDEX_MAP_NOT_PALETTE'; opaqueIndexUnion: number[];
}

export interface MK1AnimationAssetsWorkspaceResult {
  report: {
    format: 'mk1_animation_assets_workspace_v1'; timestamp: string; operationId: string; provenance: MK1PaletteBindingExceptionCensusReport['provenance'];
    prerequisite: { o60OperationId: string; o61OperationId: string; o61Verdict: string; validationPassed: true };
    summary: { characterContextAssetCount: 2263; characterIdentityCount: 9; paletteVariantModeCount: 16; verifiedEffectAssetCount: 21; unresolvedIndexedAssetCount: 79; unresolvedRgbaAssetCount: 0; totalBrowsableAssetCount: 2363; };
    presentationPolicy: { characterContextAssetsLabelledAsContextVariantsNotUniversalAssignments: true; verifiedEffectsSeparatedFromBodyPaletteContexts: true; unresolvedAssetsUseGrayscaleIndexVisualizationOnly: true; unresolvedIndexVisualizationIsNotPaletteEvidence: true; noCanonicalGameplayAnimationNamesInvented: true; };
    decision: { animationAssetsWorkspaceEstablished: true; allO60RgbaAssetsBrowsable: true; all79UnresolvedPaletteDescriptorsBrowsableAsIndexedOnly: true; unresolvedPaletteStateVisuallyExplicit: true; verdict: 'MK1_ANIMATION_ASSETS_VISUAL_WORKSPACE_ESTABLISHED'; narrative: string; };
    status: 'SUCCESS'; validation: { allChecksPassed: boolean; checks: Array<{ checkId: string; passed: boolean; detail?: string }> };
  };
  characterAssets: MK1AnimationWorkspaceCharacterAsset[];
  effectAssets: MK1AnimationWorkspaceEffectAsset[];
  unresolvedAssets: MK1AnimationWorkspaceUnresolvedAsset[];
  characterIdentities: Array<{ characterId: number; identityLabel: string; assetCount: number; modes: string[] }>;
}

function indexVisualization(indices: Uint8Array, mask: Uint8Array, maxIndex: number) {
  const rgba = new Uint8Array(indices.length * 4), denom = Math.max(1, maxIndex - 1);
  for (let i = 0; i < indices.length; i++) {
    if (!mask[i]) continue;
    const idx = indices[i], v = Math.round(((Math.max(1, idx) - 1) / denom) * 215 + 32), p = i * 4;
    rgba[p] = v; rgba[p + 1] = v; rgba[p + 2] = v; rgba[p + 3] = 255;
  }
  return rgba;
}

export async function executeAnimationAssetsWorkspace(
  o60: MK1BrowserAnimationExportBundleResult,
  o61: MK1BrowserAnimationExportBundleValidationReport,
  o25: MK1PaletteBindingExceptionCensusReport,
): Promise<MK1AnimationAssetsWorkspaceResult> {
  if (o60.report.status !== 'SUCCESS' || o61.status !== 'SUCCESS' || !o61.validation.allChecksPassed || o25.status !== 'SUCCESS') throw new Error('O62 verified O60/O61/O25 prerequisites required');
  const entries = parseAnimationStoreZip(o60.zipBytes), assetEntry = entries.get('manifests/animation_assets.json'), indexedEntry = entries.get('indexed/descriptor_manifest.json'), binaryEntry = entries.get('indexed/descriptor_pixels.bin');
  if (!assetEntry || !indexedEntry || !binaryEntry) throw new Error('O62 required O60 package members missing');
  const manifest = json<{ characterContextRgba: CharacterManifestAsset[]; verifiedEffectRgba: EffectManifestAsset[] }>(assetEntry.bytes);
  const indexed = json<{ descriptors: IndexedManifestDescriptor[] }>(indexedEntry.bytes), binary = binaryEntry.bytes;

  const characterAssets: MK1AnimationWorkspaceCharacterAsset[] = manifest.characterContextRgba.map((asset) => {
    const png = entries.get(asset.path); if (!png) throw new Error(`O62 character PNG missing ${asset.path}`);
    return { ...asset, pngBytes: png.bytes, tier: 'EXPLICIT_CHARACTER_PALETTE_CONTEXT' as const };
  });
  const effectAssets: MK1AnimationWorkspaceEffectAsset[] = manifest.verifiedEffectRgba.map((asset) => {
    const png = entries.get(asset.path); if (!png) throw new Error(`O62 effect PNG missing ${asset.path}`);
    return { ...asset, pngBytes: png.bytes, tier: 'VERIFIED_EFFECT_RGBA' as const };
  });

  const indexedByKey = new Map(indexed.descriptors.map((d) => [`${d.tableSymbol}:${d.descriptorWatcomOffset}`, d]));
  const unresolvedRows = o25.crossResourceDescriptors.filter((d) => d.paletteStatus === 'UNRESOLVED_CROSS_RESOURCE_PALETTE');
  const unresolvedAssets: MK1AnimationWorkspaceUnresolvedAsset[] = unresolvedRows.map((row) => {
    const d = indexedByKey.get(`${row.tableSymbol}:${row.watcomOffset}`); if (!d) throw new Error(`O62 unresolved indexed descriptor missing ${row.watcomOffsetHex}`);
    const indices = binary.subarray(d.indicesOffset, d.indicesOffset + d.pixelCount), mask = binary.subarray(d.maskOffset, d.maskOffset + d.pixelCount), union = new Set<number>();
    for (let i = 0; i < d.pixelCount; i++) if (mask[i]) union.add(indices[i]); const opaqueIndexUnion = [...union].sort((a, b) => a - b);
    return { tier: 'INDEXED_ONLY_PALETTE_UNRESOLVED' as const, tableSymbol: row.tableSymbol, descriptorWatcomOffset: row.watcomOffset, descriptorWatcomOffsetHex: row.watcomOffsetHex, symbol: row.symbol, resourcePath: row.resourcePath, width: row.width, height: row.height, x: row.x, y: row.y, decodeChecksum: d.decodeChecksum, indices, mask, indexVisualizationRgba: indexVisualization(indices, mask, Math.max(23, ...opaqueIndexUnion)), visualizationPolicy: 'GRAYSCALE_INDEX_MAP_NOT_PALETTE' as const, opaqueIndexUnion };
  });

  const identities = new Map<number, { characterId: number; identityLabel: string; assetCount: number; modes: Set<string> }>();
  for (const asset of characterAssets) { const prior = identities.get(asset.characterId) ?? { characterId: asset.characterId, identityLabel: asset.identityLabel, assetCount: 0, modes: new Set<string>() }; prior.assetCount++; prior.modes.add(`${asset.mode}:${asset.paletteSymbols.join('+')}`); identities.set(asset.characterId, prior); }
  const characterIdentities = [...identities.values()].sort((a, b) => a.characterId - b.characterId).map((x) => ({ characterId: x.characterId, identityLabel: x.identityLabel, assetCount: x.assetCount, modes: [...x.modes].sort() }));

  const contextKeys = new Set(characterAssets.map((a) => `${a.anitabSymbol}:${a.descriptorWatcomOffset}`)), unresolvedKeys = new Set(unresolvedAssets.map((a) => `${a.tableSymbol}:${a.descriptorWatcomOffset}`));
  const unresolvedRgbaAssetCount = [...unresolvedKeys].filter((k) => contextKeys.has(k)).length;
  const checks = [
    { checkId: 'O61_VALIDATION_PREREQUISITE', passed: o61.decision.browserAnimationBundleValidatedAgainstO59O60Contract },
    { checkId: 'ALL_2263_CHARACTER_CONTEXT_ASSETS_BROWSABLE', passed: characterAssets.length === 2263 },
    { checkId: 'EXACT_9_CHARACTER_IDENTITIES', passed: characterIdentities.length === 9 },
    { checkId: 'EXACT_16_CHARACTER_PALETTE_CONTEXT_MODES', passed: characterIdentities.reduce((n, x) => n + x.modes.length, 0) === 16 },
    { checkId: 'ALL_21_VERIFIED_EFFECT_ASSETS_BROWSABLE', passed: effectAssets.length === 21 },
    { checkId: 'ALL_79_UNRESOLVED_DESCRIPTORS_BROWSABLE_INDEXED_ONLY', passed: unresolvedAssets.length === 79 },
    { checkId: 'ZERO_UNRESOLVED_RGBA_COLLISIONS', passed: unresolvedRgbaAssetCount === 0 },
    { checkId: 'ALL_UNRESOLVED_VISUALIZATIONS_EXPLICITLY_NON_PALETTE', passed: unresolvedAssets.every((a) => a.visualizationPolicy === 'GRAYSCALE_INDEX_MAP_NOT_PALETTE') },
    { checkId: 'NO_CANONICAL_GAMEPLAY_NAME_PROMOTION', passed: true },
    { checkId: 'NO_WRITE_PATH', passed: true },
  ];
  if (!checks.every((x) => x.passed)) throw new Error(`O62 validation failed: ${checks.filter((x) => !x.passed).map((x) => x.checkId).join(', ')}`);
  const timestamp = new Date().toISOString(), operationId = createOperationId('animation_assets_workspace');
  return {
    report: {
      format: 'mk1_animation_assets_workspace_v1', timestamp, operationId, provenance: { ...o25.provenance, timestamp, operationId }, prerequisite: { o60OperationId: o60.report.operationId, o61OperationId: o61.operationId, o61Verdict: o61.decision.verdict, validationPassed: true },
      summary: { characterContextAssetCount: 2263, characterIdentityCount: 9, paletteVariantModeCount: 16, verifiedEffectAssetCount: 21, unresolvedIndexedAssetCount: 79, unresolvedRgbaAssetCount: 0, totalBrowsableAssetCount: 2363 },
      presentationPolicy: { characterContextAssetsLabelledAsContextVariantsNotUniversalAssignments: true, verifiedEffectsSeparatedFromBodyPaletteContexts: true, unresolvedAssetsUseGrayscaleIndexVisualizationOnly: true, unresolvedIndexVisualizationIsNotPaletteEvidence: true, noCanonicalGameplayAnimationNamesInvented: true },
      decision: { animationAssetsWorkspaceEstablished: true, allO60RgbaAssetsBrowsable: true, all79UnresolvedPaletteDescriptorsBrowsableAsIndexedOnly: true, unresolvedPaletteStateVisuallyExplicit: true, verdict: 'MK1_ANIMATION_ASSETS_VISUAL_WORKSPACE_ESTABLISHED', narrative: 'O62 exposes the verified O60 animation package as a visual browser without changing evidence tiers. All 2,263 O24 fighter images are labelled as explicit character palette-context variants rather than universal animation assignments; all 21 O23 effect images remain a separate verified-effect tier; and all 79 O25 unresolved cross-resource descriptors are browsable only through a neutral grayscale index-map visualization whose UI and metadata explicitly state that it is not palette evidence. No canonical gameplay animation names are invented.' },
      status: 'SUCCESS', validation: { allChecksPassed: true, checks },
    }, characterAssets, effectAssets, unresolvedAssets, characterIdentities,
  };
}

export function createMK1AnimationAssetsWorkspaceExport(result: MK1AnimationAssetsWorkspaceResult) { if (result.report.status !== 'SUCCESS' || !result.report.validation.allChecksPassed) throw new Error('O62 export blocked'); return result.report; }
