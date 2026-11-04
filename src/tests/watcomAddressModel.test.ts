import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import { MemoryDirectorySource } from '../core/filesystem/DirectorySource';
import {
  inspectOffsetBacking,
  qualifyWatcomAddressModel,
  reconcileModuleRanges,
  reconcileSpanFileBacking,
  reconcileUnresolvedCoverage,
  resolveLePhysicalOffset,
} from '../core/executable/watcomDebug/watcomAddressModelQualifier';
import {
  qualifyMK1WatcomAddressModelForTest,
  createMK1WatcomAddressModelExport,
  serializeWatcomAddressModelNonAuthoritative,
  MK1WatcomAddressModelReport,
} from '../games/mk1/research/watcomAddressModelInventory';
import {
  LEObjectEntry,
  LEPageMapEntry,
} from '../core/executable/le/leTypes';
import { WatcomSegmentQualification } from '../core/executable/watcomDebug/watcomAddressModelTypes';
import {
  WatcomAddressInfoClass,
  WatcomGlobalSymbol,
  WatcomGlobalSymbolClass,
  WatcomSegmentAddressTable,
} from '../core/executable/watcomDebug/watcomPermanentClassTypes';

/**
 * Builds mock LE objects for testing address model qualification.
 */
function createMockLeObjects(): {
  objects: LEObjectEntry[];
  pageSize: number;
  pageMap: LEPageMapEntry[];
} {
  const pageSize = 4096;

  // Object 1: Code (R-X), Base 0x00010000, Virtual Size 0x00040000 (64 pages)
  const obj1: LEObjectEntry = {
    objectNumber: 1,
    virtualSize: 0x00040000,
    virtualSizeHex: '0x00040000',
    relocationBaseAddress: 0x00010000,
    relocationBaseAddressHex: '0x00010000',
    rawFlags: 0x2005, // Read, Execute, 32-bit
    flags: {
      readable: true,
      writable: false,
      executable: true,
      resource: false,
      discardable: false,
      shared: false,
      preload: true,
      invalid: false,
      swappable: false,
      resident: true,
      big32Bit: true,
    },
    pageMapIndex: 1,
    pageMapEntryCount: 16,
    capabilities: 'R-X / 32-bit',
    roleEvidence: 'executable-code-like',
    physicalSpans: [{ fileStart: 0x1000, fileEnd: 0x11000, byteLength: 0x10000, objectPageStart: 1, pageCount: 16 }],
    mappedPageCount: 16,
    zeroFilledPageCount: 0,
  };

  // Object 2: Data (RW-), Base 0x00050000, Virtual Size 0x00020000 (32 pages: 8 file-backed, 2 zero-filled, rest unbacked beyond table)
  const obj2: LEObjectEntry = {
    objectNumber: 2,
    virtualSize: 0x00020000,
    virtualSizeHex: '0x00020000',
    relocationBaseAddress: 0x00050000,
    relocationBaseAddressHex: '0x00050000',
    rawFlags: 0x2003, // Read, Write, 32-bit
    flags: {
      readable: true,
      writable: true,
      executable: false,
      resource: false,
      discardable: false,
      shared: false,
      preload: true,
      invalid: false,
      swappable: false,
      resident: true,
      big32Bit: true,
    },
    pageMapIndex: 17,
    pageMapEntryCount: 10,
    capabilities: 'RW- / 32-bit',
    roleEvidence: 'read-write-data-like',
    physicalSpans: [{ fileStart: 0x11000, fileEnd: 0x19000, byteLength: 0x8000, objectPageStart: 1, pageCount: 8 }],
    mappedPageCount: 8,
    zeroFilledPageCount: 2,
  };

  const pageMap: LEPageMapEntry[] = [];

  // Pages 1..16: Object 1 valid pages
  for (let i = 1; i <= 16; i++) {
    pageMap.push({
      pageMapIndex: i,
      physicalPageNumber: i,
      rawBytes: [i, 0, 0],
      rawFlags: 0,
      pageType: 'valid',
      physicalFileStart: 0x1000 + (i - 1) * pageSize,
      physicalByteLength: pageSize,
    });
  }

  // Pages 17..24: Object 2 valid pages (8 pages)
  for (let i = 1; i <= 8; i++) {
    pageMap.push({
      pageMapIndex: 16 + i,
      physicalPageNumber: 16 + i,
      rawBytes: [16 + i, 0, 0],
      rawFlags: 0,
      pageType: 'valid',
      physicalFileStart: 0x11000 + (i - 1) * pageSize,
      physicalByteLength: pageSize,
    });
  }

  // Pages 25..26: Object 2 zero-filled pages (2 pages)
  for (let i = 1; i <= 2; i++) {
    pageMap.push({
      pageMapIndex: 24 + i,
      physicalPageNumber: 0,
      rawBytes: [0, 0, 0],
      rawFlags: 0,
      pageType: 'zero-filled',
    });
  }

  return {
    objects: [obj1, obj2],
    pageSize,
    pageMap,
  };
}

describe('Pass 1E.3C.1: Watcom Address Semantics and Qualification Inventory', () => {
  describe('1. Structural Qualification & Runtime Epistemic Invariants', () => {
    it('uniquely qualifies segment 1 to Object 1 and derives candidate coordinates', () => {
      const { objects, pageSize, pageMap } = createMockLeObjects();

      const segmentAddresses: WatcomSegmentAddressTable = {
        fileOffset: 0,
        fileOffsetHex: '0x0',
        declaredByteLength: 2,
        consumedByteLength: 2,
        entryCount: 1,
        entries: [{ entryIndex: 0, segment: 1, segmentHex: '0x0001', fileOffset: 0, fileOffsetHex: '0x0', tableOffset: 0 }],
        valid: true,
        errors: [],
      };

      const globalSymbols: WatcomGlobalSymbolClass = {
        fileOffsetStart: 0,
        fileOffsetStartHex: '0x0',
        fileOffsetEnd: 0,
        fileOffsetEndHex: '0x0',
        declaredByteLength: 0,
        consumedByteLength: 0,
        symbolCount: 2,
        symbols: [
          {
            globalIndex: 0,
            fileOffset: 0,
            fileOffsetHex: '0x0',
            sectionOffset: 0,
            sectionOffsetHex: '0x0',
            recordByteLength: 10,
            addressOffset: 0x00010000,
            addressOffsetHex: '0x00010000',
            segment: 1,
            segmentHex: '0x0001',
            moduleIndex: 0,
            resolvedModuleName: null,
            rawKind: 4,
            kindBits: { isStatic: false, isData: false, isCode: true, rawKind: 4, rawKindHex: '0x04' },
            nameLength: 2,
            name: 'F1',
            valid: true,
          },
          {
            globalIndex: 1,
            fileOffset: 0,
            fileOffsetHex: '0x0',
            sectionOffset: 0,
            sectionOffsetHex: '0x0',
            recordByteLength: 10,
            addressOffset: 0x00020000,
            addressOffsetHex: '0x00020000',
            segment: 1,
            segmentHex: '0x0001',
            moduleIndex: 0,
            resolvedModuleName: null,
            rawKind: 4,
            kindBits: { isStatic: false, isData: false, isCode: true, rawKind: 4, rawKindHex: '0x04' },
            nameLength: 2,
            name: 'F2',
            valid: true,
          },
        ],
        tilingValid: true,
        valid: true,
        errors: [],
      };

      const addressInfo: WatcomAddressInfoClass = {
        fileOffsetStart: 0,
        fileOffsetStartHex: '0x0',
        fileOffsetEnd: 0,
        fileOffsetEndHex: '0x0',
        declaredByteLength: 0,
        consumedByteLength: 0,
        segmentRecordCount: 0,
        segmentRecords: [],
        tilingValid: true,
        valid: true,
        errors: [],
      };

      const res = qualifyWatcomAddressModel(
        segmentAddresses,
        globalSymbols,
        addressInfo,
        objects,
        pageSize,
        pageMap,
      );

      expect(res.segmentQualifications).toHaveLength(1);
      const q = res.segmentQualifications[0];
      expect(q.watcomSegment).toBe(1);
      expect(q.qualificationStatus).toBe('UNIQUELY_QUALIFIED');
      expect(q.qualifiedObjectNumber).toBe(1);
      expect(q.runtimeAddressVerified).toBe(false);

      // Symbol coordinate derivations
      expect(res.symbolCoordinateInventory).toHaveLength(2);
      const sym0 = res.symbolCoordinateInventory[0];
      expect(sym0.qualifiedLeObjectNumber).toBe(1);
      expect(sym0.candidateObjectRelativeOffset).toBe(0x00010000);
      expect(sym0.candidatePreferredLinearAddressHex).toBe('0x00020000'); // 0x10000 base + 0x10000 offset
      expect(sym0.runtimeAddressVerified).toBe(false);
    });

    it('preserves ambiguity when multiple LE objects satisfy containment and capabilities', () => {
      const { objects, pageSize, pageMap } = createMockLeObjects();

      // Create two objects with identical virtual size and capability
      const duplicateObjects: LEObjectEntry[] = [
        {
          ...objects[0],
          objectNumber: 1,
          virtualSize: 0x10000,
        },
        {
          ...objects[0],
          objectNumber: 3,
          virtualSize: 0x10000,
        },
      ];

      const segmentAddresses: WatcomSegmentAddressTable = {
        fileOffset: 0,
        fileOffsetHex: '0x0',
        declaredByteLength: 2,
        consumedByteLength: 2,
        entryCount: 1,
        entries: [{ entryIndex: 0, segment: 1, segmentHex: '0x0001', fileOffset: 0, fileOffsetHex: '0x0', tableOffset: 0 }],
        valid: true,
        errors: [],
      };

      const globalSymbols: WatcomGlobalSymbolClass = {
        fileOffsetStart: 0,
        fileOffsetStartHex: '0x0',
        fileOffsetEnd: 0,
        fileOffsetEndHex: '0x0',
        declaredByteLength: 0,
        consumedByteLength: 0,
        symbolCount: 1,
        symbols: [{
          globalIndex: 0,
          fileOffset: 0,
          fileOffsetHex: '0x0',
          sectionOffset: 0,
          sectionOffsetHex: '0x0',
          recordByteLength: 10,
          addressOffset: 0x100,
          addressOffsetHex: '0x00000100',
          segment: 1,
          segmentHex: '0x0001',
          moduleIndex: 0,
          resolvedModuleName: null,
          rawKind: 4,
          kindBits: { isStatic: false, isData: false, isCode: true, rawKind: 4, rawKindHex: '0x04' },
          nameLength: 1,
          name: 'S',
          valid: true,
        }],
        tilingValid: true,
        valid: true,
        errors: [],
      };

      const addressInfo: WatcomAddressInfoClass = {
        fileOffsetStart: 0,
        fileOffsetStartHex: '0x0',
        fileOffsetEnd: 0,
        fileOffsetEndHex: '0x0',
        declaredByteLength: 0,
        consumedByteLength: 0,
        segmentRecordCount: 0,
        segmentRecords: [],
        tilingValid: true,
        valid: true,
        errors: [],
      };

      const res = qualifyWatcomAddressModel(
        segmentAddresses,
        globalSymbols,
        addressInfo,
        duplicateObjects,
        pageSize,
        pageMap,
      );

      const q = res.segmentQualifications[0];
      expect(q.qualificationStatus).toBe('AMBIGUOUS');
      expect(q.qualifiedObjectNumber).toBeNull();
      expect(q.compatibleObjectNumbers).toEqual([1, 3]);

      // Coordinates must not be fabricated
      expect(res.symbolCoordinateInventory[0].qualifiedLeObjectNumber).toBeNull();
      expect(res.symbolCoordinateInventory[0].candidatePreferredLinearAddress).toBeNull();
    });
  });

  describe('2. Physical Backing Classifications (No BSS Assumptions)', () => {
    it('accurately identifies file-backed, page-padding, zero-filled, and beyond-page-table categories', () => {
      const { objects, pageSize, pageMap } = createMockLeObjects();
      const obj2 = objects[1]; // Base 0x50000, Virtual 0x20000, 8 valid pages, 2 zero-filled

      // Modify page 17 (first page of obj2) to have a physicalByteLength of 2048 (page padding slack test)
      pageMap[16].physicalByteLength = 2048;

      // 1. Within physicalByteLength (offset 0x100) -> FILE_BACKED
      const b1 = inspectOffsetBacking(0x100, obj2, pageSize, pageMap);
      expect(b1.physicalBackingCategory).toBe('FILE_BACKED');
      expect(b1.isFileBacked).toBe(true);
      expect(b1.physicalFileOffset).toBe(0x11000 + 0x100);

      // 2. In padding slack between 2048 and 4096 (offset 0xA00 = 2560) -> PAGE_PADDING
      const b2 = inspectOffsetBacking(0xA00, obj2, pageSize, pageMap);
      expect(b2.physicalBackingCategory).toBe('PAGE_PADDING');
      expect(b2.isFileBacked).toBe(false);

      // 3. In zero-filled page 8 (offset 8 * 4096 = 0x8000) -> ZERO_FILLED_PAGE
      const b3 = inspectOffsetBacking(0x8000, obj2, pageSize, pageMap);
      expect(b3.physicalBackingCategory).toBe('ZERO_FILLED_PAGE');
      expect(b3.isFileBacked).toBe(false);

      // 4. Beyond pageMapEntryCount 10 (offset 12 * 4096 = 0xC000) -> VIRTUAL_UNBACKED_BEYOND_PAGE_TABLE
      const b4 = inspectOffsetBacking(0xC000, obj2, pageSize, pageMap);
      expect(b4.physicalBackingCategory).toBe('VIRTUAL_UNBACKED_BEYOND_PAGE_TABLE');
      expect(b4.isFileBacked).toBe(false);

      // 5. Outside object virtual size (offset 0x25000 >= 0x20000) -> OUTSIDE_OBJECT
      const b5 = inspectOffsetBacking(0x25000, obj2, pageSize, pageMap);
      expect(b5.physicalBackingCategory).toBe('OUTSIDE_OBJECT');
      expect(b5.isFileBacked).toBe(false);
    });
  });

  describe('3. Module Range Reconciliation', () => {
    it('classifies symbols correctly into half-open spans, at-end boundaries, and exceptions', () => {
      const mockSymbols: WatcomGlobalSymbol[] = [
        // Inside defining span [0x1000, 0x2000)
        {
          globalIndex: 0,
          fileOffset: 0,
          fileOffsetHex: '0x0',
          sectionOffset: 0,
          sectionOffsetHex: '0x0',
          recordByteLength: 10,
          addressOffset: 0x1500,
          addressOffsetHex: '0x00001500',
          segment: 1,
          segmentHex: '0x0001',
          moduleIndex: 0,
          resolvedModuleName: 'MOD_A',
          rawKind: 4,
          kindBits: { isStatic: false, isData: false, isCode: true, rawKind: 4, rawKindHex: '0x04' },
          nameLength: 2,
          name: 'S0',
          valid: true,
        },
        // Exactly at end of defining span [0x1000, 0x2000) -> AT_DEFINING_MODULE_END
        {
          globalIndex: 1,
          fileOffset: 0,
          fileOffsetHex: '0x0',
          sectionOffset: 0,
          sectionOffsetHex: '0x0',
          recordByteLength: 10,
          addressOffset: 0x2000,
          addressOffsetHex: '0x00002000',
          segment: 1,
          segmentHex: '0x0001',
          moduleIndex: 0,
          resolvedModuleName: 'MOD_A',
          rawKind: 4,
          kindBits: { isStatic: false, isData: false, isCode: true, rawKind: 4, rawKindHex: '0x04' },
          nameLength: 2,
          name: 'S1',
          valid: true,
        },
        // Module B defining span is [0x2000, 0x3000), but symbol is at 0x1800 (falls inside Module A) -> INSIDE_DIFFERENT_MODULE_SPAN
        {
          globalIndex: 2,
          fileOffset: 0,
          fileOffsetHex: '0x0',
          sectionOffset: 0,
          sectionOffsetHex: '0x0',
          recordByteLength: 10,
          addressOffset: 0x1800,
          addressOffsetHex: '0x00001800',
          segment: 1,
          segmentHex: '0x0001',
          moduleIndex: 1,
          resolvedModuleName: 'MOD_B',
          rawKind: 4,
          kindBits: { isStatic: false, isData: false, isCode: true, rawKind: 4, rawKindHex: '0x04' },
          nameLength: 2,
          name: 'S2',
          valid: true,
        },
        // Outside entire address-info coverage (offset 0x5000 > 0x3000) -> OUTSIDE_ADDRESS_INFO_COVERAGE
        {
          globalIndex: 3,
          fileOffset: 0,
          fileOffsetHex: '0x0',
          sectionOffset: 0,
          sectionOffsetHex: '0x0',
          recordByteLength: 10,
          addressOffset: 0x5000,
          addressOffsetHex: '0x00005000',
          segment: 1,
          segmentHex: '0x0001',
          moduleIndex: 0,
          resolvedModuleName: 'MOD_A',
          rawKind: 4,
          kindBits: { isStatic: false, isData: false, isCode: true, rawKind: 4, rawKindHex: '0x04' },
          nameLength: 2,
          name: 'S3',
          valid: true,
        },
      ];

      const addressInfo: WatcomAddressInfoClass = {
        fileOffsetStart: 0,
        fileOffsetStartHex: '0x0',
        fileOffsetEnd: 0,
        fileOffsetEndHex: '0x0',
        declaredByteLength: 20,
        consumedByteLength: 20,
        segmentRecordCount: 1,
        segmentRecords: [
          {
            segInfoIndex: 0,
            fileOffset: 0,
            fileOffsetHex: '0x0',
            sectionOffset: 0,
            sectionOffsetHex: '0x0',
            recordByteLength: 20,
            startAddressOffset: 0x1000,
            startAddressOffsetHex: '0x00001000',
            segment: 1,
            segmentHex: '0x0001',
            rawNum: 2,
            rawNumHex: '0x0002',
            entryCount: 2,
            isNonSect: false,
            entries: [
              { entryIndex: 0, size: 0x1000, sizeHex: '0x00001000', moduleIndex: 0, resolvedModuleName: 'MOD_A' },
              { entryIndex: 1, size: 0x1000, sizeHex: '0x00001000', moduleIndex: 1, resolvedModuleName: 'MOD_B' },
            ],
            valid: true,
          },
        ],
        tilingValid: true,
        valid: true,
        errors: [],
      };

      const recResult = reconcileModuleRanges(mockSymbols, addressInfo);

      expect(recResult.summary.insideDefiningModuleSpanCount).toBe(1);
      expect(recResult.summary.atDefiningModuleEndCount).toBe(1);
      expect(recResult.summary.insideDifferentModuleSpanCount).toBe(1);
      expect(recResult.summary.outsideAddressInfoCoverageCount).toBe(1);

      expect(recResult.exceptions).toHaveLength(2); // S2 (inside different module) and S3 (outside coverage)
      expect(recResult.exceptions[0].name).toBe('S2');
      expect(recResult.exceptions[0].status).toBe('INSIDE_DIFFERENT_MODULE_SPAN');
      expect(recResult.exceptions[1].name).toBe('S3');
      expect(recResult.exceptions[1].status).toBe('OUTSIDE_ADDRESS_INFO_COVERAGE');
    });
  });

  describe('4. Page-Level Whole-Span Backing Validation (Hole Detection)', () => {
    it('detects unbacked/zero-filled page hole between two valid endpoints', () => {
      const pageSize = 4096;

      // Create an object with 3 pages:
      // Page 0: valid
      // Page 1: zero-filled (hole)
      // Page 2: valid
      const obj: LEObjectEntry = {
        objectNumber: 1,
        virtualSize: 0x3000,
        virtualSizeHex: '0x00003000',
        relocationBaseAddress: 0x10000,
        relocationBaseAddressHex: '0x00010000',
        rawFlags: 0x2005,
        flags: { readable: true, writable: false, executable: true, resource: false, discardable: false, shared: false, preload: true, invalid: false, swappable: false, resident: true, big32Bit: true },
        pageMapIndex: 1,
        pageMapEntryCount: 3,
        capabilities: 'R-X / 32-bit',
        roleEvidence: 'executable-code-like',
        physicalSpans: [],
        mappedPageCount: 2,
        zeroFilledPageCount: 1,
      };

      const pageMap: LEPageMapEntry[] = [
        { pageMapIndex: 1, physicalPageNumber: 1, rawBytes: [1, 0, 0], rawFlags: 0, pageType: 'valid', physicalFileStart: 0x1000, physicalByteLength: 4096 },
        { pageMapIndex: 2, physicalPageNumber: 0, rawBytes: [0, 0, 0], rawFlags: 0, pageType: 'zero-filled' },
        { pageMapIndex: 3, physicalPageNumber: 3, rawBytes: [3, 0, 0], rawFlags: 0, pageType: 'valid', physicalFileStart: 0x3000, physicalByteLength: 4096 },
      ];

      // Whole span covering all 3 pages: 0x0000..0x3000 (12,288 bytes)
      const spanBacking = reconcileSpanFileBacking(0, 0x3000, obj, pageSize, pageMap);

      expect(spanBacking.intersectingPagesCount).toBe(3);
      expect(spanBacking.fullyFileBackedPagesCount).toBe(2);
      expect(spanBacking.zeroFilledPagesCount).toBe(1);
      // Because page 1 is zero-filled, whole-span backing must be false!
      expect(spanBacking.allBytesFileBacked).toBe(false);
    });
  });

  describe('5. Authoritative Export Completeness & Provenance Hardening', () => {
    it('synthetic runs cannot generate authoritative export', async () => {
      const source = new MemoryDirectorySource('SYNTHETIC_DIR');
      source.setFile('MK1.EXE', new Uint8Array(100));

      const mockLayout = {
        exeSize: 100,
        objects: [],
        pageMap: [],
        parsedHeader: { pageSize: 4096 },
      } as any;

      const mockPermanentReport = {
        format: 'mk1_watcom_permanent_classes_inventory_v1',
        fixture: { exePath: 'MK1.EXE', exeSize: 100, exeSizeHex: '0x64' },
        discoveryReport: { discovery: { status: 'DETECTED' } },
        result: {
          segmentAddresses: { entries: [] },
          globalSymbols: { symbols: [] },
          addressInfo: { segmentRecords: [] },
          overallValid: true,
        },
      } as any;

      const report = await qualifyMK1WatcomAddressModelForTest(source, {
        layoutReport: mockLayout,
        permanentClassesReport: mockPermanentReport,
      });

      expect(report.provenance.synthetic).toBe(true);
      expect(report.provenance.artifactGeneratedByTest).toBe(true);

      // Controlled export writer must throw on synthetic run
      expect(() => createMK1WatcomAddressModelExport(report)).toThrow(
        /Synthetic fixtures cannot generate authoritative research artifacts/,
      );

      // Non-authoritative serializer succeeds for synthetic inspection
      const nonAuth = serializeWatcomAddressModelNonAuthoritative(report) as any;
      expect(nonAuth.nonAuthoritative).toBe(true);
      expect(nonAuth.provenance.synthetic).toBe(true);
    });

    it('adversarial check: all-zero SHA-256 placeholder fails closed', async () => {
      const source = new MemoryDirectorySource('SYNTHETIC_DIR');
      source.setFile('MK1.EXE', new Uint8Array(100));

      const mockLayout = {
        exeSize: 100,
        objects: [],
        pageMap: [],
        parsedHeader: { pageSize: 4096 },
      } as any;

      const mockPermanentReport = {
        format: 'mk1_watcom_permanent_classes_inventory_v1',
        fixture: { exePath: 'MK1.EXE', exeSize: 100, exeSizeHex: '0x64' },
        discoveryReport: { discovery: { status: 'DETECTED' } },
        result: {
          segmentAddresses: { entries: [] },
          globalSymbols: { symbols: [] },
          addressInfo: { segmentRecords: [] },
          overallValid: true,
        },
      } as any;

      const report = await qualifyMK1WatcomAddressModelForTest(source, {
        layoutReport: mockLayout,
        permanentClassesReport: mockPermanentReport,
      });

      const tamperedReport = {
        ...report,
        provenance: {
          ...report.provenance,
          synthetic: false,
          artifactGeneratedByTest: false,
          sourceKind: 'user-loaded-directory' as const,
          sha256: '0000000000000000000000000000000000000000000000000000000000000000',
        },
      };

      expect(() => createMK1WatcomAddressModelExport(tamperedReport as any)).toThrow(
        /Authoritative export requires valid non-zero 64-character lowercase SHA-256 hex digest/,
      );
    });

    it('qualifier code contains NO hardcoded Mortal Kombat symbols or expected coordinates', () => {
      const forbiddenTokens = [
        'SUBZERO',
        'RAIDEN',
        'KANO',
        'SCORPION',
        'SONYA',
        'JOHNNY',
        'GORO',
        'LIUKANG',
        'PALETTE',
        'MORTAL',
      ];

      const code = fs.readFileSync(
        'src/core/executable/watcomDebug/watcomAddressModelQualifier.ts',
        'utf-8',
      ).toUpperCase();

      for (const token of forbiddenTokens) {
        expect(
          code.includes(token),
          `watcomAddressModelQualifier.ts must NOT contain forbidden token ${token}`,
        ).toBe(false);
      }
    });

    it('v2 export schema contains all required sections and does not truncate symbols', () => {
      const { objects, pageSize, pageMap } = createMockLeObjects();

      const segmentAddresses: WatcomSegmentAddressTable = {
        fileOffset: 0,
        fileOffsetHex: '0x0',
        declaredByteLength: 2,
        consumedByteLength: 2,
        entryCount: 1,
        entries: [{ entryIndex: 0, segment: 1, segmentHex: '0x0001', fileOffset: 0, fileOffsetHex: '0x0', tableOffset: 0 }],
        valid: true,
        errors: [],
      };

      const globalSymbols: WatcomGlobalSymbolClass = {
        fileOffsetStart: 0,
        fileOffsetStartHex: '0x0',
        fileOffsetEnd: 0,
        fileOffsetEndHex: '0x0',
        declaredByteLength: 0,
        consumedByteLength: 0,
        symbolCount: 2,
        symbols: [
          {
            globalIndex: 0,
            fileOffset: 0,
            fileOffsetHex: '0x0',
            sectionOffset: 0,
            sectionOffsetHex: '0x0',
            recordByteLength: 10,
            addressOffset: 0x1000,
            addressOffsetHex: '0x00001000',
            segment: 1,
            segmentHex: '0x0001',
            moduleIndex: 0,
            resolvedModuleName: 'MOD1',
            rawKind: 4,
            kindBits: { isStatic: false, isData: false, isCode: true, rawKind: 4, rawKindHex: '0x04' },
            nameLength: 4,
            name: 'SYM1',
            valid: true,
          },
          {
            globalIndex: 1,
            fileOffset: 0,
            fileOffsetHex: '0x0',
            sectionOffset: 0,
            sectionOffsetHex: '0x0',
            recordByteLength: 10,
            addressOffset: 0x2000,
            addressOffsetHex: '0x00002000',
            segment: 1,
            segmentHex: '0x0001',
            moduleIndex: 0,
            resolvedModuleName: 'MOD1',
            rawKind: 4,
            kindBits: { isStatic: false, isData: false, isCode: true, rawKind: 4, rawKindHex: '0x04' },
            nameLength: 4,
            name: 'SYM2',
            valid: true,
          },
        ],
        tilingValid: true,
        valid: true,
        errors: [],
      };

      const addressInfo: WatcomAddressInfoClass = {
        fileOffsetStart: 0,
        fileOffsetStartHex: '0x0',
        fileOffsetEnd: 0,
        fileOffsetEndHex: '0x0',
        declaredByteLength: 16,
        consumedByteLength: 16,
        segmentRecordCount: 1,
        segmentRecords: [
          {
            segInfoIndex: 0,
            fileOffset: 0,
            fileOffsetHex: '0x0',
            sectionOffset: 0,
            sectionOffsetHex: '0x0',
            recordByteLength: 16,
            startAddressOffset: 0x1000,
            startAddressOffsetHex: '0x00001000',
            segment: 1,
            segmentHex: '0x0001',
            rawNum: 1,
            rawNumHex: '0x0001',
            entryCount: 1,
            isNonSect: false,
            entries: [{ entryIndex: 0, size: 0x2000, sizeHex: '0x00002000', moduleIndex: 0, resolvedModuleName: 'MOD1' }],
            valid: true,
          },
        ],
        tilingValid: true,
        valid: true,
        errors: [],
      };

      const qualification = qualifyWatcomAddressModel(
        segmentAddresses,
        globalSymbols,
        addressInfo,
        objects,
        pageSize,
        pageMap,
      );

      const fakeAuthoritativeReport: MK1WatcomAddressModelReport = {
        format: 'mk1_watcom_address_model_qualification_v2',
        operationId: 'test_op_123',
        timestamp: '2026-09-23T12:00:00.000Z',
        status: 'SUCCESS',
        fixture: {
          exePath: 'MK1.EXE',
          exeSize: 1157222,
          exeSizeHex: '0x0011A826',
        },
        provenance: {
          synthetic: false,
          artifactGeneratedByTest: false,
          sourceKind: 'user-loaded-directory',
          fileName: 'MK1.EXE',
          operationId: 'test_op_123',
          timestamp: '2026-09-23T12:00:00.000Z',
          byteLength: 1157222,
          sha256: '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14',
        },
        qualification,
      };

      const exported = createMK1WatcomAddressModelExport(fakeAuthoritativeReport);
      expect(exported.metadata.formatVersion).toBe('mk1_watcom_address_model_qualification_v2');
      expect(exported.watcomSegments).toHaveLength(1);
      expect(exported.leObjects).toHaveLength(2);
      // Verify real page map properties in exported LE objects (no placeholders!)
      expect(exported.leObjects[0].pageMapIndex).toBe(1);
      expect(exported.leObjects[0].pageMapEntryCount).toBe(16);
      expect(exported.leObjects[1].pageMapIndex).toBe(17);
      expect(exported.leObjects[1].pageMapEntryCount).toBe(10);
      expect(exported.mappingCandidates).toBeDefined();
      expect(exported.selectedMappings).toBeDefined();
      expect(exported.moduleRangeReconciliation).toBeDefined();
      expect(exported.physicalBackingSummary).toBeDefined();
      expect(exported.unresolvedCoverage).toBeDefined();
      expect(exported.symbolCoordinateInventory).toHaveLength(2);
      expect(exported.symbolCoordinateInventory[0].lePageMapCandidateBackingCategory).toBeDefined();
      expect(exported.symbolCoordinateInventory[0].lePhysicalCoordinateVerified).toBe(false);
      expect(exported.validation.allSymbolsMappedToUniqueObjects).toBe(true);
      expect(exported.validation.runtimeAddressVerified).toBe(false);
    });

    it('correctly classifies unexplained prefix interval as UNEXPLAINED LE OBJECT PREFIX and handles AT_OBJECT_END_BOUNDARY', () => {
      const { objects } = createMockLeObjects();
      const obj = objects[0]; // virtualSize = 0x10000

      // Address-info coverage with prefix (starts at 0x1000) and suffix (ends at 0x8000)
      const addressInfo: WatcomAddressInfoClass = {
        fileOffsetStart: 0,
        fileOffsetStartHex: '0x0',
        fileOffsetEnd: 0,
        fileOffsetEndHex: '0x0',
        declaredByteLength: 0,
        consumedByteLength: 0,
        segmentRecordCount: 1,
        segmentRecords: [
          {
            segInfoIndex: 0,
            fileOffset: 0,
            fileOffsetHex: '0x0',
            sectionOffset: 0,
            sectionOffsetHex: '0x0',
            recordByteLength: 16,
            segment: 1,
            segmentHex: '0x0001',
            startAddressOffset: 0x1000,
            startAddressOffsetHex: '0x00001000',
            rawNum: 1,
            rawNumHex: '0x0001',
            isNonSect: false,
            entryCount: 1,
            entries: [
              {
                entryIndex: 0,
                moduleIndex: 0,
                size: 0x7000,
                sizeHex: '0x00007000',
                resolvedModuleName: 'MOD_A',
              },
            ],
            valid: true,
          },
        ],
        tilingValid: true,
        valid: true,
        errors: [],
      };

      const segmentQualifications: WatcomSegmentQualification[] = [
        {
          watcomSegment: 1,
          watcomSegmentHex: '0x0001',
          testedPairings: [],
          compatibleObjectNumbers: [1],
          qualificationStatus: 'UNIQUELY_QUALIFIED',
          qualifiedObjectNumber: 1,
          qualificationReason: 'Test qualification',
          runtimeAddressVerified: false,
        },
      ];

      // Test with initialStackEsp exactly at virtualSize (obj.virtualSize)
      const intervals = reconcileUnresolvedCoverage(
        segmentQualifications,
        addressInfo,
        objects,
        1,
        obj.virtualSize, // initialStackEsp = object virtual end
      );

      // Must have prefix interval (0..0x1000) and suffix interval (0x8000..0x10000)
      expect(intervals).toHaveLength(2);

      const suffix = intervals.find((i) => i.intervalKind === 'UNEXPLAINED_LE_OBJECT_SUFFIX');
      expect(suffix).toBeDefined();
      expect(suffix?.classification).toBe('UNEXPLAINED LE OBJECT SUFFIX');
      expect(suffix?.initialStackEspRelation).toContain('AT_OBJECT_END_BOUNDARY');
      expect(suffix?.initialStackEspRelation).not.toContain('inside this suffix interval');

      const prefix = intervals.find((i) => i.intervalKind === 'UNEXPLAINED_LE_OBJECT_PREFIX');
      expect(prefix).toBeDefined();
      expect(prefix?.classification).toBe('UNEXPLAINED LE OBJECT PREFIX');
      expect(prefix?.startOffset).toBe(0);
      expect(prefix?.endOffset).toBe(0x1000);
      expect(prefix?.byteLength).toBe(0x1000);
    });

    it('legacy palette files are quarantined with explicit external lead status', () => {
      const probeCode = fs.readFileSync('src/games/mk1/research/paletteProbe.ts', 'utf-8');
      const typesCode = fs.readFileSync('src/games/mk1/research/paletteTypes.ts', 'utf-8');

      expect(probeCode).toContain('EXTERNAL LEAD / LEGACY DIAGNOSTIC — NOT INDEPENDENTLY VERIFIED');
      expect(typesCode).toContain('EXTERNAL LEAD / LEGACY DIAGNOSTIC — NOT INDEPENDENTLY VERIFIED');
    });
  });
});
