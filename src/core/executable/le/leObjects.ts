import { BinaryReader } from '../../binary/BinaryReader';
import {
  LEHeader,
  LEObjectBackingSummary,
  LEObjectEntry,
  LEObjectFlags,
  LEObjectRoleEvidence,
  LEPageMapEntry,
  LEPageType,
  LEPhysicalSpan,
} from './leTypes';

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

/**
 * Decodes raw LE object flags into structured boolean properties and descriptive strings.
 */
export function decodeLEObjectFlags(rawFlags: number): {
  flags: LEObjectFlags;
  capabilities: string;
  roleEvidence: LEObjectRoleEvidence;
} {
  const readable = (rawFlags & 0x0001) !== 0;
  const writable = (rawFlags & 0x0002) !== 0;
  const executable = (rawFlags & 0x0004) !== 0;
  const resource = (rawFlags & 0x0008) !== 0;
  const discardable = (rawFlags & 0x0010) !== 0;
  const shared = (rawFlags & 0x0020) !== 0;
  const preload = (rawFlags & 0x0040) !== 0;
  const invalid = (rawFlags & 0x0080) !== 0;
  const swappable = (rawFlags & 0x0100) !== 0; // LE: OBJ_PERM_SWAPPABLE (0x0100), not LX zero-fill
  const resident = (rawFlags & 0x0200) !== 0;
  const big32Bit = (rawFlags & 0x2000) !== 0;

  const flags: LEObjectFlags = {
    readable,
    writable,
    executable,
    resource,
    discardable,
    shared,
    preload,
    invalid,
    swappable,
    resident,
    big32Bit,
  };

  // Build capability summary string (e.g. "R-X / 32-bit", "RW- / 32-bit")
  const permParts: string[] = [
    readable ? 'R' : '-',
    writable ? 'W' : '-',
    executable ? 'X' : '-',
  ];
  let capabilities = permParts.join('');
  if (big32Bit) {
    capabilities += ' / 32-bit';
  } else {
    capabilities += ' / 16-bit';
  }

  // Derive evidence-based role without hardcoding object numbers
  let roleEvidence: LEObjectRoleEvidence = 'unknown';
  if (executable) {
    roleEvidence = 'executable-code-like';
  } else if (readable && writable) {
    roleEvidence = 'read-write-data-like';
  } else if (readable && !writable) {
    roleEvidence = 'read-only-data-like';
  } else if (resource) {
    roleEvidence = 'resource-like';
  }

  return { flags, capabilities, roleEvidence };
}

/**
 * Parses the 24-byte LE Object Table entries from a BinaryReader.
 */
export function parseLEObjectTable(
  reader: BinaryReader,
  objectTableOffset: number,
  objectCount: number,
): Omit<LEObjectEntry, 'physicalSpans' | 'mappedPageCount' | 'zeroFilledPageCount'>[] {
  reader.seek(objectTableOffset);
  const objects: Omit<LEObjectEntry, 'physicalSpans' | 'mappedPageCount' | 'zeroFilledPageCount'>[] = [];

  for (let i = 0; i < objectCount; i++) {
    const objectNumber = i + 1; // 1-based
    const virtualSize = reader.readUint32LE();
    const relocationBaseAddress = reader.readUint32LE();
    const rawFlags = reader.readUint32LE();
    const pageMapIndex = reader.readUint32LE();
    const pageMapEntryCount = reader.readUint32LE();
    reader.skip(4); // reserved

    const { flags, capabilities, roleEvidence } = decodeLEObjectFlags(rawFlags);

    objects.push({
      objectNumber,
      virtualSize,
      virtualSizeHex: toHex32(virtualSize),
      relocationBaseAddress,
      relocationBaseAddressHex: toHex32(relocationBaseAddress),
      rawFlags,
      flags,
      pageMapIndex,
      pageMapEntryCount,
      capabilities,
      roleEvidence,
    });
  }

  return objects;
}

/**
 * Classifies the documented 8-bit LE page flag.
 */
export function classifyLEPageType(rawFlags: number): LEPageType {
  switch (rawFlags) {
    case 0:
      return 'valid';
    case 1:
      return 'iterated';
    case 2:
      return 'invalid';
    case 3:
      return 'zero-filled';
    case 4:
      return 'range';
    default:
      return 'unknown';
  }
}

/**
 * Parses the 4-byte LE Object Page Map entries.
 * IMPORTANT: Strictly implements the LE 4-byte entry (24-bit page number + 8-bit flag),
 * NOT the larger LX structure.
 */
export function parseLEPageMap(
  reader: BinaryReader,
  pageMapOffset: number,
  pageCount: number,
  dataPagesFileOffset: number,
  pageSize: number,
  fileSize: number,
  bytesOnLastPage = 0,
): LEPageMapEntry[] {
  reader.seek(pageMapOffset);
  const pageEntries: LEPageMapEntry[] = [];

  for (let i = 0; i < pageCount; i++) {
    const pageMapIndex = i + 1; // 1-based index
    const b0 = reader.readUint8();
    const b1 = reader.readUint8();
    const b2 = reader.readUint8();
    const rawFlags = reader.readUint8();

    // 24-bit unsigned physical page number using documented LE byte significance:
    // Open Watcom le_map_entry: page_num[0] (MSB), page_num[1], page_num[2] (LSB)
    const physicalPageNumber = ((b0 * 0x10000) + (b1 * 0x100) + b2) >>> 0;
    const pageType = classifyLEPageType(rawFlags);

    let physicalFileStart: number | undefined = undefined;
    let physicalByteLength: number | undefined = undefined;

    if (pageType === 'valid' && physicalPageNumber > 0) {
      const fileStart = dataPagesFileOffset + (physicalPageNumber - 1) * pageSize;
      const isLastModulePage = physicalPageNumber === pageCount || i === pageCount - 1;
      const byteLen = isLastModulePage && bytesOnLastPage > 0 ? bytesOnLastPage : pageSize;

      if (fileStart >= dataPagesFileOffset && fileStart < fileSize && fileStart + byteLen <= fileSize) {
        physicalFileStart = fileStart;
        physicalByteLength = byteLen;
      }
    }

    pageEntries.push({
      pageMapIndex,
      physicalPageNumber,
      rawBytes: [b0, b1, b2],
      rawFlags,
      pageType,
      physicalFileStart,
      physicalByteLength,
    });
  }

  return pageEntries;
}

/**
 * Calculates physical spans for all objects based on their assigned pages.
 * Handles non-contiguous pages and zero-filled gaps by splitting spans.
 */
export function resolveObjectPhysicalSpans(
  rawObjects: Omit<LEObjectEntry, 'physicalSpans' | 'mappedPageCount' | 'zeroFilledPageCount'>[],
  pageMap: LEPageMapEntry[],
): LEObjectEntry[] {
  return rawObjects.map((obj) => {
    const physicalSpans: LEPhysicalSpan[] = [];
    let mappedPageCount = 0;
    let zeroFilledPageCount = 0;

    let currentSpan: LEPhysicalSpan | null = null;

    for (let pageIdx = 0; pageIdx < obj.pageMapEntryCount; pageIdx++) {
      const entryIdx = obj.pageMapIndex - 1 + pageIdx;
      if (entryIdx < 0 || entryIdx >= pageMap.length) {
        // Out of page-map bounds, close current span
        if (currentSpan) {
          physicalSpans.push(currentSpan);
          currentSpan = null;
        }
        continue;
      }

      const pageEntry = pageMap[entryIdx];
      if (pageEntry.pageType === 'zero-filled') {
        zeroFilledPageCount++;
        if (currentSpan) {
          physicalSpans.push(currentSpan);
          currentSpan = null;
        }
        continue;
      }

      if (
        pageEntry.pageType === 'valid' &&
        pageEntry.physicalFileStart !== undefined &&
        pageEntry.physicalByteLength !== undefined
      ) {
        mappedPageCount++;
        const pageStart = pageEntry.physicalFileStart;
        const pageLen = pageEntry.physicalByteLength;
        const pageEnd = pageStart + pageLen;

        if (
          currentSpan &&
          currentSpan.fileEnd === pageStart &&
          currentSpan.objectPageStart + currentSpan.pageCount === pageIdx
        ) {
          // Contiguous with previous page both in file and in object page index: extend existing span
          currentSpan.fileEnd = pageEnd;
          currentSpan.byteLength += pageLen;
          currentSpan.pageCount += 1;
        } else {
          // Non-contiguous: push previous span and start new one
          if (currentSpan) {
            physicalSpans.push(currentSpan);
          }
          currentSpan = {
            fileStart: pageStart,
            fileEnd: pageEnd,
            byteLength: pageLen,
            objectPageStart: pageIdx,
            pageCount: 1,
          };
        }
      } else {
        // Unknown or invalid page type
        if (currentSpan) {
          physicalSpans.push(currentSpan);
          currentSpan = null;
        }
      }
    }

    if (currentSpan) {
      physicalSpans.push(currentSpan);
    }

    return {
      ...obj,
      physicalSpans,
      mappedPageCount,
      zeroFilledPageCount,
    };
  });
}

/**
 * Computes explicit physical-to-virtual backing metrics for an LE object.
 *
 * Distinguishes:
 * - rawFileBackedPageBytes: physical bytes represented by valid file-backed page-map entries
 * - addressableFileBackedBytes: file-backed bytes that also fall inside object.virtualSize
 * - physicalPagePaddingBytes: physical bytes present in mapped pages but beyond object.virtualSize
 * - virtualBytesWithoutFileBacking: declared virtual object bytes lacking physical file backing
 */
export function computeObjectBackingSummary(
  obj: LEObjectEntry,
  pageMap: LEPageMapEntry[],
  pageSize: number,
): LEObjectBackingSummary {
  let mappedPageCount = 0;
  let explicitZeroFilledPageCount = 0;
  let rawFileBackedPageBytes = 0;
  let addressableFileBackedBytes = 0;

  for (let pageIdx = 0; pageIdx < obj.pageMapEntryCount; pageIdx++) {
    const entryIdx = obj.pageMapIndex - 1 + pageIdx;
    if (entryIdx < 0 || entryIdx >= pageMap.length) continue;

    const entry = pageMap[entryIdx];
    if (entry.pageType === 'zero-filled') {
      explicitZeroFilledPageCount++;
      continue;
    }

    if (
      entry.pageType === 'valid' &&
      entry.physicalFileStart !== undefined &&
      entry.physicalByteLength !== undefined
    ) {
      mappedPageCount++;
      const pageLen = entry.physicalByteLength;
      rawFileBackedPageBytes += pageLen;

      const pageLogicalStart = pageIdx * pageSize;
      if (pageLogicalStart < obj.virtualSize) {
        const availableInVirtual = obj.virtualSize - pageLogicalStart;
        const addressableInPage = Math.min(pageLen, availableInVirtual);
        addressableFileBackedBytes += addressableInPage;
      }
    }
  }

  const physicalPagePaddingBytes = rawFileBackedPageBytes - addressableFileBackedBytes;
  const virtualBytesWithoutFileBacking = Math.max(0, obj.virtualSize - addressableFileBackedBytes);

  let notes = '';
  if (physicalPagePaddingBytes > 0) {
    notes += `${physicalPagePaddingBytes} physical padding bytes beyond declared virtualSize. `;
  }
  if (virtualBytesWithoutFileBacking > 0) {
    notes += `${virtualBytesWithoutFileBacking} virtual bytes without file backing. `;
  }
  if (notes === '') {
    notes = 'Exact 1:1 physical backing to virtual size.';
  }

  return {
    objectNumber: obj.objectNumber,
    virtualSize: obj.virtualSize,
    virtualSizeHex: toHex32(obj.virtualSize),
    pageMapEntryCount: obj.pageMapEntryCount,
    mappedPageCount,
    explicitZeroFilledPageCount,
    rawFileBackedPageBytes,
    rawFileBackedPageBytesHex: toHex32(rawFileBackedPageBytes),
    addressableFileBackedBytes,
    addressableFileBackedBytesHex: toHex32(addressableFileBackedBytes),
    physicalPagePaddingBytes,
    physicalPagePaddingBytesHex: toHex32(physicalPagePaddingBytes),
    virtualBytesWithoutFileBacking,
    virtualBytesWithoutFileBackingHex: toHex32(virtualBytesWithoutFileBacking),
    notes: notes.trim(),
  };
}

