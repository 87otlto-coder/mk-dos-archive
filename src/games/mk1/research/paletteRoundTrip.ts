import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { FixtureProvenance } from '../../../core/executable/watcomDebug/watcomDebugTypes';
import { MK1WatcomDataImagePaletteGroundTruthReport } from './watcomDataImagePaletteGroundTruthTypes';
import { MK1PaletteSetupTransferSemanticsReport } from './paletteSetupTransferSemanticsTypes';
import { createMK1WatcomDataImagePaletteGroundTruthExport } from './watcomDataImagePaletteGroundTruth';
import { createMK1PaletteSetupTransferSemanticsExport } from './paletteSetupTransferSemantics';
import { PaletteModuleIR, parsePaletteModule, serializePaletteModule, compareBytes, rebuildWithPaletteModule, bytesToHex, bytesFromHex, sha256Bytes } from './paletteRoundTripCodec';

export interface PaletteRoundTripReport {
  format: 'mk1_palette_round_trip_v1';
  timestamp: string;
  operationId: string;
  provenance: FixtureProvenance;
  prerequisite: {
    groundTruthOperationId: string;
    transferOperationId: string;
    groundTruthPassed: boolean;
    transferPassed: boolean;
    groundTruthSha256: string;
    transferSha256: string;
  };
  module: {
    name: 'NEWPALS.ASM';
    segment: 2;
    staticDataBase: number;
    watcomStart: number;
    physicalStart: number;
    physicalEnd: number;
    byteLength: number;
    originalBytesHex: string;
    originalSha256: string;
    serializedSha256: string;
  };
  ir: PaletteModuleIR;
  /** Aliases are annotations on distinct addresses; equal contents are never merged. */
  groundTruthRecords: Array<{
    recordIndex: number;
    physicalStart: number;
    physicalEnd: number;
    watcomStart: number;
    declaredLength: number;
    rawColorWords: number[];
    symbolNames: string[];
    symbolGlobalIndices: number[];
    duplicateContentOfRecordIndex: number | null;
  }>;
  comparison: {
    module: ReturnType<typeof compareBytes>;
    wholeExecutable: ReturnType<typeof compareBytes>;
    outsideModule: ReturnType<typeof compareBytes>;
    recordsCompared: number;
    recordsMatching: number;
    originalExeSha256: string;
    rebuiltExeSha256: string;
    originalExeSize: number;
    rebuiltExeSize: number;
  };
  status: 'SUCCESS' | 'FAILED';
  decision: {
    verdict: 'LOSSLESS_PALETTE_ROUND_TRIP_ESTABLISHED' | 'PALETTE_ROUND_TRIP_FAILED';
    scope: 'NEWPALS_NO_EDIT_ROUND_TRIP';
    editedExecutableValidated: false;
    runtimeTestPerformed: false;
    narrative: string;
  };
}

function isReal(p: FixtureProvenance): boolean {
  return p.synthetic === false && p.artifactGeneratedByTest === false && p.sourceKind === 'user-loaded-directory'
    && typeof p.sha256 === 'string' && /^[0-9a-f]{64}$/.test(p.sha256) && !/^0{64}$/.test(p.sha256);
}

function matchingRecords(report: Pick<PaletteRoundTripReport, 'ir' | 'module' | 'groundTruthRecords'>): number {
  return report.ir.records.filter((record, i) => {
    const gt = report.groundTruthRecords[i];
    return gt && gt.recordIndex === i && gt.physicalStart === report.module.physicalStart + record.relativeOffset
      && gt.physicalEnd === gt.physicalStart + 2 + record.declaredLength * 2
      && gt.watcomStart === report.module.watcomStart + record.relativeOffset
      && gt.declaredLength === record.declaredLength && gt.rawColorWords.length === record.rawColorWords.length
      && record.rawColorWords.every((word, n) => word === gt.rawColorWords[n]);
  }).length;
}

export async function executePaletteRoundTrip(source: DirectorySource, options: {
  groundTruthReport: MK1WatcomDataImagePaletteGroundTruthReport;
  transferReport: MK1PaletteSetupTransferSemanticsReport;
  onProgress?: (stage: string, progress: number) => void;
}): Promise<PaletteRoundTripReport> {
  if (source.isSynthetic !== false) throw new Error('1E.3H requires an authentic user-loaded directory');
  const gt = options.groundTruthReport;
  const transfer = options.transferReport;
  options.onProgress?.('Checking palette round-trip prerequisites', 0.05);
  if (!isReal(gt.provenance) || !isReal(transfer.provenance)) throw new Error('1E.3H requires authentic prerequisite provenance');
  const gtPassed = createMK1WatcomDataImagePaletteGroundTruthExport(gt).validation.allChecksPassed;
  const transferPassed = createMK1PaletteSetupTransferSemanticsExport(transfer).validation.allChecksPassed;
  if (!gtPassed || !transferPassed || gt.status !== 'SUCCESS' || transfer.status !== 'SUCCESS') throw new Error('1E.3H prerequisite validation failed');
  const module = gt.paletteModule;
  const base = gt.staticDataBaseQualification.qualifiedBase;
  if (!module || module.moduleName.toUpperCase() !== 'NEWPALS.ASM' || module.segment !== 2 || base === null
      || transfer.staticDataBase !== base || !gt.moduleTiling?.exactTiling) throw new Error('1E.3H requires the qualified, exactly tiled NEWPALS module');
  if (gt.provenance.sha256 !== transfer.provenance.sha256 || gt.fixture.exePath !== transfer.fixture.exePath
      || gt.fixture.exeSize !== transfer.fixture.exeSize || transfer.provenance.byteLength !== gt.fixture.exeSize) throw new Error('1E.3H prerequisites identify different executables');
  const files = await source.listRecursive();
  const entry = files.find(file => file.path === gt.fixture.exePath);
  if (!entry || entry.size !== gt.fixture.exeSize) throw new Error('Loaded executable size/path changed since prerequisite analysis');
  const original = await source.readSlice(entry.path, 0, entry.size);
  if (original.length !== entry.size) throw new Error('Incomplete executable read');
  const originalHash = await sha256Bytes(original);
  if (originalHash !== gt.provenance.sha256) throw new Error('Loaded executable SHA-256 changed since prerequisite analysis');
  const start = base + module.startOffset;
  const end = base + module.endOffset;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end > original.length || end <= start
      || end - start !== module.size) throw new Error('NEWPALS module bounds are inconsistent');
  options.onProgress?.('Parsing and regenerating NEWPALS words', 0.35);
  const originalModule = original.slice(start, end);
  const ir = parsePaletteModule(originalModule);
  // JSON is the persistence boundary: serialize the deserialized typed fields.
  const persistedIR: PaletteModuleIR = JSON.parse(JSON.stringify(ir));
  const serialized = serializePaletteModule(persistedIR);
  const rebuilt = rebuildWithPaletteModule(original, start, end, serialized);
  const outsideOriginal = new Uint8Array(original.length - originalModule.length);
  outsideOriginal.set(original.subarray(0, start)); outsideOriginal.set(original.subarray(end), start);
  const outsideRebuilt = new Uint8Array(rebuilt.length - serialized.length);
  outsideRebuilt.set(rebuilt.subarray(0, start)); outsideRebuilt.set(rebuilt.subarray(end), start);
  const timestamp = new Date().toISOString();
  const operationId = createOperationId('palette_round_trip');
  const report: PaletteRoundTripReport = {
    format: 'mk1_palette_round_trip_v1', timestamp, operationId,
    provenance: { ...gt.provenance, sha256: originalHash, timestamp, operationId },
    prerequisite: { groundTruthOperationId: gt.operationId, transferOperationId: transfer.operationId,
      groundTruthPassed: gtPassed, transferPassed, groundTruthSha256: gt.provenance.sha256!, transferSha256: transfer.provenance.sha256! },
    module: { name: 'NEWPALS.ASM', segment: 2, staticDataBase: base, watcomStart: module.startOffset,
      physicalStart: start, physicalEnd: end, byteLength: originalModule.length,
      originalBytesHex: bytesToHex(originalModule), originalSha256: await sha256Bytes(originalModule), serializedSha256: await sha256Bytes(serialized) },
    ir: persistedIR,
    groundTruthRecords: gt.paletteRecords.map(record => ({ recordIndex: record.recordIndex,
      physicalStart: record.physicalFileOffset, physicalEnd: record.physicalEndOffset, watcomStart: record.watcomStartOffset,
      declaredLength: record.declaredLength, rawColorWords: [...record.rawColorWords], symbolNames: [...record.symbolNames],
      symbolGlobalIndices: [...record.symbolGlobalIndices], duplicateContentOfRecordIndex: record.duplicateContentOfRecordIndex })),
    comparison: {
      module: compareBytes(originalModule, serialized), wholeExecutable: compareBytes(original, rebuilt),
      outsideModule: compareBytes(outsideOriginal, outsideRebuilt), recordsCompared: ir.records.length, recordsMatching: 0,
      originalExeSha256: originalHash, rebuiltExeSha256: await sha256Bytes(rebuilt), originalExeSize: original.length, rebuiltExeSize: rebuilt.length,
    },
    status: 'FAILED',
    decision: { verdict: 'PALETTE_ROUND_TRIP_FAILED', scope: 'NEWPALS_NO_EDIT_ROUND_TRIP', editedExecutableValidated: false,
      runtimeTestPerformed: false, narrative: 'No-edit serialization validation incomplete.' },
  };
  report.comparison.recordsMatching = matchingRecords(report);
  options.onProgress?.('Checking every regenerated byte and full executable hash', 0.8);
  const checks = await validateRoundTrip(report);
  if (checks.every(check => check.passed)) {
    report.status = 'SUCCESS';
    report.decision.verdict = 'LOSSLESS_PALETTE_ROUND_TRIP_ESTABLISHED';
    report.decision.narrative = 'NEWPALS headers and raw color words survive JSON persistence and regenerate byte-for-byte. Reinserting the regenerated module into an in-memory executable copy preserves its entire byte sequence and SHA-256. This pass validates no-edit serialization only.';
  }
  options.onProgress?.('Palette round-trip analysis complete', 1);
  return report;
}

/** Recompute module checks at export time, rather than trusting cached flags. */
async function validateRoundTrip(report: PaletteRoundTripReport) {
  const original = bytesFromHex(report.module.originalBytesHex);
  const serialized = serializePaletteModule(report.ir);
  const cmp = compareBytes(original, serialized);
  const count = matchingRecords(report);
  const c = report.comparison;
  const m = report.module;
  const p = report.prerequisite;
  const zero = (value: ReturnType<typeof compareBytes>) => value.equal === true && value.mismatchCount === 0 && value.firstMismatch === null;
  const check = (checkId: string, passed: boolean, detail: string) => ({ checkId, passed, detail });
  return [
    check('PROVENANCE_REAL_USER_LOADED', isReal(report.provenance), report.provenance.sourceKind),
    check('OPERATION_ID_CONSISTENT', report.operationId.startsWith('palette_round_trip-') && report.operationId === report.provenance.operationId, report.operationId),
    check('PREREQUISITES_SAME_FIXTURE', p.groundTruthPassed && p.transferPassed && p.groundTruthSha256 === report.provenance.sha256 && p.transferSha256 === report.provenance.sha256, '1E.3D.1 and 1E.3G fixture identity'),
    check('EXACT_MODULE_BOUNDS', m.name === 'NEWPALS.ASM' && m.segment === 2 && Number.isSafeInteger(m.physicalStart) && m.physicalStart >= 0 && m.physicalEnd <= c.originalExeSize
      && m.physicalStart === m.staticDataBase + m.watcomStart && m.physicalEnd - m.physicalStart === original.length && m.byteLength === original.length, `${m.physicalStart}..${m.physicalEnd}`),
    check('ALL_GROUND_TRUTH_RECORDS_MATCH', count === report.ir.records.length && count === report.groundTruthRecords.length
      && count === c.recordsCompared && count === c.recordsMatching, `${count}/${report.groundTruthRecords.length}`),
    check('MODULE_BYTES_IDENTICAL', zero(cmp) && zero(c.module), `${cmp.mismatchCount} differing bytes`),
    check('MODULE_HASHES_RECOMPUTED', await sha256Bytes(original) === m.originalSha256 && await sha256Bytes(serialized) === m.serializedSha256 && m.originalSha256 === m.serializedSha256, m.originalSha256),
    check('WHOLE_EXECUTABLE_IDENTICAL', zero(c.wholeExecutable) && c.originalExeSize === c.rebuiltExeSize && c.originalExeSize === report.provenance.byteLength
      && c.originalExeSha256 === report.provenance.sha256 && c.rebuiltExeSha256 === c.originalExeSha256, c.rebuiltExeSha256),
    check('OUTSIDE_MODULE_UNCHANGED', zero(c.outsideModule), `${c.outsideModule.mismatchCount} differing bytes`),
    check('SCOPE_LIMITED_TO_NO_EDIT', report.decision.scope === 'NEWPALS_NO_EDIT_ROUND_TRIP' && report.decision.editedExecutableValidated === false && report.decision.runtimeTestPerformed === false, 'No-edit reconstruction in memory; runtime not tested'),
  ];
}

export async function createMK1PaletteRoundTripExport(report: PaletteRoundTripReport) {
  const checks = await validateRoundTrip(report);
  if (report.status !== 'SUCCESS' || report.decision.verdict !== 'LOSSLESS_PALETTE_ROUND_TRIP_ESTABLISHED' || !checks.every(check => check.passed)) {
    throw new Error(`Authoritative 1E.3H export blocked: ${checks.filter(check => !check.passed).map(check => check.checkId).join(', ') || report.status}`);
  }
  return {
    metadata: { name: 'MK1 Lossless Palette Round Trip', version: '1.0.0', milestone: 'Pass 1E.3H', formatVersion: report.format, exportTimestamp: report.timestamp },
    ...report, validation: { allChecksPassed: true, checks },
  };
}
