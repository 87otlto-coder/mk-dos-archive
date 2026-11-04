/**
 * MK1 Executable Palette Operand Address-Space Compatibility &
 * Bounded Straight-Line Seed-Use Reconnaissance Types (Milestone 1E.2B.8a)
 *
 * Investigates code-facing operand values (direct B.2 sites and B.7 second-order endpoints)
 * to determine address-space membership and immediate straight-line usage without
 * assuming palette consumer or loader semantics.
 *
 * Standing Epistemic Axioms:
 * 1. NUMERIC EQUALITY != ADDRESS EQUALITY.
 * 2. MOV EAX, 0x2000 does NOT prove 0x2000 is an address.
 * 3. A direct [disp32] memory operand provides stronger address-shape evidence,
 *    but even that must be checked against the LE loaded-address model.
 * 4. STRAIGHT-LINE RECONNAISSANCE ONLY: Stop at control-transfer boundaries.
 *    No CFG, no branch traversal, no call-target inspection, no VGA I/O scanning.
 * 5. NO SEMANTIC CLAIMS: Do NOT claim "palette consumer", "palette loader", or "pointer table".
 * 6. CALL TARGET NUMERIC REGION != VERIFIED EXECUTION DESTINATION SEMANTICS:
 *    A near rel32 CALL target is classified topographically without following the call target.
 */

import { MK1ExecutableRegionClass } from './executableRegionTopology';
import { PaletteRepresentationKind } from './paletteReferenceReconnaissanceTypes';
import { X86OperandShapeClass } from './paletteOccurrenceContextTypes';

export type X86Register32 =
  | 'EAX'
  | 'ECX'
  | 'EDX'
  | 'EBX'
  | 'ESP'
  | 'EBP'
  | 'ESI'
  | 'EDI';

export type MK1CodeFacingSourceKind =
  | 'direct-candidate-first-hop'
  | 'two-hop-site-code-facing';

export type MK1OperandSemanticClass =
  | 'register-immediate-seed'
  | 'push-immediate-value'
  | 'accumulator-arithmetic-immediate'
  | 'direct-memory-load-address'
  | 'direct-memory-store-address'
  | 'lea-address-computation'
  | 'other-whitelisted-immediate';

export type MK1LinearAddressResolutionClass =
  | 'exact-associated-structure-linear'
  | 'exact-associated-payload-linear'
  | 'resolves-other-loaded-location'
  | 'linear-address-unmapped'
  | 'segment-override-unresolved'
  | 'not-applicable-non-address-operand';

export type MK1SeedTraceStatus =
  | 'seed-traced-to-call'
  | 'seed-traced-to-jump'
  | 'seed-traced-to-branch'
  | 'seed-traced-to-return'
  | 'seed-traced-to-memory-access'
  | 'seed-overwritten-before-use'
  | 'seed-traced-to-unsupported-opcode'
  | 'seed-traced-to-size-override'
  | 'seed-traced-to-max-bytes'
  | 'seed-traced-to-max-instructions'
  | 'seed-traced-to-object-boundary'
  | 'not-applicable-direct-memory-operand'
  | 'not-applicable-arithmetic-immediate'
  | 'not-applicable-push-immediate'
  | 'not-applicable-non-seed-operand';

export type MK1TraceStopReason =
  | 'call-boundary'
  | 'jump-boundary'
  | 'conditional-branch-boundary'
  | 'return-boundary'
  | 'memory-access-observed'
  | 'seed-no-longer-live'
  | 'unsupported-opcode'
  | 'unsupported-size-override'
  | 'max-bytes-reached'
  | 'max-instructions-reached'
  | 'object-boundary-reached';

export type MK1PropagationEventType =
  | 'seed-copied-to-register'
  | 'affine-adjustment'
  | 'relocation-base-adjustment'
  | 'target-coordinate-value-reached'
  | 'target-compatible-memory-address'
  | 'seed-used-as-memory-base'
  | 'seed-used-as-memory-index'
  | 'partial-memory-address-use'
  | 'seed-pushed-before-boundary'
  | 'seed-overwritten'
  | 'seed-used-non-affine'
  | 'seed-live-at-call'
  | 'seed-live-at-jump'
  | 'seed-live-at-branch'
  | 'seed-live-at-return';

export interface X86RegisterState {
  register: X86Register32;
  isTrackingSeed: boolean;
  exactValueKnown: boolean;
  exactValue: number;
  exactValueHex: string;
  affineSeedDelta: number;
}

export interface MK1PropagationEvent {
  instructionIndex: number;
  instructionOffset: number;
  instructionOffsetHex: string;
  mnemonic: string;
  eventType: MK1PropagationEventType;
  sourceRegister?: X86Register32;
  destinationRegister?: X86Register32;
  immediateAdjustment?: number;
  resultingValue?: number;
  resultingValueHex?: string;
  effectiveAddress?: number;
  effectiveAddressHex?: string;
  description: string;
}

export type MK1CallTargetTopologyClass =
  | 'target-offset-within-source-object'
  | 'target-offset-outside-source-object'
  | 'numeric-linear-target-resolves-other-object'
  | 'numeric-linear-target-unmapped';

export interface MK1CallBoundaryTargetRecon {
  sourceInstructionPhysicalOffset: number;
  sourceInstructionPhysicalOffsetHex: string;
  sourceObjectNumber: number;
  sourceObjectOffset: number;
  sourceObjectOffsetHex: string;
  sourceLoadedLinearCandidate: number;
  sourceLoadedLinearCandidateHex: string;
  rel32Displacement: number;
  rel32DisplacementHex: string;
  nextInstructionObjectOffset: number;
  nextInstructionObjectOffsetHex: string;
  targetObjectOffset: number;
  targetObjectOffsetHex: string;
  targetLoadedLinearCandidate: number;
  targetLoadedLinearCandidateHex: string;
  targetOffsetWithinSourceObjectVirtualRange: boolean;
  targetOffsetWithinSourceObjectFileBackedRange: boolean;
  targetLinearRegionId: string;
  targetLinearRegionClass: string;
  targetLinearObjectNumber: number | null;
  targetLinearObjectFlags: number | null;
  targetLinearObjectReadable: boolean | null;
  targetLinearObjectWritable: boolean | null;
  targetLinearObjectExecutable: boolean | null;
  targetLinearObjectOffset: number | null;
  targetLinearObjectOffsetHex: string | null;
  targetLinearPhysicalBackingOffset: number | null;
  targetLinearPhysicalBackingOffsetHex: string | null;
  physicalBackingAvailable: boolean;
  targetTopologyClassification: MK1CallTargetTopologyClass;
}

export interface MK1DecodedTraceInstruction {
  index: number;
  fileOffset: number;
  fileOffsetHex: string;
  objectOffset: number;
  objectOffsetHex: string;
  loadedAddress: number;
  loadedAddressHex: string;
  length: number;
  rawBytesHex: string;
  opcodeHex: string;
  mnemonic: string;
  modRMHex?: string;
  sibHex?: string;
  dispValue?: number;
  dispValueHex?: string;
  immValue?: number;
  immValueHex?: string;
  isBarrier: boolean;
  barrierType?: 'call' | 'jump' | 'branch' | 'return';
  registerStateAfter: Record<X86Register32, X86RegisterState>;
  events: MK1PropagationEvent[];
  callBoundaryTargetRecon?: MK1CallBoundaryTargetRecon;
}

export interface MK1SeedTraceResult {
  seedSiteOffset: number;
  seedSiteOffsetHex: string;
  seedInstructionOffset: number;
  seedInstructionOffsetHex: string;
  seedInstructionLength: number;
  seedInstructionMnemonic: string;
  seedRegister: X86Register32;
  initialSeedValue: number;
  initialSeedValueHex: string;
  traceStartOffset: number;
  traceStartOffsetHex: string;
  traceEndOffset: number;
  traceEndOffsetHex: string;
  totalBytesExamined: number;
  totalInstructionsDecoded: number;
  stopReason: MK1TraceStopReason;
  stopOffset: number;
  stopOffsetHex: string;
  stopInstructionMnemonic?: string;
  stopOpcodeHex?: string;
  status: MK1SeedTraceStatus;

  // High-level trace indicators
  seedLiveAtBoundary: boolean;
  boundaryType?: 'call' | 'jump' | 'branch' | 'return';
  boundaryTargetHex?: string;

  // Orthogonal event flags
  seedCopied: boolean;
  seedAffineAdjusted: boolean;
  seedRelocationBaseAdjusted: boolean;
  seedUsedAsMemoryBase: boolean;
  seedUsedAsMemoryIndex: boolean;
  seedUsedInMemoryAccess?: boolean;
  seedPartialMemoryAddressUse: boolean;
  seedTargetCoordinateValueReached: boolean;
  seedTargetCompatibleMemoryAddressObserved: boolean;
  seedPushed: boolean;
  seedOverwritten: boolean;
  seedLiveAtCallBoundary: boolean;

  // CALL boundary target reconnaissance
  callBoundaryTargetRecon?: MK1CallBoundaryTargetRecon;

  // Detailed instruction trace
  instructions: MK1DecodedTraceInstruction[];
  events: MK1PropagationEvent[];
}

export interface MK1ObjectRelativeCompatibility {
  isObjectRelativeOperand: boolean;
  operandUint32Value: number;
  operandUint32Hex: string;
  associatedRepresentationKind: PaletteRepresentationKind | 'first-hop-site-offset';
  targetCandidateObjectNumber: number | null;
  targetObjectRelocationBase: number | null;
  targetObjectRelocationBaseHex: string | null;
  associatedTargetLoadedAddress: number | null;
  associatedTargetLoadedAddressHex: string | null;
  requiredBaseToReachTargetLoadedAddress: number | null;
  requiredBaseHex: string | null;
  requiredBaseEqualsTargetObjectRelocationBase: boolean;
  equalsAssociatedObjectRelativeStructure: boolean;
  equalsAssociatedObjectRelativePayload: boolean;
}

export interface MK1OperandInterpretationRecord {
  interpretationId: string;
  sourceKind: MK1CodeFacingSourceKind;
  siteFileOffset: number;
  siteFileOffsetHex: string;
  siteObjectNumber: number;
  siteObjectOffset: number;
  siteObjectOffsetHex: string;
  siteLoadedAddress: number;
  siteLoadedAddressHex: string;
  siteRegionId: string;

  // Instruction shape details
  shapeClass: X86OperandShapeClass;
  mnemonicHint: string;
  instructionFileOffset: number;
  instructionFileOffsetHex: string;
  instructionLength: number;
  opcodeBytesHex: string;
  operandFieldOffset: number;
  operandFieldOffsetHex: string;
  operandUint32Value: number;
  operandUint32Hex: string;

  // Associated candidate / target
  associatedCandidateId: string | null;
  associatedRepresentationKind: PaletteRepresentationKind | 'first-hop-site-offset';
  targetCandidateRegionId?: string;
  targetCandidateObjectNumber?: number | null;
  targetCandidateLoadedStructureHex?: string | null;
  targetCandidateLoadedPayloadHex?: string | null;
  targetCandidatePhysicalStructure?: number | null;
  targetCandidatePhysicalStructureHex?: string | null;
  targetCandidatePhysicalPayload?: number | null;
  targetCandidatePhysicalPayloadHex?: string | null;
  targetFirstHopSiteId?: string | null;
  targetFirstHopSiteOffsetHex?: string | null;

  // Semantic classification
  semanticClass: MK1OperandSemanticClass;
  destinationRegister: X86Register32 | null;
  hasSegmentOverride: boolean;
  segmentOverridePrefixHex: string | null;
  dereferenceShapePresent: boolean;
  dereferencePerformed: boolean;
  memoryAccessEncodedByInterpretation: boolean;

  // Address-space compatibility: direct linear
  directLinearResolution: MK1LinearAddressResolutionClass;
  directLinearResolvedObjectNumber: number | null;
  directLinearResolvedObjectOffset: number | null;
  directLinearResolvedObjectOffsetHex: string | null;
  directLinearResolvedPhysicalOffset: number | null;
  directLinearResolvedPhysicalOffsetHex: string | null;
  directLinearResolvedRegionId: string | null;
  directLinearMatchesAssociatedTarget: boolean;

  // Address-space compatibility: object-relative
  objectRelativeCompatibility: MK1ObjectRelativeCompatibility;

  // Straight-line seed-use trace
  seedTraceStatus: MK1SeedTraceStatus;
  seedTrace: MK1SeedTraceResult | null;
}

export interface MK1CodeFacingSiteRecord {
  siteId: string;
  sourceKind: MK1CodeFacingSourceKind;
  fileOffset: number;
  fileOffsetHex: string;
  objectNumber: number;
  objectOffset: number;
  objectOffsetHex: string;
  loadedAddress: number;
  loadedAddressHex: string;
  regionId: string;
  regionClass: MK1ExecutableRegionClass | string;
  matchedUint32Value: number;
  matchedUint32Hex: string;
  associatedCandidateIds: string[];
  associatedRepresentationKinds: string[];
  shapeCount: number;
  interpretations: MK1OperandInterpretationRecord[];
}

export interface MK1OperandUseReconciliation {
  b2PositivePhysicalSitesInput: number;
  b2PositiveShapeInterpretationsInput: number;
  b8DirectPhysicalSitesProduced: number;
  b8DirectInterpretationsProduced: number;
  b7PositiveSecondOrderSitesInput: number;
  b8TwoHopSitesProduced: number;
  b8TwoHopInterpretationsProduced: number;
  directSiteIdsMissing: string[];
  unexpectedDirectSiteIds: string[];
  shapeInterpretationsMissing: string[];
  candidateAssociationsMissing: string[];
  seedTraceEligibleInterpretations: number;
  seedTraceResultsProduced: number;
  callBoundaryTraces: number;
  callBoundarySummariesProduced: number;
  controlsInjectedIntoPositiveCounts: number;
  allDirectSitesAccountedFor: boolean;
  allShapeInterpretationsAccountedFor: boolean;
  allSeedTracesAccountedFor: boolean;
  allCallBoundariesAccountedFor: boolean;

  // Milestone 1E.2B.8a.1 Extended Invariants
  candidateSummariesReconciled: boolean;
  candidateSummaryDirectSitesReconciled: boolean;
  candidateSummaryInterpretationsReconciled: boolean;
  candidateSummarySeedsReconciled: boolean;
  candidateSummaryCallsReconciled: boolean;
  physicalCandidateCoordinatesReconciled: boolean;
  decisionPatternTableReconciled: boolean;
  relocationObservationCountsReconciled: boolean;
  fixtureObservationsDerived: boolean;
  derivedEvidenceReconciled: boolean;

  allReconciled: boolean;
}

export interface MK1OperandUseGlobalSummary {
  totalUniquePhysicalSites: number;
  directCandidateFirstHopSites: number;
  twoHopCodeFacingSites: number;
  totalPositiveInterpretations: number;
  directPositiveInterpretations: number;
  twoHopPositiveInterpretations: number;

  // Semantic class distribution
  semanticCounts: Record<MK1OperandSemanticClass, number>;

  // Linear resolution distribution
  linearResolutionCounts: Record<MK1LinearAddressResolutionClass, number>;
  directLinearMatchesTargetCount: number;
  directLinearResolvesOtherCount: number;
  directLinearUnmappedCount: number;

  // Object-relative distribution
  objectRelativeCount: number;
  objectRelativeRelocationBaseMatchedCount: number;

  // Seed trace distribution
  seedTracesAttempted: number;
  seedTracesReachingCall: number;
  seedTracesReachingJump: number;
  seedTracesReachingBranch: number;
  seedTracesReachingReturn: number;
  seedTracesReachingMemoryAccess: number;
  seedTracesOverwrittenBeforeUse: number;
  seedTracesUnsupportedOpcode: number;
  seedTracesSizeOverride: number;
  seedTracesMaxBytes: number;
  seedTracesMaxInstructions: number;
  seedTracesTargetCompatibleMemoryAddress: number;
  seedTracesRelocationBaseAdjusted: number;
}

export interface MK1CallBoundarySummary {
  callBoundaryCount: number;
  distinctCallTargetCount: number;
  callTargetsWithinSourceObjectVirtualRange: number;
  callTargetsWithinSourceObjectFileBackedRange: number;
  callTargetsOutsideSourceObjectVirtualRange: number;
  numericTargetsResolvingSourceObject: number;
  numericTargetsResolvingOtherObject: number;
  numericTargetsUnmapped: number;
}

export interface MK1CallBoundaryTargetGroup {
  groupId: string;
  boundaryTargetLinear: number;
  boundaryTargetLinearHex: string;
  sourceKind: MK1CodeFacingSourceKind;
  seedValue: number;
  seedValueHex: string;
  associatedTargetId: string;
  destinationRegister: X86Register32;
  traceCount: number;
  sourceSiteIds: string[];
  candidateIds: string[];
  targetTopologyClassification: MK1CallTargetTopologyClass;
  targetLinearRegionId: string;
  targetLinearObjectNumber: number | null;
  targetLinearPhysicalBackingOffsetHex: string | null;
  withinSourceObjectVirtualRange: boolean;
  withinSourceObjectFileBackedRange: boolean;
}

export interface MK1LocalSeedUseSignatureGroup {
  signatureId: string;
  initialSeedValue: number;
  initialSeedValueHex: string;
  destinationRegister: X86Register32;
  normalizedEvents: string[];
  stopReason: MK1TraceStopReason;
  callBoundaryTargetHex?: string;
  memberCount: number;
  memberInterpretationIds: string[];
  memberSiteOffsetsHex: string[];
}

export interface MK1CandidateOperandUseSummary {
  candidateId: string;
  targetPhysicalAddressHex: string;
  sourceClass: string;
  physicalStructureOffsetHex: string;
  physicalPayloadOffsetHex: string;
  loadedLinearStructureCandidateHex: string;
  loadedLinearPayloadCandidateHex: string;
  directSiteCount: number;
  interpretationCount: number;
  associatedDirectSiteCount: number;
  associatedInterpretationCount: number;
  associatedSeedCount: number;
  associatedCallBoundaryCount: number;
  relocationAdjustmentsObserved: number;
  shapeHistogram: Record<string, number>;
  semanticHistogram: Record<string, number>;
  representationHistogram: Record<string, number>;
  directLinearOutcomes: Record<string, number>;
  objectRelativeBaseMatches: number;
  seedCount: number;
  traceStopReasons: Record<string, number>;
  memoryUseCounts: {
    memoryBase: number;
    memoryIndex: number;
    partialMemory: number;
    targetCompatibleMemory: number;
  };
  relocationAdjustmentCounts: number;
  callBoundaryCount: number;
  distinctCallBoundaryTargets: string[];
  sourceObjectTargetRangeDistribution: {
    withinSourceObjectVirtualRange: number;
    withinSourceObjectFileBackedRange: number;
    outsideSourceObjectVirtualRange: number;
  };
}

export interface MK1TwoHopTargetSummary {
  targetFirstHopSiteId: string;
  targetFirstHopSiteOffsetHex: string;
  twoHopSiteCount: number;
  interpretationCount: number;
  shapeHistogram: Record<string, number>;
  semanticHistogram: Record<string, number>;
  seedCount: number;
  traceStopReasons: Record<string, number>;
  callBoundaryCount: number;
  distinctCallBoundaryTargets: string[];
  targetTopologyClassificationDistribution: Record<string, number>;
}

export interface MK1AddressSpaceMatrix {
  rows: ('physical' | 'object-relative' | 'linear' | 'site-physical')[];
  columns: (
    | 'register-immediate'
    | 'push-immediate'
    | 'arithmetic-immediate'
    | 'direct-load'
    | 'direct-store'
    | 'lea'
  )[];
  matrix: Record<string, Record<string, number>>;
}

export interface MK1SeedTraceEventSummary {
  seedCopied: number;
  seedAffineAdjusted: number;
  seedRelocationBaseAdjusted: number;
  seedUsedAsMemoryBase: number;
  seedUsedAsMemoryIndex: number;
  seedPartialMemoryAddressUse: number;
  seedTargetCoordinateValueReached: number;
  seedTargetCompatibleMemoryAddressObserved: number;
  seedPushed: number;
  seedOverwritten: number;
  seedLiveAtCallBoundary: number;
}

export interface MK1DecisionPatternTableRow {
  patternId: string;
  description: string;
  matchedCount: number;
  matchedInterpretationCount: number;
  matchingSiteCount: number;
  matchingSiteIds: string[];
}

export interface MK1OperandUseControls {
  b2NegativeRelativeControlsCount: number;
  b7NegativeSecondOrderRelativeControlsCount: number;
  control0x9C914Present: boolean;
  controlsExcludedFromPositiveCounts: boolean;
  details: string[];
}

export interface MK1OperandUseUpstreamSummary {
  layoutAvailable: boolean;
  b2Status: string;
  b2PositivePhysicalSites: number;
  b2PositiveShapeInterpretations: number;
  b6Status: string;
  b6CandidateCount: number;
  b7Status: string;
  b7PositiveSecondHopReferrerCount: number;
}

export interface MK1TraceConfiguration {
  maxBytes: 48;
  maxInstructions: 12;
  straightLineOnly: true;
  followsCalls: false;
  followsBranches: false;
  microDecoder: true;
  stopOnUnsupported: true;
  addressMode: '32-bit';
  objectConstraint: 'Object 1';
}

export interface MK1PaletteOperandUseResult {
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string;
  failedStage?: string;
  metadata: {
    operationId: string;
    timestamp: string;
    durationMs: number;
    milestone: '1E.2B.8a' | '1E.2B.8a.2';
  };
  fixture: {
    exePath: string;
    exeSize: number;
    exeSizeHex: string;
  };
  traceConfiguration: MK1TraceConfiguration;
  upstreamSummary: MK1OperandUseUpstreamSummary;
  reconciliation: MK1OperandUseReconciliation;
  globalSummary: MK1OperandUseGlobalSummary;
  addressSpaceMatrix: MK1AddressSpaceMatrix;
  shapeSummary: Record<string, number>;
  operandSemanticSummary: Record<MK1OperandSemanticClass, number>;
  seedTraceEventSummary: MK1SeedTraceEventSummary;
  seedTraceStopReasonSummary: Record<string, number>;
  callBoundarySummary: MK1CallBoundarySummary;
  callBoundaryTargetGroups: MK1CallBoundaryTargetGroup[];
  localSeedUseSignatureGroups: MK1LocalSeedUseSignatureGroup[];
  candidateSummaries: MK1CandidateOperandUseSummary[];
  twoHopTargetSummaries: MK1TwoHopTargetSummary[];
  sites: MK1CodeFacingSiteRecord[];
  interpretations: MK1OperandInterpretationRecord[];
  boundedTraceDetails: MK1SeedTraceResult[];
  controls: MK1OperandUseControls;
  decisionPatternTable: MK1DecisionPatternTableRow[];
  interpretationCaveats: string[];
  fixtureObservations: string[];
}

export interface MK1CompactPaletteOperandUseExport {
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string;
  failedStage?: string;
  metadata: {
    formatVersion: 'mk1_palette_operand_use_recon_v1';
    exportTimestamp: string;
    application: string;
    version: string;
    milestone: '1E.2B.8a' | '1E.2B.8a.2';
    operationId: string;
  };
  fixture: {
    exePath: string;
    exeSize: number;
    exeSizeHex: string;
  };
  traceConfiguration: MK1TraceConfiguration;
  upstreamSummary: MK1OperandUseUpstreamSummary;
  reconciliation: MK1OperandUseReconciliation;
  globalSummary: MK1OperandUseGlobalSummary;
  addressSpaceMatrix: MK1AddressSpaceMatrix;
  shapeSummary: Record<string, number>;
  operandSemanticSummary: Record<MK1OperandSemanticClass, number>;
  seedTraceEventSummary: MK1SeedTraceEventSummary;
  seedTraceStopReasonSummary: Record<string, number>;
  callBoundarySummary: MK1CallBoundarySummary;
  callBoundaryTargetGroups: MK1CallBoundaryTargetGroup[];
  localSeedUseSignatureGroups: MK1LocalSeedUseSignatureGroup[];
  candidateSummaries: MK1CandidateOperandUseSummary[];
  twoHopTargetSummaries: MK1TwoHopTargetSummary[];
  sites: MK1CodeFacingSiteRecord[];
  interpretations: MK1OperandInterpretationRecord[];
  boundedTraceDetails: MK1SeedTraceResult[];
  controls: MK1OperandUseControls;
  decisionPatternTable: MK1DecisionPatternTableRow[];
  interpretationCaveats: string[];
  fixtureObservations: string[];
}
