/**
 * Open Watcom to Linear Executable (LE) Address Model Qualification (Pass 1E.3C.1).
 *
 * Blindly, mechanically, and generically qualifies the mapping between
 * Open Watcom debug segments and LE objects.
 *
 * Strict Epistemic Invariants:
 * - NUMERIC EQUALITY != OBJECT IDENTITY.
 * - STRUCTURAL OBJECT MEMBERSHIP != RUNTIME ADDRESS MAPPING.
 * - ADDRESS-MODEL QUALIFICATION != SPECIFIC-SYMBOL INTERPRETATION.
 * - NO SPECIFIC GAME SYMBOL NAMES, EXPECTED COUNTS, OR ADDRESSES USED.
 * - PRESERVES AMBIGUITY WHERE MORE THAN ONE MAPPING REMAINS POSSIBLE.
 * - NO UNSUPPORTED BSS CLASSIFICATION WITHOUT INDEPENDENT PROOF.
 */

import {
  LEObjectEntry,
  LEPageMapEntry,
} from '../le/leTypes';
import {
  WatcomAddressInfoClass,
  WatcomGlobalSymbol,
  WatcomGlobalSymbolClass,
  WatcomSegmentAddressTable,
} from './watcomPermanentClassTypes';
import {
  IntersectingPageCoverage,
  ModuleRangeReconciliationException,
  ModuleRangeReconciliationResult,
  ModuleRangeReconciliationStatus,
  PhysicalBackingCategory,
  PhysicalBackingSummary,
  SpanPageBackingStatus,
  UnresolvedLECoverageInterval,
  WatcomAddressInfoTopologyReconciliation,
  WatcomAddressModelQualificationResult,
  WatcomSegmentQualification,
  WatcomSegmentToObjectPairing,
  WatcomSymbolCoordinateRecord,
} from './watcomAddressModelTypes';

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

function toHex16(val: number): string {
  return '0x' + (val & 0xffff).toString(16).padStart(4, '0').toUpperCase();
}

/**
 * Inspects physical backing classification for a specific object-relative offset.
 */
export function inspectOffsetBacking(
  objectRelativeOffset: number,
  object: LEObjectEntry,
  pageSize: number,
  pageMap: LEPageMapEntry[],
): {
  physicalBackingCategory: PhysicalBackingCategory;
  isFileBacked: boolean;
  physicalFileOffset: number | null;
  physicalFileOffsetHex: string | null;
  pageTableIndex: number | null;
  pageNumberInObject: number | null;
  offsetInPage: number | null;
  pageType?: string;
  detail?: string;
} {
  if (objectRelativeOffset < 0 || objectRelativeOffset >= object.virtualSize) {
    return {
      physicalBackingCategory: 'OUTSIDE_OBJECT',
      isFileBacked: false,
      physicalFileOffset: null,
      physicalFileOffsetHex: null,
      pageTableIndex: null,
      pageNumberInObject: null,
      offsetInPage: null,
      pageType: 'outside-virtual-size',
      detail: `Offset ${toHex32(objectRelativeOffset)} is outside object virtual size ${object.virtualSizeHex}`,
    };
  }

  const pageNumberInObject = Math.floor(objectRelativeOffset / pageSize);
  const offsetInPage = objectRelativeOffset % pageSize;

  if (pageNumberInObject >= object.pageMapEntryCount) {
    return {
      physicalBackingCategory: 'VIRTUAL_UNBACKED_BEYOND_PAGE_TABLE',
      isFileBacked: false,
      physicalFileOffset: null,
      physicalFileOffsetHex: null,
      pageTableIndex: null,
      pageNumberInObject,
      offsetInPage,
      pageType: 'beyond-page-table',
      detail: `Page ${pageNumberInObject} is beyond object pageMapEntryCount (${object.pageMapEntryCount})`,
    };
  }

  const pageTableIndex = (object.pageMapIndex - 1) + pageNumberInObject;

  if (pageTableIndex < 0 || pageTableIndex >= pageMap.length) {
    return {
      physicalBackingCategory: 'PAGE_MAP_ENTRY_UNAVAILABLE',
      isFileBacked: false,
      physicalFileOffset: null,
      physicalFileOffsetHex: null,
      pageTableIndex,
      pageNumberInObject,
      offsetInPage,
      pageType: 'out-of-range-page-index',
      detail: `Page table index ${pageTableIndex} is outside page-map table (0..${pageMap.length - 1})`,
    };
  }

  const page = pageMap[pageTableIndex];
  const pageType = page.pageType;

  if (pageType === 'zero-filled') {
    return {
      physicalBackingCategory: 'ZERO_FILLED_PAGE',
      isFileBacked: false,
      physicalFileOffset: null,
      physicalFileOffsetHex: null,
      pageTableIndex: page.pageMapIndex,
      pageNumberInObject,
      offsetInPage,
      pageType,
      detail: 'Page is marked zero-filled in LE page map',
    };
  }

  if (pageType === 'valid' && page.physicalFileStart !== undefined) {
    const fileByteLen = page.physicalByteLength ?? pageSize;
    if (offsetInPage < fileByteLen) {
      const phys = page.physicalFileStart + offsetInPage;
      return {
        physicalBackingCategory: 'FILE_BACKED',
        isFileBacked: true,
        physicalFileOffset: phys,
        physicalFileOffsetHex: toHex32(phys),
        pageTableIndex: page.pageMapIndex,
        pageNumberInObject,
        offsetInPage,
        pageType,
        detail: `Physical file offset ${toHex32(phys)}`,
      };
    } else {
      return {
        physicalBackingCategory: 'PAGE_PADDING',
        isFileBacked: false,
        physicalFileOffset: null,
        physicalFileOffsetHex: null,
        pageTableIndex: page.pageMapIndex,
        pageNumberInObject,
        offsetInPage,
        pageType: 'page-padding',
        detail: `Offset falls in zero-padding slack between ${fileByteLen} and ${pageSize}`,
      };
    }
  }

  return {
    physicalBackingCategory: 'UNKNOWN_NON_FILE_BACKED',
    isFileBacked: false,
    physicalFileOffset: null,
    physicalFileOffsetHex: null,
    pageTableIndex: page.pageMapIndex,
    pageNumberInObject,
    offsetInPage,
    pageType,
    detail: `Non-file-backed page type: ${pageType}`,
  };
}

/**
 * Backward-compatible helper resolving LE physical offset.
 */
export function resolveLePhysicalOffset(
  objectRelativeOffset: number,
  object: LEObjectEntry,
  pageSize: number,
  pageMap: LEPageMapEntry[],
) {
  return inspectOffsetBacking(objectRelativeOffset, object, pageSize, pageMap);
}

/**
 * Performs whole-span page-level physical backing analysis for an address-info range.
 */
export function reconcileSpanFileBacking(
  spanStart: number,
  totalSpanBytes: number,
  object: LEObjectEntry,
  pageSize: number,
  pageMap: LEPageMapEntry[],
): {
  allBytesFileBacked: boolean;
  intersectingPagesCount: number;
  fullyFileBackedPagesCount: number;
  partiallyFileBackedPagesCount: number;
  zeroFilledPagesCount: number;
  virtualUnbackedPagesCount: number;
  invalidPagesCount: number;
  intersectingPages: IntersectingPageCoverage[];
} {
  if (totalSpanBytes <= 0) {
    return {
      allBytesFileBacked: false,
      intersectingPagesCount: 0,
      fullyFileBackedPagesCount: 0,
      partiallyFileBackedPagesCount: 0,
      zeroFilledPagesCount: 0,
      virtualUnbackedPagesCount: 0,
      invalidPagesCount: 0,
      intersectingPages: [],
    };
  }

  const spanEnd = spanStart + totalSpanBytes;
  const startPage = Math.floor(spanStart / pageSize);
  const endPage = Math.floor((spanEnd - 1) / pageSize);
  const intersectingPagesCount = endPage - startPage + 1;

  let fullyFileBackedPagesCount = 0;
  let partiallyFileBackedPagesCount = 0;
  let zeroFilledPagesCount = 0;
  let virtualUnbackedPagesCount = 0;
  let invalidPagesCount = 0;
  let allBytesFileBacked = true;

  const intersectingPages: IntersectingPageCoverage[] = [];

  for (let p = startPage; p <= endPage; p++) {
    const pageOffsetStart = p === startPage ? spanStart % pageSize : 0;
    const pageOffsetEnd = p === endPage ? ((spanEnd - 1) % pageSize) + 1 : pageSize;

    if (p >= object.pageMapEntryCount) {
      virtualUnbackedPagesCount++;
      allBytesFileBacked = false;
      intersectingPages.push({
        logicalPageIndex: p,
        pageTableIndex: null,
        pageOffsetStart,
        pageOffsetEnd,
        pageType: 'beyond-page-table',
        backingStatus: 'VIRTUAL_UNBACKED',
      });
      continue;
    }

    const pageTableIndex = (object.pageMapIndex - 1) + p;
    if (pageTableIndex < 0 || pageTableIndex >= pageMap.length) {
      invalidPagesCount++;
      allBytesFileBacked = false;
      intersectingPages.push({
        logicalPageIndex: p,
        pageTableIndex,
        pageOffsetStart,
        pageOffsetEnd,
        pageType: 'out-of-range',
        backingStatus: 'INVALID_OR_MISSING_PAGE_MAPPING',
      });
      continue;
    }

    const page = pageMap[pageTableIndex];
    const pageType = page.pageType;

    if (pageType === 'zero-filled') {
      zeroFilledPagesCount++;
      allBytesFileBacked = false;
      intersectingPages.push({
        logicalPageIndex: p,
        pageTableIndex: page.pageMapIndex,
        pageOffsetStart,
        pageOffsetEnd,
        pageType,
        backingStatus: 'ZERO_FILLED',
      });
      continue;
    }

    if (pageType === 'valid' && page.physicalFileStart !== undefined) {
      const fileByteLen = page.physicalByteLength ?? pageSize;
      if (pageOffsetEnd <= fileByteLen) {
        fullyFileBackedPagesCount++;
        intersectingPages.push({
          logicalPageIndex: p,
          pageTableIndex: page.pageMapIndex,
          pageOffsetStart,
          pageOffsetEnd,
          pageType,
          backingStatus: 'FULLY_FILE_BACKED',
          physicalFileStart: page.physicalFileStart + pageOffsetStart,
        });
      } else if (pageOffsetStart < fileByteLen) {
        partiallyFileBackedPagesCount++;
        allBytesFileBacked = false;
        intersectingPages.push({
          logicalPageIndex: p,
          pageTableIndex: page.pageMapIndex,
          pageOffsetStart,
          pageOffsetEnd,
          pageType,
          backingStatus: 'PARTIALLY_FILE_BACKED',
          physicalFileStart: page.physicalFileStart + pageOffsetStart,
        });
      } else {
        allBytesFileBacked = false;
        intersectingPages.push({
          logicalPageIndex: p,
          pageTableIndex: page.pageMapIndex,
          pageOffsetStart,
          pageOffsetEnd,
          pageType,
          backingStatus: 'PAGE_PADDING',
        });
      }
      continue;
    }

    // Any other page type is not file-backed
    invalidPagesCount++;
    allBytesFileBacked = false;
    intersectingPages.push({
      logicalPageIndex: p,
      pageTableIndex: page.pageMapIndex,
      pageOffsetStart,
      pageOffsetEnd,
      pageType,
      backingStatus: 'INVALID_OR_MISSING_PAGE_MAPPING',
    });
  }

  return {
    allBytesFileBacked,
    intersectingPagesCount,
    fullyFileBackedPagesCount,
    partiallyFileBackedPagesCount,
    zeroFilledPagesCount,
    virtualUnbackedPagesCount,
    invalidPagesCount,
    intersectingPages,
  };
}

/**
 * Reconciles global symbol Watcom map offsets against cumulative module spans in address-info.
 */
export function reconcileModuleRanges(
  symbols: WatcomGlobalSymbol[],
  addressInfo: WatcomAddressInfoClass,
): ModuleRangeReconciliationResult {
  // Build cumulative half-open spans for each segment record
  interface SegmentModuleMap {
    segment: number;
    startAddressOffset: number;
    totalSpanBytes: number;
    spans: Array<{
      moduleIndex: number;
      moduleName: string | null;
      start: number;
      end: number;
      size: number;
    }>;
  }

  const segmentModuleMaps: SegmentModuleMap[] = [];

  for (const rec of addressInfo.segmentRecords) {
    const spans: SegmentModuleMap['spans'] = [];
    let current = rec.startAddressOffset;
    for (const entry of rec.entries) {
      const start = current;
      const end = current + entry.size;
      spans.push({
        moduleIndex: entry.moduleIndex,
        moduleName: entry.resolvedModuleName ?? null,
        start,
        end,
        size: entry.size,
      });
      current = end;
    }
    segmentModuleMaps.push({
      segment: rec.segment,
      startAddressOffset: rec.startAddressOffset,
      totalSpanBytes: current - rec.startAddressOffset,
      spans,
    });
  }

  let insideDefiningModuleSpanCount = 0;
  let atDefiningModuleEndCount = 0;
  let insideDifferentModuleSpanCount = 0;
  let outsideAddressInfoCoverageCount = 0;
  let noDefiningModuleSpanCount = 0;

  const exceptions: ModuleRangeReconciliationException[] = [];
  const symbolStatuses: ModuleRangeReconciliationStatus[] = [];

  for (let idx = 0; idx < symbols.length; idx++) {
    const sym = symbols[idx];
    const segMap = segmentModuleMaps.find((m) => m.segment === sym.segment);

    if (!segMap) {
      outsideAddressInfoCoverageCount++;
      symbolStatuses.push('OUTSIDE_ADDRESS_INFO_COVERAGE');
      exceptions.push({
        globalIndex: idx,
        name: sym.name,
        watcomMapSegment: sym.segment,
        watcomMapOffset: sym.addressOffset,
        watcomMapOffsetHex: toHex32(sym.addressOffset),
        moduleIndex: sym.moduleIndex,
        moduleName: null,
        status: 'OUTSIDE_ADDRESS_INFO_COVERAGE',
        detail: `Segment ${sym.segment} has no address-info records`,
      });
      continue;
    }

    const definingSpans = segMap.spans.filter((s) => s.moduleIndex === sym.moduleIndex);
    const minCov = segMap.startAddressOffset;
    const maxCov = segMap.startAddressOffset + segMap.totalSpanBytes;

    if (definingSpans.length === 0) {
      // Module has no spans in this segment
      const containing = segMap.spans.find((s) => sym.addressOffset >= s.start && sym.addressOffset < s.end);
      if (containing) {
        insideDifferentModuleSpanCount++;
        symbolStatuses.push('INSIDE_DIFFERENT_MODULE_SPAN');
        exceptions.push({
          globalIndex: idx,
          name: sym.name,
          watcomMapSegment: sym.segment,
          watcomMapOffset: sym.addressOffset,
          watcomMapOffsetHex: toHex32(sym.addressOffset),
          moduleIndex: sym.moduleIndex,
          moduleName: null,
          status: 'INSIDE_DIFFERENT_MODULE_SPAN',
          detail: `Symbol of module ${sym.moduleIndex} falls inside module ${containing.moduleIndex} (${containing.moduleName ?? 'unnamed'}) span [${toHex32(containing.start)}, ${toHex32(containing.end)})`,
        });
      } else if (sym.addressOffset < minCov || sym.addressOffset >= maxCov) {
        outsideAddressInfoCoverageCount++;
        symbolStatuses.push('OUTSIDE_ADDRESS_INFO_COVERAGE');
        exceptions.push({
          globalIndex: idx,
          name: sym.name,
          watcomMapSegment: sym.segment,
          watcomMapOffset: sym.addressOffset,
          watcomMapOffsetHex: toHex32(sym.addressOffset),
          moduleIndex: sym.moduleIndex,
          moduleName: null,
          status: 'OUTSIDE_ADDRESS_INFO_COVERAGE',
          detail: `Symbol offset ${toHex32(sym.addressOffset)} is outside segment address-info coverage [${toHex32(minCov)}, ${toHex32(maxCov)})`,
        });
      } else {
        noDefiningModuleSpanCount++;
        symbolStatuses.push('NO_DEFINING_MODULE_SPAN');
        exceptions.push({
          globalIndex: idx,
          name: sym.name,
          watcomMapSegment: sym.segment,
          watcomMapOffset: sym.addressOffset,
          watcomMapOffsetHex: toHex32(sym.addressOffset),
          moduleIndex: sym.moduleIndex,
          moduleName: null,
          status: 'NO_DEFINING_MODULE_SPAN',
          detail: `Module ${sym.moduleIndex} has no span in segment ${sym.segment} and offset is not in any other span`,
        });
      }
      continue;
    }

    // Defining spans exist
    const isInside = definingSpans.some((s) => sym.addressOffset >= s.start && sym.addressOffset < s.end);
    if (isInside) {
      insideDefiningModuleSpanCount++;
      symbolStatuses.push('INSIDE_DEFINING_MODULE_SPAN');
      continue;
    }

    const isAtEnd = definingSpans.some((s) => sym.addressOffset === s.end);
    if (isAtEnd) {
      atDefiningModuleEndCount++;
      symbolStatuses.push('AT_DEFINING_MODULE_END');
      // Recorded as boundary case; not an exception
      continue;
    }

    // Check if inside another module's span
    const containing = segMap.spans.find((s) => sym.addressOffset >= s.start && sym.addressOffset < s.end);
    if (containing) {
      insideDifferentModuleSpanCount++;
      symbolStatuses.push('INSIDE_DIFFERENT_MODULE_SPAN');
      exceptions.push({
        globalIndex: idx,
        name: sym.name,
        watcomMapSegment: sym.segment,
        watcomMapOffset: sym.addressOffset,
        watcomMapOffsetHex: toHex32(sym.addressOffset),
        moduleIndex: sym.moduleIndex,
        moduleName: definingSpans[0]?.moduleName ?? null,
        status: 'INSIDE_DIFFERENT_MODULE_SPAN',
        detail: `Symbol of module ${sym.moduleIndex} falls inside module ${containing.moduleIndex} (${containing.moduleName ?? 'unnamed'}) span [${toHex32(containing.start)}, ${toHex32(containing.end)})`,
      });
    } else if (sym.addressOffset < minCov || sym.addressOffset >= maxCov) {
      outsideAddressInfoCoverageCount++;
      symbolStatuses.push('OUTSIDE_ADDRESS_INFO_COVERAGE');
      exceptions.push({
        globalIndex: idx,
        name: sym.name,
        watcomMapSegment: sym.segment,
        watcomMapOffset: sym.addressOffset,
        watcomMapOffsetHex: toHex32(sym.addressOffset),
        moduleIndex: sym.moduleIndex,
        moduleName: definingSpans[0]?.moduleName ?? null,
        status: 'OUTSIDE_ADDRESS_INFO_COVERAGE',
        detail: `Symbol offset ${toHex32(sym.addressOffset)} is outside segment address-info coverage [${toHex32(minCov)}, ${toHex32(maxCov)})`,
      });
    } else {
      outsideAddressInfoCoverageCount++;
      symbolStatuses.push('OUTSIDE_ADDRESS_INFO_COVERAGE');
      exceptions.push({
        globalIndex: idx,
        name: sym.name,
        watcomMapSegment: sym.segment,
        watcomMapOffset: sym.addressOffset,
        watcomMapOffsetHex: toHex32(sym.addressOffset),
        moduleIndex: sym.moduleIndex,
        moduleName: definingSpans[0]?.moduleName ?? null,
        status: 'OUTSIDE_ADDRESS_INFO_COVERAGE',
        detail: `Symbol offset ${toHex32(sym.addressOffset)} falls in address-info gap`,
      });
    }
  }

  return {
    summary: {
      insideDefiningModuleSpanCount,
      atDefiningModuleEndCount,
      insideDifferentModuleSpanCount,
      outsideAddressInfoCoverageCount,
      noDefiningModuleSpanCount,
      totalSymbolsReconciled: symbols.length,
    },
    symbolStatuses,
    exceptions,
  };
}

/**
 * Reconciles unresolved LE object intervals against Watcom address-information coverage.
 */
export function reconcileUnresolvedCoverage(
  segmentQualifications: WatcomSegmentQualification[],
  addressInfo: WatcomAddressInfoClass,
  leObjects: LEObjectEntry[],
  initialStackObject?: number,
  initialStackEsp?: number,
): UnresolvedLECoverageInterval[] {
  const unresolvedIntervals: UnresolvedLECoverageInterval[] = [];

  for (const qual of segmentQualifications) {
    if (qual.qualificationStatus !== 'UNIQUELY_QUALIFIED' || qual.qualifiedObjectNumber === null) {
      continue;
    }

    const targetObj = leObjects.find((o) => o.objectNumber === qual.qualifiedObjectNumber);
    if (!targetObj) continue;

    const segRec = addressInfo.segmentRecords.find((r) => r.segment === qual.watcomSegment);
    if (!segRec) continue;

    const covStart = segRec.startAddressOffset;
    const covSpan = segRec.entries.reduce((acc, e) => acc + e.size, 0);
    const covEnd = covStart + covSpan;

    // Check suffix
    if (covEnd < targetObj.virtualSize) {
      const byteLength = targetObj.virtualSize - covEnd;
      let initialStackEspRelation: string | undefined = undefined;

      if (initialStackObject === targetObj.objectNumber && initialStackEsp !== undefined) {
        if (initialStackEsp === targetObj.virtualSize) {
          initialStackEspRelation = `Initial stack ESP (${toHex32(initialStackEsp)}) is AT_OBJECT_END_BOUNDARY of LE Object ${targetObj.objectNumber} (virtual end ${toHex32(targetObj.virtualSize)})`;
        } else if (initialStackEsp >= covEnd && initialStackEsp < targetObj.virtualSize) {
          initialStackEspRelation = `Initial stack ESP (${toHex32(initialStackEsp)}) is located inside this suffix interval [${toHex32(covEnd)}, ${toHex32(targetObj.virtualSize)})`;
        }
      }

      unresolvedIntervals.push({
        leObjectNumber: targetObj.objectNumber,
        intervalKind: 'UNEXPLAINED_LE_OBJECT_SUFFIX',
        startOffset: covEnd,
        startOffsetHex: toHex32(covEnd),
        endOffset: targetObj.virtualSize,
        endOffsetHex: toHex32(targetObj.virtualSize),
        byteLength,
        byteLengthHex: toHex32(byteLength),
        classification: 'UNEXPLAINED LE OBJECT SUFFIX',
        initialStackEspRelation,
      });
    }

    // Check prefix
    if (covStart > 0) {
      unresolvedIntervals.push({
        leObjectNumber: targetObj.objectNumber,
        intervalKind: 'UNEXPLAINED_LE_OBJECT_PREFIX',
        startOffset: 0,
        startOffsetHex: toHex32(0),
        endOffset: covStart,
        endOffsetHex: toHex32(covStart),
        byteLength: covStart,
        byteLengthHex: toHex32(covStart),
        classification: 'UNEXPLAINED LE OBJECT PREFIX',
      });
    }
  }

  return unresolvedIntervals;
}

/**
 * Mechanically qualifies all Watcom debug segments against LE objects.
 */
export function qualifyWatcomAddressModel(
  segmentAddresses: WatcomSegmentAddressTable,
  globalSymbols: WatcomGlobalSymbolClass,
  addressInfo: WatcomAddressInfoClass,
  leObjects: LEObjectEntry[],
  pageSize: number,
  pageMap: LEPageMapEntry[],
  initialStackObject?: number,
  initialStackEsp?: number,
): WatcomAddressModelQualificationResult {
  const errors: string[] = [];

  // 1. Gather all unique Watcom segment IDs present in debug information
  const segmentIdSet = new Set<number>();
  for (const entry of segmentAddresses.entries) {
    segmentIdSet.add(entry.segment);
  }
  for (const sym of globalSymbols.symbols) {
    segmentIdSet.add(sym.segment);
  }
  for (const rec of addressInfo.segmentRecords) {
    segmentIdSet.add(rec.segment);
  }

  const sortedSegmentIds = Array.from(segmentIdSet).sort((a, b) => a - b);

  // Group symbols by segment
  const symbolsBySegment = new Map<number, WatcomGlobalSymbol[]>();
  for (const sym of globalSymbols.symbols) {
    const list = symbolsBySegment.get(sym.segment) || [];
    list.push(sym);
    symbolsBySegment.set(sym.segment, list);
  }

  // Group address-info by segment
  const addressInfoBySegment = new Map<number, number>();
  for (const rec of addressInfo.segmentRecords) {
    const declaredSpan = rec.startAddressOffset + rec.entries.reduce((acc, e) => acc + e.size, 0);
    addressInfoBySegment.set(rec.segment, declaredSpan);
  }

  // 2. Test every segment against every LE object
  const segmentQualifications: WatcomSegmentQualification[] = [];
  const segmentQualificationMap = new Map<number, WatcomSegmentQualification>();

  for (const segId of sortedSegmentIds) {
    const symbols = symbolsBySegment.get(segId) || [];
    const totalSymbolsInSegment = symbols.length;

    let codeCount = 0;
    let dataCount = 0;
    let staticCount = 0;
    let maxOffset = 0;

    for (const sym of symbols) {
      const isCode = sym.kindBits ? sym.kindBits.isCode : Boolean((sym as any).isCode);
      const isData = sym.kindBits ? sym.kindBits.isData : Boolean((sym as any).isData);
      const isStatic = sym.kindBits ? sym.kindBits.isStatic : Boolean((sym as any).isStatic);
      if (isCode) codeCount++;
      if (isData) dataCount++;
      if (isStatic) staticCount++;
      if (sym.addressOffset > maxOffset) maxOffset = sym.addressOffset;
    }

    const declaredAddrInfoSpan = addressInfoBySegment.get(segId) || 0;
    const addrInfoRecCount = addressInfo.segmentRecords.filter((r) => r.segment === segId).length;

    const testedPairings: WatcomSegmentToObjectPairing[] = [];
    const compatibleObjectNumbers: number[] = [];

    for (const obj of leObjects) {
      let containedCount = 0;
      let overflowCount = 0;

      for (const sym of symbols) {
        if (sym.addressOffset < obj.virtualSize) {
          containedCount++;
        } else {
          overflowCount++;
        }
      }

      const allSymbolsContained = totalSymbolsInSegment === 0 || overflowCount === 0;
      const addressInfoFitsVirtualSize =
        declaredAddrInfoSpan === 0 || declaredAddrInfoSpan <= obj.virtualSize;

      const kindDiscrepancies: string[] = [];
      let alignmentPoints = 0;
      let alignmentTotal = 0;

      const isExecutable = obj.flags?.executable ?? Boolean((obj as any).isExecutable);
      const isWritable = obj.flags?.writable ?? Boolean((obj as any).isWritable);
      const isReadable = obj.flags?.readable ?? Boolean((obj as any).isReadable);
      const rawFlags = obj.rawFlags ?? (typeof obj.flags === 'number' ? obj.flags : 0);
      const flagsHex = '0x' + (rawFlags >>> 0).toString(16).padStart(8, '0').toUpperCase();

      if (totalSymbolsInSegment > 0) {
        if (codeCount > 0) {
          alignmentTotal += codeCount;
          if (isExecutable) {
            alignmentPoints += codeCount;
          } else {
            kindDiscrepancies.push(
              `${codeCount} code symbols in non-executable LE Object ${obj.objectNumber}`,
            );
          }
        }
        if (dataCount > 0) {
          alignmentTotal += dataCount;
          if (isWritable || isReadable) {
            alignmentPoints += dataCount;
          } else {
            kindDiscrepancies.push(
              `${dataCount} data symbols in non-data LE Object ${obj.objectNumber}`,
            );
          }
        }
      }

      const kindAlignmentScore =
        alignmentTotal > 0 ? alignmentPoints / alignmentTotal : 1.0;

      const reasons: string[] = [];
      let verdict: 'COMPATIBLE' | 'PARTIAL_MISMATCH' | 'INCOMPATIBLE';

      if (!allSymbolsContained) {
        verdict = 'INCOMPATIBLE';
        reasons.push(
          `${overflowCount}/${totalSymbolsInSegment} symbols overflow object virtual size (${toHex32(obj.virtualSize)})`,
        );
      } else if (!addressInfoFitsVirtualSize) {
        verdict = 'INCOMPATIBLE';
        reasons.push(
          `Address-info declared span (${toHex32(declaredAddrInfoSpan)}) overflows object virtual size (${toHex32(obj.virtualSize)})`,
        );
      } else if (kindAlignmentScore < 0.5 && totalSymbolsInSegment > 0) {
        verdict = 'PARTIAL_MISMATCH';
        reasons.push(
          `Symbol kind alignment score (${kindAlignmentScore.toFixed(2)}) indicates severe capability mismatch`,
        );
        reasons.push(...kindDiscrepancies);
      } else {
        verdict = 'COMPATIBLE';
        reasons.push(
          `All ${totalSymbolsInSegment} symbols fit within virtual size ${toHex32(obj.virtualSize)}`,
        );
        if (declaredAddrInfoSpan > 0) {
          reasons.push(
            `Address-info span ${toHex32(declaredAddrInfoSpan)} fits within virtual size ${toHex32(obj.virtualSize)}`,
          );
        }
        if (kindDiscrepancies.length > 0) {
          reasons.push(...kindDiscrepancies);
        }
      }

      if (verdict === 'COMPATIBLE') {
        compatibleObjectNumbers.push(obj.objectNumber);
      }

      testedPairings.push({
        watcomSegment: segId,
        watcomSegmentHex: toHex16(segId),
        leObjectNumber: obj.objectNumber,
        leObjectRelocBase: obj.relocationBaseAddress,
        leObjectRelocBaseHex: obj.relocationBaseAddressHex,
        leObjectVirtualSize: obj.virtualSize,
        leObjectVirtualSizeHex: obj.virtualSizeHex,
        leObjectFlags: rawFlags,
        leObjectFlagsHex: flagsHex,
        leObjectIsExecutable: isExecutable,
        leObjectIsWritable: isWritable,
        leObjectIsReadable: isReadable,
        leObjectPageMapIndex: obj.pageMapIndex,
        leObjectPageMapEntryCount: obj.pageMapEntryCount,
        totalSymbolsInSegment,
        symbolsContainedInVirtualSize: containedCount,
        symbolsOverflowingVirtualSize: overflowCount,
        allSymbolsContained,
        maxSymbolOffset: maxOffset,
        maxSymbolOffsetHex: toHex32(maxOffset),
        codeSymbolCount: codeCount,
        dataSymbolCount: dataCount,
        staticSymbolCount: staticCount,
        kindAlignmentScore,
        kindDiscrepancies,
        addressInfoRecordCount: addrInfoRecCount,
        addressInfoDeclaredSpan: declaredAddrInfoSpan,
        addressInfoDeclaredSpanHex: toHex32(declaredAddrInfoSpan),
        addressInfoFitsVirtualSize,
        verdict,
        reasons,
      });
    }

    let qualificationStatus: 'UNIQUELY_QUALIFIED' | 'AMBIGUOUS' | 'UNMAPPED';
    let qualifiedObjectNumber: number | null = null;
    let qualificationReason = '';

    if (compatibleObjectNumbers.length === 1) {
      qualificationStatus = 'UNIQUELY_QUALIFIED';
      qualifiedObjectNumber = compatibleObjectNumbers[0];
      qualificationReason = `Structurally unique match to LE Object ${qualifiedObjectNumber} based on containment and capability alignment`;
    } else if (compatibleObjectNumbers.length > 1) {
      qualificationStatus = 'AMBIGUOUS';
      qualificationReason = `Multiple compatible LE Objects [${compatibleObjectNumbers.join(', ')}]; ambiguity preserved per epistemic rule`;
    } else {
      qualificationStatus = 'UNMAPPED';
      qualificationReason = `No compatible LE Object found satisfying containment and capability alignment`;
    }

    const qualification: WatcomSegmentQualification = {
      watcomSegment: segId,
      watcomSegmentHex: toHex16(segId),
      testedPairings,
      compatibleObjectNumbers,
      qualificationStatus,
      qualifiedObjectNumber,
      qualificationReason,
      runtimeAddressVerified: false,
    };

    segmentQualifications.push(qualification);
    segmentQualificationMap.set(segId, qualification);
  }

  // 3. Reconcile module ranges
  const moduleRangeReconciliation = reconcileModuleRanges(globalSymbols.symbols, addressInfo);

  // Build lookup of module spans for symbol details, keyed by segment:moduleIndex
  const segmentModuleSpans = new Map<string, Array<{ start: number; startHex: string; end: number; endHex: string }>>();
  for (const rec of addressInfo.segmentRecords) {
    let curr = rec.startAddressOffset;
    for (const entry of rec.entries) {
      const key = `${rec.segment}:${entry.moduleIndex}`;
      const list = segmentModuleSpans.get(key) || [];
      list.push({
        start: curr,
        startHex: toHex32(curr),
        end: curr + entry.size,
        endHex: toHex32(curr + entry.size),
      });
      segmentModuleSpans.set(key, list);
      curr += entry.size;
    }
  }

  // 4. Derive coordinates and classify physical backing for all global symbols
  const symbolCoordinateInventory: WatcomSymbolCoordinateRecord[] = [];

  let fileBackedCount = 0;
  let pagePaddingCount = 0;
  let zeroFilledCount = 0;
  let virtualUnbackedCount = 0;
  let pageMapUnavailableCount = 0;
  let outsideObjectCount = 0;
  let unknownNonFileBackedCount = 0;

  for (let idx = 0; idx < globalSymbols.symbols.length; idx++) {
    const sym = globalSymbols.symbols[idx];
    const segQual = segmentQualificationMap.get(sym.segment);

    let qualifiedLeObjectNumber: number | null = null;
    let candidateObjectRelativeOffset: number | null = null;
    let candidateObjectRelativeOffsetHex: string | null = null;
    let lePreferredBase: number | null = null;
    let lePreferredBaseHex: string | null = null;
    let candidatePreferredLinearAddress: number | null = null;
    let candidatePreferredLinearAddressHex: string | null = null;

    let backingCategory: PhysicalBackingCategory = 'UNKNOWN_NON_FILE_BACKED';
    let physicalFileOffset: number | null = null;
    let physicalFileOffsetHex: string | null = null;
    let pageTableIndex: number | null = null;
    let pageMapEntryType: string | null = null;

    if (segQual && segQual.qualificationStatus === 'UNIQUELY_QUALIFIED' && segQual.qualifiedObjectNumber !== null) {
      qualifiedLeObjectNumber = segQual.qualifiedObjectNumber;
      const targetObj = leObjects.find((o) => o.objectNumber === qualifiedLeObjectNumber)!;

      candidateObjectRelativeOffset = sym.addressOffset;
      candidateObjectRelativeOffsetHex = toHex32(sym.addressOffset);
      lePreferredBase = targetObj.relocationBaseAddress;
      lePreferredBaseHex = targetObj.relocationBaseAddressHex;
      candidatePreferredLinearAddress = (targetObj.relocationBaseAddress + sym.addressOffset) >>> 0;
      candidatePreferredLinearAddressHex = toHex32(candidatePreferredLinearAddress);

      const backing = inspectOffsetBacking(sym.addressOffset, targetObj, pageSize, pageMap);
      backingCategory = backing.physicalBackingCategory;
      physicalFileOffset = backing.physicalFileOffset;
      physicalFileOffsetHex = backing.physicalFileOffsetHex;
      pageTableIndex = backing.pageTableIndex;
      pageMapEntryType = backing.pageType ?? null;
    } else {
      backingCategory = 'UNKNOWN_NON_FILE_BACKED';
    }

    // Tally backing distribution
    switch (backingCategory) {
      case 'FILE_BACKED':
        fileBackedCount++;
        break;
      case 'PAGE_PADDING':
        pagePaddingCount++;
        break;
      case 'ZERO_FILLED_PAGE':
        zeroFilledCount++;
        break;
      case 'VIRTUAL_UNBACKED_BEYOND_PAGE_TABLE':
        virtualUnbackedCount++;
        break;
      case 'PAGE_MAP_ENTRY_UNAVAILABLE':
        pageMapUnavailableCount++;
        break;
      case 'OUTSIDE_OBJECT':
        outsideObjectCount++;
        break;
      case 'UNKNOWN_NON_FILE_BACKED':
      default:
        unknownNonFileBackedCount++;
        break;
    }

    // Determine module reconciliation status for this symbol from authoritative reconciliation array
    const modStatus: ModuleRangeReconciliationStatus =
      moduleRangeReconciliation.symbolStatuses?.[idx] ?? 'INSIDE_DEFINING_MODULE_SPAN';
    const exc = moduleRangeReconciliation.exceptions.find((e) => e.globalIndex === idx);

    // Segment-aware defining module span lookup: strictly from the SAME segment as the symbol
    const segKey = `${sym.segment}:${sym.moduleIndex}`;
    const candidateSpans = segmentModuleSpans.get(segKey);
    let defSpan: { start: number; startHex: string; end: number; endHex: string } | null = null;
    if (candidateSpans && candidateSpans.length > 0) {
      defSpan =
        candidateSpans.find((s) => sym.addressOffset >= s.start && sym.addressOffset <= s.end) || candidateSpans[0];
    }

    symbolCoordinateInventory.push({
      globalIndex: idx,
      name: sym.name,
      rawKind: sym.rawKind ?? (sym.kindBits ? sym.kindBits.rawKind : 0),
      rawKindHex: sym.kindBits ? sym.kindBits.rawKindHex : '0x' + ((sym.rawKind ?? 0) & 0xff).toString(16).padStart(2, '0').toUpperCase(),
      isCode: sym.kindBits ? sym.kindBits.isCode : Boolean((sym as any).isCode),
      isData: sym.kindBits ? sym.kindBits.isData : Boolean((sym as any).isData),
      isStatic: sym.kindBits ? sym.kindBits.isStatic : Boolean((sym as any).isStatic),
      watcomMapSegment: sym.segment,
      watcomMapSegmentHex: toHex16(sym.segment),
      watcomMapOffset: sym.addressOffset,
      watcomMapOffsetHex: toHex32(sym.addressOffset),
      moduleIndex: sym.moduleIndex,
      resolvedModuleName: sym.resolvedModuleName,
      qualifiedLeObjectNumber,
      candidateObjectRelativeOffset,
      candidateObjectRelativeOffsetHex,
      lePreferredBase,
      lePreferredBaseHex,
      candidatePreferredLinearAddress,
      candidatePreferredLinearAddressHex,
      runtimeAddressVerified: false,
      lePageMapCandidateBackingCategory: backingCategory,
      lePageMapCandidatePhysicalFileOffset: physicalFileOffset,
      lePageMapCandidatePhysicalFileOffsetHex: physicalFileOffsetHex,
      lePhysicalCoordinateVerified: false,
      physicalBackingCategory: backingCategory,
      physicalFileOffset,
      physicalFileOffsetHex,
      pageTableIndex,
      pageMapEntryType,
      moduleRangeReconciliation: modStatus,
      definingModuleSpan: defSpan,
      actualContainingModuleName: exc?.detail.includes('falls inside module') ? exc.detail : null,
    });
  }

  const physicalBackingSummary: PhysicalBackingSummary = {
    fileBacked: fileBackedCount,
    pagePadding: pagePaddingCount,
    zeroFilledPage: zeroFilledCount,
    virtualUnbackedBeyondPageTable: virtualUnbackedCount,
    pageMapEntryUnavailable: pageMapUnavailableCount,
    outsideObject: outsideObjectCount,
    unknownNonFileBacked: unknownNonFileBackedCount,
    totalSymbols: globalSymbols.symbols.length,
  };

  // 5. Address-information topology reconciliation (using whole-span page inspection)
  const addressInfoReconciliations: WatcomAddressInfoTopologyReconciliation[] = [];
  let addressInfoAllContained = true;

  for (let idx = 0; idx < addressInfo.segmentRecords.length; idx++) {
    const rec = addressInfo.segmentRecords[idx];
    const segQual = segmentQualificationMap.get(rec.segment);
    const sumSizes = rec.entries.reduce((acc, e) => acc + e.size, 0);
    const totalSpanBytes = sumSizes; // Span length is sum of sizes from startAddressOffset

    if (segQual && segQual.qualificationStatus === 'UNIQUELY_QUALIFIED' && segQual.qualifiedObjectNumber !== null) {
      const targetObj = leObjects.find((o) => o.objectNumber === segQual.qualifiedObjectNumber)!;
      const totalSpanEnd = rec.startAddressOffset + totalSpanBytes;
      const isWithinVirtualSize = totalSpanEnd <= targetObj.virtualSize;
      const spanExcessBytes = Math.max(0, totalSpanEnd - targetObj.virtualSize);

      if (!isWithinVirtualSize) {
        addressInfoAllContained = false;
      }

      const spanBacking = reconcileSpanFileBacking(
        rec.startAddressOffset,
        totalSpanBytes,
        targetObj,
        pageSize,
        pageMap,
      );

      let coverageStatus: 'FULL_CONTAINMENT' | 'PARTIAL_FILE_BACKED' | 'OVERRUN' | 'UNMAPPED';
      if (!isWithinVirtualSize) {
        coverageStatus = 'OVERRUN';
      } else if (spanBacking.allBytesFileBacked) {
        coverageStatus = 'FULL_CONTAINMENT';
      } else {
        coverageStatus = 'PARTIAL_FILE_BACKED';
      }

      addressInfoReconciliations.push({
        segInfoIndex: idx,
        watcomSegment: rec.segment,
        watcomSegmentHex: toHex16(rec.segment),
        startAddressOffset: rec.startAddressOffset,
        startAddressOffsetHex: toHex32(rec.startAddressOffset),
        totalSpanBytes,
        totalSpanBytesHex: toHex32(totalSpanBytes),
        entryCount: rec.entryCount,
        matchedLeObjectNumber: targetObj.objectNumber,
        leObjectVirtualSize: targetObj.virtualSize,
        leObjectVirtualSizeHex: toHex32(targetObj.virtualSize),
        isWithinVirtualSize,
        spanExcessBytes,
        allBytesFileBacked: spanBacking.allBytesFileBacked,
        intersectingPagesCount: spanBacking.intersectingPagesCount,
        fullyFileBackedPagesCount: spanBacking.fullyFileBackedPagesCount,
        partiallyFileBackedPagesCount: spanBacking.partiallyFileBackedPagesCount,
        zeroFilledPagesCount: spanBacking.zeroFilledPagesCount,
        virtualUnbackedPagesCount: spanBacking.virtualUnbackedPagesCount,
        invalidPagesCount: spanBacking.invalidPagesCount,
        intersectingPages: spanBacking.intersectingPages,
        coverageStatus,
        notes: [
          `Span [${toHex32(rec.startAddressOffset)}, ${toHex32(totalSpanEnd)}) evaluated across ${spanBacking.intersectingPagesCount} LE pages in Object ${targetObj.objectNumber} (${targetObj.virtualSizeHex} virtual bytes)`,
        ],
      });
    } else {
      addressInfoAllContained = false;
      addressInfoReconciliations.push({
        segInfoIndex: idx,
        watcomSegment: rec.segment,
        watcomSegmentHex: toHex16(rec.segment),
        startAddressOffset: rec.startAddressOffset,
        startAddressOffsetHex: toHex32(rec.startAddressOffset),
        totalSpanBytes,
        totalSpanBytesHex: toHex32(totalSpanBytes),
        entryCount: rec.entryCount,
        matchedLeObjectNumber: null,
        leObjectVirtualSize: null,
        leObjectVirtualSizeHex: null,
        isWithinVirtualSize: false,
        spanExcessBytes: totalSpanBytes,
        allBytesFileBacked: false,
        intersectingPagesCount: 0,
        fullyFileBackedPagesCount: 0,
        partiallyFileBackedPagesCount: 0,
        zeroFilledPagesCount: 0,
        virtualUnbackedPagesCount: 0,
        invalidPagesCount: 0,
        intersectingPages: [],
        coverageStatus: 'UNMAPPED',
        notes: [segQual?.qualificationReason ?? 'Segment unmapped'],
      });
    }
  }

  // 6. Unresolved LE coverage intervals
  const unresolvedCoverage = reconcileUnresolvedCoverage(
    segmentQualifications,
    addressInfo,
    leObjects,
    initialStackObject,
    initialStackEsp,
  );

  // 7. Summary metrics
  const uniqueMappingCount = segmentQualifications.filter(
    (q) => q.qualificationStatus === 'UNIQUELY_QUALIFIED',
  ).length;
  const ambiguousMappingCount = segmentQualifications.filter(
    (q) => q.qualificationStatus === 'AMBIGUOUS',
  ).length;
  const unmappedSegmentCount = segmentQualifications.filter(
    (q) => q.qualificationStatus === 'UNMAPPED',
  ).length;

  let overallMappingState: 'FULLY_QUALIFIED' | 'PARTIALLY_QUALIFIED' | 'AMBIGUOUS' | 'FAILED';
  if (ambiguousMappingCount > 0) {
    overallMappingState = 'AMBIGUOUS';
  } else if (unmappedSegmentCount === 0 && uniqueMappingCount > 0) {
    overallMappingState = 'FULLY_QUALIFIED';
  } else if (uniqueMappingCount > 0) {
    overallMappingState = 'PARTIALLY_QUALIFIED';
  } else {
    overallMappingState = 'FAILED';
  }

  return {
    segmentQualifications,
    uniqueMappingCount,
    ambiguousMappingCount,
    unmappedSegmentCount,
    overallMappingState,
    physicalBackingSummary,
    unresolvedCoverage,
    moduleRangeReconciliation,
    symbolCoordinateInventory,
    symbolCoordinatesSample: symbolCoordinateInventory.slice(0, 50),
    addressInfoReconciliations,
    addressInfoAllContained,
    errors,
  };
}
