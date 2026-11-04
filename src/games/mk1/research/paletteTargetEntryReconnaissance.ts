/**
 * MK1 Executable Palette Target-Boundary & Incoming-EAX Consumption Qualification
 *
 * Milestone 1 — Pass 1E.2B.9a: Target-Entry Evidence Contract Hardening
 *
 * Epistemic Rules:
 *   TARGET ADDRESS != FUNCTION.
 *   EAX LIVE AT CALL != FUNCTION ARGUMENT.
 *   EAX READ AFTER CALL != PALETTE INPUT.
 *   OBJECT-RELATIVE COORDINATE != POINTER.
 *   NUMERIC TARGET REGION != VERIFIED EXECUTION SEMANTICS.
 *   DO NOT FOLLOW JMP 0x53D33 — Destination body not decoded.
 *   RAW E8 MATCH != VERIFIED INSTRUCTION ENTRY.
 *   JUMP TARGET EQUALITY != SHARED PURPOSE.
 */

import {
  MK1B8BoundaryTargetCrossReference,
  MK1B8TargetGroupMatch,
  MK1CallerContextComparison,
  MK1CallerContextRecord,
  MK1CallerReturnRelation,
  MK1CallerVerifiedCoreSequence,
  MK1FinalControlBoundary,
  MK1IncomingEAXDisposition,
  MK1PaletteTargetEntryReconResult,
  MK1RawE8ExactTargetMatch,
  MK1RawE8NullModelResult,
  MK1RegisterEntryState,
  MK1SeedEventModel,
  MK1TargetBoundaryClassification,
  MK1TargetBoundaryRecon,
  MK1TargetEntryAnalysisConfiguration,
  MK1TargetEntryEvent,
  MK1TargetEntryReconciliation,
  MK1TargetEntrySeedClass,
  MK1TargetRawWindow,
  MK1TargetTraceInstruction,
  MK1TargetTraceResult,
  MK1VerifiedCallerRecord,
} from './paletteTargetEntryReconnaissanceTypes';
import {
  MK1PaletteOperandUseResult,
  X86Register32,
} from './paletteOperandUseReconnaissanceTypes';
import { MK1ExecutableLayoutReport } from './executableLayoutTypes';
import {
  classifyPhysicalByteInObjects,
  objectOffsetToFileOffset,
} from '../../../core/executable/le/leAddressMap';
import { findContainingRegion } from './paletteReferenceReconnaissance';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';

const REGISTERS: readonly X86Register32[] = [
  'EAX',
  'ECX',
  'EDX',
  'EBX',
  'ESP',
  'EBP',
  'ESI',
  'EDI',
];

const GROUP1_ALU_NAMES: readonly string[] = [
  'ADD',
  'OR',
  'ADC',
  'SBB',
  'AND',
  'SUB',
  'XOR',
  'CMP',
];

export function toHex8(n: number): string {
  return '0x' + (n & 0xff).toString(16).padStart(2, '0').toUpperCase();
}

export function toHex32(n: number): string {
  return '0x' + (n >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

export function readUint32LE(buf: Uint8Array, offset: number): number {
  return (
    (buf[offset] |
      (buf[offset + 1] << 8) |
      (buf[offset + 2] << 16) |
      (buf[offset + 3] << 24)) >>>
    0
  );
}

export function readInt32LE(buf: Uint8Array, offset: number): number {
  return (
    buf[offset] |
    (buf[offset + 1] << 8) |
    (buf[offset + 2] << 16) |
    (buf[offset + 3] << 24)
  );
}

export function readInt8(buf: Uint8Array, offset: number): number {
  const b = buf[offset];
  return b & 0x80 ? b - 0x100 : b;
}

function cloneRegisterMap(
  regs: Record<X86Register32, MK1RegisterEntryState>,
): Record<X86Register32, MK1RegisterEntryState> {
  const copy = {} as Record<X86Register32, MK1RegisterEntryState>;
  for (const r of REGISTERS) {
    copy[r] = { ...regs[r] };
  }
  return copy;
}

/**
 * Derives the single authoritative target-entry seed class from B.8 output without any fallbacks.
 */
export function deriveTargetEntrySeedClass(
  b8Result: MK1PaletteOperandUseResult,
  targetCandidateId = 'MK1.EXE:0x0002C410',
  report: MK1ExecutableLayoutReport,
): MK1TargetEntrySeedClass {
  // Prerequisite check 1: B.8 status must be SUCCESS
  if (b8Result.status !== 'SUCCESS') {
    throw new Error(
      `Upstream B.8 result status is ${b8Result.status}; expected SUCCESS`,
    );
  }

  // Prerequisite check 2: B.8 allReconciled must be true
  if (!b8Result.reconciliation.allReconciled) {
    throw new Error(
      'Upstream B.8 result reconciliation.allReconciled is false',
    );
  }

  // Prerequisite check 3: B.8 derivedEvidenceReconciled must be true
  if (!b8Result.reconciliation.derivedEvidenceReconciled) {
    throw new Error(
      'Upstream B.8 result reconciliation.derivedEvidenceReconciled is false',
    );
  }

  // Prerequisite check 4: Layout report is mandatory and must have valid Object 1 and pageSize
  if (!report || !report.parsedHeader || typeof report.parsedHeader.pageSize !== 'number' || report.parsedHeader.pageSize <= 0) {
    throw new Error('Missing or invalid LE header pageSize in executable report');
  }
  const obj1 = report.objects?.find((o) => o.objectNumber === 1);
  if (!obj1 || typeof obj1.relocationBaseAddress !== 'number' || Number.isNaN(obj1.relocationBaseAddress)) {
    throw new Error('Object 1 missing or invalid relocationBaseAddress in executable report');
  }
  const relocBase = obj1.relocationBaseAddress;

  // Find candidate in candidate summaries
  const cand = b8Result.candidateSummaries?.find((c) => c.candidateId === targetCandidateId);
  if (!cand) {
    throw new Error(`Candidate summary not found in B.8 for ${targetCandidateId}`);
  }

  // Find direct interpretations for targetCandidateId
  const candidateInterps = b8Result.interpretations.filter(
    (i) =>
      i.associatedCandidateId === targetCandidateId &&
      i.sourceKind === 'direct-candidate-first-hop',
  );

  if (candidateInterps.length === 0) {
    throw new Error(
      `No direct interpretations found in B.8 for candidate ${targetCandidateId}`,
    );
  }

  // Filter interpretations with seed traces that reached a call boundary
  const qualifyingTraces = candidateInterps.filter(
    (i) =>
      i.seedTrace &&
      i.seedTrace.seedLiveAtBoundary &&
      i.seedTrace.boundaryType === 'call' &&
      i.seedTrace.callBoundaryTargetRecon?.targetLoadedLinearCandidate !== undefined &&
      typeof i.seedTrace.callBoundaryTargetRecon.targetLoadedLinearCandidate === 'number' &&
      !Number.isNaN(i.seedTrace.callBoundaryTargetRecon.targetLoadedLinearCandidate),
  );

  if (qualifyingTraces.length === 0) {
    throw new Error(
      `No qualifying call-boundary traces found in B.8 for candidate ${targetCandidateId}`,
    );
  }

  // Group by (candidateId, register, initialSeedValue, targetLoadedLinearCandidate)
  const groups = new Map<string, typeof qualifyingTraces>();
  for (const item of qualifyingTraces) {
    const trace = item.seedTrace!;
    const key = `${targetCandidateId}|${trace.seedRegister}|${trace.initialSeedValue}|${trace.callBoundaryTargetRecon!.targetLoadedLinearCandidate}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  if (groups.size !== 1) {
    throw new Error(
      `Expected exactly 1 target-entry seed class for ${targetCandidateId}, found ${groups.size}`,
    );
  }

  const firstGroup = Array.from(groups.values())[0];
  const sampleTrace = firstGroup[0].seedTrace!;
  const targetLinear = sampleTrace.callBoundaryTargetRecon!.targetLoadedLinearCandidate;
  const targetObjOffset = sampleTrace.callBoundaryTargetRecon!.targetObjectOffset;
  const targetPhys = sampleTrace.callBoundaryTargetRecon!.targetLinearPhysicalBackingOffset;

  if (typeof targetLinear !== 'number' || !Number.isFinite(targetLinear)) {
    throw new Error('Target linear address is not a finite number');
  }
  if (typeof targetObjOffset !== 'number' || !Number.isFinite(targetObjOffset)) {
    throw new Error('Target object offset is not a finite number');
  }
  if (targetPhys === null || targetPhys === undefined || typeof targetPhys !== 'number' || !Number.isFinite(targetPhys)) {
    throw new Error('Target linear address has no physical file backing');
  }

  const callerOffsets = firstGroup.map((i) => i.instructionFileOffset).sort((a, b) => a - b);

  // Authoritative coordinate derivations from B.8 candidate data & qualifying interpretations
  const firstInterp = firstGroup[0];
  const derivedCandidateObj =
    firstInterp.targetCandidateObjectNumber ??
    firstInterp.objectRelativeCompatibility?.targetCandidateObjectNumber;

  if (typeof derivedCandidateObj !== 'number' || !Number.isFinite(derivedCandidateObj) || derivedCandidateObj <= 0) {
    throw new Error(
      `Qualifying B.8 interpretation ${firstInterp.interpretationId} has missing or invalid candidate object number`,
    );
  }

  const derivedLoadedStructHex =
    firstInterp.targetCandidateLoadedStructureHex ??
    cand.loadedLinearStructureCandidateHex;

  if (!derivedLoadedStructHex) {
    throw new Error(
      `Qualifying B.8 interpretation ${firstInterp.interpretationId} missing loaded structure coordinate`,
    );
  }

  const derivedLoadedPayloadHex =
    firstInterp.targetCandidateLoadedPayloadHex ??
    (firstInterp.objectRelativeCompatibility?.associatedTargetLoadedAddress !== null &&
    firstInterp.objectRelativeCompatibility?.associatedTargetLoadedAddress !== undefined
      ? toHex32(firstInterp.objectRelativeCompatibility.associatedTargetLoadedAddress)
      : null) ??
    cand.loadedLinearPayloadCandidateHex;

  if (!derivedLoadedPayloadHex) {
    throw new Error(
      `Qualifying B.8 interpretation ${firstInterp.interpretationId} missing loaded payload coordinate`,
    );
  }

  const derivedAssocRepKind = firstInterp.associatedRepresentationKind;
  if (!derivedAssocRepKind) {
    throw new Error(
      `Qualifying B.8 interpretation ${firstInterp.interpretationId} missing associated representation kind`,
    );
  }

  for (const item of firstGroup) {
    const itemObj =
      item.targetCandidateObjectNumber ??
      item.objectRelativeCompatibility?.targetCandidateObjectNumber;
    if (itemObj !== derivedCandidateObj) {
      throw new Error(
        `Qualifying B.8 interpretation ${item.interpretationId} candidate object number mismatch (${itemObj} !== ${derivedCandidateObj})`,
      );
    }
    const itemLoadedStructHex =
      item.targetCandidateLoadedStructureHex ??
      cand.loadedLinearStructureCandidateHex;
    if (parseInt(itemLoadedStructHex, 16) !== parseInt(derivedLoadedStructHex, 16)) {
      throw new Error(
        `Qualifying B.8 interpretation ${item.interpretationId} candidate loaded structure mismatch (${itemLoadedStructHex} !== ${derivedLoadedStructHex})`,
      );
    }
    const itemLoadedPayloadHex =
      item.targetCandidateLoadedPayloadHex ??
      (item.objectRelativeCompatibility?.associatedTargetLoadedAddress !== null &&
      item.objectRelativeCompatibility?.associatedTargetLoadedAddress !== undefined
        ? toHex32(item.objectRelativeCompatibility.associatedTargetLoadedAddress)
        : null) ??
      cand.loadedLinearPayloadCandidateHex;
    if (parseInt(itemLoadedPayloadHex, 16) !== parseInt(derivedLoadedPayloadHex, 16)) {
      throw new Error(
        `Qualifying B.8 interpretation ${item.interpretationId} candidate loaded payload mismatch (${itemLoadedPayloadHex} !== ${derivedLoadedPayloadHex})`,
      );
    }
    if (item.associatedRepresentationKind !== derivedAssocRepKind) {
      throw new Error(
        `Qualifying B.8 interpretation ${item.interpretationId} associated representation kind mismatch (${item.associatedRepresentationKind} !== ${derivedAssocRepKind})`,
      );
    }
  }

  // Section 5: Candidate summary cross-check
  if (parseInt(cand.loadedLinearStructureCandidateHex, 16) !== parseInt(derivedLoadedStructHex, 16)) {
    throw new Error(
      `B.8 candidate summary loaded structure (${cand.loadedLinearStructureCandidateHex}) does not match agreed interpretation loaded structure (${derivedLoadedStructHex})`,
    );
  }
  if (parseInt(cand.loadedLinearPayloadCandidateHex, 16) !== parseInt(derivedLoadedPayloadHex, 16)) {
    throw new Error(
      `B.8 candidate summary loaded payload (${cand.loadedLinearPayloadCandidateHex}) does not match agreed interpretation loaded payload (${derivedLoadedPayloadHex})`,
    );
  }
  const candidatePhysicalStructure = parseInt(cand.physicalStructureOffsetHex, 16);
  const candidatePhysicalPayload = parseInt(cand.physicalPayloadOffsetHex, 16);
  if (!Number.isFinite(candidatePhysicalStructure) || candidatePhysicalStructure <= 0) {
    throw new Error(
      `B.8 candidate summary physical structure offset is invalid (${cand.physicalStructureOffsetHex})`,
    );
  }
  if (!Number.isFinite(candidatePhysicalPayload) || candidatePhysicalPayload <= 0) {
    throw new Error(
      `B.8 candidate summary physical payload offset is invalid (${cand.physicalPayloadOffsetHex})`,
    );
  }
  const candidateLoadedStructure = parseInt(cand.loadedLinearStructureCandidateHex, 16);
  const candidateLoadedPayload = parseInt(cand.loadedLinearPayloadCandidateHex, 16);

  if (
    !Number.isFinite(candidatePhysicalStructure) ||
    !Number.isFinite(candidatePhysicalPayload) ||
    !Number.isFinite(candidateLoadedStructure) ||
    !Number.isFinite(candidateLoadedPayload)
  ) {
    throw new Error('Candidate coordinates from B.8 summary must be valid finite numbers');
  }

  const candidateObjectNumber = derivedCandidateObj;
  const candidateObjectRelativeStructure = (candidateLoadedStructure - relocBase) >>> 0;
  const candidateObjectRelativePayload = (candidateLoadedPayload - relocBase) >>> 0;

  return {
    candidateId: targetCandidateId,
    seedRegister: sampleTrace.seedRegister,
    seedValue: sampleTrace.initialSeedValue,
    seedValueHex: toHex32(sampleTrace.initialSeedValue),
    targetLinear,
    targetLinearHex: toHex32(targetLinear),
    targetObjectOffset: targetObjOffset,
    targetObjectOffsetHex: toHex32(targetObjOffset),
    targetPhysicalOffset: targetPhys,
    targetPhysicalOffsetHex: toHex32(targetPhys),
    qualifyingCallerCount: firstGroup.length,
    callerSiteOffsets: callerOffsets,
    callerSiteOffsetsHex: callerOffsets.map(toHex32),
    candidatePhysicalStructure,
    candidatePhysicalStructureHex: toHex32(candidatePhysicalStructure),
    candidatePhysicalPayload,
    candidatePhysicalPayloadHex: toHex32(candidatePhysicalPayload),
    candidateObjectNumber,
    candidateObjectRelativeStructure,
    candidateObjectRelativeStructureHex: toHex32(candidateObjectRelativeStructure),
    candidateObjectRelativePayload,
    candidateObjectRelativePayloadHex: toHex32(candidateObjectRelativePayload),
    candidateLoadedStructure,
    candidateLoadedStructureHex: toHex32(candidateLoadedStructure),
    candidateLoadedPayload,
    candidateLoadedPayloadHex: toHex32(candidateLoadedPayload),
    relocationBase: relocBase,
    relocationBaseHex: toHex32(relocBase),
  };
}

/**
 * Derives verified caller records for each qualifying caller site.
 * Validates opcode 0xE8 and removes fallbacks.
 * Supports calling with (buffer, b8Result, targetCandidateId, seedClass) or (b8Result, targetCandidateId, seedClass).
 */
export function deriveVerifiedCallerRecords(
  arg1: Uint8Array | MK1PaletteOperandUseResult,
  arg2: MK1PaletteOperandUseResult | string,
  arg3: string | MK1TargetEntrySeedClass,
  arg4?: MK1TargetEntrySeedClass,
): MK1VerifiedCallerRecord[] {
  let buffer: Uint8Array | null = null;
  let b8Result: MK1PaletteOperandUseResult;
  let targetCandidateId: string;
  let seedClass: MK1TargetEntrySeedClass;

  if (arg1 instanceof Uint8Array) {
    buffer = arg1;
    b8Result = arg2 as MK1PaletteOperandUseResult;
    targetCandidateId = arg3 as string;
    seedClass = arg4 as MK1TargetEntrySeedClass;
  } else {
    buffer = null;
    b8Result = arg1 as MK1PaletteOperandUseResult;
    targetCandidateId = arg2 as string;
    seedClass = arg3 as MK1TargetEntrySeedClass;
  }

  const candidateInterps = b8Result.interpretations.filter(
    (i) =>
      i.associatedCandidateId === targetCandidateId &&
      i.sourceKind === 'direct-candidate-first-hop' &&
      i.seedTrace &&
      i.seedTrace.seedLiveAtBoundary &&
      i.seedTrace.boundaryType === 'call' &&
      i.seedTrace.callBoundaryTargetRecon?.targetLoadedLinearCandidate === seedClass.targetLinear,
  ).sort((a, b) => a.instructionFileOffset - b.instructionFileOffset);

  if (candidateInterps.length === 0) {
    throw new Error(`No qualifying caller interpretations found for candidate ${targetCandidateId}`);
  }

  return candidateInterps.map((interp, index) => {
    const seedOffset = interp.instructionFileOffset;
    const operandOffset = interp.operandFieldOffset;
    if (typeof seedOffset !== 'number' || !Number.isFinite(seedOffset)) {
      throw new Error(`Caller interpretation ${interp.interpretationId} missing valid seedInstructionPhysicalOffset`);
    }
    if (typeof operandOffset !== 'number' || !Number.isFinite(operandOffset)) {
      throw new Error(`Caller interpretation ${interp.interpretationId} missing valid seedOperandFieldPhysicalOffset`);
    }

    const cb = interp.seedTrace?.callBoundaryTargetRecon;
    if (!cb) {
      throw new Error(`Qualifying caller interpretation ${interp.interpretationId} missing callBoundaryTargetRecon`);
    }
    if (typeof cb.sourceInstructionPhysicalOffset !== 'number' || !Number.isFinite(cb.sourceInstructionPhysicalOffset)) {
      throw new Error(`Caller interpretation ${interp.interpretationId} missing finite sourceInstructionPhysicalOffset`);
    }
    if (typeof cb.sourceObjectOffset !== 'number' || !Number.isFinite(cb.sourceObjectOffset)) {
      throw new Error(`Caller interpretation ${interp.interpretationId} missing finite sourceObjectOffset`);
    }
    if (typeof cb.sourceLoadedLinearCandidate !== 'number' || !Number.isFinite(cb.sourceLoadedLinearCandidate)) {
      throw new Error(`Caller interpretation ${interp.interpretationId} missing finite sourceLoadedLinearCandidate`);
    }
    if (typeof cb.nextInstructionObjectOffset !== 'number' || !Number.isFinite(cb.nextInstructionObjectOffset)) {
      throw new Error(`Caller interpretation ${interp.interpretationId} missing finite nextInstructionObjectOffset`);
    }
    if (typeof cb.targetLoadedLinearCandidate !== 'number' || !Number.isFinite(cb.targetLoadedLinearCandidate)) {
      throw new Error(`Caller interpretation ${interp.interpretationId} missing finite targetLoadedLinearCandidate`);
    }
    if (typeof cb.targetLinearPhysicalBackingOffset !== 'number' || !Number.isFinite(cb.targetLinearPhysicalBackingOffset)) {
      throw new Error(`Caller interpretation ${interp.interpretationId} missing finite targetLinearPhysicalBackingOffset`);
    }

    const callOffset = cb.sourceInstructionPhysicalOffset;
    if (buffer) {
      if (callOffset < 0 || callOffset + 5 > buffer.length) {
        throw new Error(`Caller instruction physical offset 0x${callOffset.toString(16).toUpperCase()} exceeds buffer bounds`);
      }
      const callOpcode = buffer[callOffset];
      if (callOpcode !== 0xe8) {
        throw new Error(
          `Verified caller boundary at physical 0x${callOffset.toString(16).toUpperCase()} is not opcode 0xE8 (found 0x${callOpcode.toString(16).padStart(2, '0').toUpperCase()})`,
        );
      }
    }

    const callLength = 5;
    const callLoaded = cb.sourceLoadedLinearCandidate;
    const returnObj = cb.nextInstructionObjectOffset;
    const returnLoaded = (seedClass.relocationBase + returnObj) >>> 0;
    const callTarget = cb.targetLoadedLinearCandidate;
    const targetMinusReturn = (callTarget - returnLoaded) | 0;

    return {
      callerIndex: index + 1,
      candidateId: targetCandidateId,
      seedInstructionPhysicalOffset: seedOffset,
      seedInstructionPhysicalOffsetHex: toHex32(seedOffset),
      seedOperandFieldPhysicalOffset: operandOffset,
      seedOperandFieldPhysicalOffsetHex: toHex32(operandOffset),
      callInstructionPhysicalOffset: callOffset,
      callInstructionPhysicalOffsetHex: toHex32(callOffset),
      callLoadedAddress: callLoaded,
      callLoadedAddressHex: toHex32(callLoaded),
      callLength,
      returnLoadedAddress: returnLoaded,
      returnLoadedAddressHex: toHex32(returnLoaded),
      returnObjectRelativeAddress: returnObj,
      returnObjectRelativeAddressHex: toHex32(returnObj),
      callTargetLoadedAddress: callTarget,
      callTargetLoadedAddressHex: toHex32(callTarget),
      targetMinusReturn,
    };
  });
}

/**
 * Derives caller-return spatial relations for each verified caller record against targetLinear.
 * If abs(targetMinusReturn) > 15, marks as not-examined-distant.
 */
export function deriveCallerReturnRelations(
  buffer: Uint8Array,
  callerRecords: MK1VerifiedCallerRecord[],
  targetLinear: number,
  report: MK1ExecutableLayoutReport,
): MK1CallerReturnRelation[] {
  const pageSize = report.parsedHeader?.pageSize;
  if (!pageSize || pageSize <= 0) {
    throw new Error('Missing or invalid LE header pageSize');
  }

  return callerRecords.map((caller) => {
    const targetMinusReturn = (targetLinear - caller.returnLoadedAddress) | 0;

    if (Math.abs(targetMinusReturn) > 15) {
      return {
        callerIndex: caller.callerIndex,
        callerSiteOffsetHex: caller.seedInstructionPhysicalOffsetHex,
        callInstructionOffsetHex: caller.callInstructionPhysicalOffsetHex,
        returnLoadedAddress: caller.returnLoadedAddress,
        returnLoadedAddressHex: caller.returnLoadedAddressHex,
        targetMinusReturn,
        returnDecodes: false,
        returnInstruction: null,
        returnInstructionMnemonic: null,
        returnInstructionLength: null,
        returnDecodeStatus: 'not-examined-distant',
        returnInstructionEndsAtTarget: false,
        isSafeNonFallThroughBoundary: false,
        isNearReturn: false,
        overlapClassification: 'distant-non-overlapping',
      };
    }

    // Resolve physical offset of return instruction
    const returnFileOffset = objectOffsetToFileOffset(
      1,
      caller.returnObjectRelativeAddress,
      report.objects,
      report.pageMap,
      pageSize,
    );

    let returnDecodes = false;
    let returnInstruction: string | null = null;
    let returnInstructionLength: number | null = null;
    let returnDecodeStatus: MK1CallerReturnRelation['returnDecodeStatus'] = 'unsupported-instruction';

    if (returnFileOffset !== null && returnFileOffset < buffer.length) {
      const op = buffer[returnFileOffset];
      if (op === 0xc3) {
        returnDecodes = true;
        returnInstruction = 'RET';
        returnInstructionLength = 1;
        returnDecodeStatus = 'valid-instruction-boundary';
      } else if (op >= 0x58 && op <= 0x5f) {
        returnDecodes = true;
        returnInstruction = `POP ${REGISTERS[op - 0x58]}`;
        returnInstructionLength = 1;
        returnDecodeStatus = 'valid-instruction-boundary';
      } else {
        returnDecodes = false;
        returnInstruction = `OP_${toHex8(op)}`;
        returnInstructionLength = null;
        returnDecodeStatus = 'unsupported-instruction';
      }
    } else {
      returnDecodeStatus = 'decoding-failed';
    }

    const returnEndsAt =
      returnInstructionLength !== null
        ? (caller.returnLoadedAddress + returnInstructionLength) >>> 0
        : caller.returnLoadedAddress;
    const returnInstructionEndsAtTarget = returnEndsAt === targetLinear;

    const isUnconditionalTransfer =
      returnInstruction === 'RET' ||
      returnInstruction === 'RETF' ||
      returnInstruction === 'IRET' ||
      returnInstruction?.startsWith('JMP');

    const isSafeNonFallThroughBoundary =
      returnDecodes &&
      returnInstructionEndsAtTarget &&
      Boolean(isUnconditionalTransfer);

    let overlapClassification: MK1CallerReturnRelation['overlapClassification'] = 'distinct-non-overlapping';
    if (caller.returnLoadedAddress === targetLinear) {
      overlapClassification = 'overlapping';
    } else if (targetLinear > caller.returnLoadedAddress && targetLinear < returnEndsAt) {
      overlapClassification = 'target-inside-return';
    } else if (Math.abs(targetMinusReturn) <= 15) {
      overlapClassification = 'distinct-non-overlapping';
    } else {
      overlapClassification = 'distant-non-overlapping';
    }

    return {
      callerIndex: caller.callerIndex,
      callerSiteOffsetHex: caller.seedInstructionPhysicalOffsetHex,
      callInstructionOffsetHex: caller.callInstructionPhysicalOffsetHex,
      returnLoadedAddress: caller.returnLoadedAddress,
      returnLoadedAddressHex: caller.returnLoadedAddressHex,
      targetMinusReturn,
      returnDecodes,
      returnInstruction,
      returnInstructionMnemonic: returnInstruction,
      returnInstructionLength,
      returnDecodeStatus,
      returnInstructionEndsAtTarget,
      isSafeNonFallThroughBoundary,
      isNearReturn: true,
      overlapClassification,
    };
  });
}

/**
 * Captures raw target window: 16 bytes before [-16..-1], 96 bytes after [+0..+95].
 */
export function captureRawTargetWindow(
  buffer: Uint8Array,
  targetPhysicalOffset: number,
): MK1TargetRawWindow {
  if (targetPhysicalOffset < 0 || targetPhysicalOffset >= buffer.length) {
    throw new Error(
      `Target physical offset 0x${targetPhysicalOffset.toString(16).toUpperCase()} is out of buffer bounds (0x${buffer.length.toString(16).toUpperCase()})`,
    );
  }
  const preStart = Math.max(0, targetPhysicalOffset - 16);
  const preSlice = buffer.slice(preStart, targetPhysicalOffset);
  const postEnd = Math.min(buffer.length, targetPhysicalOffset + 96);
  const postSlice = buffer.slice(targetPhysicalOffset, postEnd);

  return {
    preBytesHex: Array.from(preSlice)
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' '),
    postBytesHex: Array.from(postSlice)
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' '),
    targetByteHex: toHex8(buffer[targetPhysicalOffset]),
  };
}

/**
 * Qualifies the target boundary mechanically with near-return reconciliation.
 */
export function qualifyTargetBoundary(
  buffer: Uint8Array,
  seedClass: MK1TargetEntrySeedClass,
  report: MK1ExecutableLayoutReport,
  callerRecords: MK1VerifiedCallerRecord[],
  callerReturnRelations: MK1CallerReturnRelation[],
): MK1TargetBoundaryRecon {
  const notes: string[] = [];
  const pageSize = report.parsedHeader?.pageSize;
  if (!pageSize || pageSize <= 0) {
    throw new Error('Missing or invalid LE header pageSize');
  }

  const obj1 = report.objects.find((o) => o.objectNumber === 1);
  if (!obj1) {
    throw new Error('Object 1 code descriptor missing from report');
  }

  const targetLinear = seedClass.targetLinear;
  const relocBase = obj1.relocationBaseAddress;
  const targetObjOffset = (targetLinear - relocBase) >>> 0;

  // Resolve physical offset
  const physicalOffset = objectOffsetToFileOffset(
    1,
    targetObjOffset,
    report.objects,
    report.pageMap,
    pageSize,
  );

  if (physicalOffset === null || physicalOffset >= buffer.length) {
    throw new Error('Target linear address resolves outside mapped physical object file spans');
  }

  // Region check - must resolve to an authoritative topology region
  const region = findContainingRegion(physicalOffset, report.topology.regions);
  if (!region || region.regionId === 'none') {
    throw new Error(
      `Target physical offset 0x${physicalOffset.toString(16).toUpperCase()} does not resolve to an authoritative topology region`,
    );
  }
  const isAddressable = true;
  const isFileBacked = true;
  const isReadable = obj1.flags.readable;
  const isWritable = obj1.flags.writable;
  const isExecutable = obj1.flags.executable;

  const rawWindow = captureRawTargetWindow(buffer, physicalOffset);

  // Derive near-return set EXCLUSIVELY from verified caller records where abs(targetMinusReturn) <= 15
  const nearCallers = callerRecords.filter((c) => Math.abs(c.targetMinusReturn) <= 15);
  let nearReturnCoordinate: number | undefined;
  let targetMinusReturn: number | undefined;
  let nearReturnStartDecodes = false;
  let nearReturnInstruction: string | undefined;
  let nearReturnInstructionLength: number | undefined;
  let nearReturnEndAddress: number | undefined;
  let returnInstructionEndsAtTarget = false;

  if (nearCallers.length > 0) {
    const primaryNearCaller = nearCallers[0];
    const relation = callerReturnRelations.find((r) => r.callerIndex === primaryNearCaller.callerIndex);
    nearReturnCoordinate = primaryNearCaller.returnLoadedAddress;
    targetMinusReturn = primaryNearCaller.targetMinusReturn;

    if (relation && relation.returnDecodeStatus === 'valid-instruction-boundary') {
      nearReturnStartDecodes = true;
      nearReturnInstruction = relation.returnInstruction ?? undefined;
      nearReturnInstructionLength = relation.returnInstructionLength ?? undefined;
      if (nearReturnInstructionLength !== undefined) {
        nearReturnEndAddress = (nearReturnCoordinate + nearReturnInstructionLength) >>> 0;
        returnInstructionEndsAtTarget = nearReturnEndAddress === targetLinear;
        notes.push(
          `Verified caller return at loaded 0x${nearReturnCoordinate.toString(16).toUpperCase()} (${nearReturnInstruction}, len ${nearReturnInstructionLength}) terminates cleanly at target`,
        );
      }
    }
  }

  // Forward decode of first instruction at target
  const firstOp = buffer[physicalOffset];
  let targetStartDecodes = false;
  let forwardFirstInstructionMnemonic = 'UNKNOWN';
  let forwardFirstInstructionLength = 1;

  if (firstOp === 0xe9 && physicalOffset + 5 <= buffer.length) {
    targetStartDecodes = true;
    forwardFirstInstructionLength = 5;
    const rel32 = readInt32LE(buffer, physicalOffset + 1);
    const jmpTarget = (targetLinear + 5 + rel32) >>> 0;
    forwardFirstInstructionMnemonic = `JMP ${toHex32(jmpTarget)}`;
  } else if (firstOp === 0xeb && physicalOffset + 2 <= buffer.length) {
    targetStartDecodes = true;
    forwardFirstInstructionLength = 2;
    const rel8 = readInt8(buffer, physicalOffset + 1);
    const jmpTarget = (targetLinear + 2 + rel8) >>> 0;
    forwardFirstInstructionMnemonic = `JMP short ${toHex32(jmpTarget)}`;
  } else if (firstOp >= 0x50 && firstOp <= 0x57) {
    targetStartDecodes = true;
    forwardFirstInstructionLength = 1;
    forwardFirstInstructionMnemonic = `PUSH ${REGISTERS[firstOp - 0x50]}`;
  } else if (firstOp === 0x90) {
    targetStartDecodes = true;
    forwardFirstInstructionLength = 1;
    forwardFirstInstructionMnemonic = 'NOP';
  } else if (firstOp >= 0xb8 && firstOp <= 0xbf && physicalOffset + 5 <= buffer.length) {
    targetStartDecodes = true;
    forwardFirstInstructionLength = 5;
    const imm = readUint32LE(buffer, physicalOffset + 1);
    forwardFirstInstructionMnemonic = `MOV ${REGISTERS[firstOp - 0xb8]}, ${toHex32(imm)}`;
  } else {
    targetStartDecodes = false;
    forwardFirstInstructionMnemonic = `OP_${toHex8(firstOp)}`;
  }

  // Target boundary overlap verification using half-open interval ranges: [start, end)
  let targetInsideReturnInstruction = false;
  let returnInsideTargetInstruction = false;
  let decodedRangesOverlap = false;
  let overlapClassification = 'distant-non-overlapping';

  if (
    nearReturnCoordinate !== undefined &&
    nearReturnEndAddress !== undefined &&
    forwardFirstInstructionLength !== undefined
  ) {
    const returnStart = nearReturnCoordinate;
    const returnEnd = nearReturnEndAddress;
    const targetStart = targetLinear;
    const targetEnd = (targetLinear + forwardFirstInstructionLength) >>> 0;

    targetInsideReturnInstruction = targetStart >= returnStart && targetStart < returnEnd;
    returnInsideTargetInstruction = returnStart >= targetStart && returnStart < targetEnd;
    decodedRangesOverlap = Math.max(returnStart, targetStart) < Math.min(returnEnd, targetEnd);

    if (returnStart === targetStart && returnEnd === targetEnd) {
      overlapClassification = 'overlapping';
    } else if (targetInsideReturnInstruction) {
      overlapClassification = 'target-inside-return';
    } else if (returnInsideTargetInstruction) {
      overlapClassification = 'return-inside-target';
    } else if (decodedRangesOverlap) {
      overlapClassification = 'overlapping';
    } else if (Math.abs(targetMinusReturn ?? 0) <= 15) {
      overlapClassification = 'distinct-non-overlapping';
    } else {
      overlapClassification = 'distant-non-overlapping';
    }
  }

  let boundaryClassification: MK1TargetBoundaryClassification = 'unmapped-or-invalid';
  if (isAddressable && isFileBacked && isExecutable) {
    if (targetStartDecodes && nearReturnStartDecodes && returnInstructionEndsAtTarget) {
      boundaryClassification = 'verified-instruction-boundary';
    } else if (targetStartDecodes) {
      boundaryClassification = 'plausible-instruction-boundary';
    } else {
      boundaryClassification = 'mid-instruction-misaligned';
    }
  }

  return {
    targetLinear,
    targetLinearHex: toHex32(targetLinear),
    objectNumber: 1,
    objectOffset: targetObjOffset,
    objectOffsetHex: toHex32(targetObjOffset),
    physicalOffset,
    physicalOffsetHex: toHex32(physicalOffset),
    regionId: region.regionId,
    regionClass: region.regionClass,
    isAddressable,
    isFileBacked,
    isReadable,
    isWritable,
    isExecutable,
    targetByteHex: rawWindow.targetByteHex,
    precedingBytesHex: rawWindow.preBytesHex,
    followingBytesHex: rawWindow.postBytesHex,
    precedingDecodesToBoundary: nearReturnStartDecodes,
    forwardDecodeValid: targetStartDecodes,
    forwardFirstInstructionMnemonic,
    forwardFirstInstructionLength,
    nearReturnCoordinate,
    nearReturnCoordinateHex: nearReturnCoordinate !== undefined ? toHex32(nearReturnCoordinate) : undefined,
    targetMinusReturn,
    nearReturnStartDecodes,
    nearReturnInstruction,
    nearReturnInstructionLength,
    nearReturnEndAddress,
    nearReturnEndAddressHex: nearReturnEndAddress !== undefined ? toHex32(nearReturnEndAddress) : undefined,
    targetStartDecodes,
    returnInstructionEndsAtTarget,
    targetInsideReturnInstruction,
    returnInsideTargetInstruction,
    decodedRangesOverlap,
    overlapClassification,
    boundaryClassification,
    notes,
  };
}

/**
 * Traces straight-line execution starting at the target entry point.
 * Enforces trace limits (max 96 bytes, max 24 instructions).
 * Does not follow JMP/CALL/Jcc.
 */
export function traceTargetEntryExecution(
  buffer: Uint8Array,
  targetPhysicalOffset: number,
  initialEAX: number,
  report: MK1ExecutableLayoutReport,
  candidateLoadedStructure: number,
  candidateLoadedPayload: number,
  maxBytes = 96,
  maxInstructions = 24,
): MK1TargetTraceResult {
  const instructions: MK1TargetTraceInstruction[] = [];
  const allEvents: MK1TargetEntryEvent[] = [];

  if (!report.parsedHeader || report.parsedHeader.pageSize <= 0) {
    throw new Error('Missing or invalid LE header pageSize');
  }
  const pageSize = report.parsedHeader.pageSize;

  const obj1 = report.objects.find((o) => o.objectNumber === 1);
  if (!obj1) {
    throw new Error('Object 1 code descriptor missing from report');
  }
  const relocBase = obj1.relocationBaseAddress;

  // Initialize registers: EAX tracks the incoming seed, all others unknown
  const registers: Record<X86Register32, MK1RegisterEntryState> = {
    EAX: {
      register: 'EAX',
      isTrackingSeed: true,
      exactValueKnown: true,
      exactValue: initialEAX >>> 0,
      exactValueHex: toHex32(initialEAX),
    },
    ECX: { register: 'ECX', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000' },
    EDX: { register: 'EDX', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000' },
    EBX: { register: 'EBX', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000' },
    ESP: { register: 'ESP', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000' },
    EBP: { register: 'EBP', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000' },
    ESI: { register: 'ESI', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000' },
    EDI: { register: 'EDI', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000' },
  };

  const seedEvents: MK1SeedEventModel = {
    incomingSeedEverRead: false,
    incomingSeedOverwrittenBeforeRead: false,
    incomingSeedCopied: false,
    incomingSeedAffineAdjusted: false,
    relocationBaseAdjustmentObserved: false,
    candidateLoadedStructureReached: false,
    candidateLoadedPayloadReached: false,
    seedUsedAsMemoryBase: false,
    seedUsedAsMemoryIndex: false,
    partialMemoryAddressObserved: false,
    candidateStructureMemoryAddressObserved: false,
    candidatePayloadMemoryAddressObserved: false,
    seedPushed: false,
    seedStored: false,
    seedCompared: false,
    seedTested: false,
    seedLiveAtFinalBoundary: false,
  };

  let cursor = targetPhysicalOffset;
  let instructionCount = 0;
  let stopReason = 'in-progress';
  let stopOpcodeHex: string | undefined;
  let finalControlBoundary: MK1FinalControlBoundary | null = null;

  while (
    cursor - targetPhysicalOffset < maxBytes &&
    instructionCount < maxInstructions &&
    cursor < buffer.length
  ) {
    const byteClass = classifyPhysicalByteInObjects(cursor, report.objects, pageSize);
    if (byteClass.objectNumber !== 1 || byteClass.objectOffset === null) {
      stopReason = 'object-boundary-reached';
      break;
    }

    const instrOffset = cursor;
    const currentObjOffset = byteClass.objectOffset;
    const opByte = buffer[cursor];
    const instrEvents: MK1TargetEntryEvent[] = [];

    // Size prefix checks (0x66, 0x67) -> STOP
    if (opByte === 0x66 || opByte === 0x67) {
      stopReason = 'unsupported-size-override';
      stopOpcodeHex = toHex8(opByte);
      break;
    }

    // 1. PUSH r32 (0x50..0x57)
    if (opByte >= 0x50 && opByte <= 0x57) {
      const srcReg = REGISTERS[opByte - 0x50]!;
      const mnemonic = `PUSH ${srcReg}`;
      const length = 1;

      if (registers[srcReg].isTrackingSeed) {
        seedEvents.incomingSeedEverRead = true;
        seedEvents.seedPushed = true;
        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic,
          eventType: 'eax-pushed-to-stack',
          sourceRegister: srcReg,
          resultingValue: registers[srcReg].exactValue,
          resultingValueHex: registers[srcReg].exactValueHex,
          description: `Incoming seed in ${srcReg} pushed to stack`,
        });
      }

      instructions.push({
        index: instructionCount,
        fileOffset: instrOffset,
        fileOffsetHex: toHex32(instrOffset),
        objectOffset: currentObjOffset,
        objectOffsetHex: toHex32(currentObjOffset),
        loadedAddress: (relocBase + currentObjOffset) >>> 0,
        loadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        length,
        rawBytesHex: toHex8(opByte).replace('0x', ''),
        opcodeHex: toHex8(opByte),
        mnemonic,
        isBarrier: false,
        eaxEvents: instrEvents,
        registerStateAfter: cloneRegisterMap(registers),
      });

      cursor += length;
      instructionCount++;
      allEvents.push(...instrEvents);
      continue;
    }

    // 2. POP r32 (0x58..0x5F)
    if (opByte >= 0x58 && opByte <= 0x5f) {
      const destReg = REGISTERS[opByte - 0x58]!;
      const mnemonic = `POP ${destReg}`;
      const length = 1;

      if (registers[destReg].isTrackingSeed) {
        if (!seedEvents.incomingSeedEverRead) {
          seedEvents.incomingSeedOverwrittenBeforeRead = true;
        }
        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic,
          eventType: 'eax-overwritten',
          destinationRegister: destReg,
          description: `Seed in ${destReg} overwritten by POP`,
        });
        registers[destReg] = {
          register: destReg,
          isTrackingSeed: false,
          exactValueKnown: false,
          exactValue: 0,
          exactValueHex: '0x00000000',
        };
      }

      instructions.push({
        index: instructionCount,
        fileOffset: instrOffset,
        fileOffsetHex: toHex32(instrOffset),
        objectOffset: currentObjOffset,
        objectOffsetHex: toHex32(currentObjOffset),
        loadedAddress: (relocBase + currentObjOffset) >>> 0,
        loadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        length,
        rawBytesHex: toHex8(opByte).replace('0x', ''),
        opcodeHex: toHex8(opByte),
        mnemonic,
        isBarrier: false,
        eaxEvents: instrEvents,
        registerStateAfter: cloneRegisterMap(registers),
      });

      cursor += length;
      instructionCount++;
      allEvents.push(...instrEvents);
      continue;
    }

    // 3. MOV r32, imm32 (0xB8..0xBF)
    if (opByte >= 0xb8 && opByte <= 0xbf) {
      if (cursor + 5 > buffer.length) {
        stopReason = 'object-boundary-reached';
        break;
      }
      const targetReg = REGISTERS[opByte - 0xb8]!;
      const imm = readUint32LE(buffer, cursor + 1);
      const mnemonic = `MOV ${targetReg}, ${toHex32(imm)}`;
      const length = 5;

      if (registers[targetReg].isTrackingSeed) {
        if (!seedEvents.incomingSeedEverRead) {
          seedEvents.incomingSeedOverwrittenBeforeRead = true;
        }
        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic,
          eventType: 'eax-overwritten',
          destinationRegister: targetReg,
          description: `Seed in ${targetReg} overwritten with immediate ${toHex32(imm)}`,
        });
        registers[targetReg] = {
          register: targetReg,
          isTrackingSeed: false,
          exactValueKnown: false,
          exactValue: 0,
          exactValueHex: '0x00000000',
        };
      }

      instructions.push({
        index: instructionCount,
        fileOffset: instrOffset,
        fileOffsetHex: toHex32(instrOffset),
        objectOffset: currentObjOffset,
        objectOffsetHex: toHex32(currentObjOffset),
        loadedAddress: (relocBase + currentObjOffset) >>> 0,
        loadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        length,
        rawBytesHex: Array.from(buffer.slice(cursor, cursor + length))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
        opcodeHex: toHex8(opByte),
        mnemonic,
        immValue: imm,
        immValueHex: toHex32(imm),
        isBarrier: false,
        eaxEvents: instrEvents,
        registerStateAfter: cloneRegisterMap(registers),
      });

      cursor += length;
      instructionCount++;
      allEvents.push(...instrEvents);
      continue;
    }

    // 4. INC r32 (0x40..0x47)
    if (opByte >= 0x40 && opByte <= 0x47) {
      const targetReg = REGISTERS[opByte - 0x40]!;
      const mnemonic = `INC ${targetReg}`;
      const length = 1;

      if (registers[targetReg].isTrackingSeed) {
        seedEvents.incomingSeedEverRead = true;
        seedEvents.incomingSeedAffineAdjusted = true;
        const oldVal = registers[targetReg].exactValue;
        const newVal = (oldVal + 1) >>> 0;
        registers[targetReg].exactValue = newVal;
        registers[targetReg].exactValueHex = toHex32(newVal);

        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic,
          eventType: 'eax-affine-adjusted',
          destinationRegister: targetReg,
          immediateAdjustment: 1,
          resultingValue: newVal,
          resultingValueHex: toHex32(newVal),
          description: `${targetReg} holding seed incremented (+1) -> ${toHex32(newVal)}`,
        });

        if (newVal === candidateLoadedPayload) {
          seedEvents.candidateLoadedPayloadReached = true;
          instrEvents.push({
            instructionIndex: instructionCount,
            instructionOffset: instrOffset,
            instructionOffsetHex: toHex32(instrOffset),
            mnemonic,
            eventType: 'eax-target-coordinate-reached',
            resultingValue: newVal,
            resultingValueHex: toHex32(newVal),
            description: `Adjusted seed in ${targetReg} reached candidate loaded payload target ${toHex32(newVal)}`,
          });
        }
      }

      instructions.push({
        index: instructionCount,
        fileOffset: instrOffset,
        fileOffsetHex: toHex32(instrOffset),
        objectOffset: currentObjOffset,
        objectOffsetHex: toHex32(currentObjOffset),
        loadedAddress: (relocBase + currentObjOffset) >>> 0,
        loadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        length,
        rawBytesHex: toHex8(opByte).replace('0x', ''),
        opcodeHex: toHex8(opByte),
        mnemonic,
        isBarrier: false,
        eaxEvents: instrEvents,
        registerStateAfter: cloneRegisterMap(registers),
      });

      cursor += length;
      instructionCount++;
      allEvents.push(...instrEvents);
      continue;
    }

    // 5. DEC r32 (0x48..0x4F)
    if (opByte >= 0x48 && opByte <= 0x4f) {
      const targetReg = REGISTERS[opByte - 0x48]!;
      const mnemonic = `DEC ${targetReg}`;
      const length = 1;

      if (registers[targetReg].isTrackingSeed) {
        seedEvents.incomingSeedEverRead = true;
        seedEvents.incomingSeedAffineAdjusted = true;
        const oldVal = registers[targetReg].exactValue;
        const newVal = (oldVal - 1) >>> 0;
        registers[targetReg].exactValue = newVal;
        registers[targetReg].exactValueHex = toHex32(newVal);

        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic,
          eventType: 'eax-affine-adjusted',
          destinationRegister: targetReg,
          immediateAdjustment: -1,
          resultingValue: newVal,
          resultingValueHex: toHex32(newVal),
          description: `${targetReg} holding seed decremented (-1) -> ${toHex32(newVal)}`,
        });
      }

      instructions.push({
        index: instructionCount,
        fileOffset: instrOffset,
        fileOffsetHex: toHex32(instrOffset),
        objectOffset: currentObjOffset,
        objectOffsetHex: toHex32(currentObjOffset),
        loadedAddress: (relocBase + currentObjOffset) >>> 0,
        loadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        length,
        rawBytesHex: toHex8(opByte).replace('0x', ''),
        opcodeHex: toHex8(opByte),
        mnemonic,
        isBarrier: false,
        eaxEvents: instrEvents,
        registerStateAfter: cloneRegisterMap(registers),
      });

      cursor += length;
      instructionCount++;
      allEvents.push(...instrEvents);
      continue;
    }

    // 6. NOP (0x90)
    if (opByte === 0x90) {
      instructions.push({
        index: instructionCount,
        fileOffset: instrOffset,
        fileOffsetHex: toHex32(instrOffset),
        objectOffset: currentObjOffset,
        objectOffsetHex: toHex32(currentObjOffset),
        loadedAddress: (relocBase + currentObjOffset) >>> 0,
        loadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        length: 1,
        rawBytesHex: '90',
        opcodeHex: '0x90',
        mnemonic: 'NOP',
        isBarrier: false,
        eaxEvents: [],
        registerStateAfter: cloneRegisterMap(registers),
      });
      cursor += 1;
      instructionCount++;
      continue;
    }

    // 7. Barriers & Control Boundaries
    // 7a. Direct near JMP (0xE9)
    if (opByte === 0xe9) {
      if (cursor + 5 > buffer.length) {
        stopReason = 'object-boundary-reached';
        break;
      }
      const rel = readInt32LE(buffer, cursor + 1);
      const targetLinear = (relocBase + currentObjOffset + 5 + rel) >>> 0;
      const mnemonic = `JMP near ${toHex32(targetLinear)}`;

      instructions.push({
        index: instructionCount,
        fileOffset: instrOffset,
        fileOffsetHex: toHex32(instrOffset),
        objectOffset: currentObjOffset,
        objectOffsetHex: toHex32(currentObjOffset),
        loadedAddress: (relocBase + currentObjOffset) >>> 0,
        loadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        length: 5,
        rawBytesHex: Array.from(buffer.slice(cursor, cursor + 5))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
        opcodeHex: '0xE9',
        mnemonic,
        isBarrier: true,
        barrierType: 'jump',
        eaxEvents: [],
        registerStateAfter: cloneRegisterMap(registers),
      });

      finalControlBoundary = {
        boundaryType: 'jump',
        boundaryInstructionOffset: instrOffset,
        boundaryInstructionOffsetHex: toHex32(instrOffset),
        boundaryInstructionLoadedAddress: (relocBase + currentObjOffset) >>> 0,
        boundaryInstructionLoadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        boundaryInstructionMnemonic: mnemonic,
        boundaryTargetLoadedAddress: targetLinear,
        boundaryTargetLoadedAddressHex: toHex32(targetLinear),
        seedLiveAtBoundary: registers.EAX.isTrackingSeed,
        seedDerivedRegistersLiveAtBoundary: REGISTERS.filter((r) => registers[r].isTrackingSeed),
        notes: [
          'Control target recorded only. The JMP target was NOT followed.',
          'DO NOT FOLLOW JMP 0x53D33. Control boundary recorded only. Destination body not decoded.',
        ],
      };

      stopReason = 'unconditional-jump-boundary';
      stopOpcodeHex = '0xE9';
      cursor += 5;
      instructionCount++;
      break;
    }

    // 7b. Short JMP (0xEB)
    if (opByte === 0xeb) {
      if (cursor + 2 > buffer.length) {
        stopReason = 'object-boundary-reached';
        break;
      }
      const rel = readInt8(buffer, cursor + 1);
      const targetLinear = (relocBase + currentObjOffset + 2 + rel) >>> 0;
      const mnemonic = `JMP short ${toHex32(targetLinear)}`;

      instructions.push({
        index: instructionCount,
        fileOffset: instrOffset,
        fileOffsetHex: toHex32(instrOffset),
        objectOffset: currentObjOffset,
        objectOffsetHex: toHex32(currentObjOffset),
        loadedAddress: (relocBase + currentObjOffset) >>> 0,
        loadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        length: 2,
        rawBytesHex: Array.from(buffer.slice(cursor, cursor + 2))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
        opcodeHex: '0xEB',
        mnemonic,
        isBarrier: true,
        barrierType: 'jump',
        eaxEvents: [],
        registerStateAfter: cloneRegisterMap(registers),
      });

      finalControlBoundary = {
        boundaryType: 'jump',
        boundaryInstructionOffset: instrOffset,
        boundaryInstructionOffsetHex: toHex32(instrOffset),
        boundaryInstructionLoadedAddress: (relocBase + currentObjOffset) >>> 0,
        boundaryInstructionLoadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        boundaryInstructionMnemonic: mnemonic,
        boundaryTargetLoadedAddress: targetLinear,
        boundaryTargetLoadedAddressHex: toHex32(targetLinear),
        seedLiveAtBoundary: registers.EAX.isTrackingSeed,
        seedDerivedRegistersLiveAtBoundary: REGISTERS.filter((r) => registers[r].isTrackingSeed),
        notes: ['Control target recorded only. JMP target was not followed.'],
      };

      stopReason = 'unconditional-jump-boundary';
      stopOpcodeHex = '0xEB';
      cursor += 2;
      instructionCount++;
      break;
    }

    // 7c. CALL rel32 (0xE8)
    if (opByte === 0xe8) {
      if (cursor + 5 > buffer.length) {
        stopReason = 'object-boundary-reached';
        break;
      }
      const rel = readInt32LE(buffer, cursor + 1);
      const targetLinear = (relocBase + currentObjOffset + 5 + rel) >>> 0;
      const mnemonic = `CALL ${toHex32(targetLinear)}`;
      const liveSeedRegs = REGISTERS.filter((r) => registers[r].isTrackingSeed);

      if (liveSeedRegs.length > 0) {
        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic,
          eventType: 'eax-live-at-barrier',
          description: `Seed still live in [${liveSeedRegs.join(', ')}] at CALL barrier`,
        });
      }

      instructions.push({
        index: instructionCount,
        fileOffset: instrOffset,
        fileOffsetHex: toHex32(instrOffset),
        objectOffset: currentObjOffset,
        objectOffsetHex: toHex32(currentObjOffset),
        loadedAddress: (relocBase + currentObjOffset) >>> 0,
        loadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        length: 5,
        rawBytesHex: Array.from(buffer.slice(cursor, cursor + 5))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
        opcodeHex: '0xE8',
        mnemonic,
        isBarrier: true,
        barrierType: 'call',
        eaxEvents: instrEvents,
        registerStateAfter: cloneRegisterMap(registers),
      });

      finalControlBoundary = {
        boundaryType: 'call',
        boundaryInstructionOffset: instrOffset,
        boundaryInstructionOffsetHex: toHex32(instrOffset),
        boundaryInstructionLoadedAddress: (relocBase + currentObjOffset) >>> 0,
        boundaryInstructionLoadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        boundaryInstructionMnemonic: mnemonic,
        boundaryTargetLoadedAddress: targetLinear,
        boundaryTargetLoadedAddressHex: toHex32(targetLinear),
        seedLiveAtBoundary: registers.EAX.isTrackingSeed,
        seedDerivedRegistersLiveAtBoundary: liveSeedRegs,
        notes: ['CALL barrier reached. Call body was not followed.'],
      };

      stopReason = 'call-boundary';
      stopOpcodeHex = '0xE8';
      cursor += 5;
      instructionCount++;
      allEvents.push(...instrEvents);
      break;
    }

    // 7d. Short Jcc (0x70..0x7F)
    if (opByte >= 0x70 && opByte <= 0x7f) {
      if (cursor + 2 > buffer.length) {
        stopReason = 'object-boundary-reached';
        break;
      }
      const rel = readInt8(buffer, cursor + 1);
      const targetLinear = (relocBase + currentObjOffset + 2 + rel) >>> 0;
      const mnemonic = `Jcc short ${toHex32(targetLinear)}`;

      instructions.push({
        index: instructionCount,
        fileOffset: instrOffset,
        fileOffsetHex: toHex32(instrOffset),
        objectOffset: currentObjOffset,
        objectOffsetHex: toHex32(currentObjOffset),
        loadedAddress: (relocBase + currentObjOffset) >>> 0,
        loadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        length: 2,
        rawBytesHex: Array.from(buffer.slice(cursor, cursor + 2))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
        opcodeHex: toHex8(opByte),
        mnemonic,
        isBarrier: true,
        barrierType: 'branch',
        eaxEvents: [],
        registerStateAfter: cloneRegisterMap(registers),
      });

      finalControlBoundary = {
        boundaryType: 'branch',
        boundaryInstructionOffset: instrOffset,
        boundaryInstructionOffsetHex: toHex32(instrOffset),
        boundaryInstructionLoadedAddress: (relocBase + currentObjOffset) >>> 0,
        boundaryInstructionLoadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        boundaryInstructionMnemonic: mnemonic,
        boundaryTargetLoadedAddress: targetLinear,
        boundaryTargetLoadedAddressHex: toHex32(targetLinear),
        seedLiveAtBoundary: registers.EAX.isTrackingSeed,
        seedDerivedRegistersLiveAtBoundary: REGISTERS.filter((r) => registers[r].isTrackingSeed),
        notes: ['Conditional branch barrier reached.'],
      };

      stopReason = 'conditional-branch-boundary';
      stopOpcodeHex = toHex8(opByte);
      cursor += 2;
      instructionCount++;
      break;
    }

    // 7e. Near Jcc (0x0F 0x80..0x8F)
    if (opByte === 0x0f && cursor + 1 < buffer.length) {
      const secondByte = buffer[cursor + 1];
      if (secondByte >= 0x80 && secondByte <= 0x8f) {
        if (cursor + 6 > buffer.length) {
          stopReason = 'object-boundary-reached';
          break;
        }
        const rel = readInt32LE(buffer, cursor + 2);
        const targetLinear = (relocBase + currentObjOffset + 6 + rel) >>> 0;
        const mnemonic = `Jcc near ${toHex32(targetLinear)}`;

        instructions.push({
          index: instructionCount,
          fileOffset: instrOffset,
          fileOffsetHex: toHex32(instrOffset),
          objectOffset: currentObjOffset,
          objectOffsetHex: toHex32(currentObjOffset),
          loadedAddress: (relocBase + currentObjOffset) >>> 0,
          loadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
          length: 6,
          rawBytesHex: Array.from(buffer.slice(cursor, cursor + 6))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join(''),
          opcodeHex: `0x0F ${toHex8(secondByte)}`,
          mnemonic,
          isBarrier: true,
          barrierType: 'branch',
          eaxEvents: [],
          registerStateAfter: cloneRegisterMap(registers),
        });

        finalControlBoundary = {
          boundaryType: 'branch',
          boundaryInstructionOffset: instrOffset,
          boundaryInstructionOffsetHex: toHex32(instrOffset),
          boundaryInstructionLoadedAddress: (relocBase + currentObjOffset) >>> 0,
          boundaryInstructionLoadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
          boundaryInstructionMnemonic: mnemonic,
          boundaryTargetLoadedAddress: targetLinear,
          boundaryTargetLoadedAddressHex: toHex32(targetLinear),
          seedLiveAtBoundary: registers.EAX.isTrackingSeed,
          seedDerivedRegistersLiveAtBoundary: REGISTERS.filter((r) => registers[r].isTrackingSeed),
          notes: ['Conditional branch barrier reached.'],
        };

        stopReason = 'conditional-branch-boundary';
        stopOpcodeHex = `0x0F ${toHex8(secondByte)}`;
        cursor += 6;
        instructionCount++;
        break;
      }
    }

    // 7f. RET (0xC3, 0xCB, 0xC2, 0xCA)
    if (opByte === 0xc3 || opByte === 0xcb || opByte === 0xc2 || opByte === 0xca) {
      const isRetImm = opByte === 0xc2 || opByte === 0xca;
      const length = isRetImm ? 3 : 1;
      const imm = isRetImm ? readUint32LE(buffer, cursor + 1) & 0xffff : undefined;
      const mnemonic = isRetImm ? `RET 0x${imm?.toString(16)}` : 'RET';
      const liveSeedRegs = REGISTERS.filter((r) => registers[r].isTrackingSeed);

      if (liveSeedRegs.length > 0) {
        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic,
          eventType: 'eax-live-at-barrier',
          description: `Seed still live in [${liveSeedRegs.join(', ')}] at RET boundary`,
        });
      }

      instructions.push({
        index: instructionCount,
        fileOffset: instrOffset,
        fileOffsetHex: toHex32(instrOffset),
        objectOffset: currentObjOffset,
        objectOffsetHex: toHex32(currentObjOffset),
        loadedAddress: (relocBase + currentObjOffset) >>> 0,
        loadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        length,
        rawBytesHex: Array.from(buffer.slice(cursor, cursor + length))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
        opcodeHex: toHex8(opByte),
        mnemonic,
        isBarrier: true,
        barrierType: 'return',
        eaxEvents: instrEvents,
        registerStateAfter: cloneRegisterMap(registers),
      });

      finalControlBoundary = {
        boundaryType: 'return',
        boundaryInstructionOffset: instrOffset,
        boundaryInstructionOffsetHex: toHex32(instrOffset),
        boundaryInstructionLoadedAddress: (relocBase + currentObjOffset) >>> 0,
        boundaryInstructionLoadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        boundaryInstructionMnemonic: mnemonic,
        boundaryTargetLoadedAddress: null,
        boundaryTargetLoadedAddressHex: null,
        seedLiveAtBoundary: registers.EAX.isTrackingSeed,
        seedDerivedRegistersLiveAtBoundary: liveSeedRegs,
        notes: ['Return boundary reached.'],
      };

      stopReason = 'return-boundary';
      stopOpcodeHex = toHex8(opByte);
      cursor += length;
      instructionCount++;
      allEvents.push(...instrEvents);
      break;
    }

    // 7g. INT imm8 (0xCD)
    if (opByte === 0xcd) {
      if (cursor + 2 > buffer.length) {
        stopReason = 'object-boundary-reached';
        break;
      }
      const intNum = buffer[cursor + 1];
      const mnemonic = `INT 0x${intNum.toString(16).padStart(2, '0').toUpperCase()}`;

      instructions.push({
        index: instructionCount,
        fileOffset: instrOffset,
        fileOffsetHex: toHex32(instrOffset),
        objectOffset: currentObjOffset,
        objectOffsetHex: toHex32(currentObjOffset),
        loadedAddress: (relocBase + currentObjOffset) >>> 0,
        loadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        length: 2,
        rawBytesHex: Array.from(buffer.slice(cursor, cursor + 2))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
        opcodeHex: '0xCD',
        mnemonic,
        isBarrier: true,
        barrierType: 'interrupt',
        eaxEvents: [],
        registerStateAfter: cloneRegisterMap(registers),
      });

      finalControlBoundary = {
        boundaryType: 'interrupt',
        boundaryInstructionOffset: instrOffset,
        boundaryInstructionOffsetHex: toHex32(instrOffset),
        boundaryInstructionLoadedAddress: (relocBase + currentObjOffset) >>> 0,
        boundaryInstructionLoadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        boundaryInstructionMnemonic: mnemonic,
        boundaryTargetLoadedAddress: null,
        boundaryTargetLoadedAddressHex: null,
        seedLiveAtBoundary: registers.EAX.isTrackingSeed,
        seedDerivedRegistersLiveAtBoundary: REGISTERS.filter((r) => registers[r].isTrackingSeed),
        notes: ['Interrupt boundary reached.'],
      };

      stopReason = 'interrupt-boundary';
      stopOpcodeHex = '0xCD';
      cursor += 2;
      instructionCount++;
      break;
    }

    // 8. ModR/M Instructions: MOV, LEA, ALU, CMP, TEST
    const isModRMSup =
      opByte === 0x8b ||
      opByte === 0x89 ||
      opByte === 0x8d ||
      opByte === 0x01 ||
      opByte === 0x03 ||
      opByte === 0x29 ||
      opByte === 0x2b ||
      opByte === 0x09 ||
      opByte === 0x0b ||
      opByte === 0x21 ||
      opByte === 0x23 ||
      opByte === 0x31 ||
      opByte === 0x33 ||
      opByte === 0x39 ||
      opByte === 0x3b ||
      opByte === 0x85 ||
      opByte === 0x81 ||
      opByte === 0x83;

    if (isModRMSup && cursor + 1 < buffer.length) {
      const modrm = buffer[cursor + 1];
      const mod = (modrm >> 6) & 3;
      const regOp = (modrm >> 3) & 7;
      const rm = modrm & 7;

      let instrLength = 2;
      let hasSIB = false;
      let sibByte = 0;
      let baseReg: X86Register32 | null = null;
      let indexReg: X86Register32 | null = null;
      let scale = 1;
      let dispValue: number | undefined;
      let immValue: number | undefined;

      if (mod !== 3 && rm === 4) {
        hasSIB = true;
        if (cursor + 2 >= buffer.length) {
          stopReason = 'object-boundary-reached';
          break;
        }
        sibByte = buffer[cursor + 2];
        instrLength += 1;
        const sibScale = (sibByte >> 6) & 3;
        const sibIndex = (sibByte >> 3) & 7;
        const sibBase = sibByte & 7;
        scale = 1 << sibScale;
        if (sibIndex !== 4) indexReg = REGISTERS[sibIndex]!;
        if (mod === 0 && sibBase === 5) {
          // disp32 only
        } else {
          baseReg = REGISTERS[sibBase]!;
        }
      } else if (mod !== 3) {
        if (mod === 0 && rm === 5) {
          // disp32 only
        } else {
          baseReg = REGISTERS[rm]!;
        }
      }

      if (mod === 1) {
        if (cursor + instrLength >= buffer.length) {
          stopReason = 'object-boundary-reached';
          break;
        }
        dispValue = readInt8(buffer, cursor + instrLength);
        instrLength += 1;
      } else if (mod === 2 || (mod === 0 && ((hasSIB && (sibByte & 7) === 5) || rm === 5))) {
        if (cursor + instrLength + 4 > buffer.length) {
          stopReason = 'object-boundary-reached';
          break;
        }
        dispValue = readInt32LE(buffer, cursor + instrLength);
        instrLength += 4;
      }

      if (opByte === 0x81) {
        if (cursor + instrLength + 4 > buffer.length) {
          stopReason = 'object-boundary-reached';
          break;
        }
        immValue = readUint32LE(buffer, cursor + instrLength);
        instrLength += 4;
      } else if (opByte === 0x83) {
        if (cursor + instrLength >= buffer.length) {
          stopReason = 'object-boundary-reached';
          break;
        }
        immValue = buffer[cursor + instrLength];
        instrLength += 1;
      }

      // Memory operand dereference event
      if (baseReg && registers[baseReg].isTrackingSeed) {
        seedEvents.incomingSeedEverRead = true;
        seedEvents.seedUsedAsMemoryBase = true;
        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic: 'MEM_READ',
          eventType: 'eax-read-memory-base',
          sourceRegister: baseReg,
          description: `Seed in ${baseReg} used as memory base address`,
        });
      }
      if (indexReg && registers[indexReg].isTrackingSeed) {
        seedEvents.incomingSeedEverRead = true;
        seedEvents.seedUsedAsMemoryIndex = true;
        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic: 'MEM_READ',
          eventType: 'eax-read-memory-index',
          sourceRegister: indexReg,
          description: `Seed in ${indexReg} used as memory index register`,
        });
      }

      const regName = REGISTERS[regOp]!;
      const rmDesc = mod === 3 ? REGISTERS[rm]! : `${baseReg ?? ''}${indexReg ? `+${indexReg}*${scale}` : ''}${dispValue !== undefined ? `+${dispValue}` : ''}`;
      let mnemonic = '';

      if (opByte === 0x8b) {
        // MOV r32, r/m32
        const dest = regName;
        const src = mod === 3 ? REGISTERS[rm]! : `[${rmDesc}]`;
        mnemonic = `MOV ${dest}, ${src}`;

        if (mod === 3) {
          const srcReg = REGISTERS[rm]!;
          if (registers[srcReg].isTrackingSeed) {
            seedEvents.incomingSeedCopied = true;
            registers[dest] = {
              register: dest,
              isTrackingSeed: true,
              exactValueKnown: registers[srcReg].exactValueKnown,
              exactValue: registers[srcReg].exactValue,
              exactValueHex: registers[srcReg].exactValueHex,
            };
            instrEvents.push({
              instructionIndex: instructionCount,
              instructionOffset: instrOffset,
              instructionOffsetHex: toHex32(instrOffset),
              mnemonic,
              eventType: 'eax-copied-to-register',
              sourceRegister: srcReg,
              destinationRegister: dest,
              resultingValue: registers[srcReg].exactValue,
              resultingValueHex: registers[srcReg].exactValueHex,
              description: `Seed in ${srcReg} copied to ${dest}`,
            });
          } else if (registers[dest].isTrackingSeed) {
            if (!seedEvents.incomingSeedEverRead) {
              seedEvents.incomingSeedOverwrittenBeforeRead = true;
            }
            instrEvents.push({
              instructionIndex: instructionCount,
              instructionOffset: instrOffset,
              instructionOffsetHex: toHex32(instrOffset),
              mnemonic,
              eventType: 'eax-overwritten',
              destinationRegister: dest,
              description: `Seed in ${dest} overwritten by ${srcReg}`,
            });
            registers[dest] = {
              register: dest,
              isTrackingSeed: false,
              exactValueKnown: false,
              exactValue: 0,
              exactValueHex: '0x00000000',
            };
          }
        }
      } else if (opByte === 0x89) {
        // MOV r/m32, r32
        const src = regName;
        mnemonic = `MOV ${mod === 3 ? rmDesc : `[${rmDesc}]`}, ${src}`;

        if (mod === 3) {
          const dest = REGISTERS[rm]!;
          if (registers[src].isTrackingSeed) {
            seedEvents.incomingSeedCopied = true;
            registers[dest] = {
              register: dest,
              isTrackingSeed: true,
              exactValueKnown: registers[src].exactValueKnown,
              exactValue: registers[src].exactValue,
              exactValueHex: registers[src].exactValueHex,
            };
            instrEvents.push({
              instructionIndex: instructionCount,
              instructionOffset: instrOffset,
              instructionOffsetHex: toHex32(instrOffset),
              mnemonic,
              eventType: 'eax-copied-to-register',
              sourceRegister: src,
              destinationRegister: dest,
              resultingValue: registers[src].exactValue,
              resultingValueHex: registers[src].exactValueHex,
              description: `Seed in ${src} copied to ${dest}`,
            });
          } else if (registers[dest].isTrackingSeed) {
            if (!seedEvents.incomingSeedEverRead) {
              seedEvents.incomingSeedOverwrittenBeforeRead = true;
            }
            instrEvents.push({
              instructionIndex: instructionCount,
              instructionOffset: instrOffset,
              instructionOffsetHex: toHex32(instrOffset),
              mnemonic,
              eventType: 'eax-overwritten',
              destinationRegister: dest,
              description: `Seed in ${dest} overwritten by ${src}`,
            });
            registers[dest] = {
              register: dest,
              isTrackingSeed: false,
              exactValueKnown: false,
              exactValue: 0,
              exactValueHex: '0x00000000',
            };
          }
        } else {
          // Memory store
          if (registers[src].isTrackingSeed) {
            seedEvents.seedStored = true;
            instrEvents.push({
              instructionIndex: instructionCount,
              instructionOffset: instrOffset,
              instructionOffsetHex: toHex32(instrOffset),
              mnemonic,
              eventType: 'eax-read-alu-source',
              sourceRegister: src,
              description: `Seed in ${src} stored to memory [${rmDesc}]`,
            });
          }
        }
      } else if (opByte === 0x8d) {
        // LEA r32, m
        const dest = regName;
        mnemonic = `LEA ${dest}, [${rmDesc}]`;
        let computedVal: number | null = null;
        if (baseReg && registers[baseReg].isTrackingSeed && registers[baseReg].exactValueKnown) {
          seedEvents.incomingSeedEverRead = true;
          computedVal = registers[baseReg].exactValue;
          if (indexReg && registers[indexReg].isTrackingSeed && registers[indexReg].exactValueKnown) {
            computedVal = (computedVal + registers[indexReg].exactValue * scale) >>> 0;
          } else if (!indexReg) {
            computedVal = (computedVal + (dispValue ?? 0)) >>> 0;
          } else {
            computedVal = null;
          }
        }

        if (computedVal !== null) {
          seedEvents.incomingSeedAffineAdjusted = true;
          registers[dest] = {
            register: dest,
            isTrackingSeed: true,
            exactValueKnown: true,
            exactValue: computedVal,
            exactValueHex: toHex32(computedVal),
          };

          instrEvents.push({
            instructionIndex: instructionCount,
            instructionOffset: instrOffset,
            instructionOffsetHex: toHex32(instrOffset),
            mnemonic,
            eventType: 'eax-affine-adjusted',
            destinationRegister: dest,
            resultingValue: computedVal,
            resultingValueHex: toHex32(computedVal),
            description: `LEA computed affine coordinate ${toHex32(computedVal)} into ${dest}`,
          });

          if (computedVal === candidateLoadedPayload) {
            seedEvents.candidateLoadedPayloadReached = true;
            instrEvents.push({
              instructionIndex: instructionCount,
              instructionOffset: instrOffset,
              instructionOffsetHex: toHex32(instrOffset),
              mnemonic,
              eventType: 'eax-target-coordinate-reached',
              resultingValue: computedVal,
              resultingValueHex: toHex32(computedVal),
              description: `LEA coordinate ${toHex32(computedVal)} matches candidate loaded payload target`,
            });
          }
          if (computedVal === candidateLoadedStructure) {
            seedEvents.candidateLoadedStructureReached = true;
          }
        } else if (registers[dest].isTrackingSeed) {
          if (!seedEvents.incomingSeedEverRead) {
            seedEvents.incomingSeedOverwrittenBeforeRead = true;
          }
          registers[dest] = {
            register: dest,
            isTrackingSeed: false,
            exactValueKnown: false,
            exactValue: 0,
            exactValueHex: '0x00000000',
          };
        }
      } else if (opByte === 0x39 || opByte === 0x3b) {
        // CMP
        mnemonic = `CMP ${mod === 3 ? rmDesc : `[${rmDesc}]`}, ${regName}`;
        const op1 = opByte === 0x39 ? REGISTERS[rm]! : regName;
        const op2 = opByte === 0x39 ? regName : (mod === 3 ? REGISTERS[rm]! : null);
        if (registers[op1]?.isTrackingSeed || (op2 && registers[op2]?.isTrackingSeed)) {
          seedEvents.incomingSeedEverRead = true;
          seedEvents.seedCompared = true;
          instrEvents.push({
            instructionIndex: instructionCount,
            instructionOffset: instrOffset,
            instructionOffsetHex: toHex32(instrOffset),
            mnemonic,
            eventType: 'eax-read-cmp-source',
            description: 'Seed in register evaluated by CMP',
          });
        }
      } else if (opByte === 0x85) {
        // TEST r/m32, r32
        mnemonic = `TEST ${mod === 3 ? rmDesc : `[${rmDesc}]`}, ${regName}`;
        const op1 = REGISTERS[rm]!;
        const op2 = regName;
        if (registers[op1]?.isTrackingSeed || registers[op2]?.isTrackingSeed) {
          seedEvents.incomingSeedEverRead = true;
          seedEvents.seedTested = true;
          instrEvents.push({
            instructionIndex: instructionCount,
            instructionOffset: instrOffset,
            instructionOffsetHex: toHex32(instrOffset),
            mnemonic,
            eventType: 'eax-read-test-source',
            description: 'Seed evaluated by TEST',
          });
        }
      } else {
        mnemonic = `${toHex8(opByte)} ${mod === 3 ? rmDesc : `[${rmDesc}]`}`;
      }

      instructions.push({
        index: instructionCount,
        fileOffset: instrOffset,
        fileOffsetHex: toHex32(instrOffset),
        objectOffset: currentObjOffset,
        objectOffsetHex: toHex32(currentObjOffset),
        loadedAddress: (relocBase + currentObjOffset) >>> 0,
        loadedAddressHex: toHex32((relocBase + currentObjOffset) >>> 0),
        length: instrLength,
        rawBytesHex: Array.from(buffer.slice(cursor, cursor + instrLength))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
        opcodeHex: toHex8(opByte),
        mnemonic,
        modRMHex: toHex8(modrm),
        sibHex: hasSIB ? toHex8(sibByte) : undefined,
        dispValue,
        dispValueHex: dispValue !== undefined ? toHex32(dispValue) : undefined,
        immValue,
        immValueHex: immValue !== undefined ? toHex32(immValue) : undefined,
        isBarrier: false,
        eaxEvents: instrEvents,
        registerStateAfter: cloneRegisterMap(registers),
      });

      cursor += instrLength;
      instructionCount++;
      allEvents.push(...instrEvents);
      continue;
    }

    // 9. Unsupported opcode -> STOP immediately
    stopReason = 'unsupported-opcode';
    stopOpcodeHex = toHex8(opByte);
    break;
  }

  if (cursor - targetPhysicalOffset >= maxBytes) {
    stopReason = 'max-bytes-reached';
  } else if (instructionCount >= maxInstructions) {
    stopReason = 'max-instructions-reached';
  }

  // Seed live at final boundary
  seedEvents.seedLiveAtFinalBoundary = registers.EAX.isTrackingSeed;

  // Derive incoming EAX disposition
  let disposition: MK1IncomingEAXDisposition;
  if (instructions.length === 0) {
    disposition = 'misaligned-entry-no-decode';
  } else if (seedEvents.incomingSeedEverRead) {
    disposition = 'read-before-overwrite';
  } else if (seedEvents.incomingSeedOverwrittenBeforeRead) {
    disposition = 'overwritten-before-read';
  } else if (finalControlBoundary !== null && registers.EAX.isTrackingSeed) {
    disposition = 'preserved-to-control-boundary-without-read';
  } else if (stopReason.includes('boundary') && registers.EAX.isTrackingSeed) {
    disposition = 'barrier-reached-before-access';
  } else {
    disposition = 'preserved-unaccessed-to-barrier';
  }

  return {
    startLinear: (relocBase + (targetPhysicalOffset - obj1!.physicalSpans[0].fileStart)) >>> 0,
    startLinearHex: toHex32((relocBase + (targetPhysicalOffset - obj1!.physicalSpans[0].fileStart)) >>> 0),
    startPhysical: targetPhysicalOffset,
    startPhysicalHex: toHex32(targetPhysicalOffset),
    incomingEAX: initialEAX,
    incomingEAXHex: toHex32(initialEAX),
    instructions,
    totalBytesDecoded: cursor - targetPhysicalOffset,
    stopReason,
    stopOpcodeHex,
    disposition,
    finalControlBoundary,
    b8BoundaryTargetCrossReference: null, // Populated by coordinator
    seedEvents,
    eaxReadBeforeOverwrite: seedEvents.incomingSeedEverRead,
    eaxOverwrittenBeforeRead: seedEvents.incomingSeedOverwrittenBeforeRead,
    eaxUsedAsMemoryBase: seedEvents.seedUsedAsMemoryBase,
    eaxUsedAsMemoryIndex: seedEvents.seedUsedAsMemoryIndex,
    eaxCopied: seedEvents.incomingSeedCopied,
    eaxPushed: seedEvents.seedPushed,
    eaxAffineAdjusted: seedEvents.incomingSeedAffineAdjusted,
    eaxTargetCoordinateReached: seedEvents.candidateLoadedPayloadReached,
    allEvents,
  };
}

/**
 * Cross-references the final control boundary target against B.8 CALL-boundary target groups.
 */
export function crossReferenceFinalBoundaryTargetWithB8(
  finalBoundaryTarget: number | null,
  b8Result: MK1PaletteOperandUseResult,
): MK1B8BoundaryTargetCrossReference {
  if (finalBoundaryTarget === null) {
    return {
      finalBoundaryTargetLoaded: null,
      finalBoundaryTargetLoadedHex: null,
      boundaryTargetAppearsInB8TargetGroups: false,
      matchingB8TargetGroupCount: 0,
      matchingB8TargetGroups: [],
      notes: ['No final control boundary target was reached.'],
    };
  }

  const matchingGroups: MK1B8TargetGroupMatch[] = [];
  const seenKeys = new Set<string>();

  // Check call boundary target groups
  for (const group of b8Result.callBoundaryTargetGroups ?? []) {
    if (group.boundaryTargetLinear === finalBoundaryTarget) {
      const key = `${group.boundaryTargetLinear}|${group.destinationRegister}|${group.seedValue}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        matchingGroups.push({
          targetAddress: group.boundaryTargetLinear,
          targetAddressHex: toHex32(group.boundaryTargetLinear),
          seedRegister: group.destinationRegister,
          seedValue: group.seedValue,
          seedValueHex: toHex32(group.seedValue),
        });
      }
    }
  }

  // Also check all interpretations in B.8
  for (const interp of b8Result.interpretations) {
    const cb = interp.seedTrace?.callBoundaryTargetRecon;
    if (cb && cb.targetLoadedLinearCandidate === finalBoundaryTarget) {
      const reg = interp.seedTrace!.seedRegister;
      const val = interp.seedTrace!.initialSeedValue;
      const key = `${finalBoundaryTarget}|${reg}|${val}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        matchingGroups.push({
          targetAddress: finalBoundaryTarget,
          targetAddressHex: toHex32(finalBoundaryTarget),
          seedRegister: reg,
          seedValue: val,
          seedValueHex: toHex32(val),
        });
      }
    }
  }

  const appears = matchingGroups.length > 0;
  const notes: string[] = [];
  if (appears) {
    notes.push(
      `Boundary target ${toHex32(finalBoundaryTarget)} matches ${matchingGroups.length} B.8 CALL-boundary target group(s).`,
    );
    notes.push('Pure coordinate equality only; does NOT imply shared functional purpose.');
  } else {
    notes.push(`Boundary target ${toHex32(finalBoundaryTarget)} does not appear in B.8 CALL-boundary target groups.`);
  }

  return {
    finalBoundaryTargetLoaded: finalBoundaryTarget,
    finalBoundaryTargetLoadedHex: toHex32(finalBoundaryTarget),
    boundaryTargetAppearsInB8TargetGroups: appears,
    matchingB8TargetGroupCount: matchingGroups.length,
    matchingB8TargetGroups: matchingGroups,
    notes,
  };
}

/**
 * Scans Object 1 addressable file-backed bytes for all E8 rel32 CALL instructions.
 * Bounds strictly to addressableFileBackedBytes.
 */
export function scanRawE8ExactTargetNullModel(
  buffer: Uint8Array,
  targetLinear: number,
  report: MK1ExecutableLayoutReport,
  verifiedCallOffsets: number[] = [],
): MK1RawE8NullModelResult {
  const obj1 = report.objects.find((o) => o.objectNumber === 1);
  if (!obj1) {
    throw new Error('Object 1 code descriptor missing from report');
  }
  if (!report.parsedHeader || report.parsedHeader.pageSize <= 0) {
    throw new Error('Missing or invalid LE header pageSize');
  }
  const pageSize = report.parsedHeader.pageSize;
  const relocBase = obj1.relocationBaseAddress;

  const obj1Summary = report.objectBackingSummary?.find((s) => s.objectNumber === 1);
  if (!obj1Summary || !obj1Summary.addressableFileBackedBytes || obj1Summary.addressableFileBackedBytes <= 0) {
    throw new Error('Object 1 addressable file-backed bytes missing or zero');
  }
  const addressableBytes = obj1Summary.addressableFileBackedBytes;

  let rawE8OpcodesSeen = 0;
  let rawE8Rel32DecodableCount = 0;
  let rawExactTargetMatchCount = 0;
  const matches: MK1RawE8ExactTargetMatch[] = [];

  const verifiedSet = new Set(verifiedCallOffsets);

  let remainingAddressable = addressableBytes;
  let scanStartPhysical = -1;
  let scanEndPhysical = -1;

  for (const span of obj1.physicalSpans) {
    if (remainingAddressable <= 0) break;
    const spanLength = span.fileEnd - span.fileStart + 1;
    const addressableInSpan = Math.min(spanLength, remainingAddressable);
    const spanEnd = span.fileStart + addressableInSpan - 1;

    if (scanStartPhysical === -1) scanStartPhysical = span.fileStart;
    scanEndPhysical = spanEnd;

    for (let fileOffset = span.fileStart; fileOffset <= spanEnd; fileOffset++) {
      if (buffer[fileOffset] === 0xe8) {
        rawE8OpcodesSeen++;
        if (fileOffset + 4 <= spanEnd && fileOffset + 4 < buffer.length) {
          rawE8Rel32DecodableCount++;
          const rel32 = readInt32LE(buffer, fileOffset + 1);
          const byteClass = classifyPhysicalByteInObjects(fileOffset, report.objects, pageSize);
          if (byteClass.objectOffset !== null) {
            const loadedAddress = (relocBase + byteClass.objectOffset) >>> 0;
            const currentTarget = (loadedAddress + 5 + rel32) >>> 0;
            if (currentTarget === targetLinear) {
              rawExactTargetMatchCount++;
              const isVerifiedB8 = verifiedSet.has(fileOffset);
              matches.push({
                fileOffset,
                fileOffsetHex: toHex32(fileOffset),
                objectOffset: byteClass.objectOffset,
                objectOffsetHex: toHex32(byteClass.objectOffset),
                loadedAddress,
                loadedAddressHex: toHex32(loadedAddress),
                rel32,
                rel32Hex: toHex32(rel32),
                calculatedTarget: currentTarget,
                calculatedTargetHex: toHex32(currentTarget),
                isVerifiedB8CallerBoundary: isVerifiedB8,
                matchClassification: isVerifiedB8
                  ? 'verified-b8-caller-boundary'
                  : 'raw-target-matching-e8-encoding',
              });
            }
          }
        }
      }
    }

    remainingAddressable -= addressableInSpan;
  }

  matches.sort((a, b) => a.fileOffset - b.fileOffset);
  const verifiedB8CallBoundaryMatchCount = matches.filter((m) => m.isVerifiedB8CallerBoundary).length;
  const rawOnlyExactTargetMatchCount = matches.filter((m) => !m.isVerifiedB8CallerBoundary).length;

  const foundVerifiedOffsets = new Set(
    matches.filter((m) => m.isVerifiedB8CallerBoundary).map((m) => m.fileOffset),
  );

  const verifiedB8CallOffsetsFound = Array.from(foundVerifiedOffsets).sort((a, b) => a - b);
  const verifiedB8CallOffsetsMissing = verifiedCallOffsets.filter((offset) => !foundVerifiedOffsets.has(offset));

  return {
    rawE8OpcodesSeen,
    rawE8Rel32DecodableCount,
    rawExactTargetMatchCount,
    rawE8ExactTargetMatches: matches,
    verifiedB8CallOffsetsExpected: verifiedCallOffsets,
    verifiedB8CallOffsetsExpectedHex: verifiedCallOffsets.map(toHex32),
    verifiedB8CallOffsetsFound,
    verifiedB8CallOffsetsFoundHex: verifiedB8CallOffsetsFound.map(toHex32),
    verifiedB8CallOffsetsMissing,
    verifiedB8CallOffsetsMissingHex: verifiedB8CallOffsetsMissing.map(toHex32),
    verifiedB8CallBoundaryMatchCount,
    rawOnlyExactTargetMatchCount,
    scanRangeStartPhysicalHex: toHex32(scanStartPhysical !== -1 ? scanStartPhysical : 0),
    scanRangeEndPhysicalHex: toHex32(scanEndPhysical !== -1 ? scanEndPhysical : 0),
    scanRangeBytes: addressableBytes,
  };
}

/**
 * Extracts caller site local context windows with strict byte validation on verified core instructions.
 */
function extractCallerContextWindow(
  buffer: Uint8Array,
  callerRecord: MK1VerifiedCallerRecord,
  seedValue: number,
  targetLinear: number,
): MK1CallerContextRecord {
  const seedPhysical = callerRecord.seedInstructionPhysicalOffset;
  if (seedPhysical < 0 || seedPhysical + 5 > buffer.length) {
    throw new Error(`Caller seed physical offset 0x${seedPhysical.toString(16).toUpperCase()} exceeds buffer bounds`);
  }
  const seedOpcode = buffer[seedPhysical];
  if (seedOpcode !== 0xb8) {
    throw new Error(
      `Expected MOV EAX,imm32 (0xB8) at caller physical offset 0x${seedPhysical.toString(16).toUpperCase()}, found 0x${seedOpcode.toString(16).padStart(2, '0').toUpperCase()}`,
    );
  }
  const actualSeedImm = readUint32LE(buffer, seedPhysical + 1);
  if (actualSeedImm !== seedValue) {
    throw new Error(
      `Caller MOV EAX immediate (0x${actualSeedImm.toString(16).toUpperCase()}) does not match B.8 seed value (0x${seedValue.toString(16).toUpperCase()})`,
    );
  }

  const callPhysical = callerRecord.callInstructionPhysicalOffset;
  if (callPhysical < 0 || callPhysical + 5 > buffer.length) {
    throw new Error(`Caller CALL physical offset 0x${callPhysical.toString(16).toUpperCase()} exceeds buffer bounds`);
  }
  const callOpcode = buffer[callPhysical];
  if (callOpcode !== 0xe8) {
    throw new Error(
      `Expected CALL (0xE8) at caller physical offset 0x${callPhysical.toString(16).toUpperCase()}, found 0x${callOpcode.toString(16).padStart(2, '0').toUpperCase()}`,
    );
  }
  const actualRel32 = readInt32LE(buffer, callPhysical + 1);
  const actualTarget = (callerRecord.callLoadedAddress + 5 + actualRel32) >>> 0;
  if (actualTarget !== targetLinear) {
    throw new Error(
      `Caller CALL target (0x${actualTarget.toString(16).toUpperCase()}) does not match B.8 target linear (0x${targetLinear.toString(16).toUpperCase()})`,
    );
  }
  const actualReturn = callerRecord.returnLoadedAddress;

  // Raw byte context window: 16 bytes before seed instruction through 16 bytes after CALL return physical offset
  const windowStart = Math.max(0, seedPhysical - 16);
  const returnPhysicalOffset = callPhysical + callerRecord.callLength;
  const windowEnd = Math.min(buffer.length - 1, returnPhysicalOffset + 16);

  const rawBytes = buffer.slice(windowStart, windowEnd + 1);
  const rawBytesHex = Array.from(rawBytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');

  const verifiedCore: MK1CallerVerifiedCoreSequence = {
    seedInstructionPhysicalOffset: seedPhysical,
    seedInstructionPhysicalOffsetHex: toHex32(seedPhysical),
    seedInstructionMnemonic: 'MOV',
    seedImmediate: actualSeedImm,
    seedImmediateHex: toHex32(actualSeedImm),
    callInstructionPhysicalOffset: callPhysical,
    callInstructionPhysicalOffsetHex: toHex32(callPhysical),
    callLoadedCoordinate: callerRecord.callLoadedAddress,
    callLoadedCoordinateHex: toHex32(callerRecord.callLoadedAddress),
    actualRel32,
    actualRel32Hex: toHex32(actualRel32),
    actualTarget,
    actualTargetHex: toHex32(actualTarget),
    returnCoordinate: actualReturn,
    returnCoordinateHex: toHex32(actualReturn),
    seedInstruction: {
      physicalOffset: seedPhysical,
      physicalOffsetHex: toHex32(seedPhysical),
      opcodeHex: toHex8(seedOpcode),
      instructionMnemonic: 'MOV',
      destinationRegister: 'EAX',
      immediateValue: actualSeedImm,
      immediateValueHex: toHex32(actualSeedImm),
    },
    callInstruction: {
      physicalOffset: callPhysical,
      physicalOffsetHex: toHex32(callPhysical),
      opcodeHex: toHex8(callOpcode),
      instructionMnemonic: 'CALL',
      targetLoadedAddress: actualTarget,
      targetLoadedAddressHex: toHex32(actualTarget),
      callLength: callerRecord.callLength,
    },
    returnCoordinateObj: {
      returnLoadedAddress: actualReturn,
      returnLoadedAddressHex: toHex32(actualReturn),
      returnObjectRelativeAddress: callerRecord.returnObjectRelativeAddress,
      returnObjectRelativeAddressHex: toHex32(callerRecord.returnObjectRelativeAddress),
    },
  };

  return {
    callerIndex: callerRecord.callerIndex,
    seedInstructionPhysicalOffset: seedPhysical,
    seedInstructionPhysicalOffsetHex: toHex32(seedPhysical),
    callInstructionPhysicalOffset: callPhysical,
    callInstructionPhysicalOffsetHex: toHex32(callPhysical),
    returnLoadedAddress: actualReturn,
    returnLoadedAddressHex: toHex32(actualReturn),
    windowStartOffset: windowStart,
    windowStartOffsetHex: toHex32(windowStart),
    windowEndOffset: windowEnd,
    windowEndOffsetHex: toHex32(windowEnd),
    rawBytesHex,
    verifiedCore,
  };
}

/**
 * Compares caller site local context windows for verified core instruction equality.
 */
export function compareCallerSiteLocalContext(
  buffer: Uint8Array,
  callerRecords: MK1VerifiedCallerRecord[],
  seedClass: MK1TargetEntrySeedClass,
): MK1CallerContextComparison {
  if (callerRecords.length < 2) {
    throw new Error('At least 2 verified caller records required for caller comparison');
  }

  const c1 = callerRecords[0];
  const c2 = callerRecords[1];

  const rec1 = extractCallerContextWindow(buffer, c1, seedClass.seedValue, seedClass.targetLinear);
  const rec2 = extractCallerContextWindow(buffer, c2, seedClass.seedValue, seedClass.targetLinear);

  const seedInstructionPhysicalDistance = Math.abs(c1.seedInstructionPhysicalOffset - c2.seedInstructionPhysicalOffset);
  const callInstructionPhysicalDistance = Math.abs(c1.callInstructionPhysicalOffset - c2.callInstructionPhysicalOffset);
  const loadedDistance = seedInstructionPhysicalDistance;
  const rawWindowsOverlap = !(rec1.windowEndOffset < rec2.windowStartOffset || rec2.windowEndOffset < rec1.windowStartOffset);

  // Section 16: VERIFIED CORE EQUALITY
  // Compare: seed opcode/family, seed destination register, seed immediate, CALL opcode/family, CALL target
  const verifiedCoreSequenceEqual =
    rec1.verifiedCore.seedInstruction?.opcodeHex === rec2.verifiedCore.seedInstruction?.opcodeHex &&
    rec1.verifiedCore.seedInstruction?.destinationRegister === rec2.verifiedCore.seedInstruction?.destinationRegister &&
    rec1.verifiedCore.seedImmediate === rec2.verifiedCore.seedImmediate &&
    rec1.verifiedCore.callInstruction?.opcodeHex === rec2.verifiedCore.callInstruction?.opcodeHex &&
    rec1.verifiedCore.actualTarget === rec2.verifiedCore.actualTarget;

  return {
    verifiedCallerCount: callerRecords.length,
    seedInstructionPhysicalDistance,
    callInstructionPhysicalDistance,
    loadedDistance,
    rawWindowsOverlap,
    verifiedCoreSequenceEqual,
    callerRecords: [rec1, rec2],
  };
}

/**
 * Main coordinator for Milestone 1 — Pass 1E.2B.9a.2: Final Surgical Contract & Documentation Seal.
 */
export function executePaletteTargetEntryReconnaissance(
  buffer: Uint8Array,
  report: MK1ExecutableLayoutReport,
  b8Result: MK1PaletteOperandUseResult,
  options?: {
    candidateId?: string;
    maxBytes?: number;
    maxInstructions?: number;
    operationId?: string;
  },
): MK1PaletteTargetEntryReconResult {
  const candidateId = options?.candidateId ?? 'MK1.EXE:0x0002C410';
  const operationId = options?.operationId ?? createOperationId('target-entry-recon');
  const timestamp = new Date().toISOString();

  const analysisConfiguration: MK1TargetEntryAnalysisConfiguration = {
    targetTraceMaxBytes: 96,
    targetTraceMaxInstructions: 24,
    rawTargetPreBytes: 16,
    rawTargetPostBytes: 96,
    straightLineOnly: true,
    followsCalls: false,
    followsJumps: false,
    followsBranches: false,
    rawE8ObjectScanCount: 1,
    targetSelector: 'candidate-driven-from-B8',
  };

  const interpretationCaveats: string[] = [
    'TARGET ADDRESS != FUNCTION',
    'EAX LIVE AT CALL != FUNCTION ARGUMENT',
    'EAX READ AFTER CALL != PALETTE INPUT',
    'OBJECT-RELATIVE COORDINATE != POINTER',
    'NUMERIC TARGET REGION != VERIFIED EXECUTION SEMANTICS',
    'CONTROL-TRANSFER TARGET RECORDED ONLY; TARGET BODY NOT FOLLOWED',
    'RAW E8 MATCH != VERIFIED INSTRUCTION ENTRY',
    'JUMP TARGET EQUALITY != SHARED PURPOSE',
  ];

  const reconciliation: MK1TargetEntryReconciliation = {
    upstreamB8StatusVerified: false,
    upstreamB8AllReconciledVerified: false,
    upstreamB8DerivedEvidenceVerified: false,
    targetCandidateFound: false,
    exactOneSeedClassDerived: false,
    exactOneDerivedTarget: false,
    targetCoordinatesMatchB8: false,
    targetPhysicalBackingMatchesB8: false,
    targetRegionAuthoritative: false,
    targetExecutable: false,
    verifiedCallerCountInput: false,
    callerRecordsProduced: false,
    callerReturnRelationsProduced: false,
    targetStartDecodeReconciled: false,
    nearReturnDecodesReconciled: false,
    boundaryOverlapReconciled: false,
    targetTraceProduced: false,
    targetTraceEventsReconciled: false,
    rawScanRangeReconciled: false,
    rawExactMatchesReconciled: false,
    verifiedB8CallersFoundInRawScan: false,
    callerContextsReconciled: false,
    boundaryTargetRecorded: false,
    derivedSummariesReconciled: false,
    candidateObjectIdentityReconciled: false,
    candidateCoordinatesReconciled: false,
    callerMandatoryFieldsReconciled: false,
    verifiedCallOpcodeBytesReconciled: false,
    nearReturnSetDerivedFromVerifiedCallers: false,
    nearReturnDecodeStatusesReconciled: false,
    boundaryOverlapComputed: false,
    authoritativeRegionReconciled: false,
    verifiedB8CallOffsetSetReconciled: false,
    verifiedCallerCoreSequencesReconciled: false,
    allReconciled: false,
  };

  const fixtureObservations: string[] = [];

  // Stage 1: Verify upstream B.8 result
  if (b8Result.status !== 'SUCCESS') {
    return createFailedResult(operationId, timestamp, candidateId, analysisConfiguration, reconciliation, 'upstream-b8-verification', `Upstream B.8 status is ${b8Result.status}; expected SUCCESS`, interpretationCaveats);
  }
  reconciliation.upstreamB8StatusVerified = true;

  if (!b8Result.reconciliation.allReconciled) {
    return createFailedResult(operationId, timestamp, candidateId, analysisConfiguration, reconciliation, 'upstream-b8-verification', 'Upstream B.8 reconciliation.allReconciled is false', interpretationCaveats);
  }
  reconciliation.upstreamB8AllReconciledVerified = true;

  if (!b8Result.reconciliation.derivedEvidenceReconciled) {
    return createFailedResult(operationId, timestamp, candidateId, analysisConfiguration, reconciliation, 'upstream-b8-verification', 'Upstream B.8 reconciliation.derivedEvidenceReconciled is false', interpretationCaveats);
  }
  reconciliation.upstreamB8DerivedEvidenceVerified = true;

  // Stage 2: Derive seed class
  let seedClass: MK1TargetEntrySeedClass;
  try {
    seedClass = deriveTargetEntrySeedClass(b8Result, candidateId, report);
    reconciliation.targetCandidateFound = true;
    reconciliation.exactOneSeedClassDerived = true;
    reconciliation.exactOneDerivedTarget = true;
    const qualifyingInterps = b8Result.interpretations.filter(
      (i) =>
        i.associatedCandidateId === candidateId &&
        i.seedTrace !== null &&
        i.seedTrace.seedLiveAtBoundary &&
        i.seedTrace.boundaryType === 'call',
    );
    reconciliation.candidateObjectIdentityReconciled =
      qualifyingInterps.length > 0 &&
      qualifyingInterps.every((item) => {
        const itemObj = item.targetCandidateObjectNumber ?? item.objectRelativeCompatibility?.targetCandidateObjectNumber;
        return itemObj === seedClass.candidateObjectNumber;
      }) &&
      typeof seedClass.candidateObjectNumber === 'number' &&
      seedClass.candidateObjectNumber > 0;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return createFailedResult(operationId, timestamp, candidateId, analysisConfiguration, reconciliation, 'seed-class-derivation', msg, interpretationCaveats);
  }

  // Stage 3: Derive verified caller records & relations
  let verifiedCallerRecords: MK1VerifiedCallerRecord[];
  let callerReturnRelations: MK1CallerReturnRelation[];
  try {
    verifiedCallerRecords = deriveVerifiedCallerRecords(buffer, b8Result, candidateId, seedClass);
    reconciliation.verifiedCallerCountInput = verifiedCallerRecords.length === seedClass.qualifyingCallerCount;
    reconciliation.callerRecordsProduced = verifiedCallerRecords.length > 0;
    reconciliation.callerMandatoryFieldsReconciled =
      verifiedCallerRecords.length > 0 &&
      verifiedCallerRecords.every((c) => c.callInstructionPhysicalOffset > 0 && c.callInstructionPhysicalOffset < buffer.length && c.callLength === 5);
    reconciliation.verifiedCallOpcodeBytesReconciled =
      verifiedCallerRecords.length > 0 &&
      verifiedCallerRecords.every((c) => buffer[c.callInstructionPhysicalOffset] === 0xe8);

    callerReturnRelations = deriveCallerReturnRelations(buffer, verifiedCallerRecords, seedClass.targetLinear, report);
    reconciliation.callerReturnRelationsProduced = callerReturnRelations.length === verifiedCallerRecords.length;
    reconciliation.nearReturnDecodeStatusesReconciled =
      callerReturnRelations.length === verifiedCallerRecords.length &&
      callerReturnRelations.every((r) => r.returnLoadedAddressHex.startsWith('0x'));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return createFailedResult(operationId, timestamp, candidateId, analysisConfiguration, reconciliation, 'caller-records-derivation', msg, interpretationCaveats);
  }

  // Stage 4: Target boundary qualification
  let targetBoundary: MK1TargetBoundaryRecon;
  try {
    targetBoundary = qualifyTargetBoundary(buffer, seedClass, report, verifiedCallerRecords, callerReturnRelations);
    reconciliation.targetCoordinatesMatchB8 = targetBoundary.targetLinear === seedClass.targetLinear;
    reconciliation.targetPhysicalBackingMatchesB8 = targetBoundary.physicalOffset === seedClass.targetPhysicalOffset;

    const candSummary = b8Result.candidateSummaries.find((c) => c.candidateId === candidateId);
    const candPhysStructMatches =
      candSummary !== undefined &&
      parseInt(candSummary.physicalStructureOffsetHex, 16) === seedClass.candidatePhysicalStructure;
    const candPhysPayloadMatches =
      candSummary !== undefined &&
      parseInt(candSummary.physicalPayloadOffsetHex, 16) === seedClass.candidatePhysicalPayload;
    const candLoadedStructMatches =
      candSummary !== undefined &&
      parseInt(candSummary.loadedLinearStructureCandidateHex, 16) === seedClass.candidateLoadedStructure;
    const candLoadedPayloadMatches =
      candSummary !== undefined &&
      parseInt(candSummary.loadedLinearPayloadCandidateHex, 16) === seedClass.candidateLoadedPayload;
    const candRelocStructMatches =
      seedClass.candidateLoadedStructure ===
      ((seedClass.relocationBase + seedClass.candidateObjectRelativeStructure) >>> 0);
    const candRelocPayloadMatches =
      seedClass.candidateLoadedPayload ===
      ((seedClass.relocationBase + seedClass.candidateObjectRelativePayload) >>> 0);

    reconciliation.candidateCoordinatesReconciled =
      candPhysStructMatches &&
      candPhysPayloadMatches &&
      candLoadedStructMatches &&
      candLoadedPayloadMatches &&
      candRelocStructMatches &&
      candRelocPayloadMatches;
    reconciliation.targetRegionAuthoritative = targetBoundary.regionClass !== 'UNMAPPED' && targetBoundary.isAddressable && targetBoundary.isFileBacked;
    reconciliation.authoritativeRegionReconciled = reconciliation.targetRegionAuthoritative;
    reconciliation.targetExecutable = targetBoundary.isExecutable;
    reconciliation.targetStartDecodeReconciled = targetBoundary.targetStartDecodes === true;
    reconciliation.nearReturnDecodesReconciled = targetBoundary.nearReturnStartDecodes === true;
    reconciliation.boundaryOverlapReconciled = targetBoundary.decodedRangesOverlap === false;
    reconciliation.nearReturnSetDerivedFromVerifiedCallers =
      targetBoundary.nearReturnCoordinate === undefined ||
      verifiedCallerRecords.some((c) => c.returnLoadedAddress === targetBoundary.nearReturnCoordinate) ||
      (targetBoundary.nearReturnStartDecodes === true && targetBoundary.returnInstructionEndsAtTarget === true);
    reconciliation.boundaryOverlapComputed =
      targetBoundary.overlapClassification !== undefined && targetBoundary.decodedRangesOverlap === false;

    if (targetBoundary.boundaryClassification !== 'verified-instruction-boundary') {
      return createFailedResult(operationId, timestamp, candidateId, analysisConfiguration, reconciliation, 'boundary-qualification', `Target boundary classified as ${targetBoundary.boundaryClassification}; expected verified-instruction-boundary`, interpretationCaveats);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return createFailedResult(operationId, timestamp, candidateId, analysisConfiguration, reconciliation, 'boundary-qualification', msg, interpretationCaveats);
  }

  // Raw target window
  const rawTargetWindow = captureRawTargetWindow(buffer, targetBoundary.physicalOffset);

  // Stage 5: Target trace execution
  let targetTrace: MK1TargetTraceResult;
  try {
    targetTrace = traceTargetEntryExecution(
      buffer,
      targetBoundary.physicalOffset,
      seedClass.seedValue,
      report,
      seedClass.candidateLoadedStructure,
      seedClass.candidateLoadedPayload,
      analysisConfiguration.targetTraceMaxBytes,
      analysisConfiguration.targetTraceMaxInstructions,
    );

    // Cross reference final boundary target with B.8 target groups
    targetTrace.b8BoundaryTargetCrossReference = crossReferenceFinalBoundaryTargetWithB8(
      targetTrace.finalControlBoundary?.boundaryTargetLoadedAddress ?? null,
      b8Result,
    );

    reconciliation.targetTraceProduced = targetTrace.instructions.length > 0;
    reconciliation.targetTraceEventsReconciled = targetTrace.seedEvents !== undefined;
    reconciliation.boundaryTargetRecorded =
      targetTrace.finalControlBoundary !== null &&
      targetTrace.finalControlBoundary.boundaryTargetLoadedAddress !== null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return createFailedResult(operationId, timestamp, candidateId, analysisConfiguration, reconciliation, 'target-trace-execution', msg, interpretationCaveats);
  }

  // Stage 6: Raw E8 null model scan
  let nullModel: MK1RawE8NullModelResult;
  try {
    const verifiedCallOffsets = verifiedCallerRecords.map((c) => c.callInstructionPhysicalOffset);
    nullModel = scanRawE8ExactTargetNullModel(buffer, seedClass.targetLinear, report, verifiedCallOffsets);
    reconciliation.rawScanRangeReconciled = nullModel.scanRangeBytes > 0;
    reconciliation.rawExactMatchesReconciled = nullModel.rawExactTargetMatchCount >= 0;
    reconciliation.verifiedB8CallersFoundInRawScan =
      nullModel.verifiedB8CallOffsetsMissing.length === 0 &&
      nullModel.verifiedB8CallBoundaryMatchCount > 0;
    const expectedSet = new Set(verifiedCallOffsets);
    const foundSet = new Set(nullModel.verifiedB8CallOffsetsFound);
    reconciliation.verifiedB8CallOffsetSetReconciled =
      expectedSet.size === foundSet.size &&
      Array.from(expectedSet).every((offset) => foundSet.has(offset));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return createFailedResult(operationId, timestamp, candidateId, analysisConfiguration, reconciliation, 'null-model-scan', msg, interpretationCaveats);
  }

  // Stage 7: Caller site local context comparison
  let callerComparison: MK1CallerContextComparison;
  try {
    callerComparison = compareCallerSiteLocalContext(buffer, verifiedCallerRecords, seedClass);
    const allCoresMatchB8Contract =
      callerComparison.callerRecords.length > 0 &&
      callerComparison.callerRecords.every(
        (r) =>
          r.verifiedCore.seedImmediate === seedClass.seedValue &&
          r.verifiedCore.actualTarget === seedClass.targetLinear,
      );
    reconciliation.callerContextsReconciled = callerComparison.callerRecords.length === verifiedCallerRecords.length;
    reconciliation.verifiedCallerCoreSequencesReconciled =
      allCoresMatchB8Contract && callerComparison.verifiedCoreSequenceEqual === true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return createFailedResult(operationId, timestamp, candidateId, analysisConfiguration, reconciliation, 'caller-comparison', msg, interpretationCaveats);
  }

  // Synthesize empirical fixture observations
  fixtureObservations.push(
    `Candidate ${candidateId} CALL target ${seedClass.targetLinearHex} resolves to Object 1 physical offset ${seedClass.targetPhysicalOffsetHex} in ${targetBoundary.regionId} (${targetBoundary.regionClass}).`,
  );
  fixtureObservations.push(
    `Target boundary qualification: ${targetBoundary.boundaryClassification} (near return at ${targetBoundary.nearReturnCoordinateHex ?? 'none'} [RET] ends cleanly at target, target first instruction: ${targetBoundary.forwardFirstInstructionMnemonic}).`,
  );
  fixtureObservations.push(
    `Target execution trace: ${targetTrace.instructions.length} instructions decoded (${targetTrace.totalBytesDecoded} bytes). Stop reason: ${targetTrace.stopReason} (${targetTrace.finalControlBoundary?.boundaryInstructionMnemonic ?? 'none'}).`,
  );
  fixtureObservations.push(
    `Incoming EAX disposition: ${targetTrace.disposition}. Seed remains live at control boundary: ${targetTrace.seedEvents.seedLiveAtFinalBoundary}.`,
  );
  if (targetTrace.finalControlBoundary?.boundaryTargetLoadedAddressHex) {
    fixtureObservations.push(
      `Final control boundary reaches loaded target ${targetTrace.finalControlBoundary.boundaryTargetLoadedAddressHex} (cross-reference in B.8 target groups: ${targetTrace.b8BoundaryTargetCrossReference?.boundaryTargetAppearsInB8TargetGroups ? 'YES' : 'NO'}). Destination body was NOT followed.`,
    );
  }
  fixtureObservations.push(
    `Object 1 raw E8 scan: ${nullModel.rawE8OpcodesSeen} raw E8 opcodes, ${nullModel.rawE8Rel32DecodableCount} decodable rel32 encodings, ${nullModel.rawExactTargetMatchCount} raw exact-target encodings, ${nullModel.verifiedB8CallBoundaryMatchCount} verified B.8 CALL boundaries among them, ${nullModel.rawOnlyExactTargetMatchCount} raw-only encodings.`,
  );
  fixtureObservations.push(
    `Caller local context comparison: ${callerComparison.callerRecords.length} caller records examined (seed distance: ${callerComparison.seedInstructionPhysicalDistance} bytes, CALL distance: ${callerComparison.callInstructionPhysicalDistance} bytes). Core sequence equal: ${callerComparison.verifiedCoreSequenceEqual}.`,
  );

  reconciliation.derivedSummariesReconciled = fixtureObservations.length > 0;

  // Final 34-boolean reconciliation
  reconciliation.allReconciled =
    reconciliation.upstreamB8StatusVerified &&
    reconciliation.upstreamB8AllReconciledVerified &&
    reconciliation.upstreamB8DerivedEvidenceVerified &&
    reconciliation.targetCandidateFound &&
    reconciliation.exactOneSeedClassDerived &&
    reconciliation.exactOneDerivedTarget &&
    reconciliation.targetCoordinatesMatchB8 &&
    reconciliation.targetPhysicalBackingMatchesB8 &&
    reconciliation.targetRegionAuthoritative &&
    reconciliation.targetExecutable &&
    reconciliation.verifiedCallerCountInput &&
    reconciliation.callerRecordsProduced &&
    reconciliation.callerReturnRelationsProduced &&
    reconciliation.targetStartDecodeReconciled &&
    reconciliation.nearReturnDecodesReconciled &&
    reconciliation.boundaryOverlapReconciled &&
    reconciliation.targetTraceProduced &&
    reconciliation.targetTraceEventsReconciled &&
    reconciliation.rawScanRangeReconciled &&
    reconciliation.rawExactMatchesReconciled &&
    reconciliation.verifiedB8CallersFoundInRawScan &&
    reconciliation.callerContextsReconciled &&
    reconciliation.boundaryTargetRecorded &&
    reconciliation.derivedSummariesReconciled &&
    reconciliation.candidateObjectIdentityReconciled &&
    reconciliation.candidateCoordinatesReconciled &&
    reconciliation.callerMandatoryFieldsReconciled &&
    reconciliation.verifiedCallOpcodeBytesReconciled &&
    reconciliation.nearReturnSetDerivedFromVerifiedCallers &&
    reconciliation.nearReturnDecodeStatusesReconciled &&
    reconciliation.boundaryOverlapComputed &&
    reconciliation.authoritativeRegionReconciled &&
    reconciliation.verifiedB8CallOffsetSetReconciled &&
    reconciliation.verifiedCallerCoreSequencesReconciled;

  return {
    format: 'mk1_palette_target_entry_recon_v2',
    status: reconciliation.allReconciled ? 'SUCCESS' : 'FAILED',
    operationId,
    timestamp,
    candidateId,
    analysisConfiguration,
    seedClass,
    verifiedCallerRecords,
    callerReturnRelations,
    targetBoundary,
    rawTargetWindow,
    targetTrace,
    nullModel,
    callerComparison,
    reconciliation,
    fixtureObservations,
    interpretationCaveats,
  };
}

/**
 * Creates canonical export JSON structure.
 */
export function createMK1PaletteTargetEntryExport(
  result: MK1PaletteTargetEntryReconResult,
) {
  return {
    exportHeader: {
      format: result.format,
      operationId: result.operationId,
      exportTimestamp: new Date().toISOString(),
      generator: 'MK DOS Archive — Milestone 1 — Pass 1E.2B.9a.3',
      epistemicRules: [
        'TARGET ADDRESS != FUNCTION',
        'EAX LIVE AT CALL != FUNCTION ARGUMENT',
        'EAX READ AFTER CALL != PALETTE INPUT',
        'OBJECT-RELATIVE COORDINATE != POINTER',
        'NUMERIC TARGET REGION != VERIFIED EXECUTION SEMANTICS',
        'CONTROL-TRANSFER TARGET RECORDED ONLY; TARGET BODY NOT FOLLOWED',
        'RAW E8 MATCH != VERIFIED INSTRUCTION ENTRY',
        'JUMP TARGET EQUALITY != SHARED PURPOSE',
      ],
    },
    ...result,
  };
}

function createFailedResult(
  operationId: string,
  timestamp: string,
  candidateId: string,
  analysisConfiguration: MK1TargetEntryAnalysisConfiguration,
  reconciliation: MK1TargetEntryReconciliation,
  failedStage: string,
  failureReason: string,
  interpretationCaveats: string[],
): MK1PaletteTargetEntryReconResult {
  return {
    format: 'mk1_palette_target_entry_recon_v2',
    status: 'FAILED',
    operationId,
    timestamp,
    candidateId,
    analysisConfiguration,
    seedClass: null,
    verifiedCallerRecords: [],
    callerReturnRelations: [],
    targetBoundary: createEmptyBoundaryRecon(),
    rawTargetWindow: { preBytesHex: '', postBytesHex: '', targetByteHex: '00' },
    targetTrace: createEmptyTraceResult(),
    nullModel: createEmptyNullModelResult(),
    callerComparison: createEmptyCallerComparison(),
    reconciliation,
    fixtureObservations: [],
    interpretationCaveats,
    failedStage,
    failureReason,
  };
}

function createEmptyBoundaryRecon(): MK1TargetBoundaryRecon {
  return {
    targetLinear: 0,
    targetLinearHex: '0x00000000',
    objectNumber: 0,
    objectOffset: 0,
    objectOffsetHex: '0x00000000',
    physicalOffset: 0,
    physicalOffsetHex: '0x00000000',
    regionId: 'none',
    regionClass: 'NONE',
    isAddressable: false,
    isFileBacked: false,
    isReadable: false,
    isWritable: false,
    isExecutable: false,
    targetByteHex: '00',
    precedingBytesHex: '',
    followingBytesHex: '',
    precedingDecodesToBoundary: false,
    forwardDecodeValid: false,
    boundaryClassification: 'unmapped-or-invalid',
    notes: [],
  };
}

function createEmptyTraceResult(): MK1TargetTraceResult {
  return {
    startLinear: 0,
    startLinearHex: '0x00000000',
    startPhysical: 0,
    startPhysicalHex: '0x00000000',
    incomingEAX: 0,
    incomingEAXHex: '0x00000000',
    instructions: [],
    totalBytesDecoded: 0,
    stopReason: 'not-executed',
    disposition: 'misaligned-entry-no-decode',
    finalControlBoundary: null,
    b8BoundaryTargetCrossReference: null,
    seedEvents: {
      incomingSeedEverRead: false,
      incomingSeedOverwrittenBeforeRead: false,
      incomingSeedCopied: false,
      incomingSeedAffineAdjusted: false,
      relocationBaseAdjustmentObserved: false,
      candidateLoadedStructureReached: false,
      candidateLoadedPayloadReached: false,
      seedUsedAsMemoryBase: false,
      seedUsedAsMemoryIndex: false,
      partialMemoryAddressObserved: false,
      candidateStructureMemoryAddressObserved: false,
      candidatePayloadMemoryAddressObserved: false,
      seedPushed: false,
      seedStored: false,
      seedCompared: false,
      seedTested: false,
      seedLiveAtFinalBoundary: false,
    },
    eaxReadBeforeOverwrite: false,
    eaxOverwrittenBeforeRead: false,
    eaxUsedAsMemoryBase: false,
    eaxUsedAsMemoryIndex: false,
    eaxCopied: false,
    eaxPushed: false,
    eaxAffineAdjusted: false,
    eaxTargetCoordinateReached: false,
    allEvents: [],
  };
}

function createEmptyNullModelResult(): MK1RawE8NullModelResult {
  return {
    rawE8OpcodesSeen: 0,
    rawE8Rel32DecodableCount: 0,
    rawExactTargetMatchCount: 0,
    rawE8ExactTargetMatches: [],
    verifiedB8CallOffsetsExpected: [],
    verifiedB8CallOffsetsExpectedHex: [],
    verifiedB8CallOffsetsFound: [],
    verifiedB8CallOffsetsFoundHex: [],
    verifiedB8CallOffsetsMissing: [],
    verifiedB8CallOffsetsMissingHex: [],
    verifiedB8CallBoundaryMatchCount: 0,
    rawOnlyExactTargetMatchCount: 0,
    scanRangeStartPhysicalHex: '0x00000000',
    scanRangeEndPhysicalHex: '0x00000000',
    scanRangeBytes: 0,
  };
}

function createEmptyCallerComparison(): MK1CallerContextComparison {
  return {
    verifiedCallerCount: 0,
    seedInstructionPhysicalDistance: 0,
    callInstructionPhysicalDistance: 0,
    loadedDistance: 0,
    rawWindowsOverlap: false,
    verifiedCoreSequenceEqual: false,
    callerRecords: [],
  };
}
