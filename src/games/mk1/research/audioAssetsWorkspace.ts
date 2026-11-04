/** Audio-assets workspace model — Pass 1E.3O.64. */
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { MK1AudioMusicResourceGraphCensusReport } from './audioMusicResourceGraphCensus';
import { MK1AudioAssetManifestV1, MK1BrowserAudioExportBundleResult } from './browserAudioExportBundle';
import { MK1BrowserAudioExportBundleValidationReport, parseAudioStoreZip } from './browserAudioExportBundleValidation';

const decoder = new TextDecoder();
function json<T>(b: Uint8Array): T { return JSON.parse(decoder.decode(b)) as T; }

export interface MK1AudioWorkspaceAsset {
  sourcePath: string; packagePath: string; fileName: string; wavBytes: Uint8Array; byteLength: number; sha256: string;
  audioFormat: number; channels: number; sampleRate: number; bitsPerSample: number; dataByteLength: number; durationMillisecondsRounded: number;
  soundCode: number | null; soundCodeHex: string | null; tableBinding: 'RECORD_BOUND' | 'PATH_POOL_ONLY_UNBOUND'; playbackPolicy: string;
  semanticNameStatus: 'CANONICAL_INSTALLATION_IDENTIFIER_ONLY_GAMEPLAY_MEANING_UNRESOLVED';
}
export interface MK1AudioAssetsWorkspaceResult {
  report: {
    format: 'mk1_audio_assets_workspace_v1'; timestamp: string; operationId: string; provenance: MK1AudioMusicResourceGraphCensusReport['provenance'];
    prerequisite: { o64BundleOperationId: string; o64ValidationOperationId: string; o64ValidationVerdict: string; o63OperationId: string; validationPassed: true };
    summary: { browsableWavAssetCount: 244; boundSoundCodeAssetCount: 243; pathPoolOnlyAssetCount: 1; loopForeverAssetCount: 11; unresolvedRawResourceCount: 1; };
    presentationPolicy: { sourceFilenamesAreIdentifiersNotGameplayNames: true; soundCodesShownAsHexIdentifiers: true; samplesDatShownAsUnresolvedRawResourceNotPlayableMusic: true; linkedMidiCapabilityNotPresentedAsMusicAssetRelationship: true; };
    decision: { audioAssetsWorkspaceEstablished: true; all244WavsPlayableFromByteExactPackage: true; unresolvedSamplesDatStateVisuallyExplicit: true; gameplayEventNamesNotInvented: true; verdict: 'MK1_AUDIO_ASSETS_WORKSPACE_ESTABLISHED'; narrative: string };
    status: 'SUCCESS'; validation: { allChecksPassed: boolean; checks: Array<{ checkId: string; passed: boolean }> };
  };
  assets: MK1AudioWorkspaceAsset[];
  unresolvedResources: Array<{ sourcePath: string; packagePath: string; byteLength: number; sha256: string; role: 'UNKNOWN'; executableRelationship: 'UNKNOWN_NO_DIRECT_JOIN_QUALIFIED'; bytes: Uint8Array }>;
}

export async function executeAudioAssetsWorkspace(o64: MK1BrowserAudioExportBundleResult, validation: MK1BrowserAudioExportBundleValidationReport, o63: MK1AudioMusicResourceGraphCensusReport): Promise<MK1AudioAssetsWorkspaceResult> {
  if (o64.report.status !== 'SUCCESS' || validation.status !== 'SUCCESS' || !validation.validation.allChecksPassed || o63.status !== 'SUCCESS') throw new Error('O64 audio workspace requires verified package/validation/O63');
  const entries = parseAudioStoreZip(o64.zipBytes), manifestEntry = entries.get('manifests/audio_assets.json'); if (!manifestEntry) throw new Error('O64 audio workspace manifest missing');
  const manifest = json<MK1AudioAssetManifestV1>(manifestEntry.bytes);
  const assets: MK1AudioWorkspaceAsset[] = manifest.assets.map((a) => { const z = entries.get(a.packagePath); if (!z) throw new Error(`O64 audio workspace WAV missing ${a.packagePath}`); return { ...a, wavBytes: z.bytes }; });
  const sampleMeta = manifest.unresolved.samplesDat, sampleEntry = entries.get(sampleMeta.packagePath); if (!sampleEntry) throw new Error('O64 audio workspace SAMPLES.DAT missing');
  const unresolvedResources = [{ ...sampleMeta, bytes: sampleEntry.bytes }];
  const checks = [
    { checkId: 'O64_BYTE_VALIDATION_PREREQUISITE', passed: validation.decision.browserAudioBundleValidatedAgainstAuthenticSourceAndO63 },
    { checkId: 'ALL_244_WAVS_BROWSABLE', passed: assets.length === 244 },
    { checkId: 'EXACT_243_BOUND_SOUND_CODE_ASSETS', passed: assets.filter((a) => a.tableBinding === 'RECORD_BOUND').length === 243 },
    { checkId: 'EXACT_ONE_PATH_POOL_ONLY_DUMMY', passed: assets.filter((a) => a.tableBinding === 'PATH_POOL_ONLY_UNBOUND').length === 1 && assets.find((a) => a.tableBinding === 'PATH_POOL_ONLY_UNBOUND')?.fileName.toUpperCase() === 'DUMMY.WAV' },
    { checkId: 'EXACT_11_LOOP_FOREVER_ASSETS', passed: assets.filter((a) => a.playbackPolicy === 'STOP_ALL_THEN_PLAY_FOREVER').length === 11 },
    { checkId: 'SAMPLES_DAT_EXPLICITLY_UNRESOLVED', passed: unresolvedResources.length === 1 && unresolvedResources[0].role === 'UNKNOWN' },
    { checkId: 'NO_GAMEPLAY_EVENT_NAME_PROMOTION', passed: assets.every((a) => a.semanticNameStatus === 'CANONICAL_INSTALLATION_IDENTIFIER_ONLY_GAMEPLAY_MEANING_UNRESOLVED') },
  ];
  if (!checks.every((c) => c.passed)) throw new Error(`O64 audio workspace failed: ${checks.filter((c) => !c.passed).map((c) => c.checkId).join(', ')}`);
  const timestamp = new Date().toISOString(), operationId = createOperationId('audio_assets_workspace');
  return {
    report: {
      format: 'mk1_audio_assets_workspace_v1', timestamp, operationId, provenance: { ...o63.provenance, timestamp, operationId }, prerequisite: { o64BundleOperationId: o64.report.operationId, o64ValidationOperationId: validation.operationId, o64ValidationVerdict: validation.decision.verdict, o63OperationId: o63.operationId, validationPassed: true },
      summary: { browsableWavAssetCount: 244, boundSoundCodeAssetCount: 243, pathPoolOnlyAssetCount: 1, loopForeverAssetCount: 11, unresolvedRawResourceCount: 1 },
      presentationPolicy: { sourceFilenamesAreIdentifiersNotGameplayNames: true, soundCodesShownAsHexIdentifiers: true, samplesDatShownAsUnresolvedRawResourceNotPlayableMusic: true, linkedMidiCapabilityNotPresentedAsMusicAssetRelationship: true },
      decision: { audioAssetsWorkspaceEstablished: true, all244WavsPlayableFromByteExactPackage: true, unresolvedSamplesDatStateVisuallyExplicit: true, gameplayEventNamesNotInvented: true, verdict: 'MK1_AUDIO_ASSETS_WORKSPACE_ESTABLISHED', narrative: 'O64 exposes all 244 byte-exact WAV assets from the independently validated browser package as playable installation-identifier assets. Sound codes and O63 playback policy are visible, but filenames remain identifiers rather than gameplay labels. SAMPLES.DAT is shown separately as a raw unresolved resource and linked MIDI/sequence capability is not presented as an established music relationship.' },
      status: 'SUCCESS', validation: { allChecksPassed: true, checks },
    }, assets, unresolvedResources,
  };
}

export function createMK1AudioAssetsWorkspaceExport(result: MK1AudioAssetsWorkspaceResult) { if (result.report.status !== 'SUCCESS' || !result.report.validation.allChecksPassed) throw new Error('O64 audio workspace export blocked'); return result.report; }
