/**
 * MK1 Palette Cycle-Internal Layout Reconnaissance Types (Milestone 1E.2B.4)
 *
 * Models subunit periodicity (proper cycle divisors), byte lane consensus,
 * existing B.1 occurrence lane occupancy, and cross-population candidate-centric
 * structural convergence without semantic claims, record parsing, or pointer-table labels.
 *
 * Standing Epistemic Axiom:
 * PERIOD CANDIDATE != RECORD SIZE
 * REPEATED LANE OCCUPANCY != POINTER FIELD
 * CROSS-POPULATION SIMILARITY != SHARED SEMANTICS
 */

import { MK1ExecutableRegionClass } from './executableRegionTopology';
import {
  PaletteRepresentationKind,
  KnownAnchorControlRepresentation,
} from './paletteReferenceReconnaissanceTypes';
import {
  DeltaMotifAnalysis,
  ContextOnlyRepeatedBlockConsensus,
} from './paletteRepeatedStructureTypes';

export type B4Stage =
  | 'START B.4'
  | 'fixture verified'
  | 'B.1 completeness verified'
  | 'B.2 reconciliation verified'
  | 'B.3 reconciliation verified'
  | 'EXE bytes loaded'
  | 'B.3 repeated populations collected'
  | 'physical populations deduplicated'
  | 'period candidates generated'
  | 'subunit consensus complete'
  | 'B.1 lane occupancy complete'
  | 'cross-population comparison complete'
  | 'controls processed'
  | 'negative control derived'
  | 'reconciliation complete'
  | 'export constructed';

/**
 * Scan Configuration constants for Milestone 1E.2B.4 (Section 72)
 */
export interface CycleLayoutScanConfiguration {
  minimumPeriodBytes: number;
  maximumPeriodBytes: number;
  minimumSubunitsPerCycle: number;
  contextDominantAgreementThreshold: number;
  crossPopulationContextBytesBefore: number;
  matchedFieldBytes: number;
  crossPopulationContextBytesAfter: number;
  periodMode: 'proper-cycle-divisors-only';
  maskMode: 'all-existing-b1-exact-occurrence-fields';
}

/**
 * Lane consensus across subunits for a tested period candidate (Section 20).
 */
export interface LaneConsensus {
  laneOffset: number;
  contributingByteCount: number;
  distinctByteValues: number[];
  distinctByteHexValues: string[];
  isStable: boolean;
  stableByteHex: string | null;
  dominantByte: number | null;
  dominantByteHex: string | null;
  dominantByteCount: number;
  dominantBytePercentage: number;
  maskedContributionCount: number;
}

/**
 * Occurrence Lane Histogram Item for a specific byte lane (Section 27 & 28).
 */
export interface OccurrenceLaneHistogramItem {
  laneOffset: number;
  uniquePhysicalOccurrenceCount: number;
  logicalAssociationCount: number;
  candidateIdHistogram: Record<string, number>;
  representationKindHistogram: Record<string, number>;
  targetRegionHistogram: Record<string, number>;
  targetObjectHistogram: Record<string, number>;
  sourceCycleCount: number;
  sourceSubunitCount: number;
  distinctCyclesContainingOccurrence: number[];
  distinctSubunitsContainingOccurrence: number[];
  spansMultipleSubunits: boolean;
  spansMultipleCycles: boolean;
  isRepeatedB1OccurrenceLane: boolean;
  candidateStable: boolean;
  distinctCandidateIds: string[];
  representationKindStable: boolean;
  distinctRepresentationKinds: PaletteRepresentationKind[];
  targetValueStable: boolean;
  distinctTargetValuesHex: string[];
  targetRegionStable: boolean;
  distinctTargetRegionIds: string[];
}

/**
 * Summary of B.1 occurrence density for a candidate period (Section 32).
 */
export interface B1OccurrenceDensitySummary {
  totalUniqueB1OccurrencePositions: number;
  totalLogicalAssociations: number;
  numberOfOccupiedLanes: number;
  occupiedLanePercentage: number;
  mostOccupiedLane: number | null;
  mostOccupiedLaneCount: number;
}

/**
 * Tested period candidate metrics (Section 21).
 */
export interface TestedPeriodCandidate {
  periodBytes: number;
  subunitsPerCycle: number;
  cycleBlockCount: number;
  totalSubunits: number;

  rawComparableByteCount: number;
  rawStableLaneCount: number;
  rawStableLanePercentage: number;
  rawDominantAgreementPercentage: number;

  contextComparableByteCount: number;
  contextStableLaneCount: number;
  contextStableLanePercentage: number;
  contextDominantAgreementPercentage: number;
  contextConsensusStatus: 'evaluated' | 'not-applicable-no-context-bytes';

  maskedByteCount: number;

  rawLaneConsensus: LaneConsensus[];
  contextLaneConsensus: LaneConsensus[];

  hasNotableContextPeriodicity: boolean;

  /** Track B occurrence metrics */
  primaryOccurrenceLaneResidues: number[];
  primaryOccurrencesShareSubunitLane: boolean;
  occurrenceLaneHistogram: OccurrenceLaneHistogramItem[];
  b1OccurrenceDensity: B1OccurrenceDensitySummary;

  structuralFlags: string[];
}

/**
 * Physical Cycle Population (Sections 10, 69).
 */
export interface PhysicalCyclePopulation {
  populationId: string;
  sourceRegionId: string;
  sourceRegionClass: MK1ExecutableRegionClass | string;
  sourceObjectNumber: number | null;
  cycleSpan: number;
  cycleBlockCount: number;
  cycleAnchors: number[];
  cycleAnchorsHex: string[];
  sourceClusterIds: string[];
  sourceRepeatedTargetGroupIds: string[];
  candidateIds: string[];
  representationKinds: PaletteRepresentationKind[];
  B3PrimaryMotif: DeltaMotifAnalysis | null;
  B3OccurrenceSlots: number[];
  B3ContextOnlyConsensus: ContextOnlyRepeatedBlockConsensus | null;
  blockCrossesRegionBoundary: boolean;
  regionsIntersected: string[];

  testedPeriods: TestedPeriodCandidate[];
  topPeriodCandidates: TestedPeriodCandidate[];

  b1OccurrencePositionsInsideCycles: number[];
  b1OccurrencePositionsInsideCyclesHex: string[];

  hasAnyNotablePeriod: boolean;
  hasRepeatedB1OccurrenceLane: boolean;
  slotProvenanceDisagreements?: Array<{
    sourceType: string;
    sourceId: string;
    slots: number[];
  }>;
}

/**
 * Pairwise context comparison between two physical populations (Section 36).
 */
export interface CrossPopulationContextComparison {
  populationAId: string;
  populationBId: string;
  occurrencePairsCompared: number;
  minimumSimilarity: number;
  maximumSimilarity: number;
  meanSimilarity: number;
  stableRelativeBytePositions: number[];
  variableRelativeBytePositions: number[];
  comparablePairCountByRelativeOffset?: Record<number, number>;
}

/**
 * Secondary candidate-centric cross-population group (Sections 33, 34, 71).
 */
export interface CrossPopulationCandidateGroup {
  groupId: string;
  candidateId: string;
  representationKind: PaletteRepresentationKind;
  populationIds: string[];
  sourceRegionIds: string[];
  sourceObjectNumbers: (number | null)[];
  cycleSpans: number[];
  motifs: (DeltaMotifAnalysis | null)[];
  occurrenceCounts: number[];
  testedPeriodCandidates: Record<string, number[]>;
  notablePeriodCandidates: Record<string, number[]>;
  primaryOccurrenceLaneResiduesByPopulation: Record<string, number[]>;
  sharedPeriodCandidates: number[];
  sharedNotablePeriodCandidates: number[];
  sameCycleSpan: boolean;
  sameMotif: boolean;
  samePrimaryOccurrenceLaneResiduePattern: boolean;
  pairwisePopulationContextComparisons: CrossPopulationContextComparison[];
}

/**
 * Period lane annotation for a tested period hypothesis (Section 16).
 */
export interface ControlPeriodLaneAnnotation {
  periodBytes: number;
  relativeOffsetWithinSubunit: number;
}

/**
 * Known anchor control cycle layout summary (Section 47).
 */
export interface KnownAnchorCycleLayoutSummary {
  controlName: string;
  targetOffset: number;
  targetOffsetHex: string;
  representationsTested?: KnownAnchorControlRepresentation[];
  totalLogicalMatches?: number;
  uniquePhysicalOccurrences?: number;
  externalOccurrences?: number;
  sourceRegionDistribution?: Record<string, number>;
  participatingPhysicalPopulations: Array<{
    populationId: string;
    sourceOccurrenceOffset: number;
    sourceOccurrenceOffsetHex: string;
    cycleIndex: number;
    relativeOffsetWithinCycle: number;
    relativeOffsetWithinSubunit: number;
    periodBytes: number;
    periodLaneAnnotations: ControlPeriodLaneAnnotation[];
  }>;
}

/**
 * Negative control cycle layout summary (Section 48).
 */
export interface NegativeControlCycleLayoutSummary {
  candidateId: string;
  B1OccurrenceCount: number | null;
  B2ContextCount: number | null;
  crossPopulationStatus:
    | 'not-applicable-no-occurrences'
    | 'unexpected-occurrences-found'
    | 'unavailable-upstream-uninspected';
  participatingPopulationsCount: number;
  notes: string;
}

/**
 * Strict reconciliation for B.4 (Section 62).
 */
export interface CycleLayoutReconciliation {
  b3EligibleRepeatedPopulationInputs: number;
  uniquePhysicalPopulationsDerived: number;
  duplicateProvenanceLinksCollapsed: number;
  physicalPopulationsProcessed: number;
  physicalPopulationsSkipped: number;
  allPhysicalPopulationsAccountedFor: boolean;
  periodCandidatesGenerated: number;
  periodCandidatesProcessed: number;
  periodCandidatesSkipped: number;
  allPeriodCandidatesAccountedFor: boolean;
  b1OccurrencePositionsConsidered: number;
  b1OccurrencePositionsResolved: number;
  b1OccurrencePositionsMissing: number;
  allB1OccurrencePositionsResolve: boolean;
  crossPopulationEligibleGroups: number;
  crossPopulationGroupsProcessed: number;
  crossPopulationGroupsSkipped: number;
  allCrossPopulationGroupsAccountedFor: boolean;
  allReconciled: boolean;
}

/**
 * Global Summary for B.4 (Section 64).
 */
export interface GlobalCycleLayoutSummary {
  B3RepeatedPopulationsInput: number;
  uniquePhysicalCyclePopulations: number;
  populationsWithAtLeastOneNotablePeriod: number;
  populationsWithNoNotablePeriod: number;
  totalPeriodCandidatesTested: number;
  periodFrequencyHistogram: Record<number, number>;
  notablePeriodFrequencyHistogram: Record<number, number>;
  populationsWithRepeatedB1OccurrenceLane: number;
  crossPopulationCandidateGroups: number;
  crossPopulationGroupsWithSharedNotablePeriod: number;
  crossPopulationGroupsWithDifferentNotablePeriods: number;
}

/**
 * Milestone 1E.2B.4 Result container.
 */
export interface MK1PaletteCycleLayoutResult {
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  failureReason?: string;
  metadata: {
    operationId: string;
    timestamp: string;
    durationMs: number;
    milestone: '1E.2B.4';
  };
  fixture: {
    exePath: string;
    exeSize: number;
  };
  sourceB1Summary: {
    externalLogicalMatches: number;
    uniquePhysicalPositions: number;
    omittedTruncatedOccurrences: number;
  };
  sourceB2Summary: {
    clustersCount: number;
    clusteredPositions: number;
    unclusteredPositions: number;
  };
  sourceB3Summary: {
    b2ClustersProcessed: number;
    repeatedTargetGroupsProcessed: number;
    motifsFound: number;
    allReconciled: boolean;
  };
  scanConfiguration: CycleLayoutScanConfiguration;
  reconciliation: CycleLayoutReconciliation;
  globalSummary: GlobalCycleLayoutSummary;
  physicalCyclePopulations: PhysicalCyclePopulation[];
  crossPopulationCandidateGroups: CrossPopulationCandidateGroup[];
  knownAnchorControlSummary: KnownAnchorCycleLayoutSummary[];
  negativeControlSummary: NegativeControlCycleLayoutSummary;
}

/**
 * Export schema container: mk1_palette_cycle_layout_recon_v1 (Sections 67, 68).
 */
export interface MK1CompactPaletteCycleLayoutReconExport {
  format: 'mk1_palette_cycle_layout_recon_v1';
  schemaVersion: 1;
  exportedAt: string;
  metadata: {
    operationId: string;
    timestamp: string;
    durationMs: number;
    milestone: '1E.2B.4';
  };
  fixture: {
    exePath: string;
    exeSize: number;
  };
  sourceB1Summary: {
    externalLogicalMatches: number;
    uniquePhysicalPositions: number;
    omittedTruncatedOccurrences: number;
  };
  sourceB2Summary: {
    clustersCount: number;
    clusteredPositions: number;
    unclusteredPositions: number;
  };
  sourceB3Summary: {
    b2ClustersProcessed: number;
    repeatedTargetGroupsProcessed: number;
    motifsFound: number;
    allReconciled: boolean;
  };
  scanConfiguration: CycleLayoutScanConfiguration;
  reconciliation: CycleLayoutReconciliation;
  globalSummary: GlobalCycleLayoutSummary;
  physicalCyclePopulations: PhysicalCyclePopulation[];
  crossPopulationCandidateGroups: CrossPopulationCandidateGroup[];
  knownAnchorControlSummary: KnownAnchorCycleLayoutSummary[];
  negativeControlSummary: NegativeControlCycleLayoutSummary;
}
