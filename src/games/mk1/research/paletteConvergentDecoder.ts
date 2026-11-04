/**
 * MK1 Executable Palette Relative-Control Address-Space Qualification:
 * Micro-Instruction Decoder and Candidate-Destination Tracer (Milestone 1 — Pass 1E.2B.10a)
 *
 * Epistemic Rules:
 * - Pure micro-decoding under the loaded-linear hypothesis.
 * - ModR/M and SIB length calculation must be strictly complete.
 * - Unsupported opcodes, prefixes (66, 67, F0, F2, F3, segment overrides), or truncated buffers STOP trace.
 * - Control transfers (CALL, JMP, Jcc, RET, IRET, INT) are barriers; DO NOT FOLLOW control targets.
 * - No type escapes (`as any`, `: any`, `@ts-ignore`).
 */

import { X86Register32 } from './paletteOperandUseReconnaissanceTypes';
import {
  MK1MicroInstruction,
  MK1DecodedCandidateInstruction,
  MK1DestinationStartQualification,
  MK1FinalCandidateControlBoundary,
  MK1OriginEvaluation,
  MK1RegisterUsageSummary,
  MK1ClassTrace,
  MK1DifferentialTraceSummary,
  MK1CandidateCoordinates,
  MK1MemoryAddressingInfo,
} from './paletteConvergentEntryReconnaissanceTypes';
import { LEObjectEntry } from '../../../core/executable/le/leTypes';

export function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

export function toHex16(val: number): string {
  return '0x' + (val & 0xffff).toString(16).padStart(4, '0').toUpperCase();
}

export function toHex8(val: number): string {
  return '0x' + (val & 0xff).toString(16).padStart(2, '0').toUpperCase();
}

export function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => (b & 0xff).toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

export const REGISTER_NAMES_32: readonly X86Register32[] = [
  'EAX',
  'ECX',
  'EDX',
  'EBX',
  'ESP',
  'EBP',
  'ESI',
  'EDI',
] as const;

export const REGISTER_NAMES_8 = [
  'AL',
  'CL',
  'DL',
  'BL',
  'AH',
  'CH',
  'DH',
  'BH',
] as const;
export type X86Register8 = typeof REGISTER_NAMES_8[number];

export const REGISTER_NAMES_16 = [
  'AX',
  'CX',
  'DX',
  'BX',
  'SP',
  'BP',
  'SI',
  'DI',
] as const;
export type X86Register16 = typeof REGISTER_NAMES_16[number];

export const REG8_TO_REG32: Record<X86Register8, X86Register32> = {
  AL: 'EAX',
  AH: 'EAX',
  CL: 'ECX',
  CH: 'ECX',
  DL: 'EDX',
  DH: 'EDX',
  BL: 'EBX',
  BH: 'EBX',
};

export const REG16_TO_REG32: Record<X86Register16, X86Register32> = {
  AX: 'EAX',
  CX: 'ECX',
  DX: 'EDX',
  BX: 'EBX',
  SP: 'ESP',
  BP: 'EBP',
  SI: 'ESI',
  DI: 'EDI',
};

export interface MicroDecodeResult {
  instruction: MK1MicroInstruction | null;
  length: number;
  error?: string;
}

export interface DecodedModRMSIB {
  totalLength: number;
  isMemory: boolean;
  regName: X86Register32;
  rmName: X86Register32 | null;
  baseRegister: X86Register32 | null;
  indexRegister: X86Register32 | null;
  scale: number | null;
  displacement: number | null;
  displacementLength: number;
  rmDescription: string;
  error?: string;
}

/**
 * Complete 32-bit x86 ModR/M & SIB address calculation.
 * Supports mod 00, 01, 10, 11; SIB when rm == 4; disp8; disp32; special no-base SIB case.
 */
export function decodeModRMSIB(
  bytes: Uint8Array,
  modrmOffset: number,
): DecodedModRMSIB {
  if (modrmOffset >= bytes.length) {
    return {
      totalLength: 0,
      isMemory: false,
      regName: 'EAX',
      rmName: null,
      baseRegister: null,
      indexRegister: null,
      scale: null,
      displacement: null,
      displacementLength: 0,
      rmDescription: '',
      error: 'Truncated ModR/M',
    };
  }

  const modrm = bytes[modrmOffset];
  const mod = (modrm >> 6) & 3;
  const regIdx = (modrm >> 3) & 7;
  const rmIdx = modrm & 7;
  const regName = REGISTER_NAMES_32[regIdx];

  // Register-direct mode (mod == 3)
  if (mod === 3) {
    const rmName = REGISTER_NAMES_32[rmIdx];
    return {
      totalLength: 1,
      isMemory: false,
      regName,
      rmName,
      baseRegister: null,
      indexRegister: null,
      scale: null,
      displacement: null,
      displacementLength: 0,
      rmDescription: rmName,
    };
  }

  // Memory modes (mod 0, 1, 2)
  let consumed = 1; // ModR/M byte
  let hasSIB = false;
  let baseRegister: X86Register32 | null = null;
  let indexRegister: X86Register32 | null = null;
  let scale: number | null = null;
  let dispLength = 0;

  if (rmIdx === 4) {
    // SIB byte follows
    if (modrmOffset + consumed >= bytes.length) {
      return {
        totalLength: 0,
        isMemory: true,
        regName,
        rmName: null,
        baseRegister: null,
        indexRegister: null,
        scale: null,
        displacement: null,
        displacementLength: 0,
        rmDescription: '',
        error: 'Truncated SIB',
      };
    }
    hasSIB = true;
    const sib = bytes[modrmOffset + consumed];
    consumed++;

    const scaleBits = (sib >> 6) & 3;
    const indexBits = (sib >> 3) & 7;
    const baseBits = sib & 7;

    scale = 1 << scaleBits;
    indexRegister = indexBits !== 4 ? REGISTER_NAMES_32[indexBits] : null;

    if (mod === 0) {
      if (baseBits === 5) {
        // Special case: no base register, 32-bit displacement follows
        baseRegister = null;
        dispLength = 4;
      } else {
        baseRegister = REGISTER_NAMES_32[baseBits];
        dispLength = 0;
      }
    } else if (mod === 1) {
      baseRegister = REGISTER_NAMES_32[baseBits];
      dispLength = 1;
    } else {
      // mod === 2
      baseRegister = REGISTER_NAMES_32[baseBits];
      dispLength = 4;
    }
  } else {
    // No SIB
    if (mod === 0) {
      if (rmIdx === 5) {
        // Special case: [disp32] with no base
        baseRegister = null;
        dispLength = 4;
      } else {
        baseRegister = REGISTER_NAMES_32[rmIdx];
        dispLength = 0;
      }
    } else if (mod === 1) {
      baseRegister = REGISTER_NAMES_32[rmIdx];
      dispLength = 1;
    } else {
      // mod === 2
      baseRegister = REGISTER_NAMES_32[rmIdx];
      dispLength = 4;
    }
  }

  // Read displacement
  let displacement: number | null = null;
  if (dispLength > 0) {
    if (modrmOffset + consumed + dispLength > bytes.length) {
      return {
        totalLength: 0,
        isMemory: true,
        regName,
        rmName: null,
        baseRegister: null,
        indexRegister: null,
        scale: null,
        displacement: null,
        displacementLength: 0,
        rmDescription: '',
        error: 'Truncated displacement',
      };
    }

    if (dispLength === 1) {
      displacement = (bytes[modrmOffset + consumed] << 24) >> 24;
      consumed += 1;
    } else {
      displacement =
        (bytes[modrmOffset + consumed] |
          (bytes[modrmOffset + consumed + 1] << 8) |
          (bytes[modrmOffset + consumed + 2] << 16) |
          (bytes[modrmOffset + consumed + 3] << 24)) |
        0;
      consumed += 4;
    }
  }

  // Format description
  const parts: string[] = [];
  if (baseRegister !== null) {
    parts.push(baseRegister);
  }
  if (indexRegister !== null) {
    parts.push(scale && scale > 1 ? `${indexRegister}*${scale}` : indexRegister);
  }
  if (displacement !== null) {
    if (baseRegister === null && indexRegister === null) {
      parts.push(toHex32(displacement >>> 0));
    } else if (displacement >= 0) {
      parts.push(toHex32(displacement >>> 0));
    } else {
      parts.push(`- ${toHex32((-displacement) >>> 0)}`);
    }
  }

  const rmDescription = `[${parts.join(' + ')}]`;

  return {
    totalLength: consumed,
    isMemory: true,
    regName,
    rmName: null,
    baseRegister,
    indexRegister,
    scale: hasSIB ? scale : null,
    displacement,
    displacementLength: dispLength,
    rmDescription,
  };
}

const UNSUPPORTED_PREFIXES: readonly number[] = [
  0x66, // Operand-size override
  0x67, // Address-size override
  0xf0, // LOCK prefix
  0xf2, // REPNE prefix
  0xf3, // REP/REPE prefix
  0x2e, // CS segment override
  0x36, // SS segment override
  0x3e, // DS segment override
  0x26, // ES segment override
  0x64, // FS segment override
  0x65, // GS segment override
] as const;

/**
 * Pure x86 micro-instruction decoder for B.10 candidate trace.
 */
export function decodeB10MicroInstruction(
  bytes: Uint8Array,
  offset: number,
  loadedAddress: number,
  physicalOffset: number | null = null,
): MicroDecodeResult {
  if (offset >= bytes.length) {
    return { instruction: null, length: 0, error: 'Offset out of bounds' };
  }

  const b0 = bytes[offset];
  const remaining = bytes.length - offset;

  // Check unsupported prefixes
  if (UNSUPPORTED_PREFIXES.includes(b0)) {
    return {
      instruction: null,
      length: 1,
      error: `Unsupported prefix ${toHex8(b0)}`,
    };
  }

  // 0. ADD r8, r/m8 (0x02) and ADD r/m8, r8 (0x00)
  if (b0 === 0x02 || b0 === 0x00) {
    if (remaining < 2) return { instruction: null, length: 0, error: 'Truncated ADD r8' };
    const modrmInfo = decodeModRMSIB(bytes, offset + 1);
    if (modrmInfo.error) return { instruction: null, length: 0, error: modrmInfo.error };

    const totalLen = 1 + modrmInfo.totalLength;
    const instrBytes = Array.from(bytes.slice(offset, offset + totalLen));
    const regIdx = (bytes[offset + 1] >> 3) & 7;
    const reg8 = REGISTER_NAMES_8[regIdx];
    const parentReg = REG8_TO_REG32[reg8];

    const readsRegs: X86Register32[] = [];
    const modifiesRegs: X86Register32[] = [];
    const partiallyModifiesRegs: X86Register32[] = [];
    let memoryAddressing: MK1MemoryAddressingInfo | undefined = undefined;
    let mnemonic = '';
    let operands: string[] = [];

    if (b0 === 0x02) {
      // ADD r8, r/m8: destination is reg8
      readsRegs.push(parentReg);
      modifiesRegs.push(parentReg);
      partiallyModifiesRegs.push(parentReg);

      if (modrmInfo.isMemory) {
        if (modrmInfo.baseRegister) readsRegs.push(modrmInfo.baseRegister);
        if (modrmInfo.indexRegister) readsRegs.push(modrmInfo.indexRegister);
        memoryAddressing = {
          baseRegister: modrmInfo.baseRegister,
          indexRegister: modrmInfo.indexRegister,
          scale: modrmInfo.scale,
          displacement: modrmInfo.displacement,
          displacementHex: modrmInfo.displacement !== null ? toHex32(modrmInfo.displacement >>> 0) : null,
          exactEffectiveAddress: null,
          exactEffectiveAddressHex: null,
          isFullyCalculable: false,
        };
        mnemonic = `ADD ${reg8}, ${modrmInfo.rmDescription}`;
        operands = [reg8, modrmInfo.rmDescription];
      } else {
        const rmIdx = bytes[offset + 1] & 7;
        const rm8 = REGISTER_NAMES_8[rmIdx];
        const parentRm = REG8_TO_REG32[rm8];
        readsRegs.push(parentRm);
        mnemonic = `ADD ${reg8}, ${rm8}`;
        operands = [reg8, rm8];
      }
    } else {
      // 0x00: ADD r/m8, r8: destination is rm8
      readsRegs.push(parentReg);
      if (modrmInfo.isMemory) {
        if (modrmInfo.baseRegister) readsRegs.push(modrmInfo.baseRegister);
        if (modrmInfo.indexRegister) readsRegs.push(modrmInfo.indexRegister);
        memoryAddressing = {
          baseRegister: modrmInfo.baseRegister,
          indexRegister: modrmInfo.indexRegister,
          scale: modrmInfo.scale,
          displacement: modrmInfo.displacement,
          displacementHex: modrmInfo.displacement !== null ? toHex32(modrmInfo.displacement >>> 0) : null,
          exactEffectiveAddress: null,
          exactEffectiveAddressHex: null,
          isFullyCalculable: false,
        };
        mnemonic = `ADD ${modrmInfo.rmDescription}, ${reg8}`;
        operands = [modrmInfo.rmDescription, reg8];
      } else {
        const rmIdx = bytes[offset + 1] & 7;
        const rm8 = REGISTER_NAMES_8[rmIdx];
        const parentRm = REG8_TO_REG32[rm8];
        readsRegs.push(parentRm);
        modifiesRegs.push(parentRm);
        partiallyModifiesRegs.push(parentRm);
        mnemonic = `ADD ${rm8}, ${reg8}`;
        operands = [rm8, reg8];
      }
    }

    return {
      length: totalLen,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: totalLen,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'ALU_ARITH',
        operands,
        readsMemory: modrmInfo.isMemory,
        writesMemory: modrmInfo.isMemory && b0 === 0x00,
        readsRegisters: Array.from(new Set(readsRegs)),
        modifiesRegisters: Array.from(new Set(modifiesRegs)),
        partiallyModifiesRegisters: Array.from(new Set(partiallyModifiesRegs)),
        isControlTransfer: false,
        memoryAddressing,
      },
    };
  }

  // 1. INC / DEC single-byte (0x40 - 0x4F)
  if (b0 >= 0x40 && b0 <= 0x47) {
    const reg = REGISTER_NAMES_32[b0 - 0x40];
    const instrBytes = [b0];
    return {
      length: 1,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 1,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: `INC ${reg}`,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'INC_DEC',
        operands: [reg],
        readsMemory: false,
        writesMemory: false,
        readsRegisters: [reg],
        modifiesRegisters: [reg],
        isControlTransfer: false,
      },
    };
  }
  if (b0 >= 0x48 && b0 <= 0x4f) {
    const reg = REGISTER_NAMES_32[b0 - 0x48];
    const instrBytes = [b0];
    return {
      length: 1,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 1,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: `DEC ${reg}`,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'INC_DEC',
        operands: [reg],
        readsMemory: false,
        writesMemory: false,
        readsRegisters: [reg],
        modifiesRegisters: [reg],
        isControlTransfer: false,
      },
    };
  }

  // 2. PUSH / POP single-byte register (0x50 - 0x5F)
  if (b0 >= 0x50 && b0 <= 0x57) {
    const reg = REGISTER_NAMES_32[b0 - 0x50];
    const instrBytes = [b0];
    return {
      length: 1,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 1,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: `PUSH ${reg}`,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'PUSH_POP',
        operands: [reg],
        readsMemory: false,
        writesMemory: true,
        readsRegisters: [reg, 'ESP'],
        modifiesRegisters: ['ESP'],
        isControlTransfer: false,
      },
    };
  }
  if (b0 >= 0x58 && b0 <= 0x5f) {
    const reg = REGISTER_NAMES_32[b0 - 0x58];
    const instrBytes = [b0];
    return {
      length: 1,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 1,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: `POP ${reg}`,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'PUSH_POP',
        operands: [reg],
        readsMemory: true,
        writesMemory: false,
        readsRegisters: ['ESP'],
        modifiesRegisters: [reg, 'ESP'],
        isControlTransfer: false,
      },
    };
  }

  // PUSH imm32 (0x68) and PUSH imm8 (0x6A)
  if (b0 === 0x68) {
    if (remaining < 5) return { instruction: null, length: 0, error: 'Truncated PUSH imm32' };
    const imm =
      (bytes[offset + 1] | (bytes[offset + 2] << 8) | (bytes[offset + 3] << 16) | (bytes[offset + 4] << 24)) >>> 0;
    const instrBytes = Array.from(bytes.slice(offset, offset + 5));
    return {
      length: 5,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 5,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: `PUSH ${toHex32(imm)}`,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'PUSH_POP',
        operands: [toHex32(imm)],
        readsMemory: false,
        writesMemory: true,
        readsRegisters: ['ESP'],
        modifiesRegisters: ['ESP'],
        isControlTransfer: false,
      },
    };
  }
  if (b0 === 0x6a) {
    if (remaining < 2) return { instruction: null, length: 0, error: 'Truncated PUSH imm8' };
    const imm8 = (bytes[offset + 1] << 24) >> 24;
    const instrBytes = Array.from(bytes.slice(offset, offset + 2));
    return {
      length: 2,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 2,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: `PUSH ${toHex8(imm8 & 0xff)}`,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'PUSH_POP',
        operands: [toHex8(imm8 & 0xff)],
        readsMemory: false,
        writesMemory: true,
        readsRegisters: ['ESP'],
        modifiesRegisters: ['ESP'],
        isControlTransfer: false,
      },
    };
  }

  // 3. MOV r32, imm32 (0xB8 - 0xBF)
  if (b0 >= 0xb8 && b0 <= 0xbf) {
    if (remaining < 5) return { instruction: null, length: 0, error: 'Truncated MOV r32, imm32' };
    const reg = REGISTER_NAMES_32[b0 - 0xb8];
    const imm =
      (bytes[offset + 1] | (bytes[offset + 2] << 8) | (bytes[offset + 3] << 16) | (bytes[offset + 4] << 24)) >>> 0;
    const instrBytes = Array.from(bytes.slice(offset, offset + 5));
    return {
      length: 5,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 5,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: `MOV ${reg}, ${toHex32(imm)}`,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'MOV',
        operands: [reg, toHex32(imm)],
        readsMemory: false,
        writesMemory: false,
        readsRegisters: [],
        modifiesRegisters: [reg],
        isControlTransfer: false,
      },
    };
  }

  // 4. MOV r/m32, r32 (0x89) or MOV r32, r/m32 (0x8B)
  if (b0 === 0x89 || b0 === 0x8b) {
    const modrmInfo = decodeModRMSIB(bytes, offset + 1);
    if (modrmInfo.error) return { instruction: null, length: 0, error: modrmInfo.error };

    const totalLen = 1 + modrmInfo.totalLength;
    const instrBytes = Array.from(bytes.slice(offset, offset + totalLen));
    const isLoad = b0 === 0x8b;
    const dst = isLoad ? modrmInfo.regName : modrmInfo.rmDescription;
    const src = isLoad ? modrmInfo.rmDescription : modrmInfo.regName;
    const mnemonic = `MOV ${dst}, ${src}`;

    const readsRegs: X86Register32[] = [];
    const modifiesRegs: X86Register32[] = [];
    let memoryAddressing: MK1MemoryAddressingInfo | undefined = undefined;

    if (modrmInfo.isMemory) {
      if (modrmInfo.baseRegister) readsRegs.push(modrmInfo.baseRegister);
      if (modrmInfo.indexRegister) readsRegs.push(modrmInfo.indexRegister);
      memoryAddressing = {
        baseRegister: modrmInfo.baseRegister,
        indexRegister: modrmInfo.indexRegister,
        scale: modrmInfo.scale,
        displacement: modrmInfo.displacement,
        displacementHex: modrmInfo.displacement !== null ? toHex32(modrmInfo.displacement >>> 0) : null,
        exactEffectiveAddress: null,
        exactEffectiveAddressHex: null,
        isFullyCalculable: false,
      };
      if (isLoad) {
        modifiesRegs.push(modrmInfo.regName);
      } else {
        readsRegs.push(modrmInfo.regName);
      }
    } else {
      if (isLoad) {
        if (modrmInfo.rmName) readsRegs.push(modrmInfo.rmName);
        modifiesRegs.push(modrmInfo.regName);
      } else {
        readsRegs.push(modrmInfo.regName);
        if (modrmInfo.rmName) modifiesRegs.push(modrmInfo.rmName);
      }
    }

    return {
      length: totalLen,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: totalLen,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'MOV',
        operands: [dst, src],
        readsMemory: isLoad && modrmInfo.isMemory,
        writesMemory: !isLoad && modrmInfo.isMemory,
        readsRegisters: Array.from(new Set(readsRegs)),
        modifiesRegisters: Array.from(new Set(modifiesRegs)),
        isControlTransfer: false,
        memoryAddressing,
      },
    };
  }

  // 5. MOV r/m32, imm32 (0xC7 /0)
  if (b0 === 0xc7) {
    if (remaining < 2) return { instruction: null, length: 0, error: 'Truncated MOV r/m32, imm32' };
    const regOpcode = (bytes[offset + 1] >> 3) & 7;
    if (regOpcode === 0) {
      const modrmInfo = decodeModRMSIB(bytes, offset + 1);
      if (modrmInfo.error) return { instruction: null, length: 0, error: modrmInfo.error };

      const immOffset = offset + 1 + modrmInfo.totalLength;
      if (bytes.length < immOffset + 4) return { instruction: null, length: 0, error: 'Truncated MOV imm32' };
      const imm =
        (bytes[immOffset] | (bytes[immOffset + 1] << 8) | (bytes[immOffset + 2] << 16) | (bytes[immOffset + 3] << 24)) >>> 0;

      const totalLen = 1 + modrmInfo.totalLength + 4;
      const instrBytes = Array.from(bytes.slice(offset, offset + totalLen));
      const mnemonic = `MOV ${modrmInfo.rmDescription}, ${toHex32(imm)}`;

      const readsRegs: X86Register32[] = [];
      const modifiesRegs: X86Register32[] = [];
      let memoryAddressing: MK1MemoryAddressingInfo | undefined = undefined;

      if (modrmInfo.isMemory) {
        if (modrmInfo.baseRegister) readsRegs.push(modrmInfo.baseRegister);
        if (modrmInfo.indexRegister) readsRegs.push(modrmInfo.indexRegister);
        memoryAddressing = {
          baseRegister: modrmInfo.baseRegister,
          indexRegister: modrmInfo.indexRegister,
          scale: modrmInfo.scale,
          displacement: modrmInfo.displacement,
          displacementHex: modrmInfo.displacement !== null ? toHex32(modrmInfo.displacement >>> 0) : null,
          exactEffectiveAddress: null,
          exactEffectiveAddressHex: null,
          isFullyCalculable: false,
        };
      } else {
        if (modrmInfo.rmName) modifiesRegs.push(modrmInfo.rmName);
      }

      return {
        length: totalLen,
        instruction: {
          address: loadedAddress,
          addressHex: toHex32(loadedAddress),
          physicalOffset,
          physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
          length: totalLen,
          bytes: instrBytes,
          bytesHex: bytesToHex(instrBytes),
          mnemonic,
          opcode: b0,
          opcodeHex: toHex8(b0),
          opcodeGroup: 'MOV',
          operands: [modrmInfo.rmDescription, toHex32(imm)],
          readsMemory: false,
          writesMemory: modrmInfo.isMemory,
          readsRegisters: Array.from(new Set(readsRegs)),
          modifiesRegisters: Array.from(new Set(modifiesRegs)),
          isControlTransfer: false,
          memoryAddressing,
        },
      };
    }
  }

  // 6. LEA r32, m (0x8D)
  if (b0 === 0x8d) {
    const modrmInfo = decodeModRMSIB(bytes, offset + 1);
    if (modrmInfo.error) return { instruction: null, length: 0, error: modrmInfo.error };

    const totalLen = 1 + modrmInfo.totalLength;
    const instrBytes = Array.from(bytes.slice(offset, offset + totalLen));
    const mnemonic = `LEA ${modrmInfo.regName}, ${modrmInfo.rmDescription}`;

    const readsRegs: X86Register32[] = [];
    if (modrmInfo.baseRegister) readsRegs.push(modrmInfo.baseRegister);
    if (modrmInfo.indexRegister) readsRegs.push(modrmInfo.indexRegister);

    const memoryAddressing: MK1MemoryAddressingInfo = {
      baseRegister: modrmInfo.baseRegister,
      indexRegister: modrmInfo.indexRegister,
      scale: modrmInfo.scale,
      displacement: modrmInfo.displacement,
      displacementHex: modrmInfo.displacement !== null ? toHex32(modrmInfo.displacement >>> 0) : null,
      exactEffectiveAddress: null,
      exactEffectiveAddressHex: null,
      isFullyCalculable: false,
    };

    return {
      length: totalLen,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: totalLen,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'LEA',
        operands: [modrmInfo.regName, modrmInfo.rmDescription],
        readsMemory: false,
        writesMemory: false,
        readsRegisters: Array.from(new Set(readsRegs)),
        modifiesRegisters: [modrmInfo.regName],
        isControlTransfer: false,
        memoryAddressing,
      },
    };
  }

  // 7. NOP (0x90)
  if (b0 === 0x90) {
    const instrBytes = [b0];
    return {
      length: 1,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 1,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: 'NOP',
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'ALU_ARITH',
        operands: [],
        readsMemory: false,
        writesMemory: false,
        readsRegisters: [],
        modifiesRegisters: [],
        isControlTransfer: false,
      },
    };
  }

  // 8. RET (0xC3, 0xC2)
  if (b0 === 0xc3) {
    const instrBytes = [b0];
    return {
      length: 1,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 1,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: 'RET',
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'RET',
        operands: [],
        readsMemory: true,
        writesMemory: false,
        readsRegisters: ['ESP'],
        modifiesRegisters: ['ESP'],
        isControlTransfer: true,
        controlTransferType: 'return',
      },
    };
  }
  if (b0 === 0xc2) {
    if (remaining < 3) return { instruction: null, length: 0, error: 'Truncated RET imm16' };
    const imm16 = bytes[offset + 1] | (bytes[offset + 2] << 8);
    const instrBytes = Array.from(bytes.slice(offset, offset + 3));
    return {
      length: 3,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 3,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: `RET ${toHex16(imm16)}`,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'RET',
        operands: [toHex16(imm16)],
        readsMemory: true,
        writesMemory: false,
        readsRegisters: ['ESP'],
        modifiesRegisters: ['ESP'],
        isControlTransfer: true,
        controlTransferType: 'return',
      },
    };
  }

  // 9. CALL near rel32 (0xE8)
  if (b0 === 0xe8) {
    if (remaining < 5) return { instruction: null, length: 0, error: 'Truncated CALL rel32' };
    const rawRel32 =
      (bytes[offset + 1] | (bytes[offset + 2] << 8) | (bytes[offset + 3] << 16) | (bytes[offset + 4] << 24)) >>> 0;
    const rel32 = rawRel32 << 0;
    const target = (loadedAddress + 5 + rel32) >>> 0;
    const instrBytes = Array.from(bytes.slice(offset, offset + 5));
    return {
      length: 5,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 5,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: `CALL near ${toHex32(target)}`,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'CALL',
        operands: [toHex32(target)],
        readsMemory: false,
        writesMemory: true,
        readsRegisters: ['ESP'],
        modifiesRegisters: ['ESP'],
        isControlTransfer: true,
        controlTransferType: 'call',
      },
    };
  }

  // 10. JMP short (0xEB) / JMP near (0xE9)
  if (b0 === 0xeb) {
    if (remaining < 2) return { instruction: null, length: 0, error: 'Truncated JMP short' };
    const rel8 = (bytes[offset + 1] << 24) >> 24;
    const target = (loadedAddress + 2 + rel8) >>> 0;
    const instrBytes = Array.from(bytes.slice(offset, offset + 2));
    return {
      length: 2,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 2,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: `JMP short ${toHex32(target)}`,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'JMP',
        operands: [toHex32(target)],
        readsMemory: false,
        writesMemory: false,
        readsRegisters: [],
        modifiesRegisters: [],
        isControlTransfer: true,
        controlTransferType: 'jump',
      },
    };
  }
  if (b0 === 0xe9) {
    if (remaining < 5) return { instruction: null, length: 0, error: 'Truncated JMP near' };
    const rawRel32 =
      (bytes[offset + 1] | (bytes[offset + 2] << 8) | (bytes[offset + 3] << 16) | (bytes[offset + 4] << 24)) >>> 0;
    const rel32 = rawRel32 << 0;
    const target = (loadedAddress + 5 + rel32) >>> 0;
    const instrBytes = Array.from(bytes.slice(offset, offset + 5));
    return {
      length: 5,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 5,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: `JMP near ${toHex32(target)}`,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'JMP',
        operands: [toHex32(target)],
        readsMemory: false,
        writesMemory: false,
        readsRegisters: [],
        modifiesRegisters: [],
        isControlTransfer: true,
        controlTransferType: 'jump',
      },
    };
  }

  // 11. Jcc short (0x70 - 0x7F)
  if (b0 >= 0x70 && b0 <= 0x7f) {
    if (remaining < 2) return { instruction: null, length: 0, error: 'Truncated Jcc short' };
    const rel8 = (bytes[offset + 1] << 24) >> 24;
    const target = (loadedAddress + 2 + rel8) >>> 0;
    const ccNames = [
      'JO',
      'JNO',
      'JB',
      'JNB',
      'JZ',
      'JNZ',
      'JBE',
      'JNBE',
      'JS',
      'JNS',
      'JP',
      'JNP',
      'JL',
      'JNL',
      'JLE',
      'JNLE',
    ];
    const mnemonic = `${ccNames[b0 - 0x70]} ${toHex32(target)}`;
    const instrBytes = Array.from(bytes.slice(offset, offset + 2));
    return {
      length: 2,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 2,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'JCC',
        operands: [toHex32(target)],
        readsMemory: false,
        writesMemory: false,
        readsRegisters: [],
        modifiesRegisters: [],
        isControlTransfer: true,
        controlTransferType: 'jcc',
      },
    };
  }

  // 12. Jcc near rel32 (0x0F 0x80 - 0x8F)
  if (b0 === 0x0f && remaining >= 2 && bytes[offset + 1] >= 0x80 && bytes[offset + 1] <= 0x8f) {
    if (remaining < 6) return { instruction: null, length: 0, error: 'Truncated Jcc near' };
    const ccCode = bytes[offset + 1] - 0x80;
    const rawRel32 =
      (bytes[offset + 2] | (bytes[offset + 3] << 8) | (bytes[offset + 4] << 16) | (bytes[offset + 5] << 24)) >>> 0;
    const rel32 = rawRel32 << 0;
    const target = (loadedAddress + 6 + rel32) >>> 0;
    const ccNames = [
      'JO',
      'JNO',
      'JB',
      'JNB',
      'JZ',
      'JNZ',
      'JBE',
      'JNBE',
      'JS',
      'JNS',
      'JP',
      'JNP',
      'JL',
      'JNL',
      'JLE',
      'JNLE',
    ];
    const mnemonic = `${ccNames[ccCode]} near ${toHex32(target)}`;
    const instrBytes = Array.from(bytes.slice(offset, offset + 6));
    return {
      length: 6,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 6,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'JCC',
        operands: [toHex32(target)],
        readsMemory: false,
        writesMemory: false,
        readsRegisters: [],
        modifiesRegisters: [],
        isControlTransfer: true,
        controlTransferType: 'jcc',
      },
    };
  }

  // 12b. MOVZX r32, r/m16 (0x0F 0xB7) and MOVZX r32, r/m8 (0x0F 0xB6)
  if (b0 === 0x0f && remaining >= 2 && (bytes[offset + 1] === 0xb7 || bytes[offset + 1] === 0xb6)) {
    const b1 = bytes[offset + 1];
    if (remaining < 3) return { instruction: null, length: 0, error: 'Truncated MOVZX' };
    const modrmInfo = decodeModRMSIB(bytes, offset + 2);
    if (modrmInfo.error) return { instruction: null, length: 0, error: modrmInfo.error };

    const totalLen = 2 + modrmInfo.totalLength;
    const instrBytes = Array.from(bytes.slice(offset, offset + totalLen));
    const dst32 = modrmInfo.regName;
    let srcDescription = '';
    const readsRegs: X86Register32[] = [];
    let memoryAddressing: MK1MemoryAddressingInfo | undefined = undefined;

    if (b1 === 0xb7) {
      if (modrmInfo.isMemory) {
        srcDescription = modrmInfo.rmDescription;
        if (modrmInfo.baseRegister) readsRegs.push(modrmInfo.baseRegister);
        if (modrmInfo.indexRegister) readsRegs.push(modrmInfo.indexRegister);
        memoryAddressing = {
          baseRegister: modrmInfo.baseRegister,
          indexRegister: modrmInfo.indexRegister,
          scale: modrmInfo.scale,
          displacement: modrmInfo.displacement,
          displacementHex: modrmInfo.displacement !== null ? toHex32(modrmInfo.displacement >>> 0) : null,
          exactEffectiveAddress: null,
          exactEffectiveAddressHex: null,
          isFullyCalculable: false,
        };
      } else {
        const rmIdx = bytes[offset + 2] & 7;
        const src16 = REGISTER_NAMES_16[rmIdx];
        srcDescription = src16;
        readsRegs.push(REG16_TO_REG32[src16]);
      }
    } else {
      // 0x0F 0xB6: MOVZX r32, r/m8
      if (modrmInfo.isMemory) {
        srcDescription = modrmInfo.rmDescription;
        if (modrmInfo.baseRegister) readsRegs.push(modrmInfo.baseRegister);
        if (modrmInfo.indexRegister) readsRegs.push(modrmInfo.indexRegister);
        memoryAddressing = {
          baseRegister: modrmInfo.baseRegister,
          indexRegister: modrmInfo.indexRegister,
          scale: modrmInfo.scale,
          displacement: modrmInfo.displacement,
          displacementHex: modrmInfo.displacement !== null ? toHex32(modrmInfo.displacement >>> 0) : null,
          exactEffectiveAddress: null,
          exactEffectiveAddressHex: null,
          isFullyCalculable: false,
        };
      } else {
        const rmIdx = bytes[offset + 2] & 7;
        const src8 = REGISTER_NAMES_8[rmIdx];
        srcDescription = src8;
        readsRegs.push(REG8_TO_REG32[src8]);
      }
    }

    const mnemonic = `MOVZX ${dst32}, ${srcDescription}`;
    return {
      length: totalLen,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: totalLen,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic,
        opcode: b1,
        opcodeHex: b1 === 0xb7 ? '0x0FB7' : '0x0FB6',
        opcodeGroup: 'MOV_LOAD',
        operands: [dst32, srcDescription],
        readsMemory: modrmInfo.isMemory,
        writesMemory: false,
        readsRegisters: Array.from(new Set(readsRegs)),
        modifiesRegisters: [dst32],
        isControlTransfer: false,
        memoryAddressing,
      },
    };
  }

  // 13. INT imm8 (0xCD), INT3 (0xCC), IRET (0xCF)
  if (b0 === 0xcd) {
    if (remaining < 2) return { instruction: null, length: 0, error: 'Truncated INT' };
    const intNum = bytes[offset + 1];
    const instrBytes = [b0, intNum];
    return {
      length: 2,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 2,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: `INT ${toHex8(intNum)}`,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'INTERRUPT',
        operands: [toHex8(intNum)],
        readsMemory: false,
        writesMemory: true,
        readsRegisters: ['ESP'],
        modifiesRegisters: ['ESP'],
        isControlTransfer: true,
        controlTransferType: 'interrupt',
      },
    };
  }
  if (b0 === 0xcc) {
    const instrBytes = [b0];
    return {
      length: 1,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 1,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: 'INT3',
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'INTERRUPT',
        operands: [],
        readsMemory: false,
        writesMemory: true,
        readsRegisters: ['ESP'],
        modifiesRegisters: ['ESP'],
        isControlTransfer: true,
        controlTransferType: 'interrupt',
      },
    };
  }
  if (b0 === 0xcf) {
    const instrBytes = [b0];
    return {
      length: 1,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 1,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: 'IRET',
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'INTERRUPT',
        operands: [],
        readsMemory: true,
        writesMemory: false,
        readsRegisters: ['ESP'],
        modifiesRegisters: ['ESP'],
        isControlTransfer: true,
        controlTransferType: 'interrupt',
      },
    };
  }

  // 14. ADD, SUB, AND, OR, XOR, CMP Group 1 (0x81, 0x83)
  if (b0 === 0x81 || b0 === 0x83) {
    const modrmInfo = decodeModRMSIB(bytes, offset + 1);
    if (modrmInfo.error) return { instruction: null, length: 0, error: modrmInfo.error };

    const opKind = (bytes[offset + 1] >> 3) & 7;
    const opNames = ['ADD', 'OR', 'ADC', 'SBB', 'AND', 'SUB', 'XOR', 'CMP'];
    const opName = opNames[opKind];

    const immLen = b0 === 0x81 ? 4 : 1;
    const immOffset = offset + 1 + modrmInfo.totalLength;
    if (bytes.length < immOffset + immLen) return { instruction: null, length: 0, error: 'Truncated ALU imm' };

    let immVal = 0;
    if (b0 === 0x81) {
      immVal =
        (bytes[immOffset] |
          (bytes[immOffset + 1] << 8) |
          (bytes[immOffset + 2] << 16) |
          (bytes[immOffset + 3] << 24)) >>>
        0;
    } else {
      const imm8 = (bytes[immOffset] << 24) >> 24;
      immVal = imm8 >>> 0;
    }

    const totalLen = 1 + modrmInfo.totalLength + immLen;
    const instrBytes = Array.from(bytes.slice(offset, offset + totalLen));
    const mnemonic = `${opName} ${modrmInfo.rmDescription}, ${toHex32(immVal)}`;

    const readsRegs: X86Register32[] = [];
    const modifiesRegs: X86Register32[] = [];
    let memoryAddressing: MK1MemoryAddressingInfo | undefined = undefined;

    if (modrmInfo.isMemory) {
      if (modrmInfo.baseRegister) readsRegs.push(modrmInfo.baseRegister);
      if (modrmInfo.indexRegister) readsRegs.push(modrmInfo.indexRegister);
      memoryAddressing = {
        baseRegister: modrmInfo.baseRegister,
        indexRegister: modrmInfo.indexRegister,
        scale: modrmInfo.scale,
        displacement: modrmInfo.displacement,
        displacementHex: modrmInfo.displacement !== null ? toHex32(modrmInfo.displacement >>> 0) : null,
        exactEffectiveAddress: null,
        exactEffectiveAddressHex: null,
        isFullyCalculable: false,
      };
    } else {
      if (modrmInfo.rmName) {
        readsRegs.push(modrmInfo.rmName);
        if (opKind !== 7) modifiesRegs.push(modrmInfo.rmName); // CMP doesn't write
      }
    }

    return {
      length: totalLen,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: totalLen,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'ALU_ARITH',
        operands: [modrmInfo.rmDescription, toHex32(immVal)],
        readsMemory: modrmInfo.isMemory,
        writesMemory: modrmInfo.isMemory && opKind !== 7,
        readsRegisters: Array.from(new Set(readsRegs)),
        modifiesRegisters: Array.from(new Set(modifiesRegs)),
        isControlTransfer: false,
        memoryAddressing,
      },
    };
  }

  // 15. ALU direct register/memory forms: ADD (0x01, 0x03), OR (0x09, 0x0B), AND (0x21, 0x23), SUB (0x29, 0x2B), XOR (0x31, 0x33), CMP (0x39, 0x3B)
  const aluRegOpcodes: Record<number, { name: string; isCmp: boolean; dir: 'to_rm' | 'to_reg' }> = {
    0x01: { name: 'ADD', isCmp: false, dir: 'to_rm' },
    0x03: { name: 'ADD', isCmp: false, dir: 'to_reg' },
    0x09: { name: 'OR', isCmp: false, dir: 'to_rm' },
    0x0b: { name: 'OR', isCmp: false, dir: 'to_reg' },
    0x21: { name: 'AND', isCmp: false, dir: 'to_rm' },
    0x23: { name: 'AND', isCmp: false, dir: 'to_reg' },
    0x29: { name: 'SUB', isCmp: false, dir: 'to_rm' },
    0x2b: { name: 'SUB', isCmp: false, dir: 'to_reg' },
    0x31: { name: 'XOR', isCmp: false, dir: 'to_rm' },
    0x33: { name: 'XOR', isCmp: false, dir: 'to_reg' },
    0x39: { name: 'CMP', isCmp: true, dir: 'to_rm' },
    0x3b: { name: 'CMP', isCmp: true, dir: 'to_reg' },
  };

  const aluMeta = aluRegOpcodes[b0];
  if (aluMeta) {
    const modrmInfo = decodeModRMSIB(bytes, offset + 1);
    if (modrmInfo.error) return { instruction: null, length: 0, error: modrmInfo.error };

    const totalLen = 1 + modrmInfo.totalLength;
    const instrBytes = Array.from(bytes.slice(offset, offset + totalLen));
    const dst = aluMeta.dir === 'to_rm' ? modrmInfo.rmDescription : modrmInfo.regName;
    const src = aluMeta.dir === 'to_rm' ? modrmInfo.regName : modrmInfo.rmDescription;
    const mnemonic = `${aluMeta.name} ${dst}, ${src}`;

    const readsRegs: X86Register32[] = [];
    const modifiesRegs: X86Register32[] = [];
    let memoryAddressing: MK1MemoryAddressingInfo | undefined = undefined;

    if (modrmInfo.isMemory) {
      if (modrmInfo.baseRegister) readsRegs.push(modrmInfo.baseRegister);
      if (modrmInfo.indexRegister) readsRegs.push(modrmInfo.indexRegister);
      memoryAddressing = {
        baseRegister: modrmInfo.baseRegister,
        indexRegister: modrmInfo.indexRegister,
        scale: modrmInfo.scale,
        displacement: modrmInfo.displacement,
        displacementHex: modrmInfo.displacement !== null ? toHex32(modrmInfo.displacement >>> 0) : null,
        exactEffectiveAddress: null,
        exactEffectiveAddressHex: null,
        isFullyCalculable: false,
      };
      if (aluMeta.dir === 'to_reg') {
        readsRegs.push(modrmInfo.regName);
        if (!aluMeta.isCmp) modifiesRegs.push(modrmInfo.regName);
      } else {
        readsRegs.push(modrmInfo.regName);
      }
    } else {
      if (modrmInfo.rmName) {
        readsRegs.push(modrmInfo.rmName);
        readsRegs.push(modrmInfo.regName);
        if (!aluMeta.isCmp) {
          modifiesRegs.push(aluMeta.dir === 'to_rm' ? modrmInfo.rmName : modrmInfo.regName);
        }
      }
    }

    return {
      length: totalLen,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: totalLen,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'ALU_ARITH',
        operands: [dst, src],
        readsMemory: modrmInfo.isMemory,
        writesMemory: modrmInfo.isMemory && !aluMeta.isCmp && aluMeta.dir === 'to_rm',
        readsRegisters: Array.from(new Set(readsRegs)),
        modifiesRegisters: Array.from(new Set(modifiesRegs)),
        isControlTransfer: false,
        memoryAddressing,
      },
    };
  }

  // 15b. TEST r/m8, r8 (0x84)
  if (b0 === 0x84) {
    if (remaining < 2) return { instruction: null, length: 0, error: 'Truncated TEST r8' };
    const modrmInfo = decodeModRMSIB(bytes, offset + 1);
    if (modrmInfo.error) return { instruction: null, length: 0, error: modrmInfo.error };

    const totalLen = 1 + modrmInfo.totalLength;
    const instrBytes = Array.from(bytes.slice(offset, offset + totalLen));
    const regIdx = (bytes[offset + 1] >> 3) & 7;
    const reg8 = REGISTER_NAMES_8[regIdx];
    const parentReg = REG8_TO_REG32[reg8];

    const readsRegs: X86Register32[] = [parentReg];
    let memoryAddressing: MK1MemoryAddressingInfo | undefined = undefined;
    let mnemonic = '';
    let operands: string[] = [];

    if (modrmInfo.isMemory) {
      if (modrmInfo.baseRegister) readsRegs.push(modrmInfo.baseRegister);
      if (modrmInfo.indexRegister) readsRegs.push(modrmInfo.indexRegister);
      memoryAddressing = {
        baseRegister: modrmInfo.baseRegister,
        indexRegister: modrmInfo.indexRegister,
        scale: modrmInfo.scale,
        displacement: modrmInfo.displacement,
        displacementHex: modrmInfo.displacement !== null ? toHex32(modrmInfo.displacement >>> 0) : null,
        exactEffectiveAddress: null,
        exactEffectiveAddressHex: null,
        isFullyCalculable: false,
      };
      mnemonic = `TEST ${modrmInfo.rmDescription}, ${reg8}`;
      operands = [modrmInfo.rmDescription, reg8];
    } else {
      const rmIdx = bytes[offset + 1] & 7;
      const rm8 = REGISTER_NAMES_8[rmIdx];
      const parentRm = REG8_TO_REG32[rm8];
      readsRegs.push(parentRm);
      mnemonic = `TEST ${rm8}, ${reg8}`;
      operands = [rm8, reg8];
    }

    return {
      length: totalLen,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: totalLen,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'ALU_ARITH',
        operands,
        readsMemory: modrmInfo.isMemory,
        writesMemory: false,
        readsRegisters: Array.from(new Set(readsRegs)),
        modifiesRegisters: [],
        isControlTransfer: false,
        memoryAddressing,
      },
    };
  }

  // 16. TEST r/m32, r32 (0x85)
  if (b0 === 0x85) {
    const modrmInfo = decodeModRMSIB(bytes, offset + 1);
    if (modrmInfo.error) return { instruction: null, length: 0, error: modrmInfo.error };

    const totalLen = 1 + modrmInfo.totalLength;
    const instrBytes = Array.from(bytes.slice(offset, offset + totalLen));
    const mnemonic = `TEST ${modrmInfo.rmDescription}, ${modrmInfo.regName}`;

    const readsRegs: X86Register32[] = [modrmInfo.regName];
    let memoryAddressing: MK1MemoryAddressingInfo | undefined = undefined;

    if (modrmInfo.isMemory) {
      if (modrmInfo.baseRegister) readsRegs.push(modrmInfo.baseRegister);
      if (modrmInfo.indexRegister) readsRegs.push(modrmInfo.indexRegister);
      memoryAddressing = {
        baseRegister: modrmInfo.baseRegister,
        indexRegister: modrmInfo.indexRegister,
        scale: modrmInfo.scale,
        displacement: modrmInfo.displacement,
        displacementHex: modrmInfo.displacement !== null ? toHex32(modrmInfo.displacement >>> 0) : null,
        exactEffectiveAddress: null,
        exactEffectiveAddressHex: null,
        isFullyCalculable: false,
      };
    } else {
      if (modrmInfo.rmName) readsRegs.push(modrmInfo.rmName);
    }

    return {
      length: totalLen,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: totalLen,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'ALU_ARITH',
        operands: [modrmInfo.rmDescription, modrmInfo.regName],
        readsMemory: modrmInfo.isMemory,
        writesMemory: false,
        readsRegisters: Array.from(new Set(readsRegs)),
        modifiesRegisters: [],
        isControlTransfer: false,
        memoryAddressing,
      },
    };
  }

  // 17. ALU EAX, imm32 short forms: ADD (0x05), OR (0x0D), AND (0x25), SUB (0x2D), XOR (0x35), CMP (0x3D), TEST (0xA9)
  const aluAccOpcodes: Record<number, { name: string; isCmp: boolean }> = {
    0x05: { name: 'ADD', isCmp: false },
    0x0d: { name: 'OR', isCmp: false },
    0x25: { name: 'AND', isCmp: false },
    0x2d: { name: 'SUB', isCmp: false },
    0x35: { name: 'XOR', isCmp: false },
    0x3d: { name: 'CMP', isCmp: true },
    0xa9: { name: 'TEST', isCmp: true },
  };

  const accMeta = aluAccOpcodes[b0];
  if (accMeta) {
    if (remaining < 5) return { instruction: null, length: 0, error: 'Truncated ALU EAX imm32' };
    const imm32 =
      (bytes[offset + 1] | (bytes[offset + 2] << 8) | (bytes[offset + 3] << 16) | (bytes[offset + 4] << 24)) >>> 0;
    const instrBytes = Array.from(bytes.slice(offset, offset + 5));
    return {
      length: 5,
      instruction: {
        address: loadedAddress,
        addressHex: toHex32(loadedAddress),
        physicalOffset,
        physicalOffsetHex: physicalOffset !== null ? toHex32(physicalOffset) : null,
        length: 5,
        bytes: instrBytes,
        bytesHex: bytesToHex(instrBytes),
        mnemonic: `${accMeta.name} EAX, ${toHex32(imm32)}`,
        opcode: b0,
        opcodeHex: toHex8(b0),
        opcodeGroup: 'ALU_ARITH',
        operands: ['EAX', toHex32(imm32)],
        readsMemory: false,
        writesMemory: false,
        readsRegisters: ['EAX'],
        modifiesRegisters: accMeta.isCmp ? [] : ['EAX'],
        isControlTransfer: false,
      },
    };
  }

  return {
    instruction: null,
    length: 1,
    error: `Unsupported opcode ${toHex8(b0)} for B.10 micro-decoder`,
  };
}

/**
 * Executes a bounded static candidate-destination instruction trace.
 * Up to maxBytes (96) and maxInstructions (24).
 * Stops at first control barrier, unsupported opcode, or prefix.
 */
export function traceCandidateDestination(
  exeBytes: Uint8Array,
  startPhysicalOffset: number,
  startLoadedAddress: number,
  maxBytes: number = 96,
  maxInstructions: number = 24,
): {
  startQualification: MK1DestinationStartQualification;
  instructions: MK1DecodedCandidateInstruction[];
  finalBoundary: MK1FinalCandidateControlBoundary;
} {
  const instructions: MK1DecodedCandidateInstruction[] = [];
  let currOffset = startPhysicalOffset;
  let currLoaded = startLoadedAddress;

  if (currOffset < 0 || currOffset >= exeBytes.length) {
    return {
      startQualification: {
        exactStartDecodes: false,
        decodeStatus: 'out-of-bounds',
        firstBytesHex: '',
        firstInstructionMnemonic: null,
        firstInstructionLength: null,
        firstInstructionOpcodeHex: null,
      },
      instructions: [],
      finalBoundary: {
        boundaryReached: false,
        boundaryInstruction: null,
        boundaryLoadedAddress: null,
        boundaryLoadedAddressHex: null,
        boundaryPhysicalOffset: null,
        boundaryPhysicalOffsetHex: null,
        boundaryTargetLoadedAddress: null,
        boundaryTargetLoadedAddressHex: null,
        stopReason: 'no-instructions-decoded',
        aOriginsLive: [],
        bOriginsLive: [],
        boundaryNotFollowedConfirmation: true,
      },
    };
  }

  // Check first instruction decode
  const firstResult = decodeB10MicroInstruction(exeBytes, currOffset, currLoaded, currOffset);
  const firstBytesWindow = Array.from(exeBytes.slice(currOffset, currOffset + Math.min(8, exeBytes.length - currOffset)));
  const firstBytesHex = bytesToHex(firstBytesWindow);

  if (!firstResult.instruction) {
    let decodeStatus: MK1DestinationStartQualification['decodeStatus'] = 'unsupported-opcode';
    if (firstResult.error?.includes('prefix')) {
      decodeStatus = 'unsupported-prefix';
    } else if (firstResult.error?.includes('Truncated')) {
      decodeStatus = 'truncated';
    }

    return {
      startQualification: {
        exactStartDecodes: false,
        decodeStatus,
        firstBytesHex,
        firstInstructionMnemonic: null,
        firstInstructionLength: null,
        firstInstructionOpcodeHex: null,
      },
      instructions: [],
      finalBoundary: {
        boundaryReached: false,
        boundaryInstruction: null,
        boundaryLoadedAddress: null,
        boundaryLoadedAddressHex: null,
        boundaryPhysicalOffset: null,
        boundaryPhysicalOffsetHex: null,
        boundaryTargetLoadedAddress: null,
        boundaryTargetLoadedAddressHex: null,
        stopReason: 'no-instructions-decoded',
        aOriginsLive: [],
        bOriginsLive: [],
        boundaryNotFollowedConfirmation: true,
      },
    };
  }

  const startQualification: MK1DestinationStartQualification = {
    exactStartDecodes: true,
    decodeStatus: 'success',
    firstBytesHex,
    firstInstructionMnemonic: firstResult.instruction.mnemonic,
    firstInstructionLength: firstResult.instruction.length,
    firstInstructionOpcodeHex: firstResult.instruction.opcodeHex,
  };

  let stopReason: MK1FinalCandidateControlBoundary['stopReason'] = 'max-instructions';
  let barrierInstruction: MK1MicroInstruction | null = null;

  while (
    instructions.length < maxInstructions &&
    currOffset - startPhysicalOffset < maxBytes &&
    currOffset < exeBytes.length
  ) {
    const decodeResult = decodeB10MicroInstruction(exeBytes, currOffset, currLoaded, currOffset);
    if (!decodeResult.instruction) {
      stopReason = decodeResult.error?.includes('prefix') ? 'unsupported-prefix' : 'unsupported-instruction';
      break;
    }

    const instr = decodeResult.instruction;
    const isBarrier = instr.isControlTransfer;

    instructions.push({
      ...instr,
      index: instructions.length,
      isBarrier,
      barrierReason: isBarrier ? `Control transfer (${instr.controlTransferType})` : undefined,
    });

    if (isBarrier) {
      barrierInstruction = instr;
      if (instr.controlTransferType === 'call') stopReason = 'call-barrier';
      else if (instr.controlTransferType === 'jump') stopReason = 'jump-barrier';
      else if (instr.controlTransferType === 'jcc') stopReason = 'jcc-barrier';
      else if (instr.controlTransferType === 'return') stopReason = 'ret-barrier';
      else if (instr.controlTransferType === 'interrupt') stopReason = 'int-barrier';
      else stopReason = 'boundary-limit';
      break;
    }

    currOffset += instr.length;
    currLoaded += instr.length;

    if (currOffset - startPhysicalOffset >= maxBytes) {
      stopReason = 'max-bytes';
      break;
    }
  }

  let boundaryTarget: number | null = null;
  if (barrierInstruction && barrierInstruction.operands[0]?.startsWith('0x')) {
    const parsed = Number(barrierInstruction.operands[0]);
    if (!Number.isNaN(parsed)) boundaryTarget = parsed >>> 0;
  }

  const finalBoundary: MK1FinalCandidateControlBoundary = {
    boundaryReached: barrierInstruction !== null,
    boundaryInstruction: barrierInstruction?.mnemonic ?? null,
    boundaryLoadedAddress: barrierInstruction?.address ?? null,
    boundaryLoadedAddressHex: barrierInstruction?.addressHex ?? null,
    boundaryPhysicalOffset: barrierInstruction?.physicalOffset ?? null,
    boundaryPhysicalOffsetHex: barrierInstruction?.physicalOffsetHex ?? null,
    boundaryTargetLoadedAddress: boundaryTarget,
    boundaryTargetLoadedAddressHex: boundaryTarget !== null ? toHex32(boundaryTarget) : null,
    stopReason,
    aOriginsLive: [],
    bOriginsLive: [],
    boundaryNotFollowedConfirmation: true,
  };

  return {
    startQualification,
    instructions,
    finalBoundary,
  };
}

/**
 * Evaluates tracked register origins (A_EAX, A_EBX, B_EAX, B_EBX) against the shared decoded instruction stream.
 */
export function evaluateOriginTraces(
  instructions: MK1DecodedCandidateInstruction[],
  classAInitialEax: number,
  classAInitialEbx: number | null,
  classBInitialEax: number,
  classACoordinates: MK1CandidateCoordinates,
  classBCoordinates: MK1CandidateCoordinates,
  objects: LEObjectEntry[],
): {
  classATrace: MK1ClassTrace;
  classBTrace: MK1ClassTrace;
  differentialSummary: MK1DifferentialTraceSummary;
} {
  // 1. Evaluate Class A EAX
  const aEaxEval = evaluateSingleRegisterOrigin(
    instructions,
    'A_EAX',
    'EAX',
    classAInitialEax,
    classACoordinates,
    objects,
  );

  // 2. Evaluate Class A EBX
  const aEbxEval = evaluateSingleRegisterOrigin(
    instructions,
    'A_EBX',
    'EBX',
    classAInitialEbx,
    classACoordinates,
    objects,
  );

  // 3. Evaluate Class B EAX
  const bEaxEval = evaluateSingleRegisterOrigin(
    instructions,
    'B_EAX',
    'EAX',
    classBInitialEax,
    classBCoordinates,
    objects,
  );

  // 4. Evaluate Class B EBX
  const bEbxEval = evaluateSingleRegisterOrigin(
    instructions,
    'B_EBX',
    'EBX',
    null,
    classBCoordinates,
    objects,
  );

  const classATrace: MK1ClassTrace = {
    classId: 'Class A',
    eaxOrigin: aEaxEval,
    ebxOrigin: aEbxEval,
    eaxUsage: aEaxEval.registerUsage,
    ebxUsage: aEbxEval.registerUsage,
    associatedCandidateId: classACoordinates.candidateId,
    associatedLoadedStructure: classACoordinates.loadedStructureAddress,
    associatedLoadedPayload: classACoordinates.loadedPayloadAddress,
    associatedStructureReached: aEaxEval.associatedStructureReached,
    associatedPayloadReached: aEaxEval.associatedPayloadReached,
    memoryUseObserved: aEaxEval.memoryAccesses.length > 0,
    associatedCandidateMemoryAddressObserved: aEaxEval.memoryAccesses.some(
      (m) => m.matchesAssociatedStructure || m.matchesAssociatedPayload,
    ),
  };

  const classBTrace: MK1ClassTrace = {
    classId: 'Class B',
    eaxOrigin: bEaxEval,
    ebxOrigin: bEbxEval,
    eaxUsage: bEaxEval.registerUsage,
    ebxUsage: bEbxEval.registerUsage,
    associatedCandidateId: classBCoordinates.candidateId,
    associatedLoadedStructure: classBCoordinates.loadedStructureAddress,
    associatedLoadedPayload: classBCoordinates.loadedPayloadAddress,
    associatedStructureReached: bEaxEval.associatedStructureReached,
    associatedPayloadReached: bEaxEval.associatedPayloadReached,
    memoryUseObserved: bEaxEval.memoryAccesses.length > 0,
    associatedCandidateMemoryAddressObserved: bEaxEval.memoryAccesses.some(
      (m) => m.matchesAssociatedStructure || m.matchesAssociatedPayload,
    ),
  };

  // Compare affine operations between A_EAX and B_EAX
  let commonAffineTransformObserved = false;
  let commonAffineOperation: 'ADD' | 'SUB' | 'LEA' | null = null;
  let commonAffineConstant: number | null = null;
  let classAOutput: number | null = null;
  let classBOutput: number | null = null;

  if (aEaxEval.affineOperations.length > 0 && bEaxEval.affineOperations.length > 0) {
    const firstA = aEaxEval.affineOperations[0];
    const firstB = bEaxEval.affineOperations[0];
    if (
      firstA.instructionIndex === firstB.instructionIndex &&
      firstA.operation === firstB.operation &&
      firstA.constant === firstB.constant
    ) {
      commonAffineTransformObserved = true;
      commonAffineOperation = firstA.operation;
      commonAffineConstant = firstA.constant;
      classAOutput = firstA.output;
      classBOutput = firstB.output;
    }
  }

  // Check relocation base matching
  let commonRelocationBaseAdjustmentObserved = false;
  let matchingRelocationBaseObjectNumber: number | null = null;
  if (commonAffineConstant !== null) {
    const matchedObj = objects.find((o) => o.relocationBaseAddress === commonAffineConstant);
    if (matchedObj) {
      commonRelocationBaseAdjustmentObserved = true;
      matchingRelocationBaseObjectNumber = matchedObj.objectNumber;
    }
  }

  const commonTransformReachesBothAssociatedPayloads =
    aEaxEval.associatedPayloadReached && bEaxEval.associatedPayloadReached;

  const associatedCandidateMemoryAddressObserved =
    classATrace.associatedCandidateMemoryAddressObserved || classBTrace.associatedCandidateMemoryAddressObserved;

  const summaryNotes: string[] = [];
  if (commonAffineTransformObserved) {
    summaryNotes.push(
      `Common affine transform observed: ${commonAffineOperation} with constant ${toHex32(commonAffineConstant ?? 0)}.`,
    );
  } else {
    summaryNotes.push('No common affine transform observed within traced instruction stream.');
  }

  if (commonRelocationBaseAdjustmentObserved) {
    summaryNotes.push(
      `Common affine constant matches relocation base of Object ${matchingRelocationBaseObjectNumber}.`,
    );
  }

  if (commonTransformReachesBothAssociatedPayloads) {
    summaryNotes.push('Shared transformation reaches both associated candidate payload addresses.');
  }

  summaryNotes.push(`Class A EBX disposition: ${aEbxEval.firstDisposition}.`);

  const differentialSummary: MK1DifferentialTraceSummary = {
    commonAffineTransformObserved,
    commonAffineOperation,
    commonAffineConstant,
    commonAffineConstantHex: commonAffineConstant !== null ? toHex32(commonAffineConstant) : null,
    classAOutput,
    classAOutputHex: classAOutput !== null ? toHex32(classAOutput) : null,
    classBOutput,
    classBOutputHex: classBOutput !== null ? toHex32(classBOutput) : null,
    commonRelocationBaseAdjustmentObserved,
    matchingRelocationBaseObjectNumber,
    classAAssociatedPayloadReached: aEaxEval.associatedPayloadReached,
    classBAssociatedPayloadReached: bEaxEval.associatedPayloadReached,
    commonTransformReachesBothAssociatedPayloads,
    classAMemoryUseObserved: classATrace.memoryUseObserved,
    classBMemoryUseObserved: classBTrace.memoryUseObserved,
    associatedCandidateMemoryAddressObserved,
    classAEbxQuestionAnswered: true,
    classAEbxDisposition: aEbxEval.firstDisposition,
    summaryNotes,
  };

  return {
    classATrace,
    classBTrace,
    differentialSummary,
  };
}

function evaluateSingleRegisterOrigin(
  instructions: MK1DecodedCandidateInstruction[],
  origin: 'A_EAX' | 'A_EBX' | 'B_EAX' | 'B_EBX',
  reg: X86Register32,
  initialValue: number | null,
  targetCoordinates: MK1CandidateCoordinates,
  objects: LEObjectEntry[],
): MK1OriginEvaluation {
  const initialValueKnown = initialValue !== null;
  let currentValue: number | null = initialValue;
  let valueKnown = initialValueKnown;

  let firstDisposition: MK1OriginEvaluation['firstDisposition'] = 'preserved-to-control-boundary-without-read';
  let firstDispositionIndex: number | null = null;
  let firstDispositionMnemonic: string | null = null;

  const readTypes: Set<string> = new Set();
  const affineOperations: MK1OriginEvaluation['affineOperations'] = [];
  const memoryAccesses: MK1OriginEvaluation['memoryAccesses'] = [];

  let associatedStructureReached = false;
  let associatedPayloadReached = false;

  let isRead = false;
  let isOverwrite = false;
  let isPartialMod = false;
  let isMemoryUse = false;
  let isMemoryBaseUse = false;
  let isMemoryIndexUse = false;
  let isDirectMemoryUse = false;
  let readCount = 0;
  let overwriteCount = 0;
  let partialModCount = 0;
  let memoryUseCount = 0;
  const usageDetails: string[] = [];

  for (let idx = 0; idx < instructions.length; idx++) {
    const instr = instructions[idx];
    const readsRegExplicit = instr.readsRegisters.includes(reg);
    const isBase = instr.memoryAddressing?.baseRegister === reg;
    const isIndex = instr.memoryAddressing?.indexRegister === reg;
    const readsRegMemory = isBase || isIndex;
    const readsThisReg = readsRegExplicit || readsRegMemory;

    const isPartial = instr.partiallyModifiesRegisters?.includes(reg) ?? false;
    const isFullMod = instr.modifiesRegisters.includes(reg) && !isPartial;

    if (readsRegMemory) {
      isMemoryUse = true;
      memoryUseCount++;
      if (isBase) isMemoryBaseUse = true;
      if (isIndex) isMemoryIndexUse = true;
      const hasDisp =
        instr.memoryAddressing?.displacement !== undefined &&
        instr.memoryAddressing?.displacement !== null &&
        instr.memoryAddressing?.displacement !== 0;
      if (isBase && !instr.memoryAddressing?.indexRegister && !hasDisp) {
        isDirectMemoryUse = true;
      }
      const role = isBase ? 'base' : (isIndex ? 'index' : 'unknown');
      usageDetails.push(`memory-use: ${instr.mnemonic} (index ${idx}, role: ${role})`);
    }

    if (readsThisReg) {
      isRead = true;
      readCount++;
      usageDetails.push(`read: ${instr.mnemonic} (index ${idx})`);

      if (firstDispositionIndex === null) {
        firstDisposition = isPartial ? 'partially-modified-before-overwrite' : 'read-before-overwrite';
        firstDispositionIndex = idx;
        firstDispositionMnemonic = instr.mnemonic;
      }

      // Classify read type
      if (instr.memoryAddressing?.baseRegister === reg) {
        readTypes.add('memory-base');
      }
      if (instr.memoryAddressing?.indexRegister === reg) {
        readTypes.add('memory-index');
      }
      if (isDirectMemoryUse) {
        readTypes.add('direct-memory');
      }
      if (isPartial) {
        readTypes.add('partial-register-read');
      }
      if (instr.mnemonic.startsWith('MOVZX')) {
        readTypes.add('movzx-source');
      } else if (instr.mnemonic.startsWith('MOV')) {
        if (instr.operands[1]?.includes(reg)) {
          if (instr.operands[0] && REGISTER_NAMES_32.includes(instr.operands[0] as X86Register32)) {
            readTypes.add('register-copy-source');
          } else {
            readTypes.add('stored-as-value');
          }
        }
      } else if (instr.mnemonic.startsWith('PUSH')) {
        readTypes.add('pushed-value');
      } else if (instr.mnemonic.startsWith('LEA')) {
        readTypes.add('lea-component');
      } else if (instr.opcodeGroup === 'ALU_ARITH') {
        if (instr.mnemonic.startsWith('CMP')) {
          readTypes.add('compare-source');
        } else if (instr.mnemonic.startsWith('TEST')) {
          readTypes.add('test-source');
        } else if (
          instr.mnemonic.startsWith('AND') ||
          instr.mnemonic.startsWith('OR') ||
          instr.mnemonic.startsWith('XOR')
        ) {
          readTypes.add('bitwise-source');
        } else if (instr.modifiesRegisters.includes(reg)) {
          readTypes.add('arithmetic-read-modify-write');
        } else {
          readTypes.add('arithmetic-source');
        }
      }

      // Memory addressing check
      if (instr.memoryAddressing && valueKnown && currentValue !== null) {
        let effAddr: number | null = null;
        let isCalculable = false;

        if (instr.memoryAddressing.baseRegister === reg && instr.memoryAddressing.indexRegister === null) {
          effAddr = (currentValue + (instr.memoryAddressing.displacement ?? 0)) >>> 0;
          isCalculable = true;
        }

        const matchesStructure = effAddr === targetCoordinates.loadedStructureAddress;
        const matchesPayload = effAddr === targetCoordinates.loadedPayloadAddress;

        memoryAccesses.push({
          instructionIndex: idx,
          mnemonic: instr.mnemonic,
          role: instr.memoryAddressing.baseRegister === reg ? 'base' : 'index',
          effectiveAddress: effAddr,
          effectiveAddressHex: effAddr !== null ? toHex32(effAddr) : null,
          isFullyCalculable: isCalculable,
          matchesAssociatedStructure: matchesStructure,
          matchesAssociatedPayload: matchesPayload,
        });

        if (matchesStructure) associatedStructureReached = true;
        if (matchesPayload) associatedPayloadReached = true;
      }
    }

    if (isPartial) {
      isPartialMod = true;
      partialModCount++;
      usageDetails.push(`partial-mod: ${instr.mnemonic} (index ${idx})`);

      if (firstDispositionIndex === null) {
        firstDisposition = 'partially-modified-before-read';
        firstDispositionIndex = idx;
        firstDispositionMnemonic = instr.mnemonic;
      }

      valueKnown = false;
      currentValue = null;
    }

    if (isFullMod) {
      isOverwrite = true;
      overwriteCount++;
      usageDetails.push(`overwrite: ${instr.mnemonic} (index ${idx})`);

      if (firstDispositionIndex === null) {
        firstDisposition = 'overwritten-before-read';
        firstDispositionIndex = idx;
        firstDispositionMnemonic = instr.mnemonic;
      }

      // Check affine modification
      if (valueKnown && currentValue !== null) {
        if (instr.mnemonic.startsWith('ADD') && instr.operands.length === 2 && instr.operands[0] === reg) {
          const imm = Number(instr.operands[1]);
          if (!Number.isNaN(imm)) {
            const output = (currentValue + imm) >>> 0;
            affineOperations.push({
              instructionIndex: idx,
              mnemonic: instr.mnemonic,
              input: currentValue,
              inputHex: toHex32(currentValue),
              operation: 'ADD',
              constant: imm >>> 0,
              constantHex: toHex32(imm >>> 0),
              output,
              outputHex: toHex32(output),
            });
            currentValue = output;
          } else {
            valueKnown = false;
          }
        } else if (instr.mnemonic.startsWith('SUB') && instr.operands.length === 2 && instr.operands[0] === reg) {
          const imm = Number(instr.operands[1]);
          if (!Number.isNaN(imm)) {
            const output = (currentValue - imm) >>> 0;
            affineOperations.push({
              instructionIndex: idx,
              mnemonic: instr.mnemonic,
              input: currentValue,
              inputHex: toHex32(currentValue),
              operation: 'SUB',
              constant: imm >>> 0,
              constantHex: toHex32(imm >>> 0),
              output,
              outputHex: toHex32(output),
            });
            currentValue = output;
          } else {
            valueKnown = false;
          }
        } else if (
          instr.mnemonic.startsWith('LEA') &&
          instr.operands[0] === reg &&
          instr.memoryAddressing?.baseRegister === reg &&
          instr.memoryAddressing?.indexRegister === null
        ) {
          const disp = instr.memoryAddressing.displacement ?? 0;
          const output = (currentValue + disp) >>> 0;
          affineOperations.push({
            instructionIndex: idx,
            mnemonic: instr.mnemonic,
            input: currentValue,
            inputHex: toHex32(currentValue),
            operation: 'LEA',
            constant: disp >>> 0,
            constantHex: toHex32(disp >>> 0),
            output,
            outputHex: toHex32(output),
          });
          currentValue = output;
        } else {
          // Overwritten by non-affine instruction
          valueKnown = false;
          currentValue = null;
        }

        if (currentValue !== null) {
          if (currentValue === targetCoordinates.loadedStructureAddress) associatedStructureReached = true;
          if (currentValue === targetCoordinates.loadedPayloadAddress) associatedPayloadReached = true;
        }
      }
    }
  }

  const registerUsage: MK1RegisterUsageSummary = {
    read: isRead,
    overwrite: isOverwrite,
    partialMod: isPartialMod,
    memoryUse: isMemoryUse,
    memoryBaseUse: isMemoryBaseUse,
    memoryIndexUse: isMemoryIndexUse,
    directMemoryUse: isDirectMemoryUse,
    usageCount: readCount + overwriteCount + partialModCount + memoryUseCount,
    readCount,
    overwriteCount,
    partialModCount,
    memoryUseCount,
    details: usageDetails,
  };

  return {
    origin,
    initialValueKnown,
    initialValue,
    initialValueHex: initialValue !== null ? toHex32(initialValue) : null,
    firstDisposition,
    firstDispositionInstructionIndex: firstDispositionIndex,
    firstDispositionMnemonic,
    readTypes: Array.from(readTypes),
    affineOperations,
    memoryAccesses,
    associatedStructureReached,
    associatedPayloadReached,
    liveAtBoundary: valueKnown,
    valueAtBoundary: currentValue,
    valueAtBoundaryHex: currentValue !== null ? toHex32(currentValue) : null,
    registerUsage,
  };
}
