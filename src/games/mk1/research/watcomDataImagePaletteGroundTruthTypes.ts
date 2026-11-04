/**
 * MK1 Watcom Data-Image Base and Symbol-Derived Palette Ground Truth Types
 * Pass 1E.3D.1 corrective implementation.
 *
 * Epistemic contract:
 * - A static-data file-image base is qualified only when two independent fixture-derived anchors agree.
 * - Direct LE page-map translation is retained as a competing coordinate model, never as the qualifier.
 * - NEWPALS.ASM is selected exactly after blind Watcom enumeration.
 * - Palette records are structural [u16 length][u16 colors[length]] records; symbol names do not create validity.
 * - Runtime address semantics and IRQSKYE/indexing semantics remain unresolved unless mechanically demonstrated.
 */

import { FixtureProvenance } from '../../../core/executable/watcomDebug/watcomDebugTypes';
import { MK1RgbColor, PaletteCandidateTier } from './paletteTypes';

export interface DerivedHandleTableAnchorEvidence {
  physicalStart: number;
  physicalStartHex: string;
  physicalEnd: number;
  physicalEndHex: string;
  entryCount: number;
  stride: number;
  stringResolutionBase?: number;
  stringResolutionBaseHex?: string;
  stringResolutionConfidence: string;
  directoryReconciledCount: number;
  reconstructionStatus: 'VERIFIED_FIXTURE' | 'INFERRED' | 'FAILED';
  isAnchorVerified: boolean;
}

export interface WatcomHandleTableSymbolEvidence {
  name: string;
  watcomMapSegment: number;
  watcomMapSegmentHex: string;
  watcomMapOffset: number;
  watcomMapOffsetHex: string;
  moduleIndex: number;
  moduleName: string | null;
  rawKind: number;
  isData: boolean;
}

export type StaticDataBaseQualificationStatus =
  | 'QUALIFIED_STATIC_DATA_FILE_BASE'
  | 'MISSING_ANCHOR'
  | 'MISSING_STRING_BASE'
  | 'INVALID_HANDLE_SYMBOL'
  | 'SUBTRACTION_UNDERFLOW'
  | 'BASE_DISAGREEMENT'
  | 'ANCHOR_FAILURE';

export interface StaticDataBaseQualification {
  status: StaticDataBaseQualificationStatus;
  candidateBaseA: number | null;
  candidateBaseAHex: string | null;
  candidateBaseB: number | null;
  candidateBaseBHex: string | null;
  basesAgree: boolean;
  anchorRoundTripPassed: boolean;
  qualifiedBase: number | null;
  qualifiedBaseHex: string | null;
  rationale: string[];
}

export interface LePageMapComparison {
  watcomSegment: number | null;
  leObjectNumber: number | null;
  candidatePhysicalOffset: number | null;
  candidatePhysicalOffsetHex: string | null;
  handleTablePhysicalStart: number;
  handleTablePhysicalStartHex: string;
  matchesStaticImageAnchor: boolean;
  relationship: 'AGREES' | 'DISAGREES' | 'UNAVAILABLE';
  note: string;
}

export interface AddressModelPreflightSummary {
  runtimeAddressVerified: false;
  leObjects: Array<{
    objectNumber: number;
    virtualSize: number;
    virtualSizeHex: string;
    relocationBaseAddress: number;
    relocationBaseAddressHex: string;
    pageMapIndex: number;
    pageMapEntryCount: number;
    capabilities: string;
  }>;
  moduleRangeReconciliationConsistent: boolean;
}

export interface WatcomPaletteModuleInfo {
  moduleIndex: number;
  moduleName: string;
  segment: number;
  segmentHex: string;
  startOffset: number;
  startOffsetHex: string;
  size: number;
  sizeHex: string;
  endOffset: number;
  endOffsetHex: string;
  symbolCount: number;
  uniqueOffsetCount: number;
}

export interface WatcomPaletteRecord {
  recordIndex: number;
  watcomMapSegment: number;
  watcomMapSegmentHex: string;
  watcomStartOffset: number;
  watcomStartOffsetHex: string;
  watcomEndOffset: number;
  watcomEndOffsetHex: string;
  physicalFileOffset: number;
  physicalFileOffsetHex: string;
  physicalEndOffset: number;
  physicalEndOffsetHex: string;
  declaredLength: number;
  rawColorWords: number[];
  rawColorWordsHex: string[];
  rgbColors: MK1RgbColor[];
  uniqueColorCount: number;
  uniqueColorRatio: number;
  contentHash: string;
  allWords15BitValid: boolean;
  isPaletteStructValid: boolean;
  symbolNames: string[];
  symbolGlobalIndices: number[];
  duplicateContentOfRecordIndex: number | null;
}

export interface PaletteParseFailure {
  watcomOffset: number;
  watcomOffsetHex: string;
  symbolNames: string[];
  reason: string;
}

export interface PaletteModuleTilingResult {
  firstRecordStartsAtModuleStart: boolean;
  finalRecordEndsAtModuleEnd: boolean;
  exactTiling: boolean;
  gapCount: number;
  overlapCount: number;
  gaps: Array<{
    start: number;
    startHex: string;
    end: number;
    endHex: string;
    byteLength: number;
  }>;
  overlaps: Array<{
    previousRecordIndex: number;
    currentRecordIndex: number;
    overlapBytes: number;
  }>;
  parseFailures: PaletteParseFailure[];
  uniqueOffsetCount: number;
  parsedRecordCount: number;
  accountedByteLength: number;
  moduleByteLength: number;
  classification: 'VERIFIED_PALETTE_MODULE' | 'PARTIAL_INCONCLUSIVE';
}

export interface KanoPaletteStructuralDetail {
  symbolName: 'KANO_P' | 'KANO3_P';
  recordIndex: number;
  watcomOffset: number;
  watcomOffsetHex: string;
  physicalOffset: number;
  physicalOffsetHex: string;
  declaredLength: number;
  recordEnd: number;
  recordEndHex: string;
  symbolAliases: string[];
  rawColorWords: number[];
  rgbColors: MK1RgbColor[];
  previousRecordIndex: number | null;
  nextRecordIndex: number | null;
}

export interface KanoPaletteModelComparison {
  paletteSymbolName: string;
  paletteDeclaredLength: number;
  authoritativeSpriteCount: number;
  spriteMinOpaqueIndex: number;
  spriteMaxSourceIndex: number;
  spriteDistinctSourceIndexCount: number;
  spriteUnionIndices: number[];
  opaqueZeroPresentInSprites: boolean;
  zeroBasedModel: {
    indexingDescription: string;
    mappedCount: number;
    mappedIndices: number[];
    outOfRangeCount: number;
    outOfRangeIndices: number[];
    unusedPaletteSlotsCount: number;
    unusedPaletteIndices: number[];
    fitQuality: 'EXACT_FULL_FIT' | 'PARTIAL_OVERFLOW' | 'INCOMPATIBLE';
  };
  oneBasedModel: {
    indexingDescription: string;
    mappedCount: number;
    mappedIndices: number[];
    outOfRangeCount: number;
    outOfRangeIndices: number[];
    unusedPaletteSlotsCount: number;
    unusedPaletteIndices: number[];
    fitQuality: 'EXACT_FULL_FIT' | 'PARTIAL_OVERFLOW' | 'INCOMPATIBLE';
  };
  opaqueZeroResolution: 'NOT_OBSERVED' | 'OBSERVED_UNRESOLVED';
  notes: string[];
}

export interface TupleTableValidation {
  symbolFound: boolean;
  symbolName: string | null;
  watcomMapSegment: number | null;
  watcomMapOffset: number | null;
  watcomMapOffsetHex: string | null;
  physicalFileOffset: number | null;
  physicalFileOffsetHex: string | null;
  entriesRequested: 256;
  entriesChecked: number;
  matchingEntries: number;
  mismatchCount: number;
  firstMismatch: {
    index: number;
    actual: number;
    actualHex: string;
    expected: number;
    expectedHex: string;
  } | null;
  patternVerified: boolean;
  classification: 'VERIFIED' | 'MISMATCH' | 'TRUNCATED' | 'UNAVAILABLE';
}

export interface LegacyCatalogueComparisonEntry {
  recordIndex: number;
  physicalFileOffset: number;
  physicalFileOffsetHex: string;
  symbolNames: string[];
  foundByLegacyScanner: boolean;
  legacyTier: PaletteCandidateTier | null;
  legacyScore: number | null;
  legacyTextLikeScore: number | null;
  legacyContainsLikelyAsciiData: boolean | null;
  legacyContentHash: string | null;
  contentHashMatches: boolean | null;
  legacyDuplicateContentOf: string | null;
}

export interface RelatedWatcomSymbolMetadata {
  name: string;
  segment: number;
  segmentHex: string;
  watcomOffset: number;
  watcomOffsetHex: string;
  moduleIndex: number;
  moduleName: string | null;
  isCode: boolean;
  isData: boolean;
  note: string;
}

export interface MK1WatcomDataImagePaletteGroundTruthReport {
  format: 'mk1_watcom_data_image_palette_ground_truth_v2';
  timestamp: string;
  operationId: string;
  provenance: FixtureProvenance;
  fixture: {
    exePath: string;
    exeSize: number;
    exeSizeHex: string;
  };
  addressModelPreflight: AddressModelPreflightSummary;
  handleTableAnchor: DerivedHandleTableAnchorEvidence;
  handleTableSymbol: WatcomHandleTableSymbolEvidence | null;
  staticDataBaseQualification: StaticDataBaseQualification;
  lePageMapComparison: LePageMapComparison;
  paletteModule: WatcomPaletteModuleInfo | null;
  paletteRecords: WatcomPaletteRecord[];
  moduleTiling: PaletteModuleTilingResult | null;
  kanoPalettes: {
    kanoP: KanoPaletteStructuralDetail | null;
    kano3P: KanoPaletteStructuralDetail | null;
    adjacent: boolean | null;
  };
  kanoPaletteComparison: KanoPaletteModelComparison | null;
  tupleTableValidation: TupleTableValidation;
  legacyCatalogueComparison: LegacyCatalogueComparisonEntry[];
  relatedSymbolMetadata: RelatedWatcomSymbolMetadata[];
  decision: {
    staticDataBaseEstablished: boolean;
    paletteModuleVerified: boolean;
    kanoPaletteIdentified: boolean;
    automaticOwnershipTracingSupported: false;
    verdict: 'STRUCTURAL_GROUND_TRUTH_ESTABLISHED' | 'INCOMPLETE_GROUND_TRUTH';
    narrative: string;
  };
  status: 'SUCCESS' | 'STRUCTURAL_ERROR' | 'MISSING_ANCHOR';
}

export interface MK1WatcomDataImagePaletteGroundTruthExport {
  metadata: {
    name: string;
    version: string;
    milestone: 'Pass 1E.3D.1';
    formatVersion: 'mk1_watcom_data_image_palette_ground_truth_v2';
    exportTimestamp: string;
  };
  provenance: FixtureProvenance;
  fixture: MK1WatcomDataImagePaletteGroundTruthReport['fixture'];
  addressModelPreflight: AddressModelPreflightSummary;
  handleTableAnchor: DerivedHandleTableAnchorEvidence;
  handleTableSymbol: WatcomHandleTableSymbolEvidence | null;
  staticDataBaseQualification: StaticDataBaseQualification;
  lePageMapComparison: LePageMapComparison;
  paletteModule: WatcomPaletteModuleInfo | null;
  paletteRecords: WatcomPaletteRecord[];
  moduleTiling: PaletteModuleTilingResult | null;
  kanoPalettes: MK1WatcomDataImagePaletteGroundTruthReport['kanoPalettes'];
  kanoPaletteComparison: KanoPaletteModelComparison | null;
  tupleTableValidation: TupleTableValidation;
  legacyCatalogueComparison: LegacyCatalogueComparisonEntry[];
  relatedSymbolMetadata: RelatedWatcomSymbolMetadata[];
  decision: MK1WatcomDataImagePaletteGroundTruthReport['decision'];
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
