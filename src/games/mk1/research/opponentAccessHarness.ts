/**
 * MK1 opponent access harness — Pass 1E.3N.1.
 *
 * Bounded purpose:
 *   Recover the single-player first-opponent selection data path and provide a
 *   reversible test harness that changes only the first token of each original
 *   ladder map. This is an access convenience layer, not a combat/AI patch.
 *
 * Evidence discipline:
 *   - ladder-map discovery is derived from code/data relationships on the
 *     authentic fixture;
 *   - stable token -> character-ID mappings are read through the exact
 *     OFFSET_TO_OCHAR table used by the executable;
 *   - ID 7/8 labels are tied to C_GORO_WINS/C_EMP_WINS code-side counters;
 *   - the separately discovered F_GNINJA/GNINJA_P path is recorded but NOT
 *     exposed as an editable access target until its surrounding state is
 *     qualified independently.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { WatcomGlobalSymbol } from '../../../core/executable/watcomDebug/watcomPermanentClassTypes';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { enumerateMK1WatcomPermanentClasses } from './watcomPermanentClassInventory';
import {
  createMK1KanoPaletteSelectionSemanticsExport,
} from './kanoPaletteSelectionSemantics';
import { MK1KanoPaletteSelectionSemanticsReport } from './kanoPaletteSelectionSemanticsTypes';
import {
  createMK1PaletteRoundTripExport,
  PaletteRoundTripReport,
} from './paletteRoundTrip';
import { sha256Bytes } from './paletteRoundTripCodec';
import {
  createMK1PaletteEntryEditExport,
  executePaletteEntryEdit,
} from './paletteEntryEdit';

function toHex32(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

function readU32(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 4 > bytes.length) throw new Error(`readU32 out of range at ${toHex32(offset)}`);
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

function bytesHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(value => value.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

function equalNumbers(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function diffBytes(before: Uint8Array, after: Uint8Array): ByteChange[] {
  if (before.length !== after.length) throw new Error('Byte-diff length mismatch');
  const out: ByteChange[] = [];
  for (let i = 0; i < before.length; i++) {
    if (before[i] !== after[i]) out.push({ physicalOffset: i, physicalOffsetHex: toHex32(i), before: before[i], after: after[i] });
  }
  return out;
}

function exactSymbol(symbols: readonly WatcomGlobalSymbol[], name: string, segment: number, kind: 'code' | 'data'): WatcomGlobalSymbol {
  const matches = symbols.filter(symbol => symbol.valid && symbol.name === name && symbol.segment === segment
    && (kind === 'code' ? symbol.kindBits.isCode : symbol.kindBits.isData));
  if (matches.length !== 1) throw new Error(`1E.3N.1 requires exactly one ${kind} symbol ${name}; found ${matches.length}`);
  return matches[0];
}

function nextCodeSymbol(symbols: readonly WatcomGlobalSymbol[], start: WatcomGlobalSymbol): WatcomGlobalSymbol | null {
  return symbols
    .filter(symbol => symbol.valid && symbol.segment === 1 && symbol.kindBits.isCode && symbol.addressOffset > start.addressOffset)
    .sort((a, b) => a.addressOffset - b.addressOffset || a.globalIndex - b.globalIndex)[0] ?? null;
}

function isPermutation0to8(row: readonly number[]): boolean {
  return row.length === 9 && [...row].sort((a, b) => a - b).every((value, index) => value === index);
}

export type FirstOpponentToken = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface ByteChange {
  physicalOffset: number;
  physicalOffsetHex: string;
  before: number;
  after: number;
}

export interface LadderMapEvidence {
  mapIndex: number;
  watcomOffset: number;
  watcomOffsetHex: string;
  physicalStart: number;
  physicalStartHex: string;
  bytes: number[];
  bytesHex: string;
  originalFirstToken: number;
  terminator: number;
}

export interface TokenMappingEvidence {
  token: FirstOpponentToken;
  characterIdsByPlayableCharacter: number[];
  stableCharacterId: number | null;
  classification: 'ORDINARY_PLAYER_RELATIVE_TOKEN' | 'STABLE_SPECIAL_CHARACTER_ID' | 'MIRROR_CURRENT_CHARACTER';
  internalIdentity: 'GORO' | 'EMP' | 'CURRENT_PLAYABLE_CHARACTER' | null;
}

export interface CounterAssociationEvidence {
  characterId: 7 | 8;
  counterSymbol: 'C_GORO_WINS' | 'C_EMP_WINS';
  counterWatcomOffset: number;
  counterWatcomOffsetHex: string;
  comparePhysicalOffset: number;
  comparePhysicalOffsetHex: string;
  incrementPhysicalOffset: number;
  incrementPhysicalOffsetHex: string;
  bytesHex: string;
  classification: 'VERIFIED_CHARACTER_ID_COUNTER_ASSOCIATION';
}

export interface SecretGreenNinjaRouteEvidence {
  flagSymbol: 'F_GNINJA';
  flagWatcomOffset: number;
  flagWatcomOffsetHex: string;
  paletteSymbol: 'GNINJA_P';
  paletteWatcomOffset: number;
  paletteWatcomOffsetHex: string;
  setFlagPhysicalOffset: number;
  setFlagPhysicalOffsetHex: string;
  clearFlagPhysicalOffset: number;
  clearFlagPhysicalOffsetHex: string;
  selectedCharacterWritePhysicalOffset: number;
  selectedCharacterWritePhysicalOffsetHex: string;
  selectedCharacterId: 4;
  playerNormpalPhysicalStart: number;
  playerNormpalPhysicalStartHex: string;
  playerNormpalUsesFlagAndPalette: boolean;
  accessPatchExposed: false;
  classification: 'VERIFIED_COMPOSITE_GREEN_NINJA_STATE_PATH_ACCESS_DEFERRED';
  note: string;
}

export interface MK1OpponentAccessHarnessReport {
  format: 'mk1_opponent_access_harness_v1';
  timestamp: string;
  operationId: string;
  provenance: PaletteRoundTripReport['provenance'];
  fixture: { exePath: string; exeSize: number; exeSizeHex: string };
  prerequisite: {
    semanticsPass: '1E.3F';
    semanticsOperationId: string;
    roundTripPass: '1E.3H';
    roundTripOperationId: string;
    validationPassed: true;
  };
  coordinateModel: {
    codeImageBase: number;
    codeImageBaseHex: string;
    staticDataBase: number;
    staticDataBaseHex: string;
  };
  symbols: {
    whoIsNext: { watcomOffset: number; watcomOffsetHex: string; physicalStart: number; physicalStartHex: string; moduleName: string | null };
    offsetToOchar: { watcomOffset: number; watcomOffsetHex: string; physicalStart: number; physicalStartHex: string; moduleName: string | null };
    mapStart: { watcomOffset: number; watcomOffsetHex: string };
    mapPosition: { watcomOffset: number; watcomOffsetHex: string };
    battleNum: { watcomOffset: number; watcomOffsetHex: string };
  };
  ladderSelector: {
    instructionPhysicalStart: number;
    instructionPhysicalStartHex: string;
    bytesHex: string;
    mapPointerTableWatcomOffset: number;
    mapPointerTableWatcomOffsetHex: string;
    mapPointerTablePhysicalStart: number;
    mapPointerTablePhysicalStartHex: string;
    mapPointers: number[];
    mapPointersHex: string[];
    maps: LadderMapEvidence[];
    uniqueSelectorMatch: boolean;
    classification: 'VERIFIED_FOUR_MAP_SINGLE_PLAYER_LADDER_SELECTOR';
  };
  whoIsNext: {
    readsMapStartAndNextPosition: boolean;
    evidencePhysicalOffset: number;
    evidencePhysicalOffsetHex: string;
    bytesHex: string;
    classification: 'VERIFIED_NEXT_LADDER_TOKEN_READ';
  };
  offsetToOchar: {
    mappingPointerTableWatcomOffset: number;
    mappingPointerTableWatcomOffsetHex: string;
    mappingPointerTablePhysicalStart: number;
    mappingPointerTablePhysicalStartHex: string;
    rowPointers: number[];
    rowPointersHex: string[];
    rows: number[][];
    rowsHex: string[];
    allRowsPermutation0to8: boolean;
    tokenMappings: TokenMappingEvidence[];
    classification: 'VERIFIED_PLAYER_RELATIVE_TOKEN_TO_CHARACTER_ID_TABLE';
  };
  specialCharacterAssociations: CounterAssociationEvidence[];
  secretGreenNinjaRoute: SecretGreenNinjaRouteEvidence | null;
  decision: {
    firstEncounterPatchOffsets: number[];
    firstEncounterPatchOffsetsHex: string[];
    bossTokensStableAcrossPlayableCharacters: boolean;
    mirrorTokenStable: boolean;
    combatLogicPatched: false;
    stageLogicPatched: false;
    exposedTokens: FirstOpponentToken[];
    secretGreenNinjaAccessDeferred: boolean;
    verdict: 'OPPONENT_ACCESS_HARNESS_ESTABLISHED' | 'PARTIAL_OPPONENT_ACCESS_HARNESS';
    narrative: string;
  };
  status: 'SUCCESS' | 'PARTIAL';
}

function findCounterAssociation(
  bytes: Uint8Array,
  codeStart: number,
  codeEnd: number,
  characterId: 7 | 8,
  counterOffset: number,
  counterSymbol: 'C_GORO_WINS' | 'C_EMP_WINS',
): CounterAssociationEvidence | null {
  for (let i = codeStart; i + 12 <= codeEnd; i++) {
    if (bytes[i] !== 0x83 || bytes[i + 1] !== 0xf8 || bytes[i + 2] !== characterId) continue;
    const limit = Math.min(codeEnd - 6, i + 24);
    for (let j = i + 3; j <= limit; j++) {
      if (bytes[j] === 0xff && bytes[j + 1] === 0x05 && readU32(bytes, j + 2) === counterOffset) {
        return {
          characterId,
          counterSymbol,
          counterWatcomOffset: counterOffset,
          counterWatcomOffsetHex: toHex32(counterOffset),
          comparePhysicalOffset: i,
          comparePhysicalOffsetHex: toHex32(i),
          incrementPhysicalOffset: j,
          incrementPhysicalOffsetHex: toHex32(j),
          bytesHex: bytesHex(bytes.slice(i, j + 6)),
          classification: 'VERIFIED_CHARACTER_ID_COUNTER_ASSOCIATION',
        };
      }
    }
  }
  return null;
}

function findExactWriteByte(bytes: Uint8Array, start: number, end: number, dataOffset: number, value: number): number[] {
  const out: number[] = [];
  for (let i = start; i + 7 <= end; i++) {
    if (bytes[i] === 0xc6 && bytes[i + 1] === 0x05 && readU32(bytes, i + 2) === dataOffset && bytes[i + 6] === value) out.push(i);
  }
  return out;
}

function findSecretGreenNinjaEvidence(
  bytes: Uint8Array,
  symbols: readonly WatcomGlobalSymbol[],
  codeBase: number,
  codeEnd: number,
): SecretGreenNinjaRouteEvidence | null {
  const flag = exactSymbol(symbols, 'F_GNINJA', 2, 'data');
  const palette = exactSymbol(symbols, 'GNINJA_P', 2, 'data');
  const playerNormpal = exactSymbol(symbols, 'PLAYER_NORMPAL', 1, 'code');
  const next = nextCodeSymbol(symbols, playerNormpal);
  const playerNormpalStart = codeBase + playerNormpal.addressOffset;
  const playerNormpalEnd = Math.min(codeEnd, codeBase + (next?.addressOffset ?? playerNormpal.addressOffset + 0x100));
  const sets = findExactWriteByte(bytes, codeBase, codeEnd, flag.addressOffset, 1);
  const clears = findExactWriteByte(bytes, codeBase, codeEnd, flag.addressOffset, 0);
  if (sets.length !== 1 || clears.length < 1) return null;
  const set = sets[0];
  const clear = clears[0];
  let selectedCharacterWrite = -1;
  for (let i = set; i + 6 <= Math.min(codeEnd, set + 64); i++) {
    if (bytes[i] === 0xc7 && bytes[i + 1] === 0x00 && readU32(bytes, i + 2) === 4) { selectedCharacterWrite = i; break; }
  }
  let usesFlag = false;
  let usesPalette = false;
  for (let i = playerNormpalStart; i + 7 <= playerNormpalEnd; i++) {
    if ((bytes[i] === 0x80 || bytes[i] === 0xf6) && readU32(bytes, i + 2) === flag.addressOffset) usesFlag = true;
    if (bytes[i] === 0xb8 && readU32(bytes, i + 1) === palette.addressOffset) usesPalette = true;
  }
  if (selectedCharacterWrite < 0 || !usesFlag || !usesPalette) return null;
  return {
    flagSymbol: 'F_GNINJA',
    flagWatcomOffset: flag.addressOffset,
    flagWatcomOffsetHex: toHex32(flag.addressOffset),
    paletteSymbol: 'GNINJA_P',
    paletteWatcomOffset: palette.addressOffset,
    paletteWatcomOffsetHex: toHex32(palette.addressOffset),
    setFlagPhysicalOffset: set,
    setFlagPhysicalOffsetHex: toHex32(set),
    clearFlagPhysicalOffset: clear,
    clearFlagPhysicalOffsetHex: toHex32(clear),
    selectedCharacterWritePhysicalOffset: selectedCharacterWrite,
    selectedCharacterWritePhysicalOffsetHex: toHex32(selectedCharacterWrite),
    selectedCharacterId: 4,
    playerNormpalPhysicalStart: playerNormpalStart,
    playerNormpalPhysicalStartHex: toHex32(playerNormpalStart),
    playerNormpalUsesFlagAndPalette: true,
    accessPatchExposed: false,
    classification: 'VERIFIED_COMPOSITE_GREEN_NINJA_STATE_PATH_ACCESS_DEFERRED',
    note: 'The executable has a distinct secret green-ninja state path: F_GNINJA is set, character ID 4 is installed through a selected player-character pointer, and PLAYER_NORMPAL conditionally selects GNINJA_P. The surrounding encounter/stage state has not yet been reduced to a minimal safe access patch, so this route is evidence-only in 1E.3N.1.',
  };
}

export async function executeOpponentAccessHarnessQualification(
  source: DirectorySource,
  options: {
    selectionSemanticsReport: MK1KanoPaletteSelectionSemanticsReport;
    roundTripReport: PaletteRoundTripReport;
  },
): Promise<MK1OpponentAccessHarnessReport> {
  if (source.isSynthetic !== false) throw new Error('1E.3N.1 requires an authentic user-loaded directory');
  const semantics = options.selectionSemanticsReport;
  const roundTrip = options.roundTripReport;
  const semanticsExport = createMK1KanoPaletteSelectionSemanticsExport(semantics);
  const roundTripExport = await createMK1PaletteRoundTripExport(roundTrip);
  if (!semanticsExport.validation.allChecksPassed || !roundTripExport.validation.allChecksPassed
      || semantics.status !== 'SUCCESS' || roundTrip.status !== 'SUCCESS') {
    throw new Error('1E.3N.1 prerequisite validation failed');
  }
  if (semantics.provenance.sha256 !== roundTrip.provenance.sha256
      || semantics.fixture.exePath !== roundTrip.provenance.fileName
      || semantics.fixture.exeSize !== roundTrip.provenance.byteLength) {
    throw new Error('1E.3N.1 prerequisites do not identify the same executable');
  }
  const codeBase = semantics.codeImageBaseQualification.qualifiedBase;
  const staticDataBase = roundTrip.module.staticDataBase;
  if (codeBase === null || semantics.decision.codeImageBaseEstablished !== true || staticDataBase <= codeBase) {
    throw new Error('1E.3N.1 requires the verified code/static-data file-image coordinate model');
  }
  const entries = await source.listRecursive();
  const file = entries.find(entry => entry.path === roundTrip.provenance.fileName);
  if (!file || file.size !== roundTrip.provenance.byteLength) throw new Error('MK1.EXE path/size changed since 1E.3H');
  const bytes = await source.readSlice(file.path, 0, file.size);
  if (bytes.length !== file.size) throw new Error('Incomplete MK1.EXE read');
  const hash = await sha256Bytes(bytes);
  if (hash !== roundTrip.provenance.sha256) throw new Error('MK1.EXE SHA-256 changed since 1E.3H');

  const permanent = await enumerateMK1WatcomPermanentClasses(source, { exePath: file.path });
  if (permanent.status !== 'SUCCESS' || !permanent.result.overallValid || permanent.provenance.sha256 !== hash) {
    throw new Error('1E.3N.1 requires valid permanent Watcom symbols from the same executable');
  }
  const symbols = permanent.result.globalSymbols.symbols as WatcomGlobalSymbol[];
  const whoIsNext = exactSymbol(symbols, 'WHO_IS_NEXT', 1, 'code');
  const offsetToOchar = exactSymbol(symbols, 'OFFSET_TO_OCHAR', 1, 'code');
  const mapStart = exactSymbol(symbols, 'MAP_START', 2, 'data');
  const mapPosition = exactSymbol(symbols, 'MAP_POSITION', 2, 'data');
  const battleNum = exactSymbol(symbols, 'BATTLE_NUM', 2, 'data');
  const cGoroWins = exactSymbol(symbols, 'C_GORO_WINS', 2, 'data');
  const cEmpWins = exactSymbol(symbols, 'C_EMP_WINS', 2, 'data');
  const codeEnd = staticDataBase;

  // Locate the exact random-four-way ladder selector that stores its selected pointer into MAP_START.
  const selectorMatches: Array<{ start: number; tableOffset: number }> = [];
  for (let i = codeBase; i + 24 <= codeEnd; i++) {
    if (bytes[i] !== 0xb8 || readU32(bytes, i + 1) !== 4 || bytes[i + 5] !== 0xe8 || bytes[i + 10] !== 0x48
        || bytes[i + 11] !== 0x8b || bytes[i + 12] !== 0x14 || bytes[i + 13] !== 0x85
        || bytes[i + 18] !== 0x89 || bytes[i + 19] !== 0x15 || readU32(bytes, i + 20) !== mapStart.addressOffset) continue;
    const tableOffset = readU32(bytes, i + 14);
    const tablePhysical = staticDataBase + tableOffset;
    if (tablePhysical < staticDataBase || tablePhysical + 16 > bytes.length) continue;
    const pointers = [0, 1, 2, 3].map(index => readU32(bytes, tablePhysical + index * 4));
    const mapsValid = pointers.every(pointer => {
      const physical = staticDataBase + pointer;
      if (physical < staticDataBase || physical + 16 > bytes.length) return false;
      const map = Array.from(bytes.slice(physical, physical + 16));
      return map[15] === 0xff && map[13] === 6 && map[14] === 7;
    });
    if (mapsValid) selectorMatches.push({ start: i, tableOffset });
  }
  if (selectorMatches.length !== 1) throw new Error(`Expected one four-map MAP_START selector; found ${selectorMatches.length}`);
  const selector = selectorMatches[0];
  const mapPointerTablePhysical = staticDataBase + selector.tableOffset;
  const mapPointers = [0, 1, 2, 3].map(index => readU32(bytes, mapPointerTablePhysical + index * 4));
  const maps: LadderMapEvidence[] = mapPointers.map((pointer, mapIndex) => {
    const physical = staticDataBase + pointer;
    const mapBytes = Array.from(bytes.slice(physical, physical + 16));
    return {
      mapIndex,
      watcomOffset: pointer,
      watcomOffsetHex: toHex32(pointer),
      physicalStart: physical,
      physicalStartHex: toHex32(physical),
      bytes: mapBytes,
      bytesHex: bytesHex(Uint8Array.from(mapBytes)),
      originalFirstToken: mapBytes[0],
      terminator: mapBytes[15],
    };
  });

  // WHO_IS_NEXT must read MAP_START[MAP_POSITION + 1] on its single-player branch.
  const whoStart = codeBase + whoIsNext.addressOffset;
  const whoNext = nextCodeSymbol(symbols, whoIsNext);
  const whoEnd = Math.min(codeEnd, codeBase + (whoNext?.addressOffset ?? whoIsNext.addressOffset + 0x80));
  let whoEvidence = -1;
  for (let i = whoStart; i + 17 <= whoEnd; i++) {
    if (bytes[i] === 0x8b && bytes[i + 1] === 0x0d && readU32(bytes, i + 2) === mapPosition.addressOffset
        && bytes[i + 6] === 0x41 && bytes[i + 7] === 0xa1 && readU32(bytes, i + 8) === mapStart.addressOffset
        && bytes[i + 12] === 0x0f && bytes[i + 13] === 0xbe && bytes[i + 14] === 0x04 && bytes[i + 15] === 0x08) {
      whoEvidence = i; break;
    }
  }
  if (whoEvidence < 0) throw new Error('WHO_IS_NEXT did not reproduce the expected MAP_START / MAP_POSITION read');

  // OFFSET_TO_OCHAR must select one of seven 9-byte rows and then index it by the map token in EAX.
  const ocharStart = codeBase + offsetToOchar.addressOffset;
  const ocharNext = nextCodeSymbol(symbols, offsetToOchar);
  const ocharEnd = Math.min(codeEnd, codeBase + (ocharNext?.addressOffset ?? offsetToOchar.addressOffset + 0x80));
  let mappingTableOffset: number | null = null;
  for (let i = ocharStart; i + 12 <= ocharEnd; i++) {
    if (bytes[i] === 0x8b && bytes[i + 1] === 0x14 && bytes[i + 2] === 0x95
        && bytes[i + 7] === 0x0f && bytes[i + 8] === 0xb6 && bytes[i + 9] === 0x04 && bytes[i + 10] === 0x02) {
      mappingTableOffset = readU32(bytes, i + 3); break;
    }
  }
  if (mappingTableOffset === null) throw new Error('OFFSET_TO_OCHAR mapping pointer table was not reproduced');
  const mappingTablePhysical = staticDataBase + mappingTableOffset;
  const rowPointers = Array.from({ length: 7 }, (_, index) => readU32(bytes, mappingTablePhysical + index * 4));
  const rows = rowPointers.map(pointer => Array.from(bytes.slice(staticDataBase + pointer, staticDataBase + pointer + 9)));
  const allRowsPermutation0to8 = rows.every(isPermutation0to8);
  if (!allRowsPermutation0to8) throw new Error('OFFSET_TO_OCHAR rows are not seven complete 0..8 permutations');
  const tokenMappings: TokenMappingEvidence[] = Array.from({ length: 9 }, (_, token) => {
    const ids = rows.map(row => row[token]);
    const stable = ids.every(id => id === ids[0]) ? ids[0] : null;
    if (token === 8 && rows.every((row, player) => row[token] === player)) {
      return { token: token as FirstOpponentToken, characterIdsByPlayableCharacter: ids, stableCharacterId: null,
        classification: 'MIRROR_CURRENT_CHARACTER' as const, internalIdentity: 'CURRENT_PLAYABLE_CHARACTER' as const };
    }
    if (stable !== null) {
      return { token: token as FirstOpponentToken, characterIdsByPlayableCharacter: ids, stableCharacterId: stable,
        classification: 'STABLE_SPECIAL_CHARACTER_ID' as const,
        internalIdentity: stable === 7 ? 'GORO' as const : stable === 8 ? 'EMP' as const : null };
    }
    return { token: token as FirstOpponentToken, characterIdsByPlayableCharacter: ids, stableCharacterId: null,
      classification: 'ORDINARY_PLAYER_RELATIVE_TOKEN' as const, internalIdentity: null };
  });
  const token6 = tokenMappings[6];
  const token7 = tokenMappings[7];
  const token8 = tokenMappings[8];
  if (token6.stableCharacterId !== 7 || token7.stableCharacterId !== 8 || token8.classification !== 'MIRROR_CURRENT_CHARACTER') {
    throw new Error('Stable boss/mirror token relationships did not reproduce');
  }

  const goroAssociation = findCounterAssociation(bytes, codeBase, codeEnd, 7, cGoroWins.addressOffset, 'C_GORO_WINS');
  const empAssociation = findCounterAssociation(bytes, codeBase, codeEnd, 8, cEmpWins.addressOffset, 'C_EMP_WINS');
  if (!goroAssociation || !empAssociation) throw new Error('Character ID 7/8 counter associations did not reproduce');
  const secretGreenNinjaRoute = findSecretGreenNinjaEvidence(bytes, symbols, codeBase, codeEnd);

  const bossTokensStableAcrossPlayableCharacters = token6.stableCharacterId === 7 && token7.stableCharacterId === 8;
  const mirrorTokenStable = token8.classification === 'MIRROR_CURRENT_CHARACTER';
  const success = maps.length === 4 && maps.every(map => map.terminator === 0xff)
    && bossTokensStableAcrossPlayableCharacters && mirrorTokenStable
    && Boolean(goroAssociation) && Boolean(empAssociation);
  const operationId = createOperationId('opponent_access_harness');
  const timestamp = new Date().toISOString();
  const mapPatchOffsets = maps.map(map => map.physicalStart);
  return {
    format: 'mk1_opponent_access_harness_v1',
    timestamp,
    operationId,
    provenance: { ...roundTrip.provenance, timestamp, operationId },
    fixture: { exePath: file.path, exeSize: file.size, exeSizeHex: toHex32(file.size) },
    prerequisite: {
      semanticsPass: '1E.3F', semanticsOperationId: semantics.operationId,
      roundTripPass: '1E.3H', roundTripOperationId: roundTrip.operationId,
      validationPassed: true,
    },
    coordinateModel: { codeImageBase: codeBase, codeImageBaseHex: toHex32(codeBase), staticDataBase, staticDataBaseHex: toHex32(staticDataBase) },
    symbols: {
      whoIsNext: { watcomOffset: whoIsNext.addressOffset, watcomOffsetHex: toHex32(whoIsNext.addressOffset), physicalStart: whoStart, physicalStartHex: toHex32(whoStart), moduleName: whoIsNext.resolvedModuleName ?? null },
      offsetToOchar: { watcomOffset: offsetToOchar.addressOffset, watcomOffsetHex: toHex32(offsetToOchar.addressOffset), physicalStart: ocharStart, physicalStartHex: toHex32(ocharStart), moduleName: offsetToOchar.resolvedModuleName ?? null },
      mapStart: { watcomOffset: mapStart.addressOffset, watcomOffsetHex: toHex32(mapStart.addressOffset) },
      mapPosition: { watcomOffset: mapPosition.addressOffset, watcomOffsetHex: toHex32(mapPosition.addressOffset) },
      battleNum: { watcomOffset: battleNum.addressOffset, watcomOffsetHex: toHex32(battleNum.addressOffset) },
    },
    ladderSelector: {
      instructionPhysicalStart: selector.start,
      instructionPhysicalStartHex: toHex32(selector.start),
      bytesHex: bytesHex(bytes.slice(selector.start, selector.start + 24)),
      mapPointerTableWatcomOffset: selector.tableOffset,
      mapPointerTableWatcomOffsetHex: toHex32(selector.tableOffset),
      mapPointerTablePhysicalStart: mapPointerTablePhysical,
      mapPointerTablePhysicalStartHex: toHex32(mapPointerTablePhysical),
      mapPointers,
      mapPointersHex: mapPointers.map(toHex32),
      maps,
      uniqueSelectorMatch: true,
      classification: 'VERIFIED_FOUR_MAP_SINGLE_PLAYER_LADDER_SELECTOR',
    },
    whoIsNext: {
      readsMapStartAndNextPosition: true,
      evidencePhysicalOffset: whoEvidence,
      evidencePhysicalOffsetHex: toHex32(whoEvidence),
      bytesHex: bytesHex(bytes.slice(whoEvidence, whoEvidence + 16)),
      classification: 'VERIFIED_NEXT_LADDER_TOKEN_READ',
    },
    offsetToOchar: {
      mappingPointerTableWatcomOffset: mappingTableOffset,
      mappingPointerTableWatcomOffsetHex: toHex32(mappingTableOffset),
      mappingPointerTablePhysicalStart: mappingTablePhysical,
      mappingPointerTablePhysicalStartHex: toHex32(mappingTablePhysical),
      rowPointers,
      rowPointersHex: rowPointers.map(toHex32),
      rows,
      rowsHex: rows.map(row => bytesHex(Uint8Array.from(row))),
      allRowsPermutation0to8,
      tokenMappings,
      classification: 'VERIFIED_PLAYER_RELATIVE_TOKEN_TO_CHARACTER_ID_TABLE',
    },
    specialCharacterAssociations: [goroAssociation, empAssociation],
    secretGreenNinjaRoute,
    decision: {
      firstEncounterPatchOffsets: mapPatchOffsets,
      firstEncounterPatchOffsetsHex: mapPatchOffsets.map(toHex32),
      bossTokensStableAcrossPlayableCharacters,
      mirrorTokenStable,
      combatLogicPatched: false,
      stageLogicPatched: false,
      exposedTokens: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      secretGreenNinjaAccessDeferred: secretGreenNinjaRoute !== null,
      verdict: success ? 'OPPONENT_ACCESS_HARNESS_ESTABLISHED' : 'PARTIAL_OPPONENT_ACCESS_HARNESS',
      narrative: success
        ? 'The authentic executable selects one of four 16-byte single-player ladder maps, WHO_IS_NEXT reads subsequent signed tokens from MAP_START using MAP_POSITION, and OFFSET_TO_OCHAR translates ordinary tokens through seven player-relative rows. Token 6 resolves to character ID 7 in every playable-character row and code increments C_GORO_WINS when the winning character ID is 7; token 7 likewise resolves to ID 8 and C_EMP_WINS. Token 8 maps back to the current playable character in every row. A safe access harness can therefore change only the first byte of each ladder map to force a reproducible first encounter without changing combat or stage code. A separate F_GNINJA/GNINJA_P green-ninja path is mechanically visible but is deliberately not exposed until its surrounding encounter state is reduced to a minimal patch.'
        : 'One or more ladder, token-mapping, or special-character invariants failed. Do not export an access patch.',
    },
    status: success ? 'SUCCESS' : 'PARTIAL',
  };
}

export async function createMK1OpponentAccessHarnessExport(report: MK1OpponentAccessHarnessReport) {
  const token6 = report.offsetToOchar.tokenMappings[6];
  const token7 = report.offsetToOchar.tokenMappings[7];
  const token8 = report.offsetToOchar.tokenMappings[8];
  const checks = [
    { checkId: 'PROVENANCE_REAL_USER_LOADED', passed: report.provenance.sourceKind === 'user-loaded-directory' && report.provenance.synthetic === false && report.provenance.artifactGeneratedByTest === false && typeof report.provenance.sha256 === 'string' && /^[0-9a-f]{64}$/.test(report.provenance.sha256) },
    { checkId: 'OPERATION_ID_CONSISTENT', passed: report.operationId.startsWith('opponent_access_harness-') && report.operationId === report.provenance.operationId },
    { checkId: 'PREREQUISITES_BOUND', passed: report.prerequisite.validationPassed && report.prerequisite.semanticsPass === '1E.3F' && report.prerequisite.roundTripPass === '1E.3H' },
    { checkId: 'FOUR_LADDER_MAPS_QUALIFIED', passed: report.ladderSelector.uniqueSelectorMatch && report.ladderSelector.maps.length === 4 && report.ladderSelector.maps.every(map => map.bytes.length === 16 && map.terminator === 0xff) },
    { checkId: 'WHO_IS_NEXT_DATAFLOW', passed: report.whoIsNext.readsMapStartAndNextPosition },
    { checkId: 'OFFSET_TO_OCHAR_SEVEN_ROWS', passed: report.offsetToOchar.rows.length === 7 && report.offsetToOchar.allRowsPermutation0to8 },
    { checkId: 'TOKEN6_STABLE_ID7', passed: token6?.stableCharacterId === 7 && token6.internalIdentity === 'GORO' },
    { checkId: 'TOKEN7_STABLE_ID8', passed: token7?.stableCharacterId === 8 && token7.internalIdentity === 'EMP' },
    { checkId: 'TOKEN8_MIRROR', passed: token8?.classification === 'MIRROR_CURRENT_CHARACTER' && token8.characterIdsByPlayableCharacter.every((id, player) => id === player) },
    { checkId: 'SPECIAL_COUNTER_ASSOCIATIONS', passed: report.specialCharacterAssociations.length === 2 && report.specialCharacterAssociations.some(row => row.characterId === 7 && row.counterSymbol === 'C_GORO_WINS') && report.specialCharacterAssociations.some(row => row.characterId === 8 && row.counterSymbol === 'C_EMP_WINS') },
    { checkId: 'ACCESS_PATCH_DATA_ONLY_SCOPE', passed: report.decision.combatLogicPatched === false && report.decision.stageLogicPatched === false && report.decision.firstEncounterPatchOffsets.length === 4 },
    { checkId: 'GREEN_NINJA_ROUTE_NOT_EXPOSED', passed: report.secretGreenNinjaRoute === null || report.secretGreenNinjaRoute.accessPatchExposed === false },
  ];
  if (report.status !== 'SUCCESS' || report.decision.verdict !== 'OPPONENT_ACCESS_HARNESS_ESTABLISHED' || !checks.every(check => check.passed)) {
    throw new Error(`Authoritative 1E.3N.1 export blocked: ${checks.filter(check => !check.passed).map(check => check.checkId).join(', ') || report.status}`);
  }
  return {
    metadata: { name: 'MK1 Opponent Access Harness', version: '1.0.0', milestone: 'Pass 1E.3N.1', formatVersion: report.format, exportTimestamp: report.timestamp },
    ...report,
    validation: { allChecksPassed: true, checks },
  };
}

export interface OpponentAccessEditReport {
  format: 'mk1_opponent_access_edit_v1';
  timestamp: string;
  operationId: string;
  provenance: PaletteRoundTripReport['provenance'];
  prerequisite: { pass: '1E.3N.1'; operationId: string; validationPassed: true; fixtureSha256: string };
  requestedToken: FirstOpponentToken;
  resolvedMapping: TokenMappingEvidence;
  edits: ByteChange[];
  evidence: {
    originalExeSha256: string;
    editedExeSha256: string;
    reversedExeSha256: string;
    changedByteCount: number;
    unexpectedByteChanges: number;
    firstEncounterOffsets: number[];
    firstEncounterOffsetsHex: string[];
    reverseRestoresOriginal: boolean;
  };
  status: 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING';
  runtime: { tested: false; result: 'NOT_TESTED'; expectedObservation: string };
}

export interface OpponentAccessEditResult {
  qualification: MK1OpponentAccessHarnessReport;
  originalExe: Uint8Array;
  editedExe: Uint8Array;
  report: OpponentAccessEditReport;
}

function applyAccessToken(originalExe: Uint8Array, qualification: MK1OpponentAccessHarnessReport, token: FirstOpponentToken) {
  if (!qualification.decision.exposedTokens.includes(token)) throw new Error(`Token ${token} is not exposed by 1E.3N.1`);
  const edited = originalExe.slice();
  const edits: ByteChange[] = [];
  qualification.ladderSelector.maps.forEach(map => {
    const offset = map.physicalStart;
    if (originalExe[offset] !== map.originalFirstToken) throw new Error(`Ladder map ${map.mapIndex} first token no longer matches qualification`);
    if (originalExe[offset] !== token) {
      edits.push({ physicalOffset: offset, physicalOffsetHex: toHex32(offset), before: originalExe[offset], after: token });
      edited[offset] = token;
    }
  });
  const actual = diffBytes(originalExe, edited);
  if (JSON.stringify(actual) !== JSON.stringify(edits)) throw new Error('Opponent access edit changed unexpected bytes');
  return { edited, edits };
}

export async function executeOpponentAccessEdit(
  source: DirectorySource,
  qualification: MK1OpponentAccessHarnessReport,
  token: FirstOpponentToken,
): Promise<OpponentAccessEditResult> {
  if (source.isSynthetic !== false) throw new Error('Opponent access edit requires an authentic user-loaded directory');
  await createMK1OpponentAccessHarnessExport(qualification);
  const entries = await source.listRecursive();
  const file = entries.find(entry => entry.path === qualification.fixture.exePath);
  if (!file || file.size !== qualification.fixture.exeSize) throw new Error('MK1.EXE path/size changed since 1E.3N.1');
  const originalExe = await source.readSlice(file.path, 0, file.size);
  if (originalExe.length !== file.size) throw new Error('Incomplete MK1.EXE read');
  const originalHash = await sha256Bytes(originalExe);
  if (originalHash !== qualification.provenance.sha256) throw new Error('MK1.EXE SHA-256 changed since 1E.3N.1');
  const { edited, edits } = applyAccessToken(originalExe, qualification, token);
  if (!edits.length) throw new Error('Requested token produces no first-encounter byte changes');
  const reversed = edited.slice();
  for (const edit of edits) reversed[edit.physicalOffset] = edit.before;
  const editedHash = await sha256Bytes(edited);
  const reversedHash = await sha256Bytes(reversed);
  const mapping = qualification.offsetToOchar.tokenMappings[token];
  const expectedObservation = token === 6
    ? 'Start a one-player game with any normal selectable fighter. The first opponent should resolve through the original OFFSET_TO_OCHAR path to character ID 7, associated in code with C_GORO_WINS. No combat or stage logic is modified.'
    : token === 7
      ? 'Start a one-player game with any normal selectable fighter. The first opponent should resolve through the original OFFSET_TO_OCHAR path to character ID 8, associated in code with C_EMP_WINS. Record the actual runtime identity; the access patch does not alter combat or stage logic.'
      : token === 8
        ? 'Start a one-player game. The first opponent should resolve to the same playable character selected by the player, reproducing the mirror token through the original mapping rows.'
        : `Start a one-player game. Token ${token} is player-relative for ordinary selectable opponents, so record which character appears for the chosen player.`;
  const operationId = createOperationId('opponent_access_edit');
  const timestamp = new Date().toISOString();
  return {
    qualification,
    originalExe,
    editedExe: edited,
    report: {
      format: 'mk1_opponent_access_edit_v1', timestamp, operationId,
      provenance: { ...qualification.provenance, timestamp, operationId },
      prerequisite: { pass: '1E.3N.1', operationId: qualification.operationId, validationPassed: true, fixtureSha256: originalHash },
      requestedToken: token,
      resolvedMapping: mapping,
      edits,
      evidence: {
        originalExeSha256: originalHash,
        editedExeSha256: editedHash,
        reversedExeSha256: reversedHash,
        changedByteCount: edits.length,
        unexpectedByteChanges: 0,
        firstEncounterOffsets: qualification.decision.firstEncounterPatchOffsets,
        firstEncounterOffsetsHex: qualification.decision.firstEncounterPatchOffsetsHex,
        reverseRestoresOriginal: reversedHash === originalHash,
      },
      status: 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING',
      runtime: { tested: false, result: 'NOT_TESTED', expectedObservation },
    },
  };
}

export async function createMK1OpponentAccessEditExport(result: OpponentAccessEditResult) {
  await createMK1OpponentAccessHarnessExport(result.qualification);
  const r = result.report;
  const reapplied = applyAccessToken(result.originalExe, result.qualification, r.requestedToken);
  const originalHash = await sha256Bytes(result.originalExe);
  const editedHash = await sha256Bytes(reapplied.edited);
  const suppliedEditedHash = await sha256Bytes(result.editedExe);
  const reversed = reapplied.edited.slice();
  for (const edit of reapplied.edits) reversed[edit.physicalOffset] = edit.before;
  const reversedHash = await sha256Bytes(reversed);
  const checks = [
    { checkId: 'BASELINE_FIXTURE_BOUND', passed: originalHash === result.qualification.provenance.sha256 && r.provenance.sha256 === originalHash && r.provenance.sourceKind === 'user-loaded-directory' && r.provenance.synthetic === false && r.provenance.artifactGeneratedByTest === false },
    { checkId: 'OPERATION_ID_CONSISTENT', passed: r.operationId.startsWith('opponent_access_edit-') && r.operationId === r.provenance.operationId },
    { checkId: 'PREREQUISITE_BOUND', passed: r.prerequisite.pass === '1E.3N.1' && r.prerequisite.operationId === result.qualification.operationId && r.prerequisite.fixtureSha256 === originalHash && r.prerequisite.validationPassed },
    { checkId: 'REQUESTED_TOKEN_EXPOSED', passed: result.qualification.decision.exposedTokens.includes(r.requestedToken) && JSON.stringify(r.resolvedMapping) === JSON.stringify(result.qualification.offsetToOchar.tokenMappings[r.requestedToken]) },
    { checkId: 'EXACT_FOUR_MAP_PATCH_SCOPE', passed: JSON.stringify(r.edits) === JSON.stringify(reapplied.edits) && reapplied.edits.every(edit => result.qualification.decision.firstEncounterPatchOffsets.includes(edit.physicalOffset)) },
    { checkId: 'OUTPUT_HASH_REVALIDATED', passed: suppliedEditedHash === editedHash && r.evidence.editedExeSha256 === editedHash },
    { checkId: 'NO_UNEXPECTED_BYTE_CHANGES', passed: r.evidence.unexpectedByteChanges === 0 && r.evidence.changedByteCount === reapplied.edits.length },
    { checkId: 'REVERSE_RESTORES_ORIGINAL', passed: reversedHash === originalHash && r.evidence.reversedExeSha256 === originalHash && r.evidence.reverseRestoresOriginal },
    { checkId: 'RUNTIME_NOT_CLAIMED', passed: r.status === 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING' && r.runtime.tested === false && r.runtime.result === 'NOT_TESTED' },
  ];
  if (!checks.every(check => check.passed)) throw new Error(`Opponent access export blocked: ${checks.filter(check => !check.passed).map(check => check.checkId).join(', ')}`);
  return {
    metadata: { name: 'MK1 Opponent Access Edit', milestone: 'Pass 1E.3N.1', formatVersion: r.format, exportTimestamp: r.timestamp },
    ...r,
    validation: { allChecksPassed: true, checks },
  };
}

function tokenDisplay(token: FirstOpponentToken): string {
  if (token === 6) return 'token 6 → character ID 7 → C_GORO_WINS association';
  if (token === 7) return 'token 7 → character ID 8 → C_EMP_WINS association';
  if (token === 8) return 'token 8 → current playable character (mirror)';
  return `ordinary player-relative token ${token}`;
}

export async function buildOpponentAccessTestBundle(result: OpponentAccessEditResult): Promise<Uint8Array> {
  const artifact = await createMK1OpponentAccessEditExport(result);
  const qualification = await createMK1OpponentAccessHarnessExport(result.qualification);
  const encoder = new TextEncoder();
  const instructions = `MK1 OPPONENT ACCESS HARNESS — Pass 1E.3N.1\n\nSTATIC BYTE VALIDATION PASSED. RUNTIME RESULT NOT YET OBSERVED.\n\nThis bundle changes only the first byte of the four original single-player ladder maps. It does not patch fighter AI, damage, rendering, stage selection or combat routines.\n\nRequested route: ${tokenDisplay(result.report.requestedToken)}\n\n1. Make a separate copy of your complete untouched MK1 installation.\n2. Replace MK1.EXE in that test copy with the MK1.EXE from this ZIP.\n3. Start a ONE-PLAYER game and select any normal fighter${result.report.requestedToken <= 5 ? ' (ordinary tokens are player-relative, so note your selected fighter)' : ''}.\n4. Record the identity of the FIRST opponent and whether the fight initializes/plays normally.\n5. Capture a screenshot with both fighters and the stage visible.\n6. Restore by recopying MK1.EXE from the untouched original installation.\n\nExpected changed bytes: ${result.report.evidence.changedByteCount}\nOffsets: ${result.report.edits.map(edit => edit.physicalOffsetHex).join(', ')}\nOriginal SHA-256: ${result.report.evidence.originalExeSha256}\nEdited SHA-256: ${result.report.evidence.editedExeSha256}\n\nThe secret F_GNINJA/GNINJA_P green-ninja route is evidence-only in this pass and is NOT modified by this bundle.\n`;
  return buildStoredZip([
    { name: 'MK1.EXE', bytes: result.editedExe },
    { name: 'mk1_opponent_access_edit.json', bytes: encoder.encode(JSON.stringify(artifact, null, 2)) },
    { name: 'mk1_opponent_access_harness.json', bytes: encoder.encode(JSON.stringify(qualification, null, 2)) },
    { name: 'READ_ME_FIRST.txt', bytes: encoder.encode(instructions) },
  ]);
}

export type BossCompositeTarget = 'goro' | 'shang';

interface BossCompositeConfig {
  target: BossCompositeTarget;
  requestedToken: 6 | 7;
  paletteSymbol: 'GONGORO_P' | 'YANG_P';
  paletteDisplay: string;
  encounterDisplay: string;
  milestone: '1E.3N.1' | '1E.3N.3';
}

const BOSS_COMPOSITES: Record<BossCompositeTarget, BossCompositeConfig> = {
  goro: {
    target: 'goro', requestedToken: 6, paletteSymbol: 'GONGORO_P', paletteDisplay: 'GONGORO_P',
    encounterDisplay: 'Goro', milestone: '1E.3N.1',
  },
  shang: {
    target: 'shang', requestedToken: 7, paletteSymbol: 'YANG_P', paletteDisplay: 'YANG_P / EMP_P',
    encounterDisplay: 'Shang Tsung', milestone: '1E.3N.3',
  },
};

export interface OpponentAccessCompositeReport {
  format: 'mk1_opponent_access_composite_v1';
  timestamp: string;
  operationId: string;
  provenance: PaletteRoundTripReport['provenance'];
  target: BossCompositeTarget;
  milestone: '1E.3N.1' | '1E.3N.3';
  access: ReturnType<typeof createMK1OpponentAccessEditExport> extends Promise<infer T> ? T : never;
  palette: Awaited<ReturnType<typeof createMK1PaletteEntryEditExport>>;
  layers: {
    access: { requestedToken: 6 | 7; changedByteOffsets: number[]; changedByteOffsetsHex: string[] };
    palette: { symbol: 'GONGORO_P' | 'YANG_P'; aliases: string[]; editedWordCount: number; changedByteOffsets: number[]; changedByteOffsetsHex: string[] };
  };
  evidence: {
    originalExeSha256: string;
    compositeExeSha256: string;
    reversedExeSha256: string;
    changedByteCount: number;
    expectedUnionByteCount: number;
    unexpectedByteChanges: number;
    reverseRestoresOriginal: boolean;
  };
  status: 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING';
  runtime: { tested: false; result: 'NOT_TESTED'; expectedObservation: string };
}

export async function buildBossPaletteCompositeBundle(
  source: DirectorySource,
  baseline: PaletteRoundTripReport,
  qualification: MK1OpponentAccessHarnessReport,
  target: BossCompositeTarget,
): Promise<{ zip: Uint8Array; report: OpponentAccessCompositeReport }> {
  const config = BOSS_COMPOSITES[target];
  await createMK1PaletteRoundTripExport(baseline);
  await createMK1OpponentAccessHarnessExport(qualification);
  if (baseline.provenance.sha256 !== qualification.provenance.sha256) throw new Error('Composite layers do not share the same original fixture');
  const paletteRecord = baseline.groundTruthRecords.find(record => record.symbolNames.includes(config.paletteSymbol));
  if (!paletteRecord || paletteRecord.declaredLength !== 23) throw new Error(`${config.paletteDisplay} 23-color record not available for composite test`);
  if (target === 'shang' && !(paletteRecord.symbolNames.includes('YANG_P') && paletteRecord.symbolNames.includes('EMP_P'))) {
    throw new Error('Slot-8 composite requires one shared palette record carrying both YANG_P and EMP_P aliases');
  }
  const magentaWords = baseline.ir.records[paletteRecord.recordIndex].rawColorWords.map(() => 0x7c1f);
  const paletteResult = await executePaletteEntryEdit(source, baseline, magentaWords, config.paletteSymbol);
  const paletteArtifact = await createMK1PaletteEntryEditExport(paletteResult);
  const accessResult = await executeOpponentAccessEdit(source, qualification, config.requestedToken);
  const accessArtifact = await createMK1OpponentAccessEditExport(accessResult);
  const composite = paletteResult.editedExe.slice();
  for (const edit of accessResult.report.edits) {
    if (composite[edit.physicalOffset] !== edit.before) throw new Error('Access and palette layers overlap unexpectedly');
    composite[edit.physicalOffset] = edit.after;
  }
  const actual = diffBytes(paletteResult.originalExe, composite);
  const allowed = new Set<number>([
    ...paletteResult.report.evidence.actualChanges.map(change => change.physicalOffset),
    ...accessResult.report.edits.map(change => change.physicalOffset),
  ]);
  const unexpected = actual.filter(change => !allowed.has(change.physicalOffset));
  const expectedUnionByteCount = allowed.size;
  if (unexpected.length || actual.length !== expectedUnionByteCount) throw new Error('Composite bundle changed bytes outside the two declared layers');
  const reversed = composite.slice();
  for (const change of actual) reversed[change.physicalOffset] = change.before;
  const originalHash = await sha256Bytes(paletteResult.originalExe);
  const compositeHash = await sha256Bytes(composite);
  const reversedHash = await sha256Bytes(reversed);
  if (reversedHash !== originalHash) throw new Error('Composite reversal did not restore original executable');
  const operationId = createOperationId('opponent_access_composite');
  const timestamp = new Date().toISOString();
  const expectedObservation = target === 'goro'
    ? 'Start a one-player game with any normal selectable fighter. The access layer forces ladder token 6 as the first opponent; the original OFFSET_TO_OCHAR path resolves it to character ID 7. Independently, only GONGORO_P palette words are set to magenta. The already runtime-qualified result is Goro; this bundle remains useful for repeatable Goro palette editing.'
    : 'Start a one-player game with any normal selectable fighter. The access layer forces ladder token 7 as the first opponent; the original OFFSET_TO_OCHAR path resolves it to character ID 8. That identity has been runtime-qualified as Shang Tsung. Independently, only the single 23-color record carrying both YANG_P and EMP_P aliases is set to magenta. If slot 8 owns Shang Tsung\'s fighter palette, Shang Tsung should appear magenta while the selected fighter, stage, HUD and combat behavior remain otherwise unchanged.';
  const report: OpponentAccessCompositeReport = {
    format: 'mk1_opponent_access_composite_v1', timestamp, operationId,
    provenance: { ...baseline.provenance, timestamp, operationId },
    target,
    milestone: config.milestone,
    access: accessArtifact,
    palette: paletteArtifact,
    layers: {
      access: { requestedToken: config.requestedToken, changedByteOffsets: accessResult.report.edits.map(edit => edit.physicalOffset), changedByteOffsetsHex: accessResult.report.edits.map(edit => edit.physicalOffsetHex) },
      palette: { symbol: config.paletteSymbol, aliases: [...paletteRecord.symbolNames], editedWordCount: paletteResult.report.evidence.editedWordCount,
        changedByteOffsets: paletteResult.report.evidence.actualChanges.map(change => change.physicalOffset),
        changedByteOffsetsHex: paletteResult.report.evidence.actualChanges.map(change => toHex32(change.physicalOffset)) },
    },
    evidence: {
      originalExeSha256: originalHash,
      compositeExeSha256: compositeHash,
      reversedExeSha256: reversedHash,
      changedByteCount: actual.length,
      expectedUnionByteCount,
      unexpectedByteChanges: unexpected.length,
      reverseRestoresOriginal: reversedHash === originalHash,
    },
    status: 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING',
    runtime: { tested: false, result: 'NOT_TESTED', expectedObservation },
  };
  const encoder = new TextEncoder();
  const instructions = `MK1 BOSS ACCESS + PALETTE COMPOSITE — Pass ${config.milestone}\n\nSTATIC VALIDATION PASSED. RUNTIME RESULT NOT YET OBSERVED BY THE APPLICATION.\n\nTwo independently declared patch layers are combined:\nA) ACCESS: four first-ladder-token bytes → token ${config.requestedToken}.\nB) ASSET: ${config.paletteDisplay}'s 23 color words → magenta.\n\nNo combat, AI, damage or stage-selection code is modified.\n\n1. Use a separate copy of the complete untouched MK1 installation.\n2. Replace MK1.EXE with the one in this ZIP.\n3. Start ONE PLAYER and select any normal fighter.\n4. The first opponent should be ${config.encounterDisplay}. Record whether ${config.encounterDisplay} is magenta.\n5. Capture a screenshot and note boot/match stability.\n6. Restore the original MK1.EXE afterwards.\n\nOriginal SHA-256: ${originalHash}\nComposite SHA-256: ${compositeHash}\nTotal changed bytes: ${actual.length}\nAccess changed bytes: ${accessResult.report.edits.length}\nPalette changed bytes: ${paletteResult.report.evidence.changedByteCount}\nUnexpected changed bytes: ${unexpected.length}\nReversal restores original: ${reversedHash === originalHash}\n`;
  const zip = buildStoredZip([
    { name: 'MK1.EXE', bytes: composite },
    { name: 'mk1_opponent_access_composite.json', bytes: encoder.encode(JSON.stringify(report, null, 2)) },
    { name: 'mk1_opponent_access_edit.json', bytes: encoder.encode(JSON.stringify(accessArtifact, null, 2)) },
    { name: 'mk1_palette_entry_edit.json', bytes: encoder.encode(JSON.stringify(paletteArtifact, null, 2)) },
    { name: 'READ_ME_FIRST.txt', bytes: encoder.encode(instructions) },
  ]);
  return { zip, report };
}

/** Backward-compatible wrapper retained for the established slot-7 test. */
export async function buildGoroSlot7CompositeBundle(
  source: DirectorySource,
  baseline: PaletteRoundTripReport,
  qualification: MK1OpponentAccessHarnessReport,
): Promise<{ zip: Uint8Array; report: OpponentAccessCompositeReport }> {
  return buildBossPaletteCompositeBundle(source, baseline, qualification, 'goro');
}

/** Pass 1E.3N.3 slot-8 Shang Tsung palette-ownership test. */
export async function buildShangSlot8CompositeBundle(
  source: DirectorySource,
  baseline: PaletteRoundTripReport,
  qualification: MK1OpponentAccessHarnessReport,
): Promise<{ zip: Uint8Array; report: OpponentAccessCompositeReport }> {
  return buildBossPaletteCompositeBundle(source, baseline, qualification, 'shang');
}
