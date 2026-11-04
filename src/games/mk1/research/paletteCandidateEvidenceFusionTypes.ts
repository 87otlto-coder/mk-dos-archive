/**
 * MK1 Executable Palette Candidate Evidence Fusion Types (Milestone 1E.2B.6)
 *
 * Fuses candidate-generation heuristic evidence (1E.1a) with deterministic reference (1E.2B.1),
 * operand context (1E.2B.2), repeated structural motif (1E.2B.3), cycle layout (1E.2B.4),
 * and phase/harmonic divisor (1E.2B.5) evidence without assigning semantic ownership.
 *
 * Standing Epistemic Axiom:
 * REFERENCE ACTIVITY != PALETTE VALIDITY
 * - A byte sequence can satisfy MK1 palette heuristics while its offset participates in
 *   unrelated code or data structures.
 * - A visually/palette-plausible candidate can have no exact references under the tested
 *   representations (e.g. negative control 0x0009C914).
 * - Therefore, exact-reference counts, address representations, and harmonic divisor structures
 *   are mechanical observations, NOT semantic proof of palette identity.
 */

import { MK1ExecutableRegionClass } from './executableRegionTopology';
import { PaletteRepresentationKind } from './paletteReferenceReconnaissanceTypes';

export type StructureDepthLevel =
  | 'none'
  | 'b1-external-reference'
  | 'b2-context'
  | 'b3-repeated-structure'
  | 'b4-cycle-layout'
  | 'b5-harmonic-structure';

export type CandidateReferenceProfile =
  | 'no-external-reference'
  | 'physical-derived-only'
  | 'address-derived-only'
  | 'mixed-physical-and-address-derived';

export interface PaletteCandidateProvenanceEvidence {
  contentHash: string;
  duplicateContentOf?: string;
  duplicateCount: number;
  sameContentResearchCandidateCount: number;
  duplicateLocationCountWithinResearchUniverse: number;
  isContentDuplicate: boolean;
  tier: string;
  researchScore: number;
  sourceWordsHex?: string[];
}

export interface PaletteCandidateIntrinsicEvidence {
  byteStart: number;
  byteStartHex: string;
  byteEnd: number;
  byteEndHex: string;
  length: number;
  structureByteLength: number;
  payloadByteLength: number;
  uniqueColorCount: number | null;
  uniqueColorRatio: number | null;
  textLikeScore: number | null;
  containsLikelyAsciiData: boolean | null;
  isVeryShortCandidate: boolean;
  zeroShiftKanoCompatible: boolean;
  zeroShiftCoverageMargin: number;
}

export interface PaletteCandidateTopologyEvidence {
  targetRegionId: string;
  targetRegionClass: MK1ExecutableRegionClass | string;
  targetObjectNumber: number | null;
  targetObjectFlags: string | null;
  targetObjectReadable: boolean;
  targetObjectWritable: boolean;
  targetObjectExecutable: boolean;
  targetPhysicallyInFile: boolean;
  targetFileBacked: boolean;
  targetInLEObjectFileBackedData: boolean;
  targetInPhysicalPagePadding: boolean;
  targetInPostModuleTail: boolean;
  targetLoadedAddress: number | null;
  targetLoadedAddressHex: string | null;
  targetLoadedPayloadAddress: number | null;
  targetLoadedPayloadAddressHex: string | null;
  targetInExecutableObject: boolean;
  targetInWritableObject: boolean;
}

export interface PaletteCandidateExactReferenceEvidence {
  totalLogicalMatches: number;
  totalUniquePhysicalOccurrences: number;
  selfOccurrenceCount: number;
  externalOccurrenceCount: number;
  externalByRepresentation: Record<PaletteRepresentationKind, number>;
  externalBySourceRegion: Record<string, number>;
  firstOccurrenceOffset: number | null;
  firstOccurrenceOffsetHex: string | null;
  lastOccurrenceOffset: number | null;
  lastOccurrenceOffsetHex: string | null;
  detailsTruncated: boolean;
  physicalDerivedReferenceCount: number;
  objectRelativeDerivedReferenceCount: number;
  linearAddressDerivedReferenceCount: number;
  addressDerivedReferenceCount: number;
  referenceProfile: CandidateReferenceProfile;
  addressDerivedReferenceFraction: number | null;
  physicalDerivedReferenceFraction: number | null;
}

export interface PaletteCandidateB2ContextEvidence {
  participationCount: number;
  clusterParticipationCount: number;
  clusterIds: string[];
  sourceRegionDistribution: Record<string, number>;
  whitelistedObject1OperandShapeCount: number;
  negativeContextCount: number;
  unmatchedShapeCount: number;
}

export interface PaletteCandidateB3StructureEvidence {
  repeatedTargetGroupParticipationCount: number;
  repeatedTargetGroupIds: string[];
  clusterParticipationCount: number;
  clusterIds: string[];
  motifClusterParticipationCount: number;
  motifClusterIds: string[];
  hasRepeatableCycleBlock: boolean;
  hasHighContextOnlyCycleConsensus: boolean;
}

export interface PaletteCandidateB4CycleEvidence {
  physicalPopulationParticipationCount: number;
  physicalPopulationIds: string[];
  cycleSpans: number[];
  cycleBlockCounts: number[];
  testedPeriodCounts: number[];
  notablePeriodCounts: number[];
  sourceRegions: string[];
  crossPopulationGroupParticipationCount: number;
  crossPopulationGroupIds: string[];
}

export interface PaletteCandidateB5HarmonicEvidence {
  populationParticipationCount: number;
  populationIds: string[];
  harmonicRelationshipsCount: number;
  confirmedRecurrenceRelationshipsCount: number;
  reducedRecurrenceRelationshipsCount: number;
  insufficientRelationshipsCount: number;
  maxCanonicalCrossHigherRecurrence: number | null;
  stableComparableLanesCount: number;
  comparableLanesCount: number;
  evidenceBearingMotifParticipation: boolean;
}

export interface PaletteCandidateMechanicalFlags {
  hasExternalReferences: boolean;
  hasAddressDerivedReferences: boolean;
  hasPhysicalDerivedReferences: boolean;
  hasStructuredReferenceEvidence: boolean;
  hasB5HarmonicEvidence: boolean;
  isVeryShortCandidate: boolean;
  zeroShiftKanoCompatible: boolean;
  targetInExecutableObject: boolean;
  targetInWritableObject: boolean;
}

export interface PaletteCandidateTensionFlags {
  referenceActiveIntrinsicWeak: boolean;
  referenceActiveKanoCompatible: boolean;
  referenceInactiveKanoCompatible: boolean;
  shortCandidateAddressActive: boolean;
  executableTargetAddressActive: boolean;
  writableTargetKanoCompatible: boolean;
  strongCatalogueNoReference: boolean;
  weakForCurrentKanoPaletteHypothesis: boolean;
  strongForCurrentKanoPaletteHypothesis: boolean;
}

export interface MK1PaletteCandidateEvidenceProfile {
  candidateId: string;
  provenance: PaletteCandidateProvenanceEvidence;
  intrinsic: PaletteCandidateIntrinsicEvidence;
  topology: PaletteCandidateTopologyEvidence;
  exactReference: PaletteCandidateExactReferenceEvidence;
  b2Context: PaletteCandidateB2ContextEvidence | null;
  b3Structure: PaletteCandidateB3StructureEvidence | null;
  b4Cycle: PaletteCandidateB4CycleEvidence | null;
  b5Harmonic: PaletteCandidateB5HarmonicEvidence | null;
  structureDepth: StructureDepthLevel;
  mechanicalFlags: PaletteCandidateMechanicalFlags;
  tensionFlags: PaletteCandidateTensionFlags;
}

export interface CatalogueB1FieldMismatch {
  candidateId: string;
  mismatchedFields: string[];
}

export interface MK1PaletteEvidenceFusionReconciliation {
  researchCandidatesInput: number;
  b1CandidateSummariesInput: number;
  candidateProfilesProduced: number;
  candidateProfilesMissingCatalogueEvidence: string[];
  candidateProfilesMissingB1Evidence: string[];
  duplicateCatalogueCandidateIds: string[];
  duplicateB1CandidateIds: string[];
  duplicateCandidateIds: string[];
  catalogueB1FieldMismatchIds: CatalogueB1FieldMismatch[];
  unexpectedUpstreamCandidateIds: string[];
  allCandidatesAccountedFor: boolean;
}

export interface PaletteEvidenceFusionGlobalCohortSummary {
  kanoCompatible_noExternalReference: number;
  kanoCompatible_externalReference: number;
  notKanoCompatible_noExternalReference: number;
  notKanoCompatible_externalReference: number;
  veryShort_externalReference: number;
  veryShort_addressDerivedReference: number;
  object1Target_externalReference: number;
  object2Target_externalReference: number;
  object1Target_kanoCompatible: number;
  object2Target_kanoCompatible: number;
  b5Participation_kanoCompatible: number | null;
  b5Participation_notKanoCompatible: number | null;
}

export type LengthBucketKey =
  | '2'
  | '3'
  | '4-7'
  | '8-15'
  | '16-23'
  | '24-31'
  | '32-63'
  | '64+';

export interface LengthBucketHistogram {
  bucketCounts: Record<LengthBucketKey, number>;
  totalCount: number;
}

export interface PaletteEvidenceFusionLengthHistograms {
  allCandidates: LengthBucketHistogram;
  referenceActiveCandidates: LengthBucketHistogram;
  noReferenceCandidates: LengthBucketHistogram;
  addressDerivedActiveCandidates: LengthBucketHistogram;
  kanoCompatibleCandidates: LengthBucketHistogram;
}

export interface TargetRegionPaletteEvidenceMatrixRow {
  regionId: string;
  regionClass: MK1ExecutableRegionClass | string;
  candidateCount: number;
  kanoCompatibleCount: number;
  externalReferenceActiveCount: number;
  addressDerivedActiveCount: number;
  b5ParticipationCount: number | null;
  veryShortCount: number;
}

export interface RepresentationCandidatePropertyMatrixRow {
  representationKind: PaletteRepresentationKind;
  candidateTargetsHit: number;
  logicalMatches: number;
  uniquePhysicalOccurrences: number;
  kanoCompatibleTargetCount: number;
  veryShortTargetCount: number;
  object1TargetCount: number;
  object2TargetCount: number;
}

export interface StructureParticipationMatrixRow {
  depthLevel: StructureDepthLevel;
  displayName: string;
  exactCandidatesCount: number;
  cumulativeCandidatesCount: number;
  kanoCompatibleCount: number;
  notKanoCompatibleCount: number;
  veryShortCount: number;
  notVeryShortCount: number;
  object1Count: number;
  object2Count: number;
}

export interface PaletteEvidenceFusionControlsAudit {
  controlTargetsInputCount: number;
  controlCandidateIdCollisions: string[];
  controlPhysicalOffsetCollisions: number[];
  controlsExcludedFromProfiles: boolean;
  excludedControlNames: string[];
}

export interface PaletteEvidenceFusionUpstreamAvailability {
  catalogueAvailable: boolean;
  catalogueResearchCandidatesCount: number | null;
  b1Available: boolean;
  b1CandidateSummariesCount: number;
  b2Available: boolean;
  b2ClustersCount: number | null;
  b3Available: boolean;
  b3RepeatedGroupsCount: number | null;
  b4Available: boolean;
  b4PhysicalPopulationsCount: number | null;
  b5Available: boolean;
  b5PhysicalPopulationsCount: number | null;
}

export interface PaletteEvidenceFusionPredicateDefinitions {
  weakForCurrentKanoPaletteHypothesis: string;
  strongForCurrentKanoPaletteHypothesis: string;
  structureDepthLevels: Record<StructureDepthLevel, string>;
  tensionFlags: Record<keyof PaletteCandidateTensionFlags, string>;
  mechanicalFlags: Record<keyof PaletteCandidateMechanicalFlags, string>;
}

export interface MK1PaletteCandidateEvidenceFusionResult {
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  failureReason?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
    cause?: unknown;
  };
  metadata: {
    operationId: string;
    timestamp: string;
    durationMs: number;
    milestone: '1E.2B.6' | '1E.2B.6a' | '1E.2B.6b';
  };
  fixture: {
    exePath: string;
    exeSize: number;
  };
  upstreamAvailability: PaletteEvidenceFusionUpstreamAvailability;
  predicateDefinitions: PaletteEvidenceFusionPredicateDefinitions;
  reconciliation: MK1PaletteEvidenceFusionReconciliation;
  globalCohortSummary: PaletteEvidenceFusionGlobalCohortSummary;
  lengthHistograms: PaletteEvidenceFusionLengthHistograms;
  targetRegionMatrix: TargetRegionPaletteEvidenceMatrixRow[];
  representationMatrix: RepresentationCandidatePropertyMatrixRow[];
  structureParticipationMatrix: StructureParticipationMatrixRow[];
  candidateProfiles: MK1PaletteCandidateEvidenceProfile[];
  controlsAudit: PaletteEvidenceFusionControlsAudit;
  interpretationCaveats: string[];
}

export interface MK1CompactCandidateEvidenceProfileExport {
  candidateId: string;
  byteStartHex: string;
  byteEndHex: string;
  length: number;
  payloadByteLength: number;
  structureByteLength: number;
  researchScore: number;
  tier: string;
  contentHash: string;
  uniqueColorCount: number | null;
  uniqueColorRatio: number | null;
  textLikeScore: number | null;
  containsLikelyAsciiData: boolean | null;
  zeroShiftKanoCompatible: boolean;
  zeroShiftCoverageMargin: number;
  duplicateContentOf?: string;
  sameContentResearchCandidateCount: number;
  isContentDuplicate: boolean;
  targetRegionId: string;
  targetRegionClass: string;
  targetObjectNumber: number | null;
  targetObjectFlags: string | null;
  targetObjectReadable: boolean;
  targetObjectWritable: boolean;
  targetObjectExecutable: boolean;
  targetInExecutableObject: boolean;
  targetInWritableObject: boolean;
  targetFileBacked: boolean;
  targetInLEObjectFileBackedData: boolean;
  targetInPhysicalPagePadding: boolean;
  targetInPostModuleTail: boolean;
  targetLoadedAddressHex: string | null;
  targetLoadedPayloadAddressHex: string | null;
  isVeryShortCandidate: boolean;
  externalOccurrenceCount: number;
  externalByRepresentation: Record<PaletteRepresentationKind, number>;
  externalBySourceRegion: Record<string, number>;
  physicalDerivedReferenceCount: number;
  objectRelativeDerivedReferenceCount: number;
  linearAddressDerivedReferenceCount: number;
  addressDerivedReferenceCount: number;
  referenceProfile: CandidateReferenceProfile;
  addressDerivedReferenceFraction: number | null;
  physicalDerivedReferenceFraction: number | null;
  b2ParticipationCount: number | null;
  b2ClusterParticipationCount: number | null;
  b3RepeatedGroupCount: number | null;
  b3ClusterCount: number | null;
  b4PopulationCount: number | null;
  b4TestedPeriodCount: number | null;
  b4NotablePeriodCount: number | null;
  b5PopulationCount: number | null;
  b5ConfirmedRecurrenceCount: number | null;
  maxCanonicalCrossHigherRecurrence: number | null;
  structureDepth: StructureDepthLevel;
  mechanicalFlags: PaletteCandidateMechanicalFlags;
  tensionFlags: PaletteCandidateTensionFlags;
}

export interface MK1CompactPaletteCandidateEvidenceFusionExport {
  format: 'mk1_palette_candidate_evidence_fusion_v1';
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  failureReason?: string;
  metadata: {
    exportTimestamp: string;
    application: string;
    version: string;
    milestone: '1E.2B.6' | '1E.2B.6a' | '1E.2B.6b';
    operationId: string;
  };
  fixture: {
    exePath: string;
    exeSize: number;
    exeSizeHex: string;
  };
  upstreamAvailability: PaletteEvidenceFusionUpstreamAvailability;
  predicateDefinitions: PaletteEvidenceFusionPredicateDefinitions;
  reconciliation: MK1PaletteEvidenceFusionReconciliation;
  globalCohortSummary: PaletteEvidenceFusionGlobalCohortSummary;
  lengthHistograms: PaletteEvidenceFusionLengthHistograms;
  targetRegionMatrix: TargetRegionPaletteEvidenceMatrixRow[];
  representationMatrix: RepresentationCandidatePropertyMatrixRow[];
  structureParticipationMatrix: StructureParticipationMatrixRow[];
  controlsAudit: PaletteEvidenceFusionControlsAudit;
  interpretationCaveats: string[];
  candidateProfiles: MK1CompactCandidateEvidenceProfileExport[];
}
