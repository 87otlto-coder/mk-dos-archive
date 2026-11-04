/**
 * MK1 bounded full heart-rip animation placement editor — Pass 1E.3O.8.
 *
 * Purpose:
 *  - broaden the verified O7 fixed-topology editor across the complete qualified Kano heart-rip animation;
 *  - expose descriptor-local signed-int16 X/Y for all nine KHEART descriptors;
 *  - make frame-record / descriptor aliasing explicit before authoring;
 *  - preserve the O2 semantic serializer, whole-EXE diff accounting and exact reversal contract.
 *
 * This pass is deliberately still same-size/in-place. It does NOT add/remove/duplicate parts,
 * change pointer lists, grow/relocate records, allocate binary space, encode uGRA pixels,
 * edit palette data, or touch gameplay/collision state.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { sha256Bytes } from './paletteRoundTripCodec';
import {
  createMK1MultiPartFrameLosslessIrExport,
  MK1MultiPartFrameLosslessIrReport,
  MK1MultiPartPreviewPart,
  serializeMK1BoundedAnimationIr,
} from './multiPartFrameLosslessIr';
import { MK1MultiPartCompositionCanvasEditorReport } from './multiPartCompositionCanvasEditor';

const CANONICAL_SHA = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
export const HEART_RIP_SYMBOLS = [
  'KHEART1', 'KHEART2', 'KHEART3A', 'KHEART3B', 'KHEART3C', 'KHEART4', 'KHEART5A', 'KHEART5B', 'KHEART5C',
] as const;
export type HeartRipDescriptorSymbol = typeof HEART_RIP_SYMBOLS[number];

type Coord = { x: number; y: number };
type SequenceName = 'PRIMARY' | 'BEAT_LOOP';

function hx(v: number): string { return `0x${(v >>> 0).toString(16).padStart(8, '0').toUpperCase()}`; }
function readI16(b: Uint8Array, o: number): number { const v = b[o] | (b[o + 1] << 8); return v & 0x8000 ? v - 0x10000 : v; }
function i16Bytes(v: number): [number, number] { const n = v & 0xffff; return [n & 0xff, (n >>> 8) & 0xff]; }
function ensureI16(v: number, label: string) { if (!Number.isInteger(v) || v < -32768 || v > 32767) throw new Error(`${label} must be a signed int16 integer`); }
function cloneIr(ir: MK1MultiPartFrameLosslessIrReport['ir']): MK1MultiPartFrameLosslessIrReport['ir'] { return JSON.parse(JSON.stringify(ir)) as MK1MultiPartFrameLosslessIrReport['ir']; }
function diff(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) throw new Error('Executable lengths differ');
  const out: Array<{ physicalOffset: number; physicalOffsetHex: string; before: number; after: number }> = [];
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) out.push({ physicalOffset: i, physicalOffsetHex: hx(i), before: a[i], after: b[i] });
  return out;
}
function sameByteDiff(a: ReturnType<typeof diff>, b: ReturnType<typeof diff>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i].physicalOffset !== b[i].physicalOffset || a[i].before !== b[i].before || a[i].after !== b[i].after) return false;
  return true;
}

export interface HeartRipFrameOccurrenceModel {
  previewKey: string;
  sequence: SequenceName;
  sequenceFrameIndex: number;
  frameRecordKey: string;
  frameRecordWatcomOffset: number;
  frameRecordWatcomOffsetHex: string;
  structuralPartCount: number;
  descriptorSymbols: HeartRipDescriptorSymbol[];
  reusedFrameRecord: boolean;
  frameRecordUseCount: number;
}

export interface HeartRipDescriptorModel {
  symbol: HeartRipDescriptorSymbol;
  watcomOffset: number;
  watcomOffsetHex: string;
  physicalStart: number;
  physicalStartHex: string;
  width: number;
  height: number;
  x: number;
  y: number;
  packedReference: number;
  packedReferenceHex: string;
  writableFields: ['x', 'y'];
  usage: Array<{ previewKey: string; sequence: SequenceName; sequenceFrameIndex: number; frameRecordKey: string; structuralPartIndex: number }>;
  usageCount: number;
  aliasedAcrossOccurrences: boolean;
  decode: {
    success: true;
    checksum: string;
    encodedBytesConsumed: number;
    opaquePixelCount: number;
    minOpaqueIndex: number | null;
    maxOpaqueIndex: number | null;
    outOfPaletteRangeCount: number;
  };
}

export interface MK1HeartRipAnimationCanvasEditorReport {
  format: 'mk1_heart_rip_animation_canvas_editor_model_v1';
  timestamp: string;
  operationId: string;
  provenance: MK1MultiPartFrameLosslessIrReport['provenance'];
  fixture: MK1MultiPartFrameLosslessIrReport['fixture'];
  prerequisite: {
    o2: { pass: '1E.3O.2'; operationId: string; verdict: 'MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED'; validationPassed: true };
    o7: { pass: '1E.3O.7'; operationId: string; verdict: 'KANO_HEART_THREE_PART_BOUNDED_CANVAS_EDITOR_ESTABLISHED'; validationPassed: true };
  };
  coordinateModel: MK1MultiPartFrameLosslessIrReport['coordinateModel'];
  animation: {
    owner: 'KANO';
    semanticName: 'HEART_RIP_MULTI';
    sequenceOccurrenceCount: 8;
    uniqueFrameRecordCount: 7;
    uniqueDescriptorCount: 9;
    primaryOccurrenceCount: 5;
    beatLoopOccurrenceCount: 3;
    structuralOrderOnly: true;
    finalPixelZOrderPromoted: false;
  };
  resource: MK1MultiPartFrameLosslessIrReport['resource'];
  palette: MK1MultiPartFrameLosslessIrReport['palette'];
  occurrences: HeartRipFrameOccurrenceModel[];
  descriptors: HeartRipDescriptorModel[];
  aliasing: {
    reusedFrameRecords: Array<{ frameRecordKey: string; previewKeys: string[]; useCount: number }>;
    reusedDescriptors: Array<{ symbol: HeartRipDescriptorSymbol; previewKeys: string[]; useCount: number }>;
    kheart5aSharedBetweenPrimaryAndBeatLoop: boolean;
  };
  canvas: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number; anchorX: 0; anchorY: 0; padding: number; recommendedScale: 5 };
  serializer: {
    semanticIr: 'mk1_animation_ir_v1';
    serializer: 'serializeMK1BoundedAnimationIr';
    inPlaceDescriptorWritesOnly: true;
    signedInt16XY: true;
    fixedFrameRecords: true;
    fixedPartCounts: true;
    aliasEffectsExplicit: true;
    frameRecordPointersReadOnly: true;
    descriptorWidthHeightReadOnly: true;
    packedReferenceReadOnly: true;
    paletteReadOnly: true;
    relocationSupported: false;
    ugraEncodingSupported: false;
    addRemoveDuplicatePartsSupported: false;
  };
  noEditRoundTrip: { sourceSha256: string; rebuiltSha256: string; mismatchCount: number; exact: boolean; semanticRegionCount: number };
  decision: {
    fullQualifiedHeartRipPlacementAuthoringEstablished: true;
    aliasSemanticsExposed: true;
    boundedWritableSerializerEstablished: true;
    topologyEditingEstablished: false;
    relocationAllocationEstablished: false;
    genericAnimationCompilerEstablished: false;
    verdict: 'KANO_HEART_FULL_FIXED_LAYOUT_CANVAS_EDITOR_ESTABLISHED';
    narrative: string;
  };
  status: 'SUCCESS';
  validation: { allChecksPassed: boolean; checks: Array<{ checkId: string; passed: boolean }> };
  baselineIr: MK1MultiPartFrameLosslessIrReport['ir'];
  previewPayloads?: Map<HeartRipDescriptorSymbol, MK1MultiPartPreviewPart>;
}

export interface HeartRipPlacementChange { symbol: HeartRipDescriptorSymbol; x: number; y: number; }
export interface MK1HeartRipAnimationCanvasEditRequest { authoringMode: 'INTERACTIVE_CANVAS' | 'NUMERIC'; changes: HeartRipPlacementChange[]; note?: string; }
export interface MK1HeartRipAnimationCanvasEditReport {
  format: 'mk1_heart_rip_animation_canvas_edit_v1';
  timestamp: string;
  operationId: string;
  provenance: MK1HeartRipAnimationCanvasEditorReport['provenance'];
  fixture: MK1HeartRipAnimationCanvasEditorReport['fixture'];
  prerequisite: { pass: '1E.3O.8'; operationId: string; verdict: 'KANO_HEART_FULL_FIXED_LAYOUT_CANVAS_EDITOR_ESTABLISHED'; validationPassed: true };
  request: MK1HeartRipAnimationCanvasEditRequest;
  changes: Array<{
    symbol: HeartRipDescriptorSymbol;
    physicalStart: number;
    physicalStartHex: string;
    before: Coord;
    after: Coord;
    delta: Coord;
    editedFields: Array<'x' | 'y'>;
    affectedPreviewKeys: string[];
    expectedChangedByteOffsets: number[];
    expectedChangedByteOffsetsHex: string[];
  }>;
  editedIr: MK1MultiPartFrameLosslessIrReport['ir'];
  evidence: {
    originalSha256: string;
    editedSha256: string;
    reversedSha256: string;
    changedDescriptorCount: number;
    changedFieldCount: number;
    changedByteCount: number;
    expectedChangedByteCount: number;
    changedBytes: ReturnType<typeof diff>;
    expectedChangedBytes: ReturnType<typeof diff>;
    unexpectedByteChanges: number;
    reverseRestoresOriginal: boolean;
    wholeExecutableDiffExactlyExpected: boolean;
    semanticReparseMatches: boolean;
  };
  constraints: {
    fixedSevenUniqueFrameRecords: true;
    fixedEightSequenceOccurrences: true;
    partCountsUntouched: true;
    frameRecordPointersUntouched: true;
    dimensionsUntouched: true;
    packedReferencesUntouched: true;
    graPixelsUntouched: true;
    paletteUntouched: true;
    relocationUnused: true;
    collisionAndGameplayUntouched: true;
  };
  status: 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING';
  runtime: { tested: false; result: 'NOT_TESTED'; expectedObservation: string };
}
export interface MK1HeartRipAnimationCanvasEditResult { originalExe: Uint8Array; editedExe: Uint8Array; report: MK1HeartRipAnimationCanvasEditReport; }

async function readCanonicalExe(source: DirectorySource, fixturePath: string, fixtureSize: number) {
  if (source.isSynthetic !== false) throw new Error('1E.3O.8 requires an authentic user-loaded MK1 directory');
  const entries = await source.listRecursive();
  const entry = entries.find(e => e.path === fixturePath);
  if (!entry || entry.size !== fixtureSize) throw new Error('MK1.EXE size changed from the qualified fixture');
  const bytes = await source.readSlice(entry.path, 0, entry.size);
  const hash = await sha256Bytes(bytes);
  if (hash !== CANONICAL_SHA) throw new Error('1E.3O.8 authoring requires the canonical untouched MK1.EXE');
  return { bytes, hash };
}

function qualifyOccurrences(baseline: MK1MultiPartFrameLosslessIrReport): HeartRipFrameOccurrenceModel[] {
  if (baseline.compositionFrames.length !== 8) throw new Error(`Expected 8 heart-rip sequence occurrences; got ${baseline.compositionFrames.length}`);
  const recordUse = new Map<number, number>();
  for (const f of baseline.compositionFrames) recordUse.set(f.recordWatcomOffset, (recordUse.get(f.recordWatcomOffset) ?? 0) + 1);
  const occurrences = baseline.compositionFrames.map(frame => {
    const record = baseline.frameRecords.find(r => r.watcomOffset === frame.recordWatcomOffset);
    if (!record) throw new Error(`Missing frame record for ${frame.frameKey}`);
    const symbols = record.partDescriptorSymbols as HeartRipDescriptorSymbol[];
    if (!symbols.every(s => (HEART_RIP_SYMBOLS as readonly string[]).includes(s))) throw new Error(`Unqualified heart descriptor in ${frame.frameKey}`);
    const preview = baseline.previewPayloads?.get(frame.frameKey);
    if (!preview || preview.length !== record.partCount || preview.map(p => p.symbol).join('|') !== symbols.join('|')) throw new Error(`Preview payload mismatch for ${frame.frameKey}`);
    const uses = recordUse.get(frame.recordWatcomOffset) ?? 0;
    return {
      previewKey: frame.frameKey,
      sequence: frame.sequence,
      sequenceFrameIndex: frame.sequenceFrameIndex,
      frameRecordKey: record.frameKey,
      frameRecordWatcomOffset: record.watcomOffset,
      frameRecordWatcomOffsetHex: record.watcomOffsetHex,
      structuralPartCount: record.partCount,
      descriptorSymbols: symbols,
      reusedFrameRecord: uses > 1,
      frameRecordUseCount: uses,
    };
  });
  const primary = occurrences.filter(o => o.sequence === 'PRIMARY');
  const beat = occurrences.filter(o => o.sequence === 'BEAT_LOOP');
  if (primary.length !== 5 || beat.length !== 3) throw new Error('Heart-rip sequence occurrence counts changed');
  return occurrences;
}

export async function executeHeartRipAnimationCanvasEditorModel(
  source: DirectorySource,
  baseline: MK1MultiPartFrameLosslessIrReport,
  o7: MK1MultiPartCompositionCanvasEditorReport,
): Promise<MK1HeartRipAnimationCanvasEditorReport> {
  await createMK1MultiPartFrameLosslessIrExport(baseline);
  if (baseline.status !== 'SUCCESS' || baseline.decision.verdict !== 'MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED' || !baseline.roundTrip.wholeExecutableHashExact) throw new Error('1E.3O.8 requires verified O2 multi-part IR');
  if (o7.status !== 'SUCCESS' || !o7.validation.allChecksPassed || o7.decision.verdict !== 'KANO_HEART_THREE_PART_BOUNDED_CANVAS_EDITOR_ESTABLISHED') throw new Error('1E.3O.8 requires a successful O7 editor model');
  if (baseline.provenance.sha256 !== CANONICAL_SHA || o7.provenance.sha256 !== CANONICAL_SHA) throw new Error('1E.3O.8 prerequisite provenance is not canonical');
  const { bytes, hash } = await readCanonicalExe(source, baseline.fixture.exePath, baseline.fixture.exeSize);
  const occurrences = qualifyOccurrences(baseline);

  const previewPayloads = new Map<HeartRipDescriptorSymbol, MK1MultiPartPreviewPart>();
  for (const occurrence of occurrences) {
    const preview = baseline.previewPayloads!.get(occurrence.previewKey)!;
    for (const p of preview) if (!previewPayloads.has(p.symbol as HeartRipDescriptorSymbol)) previewPayloads.set(p.symbol as HeartRipDescriptorSymbol, p);
  }

  const descriptors: HeartRipDescriptorModel[] = HEART_RIP_SYMBOLS.map(symbol => {
    const descriptor = baseline.descriptors.find(d => d.symbol === symbol);
    const irDescriptor = baseline.ir.descriptors.find(d => d.symbol === symbol);
    const payload = previewPayloads.get(symbol);
    if (!descriptor || !irDescriptor || !payload) throw new Error(`${symbol} is missing from the qualified O2 model`);
    if (!descriptor.decode.success || descriptor.decode.outOfPaletteRangeCount !== 0) throw new Error(`${symbol} preview decode is not qualified`);
    if (descriptor.x !== irDescriptor.x || descriptor.y !== irDescriptor.y || descriptor.width !== irDescriptor.width || descriptor.height !== irDescriptor.height || descriptor.packedReference !== irDescriptor.packedReference) throw new Error(`${symbol} report/IR mismatch`);
    const physicalStart = baseline.coordinateModel.staticDataBase + descriptor.watcomOffset;
    if (readI16(bytes, physicalStart + 4) !== descriptor.x || readI16(bytes, physicalStart + 6) !== descriptor.y) throw new Error(`${symbol} source coordinates drifted from O2`);
    const usage = occurrences.flatMap(o => o.descriptorSymbols.map((s, structuralPartIndex) => s === symbol ? ({ previewKey: o.previewKey, sequence: o.sequence, sequenceFrameIndex: o.sequenceFrameIndex, frameRecordKey: o.frameRecordKey, structuralPartIndex }) : null).filter((v): v is NonNullable<typeof v> => v !== null));
    if (!usage.length) throw new Error(`${symbol} has no sequence occurrence`);
    return {
      symbol, watcomOffset: descriptor.watcomOffset, watcomOffsetHex: descriptor.watcomOffsetHex, physicalStart, physicalStartHex: hx(physicalStart),
      width: descriptor.width, height: descriptor.height, x: descriptor.x, y: descriptor.y, packedReference: descriptor.packedReference, packedReferenceHex: descriptor.packedReferenceHex,
      writableFields: ['x', 'y'], usage, usageCount: usage.length, aliasedAcrossOccurrences: usage.length > 1,
      decode: { ...descriptor.decode, success: true as const },
    };
  });

  const frameGroups = new Map<string, string[]>();
  for (const o of occurrences) frameGroups.set(o.frameRecordKey, [...(frameGroups.get(o.frameRecordKey) ?? []), o.previewKey]);
  const reusedFrameRecords = Array.from(frameGroups.entries()).filter(([, keys]) => keys.length > 1).map(([frameRecordKey, previewKeys]) => ({ frameRecordKey, previewKeys, useCount: previewKeys.length }));
  const reusedDescriptors = descriptors.filter(d => d.usageCount > 1).map(d => ({ symbol: d.symbol, previewKeys: d.usage.map(u => u.previewKey), useCount: d.usageCount }));
  const kheart5a = reusedDescriptors.find(d => d.symbol === 'KHEART5A');
  const kheart5aShared = !!kheart5a && kheart5a.previewKeys.includes('PRIMARY:4') && kheart5a.previewKeys.includes('BEAT_LOOP:2') && kheart5a.useCount === 2;

  const rebuilt = bytes.slice();
  const serialized = serializeMK1BoundedAnimationIr(baseline.ir, baseline.coordinateModel.staticDataBase);
  if (serialized.length !== baseline.ir.preservation.semanticRegionCount) throw new Error('O2 semantic-region count changed');
  for (const region of serialized) rebuilt.set(region.encoded, region.physicalStart);
  const mismatchCount = diff(bytes, rebuilt).length;
  const rebuiltSha256 = await sha256Bytes(rebuilt);

  const rawMinX = Math.min(0, ...descriptors.map(d => d.x));
  const rawMinY = Math.min(0, ...descriptors.map(d => d.y));
  const rawMaxX = Math.max(0, ...descriptors.map(d => d.x + d.width));
  const rawMaxY = Math.max(0, ...descriptors.map(d => d.y + d.height));
  const padding = 48, minX = rawMinX - padding, minY = rawMinY - padding, maxX = rawMaxX + padding, maxY = rawMaxY + padding;

  const timestamp = new Date().toISOString(), operationId = createOperationId('heart-rip-animation-canvas-editor');
  const checks = [
    { checkId: 'CANONICAL_PROVENANCE', passed: hash === CANONICAL_SHA },
    { checkId: 'O2_PREREQUISITE_BOUND', passed: baseline.decision.verdict === 'MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED' },
    { checkId: 'O7_PREREQUISITE_BOUND', passed: o7.decision.verdict === 'KANO_HEART_THREE_PART_BOUNDED_CANVAS_EDITOR_ESTABLISHED' },
    { checkId: 'FULL_HEART_SEQUENCE_OCCURRENCES', passed: occurrences.length === 8 && new Set(occurrences.map(o => o.frameRecordKey)).size === 7 },
    { checkId: 'ALL_NINE_DESCRIPTORS_QUALIFIED', passed: descriptors.length === 9 && previewPayloads.size === 9 && descriptors.every(d => d.decode.outOfPaletteRangeCount === 0) },
    { checkId: 'KHEART5A_ALIAS_EXPLICIT', passed: kheart5aShared },
    { checkId: 'NO_EDIT_SEMANTIC_ROUND_TRIP', passed: mismatchCount === 0 && rebuiltSha256 === hash },
    { checkId: 'FIXED_TOPOLOGY_SCOPE', passed: baseline.ir.preservation.relocationSupported === false && baseline.ir.preservation.ugraEncodingSupported === false },
  ];
  if (!checks.every(c => c.passed)) throw new Error(`1E.3O.8 model qualification failed: ${checks.filter(c => !c.passed).map(c => c.checkId).join(', ')}`);

  return {
    format: 'mk1_heart_rip_animation_canvas_editor_model_v1', timestamp, operationId,
    provenance: { ...baseline.provenance, timestamp, operationId }, fixture: baseline.fixture,
    prerequisite: {
      o2: { pass: '1E.3O.2', operationId: baseline.operationId, verdict: 'MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED', validationPassed: true },
      o7: { pass: '1E.3O.7', operationId: o7.operationId, verdict: 'KANO_HEART_THREE_PART_BOUNDED_CANVAS_EDITOR_ESTABLISHED', validationPassed: true },
    },
    coordinateModel: baseline.coordinateModel,
    animation: { owner: 'KANO', semanticName: 'HEART_RIP_MULTI', sequenceOccurrenceCount: 8, uniqueFrameRecordCount: 7, uniqueDescriptorCount: 9, primaryOccurrenceCount: 5, beatLoopOccurrenceCount: 3, structuralOrderOnly: true, finalPixelZOrderPromoted: false },
    resource: baseline.resource, palette: baseline.palette, occurrences, descriptors,
    aliasing: { reusedFrameRecords, reusedDescriptors, kheart5aSharedBetweenPrimaryAndBeatLoop: kheart5aShared },
    canvas: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, anchorX: 0, anchorY: 0, padding, recommendedScale: 5 },
    serializer: { semanticIr: 'mk1_animation_ir_v1', serializer: 'serializeMK1BoundedAnimationIr', inPlaceDescriptorWritesOnly: true, signedInt16XY: true, fixedFrameRecords: true, fixedPartCounts: true, aliasEffectsExplicit: true, frameRecordPointersReadOnly: true, descriptorWidthHeightReadOnly: true, packedReferenceReadOnly: true, paletteReadOnly: true, relocationSupported: false, ugraEncodingSupported: false, addRemoveDuplicatePartsSupported: false },
    noEditRoundTrip: { sourceSha256: hash, rebuiltSha256, mismatchCount, exact: mismatchCount === 0 && rebuiltSha256 === hash, semanticRegionCount: serialized.length },
    decision: {
      fullQualifiedHeartRipPlacementAuthoringEstablished: true, aliasSemanticsExposed: true, boundedWritableSerializerEstablished: true,
      topologyEditingEstablished: false, relocationAllocationEstablished: false, genericAnimationCompilerEstablished: false,
      verdict: 'KANO_HEART_FULL_FIXED_LAYOUT_CANVAS_EDITOR_ESTABLISHED',
      narrative: 'The complete O2-qualified Kano heart-rip animation is promoted into a fixed-layout placement editor: eight sequence occurrences over seven unique frame records and nine KHEART descriptors. All nine descriptor-local signed-int16 X/Y fields are authorable through the existing mk1_animation_ir_v1 serializer. Shared storage is explicit: the KHEART5A / heart_4 record occurrence is referenced from PRIMARY:4 and BEAT_LOOP:2, so one descriptor edit intentionally affects both appearances. A fresh no-edit serialization of all 22 semantic regions is byte-identical. Frame topology, descriptor identity, dimensions, packed references, pixels, palette, relocation/allocation and gameplay/collision remain read-only.',
    },
    status: 'SUCCESS', validation: { allChecksPassed: true, checks }, baselineIr: cloneIr(baseline.ir), previewPayloads,
  };
}

export function createMK1HeartRipAnimationCanvasEditorExport(report: MK1HeartRipAnimationCanvasEditorReport) {
  const { previewPayloads: _preview, ...serializable } = report;
  return serializable;
}

export async function executeHeartRipAnimationCanvasEdit(
  source: DirectorySource,
  model: MK1HeartRipAnimationCanvasEditorReport,
  request: MK1HeartRipAnimationCanvasEditRequest,
): Promise<MK1HeartRipAnimationCanvasEditResult> {
  if (model.status !== 'SUCCESS' || !model.validation.allChecksPassed || model.decision.verdict !== 'KANO_HEART_FULL_FIXED_LAYOUT_CANVAS_EDITOR_ESTABLISHED') throw new Error('Heart-rip animation edit requires a successful 1E.3O.8 model');
  if (!Array.isArray(request.changes) || request.changes.length < 1) throw new Error('Heart-rip animation edit requires at least one descriptor change');
  const seen = new Set<string>();
  for (const c of request.changes) {
    if (!(HEART_RIP_SYMBOLS as readonly string[]).includes(c.symbol)) throw new Error(`Unqualified heart-rip descriptor rejected: ${c.symbol}`);
    if (seen.has(c.symbol)) throw new Error(`Duplicate heart-rip descriptor edit for ${c.symbol}`);
    seen.add(c.symbol); ensureI16(c.x, `${c.symbol}.x`); ensureI16(c.y, `${c.symbol}.y`);
  }

  const { bytes: originalExe, hash: originalHash } = await readCanonicalExe(source, model.fixture.exePath, model.fixture.exeSize);
  if (originalHash !== model.noEditRoundTrip.sourceSha256) throw new Error('Canonical executable identity changed from O8 model');
  const bySymbol = new Map(model.descriptors.map(d => [d.symbol, d] as const));
  const editedIr = cloneIr(model.baselineIr);
  const reportChanges: MK1HeartRipAnimationCanvasEditReport['changes'] = [];
  const expectedChangedBytes: ReturnType<typeof diff> = [];
  let changedFieldCount = 0;

  for (const change of request.changes) {
    const d = bySymbol.get(change.symbol)!;
    const sourceX = readI16(originalExe, d.physicalStart + 4), sourceY = readI16(originalExe, d.physicalStart + 6);
    if (sourceX !== d.x || sourceY !== d.y) throw new Error(`${d.symbol} source coordinates drifted from O8 model`);
    if (change.x === sourceX && change.y === sourceY) continue;
    const irDescriptor = editedIr.descriptors.find(x => x.symbol === d.symbol);
    if (!irDescriptor || irDescriptor.width !== d.width || irDescriptor.height !== d.height || irDescriptor.packedReference !== d.packedReference) throw new Error(`${d.symbol} IR descriptor changed unexpectedly`);
    const editedFields: Array<'x' | 'y'> = [], partExpected: number[] = [];
    const addExpected = (field: 'x' | 'y', offset: number, beforeValue: number, afterValue: number) => {
      if (beforeValue === afterValue) return;
      editedFields.push(field); changedFieldCount++;
      const before = i16Bytes(beforeValue), after = i16Bytes(afterValue);
      for (let i = 0; i < 2; i++) if (before[i] !== after[i]) {
        const physicalOffset = offset + i;
        expectedChangedBytes.push({ physicalOffset, physicalOffsetHex: hx(physicalOffset), before: before[i], after: after[i] });
        partExpected.push(physicalOffset);
      }
    };
    addExpected('x', d.physicalStart + 4, sourceX, change.x);
    addExpected('y', d.physicalStart + 6, sourceY, change.y);
    irDescriptor.x = change.x; irDescriptor.y = change.y;
    reportChanges.push({
      symbol: d.symbol, physicalStart: d.physicalStart, physicalStartHex: d.physicalStartHex,
      before: { x: sourceX, y: sourceY }, after: { x: change.x, y: change.y }, delta: { x: change.x - sourceX, y: change.y - sourceY },
      editedFields, affectedPreviewKeys: d.usage.map(u => u.previewKey), expectedChangedByteOffsets: partExpected, expectedChangedByteOffsetsHex: partExpected.map(hx),
    });
  }
  if (!reportChanges.length) throw new Error('Heart-rip animation edit contains no semantic coordinate changes');
  expectedChangedBytes.sort((a, b) => a.physicalOffset - b.physicalOffset);

  const editedExe = originalExe.slice();
  const serialized = serializeMK1BoundedAnimationIr(editedIr, model.coordinateModel.staticDataBase);
  if (serialized.length !== model.noEditRoundTrip.semanticRegionCount) throw new Error('Semantic serializer region count changed during O8 edit');
  for (const region of serialized) editedExe.set(region.encoded, region.physicalStart);
  const actualChangedBytes = diff(originalExe, editedExe);
  const exact = sameByteDiff(actualChangedBytes, expectedChangedBytes);
  if (!exact) throw new Error(`O8 whole-executable diff escaped requested X/Y fields: expected ${expectedChangedBytes.length}, actual ${actualChangedBytes.length}`);

  const semanticReparseMatches = reportChanges.every(c => readI16(editedExe, c.physicalStart + 4) === c.after.x && readI16(editedExe, c.physicalStart + 6) === c.after.y);
  if (!semanticReparseMatches) throw new Error('O8 edited coordinate reparse failed');
  const editedSha256 = await sha256Bytes(editedExe);
  const reversed = editedExe.slice();
  for (const d of actualChangedBytes) reversed[d.physicalOffset] = d.before;
  const reversedSha256 = await sha256Bytes(reversed);
  const reverseRestoresOriginal = reversedSha256 === CANONICAL_SHA && diff(originalExe, reversed).length === 0;
  if (!reverseRestoresOriginal) throw new Error('O8 reversal failed to restore canonical MK1.EXE');

  const timestamp = new Date().toISOString(), operationId = createOperationId('heart-rip-animation-canvas-edit');
  return {
    originalExe, editedExe,
    report: {
      format: 'mk1_heart_rip_animation_canvas_edit_v1', timestamp, operationId,
      provenance: { ...model.provenance, timestamp, operationId }, fixture: model.fixture,
      prerequisite: { pass: '1E.3O.8', operationId: model.operationId, verdict: 'KANO_HEART_FULL_FIXED_LAYOUT_CANVAS_EDITOR_ESTABLISHED', validationPassed: true },
      request, changes: reportChanges, editedIr,
      evidence: { originalSha256: originalHash, editedSha256, reversedSha256, changedDescriptorCount: reportChanges.length, changedFieldCount, changedByteCount: actualChangedBytes.length, expectedChangedByteCount: expectedChangedBytes.length, changedBytes: actualChangedBytes, expectedChangedBytes, unexpectedByteChanges: exact ? 0 : Math.max(0, actualChangedBytes.length - expectedChangedBytes.length), reverseRestoresOriginal, wholeExecutableDiffExactlyExpected: exact, semanticReparseMatches },
      constraints: { fixedSevenUniqueFrameRecords: true, fixedEightSequenceOccurrences: true, partCountsUntouched: true, frameRecordPointersUntouched: true, dimensionsUntouched: true, packedReferencesUntouched: true, graPixelsUntouched: true, paletteUntouched: true, relocationUnused: true, collisionAndGameplayUntouched: true },
      status: 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING',
      runtime: { tested: false, result: 'NOT_TESTED', expectedObservation: 'Each edited KHEART descriptor should move in every qualified frame occurrence that references it. In particular, a KHEART5A edit should affect both PRIMARY:4 and BEAT_LOOP:2 because they share the same descriptor/frame record storage.' },
    },
  };
}

export function createMK1HeartRipAnimationCanvasEditExport(result: MK1HeartRipAnimationCanvasEditResult) { return result.report; }

export function buildHeartRipAnimationCanvasEditBundle(result: MK1HeartRipAnimationCanvasEditResult, model: MK1HeartRipAnimationCanvasEditorReport): Uint8Array {
  const reportBytes = new TextEncoder().encode(JSON.stringify(result.report, null, 2));
  const modelBytes = new TextEncoder().encode(JSON.stringify(createMK1HeartRipAnimationCanvasEditorExport(model), null, 2));
  const readme = new TextEncoder().encode([
    'MK1 Pass 1E.3O.8 — full fixed-layout Kano heart-rip placement test',
    '',
    `Original SHA-256: ${result.report.evidence.originalSha256}`,
    `Edited SHA-256:   ${result.report.evidence.editedSha256}`,
    `Changed descriptors: ${result.report.evidence.changedDescriptorCount}`,
    `Changed bytes: ${result.report.evidence.changedByteCount}`,
    `Unexpected bytes: ${result.report.evidence.unexpectedByteChanges}`,
    '',
    'Use only in a separate copy of the complete MK1 installation. Do not overwrite the untouched source installation.',
    'This bundle changes descriptor-local X/Y only. Frame topology, graphics pixels, palette and gameplay/collision data are unchanged.',
    'Shared descriptor edits intentionally affect every occurrence that references that descriptor (for example KHEART5A in PRIMARY:4 and BEAT_LOOP:2).',
  ].join('\r\n'));
  return buildStoredZip([
    { name: 'MK1.EXE', bytes: result.editedExe },
    { name: 'mk1_heart_rip_animation_canvas_edit.json', bytes: reportBytes },
    { name: 'mk1_heart_rip_animation_canvas_editor_model.json', bytes: modelBytes },
    { name: 'READ_ME_FIRST.txt', bytes: readme },
  ]);
}
