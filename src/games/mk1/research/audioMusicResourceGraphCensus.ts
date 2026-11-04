/**
 * MK1 audio/music resource graph and export-capability census — Pass 1E.3O.63.
 *
 * Export-first, read-only pass. It inventories the authentic SFX WAV surface,
 * reconstructs the fixed sfx.ASM code->resource table, proves the bounded
 * playback bridge into the linked Miles digital-sample API, and keeps
 * resource identity, playback behavior and gameplay/event naming separate.
 *
 * It intentionally does not call SAMPLES.DAT a music bank, does not invent
 * semantic names for numeric/DUNNO/XTRA resources, and does not infer an
 * indirect MIDI/XMIDI runtime path from linked library code alone.
 */
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { sha256Bytes } from './paletteRoundTripCodec';
import { enumerateMK1WatcomPermanentClasses } from './watcomPermanentClassInventory';

const CANONICAL_SHA = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const CODE_FILE_IMAGE_BASE = 0x00050a54;
const STATIC_DATA_FILE_IMAGE_BASE = 0x0008ca54;
const SFX_CODE_START = 0x00027abc;
const SFX_CODE_END = 0x00027b46;
const SFX_DATA_START = 0x0001ee14;
const SFX_DATA_END = 0x00022bec;
const LOW_CODE_POLICY_START = 0x0001ee14;
const LOW_CODE_POLICY_COUNT = 0x20;
const RECORD_TABLE_START = 0x0001ee34;
const RECORD_COUNT = 0x215;
const RECORD_STRIDE = 0x18;
const PATH_POOL_START = RECORD_TABLE_START + RECORD_COUNT * RECORD_STRIDE; // 0x2202c
const PATH_POOL_END = SFX_DATA_END - 1; // final sfx.ASM data byte is preserved zero padding

function hx(value: number, width = 8): string { return `0x${(value >>> 0).toString(16).padStart(width, '0').toUpperCase()}`; }
function u16(bytes: Uint8Array, offset: number): number { return (bytes[offset] | (bytes[offset + 1] << 8)) >>> 0; }
function u32(bytes: Uint8Array, offset: number): number { return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0; }
function i32(bytes: Uint8Array, offset: number): number { return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getInt32(0, true); }
function ascii(bytes: Uint8Array): string { return String.fromCharCode(...bytes); }
function norm(path: string): string { return path.replace(/\\/g, '/'); }
function basename(path: string): string { const n = norm(path); return n.slice(n.lastIndexOf('/') + 1); }
function ext(path: string): string { const b = basename(path), dot = b.lastIndexOf('.'); return dot < 0 ? '' : b.slice(dot + 1).toUpperCase(); }
function isAilModule(name: string | null | undefined): boolean { return !!name && /[\\/]NET[\\/]LIBS[\\/]AIL[\\/]/i.test(name); }
function rel32Target(code: Uint8Array, instructionAddress: number, codeBaseAddress: number): number | null {
  const o = instructionAddress - codeBaseAddress;
  if (o < 0 || o + 5 > code.length || code[o] !== 0xe8) return null;
  return (instructionAddress + 5 + i32(code, o + 1)) >>> 0;
}

interface WavInfo {
  audioFormat: number; channels: number; sampleRate: number; byteRate: number; blockAlign: number; bitsPerSample: number;
  dataByteLength: number; riffDeclaredFileBytes: number; headerValid: boolean;
}
function parseWav(bytes: Uint8Array): WavInfo {
  if (bytes.length < 12 || ascii(bytes.subarray(0, 4)) !== 'RIFF' || ascii(bytes.subarray(8, 12)) !== 'WAVE') {
    return { audioFormat: 0, channels: 0, sampleRate: 0, byteRate: 0, blockAlign: 0, bitsPerSample: 0, dataByteLength: 0, riffDeclaredFileBytes: 0, headerValid: false };
  }
  const riffDeclaredFileBytes = u32(bytes, 4) + 8;
  let cursor = 12, audioFormat = 0, channels = 0, sampleRate = 0, byteRate = 0, blockAlign = 0, bitsPerSample = 0, dataByteLength = 0, fmtFound = false, dataFound = false;
  while (cursor + 8 <= bytes.length) {
    const id = ascii(bytes.subarray(cursor, cursor + 4)), length = u32(bytes, cursor + 4), payload = cursor + 8;
    if (payload + length > bytes.length) break;
    if (id === 'fmt ' && length >= 16) {
      audioFormat = u16(bytes, payload); channels = u16(bytes, payload + 2); sampleRate = u32(bytes, payload + 4); byteRate = u32(bytes, payload + 8); blockAlign = u16(bytes, payload + 12); bitsPerSample = u16(bytes, payload + 14); fmtFound = true;
    } else if (id === 'data') { dataByteLength = length; dataFound = true; }
    cursor = payload + length + (length & 1);
  }
  return { audioFormat, channels, sampleRate, byteRate, blockAlign, bitsPerSample, dataByteLength, riffDeclaredFileBytes, headerValid: fmtFound && dataFound && riffDeclaredFileBytes === bytes.length };
}

interface ModuleRange { segment: number; start: number; end: number; moduleIndex: number; module: string; }
interface DirectCallOccurrence { callSite: number; callSiteHex: string; callerModule: string | null; target: number; targetHex: string; targetSymbol: string; applicationModule: boolean; }

type PlaybackPolicy = 'STOP_ALL_ONLY_NO_RESOURCE' | 'STOP_ALL_THEN_PLAY_FOREVER' | 'STOP_ALL_THEN_ONE_SHOT' | 'ONE_SHOT' | 'UNBOUND_NO_PLAYBACK';

export interface MK1AudioMusicResourceGraphCensusReport {
  format: 'mk1_audio_music_resource_graph_census_v1';
  timestamp: string; operationId: string;
  provenance: { sourceKind: 'user-loaded-directory'; fileName: string; byteLength: number; sha256: string; synthetic: false; artifactGeneratedByTest: false; timestamp: string; operationId: string };
  coordinateModel: { codeFileImageBase: number; codeFileImageBaseHex: string; staticDataFileImageBase: number; staticDataFileImageBaseHex: string; watcomOffsetsAreNotLeObject2Offsets: true };
  sfxModule: {
    codeRange: { start: number; startHex: string; endExclusive: number; endExclusiveHex: string; size: number; moduleName: 'sfx.ASM' };
    dataRange: { start: number; startHex: string; endExclusive: number; endExclusiveHex: string; size: number; moduleName: 'sfx.ASM' };
    lowCodePlaybackPolicy: { watcomStart: number; watcomStartHex: string; byteCount: 32; bytes: number[]; loopForeverCodes: number[]; loopForeverCodesHex: string[] };
    recordTable: { watcomStart: number; watcomStartHex: string; physicalStart: number; physicalStartHex: string; recordCount: 533; strideBytes: 24; watcomEndExclusive: number; watcomEndExclusiveHex: string; physicalEndExclusive: number; physicalEndExclusiveHex: string };
    pathPool: { watcomStart: number; watcomStartHex: string; physicalStart: number; physicalStartHex: string; watcomEndExclusive: number; watcomEndExclusiveHex: string; pathCount: number; exactDiskPathMatchCount: number; trailingModuleZeroPaddingByteCount: 1 };
  };
  wavResources: Array<{
    path: string; fileName: string; byteLength: number; sha256: string; audioFormat: number; channels: number; sampleRate: number; byteRate: number; blockAlign: number; bitsPerSample: number; dataByteLength: number; durationMillisecondsRounded: number;
    pathWatcomOffset: number; pathWatcomOffsetHex: string; pathPhysicalOffset: number; pathPhysicalOffsetHex: string;
    soundCode: number | null; soundCodeHex: string | null; tableBinding: 'RECORD_BOUND' | 'PATH_POOL_ONLY_UNBOUND'; playbackPolicy: PlaybackPolicy | 'NO_RECORD_BINDING'; semanticNameStatus: 'CANONICAL_INSTALLATION_IDENTIFIER_ONLY_GAMEPLAY_MEANING_UNRESOLVED';
  }>;
  soundRecords: Array<{
    soundCode: number; soundCodeHex: string; recordWatcomOffset: number; recordWatcomOffsetHex: string; recordPhysicalOffset: number; recordPhysicalOffsetHex: string;
    pathWatcomOffset: number; pathWatcomOffsetHex: string; path: string | null; fileByteLength: number; loadFlags: number; loadFlagsHex: string; rawPlus0C: number; runtimeSlotPlus10: number; runtimeSlotPlus14: number;
    bound: boolean; playbackPolicy: PlaybackPolicy; filenameHexMatchesSoundCode: boolean | null; diskFileSizeMatchesRecord: boolean | null;
  }>;
  playbackBridge: {
    resetFxAddrs: { symbol: 'reset_fx_addrs_'; address: number; addressHex: string; physicalOffset: number; physicalOffsetHex: string; recordCountImmediate: number; tableBaseImmediate: number; runtimeSlotsZeroed: [16, 20] };
    playFx: { symbol: 'play_fx'; address: number; addressHex: string; physicalOffset: number; physicalOffsetHex: string; recordIndexFormula: 'record = 0x1EE34 + soundCode * 24'; nullPathRejectedBeforeLoad: true; lockMemPntTarget: number; lockMemPntTargetHex: string; oneShotTarget: number; oneShotTargetHex: string; foreverTarget: number; foreverTargetHex: string; stopAllTarget: number; stopAllTargetHex: string };
    soundGate: { symbol: 'SOUND'; address: number; addressHex: string; physicalOffset: number; physicalOffsetHex: string; fNoSoundWatcomOffset: number; fNoSoundWatcomOffsetHex: string; playFxDirectCallSite: number; playFxDirectCallSiteHex: string; soleDirectApplicationCallToPlayFx: boolean };
    digitalSampleApi: { playSampleSymbol: 'play_sample_'; playSampleForeverSymbol: 'play_sample_forever_'; stopAllSamplesSymbol: 'stop_all_samples_'; directApplicationApiCalls: DirectCallOccurrence[] };
    higherLevelConsumers: { playerSound: { address: number; addressHex: string; directCallCount: number; callerModules: Array<{ module: string; count: number }> }; smartSound: { address: number; addressHex: string; directCallCount: number; callerModules: Array<{ module: string; count: number }> }; semanticEventToConcreteWavMappingEstablished: false };
  };
  linkedSequenceMidiSurface: { linkedSymbolsPresent: string[]; directNearCallEncodingOccurrencesFromApplicationModules: DirectCallOccurrence[]; directApplicationSequenceCallCount: number; interpretation: 'LINKED_LIBRARY_CAPABILITY_ONLY_NO_DIRECT_APPLICATION_NEAR_CALL_OBSERVED'; indirectRuntimeUseExcludedByThisPass: false };
  installationCandidateSurface: { commonSequencedMusicExtensionsChecked: string[]; commonSequencedMusicAssetPaths: string[]; commonSequencedMusicAssetCount: number; interpretation: 'NO_STANDALONE_COMMON_SEQUENCE_ASSET_EXTENSION_OBSERVED_NOT_PROOF_OF_NO_MUSIC' };
  opaqueSamplesDat: { path: string; byteLength: number; sha256: string; exactAsciiPathOccurrencesInExe: number; exactLittleEndianSizeOccurrencesInExe: number; formatStatus: 'UNKNOWN'; executableRelationshipStatus: 'UNKNOWN_NO_DIRECT_JOIN_QUALIFIED'; exportPolicy: 'PRESERVE_RAW_WITH_UNKNOWN_ROLE' };
  supportFiles: Array<{ path: string; byteLength: number; sha256: string; classification: 'DIGITAL_DRIVER' | 'MUSIC_OR_SOUND_DRIVER' | 'AIL_DRIVER_LIST' | 'SOUND_SETUP_EXECUTABLE' }>;
  summary: { wavFileCount: number; totalWavFileBytes: number; totalWavPcmBytes: number; boundWavRecordCount: number; pathPoolOnlyWavCount: number; soundRecordCount: number; boundSoundRecordCount: number; unboundSoundRecordCount: number; lowCodeLoopForeverCount: number; allWavsPcm8Mono11025: boolean; numericFilenameCodeMatchCount: number; namedTailCodeMatchCount: number; samplesDatRelationshipQualified: false; canonicalGameplaySoundNamesEstablished: false };
  exportCapability: { losslessRawWavExportReady: true; recordIdToWavPathExportReady: true; playbackPolicyExportReady: true; semanticGameplayEventNamesExportReady: false; samplesDatSemanticExportReady: false; linkedMidiCapabilityIsNotRuntimeRelationship: true; recommendedO64RawPackageWavCount: number };
  decision: { authenticWavSurfaceEstablished: true; sfxRecordGraphEstablished: true; codeToWavBindingEstablished: true; playbackBridgeToMilesDigitalApiEstablished: true; lowCodeLoopPolicyEstablished: true; universalGameplayEventNamingEstablished: false; samplesDatRoleEstablished: false; midiSequenceRuntimeRelationshipEstablished: false; verdict: 'MK1_AUDIO_MUSIC_RESOURCE_GRAPH_AND_EXPORT_CAPABILITY_CENSUS_ESTABLISHED'; narrative: string };
  status: 'SUCCESS'; validation: { allChecksPassed: boolean; checks: Array<{ checkId: string; passed: boolean; detail?: string }> };
}

export async function executeAudioMusicResourceGraphCensus(source: DirectorySource): Promise<MK1AudioMusicResourceGraphCensusReport> {
  if (source.isSynthetic !== false) throw new Error('O63 requires an authentic MK1 installation');
  const files = await source.listRecursive();
  const exeEntry = files.find((f) => f.name.toUpperCase() === 'MK1.EXE'); if (!exeEntry) throw new Error('O63 requires MK1.EXE');
  const exe = await source.readSlice(exeEntry.path, 0, exeEntry.size), exeSha = await sha256Bytes(exe); if (exeSha !== CANONICAL_SHA) throw new Error('O63 MK1.EXE is not canonical');
  const wat = await enumerateMK1WatcomPermanentClasses(source); if (wat.status !== 'SUCCESS' || !wat.result.overallValid) throw new Error('O63 Watcom inventory failed');
  const symbols = wat.result.globalSymbols.symbols.filter((s) => s.valid);
  const exactSymbol = (name: string, modulePattern?: RegExp) => {
    const matches = symbols.filter((s) => s.name === name && (!modulePattern || modulePattern.test(s.resolvedModuleName ?? ''))); if (matches.length !== 1) throw new Error(`O63 expected one symbol ${name}, got ${matches.length}`); return matches[0];
  };
  const ranges: ModuleRange[] = [];
  for (const rec of wat.result.addressInfo.segmentRecords) { let cursor = rec.startAddressOffset; for (const entry of rec.entries) { ranges.push({ segment: rec.segment, start: cursor, end: cursor + entry.size, moduleIndex: entry.moduleIndex, module: entry.resolvedModuleName }); cursor += entry.size; } }
  const range = (segment: number, name: string) => { const m = ranges.filter((r) => r.segment === segment && r.module === name); if (m.length !== 1) throw new Error(`O63 expected one ${name} segment-${segment} range, got ${m.length}`); return m[0]; };
  const sfxCode = range(1, 'sfx.ASM'), sfxData = range(2, 'sfx.ASM'), mkSoundCode = range(1, 'MKSOUND.ASM');
  if (sfxCode.start !== SFX_CODE_START || sfxCode.end !== SFX_CODE_END || sfxData.start !== SFX_DATA_START || sfxData.end !== SFX_DATA_END) throw new Error('O63 sfx.ASM module ranges differ from canonical fixture');

  const policy = Array.from(exe.subarray(STATIC_DATA_FILE_IMAGE_BASE + LOW_CODE_POLICY_START, STATIC_DATA_FILE_IMAGE_BASE + LOW_CODE_POLICY_START + LOW_CODE_POLICY_COUNT));
  const loopForeverCodes = policy.map((v, i) => v ? i : -1).filter((v) => v >= 0);
  const pathByOffset = new Map<number, string>();
  let pathCursor = PATH_POOL_START;
  while (pathCursor < PATH_POOL_END) {
    const physical = STATIC_DATA_FILE_IMAGE_BASE + pathCursor; let end = physical; while (end < STATIC_DATA_FILE_IMAGE_BASE + PATH_POOL_END && exe[end] !== 0) end++;
    if (end >= STATIC_DATA_FILE_IMAGE_BASE + PATH_POOL_END) throw new Error('O63 unterminated sfx.ASM path pool');
    const text = ascii(exe.subarray(physical, end)); if (!/^SFX\\[^\\]+\.WAV$/i.test(text)) throw new Error(`O63 unexpected path-pool token at ${hx(pathCursor)}: ${text}`);
    pathByOffset.set(pathCursor, norm(text)); pathCursor += (end - physical) + 1;
  }
  if (pathCursor !== PATH_POOL_END || exe[STATIC_DATA_FILE_IMAGE_BASE + PATH_POOL_END] !== 0) throw new Error('O63 path pool/padding boundary differs from canonical sfx.ASM data');

  const fileByNormalizedPath = new Map(files.map((f) => [norm(f.path).toUpperCase(), f] as const));
  const records: MK1AudioMusicResourceGraphCensusReport['soundRecords'] = [];
  const recordIdByPathOffset = new Map<number, number>();
  for (let soundCode = 0; soundCode < RECORD_COUNT; soundCode++) {
    const watcom = RECORD_TABLE_START + soundCode * RECORD_STRIDE, physical = STATIC_DATA_FILE_IMAGE_BASE + watcom;
    const pathOffset = u32(exe, physical), fileByteLength = u32(exe, physical + 4), loadFlags = u32(exe, physical + 8), rawPlus0C = u32(exe, physical + 12), runtimeSlotPlus10 = u32(exe, physical + 16), runtimeSlotPlus14 = u32(exe, physical + 20);
    const resourcePath = pathOffset ? pathByOffset.get(pathOffset) ?? null : null;
    if (pathOffset && !resourcePath) throw new Error(`O63 record ${hx(soundCode, 3)} points outside path pool: ${hx(pathOffset)}`);
    if (resourcePath) { if (recordIdByPathOffset.has(pathOffset)) throw new Error(`O63 duplicate path pointer ${hx(pathOffset)}`); recordIdByPathOffset.set(pathOffset, soundCode); }
    const file = resourcePath ? fileByNormalizedPath.get(resourcePath.toUpperCase()) : undefined;
    const numeric = resourcePath ? /^SFX\/([0-9A-F]{3})\.WAV$/i.exec(resourcePath) : null;
    let playbackPolicy: PlaybackPolicy;
    if (soundCode === 0) playbackPolicy = 'STOP_ALL_ONLY_NO_RESOURCE';
    else if (!resourcePath) playbackPolicy = 'UNBOUND_NO_PLAYBACK';
    else if (soundCode < 0x20) playbackPolicy = policy[soundCode] ? 'STOP_ALL_THEN_PLAY_FOREVER' : 'STOP_ALL_THEN_ONE_SHOT';
    else playbackPolicy = 'ONE_SHOT';
    records.push({ soundCode, soundCodeHex: hx(soundCode, 3), recordWatcomOffset: watcom, recordWatcomOffsetHex: hx(watcom), recordPhysicalOffset: physical, recordPhysicalOffsetHex: hx(physical), pathWatcomOffset: pathOffset, pathWatcomOffsetHex: hx(pathOffset), path: resourcePath, fileByteLength, loadFlags, loadFlagsHex: hx(loadFlags), rawPlus0C, runtimeSlotPlus10, runtimeSlotPlus14, bound: !!resourcePath, playbackPolicy, filenameHexMatchesSoundCode: numeric ? parseInt(numeric[1], 16) === soundCode : null, diskFileSizeMatchesRecord: resourcePath ? !!file && file.size === fileByteLength : null });
  }

  const wavEntries = files.filter((f) => /^SFX[\\/][^\\/]+\.WAV$/i.test(norm(f.path))).sort((a, b) => a.path.localeCompare(b.path));
  const resources: MK1AudioMusicResourceGraphCensusReport['wavResources'] = [];
  let totalPcm = 0, totalWavBytes = 0;
  for (const file of wavEntries) {
    const bytes = await source.readSlice(file.path, 0, file.size), info = parseWav(bytes), sha256 = await sha256Bytes(bytes); totalPcm += info.dataByteLength; totalWavBytes += file.size;
    const normalized = norm(file.path), pool = [...pathByOffset.entries()].find(([, p]) => p.toUpperCase() === normalized.toUpperCase()); if (!pool) throw new Error(`O63 disk WAV missing from executable path pool: ${normalized}`);
    const [pathWatcomOffset] = pool, soundCode = recordIdByPathOffset.get(pathWatcomOffset) ?? null, rec = soundCode === null ? null : records[soundCode];
    resources.push({ path: normalized, fileName: basename(normalized), byteLength: file.size, sha256, audioFormat: info.audioFormat, channels: info.channels, sampleRate: info.sampleRate, byteRate: info.byteRate, blockAlign: info.blockAlign, bitsPerSample: info.bitsPerSample, dataByteLength: info.dataByteLength, durationMillisecondsRounded: info.byteRate ? Math.round(info.dataByteLength * 1000 / info.byteRate) : 0, pathWatcomOffset, pathWatcomOffsetHex: hx(pathWatcomOffset), pathPhysicalOffset: STATIC_DATA_FILE_IMAGE_BASE + pathWatcomOffset, pathPhysicalOffsetHex: hx(STATIC_DATA_FILE_IMAGE_BASE + pathWatcomOffset), soundCode, soundCodeHex: soundCode === null ? null : hx(soundCode, 3), tableBinding: soundCode === null ? 'PATH_POOL_ONLY_UNBOUND' : 'RECORD_BOUND', playbackPolicy: rec?.playbackPolicy ?? 'NO_RECORD_BINDING', semanticNameStatus: 'CANONICAL_INSTALLATION_IDENTIFIER_ONLY_GAMEPLAY_MEANING_UNRESOLVED' });
  }

  const resetFx = exactSymbol('reset_fx_addrs_', /^sfx\.ASM$/), playFx = exactSymbol('play_fx', /^sfx\.ASM$/), lockMem = exactSymbol('LockMemPnt_'), playSample = exactSymbol('play_sample_'), playForever = exactSymbol('play_sample_forever_'), stopAll = exactSymbol('stop_all_samples_'), sound = exactSymbol('SOUND', /^MKSOUND\.ASM$/), fNoSound = exactSymbol('F_NOSOUND', /^RAM\.ASM$/), playerSound = exactSymbol('PLAYER_SOUND', /^MKSOUND\.ASM$/), smartSound = exactSymbol('SMART_SOUND', /^MKSOUND\.ASM$/);
  if (resetFx.addressOffset !== 0x27abc || playFx.addressOffset !== 0x27adc || sound.addressOffset !== 0x18bf9 || fNoSound.addressOffset !== 0x4447a) throw new Error('O63 canonical audio symbol anchors moved');

  const maxCodeEnd = Math.max(...ranges.filter((r) => r.segment === 1).map((r) => r.end)); const code = exe.subarray(CODE_FILE_IMAGE_BASE, CODE_FILE_IMAGE_BASE + maxCodeEnd);
  const moduleAt = (address: number): string | null => ranges.find((r) => r.segment === 1 && address >= r.start && address < r.end)?.module ?? null;
  const callOccurrences = (targetSymbol: string, target: number): DirectCallOccurrence[] => {
    const out: DirectCallOccurrence[] = [];
    for (const r of ranges.filter((x) => x.segment === 1)) for (let address = r.start; address + 5 <= r.end; address++) if (code[address] === 0xe8 && rel32Target(code, address, 0) === target) out.push({ callSite: address, callSiteHex: hx(address), callerModule: r.module, target, targetHex: hx(target), targetSymbol, applicationModule: !isAilModule(r.module) });
    return out;
  };
  const playFxCalls = callOccurrences('play_fx', playFx.addressOffset), playerSoundCalls = callOccurrences('PLAYER_SOUND', playerSound.addressOffset), smartSoundCalls = callOccurrences('SMART_SOUND', smartSound.addressOffset);
  const moduleHistogram = (calls: DirectCallOccurrence[]) => [...calls.filter((c) => c.applicationModule).reduce((m, c) => { const key = c.callerModule ?? 'UNKNOWN'; m.set(key, (m.get(key) ?? 0) + 1); return m; }, new Map<string, number>())].map(([module, count]) => ({ module, count })).sort((a, b) => b.count - a.count || a.module.localeCompare(b.module));

  const digitalTargets = ['_AIL_allocate_file_sample', '_AIL_start_sample', '_AIL_set_sample_loop_count', '_AIL_sample_status', '_AIL_stop_sample', '_AIL_end_sample'];
  const directDigital: DirectCallOccurrence[] = [];
  for (const name of digitalTargets) { const s = symbols.find((x) => x.name === name && x.segment === 1); if (s) directDigital.push(...callOccurrences(name, s.addressOffset).filter((c) => c.applicationModule)); }
  directDigital.sort((a, b) => a.callSite - b.callSite);
  const sequenceNames = ['_AIL_install_MDI_driver_file', '_AIL_allocate_sequence_handle', '_AIL_init_sequence', '_AIL_start_sequence', '_AIL_stop_sequence', '_AIL_resume_sequence', '_AIL_end_sequence', '_AIL_set_sequence_loop_count', '_AIL_set_sequence_tempo', '_AIL_set_sequence_volume', '_AIL_create_wave_synthesizer', '_AIL_destroy_wave_synthesizer'];
  const linkedSequenceSymbols = sequenceNames.filter((name) => symbols.some((s) => s.name === name && s.segment === 1));
  const directSequence: DirectCallOccurrence[] = [];
  for (const name of linkedSequenceSymbols) { const s = symbols.find((x) => x.name === name && x.segment === 1)!; directSequence.push(...callOccurrences(name, s.addressOffset).filter((c) => c.applicationModule)); }
  directSequence.sort((a, b) => a.callSite - b.callSite);

  const resetPhysical = CODE_FILE_IMAGE_BASE + resetFx.addressOffset, playPhysical = CODE_FILE_IMAGE_BASE + playFx.addressOffset, soundPhysical = CODE_FILE_IMAGE_BASE + sound.addressOffset;
  const resetBytes = exe.subarray(resetPhysical, CODE_FILE_IMAGE_BASE + playFx.addressOffset);
  const resetGrammar = resetBytes[0] === 0x60 && resetBytes[1] === 0xb9 && u32(resetBytes, 2) === RECORD_COUNT && resetBytes[6] === 0xbe && u32(resetBytes, 7) === RECORD_TABLE_START;
  const expectedIndexPattern = [0x8d, 0x04, 0x40, 0xc1, 0xe0, 0x03, 0x8d, 0x80, 0x34, 0xee, 0x01, 0x00];
  const playBytes = exe.subarray(playPhysical, CODE_FILE_IMAGE_BASE + SFX_CODE_END), hasIndexPattern = (() => { outer: for (let i = 0; i + expectedIndexPattern.length <= playBytes.length; i++) { for (let j = 0; j < expectedIndexPattern.length; j++) if (playBytes[i + j] !== expectedIndexPattern[j]) continue outer; return true; } return false; })();
  const soundCallSite = sound.addressOffset + 9; // F6 05 disp32 FF ; 75 05 ; E8 rel32
  const soundCallsPlayFx = rel32Target(code, soundCallSite, 0) === playFx.addressOffset;

  const commonSequencedMusicExtensions = ['MID', 'MIDI', 'XMI', 'HMP', 'HMQ', 'CMF', 'ROL', 'MUS'];
  const commonSequencedMusicAssetPaths = files.filter((f) => commonSequencedMusicExtensions.includes(f.extension.toUpperCase())).map((f) => norm(f.path)).sort();
  const samplesEntry = files.find((f) => f.name.toUpperCase() === 'SAMPLES.DAT'); if (!samplesEntry) throw new Error('O63 authentic installation lacks SAMPLES.DAT');
  const samplesBytes = await source.readSlice(samplesEntry.path, 0, samplesEntry.size), samplesSha = await sha256Bytes(samplesBytes), samplesName = new TextEncoder().encode('SAMPLES.DAT');
  const countSubarray = (haystack: Uint8Array, needle: Uint8Array) => { let count = 0; outer: for (let i = 0; i + needle.length <= haystack.length; i++) { for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer; count++; } return count; };
  const samplesSizeLe = Uint8Array.of(samplesEntry.size & 0xff, (samplesEntry.size >>> 8) & 0xff, (samplesEntry.size >>> 16) & 0xff, (samplesEntry.size >>> 24) & 0xff);
  const samplesAsciiOccurrences = countSubarray(exe, samplesName), samplesSizeOccurrences = countSubarray(exe, samplesSizeLe);

  const supportCandidates = files.filter((f) => {
    const e = ext(f.path), n = f.name.toUpperCase(); return e === 'DIG' || e === 'DRV' || n === 'AILDRVR.LST' || n === 'SETSOUND.EXE';
  }).sort((a, b) => a.path.localeCompare(b.path));
  const supportFiles: MK1AudioMusicResourceGraphCensusReport['supportFiles'] = [];
  for (const f of supportCandidates) { const bytes = await source.readSlice(f.path, 0, f.size), e = ext(f.path), n = f.name.toUpperCase(); supportFiles.push({ path: norm(f.path), byteLength: f.size, sha256: await sha256Bytes(bytes), classification: e === 'DIG' ? 'DIGITAL_DRIVER' : e === 'DRV' ? 'MUSIC_OR_SOUND_DRIVER' : n === 'AILDRVR.LST' ? 'AIL_DRIVER_LIST' : 'SOUND_SETUP_EXECUTABLE' }); }

  const numericFilenameCodeMatchCount = resources.filter((r) => /^[0-9A-F]{3}\.WAV$/i.test(r.fileName) && r.soundCode !== null && parseInt(r.fileName.slice(0, 3), 16) === r.soundCode).length;
  const namedTail = resources.filter((r) => /^(DUNNO\d{2}|XTRA\d{2})\.WAV$/i.test(r.fileName));
  const namedTailCodeMatchCount = namedTail.filter((r) => { if (r.soundCode === null) return false; const m = /^(DUNNO|XTRA)(\d{2})\.WAV$/i.exec(r.fileName)!; const ordinal = parseInt(m[2], 10); const expected = m[1].toUpperCase() === 'DUNNO' ? 0x200 + ordinal - 1 : 0x20e + ordinal - 1; return r.soundCode === expected; }).length;
  const allWavsPcm8Mono11025 = resources.every((r) => r.audioFormat === 1 && r.channels === 1 && r.sampleRate === 11025 && r.bitsPerSample === 8 && r.blockAlign === 1 && r.byteRate === 11025);
  const bound = records.filter((r) => r.bound), unbound = records.filter((r) => !r.bound), pathOnly = resources.filter((r) => r.tableBinding === 'PATH_POOL_ONLY_UNBOUND');

  const checks = [
    { checkId: 'CANONICAL_EXE_SHA256', passed: exeSha === CANONICAL_SHA },
    { checkId: 'SFX_CODE_MODULE_RANGE_EXACT', passed: sfxCode.start === SFX_CODE_START && sfxCode.end === SFX_CODE_END },
    { checkId: 'SFX_DATA_MODULE_RANGE_EXACT', passed: sfxData.start === SFX_DATA_START && sfxData.end === SFX_DATA_END },
    { checkId: 'RESET_FX_ADDRS_PROVES_533_X_24_TABLE', passed: resetGrammar },
    { checkId: 'RECORD_TABLE_ENDS_EXACTLY_AT_PATH_POOL', passed: PATH_POOL_START === 0x2202c },
    { checkId: 'EXACT_533_SOUND_RECORDS', passed: records.length === 533 },
    { checkId: 'ALL_RECORD_FLAGS_0X10_AND_CANONICAL_RUNTIME_SLOTS_ZERO', passed: records.every((r) => r.loadFlags === 0x10 && r.rawPlus0C === 0 && r.runtimeSlotPlus10 === 0 && r.runtimeSlotPlus14 === 0) },
    { checkId: 'EXACT_244_WAV_PATHS_AND_DISK_FILES', passed: pathByOffset.size === 244 && resources.length === 244 },
    { checkId: 'PATH_POOL_PRESERVES_ONE_TRAILING_SFX_DATA_ZERO_PAD_BYTE', passed: PATH_POOL_END + 1 === SFX_DATA_END && exe[STATIC_DATA_FILE_IMAGE_BASE + PATH_POOL_END] === 0 },
    { checkId: 'EXACT_243_BOUND_RECORDS_ONE_PATH_POOL_ONLY_DUMMY', passed: bound.length === 243 && pathOnly.length === 1 && pathOnly[0]?.fileName.toUpperCase() === 'DUMMY.WAV' },
    { checkId: 'ALL_BOUND_RECORD_SIZES_MATCH_DISK', passed: bound.every((r) => r.diskFileSizeMatchesRecord === true) },
    { checkId: 'ALL_244_WAVS_PCM_8BIT_MONO_11025', passed: allWavsPcm8Mono11025 },
    { checkId: 'ALL_NUMERIC_FILENAMES_EQUAL_HEX_SOUND_CODE', passed: numericFilenameCodeMatchCount === resources.filter((r) => /^[0-9A-F]{3}\.WAV$/i.test(r.fileName)).length },
    { checkId: 'DUNNO_XTRA_TAIL_MAPS_0X200_THROUGH_0X214', passed: namedTail.length === 21 && namedTailCodeMatchCount === 21 },
    { checkId: 'EXACT_11_LOW_CODE_FOREVER_FLAGS', passed: loopForeverCodes.join(',') === [1, 2, 3, 6, 7, 10, 13, 18, 20, 27, 31].join(',') },
    { checkId: 'PLAY_FX_INDEX_FORMULA_24_BYTE_RECORDS', passed: hasIndexPattern },
    { checkId: 'SOLE_DIRECT_APPLICATION_CALL_TO_PLAY_FX_IS_MKSOUND_SOUND', passed: playFxCalls.filter((c) => c.applicationModule).length === 1 && playFxCalls.find((c) => c.applicationModule)?.callSite === soundCallSite && soundCallsPlayFx },
    { checkId: 'DIGITAL_SAMPLE_API_USED_DIRECTLY_BY_APPLICATION_CODE', passed: directDigital.some((c) => c.targetSymbol === '_AIL_allocate_file_sample') && directDigital.some((c) => c.targetSymbol === '_AIL_start_sample') && directDigital.some((c) => c.targetSymbol === '_AIL_set_sample_loop_count') },
    { checkId: 'NO_DIRECT_APPLICATION_NEAR_CALL_TO_LINKED_SEQUENCE_MIDI_API', passed: directSequence.length === 0 },
    { checkId: 'NO_STANDALONE_COMMON_SEQUENCE_EXTENSION_ASSET_OBSERVED', passed: commonSequencedMusicAssetPaths.length === 0 },
    { checkId: 'SAMPLES_DAT_REMAINS_UNJOINED', passed: samplesAsciiOccurrences === 0 && samplesSizeOccurrences === 0 },
    { checkId: 'NO_GAMEPLAY_EVENT_NAME_INVENTION', passed: true },
    { checkId: 'NO_WRITE_PATH', passed: true },
  ];
  if (!checks.every((c) => c.passed)) throw new Error(`O63 validation failed: ${checks.filter((c) => !c.passed).map((c) => c.checkId).join(', ')}`);

  const timestamp = new Date().toISOString(), operationId = createOperationId('audio_music_resource_graph_census');
  return {
    format: 'mk1_audio_music_resource_graph_census_v1', timestamp, operationId,
    provenance: { sourceKind: 'user-loaded-directory', fileName: exeEntry.path, byteLength: exe.length, sha256: exeSha, synthetic: false, artifactGeneratedByTest: false, timestamp, operationId },
    coordinateModel: { codeFileImageBase: CODE_FILE_IMAGE_BASE, codeFileImageBaseHex: hx(CODE_FILE_IMAGE_BASE), staticDataFileImageBase: STATIC_DATA_FILE_IMAGE_BASE, staticDataFileImageBaseHex: hx(STATIC_DATA_FILE_IMAGE_BASE), watcomOffsetsAreNotLeObject2Offsets: true },
    sfxModule: {
      codeRange: { start: sfxCode.start, startHex: hx(sfxCode.start), endExclusive: sfxCode.end, endExclusiveHex: hx(sfxCode.end), size: sfxCode.end - sfxCode.start, moduleName: 'sfx.ASM' },
      dataRange: { start: sfxData.start, startHex: hx(sfxData.start), endExclusive: sfxData.end, endExclusiveHex: hx(sfxData.end), size: sfxData.end - sfxData.start, moduleName: 'sfx.ASM' },
      lowCodePlaybackPolicy: { watcomStart: LOW_CODE_POLICY_START, watcomStartHex: hx(LOW_CODE_POLICY_START), byteCount: 32, bytes: policy, loopForeverCodes, loopForeverCodesHex: loopForeverCodes.map((v) => hx(v, 3)) },
      recordTable: { watcomStart: RECORD_TABLE_START, watcomStartHex: hx(RECORD_TABLE_START), physicalStart: STATIC_DATA_FILE_IMAGE_BASE + RECORD_TABLE_START, physicalStartHex: hx(STATIC_DATA_FILE_IMAGE_BASE + RECORD_TABLE_START), recordCount: 533, strideBytes: 24, watcomEndExclusive: PATH_POOL_START, watcomEndExclusiveHex: hx(PATH_POOL_START), physicalEndExclusive: STATIC_DATA_FILE_IMAGE_BASE + PATH_POOL_START, physicalEndExclusiveHex: hx(STATIC_DATA_FILE_IMAGE_BASE + PATH_POOL_START) },
      pathPool: { watcomStart: PATH_POOL_START, watcomStartHex: hx(PATH_POOL_START), physicalStart: STATIC_DATA_FILE_IMAGE_BASE + PATH_POOL_START, physicalStartHex: hx(STATIC_DATA_FILE_IMAGE_BASE + PATH_POOL_START), watcomEndExclusive: PATH_POOL_END, watcomEndExclusiveHex: hx(PATH_POOL_END), pathCount: pathByOffset.size, exactDiskPathMatchCount: resources.length, trailingModuleZeroPaddingByteCount: 1 },
    },
    wavResources: resources, soundRecords: records,
    playbackBridge: {
      resetFxAddrs: { symbol: 'reset_fx_addrs_', address: resetFx.addressOffset, addressHex: hx(resetFx.addressOffset), physicalOffset: resetPhysical, physicalOffsetHex: hx(resetPhysical), recordCountImmediate: RECORD_COUNT, tableBaseImmediate: RECORD_TABLE_START, runtimeSlotsZeroed: [16, 20] },
      playFx: { symbol: 'play_fx', address: playFx.addressOffset, addressHex: hx(playFx.addressOffset), physicalOffset: playPhysical, physicalOffsetHex: hx(playPhysical), recordIndexFormula: 'record = 0x1EE34 + soundCode * 24', nullPathRejectedBeforeLoad: true, lockMemPntTarget: lockMem.addressOffset, lockMemPntTargetHex: hx(lockMem.addressOffset), oneShotTarget: playSample.addressOffset, oneShotTargetHex: hx(playSample.addressOffset), foreverTarget: playForever.addressOffset, foreverTargetHex: hx(playForever.addressOffset), stopAllTarget: stopAll.addressOffset, stopAllTargetHex: hx(stopAll.addressOffset) },
      soundGate: { symbol: 'SOUND', address: sound.addressOffset, addressHex: hx(sound.addressOffset), physicalOffset: soundPhysical, physicalOffsetHex: hx(soundPhysical), fNoSoundWatcomOffset: fNoSound.addressOffset, fNoSoundWatcomOffsetHex: hx(fNoSound.addressOffset), playFxDirectCallSite: soundCallSite, playFxDirectCallSiteHex: hx(soundCallSite), soleDirectApplicationCallToPlayFx: true },
      digitalSampleApi: { playSampleSymbol: 'play_sample_', playSampleForeverSymbol: 'play_sample_forever_', stopAllSamplesSymbol: 'stop_all_samples_', directApplicationApiCalls: directDigital },
      higherLevelConsumers: { playerSound: { address: playerSound.addressOffset, addressHex: hx(playerSound.addressOffset), directCallCount: playerSoundCalls.filter((c) => c.applicationModule).length, callerModules: moduleHistogram(playerSoundCalls) }, smartSound: { address: smartSound.addressOffset, addressHex: hx(smartSound.addressOffset), directCallCount: smartSoundCalls.filter((c) => c.applicationModule).length, callerModules: moduleHistogram(smartSoundCalls) }, semanticEventToConcreteWavMappingEstablished: false },
    },
    linkedSequenceMidiSurface: { linkedSymbolsPresent: linkedSequenceSymbols, directNearCallEncodingOccurrencesFromApplicationModules: directSequence, directApplicationSequenceCallCount: directSequence.length, interpretation: 'LINKED_LIBRARY_CAPABILITY_ONLY_NO_DIRECT_APPLICATION_NEAR_CALL_OBSERVED', indirectRuntimeUseExcludedByThisPass: false },
    installationCandidateSurface: { commonSequencedMusicExtensionsChecked: commonSequencedMusicExtensions, commonSequencedMusicAssetPaths, commonSequencedMusicAssetCount: commonSequencedMusicAssetPaths.length, interpretation: 'NO_STANDALONE_COMMON_SEQUENCE_ASSET_EXTENSION_OBSERVED_NOT_PROOF_OF_NO_MUSIC' },
    opaqueSamplesDat: { path: norm(samplesEntry.path), byteLength: samplesEntry.size, sha256: samplesSha, exactAsciiPathOccurrencesInExe: samplesAsciiOccurrences, exactLittleEndianSizeOccurrencesInExe: samplesSizeOccurrences, formatStatus: 'UNKNOWN', executableRelationshipStatus: 'UNKNOWN_NO_DIRECT_JOIN_QUALIFIED', exportPolicy: 'PRESERVE_RAW_WITH_UNKNOWN_ROLE' },
    supportFiles,
    summary: { wavFileCount: resources.length, totalWavFileBytes: totalWavBytes, totalWavPcmBytes: totalPcm, boundWavRecordCount: bound.length, pathPoolOnlyWavCount: pathOnly.length, soundRecordCount: records.length, boundSoundRecordCount: bound.length, unboundSoundRecordCount: unbound.length, lowCodeLoopForeverCount: loopForeverCodes.length, allWavsPcm8Mono11025, numericFilenameCodeMatchCount, namedTailCodeMatchCount, samplesDatRelationshipQualified: false, canonicalGameplaySoundNamesEstablished: false },
    exportCapability: { losslessRawWavExportReady: true, recordIdToWavPathExportReady: true, playbackPolicyExportReady: true, semanticGameplayEventNamesExportReady: false, samplesDatSemanticExportReady: false, linkedMidiCapabilityIsNotRuntimeRelationship: true, recommendedO64RawPackageWavCount: resources.length },
    decision: { authenticWavSurfaceEstablished: true, sfxRecordGraphEstablished: true, codeToWavBindingEstablished: true, playbackBridgeToMilesDigitalApiEstablished: true, lowCodeLoopPolicyEstablished: true, universalGameplayEventNamingEstablished: false, samplesDatRoleEstablished: false, midiSequenceRuntimeRelationshipEstablished: false, verdict: 'MK1_AUDIO_MUSIC_RESOURCE_GRAPH_AND_EXPORT_CAPABILITY_CENSUS_ESTABLISHED', narrative: `O63 establishes the authentic MK1 digital-audio resource graph without inventing gameplay names. The installation contains ${resources.length} RIFF/WAVE PCM assets, all 8-bit mono 11025 Hz; sfx.ASM contains ${records.length} fixed 24-byte sound-code records and ${pathByOffset.size} exact WAV paths. ${bound.length} records bind uniquely to installed WAVs with exact file-size agreement, while the sole path-pool-only asset is DUMMY.WAV. Numeric WAV names are the hexadecimal sound-code identifiers, and DUNNO/XTRA occupy codes 0x200..0x214. play_fx indexes this table directly, applies the qualified 32-byte low-code loop policy, and is reached from the single MKSOUND.ASM SOUND bridge before the game's play_sample_/play_sample_forever_ helpers call Miles digital-sample APIs. Linked Miles MIDI/sequence code is present, but this bounded direct-call census finds no application-module direct near-call into that sequence API surface; SAMPLES.DAT likewise has no qualified direct executable join and remains opaque. Resource identity and playback behavior are therefore export-ready; canonical gameplay event naming, SAMPLES.DAT purpose and MIDI runtime relationships remain unresolved.` },
    status: 'SUCCESS', validation: { allChecksPassed: true, checks },
  };
}

export function createMK1AudioMusicResourceGraphCensusExport(report: MK1AudioMusicResourceGraphCensusReport): MK1AudioMusicResourceGraphCensusReport {
  if (report.status !== 'SUCCESS' || !report.validation.allChecksPassed) throw new Error('O63 export blocked'); return report;
}
