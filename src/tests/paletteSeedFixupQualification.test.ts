import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import {
  getPageFixupOffsets,
  LEHeader,
  LEPageFixupInfo,
  parsePageFixups,
  parseSingleFixupRecord,
  traverseLEInternalChain,
} from '../core/executable/le/leFixupParser';
import { BinaryReader } from '../core/binary/BinaryReader';
import {
  createMK1CompactPaletteSeedFixupQualificationExport,
  getLogicalPageData,
  mapPhysicalOffsetToLogicalPage,
  performMechanicalValidation,
  performPaletteSeedFixupQualification,
  qualifySeedFieldFixup,
  summarizeTargetPageChaining,
} from '../games/mk1/research/paletteSeedFixupQualification';
import {
  B10C_EPISTEMIC_RULES,
  B10C_EXPORT_FORMAT_VERSION,
} from '../games/mk1/research/paletteSeedFixupQualificationTypes';

function createMockHeader(): LEHeader {
  return {
    signature: 'LE',
    byteOrder: 0,
    wordOrder: 0,
    formatLevel: 0,
    cpuType: 2,
    cpuTypeDescription: 'Intel 80386 (32-bit)',
    targetOs: 4,
    targetOsDescription: 'DOS 4.x',
    moduleVersion: 0,
    moduleFlags: 0,
    modulePageCount: 80,
    entryObject: 1,
    entryEip: 0x1000,
    entryEipHex: '0x00001000',
    stackObject: 1,
    stackEsp: 0x20000,
    stackEspHex: '0x00020000',
    pageSize: 4096,
    bytesOnLastPage: 4096,
    fixupSectionSize: 0x4000,
    loaderSectionSize: 0x1000,
    objectTableRelativeOffset: 0x40,
    objectTableFileOffset: 0x440,
    objectCount: 1,
    objectPageMapRelativeOffset: 0x80,
    objectPageMapFileOffset: 0x480,
    residentNameTableRelativeOffset: 0x100,
    residentNameTableFileOffset: 0x500,
    entryTableRelativeOffset: 0x180,
    entryTableFileOffset: 0x580,
    fixupPageTableRelativeOffset: 0x200,
    fixupPageTableFileOffset: 0x600, // 0x600
    fixupRecordTableRelativeOffset: 0x400,
    fixupRecordTableFileOffset: 0x800, // 0x800
    importModuleTableRelativeOffset: 0x600,
    importModuleTableFileOffset: 0xa00,
    importModuleCount: 0,
    importProcedureTableRelativeOffset: 0x700,
    importProcedureTableFileOffset: 0xb00,
    dataPagesFileOffset: 0x10000,
    preloadPageCount: 80,
    nonResidentNameTableFileOffset: 0x80000,
    nonResidentNameTableLength: 0,
    autoDataObject: 1,
    debugInfoFileOffset: 0,
    debugInfoLength: 0,
    heapSize: 0,
  };
}

function createMockLayoutReport(): MK1ExecutableLayoutReport {
  const header = createMockHeader();
  return {
    exePath: 'MK1.EXE',
    exeSize: 0x90000,
    parsedHeader: header,
    validationResult: {
      isValid: true,
      errors: [],
      warnings: [],
      rulesChecked: [],
    },
    objects: [
      {
        objectNumber: 1,
        virtualSize: 0x60000,
        virtualSizeHex: '0x00060000',
        relocationBaseAddress: 0x00010000,
        relocationBaseAddressHex: '0x00010000',
        objectFlags: 0x2005,
        pageMapIndex: 1,
        pageMapEntryCount: 80,
        reserved: 0,
        capabilities: 'Readable, Executable, 32-bit',
        roleEvidence: 'executable-code-like',
        physicalSpans: [
          {
            fileStart: 0x10000,
            fileEnd: 0x60000,
            byteLength: 0x50000,
            objectPageStart: 0,
            pageCount: 80,
          },
        ],
      },
    ],
    objectDiagnostics: [],
    pageMap: [],
    pageMapDiagnostics: {
      totalEntries: 80,
      validEntries: 80,
      mappedValidEntries: 80,
      iteratedEntries: 0,
      invalidEntries: 0,
      zeroFilledEntries: 0,
      rangeEntries: 0,
      unknownEntries: 0,
      minDecodedPhysicalPageNumber: 1,
      maxDecodedPhysicalPageNumber: 80,
      entries: [],
    },
    topology: {
      totalFileSize: 0x90000,
      totalFileSizeHex: '0x00090000',
      boundaries: {
        highestFileBackedPageEnd: 0x60000,
        highestFileBackedPageEndHex: '0x00060000',
        headerDerivedPageDataEnd: 0x60000,
        headerDerivedPageDataEndHex: '0x00060000',
        discrepancyBytes: 0,
        discrepancyExplanation: 'Match',
      },
      postModuleTail: {
        startOffset: 0x60000,
        startOffsetHex: '0x00060000',
        endOffset: 0x90000,
        endOffsetHex: '0x00090000',
        byteLength: 0x30000,
        percentageOfTotalExecutable: 33,
        containedAnchorNames: [],
        purpose: 'UNKNOWN',
        notes: '',
      },
      regions: [],
      gapCount: 0,
      totalGapBytes: 0,
    },
    validation: null,
    debugInfo: {
      debugInfoFileOffset: 0,
      debugInfoFileOffsetHex: '0x00000000',
      debugInfoLength: 0,
      debugInfoPresent: false,
      notes: '',
      status: 'UNKNOWN',
    },
    knownAnchors: [
      {
        name: 'kano_palette_structure',
        description: 'Kano palette structure',
        physicalStartOffset: 0x0002c400,
        physicalStartOffsetHex: '0x0002C400',
        physicalEndOffset: 0x0002c410,
        physicalEndOffsetHex: '0x0002C410',
        byteLength: 16,
        mappedObjectNumber: 1,
        mappedObjectOffset: 0x0001c400,
        mappedObjectOffsetHex: '0x0001C400',
        linearAddressCandidate: 0x0002c400,
        linearAddressCandidateHex: '0x0002C400',
        objectCapabilities: 'READABLE',
        objectRoleEvidence: 'executable-code-like',
        isContainedInSingleSpan: true,
      },
      {
        name: 'kano_palette_payload',
        description: 'Kano palette payload',
        physicalStartOffset: 0x0002c410,
        physicalStartOffsetHex: '0x0002C410',
        physicalEndOffset: 0x0002c440,
        physicalEndOffsetHex: '0x0002C440',
        byteLength: 48,
        mappedObjectNumber: 1,
        mappedObjectOffset: 0x0001c410,
        mappedObjectOffsetHex: '0x0001C410',
        linearAddressCandidate: 0x0002c410,
        linearAddressCandidateHex: '0x0002C410',
        objectCapabilities: 'READABLE',
        objectRoleEvidence: 'executable-code-like',
        isContainedInSingleSpan: true,
      },
    ],
  } as unknown as MK1ExecutableLayoutReport;
}

function createMockSource(buffer: Uint8Array): DirectorySource {
  return {
    readFile: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    readSlice: async (_path: string, offset: number, length: number) => {
      const slice = buffer.subarray(offset, offset + length);
      const copy = new Uint8Array(slice.byteLength);
      copy.set(slice);
      return copy.buffer;
    },
    scanFiles: async () => ['MK1.EXE'],
    findFiles: async () => ['MK1.EXE'],
  } as unknown as DirectorySource;
}

describe('Pass 1E.2B.10c — LE Seed Fixup Qualification', () => {
  describe('LE Fixup Parser Core', () => {
    it('1. correctly reads Fixup Page Table offsets', () => {
      const header = createMockHeader();
      const buffer = new Uint8Array(0x10000);
      const view = new DataView(buffer.buffer);

      // FPT at 0x600:
      // Page 1 (entry 0): record start 0x0000
      // Page 2 (entry 1): record start 0x0010 (page 1 has 16 bytes)
      view.setUint32(0x600, 0x0000, true);
      view.setUint32(0x604, 0x0010, true);

      const offsets = getPageFixupOffsets(header, buffer, 1);
      expect(offsets.recordStartOffset).toBe(0x0000);
      expect(offsets.recordEndOffset).toBe(0x0010);
      expect(offsets.recordBytesLength).toBe(16);
    });

    it('2. throws RangeError when logical page number is out of bounds', () => {
      const header = createMockHeader();
      const buffer = new Uint8Array(0x10000);

      expect(() => getPageFixupOffsets(header, buffer, 0)).toThrow(RangeError);
      expect(() => getPageFixupOffsets(header, buffer, 81)).toThrow(RangeError);
    });

    it('3. correctly parses a single internal 32-bit offset fixup record (non-additive)', () => {
      // Record bytes:
      // SRC: 0x07 (32-bit offset)
      // FLAGS: 0x10 (internal ref, 32-bit target offset)
      // SRCOFF: 0x04BE (uint16 LE: 0xBE, 0x04)
      // TARGET OBJECT: 0x01 (uint8)
      // TARGET OFFSET: 0x0002C400 (uint32 LE: 0x00, 0xC4, 0x02, 0x00)
      const bytes = new Uint8Array([
        0x07, 0x10,
        0xbe, 0x04,
        0x01,
        0x00, 0xc4, 0x02, 0x00,
      ]);

      const reader = new BinaryReader(bytes);
      const record = parseSingleFixupRecord(reader);

      expect(record.srcType).toBe(0x07);
      expect(record.srcTypeDescription).toContain('32-bit Offset');
      expect(record.sourceByteLength).toBe(4);
      expect(record.targetType).toBe('internal');
      expect(record.isAdditive).toBe(false);
      expect(record.is32BitTargetOffset).toBe(true);
      expect(record.sourceOffsetsInPage).toEqual([0x04be]);
      expect(record.targetObjectNumber).toBe(1);
      expect(record.targetOffset).toBe(0x0002c400);
      expect(record.targetOffsetHex).toBe('0x0002C400');
      expect(record.recordByteLength).toBe(9);
    });

    it('4. correctly parses an additive internal fixup record with 32-bit displacement', () => {
      // SRC: 0x07 (32-bit offset)
      // FLAGS: 0x34 (internal ref, isAdditive=0x04, is32BitTargetOffset=0x10, is32BitAdditive=0x20)
      // SRCOFF: 0x01E6
      // TARGET OBJECT: 0x01
      // TARGET OFFSET: 0x00010000
      // ADDITIVE: 0x00002000
      const bytes = new Uint8Array([
        0x07, 0x34,
        0xe6, 0x01,
        0x01,
        0x00, 0x00, 0x01, 0x00,
        0x00, 0x20, 0x00, 0x00,
      ]);

      const reader = new BinaryReader(bytes);
      const record = parseSingleFixupRecord(reader);

      expect(record.isAdditive).toBe(true);
      expect(record.is32BitAdditive).toBe(true);
      expect(record.additiveDisplacement).toBe(0x2000);
      expect(record.additiveDisplacementHex).toBe('0x00002000');
      expect(record.targetOffset).toBe(0x10000);
    });

    it('5. correctly parses a source list fixup record', () => {
      // SRC: 0x27 (32-bit offset + Source List flag 0x20)
      // FLAGS: 0x10 (internal ref, 32-bit target offset)
      // CNT: 2 (2 source offsets)
      // TARGET OBJECT: 0x01
      // TARGET OFFSET: 0x00005000
      // SRCOFF 1: 0x0100
      // SRCOFF 2: 0x0200
      const bytes = new Uint8Array([
        0x27, 0x10,
        0x02,
        0x01,
        0x00, 0x50, 0x00, 0x00,
        0x00, 0x01,
        0x00, 0x02,
      ]);

      const reader = new BinaryReader(bytes);
      const record = parseSingleFixupRecord(reader);

      expect(record.isSourceList).toBe(true);
      expect(record.sourceOffsetsInPage).toEqual([0x0100, 0x0200]);
      expect(record.targetOffset).toBe(0x5000);
    });

    it('6. correctly parses 16-bit selector fixup (no target offset)', () => {
      // SRC: 0x02 (16-bit selector)
      // FLAGS: 0x00 (internal ref)
      // SRCOFF: 0x0050
      // TARGET OBJECT: 0x02
      const bytes = new Uint8Array([
        0x02, 0x00,
        0x50, 0x00,
        0x02,
      ]);

      const reader = new BinaryReader(bytes);
      const record = parseSingleFixupRecord(reader);

      expect(record.srcType).toBe(0x02);
      expect(record.sourceByteLength).toBe(2);
      expect(record.targetObjectNumber).toBe(2);
      expect(record.targetOffset).toBeNull();
    });
  });

  describe('Address & Logical Page Mapping', () => {
    it('7. correctly maps Class A operand physical offsets (0x5A4BE, 0x5A4F5) to Object 1 and Logical Page 75', () => {
      const report = createMockLayoutReport();

      const map1 = mapPhysicalOffsetToLogicalPage(0x0005a4be, report);
      expect(map1.objectNumber).toBe(1);
      expect(map1.logicalPageNumber).toBe(75);
      expect(map1.sourceOffsetInPage).toBe(0x04be);

      const map2 = mapPhysicalOffsetToLogicalPage(0x0005a4f5, report);
      expect(map2.objectNumber).toBe(1);
      expect(map2.logicalPageNumber).toBe(75);
      expect(map2.sourceOffsetInPage).toBe(0x04f5);
    });

    it('8. correctly maps Class B operand physical offsets (0x5E1E6, 0x5E20E) to Object 1 and Logical Page 79', () => {
      const report = createMockLayoutReport();

      const map1 = mapPhysicalOffsetToLogicalPage(0x0005e1e6, report);
      expect(map1.objectNumber).toBe(1);
      expect(map1.logicalPageNumber).toBe(79);
      expect(map1.sourceOffsetInPage).toBe(0x01e6);

      const map2 = mapPhysicalOffsetToLogicalPage(0x0005e20e, report);
      expect(map2.objectNumber).toBe(1);
      expect(map2.logicalPageNumber).toBe(79);
      expect(map2.sourceOffsetInPage).toBe(0x020e);
    });
  });

  describe('Field Fixup Qualification Logic', () => {
    it('9. classifies an exact 32-bit fixup match as covered', () => {
      const report = createMockLayoutReport();
      const mockRecord = parseSingleFixupRecord(
        new BinaryReader(
          new Uint8Array([
            0x07, 0x10,
            0xbe, 0x04,
            0x01,
            0x10, 0xc4, 0x01, 0x00,
          ]),
        ),
      );

      const pageInfo: LEPageFixupInfo = {
        logicalPageNumber: 75,
        fptTableIndex: 74,
        recordStartOffset: 0,
        recordEndOffset: 9,
        recordBytesLength: 9,
        recordFileStart: 0x800,
        recordFileEnd: 0x809,
        hasFixups: true,
        records: [mockRecord],
      };

      const fieldDef = {
        siteId: 'class-a-site-1',
        siteName: 'Class A Site 1',
        stateClass: 'Class A' as const,
        instructionPhysicalOffset: 0x0005a4bd,
        operandPhysicalOffset: 0x0005a4be,
        rawImmediateValue: 0x00002012,
        instructionMnemonic: 'MOV EAX, 0x00002012',
      };

      const result = qualifySeedFieldFixup(fieldDef, report, pageInfo);
      expect(result.classification).toBe('direct');
      expect(result.exactMatchFound).toBe(true);
      expect(result.isRawLiteral).toBe(false);
      expect(result.touchingFixupCount).toBe(1);
      expect(result.matchingFixups[0].preferredLinearCandidateHex).toBe('0x0002C410');
      expect(result.matchingFixups[0].anchorComparison?.isKnownPaletteCoordinate).toBe(true);
    });

    it('10. classifies field as no-fixup when page has no fixups covering the operand', () => {
      const report = createMockLayoutReport();
      const pageInfo: LEPageFixupInfo = {
        logicalPageNumber: 75,
        fptTableIndex: 74,
        recordStartOffset: 0,
        recordEndOffset: 0,
        recordBytesLength: 0,
        recordFileStart: 0x800,
        recordFileEnd: 0x800,
        hasFixups: false,
        records: [],
      };

      const fieldDef = {
        siteId: 'class-a-site-1',
        siteName: 'Class A Site 1',
        stateClass: 'Class A' as const,
        instructionPhysicalOffset: 0x0005a4bd,
        operandPhysicalOffset: 0x0005a4be,
        rawImmediateValue: 0x00002012,
        instructionMnemonic: 'MOV EAX, 0x00002012',
      };

      const result = qualifySeedFieldFixup(fieldDef, report, pageInfo);
      expect(result.classification).toBe('no-fixup');
      expect(result.exactMatchFound).toBe(false);
      expect(result.overlappingFound).toBe(false);
      expect(result.isRawLiteral).toBe(true);
      expect(result.classificationDescription).toContain('remains a compile-time raw immediate literal');
    });

    it('11. classifies field as overlapping when fixup touches only part of 4-byte span', () => {
      const report = createMockLayoutReport();
      // Fixup at offset 0x04BD (1 byte before 0x04BE) of length 2 bytes (0x04BD..0x04BF)
      const mockRecord = parseSingleFixupRecord(
        new BinaryReader(
          new Uint8Array([
            0x05, 0x00, // 16-bit offset
            0xbd, 0x04,
            0x01,
            0x00, 0x10,
          ]),
        ),
      );

      const pageInfo: LEPageFixupInfo = {
        logicalPageNumber: 75,
        fptTableIndex: 74,
        recordStartOffset: 0,
        recordEndOffset: 7,
        recordBytesLength: 7,
        recordFileStart: 0x800,
        recordFileEnd: 0x807,
        hasFixups: true,
        records: [mockRecord],
      };

      const fieldDef = {
        siteId: 'class-a-site-1',
        siteName: 'Class A Site 1',
        stateClass: 'Class A' as const,
        instructionPhysicalOffset: 0x0005a4bd,
        operandPhysicalOffset: 0x0005a4be,
        rawImmediateValue: 0x00002012,
        instructionMnemonic: 'MOV EAX, 0x00002012',
      };

      const result = qualifySeedFieldFixup(fieldDef, report, pageInfo);
      expect(result.classification).toBe('overlapping');
      expect(result.overlappingFound).toBe(true);
      expect(result.exactMatchFound).toBe(false);
    });

    it('12. classifies field as ambiguous if pageInfo reports parseError', () => {
      const report = createMockLayoutReport();
      const pageInfo: LEPageFixupInfo = {
        logicalPageNumber: 75,
        fptTableIndex: 74,
        recordStartOffset: 0,
        recordEndOffset: 10,
        recordBytesLength: 10,
        recordFileStart: 0x800,
        recordFileEnd: 0x80a,
        hasFixups: false,
        records: [],
        parseError: 'Unexpected EOF at offset 0x805',
      };

      const fieldDef = {
        siteId: 'class-a-site-1',
        siteName: 'Class A Site 1',
        stateClass: 'Class A' as const,
        instructionPhysicalOffset: 0x0005a4bd,
        operandPhysicalOffset: 0x0005a4be,
        rawImmediateValue: 0x00002012,
        instructionMnemonic: 'MOV EAX, 0x00002012',
      };

      const result = qualifySeedFieldFixup(fieldDef, report, pageInfo);
      expect(result.classification).toBe('ambiguous');
      expect(result.classificationDescription).toContain('could not be parsed');
    });

    it('12b. classifies field as chained when it is a non-first member of an internal chaining fixup', () => {
      const report = createMockLayoutReport();
      // Record with FLAGS 0x18 (FLAGS bit 0x08 internal chaining + bit 0x10 32-bit target offset)
      const chainingRecord = parseSingleFixupRecord(
        new BinaryReader(
          new Uint8Array([
            0x07, 0x18, // 32-bit offset fixup, chaining + 32-bit target offset
            0x00, 0x01, // head offset = 0x0100
            0x01,       // target object = 1
            0x00, 0x20, 0x01, 0x00, // target offset = 0x00012000
          ]),
        ),
      );

      // Create a page of 4096 bytes
      const pageBytes = new Uint8Array(4096);
      const pageView = new DataView(pageBytes.buffer);

      // Spec-correct DWORD: (nextOffset << 20) | targetOffset20
      // At head (0x0100): next pointer is 0x04BE (our seed operand field!), targetOffset20 = 0x02000
      pageView.setUint32(0x0100, ((0x04be << 20) | 0x02000) >>> 0, true);
      // At 0x04BE: terminal marker 0xFFF, targetOffset20 = 0x02012
      pageView.setUint32(0x04be, ((0x0fff << 20) | 0x02012) >>> 0, true);

      const pageInfo: LEPageFixupInfo = {
        logicalPageNumber: 75,
        fptTableIndex: 74,
        recordStartOffset: 0,
        recordEndOffset: 9,
        recordBytesLength: 9,
        recordFileStart: 0x800,
        recordFileEnd: 0x809,
        hasFixups: true,
        records: [chainingRecord],
      };

      const fieldDef = {
        siteId: 'class-a-site-1',
        siteName: 'Class A Site 1',
        stateClass: 'Class A' as const,
        instructionPhysicalOffset: 0x0005a4bd,
        operandPhysicalOffset: 0x0005a4be, // 0x5a4be maps to offset 0x04BE in page 75
        rawImmediateValue: 0x00002012,
        instructionMnemonic: 'MOV EAX, 0x00002012',
      };

      const result = qualifySeedFieldFixup(fieldDef, report, pageInfo, pageBytes);
      expect(result.classification).toBe('chained');
      expect(result.chainedMatchFound).toBe(true);
      expect(result.chainMemberIndex).toBe(1); // Second in chain (head=0, 0x04be=1)
      expect(result.exactMatchFound).toBe(false);
      expect(result.isRawLiteral).toBe(false);
      expect(result.matchingFixups.length).toBe(1);
      expect(result.matchingFixups[0].relation).toBe('chained-member');
      expect(result.classificationDescription).toContain('verified member (index 1)');
      // Base target = 0x00012000 - 0x02000 = 0x00010000
      // Member 1 target = 0x00010000 + 0x02012 = 0x00012012
      // Target linear candidate = relocBase (0x00010000) + 0x00012012 = 0x00022012
      expect(result.matchingFixups[0].preferredLinearCandidate).toBe(0x00022012);
    });
  });

  describe('LE Internal Chaining & Signed Offsets (Pass 1E.2B.10c.2 Focus)', () => {
    it('12c. parses signed negative source offsets correctly for cross-page fixup', () => {
      // Offset 0xFFF0 as signed 16-bit is -16
      const reader = new BinaryReader(
        new Uint8Array([
          0x07, 0x00,
          0xf0, 0xff, // -16 in signed 16-bit
          0x01,
          0x00, 0x10, 0x00, 0x00,
        ]),
      );
      const record = parseSingleFixupRecord(reader);
      expect(record.sourceOffsetsInPage).toEqual([-16]);
    });

    it('12d. traverses spec-correct multi-member chain and detects terminal 0xFFF', () => {
      const chainingRecord = parseSingleFixupRecord(
        new BinaryReader(
          new Uint8Array([
            0x07, 0x18, // FLAGS 0x18 (chaining 0x08 + 32-bit target offset 0x10)
            0x20, 0x00, // head = 0x0020
            0x01,
            0x00, 0x20, 0x01, 0x00, // target offset = 0x00012000
          ]),
        ),
      );

      const pageBytes = new Uint8Array(4096);
      const view = new DataView(pageBytes.buffer);

      // Chain: 0x0020 -> 0x0100 -> 0x0250 -> 0xFFF
      // Member 0 at 0x0020: next = 0x0100, targetOffset20 = 0x02000
      view.setUint32(0x0020, ((0x0100 << 20) | 0x02000) >>> 0, true);
      // Member 1 at 0x0100: next = 0x0250, targetOffset20 = 0x02080
      view.setUint32(0x0100, ((0x0250 << 20) | 0x02080) >>> 0, true);
      // Member 2 at 0x0250: next = 0x0FFF (terminal), targetOffset20 = 0x03100
      view.setUint32(0x0250, ((0x0fff << 20) | 0x03100) >>> 0, true);

      const traversal = traverseLEInternalChain(chainingRecord, 0x0020, pageBytes, 4096);
      expect(traversal.chainOffsets).toEqual([0x0020, 0x0100, 0x0250]);
      expect(traversal.status).toBe('terminal-0xfff');
      expect(traversal.isTerminated).toBe(true);
      expect(traversal.terminalValue).toBe(((0x0fff << 20) | 0x03100) >>> 0);
      expect(traversal.members.length).toBe(3);

      // Verify decoding:
      expect(traversal.members[0].nextSourceOffset).toBe(0x0100);
      expect(traversal.members[0].targetOffset20).toBe(0x02000);
      expect(traversal.members[1].nextSourceOffset).toBe(0x0250);
      expect(traversal.members[1].targetOffset20).toBe(0x02080);
      expect(traversal.members[2].nextSourceOffset).toBe(0x0fff);
      expect(traversal.members[2].targetOffset20).toBe(0x03100);
    });

    it('12d2. reconstructs baseTarget and each member derivedTargetOffset correctly', () => {
      const chainingRecord = parseSingleFixupRecord(
        new BinaryReader(
          new Uint8Array([
            0x07, 0x18, // FLAGS 0x18 (chaining 0x08 + 32-bit target offset 0x10)
            0x10, 0x00, // head = 0x0010
            0x01,
            0x00, 0x20, 0x01, 0x00, // target offset = 0x00012000
          ]),
        ),
      );

      const pageBytes = new Uint8Array(4096);
      const view = new DataView(pageBytes.buffer);

      // Head targetOffset20 = 0x02000.
      // Base target = firstTarget (0x00012000) - firstMember.targetOffset20 (0x02000) = 0x00010000.
      view.setUint32(0x0010, ((0x0080 << 20) | 0x02000) >>> 0, true);
      // Member 1 targetOffset20 = 0x02040 -> derived = 0x00010000 + 0x02040 = 0x00012040.
      view.setUint32(0x0080, ((0x0150 << 20) | 0x02040) >>> 0, true);
      // Member 2 targetOffset20 = 0x03500 -> derived = 0x00010000 + 0x03500 = 0x00013500.
      view.setUint32(0x0150, ((0x0fff << 20) | 0x03500) >>> 0, true);

      const traversal = traverseLEInternalChain(chainingRecord, 0x0010, pageBytes, 4096);
      expect(traversal.baseTarget).toBe(0x00010000);
      expect(traversal.baseTargetHex).toBe('0x00010000');
      expect(traversal.members[0].derivedTargetOffset).toBe(0x00012000);
      expect(traversal.members[1].derivedTargetOffset).toBe(0x00012040);
      expect(traversal.members[2].derivedTargetOffset).toBe(0x00013500);
    });

    it('12e. detects circular chain loop deterministically without hanging', () => {
      const chainingRecord = parseSingleFixupRecord(
        new BinaryReader(
          new Uint8Array([
            0x07, 0x08, // FLAGS 0x08 (chaining)
            0x40, 0x00, // head = 0x0040
            0x01,
            0x00, 0x00, 0x01, 0x00,
          ]),
        ),
      );

      const pageBytes = new Uint8Array(4096);
      const view = new DataView(pageBytes.buffer);

      // Loop: 0x0040 -> 0x0080 -> 0x0040
      view.setUint32(0x0040, (0x0080 << 20) | 0x01000, true);
      view.setUint32(0x0080, (0x0040 << 20) | 0x02000, true);

      const traversal = traverseLEInternalChain(chainingRecord, 0x0040, pageBytes, 4096);
      expect(traversal.status).toBe('loop-detected');
      expect(traversal.isTerminated).toBe(false);
      expect(traversal.error).toContain('Loop detected');
      expect(traversal.chainOffsets).toEqual([0x0040, 0x0080]);
    });

    it('12e2. detects self-loop deterministically', () => {
      const chainingRecord = parseSingleFixupRecord(
        new BinaryReader(
          new Uint8Array([
            0x07, 0x08, // FLAGS 0x08 (chaining)
            0x60, 0x00, // head = 0x0060
            0x01,
            0x00, 0x00, 0x01, 0x00,
          ]),
        ),
      );

      const pageBytes = new Uint8Array(4096);
      const view = new DataView(pageBytes.buffer);

      // Self-loop: 0x0060 -> 0x0060
      view.setUint32(0x0060, (0x0060 << 20) | 0x01000, true);

      const traversal = traverseLEInternalChain(chainingRecord, 0x0060, pageBytes, 4096);
      expect(traversal.status).toBe('loop-detected');
      expect(traversal.isTerminated).toBe(false);
      expect(traversal.chainOffsets).toEqual([0x0060]);
    });

    it('12e3. detects malformed/out-of-page next offset', () => {
      const chainingRecord = parseSingleFixupRecord(
        new BinaryReader(
          new Uint8Array([
            0x07, 0x08, // FLAGS 0x08 (chaining)
            0x20, 0x00, // head = 0x0020
            0x01,
            0x00, 0x00, 0x01, 0x00,
          ]),
        ),
      );

      const pageBytes = new Uint8Array(4096);
      const view = new DataView(pageBytes.buffer);

      // Next offset is 4094, which exceeds 4096 for a 4-byte read (4094 + 4 = 4098 > 4096)
      view.setUint32(0x0020, (4094 << 20) | 0x01000, true);

      const traversal = traverseLEInternalChain(chainingRecord, 0x0020, pageBytes, 4096);
      expect(traversal.status).toBe('malformed-bounds');
      expect(traversal.isTerminated).toBe(false);
      expect(traversal.error).toContain('extends beyond page bounds');
      expect(traversal.chainOffsets).toEqual([0x0020]);
    });

    it('12e4. rejects invalid chained source/target forms', () => {
      // 1. Invalid source type (0x05 instead of 0x07)
      const invalidSrcRecord = parseSingleFixupRecord(
        new BinaryReader(
          new Uint8Array([
            0x05, 0x08, // 16-bit offset (05h) with chaining
            0x20, 0x00,
            0x01,
            0x00, 0x00,
          ]),
        ),
      );
      const pageBytes = new Uint8Array(4096);
      const res1 = traverseLEInternalChain(invalidSrcRecord, 0x0020, pageBytes, 4096);
      expect(res1.status).toBe('invalid-form');
      expect(res1.error).toContain('Invalid chained fixup form');

      // 2. Invalid target type (imported ordinal 01h)
      const invalidTargetRecord = parseSingleFixupRecord(
        new BinaryReader(
          new Uint8Array([
            0x07, 0x09, // 32-bit offset (07h), chaining (08h) + imported ordinal (01h) = 09h
            0x20, 0x00,
            0x01,       // module ordinal
            0x10, 0x00, // import ordinal
          ]),
        ),
      );
      const res2 = traverseLEInternalChain(invalidTargetRecord, 0x0020, pageBytes, 4096);
      expect(res2.status).toBe('invalid-form');
      expect(res2.error).toContain('Invalid chained fixup form');

      // 3. Invalid source list flag (bit 0x20 in rawSrc)
      const invalidSourceListRecord = parseSingleFixupRecord(
        new BinaryReader(
          new Uint8Array([
            0x27, 0x08, // Source List (0x20) + 32-bit (0x07), chaining (0x08)
            0x01,       // count = 1
            0x20, 0x00, // source offset
            0x01,
            0x00, 0x00, 0x01, 0x00,
          ]),
        ),
      );
      const res3 = traverseLEInternalChain(invalidSourceListRecord, 0x0020, pageBytes, 4096);
      expect(res3.status).toBe('invalid-form');
      expect(res3.error).toContain('Invalid chained fixup form');

      // 4. Valid internal-entry-table form (03h) is accepted
      const validEntryTableRecord = parseSingleFixupRecord(
        new BinaryReader(
          new Uint8Array([
            0x07, 0x0b, // 32-bit offset (07h), chaining (08h) + entry table (03h) = 0Bh
            0x20, 0x00,
            0x05,       // entry table ordinal = 5
          ]),
        ),
      );
      const view = new DataView(pageBytes.buffer);
      view.setUint32(0x0020, (0x0fff << 20) | 0x00000, true);
      const res4 = traverseLEInternalChain(validEntryTableRecord, 0x0020, pageBytes, 4096);
      expect(res4.status).toBe('terminal-0xfff');
      expect(res4.isTerminated).toBe(true);
    });

    it('12f. summarizes target pages 49 and 52 chaining and reports field coverage', () => {
      const report = createMockLayoutReport();
      const buffer = new Uint8Array(0x90000);
      const view = new DataView(buffer.buffer);

      // Page 49: FPT index 48. Start at 0, length 0
      view.setUint32(0x600 + 48 * 4, 0x0000, true);
      view.setUint32(0x600 + 49 * 4, 0x0000, true);

      // Page 52: FPT index 51. Start at 0, length 0
      view.setUint32(0x600 + 51 * 4, 0x0000, true);
      view.setUint32(0x600 + 52 * 4, 0x0000, true);

      const targetSeedFields = [
        {
          siteId: 'class-a-site-1',
          siteName: 'Class A Site 1',
          stateClass: 'Class A' as const,
          instructionPhysicalOffset: 0x0005a4bd,
          operandPhysicalOffset: 0x0005a4be,
          rawImmediateValue: 0x00002012,
          instructionMnemonic: 'MOV EAX, 0x00002012',
        },
      ];

      const summary49 = summarizeTargetPageChaining(49, report, buffer, targetSeedFields);
      expect(summary49.logicalPageNumber).toBe(49);
      expect(summary49.directFixupRecordCount).toBe(0);
      expect(summary49.chainingRecordCount).toBe(0);
      expect(summary49.expandedChainMemberOffsets).toEqual([]);
      expect(summary49.allChainsResolved).toBe(true);
      expect(summary49.fieldCoverage[0].isCovered).toBe(false);

      const summary52 = summarizeTargetPageChaining(52, report, buffer, targetSeedFields);
      expect(summary52.logicalPageNumber).toBe(52);
      expect(summary52.directFixupRecordCount).toBe(0);
      expect(summary52.chainingRecordCount).toBe(0);
      expect(summary52.expandedChainMemberOffsets).toEqual([]);
      expect(summary52.allChainsResolved).toBe(true);
      expect(summary52.fieldCoverage[0].isCovered).toBe(false);
    });
  });

  describe('Mechanical Validation and Full Pipeline', () => {
    it('13. performs mechanical validation across non-target pages with fixups', () => {
      const report = createMockLayoutReport();
      const buffer = new Uint8Array(0x90000);
      const view = new DataView(buffer.buffer);

      // FPT at 0x600:
      // Set page 10 to have a valid fixup record
      // Entry 9 (page 10): record start 0x0000
      // Entry 10 (page 11): record start 0x0009
      view.setUint32(0x600 + 9 * 4, 0x0000, true);
      view.setUint32(0x600 + 10 * 4, 0x0009, true);

      // Put record at Fixup Record Table file offset 0x800 + 0 = 0x800
      buffer.set(
        [0x07, 0x10, 0x50, 0x00, 0x01, 0x00, 0x10, 0x00, 0x00],
        0x800,
      );

      const validation = performMechanicalValidation(report, buffer, [75, 79]);
      expect(validation.parserValidated).toBe(true);
      expect(validation.knownGoodPagesSampled).toBeGreaterThanOrEqual(1);
      expect(validation.totalFixupsParsedOnSampledPages).toBe(1);
      expect(validation.sampledPageSummaries[0].logicalPageNumber).toBe(10);
      expect(validation.sampledPageSummaries[0].recordCount).toBe(1);
    });

    it('14. executes full qualification pipeline on all 4 fields and satisfies all epistemic rules', async () => {
      const report = createMockLayoutReport();
      const buffer = new Uint8Array(0x90000);
      const view = new DataView(buffer.buffer);

      // Set page 10 (control page) in FPT
      view.setUint32(0x600 + 9 * 4, 0x0000, true);
      view.setUint32(0x600 + 10 * 4, 0x0009, true);
      buffer.set(
        [0x07, 0x10, 0x50, 0x00, 0x01, 0x00, 0x10, 0x00, 0x00],
        0x800,
      );

      // Page 75 (entry 74) and Page 79 (entry 78):
      // Set record lengths to 0 (no fixups)
      view.setUint32(0x600 + 74 * 4, 0x0009, true);
      view.setUint32(0x600 + 75 * 4, 0x0009, true); // Page 75 length = 0
      view.setUint32(0x600 + 78 * 4, 0x0009, true);
      view.setUint32(0x600 + 79 * 4, 0x0009, true); // Page 79 length = 0

      const source = createMockSource(buffer);
      const result = await performPaletteSeedFixupQualification(source, report);

      expect(result.status).toBe('SUCCESS');
      expect(result.epistemicRules).toEqual(B10C_EPISTEMIC_RULES);
      expect(result.seedFields.length).toBe(4);

      // Both Class A and Class B fields are classified as no-fixup (compile-time raw literals)
      for (const field of result.seedFields) {
        expect(field.classification).toBe('no-fixup');
        expect(field.isRawLiteral).toBe(true);
      }

      expect(result.reconciliation.allReconciled).toBe(true);
      expect(result.reconciliation.fourFieldsEvaluated).toBe(true);
      expect(result.reconciliation.classACovered).toBe(false);
      expect(result.reconciliation.classBCovered).toBe(false);
      expect(result.reconciliation.rulesHonored.candidateBoundaryNotFollowed).toBe(true);
      expect(result.reconciliation.rulesHonored.disassemblyNotExtended).toBe(true);
      expect(result.reconciliation.rulesHonored.no0x53CA1Inspection).toBe(true);
      expect(result.reconciliation.rulesHonored.noSegmentInference).toBe(true);
      expect(result.reconciliation.rulesHonored.noDos4gwAssumption).toBe(true);
      expect(result.reconciliation.rulesHonored.noPointerAssumption).toBe(true);
      expect(result.reconciliation.rulesHonored.noPaletteConsumerClaim).toBe(true);
    });

    it('15. compact export produces valid format conforming to B10c schema', async () => {
      const report = createMockLayoutReport();
      const buffer = new Uint8Array(0x90000);
      const view = new DataView(buffer.buffer);

      // Set page 10 (control page) in FPT
      view.setUint32(0x600 + 9 * 4, 0x0000, true);
      view.setUint32(0x600 + 10 * 4, 0x0009, true);
      buffer.set(
        [0x07, 0x10, 0x50, 0x00, 0x01, 0x00, 0x10, 0x00, 0x00],
        0x800,
      );

      const source = createMockSource(buffer);

      const result = await performPaletteSeedFixupQualification(source, report);
      const exportData = createMK1CompactPaletteSeedFixupQualificationExport(result);

      const timestampStr = result.timestamp.replace(/[:.]/g, '-');
      fs.writeFileSync(
        `mk1_palette_seed_fixup_qualification_${timestampStr}.json`,
        JSON.stringify(exportData, null, 2),
      );
      fs.writeFileSync(
        'mk1_palette_seed_fixup_qualification_latest.json',
        JSON.stringify(exportData, null, 2),
      );

      expect(exportData.exportHeader.formatVersion).toBe(B10C_EXPORT_FORMAT_VERSION);
      expect(exportData.exportHeader.operationId).toBe('mk1-palette-seed-fixup-qualification');
      expect(exportData.status).toBe('SUCCESS');
      expect(exportData.seedFields.length).toBe(4);
      expect(exportData.reconciliation.allReconciled).toBe(true);
      expect(exportData.fixture.exePath).toBe('MK1.EXE');
    });
  });
});
