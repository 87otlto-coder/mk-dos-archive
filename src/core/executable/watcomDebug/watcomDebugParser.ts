import { BinaryReader } from '../../binary/BinaryReader';
import {
  WATCOM_DEBUG_CONSTANTS,
  WatcomDebugValidationCheck,
  WatcomMasterDebugHeader,
  WatcomSectionDebugHeader,
} from './watcomDebugTypes';

function toHex16(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(4, '0').toUpperCase();
}

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

/**
 * Parses the 14-byte Watcom Master Debug Header at the specified byte offset.
 */
export function parseWatcomMasterHeader(
  reader: BinaryReader,
  offset: number,
): WatcomMasterDebugHeader {
  reader.seek(offset);
  const rawBytes: number[] = Array.from(reader.readSlice(WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE));
  const rawBytesHex = rawBytes.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

  // Re-read fields from offset
  reader.seek(offset);
  const signature = reader.readUint16LE();
  const exeMajorVer = reader.readUint8();
  const exeMinorVer = reader.readUint8();
  const objMajorVer = reader.readUint8();
  const objMinorVer = reader.readUint8();
  const langSize = reader.readUint16LE();
  const segmentSize = reader.readUint16LE();
  const debugSize = reader.readUint32LE();

  const signatureValid = signature === WATCOM_DEBUG_CONSTANTS.WAT_DBG_SIGNATURE;
  const versionValid =
    (exeMajorVer === WATCOM_DEBUG_CONSTANTS.EXE_MAJOR_VERSION ||
      exeMajorVer === WATCOM_DEBUG_CONSTANTS.OLD_EXE_MAJOR_VERSION) &&
    exeMinorVer <= WATCOM_DEBUG_CONSTANTS.EXE_MINOR_VERSION &&
    objMajorVer === WATCOM_DEBUG_CONSTANTS.OBJ_MAJOR_VERSION &&
    objMinorVer >= WATCOM_DEBUG_CONSTANTS.OBJ_MINOR_VERSION_MIN &&
    objMinorVer <= WATCOM_DEBUG_CONSTANTS.OBJ_MINOR_VERSION_CURRENT;

  const versionString = `EXE ${exeMajorVer}.${exeMinorVer}, OBJ ${objMajorVer}.${objMinorVer}`;

  return {
    signature,
    signatureHex: toHex16(signature),
    signatureValid,
    exeMajorVer,
    exeMinorVer,
    objMajorVer,
    objMinorVer,
    versionValid,
    versionString,
    langSize,
    langSizeHex: toHex16(langSize),
    segmentSize,
    segmentSizeHex: toHex16(segmentSize),
    debugSize,
    debugSizeHex: toHex32(debugSize),
    headerOffset: offset,
    headerOffsetHex: toHex32(offset),
    rawBytes,
    rawBytesHex,
  };
}

/**
 * Validates a parsed Watcom Master Debug Header according to Open Watcom specification rules.
 */
export function validateWatcomMasterHeader(
  header: WatcomMasterDebugHeader,
  fileSize: number,
): { valid: boolean; checks: WatcomDebugValidationCheck[] } {
  const checks: WatcomDebugValidationCheck[] = [];

  // Check 1: Signature
  const sigMatch = header.signature === WATCOM_DEBUG_CONSTANTS.WAT_DBG_SIGNATURE;
  checks.push({
    checkId: 'MASTER_SIGNATURE_0x8386',
    name: 'Master Header Signature (0x8386)',
    passed: sigMatch,
    detail: sigMatch
      ? `Exact signature match 0x8386 (${header.signatureHex})`
      : `Unexpected signature ${header.signatureHex} (expected 0x8386)`,
  });

  // Check 2: Exe Major/Minor Version
  const exeVerMatch =
    (header.exeMajorVer === WATCOM_DEBUG_CONSTANTS.EXE_MAJOR_VERSION ||
      header.exeMajorVer === WATCOM_DEBUG_CONSTANTS.OLD_EXE_MAJOR_VERSION) &&
    header.exeMinorVer <= WATCOM_DEBUG_CONSTANTS.EXE_MINOR_VERSION;
  checks.push({
    checkId: 'MASTER_EXE_VERSION',
    name: 'Executable Debug Version Compatibility',
    passed: exeVerMatch,
    detail: exeVerMatch
      ? `EXE version ${header.exeMajorVer}.${header.exeMinorVer} is supported by Open Watcom specification`
      : `EXE version ${header.exeMajorVer}.${header.exeMinorVer} exceeds supported versions`,
  });

  // Check 3: Object Major/Minor Version
  const objVerMatch =
    header.objMajorVer === WATCOM_DEBUG_CONSTANTS.OBJ_MAJOR_VERSION &&
    header.objMinorVer >= WATCOM_DEBUG_CONSTANTS.OBJ_MINOR_VERSION_MIN &&
    header.objMinorVer <= WATCOM_DEBUG_CONSTANTS.OBJ_MINOR_VERSION_CURRENT;
  checks.push({
    checkId: 'MASTER_OBJ_VERSION',
    name: 'Object Debug Version Compatibility',
    passed: objVerMatch,
    detail: objVerMatch
      ? `OBJ version ${header.objMajorVer}.${header.objMinorVer} is supported by Open Watcom specification (minor 0..3)`
      : `OBJ version ${header.objMajorVer}.${header.objMinorVer} violates specification (expected major=1, minor 0..3)`,
  });

  // Check 4: Container Size vs File Size
  const containerEnd = header.headerOffset + WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE;
  const sizeWithinFile = header.debugSize <= containerEnd && header.debugSize <= fileSize;
  checks.push({
    checkId: 'MASTER_DEBUG_SIZE_BOUNDS',
    name: 'Debug Container Bounds Containment',
    passed: sizeWithinFile,
    detail: sizeWithinFile
      ? `Debug size ${header.debugSize.toLocaleString()} bytes does not exceed file size (${fileSize.toLocaleString()} bytes)`
      : `Debug size ${header.debugSize} exceeds available bytes before header (${containerEnd}) or total file size (${fileSize})`,
  });

  // Check 5: Minimum size sanity
  const minRequiredSize =
    WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE + header.langSize + header.segmentSize;
  const sizeSufficient = header.debugSize >= minRequiredSize;
  checks.push({
    checkId: 'MASTER_MIN_CONTAINER_SIZE',
    name: 'Minimum Container Overhead Adequacy',
    passed: sizeSufficient,
    detail: sizeSufficient
      ? `debug_size (${header.debugSize}) >= header (14) + lang (${header.langSize}) + segment (${header.segmentSize}) = ${minRequiredSize}`
      : `debug_size (${header.debugSize}) is smaller than fixed tables overhead (${minRequiredSize})`,
  });

  const valid = checks.every((c) => c.passed);
  return { valid, checks };
}

/**
 * Parses an 18-byte Watcom Section Debug Header at the specified offset.
 */
export function parseWatcomSectionHeader(
  reader: BinaryReader,
  offset: number,
  sectionIndex: number,
): WatcomSectionDebugHeader {
  reader.seek(offset);
  const rawBytes: number[] = Array.from(reader.readSlice(WATCOM_DEBUG_CONSTANTS.SECTION_HEADER_SIZE));
  const rawBytesHex = rawBytes.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

  reader.seek(offset);
  const modOffset = reader.readUint32LE();
  const gblOffset = reader.readUint32LE();
  const addrOffset = reader.readUint32LE();
  const sectionSize = reader.readUint32LE();
  const sectionId = reader.readUint16LE();

  // From Open Watcom watldsym.c:
  // "if there are no modules in the section, it's a 'placekeeper' section
  // for the linker overlay structure -- just ignore it"
  const isPlacekeeper = modOffset === gblOffset;

  let valid = true;
  let validationError: string | undefined;

  if (sectionSize < WATCOM_DEBUG_CONSTANTS.SECTION_HEADER_SIZE) {
    valid = false;
    validationError = `Section size ${sectionSize} is smaller than 18-byte header`;
  } else if (!isPlacekeeper) {
    if (modOffset >= gblOffset) {
      valid = false;
      validationError = `Invalid section layout: mod_offset (${modOffset}) >= gbl_offset (${gblOffset})`;
    } else if (gblOffset >= addrOffset) {
      valid = false;
      validationError = `Invalid section layout: gbl_offset (${gblOffset}) >= addr_offset (${addrOffset})`;
    } else if (addrOffset >= sectionSize) {
      valid = false;
      validationError = `Invalid section layout: addr_offset (${addrOffset}) >= section_size (${sectionSize})`;
    }
  }

  return {
    sectionIndex,
    fileOffset: offset,
    fileOffsetHex: toHex32(offset),
    modOffset,
    modOffsetHex: toHex32(modOffset),
    gblOffset,
    gblOffsetHex: toHex32(gblOffset),
    addrOffset,
    addrOffsetHex: toHex32(addrOffset),
    sectionSize,
    sectionSizeHex: toHex32(sectionSize),
    sectionId,
    isPlacekeeper,
    valid,
    validationError,
    rawBytes,
    rawBytesHex,
  };
}

/**
 * Enumerates all Watcom section debug headers across the declared section region.
 * Validates contiguous tiling from sectionsStart to sectionsEnd.
 */
export function enumerateWatcomSections(
  reader: BinaryReader,
  sectionsStart: number,
  sectionsEnd: number,
): {
  sections: WatcomSectionDebugHeader[];
  totalSectionsSize: number;
  valid: boolean;
  tilingValid: boolean;
  errors: string[];
} {
  const sections: WatcomSectionDebugHeader[] = [];
  const errors: string[] = [];
  let curr = sectionsStart;
  let sectionIndex = 0;

  while (curr < sectionsEnd) {
    const bytesRemaining = sectionsEnd - curr;
    if (bytesRemaining < WATCOM_DEBUG_CONSTANTS.SECTION_HEADER_SIZE) {
      errors.push(
        `Truncated section at offset ${toHex32(curr)}: only ${bytesRemaining} bytes remain before master header`,
      );
      break;
    }

    const sec = parseWatcomSectionHeader(reader, curr, sectionIndex);
    sections.push(sec);

    if (!sec.valid && sec.validationError) {
      errors.push(`Section ${sectionIndex} (${toHex32(curr)}): ${sec.validationError}`);
    }

    if (sec.sectionSize === 0) {
      errors.push(`Section ${sectionIndex} has zero size; aborting walk to prevent infinite loop`);
      break;
    }

    if (curr + sec.sectionSize > sectionsEnd) {
      errors.push(
        `Section ${sectionIndex} size (${sec.sectionSize}) overruns section container boundary (${sectionsEnd}) by ${curr + sec.sectionSize - sectionsEnd} bytes`,
      );
      curr += sec.sectionSize;
      break;
    }

    curr += sec.sectionSize;
    sectionIndex++;
  }

  const tilingValid = curr === sectionsEnd;
  if (!tilingValid && errors.length === 0) {
    errors.push(
      `Section container tiling mismatch: sections end at ${toHex32(curr)}, expected ${toHex32(sectionsEnd)} (delta: ${curr - sectionsEnd})`,
    );
  }

  const allSectionsValid = sections.every((s) => s.valid);
  const totalSectionsSize = sections.reduce((acc, s) => acc + s.sectionSize, 0);

  return {
    sections,
    totalSectionsSize,
    valid: allSectionsValid && tilingValid && errors.length === 0,
    tilingValid,
    errors,
  };
}
