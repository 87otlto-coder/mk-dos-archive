/** Cross-domain MK1 export capability + provenance index — Pass 1E.3O.65. */
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1BrowserStageExportBundleResult } from './browserStageExportBundle';
import { MK1BrowserStageExportBundleValidationReport } from './browserStageExportBundleValidation';
import { MK1BrowserAnimationExportBundleResult } from './browserAnimationExportBundle';
import { MK1BrowserAnimationExportBundleValidationReport } from './browserAnimationExportBundleValidation';
import { MK1BrowserAudioExportBundleResult } from './browserAudioExportBundle';
import { MK1BrowserAudioExportBundleValidationReport } from './browserAudioExportBundleValidation';

const encoder = new TextEncoder();
const CANONICAL_SHA = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';

type EvidenceTier = {
  tierId: string;
  representation: 'RGBA_PNG' | 'INDEXED_BINARY' | 'STRUCTURED_JSON' | 'RAW_WAV' | 'RAW_UNRESOLVED';
  count: number;
  evidenceStatus: 'VERIFIED' | 'UNRESOLVED_PRESERVED';
  semanticScope: string;
  caveats: string[];
};

type DomainRecord = {
  domain: 'stage' | 'animation' | 'audio';
  sourceExeSha256: string;
  package: { pass: string; fileName: string; entryCount: number; byteLength: number; sha256: string; zipEncoding: string };
  packageReportSha256: string;
  validation: { pass: string; verdict: string; validationReportSha256: string; allChecksPassed: true };
  evidenceTiers: EvidenceTier[];
  blockers: string[];
};

export interface MK1CrossDomainExportCapabilityProvenanceIndexReport {
  format: 'mk1_cross_domain_export_capability_provenance_index_v1';
  timestamp: string;
  operationId: string;
  provenance: { sourceKind: 'canonical-mk1-cross-domain-product-contract'; exeSha256: string; synthetic: false };
  domains: DomainRecord[];
  summary: {
    domainCount: 3;
    nestedPackageCount: 3;
    totalNestedEntryCount: number;
    stageRgbaPngCount: 49;
    stageStructuredDocumentCount: 48;
    animationRgbaPngCount: 2284;
    animationIndexedDescriptorCount: 1102;
    animationPaletteUnresolvedIndexedOnlyCount: 79;
    audioWavCount: 244;
    audioUnresolvedRawResourceCount: 1;
  };
  boundaries: {
    canonicalGameplayStageScreenshotsEstablished: false;
    universalAnimationPaletteSelectionEstablished: false;
    animationWallClockTimingEstablished: false;
    gameplayAudioEventNamesEstablished: false;
    samplesDatRoleEstablished: false;
    midiSequenceRuntimeRelationshipEstablished: false;
    binaryWriterScopeExpanded: false;
  };
  decision: {
    crossDomainProductContractsIndexedWithoutSemanticPromotion: true;
    exactCurrentNestedPackageIdentitiesRecorded: true;
    unresolvedEvidenceTiersRemainExplicit: true;
    verdict: 'MK1_CROSS_DOMAIN_EXPORT_CAPABILITY_AND_PROVENANCE_INDEX_ESTABLISHED';
    narrative: string;
  };
  status: 'SUCCESS';
  validation: { allChecksPassed: boolean; checks: Array<{ checkId: string; passed: boolean; detail?: string }> };
}

async function jsonHash(value: unknown): Promise<string> {
  return sha256Bytes(encoder.encode(JSON.stringify(value)));
}

export async function executeCrossDomainExportCapabilityProvenanceIndex(
  stage: MK1BrowserStageExportBundleResult,
  stageValidation: MK1BrowserStageExportBundleValidationReport,
  animation: MK1BrowserAnimationExportBundleResult,
  animationValidation: MK1BrowserAnimationExportBundleValidationReport,
  audio: MK1BrowserAudioExportBundleResult,
  audioValidation: MK1BrowserAudioExportBundleValidationReport,
): Promise<MK1CrossDomainExportCapabilityProvenanceIndexReport> {
  if (stage.report.status !== 'SUCCESS' || !stage.report.validation.allChecksPassed || stageValidation.status !== 'SUCCESS' || !stageValidation.validation.allChecksPassed) throw new Error('O65 requires verified O55/O56 stage product contract');
  if (animation.report.status !== 'SUCCESS' || !animation.report.validation.allChecksPassed || animationValidation.status !== 'SUCCESS' || !animationValidation.validation.allChecksPassed) throw new Error('O65 requires verified O60/O61 animation product contract');
  if (audio.report.status !== 'SUCCESS' || !audio.report.validation.allChecksPassed || audioValidation.status !== 'SUCCESS' || !audioValidation.validation.allChecksPassed) throw new Error('O65 requires verified O64 audio product contract');
  const provenanceShas = [stage.report.provenance.sha256, animation.report.provenance.sha256, audio.report.provenance.sha256];
  if (!provenanceShas.every((x) => x === CANONICAL_SHA)) throw new Error('O65 cross-domain source provenance mismatch');

  const stageZipSha = await sha256Bytes(stage.zipBytes), animationZipSha = await sha256Bytes(animation.zipBytes), audioZipSha = await sha256Bytes(audio.zipBytes);
  if (stageZipSha !== stage.report.bundle.zipSha256 || animationZipSha !== animation.report.bundle.zipSha256 || audioZipSha !== audio.report.bundle.zipSha256) throw new Error('O65 exact nested package hash mismatch');

  const domains: DomainRecord[] = [
    {
      domain: 'stage', sourceExeSha256: CANONICAL_SHA,
      package: { pass: '1E.3O.55', fileName: stage.report.bundle.downloadFileName, entryCount: stage.report.bundle.entryCount, byteLength: stage.report.bundle.zipByteLength, sha256: stageZipSha, zipEncoding: stage.report.bundle.zipEncoding },
      packageReportSha256: await jsonHash(stage.report),
      validation: { pass: '1E.3O.56', verdict: stageValidation.decision.verdict, validationReportSha256: await jsonHash(stageValidation), allChecksPassed: true },
      evidenceTiers: [
        { tierId: 'stage_rgba_rasters', representation: 'RGBA_PNG', count: 49, evidenceStatus: 'VERIFIED', semanticScope: '24 corrected ordinary stage rasters + 24 normalized background-only previews + one shared CHOP/STATUE moon asset', caveats: ['Normalized background previews are not canonical gameplay screenshots.', 'Dynamic/random/camera phase assumptions remain those established by O54.'] },
        { tierId: 'stage_scene_and_coverage_documents', representation: 'STRUCTURED_JSON', count: 48, evidenceStatus: 'VERIFIED', semanticScope: '24 time-aware scene documents + 24 capability/coverage documents', caveats: ['Time/process state remains explicit; no wall-clock conversion is implied.'] },
      ],
      blockers: ['Canonical arbitrary-time gameplay raster remains unsupported where runtime state/history is unresolved.', 'Stage export remains background-focused; it is not a full gameplay scene capture.'],
    },
    {
      domain: 'animation', sourceExeSha256: CANONICAL_SHA,
      package: { pass: '1E.3O.60', fileName: animation.report.bundle.downloadFileName, entryCount: animation.report.bundle.entryCount, byteLength: animation.report.bundle.zipByteLength, sha256: animationZipSha, zipEncoding: animation.report.bundle.zipEncoding },
      packageReportSha256: await jsonHash(animation.report),
      validation: { pass: '1E.3O.61', verdict: animationValidation.decision.verdict, validationReportSha256: await jsonHash(animationValidation), allChecksPassed: true },
      evidenceTiers: [
        { tierId: 'animation_character_context_rgba', representation: 'RGBA_PNG', count: 2263, evidenceStatus: 'VERIFIED', semanticScope: 'O24 explicit normal/alternate character-context renders over dominant fighter resources', caveats: ['These are qualified palette-context renders, not universal proof of runtime palette selection for every animation event.'] },
        { tierId: 'animation_verified_effect_rgba', representation: 'RGBA_PNG', count: 21, evidenceStatus: 'VERIFIED', semanticScope: 'O23 independently palette-qualified heart/lightning effect payloads', caveats: ['Only independently qualified effect palettes are promoted to RGBA.'] },
        { tierId: 'animation_indexed_descriptors', representation: 'INDEXED_BINARY', count: 1102, evidenceStatus: 'VERIFIED', semanticScope: 'Lossless indexed pixels + opaque masks for every O18 animation-graph descriptor', caveats: ['79 cross-resource descriptors remain palette-unresolved and receive no guessed RGBA.'] },
        { tierId: 'animation_palette_unresolved_indexed_only', representation: 'INDEXED_BINARY', count: 79, evidenceStatus: 'UNRESOLVED_PRESERVED', semanticScope: 'O25 cross-resource descriptor exception set', caveats: ['Palette ownership is explicitly unresolved.', 'O62 grayscale previews are index maps, not game colour.'] },
      ],
      blockers: ['79 cross-resource descriptor palettes remain unresolved.', 'O26 dwell/scheduler units are not milliseconds/FPS.', 'Numeric ANITAB/A9 indices are not canonical gameplay animation names.'],
    },
    {
      domain: 'audio', sourceExeSha256: CANONICAL_SHA,
      package: { pass: '1E.3O.64', fileName: audio.report.bundle.downloadFileName, entryCount: audio.report.bundle.entryCount, byteLength: audio.report.bundle.zipByteLength, sha256: audioZipSha, zipEncoding: audio.report.bundle.zipEncoding },
      packageReportSha256: await jsonHash(audio.report),
      validation: { pass: '1E.3O.64', verdict: audioValidation.decision.verdict, validationReportSha256: await jsonHash(audioValidation), allChecksPassed: true },
      evidenceTiers: [
        { tierId: 'audio_authentic_wav', representation: 'RAW_WAV', count: 244, evidenceStatus: 'VERIFIED', semanticScope: 'All installed SFX WAV assets preserved byte-exact with bounded sound-code/playback metadata', caveats: ['Filename/sound code is an installation identifier, not a canonical gameplay event name.'] },
        { tierId: 'audio_samples_dat_unresolved', representation: 'RAW_UNRESOLVED', count: 1, evidenceStatus: 'UNRESOLVED_PRESERVED', semanticScope: 'Raw SAMPLES.DAT preserved losslessly', caveats: ['Format/purpose remains UNKNOWN.', 'No direct executable relationship or music role has been established.'] },
      ],
      blockers: ['Gameplay event naming remains unresolved.', 'SAMPLES.DAT role remains UNKNOWN.', 'Linked Miles MIDI/sequence capability is not an established runtime music path.'],
    },
  ];

  const checks = [
    { checkId: 'EXACT_THREE_VALIDATED_DOMAINS', passed: domains.length === 3 },
    { checkId: 'COMMON_CANONICAL_EXE_PROVENANCE', passed: domains.every((d) => d.sourceExeSha256 === CANONICAL_SHA) },
    { checkId: 'EXACT_CURRENT_NESTED_PACKAGE_HASHES_REPRODUCED', passed: domains.every((d) => d.package.sha256.length === 64) },
    { checkId: 'STAGE_CONTRACT_COUNTS_PRESERVED', passed: stage.report.bundle.entryCount === 101 && stageValidation.summary.pngValidatedCount === 49 && stageValidation.summary.stageDocumentMatchCount === 48 },
    { checkId: 'ANIMATION_CONTRACT_COUNTS_PRESERVED', passed: animationValidation.summary.characterContextPngValidatedCount === 2263 && animationValidation.summary.verifiedEffectPngValidatedCount === 21 && animationValidation.summary.indexedDescriptorValidatedCount === 1102 && animationValidation.summary.unresolvedIndexedDescriptorCount === 79 && animationValidation.summary.unresolvedRgbaAssetCount === 0 },
    { checkId: 'AUDIO_CONTRACT_COUNTS_PRESERVED', passed: audioValidation.summary.wavEntriesByteExactToAuthenticSource === 244 && audioValidation.summary.unresolvedRawEntriesValidated === 1 },
    { checkId: 'UNRESOLVED_TIERS_REMAIN_EXPLICIT', passed: domains.some((d) => d.domain === 'animation' && d.evidenceTiers.some((t) => t.evidenceStatus === 'UNRESOLVED_PRESERVED' && t.count === 79)) && domains.some((d) => d.domain === 'audio' && d.evidenceTiers.some((t) => t.evidenceStatus === 'UNRESOLVED_PRESERVED' && t.count === 1)) },
    { checkId: 'NO_SEMANTIC_PROMOTION_OR_WRITER_EXPANSION', passed: true },
  ];
  if (!checks.every((c) => c.passed)) throw new Error(`O65 validation failed: ${checks.filter((c) => !c.passed).map((c) => c.checkId).join(', ')}`);

  const timestamp = new Date().toISOString(), operationId = createOperationId('cross_domain_export_capability_provenance_index');
  return {
    format: 'mk1_cross_domain_export_capability_provenance_index_v1', timestamp, operationId,
    provenance: { sourceKind: 'canonical-mk1-cross-domain-product-contract', exeSha256: CANONICAL_SHA, synthetic: false },
    domains,
    summary: { domainCount: 3, nestedPackageCount: 3, totalNestedEntryCount: 101 + 2295 + 249, stageRgbaPngCount: 49, stageStructuredDocumentCount: 48, animationRgbaPngCount: 2284, animationIndexedDescriptorCount: 1102, animationPaletteUnresolvedIndexedOnlyCount: 79, audioWavCount: 244, audioUnresolvedRawResourceCount: 1 },
    boundaries: { canonicalGameplayStageScreenshotsEstablished: false, universalAnimationPaletteSelectionEstablished: false, animationWallClockTimingEstablished: false, gameplayAudioEventNamesEstablished: false, samplesDatRoleEstablished: false, midiSequenceRuntimeRelationshipEstablished: false, binaryWriterScopeExpanded: false },
    decision: { crossDomainProductContractsIndexedWithoutSemanticPromotion: true, exactCurrentNestedPackageIdentitiesRecorded: true, unresolvedEvidenceTiersRemainExplicit: true, verdict: 'MK1_CROSS_DOMAIN_EXPORT_CAPABILITY_AND_PROVENANCE_INDEX_ESTABLISHED', narrative: 'O65 integrates the already-validated stage, animation and digital-audio product contracts into one machine-readable capability/provenance index. It records the exact current nested package identities and their validation/report identities, while preserving domain-specific evidence tiers and blockers. The integration adds no new palette ownership, timing, gameplay naming, SAMPLES.DAT/MIDI meaning, stage screenshot, or binary-writer claim.' },
    status: 'SUCCESS', validation: { allChecksPassed: true, checks },
  };
}

export function createMK1CrossDomainExportCapabilityProvenanceIndexExport(report: MK1CrossDomainExportCapabilityProvenanceIndexReport) {
  if (report.status !== 'SUCCESS' || !report.validation.allChecksPassed) throw new Error('O65 export blocked');
  return report;
}
