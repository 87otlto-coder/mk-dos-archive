import { PaletteModuleIR, serializePaletteModule, parsePaletteModule, rebuildWithPaletteModule, compareBytes, bytesToHex, sha256Bytes } from './paletteRoundTripCodec';

export interface PaletteWordEdit {
  recordIndex: number;
  /** Zero-based word ordinal, not a hardware palette index. */
  colorWordIndex: number;
  expectedWord: number;
  replacementWord: number;
}
export interface ByteChange { physicalOffset: number; before: number; after: number; }

/** Strict fixed-layout edit plan. The caller's IR is never mutated. */
export function applyPaletteWordEdits(original: PaletteModuleIR, edits: PaletteWordEdit[]): PaletteModuleIR {
  serializePaletteModule(original); // validate layout before accepting any edits
  if (!edits.length) throw new Error('Empty palette edit plan');
  const output: PaletteModuleIR = JSON.parse(JSON.stringify(original));
  const seen = new Set<string>();
  for (const edit of edits) {
    if (!Number.isInteger(edit.recordIndex) || edit.recordIndex < 0 || edit.recordIndex >= output.records.length) throw new Error('Invalid palette record index');
    const record = output.records[edit.recordIndex];
    if (!Number.isInteger(edit.colorWordIndex) || edit.colorWordIndex < 0 || edit.colorWordIndex >= record.declaredLength) throw new Error('Invalid palette color word index');
    const key = `${edit.recordIndex}:${edit.colorWordIndex}`;
    if (seen.has(key)) throw new Error('Duplicate or conflicting palette word edit');
    seen.add(key);
    if (!Number.isInteger(edit.expectedWord) || edit.expectedWord < 0 || edit.expectedWord > 0xffff || record.rawColorWords[edit.colorWordIndex] !== edit.expectedWord) throw new Error('Original palette word does not match edit precondition');
    if (!Number.isInteger(edit.replacementWord) || edit.replacementWord < 0 || edit.replacementWord > 0x7fff) throw new Error('Replacement must be a 15-bit palette color word');
    if (edit.expectedWord === edit.replacementWord) throw new Error('No-op palette word edit');
    record.rawColorWords[edit.colorWordIndex] = edit.replacementWord;
  }
  return output;
}

export function listByteChanges(before: Uint8Array, after: Uint8Array): ByteChange[] {
  if (before.length !== after.length) throw new Error('Edited executable size changed');
  const changes: ByteChange[] = [];
  for (let i = 0; i < before.length; i++) if (before[i] !== after[i]) changes.push({ physicalOffset: i, before: before[i], after: after[i] });
  return changes;
}

/** Expected differences are computed directly from word preconditions, separately
 * from the module serializer used to generate the actual edited executable. */
export function expectedPaletteByteChanges(ir: PaletteModuleIR, start: number, edits: PaletteWordEdit[]): ByteChange[] {
  applyPaletteWordEdits(ir, edits);
  const changes: ByteChange[] = [];
  for (const edit of edits) {
    const offset = start + ir.records[edit.recordIndex].relativeOffset + 2 + 2 * edit.colorWordIndex;
    for (let byte = 0; byte < 2; byte++) {
      const before = (edit.expectedWord >>> (byte * 8)) & 255;
      const after = (edit.replacementWord >>> (byte * 8)) & 255;
      if (before !== after) changes.push({ physicalOffset: offset + byte, before, after });
    }
  }
  return changes.sort((a, b) => a.physicalOffset - b.physicalOffset);
}

export async function buildVerifiedPaletteEdit(originalExe: Uint8Array, ir: PaletteModuleIR, moduleStart: number, edits: PaletteWordEdit[]) {
  const originalModule = serializePaletteModule(ir);
  const moduleEnd = moduleStart + originalModule.length;
  // Bounds are checked before any subarray coercion.
  rebuildWithPaletteModule(originalExe, moduleStart, moduleEnd, originalModule);
  if (!compareBytes(originalExe.subarray(moduleStart, moduleEnd), originalModule).equal) throw new Error('Palette IR does not match original executable bytes');
  const editedIR = applyPaletteWordEdits(ir, edits);
  const editedModule = serializePaletteModule(editedIR);
  const editedExe = rebuildWithPaletteModule(originalExe, moduleStart, moduleEnd, editedModule);
  const expectedChanges = expectedPaletteByteChanges(ir, moduleStart, edits);
  const actualChanges = listByteChanges(originalExe, editedExe);
  if (JSON.stringify(actualChanges) !== JSON.stringify(expectedChanges)) throw new Error('Unexpected executable byte changes');
  const reparsed = parsePaletteModule(editedModule);
  if (JSON.stringify(reparsed) !== JSON.stringify(editedIR)) throw new Error('Edited module reparse mismatch');
  const reverseEdits = edits.map(edit => ({ ...edit, expectedWord: edit.replacementWord, replacementWord: edit.expectedWord }));
  // The authentic ground-truth input is 15-bit. Reject unsupported reversal.
  const reversedModule = serializePaletteModule(applyPaletteWordEdits(editedIR, reverseEdits));
  const reversedExe = rebuildWithPaletteModule(editedExe, moduleStart, moduleEnd, reversedModule);
  if (!compareBytes(originalExe, reversedExe).equal) throw new Error('Reverse edit failed to restore original executable');
  const editedRecords = new Set(edits.map(edit => edit.recordIndex));
  return {
    editedExe,
    evidence: {
      originalExeSha256: await sha256Bytes(originalExe), editedExeSha256: await sha256Bytes(editedExe), reversedExeSha256: await sha256Bytes(reversedExe),
      originalExeSize: originalExe.length, editedExeSize: editedExe.length,
      moduleStart, moduleEnd, originalModuleHex: bytesToHex(originalModule), editedModuleHex: bytesToHex(editedModule),
      originalModuleSha256: await sha256Bytes(originalModule), editedModuleSha256: await sha256Bytes(editedModule),
      editedRecordCount: editedRecords.size, editedWordCount: edits.length,
      expectedChanges, actualChanges, changedByteCount: actualChanges.length,
      unexpectedByteChanges: 0, headersChanged: 0, bytesChangedOutsideTargetWords: 0,
      uneditedRecordCount: ir.records.length - editedRecords.size,
      editedModuleReparsed: true, reverseRestoresOriginal: true,
    },
  };
}
