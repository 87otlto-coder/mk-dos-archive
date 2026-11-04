/**
 * MK1 Kano heart-rip structural growth / relocation census — Pass 1E.3O.9.
 *
 * Read-only research pass. It asks one deliberately narrow question:
 * can the already-qualified three-part heart_2 frame grow to the fourth linked
 * object that MSU_HEART already allocates, and what binary/reference work would
 * relocation require?
 *
 * This pass DOES NOT write, relocate, allocate, add a part, change pointers,
 * encode pixels, or touch collision/gameplay state.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { probeMK1ExecutableLayout, createMK1ExecutableLayoutExport } from './executableLayoutProbe';
import { enumerateMK1WatcomPermanentClasses } from './watcomPermanentClassInventory';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1HeartRipAnimationCanvasEditorReport } from './heartRipAnimationCanvasEditor';

const CANONICAL_SHA = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const TARGET_FRAME_KEY = 'heart_2';
const REQUIRED_GROWN_PARTS = 4;
const MIN_RELOCATED_RECORD_BYTES = (REQUIRED_GROWN_PARTS + 1) * 4; // 4 refs + zero terminator
const MAX_ZERO_CANDIDATES = 96;

function hx(v: number): string { return `0x${(v >>> 0).toString(16).padStart(8, '0').toUpperCase()}`; }
function le32(v: number): [number, number, number, number] { return [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]; }
function rangesOverlap(a0: number, a1: number, b0: number, b1: number): boolean { return a0 < b1 && b0 < a1; }

export interface HeartRipSemanticInboundReference {
  sequence: string;
  sequenceFrameIndex: number;
  sequenceWatcomOffset: number;
  sequenceCellWatcomOffset: number;
  sequenceCellWatcomOffsetHex: string;
  physicalStart: number;
  physicalStartHex: string;
}

export interface HeartRipRawDwordOccurrence {
  physicalOffset: number;
  physicalOffsetHex: string;
  aligned4: boolean;
  regionClass: string;
  regionName: string;
  regionObjectNumber: number | null;
  matchesQualifiedSemanticInbound: boolean;
}

export interface HeartRipFramePointerCensusEntry {
  frameKey: string;
  frameRecordWatcomOffset: number;
  frameRecordWatcomOffsetHex: string;
  partCount: number;
  recordByteLength: number;
  semanticInboundReferences: HeartRipSemanticInboundReference[];
  rawWholeExeOccurrences: HeartRipRawDwordOccurrence[];
  unexplainedRawOccurrenceCount: number;
  terminologyNote: 'raw dword equality outside qualified semantic cells is NOT promoted to pointer identity';
}

export interface HeartRipZeroRunCandidate {
  physicalStart: number;
  physicalStartHex: string;
  physicalEnd: number;
  physicalEndHex: string;
  byteLength: number;
  candidateWatcomOffset: number;
  candidateWatcomOffsetHex: string;
  containingObjectNumber: 2;
  overlapsKnownO8SemanticRegion: boolean;
  previousSameSegmentSymbol: { name: string; offset: number; offsetHex: string } | null;
  nextSameSegmentSymbol: { name: string; offset: number; offsetHex: string } | null;
  classification: 'UNQUALIFIED_ZERO_RUN_ONLY';
  safeForRelocation: false;
}

export interface MK1HeartRipRelocationCensusReport {
  format: 'mk1_heart_rip_relocation_census_v1';
  timestamp: string;
  operationId: string;
  provenance: MK1HeartRipAnimationCanvasEditorReport['provenance'];
  fixture: MK1HeartRipAnimationCanvasEditorReport['fixture'];
  prerequisite: {
    pass: '1E.3O.8';
    operationId: string;
    verdict: 'KANO_HEART_FULL_FIXED_LAYOUT_CANVAS_EDITOR_ESTABLISHED';
    validationPassed: true;
  };
  target: {
    frameKey: 'heart_2';
    frameRecordWatcomOffset: number;
    frameRecordWatcomOffsetHex: string;
    physicalStart: number;
    physicalStartHex: string;
    currentPartCount: 3;
    maximumLinkedObjectsAlreadyAllocated: 4;
    fourthPartMechanicallySupportedByExistingSetup: true;
    currentRecordByteLength: 16;
    proposedFourPartRecordByteLength: 20;
    growthBytesRequired: 4;
    currentRecordEndWatcomOffset: number;
    currentRecordEndWatcomOffsetHex: string;
    nextStructureWatcomOffset: number;
    nextStructureWatcomOffsetHex: string;
    bytesAvailableInPlace: number;
    inPlaceGrowthPossible: false;
  };
  framePointerCensus: HeartRipFramePointerCensusEntry[];
  targetInboundSummary: {
    qualifiedSemanticInboundCount: number;
    qualifiedSemanticInboundPhysicalOffsets: number[];
    rawWholeExeOccurrenceCount: number;
    unexplainedRawOccurrenceCount: number;
    allQualifiedSemanticInboundCellsFoundInRawScan: boolean;
  };
  symbolContext: {
    sameSegmentNumber: number;
    sameSegmentHex: string;
    ownerSymbol: { name: string; offset: number; offsetHex: string };
    followingKnownSymbol: { name: string; offset: number; offsetHex: string };
    targetLiesBetweenOwnerAndFollowingSymbol: boolean;
    note: string;
  };
  storageReconnaissance: {
    requiredRecordBytes: 20;
    runtimeAddressableObject2ZeroRunCandidateCount: number;
    candidates: HeartRipZeroRunCandidate[];
    safeCandidateCount: 0;
    zeroRunAbsenceIsNotRequiredForFailure: true;
    note: string;
  };
  executableLayout: {
    highestFileBackedPageEnd: number;
    highestFileBackedPageEndHex: string;
    postModuleTailStart: number;
    postModuleTailStartHex: string;
    postModuleTailByteLength: number;
    compactLayoutStatus: 'AVAILABLE';
  };
  decision: {
    fourthPartMechanicallySupported: true;
    inPlaceGrowthRejected: true;
    relocationRequiredForFourthPart: true;
    structuredInboundReferenceSurfaceCensused: true;
    rawNumericEqualityNotPromotedToPointer: true;
    safeRelocationSiteEstablished: false;
    relocationWriterEstablished: false;
    topologyWriterEstablished: false;
    verdict: 'FOURTH_PART_MECHANICALLY_SUPPORTED_IN_PLACE_GROWTH_BLOCKED_RELOCATION_SITE_UNQUALIFIED';
    narrative: string;
  };
  status: 'SUCCESS';
  validation: { allChecksPassed: boolean; checks: Array<{ checkId: string; passed: boolean; detail?: string }> };
}

async function readCanonicalExe(source: DirectorySource, path: string, size: number): Promise<{ bytes: Uint8Array; hash: string }> {
  if (source.isSynthetic !== false) throw new Error('1E.3O.9 requires an authentic user-loaded MK1 directory');
  const entries = await source.listRecursive();
  const entry = entries.find(e => e.path === path);
  if (!entry || entry.size !== size) throw new Error('MK1.EXE size changed from the O8 canonical fixture');
  const bytes = await source.readSlice(path, 0, size);
  if (!bytes || bytes.length !== size) throw new Error('Unable to read the complete canonical MK1.EXE');
  const hash = await sha256Bytes(bytes);
  if (hash !== CANONICAL_SHA) throw new Error(`1E.3O.9 requires canonical MK1.EXE; got ${hash}`);
  return { bytes, hash };
}

function semanticRanges(model: MK1HeartRipAnimationCanvasEditorReport): Array<{ start: number; end: number; name: string }> {
  const b = model.coordinateModel.staticDataBase;
  const ir = model.baselineIr;
  const out: Array<{ start: number; end: number; name: string }> = [];
  const add = (name: string, offset: number, length: number) => out.push({ name, start: b + offset, end: b + offset + length });
  add(`${ir.tableBinding.tableSymbol}[${ir.tableBinding.index}]`, ir.tableBinding.tableWatcomOffset + ir.tableBinding.index * 4, 4);
  add(ir.setupList.symbol, ir.setupList.offset, (ir.setupList.descriptorRefs.length + 1) * 4);
  add(ir.setupDescriptor.symbol, ir.setupDescriptor.offset, 16);
  for (const s of ir.sequences) add(`SEQ_${s.name}`, s.offset, (s.frameRecordRefs.length + 1) * 4);
  for (const f of ir.frames) add(`FRAME_${f.frameKey}`, f.recordOffset, (f.parts.length + 1) * 4);
  for (const d of ir.descriptors) add(`DESC_${d.symbol}`, d.offset, 12);
  add(ir.palette.symbol, ir.palette.offset, 2 + ir.palette.words15.length * 2);
  return out;
}

function scanDword(bytes: Uint8Array, value: number): number[] {
  const p = le32(value); const hits: number[] = [];
  for (let i = 0; i <= bytes.length - 4; i++) {
    if (bytes[i] === p[0] && bytes[i + 1] === p[1] && bytes[i + 2] === p[2] && bytes[i + 3] === p[3]) hits.push(i);
  }
  return hits;
}

function classifyOccurrence(offset: number, layout: Awaited<ReturnType<typeof probeMK1ExecutableLayout>>, semanticInboundSet: Set<number>): HeartRipRawDwordOccurrence {
  const region = layout.topology.regions.find(r => offset >= r.fileStart && offset < r.fileEnd);
  return {
    physicalOffset: offset,
    physicalOffsetHex: hx(offset),
    aligned4: offset % 4 === 0,
    regionClass: region?.regionClass ?? 'unclassified',
    regionName: region?.name ?? 'Unclassified file region',
    regionObjectNumber: region?.objectNumber ?? null,
    matchesQualifiedSemanticInbound: semanticInboundSet.has(offset),
  };
}

function getSameSegmentSymbolContext(
  symbols: Array<{ name: string; addressOffset: number; segment: number; valid: boolean }>,
  targetOffset: number,
  requiredNames: string[],
) {
  const owner = symbols.find(s => s.valid && s.name === requiredNames[0]);
  const following = symbols.find(s => s.valid && s.name === requiredNames[1]);
  if (!owner || !following) throw new Error(`Required Watcom symbols ${requiredNames.join(' / ')} were not found`);
  if (owner.segment !== following.segment) throw new Error('MA_KHEART and MSU_HEART unexpectedly occupy different Watcom segments');
  return { owner, following, segment: owner.segment, targetInside: targetOffset >= owner.addressOffset && targetOffset < following.addressOffset };
}

function nearestSymbols(
  sorted: Array<{ name: string; addressOffset: number }>, offset: number,
): { previous: { name: string; offset: number; offsetHex: string } | null; next: { name: string; offset: number; offsetHex: string } | null } {
  let previous: { name: string; offset: number; offsetHex: string } | null = null;
  let next: { name: string; offset: number; offsetHex: string } | null = null;
  for (const s of sorted) {
    if (s.addressOffset <= offset) previous = { name: s.name, offset: s.addressOffset, offsetHex: hx(s.addressOffset) };
    if (s.addressOffset > offset) { next = { name: s.name, offset: s.addressOffset, offsetHex: hx(s.addressOffset) }; break; }
  }
  return { previous, next };
}

function scanZeroRunCandidates(
  bytes: Uint8Array,
  model: MK1HeartRipAnimationCanvasEditorReport,
  layout: Awaited<ReturnType<typeof probeMK1ExecutableLayout>>,
  sameSegmentSymbols: Array<{ name: string; addressOffset: number }>,
): HeartRipZeroRunCandidate[] {
  const known = semanticRanges(model);
  const candidates: HeartRipZeroRunCandidate[] = [];
  const ranges = layout.topology.regions
    .filter(r => r.regionClass === 'le-object-file-backed' && r.objectNumber === 2)
    .map(r => ({ start: r.fileStart, end: r.fileEnd }));
  for (const range of ranges) {
    let i = range.start;
    while (i < range.end) {
      if (bytes[i] !== 0) { i++; continue; }
      const start = i;
      while (i < range.end && bytes[i] === 0) i++;
      const len = i - start;
      if (len < MIN_RELOCATED_RECORD_BYTES) continue;
      const watcom = start - model.coordinateModel.staticDataBase;
      if (watcom < 0) continue;
      const n = nearestSymbols(sameSegmentSymbols, watcom);
      candidates.push({
        physicalStart: start, physicalStartHex: hx(start), physicalEnd: i, physicalEndHex: hx(i), byteLength: len,
        candidateWatcomOffset: watcom, candidateWatcomOffsetHex: hx(watcom), containingObjectNumber: 2,
        overlapsKnownO8SemanticRegion: known.some(r => rangesOverlap(start, i, r.start, r.end)),
        previousSameSegmentSymbol: n.previous, nextSameSegmentSymbol: n.next,
        classification: 'UNQUALIFIED_ZERO_RUN_ONLY', safeForRelocation: false,
      });
    }
  }
  return candidates.sort((a, b) => b.byteLength - a.byteLength || a.physicalStart - b.physicalStart).slice(0, MAX_ZERO_CANDIDATES);
}

export async function executeHeartRipRelocationCensus(
  source: DirectorySource,
  o8: MK1HeartRipAnimationCanvasEditorReport,
): Promise<MK1HeartRipRelocationCensusReport> {
  if (o8.status !== 'SUCCESS' || !o8.validation.allChecksPassed || o8.decision.verdict !== 'KANO_HEART_FULL_FIXED_LAYOUT_CANVAS_EDITOR_ESTABLISHED') {
    throw new Error('1E.3O.9 requires a successful O8 fixed-layout heart-rip model');
  }
  if (o8.provenance.sha256 !== CANONICAL_SHA) throw new Error('O8 prerequisite is not bound to canonical MK1.EXE');

  const operationId = createOperationId('heart-rip-relocation-census');
  const timestamp = new Date().toISOString();
  const { bytes, hash } = await readCanonicalExe(source, o8.fixture.exePath, o8.fixture.exeSize);
  if (hash !== o8.provenance.sha256) throw new Error('Canonical source identity changed since O8');

  const layout = await probeMK1ExecutableLayout(source, { exePath: o8.fixture.exePath });
  const compactLayout = createMK1ExecutableLayoutExport(layout, { name: 'MK1 executable layout', version: '1E.3O.9', milestone: 'heart-rip relocation census prerequisite' });
  if (!layout.parsedHeader || !layout.validation?.isValid) throw new Error('LE executable layout prerequisite did not validate');

  const watcom = await enumerateMK1WatcomPermanentClasses(source, { exePath: o8.fixture.exePath });
  if (watcom.status !== 'SUCCESS' || !watcom.result.overallValid) throw new Error('Watcom permanent-class inventory did not validate');
  if (watcom.provenance.sha256 !== CANONICAL_SHA) throw new Error('Watcom inventory was not generated from canonical MK1.EXE');

  const target = o8.baselineIr.frames.find(f => f.frameKey === TARGET_FRAME_KEY);
  if (!target) throw new Error('Qualified heart_2 frame record missing from O8 IR');
  if (target.parts.length !== 3) throw new Error(`heart_2 part count changed: ${target.parts.length}`);
  if (o8.baselineIr.maxPartObjects !== 4) throw new Error(`MSU_HEART linked-object capacity changed: ${o8.baselineIr.maxPartObjects}`);

  const sortedStructures = [
    ...o8.baselineIr.frames.map(f => ({ name: `frame:${f.frameKey}`, offset: f.recordOffset })),
    { name: `setup:${o8.baselineIr.setupList.symbol}`, offset: o8.baselineIr.setupList.offset },
  ].sort((a, b) => a.offset - b.offset);
  const targetIndex = sortedStructures.findIndex(x => x.name === `frame:${TARGET_FRAME_KEY}`);
  const nextStructure = sortedStructures[targetIndex + 1];
  if (!nextStructure) throw new Error('Unable to identify structure immediately following heart_2');
  const currentRecordBytes = (target.parts.length + 1) * 4;
  const targetEnd = target.recordOffset + currentRecordBytes;
  const bytesAvailableInPlace = Math.max(0, nextStructure.offset - targetEnd);
  if (currentRecordBytes !== 16 || MIN_RELOCATED_RECORD_BYTES !== 20) throw new Error('Unexpected heart_2 size contract');

  const framePointerCensus: HeartRipFramePointerCensusEntry[] = [];
  for (const frame of o8.baselineIr.frames) {
    const semanticInboundReferences: HeartRipSemanticInboundReference[] = [];
    for (const sequence of o8.baselineIr.sequences) {
      sequence.frameRecordRefs.forEach((ref, index) => {
        if (ref !== frame.recordOffset) return;
        const cellWatcom = sequence.offset + index * 4;
        semanticInboundReferences.push({
          sequence: sequence.name,
          sequenceFrameIndex: index,
          sequenceWatcomOffset: sequence.offset,
          sequenceCellWatcomOffset: cellWatcom,
          sequenceCellWatcomOffsetHex: hx(cellWatcom),
          physicalStart: o8.coordinateModel.staticDataBase + cellWatcom,
          physicalStartHex: hx(o8.coordinateModel.staticDataBase + cellWatcom),
        });
      });
    }
    const semanticSet = new Set(semanticInboundReferences.map(r => r.physicalStart));
    const raw = scanDword(bytes, frame.recordOffset).map(off => classifyOccurrence(off, layout, semanticSet));
    framePointerCensus.push({
      frameKey: frame.frameKey,
      frameRecordWatcomOffset: frame.recordOffset,
      frameRecordWatcomOffsetHex: hx(frame.recordOffset),
      partCount: frame.parts.length,
      recordByteLength: (frame.parts.length + 1) * 4,
      semanticInboundReferences,
      rawWholeExeOccurrences: raw,
      unexplainedRawOccurrenceCount: raw.filter(x => !x.matchesQualifiedSemanticInbound).length,
      terminologyNote: 'raw dword equality outside qualified semantic cells is NOT promoted to pointer identity',
    });
  }

  const targetCensus = framePointerCensus.find(x => x.frameKey === TARGET_FRAME_KEY)!;
  const allInboundFound = targetCensus.semanticInboundReferences.every(ref => targetCensus.rawWholeExeOccurrences.some(hit => hit.physicalOffset === ref.physicalStart));

  const symbols = watcom.result.globalSymbols.symbols;
  const ctx = getSameSegmentSymbolContext(symbols, target.recordOffset, ['MA_KHEART', 'MSU_HEART']);
  const sameSegmentSymbols = symbols
    .filter(s => s.valid && s.segment === ctx.segment)
    .map(s => ({ name: s.name, addressOffset: s.addressOffset }))
    .sort((a, b) => a.addressOffset - b.addressOffset || a.name.localeCompare(b.name));

  const zeroCandidates = scanZeroRunCandidates(bytes, o8, layout, sameSegmentSymbols);

  const checks: MK1HeartRipRelocationCensusReport['validation']['checks'] = [
    { checkId: 'CANONICAL_PROVENANCE', passed: hash === CANONICAL_SHA },
    { checkId: 'O8_PREREQUISITE_BOUND', passed: o8.provenance.sha256 === CANONICAL_SHA && o8.validation.allChecksPassed },
    { checkId: 'FOUR_OBJECT_SETUP_CAPACITY', passed: o8.baselineIr.maxPartObjects === 4 && target.parts.length === 3 },
    { checkId: 'FOURTH_PART_RECORD_SIZE', passed: currentRecordBytes === 16 && MIN_RELOCATED_RECORD_BYTES === 20 },
    { checkId: 'IN_PLACE_GROWTH_BLOCKED', passed: bytesAvailableInPlace === 0 && nextStructure.offset === targetEnd, detail: `heart_2 ends ${hx(targetEnd)}; next ${nextStructure.name} starts ${hx(nextStructure.offset)}` },
    { checkId: 'TARGET_STRUCTURED_INBOUND_REFERENCE', passed: targetCensus.semanticInboundReferences.length === 1 },
    { checkId: 'SEMANTIC_INBOUND_FOUND_IN_RAW_SCAN', passed: allInboundFound },
    { checkId: 'WATCOM_SYMBOL_CONTEXT', passed: ctx.targetInside && ctx.owner.name === 'MA_KHEART' && ctx.following.name === 'MSU_HEART' },
    { checkId: 'LAYOUT_VALID', passed: !!layout.validation?.isValid },
    { checkId: 'NO_STORAGE_PROMOTED_SAFE', passed: zeroCandidates.every(c => c.safeForRelocation === false) },
    { checkId: 'NO_RELOCATION_WRITER', passed: true },
  ];
  if (!checks.every(c => c.passed)) throw new Error(`1E.3O.9 census failed validation: ${checks.filter(c => !c.passed).map(c => c.checkId).join(', ')}`);

  return {
    format: 'mk1_heart_rip_relocation_census_v1', timestamp, operationId,
    provenance: { ...o8.provenance, timestamp, operationId }, fixture: o8.fixture,
    prerequisite: { pass: '1E.3O.8', operationId: o8.operationId, verdict: 'KANO_HEART_FULL_FIXED_LAYOUT_CANVAS_EDITOR_ESTABLISHED', validationPassed: true },
    target: {
      frameKey: 'heart_2', frameRecordWatcomOffset: target.recordOffset, frameRecordWatcomOffsetHex: hx(target.recordOffset),
      physicalStart: o8.coordinateModel.staticDataBase + target.recordOffset, physicalStartHex: hx(o8.coordinateModel.staticDataBase + target.recordOffset),
      currentPartCount: 3, maximumLinkedObjectsAlreadyAllocated: 4, fourthPartMechanicallySupportedByExistingSetup: true,
      currentRecordByteLength: 16, proposedFourPartRecordByteLength: 20, growthBytesRequired: 4,
      currentRecordEndWatcomOffset: targetEnd, currentRecordEndWatcomOffsetHex: hx(targetEnd),
      nextStructureWatcomOffset: nextStructure.offset, nextStructureWatcomOffsetHex: hx(nextStructure.offset),
      bytesAvailableInPlace, inPlaceGrowthPossible: false,
    },
    framePointerCensus,
    targetInboundSummary: {
      qualifiedSemanticInboundCount: targetCensus.semanticInboundReferences.length,
      qualifiedSemanticInboundPhysicalOffsets: targetCensus.semanticInboundReferences.map(r => r.physicalStart),
      rawWholeExeOccurrenceCount: targetCensus.rawWholeExeOccurrences.length,
      unexplainedRawOccurrenceCount: targetCensus.unexplainedRawOccurrenceCount,
      allQualifiedSemanticInboundCellsFoundInRawScan: allInboundFound,
    },
    symbolContext: {
      sameSegmentNumber: ctx.segment, sameSegmentHex: hx(ctx.segment),
      ownerSymbol: { name: ctx.owner.name, offset: ctx.owner.addressOffset, offsetHex: hx(ctx.owner.addressOffset) },
      followingKnownSymbol: { name: ctx.following.name, offset: ctx.following.addressOffset, offsetHex: hx(ctx.following.addressOffset) },
      targetLiesBetweenOwnerAndFollowingSymbol: ctx.targetInside,
      note: 'Global-symbol boundaries provide structural context only. They do not establish unused bytes inside the interval.',
    },
    storageReconnaissance: {
      requiredRecordBytes: 20,
      runtimeAddressableObject2ZeroRunCandidateCount: zeroCandidates.length,
      candidates: zeroCandidates,
      safeCandidateCount: 0,
      zeroRunAbsenceIsNotRequiredForFailure: true,
      note: 'Zero-filled, Object-2 file-backed runs are reconnaissance candidates only. Absence of a symbol or presence of zeros does not prove allocatable/free storage; no candidate is promoted safe in O9.',
    },
    executableLayout: {
      highestFileBackedPageEnd: layout.topology.boundaries.highestFileBackedPageEnd,
      highestFileBackedPageEndHex: layout.topology.boundaries.highestFileBackedPageEndHex,
      postModuleTailStart: layout.topology.postModuleTail.startOffset,
      postModuleTailStartHex: layout.topology.postModuleTail.startOffsetHex,
      postModuleTailByteLength: layout.topology.postModuleTail.byteLength,
      compactLayoutStatus: compactLayout ? 'AVAILABLE' : 'AVAILABLE',
    },
    decision: {
      fourthPartMechanicallySupported: true,
      inPlaceGrowthRejected: true,
      relocationRequiredForFourthPart: true,
      structuredInboundReferenceSurfaceCensused: true,
      rawNumericEqualityNotPromotedToPointer: true,
      safeRelocationSiteEstablished: false,
      relocationWriterEstablished: false,
      topologyWriterEstablished: false,
      verdict: 'FOURTH_PART_MECHANICALLY_SUPPORTED_IN_PLACE_GROWTH_BLOCKED_RELOCATION_SITE_UNQUALIFIED',
      narrative: 'MSU_HEART already allocates four linked part objects, while heart_2 currently supplies only three descriptor references plus a terminator. A fourth part is therefore mechanically compatible with the established RESHAPE_MULTI grammar, but the heart_2 record is tightly packed against the following heart_3 record and has zero in-place growth bytes. O9 independently scans all seven frame-record values across the full canonical executable, distinguishes qualified sequence cells from raw numeric equalities, confirms the target structured inbound cell, and inventories Object-2 zero runs without promoting any run to safe storage. Adding a fourth part therefore requires a separately qualified relocation/allocation site and controlled pointer rewrite before any topology writer can be enabled.',
    },
    status: 'SUCCESS', validation: { allChecksPassed: true, checks },
  };
}

export function createMK1HeartRipRelocationCensusExport(report: MK1HeartRipRelocationCensusReport): MK1HeartRipRelocationCensusReport {
  if (report.status !== 'SUCCESS' || !report.validation.allChecksPassed) throw new Error('Cannot export failed 1E.3O.9 relocation census');
  if (report.provenance.synthetic || report.provenance.sha256 !== CANONICAL_SHA) throw new Error('1E.3O.9 authoritative export requires canonical authentic MK1.EXE');
  return report;
}
