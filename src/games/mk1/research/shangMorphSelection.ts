/**
 * MK1 Shang Tsung morph selection / palette semantics — Pass 1E.3N.4.
 *
 * Bounded purpose:
 *   Explain how Shang Tsung selects a morph target, which target-specific morph
 *   transition assets are used, why the transformed fighter receives the
 *   ordinary fighter palette selection behavior, and how Shang's base palette
 *   is restored on unmorph.
 *
 * This pass is read-only. It does not patch morph logic, AI, animations, combat,
 * palettes, or stage state.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { WatcomGlobalSymbol } from '../../../core/executable/watcomDebug/watcomPermanentClassTypes';
import { enumerateMK1WatcomPermanentClasses } from './watcomPermanentClassInventory';
import { createMK1FighterPaletteOwnershipExport, MK1FighterPaletteOwnershipReport } from './fighterPaletteOwnership';
import { createMK1OpponentAccessHarnessExport, MK1OpponentAccessHarnessReport } from './opponentAccessHarness';
import { sha256Bytes } from './paletteRoundTripCodec';

function toHex32(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

function readU16(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 2 > bytes.length) throw new Error(`readU16 out of range at ${toHex32(offset)}`);
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readU32(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 4 > bytes.length) throw new Error(`readU32 out of range at ${toHex32(offset)}`);
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

function readI32(bytes: Uint8Array, offset: number): number {
  return readU32(bytes, offset) | 0;
}

function bytesHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(value => value.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

function rel32Target(bytes: Uint8Array, callOrJumpPhysical: number): number {
  if (bytes[callOrJumpPhysical] !== 0xe8 && bytes[callOrJumpPhysical] !== 0xe9) {
    throw new Error(`Expected rel32 CALL/JMP at ${toHex32(callOrJumpPhysical)}`);
  }
  return callOrJumpPhysical + 5 + readI32(bytes, callOrJumpPhysical + 1);
}

function exactSymbol(symbols: readonly WatcomGlobalSymbol[], name: string, segment: number, kind: 'code' | 'data'): WatcomGlobalSymbol {
  const matches = symbols.filter(symbol => symbol.valid && symbol.name === name && symbol.segment === segment
    && (kind === 'code' ? symbol.kindBits.isCode : symbol.kindBits.isData));
  if (matches.length !== 1) throw new Error(`1E.3N.4 requires exactly one ${kind} symbol ${name}; found ${matches.length}`);
  return matches[0];
}

function symbolSummary(symbol: WatcomGlobalSymbol, physicalStart: number) {
  return {
    name: symbol.name,
    watcomOffset: symbol.addressOffset,
    watcomOffsetHex: toHex32(symbol.addressOffset),
    physicalStart,
    physicalStartHex: toHex32(physicalStart),
    moduleName: symbol.resolvedModuleName,
  };
}

export interface ShangMorphTargetEvidence {
  targetCharacterId: number;
  targetName: string;
  empAnimationIndex: number;
  empAnimationSequenceWatcomOffset: number;
  empAnimationSequenceWatcomOffsetHex: string;
  empAnimationSequencePhysical: number;
  empAnimationSequencePhysicalHex: string;
  switchPaletteCallbackWatcomOffset: number;
  switchPaletteCallbackWatcomOffsetHex: string;
  normalPaletteCallbackWatcomOffset: number;
  normalPaletteCallbackWatcomOffsetHex: string;
  morphDescriptors: Array<{
    symbol: string;
    watcomOffset: number;
    watcomOffsetHex: string;
    physicalStart: number;
    physicalStartHex: string;
  }>;
  transitionPalette: {
    symbol: string;
    watcomOffset: number;
    watcomOffsetHex: string;
    physicalStart: number;
    physicalStartHex: string;
    declaredLength: number;
    linkedFromMorph1Plus0C: boolean;
  };
  fighterPaletteSlot: {
    normalSymbols: string[];
    alternateSymbols: string[];
    sameRecordForNormalAndAlternate: boolean;
  };
  classification: 'VERIFIED_EMP_MORPH_TARGET_ASSET_ROUTE';
}

export interface MK1ShangMorphSelectionReport {
  format: 'mk1_shang_morph_selection_v1';
  timestamp: string;
  operationId: string;
  provenance: MK1FighterPaletteOwnershipReport['provenance'];
  fixture: { exePath: string; exeSize: number; exeSizeHex: string };
  prerequisite: {
    ownershipPass: '1E.3L';
    ownershipOperationId: string;
    accessPass: '1E.3N.1';
    accessOperationId: string;
    validationPassed: true;
  };
  coordinateModel: MK1OpponentAccessHarnessReport['coordinateModel'];
  symbols: {
    empMorphSansGoro: ReturnType<typeof symbolSummary>;
    empMorph: ReturnType<typeof symbolSummary>;
    empUnmorph: ReturnType<typeof symbolSummary>;
    empAniTab: ReturnType<typeof symbolSummary>;
    playerNormpal: ReturnType<typeof symbolSummary>;
    playerSwpal: ReturnType<typeof symbolSummary>;
    doNextA9Frame: ReturnType<typeof symbolSummary>;
    getCharAni: ReturnType<typeof symbolSummary>;
    getCharLong: ReturnType<typeof symbolSummary>;
    randu: ReturnType<typeof symbolSummary>;
    isFighterLoaded: ReturnType<typeof symbolSummary>;
    a9: ReturnType<typeof symbolSummary>;
  };
  targetSelection: {
    randomSansGoro: {
      physicalStart: number;
      physicalStartHex: string;
      bytesHex: string;
      randomUpperBound: 7;
      postRandomDecrement: true;
      candidateCharacterIds: number[];
      loadedFighterCheckTarget: number;
      loadedFighterCheckTargetHex: string;
      fallsIntoEmpMorph: boolean;
      classification: 'VERIFIED_RANDOM_LOADED_PLAYABLE_TARGET_0_TO_6';
    };
    directGoroMorph: {
      targetCharacterId: 7;
      callSites: Array<{ physicalOffset: number; physicalOffsetHex: string; bytesHex: string }>;
      supportedByEmpMorph: boolean;
      classification: 'VERIFIED_DIRECT_ID7_EMP_MORPH_PATH';
    };
    empMorph: {
      sequenceLookupBeforeIdentitySwap: boolean;
      a9IndexBias: 7;
      objectIdentityFieldOffset: number;
      objectIdentityFieldOffsetHex: string;
      identityStorePhysical: number;
      identityStorePhysicalHex: string;
      getCharAniCallPhysical: number;
      getCharAniCallPhysicalHex: string;
      animationExecutorTarget: number;
      animationExecutorTargetHex: string;
      classification: 'VERIFIED_EMP_TARGET_INDEXED_MORPH_SEQUENCE';
    };
  };
  animationCommand6: {
    dispatcherPhysical: number;
    dispatcherPhysicalHex: string;
    commandTableWatcomOffset: number;
    commandTableWatcomOffsetHex: string;
    command6HandlerPhysical: number;
    command6HandlerPhysicalHex: string;
    handlerCallsNextDword: boolean;
    classification: 'VERIFIED_ANIMATION_CALLBACK_OPCODE_6';
  };
  paletteCallbacks: {
    switchMorphPalette: {
      watcomOffset: number;
      watcomOffsetHex: string;
      physicalStart: number;
      physicalStartHex: string;
      bytesHex: string;
      jumpsToPlayerSwpal: boolean;
      classification: 'VERIFIED_MORPH_TRANSITION_PALETTE_CALLBACK';
    };
    restoreGenericFighterPalette: {
      watcomOffset: number;
      watcomOffsetHex: string;
      physicalStart: number;
      physicalStartHex: string;
      bytesHex: string;
      callsPlayerNormpal: boolean;
      preservesA9: boolean;
      classification: 'VERIFIED_MORPH_TARGET_GENERIC_PALETTE_CALLBACK';
    };
  };
  genericPaletteSelection: {
    normalTableWatcomOffset: number;
    normalTableWatcomOffsetHex: string;
    alternateTableWatcomOffset: number;
    alternateTableWatcomOffsetHex: string;
    indexesByObjectIdentityField: boolean;
    sameCharacterAlternateRuleRetained: boolean;
    greenNinjaOverrideRetained: boolean;
    classification: 'VERIFIED_GENERIC_PLAYER_NORMPAL_SELECTION';
  };
  targets: ShangMorphTargetEvidence[];
  unmorph: {
    physicalStart: number;
    physicalStartHex: string;
    capturesCurrentTargetIdentity: boolean;
    restoresCharacterId: 8;
    restoreIdentityPhysical: number;
    restoreIdentityPhysicalHex: string;
    directPlayerNormpalCallPhysical: number;
    directPlayerNormpalCallPhysicalHex: string;
    slot8Aliases: string[];
    slot8SameRecordNormalAlternate: boolean;
    classification: 'VERIFIED_EMP_UNMORPH_RESTORES_ID8_PALETTE';
  };
  decision: {
    transformedAppearanceUsesGenericTargetPaletteSelection: boolean;
    dedicatedTransitionPalettesEstablished: boolean;
    unmorphRestoresSharedShangPalette: boolean;
    qualifiedPathRequiresHardcodedPerMorphFinalPaletteCopies: false;
    runtimePatchRequired: false;
    verdict: 'SHANG_MORPH_ASSET_PALETTE_MODEL_ESTABLISHED' | 'PARTIAL_SHANG_MORPH_MODEL';
    narrative: string;
  };
  status: 'SUCCESS' | 'PARTIAL';
}

const TARGET_GROUPS = [
  { targetId: 0, targetName: 'CAGE', descriptors: ['VDMORPH1', 'VDMORPH2', 'VDMORPH3'], palette: 'VDMORPH_P' },
  { targetId: 1, targetName: 'KANO', descriptors: ['KAMORPH1', 'KAMORPH2', 'KAMORPH3'], palette: 'KMORPH_P' },
  { targetId: 2, targetName: 'RAYDEN', descriptors: ['RDMORPH1', 'RDMORPH2', 'RDMORPH3'], palette: 'RDMORPH_P' },
  { targetId: 3, targetName: 'LIU KANG', descriptors: ['HOMORPH1', 'HOMORPH2', 'HOMORPH3'], palette: 'HOMORPH_P' },
  { targetId: 4, targetName: 'SCORPION', descriptors: ['SCMORPH1', 'SCMORPH2', 'SCMORPH3'], palette: 'SCORPMO_P' },
  { targetId: 5, targetName: 'SUB-ZERO', descriptors: ['SZMORPH1', 'SZMORPH2', 'SZMORPH3'], palette: 'SUBMO_P' },
  { targetId: 6, targetName: 'SONYA', descriptors: ['LZMORPH1', 'LZMORPH2', 'LZMORPH3'], palette: 'LZMORPH_P' },
  { targetId: 7, targetName: 'GORO', descriptors: ['GOMORPH1', 'GOMORPH2', 'GOMORPH3'], palette: 'GOMORPH_P' },
] as const;

function findMovA9Add7CallGetAniStoreIdentity(
  bytes: Uint8Array,
  start: number,
  end: number,
  a9Offset: number,
  getCharAniPhysical: number,
  identityField: number,
) {
  for (let p = start; p + 29 <= end; p++) {
    if (bytes[p] !== 0x50 || bytes[p + 1] !== 0xa3 || readU32(bytes, p + 2) !== a9Offset) continue;
    if (bytes[p + 6] !== 0x83 || bytes[p + 7] !== 0x05 || readU32(bytes, p + 8) !== a9Offset || bytes[p + 12] !== 0x07) continue;
    if (bytes[p + 13] !== 0xe8 || rel32Target(bytes, p + 13) !== getCharAniPhysical) continue;
    if (bytes[p + 18] !== 0x58 || bytes[p + 19] !== 0x89 || bytes[p + 20] !== 0x47 || bytes[p + 21] !== identityField) continue;
    return { sequenceLookupCall: p + 13, identityStore: p + 19 };
  }
  return null;
}

function findJumpTarget(bytes: Uint8Array, start: number, end: number, target: number): number | null {
  for (let p = start; p + 5 <= end; p++) if (bytes[p] === 0xe9 && rel32Target(bytes, p) === target) return p;
  return null;
}

function findCallTarget(bytes: Uint8Array, start: number, end: number, target: number): number | null {
  for (let p = start; p + 5 <= end; p++) if (bytes[p] === 0xe8 && rel32Target(bytes, p) === target) return p;
  return null;
}

function findDirectId7MorphSites(bytes: Uint8Array, codeStart: number, codeEnd: number, empMorphPhysical: number) {
  const out: Array<{ physicalOffset: number; physicalOffsetHex: string; bytesHex: string }> = [];
  for (let p = codeStart; p + 32 <= codeEnd; p++) {
    if (bytes[p] !== 0xb8 || readU32(bytes, p + 1) !== 7) continue;
    for (let q = p + 5; q + 5 <= Math.min(codeEnd, p + 32); q++) {
      if (bytes[q] === 0xe9 && rel32Target(bytes, q) === empMorphPhysical) {
        out.push({ physicalOffset: p, physicalOffsetHex: toHex32(p), bytesHex: bytesHex(bytes.slice(p, q + 5)) });
        break;
      }
    }
  }
  return out;
}

export async function executeShangMorphSelectionQualification(
  source: DirectorySource,
  options: {
    ownershipReport: MK1FighterPaletteOwnershipReport;
    opponentAccessReport: MK1OpponentAccessHarnessReport;
  },
): Promise<MK1ShangMorphSelectionReport> {
  if (source.isSynthetic !== false) throw new Error('1E.3N.4 requires an authentic user-loaded MK1 directory');
  const ownership = options.ownershipReport;
  const access = options.opponentAccessReport;
  await createMK1FighterPaletteOwnershipExport(ownership);
  await createMK1OpponentAccessHarnessExport(access);
  if (ownership.status !== 'SUCCESS' || access.status !== 'SUCCESS') throw new Error('1E.3N.4 prerequisites are not fully qualified');
  if (ownership.provenance.sha256 !== access.provenance.sha256) throw new Error('1E.3N.4 prerequisite fixture hashes disagree');

  const entries = await source.listRecursive();
  const file = entries.find(entry => entry.path === ownership.fixture.exePath);
  if (!file || file.size !== ownership.fixture.exeSize) throw new Error('MK1.EXE path/size changed since palette ownership qualification');
  const bytes = await source.readSlice(file.path, 0, file.size);
  const hash = await sha256Bytes(bytes);
  if (hash !== ownership.provenance.sha256) throw new Error('MK1.EXE SHA-256 changed since prerequisite qualification');

  const inventory = await enumerateMK1WatcomPermanentClasses(source);
  if (inventory.status !== 'SUCCESS' || !inventory.result.overallValid) throw new Error('Watcom permanent symbol inventory failed during 1E.3N.4');
  const symbols = inventory.result.globalSymbols.symbols;
  const codeBase = access.coordinateModel.codeImageBase;
  const dataBase = access.coordinateModel.staticDataBase;
  const codeEnd = dataBase;

  const empMorphSans = exactSymbol(symbols, 'EMP_MORPH_SANS_GORO', 1, 'code');
  const empMorph = exactSymbol(symbols, 'EMP_MORPH', 1, 'code');
  const empUnmorph = exactSymbol(symbols, 'EMP_UNMORPH', 1, 'code');
  const empAniTab = exactSymbol(symbols, 'EMP_ANITAB', 2, 'data');
  const playerNormpal = exactSymbol(symbols, 'PLAYER_NORMPAL', 1, 'code');
  const playerSwpal = exactSymbol(symbols, 'PLAYER_SWPAL', 1, 'code');
  const doNextA9 = exactSymbol(symbols, 'DO_NEXT_A9_FRAME', 1, 'code');
  const getCharAni = exactSymbol(symbols, 'GET_CHAR_ANI', 1, 'code');
  const getCharLong = exactSymbol(symbols, 'GET_CHAR_LONG', 1, 'code');
  const randu = exactSymbol(symbols, 'RANDU', 1, 'code');
  const isFighterLoaded = exactSymbol(symbols, 'IsFighterLoaded_', 1, 'code');
  const mframew = exactSymbol(symbols, 'MFRAMEW', 1, 'code');
  const a9 = exactSymbol(symbols, 'A9', 2, 'data');
  const normalPalettes = exactSymbol(symbols, 'NORMAL_PALETTES', 2, 'data');
  const alternatePalettes = exactSymbol(symbols, 'ALTERNATE_PALETTES', 2, 'data');
  const fGninja = exactSymbol(symbols, 'F_GNINJA', 2, 'data');

  const phys = (symbol: WatcomGlobalSymbol) => (symbol.segment === 1 ? codeBase : dataBase) + symbol.addressOffset;
  const empMorphSansPhysical = phys(empMorphSans);
  const empMorphPhysical = phys(empMorph);
  const empUnmorphPhysical = phys(empUnmorph);
  const getCharAniPhysical = phys(getCharAni);
  const playerNormpalPhysical = phys(playerNormpal);
  const playerSwpalPhysical = phys(playerSwpal);
  const doNextA9Physical = phys(doNextA9);
  const mframewPhysical = phys(mframew);
  const identityField = ownership.characterIdentityField.fieldOffset;

  // Random playable target route: RANDU(7), decrement -> IDs 0..6, reject unloaded, then fall into EMP_MORPH.
  const rs = empMorphSansPhysical;
  const randomSansGoroOk = bytes[rs] === 0xb8 && readU32(bytes, rs + 1) === 7
    && bytes[rs + 5] === 0xe8 && rel32Target(bytes, rs + 5) === phys(randu)
    && bytes[rs + 10] === 0x48 && bytes[rs + 11] === 0x50
    && bytes[rs + 12] === 0xe8 && rel32Target(bytes, rs + 12) === phys(isFighterLoaded)
    && bytes[rs + 17] === 0x85 && bytes[rs + 18] === 0xc0
    && bytes[rs + 19] === 0x58 && bytes[rs + 20] === 0x75
    && (rs + 22 + (bytes[rs + 21] << 24 >> 24)) === empMorphPhysical;

  const morphFlow = findMovA9Add7CallGetAniStoreIdentity(bytes, empMorphPhysical, empMorphPhysical + 96, a9.addressOffset, getCharAniPhysical, identityField);
  const mframewJump = findJumpTarget(bytes, empMorphPhysical, empMorphPhysical + 128, mframewPhysical);
  const sequenceLookupBeforeIdentitySwap = !!morphFlow && morphFlow.sequenceLookupCall < morphFlow.identityStore;

  const directGoroMorphSites = findDirectId7MorphSites(bytes, codeBase, codeEnd, empMorphPhysical);

  // Animation command 6 is the generic callback opcode: DO_NEXT_A9_FRAME dispatches low commands 1..6 through a table.
  const dn = doNextA9Physical;
  if (!(bytes[dn] === 0x8b && bytes[dn + 1] === 0x15 && readU32(bytes, dn + 2) === a9.addressOffset)) {
    throw new Error('DO_NEXT_A9_FRAME A9 read shape changed');
  }
  let commandTableOffset: number | null = null;
  for (let p = dn; p < dn + 64; p++) {
    if (bytes[p] === 0xff && bytes[p + 1] === 0x24 && bytes[p + 2] === 0x9d) {
      commandTableOffset = readU32(bytes, p + 3);
      break;
    }
  }
  if (commandTableOffset === null) throw new Error('Unable to locate animation command dispatch table');
  const commandTablePhysical = dataBase + commandTableOffset;
  const command6HandlerWatcom = readU32(bytes, commandTablePhysical + 5 * 4);
  const command6HandlerPhysical = codeBase + command6HandlerWatcom;
  const command6CallsNextDword = bytes[command6HandlerPhysical] === 0x8b && bytes[command6HandlerPhysical + 1] === 0x15
    && readU32(bytes, command6HandlerPhysical + 2) === a9.addressOffset
    && bytes[command6HandlerPhysical + 6] === 0x83 && bytes[command6HandlerPhysical + 7] === 0x05
    && readU32(bytes, command6HandlerPhysical + 8) === a9.addressOffset && bytes[command6HandlerPhysical + 12] === 0x04
    && bytes[command6HandlerPhysical + 13] === 0xff && bytes[command6HandlerPhysical + 14] === 0x12;

  const empAniTabPhysical = dataBase + empAniTab.addressOffset;
  const sequenceOffsets = Array.from({ length: 8 }, (_, targetId) => readU32(bytes, empAniTabPhysical + (targetId + 7) * 4));
  const firstCallbacks = sequenceOffsets.map(seq => readU32(bytes, dataBase + seq + 4));
  const switchCallbackWatcom = firstCallbacks[0];
  if (!firstCallbacks.every(value => value === switchCallbackWatcom)) throw new Error('EMP morph sequences do not share one first callback');

  const secondCallbacks: number[] = [];
  for (const seq of sequenceOffsets) {
    const sp = dataBase + seq;
    let found: number | null = null;
    for (let q = 8; q <= 40; q += 4) {
      if (readU32(bytes, sp + q) === 6) {
        const candidate = readU32(bytes, sp + q + 4);
        if (candidate !== switchCallbackWatcom) { found = candidate; break; }
      }
    }
    if (found === null) throw new Error(`Unable to locate second callback in EMP morph sequence ${toHex32(seq)}`);
    secondCallbacks.push(found);
  }
  const normalCallbackWatcom = secondCallbacks[0];
  if (!secondCallbacks.every(value => value === normalCallbackWatcom)) throw new Error('EMP morph sequences do not share one final palette callback');

  const switchCallbackPhysical = codeBase + switchCallbackWatcom;
  const normalCallbackPhysical = codeBase + normalCallbackWatcom;
  const switchJmpSite = findJumpTarget(bytes, switchCallbackPhysical, switchCallbackPhysical + 32, playerSwpalPhysical);
  const normalCallSite = findCallTarget(bytes, normalCallbackPhysical, normalCallbackPhysical + 32, playerNormpalPhysical);
  const normalPreservesA9 = bytes[normalCallbackPhysical] === 0xff && bytes[normalCallbackPhysical + 1] === 0x35
    && readU32(bytes, normalCallbackPhysical + 2) === a9.addressOffset
    && normalCallSite !== null
    && bytes[normalCallbackPhysical + 11] === 0x8f && bytes[normalCallbackPhysical + 12] === 0x05
    && readU32(bytes, normalCallbackPhysical + 13) === a9.addressOffset;

  // Generic palette selector: normal table by default, same-character path can switch to alternate table, then GET_CHAR_LONG indexes by +0x48.
  const pn = playerNormpalPhysical;
  const normalLoad = (() => {
    for (let p = pn; p < pn + 96; p++) if (bytes[p] === 0xb8 && readU32(bytes, p + 1) === normalPalettes.addressOffset) return p;
    return -1;
  })();
  const alternateLoad = (() => {
    for (let p = pn; p < pn + 112; p++) if (bytes[p] === 0xb8 && readU32(bytes, p + 1) === alternatePalettes.addressOffset) return p;
    return -1;
  })();
  const getCharLongCall = findCallTarget(bytes, pn, pn + 112, phys(getCharLong));
  const getCharLongPhysical = phys(getCharLong);
  const getCharLongIndexesIdentity = bytes[getCharLongPhysical] === 0x8b && bytes[getCharLongPhysical + 1] === 0x5f
    && bytes[getCharLongPhysical + 2] === identityField && bytes[getCharLongPhysical + 3] === 0x8b
    && bytes[getCharLongPhysical + 4] === 0x04 && bytes[getCharLongPhysical + 5] === 0x98;
  const sameCharacterRule = normalLoad >= 0 && alternateLoad > normalLoad
    && bytes[alternateLoad - 11] === 0x8b && bytes[alternateLoad - 10] === 0x1d
    && readU32(bytes, alternateLoad - 9) === ownership.characterIdentityField.p1CharOffset
    && bytes[alternateLoad - 5] === 0x39 && bytes[alternateLoad - 4] === 0x5f && bytes[alternateLoad - 3] === identityField;
  const greenNinjaOverride = (() => {
    for (let p = pn; p < normalLoad; p++) if (bytes[p] === 0x80 && bytes[p + 1] === 0x3d && readU32(bytes, p + 2) === fGninja.addressOffset && bytes[p + 6] === 0x01) return true;
    return false;
  })();

  const allGroupSymbols = new Map<string, WatcomGlobalSymbol>();
  for (const group of TARGET_GROUPS) {
    for (const name of [...group.descriptors, group.palette]) allGroupSymbols.set(name, exactSymbol(symbols, name, 2, 'data'));
  }

  const targets: ShangMorphTargetEvidence[] = [];
  for (const group of TARGET_GROUPS) {
    const seqOffset = sequenceOffsets[group.targetId];
    const seqPhysical = dataBase + seqOffset;
    const descriptorSymbols = group.descriptors.map(name => allGroupSymbols.get(name)!);
    const descriptorOffsets = descriptorSymbols.map(symbol => symbol.addressOffset);
    const observed = new Set<number>();
    for (let q = 0; q < 80; q += 4) {
      const value = readU32(bytes, seqPhysical + q);
      if (descriptorOffsets.includes(value)) observed.add(value);
    }
    if (observed.size !== 3) throw new Error(`EMP_ANITAB[${group.targetId + 7}] does not reference all three ${group.targetName} morph descriptors`);
    const paletteSymbol = allGroupSymbols.get(group.palette)!;
    const morph1 = descriptorSymbols[0];
    const linkedPaletteOffset = readU32(bytes, dataBase + morph1.addressOffset + 12);
    const slot = ownership.slots[group.targetId];
    if (!slot || slot.slotIndex !== group.targetId) throw new Error(`Missing fighter palette slot ${group.targetId}`);
    targets.push({
      targetCharacterId: group.targetId,
      targetName: group.targetName,
      empAnimationIndex: group.targetId + 7,
      empAnimationSequenceWatcomOffset: seqOffset,
      empAnimationSequenceWatcomOffsetHex: toHex32(seqOffset),
      empAnimationSequencePhysical: seqPhysical,
      empAnimationSequencePhysicalHex: toHex32(seqPhysical),
      switchPaletteCallbackWatcomOffset: switchCallbackWatcom,
      switchPaletteCallbackWatcomOffsetHex: toHex32(switchCallbackWatcom),
      normalPaletteCallbackWatcomOffset: normalCallbackWatcom,
      normalPaletteCallbackWatcomOffsetHex: toHex32(normalCallbackWatcom),
      morphDescriptors: descriptorSymbols.map(symbol => ({
        symbol: symbol.name,
        watcomOffset: symbol.addressOffset,
        watcomOffsetHex: toHex32(symbol.addressOffset),
        physicalStart: dataBase + symbol.addressOffset,
        physicalStartHex: toHex32(dataBase + symbol.addressOffset),
      })),
      transitionPalette: {
        symbol: paletteSymbol.name,
        watcomOffset: paletteSymbol.addressOffset,
        watcomOffsetHex: toHex32(paletteSymbol.addressOffset),
        physicalStart: dataBase + paletteSymbol.addressOffset,
        physicalStartHex: toHex32(dataBase + paletteSymbol.addressOffset),
        declaredLength: readU16(bytes, dataBase + paletteSymbol.addressOffset),
        linkedFromMorph1Plus0C: linkedPaletteOffset === paletteSymbol.addressOffset,
      },
      fighterPaletteSlot: {
        normalSymbols: slot.normal.symbolNames,
        alternateSymbols: slot.alternate.symbolNames,
        sameRecordForNormalAndAlternate: slot.sameRecordForNormalAndAlternate,
      },
      classification: 'VERIFIED_EMP_MORPH_TARGET_ASSET_ROUTE',
    });
  }

  // Unmorph restores identity 8 before its sequence work, then directly calls PLAYER_NORMPAL later in the routine.
  const eu = empUnmorphPhysical;
  let restoreIdentityPhysical = -1;
  for (let p = eu; p < eu + 64; p++) {
    if (bytes[p] === 0xc7 && bytes[p + 1] === 0x47 && bytes[p + 2] === identityField && readU32(bytes, p + 3) === 8) {
      restoreIdentityPhysical = p;
      break;
    }
  }
  const capturesTargetIdentity = bytes[eu + 16] === 0x8b && bytes[eu + 17] === 0x47 && bytes[eu + 18] === identityField;
  const unmorphNormCall = findCallTarget(bytes, eu, eu + 160, playerNormpalPhysical);
  const slot8 = ownership.slots[8];
  if (!slot8) throw new Error('Slot 8 missing from ownership report');
  const slot8Aliases = Array.from(new Set([...slot8.normal.symbolNames, ...slot8.alternate.symbolNames]));

  const allTargetsQualified = targets.length === 8 && targets.every(target => target.transitionPalette.declaredLength === 23 && target.transitionPalette.linkedFromMorph1Plus0C);
  const success = randomSansGoroOk && !!morphFlow && sequenceLookupBeforeIdentitySwap && mframewJump !== null
    && directGoroMorphSites.length > 0 && command6CallsNextDword && switchJmpSite !== null && normalCallSite !== null && normalPreservesA9
    && normalLoad >= 0 && alternateLoad >= 0 && getCharLongCall !== null && getCharLongIndexesIdentity && sameCharacterRule && greenNinjaOverride
    && allTargetsQualified && capturesTargetIdentity && restoreIdentityPhysical >= 0 && unmorphNormCall !== null
    && slot8.sameRecordForNormalAndAlternate && slot8Aliases.includes('YANG_P') && slot8Aliases.includes('EMP_P');

  const operationId = createOperationId('shang_morph_selection');
  const timestamp = new Date().toISOString();
  const provenance = { ...ownership.provenance, timestamp, operationId };

  return {
    format: 'mk1_shang_morph_selection_v1',
    timestamp,
    operationId,
    provenance,
    fixture: ownership.fixture,
    prerequisite: {
      ownershipPass: '1E.3L', ownershipOperationId: ownership.operationId,
      accessPass: '1E.3N.1', accessOperationId: access.operationId,
      validationPassed: true,
    },
    coordinateModel: access.coordinateModel,
    symbols: {
      empMorphSansGoro: symbolSummary(empMorphSans, empMorphSansPhysical),
      empMorph: symbolSummary(empMorph, empMorphPhysical),
      empUnmorph: symbolSummary(empUnmorph, empUnmorphPhysical),
      empAniTab: symbolSummary(empAniTab, empAniTabPhysical),
      playerNormpal: symbolSummary(playerNormpal, playerNormpalPhysical),
      playerSwpal: symbolSummary(playerSwpal, playerSwpalPhysical),
      doNextA9Frame: symbolSummary(doNextA9, doNextA9Physical),
      getCharAni: symbolSummary(getCharAni, getCharAniPhysical),
      getCharLong: symbolSummary(getCharLong, getCharLongPhysical),
      randu: symbolSummary(randu, phys(randu)),
      isFighterLoaded: symbolSummary(isFighterLoaded, phys(isFighterLoaded)),
      a9: symbolSummary(a9, dataBase + a9.addressOffset),
    },
    targetSelection: {
      randomSansGoro: {
        physicalStart: empMorphSansPhysical,
        physicalStartHex: toHex32(empMorphSansPhysical),
        bytesHex: bytesHex(bytes.slice(empMorphSansPhysical, empMorphPhysical)),
        randomUpperBound: 7,
        postRandomDecrement: true,
        candidateCharacterIds: [0,1,2,3,4,5,6],
        loadedFighterCheckTarget: phys(isFighterLoaded),
        loadedFighterCheckTargetHex: toHex32(phys(isFighterLoaded)),
        fallsIntoEmpMorph: randomSansGoroOk,
        classification: 'VERIFIED_RANDOM_LOADED_PLAYABLE_TARGET_0_TO_6',
      },
      directGoroMorph: {
        targetCharacterId: 7,
        callSites: directGoroMorphSites,
        supportedByEmpMorph: directGoroMorphSites.length > 0,
        classification: 'VERIFIED_DIRECT_ID7_EMP_MORPH_PATH',
      },
      empMorph: {
        sequenceLookupBeforeIdentitySwap,
        a9IndexBias: 7,
        objectIdentityFieldOffset: identityField,
        objectIdentityFieldOffsetHex: toHex32(identityField),
        identityStorePhysical: morphFlow?.identityStore ?? -1,
        identityStorePhysicalHex: morphFlow ? toHex32(morphFlow.identityStore) : 'UNRESOLVED',
        getCharAniCallPhysical: morphFlow?.sequenceLookupCall ?? -1,
        getCharAniCallPhysicalHex: morphFlow ? toHex32(morphFlow.sequenceLookupCall) : 'UNRESOLVED',
        animationExecutorTarget: mframewPhysical,
        animationExecutorTargetHex: toHex32(mframewPhysical),
        classification: 'VERIFIED_EMP_TARGET_INDEXED_MORPH_SEQUENCE',
      },
    },
    animationCommand6: {
      dispatcherPhysical: doNextA9Physical,
      dispatcherPhysicalHex: toHex32(doNextA9Physical),
      commandTableWatcomOffset: commandTableOffset,
      commandTableWatcomOffsetHex: toHex32(commandTableOffset),
      command6HandlerPhysical,
      command6HandlerPhysicalHex: toHex32(command6HandlerPhysical),
      handlerCallsNextDword: command6CallsNextDword,
      classification: 'VERIFIED_ANIMATION_CALLBACK_OPCODE_6',
    },
    paletteCallbacks: {
      switchMorphPalette: {
        watcomOffset: switchCallbackWatcom,
        watcomOffsetHex: toHex32(switchCallbackWatcom),
        physicalStart: switchCallbackPhysical,
        physicalStartHex: toHex32(switchCallbackPhysical),
        bytesHex: bytesHex(bytes.slice(switchCallbackPhysical, switchCallbackPhysical + 18)),
        jumpsToPlayerSwpal: switchJmpSite !== null,
        classification: 'VERIFIED_MORPH_TRANSITION_PALETTE_CALLBACK',
      },
      restoreGenericFighterPalette: {
        watcomOffset: normalCallbackWatcom,
        watcomOffsetHex: toHex32(normalCallbackWatcom),
        physicalStart: normalCallbackPhysical,
        physicalStartHex: toHex32(normalCallbackPhysical),
        bytesHex: bytesHex(bytes.slice(normalCallbackPhysical, normalCallbackPhysical + 18)),
        callsPlayerNormpal: normalCallSite !== null,
        preservesA9: normalPreservesA9,
        classification: 'VERIFIED_MORPH_TARGET_GENERIC_PALETTE_CALLBACK',
      },
    },
    genericPaletteSelection: {
      normalTableWatcomOffset: normalPalettes.addressOffset,
      normalTableWatcomOffsetHex: toHex32(normalPalettes.addressOffset),
      alternateTableWatcomOffset: alternatePalettes.addressOffset,
      alternateTableWatcomOffsetHex: toHex32(alternatePalettes.addressOffset),
      indexesByObjectIdentityField: getCharLongIndexesIdentity,
      sameCharacterAlternateRuleRetained: sameCharacterRule,
      greenNinjaOverrideRetained: greenNinjaOverride,
      classification: 'VERIFIED_GENERIC_PLAYER_NORMPAL_SELECTION',
    },
    targets,
    unmorph: {
      physicalStart: empUnmorphPhysical,
      physicalStartHex: toHex32(empUnmorphPhysical),
      capturesCurrentTargetIdentity: capturesTargetIdentity,
      restoresCharacterId: 8,
      restoreIdentityPhysical,
      restoreIdentityPhysicalHex: restoreIdentityPhysical >= 0 ? toHex32(restoreIdentityPhysical) : 'UNRESOLVED',
      directPlayerNormpalCallPhysical: unmorphNormCall ?? -1,
      directPlayerNormpalCallPhysicalHex: unmorphNormCall === null ? 'UNRESOLVED' : toHex32(unmorphNormCall),
      slot8Aliases,
      slot8SameRecordNormalAlternate: slot8.sameRecordForNormalAndAlternate,
      classification: 'VERIFIED_EMP_UNMORPH_RESTORES_ID8_PALETTE',
    },
    decision: {
      transformedAppearanceUsesGenericTargetPaletteSelection: normalCallSite !== null && getCharLongIndexesIdentity && sequenceLookupBeforeIdentitySwap,
      dedicatedTransitionPalettesEstablished: allTargetsQualified && switchJmpSite !== null,
      unmorphRestoresSharedShangPalette: restoreIdentityPhysical >= 0 && unmorphNormCall !== null && slot8.sameRecordForNormalAndAlternate && slot8Aliases.includes('YANG_P') && slot8Aliases.includes('EMP_P'),
      qualifiedPathRequiresHardcodedPerMorphFinalPaletteCopies: false,
      runtimePatchRequired: false,
      verdict: success ? 'SHANG_MORPH_ASSET_PALETTE_MODEL_ESTABLISHED' : 'PARTIAL_SHANG_MORPH_MODEL',
      narrative: success
        ? 'Shang Tsung morphing is a state-and-asset selection mechanism, not a separate copy of every fighter palette. EMP_MORPH_SANS_GORO chooses a loaded playable ID 0..6; EMP_MORPH also accepts ID 7 through direct special paths. EMP_MORPH resolves EMP_ANITAB[target+7] while the object is still ID 8, then stores the target into object +0x48 before executing that morph sequence. Each of the eight target-indexed EMP sequences invokes animation callback opcode 6 to apply a target-specific morph transition palette, plays three target-specific morph descriptors, then invokes a second callback that calls PLAYER_NORMPAL. PLAYER_NORMPAL indexes NORMAL_PALETTES or the verified same-character ALTERNATE_PALETTES path by the current object +0x48 identity, so the completed morph reuses the target fighter palette machinery. EMP_UNMORPH restores object identity 8 and directly calls PLAYER_NORMPAL; slot 8 resolves to the shared YANG_P / EMP_P record on both table sides.'
        : 'One or more target-selection, animation callback, transition-palette, generic palette-selection, or unmorph-restoration checks failed. Do not promote the Shang morph model.',
    },
    status: success ? 'SUCCESS' : 'PARTIAL',
  };
}

export async function createMK1ShangMorphSelectionExport(report: MK1ShangMorphSelectionReport) {
  const checks = [
    { checkId: 'PROVENANCE_REAL_USER_LOADED', passed: report.provenance.sourceKind === 'user-loaded-directory' && report.provenance.synthetic === false && report.provenance.artifactGeneratedByTest === false && /^[0-9a-f]{64}$/.test(report.provenance.sha256) },
    { checkId: 'PREREQUISITES_BOUND', passed: report.prerequisite.ownershipPass === '1E.3L' && report.prerequisite.accessPass === '1E.3N.1' && report.prerequisite.validationPassed },
    { checkId: 'RANDOM_TARGETS_0_TO_6', passed: JSON.stringify(report.targetSelection.randomSansGoro.candidateCharacterIds) === JSON.stringify([0,1,2,3,4,5,6]) && report.targetSelection.randomSansGoro.fallsIntoEmpMorph },
    { checkId: 'DIRECT_ID7_PATH', passed: report.targetSelection.directGoroMorph.supportedByEmpMorph && report.targetSelection.directGoroMorph.callSites.length > 0 },
    { checkId: 'EMP_ANITAB_LOOKUP_BEFORE_IDENTITY_SWAP', passed: report.targetSelection.empMorph.sequenceLookupBeforeIdentitySwap && report.targetSelection.empMorph.a9IndexBias === 7 && report.targetSelection.empMorph.objectIdentityFieldOffset === 0x48 },
    { checkId: 'ANIMATION_COMMAND6_CALLBACK', passed: report.animationCommand6.handlerCallsNextDword },
    { checkId: 'MORPH_PALETTE_CALLBACK', passed: report.paletteCallbacks.switchMorphPalette.jumpsToPlayerSwpal },
    { checkId: 'GENERIC_PALETTE_CALLBACK', passed: report.paletteCallbacks.restoreGenericFighterPalette.callsPlayerNormpal && report.paletteCallbacks.restoreGenericFighterPalette.preservesA9 },
    { checkId: 'EIGHT_TARGET_ASSET_ROUTES', passed: report.targets.length === 8 && report.targets.every((target, id) => target.targetCharacterId === id && target.empAnimationIndex === id + 7 && target.transitionPalette.declaredLength === 23 && target.transitionPalette.linkedFromMorph1Plus0C) },
    { checkId: 'GENERIC_PALETTE_SELECTION_REUSED', passed: report.genericPaletteSelection.indexesByObjectIdentityField && report.genericPaletteSelection.sameCharacterAlternateRuleRetained },
    { checkId: 'UNMORPH_ID8_SHARED_ALIAS_RESTORE', passed: report.unmorph.restoresCharacterId === 8 && report.unmorph.slot8SameRecordNormalAlternate && report.unmorph.slot8Aliases.includes('YANG_P') && report.unmorph.slot8Aliases.includes('EMP_P') },
    { checkId: 'READ_ONLY_PASS', passed: report.decision.runtimePatchRequired === false && report.decision.qualifiedPathRequiresHardcodedPerMorphFinalPaletteCopies === false },
  ];
  if (report.status !== 'SUCCESS' || !checks.every(check => check.passed)) {
    throw new Error(`1E.3N.4 export blocked: ${checks.filter(check => !check.passed).map(check => check.checkId).join(', ') || 'report status partial'}`);
  }
  return {
    metadata: { name: 'MK1 Shang Tsung Morph Asset / Palette Selection', milestone: 'Pass 1E.3N.4', formatVersion: report.format, exportTimestamp: report.timestamp },
    ...report,
    validation: { allChecksPassed: true, checks },
  };
}
