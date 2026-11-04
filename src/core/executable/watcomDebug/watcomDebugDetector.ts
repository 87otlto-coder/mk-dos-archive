import { BinaryReader } from '../../binary/BinaryReader';
import {
  parseWatcomMasterHeader,
  validateWatcomMasterHeader,
  enumerateWatcomSections,
} from './watcomDebugParser';
import {
  ALTERNATIVE_TRAILER_SIGNATURES,
  WATCOM_DEBUG_CONSTANTS,
  WatcomDebugContainerDiscovery,
  WatcomDebugValidationCheck,
  WatcomMasterDebugHeader,
  WatcomSectionDebugHeader,
} from './watcomDebugTypes';

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

/**
 * Options for Watcom debug container detection and qualification.
 */
export interface WatcomDebugDetectionOptions {
  /** Known or hypothesized post-module tail start offset (e.g. from LE page table) */
  postModuleTailStart?: number;
  /** Known or hypothesized post-module tail end offset */
  postModuleTailEnd?: number;
}

/**
 * Detects and qualifies Open Watcom debugging / symbol information appended to an executable.
 * Follows the authoritative discovery algorithm from Open Watcom v2 source code (strip.c / watldsym.c).
 */
export function detectWatcomDebugContainer(
  readerOrBuffer: BinaryReader | Uint8Array,
  options?: WatcomDebugDetectionOptions,
): WatcomDebugContainerDiscovery {
  const reader =
    readerOrBuffer instanceof BinaryReader
      ? readerOrBuffer
      : new BinaryReader(readerOrBuffer);

  const fileSize = reader.length;
  const validationChecks: WatcomDebugValidationCheck[] = [];

  // Minimum required file size to even hold a 14-byte trailer
  if (fileSize < WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE) {
    return {
      status: 'NOT_DETECTED',
      format: 'NONE',
      resourceTrailersBypassed: 0,
      masterHeader: null,
      containerPhysicalStart: null,
      containerPhysicalStartHex: null,
      containerPhysicalEnd: null,
      containerPhysicalEndHex: null,
      containerByteLength: null,
      langTableStart: null,
      langTableStartHex: null,
      langTableByteLength: null,
      segmentTableStart: null,
      segmentTableStartHex: null,
      segmentTableByteLength: null,
      sectionsStart: null,
      sectionsStartHex: null,
      sectionsByteLength: null,
      sectionCount: 0,
      sections: [],
      allSectionsValid: false,
      tilingValid: false,
      validationChecks: [
        {
          checkId: 'FILE_SIZE_SANITY',
          name: 'Minimum File Size Sanity Check',
          passed: false,
          detail: `File size (${fileSize} bytes) is smaller than 14-byte Watcom master header`,
        },
      ],
    };
  }

  // Open Watcom seek backwards logic (strip.c / watldsym.c)
  let end = fileSize - WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE;
  let resourceTrailersBypassed = 0;

  reader.seek(end);
  let sig = reader.readUint16LE();

  // Loop while signature matches resource or Fox signatures
  while (
    sig === WATCOM_DEBUG_CONSTANTS.WAT_RES_SIG ||
    sig === WATCOM_DEBUG_CONSTANTS.FOX_SIGNATURE1 ||
    sig === WATCOM_DEBUG_CONSTANTS.FOX_SIGNATURE2
  ) {
    reader.seek(end + 10);
    const resSize = reader.readUint32LE();
    if (resSize > end + WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE || resSize === 0) {
      break;
    }
    end -= resSize;
    if (end < WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE) {
      break;
    }
    resourceTrailersBypassed++;
    reader.seek(end);
    sig = reader.readUint16LE();
  }

  // Check if primary signature is Open Watcom debug signature (0x8386)
  if (sig === WATCOM_DEBUG_CONSTANTS.WAT_DBG_SIGNATURE) {
    // Count all 0x8386 candidates in tail region or trailing megabyte
    let candidateCount = 0;
    const scanStart = options?.postModuleTailStart !== undefined
      ? Math.max(0, options.postModuleTailStart)
      : Math.max(0, fileSize - 1024 * 1024);
    const scanEnd = fileSize - 2;
    for (let pos = scanStart; pos <= scanEnd; pos++) {
      reader.seek(pos);
      if (reader.readUint16LE() === WATCOM_DEBUG_CONSTANTS.WAT_DBG_SIGNATURE) {
        candidateCount++;
      }
    }
    if (candidateCount === 0) {
      candidateCount = 1;
    }

    const masterHeader = parseWatcomMasterHeader(reader, end);
    const headerVal = validateWatcomMasterHeader(masterHeader, fileSize);
    validationChecks.push(...headerVal.checks);

    const containerPhysicalEnd = end + WATCOM_DEBUG_CONSTANTS.MASTER_HEADER_SIZE;
    const containerPhysicalStart = containerPhysicalEnd - masterHeader.debugSize;

    // Check container physical start non-negative
    const startNonNegative = containerPhysicalStart >= 0;
    validationChecks.push({
      checkId: 'CONTAINER_START_BOUNDS',
      name: 'Container Physical Start Offset Non-Negative',
      passed: startNonNegative,
      detail: startNonNegative
        ? `Container physical start is valid at ${toHex32(containerPhysicalStart)}`
        : `Calculated container physical start is negative (${containerPhysicalStart})`,
    });

    const langTableStart = containerPhysicalStart;
    const langTableByteLength = masterHeader.langSize;

    let langTableRawBytesHex: string | undefined;
    if (
      langTableByteLength > 0 &&
      langTableStart >= 0 &&
      langTableStart + langTableByteLength <= fileSize
    ) {
      reader.seek(langTableStart);
      const raw: number[] = Array.from(reader.readSlice(Math.min(langTableByteLength, 256)));
      langTableRawBytesHex = raw.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    }

    const segmentTableStart = langTableStart + langTableByteLength;
    const segmentTableByteLength = masterHeader.segmentSize;

    let segmentTableRawBytesHex: string | undefined;
    if (
      segmentTableByteLength > 0 &&
      segmentTableStart >= 0 &&
      segmentTableStart + segmentTableByteLength <= fileSize
    ) {
      reader.seek(segmentTableStart);
      const raw: number[] = Array.from(reader.readSlice(Math.min(segmentTableByteLength, 256)));
      segmentTableRawBytesHex = raw.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    }

    const sectionsStart = segmentTableStart + segmentTableByteLength;
    const sectionsEnd = end;
    const sectionsByteLength = Math.max(0, sectionsEnd - sectionsStart);

    let sections: WatcomSectionDebugHeader[] = [];
    let allSectionsValid = false;
    let tilingValid = false;

    if (startNonNegative && sectionsStart <= sectionsEnd) {
      const sectionResult = enumerateWatcomSections(reader, sectionsStart, sectionsEnd);
      sections = sectionResult.sections;
      allSectionsValid = sectionResult.valid;
      tilingValid = sectionResult.tilingValid;

      validationChecks.push({
        checkId: 'SECTIONS_TILING_CONTINUITY',
        name: 'Watcom Section Tiling and Boundaries',
        passed: sectionResult.tilingValid,
        detail: sectionResult.tilingValid
          ? `Discovered ${sections.length} contiguous section(s) spanning ${toHex32(sectionsStart)}..${toHex32(sectionsEnd)}`
          : `Section tiling failure: ${sectionResult.errors.join('; ')}`,
      });

      validationChecks.push({
        checkId: 'SECTIONS_STRUCTURAL_VALIDITY',
        name: 'Watcom Section Internal Header Offsets Validity',
        passed: allSectionsValid,
        detail: allSectionsValid
          ? `All ${sections.length} section header internal offsets satisfy specification`
          : `One or more section headers contain invalid internal offsets: ${sectionResult.errors.join('; ')}`,
      });
    }

    // Correlation with post-module tail if coordinates provided
    let tailCorrelation: WatcomDebugContainerDiscovery['tailCorrelation'];
    let unresolvedPreDebugTail: WatcomDebugContainerDiscovery['unresolvedPreDebugTail'] = null;

    if (
      options?.postModuleTailStart !== undefined &&
      options?.postModuleTailEnd !== undefined
    ) {
      const pStart = options.postModuleTailStart;
      const pEnd = options.postModuleTailEnd;
      const pLen = Math.max(0, pEnd - pStart);
      const matchesTailStartExactly = containerPhysicalStart === pStart;
      const matchesTailEndExactly = containerPhysicalEnd === pEnd;
      const startOffsetDelta = containerPhysicalStart - pStart;
      const endOffsetDelta = containerPhysicalEnd - pEnd;
      const lengthDelta = masterHeader.debugSize - pLen;
      const tailCoveragePercentage =
        pLen > 0 ? Math.round((masterHeader.debugSize / pLen) * 1000) / 10 : 0;

      let verdict = 'UNKNOWN';
      if (matchesTailStartExactly && matchesTailEndExactly) {
        verdict =
          'FULL_TAIL_COINCIDENCE: Watcom debug container spans entire post-module tail';
      } else if (matchesTailEndExactly && containerPhysicalStart >= pStart) {
        verdict = `PARTIAL_TAIL_CONTAINER: Watcom debug container ends at EOF but begins ${startOffsetDelta} bytes after post-module tail start; preceding ${startOffsetDelta} bytes remain unresolved (UNKNOWN POST-MODULE / PRE-DEBUG DATA)`;
      } else {
        verdict = `BOUNDARY_DISCREPANCY: start delta ${startOffsetDelta}, end delta ${endOffsetDelta}`;
      }

      tailCorrelation = {
        postModuleTailStart: pStart,
        postModuleTailStartHex: toHex32(pStart),
        postModuleTailEnd: pEnd,
        postModuleTailEndHex: toHex32(pEnd),
        postModuleTailByteLength: pLen,
        matchesTailStartExactly,
        startOffsetDelta,
        matchesTailEndExactly,
        endOffsetDelta,
        lengthDelta,
        tailCoveragePercentage,
        verdict,
      };

      if (containerPhysicalStart > pStart) {
        unresolvedPreDebugTail = {
          startOffset: pStart,
          startOffsetHex: toHex32(pStart),
          endOffset: containerPhysicalStart,
          endOffsetHex: toHex32(containerPhysicalStart),
          byteLength: containerPhysicalStart - pStart,
          classification: 'UNKNOWN POST-MODULE / PRE-DEBUG DATA',
        };
      }

      const tailValid =
        (matchesTailStartExactly || containerPhysicalStart >= pStart) && matchesTailEndExactly;
      validationChecks.push({
        checkId: 'POST_MODULE_TAIL_ALIGNMENT',
        name: 'Post-Module Tail Boundary Alignment',
        passed: tailValid,
        detail: verdict,
      });
    }

    const overallPassed =
      headerVal.valid && startNonNegative && allSectionsValid && tilingValid;

    return {
      status: overallPassed ? 'DETECTED' : 'INVALID_STRUCTURE',
      format: 'WATCOM',
      resourceTrailersBypassed,
      candidateCount,
      masterHeader,
      containerPhysicalStart,
      containerPhysicalStartHex: toHex32(containerPhysicalStart),
      containerPhysicalEnd,
      containerPhysicalEndHex: toHex32(containerPhysicalEnd),
      containerByteLength: masterHeader.debugSize,
      langTableStart,
      langTableStartHex: toHex32(langTableStart),
      langTableByteLength,
      langTableRawBytesHex,
      segmentTableStart,
      segmentTableStartHex: toHex32(segmentTableStart),
      segmentTableByteLength,
      segmentTableRawBytesHex,
      sectionsStart,
      sectionsStartHex: toHex32(sectionsStart),
      sectionsByteLength,
      sectionCount: sections.length,
      sections,
      allSectionsValid,
      tilingValid,
      validationChecks,
      tailCorrelation,
      unresolvedPreDebugTail,
    };
  }

  // Check alternative formats at EOF for negative controls / forensic classification
  // 1. CodeView 4 trailer (usually last 8 bytes: 4-byte signature + 4-byte offset)
  if (fileSize >= 8) {
    reader.seek(fileSize - 4);
    const ascii4 = reader.readAscii(4);
    reader.seek(fileSize - 8);
    const ascii8 = reader.readAscii(4);

    if (
      Object.values(ALTERNATIVE_TRAILER_SIGNATURES).includes(
        ascii4 as (typeof ALTERNATIVE_TRAILER_SIGNATURES)[keyof typeof ALTERNATIVE_TRAILER_SIGNATURES],
      ) ||
      Object.values(ALTERNATIVE_TRAILER_SIGNATURES).includes(
        ascii8 as (typeof ALTERNATIVE_TRAILER_SIGNATURES)[keyof typeof ALTERNATIVE_TRAILER_SIGNATURES],
      )
    ) {
      return {
        status: 'DETECTED',
        format: 'CV4',
        resourceTrailersBypassed: 0,
        masterHeader: null,
        containerPhysicalStart: null,
        containerPhysicalStartHex: null,
        containerPhysicalEnd: fileSize,
        containerPhysicalEndHex: toHex32(fileSize),
        containerByteLength: null,
        langTableStart: null,
        langTableStartHex: null,
        langTableByteLength: null,
        segmentTableStart: null,
        segmentTableStartHex: null,
        segmentTableByteLength: null,
        sectionsStart: null,
        sectionsStartHex: null,
        sectionsByteLength: null,
        sectionCount: 0,
        sections: [],
        allSectionsValid: false,
        tilingValid: false,
        validationChecks: [
          {
            checkId: 'ALTERNATIVE_CV4_TRAILER',
            name: 'Alternative CodeView / HLL Trailer Detected',
            passed: true,
            detail: `Found alternative CodeView / HLL trailer signature '${ascii4}' or '${ascii8}' at EOF`,
          },
        ],
      };
    }
  }

  // No recognized debug trailer at EOF
  return {
    status: 'NOT_DETECTED',
    format: 'NONE',
    resourceTrailersBypassed: 0,
    masterHeader: null,
    containerPhysicalStart: null,
    containerPhysicalStartHex: null,
    containerPhysicalEnd: null,
    containerPhysicalEndHex: null,
    containerByteLength: null,
    langTableStart: null,
    langTableStartHex: null,
    langTableByteLength: null,
    segmentTableStart: null,
    segmentTableStartHex: null,
    segmentTableByteLength: null,
    sectionsStart: null,
    sectionsStartHex: null,
    sectionsByteLength: null,
    sectionCount: 0,
    sections: [],
    allSectionsValid: false,
    tilingValid: false,
    validationChecks: [
      {
        checkId: 'MASTER_SIGNATURE_0x8386',
        name: 'Master Header Signature (0x8386)',
        passed: false,
        detail: `No Watcom 0x8386 signature found at EOF-14 (read: 0x${sig.toString(16).padStart(4, '0').toUpperCase()})`,
      },
    ],
  };
}
