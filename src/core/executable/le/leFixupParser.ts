import { BinaryReader } from '../../binary/BinaryReader';
import { LEHeader } from './leTypes';

export type { LEHeader };

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

function toHex16(val: number): string {
  return '0x' + (val & 0xffff).toString(16).padStart(4, '0').toUpperCase();
}

function toHex8(val: number): string {
  return '0x' + (val & 0xff).toString(16).padStart(2, '0').toUpperCase();
}

function bytesToHex(bytes: number[] | Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

export type LEFixupTargetType =
  | 'internal'
  | 'imported-ordinal'
  | 'imported-name'
  | 'internal-entry-table'
  | 'unknown';

export interface LEParsedFixupRecord {
  recordFileOffset: number;
  recordFileOffsetHex: string;
  recordByteLength: number;
  rawBytes: number[];
  rawBytesHex: string;

  // Source Type (SRC byte)
  rawSrc: number;
  srcType: number; // rawSrc & 0x0F
  srcTypeDescription: string;
  sourceByteLength: number;
  is16BitAlias: boolean;
  isSourceList: boolean;

  // Target Flags (FLAGS byte)
  rawFlags: number;
  targetType: LEFixupTargetType;
  targetTypeDescription: string;
  isAdditive: boolean;
  isInternalChaining: boolean;
  is32BitTargetOffset: boolean;
  is32BitAdditive: boolean;
  is16BitObjectOrModule: boolean;
  is8BitImportOrdinal: boolean;

  // Source Offsets within the logical page
  sourceOffsetsInPage: number[];

  // Target Data
  targetObjectNumber: number | null;
  targetOffset: number | null;
  targetOffsetHex: string | null;

  // Imported Reference Data
  moduleOrdinal: number | null;
  importOrdinal: number | null;
  procedureNameOffset: number | null;

  // Entry Table Data
  entryTableOrdinal: number | null;

  // Additive Displacement
  additiveDisplacement: number | null;
  additiveDisplacementHex: string | null;
}

export interface LEPageFixupInfo {
  logicalPageNumber: number; // 1-based
  fptTableIndex: number; // 0-based
  recordStartOffset: number;
  recordEndOffset: number;
  recordBytesLength: number;
  recordFileStart: number;
  recordFileEnd: number;
  hasFixups: boolean;
  records: LEParsedFixupRecord[];
  parseError?: string;
}

export function getSourceTypeDescription(srcType: number): { description: string; byteLength: number } {
  switch (srcType) {
    case 0x00:
      return { description: 'Byte fixup (8-bit)', byteLength: 1 };
    case 0x02:
      return { description: '16-bit Selector fixup (16-bit)', byteLength: 2 };
    case 0x03:
      return { description: '16:16 Pointer fixup (32-bit: selector + 16-bit offset)', byteLength: 4 };
    case 0x05:
      return { description: '16-bit Offset fixup (16-bit)', byteLength: 2 };
    case 0x06:
      return { description: '16:32 Pointer fixup (48-bit: selector + 32-bit offset)', byteLength: 6 };
    case 0x07:
      return { description: '32-bit Offset fixup (32-bit)', byteLength: 4 };
    case 0x08:
      return { description: '32-bit Self-relative offset fixup (32-bit)', byteLength: 4 };
    default:
      return { description: `Reserved/Unknown Source Type (${toHex8(srcType)})`, byteLength: 4 };
  }
}

export function getTargetType(rawFlags: number): LEFixupTargetType {
  const typeBits = rawFlags & 0x03;
  switch (typeBits) {
    case 0x00:
      return 'internal';
    case 0x01:
      return 'imported-ordinal';
    case 0x02:
      return 'imported-name';
    case 0x03:
      return 'internal-entry-table';
    default:
      return 'unknown';
  }
}

/**
 * Parses the Fixup Page Table entry for a given 1-based logical page number.
 */
export function getPageFixupOffsets(
  header: LEHeader,
  exeBuffer: Uint8Array,
  logicalPageNumber: number,
): { recordStartOffset: number; recordEndOffset: number; recordBytesLength: number } {
  if (logicalPageNumber < 1 || logicalPageNumber > header.modulePageCount) {
    throw new RangeError(
      `Logical page ${logicalPageNumber} is out of bounds [1..${header.modulePageCount}]`,
    );
  }

  const fptFileOffset = header.fixupPageTableFileOffset;
  const fptEntryOffset = fptFileOffset + (logicalPageNumber - 1) * 4;
  const fptNextEntryOffset = fptFileOffset + logicalPageNumber * 4;

  if (fptNextEntryOffset + 4 > exeBuffer.byteLength) {
    throw new RangeError(
      `Fixup Page Table entry extends beyond buffer (offset ${fptNextEntryOffset})`,
    );
  }

  const view = new DataView(exeBuffer.buffer, exeBuffer.byteOffset, exeBuffer.byteLength);
  const recordStartOffset = view.getUint32(fptEntryOffset, true);
  const recordEndOffset = view.getUint32(fptNextEntryOffset, true);

  return {
    recordStartOffset,
    recordEndOffset,
    recordBytesLength: Math.max(0, recordEndOffset - recordStartOffset),
  };
}

/**
 * Parses a single Fixup Record starting at reader's current position.
 */
export function parseSingleFixupRecord(
  reader: BinaryReader,
): LEParsedFixupRecord {
  const recordFileOffset = reader.position;
  const startPos = reader.position;

  const rawSrc = reader.readUint8();
  const rawFlags = reader.readUint8();

  const srcType = rawSrc & 0x0f;
  const { description: srcTypeDescription, byteLength: sourceByteLength } = getSourceTypeDescription(srcType);
  const is16BitAlias = (rawSrc & 0x10) !== 0;
  const isSourceList = (rawSrc & 0x20) !== 0;

  const targetType = getTargetType(rawFlags);
  const isAdditive = (rawFlags & 0x04) !== 0;
  const isInternalChaining = (rawFlags & 0x08) !== 0;
  const is32BitTargetOffset = (rawFlags & 0x10) !== 0;
  const is32BitAdditive = (rawFlags & 0x20) !== 0;
  const is16BitObjectOrModule = (rawFlags & 0x40) !== 0;
  const is8BitImportOrdinal = (rawFlags & 0x80) !== 0;

  let singleSrcoff: number | null = null;
  let sourceListCount = 0;

  if (isSourceList) {
    sourceListCount = reader.readUint8();
  } else {
    // Read source offset with signed 16-bit semantics for cross-page fixup support
    singleSrcoff = reader.readInt16LE();
  }

  let targetObjectNumber: number | null = null;
  let targetOffset: number | null = null;
  let moduleOrdinal: number | null = null;
  let importOrdinal: number | null = null;
  let procedureNameOffset: number | null = null;
  let entryTableOrdinal: number | null = null;

  switch (targetType) {
    case 'internal': {
      targetObjectNumber = is16BitObjectOrModule ? reader.readUint16LE() : reader.readUint8();
      // Target offset is present unless source type is 16-bit selector
      if (srcType !== 0x02) {
        targetOffset = is32BitTargetOffset ? reader.readUint32LE() : reader.readUint16LE();
      }
      break;
    }
    case 'imported-ordinal': {
      moduleOrdinal = is16BitObjectOrModule ? reader.readUint16LE() : reader.readUint8();
      if (is8BitImportOrdinal) {
        importOrdinal = reader.readUint8();
      } else if (is32BitTargetOffset) {
        importOrdinal = reader.readUint32LE();
      } else {
        importOrdinal = reader.readUint16LE();
      }
      break;
    }
    case 'imported-name': {
      moduleOrdinal = is16BitObjectOrModule ? reader.readUint16LE() : reader.readUint8();
      procedureNameOffset = is32BitTargetOffset ? reader.readUint32LE() : reader.readUint16LE();
      break;
    }
    case 'internal-entry-table': {
      entryTableOrdinal = is16BitObjectOrModule ? reader.readUint16LE() : reader.readUint8();
      break;
    }
    default:
      break;
  }

  let additiveDisplacement: number | null = null;
  if (isAdditive) {
    additiveDisplacement = is32BitAdditive ? reader.readUint32LE() : reader.readUint16LE();
  }

  const sourceOffsetsInPage: number[] = [];
  if (isSourceList) {
    for (let i = 0; i < sourceListCount; i++) {
      // Source offsets in list also carry signed 16-bit semantics for cross-page fixups
      sourceOffsetsInPage.push(reader.readInt16LE());
    }
  } else if (singleSrcoff !== null) {
    sourceOffsetsInPage.push(singleSrcoff);
  }

  const endPos = reader.position;
  const recordByteLength = endPos - startPos;

  // Extract raw bytes
  const savedPos = reader.position;
  reader.seek(startPos);
  const rawBytes = Array.from(reader.readSlice(recordByteLength));
  reader.seek(savedPos);

  return {
    recordFileOffset,
    recordFileOffsetHex: toHex32(recordFileOffset),
    recordByteLength,
    rawBytes,
    rawBytesHex: bytesToHex(rawBytes),
    rawSrc,
    srcType,
    srcTypeDescription,
    sourceByteLength,
    is16BitAlias,
    isSourceList,
    rawFlags,
    targetType,
    targetTypeDescription: targetType,
    isAdditive,
    isInternalChaining,
    is32BitTargetOffset,
    is32BitAdditive,
    is16BitObjectOrModule,
    is8BitImportOrdinal,
    sourceOffsetsInPage,
    targetObjectNumber,
    targetOffset,
    targetOffsetHex: targetOffset !== null ? toHex32(targetOffset) : null,
    moduleOrdinal,
    importOrdinal,
    procedureNameOffset,
    entryTableOrdinal,
    additiveDisplacement,
    additiveDisplacementHex: additiveDisplacement !== null ? toHex32(additiveDisplacement) : null,
  };
}

export interface LEChainMember {
  offset: number;
  offsetHex: string;
  fixupInfo: number;
  nextSourceOffset: number;
  nextSourceOffsetHex: string;
  targetOffset20: number;
  targetOffset20Hex: string;
  derivedTargetOffset: number | null;
  derivedTargetOffsetHex: string | null;
}

export interface LEChainTraversalResult {
  headOffset: number;
  chainOffsets: number[];
  members: LEChainMember[];
  baseTarget: number | null;
  baseTargetHex: string | null;
  terminalValue: number | null;
  isTerminated: boolean;
  status: 'terminal-0xfff' | 'malformed-bounds' | 'loop-detected' | 'unsupported-target' | 'invalid-form';
  error?: string;
}

interface RawChainMember {
  offset: number;
  fixupInfo: number;
  nextSourceOffset: number;
  targetOffset20: number;
}

/**
 * Validates that a fixup record satisfies the LE specification requirements for internal chaining:
 * - source type 07h only (32-bit offset fixup)
 * - target type 00h (internal) or 03h (internal-entry-table)
 * - Source List flag must be clear
 */
export function isValidChainedFixupForm(record: LEParsedFixupRecord): boolean {
  if (record.srcType !== 0x07) {
    return false;
  }
  if (record.isSourceList) {
    return false;
  }
  const targetTypeBits = record.rawFlags & 0x03;
  if (targetTypeBits !== 0x00 && targetTypeBits !== 0x03) {
    return false;
  }
  return true;
}

function computeBaseTarget(
  rawMembers: RawChainMember[],
  record: LEParsedFixupRecord,
): number | null {
  if (rawMembers.length === 0 || record.targetOffset === null) {
    return null;
  }
  const firstTarget = record.targetOffset;
  const firstMember = rawMembers[0];
  return firstTarget - firstMember.targetOffset20;
}

function finalizeChainMembers(
  rawMembers: RawChainMember[],
  record: LEParsedFixupRecord,
): LEChainMember[] {
  if (rawMembers.length === 0) {
    return [];
  }
  const baseTarget = computeBaseTarget(rawMembers, record);
  return rawMembers.map((m) => {
    const derivedTargetOffset =
      baseTarget !== null ? ((baseTarget + m.targetOffset20) >>> 0) : null;
    return {
      offset: m.offset,
      offsetHex: toHex16(m.offset),
      fixupInfo: m.fixupInfo,
      nextSourceOffset: m.nextSourceOffset,
      nextSourceOffsetHex: toHex16(m.nextSourceOffset),
      targetOffset20: m.targetOffset20,
      targetOffset20Hex: toHex32(m.targetOffset20),
      derivedTargetOffset,
      derivedTargetOffsetHex: derivedTargetOffset !== null ? toHex32(derivedTargetOffset) : null,
    };
  });
}

/**
 * Traverses an LE internal chaining fixup (FLAGS bit 0x08) within a logical page.
 * Strictly respects LE specifications:
 * 1. Decode each 32-bit source value as:
 *    - nextSourceOffset = (fixupInfo >>> 20) & 0xFFF
 *    - targetOffset20 = fixupInfo & 0xFFFFF
 * 2. Terminate only when nextSourceOffset === 0xFFF.
 * 3. Traverse using nextSourceOffset; never treat the whole DWORD or low 12 bits as the next offset.
 * 4. Enforce valid chained forms:
 *    - source type 07h only
 *    - target type 00h or 03h
 *    - Source List flag must be clear
 * 5. Where chained target addresses are reported, derive them correctly:
 *    - baseTarget = firstTarget - firstMember.targetOffset20
 *    - each member target = baseTarget + member.targetOffset20
 */
export function traverseLEInternalChain(
  record: LEParsedFixupRecord,
  headOffset: number,
  pageData: Uint8Array,
  pageSize = 4096,
): LEChainTraversalResult {
  if (!isValidChainedFixupForm(record)) {
    return {
      headOffset,
      chainOffsets: [headOffset],
      members: [],
      baseTarget: null,
      baseTargetHex: null,
      terminalValue: null,
      isTerminated: false,
      status: 'invalid-form',
      error: `Invalid chained fixup form: srcType=${toHex8(record.srcType)} (expected 07h), targetTypeBits=${toHex8(record.rawFlags & 0x03)} (expected 00h or 03h), isSourceList=${record.isSourceList} (expected false)`,
    };
  }

  const rawMembers: RawChainMember[] = [];
  const chainOffsets: number[] = [];
  const visited = new Set<number>();
  let currentOffset = headOffset;

  const dataView = new DataView(pageData.buffer, pageData.byteOffset, pageData.byteLength);
  const maxIterations = 4096;
  let iterations = 0;

  while (iterations++ < maxIterations) {
    // 1. Check bounds of current offset within page (32-bit fixup requires 4 contiguous bytes)
    if (
      currentOffset < 0 ||
      currentOffset + 4 > pageData.byteLength ||
      currentOffset + 4 > pageSize
    ) {
      const baseTarget = computeBaseTarget(rawMembers, record);
      return {
        headOffset,
        chainOffsets,
        members: finalizeChainMembers(rawMembers, record),
        baseTarget,
        baseTargetHex: baseTarget !== null ? toHex32(baseTarget) : null,
        terminalValue: null,
        isTerminated: false,
        status: 'malformed-bounds',
        error: `Chain member offset ${toHex16(currentOffset)} extends beyond page bounds [0..${pageSize})`,
      };
    }

    // 2. Loop detection
    if (visited.has(currentOffset)) {
      const baseTarget = computeBaseTarget(rawMembers, record);
      return {
        headOffset,
        chainOffsets,
        members: finalizeChainMembers(rawMembers, record),
        baseTarget,
        baseTargetHex: baseTarget !== null ? toHex32(baseTarget) : null,
        terminalValue: null,
        isTerminated: false,
        status: 'loop-detected',
        error: `Loop detected in chain: offset ${toHex16(currentOffset)} already visited`,
      };
    }

    chainOffsets.push(currentOffset);
    visited.add(currentOffset);

    // 3. Read 32-bit fixupInfo
    const fixupInfo = dataView.getUint32(currentOffset, true);
    const nextSourceOffset = (fixupInfo >>> 20) & 0xfff;
    const targetOffset20 = fixupInfo & 0xfffff;

    rawMembers.push({
      offset: currentOffset,
      fixupInfo,
      nextSourceOffset,
      targetOffset20,
    });

    // 4. Terminate only when nextSourceOffset === 0xFFF
    if (nextSourceOffset === 0xfff) {
      const baseTarget = computeBaseTarget(rawMembers, record);
      return {
        headOffset,
        chainOffsets,
        members: finalizeChainMembers(rawMembers, record),
        baseTarget,
        baseTargetHex: baseTarget !== null ? toHex32(baseTarget) : null,
        terminalValue: fixupInfo,
        isTerminated: true,
        status: 'terminal-0xfff',
      };
    }

    // 5. Advance using nextSourceOffset (never treat the whole DWORD or low 12 bits as next offset)
    currentOffset = nextSourceOffset;
  }

  const baseTarget = computeBaseTarget(rawMembers, record);
  return {
    headOffset,
    chainOffsets,
    members: finalizeChainMembers(rawMembers, record),
    baseTarget,
    baseTargetHex: baseTarget !== null ? toHex32(baseTarget) : null,
    terminalValue: null,
    isTerminated: false,
    status: 'loop-detected',
    error: `Exceeded maximum chain iterations (${maxIterations})`,
  };
}

/**
 * Parses all fixup records for a given logical page (1-based).
 */
export function parsePageFixups(
  header: LEHeader,
  exeBuffer: Uint8Array,
  logicalPageNumber: number,
): LEPageFixupInfo {
  const { recordStartOffset, recordEndOffset, recordBytesLength } = getPageFixupOffsets(
    header,
    exeBuffer,
    logicalPageNumber,
  );

  const fptTableIndex = logicalPageNumber - 1;
  const recordFileStart = header.fixupRecordTableFileOffset + recordStartOffset;
  const recordFileEnd = header.fixupRecordTableFileOffset + recordEndOffset;

  if (recordBytesLength === 0) {
    return {
      logicalPageNumber,
      fptTableIndex,
      recordStartOffset,
      recordEndOffset,
      recordBytesLength: 0,
      recordFileStart,
      recordFileEnd,
      hasFixups: false,
      records: [],
    };
  }

  if (recordFileEnd > exeBuffer.byteLength) {
    return {
      logicalPageNumber,
      fptTableIndex,
      recordStartOffset,
      recordEndOffset,
      recordBytesLength,
      recordFileStart,
      recordFileEnd,
      hasFixups: false,
      records: [],
      parseError: `Page fixup records range [${toHex32(recordFileStart)}..${toHex32(recordFileEnd)}) exceeds executable buffer size (${toHex32(exeBuffer.byteLength)})`,
    };
  }

  const records: LEParsedFixupRecord[] = [];
  const reader = new BinaryReader(exeBuffer, recordFileStart);

  try {
    while (reader.position < recordFileEnd) {
      const record = parseSingleFixupRecord(reader);
      records.push(record);
    }
  } catch (err) {
    return {
      logicalPageNumber,
      fptTableIndex,
      recordStartOffset,
      recordEndOffset,
      recordBytesLength,
      recordFileStart,
      recordFileEnd,
      hasFixups: records.length > 0,
      records,
      parseError: err instanceof Error ? err.message : String(err),
    };
  }

  return {
    logicalPageNumber,
    fptTableIndex,
    recordStartOffset,
    recordEndOffset,
    recordBytesLength,
    recordFileStart,
    recordFileEnd,
    hasFixups: records.length > 0,
    records,
  };
}
