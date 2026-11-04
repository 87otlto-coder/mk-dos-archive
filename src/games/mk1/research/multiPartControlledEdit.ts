/**
 * MK1 controlled multi-part XY edit + lossless write-back — Pass 1E.3O.3.
 *
 * Bounded purpose:
 *  - mutate one already-qualified multi-part descriptor field through mk1_animation_ir_v1;
 *  - reserialize only through the 1E.3O.2 semantic serializer;
 *  - prove the edited executable differs at exactly the intended int16 field bytes;
 *  - prove reversing those bytes restores the canonical executable exactly;
 *  - package a runtime-testable MK1.EXE without claiming a generic animation compiler.
 *
 * This pass does NOT relocate records, resize pointer lists, add/remove parts, or encode uGRA.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { sha256Bytes } from './paletteRoundTripCodec';
import {
  createMK1MultiPartFrameLosslessIrExport,
  MK1MultiPartFrameLosslessIrReport,
  serializeMK1BoundedAnimationIr,
} from './multiPartFrameLosslessIr';

const CANONICAL_MK1_SHA256 = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const TARGET_DESCRIPTOR = 'KHEART3B' as const;
const TARGET_FRAME = 'heart_2' as const;
const ORIGINAL_X = 19;
const EDITED_X = -12;

function hex(v: number): string { return `0x${(v >>> 0).toString(16).padStart(8, '0').toUpperCase()}`; }
function byteHex(v: number): string { return (v & 0xff).toString(16).padStart(2, '0').toUpperCase(); }
function i16Bytes(v: number): [number, number] { const u = v & 0xffff; return [u & 0xff, (u >>> 8) & 0xff]; }
function diffBytes(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) throw new Error('Executable lengths differ');
  const out: Array<{ physicalOffset: number; physicalOffsetHex: string; before: number; after: number; beforeHex: string; afterHex: string }> = [];
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) out.push({ physicalOffset: i, physicalOffsetHex: hex(i), before: a[i], after: b[i], beforeHex: byteHex(a[i]), afterHex: byteHex(b[i]) });
  return out;
}
function cloneIr(ir: MK1MultiPartFrameLosslessIrReport['ir']): MK1MultiPartFrameLosslessIrReport['ir'] {
  return JSON.parse(JSON.stringify(ir)) as MK1MultiPartFrameLosslessIrReport['ir'];
}

export interface MK1MultiPartControlledEditReport {
  format: 'mk1_multi_part_controlled_xy_edit_v1';
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
  edit: {
    semanticTarget: 'KANO.HEART_RIP_MULTI.PRIMARY.frame3.part1.KHEART3B.x';
    frameKey: 'heart_2';
    sequence: 'PRIMARY';
    sequenceFrameIndex: 2;
    structuralPartIndex: 1;
    descriptorSymbol: 'KHEART3B';
    descriptorWatcomOffset: number;
    descriptorWatcomOffsetHex: string;
    descriptorPhysical: number;
    descriptorPhysicalHex: string;
    field: 'x';
    fieldPhysical: number;
    fieldPhysicalHex: string;
    before: number;
    after: number;
    delta: number;
    beforeBytesHex: string;
    afterBytesHex: string;
  };
  irMutation: {
    viaSemanticIr: true;
    irFormat: 'mk1_animation_ir_v1';
    serializer: 'serializeMK1BoundedAnimationIr';
    semanticRegionCount: number;
    mutatedRegion: 'DESC_KHEART3B';
    relocationUsed: false;
    frameRecordResized: false;
    partCountChanged: false;
    ugraEncodingUsed: false;
  };
  editedIr: MK1MultiPartFrameLosslessIrReport['ir'];
  evidence: {
    originalExeSha256: string;
    editedExeSha256: string;
    reversedExeSha256: string;
    executableByteLength: number;
    changedByteCount: number;
    expectedChangedByteCount: 2;
    changedBytes: Array<{ physicalOffset: number; physicalOffsetHex: string; before: number; after: number; beforeHex: string; afterHex: string }>;
    expectedChangedOffsets: number[];
    expectedChangedOffsetsHex: string[];
    unexpectedByteChanges: number;
    reverseRestoresOriginal: boolean;
    untouchedSerializedRegionsRemainExact: boolean;
  };
  decision: {
    boundedSemanticDescriptorEditEstablished: boolean;
    exactTwoByteWriteBackEstablished: boolean;
    reversibleWriteBackEstablished: boolean;
    runtimeTestPending: true;
    genericWritableAnimationCompilerEstablished: false;
    relocationSupported: false;
    addRemovePartSupported: false;
    ugraEncoderEstablished: false;
    verdict: 'BOUNDED_MULTI_PART_XY_EDIT_STATICALLY_VERIFIED';
    narrative: string;
  };
  status: 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING';
  runtime: {
    tested: false;
    result: 'NOT_TESTED';
    expectedObservation: string;
  };
}

export interface MK1MultiPartControlledEditResult {
  originalExe: Uint8Array;
  editedExe: Uint8Array;
  report: MK1MultiPartControlledEditReport;
}

export async function executeMultiPartControlledEdit(
  source: DirectorySource,
  baseline: MK1MultiPartFrameLosslessIrReport,
): Promise<MK1MultiPartControlledEditResult> {
  if (source.isSynthetic !== false) throw new Error('1E.3O.3 requires an authentic user-loaded MK1 directory');
  await createMK1MultiPartFrameLosslessIrExport(baseline);
  if (baseline.status !== 'SUCCESS' || baseline.decision.verdict !== 'MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED') throw new Error('1E.3O.3 requires verified 1E.3O.2');
  if (baseline.provenance.sha256 !== CANONICAL_MK1_SHA256) throw new Error('1E.3O.3 controlled edit is bound to the canonical MK1.EXE fixture');

  const entries = await source.listRecursive();
  const exe = entries.find(e => e.path === baseline.fixture.exePath);
  if (!exe || exe.size !== baseline.fixture.exeSize) throw new Error('MK1.EXE changed since 1E.3O.2');
  const originalExe = await source.readSlice(exe.path, 0, exe.size);
  const originalHash = await sha256Bytes(originalExe);
  if (originalHash !== baseline.provenance.sha256 || originalHash !== CANONICAL_MK1_SHA256) throw new Error('MK1.EXE SHA-256 changed since 1E.3O.2');

  const targetFrame = baseline.ir.frames.find(f => f.frameKey === TARGET_FRAME);
  if (!targetFrame || targetFrame.parts.length !== 3 || targetFrame.parts[1]?.descriptorSymbol !== TARGET_DESCRIPTOR) throw new Error('Expected KHEART3 three-part frame structure changed');
  const sourceDescriptor = baseline.ir.descriptors.find(d => d.symbol === TARGET_DESCRIPTOR);
  if (!sourceDescriptor || sourceDescriptor.x !== ORIGINAL_X || sourceDescriptor.y !== -18) throw new Error('KHEART3B descriptor baseline changed');

  const editedIr = cloneIr(baseline.ir);
  const editedDescriptor = editedIr.descriptors.find(d => d.symbol === TARGET_DESCRIPTOR);
  if (!editedDescriptor) throw new Error('KHEART3B missing from editable IR');
  editedDescriptor.x = EDITED_X;

  const serialized = serializeMK1BoundedAnimationIr(editedIr, baseline.coordinateModel.staticDataBase);
  if (serialized.length !== baseline.ir.preservation.semanticRegionCount) throw new Error('Bounded serializer region count changed');
  const mutatedRegion = serialized.find(r => r.name === 'DESC_KHEART3B');
  if (!mutatedRegion) throw new Error('Serialized KHEART3B region missing');

  const editedExe = originalExe.slice();
  for (const region of serialized) editedExe.set(region.encoded, region.physicalStart);

  const descriptorPhysical = baseline.coordinateModel.staticDataBase + sourceDescriptor.offset;
  const fieldPhysical = descriptorPhysical + 4;
  const [beforeLo, beforeHi] = i16Bytes(ORIGINAL_X);
  const [afterLo, afterHi] = i16Bytes(EDITED_X);
  if (originalExe[fieldPhysical] !== beforeLo || originalExe[fieldPhysical + 1] !== beforeHi) throw new Error('Canonical KHEART3B x bytes do not match semantic baseline');
  if (editedExe[fieldPhysical] !== afterLo || editedExe[fieldPhysical + 1] !== afterHi) throw new Error('Semantic serializer did not encode the requested KHEART3B x value');

  const changes = diffBytes(originalExe, editedExe);
  const expectedOffsets = [fieldPhysical, fieldPhysical + 1];
  const unexpected = changes.filter(c => !expectedOffsets.includes(c.physicalOffset));
  if (changes.length !== 2 || unexpected.length !== 0 || !expectedOffsets.every(o => changes.some(c => c.physicalOffset === o))) {
    throw new Error(`Controlled XY edit changed ${changes.length} bytes; expected exactly the two KHEART3B x bytes`);
  }

  // Reversal is intentionally byte-local: restore only the actual changed bytes.
  const reversed = editedExe.slice();
  for (const change of changes) reversed[change.physicalOffset] = change.before;
  const editedHash = await sha256Bytes(editedExe);
  const reversedHash = await sha256Bytes(reversed);
  if (reversedHash !== originalHash) throw new Error('Controlled XY edit reversal did not restore canonical MK1.EXE');

  // Every other serialized semantic region must still byte-match the source.
  let untouchedSerializedRegionsRemainExact = true;
  for (const region of serialized) {
    if (region.name === 'DESC_KHEART3B') continue;
    const sourceBytes = originalExe.slice(region.physicalStart, region.physicalStart + region.encoded.length);
    if (sourceBytes.length !== region.encoded.length) { untouchedSerializedRegionsRemainExact = false; break; }
    for (let i = 0; i < sourceBytes.length; i++) if (sourceBytes[i] !== region.encoded[i]) { untouchedSerializedRegionsRemainExact = false; break; }
    if (!untouchedSerializedRegionsRemainExact) break;
  }
  if (!untouchedSerializedRegionsRemainExact) throw new Error('A non-target semantic region changed during controlled edit serialization');

  const timestamp = new Date().toISOString();
  const operationId = createOperationId('multi-part-controlled-xy-edit');
  const report: MK1MultiPartControlledEditReport = {
    format: 'mk1_multi_part_controlled_xy_edit_v1', timestamp, operationId,
    provenance: { ...baseline.provenance, timestamp, operationId },
    fixture: baseline.fixture,
    prerequisite: { pass: '1E.3O.2', operationId: baseline.operationId, verdict: 'MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED', validationPassed: true },
    edit: {
      semanticTarget: 'KANO.HEART_RIP_MULTI.PRIMARY.frame3.part1.KHEART3B.x', frameKey: TARGET_FRAME, sequence: 'PRIMARY', sequenceFrameIndex: 2,
      structuralPartIndex: 1, descriptorSymbol: TARGET_DESCRIPTOR, descriptorWatcomOffset: sourceDescriptor.offset, descriptorWatcomOffsetHex: hex(sourceDescriptor.offset),
      descriptorPhysical, descriptorPhysicalHex: hex(descriptorPhysical), field: 'x', fieldPhysical, fieldPhysicalHex: hex(fieldPhysical), before: ORIGINAL_X, after: EDITED_X,
      delta: EDITED_X - ORIGINAL_X, beforeBytesHex: `${byteHex(beforeLo)} ${byteHex(beforeHi)}`, afterBytesHex: `${byteHex(afterLo)} ${byteHex(afterHi)}`,
    },
    irMutation: {
      viaSemanticIr: true, irFormat: 'mk1_animation_ir_v1', serializer: 'serializeMK1BoundedAnimationIr', semanticRegionCount: serialized.length,
      mutatedRegion: 'DESC_KHEART3B', relocationUsed: false, frameRecordResized: false, partCountChanged: false, ugraEncodingUsed: false,
    },
    editedIr,
    evidence: {
      originalExeSha256: originalHash, editedExeSha256: editedHash, reversedExeSha256: reversedHash, executableByteLength: originalExe.length,
      changedByteCount: changes.length, expectedChangedByteCount: 2, changedBytes: changes, expectedChangedOffsets: expectedOffsets,
      expectedChangedOffsetsHex: expectedOffsets.map(hex), unexpectedByteChanges: unexpected.length, reverseRestoresOriginal: reversedHash === originalHash,
      untouchedSerializedRegionsRemainExact,
    },
    decision: {
      boundedSemanticDescriptorEditEstablished: true, exactTwoByteWriteBackEstablished: true, reversibleWriteBackEstablished: true,
      runtimeTestPending: true, genericWritableAnimationCompilerEstablished: false, relocationSupported: false, addRemovePartSupported: false, ugraEncoderEstablished: false,
      verdict: 'BOUNDED_MULTI_PART_XY_EDIT_STATICALLY_VERIFIED',
      narrative: 'The verified 1E.3O.2 mk1_animation_ir_v1 is cloned, KHEART3B.x is changed semantically from +19 to -12, and the existing bounded semantic serializer rebuilds all 22 qualified regions. Against the canonical MK1.EXE, the whole executable differs at exactly the two bytes of the signed x field and nowhere else. Restoring only those two bytes returns the canonical SHA-256 exactly. This establishes controlled in-place descriptor write-back through the animation IR, while relocation, frame-record resizing, part insertion/removal and uGRA encoding remain explicitly unsupported.',
    },
    status: 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING',
    runtime: {
      tested: false, result: 'NOT_TESTED',
      expectedObservation: 'Perform Kano\'s heart-rip fatality. In the verified three-part KHEART3 frame, the KHEART3B component is shifted 31 pixels left relative to its original descriptor position while KHEART3A, KHEART3C, the frame record, palette and sprite pixels remain unchanged. The frame is brief, so video capture or frame stepping may make the displacement easier to see.',
    },
  };
  return { originalExe, editedExe, report };
}

export async function createMK1MultiPartControlledEditExport(result: MK1MultiPartControlledEditResult) {
  const r = result.report;
  const expectedBefore = i16Bytes(r.edit.before).map(byteHex).join(' ');
  const expectedAfter = i16Bytes(r.edit.after).map(byteHex).join(' ');
  const checks = [
    { checkId: 'PROVENANCE_CANONICAL_REAL_USER_LOADED', passed: r.provenance.sourceKind === 'user-loaded-directory' && r.provenance.synthetic === false && r.provenance.artifactGeneratedByTest === false && r.evidence.originalExeSha256 === CANONICAL_MK1_SHA256 },
    { checkId: 'O2_PREREQUISITE_BOUND', passed: r.prerequisite.pass === '1E.3O.2' && r.prerequisite.validationPassed && r.prerequisite.verdict === 'MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED' },
    { checkId: 'SEMANTIC_IR_MUTATION', passed: r.irMutation.viaSemanticIr && r.irMutation.irFormat === 'mk1_animation_ir_v1' && r.edit.descriptorSymbol === TARGET_DESCRIPTOR && r.edit.before === ORIGINAL_X && r.edit.after === EDITED_X },
    { checkId: 'EXACT_TWO_BYTE_DIFF', passed: r.evidence.changedByteCount === 2 && r.evidence.expectedChangedByteCount === 2 && r.evidence.unexpectedByteChanges === 0 && r.evidence.changedBytes.map(c => c.physicalOffset).join(',') === r.evidence.expectedChangedOffsets.join(',') },
    { checkId: 'SIGNED_X_ENCODING', passed: r.edit.beforeBytesHex === expectedBefore && r.edit.afterBytesHex === expectedAfter && r.evidence.changedBytes[0]?.before === i16Bytes(ORIGINAL_X)[0] && r.evidence.changedBytes[1]?.before === i16Bytes(ORIGINAL_X)[1] },
    { checkId: 'OTHER_SEMANTIC_REGIONS_UNTOUCHED', passed: r.evidence.untouchedSerializedRegionsRemainExact },
    { checkId: 'REVERSAL_CANONICAL', passed: r.evidence.reverseRestoresOriginal && r.evidence.reversedExeSha256 === CANONICAL_MK1_SHA256 },
    { checkId: 'SCOPE_BOUNDARY', passed: r.decision.genericWritableAnimationCompilerEstablished === false && r.decision.relocationSupported === false && r.decision.addRemovePartSupported === false && r.decision.ugraEncoderEstablished === false },
  ];
  if (r.status !== 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING' || !checks.every(c => c.passed)) throw new Error(`1E.3O.3 export blocked: ${checks.filter(c => !c.passed).map(c => c.checkId).join(', ') || 'invalid status'}`);
  return { metadata: { name: 'MK1 Controlled Multi-Part XY Edit + Lossless Write-Back', milestone: 'Pass 1E.3O.3', formatVersion: r.format, exportTimestamp: r.timestamp }, ...r, validation: { allChecksPassed: true, checks } };
}

export async function buildMultiPartControlledEditBundle(
  result: MK1MultiPartControlledEditResult,
  baseline: MK1MultiPartFrameLosslessIrReport,
): Promise<Uint8Array> {
  const editArtifact = await createMK1MultiPartControlledEditExport(result);
  const baselineArtifact = await createMK1MultiPartFrameLosslessIrExport(baseline);
  if (result.report.evidence.originalExeSha256 !== baseline.provenance.sha256) throw new Error('1E.3O.3 bundle baseline mismatch');
  const encoder = new TextEncoder();
  const r = result.report;
  const instructions = `MK1 CONTROLLED MULTI-PART XY EDIT — Pass 1E.3O.3\n\nSTATIC VALIDATION PASSED. RUNTIME OBSERVATION PENDING.\n\nSemantic edit:\n  KANO.HEART_RIP_MULTI.PRIMARY.frame3.part1.KHEART3B.x\n  ${r.edit.before} -> ${r.edit.after} (delta ${r.edit.delta})\n\nThe bounded mk1_animation_ir_v1 was edited and reserialized. Exactly two executable bytes changed, both belonging to the signed 16-bit KHEART3B x field. No frame pointers, palette data, sprite pixels, code, combat logic, or other qualified semantic regions were changed.\n\nRuntime test:\n1. Use a separate copy of the complete untouched MK1 installation.\n2. Replace MK1.EXE with the one in this ZIP.\n3. Play as Kano and perform the heart-rip fatality.\n4. During the brief three-part KHEART3 frame, one overlapping component should be displaced 31 pixels to the left. Video capture/frame stepping may make it easier to see.\n5. Confirm the fatality otherwise proceeds normally.\n6. Restore your untouched MK1.EXE afterwards.\n\nOriginal SHA-256: ${r.evidence.originalExeSha256}\nEdited SHA-256: ${r.evidence.editedExeSha256}\nReversed SHA-256: ${r.evidence.reversedExeSha256}\nChanged bytes: ${r.evidence.changedByteCount}\nChanged offsets: ${r.evidence.expectedChangedOffsetsHex.join(', ')}\nBefore int16 bytes: ${r.edit.beforeBytesHex}\nAfter int16 bytes: ${r.edit.afterBytesHex}\nUnexpected byte changes: ${r.evidence.unexpectedByteChanges}\nReversal restores canonical: ${r.evidence.reverseRestoresOriginal}\n`;
  return buildStoredZip([
    { name: 'MK1.EXE', bytes: result.editedExe },
    { name: 'mk1_multi_part_controlled_xy_edit.json', bytes: encoder.encode(JSON.stringify(editArtifact, null, 2)) },
    { name: 'mk1_multi_part_frame_lossless_ir.json', bytes: encoder.encode(JSON.stringify(baselineArtifact, null, 2)) },
    { name: 'mk1_animation_ir_edited.json', bytes: encoder.encode(JSON.stringify(r.editedIr, null, 2)) },
    { name: 'READ_ME_FIRST.txt', bytes: encoder.encode(instructions) },
  ]);
}
