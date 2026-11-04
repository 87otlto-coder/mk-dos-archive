/**
 * MK1 Executable Palette Reference / Context Reconnaissance Types (Milestone 1E.2B.1)
 *
 * Models exact uint32 little-endian address-representation occurrences across MK1.EXE
 * without semantic pointer interpretations, disassembly, or ranking mutations.
 *
 * Core Axiom:
 * EXACT UINT32 OCCURRENCE != POINTER
 * An exact value occurrence is evidence of a value occurrence. It is not automatically
 * a pointer, reference, palette owner, table entry, instruction operand, runtime address,
 * or resource relationship.
 */

import { MK1ExecutableRegionClass } from './executableRegionTopology';

export type PaletteRepresentationKind =
  | 'physical-structure-start'
  | 'physical-payload-start'
  | 'object-relative-structure'
  | 'object-relative-payload'
  | 'linear-structure-address'
  | 'linear-payload-address';

export type RepresentationDerivationStatus =
  | 'generated'
  | 'not-applicable'
  | 'failed-to-derive';

export type AlignmentTag = 'aligned4' | 'aligned2' | 'unaligned';

export interface PaletteRepresentationDescriptor {
  kind: PaletteRepresentationKind;
  status: RepresentationDerivationStatus;
  value: number | null;
  valueHex: string | null;
  reason?: string;
}

export interface ExactValueOccurrence {
  /** Physical byte offset in MK1.EXE where the uint32 value begins */
  sourceFileOffset: number;
  sourceFileOffsetHex: string;
  matchedUint32Value: number;
  matchedUint32Hex: string;
  representationKind: PaletteRepresentationKind;
  targetCandidateId: string;
  targetCandidateByteStart: number;
  targetCandidateByteStartHex: string;
  targetCandidateRegionId: string;
  targetCandidateRegionClass: MK1ExecutableRegionClass | string;
  targetObjectNumber: number | null;
  sourceRegionId: string;
  sourceRegionClass: MK1ExecutableRegionClass | string;
  sourceObjectNumber: number | null;
  sourceLoadedAddressHex: string | null;
  sourceObjectOffsetHex: string | null;
  alignmentMod4: number;
  alignmentMod2: number;
  alignmentTag: AlignmentTag;
  isInsideTargetCandidateRange: boolean;
  isExactAtTargetCandidateStart: boolean;
  contextStartOffsetHex: string;
  contextBytesHex: string;
  matchIndexWithinContext: number;
}

export interface CandidateReferenceSummary {
  candidateId: string;
  byteStart: number;
  byteStartHex: string;
  byteEnd: number;
  byteEndHex: string;
  targetRegionId: string;
  targetRegionClass: MK1ExecutableRegionClass | string;
  objectNumber: number | null;
  contentHash: string;
  length: number;
  researchScore: number;
  zeroShiftKanoCompatible: boolean;
  representationKindsTested: PaletteRepresentationKind[];
  representations: Record<PaletteRepresentationKind, PaletteRepresentationDescriptor>;
  totalLogicalMatches: number;
  totalUniquePhysicalOccurrences: number;
  selfOccurrenceCount: number;
  externalOccurrenceCount: number;
  externalByRepresentation: Record<PaletteRepresentationKind, number>;
  externalBySourceRegion: Record<string, number>;
  externalInObject1: number;
  externalInObject2: number;
  externalInTail: number;
  externalInPreLE: number;
  externalInHeader: number;
  detailsTruncated: boolean;
  firstOccurrenceOffsetHex: string | null;
  lastOccurrenceOffsetHex: string | null;
}

export interface RepresentationKindSummary {
  representationKind: PaletteRepresentationKind;
  eligibleTargetCount: number;
  targetsWithAnyExternalOccurrence: number;
  percentageWithAnyExternalOccurrence: number;
  totalExternalLogicalMatches: number;
  uniquePhysicalOccurrenceCount: number;
  sourceRegionHistogram: Record<string, number>;
}

export interface TargetRegionSummary {
  regionId: string;
  regionClass: MK1ExecutableRegionClass | string;
  candidateCount: number;
  candidatesWithAnyExternalOccurrence: number;
  percentageWithAnyExternalOccurrence: number;
  totalExternalOccurrenceCount: number;
  sourceRegionDistribution: Record<string, number>;
}

export interface SourceTargetRegionMatrixCell {
  targetRegionId: string;
  sourceRegionId: string;
  externalOccurrenceCount: number;
}

export interface PaletteContentHashReferenceSummary {
  contentsWithReferencesAtMultiplePhysicalCopies: number;
  contentsWhereOnlyOneCopyHasExternalOccurrences: number;
  contentsWhereMultipleCopiesHaveExternalOccurrences: number;
  contentsWithZeroExternalOccurrences: number;
}

export interface KnownAnchorControlRepresentation {
  name: string;
  value: number;
  valueHex: string;
}

export interface ControlTargetSummary {
  name: string;
  physicalOffset: number;
  physicalOffsetHex: string;
  representationsTested: KnownAnchorControlRepresentation[];
  totalLogicalMatches: number;
  uniquePhysicalOccurrences: number;
  externalOccurrences: number;
  sourceRegionDistribution: Record<string, number>;
  occurrences: ExactValueOccurrence[];
}

export interface GlobalOccurrenceSummary {
  totalResearchTargets: number;
  targetsWithExternalExactOccurrences: number;
  targetsWithNoExternalExactOccurrences: number;
  percentageTargetsWithExternalOccurrences: number;
  totalExternalLogicalMatches: number;
  uniqueExternalPhysicalOccurrencePositions: number;
  totalSelfOccurrences: number;
  candidatesWith0ExternalOccurrences: number;
  candidatesWith1ExternalOccurrence: number;
  candidatesWith2To5ExternalOccurrences: number;
  candidatesWith6To20ExternalOccurrences: number;
  candidatesWithMoreThan20ExternalOccurrences: number;
}

export interface PaletteReferenceReconciliation {
  researchTargetInputCount: number;
  researchTargetsProcessed: number;
  researchTargetsSkipped: number;
  skipReasons: Record<string, string>;
  allTargetsAccountedFor: boolean;
}

export interface ReconnaissanceTruncationSummary {
  capPerRepresentation: number;
  totalCandidatesTruncated: number;
  totalOccurrencesOmitted: number;
}

export interface MK1PaletteReferenceReconResult {
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  failureReason?: string;
  metadata: {
    operationId: string;
    timestamp: string;
    durationMs: number;
  };
  fixture: {
    exePath: string;
    exeSize: number;
  };
  reconciliation: PaletteReferenceReconciliation;
  globalSummary: GlobalOccurrenceSummary;
  representationSummaries: RepresentationKindSummary[];
  targetRegionSummaries: TargetRegionSummary[];
  sourceTargetMatrix: SourceTargetRegionMatrixCell[];
  candidateSummaries: CandidateReferenceSummary[];
  contentHashSummary: PaletteContentHashReferenceSummary;
  controlTargets: ControlTargetSummary[];
  detailedOccurrences: ExactValueOccurrence[];
  truncationSummary: ReconnaissanceTruncationSummary;
}

export interface MK1CompactPaletteReferenceReconExport {
  metadata: {
    formatVersion: 'mk1_palette_reference_recon_v1';
    exportTimestamp: string;
    application: string;
    version: string;
    milestone: '1E.2B.1';
    operationId: string;
  };
  fixture: {
    exePath: string;
    exeSize: number;
    exeSizeHex: string;
  };
  sourceSummaries: {
    paletteCandidateCount: number;
    researchCandidateCount: number;
    executableTopologyRegionCount: number;
    correlationStatus: string;
  };
  scanConfiguration: {
    exactByteOrder: 'uint32-le';
    alignmentRequirement: 'none-recorded';
    contextWindowBytes: '8 before, 4 match, 8 after';
    capPerRepresentation: number;
  };
  reconciliation: PaletteReferenceReconciliation;
  globalSummary: GlobalOccurrenceSummary;
  representationSummaries: RepresentationKindSummary[];
  targetRegionSummaries: TargetRegionSummary[];
  sourceTargetMatrix: SourceTargetRegionMatrixCell[];
  candidateSummaries: CandidateReferenceSummary[];
  contentHashSummary: PaletteContentHashReferenceSummary;
  controlTargets: ControlTargetSummary[];
  detailedOccurrences: ExactValueOccurrence[];
  truncationSummary: ReconnaissanceTruncationSummary;
}
