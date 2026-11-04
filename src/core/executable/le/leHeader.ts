import { BinaryReader } from '../../binary/BinaryReader';
import { DirectorySource } from '../../filesystem/DirectorySource';
import { scanAsciiPattern } from '../../binary/chunkedScanner';
import {
  LEHeader,
  LEValidationResult,
  LEValidationRule,
  LESignatureCandidate,
} from './leTypes';

export const LE_HEADER_MIN_SIZE = 172; // 0xAC bytes

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

export function getCpuTypeDescription(cpu: number): string {
  switch (cpu) {
    case 1:
      return 'Intel 80286';
    case 2:
      return 'Intel 80386 (32-bit)';
    case 3:
      return 'Intel 80486';
    case 4:
      return 'Intel Pentium (586)';
    case 5:
      return 'Intel Pentium Pro / P6';
    default:
      return `Unknown CPU (0x${cpu.toString(16)})`;
  }
}

export function getTargetOsDescription(os: number): string {
  switch (os) {
    case 0:
      return 'Unknown';
    case 1:
      return 'OS/2';
    case 2:
      return 'Windows';
    case 3:
      return 'European MS-DOS 4.0';
    case 4:
      return 'Windows 386';
    default:
      return `Unknown/Reserved (${os})`;
  }
}

/**
 * Parses an LE header structure from a BinaryReader positioned at headerFileOffset.
 */
export function parseLEHeader(
  reader: BinaryReader,
  headerFileOffset: number,
): LEHeader {
  reader.seek(headerFileOffset);

  const sig0 = reader.readUint8();
  const sig1 = reader.readUint8();
  const signature = (String.fromCharCode(sig0) + String.fromCharCode(sig1)) as 'LE';

  const byteOrder = reader.readUint8();
  const wordOrder = reader.readUint8();
  const formatLevel = reader.readUint32LE();
  const cpuType = reader.readUint16LE();
  const targetOs = reader.readUint16LE();
  const moduleVersion = reader.readUint32LE();
  const moduleFlags = reader.readUint32LE();
  const modulePageCount = reader.readUint32LE();
  const entryObject = reader.readUint32LE();
  const entryEip = reader.readUint32LE();
  const stackObject = reader.readUint32LE();
  const stackEsp = reader.readUint32LE();
  const pageSize = reader.readUint32LE();
  const bytesOnLastPage = reader.readUint32LE();
  const fixupSectionSize = reader.readUint32LE();
  reader.skip(4); // fixupSectionChecksum
  const loaderSectionSize = reader.readUint32LE();
  reader.skip(4); // loaderSectionChecksum

  // Offsets relative to LE header
  const objectTableRelativeOffset = reader.readUint32LE();
  const objectCount = reader.readUint32LE();
  const objectPageMapRelativeOffset = reader.readUint32LE();
  reader.skip(4); // objectIterateDataMapOffset
  reader.skip(8); // resourceTableOffset + resourceTableCount
  const residentNameTableRelativeOffset = reader.readUint32LE();
  const entryTableRelativeOffset = reader.readUint32LE();
  reader.skip(8); // moduleDirectivesTableOffset + moduleDirectivesCount
  const fixupPageTableRelativeOffset = reader.readUint32LE();
  const fixupRecordTableRelativeOffset = reader.readUint32LE();
  const importModuleTableRelativeOffset = reader.readUint32LE();
  const importModuleCount = reader.readUint32LE();
  const importProcedureTableRelativeOffset = reader.readUint32LE();
  reader.skip(4); // perPageChecksumTableOffset

  // Absolute file offsets
  const dataPagesFileOffset = reader.readUint32LE();
  const preloadPageCount = reader.readUint32LE();
  const nonResidentNameTableFileOffset = reader.readUint32LE();
  const nonResidentNameTableLength = reader.readUint32LE();
  reader.skip(4); // nonResidentNameTableChecksum
  const autoDataObject = reader.readUint32LE();
  const debugInfoFileOffset = reader.readUint32LE();
  const debugInfoLength = reader.readUint32LE();
  reader.skip(8); // instancePreloadPageCount + instanceDemandPageCount
  const heapSize = reader.readUint32LE();

  return {
    signature,
    byteOrder,
    wordOrder,
    formatLevel,
    cpuType,
    cpuTypeDescription: getCpuTypeDescription(cpuType),
    targetOs,
    targetOsDescription: getTargetOsDescription(targetOs),
    moduleVersion,
    moduleFlags,
    modulePageCount,
    entryObject,
    entryEip,
    entryEipHex: toHex32(entryEip),
    stackObject,
    stackEsp,
    stackEspHex: toHex32(stackEsp),
    pageSize,
    bytesOnLastPage,
    fixupSectionSize,
    loaderSectionSize,
    objectTableRelativeOffset,
    objectTableFileOffset: headerFileOffset + objectTableRelativeOffset,
    objectCount,
    objectPageMapRelativeOffset,
    objectPageMapFileOffset: headerFileOffset + objectPageMapRelativeOffset,
    residentNameTableRelativeOffset,
    residentNameTableFileOffset: headerFileOffset + residentNameTableRelativeOffset,
    entryTableRelativeOffset,
    entryTableFileOffset: headerFileOffset + entryTableRelativeOffset,
    fixupPageTableRelativeOffset,
    fixupPageTableFileOffset: headerFileOffset + fixupPageTableRelativeOffset,
    fixupRecordTableRelativeOffset,
    fixupRecordTableFileOffset: headerFileOffset + fixupRecordTableRelativeOffset,
    importModuleTableRelativeOffset,
    importModuleTableFileOffset: headerFileOffset + importModuleTableRelativeOffset,
    importModuleCount,
    importProcedureTableRelativeOffset,
    importProcedureTableFileOffset: headerFileOffset + importProcedureTableRelativeOffset,
    dataPagesFileOffset,
    preloadPageCount,
    nonResidentNameTableFileOffset,
    nonResidentNameTableLength,
    autoDataObject,
    debugInfoFileOffset,
    debugInfoLength,
    heapSize,
  };
}

/**
 * Performs structural validation on an LE header candidate.
 */
export function validateLEHeader(
  header: LEHeader,
  headerFileOffset: number,
  fileSize: number,
): LEValidationResult {
  const rules: LEValidationRule[] = [];

  // Rule 1: Signature is LE
  const sigMatch = header.signature === 'LE';
  rules.push({
    rule: 'Signature is "LE"',
    passed: sigMatch,
    details: `Signature is '${header.signature}'`,
  });

  // Rule 2: Header fits within file
  const fitsFile = headerFileOffset + LE_HEADER_MIN_SIZE <= fileSize;
  rules.push({
    rule: 'Header fits within executable file bounds',
    passed: fitsFile,
    details: `Header [${headerFileOffset}..${headerFileOffset + LE_HEADER_MIN_SIZE}) vs fileSize ${fileSize}`,
  });

  // Rule 3: Byte and Word order are 0 (Little Endian)
  const byteWordOrderOk = header.byteOrder === 0 && header.wordOrder === 0;
  rules.push({
    rule: 'Byte and word ordering are Little-Endian (0)',
    passed: byteWordOrderOk,
    details: `byteOrder=${header.byteOrder}, wordOrder=${header.wordOrder}`,
  });

  // Rule 4: CPU type is plausible x86 (1..6)
  const cpuOk = header.cpuType >= 1 && header.cpuType <= 6;
  rules.push({
    rule: 'CPU architecture is plausible x86 (1..6)',
    passed: cpuOk,
    details: `cpuType=${header.cpuType} (${header.cpuTypeDescription})`,
  });

  // Rule 5: Target OS is plausible format value (1..4)
  const osOk = header.targetOs >= 1 && header.targetOs <= 4;
  rules.push({
    rule: 'Target OS is valid format value (1..4)',
    passed: osOk,
    details: `targetOs=${header.targetOs} (${header.targetOsDescription})`,
  });

  // Rule 6: Page size is plausible power-of-two (typically 4096)
  const pageSizeOk =
    header.pageSize >= 512 &&
    header.pageSize <= 65536 &&
    (header.pageSize & (header.pageSize - 1)) === 0;
  rules.push({
    rule: 'Page size is plausible power-of-two (512..65536)',
    passed: pageSizeOk,
    details: `pageSize=${header.pageSize} (0x${header.pageSize.toString(16)})`,
  });

  // Rule 7: Object count is bounded (1..256)
  const objectCountOk = header.objectCount > 0 && header.objectCount <= 256;
  rules.push({
    rule: 'Object count is positive and bounded (1..256)',
    passed: objectCountOk,
    details: `objectCount=${header.objectCount}`,
  });

  // Rule 8: Object table fits within file bounds
  const objectTableByteLen = header.objectCount * 24;
  const objectTableEnd = header.objectTableFileOffset + objectTableByteLen;
  const objectTableOk =
    header.objectTableFileOffset >= headerFileOffset + LE_HEADER_MIN_SIZE &&
    objectTableEnd <= fileSize;
  rules.push({
    rule: 'Object table fits within file bounds',
    passed: objectTableOk,
    details: `tableOffset=${header.objectTableFileOffset}, len=${objectTableByteLen}, end=${objectTableEnd}`,
  });

  // Rule 9: Object page map fits within file bounds
  const pageMapByteLen = header.modulePageCount * 4;
  const pageMapEnd = header.objectPageMapFileOffset + pageMapByteLen;
  const pageMapOk =
    header.modulePageCount > 0 &&
    header.objectPageMapFileOffset >= headerFileOffset &&
    pageMapEnd <= fileSize;
  rules.push({
    rule: 'Object page map fits within file bounds',
    passed: pageMapOk,
    details: `pageMapOffset=${header.objectPageMapFileOffset}, pages=${header.modulePageCount}, end=${pageMapEnd}`,
  });

  // Rule 10: Data pages file offset is beyond header and within file
  const dataPagesOk =
    header.dataPagesFileOffset > headerFileOffset &&
    header.dataPagesFileOffset < fileSize;
  rules.push({
    rule: 'Data pages offset is beyond header and within file',
    passed: dataPagesOk,
    details: `dataPagesFileOffset=${header.dataPagesFileOffset} (0x${header.dataPagesFileOffset.toString(16)})`,
  });

  // Rule 11: Entry object is valid
  const entryObjOk =
    header.entryObject === 0 || header.entryObject <= header.objectCount;
  rules.push({
    rule: 'Entry object index is 0 or <= objectCount',
    passed: entryObjOk,
    details: `entryObject=${header.entryObject}, objectCount=${header.objectCount}`,
  });

  // Rule 12: Stack object is valid
  const stackObjOk =
    header.stackObject === 0 || header.stackObject <= header.objectCount;
  rules.push({
    rule: 'Stack object index is 0 or <= objectCount',
    passed: stackObjOk,
    details: `stackObject=${header.stackObject}, objectCount=${header.objectCount}`,
  });

  const passedCount = rules.filter((r) => r.passed).length;
  const criticalPassed =
    sigMatch &&
    fitsFile &&
    byteWordOrderOk &&
    objectCountOk &&
    objectTableOk &&
    pageMapOk &&
    dataPagesOk &&
    pageSizeOk;

  let confidence: 'invalid' | 'weak' | 'strong' = 'invalid';
  if (criticalPassed && passedCount >= 10) {
    confidence = 'strong';
  } else if (sigMatch && fitsFile && passedCount >= 6) {
    confidence = 'weak';
  }

  return {
    isValid: criticalPassed,
    confidence,
    passedRuleCount: passedCount,
    totalRuleCount: rules.length,
    rules,
  };
}

/**
 * Scans a file in DirectorySource for raw "LE" ASCII occurrences and evaluates
 * each candidate structurally.
 */
export async function scanForLeSignatures(
  source: DirectorySource,
  path: string,
  fileSize: number,
  onProgress?: (scanned: number, total: number) => void,
): Promise<LESignatureCandidate[]> {
  // 1. Collect all raw "LE" occurrences
  const rawOffsets = await scanAsciiPattern(source, path, 'LE', {
    caseInsensitive: false,
    fileSize,
    onProgress,
  });

  const candidates: LESignatureCandidate[] = [];

  // 2. Evaluate each raw offset
  for (const offset of rawOffsets) {
    const offsetHex = toHex32(offset);

    // If offset is too close to the end of the file to contain an LE header
    if (offset + LE_HEADER_MIN_SIZE > fileSize) {
      candidates.push({
        fileOffset: offset,
        fileOffsetHex: offsetHex,
        validation: {
          isValid: false,
          confidence: 'invalid',
          passedRuleCount: 1,
          totalRuleCount: 12,
          rules: [
            {
              rule: 'Header fits within executable file bounds',
              passed: false,
              details: `Offset ${offset} is too close to file end ${fileSize}`,
            },
          ],
        },
      });
      continue;
    }

    try {
      const headerSlice = await source.readSlice(path, offset, LE_HEADER_MIN_SIZE);
      const reader = new BinaryReader(headerSlice);
      const header = parseLEHeader(reader, 0); // read from offset 0 of slice

      // Fixup absolute file offsets to be relative to the actual file
      const correctedHeader: LEHeader = {
        ...header,
        objectTableFileOffset: offset + header.objectTableRelativeOffset,
        objectPageMapFileOffset: offset + header.objectPageMapRelativeOffset,
        residentNameTableFileOffset: offset + header.residentNameTableRelativeOffset,
        entryTableFileOffset: offset + header.entryTableRelativeOffset,
        fixupPageTableFileOffset: offset + header.fixupPageTableRelativeOffset,
        fixupRecordTableFileOffset: offset + header.fixupRecordTableRelativeOffset,
        importModuleTableFileOffset: offset + header.importModuleTableRelativeOffset,
        importProcedureTableFileOffset: offset + header.importProcedureTableRelativeOffset,
      };

      const validation = validateLEHeader(correctedHeader, offset, fileSize);
      candidates.push({
        fileOffset: offset,
        fileOffsetHex: offsetHex,
        validation,
        header: correctedHeader,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      candidates.push({
        fileOffset: offset,
        fileOffsetHex: offsetHex,
        validation: {
          isValid: false,
          confidence: 'invalid',
          passedRuleCount: 0,
          totalRuleCount: 12,
          rules: [
            {
              rule: 'Header parse succeeded',
              passed: false,
              details: `Parse error: ${msg}`,
            },
          ],
        },
      });
    }
  }

  return candidates;
}
