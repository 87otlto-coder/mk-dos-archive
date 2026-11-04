import { describe, expect, it } from 'vitest';
import {
  ALU_OPCODE_NAMES,
  APPROVED_ACCUMULATOR_OPCODES,
  classifyX86OperandShape,
  clusterRegionPositions,
  createMK1CompactPaletteOccurrenceContextExport,
  NEGATIVE_CONTROL_CANDIDATE_ID,
  performPaletteOccurrenceContextReconnaissance,
  POSITIVE_SHAPE_WHITELIST,
} from '../games/mk1/research/paletteOccurrenceContext';
import { MemoryDirectorySource } from '../core/filesystem/DirectorySource';
import {
  CandidateReferenceSummary,
  ExactValueOccurrence,
  MK1PaletteReferenceReconResult,
  PaletteRepresentationDescriptor,
  PaletteRepresentationKind,
  RepresentationKindSummary,
  SourceTargetRegionMatrixCell,
  TargetRegionSummary,
} from '../games/mk1/research/paletteReferenceReconnaissanceTypes';

describe('MK1 Palette Occurrence Context Reconnaissance (Pass 1E.2B.2)', () => {
  describe('Track A — x86 Operand Shape Classifier', () => {
    it('1 — correctly identifies MOV r32, imm32 (0xB8..0xBF at P-1)', () => {
      const buffer = new Uint8Array(16);
      buffer[3] = 0xb8; // MOV EAX, imm32
      buffer[4] = 0x14;
      buffer[5] = 0xc9;
      buffer[6] = 0x09;
      buffer[7] = 0x00; // 0x0009C914 at pos 4

      const resEax = classifyX86OperandShape(buffer, 4, 0x0009c914);
      expect(resEax.shapeClass).toBe('mov-r32-imm32');
      expect(resEax.isWhitelistedShape).toBe(true);
      expect(resEax.isNegativeContext).toBe(false);
      expect(resEax.mnemonicHint).toContain('MOV EAX, 0x0009C914');
      expect(resEax.instructionLength).toBe(5);

      // Test ESI (0xBE)
      buffer[3] = 0xbe;
      const resEsi = classifyX86OperandShape(buffer, 4, 0x0009c914);
      expect(resEsi.shapeClass).toBe('mov-r32-imm32');
      expect(resEsi.mnemonicHint).toContain('MOV ESI, 0x0009C914');

      // Test EDI (0xBF)
      buffer[3] = 0xbf;
      const resEdi = classifyX86OperandShape(buffer, 4, 0x0009c914);
      expect(resEdi.shapeClass).toBe('mov-r32-imm32');
      expect(resEdi.mnemonicHint).toContain('MOV EDI, 0x0009C914');
    });

    it('2 — correctly identifies PUSH imm32 (0x68 at P-1)', () => {
      const buffer = new Uint8Array(16);
      buffer[7] = 0x68; // PUSH imm32
      const res = classifyX86OperandShape(buffer, 8, 0x00051234);
      expect(res.shapeClass).toBe('push-imm32');
      expect(res.isWhitelistedShape).toBe(true);
      expect(res.isNegativeContext).toBe(false);
      expect(res.mnemonicHint).toBe('PUSH 0x00051234');
      expect(res.instructionLength).toBe(5);
    });

    it('3 — correctly identifies MOFFS32 direct accumulator operations (0xA1/0xA3 at P-1)', () => {
      const buffer = new Uint8Array(16);
      buffer[3] = 0xa1; // MOV EAX, [moffs32]
      const resA1 = classifyX86OperandShape(buffer, 4, 0x00062000);
      expect(resA1.shapeClass).toBe('moffs32-direct');
      expect(resA1.isWhitelistedShape).toBe(true);
      expect(resA1.mnemonicHint).toBe('MOV EAX, [0x00062000]');

      buffer[3] = 0xa3; // MOV [moffs32], EAX
      const resA3 = classifyX86OperandShape(buffer, 4, 0x00062000);
      expect(resA3.shapeClass).toBe('moffs32-direct');
      expect(resA3.isWhitelistedShape).toBe(true);
      expect(resA3.mnemonicHint).toBe('MOV [0x00062000], EAX');
    });

    it('4 — correctly identifies accumulator immediate ALU operations (0x05, 0x25, 0x3D)', () => {
      const buffer = new Uint8Array(16);
      buffer[3] = 0x05; // ADD EAX, imm32
      expect(classifyX86OperandShape(buffer, 4, 0x1000).mnemonicHint).toBe('ADD EAX, 0x00001000');

      buffer[3] = 0x25; // AND EAX, imm32
      expect(classifyX86OperandShape(buffer, 4, 0x1000).mnemonicHint).toBe('AND EAX, 0x00001000');

      buffer[3] = 0x3d; // CMP EAX, imm32
      expect(classifyX86OperandShape(buffer, 4, 0x1000).mnemonicHint).toBe('CMP EAX, 0x00001000');

      // Reject unapproved 0xA9 (TEST EAX, imm32) - MUST NOT be whitelisted in B.2
      buffer[3] = 0xa9;
      const resA9 = classifyX86OperandShape(buffer, 4, 0x1000);
      expect(resA9.isWhitelistedShape).toBe(false);
      expect(resA9.shapeClass).toBe('unmatched-shape');
    });

    it('5 — flags relative CALL (0xE8) and JMP (0xE9) as NEGATIVE CONTEXT', () => {
      const buffer = new Uint8Array(16);
      buffer[5] = 0xe8; // CALL rel32
      const resCall = classifyX86OperandShape(buffer, 6, 0x00078000);
      expect(resCall.shapeClass).toBe('negative-rel32');
      expect(resCall.isWhitelistedShape).toBe(false);
      expect(resCall.isNegativeContext).toBe(true);
      expect(resCall.explanation).toContain('relative branch displacement, NOT an absolute address');

      buffer[5] = 0xe9; // JMP rel32
      const resJmp = classifyX86OperandShape(buffer, 6, 0x00078000);
      expect(resJmp.shapeClass).toBe('negative-rel32');
      expect(resJmp.isWhitelistedShape).toBe(false);
      expect(resJmp.isNegativeContext).toBe(true);
    });

    it('6 — correctly identifies absolute [disp32] without SIB via ModR/M mod=00, r/m=101', () => {
      const buffer = new Uint8Array(16);
      // MOV EAX, [disp32]: opcode 0x8B, ModR/M 0x05 (mod=00, reg=000 EAX, r/m=101)
      buffer[2] = 0x8b;
      buffer[3] = 0x05;
      const resMov = classifyX86OperandShape(buffer, 4, 0x0008ca54);
      expect(resMov.shapeClass).toBe('disp32-absolute');
      expect(resMov.isWhitelistedShape).toBe(true);
      expect(resMov.mnemonicHint).toBe('MOV EAX, [0x0008CA54]');
      expect(resMov.instructionLength).toBe(6);

      // LEA EDX, [disp32]: opcode 0x8D, ModR/M 0x15 (mod=00, reg=010 EDX, r/m=101)
      buffer[2] = 0x8d;
      buffer[3] = 0x15;
      const resLea = classifyX86OperandShape(buffer, 4, 0x0008ca54);
      expect(resLea.shapeClass).toBe('disp32-absolute');
      expect(resLea.mnemonicHint).toBe('LEA EDX, [0x0008CA54]');

      // MOV [disp32], ECX: opcode 0x89, ModR/M 0x0D (mod=00, reg=001 ECX, r/m=101)
      buffer[2] = 0x89;
      buffer[3] = 0x0d;
      const resMovStore = classifyX86OperandShape(buffer, 4, 0x0008ca54);
      expect(resMovStore.shapeClass).toBe('disp32-absolute');
      expect(resMovStore.mnemonicHint).toBe('MOV [0x0008CA54], ECX');
    });

    it('7 — correctly identifies narrow SIB absolute [disp32] for approved opcodes (0x8B, 0x89, 0x8D)', () => {
      const buffer = new Uint8Array(16);
      // MOV EAX, [disp32]: opcode 0x8B, ModR/M 0x04 (mod=00, reg=000, rm=100 SIB), SIB 0x85 (scale=10, index=000, base=101 disp32)
      buffer[1] = 0x8b;
      buffer[2] = 0x04;
      buffer[3] = 0x85;
      const resSib = classifyX86OperandShape(buffer, 4, 0x00054321);
      expect(resSib.shapeClass).toBe('disp32-absolute');
      expect(resSib.isWhitelistedShape).toBe(true);
      expect(resSib.mnemonicHint).toBe('MOV EAX, [0x00054321]');
      expect(resSib.instructionLength).toBe(7);

      // Reject non-whitelisted opcode with ModR/M+SIB (e.g. 0x03 ADD)
      buffer[1] = 0x03;
      buffer[2] = 0x04;
      buffer[3] = 0x85;
      const resReject = classifyX86OperandShape(buffer, 4, 0x00054321);
      expect(resReject.isWhitelistedShape).toBe(false);
      expect(resReject.shapeClass).toBe('unmatched-shape');
    });

    it('8 — correctly detects multiple candidate shapes and reports multiple-whitelisted-shapes', () => {
      const buffer = new Uint8Array(16);
      // At P-2: 0x8B, at P-1: 0x05
      // S = P-2: 0x8B 0x05 is MOV EAX, [disp32] (op 0x8B, ModR/M 0x05 mod=00 r/m=101)
      // S = P-1: 0x05 is ADD EAX, imm32 (op 0x05)
      buffer[2] = 0x8b;
      buffer[3] = 0x05;
      const res = classifyX86OperandShape(buffer, 4, 0x00050000);
      expect(res.shapeStatus).toBe('multiple-whitelisted-shapes');
      expect(res.matchingShapes.length).toBeGreaterThanOrEqual(2);
      expect(res.matchingShapes.some((s) => s.shapeClass === 'disp32-absolute')).toBe(true);
      expect(res.matchingShapes.some((s) => s.shapeClass === 'accumulator-imm32')).toBe(true);
    });

    it('9 — correctly handles 0x66 and 0x67 prefixes to reject or mark ambiguous', () => {
      const buffer = new Uint8Array(16);
      // 0x66 (operand size override) followed by 0xB8 (MOV AX, imm16)
      buffer[2] = 0x66;
      buffer[3] = 0xb8;
      const res66 = classifyX86OperandShape(buffer, 4, 0x00010000);
      expect(res66.isWhitelistedShape).toBe(false);
      expect(res66.shapeStatus).toBe('ambiguous-prefix-context');

      // 0x67 (address size override) followed by 0xA1 (MOV EAX, [moffs16])
      buffer[2] = 0x67;
      buffer[3] = 0xa1;
      const res67 = classifyX86OperandShape(buffer, 4, 0x00010000);
      expect(res67.isWhitelistedShape).toBe(false);
      expect(res67.shapeStatus).toBe('ambiguous-prefix-context');

      // Plain 0xB8 with no prefixes: strictly single-whitelisted-shape
      buffer[2] = 0x90; // NOP
      buffer[3] = 0xb8;
      const resPlain = classifyX86OperandShape(buffer, 4, 0x00010000);
      expect(resPlain.isWhitelistedShape).toBe(true);
      expect(resPlain.shapeStatus).toBe('single-whitelisted-shape');
    });

    it('10 — correctly handles unmatched byte context', () => {
      const buffer = new Uint8Array(16);
      buffer[3] = 0x90; // NOP
      buffer[4] = 0x90; // NOP
      const res = classifyX86OperandShape(buffer, 4, 0x12345678);
      expect(res.shapeClass).toBe('unmatched-shape');
      expect(res.isWhitelistedShape).toBe(false);
      expect(res.isNegativeContext).toBe(false);
    });
  });

  describe('Track B — Spatial Clustering', () => {
    it('11 — identifies contiguous 4-byte pointer array cluster (min 3 positions)', () => {
      const positions = [100, 104, 108];
      const { clusters, clusteredPositions } = clusterRegionPositions(
        positions,
        'obj2-data',
        'le-object-file-backed',
        2,
      );

      expect(clusters.length).toBe(1);
      expect(clusteredPositions.size).toBe(3);

      const c = clusters[0];
      expect(c.startOffset).toBe(100);
      expect(c.endOffset).toBe(112); // 108 + 4
      expect(c.byteSpan).toBe(12);
      expect(c.positionCount).toBe(3);
      expect(c.isRegularStride).toBe(true);
      expect(c.detectedStride).toBe(4);
      expect(c.strideDescription).toBe('Constant 4-byte start-offset stride');
      expect(c.consecutiveDeltas).toEqual([4, 4]);
      expect(c.interFieldGapBytes).toEqual([0, 0]);
      expect(c.densityPercentage).toBe(100);
    });

    it('12 — rejects groups with start-offset deltas exceeding 64 bytes ([100, 166, 232])', () => {
      // Delta from 100 to 166 is 66 > 64. Delta from 166 to 232 is 66 > 64.
      // Even though there are 3 positions, none have delta <= 64.
      const positions = [100, 166, 232];
      const { clusters, clusteredPositions } = clusterRegionPositions(
        positions,
        'obj2-data',
        'le-object-file-backed',
        2,
      );

      expect(clusters.length).toBe(0);
      expect(clusteredPositions.size).toBe(0);
    });

    it('13 — rejects groups with fewer than 3 positions as isolated', () => {
      const positions = [100, 104];
      const { clusters, clusteredPositions } = clusterRegionPositions(
        positions,
        'obj2-data',
        'le-object-file-backed',
        2,
      );

      expect(clusters.length).toBe(0);
      expect(clusteredPositions.size).toBe(0);
    });

    it('14 — splits clusters when start-offset delta exceeds 64 bytes', () => {
      // Cluster 1: 100, 110, 120 (deltas: 10, 10) -> 3 positions
      // Gap: 300 - 120 = 180 > 64 -> splits!
      // Cluster 2: 300, 308, 316 (deltas: 8, 8) -> 3 positions
      const positions = [100, 110, 120, 300, 308, 316];
      const { clusters, clusteredPositions } = clusterRegionPositions(
        positions,
        'post-module-tail',
        'post-module-tail',
        null,
      );

      expect(clusters.length).toBe(2);
      expect(clusteredPositions.size).toBe(6);
      expect(clusters[0].positionCount).toBe(3);
      expect(clusters[1].positionCount).toBe(3);
      expect(clusters[0].startOffset).toBe(100);
      expect(clusters[1].startOffset).toBe(300);
    });

    it('15 — correctly detects constant 6-byte, 8-byte, and 16-byte strides', () => {
      // 6-byte stride
      const c6 = clusterRegionPositions([100, 106, 112, 118], 'obj2-data', 'le-object-file-backed', 2).clusters[0];
      expect(c6.isRegularStride).toBe(true);
      expect(c6.detectedStride).toBe(6);
      expect(c6.strideDescription).toBe('Constant 6-byte start-offset stride');
      expect(c6.consecutiveDeltas).toEqual([6, 6, 6]);

      // 8-byte stride
      const c8 = clusterRegionPositions([100, 108, 116], 'obj2-data', 'le-object-file-backed', 2).clusters[0];
      expect(c8.isRegularStride).toBe(true);
      expect(c8.detectedStride).toBe(8);
      expect(c8.strideDescription).toBe('Constant 8-byte start-offset stride');
      expect(c8.consecutiveDeltas).toEqual([8, 8]);

      // 16-byte stride
      const c16 = clusterRegionPositions([100, 116, 132], 'obj2-data', 'le-object-file-backed', 2).clusters[0];
      expect(c16.isRegularStride).toBe(true);
      expect(c16.detectedStride).toBe(16);
      expect(c16.strideDescription).toBe('Constant 16-byte start-offset stride');
      expect(c16.consecutiveDeltas).toEqual([16, 16]);
    });

    it('16 — correctly classifies dominant / mixed stride with neutral structural description', () => {
      // Deltas: 8, 8, 12 -> dominant 8 (2 of 3)
      const cMix = clusterRegionPositions([100, 108, 116, 128], 'obj2-data', 'le-object-file-backed', 2).clusters[0];
      expect(cMix.isRegularStride).toBe(false);
      expect(cMix.detectedStride).toBe(8);
      expect(cMix.strideDescription).toBe('Dominant 8-byte start-offset stride (2/3 deltas)');
      expect(cMix.consecutiveDeltas).toEqual([8, 8, 12]);
      expect(cMix.interFieldGapBytes).toEqual([4, 4, 8]);
    });

    it('17 — correctly handles overlapping occurrences with non-negative start deltas', () => {
      // Overlapping occurrences at 100, 101, 118:
      // Start deltas: 101 - 100 = 1, 118 - 101 = 17 (both > 0, delta <= 64)
      // Inter-field gaps: 101 - (100 + 4) = -3, 118 - (101 + 4) = 13
      const cOverlap = clusterRegionPositions([100, 101, 118], 'obj2-data', 'le-object-file-backed', 2).clusters[0];
      expect(cOverlap.positionCount).toBe(3);
      expect(cOverlap.consecutiveDeltas).toEqual([1, 17]);
      expect(cOverlap.interFieldGapBytes).toEqual([-3, 13]);
    });
  });

  describe('Full Pass 1E.2B.2 Pipeline Integration & Formal Reconciliation', () => {
    function createSafeCandidateSummary(
      candidateId: string,
      byteStart: number,
      externalMatches: number,
    ): CandidateReferenceSummary {
      const byteStartHex = '0x' + byteStart.toString(16).padStart(8, '0').toUpperCase();
      const byteEndHex = '0x' + (byteStart + 32).toString(16).padStart(8, '0').toUpperCase();

      return {
        candidateId,
        byteStart,
        byteStartHex,
        byteEnd: byteStart + 32,
        byteEndHex,
        targetRegionId: 'obj2-data',
        targetRegionClass: 'le-object-file-backed',
        objectNumber: 2,
        contentHash: 'a1b2c3d4',
        length: 32,
        researchScore: 80,
        zeroShiftKanoCompatible: true,
        representationKindsTested: [
          'physical-structure-start',
          'physical-payload-start',
          'object-relative-structure',
          'object-relative-payload',
          'linear-structure-address',
          'linear-payload-address',
        ],
        representations: {
          'physical-structure-start': {
            kind: 'physical-structure-start',
            status: 'generated',
            value: byteStart,
            valueHex: byteStartHex,
          },
          'physical-payload-start': {
            kind: 'physical-payload-start',
            status: 'not-applicable',
            value: null,
            valueHex: null,
          },
          'object-relative-structure': {
            kind: 'object-relative-structure',
            status: 'not-applicable',
            value: null,
            valueHex: null,
          },
          'object-relative-payload': {
            kind: 'object-relative-payload',
            status: 'not-applicable',
            value: null,
            valueHex: null,
          },
          'linear-structure-address': {
            kind: 'linear-structure-address',
            status: 'not-applicable',
            value: null,
            valueHex: null,
          },
          'linear-payload-address': {
            kind: 'linear-payload-address',
            status: 'not-applicable',
            value: null,
            valueHex: null,
          },
        },
        totalLogicalMatches: externalMatches,
        totalUniquePhysicalOccurrences: externalMatches,
        selfOccurrenceCount: 0,
        externalOccurrenceCount: externalMatches,
        externalByRepresentation: {
          'physical-structure-start': externalMatches,
          'physical-payload-start': 0,
          'object-relative-structure': 0,
          'object-relative-payload': 0,
          'linear-structure-address': 0,
          'linear-payload-address': 0,
        },
        externalBySourceRegion: { 'obj1-code': externalMatches },
        externalInObject1: externalMatches,
        externalInObject2: 0,
        externalInTail: 0,
        externalInPreLE: 0,
        externalInHeader: 0,
        detailsTruncated: false,
        firstOccurrenceOffsetHex: externalMatches > 0 ? byteStartHex : null,
        lastOccurrenceOffsetHex: externalMatches > 0 ? byteStartHex : null,
      };
    }

    function createSyntheticB1Result(
      externalOccurrences: Partial<ExactValueOccurrence>[],
      exeSize = 2000,
      exePath = 'MK1.EXE',
      omittedCount = 0,
    ): MK1PaletteReferenceReconResult {
      const fullOccurrences: ExactValueOccurrence[] = externalOccurrences.map((o, idx) => ({
        sourceFileOffset: o.sourceFileOffset ?? 100 + idx * 4,
        sourceFileOffsetHex: '0x' + (o.sourceFileOffset ?? 100 + idx * 4).toString(16).padStart(8, '0').toUpperCase(),
        matchedUint32Value: o.matchedUint32Value ?? 0x00050000,
        matchedUint32Hex: '0x' + (o.matchedUint32Value ?? 0x00050000).toString(16).padStart(8, '0').toUpperCase(),
        representationKind: o.representationKind ?? 'linear-structure-address',
        targetCandidateId: o.targetCandidateId ?? `cand-${idx}`,
        targetCandidateByteStart: o.targetCandidateByteStart ?? 500,
        targetCandidateByteStartHex: '0x000001F4',
        targetCandidateRegionId: 'obj2-data',
        targetCandidateRegionClass: 'le-object-file-backed',
        targetObjectNumber: 2,
        sourceRegionId: o.sourceRegionId ?? (o.sourceObjectNumber === 1 ? 'obj1-code' : 'obj2-data'),
        sourceRegionClass: 'le-object-file-backed',
        sourceObjectNumber: o.sourceObjectNumber ?? 1,
        sourceLoadedAddressHex: '0x00010000',
        sourceObjectOffsetHex: '0x00000000',
        alignmentMod4: 0,
        alignmentMod2: 0,
        alignmentTag: 'aligned4',
        isInsideTargetCandidateRange: false,
        isExactAtTargetCandidateStart: false,
        contextStartOffsetHex: '0x00000000',
        contextBytesHex: '00 00 00 00',
        matchIndexWithinContext: 0,
      }));

      const uniqueOffsets = new Set(fullOccurrences.map((o) => o.sourceFileOffset));

      const repSummaries: RepresentationKindSummary[] = [
        {
          representationKind: 'physical-structure-start',
          eligibleTargetCount: 2,
          targetsWithAnyExternalOccurrence: fullOccurrences.length > 0 ? 1 : 0,
          percentageWithAnyExternalOccurrence: fullOccurrences.length > 0 ? 50 : 0,
          totalExternalLogicalMatches: fullOccurrences.length,
          uniquePhysicalOccurrenceCount: uniqueOffsets.size,
          sourceRegionHistogram: { 'obj1-code': fullOccurrences.length },
        },
      ];

      const regionSummaries: TargetRegionSummary[] = [
        {
          regionId: 'obj2-data',
          regionClass: 'le-object-file-backed',
          candidateCount: 2,
          candidatesWithAnyExternalOccurrence: fullOccurrences.length > 0 ? 1 : 0,
          percentageWithAnyExternalOccurrence: fullOccurrences.length > 0 ? 50 : 0,
          totalExternalOccurrenceCount: fullOccurrences.length,
          sourceRegionDistribution: { 'obj1-code': fullOccurrences.length },
        },
      ];

      const matrixCell: SourceTargetRegionMatrixCell = {
        targetRegionId: 'obj2-data',
        sourceRegionId: 'obj1-code',
        externalOccurrenceCount: fullOccurrences.length,
      };

      return {
        status: 'SUCCESS',
        metadata: {
          operationId: 'synth-b1',
          timestamp: new Date().toISOString(),
          durationMs: 10,
        },
        fixture: {
          exePath,
          exeSize,
        },
        reconciliation: {
          researchTargetInputCount: 2,
          researchTargetsProcessed: 2,
          researchTargetsSkipped: 0,
          skipReasons: {},
          allTargetsAccountedFor: true,
        },
        globalSummary: {
          totalResearchTargets: 2,
          targetsWithExternalExactOccurrences: fullOccurrences.length > 0 ? 1 : 0,
          targetsWithNoExternalExactOccurrences: fullOccurrences.length > 0 ? 1 : 2,
          percentageTargetsWithExternalOccurrences: fullOccurrences.length > 0 ? 50 : 0,
          totalExternalLogicalMatches: fullOccurrences.length,
          uniqueExternalPhysicalOccurrencePositions: uniqueOffsets.size,
          totalSelfOccurrences: 0,
          candidatesWith0ExternalOccurrences: 1,
          candidatesWith1ExternalOccurrence: fullOccurrences.length === 1 ? 1 : 0,
          candidatesWith2To5ExternalOccurrences: fullOccurrences.length >= 2 ? 1 : 0,
          candidatesWith6To20ExternalOccurrences: 0,
          candidatesWithMoreThan20ExternalOccurrences: 0,
        },
        representationSummaries: repSummaries,
        targetRegionSummaries: regionSummaries,
        sourceTargetMatrix: [matrixCell],
        candidateSummaries: [
          createSafeCandidateSummary(NEGATIVE_CONTROL_CANDIDATE_ID, 641300, 0),
          createSafeCandidateSummary('cand-active', 500, fullOccurrences.length),
        ],
        contentHashSummary: {
          contentsWithReferencesAtMultiplePhysicalCopies: 0,
          contentsWhereOnlyOneCopyHasExternalOccurrences: 0,
          contentsWhereMultipleCopiesHaveExternalOccurrences: 0,
          contentsWithZeroExternalOccurrences: 1,
        },
        controlTargets: [],
        detailedOccurrences: fullOccurrences,
        truncationSummary: {
          capPerRepresentation: 128,
          totalCandidatesTruncated: 0,
          totalOccurrencesOmitted: omittedCount,
        },
      };
    }

    it('20 — executes context reconnaissance with complete formal reconciliation', async () => {
      const buffer = new Uint8Array(2000);
      // Offset 100: MOV EAX, imm32 (opcode 0xB8 at 99)
      buffer[99] = 0xb8;
      // Offset 104: PUSH imm32 (opcode 0x68 at 103)
      buffer[103] = 0x68;
      // Offset 108: CALL rel32 (opcode 0xE8 at 107 - negative context)
      buffer[107] = 0xe8;

      const source = new MemoryDirectorySource('Test');
      source.setFile('MK1.EXE', buffer);

      const b1Result = createSyntheticB1Result([
        { sourceFileOffset: 100, sourceObjectNumber: 1, matchedUint32Value: 0x00050000 },
        { sourceFileOffset: 104, sourceObjectNumber: 1, matchedUint32Value: 0x00050004 },
        { sourceFileOffset: 108, sourceObjectNumber: 1, matchedUint32Value: 0x00050008 },
      ]);

      const result = await performPaletteOccurrenceContextReconnaissance(source, b1Result, {
        exePath: 'MK1.EXE',
        exeSize: 2000,
      });

      expect(result.status).toBe('SUCCESS');
      expect(result.trackA.eligibleObject1Positions).toBe(3);
      expect(result.trackA.whitelistedShapePositions).toBe(2); // MOV + PUSH
      expect(result.trackA.negativeContextPositions).toBe(1); // CALL rel32
      expect(result.trackA.unmatchedShapePositions).toBe(0);

      // Track B clustering: 100, 104, 108 in obj1-code (start deltas = [4, 4] <= 64, count = 3)
      expect(result.trackB.totalClustersIdentified).toBe(1);
      expect(result.trackB.clusteredPositionsCount).toBe(3);
      expect(result.trackB.clusters[0].isRegularStride).toBe(true);
      expect(result.trackB.clusters[0].detectedStride).toBe(4);

      // Formal reconciliation checks
      expect(result.reconciliation.logicalMatchesReconcile).toBe(true);
      expect(result.reconciliation.physicalPositionsReconcile).toBe(true);
      expect(result.reconciliation.object1TrackAReconciles).toBe(true);
      expect(result.reconciliation.trackBReconciles).toBe(true);
      expect(result.reconciliation.clusterMembershipReconciles).toBe(true);
      expect(result.reconciliation.allReconciled).toBe(true);

      // Negative control
      expect(result.negativeControl.status).toBe('CONFIRMED_ZERO_OCCURRENCES');
      expect(result.negativeControl.actualOccurrencesB1).toBe(0);
      expect(result.negativeControl.actualOccurrencesB2).toBe(0);
    });

    it('21 — fails on fixture mismatch without mutating inputs', async () => {
      const buffer = new Uint8Array(2000);
      const source = new MemoryDirectorySource('Test');
      source.setFile('MK1.EXE', buffer);

      const b1Result = createSyntheticB1Result([], 2000, 'DIFFERENT.EXE');

      const result = await performPaletteOccurrenceContextReconnaissance(source, b1Result, {
        exePath: 'MK1.EXE',
        exeSize: 2000,
      });

      expect(result.status).toBe('FAILED');
      expect(result.failureReason).toContain('FIXTURE MISMATCH');
    });

    it('22 — reports PARTIAL status when B.1 input has omitted occurrences', async () => {
      const buffer = new Uint8Array(2000);
      buffer[99] = 0xb8;
      const source = new MemoryDirectorySource('Test');
      source.setFile('MK1.EXE', buffer);

      const b1Result = createSyntheticB1Result(
        [{ sourceFileOffset: 100, sourceObjectNumber: 1, matchedUint32Value: 0x00050000 }],
        2000,
        'MK1.EXE',
        15, // 15 occurrences omitted
      );

      const result = await performPaletteOccurrenceContextReconnaissance(source, b1Result, {
        exePath: 'MK1.EXE',
        exeSize: 2000,
      });

      expect(result.status).toBe('PARTIAL');
      expect(result.reconciliation.truncationOmittedCount).toBe(15);
    });

    it('23 — generates valid compact export conforming to mk1_palette_occurrence_context_v1 schema', async () => {
      const buffer = new Uint8Array(2000);
      buffer[99] = 0xbf; // MOV EDI, imm32
      const source = new MemoryDirectorySource('Test');
      source.setFile('MK1.EXE', buffer);

      const b1Result = createSyntheticB1Result([
        { sourceFileOffset: 100, sourceObjectNumber: 1, matchedUint32Value: 0x00050000 },
      ]);

      const result = await performPaletteOccurrenceContextReconnaissance(source, b1Result, {
        exePath: 'MK1.EXE',
        exeSize: 2000,
      });

      const exportObj = createMK1CompactPaletteOccurrenceContextExport(result);
      expect(exportObj.metadata.formatVersion).toBe('mk1_palette_occurrence_context_v1');
      expect(exportObj.metadata.milestone).toBe('1E.2B.2');
      expect(exportObj.reconciliation.allReconciled).toBe(true);
      expect(exportObj.trackA_x86ShapeAnalysis.whitelistedShapePositions).toBe(1);
      expect(exportObj.classifiedPositions.length).toBe(1);
      expect(exportObj.classifiedPositions[0].trackA_x86Shape?.mnemonicHint).toContain('MOV EDI');
    });

    it('24 — verifies single-source consistency between runtime classifier and exported scanConfiguration whitelist', async () => {
      const source = new MemoryDirectorySource('Test');
      source.setFile('MK1.EXE', new Uint8Array(2000));
      const b1Result = createSyntheticB1Result([]);

      const result = await performPaletteOccurrenceContextReconnaissance(source, b1Result, {
        exePath: 'MK1.EXE',
        exeSize: 2000,
      });

      // Exported whitelist matches single source of truth
      expect(result.scanConfiguration.positiveShapeWhitelist).toEqual([...POSITIVE_SHAPE_WHITELIST]);

      // ALU opcode names keys match exactly the approved accumulator opcodes list
      const runtimeAluKeys = Object.keys(ALU_OPCODE_NAMES).map(Number).sort((a, b) => a - b);
      const approvedKeys = [...APPROVED_ACCUMULATOR_OPCODES].sort((a, b) => a - b);
      expect(runtimeAluKeys).toEqual(approvedKeys);
      expect(runtimeAluKeys).toEqual([0x05, 0x0d, 0x15, 0x1d, 0x25, 0x2d, 0x35, 0x3d]);

      // Verify every approved opcode is accepted by runtime classifier
      for (const op of APPROVED_ACCUMULATOR_OPCODES) {
        const buf = new Uint8Array(16);
        buf[3] = op;
        const res = classifyX86OperandShape(buf, 4, 0x00010000);
        expect(res.isWhitelistedShape).toBe(true);
        expect(res.shapeClass).toBe('accumulator-imm32');
      }
    });

    it('25 — unapproved opcodes are not accepted merely because they precede a 4-byte value', () => {
      // Test several non-whitelisted opcodes at P-1:
      // 0xA9 (TEST EAX, imm32 - explicitly excluded from B.2)
      // 0x90 (NOP)
      // 0x01 (ADD r/m32, r32)
      // 0x39 (CMP r/m32, r32)
      // 0x81 (group 1 immediate)
      const unapprovedOpcodes = [0xa9, 0x90, 0x01, 0x39, 0x81, 0xcc, 0xff];

      for (const op of unapprovedOpcodes) {
        const buf = new Uint8Array(16);
        buf[3] = op;
        const res = classifyX86OperandShape(buf, 4, 0x00054321);
        expect(res.isWhitelistedShape).toBe(false);
        expect(res.shapeClass).not.toBe('accumulator-imm32');
      }
    });
  });
});
