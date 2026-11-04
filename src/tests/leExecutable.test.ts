import { describe, it, expect } from 'vitest';
import { BinaryReader } from '../core/binary/BinaryReader';
import { MemoryDirectorySource } from '../core/filesystem/DirectorySource';
import {
  parseLEHeader,
  validateLEHeader,
  scanForLeSignatures,
  LE_HEADER_MIN_SIZE,
} from '../core/executable/le/leHeader';
import {
  parseLEObjectTable,
  parseLEPageMap,
  resolveObjectPhysicalSpans,
  decodeLEObjectFlags,
  computeObjectBackingSummary,
} from '../core/executable/le/leObjects';
import {
  fileOffsetToLoadedAddress,
  objectOffsetToFileOffset,
  checkRangeObjectContainment,
  classifyPhysicalByteInObjects,
} from '../core/executable/le/leAddressMap';
import {
  probeMK1ExecutableLayout,
  computePaletteObjectDistribution,
  createMK1ExecutableLayoutExport,
  createPageMapDiagnostics,
  MK1_KNOWN_RESEARCH_ANCHORS,
} from '../games/mk1/research/executableLayoutProbe';
import { deriveMK1ExecutableTopology } from '../games/mk1/research/executableRegionTopology';
import { MK1PaletteCandidate } from '../games/mk1/research/paletteTypes';

/**
 * Builds a valid synthetic MZ + LE binary executable for testing.
 */
function buildMockLeExecutable(): Uint8Array {
  const totalSize = 0x10000; // 64 KB
  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);

  // 1. DOS MZ Header at offset 0
  view.setUint16(0x00, 0x5a4d, true); // 'MZ'
  view.setUint32(0x3c, 0x0080, true); // e_lfanew pointing to 0x80 (discrepant from real LE payload)

  // 2. Embedded LE Header at offset 0x0200
  const leOffset = 0x0200;
  buffer[leOffset + 0] = 0x4c; // 'L'
  buffer[leOffset + 1] = 0x45; // 'E'
  buffer[leOffset + 2] = 0; // byteOrder = 0 (LE)
  buffer[leOffset + 3] = 0; // wordOrder = 0 (LE)
  view.setUint32(leOffset + 4, 0, true); // format level
  view.setUint16(leOffset + 8, 2, true); // cpuType = 2 (Intel 386)
  view.setUint16(leOffset + 10, 1, true); // targetOs = 1 (OS/2, as documented in LE spec)
  view.setUint32(leOffset + 12, 0, true); // module version
  view.setUint32(leOffset + 16, 0, true); // module flags
  view.setUint32(leOffset + 20, 8, true); // modulePageCount = 8 pages
  view.setUint32(leOffset + 24, 1, true); // entryObject = 1
  view.setUint32(leOffset + 28, 0x1000, true); // entryEip = 0x1000
  view.setUint32(leOffset + 32, 2, true); // stackObject = 2
  view.setUint32(leOffset + 36, 0x5000, true); // stackEsp = 0x5000
  view.setUint32(leOffset + 40, 4096, true); // pageSize = 4096
  view.setUint32(leOffset + 44, 4096, true); // bytesOnLastPage = 4096
  view.setUint32(leOffset + 48, 0, true); // fixupSectionSize
  view.setUint32(leOffset + 52, 0, true); // fixupSectionChecksum
  view.setUint32(leOffset + 56, 0, true); // loaderSectionSize
  view.setUint32(leOffset + 60, 0, true); // loaderSectionChecksum

  // Relative table offsets (from leOffset)
  const objTableRel = 0xc0; // at 0x02C0
  const pageMapRel = 0xf0; // at 0x02F0
  view.setUint32(leOffset + 0x40, objTableRel, true); // 0x40: objectTableRelativeOffset
  view.setUint32(leOffset + 0x44, 2, true); // 0x44: objectCount = 2
  view.setUint32(leOffset + 0x48, pageMapRel, true); // 0x48: objectPageMapRelativeOffset

  // Absolute file offsets
  const dataPagesFileOffset = 0x1000;
  view.setUint32(leOffset + 0x80, dataPagesFileOffset, true); // 0x80: dataPagesFileOffset = 0x1000
  view.setUint32(leOffset + 0x84, 0, true); // 0x84: preloadPageCount
  view.setUint32(leOffset + 0x88, 0, true); // 0x88: nonResidentNameTableFileOffset
  view.setUint32(leOffset + 0x8c, 0, true); // 0x8C: nonResidentNameTableLength
  view.setUint32(leOffset + 0x90, 0, true); // 0x90: nonResidentNameTableChecksum
  view.setUint32(leOffset + 0x94, 2, true); // 0x94: autoDataObject = 2
  view.setUint32(leOffset + 0x98, 0, true); // 0x98: debugInfoFileOffset
  view.setUint32(leOffset + 0x9c, 0, true); // 0x9C: debugInfoLength
  view.setUint32(leOffset + 0xa8, 0x10000, true); // 0xA8: heapSize

  // 3. Object Table at 0x02C0 (2 entries * 24 bytes = 48 bytes)
  // Object 1: Code (Executable, Readable, 32-bit)
  const obj1Offset = leOffset + objTableRel;
  view.setUint32(obj1Offset + 0, 0x4000, true); // virtualSize = 16KB (4 pages)
  view.setUint32(obj1Offset + 4, 0x00010000, true); // relocationBaseAddress = 0x00010000
  view.setUint32(obj1Offset + 8, 0x2005, true); // flags: READABLE (1) | EXECUTABLE (4) | BIG (0x2000)
  view.setUint32(obj1Offset + 12, 1, true); // pageMapIndex = 1 (1-based)
  view.setUint32(obj1Offset + 16, 4, true); // pageMapEntryCount = 4 pages
  view.setUint32(obj1Offset + 20, 0, true); // reserved

  // Object 2: Data (Readable, Writable, 32-bit)
  const obj2Offset = obj1Offset + 24;
  view.setUint32(obj2Offset + 0, 0x4000, true); // virtualSize = 16KB (4 pages)
  view.setUint32(obj2Offset + 4, 0x00020000, true); // relocationBaseAddress = 0x00020000
  view.setUint32(obj2Offset + 8, 0x2003, true); // flags: READABLE (1) | WRITABLE (2) | BIG (0x2000)
  view.setUint32(obj2Offset + 12, 5, true); // pageMapIndex = 5 (1-based)
  view.setUint32(obj2Offset + 16, 4, true); // pageMapEntryCount = 4 pages
  view.setUint32(obj2Offset + 20, 0, true); // reserved

  // 4. Page Map at 0x02F0 (8 entries * 4 bytes = 32 bytes)
  // LE 24-bit physical page number byte layout:
  // byte 0: page_num MSB (bits 16..23)
  // byte 1: page_num MID (bits 8..15)
  // byte 2: page_num LSB (bits 0..7)
  // byte 3: flags
  const pageMapFileOffset = leOffset + pageMapRel;
  // Pages 1..4 for Object 1: physical pages 1, 2, 3, 4 with flag 0 (valid)
  for (let i = 0; i < 4; i++) {
    const pOffset = pageMapFileOffset + i * 4;
    const physPage = i + 1;
    buffer[pOffset + 0] = (physPage >> 16) & 0xff;
    buffer[pOffset + 1] = (physPage >> 8) & 0xff;
    buffer[pOffset + 2] = physPage & 0xff;
    buffer[pOffset + 3] = 0; // flag 0 = valid
  }

  // Pages 5..6 for Object 2: physical pages 5, 6 with flag 0 (valid)
  for (let i = 4; i < 6; i++) {
    const pOffset = pageMapFileOffset + i * 4;
    const physPage = i + 1;
    buffer[pOffset + 0] = (physPage >> 16) & 0xff;
    buffer[pOffset + 1] = (physPage >> 8) & 0xff;
    buffer[pOffset + 2] = physPage & 0xff;
    buffer[pOffset + 3] = 0; // flag 0 = valid
  }

  // Pages 7..8 for Object 2: unmapped / zero-filled BSS with flag 3 (zero-filled)
  for (let i = 6; i < 8; i++) {
    const pOffset = pageMapFileOffset + i * 4;
    buffer[pOffset + 0] = 0;
    buffer[pOffset + 1] = 0;
    buffer[pOffset + 2] = 0;
    buffer[pOffset + 3] = 3; // flag 3 = zero-filled
  }

  return buffer;
}

describe('Linear Executable (LE) Parser & Object Map', () => {
  it('parses and validates LE header structure correctly', () => {
    const mockExe = buildMockLeExecutable();
    const reader = new BinaryReader(mockExe);
    const header = parseLEHeader(reader, 0x0200);

    expect(header.signature).toBe('LE');
    expect(header.byteOrder).toBe(0);
    expect(header.wordOrder).toBe(0);
    expect(header.cpuType).toBe(2);
    expect(header.cpuTypeDescription).toBe('Intel 80386 (32-bit)');
    expect(header.targetOs).toBe(1);
    expect(header.targetOsDescription).toBe('OS/2');
    expect(header.pageSize).toBe(4096);
    expect(header.objectCount).toBe(2);
    expect(header.modulePageCount).toBe(8);
    expect(header.dataPagesFileOffset).toBe(0x1000);

    const validation = validateLEHeader(header, 0x0200, mockExe.byteLength);
    expect(validation.isValid).toBe(true);
    expect(validation.confidence).toBe('strong');
    expect(validation.passedRuleCount).toBeGreaterThanOrEqual(10);
  });

  it('correctly maps LE object flag 0x0100 to swappable (not zero-fill)', () => {
    const decoded = decodeLEObjectFlags(0x0100);
    expect(decoded.flags.swappable).toBe(true);
    expect(decoded.flags.readable).toBe(false);
    expect(decoded.flags.writable).toBe(false);
    expect(decoded.flags.executable).toBe(false);
  });

  it('strictly decodes 24-bit physical page number in big-endian order (b0=MSB, b2=LSB)', () => {
    // 4-byte entry: [b0, b1, b2, b3] where physical page = b0*65536 + b1*256 + b2
    const buffer = new Uint8Array(16);
    // Entry 0: [0x00, 0x00, 0x01, 0x00] -> Page 1, flag 0 (valid)
    buffer[0] = 0x00; buffer[1] = 0x00; buffer[2] = 0x01; buffer[3] = 0x00;
    // Entry 1: [0x00, 0x02, 0x01, 0x00] -> Page 513 (0*65536 + 2*256 + 1), flag 0 (valid)
    // Contrast: little-endian would have decoded as 0 + 512 + 65536 = 66048!
    buffer[4] = 0x00; buffer[5] = 0x02; buffer[6] = 0x01; buffer[7] = 0x00;
    // Entry 2: [0x00, 0x00, 0x00, 0x03] -> Page 0, flag 3 (zero-filled)
    buffer[8] = 0x00; buffer[9] = 0x00; buffer[10] = 0x00; buffer[11] = 0x03;
    // Entry 3: [0x00, 0x00, 0x05, 0x00] -> Page 5, flag 0 (valid)
    buffer[12] = 0x00; buffer[13] = 0x00; buffer[14] = 0x05; buffer[15] = 0x00;

    const reader = new BinaryReader(buffer);
    const pageMap = parseLEPageMap(reader, 0, 4, 0x1000, 4096, 0x10000);

    expect(pageMap[0].physicalPageNumber).toBe(1);
    expect(pageMap[0].pageType).toBe('valid');
    expect(pageMap[0].physicalFileStart).toBe(0x1000);

    expect(pageMap[1].physicalPageNumber).toBe(513);
    expect(pageMap[1].pageType).toBe('valid');

    expect(pageMap[2].physicalPageNumber).toBe(0);
    expect(pageMap[2].pageType).toBe('zero-filled');

    expect(pageMap[3].physicalPageNumber).toBe(5);
    expect(pageMap[3].pageType).toBe('valid');
  });

  it('rejects corrupted or non-LE headers gracefully', () => {
    const mockExe = buildMockLeExecutable();
    const reader = new BinaryReader(mockExe);
    // Point to non-LE offset
    const header = parseLEHeader(reader, 0x0000);
    const validation = validateLEHeader(header, 0x0000, mockExe.byteLength);
    expect(validation.isValid).toBe(false);
    expect(validation.confidence).toBe('invalid');
  });

  it('correctly decodes 24-byte Object Table entries and role evidence', () => {
    const mockExe = buildMockLeExecutable();
    const reader = new BinaryReader(mockExe);
    const objects = parseLEObjectTable(reader, 0x02c0, 2);

    expect(objects).toHaveLength(2);

    // Object 1: Code
    expect(objects[0].objectNumber).toBe(1);
    expect(objects[0].relocationBaseAddress).toBe(0x00010000);
    expect(objects[0].flags.executable).toBe(true);
    expect(objects[0].flags.readable).toBe(true);
    expect(objects[0].flags.writable).toBe(false);
    expect(objects[0].flags.big32Bit).toBe(true);
    expect(objects[0].capabilities).toBe('R-X / 32-bit');
    expect(objects[0].roleEvidence).toBe('executable-code-like');

    // Object 2: Data
    expect(objects[1].objectNumber).toBe(2);
    expect(objects[1].relocationBaseAddress).toBe(0x00020000);
    expect(objects[1].flags.executable).toBe(false);
    expect(objects[1].flags.readable).toBe(true);
    expect(objects[1].flags.writable).toBe(true);
    expect(objects[1].flags.big32Bit).toBe(true);
    expect(objects[1].capabilities).toBe('RW- / 32-bit');
    expect(objects[1].roleEvidence).toBe('read-write-data-like');
  });

  it('parses 4-byte LE Page Map using safe 24-bit arithmetic', () => {
    const mockExe = buildMockLeExecutable();
    const reader = new BinaryReader(mockExe);
    const pageMap = parseLEPageMap(reader, 0x02f0, 8, 0x1000, 4096, mockExe.byteLength);

    expect(pageMap).toHaveLength(8);

    // Page 1: Physical page 1, valid
    expect(pageMap[0].pageMapIndex).toBe(1);
    expect(pageMap[0].physicalPageNumber).toBe(1);
    expect(pageMap[0].pageType).toBe('valid');
    expect(pageMap[0].physicalFileStart).toBe(0x1000);
    expect(pageMap[0].physicalByteLength).toBe(4096);

    // Page 6: Physical page 6, valid
    expect(pageMap[5].physicalPageNumber).toBe(6);
    expect(pageMap[5].pageType).toBe('valid');
    expect(pageMap[5].physicalFileStart).toBe(0x1000 + 5 * 4096);

    // Page 7: Zero-filled (BSS)
    expect(pageMap[6].pageType).toBe('zero-filled');
    expect(pageMap[6].physicalFileStart).toBeUndefined();
    expect(pageMap[6].physicalByteLength).toBeUndefined();
  });

  it('resolves contiguous physical spans and accounts for zero-filled pages', () => {
    const mockExe = buildMockLeExecutable();
    const reader = new BinaryReader(mockExe);
    const rawObjects = parseLEObjectTable(reader, 0x02c0, 2);
    const pageMap = parseLEPageMap(reader, 0x02f0, 8, 0x1000, 4096, mockExe.byteLength);

    const resolved = resolveObjectPhysicalSpans(rawObjects, pageMap);

    // Object 1 has 4 contiguous mapped pages
    expect(resolved[0].mappedPageCount).toBe(4);
    expect(resolved[0].zeroFilledPageCount).toBe(0);
    expect(resolved[0].physicalSpans).toHaveLength(1);
    expect(resolved[0].physicalSpans[0].fileStart).toBe(0x1000);
    expect(resolved[0].physicalSpans[0].fileEnd).toBe(0x1000 + 4 * 4096);
    expect(resolved[0].physicalSpans[0].pageCount).toBe(4);

    // Object 2 has 2 mapped pages and 2 zero-filled pages
    expect(resolved[1].mappedPageCount).toBe(2);
    expect(resolved[1].zeroFilledPageCount).toBe(2);
    expect(resolved[1].physicalSpans).toHaveLength(1);
    expect(resolved[1].physicalSpans[0].fileStart).toBe(0x1000 + 4 * 4096);
    expect(resolved[1].physicalSpans[0].fileEnd).toBe(0x1000 + 6 * 4096);
    expect(resolved[1].physicalSpans[0].pageCount).toBe(2);
  });

  it('translates physical file offsets to linear addresses bidirectionally', () => {
    const mockExe = buildMockLeExecutable();
    const reader = new BinaryReader(mockExe);
    const rawObjects = parseLEObjectTable(reader, 0x02c0, 2);
    const pageMap = parseLEPageMap(reader, 0x02f0, 8, 0x1000, 4096, mockExe.byteLength);
    const objects = resolveObjectPhysicalSpans(rawObjects, pageMap);

    // File offset inside Object 1 (R-X region): 0x1050
    // 0x1050 is delta 0x50 in Object 1 span [0x1000..0x5000)
    const match1 = fileOffsetToLoadedAddress(0x1050, objects, 4096);
    expect(match1).toHaveLength(1);
    expect(match1[0].objectNumber).toBe(1);
    expect(match1[0].objectOffset).toBe(0x50);
    expect(match1[0].linearAddressCandidate).toBe(0x00010050);

    // Reverse lookup: Object 1, offset 0x50 -> file offset 0x1050
    const fileOffset1 = objectOffsetToFileOffset(1, 0x50, objects, pageMap, 4096);
    expect(fileOffset1).toBe(0x1050);

    // File offset inside Object 2 (data): 0x5040
    // Object 2 starts at file offset 0x5000 (0x1000 + 4*4096)
    const match2 = fileOffsetToLoadedAddress(0x5040, objects, 4096);
    expect(match2).toHaveLength(1);
    expect(match2[0].objectNumber).toBe(2);
    expect(match2[0].objectOffset).toBe(0x40);
    expect(match2[0].linearAddressCandidate).toBe(0x00020040);

    // Reverse lookup for zero-filled page (offset 0x2500 in Object 2 falls in page 7)
    // Page 7 is zero-filled -> MUST return null (no physical file backing)
    const fileOffsetBss = objectOffsetToFileOffset(2, 0x2500, objects, pageMap, 4096);
    expect(fileOffsetBss).toBeNull();
  });

  it('probes MK1 executable layout end-to-end and detects MZ e_lfanew discrepancy', async () => {
    const mockExe = buildMockLeExecutable();
    const source = new MemoryDirectorySource();
    source.setFile('MK1.EXE', mockExe);

    const report = await probeMK1ExecutableLayout(source, {
      exePath: 'MK1.EXE',
    });

    expect(report.exeSize).toBe(mockExe.byteLength);
    expect(report.boundLayout.mzWrapper.eLfanewDiscrepancy).toBe(true);
    expect(report.boundLayout.selectedPayloadCandidate).not.toBeNull();
    expect(report.boundLayout.selectedPayloadCandidate?.fileOffset).toBe(0x0200);

    expect(report.objects).toHaveLength(2);
    expect(report.knownAnchors).toHaveLength(4);
    expect(report.pageMapDiagnostics).toBeDefined();
    expect(report.pageMapDiagnostics?.totalEntries).toBe(8);
    expect(report.pageMapDiagnostics?.mappedValidEntries).toBe(6);

    // Verify compact export format v3
    const compactExport = createMK1ExecutableLayoutExport(report, {
      name: 'MK DOS Archive',
      version: '0.1.0-dev',
      milestone: 'Pass 1E.2A.2',
    });

    expect(compactExport.metadata.formatVersion).toBe('mk1_compact_executable_layout_v3');
    expect(compactExport.leDiscovery.selectedPayloadOffsetHex).toBe('0x00000200');
    expect(compactExport.objects).toHaveLength(2);
    expect(compactExport.objectBackingSummary).toHaveLength(2);
    expect(compactExport.moduleBoundaries).toBeDefined();
    expect(compactExport.postModuleTail).toBeDefined();
    expect(compactExport.executableRegions.length).toBeGreaterThanOrEqual(4);
    expect(compactExport.pageMapDiagnostics).toBeDefined();
    expect(compactExport.pageMapDiagnostics?.totalEntries).toBe(8);
    expect(compactExport.pageMapDiagnostics?.mappedValidEntries).toBe(6);
    expect(compactExport.pageMapDiagnostics?.zeroFilledEntries).toBe(2);
  });

  describe('Hardened Address-Map Boundaries & Partial Page Padding', () => {
    it('strictly restricts addressable bytes to virtualSize and flags page padding', () => {
      // Build an object with partial last page:
      // virtualSize = 0x1200 (4608 bytes -> requires 2 pages of 4096 = 8192 bytes total)
      // File backing: 2 valid physical pages [0x2000 .. 0x4000)
      // Addressable: 0x2000 .. 0x3200 (4608 bytes)
      // Padding: 0x3200 .. 0x4000 (3584 bytes)
      const mockExe = new Uint8Array(0x10000);
      const view = new DataView(mockExe.buffer);

      const obj = {
        objectNumber: 1,
        virtualSize: 0x1200,
        virtualSizeHex: '0x00001200',
        relocationBaseAddress: 0x00010000,
        relocationBaseAddressHex: '0x00010000',
        rawFlags: 0x2005,
        flags: decodeLEObjectFlags(0x2005).flags,
        capabilities: 'R-X / 32-bit' as const,
        roleEvidence: 'executable-code-like' as const,
        pageMapIndex: 1,
        pageMapEntryCount: 2,
        mappedPageCount: 2,
        zeroFilledPageCount: 0,
        physicalSpans: [
          {
            fileStart: 0x2000,
            fileStartHex: '0x00002000',
            fileEnd: 0x4000,
            fileEndHex: '0x00004000',
            byteLength: 0x2000,
            objectPageStart: 0,
            pageCount: 2,
          },
        ],
      };

      const pageMap = [
        {
          pageMapIndex: 1,
          rawBytes: [0, 0, 1] as [number, number, number],
          rawFlags: 0,
          pageType: 'valid' as const,
          physicalPageNumber: 1,
          physicalFileStart: 0x2000,
          physicalByteLength: 4096,
        },
        {
          pageMapIndex: 2,
          rawBytes: [0, 0, 2] as [number, number, number],
          rawFlags: 0,
          pageType: 'valid' as const,
          physicalPageNumber: 2,
          physicalFileStart: 0x3000,
          physicalByteLength: 4096,
        },
      ];

      // 1. Exact start: 0x2000 -> offset 0
      const startMatch = fileOffsetToLoadedAddress(0x2000, [obj], 4096);
      expect(startMatch).toHaveLength(1);
      expect(startMatch[0].objectOffset).toBe(0);
      expect(startMatch[0].linearAddressCandidate).toBe(0x00010000);

      // 2. Last valid addressable byte: 0x2000 + 0x11FF = 0x31FF
      const lastValidMatch = fileOffsetToLoadedAddress(0x31ff, [obj], 4096);
      expect(lastValidMatch).toHaveLength(1);
      expect(lastValidMatch[0].objectOffset).toBe(0x11ff);
      expect(lastValidMatch[0].linearAddressCandidate).toBe(0x000111ff);

      // 3. First padding byte: 0x2000 + 0x1200 = 0x3200
      // MUST NOT map to a loaded address (boundary hardened)
      const paddingMatch = fileOffsetToLoadedAddress(0x3200, [obj], 4096);
      expect(paddingMatch).toHaveLength(0);

      // 4. Test classifyPhysicalByteInObjects
      const classValid = classifyPhysicalByteInObjects(0x31ff, [obj], 4096);
      expect(classValid.type).toBe('addressable-object-byte');
      expect(classValid.objectNumber).toBe(1);

      const classPadding = classifyPhysicalByteInObjects(0x3200, [obj], 4096);
      expect(classPadding.type).toBe('physical-page-padding');
      expect(classPadding.objectNumber).toBe(1);

      const classOutside = classifyPhysicalByteInObjects(0x5000, [obj], 4096);
      expect(classOutside.type).toBe('outside-mapped-objects');
      expect(classOutside.objectNumber).toBeNull();
    });

    it('accurately computes LEObjectBackingSummary metrics', () => {
      const objPartial = {
        objectNumber: 1,
        virtualSize: 0x3500, // 13,568 bytes
        virtualSizeHex: '0x00003500',
        relocationBaseAddress: 0x00010000,
        relocationBaseAddressHex: '0x00010000',
        rawFlags: 0x2005,
        flags: decodeLEObjectFlags(0x2005).flags,
        capabilities: 'R-X / 32-bit' as const,
        roleEvidence: 'executable-code-like' as const,
        pageMapIndex: 1,
        pageMapEntryCount: 4,
        mappedPageCount: 4, // 4 * 4096 = 16,384 bytes
        zeroFilledPageCount: 0,
        physicalSpans: [],
      };

      const pageMap = [1, 2, 3, 4].map((i) => ({
        pageMapIndex: i,
        rawBytes: [0, 0, i] as [number, number, number],
        rawFlags: 0,
        pageType: 'valid' as const,
        physicalPageNumber: i,
        physicalFileStart: 0x1000 + (i - 1) * 4096,
        physicalByteLength: 4096,
      }));

      const backing = computeObjectBackingSummary(objPartial, pageMap, 4096);
      expect(backing.rawFileBackedPageBytes).toBe(16384);
      expect(backing.addressableFileBackedBytes).toBe(13568);
      // 16384 - 13568 = 2816 bytes padding
      expect(backing.physicalPagePaddingBytes).toBe(2816);
      expect(backing.virtualBytesWithoutFileBacking).toBe(0);
      expect(backing.notes).toContain('2816 physical padding bytes');
    });

    it('enforces strict containment logic for ranges crossing padding or multiple objects', () => {
      // Object 1 has partial page padding: virtualSize 0x1200 (4608 bytes), backed by 8192 bytes
      const objWithPadding = {
        objectNumber: 1,
        virtualSize: 0x1200,
        virtualSizeHex: '0x00001200',
        relocationBaseAddress: 0x00010000,
        relocationBaseAddressHex: '0x00010000',
        rawFlags: 0x2005,
        flags: decodeLEObjectFlags(0x2005).flags,
        capabilities: 'R-X / 32-bit' as const,
        roleEvidence: 'executable-code-like' as const,
        pageMapIndex: 1,
        pageMapEntryCount: 2,
        mappedPageCount: 2,
        zeroFilledPageCount: 0,
        physicalSpans: [
          {
            fileStart: 0x2000,
            fileStartHex: '0x00002000',
            fileEnd: 0x4000,
            fileEndHex: '0x00004000',
            byteLength: 0x2000,
            objectPageStart: 0,
            pageCount: 2,
          },
        ],
      };

      // 1. Range inside addressable object space: [0x2100 .. 0x2200) (256 bytes) -> fully contained
      const resultIn = checkRangeObjectContainment(0x2100, 0x2200, [objWithPadding], 4096);
      expect(resultIn.isFullyContained).toBe(true);
      expect(resultIn.containmentStatus).toBe('fully-contained');
      expect(resultIn.objectNumber).toBe(1);

      // 2. Range crossing from addressable space into physical page padding [0x3100 .. 0x3300)
      // Addressable ends at 0x2000 + 0x1200 = 0x3200
      const resultCrossPadding = checkRangeObjectContainment(0x3100, 0x3300, [objWithPadding], 4096);
      expect(resultCrossPadding.isFullyContained).toBe(false);
      expect(resultCrossPadding.containmentStatus).toBe('crosses-page-padding');

      // 3. Range outside mapped objects: [0x5000 .. 0x5100)
      const resultOut = checkRangeObjectContainment(0x5000, 0x5100, [objWithPadding], 4096);
      expect(resultOut.isFullyContained).toBe(false);
      expect(resultOut.containmentStatus).toBe('outside-mapped-objects');
      expect(resultOut.objectNumber).toBeNull();
    });

    it('constructs complete executable region topology with Post-Module Tail', () => {
      const mockExe = buildMockLeExecutable();
      const reader = new BinaryReader(mockExe);
      const parsedHeader = parseLEHeader(reader, 0x0200);
      const rawObjects = parseLEObjectTable(reader, 0x02c0, 2);
      const pageMap = parseLEPageMap(reader, 0x02f0, 8, 0x1000, 4096, mockExe.byteLength);
      const objects = resolveObjectPhysicalSpans(rawObjects, pageMap);

      const topology = deriveMK1ExecutableTopology(
        mockExe.byteLength,
        0x0200,
        parsedHeader,
        objects,
        pageMap,
        4096,
        MK1_KNOWN_RESEARCH_ANCHORS,
      );

      // Check boundaries
      // Highest physical page in mockExe is page 6 -> 0x1000 + 6*4096 = 0x7000
      expect(topology.boundaries.highestFileBackedPageEnd).toBe(0x7000);
      expect(topology.boundaries.highestFileBackedPageEndHex).toBe('0x00007000');

      // Total file size is 0x10000 -> Post-Module Tail is [0x7000 .. 0x10000) (36,864 bytes)
      expect(topology.postModuleTail.startOffset).toBe(0x7000);
      expect(topology.postModuleTail.endOffset).toBe(0x10000);
      expect(topology.postModuleTail.byteLength).toBe(0x10000 - 0x7000);
      expect(topology.postModuleTail.purpose).toBe('UNKNOWN');

      // Topology regions must cover the entire binary from 0 to mockExe.byteLength
      expect(topology.regions.length).toBeGreaterThanOrEqual(4);
      expect(topology.regions[0].fileStart).toBe(0);
      expect(topology.regions[topology.regions.length - 1].fileEnd).toBe(mockExe.byteLength);

      // Verify region classes
      const classes = topology.regions.map((r) => r.regionClass);
      expect(classes).toContain('pre-le-prefix');
      expect(classes).toContain('le-header-tables');
      expect(classes).toContain('le-object-file-backed');
      expect(classes).toContain('post-module-tail');
    });
  });
});
