import { DirectorySource, SourceFileEntry } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import type { MK2FixtureResourceExecutableTopologyReport } from './fixtureResourceExecutableTopology';

const EXPECTED_GMI_SHA256 = '7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633';
const HEADER_BYTES = 32;
const EXPECTED_EXCEPTION_BASENAMES = new Set(['GONG.U8','LIU-KANG.U8','THUNDER.U8','THUNDSHT.U8']);

function u16(v: DataView, off: number): number { return v.getUint16(off, true); }
function u32(v: DataView, off: number): number { return v.getUint32(off, true); }
async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes.slice().buffer);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
function basename(path: string): string { return path.split('/').at(-1) ?? path; }
function findEntry(entries: SourceFileEntry[], wanted: string): SourceFileEntry {
  const entry = entries.find(candidate => candidate.path.toUpperCase() === wanted.toUpperCase());
  if (!entry) throw new Error(`Required MK2 file missing: ${wanted}`);
  return entry;
}

export type U8DiskEndConvention = 'PAYLOAD_BYTES_MINUS_ONE' | 'FILE_BYTES_MINUS_ONE' | 'OTHER';

export interface MK2U8FileObservation {
  path: string;
  fileBytes: number;
  dataStartField: number;
  endField: number;
  loopStartField: number;
  dword12: number;
  sourceRateField: number;
  referencePitchField: number;
  dword20: number;
  dword24: number;
  dword28: number;
  payloadBytesAfterHeader: number;
  payloadMinusOneDelta: number;
  endConvention: U8DiskEndConvention;
}

export interface MK2U8DigitalAudioReconnaissanceReport {
  format: 'mk2_u8_digital_audio_reconnaissance_v1';
  timestamp: string;
  operationId: string;
  provenance: {
    sourceKind: 'user-loaded-directory';
    directoryName: string;
    mk2ExeSha256: string;
    gmiPath: string;
    gmiByteLength: number;
    gmiSha256: string;
    synthetic: false;
  };
  corpus: {
    fileCount: number;
    headerBytes: 32;
    sourceRateCounts: Record<string, number>;
    referencePitchCounts: Record<string, number>;
    endConventionCounts: Record<U8DiskEndConvention, number>;
    fileBytesMin: number;
    fileBytesMax: number;
    observations: MK2U8FileObservation[];
    exceptionalFiles: MK2U8FileObservation[];
  };
  driverContract: {
    evidenceIdentity: 'GMI.BIN_SHA256_BOUND_TO_2026_10_07_DISASSEMBLY';
    sampleStartRoutine: '0x0F03';
    mixerRoutine: '0x0CF3';
    completionRoutine: '0x0E9C';
    pitchRoutine: '0x0AFD';
    runtimeDescriptor: {
      field0: 'RELATIVE_DATA_START_LOW_WORD_ADDED_TO_DESCRIPTOR_BASE';
      field4: 'RUNTIME_END_LIMIT_LOW_WORD_COPIED_WITHOUT_BASE_ADD';
      field8: 'OPTIONAL_RELATIVE_LOOP_RESTART_LOW_WORD_ADDED_TO_DESCRIPTOR_BASE';
      field16: 'PITCH_RATIO_NUMERATOR_INPUT_SOURCE_RATE_CANDIDATE';
      field18: 'PITCH_RATIO_DENOMINATOR_INPUT_REFERENCE_PITCH_CANDIDATE';
      highWords2And6: 'SKIPPED_BY_16_BIT_SAMPLE_START_ROUTINE';
    };
    mixer: {
      activeCondition: 'CURRENT_OFFSET_LT_END_LIMIT';
      loopBehavior: 'WHEN_CURRENT_REACHES_END_USE_NONZERO_LOOP_RESTART_ELSE_FINISH';
      pcmRead: 'SIGNED_8_BIT_SAMPLE_BYTE';
      volumeMath: 'SIGNED_IMUL_SAMPLE_BY_VOLUME';
      outputConversion: 'MIX_HIGH_BYTE_PLUS_0x80_TO_UNSIGNED_8_BIT_OUTPUT';
      step: '16_16_FIXED_POINT_POINTER_INCREMENT';
    };
    pitch: {
      defaultPlaybackRateObserved: 16000;
      sourceRateFieldOffset: 16;
      referencePitchFieldOffset: 18;
      note60UsedByDirectSampleStart: true;
      referencePitchMeaning: 'STRONGLY_INFERRED_REFERENCE_FREQUENCY_NOT_PROMOTED_TO_FILE_FORMAT_SEMANTIC_NAME';
    };
  };
  decision: {
    runtimeSignedPcmEstablished: true;
    runtimeDescriptorPointerEndLoopRolesEstablished: true;
    diskHeaderShapeEstablishedForCanonicalCorpus: true;
    twoDiskEndConventionsObserved: true;
    diskToRuntimeEndFieldTransformationEstablished: false;
    exactDiskPcmExportRangeEstablished: false;
    wavAdapterAuthorized: false;
    verdict: 'MK2_U8_RUNTIME_SAMPLE_CONTRACT_ESTABLISHED_DISK_TO_RUNTIME_RANGE_UNRESOLVED';
    narrative: string;
  };
  status: 'SUCCESS';
  validation: { allChecksPassed: true; checks: Array<{id:string;passed:boolean;detail:string}> };
}

export async function executeMK2U8DigitalAudioReconnaissance(
  source: DirectorySource,
  o67: MK2FixtureResourceExecutableTopologyReport,
): Promise<MK2U8DigitalAudioReconnaissanceReport> {
  if (source.isSynthetic) throw new Error('O92 requires the authentic user-loaded MK2 fixture');
  if (o67.status !== 'SUCCESS' || !o67.validation.allChecksPassed || o67.provenance.synthetic) {
    throw new Error('O92 requires a verified authentic O67 prerequisite');
  }

  const timestamp = new Date().toISOString();
  const operationId = createOperationId('mk2_u8_digital_audio_reconnaissance');
  const entries = (await source.listRecursive()).slice().sort((a,b)=>a.path.localeCompare(b.path));
  const u8Entries = entries.filter(entry => entry.path.toUpperCase().startsWith('FX/') && entry.extension.toUpperCase() === 'U8');
  const gmiEntry = findEntry(entries, 'GMI.BIN');
  const gmi = await source.readSlice(gmiEntry.path, 0, gmiEntry.size);
  const gmiSha256 = await sha256(gmi);
  if (gmiSha256 !== EXPECTED_GMI_SHA256) throw new Error(`Unexpected GMI.BIN SHA-256: ${gmiSha256}`);

  const observations: MK2U8FileObservation[] = [];
  for (const entry of u8Entries) {
    if (entry.size < HEADER_BYTES) throw new Error(`U8 file shorter than ${HEADER_BYTES}-byte header: ${entry.path}`);
    const header = await source.readSlice(entry.path, 0, HEADER_BYTES);
    if (header.length !== HEADER_BYTES) throw new Error(`Could not read full U8 header: ${entry.path}`);
    const v = new DataView(header.buffer, header.byteOffset, header.byteLength);
    const dataStartField = u32(v,0), endField=u32(v,4), loopStartField=u32(v,8), dword12=u32(v,12);
    const sourceRateField=u16(v,16), referencePitchField=u16(v,18), dword20=u32(v,20), dword24=u32(v,24), dword28=u32(v,28);
    const payloadBytesAfterHeader = entry.size - HEADER_BYTES;
    const payloadMinusOneDelta = payloadBytesAfterHeader - endField;
    let endConvention: U8DiskEndConvention = 'OTHER';
    if (endField === payloadBytesAfterHeader - 1) endConvention='PAYLOAD_BYTES_MINUS_ONE';
    else if (endField === entry.size - 1) endConvention='FILE_BYTES_MINUS_ONE';
    observations.push({path:entry.path,fileBytes:entry.size,dataStartField,endField,loopStartField,dword12,sourceRateField,referencePitchField,dword20,dword24,dword28,payloadBytesAfterHeader,payloadMinusOneDelta,endConvention});
  }

  const conventionCounts: Record<U8DiskEndConvention,number> = {PAYLOAD_BYTES_MINUS_ONE:0,FILE_BYTES_MINUS_ONE:0,OTHER:0};
  const sourceRateCounts: Record<string,number> = {}, referencePitchCounts: Record<string,number> = {};
  for (const row of observations) {
    conventionCounts[row.endConvention]++;
    sourceRateCounts[String(row.sourceRateField)] = (sourceRateCounts[String(row.sourceRateField)] ?? 0) + 1;
    referencePitchCounts[String(row.referencePitchField)] = (referencePitchCounts[String(row.referencePitchField)] ?? 0) + 1;
  }
  const exceptionalFiles = observations.filter(row => row.endConvention === 'FILE_BYTES_MINUS_ONE');
  const exceptionalNames = new Set(exceptionalFiles.map(row => basename(row.path).toUpperCase()));
  const fieldsZero = observations.every(row => row.loopStartField===0 && row.dword12===0 && row.dword20===0 && row.dword24===0 && row.dword28===0);
  const checks = [
    {id:'u8_count',passed:observations.length===312,detail:`U8 files=${observations.length}`},
    {id:'gmi_hash',passed:gmiSha256===EXPECTED_GMI_SHA256,detail:gmiSha256},
    {id:'data_start',passed:observations.every(row=>row.dataStartField===32),detail:'all dataStartField == 32'},
    {id:'zero_aux_fields',passed:fieldsZero,detail:'loop/+12/+20/+24/+28 dwords are zero across canonical corpus'},
    {id:'source_rates',passed:observations.every(row=>row.sourceRateField===11025||row.sourceRateField===22050),detail:JSON.stringify(sourceRateCounts)},
    {id:'reference_pitch',passed:observations.every(row=>row.referencePitchField===0x0106),detail:JSON.stringify(referencePitchCounts)},
    {id:'end_convention_partition',passed:conventionCounts.PAYLOAD_BYTES_MINUS_ONE===308&&conventionCounts.FILE_BYTES_MINUS_ONE===4&&conventionCounts.OTHER===0,detail:JSON.stringify(conventionCounts)},
    {id:'exception_identity',passed:exceptionalNames.size===EXPECTED_EXCEPTION_BASENAMES.size&&[...EXPECTED_EXCEPTION_BASENAMES].every(name=>exceptionalNames.has(name)),detail:[...exceptionalNames].sort().join(', ')},
  ];
  const failed = checks.filter(check=>!check.passed);
  if (failed.length) throw new Error(`O92 U8 corpus validation failed: ${failed.map(check=>check.id).join(', ')}`);

  const fileSizes=observations.map(row=>row.fileBytes);
  return {
    format:'mk2_u8_digital_audio_reconnaissance_v1',timestamp,operationId,
    provenance:{sourceKind:'user-loaded-directory',directoryName:source.directoryName,mk2ExeSha256:o67.provenance.exeSha256,gmiPath:gmiEntry.path,gmiByteLength:gmi.length,gmiSha256,synthetic:false},
    corpus:{fileCount:observations.length,headerBytes:HEADER_BYTES,sourceRateCounts,referencePitchCounts,endConventionCounts:conventionCounts,fileBytesMin:Math.min(...fileSizes),fileBytesMax:Math.max(...fileSizes),observations,exceptionalFiles},
    driverContract:{
      evidenceIdentity:'GMI.BIN_SHA256_BOUND_TO_2026_10_07_DISASSEMBLY',sampleStartRoutine:'0x0F03',mixerRoutine:'0x0CF3',completionRoutine:'0x0E9C',pitchRoutine:'0x0AFD',
      runtimeDescriptor:{field0:'RELATIVE_DATA_START_LOW_WORD_ADDED_TO_DESCRIPTOR_BASE',field4:'RUNTIME_END_LIMIT_LOW_WORD_COPIED_WITHOUT_BASE_ADD',field8:'OPTIONAL_RELATIVE_LOOP_RESTART_LOW_WORD_ADDED_TO_DESCRIPTOR_BASE',field16:'PITCH_RATIO_NUMERATOR_INPUT_SOURCE_RATE_CANDIDATE',field18:'PITCH_RATIO_DENOMINATOR_INPUT_REFERENCE_PITCH_CANDIDATE',highWords2And6:'SKIPPED_BY_16_BIT_SAMPLE_START_ROUTINE'},
      mixer:{activeCondition:'CURRENT_OFFSET_LT_END_LIMIT',loopBehavior:'WHEN_CURRENT_REACHES_END_USE_NONZERO_LOOP_RESTART_ELSE_FINISH',pcmRead:'SIGNED_8_BIT_SAMPLE_BYTE',volumeMath:'SIGNED_IMUL_SAMPLE_BY_VOLUME',outputConversion:'MIX_HIGH_BYTE_PLUS_0x80_TO_UNSIGNED_8_BIT_OUTPUT',step:'16_16_FIXED_POINT_POINTER_INCREMENT'},
      pitch:{defaultPlaybackRateObserved:16000,sourceRateFieldOffset:16,referencePitchFieldOffset:18,note60UsedByDirectSampleStart:true,referencePitchMeaning:'STRONGLY_INFERRED_REFERENCE_FREQUENCY_NOT_PROMOTED_TO_FILE_FORMAT_SEMANTIC_NAME'},
    },
    decision:{runtimeSignedPcmEstablished:true,runtimeDescriptorPointerEndLoopRolesEstablished:true,diskHeaderShapeEstablishedForCanonicalCorpus:true,twoDiskEndConventionsObserved:true,diskToRuntimeEndFieldTransformationEstablished:false,exactDiskPcmExportRangeEstablished:false,wavAdapterAuthorized:false,verdict:'MK2_U8_RUNTIME_SAMPLE_CONTRACT_ESTABLISHED_DISK_TO_RUNTIME_RANGE_UNRESOLVED',narrative:'The canonical MK2 corpus contains 312 32-byte-header U8 files. The Sound Images driver tied by exact GMI.BIN identity treats the runtime descriptor as relative data start (+0), absolute playback end/limit (+4), optional relative loop restart (+8), source-rate/pitch-ratio inputs (+16/+18), and reads signed 8-bit sample bytes before rebiasing mixed output by 0x80. The on-disk +4 field nevertheless exhibits two distinct canonical conventions: 308 files store payload-bytes-minus-one while four exact named files store file-bytes-minus-one. Because the MK2 executable loader path that transforms the disk header into the runtime descriptor has not yet been mechanically closed, O92 intentionally does not authorize a WAV adapter or select an exact PCM disk range.'},
    status:'SUCCESS',validation:{allChecksPassed:true,checks:checks.map(check=>({...check,passed:true}))},
  };
}

export function createMK2U8DigitalAudioReconnaissanceExport(report: MK2U8DigitalAudioReconnaissanceReport): MK2U8DigitalAudioReconnaissanceReport {
  if (report.status!=='SUCCESS'||!report.validation.allChecksPassed||report.provenance.synthetic) throw new Error('Verified O92 report required');
  if (report.decision.wavAdapterAuthorized || report.decision.exactDiskPcmExportRangeEstablished) throw new Error('O92 must remain fail-closed for WAV export');
  return report;
}
