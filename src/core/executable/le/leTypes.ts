/**
 * Generic Linear Executable (LE) Format Types
 *
 * Implements authoritative Open Watcom / DOS4GW Linear Executable (LE)
 * data structures, object table definitions, and 24-bit page mapping types.
 */

export interface LEObjectFlags {
  readable: boolean;
  writable: boolean;
  executable: boolean;
  resource: boolean;
  discardable: boolean;
  shared: boolean;
  preload: boolean;
  invalid: boolean;
  swappable: boolean; // LE OBJ_PERM_SWAPPABLE (0x0100), not LX zero-fill
  resident: boolean;
  big32Bit: boolean;
}

export type LEObjectRoleEvidence =
  | 'executable-code-like'
  | 'read-write-data-like'
  | 'read-only-data-like'
  | 'resource-like'
  | 'unknown';

export interface LEPhysicalSpan {
  fileStart: number;
  fileEnd: number;
  byteLength: number;
  objectPageStart: number;
  pageCount: number;
}

export interface LEObjectEntry {
  objectNumber: number; // 1-based
  virtualSize: number;
  virtualSizeHex: string;
  relocationBaseAddress: number;
  relocationBaseAddressHex: string;
  rawFlags: number;
  flags: LEObjectFlags;
  pageMapIndex: number; // 1-based index in the LE page table
  pageMapEntryCount: number;
  capabilities: string; // e.g. "R-X / 32-bit", "RW- / 32-bit"
  roleEvidence: LEObjectRoleEvidence;
  physicalSpans: LEPhysicalSpan[];
  mappedPageCount: number;
  zeroFilledPageCount: number;
}

export interface LEObjectBackingSummary {
  objectNumber: number;
  virtualSize: number;
  virtualSizeHex: string;
  pageMapEntryCount: number;
  mappedPageCount: number;
  explicitZeroFilledPageCount: number;
  rawFileBackedPageBytes: number;
  rawFileBackedPageBytesHex: string;
  addressableFileBackedBytes: number;
  addressableFileBackedBytesHex: string;
  physicalPagePaddingBytes: number;
  physicalPagePaddingBytesHex: string;
  virtualBytesWithoutFileBacking: number;
  virtualBytesWithoutFileBackingHex: string;
  notes?: string;
}

export type LEPageType =
  | 'valid'
  | 'iterated'
  | 'invalid'
  | 'zero-filled'
  | 'range'
  | 'unknown';

export interface LEPageMapEntry {
  pageMapIndex: number; // 1-based index in LE page table
  physicalPageNumber: number; // Decoded 24-bit physical page number (1-based)
  rawBytes: [number, number, number]; // 3-byte physical page number
  rawFlags: number; // 8-bit page flags
  pageType: LEPageType;
  physicalFileStart?: number;
  physicalByteLength?: number;
}

export interface LEHeader {
  signature: 'LE';
  byteOrder: number;
  wordOrder: number;
  formatLevel: number;
  cpuType: number;
  cpuTypeDescription: string;
  targetOs: number;
  targetOsDescription: string;
  moduleVersion: number;
  moduleFlags: number;
  modulePageCount: number;
  entryObject: number;
  entryEip: number;
  entryEipHex: string;
  stackObject: number;
  stackEsp: number;
  stackEspHex: string;
  pageSize: number;
  bytesOnLastPage: number;
  fixupSectionSize: number;
  loaderSectionSize: number;

  // Offsets with explicit base semantics
  objectTableRelativeOffset: number;
  objectTableFileOffset: number;
  objectCount: number;

  objectPageMapRelativeOffset: number;
  objectPageMapFileOffset: number;

  residentNameTableRelativeOffset: number;
  residentNameTableFileOffset: number;

  entryTableRelativeOffset: number;
  entryTableFileOffset: number;

  fixupPageTableRelativeOffset: number;
  fixupPageTableFileOffset: number;

  fixupRecordTableRelativeOffset: number;
  fixupRecordTableFileOffset: number;

  importModuleTableRelativeOffset: number;
  importModuleTableFileOffset: number;
  importModuleCount: number;

  importProcedureTableRelativeOffset: number;
  importProcedureTableFileOffset: number;

  dataPagesFileOffset: number; // Absolute file offset from start of file
  preloadPageCount: number;

  nonResidentNameTableFileOffset: number; // Absolute file offset from start of file
  nonResidentNameTableLength: number;

  autoDataObject: number;
  debugInfoFileOffset: number; // Absolute file offset from start of file
  debugInfoLength: number;
  heapSize: number;
}

export interface LEValidationRule {
  rule: string;
  passed: boolean;
  details: string;
}

export interface LEValidationResult {
  isValid: boolean;
  confidence: 'invalid' | 'weak' | 'strong';
  passedRuleCount: number;
  totalRuleCount: number;
  rules: LEValidationRule[];
}

export interface LESignatureCandidate {
  fileOffset: number;
  fileOffsetHex: string;
  validation: LEValidationResult;
  header?: LEHeader;
}

export interface LEAddressMappingCandidate {
  objectNumber: number;
  objectOffset: number;
  objectOffsetHex: string;
  linearAddressCandidate: number;
  linearAddressCandidateHex: string;
  objectCapabilities: string;
  objectRoleEvidence: LEObjectRoleEvidence;
  provenance: string;
}

export interface LEPayloadAnalysis {
  headerFileOffset: number;
  headerFileOffsetHex: string;
  header: LEHeader;
  objects: LEObjectEntry[];
  pageMap: LEPageMapEntry[];
  validation: LEValidationResult;
}
