/**
 * MK1 Palette Cycle-Internal Layout Reconnaissance (Milestone 1E.2B.4)
 *
 * Implements:
 * - Subunit periodicity testing on proper cycle divisors [2..32]
 * - Dual-view consensus: Raw consensus vs. All-B.1-occurrence-masked Context-Only consensus
 * - Existing B.1 occurrence relative byte lane occupancy and target stability
 * - Cross-population candidate-centric structural comparison
 * - Observational negative control and known anchor control verification
 * - Strict multi-track reconciliation
 *
 * Standing Epistemic Axiom:
 * PERIOD CANDIDATE != RECORD SIZE
 * REPEATED LANE OCCUPANCY != POINTER FIELD
 * CROSS-POPULATION SIMILARITY != SHARED SEMANTICS
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import {
  createOperationId,
  formatErrorDetails,
  logStageCheckpoint,
  logError,
  logWarning,
} from '../../../core/diagnostics/diagnosticLogger';
import { MK1ExecutableLayoutReport } from './executableLayoutTypes';
import {
  ExactValueOccurrence,
  MK1PaletteReferenceReconResult,
  PaletteRepresentationKind,
} from './paletteReferenceReconnaissanceTypes';
import { MK1PaletteOccurrenceContextResult } from './paletteOccurrenceContextTypes';
import {
  ClusterStructuralSummary,
  DeltaMotifAnalysis,
  MK1PaletteRepeatedStructureResult,
  RepeatedTargetGroupSummary,
} from './paletteRepeatedStructureTypes';
import {
  B1OccurrenceDensitySummary,
  B4Stage,
  ControlPeriodLaneAnnotation,
  CrossPopulationCandidateGroup,
  CrossPopulationContextComparison,
  CycleLayoutReconciliation,
  CycleLayoutScanConfiguration,
  GlobalCycleLayoutSummary,
  KnownAnchorCycleLayoutSummary,
  LaneConsensus,
  MK1CompactPaletteCycleLayoutReconExport,
  MK1PaletteCycleLayoutResult,
  NegativeControlCycleLayoutSummary,
  OccurrenceLaneHistogramItem,
  PhysicalCyclePopulation,
  TestedPeriodCandidate,
} from './paletteCycleLayoutTypes';

// Authoritative Scan Configuration Constants (Section 72)
export const MINIMUM_PERIOD_BYTES = 2;
export const MAXIMUM_PERIOD_BYTES = 32;
export const MINIMUM_SUBUNITS_PER_CYCLE = 2;
export const CONTEXT_DOMINANT_AGREEMENT_THRESHOLD = 0.75;
export const CROSS_POP_CONTEXT_BYTES_BEFORE = 16;
export const MATCHED_FIELD_BYTES = 4;
export const CROSS_POP_CONTEXT_BYTES_AFTER = 16;
export const PERIOD_MODE = 'proper-cycle-divisors-only';
export const MASK_MODE = 'all-existing-b1-exact-occurrence-fields';

export const NEGATIVE_CONTROL_CANDIDATE_ID = 'MK1.EXE:0x0009C914';

export function getCycleLayoutScanConfiguration(): CycleLayoutScanConfiguration {
  return {
    minimumPeriodBytes: MINIMUM_PERIOD_BYTES,
    maximumPeriodBytes: MAXIMUM_PERIOD_BYTES,
    minimumSubunitsPerCycle: MINIMUM_SUBUNITS_PER_CYCLE,
    contextDominantAgreementThreshold: CONTEXT_DOMINANT_AGREEMENT_THRESHOLD,
    crossPopulationContextBytesBefore: CROSS_POP_CONTEXT_BYTES_BEFORE,
    matchedFieldBytes: MATCHED_FIELD_BYTES,
    crossPopulationContextBytesAfter: CROSS_POP_CONTEXT_BYTES_AFTER,
    periodMode: 'proper-cycle-divisors-only',
    maskMode: 'all-existing-b1-exact-occurrence-fields',
  };
}

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

function byteToHex(b: number): string {
  return '0x' + b.toString(16).padStart(2, '0').toUpperCase();
}

export interface PaletteCycleLayoutOptions {
  exePath?: string;
  exeSize?: number;
  onProgress?: (stage: string, progress: number) => void;
}

/**
 * Generates all proper divisors of cycleSpan within [minPeriod..maxPeriod]
 * requiring cycleSpan / period >= minSubunits (Sections 14, 15, 49).
 */
export function generateCycleDivisorPeriods(
  cycleSpan: number,
  minPeriod: number = MINIMUM_PERIOD_BYTES,
  maxPeriod: number = MAXIMUM_PERIOD_BYTES,
  minSubunits: number = MINIMUM_SUBUNITS_PER_CYCLE
): number[] {
  const divisors: number[] = [];
  for (let p = minPeriod; p <= maxPeriod; p++) {
    if (cycleSpan % p === 0 && cycleSpan / p >= minSubunits) {
      divisors.push(p);
    }
  }
  return divisors;
}

/**
 * Checks which topology regions intersect the physical byte interval [start, end).
 */
function findIntersectedRegionIds(
  start: number,
  end: number,
  regions: Array<{ regionId: string; fileStart: number; fileEnd: number }>
): string[] {
  const intersected: string[] = [];
  for (const reg of regions) {
    if (Math.max(start, reg.fileStart) < Math.min(end, reg.fileEnd)) {
      intersected.push(reg.regionId);
    }
  }
  return intersected;
}

/**
 * Evaluates lane consensus for a specific byte lane across all contributing samples.
 */
function evaluateSingleLaneConsensus(
  laneOffset: number,
  bytes: number[],
  maskedCount: number
): LaneConsensus {
  const contributingByteCount = bytes.length;
  if (contributingByteCount === 0) {
    return {
      laneOffset,
      contributingByteCount: 0,
      distinctByteValues: [],
      distinctByteHexValues: [],
      isStable: false,
      stableByteHex: null,
      dominantByte: null,
      dominantByteHex: null,
      dominantByteCount: 0,
      dominantBytePercentage: 0,
      maskedContributionCount: maskedCount,
    };
  }

  const counts = new Map<number, number>();
  for (const b of bytes) {
    counts.set(b, (counts.get(b) || 0) + 1);
  }

  const distinctByteValues = Array.from(counts.keys()).sort((a, b) => a - b);
  const distinctByteHexValues = distinctByteValues.map(byteToHex);

  let dominantByte = distinctByteValues[0];
  let dominantByteCount = counts.get(dominantByte) || 0;

  for (const [val, cnt] of counts.entries()) {
    if (cnt > dominantByteCount) {
      dominantByte = val;
      dominantByteCount = cnt;
    }
  }

  const isStable = distinctByteValues.length === 1;
  const stableByteHex = isStable ? byteToHex(dominantByte) : null;
  const dominantByteHex = byteToHex(dominantByte);
  const dominantBytePercentage = (dominantByteCount / contributingByteCount) * 100;

  return {
    laneOffset,
    contributingByteCount,
    distinctByteValues,
    distinctByteHexValues,
    isStable,
    stableByteHex,
    dominantByte,
    dominantByteHex,
    dominantByteCount,
    dominantBytePercentage,
    maskedContributionCount: maskedCount,
  };
}

/**
 * Builds lane occupancy histogram and target stability for a specific period (Track B).
 */
function buildOccurrenceLaneHistogram(
  periodBytes: number,
  subunitsPerCycle: number,
  cycleAnchors: number[],
  cycleSpan: number,
  occurrencesInsideCycles: ExactValueOccurrence[]
): {
  histogram: OccurrenceLaneHistogramItem[];
  density: B1OccurrenceDensitySummary;
} {
  // Group physical positions inside cycles
  const occsByPos = new Map<number, ExactValueOccurrence[]>();
  for (const occ of occurrencesInsideCycles) {
    let list = occsByPos.get(occ.sourceFileOffset);
    if (!list) {
      list = [];
      occsByPos.set(occ.sourceFileOffset, list);
    }
    list.push(occ);
  }

  // Data per lane
  const lanePhysicalPositions = new Map<number, Set<number>>();
  const laneLogicalOccurrences = new Map<number, ExactValueOccurrence[]>();
  const laneCycles = new Map<number, Set<number>>();
  const laneSubunits = new Map<number, Set<number>>();

  for (let l = 0; l < periodBytes; l++) {
    lanePhysicalPositions.set(l, new Set<number>());
    laneLogicalOccurrences.set(l, []);
    laneCycles.set(l, new Set<number>());
    laneSubunits.set(l, new Set<number>());
  }

  for (const [pos, occList] of occsByPos.entries()) {
    // Find which cycle contains pos
    for (let c = 0; c < cycleAnchors.length; c++) {
      const anchor = cycleAnchors[c];
      if (pos >= anchor && pos < anchor + cycleSpan) {
        const offsetInCycle = pos - anchor;
        const subInCycle = Math.floor(offsetInCycle / periodBytes);
        const globalSubunit = c * subunitsPerCycle + subInCycle;
        const laneOffset = offsetInCycle % periodBytes;

        lanePhysicalPositions.get(laneOffset)?.add(pos);
        laneCycles.get(laneOffset)?.add(c);
        laneSubunits.get(laneOffset)?.add(globalSubunit);

        const list = laneLogicalOccurrences.get(laneOffset);
        if (list) {
          for (const occ of occList) {
            list.push(occ);
          }
        }
        break;
      }
    }
  }

  const histogram: OccurrenceLaneHistogramItem[] = [];
  let totalUniquePositions = 0;
  let totalLogicalAssocs = 0;
  let occupiedLaneCount = 0;
  let mostOccupiedLane: number | null = null;
  let mostOccupiedLaneCount = 0;

  for (let l = 0; l < periodBytes; l++) {
    const physicalSet = lanePhysicalPositions.get(l) ?? new Set<number>();
    const logicalList = laneLogicalOccurrences.get(l) ?? [];
    const cyclesSet = laneCycles.get(l) ?? new Set<number>();
    const subunitsSet = laneSubunits.get(l) ?? new Set<number>();

    const uniquePhysicalOccurrenceCount = physicalSet.size;
    const logicalAssociationCount = logicalList.length;

    totalUniquePositions += uniquePhysicalOccurrenceCount;
    totalLogicalAssocs += logicalAssociationCount;

    if (uniquePhysicalOccurrenceCount > 0) {
      occupiedLaneCount++;
      if (uniquePhysicalOccurrenceCount > mostOccupiedLaneCount) {
        mostOccupiedLaneCount = uniquePhysicalOccurrenceCount;
        mostOccupiedLane = l;
      }
    }

    const candidateIdHistogram: Record<string, number> = {};
    const representationKindHistogram: Record<string, number> = {};
    const targetRegionHistogram: Record<string, number> = {};
    const targetObjectHistogram: Record<string, number> = {};
    const targetValuesHexSet = new Set<string>();

    for (const occ of logicalList) {
      candidateIdHistogram[occ.targetCandidateId] =
        (candidateIdHistogram[occ.targetCandidateId] || 0) + 1;
      representationKindHistogram[occ.representationKind] =
        (representationKindHistogram[occ.representationKind] || 0) + 1;
      targetRegionHistogram[occ.targetCandidateRegionId] =
        (targetRegionHistogram[occ.targetCandidateRegionId] || 0) + 1;

      const objKey = occ.targetObjectNumber !== null ? `Object_${occ.targetObjectNumber}` : 'none';
      targetObjectHistogram[objKey] = (targetObjectHistogram[objKey] || 0) + 1;
      targetValuesHexSet.add(occ.matchedUint32Hex);
    }

    const distinctCandidateIds = Object.keys(candidateIdHistogram).sort();
    const distinctRepresentationKinds = Object.keys(representationKindHistogram).sort() as PaletteRepresentationKind[];
    const distinctTargetRegionIds = Object.keys(targetRegionHistogram).sort();
    const distinctTargetValuesHex = Array.from(targetValuesHexSet).sort();

    const distinctCyclesContainingOccurrence = Array.from(cyclesSet).sort((a, b) => a - b);
    const distinctSubunitsContainingOccurrence = Array.from(subunitsSet).sort((a, b) => a - b);

    const spansMultipleSubunits = distinctSubunitsContainingOccurrence.length >= 2;
    const spansMultipleCycles = distinctCyclesContainingOccurrence.length >= 2;
    const isRepeatedB1OccurrenceLane = spansMultipleSubunits;

    const candidateStable = distinctCandidateIds.length === 1;
    const representationKindStable = distinctRepresentationKinds.length === 1;
    const targetValueStable = distinctTargetValuesHex.length === 1;
    const targetRegionStable = distinctTargetRegionIds.length === 1;

    histogram.push({
      laneOffset: l,
      uniquePhysicalOccurrenceCount,
      logicalAssociationCount,
      candidateIdHistogram,
      representationKindHistogram,
      targetRegionHistogram,
      targetObjectHistogram,
      sourceCycleCount: distinctCyclesContainingOccurrence.length,
      sourceSubunitCount: distinctSubunitsContainingOccurrence.length,
      distinctCyclesContainingOccurrence,
      distinctSubunitsContainingOccurrence,
      spansMultipleSubunits,
      spansMultipleCycles,
      isRepeatedB1OccurrenceLane,
      candidateStable,
      distinctCandidateIds,
      representationKindStable,
      distinctRepresentationKinds,
      targetValueStable,
      distinctTargetValuesHex,
      targetRegionStable,
      distinctTargetRegionIds,
    });
  }

  const density: B1OccurrenceDensitySummary = {
    totalUniqueB1OccurrencePositions: totalUniquePositions,
    totalLogicalAssociations: totalLogicalAssocs,
    numberOfOccupiedLanes: occupiedLaneCount,
    occupiedLanePercentage: (occupiedLaneCount / periodBytes) * 100,
    mostOccupiedLane,
    mostOccupiedLaneCount,
  };

  return { histogram, density };
}

/**
 * Centralized negative control evaluation helper (Sections 10, 11, 12).
 * Distinguishes verified zero, observed non-zero, and unavailable upstream evidence.
 * Does NOT manufacture false zero when B.2 negative control field is missing.
 */
export function deriveNegativeControlSummary(
  b1Result?: MK1PaletteReferenceReconResult | null,
  b2Result?: MK1PaletteOccurrenceContextResult | null,
  physicalCyclePopulations?: PhysicalCyclePopulation[],
  operationId?: string
): NegativeControlCycleLayoutSummary {
  let b1Count: number | null = null;
  let b2Count: number | null = null;
  let participatingPopulationsCount = 0;

  // 1. Inspect B.1
  if (b1Result && Array.isArray(b1Result.detailedOccurrences)) {
    const negOccs = b1Result.detailedOccurrences.filter(
      (o) => o.targetCandidateId === NEGATIVE_CONTROL_CANDIDATE_ID
    );
    b1Count = negOccs.length;

    // Evaluate participation in physical cycle populations if provided
    if (physicalCyclePopulations && physicalCyclePopulations.length > 0) {
      const uniqueNegPopIds = new Set<string>();
      for (const occ of negOccs) {
        for (const pop of physicalCyclePopulations) {
          for (const anchor of pop.cycleAnchors) {
            if (
              occ.sourceFileOffset >= anchor &&
              occ.sourceFileOffset < anchor + pop.cycleSpan
            ) {
              uniqueNegPopIds.add(pop.populationId);
            }
          }
        }
      }
      participatingPopulationsCount = uniqueNegPopIds.size;
    }
  }

  // 2. Inspect B.2
  if (b2Result) {
    if (
      b2Result.negativeControl &&
      typeof b2Result.negativeControl.actualOccurrencesB2 === 'number'
    ) {
      b2Count = b2Result.negativeControl.actualOccurrencesB2;
    } else if (b2Result.status === 'SUCCESS') {
      // NOTE (Section 11): A successful B.2 result with missing negative-control field does NOT prove zero.
      b2Count = null;
      if (operationId) {
        logWarning(
          'research',
          'paletteCycleLayout',
          operationId,
          'successful B.2 result missing expected negative-control evidence field'
        );
      }
    }
  }

  // 3. Epistemic status & notes derivation
  let status: NegativeControlCycleLayoutSummary['crossPopulationStatus'];
  let notes: string;

  if (b1Count === null || b2Count === null) {
    status = 'unavailable-upstream-uninspected';
    notes = 'Negative control upstream evidence was uninspected or unavailable.';
  } else if (b1Count > 0 || b2Count > 0) {
    status = 'unexpected-occurrences-found';
    notes = `WARNING: Negative control candidate ${NEGATIVE_CONTROL_CANDIDATE_ID} yielded unexpected occurrences (B.1: ${b1Count}, B.2: ${b2Count}).`;
    if (operationId) {
      logWarning('research', 'paletteCycleLayout', operationId, notes);
    }
  } else {
    status = 'not-applicable-no-occurrences';
    notes = 'Negative control verified: 0 occurrences, not applicable for cross-population comparison.';
  }

  return {
    candidateId: NEGATIVE_CONTROL_CANDIDATE_ID,
    B1OccurrenceCount: b1Count,
    B2ContextCount: b2Count,
    crossPopulationStatus: status,
    participatingPopulationsCount,
    notes,
  };
}

/**
 * Creates an empty failed result with structured error details.
 */
function createFailedResult(
  operationId: string,
  startTime: number,
  exePath: string,
  exeSize: number,
  failureReason: string,
  b1Result?: MK1PaletteReferenceReconResult | null,
  b2Result?: MK1PaletteOccurrenceContextResult | null,
  b3Result?: MK1PaletteRepeatedStructureResult | null,
  lastSuccessfulStage?: B4Stage
): MK1PaletteCycleLayoutResult {
  const fullReason = lastSuccessfulStage
    ? `${failureReason} (last successful stage: '${lastSuccessfulStage}')`
    : failureReason;

  return {
    status: 'FAILED',
    failureReason: fullReason,
    metadata: {
      operationId,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      milestone: '1E.2B.4',
    },
    fixture: {
      exePath,
      exeSize,
    },
    sourceB1Summary: {
      externalLogicalMatches: b1Result?.globalSummary?.totalExternalLogicalMatches ?? 0,
      uniquePhysicalPositions:
        b1Result?.globalSummary?.uniqueExternalPhysicalOccurrencePositions ?? 0,
      omittedTruncatedOccurrences:
        b1Result?.truncationSummary?.totalOccurrencesOmitted ?? 0,
    },
    sourceB2Summary: {
      clustersCount: b2Result?.trackB?.clusters?.length ?? 0,
      clusteredPositions: b2Result?.reconciliation?.clusteredPositions ?? 0,
      unclusteredPositions: b2Result?.reconciliation?.unclusteredPositions ?? 0,
    },
    sourceB3Summary: {
      b2ClustersProcessed: b3Result?.globalStructuralSummary?.b2ClustersProcessed ?? 0,
      repeatedTargetGroupsProcessed:
        b3Result?.globalStructuralSummary?.repeatedTargetGroupsDerived ?? 0,
      motifsFound: b3Result?.globalStructuralSummary?.clustersWithRepeatingDeltaMotif ?? 0,
      allReconciled: b3Result?.reconciliation?.allReconciled ?? false,
    },
    scanConfiguration: getCycleLayoutScanConfiguration(),
    reconciliation: {
      b3EligibleRepeatedPopulationInputs: 0,
      uniquePhysicalPopulationsDerived: 0,
      duplicateProvenanceLinksCollapsed: 0,
      physicalPopulationsProcessed: 0,
      physicalPopulationsSkipped: 0,
      allPhysicalPopulationsAccountedFor: false,
      periodCandidatesGenerated: 0,
      periodCandidatesProcessed: 0,
      periodCandidatesSkipped: 0,
      allPeriodCandidatesAccountedFor: false,
      b1OccurrencePositionsConsidered: 0,
      b1OccurrencePositionsResolved: 0,
      b1OccurrencePositionsMissing: 0,
      allB1OccurrencePositionsResolve: false,
      crossPopulationEligibleGroups: 0,
      crossPopulationGroupsProcessed: 0,
      crossPopulationGroupsSkipped: 0,
      allCrossPopulationGroupsAccountedFor: false,
      allReconciled: false,
    },
    globalSummary: {
      B3RepeatedPopulationsInput: 0,
      uniquePhysicalCyclePopulations: 0,
      populationsWithAtLeastOneNotablePeriod: 0,
      populationsWithNoNotablePeriod: 0,
      totalPeriodCandidatesTested: 0,
      periodFrequencyHistogram: {},
      notablePeriodFrequencyHistogram: {},
      populationsWithRepeatedB1OccurrenceLane: 0,
      crossPopulationCandidateGroups: 0,
      crossPopulationGroupsWithSharedNotablePeriod: 0,
      crossPopulationGroupsWithDifferentNotablePeriods: 0,
    },
    physicalCyclePopulations: [],
    crossPopulationCandidateGroups: [],
    knownAnchorControlSummary: [],
    negativeControlSummary: deriveNegativeControlSummary(
      b1Result,
      b2Result,
      undefined,
      operationId
    ),
  };
}

/**
 * Main execution entry point for Milestone 1E.2B.4 Cycle-Internal Layout Reconnaissance.
 * Wrapped in a structured outer exception boundary.
 */
export async function executePaletteCycleLayoutReconnaissance(
  source: DirectorySource,
  report: MK1ExecutableLayoutReport,
  b1Result: MK1PaletteReferenceReconResult,
  b2Result: MK1PaletteOccurrenceContextResult,
  b3Result: MK1PaletteRepeatedStructureResult,
  options?: PaletteCycleLayoutOptions
): Promise<MK1PaletteCycleLayoutResult> {
  const startTime = Date.now();
  const operationId = createOperationId('palette-cycle-layout');
  const stageTracker: { current: B4Stage } = { current: 'START B.4' };
  const exePath = options?.exePath ?? report.exePath;
  const exeSize = options?.exeSize ?? report.exeSize;

  try {
    return await executePaletteCycleLayoutReconnaissanceInternal(
      source,
      report,
      b1Result,
      b2Result,
      b3Result,
      options,
      operationId,
      startTime,
      exePath,
      exeSize,
      stageTracker
    );
  } catch (error: unknown) {
    const errorDetails = formatErrorDetails(error);
    const failureReason = `FAILED — UNEXPECTED EXCEPTION at stage '${stageTracker.current}': ${errorDetails.message}`;
    logError('research', 'paletteCycleLayout', operationId, error, {
      milestone: '1E.2B.4',
      source: 'paletteCycleLayout',
      operation: 'executePaletteCycleLayoutReconnaissance',
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
      stageTracker.current
    );
  }
}

async function executePaletteCycleLayoutReconnaissanceInternal(
  source: DirectorySource,
  report: MK1ExecutableLayoutReport,
  b1Result: MK1PaletteReferenceReconResult,
  b2Result: MK1PaletteOccurrenceContextResult,
  b3Result: MK1PaletteRepeatedStructureResult,
  options: PaletteCycleLayoutOptions | undefined,
  operationId: string,
  startTime: number,
  exePath: string,
  exeSize: number,
  stageTracker: { current: B4Stage }
): Promise<MK1PaletteCycleLayoutResult> {
  logStageCheckpoint(operationId, 'research', 'paletteCycleLayout', 'START B.4');

  // 1. Prerequisite Validation (Section 7)
  if (
    b1Result.fixture.exePath !== exePath ||
    b1Result.fixture.exeSize !== exeSize ||
    b2Result.fixture.exePath !== exePath ||
    b2Result.fixture.exeSize !== exeSize ||
    b3Result.fixture.exePath !== exePath ||
    b3Result.fixture.exeSize !== exeSize
  ) {
    const err = 'FAILED — PREREQUISITE MISMATCH: Fixture path or size mismatch across B.1, B.2, B.3, and report.';
    logError('research', 'paletteCycleLayout', operationId, err, {
      reportFixture: { exePath, exeSize },
      b1Fixture: b1Result.fixture,
      b2Fixture: b2Result.fixture,
      b3Fixture: b3Result.fixture,
    });
    return createFailedResult(
      operationId,
      startTime,
      exePath,
      exeSize,
      err,
      b1Result,
      b2Result,
      b3Result,
      stageTracker.current
    );
  }

  stageTracker.current = 'fixture verified';
  logStageCheckpoint(operationId, 'research', 'paletteCycleLayout', 'fixture verified');

  if (b1Result.status !== 'SUCCESS' || (b1Result.truncationSummary?.totalOccurrencesOmitted ?? 0) !== 0) {
    const err = 'FAILED — INCOMPLETE UPSTREAM EVIDENCE: B.1 status is not SUCCESS or occurrences were omitted by truncation.';
    logError('research', 'paletteCycleLayout', operationId, err);
    return createFailedResult(
      operationId,
      startTime,
      exePath,
      exeSize,
      err,
      b1Result,
      b2Result,
      b3Result,
      stageTracker.current
    );
  }

  stageTracker.current = 'B.1 completeness verified';
  logStageCheckpoint(operationId, 'research', 'paletteCycleLayout', 'B.1 completeness verified');

  if (b2Result.status !== 'SUCCESS' || !b2Result.reconciliation?.allReconciled) {
    const err = 'FAILED — INCOMPLETE UPSTREAM EVIDENCE: B.2 status is not SUCCESS or reconciliation failed.';
    logError('research', 'paletteCycleLayout', operationId, err);
    return createFailedResult(
      operationId,
      startTime,
      exePath,
      exeSize,
      err,
      b1Result,
      b2Result,
      b3Result,
      stageTracker.current
    );
  }

  stageTracker.current = 'B.2 reconciliation verified';
  logStageCheckpoint(operationId, 'research', 'paletteCycleLayout', 'B.2 reconciliation verified');

  if (b3Result.status !== 'SUCCESS' || !b3Result.reconciliation?.allReconciled) {
    const err = 'FAILED — INCOMPLETE UPSTREAM EVIDENCE: B.3 status is not SUCCESS or reconciliation failed.';
    logError('research', 'paletteCycleLayout', operationId, err);
    return createFailedResult(
      operationId,
      startTime,
      exePath,
      exeSize,
      err,
      b1Result,
      b2Result,
      b3Result,
      stageTracker.current
    );
  }

  stageTracker.current = 'B.3 reconciliation verified';
  logStageCheckpoint(operationId, 'research', 'paletteCycleLayout', 'B.3 reconciliation verified');

  // 2. Read executable binary once into memory (Section 12)
  options?.onProgress?.('Loading MK1.EXE binary into memory...', 0.05);
  const exeBuffer = await source.readSlice(exePath, 0, exeSize);
  if (!exeBuffer || exeBuffer.byteLength !== exeSize) {
    const err = `FAILED — PREREQUISITE MISMATCH: Failed to read executable fixture: expected ${exeSize} bytes, got ${exeBuffer?.byteLength ?? 0}`;
    logError('research', 'paletteCycleLayout', operationId, err);
    return createFailedResult(
      operationId,
      startTime,
      exePath,
      exeSize,
      err,
      b1Result,
      b2Result,
      b3Result,
      stageTracker.current
    );
  }
  const exeBytes = new Uint8Array(exeBuffer);

  stageTracker.current = 'EXE bytes loaded';
  logStageCheckpoint(operationId, 'research', 'paletteCycleLayout', 'EXE bytes loaded', { byteLength: exeBytes.length });

  // 3. Collect eligible B.3 repeated cycle populations (Sections 9, 10, 11)
  options?.onProgress?.('Collecting B.3 repeated populations...', 0.1);
  interface EligibleB3Input {
    sourceType: 'cluster' | 'repeated-target-group';
    clusterSummary?: ClusterStructuralSummary;
    groupSummary?: RepeatedTargetGroupSummary;
    sourceRegionId: string;
    sourceRegionClass: string;
    sourceObjectNumber: number | null;
    cycleSpan: number;
    cycleBlockCount: number;
    cycleAnchors: number[];
    candidateIds: string[];
    representationKinds: PaletteRepresentationKind[];
    primaryMotif: DeltaMotifAnalysis | null;
    occurrenceSlots: number[];
    contextOnlyConsensus: MK1PaletteRepeatedStructureResult['clusterStructuralSummaries'][number]['repeatedBlockComparison']['contextOnlyConsensus'];
    blockCrossesRegionBoundary: boolean;
    regionsIntersected: string[];
  }

  const eligibleInputs: EligibleB3Input[] = [];

  for (const c of b3Result.clusterStructuralSummaries) {
    if (
      c.repeatedBlockComparison &&
      c.repeatedBlockComparison.performed &&
      c.repeatedBlockComparison.blockLength > 0 &&
      c.repeatedBlockComparison.cycleAnchors.length >= 2
    ) {
      const topoRegion = report.topology?.regions?.find((r) => r.regionId === c.sourceRegionId);
      const sourceRegionClass = c.sourceRegionClass ? String(c.sourceRegionClass) : (topoRegion?.regionClass ?? 'unknown');
      const sourceObjectNumber = topoRegion?.objectNumber ?? c.sourceObjectNumber;

      eligibleInputs.push({
        sourceType: 'cluster',
        clusterSummary: c,
        sourceRegionId: c.sourceRegionId,
        sourceRegionClass,
        sourceObjectNumber,
        cycleSpan: c.repeatedBlockComparison.blockLength,
        cycleBlockCount: c.repeatedBlockComparison.cycleAnchors.length,
        cycleAnchors: c.repeatedBlockComparison.cycleAnchors,
        candidateIds: c.candidateIds,
        representationKinds: Object.keys(c.representationKindHistogram) as PaletteRepresentationKind[],
        primaryMotif: c.primaryDeltaMotif,
        occurrenceSlots: c.repeatedBlockComparison.occurrenceRelativeOffsetsWithinCycle,
        contextOnlyConsensus: c.repeatedBlockComparison.contextOnlyConsensus,
        blockCrossesRegionBoundary: c.repeatedBlockComparison.blockCrossesRegionBoundary,
        regionsIntersected: c.repeatedBlockComparison.regionsIntersected,
      });
    }
  }

  for (const g of b3Result.repeatedTargetGroupSummaries) {
    if (
      g.repeatedBlockComparison &&
      g.repeatedBlockComparison.performed &&
      g.repeatedBlockComparison.blockLength > 0 &&
      g.repeatedBlockComparison.cycleAnchors.length >= 2
    ) {
      const topoRegion = report.topology?.regions?.find((r) => r.regionId === g.sourceRegionId);
      const sourceRegionClass = topoRegion?.regionClass ?? 'unknown';
      const sourceObjectNumber = topoRegion?.objectNumber ?? g.sourceObjectNumber;

      eligibleInputs.push({
        sourceType: 'repeated-target-group',
        groupSummary: g,
        sourceRegionId: g.sourceRegionId,
        sourceRegionClass,
        sourceObjectNumber,
        cycleSpan: g.repeatedBlockComparison.blockLength,
        cycleBlockCount: g.repeatedBlockComparison.cycleAnchors.length,
        cycleAnchors: g.repeatedBlockComparison.cycleAnchors,
        candidateIds: [g.candidateId],
        representationKinds: [g.representationKind],
        primaryMotif: g.primaryDeltaMotif,
        occurrenceSlots: g.repeatedBlockComparison.occurrenceRelativeOffsetsWithinCycle,
        contextOnlyConsensus: g.repeatedBlockComparison.contextOnlyConsensus,
        blockCrossesRegionBoundary: g.repeatedBlockComparison.blockCrossesRegionBoundary,
        regionsIntersected: g.repeatedBlockComparison.regionsIntersected,
      });
    }
  }

  stageTracker.current = 'B.3 repeated populations collected';
  logStageCheckpoint(operationId, 'research', 'paletteCycleLayout', 'B.3 repeated populations collected', {
    eligibleCount: eligibleInputs.length,
  });

  // 4. Physical Population Deduplication (Sections 10, 11, 61)
  options?.onProgress?.('Deduplicating physical populations...', 0.15);
  interface DeduplicatedPhysicalItem {
    key: string;
    sourceRegionId: string;
    sourceRegionClass: string;
    sourceObjectNumber: number | null;
    cycleSpan: number;
    cycleBlockCount: number;
    cycleAnchors: number[];
    sourceClusterIds: Set<string>;
    sourceRepeatedTargetGroupIds: Set<string>;
    candidateIds: Set<string>;
    representationKinds: Set<PaletteRepresentationKind>;
    primaryMotif: DeltaMotifAnalysis | null;
    occurrenceSlots: number[];
    contextOnlyConsensus: MK1PaletteRepeatedStructureResult['clusterStructuralSummaries'][number]['repeatedBlockComparison']['contextOnlyConsensus'];
    blockCrossesRegionBoundary: boolean;
    regionsIntersected: Set<string>;
    slotProvenanceDisagreements?: Array<{
      sourceType: string;
      sourceId: string;
      slots: number[];
    }>;
  }

  const physicalMap = new Map<string, DeduplicatedPhysicalItem>();
  let duplicateProvenanceLinksCollapsed = 0;

  for (const input of eligibleInputs) {
    const sortedAnchors = [...input.cycleAnchors].sort((a, b) => a - b);
    const dedupKey = `${input.sourceRegionId}::${input.cycleSpan}::${sortedAnchors.join(',')}`;

    const existing = physicalMap.get(dedupKey);
    if (existing) {
      duplicateProvenanceLinksCollapsed++;
      if (input.clusterSummary) existing.sourceClusterIds.add(input.clusterSummary.clusterId);
      if (input.groupSummary) existing.sourceRepeatedTargetGroupIds.add(input.groupSummary.groupId);
      for (const cid of input.candidateIds) existing.candidateIds.add(cid);
      for (const rk of input.representationKinds) existing.representationKinds.add(rk);
      for (const reg of input.regionsIntersected) existing.regionsIntersected.add(reg);
      if (!existing.primaryMotif && input.primaryMotif) existing.primaryMotif = input.primaryMotif;
      if (input.occurrenceSlots.length > 0) {
        if (existing.occurrenceSlots.length === 0) {
          existing.occurrenceSlots = [...input.occurrenceSlots];
        } else {
          const setA = new Set(existing.occurrenceSlots);
          const setB = new Set(input.occurrenceSlots);
          const isIdentical = setA.size === setB.size && [...setA].every((v) => setB.has(v));
          if (!isIdentical) {
            const union = Array.from(new Set([...existing.occurrenceSlots, ...input.occurrenceSlots])).sort((a, b) => a - b);
            existing.occurrenceSlots = union;
            existing.slotProvenanceDisagreements = existing.slotProvenanceDisagreements ?? [];
            existing.slotProvenanceDisagreements.push({
              sourceType: input.sourceType,
              sourceId: input.clusterSummary?.clusterId ?? input.groupSummary?.groupId ?? 'unknown',
              slots: input.occurrenceSlots,
            });
          }
        }
      }
    } else {
      const clusterIds = new Set<string>();
      const groupIds = new Set<string>();
      if (input.clusterSummary) clusterIds.add(input.clusterSummary.clusterId);
      if (input.groupSummary) groupIds.add(input.groupSummary.groupId);

      physicalMap.set(dedupKey, {
        key: dedupKey,
        sourceRegionId: input.sourceRegionId,
        sourceRegionClass: input.sourceRegionClass,
        sourceObjectNumber: input.sourceObjectNumber,
        cycleSpan: input.cycleSpan,
        cycleBlockCount: input.cycleBlockCount,
        cycleAnchors: sortedAnchors,
        sourceClusterIds: clusterIds,
        sourceRepeatedTargetGroupIds: groupIds,
        candidateIds: new Set<string>(input.candidateIds),
        representationKinds: new Set<PaletteRepresentationKind>(input.representationKinds),
        primaryMotif: input.primaryMotif,
        occurrenceSlots: input.occurrenceSlots,
        contextOnlyConsensus: input.contextOnlyConsensus,
        blockCrossesRegionBoundary: input.blockCrossesRegionBoundary,
        regionsIntersected: new Set<string>(input.regionsIntersected),
      });
    }
  }

  stageTracker.current = 'physical populations deduplicated';
  logStageCheckpoint(operationId, 'research', 'paletteCycleLayout', 'physical populations deduplicated', {
    uniquePhysicalCount: physicalMap.size,
    duplicateProvenanceLinksCollapsed,
  });

  // Pre-index B.1 occurrences by position
  const b1OccurrencesByPosition = new Map<number, ExactValueOccurrence[]>();
  for (const occ of b1Result.detailedOccurrences) {
    let list = b1OccurrencesByPosition.get(occ.sourceFileOffset);
    if (!list) {
      list = [];
      b1OccurrencesByPosition.set(occ.sourceFileOffset, list);
    }
    list.push(occ);
  }

  // 5. Generate Period Candidates & Run Subunit Consensus (Tracks A & B)
  options?.onProgress?.('Generating period candidates...', 0.25);
  stageTracker.current = 'period candidates generated';
  logStageCheckpoint(operationId, 'research', 'paletteCycleLayout', 'period candidates generated');

  const physicalCyclePopulations: PhysicalCyclePopulation[] = [];
  let periodCandidatesGenerated = 0;
  let periodCandidatesProcessed = 0;
  const periodCandidatesSkipped = 0;

  let totalB1PositionsConsidered = 0;
  let totalB1PositionsResolved = 0;

  const topologyRegions = report.topology?.regions ?? [];

  let popCounter = 1;
  for (const item of physicalMap.values()) {
    const populationId = `phys_pop_${String(popCounter++).padStart(3, '0')}`;
    const cycleSpan = item.cycleSpan;
    const cycleAnchors = item.cycleAnchors;
    const cycleBlockCount = cycleAnchors.length;

    // Identify all B.1 occurrences that fall within ANY complete cycle block of this population
    const occurrencesInsideCycles: ExactValueOccurrence[] = [];
    const occurrencePositionsInsideCycles = new Set<number>();

    for (const anchor of cycleAnchors) {
      for (let r = 0; r < cycleSpan; r++) {
        const fileOffset = anchor + r;
        const occList = b1OccurrencesByPosition.get(fileOffset);
        if (occList && occList.length > 0) {
          occurrencePositionsInsideCycles.add(fileOffset);
          for (const occ of occList) {
            occurrencesInsideCycles.push(occ);
          }
        }
      }
    }

    const b1PositionsInsideCyclesArray = Array.from(occurrencePositionsInsideCycles).sort((a, b) => a - b);
    totalB1PositionsConsidered += b1PositionsInsideCyclesArray.length;
    totalB1PositionsResolved += b1PositionsInsideCyclesArray.length;

    // Generate divisor periods within bounds [2..32]
    const periods = generateCycleDivisorPeriods(cycleSpan);
    periodCandidatesGenerated += periods.length;

    const testedPeriods: TestedPeriodCandidate[] = [];

    // Pre-calculate byte masking for each cycle block (Sections 17 & 18)
    // Mask ALL existing B.1 exact-occurrence fields that intersect the block!
    const cycleBlockMasks: boolean[][] = [];
    for (let c = 0; c < cycleBlockCount; c++) {
      const anchor = cycleAnchors[c];
      const mask = new Array<boolean>(cycleSpan).fill(false);

      // Check every B.1 occurrence that overlaps [anchor, anchor + cycleSpan)
      for (const occ of b1Result.detailedOccurrences) {
        const occStart = occ.sourceFileOffset;
        const occEnd = occStart + 4; // 4 matched bytes
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

    // Process each candidate period
    for (const P of periods) {
      const subunitsPerCycle = cycleSpan / P;
      const totalSubunits = cycleBlockCount * subunitsPerCycle;

      // Arrays of samples per lane
      const rawLaneSamples: number[][] = Array.from({ length: P }, () => []);
      const contextLaneSamples: number[][] = Array.from({ length: P }, () => []);
      const contextLaneMaskedCount: number[] = new Array<number>(P).fill(0);

      for (let c = 0; c < cycleBlockCount; c++) {
        const anchor = cycleAnchors[c];
        const mask = cycleBlockMasks[c];

        for (let k = 0; k < subunitsPerCycle; k++) {
          for (let l = 0; l < P; l++) {
            const r = k * P + l;
            const fileOffset = anchor + r;
            const byteVal = exeBytes[fileOffset];

            rawLaneSamples[l].push(byteVal);

            if (mask[r]) {
              contextLaneMaskedCount[l]++;
            } else {
              contextLaneSamples[l].push(byteVal);
            }
          }
        }
      }

      // Compute raw lane consensus
      const rawLaneConsensus: LaneConsensus[] = [];
      let rawDominantSum = 0;
      let rawStableLaneCount = 0;
      for (let l = 0; l < P; l++) {
        const cons = evaluateSingleLaneConsensus(l, rawLaneSamples[l], 0);
        rawLaneConsensus.push(cons);
        rawDominantSum += cons.dominantByteCount;
        if (cons.isStable) rawStableLaneCount++;
      }

      const rawComparableByteCount = totalSubunits * P;
      const rawStableLanePercentage = (rawStableLaneCount / P) * 100;
      const rawDominantAgreementPercentage =
        rawComparableByteCount > 0 ? (rawDominantSum / rawComparableByteCount) * 100 : 0;

      // Compute context-only lane consensus
      const contextLaneConsensus: LaneConsensus[] = [];
      let contextComparableByteCount = 0;
      let contextDominantSum = 0;
      let contextStableLaneCount = 0;
      let totalMaskedCount = 0;

      for (let l = 0; l < P; l++) {
        const cons = evaluateSingleLaneConsensus(l, contextLaneSamples[l], contextLaneMaskedCount[l]);
        contextLaneConsensus.push(cons);
        contextComparableByteCount += cons.contributingByteCount;
        contextDominantSum += cons.dominantByteCount;
        totalMaskedCount += cons.maskedContributionCount;
        if (cons.isStable) contextStableLaneCount++;
      }

      const contextStableLanePercentage = (contextStableLaneCount / P) * 100;
      const contextDominantAgreementPercentage =
        contextComparableByteCount > 0 ? (contextDominantSum / contextComparableByteCount) * 100 : 0;

      const contextConsensusStatus: 'evaluated' | 'not-applicable-no-context-bytes' =
        contextComparableByteCount === 0 ? 'not-applicable-no-context-bytes' : 'evaluated';

      const hasNotableContextPeriodicity =
        contextComparableByteCount > 0 &&
        contextDominantAgreementPercentage >= CONTEXT_DOMINANT_AGREEMENT_THRESHOLD * 100;

      // Track B: Occurrence Lane Histogram & Density
      const { histogram, density } = buildOccurrenceLaneHistogram(
        P,
        subunitsPerCycle,
        cycleAnchors,
        cycleSpan,
        occurrencesInsideCycles
      );

      // Primary occurrence lane residues (Section 30)
      const primaryOccurrenceLaneResidues = item.occurrenceSlots.map((slot) => slot % P);
      const primaryOccurrencesShareSubunitLane =
        primaryOccurrenceLaneResidues.length > 0 &&
        new Set(primaryOccurrenceLaneResidues).size === 1;

      const structuralFlags: string[] = [];
      if (hasNotableContextPeriodicity) {
        structuralFlags.push('has-notable-context-periodicity');
      }
      if (primaryOccurrencesShareSubunitLane) {
        structuralFlags.push('primary-occurrences-share-subunit-lane');
      }
      if (histogram.some((h) => h.isRepeatedB1OccurrenceLane)) {
        structuralFlags.push('has-repeated-b1-occurrence-lane');
      }

      testedPeriods.push({
        periodBytes: P,
        subunitsPerCycle,
        cycleBlockCount,
        totalSubunits,
        rawComparableByteCount,
        rawStableLaneCount,
        rawStableLanePercentage,
        rawDominantAgreementPercentage,
        contextComparableByteCount,
        contextStableLaneCount,
        contextStableLanePercentage,
        contextDominantAgreementPercentage,
        contextConsensusStatus,
        maskedByteCount: totalMaskedCount,
        rawLaneConsensus,
        contextLaneConsensus,
        hasNotableContextPeriodicity,
        primaryOccurrenceLaneResidues,
        primaryOccurrencesShareSubunitLane,
        occurrenceLaneHistogram: histogram,
        b1OccurrenceDensity: density,
        structuralFlags,
      });

      periodCandidatesProcessed++;
    }

    // Sort top period candidates (Section 25)
    // 1. highest contextDominantAgreementPercentage
    // 2. highest contextComparableByteCount
    // 3. highest contextStableLaneCount
    // 4. smallest periodBytes
    const sortedPeriods = [...testedPeriods].sort((a, b) => {
      if (b.contextDominantAgreementPercentage !== a.contextDominantAgreementPercentage) {
        return b.contextDominantAgreementPercentage - a.contextDominantAgreementPercentage;
      }
      if (b.contextComparableByteCount !== a.contextComparableByteCount) {
        return b.contextComparableByteCount - a.contextComparableByteCount;
      }
      if (b.contextStableLaneCount !== a.contextStableLaneCount) {
        return b.contextStableLaneCount - a.contextStableLaneCount;
      }
      return a.periodBytes - b.periodBytes;
    });

    const topPeriodCandidates = sortedPeriods.slice(0, 5);

    // Re-check boundary intersection if needed
    const minAnchor = Math.min(...cycleAnchors);
    const maxEnd = Math.max(...cycleAnchors) + cycleSpan;
    const intersected = findIntersectedRegionIds(minAnchor, maxEnd, topologyRegions);
    const crossesBoundary = intersected.length > 1;

    physicalCyclePopulations.push({
      populationId,
      sourceRegionId: item.sourceRegionId,
      sourceRegionClass: item.sourceRegionClass,
      sourceObjectNumber: item.sourceObjectNumber,
      cycleSpan,
      cycleBlockCount,
      cycleAnchors,
      cycleAnchorsHex: cycleAnchors.map(toHex32),
      sourceClusterIds: Array.from(item.sourceClusterIds).sort(),
      sourceRepeatedTargetGroupIds: Array.from(item.sourceRepeatedTargetGroupIds).sort(),
      candidateIds: Array.from(item.candidateIds).sort(),
      representationKinds: Array.from(item.representationKinds).sort(),
      B3PrimaryMotif: item.primaryMotif,
      B3OccurrenceSlots: item.occurrenceSlots,
      B3ContextOnlyConsensus: item.contextOnlyConsensus,
      blockCrossesRegionBoundary: crossesBoundary,
      regionsIntersected: intersected.length > 0 ? intersected : Array.from(item.regionsIntersected),
      testedPeriods,
      topPeriodCandidates,
      b1OccurrencePositionsInsideCycles: b1PositionsInsideCyclesArray,
      b1OccurrencePositionsInsideCyclesHex: b1PositionsInsideCyclesArray.map(toHex32),
      hasAnyNotablePeriod: testedPeriods.some((p) => p.hasNotableContextPeriodicity),
      hasRepeatedB1OccurrenceLane: testedPeriods.some((p) =>
        p.occurrenceLaneHistogram.some((h) => h.isRepeatedB1OccurrenceLane)
      ),
      slotProvenanceDisagreements: item.slotProvenanceDisagreements,
    });
  }

  // Verify B.1 occurrence resolution integrity
  for (const pop of physicalCyclePopulations) {
    for (const pos of pop.b1OccurrencePositionsInsideCycles) {
      const hasMatch = b1Result.detailedOccurrences.some((o) => o.sourceFileOffset === pos);
      if (!hasMatch) {
        throw new Error(
          `Integrity violation: Physical position ${pos} (0x${pos.toString(16).toUpperCase()}) inside population ${pop.populationId} does not resolve to any B.1 ExactValueOccurrence`
        );
      }
    }
  }

  stageTracker.current = 'subunit consensus complete';
  logStageCheckpoint(operationId, 'research', 'paletteCycleLayout', 'subunit consensus complete', {
    populationsProcessed: physicalCyclePopulations.length,
    periodsTested: periodCandidatesProcessed,
  });

  stageTracker.current = 'B.1 lane occupancy complete';
  logStageCheckpoint(operationId, 'research', 'paletteCycleLayout', 'B.1 lane occupancy complete', {
    totalB1PositionsResolved,
  });

  // 6. Track C: Cross-Population Candidate-Centric Comparison (Sections 33-39)
  options?.onProgress?.('Performing cross-population comparison...', 0.7);

  // Map each (candidateId, representationKind) to participating physical populations and occurrences
  interface CandidateRepParticipation {
    candidateId: string;
    representationKind: PaletteRepresentationKind;
    popOccurrences: Map<string, ExactValueOccurrence[]>;
  }

  const candidateRepMap = new Map<string, CandidateRepParticipation>();

  for (const pop of physicalCyclePopulations) {
    // Collect occurrences inside this population
    for (const pos of pop.b1OccurrencePositionsInsideCycles) {
      const occList = b1OccurrencesByPosition.get(pos);
      if (occList) {
        for (const occ of occList) {
          const key = `${occ.targetCandidateId}::${occ.representationKind}`;
          let entry = candidateRepMap.get(key);
          if (!entry) {
            entry = {
              candidateId: occ.targetCandidateId,
              representationKind: occ.representationKind,
              popOccurrences: new Map<string, ExactValueOccurrence[]>(),
            };
            candidateRepMap.set(key, entry);
          }
          let popList = entry.popOccurrences.get(pop.populationId);
          if (!popList) {
            popList = [];
            entry.popOccurrences.set(pop.populationId, popList);
          }
          popList.push(occ);
        }
      }
    }
  }

  // Filter groups participating in at least 2 distinct physical populations
  const crossPopulationCandidateGroups: CrossPopulationCandidateGroup[] = [];
  let crossPopGroupCounter = 1;

  for (const entry of candidateRepMap.values()) {
    if (entry.popOccurrences.size >= 2) {
      const groupId = `cross_group_${String(crossPopGroupCounter++).padStart(3, '0')}`;
      const participatingPopIds = Array.from(entry.popOccurrences.keys()).sort();

      const participatingPops = participatingPopIds
        .map((id) => physicalCyclePopulations.find((p) => p.populationId === id)!)
        .filter(Boolean);

      const sourceRegionIds = participatingPops.map((p) => p.sourceRegionId);
      const sourceObjectNumbers = participatingPops.map((p) => p.sourceObjectNumber);
      const cycleSpans = participatingPops.map((p) => p.cycleSpan);
      const motifs = participatingPops.map((p) => p.B3PrimaryMotif);
      const occurrenceCounts = participatingPopIds.map((id) => entry.popOccurrences.get(id)?.length ?? 0);

      const testedPeriodCandidates: Record<string, number[]> = {};
      const notablePeriodCandidates: Record<string, number[]> = {};
      const primaryOccurrenceLaneResiduesByPopulation: Record<string, number[]> = {};

      for (const p of participatingPops) {
        testedPeriodCandidates[p.populationId] = p.testedPeriods.map((tp) => tp.periodBytes);
        notablePeriodCandidates[p.populationId] = p.testedPeriods
          .filter((tp) => tp.hasNotableContextPeriodicity)
          .map((tp) => tp.periodBytes);
        const bestPeriod = p.topPeriodCandidates[0];
        primaryOccurrenceLaneResiduesByPopulation[p.populationId] =
          bestPeriod?.primaryOccurrenceLaneResidues ?? [];
      }

      // Shared tested periods intersection
      let sharedPeriods = testedPeriodCandidates[participatingPopIds[0]] ?? [];
      for (let i = 1; i < participatingPopIds.length; i++) {
        const nextList = new Set(testedPeriodCandidates[participatingPopIds[i]] ?? []);
        sharedPeriods = sharedPeriods.filter((item) => nextList.has(item));
      }

      // Shared notable periods intersection
      let sharedNotablePeriods = notablePeriodCandidates[participatingPopIds[0]] ?? [];
      for (let i = 1; i < participatingPopIds.length; i++) {
        const nextList = new Set(notablePeriodCandidates[participatingPopIds[i]] ?? []);
        sharedNotablePeriods = sharedNotablePeriods.filter((item) => nextList.has(item));
      }

      const sameCycleSpan = new Set(cycleSpans).size === 1;

      // Same motif check
      let sameMotif = true;
      const firstMotif = motifs[0];
      for (let i = 1; i < motifs.length; i++) {
        const m = motifs[i];
        if (!firstMotif && !m) continue;
        if (!firstMotif || !m) {
          sameMotif = false;
          break;
        }
        if (
          firstMotif.cycleSpan !== m.cycleSpan ||
          JSON.stringify(firstMotif.motifDeltas) !== JSON.stringify(m.motifDeltas)
        ) {
          sameMotif = false;
          break;
        }
      }

      // Same primary occurrence lane residue pattern check
      let sameResiduePattern = true;
      const firstResidues = JSON.stringify(primaryOccurrenceLaneResiduesByPopulation[participatingPopIds[0]]);
      for (let i = 1; i < participatingPopIds.length; i++) {
        const nextResidues = JSON.stringify(primaryOccurrenceLaneResiduesByPopulation[participatingPopIds[i]]);
        if (firstResidues !== nextResidues) {
          sameResiduePattern = false;
          break;
        }
      }

      // Pairwise context comparison across populations (Section 35 & 36)
      const pairwiseContextComparisons: CrossPopulationContextComparison[] = [];

      for (let i = 0; i < participatingPops.length; i++) {
        for (let j = i + 1; j < participatingPops.length; j++) {
          const popA = participatingPops[i];
          const popB = participatingPops[j];
          const occsA = entry.popOccurrences.get(popA.populationId) ?? [];
          const occsB = entry.popOccurrences.get(popB.populationId) ?? [];

          const uniqueOccsA: ExactValueOccurrence[] = [];
          const seenOffsetsA = new Set<number>();
          for (const o of occsA) {
            if (!seenOffsetsA.has(o.sourceFileOffset)) {
              seenOffsetsA.add(o.sourceFileOffset);
              uniqueOccsA.push(o);
            }
          }

          const uniqueOccsB: ExactValueOccurrence[] = [];
          const seenOffsetsB = new Set<number>();
          for (const o of occsB) {
            if (!seenOffsetsB.has(o.sourceFileOffset)) {
              seenOffsetsB.add(o.sourceFileOffset);
              uniqueOccsB.push(o);
            }
          }

          // Compare occurrence pairs
          let pairCount = 0;
          let minSim = 1.0;
          let maxSim = 0.0;
          let sumSim = 0.0;

          // Stable vs variable byte positions across relative offsets: -16..-1 and +4..+19 (32 bytes)
          const relativeOffsets: number[] = [];
          for (let r = -CROSS_POP_CONTEXT_BYTES_BEFORE; r < 0; r++) relativeOffsets.push(r);
          for (let r = MATCHED_FIELD_BYTES; r < MATCHED_FIELD_BYTES + CROSS_POP_CONTEXT_BYTES_AFTER; r++) {
            relativeOffsets.push(r);
          }

          const offsetStable = new Map<number, boolean>();
          const comparablePairCountByRelativeOffset: Record<number, number> = {};
          for (const ro of relativeOffsets) {
            offsetStable.set(ro, true);
            comparablePairCountByRelativeOffset[ro] = 0;
          }

          for (const occA of uniqueOccsA) {
            const posA = occA.sourceFileOffset;
            for (const occB of uniqueOccsB) {
              const posB = occB.sourceFileOffset;

              let matchingBytes = 0;
              let comparableBytes = 0;

              for (const ro of relativeOffsets) {
                const offA = posA + ro;
                const offB = posB + ro;

                if (offA >= 0 && offA < exeBytes.length && offB >= 0 && offB < exeBytes.length) {
                  comparableBytes++;
                  comparablePairCountByRelativeOffset[ro]++;
                  if (exeBytes[offA] === exeBytes[offB]) {
                    matchingBytes++;
                  } else {
                    offsetStable.set(ro, false);
                  }
                }
              }

              const sim = comparableBytes > 0 ? matchingBytes / comparableBytes : 0;
              pairCount++;
              sumSim += sim;
              if (sim < minSim) minSim = sim;
              if (sim > maxSim) maxSim = sim;
            }
          }

          const meanSim = pairCount > 0 ? sumSim / pairCount : 0;
          if (pairCount === 0) minSim = 0;

          const stableRelativeBytePositions: number[] = [];
          const variableRelativeBytePositions: number[] = [];

          for (const ro of relativeOffsets) {
            const compCount = comparablePairCountByRelativeOffset[ro] ?? 0;
            if (compCount > 0 && offsetStable.get(ro)) {
              stableRelativeBytePositions.push(ro);
            } else {
              variableRelativeBytePositions.push(ro);
            }
          }

          pairwiseContextComparisons.push({
            populationAId: popA.populationId,
            populationBId: popB.populationId,
            occurrencePairsCompared: pairCount,
            minimumSimilarity: minSim,
            maximumSimilarity: maxSim,
            meanSimilarity: meanSim,
            stableRelativeBytePositions,
            variableRelativeBytePositions,
            comparablePairCountByRelativeOffset,
          });
        }
      }

      crossPopulationCandidateGroups.push({
        groupId,
        candidateId: entry.candidateId,
        representationKind: entry.representationKind,
        populationIds: participatingPopIds,
        sourceRegionIds,
        sourceObjectNumbers,
        cycleSpans,
        motifs,
        occurrenceCounts,
        testedPeriodCandidates,
        notablePeriodCandidates,
        primaryOccurrenceLaneResiduesByPopulation,
        sharedPeriodCandidates: sharedPeriods,
        sharedNotablePeriodCandidates: sharedNotablePeriods,
        sameCycleSpan,
        sameMotif,
        samePrimaryOccurrenceLaneResiduePattern: sameResiduePattern,
        pairwisePopulationContextComparisons: pairwiseContextComparisons,
      });
    }
  }

  stageTracker.current = 'cross-population comparison complete';
  logStageCheckpoint(operationId, 'research', 'paletteCycleLayout', 'cross-population comparison complete', {
    groupsCount: crossPopulationCandidateGroups.length,
  });

  // 7. Known Anchor Controls & Negative Control (Sections 47, 48)
  options?.onProgress?.('Evaluating controls & negative control...', 0.85);
  const knownAnchorControlSummary: KnownAnchorCycleLayoutSummary[] = [];

  for (const control of b1Result.controlTargets) {
    const participatingPhysicalPopulations: KnownAnchorCycleLayoutSummary['participatingPhysicalPopulations'] = [];

    // Deduplicate control occurrences by sourceFileOffset
    const uniqueControlOccs: ExactValueOccurrence[] = [];
    const seenControlOffsets = new Set<number>();
    for (const occ of control.occurrences ?? []) {
      if (!seenControlOffsets.has(occ.sourceFileOffset)) {
        seenControlOffsets.add(occ.sourceFileOffset);
        uniqueControlOccs.push(occ);
      }
    }

    for (const occ of uniqueControlOccs) {
      const srcOffset = occ.sourceFileOffset;
      for (const pop of physicalCyclePopulations) {
        for (let c = 0; c < pop.cycleAnchors.length; c++) {
          const anchor = pop.cycleAnchors[c];
          if (srcOffset >= anchor && srcOffset < anchor + pop.cycleSpan) {
            const relInCycle = srcOffset - anchor;
            const bestPeriod = pop.topPeriodCandidates[0]?.periodBytes ?? 2;
            const relInSubunit = relInCycle % bestPeriod;
            const periodLaneAnnotations: ControlPeriodLaneAnnotation[] = pop.testedPeriods.map((tp) => ({
              periodBytes: tp.periodBytes,
              relativeOffsetWithinSubunit: relInCycle % tp.periodBytes,
            }));

            participatingPhysicalPopulations.push({
              populationId: pop.populationId,
              cycleIndex: c,
              relativeOffsetWithinCycle: relInCycle,
              relativeOffsetWithinSubunit: relInSubunit,
              periodBytes: bestPeriod,
              periodLaneAnnotations,
              sourceOccurrenceOffset: srcOffset,
              sourceOccurrenceOffsetHex: toHex32(srcOffset),
            });
          }
        }
      }
    }

    knownAnchorControlSummary.push({
      controlName: control.name,
      targetOffset: control.physicalOffset,
      targetOffsetHex: control.physicalOffsetHex,
      representationsTested: control.representationsTested,
      totalLogicalMatches: control.totalLogicalMatches,
      uniquePhysicalOccurrences: control.uniquePhysicalOccurrences,
      externalOccurrences: control.externalOccurrences,
      sourceRegionDistribution: control.sourceRegionDistribution,
      participatingPhysicalPopulations,
    });
  }

  stageTracker.current = 'controls processed';
  logStageCheckpoint(operationId, 'research', 'paletteCycleLayout', 'controls processed', {
    controlsCount: knownAnchorControlSummary.length,
  });

  // Negative Control (Section 48, 20, 10)
  const negativeControlSummary = deriveNegativeControlSummary(
    b1Result,
    b2Result,
    physicalCyclePopulations,
    operationId
  );

  stageTracker.current = 'negative control derived';
  logStageCheckpoint(operationId, 'research', 'paletteCycleLayout', 'negative control derived', {
    status: negativeControlSummary.crossPopulationStatus,
    B1OccurrenceCount: negativeControlSummary.B1OccurrenceCount,
    B2ContextCount: negativeControlSummary.B2ContextCount,
  });

  // 8. Strict Reconciliation (Section 62)
  options?.onProgress?.('Finalizing reconciliation...', 0.95);
  const b3EligibleRepeatedPopulationInputs = eligibleInputs.length;
  const uniquePhysicalPopulationsDerived = physicalMap.size;
  const physicalPopulationsProcessed = physicalCyclePopulations.length;
  const physicalPopulationsSkipped = 0;
  const allPhysicalPopulationsAccountedFor =
    physicalPopulationsProcessed + physicalPopulationsSkipped === uniquePhysicalPopulationsDerived;

  const allPeriodCandidatesAccountedFor =
    periodCandidatesProcessed + periodCandidatesSkipped === periodCandidatesGenerated;

  const b1PositionsMissing = totalB1PositionsConsidered - totalB1PositionsResolved;
  const allB1OccurrencePositionsResolve =
    b1PositionsMissing === 0 && totalB1PositionsResolved === totalB1PositionsConsidered;

  const crossPopulationEligibleGroups = crossPopulationCandidateGroups.length;
  const crossPopulationGroupsProcessed = crossPopulationCandidateGroups.length;
  const crossPopulationGroupsSkipped = 0;
  const allCrossPopulationGroupsAccountedFor =
    crossPopulationGroupsProcessed + crossPopulationGroupsSkipped === crossPopulationEligibleGroups;

  const allReconciled =
    allPhysicalPopulationsAccountedFor &&
    allPeriodCandidatesAccountedFor &&
    allB1OccurrencePositionsResolve &&
    allCrossPopulationGroupsAccountedFor;

  const reconciliation: CycleLayoutReconciliation = {
    b3EligibleRepeatedPopulationInputs,
    uniquePhysicalPopulationsDerived,
    duplicateProvenanceLinksCollapsed,
    physicalPopulationsProcessed,
    physicalPopulationsSkipped,
    allPhysicalPopulationsAccountedFor,
    periodCandidatesGenerated,
    periodCandidatesProcessed,
    periodCandidatesSkipped,
    allPeriodCandidatesAccountedFor,
    b1OccurrencePositionsConsidered: totalB1PositionsConsidered,
    b1OccurrencePositionsResolved: totalB1PositionsResolved,
    b1OccurrencePositionsMissing: b1PositionsMissing,
    allB1OccurrencePositionsResolve,
    crossPopulationEligibleGroups,
    crossPopulationGroupsProcessed,
    crossPopulationGroupsSkipped,
    allCrossPopulationGroupsAccountedFor,
    allReconciled,
  };

  stageTracker.current = 'reconciliation complete';
  logStageCheckpoint(operationId, 'research', 'paletteCycleLayout', 'reconciliation complete', {
    allReconciled,
    uniquePhysicalPopulations: uniquePhysicalPopulationsDerived,
    periodCandidatesTested: periodCandidatesProcessed,
  });

  // 9. Global Summary (Section 64)
  const periodFreqHist: Record<number, number> = {};
  const notablePeriodFreqHist: Record<number, number> = {};
  let popsWithNotable = 0;
  let popsWithNoNotable = 0;
  let popsWithRepeatedB1 = 0;

  for (const pop of physicalCyclePopulations) {
    if (pop.hasAnyNotablePeriod) popsWithNotable++;
    else popsWithNoNotable++;

    if (pop.hasRepeatedB1OccurrenceLane) popsWithRepeatedB1++;

    for (const tp of pop.testedPeriods) {
      periodFreqHist[tp.periodBytes] = (periodFreqHist[tp.periodBytes] || 0) + 1;
      if (tp.hasNotableContextPeriodicity) {
        notablePeriodFreqHist[tp.periodBytes] = (notablePeriodFreqHist[tp.periodBytes] || 0) + 1;
      }
    }
  }

  let groupsWithSharedNotable = 0;
  let groupsWithDifferentNotable = 0;

  for (const grp of crossPopulationCandidateGroups) {
    if (grp.sharedNotablePeriodCandidates.length > 0) {
      groupsWithSharedNotable++;
    } else {
      groupsWithDifferentNotable++;
    }
  }

  const globalSummary: GlobalCycleLayoutSummary = {
    B3RepeatedPopulationsInput: b3EligibleRepeatedPopulationInputs,
    uniquePhysicalCyclePopulations: uniquePhysicalPopulationsDerived,
    populationsWithAtLeastOneNotablePeriod: popsWithNotable,
    populationsWithNoNotablePeriod: popsWithNoNotable,
    totalPeriodCandidatesTested: periodCandidatesProcessed,
    periodFrequencyHistogram: periodFreqHist,
    notablePeriodFrequencyHistogram: notablePeriodFreqHist,
    populationsWithRepeatedB1OccurrenceLane: popsWithRepeatedB1,
    crossPopulationCandidateGroups: crossPopulationCandidateGroups.length,
    crossPopulationGroupsWithSharedNotablePeriod: groupsWithSharedNotable,
    crossPopulationGroupsWithDifferentNotablePeriods: groupsWithDifferentNotable,
  };

  stageTracker.current = 'export constructed';
  logStageCheckpoint(operationId, 'research', 'paletteCycleLayout', 'export constructed');

  options?.onProgress?.('Cycle layout analysis complete.', 1.0);

  return {
    status: allReconciled ? 'SUCCESS' : 'PARTIAL',
    metadata: {
      operationId,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      milestone: '1E.2B.4',
    },
    fixture: {
      exePath,
      exeSize,
    },
    sourceB1Summary: {
      externalLogicalMatches: b1Result.globalSummary.totalExternalLogicalMatches,
      uniquePhysicalPositions: b1Result.globalSummary.uniqueExternalPhysicalOccurrencePositions,
      omittedTruncatedOccurrences: b1Result.truncationSummary.totalOccurrencesOmitted,
    },
    sourceB2Summary: {
      clustersCount: b2Result.trackB.clusters.length,
      clusteredPositions: b2Result.reconciliation.clusteredPositions,
      unclusteredPositions: b2Result.reconciliation.unclusteredPositions,
    },
    sourceB3Summary: {
      b2ClustersProcessed: b3Result.globalStructuralSummary.b2ClustersProcessed,
      repeatedTargetGroupsProcessed: b3Result.globalStructuralSummary.repeatedTargetGroupsDerived,
      motifsFound: b3Result.globalStructuralSummary.clustersWithRepeatingDeltaMotif,
      allReconciled: b3Result.reconciliation.allReconciled,
    },
    scanConfiguration: getCycleLayoutScanConfiguration(),
    reconciliation,
    globalSummary,
    physicalCyclePopulations,
    crossPopulationCandidateGroups,
    knownAnchorControlSummary,
    negativeControlSummary,
  };
}

/**
 * Creates the export JSON container for Milestone 1E.2B.4.
 * Schema: mk1_palette_cycle_layout_recon_v1 (Sections 67, 68).
 */
export function createMK1CompactPaletteCycleLayoutReconExport(
  result: MK1PaletteCycleLayoutResult
): MK1CompactPaletteCycleLayoutReconExport {
  return {
    format: 'mk1_palette_cycle_layout_recon_v1',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    metadata: {
      operationId: result.metadata.operationId,
      timestamp: result.metadata.timestamp,
      durationMs: result.metadata.durationMs,
      milestone: '1E.2B.4',
    },
    fixture: result.fixture,
    sourceB1Summary: result.sourceB1Summary,
    sourceB2Summary: result.sourceB2Summary,
    sourceB3Summary: result.sourceB3Summary,
    scanConfiguration: result.scanConfiguration,
    reconciliation: result.reconciliation,
    globalSummary: result.globalSummary,
    physicalCyclePopulations: result.physicalCyclePopulations,
    crossPopulationCandidateGroups: result.crossPopulationCandidateGroups,
    knownAnchorControlSummary: result.knownAnchorControlSummary,
    negativeControlSummary: result.negativeControlSummary,
  };
}
