/**
 * MK1 Palette Phase-Aligned Subunit Recurrence & Harmonic Divisor Reconnaissance Types (Milestone 1E.2B.5)
 *
 * Models cycle-phase-aligned byte recurrence, harmonic divisor relationships,
 * exact phase-context signatures and repeating motifs, and B.1 occurrence phase/lane geometry.
 *
 * Standing Epistemic Axiom:
 * PHASE ALIGNMENT GAIN != PROOF OF FUNDAMENTAL PERIOD
 * HARMONIC GROUPING != RECORD HIERARCHY
 * SAME-LANE / DIFFERENT-PHASE B.1 OCCURRENCE != POINTER FIELD
 * EXACT PHASE SIGNATURE REPETITION != SEMANTIC RECORD TYPE
 */

import { MK1ExecutableRegionClass } from './executableRegionTopology';
import {
  PaletteRepresentationKind,
  KnownAnchorControlRepresentation,
} from './paletteReferenceReconnaissanceTypes';
import { DeltaMotifAnalysis } from './paletteRepeatedStructureTypes';

export type B5Stage =
  | 'START B.5'
  | 'fixture verified'
  | 'B.1 verified'
  | 'B.2 verified'
  | 'B.3 verified'
  | 'B.4 verified'
  | 'EXE bytes loaded'
  | 'physical populations collected'
  | 'absolute-offset recurrence complete'
  | 'period phase cells generated'
  | 'phase-aligned recurrence complete'
  | 'period invariance verified'
  | 'phase signatures complete'
  | 'evidence-bearing motifs classified'
  | 'harmonic relationships complete'
  | 'harmonic role recurrence complete'
  | 'B.1 phase geometry complete'
  | 'B.1 position integrity verified'
  | 'cross-pop geometry complete'
  | 'controls processed'
  | 'negative control derived'
  | 'reconciliation complete'
  | 'export constructed';

/**
 * Scan Configuration constants for Milestone 1E.2B.5 (Section 72)
 */
export interface PhaseHarmonicScanConfiguration {
  minimumComparableSamplesForStableCell: number;
  phaseAlignedContextAgreementThreshold: number;
  maskMode: 'all-b1-exact-occurrence-field-intersections';
  harmonicMode: 'tested-period-exact-multiples-only';
  phaseSignatureMode: 'exact-stable-variable-mask-signature';
  crossPopulationGeometryMode: 'exact-phase-index-and-lane-pattern';
}

/**
 * Population-level Absolute Cycle-Offset Recurrence (Milestone 1E.2B.5a, Sections 4, 5).
 * Evaluated once per physical population across complete repeated cycle blocks.
 */
export interface AbsoluteCycleOffsetRecurrence {
  rawComparableSampleCount: number;
  rawDominantSampleCount: number;
  rawDominantAgreementPercentage: number;
  contextComparableSampleCount: number;
  contextDominantSampleCount: number;
  contextDominantAgreementPercentage: number;
  contextStableOffsetCount: number;
  contextComparableOffsetCount: number;
  contextStableOffsetPercentage: number;
  cycleBlockCount: number;
  maskedSampleCount: number;
}

/**
 * Phase / lane cell comparison across cycles (Sections 16, 17, 18).
 */
export interface PhaseLaneCell {
  phaseIndex: number;
  laneOffset: number;
  sampleCount: number;
  maskedSampleCount: number;
  comparableSampleCount: number;
  distinctByteValues: number[];
  distinctByteHexValues: string[];
  dominantByte: number | null;
  dominantByteHex: string | null;
  dominantByteCount: number;
  dominantBytePercentage: number;
  isStableAcrossCycles: boolean;
  stableByteHex: string | null;
}

/**
 * Phase-level summary for a given phase index within a period (Section 19).
 */
export interface PhaseSummary {
  phaseIndex: number;
  phaseOffsetWithinCycle: number;
  rawComparableByteCount: number;
  rawStableCellCount: number;
  rawDominantAgreementPercentage: number;
  contextComparableByteCount: number;
  contextStableCellCount: number;
  contextDominantAgreementPercentage: number;
  fullyStableContextLaneCount: number;
  variableContextLaneCount: number;
  uncomparableContextLaneCount: number;
  contextSignature: string;
  cells: PhaseLaneCell[];
}

/**
 * Canonical exact phase signature group (Section 33).
 */
export interface PhaseSignatureGroup {
  signatureId: string;
  phaseIndices: number[];
  signature: string;
  groupSize: number;
}

/**
 * Repeating phase-signature motif across phase sequence (Section 34).
 */
export interface PhaseSignatureMotif {
  motif: string[];
  repeatCount: number;
}

/**
 * Harmonic Role-Lane Consensus across complete cycle blocks and higher-phase groups (1E.2B.5a, Section 17).
 */
export interface HarmonicRoleLaneConsensus {
  roleIndex: number;
  laneOffset: number;
  sampleCount: number;
  maskedSampleCount: number;
  comparableSampleCount: number;
  distinctHigherPhaseIndicesContributing: number[];
  distinctCycleIndicesContributing: number[];
  distinctByteValues: number[];
  dominantByte: number | null;
  dominantByteHex: string | null;
  dominantByteCount: number;
  dominantBytePercentage: number;
  stableAcrossHigherPhases: boolean;
  stableByteHex: string | null;
  isCrossHigherEligible: boolean;
}

/**
 * Harmonic Role Summary across higher-phase groups (1E.2B.5a/b, Section 18).
 */
export interface HarmonicRoleSummary {
  roleIndex: number;
  lowerPhaseIndicesAcrossHigherGroups: number[];
  higherPhaseCount: number;
  cycleBlockCount: number;

  // Legacy broad totals (all available role samples regardless of cross-higher eligibility)
  contextComparableSampleCount: number;
  contextDominantSampleCount: number;
  contextDominantAgreementPercentage: number;
  comparableLaneCount: number;
  stableAcrossHigherPhasesLaneCount: number;
  stableAcrossHigherPhasesLanePercentage: number;

  // Canonical 1E.2B.5b Cross-Higher Role Counters (Sections 10-14)
  crossHigherComparableSampleCount: number;
  crossHigherDominantSampleCount: number;
  crossHigherDominantAgreementPercentage: number | null;
  crossHigherComparableLaneCount: number;
  crossHigherStableLaneCount: number;
  crossHigherStableLanePercentage: number | null;
  crossHigherEligibleLaneOffsets: number[];
  crossHigherIneligibleLaneOffsets: number[];

  rolesCrossHigherPhaseEvidenceStatus:
    | 'strong-cross-higher-phase-evidence'
    | 'weak-cross-higher-phase-evidence'
    | 'insufficient-distinct-higher-phases'
    | 'all-masked';
  contextSignature: string;
  exactContextSignatureMatchAcrossHigherPhases: boolean;
  lanes: HarmonicRoleLaneConsensus[];
}

/**
 * Primary B.3 occurrence geometry within period (Section 38).
 */
export interface PrimaryOccurrenceGeometryItem {
  slotIndex: number;
  relativeOffsetWithinCycle: number;
  phaseIndex: number;
  laneOffsetWithinPhase: number;
}

/**
 * Phase/Lane occupancy matrix item for B.1 occurrences (Section 37, 41).
 */
export interface PhaseLaneB1OccupancyItem {
  phaseIndex: number;
  laneOffset: number;
  uniquePhysicalOccurrenceCount: number;
  logicalAssociationCount: number;
  distinctCycleCount: number;
  candidateStable: boolean;
  representationKindStable: boolean;
  targetValueStable: boolean;
  targetRegionStable: boolean;
  candidateIds: string[];
  representationKinds: PaletteRepresentationKind[];
}

/**
 * Period occurrence geometry summary (Sections 37, 41).
 */
export interface B1PhaseLaneOccupancySummary {
  occupiedPhaseIndices: number[];
  occupiedPhaseCount: number;
  occupiedLaneOffsets: number[];
  occupiedLaneCount: number;
  phaseLaneOccupancyMatrix: PhaseLaneB1OccupancyItem[];
  candidateIdHistogramByPhaseLane: Record<string, Record<string, number>>;
  representationHistogramByPhaseLane: Record<string, Record<string, number>>;
  targetRegionHistogramByPhaseLane: Record<string, Record<string, number>>;
  targetObjectHistogramByPhaseLane: Record<string, Record<string, number>>;
}

/**
 * Period phase-aligned metrics (Sections 21-27, 70).
 */
export interface PeriodPhaseAnalysis {
  periodBytes: number;
  phaseCount: number;
  cycleBlockCount: number;
  b4PooledContextDominantAgreementPercentage: number;

  // Legacy phase-aligned fields preserved for backward compatibility (period-view aliases)
  phaseAlignedRawComparableSampleCount: number;
  phaseAlignedRawDominantSampleCount: number;
  phaseAlignedRawDominantAgreementPercentage: number;

  phaseAlignedContextComparableSampleCount: number;
  phaseAlignedContextDominantSampleCount: number;
  phaseAlignedContextDominantAgreementPercentage: number;

  phaseAlignedContextStableCellCount: number;
  phaseAlignedContextComparableCellCount: number;
  phaseAlignedContextStableCellPercentage: number;

  phaseAlignmentGainPercentagePoints: number;
  hasPhaseLockedVariation: boolean;
  hasStrongPhaseAlignedRecurrence: boolean;

  // Canonical 1E.2B.5a fields
  pooledMixingPenaltyPercentagePoints: number;
  hasPooledPhaseMixingPenalty: boolean;

  phaseSummaries: PhaseSummary[];
  phaseSignatureSequence: string[];
  phaseSignatureGroups: PhaseSignatureGroup[];

  // Phase signature motif: raw preserved, plus canonical evidence-bearing classification
  exactRepeatingPhaseSignatureMotif: PhaseSignatureMotif | null;
  evidenceBearingExactRepeatingPhaseSignatureMotif: PhaseSignatureMotif | null;
  exactPhaseSignatureMotifEvidenceStatus:
    | 'evidence-bearing'
    | 'not-applicable-all-masked'
    | 'no-repeating-motif';

  primaryOccurrenceGeometry: PrimaryOccurrenceGeometryItem[];
  primaryOccurrencesShareLaneAcrossDistinctPhases: boolean;
  primaryOccurrencesSharePhaseDifferentLanes: boolean;

  b1PhaseLaneOccupancy: B1PhaseLaneOccupancySummary;
}

/**
 * Harmonic divisor relationship between two tested periods (Sections 28-31, 71, and 1E.2B.5a Sections 11-21).
 */
export interface HarmonicDivisorRelationship {
  lowerPeriodBytes: number;
  higherPeriodBytes: number;
  ratio: number;
  lowerSubunitsPerHigherSubunit: number;

  lowerB4PooledAgreement: number;
  higherB4PooledAgreement: number;

  // Legacy phase-aligned comparison fields (preserved for compatibility)
  lowerPhaseAlignedAgreement: number;
  higherPhaseAlignedAgreement: number;

  lowerPhaseAlignmentGain: number;
  higherPhaseAlignmentGain: number;

  higherPooledAdvantageOverLowerPooled: number;
  higherPhaseAlignedAdvantageOverLowerPhaseAligned: number;

  lowerPhaseAlignedAtLeastHigherPooled: boolean;
  lowerPhaseAlignedAtLeastHigherPhaseAligned: boolean;

  groupingMap: Array<{ higherPhaseIndex: number; lowerPhaseIndices: number[] }>;

  // Canonical 1E.2B.5b Harmonic Role-Slot Recurrence Fields (Sections 10-17)
  roleRecurrenceThreshold: number; // e.g. 75 = 75%
  roleRecurrenceStatus:
    | 'confirmed-recurrence'
    | 'reduced-recurrence'
    | 'insufficient-cross-higher-evidence'
    | 'all-masked';
  rolesTotal: number;
  rolesWithCrossHigherPhaseEvidence: number;
  rolesWithoutCrossHigherPhaseEvidence: number;

  // Legacy broad role context fields (preserved for backward compatibility)
  lowerRoleContextComparableSampleCount: number;
  lowerRoleContextDominantSampleCount: number;
  lowerRoleContextDominantAgreementPercentage: number;
  lowerRoleStableLaneCount: number;
  lowerRoleComparableLaneCount: number;
  lowerRoleStableLanePercentage: number;
  lowerRoleRecurrenceAtLeastLowerPooled: boolean;
  lowerRoleRecurrenceAtLeastHigherPooled: boolean;

  // Canonical 1E.2B.5b Cross-Higher Harmonic Aggregate Fields (Sections 15, 16)
  crossHigherRoleComparableSampleCount: number;
  crossHigherRoleDominantSampleCount: number;
  crossHigherRoleDominantAgreementPercentage: number | null;
  crossHigherRoleComparableLaneCount: number;
  crossHigherRoleStableLaneCount: number;
  crossHigherRoleStableLanePercentage: number | null;
  rolesWithCrossHigherComparableLanes: number;
  rolesWithoutCrossHigherComparableLanes: number;
  crossHigherRoleRecurrenceAtLeastLowerPooled: boolean | null;
  crossHigherRoleRecurrenceAtLeastHigherPooled: boolean | null;

  allRolesExactContextSignatureMatchAcrossHigherPhases: boolean;
  roleSummaries: HarmonicRoleSummary[];
}

/**
 * Physical population phase analysis (Sections 9, 69, and 1E.2B.5a Section 4, 5).
 */
export interface PhysicalPopulationPhaseAnalysis {
  populationId: string;
  sourceRegionId: string;
  sourceRegionClass: MK1ExecutableRegionClass | string;
  sourceObjectNumber: number | null;
  cycleSpan: number;
  cycleBlockCount: number;
  cycleAnchors: number[];
  cycleAnchorsHex: string[];
  candidateIds: string[];
  representationKinds: PaletteRepresentationKind[];
  sourceClusterIds: string[];
  sourceRepeatedTargetGroupIds: string[];
  B3PrimaryMotif: DeltaMotifAnalysis | null;
  B3OccurrenceSlots: number[];
  B4TopPeriodCandidates: number[];

  // 1E.2B.5a Canonical population-level absolute cycle-offset recurrence
  absoluteCycleOffsetRecurrence: AbsoluteCycleOffsetRecurrence;
  phaseAggregateInvariantAcrossPeriods: boolean;
  maxPhaseAggregateDifference: number;
  periodsViolatingInvariant: number[];

  periodPhaseAnalyses: PeriodPhaseAnalysis[];
  harmonicRelationships: HarmonicDivisorRelationship[];
  b1OccurrencePositionsInsideCycles: number[];
  b1OccurrencePositionsInsideCyclesHex: string[];
}

/**
 * Cross-population primary geometry match item (Sections 43, 44).
 */
export interface CrossPopulationPrimaryGeometryMatch {
  populationAId: string;
  populationBId: string;
  periodABytes: number;
  periodBBytes: number;
  patternA: Array<{ phaseIndex: number; laneOffset: number }>;
  patternB: Array<{ phaseIndex: number; laneOffset: number }>;
  exactMatch: boolean;
}

/**
 * Cross-population shared lane pattern item (Section 44).
 */
export interface CrossPopulationSharedLanePattern {
  populationAId: string;
  populationBId: string;
  periodABytes: number;
  periodBBytes: number;
  bothShareLaneAcrossDistinctPhases: boolean;
}

/**
 * Candidate-centric cross-population geometry summary (Sections 42-45).
 */
export interface CrossPopulationGeometrySummary {
  groupId: string;
  candidateId: string;
  representationKind: PaletteRepresentationKind;
  populationIds: string[];
  populationPeriodGeometry: Record<string, Record<number, Array<{ phaseIndex: number; laneOffset: number }>>>;
  exactPrimaryGeometryMatches: CrossPopulationPrimaryGeometryMatch[];
  sharedSameLaneAcrossDistinctPhasePatterns: CrossPopulationSharedLanePattern[];
}

/**
 * Known anchor control cycle phase geometry summary (Section 47).
 */
export interface KnownAnchorPhaseGeometrySummary {
  controlName: string;
  targetOffset: number;
  targetOffsetHex: string;
  representationsTested?: KnownAnchorControlRepresentation[] | string[];
  totalLogicalMatches?: number;
  uniquePhysicalOccurrences?: number;
  externalOccurrences?: number;
  sourceRegionDistribution?: Record<string, number>;
  participatingOccurrences: Array<{
    populationId: string;
    sourceOccurrenceOffset: number;
    sourceOccurrenceOffsetHex: string;
    cycleIndex: number;
    relativeOffsetWithinCycle: number;
    periodBytes: number;
    phaseIndex: number;
    laneOffsetWithinPhase: number;
  }>;
}

/**
 * Negative control phase harmonic summary (Section 46 and 1E.2B.5a Sections 32-35).
 */
export interface NegativeControlPhaseHarmonicSummary {
  candidateId: string;
  controlName?: string;
  targetOffset?: number;
  targetOffsetHex?: string;
  representationsTested?: string[];
  totalLogicalMatches?: number;
  uniquePhysicalOccurrences?: number;
  externalOccurrences?: number;
  sourceRegionDistribution?: Record<string, number>;
  B1OccurrenceCount: number | null;
  B2ContextCount: number | null;
  status:
    | 'not-applicable-no-occurrences'
    | 'unexpected-occurrences-found'
    | 'unavailable-upstream-uninspected';
  participatingPopulationsCount: number;
  participatingPopulationIds?: string[];
  notes: string;
}

/**
 * Strict reconciliation for B.5 and B.5a (Section 64 and 1E.2B.5a Sections 28-31).
 */
export interface PhaseHarmonicReconciliation {
  b4PhysicalPopulationsInput: number;
  b5EligiblePhysicalPopulations: number;
  b5PhysicalPopulationsProcessed: number;
  b5PhysicalPopulationsSkipped: number;
  allPhysicalPopulationsAccountedFor: boolean;

  b4PeriodCandidatesInput: number;
  b5PeriodCandidatesProcessed: number;
  b5PeriodCandidatesSkipped: number;
  allPeriodCandidatesAccountedFor: boolean;

  phaseCellsGenerated: number;
  phaseCellsProcessed: number;
  phaseCellsSkipped: number;
  allPhaseCellsAccountedFor: boolean;

  harmonicRelationshipsGenerated: number;
  harmonicRelationshipsProcessed: number;
  harmonicRelationshipsSkipped: number;
  allHarmonicRelationshipsAccountedFor: boolean;

  // Real B.1 position validation fields (1E.2B.5a Sections 28-31)
  b4B1PopulationPositionPairsInput: number;
  b1PopulationPositionPairsInEligiblePopulations: number;
  b1PopulationPositionPairsInSkippedPopulations: number;
  b1EligiblePositionsResolved: number;
  b1EligiblePositionsMissing: number;
  allB4B1PopulationPositionPairsAccountedFor: boolean;
  b1MissingPositions: Array<{ populationId: string; position: number; positionHex: string }>;

  // Optional unique physical position counters (1E.2B.5b Section 25)
  uniqueB1PhysicalPositionsInEligiblePopulations?: number;
  uniqueB1PhysicalPositionsInSkippedPopulations?: number;

  // Legacy field names preserved as aliases for backward compatibility
  b1PhysicalOccurrencePositionsConsidered: number;
  b1PhysicalOccurrencePositionsResolved: number;
  b1PhysicalOccurrencePositionsMissing: number;
  allB1OccurrencesResolve: boolean;

  crossPopulationGroupsInput: number;
  crossPopulationGroupsProcessed: number;
  crossPopulationGroupsSkipped: number;
  allCrossPopulationGroupsAccountedFor: boolean;

  allPeriodInvariantsHold: boolean;
  allReconciled: boolean;
}

/**
 * Global Summary for B.5, B.5a, and B.5b (Section 65 and 1E.2B.5a/b).
 */
export interface GlobalPhaseHarmonicSummary {
  physicalPopulationsAnalyzed: number;
  periodCandidatesAnalyzed: number;

  // 1E.2B.5a Population-level absolute cycle-offset metrics
  populationsWithStrongAbsoluteOffsetRecurrence: number;
  populationsWithoutStrongAbsoluteOffsetRecurrence: number;
  populationAbsoluteOffsetAgreementHistogram: Record<string, number>;

  // 1E.2B.5a Canonical pooled-mixing penalty metrics
  periodViewsWithPositivePooledMixingPenalty: number;
  periodViewsWithZeroPooledMixingPenalty: number;
  periodViewsWithNegativePooledMixingPenalty: number;

  // Legacy period-view aliases preserved for backward compatibility
  periodsWithPositivePhaseAlignmentGain: number;
  periodsWithZeroPhaseAlignmentGain: number;
  periodsWithNegativePhaseAlignmentGain: number;
  periodsWithStrongPhaseAlignedRecurrence: number;

  harmonicRelationshipsAnalyzed: number;
  harmonicRelationshipsWhereLowerPhaseAlignedMeetsHigherPooled: number;

  // 1E.2B.5a Harmonic role-slot recurrence global metrics (Section 27)
  harmonicRelationshipsWithRoleConfirmedRecurrence: number;
  harmonicRelationshipsWithRoleReducedRecurrence: number;
  harmonicRelationshipsWithInsufficientCrossHigherEvidence: number;
  harmonicRelationshipsAllMaskedRoles: number;
  harmonicRelationshipsWithExactRoleSignatureMatchAcrossHigherPhases: number;

  // 1E.2B.5b Canonical cross-higher harmonic metrics (Section 54)
  harmonicRelationshipsWithCanonicalCrossHigherRecurrence?: number;
  harmonicRelationshipsCanonicalCrossHigherMeetsHigherPooled?: number;
  harmonicRelationshipsCanonicalCrossHigherBelowHigherPooled?: number;
  rolesWithCrossHigherComparableLanes?: number;
  rolesWithoutCrossHigherComparableLanes?: number;

  // Phase signature motif metrics
  periodsWithRepeatedExactPhaseSignatureMotif: number;
  periodsWithEvidenceBearingRepeatedExactPhaseSignatureMotif: number;

  periodsWithPrimarySameLaneAcrossDistinctPhases: number;
  crossPopulationGeometryMatches: number;
}

/**
 * Milestone 1E.2B.5 / 1E.2B.5a / 1E.2B.5b Result container.
 */
export interface MK1PalettePhaseHarmonicResult {
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  failureReason?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
    cause?: unknown;
  };
  lastSuccessfulStage?: B5Stage;
  metadata: {
    operationId: string;
    timestamp: string;
    durationMs: number;
    milestone: '1E.2B.5' | '1E.2B.5a' | '1E.2B.5b';
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
  sourceB4Summary: {
    uniquePhysicalCyclePopulations: number;
    totalPeriodCandidatesTested: number;
    allReconciled: boolean;
  };
  scanConfiguration: PhaseHarmonicScanConfiguration;
  reconciliation: PhaseHarmonicReconciliation;
  globalSummary: GlobalPhaseHarmonicSummary;
  physicalPopulationPhaseAnalyses: PhysicalPopulationPhaseAnalysis[];
  crossPopulationGeometrySummaries: CrossPopulationGeometrySummary[];
  knownAnchorControlSummary: KnownAnchorPhaseGeometrySummary[];
  negativeControlSummary: NegativeControlPhaseHarmonicSummary;
}

/**
 * Compact Export Schema: mk1_palette_phase_harmonic_recon_v1 (Sections 67, 68).
 */
export interface MK1CompactPalettePhaseHarmonicExport {
  format: 'mk1_palette_phase_harmonic_recon_v1';
  schemaVersion: 1;
  exportedAt: string;
  metadata: {
    operationId: string;
    timestamp: string;
    durationMs: number;
    milestone: '1E.2B.5' | '1E.2B.5a' | '1E.2B.5b';
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
  sourceB4Summary: {
    uniquePhysicalCyclePopulations: number;
    totalPeriodCandidatesTested: number;
    allReconciled: boolean;
  };
  scanConfiguration: PhaseHarmonicScanConfiguration;
  reconciliation: PhaseHarmonicReconciliation;
  globalSummary: GlobalPhaseHarmonicSummary;
  physicalPopulationPhaseAnalyses: PhysicalPopulationPhaseAnalysis[];
  crossPopulationGeometrySummaries: CrossPopulationGeometrySummary[];
  knownAnchorControlSummary: KnownAnchorPhaseGeometrySummary[];
  negativeControlSummary: NegativeControlPhaseHarmonicSummary;
}
