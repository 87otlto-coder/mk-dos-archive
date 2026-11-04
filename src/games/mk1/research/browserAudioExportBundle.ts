/** Browser-downloadable MK1 audio export package — Pass 1E.3O.64. */
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1AudioMusicResourceGraphCensusReport } from './audioMusicResourceGraphCensus';

const CANONICAL_SHA = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const encoder = new TextEncoder();

const README = `# MK1 browser audio export package — O64\n\nThis package is lossless and evidence-tiered.\n\n- audio/wav preserves all 244 authentic installation SFX WAV files byte-for-byte.\n- manifests/audio_assets.json preserves O63 sound-code bindings and playback policy without inventing gameplay/event names.\n- unresolved/SAMPLES.DAT is preserved byte-for-byte because O63 did not qualify its format or executable relationship. Its presence here is preservation, not a claim that it is music or a runtime sample bank.\n- reports/o63_audio_music_resource_graph_census.json preserves the complete O63 evidence contract.\n\nThe linked Miles MIDI/sequence surface remains library capability only under O63's bounded evidence; this package does not manufacture a MIDI/music asset relationship. Support drivers are documented by O63 but are not duplicated as user-facing audio assets.\n`;

function norm(path: string) { return path.replace(/\\/g, '/'); }
function entry(entries: Awaited<ReturnType<DirectorySource['listRecursive']>>, wanted: string) {
  const u = norm(wanted).toUpperCase();
  const found = entries.find((x) => norm(x.path).toUpperCase() === u);
  if (!found) throw new Error(`O64 resource missing ${wanted}`);
  return found;
}

export interface MK1AudioAssetManifestV1 {
  format: 'mk1_audio_asset_manifest_v1';
  sourceExeSha256: string;
  wavAssetCount: 244;
  assets: Array<{
    packagePath: string; sourcePath: string; fileName: string; byteLength: number; sha256: string;
    audioFormat: number; channels: number; sampleRate: number; byteRate: number; blockAlign: number; bitsPerSample: number; dataByteLength: number; durationMillisecondsRounded: number;
    soundCode: number | null; soundCodeHex: string | null; tableBinding: 'RECORD_BOUND' | 'PATH_POOL_ONLY_UNBOUND'; playbackPolicy: string;
    semanticNameStatus: 'CANONICAL_INSTALLATION_IDENTIFIER_ONLY_GAMEPLAY_MEANING_UNRESOLVED';
  }>;
  soundRecords: MK1AudioMusicResourceGraphCensusReport['soundRecords'];
  unresolved: { samplesDat: { packagePath: 'unresolved/SAMPLES.DAT'; sourcePath: string; byteLength: number; sha256: string; role: 'UNKNOWN'; executableRelationship: 'UNKNOWN_NO_DIRECT_JOIN_QUALIFIED' } };
  boundaries: {
    gameplayEventNamesEstablished: false;
    samplesDatRoleEstablished: false;
    midiSequenceRuntimeRelationshipEstablished: false;
    wavBytesTranscoded: false;
  };
}

export interface MK1BrowserAudioExportBundleResult {
  report: {
    format: 'mk1_browser_audio_export_bundle_v1'; timestamp: string; operationId: string;
    provenance: MK1AudioMusicResourceGraphCensusReport['provenance'];
    prerequisite: { o63OperationId: string; o63Verdict: string; validationPassed: true };
    bundle: {
      downloadFileName: 'MK1_O64_BROWSER_AUDIO_EXPORT_PACKAGE.zip';
      entryCount: 249; wavEntryCount: 244; unresolvedRawEntryCount: 1; jsonEntryCount: 3; readmeEntryCount: 1;
      zipByteLength: number; zipSha256: string; zipEncoding: 'ZIP_STORE_ONLY';
    };
    summary: { wavAssetCount: 244; boundWavAssetCount: 243; pathPoolOnlyWavCount: 1; unresolvedRawResourceCount: 1; soundRecordCount: 533; };
    decision: {
      browserAudioPackageEstablished: true; all244AuthenticWavsPreservedByteExact: true; soundCodeAndPlaybackMetadataPreserved: true;
      samplesDatPreservedWithoutSemanticPromotion: true; midiRuntimeRelationshipNotInvented: true; gameplayEventNamesNotInvented: true;
      verdict: 'MK1_BROWSER_AUDIO_EXPORT_PACKAGE_ESTABLISHED'; narrative: string;
    };
    status: 'SUCCESS'; validation: { allChecksPassed: boolean; checks: Array<{ checkId: string; passed: boolean; detail?: string }> };
  };
  zipBytes: Uint8Array;
  assetManifest: MK1AudioAssetManifestV1;
}

export async function executeBrowserAudioExportBundle(source: DirectorySource, o63: MK1AudioMusicResourceGraphCensusReport): Promise<MK1BrowserAudioExportBundleResult> {
  if (source.isSynthetic !== false) throw new Error('O64 requires authentic MK1 installation');
  if (o63.status !== 'SUCCESS' || !o63.validation.allChecksPassed || o63.provenance.sha256 !== CANONICAL_SHA || o63.decision.verdict !== 'MK1_AUDIO_MUSIC_RESOURCE_GRAPH_AND_EXPORT_CAPABILITY_CENSUS_ESTABLISHED') throw new Error('O64 requires verified canonical O63');
  const entries = await source.listRecursive();
  const exeEntry = entry(entries, o63.provenance.fileName), exe = await source.readSlice(exeEntry.path, 0, exeEntry.size);
  if (await sha256Bytes(exe) !== CANONICAL_SHA) throw new Error('O64 MK1.EXE is not canonical');

  const files: Array<{ name: string; bytes: Uint8Array }> = [];
  const assets: MK1AudioAssetManifestV1['assets'] = [];
  for (const r of o63.wavResources) {
    const src = entry(entries, r.path), bytes = await source.readSlice(src.path, 0, src.size), sha = await sha256Bytes(bytes);
    if (src.size !== r.byteLength || sha !== r.sha256) throw new Error(`O64 WAV changed since O63: ${r.path}`);
    const packagePath = `audio/wav/${norm(r.path)}`;
    files.push({ name: packagePath, bytes });
    assets.push({ packagePath, sourcePath: norm(r.path), fileName: r.fileName, byteLength: r.byteLength, sha256: r.sha256, audioFormat: r.audioFormat, channels: r.channels, sampleRate: r.sampleRate, byteRate: r.byteRate, blockAlign: r.blockAlign, bitsPerSample: r.bitsPerSample, dataByteLength: r.dataByteLength, durationMillisecondsRounded: r.durationMillisecondsRounded, soundCode: r.soundCode, soundCodeHex: r.soundCodeHex, tableBinding: r.tableBinding, playbackPolicy: r.playbackPolicy, semanticNameStatus: r.semanticNameStatus });
  }

  const samplesEntry = entry(entries, o63.opaqueSamplesDat.path), samplesBytes = await source.readSlice(samplesEntry.path, 0, samplesEntry.size), samplesSha = await sha256Bytes(samplesBytes);
  if (samplesEntry.size !== o63.opaqueSamplesDat.byteLength || samplesSha !== o63.opaqueSamplesDat.sha256) throw new Error('O64 SAMPLES.DAT changed since O63');
  files.push({ name: 'unresolved/SAMPLES.DAT', bytes: samplesBytes });

  const assetManifest: MK1AudioAssetManifestV1 = {
    format: 'mk1_audio_asset_manifest_v1', sourceExeSha256: CANONICAL_SHA, wavAssetCount: 244, assets, soundRecords: o63.soundRecords,
    unresolved: { samplesDat: { packagePath: 'unresolved/SAMPLES.DAT', sourcePath: norm(o63.opaqueSamplesDat.path), byteLength: o63.opaqueSamplesDat.byteLength, sha256: o63.opaqueSamplesDat.sha256, role: 'UNKNOWN', executableRelationship: 'UNKNOWN_NO_DIRECT_JOIN_QUALIFIED' } },
    boundaries: { gameplayEventNamesEstablished: false, samplesDatRoleEstablished: false, midiSequenceRuntimeRelationshipEstablished: false, wavBytesTranscoded: false },
  };
  const packageManifest = {
    format: 'mk1_browser_audio_export_package_manifest_v1', pass: '1E.3O.64', sourceExeSha256: CANONICAL_SHA,
    entries: { total: 249, wav: 244, unresolvedRaw: 1, json: 3, readme: 1 },
    evidence: { o63Verdict: o63.decision.verdict, wavResourceCount: o63.summary.wavFileCount, boundWavRecordCount: o63.summary.boundWavRecordCount, pathPoolOnlyWavCount: o63.summary.pathPoolOnlyWavCount, soundRecordCount: o63.summary.soundRecordCount },
    boundaries: assetManifest.boundaries,
  };
  files.push({ name: 'manifests/audio_assets.json', bytes: encoder.encode(JSON.stringify(assetManifest, null, 2)) });
  files.push({ name: 'manifests/package_manifest.json', bytes: encoder.encode(JSON.stringify(packageManifest, null, 2)) });
  files.push({ name: 'reports/o63_audio_music_resource_graph_census.json', bytes: encoder.encode(JSON.stringify(o63, null, 2)) });
  files.push({ name: 'README.md', bytes: encoder.encode(README) });
  if (files.length !== 249 || new Set(files.map((f) => f.name)).size !== 249) throw new Error(`O64 unexpected package entry graph: ${files.length}`);

  const zipBytes = buildStoredZip(files), zipSha256 = await sha256Bytes(zipBytes);
  const checks = [
    { checkId: 'O63_CANONICAL_PREREQUISITE', passed: true },
    { checkId: 'EXACT_244_WAV_ASSETS', passed: assets.length === 244 },
    { checkId: 'ALL_WAV_BYTES_HASH_MATCH_O63', passed: true },
    { checkId: 'EXACT_243_BOUND_PLUS_ONE_PATH_POOL_ONLY', passed: assets.filter((a) => a.tableBinding === 'RECORD_BOUND').length === 243 && assets.filter((a) => a.tableBinding === 'PATH_POOL_ONLY_UNBOUND').length === 1 },
    { checkId: 'ALL_533_SOUND_RECORDS_PRESERVED_IN_MANIFEST', passed: assetManifest.soundRecords.length === 533 },
    { checkId: 'SAMPLES_DAT_PRESERVED_RAW_UNKNOWN', passed: assetManifest.unresolved.samplesDat.role === 'UNKNOWN' && assetManifest.unresolved.samplesDat.sha256 === samplesSha },
    { checkId: 'EXACT_249_UNIQUE_ZIP_ENTRIES', passed: files.length === 249 && new Set(files.map((f) => f.name)).size === 249 },
    { checkId: 'NO_WAV_TRANSCODING', passed: assetManifest.boundaries.wavBytesTranscoded === false },
    { checkId: 'NO_GAMEPLAY_EVENT_NAME_PROMOTION', passed: assetManifest.boundaries.gameplayEventNamesEstablished === false },
    { checkId: 'NO_MIDI_RUNTIME_PROMOTION', passed: assetManifest.boundaries.midiSequenceRuntimeRelationshipEstablished === false },
    { checkId: 'NO_WRITE_PATH', passed: true },
  ];
  if (!checks.every((c) => c.passed)) throw new Error(`O64 package validation failed: ${checks.filter((c) => !c.passed).map((c) => c.checkId).join(', ')}`);
  const timestamp = new Date().toISOString(), operationId = createOperationId('browser_audio_export_bundle');
  return {
    report: {
      format: 'mk1_browser_audio_export_bundle_v1', timestamp, operationId, provenance: { ...o63.provenance, timestamp, operationId }, prerequisite: { o63OperationId: o63.operationId, o63Verdict: o63.decision.verdict, validationPassed: true },
      bundle: { downloadFileName: 'MK1_O64_BROWSER_AUDIO_EXPORT_PACKAGE.zip', entryCount: 249, wavEntryCount: 244, unresolvedRawEntryCount: 1, jsonEntryCount: 3, readmeEntryCount: 1, zipByteLength: zipBytes.length, zipSha256, zipEncoding: 'ZIP_STORE_ONLY' },
      summary: { wavAssetCount: 244, boundWavAssetCount: 243, pathPoolOnlyWavCount: 1, unresolvedRawResourceCount: 1, soundRecordCount: 533 },
      decision: { browserAudioPackageEstablished: true, all244AuthenticWavsPreservedByteExact: true, soundCodeAndPlaybackMetadataPreserved: true, samplesDatPreservedWithoutSemanticPromotion: true, midiRuntimeRelationshipNotInvented: true, gameplayEventNamesNotInvented: true, verdict: 'MK1_BROWSER_AUDIO_EXPORT_PACKAGE_ESTABLISHED', narrative: 'O64 packages all 244 authentic installation WAV assets byte-for-byte, preserves all 533 O63 sound records and playback policy in a product manifest, and carries SAMPLES.DAT only as a raw unresolved resource. No audio is transcoded, no DUNNO/XTRA or numeric filename is promoted to a gameplay event name, and linked Miles sequence/MIDI capability is not promoted into a runtime music relationship.' },
      status: 'SUCCESS', validation: { allChecksPassed: true, checks },
    }, zipBytes, assetManifest,
  };
}

export function createMK1BrowserAudioExportBundleExport(result: MK1BrowserAudioExportBundleResult) {
  if (result.report.status !== 'SUCCESS' || !result.report.validation.allChecksPassed) throw new Error('O64 audio bundle export blocked');
  return result.report;
}

export function downloadMK1BrowserAudioExportBundle(result: MK1BrowserAudioExportBundleResult): void {
  if (result.report.status !== 'SUCCESS' || !result.report.validation.allChecksPassed) throw new Error('O64 audio bundle download blocked');
  const stable = new Uint8Array(result.zipBytes), url = URL.createObjectURL(new Blob([stable.buffer], { type: 'application/zip' }));
  const a = document.createElement('a'); a.href = url; a.download = result.report.bundle.downloadFileName; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
