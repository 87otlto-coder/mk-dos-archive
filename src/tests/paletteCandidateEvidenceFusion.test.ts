/**
 * Unit Tests for MK1 Palette Candidate Evidence Fusion
 * Milestone 1 — Pass 1E.2B.6
 */

import { describe, it, expect } from 'vitest';
import {
  executePaletteCandidateEvidenceFusion,
  createMK1CompactCandidateEvidenceFusionExport,
  getLengthBucket,
  CANONICAL_PREDICATE_DEFINITIONS,
  CANONICAL_INTERPRETATION_CAVEATS,
} from '../games/mk1/research/paletteCandidateEvidenceFusion';
import { filterCandidateProfiles } from '../games/mk1/research/paletteCandidateEvidenceFusionFilter';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import {
  MK1PaletteReferenceReconResult,
  CandidateReferenceSummary,
  ControlTargetSummary,
  PaletteRepresentationKind,
  PaletteRepresentationDescriptor,
} from '../games/mk1/research/paletteReferenceReconnaissanceTypes';
import { MK1PaletteOccurrenceContextResult } from '../games/mk1/research/paletteOccurrenceContextTypes';
import { MK1PaletteRepeatedStructureResult } from '../games/mk1/research/paletteRepeatedStructureTypes';
import { MK1PaletteCycleLayoutResult } from '../games/mk1/research/paletteCycleLayoutTypes';
import {
  MK1PalettePhaseHarmonicResult,
  PhysicalPopulationPhaseAnalysis,
} from '../games/mk1/research/palettePhaseHarmonicTypes';
import { MK1PaletteCandidate } from '../games/mk1/research/paletteTypes';

function makeMockCatalogueCandidate(summary: CandidateReferenceSummary): MK1PaletteCandidate {
  return {
    id: summary.candidateId,
    exeOffset: summary.byteStart,
    exeOffsetHex: summary.byteStartHex,
    byteStart: summary.byteStart,
    byteEnd: summary.byteEnd,
    length: summary.length,
    colors15: new Uint16Array(summary.length),
    rgbColors: [],
    uniqueColorCount: summary.length,
    uniqueColorRatio: 1,
    contentHash: summary.contentHash || 'hash-' + summary.candidateId,
    validation: { lengthValid: true, colors15Bit: true, diversityValid: true },
    tier: 'research',
    researchScore: summary.researchScore,
    textLikeScore: 0,
    containsLikelyAsciiData: false,
    overlapRelationships: { overlappingCount: 0 },
    confidence: 'candidate',
  };
}

function makeMockLayoutReport(): MK1ExecutableLayoutReport {
  return {
    timestamp: '2026-09-07T00:00:00.000Z',
    exePath: 'MK1.EXE',
    exeSize: 1157222,
    boundLayout: {
      mzWrapper: {
        mzHeaderOffset: 0,
        mzExtendedHeaderOffset: 0x40,
        mzExtendedHeaderOffsetHex: '0x00000040',
        eLfanewDiscrepancy: false,
        eLfanewNote: 'Standard MZ wrapper',
      },
      rawLeOccurrencesCount: 1,
      rawLeOccurrences: [],
      selectedPayloadCandidate: null,
    },
    parsedHeader: null,
    objects: [
      {
        objectNumber: 1,
        virtualSize: 0x60000,
        virtualSizeHex: '0x00060000',
        relocationBaseAddress: 0x10000,
        relocationBaseAddressHex: '0x00010000',
        rawFlags: 0x05,
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
        pageMapEntryCount: 96,
        capabilities: 'R-X / 32-bit',
        roleEvidence: 'executable-code-like',
        physicalSpans: [],
        mappedPageCount: 96,
        zeroFilledPageCount: 0,
      },
      {
        objectNumber: 2,
        virtualSize: 0x40000,
        virtualSizeHex: '0x00040000',
        relocationBaseAddress: 0x70000,
        relocationBaseAddressHex: '0x00070000',
        rawFlags: 0x03,
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
        pageMapIndex: 97,
        pageMapEntryCount: 64,
        capabilities: 'RW- / 32-bit',
        roleEvidence: 'read-write-data-like',
        physicalSpans: [],
        mappedPageCount: 64,
        zeroFilledPageCount: 0,
      },
    ],
    objectBackingSummary: [],
    pageMap: [],
    pageMapDiagnostics: {
      totalEntries: 0,
      validEntries: 0,
      mappedValidEntries: 0,
      iteratedEntries: 0,
      invalidEntries: 0,
      zeroFilledEntries: 0,
      rangeEntries: 0,
      unknownEntries: 0,
      minDecodedPhysicalPageNumber: null,
      maxDecodedPhysicalPageNumber: null,
      entries: [],
    },
    topology: {
      totalFileSize: 1157222,
      totalFileSizeHex: '0x0011A866',
      boundaries: {
        highestFileBackedPageEnd: 0xa0200,
        highestFileBackedPageEndHex: '0x000A0200',
        headerDerivedPageDataEnd: 0xa0200,
        headerDerivedPageDataEndHex: '0x000A0200',
        discrepancyBytes: 0,
        discrepancyExplanation: 'Exact match',
      },
      postModuleTail: {
        startOffset: 0xa0200,
        startOffsetHex: '0x000A0200',
        endOffset: 1157222,
        endOffsetHex: '0x0011A866',
        byteLength: 1157222 - 0xa0200,
        percentageOfTotalExecutable: 43.1,
        containedAnchorNames: [],
        purpose: 'UNKNOWN',
        notes: 'Post-module tail',
      },
      regions: [
        {
          regionId: 'obj1-rx',
          name: 'Object 1: 32-bit R-X',
          regionClass: 'le-object-file-backed',
          fileStart: 0x200,
          fileStartHex: '0x00000200',
          fileEnd: 0x60200,
          fileEndHex: '0x00060200',
          byteLength: 0x60000,
          percentageOfFile: 34.0,
          objectNumber: 1,
          purpose: 'Executable code',
          notes: 'Object 1',
        },
        {
          regionId: 'obj2-rw',
          name: 'Object 2: 32-bit RW-',
          regionClass: 'le-object-file-backed',
          fileStart: 0x60200,
          fileStartHex: '0x00060200',
          fileEnd: 0xa0200,
          fileEndHex: '0x000A0200',
          byteLength: 0x40000,
          percentageOfFile: 22.9,
          objectNumber: 2,
          purpose: 'Data / BSS',
          notes: 'Object 2',
        },
      ],
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
      status: 'VERIFIED',
    },
    knownAnchors: [],
  };
}

function makeMockCandidateSummary(overrides: Partial<CandidateReferenceSummary>): CandidateReferenceSummary {
  const defaultRepKind: PaletteRepresentationKind = 'linear-structure-address';
  const defaultReps: Record<PaletteRepresentationKind, PaletteRepresentationDescriptor> = {
    'physical-structure-start': { kind: 'physical-structure-start', status: 'generated', value: 0x100, valueHex: '0x00000100' },
    'physical-payload-start': { kind: 'physical-payload-start', status: 'generated', value: 0x102, valueHex: '0x00000102' },
    'object-relative-structure': { kind: 'object-relative-structure', status: 'generated', value: 0x50, valueHex: '0x00000050' },
    'object-relative-payload': { kind: 'object-relative-payload', status: 'generated', value: 0x52, valueHex: '0x00000052' },
    'linear-structure-address': { kind: 'linear-structure-address', status: 'generated', value: 0x10050, valueHex: '0x00010050' },
    'linear-payload-address': { kind: 'linear-payload-address', status: 'generated', value: 0x10052, valueHex: '0x00010052' },
  };

  const externalByRepresentation: Record<PaletteRepresentationKind, number> = {
    'physical-structure-start': 0,
    'physical-payload-start': 0,
    'object-relative-structure': 0,
    'object-relative-payload': 0,
    'linear-structure-address': 0,
    'linear-payload-address': 0,
    ...(overrides.externalByRepresentation || {}),
  };

  return {
    candidateId: 'MK1.EXE:0x000324C0',
    byteStart: 0x324c0,
    byteStartHex: '0x000324C0',
    byteEnd: 0x324c4,
    byteEndHex: '0x000324C4',
    targetRegionId: 'obj1-rx',
    targetRegionClass: 'object-mapped-le',
    objectNumber: 1,
    contentHash: 'hash324c0',
    length: 2,
    researchScore: 40,
    zeroShiftKanoCompatible: false,
    representationKindsTested: [defaultRepKind],
    representations: defaultReps,
    totalLogicalMatches: 21,
    totalUniquePhysicalOccurrences: 21,
    selfOccurrenceCount: 0,
    externalOccurrenceCount: 21,
    externalByRepresentation,
    externalBySourceRegion: { 'obj1-rx': 11, 'obj2-rw': 10 },
    externalInObject1: 11,
    externalInObject2: 10,
    externalInTail: 0,
    externalInPreLE: 0,
    externalInHeader: 0,
    detailsTruncated: false,
    firstOccurrenceOffsetHex: '0x00012340',
    lastOccurrenceOffsetHex: '0x00085670',
    ...overrides,
  };
}

function makeMockB1Result(
  candidateSummaries: CandidateReferenceSummary[],
  controlTargets: ControlTargetSummary[] = []
): MK1PaletteReferenceReconResult {
  const eligibleTargets = candidateSummaries.length;
  const externalTargets = candidateSummaries.filter((c) => c.externalOccurrenceCount > 0).length;
  return {
    status: 'SUCCESS',
    metadata: {
      operationId: 'b1-test',
      timestamp: '2026-09-07T00:00:00.000Z',
      durationMs: 1,
    },
    fixture: { exePath: 'MK1.EXE', exeSize: 1157222 },
    reconciliation: {
      researchTargetInputCount: eligibleTargets,
      researchTargetsProcessed: eligibleTargets,
      researchTargetsSkipped: 0,
      skipReasons: {},
      allTargetsAccountedFor: true,
    },
    globalSummary: {
      totalResearchTargets: eligibleTargets,
      targetsWithExternalExactOccurrences: externalTargets,
      targetsWithNoExternalExactOccurrences: eligibleTargets - externalTargets,
      percentageTargetsWithExternalOccurrences:
        eligibleTargets > 0 ? (externalTargets / eligibleTargets) * 100 : 0,
      totalExternalLogicalMatches: candidateSummaries.reduce(
        (sum, c) => sum + c.totalLogicalMatches,
        0
      ),
      uniqueExternalPhysicalOccurrencePositions: candidateSummaries.reduce(
        (sum, c) => sum + c.totalUniquePhysicalOccurrences,
        0
      ),
      totalSelfOccurrences: 0,
      candidatesWith0ExternalOccurrences: eligibleTargets - externalTargets,
      candidatesWith1ExternalOccurrence: candidateSummaries.filter(
        (c) => c.externalOccurrenceCount === 1
      ).length,
      candidatesWith2To5ExternalOccurrences: candidateSummaries.filter(
        (c) => c.externalOccurrenceCount >= 2 && c.externalOccurrenceCount <= 5
      ).length,
      candidatesWith6To20ExternalOccurrences: candidateSummaries.filter(
        (c) => c.externalOccurrenceCount >= 6 && c.externalOccurrenceCount <= 20
      ).length,
      candidatesWithMoreThan20ExternalOccurrences: candidateSummaries.filter(
        (c) => c.externalOccurrenceCount > 20
      ).length,
    },
    representationSummaries: [],
    targetRegionSummaries: [],
    sourceTargetMatrix: [],
    candidateSummaries,
    contentHashSummary: {
      contentsWithReferencesAtMultiplePhysicalCopies: 0,
      contentsWhereOnlyOneCopyHasExternalOccurrences: 0,
      contentsWhereMultipleCopiesHaveExternalOccurrences: 0,
      contentsWithZeroExternalOccurrences: eligibleTargets - externalTargets,
    },
    controlTargets,
    detailedOccurrences: [],
    truncationSummary: {
      capPerRepresentation: 100,
      totalCandidatesTruncated: 0,
      totalOccurrencesOmitted: 0,
    },
  };
}

function makeMockB5Result(
  physicalPopulationPhaseAnalyses: PhysicalPopulationPhaseAnalysis[]
): MK1PalettePhaseHarmonicResult {
  return {
    status: 'SUCCESS',
    metadata: {
      operationId: 'b5',
      timestamp: '2026-09-07T00:00:00.000Z',
      durationMs: 1,
      milestone: '1E.2B.5b',
    },
    fixture: { exePath: 'MK1.EXE', exeSize: 1157222 },
    sourceB1Summary: {
      externalLogicalMatches: 21,
      uniquePhysicalPositions: 21,
      omittedTruncatedOccurrences: 0,
    },
    sourceB2Summary: {
      clustersCount: 1,
      clusteredPositions: 21,
      unclusteredPositions: 0,
    },
    sourceB3Summary: {
      b2ClustersProcessed: 1,
      repeatedTargetGroupsProcessed: 1,
      motifsFound: 1,
      allReconciled: true,
    },
    sourceB4Summary: {
      uniquePhysicalCyclePopulations: physicalPopulationPhaseAnalyses.length,
      totalPeriodCandidatesTested: 2,
      allReconciled: true,
    },
    scanConfiguration: {
      minimumComparableSamplesForStableCell: 3,
      phaseAlignedContextAgreementThreshold: 75,
      maskMode: 'all-b1-exact-occurrence-field-intersections',
      harmonicMode: 'tested-period-exact-multiples-only',
      phaseSignatureMode: 'exact-stable-variable-mask-signature',
      crossPopulationGeometryMode: 'exact-phase-index-and-lane-pattern',
    },
    reconciliation: {
      b4PhysicalPopulationsInput: physicalPopulationPhaseAnalyses.length,
      b5EligiblePhysicalPopulations: physicalPopulationPhaseAnalyses.length,
      b5PhysicalPopulationsProcessed: physicalPopulationPhaseAnalyses.length,
      b5PhysicalPopulationsSkipped: 0,
      allPhysicalPopulationsAccountedFor: true,
      b4PeriodCandidatesInput: 2,
      b5PeriodCandidatesProcessed: 2,
      b5PeriodCandidatesSkipped: 0,
      allPeriodCandidatesAccountedFor: true,
      phaseCellsGenerated: 36,
      phaseCellsProcessed: 36,
      phaseCellsSkipped: 0,
      allPhaseCellsAccountedFor: true,
      harmonicRelationshipsGenerated: 1,
      harmonicRelationshipsProcessed: 1,
      harmonicRelationshipsSkipped: 0,
      allHarmonicRelationshipsAccountedFor: true,
      b4B1PopulationPositionPairsInput: 1,
      b1PopulationPositionPairsInEligiblePopulations: 1,
      b1PopulationPositionPairsInSkippedPopulations: 0,
      b1EligiblePositionsResolved: 1,
      b1EligiblePositionsMissing: 0,
      allB4B1PopulationPositionPairsAccountedFor: true,
      b1MissingPositions: [],
      b1PhysicalOccurrencePositionsConsidered: 1,
      b1PhysicalOccurrencePositionsResolved: 1,
      b1PhysicalOccurrencePositionsMissing: 0,
      allB1OccurrencesResolve: true,
      crossPopulationGroupsInput: 0,
      crossPopulationGroupsProcessed: 0,
      crossPopulationGroupsSkipped: 0,
      allCrossPopulationGroupsAccountedFor: true,
      allPeriodInvariantsHold: true,
      allReconciled: true,
    },
    globalSummary: {
      physicalPopulationsAnalyzed: physicalPopulationPhaseAnalyses.length,
      periodCandidatesAnalyzed: 2,
      populationsWithStrongAbsoluteOffsetRecurrence: 1,
      populationsWithoutStrongAbsoluteOffsetRecurrence: 0,
      populationAbsoluteOffsetAgreementHistogram: {},
      periodViewsWithPositivePooledMixingPenalty: 1,
      periodViewsWithZeroPooledMixingPenalty: 0,
      periodViewsWithNegativePooledMixingPenalty: 0,
      periodsWithPositivePhaseAlignmentGain: 1,
      periodsWithZeroPhaseAlignmentGain: 0,
      periodsWithNegativePhaseAlignmentGain: 0,
      periodsWithStrongPhaseAlignedRecurrence: 1,
      harmonicRelationshipsAnalyzed: 1,
      harmonicRelationshipsWhereLowerPhaseAlignedMeetsHigherPooled: 1,
      harmonicRelationshipsWithRoleConfirmedRecurrence: 1,
      harmonicRelationshipsWithRoleReducedRecurrence: 0,
      harmonicRelationshipsWithInsufficientCrossHigherEvidence: 0,
      harmonicRelationshipsAllMaskedRoles: 0,
      harmonicRelationshipsWithExactRoleSignatureMatchAcrossHigherPhases: 1,
      periodsWithRepeatedExactPhaseSignatureMotif: 0,
      periodsWithEvidenceBearingRepeatedExactPhaseSignatureMotif: 0,
      periodsWithPrimarySameLaneAcrossDistinctPhases: 0,
      crossPopulationGeometryMatches: 0,
    },
    physicalPopulationPhaseAnalyses,
    crossPopulationGeometrySummaries: [],
    knownAnchorControlSummary: [],
    negativeControlSummary: {
      candidateId: 'MK1.EXE:0x0009C914',
      B1OccurrenceCount: 0,
      B2ContextCount: 0,
      status: 'not-applicable-no-occurrences',
      participatingPopulationsCount: 0,
      notes: 'Verified negative control',
    },
  };
}

describe('Milestone 1E.2B.6 — Palette Candidate Evidence Fusion', () => {
  describe('Length Bucketing Utility', () => {
    it('correctly maps candidate lengths to expected non-overlapping buckets', () => {
      expect(getLengthBucket(2)).toBe('2');
      expect(getLengthBucket(3)).toBe('3');
      expect(getLengthBucket(4)).toBe('4-7');
      expect(getLengthBucket(7)).toBe('4-7');
      expect(getLengthBucket(8)).toBe('8-15');
      expect(getLengthBucket(15)).toBe('8-15');
      expect(getLengthBucket(16)).toBe('16-23');
      expect(getLengthBucket(23)).toBe('16-23');
      expect(getLengthBucket(24)).toBe('24-31');
      expect(getLengthBucket(31)).toBe('24-31');
      expect(getLengthBucket(32)).toBe('32-63');
      expect(getLengthBucket(63)).toBe('32-63');
      expect(getLengthBucket(64)).toBe('64+');
      expect(getLengthBucket(128)).toBe('64+');
    });
  });

  describe('Reconciliation & Candidate Resolution (Sections 6, 7)', () => {
    it('reconciles every B.1 candidate 1:1 into an evidence profile', () => {
      const report = makeMockLayoutReport();
      const cand1 = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x000324C0',
        byteStart: 0x324c0,
        byteStartHex: '0x000324C0',
        length: 2,
        researchScore: 40,
        zeroShiftKanoCompatible: false,
        objectNumber: 1,
        externalOccurrenceCount: 21,
        externalByRepresentation: {
          'linear-structure-address': 20,
          'object-relative-payload': 1,
          'physical-structure-start': 0,
          'physical-payload-start': 0,
          'object-relative-structure': 0,
          'linear-payload-address': 0,
        },
      });

      const candNegativeControl = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x0009C914',
        byteStart: 0x9c914,
        byteStartHex: '0x0009C914',
        length: 32,
        researchScore: 80,
        zeroShiftKanoCompatible: true,
        objectNumber: 2,
        targetRegionId: 'obj2-rw',
        externalOccurrenceCount: 0,
        externalByRepresentation: {
          'linear-structure-address': 0,
          'object-relative-payload': 0,
          'physical-structure-start': 0,
          'physical-payload-start': 0,
          'object-relative-structure': 0,
          'linear-payload-address': 0,
        },
      });

      const b1Result = makeMockB1Result([cand1, candNegativeControl], [
        {
          name: 'String Area Base',
          physicalOffset: 0x1000,
          physicalOffsetHex: '0x00001000',
          representationsTested: [],
          totalLogicalMatches: 0,
          uniquePhysicalOccurrences: 0,
          externalOccurrences: 0,
          sourceRegionDistribution: {},
          occurrences: [],
        },
        {
          name: 'Kano first descriptor',
          physicalOffset: 0xa7464,
          physicalOffsetHex: '0x000A7464',
          representationsTested: [],
          totalLogicalMatches: 0,
          uniquePhysicalOccurrences: 0,
          externalOccurrences: 0,
          sourceRegionDistribution: {},
          occurrences: [],
        },
      ]);

      const cat1 = makeMockCatalogueCandidate(cand1);
      const cat2 = makeMockCatalogueCandidate(candNegativeControl);
      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat1, cat2]);

      expect(result.status).toBe('PARTIAL');
      expect(result.reconciliation.allCandidatesAccountedFor).toBe(true);
      expect(result.reconciliation.b1CandidateSummariesInput).toBe(2);
      expect(result.reconciliation.candidateProfilesProduced).toBe(2);
      expect(result.candidateProfiles.length).toBe(2);

      // Verify controls audit: none of the control targets leaked into candidate profiles
      expect(result.controlsAudit.controlsExcludedFromProfiles).toBe(true);
      expect(result.controlsAudit.controlTargetsInputCount).toBe(2);
      expect(result.controlsAudit.excludedControlNames).toEqual([
        'String Area Base',
        'Kano first descriptor',
      ]);
      const profileIds = result.candidateProfiles.map((p) => p.candidateId);
      expect(profileIds).toContain('MK1.EXE:0x000324C0');
      expect(profileIds).toContain('MK1.EXE:0x0009C914');
      expect(profileIds).not.toContain('String Area Base');
    });
  });

  describe('Key Exemplar Profiles & Evidence Tensions (Sections 26-36)', () => {
    it('accurately distinguishes reference-active / weak candidate 0x000324C0', () => {
      const report = makeMockLayoutReport();
      const cand = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x000324C0',
        byteStart: 0x324c0,
        byteStartHex: '0x000324C0',
        length: 2,
        researchScore: 40,
        zeroShiftKanoCompatible: false,
        objectNumber: 1,
        externalOccurrenceCount: 21,
        externalByRepresentation: {
          'linear-structure-address': 20,
          'object-relative-payload': 1,
          'physical-structure-start': 0,
          'physical-payload-start': 0,
          'object-relative-structure': 0,
          'linear-payload-address': 0,
        },
      });

      const b1Result = makeMockB1Result([cand]);

      const result = executePaletteCandidateEvidenceFusion(report, b1Result);
      const profile = result.candidateProfiles[0];

      expect(profile.candidateId).toBe('MK1.EXE:0x000324C0');
      expect(profile.intrinsic.isVeryShortCandidate).toBe(true);
      expect(profile.intrinsic.zeroShiftKanoCompatible).toBe(false);
      expect(profile.topology.targetInExecutableObject).toBe(true);

      // Exact reference & profile
      expect(profile.exactReference.externalOccurrenceCount).toBe(21);
      expect(profile.exactReference.addressDerivedReferenceCount).toBe(21);
      expect(profile.exactReference.physicalDerivedReferenceCount).toBe(0);
      expect(profile.exactReference.referenceProfile).toBe('address-derived-only');
      expect(profile.exactReference.addressDerivedReferenceFraction).toBe(1.0);
      expect(profile.exactReference.physicalDerivedReferenceFraction).toBe(0.0);

      // Tension flags
      expect(profile.tensionFlags.referenceActiveIntrinsicWeak).toBe(true);
      expect(profile.tensionFlags.shortCandidateAddressActive).toBe(true);
      expect(profile.tensionFlags.executableTargetAddressActive).toBe(true);
      expect(profile.tensionFlags.referenceActiveKanoCompatible).toBe(false);
      expect(profile.tensionFlags.strongCatalogueNoReference).toBe(false);
    });

    it('accurately preserves reference-negative candidate 0x0009C914 without penalizing palette validity', () => {
      const report = makeMockLayoutReport();
      const cand = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x0009C914',
        byteStart: 0x9c914,
        byteStartHex: '0x0009C914',
        length: 32,
        researchScore: 80,
        zeroShiftKanoCompatible: true,
        objectNumber: 2,
        targetRegionId: 'obj2-rw',
        externalOccurrenceCount: 0,
        externalByRepresentation: {
          'linear-structure-address': 0,
          'object-relative-payload': 0,
          'physical-structure-start': 0,
          'physical-payload-start': 0,
          'object-relative-structure': 0,
          'linear-payload-address': 0,
        },
      });

      const b1Result = makeMockB1Result([cand]);

      const result = executePaletteCandidateEvidenceFusion(report, b1Result);
      const profile = result.candidateProfiles[0];

      expect(profile.candidateId).toBe('MK1.EXE:0x0009C914');
      expect(profile.intrinsic.zeroShiftKanoCompatible).toBe(true);
      expect(profile.provenance.researchScore).toBe(80);
      expect(profile.exactReference.externalOccurrenceCount).toBe(0);
      expect(profile.exactReference.referenceProfile).toBe('no-external-reference');
      expect(profile.exactReference.addressDerivedReferenceFraction).toBeNull();
      expect(profile.exactReference.physicalDerivedReferenceFraction).toBeNull();

      // Tension flags
      expect(profile.tensionFlags.referenceInactiveKanoCompatible).toBe(true);
      expect(profile.tensionFlags.strongCatalogueNoReference).toBe(true);
      expect(profile.tensionFlags.referenceActiveIntrinsicWeak).toBe(false);
      expect(profile.tensionFlags.referenceActiveKanoCompatible).toBe(false);
    });
  });

  describe('Downstream Structure Participation & Null vs Zero (Sections 19-23, 54)', () => {
    it('correctly tracks structure depth and preserves null when upstream passes were not executed', () => {
      const report = makeMockLayoutReport();
      const cand = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x000324C0',
        externalOccurrenceCount: 10,
      });

      const b1Result = makeMockB1Result([cand]);

      // Execute without B.2 - B.5
      const resultNoUpstream = executePaletteCandidateEvidenceFusion(
        report,
        b1Result,
        null,
        null,
        null,
        null,
        null
      );
      const profile = resultNoUpstream.candidateProfiles[0];

      expect(profile.structureDepth).toBe('b1-external-reference');
      expect(profile.b2Context).toBeNull();
      expect(profile.b3Structure).toBeNull();
      expect(profile.b4Cycle).toBeNull();
      expect(profile.b5Harmonic).toBeNull();
      expect(resultNoUpstream.upstreamAvailability.b2Available).toBe(false);
      expect(resultNoUpstream.upstreamAvailability.b5Available).toBe(false);
    });

    it('correctly advances structure depth to b5-harmonic-structure when candidate participates in B.5', () => {
      const report = makeMockLayoutReport();
      const cand = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x000324C0',
        externalOccurrenceCount: 21,
      });

      const b1Result = makeMockB1Result([cand]);

      const mockB5Result = makeMockB5Result([
        {
          populationId: 'phys_pop_001',
          sourceRegionId: 'obj1-rx',
          sourceRegionClass: 'object-mapped-le',
          sourceObjectNumber: 1,
          cycleSpan: 36,
          cycleBlockCount: 3,
          cycleAnchors: [],
          cycleAnchorsHex: [],
          candidateIds: ['MK1.EXE:0x000324C0'],
          representationKinds: ['linear-structure-address'],
          sourceClusterIds: [],
          sourceRepeatedTargetGroupIds: [],
          B3PrimaryMotif: null,
          B3OccurrenceSlots: [],
          B4TopPeriodCandidates: [18, 9],
          absoluteCycleOffsetRecurrence: {
            rawComparableSampleCount: 100,
            rawDominantSampleCount: 90,
            rawDominantAgreementPercentage: 90.0,
            contextComparableSampleCount: 100,
            contextDominantSampleCount: 90,
            contextDominantAgreementPercentage: 90.0,
            contextStableOffsetCount: 30,
            contextComparableOffsetCount: 36,
            contextStableOffsetPercentage: 83.3,
            cycleBlockCount: 3,
            maskedSampleCount: 0,
          },
          phaseAggregateInvariantAcrossPeriods: true,
          maxPhaseAggregateDifference: 0,
          periodsViolatingInvariant: [],
          periodPhaseAnalyses: [
            {
              periodBytes: 18,
              phaseCount: 2,
              cycleBlockCount: 3,
              b4PooledContextDominantAgreementPercentage: 88.1,
              phaseAlignedRawComparableSampleCount: 0,
              phaseAlignedRawDominantSampleCount: 0,
              phaseAlignedRawDominantAgreementPercentage: 0,
              phaseAlignedContextComparableSampleCount: 0,
              phaseAlignedContextDominantSampleCount: 0,
              phaseAlignedContextDominantAgreementPercentage: 90.5,
              phaseAlignedContextStableCellCount: 0,
              phaseAlignedContextComparableCellCount: 0,
              phaseAlignedContextStableCellPercentage: 0,
              phaseAlignmentGainPercentagePoints: 0,
              hasPhaseLockedVariation: false,
              hasStrongPhaseAlignedRecurrence: true,
              pooledMixingPenaltyPercentagePoints: 2.4,
              hasPooledPhaseMixingPenalty: true,
              phaseSummaries: [],
              phaseSignatureSequence: [],
              phaseSignatureGroups: [],
              exactRepeatingPhaseSignatureMotif: null,
              evidenceBearingExactRepeatingPhaseSignatureMotif: null,
              exactPhaseSignatureMotifEvidenceStatus: 'not-applicable-all-masked',
              primaryOccurrenceGeometry: [],
              primaryOccurrencesShareLaneAcrossDistinctPhases: false,
              primaryOccurrencesSharePhaseDifferentLanes: false,
              b1PhaseLaneOccupancy: {
                occupiedPhaseIndices: [0],
                occupiedPhaseCount: 1,
                occupiedLaneOffsets: [0],
                occupiedLaneCount: 1,
                phaseLaneOccupancyMatrix: [],
                candidateIdHistogramByPhaseLane: {},
                representationHistogramByPhaseLane: {},
                targetRegionHistogramByPhaseLane: {},
                targetObjectHistogramByPhaseLane: {},
              },
            },
          ],
          harmonicRelationships: [
            {
              lowerPeriodBytes: 9,
              higherPeriodBytes: 18,
              ratio: 2,
              lowerSubunitsPerHigherSubunit: 2,
              lowerB4PooledAgreement: 83.3,
              higherB4PooledAgreement: 88.1,
              lowerPhaseAlignedAgreement: 90.5,
              higherPhaseAlignedAgreement: 90.5,
              lowerPhaseAlignmentGain: 7.1,
              higherPhaseAlignmentGain: 2.4,
              higherPooledAdvantageOverLowerPooled: 4.8,
              higherPhaseAlignedAdvantageOverLowerPhaseAligned: 0,
              lowerPhaseAlignedAtLeastHigherPooled: true,
              lowerPhaseAlignedAtLeastHigherPhaseAligned: true,
              groupingMap: [],
              roleRecurrenceThreshold: 75,
              roleRecurrenceStatus: 'confirmed-recurrence',
              rolesTotal: 2,
              rolesWithCrossHigherPhaseEvidence: 2,
              rolesWithoutCrossHigherPhaseEvidence: 0,
              lowerRoleContextComparableSampleCount: 60,
              lowerRoleContextDominantSampleCount: 50,
              lowerRoleContextDominantAgreementPercentage: 83.3,
              lowerRoleStableLaneCount: 8,
              lowerRoleComparableLaneCount: 10,
              lowerRoleStableLanePercentage: 80.0,
              lowerRoleRecurrenceAtLeastLowerPooled: true,
              lowerRoleRecurrenceAtLeastHigherPooled: false,
              crossHigherRoleComparableSampleCount: 60,
              crossHigherRoleDominantSampleCount: 50,
              crossHigherRoleDominantAgreementPercentage: 83.33333333333334,
              crossHigherRoleComparableLaneCount: 10,
              crossHigherRoleStableLaneCount: 8,
              crossHigherRoleStableLanePercentage: 80.0,
              rolesWithCrossHigherComparableLanes: 2,
              rolesWithoutCrossHigherComparableLanes: 0,
              crossHigherRoleRecurrenceAtLeastLowerPooled: true,
              crossHigherRoleRecurrenceAtLeastHigherPooled: false,
              allRolesExactContextSignatureMatchAcrossHigherPhases: true,
              roleSummaries: [],
            },
          ],
          b1OccurrencePositionsInsideCycles: [],
          b1OccurrencePositionsInsideCyclesHex: [],
        },
      ]);

      const result = executePaletteCandidateEvidenceFusion(
        report,
        b1Result,
        null,
        null,
        null,
        null,
        mockB5Result
      );

      const profile = result.candidateProfiles[0];
      expect(profile.structureDepth).toBe('b5-harmonic-structure');
      expect(profile.mechanicalFlags.hasStructuredReferenceEvidence).toBe(true);
      expect(profile.mechanicalFlags.hasB5HarmonicEvidence).toBe(true);
      expect(profile.b5Harmonic?.populationParticipationCount).toBe(1);
      expect(profile.b5Harmonic?.harmonicRelationshipsCount).toBe(1);
      expect(profile.b5Harmonic?.confirmedRecurrenceRelationshipsCount).toBe(1);
      expect(profile.b5Harmonic?.maxCanonicalCrossHigherRecurrence).toBeCloseTo(83.333, 2);
    });
  });

  describe('Compact Export Schema (Section 48)', () => {
    it('creates schema-compliant mk1_palette_candidate_evidence_fusion_v1 export', () => {
      const report = makeMockLayoutReport();
      const cand = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x000324C0',
      });

      const b1Result = makeMockB1Result([cand]);

      const cat = makeMockCatalogueCandidate(cand);
      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat]);
      const exportJson = createMK1CompactCandidateEvidenceFusionExport(result);

      expect(exportJson.format).toBe('mk1_palette_candidate_evidence_fusion_v1');
      expect(['1E.2B.6', '1E.2B.6a', '1E.2B.6b']).toContain(exportJson.metadata.milestone);
      expect(exportJson.status).toBe('PARTIAL');
      expect(exportJson.fixture.exeSize).toBe(1157222);
      expect(exportJson.candidateProfiles.length).toBe(1);
      expect(exportJson.interpretationCaveats.length).toBe(5);
      expect(exportJson.interpretationCaveats[0]).toContain('REFERENCE ACTIVITY != PALETTE VALIDITY');
    });
  });

  describe('Full Exemplar Suite & Cohort Partition Consistency (Sections 29-42)', () => {
    it('accurately distinguishes all 7 key research exemplars and satisfies cohort partition arithmetic', () => {
      const report = makeMockLayoutReport();

      // Exemplar 1: 0x000324C0 (length 2, score 40, zeroShift false, Object 1, 21 ext refs, linear struct 20, obj-rel payload 1)
      const ex1 = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x000324C0',
        byteStart: 0x324c0,
        byteStartHex: '0x000324C0',
        length: 2,
        researchScore: 40,
        zeroShiftKanoCompatible: false,
        objectNumber: 1,
        targetRegionId: 'obj1-rx',
        externalOccurrenceCount: 21,
        externalByRepresentation: {
          'linear-structure-address': 20,
          'object-relative-payload': 1,
          'physical-structure-start': 0,
          'physical-payload-start': 0,
          'object-relative-structure': 0,
          'linear-payload-address': 0,
        },
      });

      // Exemplar 2: 0x0002C3FE (length 2, score 40, zeroShift false, Object 1, 86 ext refs, obj-rel payload 75)
      const ex2 = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x0002C3FE',
        byteStart: 0x2c3fe,
        byteStartHex: '0x0002C3FE',
        length: 2,
        researchScore: 40,
        zeroShiftKanoCompatible: false,
        objectNumber: 1,
        targetRegionId: 'obj1-rx',
        externalOccurrenceCount: 86,
        externalByRepresentation: {
          'linear-structure-address': 0,
          'object-relative-payload': 75,
          'physical-structure-start': 0,
          'physical-payload-start': 0,
          'object-relative-structure': 11,
          'linear-payload-address': 0,
        },
      });

      // Exemplar 3: 0x00031AD0 (length 2, score 40, zeroShift false, Object 1, 10 ext refs)
      const ex3 = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x00031AD0',
        byteStart: 0x31ad0,
        byteStartHex: '0x00031AD0',
        length: 2,
        researchScore: 40,
        zeroShiftKanoCompatible: false,
        objectNumber: 1,
        targetRegionId: 'obj1-rx',
        externalOccurrenceCount: 10,
        externalByRepresentation: {
          'linear-structure-address': 10,
          'object-relative-payload': 0,
          'physical-structure-start': 0,
          'physical-payload-start': 0,
          'object-relative-structure': 0,
          'linear-payload-address': 0,
        },
      });

      // Exemplar 4: 0x000917FE (length 44, score 50, zeroShift true, Object 2, 12 ext refs)
      const ex4 = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x000917FE',
        byteStart: 0x917fe,
        byteStartHex: '0x000917FE',
        length: 44,
        researchScore: 50,
        zeroShiftKanoCompatible: true,
        objectNumber: 2,
        targetRegionId: 'obj2-rw',
        externalOccurrenceCount: 12,
        externalByRepresentation: {
          'linear-structure-address': 12,
          'object-relative-payload': 0,
          'physical-structure-start': 0,
          'physical-payload-start': 0,
          'object-relative-structure': 0,
          'linear-payload-address': 0,
        },
      });

      // Exemplar 5: 0x00091200 (length 24, score 65, zeroShift true, Object 2, 8 ext refs)
      const ex5 = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x00091200',
        byteStart: 0x91200,
        byteStartHex: '0x00091200',
        length: 24,
        researchScore: 65,
        zeroShiftKanoCompatible: true,
        objectNumber: 2,
        targetRegionId: 'obj2-rw',
        externalOccurrenceCount: 8,
        externalByRepresentation: {
          'linear-structure-address': 8,
          'object-relative-payload': 0,
          'physical-structure-start': 0,
          'physical-payload-start': 0,
          'object-relative-structure': 0,
          'linear-payload-address': 0,
        },
      });

      // Exemplar 6: 0x00091000 (length 24, score 55, zeroShift true, Object 2, 8 ext refs)
      const ex6 = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x00091000',
        byteStart: 0x91000,
        byteStartHex: '0x00091000',
        length: 24,
        researchScore: 55,
        zeroShiftKanoCompatible: true,
        objectNumber: 2,
        targetRegionId: 'obj2-rw',
        externalOccurrenceCount: 8,
        externalByRepresentation: {
          'linear-structure-address': 8,
          'object-relative-payload': 0,
          'physical-structure-start': 0,
          'physical-payload-start': 0,
          'object-relative-structure': 0,
          'linear-payload-address': 0,
        },
      });

      // Exemplar 7: 0x0009C914 (length 32, score 80, zeroShift true, Object 2, 0 ext refs, negative control)
      const ex7 = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x0009C914',
        byteStart: 0x9c914,
        byteStartHex: '0x0009C914',
        length: 32,
        researchScore: 80,
        zeroShiftKanoCompatible: true,
        objectNumber: 2,
        targetRegionId: 'obj2-rw',
        externalOccurrenceCount: 0,
        externalByRepresentation: {
          'linear-structure-address': 0,
          'object-relative-payload': 0,
          'physical-structure-start': 0,
          'physical-payload-start': 0,
          'object-relative-structure': 0,
          'linear-payload-address': 0,
        },
      });

      const all7 = [ex1, ex2, ex3, ex4, ex5, ex6, ex7];
      const b1Result = makeMockB1Result(all7);

      const result = executePaletteCandidateEvidenceFusion(report, b1Result);
      expect(result.candidateProfiles.length).toBe(7);

      // Verify partition arithmetic:
      // kano_noRef + kano_ref + notKano_noRef + notKano_ref == total
      const cs = result.globalCohortSummary;
      const totalPartition =
        cs.kanoCompatible_noExternalReference +
        cs.kanoCompatible_externalReference +
        cs.notKanoCompatible_noExternalReference +
        cs.notKanoCompatible_externalReference;
      expect(totalPartition).toBe(7);

      // Breakdown of our 7:
      // Kano-compatible: ex4, ex5, ex6 (with ext refs = 3), ex7 (no ext ref = 1).
      // Not Kano-compatible: ex1, ex2, ex3 (all 3 have ext refs).
      expect(cs.kanoCompatible_noExternalReference).toBe(1); // ex7
      expect(cs.kanoCompatible_externalReference).toBe(3); // ex4, ex5, ex6
      expect(cs.notKanoCompatible_noExternalReference).toBe(0);
      expect(cs.notKanoCompatible_externalReference).toBe(3); // ex1, ex2, ex3

      expect(cs.veryShort_externalReference).toBe(3); // ex1, ex2, ex3
      expect(cs.veryShort_addressDerivedReference).toBe(3);
      expect(cs.object1Target_externalReference).toBe(3); // ex1, ex2, ex3
      expect(cs.object2Target_externalReference).toBe(3); // ex4, ex5, ex6
      expect(cs.object1Target_kanoCompatible).toBe(0);
      expect(cs.object2Target_kanoCompatible).toBe(4); // ex4, ex5, ex6, ex7

      // Verify each individual exemplar's profile
      const p1 = result.candidateProfiles.find((p) => p.candidateId === 'MK1.EXE:0x000324C0')!;
      expect(p1.tensionFlags.referenceActiveIntrinsicWeak).toBe(true);
      expect(p1.tensionFlags.shortCandidateAddressActive).toBe(true);

      const p2 = result.candidateProfiles.find((p) => p.candidateId === 'MK1.EXE:0x0002C3FE')!;
      expect(p2.exactReference.externalOccurrenceCount).toBe(86);
      expect(p2.exactReference.externalByRepresentation['object-relative-payload']).toBe(75);

      const p7 = result.candidateProfiles.find((p) => p.candidateId === 'MK1.EXE:0x0009C914')!;
      expect(p7.exactReference.externalOccurrenceCount).toBe(0);
      expect(p7.tensionFlags.strongCatalogueNoReference).toBe(true);
      expect(p7.tensionFlags.referenceInactiveKanoCompatible).toBe(true);

      // Check Length Histograms
      const hist = result.lengthHistograms;
      expect(hist.allCandidates.totalCount).toBe(7);
      expect(hist.allCandidates.bucketCounts['2']).toBe(3); // ex1, ex2, ex3
      expect(hist.allCandidates.bucketCounts['24-31']).toBe(2); // ex5, ex6 (len 24)
      expect(hist.allCandidates.bucketCounts['32-63']).toBe(2); // ex4 (44), ex7 (32)
      expect(hist.noReferenceCandidates.bucketCounts['32-63']).toBe(1); // ex7
      expect(hist.kanoCompatibleCandidates.totalCount).toBe(4); // ex4, ex5, ex6, ex7
    });
  });

  describe('Pass 1E.2B.6a — Catalogue Join, Reconciliation Hardening & Correct Calculations', () => {
    const report = makeMockLayoutReport();

    it('1. rejects when catalogue candidates are missing completely (status: FAILED)', () => {
      const cand = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0' });
      const b1Result = makeMockB1Result([cand]);
      const result = executePaletteCandidateEvidenceFusion(report, b1Result, null);

      expect(result.status).toBe('FAILED');
      expect(result.failureReason).toContain('Catalogue evidence is mandatory');
      expect(result.reconciliation.allCandidatesAccountedFor).toBe(false);
      expect(result.upstreamAvailability.catalogueAvailable).toBe(false);
      expect(result.upstreamAvailability.catalogueResearchCandidatesCount).toBeNull();
    });

    it('2. succeeds and reports 1:1 reconciliation when catalogue matches B.1', () => {
      const cand = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0' });
      const b1Result = makeMockB1Result([cand]);
      const cat = makeMockCatalogueCandidate(cand);
      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat]);

      expect(result.status).toBe('PARTIAL');
      expect(result.failureReason).toBeUndefined();
      expect(result.reconciliation.allCandidatesAccountedFor).toBe(true);
      expect(result.reconciliation.researchCandidatesInput).toBe(1);
      expect(result.reconciliation.b1CandidateSummariesInput).toBe(1);
      expect(result.reconciliation.candidateProfilesProduced).toBe(1);
      expect(result.reconciliation.candidateProfilesMissingCatalogueEvidence).toHaveLength(0);
      expect(result.reconciliation.candidateProfilesMissingB1Evidence).toHaveLength(0);
      expect(result.reconciliation.catalogueB1FieldMismatchIds).toHaveLength(0);
      expect(result.reconciliation.duplicateCandidateIds).toHaveLength(0);
      expect(result.upstreamAvailability.catalogueAvailable).toBe(true);
    });

    it('3. detects duplicate candidate IDs in catalogue (status: FAILED)', () => {
      const cand = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0' });
      const b1Result = makeMockB1Result([cand]);
      const cat1 = makeMockCatalogueCandidate(cand);
      const cat2 = makeMockCatalogueCandidate(cand);
      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat1, cat2]);

      expect(result.status).toBe('FAILED');
      expect(result.reconciliation.allCandidatesAccountedFor).toBe(false);
      expect(result.reconciliation.duplicateCatalogueCandidateIds).toContain('MK1.EXE:0x000324C0');
      expect(result.reconciliation.duplicateCandidateIds).toContain('MK1.EXE:0x000324C0');
      expect(result.failureReason).toContain('duplicate catalogue IDs');
    });

    it('4. detects duplicate candidate IDs in B.1 summaries (status: FAILED)', () => {
      const cand1 = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0' });
      const cand2 = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0' });
      const b1Result = makeMockB1Result([cand1, cand2]);
      const cat = makeMockCatalogueCandidate(cand1);
      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat]);

      expect(result.status).toBe('FAILED');
      expect(result.reconciliation.allCandidatesAccountedFor).toBe(false);
      expect(result.reconciliation.duplicateB1CandidateIds).toContain('MK1.EXE:0x000324C0');
      expect(result.reconciliation.duplicateCandidateIds).toContain('MK1.EXE:0x000324C0');
      expect(result.failureReason).toContain('duplicate B.1 IDs');
    });

    it('5. detects candidate profiles missing catalogue evidence (status: FAILED)', () => {
      const cand1 = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0' });
      const cand2 = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x0009C914' });
      const b1Result = makeMockB1Result([cand1, cand2]);
      const cat1 = makeMockCatalogueCandidate(cand1);
      // cat2 is omitted from catalogue
      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat1]);

      expect(result.status).toBe('FAILED');
      expect(result.reconciliation.allCandidatesAccountedFor).toBe(false);
      expect(result.reconciliation.candidateProfilesMissingCatalogueEvidence).toContain('MK1.EXE:0x0009C914');
      expect(result.failureReason).toContain('missing catalogue evidence');
    });

    it('6. detects catalogue candidates missing B.1 evidence (status: FAILED)', () => {
      const cand1 = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0' });
      const cand2 = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x0009C914' });
      const b1Result = makeMockB1Result([cand1]);
      const cat1 = makeMockCatalogueCandidate(cand1);
      const cat2 = makeMockCatalogueCandidate(cand2);
      // cand2 exists in catalogue but not in B.1
      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat1, cat2]);

      expect(result.status).toBe('FAILED');
      expect(result.reconciliation.allCandidatesAccountedFor).toBe(false);
      expect(result.reconciliation.candidateProfilesMissingB1Evidence).toContain('MK1.EXE:0x0009C914');
      expect(result.failureReason).toContain('missing B.1 evidence');
    });

    it('7. detects byteStart mismatch between catalogue and B.1 (status: FAILED)', () => {
      const cand = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0', byteStart: 0x324c0 });
      const b1Result = makeMockB1Result([cand]);
      const cat = makeMockCatalogueCandidate(cand);
      cat.byteStart = 0x324c2; // Mismatch

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat]);
      expect(result.status).toBe('FAILED');
      expect(result.reconciliation.allCandidatesAccountedFor).toBe(false);
      expect(result.reconciliation.catalogueB1FieldMismatchIds).toHaveLength(1);
      expect(result.reconciliation.catalogueB1FieldMismatchIds[0].candidateId).toBe('MK1.EXE:0x000324C0');
      expect(result.reconciliation.catalogueB1FieldMismatchIds[0].mismatchedFields).toContain('byteStart');
      expect(result.failureReason).toContain('field mismatches');
    });

    it('8. detects byteEnd mismatch between catalogue and B.1 (status: FAILED)', () => {
      const cand = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0', byteEnd: 0x324c6 });
      const b1Result = makeMockB1Result([cand]);
      const cat = makeMockCatalogueCandidate(cand);
      cat.byteEnd = 0x324c8; // Mismatch

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat]);
      expect(result.status).toBe('FAILED');
      expect(result.reconciliation.catalogueB1FieldMismatchIds).toHaveLength(1);
      expect(result.reconciliation.catalogueB1FieldMismatchIds[0].mismatchedFields).toContain('byteEnd');
    });

    it('9. detects length mismatch between catalogue and B.1 (status: FAILED)', () => {
      const cand = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0', length: 2 });
      const b1Result = makeMockB1Result([cand]);
      const cat = makeMockCatalogueCandidate(cand);
      cat.length = 3; // Mismatch

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat]);
      expect(result.status).toBe('FAILED');
      expect(result.reconciliation.catalogueB1FieldMismatchIds).toHaveLength(1);
      expect(result.reconciliation.catalogueB1FieldMismatchIds[0].mismatchedFields).toContain('length');
    });

    it('10. detects contentHash mismatch between catalogue and B.1 (status: FAILED)', () => {
      const cand = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0', contentHash: 'hashA' });
      const b1Result = makeMockB1Result([cand]);
      const cat = makeMockCatalogueCandidate(cand);
      cat.contentHash = 'hashB'; // Mismatch

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat]);
      expect(result.status).toBe('FAILED');
      expect(result.reconciliation.catalogueB1FieldMismatchIds).toHaveLength(1);
      expect(result.reconciliation.catalogueB1FieldMismatchIds[0].mismatchedFields).toContain('contentHash');
    });

    it('11. detects multiple field mismatches on a single candidate', () => {
      const cand = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x000324C0',
        byteStart: 0x324c0,
        byteEnd: 0x324c6,
        length: 2,
        contentHash: 'hashA',
      });
      const b1Result = makeMockB1Result([cand]);
      const cat = makeMockCatalogueCandidate(cand);
      cat.byteStart = 0x32400;
      cat.byteEnd = 0x32500;
      cat.length = 126;
      cat.contentHash = 'hashZ';

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat]);
      expect(result.status).toBe('FAILED');
      const mismatch = result.reconciliation.catalogueB1FieldMismatchIds[0];
      expect(mismatch.mismatchedFields).toEqual(['byteStart', 'byteEnd', 'length', 'contentHash']);
    });

    it('12. detects unexpected upstream candidate IDs in contextResult (B.2)', () => {
      const cand = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0' });
      const b1Result = makeMockB1Result([cand]);
      const cat = makeMockCatalogueCandidate(cand);

      const mockB2 = {
        metadata: { formatVersion: 'mk1_palette_occurrence_context_v1' },
        trackB: { clusters: [{ clusterId: 'c1', candidateIds: ['MK1.EXE:UNKNOWN_GHOST'] }] },
      } as unknown as MK1PaletteOccurrenceContextResult;

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat], mockB2);
      expect(result.status).toBe('FAILED');
      expect(result.reconciliation.unexpectedUpstreamCandidateIds).toContain('MK1.EXE:UNKNOWN_GHOST');
      expect(result.failureReason).toContain('unexpected upstream candidate IDs');
    });

    it('13. detects unexpected upstream candidate IDs in repeatedStructureResult (B.3)', () => {
      const cand = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0' });
      const b1Result = makeMockB1Result([cand]);
      const cat = makeMockCatalogueCandidate(cand);

      const mockB3 = {
        metadata: { formatVersion: 'mk1_palette_repeated_structure_v1' },
        repeatedTargetGroupSummaries: [{ groupId: 'g1', candidateId: 'MK1.EXE:GHOST_B3' }],
      } as unknown as MK1PaletteRepeatedStructureResult;

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat], null, mockB3);
      expect(result.status).toBe('FAILED');
      expect(result.reconciliation.unexpectedUpstreamCandidateIds).toContain('MK1.EXE:GHOST_B3');
    });

    it('14. detects unexpected upstream candidate IDs in cycleLayoutResult (B.4)', () => {
      const cand = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0' });
      const b1Result = makeMockB1Result([cand]);
      const cat = makeMockCatalogueCandidate(cand);

      const mockB4 = {
        metadata: { formatVersion: 'mk1_palette_cycle_layout_v1' },
        crossPopulationCandidateGroups: [{ groupId: 'g1', candidateId: 'MK1.EXE:GHOST_B4' }],
        physicalCyclePopulations: [],
      } as unknown as MK1PaletteCycleLayoutResult;

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat], null, null, mockB4);
      expect(result.status).toBe('FAILED');
      expect(result.reconciliation.unexpectedUpstreamCandidateIds).toContain('MK1.EXE:GHOST_B4');
    });

    it('15. detects unexpected upstream candidate IDs in phaseHarmonicResult (B.5)', () => {
      const cand = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0' });
      const b1Result = makeMockB1Result([cand]);
      const cat = makeMockCatalogueCandidate(cand);

      const mockB5 = {
        metadata: { formatVersion: 'mk1_palette_phase_harmonic_v1' },
        physicalPopulationPhaseAnalyses: [{ populationId: 'p1', candidateIds: ['MK1.EXE:GHOST_B5'] }],
      } as unknown as MK1PalettePhaseHarmonicResult;

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat], null, null, null, mockB5);
      expect(result.status).toBe('FAILED');
      expect(result.reconciliation.unexpectedUpstreamCandidateIds).toContain('MK1.EXE:GHOST_B5');
    });

    it('16. computes structureByteLength = 2 + (length * 2) and payloadByteLength = length * 2 accurately', () => {
      const cand2 = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0', length: 2 });
      const cand32 = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x0009C914', length: 32 });
      const b1Result = makeMockB1Result([cand2, cand32]);
      const cat2 = makeMockCatalogueCandidate(cand2);
      const cat32 = makeMockCatalogueCandidate(cand32);

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat2, cat32]);
      expect(result.status).toBe('PARTIAL');

      const p2 = result.candidateProfiles.find((p) => p.candidateId === 'MK1.EXE:0x000324C0')!;
      expect(p2.intrinsic.payloadByteLength).toBe(4); // 2 * 2
      expect(p2.intrinsic.structureByteLength).toBe(6); // 2 + 4

      const p32 = result.candidateProfiles.find((p) => p.candidateId === 'MK1.EXE:0x0009C914')!;
      expect(p32.intrinsic.payloadByteLength).toBe(64); // 32 * 2
      expect(p32.intrinsic.structureByteLength).toBe(66); // 2 + 64
    });

    it('17. correctly evaluates targetFileBacked and targetInLEObjectFileBackedData based on regionClass', () => {
      const candInObject1 = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x000324C0',
        byteStart: 0x324c0,
        byteEnd: 0x324c6,
        targetRegionId: 'obj1-rx',
      });
      const b1Result = makeMockB1Result([candInObject1]);
      const cat = makeMockCatalogueCandidate(candInObject1);

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat]);
      const profile = result.candidateProfiles[0];

      expect(profile.topology.targetRegionClass).toBe('le-object-file-backed');
      expect(profile.topology.targetInLEObjectFileBackedData).toBe(true);
      expect(profile.topology.targetFileBacked).toBe(true);
      expect(profile.topology.targetInPhysicalPagePadding).toBe(false);
      expect(profile.topology.targetInPostModuleTail).toBe(false);
    });

    it('18. correctly calculates B.4 notablePeriodCounts as count of periods with hasNotableContextPeriodicity', () => {
      const cand = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0' });
      const b1Result = makeMockB1Result([cand]);
      const cat = makeMockCatalogueCandidate(cand);

      const mockB4 = {
        metadata: { formatVersion: 'mk1_palette_cycle_layout_v1' },
        targetParticipationSummaries: [
          {
            targetId: 'MK1.EXE:0x000324C0',
            participatingPopulationIds: ['pop-1'],
          },
        ],
        physicalCyclePopulations: [
          {
            populationId: 'pop-1',
            candidateIds: ['MK1.EXE:0x000324C0'],
            testedPeriods: [
              { periodBytes: 16, hasNotableContextPeriodicity: true },
              { periodBytes: 32, hasNotableContextPeriodicity: false },
              { periodBytes: 48, hasNotableContextPeriodicity: true },
            ],
          },
        ],
      } as unknown as MK1PaletteCycleLayoutResult;

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat], null, null, mockB4);
      expect(result.status).toBe('PARTIAL');
      const profile = result.candidateProfiles[0];
      expect(profile.b4Cycle).not.toBeNull();
      expect(profile.b4Cycle!.testedPeriodCounts).toEqual([3]);
      expect(profile.b4Cycle!.notablePeriodCounts).toEqual([2]); // 2 true, 1 false
    });

    it('19. correctly calculates sameContentResearchCandidateCount and isContentDuplicate', () => {
      const cand1 = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x00010000',
        contentHash: 'duplicate-hash-1',
      });
      const cand2 = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x00020000',
        contentHash: 'duplicate-hash-1',
      });
      const b1Result = makeMockB1Result([cand1, cand2]);
      const cat1 = makeMockCatalogueCandidate(cand1);
      const cat2 = makeMockCatalogueCandidate(cand2);
      cat2.duplicateContentOf = 'MK1.EXE:0x00010000';

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat1, cat2]);
      expect(result.status).toBe('PARTIAL');

      const p1 = result.candidateProfiles.find((p) => p.candidateId === 'MK1.EXE:0x00010000')!;
      expect(p1.provenance.sameContentResearchCandidateCount).toBe(2);
      expect(p1.provenance.isContentDuplicate).toBe(false);

      const p2 = result.candidateProfiles.find((p) => p.candidateId === 'MK1.EXE:0x00020000')!;
      expect(p2.provenance.sameContentResearchCandidateCount).toBe(2);
      expect(p2.provenance.isContentDuplicate).toBe(true);
      expect(p2.provenance.duplicateContentOf).toBe('MK1.EXE:0x00010000');
    });

    it('20. controls audit detects ID and physical offset collisions with control targets', () => {
      const cand = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x000A7464', // Same as control name
        byteStart: 0xa7460,
        byteEnd: 0xa7470,
      });
      const b1Result = makeMockB1Result([cand], [
        {
          name: 'MK1.EXE:0x000A7464',
          physicalOffset: 0xa7464, // Overlaps cand byteStart..byteEnd
          physicalOffsetHex: '0x000A7464',
          representationsTested: [],
          totalLogicalMatches: 0,
          uniquePhysicalOccurrences: 0,
          externalOccurrences: 0,
          sourceRegionDistribution: {},
          occurrences: [],
        },
      ]);
      const cat = makeMockCatalogueCandidate(cand);

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat]);
      expect(result.status).toBe('FAILED');
      expect(result.controlsAudit.controlsExcludedFromProfiles).toBe(false);
      expect(result.controlsAudit.controlCandidateIdCollisions).toContain('MK1.EXE:0x000A7464');
      expect(result.controlsAudit.controlPhysicalOffsetCollisions).toContain(0xa7464);
      expect(result.failureReason).toContain('Controls collision detected');
    });

    it('21. creates compact export containing all 52 profile properties, status, and failureReason', () => {
      const cand = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0', length: 2 });
      const b1Result = makeMockB1Result([cand]);
      const cat = makeMockCatalogueCandidate(cand);

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat]);
      const exportJson = createMK1CompactCandidateEvidenceFusionExport(result);

      expect(exportJson.format).toBe('mk1_palette_candidate_evidence_fusion_v1');
      expect(exportJson.status).toBe('PARTIAL');
      expect(['1E.2B.6a', '1E.2B.6b']).toContain(exportJson.metadata.milestone);
      expect(exportJson.candidateProfiles).toHaveLength(1);

      const cp = exportJson.candidateProfiles[0];
      // Intrinsic & Lengths
      expect(cp.candidateId).toBe('MK1.EXE:0x000324C0');
      expect(cp.byteStartHex).toBe('0x000324C0');
      expect(cp.length).toBe(2);
      expect(cp.payloadByteLength).toBe(4);
      expect(cp.structureByteLength).toBe(6);
      // Provenance
      expect(cp.researchScore).toBe(40);
      expect(cp.tier).toBe('research');
      expect(cp.contentHash).toBeDefined();
      expect(cp.uniqueColorCount).toBe(2);
      expect(cp.uniqueColorRatio).toBe(1);
      expect(cp.textLikeScore).toBe(0);
      expect(cp.containsLikelyAsciiData).toBe(false);
      expect(cp.zeroShiftKanoCompatible).toBe(false);
      expect(cp.sameContentResearchCandidateCount).toBe(1);
      expect(cp.isContentDuplicate).toBe(false);
      // Topology
      expect(cp.targetRegionId).toBe('obj1-rx');
      expect(cp.targetRegionClass).toBe('le-object-file-backed');
      expect(cp.targetObjectNumber).toBe(1);
      expect(cp.targetObjectReadable).toBe(true);
      expect(cp.targetObjectWritable).toBe(false);
      expect(cp.targetObjectExecutable).toBe(true);
      expect(cp.targetInExecutableObject).toBe(true);
      expect(cp.targetInWritableObject).toBe(false);
      expect(cp.targetFileBacked).toBe(true);
      expect(cp.targetInLEObjectFileBackedData).toBe(true);
      expect(cp.targetInPhysicalPagePadding).toBe(false);
      expect(cp.targetInPostModuleTail).toBe(false);
      expect(cp.targetLoadedAddressHex).toBeDefined();
      expect(cp.targetLoadedPayloadAddressHex).toBeDefined();
      // References & flags
      expect(cp.externalOccurrenceCount).toBeDefined();
      expect(cp.externalByRepresentation).toBeDefined();
      expect(cp.externalBySourceRegion).toBeDefined();
      expect(cp.structureDepth).toBe('b1-external-reference');
      expect(cp.mechanicalFlags).toBeDefined();
      expect(cp.tensionFlags).toBeDefined();
    });

    it('22. returns SUCCESS when all B.2–B.5 upstream passes are present and reconciled', () => {
      const cand = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0', length: 2 });
      const b1Result = makeMockB1Result([cand]);
      const cat = makeMockCatalogueCandidate(cand);

      const mockB2 = {
        metadata: { formatVersion: 'mk1_palette_occurrence_context_v1' },
        candidateContextSummaries: [{ candidateId: 'MK1.EXE:0x000324C0', totalOccurrenceContexts: 1 }],
      } as unknown as MK1PaletteOccurrenceContextResult;

      const mockB3 = {
        metadata: { formatVersion: 'mk1_palette_repeated_structure_v1' },
        targetParticipationSummaries: [{ targetId: 'MK1.EXE:0x000324C0', participatingGroupIds: ['grp1'] }],
      } as unknown as MK1PaletteRepeatedStructureResult;

      const mockB4 = {
        metadata: { formatVersion: 'mk1_palette_cycle_layout_v1' },
        targetParticipationSummaries: [{ targetId: 'MK1.EXE:0x000324C0', participatingPopulationIds: ['pop1'] }],
      } as unknown as MK1PaletteCycleLayoutResult;

      const mockB5 = {
        metadata: { formatVersion: 'mk1_palette_phase_harmonic_v1' },
        targetParticipationSummaries: [{ targetId: 'MK1.EXE:0x000324C0', participatingPopulationIds: ['pop1'] }],
        physicalPopulationPhaseAnalyses: [
          {
            populationId: 'pop1',
            candidateIds: ['MK1.EXE:0x000324C0'],
          },
        ],
      } as unknown as MK1PalettePhaseHarmonicResult;

      const result = executePaletteCandidateEvidenceFusion(
        report,
        b1Result,
        [cat],
        mockB2,
        mockB3,
        mockB4,
        mockB5
      );

      expect(result.status).toBe('SUCCESS');
      expect(result.metadata.milestone).toBe('1E.2B.6b');
      expect(result.candidateProfiles[0].structureDepth).toBe('b5-harmonic-structure');
    });

    it('23. preserves null for missing intrinsic fields without fabricating fallback values', () => {
      const cand = makeMockCandidateSummary({ candidateId: 'MK1.EXE:0x000324C0', length: 16 });
      const b1Result = makeMockB1Result([cand]);
      const cat = makeMockCatalogueCandidate(cand);
      // Explicitly delete optional intrinsic fields to verify no fallback fabrication occurs
      delete (cat as { uniqueColorCount?: number }).uniqueColorCount;
      delete (cat as { uniqueColorRatio?: number }).uniqueColorRatio;
      delete (cat as { textLikeScore?: number }).textLikeScore;
      delete (cat as { containsLikelyAsciiData?: boolean }).containsLikelyAsciiData;

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat]);
      const profile = result.candidateProfiles[0];

      // Must be null, NOT fabricated from length (e.g. 16 or 1.0)
      expect(profile.intrinsic.uniqueColorCount).toBeNull();
      expect(profile.intrinsic.uniqueColorRatio).toBeNull();
      expect(profile.intrinsic.textLikeScore).toBeNull();
      expect(profile.intrinsic.containsLikelyAsciiData).toBeNull();
    });

    it('24. tests filterCandidateProfiles across criteria and combined logical AND composition', () => {
      const cand1 = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x00010000',
        length: 2,
        targetRegionId: 'obj1-rx',
        externalOccurrenceCount: 5,
        zeroShiftKanoCompatible: false,
        contentHash: 'hash-apple',
      });
      const cand2 = makeMockCandidateSummary({
        candidateId: 'MK1.EXE:0x00060300',
        byteStart: 0x60300,
        byteStartHex: '0x00060300',
        byteEnd: 0x60340,
        byteEndHex: '0x00060340',
        length: 32,
        targetRegionId: 'obj2-rw',
        objectNumber: 2,
        externalOccurrenceCount: 0,
        zeroShiftKanoCompatible: true,
        contentHash: 'hash-banana',
      });
      const b1Result = makeMockB1Result([cand1, cand2]);
      const cat1 = makeMockCatalogueCandidate(cand1);
      cat1.zeroShiftKanoCompatible = false;
      const cat2 = makeMockCatalogueCandidate(cand2);
      cat2.zeroShiftKanoCompatible = true;

      const result = executePaletteCandidateEvidenceFusion(report, b1Result, [cat1, cat2]);
      expect(result.candidateProfiles).toHaveLength(2);

      const profiles = result.candidateProfiles;

      // Kano filter
      expect(filterCandidateProfiles(profiles, { kanoCompatibility: 'yes' })).toHaveLength(1);
      expect(filterCandidateProfiles(profiles, { kanoCompatibility: 'no' })).toHaveLength(1);

      // External reference filter
      expect(filterCandidateProfiles(profiles, { externalReference: 'active' })).toHaveLength(1);
      expect(filterCandidateProfiles(profiles, { externalReference: 'none' })).toHaveLength(1);

      // Very short filter (length <= 3)
      expect(filterCandidateProfiles(profiles, { veryShort: 'yes' })).toHaveLength(1);
      expect(filterCandidateProfiles(profiles, { veryShort: 'no' })).toHaveLength(1);

      // Target region filter
      expect(filterCandidateProfiles(profiles, { targetRegion: 'obj1-rx' })).toHaveLength(1);
      expect(filterCandidateProfiles(profiles, { targetRegion: 'non-existent' })).toHaveLength(0);

      // Target object filter
      expect(filterCandidateProfiles(profiles, { targetObject: 'Object 1' })).toHaveLength(1);
      expect(filterCandidateProfiles(profiles, { targetObject: 'Object 2' })).toHaveLength(1);

      // Search by hash
      expect(filterCandidateProfiles(profiles, { searchTerm: 'banana' })).toHaveLength(1);
      expect(filterCandidateProfiles(profiles, { searchTerm: 'apple' })).toHaveLength(1);
      expect(filterCandidateProfiles(profiles, { searchTerm: '0x00010000' })).toHaveLength(1);

      // Combined AND: Kano 'yes' AND External 'active' -> neither satisfies both!
      expect(
        filterCandidateProfiles(profiles, {
          kanoCompatibility: 'yes',
          externalReference: 'active',
        })
      ).toHaveLength(0);

      // Combined AND: Kano 'no' AND External 'active' AND VeryShort 'yes' -> cand1 matches all 3
      expect(
        filterCandidateProfiles(profiles, {
          kanoCompatibility: 'no',
          externalReference: 'active',
          veryShort: 'yes',
        })
      ).toHaveLength(1);
    });
  });
});
