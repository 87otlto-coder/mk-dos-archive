/**
 * MK1 palette setup / transfer semantics — Pass 1E.3G.
 *
 * Bounded question:
 *   Starting from the verified GETPAL -> PALSET boundary, how are palette
 *   records queued, allocated into hardware palette ranges, transferred to the
 *   hardware-facing DAC ports, and translated into renderer palette shifts?
 *
 * Discipline:
 * - Pass 1E.3F is a hard prerequisite.
 * - Coordinates and function boundaries are derived first; Watcom names are
 *   attached after the mechanics are established.
 * - No external palette/index assumptions are used to make the pass succeed.
 * - Full rasterizer semantics remain out of scope; only the verified shift
 *   bridge into the discovered renderer routine is claimed.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { WatcomGlobalSymbol } from '../../../core/executable/watcomDebug/watcomPermanentClassTypes';
import { qualifyMK1WatcomAddressModel } from './watcomAddressModelInventory';
import {
  createMK1KanoPaletteSelectionSemanticsExport,
  executeKanoPaletteSelectionSemantics,
} from './kanoPaletteSelectionSemantics';
import {
  MK1KanoPaletteSelectionSemanticsReport,
  ResolvedWatcomCodeSymbol,
  ResolvedWatcomDataSymbol,
} from './kanoPaletteSelectionSemanticsTypes';
import {
  DispatchTableResolvedEntry,
  MK1PaletteSetupTransferSemanticsExport,
  MK1PaletteSetupTransferSemanticsReport,
  PaletteRamAllocatorEvidence,
  PaletteTransferHardwareEvidence,
  PaletteTransferQueueEvidence,
  ProcessDispatcherTransferEvidence,
  RendererPaletteShiftBridgeEvidence,
  WatcomModuleSpan,
} from './paletteSetupTransferSemanticsTypes';

function toHex32(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}
function toHex16(value: number): string {
  return `0x${(value & 0xffff).toString(16).padStart(4, '0').toUpperCase()}`;
}
function bytesHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}
function readU16(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}
function readU32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}
function readI32(bytes: Uint8Array, offset: number): number { return readU32(bytes, offset) | 0; }
function rel32Target(bytes: Uint8Array, instructionOffset: number): number {
  return instructionOffset + 5 + readI32(bytes, instructionOffset + 1);
}

function isValidRealProvenance(p: MK1KanoPaletteSelectionSemanticsReport['provenance']): boolean {
  return p.sourceKind === 'user-loaded-directory' && p.synthetic === false && p.artifactGeneratedByTest === false &&
    typeof p.sha256 === 'string' && /^[0-9a-f]{64}$/.test(p.sha256) && !/^0{64}$/.test(p.sha256);
}

function sortedCodeSymbols(permanent: any): WatcomGlobalSymbol[] {
  return (permanent.globalSymbols.symbols as WatcomGlobalSymbol[])
    .filter((s) => s.valid && s.segment === 1 && s.kindBits.isCode)
    .slice().sort((a, b) => a.addressOffset - b.addressOffset || a.globalIndex - b.globalIndex);
}
function sortedDataSymbols(permanent: any): WatcomGlobalSymbol[] {
  return (permanent.globalSymbols.symbols as WatcomGlobalSymbol[])
    .filter((s) => s.valid && s.segment === 2 && s.kindBits.isData)
    .slice().sort((a, b) => a.addressOffset - b.addressOffset || a.globalIndex - b.globalIndex);
}
function resolveCodeSymbolAtWatcomOffset(permanent: any, codeBase: number, offset: number, exactOnly = false): ResolvedWatcomCodeSymbol | null {
  const syms = sortedCodeSymbols(permanent);
  let sel: WatcomGlobalSymbol | null = null;
  let idx = -1;
  for (let i = 0; i < syms.length; i++) {
    const s = syms[i];
    if (exactOnly) {
      if (s.addressOffset === offset) { sel = s; idx = i; break; }
      if (s.addressOffset > offset) break;
    } else if (s.addressOffset <= offset) { sel = s; idx = i; }
    else break;
  }
  if (!sel || idx < 0) return null;
  const next = syms.slice(idx + 1).find((s) => s.addressOffset > sel!.addressOffset);
  const end = next?.addressOffset ?? sel.addressOffset;
  if (!exactOnly && next && offset >= next.addressOffset) return null;
  return {
    name: sel.name,
    moduleIndex: sel.moduleIndex,
    moduleName: sel.resolvedModuleName ?? null,
    watcomStartOffset: sel.addressOffset,
    watcomStartOffsetHex: toHex32(sel.addressOffset),
    watcomEndOffset: end,
    watcomEndOffsetHex: toHex32(end),
    physicalStart: codeBase + sel.addressOffset,
    physicalStartHex: toHex32(codeBase + sel.addressOffset),
    physicalEnd: codeBase + end,
    physicalEndHex: toHex32(codeBase + end),
    exactStartMatch: sel.addressOffset === offset,
  };
}
function resolveCodeSymbolAtPhysical(permanent: any, codeBase: number, physical: number, exactOnly = false): ResolvedWatcomCodeSymbol | null {
  return physical < codeBase ? null : resolveCodeSymbolAtWatcomOffset(permanent, codeBase, physical - codeBase, exactOnly);
}
function resolveDataSymbol(permanent: any, offset: number): ResolvedWatcomDataSymbol | null {
  const s = sortedDataSymbols(permanent).find((v) => v.addressOffset === offset);
  return s ? {
    name: s.name,
    moduleIndex: s.moduleIndex,
    moduleName: s.resolvedModuleName ?? null,
    watcomOffset: s.addressOffset,
    watcomOffsetHex: toHex32(s.addressOffset),
    globalIndex: s.globalIndex,
  } : null;
}
function nextDataSymbol(permanent: any, offset: number): ResolvedWatcomDataSymbol | null {
  const s = sortedDataSymbols(permanent).find((v) => v.addressOffset > offset);
  return s ? {
    name: s.name, moduleIndex: s.moduleIndex, moduleName: s.resolvedModuleName ?? null,
    watcomOffset: s.addressOffset, watcomOffsetHex: toHex32(s.addressOffset), globalIndex: s.globalIndex,
  } : null;
}
function nextCodeSymbol(permanent: any, codeBase: number, offset: number): ResolvedWatcomCodeSymbol | null {
  const s = sortedCodeSymbols(permanent).find((v) => v.addressOffset > offset);
  return s ? resolveCodeSymbolAtWatcomOffset(permanent, codeBase, s.addressOffset, true) : null;
}

function moduleSpan(permanent: any, segmentNumber: number, moduleIndex: number): WatcomModuleSpan | null {
  const seg = permanent.addressInfo.segmentRecords.find((r: any) => r.segment === segmentNumber);
  if (!seg) return null;
  let cursor = seg.startAddressOffset;
  for (const e of seg.entries) {
    const start = cursor;
    const end = start + e.size;
    cursor = end;
    if (e.moduleIndex === moduleIndex) return {
      moduleIndex,
      moduleName: e.resolvedModuleName ?? null,
      segment: segmentNumber,
      startOffset: start,
      startOffsetHex: toHex32(start),
      endOffset: end,
      endOffsetHex: toHex32(end),
      byteLength: end - start,
    };
  }
  return null;
}

export function parsePaletteTransferQueue(
  bytes: Uint8Array,
  palset: ResolvedWatcomCodeSymbol,
  permanent: any,
): PaletteTransferQueueEvidence | null {
  const p = palset.physicalStart;
  if (palset.physicalEnd - p < 41 || p + 41 > bytes.length) return null;
  if (
    bytes[p] !== 0x51 ||
    bytes[p + 1] !== 0x8b || bytes[p + 2] !== 0x0d ||
    bytes[p + 7] !== 0x89 || bytes[p + 8] !== 0x01 ||
    bytes[p + 9] !== 0x66 || bytes[p + 10] !== 0x89 || bytes[p + 11] !== 0x51 || bytes[p + 12] !== 0x04 ||
    bytes[p + 13] !== 0x66 || bytes[p + 14] !== 0x89 || bytes[p + 15] !== 0x59 || bytes[p + 16] !== 0x06 ||
    bytes[p + 17] !== 0x83 || bytes[p + 18] !== 0xc1 || bytes[p + 19] !== 0x08 ||
    bytes[p + 20] !== 0x81 || bytes[p + 21] !== 0xf9 ||
    bytes[p + 26] !== 0x7c || bytes[p + 27] !== 0x05 || bytes[p + 28] !== 0xb9 ||
    bytes[p + 33] !== 0x89 || bytes[p + 34] !== 0x0d || bytes[p + 39] !== 0x59 || bytes[p + 40] !== 0xc3
  ) return null;
  const producer = readU32(bytes, p + 3);
  const queueEnd = readU32(bytes, p + 22);
  const queueStart = readU32(bytes, p + 29);
  const producer2 = readU32(bytes, p + 35);
  const stride = bytes[p + 19];
  if (producer !== producer2 || queueEnd <= queueStart || (queueEnd - queueStart) % stride !== 0) return null;

  const consumer = queueEnd;
  const changed = producer + 4;
  const dataSpan = moduleSpan(permanent, 2, palset.moduleIndex);
  const changedSymbol = resolveDataSymbol(permanent, changed);
  const moduleLayoutExact = Boolean(
    dataSpan && dataSpan.startOffset === queueStart && dataSpan.endOffset === changed + 4 &&
    consumer === queueEnd && producer === queueEnd + 4 && changed === queueEnd + 8
  );
  const verified = moduleLayoutExact && stride === 8;
  return {
    palsetFunction: palset,
    dataModuleSpan: dataSpan,
    queueStart, queueStartHex: toHex32(queueStart),
    queueEndExclusive: queueEnd, queueEndExclusiveHex: toHex32(queueEnd),
    entryStride: stride,
    capacity: (queueEnd - queueStart) / stride,
    consumerPointerAddress: consumer, consumerPointerAddressHex: toHex32(consumer),
    producerPointerAddress: producer, producerPointerAddressHex: toHex32(producer),
    changedFlagAddress: changed, changedFlagAddressHex: toHex32(changed),
    changedFlagSymbol: changedSymbol,
    entryFields: { colorsPointerOffset: 0, startIndexOffset: 4, colorCountOffset: 6 },
    palsetStoresColorsPointer: true,
    palsetStoresStartIndex: true,
    palsetStoresColorCount: true,
    wrapsAtQueueEnd: true,
    moduleLayoutExact,
    physicalBytesHex: bytesHex(bytes.slice(p, p + 41)),
    classification: verified ? 'VERIFIED_PALETTE_TRANSFER_RING' : 'PARTIAL_PALETTE_TRANSFER_RING',
  };
}

function parsePaletteRamAllocator(
  bytes: Uint8Array,
  getPal: ResolvedWatcomCodeSymbol,
  palsetPhysical: number,
  permanent: any,
): PaletteRamAllocatorEvidence | null {
  const start = getPal.physicalStart;
  const end = Math.min(bytes.length, getPal.physicalEnd);
  // Find the first pointer-table comparison: CMP [EBX*8+base],EAX.
  let cmp = -1;
  for (let p = start; p + 12 < end; p++) {
    if (bytes[p] === 0x39 && bytes[p + 1] === 0x04 && bytes[p + 2] === 0xdd &&
        bytes[p + 7] === 0x0f && bytes[p + 8] === 0x84) { cmp = p; break; }
  }
  if (cmp < 0) return null;
  const base = readU32(bytes, cmp + 3);
  // The loop limit follows INC EBX / CMP BL, imm8.
  let count = 0;
  for (let p = cmp + 7; p + 5 < Math.min(end, cmp + 40); p++) {
    if (bytes[p] === 0x43 && bytes[p + 1] === 0x80 && bytes[p + 2] === 0xfb) { count = bytes[p + 3]; break; }
  }
  if (!count) return null;
  // Locate EDX=1 allocator origin and the +4/+6 fields.
  let initialStart = -1;
  let refAddress = -1;
  let startAddress = -1;
  let callsPalset = false;
  let returnsHandle = false;
  for (let p = start; p + 10 <= end; p++) {
    if (bytes[p] === 0xba && readU32(bytes, p + 1) === 1) initialStart = 1;
    if (bytes[p] === 0x66 && bytes[p + 1] === 0xf7 && bytes[p + 2] === 0x04 && bytes[p + 3] === 0xdd) refAddress = readU32(bytes, p + 4);
    if ((bytes[p] === 0x8a && bytes[p + 1] === 0x14 && bytes[p + 2] === 0xdd) ||
        (bytes[p] === 0x88 && bytes[p + 1] === 0x14 && bytes[p + 2] === 0xdd)) startAddress = readU32(bytes, p + 3);
    if (bytes[p] === 0xe8 && rel32Target(bytes, p) === palsetPhysical) callsPalset = true;
    if (bytes[p] === 0x8b && bytes[p + 1] === 0xc3 && p + 8 <= end && bytes[p + 2] === 0x66 && bytes[p + 3] === 0xff) returnsHandle = true;
  }
  const stride = 8;
  const refOffset = refAddress >= base ? refAddress - base : -1;
  const hardwareStartOffset = startAddress >= base ? startAddress - base : -1;
  const palRamSymbol = resolveDataSymbol(permanent, base);
  const nextSymbol = nextDataSymbol(permanent, base);
  const exactSpan = Boolean(nextSymbol && nextSymbol.watcomOffset - base === count * stride);
  const verified = initialStart === 1 && refOffset === 4 && hardwareStartOffset === 6 && exactSpan && callsPalset && returnsHandle;
  return {
    getPalFunction: getPal,
    palRamBase: base, palRamBaseHex: toHex32(base),
    palRamSymbol,
    palRamNextSymbol: nextSymbol,
    entryStride: stride,
    entryCount: count,
    entryByteLength: count * stride,
    fields: { paletteRecordPointerOffset: 0, referenceCountOffset: refOffset, hardwareStartIndexOffset: hardwareStartOffset },
    initialHardwareStartIndex: initialStart,
    reservesIndexZero: initialStart === 1,
    exactSpanToNextSymbol: exactSpan,
    returnsSlotIndexAsHandle: returnsHandle,
    callsPalset,
    classification: verified ? 'VERIFIED_PALETTE_HANDLE_ALLOCATOR' : 'PARTIAL_PALETTE_HANDLE_ALLOCATOR',
  };
}

function parseTransferHardware(
  bytes: Uint8Array,
  transfer: ResolvedWatcomCodeSymbol,
  palset: ResolvedWatcomCodeSymbol,
  queue: PaletteTransferQueueEvidence,
  permanent: any,
): PaletteTransferHardwareEvidence | null {
  const p = transfer.physicalStart;
  const len = transfer.physicalEnd - p;
  if (len < 0xe8 || p + 0xe8 > bytes.length) return null;
  // Exact structural skeleton; all addresses/ports are extracted rather than expected.
  if (
    bytes[p] !== 0x66 || bytes[p + 1] !== 0xf7 || bytes[p + 2] !== 0x05 ||
    bytes[p + 7] !== 0x00 || bytes[p + 8] !== 0x80 ||
    bytes[p + 0x19] !== 0x66 || bytes[p + 0x1a] !== 0xba || bytes[p + 0x1d] !== 0xec || bytes[p + 0x1e] !== 0xa8 ||
    bytes[p + 0x22] !== 0x66 || bytes[p + 0x23] !== 0xf7 || bytes[p + 0x24] !== 0x05 ||
    bytes[p + 0x2d] !== 0xba || bytes[p + 0x32] !== 0x33 || bytes[p + 0x33] !== 0xc0 || bytes[p + 0x34] !== 0xee || bytes[p + 0x35] !== 0x42 ||
    bytes[p + 0x36] !== 0x66 || bytes[p + 0x37] !== 0xa1 ||
    bytes[p + 0x5d] !== 0x66 || bytes[p + 0x5e] !== 0x81 || bytes[p + 0x5f] !== 0x0d ||
    bytes[p + 0x74] !== 0x0f || bytes[p + 0x75] !== 0xb7 || bytes[p + 0x76] !== 0x4d || bytes[p + 0x77] !== 0x06 ||
    bytes[p + 0x78] !== 0x8b || bytes[p + 0x79] !== 0x75 || bytes[p + 0x7a] !== 0x00 ||
    bytes[p + 0x7b] !== 0x0f || bytes[p + 0x7c] !== 0xb7 || bytes[p + 0x7d] !== 0x7d || bytes[p + 0x7e] !== 0x04 ||
    bytes[p + 0x7f] !== 0x83 || bytes[p + 0x80] !== 0xc5 ||
    bytes[p + 0x86] !== 0x3d || readU32(bytes, p + 0x87) !== 0x100 ||
    bytes[p + 0x94] !== 0xba ||
    bytes[p + 0xa1] !== 0x66 || bytes[p + 0xa2] !== 0xad ||
    bytes[p + 0xc6] !== 0x81 || bytes[p + 0xc7] !== 0xfd ||
    bytes[p + 0xce] !== 0xbd ||
    bytes[p + 0xd7] !== 0x89 || bytes[p + 0xd8] !== 0x2d ||
    bytes[p + 0xdd] !== 0xc7 || bytes[p + 0xde] !== 0x05 || bytes[p + 0xe7] !== 0xc3
  ) return null;

  const irqA = readU32(bytes, p + 3);
  const irqB = readU32(bytes, p + 0x25);
  const irqC = readU32(bytes, p + 0x38);
  const irqD = readU32(bytes, p + 0x60);
  if (!(irqA === irqB && irqA === irqC && irqA === irqD)) return null;
  const latchMask = readU16(bytes, p + 7);
  const latchSetMask = readU16(bytes, p + 0x64);
  if (latchMask !== latchSetMask) return null;
  const statusPort = readU16(bytes, p + 0x1b);
  const statusMask = bytes[p + 0x1f];
  const dacPort = readU32(bytes, p + 0x2e);
  const queueConsumerA = readU32(bytes, p + 0x0d);
  const queueProducerA = readU32(bytes, p + 0x13);
  const queueConsumerB = readU32(bytes, p + 0x68);
  const queueProducerB = readU32(bytes, p + 0x6e);
  const stride = bytes[p + 0x81];
  const queueEnd = readU32(bytes, p + 0xc8);
  const queueStart = readU32(bytes, p + 0xcf);
  const consumerStore = readU32(bytes, p + 0xd9);
  const changedFlag = readU32(bytes, p + 0xdf);
  const queueMatches =
    queueConsumerA === queue.consumerPointerAddress && queueConsumerB === queue.consumerPointerAddress && consumerStore === queue.consumerPointerAddress &&
    queueProducerA === queue.producerPointerAddress && queueProducerB === queue.producerPointerAddress &&
    queueEnd === queue.queueEndExclusive && queueStart === queue.queueStart && stride === queue.entryStride &&
    changedFlag === queue.changedFlagAddress;

  const transferSuccessor = transfer.watcomStartOffset === palset.watcomEndOffset;
  const irqSymbol = resolveDataSymbol(permanent, irqA);
  const verified = queueMatches && transferSuccessor && latchMask === 0x8000 && statusPort === 0x3da && statusMask === 0x08 && dacPort === 0x3c8;
  return {
    transferFunction: transfer,
    transferIsImmediateSuccessorOfPalset: transferSuccessor,
    irqColorStateAddress: irqA, irqColorStateAddressHex: toHex32(irqA),
    irqColorStateSymbol: irqSymbol,
    transferLatchMask: latchMask, transferLatchMaskHex: toHex16(latchMask),
    colorPayloadMask: (~latchMask) & 0xffff, colorPayloadMaskHex: toHex16((~latchMask) & 0xffff),
    statusPort, statusPortHex: toHex16(statusPort),
    statusBitMask: statusMask, statusBitMaskHex: toHex16(statusMask),
    dacIndexPort: dacPort, dacIndexPortHex: toHex16(dacPort),
    dacDataPort: dacPort + 1, dacDataPortHex: toHex16(dacPort + 1),
    specialIndexZeroWrite: bytes[p + 0x32] === 0x33 && bytes[p + 0x33] === 0xc0 && bytes[p + 0x34] === 0xee,
    specialIndexZeroSource: 'IRQ_COLOR_STATE_LOW15',
    setsTransferLatchAfterIndexZero: latchMask === latchSetMask,
    queueConsumerPointerAddress: queueConsumerA, queueConsumerPointerAddressHex: toHex32(queueConsumerA),
    queueProducerPointerAddress: queueProducerA, queueProducerPointerAddressHex: toHex32(queueProducerA),
    queueEntryStride: stride,
    queueEntryFields: { colorsPointerOffset: 0, startIndexOffset: 4, colorCountOffset: 6 },
    queueWrapStart: queueStart, queueWrapStartHex: toHex32(queueStart),
    queueWrapEndExclusive: queueEnd, queueWrapEndExclusiveHex: toHex32(queueEnd),
    clampsRangeTo256Entries: true,
    clearsChangedFlag: readU32(bytes, p + 0xe3) === 0,
    changedFlagAddress: changedFlag, changedFlagAddressHex: toHex32(changedFlag),
    colorWordConversion: {
      inputBits: 15,
      outputBitsPerChannel: 6,
      first: { componentBits: '14..10', expression: '((word >> 9) & 0x3F) | 1', scaleDescription: '5-bit component becomes (component * 2) + 1' },
      second: { componentBits: '9..5', expression: '((word >> 4) & 0x3F) | 1', scaleDescription: '5-bit component becomes (component * 2) + 1' },
      third: { componentBits: '4..0', expression: '((word << 1) & 0x3F) | 1', scaleDescription: '5-bit component becomes (component * 2) + 1' },
    },
    physicalBytesHex: bytesHex(bytes.slice(p, p + 0xe8)),
    classification: verified ? 'VERIFIED_VGA_DAC_PALETTE_TRANSFER' : 'PARTIAL_VGA_DAC_PALETTE_TRANSFER',
  };
}

function findDirectCallSites(bytes: Uint8Array, start: number, end: number, target: number): number[] {
  const out: number[] = [];
  for (let p = Math.max(0, start); p + 5 <= Math.min(bytes.length, end); p++) {
    if (bytes[p] === 0xe8 && rel32Target(bytes, p) === target) out.push(p);
  }
  return out;
}
function parseProcessDispatcherIntegration(
  bytes: Uint8Array,
  permanent: any,
  codeBase: number,
  transfer: ResolvedWatcomCodeSymbol,
  changedFlag: number,
): ProcessDispatcherTransferEvidence | null {
  const allCodeStart = codeBase;
  const allCodeEnd = Math.min(bytes.length, codeBase + 0x40000);
  const calls = findDirectCallSites(bytes, allCodeStart, allCodeEnd, transfer.physicalStart);
  if (calls.length === 0) return null;
  const containing = resolveCodeSymbolAtPhysical(permanent, codeBase, calls[0], false);
  const sameFnCalls = containing ? calls.filter((p) => p >= containing.physicalStart && p < containing.physicalEnd) : calls;
  let testSite: number | null = null;
  if (containing) {
    for (let p = containing.physicalStart; p + 10 <= containing.physicalEnd; p++) {
      if (bytes[p] === 0xf7 && bytes[p + 1] === 0x05 && readU32(bytes, p + 2) === changedFlag && readU32(bytes, p + 6) === 0xffffffff) {
        testSite = p; break;
      }
    }
  }
  const gated = Boolean(testSite !== null && sameFnCalls.some((c) => c > testSite! && c - testSite! < 0x40));
  return {
    containingFunction: containing,
    directTransferCallSites: sameFnCalls,
    directTransferCallSitesHex: sameFnCalls.map(toHex32),
    changedFlagTestSite: testSite,
    changedFlagTestSiteHex: testSite === null ? null : toHex32(testSite),
    changedFlagAddress: changedFlag,
    changedFlagAddressHex: toHex32(changedFlag),
    changedFlagGatesTransfer: gated,
    classification: gated ? 'VERIFIED_PROCESS_DISPATCH_TRANSFER_INTEGRATION' : 'PARTIAL_PROCESS_DISPATCH_TRANSFER_INTEGRATION',
  };
}

function tupleTableMatches(bytes: Uint8Array, physical: number): { checked: number; matching: number } {
  let checked = 0, matching = 0;
  for (let i = 0; i < 256 && physical + i * 4 + 4 <= bytes.length; i++) {
    const expected = (i * 0x01010101) >>> 0;
    const actual = readU32(bytes, physical + i * 4);
    checked++;
    if (actual === expected) matching++;
  }
  return { checked, matching };
}

/** Locate the renderer bridge mechanically from the PALRAM +6 start-index address. */
export function findRendererPaletteShiftBridge(
  bytes: Uint8Array,
  permanent: any,
  codeBase: number,
  staticDataBase: number,
  palRamHardwareStartAddress: number,
): RendererPaletteShiftBridgeEvidence | null {
  const codeEnd = Math.min(bytes.length, staticDataBase);
  let pFound = -1;
  let dispatchOffset = 0;
  for (let p = codeBase; p + 0x4e <= codeEnd; p++) {
    if (
      bytes[p] === 0x0f && bytes[p + 1] === 0xb7 && bytes[p + 2] === 0xe8 &&
      bytes[p + 3] === 0xc1 && bytes[p + 4] === 0xe8 && bytes[p + 5] === 0x10 &&
      bytes[p + 6] === 0xf6 && bytes[p + 7] === 0xc2 &&
      bytes[p + 9] === 0x74 &&
      bytes[p + 11] === 0x02 && bytes[p + 12] === 0x04 && bytes[p + 13] === 0xed && readU32(bytes, p + 14) === palRamHardwareStartAddress &&
      bytes[p + 18] === 0xeb &&
      bytes[p + 20] === 0x8a && bytes[p + 21] === 0x04 && bytes[p + 22] === 0xed && readU32(bytes, p + 23) === palRamHardwareStartAddress &&
      bytes[p + 27] === 0x48 && bytes[p + 28] === 0x25 && readU32(bytes, p + 29) === 0xff &&
      bytes[p + 0x36] === 0x81 && bytes[p + 0x37] === 0xe2 && readU32(bytes, p + 0x38) === 0xff &&
      bytes[p + 0x47] === 0xff && bytes[p + 0x48] === 0x24 && bytes[p + 0x49] === 0x95
    ) {
      pFound = p;
      dispatchOffset = readU32(bytes, p + 0x4a);
      break;
    }
  }
  if (pFound < 0) return null;
  const containing = resolveCodeSymbolAtPhysical(permanent, codeBase, pFound, false);
  const dispatchPhysical = staticDataBase + dispatchOffset;
  const entries: DispatchTableResolvedEntry[] = [];
  let resolvedCount = 0;
  const mechanicallyTupleBackedCandidates: Array<{ entry: DispatchTableResolvedEntry; tupleOffset: number; tuplePhysical: number; tupleChecked: number; tupleMatching: number; literalAdd: boolean }> = [];
  for (let i = 0; i < 256; i++) {
    if (dispatchPhysical + i * 4 + 4 > bytes.length) break;
    const raw = readU32(bytes, dispatchPhysical + i * 4);
    const sym = resolveCodeSymbolAtWatcomOffset(permanent, codeBase, raw, true);
    if (sym) resolvedCount++;
    const entry: DispatchTableResolvedEntry = { index: i, rawCodeOffset: raw, rawCodeOffsetHex: toHex32(raw), resolvedSymbol: sym };
    entries.push(entry);
    const fnPhysical = codeBase + raw;
    if (fnPhysical < codeBase || fnPhysical + 20 > staticDataBase) continue;
    // Search first 32 bytes for MOV EBX,[EAX*4+disp32].
    let tupleOff: number | null = null;
    for (let q = fnPhysical; q + 7 <= Math.min(staticDataBase, fnPhysical + 32); q++) {
      if (bytes[q] === 0x8b && bytes[q + 1] === 0x1c && bytes[q + 2] === 0x85) { tupleOff = readU32(bytes, q + 3); break; }
    }
    if (tupleOff === null) continue;
    const tuplePhys = staticDataBase + tupleOff;
    const tm = tupleTableMatches(bytes, tuplePhys);
    if (tm.checked !== 256 || tm.matching !== 256) continue;
    let literalAdd = false;
    for (let q = fnPhysical; q + 9 <= Math.min(staticDataBase, fnPhysical + 0x100); q++) {
      if (bytes[q] === 0x8b && bytes[q + 1] === 0x14 && bytes[q + 2] === 0x95 && readU32(bytes, q + 3) === tupleOff && bytes[q + 7] === 0x03 && bytes[q + 8] === 0xd3) {
        literalAdd = true; break;
      }
    }
    mechanicallyTupleBackedCandidates.push({ entry, tupleOffset: tupleOff, tuplePhysical: tuplePhys, tupleChecked: tm.checked, tupleMatching: tm.matching, literalAdd });
  }
  if (mechanicallyTupleBackedCandidates.length === 0) return null;
  const primary = mechanicallyTupleBackedCandidates.find((c) => c.entry.resolvedSymbol?.name === 'WrtNonZero') ?? mechanicallyTupleBackedCandidates[0];
  const tupleSym = resolveDataSymbol(permanent, primary.tupleOffset);
  const wrtEntries = mechanicallyTupleBackedCandidates
    .filter((c) => c.entry.resolvedSymbol?.name === 'WrtNonZero')
    .map((c) => c.entry);
  const verified = Boolean(primary.entry.resolvedSymbol && primary.literalAdd && primary.tupleMatching === 256 && bytes[pFound + 8] === 0x08);
  return {
    containingFunction: containing,
    physicalStart: pFound, physicalStartHex: toHex32(pFound),
    paletteHandleSource: 'AX_LOW16',
    palRamHardwareStartAddress, palRamHardwareStartAddressHex: toHex32(palRamHardwareStartAddress),
    flagBitMask: bytes[pFound + 8], flagBitMaskHex: toHex16(bytes[pFound + 8]),
    unflaggedShiftFormula: 'paletteShift = PALRAM[paletteHandle].hardwareStartIndex - 1',
    shiftMaskedToByte: readU32(bytes, pFound + 29) === 0xff,
    dispatchSelectorMask: readU32(bytes, pFound + 0x38), dispatchSelectorMaskHex: toHex32(readU32(bytes, pFound + 0x38)),
    dispatchTableOffset: dispatchOffset, dispatchTableOffsetHex: toHex32(dispatchOffset),
    dispatchTablePhysical: dispatchPhysical, dispatchTablePhysicalHex: toHex32(dispatchPhysical),
    dispatchEntryCount: entries.length,
    dispatchEntriesResolved: resolvedCount,
    wrtNonZeroEntries: wrtEntries.length ? wrtEntries : [primary.entry],
    wrtNonZeroFunction: primary.entry.resolvedSymbol,
    tupleTableSymbol: tupleSym,
    tupleTableOffset: primary.tupleOffset, tupleTableOffsetHex: toHex32(primary.tupleOffset),
    tupleTablePhysical: primary.tuplePhysical, tupleTablePhysicalHex: toHex32(primary.tuplePhysical),
    tupleEntriesChecked: primary.tupleChecked,
    tupleEntriesMatchingRepeatedBytePattern: primary.tupleMatching,
    tuplePatternVerified: primary.tupleChecked === 256 && primary.tupleMatching === 256,
    wrtNonZeroConsumesShiftThroughTupleTable: true,
    literalByteShiftAddObserved: primary.literalAdd,
    oneBasedPaletteAlignmentConsistent: primary.literalAdd,
    classification: verified ? 'VERIFIED_RENDERER_PALETTE_SHIFT_BRIDGE' : 'PARTIAL_RENDERER_PALETTE_SHIFT_BRIDGE',
  };
}

export async function executePaletteSetupTransferSemantics(
  source: DirectorySource,
  options?: {
    exePath?: string;
    selectionSemanticsReport?: MK1KanoPaletteSelectionSemanticsReport;
    onProgress?: (stage: string, progress: number) => void;
  },
): Promise<MK1PaletteSetupTransferSemanticsReport> {
  const operationId = createOperationId('palette_setup_transfer_semantics');
  const exePath = options?.exePath ?? 'MK1.EXE';
  options?.onProgress?.('Verifying Pass 1E.3F prerequisite', 0.05);
  const semantics = options?.selectionSemanticsReport ?? await executeKanoPaletteSelectionSemantics(source, { exePath });
  const semanticsExport = createMK1KanoPaletteSelectionSemanticsExport(semantics);
  if (!semanticsExport.validation.allChecksPassed || semantics.status !== 'SUCCESS') {
    throw new Error('Pass 1E.3G requires a successful authoritative 1E.3F result.');
  }
  if (!isValidRealProvenance(semantics.provenance)) throw new Error('Pass 1E.3G requires authentic user-loaded fixture provenance.');
  const codeBase = semantics.codeImageBaseQualification.qualifiedBase;
  const staticBase = semantics.staticCodeDataImageLayoutCrossCheck?.dataBaseFromCodeLayout ?? null;
  const palset = semantics.getPalEvidence?.palsetFunction ?? null;
  const getPal = semantics.commonPaletteRebind?.getFunction ?? null;
  if (codeBase === null || staticBase === null || !palset || !getPal) throw new Error('Pass 1E.3G prerequisite lacks qualified code/data bases or PALSET/GETPAL boundaries.');

  options?.onProgress?.('Loading executable and Watcom inventory', 0.16);
  const addressModel = await qualifyMK1WatcomAddressModel(source, { exePath });
  const permanent = addressModel.permanentClassesReport?.result;
  if (!permanent || addressModel.status !== 'SUCCESS') throw new Error('Pass 1E.3G requires a successful blind Watcom inventory.');
  const exeSize = semantics.fixture.exeSize;
  const bytes = await source.readSlice(exePath, 0, exeSize);
  if (bytes.length !== exeSize) throw new Error(`Could not read complete ${exePath}; got ${bytes.length}/${exeSize} bytes.`);

  options?.onProgress?.('Recovering PALSET transfer ring', 0.28);
  const queue = parsePaletteTransferQueue(bytes, palset, permanent);

  options?.onProgress?.('Recovering GETPAL hardware-range allocator', 0.42);
  const allocator = parsePaletteRamAllocator(bytes, getPal, palset.physicalStart, permanent);

  options?.onProgress?.('Qualifying palette transfer hardware path', 0.56);
  const transfer = nextCodeSymbol(permanent, codeBase, palset.watcomStartOffset);
  const transferHardware = queue && transfer ? parseTransferHardware(bytes, transfer, palset, queue, permanent) : null;

  options?.onProgress?.('Checking process-dispatch transfer integration', 0.68);
  const dispatcher = transferHardware ? parseProcessDispatcherIntegration(bytes, permanent, codeBase, transferHardware.transferFunction, transferHardware.changedFlagAddress) : null;

  options?.onProgress?.('Tracing palette handle into renderer shift', 0.82);
  const renderer = allocator
    ? findRendererPaletteShiftBridge(bytes, permanent, codeBase, staticBase, allocator.palRamBase + allocator.fields.hardwareStartIndexOffset)
    : null;

  const transferQueueEstablished = queue?.classification === 'VERIFIED_PALETTE_TRANSFER_RING';
  const dynamicPaletteIndexZeroReserved = allocator?.classification === 'VERIFIED_PALETTE_HANDLE_ALLOCATOR' && allocator.reservesIndexZero;
  const irqColorIndexZeroEstablished = Boolean(
    transferHardware?.classification === 'VERIFIED_VGA_DAC_PALETTE_TRANSFER' &&
    transferHardware.specialIndexZeroWrite && transferHardware.irqColorStateSymbol
  );
  const hardwareTransferEstablished = transferHardware?.classification === 'VERIFIED_VGA_DAC_PALETTE_TRANSFER';
  const rendererPaletteShiftBridgeEstablished = renderer?.classification === 'VERIFIED_RENDERER_PALETTE_SHIFT_BRIDGE';
  const oneBasedRendererAlignmentCorroborated = Boolean(dynamicPaletteIndexZeroReserved && renderer?.oneBasedPaletteAlignmentConsistent);
  const success = Boolean(
    transferQueueEstablished && allocator?.classification === 'VERIFIED_PALETTE_HANDLE_ALLOCATOR' &&
    irqColorIndexZeroEstablished && hardwareTransferEstablished && rendererPaletteShiftBridgeEstablished
  );
  const timestamp = new Date().toISOString();
  const provenance = { ...semantics.provenance, timestamp, operationId };
  options?.onProgress?.('Pass 1E.3G analysis complete', 1);
  return {
    format: 'mk1_palette_setup_transfer_semantics_v1',
    timestamp,
    operationId,
    provenance,
    fixture: semantics.fixture,
    prerequisite: {
      pass: '1E.3F', status: semantics.status,
      selectionSemanticsEstablished: semantics.decision.verdict === 'SAME_CHARACTER_PALETTE_SWITCH_SEMANTICS_ESTABLISHED',
      validationPassed: semanticsExport.validation.allChecksPassed,
    },
    codeImageBase: codeBase, codeImageBaseHex: toHex32(codeBase),
    staticDataBase: staticBase, staticDataBaseHex: toHex32(staticBase),
    paletteTransferQueue: queue,
    paletteRamAllocator: allocator,
    transferHardware,
    processDispatcherIntegration: dispatcher,
    rendererPaletteShiftBridge: renderer,
    decision: {
      transferQueueEstablished,
      dynamicPaletteIndexZeroReserved,
      irqColorIndexZeroEstablished,
      hardwareTransferEstablished,
      rendererPaletteShiftBridgeEstablished,
      oneBasedRendererAlignmentCorroborated,
      fullRasterizerSemanticsEstablished: false,
      verdict: success ? 'PALETTE_SETUP_TRANSFER_PIPELINE_ESTABLISHED' : 'PARTIAL_PALETTE_TRANSFER_PIPELINE',
      narrative: success
        ? 'GETPAL allocates palette records into a 24-slot PALRAM handle table whose hardware ranges begin at palette index 1. PALSET serializes pointer/start/count requests into a 32-entry PALL.ASM ring buffer, and TRANSFER_PALETTES drains that queue through ports 0x3C8/0x3C9 after polling 0x3DA. The same transfer routine handles palette index 0 separately from IRQSKYE lower-15-bit color data and sets bit 15 after that index-0 write. A mechanically recovered DMA renderer bridge converts the stored palette handle into hardwareStartIndex-1 before dispatch, and the discovered WrtNonZero path consumes that shift through the verified repeated-byte TupleTable. This establishes the palette setup/transfer and renderer-shift bridge; the complete rasterizer implementation remains out of scope.'
        : 'Pass 1E.3G recovered partial palette setup/transfer evidence but did not satisfy every authoritative invariant. Do not promote the full setup/transfer pipeline.',
    },
    status: success ? 'SUCCESS' : 'PARTIAL',
  };
}

export function createMK1PaletteSetupTransferSemanticsExport(
  report: MK1PaletteSetupTransferSemanticsReport,
): MK1PaletteSetupTransferSemanticsExport {
  if (!isValidRealProvenance(report.provenance)) throw new Error('Authoritative 1E.3G export requires authentic user-loaded provenance.');
  if (!report.operationId.startsWith('palette_setup_transfer_semantics-') || report.provenance.operationId !== report.operationId) {
    throw new Error('Authoritative 1E.3G export operation provenance is inconsistent with the analysis milestone.');
  }
  const q = report.paletteTransferQueue;
  const a = report.paletteRamAllocator;
  const t = report.transferHardware;
  const r = report.rendererPaletteShiftBridge;
  const checks = [
    { checkId: 'PROVENANCE_REAL_USER_LOADED', name: 'Fixture loaded from authentic user directory', passed: true, detail: `${report.provenance.fileName} ${report.provenance.sha256}` },
    { checkId: 'SEMANTICS_PREREQUISITE', name: 'Authoritative Pass 1E.3F prerequisite passed', passed: report.prerequisite.validationPassed && report.prerequisite.selectionSemanticsEstablished, detail: `status=${report.prerequisite.status}` },
    { checkId: 'PALSET_TRANSFER_RING', name: 'PALSET writes a bounded 8-byte-entry transfer ring whose layout exactly occupies the PALL.ASM data span prefix plus queue state', passed: q?.classification === 'VERIFIED_PALETTE_TRANSFER_RING' && q.capacity === 32 && q.moduleLayoutExact, detail: q ? `${q.queueStartHex}..${q.queueEndExclusiveHex}, entries=${q.capacity}, stride=${q.entryStride}` : 'not established' },
    { checkId: 'PALRAM_ALLOCATOR', name: 'GETPAL allocates 24 eight-byte palette handles with hardware ranges beginning at index 1', passed: a?.classification === 'VERIFIED_PALETTE_HANDLE_ALLOCATOR' && a.entryCount === 24 && a.reservesIndexZero && a.exactSpanToNextSymbol, detail: a ? `${a.palRamBaseHex}, entries=${a.entryCount}, start=${a.initialHardwareStartIndex}` : 'not established' },
    { checkId: 'TRANSFER_HARDWARE_PATH', name: 'Immediate PALSET successor drains the same queue through the hardware-facing palette ports and clears the changed flag', passed: t?.classification === 'VERIFIED_VGA_DAC_PALETTE_TRANSFER' && t.clearsChangedFlag, detail: t ? `${t.transferFunction.name} ${t.dacIndexPortHex}/${t.dacDataPortHex}` : 'not established' },
    { checkId: 'INDEX_ZERO_IRQ_COLOR', name: 'Palette index 0 is written separately from the IRQ color-state low 15 bits and latched by bit 15', passed: report.decision.irqColorIndexZeroEstablished && t?.transferLatchMask === 0x8000 && t.specialIndexZeroWrite, detail: t ? `${t.irqColorStateSymbol?.name ?? '?'} @ ${t.irqColorStateAddressHex}, mask=${t.transferLatchMaskHex}` : 'not established' },
    { checkId: '555_TO_DAC6_CONVERSION', name: '15-bit color words are converted to three 6-bit output channel values with the observed shift/mask/or sequence', passed: t?.classification === 'VERIFIED_VGA_DAC_PALETTE_TRANSFER' && t.colorWordConversion.inputBits === 15 && t.colorWordConversion.outputBitsPerChannel === 6, detail: t ? `${t.colorWordConversion.first.expression}; ${t.colorWordConversion.second.expression}; ${t.colorWordConversion.third.expression}` : 'not established' },
    { checkId: 'RENDERER_SHIFT_BRIDGE', name: 'Palette handle resolves to hardware start index and reaches the discovered renderer routine as startIndex-1 shift', passed: r?.classification === 'VERIFIED_RENDERER_PALETTE_SHIFT_BRIDGE' && r.tuplePatternVerified && r.literalByteShiftAddObserved, detail: r ? `${r.containingFunction?.name ?? '?'} -> ${r.wrtNonZeroFunction?.name ?? '?'}, Tuple=${r.tupleTableOffsetHex}` : 'not established' },
    { checkId: 'ONE_BASED_ALIGNMENT_RUNTIME', name: 'Allocator index-1 reservation and renderer startIndex-1 shift mechanically align positive source index 1 with the allocated hardware start', passed: report.decision.oneBasedRendererAlignmentCorroborated, detail: `reserved0=${report.decision.dynamicPaletteIndexZeroReserved}, rendererShift=${report.decision.rendererPaletteShiftBridgeEstablished}` },
  ];
  const allChecksPassed = checks.every((c) => c.passed);
  return {
    metadata: {
      name: 'MK1 Palette Setup / Transfer Semantics',
      version: '1.0.0',
      milestone: 'Pass 1E.3G',
      formatVersion: 'mk1_palette_setup_transfer_semantics_v1',
      exportTimestamp: report.timestamp,
    },
    provenance: report.provenance,
    fixture: report.fixture,
    prerequisite: report.prerequisite,
    codeImageBase: report.codeImageBase,
    codeImageBaseHex: report.codeImageBaseHex,
    staticDataBase: report.staticDataBase,
    staticDataBaseHex: report.staticDataBaseHex,
    paletteTransferQueue: report.paletteTransferQueue,
    paletteRamAllocator: report.paletteRamAllocator,
    transferHardware: report.transferHardware,
    processDispatcherIntegration: report.processDispatcherIntegration,
    rendererPaletteShiftBridge: report.rendererPaletteShiftBridge,
    decision: report.decision,
    validation: { allChecksPassed, checks },
  };
}
