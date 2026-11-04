/**
 * Unit Tests for MK1 Palette Cycle-Internal Layout Reconnaissance (Milestone 1E.2B.4)
 * Verifies Tracks A, B, and C, masking discipline, reconciliation, and negative control.
 */

import { describe, it, expect } from 'vitest';
import {
  generateCycleDivisorPeriods,
  executePaletteCycleLayoutReconnaissance,
  createMK1CompactPaletteCycleLayoutReconExport,
  deriveNegativeControlSummary,
  NEGATIVE_CONTROL_CANDIDATE_ID,
} from '../games/mk1/research/paletteCycleLayout';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import {
  ExactValueOccurrence,
  MK1PaletteReferenceReconResult,
  PaletteRepresentationKind,
} from '../games/mk1/research/paletteReferenceReconnaissanceTypes';
import { MK1PaletteOccurrenceContextResult } from '../games/mk1/research/paletteOccurrenceContextTypes';
import { MK1PaletteRepeatedStructureResult } from '../games/mk1/research/paletteRepeatedStructureTypes';

describe('Milestone 1E.2B.4 — Palette Cycle-Internal Layout Reconnaissance', () => {
  describe('Track A: Subunit Periodicity & Divisors (Sections 49 & 50)', () => {
    it('generates proper cycle divisors within [2..32] with at least 2 subunits for cycleSpan 36', () => {
      const divisors = generateCycleDivisorPeriods(36);
      expect(divisors).toEqual([2, 3, 4, 6, 9, 12, 18]);
      expect(divisors).not.toContain(7);
      expect(divisors).not.toContain(11);
      expect(divisors).not.toContain(13);
      expect(divisors).not.toContain(36); // proper divisor requirement: 36/36 = 1 < 2 subunits
    });

    it('generates proper cycle divisors within [2..32] with at least 2 subunits for cycleSpan 60', () => {
      const divisors = generateCycleDivisorPeriods(60);
      expect(divisors).toEqual([2, 3, 4, 5, 6, 10, 12, 15, 20, 30]);
      expect(divisors).not.toContain(7);
      expect(divisors).not.toContain(60);
    });

    it('excludes periods exceeding maximumPeriodBytes or yielding fewer than minimumSubunits', () => {
      // 100 has divisors 2, 4, 5, 10, 20, 25, 50...
      // maxPeriodBytes is 32, so 50 is excluded.
      const divisors = generateCycleDivisorPeriods(100, 2, 32, 2);
      expect(divisors).toEqual([2, 4, 5, 10, 20, 25]);
    });
  });

  describe('Full Analysis Engine Integration on Controlled Fixture (Tracks A, B, C)', () => {
    // Construct minimal valid mock inputs
    const mockExePath = 'MK1.EXE';
    const mockExeSize = 1000;

    // Synthetic buffer with two 36-byte cycle blocks at offsets 100 and 136
    const syntheticBuffer = new Uint8Array(mockExeSize);
    // Fill block 1 (100..135) and block 2 (136..171) with repeating 9-byte pattern
    // AA BB CC DD EE FF 11 22 33
    const pattern = [0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x11, 0x22, 0x33];
    for (let i = 0; i < 36; i++) {
      syntheticBuffer[100 + i] = pattern[i % 9];
      syntheticBuffer[136 + i] = pattern[i % 9];
    }
    // Change byte 8 (last byte of first subunit) in block 2 to introduce controlled variation
    syntheticBuffer[136 + 8] = 0x99;

    const mockSource: DirectorySource = {
      readSlice: async (_path: string, start: number, length: number) => {
        return syntheticBuffer.slice(start, start + length).buffer;
      },
      readFile: async () => syntheticBuffer.buffer,
      exists: async () => true,
    } as unknown as DirectorySource;

    const mockReport: MK1ExecutableLayoutReport = {
      exePath: mockExePath,
      exeSize: mockExeSize,
      fixture: { exePath: mockExePath, exeSize: mockExeSize },
      topology: {
        regions: [
          {
            regionId: 'reg_code_01',
            regionClass: 'CODE',
            fileStartOffset: 0,
            fileEndOffset: 500,
            sizeBytes: 500,
          },
        ],
      },
    } as unknown as MK1ExecutableLayoutReport;

    const mockB1Occurrences = [
      {
        sourceFileOffset: 100,
        sourceFileOffsetHex: '0x00000064',
        matchedUint32Value: 0x12345678,
        matchedUint32Hex: '0x12345678',
        representationKind: 'linear-32bit-offset' as PaletteRepresentationKind,
        targetCandidateId: 'MK1.EXE:0x000324C0',
        targetCandidateByteStart: 0x324c0,
        targetCandidateByteStartHex: '0x000324C0',
        targetCandidateRegionId: 'reg_pal_01',
        targetObjectNumber: 1,
        sourceRegionId: 'reg_code_01',
        sourceRegionClass: 'CODE',
        sourceObjectNumber: 1,
      },
      {
        sourceFileOffset: 109,
        sourceFileOffsetHex: '0x0000006D',
        matchedUint32Value: 0x12345678,
        matchedUint32Hex: '0x12345678',
        representationKind: 'linear-32bit-offset' as PaletteRepresentationKind,
        targetCandidateId: 'MK1.EXE:0x000324C0',
        targetCandidateByteStart: 0x324c0,
        targetCandidateByteStartHex: '0x000324C0',
        targetCandidateRegionId: 'reg_pal_01',
        targetObjectNumber: 1,
        sourceRegionId: 'reg_code_01',
        sourceRegionClass: 'CODE',
        sourceObjectNumber: 1,
      },
    ] as unknown as ExactValueOccurrence[];

    const mockB1Result: MK1PaletteReferenceReconResult = {
      status: 'SUCCESS',
      fixture: { exePath: mockExePath, exeSize: mockExeSize },
      truncationSummary: { totalOccurrencesOmitted: 0 },
      globalSummary: {
        totalExternalLogicalMatches: 2,
        uniqueExternalPhysicalOccurrencePositions: 2,
      },
      controlTargets: [
        {
          name: 'Handle Table',
          physicalOffset: 100,
          physicalOffsetHex: '0x00000064',
          targetRegionId: 'reg_code_01',
          externalOccurrences: 1,
        },
      ],
      detailedOccurrences: mockB1Occurrences,
    } as unknown as MK1PaletteReferenceReconResult;

    const mockB2Result: MK1PaletteOccurrenceContextResult = {
      status: 'SUCCESS',
      fixture: { exePath: mockExePath, exeSize: mockExeSize },
      reconciliation: { allReconciled: true, clusteredPositions: 2, unclusteredPositions: 0 },
      trackB: {
        clusters: [
          {
            clusterId: 'cluster_001',
            sourceRegionId: 'reg_code_01',
            positions: [100, 109],
          },
        ],
        allContexts: [],
      },
      negativeControl: {
        candidateId: 'MK1.EXE:0x0009C914',
        expectedOccurrences: 0,
        actualOccurrencesB1: 0,
        actualOccurrencesB2: 0,
        status: 'verified-zero',
        notes: 'Negative control verified: 0 external occurrences across all representation models.',
      },
    } as unknown as MK1PaletteOccurrenceContextResult;

    const mockB3Result: MK1PaletteRepeatedStructureResult = {
      status: 'SUCCESS',
      fixture: { exePath: mockExePath, exeSize: mockExeSize },
      reconciliation: { allReconciled: true },
      globalStructuralSummary: {
        b2ClustersProcessed: 1,
        repeatedTargetGroupsProcessed: 1,
        clustersWithRepeatingDeltaMotif: 1,
      },
      clusterStructuralSummaries: [
        {
          clusterId: 'cluster_001',
          sourceRegionId: 'reg_code_01',
          sourceRegionClass: 'CODE',
          sourceObjectNumber: 1,
          candidateIds: ['MK1.EXE:0x000324C0'],
          representationKindHistogram: { 'linear-32bit-offset': 2 },
          primaryDeltaMotif: {
            cycleLength: 2,
            deltaSequence: [9, 27],
            confidence: 'high',
          },
          repeatedBlockComparison: {
            performed: true,
            blockLength: 36,
            cycleAnchors: [100, 136],
            occurrenceRelativeOffsetsWithinCycle: [0, 9],
            blockCrossesRegionBoundary: false,
            regionsIntersected: ['reg_code_01'],
            contextOnlyConsensus: null,
          },
        },
      ],
      repeatedTargetGroupSummaries: [
        // Second population for cross-population testing: candidate MK1.EXE:0x000324C0 in 60-byte cycle
        {
          groupId: 'group_001',
          candidateId: 'MK1.EXE:0x000324C0',
          representationKind: 'linear-32bit-offset' as PaletteRepresentationKind,
          sourceRegionId: 'reg_code_01',
          sourceObjectNumber: 2,
          primaryDeltaMotif: {
            cycleLength: 2,
            deltaSequence: [12, 48],
            confidence: 'high',
          },
          repeatedBlockComparison: {
            performed: true,
            blockLength: 60,
            cycleAnchors: [200, 260],
            occurrenceRelativeOffsetsWithinCycle: [0, 12],
            blockCrossesRegionBoundary: false,
            regionsIntersected: ['reg_code_01'],
            contextOnlyConsensus: null,
          },
        },
      ],
    } as unknown as MK1PaletteRepeatedStructureResult;

    it('successfully executes B.4 with full multi-track reconciliation', async () => {
      const result = await executePaletteCycleLayoutReconnaissance(
        mockSource,
        mockReport,
        mockB1Result,
        mockB2Result,
        mockB3Result
      );

      expect(result.status).toBe('SUCCESS');
      expect(result.metadata.milestone).toBe('1E.2B.4');
      expect(result.reconciliation.allReconciled).toBe(true);
      expect(result.reconciliation.allPhysicalPopulationsAccountedFor).toBe(true);
      expect(result.reconciliation.allPeriodCandidatesAccountedFor).toBe(true);
      expect(result.reconciliation.allB1OccurrencePositionsResolve).toBe(true);
      expect(result.reconciliation.allCrossPopulationGroupsAccountedFor).toBe(true);

      // Verify physical populations
      expect(result.physicalCyclePopulations.length).toBe(2);
      const pop36 = result.physicalCyclePopulations.find((p) => p.cycleSpan === 36);
      expect(pop36).toBeDefined();

      // Check period 9 in 36-byte cycle
      const period9 = pop36?.testedPeriods.find((p) => p.periodBytes === 9);
      expect(period9).toBeDefined();
      expect(period9?.subunitsPerCycle).toBe(4);
      expect(period9?.totalSubunits).toBe(8); // 2 cycles * 4 subunits
      expect(period9?.primaryOccurrenceLaneResidues).toEqual([0, 0]); // [0 % 9, 9 % 9]
      expect(period9?.primaryOccurrencesShareSubunitLane).toBe(true);

      // Verify negative control handling
      expect(result.negativeControlSummary.candidateId).toBe(NEGATIVE_CONTROL_CANDIDATE_ID);
      expect(result.negativeControlSummary.crossPopulationStatus).toBe('not-applicable-no-occurrences');
      expect(result.negativeControlSummary.B1OccurrenceCount).toBe(0);

      // Verify export generation
      const compactExport = createMK1CompactPaletteCycleLayoutReconExport(result);
      expect(compactExport.format).toBe('mk1_palette_cycle_layout_recon_v1');
      expect(compactExport.schemaVersion).toBe(1);
      expect(compactExport.reconciliation.allReconciled).toBe(true);
    });

    it('properly fails if prerequisite checks are violated', async () => {
      const mismatchedB1 = {
        ...mockB1Result,
        fixture: { exePath: 'OTHER.EXE', exeSize: mockExeSize },
      } as MK1PaletteReferenceReconResult;

      const failedResult = await executePaletteCycleLayoutReconnaissance(
        mockSource,
        mockReport,
        mismatchedB1,
        mockB2Result,
        mockB3Result
      );

      expect(failedResult.status).toBe('FAILED');
      expect(failedResult.failureReason).toContain('FAILED — PREREQUISITE MISMATCH');
    });

    it('deduplicates identical physical populations from cluster and repeated-target group', async () => {
      // Create a B.3 result where a cluster and a repeated-target group have the exact same region, cycleSpan, and cycleAnchors
      const duplicateB3: MK1PaletteRepeatedStructureResult = {
        ...mockB3Result,
        clusterStructuralSummaries: [
          {
            ...mockB3Result.clusterStructuralSummaries[0],
            repeatedBlockComparison: {
              ...mockB3Result.clusterStructuralSummaries[0].repeatedBlockComparison,
              blockLength: 36,
              cycleAnchors: [100, 136],
            },
          },
        ],
        repeatedTargetGroupSummaries: [
          {
            ...mockB3Result.repeatedTargetGroupSummaries[0],
            sourceRegionId: 'reg_code_01',
            repeatedBlockComparison: {
              ...mockB3Result.repeatedTargetGroupSummaries[0].repeatedBlockComparison,
              blockLength: 36,
              cycleAnchors: [100, 136],
            },
          },
        ],
      };

      const result = await executePaletteCycleLayoutReconnaissance(
        mockSource,
        mockReport,
        mockB1Result,
        mockB2Result,
        duplicateB3
      );

      expect(result.status).toBe('SUCCESS');
      expect(result.reconciliation.b3EligibleRepeatedPopulationInputs).toBe(2);
      expect(result.reconciliation.uniquePhysicalPopulationsDerived).toBe(1);
      expect(result.reconciliation.duplicateProvenanceLinksCollapsed).toBe(1);
      expect(result.physicalCyclePopulations.length).toBe(1);
      expect(result.physicalCyclePopulations[0].sourceClusterIds).toContain('cluster_001');
      expect(result.physicalCyclePopulations[0].sourceRepeatedTargetGroupIds).toContain('group_001');
    });

    it('flags unexpected negative control occurrences with warning status', async () => {
      const contaminatedB1: MK1PaletteReferenceReconResult = {
        ...mockB1Result,
        detailedOccurrences: [
          ...mockB1Occurrences,
          {
            sourceFileOffset: 50,
            sourceFileOffsetHex: '0x00000032',
            matchedUint32Value: 0x99999999,
            matchedUint32Hex: '0x99999999',
            representationKind: 'linear-32bit-offset' as PaletteRepresentationKind,
            targetCandidateId: NEGATIVE_CONTROL_CANDIDATE_ID,
            targetCandidateByteStart: 0x9c914,
            targetCandidateByteStartHex: '0x0009C914',
            targetCandidateRegionId: 'reg_code_01',
            targetObjectNumber: null,
            sourceRegionId: 'reg_code_01',
            sourceRegionClass: 'CODE',
            sourceObjectNumber: null,
          },
        ] as unknown as ExactValueOccurrence[],
      };

      const result = await executePaletteCycleLayoutReconnaissance(
        mockSource,
        mockReport,
        contaminatedB1,
        mockB2Result,
        mockB3Result
      );

      expect(result.negativeControlSummary.crossPopulationStatus).toBe('unexpected-occurrences-found');
      expect(result.negativeControlSummary.B1OccurrenceCount).toBe(1);
      expect(result.negativeControlSummary.notes).toContain('WARNING: Negative control candidate');
    });

    it('catches internal exceptions safely and preserves verified negative control evidence 0/0 (Case A)', async () => {
      // Create a corrupted input that causes an exception inside stage execution
      const corruptedSource = {
        ...mockSource,
        readSlice: () => {
          throw new Error('Simulated disk read I/O error');
        },
      };

      const result = await executePaletteCycleLayoutReconnaissance(
        corruptedSource,
        mockReport,
        mockB1Result,
        mockB2Result,
        mockB3Result
      );

      expect(result.status).toBe('FAILED');
      expect(result.failureReason).toContain('Simulated disk read I/O error');
      expect(result.failureReason).toContain('last successful stage:');
      // When failing with live readable B.1 (0) and B.2 (0), preserve 0/0
      expect(result.negativeControlSummary.crossPopulationStatus).toBe('not-applicable-no-occurrences');
      expect(result.negativeControlSummary.B1OccurrenceCount).toBe(0);
      expect(result.negativeControlSummary.B2ContextCount).toBe(0);
      expect(result.negativeControlSummary.notes).toContain('Negative control verified: 0 occurrences');
    });

    it('preserves non-zero negative control evidence 2/1 and unexpected status on failure (Case B)', async () => {
      const corruptedSource = {
        ...mockSource,
        readSlice: () => {
          throw new Error('Simulated failure during analysis');
        },
      };

      const b1With2Neg: MK1PaletteReferenceReconResult = {
        ...mockB1Result,
        detailedOccurrences: [
          ...mockB1Occurrences,
          {
            sourceFileOffset: 50,
            targetCandidateId: NEGATIVE_CONTROL_CANDIDATE_ID,
          },
          {
            sourceFileOffset: 60,
            targetCandidateId: NEGATIVE_CONTROL_CANDIDATE_ID,
          },
        ] as unknown as ExactValueOccurrence[],
      };

      const b2With1Neg: MK1PaletteOccurrenceContextResult = {
        ...mockB2Result,
        negativeControl: {
          candidateId: NEGATIVE_CONTROL_CANDIDATE_ID,
          expectedOccurrences: 0,
          actualOccurrencesB1: 2,
          actualOccurrencesB2: 1,
          status: 'contradicted',
          notes: 'Negative control contradicted',
        },
      } as unknown as MK1PaletteOccurrenceContextResult;

      const result = await executePaletteCycleLayoutReconnaissance(
        corruptedSource,
        mockReport,
        b1With2Neg,
        b2With1Neg,
        mockB3Result
      );

      expect(result.status).toBe('FAILED');
      expect(result.negativeControlSummary.B1OccurrenceCount).toBe(2);
      expect(result.negativeControlSummary.B2ContextCount).toBe(1);
      expect(result.negativeControlSummary.crossPopulationStatus).toBe('unexpected-occurrences-found');
    });

    it('returns null (not 0) when B.2 is SUCCESS but negative-control field is absent (Case C)', async () => {
      const b2WithoutNeg = { ...mockB2Result };
      Reflect.deleteProperty(b2WithoutNeg, 'negativeControl');

      const result = await executePaletteCycleLayoutReconnaissance(
        mockSource,
        mockReport,
        mockB1Result,
        b2WithoutNeg,
        mockB3Result
      );

      expect(result.negativeControlSummary.B2ContextCount).toBeNull();
      expect(result.negativeControlSummary.crossPopulationStatus).toBe('unavailable-upstream-uninspected');
    });

    it('returns null/null and unavailable status when B.1/B.2 are unavailable (Case D)', async () => {
      const summary = deriveNegativeControlSummary(null, null);

      expect(summary.B1OccurrenceCount).toBeNull();
      expect(summary.B2ContextCount).toBeNull();
      expect(summary.crossPopulationStatus).toBe('unavailable-upstream-uninspected');
    });

    it('preserves upstream control metadata without recomputation (Section 17)', async () => {
      const b1WithRichControl: MK1PaletteReferenceReconResult = {
        ...mockB1Result,
        controlTargets: [
          {
            name: 'Synthetic Control Target',
            physicalOffset: 100,
            physicalOffsetHex: '0x00000064',
            targetRegionId: 'reg_code_01',
            totalLogicalMatches: 5,
            uniquePhysicalOccurrences: 4,
            externalOccurrences: 4,
            sourceRegionDistribution: { 'obj-test': 4 },
            representationsTested: ['linear-32bit-offset'],
            occurrences: [
              {
                sourceFileOffset: 100,
                sourceFileOffsetHex: '0x00000064',
                matchedUint32Value: 0x100,
                matchedUint32Hex: '0x00000100',
                representationKind: 'linear-32bit-offset',
                targetCandidateId: 'control_target_01',
                targetCandidateByteStart: 100,
                targetCandidateByteStartHex: '0x00000064',
                targetCandidateRegionId: 'reg_code_01',
                targetObjectNumber: 1,
                sourceRegionId: 'reg_code_01',
                sourceRegionClass: 'CODE',
                sourceObjectNumber: 1,
              },
            ],
          },
        ],
      } as unknown as MK1PaletteReferenceReconResult;

      const result = await executePaletteCycleLayoutReconnaissance(
        mockSource,
        mockReport,
        b1WithRichControl,
        mockB2Result,
        mockB3Result
      );

      expect(result.status).toBe('SUCCESS');
      expect(result.knownAnchorControlSummary.length).toBe(1);
      const ctrl = result.knownAnchorControlSummary[0];
      expect(ctrl.controlName).toBe('Synthetic Control Target');
      expect(ctrl.totalLogicalMatches).toBe(5);
      expect(ctrl.uniquePhysicalOccurrences).toBe(4);
      expect(ctrl.externalOccurrences).toBe(4);
      expect(ctrl.sourceRegionDistribution).toEqual({ 'obj-test': 4 });
    });

    it('annotates all tested periods for participating control occurrences (Section 18)', async () => {
      // Create a 32-byte cycle population where tested proper divisors in [2..32] with >= 2 subunits are [2, 4, 8, 16]
      const b3With32BytePop: MK1PaletteRepeatedStructureResult = {
        ...mockB3Result,
        clusterStructuralSummaries: [
          {
            clusterId: 'cluster_032',
            sourceRegionId: 'reg_code_01',
            sourceRegionClass: 'CODE',
            sourceObjectNumber: 1,
            candidateIds: ['MK1.EXE:0x000324C0'],
            representationKindHistogram: { 'linear-32bit-offset': 2 },
            primaryDeltaMotif: {
              cycleLength: 2,
              deltaSequence: [16, 16],
              confidence: 'high',
            },
            repeatedBlockComparison: {
              performed: true,
              blockLength: 32,
              cycleAnchors: [100, 132],
              occurrenceRelativeOffsetsWithinCycle: [0, 16],
              blockCrossesRegionBoundary: false,
              regionsIntersected: ['reg_code_01'],
              contextOnlyConsensus: null,
            },
          },
        ],
      } as unknown as MK1PaletteRepeatedStructureResult;

      // Control occurrence at offset 110 (relative to anchor 100: relInCycle = 10)
      const b1WithControlAt110: MK1PaletteReferenceReconResult = {
        ...mockB1Result,
        controlTargets: [
          {
            name: 'Control At 110',
            physicalOffset: 110,
            physicalOffsetHex: '0x0000006E',
            targetRegionId: 'reg_code_01',
            representationsTested: ['linear-32bit-offset'],
            occurrences: [
              {
                sourceFileOffset: 110,
                sourceFileOffsetHex: '0x0000006E',
                matchedUint32Value: 0x110,
                matchedUint32Hex: '0x00000110',
                representationKind: 'linear-32bit-offset',
                targetCandidateId: 'ctrl_110',
                targetCandidateByteStart: 110,
                targetCandidateByteStartHex: '0x0000006E',
                targetCandidateRegionId: 'reg_code_01',
                targetObjectNumber: 1,
                sourceRegionId: 'reg_code_01',
                sourceRegionClass: 'CODE',
                sourceObjectNumber: 1,
              },
            ],
          },
        ],
      } as unknown as MK1PaletteReferenceReconResult;

      const result = await executePaletteCycleLayoutReconnaissance(
        mockSource,
        mockReport,
        b1WithControlAt110,
        mockB2Result,
        b3With32BytePop
      );

      expect(result.status).toBe('SUCCESS');
      const ctrl = result.knownAnchorControlSummary[0];
      expect(ctrl.participatingPhysicalPopulations.length).toBeGreaterThan(0);
      const part = ctrl.participatingPhysicalPopulations[0];
      expect(part.relativeOffsetWithinCycle).toBe(10);
      expect(part.periodLaneAnnotations).toBeDefined();

      // Population cycleSpan=32 has tested periods [2, 4, 8, 16]
      const testedPeriods = result.physicalCyclePopulations[0].testedPeriods.map((p) => p.periodBytes);
      expect(testedPeriods).toContain(4);
      expect(testedPeriods).toContain(8);
      expect(testedPeriods).toContain(16);

      // Verify periodLaneAnnotations contains all tested periods
      expect(part.periodLaneAnnotations.length).toBe(testedPeriods.length);

      // Verify lane modulo arithmetic:
      // 10 % 4 = 2, 10 % 8 = 2, 10 % 16 = 10
      const anno4 = part.periodLaneAnnotations.find((a) => a.periodBytes === 4);
      const anno8 = part.periodLaneAnnotations.find((a) => a.periodBytes === 8);
      const anno16 = part.periodLaneAnnotations.find((a) => a.periodBytes === 16);

      expect(anno4?.relativeOffsetWithinSubunit).toBe(10 % 4);
      expect(anno8?.relativeOffsetWithinSubunit).toBe(10 % 8);
      expect(anno16?.relativeOffsetWithinSubunit).toBe(10 % 16);
    });

    it('exports comparablePairCountByRelativeOffset in pairwise comparisons and tracks slot provenance disagreements', async () => {
      // Create two populations sharing a candidate with slight variation in slot provenance
      const b3WithMultiPop = {
        ...mockB3Result,
        clusterStructuralSummaries: [
          {
            clusterId: 'cluster_001',
            sourceRegionId: 'reg_code_01',
            sourceRegionClass: 'CODE',
            sourceObjectNumber: 1,
            candidateIds: ['MK1.EXE:0x000324C0'],
            representationKindHistogram: { 'linear-32bit-offset': 2 },
            primaryDeltaMotif: {
              cycleLength: 2,
              deltaSequence: [9, 27],
              confidence: 'high',
            },
            repeatedBlockComparison: {
              performed: true,
              blockLength: 36,
              cycleAnchors: [100, 136],
              occurrenceRelativeOffsetsWithinCycle: [0, 9],
              blockCrossesRegionBoundary: false,
              regionsIntersected: ['reg_code_01'],
              contextOnlyConsensus: null,
            },
          },
          {
            clusterId: 'cluster_002',
            sourceRegionId: 'reg_code_01',
            sourceRegionClass: 'CODE',
            sourceObjectNumber: 1,
            candidateIds: ['MK1.EXE:0x000324C0'],
            representationKindHistogram: { 'linear-32bit-offset': 2 },
            primaryDeltaMotif: {
              cycleLength: 2,
              deltaSequence: [9, 27],
              confidence: 'high',
            },
            repeatedBlockComparison: {
              performed: true,
              blockLength: 36,
              cycleAnchors: [200, 236],
              occurrenceRelativeOffsetsWithinCycle: [0, 9],
              blockCrossesRegionBoundary: false,
              regionsIntersected: ['reg_code_01'],
              contextOnlyConsensus: null,
            },
          },
        ],
        repeatedTargetGroupSummaries: [],
      } as unknown as MK1PaletteRepeatedStructureResult;

      const b1WithMultiOcc: MK1PaletteReferenceReconResult = {
        ...mockB1Result,
        detailedOccurrences: [
          ...mockB1Occurrences,
          {
            sourceFileOffset: 200,
            sourceFileOffsetHex: '0x000000C8',
            matchedUint32Value: 0x000324c0,
            matchedUint32Hex: '0x000324C0',
            representationKind: 'linear-32bit-offset' as PaletteRepresentationKind,
            targetCandidateId: 'MK1.EXE:0x000324C0',
            targetCandidateByteStart: 0x324c0,
            targetCandidateByteStartHex: '0x000324C0',
            targetCandidateRegionId: 'reg_code_01',
            targetObjectNumber: 1,
            sourceRegionId: 'reg_code_01',
            sourceRegionClass: 'CODE',
            sourceObjectNumber: 1,
          },
          {
            sourceFileOffset: 209,
            sourceFileOffsetHex: '0x000000D1',
            matchedUint32Value: 0x000324c0,
            matchedUint32Hex: '0x000324C0',
            representationKind: 'linear-32bit-offset' as PaletteRepresentationKind,
            targetCandidateId: 'MK1.EXE:0x000324C0',
            targetCandidateByteStart: 0x324c0,
            targetCandidateByteStartHex: '0x000324C0',
            targetCandidateRegionId: 'reg_code_01',
            targetObjectNumber: 1,
            sourceRegionId: 'reg_code_01',
            sourceRegionClass: 'CODE',
            sourceObjectNumber: 1,
          },
        ] as unknown as ExactValueOccurrence[],
      };

      const result = await executePaletteCycleLayoutReconnaissance(
        mockSource,
        mockReport,
        b1WithMultiOcc,
        mockB2Result,
        b3WithMultiPop
      );

      expect(result.status).toBe('SUCCESS');
      expect(result.crossPopulationCandidateGroups.length).toBeGreaterThan(0);
      const group = result.crossPopulationCandidateGroups[0];
      expect(group.pairwisePopulationContextComparisons.length).toBeGreaterThan(0);
      const pairComp = group.pairwisePopulationContextComparisons[0];

      // Verify comparablePairCountByRelativeOffset is populated
      expect(pairComp.comparablePairCountByRelativeOffset).toBeDefined();
      expect(typeof pairComp.comparablePairCountByRelativeOffset[-1]).toBe('number');
      expect(typeof pairComp.comparablePairCountByRelativeOffset[4]).toBe('number');
      expect(pairComp.occurrencePairsCompared).toBeGreaterThan(0);
    });
  });
});
