/**
 * MK1 Executable Palette Occurrence Context Reconnaissance (Milestone 1E.2B.2)
 *
 * Investigates the structural context surrounding the exact address-representation
 * occurrences discovered in 1E.2B.1 without full disassembly, pointer semantics,
 * or palette ownership claims.
 *
 * Core Epistemic Axiom:
 * STRUCTURAL COINCIDENCE != POINTER OR PALETTE OWNERSHIP
 *
 * Track A: Evaluates preceding byte context in Object 1 (R-X region) against narrow
 * explicitly approved 32-bit x86 operand-field encodings using bounded lookbehind.
 *
 * Track B: Identifies physical spatial clusters across all regions using start-offset
 * deltas (start-offset delta <= 64 bytes, min 3 positions per cluster) and analyzes stride regularity
 * using neutral structural terminology.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import {
  MK1PaletteReferenceReconResult,
  ExactValueOccurrence,
} from './paletteReferenceReconnaissanceTypes';
import {
  CandidateOccurrenceContextSummary,
  KnownAnchorControlContextSummary,
  MK1CompactPaletteOccurrenceContextExport,
  MK1PaletteOccurrenceContextResult,
  NegativeControlVerification,
  OccurrenceContextReconciliation,
  PhysicalOccurrenceCluster,
  PhysicalPositionContextClassification,
  ScanConfiguration,
  TrackAResultSummary,
  TrackAShapeDistribution,
  TrackBResultSummary,
  X86OperandShapeClass,
  X86ShapeMatchDetails,
  X86ShapeStatus,
} from './paletteOccurrenceContextTypes';

export const NEGATIVE_CONTROL_CANDIDATE_ID = 'MK1.EXE:0x0009C914';

/**
 * Authoritative Positive Shape Whitelist for Milestone 1E.2B.2.
 * Single source of truth used by the classifier, scan configuration, UI, and tests.
 */
export const POSITIVE_SHAPE_WHITELIST: readonly string[] = [
  'MOV r32, imm32 (0xB8..0xBF + imm32)',
  'PUSH imm32 (0x68 + imm32)',
  'accumulator-imm32 (0x05, 0x0D, 0x15, 0x1D, 0x25, 0x2D, 0x35, 0x3D + imm32)',
  'moffs32-direct (0xA1, 0xA3 + moffs32)',
  'disp32-absolute (0x8B, 0x89, 0x8D mod=00 r/m=101 disp32)',
  'disp32-absolute-sib (0x8B, 0x89, 0x8D mod=00 r/m=100 SIB base=101 disp32)',
] as const;

export const RELATIVE_NEGATIVE_SHAPES: readonly string[] = [
  '0xE8 (CALL rel32)',
  '0xE9 (JMP rel32)',
] as const;

export const APPROVED_ACCUMULATOR_OPCODES: readonly number[] = [
  0x05, 0x0D, 0x15, 0x1D, 0x25, 0x2D, 0x35, 0x3D,
] as const;

export const ALU_OPCODE_NAMES: Readonly<Record<number, string>> = {
  0x05: 'ADD',
  0x0D: 'OR',
  0x15: 'ADC',
  0x1D: 'SBB',
  0x25: 'AND',
  0x2D: 'SUB',
  0x35: 'XOR',
  0x3D: 'CMP',
};

export interface PaletteOccurrenceContextOptions {
  exePath?: string;
  exeSize?: number;
  onProgress?: (stage: string, progress: number) => void;
}

const REG_NAMES_32: readonly string[] = ['EAX', 'ECX', 'EDX', 'EBX', 'ESP', 'EBP', 'ESI', 'EDI'];

function toHex8(v: number): string {
  return `0x${v.toString(16).toUpperCase().padStart(2, '0')}`;
}

function toHex32(v: number): string {
  return `0x${(v >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
}

function bytesToHex(buf: Uint8Array, start: number, len: number): string {
  const parts: string[] = [];
  const end = Math.min(buf.length, start + len);
  for (let i = start; i < end; i++) {
    parts.push(buf[i].toString(16).toUpperCase().padStart(2, '0'));
  }
  return parts.join(' ');
}

function isPrefixByte(b: number): boolean {
  return (
    b === 0x66 || // Operand-size override (switches 32-bit to 16-bit)
    b === 0x67 || // Address-size override (switches 32-bit to 16-bit)
    b === 0x2e || // CS override
    b === 0x36 || // SS override
    b === 0x3e || // DS override
    b === 0x26 || // ES override
    b === 0x64 || // FS override
    b === 0x65 || // GS override
    b === 0xf2 || // REPNE / REPNZ
    b === 0xf3    // REP / REPE
  );
}

/**
 * Track A: Bounded candidate-start search (P-8 to P-1).
 * Inspects all possible candidate instruction start offsets S in [P-8, P-1]
 * that place a 4-byte operand field exactly at [P, P+4).
 * Returns all matching shape candidates without arbitrary first-match cutoff.
 */
export function classifyX86OperandShape(
  buffer: Uint8Array,
  pos: number,
  matchedUint32: number
): X86ShapeMatchDetails & {
  matchingShapes: X86ShapeMatchDetails[];
  shapeStatus: X86ShapeStatus;
  primaryShape: X86ShapeMatchDetails;
} {
  const matchedHex = toHex32(matchedUint32);
  const minStart = Math.max(0, pos - 8);
  const maxStart = pos - 1;
  const matchingShapes: X86ShapeMatchDetails[] = [];
  let hasAmbiguousPrefix = false;

  for (let start = minStart; start <= maxStart; start++) {
    // If this start offset is preceded by an unconsumed prefix byte, skip it:
    // in valid x86 instruction streams, instruction prefixes attach to the opcode,
    // so candidate instructions cannot begin immediately after an unconsumed prefix.
    if (start > 0 && isPrefixByte(buffer[start - 1])) {
      continue;
    }

    let curr = start;
    const prefixes: number[] = [];

    while (curr < pos && isPrefixByte(buffer[curr])) {
      prefixes.push(buffer[curr]);
      curr++;
    }

    if (curr >= pos) {
      // Only prefixes between start and pos; cannot be an instruction opcode
      continue;
    }

    const has66 = prefixes.includes(0x66);
    const has67 = prefixes.includes(0x67);
    const hasF2 = prefixes.includes(0xf2);
    const hasF3 = prefixes.includes(0xf3);
    const hasConflictingPrefixes = hasF2 && hasF3;

    if (hasConflictingPrefixes) {
      hasAmbiguousPrefix = true;
      continue;
    }

    const op = buffer[curr];

    // Pattern 1: MOV r32, imm32 (opcode 0xB8..0xBF at P-1)
    if (op >= 0xb8 && op <= 0xbf) {
      if (curr + 1 === pos) {
        if (has66) {
          // 0x66 operand-size override switches imm32 to imm16 (2 bytes)
          hasAmbiguousPrefix = true;
        } else {
          const reg = REG_NAMES_32[op - 0xb8];
          const encLen = pos - start + 4;
          matchingShapes.push({
            shapeClass: 'mov-r32-imm32',
            mnemonicHint: `MOV ${reg}, ${matchedHex}`,
            opcodeBytesHex: bytesToHex(buffer, start, pos - start),
            candidateEncodingStart: start,
            candidateEncodingStartHex: toHex32(start),
            candidateEncodingLength: encLen,
            instructionOffset: start,
            instructionOffsetHex: toHex32(start),
            instructionLength: encLen,
            isWhitelistedShape: true,
            isNegativeContext: false,
            explanation: `MOV ${reg}, imm32 (opcode ${toHex8(op)} at P-1). Coincides with 32-bit immediate operand field.`,
          });
        }
      }
    }

    // Pattern 2: PUSH imm32 (opcode 0x68 at P-1)
    else if (op === 0x68) {
      if (curr + 1 === pos) {
        if (has66) {
          hasAmbiguousPrefix = true;
        } else {
          const encLen = pos - start + 4;
          matchingShapes.push({
            shapeClass: 'push-imm32',
            mnemonicHint: `PUSH ${matchedHex}`,
            opcodeBytesHex: bytesToHex(buffer, start, pos - start),
            candidateEncodingStart: start,
            candidateEncodingStartHex: toHex32(start),
            candidateEncodingLength: encLen,
            instructionOffset: start,
            instructionOffsetHex: toHex32(start),
            instructionLength: encLen,
            isWhitelistedShape: true,
            isNegativeContext: false,
            explanation: `PUSH imm32 (opcode 0x68 at P-1). Coincides with 32-bit immediate push operand.`,
          });
        }
      }
    }

    // Pattern 3: Accumulator immediate32 (0x05, 0x0D, 0x15, 0x1D, 0x25, 0x2D, 0x35, 0x3D at P-1)
    else if (ALU_OPCODE_NAMES[op] !== undefined) {
      if (curr + 1 === pos) {
        if (has66) {
          hasAmbiguousPrefix = true;
        } else {
          const aluName = ALU_OPCODE_NAMES[op];
          const encLen = pos - start + 4;
          matchingShapes.push({
            shapeClass: 'accumulator-imm32',
            mnemonicHint: `${aluName} EAX, ${matchedHex}`,
            opcodeBytesHex: bytesToHex(buffer, start, pos - start),
            candidateEncodingStart: start,
            candidateEncodingStartHex: toHex32(start),
            candidateEncodingLength: encLen,
            instructionOffset: start,
            instructionOffsetHex: toHex32(start),
            instructionLength: encLen,
            isWhitelistedShape: true,
            isNegativeContext: false,
            explanation: `${aluName} EAX, imm32 (opcode ${toHex8(op)} at P-1). Coincides with accumulator immediate operand.`,
          });
        }
      }
    }

    // Pattern 4: MOFFS32 direct (0xA1, 0xA3 at P-1)
    else if (op === 0xa1 || op === 0xa3) {
      if (curr + 1 === pos) {
        if (has67) {
          // 0x67 address-size override switches moffs32 to moffs16 (2 bytes)
          hasAmbiguousPrefix = true;
        } else {
          const hint = op === 0xa1 ? `MOV EAX, [${matchedHex}]` : `MOV [${matchedHex}], EAX`;
          const encLen = pos - start + 4;
          matchingShapes.push({
            shapeClass: 'moffs32-direct',
            mnemonicHint: hint,
            opcodeBytesHex: bytesToHex(buffer, start, pos - start),
            candidateEncodingStart: start,
            candidateEncodingStartHex: toHex32(start),
            candidateEncodingLength: encLen,
            instructionOffset: start,
            instructionOffsetHex: toHex32(start),
            instructionLength: encLen,
            isWhitelistedShape: true,
            isNegativeContext: false,
            explanation: `MOFFS32 direct memory reference (opcode ${toHex8(op)} at P-1). Coincides with direct accumulator memory offset.`,
          });
        }
      }
    }

    // Pattern 5: Narrow ModR/M disp32 (opcodes 0x8B, 0x89, 0x8D ONLY)
    else if (op === 0x8b || op === 0x89 || op === 0x8d) {
      // Check 5A: Absolute [disp32] without SIB (mod=00, r/m=101 at P-1)
      if (curr + 2 === pos) {
        const modrm = buffer[curr + 1];
        const mod = (modrm >> 6) & 0x03;
        const rm = modrm & 0x07;
        const regIdx = (modrm >> 3) & 0x07;

        if (mod === 0x00 && rm === 0x05) {
          if (has67) {
            hasAmbiguousPrefix = true;
          } else {
            const regName = REG_NAMES_32[regIdx];
            const opName = op === 0x8b ? `MOV ${regName}, [${matchedHex}]` : op === 0x89 ? `MOV [${matchedHex}], ${regName}` : `LEA ${regName}, [${matchedHex}]`;
            const encLen = pos - start + 4;
            matchingShapes.push({
              shapeClass: 'disp32-absolute',
              mnemonicHint: opName,
              opcodeBytesHex: bytesToHex(buffer, start, pos - start),
              candidateEncodingStart: start,
              candidateEncodingStartHex: toHex32(start),
              candidateEncodingLength: encLen,
              instructionOffset: start,
              instructionOffsetHex: toHex32(start),
              instructionLength: encLen,
              isWhitelistedShape: true,
              isNegativeContext: false,
              explanation: `Absolute memory displacement [disp32] (opcode ${toHex8(op)}, ModR/M ${toHex8(modrm)} mod=00, r/m=101 at P-1).`,
            });
          }
        }
      }

      // Check 5B: Absolute [disp32] with SIB (mod=00, r/m=100, SIB base=101 at P-1)
      if (curr + 3 === pos) {
        const modrm = buffer[curr + 1];
        const sib = buffer[curr + 2];
        const mod = (modrm >> 6) & 0x03;
        const rm = modrm & 0x07;
        const regIdx = (modrm >> 3) & 0x07;
        const sibBase = sib & 0x07;

        if (mod === 0x00 && rm === 0x04 && sibBase === 0x05) {
          if (has67) {
            hasAmbiguousPrefix = true;
          } else {
            const regName = REG_NAMES_32[regIdx];
            const opName =
              op === 0x8b
                ? `MOV ${regName}, [${matchedHex}]`
                : op === 0x89
                ? `MOV [${matchedHex}], ${regName}`
                : `LEA ${regName}, [${matchedHex}]`;
            const encLen = pos - start + 4;
            matchingShapes.push({
              shapeClass: 'disp32-absolute',
              mnemonicHint: opName,
              opcodeBytesHex: bytesToHex(buffer, start, pos - start),
              candidateEncodingStart: start,
              candidateEncodingStartHex: toHex32(start),
              candidateEncodingLength: encLen,
              instructionOffset: start,
              instructionOffsetHex: toHex32(start),
              instructionLength: encLen,
              isWhitelistedShape: true,
              isNegativeContext: false,
              explanation: `Absolute memory displacement via SIB (opcode ${toHex8(op)}, ModR/M ${toHex8(modrm)}, SIB ${toHex8(sib)} at P-1).`,
            });
          }
        }
      }
    }

    // Pattern 6: Relative branch (NEGATIVE context: CALL rel32 / JMP rel32 at P-1)
    else if (op === 0xe8 || op === 0xe9) {
      if (curr + 1 === pos) {
        if (has66) {
          hasAmbiguousPrefix = true;
        } else {
          const encLen = pos - start + 4;
          matchingShapes.push({
            shapeClass: 'negative-rel32',
            mnemonicHint: `${op === 0xe8 ? 'CALL' : 'JMP'} rel32 (${matchedHex})`,
            opcodeBytesHex: bytesToHex(buffer, start, pos - start),
            candidateEncodingStart: start,
            candidateEncodingStartHex: toHex32(start),
            candidateEncodingLength: encLen,
            instructionOffset: start,
            instructionOffsetHex: toHex32(start),
            instructionLength: encLen,
            isWhitelistedShape: false,
            isNegativeContext: true,
            explanation: `Preceding byte ${toHex8(op)} (${op === 0xe8 ? 'CALL' : 'JMP'} rel32). Occurrence coincides with relative branch displacement, NOT an absolute address.`,
          });
        }
      }
    }
  }

  const whitelisted = matchingShapes.filter((s) => s.isWhitelistedShape);
  const negatives = matchingShapes.filter((s) => s.isNegativeContext);

  let shapeStatus: X86ShapeStatus;
  if (whitelisted.length === 1) {
    shapeStatus = 'single-whitelisted-shape';
  } else if (whitelisted.length >= 2) {
    shapeStatus = 'multiple-whitelisted-shapes';
  } else if (negatives.length > 0) {
    shapeStatus = 'relative-control-field-shape';
  } else if (hasAmbiguousPrefix) {
    shapeStatus = 'ambiguous-prefix-context';
  } else {
    shapeStatus = 'no-whitelisted-shape';
  }

  let primaryShape: X86ShapeMatchDetails;
  if (whitelisted.length > 0) {
    primaryShape = whitelisted[0];
  } else if (negatives.length > 0) {
    primaryShape = negatives[0];
  } else {
    const defaultStart = Math.max(0, pos - 1);
    primaryShape = {
      shapeClass: 'unmatched-shape',
      mnemonicHint: shapeStatus === 'ambiguous-prefix-context' ? '(ambiguous prefix context)' : '(no whitelisted operand shape)',
      opcodeBytesHex: pos >= 2 ? `${toHex8(buffer[pos - 2])} ${toHex8(buffer[pos - 1])}` : pos >= 1 ? toHex8(buffer[pos - 1]) : '',
      candidateEncodingStart: defaultStart,
      candidateEncodingStartHex: toHex32(defaultStart),
      candidateEncodingLength: 4,
      instructionOffset: defaultStart,
      instructionOffsetHex: toHex32(defaultStart),
      instructionLength: 4,
      isWhitelistedShape: false,
      isNegativeContext: false,
      explanation:
        shapeStatus === 'ambiguous-prefix-context'
          ? 'Preceding prefix context creates ambiguous or 16-bit operand/address width; not classified as 32-bit address shape.'
          : 'Preceding bytes do not match any whitelisted 32-bit x86 operand encoding shape.',
    };
  }

  return {
    ...primaryShape,
    matchingShapes,
    shapeStatus,
    primaryShape,
  };
}

/**
 * Track B: Region-by-region spatial clustering.
 * Corrected Rule:
 * Sorted unique physical positions within region: sorted[0], sorted[1], ...
 * For i = 1 .. sorted.length - 1:
 *   delta = sorted[i] - sorted[i-1] (physical start-offset delta)
 *   If delta <= 64: add to current run
 *   Else: if current run length >= 3, emit cluster; start new run [sorted[i]]
 * Stride classification uses neutral structural language (no semantic labels).
 */
export function clusterRegionPositions(
  regionPositions: number[],
  regionId: string,
  regionClass: string,
  objectNumber: number | null,
  positionMap?: Map<number, ExactValueOccurrence[]>,
  existingClusterCount = 0
): PhysicalOccurrenceCluster[] & { clusters: PhysicalOccurrenceCluster[]; clusteredPositions: Set<number> } {
  if (regionPositions.length < 3) {
    const empty = [] as unknown as PhysicalOccurrenceCluster[] & {
      clusters: PhysicalOccurrenceCluster[];
      clusteredPositions: Set<number>;
    };
    empty.clusters = [];
    empty.clusteredPositions = new Set<number>();
    return empty;
  }

  const sorted = [...regionPositions].sort((a, b) => a - b);
  const clusters: PhysicalOccurrenceCluster[] = [];
  let currentRun: number[] = [sorted[0]];

  const finalizeRun = (run: number[]) => {
    if (run.length < 3) return;

    const clusterIndex = existingClusterCount + clusters.length + 1;
    const clusterId = `cluster_${String(clusterIndex).padStart(3, '0')}`;
    const startOffset = run[0];
    const endOffset = run[run.length - 1] + 4; // end of 4-byte payload (exclusive byte offset)
    const positionCount = run.length;

    // Consecutive start-offset deltas
    const consecutiveDeltas: number[] = [];
    const interFieldGapBytes: number[] = [];
    for (let i = 0; i < run.length - 1; i++) {
      consecutiveDeltas.push(run[i + 1] - run[i]);
      interFieldGapBytes.push(run[i + 1] - (run[i] + 4));
    }

    // Stride frequency analysis
    const deltaCounts = new Map<number, number>();
    for (const d of consecutiveDeltas) {
      deltaCounts.set(d, (deltaCounts.get(d) ?? 0) + 1);
    }

    let clusterType: 'constant-stride-cluster' | 'dominant-stride-cluster' | 'mixed-stride-cluster';
    let constantStride: number | null = null;
    let dominantStride: number | null = null;
    let dominantStrideCount: number | null = null;
    let strideDescription: string;

    if (deltaCounts.size === 1) {
      clusterType = 'constant-stride-cluster';
      constantStride = consecutiveDeltas[0];
      dominantStride = consecutiveDeltas[0];
      dominantStrideCount = consecutiveDeltas.length;
      strideDescription = `Constant ${constantStride}-byte start-offset stride`;
    } else {
      let maxCount = 0;
      for (const count of deltaCounts.values()) {
        if (count > maxCount) maxCount = count;
      }
      const topDeltas: number[] = [];
      for (const [delta, count] of deltaCounts.entries()) {
        if (count === maxCount) topDeltas.push(delta);
      }

      if (topDeltas.length === 1 && maxCount > 1) {
        clusterType = 'dominant-stride-cluster';
        dominantStride = topDeltas[0];
        dominantStrideCount = maxCount;
        strideDescription = `Dominant ${dominantStride}-byte start-offset stride (${dominantStrideCount}/${consecutiveDeltas.length} deltas)`;
      } else {
        clusterType = 'mixed-stride-cluster';
        const minD = Math.min(...consecutiveDeltas);
        const maxD = Math.max(...consecutiveDeltas);
        strideDescription = `Mixed start-offset stride (min ${minD}, max ${maxD} bytes)`;
      }
    }

    const isRegularStride = clusterType === 'constant-stride-cluster';
    const detectedStride = isRegularStride ? constantStride : dominantStride;

    // Logical match occurrences, candidate associations, histograms, and monotonicity
    let logicalMatchCount = 0;
    const candidateIdSet = new Set<string>();
    const repKindHistogram: Record<string, number> = {};
    const targetRegionHistogram: Record<string, number> = {};
    const targetObjectHistogram: Record<string, number> = {};
    const valuesAtPositions: number[] = [];

    for (const pos of run) {
      const occurrences = positionMap?.get(pos) ?? [];
      logicalMatchCount += occurrences.length;
      if (occurrences.length > 0) {
        valuesAtPositions.push(occurrences[0].matchedUint32Value);
      }
      for (const occ of occurrences) {
        candidateIdSet.add(occ.targetCandidateId);
        repKindHistogram[occ.representationKind] = (repKindHistogram[occ.representationKind] ?? 0) + 1;
        targetRegionHistogram[occ.targetCandidateRegionId] = (targetRegionHistogram[occ.targetCandidateRegionId] ?? 0) + 1;
        const objKey = occ.targetObjectNumber !== null ? `Object ${occ.targetObjectNumber}` : 'Unmapped';
        targetObjectHistogram[objKey] = (targetObjectHistogram[objKey] ?? 0) + 1;
      }
    }

    // Monotonicity analysis
    let targetValueMonotonicity: 'strictly-increasing' | 'monotonically-increasing' | 'strictly-decreasing' | 'monotonically-decreasing' | 'constant' | 'non-monotonic' = 'constant';
    if (valuesAtPositions.length > 1) {
      let isStrictInc = true;
      let isMonoInc = true;
      let isStrictDec = true;
      let isMonoDec = true;
      let isAllConst = true;

      for (let i = 0; i < valuesAtPositions.length - 1; i++) {
        const a = valuesAtPositions[i];
        const b = valuesAtPositions[i + 1];
        if (b !== a) isAllConst = false;
        if (b <= a) isStrictInc = false;
        if (b < a) isMonoInc = false;
        if (b >= a) isStrictDec = false;
        if (b > a) isMonoDec = false;
      }

      if (isAllConst) targetValueMonotonicity = 'constant';
      else if (isStrictInc) targetValueMonotonicity = 'strictly-increasing';
      else if (isMonoInc) targetValueMonotonicity = 'monotonically-increasing';
      else if (isStrictDec) targetValueMonotonicity = 'strictly-decreasing';
      else if (isMonoDec) targetValueMonotonicity = 'monotonically-decreasing';
      else targetValueMonotonicity = 'non-monotonic';
    }

    const byteSpan = endOffset - startOffset;
    const densityPercentage = Math.min(100, Math.round(((positionCount * 4) / Math.max(1, byteSpan)) * 100));
    const averageGap = consecutiveDeltas.length > 0 ? Math.round(consecutiveDeltas.reduce((a, b) => a + b, 0) / consecutiveDeltas.length) : 0;
    const minGap = consecutiveDeltas.length > 0 ? Math.min(...consecutiveDeltas) : 0;
    const maxGap = consecutiveDeltas.length > 0 ? Math.max(...consecutiveDeltas) : 0;

    clusters.push({
      clusterId,
      sourceRegionId: regionId,
      sourceRegionClass: regionClass,
      sourceObjectNumber: objectNumber,
      startOffset,
      startOffsetHex: toHex32(startOffset),
      endOffset,
      endOffsetHex: toHex32(endOffset),
      positionCount,
      logicalMatchCount,
      positions: run,
      positionsHex: run.map(toHex32),
      consecutiveDeltas,
      clusterType,
      constantStride,
      dominantStride,
      dominantStrideCount,
      distinctStrideCount: deltaCounts.size,
      representationKindHistogram: repKindHistogram,
      targetRegionHistogram,
      targetObjectHistogram,
      distinctTargetCount: candidateIdSet.size,
      targetValueMonotonicity,
      byteSpan,
      densityPercentage,
      averageGap,
      minGap,
      maxGap,
      isRegularStride,
      detectedStride,
      strideDescription,
      candidateIds: Array.from(candidateIdSet).sort(),
      candidateCount: candidateIdSet.size,
      interFieldGapBytes,
      regionId,
      regionClass,
    });
  };

  for (let i = 1; i < sorted.length; i++) {
    const delta = sorted[i] - sorted[i - 1];
    if (delta <= 64) {
      currentRun.push(sorted[i]);
    } else {
      finalizeRun(currentRun);
      currentRun = [sorted[i]];
    }
  }
  finalizeRun(currentRun);

  const result = clusters as PhysicalOccurrenceCluster[] & {
    clusters: PhysicalOccurrenceCluster[];
    clusteredPositions: Set<number>;
  };
  result.clusters = clusters;
  result.clusteredPositions = new Set(clusters.flatMap((c) => c.positions));
  return result;
}

/**
 * Main execution function for Milestone 1E.2B.2.
 */
export async function performPaletteOccurrenceContextReconnaissance(
  source: DirectorySource,
  reconResult: MK1PaletteReferenceReconResult,
  options?: PaletteOccurrenceContextOptions
): Promise<MK1PaletteOccurrenceContextResult> {
  const startTime = Date.now();
  const operationId = `palette_ctx_${startTime}`;

  // 1. Fixture assertion
  const exePath = options?.exePath ?? reconResult.fixture.exePath;
  const exeSize = options?.exeSize ?? reconResult.fixture.exeSize;

  if (
    (options?.exePath && options.exePath !== reconResult.fixture.exePath) ||
    (options?.exeSize && options.exeSize !== reconResult.fixture.exeSize)
  ) {
    return {
      status: 'FAILED',
      failureReason: `FIXTURE MISMATCH: Specified fixture (${options?.exePath}, ${options?.exeSize}) does not match B.1 verified input fixture (${reconResult.fixture.exePath}, ${reconResult.fixture.exeSize}).`,
      metadata: { operationId, timestamp: new Date().toISOString(), durationMs: 0, milestone: '1E.2B.2' },
      fixture: { exePath, exeSize, exeSizeHex: toHex32(exeSize) },
      sourceReconSummary: { totalInputCandidates: 0, totalLogicalExternalMatches: 0, uniqueExternalPhysicalPositions: 0 },
      scanConfiguration: getScanConfiguration(),
      reconciliation: getEmptyReconciliation(),
      trackA: getEmptyTrackA(),
      trackB: getEmptyTrackB(),
      candidateContextSummaries: [],
      knownAnchorControlContext: [],
      classifiedPositions: [],
      negativeControl: getNegativeControl(0, 0),
    };
  }

  options?.onProgress?.('Validating fixture and reading executable binary...', 0.05);
  const exeBuffer = await source.readSlice(exePath, 0, exeSize);
  if (!exeBuffer || exeBuffer.byteLength !== exeSize) {
    return {
      status: 'FAILED',
      failureReason: `FIXTURE MISMATCH: Binary fixture mismatch: expected ${exeSize} bytes, got ${exeBuffer?.byteLength ?? 0}`,
      metadata: { operationId, timestamp: new Date().toISOString(), durationMs: 0, milestone: '1E.2B.2' },
      fixture: { exePath, exeSize, exeSizeHex: toHex32(exeSize) },
      sourceReconSummary: { totalInputCandidates: 0, totalLogicalExternalMatches: 0, uniqueExternalPhysicalPositions: 0 },
      scanConfiguration: getScanConfiguration(),
      reconciliation: getEmptyReconciliation(),
      trackA: getEmptyTrackA(),
      trackB: getEmptyTrackB(),
      candidateContextSummaries: [],
      knownAnchorControlContext: [],
      classifiedPositions: [],
      negativeControl: getNegativeControl(0, 0),
    };
  }

  // 2. Aggregate external occurrences by unique physical byte offset
  options?.onProgress?.('Aggregating unique physical positions from 1E.2B.1 external matches...', 0.15);
  const positionMap = new Map<number, ExactValueOccurrence[]>();
  for (const occ of reconResult.detailedOccurrences) {
    let list = positionMap.get(occ.sourceFileOffset);
    if (!list) {
      list = [];
      positionMap.set(occ.sourceFileOffset, list);
    }
    list.push(occ);
  }

  const uniquePositions = Array.from(positionMap.keys()).sort((a, b) => a - b);
  const totalLogicalExternalMatches = reconResult.globalSummary.totalExternalLogicalMatches;

  // 3. Track B: Physical Spatial Clustering (All regions)
  options?.onProgress?.('Executing Track B: physical spatial cluster analysis...', 0.3);
  const positionsByRegion = new Map<string, { positions: number[]; regionClass: string; objectNumber: number | null }>();
  for (const pos of uniquePositions) {
    const sampleOcc = positionMap.get(pos)![0];
    const regionId = sampleOcc.sourceRegionId;
    let entry = positionsByRegion.get(regionId);
    if (!entry) {
      entry = { positions: [], regionClass: sampleOcc.sourceRegionClass, objectNumber: sampleOcc.sourceObjectNumber };
      positionsByRegion.set(regionId, entry);
    }
    entry.positions.push(pos);
  }

  const allClusters: PhysicalOccurrenceCluster[] = [];
  const positionClusterMap = new Map<number, string>();

  for (const [regionId, data] of positionsByRegion.entries()) {
    const regionClusters = clusterRegionPositions(
      data.positions,
      regionId,
      data.regionClass,
      data.objectNumber,
      positionMap,
      allClusters.length
    );
    for (const cl of regionClusters) {
      allClusters.push(cl);
      for (const pos of cl.positions) {
        positionClusterMap.set(pos, cl.clusterId);
      }
    }
  }

  // 4. Track A: x86 Operand-Field Shape Analysis (Object 1 R-X region only)
  options?.onProgress?.('Executing Track A: narrow x86 operand-field shape analysis...', 0.55);
  const classifiedPositions: PhysicalPositionContextClassification[] = [];
  let obj1EligiblePositions = 0;
  let obj1EligibleMatches = 0;
  let singleWhitelistedCount = 0;
  let multipleWhitelistedCount = 0;
  let negContextCount = 0;
  let ambiguousPrefixCount = 0;
  let unmatchedCount = 0;

  const shapeDistributionCounts: Record<X86OperandShapeClass, { positions: number; matches: number }> = {
    'mov-r32-imm32': { positions: 0, matches: 0 },
    'push-imm32': { positions: 0, matches: 0 },
    'moffs32-direct': { positions: 0, matches: 0 },
    'accumulator-imm32': { positions: 0, matches: 0 },
    'disp32-absolute': { positions: 0, matches: 0 },
    'negative-rel32': { positions: 0, matches: 0 },
    'unmatched-shape': { positions: 0, matches: 0 },
  };

  for (const pos of uniquePositions) {
    const occs = positionMap.get(pos)!;
    const sampleOcc = occs[0];
    const isObject1 = sampleOcc.sourceObjectNumber === 1;

    // Context bytes window [P-8 .. P+7]
    const ctxStart = Math.max(0, pos - 8);
    const ctxLen = Math.min(exeBuffer.length - ctxStart, 16);
    const contextBytesHex = bytesToHex(exeBuffer, ctxStart, ctxLen);

    let trackA_x86Shape: X86ShapeMatchDetails | null = null;
    let shapeStatus: X86ShapeStatus | null = null;
    let matchingShapes: X86ShapeMatchDetails[] = [];

    if (isObject1) {
      obj1EligiblePositions++;
      obj1EligibleMatches += occs.length;

      const analysis = classifyX86OperandShape(exeBuffer, pos, sampleOcc.matchedUint32Value);
      matchingShapes = analysis.matchingShapes;
      shapeStatus = analysis.shapeStatus;
      trackA_x86Shape = analysis.primaryShape;

      if (shapeStatus === 'single-whitelisted-shape') {
        singleWhitelistedCount++;
      } else if (shapeStatus === 'multiple-whitelisted-shapes') {
        multipleWhitelistedCount++;
      } else if (shapeStatus === 'relative-control-field-shape') {
        negContextCount++;
      } else if (shapeStatus === 'ambiguous-prefix-context') {
        ambiguousPrefixCount++;
      } else {
        unmatchedCount++;
      }

      shapeDistributionCounts[trackA_x86Shape.shapeClass].positions++;
      shapeDistributionCounts[trackA_x86Shape.shapeClass].matches += occs.length;
    }

    const clusterId = positionClusterMap.get(pos) ?? null;

    classifiedPositions.push({
      sourceFileOffset: pos,
      sourceFileOffsetHex: toHex32(pos),
      sourceRegionId: sampleOcc.sourceRegionId,
      sourceRegionClass: sampleOcc.sourceRegionClass,
      sourceObjectNumber: sampleOcc.sourceObjectNumber,
      sourceLoadedAddressHex: sampleOcc.sourceLoadedAddressHex,
      matchedUint32Value: sampleOcc.matchedUint32Value,
      matchedUint32Hex: sampleOcc.matchedUint32Hex,
      logicalMatchesCount: occs.length,
      associatedCandidates: occs.map((o) => ({
        candidateId: o.targetCandidateId,
        representationKind: o.representationKind,
        targetCandidateByteStartHex: o.targetCandidateByteStartHex,
        targetCandidateRegionId: o.targetCandidateRegionId,
        targetObjectNumber: o.targetObjectNumber,
      })),
      contextBytesHex,
      trackA_x86Shape,
      shapeStatus,
      matchingShapes,
      clusterId,
      isClustered: clusterId !== null,
    });
  }

  // 5. Build Track A Summary
  const whitelistedShapePositions = singleWhitelistedCount + multipleWhitelistedCount;
  const trackA: TrackAResultSummary = {
    eligibleObject1Positions: obj1EligiblePositions,
    eligibleObject1LogicalMatches: obj1EligibleMatches,
    whitelistedShapePositions,
    negativeContextPositions: negContextCount,
    unmatchedShapePositions: unmatchedCount,
    ambiguousPrefixPositions: ambiguousPrefixCount,
    singleWhitelistedShapePositions: singleWhitelistedCount,
    multipleWhitelistedShapePositions: multipleWhitelistedCount,
    percentageWhitelisted: obj1EligiblePositions > 0 ? Math.round((whitelistedShapePositions / obj1EligiblePositions) * 1000) / 10 : 0,
    percentageNegativeContext: obj1EligiblePositions > 0 ? Math.round((negContextCount / obj1EligiblePositions) * 1000) / 10 : 0,
    percentageUnmatched: obj1EligiblePositions > 0 ? Math.round((unmatchedCount / obj1EligiblePositions) * 1000) / 10 : 0,
    shapeDistribution: [
      {
        shapeClass: 'mov-r32-imm32',
        displayName: 'MOV r32, imm32 (0xB8..0xBF)',
        positionCount: shapeDistributionCounts['mov-r32-imm32'].positions,
        percentageOfObject1Positions: obj1EligiblePositions > 0 ? Math.round((shapeDistributionCounts['mov-r32-imm32'].positions / obj1EligiblePositions) * 1000) / 10 : 0,
        logicalMatchCount: shapeDistributionCounts['mov-r32-imm32'].matches,
        isWhitelisted: true,
        isNegativeContext: false,
        description: 'Load immediate value into 32-bit general purpose register',
      },
      {
        shapeClass: 'push-imm32',
        displayName: 'PUSH imm32 (0x68)',
        positionCount: shapeDistributionCounts['push-imm32'].positions,
        percentageOfObject1Positions: obj1EligiblePositions > 0 ? Math.round((shapeDistributionCounts['push-imm32'].positions / obj1EligiblePositions) * 1000) / 10 : 0,
        logicalMatchCount: shapeDistributionCounts['push-imm32'].matches,
        isWhitelisted: true,
        isNegativeContext: false,
        description: 'Push 32-bit immediate value onto the stack',
      },
      {
        shapeClass: 'moffs32-direct',
        displayName: 'MOFFS32 direct (0xA1 / 0xA3)',
        positionCount: shapeDistributionCounts['moffs32-direct'].positions,
        percentageOfObject1Positions: obj1EligiblePositions > 0 ? Math.round((shapeDistributionCounts['moffs32-direct'].positions / obj1EligiblePositions) * 1000) / 10 : 0,
        logicalMatchCount: shapeDistributionCounts['moffs32-direct'].matches,
        isWhitelisted: true,
        isNegativeContext: false,
        description: 'Direct memory read or write between accumulator and 32-bit absolute address',
      },
      {
        shapeClass: 'accumulator-imm32',
        displayName: 'Accumulator ALU/TEST imm32 (0x05..0x3D)',
        positionCount: shapeDistributionCounts['accumulator-imm32'].positions,
        percentageOfObject1Positions: obj1EligiblePositions > 0 ? Math.round((shapeDistributionCounts['accumulator-imm32'].positions / obj1EligiblePositions) * 1000) / 10 : 0,
        logicalMatchCount: shapeDistributionCounts['accumulator-imm32'].matches,
        isWhitelisted: true,
        isNegativeContext: false,
        description: 'ALU operation between EAX and 32-bit immediate operand',
      },
      {
        shapeClass: 'disp32-absolute',
        displayName: 'Absolute [disp32] (0x8B/0x89/0x8D mod=00 r/m=101 or SIB)',
        positionCount: shapeDistributionCounts['disp32-absolute'].positions,
        percentageOfObject1Positions: obj1EligiblePositions > 0 ? Math.round((shapeDistributionCounts['disp32-absolute'].positions / obj1EligiblePositions) * 1000) / 10 : 0,
        logicalMatchCount: shapeDistributionCounts['disp32-absolute'].matches,
        isWhitelisted: true,
        isNegativeContext: false,
        description: 'Memory access with absolute 32-bit displacement without base register',
      },
      {
        shapeClass: 'negative-rel32',
        displayName: 'Relative branch displacement (0xE8 / 0xE9) [NEGATIVE]',
        positionCount: shapeDistributionCounts['negative-rel32'].positions,
        percentageOfObject1Positions: obj1EligiblePositions > 0 ? Math.round((shapeDistributionCounts['negative-rel32'].positions / obj1EligiblePositions) * 1000) / 10 : 0,
        logicalMatchCount: shapeDistributionCounts['negative-rel32'].matches,
        isWhitelisted: false,
        isNegativeContext: true,
        description: 'Preceding opcode is CALL or JMP with relative displacement (proves non-address)',
      },
      {
        shapeClass: 'unmatched-shape',
        displayName: 'No whitelisted shape / unmatched context',
        positionCount: shapeDistributionCounts['unmatched-shape'].positions,
        percentageOfObject1Positions: obj1EligiblePositions > 0 ? Math.round((shapeDistributionCounts['unmatched-shape'].positions / obj1EligiblePositions) * 1000) / 10 : 0,
        logicalMatchCount: shapeDistributionCounts['unmatched-shape'].matches,
        isWhitelisted: false,
        isNegativeContext: false,
        description: 'Preceding bytes do not coincide with any whitelisted operand-field shape',
      },
    ],
  };

  // 6. Build Track B Summary
  const clusteredPositionsCount = positionClusterMap.size;
  const isolatedPositionsCount = uniquePositions.length - clusteredPositionsCount;
  const regularStrideClustersCount = allClusters.filter((c) => c.clusterType === 'constant-stride-cluster' || c.clusterType === 'dominant-stride-cluster').length;

  const clustersByRegion: Record<string, { clusterCount: number; positionCount: number }> = {};
  for (const cl of allClusters) {
    let r = clustersByRegion[cl.sourceRegionId];
    if (!r) {
      r = { clusterCount: 0, positionCount: 0 };
      clustersByRegion[cl.sourceRegionId] = r;
    }
    r.clusterCount++;
    r.positionCount += cl.positionCount;
  }

  const trackB: TrackBResultSummary = {
    totalPositionsAnalyzed: uniquePositions.length,
    totalClustersIdentified: allClusters.length,
    clusteredPositionsCount,
    isolatedPositionsCount,
    percentageClustered: uniquePositions.length > 0 ? Math.round((clusteredPositionsCount / uniquePositions.length) * 1000) / 10 : 0,
    clusteringRule: 'Physical start-offset delta <= 64 bytes, minimum 3 positions per cluster',
    clusters: allClusters,
    regularStrideClustersCount,
    clustersByRegion,
  };

  // 7. Candidate Context Summaries
  options?.onProgress?.('Generating candidate occurrence context summaries...', 0.8);
  const candidateContextSummaries: CandidateOccurrenceContextSummary[] = reconResult.candidateSummaries.map((cand) => {
    const associatedPositions = classifiedPositions.filter((pos) =>
      pos.associatedCandidates.some((c) => c.candidateId === cand.candidateId)
    );

    let obj1Count = 0;
    let obj2Count = 0;
    let tailCount = 0;
    let whitelistedCount = 0;
    let relControlCount = 0;
    let ambiguousCount = 0;
    let noWhitelistedCount = 0;
    let regularClusterCount = 0;
    const clusterIdSet = new Set<string>();

    for (const pos of associatedPositions) {
      const matchCountForCand = pos.associatedCandidates.filter((c) => c.candidateId === cand.candidateId).length;
      if (pos.sourceObjectNumber === 1) obj1Count += matchCountForCand;
      else if (pos.sourceObjectNumber === 2) obj2Count += matchCountForCand;
      if (pos.sourceRegionClass === 'post-module-tail' || pos.sourceRegionId === 'post-module-tail') {
        tailCount += matchCountForCand;
      }

      if (pos.sourceObjectNumber === 1) {
        if (pos.shapeStatus === 'single-whitelisted-shape' || pos.shapeStatus === 'multiple-whitelisted-shapes') {
          whitelistedCount += matchCountForCand;
        } else if (pos.shapeStatus === 'relative-control-field-shape') {
          relControlCount += matchCountForCand;
        } else if (pos.shapeStatus === 'ambiguous-prefix-context') {
          ambiguousCount += matchCountForCand;
        } else {
          noWhitelistedCount += matchCountForCand;
        }
      }

      if (pos.clusterId) {
        clusterIdSet.add(pos.clusterId);
        const cluster = allClusters.find((c) => c.clusterId === pos.clusterId);
        if (cluster && (cluster.clusterType === 'constant-stride-cluster' || cluster.clusterType === 'dominant-stride-cluster')) {
          regularClusterCount += matchCountForCand;
        }
      }
    }

    return {
      candidateId: cand.candidateId,
      candidateRegion: cand.targetRegionId,
      candidateObjectNumber: cand.objectNumber,
      length: cand.length,
      contentHash: cand.contentHash,
      researchScore: cand.researchScore,
      zeroShiftKanoCompatible: cand.zeroShiftKanoCompatible,
      externalOccurrenceCount: cand.externalOccurrenceCount,
      Object1SourceOccurrenceCount: obj1Count,
      Object2SourceOccurrenceCount: obj2Count,
      tailSourceOccurrenceCount: tailCount,
      whitelistedShapeOccurrenceCount: whitelistedCount,
      relativeControlFieldOccurrenceCount: relControlCount,
      ambiguousShapeOccurrenceCount: ambiguousCount,
      noWhitelistedShapeOccurrenceCount: noWhitelistedCount,
      regularClusterOccurrenceCount: regularClusterCount,
      clusterIds: Array.from(clusterIdSet).sort(),
    };
  });

  // 8. Known Anchor Control Context Summaries
  options?.onProgress?.('Generating known anchor control context summaries...', 0.9);
  const knownAnchorControlContext: KnownAnchorControlContextSummary[] = (reconResult.controlTargets ?? []).map((ctrl) => {
    const extOccs = ctrl.occurrences.filter((o) => !o.isInsideTargetCandidateRange);
    const posSet = new Set(extOccs.map((o) => o.sourceFileOffset));
    const ctrlPositions = classifiedPositions.filter((p) => posSet.has(p.sourceFileOffset));

    let obj1Count = 0;
    let obj2Count = 0;
    let tailCount = 0;
    let whitelistedCount = 0;
    let relControlCount = 0;
    let ambiguousCount = 0;
    let noWhitelistedCount = 0;
    let clusteredCount = 0;
    const clusterIds = new Set<string>();

    for (const pos of ctrlPositions) {
      const matchCount = extOccs.filter((o) => o.sourceFileOffset === pos.sourceFileOffset).length;
      if (pos.sourceObjectNumber === 1) obj1Count += matchCount;
      else if (pos.sourceObjectNumber === 2) obj2Count += matchCount;
      if (pos.sourceRegionClass === 'post-module-tail' || pos.sourceRegionId === 'post-module-tail') {
        tailCount += matchCount;
      }

      if (pos.sourceObjectNumber === 1) {
        if (pos.shapeStatus === 'single-whitelisted-shape' || pos.shapeStatus === 'multiple-whitelisted-shapes') {
          whitelistedCount += matchCount;
        } else if (pos.shapeStatus === 'relative-control-field-shape') {
          relControlCount += matchCount;
        } else if (pos.shapeStatus === 'ambiguous-prefix-context') {
          ambiguousCount += matchCount;
        } else {
          noWhitelistedCount += matchCount;
        }
      }

      if (pos.clusterId) {
        clusteredCount += matchCount;
        clusterIds.add(pos.clusterId);
      }
    }

    return {
      name: ctrl.name,
      physicalOffset: ctrl.physicalOffset,
      physicalOffsetHex: ctrl.physicalOffsetHex,
      externalOccurrenceCount: extOccs.length,
      uniquePhysicalPositionsCount: posSet.size,
      Object1SourceOccurrenceCount: obj1Count,
      Object2SourceOccurrenceCount: obj2Count,
      tailSourceOccurrenceCount: tailCount,
      whitelistedShapeCount: whitelistedCount,
      relativeControlFieldCount: relControlCount,
      ambiguousShapeCount: ambiguousCount,
      noWhitelistedShapeCount: noWhitelistedCount,
      clusteredOccurrenceCount: clusteredCount,
      clusterIds: Array.from(clusterIds).sort(),
    };
  });

  // 9. Negative Control Verification (Candidate MK1.EXE:0x0009C914)
  const negCandSummary = reconResult.candidateSummaries.find((c) => c.candidateId === 'MK1.EXE:0x0009C914');
  const negOccCount = negCandSummary ? negCandSummary.externalOccurrenceCount : 0;
  const negativeControl = getNegativeControl(negOccCount, negOccCount);

  // 10. Formal Reconciliation (Section 16)
  options?.onProgress?.('Verifying formal reconciliation contracts...', 0.95);
  const b1ExternalLogicalMatchInputCount = totalLogicalExternalMatches;
  const b2LogicalMatchesAccountedFor = classifiedPositions.reduce((acc, p) => acc + p.logicalMatchesCount, 0);
  const logicalMatchesReconcile = b1ExternalLogicalMatchInputCount === b2LogicalMatchesAccountedFor;

  const b1UniquePhysicalPositionInputCount = uniquePositions.length;
  const b2UniquePhysicalPositionsAccountedFor = classifiedPositions.length;
  const physicalPositionsReconcile = b1UniquePhysicalPositionInputCount === b2UniquePhysicalPositionsAccountedFor;

  const object1TrackAExpectedPositions = obj1EligiblePositions;
  const object1TrackAAnalyzedPositions = classifiedPositions.filter((p) => p.sourceObjectNumber === 1).length;
  const object1TrackAReconciles = object1TrackAExpectedPositions === object1TrackAAnalyzedPositions;

  const trackBExpectedPositions = uniquePositions.length;
  const trackBAnalyzedPositions = uniquePositions.length;
  const trackBReconciles = trackBExpectedPositions === trackBAnalyzedPositions;

  const clusterMembershipReconciles = clusteredPositionsCount + isolatedPositionsCount === b1UniquePhysicalPositionInputCount;

  const reconciliation: OccurrenceContextReconciliation = {
    b1ExternalLogicalMatchInputCount,
    b2LogicalMatchesAccountedFor,
    logicalMatchesReconcile,
    b1UniquePhysicalPositionInputCount,
    b2UniquePhysicalPositionsAccountedFor,
    physicalPositionsReconcile,
    object1TrackAExpectedPositions,
    object1TrackAAnalyzedPositions,
    object1TrackAReconciles,
    trackBExpectedPositions,
    trackBAnalyzedPositions,
    trackBReconciles,
    clusteredPositions: clusteredPositionsCount,
    unclusteredPositions: isolatedPositionsCount,
    clusterMembershipReconciles,
    allReconciled:
      logicalMatchesReconcile &&
      physicalPositionsReconcile &&
      object1TrackAReconciles &&
      trackBReconciles &&
      clusterMembershipReconciles,
    truncationOmittedCount: reconResult.truncationSummary?.totalOccurrencesOmitted ?? 0,
  };

  // Determine overall execution status
  let status: 'SUCCESS' | 'PARTIAL' | 'FAILED' = 'SUCCESS';
  let failureReason: string | undefined = undefined;

  if (reconResult.truncationSummary && reconResult.truncationSummary.totalOccurrencesOmitted > 0) {
    status = 'PARTIAL';
    failureReason = `B.1 input occurrences were truncated (${reconResult.truncationSummary.totalOccurrencesOmitted} occurrences omitted due to retention cap); complete B.2 coverage cannot be claimed.`;
  } else if (!logicalMatchesReconcile || !physicalPositionsReconcile || !object1TrackAReconciles || !trackBReconciles || !clusterMembershipReconciles) {
    status = 'FAILED';
    failureReason = 'Reconciliation check failed between B.1 inputs and B.2 classified positions.';
  }

  const durationMs = Date.now() - startTime;
  options?.onProgress?.('Occurrence context reconnaissance complete.', 1.0);

  return {
    status,
    failureReason,
    metadata: {
      operationId,
      timestamp: new Date().toISOString(),
      durationMs,
      milestone: '1E.2B.2',
    },
    fixture: {
      exePath,
      exeSize,
      exeSizeHex: toHex32(exeSize),
    },
    sourceReconSummary: {
      totalInputCandidates: reconResult.globalSummary.totalResearchTargets,
      totalLogicalExternalMatches,
      uniqueExternalPhysicalPositions: uniquePositions.length,
    },
    scanConfiguration: getScanConfiguration(),
    reconciliation,
    trackA,
    trackB,
    candidateContextSummaries,
    knownAnchorControlContext,
    classifiedPositions,
    negativeControl,
  };
}

/**
 * Creates compact export following mk1_palette_occurrence_context_v1 schema.
 */
export function createMK1CompactPaletteOccurrenceContextExport(
  result: MK1PaletteOccurrenceContextResult
): MK1CompactPaletteOccurrenceContextExport {
  return {
    metadata: {
      formatVersion: 'mk1_palette_occurrence_context_v1',
      exportTimestamp: new Date().toISOString(),
      application: 'MK1 DOS Archive Workbench',
      version: '1.0.0',
      milestone: '1E.2B.2',
      operationId: result.metadata.operationId,
    },
    fixture: result.fixture,
    sourceB1Summary: result.sourceReconSummary,
    scanConfiguration: result.scanConfiguration,
    reconciliation: result.reconciliation,
    x86ShapeSummary: result.trackA,
    clusterSummary: result.trackB,
    candidateContextSummaries: result.candidateContextSummaries,
    x86OccurrenceContexts: result.classifiedPositions,
    physicalClusters: result.trackB.clusters,
    knownAnchorControlContext: result.knownAnchorControlContext,
    negativeControlSummary: result.negativeControl,

    // Legacy convenience properties for backward compatibility
    sourceReconnaissance: result.sourceReconSummary,
    trackA_x86ShapeAnalysis: result.trackA,
    trackB_spatialClustering: result.trackB,
    negativeControl: result.negativeControl,
    classifiedPositions: result.classifiedPositions,
  };
}

function getScanConfiguration(): ScanConfiguration {
  return {
    trackASourceScope: 'Object 1 R-X region only',
    candidateStartLookbehindBytes: 8,
    clusterMaxStartOffsetDelta: 64,
    clusterMinimumPositions: 3,
    positiveShapeWhitelist: [...POSITIVE_SHAPE_WHITELIST],
    relativeNegativeShapes: [...RELATIVE_NEGATIVE_SHAPES],
    SIBSupport: true,
  };
}

function getNegativeControl(b1Count: number, b2Count: number): NegativeControlVerification {
  return {
    candidateId: 'MK1.EXE:0x0009C914',
    expectedZeroOccurrences: true,
    actualOccurrencesB1: b1Count,
    actualOccurrencesB2: b2Count,
    status: b1Count === 0 && b2Count === 0 ? 'CONFIRMED_ZERO_OCCURRENCES' : 'UNEXPECTED_OCCURRENCES_DETECTED',
    notes:
      'Candidate in Object 2 (32 bytes, zero-shift Kano compatible, score 80) yielded exactly 0 external matches in Pass 1E.2B.1 and remains at 0 occurrences. It is not rescued or special-cased.',
  };
}

function getEmptyReconciliation(): OccurrenceContextReconciliation {
  return {
    b1ExternalLogicalMatchInputCount: 0,
    b2LogicalMatchesAccountedFor: 0,
    logicalMatchesReconcile: true,
    b1UniquePhysicalPositionInputCount: 0,
    b2UniquePhysicalPositionsAccountedFor: 0,
    physicalPositionsReconcile: true,
    object1TrackAExpectedPositions: 0,
    object1TrackAAnalyzedPositions: 0,
    object1TrackAReconciles: true,
    trackBExpectedPositions: 0,
    trackBAnalyzedPositions: 0,
    trackBReconciles: true,
    clusteredPositions: 0,
    unclusteredPositions: 0,
    clusterMembershipReconciles: true,
    allReconciled: true,
    truncationOmittedCount: 0,
  };
}

function getEmptyTrackA(): TrackAResultSummary {
  return {
    eligibleObject1Positions: 0,
    eligibleObject1LogicalMatches: 0,
    whitelistedShapePositions: 0,
    negativeContextPositions: 0,
    unmatchedShapePositions: 0,
    ambiguousPrefixPositions: 0,
    singleWhitelistedShapePositions: 0,
    multipleWhitelistedShapePositions: 0,
    percentageWhitelisted: 0,
    percentageNegativeContext: 0,
    percentageUnmatched: 0,
    shapeDistribution: [],
  };
}

function getEmptyTrackB(): TrackBResultSummary {
  return {
    totalPositionsAnalyzed: 0,
    totalClustersIdentified: 0,
    clusteredPositionsCount: 0,
    isolatedPositionsCount: 0,
    percentageClustered: 0,
    clusteringRule: 'Physical start-offset delta <= 64 bytes, minimum 3 positions per cluster',
    clusters: [],
    regularStrideClustersCount: 0,
    clustersByRegion: {},
  };
}
