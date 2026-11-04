import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { createMK1PaletteRoundTripExport, PaletteRoundTripReport } from './paletteRoundTrip';
import { sha256Bytes } from './paletteRoundTripCodec';
import { buildVerifiedPaletteEdit, PaletteWordEdit } from './paletteEditCodec';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';

const PRESET = 'KANO_P_ALL_MAGENTA_V1';

export interface ControlledPaletteEditReport {
  format: 'mk1_palette_controlled_edit_v1';
  timestamp: string;
  operationId: string;
  provenance: PaletteRoundTripReport['provenance'];
  prerequisite: { pass: '1E.3H'; operationId: string; validationPassed: true; fixtureSha256: string };
  preset: typeof PRESET;
  target: {
    symbol: 'KANO_P'; recordIndex: number; aliases: string[]; physicalStart: number; physicalEnd: number;
    declaredLength: number; sameContentOtherRecordIndices: number[];
  };
  edits: PaletteWordEdit[];
  evidence: Awaited<ReturnType<typeof buildVerifiedPaletteEdit>>['evidence'];
  status: 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING';
  runtime: { tested: false; expectedObservation: string; result: 'NOT_TESTED' };
}

/** Kept in memory only. JSON exports contain evidence, not these full buffers. */
export interface ControlledPaletteEditResult {
  baseline: PaletteRoundTripReport;
  originalExe: Uint8Array;
  editedExe: Uint8Array;
  report: ControlledPaletteEditReport;
}

function getKanoPlan(baseline: PaletteRoundTripReport) {
  const matches = baseline.groundTruthRecords.filter(record => record.symbolNames.includes('KANO_P'));
  if (matches.length !== 1) throw new Error('Controlled edit requires exactly one KANO_P record');
  const target = matches[0];
  const irRecord = baseline.ir.records[target.recordIndex];
  if (!irRecord || irRecord.declaredLength !== 23 || target.declaredLength !== 23) throw new Error('Controlled Kano experiment expects the qualified 23-color record');
  const sameContentOtherRecordIndices = baseline.ir.records.filter(record => record.ordinal !== target.recordIndex
    && JSON.stringify(record.rawColorWords) === JSON.stringify(irRecord.rawColorWords)).map(record => record.ordinal);
  const edits: PaletteWordEdit[] = irRecord.rawColorWords.flatMap((word, index) => word === 0x7c1f ? [] : [{
    recordIndex: target.recordIndex, colorWordIndex: index, expectedWord: word, replacementWord: 0x7c1f,
  }]);
  if (!edits.length) throw new Error('Kano preset would make no changes');
  return { edits, target: { symbol: 'KANO_P' as const, recordIndex: target.recordIndex, aliases: [...target.symbolNames],
    physicalStart: target.physicalStart, physicalEnd: target.physicalEnd, declaredLength: target.declaredLength, sameContentOtherRecordIndices } };
}

export async function executeControlledPaletteEdit(source: DirectorySource, baseline: PaletteRoundTripReport): Promise<ControlledPaletteEditResult> {
  if (source.isSynthetic !== false) throw new Error('Controlled edit requires an authentic user-loaded directory');
  await createMK1PaletteRoundTripExport(baseline);
  const entries = await source.listRecursive();
  const file = entries.find(entry => entry.path === baseline.provenance.fileName);
  if (!file || file.size !== baseline.provenance.byteLength) throw new Error('Original executable path/size no longer matches 1E.3H');
  const originalExe = await source.readSlice(file.path, 0, file.size);
  if (originalExe.length !== file.size || await sha256Bytes(originalExe) !== baseline.provenance.sha256) throw new Error('Original executable SHA-256 no longer matches 1E.3H');
  const { target, edits } = getKanoPlan(baseline);
  const { editedExe, evidence } = await buildVerifiedPaletteEdit(originalExe, baseline.ir, baseline.module.physicalStart, edits);
  const operationId = createOperationId('palette_controlled_edit');
  const timestamp = new Date().toISOString();
  return { baseline, originalExe, editedExe, report: {
    format: 'mk1_palette_controlled_edit_v1', timestamp, operationId, provenance: { ...baseline.provenance, timestamp, operationId },
    prerequisite: { pass: '1E.3H', operationId: baseline.operationId, validationPassed: true, fixtureSha256: evidence.originalExeSha256 },
    preset: PRESET, target, edits, evidence, status: 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING',
    runtime: { tested: false, result: 'NOT_TESTED', expectedObservation: 'Kano using his normal palette is expected to render bright magenta. KANO3_P remains byte-identical; same-character matches are a separate follow-up test.' },
  } };
}

/** Rebuild and recheck from the original buffer and validated baseline on every export. */
export async function createMK1ControlledPaletteEditExport(result: ControlledPaletteEditResult) {
  await createMK1PaletteRoundTripExport(result.baseline);
  const r = result.report;
  const { target, edits } = getKanoPlan(result.baseline);
  const rebuilt = await buildVerifiedPaletteEdit(result.originalExe, result.baseline.ir, result.baseline.module.physicalStart, edits);
  const checks = [
    { checkId: 'BASELINE_FIXTURE_BOUND', passed: rebuilt.evidence.originalExeSha256 === result.baseline.provenance.sha256
      && r.provenance.sha256 === rebuilt.evidence.originalExeSha256 && r.provenance.byteLength === result.originalExe.length
      && r.provenance.synthetic === false && r.provenance.artifactGeneratedByTest === false && r.provenance.sourceKind === 'user-loaded-directory' },
    { checkId: 'OPERATION_ID_CONSISTENT', passed: r.operationId.startsWith('palette_controlled_edit-') && r.operationId === r.provenance.operationId },
    { checkId: 'PREREQUISITE_BOUND', passed: r.prerequisite.pass === '1E.3H' && r.prerequisite.operationId === result.baseline.operationId
      && r.prerequisite.fixtureSha256 === rebuilt.evidence.originalExeSha256 && r.prerequisite.validationPassed === true },
    { checkId: 'QUALIFIED_TARGET_AND_ALIASES', passed: JSON.stringify(r.target) === JSON.stringify(target) },
    { checkId: 'CONTROLLED_EDIT_PLAN', passed: r.preset === PRESET && JSON.stringify(r.edits) === JSON.stringify(edits) },
    { checkId: 'EVIDENCE_RECOMPUTED', passed: JSON.stringify(r.evidence) === JSON.stringify(rebuilt.evidence) },
    { checkId: 'OUTPUT_BYTES_REVALIDATED', passed: await sha256Bytes(result.editedExe) === rebuilt.evidence.editedExeSha256 && result.editedExe.length === result.originalExe.length },
    { checkId: 'ONLY_PLANNED_WORD_BYTES_CHANGED', passed: rebuilt.evidence.unexpectedByteChanges === 0 && rebuilt.evidence.changedByteCount > 0 },
    { checkId: 'REVERSE_RESTORES_ORIGINAL', passed: rebuilt.evidence.reversedExeSha256 === rebuilt.evidence.originalExeSha256 },
    { checkId: 'RUNTIME_NOT_CLAIMED', passed: r.status === 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING' && r.runtime.tested === false && r.runtime.result === 'NOT_TESTED' },
  ];
  if (!checks.every(check => check.passed)) throw new Error(`Controlled palette export blocked: ${checks.filter(check => !check.passed).map(check => check.checkId).join(', ')}`);
  return { metadata: { name: 'MK1 Controlled Palette Edit', milestone: 'Pass 1E.3I', formatVersion: r.format, exportTimestamp: r.timestamp },
    ...r, validation: { allChecksPassed: true, checks } };
}

export async function buildKanoTestBundle(result: ControlledPaletteEditResult): Promise<Uint8Array> {
  const artifact = await createMK1ControlledPaletteEditExport(result);
  const encoder = new TextEncoder();
  const instructions = `MK1 KANO PALETTE TEST — Pass 1E.3I\n\nSTATIC BYTE VALIDATION PASSED. IN-GAME RESULT NOT YET OBSERVED.\n\n1. Make a separate copy of your complete original MK1 installation.\n2. Replace MK1.EXE in that test copy with the MK1.EXE from this ZIP.\n3. Launch the test copy with your usual DOS setup.\n4. Select Kano against a different fighter. His normal-palette pixels are expected to be bright magenta.\n5. Capture a screenshot with both fighters and the stage visible. Record whether the game boots, reaches the match, and plays normally.\n6. Compare with an original-installation screenshot. Report unexpected effects, crashes, or unchanged colors.\n7. Restore by recopying MK1.EXE from the untouched original installation.\n\nTarget: KANO_P; 23 palette entries set to 0x7C1F.\nAll other executable bytes, including KANO3_P and record headers, are preserved.\nAliases: ${result.report.target.aliases.join(', ')}. Aliases at one address share this edit.\nEqual-content records at other addresses are not edited.\nExpected changed bytes: ${result.report.evidence.changedByteCount}.\nOriginal SHA-256: ${result.report.evidence.originalExeSha256}\nEdited SHA-256: ${result.report.evidence.editedExeSha256}\n\nThe JSON includes original/replacement words and exact differing byte offsets. Static verification does not establish edited-game runtime behavior.\n`;
  return buildStoredZip([
    { name: 'MK1.EXE', bytes: result.editedExe },
    { name: 'mk1_palette_controlled_edit.json', bytes: encoder.encode(JSON.stringify(artifact, null, 2)) },
    { name: 'READ_ME_FIRST.txt', bytes: encoder.encode(instructions) },
  ]);
}
