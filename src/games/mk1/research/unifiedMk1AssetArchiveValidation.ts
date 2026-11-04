/** Independent validation of the O66 unified MK1 asset archive — Pass 1E.3O.66. */
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1BrowserStageExportBundleResult } from './browserStageExportBundle';
import { MK1BrowserAnimationExportBundleResult } from './browserAnimationExportBundle';
import { MK1BrowserAudioExportBundleResult } from './browserAudioExportBundle';
import { MK1CrossDomainExportCapabilityProvenanceIndexReport } from './crossDomainExportCapabilityProvenanceIndex';
import { MK1UnifiedAssetArchiveResult } from './unifiedMk1AssetArchive';

const decoder = new TextDecoder();
function le16(b: Uint8Array, o: number) { return b[o] | (b[o + 1] << 8); }
function le32(b: Uint8Array, o: number) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }
function crc32(bytes: Uint8Array) { let c = 0xffffffff; for (const x of bytes) { c ^= x; for (let i = 0; i < 8; i++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0); } return (c ^ 0xffffffff) >>> 0; }
function stable(x: unknown) { return JSON.stringify(x); }

export interface ParsedUnifiedStoreZipEntry { name: string; bytes: Uint8Array; crc32: number; }
export function parseUnifiedStoreZip(bytes: Uint8Array): Map<string, ParsedUnifiedStoreZipEntry> {
  const out = new Map<string, ParsedUnifiedStoreZipEntry>(); let o = 0;
  while (o + 4 <= bytes.length && le32(bytes, o) === 0x04034b50) {
    const method = le16(bytes, o + 8), crc = le32(bytes, o + 14), size = le32(bytes, o + 18), nameLen = le16(bytes, o + 26), extraLen = le16(bytes, o + 28);
    if (method !== 0) throw new Error('O66 unified ZIP entry not STORE');
    const name = decoder.decode(bytes.subarray(o + 30, o + 30 + nameLen)), start = o + 30 + nameLen + extraLen, data = bytes.slice(start, start + size);
    if (data.length !== size || crc32(data) !== crc) throw new Error(`O66 unified ZIP CRC/size mismatch ${name}`);
    if (out.has(name)) throw new Error(`O66 duplicate unified ZIP entry ${name}`);
    out.set(name, { name, bytes: data, crc32: crc }); o = start + size;
  }
  return out;
}
function json<T>(bytes: Uint8Array): T { return JSON.parse(decoder.decode(bytes)) as T; }

export interface MK1UnifiedAssetArchiveValidationReport {
  format: 'mk1_unified_browser_asset_archive_validation_v1'; timestamp: string; operationId: string;
  provenance: MK1UnifiedAssetArchiveResult['report']['provenance'];
  prerequisite: { o66OperationId: string; o66Verdict: string; o65OperationId: string };
  summary: { outerEntryCount: 6; nestedPackageCount: 3; nestedLogicalEntryCount: 2645; stageNestedEntryCount: 101; animationNestedEntryCount: 2295; audioNestedEntryCount: 249; nestedPackageHashMatchCount: 3; embeddedO65StableExact: true; readmeBoundariesValidated: true; unexpectedEntryCount: 0 };
  decision: { unifiedArchiveValidatedAgainstExactNestedPackagesAndO65: true; allNestedPackageBytesPreserved: true; nestedZipCrcAndEntryCountsValidated: true; metadataBoundariesPreserved: true; verdict: 'MK1_UNIFIED_BROWSER_ASSET_ARCHIVE_VALIDATED'; narrative: string };
  status: 'SUCCESS'; validation: { allChecksPassed: boolean; checks: Array<{ checkId: string; passed: boolean; detail?: string }> };
}

export async function executeUnifiedMk1AssetArchiveValidation(
  o66: MK1UnifiedAssetArchiveResult,
  o65: MK1CrossDomainExportCapabilityProvenanceIndexReport,
  stage: MK1BrowserStageExportBundleResult,
  animation: MK1BrowserAnimationExportBundleResult,
  audio: MK1BrowserAudioExportBundleResult,
): Promise<MK1UnifiedAssetArchiveValidationReport> {
  if (o66.report.status !== 'SUCCESS' || !o66.report.validation.allChecksPassed || o65.status !== 'SUCCESS' || !o65.validation.allChecksPassed) throw new Error('O66 validation requires verified O65/O66');
  const entries = parseUnifiedStoreZip(o66.zipBytes);
  const expected = new Set([
    'packages/stage/MK1_O55_BROWSER_STAGE_EXPORT_PACKAGE.zip',
    'packages/animation/MK1_O60_BROWSER_ANIMATION_EXPORT_PACKAGE.zip',
    'packages/audio/MK1_O64_BROWSER_AUDIO_EXPORT_PACKAGE.zip',
    'manifests/cross_domain_capability_provenance_index.json',
    'manifests/unified_archive_manifest.json',
    'README.md',
  ]);
  const unexpected = [...entries.keys()].filter((x) => !expected.has(x)), missing = [...expected].filter((x) => !entries.has(x));
  if (unexpected.length || missing.length) throw new Error(`O66 validation entry-set mismatch unexpected=${unexpected.length} missing=${missing.length}`);

  const nested = [
    ['stage', 'packages/stage/MK1_O55_BROWSER_STAGE_EXPORT_PACKAGE.zip', stage.zipBytes, 101],
    ['animation', 'packages/animation/MK1_O60_BROWSER_ANIMATION_EXPORT_PACKAGE.zip', animation.zipBytes, 2295],
    ['audio', 'packages/audio/MK1_O64_BROWSER_AUDIO_EXPORT_PACKAGE.zip', audio.zipBytes, 249],
  ] as const;
  let hashMatches = 0, logicalEntries = 0;
  for (const [domain, path, original, expectedEntries] of nested) {
    const e = entries.get(path); if (!e) throw new Error(`O66 validation missing nested ${domain}`);
    const embeddedSha = await sha256Bytes(e.bytes), originalSha = await sha256Bytes(original);
    if (embeddedSha !== originalSha || e.bytes.length !== original.length) throw new Error(`O66 validation nested package bytes changed ${domain}`);
    const parsed = parseUnifiedStoreZip(e.bytes); if (parsed.size !== expectedEntries) throw new Error(`O66 validation nested entry count ${domain}: ${parsed.size}`);
    logicalEntries += parsed.size; hashMatches++;
  }

  const o65Entry = entries.get('manifests/cross_domain_capability_provenance_index.json'), manifestEntry = entries.get('manifests/unified_archive_manifest.json'), readmeEntry = entries.get('README.md');
  if (!o65Entry || !manifestEntry || !readmeEntry) throw new Error('O66 validation metadata missing');
  const embeddedO65 = json<any>(o65Entry.bytes), manifest = json<any>(manifestEntry.bytes), readme = decoder.decode(readmeEntry.bytes);
  const { timestamp: _o65Timestamp, operationId: _o65OperationId, ...stableO65 } = o65;
  const o65Exact = stable(embeddedO65) === stable(stableO65);
  const manifestOk = manifest.format === 'mk1_unified_browser_asset_archive_manifest_v1' && manifest.outerEntries?.total === 6 && manifest.nestedLogicalEntryCount === 2645 && manifest.boundaries?.animationWallClockTimingEstablished === false && manifest.boundaries?.gameplayAudioEventNamesEstablished === false && manifest.boundaries?.samplesDatRoleEstablished === false && manifest.boundaries?.binaryWriterScopeExpanded === false;
  const readmeOk = readme.startsWith('# MK1 unified asset archive — O66') && readme.includes('79 cross-resource animation descriptors remain palette-unresolved') && readme.includes('SAMPLES.DAT remains raw and semantically UNKNOWN') && readme.includes('adds no binary writer/import capability');
  const checks = [
    { checkId: 'EXACT_SIX_EXPECTED_OUTER_ENTRIES', passed: entries.size === 6 && unexpected.length === 0 && missing.length === 0 },
    { checkId: 'ALL_THREE_NESTED_PACKAGES_BYTE_EXACT', passed: hashMatches === 3 },
    { checkId: 'NESTED_STAGE_ZIP_101_ENTRIES', passed: parseUnifiedStoreZip(entries.get(nested[0][1])!.bytes).size === 101 },
    { checkId: 'NESTED_ANIMATION_ZIP_2295_ENTRIES', passed: parseUnifiedStoreZip(entries.get(nested[1][1])!.bytes).size === 2295 },
    { checkId: 'NESTED_AUDIO_ZIP_249_ENTRIES', passed: parseUnifiedStoreZip(entries.get(nested[2][1])!.bytes).size === 249 },
    { checkId: 'EXACT_2645_NESTED_LOGICAL_ENTRIES', passed: logicalEntries === 2645 },
    { checkId: 'EMBEDDED_O65_REPORT_STABLE_EXACT', passed: o65Exact },
    { checkId: 'UNIFIED_MANIFEST_BOUNDARIES_PRESERVED', passed: manifestOk },
    { checkId: 'README_BOUNDARIES_PRESERVED', passed: readmeOk },
    { checkId: 'NO_UNEXPECTED_ENTRIES', passed: unexpected.length === 0 },
  ];
  if (!checks.every((c) => c.passed)) throw new Error(`O66 validation failed: ${checks.filter((c) => !c.passed).map((c) => c.checkId).join(', ')}`);
  const timestamp = new Date().toISOString(), operationId = createOperationId('unified_mk1_asset_archive_validation');
  return {
    format: 'mk1_unified_browser_asset_archive_validation_v1', timestamp, operationId, provenance: { ...o66.report.provenance }, prerequisite: { o66OperationId: o66.report.operationId, o66Verdict: o66.report.decision.verdict, o65OperationId: o65.operationId },
    summary: { outerEntryCount: 6, nestedPackageCount: 3, nestedLogicalEntryCount: 2645, stageNestedEntryCount: 101, animationNestedEntryCount: 2295, audioNestedEntryCount: 249, nestedPackageHashMatchCount: 3, embeddedO65StableExact: true, readmeBoundariesValidated: true, unexpectedEntryCount: 0 },
    decision: { unifiedArchiveValidatedAgainstExactNestedPackagesAndO65: true, allNestedPackageBytesPreserved: true, nestedZipCrcAndEntryCountsValidated: true, metadataBoundariesPreserved: true, verdict: 'MK1_UNIFIED_BROWSER_ASSET_ARCHIVE_VALIDATED', narrative: 'O66 independently parses the outer STORE archive, validates every outer entry CRC, compares all three nested package byte streams with the exact current O55/O60/O64 package bytes, reparses each nested STORE ZIP and confirms 101/2,295/249 logical entries, and verifies the embedded O65 index after excluding only its run timestamp/operation ID plus manifest/README boundaries. No nested asset is transcoded and no underlying semantic claim is strengthened.' },
    status: 'SUCCESS', validation: { allChecksPassed: true, checks },
  };
}

export function createMK1UnifiedAssetArchiveValidationExport(report: MK1UnifiedAssetArchiveValidationReport) {
  if (report.status !== 'SUCCESS' || !report.validation.allChecksPassed) throw new Error('O66 validation export blocked');
  return report;
}
