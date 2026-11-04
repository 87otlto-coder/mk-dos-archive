/** Independent validation of the O64 browser audio ZIP — Pass 1E.3O.64. */
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1AudioMusicResourceGraphCensusReport } from './audioMusicResourceGraphCensus';
import { MK1AudioAssetManifestV1, MK1BrowserAudioExportBundleResult } from './browserAudioExportBundle';

const decoder = new TextDecoder();
function le16(b: Uint8Array, o: number) { return b[o] | (b[o + 1] << 8); }
function le32(b: Uint8Array, o: number) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }
function crc32(bytes: Uint8Array) { let c = 0xffffffff; for (const x of bytes) { c ^= x; for (let i = 0; i < 8; i++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0); } return (c ^ 0xffffffff) >>> 0; }
function norm(path: string) { return path.replace(/\\/g, '/'); }
function stable(x: unknown) { return JSON.stringify(x); }

export interface MK1ParsedAudioStoreZipEntry { name: string; bytes: Uint8Array; crc32: number; }
export function parseAudioStoreZip(bytes: Uint8Array): Map<string, MK1ParsedAudioStoreZipEntry> {
  const out = new Map<string, MK1ParsedAudioStoreZipEntry>(); let o = 0;
  while (o + 4 <= bytes.length && le32(bytes, o) === 0x04034b50) {
    const method = le16(bytes, o + 8), crc = le32(bytes, o + 14), size = le32(bytes, o + 18), nameLen = le16(bytes, o + 26), extraLen = le16(bytes, o + 28);
    if (method !== 0) throw new Error('O64 audio ZIP entry not STORE');
    const name = decoder.decode(bytes.subarray(o + 30, o + 30 + nameLen)), start = o + 30 + nameLen + extraLen, data = bytes.slice(start, start + size);
    if (data.length !== size || crc32(data) !== crc) throw new Error(`O64 audio ZIP CRC/size mismatch ${name}`);
    if (out.has(name)) throw new Error(`O64 duplicate audio ZIP entry ${name}`);
    out.set(name, { name, bytes: data, crc32: crc }); o = start + size;
  }
  return out;
}
function json<T>(b: Uint8Array): T { return JSON.parse(decoder.decode(b)) as T; }

export interface MK1BrowserAudioExportBundleValidationReport {
  format: 'mk1_browser_audio_export_bundle_validation_v1'; timestamp: string; operationId: string;
  provenance: MK1AudioMusicResourceGraphCensusReport['provenance'];
  prerequisite: { o64BundleOperationId: string; o64BundleVerdict: string; o63OperationId: string };
  summary: { zipEntryCount: 249; wavEntriesValidated: 244; wavEntriesByteExactToAuthenticSource: 244; unresolvedRawEntriesValidated: 1; jsonEntriesValidated: 3; readmeValidated: true; unexpectedEntryCount: 0; };
  decision: { browserAudioBundleValidatedAgainstAuthenticSourceAndO63: true; all244WavsByteExact: true; samplesDatByteExactButSemanticallyUnresolved: true; metadataBoundariesPreserved: true; verdict: 'MK1_BROWSER_AUDIO_EXPORT_BUNDLE_VALIDATED'; narrative: string };
  status: 'SUCCESS'; validation: { allChecksPassed: boolean; checks: Array<{ checkId: string; passed: boolean; detail?: string }> };
}

export async function executeBrowserAudioExportBundleValidation(source: DirectorySource, o64: MK1BrowserAudioExportBundleResult, o63: MK1AudioMusicResourceGraphCensusReport): Promise<MK1BrowserAudioExportBundleValidationReport> {
  if (source.isSynthetic !== false || o64.report.status !== 'SUCCESS' || o63.status !== 'SUCCESS' || !o64.report.validation.allChecksPassed || !o63.validation.allChecksPassed) throw new Error('O64 audio validation requires authentic source and verified O63/O64 package');
  const entries = parseAudioStoreZip(o64.zipBytes), sourceEntries = await source.listRecursive(), expected = new Set<string>();
  const byPath = new Map(sourceEntries.map((e) => [norm(e.path).toUpperCase(), e] as const));
  let wavValidated = 0, wavExact = 0;
  for (const r of o63.wavResources) {
    const packagePath = `audio/wav/${norm(r.path)}`; expected.add(packagePath);
    const z = entries.get(packagePath), src = byPath.get(norm(r.path).toUpperCase()); if (!z || !src) throw new Error(`O64 validation WAV missing ${r.path}`);
    const raw = await source.readSlice(src.path, 0, src.size), zSha = await sha256Bytes(z.bytes), rawSha = await sha256Bytes(raw);
    if (z.bytes.length !== r.byteLength || zSha !== r.sha256 || rawSha !== r.sha256) throw new Error(`O64 validation WAV hash mismatch ${r.path}`);
    wavValidated++; if (z.bytes.length === raw.length && zSha === rawSha) wavExact++;
  }
  expected.add('unresolved/SAMPLES.DAT');
  const samples = entries.get('unresolved/SAMPLES.DAT'), samplesSrc = byPath.get(norm(o63.opaqueSamplesDat.path).toUpperCase());
  if (!samples || !samplesSrc) throw new Error('O64 validation SAMPLES.DAT missing');
  const samplesRaw = await source.readSlice(samplesSrc.path, 0, samplesSrc.size);
  if (await sha256Bytes(samples.bytes) !== o63.opaqueSamplesDat.sha256 || await sha256Bytes(samplesRaw) !== o63.opaqueSamplesDat.sha256) throw new Error('O64 validation SAMPLES.DAT mismatch');

  const assetName = 'manifests/audio_assets.json', packageName = 'manifests/package_manifest.json', reportName = 'reports/o63_audio_music_resource_graph_census.json', readmeName = 'README.md';
  for (const x of [assetName, packageName, reportName, readmeName]) expected.add(x);
  const assetEntry = entries.get(assetName), packageEntry = entries.get(packageName), reportEntry = entries.get(reportName), readmeEntry = entries.get(readmeName);
  if (!assetEntry || !packageEntry || !reportEntry || !readmeEntry) throw new Error('O64 validation metadata entry missing');
  const assetManifest = json<MK1AudioAssetManifestV1>(assetEntry.bytes), packageManifest = json<Record<string, unknown>>(packageEntry.bytes), embeddedO63 = json<MK1AudioMusicResourceGraphCensusReport>(reportEntry.bytes);
  const manifestAssetsExact = assetManifest.assets.length === 244 && assetManifest.soundRecords.length === 533 && assetManifest.assets.every((a) => {
    const r = o63.wavResources.find((x) => norm(x.path).toUpperCase() === norm(a.sourcePath).toUpperCase()); return !!r && a.sha256 === r.sha256 && a.byteLength === r.byteLength && a.soundCode === r.soundCode && a.playbackPolicy === r.playbackPolicy && a.semanticNameStatus === r.semanticNameStatus;
  });
  const o63EmbeddedExact = stable(embeddedO63) === stable(o63);
  const packageFieldsOk = (packageManifest as any).format === 'mk1_browser_audio_export_package_manifest_v1' && (packageManifest as any).entries?.total === 249 && (packageManifest as any).boundaries?.gameplayEventNamesEstablished === false;
  const readmeOk = decoder.decode(readmeEntry.bytes).startsWith('# MK1 browser audio export package — O64') && decoder.decode(readmeEntry.bytes).includes('SAMPLES.DAT') && decoder.decode(readmeEntry.bytes).includes('preservation, not a claim');
  const unexpected = [...entries.keys()].filter((k) => !expected.has(k)), missing = [...expected].filter((k) => !entries.has(k));
  const checks = [
    { checkId: 'EXACT_EXPECTED_ENTRY_SET', passed: entries.size === 249 && unexpected.length === 0 && missing.length === 0, detail: `entries=${entries.size};unexpected=${unexpected.length};missing=${missing.length}` },
    { checkId: 'ALL_244_WAV_ENTRIES_VALIDATE', passed: wavValidated === 244 },
    { checkId: 'ALL_244_WAV_ENTRIES_BYTE_EXACT_TO_AUTHENTIC_SOURCE', passed: wavExact === 244 },
    { checkId: 'SAMPLES_DAT_BYTE_EXACT_TO_AUTHENTIC_SOURCE', passed: samples.bytes.length === samplesRaw.length && await sha256Bytes(samples.bytes) === await sha256Bytes(samplesRaw) },
    { checkId: 'AUDIO_ASSET_MANIFEST_MATCHES_O63', passed: manifestAssetsExact },
    { checkId: 'EMBEDDED_O63_REPORT_EXACT', passed: o63EmbeddedExact },
    { checkId: 'PACKAGE_MANIFEST_BOUNDARIES_PRESERVED', passed: packageFieldsOk && assetManifest.boundaries.gameplayEventNamesEstablished === false && assetManifest.boundaries.samplesDatRoleEstablished === false && assetManifest.boundaries.midiSequenceRuntimeRelationshipEstablished === false && assetManifest.boundaries.wavBytesTranscoded === false },
    { checkId: 'README_EXPLICITLY_PRESERVES_UNRESOLVED_BOUNDARIES', passed: readmeOk },
    { checkId: 'NO_UNEXPECTED_ENTRIES', passed: unexpected.length === 0 },
  ];
  if (!checks.every((c) => c.passed)) throw new Error(`O64 audio bundle validation failed: ${checks.filter((c) => !c.passed).map((c) => c.checkId).join(', ')}`);
  const timestamp = new Date().toISOString(), operationId = createOperationId('browser_audio_export_bundle_validation');
  return {
    format: 'mk1_browser_audio_export_bundle_validation_v1', timestamp, operationId, provenance: { ...o63.provenance, timestamp, operationId }, prerequisite: { o64BundleOperationId: o64.report.operationId, o64BundleVerdict: o64.report.decision.verdict, o63OperationId: o63.operationId },
    summary: { zipEntryCount: 249, wavEntriesValidated: 244, wavEntriesByteExactToAuthenticSource: 244, unresolvedRawEntriesValidated: 1, jsonEntriesValidated: 3, readmeValidated: true, unexpectedEntryCount: 0 },
    decision: { browserAudioBundleValidatedAgainstAuthenticSourceAndO63: true, all244WavsByteExact: true, samplesDatByteExactButSemanticallyUnresolved: true, metadataBoundariesPreserved: true, verdict: 'MK1_BROWSER_AUDIO_EXPORT_BUNDLE_VALIDATED', narrative: 'O64 independently parses the actual browser STORE ZIP, validates every local-entry CRC, compares all 244 packaged WAV payloads byte-for-byte with the authentic installation and O63 hashes, compares raw SAMPLES.DAT byte-for-byte while retaining UNKNOWN semantics, and reconciles the embedded O63/product manifests without promoting gameplay names or MIDI/SAMPLES.DAT relationships.' },
    status: 'SUCCESS', validation: { allChecksPassed: true, checks },
  };
}

export function createMK1BrowserAudioExportBundleValidationExport(report: MK1BrowserAudioExportBundleValidationReport) {
  if (report.status !== 'SUCCESS' || !report.validation.allChecksPassed) throw new Error('O64 audio bundle validation export blocked'); return report;
}
