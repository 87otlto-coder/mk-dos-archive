import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import { BinaryReader } from '../core/binary/BinaryReader';
import { MemoryDirectorySource } from '../core/filesystem/DirectorySource';
import {
  WATCOM_DEBUG_CONSTANTS,
  ALTERNATIVE_TRAILER_SIGNATURES,
  ResearchFixtureProvenance,
  SyntheticTestProvenance,
} from '../core/executable/watcomDebug/watcomDebugTypes';
import {
  parseWatcomMasterHeader,
  validateWatcomMasterHeader,
  parseWatcomSectionHeader,
  enumerateWatcomSections,
} from '../core/executable/watcomDebug/watcomDebugParser';
import { detectWatcomDebugContainer } from '../core/executable/watcomDebug/watcomDebugDetector';
import {
  discoverMK1WatcomDebugContainer,
  discoverMK1WatcomDebugContainerForTest,
  createMK1WatcomDebugDiscoveryExport,
  serializeWatcomDiscoveryNonAuthoritative,
} from '../games/mk1/research/watcomDebugContainerDiscovery';

/**
 * Builds a synthetically sized Watcom debug container appended to a mock buffer.
 * Uses synthetic dimensions strictly to validate parser mechanics.
 */
function buildSyntheticWatcomExecutable(options?: {
  prefixSize?: number;
  langSize?: number;
  segmentSize?: number;
  sectionSizes?: number[];
  sectionIds?: number[];
  signature?: number;
  exeMajorVer?: number;
  exeMinorVer?: number;
  objMajorVer?: number;
  objMinorVer?: number;
  corruptSectionOffsets?: 'mod>=gbl' | 'gbl>=addr' | 'addr>=size';
  customDebugSize?: number;
}): { buffer: Uint8Array; expectedContainerStart: number; expectedContainerEnd: number } {
  const prefixSize = options?.prefixSize ?? 0x800; // 2048 bytes
  const langSize = options?.langSize ?? 24;
  const segmentSize = options?.segmentSize ?? 16;
  const sectionSizes = options?.sectionSizes ?? [120, 240];
  const sectionIds = options?.sectionIds ?? sectionSizes.map((_, i) => i + 1);

  const totalSectionsSize = sectionSizes.reduce((acc, s) => acc + s, 0);
  const debugSize =
    options?.customDebugSize ??
    langSize + segmentSize + totalSectionsSize + WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE;

  const totalSize = prefixSize + debugSize;
  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);

  const containerStart = prefixSize;
  const containerEnd = totalSize;

  // 1. Language table at containerStart
  for (let i = 0; i < langSize; i++) {
    buffer[containerStart + i] = 0x57; // 'W'
  }

  // 2. Segment table at containerStart + langSize
  const segStart = containerStart + langSize;
  for (let i = 0; i < segmentSize; i++) {
    buffer[segStart + i] = 0x02;
  }

  // 3. Sections at segStart + segmentSize
  let currentSecStart = segStart + segmentSize;
  for (let i = 0; i < sectionSizes.length; i++) {
    const sSize = sectionSizes[i];
    const sId = sectionIds[i] ?? (i + 1);

    if (options?.corruptSectionOffsets === 'mod>=gbl') {
      view.setUint32(currentSecStart + 0, 50, true); // mod_offset
      view.setUint32(currentSecStart + 4, 30, true); // gbl_offset (invalid!)
      view.setUint32(currentSecStart + 8, 80, true); // addr_offset
    } else if (options?.corruptSectionOffsets === 'gbl>=addr') {
      view.setUint32(currentSecStart + 0, 20, true);
      view.setUint32(currentSecStart + 4, 70, true); // gbl_offset
      view.setUint32(currentSecStart + 8, 60, true); // addr_offset (invalid!)
    } else if (options?.corruptSectionOffsets === 'addr>=size') {
      view.setUint32(currentSecStart + 0, 20, true);
      view.setUint32(currentSecStart + 4, 40, true);
      view.setUint32(currentSecStart + 8, sSize + 10, true); // addr_offset (invalid!)
    } else {
      // Valid strictly-increasing offsets: mod_offset < gbl_offset < addr_offset < sSize
      view.setUint32(currentSecStart + 0, 20, true);
      view.setUint32(currentSecStart + 4, 40, true);
      view.setUint32(currentSecStart + 8, 60, true);
    }
    view.setUint32(currentSecStart + 12, sSize, true);
    view.setUint16(currentSecStart + 16, sId, true);

    currentSecStart += sSize;
  }

  // 4. Master debug header at totalSize - 14
  const masterOffset = totalSize - WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE;
  const sig = options?.signature ?? WATCOM_DEBUG_CONSTANTS.WAT_DBG_SIGNATURE;
  const exeMaj = options?.exeMajorVer ?? WATCOM_DEBUG_CONSTANTS.EXE_MAJOR_VERSION;
  const exeMin = options?.exeMinorVer ?? WATCOM_DEBUG_CONSTANTS.EXE_MINOR_VERSION;
  const objMaj = options?.objMajorVer ?? WATCOM_DEBUG_CONSTANTS.OBJ_MAJOR_VERSION;
  const objMin = options?.objMinorVer ?? WATCOM_DEBUG_CONSTANTS.OBJ_MINOR_VERSION_CURRENT;

  view.setUint16(masterOffset + 0, sig, true);
  view.setUint8(masterOffset + 2, exeMaj);
  view.setUint8(masterOffset + 3, exeMin);
  view.setUint8(masterOffset + 4, objMaj);
  view.setUint8(masterOffset + 5, objMin);
  view.setUint16(masterOffset + 6, langSize, true);
  view.setUint16(masterOffset + 8, segmentSize, true);
  view.setUint32(masterOffset + 10, debugSize, true);

  return {
    buffer,
    expectedContainerStart: containerStart,
    expectedContainerEnd: containerEnd,
  };
}

describe('Watcom Debug Container Mechanics & Provenance Safeguards (Pass 1E.3A.1)', () => {
  describe('Master Debug Header Parsing & Validation', () => {
    it('parses valid attached Watcom container master header', () => {
      const { buffer, expectedContainerEnd } = buildSyntheticWatcomExecutable({
        langSize: 48,
        segmentSize: 32,
      });
      const reader = new BinaryReader(buffer);
      const headerOffset = expectedContainerEnd - WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE;

      const header = parseWatcomMasterHeader(reader, headerOffset);
      expect(header.signature).toBe(0x8386);
      expect(header.signatureHex).toBe('0x8386');
      expect(header.signatureValid).toBe(true);
      expect(header.exeMajorVer).toBe(3);
      expect(header.exeMinorVer).toBe(0);
      expect(header.objMajorVer).toBe(1);
      expect(header.objMinorVer).toBe(3);
      expect(header.langSize).toBe(48);
      expect(header.segmentSize).toBe(32);
      expect(header.rawBytesHex).toBeDefined();
      expect(header.rawBytes?.length).toBe(14);
      expect(header.versionValid).toBe(true);

      const val = validateWatcomMasterHeader(header, buffer.length);
      expect(val.valid).toBe(true);
      expect(val.checks.every((c) => c.passed)).toBe(true);
    });

    it('accepts valid OBJ minor version 0 per Open Watcom specification', () => {
      const { buffer, expectedContainerEnd } = buildSyntheticWatcomExecutable({
        objMajorVer: 1,
        objMinorVer: 0,
      });
      const reader = new BinaryReader(buffer);
      const headerOffset = expectedContainerEnd - WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE;

      const header = parseWatcomMasterHeader(reader, headerOffset);
      expect(header.objMajorVer).toBe(1);
      expect(header.objMinorVer).toBe(0);
      expect(header.versionValid).toBe(true);

      const val = validateWatcomMasterHeader(header, buffer.length);
      expect(val.valid).toBe(true);
      const objCheck = val.checks.find((c) => c.checkId === 'MASTER_OBJ_VERSION');
      expect(objCheck?.passed).toBe(true);
    });

    it('rejects invalid signature', () => {
      const { buffer, expectedContainerEnd } = buildSyntheticWatcomExecutable({
        signature: 0x9999,
      });
      const reader = new BinaryReader(buffer);
      const headerOffset = expectedContainerEnd - WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE;

      const header = parseWatcomMasterHeader(reader, headerOffset);
      expect(header.signatureValid).toBe(false);

      const val = validateWatcomMasterHeader(header, buffer.length);
      expect(val.valid).toBe(false);
      const sigCheck = val.checks.find((c) => c.checkId === 'MASTER_SIGNATURE_0x8386');
      expect(sigCheck?.passed).toBe(false);
    });

    it('handles truncated master header gracefully', () => {
      const smallBuf = new Uint8Array(8); // smaller than 14 bytes
      const result = detectWatcomDebugContainer(smallBuf);
      expect(result.status).toBe('NOT_DETECTED');
      expect(result.format).toBe('NONE');
      expect(result.masterHeader).toBeNull();
    });

    it('flags invalid debug size exceeding file bounds', () => {
      const { buffer, expectedContainerEnd } = buildSyntheticWatcomExecutable({});
      const reader = new BinaryReader(buffer);
      const headerOffset = expectedContainerEnd - WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE;

      // Corrupt debugSize in buffer to exceed total buffer length
      const view = new DataView(buffer.buffer);
      view.setUint32(headerOffset + 10, buffer.length + 50000, true);

      const header = parseWatcomMasterHeader(reader, headerOffset);
      const val = validateWatcomMasterHeader(header, buffer.length);
      expect(val.valid).toBe(false);
      const sizeCheck = val.checks.find((c) => c.checkId === 'MASTER_DEBUG_SIZE_BOUNDS');
      expect(sizeCheck?.passed).toBe(false);
    });
  });

  describe('Section Debug Header & Tiling Validation', () => {
    it('accepts root section ID 0 as valid per Open Watcom root section definition', () => {
      const { buffer } = buildSyntheticWatcomExecutable({
        prefixSize: 0x200,
        langSize: 16,
        segmentSize: 16,
        sectionSizes: [80],
        sectionIds: [0], // Root section ID 0
      });
      const reader = new BinaryReader(buffer);
      const sectionsStart = 0x200 + 16 + 16;
      const sectionsEnd = buffer.length - WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE;

      const res = enumerateWatcomSections(reader, sectionsStart, sectionsEnd);
      expect(res.valid).toBe(true);
      expect(res.sections.length).toBe(1);
      expect(res.sections[0].sectionId).toBe(0);
      expect(res.sections[0].valid).toBe(true);
    });

    it('flags bad section internal offset ordering (mod_offset >= gbl_offset)', () => {
      const { buffer } = buildSyntheticWatcomExecutable({
        prefixSize: 0x200,
        corruptSectionOffsets: 'mod>=gbl',
      });
      const reader = new BinaryReader(buffer);
      const sectionsStart = 0x200 + 24 + 16;
      const sectionsEnd = buffer.length - WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE;

      const res = enumerateWatcomSections(reader, sectionsStart, sectionsEnd);
      expect(res.valid).toBe(false);
      expect(res.sections[0].valid).toBe(false);
      expect(res.sections[0].validationError).toContain('mod_offset (50) >= gbl_offset (30)');
    });

    it('flags bad section internal offset ordering (addr_offset >= section_size)', () => {
      const { buffer } = buildSyntheticWatcomExecutable({
        prefixSize: 0x200,
        corruptSectionOffsets: 'addr>=size',
      });
      const reader = new BinaryReader(buffer);
      const sectionsStart = 0x200 + 24 + 16;
      const sectionsEnd = buffer.length - WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE;

      const res = enumerateWatcomSections(reader, sectionsStart, sectionsEnd);
      expect(res.valid).toBe(false);
      expect(res.sections[0].valid).toBe(false);
      expect(res.sections[0].validationError).toContain('addr_offset');
    });

    it('detects section extending beyond container boundaries', () => {
      // Build container where declared section size exceeds available section region
      const { buffer } = buildSyntheticWatcomExecutable({
        prefixSize: 0x200,
        sectionSizes: [500],
      });
      const reader = new BinaryReader(buffer);
      const sectionsStart = 0x200 + 24 + 16;
      // Truncate sectionsEnd by 100 bytes
      const artificialSectionsEnd = buffer.length - WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE - 100;

      const res = enumerateWatcomSections(reader, sectionsStart, artificialSectionsEnd);
      expect(res.tilingValid).toBe(false);
      expect(res.errors.some((e) => e.includes('overruns section container boundary'))).toBe(true);
    });
  });

  describe('Watcom Debug Detector & Tail Correlation', () => {
    it('returns NOT_DETECTED for executable tail with no debug container', () => {
      const buf = new Uint8Array(2048);
      buf.fill(0x00);
      const result = detectWatcomDebugContainer(buf);
      expect(result.status).toBe('NOT_DETECTED');
      expect(result.format).toBe('NONE');
    });

    it('handles multiple false signature candidates in buffer cleanly', () => {
      // Create synthetic buffer with multiple 0x8386 sequences inserted prior to the true trailer
      const { buffer } = buildSyntheticWatcomExecutable({
        prefixSize: 0x1000,
      });

      // Insert false 0x8386 sequences at prefix
      const view = new DataView(buffer.buffer);
      view.setUint16(0x100, WATCOM_DEBUG_CONSTANTS.WAT_DBG_SIGNATURE, true);
      view.setUint16(0x300, WATCOM_DEBUG_CONSTANTS.WAT_DBG_SIGNATURE, true);

      const result = detectWatcomDebugContainer(buffer, {
        postModuleTailStart: 0x1000,
        postModuleTailEnd: buffer.length,
      });

      expect(result.status).toBe('DETECTED');
      expect(result.format).toBe('WATCOM');
      expect(result.candidateCount).toBeGreaterThanOrEqual(1);
      expect(result.containerPhysicalEnd).toBe(buffer.length);
      expect(result.containerPhysicalStart).toBe(0x1000);
    });

    it('classifies unrelated bytes before debug container as UNKNOWN POST-MODULE / PRE-DEBUG DATA', () => {
      const postModuleTailStart = 0x1000;
      const debugContainerStart = 0x1500; // 0x500 bytes of unknown preceding data
      const debugSize = 0x600;
      const totalSize = debugContainerStart + debugSize;

      const { buffer } = buildSyntheticWatcomExecutable({
        prefixSize: debugContainerStart,
        customDebugSize: debugSize,
        sectionSizes: [debugSize - 14 - 24 - 16],
      });

      const result = detectWatcomDebugContainer(buffer, {
        postModuleTailStart,
        postModuleTailEnd: totalSize,
      });

      expect(result.status).toBe('DETECTED');
      expect(result.tailCorrelation?.matchesTailStartExactly).toBe(false);
      expect(result.tailCorrelation?.matchesTailEndExactly).toBe(true);
      expect(result.tailCorrelation?.verdict).toContain('PARTIAL_TAIL_CONTAINER');
      expect(result.unresolvedPreDebugTail).toBeDefined();
      expect(result.unresolvedPreDebugTail?.startOffset).toBe(postModuleTailStart);
      expect(result.unresolvedPreDebugTail?.endOffset).toBe(debugContainerStart);
      expect(result.unresolvedPreDebugTail?.byteLength).toBe(0x500);
      expect(result.unresolvedPreDebugTail?.classification).toBe('UNKNOWN POST-MODULE / PRE-DEBUG DATA');
    });

    it('detects alternative CV4 trailer signatures', () => {
      const buf = new Uint8Array(1024);
      // Write 'NB09' at last 4 bytes
      buf[1020] = 0x4e; // 'N'
      buf[1021] = 0x42; // 'B'
      buf[1022] = 0x30; // '0'
      buf[1023] = 0x39; // '9'

      const result = detectWatcomDebugContainer(buf);
      expect(result.status).toBe('DETECTED');
      expect(result.format).toBe('CV4');
    });
  });

  describe('Discovery Orchestrator & Provenance Safeguards', () => {
    it('synthetic provenance cannot invoke authoritative artifact writer', async () => {
      const { buffer } = buildSyntheticWatcomExecutable({ prefixSize: 0x400 });
      const source = new MemoryDirectorySource('MOCK_TEST_DIR');
      source.setFile('MK1.EXE', buffer);

      const mockLayout = {
        exeSize: buffer.length,
        topology: {
          boundaries: { highestFileBackedPageEnd: 0x3ff },
          postModuleTail: {
            startOffset: 0x400,
            endOffset: buffer.length,
            byteLength: buffer.length - 0x400,
          },
        },
      } as any;

      const report = await discoverMK1WatcomDebugContainerForTest(source, {
        layoutReport: mockLayout,
      });

      expect(report.provenance.synthetic).toBe(true);
      expect(report.provenance.artifactGeneratedByTest).toBe(true);

      // Controlled export writer must reject synthetic test runs
      expect(() => createMK1WatcomDebugDiscoveryExport(report)).toThrow(
        /Synthetic fixtures cannot generate authoritative research artifacts/,
      );
    });

    it('regression: synthetic reports cannot be relabeled or exported through production API', async () => {
      const { buffer } = buildSyntheticWatcomExecutable({ prefixSize: 0x400 });
      const source = new MemoryDirectorySource('SYNTHETIC_SOURCE');
      source.setFile('MK1.EXE', buffer);

      const mockLayout = {
        exeSize: buffer.length,
        topology: {
          boundaries: { highestFileBackedPageEnd: 0x3ff },
          postModuleTail: {
            startOffset: 0x400,
            endOffset: buffer.length,
            byteLength: buffer.length - 0x400,
          },
        },
      } as any;

      const report = await discoverMK1WatcomDebugContainerForTest(source, {
        layoutReport: mockLayout,
      });

      // 1. Report from MemoryDirectorySource is strictly synthetic
      expect(report.provenance.synthetic).toBe(true);
      expect(report.provenance.artifactGeneratedByTest).toBe(true);
      expect(report.provenance.sourceKind).toBe('in-memory-buffer');

      // 2. Production export MUST throw on synthetic report
      expect(() => createMK1WatcomDebugDiscoveryExport(report)).toThrow(
        /Synthetic fixtures cannot generate authoritative research artifacts/,
      );

      // 3. Relabeling attempt: even if an external provenance object is passed to createMK1WatcomDebugDiscoveryExport,
      // it is strictly ignored because the function derives provenance solely from report.provenance.
      const fakeUserProvenance = {
        sourceKind: 'user-loaded-directory',
        fileName: 'MK1.EXE',
        byteLength: buffer.length,
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        synthetic: false,
        artifactGeneratedByTest: false,
        timestamp: '2026-09-23T12:00:00.000Z',
        operationId: 'fake-op',
      };

      // @ts-expect-error createMK1WatcomDebugDiscoveryExport rejects extra arguments
      expect(() => createMK1WatcomDebugDiscoveryExport(report, fakeUserProvenance)).toThrow(
        /Synthetic fixtures cannot generate authoritative research artifacts/,
      );

      // 4. Invariant regression: if someone mutates report.provenance.synthetic = false, missing/mismatched fields fail closed
      const tamperedReport = {
        ...report,
        provenance: {
          ...report.provenance,
          synthetic: false,
          artifactGeneratedByTest: false,
          sourceKind: 'user-loaded-directory' as const,
          sha256: 'invalid-sha', // invalid hash format
        },
      };
      expect(() => createMK1WatcomDebugDiscoveryExport(tamperedReport as any)).toThrow(
        /Authoritative export requires valid 64-character lowercase SHA-256 hex digest/,
      );

      // 5. Non-authoritative serialization works for tests without masquerading as authoritative
      const nonAuth = serializeWatcomDiscoveryNonAuthoritative(report) as any;
      expect(nonAuth.nonAuthoritative).toBe(true);
      expect(nonAuth.provenance.synthetic).toBe(true);
    });

    it('test code creates no research JSON on disk', () => {
      // Assert that no mk1_watcom_debug_container_discovery files exist on disk
      const rootFiles = fs.readdirSync('.');
      const rootDiscoveryFiles = rootFiles.filter((f) =>
        f.startsWith('mk1_watcom_debug_container_discovery'),
      );
      expect(rootDiscoveryFiles).toEqual([]);

      if (fs.existsSync('public')) {
        const publicFiles = fs.readdirSync('public');
        const publicDiscoveryFiles = publicFiles.filter((f) =>
          f.startsWith('mk1_watcom_debug_container_discovery'),
        );
        expect(publicDiscoveryFiles).toEqual([]);
      }
    });

    it('no production parser fallback contains expected MK1 coordinates', () => {
      // Verify that production constants and parser modules do not hardcode MK1 fixture answers
      const constants = WATCOM_DEBUG_CONSTANTS as Record<string, unknown>;

      // Forbidden values:
      // fixture size 1157222, Watcom start 0xD2253 (860755), debug size 0x48613 (296467),
      // master offset 0x11A858 (1157208), old tail 453734
      const forbiddenNumbers = [1157222, 0xd2253, 0x48613, 0x11a858, 453734, 703488];

      for (const [key, value] of Object.entries(constants)) {
        for (const forbidden of forbiddenNumbers) {
          expect(
            value,
            `Constant ${key} must not hardcode MK1 coordinate ${forbidden}`,
          ).not.toBe(forbidden);
        }
      }
    });
  });
});
