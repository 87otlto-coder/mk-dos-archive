import { LEPageFixupInfo, LEParsedFixupRecord } from '../../../core/executable/le/leFixupParser';

export const B10C_EXPORT_FORMAT_VERSION = 'mk1_palette_seed_fixup_qualification_v1';

export const B10C_EPISTEMIC_RULES = [
  'DO NOT FOLLOW 0x53D33 or 0x53D4A (candidate destination control boundary is an absolute barrier)',
  'DO NOT EXTEND DISASSEMBLY beyond verified instruction boundaries',
  'DO NOT INSPECT 0x53CA1 or assume surrounding prologue/epilogue sequences',
  'DO NOT INFER DS/CS SEGMENT ASSUMPTIONS without explicit selector relocation evidence',
  'DO NOT ASSUME DOS/4GW DEFAULTS or flat-model uniformity without verifying LE object definitions',
  'DO NOT CALL EAX A POINTER OR ARGUMENT without explicit memory dereference or calling convention proof',
  'DO NOT MAKE PALETTE CONSUMER OR OWNERSHIP CLAIMS without verified functional data flow',
] as const;

export type SeedFieldFixupClassification =
  | 'direct'
  | 'chained'
  | 'overlapping'
  | 'no-fixup'
  | 'ambiguous';

export type FixupFieldRelation =
  | 'exact-match'
  | 'chained-member'
  | 'overlapping'
  | 'cross-page'
  | 'adjacent'
  | 'unrelated';

export interface MK1AnchorMatch {
  anchorName: string;
  addressHex: string;
  delta: number;
}

export interface MK1AnchorComparison {
  knownAnchorMatches: MK1AnchorMatch[];
  isKnownPaletteCoordinate: boolean;
  notes: string;
}

export interface MK1SeedFieldFixupMatch {
  fixupRecord: LEParsedFixupRecord;
  sourceOffsetInPage: number;
  fixupSpanInPage: [number, number]; // [start, end)
  relation: FixupFieldRelation;
  preferredLinearCandidate: number | null;
  preferredLinearCandidateHex: string | null;
  anchorComparison: MK1AnchorComparison | null;
}

export interface MK1SeedFieldQualification {
  siteId: string;
  siteName: string;
  stateClass: 'Class A' | 'Class B';
  instructionPhysicalOffset: number;
  instructionPhysicalOffsetHex: string;
  operandPhysicalOffset: number;
  operandPhysicalOffsetHex: string;
  rawImmediateValue: number;
  rawImmediateValueHex: string;
  instructionMnemonic: string;
  objectNumber: number;
  objectOffset: number;
  objectOffsetHex: string;
  logicalPageNumber: number;
  sourceOffsetInPage: number;
  sourceOffsetInPageHex: string;
  fieldByteSpanInPage: [number, number]; // [start, end)
  classification: SeedFieldFixupClassification;
  classificationDescription: string;
  matchingFixups: MK1SeedFieldFixupMatch[];
  touchingFixupCount: number;
  exactMatchFound: boolean;
  chainedMatchFound: boolean;
  overlappingFound: boolean;
  crossPageFound: boolean;
  isChainedFixup: boolean;
  chainMemberIndex: number | null;
  chainRecordOffsetHex: string | null;
  isRawLiteral: boolean;
}

export interface MK1TargetPageChainingSummary {
  logicalPageNumber: number;
  directFixupRecordCount: number;
  chainingRecordCount: number;
  expandedChainMemberOffsets: number[];
  expandedChainMemberOffsetsHex: string[];
  allChainsResolved: boolean;
  chainResolutionDetails: Array<{
    recordFileOffsetHex: string;
    headOffsetHex: string;
    memberCount: number;
    terminalStatus: string;
    isTerminated: boolean;
    terminalValueHex: string | null;
  }>;
  fieldCoverage: Array<{
    siteId: string;
    operandPhysicalOffsetHex: string;
    isCovered: boolean;
    coverageKind: 'direct' | 'chained' | 'overlapping' | 'none';
  }>;
}

export interface MK1MechanicalValidationRecord {
  parserValidated: boolean;
  knownGoodPagesSampled: number;
  totalFixupsParsedOnSampledPages: number;
  sampledPageSummaries: Array<{
    logicalPageNumber: number;
    recordCount: number;
    firstRecordSummary?: string;
  }>;
  notes: string;
}

export interface MK1SeedFixupReconciliation {
  allReconciled: boolean;
  parserValidated: boolean;
  fourFieldsEvaluated: boolean;
  allChainsResolved: boolean;
  noAmbiguousClassifications: boolean;
  classACovered: boolean;
  classBCovered: boolean;
  allClassificationsDeterministic: boolean;
  rulesHonored: {
    candidateBoundaryNotFollowed: boolean;
    disassemblyNotExtended: boolean;
    no0x53CA1Inspection: boolean;
    noSegmentInference: boolean;
    noDos4gwAssumption: boolean;
    noPointerAssumption: boolean;
    noPaletteConsumerClaim: boolean;
  };
  summary: string;
}

export interface MK1PaletteSeedFixupQualificationResult {
  status: 'SUCCESS' | 'FAILED';
  operationId: string;
  timestamp: string;
  epistemicRules: readonly string[];
  fixture: {
    exePath: string;
    exeSize: number;
  };
  pageFixupSummaries: Record<number, LEPageFixupInfo>;
  targetPagesChainingSummary: Record<number, MK1TargetPageChainingSummary>;
  seedFields: MK1SeedFieldQualification[];
  mechanicalValidation: MK1MechanicalValidationRecord;
  reconciliation: MK1SeedFixupReconciliation;
}

export interface MK1CompactPaletteSeedFixupQualificationExport {
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
  targetPagesChainingSummary: Record<number, MK1TargetPageChainingSummary>;
  seedFields: MK1SeedFieldQualification[];
  mechanicalValidation: MK1MechanicalValidationRecord;
  reconciliation: MK1SeedFixupReconciliation;
}
