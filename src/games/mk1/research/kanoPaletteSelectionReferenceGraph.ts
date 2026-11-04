/**
 * MK1 Kano Palette Selection Reference Graph — Pass 1E.3E.
 *
 * Bounded question:
 *   What fixture-resident structures contain the verified KANO_P / KANO3_P
 *   Watcom data offsets, and are those structures referenced by executable
 *   operand shapes consistent with indexed palette-selection tables?
 *
 * Epistemic limits:
 * - 1E.3D.1 structural palette ground truth is a hard prerequisite.
 * - Exact DWORD equality is recorded before interpretation.
 * - Palette-table candidates are discovered from occurrences of verified palette
 *   offsets inside segment-2 static-data symbol intervals, not from symbol names.
 * - Original Watcom names are attached only after mechanical containment.
 * - A shared indexed code-use cluster proves common indexed access mechanics; it
 *   does NOT yet prove the gameplay state that selects one table versus another.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { fileOffsetToLoadedAddress } from '../../../core/executable/le/leAddressMap';
import { WatcomGlobalSymbol } from '../../../core/executable/watcomDebug/watcomPermanentClassTypes';
import { qualifyMK1WatcomAddressModel } from './watcomAddressModelInventory';
import {
  createMK1WatcomDataImagePaletteGroundTruthExport,
  executeWatcomDataImagePaletteGroundTruth,
} from './watcomDataImagePaletteGroundTruth';
import { MK1WatcomDataImagePaletteGroundTruthReport, WatcomPaletteRecord } from './watcomDataImagePaletteGroundTruthTypes';
import {
  ExactDwordReferenceOccurrence,
  IndexedTablePairCluster,
  MK1KanoPaletteSelectionReferenceGraphExport,
  MK1KanoPaletteSelectionReferenceGraphReport,
  PairedPaletteTableRelationship,
  PaletteReferenceTable,
  PaletteReferenceTableEntry,
  PaletteTargetEvidence,
  ReferenceOccurrenceClassification,
  StaticDataSymbolInterval,
  TableCodeReferenceSite,
} from './kanoPaletteSelectionReferenceGraphTypes';

function toHex32(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

function bytesHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

function readU32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

function isValidRealProvenance(p: MK1WatcomDataImagePaletteGroundTruthReport['provenance']): boolean {
  return (
    p.sourceKind === 'user-loaded-directory' &&
    p.synthetic === false &&
    p.artifactGeneratedByTest === false &&
    /^[0-9a-f]{64}$/.test(p.sha256) &&
    !/^0{64}$/.test(p.sha256)
  );
}

export function scanExactDwordValues(
  bytes: Uint8Array,
  targets: Map<number, string[]>,
): Array<{ offset: number; value: number; labels: string[] }> {
  const out: Array<{ offset: number; value: number; labels: string[] }> = [];
  for (let i = 0; i + 4 <= bytes.length; i++) {
    const value = readU32(bytes, i);
    const labels = targets.get(value);
    if (labels) out.push({ offset: i, value, labels });
  }
  return out;
}

interface OperandShape {
  classification: ReferenceOccurrenceClassification;
  instructionStart: number | null;
  decodedShape: string | null;
  indexRegister: string | null;
}

const REG32 = ['EAX', 'ECX', 'EDX', 'EBX', 'ESP', 'EBP', 'ESI', 'EDI'];

/**
 * Conservative local classifier. It only promotes encodings whose instruction
 * boundary is mechanically recoverable from bytes immediately preceding the
 * matched DWORD. Everything else stays OTHER_EXACT_DWORD.
 */
export function classifyExactDwordOperand(bytes: Uint8Array, matchOffset: number): OperandShape {
  if (matchOffset >= 1) {
    const op = bytes[matchOffset - 1];
    if (op >= 0xb8 && op <= 0xbf) {
      return {
        classification: 'X86_MOV_REG_IMM32',
        instructionStart: matchOffset - 1,
        decodedShape: `MOV ${REG32[op - 0xb8]}, imm32`,
        indexRegister: null,
      };
    }
    if (op === 0xe8 || op === 0xe9) {
      return {
        classification: 'REL32_COINCIDENCE',
        instructionStart: matchOffset - 1,
        decodedShape: op === 0xe8 ? 'CALL rel32 immediate coincidence' : 'JMP rel32 immediate coincidence',
        indexRegister: null,
      };
    }
    if (op === 0xa1 || op === 0xa3 || op === 0x68) {
      return {
        classification: 'X86_ABSOLUTE_DWORD_OPERAND',
        instructionStart: matchOffset - 1,
        decodedShape: op === 0xa1 ? 'MOV EAX,[moffs32]' : op === 0xa3 ? 'MOV [moffs32],EAX' : 'PUSH imm32',
        indexRegister: null,
      };
    }
  }

  // MOV/LEA r32, [index*4 + disp32] with no base: opcode modrm sib disp32.
  if (matchOffset >= 3) {
    const opcode = bytes[matchOffset - 3];
    const modrm = bytes[matchOffset - 2];
    const sib = bytes[matchOffset - 1];
    const mod = (modrm >> 6) & 3;
    const rm = modrm & 7;
    const sibBase = sib & 7;
    const sibIndex = (sib >> 3) & 7;
    const sibScale = 1 << ((sib >> 6) & 3);
    if ((opcode === 0x8b || opcode === 0x8d) && mod === 0 && rm === 4 && sibBase === 5 && sibIndex !== 4) {
      const dest = REG32[(modrm >> 3) & 7];
      const opName = opcode === 0x8b ? 'MOV' : 'LEA';
      return {
        classification: 'X86_INDEXED_DWORD_TABLE_LOAD',
        instructionStart: matchOffset - 3,
        decodedShape: `${opName} ${dest},[${REG32[sibIndex]}*${sibScale}+disp32]`,
        indexRegister: REG32[sibIndex],
      };
    }
  }

  // Direct disp32 memory operand: opcode modrm disp32 with mod=00 r/m=101.
  if (matchOffset >= 2) {
    const opcode = bytes[matchOffset - 2];
    const modrm = bytes[matchOffset - 1];
    const mod = (modrm >> 6) & 3;
    const rm = modrm & 7;
    if ((opcode === 0x8b || opcode === 0x89 || opcode === 0x8d) && mod === 0 && rm === 5) {
      return {
        classification: 'X86_ABSOLUTE_DWORD_OPERAND',
        instructionStart: matchOffset - 2,
        decodedShape: `${opcode === 0x8b ? 'MOV load' : opcode === 0x89 ? 'MOV store' : 'LEA'} disp32`,
        indexRegister: null,
      };
    }
  }

  return {
    classification: 'OTHER_EXACT_DWORD',
    instructionStart: null,
    decodedShape: null,
    indexRegister: null,
  };
}

function buildModuleSpanMap(symbolsResult: any): Map<string, Array<{ start: number; end: number }>> {
  const map = new Map<string, Array<{ start: number; end: number }>>();
  for (const record of symbolsResult.addressInfo.segmentRecords) {
    let cursor = record.startAddressOffset;
    for (const entry of record.entries) {
      const key = `${record.segment}:${entry.moduleIndex}`;
      const list = map.get(key) ?? [];
      list.push({ start: cursor, end: cursor + entry.size });
      map.set(key, list);
      cursor += entry.size;
    }
  }
  return map;
}

/** Build symbol intervals without assigning semantics to the symbol name. */
export function buildStaticDataSymbolIntervals(permanentResult: any): StaticDataSymbolInterval[] {
  const spans = buildModuleSpanMap(permanentResult);
  const validData = (permanentResult.globalSymbols.symbols as WatcomGlobalSymbol[])
    .filter((s) => s.valid && s.segment === 2 && s.kindBits.isData)
    .slice()
    .sort((a, b) => a.moduleIndex - b.moduleIndex || a.addressOffset - b.addressOffset || a.globalIndex - b.globalIndex);

  const byModule = new Map<number, WatcomGlobalSymbol[]>();
  for (const s of validData) {
    const list = byModule.get(s.moduleIndex) ?? [];
    list.push(s);
    byModule.set(s.moduleIndex, list);
  }

  const out: StaticDataSymbolInterval[] = [];
  for (const [moduleIndex, moduleSymbols] of byModule) {
    const moduleSpans = spans.get(`2:${moduleIndex}`) ?? [];
    for (const span of moduleSpans) {
      const inSpan = moduleSymbols.filter((s) => s.addressOffset >= span.start && s.addressOffset <= span.end);
      const uniqueStarts = Array.from(new Set(inSpan.map((s) => s.addressOffset))).sort((a, b) => a - b);
      for (const start of uniqueStarts) {
        const aliases = inSpan.filter((s) => s.addressOffset === start).sort((a, b) => a.globalIndex - b.globalIndex);
        const canonical = aliases[0];
        const next = uniqueStarts.find((v) => v > start) ?? span.end;
        if (!canonical || next < start) continue;
        out.push({
          moduleIndex,
          moduleName: canonical.resolvedModuleName ?? null,
          symbolName: canonical.name,
          symbolGlobalIndex: canonical.globalIndex,
          segment: 2,
          startOffset: start,
          startOffsetHex: toHex32(start),
          endOffset: next,
          endOffsetHex: toHex32(next),
          byteLength: next - start,
        });
      }
    }
  }
  return out.sort((a, b) => a.startOffset - b.startOffset || a.moduleIndex - b.moduleIndex);
}

function findContainingInterval(intervals: StaticDataSymbolInterval[], offset: number): StaticDataSymbolInterval | null {
  const matches = intervals.filter((i) => offset >= i.startOffset && offset < i.endOffset);
  if (matches.length === 0) return null;
  // Prefer the narrowest interval if overlapping address-info module spans ever exist.
  return matches.sort((a, b) => a.byteLength - b.byteLength)[0];
}

function findRegion(layout: any, offset: number): any | null {
  return layout.topology.regions.find((r: any) => offset >= r.fileStart && offset < r.fileEnd) ?? null;
}

function buildOccurrence(
  bytes: Uint8Array,
  offset: number,
  targetLabel: string,
  targetValue: number,
  qualifiedBase: number,
  intervals: StaticDataSymbolInterval[],
  layout: any,
  debugStart: number | null,
): ExactDwordReferenceOccurrence {
  const staticOffset = offset >= qualifiedBase ? offset - qualifiedBase : null;
  const containingStaticSymbol = staticOffset === null ? null : findContainingInterval(intervals, staticOffset);
  let shape = classifyExactDwordOperand(bytes, offset);

  if (debugStart !== null && offset >= debugStart) {
    shape = { classification: 'WATCOM_DEBUG_TAIL', instructionStart: null, decodedShape: null, indexRegister: null };
  } else if (containingStaticSymbol) {
    shape = { classification: 'STATIC_DATA_SYMBOL_MEMBER', instructionStart: null, decodedShape: null, indexRegister: null };
  }

  const instructionStart = shape.instructionStart;
  const loadedCandidates = instructionStart === null
    ? []
    : fileOffsetToLoadedAddress(instructionStart, layout.objects, layout.parsedHeader?.pageSize ?? 4096);
  const loaded = loadedCandidates.length === 1 ? loadedCandidates[0] : null;
  const region = findRegion(layout, instructionStart ?? offset);
  const contextStart = Math.max(0, offset - 12);
  const contextEnd = Math.min(bytes.length, offset + 16);

  return {
    targetLabel,
    targetValue,
    targetValueHex: toHex32(targetValue),
    physicalFileOffset: offset,
    physicalFileOffsetHex: toHex32(offset),
    classification: shape.classification,
    instructionStartPhysicalOffset: instructionStart,
    instructionStartPhysicalOffsetHex: instructionStart === null ? null : toHex32(instructionStart),
    instructionLoadedAddress: loaded?.linearAddressCandidate ?? null,
    instructionLoadedAddressHex: loaded?.linearAddressCandidateHex ?? null,
    decodedShape: shape.decodedShape,
    indexRegister: shape.indexRegister,
    mappedLeObjectNumber: loaded?.objectNumber ?? null,
    mappedLeObjectCapabilities: loaded?.objectCapabilities ?? null,
    executableRegionId: region?.regionId ?? null,
    executableRegionClass: region?.regionClass ?? null,
    staticDataWatcomOffset: staticOffset,
    staticDataWatcomOffsetHex: staticOffset === null ? null : toHex32(staticOffset),
    containingStaticSymbol,
    contextStart,
    contextStartHex: toHex32(contextStart),
    contextBytesHex: bytesHex(bytes.slice(contextStart, contextEnd)),
  };
}

function parseReferenceTable(
  bytes: Uint8Array,
  qualifiedBase: number,
  interval: StaticDataSymbolInterval,
  recordsByWatcomOffset: Map<number, WatcomPaletteRecord>,
  kanoPValue: number,
  kano3PValue: number,
): PaletteReferenceTable | null {
  if (interval.byteLength < 4 || interval.byteLength % 4 !== 0 || interval.byteLength > 4096) return null;
  const physical = qualifiedBase + interval.startOffset;
  if (physical < 0 || physical + interval.byteLength > bytes.length) return null;
  const dwordCount = interval.byteLength / 4;
  const entries: PaletteReferenceTableEntry[] = [];
  let verifiedPaletteReferenceCount = 0;
  const kanoPSlots: number[] = [];
  const kano3PSlots: number[] = [];
  for (let i = 0; i < dwordCount; i++) {
    const value = readU32(bytes, physical + i * 4);
    const record = recordsByWatcomOffset.get(value) ?? null;
    if (record) verifiedPaletteReferenceCount++;
    if (value === kanoPValue) kanoPSlots.push(i);
    if (value === kano3PValue) kano3PSlots.push(i);
    entries.push({
      slotIndex: i,
      rawValue: value,
      rawValueHex: toHex32(value),
      paletteRecordIndex: record?.recordIndex ?? null,
      paletteSymbolNames: record?.symbolNames ?? [],
      isVerifiedPaletteStart: Boolean(record),
    });
  }
  return {
    symbol: interval,
    physicalStart: physical,
    physicalStartHex: toHex32(physical),
    dwordCount,
    entries,
    verifiedPaletteReferenceCount,
    allEntriesVerifiedPaletteStarts: verifiedPaletteReferenceCount === dwordCount,
    kanoPSlots,
    kano3PSlots,
  };
}

export function choosePairedPaletteTables(tables: PaletteReferenceTable[]): PairedPaletteTableRelationship | null {
  const aCandidates = tables.filter((t) => t.kanoPSlots.length > 0 && t.kano3PSlots.length === 0);
  const bCandidates = tables.filter((t) => t.kano3PSlots.length > 0 && t.kanoPSlots.length === 0);
  let best: { a: PaletteReferenceTable; b: PaletteReferenceTable; score: number } | null = null;
  for (const a of aCandidates) {
    for (const b of bCandidates) {
      const sameCount = a.dwordCount === b.dwordCount;
      const aligned = a.kanoPSlots.length === 1 && b.kano3PSlots.length === 1 && a.kanoPSlots[0] === b.kano3PSlots[0];
      const all = a.allEntriesVerifiedPaletteStarts && b.allEntriesVerifiedPaletteStarts;
      const score = (sameCount ? 1000 : 0) + (aligned ? 1000 : 0) + (all ? 1000 : 0) + Math.min(a.dwordCount, b.dwordCount);
      if (!best || score > best.score) best = { a, b, score };
    }
  }
  if (!best) return null;
  const { a, b } = best;
  const sameDwordCount = a.dwordCount === b.dwordCount;
  const kanoSlotAligned = a.kanoPSlots.length === 1 && b.kano3PSlots.length === 1 && a.kanoPSlots[0] === b.kano3PSlots[0];
  const allEntriesPaletteReferences = a.allEntriesVerifiedPaletteStarts && b.allEntriesVerifiedPaletteStarts;
  const count = Math.min(a.entries.length, b.entries.length);
  const correspondingSlotPairs = Array.from({ length: count }, (_, slotIndex) => ({
    slotIndex,
    tableASymbolNames: a.entries[slotIndex].paletteSymbolNames,
    tableBSymbolNames: b.entries[slotIndex].paletteSymbolNames,
  }));
  return {
    tableA: a.symbol.symbolName,
    tableB: b.symbol.symbolName,
    tableAWatcomOffset: a.symbol.startOffset,
    tableBWatcomOffset: b.symbol.startOffset,
    sameDwordCount,
    dwordCount: sameDwordCount ? a.dwordCount : count,
    kanoSlotAligned,
    kanoSlotIndex: kanoSlotAligned ? a.kanoPSlots[0] : null,
    allEntriesPaletteReferences,
    correspondingSlotPairs,
    classification: sameDwordCount && kanoSlotAligned && allEntriesPaletteReferences
      ? 'VERIFIED_PARALLEL_PALETTE_TABLES'
      : 'PARTIAL_RELATIONSHIP',
  };
}

function tableCodeSites(
  bytes: Uint8Array,
  table: PaletteReferenceTable,
  layout: any,
  debugStart: number | null,
): TableCodeReferenceSite[] {
  const target = table.symbol.startOffset >>> 0;
  const hits = scanExactDwordValues(bytes, new Map([[target, [table.symbol.symbolName]]]));
  return hits.map((hit) => {
    let shape = classifyExactDwordOperand(bytes, hit.offset);
    if (debugStart !== null && hit.offset >= debugStart) {
      shape = { classification: 'WATCOM_DEBUG_TAIL', instructionStart: null, decodedShape: null, indexRegister: null };
    }
    const loadedCandidates = shape.instructionStart === null
      ? []
      : fileOffsetToLoadedAddress(shape.instructionStart, layout.objects, layout.parsedHeader?.pageSize ?? 4096);
    const loaded = loadedCandidates.length === 1 ? loadedCandidates[0] : null;
    const region = findRegion(layout, shape.instructionStart ?? hit.offset);
    const c0 = Math.max(0, hit.offset - 12);
    const c1 = Math.min(bytes.length, hit.offset + 16);
    return {
      tableSymbolName: table.symbol.symbolName,
      tableWatcomOffset: table.symbol.startOffset,
      tableWatcomOffsetHex: table.symbol.startOffsetHex,
      physicalFileOffset: hit.offset,
      physicalFileOffsetHex: toHex32(hit.offset),
      classification: shape.classification,
      instructionStartPhysicalOffset: shape.instructionStart,
      instructionStartPhysicalOffsetHex: shape.instructionStart === null ? null : toHex32(shape.instructionStart),
      instructionLoadedAddress: loaded?.linearAddressCandidate ?? null,
      instructionLoadedAddressHex: loaded?.linearAddressCandidateHex ?? null,
      decodedShape: shape.decodedShape,
      indexRegister: shape.indexRegister,
      mappedLeObjectNumber: loaded?.objectNumber ?? null,
      executableRegionId: region?.regionId ?? null,
      executableRegionClass: region?.regionClass ?? null,
      contextBytesHex: bytesHex(bytes.slice(c0, c1)),
    };
  });
}

export function buildIndexedTablePairClusters(
  sites: TableCodeReferenceSite[],
  paired: PairedPaletteTableRelationship | null,
  maxDistance = 128,
): IndexedTablePairCluster[] {
  if (!paired) return [];
  const a = sites.filter((s) => s.tableSymbolName === paired.tableA && s.classification === 'X86_INDEXED_DWORD_TABLE_LOAD');
  const b = sites.filter((s) => s.tableSymbolName === paired.tableB && s.classification === 'X86_INDEXED_DWORD_TABLE_LOAD');
  const out: IndexedTablePairCluster[] = [];
  for (const x of a) {
    for (const y of b) {
      const distance = Math.abs(x.physicalFileOffset - y.physicalFileOffset);
      if (distance > maxDistance || !x.indexRegister || !y.indexRegister) continue;
      const sameIndexRegister = x.indexRegister === y.indexRegister;
      out.push({
        firstTableSymbolName: x.tableSymbolName,
        secondTableSymbolName: y.tableSymbolName,
        firstSitePhysicalOffset: x.physicalFileOffset,
        firstSitePhysicalOffsetHex: x.physicalFileOffsetHex,
        secondSitePhysicalOffset: y.physicalFileOffset,
        secondSitePhysicalOffsetHex: y.physicalFileOffsetHex,
        physicalDistance: distance,
        indexRegister: sameIndexRegister ? x.indexRegister : `${x.indexRegister}/${y.indexRegister}`,
        sameIndexRegister,
        bothIndexedDwordLoads: true,
        classification: sameIndexRegister ? 'VERIFIED_SHARED_INDEX_TABLE_CLUSTER' : 'PARTIAL_CLUSTER',
      });
    }
  }
  return out.sort((x, y) => x.physicalDistance - y.physicalDistance);
}

function targetFromRecord(name: string, record: WatcomPaletteRecord): PaletteTargetEvidence {
  return {
    symbolName: name,
    watcomOffset: record.watcomStartOffset,
    watcomOffsetHex: record.watcomStartOffsetHex,
    physicalOffset: record.physicalFileOffset,
    physicalOffsetHex: record.physicalFileOffsetHex,
    declaredLength: record.declaredLength,
    recordIndex: record.recordIndex,
  };
}

export async function executeKanoPaletteSelectionReferenceGraph(
  source: DirectorySource,
  options?: {
    exePath?: string;
    onProgress?: (stage: string, progress: number) => void;
    /** In-process prerequisite result for dependency-aware UI orchestration. Must pass its own authoritative export validation. */
    groundTruthReport?: MK1WatcomDataImagePaletteGroundTruthReport;
  },
): Promise<MK1KanoPaletteSelectionReferenceGraphReport> {
  const operationId = createOperationId('kano_palette_reference_graph');
  const exePath = options?.exePath ?? 'MK1.EXE';
  options?.onProgress?.('Running verified palette-ground-truth prerequisite', 0.05);

  const groundTruth = options?.groundTruthReport ?? await executeWatcomDataImagePaletteGroundTruth(source, { exePath });
  const groundExport = createMK1WatcomDataImagePaletteGroundTruthExport(groundTruth);
  const prerequisitePassed =
    groundTruth.status === 'SUCCESS' &&
    groundExport.validation.allChecksPassed &&
    groundTruth.decision.staticDataBaseEstablished &&
    groundTruth.decision.paletteModuleVerified &&
    groundTruth.decision.kanoPaletteIdentified;

  if (!prerequisitePassed || groundTruth.staticDataBaseQualification.qualifiedBase === null) {
    throw new Error('Pass 1E.3E requires a successful authoritative Pass 1E.3D.1 ground-truth run.');
  }

  const kanoPRecord = groundTruth.paletteRecords.find((r) => r.symbolNames.includes('KANO_P'));
  const kano3PRecord = groundTruth.paletteRecords.find((r) => r.symbolNames.includes('KANO3_P'));
  if (!kanoPRecord || !kano3PRecord) {
    throw new Error('Pass 1E.3E cannot continue without uniquely recovered KANO_P and KANO3_P records.');
  }

  options?.onProgress?.('Enumerating Watcom symbols and LE topology', 0.35);
  const addressModel = await qualifyMK1WatcomAddressModel(source, { exePath });
  const permanent = addressModel.permanentClassesReport?.result;
  const layout = addressModel.layoutReport;
  if (!permanent || !layout || addressModel.status !== 'SUCCESS') {
    throw new Error('Pass 1E.3E requires successful Watcom permanent-class and LE topology evidence.');
  }

  const exeSize = groundTruth.fixture.exeSize;
  const bytes = await source.readSlice(exePath, 0, exeSize);
  if (bytes.length !== exeSize) throw new Error(`Could not read complete ${exePath}; got ${bytes.length}/${exeSize} bytes.`);
  const qualifiedBase = groundTruth.staticDataBaseQualification.qualifiedBase;
  const intervals = buildStaticDataSymbolIntervals(permanent);
  const debugStart = addressModel.permanentClassesReport?.discoveryReport.discovery.containerPhysicalStart ?? null;

  const targets = new Map<number, string[]>([
    [kanoPRecord.watcomStartOffset, ['KANO_P']],
    [kano3PRecord.watcomStartOffset, ['KANO3_P']],
  ]);
  options?.onProgress?.('Scanning exact Kano palette-offset occurrences', 0.55);
  const directHits = scanExactDwordValues(bytes, targets);
  const directPaletteValueOccurrences: ExactDwordReferenceOccurrence[] = [];
  for (const hit of directHits) {
    for (const label of hit.labels) {
      directPaletteValueOccurrences.push(
        buildOccurrence(bytes, hit.offset, label, hit.value, qualifiedBase, intervals, layout, debugStart),
      );
    }
  }

  const recordsByWatcomOffset = new Map(groundTruth.paletteRecords.map((r) => [r.watcomStartOffset, r]));
  const candidateIntervals = new Map<string, StaticDataSymbolInterval>();
  for (const occurrence of directPaletteValueOccurrences) {
    const i = occurrence.containingStaticSymbol;
    if (!i) continue;
    candidateIntervals.set(`${i.moduleIndex}:${i.startOffset}`, i);
  }

  const containingReferenceTables: PaletteReferenceTable[] = [];
  for (const interval of candidateIntervals.values()) {
    const table = parseReferenceTable(
      bytes,
      qualifiedBase,
      interval,
      recordsByWatcomOffset,
      kanoPRecord.watcomStartOffset,
      kano3PRecord.watcomStartOffset,
    );
    if (table && (table.kanoPSlots.length > 0 || table.kano3PSlots.length > 0)) containingReferenceTables.push(table);
  }
  containingReferenceTables.sort((a, b) => a.symbol.startOffset - b.symbol.startOffset);

  const pairedPaletteTableRelationship = choosePairedPaletteTables(containingReferenceTables);
  options?.onProgress?.('Tracing executable uses of mechanically discovered palette tables', 0.78);
  const tableCodeReferenceSites: TableCodeReferenceSite[] = [];
  if (pairedPaletteTableRelationship) {
    const names = new Set([pairedPaletteTableRelationship.tableA, pairedPaletteTableRelationship.tableB]);
    for (const table of containingReferenceTables.filter((t) => names.has(t.symbol.symbolName))) {
      tableCodeReferenceSites.push(...tableCodeSites(bytes, table, layout, debugStart));
    }
  }
  tableCodeReferenceSites.sort((a, b) => a.physicalFileOffset - b.physicalFileOffset);
  const indexedTablePairClusters = buildIndexedTablePairClusters(tableCodeReferenceSites, pairedPaletteTableRelationship);

  const paletteSelectionTablesEstablished =
    pairedPaletteTableRelationship?.classification === 'VERIFIED_PARALLEL_PALETTE_TABLES';
  const kanoSlotRelationshipEstablished = Boolean(
    paletteSelectionTablesEstablished && pairedPaletteTableRelationship?.kanoSlotAligned,
  );
  const sharedIndexedCodeUseEstablished = indexedTablePairClusters.some(
    (c) => c.classification === 'VERIFIED_SHARED_INDEX_TABLE_CLUSTER',
  );
  const success = paletteSelectionTablesEstablished && kanoSlotRelationshipEstablished && sharedIndexedCodeUseEstablished;
  const timestamp = new Date().toISOString();

  options?.onProgress?.('Reference graph complete', 1);
  return {
    format: 'mk1_kano_palette_selection_reference_graph_v1',
    timestamp,
    operationId,
    provenance: { ...groundTruth.provenance, timestamp, operationId },
    fixture: {
      exePath,
      exeSize,
      exeSizeHex: toHex32(exeSize),
    },
    prerequisite: {
      pass: '1E.3D.1',
      groundTruthStatus: groundTruth.status,
      staticDataBaseEstablished: groundTruth.decision.staticDataBaseEstablished,
      paletteModuleVerified: groundTruth.decision.paletteModuleVerified,
      kanoPaletteIdentified: groundTruth.decision.kanoPaletteIdentified,
      validationPassed: groundExport.validation.allChecksPassed,
    },
    paletteTargets: {
      kanoP: targetFromRecord('KANO_P', kanoPRecord),
      kano3P: targetFromRecord('KANO3_P', kano3PRecord),
    },
    directPaletteValueOccurrences,
    containingReferenceTables,
    pairedPaletteTableRelationship,
    tableCodeReferenceSites,
    indexedTablePairClusters,
    decision: {
      paletteSelectionTablesEstablished,
      kanoSlotRelationshipEstablished,
      sharedIndexedCodeUseEstablished,
      specificGameplayTriggerEstablished: false,
      verdict: success ? 'PALETTE_SELECTION_REFERENCE_GRAPH_ESTABLISHED' : 'PARTIAL_REFERENCE_GRAPH',
      narrative: success
        ? 'Verified KANO_P and KANO3_P offsets occur in two same-length, all-palette static-data tables at the same slot, and both table bases participate in at least one nearby x86 indexed-DWORD-load cluster using the same index register. This establishes a structural palette-selection reference graph. The gameplay condition that chooses one table remains unresolved.'
        : 'Pass 1E.3E recovered reference evidence but did not satisfy every structural graph invariant. No gameplay-selection semantics should be promoted.',
    },
    status: success ? 'SUCCESS' : 'PARTIAL',
  };
}

export function createMK1KanoPaletteSelectionReferenceGraphExport(
  report: MK1KanoPaletteSelectionReferenceGraphReport,
): MK1KanoPaletteSelectionReferenceGraphExport {
  if (!isValidRealProvenance(report.provenance)) {
    throw new Error('Authoritative 1E.3E export requires authentic user-loaded provenance and a valid non-zero SHA-256.');
  }

  const pair = report.pairedPaletteTableRelationship;
  const checks = [
    {
      checkId: 'PROVENANCE_REAL_USER_LOADED',
      name: 'Fixture loaded from authentic user directory',
      passed: true,
      detail: `${report.provenance.fileName} ${report.provenance.sha256}`,
    },
    {
      checkId: 'GROUND_TRUTH_PREREQUISITE',
      name: 'Authoritative Pass 1E.3D.1 prerequisite passed',
      passed: report.prerequisite.validationPassed && report.prerequisite.paletteModuleVerified,
      detail: `status=${report.prerequisite.groundTruthStatus}`,
    },
    {
      checkId: 'PALETTE_TARGETS_PRESENT',
      name: 'Verified KANO_P and KANO3_P targets present',
      passed: report.paletteTargets.kanoP.declaredLength > 0 && report.paletteTargets.kano3P.declaredLength > 0,
      detail: `${report.paletteTargets.kanoP.watcomOffsetHex} / ${report.paletteTargets.kano3P.watcomOffsetHex}`,
    },
    {
      checkId: 'PARALLEL_PALETTE_TABLES',
      name: 'Mechanically discovered corresponding palette tables are fully palette-backed',
      passed: pair?.classification === 'VERIFIED_PARALLEL_PALETTE_TABLES',
      detail: pair ? `${pair.tableA} / ${pair.tableB}, slots=${pair.dwordCount}` : 'not established',
    },
    {
      checkId: 'KANO_SLOT_ALIGNED',
      name: 'KANO_P and KANO3_P occupy the same corresponding table slot',
      passed: pair?.kanoSlotAligned === true,
      detail: pair?.kanoSlotIndex === null || pair?.kanoSlotIndex === undefined ? 'not established' : `slot=${pair.kanoSlotIndex}`,
    },
    {
      checkId: 'SHARED_INDEXED_CODE_USE',
      name: 'At least one nearby indexed-DWORD-load cluster references both paired tables using the same index register',
      passed: report.indexedTablePairClusters.some((c) => c.classification === 'VERIFIED_SHARED_INDEX_TABLE_CLUSTER'),
      detail: `${report.indexedTablePairClusters.filter((c) => c.classification === 'VERIFIED_SHARED_INDEX_TABLE_CLUSTER').length} verified cluster(s)`,
    },
  ];
  const allChecksPassed = checks.every((c) => c.passed);
  return {
    metadata: {
      name: 'MK1 Kano Palette Selection Reference Graph',
      version: '1.0.0',
      milestone: 'Pass 1E.3E',
      formatVersion: 'mk1_kano_palette_selection_reference_graph_v1',
      exportTimestamp: report.timestamp,
    },
    provenance: report.provenance,
    fixture: report.fixture,
    prerequisite: report.prerequisite,
    paletteTargets: report.paletteTargets,
    directPaletteValueOccurrences: report.directPaletteValueOccurrences,
    containingReferenceTables: report.containingReferenceTables,
    pairedPaletteTableRelationship: report.pairedPaletteTableRelationship,
    tableCodeReferenceSites: report.tableCodeReferenceSites,
    indexedTablePairClusters: report.indexedTablePairClusters,
    decision: report.decision,
    validation: { allChecksPassed, checks },
  };
}
