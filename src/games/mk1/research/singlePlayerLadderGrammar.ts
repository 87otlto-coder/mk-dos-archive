/**
 * MK1 single-player ladder grammar — Pass 1E.3N.2.
 *
 * Bounded purpose:
 *   Promote the four recovered ladder byte arrays from "opponent order" into a
 *   mechanically qualified progression grammar. This pass proves the 0x0F
 *   Test Your Might branch, the 0x10..0x15 endurance-pair encoding, and the
 *   0xFF terminator while preserving the 1E.3N.1 first-byte access strategy.
 *
 * This remains a research/access layer. It does not patch combat, AI, damage,
 * stage selection, fighter initialization, or rendering code.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import {
  createMK1OpponentAccessHarnessExport,
  MK1OpponentAccessHarnessReport,
  ByteChange,
} from './opponentAccessHarness';
import { PaletteRoundTripReport } from './paletteRoundTrip';
import { sha256Bytes } from './paletteRoundTripCodec';

function toHex32(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
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

function diffBytes(before: Uint8Array, after: Uint8Array): ByteChange[] {
  if (before.length !== after.length) throw new Error('Byte-diff length mismatch');
  const out: ByteChange[] = [];
  for (let i = 0; i < before.length; i++) {
    if (before[i] !== after[i]) out.push({ physicalOffset: i, physicalOffsetHex: toHex32(i), before: before[i], after: after[i] });
  }
  return out;
}

function findAscii(bytes: Uint8Array, start: number, end: number, text: string): number {
  const needle = new TextEncoder().encode(text);
  outer: for (let i = Math.max(0, start); i + needle.length <= Math.min(bytes.length, end); i++) {
    for (let j = 0; j < needle.length; j++) if (bytes[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

export type EnduranceToken = 16 | 17 | 18 | 19 | 20 | 21;
export type GrammarAccessToken = 15 | EnduranceToken;

export interface LadderGrammarTokenEvidence {
  token: number;
  tokenHex: string;
  kind: 'ORDINARY_OPPONENT' | 'SPECIAL_ID7' | 'SPECIAL_ID8' | 'MIRROR' | 'TEST_YOUR_MIGHT' | 'ENDURANCE' | 'END';
  note: string;
}

export interface EndurancePairEvidence {
  token: EnduranceToken;
  pairIndex: number;
  selectedPlayableCharacterId: number;
  baseOpponentOrder: number[];
  firstCharacterId: number;
  secondCharacterId: number;
  pairPositionPattern: [number, number];
}

export interface ParsedLadderMapEvidence {
  mapIndex: number;
  bytes: number[];
  classes: string[];
  invariantShapeMatches: boolean;
  testYourMightPositions: number[];
  enduranceTokens: number[];
}

export interface MK1SinglePlayerLadderGrammarReport {
  format: 'mk1_single_player_ladder_grammar_v1';
  timestamp: string;
  operationId: string;
  provenance: PaletteRoundTripReport['provenance'];
  fixture: { exePath: string; exeSize: number; exeSizeHex: string };
  prerequisite: {
    pass: '1E.3N.1';
    operationId: string;
    validationPassed: true;
    fixtureSha256: string;
  };
  coordinateModel: {
    codeImageBase: number;
    codeImageBaseHex: string;
    staticDataBase: number;
    staticDataBaseHex: string;
  };
  tokenDispatch: {
    physicalStart: number;
    physicalStartHex: string;
    bytesHex: string;
    testYourMightToken: 15;
    terminatorToken: 255;
    enduranceThreshold: 16;
    ordinaryMapperPhysicalTarget: number;
    ordinaryMapperPhysicalTargetHex: string;
    enduranceMapperPhysicalTarget: number;
    enduranceMapperPhysicalTargetHex: string;
    classification: 'VERIFIED_LADDER_TOKEN_DISPATCH';
  };
  testYourMight: {
    token: 15;
    branchPhysicalTarget: number;
    branchPhysicalTargetHex: string;
    mapPositionIncrementPhysical: number;
    mapPositionIncrementPhysicalHex: string;
    routinePhysicalTarget: number;
    routinePhysicalTargetHex: string;
    displayRecordWatcomOffset: number;
    displayRecordWatcomOffsetHex: string;
    displayRecordPhysical: number;
    displayRecordPhysicalHex: string;
    headingPhysical: number;
    headingPhysicalHex: string;
    heading: 'TEST YOUR MIGHT';
    classification: 'VERIFIED_TEST_YOUR_MIGHT_TOKEN';
  };
  terminator: {
    token: 255;
    signedValue: -1;
    branchPhysicalTarget: number;
    branchPhysicalTargetHex: string;
    returnsCarrySet: true;
    classification: 'VERIFIED_LADDER_TERMINATOR';
  };
  endurance: {
    tokens: EnduranceToken[];
    mapperPhysicalStart: number;
    mapperPhysicalStartHex: string;
    bytesHex: string;
    masksLowNibble: true;
    pairPointerTableWatcomOffset: number;
    pairPointerTableWatcomOffsetHex: string;
    pairPointerTablePhysical: number;
    pairPointerTablePhysicalHex: string;
    rowPointers: number[];
    rowPointersHex: string[];
    rows: number[][];
    rowsHex: string[];
    rowsAreTwelveBytes: boolean;
    firstSixMatchOrdinaryOpponentSet: boolean;
    stablePairPositionPatterns: Array<{ token: EnduranceToken; pattern: [number, number] }>;
    pairings: EndurancePairEvidence[];
    classification: 'VERIFIED_PLAYER_RELATIVE_ENDURANCE_PAIR_TABLE';
  };
  maps: ParsedLadderMapEvidence[];
  grammar: {
    tokens: LadderGrammarTokenEvidence[];
    invariantMapShape: string[];
    allFourMapsMatchInvariantShape: boolean;
    unusedTokensInRecoveredMaps: number[];
    classification: 'VERIFIED_SINGLE_PLAYER_LADDER_GRAMMAR';
  };
  decision: {
    exposedResearchTokens: GrammarAccessToken[];
    firstEncounterPatchOffsets: number[];
    firstEncounterPatchOffsetsHex: string[];
    combatLogicPatched: false;
    stageLogicPatched: false;
    verdict: 'SINGLE_PLAYER_LADDER_GRAMMAR_ESTABLISHED' | 'PARTIAL_SINGLE_PLAYER_LADDER_GRAMMAR';
    narrative: string;
  };
  status: 'SUCCESS' | 'PARTIAL';
}

const ENDURANCE_TOKENS: EnduranceToken[] = [16, 17, 18, 19, 20, 21];
const EXPECTED_PAIR_PATTERNS: Array<{ token: EnduranceToken; pattern: [number, number] }> = [
  { token: 16, pattern: [0, 1] },
  { token: 17, pattern: [2, 3] },
  { token: 18, pattern: [4, 5] },
  { token: 19, pattern: [0, 3] },
  { token: 20, pattern: [1, 4] },
  { token: 21, pattern: [2, 5] },
];

function classifyToken(token: number): LadderGrammarTokenEvidence['kind'] {
  if (token >= 0 && token <= 5) return 'ORDINARY_OPPONENT';
  if (token === 6) return 'SPECIAL_ID7';
  if (token === 7) return 'SPECIAL_ID8';
  if (token === 8) return 'MIRROR';
  if (token === 15) return 'TEST_YOUR_MIGHT';
  if (token >= 16 && token <= 21) return 'ENDURANCE';
  if (token === 255) return 'END';
  throw new Error(`Unhandled recovered ladder token ${token}`);
}

function className(token: number): string {
  return classifyToken(token);
}

function tokenNote(token: number): string {
  const kind = classifyToken(token);
  if (kind === 'ORDINARY_OPPONENT') return 'Player-relative selectable opponent resolved through OFFSET_TO_OCHAR.';
  if (kind === 'SPECIAL_ID7') return 'Stable token 6 / character ID 7; code-side association is C_GORO_WINS.';
  if (kind === 'SPECIAL_ID8') return 'Stable token 7 / character ID 8; code-side association is C_EMP_WINS.';
  if (kind === 'MIRROR') return 'Maps to the currently selected playable character.';
  if (kind === 'TEST_YOUR_MIGHT') return 'Dedicated event branch; advances MAP_POSITION and enters the Test Your Might routine.';
  if (kind === 'ENDURANCE') return '0x10 + pair index; low nibble selects one of six two-character pair definitions.';
  return 'Signed 0xFF / -1 terminates the recovered ladder stream.';
}

function locateTokenDispatch(bytes: Uint8Array, qualification: MK1OpponentAccessHarnessReport) {
  const codeBase = qualification.coordinateModel.codeImageBase;
  const codeEnd = qualification.coordinateModel.staticDataBase;
  const mapStart = qualification.symbols.mapStart.watcomOffset;
  const mapPosition = qualification.symbols.mapPosition.watcomOffset;
  const ordinaryTarget = qualification.symbols.offsetToOchar.physicalStart;
  const matches: Array<{
    start: number;
    testBranch: number;
    endBranch: number;
    enduranceBranch: number;
    ordinaryCallTarget: number;
  }> = [];
  for (let i = codeBase; i + 48 <= codeEnd; i++) {
    // Fixture shape:
    // mov edx,[MAP_START]; ... mov ebx,[MAP_POSITION]; movsx eax,[edx+ebx]
    // cmp eax,0F; je; cmp eax,-1; je; cmp eax,10; jge; call OFFSET_TO_OCHAR
    if (bytes[i] !== 0x8b || bytes[i + 1] !== 0x15 || readU32(bytes, i + 2) !== mapStart) continue;
    let p = i + 6;
    // tolerate the intervening test/jne sequence by searching the next 40 bytes for the exact tail.
    const limit = Math.min(codeEnd - 32, i + 64);
    for (; p <= limit; p++) {
      if (bytes[p] !== 0x8b || bytes[p + 1] !== 0x1d || readU32(bytes, p + 2) !== mapPosition) continue;
      if (bytes[p + 6] !== 0x0f || bytes[p + 7] !== 0xbe || bytes[p + 8] !== 0x04 || bytes[p + 9] !== 0x1a) continue;
      const q = p + 10;
      if (bytes[q] !== 0x83 || bytes[q + 1] !== 0xf8 || bytes[q + 2] !== 0x0f || bytes[q + 3] !== 0x74) continue;
      const testBranch = q + 5 + (bytes[q + 4] << 24 >> 24);
      if (bytes[q + 5] !== 0x83 || bytes[q + 6] !== 0xf8 || bytes[q + 7] !== 0xff || bytes[q + 8] !== 0x74) continue;
      const endBranch = q + 10 + (bytes[q + 9] << 24 >> 24);
      if (bytes[q + 10] !== 0x83 || bytes[q + 11] !== 0xf8 || bytes[q + 12] !== 0x10 || bytes[q + 13] !== 0x7d) continue;
      const enduranceBranch = q + 15 + (bytes[q + 14] << 24 >> 24);
      if (bytes[q + 15] !== 0xe8) continue;
      const ordinaryCallTarget = q + 20 + readI32(bytes, q + 16);
      if (ordinaryCallTarget !== ordinaryTarget) continue;
      matches.push({ start: q, testBranch, endBranch, enduranceBranch, ordinaryCallTarget });
    }
  }
  if (matches.length !== 1) throw new Error(`1E.3N.2 expected one ladder token-dispatch site; found ${matches.length}`);
  return matches[0];
}

function locateTestYourMight(bytes: Uint8Array, qualification: MK1OpponentAccessHarnessReport, dispatch: ReturnType<typeof locateTokenDispatch>) {
  const mapPosition = qualification.symbols.mapPosition.watcomOffset;
  const staticDataBase = qualification.coordinateModel.staticDataBase;
  const branch = dispatch.testBranch;
  if (bytes[branch] !== 0xff || bytes[branch + 1] !== 0x05 || readU32(bytes, branch + 2) !== mapPosition) {
    throw new Error('0x0F branch does not increment MAP_POSITION at the qualified target');
  }
  // The branch sequence ultimately JMPs into the Test Your Might routine.
  let routineTarget = -1;
  for (let i = branch; i + 5 <= Math.min(bytes.length, branch + 64); i++) {
    if (bytes[i] !== 0xe9) continue;
    const target = i + 5 + readI32(bytes, i + 1);
    if (target < qualification.coordinateModel.codeImageBase || target >= staticDataBase) continue;
    routineTarget = target;
    break;
  }
  if (routineTarget < 0) throw new Error('0x0F branch did not expose a bounded routine transfer');

  // Within the first part of that routine, find a static-data immediate whose record contains the literal heading.
  let displayRecordWatcom = -1;
  let displayRecordPhysical = -1;
  let headingPhysical = -1;
  for (let i = routineTarget; i + 5 <= Math.min(staticDataBase, routineTarget + 0x120); i++) {
    if (bytes[i] !== 0xbf) continue; // mov edi, imm32 in the fixture path
    const value = readU32(bytes, i + 1);
    const physical = staticDataBase + value;
    if (physical < staticDataBase || physical >= bytes.length) continue;
    const heading = findAscii(bytes, physical, Math.min(bytes.length, physical + 64), 'TEST YOUR MIGHT');
    if (heading >= 0) {
      displayRecordWatcom = value;
      displayRecordPhysical = physical;
      headingPhysical = heading;
      break;
    }
  }
  if (headingPhysical < 0) throw new Error('Test Your Might routine did not resolve a display record containing the literal heading');
  return { routineTarget, displayRecordWatcom, displayRecordPhysical, headingPhysical };
}

function locateEnduranceMapper(bytes: Uint8Array, qualification: MK1OpponentAccessHarnessReport, dispatch: ReturnType<typeof locateTokenDispatch>) {
  const branch = dispatch.enduranceBranch;
  // Branch target copies current-character identity, then calls the compact pair mapper.
  let mapper = -1;
  for (let i = branch; i + 5 <= Math.min(bytes.length, branch + 32); i++) {
    if (bytes[i] !== 0xe8) continue;
    mapper = i + 5 + readI32(bytes, i + 1);
    break;
  }
  if (mapper < 0) throw new Error('Endurance branch did not resolve a mapper call');
  // Exact compact mapper shape ends with two byte loads from [row + eax*2].
  if (bytes[mapper] !== 0x8b || bytes[mapper + 1] !== 0x15) throw new Error('Endurance mapper start shape changed');
  if (bytes[mapper + 6] !== 0x8b || bytes[mapper + 7] !== 0x14 || bytes[mapper + 8] !== 0x95) throw new Error('Endurance mapper pointer-table load changed');
  const tableOffset = readU32(bytes, mapper + 9);
  if (bytes[mapper + 13] !== 0x24 || bytes[mapper + 14] !== 0x0f) throw new Error('Endurance mapper no longer masks token low nibble');
  if (bytes[mapper + 15] !== 0x0f || bytes[mapper + 16] !== 0xb6 || bytes[mapper + 17] !== 0x0c || bytes[mapper + 18] !== 0x42) throw new Error('Endurance mapper first fighter load changed');
  if (bytes[mapper + 19] !== 0x0f || bytes[mapper + 20] !== 0xb6 || bytes[mapper + 21] !== 0x54 || bytes[mapper + 22] !== 0x42 || bytes[mapper + 23] !== 0x01) throw new Error('Endurance mapper second fighter load changed');
  return { mapper, tableOffset };
}

export async function executeSinglePlayerLadderGrammarQualification(
  source: DirectorySource,
  options: {
    opponentAccessReport: MK1OpponentAccessHarnessReport;
    roundTripReport: PaletteRoundTripReport;
  },
): Promise<MK1SinglePlayerLadderGrammarReport> {
  if (source.isSynthetic !== false) throw new Error('1E.3N.2 requires an authentic user-loaded directory');
  const access = options.opponentAccessReport;
  const roundTrip = options.roundTripReport;
  const accessExport = await createMK1OpponentAccessHarnessExport(access);
  if (!accessExport.validation.allChecksPassed || access.status !== 'SUCCESS' || roundTrip.status !== 'SUCCESS') {
    throw new Error('1E.3N.2 prerequisite validation failed');
  }
  if (access.provenance.sha256 !== roundTrip.provenance.sha256) throw new Error('1E.3N.2 prerequisites do not identify the same executable');

  const entries = await source.listRecursive();
  const file = entries.find(entry => entry.path === access.fixture.exePath);
  if (!file || file.size !== access.fixture.exeSize) throw new Error('MK1.EXE path/size changed since 1E.3N.1');
  const bytes = await source.readSlice(file.path, 0, file.size);
  if (bytes.length !== file.size) throw new Error('Incomplete MK1.EXE read');
  const hash = await sha256Bytes(bytes);
  if (hash !== access.provenance.sha256) throw new Error('MK1.EXE SHA-256 changed since 1E.3N.1');

  const dispatch = locateTokenDispatch(bytes, access);
  const tym = locateTestYourMight(bytes, access, dispatch);
  const enduranceMapper = locateEnduranceMapper(bytes, access, dispatch);
  const staticDataBase = access.coordinateModel.staticDataBase;
  const pointerTablePhysical = staticDataBase + enduranceMapper.tableOffset;
  if (pointerTablePhysical < staticDataBase || pointerTablePhysical + 28 > bytes.length) throw new Error('Endurance pointer table is outside file-backed static data');
  const rowPointers = Array.from({ length: 7 }, (_, index) => readU32(bytes, pointerTablePhysical + index * 4));
  const rows = rowPointers.map(pointer => Array.from(bytes.slice(staticDataBase + pointer, staticDataBase + pointer + 12)));
  const rowsAreTwelveBytes = rows.every(row => row.length === 12);
  if (!rowsAreTwelveBytes) throw new Error('Endurance rows did not resolve as seven 12-byte rows');

  const ordinarySixByPlayer = access.offsetToOchar.rows.map(row => row.slice(0, 6));
  const firstSixMatchOrdinaryOpponentSet = rows.every((row, player) => {
    const enduranceSet = [...row.slice(0, 6)].sort((a, b) => a - b);
    const ordinarySet = [...ordinarySixByPlayer[player]].sort((a, b) => a - b);
    return JSON.stringify(enduranceSet) === JSON.stringify(ordinarySet);
  });
  if (!firstSixMatchOrdinaryOpponentSet) throw new Error('Endurance rows do not contain the same six player-relative opponents as the ordinary mapping rows');

  const pairings: EndurancePairEvidence[] = [];
  const stablePatterns: Array<{ token: EnduranceToken; pattern: [number, number] }> = [];
  for (const token of ENDURANCE_TOKENS) {
    const pairIndex = token & 0x0f;
    const observedPatterns: Array<[number, number]> = [];
    for (let selected = 0; selected < 7; selected++) {
      const row = rows[selected];
      const baseOrder = row.slice(0, 6);
      const first = row[pairIndex * 2];
      const second = row[pairIndex * 2 + 1];
      const pattern: [number, number] = [baseOrder.indexOf(first), baseOrder.indexOf(second)];
      if (pattern[0] < 0 || pattern[1] < 0) throw new Error(`Endurance token ${token} references a fighter outside the six-opponent row`);
      observedPatterns.push(pattern);
      pairings.push({ token, pairIndex, selectedPlayableCharacterId: selected, baseOpponentOrder: baseOrder, firstCharacterId: first, secondCharacterId: second, pairPositionPattern: pattern });
    }
    const firstPattern = observedPatterns[0];
    if (!observedPatterns.every(pattern => pattern[0] === firstPattern[0] && pattern[1] === firstPattern[1])) {
      throw new Error(`Endurance token ${token} does not preserve one player-relative pairing pattern`);
    }
    stablePatterns.push({ token, pattern: firstPattern });
  }
  if (JSON.stringify(stablePatterns) !== JSON.stringify(EXPECTED_PAIR_PATTERNS)) {
    throw new Error(`Endurance pairing grammar differs from the qualified six-pattern model: ${JSON.stringify(stablePatterns)}`);
  }

  const invariantShape = [
    'ORDINARY_OPPONENT','ORDINARY_OPPONENT','ORDINARY_OPPONENT','TEST_YOUR_MIGHT',
    'ORDINARY_OPPONENT','ORDINARY_OPPONENT','ORDINARY_OPPONENT','TEST_YOUR_MIGHT',
    'MIRROR','ENDURANCE','ENDURANCE','TEST_YOUR_MIGHT','ENDURANCE','SPECIAL_ID7','SPECIAL_ID8','END',
  ];
  const parsedMaps: ParsedLadderMapEvidence[] = access.ladderSelector.maps.map(map => {
    const classes = map.bytes.map(className);
    return {
      mapIndex: map.mapIndex,
      bytes: map.bytes,
      classes,
      invariantShapeMatches: JSON.stringify(classes) === JSON.stringify(invariantShape),
      testYourMightPositions: map.bytes.map((value, index) => value === 15 ? index : -1).filter(index => index >= 0),
      enduranceTokens: map.bytes.filter(value => value >= 16 && value <= 21),
    };
  });
  const allFourMapsMatchInvariantShape = parsedMaps.every(map => map.invariantShapeMatches);

  const used = new Set<number>(access.ladderSelector.maps.flatMap(map => map.bytes));
  const unusedTokensInRecoveredMaps = Array.from({ length: 6 }, (_, i) => 9 + i).filter(token => !used.has(token));
  const tokenEvidence: LadderGrammarTokenEvidence[] = [0,1,2,3,4,5,6,7,8,15,16,17,18,19,20,21,255].map(token => ({
    token,
    tokenHex: `0x${token.toString(16).padStart(2, '0').toUpperCase()}`,
    kind: classifyToken(token),
    note: tokenNote(token),
  }));

  const success = allFourMapsMatchInvariantShape && firstSixMatchOrdinaryOpponentSet
    && stablePatterns.length === 6 && tym.headingPhysical >= 0;
  const operationId = createOperationId('single_player_ladder_grammar');
  const timestamp = new Date().toISOString();
  return {
    format: 'mk1_single_player_ladder_grammar_v1',
    timestamp,
    operationId,
    provenance: { ...access.provenance, timestamp, operationId },
    fixture: access.fixture,
    prerequisite: { pass: '1E.3N.1', operationId: access.operationId, validationPassed: true, fixtureSha256: hash },
    coordinateModel: access.coordinateModel,
    tokenDispatch: {
      physicalStart: dispatch.start,
      physicalStartHex: toHex32(dispatch.start),
      bytesHex: bytesHex(bytes.slice(dispatch.start, dispatch.start + 20)),
      testYourMightToken: 15,
      terminatorToken: 255,
      enduranceThreshold: 16,
      ordinaryMapperPhysicalTarget: dispatch.ordinaryCallTarget,
      ordinaryMapperPhysicalTargetHex: toHex32(dispatch.ordinaryCallTarget),
      enduranceMapperPhysicalTarget: enduranceMapper.mapper,
      enduranceMapperPhysicalTargetHex: toHex32(enduranceMapper.mapper),
      classification: 'VERIFIED_LADDER_TOKEN_DISPATCH',
    },
    testYourMight: {
      token: 15,
      branchPhysicalTarget: dispatch.testBranch,
      branchPhysicalTargetHex: toHex32(dispatch.testBranch),
      mapPositionIncrementPhysical: dispatch.testBranch,
      mapPositionIncrementPhysicalHex: toHex32(dispatch.testBranch),
      routinePhysicalTarget: tym.routineTarget,
      routinePhysicalTargetHex: toHex32(tym.routineTarget),
      displayRecordWatcomOffset: tym.displayRecordWatcom,
      displayRecordWatcomOffsetHex: toHex32(tym.displayRecordWatcom),
      displayRecordPhysical: tym.displayRecordPhysical,
      displayRecordPhysicalHex: toHex32(tym.displayRecordPhysical),
      headingPhysical: tym.headingPhysical,
      headingPhysicalHex: toHex32(tym.headingPhysical),
      heading: 'TEST YOUR MIGHT',
      classification: 'VERIFIED_TEST_YOUR_MIGHT_TOKEN',
    },
    terminator: {
      token: 255,
      signedValue: -1,
      branchPhysicalTarget: dispatch.endBranch,
      branchPhysicalTargetHex: toHex32(dispatch.endBranch),
      returnsCarrySet: true,
      classification: 'VERIFIED_LADDER_TERMINATOR',
    },
    endurance: {
      tokens: ENDURANCE_TOKENS,
      mapperPhysicalStart: enduranceMapper.mapper,
      mapperPhysicalStartHex: toHex32(enduranceMapper.mapper),
      bytesHex: bytesHex(bytes.slice(enduranceMapper.mapper, enduranceMapper.mapper + 25)),
      masksLowNibble: true,
      pairPointerTableWatcomOffset: enduranceMapper.tableOffset,
      pairPointerTableWatcomOffsetHex: toHex32(enduranceMapper.tableOffset),
      pairPointerTablePhysical: pointerTablePhysical,
      pairPointerTablePhysicalHex: toHex32(pointerTablePhysical),
      rowPointers,
      rowPointersHex: rowPointers.map(toHex32),
      rows,
      rowsHex: rows.map(row => bytesHex(Uint8Array.from(row))),
      rowsAreTwelveBytes,
      firstSixMatchOrdinaryOpponentSet,
      stablePairPositionPatterns: stablePatterns,
      pairings,
      classification: 'VERIFIED_PLAYER_RELATIVE_ENDURANCE_PAIR_TABLE',
    },
    maps: parsedMaps,
    grammar: {
      tokens: tokenEvidence,
      invariantMapShape: invariantShape,
      allFourMapsMatchInvariantShape,
      unusedTokensInRecoveredMaps,
      classification: 'VERIFIED_SINGLE_PLAYER_LADDER_GRAMMAR',
    },
    decision: {
      exposedResearchTokens: [15,16,17,18,19,20,21],
      firstEncounterPatchOffsets: access.decision.firstEncounterPatchOffsets,
      firstEncounterPatchOffsetsHex: access.decision.firstEncounterPatchOffsetsHex,
      combatLogicPatched: false,
      stageLogicPatched: false,
      verdict: success ? 'SINGLE_PLAYER_LADDER_GRAMMAR_ESTABLISHED' : 'PARTIAL_SINGLE_PLAYER_LADDER_GRAMMAR',
      narrative: success
        ? 'The four original 16-byte maps share one recovered grammar: three player-relative ordinary fights, token 15 Test Your Might, three more ordinary fights, token 15, mirror token 8, two endurance tokens, token 15, a third endurance token, stable special token 6 / ID 7, stable special token 7 / ID 8, and signed 0xFF termination. The dispatcher treats 0x0F as a dedicated Test Your Might branch, values >=0x10 as endurance definitions, and 0xFF as the terminator. Endurance tokens 0x10..0x15 mask to pair indices 0..5 and select two bytes from a seven-row player-relative table. The first six bytes of each row contain the same six non-selected fighters as the ordinary mapping (in an endurance-specific order A..F); the full row yields the stable pair patterns AB, CD, EF, AD, BE, CF.'
        : 'One or more ladder-dispatch, Test Your Might, endurance-table, or invariant-map checks failed. Do not promote the progression grammar or export grammar-event access bundles.',
    },
    status: success ? 'SUCCESS' : 'PARTIAL',
  };
}

export async function createMK1SinglePlayerLadderGrammarExport(report: MK1SinglePlayerLadderGrammarReport) {
  const checks = [
    { checkId: 'PROVENANCE_REAL_USER_LOADED', passed: report.provenance.sourceKind === 'user-loaded-directory' && report.provenance.synthetic === false && report.provenance.artifactGeneratedByTest === false && /^[0-9a-f]{64}$/.test(report.provenance.sha256) },
    { checkId: 'OPERATION_ID_CONSISTENT', passed: report.operationId.startsWith('single_player_ladder_grammar-') && report.operationId === report.provenance.operationId },
    { checkId: 'PREREQUISITE_1E3N1_BOUND', passed: report.prerequisite.pass === '1E.3N.1' && report.prerequisite.validationPassed && report.prerequisite.fixtureSha256 === report.provenance.sha256 },
    { checkId: 'TOKEN_DISPATCH_QUALIFIED', passed: report.tokenDispatch.testYourMightToken === 15 && report.tokenDispatch.terminatorToken === 255 && report.tokenDispatch.enduranceThreshold === 16 },
    { checkId: 'TEST_YOUR_MIGHT_LITERAL_REACHED', passed: report.testYourMight.heading === 'TEST YOUR MIGHT' && report.testYourMight.classification === 'VERIFIED_TEST_YOUR_MIGHT_TOKEN' },
    { checkId: 'SIGNED_FF_TERMINATOR', passed: report.terminator.token === 255 && report.terminator.signedValue === -1 && report.terminator.returnsCarrySet },
    { checkId: 'ENDURANCE_TABLE_SEVEN_ROWS', passed: report.endurance.rows.length === 7 && report.endurance.rowsAreTwelveBytes && report.endurance.firstSixMatchOrdinaryOpponentSet },
    { checkId: 'ENDURANCE_PAIR_PATTERNS', passed: JSON.stringify(report.endurance.stablePairPositionPatterns) === JSON.stringify(EXPECTED_PAIR_PATTERNS) },
    { checkId: 'FOUR_MAP_GRAMMAR_SHAPE', passed: report.maps.length === 4 && report.grammar.allFourMapsMatchInvariantShape },
    { checkId: 'ACCESS_PATCH_REMAINS_DATA_ONLY', passed: report.decision.combatLogicPatched === false && report.decision.stageLogicPatched === false && report.decision.firstEncounterPatchOffsets.length === 4 },
  ];
  if (!checks.every(check => check.passed)) throw new Error(`1E.3N.2 export blocked: ${checks.filter(check => !check.passed).map(check => check.checkId).join(', ')}`);
  return {
    metadata: { name: 'MK1 Single-Player Ladder Grammar', milestone: 'Pass 1E.3N.2', formatVersion: report.format, exportTimestamp: report.timestamp },
    ...report,
    validation: { allChecksPassed: true, checks },
  };
}

export interface LadderGrammarAccessEditReport {
  format: 'mk1_ladder_grammar_access_edit_v1';
  timestamp: string;
  operationId: string;
  provenance: PaletteRoundTripReport['provenance'];
  prerequisite: { pass: '1E.3N.2'; operationId: string; validationPassed: true; fixtureSha256: string };
  requestedToken: GrammarAccessToken;
  requestedKind: 'TEST_YOUR_MIGHT' | 'ENDURANCE';
  edits: ByteChange[];
  predictedEndurancePairs: EndurancePairEvidence[];
  evidence: {
    originalExeSha256: string;
    editedExeSha256: string;
    reversedExeSha256: string;
    changedByteCount: number;
    unexpectedByteChanges: number;
    reverseRestoresOriginal: boolean;
  };
  status: 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING';
  runtime: { tested: false; result: 'NOT_TESTED'; expectedObservation: string };
}

export interface LadderGrammarAccessEditResult {
  qualification: MK1SinglePlayerLadderGrammarReport;
  originalExe: Uint8Array;
  editedExe: Uint8Array;
  report: LadderGrammarAccessEditReport;
}

function applyGrammarToken(original: Uint8Array, qualification: MK1SinglePlayerLadderGrammarReport, token: GrammarAccessToken) {
  if (!qualification.decision.exposedResearchTokens.includes(token)) throw new Error(`Grammar token ${token} is not exposed by 1E.3N.2`);
  const edited = original.slice();
  const edits: ByteChange[] = [];
  qualification.maps.forEach((map, mapIndex) => {
    const offset = qualification.decision.firstEncounterPatchOffsets[mapIndex];
    if (original[offset] !== map.bytes[0]) throw new Error(`Ladder map ${mapIndex} first token no longer matches 1E.3N.2 qualification`);
    if (original[offset] !== token) {
      const change = { physicalOffset: offset, physicalOffsetHex: toHex32(offset), before: original[offset], after: token };
      edits.push(change);
      edited[offset] = token;
    }
  });
  const actual = diffBytes(original, edited);
  if (JSON.stringify(actual) !== JSON.stringify(edits)) throw new Error('Grammar access edit changed unexpected bytes');
  return { edited, edits };
}

export async function executeLadderGrammarAccessEdit(
  source: DirectorySource,
  qualification: MK1SinglePlayerLadderGrammarReport,
  token: GrammarAccessToken,
): Promise<LadderGrammarAccessEditResult> {
  if (source.isSynthetic !== false) throw new Error('Ladder grammar access edit requires an authentic user-loaded directory');
  await createMK1SinglePlayerLadderGrammarExport(qualification);
  const entries = await source.listRecursive();
  const file = entries.find(entry => entry.path === qualification.fixture.exePath);
  if (!file || file.size !== qualification.fixture.exeSize) throw new Error('MK1.EXE path/size changed since 1E.3N.2');
  const originalExe = await source.readSlice(file.path, 0, file.size);
  const originalHash = await sha256Bytes(originalExe);
  if (originalHash !== qualification.provenance.sha256) throw new Error('MK1.EXE SHA-256 changed since 1E.3N.2');
  const { edited, edits } = applyGrammarToken(originalExe, qualification, token);
  if (!edits.length) throw new Error('Requested grammar token produces no first-event byte changes');
  const editedHash = await sha256Bytes(edited);
  const reversed = edited.slice();
  for (const edit of edits) reversed[edit.physicalOffset] = edit.before;
  const reversedHash = await sha256Bytes(reversed);
  const predicted = token >= 16 ? qualification.endurance.pairings.filter(pair => pair.token === token) : [];
  const operationId = createOperationId('ladder_grammar_access_edit');
  const timestamp = new Date().toISOString();
  const expectedObservation = token === 15
    ? 'Start one-player mode. The first ladder event should enter TEST YOUR MIGHT through the original 0x0F branch; after that event the untouched ladder stream should continue from the next token. Record the observed transition and any stage/progression behavior.'
    : `Start one-player mode and select any normal fighter. The first encounter should be the two-fighter endurance definition for token ${token} (0x${token.toString(16).toUpperCase()}); the pair is player-relative and is predicted from the selected fighter by the qualification table. No combat or stage code is modified.`;
  return {
    qualification,
    originalExe,
    editedExe: edited,
    report: {
      format: 'mk1_ladder_grammar_access_edit_v1',
      timestamp,
      operationId,
      provenance: { ...qualification.provenance, timestamp, operationId },
      prerequisite: { pass: '1E.3N.2', operationId: qualification.operationId, validationPassed: true, fixtureSha256: originalHash },
      requestedToken: token,
      requestedKind: token === 15 ? 'TEST_YOUR_MIGHT' : 'ENDURANCE',
      edits,
      predictedEndurancePairs: predicted,
      evidence: {
        originalExeSha256: originalHash,
        editedExeSha256: editedHash,
        reversedExeSha256: reversedHash,
        changedByteCount: edits.length,
        unexpectedByteChanges: 0,
        reverseRestoresOriginal: reversedHash === originalHash,
      },
      status: 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING',
      runtime: { tested: false, result: 'NOT_TESTED', expectedObservation },
    },
  };
}

export async function createMK1LadderGrammarAccessEditExport(result: LadderGrammarAccessEditResult) {
  await createMK1SinglePlayerLadderGrammarExport(result.qualification);
  const reapplied = applyGrammarToken(result.originalExe, result.qualification, result.report.requestedToken);
  const originalHash = await sha256Bytes(result.originalExe);
  const editedHash = await sha256Bytes(reapplied.edited);
  const suppliedEditedHash = await sha256Bytes(result.editedExe);
  const reversed = reapplied.edited.slice();
  for (const edit of reapplied.edits) reversed[edit.physicalOffset] = edit.before;
  const reversedHash = await sha256Bytes(reversed);
  const r = result.report;
  const checks = [
    { checkId: 'BASELINE_FIXTURE_BOUND', passed: originalHash === result.qualification.provenance.sha256 && r.provenance.sha256 === originalHash },
    { checkId: 'OPERATION_ID_CONSISTENT', passed: r.operationId.startsWith('ladder_grammar_access_edit-') && r.operationId === r.provenance.operationId },
    { checkId: 'PREREQUISITE_BOUND', passed: r.prerequisite.pass === '1E.3N.2' && r.prerequisite.operationId === result.qualification.operationId && r.prerequisite.fixtureSha256 === originalHash },
    { checkId: 'REQUESTED_TOKEN_EXPOSED', passed: result.qualification.decision.exposedResearchTokens.includes(r.requestedToken) },
    { checkId: 'EXACT_FOUR_MAP_PATCH_SCOPE', passed: JSON.stringify(r.edits) === JSON.stringify(reapplied.edits) && reapplied.edits.every(edit => result.qualification.decision.firstEncounterPatchOffsets.includes(edit.physicalOffset)) },
    { checkId: 'OUTPUT_HASH_REVALIDATED', passed: suppliedEditedHash === editedHash && r.evidence.editedExeSha256 === editedHash },
    { checkId: 'NO_UNEXPECTED_BYTE_CHANGES', passed: r.evidence.unexpectedByteChanges === 0 && r.evidence.changedByteCount === reapplied.edits.length },
    { checkId: 'REVERSE_RESTORES_ORIGINAL', passed: reversedHash === originalHash && r.evidence.reversedExeSha256 === originalHash && r.evidence.reverseRestoresOriginal },
    { checkId: 'RUNTIME_NOT_CLAIMED', passed: r.status === 'STATIC_VALIDATION_PASSED_RUNTIME_PENDING' && r.runtime.tested === false },
  ];
  if (!checks.every(check => check.passed)) throw new Error(`Ladder grammar access export blocked: ${checks.filter(check => !check.passed).map(check => check.checkId).join(', ')}`);
  return {
    metadata: { name: 'MK1 Ladder Grammar Access Edit', milestone: 'Pass 1E.3N.2', formatVersion: r.format, exportTimestamp: r.timestamp },
    ...r,
    validation: { allChecksPassed: true, checks },
  };
}

export async function buildLadderGrammarAccessBundle(result: LadderGrammarAccessEditResult): Promise<Uint8Array> {
  const artifact = await createMK1LadderGrammarAccessEditExport(result);
  const qualification = await createMK1SinglePlayerLadderGrammarExport(result.qualification);
  const encoder = new TextEncoder();
  const token = result.report.requestedToken;
  const selectedNotes = token >= 16
    ? result.report.predictedEndurancePairs.map(pair => `Selected fighter ID ${pair.selectedPlayableCharacterId}: opponents ${pair.firstCharacterId} + ${pair.secondCharacterId}`).join('\n')
    : 'Token 15 is the verified TEST YOUR MIGHT event marker.';
  const instructions = `MK1 SINGLE-PLAYER LADDER GRAMMAR ACCESS — Pass 1E.3N.2\n\nSTATIC BYTE VALIDATION PASSED. RUNTIME RESULT NOT YET OBSERVED.\n\nThis bundle changes only the first byte of the four original single-player ladder maps. No combat, AI, damage, rendering, fighter initialization, or stage-selection code is modified.\n\nRequested token: ${token} (0x${token.toString(16).toUpperCase()}) — ${result.report.requestedKind}\n\n${selectedNotes}\n\n1. Use a separate copy of your complete untouched MK1 installation.\n2. Replace MK1.EXE with the one in this ZIP.\n3. Start ONE PLAYER and select a normal fighter.\n4. Record the first event/encounter and whether progression initializes normally.\n5. For endurance tokens, record both opponents in order.\n6. Capture a screenshot if useful.\n7. Restore the original MK1.EXE afterwards.\n\nOriginal SHA-256: ${result.report.evidence.originalExeSha256}\nEdited SHA-256: ${result.report.evidence.editedExeSha256}\nChanged bytes: ${result.report.evidence.changedByteCount}\nOffsets: ${result.report.edits.map(edit => edit.physicalOffsetHex).join(', ')}\nReversal restores original: ${result.report.evidence.reverseRestoresOriginal}\n`;
  return buildStoredZip([
    { name: 'MK1.EXE', bytes: result.editedExe },
    { name: 'mk1_ladder_grammar_access_edit.json', bytes: encoder.encode(JSON.stringify(artifact, null, 2)) },
    { name: 'mk1_single_player_ladder_grammar.json', bytes: encoder.encode(JSON.stringify(qualification, null, 2)) },
    { name: 'READ_ME_FIRST.txt', bytes: encoder.encode(instructions) },
  ]);
}
