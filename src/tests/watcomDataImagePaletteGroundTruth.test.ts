import { describe, expect, it } from 'vitest';
import { MemoryDirectorySource } from '../core/filesystem/DirectorySource';
import {
  compareKanoPaletteToSprites,
  parsePaletteRecordAtPhysical,
  qualifyPaletteModuleRecords,
  qualifyStaticDataFileBase,
  selectExactPaletteModule,
  validateRepeatedByteDwordTable,
  createMK1WatcomDataImagePaletteGroundTruthExport,
  ExactModuleSelection,
} from '../games/mk1/research/watcomDataImagePaletteGroundTruth';
import {
  DerivedHandleTableAnchorEvidence,
  MK1WatcomDataImagePaletteGroundTruthReport,
  WatcomHandleTableSymbolEvidence,
  WatcomPaletteRecord,
} from '../games/mk1/research/watcomDataImagePaletteGroundTruthTypes';
import { WatcomGlobalSymbol } from '../core/executable/watcomDebug/watcomPermanentClassTypes';
import { AuthoritativeKanoResult } from '../games/mk1/research/authoritativeKano';

const verifiedAnchor = (base: number, symbolOffset: number): DerivedHandleTableAnchorEvidence => ({
  physicalStart: base + symbolOffset,
  physicalStartHex: hex(base + symbolOffset),
  physicalEnd: base + symbolOffset + 48,
  physicalEndHex: hex(base + symbolOffset + 48),
  entryCount: 2,
  stride: 24,
  stringResolutionBase: base,
  stringResolutionBaseHex: hex(base),
  stringResolutionConfidence: 'verified',
  directoryReconciledCount: 2,
  reconstructionStatus: 'VERIFIED_FIXTURE',
  isAnchorVerified: true,
});

const anchorSymbol = (offset: number): WatcomHandleTableSymbolEvidence => ({
  name: 'anchor_table',
  watcomMapSegment: 2,
  watcomMapSegmentHex: '0x0002',
  watcomMapOffset: offset,
  watcomMapOffsetHex: hex(offset),
  moduleIndex: 0,
  moduleName: 'module_a',
  rawKind: 2,
  isData: true,
});

function hex(v: number): string {
  return `0x${(v >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

function symbol(index: number, offset: number, name: string): WatcomGlobalSymbol {
  return {
    globalIndex: index,
    fileOffset: 0,
    fileOffsetHex: '0x00000000',
    sectionOffset: 0,
    sectionOffsetHex: '0x00000000',
    recordByteLength: 10 + name.length,
    addressOffset: offset,
    addressOffsetHex: hex(offset),
    segment: 2,
    segmentHex: '0x0002',
    moduleIndex: 7,
    resolvedModuleName: 'palette_module.asm',
    rawKind: 2,
    kindBits: { isStatic: false, isData: true, isCode: false, rawKind: 2, rawKindHex: '0x02' },
    nameLength: name.length,
    name,
    valid: true,
  };
}

function writePalette(bytes: Uint8Array, offset: number, words: number[]): number {
  bytes[offset] = words.length & 0xff;
  bytes[offset + 1] = (words.length >>> 8) & 0xff;
  words.forEach((word, i) => {
    bytes[offset + 2 + i * 2] = word & 0xff;
    bytes[offset + 3 + i * 2] = (word >>> 8) & 0xff;
  });
  return 2 + words.length * 2;
}

function selection(start: number, size: number, symbols: WatcomGlobalSymbol[]): ExactModuleSelection {
  return {
    module: {
      moduleIndex: 7,
      fileOffset: 0,
      fileOffsetHex: '0x00000000',
      sectionOffset: 0,
      sectionOffsetHex: '0x00000000',
      recordByteLength: 0,
      languageOffset: 0,
      resolvedLanguage: 'ASM',
      locals: { offset: 0, offsetHex: '0x00000000', numEntries: 0 },
      types: { offset: 0, offsetHex: '0x00000000', numEntries: 0 },
      lines: { offset: 0, offsetHex: '0x00000000', numEntries: 0 },
      nameLength: 18,
      name: 'palette_module.asm',
      fixedHeaderRawBytesHex: '',
      valid: true,
    },
    symbols,
    moduleInfo: {
      moduleIndex: 7,
      moduleName: 'palette_module.asm',
      segment: 2,
      segmentHex: '0x0002',
      startOffset: start,
      startOffsetHex: hex(start),
      size,
      sizeHex: hex(size),
      endOffset: start + size,
      endOffsetHex: hex(start + size),
      symbolCount: symbols.length,
      uniqueOffsetCount: new Set(symbols.map((s) => s.addressOffset)).size,
    },
  };
}

describe('Pass 1E.3D.1 static-data base qualification', () => {
  it('qualifies only when independent base A and base B agree and anchor round-trips', () => {
    const q = qualifyStaticDataFileBase(verifiedAnchor(0x4000, 0x120), anchorSymbol(0x120));
    expect(q.status).toBe('QUALIFIED_STATIC_DATA_FILE_BASE');
    expect(q.candidateBaseA).toBe(0x4000);
    expect(q.candidateBaseB).toBe(0x4000);
    expect(q.basesAgree).toBe(true);
    expect(q.anchorRoundTripPassed).toBe(true);
  });

  it('fails closed when the independently reconstructed string base disagrees', () => {
    const anchor = verifiedAnchor(0x4000, 0x120);
    anchor.stringResolutionBase = 0x4100;
    anchor.stringResolutionBaseHex = hex(0x4100);
    const q = qualifyStaticDataFileBase(anchor, anchorSymbol(0x120));
    expect(q.status).toBe('BASE_DISAGREEMENT');
    expect(q.qualifiedBase).toBeNull();
  });

  it('fails closed on subtraction underflow', () => {
    const anchor = verifiedAnchor(0x100, 0x20);
    anchor.physicalStart = 0x10;
    anchor.physicalStartHex = hex(0x10);
    const q = qualifyStaticDataFileBase(anchor, anchorSymbol(0x20));
    expect(q.status).toBe('SUBTRACTION_UNDERFLOW');
  });

  it('requires independently verified string-base evidence', () => {
    const anchor = verifiedAnchor(0x4000, 0x120);
    anchor.stringResolutionConfidence = 'inferred';
    const q = qualifyStaticDataFileBase(anchor, anchorSymbol(0x120));
    expect(q.status).toBe('MISSING_STRING_BASE');
    expect(q.qualifiedBase).toBeNull();
  });
});

describe('Pass 1E.3D.1 structural palette parser', () => {
  it('accepts low-diversity records when length/bounds/15-bit rules pass', async () => {
    const source = new MemoryDirectorySource('synthetic');
    const bytes = new Uint8Array(64);
    writePalette(bytes, 8, [0x0123, 0x0123, 0x0123]);
    source.setFile('APP.BIN', bytes);
    const parsed = await parsePaletteRecordAtPhysical(source, 'APP.BIN', bytes.length, 8);
    expect(parsed.valid).toBe(true);
    expect(parsed.declaredLength).toBe(3);
  });

  it('rejects length 1, length 256, non-15-bit words, and truncation', async () => {
    const source = new MemoryDirectorySource('synthetic');
    const bytes = new Uint8Array(32);
    bytes[0] = 1;
    bytes[4] = 0; bytes[5] = 1; // 256
    bytes[8] = 2; bytes[9] = 0; bytes[10] = 0; bytes[11] = 0x80; bytes[12] = 0; bytes[13] = 0;
    bytes[30] = 2; bytes[31] = 0;
    source.setFile('APP.BIN', bytes);
    expect((await parsePaletteRecordAtPhysical(source, 'APP.BIN', bytes.length, 0)).valid).toBe(false);
    expect((await parsePaletteRecordAtPhysical(source, 'APP.BIN', bytes.length, 4)).valid).toBe(false);
    expect((await parsePaletteRecordAtPhysical(source, 'APP.BIN', bytes.length, 8)).valid).toBe(false);
    expect((await parsePaletteRecordAtPhysical(source, 'APP.BIN', bytes.length, 30)).valid).toBe(false);
  });
});

describe('Pass 1E.3D.1 palette-module tiling', () => {
  it('tiles contiguous records exactly while preserving same-offset aliases and duplicate content separately', async () => {
    const source = new MemoryDirectorySource('synthetic');
    const base = 0x20;
    const bytes = new Uint8Array(256);
    const start = 0x10;
    const aSize = writePalette(bytes, base + start, [0x0011, 0x0022]);
    const bStart = start + aSize;
    const bSize = writePalette(bytes, base + bStart, [0x0011, 0x0022]);
    const cStart = bStart + bSize;
    const cSize = writePalette(bytes, base + cStart, [0x0033, 0x0044, 0x0055]);
    source.setFile('APP.BIN', bytes);

    const symbols = [
      symbol(0, start, 'palette_alpha'),
      symbol(1, start, 'palette_alias'),
      symbol(2, bStart, 'palette_beta'),
      symbol(3, cStart, 'palette_gamma'),
    ];
    const result = await qualifyPaletteModuleRecords(
      source,
      'APP.BIN',
      bytes.length,
      base,
      selection(start, aSize + bSize + cSize, symbols),
    );
    expect(result.moduleTiling.exactTiling).toBe(true);
    expect(result.paletteRecords).toHaveLength(3);
    expect(result.paletteRecords[0].symbolNames).toEqual(['palette_alpha', 'palette_alias']);
    expect(result.paletteRecords[1].duplicateContentOfRecordIndex).toBe(0);
  });

  it('reports a gap instead of silently qualifying the module', async () => {
    const source = new MemoryDirectorySource('synthetic');
    const bytes = new Uint8Array(256);
    const base = 0x20;
    const start = 0x10;
    const firstSize = writePalette(bytes, base + start, [1, 2]);
    const secondStart = start + firstSize + 2;
    const secondSize = writePalette(bytes, base + secondStart, [3, 4]);
    source.setFile('APP.BIN', bytes);
    const result = await qualifyPaletteModuleRecords(
      source,
      'APP.BIN',
      bytes.length,
      base,
      selection(start, firstSize + 2 + secondSize, [symbol(0, start, 'alpha'), symbol(1, secondStart, 'beta')]),
    );
    expect(result.moduleTiling.exactTiling).toBe(false);
    expect(result.moduleTiling.gapCount).toBe(1);
  });

  it('reports overlapping records', async () => {
    const source = new MemoryDirectorySource('synthetic');
    const bytes = new Uint8Array(256);
    const base = 0x20;
    const start = 0x10;
    const firstSize = writePalette(bytes, base + start, [1, 2, 3, 4]);
    const secondStart = start + 4;
    writePalette(bytes, base + secondStart, [5, 6]);
    source.setFile('APP.BIN', bytes);
    const result = await qualifyPaletteModuleRecords(
      source,
      'APP.BIN',
      bytes.length,
      base,
      selection(start, firstSize + 4, [symbol(0, start, 'alpha'), symbol(1, secondStart, 'beta')]),
    );
    expect(result.moduleTiling.exactTiling).toBe(false);
    expect(result.moduleTiling.overlapCount).toBeGreaterThan(0);
  });
});

describe('Pass 1E.3D.1 exact post-discovery module selection', () => {
  it('selects the exact requested module rather than the first fuzzy name match', () => {
    const targetSymbol = symbol(0, 0x100, 'anything');
    const report = {
      permanentClassesReport: {
        result: {
          modules: {
            modules: [
              { moduleIndex: 2, name: 'palette_background.asm' },
              { moduleIndex: 7, name: 'palette_module.asm' },
            ],
          },
          globalSymbols: { symbols: [targetSymbol] },
          addressInfo: {
            segmentRecords: [
              { segment: 2, startAddressOffset: 0, entries: [
                { moduleIndex: 2, size: 0x100 },
                { moduleIndex: 7, size: 0x40 },
              ] },
            ],
          },
        },
      },
    } as any;
    const selected = selectExactPaletteModule(report, 'palette_module.asm');
    expect(selected?.module.moduleIndex).toBe(7);
    expect(selected?.moduleInfo.startOffset).toBe(0x100);
    expect(selected?.symbols).toHaveLength(1);
  });
});

describe('Pass 1E.3D.1 Kano index models', () => {
  it('evaluates zero-based and one-based models independently and leaves source index zero unresolved', () => {
    const record: WatcomPaletteRecord = {
      recordIndex: 0,
      watcomMapSegment: 2,
      watcomMapSegmentHex: '0x0002',
      watcomStartOffset: 0,
      watcomStartOffsetHex: hex(0),
      watcomEndOffset: 8,
      watcomEndOffsetHex: hex(8),
      physicalFileOffset: 0,
      physicalFileOffsetHex: hex(0),
      physicalEndOffset: 8,
      physicalEndOffsetHex: hex(8),
      declaredLength: 3,
      rawColorWords: [1, 2, 3],
      rawColorWordsHex: ['0x0001', '0x0002', '0x0003'],
      rgbColors: [],
      uniqueColorCount: 3,
      uniqueColorRatio: 1,
      contentHash: 'ABC',
      allWords15BitValid: true,
      isPaletteStructValid: true,
      symbolNames: ['palette_alpha'],
      symbolGlobalIndices: [0],
      duplicateContentOfRecordIndex: null,
    };
    const kano = {
      sampleCount: 4,
      aggregateStats: {
        sampleCount: 4,
        minSourceIndex: 0,
        maxSourceIndex: 3,
        distinctCount: 4,
        unionIndices: [0, 1, 2, 3],
      },
    } as AuthoritativeKanoResult;
    const c = compareKanoPaletteToSprites(record, kano);
    expect(c.zeroBasedModel.outOfRangeIndices).toEqual([3]);
    expect(c.oneBasedModel.outOfRangeIndices).toEqual([]);
    expect(c.opaqueZeroResolution).toBe('OBSERVED_UNRESOLVED');
  });
});

describe('Pass 1E.3D.1 repeated-byte DWORD validator', () => {
  it('verifies a complete repeated-byte table', () => {
    const bytes = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i++) bytes.fill(i, i * 4, i * 4 + 4);
    const r = validateRepeatedByteDwordTable(bytes);
    expect(r.patternVerified).toBe(true);
    expect(r.matchingEntries).toBe(256);
  });

  it('reports mismatch and truncation', () => {
    const mismatch = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i++) mismatch.fill(i, i * 4, i * 4 + 4);
    mismatch[5 * 4] = 0xff;
    expect(validateRepeatedByteDwordTable(mismatch).firstMismatch?.index).toBe(5);
    expect(validateRepeatedByteDwordTable(mismatch.slice(0, 100 * 4)).patternVerified).toBe(false);
  });
});

describe('Pass 1E.3D.1 authoritative export provenance', () => {
  it('rejects synthetic provenance before any research artifact can be emitted', () => {
    const report = {
      provenance: {
        sourceKind: 'in-memory-buffer',
        fileName: 'APP.BIN',
        byteLength: 1,
        sha256: null,
        synthetic: true,
        artifactGeneratedByTest: true,
        timestamp: new Date().toISOString(),
        operationId: 'test',
      },
      fixture: { exePath: 'APP.BIN', exeSize: 1, exeSizeHex: hex(1) },
    } as MK1WatcomDataImagePaletteGroundTruthReport;
    expect(() => createMK1WatcomDataImagePaletteGroundTruthExport(report)).toThrow(/Synthetic fixtures/);
  });
});
