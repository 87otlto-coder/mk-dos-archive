/**
 * MK1 bounded interactive multi-part composition placement editor — Pass 1E.3O.7.
 *
 * Purpose:
 *  - promote the verified Kano heart-rip three-part frame into an authoring-facing canvas;
 *  - expose only the descriptor-local signed-int16 X/Y fields of KHEART3A/B/C;
 *  - compile arbitrary in-place placement edits through the 1E.3O.2 semantic IR serializer;
 *  - account for every changed executable byte and prove exact reversal.
 *
 * This pass intentionally keeps topology fixed. It does NOT add/remove/duplicate parts,
 * change frame-record pointers, resize descriptors, relocate records, encode uGRA pixels,
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

const CANONICAL_SHA = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const FRAME_KEY = 'heart_2';
const PREVIEW_KEY = 'PRIMARY:2';
const QUALIFIED = ['KHEART3A', 'KHEART3B', 'KHEART3C'] as const;
export type HeartThreePartSymbol = typeof QUALIFIED[number];

type Coord = { x: number; y: number };

function hx(v: number): string { return `0x${(v >>> 0).toString(16).padStart(8, '0').toUpperCase()}`; }
function i16Bytes(v: number): [number, number] { const n = v & 0xffff; return [n & 0xff, (n >>> 8) & 0xff]; }
function readI16(b: Uint8Array, o: number): number { const v = b[o] | (b[o + 1] << 8); return v & 0x8000 ? v - 0x10000 : v; }
function cloneIr(ir: MK1MultiPartFrameLosslessIrReport['ir']): MK1MultiPartFrameLosslessIrReport['ir'] { return JSON.parse(JSON.stringify(ir)) as MK1MultiPartFrameLosslessIrReport['ir']; }
function diff(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) throw new Error('Executable lengths differ');
  const out: Array<{ physicalOffset: number; physicalOffsetHex: string; before: number; after: number }> = [];
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) out.push({ physicalOffset: i, physicalOffsetHex: hx(i), before: a[i], after: b[i] });
  return out;
}
function ensureI16(v: number, label: string) { if (!Number.isInteger(v) || v < -32768 || v > 32767) throw new Error(`${label} must be a signed int16 integer`); }
function sameByteDiff(a: ReturnType<typeof diff>, b: ReturnType<typeof diff>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].physicalOffset !== b[i].physicalOffset || a[i].before !== b[i].before || a[i].after !== b[i].after) return false;
  }
  return true;
}

export interface MultiPartCompositionDescriptorModel {
  symbol: HeartThreePartSymbol;
  structuralPartIndex: 0 | 1 | 2;
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

export interface MK1MultiPartCompositionCanvasEditorReport {
  format: 'mk1_multi_part_composition_canvas_editor_model_v1';
  timestamp: string;
  operationId: string;
  provenance: MK1MultiPartFrameLosslessIrReport['provenance'];
  fixture: MK1MultiPartFrameLosslessIrReport['fixture'];
  prerequisite: {
    pass: '1E.3O.2';
    operationId: string;
    verdict: 'MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED';
    validationPassed: true;
  };
  coordinateModel: MK1MultiPartFrameLosslessIrReport['coordinateModel'];
  composition: {
    owner: 'KANO';
    semanticName: 'HEART_RIP_MULTI';
    sequence: 'PRIMARY';
    sequenceFrameIndex: 2;
    frameRecordKey: 'heart_2';
    previewKey: 'PRIMARY:2';
    structuralPartCount: 3;
    structuralOrderOnly: true;
    finalPixelZOrderPromoted: false;
  };
  resource: MK1MultiPartFrameLosslessIrReport['resource'];
  palette: MK1MultiPartFrameLosslessIrReport['palette'];
  descriptors: MultiPartCompositionDescriptorModel[];
  canvas: {
    minX: number; minY: number; maxX: number; maxY: number; width: number; height: number;
    anchorX: 0; anchorY: 0; padding: number; recommendedScale: 5;
  };
  serializer: {
    semanticIr: 'mk1_animation_ir_v1';
    serializer: 'serializeMK1BoundedAnimationIr';
    inPlaceDescriptorWritesOnly: true;
    signedInt16XY: true;
    fixedPartCount: true;
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
    interactivePerPartXYAuthoringEstablished: true;
    previewDecodeEstablished: true;
    boundedWritableSerializerEstablished: true;
    topologyEditingEstablished: false;
    genericAnimationCompilerEstablished: false;
    verdict: 'KANO_HEART_THREE_PART_BOUNDED_CANVAS_EDITOR_ESTABLISHED';
    narrative: string;
  };
  status: 'SUCCESS';
  validation: { allChecksPassed: boolean; checks: Array<{ checkId: string; passed: boolean }> };
  baselineIr: MK1MultiPartFrameLosslessIrReport['ir'];
  previewPayloads?: Map<HeartThreePartSymbol, MK1MultiPartPreviewPart>;
}

export interface MultiPartCompositionPlacementChange { symbol: HeartThreePartSymbol; x: number; y: number; }
export interface MK1MultiPartCompositionCanvasEditRequest {
  authoringMode: 'INTERACTIVE_CANVAS' | 'NUMERIC';
  changes: MultiPartCompositionPlacementChange[];
  note?: string;
}
export interface MK1MultiPartCompositionCanvasEditReport {
  format: 'mk1_multi_part_composition_canvas_edit_v1';
  timestamp: string;
  operationId: string;
  provenance: MK1MultiPartCompositionCanvasEditorReport['provenance'];
  fixture: MK1MultiPartCompositionCanvasEditorReport['fixture'];
  prerequisite: {
    pass: '1E.3O.7';
    operationId: string;
    verdict: 'KANO_HEART_THREE_PART_BOUNDED_CANVAS_EDITOR_ESTABLISHED';
    validationPassed: true;
  };
  request: MK1MultiPartCompositionCanvasEditRequest;
  changes: Array<{
    symbol: HeartThreePartSymbol;
    structuralPartIndex: 0 | 1 | 2;
    physicalStart: number;
    physicalStartHex: string;
    before: Coord;
    after: Coord;
    delta: Coord;
    editedFields: Array<'x' | 'y'>;
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
  };
  constraints: {
    fixedThreePartTopology: true;
    partCountUntouched: true;
    frameRecordPointersUntouched: true;
    dimensionsUntouched: true;
    packedReferencesUntouched: true;
    graPixelsUntouched: true;
    paletteUntouched: true;
    relocationUnused: true;
    collisionAndGameplayUntouched: true;
  };
  status: 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING';
  runtime: {
    tested: false;
    result: 'NOT_TESTED';
    expectedObservation: string;
  };
}
export interface MK1MultiPartCompositionCanvasEditResult { originalExe: Uint8Array; editedExe: Uint8Array; report: MK1MultiPartCompositionCanvasEditReport; }

async function readCanonicalExe(source: DirectorySource, fixturePath: string, fixtureSize: number) {
  if (source.isSynthetic !== false) throw new Error('1E.3O.7 requires an authentic user-loaded MK1 directory');
  const entries = await source.listRecursive();
  const entry = entries.find(e => e.path === fixturePath);
  if (!entry || entry.size !== fixtureSize) throw new Error('MK1.EXE size changed from the qualified fixture');
  const bytes = await source.readSlice(entry.path, 0, entry.size);
  const hash = await sha256Bytes(bytes);
  if (hash !== CANONICAL_SHA) throw new Error('1E.3O.7 authoring requires the canonical untouched MK1.EXE');
  return { bytes, hash };
}

function qualifyThreePartFrame(baseline: MK1MultiPartFrameLosslessIrReport) {
  const frame = baseline.ir.frames.find(f => f.frameKey === FRAME_KEY);
  if (!frame || frame.parts.length !== 3) throw new Error('Expected qualified KHEART3 three-part frame is missing');
  const actual = frame.parts.map(p => p.descriptorSymbol);
  if (actual.join('|') !== QUALIFIED.join('|')) throw new Error(`KHEART3 structural part order changed: ${actual.join(', ')}`);
  const preview = baseline.previewPayloads?.get(PREVIEW_KEY);
  if (!preview || preview.length !== 3 || preview.map(p => p.symbol).join('|') !== QUALIFIED.join('|')) throw new Error('Qualified KHEART3 preview payload is unavailable or structurally inconsistent');
  return { frame, preview };
}

export async function executeMultiPartCompositionCanvasEditorModel(
  source: DirectorySource,
  baseline: MK1MultiPartFrameLosslessIrReport,
): Promise<MK1MultiPartCompositionCanvasEditorReport> {
  await createMK1MultiPartFrameLosslessIrExport(baseline);
  if (baseline.status !== 'SUCCESS' || !baseline.roundTrip.wholeExecutableHashExact || baseline.decision.verdict !== 'MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED') {
    throw new Error('1E.3O.7 requires verified 1E.3O.2 lossless multi-part IR');
  }
  if (baseline.provenance.sha256 !== CANONICAL_SHA) throw new Error('1E.3O.7 prerequisite is not the canonical MK1 fixture');
  const { preview } = qualifyThreePartFrame(baseline);
  const { bytes, hash } = await readCanonicalExe(source, baseline.fixture.exePath, baseline.fixture.exeSize);

  const previewPayloads = new Map<HeartThreePartSymbol, MK1MultiPartPreviewPart>();
  const descriptors: MultiPartCompositionDescriptorModel[] = QUALIFIED.map((symbol, index) => {
    const descriptor = baseline.descriptors.find(d => d.symbol === symbol);
    const irDescriptor = baseline.ir.descriptors.find(d => d.symbol === symbol);
    const payload = preview.find(p => p.symbol === symbol);
    if (!descriptor || !irDescriptor || !payload) throw new Error(`${symbol} is missing from the qualified O2 model`);
    if (!descriptor.decode.success || descriptor.decode.outOfPaletteRangeCount !== 0) throw new Error(`${symbol} preview decode is not qualified`);
    if (descriptor.x !== irDescriptor.x || descriptor.y !== irDescriptor.y || descriptor.width !== irDescriptor.width || descriptor.height !== irDescriptor.height || descriptor.packedReference !== irDescriptor.packedReference) throw new Error(`${symbol} report/IR mismatch`);
    previewPayloads.set(symbol, payload);
    const physicalStart = baseline.coordinateModel.staticDataBase + descriptor.watcomOffset;
    if (readI16(bytes, physicalStart + 4) !== descriptor.x || readI16(bytes, physicalStart + 6) !== descriptor.y) throw new Error(`${symbol} source coordinates drifted from the qualified O2 model`);
    return {
      symbol, structuralPartIndex: index as 0 | 1 | 2, watcomOffset: descriptor.watcomOffset, watcomOffsetHex: descriptor.watcomOffsetHex,
      physicalStart, physicalStartHex: hx(physicalStart), width: descriptor.width, height: descriptor.height, x: descriptor.x, y: descriptor.y,
      packedReference: descriptor.packedReference, packedReferenceHex: descriptor.packedReferenceHex, writableFields: ['x', 'y'],
      decode: { ...descriptor.decode, success: true as const },
    };
  });

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
  const padding = 48;
  const minX = rawMinX - padding, minY = rawMinY - padding, maxX = rawMaxX + padding, maxY = rawMaxY + padding;

  const timestamp = new Date().toISOString();
  const operationId = createOperationId('multi-part-composition-canvas-editor');
  const checks = [
    { checkId: 'CANONICAL_PROVENANCE', passed: hash === CANONICAL_SHA },
    { checkId: 'O2_PREREQUISITE_BOUND', passed: baseline.decision.verdict === 'MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED' },
    { checkId: 'THREE_PART_FRAME_EXACT', passed: descriptors.length === 3 && descriptors.map(d => d.symbol).join('|') === QUALIFIED.join('|') },
    { checkId: 'ALL_THREE_SPRITES_DECODE', passed: previewPayloads.size === 3 },
    { checkId: 'BLOOD_P_INDEX_FIT', passed: descriptors.every(d => d.decode.outOfPaletteRangeCount === 0) },
    { checkId: 'NO_EDIT_SEMANTIC_ROUND_TRIP', passed: mismatchCount === 0 && rebuiltSha256 === hash },
    { checkId: 'FIXED_TOPOLOGY_SCOPE', passed: baseline.ir.preservation.relocationSupported === false && baseline.ir.preservation.ugraEncodingSupported === false },
  ];
  if (!checks.every(c => c.passed)) throw new Error(`1E.3O.7 editor model qualification failed: ${checks.filter(c => !c.passed).map(c => c.checkId).join(', ')}`);

  return {
    format: 'mk1_multi_part_composition_canvas_editor_model_v1', timestamp, operationId,
    provenance: { ...baseline.provenance, timestamp, operationId }, fixture: baseline.fixture,
    prerequisite: { pass: '1E.3O.2', operationId: baseline.operationId, verdict: 'MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED', validationPassed: true },
    coordinateModel: baseline.coordinateModel,
    composition: { owner: 'KANO', semanticName: 'HEART_RIP_MULTI', sequence: 'PRIMARY', sequenceFrameIndex: 2, frameRecordKey: 'heart_2', previewKey: 'PRIMARY:2', structuralPartCount: 3, structuralOrderOnly: true, finalPixelZOrderPromoted: false },
    resource: baseline.resource, palette: baseline.palette, descriptors,
    canvas: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, anchorX: 0, anchorY: 0, padding, recommendedScale: 5 },
    serializer: { semanticIr: 'mk1_animation_ir_v1', serializer: 'serializeMK1BoundedAnimationIr', inPlaceDescriptorWritesOnly: true, signedInt16XY: true, fixedPartCount: true, frameRecordPointersReadOnly: true, descriptorWidthHeightReadOnly: true, packedReferenceReadOnly: true, paletteReadOnly: true, relocationSupported: false, ugraEncodingSupported: false, addRemoveDuplicatePartsSupported: false },
    noEditRoundTrip: { sourceSha256: hash, rebuiltSha256, mismatchCount, exact: mismatchCount === 0 && rebuiltSha256 === hash, semanticRegionCount: serialized.length },
    decision: { interactivePerPartXYAuthoringEstablished: true, previewDecodeEstablished: true, boundedWritableSerializerEstablished: true, topologyEditingEstablished: false, genericAnimationCompilerEstablished: false, verdict: 'KANO_HEART_THREE_PART_BOUNDED_CANVAS_EDITOR_ESTABLISHED', narrative: 'The O2-qualified Kano heart-rip three-part frame is promoted into a bounded composition editor. KHEART3A, KHEART3B and KHEART3C remain the fixed structural pointer list and expose only their descriptor-local signed-int16 X/Y fields. A fresh canonical-source no-edit serialization of all 22 O2 semantic regions is byte-identical and preserves the canonical SHA-256. Authoring edits are compiled through mk1_animation_ir_v1 and serializeMK1BoundedAnimationIr; part count, frame-record pointers, dimensions, packed GRA references, palette, pixels, relocation and gameplay/collision state remain read-only.' },
    status: 'SUCCESS', validation: { allChecksPassed: true, checks }, baselineIr: cloneIr(baseline.ir), previewPayloads,
  };
}

export function createMK1MultiPartCompositionCanvasEditorExport(report: MK1MultiPartCompositionCanvasEditorReport) {
  const { previewPayloads: _preview, ...serializable } = report;
  return serializable;
}

export async function executeMultiPartCompositionCanvasEdit(
  source: DirectorySource,
  model: MK1MultiPartCompositionCanvasEditorReport,
  request: MK1MultiPartCompositionCanvasEditRequest,
): Promise<MK1MultiPartCompositionCanvasEditResult> {
  if (model.status !== 'SUCCESS' || !model.validation.allChecksPassed || model.decision.verdict !== 'KANO_HEART_THREE_PART_BOUNDED_CANVAS_EDITOR_ESTABLISHED') throw new Error('Composition edit requires a verified 1E.3O.7 editor model');
  if (!Array.isArray(request.changes) || request.changes.length < 1) throw new Error('Composition edit requires at least one changed part');
  const seen = new Set<string>();
  for (const c of request.changes) {
    if (!(QUALIFIED as readonly string[]).includes(c.symbol)) throw new Error(`Unqualified composition part rejected: ${c.symbol}`);
    if (seen.has(c.symbol)) throw new Error(`Duplicate composition edit for ${c.symbol}`);
    seen.add(c.symbol); ensureI16(c.x, `${c.symbol}.x`); ensureI16(c.y, `${c.symbol}.y`);
  }

  const { bytes: originalExe, hash: originalHash } = await readCanonicalExe(source, model.fixture.exePath, model.fixture.exeSize);
  if (originalHash !== model.noEditRoundTrip.sourceSha256) throw new Error('Canonical executable identity changed from the O7 model');
  const bySymbol = new Map(model.descriptors.map(d => [d.symbol, d] as const));
  const editedIr = cloneIr(model.baselineIr);
  const reportChanges: MK1MultiPartCompositionCanvasEditReport['changes'] = [];
  const expectedChangedBytes: ReturnType<typeof diff> = [];
  let changedFieldCount = 0;

  for (const change of request.changes) {
    const d = bySymbol.get(change.symbol)!;
    const sourceX = readI16(originalExe, d.physicalStart + 4), sourceY = readI16(originalExe, d.physicalStart + 6);
    if (sourceX !== d.x || sourceY !== d.y) throw new Error(`${d.symbol} source coordinates drifted from the O7 model`);
    if (change.x === sourceX && change.y === sourceY) continue;
    const irDescriptor = editedIr.descriptors.find(x => x.symbol === d.symbol);
    if (!irDescriptor || irDescriptor.width !== d.width || irDescriptor.height !== d.height || irDescriptor.packedReference !== d.packedReference) throw new Error(`${d.symbol} IR descriptor changed unexpectedly`);
    const editedFields: Array<'x' | 'y'> = [];
    const partExpectedOffsets: number[] = [];
    const addFieldExpectation = (fieldOffset: number, before: number, after: number) => {
      const b = i16Bytes(before), a = i16Bytes(after);
      for (let i = 0; i < 2; i++) if (b[i] !== a[i]) {
        const physicalOffset = d.physicalStart + fieldOffset + i;
        expectedChangedBytes.push({ physicalOffset, physicalOffsetHex: hx(physicalOffset), before: b[i], after: a[i] });
        partExpectedOffsets.push(physicalOffset);
      }
    };
    if (change.x !== sourceX) { editedFields.push('x'); changedFieldCount++; addFieldExpectation(4, sourceX, change.x); irDescriptor.x = change.x; }
    if (change.y !== sourceY) { editedFields.push('y'); changedFieldCount++; addFieldExpectation(6, sourceY, change.y); irDescriptor.y = change.y; }
    reportChanges.push({ symbol: d.symbol, structuralPartIndex: d.structuralPartIndex, physicalStart: d.physicalStart, physicalStartHex: d.physicalStartHex, before: { x: sourceX, y: sourceY }, after: { x: change.x, y: change.y }, delta: { x: change.x - sourceX, y: change.y - sourceY }, editedFields, expectedChangedByteOffsets: partExpectedOffsets, expectedChangedByteOffsetsHex: partExpectedOffsets.map(hx) });
  }
  if (!reportChanges.length) throw new Error('Composition edit is a no-op; move at least one qualified part');

  expectedChangedBytes.sort((a, b) => a.physicalOffset - b.physicalOffset);
  const serialized = serializeMK1BoundedAnimationIr(editedIr, model.coordinateModel.staticDataBase);
  if (serialized.length !== model.noEditRoundTrip.semanticRegionCount) throw new Error('Bounded serializer region count changed');
  const editedExe = originalExe.slice();
  for (const region of serialized) editedExe.set(region.encoded, region.physicalStart);
  const changedBytes = diff(originalExe, editedExe);
  const exactDiff = sameByteDiff(changedBytes, expectedChangedBytes);
  if (!exactDiff) throw new Error(`Composition serializer whole-EXE diff does not match the requested descriptor X/Y byte changes (${changedBytes.length} actual vs ${expectedChangedBytes.length} expected)`);

  const reversed = editedExe.slice();
  for (const c of changedBytes) reversed[c.physicalOffset] = c.before;
  const editedSha256 = await sha256Bytes(editedExe), reversedSha256 = await sha256Bytes(reversed);
  if (reversedSha256 !== originalHash) throw new Error('Composition edit reversal did not restore canonical MK1.EXE');
  const expectedOffsets = new Set(expectedChangedBytes.map(c => c.physicalOffset));
  const unexpectedByteChanges = changedBytes.filter(c => !expectedOffsets.has(c.physicalOffset)).length;
  if (unexpectedByteChanges !== 0) throw new Error('Composition edit changed bytes outside the requested descriptor X/Y fields');

  const timestamp = new Date().toISOString(), operationId = createOperationId('multi-part-composition-canvas-edit');
  const normalizedRequest: MK1MultiPartCompositionCanvasEditRequest = { ...request, changes: reportChanges.map(c => ({ symbol: c.symbol, x: c.after.x, y: c.after.y })) };
  const report: MK1MultiPartCompositionCanvasEditReport = {
    format: 'mk1_multi_part_composition_canvas_edit_v1', timestamp, operationId,
    provenance: { ...model.provenance, timestamp, operationId }, fixture: model.fixture,
    prerequisite: { pass: '1E.3O.7', operationId: model.operationId, verdict: 'KANO_HEART_THREE_PART_BOUNDED_CANVAS_EDITOR_ESTABLISHED', validationPassed: true },
    request: normalizedRequest, changes: reportChanges, editedIr,
    evidence: { originalSha256: originalHash, editedSha256, reversedSha256, changedDescriptorCount: reportChanges.length, changedFieldCount, changedByteCount: changedBytes.length, expectedChangedByteCount: expectedChangedBytes.length, changedBytes, expectedChangedBytes, unexpectedByteChanges, reverseRestoresOriginal: reversedSha256 === originalHash, wholeExecutableDiffExactlyExpected: exactDiff },
    constraints: { fixedThreePartTopology: true, partCountUntouched: true, frameRecordPointersUntouched: true, dimensionsUntouched: true, packedReferencesUntouched: true, graPixelsUntouched: true, paletteUntouched: true, relocationUnused: true, collisionAndGameplayUntouched: true },
    status: 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING',
    runtime: { tested: false, result: 'NOT_TESTED', expectedObservation: 'During Kano\'s heart-rip three-part KHEART3 frame, only the authored KHEART3A/B/C descriptor-local placements should change. The frame topology, sprite pixels, palette and fatality/gameplay logic are untouched. Because later runtime object adjustments can exist, the canvas is a structural descriptor-local composition preview rather than a claim of universal final screen coordinates.' },
  };
  return { originalExe, editedExe, report };
}

export function createMK1MultiPartCompositionCanvasEditExport(result: MK1MultiPartCompositionCanvasEditResult) { return result.report; }

export async function buildMultiPartCompositionCanvasEditBundle(
  result: MK1MultiPartCompositionCanvasEditResult,
  model: MK1MultiPartCompositionCanvasEditorReport,
): Promise<Uint8Array> {
  if (!result.report.evidence.wholeExecutableDiffExactlyExpected || result.report.evidence.unexpectedByteChanges !== 0 || !result.report.evidence.reverseRestoresOriginal) throw new Error('O7 bundle blocked: edit evidence did not pass');
  if (result.report.evidence.originalSha256 !== model.noEditRoundTrip.sourceSha256) throw new Error('O7 bundle baseline mismatch');
  const lines = [
    'MK1 DOS — Pass 1E.3O.7 Interactive Multi-Part Composition Placement Edit', '',
    `Original SHA-256: ${result.report.evidence.originalSha256}`,
    `Edited SHA-256:   ${result.report.evidence.editedSha256}`,
    `Changed parts:    ${result.report.evidence.changedDescriptorCount}`,
    `Changed fields:   ${result.report.evidence.changedFieldCount}`,
    `Changed bytes:    ${result.report.evidence.changedByteCount}`, '',
    'Semantic placement edits:',
    ...result.report.changes.map(c => `- part ${c.structuralPartIndex} ${c.symbol}: (${c.before.x}, ${c.before.y}) -> (${c.after.x}, ${c.after.y}) [delta ${c.delta.x}, ${c.delta.y}]`), '',
    'Use a SEPARATE copy of the complete MK1 installation and replace only MK1.EXE with the bundled file.',
    'Play as Kano and perform the heart-rip fatality. The brief three-part KHEART3 composition should reflect the authored descriptor-local X/Y changes.',
    'Video capture/frame stepping may help because the frame is brief.', '',
    'Fixed-topology safety boundary:',
    '- no parts were added, removed or duplicated',
    '- frame-record pointers and part count are unchanged',
    '- width/height and packed GRA references are unchanged',
    '- GRA sprite pixels and BLOOD_P are unchanged',
    '- no relocation/allocation was used',
    '- collision, damage and gameplay logic are untouched', '',
    'The preview is structural descriptor-local composition; it does not assert universal final z-order or later runtime object-motion semantics.',
  ];
  return buildStoredZip([
    { name: 'MK1.EXE', bytes: result.editedExe },
    { name: 'mk1_multi_part_composition_canvas_edit.json', bytes: new TextEncoder().encode(JSON.stringify(result.report, null, 2)) },
    { name: 'mk1_animation_ir_edited.json', bytes: new TextEncoder().encode(JSON.stringify(result.report.editedIr, null, 2)) },
    { name: 'READ_ME_FIRST.txt', bytes: new TextEncoder().encode(lines.join('\r\n')) },
  ]);
}
