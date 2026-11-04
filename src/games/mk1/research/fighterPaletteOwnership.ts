/**
 * MK1 fighter palette ownership scaffold — Pass 1E.3L.
 *
 * Bounded question:
 *   Can the already-verified NORMAL/ALTERNATE palette tables be promoted from
 *   a Kano-only observation into a complete nine-slot census, and can the
 *   table index be tied mechanically to P1_CHAR/P2_CHAR without assuming
 *   fighter names from external documentation?
 *
 * This pass deliberately stops before claiming runtime ownership for every
 * slot. It establishes the slot mechanism and preserves a mechanically
 * discovered roster-name alignment as corroborating evidence for targeted
 * follow-up tests.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import {
  createMK1KanoPaletteSelectionReferenceGraphExport,
} from './kanoPaletteSelectionReferenceGraph';
import { MK1KanoPaletteSelectionReferenceGraphReport } from './kanoPaletteSelectionReferenceGraphTypes';
import {
  createMK1KanoPaletteSelectionSemanticsExport,
} from './kanoPaletteSelectionSemantics';
import { MK1KanoPaletteSelectionSemanticsReport } from './kanoPaletteSelectionSemanticsTypes';
import { createMK1PaletteRoundTripExport, PaletteRoundTripReport } from './paletteRoundTrip';
import { sha256Bytes } from './paletteRoundTripCodec';

const REG32 = ['EAX', 'ECX', 'EDX', 'EBX', 'ESP', 'EBP', 'ESI', 'EDI'] as const;

function toHex32(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
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
  return readU32(bytes, offset) | 0;
}

function bytesHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

export interface FighterPaletteSlotEvidence {
  slotIndex: number;
  rosterName: string | null;
  normal: {
    rawValue: number;
    rawValueHex: string;
    recordIndex: number;
    symbolNames: string[];
    physicalStart: number;
    physicalStartHex: string;
    declaredLength: number;
  };
  alternate: {
    rawValue: number;
    rawValueHex: string;
    recordIndex: number;
    symbolNames: string[];
    physicalStart: number;
    physicalStartHex: string;
    declaredLength: number;
  };
  sameRecordForNormalAndAlternate: boolean;
  classification: 'VERIFIED_TABLE_SLOT_PAIR';
}

export interface CharacterIdentityFieldEvidence {
  fieldOffset: number;
  fieldOffsetHex: string;
  p1CharOffset: number;
  p1CharOffsetHex: string;
  p2CharOffset: number;
  p2CharOffsetHex: string;
  p1DirectLoadCallSites: Array<{ physicalOffset: number; physicalOffsetHex: string; callTarget: number; callTargetHex: string }>;
  p2DirectLoadCallSites: Array<{ physicalOffset: number; physicalOffsetHex: string; callTarget: number; callTargetHex: string }>;
  p1WrapperTarget: number | null;
  p1WrapperTargetHex: string | null;
  p2WrapperTarget: number | null;
  p2WrapperTargetHex: string | null;
  commonInitTarget: number | null;
  commonInitTargetHex: string | null;
  preservedEaxStorePhysical: number | null;
  preservedEaxStorePhysicalHex: string | null;
  preservedEaxStoreBytesHex: string | null;
  established: boolean;
  classification: 'VERIFIED_PCHAR_TO_OBJECT_TABLE_INDEX' | 'PARTIAL_PCHAR_TO_OBJECT_TABLE_INDEX';
}

export interface RosterNamePointerRunEvidence {
  physicalStart: number;
  physicalStartHex: string;
  watcomStart: number;
  watcomStartHex: string;
  entryCount: number;
  entries: Array<{
    slotIndex: number;
    pointerValue: number;
    pointerValueHex: string;
    targetPhysical: number;
    targetPhysicalHex: string;
    text: string;
  }>;
  targetPhysicalSpan: number;
  uniqueMaximalRun: boolean;
  indexedDwordUseSites: Array<{
    physicalOffset: number;
    physicalOffsetHex: string;
    destinationRegister: string;
    indexRegister: string;
    bytesHex: string;
  }>;
  classification: 'CORROBORATING_ROSTER_NAME_INDEX_RUN';
}

export interface MK1FighterPaletteOwnershipReport {
  format: 'mk1_fighter_palette_ownership_v1';
  timestamp: string;
  operationId: string;
  provenance: PaletteRoundTripReport['provenance'];
  fixture: { exePath: string; exeSize: number; exeSizeHex: string };
  prerequisite: {
    graphPass: '1E.3E';
    graphOperationId: string;
    semanticsPass: '1E.3F';
    semanticsOperationId: string;
    roundTripPass: '1E.3H';
    roundTripOperationId: string;
    validationPassed: boolean;
  };
  tables: {
    normalSymbol: string;
    alternateSymbol: string;
    normalWatcomOffset: number;
    normalWatcomOffsetHex: string;
    alternateWatcomOffset: number;
    alternateWatcomOffsetHex: string;
    slotCount: number;
  };
  characterIdentityField: CharacterIdentityFieldEvidence;
  rosterNamePointerRun: RosterNamePointerRunEvidence | null;
  slots: FighterPaletteSlotEvidence[];
  decision: {
    completeNineSlotCensusEstablished: boolean;
    paletteTableIndexIsCharacterIdentity: boolean;
    rosterNameAlignmentCount: number;
    firstNonKanoRuntimeTarget: {
      slotIndex: number;
      rosterName: string | null;
      normalSymbolNames: string[];
      alternateSymbolNames: string[];
    } | null;
    allFighterRuntimeOwnershipEstablished: false;
    verdict: 'FIGHTER_PALETTE_SLOT_OWNERSHIP_SCAFFOLD_ESTABLISHED' | 'PARTIAL_FIGHTER_PALETTE_OWNERSHIP';
    narrative: string;
  };
  status: 'SUCCESS' | 'PARTIAL';
}

function findMovAbsoluteEaxThenCall(
  bytes: Uint8Array,
  start: number,
  end: number,
  absoluteOffset: number,
): Array<{ physicalOffset: number; physicalOffsetHex: string; callTarget: number; callTargetHex: string }> {
  const out: Array<{ physicalOffset: number; physicalOffsetHex: string; callTarget: number; callTargetHex: string }> = [];
  for (let p = Math.max(0, start); p + 10 <= Math.min(bytes.length, end); p++) {
    if (bytes[p] !== 0xa1 || readU32(bytes, p + 1) !== absoluteOffset || bytes[p + 5] !== 0xe8) continue;
    const target = p + 10 + readI32(bytes, p + 6);
    out.push({ physicalOffset: p, physicalOffsetHex: toHex32(p), callTarget: target, callTargetHex: toHex32(target) });
  }
  return out;
}

/**
 * P1_INIT / P2_INIT fixture shape: push absolute; mov ecx,imm32; mov ebx,imm32; call rel32.
 * None of the pre-call instructions alter EAX, so the P*_CHAR value remains live into the common initializer.
 */
function preservedEaxWrapperCall(bytes: Uint8Array, target: number): number | null {
  if (target < 0 || target + 21 > bytes.length) return null;
  if (
    bytes[target] !== 0xff || bytes[target + 1] !== 0x35 ||
    bytes[target + 6] !== 0xb9 || bytes[target + 11] !== 0xbb || bytes[target + 16] !== 0xe8
  ) return null;
  return target + 21 + readI32(bytes, target + 17);
}

function findPreservedEaxStore(bytes: Uint8Array, target: number, fieldOffset: number): { offset: number; bytesHex: string } | null {
  const end = Math.min(bytes.length, target + 128);
  // Fixture shape restores the original pushed EAX immediately before storing it into the object field.
  for (let p = target; p + 5 <= end; p++) {
    if (bytes[p] === 0x5b && bytes[p + 1] === 0x58 && bytes[p + 2] === 0x89 && bytes[p + 3] === 0x47 && bytes[p + 4] === fieldOffset) {
      return { offset: p, bytesHex: bytesHex(bytes.slice(p, p + 5)) };
    }
  }
  return null;
}

function buildCharacterIdentityFieldEvidence(
  bytes: Uint8Array,
  codeStart: number,
  codeEnd: number,
  semantics: MK1KanoPaletteSelectionSemanticsReport,
): CharacterIdentityFieldEvidence {
  const sm = semantics.selectionStateMachine;
  if (!sm) throw new Error('1E.3L requires the verified 1E.3F selection state machine');
  const p1Sites = findMovAbsoluteEaxThenCall(bytes, codeStart, codeEnd, sm.p1CharOffset);
  const p2Sites = findMovAbsoluteEaxThenCall(bytes, codeStart, codeEnd, sm.p2CharOffset);
  const p1Targets = Array.from(new Set(p1Sites.map(site => site.callTarget)));
  const p2Targets = Array.from(new Set(p2Sites.map(site => site.callTarget)));
  const p1WrapperTarget = p1Targets.length === 1 ? p1Targets[0] : null;
  const p2WrapperTarget = p2Targets.length === 1 ? p2Targets[0] : null;
  const p1Common = p1WrapperTarget === null ? null : preservedEaxWrapperCall(bytes, p1WrapperTarget);
  const p2Common = p2WrapperTarget === null ? null : preservedEaxWrapperCall(bytes, p2WrapperTarget);
  const commonInitTarget = p1Common !== null && p1Common === p2Common ? p1Common : null;
  const store = commonInitTarget === null ? null : findPreservedEaxStore(bytes, commonInitTarget, sm.tableIndexObjectFieldOffset);
  const established = p1Sites.length > 0 && p2Sites.length > 0 && p1WrapperTarget !== null && p2WrapperTarget !== null
    && commonInitTarget !== null && store !== null;
  return {
    fieldOffset: sm.tableIndexObjectFieldOffset,
    fieldOffsetHex: sm.tableIndexObjectFieldOffsetHex,
    p1CharOffset: sm.p1CharOffset,
    p1CharOffsetHex: sm.p1CharOffsetHex,
    p2CharOffset: sm.p2CharOffset,
    p2CharOffsetHex: sm.p2CharOffsetHex,
    p1DirectLoadCallSites: p1Sites,
    p2DirectLoadCallSites: p2Sites,
    p1WrapperTarget,
    p1WrapperTargetHex: p1WrapperTarget === null ? null : toHex32(p1WrapperTarget),
    p2WrapperTarget,
    p2WrapperTargetHex: p2WrapperTarget === null ? null : toHex32(p2WrapperTarget),
    commonInitTarget,
    commonInitTargetHex: commonInitTarget === null ? null : toHex32(commonInitTarget),
    preservedEaxStorePhysical: store?.offset ?? null,
    preservedEaxStorePhysicalHex: store ? toHex32(store.offset) : null,
    preservedEaxStoreBytesHex: store?.bytesHex ?? null,
    established,
    classification: established ? 'VERIFIED_PCHAR_TO_OBJECT_TABLE_INDEX' : 'PARTIAL_PCHAR_TO_OBJECT_TABLE_INDEX',
  };
}

function readUpperName(bytes: Uint8Array, physicalOffset: number, limitEnd: number): string | null {
  if (physicalOffset < 0 || physicalOffset >= limitEnd || physicalOffset >= bytes.length) return null;
  const chars: number[] = [];
  for (let i = 0; i <= 16 && physicalOffset + i < limitEnd && physicalOffset + i < bytes.length; i++) {
    const value = bytes[physicalOffset + i];
    if (value === 0) {
      if (chars.length < 3) return null;
      const text = String.fromCharCode(...chars);
      return /^(?=.*[A-Z])[A-Z -]{3,16}$/.test(text) ? text : null;
    }
    chars.push(value);
  }
  return null;
}

function findIndexedDwordUses(bytes: Uint8Array, start: number, end: number, displacement: number) {
  const out: RosterNamePointerRunEvidence['indexedDwordUseSites'] = [];
  for (let p = Math.max(0, start); p + 7 <= Math.min(bytes.length, end); p++) {
    if (bytes[p] !== 0x8b) continue;
    const modrm = bytes[p + 1];
    const sib = bytes[p + 2];
    // MOV r32,[index*4+disp32]: mod=00, r/m=SIB; scale=4, base=disp32-only.
    if ((modrm & 0xc7) !== 0x04 || (sib & 0xc7) !== 0x85 || readU32(bytes, p + 3) !== displacement) continue;
    out.push({
      physicalOffset: p,
      physicalOffsetHex: toHex32(p),
      destinationRegister: REG32[(modrm >>> 3) & 7],
      indexRegister: REG32[(sib >>> 3) & 7],
      bytesHex: bytesHex(bytes.slice(p, p + 7)),
    });
  }
  return out;
}

function discoverRosterNamePointerRun(
  bytes: Uint8Array,
  staticDataBase: number,
  scanEnd: number,
  codeStart: number,
  codeEnd: number,
): RosterNamePointerRunEvidence | null {
  const candidates: Array<{
    physicalStart: number;
    watcomStart: number;
    entries: RosterNamePointerRunEvidence['entries'];
    targetPhysicalSpan: number;
  }> = [];

  const firstAligned = staticDataBase + ((4 - (staticDataBase & 3)) & 3);
  for (let p = firstAligned; p + 8 <= scanEnd; p += 4) {
    const entries: RosterNamePointerRunEvidence['entries'] = [];
    const seen = new Set<string>();
    let q = p;
    while (q + 4 <= scanEnd && entries.length < 16) {
      const pointerValue = readU32(bytes, q);
      const targetPhysical = staticDataBase + pointerValue;
      if (targetPhysical < staticDataBase || targetPhysical >= scanEnd) break;
      const text = readUpperName(bytes, targetPhysical, scanEnd);
      if (!text || seen.has(text)) break;
      seen.add(text);
      entries.push({
        slotIndex: entries.length,
        pointerValue,
        pointerValueHex: toHex32(pointerValue),
        targetPhysical,
        targetPhysicalHex: toHex32(targetPhysical),
        text,
      });
      q += 4;
    }
    if (entries.length < 2) continue;
    const targets = entries.map(entry => entry.targetPhysical);
    const span = Math.max(...targets) - Math.min(...targets);
    if (span > 128) continue;
    candidates.push({ physicalStart: p, watcomStart: p - staticDataBase, entries, targetPhysicalSpan: span });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.entries.length - a.entries.length || a.physicalStart - b.physicalStart);
  const best = candidates[0];
  const sameLength = candidates.filter(candidate => candidate.entries.length === best.entries.length);
  const uniqueMaximalRun = sameLength.length === 1;
  const indexedDwordUseSites = findIndexedDwordUses(bytes, codeStart, codeEnd, best.watcomStart);
  return {
    physicalStart: best.physicalStart,
    physicalStartHex: toHex32(best.physicalStart),
    watcomStart: best.watcomStart,
    watcomStartHex: toHex32(best.watcomStart),
    entryCount: best.entries.length,
    entries: best.entries,
    targetPhysicalSpan: best.targetPhysicalSpan,
    uniqueMaximalRun,
    indexedDwordUseSites,
    classification: 'CORROBORATING_ROSTER_NAME_INDEX_RUN',
  };
}

export async function executeFighterPaletteOwnershipQualification(
  source: DirectorySource,
  options: {
    referenceGraphReport: MK1KanoPaletteSelectionReferenceGraphReport;
    selectionSemanticsReport: MK1KanoPaletteSelectionSemanticsReport;
    roundTripReport: PaletteRoundTripReport;
  },
): Promise<MK1FighterPaletteOwnershipReport> {
  if (source.isSynthetic !== false) throw new Error('1E.3L requires an authentic user-loaded directory');
  const graphExport = createMK1KanoPaletteSelectionReferenceGraphExport(options.referenceGraphReport);
  const semanticsExport = createMK1KanoPaletteSelectionSemanticsExport(options.selectionSemanticsReport);
  const roundTripExport = await createMK1PaletteRoundTripExport(options.roundTripReport);
  if (!graphExport.validation.allChecksPassed || !semanticsExport.validation.allChecksPassed || !roundTripExport.validation.allChecksPassed) {
    throw new Error('1E.3L prerequisite validation failed');
  }
  const baseline = options.roundTripReport;
  if (baseline.provenance.sha256 !== options.referenceGraphReport.provenance.sha256
      || baseline.provenance.sha256 !== options.selectionSemanticsReport.provenance.sha256) {
    throw new Error('1E.3L prerequisites identify different executables');
  }
  const pair = options.referenceGraphReport.pairedPaletteTableRelationship;
  const normal = options.referenceGraphReport.containingReferenceTables.find(table => table.symbol.symbolName === 'NORMAL_PALETTES');
  const alternate = options.referenceGraphReport.containingReferenceTables.find(table => table.symbol.symbolName === 'ALTERNATE_PALETTES');
  if (!pair || pair.classification !== 'VERIFIED_PARALLEL_PALETTE_TABLES' || !normal || !alternate) {
    throw new Error('1E.3L requires verified NORMAL_PALETTES and ALTERNATE_PALETTES');
  }
  if (normal.dwordCount !== alternate.dwordCount || normal.dwordCount !== 9 || !normal.allEntriesVerifiedPaletteStarts || !alternate.allEntriesVerifiedPaletteStarts) {
    throw new Error('1E.3L requires the verified nine-slot all-palette table pair');
  }

  const files = await source.listRecursive();
  const file = files.find(entry => entry.path === baseline.provenance.fileName);
  if (!file || file.size !== baseline.provenance.byteLength) throw new Error('1E.3L executable path/size no longer matches 1E.3H');
  const bytes = await source.readSlice(file.path, 0, file.size);
  if (bytes.length !== file.size || await sha256Bytes(bytes) !== baseline.provenance.sha256) throw new Error('1E.3L executable SHA-256 no longer matches 1E.3H');

  const codeBase = options.selectionSemanticsReport.codeImageBaseQualification.qualifiedBase;
  if (codeBase === null) throw new Error('1E.3L requires the qualified Segment-1 code file-image base');
  const staticDataBase = baseline.module.staticDataBase;
  const characterIdentityField = buildCharacterIdentityFieldEvidence(bytes, codeBase, staticDataBase, options.selectionSemanticsReport);
  const rosterNamePointerRun = discoverRosterNamePointerRun(bytes, staticDataBase, baseline.module.physicalStart, codeBase, staticDataBase);

  const slots: FighterPaletteSlotEvidence[] = normal.entries.map((normalEntry, slotIndex) => {
    const alternateEntry = alternate.entries[slotIndex];
    if (!alternateEntry || normalEntry.paletteRecordIndex === null || alternateEntry.paletteRecordIndex === null) {
      throw new Error(`1E.3L slot ${slotIndex} is not backed by two verified palette records`);
    }
    const normalRecord = baseline.groundTruthRecords[normalEntry.paletteRecordIndex];
    const alternateRecord = baseline.groundTruthRecords[alternateEntry.paletteRecordIndex];
    if (!normalRecord || !alternateRecord || normalRecord.declaredLength !== 23 || alternateRecord.declaredLength !== 23) {
      throw new Error(`1E.3L slot ${slotIndex} does not resolve to qualified 23-color records`);
    }
    return {
      slotIndex,
      rosterName: rosterNamePointerRun?.entries[slotIndex]?.text ?? null,
      normal: {
        rawValue: normalEntry.rawValue,
        rawValueHex: normalEntry.rawValueHex,
        recordIndex: normalEntry.paletteRecordIndex,
        symbolNames: [...normalEntry.paletteSymbolNames],
        physicalStart: normalRecord.physicalStart,
        physicalStartHex: toHex32(normalRecord.physicalStart),
        declaredLength: normalRecord.declaredLength,
      },
      alternate: {
        rawValue: alternateEntry.rawValue,
        rawValueHex: alternateEntry.rawValueHex,
        recordIndex: alternateEntry.paletteRecordIndex,
        symbolNames: [...alternateEntry.paletteSymbolNames],
        physicalStart: alternateRecord.physicalStart,
        physicalStartHex: toHex32(alternateRecord.physicalStart),
        declaredLength: alternateRecord.declaredLength,
      },
      sameRecordForNormalAndAlternate: normalEntry.rawValue === alternateEntry.rawValue,
      classification: 'VERIFIED_TABLE_SLOT_PAIR' as const,
    };
  });

  const completeNineSlotCensusEstablished = slots.length === 9 && slots.every(slot => slot.normal.declaredLength === 23 && slot.alternate.declaredLength === 23);
  const rosterNameAlignmentCount = slots.filter(slot => slot.rosterName !== null).length;
  const rosterEvidencePassed = Boolean(rosterNamePointerRun?.uniqueMaximalRun && rosterNamePointerRun.entryCount >= 5 && rosterNamePointerRun.indexedDwordUseSites.length > 0);
  const success = completeNineSlotCensusEstablished && characterIdentityField.established && rosterEvidencePassed;
  const operationId = createOperationId('fighter_palette_ownership');
  const timestamp = new Date().toISOString();
  return {
    format: 'mk1_fighter_palette_ownership_v1',
    timestamp,
    operationId,
    provenance: { ...baseline.provenance, timestamp, operationId },
    fixture: { exePath: baseline.provenance.fileName, exeSize: baseline.provenance.byteLength, exeSizeHex: toHex32(baseline.provenance.byteLength) },
    prerequisite: {
      graphPass: '1E.3E', graphOperationId: options.referenceGraphReport.operationId,
      semanticsPass: '1E.3F', semanticsOperationId: options.selectionSemanticsReport.operationId,
      roundTripPass: '1E.3H', roundTripOperationId: baseline.operationId,
      validationPassed: true,
    },
    tables: {
      normalSymbol: normal.symbol.symbolName,
      alternateSymbol: alternate.symbol.symbolName,
      normalWatcomOffset: normal.symbol.startOffset,
      normalWatcomOffsetHex: normal.symbol.startOffsetHex,
      alternateWatcomOffset: alternate.symbol.startOffset,
      alternateWatcomOffsetHex: alternate.symbol.startOffsetHex,
      slotCount: slots.length,
    },
    characterIdentityField,
    rosterNamePointerRun,
    slots,
    decision: {
      completeNineSlotCensusEstablished,
      paletteTableIndexIsCharacterIdentity: characterIdentityField.established,
      rosterNameAlignmentCount,
      firstNonKanoRuntimeTarget: slots[0] ? {
        slotIndex: slots[0].slotIndex,
        rosterName: slots[0].rosterName,
        normalSymbolNames: [...slots[0].normal.symbolNames],
        alternateSymbolNames: [...slots[0].alternate.symbolNames],
      } : null,
      allFighterRuntimeOwnershipEstablished: false,
      verdict: success ? 'FIGHTER_PALETTE_SLOT_OWNERSHIP_SCAFFOLD_ESTABLISHED' : 'PARTIAL_FIGHTER_PALETTE_OWNERSHIP',
      narrative: success
        ? 'The verified nine-slot NORMAL/ALTERNATE palette pair is fully enumerated. P1_CHAR and P2_CHAR are passed in EAX through separate wrappers into one common initializer that restores the original EAX and stores it into the same object field later used as the palette-table index, mechanically tying the palette-table index to character identity. A unique maximal static-data pointer run resolves to indexed uppercase roster names and aligns with the first palette slots. Runtime ownership beyond the already tested Kano slot remains intentionally pending; slot 0 is the next bounded non-Kano test.'
        : 'The pair census was produced, but one or more character-index or roster-alignment invariants did not qualify. Do not generalize fighter palette ownership.',
    },
    status: success ? 'SUCCESS' : 'PARTIAL',
  };
}

export async function createMK1FighterPaletteOwnershipExport(report: MK1FighterPaletteOwnershipReport) {
  const checks = [
    { checkId: 'PROVENANCE_REAL_USER_LOADED', passed: report.provenance.sourceKind === 'user-loaded-directory' && report.provenance.synthetic === false && report.provenance.artifactGeneratedByTest === false && typeof report.provenance.sha256 === 'string' && /^[0-9a-f]{64}$/.test(report.provenance.sha256) && !/^0{64}$/.test(report.provenance.sha256) },
    { checkId: 'OPERATION_ID_CONSISTENT', passed: report.operationId.startsWith('fighter_palette_ownership-') && report.operationId === report.provenance.operationId },
    { checkId: 'PREREQUISITES_VALIDATED', passed: report.prerequisite.validationPassed === true },
    { checkId: 'NINE_SLOT_TABLE_CENSUS', passed: report.tables.slotCount === 9 && report.slots.length === 9 && report.slots.every(slot => slot.classification === 'VERIFIED_TABLE_SLOT_PAIR') },
    { checkId: 'ALL_SLOT_RECORDS_23_COLORS', passed: report.slots.every(slot => slot.normal.declaredLength === 23 && slot.alternate.declaredLength === 23) },
    { checkId: 'PCHAR_TO_TABLE_INDEX_ESTABLISHED', passed: report.characterIdentityField.established && report.characterIdentityField.classification === 'VERIFIED_PCHAR_TO_OBJECT_TABLE_INDEX' },
    { checkId: 'ROSTER_NAME_RUN_CORROBORATES_SLOT_ORDER', passed: Boolean(report.rosterNamePointerRun?.uniqueMaximalRun && report.rosterNamePointerRun.entryCount >= 5 && report.rosterNamePointerRun.indexedDwordUseSites.length > 0) },
    { checkId: 'RUNTIME_GENERALIZATION_NOT_CLAIMED', passed: report.decision.allFighterRuntimeOwnershipEstablished === false },
  ];
  if (report.status !== 'SUCCESS' || report.decision.verdict !== 'FIGHTER_PALETTE_SLOT_OWNERSHIP_SCAFFOLD_ESTABLISHED' || !checks.every(check => check.passed)) {
    throw new Error(`Authoritative 1E.3L export blocked: ${checks.filter(check => !check.passed).map(check => check.checkId).join(', ') || report.status}`);
  }
  return {
    metadata: { name: 'MK1 Fighter Palette Ownership Scaffold', version: '1.0.0', milestone: 'Pass 1E.3L', formatVersion: report.format, exportTimestamp: report.timestamp },
    ...report,
    validation: { allChecksPassed: true, checks },
  };
}
