/**
 * MK1 Executable Palette Repeated Structural Context Reconnaissance Types (Milestone 1E.2B.3)
 *
 * Models local byte-shape repetition, repeating-delta motif detection, and cross-occurrence
 * context consensus for B.1/B.2 occurrence populations.
 *
 * Core Epistemic Axiom:
 * REPEATED STRUCTURAL CONTEXT != POINTER TABLE OR PALETTE RECORD
 * Demonstrates mechanical byte-level repetition patterns without assigning semantic meaning.
 */

import { MK1ExecutableRegionClass } from './executableRegionTopology';
import { PaletteRepresentationKind } from './paletteReferenceReconnaissanceTypes';

/**
 * Permitted structural evidence flags (Section 32).
 * Strictly non-semantic terminology.
 */
export type StructuralEvidenceFlag =
  | 'has-constant-delta-motif'
  | 'has-multi-delta-repeating-motif'
  | 'has-high-context-consensus'
  | 'has-stable-before-context'
  | 'has-stable-after-context'
  | 'has-repeatable-cycle-block'
  | 'has-context-only-cycle-consensus'
  | 'has-high-context-only-cycle-consensus'
  | 'same-target-repeated'
  | 'different-targets-same-relative-slot';

/**
 * Bounded Track A relative context consensus for a single relative byte position (-32..+35).
 */
export interface RelativeBytePositionConsensus {
  relativeOffset: number;
  contributingCount: number;
  distinctByteValues: number[];
  distinctByteHexValues: string[];
  isStable: boolean;
  stableByteHex: string | null;
  dominantByte: number | null;
  dominantByteHex: string | null;
  dominantByteCount: number;
  dominantBytePercentage: number;
}

/**
 * Contiguous run of stable bytes within Track A consensus window.
 */
export interface StableContextRun {
  length: number;
  startRelativeOffset: number;
  endRelativeOffset: number;
  bytesHex: string[];
}

/**
 * Pairwise context similarity metrics across occurrences in a cluster or group.
 */
export interface ContextSimilarityMetrics {
  minimumPairwiseSimilarity: number;
  maximumPairwiseSimilarity: number;
  meanPairwiseSimilarity: number;
  comparedPairsCount: number;
}

/**
 * Track A relative-context consensus summary.
 */
export interface NormalizedContextConsensus {
  contextBytesBefore: number;
  matchedFieldBytes: number;
  contextBytesAfter: number;
  totalWindowBytes: number;
  maskedFieldOffsets: number[];

  /** Consensus entry for each of the 64 non-masked relative positions (-32..-1 and +4..+35) */
  relativePositions: RelativeBytePositionConsensus[];

  /** Contiguous run lengths around masked field */
  stableBeforeRunLength: number;
  stableAfterRunLength: number;
  longestStableRun: StableContextRun | null;

  /** Compact 68-byte context signature (stable bytes in hex, variable/masked as '??') */
  contextSignature: string;

  /** Pairwise similarity across normalized contexts */
  similarity: ContextSimilarityMetrics;

  /** Boundary metadata */
  contextTruncatedAtFileBoundary: boolean;
  contextCrossesRegionBoundary: boolean;
  regionsIntersected: string[];
}

/**
 * Track B repeating-delta motif analysis result.
 */
export interface DeltaMotifAnalysis {
  motifDeltas: number[];
  motifLength: number;
  cycleSpan: number;
  cycleCount: number;
  coveredDeltaCount: number;
  coveragePercentage: number;
  startDeltaIndex: number;
  endDeltaIndexExclusive: number;
  anchorPositions: number[];
  anchorPositionsHex: string[];
  isConstantStride: boolean;
}

/**
 * Slot target association within a single cycle of a repeating motif.
 */
export interface CycleOccurrenceSlotTargetAssociation {
  relativeOffsetInCycle: number;
  slotIndex: number;
  physicalOffset: number;
  physicalOffsetHex: string;
  candidateIds: string[];
  representationKinds: PaletteRepresentationKind[];
  targetRegions: string[];
  targetObjects: Array<number | null>;
  targetValuesHex: string[];
}

/**
 * Target stability across cycles for a specific occurrence slot in a motif.
 */
export interface CycleSlotStability {
  relativeOffsetInCycle: number;
  slotIndex: number;
  targetCandidateStable: boolean;
  representationKindStable: boolean;
  targetValueStable: boolean;
  targetRegionStable: boolean;
  distinctCandidateIds: string[];
  distinctRepresentationKinds: PaletteRepresentationKind[];
  distinctTargetValuesHex: string[];
  distinctTargetRegions: string[];
}

/**
 * Track C repeated cycle block byte-level consensus.
 */
export interface RepeatedBlockConsensus {
  blockLength: number;
  blockCount: number;
  identicalByteCount: number;
  variableByteCount: number;
  identicalBytePercentage: number;
  consensusMask: boolean[];
  stableRuns: Array<{
    length: number;
    startOffsetInBlock: number;
    endOffsetInBlock: number;
  }>;
}

/**
 * Track C repeated cycle block byte-level consensus excluding B.1 matched field slots.
 * Prevents tautological identity of matched values from masquerading as structural context.
 */
export interface ContextOnlyRepeatedBlockConsensus {
  performed: boolean;
  status: 'performed' | 'not-applicable-no-context-bytes';
  blockLength: number;
  blockCount: number;
  excludedMatchedByteOffsets: number[];
  excludedMatchedByteCount: number;
  comparableContextByteCount: number;
  identicalContextByteCount: number;
  variableContextByteCount: number;
  identicalContextBytePercentage: number;
  consensusMask: boolean[];
  stableRuns: Array<{
    length: number;
    startOffsetInBlock: number;
    endOffsetInBlock: number;
  }>;
}

/**
 * Track C complete repeated-block comparison result.
 */
export interface RepeatedBlockComparisonResult {
  performed: boolean;
  notPerformedReason?: string;
  blockLength: number;
  blockCount: number;
  cycleAnchors: number[];
  cycleAnchorsHex: string[];
  consensus: RepeatedBlockConsensus | null;
  rawBlockConsensus?: RepeatedBlockConsensus | null;
  contextOnlyConsensus: ContextOnlyRepeatedBlockConsensus | null;
  occurrenceRelativeOffsetsWithinCycle: number[];
  cycleTargetAssociations: CycleOccurrenceSlotTargetAssociation[][];
  slotStability: CycleSlotStability[];
  blockCrossesRegionBoundary: boolean;
  regionsIntersected: string[];
}

/**
 * Summary for each B.2 Physical Cluster analyzed in B.3 (Section 31).
 */
export interface ClusterStructuralSummary {
  clusterId: string;
  sourceRegionId: string;
  sourceRegionClass: MK1ExecutableRegionClass | string;
  sourceObjectNumber: number | null;
  startOffset: number;
  startOffsetHex: string;
  endOffset: number;
  endOffsetHex: string;
  positionCount: number;
  logicalMatchCount: number;
  positions: number[];
  positionsHex: string[];
  candidateIds: string[];
  representationKindHistogram: Record<string, number>;
  targetRegionHistogram: Record<string, number>;

  /** Track B */
  deltaSequence: number[];
  primaryDeltaMotif: DeltaMotifAnalysis | null;

  /** Track A */
  normalizedContextConsensus: NormalizedContextConsensus;

  /** Track C */
  repeatedBlockComparison: RepeatedBlockComparisonResult;

  /** Descriptive evidence flags */
  structuralEvidenceFlags: StructuralEvidenceFlag[];
}

/**
 * Secondary population: Repeated-Target Group summary (Section 34).
 */
export interface RepeatedTargetGroupSummary {
  groupId: string;
  candidateId: string;
  representationKind: PaletteRepresentationKind;
  sourceRegionId: string;
  sourceObjectNumber: number | null;
  physicalOccurrenceCount: number;
  positions: number[];
  positionsHex: string[];

  /** Track B */
  deltaSequence: number[];
  primaryDeltaMotif: DeltaMotifAnalysis | null;

  /** Track A */
  normalizedContextConsensus: NormalizedContextConsensus;

  /** Cluster memberships of the positions */
  clusterMemberships: string[];

  /** Track C if motif exists */
  repeatedBlockComparison: RepeatedBlockComparisonResult;

  /** Descriptive evidence flags */
  structuralEvidenceFlags: StructuralEvidenceFlag[];
}

/**
 * Authoritative scan configuration for Milestone 1E.2B.3 (Section 58).
 */
export interface RepeatedStructureScanConfiguration {
  contextBytesBefore: number;
  matchedFieldBytes: number;
  contextBytesAfter: number;
  contextSimilarityThreshold: number;
  deltaMotifMinCycles: number;
  deltaMotifMinLength: number;
  deltaMotifMaxLength: number;
  maxRepeatedBlockBytes: number;
  repeatedTargetMinimumOccurrences: number;
}

/**
 * Global structural summary metrics (Section 52).
 */
export interface GlobalStructuralSummary {
  b2ClustersProcessed: number;
  repeatedTargetGroupsDerived: number;
  clustersWithRepeatingDeltaMotif: number;
  clustersWithConstantDeltaMotif: number;
  clustersWithMultiDeltaMotif: number;
  clustersWithNoRepeatingMotif: number;
  clustersWithHighContextConsensus: number;
  repeatedCycleBlocksCompared: number;
  repeatedTargetGroupsWithMotif: number;
  repeatedTargetGroupsWithHighConsensus: number;
}

/**
 * Strict reconciliation object (Section 59).
 */
export interface RepeatedStructureReconciliation {
  b2ClusterInputCount: number;
  b3ClustersProcessed: number;
  b3ClustersSkipped: number;
  allClustersAccountedFor: boolean;

  b2ClusteredPhysicalPositions: number;
  b3ClusteredPhysicalPositionsReferenced: number;
  clusterPositionsReconcile: boolean;

  /** B.1 position integrity contract (Pass 1E.2B.3a) */
  clusterPositionsWithB1Evidence: number;
  clusterPositionsMissingB1Evidence: number;
  allClusterPositionsResolveToB1: boolean;

  repeatedTargetEligibleGroupCount: number;
  repeatedTargetGroupsProcessed: number;
  repeatedTargetGroupsSkipped: number;
  allRepeatedTargetGroupsAccountedFor: boolean;

  /** Repeated-target group position integrity (Pass 1E.2B.3b) */
  repeatedTargetGroupPositionsWithMatchingB1Evidence: number;
  repeatedTargetGroupPositionsMissingMatchingB1Evidence: number;
  invalidRepeatedTargetGroupPositions: number[];
  invalidRepeatedTargetGroupPositionsHex: string[];
  allRepeatedTargetGroupPositionsResolveToMatchingB1Evidence: boolean;
  /** Backwards-compatible aliases */
  repeatedTargetGroupPositionsWithB1Evidence: number;
  allRepeatedTargetGroupPositionsResolveToB1: boolean;

  allReconciled: boolean;
}

export interface ControlRepresentationTested {
  name: string;
  value: number;
  valueHex: string;
}

/**
 * Known anchor control analysis summary for B.3 (Section 40, hardened in 1E.2B.3b).
 * Evaluates occurrence contexts of references to known controls from b1Result.controlTargets.
 */
export interface KnownAnchorRepeatedStructureSummary {
  name: string;
  physicalOffset: number;
  physicalOffsetHex: string;
  representationsTested: ControlRepresentationTested[];
  B1TotalLogicalMatches: number;
  B1UniquePhysicalOccurrences: number;
  B1ExternalOccurrences: number;
  B1SourceRegionDistribution: Record<string, number>;
  externalOccurrencePositions: number[];
  externalOccurrencePositionsHex: string[];
  participatingPaletteClusterIds: string[];
  participatingRepeatedTargetGroupIds: string[];
  repeatedStructuralAnalysisStatus:
    | 'eligible-analyzed'
    | 'not-applicable-insufficient-occurrences';
  repeatedStructuralResult?: {
    deltaSequence: number[];
    primaryDeltaMotif: DeltaMotifAnalysis | null;
    normalizedContextConsensus: NormalizedContextConsensus;
    repeatedBlockComparison: RepeatedBlockComparisonResult;
    structuralEvidenceFlags: StructuralEvidenceFlag[];
  } | null;

  // Backwards compatibility aliases
  controlName?: string;
  targetOffset?: number;
  targetOffsetHex?: string;
  occurrenceCount?: number;
  occurrencePositions?: number[];
  occurrencePositionsHex?: string[];
  participatingClusterIds?: string[];
  participatingGroupIds?: string[];
  hasRepeatedStructuralContext?: boolean;
}

/**
 * Negative control candidate verification summary (Section 41, hardened in 1E.2B.3b).
 * Dynamically derived from live B.1/B.2 results.
 */
export interface NegativeControlRepeatedStructureSummary {
  candidateId: string;
  B1OccurrenceCount: number | null;
  B2ContextCount: number | null;
  B3RepeatedContextStatus:
    | 'not-applicable-no-occurrences'
    | 'unexpected-occurrences-found'
    | 'unavailable-upstream-uninspected';
  notes: string;
}

/**
 * Complete runtime result object for Pass 1E.2B.3.
 */
export interface MK1PaletteRepeatedStructureResult {
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  failureReason?: string;
  metadata: {
    operationId: string;
    timestamp: string;
    durationMs: number;
    milestone: '1E.2B.3';
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
    object1TrackAPositions: number;
  };
  scanConfiguration: RepeatedStructureScanConfiguration;
  reconciliation: RepeatedStructureReconciliation;
  globalStructuralSummary: GlobalStructuralSummary;
  clusterStructuralSummaries: ClusterStructuralSummary[];
  repeatedTargetGroupSummaries: RepeatedTargetGroupSummary[];
  knownAnchorControlSummary: KnownAnchorRepeatedStructureSummary[];
  negativeControlSummary: NegativeControlRepeatedStructureSummary;
}

/**
 * Export schema container: mk1_palette_repeated_structure_recon_v1 (Section 56).
 */
export interface MK1CompactPaletteRepeatedStructureReconExport {
  format: 'mk1_palette_repeated_structure_recon_v1';
  schemaVersion: 1;
  exportedAt: string;
  metadata: {
    operationId: string;
    timestamp: string;
    durationMs: number;
    milestone: '1E.2B.3';
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
    object1TrackAPositions: number;
  };
  scanConfiguration: RepeatedStructureScanConfiguration;
  reconciliation: RepeatedStructureReconciliation;
  globalStructuralSummary: GlobalStructuralSummary;
  clusterStructuralSummaries: ClusterStructuralSummary[];
  repeatedTargetGroupSummaries: RepeatedTargetGroupSummary[];
  knownAnchorControlSummary: KnownAnchorRepeatedStructureSummary[];
  negativeControlSummary: NegativeControlRepeatedStructureSummary;
}
