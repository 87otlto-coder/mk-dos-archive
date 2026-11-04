/**
 * MK1 Palette Phase-Aligned Subunit Recurrence & Harmonic Divisor Reconnaissance Engine
 * Milestone 1 — Pass 1E.2B.5
 *
 * Implements:
 * 1. Cycle-phase-aligned byte recurrence across complete cycle blocks without subunit pooling.
 * 2. Conservative intersection masking of all existing B.1 exact-occurrence fields.
 * 3. Exact phase-context signatures, canonical grouping, and repeating motif detection.
 * 4. Harmonic divisor relationship reconnaissance (tested-period exact multiples only).
 * 5. B.1 occurrence phase/lane occupancy geometry and primary motif lane stability.
 * 6. Candidate-centric cross-population primary occurrence geometry comparison.
 *
 * Epistemic boundary:
 * Purely structural, non-semantic analysis.
 * No "true record size" claims, no struct definitions, no x86 disassembly.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import {
  createOperationId,
  formatErrorDetails,
  logStageCheckpoint,
  logError,
} from '../../../core/diagnostics/diagnosticLogger';
import { MK1ExecutableLayoutReport } from './executableLayoutTypes';
import {
  ExactValueOccurrence,
  KnownAnchorControlRepresentation,
  MK1PaletteReferenceReconResult,
  PaletteRepresentationKind,
} from './paletteReferenceReconnaissanceTypes';
import { MK1PaletteOccurrenceContextResult } from './paletteOccurrenceContextTypes';
import { MK1PaletteRepeatedStructureResult } from './paletteRepeatedStructureTypes';
import {
  MK1PaletteCycleLayoutResult,
  PhysicalCyclePopulation,
} from './paletteCycleLayoutTypes';
import {
  AbsoluteCycleOffsetRecurrence,
  B5Stage,
  B1PhaseLaneOccupancySummary,
  CrossPopulationGeometrySummary,
  CrossPopulationPrimaryGeometryMatch,
  CrossPopulationSharedLanePattern,
  GlobalPhaseHarmonicSummary,
  HarmonicDivisorRelationship,
  HarmonicRoleLaneConsensus,
  HarmonicRoleSummary,
  KnownAnchorPhaseGeometrySummary,
  MK1CompactPalettePhaseHarmonicExport,
  MK1PalettePhaseHarmonicResult,
  NegativeControlPhaseHarmonicSummary,
  PeriodPhaseAnalysis,
  PhaseHarmonicReconciliation,
  PhaseHarmonicScanConfiguration,
  PhaseLaneB1OccupancyItem,
  PhaseLaneCell,
  PhaseSignatureGroup,
  PhaseSignatureMotif,
  PhaseSummary,
  PhysicalPopulationPhaseAnalysis,
  PrimaryOccurrenceGeometryItem,
} from './palettePhaseHarmonicTypes';

export const MINIMUM_COMPARABLE_SAMPLES_FOR_STABLE_CELL = 2;
export const PHASE_ALIGNED_CONTEXT_AGREEMENT_THRESHOLD = 0.75;

export function getDefaultPhaseHarmonicScanConfiguration(): PhaseHarmonicScanConfiguration {
  return {
    minimumComparableSamplesForStableCell: MINIMUM_COMPARABLE_SAMPLES_FOR_STABLE_CELL,
    phaseAlignedContextAgreementThreshold: PHASE_ALIGNED_CONTEXT_AGREEMENT_THRESHOLD,
    maskMode: 'all-b1-exact-occurrence-field-intersections',
    harmonicMode: 'tested-period-exact-multiples-only',
    phaseSignatureMode: 'exact-stable-variable-mask-signature',
    crossPopulationGeometryMode: 'exact-phase-index-and-lane-pattern',
  };
}

export function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

export function toHex8(b: number): string {
  return '0x' + (b & 0xff).toString(16).padStart(2, '0').toUpperCase();
}

export function toRawHex8(b: number): string {
  return (b & 0xff).toString(16).padStart(2, '0').toUpperCase();
}

export interface PalettePhaseHarmonicOptions {
  exePath?: string;
  exeSize?: number;
  onProgress?: (stage: string, progress: number) => void;
}

/**
 * Derives a canonical uppercase letter signature from an appearance index (0 -> 'A', 1 -> 'B', etc.).
 */
export function generatePhaseSignatureLetter(index: number): string {
  let s = '';
  let n = index;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

/**
 * Finds the smallest exact repeating signature motif across a phase signature sequence.
 * Requires at least 2 complete repetitions.
 */
export function findExactRepeatingPhaseSignatureMotif(sequence: string[]): PhaseSignatureMotif | null {
  const K = sequence.length;
  if (K < 2) return null;

  for (let M = 1; M <= Math.floor(K / 2); M++) {
    if (K % M === 0) {
      const candidateMotif = sequence.slice(0, M);
      let repeats = true;
      const repetitions = K / M;
      for (let j = 1; j < repetitions; j++) {
        for (let i = 0; i < M; i++) {
          if (sequence[j * M + i] !== candidateMotif[i]) {
            repeats = false;
            break;
          }
        }
        if (!repeats) break;
      }
      if (repeats) {
        return {
          motif: candidateMotif,
          repeatCount: repetitions,
        };
      }
    }
  }
  return null;
}

/**
 * Derives the negative control summary strictly from inspected upstream evidence (1E.2B.5b Sections 33-35).
 * Uniformly preserves 0/0 (not-applicable), non-zero (unexpected), or missing (unavailable).
 */
export function deriveNegativeControlSummary(
  b1Result?: Partial<MK1PaletteReferenceReconResult> | null,
  b2Result?: Partial<MK1PaletteOccurrenceContextResult> | null,
  participatingPopulationsCount = 0,
  participatingPopulationIds: string[] = []
): NegativeControlPhaseHarmonicSummary {
  const candidateId = 'MK1.EXE:0x0009C914';
  const controlName = 'negative-control-0x9C914';
  const targetOffset = 0x9c914;
  const targetOffsetHex = '0x0009C914';

  let b1OccCount: number | null = null;
  let b2CtxCount: number | null = null;

  if (b1Result) {
    if (b1Result.candidateSummaries !== undefined) {
      const cand = b1Result.candidateSummaries.find((c) => c.candidateId === candidateId);
      b1OccCount = cand ? (cand.totalLogicalMatches ?? cand.externalOccurrenceCount ?? 0) : 0;
    } else if (Array.isArray(b1Result.detailedOccurrences)) {
      b1OccCount = b1Result.detailedOccurrences.filter((o) => o.targetCandidateId === candidateId).length;
    }
  }

  if (b2Result) {
    const rawB2 = b2Result as {
      negativeControl?: {
        actualOccurrencesB2?: number;
        status?: string;
      };
      controls?: {
        negativeControl?: {
          actualOccurrencesB2?: number;
          status?: string;
        };
      };
      candidateContextSummaries?: Array<{
        candidateId: string;
        externalOccurrenceCount: number;
      }>;
    };
    const negCtrl = rawB2.negativeControl ?? rawB2.controls?.negativeControl;
    if (negCtrl?.actualOccurrencesB2 !== undefined) {
      b2CtxCount = negCtrl.actualOccurrencesB2;
    } else if (negCtrl?.status === 'CONFIRMED_ZERO_OCCURRENCES' || negCtrl?.status === 'VERIFIED_ZERO_OCCURRENCES') {
      b2CtxCount = 0;
    } else if (rawB2.candidateContextSummaries !== undefined) {
      const candB2 = rawB2.candidateContextSummaries.find((c) => c.candidateId === candidateId);
      b2CtxCount = candB2 ? candB2.externalOccurrenceCount : 0;
    }
  }

  let status: NegativeControlPhaseHarmonicSummary['status'];
  let notes: string;

  if (b1OccCount === null || b2CtxCount === null) {
    status = 'unavailable-upstream-uninspected';
    notes = 'Upstream negative control evidence was uninspected or unavailable.';
  } else if (b1OccCount === 0 && b2CtxCount === 0) {
    status = 'not-applicable-no-occurrences';
    notes = 'Negative control 0x9C914 confirmed absent from physical cycle populations (0 B.1 occurrences, 0 B.2 contexts).';
  } else {
    status = 'unexpected-occurrences-found';
    notes = `Candidate unexpectedly has ${b1OccCount} B.1 occurrences and ${b2CtxCount} B.2 contexts.`;
  }

  return {
    candidateId,
    controlName,
    targetOffset,
    targetOffsetHex,
    B1OccurrenceCount: b1OccCount,
    B2ContextCount: b2CtxCount,
    status,
    participatingPopulationsCount,
    participatingPopulationIds,
    notes,
  };
}

/**
 * Primary entry point for Milestone 1E.2B.5 Reconnaissance.
 */
export async function executePalettePhaseHarmonicReconnaissance(
  source: DirectorySource,
  report: MK1ExecutableLayoutReport,
  b1Result: MK1PaletteReferenceReconResult,
  b2Result: MK1PaletteOccurrenceContextResult,
  b3Result: MK1PaletteRepeatedStructureResult,
  b4Result: MK1PaletteCycleLayoutResult,
  options?: PalettePhaseHarmonicOptions,
  rawExeBytes?: Uint8Array
): Promise<MK1PalettePhaseHarmonicResult> {
  const startTime = Date.now();
  const operationId = createOperationId('palette-phase-harmonic');
  const stageTracker: { current: B5Stage } = { current: 'START B.5' };
  const exePath = options?.exePath ?? report.exePath;
  const exeSize = options?.exeSize ?? report.exeSize;

  try {
    return await executePalettePhaseHarmonicInternal(
      source,
      report,
      b1Result,
      b2Result,
      b3Result,
      b4Result,
      options,
      operationId,
      startTime,
      exePath,
      exeSize,
      stageTracker,
      rawExeBytes
    );
  } catch (error: unknown) {
    const errorDetails = formatErrorDetails(error);
    const failureReason = `FAILED — UNEXPECTED EXCEPTION at stage '${stageTracker.current}': ${errorDetails.message}`;
    logError('research', 'palettePhaseHarmonic', operationId, error, {
      milestone: '1E.2B.5',
      source: 'palettePhaseHarmonic',
      operation: 'executePalettePhaseHarmonicReconnaissance',
      fixturePath: exePath,
      fixtureSize: exeSize,
      lastSuccessfulStage: stageTracker.current,
      errorName: errorDetails.errorName,
      errorMessage: errorDetails.message,
      stack: errorDetails.stack,
      cause: errorDetails.cause,
    });
    return createFailedResult(
      operationId,
      startTime,
      exePath,
      exeSize,
      failureReason,
      b1Result,
      b2Result,
      b3Result,
      b4Result,
      stageTracker.current,
      {
        name: errorDetails.errorName,
        message: errorDetails.message,
        stack: errorDetails.stack,
        cause: errorDetails.cause,
      }
    );
  }
}

async function executePalettePhaseHarmonicInternal(
  source: DirectorySource,
  report: MK1ExecutableLayoutReport,
  b1Result: MK1PaletteReferenceReconResult,
  b2Result: MK1PaletteOccurrenceContextResult,
  b3Result: MK1PaletteRepeatedStructureResult,
  b4Result: MK1PaletteCycleLayoutResult,
  options: PalettePhaseHarmonicOptions | undefined,
  operationId: string,
  startTime: number,
  exePath: string,
  exeSize: number,
  stageTracker: { current: B5Stage },
  rawExeBytes?: Uint8Array
): Promise<MK1PalettePhaseHarmonicResult> {
  stageTracker.current = 'START B.5';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'START B.5', { exePath, exeSize });

  // 1. Prerequisite Validation (Section 7)
  if (
    b1Result.fixture.exePath !== exePath ||
    b1Result.fixture.exeSize !== exeSize ||
    b2Result.fixture.exePath !== exePath ||
    b2Result.fixture.exeSize !== exeSize ||
    b3Result.fixture.exePath !== exePath ||
    b3Result.fixture.exeSize !== exeSize ||
    b4Result.fixture.exePath !== exePath ||
    b4Result.fixture.exeSize !== exeSize
  ) {
    const err = 'FAILED — PREREQUISITE MISMATCH: Fixture path or size mismatch across B.1, B.2, B.3, B.4, and report.';
    logError('research', 'palettePhaseHarmonic', operationId, err);
    return createFailedResult(operationId, startTime, exePath, exeSize, err, b1Result, b2Result, b3Result, b4Result, stageTracker.current);
  }

  stageTracker.current = 'fixture verified';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'fixture verified');

  if (b1Result.status !== 'SUCCESS' || (b1Result.truncationSummary?.totalOccurrencesOmitted ?? 0) !== 0) {
    const err = 'FAILED — INCOMPLETE UPSTREAM EVIDENCE: B.1 status is not SUCCESS or occurrences were omitted by truncation.';
    logError('research', 'palettePhaseHarmonic', operationId, err);
    return createFailedResult(operationId, startTime, exePath, exeSize, err, b1Result, b2Result, b3Result, b4Result, stageTracker.current);
  }
  stageTracker.current = 'B.1 verified';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'B.1 verified');

  if (b2Result.status !== 'SUCCESS' || !b2Result.reconciliation?.allReconciled) {
    const err = 'FAILED — INCOMPLETE UPSTREAM EVIDENCE: B.2 status is not SUCCESS or reconciliation failed.';
    logError('research', 'palettePhaseHarmonic', operationId, err);
    return createFailedResult(operationId, startTime, exePath, exeSize, err, b1Result, b2Result, b3Result, b4Result, stageTracker.current);
  }
  stageTracker.current = 'B.2 verified';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'B.2 verified');

  if (b3Result.status !== 'SUCCESS' || !b3Result.reconciliation?.allReconciled) {
    const err = 'FAILED — INCOMPLETE UPSTREAM EVIDENCE: B.3 status is not SUCCESS or reconciliation failed.';
    logError('research', 'palettePhaseHarmonic', operationId, err);
    return createFailedResult(operationId, startTime, exePath, exeSize, err, b1Result, b2Result, b3Result, b4Result, stageTracker.current);
  }
  stageTracker.current = 'B.3 verified';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'B.3 verified');

  if (b4Result.status !== 'SUCCESS' || !b4Result.reconciliation?.allReconciled) {
    const err = 'FAILED — INCOMPLETE UPSTREAM EVIDENCE: B.4 status is not SUCCESS or reconciliation failed.';
    logError('research', 'palettePhaseHarmonic', operationId, err);
    return createFailedResult(operationId, startTime, exePath, exeSize, err, b1Result, b2Result, b3Result, b4Result, stageTracker.current);
  }
  stageTracker.current = 'B.4 verified';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'B.4 verified');

  // 2. Load executable bytes
  let exeBytes: Uint8Array;
  if (rawExeBytes) {
    exeBytes = rawExeBytes;
  } else {
    try {
      const exeBuffer = await source.readSlice(exePath, 0, exeSize);
      exeBytes = new Uint8Array(exeBuffer);
    } catch (err: unknown) {
      const errorDetails = formatErrorDetails(err);
      const errMsg = `Failed to read executable file at ${exePath}: ${errorDetails.message}`;
      logError('research', 'palettePhaseHarmonic', operationId, err, {
        exePath,
        exeSize,
        stage: stageTracker.current,
        message: errMsg,
      });
      return createFailedResult(
        operationId,
        startTime,
        exePath,
        exeSize,
        errMsg,
        b1Result,
        b2Result,
        b3Result,
        b4Result,
        stageTracker.current,
        {
          name: errorDetails.errorName,
          message: errorDetails.message,
          stack: errorDetails.stack,
          cause: errorDetails.cause,
        }
      );
    }
  }
  stageTracker.current = 'EXE bytes loaded';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'EXE bytes loaded', { length: exeBytes.length });

  // Index B.1 occurrences by source physical file offset
  const b1OccurrencesByPosition = new Map<number, ExactValueOccurrence[]>();
  for (const occ of b1Result.detailedOccurrences) {
    const list = b1OccurrencesByPosition.get(occ.sourceFileOffset) ?? [];
    list.push(occ);
    b1OccurrencesByPosition.set(occ.sourceFileOffset, list);
  }

  // 3. Primary Physical Populations (Section 9)
  options?.onProgress?.('Collecting eligible physical populations...', 0.1);
  const allB4Populations = b4Result.physicalCyclePopulations;
  const eligiblePopulations: PhysicalCyclePopulation[] = [];
  const skippedPopulations: PhysicalCyclePopulation[] = [];

  for (const pop of allB4Populations) {
    if (pop.cycleBlockCount >= 2 && pop.testedPeriods.length > 0) {
      eligiblePopulations.push(pop);
    } else {
      skippedPopulations.push(pop);
    }
  }

  stageTracker.current = 'physical populations collected';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'physical populations collected', {
    totalInput: allB4Populations.length,
    eligible: eligiblePopulations.length,
    skipped: skippedPopulations.length,
  });

  // Tracking counters for reconciliation
  let totalPhaseCellsGenerated = 0;
  let totalPhaseCellsProcessed = 0;
  let totalHarmonicRelationshipsGenerated = 0;
  let totalHarmonicRelationshipsProcessed = 0;

  // Real B.1 position validation (1E.2B.5a Sections 28-31 & 1E.2B.5b Section 25)
  const b4B1PopulationPositionPairsInput = allB4Populations.reduce(
    (acc, p) => acc + p.b1OccurrencePositionsInsideCycles.length,
    0
  );
  const b1PopulationPositionPairsInEligiblePopulations = eligiblePopulations.reduce(
    (acc, p) => acc + p.b1OccurrencePositionsInsideCycles.length,
    0
  );
  const b1PopulationPositionPairsInSkippedPopulations = skippedPopulations.reduce(
    (acc, p) => acc + p.b1OccurrencePositionsInsideCycles.length,
    0
  );

  const uniqueB1PhysicalPositionsInEligiblePopulations = new Set<number>();
  for (const p of eligiblePopulations) {
    for (const pos of p.b1OccurrencePositionsInsideCycles) {
      uniqueB1PhysicalPositionsInEligiblePopulations.add(pos);
    }
  }

  const uniqueB1PhysicalPositionsInSkippedPopulations = new Set<number>();
  for (const p of skippedPopulations) {
    for (const pos of p.b1OccurrencePositionsInsideCycles) {
      uniqueB1PhysicalPositionsInSkippedPopulations.add(pos);
    }
  }

  let b1EligiblePositionsResolved = 0;
  let b1EligiblePositionsMissing = 0;
  const b1MissingPositions: Array<{ populationId: string; position: number; positionHex: string }> = [];

  const populationAnalyses: PhysicalPopulationPhaseAnalysis[] = [];

  options?.onProgress?.('Generating period phase cells...', 0.2);

  for (let popIdx = 0; popIdx < eligiblePopulations.length; popIdx++) {
    const pop = eligiblePopulations[popIdx];
    const cycleSpan = pop.cycleSpan;
    const cycleAnchors = pop.cycleAnchors;
    const cycleBlockCount = pop.cycleBlockCount;

    // Real B.1 position validation (1E.2B.5a Sections 28-31)
    for (const pos of pop.b1OccurrencePositionsInsideCycles) {
      const occurrences = b1OccurrencesByPosition.get(pos);
      if (occurrences && occurrences.length > 0) {
        b1EligiblePositionsResolved++;
      } else {
        b1EligiblePositionsMissing++;
        b1MissingPositions.push({
          populationId: pop.populationId,
          position: pos,
          positionHex: toHex32(pos),
        });
      }
    }

    // Pre-calculate byte masking for each cycle block (Sections 14, 15, 48)
    // Mask ALL existing B.1 exact-occurrence fields that intersect the block!
    const cycleBlockMasks: boolean[][] = [];
    for (let c = 0; c < cycleBlockCount; c++) {
      const anchor = cycleAnchors[c];
      const mask = new Array<boolean>(cycleSpan).fill(false);

      for (const occ of b1Result.detailedOccurrences) {
        const occStart = occ.sourceFileOffset;
        const occEnd = occStart + 4;
        const blockStart = anchor;
        const blockEnd = anchor + cycleSpan;

        if (Math.max(occStart, blockStart) < Math.min(occEnd, blockEnd)) {
          const relStart = Math.max(0, occStart - blockStart);
          const relEnd = Math.min(cycleSpan, occEnd - blockStart);
          for (let r = relStart; r < relEnd; r++) {
            mask[r] = true;
          }
        }
      }
      cycleBlockMasks.push(mask);
    }

    // 1E.2B.5a Population-level Absolute Cycle-Offset Recurrence (Sections 4, 5)
    let rawComparableSampleCount = 0;
    let rawDominantSampleCount = 0;
    let contextComparableSampleCount = 0;
    let contextDominantSampleCount = 0;
    let contextStableOffsetCount = 0;
    let contextComparableOffsetCount = 0;
    let totalMaskedSampleCount = 0;

    for (let r = 0; r < cycleSpan; r++) {
      const rawOffsetSamples: number[] = [];
      const contextOffsetSamples: number[] = [];

      for (let c = 0; c < cycleBlockCount; c++) {
        const fileOffset = cycleAnchors[c] + r;
        const b = exeBytes[fileOffset];
        rawOffsetSamples.push(b);
        if (cycleBlockMasks[c][r]) {
          totalMaskedSampleCount++;
        } else {
          contextOffsetSamples.push(b);
        }
      }

      rawComparableSampleCount += rawOffsetSamples.length;
      const rawCounts = new Map<number, number>();
      for (const b of rawOffsetSamples) {
        rawCounts.set(b, (rawCounts.get(b) ?? 0) + 1);
      }
      let rawDom = 0;
      for (const count of rawCounts.values()) {
        if (count > rawDom) rawDom = count;
      }
      rawDominantSampleCount += rawDom;

      contextComparableSampleCount += contextOffsetSamples.length;
      if (contextOffsetSamples.length >= MINIMUM_COMPARABLE_SAMPLES_FOR_STABLE_CELL) {
        contextComparableOffsetCount++;
      }
      const contextCounts = new Map<number, number>();
      for (const b of contextOffsetSamples) {
        contextCounts.set(b, (contextCounts.get(b) ?? 0) + 1);
      }
      let ctxDom = 0;
      for (const count of contextCounts.values()) {
        if (count > ctxDom) ctxDom = count;
      }
      contextDominantSampleCount += ctxDom;

      if (
        contextOffsetSamples.length >= MINIMUM_COMPARABLE_SAMPLES_FOR_STABLE_CELL &&
        contextCounts.size === 1
      ) {
        contextStableOffsetCount++;
      }
    }

    const rawDominantAgreementPercentage =
      rawComparableSampleCount > 0 ? (rawDominantSampleCount / rawComparableSampleCount) * 100 : 0;
    const contextDominantAgreementPercentage =
      contextComparableSampleCount > 0 ? (contextDominantSampleCount / contextComparableSampleCount) * 100 : 0;
    const contextStableOffsetPercentage =
      contextComparableOffsetCount > 0 ? (contextStableOffsetCount / contextComparableOffsetCount) * 100 : 0;

    const absoluteCycleOffsetRecurrence: AbsoluteCycleOffsetRecurrence = {
      rawComparableSampleCount,
      rawDominantSampleCount,
      rawDominantAgreementPercentage,
      contextComparableSampleCount,
      contextDominantSampleCount,
      contextDominantAgreementPercentage,
      contextStableOffsetCount,
      contextComparableOffsetCount,
      contextStableOffsetPercentage,
      cycleBlockCount,
      maskedSampleCount: totalMaskedSampleCount,
    };

    const periodPhaseAnalyses: PeriodPhaseAnalysis[] = [];

    // Track A: Analyze each tested period candidate from B.4 (Section 10)
    for (const testedP of pop.testedPeriods) {
      const P = testedP.periodBytes;
      const phaseCount = cycleSpan / P;
      const totalCellsInPeriod = phaseCount * P;
      totalPhaseCellsGenerated += totalCellsInPeriod;

      const phaseSummaries: PhaseSummary[] = [];

      let periodRawComparableCount = 0;
      let periodRawDominantCount = 0;
      let periodContextComparableCount = 0;
      let periodContextDominantCount = 0;
      let periodContextStableCellCount = 0;
      let periodContextComparableCellCount = 0;

      for (let k = 0; k < phaseCount; k++) {
        const phaseOffsetWithinCycle = k * P;
        const cells: PhaseLaneCell[] = [];

        let phaseRawDominantSum = 0;
        let phaseRawStableLanes = 0;

        let phaseContextDominantSum = 0;
        let phaseContextComparableBytes = 0;
        let phaseContextStableLanes = 0;
        let phaseContextVariableLanes = 0;
        let phaseContextUncomparableLanes = 0;

        const signatureTokens: string[] = [];

        for (let l = 0; l < P; l++) {
          totalPhaseCellsProcessed++;
          const relOffset = k * P + l;

          // Collect raw and context samples across cycle blocks
          const rawSamples: number[] = [];
          const contextSamples: number[] = [];
          let maskedCount = 0;

          for (let c = 0; c < cycleBlockCount; c++) {
            const anchor = cycleAnchors[c];
            const fileOffset = anchor + relOffset;
            const byteVal = exeBytes[fileOffset];

            rawSamples.push(byteVal);

            if (cycleBlockMasks[c][relOffset]) {
              maskedCount++;
            } else {
              contextSamples.push(byteVal);
            }
          }

          // Raw cell calculation
          const rawCounts = new Map<number, number>();
          for (const b of rawSamples) {
            rawCounts.set(b, (rawCounts.get(b) ?? 0) + 1);
          }
          let rawDomCount = 0;
          for (const count of rawCounts.values()) {
            if (count > rawDomCount) rawDomCount = count;
          }
          phaseRawDominantSum += rawDomCount;
          if (rawCounts.size === 1 && cycleBlockCount >= 2) {
            phaseRawStableLanes++;
          }

          // Context cell calculation (Sections 16, 17, 18)
          const contextCounts = new Map<number, number>();
          for (const b of contextSamples) {
            contextCounts.set(b, (contextCounts.get(b) ?? 0) + 1);
          }
          const distinctBytes = Array.from(contextCounts.keys()).sort((a, b) => a - b);
          const distinctByteHexValues = distinctBytes.map(toHex8);

          let dominantByte: number | null = null;
          let dominantByteCount = 0;
          for (const [b, count] of contextCounts.entries()) {
            if (count > dominantByteCount) {
              dominantByte = b;
              dominantByteCount = count;
            } else if (count === dominantByteCount && dominantByte !== null && b < dominantByte) {
              dominantByte = b;
            }
          }

          const comparableSampleCount = contextSamples.length;
          const dominantByteHex = dominantByte !== null ? toHex8(dominantByte) : null;
          const dominantBytePercentage = comparableSampleCount > 0 ? (dominantByteCount / comparableSampleCount) * 100 : 0;

          // Stability rule (Section 18): comparableSampleCount >= 2 AND all comparable samples identical
          const isStableAcrossCycles = comparableSampleCount >= 2 && distinctBytes.length === 1;
          const stableByteHex = isStableAcrossCycles ? dominantByteHex : null;

          if (isStableAcrossCycles) {
            phaseContextStableLanes++;
            signatureTokens.push(dominantByte !== null ? toRawHex8(dominantByte) : '??');
          } else if (comparableSampleCount >= 2) {
            phaseContextVariableLanes++;
            signatureTokens.push('??');
          } else {
            phaseContextUncomparableLanes++;
            signatureTokens.push('XX');
          }

          if (comparableSampleCount >= 2) {
            periodContextComparableCellCount++;
          }
          if (isStableAcrossCycles) {
            periodContextStableCellCount++;
          }

          phaseContextDominantSum += dominantByteCount;
          phaseContextComparableBytes += comparableSampleCount;

          cells.push({
            phaseIndex: k,
            laneOffset: l,
            sampleCount: cycleBlockCount,
            maskedSampleCount: maskedCount,
            comparableSampleCount,
            distinctByteValues: distinctBytes,
            distinctByteHexValues,
            dominantByte,
            dominantByteHex,
            dominantByteCount,
            dominantBytePercentage,
            isStableAcrossCycles,
            stableByteHex,
          });
        }

        const rawComparableCount = P * cycleBlockCount;
        periodRawComparableCount += rawComparableCount;
        periodRawDominantCount += phaseRawDominantSum;
        periodContextComparableCount += phaseContextComparableBytes;
        periodContextDominantCount += phaseContextDominantSum;

        phaseSummaries.push({
          phaseIndex: k,
          phaseOffsetWithinCycle,
          rawComparableByteCount: rawComparableCount,
          rawStableCellCount: phaseRawStableLanes,
          rawDominantAgreementPercentage: (phaseRawDominantSum / rawComparableCount) * 100,
          contextComparableByteCount: phaseContextComparableBytes,
          contextStableCellCount: phaseContextStableLanes,
          contextDominantAgreementPercentage: phaseContextComparableBytes > 0 ? (phaseContextDominantSum / phaseContextComparableBytes) * 100 : 0,
          fullyStableContextLaneCount: phaseContextStableLanes,
          variableContextLaneCount: phaseContextVariableLanes,
          uncomparableContextLaneCount: phaseContextUncomparableLanes,
          contextSignature: signatureTokens.join(' '),
          cells,
        });
      }

      // Period Phase-Aligned Metrics (Sections 21, 22)
      const phaseAlignedRawDominantAgreementPercentage = periodRawComparableCount > 0 ? (periodRawDominantCount / periodRawComparableCount) * 100 : 0;
      const phaseAlignedContextDominantAgreementPercentage = periodContextComparableCount > 0 ? (periodContextDominantCount / periodContextComparableCount) * 100 : 0;
      const phaseAlignedContextStableCellPercentage = periodContextComparableCellCount > 0 ? (periodContextStableCellCount / periodContextComparableCellCount) * 100 : 0;

      // Passthrough B.4 metric (Section 23)
      const b4PooledContextDominantAgreementPercentage = testedP.contextDominantAgreementPercentage;

      // Gain (Section 24)
      const phaseAlignmentGainPercentagePoints = phaseAlignedContextDominantAgreementPercentage - b4PooledContextDominantAgreementPercentage;

      // Canonical 1E.2B.5a pooled mixing penalty (Sections 6, 7, 8)
      const pooledMixingPenaltyPercentagePoints =
        absoluteCycleOffsetRecurrence.contextDominantAgreementPercentage - b4PooledContextDominantAgreementPercentage;
      const hasPooledPhaseMixingPenalty =
        pooledMixingPenaltyPercentagePoints > 0 && periodContextComparableCount > 0;

      // Descriptive flags (Sections 26, 27)
      const hasPhaseLockedVariation = phaseAlignmentGainPercentagePoints > 0 && periodContextComparableCount > 0;
      const hasStrongPhaseAlignedRecurrence = phaseAlignedContextDominantAgreementPercentage >= 75 && cycleBlockCount >= 2;

      // Phase signatures, canonical IDs, and groups (Sections 32, 33)
      const signatureIdMap = new Map<string, string>();
      const signatureGroupsMap = new Map<string, { signatureId: string; phaseIndices: number[]; signature: string }>();

      let nextLetterIdx = 0;
      const phaseSignatureSequence: string[] = [];

      for (const ps of phaseSummaries) {
        let sigId = signatureIdMap.get(ps.contextSignature);
        if (!sigId) {
          sigId = generatePhaseSignatureLetter(nextLetterIdx++);
          signatureIdMap.set(ps.contextSignature, sigId);
          signatureGroupsMap.set(sigId, {
            signatureId: sigId,
            phaseIndices: [ps.phaseIndex],
            signature: ps.contextSignature,
          });
        } else {
          signatureGroupsMap.get(sigId)?.phaseIndices.push(ps.phaseIndex);
        }
        phaseSignatureSequence.push(sigId);
      }

      const phaseSignatureGroups: PhaseSignatureGroup[] = Array.from(signatureGroupsMap.values()).map((g) => ({
        signatureId: g.signatureId,
        phaseIndices: g.phaseIndices,
        signature: g.signature,
        groupSize: g.phaseIndices.length,
      }));

      // Exact repeating phase signature motif (Section 34)
      const exactRepeatingPhaseSignatureMotif = findExactRepeatingPhaseSignatureMotif(phaseSignatureSequence);

      // Canonical 1E.2B.5a evidence-bearing motif classification (Sections 25, 26)
      let exactPhaseSignatureMotifEvidenceStatus:
        | 'evidence-bearing'
        | 'not-applicable-all-masked'
        | 'no-repeating-motif';
      let evidenceBearingExactRepeatingPhaseSignatureMotif: PhaseSignatureMotif | null = null;

      if (!exactRepeatingPhaseSignatureMotif) {
        exactPhaseSignatureMotifEvidenceStatus = 'no-repeating-motif';
      } else {
        const motifPhasesCount =
          exactRepeatingPhaseSignatureMotif.motif.length * exactRepeatingPhaseSignatureMotif.repeatCount;
        let allZero = true;
        let allPositive = true;
        for (let k = 0; k < motifPhasesCount; k++) {
          const comp = phaseSummaries[k]?.contextComparableByteCount ?? 0;
          if (comp > 0) {
            allZero = false;
          } else {
            allPositive = false;
          }
        }
        if (allZero) {
          exactPhaseSignatureMotifEvidenceStatus = 'not-applicable-all-masked';
        } else if (allPositive) {
          exactPhaseSignatureMotifEvidenceStatus = 'evidence-bearing';
          evidenceBearingExactRepeatingPhaseSignatureMotif = exactRepeatingPhaseSignatureMotif;
        } else {
          exactPhaseSignatureMotifEvidenceStatus = 'not-applicable-all-masked';
        }
      }

      // Primary B.3 occurrence geometry (Sections 38, 39, 40)
      const primaryOccurrenceGeometry: PrimaryOccurrenceGeometryItem[] = [];
      const primaryOccurrenceSlots = pop.B3OccurrenceSlots;
      for (let sIdx = 0; sIdx < primaryOccurrenceSlots.length; sIdx++) {
        const slotRel = primaryOccurrenceSlots[sIdx];
        const phaseIndex = Math.floor(slotRel / P);
        const laneOffsetWithinPhase = slotRel % P;
        primaryOccurrenceGeometry.push({
          slotIndex: sIdx,
          relativeOffsetWithinCycle: slotRel,
          phaseIndex,
          laneOffsetWithinPhase,
        });
      }

      const distinctLanes = new Set(primaryOccurrenceGeometry.map((g) => g.laneOffsetWithinPhase));
      const distinctPhases = new Set(primaryOccurrenceGeometry.map((g) => g.phaseIndex));

      const primaryOccurrencesShareLaneAcrossDistinctPhases =
        primaryOccurrenceGeometry.length >= 2 && distinctLanes.size === 1 && distinctPhases.size >= 2;

      const primaryOccurrencesSharePhaseDifferentLanes =
        primaryOccurrenceGeometry.length >= 2 && distinctPhases.size === 1 && distinctLanes.size >= 2;

      // Track C: B.1 Occurrence Phase Geometry (Sections 35-37, 41)
      const phaseLaneOccupancyMap = new Map<string, {
        phaseIndex: number;
        laneOffset: number;
        physicalOffsets: Set<number>;
        logicalOccurrences: ExactValueOccurrence[];
        cycleIndices: Set<number>;
      }>();

      for (const pos of pop.b1OccurrencePositionsInsideCycles) {
        // Locate which cycle block(s) this occurrence falls into
        for (let c = 0; c < cycleBlockCount; c++) {
          const anchor = cycleAnchors[c];
          if (pos >= anchor && pos < anchor + cycleSpan) {
            const relWithinCycle = pos - anchor;
            const phaseIndex = Math.floor(relWithinCycle / P);
            const laneOffset = relWithinCycle % P;
            const key = `${phaseIndex}_${laneOffset}`;

            let cellItem = phaseLaneOccupancyMap.get(key);
            if (!cellItem) {
              cellItem = {
                phaseIndex,
                laneOffset,
                physicalOffsets: new Set<number>(),
                logicalOccurrences: [],
                cycleIndices: new Set<number>(),
              };
              phaseLaneOccupancyMap.set(key, cellItem);
            }
            cellItem.physicalOffsets.add(pos);
            cellItem.cycleIndices.add(c);

            const logicals = b1OccurrencesByPosition.get(pos) ?? [];
            for (const l of logicals) {
              cellItem.logicalOccurrences.push(l);
            }
          }
        }
      }

      const occupiedPhaseIndicesSet = new Set<number>();
      const occupiedLaneOffsetsSet = new Set<number>();
      const matrixItems: PhaseLaneB1OccupancyItem[] = [];

      const candidateIdHistogramByPhaseLane: Record<string, Record<string, number>> = {};
      const representationHistogramByPhaseLane: Record<string, Record<string, number>> = {};
      const targetRegionHistogramByPhaseLane: Record<string, Record<string, number>> = {};
      const targetObjectHistogramByPhaseLane: Record<string, Record<string, number>> = {};

      for (const [key, cellItem] of phaseLaneOccupancyMap.entries()) {
        occupiedPhaseIndicesSet.add(cellItem.phaseIndex);
        occupiedLaneOffsetsSet.add(cellItem.laneOffset);

        const candSet = new Set<string>();
        const repSet = new Set<PaletteRepresentationKind>();
        const targetValSet = new Set<number>();
        const targetRegSet = new Set<string>();

        const candHist: Record<string, number> = {};
        const repHist: Record<string, number> = {};
        const regHist: Record<string, number> = {};
        const objHist: Record<string, number> = {};

        for (const occ of cellItem.logicalOccurrences) {
          candSet.add(occ.targetCandidateId);
          repSet.add(occ.representationKind);
          targetValSet.add(occ.matchedUint32Value);
          targetRegSet.add(occ.targetCandidateRegionId);

          candHist[occ.targetCandidateId] = (candHist[occ.targetCandidateId] ?? 0) + 1;
          repHist[occ.representationKind] = (repHist[occ.representationKind] ?? 0) + 1;
          regHist[occ.targetCandidateRegionId] = (regHist[occ.targetCandidateRegionId] ?? 0) + 1;
          const objKey = occ.targetObjectNumber !== null ? String(occ.targetObjectNumber) : 'null';
          objHist[objKey] = (objHist[objKey] ?? 0) + 1;
        }

        candidateIdHistogramByPhaseLane[key] = candHist;
        representationHistogramByPhaseLane[key] = repHist;
        targetRegionHistogramByPhaseLane[key] = regHist;
        targetObjectHistogramByPhaseLane[key] = objHist;

        matrixItems.push({
          phaseIndex: cellItem.phaseIndex,
          laneOffset: cellItem.laneOffset,
          uniquePhysicalOccurrenceCount: cellItem.physicalOffsets.size,
          logicalAssociationCount: cellItem.logicalOccurrences.length,
          distinctCycleCount: cellItem.cycleIndices.size,
          candidateStable: candSet.size === 1,
          representationKindStable: repSet.size === 1,
          targetValueStable: targetValSet.size === 1,
          targetRegionStable: targetRegSet.size === 1,
          candidateIds: Array.from(candSet),
          representationKinds: Array.from(repSet),
        });
      }

      matrixItems.sort((a, b) => {
        if (a.phaseIndex !== b.phaseIndex) return a.phaseIndex - b.phaseIndex;
        return a.laneOffset - b.laneOffset;
      });

      const b1PhaseLaneOccupancy: B1PhaseLaneOccupancySummary = {
        occupiedPhaseIndices: Array.from(occupiedPhaseIndicesSet).sort((a, b) => a - b),
        occupiedPhaseCount: occupiedPhaseIndicesSet.size,
        occupiedLaneOffsets: Array.from(occupiedLaneOffsetsSet).sort((a, b) => a - b),
        occupiedLaneCount: occupiedLaneOffsetsSet.size,
        phaseLaneOccupancyMatrix: matrixItems,
        candidateIdHistogramByPhaseLane,
        representationHistogramByPhaseLane,
        targetRegionHistogramByPhaseLane,
        targetObjectHistogramByPhaseLane,
      };

      periodPhaseAnalyses.push({
        periodBytes: P,
        phaseCount,
        cycleBlockCount,
        b4PooledContextDominantAgreementPercentage,
        phaseAlignedRawComparableSampleCount: periodRawComparableCount,
        phaseAlignedRawDominantSampleCount: periodRawDominantCount,
        phaseAlignedRawDominantAgreementPercentage,
        phaseAlignedContextComparableSampleCount: periodContextComparableCount,
        phaseAlignedContextDominantSampleCount: periodContextDominantCount,
        phaseAlignedContextDominantAgreementPercentage,
        phaseAlignedContextStableCellCount: periodContextStableCellCount,
        phaseAlignedContextComparableCellCount: periodContextComparableCellCount,
        phaseAlignedContextStableCellPercentage,
        phaseAlignmentGainPercentagePoints,
        hasPhaseLockedVariation,
        hasStrongPhaseAlignedRecurrence,
        pooledMixingPenaltyPercentagePoints,
        hasPooledPhaseMixingPenalty,
        phaseSummaries,
        phaseSignatureSequence,
        phaseSignatureGroups,
        exactRepeatingPhaseSignatureMotif,
        evidenceBearingExactRepeatingPhaseSignatureMotif,
        exactPhaseSignatureMotifEvidenceStatus,
        primaryOccurrenceGeometry,
        primaryOccurrencesShareLaneAcrossDistinctPhases,
        primaryOccurrencesSharePhaseDifferentLanes,
        b1PhaseLaneOccupancy,
      });
    }

    // 1E.2B.5a Period Invariance Verification (Section 5)
    let maxPhaseAggregateDifference = 0;
    const periodsViolatingInvariant: number[] = [];
    for (const p of periodPhaseAnalyses) {
      const diff = Math.abs(
        p.phaseAlignedContextDominantAgreementPercentage -
          absoluteCycleOffsetRecurrence.contextDominantAgreementPercentage
      );
      if (diff > maxPhaseAggregateDifference) {
        maxPhaseAggregateDifference = diff;
      }
      if (diff > 1e-6) {
        periodsViolatingInvariant.push(p.periodBytes);
      }
    }
    const phaseAggregateInvariantAcrossPeriods = periodsViolatingInvariant.length === 0;

    // Track B: Harmonic Divisor Relationships (Sections 28-31 and 1E.2B.5a Sections 11-21)
    const harmonicRelationships: HarmonicDivisorRelationship[] = [];
    const periodAnalysisMap = new Map<number, PeriodPhaseAnalysis>();
    for (const p of periodPhaseAnalyses) {
      periodAnalysisMap.set(p.periodBytes, p);
    }

    const testedPList = pop.testedPeriods.map((p) => p.periodBytes).sort((a, b) => a - b);
    for (let i = 0; i < testedPList.length; i++) {
      for (let j = i + 1; j < testedPList.length; j++) {
        const pLowVal = testedPList[i];
        const pHighVal = testedPList[j];

        if (pHighVal % pLowVal === 0) {
          totalHarmonicRelationshipsGenerated++;
          totalHarmonicRelationshipsProcessed++;

          const pLow = periodAnalysisMap.get(pLowVal)!;
          const pHigh = periodAnalysisMap.get(pHighVal)!;
          const ratio = pHighVal / pLowVal;

          const groupingMap: Array<{ higherPhaseIndex: number; lowerPhaseIndices: number[] }> = [];
          const higherPhaseCount = cycleSpan / pHighVal;
          for (let h = 0; h < higherPhaseCount; h++) {
            const lowerIndices: number[] = [];
            for (let r = 0; r < ratio; r++) {
              lowerIndices.push(h * ratio + r);
            }
            groupingMap.push({ higherPhaseIndex: h, lowerPhaseIndices: lowerIndices });
          }

          const higherPooledAdvantageOverLowerPooled =
            pHigh.b4PooledContextDominantAgreementPercentage - pLow.b4PooledContextDominantAgreementPercentage;
          const higherPhaseAlignedAdvantageOverLowerPhaseAligned =
            pHigh.phaseAlignedContextDominantAgreementPercentage - pLow.phaseAlignedContextDominantAgreementPercentage;

          const lowerPhaseAlignedAtLeastHigherPooled =
            pLow.phaseAlignedContextDominantAgreementPercentage >= pHigh.b4PooledContextDominantAgreementPercentage;
          const lowerPhaseAlignedAtLeastHigherPhaseAligned =
            pLow.phaseAlignedContextDominantAgreementPercentage >= pHigh.phaseAlignedContextDominantAgreementPercentage;

          // Canonical 1E.2B.5a & 1E.2B.5b Harmonic Role-Slot Recurrence (Sections 10-21)
          const roleSummaries: HarmonicRoleSummary[] = [];

          for (let r = 0; r < ratio; r++) {
            const lowerPhaseIndicesAcrossHigherGroups: number[] = [];
            for (let h = 0; h < higherPhaseCount; h++) {
              lowerPhaseIndicesAcrossHigherGroups.push(h * ratio + r);
            }

            const roleLanes: HarmonicRoleLaneConsensus[] = [];
            let roleContextComparableSum = 0;
            let roleContextDominantSum = 0;
            let roleComparableLanes = 0;
            let roleStableAcrossHigherLanes = 0;

            // Canonical 1E.2B.5b Cross-Higher Role Counters (Sections 10-14)
            let crossHigherComparableSampleCount = 0;
            let crossHigherDominantSampleCount = 0;
            let crossHigherComparableLaneCount = 0;
            let crossHigherStableLaneCount = 0;
            const crossHigherEligibleLaneOffsets: number[] = [];
            const crossHigherIneligibleLaneOffsets: number[] = [];

            const roleTokens: string[] = [];

            for (let l = 0; l < pLowVal; l++) {
              const contextSamples: number[] = [];
              let maskedCount = 0;
              const distinctHigherPhaseIndices = new Set<number>();
              const distinctCycleIndices = new Set<number>();

              for (let h = 0; h < higherPhaseCount; h++) {
                const lowerPhaseIdx = h * ratio + r;
                const subunitRelOffset = lowerPhaseIdx * pLowVal;
                const relOffset = subunitRelOffset + l;

                for (let c = 0; c < cycleBlockCount; c++) {
                  if (cycleBlockMasks[c][relOffset]) {
                    maskedCount++;
                  } else {
                    const byteVal = exeBytes[cycleAnchors[c] + relOffset];
                    contextSamples.push(byteVal);
                    distinctHigherPhaseIndices.add(h);
                    distinctCycleIndices.add(c);
                  }
                }
              }

              const sampleCount = cycleBlockCount * higherPhaseCount;
              const comparableSampleCount = contextSamples.length;
              roleContextComparableSum += comparableSampleCount;

              const counts = new Map<number, number>();
              for (const b of contextSamples) {
                counts.set(b, (counts.get(b) ?? 0) + 1);
              }
              let domVal: number | null = null;
              let domCount = 0;
              for (const [b, count] of counts.entries()) {
                if (count > domCount) {
                  domCount = count;
                  domVal = b;
                }
              }
              roleContextDominantSum += domCount;

              const distinctByteValues = Array.from(counts.keys());
              const distinctHigherPhaseList = Array.from(distinctHigherPhaseIndices).sort((a, b) => a - b);
              const distinctCycleList = Array.from(distinctCycleIndices).sort((a, b) => a - b);

              // Cross-higher-phase eligibility (Sections 10-14)
              const isCrossHigherEligible = distinctHigherPhaseIndices.size >= 2 && comparableSampleCount >= 2;
              if (isCrossHigherEligible) {
                roleComparableLanes++;
                crossHigherComparableLaneCount++;
                crossHigherEligibleLaneOffsets.push(l);
                crossHigherComparableSampleCount += comparableSampleCount;
                crossHigherDominantSampleCount += domCount;
              } else {
                crossHigherIneligibleLaneOffsets.push(l);
              }

              const stableAcrossHigherPhases =
                isCrossHigherEligible && distinctByteValues.length === 1;

              if (stableAcrossHigherPhases) {
                roleStableAcrossHigherLanes++;
                crossHigherStableLaneCount++;
              }

              const stableByteHex = stableAcrossHigherPhases && domVal !== null ? toRawHex8(domVal) : null;

              if (stableAcrossHigherPhases && domVal !== null) {
                roleTokens.push(toRawHex8(domVal));
              } else if (comparableSampleCount > 0) {
                roleTokens.push('??');
              } else {
                roleTokens.push('XX');
              }

              roleLanes.push({
                roleIndex: r,
                laneOffset: l,
                sampleCount,
                maskedSampleCount: maskedCount,
                comparableSampleCount,
                distinctHigherPhaseIndicesContributing: distinctHigherPhaseList,
                distinctCycleIndicesContributing: distinctCycleList,
                distinctByteValues,
                dominantByte: domVal,
                dominantByteHex: domVal !== null ? toHex8(domVal) : null,
                dominantByteCount: domCount,
                dominantBytePercentage: comparableSampleCount > 0 ? (domCount / comparableSampleCount) * 100 : 0,
                stableAcrossHigherPhases,
                stableByteHex,
                isCrossHigherEligible,
              });
            }

            const roleContextDominantAgreementPercentage =
              roleContextComparableSum > 0 ? (roleContextDominantSum / roleContextComparableSum) * 100 : 0;
            const stableAcrossHigherPhasesLanePercentage =
              roleComparableLanes > 0 ? (roleStableAcrossHigherLanes / roleComparableLanes) * 100 : 0;

            const crossHigherDominantAgreementPercentage =
              crossHigherComparableSampleCount > 0
                ? (crossHigherDominantSampleCount / crossHigherComparableSampleCount) * 100
                : null;
            const crossHigherStableLanePercentage =
              crossHigherComparableLaneCount > 0
                ? (crossHigherStableLaneCount / crossHigherComparableLaneCount) * 100
                : null;

            let rolesCrossHigherPhaseEvidenceStatus:
              | 'strong-cross-higher-phase-evidence'
              | 'weak-cross-higher-phase-evidence'
              | 'insufficient-distinct-higher-phases'
              | 'all-masked';

            if (roleContextComparableSum === 0) {
              rolesCrossHigherPhaseEvidenceStatus = 'all-masked';
            } else if (crossHigherComparableLaneCount === 0) {
              rolesCrossHigherPhaseEvidenceStatus = 'insufficient-distinct-higher-phases';
            } else if (crossHigherStableLanePercentage !== null && crossHigherStableLanePercentage >= 75) {
              rolesCrossHigherPhaseEvidenceStatus = 'strong-cross-higher-phase-evidence';
            } else {
              rolesCrossHigherPhaseEvidenceStatus = 'weak-cross-higher-phase-evidence';
            }

            // Exact context signature match across higher phases (Section 21)
            const evidenceBearingSignatures: string[] = [];
            for (const lowerPhaseIdx of lowerPhaseIndicesAcrossHigherGroups) {
              const ps = pLow.phaseSummaries[lowerPhaseIdx];
              if (ps && ps.contextComparableByteCount > 0) {
                evidenceBearingSignatures.push(ps.contextSignature);
              }
            }
            const exactContextSignatureMatchAcrossHigherPhases =
              evidenceBearingSignatures.length >= 2 &&
              evidenceBearingSignatures.every((sig) => sig === evidenceBearingSignatures[0]);

            roleSummaries.push({
              roleIndex: r,
              lowerPhaseIndicesAcrossHigherGroups,
              higherPhaseCount,
              cycleBlockCount,
              contextComparableSampleCount: roleContextComparableSum,
              contextDominantSampleCount: roleContextDominantSum,
              contextDominantAgreementPercentage: roleContextDominantAgreementPercentage,
              comparableLaneCount: roleComparableLanes,
              stableAcrossHigherPhasesLaneCount: roleStableAcrossHigherLanes,
              stableAcrossHigherPhasesLanePercentage,
              crossHigherComparableSampleCount,
              crossHigherDominantSampleCount,
              crossHigherDominantAgreementPercentage,
              crossHigherComparableLaneCount,
              crossHigherStableLaneCount,
              crossHigherStableLanePercentage,
              crossHigherEligibleLaneOffsets,
              crossHigherIneligibleLaneOffsets,
              rolesCrossHigherPhaseEvidenceStatus,
              contextSignature: roleTokens.join(' '),
              exactContextSignatureMatchAcrossHigherPhases,
              lanes: roleLanes,
            });
          }

          const rolesWithCrossHigherPhaseEvidence = roleSummaries.filter(
            (r) =>
              r.rolesCrossHigherPhaseEvidenceStatus === 'strong-cross-higher-phase-evidence' ||
              r.rolesCrossHigherPhaseEvidenceStatus === 'weak-cross-higher-phase-evidence'
          ).length;
          const rolesWithoutCrossHigherPhaseEvidence = ratio - rolesWithCrossHigherPhaseEvidence;

          // Legacy broad role context totals
          let lowerRoleContextComparableSampleCount = 0;
          let lowerRoleContextDominantSampleCount = 0;
          let lowerRoleStableLaneCount = 0;
          let lowerRoleComparableLaneCount = 0;

          // Canonical 1E.2B.5b cross-higher role totals
          let crossHigherRoleComparableSampleCount = 0;
          let crossHigherRoleDominantSampleCount = 0;
          let crossHigherRoleComparableLaneCount = 0;
          let crossHigherRoleStableLaneCount = 0;
          let rolesWithCrossHigherComparableLanes = 0;

          for (const rs of roleSummaries) {
            lowerRoleContextComparableSampleCount += rs.contextComparableSampleCount;
            lowerRoleContextDominantSampleCount += rs.contextDominantSampleCount;
            lowerRoleStableLaneCount += rs.stableAcrossHigherPhasesLaneCount;
            lowerRoleComparableLaneCount += rs.comparableLaneCount;

            crossHigherRoleComparableSampleCount += rs.crossHigherComparableSampleCount;
            crossHigherRoleDominantSampleCount += rs.crossHigherDominantSampleCount;
            crossHigherRoleComparableLaneCount += rs.crossHigherComparableLaneCount;
            crossHigherRoleStableLaneCount += rs.crossHigherStableLaneCount;
            if (rs.crossHigherComparableLaneCount > 0) {
              rolesWithCrossHigherComparableLanes++;
            }
          }

          const rolesWithoutCrossHigherComparableLanes = ratio - rolesWithCrossHigherComparableLanes;

          const lowerRoleContextDominantAgreementPercentage =
            lowerRoleContextComparableSampleCount > 0
              ? (lowerRoleContextDominantSampleCount / lowerRoleContextComparableSampleCount) * 100
              : 0;
          const lowerRoleStableLanePercentage =
            lowerRoleComparableLaneCount > 0
              ? (lowerRoleStableLaneCount / lowerRoleComparableLaneCount) * 100
              : 0;

          const lowerRoleRecurrenceAtLeastLowerPooled =
            lowerRoleContextDominantAgreementPercentage >= pLow.b4PooledContextDominantAgreementPercentage;
          const lowerRoleRecurrenceAtLeastHigherPooled =
            lowerRoleContextDominantAgreementPercentage >= pHigh.b4PooledContextDominantAgreementPercentage;

          // Canonical 1E.2B.5b cross-higher percentages
          const crossHigherRoleDominantAgreementPercentage =
            crossHigherRoleComparableSampleCount > 0
              ? (crossHigherRoleDominantSampleCount / crossHigherRoleComparableSampleCount) * 100
              : null;
          const crossHigherRoleStableLanePercentage =
            crossHigherRoleComparableLaneCount > 0
              ? (crossHigherRoleStableLaneCount / crossHigherRoleComparableLaneCount) * 100
              : null;

          const crossHigherRoleRecurrenceAtLeastLowerPooled =
            crossHigherRoleDominantAgreementPercentage !== null
              ? crossHigherRoleDominantAgreementPercentage >= pLow.b4PooledContextDominantAgreementPercentage
              : null;
          const crossHigherRoleRecurrenceAtLeastHigherPooled =
            crossHigherRoleDominantAgreementPercentage !== null
              ? crossHigherRoleDominantAgreementPercentage >= pHigh.b4PooledContextDominantAgreementPercentage
              : null;

          const roleRecurrenceThreshold = 75;

          let roleRecurrenceStatus:
            | 'confirmed-recurrence'
            | 'reduced-recurrence'
            | 'insufficient-cross-higher-evidence'
            | 'all-masked';
          if (roleSummaries.every((r) => r.rolesCrossHigherPhaseEvidenceStatus === 'all-masked')) {
            roleRecurrenceStatus = 'all-masked';
          } else if (rolesWithCrossHigherComparableLanes === 0) {
            roleRecurrenceStatus = 'insufficient-cross-higher-evidence';
          } else if (
            crossHigherRoleDominantAgreementPercentage !== null &&
            crossHigherRoleDominantAgreementPercentage >= roleRecurrenceThreshold &&
            crossHigherRoleStableLanePercentage !== null &&
            crossHigherRoleStableLanePercentage >= roleRecurrenceThreshold
          ) {
            roleRecurrenceStatus = 'confirmed-recurrence';
          } else {
            roleRecurrenceStatus = 'reduced-recurrence';
          }

          const allRolesExactContextSignatureMatchAcrossHigherPhases =
            rolesWithCrossHigherComparableLanes > 0 &&
            roleSummaries.every(
              (r) =>
                r.rolesCrossHigherPhaseEvidenceStatus === 'all-masked' ||
                r.exactContextSignatureMatchAcrossHigherPhases
            );

          harmonicRelationships.push({
            lowerPeriodBytes: pLowVal,
            higherPeriodBytes: pHighVal,
            ratio,
            lowerSubunitsPerHigherSubunit: ratio,
            lowerB4PooledAgreement: pLow.b4PooledContextDominantAgreementPercentage,
            higherB4PooledAgreement: pHigh.b4PooledContextDominantAgreementPercentage,
            lowerPhaseAlignedAgreement: pLow.phaseAlignedContextDominantAgreementPercentage,
            higherPhaseAlignedAgreement: pHigh.phaseAlignedContextDominantAgreementPercentage,
            lowerPhaseAlignmentGain: pLow.phaseAlignmentGainPercentagePoints,
            higherPhaseAlignmentGain: pHigh.phaseAlignmentGainPercentagePoints,
            higherPooledAdvantageOverLowerPooled,
            higherPhaseAlignedAdvantageOverLowerPhaseAligned,
            lowerPhaseAlignedAtLeastHigherPooled,
            lowerPhaseAlignedAtLeastHigherPhaseAligned,
            groupingMap,
            roleRecurrenceStatus,
            roleRecurrenceThreshold,
            rolesTotal: ratio,
            rolesWithCrossHigherPhaseEvidence,
            rolesWithoutCrossHigherPhaseEvidence,
            rolesWithCrossHigherComparableLanes,
            rolesWithoutCrossHigherComparableLanes,
            lowerRoleContextComparableSampleCount,
            lowerRoleContextDominantSampleCount,
            lowerRoleContextDominantAgreementPercentage,
            lowerRoleStableLaneCount,
            lowerRoleComparableLaneCount,
            lowerRoleStableLanePercentage,
            lowerRoleRecurrenceAtLeastLowerPooled,
            lowerRoleRecurrenceAtLeastHigherPooled,
            crossHigherRoleComparableSampleCount,
            crossHigherRoleDominantSampleCount,
            crossHigherRoleDominantAgreementPercentage,
            crossHigherRoleComparableLaneCount,
            crossHigherRoleStableLaneCount,
            crossHigherRoleStableLanePercentage,
            crossHigherRoleRecurrenceAtLeastLowerPooled,
            crossHigherRoleRecurrenceAtLeastHigherPooled,
            allRolesExactContextSignatureMatchAcrossHigherPhases,
            roleSummaries,
          });
        }
      }
    }

    populationAnalyses.push({
      populationId: pop.populationId,
      sourceRegionId: pop.sourceRegionId,
      sourceRegionClass: pop.sourceRegionClass,
      sourceObjectNumber: pop.sourceObjectNumber,
      cycleSpan: pop.cycleSpan,
      cycleBlockCount: pop.cycleBlockCount,
      cycleAnchors: pop.cycleAnchors,
      cycleAnchorsHex: pop.cycleAnchorsHex,
      candidateIds: pop.candidateIds,
      representationKinds: pop.representationKinds,
      sourceClusterIds: pop.sourceClusterIds,
      sourceRepeatedTargetGroupIds: pop.sourceRepeatedTargetGroupIds,
      B3PrimaryMotif: pop.B3PrimaryMotif,
      B3OccurrenceSlots: pop.B3OccurrenceSlots,
      B4TopPeriodCandidates: pop.topPeriodCandidates.map((t) => t.periodBytes),
      absoluteCycleOffsetRecurrence,
      phaseAggregateInvariantAcrossPeriods,
      maxPhaseAggregateDifference,
      periodsViolatingInvariant,
      periodPhaseAnalyses,
      harmonicRelationships,
      b1OccurrencePositionsInsideCycles: pop.b1OccurrencePositionsInsideCycles,
      b1OccurrencePositionsInsideCyclesHex: pop.b1OccurrencePositionsInsideCyclesHex,
    });
  }

  stageTracker.current = 'period phase cells generated';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'period phase cells generated', {
    cellsGenerated: totalPhaseCellsGenerated,
    cellsProcessed: totalPhaseCellsProcessed,
  });

  stageTracker.current = 'phase-aligned recurrence complete';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'phase-aligned recurrence complete');

  stageTracker.current = 'phase signatures complete';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'phase signatures complete');

  stageTracker.current = 'harmonic relationships complete';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'harmonic relationships complete', {
    relationshipsCount: totalHarmonicRelationshipsProcessed,
  });

  stageTracker.current = 'B.1 phase geometry complete';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'B.1 phase geometry complete');

  // 4. Candidate-Centric Cross-Population Geometry (Sections 42-45)
  options?.onProgress?.('Comparing cross-population geometry...', 0.7);
  const crossPopulationGeometrySummaries: CrossPopulationGeometrySummary[] = [];
  const populationAnalysisMap = new Map<string, PhysicalPopulationPhaseAnalysis>();
  for (const pa of populationAnalyses) {
    populationAnalysisMap.set(pa.populationId, pa);
  }

  for (const group of b4Result.crossPopulationCandidateGroups) {
    const popIds = group.populationIds;
    const populationPeriodGeometry: Record<string, Record<number, Array<{ phaseIndex: number; laneOffset: number }>>> = {};

    for (const pid of popIds) {
      const pa = populationAnalysisMap.get(pid);
      if (!pa) continue;
      populationPeriodGeometry[pid] = {};
      for (const p of pa.periodPhaseAnalyses) {
        populationPeriodGeometry[pid][p.periodBytes] = p.primaryOccurrenceGeometry.map((g) => ({
          phaseIndex: g.phaseIndex,
          laneOffset: g.laneOffsetWithinPhase,
        }));
      }
    }

    const exactPrimaryGeometryMatches: CrossPopulationPrimaryGeometryMatch[] = [];
    const sharedSameLaneAcrossDistinctPhasePatterns: CrossPopulationSharedLanePattern[] = [];

    for (let i = 0; i < popIds.length; i++) {
      for (let j = i + 1; j < popIds.length; j++) {
        const popAId = popIds[i];
        const popBId = popIds[j];
        const paA = populationAnalysisMap.get(popAId);
        const paB = populationAnalysisMap.get(popBId);
        if (!paA || !paB) continue;

        for (const pA of paA.periodPhaseAnalyses) {
          for (const pB of paB.periodPhaseAnalyses) {
            const patternA = populationPeriodGeometry[popAId]?.[pA.periodBytes] ?? [];
            const patternB = populationPeriodGeometry[popBId]?.[pB.periodBytes] ?? [];

            const isExactMatch =
              patternA.length > 0 &&
              patternA.length === patternB.length &&
              patternA.every((ptA, idx) => ptA.phaseIndex === patternB[idx].phaseIndex && ptA.laneOffset === patternB[idx].laneOffset);

            if (isExactMatch) {
              exactPrimaryGeometryMatches.push({
                populationAId: popAId,
                populationBId: popBId,
                periodABytes: pA.periodBytes,
                periodBBytes: pB.periodBytes,
                patternA,
                patternB,
                exactMatch: true,
              });
            }

            if (pA.primaryOccurrencesShareLaneAcrossDistinctPhases && pB.primaryOccurrencesShareLaneAcrossDistinctPhases) {
              sharedSameLaneAcrossDistinctPhasePatterns.push({
                populationAId: popAId,
                populationBId: popBId,
                periodABytes: pA.periodBytes,
                periodBBytes: pB.periodBytes,
                bothShareLaneAcrossDistinctPhases: true,
              });
            }
          }
        }
      }
    }

    crossPopulationGeometrySummaries.push({
      groupId: group.groupId,
      candidateId: group.candidateId,
      representationKind: group.representationKind,
      populationIds: group.populationIds,
      populationPeriodGeometry,
      exactPrimaryGeometryMatches,
      sharedSameLaneAcrossDistinctPhasePatterns,
    });
  }

  stageTracker.current = 'cross-pop geometry complete';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'cross-pop geometry complete');

  // 5. Controls (Sections 46, 47)
  options?.onProgress?.('Processing controls...', 0.85);
  const knownAnchorControlSummary: KnownAnchorPhaseGeometrySummary[] = [];
  for (const c of b4Result.knownAnchorControlSummary) {
    const participating: KnownAnchorPhaseGeometrySummary['participatingOccurrences'] = [];
    for (const occ of c.participatingPhysicalPopulations) {
      const pa = populationAnalysisMap.get(occ.populationId);
      if (pa) {
        for (const p of pa.periodPhaseAnalyses) {
          const phaseIndex = Math.floor(occ.relativeOffsetWithinCycle / p.periodBytes);
          const laneOffsetWithinPhase = occ.relativeOffsetWithinCycle % p.periodBytes;
          participating.push({
            populationId: occ.populationId,
            sourceOccurrenceOffset: occ.sourceOccurrenceOffset,
            sourceOccurrenceOffsetHex: occ.sourceOccurrenceOffsetHex,
            cycleIndex: occ.cycleIndex,
            relativeOffsetWithinCycle: occ.relativeOffsetWithinCycle,
            periodBytes: p.periodBytes,
            phaseIndex,
            laneOffsetWithinPhase,
          });
        }
      }
    }
    knownAnchorControlSummary.push({
      controlName: c.controlName,
      targetOffset: c.targetOffset,
      targetOffsetHex: c.targetOffsetHex,
      representationsTested: c.representationsTested,
      totalLogicalMatches: c.totalLogicalMatches,
      uniquePhysicalOccurrences: c.uniquePhysicalOccurrences,
      externalOccurrences: c.externalOccurrences,
      sourceRegionDistribution: c.sourceRegionDistribution,
      participatingOccurrences: participating,
    });
  }
  stageTracker.current = 'controls processed';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'controls processed');

  // Negative Control (Section 46 and 1E.2B.5a/b Sections 32-35)
  const negCandidateId = 'MK1.EXE:0x0009C914';
  const b1MatchesForNegativeControl = b1Result.detailedOccurrences.filter(
    (occ) => occ.targetCandidateId === negCandidateId
  );
  // Check if any B.1 occurrence intersects any eligible cycle block
  const participatingPopIds: string[] = [];
  for (const occ of b1MatchesForNegativeControl) {
    for (const pop of eligiblePopulations) {
      for (const anchor of pop.cycleAnchors) {
        if (occ.sourceFileOffset >= anchor && occ.sourceFileOffset < anchor + pop.cycleSpan) {
          if (!participatingPopIds.includes(pop.populationId)) {
            participatingPopIds.push(pop.populationId);
          }
        }
      }
    }
  }

  const negativeControlSummary = deriveNegativeControlSummary(
    b1Result,
    b2Result,
    participatingPopIds.length,
    participatingPopIds
  );
  stageTracker.current = 'negative control derived';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'negative control derived');

  // 6. Reconciliation (Section 64 and 1E.2B.5a Sections 28-31)
  const b4PhysicalPopulationsInput = allB4Populations.length;
  const b5EligiblePhysicalPopulations = eligiblePopulations.length;
  const b5PhysicalPopulationsProcessed = populationAnalyses.length;
  const b5PhysicalPopulationsSkipped = skippedPopulations.length;
  const allPhysicalPopulationsAccountedFor =
    b5PhysicalPopulationsProcessed + b5PhysicalPopulationsSkipped === b4PhysicalPopulationsInput &&
    b5PhysicalPopulationsProcessed === b5EligiblePhysicalPopulations;

  const b4PeriodCandidatesInput = allB4Populations.reduce((acc, p) => acc + p.testedPeriods.length, 0);
  const b5PeriodCandidatesProcessed = populationAnalyses.reduce((acc, p) => acc + p.periodPhaseAnalyses.length, 0);
  const b5PeriodCandidatesSkipped = skippedPopulations.reduce((acc, p) => acc + p.testedPeriods.length, 0);
  const allPeriodCandidatesAccountedFor =
    b5PeriodCandidatesProcessed + b5PeriodCandidatesSkipped === b4PeriodCandidatesInput;

  const phaseCellsSkipped = 0;
  const allPhaseCellsAccountedFor = totalPhaseCellsProcessed + phaseCellsSkipped === totalPhaseCellsGenerated;

  const harmonicRelationshipsSkipped = 0;
  const allHarmonicRelationshipsAccountedFor =
    totalHarmonicRelationshipsProcessed + harmonicRelationshipsSkipped === totalHarmonicRelationshipsGenerated;

  const allB4B1PopulationPositionPairsAccountedFor =
    b1PopulationPositionPairsInEligiblePopulations + b1PopulationPositionPairsInSkippedPopulations ===
    b4B1PopulationPositionPairsInput;
  const allB1OccurrencesResolve =
    b1EligiblePositionsMissing === 0 &&
    b1EligiblePositionsResolved === b1PopulationPositionPairsInEligiblePopulations;

  const crossPopulationGroupsInput = b4Result.crossPopulationCandidateGroups.length;
  const crossPopulationGroupsProcessed = crossPopulationGeometrySummaries.length;
  const crossPopulationGroupsSkipped = 0;
  const allCrossPopulationGroupsAccountedFor =
    crossPopulationGroupsProcessed + crossPopulationGroupsSkipped === crossPopulationGroupsInput;

  const allPeriodInvariantsHold = populationAnalyses.every(
    (p) => p.phaseAggregateInvariantAcrossPeriods
  );

  const allReconciled =
    allPhysicalPopulationsAccountedFor &&
    allPeriodCandidatesAccountedFor &&
    allPhaseCellsAccountedFor &&
    allHarmonicRelationshipsAccountedFor &&
    allB4B1PopulationPositionPairsAccountedFor &&
    allB1OccurrencesResolve &&
    allCrossPopulationGroupsAccountedFor &&
    allPeriodInvariantsHold;

  const reconciliation: PhaseHarmonicReconciliation = {
    b4PhysicalPopulationsInput,
    b5EligiblePhysicalPopulations,
    b5PhysicalPopulationsProcessed,
    b5PhysicalPopulationsSkipped,
    allPhysicalPopulationsAccountedFor,
    b4PeriodCandidatesInput,
    b5PeriodCandidatesProcessed,
    b5PeriodCandidatesSkipped,
    allPeriodCandidatesAccountedFor,
    phaseCellsGenerated: totalPhaseCellsGenerated,
    phaseCellsProcessed: totalPhaseCellsProcessed,
    phaseCellsSkipped,
    allPhaseCellsAccountedFor,
    harmonicRelationshipsGenerated: totalHarmonicRelationshipsGenerated,
    harmonicRelationshipsProcessed: totalHarmonicRelationshipsProcessed,
    harmonicRelationshipsSkipped,
    allHarmonicRelationshipsAccountedFor,
    b4B1PopulationPositionPairsInput,
    b1PopulationPositionPairsInEligiblePopulations,
    b1PopulationPositionPairsInSkippedPopulations,
    b1EligiblePositionsResolved,
    b1EligiblePositionsMissing,
    allB4B1PopulationPositionPairsAccountedFor,
    b1MissingPositions,
    uniqueB1PhysicalPositionsInEligiblePopulations: uniqueB1PhysicalPositionsInEligiblePopulations.size,
    uniqueB1PhysicalPositionsInSkippedPopulations: uniqueB1PhysicalPositionsInSkippedPopulations.size,
    b1PhysicalOccurrencePositionsConsidered: b1PopulationPositionPairsInEligiblePopulations,
    b1PhysicalOccurrencePositionsResolved: b1EligiblePositionsResolved,
    b1PhysicalOccurrencePositionsMissing: b1EligiblePositionsMissing,
    allB1OccurrencesResolve,
    crossPopulationGroupsInput,
    crossPopulationGroupsProcessed,
    crossPopulationGroupsSkipped,
    allCrossPopulationGroupsAccountedFor,
    allPeriodInvariantsHold,
    allReconciled,
  };

  stageTracker.current = 'reconciliation complete';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'reconciliation complete', {
    allReconciled,
  });

  // 7. Global Summary (Section 65 and 1E.2B.5a Sections 9, 27 & 1E.2B.5b Section 54)
  let periodsWithPositiveGain = 0;
  let periodsWithZeroGain = 0;
  let periodsWithNegativeGain = 0;
  let periodsWithStrongRecurrence = 0;
  let harmonicLowerMeetsHigherPooled = 0;
  let periodsWithExactMotif = 0;
  let periodsWithSameLaneDiffPhase = 0;

  let populationsWithStrongAbsoluteOffsetRecurrence = 0;
  const populationAbsoluteOffsetAgreementHistogram = {
    lessThan50: 0,
    from50To74: 0,
    from75To89: 0,
    from90To100: 0,
  };

  let periodViewsWithPositivePooledMixingPenalty = 0;
  let periodViewsWithZeroPooledMixingPenalty = 0;
  let periodViewsWithNegativePooledMixingPenalty = 0;
  let periodsWithEvidenceBearingRepeatedExactPhaseSignatureMotif = 0;

  for (const pa of populationAnalyses) {
    const agr = pa.absoluteCycleOffsetRecurrence.contextDominantAgreementPercentage;
    if (agr < 50) populationAbsoluteOffsetAgreementHistogram.lessThan50++;
    else if (agr < 75) populationAbsoluteOffsetAgreementHistogram.from50To74++;
    else if (agr < 90) populationAbsoluteOffsetAgreementHistogram.from75To89++;
    else populationAbsoluteOffsetAgreementHistogram.from90To100++;

    if (agr >= 75 && pa.cycleBlockCount >= 2) {
      populationsWithStrongAbsoluteOffsetRecurrence++;
    }

    for (const p of pa.periodPhaseAnalyses) {
      if (p.phaseAlignmentGainPercentagePoints > 0.0001) {
        periodsWithPositiveGain++;
      } else if (p.phaseAlignmentGainPercentagePoints < -0.0001) {
        periodsWithNegativeGain++;
      } else {
        periodsWithZeroGain++;
      }

      if (p.pooledMixingPenaltyPercentagePoints > 0.0001) {
        periodViewsWithPositivePooledMixingPenalty++;
      } else if (p.pooledMixingPenaltyPercentagePoints < -0.0001) {
        periodViewsWithNegativePooledMixingPenalty++;
      } else {
        periodViewsWithZeroPooledMixingPenalty++;
      }

      if (p.hasStrongPhaseAlignedRecurrence) periodsWithStrongRecurrence++;
      if (p.exactRepeatingPhaseSignatureMotif !== null) periodsWithExactMotif++;
      if (p.exactPhaseSignatureMotifEvidenceStatus === 'evidence-bearing') {
        periodsWithEvidenceBearingRepeatedExactPhaseSignatureMotif++;
      }
      if (p.primaryOccurrencesShareLaneAcrossDistinctPhases) periodsWithSameLaneDiffPhase++;
    }

    for (const h of pa.harmonicRelationships) {
      if (h.lowerPhaseAlignedAtLeastHigherPooled) {
        harmonicLowerMeetsHigherPooled++;
      }
    }
  }

  // Harmonic role recurrence global counters (1E.2B.5a Section 27 & 1E.2B.5b Section 54)
  let harmonicRelationshipsWithRoleConfirmedRecurrence = 0;
  let harmonicRelationshipsWithRoleReducedRecurrence = 0;
  let harmonicRelationshipsWithInsufficientCrossHigherEvidence = 0;
  let harmonicRelationshipsAllMaskedRoles = 0;
  let harmonicRelationshipsWithExactRoleSignatureMatchAcrossHigherPhases = 0;

  let harmonicRelationshipsCanonicalCrossHigherMeetsHigherPooled = 0;
  let harmonicRelationshipsCanonicalCrossHigherBelowHigherPooled = 0;
  let rolesWithCrossHigherComparableLanes = 0;
  let rolesWithoutCrossHigherComparableLanes = 0;

  for (const pa of populationAnalyses) {
    for (const h of pa.harmonicRelationships) {
      if (h.roleRecurrenceStatus === 'confirmed-recurrence') {
        harmonicRelationshipsWithRoleConfirmedRecurrence++;
      } else if (h.roleRecurrenceStatus === 'reduced-recurrence') {
        harmonicRelationshipsWithRoleReducedRecurrence++;
      } else if (h.roleRecurrenceStatus === 'insufficient-cross-higher-evidence') {
        harmonicRelationshipsWithInsufficientCrossHigherEvidence++;
      } else if (h.roleRecurrenceStatus === 'all-masked') {
        harmonicRelationshipsAllMaskedRoles++;
      }
      if (h.allRolesExactContextSignatureMatchAcrossHigherPhases) {
        harmonicRelationshipsWithExactRoleSignatureMatchAcrossHigherPhases++;
      }

      if (h.crossHigherRoleRecurrenceAtLeastHigherPooled === true) {
        harmonicRelationshipsCanonicalCrossHigherMeetsHigherPooled++;
      } else if (h.crossHigherRoleRecurrenceAtLeastHigherPooled === false) {
        harmonicRelationshipsCanonicalCrossHigherBelowHigherPooled++;
      }
      rolesWithCrossHigherComparableLanes += h.rolesWithCrossHigherComparableLanes;
      rolesWithoutCrossHigherComparableLanes += h.rolesWithoutCrossHigherComparableLanes;
    }
  }

  let totalCrossPopMatches = 0;
  for (const c of crossPopulationGeometrySummaries) {
    totalCrossPopMatches += c.exactPrimaryGeometryMatches.length;
  }

  const globalSummary: GlobalPhaseHarmonicSummary = {
    physicalPopulationsAnalyzed: populationAnalyses.length,
    populationsWithStrongAbsoluteOffsetRecurrence,
    populationsWithoutStrongAbsoluteOffsetRecurrence:
      populationAnalyses.length - populationsWithStrongAbsoluteOffsetRecurrence,
    populationAbsoluteOffsetAgreementHistogram,
    periodCandidatesAnalyzed: b5PeriodCandidatesProcessed,
    periodViewsWithPositivePooledMixingPenalty,
    periodViewsWithZeroPooledMixingPenalty,
    periodViewsWithNegativePooledMixingPenalty,
    periodsWithPositivePhaseAlignmentGain: periodsWithPositiveGain,
    periodsWithZeroPhaseAlignmentGain: periodsWithZeroGain,
    periodsWithNegativePhaseAlignmentGain: periodsWithNegativeGain,
    periodsWithStrongPhaseAlignedRecurrence: periodsWithStrongRecurrence,
    harmonicRelationshipsAnalyzed: totalHarmonicRelationshipsProcessed,
    harmonicRelationshipsWhereLowerPhaseAlignedMeetsHigherPooled: harmonicLowerMeetsHigherPooled,
    harmonicRelationshipsWithRoleConfirmedRecurrence,
    harmonicRelationshipsWithRoleReducedRecurrence,
    harmonicRelationshipsWithInsufficientCrossHigherEvidence,
    harmonicRelationshipsAllMaskedRoles,
    harmonicRelationshipsWithExactRoleSignatureMatchAcrossHigherPhases,
    harmonicRelationshipsWithCanonicalCrossHigherRecurrence: harmonicRelationshipsWithRoleConfirmedRecurrence,
    harmonicRelationshipsCanonicalCrossHigherMeetsHigherPooled,
    harmonicRelationshipsCanonicalCrossHigherBelowHigherPooled,
    rolesWithCrossHigherComparableLanes,
    rolesWithoutCrossHigherComparableLanes,
    periodsWithRepeatedExactPhaseSignatureMotif: periodsWithExactMotif,
    periodsWithEvidenceBearingRepeatedExactPhaseSignatureMotif,
    periodsWithPrimarySameLaneAcrossDistinctPhases: periodsWithSameLaneDiffPhase,
    crossPopulationGeometryMatches: totalCrossPopMatches,
  };

  stageTracker.current = 'export constructed';
  logStageCheckpoint(operationId, 'research', 'palettePhaseHarmonic', 'export constructed');

  return {
    status: allReconciled ? 'SUCCESS' : 'PARTIAL',
    failureReason: allReconciled ? undefined : 'Reconciliation checks failed.',
    metadata: {
      operationId,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      milestone: '1E.2B.5b',
    },
    fixture: {
      exePath,
      exeSize,
    },
    sourceB1Summary: {
      externalLogicalMatches: b1Result.globalSummary?.totalExternalLogicalMatches ?? 0,
      uniquePhysicalPositions: b1Result.globalSummary?.uniqueExternalPhysicalOccurrencePositions ?? 0,
      omittedTruncatedOccurrences: b1Result.truncationSummary?.totalOccurrencesOmitted ?? 0,
    },
    sourceB2Summary: {
      clustersCount: b2Result.trackB?.clusters?.length ?? 0,
      clusteredPositions: b2Result.reconciliation?.clusteredPositions ?? 0,
      unclusteredPositions: b2Result.reconciliation?.unclusteredPositions ?? 0,
    },
    sourceB3Summary: {
      b2ClustersProcessed: b3Result.globalStructuralSummary?.b2ClustersProcessed ?? 0,
      repeatedTargetGroupsProcessed: b3Result.globalStructuralSummary?.repeatedTargetGroupsDerived ?? 0,
      motifsFound: b3Result.globalStructuralSummary?.clustersWithRepeatingDeltaMotif ?? 0,
      allReconciled: b3Result.reconciliation?.allReconciled ?? false,
    },
    sourceB4Summary: {
      uniquePhysicalCyclePopulations: b4Result.globalSummary?.uniquePhysicalCyclePopulations ?? 0,
      totalPeriodCandidatesTested: b4Result.globalSummary?.totalPeriodCandidatesTested ?? 0,
      allReconciled: b4Result.reconciliation?.allReconciled ?? false,
    },
    scanConfiguration: getDefaultPhaseHarmonicScanConfiguration(),
    reconciliation,
    globalSummary,
    physicalPopulationPhaseAnalyses: populationAnalyses,
    crossPopulationGeometrySummaries,
    knownAnchorControlSummary,
    negativeControlSummary,
  };
}

function createFailedResult(
  operationId: string,
  startTime: number,
  exePath: string,
  exeSize: number,
  failureReason: string,
  b1Result: MK1PaletteReferenceReconResult,
  b2Result: MK1PaletteOccurrenceContextResult,
  b3Result: MK1PaletteRepeatedStructureResult,
  b4Result: MK1PaletteCycleLayoutResult,
  lastSuccessfulStage?: B5Stage,
  errorObj?: { name: string; message: string; stack?: string; cause?: unknown }
): MK1PalettePhaseHarmonicResult {
  return {
    status: 'FAILED',
    failureReason,
    error: errorObj,
    lastSuccessfulStage,
    metadata: {
      operationId,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      milestone: '1E.2B.5b',
    },
    fixture: {
      exePath,
      exeSize,
    },
    sourceB1Summary: {
      externalLogicalMatches: b1Result.globalSummary?.totalExternalLogicalMatches ?? 0,
      uniquePhysicalPositions: b1Result.globalSummary?.uniqueExternalPhysicalOccurrencePositions ?? 0,
      omittedTruncatedOccurrences: b1Result.truncationSummary?.totalOccurrencesOmitted ?? 0,
    },
    sourceB2Summary: {
      clustersCount: b2Result.trackB?.clusters?.length ?? 0,
      clusteredPositions: b2Result.reconciliation?.clusteredPositions ?? 0,
      unclusteredPositions: b2Result.reconciliation?.unclusteredPositions ?? 0,
    },
    sourceB3Summary: {
      b2ClustersProcessed: b3Result.globalStructuralSummary?.b2ClustersProcessed ?? 0,
      repeatedTargetGroupsProcessed: b3Result.globalStructuralSummary?.repeatedTargetGroupsDerived ?? 0,
      motifsFound: b3Result.globalStructuralSummary?.clustersWithRepeatingDeltaMotif ?? 0,
      allReconciled: b3Result.reconciliation?.allReconciled ?? false,
    },
    sourceB4Summary: {
      uniquePhysicalCyclePopulations: b4Result.globalSummary?.uniquePhysicalCyclePopulations ?? 0,
      totalPeriodCandidatesTested: b4Result.globalSummary?.totalPeriodCandidatesTested ?? 0,
      allReconciled: b4Result.reconciliation?.allReconciled ?? false,
    },
    scanConfiguration: getDefaultPhaseHarmonicScanConfiguration(),
    reconciliation: {
      b4PhysicalPopulationsInput: 0,
      b5EligiblePhysicalPopulations: 0,
      b5PhysicalPopulationsProcessed: 0,
      b5PhysicalPopulationsSkipped: 0,
      allPhysicalPopulationsAccountedFor: false,
      b4PeriodCandidatesInput: 0,
      b5PeriodCandidatesProcessed: 0,
      b5PeriodCandidatesSkipped: 0,
      allPeriodCandidatesAccountedFor: false,
      phaseCellsGenerated: 0,
      phaseCellsProcessed: 0,
      phaseCellsSkipped: 0,
      allPhaseCellsAccountedFor: false,
      harmonicRelationshipsGenerated: 0,
      harmonicRelationshipsProcessed: 0,
      harmonicRelationshipsSkipped: 0,
      allHarmonicRelationshipsAccountedFor: false,
      b4B1PopulationPositionPairsInput: 0,
      b1PopulationPositionPairsInEligiblePopulations: 0,
      b1PopulationPositionPairsInSkippedPopulations: 0,
      b1EligiblePositionsResolved: 0,
      b1EligiblePositionsMissing: 0,
      allB4B1PopulationPositionPairsAccountedFor: false,
      b1PhysicalOccurrencePositionsConsidered: 0,
      b1PhysicalOccurrencePositionsResolved: 0,
      b1PhysicalOccurrencePositionsMissing: 0,
      b1MissingPositions: [],
      allB1OccurrencesResolve: false,
      crossPopulationGroupsInput: 0,
      crossPopulationGroupsProcessed: 0,
      crossPopulationGroupsSkipped: 0,
      allCrossPopulationGroupsAccountedFor: false,
      allPeriodInvariantsHold: false,
      allReconciled: false,
    },
    globalSummary: {
      physicalPopulationsAnalyzed: 0,
      populationsWithStrongAbsoluteOffsetRecurrence: 0,
      populationsWithoutStrongAbsoluteOffsetRecurrence: 0,
      populationAbsoluteOffsetAgreementHistogram: {
        lessThan50: 0,
        from50To74: 0,
        from75To89: 0,
        from90To100: 0,
      },
      periodCandidatesAnalyzed: 0,
      periodViewsWithPositivePooledMixingPenalty: 0,
      periodViewsWithZeroPooledMixingPenalty: 0,
      periodViewsWithNegativePooledMixingPenalty: 0,
      periodsWithPositivePhaseAlignmentGain: 0,
      periodsWithZeroPhaseAlignmentGain: 0,
      periodsWithNegativePhaseAlignmentGain: 0,
      periodsWithStrongPhaseAlignedRecurrence: 0,
      harmonicRelationshipsAnalyzed: 0,
      harmonicRelationshipsWhereLowerPhaseAlignedMeetsHigherPooled: 0,
      harmonicRelationshipsWithRoleConfirmedRecurrence: 0,
      harmonicRelationshipsWithRoleReducedRecurrence: 0,
      harmonicRelationshipsWithInsufficientCrossHigherEvidence: 0,
      harmonicRelationshipsAllMaskedRoles: 0,
      harmonicRelationshipsWithExactRoleSignatureMatchAcrossHigherPhases: 0,
      harmonicRelationshipsWithCanonicalCrossHigherRecurrence: 0,
      harmonicRelationshipsCanonicalCrossHigherMeetsHigherPooled: 0,
      harmonicRelationshipsCanonicalCrossHigherBelowHigherPooled: 0,
      rolesWithCrossHigherComparableLanes: 0,
      rolesWithoutCrossHigherComparableLanes: 0,
      periodsWithRepeatedExactPhaseSignatureMotif: 0,
      periodsWithEvidenceBearingRepeatedExactPhaseSignatureMotif: 0,
      periodsWithPrimarySameLaneAcrossDistinctPhases: 0,
      crossPopulationGeometryMatches: 0,
    },
    physicalPopulationPhaseAnalyses: [],
    crossPopulationGeometrySummaries: [],
    knownAnchorControlSummary: [],
    negativeControlSummary: deriveNegativeControlSummary(b1Result, b2Result, 0, []),
  };
}

/**
 * Creates the compact JSON export for Milestone 1E.2B.5b.
 * Schema: mk1_palette_phase_harmonic_recon_v1 (Sections 67, 68).
 */
export function createMK1CompactPalettePhaseHarmonicExport(
  result: MK1PalettePhaseHarmonicResult
): MK1CompactPalettePhaseHarmonicExport {
  return {
    format: 'mk1_palette_phase_harmonic_recon_v1',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    metadata: {
      operationId: result.metadata.operationId,
      timestamp: result.metadata.timestamp,
      durationMs: result.metadata.durationMs,
      milestone: '1E.2B.5b',
    },
    fixture: result.fixture,
    sourceB1Summary: result.sourceB1Summary,
    sourceB2Summary: result.sourceB2Summary,
    sourceB3Summary: result.sourceB3Summary,
    sourceB4Summary: result.sourceB4Summary,
    scanConfiguration: result.scanConfiguration,
    reconciliation: result.reconciliation,
    globalSummary: result.globalSummary,
    physicalPopulationPhaseAnalyses: result.physicalPopulationPhaseAnalyses,
    crossPopulationGeometrySummaries: result.crossPopulationGeometrySummaries,
    knownAnchorControlSummary: result.knownAnchorControlSummary,
    negativeControlSummary: result.negativeControlSummary,
  };
}
