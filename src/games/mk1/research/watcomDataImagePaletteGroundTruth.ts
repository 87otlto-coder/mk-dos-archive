/**
 * MK1 Watcom Data-Image Base and Symbol-Derived Palette Ground Truth (Pass 1E.3D.1).
 *
 * Corrective contract:
 * - Static-data file-image coordinates are qualified from two independent fixture-derived anchors:
 *     A = physical handle-table start - Watcom _handleTable offset
 *     B = independently reconstructed executable filename/string-area base
 * - LE page-map translation is retained only as a competing coordinate model.
 * - NEWPALS.ASM is selected exactly after blind permanent-class enumeration.
 * - Every unique DATA-symbol offset in that module is parsed structurally, without name heuristics.
 * - Full module tiling is required before palette semantics are promoted.
 * - Runtime selector/base semantics and IRQSKYE/index-0 semantics remain unresolved here.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { FixtureProvenance } from '../../../core/executable/watcomDebug/watcomDebugTypes';
import { inspectOffsetBacking } from '../../../core/executable/watcomDebug/watcomAddressModelQualifier';
import { WatcomGlobalSymbol, WatcomModuleInfo } from '../../../core/executable/watcomDebug/watcomPermanentClassTypes';
import { reconstructMK1HandleTable, MK1HandleTableResult } from './handleTableProbe';
import { qualifyMK1WatcomAddressModel, MK1WatcomAddressModelReport } from './watcomAddressModelInventory';
import { getAuthoritativeKanoSprites, AuthoritativeKanoResult } from './authoritativeKano';
import {
  convert15BitColorToRgb,
  computePaletteContentHash,
  scanExeForPalettes,
} from './paletteProbe';
import {
  AddressModelPreflightSummary,
  DerivedHandleTableAnchorEvidence,
  KanoPaletteModelComparison,
  KanoPaletteStructuralDetail,
  LegacyCatalogueComparisonEntry,
  LePageMapComparison,
  MK1WatcomDataImagePaletteGroundTruthExport,
  MK1WatcomDataImagePaletteGroundTruthReport,
  PaletteModuleTilingResult,
  RelatedWatcomSymbolMetadata,
  StaticDataBaseQualification,
  TupleTableValidation,
  WatcomHandleTableSymbolEvidence,
  WatcomPaletteModuleInfo,
  WatcomPaletteRecord,
} from './watcomDataImagePaletteGroundTruthTypes';

function toHex32(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

function toHex16(value: number): string {
  return `0x${(value & 0xffff).toString(16).padStart(4, '0').toUpperCase()}`;
}

function normalizeModuleName(name: string): string {
  return name.replace(/\\/g, '/').split('/').pop()?.toUpperCase() ?? name.toUpperCase();
}

function isValidRealProvenance(prov: FixtureProvenance): boolean {
  return (
    prov.sourceKind === 'user-loaded-directory' &&
    prov.synthetic === false &&
    prov.artifactGeneratedByTest === false &&
    typeof prov.sha256 === 'string' &&
    /^[0-9a-f]{64}$/.test(prov.sha256) &&
    !/^0{64}$/.test(prov.sha256)
  );
}

/** Independently reconstruct the FileEntry table and executable filename/string area. */
export async function deriveHandleTableAnchor(
  source: DirectorySource,
  options?: { exePath?: string },
): Promise<{ evidence: DerivedHandleTableAnchorEvidence; rawResult: MK1HandleTableResult }> {
  const result = await reconstructMK1HandleTable(source, { exePath: options?.exePath });
  const isAnchorVerified =
    result.summary.reconstructionStatus === 'VERIFIED_FIXTURE' &&
    result.table.entryCount > 0 &&
    result.table.startOffset > 0 &&
    result.stringResolution.confidence === 'verified' &&
    typeof result.stringResolution.baseOffset === 'number' &&
    result.directoryComparison.referenced > 0;

  return {
    evidence: {
      physicalStart: result.table.startOffset,
      physicalStartHex: result.table.startOffsetHex,
      physicalEnd: result.table.endOffset,
      physicalEndHex: result.table.endOffsetHex,
      entryCount: result.table.entryCount,
      stride: result.table.stride,
      stringResolutionBase: result.stringResolution.baseOffset,
      stringResolutionBaseHex: result.stringResolution.baseOffsetHex,
      stringResolutionConfidence: result.stringResolution.confidence,
      directoryReconciledCount: result.directoryComparison.referenced,
      reconstructionStatus: result.summary.reconstructionStatus,
      isAnchorVerified,
    },
    rawResult: result,
  };
}

/** Post-enumeration MK1-specific validation anchor. Generic Watcom parsing never uses this name. */
export function locateWatcomHandleTableSymbol(
  symbols: WatcomGlobalSymbol[],
): WatcomHandleTableSymbolEvidence | null {
  const matches = symbols.filter(
    (s) => s.valid && s.name === '_handleTable' && s.segment === 2 && s.kindBits.isData,
  );
  if (matches.length !== 1) return null;
  const target = matches[0];
  return {
    name: target.name,
    watcomMapSegment: target.segment,
    watcomMapSegmentHex: toHex16(target.segment),
    watcomMapOffset: target.addressOffset,
    watcomMapOffsetHex: toHex32(target.addressOffset),
    moduleIndex: target.moduleIndex,
    moduleName: target.resolvedModuleName ?? null,
    rawKind: target.rawKind,
    isData: target.kindBits.isData,
  };
}

/** Pure mechanical two-anchor qualifier. The LE page-map result is deliberately irrelevant here. */
export function qualifyStaticDataFileBase(
  anchor: DerivedHandleTableAnchorEvidence,
  symbol: WatcomHandleTableSymbolEvidence | null,
): StaticDataBaseQualification {
  const rationale: string[] = [];

  if (!anchor.isAnchorVerified) {
    return {
      status: 'MISSING_ANCHOR',
      candidateBaseA: null,
      candidateBaseAHex: null,
      candidateBaseB: anchor.stringResolutionBase ?? null,
      candidateBaseBHex: anchor.stringResolutionBaseHex ?? null,
      basesAgree: false,
      anchorRoundTripPassed: false,
      qualifiedBase: null,
      qualifiedBaseHex: null,
      rationale: ['Handle-table reconstruction/string-area anchor is not independently VERIFIED.'],
    };
  }

  if (!symbol || !symbol.isData || symbol.watcomMapSegment !== 2) {
    return {
      status: 'INVALID_HANDLE_SYMBOL',
      candidateBaseA: null,
      candidateBaseAHex: null,
      candidateBaseB: anchor.stringResolutionBase ?? null,
      candidateBaseBHex: anchor.stringResolutionBaseHex ?? null,
      basesAgree: false,
      anchorRoundTripPassed: false,
      qualifiedBase: null,
      qualifiedBaseHex: null,
      rationale: ['Exactly one valid segment-2 DATA symbol named _handleTable is required after blind enumeration.'],
    };
  }

  if (anchor.physicalStart < symbol.watcomMapOffset) {
    return {
      status: 'SUBTRACTION_UNDERFLOW',
      candidateBaseA: null,
      candidateBaseAHex: null,
      candidateBaseB: anchor.stringResolutionBase ?? null,
      candidateBaseBHex: anchor.stringResolutionBaseHex ?? null,
      basesAgree: false,
      anchorRoundTripPassed: false,
      qualifiedBase: null,
      qualifiedBaseHex: null,
      rationale: ['physicalHandleTableStart - Watcom map offset would underflow.'],
    };
  }

  const candidateBaseA = anchor.physicalStart - symbol.watcomMapOffset;
  const candidateBaseB = anchor.stringResolutionBase;
  rationale.push(
    `Method A: ${anchor.physicalStartHex} - ${symbol.watcomMapOffsetHex} = ${toHex32(candidateBaseA)}.`,
  );

  if (
    candidateBaseB === undefined ||
    anchor.stringResolutionConfidence !== 'verified' ||
    anchor.directoryReconciledCount <= 0
  ) {
    return {
      status: 'MISSING_STRING_BASE',
      candidateBaseA,
      candidateBaseAHex: toHex32(candidateBaseA),
      candidateBaseB: candidateBaseB ?? null,
      candidateBaseBHex: candidateBaseB === undefined ? null : toHex32(candidateBaseB),
      basesAgree: false,
      anchorRoundTripPassed: false,
      qualifiedBase: null,
      qualifiedBaseHex: null,
      rationale: [...rationale, 'Method B requires a verified independently reconstructed string-resolution base.'],
    };
  }

  rationale.push(`Method B: independent string-resolution base = ${toHex32(candidateBaseB)}.`);
  const basesAgree = candidateBaseA === candidateBaseB;
  if (!basesAgree) {
    return {
      status: 'BASE_DISAGREEMENT',
      candidateBaseA,
      candidateBaseAHex: toHex32(candidateBaseA),
      candidateBaseB,
      candidateBaseBHex: toHex32(candidateBaseB),
      basesAgree: false,
      anchorRoundTripPassed: false,
      qualifiedBase: null,
      qualifiedBaseHex: null,
      rationale: [...rationale, 'Independent base derivations disagree; fail closed.'],
    };
  }

  const roundTrip = candidateBaseA + symbol.watcomMapOffset === anchor.physicalStart;
  if (!roundTrip) {
    return {
      status: 'ANCHOR_FAILURE',
      candidateBaseA,
      candidateBaseAHex: toHex32(candidateBaseA),
      candidateBaseB,
      candidateBaseBHex: toHex32(candidateBaseB),
      basesAgree: true,
      anchorRoundTripPassed: false,
      qualifiedBase: null,
      qualifiedBaseHex: null,
      rationale: [...rationale, 'Anchor round-trip did not reproduce the independently discovered physical table start.'],
    };
  }

  return {
    status: 'QUALIFIED_STATIC_DATA_FILE_BASE',
    candidateBaseA,
    candidateBaseAHex: toHex32(candidateBaseA),
    candidateBaseB,
    candidateBaseBHex: toHex32(candidateBaseB),
    basesAgree: true,
    anchorRoundTripPassed: true,
    qualifiedBase: candidateBaseA,
    qualifiedBaseHex: toHex32(candidateBaseA),
    rationale: [
      ...rationale,
      'Independent methods agree exactly and the base+symbol-offset round-trip reproduces the handle-table physical start.',
    ],
  };
}

export function buildLePageMapComparison(
  addressModel: MK1WatcomAddressModelReport,
  symbol: WatcomHandleTableSymbolEvidence | null,
  anchor: DerivedHandleTableAnchorEvidence,
): LePageMapComparison {
  const layout = addressModel.layoutReport;
  const object2 = layout?.objects.find((o) => o.objectNumber === 2) ?? null;
  if (!symbol || !layout || !object2) {
    return {
      watcomSegment: symbol?.watcomMapSegment ?? null,
      leObjectNumber: object2?.objectNumber ?? null,
      candidatePhysicalOffset: null,
      candidatePhysicalOffsetHex: null,
      handleTablePhysicalStart: anchor.physicalStart,
      handleTablePhysicalStartHex: anchor.physicalStartHex,
      matchesStaticImageAnchor: false,
      relationship: 'UNAVAILABLE',
      note: 'LE page-map candidate could not be calculated.',
    };
  }
  const backing = inspectOffsetBacking(
    symbol.watcomMapOffset,
    object2,
    layout.parsedHeader?.pageSize ?? 4096,
    layout.pageMap,
  );
  const candidate = backing.physicalFileOffset;
  const agrees = candidate !== null && candidate === anchor.physicalStart;
  return {
    watcomSegment: symbol.watcomMapSegment,
    leObjectNumber: object2.objectNumber,
    candidatePhysicalOffset: candidate,
    candidatePhysicalOffsetHex: candidate === null ? null : toHex32(candidate),
    handleTablePhysicalStart: anchor.physicalStart,
    handleTablePhysicalStartHex: anchor.physicalStartHex,
    matchesStaticImageAnchor: agrees,
    relationship: candidate === null ? 'UNAVAILABLE' : agrees ? 'AGREES' : 'DISAGREES',
    note: candidate === null
      ? 'No file-backed LE page-map candidate is available for this Watcom offset.'
      : agrees
        ? 'Direct LE page-map candidate happens to agree with the independent static-file anchor.'
        : 'Direct LE page-map candidate disagrees with the independently qualified static-file-image anchor; the coordinate models remain distinct.',
  };
}

function moduleReconciliationConsistent(addressModel: MK1WatcomAddressModelReport): boolean {
  const q = addressModel.qualification;
  const counts = {
    INSIDE_DEFINING_MODULE_SPAN: 0,
    AT_DEFINING_MODULE_END: 0,
    INSIDE_DIFFERENT_MODULE_SPAN: 0,
    OUTSIDE_ADDRESS_INFO_COVERAGE: 0,
    NO_DEFINING_MODULE_SPAN: 0,
  };
  for (const symbol of q.symbolCoordinateInventory) {
    const k = symbol.moduleRangeReconciliation as keyof typeof counts;
    if (k in counts) counts[k]++;
  }
  const s = q.moduleRangeReconciliation.summary;
  return (
    counts.INSIDE_DEFINING_MODULE_SPAN === s.insideDefiningModuleSpanCount &&
    counts.AT_DEFINING_MODULE_END === s.atDefiningModuleEndCount &&
    counts.INSIDE_DIFFERENT_MODULE_SPAN === s.insideDifferentModuleSpanCount &&
    counts.OUTSIDE_ADDRESS_INFO_COVERAGE === s.outsideAddressInfoCoverageCount &&
    counts.NO_DEFINING_MODULE_SPAN === s.noDefiningModuleSpanCount &&
    q.symbolCoordinateInventory.length === s.totalSymbolsReconciled
  );
}

function buildAddressModelPreflight(addressModel: MK1WatcomAddressModelReport): AddressModelPreflightSummary {
  const layout = addressModel.layoutReport;
  return {
    runtimeAddressVerified: false,
    leObjects: (layout?.objects ?? []).map((o) => ({
      objectNumber: o.objectNumber,
      virtualSize: o.virtualSize,
      virtualSizeHex: o.virtualSizeHex,
      relocationBaseAddress: o.relocationBaseAddress,
      relocationBaseAddressHex: o.relocationBaseAddressHex,
      pageMapIndex: o.pageMapIndex,
      pageMapEntryCount: o.pageMapEntryCount,
      capabilities: o.capabilities,
    })),
    moduleRangeReconciliationConsistent: moduleReconciliationConsistent(addressModel),
  };
}

export interface ExactModuleSelection {
  module: WatcomModuleInfo;
  moduleInfo: WatcomPaletteModuleInfo;
  symbols: WatcomGlobalSymbol[];
}

/** Exact post-discovery module selection. No fuzzy PAL matching and no symbol-name filtering. */
export function selectExactPaletteModule(
  addressModel: MK1WatcomAddressModelReport,
  exactModuleName: string = 'NEWPALS.ASM',
): ExactModuleSelection | null {
  const permanent = addressModel.permanentClassesReport;
  if (!permanent) return null;
  const result = permanent.result;
  const matches = result.modules.modules.filter(
    (m) => normalizeModuleName(m.name) === exactModuleName.toUpperCase(),
  );
  if (matches.length !== 1) return null;
  const module = matches[0];

  const dataSymbols = result.globalSymbols.symbols.filter(
    (s) => s.valid && s.moduleIndex === module.moduleIndex && s.segment === 2 && s.kindBits.isData,
  );
  if (dataSymbols.length === 0) return null;

  const segmentRecord = result.addressInfo.segmentRecords.find((r) => r.segment === 2);
  if (!segmentRecord) return null;
  let cursor = segmentRecord.startAddressOffset;
  const matchingSpans: Array<{ start: number; size: number }> = [];
  for (const entry of segmentRecord.entries) {
    if (entry.moduleIndex === module.moduleIndex) matchingSpans.push({ start: cursor, size: entry.size });
    cursor += entry.size;
  }
  if (matchingSpans.length !== 1) return null;
  const span = matchingSpans[0];
  const uniqueOffsetCount = new Set(dataSymbols.map((s) => s.addressOffset)).size;

  return {
    module,
    symbols: dataSymbols,
    moduleInfo: {
      moduleIndex: module.moduleIndex,
      moduleName: module.name,
      segment: 2,
      segmentHex: '0x0002',
      startOffset: span.start,
      startOffsetHex: toHex32(span.start),
      size: span.size,
      sizeHex: toHex32(span.size),
      endOffset: span.start + span.size,
      endOffsetHex: toHex32(span.start + span.size),
      symbolCount: dataSymbols.length,
      uniqueOffsetCount,
    },
  };
}

export async function parsePaletteRecordAtPhysical(
  source: DirectorySource,
  exePath: string,
  exeSize: number,
  physicalFileOffset: number,
): Promise<{
  valid: boolean;
  reason: string | null;
  declaredLength: number;
  rawColorWords: number[];
}> {
  if (physicalFileOffset < 0 || physicalFileOffset + 2 > exeSize) {
    return { valid: false, reason: 'Palette header is outside executable bounds.', declaredLength: 0, rawColorWords: [] };
  }
  const header = await source.readSlice(exePath, physicalFileOffset, 2);
  if (header.length !== 2) {
    return { valid: false, reason: 'Palette header is truncated.', declaredLength: 0, rawColorWords: [] };
  }
  const declaredLength = header[0] | (header[1] << 8);
  if (declaredLength < 2 || declaredLength >= 256) {
    return { valid: false, reason: `Declared length ${declaredLength} is outside 2..255.`, declaredLength, rawColorWords: [] };
  }
  const totalBytes = 2 + declaredLength * 2;
  if (physicalFileOffset + totalBytes > exeSize) {
    return { valid: false, reason: 'Palette record exceeds executable bounds.', declaredLength, rawColorWords: [] };
  }
  const payload = await source.readSlice(exePath, physicalFileOffset + 2, declaredLength * 2);
  if (payload.length !== declaredLength * 2) {
    return { valid: false, reason: 'Palette payload is truncated.', declaredLength, rawColorWords: [] };
  }
  const rawColorWords: number[] = [];
  for (let i = 0; i < declaredLength; i++) {
    const word = payload[i * 2] | (payload[i * 2 + 1] << 8);
    if (word >= 0x8000) {
      return { valid: false, reason: `Colour word ${i} (${toHex16(word)}) is not 15-bit.`, declaredLength, rawColorWords: [...rawColorWords, word] };
    }
    rawColorWords.push(word);
  }
  return { valid: true, reason: null, declaredLength, rawColorWords };
}

export async function qualifyPaletteModuleRecords(
  source: DirectorySource,
  exePath: string,
  exeSize: number,
  qualifiedBase: number,
  selection: ExactModuleSelection,
): Promise<{
  paletteRecords: WatcomPaletteRecord[];
  moduleTiling: PaletteModuleTilingResult;
}> {
  const groups = new Map<number, WatcomGlobalSymbol[]>();
  for (const symbol of selection.symbols) {
    const list = groups.get(symbol.addressOffset) ?? [];
    list.push(symbol);
    groups.set(symbol.addressOffset, list);
  }
  const offsets = Array.from(groups.keys()).sort((a, b) => a - b);
  const paletteRecords: WatcomPaletteRecord[] = [];
  const parseFailures: PaletteModuleTilingResult['parseFailures'] = [];
  const contentFirst = new Map<string, number>();

  for (const watcomOffset of offsets) {
    const symbols = groups.get(watcomOffset)!;
    const physical = qualifiedBase + watcomOffset;
    const parsed = await parsePaletteRecordAtPhysical(source, exePath, exeSize, physical);
    if (!parsed.valid) {
      parseFailures.push({
        watcomOffset,
        watcomOffsetHex: toHex32(watcomOffset),
        symbolNames: symbols.map((s) => s.name),
        reason: parsed.reason ?? 'Unknown parse failure',
      });
      continue;
    }
    const byteLength = 2 + parsed.declaredLength * 2;
    const contentHash = computePaletteContentHash(new Uint16Array(parsed.rawColorWords)).toUpperCase();
    const recordIndex = paletteRecords.length;
    const duplicateContentOfRecordIndex = contentFirst.get(contentHash) ?? null;
    if (!contentFirst.has(contentHash)) contentFirst.set(contentHash, recordIndex);
    const uniqueColorCount = new Set(parsed.rawColorWords).size;
    paletteRecords.push({
      recordIndex,
      watcomMapSegment: 2,
      watcomMapSegmentHex: '0x0002',
      watcomStartOffset: watcomOffset,
      watcomStartOffsetHex: toHex32(watcomOffset),
      watcomEndOffset: watcomOffset + byteLength,
      watcomEndOffsetHex: toHex32(watcomOffset + byteLength),
      physicalFileOffset: physical,
      physicalFileOffsetHex: toHex32(physical),
      physicalEndOffset: physical + byteLength,
      physicalEndOffsetHex: toHex32(physical + byteLength),
      declaredLength: parsed.declaredLength,
      rawColorWords: parsed.rawColorWords,
      rawColorWordsHex: parsed.rawColorWords.map(toHex16),
      rgbColors: parsed.rawColorWords.map(convert15BitColorToRgb),
      uniqueColorCount,
      uniqueColorRatio: uniqueColorCount / parsed.declaredLength,
      contentHash,
      allWords15BitValid: true,
      isPaletteStructValid: true,
      symbolNames: symbols.map((s) => s.name),
      symbolGlobalIndices: symbols.map((s) => s.globalIndex),
      duplicateContentOfRecordIndex,
    });
  }

  paletteRecords.sort((a, b) => a.watcomStartOffset - b.watcomStartOffset);
  paletteRecords.forEach((r, i) => { r.recordIndex = i; });
  const gaps: PaletteModuleTilingResult['gaps'] = [];
  const overlaps: PaletteModuleTilingResult['overlaps'] = [];
  for (let i = 1; i < paletteRecords.length; i++) {
    const prev = paletteRecords[i - 1];
    const cur = paletteRecords[i];
    if (prev.watcomEndOffset < cur.watcomStartOffset) {
      gaps.push({
        start: prev.watcomEndOffset,
        startHex: toHex32(prev.watcomEndOffset),
        end: cur.watcomStartOffset,
        endHex: toHex32(cur.watcomStartOffset),
        byteLength: cur.watcomStartOffset - prev.watcomEndOffset,
      });
    } else if (prev.watcomEndOffset > cur.watcomStartOffset) {
      overlaps.push({
        previousRecordIndex: prev.recordIndex,
        currentRecordIndex: cur.recordIndex,
        overlapBytes: prev.watcomEndOffset - cur.watcomStartOffset,
      });
    }
  }

  const firstRecordStartsAtModuleStart =
    paletteRecords.length > 0 && paletteRecords[0].watcomStartOffset === selection.moduleInfo.startOffset;
  const finalRecordEndsAtModuleEnd =
    paletteRecords.length > 0 && paletteRecords[paletteRecords.length - 1].watcomEndOffset === selection.moduleInfo.endOffset;
  const accountedByteLength = paletteRecords.reduce(
    (sum, record) => sum + (record.watcomEndOffset - record.watcomStartOffset),
    0,
  );
  const exactTiling =
    parseFailures.length === 0 &&
    paletteRecords.length === offsets.length &&
    firstRecordStartsAtModuleStart &&
    finalRecordEndsAtModuleEnd &&
    gaps.length === 0 &&
    overlaps.length === 0 &&
    accountedByteLength === selection.moduleInfo.size;

  return {
    paletteRecords,
    moduleTiling: {
      firstRecordStartsAtModuleStart,
      finalRecordEndsAtModuleEnd,
      exactTiling,
      gapCount: gaps.length,
      overlapCount: overlaps.length,
      gaps,
      overlaps,
      parseFailures,
      uniqueOffsetCount: offsets.length,
      parsedRecordCount: paletteRecords.length,
      accountedByteLength,
      moduleByteLength: selection.moduleInfo.size,
      classification: exactTiling ? 'VERIFIED_PALETTE_MODULE' : 'PARTIAL_INCONCLUSIVE',
    },
  };
}

function buildKanoDetail(
  symbolName: 'KANO_P' | 'KANO3_P',
  records: WatcomPaletteRecord[],
): KanoPaletteStructuralDetail | null {
  const record = records.find((r) => r.symbolNames.includes(symbolName));
  if (!record) return null;
  return {
    symbolName,
    recordIndex: record.recordIndex,
    watcomOffset: record.watcomStartOffset,
    watcomOffsetHex: record.watcomStartOffsetHex,
    physicalOffset: record.physicalFileOffset,
    physicalOffsetHex: record.physicalFileOffsetHex,
    declaredLength: record.declaredLength,
    recordEnd: record.physicalEndOffset,
    recordEndHex: record.physicalEndOffsetHex,
    symbolAliases: record.symbolNames.filter((n) => n !== symbolName),
    rawColorWords: record.rawColorWords,
    rgbColors: record.rgbColors,
    previousRecordIndex: record.recordIndex > 0 ? record.recordIndex - 1 : null,
    nextRecordIndex: record.recordIndex + 1 < records.length ? record.recordIndex + 1 : null,
  };
}

export function compareKanoPaletteToSprites(
  palette: WatcomPaletteRecord,
  kanoResult: AuthoritativeKanoResult,
): KanoPaletteModelComparison {
  const union = [...kanoResult.aggregateStats.unionIndices].sort((a, b) => a - b);
  const positive = union.filter((i) => i > 0);
  const len = palette.declaredLength;
  const zeroMapped = union.filter((i) => i >= 0 && i < len);
  const zeroOut = union.filter((i) => i < 0 || i >= len);
  const zeroUsedSlots = new Set(zeroMapped);
  const zeroUnused = Array.from({ length: len }, (_, i) => i).filter((i) => !zeroUsedSlots.has(i));

  const oneMapped = positive.filter((i) => i - 1 >= 0 && i - 1 < len);
  const oneOut = positive.filter((i) => i - 1 < 0 || i - 1 >= len);
  const oneUsedSlots = new Set(oneMapped.map((i) => i - 1));
  const oneUnused = Array.from({ length: len }, (_, i) => i).filter((i) => !oneUsedSlots.has(i));
  const fit = (out: number[], tested: number) =>
    tested === 0 ? 'INCOMPATIBLE' as const : out.length === 0 ? 'EXACT_FULL_FIT' as const : 'PARTIAL_OVERFLOW' as const;

  return {
    paletteSymbolName: palette.symbolNames.includes('KANO_P') ? 'KANO_P' : palette.symbolNames[0] ?? 'record',
    paletteDeclaredLength: len,
    authoritativeSpriteCount: kanoResult.sampleCount,
    spriteMinOpaqueIndex: kanoResult.aggregateStats.minSourceIndex,
    spriteMaxSourceIndex: kanoResult.aggregateStats.maxSourceIndex,
    spriteDistinctSourceIndexCount: kanoResult.aggregateStats.distinctCount,
    spriteUnionIndices: union,
    opaqueZeroPresentInSprites: union.includes(0),
    zeroBasedModel: {
      indexingDescription: 'source index n -> palette[n]',
      mappedCount: zeroMapped.length,
      mappedIndices: zeroMapped,
      outOfRangeCount: zeroOut.length,
      outOfRangeIndices: zeroOut,
      unusedPaletteSlotsCount: zeroUnused.length,
      unusedPaletteIndices: zeroUnused,
      fitQuality: fit(zeroOut, union.length),
    },
    oneBasedModel: {
      indexingDescription: 'positive source index n -> palette[n - 1]',
      mappedCount: oneMapped.length,
      mappedIndices: oneMapped,
      outOfRangeCount: oneOut.length,
      outOfRangeIndices: oneOut,
      unusedPaletteSlotsCount: oneUnused.length,
      unusedPaletteIndices: oneUnused,
      fitQuality: fit(oneOut, positive.length),
    },
    opaqueZeroResolution: union.includes(0) ? 'OBSERVED_UNRESOLVED' : 'NOT_OBSERVED',
    notes: [
      'Both indexing models are evaluated mechanically; IRQSKYE is not used to make either model succeed.',
      union.includes(0)
        ? 'Opaque source index 0 was observed and remains semantically unresolved by this comparison.'
        : 'Opaque source index 0 was not observed in the aggregate authoritative Kano source-index set.',
    ],
  };
}

export async function validateTupleTable(
  source: DirectorySource,
  exePath: string,
  exeSize: number,
  symbols: WatcomGlobalSymbol[],
  qualifiedBase: number | null,
): Promise<TupleTableValidation> {
  const matches = symbols.filter(
    (s) => s.valid && s.name === 'TupleTable' && s.segment === 2 && s.kindBits.isData,
  );
  if (qualifiedBase === null || matches.length !== 1) {
    return {
      symbolFound: matches.length === 1,
      symbolName: matches.length === 1 ? matches[0].name : null,
      watcomMapSegment: matches.length === 1 ? matches[0].segment : null,
      watcomMapOffset: matches.length === 1 ? matches[0].addressOffset : null,
      watcomMapOffsetHex: matches.length === 1 ? toHex32(matches[0].addressOffset) : null,
      physicalFileOffset: null,
      physicalFileOffsetHex: null,
      entriesRequested: 256,
      entriesChecked: 0,
      matchingEntries: 0,
      mismatchCount: 0,
      firstMismatch: null,
      patternVerified: false,
      classification: 'UNAVAILABLE',
    };
  }
  const symbol = matches[0];
  const physical = qualifiedBase + symbol.addressOffset;
  const byteLength = 256 * 4;
  const available = Math.max(0, Math.min(byteLength, exeSize - physical));
  const bytes = available > 0 ? await source.readSlice(exePath, physical, available) : new Uint8Array(0);
  const pattern = validateRepeatedByteDwordTable(bytes, 256);
  return {
    symbolFound: true,
    symbolName: symbol.name,
    watcomMapSegment: symbol.segment,
    watcomMapOffset: symbol.addressOffset,
    watcomMapOffsetHex: toHex32(symbol.addressOffset),
    physicalFileOffset: physical,
    physicalFileOffsetHex: toHex32(physical),
    entriesRequested: 256,
    entriesChecked: pattern.entriesChecked,
    matchingEntries: pattern.matchingEntries,
    mismatchCount: pattern.mismatchCount,
    firstMismatch: pattern.firstMismatch,
    patternVerified: pattern.patternVerified,
    classification: pattern.patternVerified ? 'VERIFIED' : pattern.entriesChecked < 256 ? 'TRUNCATED' : 'MISMATCH',
  };
}

export function validateRepeatedByteDwordTable(bytes: Uint8Array, requestedEntries = 256): {
  entriesChecked: number;
  matchingEntries: number;
  mismatchCount: number;
  firstMismatch: TupleTableValidation['firstMismatch'];
  patternVerified: boolean;
} {
  const entriesChecked = Math.min(requestedEntries, Math.floor(bytes.length / 4));
  let matchingEntries = 0;
  let firstMismatch: TupleTableValidation['firstMismatch'] = null;
  for (let i = 0; i < entriesChecked; i++) {
    const actual = (
      bytes[i * 4] |
      (bytes[i * 4 + 1] << 8) |
      (bytes[i * 4 + 2] << 16) |
      (bytes[i * 4 + 3] << 24)
    ) >>> 0;
    const expected = (i | (i << 8) | (i << 16) | (i << 24)) >>> 0;
    if (actual === expected) matchingEntries++;
    else if (!firstMismatch) {
      firstMismatch = { index: i, actual, actualHex: toHex32(actual), expected, expectedHex: toHex32(expected) };
    }
  }
  const mismatchCount = entriesChecked - matchingEntries;
  return {
    entriesChecked,
    matchingEntries,
    mismatchCount,
    firstMismatch,
    patternVerified: entriesChecked === requestedEntries && mismatchCount === 0,
  };
}

function collectRelatedSymbolMetadata(symbols: WatcomGlobalSymbol[]): RelatedWatcomSymbolMetadata[] {
  const names = new Set(['TRANSFER_PALETTES', 'WrtNonZero', 'ClpWrtNonZero', 'fWrtNonZero', 'fClpWrtNonZero']);
  return symbols
    .filter((s) => names.has(s.name))
    .map((s) => ({
      name: s.name,
      segment: s.segment,
      segmentHex: toHex16(s.segment),
      watcomOffset: s.addressOffset,
      watcomOffsetHex: toHex32(s.addressOffset),
      moduleIndex: s.moduleIndex,
      moduleName: s.resolvedModuleName ?? null,
      isCode: s.kindBits.isCode,
      isData: s.kindBits.isData,
      note: 'Original Watcom symbol metadata only; no code physical-address or semantic interpretation is performed in Pass 1E.3D.1.',
    }));
}

async function buildLegacyCatalogueComparison(
  source: DirectorySource,
  records: WatcomPaletteRecord[],
  kanoResult: AuthoritativeKanoResult | null,
): Promise<LegacyCatalogueComparisonEntry[]> {
  if (records.length === 0) return [];
  const scan = await scanExeForPalettes(source, {
    kanoStats: kanoResult?.aggregateStats,
  });
  const byOffset = new Map(scan.candidates.map((c) => [c.exeOffset, c]));
  return records.map((record) => {
    const candidate = byOffset.get(record.physicalFileOffset);
    return {
      recordIndex: record.recordIndex,
      physicalFileOffset: record.physicalFileOffset,
      physicalFileOffsetHex: record.physicalFileOffsetHex,
      symbolNames: record.symbolNames,
      foundByLegacyScanner: Boolean(candidate),
      legacyTier: candidate?.tier ?? null,
      legacyScore: candidate?.researchScore ?? null,
      legacyTextLikeScore: candidate?.textLikeScore ?? null,
      legacyContainsLikelyAsciiData: candidate?.containsLikelyAsciiData ?? null,
      legacyContentHash: candidate?.contentHash?.toUpperCase() ?? null,
      contentHashMatches: candidate ? candidate.contentHash.toUpperCase() === record.contentHash : null,
      legacyDuplicateContentOf: candidate?.duplicateContentOf ?? null,
    };
  });
}

export async function executeWatcomDataImagePaletteGroundTruth(
  source: DirectorySource,
  options?: { exePath?: string },
): Promise<MK1WatcomDataImagePaletteGroundTruthReport> {
  const operationId = createOperationId('watcom_palette_ground_truth');
  const exePath = options?.exePath ?? 'MK1.EXE';

  // Reuse the already-hardened 1E.3C.1 orchestration so the same real bytes provide
  // LE topology, permanent Watcom classes and provenance.
  const addressModel = await qualifyMK1WatcomAddressModel(source, { exePath });
  const provenance: FixtureProvenance = {
    ...addressModel.provenance,
    timestamp: new Date().toISOString(),
    operationId,
  };
  const exeSize = addressModel.fixture.exeSize;
  const addressModelPreflight = buildAddressModelPreflight(addressModel);

  const { evidence: handleTableAnchor } = await deriveHandleTableAnchor(source, { exePath });
  const symbols = addressModel.permanentClassesReport?.result.globalSymbols.symbols ?? [];
  const handleTableSymbol = locateWatcomHandleTableSymbol(symbols);
  const staticDataBaseQualification = qualifyStaticDataFileBase(handleTableAnchor, handleTableSymbol);
  const lePageMapComparison = buildLePageMapComparison(addressModel, handleTableSymbol, handleTableAnchor);

  const moduleSelection = selectExactPaletteModule(addressModel, 'NEWPALS.ASM');
  let paletteModule: WatcomPaletteModuleInfo | null = moduleSelection?.moduleInfo ?? null;
  let paletteRecords: WatcomPaletteRecord[] = [];
  let moduleTiling: PaletteModuleTilingResult | null = null;

  if (
    staticDataBaseQualification.status === 'QUALIFIED_STATIC_DATA_FILE_BASE' &&
    staticDataBaseQualification.qualifiedBase !== null &&
    moduleSelection
  ) {
    const qualified = await qualifyPaletteModuleRecords(
      source,
      exePath,
      exeSize,
      staticDataBaseQualification.qualifiedBase,
      moduleSelection,
    );
    paletteRecords = qualified.paletteRecords;
    moduleTiling = qualified.moduleTiling;
  }

  const paletteModuleVerified = moduleTiling?.exactTiling === true;
  const kanoP = paletteModuleVerified ? buildKanoDetail('KANO_P', paletteRecords) : null;
  const kano3P = paletteModuleVerified ? buildKanoDetail('KANO3_P', paletteRecords) : null;
  const adjacent = kanoP && kano3P
    ? kanoP.recordEnd === kano3P.physicalOffset || kano3P.recordEnd === kanoP.physicalOffset
    : null;

  let kanoResult: AuthoritativeKanoResult | null = null;
  let kanoPaletteComparison: KanoPaletteModelComparison | null = null;
  if (paletteModuleVerified && kanoP) {
    kanoResult = await getAuthoritativeKanoSprites(source);
    const kanoRecord = paletteRecords[kanoP.recordIndex];
    if (kanoResult && kanoRecord) kanoPaletteComparison = compareKanoPaletteToSprites(kanoRecord, kanoResult);
  }

  const tupleTableValidation = await validateTupleTable(
    source,
    exePath,
    exeSize,
    symbols,
    staticDataBaseQualification.qualifiedBase,
  );

  const legacyCatalogueComparison = paletteModuleVerified
    ? await buildLegacyCatalogueComparison(source, paletteRecords, kanoResult)
    : [];

  const relatedSymbolMetadata = collectRelatedSymbolMetadata(symbols);
  const staticDataBaseEstablished =
    staticDataBaseQualification.status === 'QUALIFIED_STATIC_DATA_FILE_BASE';
  const kanoPaletteIdentified = Boolean(kanoP);
  const success =
    staticDataBaseEstablished &&
    paletteModuleVerified &&
    addressModelPreflight.moduleRangeReconciliationConsistent;

  return {
    format: 'mk1_watcom_data_image_palette_ground_truth_v2',
    timestamp: provenance.timestamp,
    operationId,
    provenance,
    fixture: {
      exePath,
      exeSize,
      exeSizeHex: toHex32(exeSize),
    },
    addressModelPreflight,
    handleTableAnchor,
    handleTableSymbol,
    staticDataBaseQualification,
    lePageMapComparison,
    paletteModule,
    paletteRecords,
    moduleTiling,
    kanoPalettes: { kanoP, kano3P, adjacent },
    kanoPaletteComparison,
    tupleTableValidation,
    legacyCatalogueComparison,
    relatedSymbolMetadata,
    decision: {
      staticDataBaseEstablished,
      paletteModuleVerified,
      kanoPaletteIdentified,
      automaticOwnershipTracingSupported: false,
      verdict: success ? 'STRUCTURAL_GROUND_TRUTH_ESTABLISHED' : 'INCOMPLETE_GROUND_TRUTH',
      narrative: success
        ? 'Two independent fixture-derived anchors agree on the segment-2 static-data file-image base, and every unique NEWPALS.ASM DATA-symbol offset parses into a palette record that tiles the complete module span. This establishes structural palette ground truth; automatic ownership/selection tracing remains a later pass.'
        : 'The Pass 1E.3D.1 ground-truth contract did not fully qualify. No downstream palette ownership semantics should be promoted from this run.',
    },
    status: success ? 'SUCCESS' : handleTableAnchor.isAnchorVerified ? 'STRUCTURAL_ERROR' : 'MISSING_ANCHOR',
  };
}

export function createMK1WatcomDataImagePaletteGroundTruthExport(
  report: MK1WatcomDataImagePaletteGroundTruthReport,
): MK1WatcomDataImagePaletteGroundTruthExport {
  const prov = report.provenance;
  if (!isValidRealProvenance(prov)) {
    if (prov.synthetic) throw new Error('Synthetic fixtures cannot generate authoritative research artifacts');
    if (prov.artifactGeneratedByTest) throw new Error('Tests cannot generate authoritative research artifacts');
    throw new Error('Authoritative export requires authentic user-loaded provenance and valid non-zero SHA-256');
  }
  if (prov.byteLength !== report.fixture.exeSize) {
    throw new Error('Provenance byte length does not match executable size');
  }

  const q = report.staticDataBaseQualification;
  const tiling = report.moduleTiling;
  const checks = [
    {
      checkId: 'PROVENANCE_REAL_USER_LOADED',
      name: 'Fixture loaded from authentic user directory',
      passed: true,
      detail: `Source: ${prov.sourceKind}`,
    },
    {
      checkId: 'SHA256_VALID_HEX',
      name: 'Cryptographic SHA-256 present and non-zero',
      passed: true,
      detail: `SHA-256: ${prov.sha256}`,
    },
    {
      checkId: 'ADDRESS_MODEL_PREFLIGHT_CONSISTENT',
      name: '1E.3C.1 per-symbol/aggregate module reconciliation is internally consistent',
      passed: report.addressModelPreflight.moduleRangeReconciliationConsistent,
      detail: `runtimeAddressVerified=${report.addressModelPreflight.runtimeAddressVerified}`,
    },
    {
      checkId: 'HANDLE_TABLE_ANCHOR_VERIFIED',
      name: 'Independent handle-table/string-area anchor verified',
      passed: report.handleTableAnchor.isAnchorVerified,
      detail: `${report.handleTableAnchor.physicalStartHex}, string base ${report.handleTableAnchor.stringResolutionBaseHex ?? 'missing'}`,
    },
    {
      checkId: 'HANDLE_TABLE_SYMBOL_EXACT',
      name: 'Exactly one post-enumeration segment-2 DATA _handleTable symbol located',
      passed: Boolean(report.handleTableSymbol),
      detail: report.handleTableSymbol
        ? `${report.handleTableSymbol.watcomMapSegmentHex}:${report.handleTableSymbol.watcomMapOffsetHex}`
        : 'missing/ambiguous',
    },
    {
      checkId: 'STATIC_BASE_A_DERIVED',
      name: 'Method A static-data base derived from independent handle-table physical anchor',
      passed: q.candidateBaseA !== null,
      detail: q.candidateBaseAHex ?? 'unavailable',
    },
    {
      checkId: 'STATIC_BASE_B_DERIVED',
      name: 'Method B static-data base derived independently from executable filename/string area',
      passed: q.candidateBaseB !== null,
      detail: q.candidateBaseBHex ?? 'unavailable',
    },
    {
      checkId: 'STATIC_BASES_AGREE',
      name: 'Independent static-data base derivations agree exactly',
      passed: q.basesAgree,
      detail: `${q.candidateBaseAHex ?? 'A?'} vs ${q.candidateBaseBHex ?? 'B?'}`,
    },
    {
      checkId: 'HANDLE_TABLE_ANCHOR_ROUND_TRIP',
      name: 'Qualified base plus Watcom _handleTable offset reproduces physical table start',
      passed: q.anchorRoundTripPassed,
      detail: `status=${q.status}`,
    },
    {
      checkId: 'EXACT_NEWPALS_MODULE',
      name: 'Exact NEWPALS.ASM module selected after blind enumeration',
      passed: report.paletteModule !== null && normalizeModuleName(report.paletteModule.moduleName) === 'NEWPALS.ASM',
      detail: report.paletteModule?.moduleName ?? 'missing',
    },
    {
      checkId: 'EVERY_UNIQUE_NEWPALS_OFFSET_PARSED',
      name: 'Every unique NEWPALS DATA-symbol offset parsed as a structural palette record',
      passed: Boolean(tiling && tiling.parseFailures.length === 0 && tiling.parsedRecordCount === tiling.uniqueOffsetCount),
      detail: tiling ? `${tiling.parsedRecordCount}/${tiling.uniqueOffsetCount}` : 'not run',
    },
    {
      checkId: 'NEWPALS_EXACT_MODULE_TILING',
      name: 'Symbol-derived palette records tile the complete NEWPALS module without gaps/overlaps',
      passed: Boolean(tiling?.exactTiling),
      detail: tiling ? `gaps=${tiling.gapCount}, overlaps=${tiling.overlapCount}` : 'not run',
    },
  ];

  const allChecksPassed = checks.every((c) => c.passed);
  return {
    metadata: {
      name: 'MK1 Watcom Data-Image Base and Symbol-Derived Palette Ground Truth',
      version: '2.0.0',
      milestone: 'Pass 1E.3D.1',
      formatVersion: 'mk1_watcom_data_image_palette_ground_truth_v2',
      exportTimestamp: prov.timestamp,
    },
    provenance: prov,
    fixture: report.fixture,
    addressModelPreflight: report.addressModelPreflight,
    handleTableAnchor: report.handleTableAnchor,
    handleTableSymbol: report.handleTableSymbol,
    staticDataBaseQualification: report.staticDataBaseQualification,
    lePageMapComparison: report.lePageMapComparison,
    paletteModule: report.paletteModule,
    paletteRecords: report.paletteRecords,
    moduleTiling: report.moduleTiling,
    kanoPalettes: report.kanoPalettes,
    kanoPaletteComparison: report.kanoPaletteComparison,
    tupleTableValidation: report.tupleTableValidation,
    legacyCatalogueComparison: report.legacyCatalogueComparison,
    relatedSymbolMetadata: report.relatedSymbolMetadata,
    decision: report.decision,
    validation: { allChecksPassed, checks },
  };
}
