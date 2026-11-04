import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { createMK1PaletteRoundTripExport, PaletteRoundTripReport } from './paletteRoundTrip';
import { sha256Bytes } from './paletteRoundTripCodec';
import { buildVerifiedPaletteEdit, PaletteWordEdit } from './paletteEditCodec';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';

export type KanoPaletteSymbol = 'KANO_P' | 'KANO3_P';
export type MainRosterPaletteSymbol =
  | 'GRIMM_P' | 'GRIMM3_P'
  | 'KANO_P' | 'KANO3_P'
  | 'RAIDEN_P' | 'RAIDEN3_P'
  | 'LUKANG_P' | 'LUKANG3_P'
  | 'YNINJA_P' | 'YNINJA3_P'
  | 'BNINJA_P' | 'BNINJA3_P'
  | 'LIZ_P' | 'LIZRED_P';
export type SpecialPaletteSymbol = 'GONGORO_P' | 'YANG_P';
export type PaletteEntryTargetSymbol = MainRosterPaletteSymbol | SpecialPaletteSymbol;
export type KanoPaletteEditorPass = '1E.3J' | '1E.3K';
export type PaletteEntryEditorPass = KanoPaletteEditorPass | '1E.3L' | '1E.3M' | '1E.3N' | '1E.3N.3';
type PaletteEntryEditPreset =
  | 'KANO_P_CUSTOM_ENTRIES_V1' | 'KANO3_P_CUSTOM_ENTRIES_V1'
  | 'GRIMM_P_CUSTOM_ENTRIES_V1' | 'GRIMM3_P_CUSTOM_ENTRIES_V1'
  | 'RAIDEN_P_CUSTOM_ENTRIES_V1' | 'RAIDEN3_P_CUSTOM_ENTRIES_V1'
  | 'LUKANG_P_CUSTOM_ENTRIES_V1' | 'LUKANG3_P_CUSTOM_ENTRIES_V1'
  | 'YNINJA_P_CUSTOM_ENTRIES_V1' | 'YNINJA3_P_CUSTOM_ENTRIES_V1'
  | 'BNINJA_P_CUSTOM_ENTRIES_V1' | 'BNINJA3_P_CUSTOM_ENTRIES_V1'
  | 'LIZ_P_CUSTOM_ENTRIES_V1' | 'LIZRED_P_CUSTOM_ENTRIES_V1'
  | 'GONGORO_P_CUSTOM_ENTRIES_V1'
  | 'YANG_EMP_P_CUSTOM_ENTRIES_V1';

export interface PaletteEntryTargetConfig {
  pass: PaletteEntryEditorPass;
  preset: PaletteEntryEditPreset;
  displayName: string;
  rosterName: 'CAGE' | 'KANO' | 'RAYDEN' | 'LIU KANG' | 'SCORPION' | 'SUB-ZERO' | 'SONYA' | 'GORO' | 'SHANG TSUNG' | null;
  variant: 'normal' | 'alternate' | 'shared';
  counterpartSymbol: PaletteEntryTargetSymbol;
  unresolvedSlotIndex?: number;
  testLabel: string;
}

const TARGET_CONFIG: Record<PaletteEntryTargetSymbol, PaletteEntryTargetConfig> = {
  GRIMM_P: {
    pass: '1E.3L', preset: 'GRIMM_P_CUSTOM_ENTRIES_V1', displayName: 'normal Johnny Cage palette',
    rosterName: 'CAGE', variant: 'normal', counterpartSymbol: 'GRIMM3_P', testLabel: 'Johnny Cage against a different fighter',
  },
  GRIMM3_P: {
    pass: '1E.3M', preset: 'GRIMM3_P_CUSTOM_ENTRIES_V1', displayName: 'alternate Johnny Cage palette',
    rosterName: 'CAGE', variant: 'alternate', counterpartSymbol: 'GRIMM_P', testLabel: 'Johnny Cage versus Johnny Cage',
  },
  KANO_P: {
    pass: '1E.3J', preset: 'KANO_P_CUSTOM_ENTRIES_V1', displayName: 'normal Kano palette',
    rosterName: 'KANO', variant: 'normal', counterpartSymbol: 'KANO3_P', testLabel: 'Kano against a different fighter',
  },
  KANO3_P: {
    pass: '1E.3K', preset: 'KANO3_P_CUSTOM_ENTRIES_V1', displayName: 'alternate Kano palette',
    rosterName: 'KANO', variant: 'alternate', counterpartSymbol: 'KANO_P', testLabel: 'Kano versus Kano',
  },
  RAIDEN_P: {
    pass: '1E.3M', preset: 'RAIDEN_P_CUSTOM_ENTRIES_V1', displayName: 'normal Raiden palette',
    rosterName: 'RAYDEN', variant: 'normal', counterpartSymbol: 'RAIDEN3_P', testLabel: 'Raiden against a different fighter',
  },
  RAIDEN3_P: {
    pass: '1E.3M', preset: 'RAIDEN3_P_CUSTOM_ENTRIES_V1', displayName: 'alternate Raiden palette',
    rosterName: 'RAYDEN', variant: 'alternate', counterpartSymbol: 'RAIDEN_P', testLabel: 'Raiden versus Raiden',
  },
  LUKANG_P: {
    pass: '1E.3M', preset: 'LUKANG_P_CUSTOM_ENTRIES_V1', displayName: 'normal Liu Kang palette',
    rosterName: 'LIU KANG', variant: 'normal', counterpartSymbol: 'LUKANG3_P', testLabel: 'Liu Kang against a different fighter',
  },
  LUKANG3_P: {
    pass: '1E.3M', preset: 'LUKANG3_P_CUSTOM_ENTRIES_V1', displayName: 'alternate Liu Kang palette',
    rosterName: 'LIU KANG', variant: 'alternate', counterpartSymbol: 'LUKANG_P', testLabel: 'Liu Kang versus Liu Kang',
  },
  YNINJA_P: {
    pass: '1E.3M', preset: 'YNINJA_P_CUSTOM_ENTRIES_V1', displayName: 'normal Scorpion palette',
    rosterName: 'SCORPION', variant: 'normal', counterpartSymbol: 'YNINJA3_P', testLabel: 'Scorpion against a different fighter',
  },
  YNINJA3_P: {
    pass: '1E.3M', preset: 'YNINJA3_P_CUSTOM_ENTRIES_V1', displayName: 'alternate Scorpion palette',
    rosterName: 'SCORPION', variant: 'alternate', counterpartSymbol: 'YNINJA_P', testLabel: 'Scorpion versus Scorpion',
  },
  BNINJA_P: {
    pass: '1E.3M', preset: 'BNINJA_P_CUSTOM_ENTRIES_V1', displayName: 'normal Sub-Zero palette',
    rosterName: 'SUB-ZERO', variant: 'normal', counterpartSymbol: 'BNINJA3_P', testLabel: 'Sub-Zero against a different fighter',
  },
  BNINJA3_P: {
    pass: '1E.3M', preset: 'BNINJA3_P_CUSTOM_ENTRIES_V1', displayName: 'alternate Sub-Zero palette',
    rosterName: 'SUB-ZERO', variant: 'alternate', counterpartSymbol: 'BNINJA_P', testLabel: 'Sub-Zero versus Sub-Zero',
  },
  LIZ_P: {
    pass: '1E.3M', preset: 'LIZ_P_CUSTOM_ENTRIES_V1', displayName: 'normal Sonya palette',
    rosterName: 'SONYA', variant: 'normal', counterpartSymbol: 'LIZRED_P', testLabel: 'Sonya against a different fighter',
  },
  LIZRED_P: {
    pass: '1E.3M', preset: 'LIZRED_P_CUSTOM_ENTRIES_V1', displayName: 'alternate Sonya palette',
    rosterName: 'SONYA', variant: 'alternate', counterpartSymbol: 'LIZ_P', testLabel: 'Sonya versus Sonya',
  },
  GONGORO_P: {
    pass: '1E.3N', preset: 'GONGORO_P_CUSTOM_ENTRIES_V1', displayName: 'shared Goro palette',
    rosterName: 'GORO', variant: 'shared', counterpartSymbol: 'GONGORO_P', unresolvedSlotIndex: 7,
    testLabel: 'force token 6 / character ID 7 and confirm the edited palette is consumed by Goro',
  },
  YANG_P: {
    pass: '1E.3N.3', preset: 'YANG_EMP_P_CUSTOM_ENTRIES_V1', displayName: 'shared Shang Tsung palette alias record',
    rosterName: 'SHANG TSUNG', variant: 'shared', counterpartSymbol: 'YANG_P', unresolvedSlotIndex: 8,
    testLabel: 'force token 7 / character ID 8 and confirm the YANG_P / EMP_P alias record is consumed by Shang Tsung',
  },
};

export function getPaletteEntryTargetConfig(symbol: PaletteEntryTargetSymbol): PaletteEntryTargetConfig {
  return TARGET_CONFIG[symbol];
}

export function getKanoPaletteEditorPass(symbol: KanoPaletteSymbol): KanoPaletteEditorPass {
  return TARGET_CONFIG[symbol].pass as KanoPaletteEditorPass;
}

export function getPaletteEntryEditorPass(symbol: PaletteEntryTargetSymbol): PaletteEntryEditorPass {
  return TARGET_CONFIG[symbol].pass;
}

export interface PaletteEntryEditReport {
  format: 'mk1_palette_entry_edit_v1';
  timestamp: string;
  operationId: string;
  provenance: PaletteRoundTripReport['provenance'];
  prerequisite: { pass: '1E.3H'; operationId: string; validationPassed: true; fixtureSha256: string };
  preset: PaletteEntryEditPreset;
  requestedWords: number[];
  target: {
    symbol: PaletteEntryTargetSymbol; recordIndex: number; aliases: string[]; physicalStart: number; physicalEnd: number;
    declaredLength: number; sameContentOtherRecordIndices: number[];
  };
  edits: PaletteWordEdit[];
  evidence: Awaited<ReturnType<typeof buildVerifiedPaletteEdit>>['evidence'];
  status: 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING';
  runtime: { tested: false; expectedObservation: string; result: 'NOT_TESTED' };
}

/** Kept in memory only. JSON exports contain evidence, not these full buffers. */
export interface PaletteEntryEditResult {
  baseline: PaletteRoundTripReport;
  originalExe: Uint8Array;
  editedExe: Uint8Array;
  report: PaletteEntryEditReport;
}

export function getPaletteEntryPlan(
  baseline: PaletteRoundTripReport,
  requestedWords: readonly number[],
  symbol: PaletteEntryTargetSymbol = 'KANO_P',
) {
  const config = TARGET_CONFIG[symbol];
  const matches = baseline.groundTruthRecords.filter(record => record.symbolNames.includes(symbol));
  if (matches.length !== 1) throw new Error(`Controlled edit requires exactly one ${symbol} record`);
  const target = matches[0];
  const irRecord = baseline.ir.records[target.recordIndex];
  if (!irRecord || irRecord.declaredLength !== 23 || target.declaredLength !== 23) {
    throw new Error(`Controlled ${symbol} experiment expects the qualified 23-color record`);
  }
  const sameContentOtherRecordIndices = baseline.ir.records.filter(record => record.ordinal !== target.recordIndex
    && JSON.stringify(record.rawColorWords) === JSON.stringify(irRecord.rawColorWords)).map(record => record.ordinal);
  if (requestedWords.length !== 23 || Array.from(requestedWords).some(word => !Number.isInteger(word) || word < 0 || word > 0x7fff)) {
    throw new Error('Provide exactly 23 valid 15-bit color words');
  }
  const edits: PaletteWordEdit[] = irRecord.rawColorWords.flatMap((word, index) => word === requestedWords[index] ? [] : [{
    recordIndex: target.recordIndex, colorWordIndex: index, expectedWord: word, replacementWord: requestedWords[index],
  }]);
  if (!edits.length) throw new Error(`Change at least one ${symbol} color before exporting`);
  return {
    edits,
    preset: config.preset,
    pass: config.pass,
    target: {
      symbol, recordIndex: target.recordIndex, aliases: [...target.symbolNames],
      physicalStart: target.physicalStart, physicalEnd: target.physicalEnd,
      declaredLength: target.declaredLength, sameContentOtherRecordIndices,
    },
  };
}

/** Backward-compatible Kano-only planning wrapper used by existing 1E.3J/1E.3K callers/tests. */
export function getKanoEntryPlan(
  baseline: PaletteRoundTripReport,
  requestedWords: readonly number[],
  symbol: KanoPaletteSymbol = 'KANO_P',
) {
  return getPaletteEntryPlan(baseline, requestedWords, symbol);
}

export async function executePaletteEntryEdit(
  source: DirectorySource,
  baseline: PaletteRoundTripReport,
  requestedWords: readonly number[],
  symbol: PaletteEntryTargetSymbol = 'KANO_P',
): Promise<PaletteEntryEditResult> {
  requestedWords = [...requestedWords]; // Snapshot caller intent before asynchronous validation.
  if (source.isSynthetic !== false) throw new Error('Controlled edit requires an authentic user-loaded directory');
  await createMK1PaletteRoundTripExport(baseline);
  const entries = await source.listRecursive();
  const file = entries.find(entry => entry.path === baseline.provenance.fileName);
  if (!file || file.size !== baseline.provenance.byteLength) throw new Error('Original executable path/size no longer matches 1E.3H');
  const originalExe = await source.readSlice(file.path, 0, file.size);
  if (originalExe.length !== file.size || await sha256Bytes(originalExe) !== baseline.provenance.sha256) throw new Error('Original executable SHA-256 no longer matches 1E.3H');
  const { target, edits, preset } = getPaletteEntryPlan(baseline, requestedWords, symbol);
  const { editedExe, evidence } = await buildVerifiedPaletteEdit(originalExe, baseline.ir, baseline.module.physicalStart, edits);
  const operationId = createOperationId('palette_entry_edit');
  const timestamp = new Date().toISOString();
  const config = TARGET_CONFIG[symbol];
  const expectedObservation = config.variant === 'normal'
    ? `Only the selected ${symbol} entries are expected to change when ${config.rosterName} uses its normal palette. ${config.counterpartSymbol} remains byte-identical. Test ${config.testLabel}.`
    : config.variant === 'alternate'
      ? `Only the selected ${symbol} entries are expected to change on the verified same-character ALTERNATE_PALETTES path. ${config.counterpartSymbol} remains byte-identical. Test ${config.testLabel}; this report does not assign permanent player-side ownership.`
      : `Only the selected ${symbol} color words are changed. The verified table census places this same record in both NORMAL_PALETTES[${config.unresolvedSlotIndex}] and ALTERNATE_PALETTES[${config.unresolvedSlotIndex}]. ${config.rosterName ? `The character identity has been runtime-qualified as ${config.rosterName}; ` : ''}${config.testLabel}.`;

  return { baseline, originalExe, editedExe, report: {
    format: 'mk1_palette_entry_edit_v1', timestamp, operationId, provenance: { ...baseline.provenance, timestamp, operationId },
    prerequisite: { pass: '1E.3H', operationId: baseline.operationId, validationPassed: true, fixtureSha256: evidence.originalExeSha256 },
    preset, requestedWords: [...requestedWords], target, edits, evidence, status: 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING',
    runtime: { tested: false, result: 'NOT_TESTED', expectedObservation },
  } };
}

/** Rebuild and recheck from the original buffer and validated baseline on every export. */
export async function createMK1PaletteEntryEditExport(result: PaletteEntryEditResult) {
  await createMK1PaletteRoundTripExport(result.baseline);
  const r = result.report;
  const { target, edits, preset, pass } = getPaletteEntryPlan(result.baseline, r.requestedWords, r.target.symbol);
  const rebuilt = await buildVerifiedPaletteEdit(result.originalExe, result.baseline.ir, result.baseline.module.physicalStart, edits);
  const checks = [
    { checkId: 'BASELINE_FIXTURE_BOUND', passed: rebuilt.evidence.originalExeSha256 === result.baseline.provenance.sha256
      && r.provenance.sha256 === rebuilt.evidence.originalExeSha256 && r.provenance.byteLength === result.originalExe.length
      && r.provenance.synthetic === false && r.provenance.artifactGeneratedByTest === false && r.provenance.sourceKind === 'user-loaded-directory' },
    { checkId: 'OPERATION_ID_CONSISTENT', passed: r.operationId.startsWith('palette_entry_edit-') && r.operationId === r.provenance.operationId },
    { checkId: 'PREREQUISITE_BOUND', passed: r.prerequisite.pass === '1E.3H' && r.prerequisite.operationId === result.baseline.operationId
      && r.prerequisite.fixtureSha256 === rebuilt.evidence.originalExeSha256 && r.prerequisite.validationPassed === true },
    { checkId: 'QUALIFIED_TARGET_AND_ALIASES', passed: JSON.stringify(r.target) === JSON.stringify(target) },
    { checkId: 'CONTROLLED_EDIT_PLAN', passed: r.preset === preset && JSON.stringify(r.edits) === JSON.stringify(edits) },
    { checkId: 'EVIDENCE_RECOMPUTED', passed: JSON.stringify(r.evidence) === JSON.stringify(rebuilt.evidence) },
    { checkId: 'OUTPUT_BYTES_REVALIDATED', passed: await sha256Bytes(result.editedExe) === rebuilt.evidence.editedExeSha256 && result.editedExe.length === result.originalExe.length },
    { checkId: 'ONLY_PLANNED_WORD_BYTES_CHANGED', passed: rebuilt.evidence.unexpectedByteChanges === 0 && rebuilt.evidence.changedByteCount > 0 },
    { checkId: 'REVERSE_RESTORES_ORIGINAL', passed: rebuilt.evidence.reversedExeSha256 === rebuilt.evidence.originalExeSha256 },
    { checkId: 'RUNTIME_NOT_CLAIMED', passed: r.status === 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING' && r.runtime.tested === false && r.runtime.result === 'NOT_TESTED' },
  ];
  if (!checks.every(check => check.passed)) throw new Error(`Controlled palette export blocked: ${checks.filter(check => !check.passed).map(check => check.checkId).join(', ')}`);
  return {
    metadata: { name: `MK1 ${r.target.symbol} Color Entry Edit`, milestone: `Pass ${pass}`, formatVersion: r.format, exportTimestamp: r.timestamp },
    ...r,
    validation: { allChecksPassed: true, checks },
  };
}

export async function buildPaletteEntryTestBundle(result: PaletteEntryEditResult): Promise<Uint8Array> {
  const artifact = await createMK1PaletteEntryEditExport(result);
  const encoder = new TextEncoder();
  const symbol = result.report.target.symbol;
  const config = TARGET_CONFIG[symbol];
  const testStep = config.variant === 'normal'
    ? `Select ${config.testLabel}. Compare ${config.rosterName} with an original-installation screenshot.`
    : config.variant === 'alternate'
      ? `Select ${config.testLabel}. The verified same-character equality edge selects ALTERNATE_PALETTES; compare both fighters with an original-installation screenshot. Do not infer permanent player-side ownership from this test alone.`
      : `Use the qualified access harness to reach ${config.rosterName ?? `character slot ${config.unresolvedSlotIndex}`} and confirm that the edited shared palette record is consumed there. The same record occupies both NORMAL_PALETTES[${config.unresolvedSlotIndex}] and ALTERNATE_PALETTES[${config.unresolvedSlotIndex}], so this test does not distinguish normal from alternate selection.`;
  const preservedTarget = config.counterpartSymbol;
  const instructions = `MK1 PALETTE ENTRY TEST — Pass ${config.pass}\n\nSTATIC BYTE VALIDATION PASSED. IN-GAME RESULT NOT YET OBSERVED.\n\n1. Make a separate copy of your complete original MK1 installation.\n2. Replace MK1.EXE in that test copy with the MK1.EXE from this ZIP.\n3. Launch the test copy with your usual DOS setup.\n4. ${testStep} Swatches are color previews, not sprite previews.\n5. Capture a screenshot with both fighters and the stage visible. Record whether the game boots, reaches the match, and plays normally.\n6. Compare with an original-installation screenshot. Report unexpected effects, crashes, or unchanged colors.\n7. Restore by recopying MK1.EXE from the untouched original installation.\n\nTarget: ${symbol}; ${result.report.edits.length} selected palette entries edited.\n${config.variant === 'shared' ? `All other executable bytes and record headers outside the selected ${symbol} color words are preserved.` : `All other executable bytes, including ${preservedTarget} and record headers, are preserved.`}\nAliases: ${result.report.target.aliases.join(', ')}. Aliases at one address share this edit.\nEqual-content records at other addresses are not edited.\nExpected changed bytes: ${result.report.evidence.changedByteCount}.\nOriginal SHA-256: ${result.report.evidence.originalExeSha256}\nEdited SHA-256: ${result.report.evidence.editedExeSha256}\n\nThe JSON includes original/replacement words and exact differing byte offsets. Static verification does not establish edited-game runtime behavior.\n`;
  return buildStoredZip([
    { name: 'MK1.EXE', bytes: result.editedExe },
    { name: 'mk1_palette_entry_edit.json', bytes: encoder.encode(JSON.stringify(artifact, null, 2)) },
    { name: 'READ_ME_FIRST.txt', bytes: encoder.encode(instructions) },
  ]);
}

/** Backward-compatible bundle name for the Kano editor. */
export async function buildKanoEntryTestBundle(result: PaletteEntryEditResult): Promise<Uint8Array> {
  return buildPaletteEntryTestBundle(result);
}
