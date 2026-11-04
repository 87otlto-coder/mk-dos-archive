/**
 * MK1 palette-selection semantics — Pass 1E.3F.
 *
 * Bounded question:
 *   What exact state transition chooses the verified normal/alternate palette
 *   tables discovered in 1E.3E, and what does their common downstream call do?
 *
 * Discovery discipline:
 * - 1E.3E is a hard prerequisite and supplies the paired tables + indexed cluster.
 * - The Segment-1 code file-image base is derived mechanically from coroutine
 *   continuation patterns in a bounded window around that cluster.
 * - Watcom names are attached only after the code/data coordinates are derived.
 * - The state-machine opcode shape is matched from the fixture; state symbol
 *   names are resolved afterward from the blind Watcom inventory.
 * - MULTI_SWPAL / GETPAL / FREEPAL / PALSET names are post-derivation labels.
 * - TRANSFER_PALETTES / IRQSKYE / renderer semantics are deliberately deferred.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { WatcomGlobalSymbol } from '../../../core/executable/watcomDebug/watcomPermanentClassTypes';
import { qualifyMK1WatcomAddressModel } from './watcomAddressModelInventory';
import {
  createMK1KanoPaletteSelectionReferenceGraphExport,
  executeKanoPaletteSelectionReferenceGraph,
} from './kanoPaletteSelectionReferenceGraph';
import { MK1KanoPaletteSelectionReferenceGraphReport } from './kanoPaletteSelectionReferenceGraphTypes';
import {
  CodeContinuationAnchor,
  CodeImageBaseQualification,
  GetPalEvidence,
  MK1KanoPaletteSelectionSemanticsExport,
  MK1KanoPaletteSelectionSemanticsReport,
  MultiSwpalEvidence,
  PaletteSelectionStateMachine,
  ResolvedWatcomCodeSymbol,
  ResolvedWatcomDataSymbol,
  SelectionMachineInstruction,
  SelectionStateTransition,
  SymbolNeighborhoodValidation,
  StaticCodeDataImageLayoutCrossCheck,
} from './kanoPaletteSelectionSemanticsTypes';

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

function readI32(bytes: Uint8Array, offset: number): number {
  return (readU32(bytes, offset) | 0);
}

function i8(value: number): number {
  return value & 0x80 ? value - 0x100 : value;
}

function alignUp(value: number, alignment: number): number {
  if (alignment <= 0) return value;
  return Math.ceil(value / alignment) * alignment;
}

function rel32Target(bytes: Uint8Array, instructionOffset: number): number {
  return instructionOffset + 5 + readI32(bytes, instructionOffset + 1);
}

function rel8Target(bytes: Uint8Array, instructionOffset: number): number {
  return instructionOffset + 2 + i8(bytes[instructionOffset + 1]);
}

function isValidRealProvenance(p: MK1KanoPaletteSelectionReferenceGraphReport['provenance']): boolean {
  return (
    p.sourceKind === 'user-loaded-directory' &&
    p.synthetic === false &&
    p.artifactGeneratedByTest === false &&
    /^[0-9a-f]{64}$/.test(p.sha256) &&
    !/^0{64}$/.test(p.sha256)
  );
}

/**
 * Scan a bounded physical window for the coroutine continuation shape:
 *   LEA EBP,[EBP-4]
 *   MOV [EBP], imm32
 *   JMP rel32
 * The stored imm32 is treated only as a candidate code coordinate. Agreement of
 * three or more physical-fallthrough-minus-imm32 deltas qualifies a local code
 * file-image base.
 */
export function scanCodeContinuationAnchors(
  bytes: Uint8Array,
  windowStart: number,
  windowEnd: number,
): CodeContinuationAnchor[] {
  const out: CodeContinuationAnchor[] = [];
  const start = Math.max(0, windowStart);
  const end = Math.min(bytes.length, windowEnd);
  for (let p = start; p + 15 <= end; p++) {
    if (
      bytes[p] !== 0x8d || bytes[p + 1] !== 0x6d || bytes[p + 2] !== 0xfc ||
      bytes[p + 3] !== 0xc7 || bytes[p + 4] !== 0x45 || bytes[p + 5] !== 0x00 ||
      bytes[p + 10] !== 0xe9
    ) continue;
    const storedCodeOffset = readU32(bytes, p + 6);
    const continuationPhysicalOffset = p + 15;
    if (storedCodeOffset > continuationPhysicalOffset) continue;
    const candidateCodeImageBase = continuationPhysicalOffset - storedCodeOffset;
    out.push({
      patternStartPhysicalOffset: p,
      patternStartPhysicalOffsetHex: toHex32(p),
      continuationPhysicalOffset,
      continuationPhysicalOffsetHex: toHex32(continuationPhysicalOffset),
      storedCodeOffset,
      storedCodeOffsetHex: toHex32(storedCodeOffset),
      candidateCodeImageBase,
      candidateCodeImageBaseHex: toHex32(candidateCodeImageBase),
    });
  }
  return out;
}

export function qualifyCodeImageBase(
  anchors: CodeContinuationAnchor[],
  windowStart: number,
  windowEnd: number,
  minimumAgreeingAnchors = 3,
): CodeImageBaseQualification {
  const counts = new Map<number, number>();
  for (const a of anchors) counts.set(a.candidateCodeImageBase, (counts.get(a.candidateCodeImageBase) ?? 0) + 1);
  const ranked = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const top = ranked[0] ?? null;
  const tiedTop = top ? ranked.filter(([, count]) => count === top[1]) : [];
  const qualifiedBase = top && top[1] >= minimumAgreeingAnchors && tiedTop.length === 1 ? top[0] : null;
  return {
    scanWindowStart: windowStart,
    scanWindowStartHex: toHex32(windowStart),
    scanWindowEnd: windowEnd,
    scanWindowEndHex: toHex32(windowEnd),
    anchors,
    agreeingAnchorCount: qualifiedBase === null ? (top?.[1] ?? 0) : (counts.get(qualifiedBase) ?? 0),
    distinctCandidateBases: ranked.map(([base]) => base),
    distinctCandidateBasesHex: ranked.map(([base]) => toHex32(base)),
    qualifiedBase,
    qualifiedBaseHex: qualifiedBase === null ? null : toHex32(qualifiedBase),
    status: qualifiedBase !== null
      ? 'QUALIFIED_CODE_FILE_IMAGE_BASE'
      : top && top[1] >= minimumAgreeingAnchors
        ? 'AMBIGUOUS_BASE'
        : 'INSUFFICIENT_ANCHORS',
  };
}

function sortedCodeSymbols(permanent: any): WatcomGlobalSymbol[] {
  return (permanent.globalSymbols.symbols as WatcomGlobalSymbol[])
    .filter((s) => s.valid && s.segment === 1 && s.kindBits.isCode)
    .slice()
    .sort((a, b) => a.addressOffset - b.addressOffset || a.globalIndex - b.globalIndex);
}

function resolveCodeSymbolAtWatcomOffset(
  permanent: any,
  codeBase: number,
  watcomOffset: number,
  exactOnly = false,
): ResolvedWatcomCodeSymbol | null {
  const symbols = sortedCodeSymbols(permanent);
  let selected: WatcomGlobalSymbol | null = null;
  let selectedIndex = -1;
  for (let i = 0; i < symbols.length; i++) {
    const s = symbols[i];
    if (exactOnly ? s.addressOffset === watcomOffset : s.addressOffset <= watcomOffset) {
      if (exactOnly && s.addressOffset === watcomOffset) { selected = s; selectedIndex = i; break; }
      if (!exactOnly) { selected = s; selectedIndex = i; }
    }
    if (s.addressOffset > watcomOffset) break;
  }
  if (!selected || selectedIndex < 0) return null;
  const next = symbols.slice(selectedIndex + 1).find((s) => s.addressOffset > selected!.addressOffset);
  const end = next?.addressOffset ?? selected.addressOffset;
  if (!exactOnly && (watcomOffset < selected.addressOffset || (next && watcomOffset >= next.addressOffset))) return null;
  return {
    name: selected.name,
    moduleIndex: selected.moduleIndex,
    moduleName: selected.resolvedModuleName ?? null,
    watcomStartOffset: selected.addressOffset,
    watcomStartOffsetHex: toHex32(selected.addressOffset),
    watcomEndOffset: end,
    watcomEndOffsetHex: toHex32(end),
    physicalStart: codeBase + selected.addressOffset,
    physicalStartHex: toHex32(codeBase + selected.addressOffset),
    physicalEnd: codeBase + end,
    physicalEndHex: toHex32(codeBase + end),
    exactStartMatch: selected.addressOffset === watcomOffset,
  };
}

function resolveCodeSymbolAtPhysical(
  permanent: any,
  codeBase: number,
  physical: number,
  exactOnly = false,
): ResolvedWatcomCodeSymbol | null {
  if (physical < codeBase) return null;
  return resolveCodeSymbolAtWatcomOffset(permanent, codeBase, physical - codeBase, exactOnly);
}

function resolveDataSymbol(permanent: any, offset: number): ResolvedWatcomDataSymbol | null {
  const matches = (permanent.globalSymbols.symbols as WatcomGlobalSymbol[])
    .filter((s) => s.valid && s.segment === 2 && s.kindBits.isData && s.addressOffset === offset)
    .sort((a, b) => a.globalIndex - b.globalIndex);
  if (matches.length === 0) return null;
  const s = matches[0];
  return {
    name: s.name,
    moduleIndex: s.moduleIndex,
    moduleName: s.resolvedModuleName ?? null,
    watcomOffset: offset,
    watcomOffsetHex: toHex32(offset),
    globalIndex: s.globalIndex,
  };
}

function ins(
  bytes: Uint8Array,
  physicalOffset: number,
  byteLength: number,
  mnemonic: string,
  operands: string,
  role: string,
): SelectionMachineInstruction {
  return {
    physicalOffset,
    physicalOffsetHex: toHex32(physicalOffset),
    bytesHex: bytesHex(bytes.slice(physicalOffset, physicalOffset + byteLength)),
    mnemonic,
    operands,
    role,
  };
}

/** Match the complete two-state palette-switch machine around a paired-table cluster. */
export function findPaletteSelectionStateMachine(
  bytes: Uint8Array,
  searchStart: number,
  searchEnd: number,
  alternateTableOffset: number,
  normalTableOffset: number,
): Omit<PaletteSelectionStateMachine, 'containingFunction'> | null {
  const start = Math.max(0, searchStart);
  const end = Math.min(bytes.length, searchEnd);
  for (let p = start; p + 86 <= end; p++) {
    if (
      bytes[p] !== 0xf7 || bytes[p + 1] !== 0x05 ||
      readU32(bytes, p + 6) !== 0xffffffff ||
      bytes[p + 10] !== 0x75 ||
      bytes[p + 12] !== 0xa1 ||
      bytes[p + 17] !== 0x8b || bytes[p + 18] !== 0x1d ||
      bytes[p + 23] !== 0x3b || bytes[p + 24] !== 0xd8 ||
      bytes[p + 25] !== 0x75 ||
      bytes[p + 27] !== 0xc7 || bytes[p + 28] !== 0x05 || readU32(bytes, p + 33) !== 1 ||
      bytes[p + 37] !== 0x8b || bytes[p + 38] !== 0x5f ||
      bytes[p + 40] !== 0x8b || bytes[p + 41] !== 0x04 || bytes[p + 42] !== 0x9d ||
      readU32(bytes, p + 43) !== alternateTableOffset ||
      bytes[p + 47] !== 0xe8 || bytes[p + 52] !== 0xeb ||
      bytes[p + 54] !== 0xa1 ||
      bytes[p + 59] !== 0x8b || bytes[p + 60] !== 0x1d ||
      bytes[p + 65] !== 0x3b || bytes[p + 66] !== 0xd8 ||
      bytes[p + 67] !== 0x74 ||
      bytes[p + 69] !== 0x8b || bytes[p + 70] !== 0x5f ||
      bytes[p + 72] !== 0x8b || bytes[p + 73] !== 0x04 || bytes[p + 74] !== 0x9d ||
      readU32(bytes, p + 75) !== normalTableOffset ||
      bytes[p + 79] !== 0xe8 || bytes[p + 84] !== 0xeb
    ) continue;

    const a11 = readU32(bytes, p + 2);
    const p1 = readU32(bytes, p + 13);
    const p2 = readU32(bytes, p + 19);
    if (readU32(bytes, p + 29) !== a11 || readU32(bytes, p + 55) !== p1 || readU32(bytes, p + 61) !== p2) continue;
    const fieldA = bytes[p + 39];
    const fieldB = bytes[p + 71];
    if (fieldA !== fieldB) continue;
    const callA = rel32Target(bytes, p + 47);
    const callB = rel32Target(bytes, p + 79);
    if (callA !== callB) continue;
    const altJump = rel8Target(bytes, p + 52);
    const normalJump = rel8Target(bytes, p + 84);
    const normalClearsLatch =
      normalJump >= 0 && normalJump + 10 <= bytes.length &&
      bytes[normalJump] === 0xc7 && bytes[normalJump + 1] === 0x05 &&
      readU32(bytes, normalJump + 2) === a11 && readU32(bytes, normalJump + 6) === 0;
    if (!normalClearsLatch) continue;

    const transitions: SelectionStateTransition[] = [
      { currentAlternateLatch: 'ZERO', characterRelation: 'EQUAL', action: 'APPLY_ALTERNATE_AND_SET_LATCH', selectedTable: 'ALTERNATE', resultingAlternateLatch: 'NONZERO' },
      { currentAlternateLatch: 'ZERO', characterRelation: 'NOT_EQUAL', action: 'NO_PALETTE_CHANGE', selectedTable: null, resultingAlternateLatch: 'ZERO' },
      { currentAlternateLatch: 'NONZERO', characterRelation: 'EQUAL', action: 'NO_PALETTE_CHANGE', selectedTable: null, resultingAlternateLatch: 'NONZERO' },
      { currentAlternateLatch: 'NONZERO', characterRelation: 'NOT_EQUAL', action: 'APPLY_NORMAL_AND_CLEAR_LATCH', selectedTable: 'NORMAL', resultingAlternateLatch: 'ZERO' },
    ];

    const instructions: SelectionMachineInstruction[] = [
      ins(bytes, p, 10, 'TEST', `[${toHex32(a11)}], 0xFFFFFFFF`, 'Read current alternate-palette latch state'),
      ins(bytes, p + 12, 5, 'MOV', `EAX, [${toHex32(p1)}]`, 'Load first character identity'),
      ins(bytes, p + 17, 6, 'MOV', `EBX, [${toHex32(p2)}]`, 'Load second character identity'),
      ins(bytes, p + 23, 2, 'CMP', 'EBX, EAX', 'Compare character identities'),
      ins(bytes, p + 27, 10, 'MOV', `[${toHex32(a11)}], 1`, 'Latch alternate state before alternate palette application'),
      ins(bytes, p + 37, 3, 'MOV', `EBX, [EDI+${toHex32(fieldA)}]`, 'Load object-local palette-table slot index'),
      ins(bytes, p + 40, 7, 'MOV', `EAX, [EBX*4+${toHex32(alternateTableOffset)}]`, 'Select alternate palette pointer from paired table'),
      ins(bytes, p + 47, 5, 'CALL', toHex32(callA), 'Apply selected palette through common downstream routine'),
      ins(bytes, p + 54, 5, 'MOV', `EAX, [${toHex32(p1)}]`, 'Reload first character identity for latched path'),
      ins(bytes, p + 59, 6, 'MOV', `EBX, [${toHex32(p2)}]`, 'Reload second character identity for latched path'),
      ins(bytes, p + 65, 2, 'CMP', 'EBX, EAX', 'Compare character identities while alternate state is latched'),
      ins(bytes, p + 69, 3, 'MOV', `EBX, [EDI+${toHex32(fieldB)}]`, 'Load same object-local palette-table slot index'),
      ins(bytes, p + 72, 7, 'MOV', `EAX, [EBX*4+${toHex32(normalTableOffset)}]`, 'Select normal palette pointer from paired table'),
      ins(bytes, p + 79, 5, 'CALL', toHex32(callB), 'Apply selected palette through same downstream routine'),
      ins(bytes, normalJump, 10, 'MOV', `[${toHex32(a11)}], 0`, 'Clear alternate-state latch after normal palette restoration'),
    ];

    return {
      physicalStart: p,
      physicalStartHex: toHex32(p),
      physicalEnd: p + 86,
      physicalEndHex: toHex32(p + 86),
      a11Offset: a11,
      a11OffsetHex: toHex32(a11),
      p1CharOffset: p1,
      p1CharOffsetHex: toHex32(p1),
      p2CharOffset: p2,
      p2CharOffsetHex: toHex32(p2),
      alternateTableOffset,
      alternateTableOffsetHex: toHex32(alternateTableOffset),
      normalTableOffset,
      normalTableOffsetHex: toHex32(normalTableOffset),
      commonCallTargetPhysical: callA,
      commonCallTargetPhysicalHex: toHex32(callA),
      tableIndexObjectFieldOffset: fieldA,
      tableIndexObjectFieldOffsetHex: toHex32(fieldA),
      alternatePostCallJumpTargetPhysical: altJump,
      alternatePostCallJumpTargetPhysicalHex: toHex32(altJump),
      normalPostCallJumpTargetPhysical: normalJump,
      normalPostCallJumpTargetPhysicalHex: toHex32(normalJump),
      normalPostCallClearsLatch: normalClearsLatch,
      instructions,
      transitions,
      classification: 'VERIFIED_EDGE_TRIGGERED_CHARACTER_EQUALITY_PALETTE_LATCH',
    };
  }
  return null;
}

function parseMultiSwpal(
  bytes: Uint8Array,
  fn: ResolvedWatcomCodeSymbol,
  permanent: any,
  codeBase: number,
): MultiSwpalEvidence | null {
  const p = fn.physicalStart;
  if (fn.physicalEnd - p < 41 || p + 41 > bytes.length) return null;
  if (
    bytes[p] !== 0x50 || bytes[p + 1] !== 0x8b || bytes[p + 2] !== 0xd7 ||
    bytes[p + 3] !== 0x0f || bytes[p + 4] !== 0xb7 || bytes[p + 5] !== 0x42 ||
    bytes[p + 7] !== 0xe8 ||
    bytes[p + 12] !== 0x8b || bytes[p + 13] !== 0x52 ||
    bytes[p + 15] !== 0x85 || bytes[p + 16] !== 0xd2 || bytes[p + 17] !== 0x75 ||
    bytes[p + 19] !== 0x58 || bytes[p + 20] !== 0x8b || bytes[p + 21] !== 0xd7 || bytes[p + 22] !== 0x50 ||
    bytes[p + 23] !== 0xe8 ||
    bytes[p + 28] !== 0x66 || bytes[p + 29] !== 0x89 || bytes[p + 30] !== 0x42 ||
    bytes[p + 32] !== 0x58 || bytes[p + 33] !== 0x8b || bytes[p + 34] !== 0x52 ||
    bytes[p + 36] !== 0x85 || bytes[p + 37] !== 0xd2 || bytes[p + 38] !== 0x75 || bytes[p + 40] !== 0xc3
  ) return null;
  const handleLoad = bytes[p + 6];
  const handleStore = bytes[p + 31];
  const nextA = bytes[p + 14];
  const nextB = bytes[p + 35];
  if (handleLoad !== handleStore || nextA !== nextB) return null;
  const freeTarget = rel32Target(bytes, p + 7);
  const getTarget = rel32Target(bytes, p + 23);
  const freeFunction = resolveCodeSymbolAtPhysical(permanent, codeBase, freeTarget, true);
  const getFunction = resolveCodeSymbolAtPhysical(permanent, codeBase, getTarget, true);
  return {
    function: fn,
    physicalBytesHex: bytesHex(bytes.slice(fn.physicalStart, fn.physicalEnd)),
    linkedListNextFieldOffset: nextA,
    linkedListNextFieldOffsetHex: toHex32(nextA),
    paletteHandleFieldOffset: handleLoad,
    paletteHandleFieldOffsetHex: toHex32(handleLoad),
    freeCallTargetPhysical: freeTarget,
    freeCallTargetPhysicalHex: toHex32(freeTarget),
    getCallTargetPhysical: getTarget,
    getCallTargetPhysicalHex: toHex32(getTarget),
    freeFunction,
    getFunction,
    releasesExistingHandles: freeFunction !== null,
    acquiresReplacementHandles: getFunction !== null,
    storesReplacementHandle: true,
    classification: 'VERIFIED_MULTI_OBJECT_PALETTE_REBIND',
  };
}

function parseGetPal(
  bytes: Uint8Array,
  fn: ResolvedWatcomCodeSymbol,
  permanent: any,
  codeBase: number,
): GetPalEvidence {
  const start = fn.physicalStart;
  const end = Math.min(bytes.length, fn.physicalEnd);
  let headerPattern = -1;
  for (let p = start; p + 6 <= end; p++) {
    if (bytes[p] === 0x66 && bytes[p + 1] === 0x8b && bytes[p + 2] === 0x18 && bytes[p + 3] === 0x83 && bytes[p + 4] === 0xc0 && bytes[p + 5] === 0x02) {
      headerPattern = p;
      break;
    }
  }
  const calls: number[] = [];
  for (let p = start; p + 5 <= end; p++) {
    if (bytes[p] === 0xe8) {
      const target = rel32Target(bytes, p);
      if (target >= 0 && target < bytes.length) calls.push(target);
    }
  }
  const uniqueCalls = Array.from(new Set(calls));
  const resolvedCalls = uniqueCalls
    .map((target) => resolveCodeSymbolAtPhysical(permanent, codeBase, target, true))
    .filter((v): v is ResolvedWatcomCodeSymbol => Boolean(v));
  const palset = resolvedCalls.find((s) => s.name === 'PALSET') ?? (resolvedCalls.length === 1 ? resolvedCalls[0] : null);
  const verified = headerPattern >= 0 && uniqueCalls.length > 0 && palset !== null && calls.some((t) => t === palset.physicalStart);
  return {
    function: fn,
    paletteHeaderReadPatternFound: headerPattern >= 0,
    paletteHeaderReadOffsetPhysical: headerPattern >= 0 ? headerPattern : null,
    paletteHeaderReadOffsetPhysicalHex: headerPattern >= 0 ? toHex32(headerPattern) : null,
    palettePointerAdvanceBytes: headerPattern >= 0 ? 2 : null,
    callTargetsPhysical: uniqueCalls,
    callTargetsPhysicalHex: uniqueCalls.map(toHex32),
    palsetFunction: palset,
    callsPalset: palset !== null && calls.some((t) => t === palset.physicalStart),
    classification: verified ? 'VERIFIED_PALETTE_RECORD_ACQUIRE' : 'PARTIAL_PALETTE_RECORD_ACQUIRE',
  };
}

function buildSymbolNeighborhoodValidation(
  permanent: any,
  codeBase: number,
  common: ResolvedWatcomCodeSymbol | null,
): SymbolNeighborhoodValidation {
  if (!common) return {
    playerSwpal: null, playerNormpal: null, multiSwpal: null, consecutiveBoundaryDeltasMatch: false,
    note: 'Common downstream target did not resolve to an exact Watcom code symbol.',
  };
  const symbols = sortedCodeSymbols(permanent);
  const idx = symbols.findIndex((s) => s.addressOffset === common.watcomStartOffset);
  const prev1 = idx > 0 ? resolveCodeSymbolAtWatcomOffset(permanent, codeBase, symbols[idx - 1].addressOffset, true) : null;
  const prev2 = idx > 1 ? resolveCodeSymbolAtWatcomOffset(permanent, codeBase, symbols[idx - 2].addressOffset, true) : null;
  const commonAgain = resolveCodeSymbolAtWatcomOffset(permanent, codeBase, common.watcomStartOffset, true);
  const consecutive = Boolean(
    prev2 && prev1 && commonAgain &&
    prev2.physicalEnd === prev1.physicalStart && prev1.physicalEnd === commonAgain.physicalStart
  );
  return {
    playerSwpal: prev2,
    playerNormpal: prev1,
    multiSwpal: commonAgain,
    consecutiveBoundaryDeltasMatch: consecutive,
    note: 'Names are post-derivation Watcom labels attached after the local code file-image base and physical function boundaries were established.',
  };
}

export async function executeKanoPaletteSelectionSemantics(
  source: DirectorySource,
  options?: {
    exePath?: string;
    onProgress?: (stage: string, progress: number) => void;
    referenceGraphReport?: MK1KanoPaletteSelectionReferenceGraphReport;
  },
): Promise<MK1KanoPaletteSelectionSemanticsReport> {
  const operationId = createOperationId('kano_palette_selection_semantics');
  const exePath = options?.exePath ?? 'MK1.EXE';
  options?.onProgress?.('Verifying 1E.3E reference-graph prerequisite', 0.05);
  const graph = options?.referenceGraphReport ?? await executeKanoPaletteSelectionReferenceGraph(source, { exePath });
  const graphExport = createMK1KanoPaletteSelectionReferenceGraphExport(graph);
  const prerequisitePassed = graph.status === 'SUCCESS' && graphExport.validation.allChecksPassed && graph.decision.sharedIndexedCodeUseEstablished;
  if (!prerequisitePassed || !graph.pairedPaletteTableRelationship) {
    throw new Error('Pass 1E.3F requires a successful authoritative Pass 1E.3E reference-graph run.');
  }

  const pair = graph.pairedPaletteTableRelationship;
  const tableA = graph.containingReferenceTables.find((t) => t.symbol.symbolName === pair.tableA);
  const tableB = graph.containingReferenceTables.find((t) => t.symbol.symbolName === pair.tableB);
  if (!tableA || !tableB) throw new Error('Pass 1E.3F could not recover both paired palette-table records from 1E.3E.');
  const normalTable = tableA.kanoPSlots.length > 0 ? tableA : tableB;
  const alternateTable = tableA.kano3PSlots.length > 0 ? tableA : tableB;

  const verifiedCluster = graph.indexedTablePairClusters.find((c) => c.classification === 'VERIFIED_SHARED_INDEX_TABLE_CLUSTER');
  if (!verifiedCluster) throw new Error('Pass 1E.3F requires the verified shared-index table cluster from 1E.3E.');

  options?.onProgress?.('Loading executable and blind Watcom inventory', 0.2);
  const addressModel = await qualifyMK1WatcomAddressModel(source, { exePath });
  const permanent = addressModel.permanentClassesReport?.result;
  if (!permanent || addressModel.status !== 'SUCCESS') throw new Error('Pass 1E.3F requires a successful Watcom permanent-class inventory.');
  const exeSize = graph.fixture.exeSize;
  const bytes = await source.readSlice(exePath, 0, exeSize);
  if (bytes.length !== exeSize) throw new Error(`Could not read complete ${exePath}; got ${bytes.length}/${exeSize} bytes.`);

  const clusterMin = Math.min(verifiedCluster.firstSitePhysicalOffset, verifiedCluster.secondSitePhysicalOffset);
  const clusterMax = Math.max(verifiedCluster.firstSitePhysicalOffset, verifiedCluster.secondSitePhysicalOffset);
  const anchorWindowStart = Math.max(0, clusterMin - 0x300);
  const anchorWindowEnd = Math.min(bytes.length, clusterMax + 0x300);
  options?.onProgress?.('Deriving Segment-1 code file-image base from continuation anchors', 0.35);
  const anchors = scanCodeContinuationAnchors(bytes, anchorWindowStart, anchorWindowEnd);
  const codeImageBaseQualification = qualifyCodeImageBase(anchors, anchorWindowStart, anchorWindowEnd, 3);
  const codeBase = codeImageBaseQualification.qualifiedBase;
  if (codeBase === null) throw new Error('Pass 1E.3F could not qualify a unique Segment-1 code file-image base from the bounded continuation-anchor window.');

  const segment1AddressInfo = permanent.addressInfo.segmentRecords.find((r: any) => r.segment === 1);
  const watcomCodeDeclaredSpan = segment1AddressInfo
    ? segment1AddressInfo.startAddressOffset + segment1AddressInfo.entries.reduce((acc: number, e: any) => acc + e.size, 0)
    : 0;
  const alignment = addressModel.layoutReport?.parsedHeader?.pageSize ?? 4096;
  const alignedCodeSpan = alignUp(watcomCodeDeclaredSpan, alignment);
  const dataBaseFromCodeLayout = codeBase + alignedCodeSpan;
  const dataBaseFromNormalTable = normalTable.physicalStart - normalTable.symbol.startOffset;
  const dataBaseFromAlternateTable = alternateTable.physicalStart - alternateTable.symbol.startOffset;
  const tableBasesAgree = dataBaseFromNormalTable === dataBaseFromAlternateTable;
  const alignedLayoutMatchesTableBase = tableBasesAgree && dataBaseFromCodeLayout === dataBaseFromNormalTable;
  const staticCodeDataImageLayoutCrossCheck: StaticCodeDataImageLayoutCrossCheck = {
    codeImageBase: codeBase, codeImageBaseHex: toHex32(codeBase),
    watcomCodeDeclaredSpan, watcomCodeDeclaredSpanHex: toHex32(watcomCodeDeclaredSpan),
    alignment, alignmentHex: toHex32(alignment),
    alignedCodeSpan, alignedCodeSpanHex: toHex32(alignedCodeSpan),
    dataBaseFromCodeLayout, dataBaseFromCodeLayoutHex: toHex32(dataBaseFromCodeLayout),
    dataBaseFromNormalTable, dataBaseFromNormalTableHex: toHex32(dataBaseFromNormalTable),
    dataBaseFromAlternateTable, dataBaseFromAlternateTableHex: toHex32(dataBaseFromAlternateTable),
    tableBasesAgree, alignedLayoutMatchesTableBase,
    classification: alignedLayoutMatchesTableBase ? 'VERIFIED_ALIGNED_CODE_TO_DATA_BASE_RELATIONSHIP' : 'PARTIAL_LAYOUT_MATCH',
  };

  options?.onProgress?.('Recovering exact character-equality palette state machine', 0.52);
  const machineBare = findPaletteSelectionStateMachine(
    bytes,
    Math.max(0, clusterMin - 0x80),
    Math.min(bytes.length, clusterMax + 0x100),
    alternateTable.symbol.startOffset,
    normalTable.symbol.startOffset,
  );
  const containingFunction = machineBare
    ? resolveCodeSymbolAtPhysical(permanent, codeBase, machineBare.physicalStart, false)
    : null;
  const selectionStateMachine: PaletteSelectionStateMachine | null = machineBare ? { ...machineBare, containingFunction } : null;

  const selectorStateSymbols = {
    a11: selectionStateMachine ? resolveDataSymbol(permanent, selectionStateMachine.a11Offset) : null,
    p1Char: selectionStateMachine ? resolveDataSymbol(permanent, selectionStateMachine.p1CharOffset) : null,
    p2Char: selectionStateMachine ? resolveDataSymbol(permanent, selectionStateMachine.p2CharOffset) : null,
  };

  options?.onProgress?.('Qualifying common palette-rebind routine', 0.68);
  const commonFn = selectionStateMachine
    ? resolveCodeSymbolAtPhysical(permanent, codeBase, selectionStateMachine.commonCallTargetPhysical, true)
    : null;
  const commonPaletteRebind = commonFn ? parseMultiSwpal(bytes, commonFn, permanent, codeBase) : null;
  const getPalFn = commonPaletteRebind?.getFunction ?? null;
  const getPalEvidence = getPalFn ? parseGetPal(bytes, getPalFn, permanent, codeBase) : null;
  const symbolNeighborhoodValidation = buildSymbolNeighborhoodValidation(permanent, codeBase, commonFn);

  const stateNamesEstablished =
    selectorStateSymbols.a11?.name === 'A11' &&
    selectorStateSymbols.p1Char?.name === 'P1_CHAR' &&
    selectorStateSymbols.p2Char?.name === 'P2_CHAR';
  const characterEqualityTriggerEstablished = Boolean(selectionStateMachine && stateNamesEstablished);
  const alternateLatchBehaviorEstablished = Boolean(selectionStateMachine?.normalPostCallClearsLatch);
  const commonPaletteRebindEstablished = Boolean(
    commonPaletteRebind &&
    commonPaletteRebind.freeFunction &&
    commonPaletteRebind.getFunction &&
    commonPaletteRebind.releasesExistingHandles &&
    commonPaletteRebind.acquiresReplacementHandles &&
    commonPaletteRebind.storesReplacementHandle
  );
  const paletteRecordAcquireEstablished = getPalEvidence?.classification === 'VERIFIED_PALETTE_RECORD_ACQUIRE';
  const success =
    codeImageBaseQualification.status === 'QUALIFIED_CODE_FILE_IMAGE_BASE' &&
    staticCodeDataImageLayoutCrossCheck.classification === 'VERIFIED_ALIGNED_CODE_TO_DATA_BASE_RELATIONSHIP' &&
    characterEqualityTriggerEstablished &&
    alternateLatchBehaviorEstablished &&
    commonPaletteRebindEstablished &&
    paletteRecordAcquireEstablished;

  options?.onProgress?.('Pass 1E.3F analysis complete', 1);
  const timestamp = new Date().toISOString();
  const provenance = { ...graph.provenance, timestamp, operationId };
  return {
    format: 'mk1_kano_palette_selection_semantics_v1',
    timestamp,
    operationId,
    provenance,
    fixture: graph.fixture,
    prerequisite: {
      pass: '1E.3E',
      status: graph.status,
      referenceGraphEstablished: graph.decision.verdict === 'PALETTE_SELECTION_REFERENCE_GRAPH_ESTABLISHED',
      validationPassed: graphExport.validation.allChecksPassed,
    },
    codeImageBaseQualification,
    staticCodeDataImageLayoutCrossCheck,
    selectorStateSymbols,
    selectionStateMachine,
    commonPaletteRebind,
    getPalEvidence,
    symbolNeighborhoodValidation,
    decision: {
      codeImageBaseEstablished: codeImageBaseQualification.status === 'QUALIFIED_CODE_FILE_IMAGE_BASE',
      staticCodeDataImageLayoutEstablished: staticCodeDataImageLayoutCrossCheck.classification === 'VERIFIED_ALIGNED_CODE_TO_DATA_BASE_RELATIONSHIP',
      characterEqualityTriggerEstablished,
      alternateLatchBehaviorEstablished,
      commonPaletteRebindEstablished,
      paletteRecordAcquireEstablished,
      mirrorMatchInterpretation: characterEqualityTriggerEstablished ? 'INFERRED' : 'UNRESOLVED',
      hardwareTransferSemanticsEstablished: false,
      verdict: success ? 'SAME_CHARACTER_PALETTE_SWITCH_SEMANTICS_ESTABLISHED' : 'PARTIAL_SELECTION_SEMANTICS',
      narrative: success
        ? 'The independently derived Segment-1 code image base plus the page-aligned declared code span lands exactly on the independently table-derived Segment-2 static-data base. A bounded fixture-derived state machine compares the Watcom-resolved P1_CHAR and P2_CHAR values. When they become equal while A11 is clear, it latches A11 and applies the alternate palette table; when they become unequal while A11 is latched, it applies the normal table and clears A11. Both paths feed the same object-local table index into the same downstream palette rebinding routine. The internal Watcom symbols resolve that routine to MULTI_SWPAL, which releases each existing palette handle through FREEPAL and reacquires the selected palette through GETPAL. Same-character palette switching is therefore mechanically established; the gameplay label “mirror match” remains an interpretation, and hardware transfer/index-0 semantics remain deferred.'
        : 'Pass 1E.3F recovered partial selection/downstream evidence but did not satisfy every authoritative invariant. Do not promote same-character palette-switch semantics.',
    },
    status: success ? 'SUCCESS' : 'PARTIAL',
  };
}

export function createMK1KanoPaletteSelectionSemanticsExport(
  report: MK1KanoPaletteSelectionSemanticsReport,
): MK1KanoPaletteSelectionSemanticsExport {
  if (!isValidRealProvenance(report.provenance)) {
    throw new Error('Authoritative 1E.3F export requires authentic user-loaded provenance and a valid non-zero SHA-256.');
  }
  if (!report.operationId.startsWith('kano_palette_selection_semantics-') || report.provenance.operationId !== report.operationId) {
    throw new Error('Authoritative 1E.3F export operation provenance is inconsistent with the analysis milestone.');
  }
  const machine = report.selectionStateMachine;
  const rebind = report.commonPaletteRebind;
  const checks = [
    {
      checkId: 'PROVENANCE_REAL_USER_LOADED',
      name: 'Fixture loaded from authentic user directory',
      passed: true,
      detail: `${report.provenance.fileName} ${report.provenance.sha256}`,
    },
    {
      checkId: 'REFERENCE_GRAPH_PREREQUISITE',
      name: 'Authoritative Pass 1E.3E prerequisite passed',
      passed: report.prerequisite.validationPassed && report.prerequisite.referenceGraphEstablished,
      detail: `status=${report.prerequisite.status}`,
    },
    {
      checkId: 'CODE_IMAGE_BASE_QUALIFIED',
      name: 'Segment-1 code file-image base derived from at least three agreeing continuation anchors',
      passed: report.codeImageBaseQualification.status === 'QUALIFIED_CODE_FILE_IMAGE_BASE' && report.codeImageBaseQualification.agreeingAnchorCount >= 3,
      detail: report.codeImageBaseQualification.qualifiedBaseHex ?? 'not established',
    },
    {
      checkId: 'ALIGNED_CODE_TO_DATA_BASE_RELATIONSHIP',
      name: 'Qualified code base plus aligned Watcom code span lands exactly on the paired-table-derived static-data base',
      passed: report.staticCodeDataImageLayoutCrossCheck?.classification === 'VERIFIED_ALIGNED_CODE_TO_DATA_BASE_RELATIONSHIP',
      detail: report.staticCodeDataImageLayoutCrossCheck ? `${report.staticCodeDataImageLayoutCrossCheck.codeImageBaseHex} + ${report.staticCodeDataImageLayoutCrossCheck.alignedCodeSpanHex} = ${report.staticCodeDataImageLayoutCrossCheck.dataBaseFromCodeLayoutHex}` : 'not established',
    },
    {
      checkId: 'CHARACTER_STATE_SYMBOLS_RESOLVED',
      name: 'Mechanically decoded state offsets resolve post-discovery to A11, P1_CHAR and P2_CHAR',
      passed: report.selectorStateSymbols.a11?.name === 'A11' && report.selectorStateSymbols.p1Char?.name === 'P1_CHAR' && report.selectorStateSymbols.p2Char?.name === 'P2_CHAR',
      detail: `${report.selectorStateSymbols.a11?.name ?? '?'} / ${report.selectorStateSymbols.p1Char?.name ?? '?'} / ${report.selectorStateSymbols.p2Char?.name ?? '?'}`,
    },
    {
      checkId: 'CHARACTER_EQUALITY_STATE_MACHINE',
      name: 'Complete equal/unequal normal/alternate palette state machine matched',
      passed: machine?.classification === 'VERIFIED_EDGE_TRIGGERED_CHARACTER_EQUALITY_PALETTE_LATCH' && machine.normalPostCallClearsLatch,
      detail: machine ? `${machine.physicalStartHex}..${machine.physicalEndHex}` : 'not established',
    },
    {
      checkId: 'COMMON_DOWNSTREAM_TARGET',
      name: 'Both palette-table paths converge on one exact Watcom code symbol',
      passed: Boolean(machine && rebind && rebind.function.physicalStart === machine.commonCallTargetPhysical && rebind.function.exactStartMatch),
      detail: rebind ? `${rebind.function.name} @ ${rebind.function.physicalStartHex}` : 'not established',
    },
    {
      checkId: 'MULTI_OBJECT_PALETTE_REBIND',
      name: 'Common routine releases old palette handles and stores replacement handles for the linked object list',
      passed: report.decision.commonPaletteRebindEstablished,
      detail: rebind ? `next=${rebind.linkedListNextFieldOffsetHex}, handle=${rebind.paletteHandleFieldOffsetHex}, free=${rebind.freeFunction?.name ?? '?'}, get=${rebind.getFunction?.name ?? '?'}` : 'not established',
    },
    {
      checkId: 'PALETTE_RECORD_ACQUIRE',
      name: 'GETPAL consumes a [u16 length][colors...] palette record and calls the mapped palette setup routine',
      passed: report.decision.paletteRecordAcquireEstablished,
      detail: report.getPalEvidence ? `header=${report.getPalEvidence.paletteHeaderReadOffsetPhysicalHex ?? '?'}, setup=${report.getPalEvidence.palsetFunction?.name ?? '?'}` : 'not established',
    },
  ];
  const allChecksPassed = checks.every((c) => c.passed);
  return {
    metadata: {
      name: 'MK1 Kano Palette Selection Semantics',
      version: '1.0.0',
      milestone: 'Pass 1E.3F',
      formatVersion: 'mk1_kano_palette_selection_semantics_v1',
      exportTimestamp: report.timestamp,
    },
    provenance: report.provenance,
    fixture: report.fixture,
    prerequisite: report.prerequisite,
    codeImageBaseQualification: report.codeImageBaseQualification,
    staticCodeDataImageLayoutCrossCheck: report.staticCodeDataImageLayoutCrossCheck,
    selectorStateSymbols: report.selectorStateSymbols,
    selectionStateMachine: report.selectionStateMachine,
    commonPaletteRebind: report.commonPaletteRebind,
    getPalEvidence: report.getPalEvidence,
    symbolNeighborhoodValidation: report.symbolNeighborhoodValidation,
    decision: report.decision,
    validation: { allChecksPassed, checks },
  };
}
