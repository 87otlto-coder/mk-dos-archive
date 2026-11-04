import { describe, expect, it } from 'vitest';
import { parsePaletteModule } from '../games/mk1/research/paletteRoundTripCodec';
import { applyPaletteWordEdits, expectedPaletteByteChanges, buildVerifiedPaletteEdit, PaletteWordEdit } from '../games/mk1/research/paletteEditCodec';
import { executeControlledPaletteEdit } from '../games/mk1/research/paletteControlledEdit';
import { MemoryDirectorySource } from '../core/filesystem/DirectorySource';

const bytes = Uint8Array.from([2, 0, 0x34, 0x12, 0x78, 0x56, 2, 0, 0x34, 0x12, 0x78, 0x56]);
const edit: PaletteWordEdit = { recordIndex: 0, colorWordIndex: 0, expectedWord: 0x1234, replacementWord: 0x7c1f };

describe('bounded palette word edits (synthetic mechanics)', () => {
  it('edits a single record while preserving an equal-content record and the caller IR', () => {
    const ir = parsePaletteModule(bytes);
    const after = applyPaletteWordEdits(ir, [edit]);
    expect(after.records[0].rawColorWords).toEqual([0x7c1f, 0x5678]);
    expect(after.records[1]).toEqual(ir.records[1]);
    expect(ir.records[0].rawColorWords[0]).toBe(0x1234);
  });
  it('calculates exact expected low/high byte differences independently', () => {
    expect(expectedPaletteByteChanges(parsePaletteModule(bytes), 100, [edit])).toEqual([
      { physicalOffset: 102, before: 0x34, after: 0x1f }, { physicalOffset: 103, before: 0x12, after: 0x7c },
    ]);
    expect(expectedPaletteByteChanges(parsePaletteModule(bytes), 100, [{ ...edit, replacementWord: 0x1235 }])).toEqual([
      { physicalOffset: 102, before: 0x34, after: 0x35 },
    ]);
  });
  it.each([
    { recordIndex: -1 }, { recordIndex: 2 }, { recordIndex: 0.5 },
    { colorWordIndex: -1 }, { colorWordIndex: 2 }, { colorWordIndex: NaN },
    { expectedWord: 0 }, { replacementWord: -1 }, { replacementWord: 0x8000 }, { replacementWord: 1.5 }, { replacementWord: 0x1234 },
  ])('rejects invalid/precondition/no-op edits: %j', change => {
    expect(() => applyPaletteWordEdits(parsePaletteModule(bytes), [{ ...edit, ...change }])).toThrow();
  });
  it('rejects empty plans and duplicate/conflicting targets', () => {
    expect(() => applyPaletteWordEdits(parsePaletteModule(bytes), [])).toThrow('Empty');
    expect(() => applyPaletteWordEdits(parsePaletteModule(bytes), [edit, edit])).toThrow('Duplicate');
    expect(() => applyPaletteWordEdits(parsePaletteModule(bytes), [edit, { ...edit, replacementWord: 0 }])).toThrow('Duplicate');
  });
  it('rebuilds only the requested bytes, reparses, and reverses to the original hash', async () => {
    const original = Uint8Array.from([0xaa, ...bytes, 0xbb]);
    const result = await buildVerifiedPaletteEdit(original, parsePaletteModule(bytes), 1, [edit]);
    expect(result.evidence.actualChanges).toEqual([
      { physicalOffset: 3, before: 0x34, after: 0x1f }, { physicalOffset: 4, before: 0x12, after: 0x7c },
    ]);
    expect(result.editedExe.length).toBe(original.length);
    expect(result.evidence.reversedExeSha256).toBe(result.evidence.originalExeSha256);
    expect(result.evidence.editedExeSha256).not.toBe(result.evidence.originalExeSha256);
    expect(result.editedExe[0]).toBe(0xaa); expect(result.editedExe.at(-1)).toBe(0xbb);
    expect(original[3]).toBe(0x34);
  });
  it('rejects IR which no longer matches source or lies outside the executable', async () => {
    const ir = parsePaletteModule(bytes);
    const changed = bytes.slice(); changed[2]++;
    await expect(buildVerifiedPaletteEdit(changed, ir, 0, [edit])).rejects.toThrow('does not match');
    await expect(buildVerifiedPaletteEdit(bytes, ir, 1, [edit])).rejects.toThrow();
    await expect(buildVerifiedPaletteEdit(bytes, ir, -1, [edit])).rejects.toThrow();
  });
  it('blocks synthetic sources before authoritative analysis', async () => {
    await expect(executeControlledPaletteEdit(new MemoryDirectorySource(), {} as never)).rejects.toThrow('authentic');
  });
});
