import {
  LEHeader,
  LEObjectEntry,
  LEPageMapEntry,
} from '../../../core/executable/le/leTypes';

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

export type MK1ExecutableRegionClass =
  | 'pre-le-prefix'
  | 'le-header-tables'
  | 'le-object-file-backed'
  | 'physical-page-padding'
  | 'physical-gap'
  | 'post-module-tail';

export interface MK1ExecutableRegion {
  regionId: string;
  regionClass: MK1ExecutableRegionClass;
  name: string;
  fileStart: number;
  fileStartHex: string;
  fileEnd: number;
  fileEndHex: string;
  byteLength: number;
  percentageOfFile: number;
  objectNumber: number | null;
  objectName?: string;
  purpose: string;
  notes: string;
}

export interface MK1ModuleBoundaryDerivation {
  highestFileBackedPageEnd: number;
  highestFileBackedPageEndHex: string;
  headerDerivedPageDataEnd: number;
  headerDerivedPageDataEndHex: string;
  discrepancyBytes: number;
  discrepancyExplanation: string;
}

export interface MK1PostModuleTailSummary {
  startOffset: number;
  startOffsetHex: string;
  endOffset: number;
  endOffsetHex: string;
  byteLength: number;
  percentageOfTotalExecutable: number;
  containedAnchorNames: string[];
  purpose: 'UNKNOWN';
  notes: string;
}

export interface MK1ExecutablePhysicalTopology {
  totalFileSize: number;
  totalFileSizeHex: string;
  boundaries: MK1ModuleBoundaryDerivation;
  postModuleTail: MK1PostModuleTailSummary;
  regions: MK1ExecutableRegion[];
  gapCount: number;
  totalGapBytes: number;
}

/**
 * Derives the complete, asset-neutral physical region topology of the MK1 executable
 * from byte 0 to EOF, strictly accounting for all valid pages, physical page padding,
 * physical gaps, and the post-module tail.
 */
export function deriveMK1ExecutableTopology(
  fileSize: number,
  selectedPayloadOffset: number | null,
  header: LEHeader | null,
  objects: LEObjectEntry[],
  pageMap: LEPageMapEntry[],
  pageSize: number,
  knownAnchors: { name: string; startOffset: number; endOffset: number }[],
): MK1ExecutablePhysicalTopology {
  // 1. Derive true file-backed module end from actual valid page entries
  let highestFileBackedPageEnd = 0;
  for (const page of pageMap) {
    if (
      page.pageType === 'valid' &&
      page.physicalFileStart !== undefined &&
      page.physicalByteLength !== undefined
    ) {
      const pageEnd = page.physicalFileStart + page.physicalByteLength;
      if (pageEnd > highestFileBackedPageEnd) {
        highestFileBackedPageEnd = pageEnd;
      }
    }
  }

  // Conventional header-derived page data end
  const headerDerivedPageDataEnd = header
    ? header.dataPagesFileOffset + header.modulePageCount * pageSize
    : 0;

  const discrepancyBytes = headerDerivedPageDataEnd - highestFileBackedPageEnd;
  let discrepancyExplanation = 'Exact match between physical pages and header specification.';
  if (discrepancyBytes > 0) {
    discrepancyExplanation = `Conventional formula assumes all ${header?.modulePageCount || 0} pages are full ${pageSize}-byte blocks; actual file-backed data ends ${discrepancyBytes} bytes earlier (partial final page: ${header?.bytesOnLastPage || 0} bytes).`;
  } else if (discrepancyBytes < 0) {
    discrepancyExplanation = `Actual file-backed data extends ${Math.abs(discrepancyBytes)} bytes beyond conventional page data end.`;
  }

  const boundaries: MK1ModuleBoundaryDerivation = {
    highestFileBackedPageEnd,
    highestFileBackedPageEndHex: toHex32(highestFileBackedPageEnd),
    headerDerivedPageDataEnd,
    headerDerivedPageDataEndHex: toHex32(headerDerivedPageDataEnd),
    discrepancyBytes,
    discrepancyExplanation,
  };

  // 2. Derive Post-Module Tail
  const tailStart = highestFileBackedPageEnd;
  const tailEnd = fileSize;
  const tailBytes = Math.max(0, tailEnd - tailStart);
  const tailPct = fileSize > 0 ? (tailBytes / fileSize) * 100 : 0;

  const containedAnchorNames: string[] = [];
  for (const anchor of knownAnchors) {
    const isPoint = anchor.startOffset === anchor.endOffset;
    const aEnd = isPoint ? anchor.startOffset + 1 : anchor.endOffset;
    if (anchor.startOffset >= tailStart && aEnd <= tailEnd) {
      containedAnchorNames.push(anchor.name);
    }
  }

  const postModuleTail: MK1PostModuleTailSummary = {
    startOffset: tailStart,
    startOffsetHex: toHex32(tailStart),
    endOffset: tailEnd,
    endOffsetHex: toHex32(tailEnd),
    byteLength: tailBytes,
    percentageOfTotalExecutable: Number(tailPct.toFixed(2)),
    containedAnchorNames,
    purpose: 'UNKNOWN',
    notes:
      tailBytes > 0
        ? `Neutral appended file region. Contains ${containedAnchorNames.length} known anchor(s): ${containedAnchorNames.join(', ') || 'none'}.`
        : 'No appended bytes after file-backed module end.',
  };

  // 3. Build ordered full-file physical regions from 0 to fileSize
  const regions: MK1ExecutableRegion[] = [];
  let currentOffset = 0;
  let gapCount = 0;
  let totalGapBytes = 0;

  // A: Pre-LE Prefix
  if (selectedPayloadOffset !== null && selectedPayloadOffset > 0) {
    const prefixLen = selectedPayloadOffset;
    const pct = fileSize > 0 ? (prefixLen / fileSize) * 100 : 0;
    regions.push({
      regionId: 'pre-le-prefix',
      regionClass: 'pre-le-prefix',
      name: 'Pre-LE Prefix (DOS Wrapper / Bound Prefix)',
      fileStart: 0,
      fileStartHex: toHex32(0),
      fileEnd: selectedPayloadOffset,
      fileEndHex: toHex32(selectedPayloadOffset),
      byteLength: prefixLen,
      percentageOfFile: Number(pct.toFixed(2)),
      objectNumber: null,
      purpose: 'unknown / DOS wrapper / bound prefix evidence',
      notes: 'Initial DOS MZ executable and 16-bit DOS extender stub preceding 32-bit LE payload.',
    });
    currentOffset = selectedPayloadOffset;
  }

  // B: LE Header & Tables
  const leStart = selectedPayloadOffset !== null ? selectedPayloadOffset : 0;
  const dataPagesStart = header ? header.dataPagesFileOffset : leStart;
  if (dataPagesStart > leStart) {
    const headerLen = dataPagesStart - leStart;
    const pct = fileSize > 0 ? (headerLen / fileSize) * 100 : 0;
    regions.push({
      regionId: 'le-header-tables',
      regionClass: 'le-header-tables',
      name: 'LE Header & Table Region',
      fileStart: leStart,
      fileStartHex: toHex32(leStart),
      fileEnd: dataPagesStart,
      fileEndHex: toHex32(dataPagesStart),
      byteLength: headerLen,
      percentageOfFile: Number(pct.toFixed(2)),
      objectNumber: null,
      purpose: 'LE header and structural descriptor tables',
      notes: 'Contains LE header, Object Table, Object Page Map, and structural tables.',
    });
    currentOffset = dataPagesStart;
  }

  // C & D: LE File-Backed Object Spans & Physical Page Padding
  // Collect all spans across all objects and sort by fileStart
  interface SpanWithObject {
    objectNumber: number;
    objectCapabilities: string;
    objectVirtualSize: number;
    span: LEObjectEntry['physicalSpans'][0];
  }

  const allSpans: SpanWithObject[] = [];
  for (const obj of objects) {
    for (const span of obj.physicalSpans) {
      allSpans.push({
        objectNumber: obj.objectNumber,
        objectCapabilities: obj.capabilities,
        objectVirtualSize: obj.virtualSize,
        span,
      });
    }
  }

  allSpans.sort((a, b) => a.span.fileStart - b.span.fileStart);

  for (let sIdx = 0; sIdx < allSpans.length; sIdx++) {
    const item = allSpans[sIdx];
    const s = item.span;

    // Check for physical gap before this span
    if (s.fileStart > currentOffset) {
      const gapLen = s.fileStart - currentOffset;
      const pct = fileSize > 0 ? (gapLen / fileSize) * 100 : 0;
      gapCount++;
      totalGapBytes += gapLen;
      regions.push({
        regionId: `gap-${currentOffset.toString(16)}`,
        regionClass: 'physical-gap',
        name: `Physical Gap (${toHex32(currentOffset)}..${toHex32(s.fileStart)})`,
        fileStart: currentOffset,
        fileStartHex: toHex32(currentOffset),
        fileEnd: s.fileStart,
        fileEndHex: toHex32(s.fileStart),
        byteLength: gapLen,
        percentageOfFile: Number(pct.toFixed(2)),
        objectNumber: null,
        purpose: 'unknown',
        notes: 'Unclaimed file region between LE physical allocations.',
      });
      currentOffset = s.fileStart;
    }

    // Partition span into addressable object bytes vs physical page padding
    const spanLogicalStart = s.objectPageStart * pageSize;
    let addressableInSpan = 0;
    let paddingInSpan = 0;

    if (spanLogicalStart >= item.objectVirtualSize) {
      // Entire span is physical page padding
      paddingInSpan = s.byteLength;
    } else {
      const remainingVirtual = item.objectVirtualSize - spanLogicalStart;
      addressableInSpan = Math.min(s.byteLength, remainingVirtual);
      paddingInSpan = s.byteLength - addressableInSpan;
    }

    if (addressableInSpan > 0) {
      const addrEnd = s.fileStart + addressableInSpan;
      const pct = fileSize > 0 ? (addressableInSpan / fileSize) * 100 : 0;
      regions.push({
        regionId: `obj-${item.objectNumber}-span-${s.fileStart.toString(16)}-data`,
        regionClass: 'le-object-file-backed',
        name: `Object ${item.objectNumber} File-Backed Data (${item.objectCapabilities})`,
        fileStart: s.fileStart,
        fileStartHex: toHex32(s.fileStart),
        fileEnd: addrEnd,
        fileEndHex: toHex32(addrEnd),
        byteLength: addressableInSpan,
        percentageOfFile: Number(pct.toFixed(2)),
        objectNumber: item.objectNumber,
        objectName: `Object ${item.objectNumber}`,
        purpose: 'Addressable object data/code',
        notes: `Mapped to Object ${item.objectNumber} virtual extent (pages ${s.objectPageStart + 1}..${s.objectPageStart + s.pageCount}).`,
      });
    }

    if (paddingInSpan > 0) {
      const padStart = s.fileStart + addressableInSpan;
      const padEnd = s.fileEnd;
      const pct = fileSize > 0 ? (paddingInSpan / fileSize) * 100 : 0;
      regions.push({
        regionId: `obj-${item.objectNumber}-span-${s.fileStart.toString(16)}-padding`,
        regionClass: 'physical-page-padding',
        name: `Object ${item.objectNumber} Physical Page Padding`,
        fileStart: padStart,
        fileStartHex: toHex32(padStart),
        fileEnd: padEnd,
        fileEndHex: toHex32(padEnd),
        byteLength: paddingInSpan,
        percentageOfFile: Number(pct.toFixed(2)),
        objectNumber: item.objectNumber,
        objectName: `Object ${item.objectNumber}`,
        purpose: 'Page alignment padding in file',
        notes: `Physical bytes present in page but beyond declared virtualSize (0x${item.objectVirtualSize.toString(16).toUpperCase()}); not addressable.`,
      });
    }

    currentOffset = s.fileEnd;
  }

  // Gap between last span and highestFileBackedPageEnd (if any)
  if (highestFileBackedPageEnd > currentOffset) {
    const gapLen = highestFileBackedPageEnd - currentOffset;
    const pct = fileSize > 0 ? (gapLen / fileSize) * 100 : 0;
    gapCount++;
    totalGapBytes += gapLen;
    regions.push({
      regionId: `gap-${currentOffset.toString(16)}`,
      regionClass: 'physical-gap',
      name: `Physical Gap (${toHex32(currentOffset)}..${toHex32(highestFileBackedPageEnd)})`,
      fileStart: currentOffset,
      fileStartHex: toHex32(currentOffset),
      fileEnd: highestFileBackedPageEnd,
      fileEndHex: toHex32(highestFileBackedPageEnd),
      byteLength: gapLen,
      percentageOfFile: Number(pct.toFixed(2)),
      objectNumber: null,
      purpose: 'unknown',
      notes: 'Unclaimed file region before module end.',
    });
    currentOffset = highestFileBackedPageEnd;
  }

  // F: Post-Module Tail
  if (fileSize > currentOffset) {
    const tailLen = fileSize - currentOffset;
    const pct = fileSize > 0 ? (tailLen / fileSize) * 100 : 0;
    regions.push({
      regionId: 'post-module-tail',
      regionClass: 'post-module-tail',
      name: 'Post-Module Tail (Appended File Region)',
      fileStart: currentOffset,
      fileStartHex: toHex32(currentOffset),
      fileEnd: fileSize,
      fileEndHex: toHex32(fileSize),
      byteLength: tailLen,
      percentageOfFile: Number(pct.toFixed(2)),
      objectNumber: null,
      purpose: 'UNKNOWN',
      notes: `Appended file material past highest file-backed LE page. Contains: ${containedAnchorNames.join(', ') || 'no known anchors'}.`,
    });
    currentOffset = fileSize;
  }

  return {
    totalFileSize: fileSize,
    totalFileSizeHex: toHex32(fileSize),
    boundaries,
    postModuleTail,
    regions,
    gapCount,
    totalGapBytes,
  };
}
