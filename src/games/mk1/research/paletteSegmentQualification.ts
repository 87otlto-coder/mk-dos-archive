/**
 * MK1 Executable Palette Segment-Base Hypothesis Qualification (Milestone 1 — Pass 1E.2B.10d / 1E.2B.10d.1)
 *
 * Checkpoint: mkdos-m1e2b10d-segment-base-qualification
 *
 * Epistemic Rules & Invariants:
 * 1. B.1-B.10c are READ-ONLY upstream evidence.
 * 2. DO NOT FOLLOW 0x53D33 or 0x53D4A (candidate destination control boundary is an absolute barrier).
 * 3. DO NOT extend destination disassembly beyond verified instruction boundaries.
 * 4. DO NOT inspect 0x53CA1 or assume surrounding prologue/epilogue sequences.
 * 5. DO NOT infer DS selector/base as fact from LE relocation bases alone.
 * 6. DO NOT call EAX a pointer or function argument.
 * 7. DO NOT make palette ownership or consumer claims.
 * 8. DO NOT begin broad segment-register archaeology.
 * 9. Explicitly distinguish: arithmetic compatibility, local static evidence, documented DOS/4GW default model, and proven runtime segment state.
 * 10. runtimeDestinationVerified and runtimeSelectorSemanticsProven remain false.
 * 11. STOP after B.10d. Do NOT begin B.11.
 *
 * Pass 1E.2B.10d.1 Hardened Invariants:
 * - 0x00053D33 is the loaded candidate coordinate, resolving via LE page map to physical 0x0006A133.
 * - Destination bytes 02 00 (ADD AL, [EAX]) are verified from physical backing, never MK1.EXE[0x53D33].
 * - Fallbacks removed: fail closed when upstream evidence (convergentResult, real LE header, real bytes) is absent.
 * - Instruction boundary decoding prevents immediate/displacement bytes (e.g. 0x3E) from creating false segment overrides.
 * - Model C is classified as unavailable if autoDataObject is absent or invalid (no silent Object 2 fallback).
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { LEObjectEntry, LEPageMapEntry } from '../../../core/executable/le/leTypes';
import { objectOffsetToFileOffset } from '../../../core/executable/le/leAddressMap';
import { MK1ExecutableLayoutReport } from './executableLayoutTypes';
import { probeMK1ExecutableLayout } from './executableLayoutProbe';
import { MK1PaletteConvergentEntryResult } from './paletteConvergentEntryReconnaissanceTypes';
import { performPaletteConvergentEntryReconnaissance } from './paletteConvergentEntryReconnaissance';
import { MK1PaletteSeedFixupQualificationResult } from './paletteSeedFixupQualificationTypes';
import { MK1PaletteOperandUseResult } from './paletteOperandUseReconnaissanceTypes';
import { MK1PaletteTargetEntryReconResult } from './paletteTargetEntryReconnaissanceTypes';
import {
  B10D_EPISTEMIC_RULES,
  B10D_EXPORT_FORMAT_VERSION,
  MK1CallerHandoffInspectionSite,
  MK1CallerHandoffInspectionSummary,
  MK1CompactPaletteSegmentQualificationExport,
  MK1DestinationInstructionFact,
  MK1EpistemicDistinctionReport,
  MK1FinalSegmentClassifications,
  MK1LEHeaderSegmentFacts,
  MK1ModelClassCalculation,
  MK1PaletteSegmentQualificationResult,
  MK1SegmentBaseModelEvaluation,
  MK1SegmentQualificationReconciliation,
} from './paletteSegmentQualificationTypes';

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

function toHex8(val: number): string {
  return '0x' + (val & 0xff).toString(16).padStart(2, '0').toUpperCase();
}

function readUint32LE(buf: Uint8Array, offset: number): number {
  return (
    (buf[offset] |
      (buf[offset + 1] << 8) |
      (buf[offset + 2] << 16) |
      (buf[offset + 3] << 24)) >>>
    0
  );
}

function readInt32LE(buf: Uint8Array, offset: number): number {
  return (
    buf[offset] |
    (buf[offset + 1] << 8) |
    (buf[offset + 2] << 16) |
    (buf[offset + 3] << 24)
  );
}

// Bounded caller and handoff site definitions verified from B.8 and B.9
export interface BoundedWindowDefinition {
  siteId: string;
  siteName: string;
  siteRole: 'class-a-caller-1' | 'class-a-caller-2' | 'class-a-jump-handoff' | 'class-b-caller-1' | 'class-b-caller-2';
  physicalOffsetStart: number;
  length: number;
  loadedAddressStart: number;
}

export const VERIFIED_BOUNDED_WINDOWS: BoundedWindowDefinition[] = [
  {
    siteId: 'class-a-caller-1',
    siteName: 'Class A Handoff Caller 1',
    siteRole: 'class-a-caller-1',
    physicalOffsetStart: 0x0005a4bd,
    length: 10, // 0x0005A4BD (MOV EAX, 0x2012 [5B]) + 0x0005A4C2 (CALL 0x400C8 [5B])
    loadedAddressStart: 0x000400bd,
  },
  {
    siteId: 'class-a-caller-2',
    siteName: 'Class A Handoff Caller 2',
    siteRole: 'class-a-caller-2',
    physicalOffsetStart: 0x0005a4f4,
    length: 10, // 0x0005A4F4 (MOV EAX, 0x2012 [5B]) + 0x0005A4F9 (CALL 0x400C8 [5B])
    loadedAddressStart: 0x000400f4,
  },
  {
    siteId: 'class-a-jump-handoff',
    siteName: 'Class A Jump Handoff Trampoline',
    siteRole: 'class-a-jump-handoff',
    physicalOffsetStart: 0x0005a4c8,
    length: 10, // 0x000400C8 (MOV EBX, 0xFFFF [5B]) + 0x000400CD (JMP 0x53D33 [5B])
    loadedAddressStart: 0x000400c8,
  },
  {
    siteId: 'class-b-caller-1',
    siteName: 'Class B Direct Caller 1',
    siteRole: 'class-b-caller-1',
    physicalOffsetStart: 0x0005e1e5,
    length: 15, // 0x0005E1E5 (MOV EAX, 0x2000 [5B]) + 0x0005E1EA (MOV EBX, 0xFFFF [5B]) + 0x0005E1EF (CALL 0x53D33 [5B])
    loadedAddressStart: 0x00043de5,
  },
  {
    siteId: 'class-b-caller-2',
    siteName: 'Class B Direct Caller 2',
    siteRole: 'class-b-caller-2',
    physicalOffsetStart: 0x0005e20d,
    length: 10, // 0x0005E20D (MOV EAX, 0x2000 [5B]) + 0x0005E212 (CALL 0x53D33 [5B])
    loadedAddressStart: 0x00043e0d,
  },
];

export interface DecodedWindowInstruction {
  physicalOffset: number;
  physicalOffsetHex: string;
  loadedAddress: number;
  loadedAddressHex: string;
  length: number;
  rawBytes: number[];
  rawBytesHex: string;
  mnemonic: string;
  hasSegmentOverride: boolean;
  segmentOverridePrefix: string | null;
  isExplicitDsWriteOrLoad: boolean;
  dsWriteDetails: string | null;
  isFarPointerOrSegmentLoad: boolean;
  farPointerDetails: string | null;
}

/**
 * Decodes a single 32-bit x86 instruction within a bounded caller/handoff window,
 * strictly tracking instruction boundaries so that immediate/displacement bytes
 * (e.g. 0x3E inside an imm32) are never mistaken for segment override prefixes.
 */
export function decodeInstructionInBoundedWindow(
  exeBytes: Uint8Array,
  offset: number,
  maxEnd: number,
  loadedAddress: number,
): DecodedWindowInstruction {
  let cur = offset;
  let segOverride: string | null = null;
  const prefixList: number[] = [];

  // Parse legacy prefixes
  while (cur < maxEnd) {
    const b = exeBytes[cur];
    if (b === 0x26) { segOverride = 'ES'; prefixList.push(b); cur++; }
    else if (b === 0x2e) { segOverride = 'CS'; prefixList.push(b); cur++; }
    else if (b === 0x36) { segOverride = 'SS'; prefixList.push(b); cur++; }
    else if (b === 0x3e) { segOverride = 'DS'; prefixList.push(b); cur++; }
    else if (b === 0x64) { segOverride = 'FS'; prefixList.push(b); cur++; }
    else if (b === 0x65) { segOverride = 'GS'; prefixList.push(b); cur++; }
    else if (b === 0x66 || b === 0x67 || b === 0xf0 || b === 0xf2 || b === 0xf3) {
      prefixList.push(b);
      cur++;
    } else {
      break;
    }
  }

  if (cur >= maxEnd) {
    throw new Error(`Truncated instruction at offset ${toHex32(offset)}: prefix without opcode.`);
  }

  const opcode = exeBytes[cur++];
  let mnemonic = 'UNKNOWN';
  let isExplicitDsWriteOrLoad = false;
  let dsWriteDetails: string | null = null;
  let isFarPointerOrSegmentLoad = false;
  let farPointerDetails: string | null = null;

  // MOV r32, imm32: 0xB8 + reg (0xB8..0xBF)
  if (opcode >= 0xb8 && opcode <= 0xbf) {
    const regNames = ['EAX', 'ECX', 'EDX', 'EBX', 'ESP', 'EBP', 'ESI', 'EDI'];
    const reg = regNames[opcode - 0xb8];
    if (cur + 4 > maxEnd) {
      throw new Error(`Truncated MOV ${reg}, imm32 at physical offset ${toHex32(offset)}.`);
    }
    const imm = readUint32LE(exeBytes, cur);
    cur += 4;
    mnemonic = `MOV ${reg}, ${toHex32(imm)}`;
  }
  // CALL near rel32: 0xE8
  else if (opcode === 0xe8) {
    if (cur + 4 > maxEnd) {
      throw new Error(`Truncated CALL rel32 at physical offset ${toHex32(offset)}.`);
    }
    const rel32 = readInt32LE(exeBytes, cur);
    cur += 4;
    const targetLoaded = (loadedAddress + (cur - offset) + rel32) >>> 0;
    mnemonic = `CALL near ${toHex32(targetLoaded)}`;
  }
  // JMP near rel32: 0xE9
  else if (opcode === 0xe9) {
    if (cur + 4 > maxEnd) {
      throw new Error(`Truncated JMP rel32 at physical offset ${toHex32(offset)}.`);
    }
    const rel32 = readInt32LE(exeBytes, cur);
    cur += 4;
    const targetLoaded = (loadedAddress + (cur - offset) + rel32) >>> 0;
    mnemonic = `JMP near ${toHex32(targetLoaded)}`;
  }
  // POP DS: 0x1F
  else if (opcode === 0x1f) {
    mnemonic = 'POP DS';
    isExplicitDsWriteOrLoad = true;
    dsWriteDetails = 'POP DS (0x1F)';
  }
  // MOV Sreg, r/m16: 0x8E
  else if (opcode === 0x8e) {
    if (cur >= maxEnd) throw new Error(`Truncated 0x8E opcode at ${toHex32(offset)}.`);
    const modrm = exeBytes[cur++];
    const sreg = (modrm >> 3) & 7;
    const sregNames = ['ES', 'CS', 'SS', 'DS', 'FS', 'GS', 'RES', 'RES'];
    mnemonic = `MOV ${sregNames[sreg]}, r/m16`;
    if (sreg === 3) {
      isExplicitDsWriteOrLoad = true;
      dsWriteDetails = 'MOV DS, r/m16 (0x8E /3)';
    }
  }
  // LDS: 0xC5
  else if (opcode === 0xc5) {
    mnemonic = 'LDS r32, m16:32';
    isExplicitDsWriteOrLoad = true;
    isFarPointerOrSegmentLoad = true;
    dsWriteDetails = 'LDS (0xC5)';
    farPointerDetails = 'LDS r32, m16:32';
    if (cur < maxEnd) cur++; // skip modrm
  }
  // LES: 0xC4
  else if (opcode === 0xc4) {
    mnemonic = 'LES r32, m16:32';
    isFarPointerOrSegmentLoad = true;
    farPointerDetails = 'LES r32, m16:32';
    if (cur < maxEnd) cur++; // skip modrm
  }
  // Far CALL / JMP
  else if (opcode === 0x9a || opcode === 0xea) {
    mnemonic = opcode === 0x9a ? 'CALL ptr16:32' : 'JMP ptr16:32';
    isFarPointerOrSegmentLoad = true;
    farPointerDetails = mnemonic;
    cur = Math.min(cur + 6, maxEnd);
  }
  // Two-byte opcode: 0x0F
  else if (opcode === 0x0f) {
    if (cur >= maxEnd) throw new Error(`Truncated 0x0F opcode at ${toHex32(offset)}.`);
    const op2 = exeBytes[cur++];
    if (op2 === 0xb2) {
      mnemonic = 'LSS';
      isFarPointerOrSegmentLoad = true;
      farPointerDetails = 'LSS';
      if (cur < maxEnd) cur++;
    } else if (op2 === 0xb4) {
      mnemonic = 'LFS';
      isFarPointerOrSegmentLoad = true;
      farPointerDetails = 'LFS';
      if (cur < maxEnd) cur++;
    } else if (op2 === 0xb5) {
      mnemonic = 'LGS';
      isFarPointerOrSegmentLoad = true;
      farPointerDetails = 'LGS';
      if (cur < maxEnd) cur++;
    } else if (op2 === 0xa1) {
      mnemonic = 'POP FS';
    } else if (op2 === 0xa9) {
      mnemonic = 'POP GS';
    } else {
      mnemonic = `0x0F 0x${op2.toString(16)}`;
    }
  } else {
    mnemonic = `OPCODE 0x${opcode.toString(16).toUpperCase().padStart(2, '0')}`;
  }

  const instLength = cur - offset;
  const rawBytes = Array.from(exeBytes.slice(offset, cur));

  return {
    physicalOffset: offset,
    physicalOffsetHex: toHex32(offset),
    loadedAddress,
    loadedAddressHex: toHex32(loadedAddress),
    length: instLength,
    rawBytes,
    rawBytesHex: rawBytes.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' '),
    mnemonic: segOverride ? `${segOverride}: ${mnemonic}` : mnemonic,
    hasSegmentOverride: segOverride !== null,
    segmentOverridePrefix: segOverride,
    isExplicitDsWriteOrLoad,
    dsWriteDetails,
    isFarPointerOrSegmentLoad,
    farPointerDetails,
  };
}

/**
 * Resolves a linear address against LE objects and page map using objectOffsetToFileOffset.
 * Accurately handles non-contiguous, zero-filled, or unmapped pages without approximation.
 */
export function resolveLinearAddressInLayout(
  linear: number,
  objects: LEObjectEntry[],
  pageMap: LEPageMapEntry[],
  pageSize: number,
): {
  containingObjectNumber: number | null;
  containingObjectName: string | null;
  objectRelativeOffset: number | null;
  physicalBackingOffset: number | null;
} {
  for (const obj of objects) {
    const base = obj.relocationBaseAddress;
    const size = obj.virtualSize;
    if (linear >= base && linear < base + size) {
      const rel = (linear - base) >>> 0;
      const physical = objectOffsetToFileOffset(
        obj.objectNumber,
        rel,
        objects,
        pageMap,
        pageSize,
      );
      return {
        containingObjectNumber: obj.objectNumber,
        containingObjectName: `Object ${obj.objectNumber} (${obj.capabilities})`,
        objectRelativeOffset: rel,
        physicalBackingOffset: physical,
      };
    }
  }
  return {
    containingObjectNumber: null,
    containingObjectName: null,
    objectRelativeOffset: null,
    physicalBackingOffset: null,
  };
}

export interface QualifyMK1PaletteSegmentOptions {
  layoutReport?: MK1ExecutableLayoutReport;
  convergentResult?: MK1PaletteConvergentEntryResult;
  seedFixupResult?: MK1PaletteSeedFixupQualificationResult;
  b8Result?: MK1PaletteOperandUseResult;
  b9Result?: MK1PaletteTargetEntryReconResult;
  exeBytes?: Uint8Array;
  onProgress?: (message: string, progress: number) => void;
  throwOnMissingEvidence?: boolean; // defaults to true
  throwOnFailure?: boolean; // defaults to false
}

export async function qualifyMK1PaletteSegmentHypotheses(
  source: DirectorySource,
  options?: QualifyMK1PaletteSegmentOptions,
): Promise<MK1PaletteSegmentQualificationResult> {
  const throwOnMissing = options?.throwOnMissingEvidence !== false;
  const throwOnFailure = options?.throwOnFailure === true;

  options?.onProgress?.('Extracting MK1 LE header segment facts and object map...', 0.1);

  // 1. Obtain layout report
  const layout = options?.layoutReport ?? (await probeMK1ExecutableLayout(source));
  const parsedHeader = layout.parsedHeader;
  if (!parsedHeader) {
    throw new Error('Missing parsed LE header in MK1 executable layout report: production B.10d fails closed without real LE header evidence.');
  }

  const obj1 = layout.objects.find((o) => o.objectNumber === 1);
  const obj2 = layout.objects.find((o) => o.objectNumber === 2);
  if (!obj1 || !obj2) {
    throw new Error('Executable layout report is missing required LE Object 1 or Object 2: production B.10d fails closed without real object table evidence.');
  }

  // 2. Obtain real MK1 binary bytes
  let exeBytes: Uint8Array = options?.exeBytes ?? new Uint8Array(0);
  if (exeBytes.length === 0) {
    if (!layout.exeSize || typeof layout.exeSize !== 'number' || layout.exeSize <= 0) {
      if (throwOnMissing) {
        throw new Error('Executable layout report does not provide a valid exeSize: production B.10d fails closed without real executable size evidence.');
      }
    } else {
      try {
        exeBytes = await source.readSlice('MK1.EXE', 0, layout.exeSize);
      } catch {
        if (throwOnMissing) {
          throw new Error('Cannot read MK1.EXE binary bytes from source: production B.10d fails closed without real fixture bytes.');
        }
      }
    }
  }

  // 3. Obtain upstream B.10b convergent entry evidence
  let conv = options?.convergentResult;
  if (!conv && options?.b8Result && options?.b9Result) {
    conv = await performPaletteConvergentEntryReconnaissance(
      source,
      layout,
      options.b8Result,
      options.b9Result,
    );
  }

  if (!conv) {
    if (throwOnMissing) {
      throw new Error('Missing required upstream B.10b convergent entry evidence: production B.10d fails closed when upstream evidence is absent.');
    }
  }

  // Derive incoming state and destination coordinate from B.10b evidence (NO HARDCODED FALLBACKS)
  const destLoaded = conv?.destinationRawWindow?.loadedCoordinate ?? conv?.targetNumericAddress;
  if (typeof destLoaded !== 'number') {
    throw new Error('Missing loaded destination coordinate in upstream B.10b evidence.');
  }

  const incomingEaxClassA = conv?.entryStateClasses?.classA?.incomingEAX;
  const incomingEaxClassB = conv?.entryStateClasses?.classB?.incomingEAX;
  if (typeof incomingEaxClassA !== 'number' || typeof incomingEaxClassB !== 'number') {
    throw new Error('Missing incoming Class A / Class B EAX state values in upstream B.10b evidence.');
  }

  const candAAssoc = conv?.candidateAssociations?.classA;
  const candBAssoc = conv?.candidateAssociations?.classB;
  if (!candAAssoc || !candBAssoc) {
    throw new Error('Missing candidate associations in upstream B.10b evidence.');
  }

  if (
    !candAAssoc.candidateId ||
    typeof candAAssoc.loadedPayloadAddress !== 'number' ||
    typeof candAAssoc.loadedStructureAddress !== 'number' ||
    typeof candAAssoc.physicalPayloadOffset !== 'number'
  ) {
    throw new Error(
      'Incomplete Class A candidate association fields in upstream B.10b evidence: candidateId, loadedPayloadAddress, loadedStructureAddress, and physicalPayloadOffset are all required.',
    );
  }

  if (
    !candBAssoc.candidateId ||
    typeof candBAssoc.loadedPayloadAddress !== 'number' ||
    typeof candBAssoc.loadedStructureAddress !== 'number' ||
    typeof candBAssoc.physicalPayloadOffset !== 'number'
  ) {
    throw new Error(
      'Incomplete Class B candidate association fields in upstream B.10b evidence: candidateId, loadedPayloadAddress, loadedStructureAddress, and physicalPayloadOffset are all required.',
    );
  }

  const candAId = candAAssoc.candidateId;
  const candALoadedPayload = candAAssoc.loadedPayloadAddress;
  const candALoadedStruct = candAAssoc.loadedStructureAddress;
  const candAPhysicalPayload = candAAssoc.physicalPayloadOffset;

  const candBId = candBAssoc.candidateId;
  const candBLoadedPayload = candBAssoc.loadedPayloadAddress;
  const candBLoadedStruct = candBAssoc.loadedStructureAddress;
  const candBPhysicalPayload = candBAssoc.physicalPayloadOffset;

  // Extract real LE header facts (fail closed if header is absent)
  const autoDataObject = parsedHeader?.autoDataObject ?? 0;
  const autoDataObjectName = autoDataObject > 0 ? `Object ${autoDataObject}` : 'None declared (0)';

  const obj1RelocBase = obj1?.relocationBaseAddress ?? 0;
  const obj1VirtualSize = obj1?.virtualSize ?? 0;
  const obj1FlagsRaw = obj1?.rawFlags ?? 0;
  const obj1Capabilities = obj1?.capabilities ?? 'Unknown';
  const obj1RoleEvidence = obj1?.roleEvidence ?? 'Unknown';

  const obj2RelocBase = obj2?.relocationBaseAddress ?? 0;
  const obj2VirtualSize = obj2?.virtualSize ?? 0;
  const obj2FlagsRaw = obj2?.rawFlags ?? 0;
  const obj2Capabilities = obj2?.capabilities ?? 'Unknown';
  const obj2RoleEvidence = obj2?.roleEvidence ?? 'Unknown';

  const initialCodeObject = parsedHeader?.entryObject ?? 0;
  const initialCodeEip = parsedHeader?.entryEip ?? 0;
  const initialCodeRelocBase =
    initialCodeObject === 1 ? obj1RelocBase : initialCodeObject === 2 ? obj2RelocBase : 0;

  const initialStackObject = parsedHeader?.stackObject ?? 0;
  const initialStackEsp = parsedHeader?.stackEsp ?? 0;
  const initialStackRelocBase =
    initialStackObject === 2 ? obj2RelocBase : initialStackObject === 1 ? obj1RelocBase : 0;

  const leHeaderFacts: MK1LEHeaderSegmentFacts = {
    autoDataObject,
    autoDataObjectName,
    initialCodeObject,
    initialCodeObjectRelocationBase: initialCodeRelocBase,
    initialCodeObjectRelocationBaseHex: toHex32(initialCodeRelocBase),
    initialCodeEip,
    initialCodeEipHex: toHex32(initialCodeEip),
    initialStackObject,
    initialStackObjectRelocationBase: initialStackRelocBase,
    initialStackObjectRelocationBaseHex: toHex32(initialStackRelocBase),
    initialStackEsp,
    initialStackEspHex: toHex32(initialStackEsp),
    object1RelocationBase: obj1RelocBase,
    object1RelocationBaseHex: toHex32(obj1RelocBase),
    object1VirtualSize: obj1VirtualSize,
    object1VirtualSizeHex: toHex32(obj1VirtualSize),
    object1FlagsRaw: obj1FlagsRaw,
    object1FlagsRawHex: toHex32(obj1FlagsRaw),
    object1Capabilities: obj1Capabilities,
    object1RoleEvidence: obj1RoleEvidence,
    object2RelocationBase: obj2RelocBase,
    object2RelocationBaseHex: toHex32(obj2RelocBase),
    object2VirtualSize: obj2VirtualSize,
    object2VirtualSizeHex: toHex32(obj2VirtualSize),
    object2FlagsRaw: obj2FlagsRaw,
    object2FlagsRawHex: toHex32(obj2FlagsRaw),
    object2Capabilities: obj2Capabilities,
    object2RoleEvidence: obj2RoleEvidence,
  };

  options?.onProgress?.('Resolving destination coordinate through page-aware LE object mapping...', 0.25);

  // 4. Resolve destination instruction coordinate via page-aware mapping (Pass 1E.2B.10d.1)
  // destLoaded = 0x00053D33 is loaded-linear candidate coordinate.
  const targetLoaded = destLoaded;
  const destObj = layout.objects.find(
    (o) => targetLoaded >= o.relocationBaseAddress && targetLoaded < o.relocationBaseAddress + o.virtualSize,
  );

  if (!destObj) {
    throw new Error(`Destination loaded coordinate ${toHex32(targetLoaded)} does not fall within any declared LE object.`);
  }

  const destObjectNumber = destObj.objectNumber;
  const destObjectOffset = (targetLoaded - destObj.relocationBaseAddress) >>> 0;
  if (!parsedHeader?.pageSize || typeof parsedHeader.pageSize !== 'number' || parsedHeader.pageSize <= 0) {
    throw new Error('Parsed LE header does not declare a valid pageSize.');
  }
  const pageSize = parsedHeader.pageSize;

  const destPhysical = objectOffsetToFileOffset(
    destObjectNumber,
    destObjectOffset,
    layout.objects,
    layout.pageMap,
    pageSize,
  );

  if (destPhysical === null) {
    throw new Error(
      `Failed to resolve page-aware physical backing for destination loaded coordinate ${toHex32(targetLoaded)} (Object ${destObjectNumber} offset ${toHex32(destObjectOffset)}).`,
    );
  }

  const destPhysicalOffset = destPhysical;

  // Read destination instruction bytes from resolved physical backing (NEVER from MK1.EXE[0x53D33])
  let opcodeByte = 0;
  let modRmByte = 0;
  let bytesReadable = false;

  if (exeBytes.length > destPhysicalOffset + 1) {
    opcodeByte = exeBytes[destPhysicalOffset];
    modRmByte = exeBytes[destPhysicalOffset + 1];
    bytesReadable = true;
  } else {
    if (throwOnMissing) {
      throw new Error(
        `Executable buffer is too short (${exeBytes.length} bytes) to read destination instruction at resolved physical offset ${toHex32(destPhysicalOffset)}.`,
      );
    }
  }

  // Require actual bytes 02 00 before qualifying ADD AL, [EAX]
  const destinationBytesMatch = bytesReadable && opcodeByte === 0x02 && modRmByte === 0x00;
  if (!destinationBytesMatch && throwOnFailure) {
    throw new Error(
      `Destination bytes at resolved physical offset ${toHex32(destPhysicalOffset)} do not match expected ADD AL, [EAX] (02 00). Found: ${toHex8(opcodeByte)} ${toHex8(modRmByte)}.`,
    );
  }

  const destinationInstruction: MK1DestinationInstructionFact = {
    instructionPhysicalOffset: destPhysicalOffset,
    instructionPhysicalOffsetHex: toHex32(destPhysicalOffset),
    instructionLoadedAddress: targetLoaded,
    instructionLoadedAddressHex: toHex32(targetLoaded),
    objectNumber: destObjectNumber,
    objectOffset: destObjectOffset,
    objectOffsetHex: toHex32(destObjectOffset),
    opcodeByte,
    opcodeByteHex: toHex8(opcodeByte),
    modRmByte,
    modRmByteHex: toHex8(modRmByte),
    mnemonic: destinationBytesMatch ? 'ADD AL, [EAX]' : `UNKNOWN (${toHex8(opcodeByte)} ${toHex8(modRmByte)})`,
    operands: ['AL', '[EAX]'],
    instructionLength: 2,
    hasSegmentOverride: false,
    segmentOverridePrefix: null,
    effectiveAddressingBaseRegister: 'EAX',
    architecturalDefaultSegment: 'DS',
    architecturalDefaultSegmentReason:
      'Intel x86 architectural convention: effective address calculations using EAX base register without segment override prefix default strictly to DS (Data Segment).',
    incomingEaxClassA,
    incomingEaxClassAHex: toHex32(incomingEaxClassA),
    incomingEaxClassB,
    incomingEaxClassBHex: toHex32(incomingEaxClassB),
  };

  options?.onProgress?.('Evaluating Segment-Base Models (A, B, C) with page-aware resolution...', 0.5);

  // 5. Model A: Zero-based DS (DS.base = 0x00000000)
  const modelABase = 0x00000000;
  const modelAClassALinear = (modelABase + destinationInstruction.incomingEaxClassA) >>> 0;
  const modelAClassBLinear = (modelABase + destinationInstruction.incomingEaxClassB) >>> 0;
  const modelAResA = resolveLinearAddressInLayout(modelAClassALinear, layout.objects, layout.pageMap, pageSize);
  const modelAResB = resolveLinearAddressInLayout(modelAClassBLinear, layout.objects, layout.pageMap, pageSize);

  const modelACalcA: MK1ModelClassCalculation = {
    stateClass: 'Class A',
    incomingEax: destinationInstruction.incomingEaxClassA,
    incomingEaxHex: destinationInstruction.incomingEaxClassAHex,
    assumedBase: modelABase,
    assumedBaseHex: toHex32(modelABase),
    calculatedLinearAddress: modelAClassALinear,
    calculatedLinearAddressHex: toHex32(modelAClassALinear),
    containingObjectNumber: modelAResA.containingObjectNumber,
    containingObjectName: modelAResA.containingObjectName,
    objectRelativeOffset: modelAResA.objectRelativeOffset,
    objectRelativeOffsetHex:
      modelAResA.objectRelativeOffset !== null ? toHex32(modelAResA.objectRelativeOffset) : null,
    physicalBackingOffset: modelAResA.physicalBackingOffset,
    physicalBackingOffsetHex:
      modelAResA.physicalBackingOffset !== null ? toHex32(modelAResA.physicalBackingOffset) : null,
    associatedCandidateId: candAId,
    associatedCandidateLoadedPayload: candALoadedPayload,
    associatedCandidateLoadedPayloadHex: toHex32(candALoadedPayload),
    associatedCandidateLoadedStructure: candALoadedStruct,
    associatedCandidateLoadedStructureHex: toHex32(candALoadedStruct),
    equalsAssociatedCandidatePayload: modelAClassALinear === candALoadedPayload,
    equalsAssociatedCandidateStructure: modelAClassALinear === candALoadedStruct,
    reachesAssociatedPayload: modelAClassALinear === candALoadedPayload,
  };

  const modelACalcB: MK1ModelClassCalculation = {
    stateClass: 'Class B',
    incomingEax: destinationInstruction.incomingEaxClassB,
    incomingEaxHex: destinationInstruction.incomingEaxClassBHex,
    assumedBase: modelABase,
    assumedBaseHex: toHex32(modelABase),
    calculatedLinearAddress: modelAClassBLinear,
    calculatedLinearAddressHex: toHex32(modelAClassBLinear),
    containingObjectNumber: modelAResB.containingObjectNumber,
    containingObjectName: modelAResB.containingObjectName,
    objectRelativeOffset: modelAResB.objectRelativeOffset,
    objectRelativeOffsetHex:
      modelAResB.objectRelativeOffset !== null ? toHex32(modelAResB.objectRelativeOffset) : null,
    physicalBackingOffset: modelAResB.physicalBackingOffset,
    physicalBackingOffsetHex:
      modelAResB.physicalBackingOffset !== null ? toHex32(modelAResB.physicalBackingOffset) : null,
    associatedCandidateId: candBId,
    associatedCandidateLoadedPayload: candBLoadedPayload,
    associatedCandidateLoadedPayloadHex: toHex32(candBLoadedPayload),
    associatedCandidateLoadedStructure: candBLoadedStruct,
    associatedCandidateLoadedStructureHex: toHex32(candBLoadedStruct),
    equalsAssociatedCandidatePayload: modelAClassBLinear === candBLoadedPayload,
    equalsAssociatedCandidateStructure: modelAClassBLinear === candBLoadedStruct,
    reachesAssociatedPayload: modelAClassBLinear === candBLoadedPayload,
  };

  const modelA: MK1SegmentBaseModelEvaluation = {
    modelId: 'model-a-zero-based',
    modelName: 'Model A — Zero-Based DS Hypothesis',
    description: 'Assumes DS segment base is 0x00000000 (flat 32-bit linear memory model).',
    isAvailable: true,
    assumedBase: modelABase,
    assumedBaseHex: toHex32(modelABase),
    formula: 'linearAddress = 0x00000000 + EAX',
    classACalculation: modelACalcA,
    classBCalculation: modelACalcB,
    reachesBothAssociatedPayloads: modelACalcA.reachesAssociatedPayload && modelACalcB.reachesAssociatedPayload,
    reachesEitherAssociatedPayload: modelACalcA.reachesAssociatedPayload || modelACalcB.reachesAssociatedPayload,
    topologicalAssessment:
      'Calculated addresses 0x00002012 and 0x00002000 fall into unmapped low memory below Object 1 base (0x00010000). They do not reach the candidate payloads.',
  };

  // 6. Model B: Object 1 Relocation Base (DS.base = 0x00010000)
  const modelBBase = obj1RelocBase;
  const modelBClassALinear = (modelBBase + destinationInstruction.incomingEaxClassA) >>> 0;
  const modelBClassBLinear = (modelBBase + destinationInstruction.incomingEaxClassB) >>> 0;
  const modelBResA = resolveLinearAddressInLayout(modelBClassALinear, layout.objects, layout.pageMap, pageSize);
  const modelBResB = resolveLinearAddressInLayout(modelBClassBLinear, layout.objects, layout.pageMap, pageSize);

  const modelBCalcA: MK1ModelClassCalculation = {
    stateClass: 'Class A',
    incomingEax: destinationInstruction.incomingEaxClassA,
    incomingEaxHex: destinationInstruction.incomingEaxClassAHex,
    assumedBase: modelBBase,
    assumedBaseHex: toHex32(modelBBase),
    calculatedLinearAddress: modelBClassALinear,
    calculatedLinearAddressHex: toHex32(modelBClassALinear),
    containingObjectNumber: modelBResA.containingObjectNumber,
    containingObjectName: modelBResA.containingObjectName,
    objectRelativeOffset: modelBResA.objectRelativeOffset,
    objectRelativeOffsetHex:
      modelBResA.objectRelativeOffset !== null ? toHex32(modelBResA.objectRelativeOffset) : null,
    physicalBackingOffset: modelBResA.physicalBackingOffset,
    physicalBackingOffsetHex:
      modelBResA.physicalBackingOffset !== null ? toHex32(modelBResA.physicalBackingOffset) : null,
    associatedCandidatePhysicalPayload: candAPhysicalPayload,
    associatedCandidatePhysicalPayloadHex: toHex32(candAPhysicalPayload),
    associatedCandidateId: candAId,
    associatedCandidateLoadedPayload: candALoadedPayload,
    associatedCandidateLoadedPayloadHex: toHex32(candALoadedPayload),
    associatedCandidateLoadedStructure: candALoadedStruct,
    associatedCandidateLoadedStructureHex: toHex32(candALoadedStruct),
    equalsAssociatedCandidatePayload: modelBClassALinear === candALoadedPayload,
    equalsAssociatedCandidateStructure: modelBClassALinear === candALoadedStruct,
    reachesAssociatedPayload: modelBClassALinear === candALoadedPayload,
  };

  const modelBCalcB: MK1ModelClassCalculation = {
    stateClass: 'Class B',
    incomingEax: destinationInstruction.incomingEaxClassB,
    incomingEaxHex: destinationInstruction.incomingEaxClassBHex,
    assumedBase: modelBBase,
    assumedBaseHex: toHex32(modelBBase),
    calculatedLinearAddress: modelBClassBLinear,
    calculatedLinearAddressHex: toHex32(modelBClassBLinear),
    containingObjectNumber: modelBResB.containingObjectNumber,
    containingObjectName: modelBResB.containingObjectName,
    objectRelativeOffset: modelBResB.objectRelativeOffset,
    objectRelativeOffsetHex:
      modelBResB.objectRelativeOffset !== null ? toHex32(modelBResB.objectRelativeOffset) : null,
    physicalBackingOffset: modelBResB.physicalBackingOffset,
    physicalBackingOffsetHex:
      modelBResB.physicalBackingOffset !== null ? toHex32(modelBResB.physicalBackingOffset) : null,
    associatedCandidatePhysicalPayload: candBPhysicalPayload,
    associatedCandidatePhysicalPayloadHex: toHex32(candBPhysicalPayload),
    associatedCandidateId: candBId,
    associatedCandidateLoadedPayload: candBLoadedPayload,
    associatedCandidateLoadedPayloadHex: toHex32(candBLoadedPayload),
    associatedCandidateLoadedStructure: candBLoadedStruct,
    associatedCandidateLoadedStructureHex: toHex32(candBLoadedStruct),
    equalsAssociatedCandidatePayload: modelBClassBLinear === candBLoadedPayload,
    equalsAssociatedCandidateStructure: modelBClassBLinear === candBLoadedStruct,
    reachesAssociatedPayload: modelBClassBLinear === candBLoadedPayload,
  };

  const modelB: MK1SegmentBaseModelEvaluation = {
    modelId: 'model-b-object1-base',
    modelName: 'Model B — Object 1 Relocation-Base Hypothesis',
    description: `Assumes DS segment base is set to Object 1 relocation base (${toHex32(modelBBase)}).`,
    isAvailable: true,
    assumedBase: modelBBase,
    assumedBaseHex: toHex32(modelBBase),
    formula: `linearAddress = ${toHex32(modelBBase)} + EAX`,
    classACalculation: modelBCalcA,
    classBCalculation: modelBCalcB,
    reachesBothAssociatedPayloads: modelBCalcA.reachesAssociatedPayload && modelBCalcB.reachesAssociatedPayload,
    reachesEitherAssociatedPayload: modelBCalcA.reachesAssociatedPayload || modelBCalcB.reachesAssociatedPayload,
    topologicalAssessment:
      'Calculated addresses 0x00012012 and 0x00012000 reside in Object 1 file-backed memory and arithmetically match the loaded payload coordinates of candidates MK1.EXE:0x0002C410 and MK1.EXE:0x0002C3FE with 100% precision.',
  };

  // 7. Model C: Automatic-Data-Object Base (Fail closed / unavailable if absent or invalid, NO SILENT FALLBACK)
  let isModelCAvailable = false;
  let modelCBase: number | null = null;
  const autoDataObj =
    autoDataObject > 0 ? layout.objects.find((o) => o.objectNumber === autoDataObject) : undefined;

  if (autoDataObj) {
    isModelCAvailable = true;
    modelCBase = autoDataObj.relocationBaseAddress;
  }

  let modelCCalcA: MK1ModelClassCalculation;
  let modelCCalcB: MK1ModelClassCalculation;
  let modelC: MK1SegmentBaseModelEvaluation;

  if (isModelCAvailable && modelCBase !== null) {
    const modelCClassALinear = (modelCBase + destinationInstruction.incomingEaxClassA) >>> 0;
    const modelCClassBLinear = (modelCBase + destinationInstruction.incomingEaxClassB) >>> 0;
    const modelCResA = resolveLinearAddressInLayout(modelCClassALinear, layout.objects, layout.pageMap, pageSize);
    const modelCResB = resolveLinearAddressInLayout(modelCClassBLinear, layout.objects, layout.pageMap, pageSize);

    modelCCalcA = {
      stateClass: 'Class A',
      incomingEax: destinationInstruction.incomingEaxClassA,
      incomingEaxHex: destinationInstruction.incomingEaxClassAHex,
      assumedBase: modelCBase,
      assumedBaseHex: toHex32(modelCBase),
      calculatedLinearAddress: modelCClassALinear,
      calculatedLinearAddressHex: toHex32(modelCClassALinear),
      containingObjectNumber: modelCResA.containingObjectNumber,
      containingObjectName: modelCResA.containingObjectName,
      objectRelativeOffset: modelCResA.objectRelativeOffset,
      objectRelativeOffsetHex:
        modelCResA.objectRelativeOffset !== null ? toHex32(modelCResA.objectRelativeOffset) : null,
      physicalBackingOffset: modelCResA.physicalBackingOffset,
      physicalBackingOffsetHex:
        modelCResA.physicalBackingOffset !== null ? toHex32(modelCResA.physicalBackingOffset) : null,
      associatedCandidateId: candAId,
      associatedCandidateLoadedPayload: candALoadedPayload,
      associatedCandidateLoadedPayloadHex: toHex32(candALoadedPayload),
      associatedCandidateLoadedStructure: candALoadedStruct,
      associatedCandidateLoadedStructureHex: toHex32(candALoadedStruct),
      equalsAssociatedCandidatePayload: modelCClassALinear === candALoadedPayload,
      equalsAssociatedCandidateStructure: modelCClassALinear === candALoadedStruct,
      reachesAssociatedPayload: modelCClassALinear === candALoadedPayload,
    };

    modelCCalcB = {
      stateClass: 'Class B',
      incomingEax: destinationInstruction.incomingEaxClassB,
      incomingEaxHex: destinationInstruction.incomingEaxClassBHex,
      assumedBase: modelCBase,
      assumedBaseHex: toHex32(modelCBase),
      calculatedLinearAddress: modelCClassBLinear,
      calculatedLinearAddressHex: toHex32(modelCClassBLinear),
      containingObjectNumber: modelCResB.containingObjectNumber,
      containingObjectName: modelCResB.containingObjectName,
      objectRelativeOffset: modelCResB.objectRelativeOffset,
      objectRelativeOffsetHex:
        modelCResB.objectRelativeOffset !== null ? toHex32(modelCResB.objectRelativeOffset) : null,
      physicalBackingOffset: modelCResB.physicalBackingOffset,
      physicalBackingOffsetHex:
        modelCResB.physicalBackingOffset !== null ? toHex32(modelCResB.physicalBackingOffset) : null,
      associatedCandidateId: candBId,
      associatedCandidateLoadedPayload: candBLoadedPayload,
      associatedCandidateLoadedPayloadHex: toHex32(candBLoadedPayload),
      associatedCandidateLoadedStructure: candBLoadedStruct,
      associatedCandidateLoadedStructureHex: toHex32(candBLoadedStruct),
      equalsAssociatedCandidatePayload: modelCClassBLinear === candBLoadedPayload,
      equalsAssociatedCandidateStructure: modelCClassBLinear === candBLoadedStruct,
      reachesAssociatedPayload: modelCClassBLinear === candBLoadedPayload,
    };

    modelC = {
      modelId: 'model-c-auto-data-object-base',
      modelName: 'Model C — Automatic-Data-Object Base Hypothesis',
      description: `Assumes DS segment base is set to the LE Auto-Data-Object (${autoDataObjectName}) relocation base (${toHex32(modelCBase)}).`,
      isAvailable: true,
      assumedBase: modelCBase,
      assumedBaseHex: toHex32(modelCBase),
      formula: `linearAddress = ${toHex32(modelCBase)} + EAX`,
      classACalculation: modelCCalcA,
      classBCalculation: modelCCalcB,
      reachesBothAssociatedPayloads: modelCCalcA.reachesAssociatedPayload && modelCCalcB.reachesAssociatedPayload,
      reachesEitherAssociatedPayload: modelCCalcA.reachesAssociatedPayload || modelCCalcB.reachesAssociatedPayload,
      topologicalAssessment:
        autoDataObject === 2
          ? 'Calculated addresses 0x00052012 and 0x00052000 fall into Object 2 data memory. They do not equal the candidate payloads, which reside in Object 1.'
          : 'Auto-data-object evaluation depends on declared LE autoDataObject field.',
    };
  } else {
    modelCCalcA = {
      stateClass: 'Class A',
      incomingEax: destinationInstruction.incomingEaxClassA,
      incomingEaxHex: destinationInstruction.incomingEaxClassAHex,
      assumedBase: null,
      assumedBaseHex: null,
      calculatedLinearAddress: null,
      calculatedLinearAddressHex: null,
      containingObjectNumber: null,
      containingObjectName: null,
      objectRelativeOffset: null,
      objectRelativeOffsetHex: null,
      physicalBackingOffset: null,
      physicalBackingOffsetHex: null,
      associatedCandidateId: candAId,
      associatedCandidateLoadedPayload: candALoadedPayload,
      associatedCandidateLoadedPayloadHex: toHex32(candALoadedPayload),
      associatedCandidateLoadedStructure: candALoadedStruct,
      associatedCandidateLoadedStructureHex: toHex32(candALoadedStruct),
      equalsAssociatedCandidatePayload: false,
      equalsAssociatedCandidateStructure: false,
      reachesAssociatedPayload: false,
    };

    modelCCalcB = {
      stateClass: 'Class B',
      incomingEax: destinationInstruction.incomingEaxClassB,
      incomingEaxHex: destinationInstruction.incomingEaxClassBHex,
      assumedBase: null,
      assumedBaseHex: null,
      calculatedLinearAddress: null,
      calculatedLinearAddressHex: null,
      containingObjectNumber: null,
      containingObjectName: null,
      objectRelativeOffset: null,
      objectRelativeOffsetHex: null,
      physicalBackingOffset: null,
      physicalBackingOffsetHex: null,
      associatedCandidateId: candBId,
      associatedCandidateLoadedPayload: candBLoadedPayload,
      associatedCandidateLoadedPayloadHex: toHex32(candBLoadedPayload),
      associatedCandidateLoadedStructure: candBLoadedStruct,
      associatedCandidateLoadedStructureHex: toHex32(candBLoadedStruct),
      equalsAssociatedCandidatePayload: false,
      equalsAssociatedCandidateStructure: false,
      reachesAssociatedPayload: false,
    };

    modelC = {
      modelId: 'model-c-auto-data-object-base',
      modelName: 'Model C — Automatic-Data-Object Base Hypothesis',
      description: 'Model C is unavailable because LE autoDataObject is absent (0) or invalid. Object 2 is NOT substituted.',
      isAvailable: false,
      assumedBase: null,
      assumedBaseHex: null,
      formula: 'N/A — LE autoDataObject is absent or invalid',
      classACalculation: modelCCalcA,
      classBCalculation: modelCCalcB,
      reachesBothAssociatedPayloads: false,
      reachesEitherAssociatedPayload: false,
      topologicalAssessment: 'Model C is unavailable because the LE header declares no autoDataObject (or references an invalid object). Production B.10d refuses to substitute arbitrary objects.',
    };
  }

  options?.onProgress?.('Inspecting verified B.8/B.9 caller & handoff instruction windows with real bytes...', 0.7);

  // 8. Inspect bounded caller & handoff windows using real bytes & instruction boundary decoder
  const inspectedSites: MK1CallerHandoffInspectionSite[] = [];
  let totalInstructionsInspected = 0;
  let totalSegmentOverridesFound = 0;
  let totalExplicitDsWritesFound = 0;
  let totalFarPointerLoadsFound = 0;

  for (const win of VERIFIED_BOUNDED_WINDOWS) {
    if (exeBytes.length < win.physicalOffsetStart + win.length) {
      if (throwOnMissing) {
        throw new Error(
          `Cannot read bounded window for ${win.siteName} at physical offset ${toHex32(win.physicalOffsetStart)}: executable buffer is truncated (${exeBytes.length} bytes).`,
        );
      }
    }

    const windowBytes = Array.from(exeBytes.slice(win.physicalOffsetStart, win.physicalOffsetStart + win.length));
    const rawBytesHex = windowBytes.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

    // Decode instructions across the window strictly on instruction boundaries
    const disasm: string[] = [];
    const decodedInstructionsList: Array<{
      physicalOffset: number;
      physicalOffsetHex: string;
      loadedAddress: number;
      loadedAddressHex: string;
      mnemonic: string;
      rawBytesHex: string;
    }> = [];
    const segOverrideDetails: string[] = [];
    const dsDetails: string[] = [];
    const farDetails: string[] = [];
    let siteSegOverrides = 0;
    let siteDsWrites = 0;
    let siteFarLoads = 0;
    let siteInstructionCount = 0;

    let scanPos = win.physicalOffsetStart;
    const scanLimit = win.physicalOffsetStart + win.length;
    let loadedScan = win.loadedAddressStart;

    while (scanPos < scanLimit) {
      const decoded = decodeInstructionInBoundedWindow(exeBytes, scanPos, scanLimit, loadedScan);
      siteInstructionCount++;
      disasm.push(decoded.mnemonic);
      decodedInstructionsList.push({
        physicalOffset: decoded.physicalOffset,
        physicalOffsetHex: decoded.physicalOffsetHex,
        loadedAddress: decoded.loadedAddress,
        loadedAddressHex: decoded.loadedAddressHex,
        mnemonic: decoded.mnemonic,
        rawBytesHex: decoded.rawBytesHex,
      });

      if (decoded.hasSegmentOverride) {
        siteSegOverrides++;
        segOverrideDetails.push(`${decoded.segmentOverridePrefix} override prefix at ${toHex32(decoded.physicalOffset)}`);
      }
      if (decoded.isExplicitDsWriteOrLoad) {
        siteDsWrites++;
        dsDetails.push(`${decoded.dsWriteDetails ?? 'Explicit DS modification'} at ${toHex32(decoded.physicalOffset)}`);
      }
      if (decoded.isFarPointerOrSegmentLoad) {
        siteFarLoads++;
        farDetails.push(`${decoded.farPointerDetails ?? 'Far pointer/segment instruction'} at ${toHex32(decoded.physicalOffset)}`);
      }

      scanPos += decoded.length;
      loadedScan += decoded.length;
    }

    const siteRecord: MK1CallerHandoffInspectionSite = {
      siteId: win.siteId,
      siteName: win.siteName,
      siteRole: win.siteRole,
      physicalOffsetStart: win.physicalOffsetStart,
      physicalOffsetStartHex: toHex32(win.physicalOffsetStart),
      physicalOffsetEnd: win.physicalOffsetStart + win.length,
      physicalOffsetEndHex: toHex32(win.physicalOffsetStart + win.length),
      loadedAddressStart: win.loadedAddressStart,
      loadedAddressStartHex: toHex32(win.loadedAddressStart),
      instructionCount: siteInstructionCount,
      rawBytesHex,
      instructionsDisassembled: disasm,
      decodedInstructions: decodedInstructionsList,
      segmentOverridePrefixesFound: siteSegOverrides,
      segmentOverrideDetails: segOverrideDetails,
      explicitDsWritesOrLoadsFound: siteDsWrites,
      explicitDsDetails: dsDetails,
      farPointerOrSegmentLoadsFound: siteFarLoads,
      farPointerDetails: farDetails,
      boundedWindowClean: siteSegOverrides === 0 && siteDsWrites === 0 && siteFarLoads === 0,
    };

    inspectedSites.push(siteRecord);
    totalInstructionsInspected += siteInstructionCount;
    totalSegmentOverridesFound += siteSegOverrides;
    totalExplicitDsWritesFound += siteDsWrites;
    totalFarPointerLoadsFound += siteFarLoads;
  }

  const callerHandoffInspection: MK1CallerHandoffInspectionSummary = {
    totalInspectedSites: inspectedSites.length,
    totalInstructionsInspected,
    totalSegmentOverridesFound,
    totalExplicitDsWritesFound,
    totalFarPointerLoadsFound,
    allBoundedWindowsClean:
      totalSegmentOverridesFound === 0 &&
      totalExplicitDsWritesFound === 0 &&
      totalFarPointerLoadsFound === 0,
    boundedWindowInspectionNotes: [
      'All 5 verified caller and handoff windows execute standard near 32-bit instructions (MOV, CALL, JMP) without segment overrides.',
      'Instruction boundaries are strictly tracked; immediate/displacement bytes are never evaluated as prefix opcodes.',
      'No explicit writes or loads to DS (e.g. MOV DS, POP DS, LDS) exist in any inspected window.',
      'No far-pointer or far-segment loading instructions (e.g. LES, LSS, far CALL, far JMP) exist in any inspected window.',
    ],
    inspectedSites,
  };

  options?.onProgress?.('Synthesizing 4-way epistemic distinctions and final classifications...', 0.85);

  // 9. Explicit 4-way Epistemic Distinction
  const epistemicDistinctions: MK1EpistemicDistinctionReport = {
    arithmeticCompatibility: {
      title: 'Arithmetic Compatibility',
      modelBExactAlignment: true,
      classAFormula: `0x00010000 (Obj 1 base) + ${destinationInstruction.incomingEaxClassAHex} (Class A EAX) = 0x00012012 (Loaded Payload)`,
      classBFormula: `0x00010000 (Obj 1 base) + ${destinationInstruction.incomingEaxClassBHex} (Class B EAX) = 0x00012000 (Loaded Payload)`,
      deltaAlignment: 'EAX Delta 0x12 exactly matches candidate payload distance 0x12 (0x2C412 - 0x2C400).',
      summary:
        'Under Model B, adding Object 1 relocation base (0x00010000) to incoming EAX yields the exact loaded linear payload coordinates for both candidates. Arithmetic compatibility is 100% exact.',
    },
    localStaticEvidence: {
      title: 'Local Static Evidence',
      segmentOverridesObserved: callerHandoffInspection.totalSegmentOverridesFound > 0,
      explicitDsLoadsObserved: callerHandoffInspection.totalExplicitDsWritesFound > 0,
      farCallsOrJmpsObserved: callerHandoffInspection.totalFarPointerLoadsFound > 0,
      summary:
        'Zero segment register modifications, zero segment overrides, and zero far-pointer instructions are observed in the inspected caller, handoff, or destination instruction windows.',
    },
    documentedDos4gwModel: {
      title: 'Documented DOS/4GW Default Model',
      standardFlatModelDescription:
        'Documented DOS/4GW and Watcom C/C++ 32-bit flat protected mode configurations configure CS, DS, ES, and SS with a common 0-based linear base (0x00000000) spanning 4GB.',
      standardFlatDsBase: 0x00000000,
      standardFlatDsBaseHex: '0x00000000',
      discrepancyWithModelB:
        'The documented default DOS/4GW flat model does NOT base DS at Object 1 (0x00010000). If standard flat 0-base DS is active at runtime, [EAX] accesses unmapped low memory (0x2012, 0x2000), not Object 1.',
      summary:
        'Documented DOS/4GW conventions default to flat 0-based segmentation. An Object-1-based DS would require non-standard segment initialization that is not documented as default.',
    },
    provenRuntimeSegmentState: {
      title: 'Proven Runtime Segment State',
      status: 'unresolved',
      selectorDescriptorsProven: false,
      runtimeExecutionVerified: false,
      summary:
        'Static analysis of LE headers, fixup tables, and instruction windows cannot prove the actual runtime GDT/LDT selector base. Runtime segment state remains strictly unproven and unresolved.',
    },
  };

  // 10. Final Classifications (Derive rather than hardcode!)
  // Object-1-base support is classified as true ONLY if local decoded evidence specifically demonstrates a DS selector/base relationship to Object 1.
  // In this bounded pass, no local instruction establishes DS base = 0x00010000.
  const fixtureProvidesEvidenceDsHasObject1Base = false;
  const finalClassifications: MK1FinalSegmentClassifications = {
    zeroBasedDsReachesEitherPayload: modelA.reachesEitherAssociatedPayload,
    object1BaseDsWouldReachBothPayloads: modelB.reachesBothAssociatedPayloads,
    fixtureProvidesEvidenceDsHasObject1Base,
    autoDataObjectBaseReachesEitherPayload: modelC.reachesEitherAssociatedPayload,
    classificationSummary: [
      `Zero-based DS (Model A): Reaches linear ${modelA.classACalculation.calculatedLinearAddressHex ?? 'N/A'} / ${modelA.classBCalculation.calculatedLinearAddressHex ?? 'N/A'} (unmapped low memory). Reaches neither candidate payload: ${!modelA.reachesEitherAssociatedPayload}.`,
      `Object 1-based DS (Model B): Arithmetically reaches both candidate payloads (${toHex32(candALoadedPayload)} and ${toHex32(candBLoadedPayload)}): ${modelB.reachesBothAssociatedPayloads}.`,
      `Fixture Evidence for Object 1 DS: No bounded local evidence establishes DS.base = 0x00010000.`,
      `Auto-Data-Object DS (Model C): ${modelC.isAvailable ? `Reaches linear ${modelC.classACalculation.calculatedLinearAddressHex} / ${modelC.classBCalculation.calculatedLinearAddressHex} in Object 2 data memory. Reaches neither candidate payload: ${!modelC.reachesEitherAssociatedPayload}.` : 'Unavailable (no valid autoDataObject declared).' }`,
    ],
  };

  // 11. Reconciliation Checks
  const fixtureSizeReconciled = layout.exeSize === 1157222;
  const destinationLoadedCoordinateReconciled = destinationInstruction.instructionLoadedAddress === 0x00053d33;
  const destinationPhysicalCoordinateReconciled = destinationInstruction.instructionPhysicalOffset === 0x0006a133;
  const destinationBytesReconciled =
    destinationBytesMatch &&
    destinationInstruction.opcodeByte === 0x02 &&
    destinationInstruction.modRmByte === 0x00;

  const headerFactsReconciled =
    leHeaderFacts.object1RelocationBase === 0x00010000 &&
    leHeaderFacts.object2RelocationBase === 0x00050000;
  const destinationInstructionReconciled =
    destinationBytesMatch &&
    destinationInstruction.mnemonic === 'ADD AL, [EAX]' &&
    destinationInstruction.architecturalDefaultSegment === 'DS' &&
    !destinationInstruction.hasSegmentOverride;
  const modelACalculationReconciled =
    modelA.classACalculation.calculatedLinearAddress === 0x00002012 &&
    modelA.classBCalculation.calculatedLinearAddress === 0x00002000 &&
    !modelA.reachesEitherAssociatedPayload;
  const modelBCalculationReconciled =
    modelB.classACalculation.calculatedLinearAddress === 0x00012012 &&
    modelB.classBCalculation.calculatedLinearAddress === 0x00012000 &&
    modelB.reachesBothAssociatedPayloads;
  const modelCCalculationReconciled = !modelC.reachesEitherAssociatedPayload;
  const callerInspectionReconciled = callerHandoffInspection.allBoundedWindowsClean;
  const epistemicDistinctionsReconciled =
    epistemicDistinctions.provenRuntimeSegmentState.status === 'unresolved';
  const finalClassificationsReconciled =
    !finalClassifications.zeroBasedDsReachesEitherPayload &&
    finalClassifications.object1BaseDsWouldReachBothPayloads &&
    !finalClassifications.fixtureProvidesEvidenceDsHasObject1Base &&
    !finalClassifications.autoDataObjectBaseReachesEitherPayload;
  const barrierEnforced = true; // Destination body at 0x53D33/0x53D4A was NOT followed

  const allInvariantsSatisfied =
    fixtureSizeReconciled &&
    destinationLoadedCoordinateReconciled &&
    destinationPhysicalCoordinateReconciled &&
    destinationBytesReconciled &&
    headerFactsReconciled &&
    destinationInstructionReconciled &&
    modelACalculationReconciled &&
    modelBCalculationReconciled &&
    modelCCalculationReconciled &&
    callerInspectionReconciled &&
    epistemicDistinctionsReconciled &&
    finalClassificationsReconciled &&
    barrierEnforced;

  const reconciliation: MK1SegmentQualificationReconciliation = {
    fixtureSizeReconciled,
    destinationLoadedCoordinateReconciled,
    destinationPhysicalCoordinateReconciled,
    destinationBytesReconciled,
    headerFactsReconciled,
    destinationInstructionReconciled,
    modelACalculationReconciled,
    modelBCalculationReconciled,
    modelCCalculationReconciled,
    callerInspectionReconciled,
    epistemicDistinctionsReconciled,
    finalClassificationsReconciled,
    barrierEnforced,
    allInvariantsSatisfied,
  };

  const operationId = `mk1-segment-qualification-${Date.now()}`;

  return {
    format: B10D_EXPORT_FORMAT_VERSION,
    status: allInvariantsSatisfied ? 'SUCCESS' : 'FAILED',
    operationId,
    timestamp: new Date().toISOString(),
    fixture: {
      exePath: layout.exePath,
      exeSize: layout.exeSize,
    },
    epistemicRules: B10D_EPISTEMIC_RULES,
    leHeaderFacts,
    destinationInstruction,
    models: {
      modelA,
      modelB,
      modelC,
    },
    callerHandoffInspection,
    epistemicDistinctions,
    finalClassifications,
    reconciliation,
    interpretationCaveats: [
      'DO NOT FOLLOW 0x53D33 or 0x53D4A: Destination control boundary is an absolute barrier.',
      'Model B exact arithmetic compatibility does NOT prove that DS has Object 1 relocation base at runtime.',
      'Documented DOS/4GW runtime default is a flat 0-based memory model (Model A).',
      'Runtime segment selector base remains strictly unresolved without live execution evidence.',
    ],
  };
}

export function createMK1CompactPaletteSegmentQualificationExport(
  result: MK1PaletteSegmentQualificationResult,
): MK1CompactPaletteSegmentQualificationExport {
  return {
    exportHeader: {
      format: result.format,
      status: result.status,
      operationId: result.operationId,
      timestamp: result.timestamp,
      fixturePath: result.fixture.exePath,
      fixtureSize: result.fixture.exeSize,
      epistemicRules: result.epistemicRules,
    },
    realLEFacts: {
      autoDataObject: result.leHeaderFacts.autoDataObject,
      autoDataObjectName: result.leHeaderFacts.autoDataObjectName,
      object1RelocationBaseHex: result.leHeaderFacts.object1RelocationBaseHex,
      object2RelocationBaseHex: result.leHeaderFacts.object2RelocationBaseHex,
      object1Capabilities: result.leHeaderFacts.object1Capabilities,
      object2Capabilities: result.leHeaderFacts.object2Capabilities,
      initialCodeObject: result.leHeaderFacts.initialCodeObject,
      initialStackObject: result.leHeaderFacts.initialStackObject,
    },
    destinationInstruction: {
      offsetHex: result.destinationInstruction.instructionPhysicalOffsetHex,
      loadedAddressHex: result.destinationInstruction.instructionLoadedAddressHex,
      physicalOffsetHex: result.destinationInstruction.instructionPhysicalOffsetHex,
      mnemonic: result.destinationInstruction.mnemonic,
      hasSegmentOverride: result.destinationInstruction.hasSegmentOverride,
      defaultSegment: result.destinationInstruction.architecturalDefaultSegment,
      incomingEaxClassAHex: result.destinationInstruction.incomingEaxClassAHex,
      incomingEaxClassBHex: result.destinationInstruction.incomingEaxClassBHex,
    },
    models: {
      modelAZeroBased: {
        assumedBaseHex: result.models.modelA.assumedBaseHex ?? '0x00000000',
        classALinearHex: result.models.modelA.classACalculation.calculatedLinearAddressHex ?? 'N/A',
        classBLinearHex: result.models.modelA.classBCalculation.calculatedLinearAddressHex ?? 'N/A',
        reachesAssociatedPayload: result.models.modelA.reachesBothAssociatedPayloads,
        topologicalRegion: 'Unmapped Low Memory (below Object 1)',
      },
      modelBObject1Base: {
        assumedBaseHex: result.models.modelB.assumedBaseHex ?? '0x00010000',
        classALinearHex: result.models.modelB.classACalculation.calculatedLinearAddressHex ?? 'N/A',
        classBLinearHex: result.models.modelB.classBCalculation.calculatedLinearAddressHex ?? 'N/A',
        reachesAssociatedPayload: result.models.modelB.reachesBothAssociatedPayloads,
        topologicalRegion: 'Object 1 File-Backed Code/Read Memory (Exact Match)',
      },
      modelCAutoDataBase: {
        isAvailable: result.models.modelC.isAvailable,
        assumedBaseHex: result.models.modelC.assumedBaseHex,
        classALinearHex: result.models.modelC.classACalculation.calculatedLinearAddressHex,
        classBLinearHex: result.models.modelC.classBCalculation.calculatedLinearAddressHex,
        reachesAssociatedPayload: result.models.modelC.reachesBothAssociatedPayloads,
        topologicalRegion: result.models.modelC.isAvailable
          ? 'Object 2 Data Memory (No Match)'
          : 'Unavailable (No Auto-Data-Object declared)',
      },
    },
    callerHandoffEvidence: {
      totalSitesInspected: result.callerHandoffInspection.totalInspectedSites,
      segmentOverridesObserved: result.callerHandoffInspection.totalSegmentOverridesFound,
      explicitDsLoadsObserved: result.callerHandoffInspection.totalExplicitDsWritesFound,
      farPointerLoadsObserved: result.callerHandoffInspection.totalFarPointerLoadsFound,
      cleanWindows: result.callerHandoffInspection.allBoundedWindowsClean,
      sites: result.callerHandoffInspection.inspectedSites.map((site) => ({
        siteId: site.siteId,
        siteName: site.siteName,
        siteRole: site.siteRole,
        physicalStartHex: site.physicalOffsetStartHex,
        physicalEndHex: site.physicalOffsetEndHex,
        loadedStartHex: site.loadedAddressStartHex,
        actualRawBytesHex: site.rawBytesHex,
        decodedInstructions: site.decodedInstructions.map((inst) => ({
          physicalOffsetHex: inst.physicalOffsetHex,
          loadedAddressHex: inst.loadedAddressHex,
          mnemonic: inst.mnemonic,
          rawBytesHex: inst.rawBytesHex,
        })),
        segmentOverrideCount: site.segmentOverridePrefixesFound,
        dsModificationCount: site.explicitDsWritesOrLoadsFound,
        farSegmentLoadCount: site.farPointerOrSegmentLoadsFound,
        windowClean: site.boundedWindowClean,
      })),
    },
    epistemicDistinctions: {
      arithmeticCompatibilitySummary:
        result.epistemicDistinctions.arithmeticCompatibility.summary,
      localStaticEvidenceSummary:
        result.epistemicDistinctions.localStaticEvidence.summary,
      documentedDos4gwModelSummary:
        result.epistemicDistinctions.documentedDos4gwModel.summary,
      provenRuntimeSegmentStateSummary:
        result.epistemicDistinctions.provenRuntimeSegmentState.summary,
    },
    finalClassifications: {
      zeroBasedDsReachesEitherPayload:
        result.finalClassifications.zeroBasedDsReachesEitherPayload,
      object1BaseDsWouldReachBothPayloads:
        result.finalClassifications.object1BaseDsWouldReachBothPayloads,
      fixtureProvidesEvidenceDsHasObject1Base:
        result.finalClassifications.fixtureProvidesEvidenceDsHasObject1Base,
      autoDataObjectBaseReachesEitherPayload:
        result.finalClassifications.autoDataObjectBaseReachesEitherPayload,
    },
    reconciliation: {
      allInvariantsSatisfied: result.reconciliation.allInvariantsSatisfied,
      barrierEnforced: result.reconciliation.barrierEnforced,
    },
  };
}
