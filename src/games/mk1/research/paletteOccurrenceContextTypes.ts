/**
 * MK1 Executable Palette Occurrence Context Reconnaissance Types (Milestone 1E.2B.2)
 *
 * Models narrow x86 instruction-field shape analysis and regular data-value cluster
 * analysis surrounding the exact address-representation occurrences discovered in 1E.2B.1.
 *
 * Core Epistemic Axiom:
 * STRUCTURAL COINCIDENCE != POINTER OR PALETTE OWNERSHIP
 * Whitelisted operand-field shape matches and spatial clustering are structural evidence
 * of binary encoding patterns, NOT proof of semantic reference or palette ownership.
 */

import { MK1ExecutableRegionClass } from './executableRegionTopology';
import { PaletteRepresentationKind } from './paletteReferenceReconnaissanceTypes';

/**
 * Narrow, explicitly approved positive x86 operand shapes (Section 10).
 * Relative branches (CALL/JMP rel32) are segregated as negative context.
 */
export type X86OperandShapeClass =
  | 'mov-r32-imm32'      // MOV reg32, imm32 (opcode 0xB8..0xBF + imm32)
  | 'push-imm32'         // PUSH imm32 (opcode 0x68 + imm32)
  | 'moffs32-direct'     // MOV EAX, [moffs32] (0xA1) or MOV [moffs32], EAX (0xA3)
  | 'accumulator-imm32'  // ADD/OR/ADC/SBB/AND/SUB/XOR/CMP EAX, imm32 (0x05, 0x0D, 0x15, 0x1D, 0x25, 0x2D, 0x35, 0x3D)
  | 'disp32-absolute'    // Absolute [disp32] (0x8B, 0x89, 0x8D mod=00 r/m=101; or SIB base=101)
  | 'negative-rel32'     // CALL rel32 (0xE8) or JMP rel32 (0xE9) - NEGATIVE context: relative branch displacement
  | 'unmatched-shape';   // Does not coincide with any whitelisted operand shape

/**
 * Result model status for each Object 1 physical position (Section 9).
 */
export type X86ShapeStatus =
  | 'no-whitelisted-shape'
  | 'single-whitelisted-shape'
  | 'multiple-whitelisted-shapes'
  | 'relative-control-field-shape'
  | 'ambiguous-prefix-context';

export interface X86ShapeMatchDetails {
  shapeClass: X86OperandShapeClass;
  mnemonicHint: string;
  opcodeBytesHex: string;
  candidateEncodingStart: number;
  candidateEncodingStartHex: string;
  candidateEncodingLength: number;
  isWhitelistedShape: boolean;
  isNegativeContext: boolean;
  explanation: string;

  // Legacy convenience aliases
  instructionOffset?: number;
  instructionOffsetHex?: string;
  instructionLength?: number;
}

export interface PhysicalPositionContextClassification {
  /** Unique physical byte offset in MK1.EXE */
  sourceFileOffset: number;
  sourceFileOffsetHex: string;
  sourceRegionId: string;
  sourceRegionClass: MK1ExecutableRegionClass | string;
  sourceObjectNumber: number | null;
  sourceLoadedAddressHex: string | null;
  matchedUint32Value: number;
  matchedUint32Hex: string;

  /** Associated logical candidate representations at this physical offset */
  logicalMatchesCount: number;
  associatedCandidates: Array<{
    candidateId: string;
    representationKind: PaletteRepresentationKind;
    targetCandidateByteStartHex: string;
    targetCandidateRegionId: string;
    targetObjectNumber: number | null;
  }>;

  /** Context byte window */
  contextBytesHex: string;

  /** Track A: x86 shape classification (evaluated if sourceObjectNumber === 1, otherwise null) */
  trackA_x86Shape: X86ShapeMatchDetails | null;

  /** Result model status for Object 1 (Section 9) */
  shapeStatus: X86ShapeStatus | null;

  /** All matching shape candidates discovered within bounded lookbehind (Section 8/9) */
  matchingShapes: X86ShapeMatchDetails[];

  /** Track B: Spatial clustering membership */
  clusterId: string | null;
  isClustered: boolean;
}

export type PhysicalClusterType =
  | 'constant-stride-cluster'
  | 'dominant-stride-cluster'
  | 'mixed-stride-cluster';

export type TargetValueMonotonicity =
  | 'strictly-increasing'
  | 'monotonically-increasing'
  | 'strictly-decreasing'
  | 'monotonically-decreasing'
  | 'constant'
  | 'non-monotonic';

export interface PhysicalOccurrenceCluster {
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
  consecutiveDeltas: number[];
  clusterType: PhysicalClusterType;
  constantStride: number | null;
  dominantStride: number | null;
  dominantStrideCount: number | null;
  distinctStrideCount: number;
  representationKindHistogram: Record<string, number>;
  targetRegionHistogram: Record<string, number>;
  targetObjectHistogram: Record<string, number>;
  distinctTargetCount: number;
  targetValueMonotonicity: TargetValueMonotonicity;

  // Convenience fields
  byteSpan: number;
  densityPercentage: number;
  averageGap: number;
  minGap: number;
  maxGap: number;
  isRegularStride: boolean;
  detectedStride: number | null;
  strideDescription: string;
  candidateIds: string[];
  candidateCount: number;
  interFieldGapBytes?: number[];

  // Legacy field aliases
  regionId?: string;
  regionClass?: MK1ExecutableRegionClass | string;
}

export interface TrackAShapeDistribution {
  shapeClass: X86OperandShapeClass;
  displayName: string;
  positionCount: number;
  percentageOfObject1Positions: number;
  logicalMatchCount: number;
  isWhitelisted: boolean;
  isNegativeContext: boolean;
  description: string;
}

export interface TrackAResultSummary {
  eligibleObject1Positions: number;
  eligibleObject1LogicalMatches: number;
  whitelistedShapePositions: number;
  negativeContextPositions: number;
  unmatchedShapePositions: number;
  ambiguousPrefixPositions: number;
  singleWhitelistedShapePositions: number;
  multipleWhitelistedShapePositions: number;
  percentageWhitelisted: number;
  percentageNegativeContext: number;
  percentageUnmatched: number;
  shapeDistribution: TrackAShapeDistribution[];
}

export interface TrackBResultSummary {
  totalPositionsAnalyzed: number;
  totalClustersIdentified: number;
  clusteredPositionsCount: number;
  isolatedPositionsCount: number;
  percentageClustered: number;
  clusteringRule: string;
  clusters: PhysicalOccurrenceCluster[];
  regularStrideClustersCount: number;
  clustersByRegion: Record<string, { clusterCount: number; positionCount: number }>;
}

export interface NegativeControlVerification {
  candidateId: string;
  expectedZeroOccurrences: boolean;
  actualOccurrencesB1: number;
  actualOccurrencesB2: number;
  status: 'CONFIRMED_ZERO_OCCURRENCES' | 'UNEXPECTED_OCCURRENCES_DETECTED';
  notes: string;
}

export interface OccurrenceContextReconciliation {
  b1ExternalLogicalMatchInputCount: number;
  b2LogicalMatchesAccountedFor: number;
  logicalMatchesReconcile: boolean;

  b1UniquePhysicalPositionInputCount: number;
  b2UniquePhysicalPositionsAccountedFor: number;
  physicalPositionsReconcile: boolean;

  object1TrackAExpectedPositions: number;
  object1TrackAAnalyzedPositions: number;
  object1TrackAReconciles: boolean;

  trackBExpectedPositions: number;
  trackBAnalyzedPositions: number;
  trackBReconciles: boolean;

  clusteredPositions: number;
  unclusteredPositions: number;
  clusterMembershipReconciles: boolean;

  allReconciled: boolean;
  truncationOmittedCount: number;
}

export interface CandidateOccurrenceContextSummary {
  candidateId: string;
  candidateRegion: string;
  candidateObjectNumber: number | null;
  length: number;
  contentHash: string;
  researchScore: number;
  zeroShiftKanoCompatible: boolean;
  externalOccurrenceCount: number;
  Object1SourceOccurrenceCount: number;
  Object2SourceOccurrenceCount: number;
  tailSourceOccurrenceCount: number;
  whitelistedShapeOccurrenceCount: number;
  relativeControlFieldOccurrenceCount: number;
  ambiguousShapeOccurrenceCount: number;
  noWhitelistedShapeOccurrenceCount: number;
  regularClusterOccurrenceCount: number;
  clusterIds: string[];
}

export interface KnownAnchorControlContextSummary {
  name: string;
  physicalOffset: number;
  physicalOffsetHex: string;
  externalOccurrenceCount: number;
  uniquePhysicalPositionsCount: number;
  Object1SourceOccurrenceCount: number;
  Object2SourceOccurrenceCount: number;
  tailSourceOccurrenceCount: number;
  whitelistedShapeCount: number;
  relativeControlFieldCount: number;
  ambiguousShapeCount: number;
  noWhitelistedShapeCount: number;
  clusteredOccurrenceCount: number;
  clusterIds: string[];
}

export interface ScanConfiguration {
  trackASourceScope: string;
  candidateStartLookbehindBytes: number;
  clusterMaxStartOffsetDelta: number;
  clusterMinimumPositions: number;
  positiveShapeWhitelist: string[];
  relativeNegativeShapes: string[];
  SIBSupport: boolean;
}

export interface MK1PaletteOccurrenceContextResult {
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  failureReason?: string;
  metadata: {
    operationId: string;
    timestamp: string;
    durationMs: number;
    milestone: '1E.2B.2';
  };
  fixture: {
    exePath: string;
    exeSize: number;
    exeSizeHex: string;
  };
  sourceReconSummary: {
    totalInputCandidates: number;
    totalLogicalExternalMatches: number;
    uniqueExternalPhysicalPositions: number;
  };
  scanConfiguration: ScanConfiguration;
  reconciliation: OccurrenceContextReconciliation;
  trackA: TrackAResultSummary;
  trackB: TrackBResultSummary;
  candidateContextSummaries: CandidateOccurrenceContextSummary[];
  knownAnchorControlContext: KnownAnchorControlContextSummary[];
  classifiedPositions: PhysicalPositionContextClassification[];
  negativeControl: NegativeControlVerification;
}

export interface MK1CompactPaletteOccurrenceContextExport {
  metadata: {
    formatVersion: 'mk1_palette_occurrence_context_v1';
    exportTimestamp: string;
    application: string;
    version: string;
    milestone: '1E.2B.2';
    operationId: string;
  };
  fixture: {
    exePath: string;
    exeSize: number;
    exeSizeHex: string;
  };
  sourceB1Summary: {
    totalInputCandidates: number;
    totalLogicalExternalMatches: number;
    uniqueExternalPhysicalPositions: number;
  };
  scanConfiguration: ScanConfiguration;
  reconciliation: OccurrenceContextReconciliation;
  x86ShapeSummary: TrackAResultSummary;
  clusterSummary: TrackBResultSummary;
  candidateContextSummaries: CandidateOccurrenceContextSummary[];
  x86OccurrenceContexts: PhysicalPositionContextClassification[];
  physicalClusters: PhysicalOccurrenceCluster[];
  knownAnchorControlContext: KnownAnchorControlContextSummary[];
  negativeControlSummary: NegativeControlVerification;

  // Legacy convenience properties
  sourceReconnaissance?: {
    totalInputCandidates: number;
    totalLogicalExternalMatches: number;
    uniqueExternalPhysicalPositions: number;
  };
  trackA_x86ShapeAnalysis?: TrackAResultSummary;
  trackB_spatialClustering?: TrackBResultSummary;
  negativeControl?: NegativeControlVerification;
  classifiedPositions?: PhysicalPositionContextClassification[];
}
