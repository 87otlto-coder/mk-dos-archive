/**
 * Open Watcom Permanent Debug Information Classes
 * Based authoritatively on Open Watcom source code (wdbginfo.h, watldsym.c, dbgmod.h).
 *
 * Epistemic Policy:
 * The parser performs blind structural enumeration of permanent debug classes.
 * No Mortal Kombat symbol names, expected counts, or semantic interpretations guide discovery.
 */

/**
 * An entry in the Watcom Source-Language Table.
 * Languages are stored as unique NUL-terminated strings.
 */
export interface WatcomSourceLanguageEntry {
  /** Sequential entry index */
  index: number;
  /** Byte offset relative to start of language table */
  tableOffset: number;
  /** Total byte length of entry including terminating NUL */
  byteLength: number;
  /** Decoded ASCII language string (without NUL) */
  language: string;
  /** Physical file offset of string start */
  fileOffset: number;
  /** Physical file offset hex */
  fileOffsetHex: string;
  /** Whether the string correctly terminated with a NUL */
  valid: boolean;
  /** Error message if malformed */
  error?: string;
}

export interface WatcomSourceLanguageTable {
  fileOffset: number;
  fileOffsetHex: string;
  declaredByteLength: number;
  consumedByteLength: number;
  entries: WatcomSourceLanguageEntry[];
  valid: boolean;
  errors: string[];
}

/**
 * An entry in the Watcom Segment-Address Table.
 * Stored as an array of 16-bit segment selectors/numbers.
 */
export interface WatcomSegmentAddressEntry {
  /** Sequential entry index (0-indexed) */
  entryIndex: number;
  /** Raw 16-bit segment selector/number */
  segment: number;
  /** Hex representation (e.g. "0x0001") */
  segmentHex: string;
  /** Physical byte offset in executable */
  fileOffset: number;
  /** Physical file offset hex */
  fileOffsetHex: string;
  /** Byte offset relative to start of segment table */
  tableOffset: number;
}

export interface WatcomSegmentAddressTable {
  fileOffset: number;
  fileOffsetHex: string;
  declaredByteLength: number;
  consumedByteLength: number;
  entryCount: number;
  entries: WatcomSegmentAddressEntry[];
  valid: boolean;
  errors: string[];
}

/**
 * Watcom demand-load block descriptor from Open Watcom `wdbginfo.h`:
 *   unsigned_32 offset;
 *   unsigned_16 num;
 */
export interface WatcomDemandInfo {
  offset: number;
  offsetHex: string;
  numEntries: number;
}

/**
 * Watcom module-information record (`mod_info`) from Open Watcom `wdbginfo.h` / `watldsym.c`:
 *   unsigned_16 language;
 *   demand_info locals;
 *   demand_info types;
 *   demand_info lines;
 *   unsigned_8  name[1]; // length-prefixed: name[0] is length in bytes
 */
export interface WatcomModuleInfo {
  /** Sequential module index (0-indexed) */
  moduleIndex: number;
  /** Physical file offset of record start */
  fileOffset: number;
  fileOffsetHex: string;
  /** Offset relative to start of containing section */
  sectionOffset: number;
  sectionOffsetHex: string;
  /** Total record byte length (21 + nameLength) */
  recordByteLength: number;
  /** Offset into source-language table */
  languageOffset: number;
  /** Resolved language string if offset matches a language table entry */
  resolvedLanguage: string | null;
  /** Demand-load locals descriptor */
  locals: WatcomDemandInfo;
  /** Demand-load types descriptor */
  types: WatcomDemandInfo;
  /** Demand-load lines descriptor */
  lines: WatcomDemandInfo;
  /** Length of module name in bytes */
  nameLength: number;
  /** Decoded module name string */
  name: string;
  /** First 20 bytes (fixed header) hex dump */
  fixedHeaderRawBytesHex: string;
  /** Whether record layout is structurally valid */
  valid: boolean;
  /** Error message if malformed */
  error?: string;
}

export interface WatcomModuleClass {
  fileOffsetStart: number;
  fileOffsetStartHex: string;
  fileOffsetEnd: number;
  fileOffsetEndHex: string;
  declaredByteLength: number;
  consumedByteLength: number;
  moduleCount: number;
  modules: WatcomModuleInfo[];
  tilingValid: boolean;
  valid: boolean;
  errors: string[];
}

/**
 * Decoded Open Watcom symbol kind bits from Open Watcom `wdbginfo.h`:
 *   S_STATIC = 0x01
 *   S_DATA   = 0x02
 *   S_CODE   = 0x04
 */
export interface WatcomGlobalSymbolKindBits {
  isStatic: boolean;
  isData: boolean;
  isCode: boolean;
  rawKind: number;
  rawKindHex: string;
}

/**
 * Watcom global symbol record (`gbl_info`) from Open Watcom `wdbginfo.h` / `watldsym.c`:
 *   addr48_ptr  addr;   // u32 offset, u16 segment (6 bytes)
 *   unsigned_16 mod;    // module index (2 bytes)
 *   unsigned_8  kind;   // kind bitfield (1 byte)
 *   unsigned_8  name[1];// length-prefixed: name[0] is length in bytes
 */
export interface WatcomGlobalSymbol {
  /** Sequential global symbol index (0-indexed) */
  globalIndex: number;
  /** Physical file offset */
  fileOffset: number;
  fileOffsetHex: string;
  /** Offset relative to start of containing section */
  sectionOffset: number;
  sectionOffsetHex: string;
  /** Total record byte length (10 + nameLength) */
  recordByteLength: number;
  /** Symbol offset within segment */
  addressOffset: number;
  addressOffsetHex: string;
  /** Segment selector / number */
  segment: number;
  segmentHex: string;
  /** Owning module index */
  moduleIndex: number;
  /** Resolved module name if index points to valid module */
  resolvedModuleName: string | null;
  /** Raw kind byte */
  rawKind: number;
  /** Decoded kind bits */
  kindBits: WatcomGlobalSymbolKindBits;
  /** Length of symbol name in bytes */
  nameLength: number;
  /** Decoded symbol name string */
  name: string;
  /** Whether record layout is structurally valid */
  valid: boolean;
  /** Error message if malformed */
  error?: string;
}

export interface WatcomGlobalSymbolClass {
  fileOffsetStart: number;
  fileOffsetStartHex: string;
  fileOffsetEnd: number;
  fileOffsetEndHex: string;
  declaredByteLength: number;
  consumedByteLength: number;
  symbolCount: number;
  symbols: WatcomGlobalSymbol[];
  tilingValid: boolean;
  valid: boolean;
  errors: string[];
}

/**
 * Watcom address information child entry (`addr_info`) from Open Watcom:
 *   unsigned_32 size;
 *   unsigned_16 mod;
 */
export interface WatcomAddressInfoEntry {
  entryIndex: number;
  size: number;
  sizeHex: string;
  moduleIndex: number;
  resolvedModuleName: string | null;
}

/**
 * Watcom segment address information record (`seg_info`) from Open Watcom:
 *   addr48_ptr  addr;   // u32 offset, u16 segment (6 bytes)
 *   unsigned_16 num;    // low 15 bits count, bit 15 NonSect flag (2 bytes)
 *   addr_info   entries[num & 0x7FFF];
 */
export interface WatcomSegmentInfo {
  segInfoIndex: number;
  fileOffset: number;
  fileOffsetHex: string;
  sectionOffset: number;
  sectionOffsetHex: string;
  recordByteLength: number;
  startAddressOffset: number;
  startAddressOffsetHex: string;
  segment: number;
  segmentHex: string;
  rawNum: number;
  rawNumHex: string;
  entryCount: number;
  isNonSect: boolean;
  entries: WatcomAddressInfoEntry[];
  valid: boolean;
  error?: string;
}

export interface WatcomAddressInfoClass {
  fileOffsetStart: number;
  fileOffsetStartHex: string;
  fileOffsetEnd: number;
  fileOffsetEndHex: string;
  declaredByteLength: number;
  consumedByteLength: number;
  segmentRecordCount: number;
  segmentRecords: WatcomSegmentInfo[];
  tilingValid: boolean;
  valid: boolean;
  errors: string[];
}

/**
 * Cross-class structural reconciliation report.
 */
export interface WatcomPermanentClassValidation {
  languageTableConsumed: boolean;
  segmentTableConsumed: boolean;
  moduleClassTiled: boolean;
  globalClassTiled: boolean;
  addressClassTiled: boolean;
  allModuleLanguagesValid: boolean;
  allGlobalModulesValid: boolean;
  allAddressModulesValid: boolean;
  symbolSegmentsReconciled: {
    uniqueSymbolSegments: number[];
    segmentTableValues: number[];
    allPresentInTable: boolean;
  };
  duplicateModuleNames: Array<{ name: string; count: number }>;
  duplicateGlobalSymbols: Array<{ name: string; count: number }>;
  allChecksPassed: boolean;
}

/**
 * Combined result of permanent debug-information classes enumeration.
 */
export interface WatcomPermanentClassesResult {
  languages: WatcomSourceLanguageTable;
  segmentAddresses: WatcomSegmentAddressTable;
  modules: WatcomModuleClass;
  globalSymbols: WatcomGlobalSymbolClass;
  addressInfo: WatcomAddressInfoClass;
  validation: WatcomPermanentClassValidation;
  overallValid: boolean;
  errors: string[];
}
