/**
 * MK1 Executable Palette Segment-Base Hypothesis Qualification Types (Milestone 1 — Pass 1E.2B.10d)
 *
 * Checkpoint: mkdos-m1e2b10d-segment-base-qualification
 *
 * Epistemic Rules & Invariants:
 * 1. B.1-B.10c are READ-ONLY upstream evidence.
 * 2. DO NOT FOLLOW 0x53D33 or 0x53D4A (candidate destination control boundary is an absolute barrier).
 * 3. DO NOT extend destination disassembly beyond verified instruction boundaries.
 * 4. DO NOT inspect 0x53CA1 or assume surrounding prologue/epilogue sequences.
 * 5. DO NOT infer DS selector/base as fact from LE relocation bases alone.
 * 6. DO NOT call EAX a pointer or function argument.
 * 7. DO NOT make palette ownership or consumer claims.
 * 8. DO NOT begin broad segment-register archaeology.
 * 9. Explicitly distinguish: arithmetic compatibility, local static evidence, documented DOS/4GW default model, and proven runtime segment state.
 * 10. runtimeDestinationVerified and runtimeSelectorSemanticsProven remain false.
 * 11. STOP after B.10d. Do NOT begin B.11.
 */

export const B10D_EXPORT_FORMAT_VERSION = 'mk1_palette_segment_qualification_v1';

export const B10D_EPISTEMIC_RULES: readonly string[] = [
  'B.1-B.10c are READ-ONLY upstream evidence.',
  'DO NOT FOLLOW 0x53D33 or 0x53D4A (candidate destination control boundary is an absolute barrier).',
  'DO NOT extend destination disassembly beyond verified instruction boundaries.',
  'DO NOT inspect 0x53CA1 or assume surrounding prologue/epilogue sequences.',
  'DO NOT infer DS selector/base as fact from LE relocation bases alone.',
  'DO NOT call EAX a pointer or function argument.',
  'DO NOT make palette ownership or consumer claims.',
  'DO NOT begin broad segment-register archaeology.',
  'Explicitly distinguish arithmetic compatibility, local static evidence, documented DOS/4GW default model, and proven runtime segment state.',
  'runtimeDestinationVerified and runtimeSelectorSemanticsProven remain false.',
  'STOP after B.10d. Do NOT begin B.11.',
] as const;

export interface MK1LEHeaderSegmentFacts {
  autoDataObject: number;
  autoDataObjectName: string;
  initialCodeObject: number;
  initialCodeObjectRelocationBase: number;
  initialCodeObjectRelocationBaseHex: string;
  initialCodeEip: number;
  initialCodeEipHex: string;
  initialStackObject: number;
  initialStackObjectRelocationBase: number;
  initialStackObjectRelocationBaseHex: string;
  initialStackEsp: number;
  initialStackEspHex: string;
  object1RelocationBase: number;
  object1RelocationBaseHex: string;
  object1VirtualSize: number;
  object1VirtualSizeHex: string;
  object1FlagsRaw: number;
  object1FlagsRawHex: string;
  object1Capabilities: string;
  object1RoleEvidence: string;
  object2RelocationBase: number;
  object2RelocationBaseHex: string;
  object2VirtualSize: number;
  object2VirtualSizeHex: string;
  object2FlagsRaw: number;
  object2FlagsRawHex: string;
  object2Capabilities: string;
  object2RoleEvidence: string;
}

export interface MK1DestinationInstructionFact {
  instructionPhysicalOffset: number;
  instructionPhysicalOffsetHex: string;
  instructionLoadedAddress: number;
  instructionLoadedAddressHex: string;
  objectNumber: number;
  objectOffset: number;
  objectOffsetHex: string;
  opcodeByte: number;
  opcodeByteHex: string;
  modRmByte: number;
  modRmByteHex: string;
  mnemonic: string;
  operands: string[];
  instructionLength: number;
  hasSegmentOverride: boolean;
  segmentOverridePrefix: string | null;
  effectiveAddressingBaseRegister: 'EAX';
  architecturalDefaultSegment: 'DS';
  architecturalDefaultSegmentReason: string;
  incomingEaxClassA: number;
  incomingEaxClassAHex: string;
  incomingEaxClassB: number;
  incomingEaxClassBHex: string;
}

export interface MK1ModelClassCalculation {
  stateClass: 'Class A' | 'Class B';
  incomingEax: number;
  incomingEaxHex: string;
  assumedBase: number | null;
  assumedBaseHex: string | null;
  calculatedLinearAddress: number | null;
  calculatedLinearAddressHex: string | null;
  containingObjectNumber: number | null;
  containingObjectName: string | null;
  objectRelativeOffset: number | null;
  objectRelativeOffsetHex: string | null;
  physicalBackingOffset: number | null;
  physicalBackingOffsetHex: string | null;
  associatedCandidateId: string;
  associatedCandidateLoadedPayload: number;
  associatedCandidateLoadedPayloadHex: string;
  associatedCandidateLoadedStructure: number;
  associatedCandidateLoadedStructureHex: string;
  associatedCandidatePhysicalPayload?: number;
  associatedCandidatePhysicalPayloadHex?: string;
  equalsAssociatedCandidatePayload: boolean;
  equalsAssociatedCandidateStructure: boolean;
  reachesAssociatedPayload: boolean;
}

export interface MK1SegmentBaseModelEvaluation {
  modelId: 'model-a-zero-based' | 'model-b-object1-base' | 'model-c-auto-data-object-base';
  modelName: string;
  description: string;
  isAvailable: boolean;
  assumedBase: number | null;
  assumedBaseHex: string | null;
  formula: string;
  classACalculation: MK1ModelClassCalculation;
  classBCalculation: MK1ModelClassCalculation;
  reachesBothAssociatedPayloads: boolean;
  reachesEitherAssociatedPayload: boolean;
  topologicalAssessment: string;
}

export interface MK1CallerHandoffInstructionDetail {
  physicalOffset: number;
  physicalOffsetHex: string;
  loadedAddress: number;
  loadedAddressHex: string;
  mnemonic: string;
  rawBytesHex: string;
}

export interface MK1CallerHandoffInspectionSite {
  siteId: string;
  siteName: string;
  siteRole: 'class-a-caller-1' | 'class-a-caller-2' | 'class-a-jump-handoff' | 'class-b-caller-1' | 'class-b-caller-2';
  physicalOffsetStart: number;
  physicalOffsetStartHex: string;
  physicalOffsetEnd: number;
  physicalOffsetEndHex: string;
  loadedAddressStart: number;
  loadedAddressStartHex: string;
  instructionCount: number;
  rawBytesHex: string;
  instructionsDisassembled: string[];
  decodedInstructions: MK1CallerHandoffInstructionDetail[];
  segmentOverridePrefixesFound: number;
  segmentOverrideDetails: string[];
  explicitDsWritesOrLoadsFound: number;
  explicitDsDetails: string[];
  farPointerOrSegmentLoadsFound: number;
  farPointerDetails: string[];
  boundedWindowClean: boolean;
}

export interface MK1CallerHandoffInspectionSummary {
  totalInspectedSites: number;
  totalInstructionsInspected: number;
  totalSegmentOverridesFound: number;
  totalExplicitDsWritesFound: number;
  totalFarPointerLoadsFound: number;
  allBoundedWindowsClean: boolean;
  boundedWindowInspectionNotes: string[];
  inspectedSites: MK1CallerHandoffInspectionSite[];
}

export interface MK1EpistemicDistinctionReport {
  arithmeticCompatibility: {
    title: string;
    modelBExactAlignment: boolean;
    classAFormula: string;
    classBFormula: string;
    deltaAlignment: string;
    summary: string;
  };
  localStaticEvidence: {
    title: string;
    segmentOverridesObserved: boolean;
    explicitDsLoadsObserved: boolean;
    farCallsOrJmpsObserved: boolean;
    summary: string;
  };
  documentedDos4gwModel: {
    title: string;
    standardFlatModelDescription: string;
    standardFlatDsBase: number;
    standardFlatDsBaseHex: string;
    discrepancyWithModelB: string;
    summary: string;
  };
  provenRuntimeSegmentState: {
    title: string;
    status: 'unresolved' | 'unproven';
    selectorDescriptorsProven: false;
    runtimeExecutionVerified: false;
    summary: string;
  };
}

export interface MK1FinalSegmentClassifications {
  zeroBasedDsReachesEitherPayload: boolean;
  object1BaseDsWouldReachBothPayloads: boolean;
  fixtureProvidesEvidenceDsHasObject1Base: boolean;
  autoDataObjectBaseReachesEitherPayload: boolean;
  classificationSummary: string[];
}

export interface MK1SegmentQualificationReconciliation {
  fixtureSizeReconciled: boolean;
  destinationLoadedCoordinateReconciled: boolean;
  destinationPhysicalCoordinateReconciled: boolean;
  destinationBytesReconciled: boolean;
  headerFactsReconciled: boolean;
  destinationInstructionReconciled: boolean;
  modelACalculationReconciled: boolean;
  modelBCalculationReconciled: boolean;
  modelCCalculationReconciled: boolean;
  callerInspectionReconciled: boolean;
  epistemicDistinctionsReconciled: boolean;
  finalClassificationsReconciled: boolean;
  barrierEnforced: boolean;
  allInvariantsSatisfied: boolean;
}

export interface MK1PaletteSegmentQualificationResult {
  format: 'mk1_palette_segment_qualification_v1';
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string | null;
  failedStage?: string | null;
  operationId: string;
  timestamp: string;
  fixture: {
    exePath: string;
    exeSize: number;
  };
  epistemicRules: readonly string[];
  leHeaderFacts: MK1LEHeaderSegmentFacts;
  destinationInstruction: MK1DestinationInstructionFact;
  models: {
    modelA: MK1SegmentBaseModelEvaluation;
    modelB: MK1SegmentBaseModelEvaluation;
    modelC: MK1SegmentBaseModelEvaluation;
  };
  callerHandoffInspection: MK1CallerHandoffInspectionSummary;
  epistemicDistinctions: MK1EpistemicDistinctionReport;
  finalClassifications: MK1FinalSegmentClassifications;
  reconciliation: MK1SegmentQualificationReconciliation;
  interpretationCaveats: string[];
}

export interface MK1CompactPaletteSegmentQualificationExport {
  exportHeader: {
    format: string;
    status: 'SUCCESS' | 'FAILED';
    operationId: string;
    timestamp: string;
    fixturePath: string;
    fixtureSize: number;
    epistemicRules: readonly string[];
  };
  realLEFacts: {
    autoDataObject: number;
    autoDataObjectName: string;
    object1RelocationBaseHex: string;
    object2RelocationBaseHex: string;
    object1Capabilities: string;
    object2Capabilities: string;
    initialCodeObject: number;
    initialStackObject: number;
  };
  destinationInstruction: {
    offsetHex: string;
    loadedAddressHex: string;
    physicalOffsetHex: string;
    mnemonic: string;
    hasSegmentOverride: boolean;
    defaultSegment: 'DS';
    incomingEaxClassAHex: string;
    incomingEaxClassBHex: string;
  };
  models: {
    modelAZeroBased: {
      assumedBaseHex: string;
      classALinearHex: string;
      classBLinearHex: string;
      reachesAssociatedPayload: boolean;
      topologicalRegion: string;
    };
    modelBObject1Base: {
      assumedBaseHex: string;
      classALinearHex: string;
      classBLinearHex: string;
      reachesAssociatedPayload: boolean;
      topologicalRegion: string;
    };
    modelCAutoDataBase: {
      isAvailable: boolean;
      assumedBaseHex: string | null;
      classALinearHex: string | null;
      classBLinearHex: string | null;
      reachesAssociatedPayload: boolean;
      topologicalRegion: string;
    };
  };
  callerHandoffEvidence: {
    totalSitesInspected: number;
    segmentOverridesObserved: number;
    explicitDsLoadsObserved: number;
    farPointerLoadsObserved: number;
    cleanWindows: boolean;
    sites: Array<{
      siteId: string;
      siteName: string;
      siteRole: string;
      physicalStartHex: string;
      physicalEndHex: string;
      loadedStartHex: string;
      actualRawBytesHex: string;
      decodedInstructions: Array<{
        physicalOffsetHex: string;
        loadedAddressHex: string;
        mnemonic: string;
        rawBytesHex: string;
      }>;
      segmentOverrideCount: number;
      dsModificationCount: number;
      farSegmentLoadCount: number;
      windowClean: boolean;
    }>;
  };
  epistemicDistinctions: {
    arithmeticCompatibilitySummary: string;
    localStaticEvidenceSummary: string;
    documentedDos4gwModelSummary: string;
    provenRuntimeSegmentStateSummary: string;
  };
  finalClassifications: {
    zeroBasedDsReachesEitherPayload: boolean;
    object1BaseDsWouldReachBothPayloads: boolean;
    fixtureProvidesEvidenceDsHasObject1Base: boolean;
    autoDataObjectBaseReachesEitherPayload: boolean;
  };
  reconciliation: {
    allInvariantsSatisfied: boolean;
    barrierEnforced: boolean;
  };
}
