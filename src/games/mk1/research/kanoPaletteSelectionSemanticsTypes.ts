import { FixtureProvenance } from '../../../core/executable/watcomDebug/watcomDebugTypes';

export interface CodeContinuationAnchor {
  patternStartPhysicalOffset: number;
  patternStartPhysicalOffsetHex: string;
  continuationPhysicalOffset: number;
  continuationPhysicalOffsetHex: string;
  storedCodeOffset: number;
  storedCodeOffsetHex: string;
  candidateCodeImageBase: number;
  candidateCodeImageBaseHex: string;
}

export interface CodeImageBaseQualification {
  scanWindowStart: number;
  scanWindowStartHex: string;
  scanWindowEnd: number;
  scanWindowEndHex: string;
  anchors: CodeContinuationAnchor[];
  agreeingAnchorCount: number;
  distinctCandidateBases: number[];
  distinctCandidateBasesHex: string[];
  qualifiedBase: number | null;
  qualifiedBaseHex: string | null;
  status: 'QUALIFIED_CODE_FILE_IMAGE_BASE' | 'INSUFFICIENT_ANCHORS' | 'AMBIGUOUS_BASE';
}


export interface StaticCodeDataImageLayoutCrossCheck {
  codeImageBase: number;
  codeImageBaseHex: string;
  watcomCodeDeclaredSpan: number;
  watcomCodeDeclaredSpanHex: string;
  alignment: number;
  alignmentHex: string;
  alignedCodeSpan: number;
  alignedCodeSpanHex: string;
  dataBaseFromCodeLayout: number;
  dataBaseFromCodeLayoutHex: string;
  dataBaseFromNormalTable: number;
  dataBaseFromNormalTableHex: string;
  dataBaseFromAlternateTable: number;
  dataBaseFromAlternateTableHex: string;
  tableBasesAgree: boolean;
  alignedLayoutMatchesTableBase: boolean;
  classification: 'VERIFIED_ALIGNED_CODE_TO_DATA_BASE_RELATIONSHIP' | 'PARTIAL_LAYOUT_MATCH';
}

export interface ResolvedWatcomCodeSymbol {
  name: string;
  moduleIndex: number;
  moduleName: string | null;
  watcomStartOffset: number;
  watcomStartOffsetHex: string;
  watcomEndOffset: number;
  watcomEndOffsetHex: string;
  physicalStart: number;
  physicalStartHex: string;
  physicalEnd: number;
  physicalEndHex: string;
  exactStartMatch: boolean;
}

export interface ResolvedWatcomDataSymbol {
  name: string;
  moduleIndex: number;
  moduleName: string | null;
  watcomOffset: number;
  watcomOffsetHex: string;
  globalIndex: number;
}

export interface SelectionMachineInstruction {
  physicalOffset: number;
  physicalOffsetHex: string;
  bytesHex: string;
  mnemonic: string;
  operands: string;
  role: string;
}

export interface SelectionStateTransition {
  currentAlternateLatch: 'ZERO' | 'NONZERO';
  characterRelation: 'EQUAL' | 'NOT_EQUAL';
  action: 'APPLY_ALTERNATE_AND_SET_LATCH' | 'APPLY_NORMAL_AND_CLEAR_LATCH' | 'NO_PALETTE_CHANGE';
  selectedTable: string | null;
  resultingAlternateLatch: 'ZERO' | 'NONZERO';
}

export interface PaletteSelectionStateMachine {
  physicalStart: number;
  physicalStartHex: string;
  physicalEnd: number;
  physicalEndHex: string;
  containingFunction: ResolvedWatcomCodeSymbol | null;
  a11Offset: number;
  a11OffsetHex: string;
  p1CharOffset: number;
  p1CharOffsetHex: string;
  p2CharOffset: number;
  p2CharOffsetHex: string;
  alternateTableOffset: number;
  alternateTableOffsetHex: string;
  normalTableOffset: number;
  normalTableOffsetHex: string;
  commonCallTargetPhysical: number;
  commonCallTargetPhysicalHex: string;
  tableIndexObjectFieldOffset: number;
  tableIndexObjectFieldOffsetHex: string;
  alternatePostCallJumpTargetPhysical: number;
  alternatePostCallJumpTargetPhysicalHex: string;
  normalPostCallJumpTargetPhysical: number;
  normalPostCallJumpTargetPhysicalHex: string;
  normalPostCallClearsLatch: boolean;
  instructions: SelectionMachineInstruction[];
  transitions: SelectionStateTransition[];
  classification: 'VERIFIED_EDGE_TRIGGERED_CHARACTER_EQUALITY_PALETTE_LATCH';
}

export interface MultiSwpalEvidence {
  function: ResolvedWatcomCodeSymbol;
  physicalBytesHex: string;
  linkedListNextFieldOffset: number;
  linkedListNextFieldOffsetHex: string;
  paletteHandleFieldOffset: number;
  paletteHandleFieldOffsetHex: string;
  freeCallTargetPhysical: number;
  freeCallTargetPhysicalHex: string;
  getCallTargetPhysical: number;
  getCallTargetPhysicalHex: string;
  freeFunction: ResolvedWatcomCodeSymbol | null;
  getFunction: ResolvedWatcomCodeSymbol | null;
  releasesExistingHandles: boolean;
  acquiresReplacementHandles: boolean;
  storesReplacementHandle: boolean;
  classification: 'VERIFIED_MULTI_OBJECT_PALETTE_REBIND';
}

export interface GetPalEvidence {
  function: ResolvedWatcomCodeSymbol;
  paletteHeaderReadPatternFound: boolean;
  paletteHeaderReadOffsetPhysical: number | null;
  paletteHeaderReadOffsetPhysicalHex: string | null;
  palettePointerAdvanceBytes: number | null;
  callTargetsPhysical: number[];
  callTargetsPhysicalHex: string[];
  palsetFunction: ResolvedWatcomCodeSymbol | null;
  callsPalset: boolean;
  classification: 'VERIFIED_PALETTE_RECORD_ACQUIRE' | 'PARTIAL_PALETTE_RECORD_ACQUIRE';
}

export interface SymbolNeighborhoodValidation {
  playerSwpal: ResolvedWatcomCodeSymbol | null;
  playerNormpal: ResolvedWatcomCodeSymbol | null;
  multiSwpal: ResolvedWatcomCodeSymbol | null;
  consecutiveBoundaryDeltasMatch: boolean;
  note: string;
}

export interface MK1KanoPaletteSelectionSemanticsReport {
  format: 'mk1_kano_palette_selection_semantics_v1';
  timestamp: string;
  operationId: string;
  provenance: FixtureProvenance;
  fixture: {
    exePath: string;
    exeSize: number;
    exeSizeHex: string;
  };
  prerequisite: {
    pass: '1E.3E';
    status: string;
    referenceGraphEstablished: boolean;
    validationPassed: boolean;
  };
  codeImageBaseQualification: CodeImageBaseQualification;
  staticCodeDataImageLayoutCrossCheck: StaticCodeDataImageLayoutCrossCheck | null;
  selectorStateSymbols: {
    a11: ResolvedWatcomDataSymbol | null;
    p1Char: ResolvedWatcomDataSymbol | null;
    p2Char: ResolvedWatcomDataSymbol | null;
  };
  selectionStateMachine: PaletteSelectionStateMachine | null;
  commonPaletteRebind: MultiSwpalEvidence | null;
  getPalEvidence: GetPalEvidence | null;
  symbolNeighborhoodValidation: SymbolNeighborhoodValidation;
  decision: {
    codeImageBaseEstablished: boolean;
    staticCodeDataImageLayoutEstablished: boolean;
    characterEqualityTriggerEstablished: boolean;
    alternateLatchBehaviorEstablished: boolean;
    commonPaletteRebindEstablished: boolean;
    paletteRecordAcquireEstablished: boolean;
    mirrorMatchInterpretation: 'INFERRED' | 'UNRESOLVED';
    hardwareTransferSemanticsEstablished: false;
    verdict:
      | 'SAME_CHARACTER_PALETTE_SWITCH_SEMANTICS_ESTABLISHED'
      | 'PARTIAL_SELECTION_SEMANTICS'
      | 'PREREQUISITE_FAILED';
    narrative: string;
  };
  status: 'SUCCESS' | 'PARTIAL' | 'PREREQUISITE_FAILED';
}

export interface MK1KanoPaletteSelectionSemanticsExport {
  metadata: {
    name: string;
    version: string;
    milestone: string;
    formatVersion: string;
    exportTimestamp: string;
  };
  provenance: FixtureProvenance;
  fixture: MK1KanoPaletteSelectionSemanticsReport['fixture'];
  prerequisite: MK1KanoPaletteSelectionSemanticsReport['prerequisite'];
  codeImageBaseQualification: CodeImageBaseQualification;
  staticCodeDataImageLayoutCrossCheck: StaticCodeDataImageLayoutCrossCheck | null;
  selectorStateSymbols: MK1KanoPaletteSelectionSemanticsReport['selectorStateSymbols'];
  selectionStateMachine: PaletteSelectionStateMachine | null;
  commonPaletteRebind: MultiSwpalEvidence | null;
  getPalEvidence: GetPalEvidence | null;
  symbolNeighborhoodValidation: SymbolNeighborhoodValidation;
  decision: MK1KanoPaletteSelectionSemanticsReport['decision'];
  validation: {
    allChecksPassed: boolean;
    checks: Array<{
      checkId: string;
      name: string;
      passed: boolean;
      detail: string;
    }>;
  };
}
