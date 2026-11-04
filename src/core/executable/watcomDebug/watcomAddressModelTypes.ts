/**
 * Open Watcom to Linear Executable (LE) Address Model Qualification Types (Pass 1E.3C.1).
 *
 * Grounded in:
 * - Open Watcom debug format specifications (watldsym.c, dbgmod.h)
 * - Linear Executable (LE) format specifications
 * - Strict Epistemic Invariants:
 *   * NUMERIC EQUALITY != OBJECT IDENTITY: Mappings must be qualified structurally.
 *   * ADDRESS-MODEL QUALIFICATION != SPECIFIC-SYMBOL INTERPRETATION.
 *   * STRUCTURAL OBJECT MEMBERSHIP != RUNTIME ADDRESS MAPPING.
 *   * NO MORTAL KOMBAT SYMBOL NAMES, EXPECTED COUNTS, OR ADDRESSES USED.
 *   * NO BSS TERMINOLOGY WITHOUT INDEPENDENT PROOF.
 */

import { FixtureProvenance } from './watcomDebugTypes';
import {
  WatcomAddressInfoClass,
  WatcomSegmentInfo,
  WatcomGlobalSymbol,
  WatcomGlobalSymbolClass,
  WatcomSegmentAddressTable,
} from './watcomPermanentClassTypes';

/**
 * Structural evaluation between a single Watcom segment identifier and an LE Object.
 */
export interface WatcomSegmentToObjectPairing {
  watcomSegment: number;
  watcomSegmentHex: string;
  leObjectNumber: number; // 1-based LE object number
  leObjectRelocBase: number;
  leObjectRelocBaseHex: string;
  leObjectVirtualSize: number;
  leObjectVirtualSizeHex: string;
  leObjectFlags: number;
  leObjectFlagsHex: string;
  leObjectIsExecutable: boolean;
  leObjectIsWritable: boolean;
  leObjectIsReadable: boolean;
  leObjectPageMapIndex: number;
  leObjectPageMapEntryCount: number;

  // Symbol containment & distribution metrics
  totalSymbolsInSegment: number;
  symbolsContainedInVirtualSize: number;
  symbolsOverflowingVirtualSize: number;
  allSymbolsContained: boolean;
  maxSymbolOffset: number;
  maxSymbolOffsetHex: string;

  // Kind bit distribution vs LE object capabilities
  codeSymbolCount: number;
  dataSymbolCount: number;
  staticSymbolCount: number;
  kindAlignmentScore: number; // 0.0 to 1.0 based on compatibility with object flags
  kindDiscrepancies: string[];

  // Address-info coverage metrics for this pairing (if address-info exists for this segment)
  addressInfoRecordCount: number;
  addressInfoDeclaredSpan: number; // Max (offset + size) across child entries
  addressInfoDeclaredSpanHex: string;
  addressInfoFitsVirtualSize: boolean;

  // Structural verdict for this specific pairing
  verdict: 'COMPATIBLE' | 'PARTIAL_MISMATCH' | 'INCOMPATIBLE';
  reasons: string[];
}

/**
 * Mechanical qualification status for a single Watcom segment.
 */
export interface WatcomSegmentQualification {
  watcomSegment: number;
  watcomSegmentHex: string;
  testedPairings: WatcomSegmentToObjectPairing[];
  compatibleObjectNumbers: number[];
  qualificationStatus: 'UNIQUELY_QUALIFIED' | 'AMBIGUOUS' | 'UNMAPPED';
  qualifiedObjectNumber: number | null; // Set ONLY if UNIQUELY_QUALIFIED
  qualificationReason: string;
  runtimeAddressVerified: false; // Runtime mapping remains unresolved
}

/**
 * Explicit physical backing classifications (replaces unsupported BSS terminology).
 */
export type PhysicalBackingCategory =
  | 'FILE_BACKED'
  | 'PAGE_PADDING'
  | 'ZERO_FILLED_PAGE'
  | 'VIRTUAL_UNBACKED_BEYOND_PAGE_TABLE'
  | 'PAGE_MAP_ENTRY_UNAVAILABLE'
  | 'OUTSIDE_OBJECT'
  | 'UNKNOWN_NON_FILE_BACKED';

/**
 * Physical backing distribution summary across all global symbols.
 */
export interface PhysicalBackingSummary {
  fileBacked: number;
  pagePadding: number;
  zeroFilledPage: number;
  virtualUnbackedBeyondPageTable: number;
  pageMapEntryUnavailable: number;
  outsideObject: number;
  unknownNonFileBacked: number;
  totalSymbols: number;
}

/**
 * Module-range reconciliation status for a global symbol against Watcom address-info.
 */
export type ModuleRangeReconciliationStatus =
  | 'INSIDE_DEFINING_MODULE_SPAN'
  | 'AT_DEFINING_MODULE_END'
  | 'INSIDE_DIFFERENT_MODULE_SPAN'
  | 'OUTSIDE_ADDRESS_INFO_COVERAGE'
  | 'NO_DEFINING_MODULE_SPAN';

/**
 * Cumulative half-open address-info span belonging to a module.
 */
export interface ModuleSpan {
  moduleIndex: number;
  moduleName: string | null;
  startOffset: number;
  startOffsetHex: string;
  endOffset: number;
  endOffsetHex: string;
  size: number;
}

/**
 * Module-range reconciliation exception for reporting.
 */
export interface ModuleRangeReconciliationException {
  globalIndex: number;
  name: string;
  watcomMapSegment: number;
  watcomMapOffset: number;
  watcomMapOffsetHex: string;
  moduleIndex: number;
  moduleName: string | null;
  status: ModuleRangeReconciliationStatus;
  detail: string;
}

/**
 * Full module-range reconciliation result.
 */
export interface ModuleRangeReconciliationResult {
  summary: {
    insideDefiningModuleSpanCount: number;
    atDefiningModuleEndCount: number;
    insideDifferentModuleSpanCount: number;
    outsideAddressInfoCoverageCount: number;
    noDefiningModuleSpanCount: number;
    totalSymbolsReconciled: number;
  };
  symbolStatuses?: ModuleRangeReconciliationStatus[];
  exceptions: ModuleRangeReconciliationException[];
}

/**
 * Complete coordinate derivation record for an Open Watcom global symbol.
 */
export interface WatcomSymbolCoordinateRecord {
  globalIndex: number;
  name: string;
  rawKind: number;
  rawKindHex: string;
  isCode: boolean;
  isData: boolean;
  isStatic: boolean;

  // Watcom Map coordinates
  watcomMapSegment: number;
  watcomMapSegmentHex: string;
  watcomMapOffset: number;
  watcomMapOffsetHex: string;
  moduleIndex: number;
  resolvedModuleName: string | null;

  // Structural LE Object qualification
  qualifiedLeObjectNumber: number | null;
  candidateObjectRelativeOffset: number | null;
  candidateObjectRelativeOffsetHex: string | null;
  lePreferredBase: number | null;
  lePreferredBaseHex: string | null;
  candidatePreferredLinearAddress: number | null;
  candidatePreferredLinearAddressHex: string | null;
  runtimeAddressVerified: false;

  // File backing classification (LE page map candidates — coordinates remain candidates until runtime/image mapping verified)
  lePageMapCandidateBackingCategory: PhysicalBackingCategory;
  lePageMapCandidatePhysicalFileOffset: number | null;
  lePageMapCandidatePhysicalFileOffsetHex: string | null;
  lePhysicalCoordinateVerified: false;
  physicalBackingCategory: PhysicalBackingCategory;
  physicalFileOffset: number | null;
  physicalFileOffsetHex: string | null;
  pageTableIndex: number | null;
  pageMapEntryType: string | null;

  // Module-range reconciliation
  moduleRangeReconciliation: ModuleRangeReconciliationStatus;
  definingModuleSpan: {
    start: number;
    startHex: string;
    end: number;
    endHex: string;
  } | null;
  actualContainingModuleName: string | null;
}

/**
 * Unresolved intervals within LE objects not covered by Watcom address-information.
 */
export interface UnresolvedLECoverageInterval {
  leObjectNumber: number;
  intervalKind: 'UNEXPLAINED_LE_OBJECT_SUFFIX' | 'UNEXPLAINED_LE_OBJECT_PREFIX' | 'UNEXPLAINED_LE_OBJECT_GAP';
  startOffset: number;
  startOffsetHex: string;
  endOffset: number;
  endOffsetHex: string;
  byteLength: number;
  byteLengthHex: string;
  classification: 'UNEXPLAINED LE OBJECT SUFFIX' | 'UNEXPLAINED LE OBJECT PREFIX';
  initialStackEspRelation?: string;
}

/**
 * Status of an individual LE page intersecting an address-info span.
 */
export type SpanPageBackingStatus =
  | 'FULLY_FILE_BACKED'
  | 'PARTIALLY_FILE_BACKED'
  | 'PAGE_PADDING'
  | 'ZERO_FILLED'
  | 'VIRTUAL_UNBACKED'
  | 'INVALID_OR_MISSING_PAGE_MAPPING';

export interface IntersectingPageCoverage {
  logicalPageIndex: number;
  pageTableIndex: number | null;
  pageOffsetStart: number;
  pageOffsetEnd: number;
  pageType: string;
  backingStatus: SpanPageBackingStatus;
  physicalFileStart?: number;
}

/**
 * Address-information segment record coverage reconciliation against LE topology.
 */
export interface WatcomAddressInfoTopologyReconciliation {
  segInfoIndex: number;
  watcomSegment: number;
  watcomSegmentHex: string;
  startAddressOffset: number;
  startAddressOffsetHex: string;
  totalSpanBytes: number;
  totalSpanBytesHex: string;
  entryCount: number;

  // Mapping status
  matchedLeObjectNumber: number | null;
  leObjectVirtualSize: number | null;
  leObjectVirtualSizeHex: string | null;
  isWithinVirtualSize: boolean;
  spanExcessBytes: number; // > 0 if overrunning virtual size

  // Whole span page backing analysis
  allBytesFileBacked: boolean;
  intersectingPagesCount: number;
  fullyFileBackedPagesCount: number;
  partiallyFileBackedPagesCount: number;
  zeroFilledPagesCount: number;
  virtualUnbackedPagesCount: number;
  invalidPagesCount: number;
  intersectingPages: IntersectingPageCoverage[];

  coverageStatus: 'FULL_CONTAINMENT' | 'PARTIAL_FILE_BACKED' | 'OVERRUN' | 'UNMAPPED';
  notes: string[];
}

/**
 * Full qualification report covering all segments, symbols, and address-information records.
 */
export interface WatcomAddressModelQualificationResult {
  segmentQualifications: WatcomSegmentQualification[];
  uniqueMappingCount: number;
  ambiguousMappingCount: number;
  unmappedSegmentCount: number;
  overallMappingState: 'FULLY_QUALIFIED' | 'PARTIALLY_QUALIFIED' | 'AMBIGUOUS' | 'FAILED';

  // Physical backing distribution (replaces unsupported BSS metric)
  physicalBackingSummary: PhysicalBackingSummary;

  // Unresolved LE object coverage intervals
  unresolvedCoverage: UnresolvedLECoverageInterval[];

  // Module-range reconciliation
  moduleRangeReconciliation: ModuleRangeReconciliationResult;

  // Full inventory of symbol derivations
  symbolCoordinateInventory: WatcomSymbolCoordinateRecord[];
  symbolCoordinatesSample: WatcomSymbolCoordinateRecord[]; // First 50 for UI convenience

  // Address-info reconciliation
  addressInfoReconciliations: WatcomAddressInfoTopologyReconciliation[];
  addressInfoAllContained: boolean;

  errors: string[];
}

/**
 * Summary of a Watcom segment for JSON export.
 */
export interface WatcomSegmentSummaryExport {
  watcomSegment: number;
  watcomSegmentHex: string;
  symbolCount: number;
  codeCount: number;
  dataCount: number;
  staticCount: number;
  addressInfoRecordCount: number;
  addressInfoDeclaredSpan: number;
  addressInfoDeclaredSpanHex: string;
  qualificationStatus: 'UNIQUELY_QUALIFIED' | 'AMBIGUOUS' | 'UNMAPPED';
  qualifiedLeObjectNumber: number | null;
}

/**
 * Summary of an LE object for JSON export.
 */
export interface LEObjectSummaryExport {
  objectNumber: number;
  virtualSize: number;
  virtualSizeHex: string;
  relocationBaseAddress: number;
  relocationBaseAddressHex: string;
  flags: number;
  flagsHex: string;
  isExecutable: boolean;
  isWritable: boolean;
  isReadable: boolean;
  pageMapIndex: number;
  pageMapEntryCount: number;
}

/**
 * Authoritative Pass 1E.3C.1 JSON export schema (v2).
 */
export interface MK1WatcomAddressModelExportV2 {
  metadata: {
    name: string;
    version: string;
    milestone: string;
    formatVersion: 'mk1_watcom_address_model_qualification_v2';
    exportTimestamp: string;
  };
  provenance: FixtureProvenance;
  fixture: {
    exePath: string;
    exeSize: number;
    exeSizeHex: string;
  };
  watcomSegments: WatcomSegmentSummaryExport[];
  leObjects: LEObjectSummaryExport[];
  mappingCandidates: WatcomSegmentToObjectPairing[];
  selectedMappings: {
    watcomSegment: number;
    watcomSegmentHex: string;
    qualifiedLeObjectNumber: number;
    status: 'UNIQUELY_QUALIFIED';
    reason: string;
    runtimeAddressVerified: false;
  }[];
  moduleRangeReconciliation: {
    summary: {
      insideDefiningModuleSpanCount: number;
      atDefiningModuleEndCount: number;
      insideDifferentModuleSpanCount: number;
      outsideAddressInfoCoverageCount: number;
      noDefiningModuleSpanCount: number;
      totalSymbolsReconciled: number;
    };
    exceptions: {
      globalIndex: number;
      name: string;
      watcomMapSegment: number;
      watcomMapOffsetHex: string;
      moduleIndex: number;
      moduleName: string | null;
      status: ModuleRangeReconciliationStatus;
      detail: string;
    }[];
  };
  physicalBackingSummary: PhysicalBackingSummary;
  unresolvedCoverage: UnresolvedLECoverageInterval[];
  symbolCoordinateInventory: WatcomSymbolCoordinateRecord[];
  symbolCoordinatesSample: WatcomSymbolCoordinateRecord[];
  validation: {
    allChecksPassed: boolean;
    overallMappingState?: 'FULLY_QUALIFIED' | 'PARTIALLY_QUALIFIED' | 'AMBIGUOUS' | 'FAILED';
    allSymbolsMappedToUniqueObjects?: boolean;
    runtimeAddressVerified?: boolean;
    checks: {
      checkId: string;
      name: string;
      passed: boolean;
      detail: string;
    }[];
  };
}
