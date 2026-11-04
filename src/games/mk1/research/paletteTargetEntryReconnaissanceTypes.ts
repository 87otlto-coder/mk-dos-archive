/**
 * MK1 Executable Palette Target-Boundary & Incoming-EAX Consumption Qualification Types
 *
 * Milestone 1 — Pass 1E.2B.9a.1: B.9 Final Evidence-Contract Closure
 *
 * Artifact format: mk1_palette_target_entry_recon_v2
 * Canonical export: mk1_palette_target_entry_recon_YYYY-MM-DDTHH-mm-ss-sssZ.json
 *
 * Central Epistemic Rules:
 *   TARGET ADDRESS != FUNCTION.
 *   EAX LIVE AT CALL != FUNCTION ARGUMENT.
 *   EAX READ AFTER CALL != PALETTE INPUT.
 *   OBJECT-RELATIVE COORDINATE != POINTER.
 *   NUMERIC TARGET REGION != VERIFIED EXECUTION SEMANTICS.
 */

import { X86Register32 } from './paletteOperandUseReconnaissanceTypes';

export type MK1TargetBoundaryClassification =
  | 'verified-instruction-boundary'
  | 'plausible-instruction-boundary'
  | 'mid-instruction-misaligned'
  | 'unmapped-or-invalid';

export type MK1IncomingEAXDisposition =
  | 'preserved-to-control-boundary-without-read'
  | 'read-before-overwrite'
  | 'overwritten-before-read'
  | 'preserved-unaccessed-to-barrier'
  | 'barrier-reached-before-access'
  | 'misaligned-entry-no-decode';

export type MK1TargetEntryEventType =
  | 'eax-read-memory-base'
  | 'eax-read-memory-index'
  | 'eax-read-alu-source'
  | 'eax-read-cmp-source'
  | 'eax-read-test-source'
  | 'eax-copied-to-register'
  | 'eax-pushed-to-stack'
  | 'eax-affine-adjusted'
  | 'eax-bitwise-modified'
  | 'eax-target-coordinate-reached'
  | 'eax-overwritten'
  | 'eax-live-at-barrier';

export interface MK1TargetEntryEvent {
  instructionIndex: number;
  instructionOffset: number;
  instructionOffsetHex: string;
  mnemonic: string;
  eventType: MK1TargetEntryEventType;
  sourceRegister?: X86Register32;
  destinationRegister?: X86Register32;
  effectiveAddress?: number;
  effectiveAddressHex?: string;
  immediateAdjustment?: number;
  resultingValue?: number;
  resultingValueHex?: string;
  description: string;
}

export interface MK1RegisterEntryState {
  register: X86Register32;
  isTrackingSeed: boolean;
  exactValueKnown: boolean;
  exactValue: number;
  exactValueHex: string;
}

export interface MK1TargetTraceInstruction {
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
  barrierType?: 'call' | 'branch' | 'jump' | 'return' | 'interrupt' | 'unsupported' | 'limit';
  eaxEvents: MK1TargetEntryEvent[];
  registerStateAfter: Record<X86Register32, MK1RegisterEntryState>;
}

export interface MK1TargetEntrySeedClass {
  candidateId: string;
  seedRegister: X86Register32;
  seedValue: number;
  seedValueHex: string;
  targetLinear: number;
  targetLinearHex: string;
  targetObjectOffset: number;
  targetObjectOffsetHex: string;
  targetPhysicalOffset: number;
  targetPhysicalOffsetHex: string;
  qualifyingCallerCount: number;
  callerSiteOffsets: number[];
  callerSiteOffsetsHex: string[];
  // Derived coordinates from authoritative B.8 evidence
  candidatePhysicalStructure: number;
  candidatePhysicalStructureHex: string;
  candidatePhysicalPayload: number;
  candidatePhysicalPayloadHex: string;
  candidateObjectNumber: number;
  candidateObjectRelativeStructure: number;
  candidateObjectRelativeStructureHex: string;
  candidateObjectRelativePayload: number;
  candidateObjectRelativePayloadHex: string;
  candidateLoadedStructure: number;
  candidateLoadedStructureHex: string;
  candidateLoadedPayload: number;
  candidateLoadedPayloadHex: string;
  relocationBase: number;
  relocationBaseHex: string;
}

export interface MK1VerifiedCallerRecord {
  callerIndex: number;
  candidateId: string;
  seedInstructionPhysicalOffset: number;
  seedInstructionPhysicalOffsetHex: string;
  seedOperandFieldPhysicalOffset: number;
  seedOperandFieldPhysicalOffsetHex: string;
  callInstructionPhysicalOffset: number;
  callInstructionPhysicalOffsetHex: string;
  callLoadedAddress: number;
  callLoadedAddressHex: string;
  callLength: number;
  returnLoadedAddress: number;
  returnLoadedAddressHex: string;
  returnObjectRelativeAddress: number;
  returnObjectRelativeAddressHex: string;
  callTargetLoadedAddress: number;
  callTargetLoadedAddressHex: string;
  targetMinusReturn: number;
}

export interface MK1CallerReturnRelation {
  callerIndex: number;
  callerSiteOffsetHex: string;
  callInstructionOffsetHex: string;
  returnLoadedAddress: number;
  returnLoadedAddressHex: string;
  targetMinusReturn: number;
  returnDecodes: boolean;
  returnInstruction: string | null;
  returnInstructionMnemonic: string | null;
  returnInstructionLength: number | null;
  returnDecodeStatus:
    | 'valid-instruction-boundary'
    | 'unsupported-instruction'
    | 'decoding-failed'
    | 'not-examined-distant';
  returnInstructionEndsAtTarget: boolean;
  isSafeNonFallThroughBoundary: boolean;
  isNearReturn: boolean;
  overlapClassification:
    | 'distinct-non-overlapping'
    | 'target-inside-return'
    | 'return-inside-target'
    | 'overlapping'
    | 'distant-non-overlapping'
    | 'not-examined-distant';
}

export interface MK1TargetRawWindow {
  preBytesHex: string; // 16 bytes: [-16..-1]
  postBytesHex: string; // 96 bytes: [0..95]
  targetByteHex: string;
}

export interface MK1TargetBoundaryRecon {
  targetLinear: number;
  targetLinearHex: string;
  objectNumber: number;
  objectOffset: number;
  objectOffsetHex: string;
  physicalOffset: number;
  physicalOffsetHex: string;
  regionId: string;
  regionClass: string;
  isAddressable: boolean;
  isFileBacked: boolean;
  isReadable: boolean;
  isWritable: boolean;
  isExecutable: boolean;
  targetByteHex: string;
  precedingBytesHex: string; // 16 bytes: [-16..-1]
  followingBytesHex: string; // 96 bytes: [+0..+95]
  precedingDecodesToBoundary: boolean;
  forwardDecodeValid: boolean;
  forwardFirstInstructionMnemonic?: string;
  forwardFirstInstructionLength?: number;
  nearReturnCoordinate?: number;
  nearReturnCoordinateHex?: string;
  targetMinusReturn?: number;
  nearReturnStartDecodes?: boolean;
  nearReturnInstruction?: string;
  nearReturnInstructionLength?: number;
  nearReturnEndAddress?: number;
  nearReturnEndAddressHex?: string;
  targetStartDecodes?: boolean;
  returnInstructionEndsAtTarget?: boolean;
  targetInsideReturnInstruction?: boolean;
  returnInsideTargetInstruction?: boolean;
  decodedRangesOverlap?: boolean;
  overlapClassification?: string;
  boundaryClassification: MK1TargetBoundaryClassification;
  notes: string[];
}

export interface MK1FinalControlBoundary {
  boundaryType: 'call' | 'branch' | 'jump' | 'return' | 'interrupt' | 'unsupported' | 'limit';
  boundaryInstructionOffset: number;
  boundaryInstructionOffsetHex: string;
  boundaryInstructionLoadedAddress: number;
  boundaryInstructionLoadedAddressHex: string;
  boundaryInstructionMnemonic: string;
  boundaryTargetLoadedAddress: number | null;
  boundaryTargetLoadedAddressHex: string | null;
  seedLiveAtBoundary: boolean;
  seedDerivedRegistersLiveAtBoundary: X86Register32[];
  notes: string[];
}

export interface MK1B8TargetGroupMatch {
  targetAddress: number;
  targetAddressHex: string;
  seedRegister: X86Register32;
  seedValue: number;
  seedValueHex: string;
}

export interface MK1B8BoundaryTargetCrossReference {
  finalBoundaryTargetLoaded: number | null;
  finalBoundaryTargetLoadedHex: string | null;
  boundaryTargetAppearsInB8TargetGroups: boolean;
  matchingB8TargetGroupCount: number;
  matchingB8TargetGroups: MK1B8TargetGroupMatch[];
  notes: string[];
}

export interface MK1SeedEventModel {
  incomingSeedEverRead: boolean;
  incomingSeedOverwrittenBeforeRead: boolean;
  incomingSeedCopied: boolean;
  incomingSeedAffineAdjusted: boolean;
  relocationBaseAdjustmentObserved: boolean;
  candidateLoadedStructureReached: boolean;
  candidateLoadedPayloadReached: boolean;
  seedUsedAsMemoryBase: boolean;
  seedUsedAsMemoryIndex: boolean;
  partialMemoryAddressObserved: boolean;
  candidateStructureMemoryAddressObserved: boolean;
  candidatePayloadMemoryAddressObserved: boolean;
  seedPushed: boolean;
  seedStored: boolean;
  seedCompared: boolean;
  seedTested: boolean;
  seedLiveAtFinalBoundary: boolean;
}

export interface MK1TargetTraceResult {
  startLinear: number;
  startLinearHex: string;
  startPhysical: number;
  startPhysicalHex: string;
  incomingEAX: number;
  incomingEAXHex: string;
  instructions: MK1TargetTraceInstruction[];
  totalBytesDecoded: number;
  stopReason: string;
  stopOpcodeHex?: string;
  disposition: MK1IncomingEAXDisposition;
  finalControlBoundary: MK1FinalControlBoundary | null;
  b8BoundaryTargetCrossReference: MK1B8BoundaryTargetCrossReference | null;
  seedEvents: MK1SeedEventModel;
  // Kept for backward compatibility
  eaxReadBeforeOverwrite: boolean;
  eaxOverwrittenBeforeRead: boolean;
  eaxUsedAsMemoryBase: boolean;
  eaxUsedAsMemoryIndex: boolean;
  eaxCopied: boolean;
  eaxPushed: boolean;
  eaxAffineAdjusted: boolean;
  eaxTargetCoordinateReached: boolean;
  allEvents: MK1TargetEntryEvent[];
}

export interface MK1RawE8ExactTargetMatch {
  fileOffset: number;
  fileOffsetHex: string;
  objectOffset: number;
  objectOffsetHex: string;
  loadedAddress: number;
  loadedAddressHex: string;
  rel32: number;
  rel32Hex: string;
  calculatedTarget: number;
  calculatedTargetHex: string;
  isVerifiedB8CallerBoundary: boolean;
  matchClassification: 'verified-b8-caller-boundary' | 'raw-target-matching-e8-encoding';
}

export interface MK1RawE8NullModelResult {
  rawE8OpcodesSeen: number;
  rawE8Rel32DecodableCount: number;
  rawExactTargetMatchCount: number;
  verifiedB8CallBoundaryMatchCount: number;
  rawOnlyExactTargetMatchCount: number;
  verifiedB8CallOffsetsExpected: number[];
  verifiedB8CallOffsetsExpectedHex: string[];
  verifiedB8CallOffsetsFound: number[];
  verifiedB8CallOffsetsFoundHex: string[];
  verifiedB8CallOffsetsMissing: number[];
  verifiedB8CallOffsetsMissingHex: string[];
  rawE8ExactTargetMatches: MK1RawE8ExactTargetMatch[];
  scanRangeStartPhysicalHex: string;
  scanRangeEndPhysicalHex: string;
  scanRangeBytes: number;
}

export interface MK1CallerVerifiedCoreSequence {
  seedInstructionPhysicalOffset: number;
  seedInstructionPhysicalOffsetHex: string;
  seedInstructionMnemonic: string;
  seedImmediate: number;
  seedImmediateHex: string;
  callInstructionPhysicalOffset: number;
  callInstructionPhysicalOffsetHex: string;
  callLoadedCoordinate: number;
  callLoadedCoordinateHex: string;
  actualRel32: number;
  actualRel32Hex: string;
  actualTarget: number;
  actualTargetHex: string;
  returnCoordinate: number;
  returnCoordinateHex: string;
  seedInstruction?: {
    physicalOffset: number;
    physicalOffsetHex: string;
    opcodeHex: string;
    instructionMnemonic: string;
    destinationRegister: string;
    immediateValue: number;
    immediateValueHex: string;
  };
  callInstruction?: {
    physicalOffset: number;
    physicalOffsetHex: string;
    opcodeHex: string;
    instructionMnemonic: string;
    targetLoadedAddress: number;
    targetLoadedAddressHex: string;
    callLength: number;
  };
  returnCoordinateObj?: {
    returnLoadedAddress: number;
    returnLoadedAddressHex: string;
    returnObjectRelativeAddress: number;
    returnObjectRelativeAddressHex: string;
  };
}

export interface MK1CallerContextRecord {
  callerIndex: number;
  seedInstructionPhysicalOffset: number;
  seedInstructionPhysicalOffsetHex: string;
  callInstructionPhysicalOffset: number;
  callInstructionPhysicalOffsetHex: string;
  returnLoadedAddress: number;
  returnLoadedAddressHex: string;
  windowStartOffset: number;
  windowStartOffsetHex: string;
  windowEndOffset: number;
  windowEndOffsetHex: string;
  rawBytesHex: string;
  verifiedCore: MK1CallerVerifiedCoreSequence;
}

export interface MK1CallerContextComparison {
  verifiedCallerCount: number;
  seedInstructionPhysicalDistance: number;
  callInstructionPhysicalDistance: number;
  loadedDistance: number;
  rawWindowsOverlap: boolean;
  verifiedCoreSequenceEqual: boolean;
  callerRecords: MK1CallerContextRecord[];
}

export interface MK1TargetEntryReconciliation {
  upstreamB8StatusVerified: boolean;
  upstreamB8AllReconciledVerified: boolean;
  upstreamB8DerivedEvidenceVerified: boolean;
  targetCandidateFound: boolean;
  exactOneSeedClassDerived: boolean;
  exactOneDerivedTarget: boolean;
  targetCoordinatesMatchB8: boolean;
  targetPhysicalBackingMatchesB8: boolean;
  targetRegionAuthoritative: boolean;
  targetExecutable: boolean;
  verifiedCallerCountInput: boolean;
  callerRecordsProduced: boolean;
  callerReturnRelationsProduced: boolean;
  targetStartDecodeReconciled: boolean;
  nearReturnDecodesReconciled: boolean;
  boundaryOverlapReconciled: boolean;
  targetTraceProduced: boolean;
  targetTraceEventsReconciled: boolean;
  rawScanRangeReconciled: boolean;
  rawExactMatchesReconciled: boolean;
  verifiedB8CallersFoundInRawScan: boolean;
  callerContextsReconciled: boolean;
  boundaryTargetRecorded: boolean;
  derivedSummariesReconciled: boolean;
  candidateObjectIdentityReconciled: boolean;
  candidateCoordinatesReconciled: boolean;
  callerMandatoryFieldsReconciled: boolean;
  verifiedCallOpcodeBytesReconciled: boolean;
  nearReturnSetDerivedFromVerifiedCallers: boolean;
  nearReturnDecodeStatusesReconciled: boolean;
  boundaryOverlapComputed: boolean;
  authoritativeRegionReconciled: boolean;
  verifiedB8CallOffsetSetReconciled: boolean;
  verifiedCallerCoreSequencesReconciled: boolean;
  allReconciled: boolean;
}

export interface MK1TargetEntryAnalysisConfiguration {
  targetTraceMaxBytes: number;
  targetTraceMaxInstructions: number;
  rawTargetPreBytes: number;
  rawTargetPostBytes: number;
  straightLineOnly: boolean;
  followsCalls: boolean;
  followsJumps: boolean;
  followsBranches: boolean;
  rawE8ObjectScanCount: number;
  targetSelector: string;
}

export interface MK1PaletteTargetEntryReconResult {
  format: 'mk1_palette_target_entry_recon_v2';
  status: 'SUCCESS' | 'FAILED';
  operationId: string;
  timestamp: string;
  candidateId: string;
  analysisConfiguration: MK1TargetEntryAnalysisConfiguration;
  seedClass: MK1TargetEntrySeedClass | null;
  verifiedCallerRecords: MK1VerifiedCallerRecord[];
  callerReturnRelations: MK1CallerReturnRelation[];
  targetBoundary: MK1TargetBoundaryRecon;
  rawTargetWindow: MK1TargetRawWindow;
  targetTrace: MK1TargetTraceResult;
  nullModel: MK1RawE8NullModelResult;
  callerComparison: MK1CallerContextComparison;
  reconciliation: MK1TargetEntryReconciliation;
  fixtureObservations: string[];
  interpretationCaveats: string[];
  failedStage?: string;
  failureReason?: string;
}
