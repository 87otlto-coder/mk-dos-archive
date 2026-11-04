/**
 * Unit Tests for MK1 Palette Phase-Aligned Subunit Recurrence & Harmonic Divisor Reconnaissance
 * Milestone 1 — Pass 1E.2B.5
 */

import { describe, it, expect } from 'vitest';
import {
  generatePhaseSignatureLetter,
  findExactRepeatingPhaseSignatureMotif,
  executePalettePhaseHarmonicReconnaissance,
  createMK1CompactPalettePhaseHarmonicExport,
  deriveNegativeControlSummary,
  MINIMUM_COMPARABLE_SAMPLES_FOR_STABLE_CELL,
  PHASE_ALIGNED_CONTEXT_AGREEMENT_THRESHOLD,
} from '../games/mk1/research/palettePhaseHarmonic';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import {
  MK1PaletteReferenceReconResult,
  ExactValueOccurrence,
  PaletteRepresentationKind,
} from '../games/mk1/research/paletteReferenceReconnaissanceTypes';
import { MK1PaletteOccurrenceContextResult } from '../games/mk1/research/paletteOccurrenceContextTypes';
import { MK1PaletteRepeatedStructureResult } from '../games/mk1/research/paletteRepeatedStructureTypes';
import { MK1PaletteCycleLayoutResult } from '../games/mk1/research/paletteCycleLayoutTypes';

describe('Milestone 1E.2B.5 — Phase-Aligned Subunit Recurrence & Harmonic Divisors', () => {
  describe('Phase Signature Helpers & Exact Motif Detection (Sections 32-34)', () => {
    it('generates canonical uppercase letters for appearance indices', () => {
      expect(generatePhaseSignatureLetter(0)).toBe('A');
      expect(generatePhaseSignatureLetter(1)).toBe('B');
      expect(generatePhaseSignatureLetter(25)).toBe('Z');
      expect(generatePhaseSignatureLetter(26)).toBe('AA');
      expect(generatePhaseSignatureLetter(27)).toBe('AB');
    });

    it('finds exact repeating signature motifs when present', () => {
      // A B A B -> motif [A, B] repeatCount 2
      const res1 = findExactRepeatingPhaseSignatureMotif(['A', 'B', 'A', 'B']);
      expect(res1).not.toBeNull();
      expect(res1?.motif).toEqual(['A', 'B']);
      expect(res1?.repeatCount).toBe(2);

      // A A A A -> motif [A] repeatCount 4
      const res2 = findExactRepeatingPhaseSignatureMotif(['A', 'A', 'A', 'A']);
      expect(res2).not.toBeNull();
      expect(res2?.motif).toEqual(['A']);
      expect(res2?.repeatCount).toBe(4);

      // A B C A B C -> motif [A, B, C] repeatCount 2
      const res3 = findExactRepeatingPhaseSignatureMotif(['A', 'B', 'C', 'A', 'B', 'C']);
      expect(res3).not.toBeNull();
      expect(res3?.motif).toEqual(['A', 'B', 'C']);
      expect(res3?.repeatCount).toBe(2);
    });

    it('returns null when sequence has no repeating motif', () => {
      expect(findExactRepeatingPhaseSignatureMotif(['A', 'B', 'C', 'D'])).toBeNull();
      expect(findExactRepeatingPhaseSignatureMotif(['A', 'B', 'A', 'C'])).toBeNull();
      expect(findExactRepeatingPhaseSignatureMotif(['A'])).toBeNull();
    });
  });

  const mockExePath = 'MK1.EXE';
  const mockExeSize = 2000;

  // We build two 36-byte cycle blocks at offset 200 and offset 300.
  // In each cycle block, we place 4 subunits of 9 bytes:
  // Subunit 0 (bytes 0..8):  0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11
  // Subunit 1 (bytes 9..17): 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22
  // Subunit 2 (bytes 18..26):0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11
  // Subunit 3 (bytes 27..35):0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x22
  const syntheticBytes = new Uint8Array(mockExeSize);

  const block1Offset = 200;
  const block2Offset = 300;
  const cycleSpan = 36;

  for (let bOffset of [block1Offset, block2Offset]) {
    for (let i = 0; i < 9; i++) {
      syntheticBytes[bOffset + i] = 0x11;
      syntheticBytes[bOffset + 9 + i] = 0x22;
      syntheticBytes[bOffset + 18 + i] = 0x11;
      syntheticBytes[bOffset + 27 + i] = 0x22;
    }
  }

  // Add a single B.1 exact occurrence at offset 200 (first 4 bytes of block 1)
  const mockDetailedOccurrences = [
    {
      sourceFileOffset: 200,
      sourceFileOffsetHex: '0x000000C8',
      representationKind: 'linear-32bit-offset' as PaletteRepresentationKind,
      matchedUint32Value: 0x324c0,
      matchedUint32Hex: '0x000324C0',
      targetCandidateRegionId: 'PAGE_0',
      targetCandidateRegionClass: 'DATA',
      targetObjectNumber: 1,
      targetCandidateId: 'MK1.EXE:0x000324C0',
      targetCandidateByteStart: 0x324c0,
      targetCandidateByteStartHex: '0x000324C0',
      sourceRegionId: 'PAGE_0',
      sourceRegionClass: 'DATA',
      sourceObjectNumber: 1,
    },
    {
      sourceFileOffset: 318, // inside block 2 at offset +18 (phase 2, lane 0 for P=9)
      sourceFileOffsetHex: '0x0000013E',
      representationKind: 'linear-32bit-offset' as PaletteRepresentationKind,
      matchedUint32Value: 0x324c0,
      matchedUint32Hex: '0x000324C0',
      targetCandidateRegionId: 'PAGE_0',
      targetCandidateRegionClass: 'DATA',
      targetObjectNumber: 1,
      targetCandidateId: 'MK1.EXE:0x000324C0',
      targetCandidateByteStart: 0x324c0,
      targetCandidateByteStartHex: '0x000324C0',
      sourceRegionId: 'PAGE_0',
      sourceRegionClass: 'DATA',
      sourceObjectNumber: 1,
    },
  ] as unknown as ExactValueOccurrence[];

  const mockReport = {
    exePath: mockExePath,
    exeSize: mockExeSize,
    isValid: true,
    topology: {
      regions: [
        {
          regionId: 'PAGE_0',
          regionClass: 'DATA',
          fileStartOffset: 0,
          fileEndOffset: mockExeSize,
          sizeBytes: mockExeSize,
        },
      ],
    },
  } as unknown as MK1ExecutableLayoutReport;

  const mockB1Result = {
    status: 'SUCCESS',
    metadata: { operationId: 'b1-op', timestamp: new Date().toISOString(), durationMs: 10 },
    fixture: { exePath: mockExePath, exeSize: mockExeSize, exeSizeHex: '0x000007D0' },
    truncationSummary: { totalOccurrencesOmitted: 0 },
    globalSummary: {
      totalExternalLogicalMatches: 2,
      uniqueExternalPhysicalOccurrencePositions: 2,
    },
    candidateSummaries: [
      {
        candidateId: 'MK1.EXE:0x000324C0',
        occurrencesCount: 2,
        representationHistogram: { 'linear-32bit-offset': 2 },
        targetRegionHistogram: { PAGE_0: 2 },
        targetObjectHistogram: { 1: 2 },
        distinctPhysicalPositions: 2,
      },
    ],
    detailedOccurrences: mockDetailedOccurrences,
  } as unknown as MK1PaletteReferenceReconResult;

  const mockB2Result = {
    status: 'SUCCESS',
    metadata: { operationId: 'b2-op', timestamp: new Date().toISOString(), durationMs: 10 },
    fixture: { exePath: mockExePath, exeSize: mockExeSize, exeSizeHex: '0x000007D0' },
    reconciliation: {
      allReconciled: true,
      clusteredPositions: 2,
      unclusteredPositions: 0,
    },
    trackB: {
      clusters: [{ clusterId: 'cluster-0', positions: [200, 318] }],
    },
    negativeControl: {
      candidateId: 'MK1.EXE:0x0009C914',
      expectedZeroOccurrences: true,
      actualOccurrencesB1: 0,
      actualOccurrencesB2: 0,
      status: 'CONFIRMED_ZERO_OCCURRENCES',
      notes: '',
    },
    controls: {
      negativeControl: { candidateId: 'MK1.EXE:0x0009C914', b1OccurrencesCount: 0, status: 'VERIFIED_ZERO_OCCURRENCES' },
    },
  } as unknown as MK1PaletteOccurrenceContextResult;

  const mockB3Result = {
    status: 'SUCCESS',
    metadata: { operationId: 'b3-op', timestamp: new Date().toISOString(), durationMs: 10 },
    fixture: { exePath: mockExePath, exeSize: mockExeSize, exeSizeHex: '0x000007D0' },
    reconciliation: {
      allReconciled: true,
    },
    globalStructuralSummary: {
      b2ClustersProcessed: 1,
      repeatedTargetGroupsDerived: 0,
      clustersWithRepeatingDeltaMotif: 1,
    },
    clusterStructuralSummaries: [
      {
        clusterId: 'cluster-0',
        sourceRegionId: 'PAGE_0',
        candidateIds: ['MK1.EXE:0x000324C0'],
        occurrenceCount: 2,
        physicalPositions: [200, 318],
        primaryDeltaMotif: {
          subsequenceLength: 1,
          subsequenceDeltas: [118],
          repetitionCount: 1,
          confidenceScore: 1,
        },
        repeatedBlockComparison: {
          performed: true,
          blockLength: 36,
          cycleAnchors: [block1Offset, block2Offset],
          cycleAnchorsHex: ['0x000000C8', '0x0000012C'],
          occurrenceRelativeOffsetsWithinCycle: [0, 18],
        },
      },
    ],
    negativeControlSummary: {
      candidateId: 'MK1.EXE:0x0009C914',
      B1OccurrenceCount: 0,
      B2ContextCount: 0,
    },
  } as unknown as MK1PaletteRepeatedStructureResult;

  const mockB4Result = {
    status: 'SUCCESS',
    metadata: { operationId: 'b4-op', timestamp: new Date().toISOString(), durationMs: 10 },
    fixture: { exePath: mockExePath, exeSize: mockExeSize, exeSizeHex: '0x000007D0' },
    scanConfiguration: {
      minimumPeriodBytes: 2,
      maximumPeriodBytes: 32,
      minimumSubunitsPerCycle: 2,
      periodMode: 'proper-cycle-divisors-only',
      maskMode: 'all-existing-b1-exact-occurrence-fields',
    },
    reconciliation: {
      b4PhysicalPopulationsInput: 1,
      b4PhysicalPopulationsProcessed: 1,
      b4PhysicalPopulationsSkipped: 0,
      allPhysicalPopulationsAccountedFor: true,
      periodCandidatesGenerated: 2,
      periodCandidatesProcessed: 2,
      periodCandidatesSkipped: 0,
      allPeriodCandidatesAccountedFor: true,
      b1PhysicalOccurrencePositionsConsidered: 2,
      b1PhysicalOccurrencePositionsResolved: 2,
      b1PhysicalOccurrencePositionsMissing: 0,
      allB1OccurrencesResolve: true,
      allCrossPopulationGroupsAccountedFor: true,
      allReconciled: true,
    },
    globalSummary: {
      uniquePhysicalCyclePopulations: 1,
      totalPeriodCandidatesTested: 2,
      populationsWithAtLeastOneNotablePeriod: 1,
      crossPopulationGroupsFormed: 1,
    },
    physicalCyclePopulations: [
      {
        populationId: 'POP_001',
        sourceRegionId: 'PAGE_0',
        sourceRegionClass: 'data',
        sourceObjectNumber: 1,
        cycleSpan: 36,
        cycleBlockCount: 2,
        cycleAnchors: [block1Offset, block2Offset],
        cycleAnchorsHex: ['0x000000C8', '0x0000012C'],
        candidateIds: ['MK1.EXE:0x000324C0'],
        representationKinds: ['linear-32bit-offset'],
        sourceClusterIds: ['cluster-0'],
        sourceRepeatedTargetGroupIds: [],
        slotProvenanceDisagreements: [],
        B3PrimaryMotif: {
          subsequenceLength: 1,
          subsequenceDeltas: [118],
          repetitionCount: 1,
          confidenceScore: 1,
        },
        B3OccurrenceSlots: [0, 18],
        testedPeriods: [
          {
            periodBytes: 9,
            subunitsPerCycle: 4,
            rawComparableByteCount: 72,
            rawDominantByteCount: 54,
            rawDominantAgreementPercentage: 75,
            rawStableBytePositionCount: 5,
            rawStableBytePositionPercentage: 55.5,
            contextComparableByteCount: 64,
            contextDominantByteCount: 32,
            contextDominantAgreementPercentage: 50.0,
            contextStableBytePositionCount: 0,
            contextStableBytePositionPercentage: 0,
          },
          {
            periodBytes: 18,
            subunitsPerCycle: 2,
            rawComparableByteCount: 72,
            rawDominantByteCount: 72,
            rawDominantAgreementPercentage: 100,
            rawStableBytePositionCount: 18,
            rawStableBytePositionPercentage: 100,
            contextComparableByteCount: 64,
            contextDominantByteCount: 64,
            contextDominantAgreementPercentage: 100.0,
            contextStableBytePositionCount: 14,
            contextStableBytePositionPercentage: 100,
          },
        ],
        topPeriodCandidates: [{ periodBytes: 18 }],
        b1OccurrencePositionsInsideCycles: [200, 318],
        b1OccurrencePositionsInsideCyclesHex: ['0x000000C8', '0x0000013E'],
        b1OccurrenceDensity: {
          densityClassification: 'sparse-repeated',
          occurrencesPerSubunitByPeriod: {},
        },
      },
    ],
    crossPopulationCandidateGroups: [
      {
        groupId: 'GROUP_001',
        candidateId: 'MK1.EXE:0x000324C0',
        representationKind: 'linear-32bit-offset',
        populationIds: ['POP_001'],
        populationCount: 1,
        pairwiseContextComparisons: [],
      },
    ],
    knownAnchorControlSummary: [],
    negativeControlSummary: {
      candidateId: 'MK1.EXE:0x0009C914',
      B1OccurrenceCount: 0,
      B2ContextCount: 0,
      crossPopulationStatus: 'not-applicable-no-occurrences',
      participatingPopulationsCount: 0,
      notes: 'Negative control verified zero upstream.',
    },
  } as unknown as MK1PaletteCycleLayoutResult;

  const mockSource: DirectorySource = {
    readSlice: async (_path: string, start: number, length: number) => {
      return syntheticBytes.slice(start, start + length).buffer;
    },
    readFile: async () => syntheticBytes.buffer,
  } as unknown as DirectorySource;

  describe('Integration Engine on Controlled Synthetic Fixture', () => {

    it('executes full B.5 analysis and validates phase-alignment gain for P=9', async () => {
      const result = await executePalettePhaseHarmonicReconnaissance(
        mockSource,
        mockReport,
        mockB1Result,
        mockB2Result,
        mockB3Result,
        mockB4Result,
        undefined,
        syntheticBytes
      );

      expect(result.status).toBe('SUCCESS');
      expect(result.reconciliation.allReconciled).toBe(true);

      const popAnalysis = result.physicalPopulationPhaseAnalyses[0];
      expect(popAnalysis).toBeDefined();
      expect(popAnalysis.periodPhaseAnalyses.length).toBe(2);

      // Period P=9
      const p9 = popAnalysis.periodPhaseAnalyses.find((p) => p.periodBytes === 9)!;
      expect(p9).toBeDefined();
      expect(p9.phaseCount).toBe(4);

      // In B.4, pooled agreement for P=9 was 50%.
      // In B.5, phase 0 is 0x11, phase 1 is 0x22, phase 2 is 0x11, phase 3 is 0x22.
      // Across cycles, phase 0 has sample 0x11 in block 1 and block 2 -> 100%!
      // Phase 1 has 0x22 in block 1 and block 2 -> 100%!
      // Phase-aligned agreement is 100%!
      expect(p9.phaseAlignedContextDominantAgreementPercentage).toBe(100.0);
      expect(p9.b4PooledContextDominantAgreementPercentage).toBe(50.0);
      // Gain is +50 percentage points!
      expect(p9.phaseAlignmentGainPercentagePoints).toBe(50.0);
      expect(p9.hasPhaseLockedVariation).toBe(true);

      // Phase signature sequence should repeat: A B A B
      // Sig for phase 0 and phase 2 is identical, phase 1 and phase 3 is identical
      expect(p9.phaseSignatureSequence).toEqual(['A', 'B', 'A', 'B']);
      expect(p9.exactRepeatingPhaseSignatureMotif).toEqual({
        motif: ['A', 'B'],
        repeatCount: 2,
      });

      // Period P=18
      const p18 = popAnalysis.periodPhaseAnalyses.find((p) => p.periodBytes === 18)!;
      expect(p18).toBeDefined();
      expect(p18.phaseCount).toBe(2);
      expect(p18.phaseAlignedContextDominantAgreementPercentage).toBe(100.0);

      // Harmonic divisor relationship: P=9 vs P=18 (18 % 9 === 0)
      expect(popAnalysis.harmonicRelationships.length).toBe(1);
      const harm = popAnalysis.harmonicRelationships[0];
      expect(harm.lowerPeriodBytes).toBe(9);
      expect(harm.higherPeriodBytes).toBe(18);
      expect(harm.ratio).toBe(2);
      expect(harm.lowerPhaseAlignedAtLeastHigherPooled).toBe(true);
      expect(harm.groupingMap).toEqual([
        { higherPhaseIndex: 0, lowerPhaseIndices: [0, 1] },
        { higherPhaseIndex: 1, lowerPhaseIndices: [2, 3] },
      ]);
    });

    it('correctly tracks primary occurrence geometry slots (same-lane across distinct phases)', async () => {
      const result = await executePalettePhaseHarmonicReconnaissance(
        mockSource,
        mockReport,
        mockB1Result,
        mockB2Result,
        mockB3Result,
        mockB4Result,
        undefined,
        syntheticBytes
      );

      const popAnalysis = result.physicalPopulationPhaseAnalyses[0];
      const p18 = popAnalysis.periodPhaseAnalyses.find((p) => p.periodBytes === 18)!;

      // Primary occurrence slots: [0, 18]
      // For P=18: slot 0 is (phase 0, lane 0), slot 18 is (phase 1, lane 0)
      // Both occupy lane 0 in distinct phases (0 and 1)!
      expect(p18.primaryOccurrenceGeometry).toEqual([
        { slotIndex: 0, relativeOffsetWithinCycle: 0, phaseIndex: 0, laneOffsetWithinPhase: 0 },
        { slotIndex: 1, relativeOffsetWithinCycle: 18, phaseIndex: 1, laneOffsetWithinPhase: 0 },
      ]);
      expect(p18.primaryOccurrencesShareLaneAcrossDistinctPhases).toBe(true);
      expect(p18.primaryOccurrencesSharePhaseDifferentLanes).toBe(false);
    });

    it('generates valid compact JSON export adhering to mk1_palette_phase_harmonic_recon_v1 schema', async () => {
      const result = await executePalettePhaseHarmonicReconnaissance(
        mockSource,
        mockReport,
        mockB1Result,
        mockB2Result,
        mockB3Result,
        mockB4Result,
        undefined,
        syntheticBytes
      );

      const exportData = createMK1CompactPalettePhaseHarmonicExport(result);
      expect(exportData.format).toBe('mk1_palette_phase_harmonic_recon_v1');
      expect(exportData.schemaVersion).toBe(1);
      expect(exportData.globalSummary.physicalPopulationsAnalyzed).toBe(1);
      expect(exportData.globalSummary.periodCandidatesAnalyzed).toBe(2);
      expect(exportData.globalSummary.periodsWithPositivePhaseAlignmentGain).toBe(1);
      expect(exportData.globalSummary.harmonicRelationshipsAnalyzed).toBe(1);
      expect(exportData.reconciliation.allReconciled).toBe(true);
    });

    it('returns FAILED when fixture metadata is mismatched across upstream passes', async () => {
      const mismatchedB1Result = {
        ...mockB1Result,
        fixture: { exePath: 'DIFFERENT.EXE', exeSize: 12345 },
      };

      const result = await executePalettePhaseHarmonicReconnaissance(
        mockSource,
        mockReport,
        mismatchedB1Result,
        mockB2Result,
        mockB3Result,
        mockB4Result,
        undefined,
        syntheticBytes
      );

      expect(result.status).toBe('FAILED');
      expect(result.failureReason).toContain('FAILED — PREREQUISITE MISMATCH');
    });

    it('preserves negative control candidate with not-applicable status', async () => {
      const result = await executePalettePhaseHarmonicReconnaissance(
        mockSource,
        mockReport,
        mockB1Result,
        mockB2Result,
        mockB3Result,
        mockB4Result,
        undefined,
        syntheticBytes
      );

      expect(result.negativeControlSummary.candidateId).toBe('MK1.EXE:0x0009C914');
      expect(result.negativeControlSummary.status).toBe('not-applicable-no-occurrences');
      expect(result.negativeControlSummary.participatingPopulationsCount).toBe(0);
    });
  });

  describe('Milestone 1 — Pass 1E.2B.5b Contract Suite (Sections 37-43)', () => {
    describe('37 — Cross-Higher Denominator Isolation Test', () => {
      it('isolates cross-higher eligible and ineligible lanes within constituent roles', async () => {
        // Build a fixture where Ratio = 2 (Lower P=6, Higher P=12, cycleSpan=24, 2 cycles).
        // Higher P=12 has 2 phases: h=0 (bytes 0..11), h=1 (bytes 12..23).
        // For role r=0:
        //   - Lane l=0: h=0 is offset 0; h=1 is offset 12.
        //     If offset 12 is masked by B.1 in both cycles, h=1 contributes 0 samples to lane 0.
        //     Lane 0 has distinctHigherPhases = {0} (size 1 < 2) -> ineligible!
        //   - Lane l=5: h=0 is offset 5; h=1 is offset 17.
        //     Both offsets are unmasked.
        //     Lane 5 has distinctHigherPhases = {0, 1} (size 2) -> eligible!
        const exeSize = 1000;
        const testBytes = new Uint8Array(exeSize);
        const c0 = 100;
        const c1 = 200;
        const cycleSpan = 24;

        // Fill cycles with stable pattern: 0x42 everywhere, except lane 0
        for (const anchor of [c0, c1]) {
          for (let i = 0; i < cycleSpan; i++) {
            testBytes[anchor + i] = 0x42;
          }
        }

        // B.1 occurrence masking offset 12 (covers 12..15 in cycle 0 and cycle 1)
        const occList: ExactValueOccurrence[] = [
          {
            sourceFileOffset: c0 + 12,
            sourceFileOffsetHex: '0x00000070',
            representationKind: 'linear-structure-address',
            matchedUint32Value: 0x324c0,
            matchedUint32Hex: '0x000324C0',
            targetCandidateRegionId: 'PAGE_0',
            targetCandidateRegionClass: 'DATA',
            targetObjectNumber: 1,
            targetCandidateId: 'MK1.EXE:0x000324C0',
            targetCandidateByteStart: 0x324c0,
            targetCandidateByteStartHex: '0x000324C0',
            sourceRegionId: 'PAGE_0',
            sourceRegionClass: 'DATA',
            sourceObjectNumber: 1,
          },
          {
            sourceFileOffset: c1 + 12,
            sourceFileOffsetHex: '0x000000D4',
            representationKind: 'linear-structure-address',
            matchedUint32Value: 0x324c0,
            matchedUint32Hex: '0x000324C0',
            targetCandidateRegionId: 'PAGE_0',
            targetCandidateRegionClass: 'DATA',
            targetObjectNumber: 1,
            targetCandidateId: 'MK1.EXE:0x000324C0',
            targetCandidateByteStart: 0x324c0,
            targetCandidateByteStartHex: '0x000324C0',
            sourceRegionId: 'PAGE_0',
            sourceRegionClass: 'DATA',
            sourceObjectNumber: 1,
          },
        ] as unknown as ExactValueOccurrence[];

        const report: MK1ExecutableLayoutReport = {
          exePath: 'MK1.EXE',
          exeSize,
          isValid: true,
          topology: {
            regions: [
              {
                regionId: 'PAGE_0',
                regionClass: 'DATA',
                fileStartOffset: 0,
                fileEndOffset: exeSize,
                sizeBytes: exeSize,
              },
            ],
          },
        } as unknown as MK1ExecutableLayoutReport;

        const b1Res: MK1PaletteReferenceReconResult = {
          status: 'SUCCESS',
          metadata: { operationId: 'b1-test', timestamp: new Date().toISOString(), durationMs: 1 },
          fixture: { exePath: 'MK1.EXE', exeSize, exeSizeHex: '0x000003E8' },
          truncationSummary: { totalOccurrencesOmitted: 0 },
          globalSummary: {
            totalExternalLogicalMatches: 2,
            uniqueExternalPhysicalOccurrencePositions: 2,
          },
          candidateSummaries: [
            {
              candidateId: 'MK1.EXE:0x000324C0',
              totalLogicalMatches: 2,
              externalOccurrenceCount: 2,
            },
          ],
          detailedOccurrences: occList,
        } as unknown as MK1PaletteReferenceReconResult;

        const b2Res: MK1PaletteOccurrenceContextResult = {
          status: 'SUCCESS',
          metadata: { operationId: 'b2-test', timestamp: new Date().toISOString(), durationMs: 1 },
          fixture: { exePath: 'MK1.EXE', exeSize, exeSizeHex: '0x000003E8' },
          reconciliation: { allReconciled: true, clusteredPositions: 2, unclusteredPositions: 0 },
          trackB: { clusters: [{ clusterId: 'cluster-0', positions: [c0 + 12, c1 + 12] }] },
          negativeControl: {
            candidateId: 'MK1.EXE:0x0009C914',
            expectedZeroOccurrences: true,
            actualOccurrencesB1: 0,
            actualOccurrencesB2: 0,
            status: 'CONFIRMED_ZERO_OCCURRENCES',
            notes: '',
          },
        } as unknown as MK1PaletteOccurrenceContextResult;

        const b3Res: MK1PaletteRepeatedStructureResult = {
          status: 'SUCCESS',
          metadata: { operationId: 'b3-test', timestamp: new Date().toISOString(), durationMs: 1 },
          fixture: { exePath: 'MK1.EXE', exeSize, exeSizeHex: '0x000003E8' },
          reconciliation: { allReconciled: true },
          globalStructuralSummary: {
            b2ClustersProcessed: 1,
            repeatedTargetGroupsDerived: 0,
            clustersWithRepeatingDeltaMotif: 1,
          },
          clusterStructuralSummaries: [],
          negativeControlSummary: {
            candidateId: 'MK1.EXE:0x0009C914',
            B1OccurrenceCount: 0,
            B2ContextCount: 0,
          },
        } as unknown as MK1PaletteRepeatedStructureResult;

        const b4Res: MK1PaletteCycleLayoutResult = {
          status: 'SUCCESS',
          metadata: { operationId: 'b4-test', timestamp: new Date().toISOString(), durationMs: 1 },
          fixture: { exePath: 'MK1.EXE', exeSize, exeSizeHex: '0x000003E8' },
          scanConfiguration: {
            minimumPeriodBytes: 2,
            maximumPeriodBytes: 24,
            minimumSubunitsPerCycle: 2,
            periodMode: 'proper-cycle-divisors-only',
            maskMode: 'all-existing-b1-exact-occurrence-fields',
          },
          reconciliation: {
            b4PhysicalPopulationsInput: 1,
            b4PhysicalPopulationsProcessed: 1,
            b4PhysicalPopulationsSkipped: 0,
            allPhysicalPopulationsAccountedFor: true,
            periodCandidatesGenerated: 2,
            periodCandidatesProcessed: 2,
            periodCandidatesSkipped: 0,
            allPeriodCandidatesAccountedFor: true,
            b1PhysicalOccurrencePositionsConsidered: 2,
            b1PhysicalOccurrencePositionsResolved: 2,
            b1PhysicalOccurrencePositionsMissing: 0,
            allB1OccurrencesResolve: true,
            allCrossPopulationGroupsAccountedFor: true,
            allReconciled: true,
          },
          globalSummary: {
            uniquePhysicalCyclePopulations: 1,
            totalPeriodCandidatesTested: 2,
            populationsWithAtLeastOneNotablePeriod: 1,
            crossPopulationGroupsFormed: 1,
          },
          physicalCyclePopulations: [
            {
              populationId: 'POP_ISO_001',
              sourceRegionId: 'PAGE_0',
              sourceRegionClass: 'DATA',
              sourceObjectNumber: 1,
              cycleSpan,
              cycleBlockCount: 2,
              cycleAnchors: [c0, c1],
              cycleAnchorsHex: ['0x00000064', '0x000000C8'],
              candidateIds: ['MK1.EXE:0x000324C0'],
              representationKinds: ['linear-32bit-offset'],
              sourceClusterIds: ['cluster-0'],
              sourceRepeatedTargetGroupIds: [],
              slotProvenanceDisagreements: [],
              B3PrimaryMotif: {
                subsequenceLength: 1,
                subsequenceDeltas: [100],
                repetitionCount: 1,
                confidenceScore: 1,
              },
              B3OccurrenceSlots: [12],
              testedPeriods: [
                {
                  periodBytes: 6,
                  subunitsPerCycle: 4,
                  rawComparableByteCount: 48,
                  rawDominantByteCount: 48,
                  rawDominantAgreementPercentage: 100,
                  rawStableBytePositionCount: 6,
                  rawStableBytePositionPercentage: 100,
                  contextComparableByteCount: 40,
                  contextDominantByteCount: 40,
                  contextDominantAgreementPercentage: 100,
                  contextStableBytePositionCount: 5,
                  contextStableBytePositionPercentage: 100,
                },
                {
                  periodBytes: 12,
                  subunitsPerCycle: 2,
                  rawComparableByteCount: 48,
                  rawDominantByteCount: 48,
                  rawDominantAgreementPercentage: 100,
                  rawStableBytePositionCount: 12,
                  rawStableBytePositionPercentage: 100,
                  contextComparableByteCount: 40,
                  contextDominantByteCount: 40,
                  contextDominantAgreementPercentage: 100,
                  contextStableBytePositionCount: 10,
                  contextStableBytePositionPercentage: 100,
                },
              ],
              topPeriodCandidates: [{ periodBytes: 12 }, { periodBytes: 6 }],
              b1OccurrencePositionsInsideCycles: [c0 + 12, c1 + 12],
              b1OccurrencePositionsInsideCyclesHex: ['0x00000070', '0x000000D4'],
              b1OccurrenceDensity: {
                densityClassification: 'sparse-repeated',
                occurrencesPerSubunitByPeriod: {},
              },
            },
          ],
          crossPopulationCandidateGroups: [],
          knownAnchorControlSummary: [],
          negativeControlSummary: {
            candidateId: 'MK1.EXE:0x0009C914',
            B1OccurrenceCount: 0,
            B2ContextCount: 0,
            crossPopulationStatus: 'not-applicable-no-occurrences',
            participatingPopulationsCount: 0,
            notes: '',
          },
        } as unknown as MK1PaletteCycleLayoutResult;

        const source: DirectorySource = {
          readSlice: async (_path: string, start: number, length: number) => {
            return testBytes.slice(start, start + length).buffer;
          },
          readFile: async () => testBytes.buffer,
        } as unknown as DirectorySource;

        const result = await executePalettePhaseHarmonicReconnaissance(
          source,
          report,
          b1Res,
          b2Res,
          b3Res,
          b4Res,
          undefined,
          testBytes
        );

        expect(result.status).toBe('SUCCESS');
        const pop = result.physicalPopulationPhaseAnalyses[0];
        expect(pop.harmonicRelationships.length).toBe(1);
        const harm = pop.harmonicRelationships[0];
        expect(harm.lowerPeriodBytes).toBe(6);
        expect(harm.higherPeriodBytes).toBe(12);
        expect(harm.ratio).toBe(2);

        // In role 0:
        // Lane 0: offset 0 (h=0) is unmasked; offset 12 (h=1) is masked in both cycles.
        // h=1 contributes 0 samples to lane 0 -> distinctHigherPhases = [0] (size 1).
        // Lane 0 MUST be ineligible!
        const role0 = harm.roleSummaries[0];
        const lane0 = role0.lanes[0];
        expect(lane0.isCrossHigherEligible).toBe(false);
        expect(lane0.distinctHigherPhaseIndicesContributing.length).toBe(1);
        expect(role0.crossHigherIneligibleLaneOffsets).toContain(0);

        // Lane 5: unmasked in both h=0 (offset 5) and h=1 (offset 17).
        // h=0 and h=1 both contribute -> distinctHigherPhases = [0, 1] (size 2).
        // Lane 5 MUST be eligible!
        const lane5 = role0.lanes[5];
        expect(lane5.isCrossHigherEligible).toBe(true);
        expect(lane5.distinctHigherPhaseIndicesContributing.length).toBe(2);
        expect(role0.crossHigherEligibleLaneOffsets).toContain(5);

        // Role 0 cross-higher agreement strictly excludes Lane 0:
        expect(role0.crossHigherComparableLaneCount).toBeGreaterThan(0);
        expect(role0.crossHigherComparableSampleCount).toBeGreaterThan(0);
      });
    });

    describe('38 — Cross-Higher Zero Eligible Lanes Test', () => {
      it('marks relationship as insufficient-cross-higher-evidence when zero lanes contribute from >= 2 higher phases', async () => {
        // Build a fixture where Higher Phase 1 is completely masked by B.1 occurrences.
        // CycleSpan = 8, Lower P=2, Higher P=4, ratio R=2.
        // Higher P=4 has Phase 0 (bytes 0..3) and Phase 1 (bytes 4..7).
        // Placing a 4-byte B.1 occurrence covering bytes 4..7 masks Phase 1 entirely in all cycles!
        const exeSize = 500;
        const testBytes = new Uint8Array(exeSize);
        const c0 = 100;
        const c1 = 200;
        const cycleSpan = 8;

        for (const anchor of [c0, c1]) {
          for (let i = 0; i < cycleSpan; i++) {
            testBytes[anchor + i] = 0x55;
          }
        }

        const occList: ExactValueOccurrence[] = [
          {
            sourceFileOffset: c0 + 4,
            sourceFileOffsetHex: '0x00000068',
            representationKind: 'linear-structure-address',
            matchedUint32Value: 0x324c0,
            matchedUint32Hex: '0x000324C0',
            targetCandidateRegionId: 'PAGE_0',
            targetCandidateRegionClass: 'DATA',
            targetObjectNumber: 1,
            targetCandidateId: 'MK1.EXE:0x000324C0',
            targetCandidateByteStart: 0x324c0,
            targetCandidateByteStartHex: '0x000324C0',
            sourceRegionId: 'PAGE_0',
            sourceRegionClass: 'DATA',
            sourceObjectNumber: 1,
          },
          {
            sourceFileOffset: c1 + 4,
            sourceFileOffsetHex: '0x000000CC',
            representationKind: 'linear-structure-address',
            matchedUint32Value: 0x324c0,
            matchedUint32Hex: '0x000324C0',
            targetCandidateRegionId: 'PAGE_0',
            targetCandidateRegionClass: 'DATA',
            targetObjectNumber: 1,
            targetCandidateId: 'MK1.EXE:0x000324C0',
            targetCandidateByteStart: 0x324c0,
            targetCandidateByteStartHex: '0x000324C0',
            sourceRegionId: 'PAGE_0',
            sourceRegionClass: 'DATA',
            sourceObjectNumber: 1,
          },
        ] as unknown as ExactValueOccurrence[];

        const report: MK1ExecutableLayoutReport = {
          exePath: 'MK1.EXE',
          exeSize,
          isValid: true,
          topology: {
            regions: [
              {
                regionId: 'PAGE_0',
                regionClass: 'DATA',
                fileStartOffset: 0,
                fileEndOffset: exeSize,
                sizeBytes: exeSize,
              },
            ],
          },
        } as unknown as MK1ExecutableLayoutReport;

        const b1Res: MK1PaletteReferenceReconResult = {
          status: 'SUCCESS',
          metadata: { operationId: 'b1-zero', timestamp: new Date().toISOString(), durationMs: 1 },
          fixture: { exePath: 'MK1.EXE', exeSize, exeSizeHex: '0x000001F4' },
          truncationSummary: { totalOccurrencesOmitted: 0 },
          globalSummary: {
            totalExternalLogicalMatches: 2,
            uniqueExternalPhysicalOccurrencePositions: 2,
          },
          candidateSummaries: [
            {
              candidateId: 'MK1.EXE:0x000324C0',
              totalLogicalMatches: 2,
              externalOccurrenceCount: 2,
            },
          ],
          detailedOccurrences: occList,
        } as unknown as MK1PaletteReferenceReconResult;

        const b2Res: MK1PaletteOccurrenceContextResult = {
          status: 'SUCCESS',
          metadata: { operationId: 'b2-zero', timestamp: new Date().toISOString(), durationMs: 1 },
          fixture: { exePath: 'MK1.EXE', exeSize, exeSizeHex: '0x000001F4' },
          reconciliation: { allReconciled: true, clusteredPositions: 2, unclusteredPositions: 0 },
          trackB: { clusters: [{ clusterId: 'cluster-0', positions: [c0 + 4, c1 + 4] }] },
          negativeControl: {
            candidateId: 'MK1.EXE:0x0009C914',
            expectedZeroOccurrences: true,
            actualOccurrencesB1: 0,
            actualOccurrencesB2: 0,
            status: 'CONFIRMED_ZERO_OCCURRENCES',
            notes: '',
          },
        } as unknown as MK1PaletteOccurrenceContextResult;

        const b3Res: MK1PaletteRepeatedStructureResult = {
          status: 'SUCCESS',
          metadata: { operationId: 'b3-zero', timestamp: new Date().toISOString(), durationMs: 1 },
          fixture: { exePath: 'MK1.EXE', exeSize, exeSizeHex: '0x000001F4' },
          reconciliation: { allReconciled: true },
          globalStructuralSummary: {
            b2ClustersProcessed: 1,
            repeatedTargetGroupsDerived: 0,
            clustersWithRepeatingDeltaMotif: 1,
          },
          clusterStructuralSummaries: [],
          negativeControlSummary: {
            candidateId: 'MK1.EXE:0x0009C914',
            B1OccurrenceCount: 0,
            B2ContextCount: 0,
          },
        } as unknown as MK1PaletteRepeatedStructureResult;

        const b4Res: MK1PaletteCycleLayoutResult = {
          status: 'SUCCESS',
          metadata: { operationId: 'b4-zero', timestamp: new Date().toISOString(), durationMs: 1 },
          fixture: { exePath: 'MK1.EXE', exeSize, exeSizeHex: '0x000001F4' },
          scanConfiguration: {
            minimumPeriodBytes: 2,
            maximumPeriodBytes: 8,
            minimumSubunitsPerCycle: 2,
            periodMode: 'proper-cycle-divisors-only',
            maskMode: 'all-existing-b1-exact-occurrence-fields',
          },
          reconciliation: {
            b4PhysicalPopulationsInput: 1,
            b4PhysicalPopulationsProcessed: 1,
            b4PhysicalPopulationsSkipped: 0,
            allPhysicalPopulationsAccountedFor: true,
            periodCandidatesGenerated: 2,
            periodCandidatesProcessed: 2,
            periodCandidatesSkipped: 0,
            allPeriodCandidatesAccountedFor: true,
            b1PhysicalOccurrencePositionsConsidered: 2,
            b1PhysicalOccurrencePositionsResolved: 2,
            b1PhysicalOccurrencePositionsMissing: 0,
            allB1OccurrencesResolve: true,
            allCrossPopulationGroupsAccountedFor: true,
            allReconciled: true,
          },
          globalSummary: {
            uniquePhysicalCyclePopulations: 1,
            totalPeriodCandidatesTested: 2,
            populationsWithAtLeastOneNotablePeriod: 1,
            crossPopulationGroupsFormed: 1,
          },
          physicalCyclePopulations: [
            {
              populationId: 'POP_ZERO_001',
              sourceRegionId: 'PAGE_0',
              sourceRegionClass: 'DATA',
              sourceObjectNumber: 1,
              cycleSpan,
              cycleBlockCount: 2,
              cycleAnchors: [c0, c1],
              cycleAnchorsHex: ['0x00000064', '0x000000C8'],
              candidateIds: ['MK1.EXE:0x000324C0'],
              representationKinds: ['linear-32bit-offset'],
              sourceClusterIds: ['cluster-0'],
              sourceRepeatedTargetGroupIds: [],
              slotProvenanceDisagreements: [],
              B3PrimaryMotif: {
                subsequenceLength: 1,
                subsequenceDeltas: [100],
                repetitionCount: 1,
                confidenceScore: 1,
              },
              B3OccurrenceSlots: [4],
              testedPeriods: [
                {
                  periodBytes: 2,
                  subunitsPerCycle: 4,
                  rawComparableByteCount: 16,
                  rawDominantByteCount: 16,
                  rawDominantAgreementPercentage: 100,
                  rawStableBytePositionCount: 2,
                  rawStableBytePositionPercentage: 100,
                  contextComparableByteCount: 8,
                  contextDominantByteCount: 8,
                  contextDominantAgreementPercentage: 100,
                  contextStableBytePositionCount: 2,
                  contextStableBytePositionPercentage: 100,
                },
                {
                  periodBytes: 4,
                  subunitsPerCycle: 2,
                  rawComparableByteCount: 16,
                  rawDominantByteCount: 16,
                  rawDominantAgreementPercentage: 100,
                  rawStableBytePositionCount: 4,
                  rawStableBytePositionPercentage: 100,
                  contextComparableByteCount: 8,
                  contextDominantByteCount: 8,
                  contextDominantAgreementPercentage: 100,
                  contextStableBytePositionCount: 2,
                  contextStableBytePositionPercentage: 100,
                },
              ],
              topPeriodCandidates: [{ periodBytes: 4 }, { periodBytes: 2 }],
              b1OccurrencePositionsInsideCycles: [c0 + 4, c1 + 4],
              b1OccurrencePositionsInsideCyclesHex: ['0x00000068', '0x000000CC'],
              b1OccurrenceDensity: {
                densityClassification: 'sparse-repeated',
                occurrencesPerSubunitByPeriod: {},
              },
            },
          ],
          crossPopulationCandidateGroups: [],
          knownAnchorControlSummary: [],
          negativeControlSummary: {
            candidateId: 'MK1.EXE:0x0009C914',
            B1OccurrenceCount: 0,
            B2ContextCount: 0,
            crossPopulationStatus: 'not-applicable-no-occurrences',
            participatingPopulationsCount: 0,
            notes: '',
          },
        } as unknown as MK1PaletteCycleLayoutResult;

        const source: DirectorySource = {
          readSlice: async (_path: string, start: number, length: number) => {
            return testBytes.slice(start, start + length).buffer;
          },
          readFile: async () => testBytes.buffer,
        } as unknown as DirectorySource;

        const result = await executePalettePhaseHarmonicReconnaissance(
          source,
          report,
          b1Res,
          b2Res,
          b3Res,
          b4Res,
          undefined,
          testBytes
        );

        expect(result.status).toBe('SUCCESS');
        const pop = result.physicalPopulationPhaseAnalyses[0];
        const harm = pop.harmonicRelationships[0];

        // Zero eligible lanes across higher phases
        expect(harm.crossHigherRoleComparableLaneCount).toBe(0);
        expect(harm.crossHigherRoleDominantAgreementPercentage).toBeNull();
        expect(harm.roleRecurrenceStatus).toBe('insufficient-cross-higher-evidence');
        expect(harm.rolesWithCrossHigherComparableLanes).toBe(0);
        expect(harm.rolesWithoutCrossHigherComparableLanes).toBe(harm.lowerPeriodBytes);
      });
    });

    describe('39 — Canonical Pooled Mixing Penalty Tests', () => {
      it('accurately verifies pooled mixing penalty behavior under positive and zero penalty conditions', async () => {
        const result = await executePalettePhaseHarmonicReconnaissance(
          mockSource,
          mockReport,
          mockB1Result,
          mockB2Result,
          mockB3Result,
          mockB4Result,
          undefined,
          syntheticBytes
        );

        const pop = result.physicalPopulationPhaseAnalyses[0];

        // P=9: phaseAligned=100%, pooled=50% -> penalty=+50 percentage points
        const p9 = pop.periodPhaseAnalyses.find((p) => p.periodBytes === 9)!;
        expect(p9.phaseAlignedContextDominantAgreementPercentage).toBe(100.0);
        expect(p9.b4PooledContextDominantAgreementPercentage).toBe(50.0);
        expect(p9.pooledMixingPenaltyPercentagePoints).toBe(50.0);
        expect(p9.hasPooledPhaseMixingPenalty).toBe(true);

        // P=18: phaseAligned=100%, pooled=100% -> penalty=0 percentage points
        const p18 = pop.periodPhaseAnalyses.find((p) => p.periodBytes === 18)!;
        expect(p18.phaseAlignedContextDominantAgreementPercentage).toBe(100.0);
        expect(p18.b4PooledContextDominantAgreementPercentage).toBe(100.0);
        expect(p18.pooledMixingPenaltyPercentagePoints).toBe(0.0);
        expect(p18.hasPooledPhaseMixingPenalty).toBe(false);
      });
    });

    describe('40 — Negative Control Hardening Tests', () => {
      it('returns not-applicable-no-occurrences when upstream B1=0 and B2=0', () => {
        const b1 = {
          candidateSummaries: [
            { candidateId: 'MK1.EXE:0x0009C914', totalLogicalMatches: 0, externalOccurrenceCount: 0 },
          ],
        };
        const b2 = {
          negativeControl: {
            candidateId: 'MK1.EXE:0x0009C914',
            expectedZeroOccurrences: true,
            actualOccurrencesB1: 0,
            actualOccurrencesB2: 0,
            status: 'CONFIRMED_ZERO_OCCURRENCES' as const,
            notes: '',
          },
        };
        const summary = deriveNegativeControlSummary(b1 as unknown as MK1PaletteReferenceReconResult, b2 as unknown as MK1PaletteOccurrenceContextResult, 0, []);
        expect(summary.status).toBe('not-applicable-no-occurrences');
        expect(summary.B1OccurrenceCount).toBe(0);
        expect(summary.B2ContextCount).toBe(0);
        expect(summary.participatingPopulationsCount).toBe(0);
      });

      it('returns unexpected-occurrences-found and preserves counts when upstream B1=2 and B2=1', () => {
        const b1 = {
          candidateSummaries: [
            { candidateId: 'MK1.EXE:0x0009C914', totalLogicalMatches: 2, externalOccurrenceCount: 2 },
          ],
        };
        const b2 = {
          negativeControl: {
            candidateId: 'MK1.EXE:0x0009C914',
            expectedZeroOccurrences: true,
            actualOccurrencesB1: 2,
            actualOccurrencesB2: 1,
            status: 'UNEXPECTED_OCCURRENCES_DETECTED' as const,
            notes: '',
          },
        };
        const summary = deriveNegativeControlSummary(b1 as unknown as MK1PaletteReferenceReconResult, b2 as unknown as MK1PaletteOccurrenceContextResult, 1, ['POP_001']);
        expect(summary.status).toBe('unexpected-occurrences-found');
        expect(summary.B1OccurrenceCount).toBe(2);
        expect(summary.B2ContextCount).toBe(1);
        expect(summary.participatingPopulationsCount).toBe(1);
        expect(summary.participatingPopulationIds).toEqual(['POP_001']);
      });

      it('returns unavailable-upstream-uninspected when upstream evidence is null', () => {
        const summary = deriveNegativeControlSummary(null, null, 0, []);
        expect(summary.status).toBe('unavailable-upstream-uninspected');
        expect(summary.B1OccurrenceCount).toBeNull();
        expect(summary.B2ContextCount).toBeNull();
      });

      it('preserves negative control summary on engine failure', async () => {
        const mismatchedB1 = {
          ...mockB1Result,
          fixture: { exePath: 'WRONG.EXE', exeSize: 99999 },
        };
        const failedResult = await executePalettePhaseHarmonicReconnaissance(
          mockSource,
          mockReport,
          mismatchedB1,
          mockB2Result,
          mockB3Result,
          mockB4Result,
          undefined,
          syntheticBytes
        );
        expect(failedResult.status).toBe('FAILED');
        expect(failedResult.negativeControlSummary).toBeDefined();
        expect(failedResult.negativeControlSummary.candidateId).toBe('MK1.EXE:0x0009C914');
        expect(failedResult.negativeControlSummary.status).toBe('not-applicable-no-occurrences');
      });
    });

    describe('41 — Harmonic Role-Slot Boundary Tests', () => {
      it('groups higher phases into lower phases according to lowerPhaseIndex = (h * R) + r', async () => {
        const result = await executePalettePhaseHarmonicReconnaissance(
          mockSource,
          mockReport,
          mockB1Result,
          mockB2Result,
          mockB3Result,
          mockB4Result,
          undefined,
          syntheticBytes
        );

        const pop = result.physicalPopulationPhaseAnalyses[0];
        const harm = pop.harmonicRelationships[0];
        // Lower P=9, Higher P=18, Ratio R=2
        expect(harm.ratio).toBe(2);
        expect(harm.groupingMap).toEqual([
          { higherPhaseIndex: 0, lowerPhaseIndices: [0, 1] },
          { higherPhaseIndex: 1, lowerPhaseIndices: [2, 3] },
        ]);
        expect(harm.roleSummaries.length).toBe(2);
        expect(harm.roleSummaries[0].roleIndex).toBe(0);
        expect(harm.roleSummaries[1].roleIndex).toBe(1);
      });
    });

    describe('42 — B.1 Exact Position Reconciliation Test', () => {
      it('reconciles eligible and skipped population positions against B.4 input', async () => {
        // Multi-population fixture: POP_001 (eligible, 2 positions) and POP_002 (skipped, 1 position)
        const b4WithSkipped = {
          ...mockB4Result,
          reconciliation: {
            ...mockB4Result.reconciliation,
            b4PhysicalPopulationsInput: 2,
            b4PhysicalPopulationsProcessed: 1,
            b4PhysicalPopulationsSkipped: 1,
            b1PhysicalOccurrencePositionsConsidered: 3,
            b1PhysicalOccurrencePositionsResolved: 3,
          },
          physicalCyclePopulations: [
            mockB4Result.physicalCyclePopulations[0],
            {
              populationId: 'POP_SKIPPED',
              sourceRegionId: 'PAGE_0',
              sourceRegionClass: 'data',
              sourceObjectNumber: 1,
              cycleSpan: 20,
              cycleBlockCount: 2,
              cycleAnchors: [500, 600],
              cycleAnchorsHex: ['0x000001F4', '0x00000258'],
              candidateIds: ['MK1.EXE:0x000324C0'],
              representationKinds: ['linear-32bit-offset'],
              sourceClusterIds: ['cluster-0'],
              sourceRepeatedTargetGroupIds: [],
              slotProvenanceDisagreements: [],
              B3PrimaryMotif: {
                subsequenceLength: 1,
                subsequenceDeltas: [100],
                repetitionCount: 1,
                confidenceScore: 1,
              },
              B3OccurrenceSlots: [0],
              testedPeriods: [], // skipped because 0 tested periods
              topPeriodCandidates: [],
              b1OccurrencePositionsInsideCycles: [500],
              b1OccurrencePositionsInsideCyclesHex: ['0x000001F4'],
              b1OccurrenceDensity: {
                densityClassification: 'sparse-repeated',
                occurrencesPerSubunitByPeriod: {},
              },
            },
          ],
        } as unknown as MK1PaletteCycleLayoutResult;

        const result = await executePalettePhaseHarmonicReconnaissance(
          mockSource,
          mockReport,
          mockB1Result,
          mockB2Result,
          mockB3Result,
          b4WithSkipped,
          undefined,
          syntheticBytes
        );

        expect(result.status).toBe('SUCCESS');
        const recon = result.reconciliation;
        expect(recon.b4PhysicalPopulationsInput).toBe(2);
        expect(recon.b5EligiblePhysicalPopulations).toBe(1);
        expect(recon.b5PhysicalPopulationsSkipped).toBe(1);
        expect(recon.allPhysicalPopulationsAccountedFor).toBe(true);

        // Position accounting:
        expect(recon.b1PopulationPositionPairsInEligiblePopulations).toBe(2);
        expect(recon.b1PopulationPositionPairsInSkippedPopulations).toBe(1);
        expect(recon.b4B1PopulationPositionPairsInput).toBe(3);
        expect(recon.allB4B1PopulationPositionPairsAccountedFor).toBe(true);
        expect(recon.uniqueB1PhysicalPositionsInEligiblePopulations).toBe(2);
        expect(recon.uniqueB1PhysicalPositionsInSkippedPopulations).toBe(1);
        expect(recon.b1EligiblePositionsMissing).toBe(0);
        expect(recon.allB1OccurrencesResolve).toBe(true);
      });
    });
  });
});
