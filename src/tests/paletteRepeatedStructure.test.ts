import { describe, expect, it } from 'vitest';
import {
  computeNormalizedContextConsensus,
  detectRepeatingDeltaMotif,
  compareRepeatedBlocks,
  deriveRepeatedTargetGroups,
  executePaletteRepeatedStructureReconnaissance,
  createMK1CompactPaletteRepeatedStructureReconExport,
  assignStructuralEvidenceFlags,
  NEGATIVE_CONTROL_CANDIDATE_ID,
  MAX_REPEATED_BLOCK_BYTES,
  createFailedResult,
  deriveNegativeControlSummary,
} from '../games/mk1/research/paletteRepeatedStructure';
import { MemoryDirectorySource } from '../core/filesystem/DirectorySource';
import { MK1ExecutableRegion } from '../games/mk1/research/executableRegionTopology';
import {
  ExactValueOccurrence,
  MK1PaletteReferenceReconResult,
  PaletteRepresentationKind,
  RepresentationKindSummary,
  TargetRegionSummary,
  SourceTargetRegionMatrixCell,
  CandidateReferenceSummary,
} from '../games/mk1/research/paletteReferenceReconnaissanceTypes';
import { performPaletteOccurrenceContextReconnaissance } from '../games/mk1/research/paletteOccurrenceContext';
import {
  getNegativeControlBadgeInfo,
  formatNegativeControlCount,
} from '../components/negativeControlUiHelper';

describe('MK1 Palette Repeated Structural Context Reconnaissance (Pass 1E.2B.3)', () => {
  describe('Track B — Repeating-Delta Motif Detection', () => {
    it('detects constant stride of 1 delta (motif length 1, 4 cycles)', () => {
      // Deltas: 16, 16, 16, 16 (5 positions with stride 16)
      const positions = [100, 116, 132, 148, 164];
      const deltas = [16, 16, 16, 16];
      const motif = detectRepeatingDeltaMotif(deltas, positions);

      expect(motif).not.toBeNull();
      expect(motif?.motifLength).toBe(1);
      expect(motif?.motifDeltas).toEqual([16]);
      expect(motif?.cycleSpan).toBe(16);
      expect(motif?.cycleCount).toBe(4);
      expect(motif?.isConstantStride).toBe(true);
      expect(motif?.coveragePercentage).toBe(100);
      expect(motif?.anchorPositionsHex).toEqual([
        '0x00000064',
        '0x00000074',
        '0x00000084',
        '0x00000094',
        '0x000000A4',
      ]);
    });

    it('detects multi-delta repeating motif (length 2, 3 cycles)', () => {
      // Deltas: 4, 12, 4, 12, 4, 12 (7 positions)
      const positions = [0x1000, 0x1004, 0x1010, 0x1014, 0x1020, 0x1024, 0x1030];
      const deltas = [4, 12, 4, 12, 4, 12];
      const motif = detectRepeatingDeltaMotif(deltas, positions);

      expect(motif).not.toBeNull();
      expect(motif?.motifLength).toBe(2);
      expect(motif?.motifDeltas).toEqual([4, 12]);
      expect(motif?.cycleSpan).toBe(16);
      expect(motif?.cycleCount).toBe(3);
      expect(motif?.isConstantStride).toBe(false);
      expect(motif?.coveragePercentage).toBe(100);
    });

    it('detects multi-delta repeating motif of length 3 (2 cycles)', () => {
      // Deltas: 4, 8, 16, 4, 8, 16
      const positions = [0x2000, 0x2004, 0x200c, 0x201c, 0x2020, 0x2028, 0x2038];
      const deltas = [4, 8, 16, 4, 8, 16];
      const motif = detectRepeatingDeltaMotif(deltas, positions);

      expect(motif).not.toBeNull();
      expect(motif?.motifLength).toBe(3);
      expect(motif?.motifDeltas).toEqual([4, 8, 16]);
      expect(motif?.cycleSpan).toBe(28);
      expect(motif?.cycleCount).toBe(2);
    });

    it('returns null when cycle count is less than 2', () => {
      // Deltas: 4, 12, 4 (only 1 full cycle of [4, 12] + partial)
      const positions = [100, 104, 116, 120];
      const deltas = [4, 12, 4];
      const motif = detectRepeatingDeltaMotif(deltas, positions);

      expect(motif).toBeNull();
    });

    it('returns null for irregular non-repeating deltas', () => {
      const positions = [100, 105, 122, 125, 154];
      const deltas = [5, 17, 3, 29];
      const motif = detectRepeatingDeltaMotif(deltas, positions);

      expect(motif).toBeNull();
    });
  });

  describe('Track A — Normalized Context Consensus (±32 bytes around match)', () => {
    it('masks 4-byte matching field and computes pairwise similarity and stable runs', () => {
      const exeBytes = new Uint8Array(512);

      for (let i = 0; i < 68; i++) {
        exeBytes[100 - 32 + i] = 0xaa;
        exeBytes[200 - 32 + i] = 0xaa;
      }
      exeBytes[100] = 0x11;
      exeBytes[101] = 0x22;
      exeBytes[102] = 0x33;
      exeBytes[103] = 0x44;

      exeBytes[200] = 0x55;
      exeBytes[201] = 0x66;
      exeBytes[202] = 0x77;
      exeBytes[203] = 0x88;

      const consensus = computeNormalizedContextConsensus(exeBytes, [100, 200], []);

      expect(consensus.similarity.meanPairwiseSimilarity).toBe(1.0);
      expect(consensus.similarity.minimumPairwiseSimilarity).toBe(1.0);
      expect(consensus.similarity.maximumPairwiseSimilarity).toBe(1.0);
      expect(consensus.stableBeforeRunLength).toBe(32);
      expect(consensus.stableAfterRunLength).toBe(32);
      expect(consensus.contextSignature).toContain('?? ?? ?? ??');
    });

    it('detects file boundary truncation when position is within 32 bytes of 0', () => {
      const exeBytes = new Uint8Array(256);
      const consensus = computeNormalizedContextConsensus(exeBytes, [16, 100], []);
      expect(consensus.contextTruncatedAtFileBoundary).toBe(true);
      expect(consensus.contextCrossesRegionBoundary).toBe(false);
    });

    it('detects region boundary crossing when position window spans multiple regions', () => {
      const exeBytes = new Uint8Array(256);
      const mockRegions: MK1ExecutableRegion[] = [
        {
          regionId: 'reg1',
          name: 'Region 1',
          regionClass: 'le-object-file-backed',
          fileStart: 0,
          fileEnd: 50,
          fileStartHex: '0x00000000',
          fileEndHex: '0x00000032',
          byteLength: 50,
          percentageOfFile: 19.5,
          objectNumber: 1,
          purpose: 'code',
          notes: '',
        },
        {
          regionId: 'reg2',
          name: 'Region 2',
          regionClass: 'le-object-file-backed',
          fileStart: 50,
          fileEnd: 256,
          fileStartHex: '0x00000032',
          fileEndHex: '0x00000100',
          byteLength: 206,
          percentageOfFile: 80.5,
          objectNumber: 2,
          purpose: 'data',
          notes: '',
        },
      ];
      // At position 40, window 40-32 = 8 to 40+36 = 76 spans across offset 50 (reg1 into reg2)
      const consensus = computeNormalizedContextConsensus(exeBytes, [40], mockRegions);
      expect(consensus.contextCrossesRegionBoundary).toBe(true);
    });
  });

  describe('Track C — Repeated-Block Comparison', () => {
    it('compares cycle blocks up to 256 bytes and evaluates slot stability', () => {
      const exeBytes = new Uint8Array(1024);
      const positions = [100, 116, 132]; // 2 cycles of span 16
      const deltas = [16, 16];
      const motif = detectRepeatingDeltaMotif(deltas, positions);
      expect(motif).not.toBeNull();

      for (let i = 0; i < 16; i++) {
        exeBytes[100 + i] = 0x42;
        exeBytes[116 + i] = 0x42;
      }

      const createMockOcc = (pos: number): ExactValueOccurrence => ({
        sourceFileOffset: pos,
        sourceFileOffsetHex: `0x${pos.toString(16)}`,
        matchedUint32Value: 0x12345678,
        matchedUint32Hex: '0x12345678',
        representationKind: 'linear-structure-address',
        targetCandidateId: 'CAND_1',
        targetCandidateByteStart: 0x5000,
        targetCandidateByteStartHex: '0x00005000',
        targetCandidateRegionId: 'obj1-rx',
        targetCandidateRegionClass: 'le-object-file-backed',
        targetObjectNumber: 1,
        sourceRegionId: 'obj1-rx',
        sourceRegionClass: 'le-object-file-backed',
        sourceObjectNumber: 1,
        sourceLoadedAddressHex: null,
        sourceObjectOffsetHex: null,
        alignmentMod4: 0,
        alignmentMod2: 0,
        alignmentTag: 'aligned4',
        isInsideTargetCandidateRange: false,
        isExactAtTargetCandidateStart: false,
        contextStartOffsetHex: '0x00000000',
        contextBytesHex: '00 00 00 00',
        matchIndexWithinContext: 0,
      });

      const logicalMap = new Map<number, ExactValueOccurrence[]>();
      logicalMap.set(100, [createMockOcc(100)]);
      logicalMap.set(116, [createMockOcc(116)]);

      const result = compareRepeatedBlocks(exeBytes, positions, motif, logicalMap, []);

      expect(result.performed).toBe(true);
      expect(result.blockLength).toBe(16);
      expect(result.blockCount).toBe(2);
      expect(result.consensus?.identicalBytePercentage).toBe(100);
      expect(result.slotStability.length).toBe(1);
      expect(result.slotStability[0].targetCandidateStable).toBe(true);
      expect(result.slotStability[0].distinctCandidateIds).toEqual(['CAND_1']);
    });

    it('computes context-only consensus excluding matched field bytes', () => {
      const exeBytes = new Uint8Array(1024);
      const positions = [100, 116, 132]; // 2 cycles of span 16
      const deltas = [16, 16];
      const motif = detectRepeatingDeltaMotif(deltas, positions);
      expect(motif).not.toBeNull();

      // Matched field is at offset 0 (bytes 0..3 of each 16B block).
      // Make matched field bytes identical in both blocks:
      for (let i = 0; i < 4; i++) {
        exeBytes[100 + i] = 0xAA;
        exeBytes[116 + i] = 0xAA;
      }
      // Out of the remaining 12 context bytes (4..15):
      // Make 6 identical and 6 different:
      for (let i = 4; i < 10; i++) {
        exeBytes[100 + i] = 0x55;
        exeBytes[116 + i] = 0x55;
      }
      for (let i = 10; i < 16; i++) {
        exeBytes[100 + i] = 0x10 + i;
        exeBytes[116 + i] = 0x20 + i;
      }

      const createMockOcc = (pos: number): ExactValueOccurrence => ({
        sourceFileOffset: pos,
        sourceFileOffsetHex: `0x${pos.toString(16)}`,
        matchedUint32Value: 0x12345678,
        matchedUint32Hex: '0x12345678',
        representationKind: 'linear-structure-address',
        targetCandidateId: 'CAND_1',
        targetCandidateByteStart: 0x5000,
        targetCandidateByteStartHex: '0x00005000',
        targetCandidateRegionId: 'obj1-rx',
        targetCandidateRegionClass: 'le-object-file-backed',
        targetObjectNumber: 1,
        sourceRegionId: 'obj1-rx',
        sourceRegionClass: 'le-object-file-backed',
        sourceObjectNumber: 1,
        sourceLoadedAddressHex: null,
        sourceObjectOffsetHex: null,
        alignmentMod4: 0,
        alignmentMod2: 0,
        alignmentTag: 'aligned4',
        isInsideTargetCandidateRange: false,
        isExactAtTargetCandidateStart: false,
        contextStartOffsetHex: '0x00000000',
        contextBytesHex: '00 00 00 00',
        matchIndexWithinContext: 0,
      });

      const logicalMap = new Map<number, ExactValueOccurrence[]>();
      logicalMap.set(100, [createMockOcc(100)]);
      logicalMap.set(116, [createMockOcc(116)]);

      const result = compareRepeatedBlocks(exeBytes, positions, motif, logicalMap, []);

      expect(result.performed).toBe(true);
      // Raw consensus includes matched field: 4 (matched) + 6 (identical context) = 10 / 16 = 62.5% -> rounded 63%
      expect(result.consensus?.identicalByteCount).toBe(10);
      // Context-only excludes the 4 matched field bytes: 6 identical / 12 comparable = 50%
      expect(result.contextOnlyConsensus?.performed).toBe(true);
      expect(result.contextOnlyConsensus?.excludedMatchedByteCount).toBe(4);
      expect(result.contextOnlyConsensus?.comparableContextByteCount).toBe(12);
      expect(result.contextOnlyConsensus?.identicalContextByteCount).toBe(6);
      expect(result.contextOnlyConsensus?.variableContextByteCount).toBe(6);
      expect(result.contextOnlyConsensus?.identicalContextBytePercentage).toBe(50);
    });

    it('rejects block comparison if cycleSpan exceeds MAX_REPEATED_BLOCK_BYTES (256)', () => {
      const exeBytes = new Uint8Array(2048);
      const fakeMotif = {
        motifLength: 1,
        motifDeltas: [300],
        cycleSpan: 300,
        cycleCount: 2,
        isConstantStride: true,
        startDeltaIndex: 0,
        endDeltaIndexExclusive: 2,
        coveredDeltaCount: 2,
        coveragePercentage: 100,
        anchorPositions: [100, 400],
        anchorPositionsHex: ['0x00000064', '0x00000190'],
      };

      const result = compareRepeatedBlocks(exeBytes, [100, 400, 700], fakeMotif, new Map(), []);
      expect(result.performed).toBe(false);
      expect(result.notPerformedReason).toContain('256 bytes');
    });
  });

  describe('Secondary Population — Repeated-Target Groups', () => {
    it('groups candidate occurrences with >= 3 positions', () => {
      const createGroupOcc = (pos: number, candId: string): ExactValueOccurrence => ({
        sourceFileOffset: pos,
        sourceFileOffsetHex: `0x${pos.toString(16)}`,
        matchedUint32Value: 0x1000,
        matchedUint32Hex: '0x00001000',
        representationKind: 'linear-structure-address',
        targetCandidateId: candId,
        targetCandidateByteStart: 0x1000,
        targetCandidateByteStartHex: '0x1000',
        targetCandidateRegionId: 'obj1-rx',
        targetCandidateRegionClass: 'le-object-file-backed',
        targetObjectNumber: 1,
        sourceRegionId: 'obj1-rx',
        sourceRegionClass: 'le-object-file-backed',
        sourceObjectNumber: 1,
        sourceLoadedAddressHex: null,
        sourceObjectOffsetHex: null,
        alignmentMod4: 0,
        alignmentMod2: 0,
        alignmentTag: 'aligned4',
        isInsideTargetCandidateRange: false,
        isExactAtTargetCandidateStart: false,
        contextStartOffsetHex: '0x00000000',
        contextBytesHex: '00 00 00 00',
        matchIndexWithinContext: 0,
      });

      const occurrences: ExactValueOccurrence[] = [
        createGroupOcc(100, 'CAND_A'),
        createGroupOcc(200, 'CAND_A'),
        createGroupOcc(300, 'CAND_A'),
        // CAND_B only has 2 occurrences -> should NOT be included
        createGroupOcc(400, 'CAND_B'),
        createGroupOcc(500, 'CAND_B'),
      ];

      const groups = deriveRepeatedTargetGroups(occurrences);
      expect(groups.size).toBe(1);
      const groupA = Array.from(groups.values())[0];
      expect(groupA.candidateId).toBe('CAND_A');
      expect(groupA.positions.size).toBe(3);
    });
  });

  describe('Full Pass 1E.2B.3 Engine Execution and Reconciliation', () => {
    it('executes repeated structural reconnaissance, reconciles 100% of clusters, and verifies negative control', async () => {
      const exeSize = 4096;
      const exeBuffer = new Uint8Array(exeSize);

      // Create synthetic clusters in EXE:
      // Cluster 1: stride 16 at 200, 216, 232, 248 with MOV EAX, imm32 opcode (0xB8) at p-1
      const cluster1Positions = [200, 216, 232, 248];
      for (const p of cluster1Positions) {
        exeBuffer[p - 1] = 0xb8; // MOV EAX, imm32
        exeBuffer[p] = 0x05;
        exeBuffer[p + 1] = 0x00;
        exeBuffer[p + 2] = 0x05;
        exeBuffer[p + 3] = 0x00;
      }

      // Cluster 2: irregular deltas at 500, 510, 530 with PUSH imm32 opcode (0x68) at p-1
      const cluster2Positions = [500, 510, 530];
      for (const p of cluster2Positions) {
        exeBuffer[p - 1] = 0x68; // PUSH imm32
        exeBuffer[p] = 0x20;
        exeBuffer[p + 1] = 0x00;
        exeBuffer[p + 2] = 0x05;
        exeBuffer[p + 3] = 0x00;
      }

      const createOcc = (p: number, candId: string, val: number): ExactValueOccurrence => ({
        sourceFileOffset: p,
        sourceFileOffsetHex: `0x${p.toString(16).padStart(8, '0').toUpperCase()}`,
        matchedUint32Value: val,
        matchedUint32Hex: `0x${val.toString(16).padStart(8, '0').toUpperCase()}`,
        representationKind: 'linear-structure-address',
        targetCandidateId: candId,
        targetCandidateByteStart: 0x1000,
        targetCandidateByteStartHex: '0x00001000',
        targetCandidateRegionId: 'obj2-data',
        targetCandidateRegionClass: 'le-object-file-backed',
        targetObjectNumber: 2,
        sourceRegionId: 'obj1-rx',
        sourceRegionClass: 'le-object-file-backed',
        sourceObjectNumber: 1,
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
      });

      const mockB1DetailedOccurrences: ExactValueOccurrence[] = [
        ...cluster1Positions.map((p) => createOcc(p, 'CAND_1', 0x00050005)),
        ...cluster2Positions.map((p) => createOcc(p, 'CAND_2', 0x00050020)),
      ];

      const repSummaries: RepresentationKindSummary[] = [
        {
          representationKind: 'linear-structure-address',
          eligibleTargetCount: 2,
          targetsWithAnyExternalOccurrence: 2,
          percentageWithAnyExternalOccurrence: 100,
          totalExternalLogicalMatches: mockB1DetailedOccurrences.length,
          uniquePhysicalOccurrenceCount: mockB1DetailedOccurrences.length,
          sourceRegionHistogram: { 'obj1-rx': mockB1DetailedOccurrences.length },
        },
      ];

      const regionSummaries: TargetRegionSummary[] = [
        {
          regionId: 'obj2-data',
          regionClass: 'le-object-file-backed',
          candidateCount: 2,
          candidatesWithAnyExternalOccurrence: 2,
          percentageWithAnyExternalOccurrence: 100,
          totalExternalOccurrenceCount: mockB1DetailedOccurrences.length,
          sourceRegionDistribution: { 'obj1-rx': mockB1DetailedOccurrences.length },
        },
      ];

      const matrixCell: SourceTargetRegionMatrixCell = {
        targetRegionId: 'obj2-data',
        sourceRegionId: 'obj1-rx',
        externalOccurrenceCount: mockB1DetailedOccurrences.length,
      };

      const mockB1Result: MK1PaletteReferenceReconResult = {
        status: 'SUCCESS',
        metadata: {
          operationId: 'test-op',
          timestamp: new Date().toISOString(),
          durationMs: 10,
        },
        fixture: {
          exePath: 'MK1.EXE',
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
          targetsWithExternalExactOccurrences: 2,
          targetsWithNoExternalExactOccurrences: 0,
          percentageTargetsWithExternalOccurrences: 100,
          totalExternalLogicalMatches: mockB1DetailedOccurrences.length,
          uniqueExternalPhysicalOccurrencePositions: mockB1DetailedOccurrences.length,
          totalSelfOccurrences: 0,
          candidatesWith0ExternalOccurrences: 0,
          candidatesWith1ExternalOccurrence: 0,
          candidatesWith2To5ExternalOccurrences: 2,
          candidatesWith6To20ExternalOccurrences: 0,
          candidatesWithMoreThan20ExternalOccurrences: 0,
        },
        representationSummaries: repSummaries,
        targetRegionSummaries: regionSummaries,
        sourceTargetMatrix: [matrixCell],
        candidateSummaries: [],
        contentHashSummary: {
          contentsWithReferencesAtMultiplePhysicalCopies: 0,
          contentsWhereOnlyOneCopyHasExternalOccurrences: 0,
          contentsWhereMultipleCopiesHaveExternalOccurrences: 0,
          contentsWithZeroExternalOccurrences: 0,
        },
        controlTargets: [],
        detailedOccurrences: mockB1DetailedOccurrences,
        truncationSummary: {
          capPerRepresentation: 100,
          totalCandidatesTruncated: 0,
          totalOccurrencesOmitted: 0,
        },
      };

      const source = new MemoryDirectorySource('Test');
      source.setFile('MK1.EXE', exeBuffer);

      // Perform genuine B.2 pass
      const b2Result = await performPaletteOccurrenceContextReconnaissance(source, mockB1Result, {
        exePath: 'MK1.EXE',
        exeSize,
      });

      expect(b2Result.status).toBe('SUCCESS');
      expect(b2Result.trackB.totalClustersIdentified).toBe(2);

      // Execute Pass 1E.2B.3
      const result = await executePaletteRepeatedStructureReconnaissance(
        source,
        mockB1Result,
        b2Result,
        null
      );

      // Verify status and reconciliation
      expect(result.status).toBe('SUCCESS');
      expect(result.reconciliation.allReconciled).toBe(true);
      expect(result.reconciliation.b2ClusterInputCount).toBe(2);
      expect(result.reconciliation.b3ClustersProcessed).toBe(2);
      expect(result.reconciliation.clusterPositionsReconcile).toBe(true);
      expect(result.clusterStructuralSummaries.length).toBe(2);

      // Verify Cluster 1 had a repeating delta motif of 16
      const c1Summary = result.clusterStructuralSummaries[0];
      expect(c1Summary).toBeDefined();
      expect(c1Summary?.primaryDeltaMotif?.isConstantStride).toBe(true);
      expect(c1Summary?.primaryDeltaMotif?.cycleSpan).toBe(16);
      expect(c1Summary?.structuralEvidenceFlags).toContain('has-constant-delta-motif');

      // Verify Cluster 2 had no repeating delta motif
      const c2Summary = result.clusterStructuralSummaries[1];
      expect(c2Summary).toBeDefined();
      expect(c2Summary?.primaryDeltaMotif).toBeNull();
      expect(c2Summary?.structuralEvidenceFlags).not.toContain('has-constant-delta-motif');
      expect(c2Summary?.structuralEvidenceFlags).not.toContain('has-multi-delta-repeating-motif');

      // Verify negative control
      expect(result.negativeControlSummary.candidateId).toBe(NEGATIVE_CONTROL_CANDIDATE_ID);
      expect(result.negativeControlSummary.B1OccurrenceCount).toBe(0);
      expect(result.negativeControlSummary.B2ContextCount).toBe(0);
      expect(result.negativeControlSummary.B3RepeatedContextStatus).toBe(
        'not-applicable-no-occurrences'
      );

      // Verify JSON export structure
      const exportJson = createMK1CompactPaletteRepeatedStructureReconExport(result);
      expect(exportJson.format).toBe('mk1_palette_repeated_structure_recon_v1');
      expect(exportJson.schemaVersion).toBe(1);
      expect(exportJson.metadata.milestone).toBe('1E.2B.3');
      expect(exportJson.clusterStructuralSummaries.length).toBe(2);
      expect(exportJson.reconciliation.allReconciled).toBe(true);
    });

    it('consumes b1Result.controlTargets as authoritative control input including Handle Table', async () => {
      const exeSize = 4096;
      const exeBuffer = new Uint8Array(exeSize);
      const source = new MemoryDirectorySource('Test');
      source.setFile('MK1.EXE', exeBuffer);

      const createOcc = (p: number): ExactValueOccurrence => ({
        sourceFileOffset: p,
        sourceFileOffsetHex: `0x${p.toString(16).padStart(8, '0').toUpperCase()}`,
        matchedUint32Value: 0x12345678,
        matchedUint32Hex: '0x12345678',
        representationKind: 'linear-structure-address',
        targetCandidateId: 'CAND_1',
        targetCandidateByteStart: 0x1000,
        targetCandidateByteStartHex: '0x00001000',
        targetCandidateRegionId: 'obj2-data',
        targetCandidateRegionClass: 'le-object-file-backed',
        targetObjectNumber: 2,
        sourceRegionId: 'obj1-rx',
        sourceRegionClass: 'le-object-file-backed',
        sourceObjectNumber: 1,
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
      });

      const positions = [100, 116, 132];
      const occs = positions.map(createOcc);

      const mockB1Result: MK1PaletteReferenceReconResult = {
        status: 'SUCCESS',
        metadata: { operationId: 'test-op', timestamp: new Date().toISOString(), durationMs: 1 },
        fixture: { exePath: 'MK1.EXE', exeSize },
        reconciliation: {
          researchTargetInputCount: 1,
          researchTargetsProcessed: 1,
          researchTargetsSkipped: 0,
          skipReasons: {},
          allTargetsAccountedFor: true,
        },
        globalSummary: {
          totalResearchTargets: 1,
          targetsWithExternalExactOccurrences: 1,
          targetsWithNoExternalExactOccurrences: 0,
          percentageTargetsWithExternalOccurrences: 100,
          totalExternalLogicalMatches: occs.length,
          uniqueExternalPhysicalOccurrencePositions: occs.length,
          totalSelfOccurrences: 0,
          candidatesWith0ExternalOccurrences: 0,
          candidatesWith1ExternalOccurrence: 0,
          candidatesWith2To5ExternalOccurrences: 1,
          candidatesWith6To20ExternalOccurrences: 0,
          candidatesWithMoreThan20ExternalOccurrences: 0,
        },
        representationSummaries: [],
        targetRegionSummaries: [],
        sourceTargetMatrix: [],
        candidateSummaries: [],
        contentHashSummary: {
          contentsWithReferencesAtMultiplePhysicalCopies: 0,
          contentsWhereOnlyOneCopyHasExternalOccurrences: 0,
          contentsWhereMultipleCopiesHaveExternalOccurrences: 0,
          contentsWithZeroExternalOccurrences: 0,
        },
        controlTargets: [
          {
            name: 'Handle Table Anchor',
            physicalOffset: 0x000b0c5c,
            physicalOffsetHex: '0x000B0C5C',
            representationsTested: [
              { name: 'linear-structure-address', value: 0x000b0c5c, valueHex: '0x000B0C5C' },
            ],
            totalLogicalMatches: 1,
            uniquePhysicalOccurrences: 1,
            externalOccurrences: 1,
            sourceRegionDistribution: { 'obj1-rx': 1 },
            occurrences: [
              {
                ...createOcc(100),
                matchedUint32Value: 0x000b0c5c,
                matchedUint32Hex: '0x000B0C5C',
              },
            ],
          },
        ],
        detailedOccurrences: occs,
        truncationSummary: { capPerRepresentation: 100, totalCandidatesTruncated: 0, totalOccurrencesOmitted: 0 },
      };

      const b2Result = await performPaletteOccurrenceContextReconnaissance(source, mockB1Result, {
        exePath: 'MK1.EXE',
        exeSize,
      });

      const result = await executePaletteRepeatedStructureReconnaissance(source, mockB1Result, b2Result, null);

      expect(result.status).toBe('SUCCESS');
      expect(result.knownAnchorControlSummary.length).toBe(1);
      const handleControl = result.knownAnchorControlSummary[0];
      expect(handleControl.name).toBe('Handle Table Anchor');
      expect(handleControl.physicalOffset).toBe(0x000b0c5c);
      expect(handleControl.B1UniquePhysicalOccurrences).toBe(1);
      expect(handleControl.externalOccurrencePositions).toContain(100);
      expect(handleControl.repeatedStructuralAnalysisStatus).toBe('not-applicable-insufficient-occurrences');
      expect(handleControl.repeatedStructuralResult).toBeNull();
    });

    it('fails with FAILED status if a B.2 cluster contains a position with no B.1 occurrence', async () => {
      const exeSize = 4096;
      const exeBuffer = new Uint8Array(exeSize);
      const source = new MemoryDirectorySource('Test');
      source.setFile('MK1.EXE', exeBuffer);

      const createOcc = (p: number): ExactValueOccurrence => ({
        sourceFileOffset: p,
        sourceFileOffsetHex: `0x${p.toString(16).padStart(8, '0').toUpperCase()}`,
        matchedUint32Value: 0x12345678,
        matchedUint32Hex: '0x12345678',
        representationKind: 'linear-structure-address',
        targetCandidateId: 'CAND_1',
        targetCandidateByteStart: 0x1000,
        targetCandidateByteStartHex: '0x00001000',
        targetCandidateRegionId: 'obj2-data',
        targetCandidateRegionClass: 'le-object-file-backed',
        targetObjectNumber: 2,
        sourceRegionId: 'obj1-rx',
        sourceRegionClass: 'le-object-file-backed',
        sourceObjectNumber: 1,
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
      });

      const positions = [100, 116, 132];
      const occs = positions.map(createOcc);

      const mockB1WithCluster: MK1PaletteReferenceReconResult = {
        status: 'SUCCESS',
        metadata: { operationId: 'test-op', timestamp: new Date().toISOString(), durationMs: 1 },
        fixture: { exePath: 'MK1.EXE', exeSize },
        reconciliation: {
          researchTargetInputCount: 1,
          researchTargetsProcessed: 1,
          researchTargetsSkipped: 0,
          skipReasons: {},
          allTargetsAccountedFor: true,
        },
        globalSummary: {
          totalResearchTargets: 1,
          targetsWithExternalExactOccurrences: 1,
          targetsWithNoExternalExactOccurrences: 0,
          percentageTargetsWithExternalOccurrences: 100,
          totalExternalLogicalMatches: occs.length,
          uniqueExternalPhysicalOccurrencePositions: occs.length,
          totalSelfOccurrences: 0,
          candidatesWith0ExternalOccurrences: 0,
          candidatesWith1ExternalOccurrence: 0,
          candidatesWith2To5ExternalOccurrences: 1,
          candidatesWith6To20ExternalOccurrences: 0,
          candidatesWithMoreThan20ExternalOccurrences: 0,
        },
        representationSummaries: [],
        targetRegionSummaries: [],
        sourceTargetMatrix: [],
        candidateSummaries: [],
        contentHashSummary: {
          contentsWithReferencesAtMultiplePhysicalCopies: 0,
          contentsWhereOnlyOneCopyHasExternalOccurrences: 0,
          contentsWhereMultipleCopiesHaveExternalOccurrences: 0,
          contentsWithZeroExternalOccurrences: 0,
        },
        controlTargets: [],
        detailedOccurrences: occs,
        truncationSummary: { capPerRepresentation: 100, totalCandidatesTruncated: 0, totalOccurrencesOmitted: 0 },
      };

      // Generate authentic b2Result with a cluster at 100, 116, 132
      const b2Result = await performPaletteOccurrenceContextReconnaissance(source, mockB1WithCluster, {
        exePath: 'MK1.EXE',
        exeSize,
      });

      expect(b2Result.trackB.totalClustersIdentified).toBe(1);

      // Now deliberately supply a B.1 result without the occurrences to trigger B.1 integrity failure
      const mockB1WithoutOccurrences: MK1PaletteReferenceReconResult = {
        ...mockB1WithCluster,
        detailedOccurrences: [],
      };

      const result = await executePaletteRepeatedStructureReconnaissance(source, mockB1WithoutOccurrences, b2Result, null);

      expect(result.status).toBe('FAILED');
      expect(result.failureReason).toContain('B.1 POSITION INTEGRITY VIOLATION');
      expect(result.reconciliation.allClusterPositionsResolveToB1).toBe(false);
    });

    it('preserves non-zero negative control counts and warns without aborting or failing', async () => {
      const exeSize = 4096;
      const exeBuffer = new Uint8Array(exeSize);
      const source = new MemoryDirectorySource('Test');
      source.setFile('MK1.EXE', exeBuffer);

      const leakingOcc: ExactValueOccurrence = {
        sourceFileOffset: 100,
        sourceFileOffsetHex: '0x00000064',
        matchedUint32Value: 0x12345678,
        matchedUint32Hex: '0x12345678',
        representationKind: 'linear-structure-address',
        targetCandidateId: NEGATIVE_CONTROL_CANDIDATE_ID, // Non-zero occurrence
        targetCandidateByteStart: 0x1000,
        targetCandidateByteStartHex: '0x00001000',
        targetCandidateRegionId: 'obj2-data',
        targetCandidateRegionClass: 'le-object-file-backed',
        targetObjectNumber: 2,
        sourceRegionId: 'obj1-rx',
        sourceRegionClass: 'le-object-file-backed',
        sourceObjectNumber: 1,
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
      };

      const mockB1Result: MK1PaletteReferenceReconResult = {
        status: 'SUCCESS',
        metadata: { operationId: 'test-op', timestamp: new Date().toISOString(), durationMs: 1 },
        fixture: { exePath: 'MK1.EXE', exeSize },
        reconciliation: {
          researchTargetInputCount: 1,
          researchTargetsProcessed: 1,
          researchTargetsSkipped: 0,
          skipReasons: {},
          allTargetsAccountedFor: true,
        },
        globalSummary: {
          totalResearchTargets: 1,
          targetsWithExternalExactOccurrences: 1,
          targetsWithNoExternalExactOccurrences: 0,
          percentageTargetsWithExternalOccurrences: 100,
          totalExternalLogicalMatches: 1,
          uniqueExternalPhysicalOccurrencePositions: 1,
          totalSelfOccurrences: 0,
          candidatesWith0ExternalOccurrences: 0,
          candidatesWith1ExternalOccurrence: 1,
          candidatesWith2To5ExternalOccurrences: 0,
          candidatesWith6To20ExternalOccurrences: 0,
          candidatesWithMoreThan20ExternalOccurrences: 0,
        },
        representationSummaries: [],
        targetRegionSummaries: [],
        sourceTargetMatrix: [],
        candidateSummaries: [],
        contentHashSummary: {
          contentsWithReferencesAtMultiplePhysicalCopies: 0,
          contentsWhereOnlyOneCopyHasExternalOccurrences: 0,
          contentsWhereMultipleCopiesHaveExternalOccurrences: 0,
          contentsWithZeroExternalOccurrences: 0,
        },
        controlTargets: [],
        detailedOccurrences: [leakingOcc],
        truncationSummary: { capPerRepresentation: 100, totalCandidatesTruncated: 0, totalOccurrencesOmitted: 0 },
      };

      const b2Result = await performPaletteOccurrenceContextReconnaissance(source, mockB1Result, {
        exePath: 'MK1.EXE',
        exeSize,
      });

      const result = await executePaletteRepeatedStructureReconnaissance(source, mockB1Result, b2Result, null);

      expect(result.status).toBe('SUCCESS');
      expect(result.negativeControlSummary.candidateId).toBe(NEGATIVE_CONTROL_CANDIDATE_ID);
      expect(result.negativeControlSummary.B1OccurrenceCount).toBe(1);
      expect(result.negativeControlSummary.B2ContextCount).toBe(1);
      expect(result.negativeControlSummary.B3RepeatedContextStatus).toBe('unexpected-occurrences-found');
      expect(result.negativeControlSummary.notes.toLowerCase()).toMatch(/unexpected|contradiction/);
    });

    it('fails with FAILED status if repeated-target group positions do not match B.1 evidence (group position mismatch)', async () => {
      const exeSize = 4096;
      const exeBuffer = new Uint8Array(exeSize);
      const source = new MemoryDirectorySource('Test');
      source.setFile('MK1.EXE', exeBuffer);

      const createOcc = (p: number): ExactValueOccurrence => ({
        sourceFileOffset: p,
        sourceFileOffsetHex: `0x${p.toString(16).padStart(8, '0').toUpperCase()}`,
        matchedUint32Value: 0x12345678,
        matchedUint32Hex: '0x12345678',
        representationKind: 'linear-structure-address',
        targetCandidateId: 'CAND_1',
        targetCandidateByteStart: 0x1000,
        targetCandidateByteStartHex: '0x00001000',
        targetCandidateRegionId: 'obj2-data',
        targetCandidateRegionClass: 'le-object-file-backed',
        targetObjectNumber: 2,
        sourceRegionId: 'obj1-rx',
        sourceRegionClass: 'le-object-file-backed',
        sourceObjectNumber: 1,
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
      });

      const positions = [100, 116, 132];
      const occs = positions.map(createOcc);

      const mockB1Result: MK1PaletteReferenceReconResult = {
        status: 'SUCCESS',
        metadata: { operationId: 'test-op', timestamp: new Date().toISOString(), durationMs: 1 },
        fixture: { exePath: 'MK1.EXE', exeSize },
        reconciliation: {
          researchTargetInputCount: 1,
          researchTargetsProcessed: 1,
          researchTargetsSkipped: 0,
          skipReasons: {},
          allTargetsAccountedFor: true,
        },
        globalSummary: {
          totalResearchTargets: 1,
          targetsWithExternalExactOccurrences: 1,
          targetsWithNoExternalExactOccurrences: 0,
          percentageTargetsWithExternalOccurrences: 100,
          totalExternalLogicalMatches: occs.length,
          uniqueExternalPhysicalOccurrencePositions: occs.length,
          totalSelfOccurrences: 0,
          candidatesWith0ExternalOccurrences: 0,
          candidatesWith1ExternalOccurrence: 0,
          candidatesWith2To5ExternalOccurrences: 1,
          candidatesWith6To20ExternalOccurrences: 0,
          candidatesWithMoreThan20ExternalOccurrences: 0,
        },
        representationSummaries: [],
        targetRegionSummaries: [],
        sourceTargetMatrix: [],
        candidateSummaries: [],
        contentHashSummary: {
          contentsWithReferencesAtMultiplePhysicalCopies: 0,
          contentsWhereOnlyOneCopyHasExternalOccurrences: 0,
          contentsWhereMultipleCopiesHaveExternalOccurrences: 0,
          contentsWithZeroExternalOccurrences: 0,
        },
        controlTargets: [],
        detailedOccurrences: occs,
        truncationSummary: { capPerRepresentation: 100, totalCandidatesTruncated: 0, totalOccurrencesOmitted: 0 },
      };

      const b2Result = await performPaletteOccurrenceContextReconnaissance(source, mockB1Result, {
        exePath: 'MK1.EXE',
        exeSize,
      });

      // Inject synthetic repeated-target group with a mismatched candidateId
      const badGroupMap = new Map([
        [
          'WRONG_CAND|linear-structure-address|obj1-rx',
          {
            candidateId: 'WRONG_CAND',
            representationKind: 'linear-structure-address' as PaletteRepresentationKind,
            sourceRegionId: 'obj1-rx',
            sourceObjectNumber: 1,
            positions: new Set([100, 116, 132]),
          },
        ],
      ]);

      const result = await executePaletteRepeatedStructureReconnaissance(source, mockB1Result, b2Result, null, {
        overrideRepeatedTargetGroups: badGroupMap,
      });

      expect(result.status).toBe('FAILED');
      expect(result.failureReason).toContain('B.1 GROUP POSITION INTEGRITY VIOLATION');
      expect(result.reconciliation.allRepeatedTargetGroupPositionsResolveToMatchingB1Evidence).toBe(false);
      expect(result.reconciliation.invalidRepeatedTargetGroupPositions).toEqual(expect.arrayContaining([100, 116, 132]));
    });

    it('runs Track A/B/C repeated structure analysis on control target with >= 3 occurrences', async () => {
      const exeSize = 4096;
      const exeBuffer = new Uint8Array(exeSize);
      for (const p of [100, 116, 132]) {
        exeBuffer[p] = 0x5c;
        exeBuffer[p + 1] = 0x0c;
        exeBuffer[p + 2] = 0x0b;
        exeBuffer[p + 3] = 0x00;
      }
      const source = new MemoryDirectorySource('Test');
      source.setFile('MK1.EXE', exeBuffer);

      const createControlOcc = (p: number): ExactValueOccurrence => ({
        sourceFileOffset: p,
        sourceFileOffsetHex: `0x${p.toString(16).padStart(8, '0').toUpperCase()}`,
        matchedUint32Value: 0x000b0c5c,
        matchedUint32Hex: '0x000B0C5C',
        representationKind: 'linear-structure-address',
        targetCandidateId: 'CONTROL_HANDLE',
        targetCandidateByteStart: 0x000b0c5c,
        targetCandidateByteStartHex: '0x000B0C5C',
        targetCandidateRegionId: 'obj2-data',
        targetCandidateRegionClass: 'le-object-file-backed',
        targetObjectNumber: 2,
        sourceRegionId: 'obj1-rx',
        sourceRegionClass: 'le-object-file-backed',
        sourceObjectNumber: 1,
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
      });

      const controlPositions = [100, 116, 132];
      const controlOccs = controlPositions.map(createControlOcc);

      const mockB1Result: MK1PaletteReferenceReconResult = {
        status: 'SUCCESS',
        metadata: { operationId: 'test-op', timestamp: new Date().toISOString(), durationMs: 1 },
        fixture: { exePath: 'MK1.EXE', exeSize },
        reconciliation: {
          researchTargetInputCount: 1,
          researchTargetsProcessed: 1,
          researchTargetsSkipped: 0,
          skipReasons: {},
          allTargetsAccountedFor: true,
        },
        globalSummary: {
          totalResearchTargets: 1,
          targetsWithExternalExactOccurrences: 1,
          targetsWithNoExternalExactOccurrences: 0,
          percentageTargetsWithExternalOccurrences: 100,
          totalExternalLogicalMatches: controlOccs.length,
          uniqueExternalPhysicalOccurrencePositions: controlOccs.length,
          totalSelfOccurrences: 0,
          candidatesWith0ExternalOccurrences: 0,
          candidatesWith1ExternalOccurrence: 0,
          candidatesWith2To5ExternalOccurrences: 1,
          candidatesWith6To20ExternalOccurrences: 0,
          candidatesWithMoreThan20ExternalOccurrences: 0,
        },
        representationSummaries: [],
        targetRegionSummaries: [],
        sourceTargetMatrix: [],
        candidateSummaries: [],
        contentHashSummary: {
          contentsWithReferencesAtMultiplePhysicalCopies: 0,
          contentsWhereOnlyOneCopyHasExternalOccurrences: 0,
          contentsWhereMultipleCopiesHaveExternalOccurrences: 0,
          contentsWithZeroExternalOccurrences: 0,
        },
        controlTargets: [
          {
            name: 'Handle Table Anchor',
            physicalOffset: 0x000b0c5c,
            physicalOffsetHex: '0x000B0C5C',
            representationsTested: [
              { name: 'linear-structure-address', value: 0x000b0c5c, valueHex: '0x000B0C5C' },
            ],
            totalLogicalMatches: controlOccs.length,
            uniquePhysicalOccurrences: controlOccs.length,
            externalOccurrences: controlOccs.length,
            sourceRegionDistribution: { 'obj1-rx': controlOccs.length },
            occurrences: controlOccs,
          },
        ],
        detailedOccurrences: controlOccs,
        truncationSummary: { capPerRepresentation: 100, totalCandidatesTruncated: 0, totalOccurrencesOmitted: 0 },
      };

      const b2Result = await performPaletteOccurrenceContextReconnaissance(source, mockB1Result, {
        exePath: 'MK1.EXE',
        exeSize,
      });

      const result = await executePaletteRepeatedStructureReconnaissance(source, mockB1Result, b2Result, null);

      expect(result.status).toBe('SUCCESS');
      expect(result.knownAnchorControlSummary.length).toBe(1);
      const controlSummary = result.knownAnchorControlSummary[0];
      expect(controlSummary.repeatedStructuralAnalysisStatus).toBe('eligible-analyzed');
      expect(controlSummary.repeatedStructuralResult).not.toBeNull();
      expect(controlSummary.repeatedStructuralResult?.primaryDeltaMotif?.isConstantStride).toBe(true);
      expect(controlSummary.repeatedStructuralResult?.primaryDeltaMotif?.cycleSpan).toBe(16);
    });

    it('createFailedResult derives negative control counts dynamically from available B.1/B.2 results without manufacturing zero', () => {
      const mockB1Result: Partial<MK1PaletteReferenceReconResult> = {
        detailedOccurrences: [
          {
            sourceFileOffset: 50,
            sourceFileOffsetHex: '0x00000032',
            matchedUint32Value: 0x11111111,
            matchedUint32Hex: '0x11111111',
            representationKind: 'linear-structure-address',
            targetCandidateId: NEGATIVE_CONTROL_CANDIDATE_ID,
            targetCandidateByteStart: 0x30580,
            targetCandidateByteStartHex: '0x00030580',
            targetCandidateRegionId: 'obj1-rx',
            targetCandidateRegionClass: 'le-object-file-backed',
            targetObjectNumber: 1,
            sourceRegionId: 'obj1-rx',
            sourceRegionClass: 'le-object-file-backed',
            sourceObjectNumber: 1,
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
          },
        ],
      };

      const failedResult = createFailedResult(
        'op-1',
        mockB1Result as MK1PaletteReferenceReconResult,
        null,
        'MK1.EXE',
        1000,
        'Test error'
      );

      expect(failedResult.status).toBe('FAILED');
      expect(failedResult.failureReason).toContain('Test error');
      expect(failedResult.negativeControlSummary.B1OccurrenceCount).toBe(1);
      expect(failedResult.negativeControlSummary.B2ContextCount).toBeNull();
      expect(failedResult.negativeControlSummary.B3RepeatedContextStatus).toBe('unexpected-occurrences-found');

      // Without B.1 result
      const failedResultNoB1 = createFailedResult('op-2', null, null, 'MK1.EXE', 1000, 'Upstream failure');
      expect(failedResultNoB1.negativeControlSummary.B1OccurrenceCount).toBeNull();
      expect(failedResultNoB1.negativeControlSummary.B2ContextCount).toBeNull();
      expect(failedResultNoB1.negativeControlSummary.B3RepeatedContextStatus).toBe('unavailable-upstream-uninspected');
    });
  });

  describe('Negative Control UI Helper (Pass 1E.2B.3c)', () => {
    it('provides correct presentation for not-applicable-no-occurrences (confirmed zero)', () => {
      const badge = getNegativeControlBadgeInfo('not-applicable-no-occurrences');
      expect(badge.label).toBe('CONFIRMED ZERO OCCURRENCES');
      expect(badge.className).toContain('emerald');
      expect(badge.isConfirmedZero).toBe(true);
      expect(badge.isContradiction).toBe(false);
    });

    it('provides correct presentation for unexpected-occurrences-found (contradiction)', () => {
      const badge = getNegativeControlBadgeInfo('unexpected-occurrences-found');
      expect(badge.label).toBe('CONTRADICTION — OCCURRENCES FOUND');
      expect(badge.className).toContain('amber');
      expect(badge.isConfirmedZero).toBe(false);
      expect(badge.isContradiction).toBe(true);
    });

    it('provides correct presentation for unavailable-upstream-uninspected (unavailable)', () => {
      const badge = getNegativeControlBadgeInfo('unavailable-upstream-uninspected');
      expect(badge.label).toBe('UPSTREAM EVIDENCE UNAVAILABLE');
      expect(badge.className).toContain('zinc');
      expect(badge.isConfirmedZero).toBe(false);
      expect(badge.isContradiction).toBe(false);
    });

    it('formats counts correctly including null/undefined values without manufacturing zero', () => {
      expect(formatNegativeControlCount(null)).toBe('UNAVAILABLE');
      expect(formatNegativeControlCount(undefined)).toBe('UNAVAILABLE');
      expect(formatNegativeControlCount(0)).toBe('0');
      expect(formatNegativeControlCount(14)).toBe('14');
    });
  });
});
