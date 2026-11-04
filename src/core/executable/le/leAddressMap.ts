import {
  LEAddressMappingCandidate,
  LEObjectEntry,
  LEPageMapEntry,
} from './leTypes';

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

export type PhysicalByteClassificationType =
  | 'addressable-object-byte'
  | 'physical-page-padding'
  | 'outside-mapped-objects';

export interface PhysicalByteClassification {
  type: PhysicalByteClassificationType;
  objectNumber: number | null;
  objectOffset: number | null;
  objectOffsetHex: string | null;
  linearAddressCandidate: number | null;
  linearAddressCandidateHex: string | null;
  description: string;
}

/**
 * Classifies a physical file offset against parsed LE objects, distinguishing
 * addressable object bytes from physical page padding and unmapped regions.
 */
export function classifyPhysicalByteInObjects(
  fileOffset: number,
  objects: LEObjectEntry[],
  pageSize: number,
): PhysicalByteClassification {
  for (const obj of objects) {
    for (const span of obj.physicalSpans) {
      if (fileOffset >= span.fileStart && fileOffset < span.fileEnd) {
        const deltaInSpan = fileOffset - span.fileStart;
        const pageIndexInSpan = Math.floor(deltaInSpan / pageSize);
        const offsetInPage = deltaInSpan % pageSize;
        const objectPageIndex = span.objectPageStart + pageIndexInSpan;
        const objectOffset = objectPageIndex * pageSize + offsetInPage;

        if (objectOffset >= 0 && objectOffset < obj.virtualSize) {
          const linearAddressCandidate = (obj.relocationBaseAddress + objectOffset) >>> 0;
          return {
            type: 'addressable-object-byte',
            objectNumber: obj.objectNumber,
            objectOffset,
            objectOffsetHex: toHex32(objectOffset),
            linearAddressCandidate,
            linearAddressCandidateHex: toHex32(linearAddressCandidate),
            description: `Addressable byte in Object ${obj.objectNumber} (${obj.capabilities})`,
          };
        } else {
          return {
            type: 'physical-page-padding',
            objectNumber: obj.objectNumber,
            objectOffset,
            objectOffsetHex: toHex32(objectOffset),
            linearAddressCandidate: null,
            linearAddressCandidateHex: null,
            description: `Physical page padding in Object ${obj.objectNumber} (offset 0x${objectOffset.toString(16).toUpperCase()} >= virtualSize 0x${obj.virtualSize.toString(16).toUpperCase()})`,
          };
        }
      }
    }
  }

  return {
    type: 'outside-mapped-objects',
    objectNumber: null,
    objectOffset: null,
    objectOffsetHex: null,
    linearAddressCandidate: null,
    linearAddressCandidateHex: null,
    description: 'Physical file offset outside all mapped LE object pages',
  };
}

/**
 * Translates a physical file offset to loaded address candidate(s) by querying
 * resolved object physical page spans.
 *
 * Enforces strict boundary:
 * A physical byte must not receive a loaded-address candidate merely because it
 * falls inside the raw physical span of a valid LE page.
 * Requires: 0 <= objectOffset < object.virtualSize.
 * Physical bytes beyond virtualSize are classified as physical page padding and
 * return no loaded-address candidate.
 *
 * @param fileOffset Absolute byte offset in the executable file.
 * @param objects Array of resolved LEObjectEntry items with physicalSpans.
 * @param pageSize Module page size (e.g. 4096).
 * @returns Array of matching address candidates (empty if outside all mapped objects or in padding).
 */
export function fileOffsetToLoadedAddress(
  fileOffset: number,
  objects: LEObjectEntry[],
  pageSize: number,
): LEAddressMappingCandidate[] {
  const matches: LEAddressMappingCandidate[] = [];

  for (const obj of objects) {
    for (const span of obj.physicalSpans) {
      if (fileOffset >= span.fileStart && fileOffset < span.fileEnd) {
        const deltaInSpan = fileOffset - span.fileStart;
        const pageIndexInSpan = Math.floor(deltaInSpan / pageSize);
        const offsetInPage = deltaInSpan % pageSize;
        const objectPageIndex = span.objectPageStart + pageIndexInSpan;
        const objectOffset = objectPageIndex * pageSize + offsetInPage;

        // Hardened boundary: must strictly fall within declared virtual size
        if (objectOffset >= 0 && objectOffset < obj.virtualSize) {
          const linearAddressCandidate = (obj.relocationBaseAddress + objectOffset) >>> 0;

          matches.push({
            objectNumber: obj.objectNumber,
            objectOffset,
            objectOffsetHex: toHex32(objectOffset),
            linearAddressCandidate,
            linearAddressCandidateHex: toHex32(linearAddressCandidate),
            objectCapabilities: obj.capabilities,
            objectRoleEvidence: obj.roleEvidence,
            provenance: `object-${obj.objectNumber}-span-[0x${span.fileStart.toString(16)}..0x${span.fileEnd.toString(16)})`,
          });
        }
      }
    }
  }

  return matches;
}

/**
 * Translates an object-relative offset back to an absolute physical file offset.
 *
 * Enforces strict boundary:
 * Requires: 0 <= objectOffset < object.virtualSize.
 * Returns null if objectOffset is >= virtualSize, or if the logical offset falls
 * into an unmapped or zero-filled page.
 *
 * @param objectNumber 1-based object number.
 * @param objectOffset Byte offset within the object.
 * @param objects Array of LEObjectEntry items.
 * @param pageMap Array of LEPageMapEntry items.
 * @param pageSize Module page size (e.g. 4096).
 */
export function objectOffsetToFileOffset(
  objectNumber: number,
  objectOffset: number,
  objects: LEObjectEntry[],
  pageMap: LEPageMapEntry[],
  pageSize: number,
): number | null {
  if (objectOffset < 0) return null;

  const obj = objects.find((o) => o.objectNumber === objectNumber);
  if (!obj) return null;

  // Strict boundary: objectOffset must be strictly less than declared virtual size
  if (objectOffset >= obj.virtualSize) {
    return null;
  }

  const logicalPageIndex = Math.floor(objectOffset / pageSize);
  if (logicalPageIndex >= obj.pageMapEntryCount) {
    return null;
  }

  const pageMapEntryIndex = obj.pageMapIndex - 1 + logicalPageIndex;
  if (pageMapEntryIndex < 0 || pageMapEntryIndex >= pageMap.length) {
    return null;
  }

  const entry = pageMap[pageMapEntryIndex];
  if (
    entry.pageType !== 'valid' ||
    entry.physicalFileStart === undefined ||
    entry.physicalByteLength === undefined
  ) {
    // Zero-filled or invalid page has no physical backing file offset
    return null;
  }

  const offsetInPage = objectOffset % pageSize;
  if (offsetInPage >= entry.physicalByteLength) {
    return null;
  }

  return entry.physicalFileStart + offsetInPage;
}

export type RangeContainmentStatus =
  | 'fully-contained'
  | 'outside-mapped-objects'
  | 'crosses-page-padding'
  | 'crosses-unmapped-gap'
  | 'crosses-object-boundary'
  | 'invalid-range';

export interface RangeObjectContainment {
  isFullyContained: boolean;
  containmentStatus: RangeContainmentStatus;
  objectNumber: number | null;
  startCandidate: LEAddressMappingCandidate | null;
  endCandidate: LEAddressMappingCandidate | null;
  crossesBoundary: boolean;
  notes?: string;
}

/**
 * Verifies whether a contiguous physical byte range [startOffset, endOffset)
 * is contained within a single object's physical mapping without crossing boundaries.
 *
 * Hardened requirements:
 * - A range is contained only when EVERY byte interval across the requested physical
 *   range is continuously backed by the same logical object and strictly within
 *   the object's declared virtualSize.
 * - If the range starts outside mapped LE objects, it is classified as 'outside-mapped-objects'
 *   without falsely reporting 'crossesBoundary: true'.
 * - If any interior portion leaves the object's virtual addressable extent (e.g. entering
 *   physical page padding) or crosses non-contiguous physical pages / unmapped gaps,
 *   containment fails.
 */
export function checkRangeObjectContainment(
  startOffset: number,
  endOffset: number,
  objects: LEObjectEntry[],
  pageSize: number,
  pageMap?: LEPageMapEntry[],
): RangeObjectContainment {
  if (startOffset > endOffset) {
    return {
      isFullyContained: false,
      containmentStatus: 'invalid-range',
      objectNumber: null,
      startCandidate: null,
      endCandidate: null,
      crossesBoundary: false,
      notes: `Invalid range: start (0x${startOffset.toString(16)}) > end (0x${endOffset.toString(16)})`,
    };
  }

  const isPoint = startOffset === endOffset;
  const lastByteOffset = isPoint ? startOffset : endOffset - 1;

  // Check start offset classification
  const startClass = classifyPhysicalByteInObjects(startOffset, objects, pageSize);
  if (startClass.type === 'outside-mapped-objects') {
    return {
      isFullyContained: false,
      containmentStatus: 'outside-mapped-objects',
      objectNumber: null,
      startCandidate: null,
      endCandidate: null,
      crossesBoundary: false,
      notes: 'Physical start offset is outside mapped LE object pages',
    };
  }

  if (startClass.type === 'physical-page-padding') {
    return {
      isFullyContained: false,
      containmentStatus: 'crosses-page-padding',
      objectNumber: startClass.objectNumber,
      startCandidate: null,
      endCandidate: null,
      crossesBoundary: true,
      notes: `Physical start offset is inside physical page padding of Object ${startClass.objectNumber}`,
    };
  }

  const startMatches = fileOffsetToLoadedAddress(startOffset, objects, pageSize);
  if (startMatches.length === 0) {
    return {
      isFullyContained: false,
      containmentStatus: 'outside-mapped-objects',
      objectNumber: null,
      startCandidate: null,
      endCandidate: null,
      crossesBoundary: false,
    };
  }

  const startCandidate = startMatches[0];
  const primaryObjNum = startCandidate.objectNumber;
  const primaryObj = objects.find((o) => o.objectNumber === primaryObjNum);
  if (!primaryObj) {
    return {
      isFullyContained: false,
      containmentStatus: 'outside-mapped-objects',
      objectNumber: null,
      startCandidate: null,
      endCandidate: null,
      crossesBoundary: false,
    };
  }

  // Find the single physical span of primaryObj covering startOffset
  const coveringSpan = primaryObj.physicalSpans.find(
    (s) => startOffset >= s.fileStart && startOffset < s.fileEnd,
  );

  if (!coveringSpan) {
    return {
      isFullyContained: false,
      containmentStatus: 'crosses-unmapped-gap',
      objectNumber: primaryObjNum,
      startCandidate,
      endCandidate: null,
      crossesBoundary: true,
      notes: 'Start offset does not match an active physical span',
    };
  }

  // Check if the entire range [startOffset, lastByteOffset] is continuously within coveringSpan
  if (lastByteOffset >= coveringSpan.fileEnd) {
    // Range extends past this physical span: it either crosses into a gap, another span, or another object
    const endClass = classifyPhysicalByteInObjects(lastByteOffset, objects, pageSize);
    const status: RangeContainmentStatus =
      endClass.objectNumber !== primaryObjNum
        ? 'crosses-object-boundary'
        : 'crosses-unmapped-gap';

    return {
      isFullyContained: false,
      containmentStatus: status,
      objectNumber: primaryObjNum,
      startCandidate,
      endCandidate: null,
      crossesBoundary: true,
      notes: `Range extends past Object ${primaryObjNum} physical span [0x${coveringSpan.fileStart.toString(16)}..0x${coveringSpan.fileEnd.toString(16)})`,
    };
  }

  // The range is physically continuous within coveringSpan.
  // Now verify that the last byte does not exceed primaryObj.virtualSize (i.e. does not cross into physical page padding)
  const lastDelta = lastByteOffset - coveringSpan.fileStart;
  const lastPageIndexInSpan = Math.floor(lastDelta / pageSize);
  const lastOffsetInPage = lastDelta % pageSize;
  const lastObjectPageIndex = coveringSpan.objectPageStart + lastPageIndexInSpan;
  const lastObjectOffset = lastObjectPageIndex * pageSize + lastOffsetInPage;

  if (lastObjectOffset >= primaryObj.virtualSize) {
    return {
      isFullyContained: false,
      containmentStatus: 'crosses-page-padding',
      objectNumber: primaryObjNum,
      startCandidate,
      endCandidate: null,
      crossesBoundary: true,
      notes: `Range ends in physical page padding (logical offset 0x${lastObjectOffset.toString(16).toUpperCase()} >= virtualSize 0x${primaryObj.virtualSize.toString(16).toUpperCase()})`,
    };
  }

  // If pageMap is provided, verify each covered page has valid physical backing
  if (pageMap) {
    const startDelta = startOffset - coveringSpan.fileStart;
    const startPageIndexInSpan = Math.floor(startDelta / pageSize);
    for (let p = startPageIndexInSpan; p <= lastPageIndexInSpan; p++) {
      const objPage = coveringSpan.objectPageStart + p;
      const pageMapIdx = primaryObj.pageMapIndex - 1 + objPage;
      if (pageMapIdx < 0 || pageMapIdx >= pageMap.length) {
        return {
          isFullyContained: false,
          containmentStatus: 'crosses-unmapped-gap',
          objectNumber: primaryObjNum,
          startCandidate,
          endCandidate: null,
          crossesBoundary: true,
          notes: `Page map entry ${pageMapIdx} out of bounds`,
        };
      }
      const entry = pageMap[pageMapIdx];
      if (entry.pageType !== 'valid' || entry.physicalFileStart === undefined) {
        return {
          isFullyContained: false,
          containmentStatus: 'crosses-unmapped-gap',
          objectNumber: primaryObjNum,
          startCandidate,
          endCandidate: null,
          crossesBoundary: true,
          notes: `Page at index ${pageMapIdx} is not valid file-backed page (type: ${entry.pageType})`,
        };
      }
    }
  }

  const endMatches = fileOffsetToLoadedAddress(lastByteOffset, objects, pageSize);
  const endCandidate = endMatches.length > 0 ? endMatches[0] : null;

  return {
    isFullyContained: true,
    containmentStatus: 'fully-contained',
    objectNumber: primaryObjNum,
    startCandidate,
    endCandidate,
    crossesBoundary: false,
    notes: `Fully contained in Object ${primaryObjNum} (addressable range)`,
  };
}

