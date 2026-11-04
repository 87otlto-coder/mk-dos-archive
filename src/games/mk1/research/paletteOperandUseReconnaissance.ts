/**
 * MK1 Executable Palette Operand Address-Space Compatibility &
 * Bounded Straight-Line Seed-Use Reconnaissance Engine (Milestone 1E.2B.8a)
 *
 * Implements the B.8 micro-decoder, address-space compatibility classifier,
 * bounded straight-line seed-use tracer, and CALL-boundary target-space reconnaissance
 * for code-facing candidate references.
 */

import {
  MK1ExecutableLayoutReport,
} from './executableLayoutTypes';
import {
  classifyPhysicalByteInObjects,
  objectOffsetToFileOffset,
} from '../../../core/executable/le/leAddressMap';
import { findContainingRegion } from './paletteReferenceReconnaissance';
import {
  PaletteRepresentationKind,
} from './paletteReferenceReconnaissanceTypes';
import {
  MK1PaletteOccurrenceContextResult,
  PhysicalPositionContextClassification,
  X86OperandShapeClass,
} from './paletteOccurrenceContextTypes';
import {
  MK1PaletteCandidateEvidenceFusionResult,
  MK1PaletteCandidateEvidenceProfile,
} from './paletteCandidateEvidenceFusionTypes';
import {
  MK1PaletteReferenceChainReconResult,
  MK1SecondOrderPhysicalReferrer,
} from './paletteReferenceChainReconnaissanceTypes';
import {
  createOperationId,
  logError,
  logInfo,
  logStageCheckpoint,
} from '../../../core/diagnostics/diagnosticLogger';
import {
  MK1CodeFacingSiteRecord,
  MK1CompactPaletteOperandUseExport,
  MK1DecodedTraceInstruction,
  MK1LinearAddressResolutionClass,
  MK1ObjectRelativeCompatibility,
  MK1OperandInterpretationRecord,
  MK1OperandSemanticClass,
  MK1OperandUseGlobalSummary,
  MK1OperandUseReconciliation,
  MK1PaletteOperandUseResult,
  MK1PropagationEvent,
  MK1SeedTraceResult,
  MK1SeedTraceStatus,
  MK1TraceConfiguration,
  MK1TraceStopReason,
  X86Register32,
  X86RegisterState,
} from './paletteOperandUseReconnaissanceTypes';
import {
  computeCallBoundaryTargetRecon,
  groupCallBoundaryTargets,
  groupLocalSeedUseSignatures,
  summarizeCallBoundaries,
} from './paletteOperandCallBoundary';
import {
  buildAddressSpaceMatrix,
  buildCandidateSummaries,
  buildControlsSummary,
  buildDecisionPatternTable,
  buildSeedTraceEventSummary,
  buildSeedTraceStopReasonSummary,
  buildTwoHopTargetSummaries,
} from './paletteOperandSummaries';

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

function toHex8(val: number): string {
  return '0x' + (val & 0xff).toString(16).padStart(2, '0').toUpperCase();
}

function readUint32LE(buffer: Uint8Array, offset: number): number {
  if (offset + 4 > buffer.length) return 0;
  return (
    (buffer[offset] |
      (buffer[offset + 1] << 8) |
      (buffer[offset + 2] << 16) |
      (buffer[offset + 3] << 24)) >>>
    0
  );
}

function readInt32LE(buffer: Uint8Array, offset: number): number {
  if (offset + 4 > buffer.length) return 0;
  return (
    buffer[offset] |
    (buffer[offset + 1] << 8) |
    (buffer[offset + 2] << 16) |
    (buffer[offset + 3] << 24)
  );
}

function readInt8(buffer: Uint8Array, offset: number): number {
  if (offset >= buffer.length) return 0;
  const b = buffer[offset];
  return b & 0x80 ? b - 0x100 : b;
}

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

const GROUP1_ALU_NAMES = ['ADD', 'OR', 'ADC', 'SBB', 'AND', 'SUB', 'XOR', 'CMP'];

function createInitialRegisterMap(): Record<X86Register32, X86RegisterState> {
  const map: Record<X86Register32, X86RegisterState> = {
    EAX: { register: 'EAX', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000', affineSeedDelta: 0 },
    ECX: { register: 'ECX', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000', affineSeedDelta: 0 },
    EDX: { register: 'EDX', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000', affineSeedDelta: 0 },
    EBX: { register: 'EBX', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000', affineSeedDelta: 0 },
    ESP: { register: 'ESP', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000', affineSeedDelta: 0 },
    EBP: { register: 'EBP', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000', affineSeedDelta: 0 },
    ESI: { register: 'ESI', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000', affineSeedDelta: 0 },
    EDI: { register: 'EDI', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000', affineSeedDelta: 0 },
  };
  return map;
}

function cloneRegisterMap(
  src: Record<X86Register32, X86RegisterState>,
): Record<X86Register32, X86RegisterState> {
  const map: Record<X86Register32, X86RegisterState> = {
    EAX: { ...src.EAX },
    ECX: { ...src.ECX },
    EDX: { ...src.EDX },
    EBX: { ...src.EBX },
    ESP: { ...src.ESP },
    EBP: { ...src.EBP },
    ESI: { ...src.ESI },
    EDI: { ...src.EDI },
  };
  return map;
}

/**
 * Checks for segment override prefixes immediately preceding the instruction opcode.
 */
function detectSegmentOverride(
  buffer: Uint8Array,
  instructionStartOffset: number,
): { hasOverride: boolean; prefixHex: string | null } {
  if (instructionStartOffset <= 0) {
    return { hasOverride: false, prefixHex: null };
  }
  const prevByte = buffer[instructionStartOffset - 1];
  // Standard x86 segment overrides: 0x26 (ES), 0x2E (CS), 0x36 (SS), 0x3E (DS), 0x64 (FS), 0x65 (GS)
  if (
    prevByte === 0x26 ||
    prevByte === 0x2e ||
    prevByte === 0x36 ||
    prevByte === 0x3e ||
    prevByte === 0x64 ||
    prevByte === 0x65
  ) {
    return { hasOverride: true, prefixHex: toHex8(prevByte) };
  }
  return { hasOverride: false, prefixHex: null };
}

/**
 * Classifies the instruction operand semantic class according to B.8 Section 19.
 */
export function classifyOperandSemanticClass(
  shapeClass: X86OperandShapeClass,
  opcodeBytesHex: string,
  instructionFileOffset: number,
  buffer: Uint8Array,
): {
  semanticClass: MK1OperandSemanticClass;
  destinationRegister: X86Register32 | null;
  dereferenceShapePresent: boolean;
  dereferencePerformed: boolean;
} {
  switch (shapeClass) {
    case 'mov-r32-imm32': {
      // Opcode is 0xB8 + reg
      const opByte = buffer[instructionFileOffset];
      const regIdx = opByte >= 0xb8 && opByte <= 0xbf ? opByte - 0xb8 : 0;
      return {
        semanticClass: 'register-immediate-seed',
        destinationRegister: REGISTERS[regIdx] ?? 'EAX',
        dereferenceShapePresent: false,
        dereferencePerformed: false,
      };
    }
    case 'push-imm32':
      return {
        semanticClass: 'push-immediate-value',
        destinationRegister: null,
        dereferenceShapePresent: false,
        dereferencePerformed: false,
      };
    case 'accumulator-imm32':
      return {
        semanticClass: 'accumulator-arithmetic-immediate',
        destinationRegister: 'EAX',
        dereferenceShapePresent: false,
        dereferencePerformed: false,
      };
    case 'moffs32-direct': {
      const opByte = buffer[instructionFileOffset];
      const isStore = opByte === 0xa3;
      return {
        semanticClass: isStore ? 'direct-memory-store-address' : 'direct-memory-load-address',
        destinationRegister: isStore ? null : 'EAX',
        dereferenceShapePresent: true,
        dereferencePerformed: false,
      };
    }
    case 'disp32-absolute': {
      const opByte = buffer[instructionFileOffset];
      if (opByte === 0x8d) {
        // LEA r32, [disp32]
        const modrm = buffer[instructionFileOffset + 1];
        const regIdx = (modrm >> 3) & 7;
        return {
          semanticClass: 'lea-address-computation',
          destinationRegister: REGISTERS[regIdx] ?? 'EAX',
          dereferenceShapePresent: false,
          dereferencePerformed: false,
        };
      }
      if (opByte === 0x89) {
        // MOV [disp32], r32 -> memory store
        return {
          semanticClass: 'direct-memory-store-address',
          destinationRegister: null,
          dereferenceShapePresent: true,
          dereferencePerformed: false,
        };
      }
      if (opByte === 0x8b) {
        // MOV r32, [disp32] -> memory load
        const modrm = buffer[instructionFileOffset + 1];
        const regIdx = (modrm >> 3) & 7;
        return {
          semanticClass: 'direct-memory-load-address',
          destinationRegister: REGISTERS[regIdx] ?? 'EAX',
          dereferenceShapePresent: true,
          dereferencePerformed: false,
        };
      }
      return {
        semanticClass: 'other-whitelisted-immediate',
        destinationRegister: null,
        dereferenceShapePresent: false,
        dereferencePerformed: false,
      };
    }
    default:
      return {
        semanticClass: 'other-whitelisted-immediate',
        destinationRegister: null,
        dereferenceShapePresent: false,
        dereferencePerformed: false,
      };
  }
}

/**
 * Evaluates direct linear address resolution for an operand value.
 */
export function evaluateDirectLinearResolution(
  operandValue: number,
  semanticClass: MK1OperandSemanticClass,
  hasSegmentOverride: boolean,
  report: MK1ExecutableLayoutReport,
  candidateProfile: MK1PaletteCandidateEvidenceProfile | undefined,
): {
  resolutionClass: MK1LinearAddressResolutionClass;
  resolvedObjectNumber: number | null;
  resolvedObjectOffset: number | null;
  resolvedObjectOffsetHex: string | null;
  resolvedPhysicalOffset: number | null;
  resolvedPhysicalOffsetHex: string | null;
  resolvedRegionId: string | null;
  matchesAssociatedTarget: boolean;
} {
  const isDirectAddressCandidate =
    semanticClass === 'direct-memory-load-address' ||
    semanticClass === 'direct-memory-store-address' ||
    semanticClass === 'lea-address-computation';

  if (!isDirectAddressCandidate) {
    return {
      resolutionClass: 'not-applicable-non-address-operand',
      resolvedObjectNumber: null,
      resolvedObjectOffset: null,
      resolvedObjectOffsetHex: null,
      resolvedPhysicalOffset: null,
      resolvedPhysicalOffsetHex: null,
      resolvedRegionId: null,
      matchesAssociatedTarget: false,
    };
  }

  if (hasSegmentOverride) {
    return {
      resolutionClass: 'segment-override-unresolved',
      resolvedObjectNumber: null,
      resolvedObjectOffset: null,
      resolvedObjectOffsetHex: null,
      resolvedPhysicalOffset: null,
      resolvedPhysicalOffsetHex: null,
      resolvedRegionId: null,
      matchesAssociatedTarget: false,
    };
  }

  if (!report.parsedHeader || typeof report.parsedHeader.pageSize !== 'number' || report.parsedHeader.pageSize <= 0) {
    throw new Error('Missing or invalid parsed header / pageSize in executable layout report');
  }
  const pageSize = report.parsedHeader.pageSize;

  for (const obj of report.objects) {
    const start = obj.relocationBaseAddress;
    const end = start + obj.virtualSize;
    if (operandValue >= start && operandValue < end) {
      const objOffset = operandValue - start;
      const physicalBacking = objectOffsetToFileOffset(
        obj.objectNumber,
        objOffset,
        report.objects,
        report.pageMap,
        pageSize,
      );

      let regionId: string | null = null;
      if (physicalBacking !== null) {
        const authRegion = report.topology?.regions
          ? findContainingRegion(physicalBacking, report.topology.regions)
          : null;
        if (!authRegion) {
          throw new Error(
            `Physically backed byte offset ${toHex32(physicalBacking)} does not resolve to an authoritative topology region`,
          );
        }
        regionId = authRegion.regionId;
      }

      let matches = false;
      let resClass: MK1LinearAddressResolutionClass = 'resolves-other-loaded-location';

      if (candidateProfile) {
        const loadedStruct = candidateProfile.topology.targetLoadedAddress;
        const loadedPayload = candidateProfile.topology.targetLoadedPayloadAddress;

        if (loadedStruct !== null && operandValue === loadedStruct) {
          resClass = 'exact-associated-structure-linear';
          matches = true;
        } else if (loadedPayload !== null && operandValue === loadedPayload) {
          resClass = 'exact-associated-payload-linear';
          matches = true;
        }
      }

      return {
        resolutionClass: resClass,
        resolvedObjectNumber: obj.objectNumber,
        resolvedObjectOffset: objOffset,
        resolvedObjectOffsetHex: toHex32(objOffset),
        resolvedPhysicalOffset: physicalBacking,
        resolvedPhysicalOffsetHex: physicalBacking !== null ? toHex32(physicalBacking) : null,
        resolvedRegionId: regionId,
        matchesAssociatedTarget: matches,
      };
    }
  }

  return {
    resolutionClass: 'linear-address-unmapped',
    resolvedObjectNumber: null,
    resolvedObjectOffset: null,
    resolvedObjectOffsetHex: null,
    resolvedPhysicalOffset: null,
    resolvedPhysicalOffsetHex: null,
    resolvedRegionId: null,
    matchesAssociatedTarget: false,
  };
}

/**
 * Evaluates object-relative compatibility according to Sections 31-33.
 */
export function evaluateObjectRelativeCompatibility(
  operandValue: number,
  associatedRepKind: PaletteRepresentationKind | 'first-hop-site-offset',
  candidateProfile: MK1PaletteCandidateEvidenceProfile | undefined,
  report: MK1ExecutableLayoutReport,
): MK1ObjectRelativeCompatibility {
  const isObjectRelativeRep =
    associatedRepKind === 'object-relative-structure' ||
    associatedRepKind === 'object-relative-payload';

  let targetCandidateObjectNumber: number | null = null;
  let targetObjectRelocationBase: number | null = null;
  let associatedTargetLoadedAddress: number | null = null;

  if (candidateProfile) {
    targetCandidateObjectNumber = candidateProfile.topology.targetObjectNumber;
    if (targetCandidateObjectNumber !== null) {
      const targetObj = report.objects.find(
        (o) => o.objectNumber === targetCandidateObjectNumber,
      );
      if (targetObj) {
        targetObjectRelocationBase = targetObj.relocationBaseAddress;
      }
    }

    if (associatedRepKind === 'object-relative-structure') {
      associatedTargetLoadedAddress = candidateProfile.topology.targetLoadedAddress;
    } else if (associatedRepKind === 'object-relative-payload') {
      associatedTargetLoadedAddress = candidateProfile.topology.targetLoadedPayloadAddress;
    }
  }

  let requiredBase: number | null = null;
  let requiredBaseEqualsReloc = false;

  if (associatedTargetLoadedAddress !== null) {
    requiredBase = (associatedTargetLoadedAddress - operandValue) >>> 0;
    if (targetObjectRelocationBase !== null) {
      requiredBaseEqualsReloc = requiredBase === targetObjectRelocationBase;
    }
  }

  let equalsAssociatedObjectRelativeStructure = false;
  let equalsAssociatedObjectRelativePayload = false;

  if (candidateProfile && targetObjectRelocationBase !== null) {
    const loadedStruct = candidateProfile.topology.targetLoadedAddress;
    const loadedPayload = candidateProfile.topology.targetLoadedPayloadAddress;
    if (loadedStruct !== null) {
      const objRelStruct = (loadedStruct - targetObjectRelocationBase) >>> 0;
      equalsAssociatedObjectRelativeStructure = operandValue === objRelStruct;
    }
    if (loadedPayload !== null) {
      const objRelPayload = (loadedPayload - targetObjectRelocationBase) >>> 0;
      equalsAssociatedObjectRelativePayload = operandValue === objRelPayload;
    }
  }

  return {
    isObjectRelativeOperand: isObjectRelativeRep,
    operandUint32Value: operandValue,
    operandUint32Hex: toHex32(operandValue),
    associatedRepresentationKind: associatedRepKind,
    targetCandidateObjectNumber,
    targetObjectRelocationBase,
    targetObjectRelocationBaseHex:
      targetObjectRelocationBase !== null ? toHex32(targetObjectRelocationBase) : null,
    associatedTargetLoadedAddress,
    associatedTargetLoadedAddressHex:
      associatedTargetLoadedAddress !== null ? toHex32(associatedTargetLoadedAddress) : null,
    requiredBaseToReachTargetLoadedAddress: requiredBase,
    requiredBaseHex: requiredBase !== null ? toHex32(requiredBase) : null,
    requiredBaseEqualsTargetObjectRelocationBase: requiredBaseEqualsReloc,
    equalsAssociatedObjectRelativeStructure,
    equalsAssociatedObjectRelativePayload,
  };
}

/**
 * Micro-decoder and straight-line tracer for a single seed operand.
 */
export function traceStraightLineSeedUse(
  buffer: Uint8Array,
  seedSiteOffset: number,
  seedInstructionOffset: number,
  seedInstructionLength: number,
  seedInstructionMnemonic: string,
  seedRegister: X86Register32,
  initialSeedValue: number,
  candidateProfile: MK1PaletteCandidateEvidenceProfile | undefined,
  report: MK1ExecutableLayoutReport,
): MK1SeedTraceResult {
  if (!report.parsedHeader || typeof report.parsedHeader.pageSize !== 'number' || report.parsedHeader.pageSize <= 0) {
    throw new Error('Missing or invalid parsed header / pageSize in executable layout report');
  }
  const pageSize = report.parsedHeader.pageSize;
  const traceStartOffset = seedInstructionOffset + seedInstructionLength;
  const maxBytes = 48;
  const maxInstructions = 12;

  const obj1 = report.objects.find((o) => o.objectNumber === 1);
  if (!obj1) {
    throw new Error('Object 1 missing from LE layout report during seed trace');
  }
  const relocBase = obj1.relocationBaseAddress;

  const registers = createInitialRegisterMap();
  registers[seedRegister] = {
    register: seedRegister,
    isTrackingSeed: true,
    exactValueKnown: true,
    exactValue: initialSeedValue,
    exactValueHex: toHex32(initialSeedValue),
    affineSeedDelta: 0,
  };

  const instructions: MK1DecodedTraceInstruction[] = [];
  const allEvents: MK1PropagationEvent[] = [];

  let cursor = traceStartOffset;
  let instructionCount = 0;
  let stopReason: MK1TraceStopReason = 'max-instructions-reached';
  let stopOpcodeHex: string | undefined;
  let stopInstructionMnemonic: string | undefined;

  let seedLiveAtBoundary = false;
  let boundaryType: 'call' | 'jump' | 'branch' | 'return' | undefined;
  let boundaryTargetHex: string | undefined;
  let seedCopied = false;
  let seedAffineAdjusted = false;
  let seedRelocationBaseAdjusted = false;
  let seedUsedAsMemoryBase = false;
  let seedUsedAsMemoryIndex = false;
  let seedPartialMemoryAddressUse = false;
  let seedTargetCoordinateValueReached = false;
  let seedTargetCompatibleMemoryAddressObserved = false;
  let seedPushed = false;
  let seedOverwritten = false;
  let seedLiveAtCallBoundary = false;
  let callBoundaryTargetRecon: MK1SeedTraceResult['callBoundaryTargetRecon'] = undefined;

  const candidateLoadedStruct = candidateProfile?.topology.targetLoadedAddress ?? null;
  const candidateLoadedPayload = candidateProfile?.topology.targetLoadedPayloadAddress ?? null;

  while (
    cursor - traceStartOffset < maxBytes &&
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
    const instrEvents: MK1PropagationEvent[] = [];

    // Size overrides (0x66, 0x67)
    if (opByte === 0x66 || opByte === 0x67) {
      stopReason = 'unsupported-size-override';
      stopOpcodeHex = toHex8(opByte);
      stopInstructionMnemonic = `SIZE_OVERRIDE_${toHex8(opByte)}`;
      break;
    }

    // 1. MOV r32, imm32 (0xB8..0xBF)
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
        seedOverwritten = true;
        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic,
          eventType: 'seed-overwritten',
          destinationRegister: targetReg,
          description: `${targetReg} holding seed overwritten with immediate ${toHex32(imm)}`,
        });
        registers[targetReg] = {
          register: targetReg,
          isTrackingSeed: false,
          exactValueKnown: false,
          exactValue: 0,
          exactValueHex: '0x00000000',
          affineSeedDelta: 0,
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
        registerStateAfter: cloneRegisterMap(registers),
        events: instrEvents,
      });

      cursor += length;
      instructionCount++;
      allEvents.push(...instrEvents);

      const liveRegsAfter = REGISTERS.filter((r) => registers[r].isTrackingSeed);
      if (liveRegsAfter.length === 0) {
        stopReason = 'seed-no-longer-live';
        break;
      }
      continue;
    }

    // 2. PUSH r32 (0x50..0x57)
    if (opByte >= 0x50 && opByte <= 0x57) {
      const srcReg = REGISTERS[opByte - 0x50]!;
      const mnemonic = `PUSH ${srcReg}`;
      const length = 1;

      if (registers[srcReg].isTrackingSeed) {
        seedPushed = true;
        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic,
          eventType: 'seed-pushed-before-boundary',
          sourceRegister: srcReg,
          resultingValue: registers[srcReg].exactValue,
          resultingValueHex: registers[srcReg].exactValueHex,
          description: `Seed in ${srcReg} pushed to stack`,
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
        registerStateAfter: cloneRegisterMap(registers),
        events: instrEvents,
      });

      cursor += length;
      instructionCount++;
      allEvents.push(...instrEvents);
      continue;
    }

    // 3. POP r32 (0x58..0x5F)
    if (opByte >= 0x58 && opByte <= 0x5f) {
      const targetReg = REGISTERS[opByte - 0x58]!;
      const mnemonic = `POP ${targetReg}`;
      const length = 1;

      if (registers[targetReg].isTrackingSeed) {
        seedOverwritten = true;
        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic,
          eventType: 'seed-overwritten',
          destinationRegister: targetReg,
          description: `${targetReg} holding seed overwritten by POP from stack`,
        });
        registers[targetReg] = {
          register: targetReg,
          isTrackingSeed: false,
          exactValueKnown: false,
          exactValue: 0,
          exactValueHex: '0x00000000',
          affineSeedDelta: 0,
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
        registerStateAfter: cloneRegisterMap(registers),
        events: instrEvents,
      });

      cursor += length;
      instructionCount++;
      allEvents.push(...instrEvents);

      const liveRegsAfterPop = REGISTERS.filter((r) => registers[r].isTrackingSeed);
      if (liveRegsAfterPop.length === 0) {
        stopReason = 'seed-no-longer-live';
        break;
      }
      continue;
    }

    // 4. INC r32 (0x40..0x47)
    if (opByte >= 0x40 && opByte <= 0x47) {
      const targetReg = REGISTERS[opByte - 0x40]!;
      const mnemonic = `INC ${targetReg}`;
      const length = 1;

      if (registers[targetReg].isTrackingSeed) {
        seedAffineAdjusted = true;
        const oldVal = registers[targetReg].exactValue;
        const newVal = (oldVal + 1) >>> 0;
        const newDelta = registers[targetReg].affineSeedDelta + 1;
        registers[targetReg].exactValue = newVal;
        registers[targetReg].exactValueHex = toHex32(newVal);
        registers[targetReg].affineSeedDelta = newDelta;

        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic,
          eventType: 'affine-adjustment',
          destinationRegister: targetReg,
          immediateAdjustment: 1,
          resultingValue: newVal,
          resultingValueHex: toHex32(newVal),
          description: `${targetReg} incremented (+1) to ${toHex32(newVal)}`,
        });

        if (newVal === candidateLoadedStruct || newVal === candidateLoadedPayload) {
          seedTargetCoordinateValueReached = true;
          instrEvents.push({
            instructionIndex: instructionCount,
            instructionOffset: instrOffset,
            instructionOffsetHex: toHex32(instrOffset),
            mnemonic,
            eventType: 'target-coordinate-value-reached',
            resultingValue: newVal,
            resultingValueHex: toHex32(newVal),
            description: `Adjusted register coordinate matches candidate loaded target ${toHex32(newVal)}`,
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
        registerStateAfter: cloneRegisterMap(registers),
        events: instrEvents,
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
        seedAffineAdjusted = true;
        const oldVal = registers[targetReg].exactValue;
        const newVal = (oldVal - 1) >>> 0;
        const newDelta = registers[targetReg].affineSeedDelta - 1;
        registers[targetReg].exactValue = newVal;
        registers[targetReg].exactValueHex = toHex32(newVal);
        registers[targetReg].affineSeedDelta = newDelta;

        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic,
          eventType: 'affine-adjustment',
          destinationRegister: targetReg,
          immediateAdjustment: -1,
          resultingValue: newVal,
          resultingValueHex: toHex32(newVal),
          description: `${targetReg} decremented (-1) to ${toHex32(newVal)}`,
        });

        if (newVal === candidateLoadedStruct || newVal === candidateLoadedPayload) {
          seedTargetCoordinateValueReached = true;
          instrEvents.push({
            instructionIndex: instructionCount,
            instructionOffset: instrOffset,
            instructionOffsetHex: toHex32(instrOffset),
            mnemonic,
            eventType: 'target-coordinate-value-reached',
            resultingValue: newVal,
            resultingValueHex: toHex32(newVal),
            description: `Adjusted register coordinate matches candidate loaded target ${toHex32(newVal)}`,
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
        registerStateAfter: cloneRegisterMap(registers),
        events: instrEvents,
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
        registerStateAfter: cloneRegisterMap(registers),
        events: [],
      });
      cursor += 1;
      instructionCount++;
      continue;
    }

    // 7. Barriers
    // 7a. CALL rel32 (0xE8)
    if (opByte === 0xe8) {
      if (cursor + 5 > buffer.length) {
        stopReason = 'object-boundary-reached';
        break;
      }
      const rel = readInt32LE(buffer, cursor + 1);
      const targetRecon = computeCallBoundaryTargetRecon(
        cursor,
        currentObjOffset,
        rel,
        report,
      );
      boundaryTargetHex = targetRecon.targetLoadedLinearCandidateHex;
      callBoundaryTargetRecon = targetRecon;

      const liveRegs = REGISTERS.filter((r) => registers[r].isTrackingSeed);
      if (liveRegs.length > 0) {
        seedLiveAtBoundary = true;
        seedLiveAtCallBoundary = true;
        boundaryType = 'call';
        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic: `CALL ${boundaryTargetHex}`,
          eventType: 'seed-live-at-call',
          description: `Seed still live in [${liveRegs.join(', ')}] at CALL boundary`,
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
        mnemonic: `CALL ${boundaryTargetHex}`,
        isBarrier: true,
        barrierType: 'call',
        registerStateAfter: cloneRegisterMap(registers),
        events: instrEvents,
        callBoundaryTargetRecon: targetRecon,
      });

      stopReason = 'call-boundary';
      stopOpcodeHex = '0xE8';
      stopInstructionMnemonic = `CALL ${boundaryTargetHex}`;
      cursor += 5;
      instructionCount++;
      allEvents.push(...instrEvents);
      break;
    }

    // 7b. JMP rel32 (0xE9)
    if (opByte === 0xe9) {
      if (cursor + 5 > buffer.length) {
        stopReason = 'object-boundary-reached';
        break;
      }
      const rel = readInt32LE(buffer, cursor + 1);
      const targetLoaded = (relocBase + currentObjOffset + 5 + rel) >>> 0;
      boundaryTargetHex = toHex32(targetLoaded);
      const liveRegs = REGISTERS.filter((r) => registers[r].isTrackingSeed);
      if (liveRegs.length > 0) {
        seedLiveAtBoundary = true;
        boundaryType = 'jump';
        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic: `JMP ${boundaryTargetHex}`,
          eventType: 'seed-live-at-jump',
          description: `Seed still live in [${liveRegs.join(', ')}] at JMP boundary`,
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
        opcodeHex: '0xE9',
        mnemonic: `JMP ${boundaryTargetHex}`,
        isBarrier: true,
        barrierType: 'jump',
        registerStateAfter: cloneRegisterMap(registers),
        events: instrEvents,
      });

      stopReason = 'jump-boundary';
      stopOpcodeHex = '0xE9';
      stopInstructionMnemonic = `JMP ${boundaryTargetHex}`;
      cursor += 5;
      instructionCount++;
      allEvents.push(...instrEvents);
      break;
    }

    // 7c. JMP rel8 (0xEB)
    if (opByte === 0xeb) {
      if (cursor + 2 > buffer.length) {
        stopReason = 'object-boundary-reached';
        break;
      }
      const rel = readInt8(buffer, cursor + 1);
      const targetLoaded = (relocBase + currentObjOffset + 2 + rel) >>> 0;
      boundaryTargetHex = toHex32(targetLoaded);
      const liveRegs = REGISTERS.filter((r) => registers[r].isTrackingSeed);
      if (liveRegs.length > 0) {
        seedLiveAtBoundary = true;
        boundaryType = 'jump';
        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic: `JMP short ${boundaryTargetHex}`,
          eventType: 'seed-live-at-jump',
          description: `Seed still live in [${liveRegs.join(', ')}] at short JMP boundary`,
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
        length: 2,
        rawBytesHex: Array.from(buffer.slice(cursor, cursor + 2))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
        opcodeHex: '0xEB',
        mnemonic: `JMP short ${boundaryTargetHex}`,
        isBarrier: true,
        barrierType: 'jump',
        registerStateAfter: cloneRegisterMap(registers),
        events: instrEvents,
      });

      stopReason = 'jump-boundary';
      stopOpcodeHex = '0xEB';
      stopInstructionMnemonic = `JMP short ${boundaryTargetHex}`;
      cursor += 2;
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
      const targetLoaded = (relocBase + currentObjOffset + 2 + rel) >>> 0;
      boundaryTargetHex = toHex32(targetLoaded);
      const liveRegs = REGISTERS.filter((r) => registers[r].isTrackingSeed);
      if (liveRegs.length > 0) {
        seedLiveAtBoundary = true;
        boundaryType = 'branch';
        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic: `Jcc short ${boundaryTargetHex}`,
          eventType: 'seed-live-at-branch',
          description: `Seed still live in [${liveRegs.join(', ')}] at conditional branch boundary`,
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
        length: 2,
        rawBytesHex: Array.from(buffer.slice(cursor, cursor + 2))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
        opcodeHex: toHex8(opByte),
        mnemonic: `Jcc short ${boundaryTargetHex}`,
        isBarrier: true,
        barrierType: 'branch',
        registerStateAfter: cloneRegisterMap(registers),
        events: instrEvents,
      });

      stopReason = 'conditional-branch-boundary';
      stopOpcodeHex = toHex8(opByte);
      stopInstructionMnemonic = `Jcc short ${boundaryTargetHex}`;
      cursor += 2;
      instructionCount++;
      allEvents.push(...instrEvents);
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
        const targetLoaded = (relocBase + currentObjOffset + 6 + rel) >>> 0;
        boundaryTargetHex = toHex32(targetLoaded);
        const liveRegs = REGISTERS.filter((r) => registers[r].isTrackingSeed);
        if (liveRegs.length > 0) {
          seedLiveAtBoundary = true;
          boundaryType = 'branch';
          instrEvents.push({
            instructionIndex: instructionCount,
            instructionOffset: instrOffset,
            instructionOffsetHex: toHex32(instrOffset),
            mnemonic: `Jcc near ${boundaryTargetHex}`,
            eventType: 'seed-live-at-branch',
            description: `Seed still live in [${liveRegs.join(', ')}] at near conditional branch boundary`,
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
          length: 6,
          rawBytesHex: Array.from(buffer.slice(cursor, cursor + 6))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join(''),
          opcodeHex: `0x0F ${toHex8(secondByte)}`,
          mnemonic: `Jcc near ${boundaryTargetHex}`,
          isBarrier: true,
          barrierType: 'branch',
          registerStateAfter: cloneRegisterMap(registers),
          events: instrEvents,
        });

        stopReason = 'conditional-branch-boundary';
        stopOpcodeHex = `0x0F ${toHex8(secondByte)}`;
        stopInstructionMnemonic = `Jcc near ${boundaryTargetHex}`;
        cursor += 6;
        instructionCount++;
        allEvents.push(...instrEvents);
        break;
      }
    }

    // 7f. RET (0xC3, 0xCB, 0xC2, 0xCA)
    if (opByte === 0xc3 || opByte === 0xcb || opByte === 0xc2 || opByte === 0xca) {
      const isRetImm = opByte === 0xc2 || opByte === 0xca;
      const length = isRetImm ? 3 : 1;
      const imm = isRetImm ? readUint32LE(buffer, cursor + 1) & 0xffff : undefined;
      const mnemonic = isRetImm ? `RET 0x${imm?.toString(16)}` : 'RET';

      const liveRegs = REGISTERS.filter((r) => registers[r].isTrackingSeed);
      if (liveRegs.length > 0) {
        seedLiveAtBoundary = true;
        boundaryType = 'return';
        instrEvents.push({
          instructionIndex: instructionCount,
          instructionOffset: instrOffset,
          instructionOffsetHex: toHex32(instrOffset),
          mnemonic,
          eventType: 'seed-live-at-return',
          description: `Seed still live in [${liveRegs.join(', ')}] at RET boundary`,
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
        registerStateAfter: cloneRegisterMap(registers),
        events: instrEvents,
      });

      stopReason = 'return-boundary';
      stopOpcodeHex = toHex8(opByte);
      stopInstructionMnemonic = mnemonic;
      cursor += length;
      instructionCount++;
      allEvents.push(...instrEvents);
      break;
    }

    // 8. ModR/M Instructions (MOV r32, r/m32; MOV r/m32, r32; LEA r32, m; Group 1 ALU)
    const isModRMSupported =
      opByte === 0x8b || // MOV r32, r/m32
      opByte === 0x89 || // MOV r/m32, r32
      opByte === 0x8d || // LEA r32, m
      opByte === 0x81 || // Group 1 imm32
      opByte === 0x83; // Group 1 imm8

    if (isModRMSupported) {
      if (cursor + 2 > buffer.length) {
        stopReason = 'object-boundary-reached';
        break;
      }
      const modrm = buffer[cursor + 1];
      const mod = (modrm >> 6) & 3;
      const regOp = (modrm >> 3) & 7;
      const rm = modrm & 7;

      let instrLength = 2;
      let hasSIB = false;
      let sibByte = 0;
      let dispValue: number | undefined;
      let immValue: number | undefined;

      if (mod !== 3 && rm === 4) {
        if (cursor + 3 > buffer.length) {
          stopReason = 'object-boundary-reached';
          break;
        }
        hasSIB = true;
        sibByte = buffer[cursor + 2];
        instrLength = 3;
      }

      if (mod === 0) {
        if (!hasSIB && rm === 5) {
          if (cursor + instrLength + 4 > buffer.length) {
            stopReason = 'object-boundary-reached';
            break;
          }
          dispValue = readUint32LE(buffer, cursor + instrLength);
          instrLength += 4;
        } else if (hasSIB && (sibByte & 7) === 5) {
          if (cursor + instrLength + 4 > buffer.length) {
            stopReason = 'object-boundary-reached';
            break;
          }
          dispValue = readUint32LE(buffer, cursor + instrLength);
          instrLength += 4;
        }
      } else if (mod === 1) {
        if (cursor + instrLength + 1 > buffer.length) {
          stopReason = 'object-boundary-reached';
          break;
        }
        dispValue = readInt8(buffer, cursor + instrLength);
        instrLength += 1;
      } else if (mod === 2) {
        if (cursor + instrLength + 4 > buffer.length) {
          stopReason = 'object-boundary-reached';
          break;
        }
        dispValue = readUint32LE(buffer, cursor + instrLength);
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
        if (cursor + instrLength + 1 > buffer.length) {
          stopReason = 'object-boundary-reached';
          break;
        }
        immValue = readInt8(buffer, cursor + instrLength);
        instrLength += 1;
      }

      const regName = REGISTERS[regOp]!;
      let rmDesc = '';
      let baseReg: X86Register32 | null = null;
      let indexReg: X86Register32 | null = null;
      let scale = 1;

      if (mod === 3) {
        rmDesc = REGISTERS[rm]!;
      } else {
        if (!hasSIB) {
          if (mod === 0 && rm === 5) {
            rmDesc = toHex32(dispValue ?? 0);
          } else {
            baseReg = REGISTERS[rm]!;
            rmDesc = baseReg;
            if (dispValue !== undefined && dispValue !== 0) {
              rmDesc += dispValue >= 0 ? `+0x${dispValue.toString(16)}` : `-0x${Math.abs(dispValue).toString(16)}`;
            }
          }
        } else {
          const sibBase = sibByte & 7;
          const sibIndex = (sibByte >> 3) & 7;
          const sibScale = (sibByte >> 6) & 3;
          scale = 1 << sibScale;

          if (!(mod === 0 && sibBase === 5)) {
            baseReg = REGISTERS[sibBase]!;
          }
          if (sibIndex !== 4) {
            indexReg = REGISTERS[sibIndex]!;
          }

          const parts: string[] = [];
          if (baseReg) parts.push(baseReg);
          if (indexReg) parts.push(scale > 1 ? `${indexReg}*${scale}` : indexReg);
          if (dispValue !== undefined && dispValue !== 0) {
            parts.push(`0x${(dispValue >>> 0).toString(16)}`);
          }
          rmDesc = parts.join('+');
        }
      }

      // Memory address calculation check
      if (mod !== 3) {
        let effAddr: number | null = null;
        let isBaseTracking = false;
        let isIndexTracking = false;

        if (baseReg && registers[baseReg].isTrackingSeed) {
          isBaseTracking = true;
          seedUsedAsMemoryBase = true;
          if (registers[baseReg].exactValueKnown) {
            effAddr = registers[baseReg].exactValue;
          }
        }

        if (indexReg && registers[indexReg].isTrackingSeed) {
          isIndexTracking = true;
          seedUsedAsMemoryIndex = true;
          if (registers[indexReg].exactValueKnown && effAddr !== null) {
            effAddr = (effAddr + registers[indexReg].exactValue * scale) >>> 0;
          } else {
            effAddr = null;
          }
        }

        if (effAddr !== null && !indexReg) {
          effAddr = (effAddr + (dispValue ?? 0)) >>> 0;
        }

        if (isBaseTracking) {
          instrEvents.push({
            instructionIndex: instructionCount,
            instructionOffset: instrOffset,
            instructionOffsetHex: toHex32(instrOffset),
            mnemonic: `${toHex8(opByte)} [${rmDesc}]`,
            eventType: 'seed-used-as-memory-base',
            sourceRegister: baseReg!,
            effectiveAddress: effAddr !== null ? effAddr : undefined,
            effectiveAddressHex: effAddr !== null ? toHex32(effAddr) : undefined,
            description: `Seed in ${baseReg} used as base address in [${rmDesc}]`,
          });
        }

        if (isIndexTracking) {
          instrEvents.push({
            instructionIndex: instructionCount,
            instructionOffset: instrOffset,
            instructionOffsetHex: toHex32(instrOffset),
            mnemonic: `${toHex8(opByte)} [${rmDesc}]`,
            eventType: 'seed-used-as-memory-index',
            sourceRegister: indexReg!,
            description: `Seed in ${indexReg} used as index register (*${scale}) in [${rmDesc}]`,
          });
        }

        if ((isBaseTracking || isIndexTracking) && effAddr === null) {
          seedPartialMemoryAddressUse = true;
          instrEvents.push({
            instructionIndex: instructionCount,
            instructionOffset: instrOffset,
            instructionOffsetHex: toHex32(instrOffset),
            mnemonic: `${toHex8(opByte)} [${rmDesc}]`,
            eventType: 'partial-memory-address-use',
            description: `Tracked register used in memory expression [${rmDesc}] but full address cannot be computed`,
          });
        }

        if (
          effAddr !== null &&
          (effAddr === candidateLoadedStruct || effAddr === candidateLoadedPayload)
        ) {
          seedTargetCompatibleMemoryAddressObserved = true;
          instrEvents.push({
            instructionIndex: instructionCount,
            instructionOffset: instrOffset,
            instructionOffsetHex: toHex32(instrOffset),
            mnemonic: `${toHex8(opByte)} [${rmDesc}]`,
            eventType: 'target-compatible-memory-address',
            effectiveAddress: effAddr,
            effectiveAddressHex: toHex32(effAddr),
            description: `Memory access effective address ${toHex32(effAddr)} matches candidate loaded target`,
          });
        }
      }

      // Handle specific opcodes
      let mnemonic = '';
      if (opByte === 0x8b) {
        // MOV r32, r/m32
        const dest = regName;
        mnemonic = `MOV ${dest}, ${mod === 3 ? rmDesc : `[${rmDesc}]`}`;
        if (mod === 3) {
          const src = REGISTERS[rm]!;
          if (registers[src].isTrackingSeed) {
            seedCopied = true;
            registers[dest] = { ...registers[src], register: dest };
            instrEvents.push({
              instructionIndex: instructionCount,
              instructionOffset: instrOffset,
              instructionOffsetHex: toHex32(instrOffset),
              mnemonic,
              eventType: 'seed-copied-to-register',
              sourceRegister: src,
              destinationRegister: dest,
              resultingValue: registers[src].exactValue,
              resultingValueHex: registers[src].exactValueHex,
              description: `Seed copied from ${src} to ${dest}`,
            });
          } else if (registers[dest].isTrackingSeed) {
            seedOverwritten = true;
            instrEvents.push({
              instructionIndex: instructionCount,
              instructionOffset: instrOffset,
              instructionOffsetHex: toHex32(instrOffset),
              mnemonic,
              eventType: 'seed-overwritten',
              destinationRegister: dest,
              description: `${dest} holding seed overwritten from ${src}`,
            });
            registers[dest] = {
              register: dest,
              isTrackingSeed: false,
              exactValueKnown: false,
              exactValue: 0,
              exactValueHex: '0x00000000',
              affineSeedDelta: 0,
            };
          }
        } else {
          // Loaded from memory into dest register
          if (registers[dest].isTrackingSeed) {
            seedOverwritten = true;
            instrEvents.push({
              instructionIndex: instructionCount,
              instructionOffset: instrOffset,
              instructionOffsetHex: toHex32(instrOffset),
              mnemonic,
              eventType: 'seed-overwritten',
              destinationRegister: dest,
              description: `${dest} holding seed overwritten by memory load from [${rmDesc}]`,
            });
            registers[dest] = {
              register: dest,
              isTrackingSeed: false,
              exactValueKnown: false,
              exactValue: 0,
              exactValueHex: '0x00000000',
              affineSeedDelta: 0,
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
            seedCopied = true;
            registers[dest] = { ...registers[src], register: dest };
            instrEvents.push({
              instructionIndex: instructionCount,
              instructionOffset: instrOffset,
              instructionOffsetHex: toHex32(instrOffset),
              mnemonic,
              eventType: 'seed-copied-to-register',
              sourceRegister: src,
              destinationRegister: dest,
              resultingValue: registers[src].exactValue,
              resultingValueHex: registers[src].exactValueHex,
              description: `Seed copied from ${src} to ${dest}`,
            });
          } else if (registers[dest].isTrackingSeed) {
            seedOverwritten = true;
            instrEvents.push({
              instructionIndex: instructionCount,
              instructionOffset: instrOffset,
              instructionOffsetHex: toHex32(instrOffset),
              mnemonic,
              eventType: 'seed-overwritten',
              destinationRegister: dest,
              description: `${dest} holding seed overwritten by ${src}`,
            });
            registers[dest] = {
              register: dest,
              isTrackingSeed: false,
              exactValueKnown: false,
              exactValue: 0,
              exactValueHex: '0x00000000',
              affineSeedDelta: 0,
            };
          }
        }
      } else if (opByte === 0x8d) {
        // LEA r32, m
        const dest = regName;
        mnemonic = `LEA ${dest}, [${rmDesc}]`;
        let computedVal: number | null = null;
        if (baseReg && registers[baseReg].isTrackingSeed && registers[baseReg].exactValueKnown) {
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
          seedAffineAdjusted = true;
          registers[dest] = {
            register: dest,
            isTrackingSeed: true,
            exactValueKnown: true,
            exactValue: computedVal,
            exactValueHex: toHex32(computedVal),
            affineSeedDelta: computedVal - initialSeedValue,
          };

          instrEvents.push({
            instructionIndex: instructionCount,
            instructionOffset: instrOffset,
            instructionOffsetHex: toHex32(instrOffset),
            mnemonic,
            eventType: 'affine-adjustment',
            destinationRegister: dest,
            resultingValue: computedVal,
            resultingValueHex: toHex32(computedVal),
            description: `LEA computed affine value ${toHex32(computedVal)} into ${dest}`,
          });

          if (
            computedVal === candidateLoadedStruct ||
            computedVal === candidateLoadedPayload
          ) {
            seedTargetCoordinateValueReached = true;
            instrEvents.push({
              instructionIndex: instructionCount,
              instructionOffset: instrOffset,
              instructionOffsetHex: toHex32(instrOffset),
              mnemonic,
              eventType: 'target-coordinate-value-reached',
              resultingValue: computedVal,
              resultingValueHex: toHex32(computedVal),
              description: `Computed LEA target ${toHex32(computedVal)} matches candidate loaded coordinate`,
            });
          }
        } else if (registers[dest].isTrackingSeed) {
          seedOverwritten = true;
          registers[dest] = {
            register: dest,
            isTrackingSeed: false,
            exactValueKnown: false,
            exactValue: 0,
            exactValueHex: '0x00000000',
            affineSeedDelta: 0,
          };
        }
      } else if (opByte === 0x81 || opByte === 0x83) {
        const aluName = GROUP1_ALU_NAMES[regOp] ?? 'ALU';
        mnemonic = `${aluName} ${mod === 3 ? rmDesc : `[${rmDesc}]`}, 0x${((immValue ?? 0) >>> 0).toString(16)}`;

        if (mod === 3) {
          const targetReg = REGISTERS[rm]!;
          if (registers[targetReg].isTrackingSeed) {
            const immVal = immValue ?? 0;
            if (regOp === 0) {
              // ADD
              seedAffineAdjusted = true;
              const oldVal = registers[targetReg].exactValue;
              const newVal = (oldVal + immVal) >>> 0;
              registers[targetReg].exactValue = newVal;
              registers[targetReg].exactValueHex = toHex32(newVal);
              registers[targetReg].affineSeedDelta += immVal;

              instrEvents.push({
                instructionIndex: instructionCount,
                instructionOffset: instrOffset,
                instructionOffsetHex: toHex32(instrOffset),
                mnemonic,
                eventType: 'affine-adjustment',
                destinationRegister: targetReg,
                immediateAdjustment: immVal,
                resultingValue: newVal,
                resultingValueHex: toHex32(newVal),
                description: `${targetReg} ADD immediate ${toHex32(immVal)} -> ${toHex32(newVal)}`,
              });

              if (candidateProfile && immVal === relocBase) {
                seedRelocationBaseAdjusted = true;
                instrEvents.push({
                  instructionIndex: instructionCount,
                  instructionOffset: instrOffset,
                  instructionOffsetHex: toHex32(instrOffset),
                  mnemonic,
                  eventType: 'relocation-base-adjustment',
                  destinationRegister: targetReg,
                  resultingValue: newVal,
                  resultingValueHex: toHex32(newVal),
                  description: `Observed addition of Object 1 relocation base ${toHex32(relocBase)}`,
                });
              }

              if (newVal === candidateLoadedStruct || newVal === candidateLoadedPayload) {
                seedTargetCoordinateValueReached = true;
                instrEvents.push({
                  instructionIndex: instructionCount,
                  instructionOffset: instrOffset,
                  instructionOffsetHex: toHex32(instrOffset),
                  mnemonic,
                  eventType: 'target-coordinate-value-reached',
                  resultingValue: newVal,
                  resultingValueHex: toHex32(newVal),
                  description: `Adjusted register coordinate matches candidate loaded target ${toHex32(newVal)}`,
                });
              }
            } else if (regOp === 5) {
              // SUB
              seedAffineAdjusted = true;
              const oldVal = registers[targetReg].exactValue;
              const newVal = (oldVal - immVal) >>> 0;
              registers[targetReg].exactValue = newVal;
              registers[targetReg].exactValueHex = toHex32(newVal);
              registers[targetReg].affineSeedDelta -= immVal;

              instrEvents.push({
                instructionIndex: instructionCount,
                instructionOffset: instrOffset,
                instructionOffsetHex: toHex32(instrOffset),
                mnemonic,
                eventType: 'affine-adjustment',
                destinationRegister: targetReg,
                immediateAdjustment: -immVal,
                resultingValue: newVal,
                resultingValueHex: toHex32(newVal),
                description: `${targetReg} SUB immediate ${toHex32(immVal)} -> ${toHex32(newVal)}`,
              });
            } else if (regOp === 7) {
              // CMP (does not change register)
            } else {
              registers[targetReg].exactValueKnown = false;
              instrEvents.push({
                instructionIndex: instructionCount,
                instructionOffset: instrOffset,
                instructionOffsetHex: toHex32(instrOffset),
                mnemonic,
                eventType: 'seed-used-non-affine',
                destinationRegister: targetReg,
                description: `${targetReg} modified by non-affine ALU operation ${aluName}`,
              });
            }
          }
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
        registerStateAfter: cloneRegisterMap(registers),
        events: instrEvents,
      });

      cursor += instrLength;
      instructionCount++;
      allEvents.push(...instrEvents);

      const liveRegsAfter = REGISTERS.filter((r) => registers[r].isTrackingSeed);
      if (liveRegsAfter.length === 0) {
        stopReason = 'seed-no-longer-live';
        break;
      }
      continue;
    }

    // 9. Unsupported opcode -> STOP immediately
    stopReason = 'unsupported-opcode';
    stopOpcodeHex = toHex8(opByte);
    stopInstructionMnemonic = `UNKNOWN_OP_${toHex8(opByte)}`;
    break;
  }

  if (cursor - traceStartOffset >= maxBytes) {
    stopReason = 'max-bytes-reached';
  } else if (instructionCount >= maxInstructions) {
    stopReason = 'max-instructions-reached';
  }

  // Derive status strictly from stopReason
  let status: MK1SeedTraceStatus;
  switch (stopReason) {
    case 'call-boundary':
      status = 'seed-traced-to-call';
      break;
    case 'jump-boundary':
      status = 'seed-traced-to-jump';
      break;
    case 'conditional-branch-boundary':
      status = 'seed-traced-to-branch';
      break;
    case 'return-boundary':
      status = 'seed-traced-to-return';
      break;
    case 'seed-no-longer-live':
      status = 'seed-overwritten-before-use';
      break;
    case 'unsupported-opcode':
      status = 'seed-traced-to-unsupported-opcode';
      break;
    case 'unsupported-size-override':
      status = 'seed-traced-to-size-override';
      break;
    case 'max-bytes-reached':
      status = 'seed-traced-to-max-bytes';
      break;
    case 'max-instructions-reached':
      status = 'seed-traced-to-max-instructions';
      break;
    case 'object-boundary-reached':
    default:
      status = 'seed-traced-to-object-boundary';
      break;
  }

  return {
    seedSiteOffset,
    seedSiteOffsetHex: toHex32(seedSiteOffset),
    seedInstructionOffset,
    seedInstructionOffsetHex: toHex32(seedInstructionOffset),
    seedInstructionLength,
    seedInstructionMnemonic,
    seedRegister,
    initialSeedValue,
    initialSeedValueHex: toHex32(initialSeedValue),
    traceStartOffset,
    traceStartOffsetHex: toHex32(traceStartOffset),
    traceEndOffset: cursor,
    traceEndOffsetHex: toHex32(cursor),
    totalBytesExamined: cursor - traceStartOffset,
    totalInstructionsDecoded: instructionCount,
    stopReason,
    stopOffset: cursor,
    stopOffsetHex: toHex32(cursor),
    stopInstructionMnemonic,
    stopOpcodeHex,
    status,
    seedLiveAtBoundary,
    boundaryType,
    boundaryTargetHex,
    seedCopied,
    seedAffineAdjusted,
    seedRelocationBaseAdjusted,
    seedUsedAsMemoryBase,
    seedUsedAsMemoryIndex,
    seedUsedInMemoryAccess: seedUsedAsMemoryBase || seedUsedAsMemoryIndex,
    seedPartialMemoryAddressUse,
    seedTargetCoordinateValueReached,
    seedTargetCompatibleMemoryAddressObserved,
    seedPushed,
    seedOverwritten,
    seedLiveAtCallBoundary,
    callBoundaryTargetRecon,
    instructions,
    events: allEvents,
  };
}

const TRACE_CONFIG: MK1TraceConfiguration = {
  maxBytes: 48,
  maxInstructions: 12,
  straightLineOnly: true,
  followsCalls: false,
  followsBranches: false,
  microDecoder: true,
  stopOnUnsupported: true,
  addressMode: '32-bit',
  objectConstraint: 'Object 1',
};

export function buildFixtureObservations(
  exePath: string,
  exeSize: number,
  directSitesCount: number,
  twoHopSitesCount: number,
  seedTracesCount: number,
  callBoundaryTracesCount: number,
  callGroups: ReturnType<typeof groupCallBoundaryTargets>,
  objectRelativeMatchedCount: number,
  relocationBaseAdjustedCount: number,
  directLinearMatchesTargetCount: number = 0,
): string[] {
  const totalSites = directSitesCount + twoHopSitesCount;
  const groupsDesc = callGroups
    .map((g) => `${g.boundaryTargetLinearHex} (${g.traceCount} trace${g.traceCount === 1 ? '' : 's'})`)
    .join(', ');

  const observations: string[] = [
    `${exePath} (${exeSize.toLocaleString()} bytes) Object 1 code contains ${directSitesCount} direct positive B.2 site${directSitesCount === 1 ? '' : 's'} and ${twoHopSitesCount} two-hop B.7 site${twoHopSitesCount === 1 ? '' : 's'} (${totalSites} site${totalSites === 1 ? '' : 's'} total).`,
  ];

  if (seedTracesCount > 0) {
    if (callBoundaryTracesCount === seedTracesCount) {
      observations.push(
        `All ${seedTracesCount} eligible register-immediate seed traces terminate at near rel32 CALL boundaries (stopReason: call-boundary).`,
      );
    } else {
      observations.push(
        `${callBoundaryTracesCount} of ${seedTracesCount} eligible register-immediate seed traces terminate at near rel32 CALL boundaries (stopReason: call-boundary).`,
      );
    }
  }

  if (callGroups.length > 0) {
    observations.push(
      `CALL boundaries resolve topographically into ${callGroups.length} distinct target group${callGroups.length === 1 ? '' : 's'}: ${groupsDesc}.`,
    );
  }

  if (directLinearMatchesTargetCount > 0) {
    observations.push(
      `Direct loaded-address interpretation matched associated candidate structure or payload in ${directLinearMatchesTargetCount} instance${directLinearMatchesTargetCount === 1 ? '' : 's'} under the tested B.8a coordinate mapping.`,
    );
  } else {
    observations.push(
      'No direct loaded-address interpretation matched its associated candidate structure or payload under the tested B.8a coordinate mapping.',
    );
  }

  if (relocationBaseAdjustedCount > 0) {
    observations.push(
      `Addition of the Object 1 relocation base was observed in ${relocationBaseAdjustedCount} seed trace${relocationBaseAdjustedCount === 1 ? '' : 's'}.`,
    );
  } else {
    observations.push(
      `Mathematical compatibility with Object 1 relocation base was established for ${objectRelativeMatchedCount} interpretation${objectRelativeMatchedCount === 1 ? '' : 's'}, but no relocation-base adjustment was observed in the ${seedTracesCount} bounded seed traces.`,
    );
  }

  return observations;
}

/**
 * Executes Milestone 1E.2B.8a: Operand Address-Space Compatibility &
 * Bounded Straight-Line Seed-Use Reconnaissance.
 */
export function executePaletteOperandUseReconnaissance(
  buffer: Uint8Array,
  report: MK1ExecutableLayoutReport,
  contextResult: MK1PaletteOccurrenceContextResult,
  fusionResult: MK1PaletteCandidateEvidenceFusionResult,
  chainResult: MK1PaletteReferenceChainReconResult,
): MK1PaletteOperandUseResult {
  const startTime = Date.now();
  const opId = createOperationId();
  logStageCheckpoint('operand-use', 'b8a-start', opId, 'Starting Pass 1E.2B.8a');

  // Strict Upstream Validation
  if (!report || !report.objects || report.objects.length === 0) {
    return createFailedResult('Missing or invalid executable layout report', 'upstream-validation', opId, report);
  }

  if (!report.parsedHeader || typeof report.parsedHeader.pageSize !== 'number' || report.parsedHeader.pageSize <= 0) {
    return createFailedResult('Missing or invalid parsed header / pageSize in executable layout report', 'upstream-validation', opId, report);
  }

  const pageSize = report.parsedHeader.pageSize;

  const obj1 = report.objects.find((o) => o.objectNumber === 1);
  if (!obj1) {
    return createFailedResult('Object 1 code descriptor missing from executable layout report', 'upstream-validation', opId, report);
  }

  if (!contextResult || contextResult.status !== 'SUCCESS') {
    return createFailedResult('B.2 Occurrence Context result missing or status not SUCCESS', 'upstream-validation', opId, report);
  }

  if (!fusionResult || fusionResult.status !== 'SUCCESS') {
    return createFailedResult('B.6 Evidence Fusion result missing or status not SUCCESS', 'upstream-validation', opId, report);
  }

  if (!chainResult || chainResult.status !== 'SUCCESS') {
    return createFailedResult('B.7 Reference Chain result missing or status not SUCCESS', 'upstream-validation', opId, report);
  }

  try {
    const candidateMap = new Map<string, MK1PaletteCandidateEvidenceProfile>();
  for (const prof of fusionResult.candidateProfiles) {
    candidateMap.set(prof.candidateId, prof);
  }

  // 1. Direct Code-Facing Sites from B.2
  const directPositions: PhysicalPositionContextClassification[] = [];
  for (const pos of contextResult.classifiedPositions) {
    if (
      pos.sourceObjectNumber === 1 &&
      (pos.shapeStatus === 'single-whitelisted-shape' ||
        pos.shapeStatus === 'multiple-whitelisted-shapes')
    ) {
      directPositions.push(pos);
    }
  }
  directPositions.sort((a, b) => a.sourceFileOffset - b.sourceFileOffset);

  // 2. Two-Hop Code-Facing Sites from B.7
  const twoHopReferrers: MK1SecondOrderPhysicalReferrer[] = [];
  for (const ref of chainResult.uniquePhysicalReferrers) {
    if (ref.secondOrderRole === 'whitelisted-object1-operand-referrer') {
      twoHopReferrers.push(ref);
    }
  }
  twoHopReferrers.sort((a, b) => a.referrerFileOffset - b.referrerFileOffset);

  const sites: MK1CodeFacingSiteRecord[] = [];
  const allInterpretations: MK1OperandInterpretationRecord[] = [];
  const allTraces: MK1SeedTraceResult[] = [];
  const callTraceItems: {
    trace: MK1SeedTraceResult;
    sourceKind: 'direct-candidate-first-hop' | 'two-hop-site-code-facing';
    candidateId: string | null;
    siteOffsetHex: string;
  }[] = [];
  const signatureItems: {
    interpretationId: string;
    siteOffsetHex: string;
    trace: MK1SeedTraceResult;
  }[] = [];

  const candidateAssociationsMissing: string[] = [];

  const semanticCounts: Record<MK1OperandSemanticClass, number> = {
    'register-immediate-seed': 0,
    'push-immediate-value': 0,
    'accumulator-arithmetic-immediate': 0,
    'direct-memory-load-address': 0,
    'direct-memory-store-address': 0,
    'lea-address-computation': 0,
    'other-whitelisted-immediate': 0,
  };

  const linearResolutionCounts: Record<MK1LinearAddressResolutionClass, number> = {
    'exact-associated-structure-linear': 0,
    'exact-associated-payload-linear': 0,
    'resolves-other-loaded-location': 0,
    'linear-address-unmapped': 0,
    'segment-override-unresolved': 0,
    'not-applicable-non-address-operand': 0,
  };

  let directLinearMatchesTargetCount = 0;
  let directLinearResolvesOtherCount = 0;
  let directLinearUnmappedCount = 0;
  let objectRelativeCount = 0;
  let objectRelativeRelocationBaseMatchedCount = 0;

  let seedTracesAttempted = 0;
  let seedTracesReachingCall = 0;
  let seedTracesReachingJump = 0;
  let seedTracesReachingBranch = 0;
  let seedTracesReachingReturn = 0;
  let seedTracesReachingMemoryAccess = 0;
  let seedTracesOverwrittenBeforeUse = 0;
  let seedTracesUnsupportedOpcode = 0;
  let seedTracesSizeOverride = 0;
  let seedTracesMaxBytes = 0;
  let seedTracesMaxInstructions = 0;
  let seedTracesTargetCompatibleMemoryAddress = 0;
  let seedTracesRelocationBaseAdjusted = 0;

  // Process Direct Sites
  for (const pos of directPositions) {
    const siteId = `site_${toHex32(pos.sourceFileOffset)}`;
    const byteClass = classifyPhysicalByteInObjects(pos.sourceFileOffset, report.objects, pageSize);

    if (
      byteClass.type !== 'addressable-object-byte' ||
      byteClass.objectOffset === null ||
      byteClass.linearAddressCandidate === null ||
      byteClass.objectNumber !== 1
    ) {
      return createFailedResult(
        `Physical byte at offset ${pos.sourceFileOffsetHex} fails authoritative Object 1 mapping invariant`,
        'direct-site-processing',
        opId,
        report,
      );
    }

    const siteObjectNumber = 1;
    const siteObjectOffset = byteClass.objectOffset;
    const siteLoadedAddress = byteClass.linearAddressCandidate;

    const authSiteRegion = report.topology?.regions
      ? findContainingRegion(pos.sourceFileOffset, report.topology.regions)
      : null;
    if (!authSiteRegion) {
      return createFailedResult(
        `Direct site physical offset ${pos.sourceFileOffsetHex} does not resolve to an authoritative topology region`,
        'direct-site-processing',
        opId,
        report,
      );
    }
    const siteRegionId = authSiteRegion.regionId;
    const siteRegionClass = authSiteRegion.regionClass;

    if (pos.associatedCandidates.length !== 1) {
      candidateAssociationsMissing.push(pos.sourceFileOffsetHex);
      return createFailedResult(
        `Direct positive B.2 site ${siteId} at offset ${pos.sourceFileOffsetHex} has invalid candidate association count: ${pos.associatedCandidates.length} (must equal exactly 1)`,
        'candidate-association-reconciliation',
        opId,
        report,
        {
          candidateAssociationsMissing: [...candidateAssociationsMissing],
          b2PositivePhysicalSitesInput: directPositions.length,
          allReconciled: false,
        },
      );
    }

    const assoc = pos.associatedCandidates[0];
    if (!assoc || !assoc.candidateId || !assoc.representationKind) {
      return createFailedResult(
        `Direct positive B.2 site ${siteId} at offset ${pos.sourceFileOffsetHex} has missing or incomplete association data`,
        'candidate-association-reconciliation',
        opId,
        report,
      );
    }

    const candidateId = assoc.candidateId;
    const repKind = assoc.representationKind;
    const candProfile = candidateMap.get(candidateId);
    if (!candProfile) {
      return createFailedResult(
        `Direct positive B.2 site ${siteId} at offset ${pos.sourceFileOffsetHex} references candidate ${candidateId} missing from B.6 candidateMap`,
        'candidate-association-reconciliation',
        opId,
        report,
      );
    }

    const positiveShapes = pos.matchingShapes.filter(
      (s) => s.isWhitelistedShape && s.shapeClass !== 'negative-rel32' && s.shapeClass !== 'unmatched-shape',
    );

    const siteInterpretations: MK1OperandInterpretationRecord[] = [];

    for (let shapeIdx = 0; shapeIdx < positiveShapes.length; shapeIdx++) {
      const shape = positiveShapes[shapeIdx]!;
      const interpretationId = `interp_${toHex32(pos.sourceFileOffset)}_${shapeIdx}`;

      const instrStart = shape.candidateEncodingStart ?? (pos.sourceFileOffset - 1);
      const instrLen = shape.candidateEncodingLength ?? shape.instructionLength ?? 5;

      const segOverride = detectSegmentOverride(buffer, instrStart);
      const semanticInfo = classifyOperandSemanticClass(
        shape.shapeClass,
        shape.opcodeBytesHex,
        instrStart,
        buffer,
      );

      semanticCounts[semanticInfo.semanticClass]++;

      // Direct linear resolution
      const linearRes = evaluateDirectLinearResolution(
        pos.matchedUint32Value,
        semanticInfo.semanticClass,
        segOverride.hasOverride,
        report,
        candProfile,
      );

      linearResolutionCounts[linearRes.resolutionClass]++;
      if (linearRes.matchesAssociatedTarget) directLinearMatchesTargetCount++;
      if (linearRes.resolutionClass === 'resolves-other-loaded-location') directLinearResolvesOtherCount++;
      if (linearRes.resolutionClass === 'linear-address-unmapped') directLinearUnmappedCount++;

      // Object-relative compatibility
      const objRelCompat = evaluateObjectRelativeCompatibility(
        pos.matchedUint32Value,
        repKind,
        candProfile,
        report,
      );

      if (objRelCompat.isObjectRelativeOperand) {
        objectRelativeCount++;
        if (objRelCompat.requiredBaseEqualsTargetObjectRelocationBase) {
          objectRelativeRelocationBaseMatchedCount++;
        }
      }

      // Straight-line seed-use trace
      let seedTrace: MK1SeedTraceResult | null = null;
      let seedTraceStatus: MK1SeedTraceStatus;

      if (
        semanticInfo.semanticClass === 'register-immediate-seed' &&
        semanticInfo.destinationRegister !== null
      ) {
        seedTracesAttempted++;
        seedTrace = traceStraightLineSeedUse(
          buffer,
          pos.sourceFileOffset,
          instrStart,
          instrLen,
          shape.mnemonicHint,
          semanticInfo.destinationRegister,
          pos.matchedUint32Value,
          candProfile,
          report,
        );

        seedTraceStatus = seedTrace.status;
        allTraces.push(seedTrace);
        signatureItems.push({
          interpretationId,
          siteOffsetHex: pos.sourceFileOffsetHex,
          trace: seedTrace,
        });

        if (seedTrace.status === 'seed-traced-to-call') {
          seedTracesReachingCall++;
          callTraceItems.push({
            trace: seedTrace,
            sourceKind: 'direct-candidate-first-hop',
            candidateId,
            siteOffsetHex: pos.sourceFileOffsetHex,
          });
        } else if (seedTrace.status === 'seed-traced-to-jump') {
          seedTracesReachingJump++;
        } else if (seedTrace.status === 'seed-traced-to-branch') {
          seedTracesReachingBranch++;
        } else if (seedTrace.status === 'seed-traced-to-return') {
          seedTracesReachingReturn++;
        } else if (seedTrace.status === 'seed-traced-to-memory-access') {
          seedTracesReachingMemoryAccess++;
        } else if (seedTrace.status === 'seed-overwritten-before-use') {
          seedTracesOverwrittenBeforeUse++;
        } else if (seedTrace.status === 'seed-traced-to-unsupported-opcode') {
          seedTracesUnsupportedOpcode++;
        } else if (seedTrace.status === 'seed-traced-to-size-override') {
          seedTracesSizeOverride++;
        } else if (seedTrace.status === 'seed-traced-to-max-bytes') {
          seedTracesMaxBytes++;
        } else if (seedTrace.status === 'seed-traced-to-max-instructions') {
          seedTracesMaxInstructions++;
        }

        if (seedTrace.seedTargetCompatibleMemoryAddressObserved) {
          seedTracesTargetCompatibleMemoryAddress++;
        }
        if (seedTrace.seedRelocationBaseAdjusted) {
          seedTracesRelocationBaseAdjusted++;
        }
      } else if (
        semanticInfo.semanticClass === 'direct-memory-load-address' ||
        semanticInfo.semanticClass === 'direct-memory-store-address'
      ) {
        seedTraceStatus = 'not-applicable-direct-memory-operand';
      } else if (semanticInfo.semanticClass === 'accumulator-arithmetic-immediate') {
        seedTraceStatus = 'not-applicable-arithmetic-immediate';
      } else if (semanticInfo.semanticClass === 'push-immediate-value') {
        seedTraceStatus = 'not-applicable-push-immediate';
      } else {
        seedTraceStatus = 'not-applicable-non-seed-operand';
      }

      const interpRecord: MK1OperandInterpretationRecord = {
        interpretationId,
        sourceKind: 'direct-candidate-first-hop',
        siteFileOffset: pos.sourceFileOffset,
        siteFileOffsetHex: pos.sourceFileOffsetHex,
        siteObjectNumber,
        siteObjectOffset,
        siteObjectOffsetHex: toHex32(siteObjectOffset),
        siteLoadedAddress,
        siteLoadedAddressHex: toHex32(siteLoadedAddress),
        siteRegionId,
        shapeClass: shape.shapeClass,
        mnemonicHint: shape.mnemonicHint,
        instructionFileOffset: instrStart,
        instructionFileOffsetHex: toHex32(instrStart),
        instructionLength: instrLen,
        opcodeBytesHex: shape.opcodeBytesHex,
        operandFieldOffset: pos.sourceFileOffset,
        operandFieldOffsetHex: pos.sourceFileOffsetHex,
        operandUint32Value: pos.matchedUint32Value,
        operandUint32Hex: pos.matchedUint32Hex,
        associatedCandidateId: candidateId,
        associatedRepresentationKind: repKind,
        targetCandidateRegionId: candProfile?.topology.targetRegionId,
        targetCandidateObjectNumber: candProfile?.topology.targetObjectNumber ?? null,
        targetCandidateLoadedStructureHex:
          candProfile?.topology.targetLoadedAddressHex ?? null,
        targetCandidateLoadedPayloadHex:
          candProfile?.topology.targetLoadedPayloadAddressHex ?? null,
        targetCandidatePhysicalStructure:
          candProfile ? candProfile.intrinsic.byteStart : null,
        targetCandidatePhysicalStructureHex:
          candProfile?.intrinsic.byteStartHex ?? null,
        targetCandidatePhysicalPayload:
          candProfile ? candProfile.intrinsic.byteStart + 2 : null,
        targetCandidatePhysicalPayloadHex:
          candProfile ? toHex32(candProfile.intrinsic.byteStart + 2) : null,
        semanticClass: semanticInfo.semanticClass,
        destinationRegister: semanticInfo.destinationRegister,
        hasSegmentOverride: segOverride.hasOverride,
        segmentOverridePrefixHex: segOverride.prefixHex,
        dereferenceShapePresent: semanticInfo.dereferenceShapePresent,
        dereferencePerformed: semanticInfo.dereferencePerformed,
        memoryAccessEncodedByInterpretation: semanticInfo.dereferenceShapePresent,
        directLinearResolution: linearRes.resolutionClass,
        directLinearResolvedObjectNumber: linearRes.resolvedObjectNumber,
        directLinearResolvedObjectOffset: linearRes.resolvedObjectOffset,
        directLinearResolvedObjectOffsetHex: linearRes.resolvedObjectOffsetHex,
        directLinearResolvedPhysicalOffset: linearRes.resolvedPhysicalOffset,
        directLinearResolvedPhysicalOffsetHex: linearRes.resolvedPhysicalOffsetHex,
        directLinearResolvedRegionId: linearRes.resolvedRegionId,
        directLinearMatchesAssociatedTarget: linearRes.matchesAssociatedTarget,
        objectRelativeCompatibility: objRelCompat,
        seedTraceStatus,
        seedTrace,
      };

      siteInterpretations.push(interpRecord);
      allInterpretations.push(interpRecord);
    }

    sites.push({
      siteId,
      sourceKind: 'direct-candidate-first-hop',
      fileOffset: pos.sourceFileOffset,
      fileOffsetHex: pos.sourceFileOffsetHex,
      objectNumber: siteObjectNumber,
      objectOffset: siteObjectOffset,
      objectOffsetHex: toHex32(siteObjectOffset),
      loadedAddress: siteLoadedAddress,
      loadedAddressHex: toHex32(siteLoadedAddress),
      regionId: siteRegionId,
      regionClass: siteRegionClass,
      matchedUint32Value: pos.matchedUint32Value,
      matchedUint32Hex: pos.matchedUint32Hex,
      associatedCandidateIds: pos.associatedCandidates.map((c) => c.candidateId),
      associatedRepresentationKinds: pos.associatedCandidates.map(
        (c) => c.representationKind,
      ),
      shapeCount: siteInterpretations.length,
      interpretations: siteInterpretations,
    });
  }

  // Process Two-Hop Sites from B.7
  for (const ref of twoHopReferrers) {
    const siteId = `site_${toHex32(ref.referrerFileOffset)}`;
    const byteClass = classifyPhysicalByteInObjects(ref.referrerFileOffset, report.objects, pageSize);

    if (
      byteClass.type !== 'addressable-object-byte' ||
      byteClass.objectOffset === null ||
      byteClass.linearAddressCandidate === null ||
      byteClass.objectNumber !== 1
    ) {
      return createFailedResult(
        `Two-hop physical byte at offset ${ref.referrerFileOffsetHex} fails authoritative Object 1 mapping invariant`,
        'two-hop-site-processing',
        opId,
        report,
      );
    }

    const siteObjectNumber = 1;
    const siteObjectOffset = byteClass.objectOffset;
    const siteLoadedAddress = byteClass.linearAddressCandidate;

    const authRefRegion = report.topology?.regions
      ? findContainingRegion(ref.referrerFileOffset, report.topology.regions)
      : null;
    if (!authRefRegion) {
      return createFailedResult(
        `Two-hop physical byte at offset ${ref.referrerFileOffsetHex} does not resolve to an authoritative topology region`,
        'two-hop-site-processing',
        opId,
        report,
      );
    }
    const twoHopRegionId = authRefRegion.regionId;
    const twoHopRegionClass = authRefRegion.regionClass;

    const positiveShapes = ref.matchingShapes.filter(
      (s) => s.isWhitelistedShape && s.shapeClass !== 'negative-rel32' && s.shapeClass !== 'unmatched-shape',
    );

    const siteInterpretations: MK1OperandInterpretationRecord[] = [];

    for (let shapeIdx = 0; shapeIdx < positiveShapes.length; shapeIdx++) {
      const shape = positiveShapes[shapeIdx]!;
      const interpretationId = `interp_${toHex32(ref.referrerFileOffset)}_${shapeIdx}`;

      const instrStart = shape.candidateEncodingStart ?? (ref.referrerFileOffset - 1);
      const instrLen = shape.candidateEncodingLength ?? shape.instructionLength ?? 5;

      const segOverride = detectSegmentOverride(buffer, instrStart);
      const semanticInfo = classifyOperandSemanticClass(
        shape.shapeClass,
        shape.opcodeBytesHex,
        instrStart,
        buffer,
      );

      semanticCounts[semanticInfo.semanticClass]++;

      // Direct linear resolution (for 0x1D)
      const linearRes = evaluateDirectLinearResolution(
        ref.matchedUint32Value,
        semanticInfo.semanticClass,
        segOverride.hasOverride,
        report,
        undefined,
      );

      linearResolutionCounts[linearRes.resolutionClass]++;
      if (linearRes.matchesAssociatedTarget) directLinearMatchesTargetCount++;
      if (linearRes.resolutionClass === 'resolves-other-loaded-location') directLinearResolvesOtherCount++;
      if (linearRes.resolutionClass === 'linear-address-unmapped') directLinearUnmappedCount++;

      // Object-relative compatibility
      const objRelCompat = evaluateObjectRelativeCompatibility(
        ref.matchedUint32Value,
        'first-hop-site-offset',
        undefined,
        report,
      );

      // Straight-line seed-use trace
      let seedTrace: MK1SeedTraceResult | null = null;
      let seedTraceStatus: MK1SeedTraceStatus;

      if (
        semanticInfo.semanticClass === 'register-immediate-seed' &&
        semanticInfo.destinationRegister !== null
      ) {
        seedTracesAttempted++;
        seedTrace = traceStraightLineSeedUse(
          buffer,
          ref.referrerFileOffset,
          instrStart,
          instrLen,
          shape.mnemonicHint,
          semanticInfo.destinationRegister,
          ref.matchedUint32Value,
          undefined,
          report,
        );

        seedTraceStatus = seedTrace.status;
        allTraces.push(seedTrace);
        signatureItems.push({
          interpretationId,
          siteOffsetHex: ref.referrerFileOffsetHex,
          trace: seedTrace,
        });

        if (seedTrace.status === 'seed-traced-to-call') {
          seedTracesReachingCall++;
          callTraceItems.push({
            trace: seedTrace,
            sourceKind: 'two-hop-site-code-facing',
            candidateId: null,
            siteOffsetHex: ref.referrerFileOffsetHex,
          });
        } else if (seedTrace.status === 'seed-traced-to-jump') {
          seedTracesReachingJump++;
        } else if (seedTrace.status === 'seed-traced-to-branch') {
          seedTracesReachingBranch++;
        } else if (seedTrace.status === 'seed-traced-to-return') {
          seedTracesReachingReturn++;
        } else if (seedTrace.status === 'seed-traced-to-memory-access') {
          seedTracesReachingMemoryAccess++;
        } else if (seedTrace.status === 'seed-overwritten-before-use') {
          seedTracesOverwrittenBeforeUse++;
        } else if (seedTrace.status === 'seed-traced-to-unsupported-opcode') {
          seedTracesUnsupportedOpcode++;
        } else if (seedTrace.status === 'seed-traced-to-size-override') {
          seedTracesSizeOverride++;
        } else if (seedTrace.status === 'seed-traced-to-max-bytes') {
          seedTracesMaxBytes++;
        } else if (seedTrace.status === 'seed-traced-to-max-instructions') {
          seedTracesMaxInstructions++;
        }

        if (seedTrace.seedTargetCompatibleMemoryAddressObserved) {
          seedTracesTargetCompatibleMemoryAddress++;
        }
        if (seedTrace.seedRelocationBaseAdjusted) {
          seedTracesRelocationBaseAdjusted++;
        }
      } else if (
        semanticInfo.semanticClass === 'direct-memory-load-address' ||
        semanticInfo.semanticClass === 'direct-memory-store-address'
      ) {
        seedTraceStatus = 'not-applicable-direct-memory-operand';
      } else if (semanticInfo.semanticClass === 'accumulator-arithmetic-immediate') {
        seedTraceStatus = 'not-applicable-arithmetic-immediate';
      } else if (semanticInfo.semanticClass === 'push-immediate-value') {
        seedTraceStatus = 'not-applicable-push-immediate';
      } else {
        seedTraceStatus = 'not-applicable-non-seed-operand';
      }

      const interpRecord: MK1OperandInterpretationRecord = {
        interpretationId,
        sourceKind: 'two-hop-site-code-facing',
        siteFileOffset: ref.referrerFileOffset,
        siteFileOffsetHex: ref.referrerFileOffsetHex,
        siteObjectNumber,
        siteObjectOffset,
        siteObjectOffsetHex: toHex32(siteObjectOffset),
        siteLoadedAddress,
        siteLoadedAddressHex: toHex32(siteLoadedAddress),
        siteRegionId: twoHopRegionId,
        shapeClass: shape.shapeClass,
        mnemonicHint: shape.mnemonicHint,
        instructionFileOffset: instrStart,
        instructionFileOffsetHex: toHex32(instrStart),
        instructionLength: instrLen,
        opcodeBytesHex: shape.opcodeBytesHex,
        operandFieldOffset: ref.referrerFileOffset,
        operandFieldOffsetHex: ref.referrerFileOffsetHex,
        operandUint32Value: ref.matchedUint32Value,
        operandUint32Hex: ref.matchedUint32Hex,
        associatedCandidateId: null,
        associatedRepresentationKind: 'first-hop-site-offset',
        targetFirstHopSiteId: ref.targetSiteIds[0] ?? 'site_0x0000001D',
        targetFirstHopSiteOffsetHex: (ref.targetSiteIds[0] ?? 'site_0x0000001D').replace('site_', ''),
        semanticClass: semanticInfo.semanticClass,
        destinationRegister: semanticInfo.destinationRegister,
        hasSegmentOverride: segOverride.hasOverride,
        segmentOverridePrefixHex: segOverride.prefixHex,
        dereferenceShapePresent: semanticInfo.dereferenceShapePresent,
        dereferencePerformed: semanticInfo.dereferencePerformed,
        memoryAccessEncodedByInterpretation: semanticInfo.dereferenceShapePresent,
        directLinearResolution: linearRes.resolutionClass,
        directLinearResolvedObjectNumber: linearRes.resolvedObjectNumber,
        directLinearResolvedObjectOffset: linearRes.resolvedObjectOffset,
        directLinearResolvedObjectOffsetHex: linearRes.resolvedObjectOffsetHex,
        directLinearResolvedPhysicalOffset: linearRes.resolvedPhysicalOffset,
        directLinearResolvedPhysicalOffsetHex: linearRes.resolvedPhysicalOffsetHex,
        directLinearResolvedRegionId: linearRes.resolvedRegionId,
        directLinearMatchesAssociatedTarget: false,
        objectRelativeCompatibility: objRelCompat,
        seedTraceStatus,
        seedTrace,
      };

      siteInterpretations.push(interpRecord);
      allInterpretations.push(interpRecord);
    }

    sites.push({
      siteId,
      sourceKind: 'two-hop-site-code-facing',
      fileOffset: ref.referrerFileOffset,
      fileOffsetHex: ref.referrerFileOffsetHex,
      objectNumber: siteObjectNumber,
      objectOffset: siteObjectOffset,
      objectOffsetHex: toHex32(siteObjectOffset),
      loadedAddress: siteLoadedAddress,
      loadedAddressHex: toHex32(siteLoadedAddress),
      regionId: twoHopRegionId,
      regionClass: twoHopRegionClass,
      matchedUint32Value: ref.matchedUint32Value,
      matchedUint32Hex: ref.matchedUint32Hex,
      associatedCandidateIds: [],
      associatedRepresentationKinds: ['first-hop-site-offset'],
      shapeCount: siteInterpretations.length,
      interpretations: siteInterpretations,
    });
  }

  // Build Summaries and Matrices
  const addressSpaceMatrix = buildAddressSpaceMatrix(allInterpretations);
  const candidateSummaries = buildCandidateSummaries(allInterpretations);
  const twoHopTargetSummaries = buildTwoHopTargetSummaries(allInterpretations);
  const seedTraceEventSummary = buildSeedTraceEventSummary(allTraces);
  const seedTraceStopReasonSummary = buildSeedTraceStopReasonSummary(allTraces);
  const callBoundarySummary = summarizeCallBoundaries(allTraces);
  const callBoundaryTargetGroups = groupCallBoundaryTargets(callTraceItems);
  const localSeedUseSignatureGroups = groupLocalSeedUseSignatures(signatureItems);
  const decisionPatternTable = buildDecisionPatternTable(allInterpretations);

  // Controls
  const b2NegativeControls = contextResult.classifiedPositions.filter(
    (p) => p.shapeStatus === 'relative-control-field-shape',
  ).length;
  const b7NegativeControls = chainResult.uniquePhysicalReferrers.filter(
    (r) => r.secondOrderRole === 'relative-control-negative-referrer',
  ).length;
  const controls = buildControlsSummary(
    b2NegativeControls,
    b7NegativeControls,
    sites.map((s) => s.fileOffsetHex),
  );

  // Shape Summary
  const shapeSummary: Record<string, number> = {};
  for (const interp of allInterpretations) {
    shapeSummary[interp.shapeClass] = (shapeSummary[interp.shapeClass] ?? 0) + 1;
  }

  // Reconciliation
  const directPhysicalSitesInput = directPositions.length;
  const directPhysicalSitesProcessed = sites.filter(
    (s) => s.sourceKind === 'direct-candidate-first-hop',
  ).length;

  const directInterpExpected = directPositions.reduce(
    (acc, p) =>
      acc +
      p.matchingShapes.filter(
        (s) => s.isWhitelistedShape && s.shapeClass !== 'negative-rel32' && s.shapeClass !== 'unmatched-shape',
      ).length,
    0,
  );
  const directInterpProcessed = allInterpretations.filter(
    (i) => i.sourceKind === 'direct-candidate-first-hop',
  ).length;

  const twoHopSitesInput = twoHopReferrers.length;
  const twoHopSitesProcessed = sites.filter(
    (s) => s.sourceKind === 'two-hop-site-code-facing',
  ).length;

  const twoHopInterpExpected = twoHopReferrers.reduce(
    (acc, r) =>
      acc +
      r.matchingShapes.filter(
        (s) => s.isWhitelistedShape && s.shapeClass !== 'negative-rel32' && s.shapeClass !== 'unmatched-shape',
      ).length,
    0,
  );
  const twoHopInterpProcessed = allInterpretations.filter(
    (i) => i.sourceKind === 'two-hop-site-code-facing',
  ).length;

  const seedTraceEligible = allInterpretations.filter(
    (i) => i.semanticClass === 'register-immediate-seed',
  ).length;

  const directSiteIdsMissing: string[] = [];
  const shapeInterpretationsMissing: string[] = [];

  const allDirectSitesAccountedFor = directPhysicalSitesInput === directPhysicalSitesProcessed;
  const allShapeInterpretationsAccountedFor =
    directInterpExpected === directInterpProcessed &&
    twoHopInterpExpected === twoHopInterpProcessed;
  const allSeedTracesAccountedFor = seedTraceEligible === allTraces.length;
  const allCallBoundariesAccountedFor =
    callBoundarySummary.callBoundaryCount ===
    allTraces.filter((t) => t.stopReason === 'call-boundary').length;

  // Extended Reconciliation
  const candidateSummaryDirectSitesSum = candidateSummaries.reduce((acc, cs) => acc + cs.directSiteCount, 0);
  const candidateSummaryDirectSitesReconciled = candidateSummaryDirectSitesSum === directPhysicalSitesProcessed;

  const candidateSummaryInterpretationsSum = candidateSummaries.reduce((acc, cs) => acc + cs.interpretationCount, 0);
  const candidateSummaryInterpretationsReconciled = candidateSummaryInterpretationsSum === directInterpProcessed;

  const directInterpSeeds = allInterpretations.filter(
    (i) => i.sourceKind === 'direct-candidate-first-hop' && i.seedTrace !== null,
  ).length;
  const candidateSummarySeedsSum = candidateSummaries.reduce((acc, cs) => acc + cs.seedCount, 0);
  const candidateSummarySeedsReconciled = candidateSummarySeedsSum === directInterpSeeds;

  const directInterpCalls = allInterpretations.filter(
    (i) => i.sourceKind === 'direct-candidate-first-hop' && i.seedTrace?.stopReason === 'call-boundary',
  ).length;
  const candidateSummaryCallsSum = candidateSummaries.reduce((acc, cs) => acc + cs.callBoundaryCount, 0);
  const candidateSummaryCallsReconciled = candidateSummaryCallsSum === directInterpCalls;

  const candidateSummariesReconciled =
    candidateSummaryDirectSitesReconciled &&
    candidateSummaryInterpretationsReconciled &&
    candidateSummarySeedsReconciled &&
    candidateSummaryCallsReconciled;

  const directInterps = allInterpretations.filter((i) => i.sourceKind === 'direct-candidate-first-hop');
  const physicalCandidateCoordinatesReconciled =
    directInterps.length === 0 ||
    directInterps.every((i) => {
      if (
        i.targetCandidatePhysicalStructure !== null &&
        i.targetCandidatePhysicalStructure !== undefined &&
        i.targetCandidatePhysicalPayload !== null &&
        i.targetCandidatePhysicalPayload !== undefined
      ) {
        return (
          i.targetCandidatePhysicalPayload === i.targetCandidatePhysicalStructure + 2 &&
          i.targetCandidatePhysicalPayloadHex === toHex32(i.targetCandidatePhysicalStructure + 2) &&
          i.targetCandidatePhysicalStructureHex === toHex32(i.targetCandidatePhysicalStructure)
        );
      }
      return false;
    });

  const decisionPatternTableReconciled =
    decisionPatternTable.length >= 14 &&
    decisionPatternTable.every(
      (row) =>
        row.matchingSiteCount === row.matchingSiteIds.length &&
        row.matchedCount === row.matchedInterpretationCount &&
        row.matchedInterpretationCount >= row.matchingSiteCount,
    );

  const sumCandidateRelocation = candidateSummaries.reduce((sum, cs) => sum + cs.relocationAdjustmentCounts, 0);
  const twoHopRelocationTraces = allInterpretations.filter(
    (i) => i.sourceKind === 'two-hop-site-code-facing' && i.seedTrace?.seedRelocationBaseAdjusted,
  ).length;
  const totalTracesWithRelocAdjustment = allTraces.filter((t) => t.seedRelocationBaseAdjusted).length;
  const dpRelocRow = decisionPatternTable.find((row) => row.patternId === 'dp_relocation_adjustment_observed');

  const relocationObservationCountsReconciled =
    seedTraceEventSummary.seedRelocationBaseAdjusted === seedTracesRelocationBaseAdjusted &&
    seedTracesRelocationBaseAdjusted === totalTracesWithRelocAdjustment &&
    sumCandidateRelocation + twoHopRelocationTraces === seedTracesRelocationBaseAdjusted &&
    (dpRelocRow !== undefined && dpRelocRow.matchedInterpretationCount === seedTracesRelocationBaseAdjusted);

  const fixtureObservations = buildFixtureObservations(
    report.exePath,
    report.exeSize,
    directPhysicalSitesProcessed,
    twoHopSitesProcessed,
    seedTracesAttempted,
    callBoundarySummary.callBoundaryCount,
    callBoundaryTargetGroups,
    objectRelativeRelocationBaseMatchedCount,
    seedTracesRelocationBaseAdjusted,
    directLinearMatchesTargetCount,
  );

  const hasDirectLoadedStatement =
    directLinearMatchesTargetCount > 0
      ? fixtureObservations.some((o) => o.includes('Direct loaded-address interpretation matched') && !o.includes('No direct loaded-address'))
      : fixtureObservations.some((o) => o.includes('No direct loaded-address interpretation matched'));

  const hasRelocationStatement =
    seedTracesRelocationBaseAdjusted > 0
      ? fixtureObservations.some((o) => o.includes('Addition of the Object 1 relocation base was observed in'))
      : fixtureObservations.some((o) => o.includes('no relocation-base adjustment was observed'));

  const fixtureObservationsDerived =
    fixtureObservations.length >= 3 &&
    hasDirectLoadedStatement &&
    hasRelocationStatement;

  const derivedEvidenceReconciled =
    candidateSummariesReconciled &&
    physicalCandidateCoordinatesReconciled &&
    decisionPatternTableReconciled &&
    relocationObservationCountsReconciled &&
    fixtureObservationsDerived;

  const allReconciled =
    allDirectSitesAccountedFor &&
    allShapeInterpretationsAccountedFor &&
    allSeedTracesAccountedFor &&
    allCallBoundariesAccountedFor &&
    candidateAssociationsMissing.length === 0 &&
    !controls.control0x9C914Present &&
    derivedEvidenceReconciled;

  const reconciliation: MK1OperandUseReconciliation = {
    b2PositivePhysicalSitesInput: directPhysicalSitesInput,
    b2PositiveShapeInterpretationsInput: directInterpExpected,
    b8DirectPhysicalSitesProduced: directPhysicalSitesProcessed,
    b8DirectInterpretationsProduced: directInterpProcessed,
    b7PositiveSecondOrderSitesInput: twoHopSitesInput,
    b8TwoHopSitesProduced: twoHopSitesProcessed,
    b8TwoHopInterpretationsProduced: twoHopInterpProcessed,
    directSiteIdsMissing,
    unexpectedDirectSiteIds: [],
    shapeInterpretationsMissing,
    candidateAssociationsMissing,
    seedTraceEligibleInterpretations: seedTraceEligible,
    seedTraceResultsProduced: allTraces.length,
    callBoundaryTraces: callBoundarySummary.callBoundaryCount,
    callBoundarySummariesProduced: callBoundaryTargetGroups.reduce((acc, g) => acc + g.traceCount, 0),
    controlsInjectedIntoPositiveCounts: controls.control0x9C914Present ? 1 : 0,
    allDirectSitesAccountedFor,
    allShapeInterpretationsAccountedFor,
    allSeedTracesAccountedFor,
    allCallBoundariesAccountedFor,
    candidateSummariesReconciled,
    candidateSummaryDirectSitesReconciled,
    candidateSummaryInterpretationsReconciled,
    candidateSummarySeedsReconciled,
    candidateSummaryCallsReconciled,
    physicalCandidateCoordinatesReconciled,
    decisionPatternTableReconciled,
    relocationObservationCountsReconciled,
    fixtureObservationsDerived,
    derivedEvidenceReconciled,
    allReconciled,
  };

  const globalSummary: MK1OperandUseGlobalSummary = {
    totalUniquePhysicalSites: sites.length,
    directCandidateFirstHopSites: directPhysicalSitesProcessed,
    twoHopCodeFacingSites: twoHopSitesProcessed,
    totalPositiveInterpretations: allInterpretations.length,
    directPositiveInterpretations: directInterpProcessed,
    twoHopPositiveInterpretations: twoHopInterpProcessed,
    semanticCounts,
    linearResolutionCounts,
    directLinearMatchesTargetCount,
    directLinearResolvesOtherCount,
    directLinearUnmappedCount,
    objectRelativeCount,
    objectRelativeRelocationBaseMatchedCount,
    seedTracesAttempted,
    seedTracesReachingCall,
    seedTracesReachingJump,
    seedTracesReachingBranch,
    seedTracesReachingReturn,
    seedTracesReachingMemoryAccess,
    seedTracesOverwrittenBeforeUse,
    seedTracesUnsupportedOpcode,
    seedTracesSizeOverride,
    seedTracesMaxBytes,
    seedTracesMaxInstructions,
    seedTracesTargetCompatibleMemoryAddress,
    seedTracesRelocationBaseAdjusted,
  };

  const interpretationCaveats: string[] = [
    'NUMERIC EQUALITY != ADDRESS EQUALITY: A 32-bit constant matching a candidate offset does NOT establish that the program treats that value as a pointer or address.',
    'BOUNDED STRAIGHT-LINE SCOPE: Tracing evaluates only the immediate fall-through byte stream up to 48 bytes or 12 instructions, terminating at control-transfer boundaries (CALL, JMP, conditional branch, RET). Routine semantics, call targets, and multi-block CFGs are NOT modeled.',
    'CALL TARGET NUMERIC REGION != VERIFIED EXECUTION DESTINATION SEMANTICS: A near rel32 CALL target is classified topographically without following the call target.',
    'NO PALETTE CONSUMER CLAIM: Immediate register values and memory operands discovered here must NOT be claimed as verified palette loaders or consumers without active hardware/DAC color transfer proof.',
    'COINCIDENCE OF LOW VALUES: Small integer values occur routinely as counts, loop bounds, and flags in x86 code; exact reverse-reference equality alone is insufficient to prove structural relationship.',
    'OBJECT PRE-LE TARGET DISCONNECT: Operand values pointing into pre-LE file header regions resolve into unrelated Object code/data when interpreted as loaded linear addresses, disproving direct linear pointer identity.',
  ];

  const durationMs = Date.now() - startTime;
  logInfo('operand-use', 'b8a-complete', opId, 'Pass 1E.2B.8a completed', {
    sites: sites.length,
    interpretations: allInterpretations.length,
    reconciliation,
    durationMs,
  });

  return {
    status: allReconciled ? 'SUCCESS' : 'FAILED',
    failureReason: allReconciled ? undefined : 'Operand use reconciliation invariant failed',
    failedStage: allReconciled ? undefined : 'reconciliation',
    metadata: {
      operationId: opId,
      timestamp: new Date().toISOString(),
      durationMs,
      milestone: '1E.2B.8a.2',
    },
    fixture: {
      exePath: report.exePath,
      exeSize: report.exeSize,
      exeSizeHex: toHex32(report.exeSize),
    },
    traceConfiguration: TRACE_CONFIG,
    upstreamSummary: {
      layoutAvailable: true,
      b2Status: contextResult.status,
      b2PositivePhysicalSites: directPhysicalSitesInput,
      b2PositiveShapeInterpretations: directInterpExpected,
      b6Status: fusionResult.status,
      b6CandidateCount: fusionResult.candidateProfiles.length,
      b7Status: chainResult.status,
      b7PositiveSecondHopReferrerCount: twoHopSitesInput,
    },
    reconciliation,
    globalSummary,
    addressSpaceMatrix,
    shapeSummary,
    operandSemanticSummary: semanticCounts,
    seedTraceEventSummary,
    seedTraceStopReasonSummary,
    callBoundarySummary,
    callBoundaryTargetGroups,
    localSeedUseSignatureGroups,
    candidateSummaries,
    twoHopTargetSummaries,
    sites,
    interpretations: allInterpretations,
    boundedTraceDetails: allTraces,
    controls,
    decisionPatternTable,
    interpretationCaveats,
    fixtureObservations,
  };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return createFailedResult(message, 'execution', opId, report);
  }
}

function createFailedResult(
  reason: string,
  stage: string,
  operationId: string,
  report?: MK1ExecutableLayoutReport,
  reconciliationPartial?: Partial<MK1OperandUseReconciliation>,
): MK1PaletteOperandUseResult {
  logError('operand-use', 'b8a-failure', operationId, reason, { stage });

  const emptyReconciliation: MK1OperandUseReconciliation = {
    b2PositivePhysicalSitesInput: 0,
    b2PositiveShapeInterpretationsInput: 0,
    b8DirectPhysicalSitesProduced: 0,
    b8DirectInterpretationsProduced: 0,
    b7PositiveSecondOrderSitesInput: 0,
    b8TwoHopSitesProduced: 0,
    b8TwoHopInterpretationsProduced: 0,
    directSiteIdsMissing: [],
    unexpectedDirectSiteIds: [],
    shapeInterpretationsMissing: [],
    candidateAssociationsMissing: [],
    seedTraceEligibleInterpretations: 0,
    seedTraceResultsProduced: 0,
    callBoundaryTraces: 0,
    callBoundarySummariesProduced: 0,
    controlsInjectedIntoPositiveCounts: 0,
    allDirectSitesAccountedFor: false,
    allShapeInterpretationsAccountedFor: false,
    allSeedTracesAccountedFor: false,
    allCallBoundariesAccountedFor: false,
    candidateSummariesReconciled: false,
    candidateSummaryDirectSitesReconciled: false,
    candidateSummaryInterpretationsReconciled: false,
    candidateSummarySeedsReconciled: false,
    candidateSummaryCallsReconciled: false,
    physicalCandidateCoordinatesReconciled: false,
    decisionPatternTableReconciled: false,
    relocationObservationCountsReconciled: false,
    fixtureObservationsDerived: false,
    derivedEvidenceReconciled: false,
    allReconciled: false,
    ...reconciliationPartial,
  };

  const emptyGlobalSummary: MK1OperandUseGlobalSummary = {
    totalUniquePhysicalSites: 0,
    directCandidateFirstHopSites: 0,
    twoHopCodeFacingSites: 0,
    totalPositiveInterpretations: 0,
    directPositiveInterpretations: 0,
    twoHopPositiveInterpretations: 0,
    semanticCounts: {
      'register-immediate-seed': 0,
      'push-immediate-value': 0,
      'accumulator-arithmetic-immediate': 0,
      'direct-memory-load-address': 0,
      'direct-memory-store-address': 0,
      'lea-address-computation': 0,
      'other-whitelisted-immediate': 0,
    },
    linearResolutionCounts: {
      'exact-associated-structure-linear': 0,
      'exact-associated-payload-linear': 0,
      'resolves-other-loaded-location': 0,
      'linear-address-unmapped': 0,
      'segment-override-unresolved': 0,
      'not-applicable-non-address-operand': 0,
    },
    directLinearMatchesTargetCount: 0,
    directLinearResolvesOtherCount: 0,
    directLinearUnmappedCount: 0,
    objectRelativeCount: 0,
    objectRelativeRelocationBaseMatchedCount: 0,
    seedTracesAttempted: 0,
    seedTracesReachingCall: 0,
    seedTracesReachingJump: 0,
    seedTracesReachingBranch: 0,
    seedTracesReachingReturn: 0,
    seedTracesReachingMemoryAccess: 0,
    seedTracesOverwrittenBeforeUse: 0,
    seedTracesUnsupportedOpcode: 0,
    seedTracesSizeOverride: 0,
    seedTracesMaxBytes: 0,
    seedTracesMaxInstructions: 0,
    seedTracesTargetCompatibleMemoryAddress: 0,
    seedTracesRelocationBaseAdjusted: 0,
  };

  return {
    status: 'FAILED',
    failureReason: reason,
    failedStage: stage,
    metadata: {
      operationId,
      timestamp: new Date().toISOString(),
      durationMs: 0,
      milestone: '1E.2B.8a.2',
    },
    fixture: {
      exePath: report?.exePath ?? 'MK1.EXE',
      exeSize: report?.exeSize ?? 0,
      exeSizeHex: toHex32(report?.exeSize ?? 0),
    },
    traceConfiguration: TRACE_CONFIG,
    upstreamSummary: {
      layoutAvailable: Boolean(report),
      b2Status: 'UNKNOWN',
      b2PositivePhysicalSites: 0,
      b2PositiveShapeInterpretations: 0,
      b6Status: 'UNKNOWN',
      b6CandidateCount: 0,
      b7Status: 'UNKNOWN',
      b7PositiveSecondHopReferrerCount: 0,
    },
    reconciliation: emptyReconciliation,
    globalSummary: emptyGlobalSummary,
    addressSpaceMatrix: { rows: [], columns: [], matrix: {} },
    shapeSummary: {},
    operandSemanticSummary: emptyGlobalSummary.semanticCounts,
    seedTraceEventSummary: {
      seedCopied: 0,
      seedAffineAdjusted: 0,
      seedRelocationBaseAdjusted: 0,
      seedUsedAsMemoryBase: 0,
      seedUsedAsMemoryIndex: 0,
      seedPartialMemoryAddressUse: 0,
      seedTargetCoordinateValueReached: 0,
      seedTargetCompatibleMemoryAddressObserved: 0,
      seedPushed: 0,
      seedOverwritten: 0,
      seedLiveAtCallBoundary: 0,
    },
    seedTraceStopReasonSummary: {},
    callBoundarySummary: {
      callBoundaryCount: 0,
      distinctCallTargetCount: 0,
      callTargetsWithinSourceObjectVirtualRange: 0,
      callTargetsWithinSourceObjectFileBackedRange: 0,
      callTargetsOutsideSourceObjectVirtualRange: 0,
      numericTargetsResolvingSourceObject: 0,
      numericTargetsResolvingOtherObject: 0,
      numericTargetsUnmapped: 0,
    },
    callBoundaryTargetGroups: [],
    localSeedUseSignatureGroups: [],
    candidateSummaries: [],
    twoHopTargetSummaries: [],
    sites: [],
    interpretations: [],
    boundedTraceDetails: [],
    controls: {
      b2NegativeRelativeControlsCount: 0,
      b7NegativeSecondOrderRelativeControlsCount: 0,
      control0x9C914Present: false,
      controlsExcludedFromPositiveCounts: true,
      details: [],
    },
    decisionPatternTable: [],
    interpretationCaveats: [],
    fixtureObservations: [],
  };
}

/**
 * Creates the compact JSON export for Pass 1E.2B.8a using schema mk1_palette_operand_use_recon_v1.
 */
export function createMK1PaletteOperandUseExport(
  result: MK1PaletteOperandUseResult,
): MK1CompactPaletteOperandUseExport {
  return {
    status: result.status,
    failureReason: result.failureReason,
    failedStage: result.failedStage,
    metadata: {
      formatVersion: 'mk1_palette_operand_use_recon_v1',
      exportTimestamp: new Date().toISOString(),
      application: 'MK DOS Archive Research Suite',
      version: '0.1.0',
      milestone: '1E.2B.8a.2',
      operationId: result.metadata.operationId,
    },
    fixture: { ...result.fixture },
    traceConfiguration: { ...result.traceConfiguration },
    upstreamSummary: { ...result.upstreamSummary },
    reconciliation: { ...result.reconciliation },
    globalSummary: { ...result.globalSummary },
    addressSpaceMatrix: { ...result.addressSpaceMatrix },
    shapeSummary: { ...result.shapeSummary },
    operandSemanticSummary: { ...result.operandSemanticSummary },
    seedTraceEventSummary: { ...result.seedTraceEventSummary },
    seedTraceStopReasonSummary: { ...result.seedTraceStopReasonSummary },
    callBoundarySummary: { ...result.callBoundarySummary },
    callBoundaryTargetGroups: [...result.callBoundaryTargetGroups],
    localSeedUseSignatureGroups: [...result.localSeedUseSignatureGroups],
    candidateSummaries: [...result.candidateSummaries],
    twoHopTargetSummaries: [...result.twoHopTargetSummaries],
    sites: result.sites,
    interpretations: result.interpretations,
    boundedTraceDetails: result.boundedTraceDetails,
    controls: { ...result.controls },
    decisionPatternTable: [...result.decisionPatternTable],
    interpretationCaveats: [...result.interpretationCaveats],
    fixtureObservations: [...result.fixtureObservations],
  };
}
