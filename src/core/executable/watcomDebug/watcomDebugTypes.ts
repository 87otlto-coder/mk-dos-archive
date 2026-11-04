/**
 * Generic Open Watcom Debug Information Formats and Structures
 * Based authoritatively on Open Watcom v2 source code (wdbginfo.h, watldsym.c, strip.c).
 *
 * Epistemic Policy:
 * External Open Watcom specifications serve only as format hypotheses/definitions.
 * Actual fixture bytes from MK1.EXE are authoritative for qualification.
 */

/**
 * Watcom Debug Signature constants from Open Watcom `wdbginfo.h`
 */
export const WATCOM_DEBUG_CONSTANTS = {
  /** Master debug header signature (0x8386, bytes [0x86, 0x83] in little-endian) */
  WAT_DBG_SIGNATURE: 0x8386,
  /** Watcom resource signature (0x8302, bytes [0x02, 0x83]) */
  WAT_RES_SIG: 0x8302,
  /** Fox signature 1 (0x8300, bytes [0x00, 0x83]) */
  FOX_SIGNATURE1: 0x8300,
  /** Fox signature 2 (0x8301, bytes [0x01, 0x83]) */
  FOX_SIGNATURE2: 0x8301,

  /** Version constraints from Open Watcom wdbginfo.h / watldsym.c */
  OLD_EXE_MAJOR_VERSION: 2,
  EXE_MAJOR_VERSION: 3,
  EXE_MINOR_VERSION: 0,
  OBJ_MAJOR_VERSION: 1,
  OBJ_MINOR_VERSION_MIN: 0,
  OBJ_MINOR_VERSION_OLD: 1,
  OBJ_MINOR_VERSION_CURRENT: 3,

  /** Size of master_dbg_header in bytes */
  MASTER_HEADER_SIZE: 14,
  /** Size of section_dbg_header in bytes */
  SECTION_HEADER_SIZE: 18,
} as const;

/**
 * Fixture provenance model enforcing that authoritative research artifacts
 * originate strictly from real user-loaded binaries, never from synthetic test fixtures.
 */
export interface ResearchFixtureProvenance {
  sourceKind: 'user-loaded-directory' | 'user-loaded-file';
  fileName: string;
  byteLength: number;
  sha256: string | null;
  synthetic: false;
  artifactGeneratedByTest: false;
  timestamp: string;
  operationId: string;
}

export interface SyntheticTestProvenance {
  sourceKind: 'synthetic-test-fixture' | 'in-memory-buffer';
  fileName: string;
  byteLength: number;
  sha256: string | null;
  synthetic: true;
  artifactGeneratedByTest: true;
  timestamp: string;
  operationId: string;
}

export type FixtureProvenance = ResearchFixtureProvenance | SyntheticTestProvenance;

/**
 * Alternative debug trailer signatures recognized by Watcom tools (e.g. wstrip)
 */
export const ALTERNATIVE_TRAILER_SIGNATURES = {
  CV4_NB09: 'NB09',
  CV4_NB08: 'NB08',
  CV4_NB07: 'NB07',
  CV4_NB05: 'NB05',
  HLL_NB04: 'NB04',
  TIS_TRAILER: 'TI01',
} as const;

/**
 * Parsed Watcom Master Debug Header (14 bytes at end of debug container)
 *
 * Struct layout from Open Watcom `wdbginfo.h`:
 *   unsigned_16     signature;      // == 0x8386
 *   unsigned_8      exe_major_ver;  // == 2 or 3
 *   unsigned_8      exe_minor_ver;  // == 0
 *   unsigned_8      obj_major_ver;  // == 1
 *   unsigned_8      obj_minor_ver;  // == 0, 1, 2, or 3
 *   unsigned_16     lang_size;      // Source language table size
 *   unsigned_16     segment_size;   // Segment address table size
 *   unsigned_32     debug_size;     // Total debug container size including this 14-byte header
 */
export interface WatcomMasterDebugHeader {
  signature: number;
  signatureHex: string;
  signatureValid: boolean;
  exeMajorVer: number;
  exeMinorVer: number;
  objMajorVer: number;
  objMinorVer: number;
  versionValid: boolean;
  versionString: string;
  langSize: number;
  langSizeHex: string;
  segmentSize: number;
  segmentSizeHex: string;
  debugSize: number;
  debugSizeHex: string;
  headerOffset: number;
  headerOffsetHex: string;
  rawBytesHex?: string;
  rawBytes?: number[];
}

/**
 * Parsed Watcom Section Debug Header (18 bytes at start of each section)
 *
 * Struct layout from Open Watcom `wdbginfo.h`:
 *   unsigned_32     mod_offset;     // Module info offset from section start
 *   unsigned_32     gbl_offset;     // Global symbol offset from section start
 *   unsigned_32     addr_offset;    // Address info offset from section start
 *   unsigned_32     section_size;   // Section size in bytes
 *   unsigned_16     section_id;     // Section identifier
 */
export interface WatcomSectionDebugHeader {
  sectionIndex: number;
  fileOffset: number;
  fileOffsetHex: string;
  modOffset: number;
  modOffsetHex: string;
  gblOffset: number;
  gblOffsetHex: string;
  addrOffset: number;
  addrOffsetHex: string;
  sectionSize: number;
  sectionSizeHex: string;
  sectionId: number;
  isPlacekeeper: boolean;
  valid: boolean;
  validationError?: string;
  rawBytesHex?: string;
  rawBytes?: number[];
}

/**
 * Individual validation check result
 */
export interface WatcomDebugValidationCheck {
  checkId: string;
  name: string;
  passed: boolean;
  detail: string;
}

/**
 * Result of detecting and qualifying a Watcom debug container in an executable
 */
export interface WatcomDebugContainerDiscovery {
  status: 'DETECTED' | 'NOT_DETECTED' | 'INVALID_STRUCTURE';
  format: 'WATCOM' | 'CV4' | 'TIS' | 'UNKNOWN' | 'NONE';
  resourceTrailersBypassed: number;
  candidateCount?: number;
  masterHeader: WatcomMasterDebugHeader | null;
  containerPhysicalStart: number | null;
  containerPhysicalStartHex: string | null;
  containerPhysicalEnd: number | null;
  containerPhysicalEndHex: string | null;
  containerByteLength: number | null;
  langTableStart: number | null;
  langTableStartHex: string | null;
  langTableByteLength: number | null;
  langTableRawBytesHex?: string;
  segmentTableStart: number | null;
  segmentTableStartHex: string | null;
  segmentTableByteLength: number | null;
  segmentTableRawBytesHex?: string;
  sectionsStart: number | null;
  sectionsStartHex: string | null;
  sectionsByteLength: number | null;
  sectionCount: number;
  sections: WatcomSectionDebugHeader[];
  allSectionsValid: boolean;
  tilingValid: boolean;
  validationChecks: WatcomDebugValidationCheck[];
  tailCorrelation?: {
    postModuleTailStart: number;
    postModuleTailStartHex: string;
    postModuleTailEnd: number;
    postModuleTailEndHex: string;
    postModuleTailByteLength: number;
    matchesTailStartExactly: boolean;
    startOffsetDelta: number;
    matchesTailEndExactly: boolean;
    endOffsetDelta: number;
    lengthDelta: number;
    tailCoveragePercentage: number;
    verdict: string;
  };
  unresolvedPreDebugTail?: {
    startOffset: number;
    startOffsetHex: string;
    endOffset: number;
    endOffsetHex: string;
    byteLength: number;
    classification: 'UNKNOWN POST-MODULE / PRE-DEBUG DATA';
  } | null;
}
