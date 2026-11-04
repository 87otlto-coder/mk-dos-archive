import { describe, expect, it } from 'vitest';
import {
  buildIndexedTablePairClusters,
  choosePairedPaletteTables,
  classifyExactDwordOperand,
  scanExactDwordValues,
} from '../games/mk1/research/kanoPaletteSelectionReferenceGraph';
import { PaletteReferenceTable, TableCodeReferenceSite } from '../games/mk1/research/kanoPaletteSelectionReferenceGraphTypes';

function interval(name: string, start: number, end: number) {
  return {
    moduleIndex: 7,
    moduleName: 'GENERIC.ASM',
    symbolName: name,
    symbolGlobalIndex: start,
    segment: 2,
    startOffset: start,
    startOffsetHex: `0x${start.toString(16)}`,
    endOffset: end,
    endOffsetHex: `0x${end.toString(16)}`,
    byteLength: end - start,
  };
}

function table(name: string, start: number, targetSlot: 'a' | 'b'): PaletteReferenceTable {
  const vals = targetSlot === 'a' ? [0x100, 0x200, 0x300] : [0x110, 0x210, 0x310];
  return {
    symbol: interval(name, start, start + 12),
    physicalStart: 0x5000 + start,
    physicalStartHex: '0x0',
    dwordCount: 3,
    entries: vals.map((v, i) => ({
      slotIndex: i,
      rawValue: v,
      rawValueHex: `0x${v.toString(16)}`,
      paletteRecordIndex: i,
      paletteSymbolNames: [`palette_${targetSlot}_${i}`],
      isVerifiedPaletteStart: true,
    })),
    verifiedPaletteReferenceCount: 3,
    allEntriesVerifiedPaletteStarts: true,
    kanoPSlots: targetSlot === 'a' ? [1] : [],
    kano3PSlots: targetSlot === 'b' ? [1] : [],
  };
}

describe('1E.3E generic reference mechanics', () => {
  it('finds every exact little-endian DWORD occurrence', () => {
    const bytes = new Uint8Array([0x78,0x56,0x34,0x12,0,0x78,0x56,0x34,0x12]);
    const hits = scanExactDwordValues(bytes, new Map([[0x12345678, ['target']]]));
    expect(hits.map(h => h.offset)).toEqual([0,5]);
  });

  it('classifies an indexed dword table load with a recoverable instruction boundary', () => {
    const bytes = new Uint8Array([0x8b,0x04,0x9d,0x44,0x33,0x22,0x11]);
    const shape = classifyExactDwordOperand(bytes, 3);
    expect(shape.classification).toBe('X86_INDEXED_DWORD_TABLE_LOAD');
    expect(shape.indexRegister).toBe('EBX');
  });

  it('does not promote a rel32 immediate coincidence to a data reference', () => {
    const bytes = new Uint8Array([0xe9,0x44,0x33,0x22,0x11]);
    expect(classifyExactDwordOperand(bytes, 1).classification).toBe('REL32_COINCIDENCE');
  });

  it('pairs same-sized fully palette-backed tables only when target slots align', () => {
    const pair = choosePairedPaletteTables([table('table_alpha', 0x20, 'a'), table('table_beta', 0x40, 'b')]);
    expect(pair?.classification).toBe('VERIFIED_PARALLEL_PALETTE_TABLES');
    expect(pair?.kanoSlotIndex).toBe(1);
    expect(pair?.dwordCount).toBe(3);
  });

  it('qualifies nearby indexed sites only when both use the same index register', () => {
    const pair = choosePairedPaletteTables([table('table_alpha', 0x20, 'a'), table('table_beta', 0x40, 'b')])!;
    const mk = (tableSymbolName: string, physicalFileOffset: number, indexRegister: string): TableCodeReferenceSite => ({
      tableSymbolName, tableWatcomOffset: 0, tableWatcomOffsetHex: '0x0', physicalFileOffset,
      physicalFileOffsetHex: `0x${physicalFileOffset.toString(16)}`, classification: 'X86_INDEXED_DWORD_TABLE_LOAD',
      instructionStartPhysicalOffset: physicalFileOffset - 3, instructionStartPhysicalOffsetHex: '0x0',
      instructionLoadedAddress: null, instructionLoadedAddressHex: null, decodedShape: 'MOV EAX,[IDX*4+disp32]',
      indexRegister, mappedLeObjectNumber: 1, executableRegionId: 'r', executableRegionClass: 'mapped-object', contextBytesHex: '',
    });
    const clusters = buildIndexedTablePairClusters([
      mk('table_alpha', 100, 'EBX'), mk('table_beta', 132, 'EBX'),
    ], pair, 64);
    expect(clusters[0].classification).toBe('VERIFIED_SHARED_INDEX_TABLE_CLUSTER');
  });
});
