/**
 * MK1 animation stream + morph frame composition ground truth — Pass 1E.3O.1.
 *
 * Bounded purpose:
 *   - qualify DO_NEXT_A9_FRAME command semantics 0..6 from executable code;
 *   - qualify MFRAMEW's frame/sleep control contract;
 *   - parse the eight already-qualified Shang morph streams as controlled fixtures;
 *   - resolve their inline frame records to the three morph descriptors;
 *   - decode those descriptors from GRAPHICS/EMP.GRA with the transition palette;
 *   - establish a stable, previewable single-part frame composition fixture.
 *
 * This pass is read-only. It does NOT claim that every MK1 frame record is single-part,
 * does NOT edit animation streams/descriptors, and does NOT infer original wall-clock
 * timing beyond the verified caller-supplied process-sleep contract.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { WatcomGlobalSymbol } from '../../../core/executable/watcomDebug/watcomPermanentClassTypes';
import { enumerateMK1WatcomPermanentClasses } from './watcomPermanentClassInventory';
import { decodeUgraSprite } from '../graphics/ugraDecoder';
import { resolveMK1GraTarget } from './spriteDescriptorProbe';
import { createMK1ShangMorphSelectionExport, MK1ShangMorphSelectionReport } from './shangMorphSelection';
import { sha256Bytes } from './paletteRoundTripCodec';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';

function toHex32(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}
function toHex16(value: number): string {
  return `0x${(value & 0xffff).toString(16).padStart(4, '0').toUpperCase()}`;
}
function readU16(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 2 > bytes.length) throw new Error(`readU16 out of range at ${toHex32(offset)}`);
  return bytes[offset] | (bytes[offset + 1] << 8);
}
function readI16(bytes: Uint8Array, offset: number): number {
  const value = readU16(bytes, offset);
  return value & 0x8000 ? value - 0x10000 : value;
}
function readU32(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 4 > bytes.length) throw new Error(`readU32 out of range at ${toHex32(offset)}`);
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}
function readI32(bytes: Uint8Array, offset: number): number { return readU32(bytes, offset) | 0; }
function rel32Target(bytes: Uint8Array, offset: number): number {
  if (bytes[offset] !== 0xe8 && bytes[offset] !== 0xe9) throw new Error(`Expected rel32 CALL/JMP at ${toHex32(offset)}`);
  return offset + 5 + readI32(bytes, offset + 1);
}
function shortJumpTarget(bytes: Uint8Array, offset: number): number {
  if (bytes[offset] !== 0xeb) throw new Error(`Expected short JMP at ${toHex32(offset)}`);
  return offset + 2 + (bytes[offset + 1] << 24 >> 24);
}
function bytesHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(value => value.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}
function exactSymbol(symbols: readonly WatcomGlobalSymbol[], name: string, segment: number, kind: 'code' | 'data'): WatcomGlobalSymbol {
  const matches = symbols.filter(symbol => symbol.valid && symbol.name === name && symbol.segment === segment
    && (kind === 'code' ? symbol.kindBits.isCode : symbol.kindBits.isData));
  if (matches.length !== 1) throw new Error(`1E.3O.1 requires exactly one ${kind} symbol ${name}; found ${matches.length}`);
  return matches[0];
}
function convert15BitColorToRgb(value: number) {
  const mult = 255 / 63;
  const r = Math.min(255, Math.max(0, Math.round(((((value >> 9) & 0x3f) | 1) * mult))));
  const g = Math.min(255, Math.max(0, Math.round(((((value >> 4) & 0x3f) | 1) * mult))));
  const b = Math.min(255, Math.max(0, Math.round(((((value << 1) & 0x3f) | 1) * mult))));
  return { r, g, b, hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase() };
}

export type AnimationStreamEvent =
  | { kind: 'frame'; streamPhysical: number; streamPhysicalHex: string; frameRecordWatcomOffset: number; frameRecordWatcomOffsetHex: string; noSleep: boolean }
  | { kind: 'jump'; streamPhysical: number; streamPhysicalHex: string; targetWatcomOffset: number; targetWatcomOffsetHex: string }
  | { kind: 'flip-multi'; streamPhysical: number; streamPhysicalHex: string }
  | { kind: 'adjust-x'; streamPhysical: number; streamPhysicalHex: string; x: number }
  | { kind: 'adjust-xy'; streamPhysical: number; streamPhysicalHex: string; x: number; y: number }
  | { kind: 'callback'; streamPhysical: number; streamPhysicalHex: string; callbackWatcomOffset: number; callbackWatcomOffsetHex: string; semantic: 'SWITCH_MORPH_PALETTE' | 'RESTORE_GENERIC_FIGHTER_PALETTE' | 'OTHER' }
  | { kind: 'end'; streamPhysical: number; streamPhysicalHex: string };

export interface MK1MorphPreviewPayload {
  targetCharacterId: number;
  targetName: string;
  frameIndex: number;
  descriptorSymbol: string;
  width: number;
  height: number;
  x: number;
  y: number;
  indices: Uint8Array;
  opaqueMask: Uint8Array;
}

export interface AnimationCommandEvidence {
  opcode: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  parameterBytes: number;
  handlerPhysical?: number;
  handlerPhysicalHex?: string;
  classification: string;
  behavior: string;
}

export interface MK1AnimationStreamGroundTruthReport {
  format: 'mk1_animation_stream_ground_truth_v1';
  timestamp: string;
  operationId: string;
  provenance: MK1ShangMorphSelectionReport['provenance'];
  fixture: MK1ShangMorphSelectionReport['fixture'];
  prerequisite: {
    pass: '1E.3N.4';
    operationId: string;
    verdict: 'SHANG_MORPH_ASSET_PALETTE_MODEL_ESTABLISHED';
    validationPassed: true;
  };
  coordinateModel: MK1ShangMorphSelectionReport['coordinateModel'];
  executor: {
    doNextA9Frame: { watcomOffset: number; watcomOffsetHex: string; physicalStart: number; physicalStartHex: string };
    mframew: { watcomOffset: number; watcomOffsetHex: string; physicalStart: number; physicalStartHex: string };
    prcslp: { watcomOffset: number; watcomOffsetHex: string; physicalStart: number; physicalStartHex: string };
    flipMulti: { watcomOffset: number; watcomOffsetHex: string; physicalStart: number; physicalStartHex: string };
    multiAdjustXy: { watcomOffset: number; watcomOffsetHex: string; physicalStart: number; physicalStartHex: string };
    a9: { watcomOffset: number; watcomOffsetHex: string; physicalStart: number; physicalStartHex: string };
    objectFrameFieldOffset: 0x40;
    commandTableWatcomOffset: number;
    commandTableWatcomOffsetHex: string;
    commands: AnimationCommandEvidence[];
    directFrameRule: {
      valueThresholdExclusive: 6;
      storesIntoObjectFrameField: boolean;
      clearsCarryForSleep: boolean;
      classification: 'VERIFIED_DIRECT_FRAME_POINTER_EVENT' | 'UNQUALIFIED';
    };
    terminatorRule: {
      value: 0;
      returnsWithZeroFlag: boolean;
      classification: 'VERIFIED_ANIMATION_STREAM_TERMINATOR' | 'UNQUALIFIED';
    };
    mframewTiming: {
      ordinaryFrameCallsPrcslp: boolean;
      command5SkipsPrcslp: boolean;
      sleepDurationComesFromCallerEax: boolean;
      durationEmbeddedInMorphStream: false;
      classification: 'VERIFIED_CALLER_SUPPLIED_FRAME_DWELL' | 'UNQUALIFIED';
    };
  };
  resource: {
    path: string;
    fileId: number;
    fileSize: number;
    fileSizeHex: string;
    classification: 'VERIFIED_EMP_GRA_RESOURCE';
  };
  targets: Array<{
    targetCharacterId: number;
    targetName: string;
    sequenceWatcomOffset: number;
    sequenceWatcomOffsetHex: string;
    sequencePhysical: number;
    sequencePhysicalHex: string;
    sequenceBytesHex: string;
    events: AnimationStreamEvent[];
    frameRecords: Array<{
      frameIndex: number;
      frameRecordWatcomOffset: number;
      frameRecordWatcomOffsetHex: string;
      frameRecordPhysical: number;
      frameRecordPhysicalHex: string;
      descriptorPointers: number[];
      descriptorPointersHex: string[];
      terminatorPresent: boolean;
      classification: 'VERIFIED_SINGLE_PART_MORPH_FRAME_RECORD';
    }>;
    transitionPalette: {
      symbol: string;
      watcomOffset: number;
      watcomOffsetHex: string;
      declaredLength: number;
      colorWords15: number[];
      colorWords15Hex: string[];
      rgbHex: string[];
    };
    frames: Array<{
      frameIndex: number;
      descriptorSymbol: string;
      descriptorWatcomOffset: number;
      descriptorWatcomOffsetHex: string;
      descriptorPhysical: number;
      descriptorPhysicalHex: string;
      width: number;
      height: number;
      x: number;
      y: number;
      packedReference: number;
      packedReferenceHex: string;
      fileId: number;
      graOffset: number;
      graOffsetHex: string;
      firstDescriptorPaletteLink?: number;
      firstDescriptorPaletteLinkHex?: string;
      paletteLinkMatchesTarget?: boolean;
      decode: {
        success: boolean;
        encodedBytesConsumed: number;
        commandCount: number;
        checksum: string;
        opaquePixelCount: number;
        transparentPixelCount: number;
        opaqueIndexZeroCount: number;
        outOfPaletteRangeCount: number;
        minOpaqueIndex: number | null;
        maxOpaqueIndex: number | null;
      };
      classification: 'VERIFIED_MORPH_SPRITE_DESCRIPTOR_FRAME';
    }>;
    compositionBounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number; anchorCanvasX: number; anchorCanvasY: number };
    classification: 'VERIFIED_MORPH_ANIMATION_STREAM_COMPOSITION';
  }>;
  decision: {
    animationCommandGrammarEstablished: boolean;
    mframewFrameDwellContractEstablished: boolean;
    eightMorphStreamsParsed: boolean;
    morphFrameRecordsAreSinglePartInThisFixture: boolean;
    all24SpritesDecodeAgainstEmpGra: boolean;
    all24SpritesFitTransitionPaletteWithoutIndex0Dependency: boolean;
    genericMultiPartFrameGrammarEstablished: false;
    editableAnimationSerializerEstablished: false;
    runtimePatchRequired: false;
    verdict: 'MORPH_ANIMATION_STREAM_AND_FRAME_COMPOSITION_ESTABLISHED' | 'PARTIAL_ANIMATION_STREAM_MODEL';
    narrative: string;
  };
  status: 'SUCCESS' | 'PARTIAL';
  /** In-memory only. Explicitly removed from authoritative JSON export. */
  previewPayloads?: Map<string, MK1MorphPreviewPayload>;
}

function symSummary(symbol: WatcomGlobalSymbol, base: number) {
  return { watcomOffset: symbol.addressOffset, watcomOffsetHex: toHex32(symbol.addressOffset), physicalStart: base + symbol.addressOffset, physicalStartHex: toHex32(base + symbol.addressOffset) };
}

function parseMorphStream(
  bytes: Uint8Array,
  sequencePhysical: number,
  dataBase: number,
  switchCallback: number,
  normalCallback: number,
): { events: AnimationStreamEvent[]; endPhysical: number } {
  const events: AnimationStreamEvent[] = [];
  let cursor = sequencePhysical;
  for (let guard = 0; guard < 64; guard++) {
    const eventPhysical = cursor;
    const op = readU32(bytes, cursor); cursor += 4;
    if (op === 0) {
      events.push({ kind: 'end', streamPhysical: eventPhysical, streamPhysicalHex: toHex32(eventPhysical) });
      return { events, endPhysical: cursor };
    }
    if (op > 6) {
      events.push({ kind: 'frame', streamPhysical: eventPhysical, streamPhysicalHex: toHex32(eventPhysical), frameRecordWatcomOffset: op, frameRecordWatcomOffsetHex: toHex32(op), noSleep: false });
      continue;
    }
    if (op === 1) {
      const target = readU32(bytes, cursor); cursor += 4;
      events.push({ kind: 'jump', streamPhysical: eventPhysical, streamPhysicalHex: toHex32(eventPhysical), targetWatcomOffset: target, targetWatcomOffsetHex: toHex32(target) });
      continue;
    }
    if (op === 2) {
      events.push({ kind: 'flip-multi', streamPhysical: eventPhysical, streamPhysicalHex: toHex32(eventPhysical) });
      continue;
    }
    if (op === 3) {
      const x = readI16(bytes, cursor); cursor += 2;
      events.push({ kind: 'adjust-x', streamPhysical: eventPhysical, streamPhysicalHex: toHex32(eventPhysical), x });
      continue;
    }
    if (op === 4) {
      const x = readI16(bytes, cursor); const y = readI16(bytes, cursor + 2); cursor += 4;
      events.push({ kind: 'adjust-xy', streamPhysical: eventPhysical, streamPhysicalHex: toHex32(eventPhysical), x, y });
      continue;
    }
    if (op === 5) {
      const framePointer = readU32(bytes, cursor); cursor += 4;
      events.push({ kind: 'frame', streamPhysical: eventPhysical, streamPhysicalHex: toHex32(eventPhysical), frameRecordWatcomOffset: framePointer, frameRecordWatcomOffsetHex: toHex32(framePointer), noSleep: true });
      continue;
    }
    const callback = readU32(bytes, cursor); cursor += 4;
    events.push({
      kind: 'callback', streamPhysical: eventPhysical, streamPhysicalHex: toHex32(eventPhysical),
      callbackWatcomOffset: callback, callbackWatcomOffsetHex: toHex32(callback),
      semantic: callback === switchCallback ? 'SWITCH_MORPH_PALETTE' : callback === normalCallback ? 'RESTORE_GENERIC_FIGHTER_PALETTE' : 'OTHER',
    });
  }
  throw new Error(`Animation stream at ${toHex32(sequencePhysical)} did not terminate within parser guard`);
}

export async function executeAnimationStreamGroundTruth(
  source: DirectorySource,
  options: { shangMorphReport: MK1ShangMorphSelectionReport },
): Promise<MK1AnimationStreamGroundTruthReport> {
  if (source.isSynthetic !== false) throw new Error('1E.3O.1 requires an authentic user-loaded MK1 directory');
  const morph = options.shangMorphReport;
  await createMK1ShangMorphSelectionExport(morph);
  if (morph.status !== 'SUCCESS' || morph.decision.verdict !== 'SHANG_MORPH_ASSET_PALETTE_MODEL_ESTABLISHED') throw new Error('1E.3O.1 requires a fully qualified 1E.3N.4 report');

  const entries = await source.listRecursive();
  const exeEntry = entries.find(entry => entry.path === morph.fixture.exePath);
  if (!exeEntry || exeEntry.size !== morph.fixture.exeSize) throw new Error('MK1.EXE path/size changed since 1E.3N.4');
  const bytes = await source.readSlice(exeEntry.path, 0, exeEntry.size);
  const hash = await sha256Bytes(bytes);
  if (hash !== morph.provenance.sha256) throw new Error('MK1.EXE SHA-256 changed since 1E.3N.4');

  const inventory = await enumerateMK1WatcomPermanentClasses(source);
  if (inventory.status !== 'SUCCESS' || !inventory.result.overallValid) throw new Error('Watcom permanent symbol inventory failed during 1E.3O.1');
  const symbols = inventory.result.globalSymbols.symbols;
  const codeBase = morph.coordinateModel.codeImageBase;
  const dataBase = morph.coordinateModel.staticDataBase;

  const doNext = exactSymbol(symbols, 'DO_NEXT_A9_FRAME', 1, 'code');
  const mframew = exactSymbol(symbols, 'MFRAMEW', 1, 'code');
  const prcslp = exactSymbol(symbols, 'PRCSLP', 1, 'code');
  const flipMulti = exactSymbol(symbols, 'FLIP_MULTI', 1, 'code');
  const multiAdjust = exactSymbol(symbols, 'MULTI_ADJUST_XY', 1, 'code');
  const a9 = exactSymbol(symbols, 'A9', 2, 'data');
  const doNextPhysical = codeBase + doNext.addressOffset;
  const mframewPhysical = codeBase + mframew.addressOffset;
  const prcslpPhysical = codeBase + prcslp.addressOffset;
  const flipMultiPhysical = codeBase + flipMulti.addressOffset;
  const multiAdjustPhysical = codeBase + multiAdjust.addressOffset;

  if (!(bytes[doNextPhysical] === 0x8b && bytes[doNextPhysical + 1] === 0x15 && readU32(bytes, doNextPhysical + 2) === a9.addressOffset)) {
    throw new Error('DO_NEXT_A9_FRAME A9 read shape changed');
  }
  let commandTableWatcomOffset: number | null = null;
  for (let p = doNextPhysical; p < doNextPhysical + 64; p++) {
    if (bytes[p] === 0xff && bytes[p + 1] === 0x24 && bytes[p + 2] === 0x9d) { commandTableWatcomOffset = readU32(bytes, p + 3); break; }
  }
  if (commandTableWatcomOffset === null) throw new Error('Animation command table was not recovered');
  const tablePhysical = dataBase + commandTableWatcomOffset;
  const handlerOffsets = Array.from({ length: 6 }, (_, i) => readU32(bytes, tablePhysical + i * 4));
  const handlers = handlerOffsets.map(offset => codeBase + offset);
  const [h1,h2,h3,h4,h5,h6] = handlers;

  const cmd1Ok = bytes[h1] === 0x8b && bytes[h1 + 1] === 0x15 && readU32(bytes, h1 + 2) === a9.addressOffset
    && bytes[h1 + 6] === 0x8b && bytes[h1 + 7] === 0x02 && bytes[h1 + 8] === 0xa3 && readU32(bytes, h1 + 9) === a9.addressOffset
    && bytes[h1 + 13] === 0xeb && shortJumpTarget(bytes, h1 + 13) === doNextPhysical;
  const cmd2Ok = bytes[h2] === 0xe8 && rel32Target(bytes, h2) === flipMultiPhysical && bytes[h2 + 5] === 0xeb && shortJumpTarget(bytes, h2 + 5) === doNextPhysical;
  const cmd3Ok = bytes[h3] === 0x8b && bytes[h3 + 1] === 0x15 && readU32(bytes, h3 + 2) === a9.addressOffset
    && bytes[h3 + 6] === 0x0f && bytes[h3 + 7] === 0xbf && bytes[h3 + 8] === 0x02
    && bytes[h3 + 9] === 0x83 && bytes[h3 + 10] === 0x05 && readU32(bytes, h3 + 11) === a9.addressOffset && bytes[h3 + 15] === 0x02
    && bytes[h3 + 16] === 0x33 && bytes[h3 + 17] === 0xdb && bytes[h3 + 18] === 0xe8 && rel32Target(bytes, h3 + 18) === multiAdjustPhysical;
  const cmd4Ok = bytes[h4] === 0x8b && bytes[h4 + 1] === 0x15 && readU32(bytes, h4 + 2) === a9.addressOffset
    && bytes[h4 + 6] === 0x0f && bytes[h4 + 7] === 0xbf && bytes[h4 + 8] === 0x02
    && bytes[h4 + 9] === 0x0f && bytes[h4 + 10] === 0xbf && bytes[h4 + 11] === 0x5a && bytes[h4 + 12] === 0x02
    && bytes[h4 + 13] === 0x83 && bytes[h4 + 14] === 0x05 && readU32(bytes, h4 + 15) === a9.addressOffset && bytes[h4 + 19] === 0x04
    && bytes[h4 + 20] === 0xe8 && rel32Target(bytes, h4 + 20) === multiAdjustPhysical;
  const cmd5Ok = bytes[h5] === 0x8b && bytes[h5 + 1] === 0x15 && readU32(bytes, h5 + 2) === a9.addressOffset
    && bytes[h5 + 6] === 0x8b && bytes[h5 + 7] === 0x1a
    && bytes[h5 + 8] === 0x83 && bytes[h5 + 9] === 0x05 && readU32(bytes, h5 + 10) === a9.addressOffset && bytes[h5 + 14] === 0x04
    && bytes[h5 + 15] === 0x89 && bytes[h5 + 16] === 0x5f && bytes[h5 + 17] === 0x40 && bytes[h5 + 18] === 0xf9 && bytes[h5 + 19] === 0xc3;
  const cmd6Ok = bytes[h6] === 0x8b && bytes[h6 + 1] === 0x15 && readU32(bytes, h6 + 2) === a9.addressOffset
    && bytes[h6 + 6] === 0x83 && bytes[h6 + 7] === 0x05 && readU32(bytes, h6 + 8) === a9.addressOffset && bytes[h6 + 12] === 0x04
    && bytes[h6 + 13] === 0xff && bytes[h6 + 14] === 0x12 && bytes[h6 + 15] === 0xeb && shortJumpTarget(bytes, h6 + 15) === doNextPhysical;

  const directFrameOk = bytes[doNextPhysical + 0x13] === 0x83 && bytes[doNextPhysical + 0x14] === 0xfb && bytes[doNextPhysical + 0x15] === 0x06
    && bytes[doNextPhysical + 0x18] === 0x89 && bytes[doNextPhysical + 0x19] === 0x5f && bytes[doNextPhysical + 0x1a] === 0x40 && bytes[doNextPhysical + 0x1b] === 0xf8;
  const terminatorOk = bytes[doNextPhysical + 0x0f] === 0x85 && bytes[doNextPhysical + 0x10] === 0xdb && bytes[doNextPhysical + 0x11] === 0x74;

  // MFRAMEW: save caller EAX, consume stream, terminate on ZF, reparse on CF, sleep on ordinary frame.
  let dispatchCall: number | null = null;
  let sleepCall: number | null = null;
  for (let p = mframewPhysical; p < mframewPhysical + 40; p++) {
    if (bytes[p] === 0xe8) {
      const target = rel32Target(bytes, p);
      if (target === doNextPhysical && dispatchCall === null) dispatchCall = p;
      if (target === prcslpPhysical && sleepCall === null) sleepCall = p;
    }
  }
  const mframewOk = dispatchCall !== null && sleepCall !== null
    && bytes[dispatchCall + 5] === 0x74
    && bytes[dispatchCall + 7] === 0x72
    && sleepCall > dispatchCall;

  const commands: AnimationCommandEvidence[] = [
    { opcode: 0, name: 'END', parameterBytes: 0, classification: 'VERIFIED_ANIMATION_STREAM_TERMINATOR', behavior: 'A zero stream value returns with ZF set; MFRAMEW stops the animation.' },
    { opcode: 1, name: 'STREAM_JUMP', parameterBytes: 4, handlerPhysical: h1, handlerPhysicalHex: toHex32(h1), classification: cmd1Ok ? 'VERIFIED_A9_STREAM_REDIRECT' : 'UNQUALIFIED', behavior: 'Loads the next dword into A9, then resumes DO_NEXT_A9_FRAME from that new stream address.' },
    { opcode: 2, name: 'FLIP_MULTI', parameterBytes: 0, handlerPhysical: h2, handlerPhysicalHex: toHex32(h2), classification: cmd2Ok ? 'VERIFIED_FLIP_MULTI_COMMAND' : 'UNQUALIFIED', behavior: 'Calls the Watcom-symbolled FLIP_MULTI routine, then continues parsing the stream.' },
    { opcode: 3, name: 'ADJUST_X', parameterBytes: 2, handlerPhysical: h3, handlerPhysicalHex: toHex32(h3), classification: cmd3Ok ? 'VERIFIED_MULTI_ADJUST_X_COMMAND' : 'UNQUALIFIED', behavior: 'Reads one signed 16-bit value into EAX, clears EBX, calls MULTI_ADJUST_XY, then continues parsing.' },
    { opcode: 4, name: 'ADJUST_XY', parameterBytes: 4, handlerPhysical: h4, handlerPhysicalHex: toHex32(h4), classification: cmd4Ok ? 'VERIFIED_MULTI_ADJUST_XY_COMMAND' : 'UNQUALIFIED', behavior: 'Reads two signed 16-bit values into EAX/EBX, calls MULTI_ADJUST_XY, then continues parsing.' },
    { opcode: 5, name: 'SET_FRAME_NO_SLEEP', parameterBytes: 4, handlerPhysical: h5, handlerPhysicalHex: toHex32(h5), classification: cmd5Ok ? 'VERIFIED_IMMEDIATE_FRAME_ASSIGNMENT' : 'UNQUALIFIED', behavior: 'Stores the next dword into object +0x40 and returns with carry set; MFRAMEW reparses immediately without PRCSLP.' },
    { opcode: 6, name: 'CALLBACK', parameterBytes: 4, handlerPhysical: h6, handlerPhysicalHex: toHex32(h6), classification: cmd6Ok ? 'VERIFIED_ANIMATION_CALLBACK_OPCODE_6' : 'UNQUALIFIED', behavior: 'Calls the code pointer in the next dword, then continues parsing the stream.' },
  ];

  const graTarget = await resolveMK1GraTarget(source, 'GRAPHICS/EMP.GRA');
  if (graTarget.fileId !== 41) throw new Error(`Expected EMP.GRA handle ID 41; got ${graTarget.fileId}`);
  const graBytes = await source.readSlice(graTarget.path, 0, graTarget.fileSize);
  if (graBytes.length !== graTarget.fileSize) throw new Error('EMP.GRA could not be read in full');

  const previewPayloads = new Map<string, MK1MorphPreviewPayload>();
  const targets: MK1AnimationStreamGroundTruthReport['targets'] = [];
  for (const target of morph.targets) {
    const parsed = parseMorphStream(bytes, target.empAnimationSequencePhysical, dataBase, target.switchPaletteCallbackWatcomOffset, target.normalPaletteCallbackWatcomOffset);
    const frameEvents = parsed.events.filter((event): event is Extract<AnimationStreamEvent, { kind: 'frame' }> => event.kind === 'frame');
    if (frameEvents.length !== 3) throw new Error(`${target.targetName} morph stream did not expose exactly three frame events`);

    const expectedDescriptorOffsets = target.morphDescriptors.map(item => item.watcomOffset);
    const frameRecords = frameEvents.map((event, frameIndex) => {
      const physical = dataBase + event.frameRecordWatcomOffset;
      const descriptorPointers: number[] = [];
      let cursor = physical;
      let terminated = false;
      for (let guard = 0; guard < 16; guard++) {
        const value = readU32(bytes, cursor); cursor += 4;
        if (value === 0) { terminated = true; break; }
        descriptorPointers.push(value);
      }
      if (!terminated || descriptorPointers.length !== 1 || descriptorPointers[0] !== expectedDescriptorOffsets[frameIndex]) {
        throw new Error(`${target.targetName} frame ${frameIndex + 1} is not the expected single-part [descriptor, 0] record`);
      }
      return {
        frameIndex,
        frameRecordWatcomOffset: event.frameRecordWatcomOffset,
        frameRecordWatcomOffsetHex: toHex32(event.frameRecordWatcomOffset),
        frameRecordPhysical: physical,
        frameRecordPhysicalHex: toHex32(physical),
        descriptorPointers,
        descriptorPointersHex: descriptorPointers.map(toHex32),
        terminatorPresent: terminated,
        classification: 'VERIFIED_SINGLE_PART_MORPH_FRAME_RECORD' as const,
      };
    });

    const palettePhysical = dataBase + target.transitionPalette.watcomOffset;
    const paletteLength = readU16(bytes, palettePhysical);
    if (paletteLength !== 23) throw new Error(`${target.transitionPalette.symbol} palette length changed from 23`);
    const colorWords15 = Array.from({ length: paletteLength }, (_, i) => readU16(bytes, palettePhysical + 2 + i * 2));
    if (!colorWords15.every(word => word < 0x8000)) throw new Error(`${target.transitionPalette.symbol} contains a non-15-bit color word`);
    const rgb = colorWords15.map(convert15BitColorToRgb);

    const frames: MK1AnimationStreamGroundTruthReport['targets'][number]['frames'] = [];
    for (let frameIndex = 0; frameIndex < target.morphDescriptors.length; frameIndex++) {
      const descriptor = target.morphDescriptors[frameIndex];
      const p = descriptor.physicalStart;
      const width = readU16(bytes, p);
      const height = readU16(bytes, p + 2);
      const x = readI16(bytes, p + 4);
      const y = readI16(bytes, p + 6);
      const packed = readU32(bytes, p + 8);
      const fileId = (packed >>> 24) & 0xff;
      const graOffset = packed & 0x00ffffff;
      if (fileId !== graTarget.fileId) throw new Error(`${descriptor.symbol} resolves to file ID ${fileId}, expected EMP.GRA ID ${graTarget.fileId}`);
      const decoded = decodeUgraSprite(graBytes, graOffset, width, height);
      if (!decoded.success || !decoded.checksum) throw new Error(`${descriptor.symbol} failed uGRA decode: ${decoded.failureReason ?? 'unknown failure'}`);
      let opaquePixelCount = 0;
      let opaqueIndexZeroCount = 0;
      let outOfPaletteRangeCount = 0;
      let minOpaqueIndex: number | null = null;
      let maxOpaqueIndex: number | null = null;
      for (let i = 0; i < decoded.indices.length; i++) {
        if (!decoded.opaqueMask[i]) continue;
        opaquePixelCount++;
        const index = decoded.indices[i];
        if (index === 0) opaqueIndexZeroCount++;
        if (index < 1 || index > paletteLength) outOfPaletteRangeCount++;
        minOpaqueIndex = minOpaqueIndex === null ? index : Math.min(minOpaqueIndex, index);
        maxOpaqueIndex = maxOpaqueIndex === null ? index : Math.max(maxOpaqueIndex, index);
      }
      const paletteLink = frameIndex === 0 ? readU32(bytes, p + 12) : undefined;
      const paletteLinkMatchesTarget = paletteLink === undefined ? undefined : paletteLink === target.transitionPalette.watcomOffset;
      frames.push({
        frameIndex,
        descriptorSymbol: descriptor.symbol,
        descriptorWatcomOffset: descriptor.watcomOffset,
        descriptorWatcomOffsetHex: descriptor.watcomOffsetHex,
        descriptorPhysical: descriptor.physicalStart,
        descriptorPhysicalHex: descriptor.physicalStartHex,
        width, height, x, y,
        packedReference: packed,
        packedReferenceHex: toHex32(packed),
        fileId,
        graOffset,
        graOffsetHex: toHex32(graOffset),
        firstDescriptorPaletteLink: paletteLink,
        firstDescriptorPaletteLinkHex: paletteLink === undefined ? undefined : toHex32(paletteLink),
        paletteLinkMatchesTarget,
        decode: {
          success: true,
          encodedBytesConsumed: decoded.encodedBytesConsumed,
          commandCount: decoded.commandCount,
          checksum: decoded.checksum,
          opaquePixelCount,
          transparentPixelCount: decoded.indices.length - opaquePixelCount,
          opaqueIndexZeroCount,
          outOfPaletteRangeCount,
          minOpaqueIndex,
          maxOpaqueIndex,
        },
        classification: 'VERIFIED_MORPH_SPRITE_DESCRIPTOR_FRAME',
      });
      previewPayloads.set(`${target.targetCharacterId}:${frameIndex}`, {
        targetCharacterId: target.targetCharacterId,
        targetName: target.targetName,
        frameIndex,
        descriptorSymbol: descriptor.symbol,
        width, height, x, y,
        indices: decoded.indices,
        opaqueMask: decoded.opaqueMask,
      });
    }
    if (!frames[0].paletteLinkMatchesTarget) throw new Error(`${target.targetName} MORPH1 +0x0C no longer points to the target transition palette`);
    const minX = Math.min(...frames.map(frame => frame.x));
    const minY = Math.min(...frames.map(frame => frame.y));
    const maxX = Math.max(...frames.map(frame => frame.x + frame.width));
    const maxY = Math.max(...frames.map(frame => frame.y + frame.height));
    const compositionBounds = { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, anchorCanvasX: -minX, anchorCanvasY: -minY };

    targets.push({
      targetCharacterId: target.targetCharacterId,
      targetName: target.targetName,
      sequenceWatcomOffset: target.empAnimationSequenceWatcomOffset,
      sequenceWatcomOffsetHex: target.empAnimationSequenceWatcomOffsetHex,
      sequencePhysical: target.empAnimationSequencePhysical,
      sequencePhysicalHex: target.empAnimationSequencePhysicalHex,
      sequenceBytesHex: bytesHex(bytes.slice(target.empAnimationSequencePhysical, parsed.endPhysical)),
      events: parsed.events,
      frameRecords,
      transitionPalette: {
        symbol: target.transitionPalette.symbol,
        watcomOffset: target.transitionPalette.watcomOffset,
        watcomOffsetHex: target.transitionPalette.watcomOffsetHex,
        declaredLength: paletteLength,
        colorWords15,
        colorWords15Hex: colorWords15.map(toHex16),
        rgbHex: rgb.map(color => color.hex),
      },
      frames,
      compositionBounds,
      classification: 'VERIFIED_MORPH_ANIMATION_STREAM_COMPOSITION',
    });
  }

  const commandGrammarEstablished = cmd1Ok && cmd2Ok && cmd3Ok && cmd4Ok && cmd5Ok && cmd6Ok && directFrameOk && terminatorOk;
  const allFrames = targets.flatMap(target => target.frames);
  const allDecode = allFrames.length === 24 && allFrames.every(frame => frame.decode.success);
  const allPaletteSafe = allFrames.length === 24 && allFrames.every(frame => frame.decode.opaqueIndexZeroCount === 0 && frame.decode.outOfPaletteRangeCount === 0);
  const allStreams = targets.length === 8 && targets.every(target => {
    const callbacks = target.events.filter((event): event is Extract<AnimationStreamEvent,{kind:'callback'}> => event.kind === 'callback');
    const frameEvents = target.events.filter(event => event.kind === 'frame');
    return frameEvents.length === 3 && callbacks.length === 2 && callbacks[0].semantic === 'SWITCH_MORPH_PALETTE' && callbacks[1].semantic === 'RESTORE_GENERIC_FIGHTER_PALETTE' && target.events[target.events.length - 1]?.kind === 'end';
  });
  const success = commandGrammarEstablished && mframewOk && allStreams && allDecode && allPaletteSafe;
  const timestamp = new Date().toISOString();
  const operationId = createOperationId('animation-stream-ground-truth');

  return {
    format: 'mk1_animation_stream_ground_truth_v1', timestamp, operationId,
    provenance: { ...morph.provenance, timestamp, operationId },
    fixture: morph.fixture,
    prerequisite: { pass: '1E.3N.4', operationId: morph.operationId, verdict: 'SHANG_MORPH_ASSET_PALETTE_MODEL_ESTABLISHED', validationPassed: true },
    coordinateModel: morph.coordinateModel,
    executor: {
      doNextA9Frame: symSummary(doNext, codeBase),
      mframew: symSummary(mframew, codeBase),
      prcslp: symSummary(prcslp, codeBase),
      flipMulti: symSummary(flipMulti, codeBase),
      multiAdjustXy: symSummary(multiAdjust, codeBase),
      a9: symSummary(a9, dataBase),
      objectFrameFieldOffset: 0x40,
      commandTableWatcomOffset,
      commandTableWatcomOffsetHex: toHex32(commandTableWatcomOffset),
      commands,
      directFrameRule: { valueThresholdExclusive: 6, storesIntoObjectFrameField: directFrameOk, clearsCarryForSleep: directFrameOk, classification: directFrameOk ? 'VERIFIED_DIRECT_FRAME_POINTER_EVENT' : 'UNQUALIFIED' },
      terminatorRule: { value: 0, returnsWithZeroFlag: terminatorOk, classification: terminatorOk ? 'VERIFIED_ANIMATION_STREAM_TERMINATOR' : 'UNQUALIFIED' },
      mframewTiming: { ordinaryFrameCallsPrcslp: mframewOk, command5SkipsPrcslp: mframewOk && cmd5Ok, sleepDurationComesFromCallerEax: mframewOk, durationEmbeddedInMorphStream: false, classification: mframewOk && cmd5Ok ? 'VERIFIED_CALLER_SUPPLIED_FRAME_DWELL' : 'UNQUALIFIED' },
    },
    resource: { path: graTarget.path, fileId: graTarget.fileId, fileSize: graTarget.fileSize, fileSizeHex: graTarget.fileSizeHex, classification: 'VERIFIED_EMP_GRA_RESOURCE' },
    targets,
    decision: {
      animationCommandGrammarEstablished: commandGrammarEstablished,
      mframewFrameDwellContractEstablished: mframewOk,
      eightMorphStreamsParsed: allStreams,
      morphFrameRecordsAreSinglePartInThisFixture: targets.every(target => target.frameRecords.every(record => record.descriptorPointers.length === 1 && record.terminatorPresent)),
      all24SpritesDecodeAgainstEmpGra: allDecode,
      all24SpritesFitTransitionPaletteWithoutIndex0Dependency: allPaletteSafe,
      genericMultiPartFrameGrammarEstablished: false,
      editableAnimationSerializerEstablished: false,
      runtimePatchRequired: false,
      verdict: success ? 'MORPH_ANIMATION_STREAM_AND_FRAME_COMPOSITION_ESTABLISHED' : 'PARTIAL_ANIMATION_STREAM_MODEL',
      narrative: success
        ? 'DO_NEXT_A9_FRAME is now qualified as a compact animation bytecode dispatcher: 0 terminates; 1 redirects A9; 2 calls FLIP_MULTI; 3/4 call MULTI_ADJUST_XY with one/two signed offsets; 5 assigns a frame pointer without sleeping; 6 invokes an embedded callback; values above 6 are ordinary frame-record pointers. MFRAMEW sleeps through PRCSLP only after ordinary frame events, using a duration supplied by its caller rather than embedded in these morph streams. The eight Shang morph fixtures each resolve three ordinary frame events to an inline [descriptor, 0] record, and all 24 descriptors decode from EMP.GRA using their target-specific transition palette without opaque index 0 or out-of-range palette indices. This establishes a safe, previewable single-part animation fixture but does not yet generalize multi-part frame records or establish an editable serializer.'
        : 'One or more animation dispatcher, MFRAMEW timing, morph-stream, frame-record, descriptor-decode, or palette-fit checks failed. Do not promote this animation model.',
    },
    status: success ? 'SUCCESS' : 'PARTIAL',
    previewPayloads,
  };
}

export async function createMK1AnimationStreamGroundTruthExport(report: MK1AnimationStreamGroundTruthReport) {
  const checks = [
    { checkId: 'PROVENANCE_REAL_USER_LOADED', passed: report.provenance.sourceKind === 'user-loaded-directory' && report.provenance.synthetic === false && report.provenance.artifactGeneratedByTest === false && /^[0-9a-f]{64}$/.test(report.provenance.sha256) },
    { checkId: 'N4_PREREQUISITE_BOUND', passed: report.prerequisite.pass === '1E.3N.4' && report.prerequisite.validationPassed && report.prerequisite.verdict === 'SHANG_MORPH_ASSET_PALETTE_MODEL_ESTABLISHED' },
    { checkId: 'ANIMATION_COMMAND_GRAMMAR', passed: report.decision.animationCommandGrammarEstablished && report.executor.commands.length === 7 && report.executor.commands.every(command => command.classification.startsWith('VERIFIED_')) },
    { checkId: 'MFRAMEW_DWELL_CONTRACT', passed: report.decision.mframewFrameDwellContractEstablished && report.executor.mframewTiming.ordinaryFrameCallsPrcslp && report.executor.mframewTiming.sleepDurationComesFromCallerEax && !report.executor.mframewTiming.durationEmbeddedInMorphStream },
    { checkId: 'EMP_GRA_RESOURCE', passed: report.resource.fileId === 41 && report.resource.fileSize > 0 },
    { checkId: 'EIGHT_MORPH_STREAMS', passed: report.targets.length === 8 && report.decision.eightMorphStreamsParsed },
    { checkId: 'THREE_SINGLE_PART_FRAMES_EACH', passed: report.targets.every(target => target.frames.length === 3 && target.frameRecords.length === 3 && target.frameRecords.every(record => record.descriptorPointers.length === 1 && record.terminatorPresent)) },
    { checkId: 'TWENTY_FOUR_UGRA_DECODES', passed: report.decision.all24SpritesDecodeAgainstEmpGra && report.targets.flatMap(target => target.frames).length === 24 },
    { checkId: 'TRANSITION_PALETTE_FIT', passed: report.decision.all24SpritesFitTransitionPaletteWithoutIndex0Dependency && report.targets.every(target => target.transitionPalette.declaredLength === 23 && target.frames[0]?.paletteLinkMatchesTarget === true) },
    { checkId: 'SCOPE_BOUNDARY', passed: report.decision.genericMultiPartFrameGrammarEstablished === false && report.decision.editableAnimationSerializerEstablished === false && report.decision.runtimePatchRequired === false },
  ];
  if (report.status !== 'SUCCESS' || !checks.every(check => check.passed)) {
    throw new Error(`1E.3O.1 export blocked: ${checks.filter(check => !check.passed).map(check => check.checkId).join(', ') || 'report status partial'}`);
  }
  const { previewPayloads: _previewPayloads, ...serializable } = report;
  return {
    metadata: { name: 'MK1 Animation Stream + Morph Frame Composition Ground Truth', milestone: 'Pass 1E.3O.1', formatVersion: report.format, exportTimestamp: report.timestamp },
    ...serializable,
    validation: { allChecksPassed: true, checks },
  };
}
