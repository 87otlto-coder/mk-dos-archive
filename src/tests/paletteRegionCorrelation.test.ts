import { describe, it, expect } from 'vitest';
import {
  classifyCandidateRange,
  correlatePalettesWithExecutableRegions,
  createMK1CompactPaletteRegionCorrelationExport,
} from '../games/mk1/research/paletteRegionCorrelation';
import {
  MK1ExecutablePhysicalTopology,
  MK1ExecutableRegion,
  MK1ExecutableRegionClass,
} from '../games/mk1/research/executableRegionTopology';
import {
  MK1PaletteCandidate,
  MK1PaletteScanResult,
} from '../games/mk1/research/paletteTypes';
import { LEObjectEntry } from '../core/executable/le/leTypes';

function createMockRegion(
  regionId: string,
  regionClass: MK1ExecutableRegionClass,
  name: string,
  start: number,
  end: number,
  objectNumber: number | null = null,
): MK1ExecutableRegion {
  return {
    regionId,
    regionClass,
    name,
    objectNumber,
    fileStart: start,
    fileStartHex: '0x' + start.toString(16).padStart(8, '0').toUpperCase(),
    fileEnd: end,
    fileEndHex: '0x' + end.toString(16).padStart(8, '0').toUpperCase(),
    byteLength: end - start,
    percentageOfFile: 0,
    purpose: name,
    notes: '',
  };
}

function createMockTopology(regions: MK1ExecutableRegion[], totalSize: number): MK1ExecutablePhysicalTopology {
  return {
    totalFileSize: totalSize,
    totalFileSizeHex: '0x' + totalSize.toString(16).padStart(8, '0').toUpperCase(),
    boundaries: {
      highestFileBackedPageEnd: 0x08000,
      highestFileBackedPageEndHex: '0x00008000',
      headerDerivedPageDataEnd: 0x08000,
      headerDerivedPageDataEndHex: '0x00008000',
      discrepancyBytes: 0,
      discrepancyExplanation: 'None',
    },
    postModuleTail: {
      startOffset: 0x08000,
      startOffsetHex: '0x00008000',
      endOffset: totalSize,
      endOffsetHex: '0x' + totalSize.toString(16).padStart(8, '0').toUpperCase(),
      byteLength: totalSize - 0x08000,
      percentageOfTotalExecutable: 50.0,
      containedAnchorNames: [],
      purpose: 'UNKNOWN',
      notes: 'Post-module tail',
    },
    regions,
    gapCount: 0,
    totalGapBytes: 0,
  };
}

function createMockCandidate(
  id: string,
  start: number,
  length: number,
  hash: string,
  tier: 'research' | 'structural' = 'structural',
): MK1PaletteCandidate {
  return {
    id,
    exeOffset: start,
    exeOffsetHex: '0x' + start.toString(16).padStart(8, '0').toUpperCase(),
    byteStart: start,
    byteEnd: start + length,
    length,
    colors15: new Uint16Array(length),
    rgbColors: [],
    uniqueColorCount: 16,
    uniqueColorRatio: 1.0,
    contentHash: hash,
    duplicateContentOf: undefined,
    validation: {
      lengthValid: true,
      colors15Bit: true,
      diversityValid: true,
    },
    tier,
    researchScore: tier === 'research' ? 85.0 : 10.0,
    textLikeScore: 0,
    containsLikelyAsciiData: false,
    overlapRelationships: { overlappingCount: 0 },
    confidence: 'candidate',
    zeroShiftKanoCompatible: true,
  };
}

describe('Palette × Executable Region Correlation (Milestone 1E.2A.3)', () => {
  const regions: MK1ExecutableRegion[] = [
    createMockRegion('pre-le-prefix', 'pre-le-prefix', 'DOS MZ Wrapper Stub', 0x0000, 0x0200),
    createMockRegion('le-header-tables', 'le-header-tables', 'LE Extended Header & Tables', 0x0200, 0x1000),
    createMockRegion('obj-1-mapped', 'le-object-file-backed', 'Object 1 Mapped Code', 0x1000, 0x4000, 1),
    createMockRegion('obj-2-mapped', 'le-object-file-backed', 'Object 2 Mapped Data', 0x4000, 0x8000, 2),
    createMockRegion('post-module-tail', 'post-module-tail', 'Post-Module Executable Tail', 0x8000, 0x10000),
  ];
  const topology = createMockTopology(regions, 0x10000);
  const mockObjects: LEObjectEntry[] = [
    {
      objectNumber: 1,
      virtualSize: 0x3000,
      virtualSizeHex: '0x00003000',
      relocationBaseAddress: 0x10000,
      relocationBaseAddressHex: '0x00010000',
      flags: {
        readable: true,
        writable: false,
        executable: true,
        resource: false,
        discardable: false,
        shared: false,
        preload: false,
        invalid: false,
        swappable: false,
        resident: false,
        big32Bit: true,
      },
      rawFlags: 0,
      pageMapIndex: 1,
      pageMapEntryCount: 3,
      physicalSpans: [{
        fileStart: 0x1000,
        fileEnd: 0x4000,
        byteLength: 0x3000,
        objectPageStart: 1,
        pageCount: 3,
      }],
      capabilities: 'RX (Code)',
      roleEvidence: 'executable-code-like',
      mappedPageCount: 3,
      zeroFilledPageCount: 0,
    },
    {
      objectNumber: 2,
      virtualSize: 0x4000,
      virtualSizeHex: '0x00004000',
      relocationBaseAddress: 0x20000,
      relocationBaseAddressHex: '0x00020000',
      flags: {
        readable: true,
        writable: true,
        executable: false,
        resource: false,
        discardable: false,
        shared: false,
        preload: false,
        invalid: false,
        swappable: false,
        resident: false,
        big32Bit: true,
      },
      rawFlags: 0,
      pageMapIndex: 4,
      pageMapEntryCount: 4,
      physicalSpans: [{
        fileStart: 0x4000,
        fileEnd: 0x8000,
        byteLength: 0x4000,
        objectPageStart: 1,
        pageCount: 4,
      }],
      capabilities: 'RW (Data)',
      roleEvidence: 'read-write-data-like',
      mappedPageCount: 4,
      zeroFilledPageCount: 0,
    },
  ];

  describe('classifyCandidateRange', () => {
    it('classifies fully contained candidates within region bounds', () => {
      const cand = createMockCandidate('c1', 0x4100, 32, 'hashA');
      const result = classifyCandidateRange(cand, regions);

      expect(result.classification).toBe('contained');
      expect(result.region?.regionId).toBe('obj-2-mapped');
      expect(result.region?.objectNumber).toBe(2);
      expect(result.intersectedRegions.length).toBe(1);
    });

    it('classifies cross-region candidates spanning boundaries', () => {
      // Candidate starting at 0x3FFE and ending at 0x401E (spans Obj 1 and Obj 2)
      const cand = createMockCandidate('c2', 0x3FFE, 32, 'hashB');
      const result = classifyCandidateRange(cand, regions);

      expect(result.classification).toBe('cross-region');
      expect(result.region).toBeNull();
      expect(result.intersectedRegions.length).toBe(2);
      expect(result.intersectedRegions.map((r) => r.regionId)).toEqual(['obj-1-mapped', 'obj-2-mapped']);
    });

    it('classifies unclassified candidates outside all known regions', () => {
      // Offset 0x20000 is past totalSize (0x10000)
      const cand = createMockCandidate('c3', 0x20000, 32, 'hashC');
      const result = classifyCandidateRange(cand, regions);

      expect(result.classification).toBe('unclassified');
      expect(result.region).toBeNull();
      expect(result.intersectedRegions.length).toBe(0);
    });
  });

  describe('correlatePalettesWithExecutableRegions', () => {
    it('performs 100% mathematical reconciliation of all candidates', () => {
      const c1 = createMockCandidate('c1', 0x1100, 32, 'hashA', 'structural');
      const c2 = createMockCandidate('c2', 0x4200, 32, 'hashB', 'research');
      const c3 = createMockCandidate('c3', 0x4400, 32, 'hashB', 'research'); // Duplicate hash in Object 2
      const c4 = createMockCandidate('c4', 0x9000, 32, 'hashB', 'structural'); // Duplicate hash across into Post-Module Tail!
      const c5 = createMockCandidate('c5', 0x3FFE, 32, 'hashC', 'structural'); // Cross-region candidate

      const mockScanResult: MK1PaletteScanResult = {
        exePath: 'MK1.EXE',
        exeSize: 0x10000,
        candidates: [c1, c2, c3, c4, c5],
        counts: {
          rawLengthCandidatesCount: 5,
          colors15BitValidCount: 5,
          diversityValidCount: 5,
          structuralCandidatesCount: 5,
          finalCandidatesCount: 5,
          researchCandidatesCount: 2,
          uniqueContentsCount: 3,
          duplicateCount: 2,
        },
        uniqueContents: [],
      };

      const result = correlatePalettesWithExecutableRegions(
        mockScanResult,
        topology,
        mockObjects,
      );

      expect(result.status).toBe('SUCCESS');
      expect(result.reconciliation.totalInputCount).toBe(5);
      expect(result.reconciliation.structuralInputCount).toBe(5);
      expect(result.reconciliation.researchInputCount).toBe(2);

      // Contained: c1 (Obj1), c2 (Obj2), c3 (Obj2), c4 (Tail) -> 4
      // Cross-region: c5 (Obj1 -> Obj2) -> 1
      expect(result.reconciliation.structuralAssignedCount).toBe(4);
      expect(result.reconciliation.structuralCrossRegionCount).toBe(1);
      expect(result.reconciliation.structuralUnclassifiedCount).toBe(0);
      expect(result.reconciliation.structuralReconciles).toBe(true);

      // Research: c2 (Obj2), c3 (Obj2) -> 2 assigned, 0 cross, 0 unclass
      expect(result.reconciliation.researchAssignedCount).toBe(2);
      expect(result.reconciliation.researchCrossRegionCount).toBe(0);
      expect(result.reconciliation.researchUnclassifiedCount).toBe(0);
      expect(result.reconciliation.researchReconciles).toBe(true);
      expect(result.reconciliation.totalReconciles).toBe(true);

      // Multi-region content hash identification:
      // 'hashB' occurs in 'obj-2-mapped' (c2, c3) AND 'post-module-tail' (c4)
      expect(result.multiRegionContentSummary.uniqueContentsPresentInMultipleRegionsCount).toBe(1);
      expect(result.multiRegionContentSummary.multiRegionContents[0].contentHash).toBe('hashB');
      expect(result.multiRegionContentSummary.multiRegionContents[0].regions).toContain('obj-2-mapped');
      expect(result.multiRegionContentSummary.multiRegionContents[0].regions).toContain('post-module-tail');
      expect(result.multiRegionContentSummary.researchContentsPresentInMultipleRegionsCount).toBe(1);
    });

    it('rejects correlation if fixture identities mismatch', () => {
      const mockScanResult: MK1PaletteScanResult = {
        exePath: 'MK1.EXE',
        exeSize: 99999, // Wrong size!
        candidates: [],
        counts: {
          rawLengthCandidatesCount: 0,
          colors15BitValidCount: 0,
          diversityValidCount: 0,
          structuralCandidatesCount: 0,
          finalCandidatesCount: 0,
          researchCandidatesCount: 0,
          uniqueContentsCount: 0,
          duplicateCount: 0,
        },
        uniqueContents: [],
      };

      const result = correlatePalettesWithExecutableRegions(
        mockScanResult,
        topology,
        mockObjects,
      );

      expect(result.status).toBe('FAILED');
      expect(result.failureReason).toContain('Fixture mismatch');
    });
  });

  describe('createMK1CompactPaletteRegionCorrelationExport', () => {
    it('creates compliant mk1_palette_region_correlation_v1 export payload', () => {
      const c1 = createMockCandidate('c1', 0x4100, 32, 'hashA', 'research');
      const mockScanResult: MK1PaletteScanResult = {
        exePath: 'MK1.EXE',
        exeSize: 0x10000,
        candidates: [c1],
        counts: {
          rawLengthCandidatesCount: 1,
          colors15BitValidCount: 1,
          diversityValidCount: 1,
          structuralCandidatesCount: 1,
          finalCandidatesCount: 1,
          researchCandidatesCount: 1,
          uniqueContentsCount: 1,
          duplicateCount: 0,
        },
        uniqueContents: [],
      };

      const correlation = correlatePalettesWithExecutableRegions(
        mockScanResult,
        topology,
        mockObjects,
      );

      const exportPayload = createMK1CompactPaletteRegionCorrelationExport(
        correlation,
        mockScanResult,
        topology,
        {
          name: 'MK DOS Archive',
          version: '1.0.0',
          milestone: '1E.2A.3',
        },
      );

      expect(exportPayload.metadata.formatVersion).toBe('mk1_palette_region_correlation_v1');
      expect(exportPayload.metadata.milestone).toBe('1E.2A.3');
      expect(exportPayload.fixture.exeSize).toBe(0x10000);
      expect(exportPayload.reconciliation.totalReconciles).toBe(true);
      expect(exportPayload.regionDistribution.length).toBe(regions.length);
      expect(exportPayload.researchCandidateAssignments.length).toBe(1);
    });
  });
});
