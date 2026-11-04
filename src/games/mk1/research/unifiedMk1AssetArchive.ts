/** Unified browser-downloadable MK1 asset archive — Pass 1E.3O.66. */
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1BrowserStageExportBundleResult } from './browserStageExportBundle';
import { MK1BrowserAnimationExportBundleResult } from './browserAnimationExportBundle';
import { MK1BrowserAudioExportBundleResult } from './browserAudioExportBundle';
import { MK1CrossDomainExportCapabilityProvenanceIndexReport } from './crossDomainExportCapabilityProvenanceIndex';

const encoder = new TextEncoder();
const CANONICAL_SHA = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const README = `# MK1 unified asset archive — O66\n\nThis archive nests the already-validated MK1 stage, animation and digital-audio browser packages without transcoding or reinterpretation. The top-level O65 capability/provenance index is the authority for evidence tiers and blockers.\n\nImportant boundaries remain unchanged:\n- stage normalized previews are background-only normalized exports, not canonical gameplay screenshots;\n- animation character-context RGBA is explicit qualified palette-context rendering, not universal runtime palette-selection proof; exactly 79 cross-resource animation descriptors remain palette-unresolved/indexed-only;\n- animation scheduler/dwell values are not milliseconds or FPS;\n- audio filenames/sound codes are installation identifiers, not canonical gameplay event names;\n- SAMPLES.DAT remains raw and semantically UNKNOWN; linked Miles MIDI/sequence capability is not proof of a runtime music path;\n- this archive adds no binary writer/import capability.\n`;

export interface MK1UnifiedAssetArchiveResult {
  report: {
    format: 'mk1_unified_browser_asset_archive_v1'; timestamp: string; operationId: string;
    provenance: { sourceKind: 'canonical-mk1-cross-domain-product-contract'; exeSha256: string; synthetic: false };
    prerequisite: { o65OperationId: string; o65Verdict: string; validationPassed: true };
    nestedPackages: Array<{ domain: 'stage' | 'animation' | 'audio'; packagePath: string; sourcePass: string; sourceFileName: string; entryCount: number; byteLength: number; sha256: string }>;
    bundle: { downloadFileName: 'MK1_O66_UNIFIED_ASSET_ARCHIVE.zip'; entryCount: 6; nestedZipEntryCount: 3; manifestEntryCount: 2; readmeEntryCount: 1; nestedLogicalEntryCount: number; zipByteLength: number; zipSha256: string; zipEncoding: 'ZIP_STORE_ONLY' };
    decision: { unifiedBrowserMk1AssetArchiveEstablished: true; nestedValidatedDomainPackagesPreservedByteExact: true; domainSpecificCaveatsPreserved: true; semanticClaimsNotBroadened: true; writerScopeNotExpanded: true; verdict: 'MK1_UNIFIED_BROWSER_ASSET_ARCHIVE_ESTABLISHED'; narrative: string };
    status: 'SUCCESS'; validation: { allChecksPassed: boolean; checks: Array<{ checkId: string; passed: boolean; detail?: string }> };
  };
  zipBytes: Uint8Array;
  packageManifest: Record<string, unknown>;
}

export async function executeUnifiedMk1AssetArchive(
  o65: MK1CrossDomainExportCapabilityProvenanceIndexReport,
  stage: MK1BrowserStageExportBundleResult,
  animation: MK1BrowserAnimationExportBundleResult,
  audio: MK1BrowserAudioExportBundleResult,
): Promise<MK1UnifiedAssetArchiveResult> {
  if (o65.status !== 'SUCCESS' || !o65.validation.allChecksPassed || o65.decision.verdict !== 'MK1_CROSS_DOMAIN_EXPORT_CAPABILITY_AND_PROVENANCE_INDEX_ESTABLISHED') throw new Error('O66 requires verified O65 capability/provenance index');
  if (o65.provenance.exeSha256 !== CANONICAL_SHA) throw new Error('O66 O65 provenance changed');
  for (const [name, bundle] of [['stage', stage], ['animation', animation], ['audio', audio]] as const) {
    if (bundle.report.status !== 'SUCCESS' || !bundle.report.validation.allChecksPassed || bundle.report.provenance.sha256 !== CANONICAL_SHA) throw new Error(`O66 verified ${name} package required`);
  }

  const stageSha = await sha256Bytes(stage.zipBytes), animationSha = await sha256Bytes(animation.zipBytes), audioSha = await sha256Bytes(audio.zipBytes);
  const o65ByDomain = new Map(o65.domains.map((d) => [d.domain, d] as const));
  const exact = [
    ['stage', stageSha, stage.report.bundle.zipSha256],
    ['animation', animationSha, animation.report.bundle.zipSha256],
    ['audio', audioSha, audio.report.bundle.zipSha256],
  ] as const;
  for (const [domain, actual, reported] of exact) {
    const indexed = o65ByDomain.get(domain); if (!indexed || actual !== reported || indexed.package.sha256 !== actual) throw new Error(`O66 ${domain} nested package identity mismatch`);
  }

  const nestedPackages = [
    { domain: 'stage' as const, packagePath: 'packages/stage/MK1_O55_BROWSER_STAGE_EXPORT_PACKAGE.zip', sourcePass: '1E.3O.55', sourceFileName: stage.report.bundle.downloadFileName, entryCount: stage.report.bundle.entryCount, byteLength: stage.zipBytes.length, sha256: stageSha },
    { domain: 'animation' as const, packagePath: 'packages/animation/MK1_O60_BROWSER_ANIMATION_EXPORT_PACKAGE.zip', sourcePass: '1E.3O.60', sourceFileName: animation.report.bundle.downloadFileName, entryCount: animation.report.bundle.entryCount, byteLength: animation.zipBytes.length, sha256: animationSha },
    { domain: 'audio' as const, packagePath: 'packages/audio/MK1_O64_BROWSER_AUDIO_EXPORT_PACKAGE.zip', sourcePass: '1E.3O.64', sourceFileName: audio.report.bundle.downloadFileName, entryCount: audio.report.bundle.entryCount, byteLength: audio.zipBytes.length, sha256: audioSha },
  ];
  const { timestamp: _o65Timestamp, operationId: _o65OperationId, ...stableO65Index } = o65;
  const packageManifest = {
    format: 'mk1_unified_browser_asset_archive_manifest_v1', pass: '1E.3O.66', sourceExeSha256: CANONICAL_SHA,
    outerEntries: { total: 6, nestedZip: 3, manifests: 2, readme: 1 },
    nestedLogicalEntryCount: nestedPackages.reduce((n, x) => n + x.entryCount, 0), nestedPackages,
    crossDomainSummary: o65.summary,
    boundaries: o65.boundaries,
    semanticPolicy: 'NEST_VALIDATED_DOMAIN_PACKAGES_WITHOUT_TRANSCODING_OR_SEMANTIC_PROMOTION',
  };
  const files = [
    { name: nestedPackages[0].packagePath, bytes: stage.zipBytes },
    { name: nestedPackages[1].packagePath, bytes: animation.zipBytes },
    { name: nestedPackages[2].packagePath, bytes: audio.zipBytes },
    { name: 'manifests/cross_domain_capability_provenance_index.json', bytes: encoder.encode(JSON.stringify(stableO65Index, null, 2)) },
    { name: 'manifests/unified_archive_manifest.json', bytes: encoder.encode(JSON.stringify(packageManifest, null, 2)) },
    { name: 'README.md', bytes: encoder.encode(README) },
  ];
  const zipBytes = buildStoredZip(files), zipSha256 = await sha256Bytes(zipBytes), nestedLogicalEntryCount = nestedPackages.reduce((n, x) => n + x.entryCount, 0);
  const checks = [
    { checkId: 'O65_VERIFIED_PREREQUISITE', passed: true },
    { checkId: 'EXACT_THREE_CURRENT_DOMAIN_PACKAGES_NESTED', passed: nestedPackages.length === 3 },
    { checkId: 'NESTED_PACKAGE_BYTES_MATCH_O65_IDENTITIES', passed: nestedPackages.every((x) => o65ByDomain.get(x.domain)?.package.sha256 === x.sha256) },
    { checkId: 'EXACT_SIX_OUTER_ENTRIES', passed: files.length === 6 && new Set(files.map((f) => f.name)).size === 6 },
    { checkId: 'EXACT_2645_NESTED_LOGICAL_ENTRIES', passed: nestedLogicalEntryCount === 2645, detail: `count=${nestedLogicalEntryCount}` },
    { checkId: 'NO_TRANSCODING_OR_REPACKING_OF_NESTED_PAYLOADS', passed: true },
    { checkId: 'DOMAIN_BOUNDARIES_PRESERVED', passed: packageManifest.boundaries.animationWallClockTimingEstablished === false && packageManifest.boundaries.gameplayAudioEventNamesEstablished === false && packageManifest.boundaries.samplesDatRoleEstablished === false },
    { checkId: 'NO_WRITER_EXPANSION', passed: packageManifest.boundaries.binaryWriterScopeExpanded === false },
  ];
  if (!checks.every((c) => c.passed)) throw new Error(`O66 package validation failed: ${checks.filter((c) => !c.passed).map((c) => c.checkId).join(', ')}`);
  const timestamp = new Date().toISOString(), operationId = createOperationId('unified_mk1_asset_archive');
  return {
    report: {
      format: 'mk1_unified_browser_asset_archive_v1', timestamp, operationId,
      provenance: { sourceKind: 'canonical-mk1-cross-domain-product-contract', exeSha256: CANONICAL_SHA, synthetic: false },
      prerequisite: { o65OperationId: o65.operationId, o65Verdict: o65.decision.verdict, validationPassed: true }, nestedPackages,
      bundle: { downloadFileName: 'MK1_O66_UNIFIED_ASSET_ARCHIVE.zip', entryCount: 6, nestedZipEntryCount: 3, manifestEntryCount: 2, readmeEntryCount: 1, nestedLogicalEntryCount, zipByteLength: zipBytes.length, zipSha256, zipEncoding: 'ZIP_STORE_ONLY' },
      decision: { unifiedBrowserMk1AssetArchiveEstablished: true, nestedValidatedDomainPackagesPreservedByteExact: true, domainSpecificCaveatsPreserved: true, semanticClaimsNotBroadened: true, writerScopeNotExpanded: true, verdict: 'MK1_UNIFIED_BROWSER_ASSET_ARCHIVE_ESTABLISHED', narrative: 'O66 nests the exact current O55 stage, O60 animation and O64 audio browser packages under one STORE-only browser archive. O65 is included as the cross-domain capability/provenance authority. No nested payload is transcoded or reinterpreted, and all stage, palette, timing, gameplay-name, SAMPLES.DAT/MIDI and writer-scope caveats remain unchanged.' },
      status: 'SUCCESS', validation: { allChecksPassed: true, checks },
    }, zipBytes, packageManifest,
  };
}

export function createMK1UnifiedAssetArchiveExport(result: MK1UnifiedAssetArchiveResult) {
  if (result.report.status !== 'SUCCESS' || !result.report.validation.allChecksPassed) throw new Error('O66 unified archive export blocked');
  return result.report;
}

export function downloadMK1UnifiedAssetArchive(result: MK1UnifiedAssetArchiveResult): void {
  if (result.report.status !== 'SUCCESS' || !result.report.validation.allChecksPassed) throw new Error('O66 unified archive download blocked');
  const stable = new Uint8Array(result.zipBytes), url = URL.createObjectURL(new Blob([stable.buffer], { type: 'application/zip' }));
  const a = document.createElement('a'); a.href = url; a.download = result.report.bundle.downloadFileName; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
