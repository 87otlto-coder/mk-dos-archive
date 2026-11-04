/**
 * MK1 Executable Palette Relative-Control Address-Space Qualification &
 * Convergent Entry-State Reconnaissance Types (Milestone 1 — Pass 1E.2B.10a)
 *
 * Checkpoint: mkdos-m1e2b10a-loaded-linear-candidate-trace
 *
 * Epistemic Rules & Invariants:
 * 1. B.1-B.9 are READ-ONLY upstream evidence.
 * 2. Static candidate-destination decoding is performed strictly under the loaded-linear address-space hypothesis.
 * 3. REL32 NUMERIC TARGET != VERIFIED RUNTIME LINEAR DESTINATION.
 * 4. LOADED-LINEAR MAPPING != PROVEN SEGMENTATION MODEL.
 * 5. CONTROL-TRANSFER TARGET != FUNCTION.
 * 6. EAX LIVE AT ENTRY != FUNCTION ARGUMENT.
 * 7. EBX CONSTANT AT ENTRY != PARAMETER OR SENTINEL.
 * 8. Do NOT produce a confidence score. Use explicit mechanical dimensions.
 * 9. runtimeDestinationVerified remains false unless runtime selector semantics are proven independently.
 * 10. Do NOT investigate 0x53CA1.
 * 11. Pass 1E.2B.10a must NOT perform function discovery, calling-convention inference, or palette-consumer claims.
 * 12. Pre-entry EAX/payload delta equality is PRE-ENTRY STRUCTURAL EVIDENCE, NOT an affine transform.
 * 13. Candidate destination control boundary is a barrier; DO NOT FOLLOW the resulting target.
 * 14. B.10 remains OPEN / PENDING INDEPENDENT REVIEW. Do NOT begin B.11.
 */

import { X86Register32 } from './paletteOperandUseReconnaissanceTypes';

export const B10_EPISTEMIC_RULES: readonly string[] = [
  'B.1-B.9 are READ-ONLY upstream evidence.',
  'DO NOT FOLLOW 0x53D33 — Destination body not decoded.',
  'Static candidate-destination decoding is performed strictly under the loaded-linear address-space hypothesis.',
  'REL32 NUMERIC TARGET != VERIFIED RUNTIME LINEAR DESTINATION.',
  'LOADED-LINEAR MAPPING != PROVEN SEGMENTATION MODEL.',
  'CONTROL-TRANSFER TARGET != FUNCTION.',
  'EAX LIVE AT ENTRY != FUNCTION ARGUMENT.',
  'EBX CONSTANT AT ENTRY != PARAMETER OR SENTINEL.',
  'Do NOT produce a confidence score. Use explicit mechanical dimensions.',
  'runtimeDestinationVerified remains false unless runtime selector semantics are proven independently.',
  'Do NOT investigate 0x53CA1.',
  'Pass 1E.2B.10a must NOT perform function discovery, calling-convention inference, or palette-consumer claims.',
  'Pre-entry EAX/payload delta equality is PRE-ENTRY STRUCTURAL EVIDENCE, NOT an affine transform.',
  'Candidate destination control boundary is a barrier; DO NOT FOLLOW the resulting target.',
  'STOP after B.10.',
] as const;

export const B10_EXPORT_FORMAT_VERSION = 'mk1_palette_convergent_entry_recon_v2';
export const B10_V2_EXPORT_FORMAT_VERSION = 'mk1_palette_convergent_entry_recon_v2';
export const B10_V1_EXPORT_FORMAT_VERSION = 'mk1_palette_convergent_entry_recon_v1';

export type MK1ConvergentControlTransferKind =
  | 'JMP near rel32 (0xE9)'
  | 'CALL near rel32 (0xE8)';

export interface MK1Model1EipRelativeCalculation {
  sourceObjectNumber: number;
  sourceObjectEip: number;
  sourceObjectEipHex: string;
  nextInstructionEip: number;
  nextInstructionEipHex: string;
  rel32Displacement: number;
  rel32DisplacementHex: string;
  calculatedTargetObjectOffset: number;
  calculatedTargetObjectOffsetHex: string;
  sourceObjectRelocationBase: number;
  sourceObjectRelocationBaseHex: string;
  derivedLoadedTarget: number;
  derivedLoadedTargetHex: string;
  withinSourceObjectVirtualRange: boolean;
  withinSourceObjectAddressableFileBackedRange: boolean;
  distanceBeyondVirtualEnd: number | null;
}

export interface MK1Model2LoadedLinearCalculation {
  sourceLoadedAddress: number;
  sourceLoadedAddressHex: string;
  nextInstructionLoadedAddress: number;
  nextInstructionLoadedAddressHex: string;
  rel32Displacement: number;
  rel32DisplacementHex: string;
  calculatedLinearTarget: number;
  calculatedLinearTargetHex: string;
  containingObjectNumber: number | null;
  containingObjectBase: number | null;
  containingObjectBaseHex: string | null;
  containingObjectOffset: number | null;
  containingObjectOffsetHex: string | null;
  physicalBackingOffset: number | null;
  physicalBackingOffsetHex: string | null;
  topologyRegionId: string | null;
  topologyRegionClass: string | null;
  isAddressable: boolean;
  isFileBacked: boolean;
  isReadable: boolean;
  isWritable: boolean;
  isExecutable: boolean;
}

export interface MK1AddressSpaceQualification {
  targetAddress: number;
  targetAddressHex: string;
  containingObjectNumber: number | null;
  containingObjectBase: number | null;
  containingObjectBaseHex: string | null;
  containingObjectVirtualSize: number | null;
  containingObjectCapabilities: string | null;
  containingObjectRoleEvidence: string | null;
  containingObjectFlags: number | null;
  isInsideObject1Virtual: boolean;
  object1VirtualSize: number;
  physicalBackingAvailable: boolean;
  physicalFileOffset: number | null;
  physicalFileOffsetHex: string | null;
  topologyRegionId: string | null;
  topologyRegionClass: string | null;
  incomingByteVerifiedRel32Transfer: boolean;
  loadedLinearMetadataExecutable: boolean;
  controlTransferVsObjectFlagTension: boolean;
  runtimeDestinationVerified: false;
  runtimeSelectorSemanticsProven: false;
  selectorSemanticsStatus: 'unresolved';
}

export interface MK1DualTargetModelRecon {
  targetNumericValue: number;
  targetNumericValueHex: string;
  sourceInstructionLoadedAddress: number;
  sourceInstructionLoadedAddressHex: string;
  sourceInstructionPhysicalOffset: number;
  sourceInstructionPhysicalOffsetHex: string;
  sourceInstructionMnemonic: string;
  rel32Displacement: number;
  rel32DisplacementHex: string;
  rel32Sign: '+' | '-';
  nextInstructionLoadedAddress: number;
  nextInstructionLoadedAddressHex: string;
  model1EipRelative: MK1Model1EipRelativeCalculation;
  model2LoadedLinear: MK1Model2LoadedLinearCalculation;
  modelsConvergeNumerically: boolean;
  addressSpaceQualification: MK1AddressSpaceQualification;
}

export interface MK1B9JmpByteValidation {
  loadedAddress: number;
  loadedAddressHex: string;
  physicalOffset: number;
  physicalOffsetHex: string;
  expectedBytes: number[];
  expectedBytesHex: string;
  actualBytes: number[];
  actualBytesHex: string;
  bytesMatch: boolean;
  opcodeHex: string;
  displacementRel32: number;
  displacementRel32Hex: string;
  actualTargetNumeric: number;
  actualTargetNumericHex: string;
}

export interface MK1B8CallByteValidationRecord {
  callerIndex: number;
  interpretationId: string;
  candidateId: string;
  callInstructionPhysicalOffset: number;
  callInstructionPhysicalOffsetHex: string;
  callLoadedAddress: number;
  callLoadedAddressHex: string;
  expectedBytes: number[];
  expectedBytesHex: string;
  actualBytes: number[];
  actualBytesHex: string;
  bytesMatch: boolean;
  opcodeHex: string;
  rel32: number;
  rel32Hex: string;
  targetNumeric: number;
  targetNumericHex: string;
  returnCoordinate: number;
  returnCoordinateHex: string;
  seedRegister: X86Register32;
  seedValue: number;
  seedValueHex: string;
}

export interface MK1ConvergentByteValidation {
  b9JmpInstruction: MK1B9JmpByteValidation;
  b8MatchingCalls: MK1B8CallByteValidationRecord[];
  allCallersByteVerified: boolean;
}

export interface MK1EntryStateClassA {
  classId: 'class-a-b9-jump-handoff';
  className: string;
  sourceCandidateId: string;
  sourceCandidatePhysicalPayloadHex: string;
  sourceTargetEntryLoadedAddressHex: string;
  controlTransferKind: 'JMP near rel32 (0xE9)';
  controlTransferOpcodeHex: string;
  incomingEAX: number;
  incomingEAXHex: string;
  eaxLiveAtBoundary: boolean;
  eaxReadBeforeTransfer: boolean;
  eaxOverwrittenBeforeTransfer: boolean;
  incomingEBX: number | null;
  incomingEBXHex: string | null;
  ebxExplicitlyAssigned: boolean;
  ebxAssignmentInstruction: string;
  otherRegistersUndefined: boolean;
  stackEffect: 'none-jump-does-not-push-return-address';
  stackReturnAddressOrigin: string;
  stackReturnTargetAddresses: string[];
}

export interface MK1ClassBCallSiteRecord {
  callerIndex: number;
  interpretationId: string;
  callPhysicalOffsetHex: string;
  callLoadedAddressHex: string;
  returnLoadedAddressHex: string;
}

export interface MK1EntryStateClassB {
  classId: 'class-b-b8-direct-call';
  className: string;
  sourceCandidateId: string;
  sourceCandidatePhysicalPayloadHex: string;
  sourceCallSites: MK1ClassBCallSiteRecord[];
  controlTransferKind: 'CALL near rel32 (0xE8)';
  controlTransferOpcodeHex: string;
  incomingEAX: number;
  incomingEAXHex: string;
  eaxLiveAtBoundary: boolean;
  incomingEBX: null;
  incomingEBXHex: null;
  ebxExplicitlyAssigned: boolean;
  otherRegistersUndefined: boolean;
  stackEffect: 'pushes-4-byte-return-address';
  stackReturnAddressOrigin: string;
}

export interface MK1CandidateCoordinates {
  candidateId: string;
  physicalStructureOffset: number;
  physicalStructureOffsetHex: string;
  physicalPayloadOffset: number;
  physicalPayloadOffsetHex: string;
  objectNumber: number;
  objectRelativeStructureOffset: number;
  objectRelativeStructureOffsetHex: string;
  objectRelativePayloadOffset: number;
  objectRelativePayloadOffsetHex: string;
  loadedStructureAddress: number;
  loadedStructureAddressHex: string;
  loadedPayloadAddress: number;
  loadedPayloadAddressHex: string;
}

export interface MK1AffineCandidateReference {
  candidateId: string;
  payloadPhysicalOffset: number;
  payloadPhysicalOffsetHex: string;
}

export interface MK1PreEntryDifferential {
  classAEax: number;
  classAEaxHex: string;
  classBEax: number;
  classBEaxHex: string;
  eaxDelta: number;
  eaxDeltaHex: string;
  eaxDeltaDecimal: number;
  classAPayloadPhysical: number;
  classAPayloadPhysicalHex: string;
  classBPayloadPhysical: number;
  classBPayloadPhysicalHex: string;
  candidatePayloadPhysicalDelta: number;
  candidatePayloadPhysicalDeltaHex: string;
  candidateObjectRelativePayloadDelta: number;
  candidateObjectRelativePayloadDeltaHex: string;
  candidateLoadedPayloadDelta: number;
  candidateLoadedPayloadDeltaHex: string;
  entrySeedDeltaMatchesCandidatePayloadDelta: boolean;
  entrySeedDeltaMatchesCandidateObjectRelativeDelta: boolean;
  entrySeedDeltaMatchesCandidateLoadedDelta: boolean;
  structuralCorrespondenceIdentified: boolean;
  affineTransformClaimed: false;
  description: string;
}

export interface MK1ConvergentDifferentialAnalysis {
  eaxClassA: number;
  eaxClassAHex: string;
  eaxClassB: number;
  eaxClassBHex: string;
  eaxDelta: number;
  eaxDeltaHex: string;
  eaxDeltaDecimal: number;
  affineTransformCandidateA: MK1AffineCandidateReference;
  affineTransformCandidateB: MK1AffineCandidateReference;
  candidatePayloadDelta: number;
  candidatePayloadDeltaHex: string;
  eaxDeltaMatchesCandidatePayloadDistance: boolean;
  entrySeedDeltaMatchesCandidatePayloadDelta: boolean;
  affineRelationshipIdentified: boolean;
  affineDescription: string;
  registerDifferences: {
    eax: string;
    ebx: string;
    esp: string;
    flags: string;
  };
  controlTransferDifferences: {
    classAControl: 'JMP near rel32 (0xE9)';
    classBControl: 'CALL near rel32 (0xE8)';
    stackDiscrepancy: string;
    frameSemantics: string;
  };
  memoryUseDifferential: {
    classAMemoryAccessBeforeTransfer: boolean;
    classBMemoryAccessBeforeTransfer: boolean;
    details: string[];
  };
}

export interface MK1DestinationRawWindow {
  loadedCoordinate: number;
  loadedCoordinateHex: string;
  objectNumber: number | null;
  objectOffset: number | null;
  objectOffsetHex: string | null;
  physicalOffset: number | null;
  physicalOffsetHex: string | null;
  readable: boolean;
  writable: boolean;
  executable: boolean;
  preBytesHex: string;
  postBytesHex: string;
  targetByteHex: string;
  allBytes: number[];
}

export interface MK1DestinationStartQualification {
  exactStartDecodes: boolean;
  decodeStatus: 'success' | 'unsupported-opcode' | 'unsupported-prefix' | 'truncated' | 'unmapped' | 'out-of-bounds';
  firstBytesHex: string;
  firstInstructionMnemonic: string | null;
  firstInstructionLength: number | null;
  firstInstructionOpcodeHex: string | null;
}

export type MK1MicroOpcodeGroup =
  | 'INC_DEC'
  | 'PUSH_POP'
  | 'MOV'
  | 'MOV_LOAD'
  | 'LEA'
  | 'RET'
  | 'CALL'
  | 'JMP'
  | 'JCC'
  | 'ALU_ARITH'
  | 'INTERRUPT';

export interface MK1MemoryAddressingInfo {
  baseRegister: X86Register32 | null;
  indexRegister: X86Register32 | null;
  scale: number | null;
  displacement: number | null;
  displacementHex: string | null;
  exactEffectiveAddress: number | null;
  exactEffectiveAddressHex: string | null;
  isFullyCalculable: boolean;
  topology?: {
    objectNumber: number | null;
    objectOffset: number | null;
    physicalOffset: number | null;
    regionId: string | null;
    readable: boolean;
    writable: boolean;
    executable: boolean;
  };
}

export interface MK1MicroInstruction {
  address: number;
  addressHex: string;
  physicalOffset: number | null;
  physicalOffsetHex: string | null;
  length: number;
  bytes: number[];
  bytesHex: string;
  mnemonic: string;
  opcode: number;
  opcodeHex: string;
  opcodeGroup: MK1MicroOpcodeGroup;
  operands: string[];
  readsMemory: boolean;
  writesMemory: boolean;
  readsRegisters: X86Register32[];
  modifiesRegisters: X86Register32[];
  partiallyModifiesRegisters?: X86Register32[];
  isControlTransfer: boolean;
  controlTransferType?: 'call' | 'jump' | 'jcc' | 'return' | 'interrupt';
  memoryAddressing?: MK1MemoryAddressingInfo;
}

export interface MK1DecodedCandidateInstruction extends MK1MicroInstruction {
  index: number;
  isBarrier: boolean;
  barrierReason?: string;
}

export type MK1OriginFirstDisposition =
  | 'read-before-overwrite'
  | 'overwritten-before-read'
  | 'partially-modified-before-read'
  | 'partially-modified-before-overwrite'
  | 'copied-before-overwrite'
  | 'preserved-to-control-boundary-without-read'
  | 'unsupported-before-disposition'
  | 'provenance-lost'
  | 'max-bound-before-disposition';

export interface MK1RegisterUsageSummary {
  read: boolean;
  overwrite: boolean;
  partialMod: boolean;
  memoryUse: boolean;
  memoryBaseUse?: boolean;
  memoryIndexUse?: boolean;
  directMemoryUse?: boolean;
  usageCount: number;
  readCount: number;
  overwriteCount: number;
  partialModCount: number;
  memoryUseCount: number;
  details: string[];
}

export interface MK1OriginAffineOperation {
  instructionIndex: number;
  mnemonic: string;
  input: number;
  inputHex: string;
  operation: 'ADD' | 'SUB' | 'LEA';
  constant: number;
  constantHex: string;
  output: number;
  outputHex: string;
}

export interface MK1OriginMemoryAccess {
  instructionIndex: number;
  mnemonic: string;
  role: 'base' | 'index' | 'stored-value';
  effectiveAddress: number | null;
  effectiveAddressHex: string | null;
  isFullyCalculable: boolean;
  matchesAssociatedStructure: boolean;
  matchesAssociatedPayload: boolean;
}

export interface MK1OriginEvaluation {
  origin: 'A_EAX' | 'A_EBX' | 'B_EAX' | 'B_EBX';
  initialValueKnown: boolean;
  initialValue: number | null;
  initialValueHex: string | null;
  firstDisposition: MK1OriginFirstDisposition;
  firstDispositionInstructionIndex: number | null;
  firstDispositionMnemonic: string | null;
  readTypes: string[];
  affineOperations: MK1OriginAffineOperation[];
  memoryAccesses: MK1OriginMemoryAccess[];
  associatedStructureReached: boolean;
  associatedPayloadReached: boolean;
  liveAtBoundary: boolean;
  valueAtBoundary: number | null;
  valueAtBoundaryHex: string | null;
  registerUsage: MK1RegisterUsageSummary;
}

export interface MK1ClassTrace {
  classId: 'Class A' | 'Class B';
  eaxOrigin: MK1OriginEvaluation;
  ebxOrigin?: MK1OriginEvaluation;
  eaxUsage?: MK1RegisterUsageSummary;
  ebxUsage?: MK1RegisterUsageSummary;
  associatedCandidateId: string;
  associatedLoadedStructure: number;
  associatedLoadedPayload: number;
  associatedStructureReached: boolean;
  associatedPayloadReached: boolean;
  memoryUseObserved: boolean;
  associatedCandidateMemoryAddressObserved: boolean;
}

export interface MK1DifferentialTraceSummary {
  commonAffineTransformObserved: boolean;
  commonAffineOperation: 'ADD' | 'SUB' | 'LEA' | null;
  commonAffineConstant: number | null;
  commonAffineConstantHex: string | null;
  classAOutput: number | null;
  classAOutputHex: string | null;
  classBOutput: number | null;
  classBOutputHex: string | null;
  commonRelocationBaseAdjustmentObserved: boolean;
  matchingRelocationBaseObjectNumber: number | null;
  classAAssociatedPayloadReached: boolean;
  classBAssociatedPayloadReached: boolean;
  commonTransformReachesBothAssociatedPayloads: boolean;
  classAMemoryUseObserved: boolean;
  classBMemoryUseObserved: boolean;
  associatedCandidateMemoryAddressObserved: boolean;
  classAEbxQuestionAnswered: boolean;
  classAEbxDisposition: string;
  summaryNotes: string[];
}

export interface MK1FinalCandidateControlBoundary {
  boundaryReached: boolean;
  boundaryInstruction: string | null;
  boundaryLoadedAddress: number | null;
  boundaryLoadedAddressHex: string | null;
  boundaryPhysicalOffset: number | null;
  boundaryPhysicalOffsetHex: string | null;
  boundaryTargetLoadedAddress: number | null;
  boundaryTargetLoadedAddressHex: string | null;
  stopReason:
    | 'call-barrier'
    | 'jump-barrier'
    | 'jcc-barrier'
    | 'ret-barrier'
    | 'iret-barrier'
    | 'int-barrier'
    | 'unsupported-instruction'
    | 'unsupported-prefix'
    | 'boundary-limit'
    | 'max-instructions'
    | 'max-bytes'
    | 'no-instructions-decoded';
  aOriginsLive: string[];
  bOriginsLive: string[];
  boundaryNotFollowedConfirmation: true;
}

export interface MK1CandidateDestinationTrace {
  startQualification: MK1DestinationStartQualification;
  instructions: MK1DecodedCandidateInstruction[];
  finalBoundary: MK1FinalCandidateControlBoundary;
  candidateBasicBlockQualified?: boolean;
  eaxUsage?: MK1RegisterUsageSummary;
  ebxUsage?: MK1RegisterUsageSummary;
  registerUsage?: {
    eax: MK1RegisterUsageSummary;
    ebx: MK1RegisterUsageSummary;
  };
}

export interface MK1B8TargetGroup {
  targetNumeric: number;
  targetNumericHex: string;
  seedRegister: X86Register32;
  seedValue: number;
  seedValueHex: string;
  associatedCandidateId: string;
  memberCount: number;
  interpretationIds: string[];
  isCompatibleComparisonClass: boolean;
}

export interface MK1UpstreamGroupUniqueness {
  matchingB8InterpretationCount: number;
  matchingB8GroupedClassCount: number;
  compatibleComparisonClassCount: number;
  comparisonClassConflicts: string[];
}

export interface MK1MechanicalDimensions {
  dualModelTargetNumericConvergence: boolean;
  targetNumericValueHex: string;
  b9JmpByteVerified: boolean;
  b8CallsByteVerified: boolean;
  allCallersByteVerified: boolean;
  targetObjectMapped: boolean;
  targetObjectNumber: number | null;
  targetObjectCapabilities: string | null;
  targetPhysicalBackingAvailable: boolean;
  targetPhysicalOffsetHex: string | null;
  eaxSeedDeltaHex: string;
  eaxDeltaMatchesCandidatePayloadDistance: boolean;
  classAEntryLiveEAX: boolean;
  classBEntryLiveEAX: boolean;
  classAExplicitEBX: boolean;
  classBExplicitEBX: boolean;
  controlFlowConvergenceObserved: boolean;
  runtimeDestinationVerified: false;
}

export interface MK1ConvergentReconciliation {
  // Legacy / Test Verification Invariants:
  upstreamB8Reconciled: boolean;
  upstreamB9Reconciled: boolean;
  dualModelsReconciled: boolean;
  b9JmpByteVerified: boolean;
  b8CallsByteVerified: boolean;
  eaxDeltaReconciled: boolean;
  affineTransformReconciled: boolean;
  destinationBodyRemainsUnfollowed: boolean;
  runtimeDestinationVerified: boolean;
  noFunctionClaimsAsserted: boolean;
  derivedEvidenceReconciled: boolean;

  // Granular Mechanical Verification Invariants:
  upstreamB8StatusVerified: boolean;
  upstreamB8AllReconciledVerified: boolean;
  upstreamB8DerivedEvidenceVerified: boolean;
  upstreamB9StatusVerified: boolean;
  upstreamB9AllReconciledVerified: boolean;
  b9FinalBoundaryDerived: boolean;
  b9JmpActualBytesVerified: boolean;
  sourceObjectDerived: boolean;
  sourceObjectModelDerived: boolean;
  sourceObjectPhysicalDerived?: boolean;
  loadedLinearModelDerived: boolean;
  loadedLinearTopologyResolved: boolean;
  objectFlagTensionClassified: boolean;
  b8SameTargetInterpretationsReconciled: boolean;
  b8ComparisonClassUnique: boolean;
  b8DirectCallActualBytesVerified: boolean;
  b8MatchingCallsFound?: boolean;
  allDirectCallersByteVerified?: boolean;
  classAEaxDerived: boolean;
  classAEbxDerivedOrExplicitlyUnknown: boolean;
  classAReturnProvenanceDerived: boolean;
  classBEaxDerived: boolean;
  classBEbxExplicitlyUnknownOrDerived: boolean;
  classBCandidateDerived: boolean;
  classACandidateDerived: boolean;
  classAEntryStateFormed?: boolean;
  classBEntryStateFormed?: boolean;
  classAEbxExplicitAssignmentTracked?: boolean;
  classAEbxValueReconciled?: boolean;
  preEntryDifferentialReconciled?: boolean;
  preEntryDeltaReconciled: boolean;
  preEntryEaxDeltaReconciled?: boolean;
  structuralPayloadDistanceReconciled?: boolean;
  destinationWindowReconciled: boolean;
  destinationExactStartReconciled: boolean;
  exactDestinationStartDecodes?: boolean;
  decodedStreamReconciled: boolean;
  candidateTraceExecuted?: boolean;
  classATraceReconciled: boolean;
  classBTraceReconciled: boolean;
  differentialTraceReconciled: boolean;
  finalControlBoundaryEncountered?: boolean;
  candidateBoundaryBarrierEnforced?: boolean;
  finalBoundaryNotFollowed: boolean;
  runtimeDestinationNotPromoted: boolean;
  runtimeDestinationVerifiedRemainsFalse?: boolean;
  candidateStartDecoded?: boolean;
  candidateInstructionsDecoded?: boolean;
  symbolicTraceExecuted?: boolean;
  candidateBoundaryReached?: boolean;
  candidateBoundaryNotFollowed?: boolean;
  candidateBasicBlockQualified?: boolean;
  candidateBlockFormed?: boolean;
  controlBoundaryReached?: boolean;
  firstControlBarrierEncountered?: boolean;
  firstControlBarrierNotFollowed?: boolean;
  candidateTraceReconciled?: boolean;
  noArbitraryFunctionClaimsAsserted?: boolean;
  noPaletteConsumerClaimsAsserted?: boolean;
  rel32DisplacementReconciled?: boolean;
  targetNumericReconciled?: boolean;
  targetAddressSpaceMapped?: boolean;
  targetAddressInsideObject1Virtual?: boolean;
  targetPhysicalBackingResolved?: boolean;
  targetPhysicalOffsetReconciled?: boolean;
  topologyRegionResolved?: boolean;

  allReconciled: boolean;
}

export interface MK1PaletteConvergentEntryResult {
  format: 'mk1_palette_convergent_entry_recon_v2';
  status: 'SUCCESS' | 'FAILED';
  failureReason: string | null;
  failedStage: string | null;
  operationId: string;
  timestamp: string;
  fixture: {
    exePath: string;
    exeSize: number;
  };
  analysisConfiguration: {
    maxTraceBytes: number;
    maxTraceInstructions: number;
    preWindowBytes: number;
    postWindowBytes: number;
  };
  upstreamSummary: {
    b8Format: string;
    b8InterpretationCount: number;
    b9Format: string;
    b9CandidateId: string;
  };
  b9BoundarySource: {
    instructionLoaded: number;
    instructionLoadedHex: string;
    instructionPhysical: number;
    instructionPhysicalHex: string;
    mnemonic: string;
    targetLoaded: number;
    targetLoadedHex: string;
  };
  relativeControlInstruction: {
    opcodeHex: string;
    displacementRel32: number;
    displacementRel32Hex: string;
    verifiedBytesHex: string;
  };
  addressSpaceModels: {
    model1EipRelative: MK1Model1EipRelativeCalculation;
    model2LoadedLinear: MK1Model2LoadedLinearCalculation;
    modelsConvergeNumerically: boolean;
  };
  addressSpaceQualification: MK1AddressSpaceQualification;
  matchingB8TargetGroups: MK1B8TargetGroup[];
  upstreamGroupUniqueness: MK1UpstreamGroupUniqueness;
  verifiedB8DirectTransfers: MK1B8CallByteValidationRecord[];
  entryStateClasses: {
    classA: MK1EntryStateClassA;
    classB: MK1EntryStateClassB;
  };
  candidateAssociations: {
    classA: MK1CandidateCoordinates;
    classB: MK1CandidateCoordinates;
  };
  preEntryDifferential: MK1PreEntryDifferential;
  destinationRawWindow: MK1DestinationRawWindow;
  destinationStartQualification: MK1DestinationStartQualification;
  decodedInstructionStream: MK1DecodedCandidateInstruction[];
  classATrace: MK1ClassTrace;
  classBTrace: MK1ClassTrace;
  differentialTraceSummary: MK1DifferentialTraceSummary;
  finalCandidateControlBoundary: MK1FinalCandidateControlBoundary;
  reconciliation: MK1ConvergentReconciliation;
  interpretationCaveats: string[];
  fixtureObservations: string[];
  epistemicRules: readonly string[];

  // Backward-compatible accessors for existing UI and tests:
  targetCandidateId: string;
  targetNumericAddress: number;
  targetNumericAddressHex: string;
  dualModelRecon: MK1DualTargetModelRecon;
  byteValidation: MK1ConvergentByteValidation;
  classAState: MK1EntryStateClassA;
  classBState: MK1EntryStateClassB;
  differentialAnalysis: MK1ConvergentDifferentialAnalysis;
  candidateDestinationTrace?: MK1CandidateDestinationTrace;
  mechanicalDimensions: MK1MechanicalDimensions;
  notes: string[];
}

export interface MK1CompactPaletteConvergentEntryExport {
  exportHeader: {
    formatVersion: string;
    timestamp: string;
    operationId: string;
    epistemicRules: readonly string[];
  };
  fixture: {
    exePath: string;
    exeSize: number;
  };
  status: 'SUCCESS' | 'FAILED';
  targetCandidateId: string;
  targetNumericAddressHex: string;
  addressSpaceModels: {
    model1EipRelative: MK1Model1EipRelativeCalculation;
    model2LoadedLinear: MK1Model2LoadedLinearCalculation;
    modelsConvergeNumerically: boolean;
  };
  addressSpaceQualification: MK1AddressSpaceQualification;
  byteValidation: MK1ConvergentByteValidation;
  entryStateClasses: {
    classA: MK1EntryStateClassA;
    classB: MK1EntryStateClassB;
  };
  candidateAssociations: {
    classA: MK1CandidateCoordinates;
    classB: MK1CandidateCoordinates;
  };
  preEntryDifferential: MK1PreEntryDifferential;
  destinationRawWindow: MK1DestinationRawWindow;
  destinationStartQualification: MK1DestinationStartQualification;
  decodedInstructionStream: MK1DecodedCandidateInstruction[];
  classATrace: MK1ClassTrace;
  classBTrace: MK1ClassTrace;
  differentialTraceSummary: MK1DifferentialTraceSummary;
  finalCandidateControlBoundary: MK1FinalCandidateControlBoundary;
  mechanicalDimensions: MK1MechanicalDimensions;
  reconciliation: MK1ConvergentReconciliation;
  // Backward-compatible fields
  dualModelRecon?: MK1DualTargetModelRecon;
  classAState?: MK1EntryStateClassA;
  classBState?: MK1EntryStateClassB;
  differentialAnalysis?: MK1ConvergentDifferentialAnalysis;
  candidateDestinationTrace?: MK1CandidateDestinationTrace;
}

export interface PerformConvergentReconOptions {
  onProgress?: (stage: string, progress: number) => void;
  maxCandidateTraceInstructions?: number;
  maxCandidateTraceBytes?: number;
}
