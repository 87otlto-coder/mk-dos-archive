/**
 * MK1 Executable Palette Repeated Structural Context Reconnaissance (Milestone 1E.2B.3)
 *
 * Investigates whether existing B.1/B.2 occurrences participate in repeated local binary
 * structures without assigning semantic meaning (no pointer tables, palette records, or ownership claims).
 *
 * Core Epistemic Axioms:
 * 1. REPEATED STRUCTURAL CONTEXT != POINTER TABLE OR PALETTE RECORD
 * 2. REPEATING DELTA MOTIF != RECORD DEFINITION
 * 3. REPEATED BLOCK != TABLE
 * 4. STABLE RELATIVE BYTE POSITION != SEMANTIC FIELD
 *
 * Three Independent Evidence Tracks:
 * - Track A: Relative-context byte consensus (32 bytes before, 4 matched bytes masked, 32 bytes after).
 * - Track B: Repeating-delta motif detection (start-offset deltas, motif lengths 1..4, min 2 cycles).
 * - Track C: Repeated-block comparison (cycle anchor blocks up to 256 bytes, byte consensus, target stability).
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import {
  createOperationId,
  formatErrorDetails,
  logError,
  logInfo,
  logStageCheckpoint,
  logWarning,
} from '../../../core/diagnostics/diagnosticLogger';
import {
  MK1ExecutablePhysicalTopology,
  MK1ExecutableRegion,
} from './executableRegionTopology';
import {
  MK1PaletteReferenceReconResult,
  ExactValueOccurrence,
  PaletteRepresentationKind,
} from './paletteReferenceReconnaissanceTypes';
import {
  MK1PaletteOccurrenceContextResult,
  PhysicalOccurrenceCluster,
} from './paletteOccurrenceContextTypes';
import {
  ClusterStructuralSummary,
  ContextOnlyRepeatedBlockConsensus,
  ContextSimilarityMetrics,
  CycleOccurrenceSlotTargetAssociation,
  CycleSlotStability,
  DeltaMotifAnalysis,
  GlobalStructuralSummary,
  KnownAnchorRepeatedStructureSummary,
  MK1CompactPaletteRepeatedStructureReconExport,
  MK1PaletteRepeatedStructureResult,
  NegativeControlRepeatedStructureSummary,
  NormalizedContextConsensus,
  RelativeBytePositionConsensus,
  RepeatedBlockComparisonResult,
  RepeatedBlockConsensus,
  RepeatedStructureReconciliation,
  RepeatedStructureScanConfiguration,
  RepeatedTargetGroupSummary,
  StableContextRun,
  StructuralEvidenceFlag,
} from './paletteRepeatedStructureTypes';

// Authoritative Scan Configuration Constants (Section 58)
export const CONTEXT_BYTES_BEFORE = 32;
export const MATCHED_FIELD_BYTES = 4;
export const CONTEXT_BYTES_AFTER = 32;
export const CONTEXT_WINDOW_TOTAL_BYTES = 68; // -32..+35
export const CONTEXT_SIMILARITY_THRESHOLD = 0.75;
export const DELTA_MOTIF_MIN_CYCLES = 2;
export const DELTA_MOTIF_MIN_LENGTH = 1;
export const DELTA_MOTIF_MAX_LENGTH = 4;
export const MAX_REPEATED_BLOCK_BYTES = 256;
export const REPEATED_TARGET_MINIMUM_OCCURRENCES = 3;

export const NEGATIVE_CONTROL_CANDIDATE_ID = 'MK1.EXE:0x0009C914';

export function getRepeatedStructureScanConfiguration(): RepeatedStructureScanConfiguration {
  return {
    contextBytesBefore: CONTEXT_BYTES_BEFORE,
    matchedFieldBytes: MATCHED_FIELD_BYTES,
    contextBytesAfter: CONTEXT_BYTES_AFTER,
    contextSimilarityThreshold: CONTEXT_SIMILARITY_THRESHOLD,
    deltaMotifMinCycles: DELTA_MOTIF_MIN_CYCLES,
    deltaMotifMinLength: DELTA_MOTIF_MIN_LENGTH,
    deltaMotifMaxLength: DELTA_MOTIF_MAX_LENGTH,
    maxRepeatedBlockBytes: MAX_REPEATED_BLOCK_BYTES,
    repeatedTargetMinimumOccurrences: REPEATED_TARGET_MINIMUM_OCCURRENCES,
  };
}

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

function byteToHex(b: number): string {
  return b.toString(16).padStart(2, '0').toUpperCase();
}

export interface PaletteRepeatedStructureOptions {
  exePath?: string;
  exeSize?: number;
  onProgress?: (stage: string, progress: number) => void;
  overrideRepeatedTargetGroups?: Map<
    string,
    {
      candidateId: string;
      representationKind: PaletteRepresentationKind;
      sourceRegionId: string;
      sourceObjectNumber: number | null;
      positions: Set<number>;
    }
  >;
}

/**
 * Checks which topology regions intersect the physical byte interval [start, end).
 */
export function findIntersectedRegionIds(
  start: number,
  end: number,
  regions: MK1ExecutableRegion[]
): string[] {
  if (!regions || regions.length === 0) return [];
  const intersected = regions.filter(
    (r) => Math.max(start, r.fileStart) < Math.min(end, r.fileEnd)
  );
  return intersected.map((r) => r.regionId);
}

/**
 * Extracts a normalized context window of nominal 68 bytes around an occurrence.
 * The 4-byte matched field [P..P+3] is masked for comparison.
 * File boundaries are safely bounded without throwing.
 */
export function extractOccurrenceContextWindow(
  exeBytes: Uint8Array,
  position: number,
  bytesBefore = CONTEXT_BYTES_BEFORE,
  matchedBytes = MATCHED_FIELD_BYTES,
  bytesAfter = CONTEXT_BYTES_AFTER
): {
  windowStart: number;
  windowEnd: number;
  relativeOffsets: number[];
  bytes: Array<number | null>;
  isMasked: boolean[];
} {
  const nominalStart = position - bytesBefore;
  const nominalEnd = position + matchedBytes + bytesAfter;

  const windowStart = Math.max(0, nominalStart);
  const windowEnd = Math.min(exeBytes.length, nominalEnd);

  const relativeOffsets: number[] = [];
  const bytes: Array<number | null> = [];
  const isMasked: boolean[] = [];

  for (let r = -bytesBefore; r < matchedBytes + bytesAfter; r++) {
    relativeOffsets.push(r);
    const absOffset = position + r;
    const inMaskedField = r >= 0 && r < matchedBytes;
    isMasked.push(inMaskedField);

    if (absOffset >= 0 && absOffset < exeBytes.length) {
      bytes.push(exeBytes[absOffset]);
    } else {
      bytes.push(null);
    }
  }

  return {
    windowStart,
    windowEnd,
    relativeOffsets,
    bytes,
    isMasked,
  };
}

/**
 * Computes Track A relative-context byte consensus across a set of physical positions.
 */
export function computeNormalizedContextConsensus(
  exeBytes: Uint8Array,
  positions: number[],
  topologyRegions: MK1ExecutableRegion[] = [],
  bytesBefore = CONTEXT_BYTES_BEFORE,
  matchedBytes = MATCHED_FIELD_BYTES,
  bytesAfter = CONTEXT_BYTES_AFTER
): NormalizedContextConsensus {
  const totalWindowBytes = bytesBefore + matchedBytes + bytesAfter;
  const maskedFieldOffsets = Array.from({ length: matchedBytes }, (_, i) => i);

  const relativePositions: RelativeBytePositionConsensus[] = [];
  const isOffsetStableMap = new Map<number, boolean>();
  const stableByteHexMap = new Map<number, string>();

  let crossesRegionBoundary = false;
  let truncatedAtFileBoundary = false;
  const intersectedRegionsSet = new Set<string>();

  // Check boundary crossings for all positions
  for (const pos of positions) {
    if (pos - bytesBefore < 0 || pos + matchedBytes + bytesAfter > exeBytes.length) {
      truncatedAtFileBoundary = true;
    }
    const winStart = Math.max(0, pos - bytesBefore);
    const winEnd = Math.min(exeBytes.length, pos + matchedBytes + bytesAfter);
    const regions = findIntersectedRegionIds(winStart, winEnd, topologyRegions);
    if (regions.length > 1) {
      crossesRegionBoundary = true;
    }
    for (const r of regions) {
      intersectedRegionsSet.add(r);
    }
  }

  // Evaluate relative positions: [-bytesBefore .. -1] and [+matchedBytes .. +(matchedBytes + bytesAfter - 1)]
  for (let r = -bytesBefore; r < totalWindowBytes - bytesBefore; r++) {
    // Skip matched field in consensus calculation
    if (r >= 0 && r < matchedBytes) {
      continue;
    }

    let contributingCount = 0;
    const valueCounts = new Map<number, number>();

    for (const pos of positions) {
      const absOffset = pos + r;
      if (absOffset >= 0 && absOffset < exeBytes.length) {
        contributingCount++;
        const val = exeBytes[absOffset];
        valueCounts.set(val, (valueCounts.get(val) ?? 0) + 1);
      }
    }

    const distinctByteValues = Array.from(valueCounts.keys()).sort((a, b) => a - b);
    const distinctByteHexValues = distinctByteValues.map(byteToHex);

    // Stable: all contributing occurrences have the exact same byte value AND all occurrences contribute
    const isStable = contributingCount === positions.length && distinctByteValues.length === 1;
    isOffsetStableMap.set(r, isStable);

    let stableByteHex: string | null = null;
    let dominantByte: number | null = null;
    let dominantByteHex: string | null = null;
    let dominantByteCount = 0;
    let dominantBytePercentage = 0;

    if (distinctByteValues.length > 0) {
      for (const [val, count] of valueCounts.entries()) {
        if (count > dominantByteCount) {
          dominantByte = val;
          dominantByteCount = count;
        }
      }
      if (dominantByte !== null) {
        dominantByteHex = byteToHex(dominantByte);
        dominantBytePercentage = contributingCount > 0 ? (dominantByteCount / contributingCount) * 100 : 0;
      }
      if (isStable && distinctByteValues.length === 1) {
        stableByteHex = byteToHex(distinctByteValues[0]);
        stableByteHexMap.set(r, stableByteHex);
      }
    }

    relativePositions.push({
      relativeOffset: r,
      contributingCount,
      distinctByteValues,
      distinctByteHexValues,
      isStable,
      stableByteHex,
      dominantByte,
      dominantByteHex,
      dominantByteCount,
      dominantBytePercentage: Number(dominantBytePercentage.toFixed(2)),
    });
  }

  // Contiguous stable runs:
  // stableBeforeRunLength: consecutive stable bytes moving backward from -1
  let stableBeforeRunLength = 0;
  for (let r = -1; r >= -bytesBefore; r--) {
    if (isOffsetStableMap.get(r) === true) {
      stableBeforeRunLength++;
    } else {
      break;
    }
  }

  // stableAfterRunLength: consecutive stable bytes moving forward from +matchedBytes (+4)
  let stableAfterRunLength = 0;
  for (let r = matchedBytes; r < matchedBytes + bytesAfter; r++) {
    if (isOffsetStableMap.get(r) === true) {
      stableAfterRunLength++;
    } else {
      break;
    }
  }

  // Longest stable run across the entire window (broken by masked field or variable offsets)
  let longestStableRun: StableContextRun | null = null;
  let currentRunOffsets: number[] = [];

  const evaluateOffsetRun = (offset: number) => {
    if (isOffsetStableMap.get(offset) === true) {
      currentRunOffsets.push(offset);
    } else {
      finalizeCurrentRun();
    }
  };

  const finalizeCurrentRun = () => {
    if (currentRunOffsets.length > 0) {
      if (!longestStableRun || currentRunOffsets.length > longestStableRun.length) {
        longestStableRun = {
          length: currentRunOffsets.length,
          startRelativeOffset: currentRunOffsets[0],
          endRelativeOffset: currentRunOffsets[currentRunOffsets.length - 1],
          bytesHex: currentRunOffsets.map((off) => stableByteHexMap.get(off) ?? '??'),
        };
      }
      currentRunOffsets = [];
    }
  };

  // Run before
  for (let r = -bytesBefore; r <= -1; r++) {
    evaluateOffsetRun(r);
  }
  finalizeCurrentRun();

  // Run after
  for (let r = matchedBytes; r < matchedBytes + bytesAfter; r++) {
    evaluateOffsetRun(r);
  }
  finalizeCurrentRun();

  // Pairwise similarity
  const similarity = computePairwiseContextSimilarity(
    exeBytes,
    positions,
    bytesBefore,
    matchedBytes,
    bytesAfter
  );

  // Compact 68-byte context signature
  const signatureTokens: string[] = [];
  for (let r = -bytesBefore; r < totalWindowBytes - bytesBefore; r++) {
    if (r >= 0 && r < matchedBytes) {
      signatureTokens.push('??');
    } else if (isOffsetStableMap.get(r) === true && stableByteHexMap.has(r)) {
      signatureTokens.push(stableByteHexMap.get(r)!);
    } else {
      signatureTokens.push('??');
    }
  }
  const contextSignature = signatureTokens.join(' ');

  return {
    contextBytesBefore: bytesBefore,
    matchedFieldBytes: matchedBytes,
    contextBytesAfter: bytesAfter,
    totalWindowBytes,
    maskedFieldOffsets,
    relativePositions,
    stableBeforeRunLength,
    stableAfterRunLength,
    longestStableRun,
    contextSignature,
    similarity,
    contextTruncatedAtFileBoundary: truncatedAtFileBoundary,
    contextCrossesRegionBoundary: crossesRegionBoundary,
    regionsIntersected: Array.from(intersectedRegionsSet),
  };
}

/**
 * Computes pairwise normalized context similarity across all occurrence pairs.
 * Excludes the 4 masked bytes.
 */
export function computePairwiseContextSimilarity(
  exeBytes: Uint8Array,
  positions: number[],
  bytesBefore = CONTEXT_BYTES_BEFORE,
  matchedBytes = MATCHED_FIELD_BYTES,
  bytesAfter = CONTEXT_BYTES_AFTER
): ContextSimilarityMetrics {
  if (positions.length <= 1) {
    return {
      minimumPairwiseSimilarity: 1.0,
      maximumPairwiseSimilarity: 1.0,
      meanPairwiseSimilarity: 1.0,
      comparedPairsCount: 0,
    };
  }

  const similarities: number[] = [];

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const posA = positions[i];
      const posB = positions[j];

      let comparableBytes = 0;
      let matchingBytes = 0;

      for (let r = -bytesBefore; r < bytesBefore + matchedBytes + bytesAfter - bytesBefore; r++) {
        // Exclude the 4-byte masked field
        if (r >= 0 && r < matchedBytes) {
          continue;
        }
        const offA = posA + r;
        const offB = posB + r;

        if (
          offA >= 0 &&
          offA < exeBytes.length &&
          offB >= 0 &&
          offB < exeBytes.length
        ) {
          comparableBytes++;
          if (exeBytes[offA] === exeBytes[offB]) {
            matchingBytes++;
          }
        }
      }

      const sim = comparableBytes > 0 ? matchingBytes / comparableBytes : 1.0;
      similarities.push(sim);
    }
  }

  const minimumPairwiseSimilarity = Number(Math.min(...similarities).toFixed(4));
  const maximumPairwiseSimilarity = Number(Math.max(...similarities).toFixed(4));
  const sum = similarities.reduce((acc, v) => acc + v, 0);
  const meanPairwiseSimilarity = Number((sum / similarities.length).toFixed(4));

  return {
    minimumPairwiseSimilarity,
    maximumPairwiseSimilarity,
    meanPairwiseSimilarity,
    comparedPairsCount: similarities.length,
  };
}

/**
 * Track B: Repeating-Delta Motif Detection.
 * Searches consecutive start-offset deltas for the best repeating motif of length 1..4
 * with at least 2 complete consecutive cycles.
 *
 * Deterministic Motif Selection Precedence (Section 22):
 * 1. Greatest number of deltas covered (coveredDeltaCount)
 * 2. Greatest number of complete cycles (cycleCount)
 * 3. Shortest motif length (motifLength)
 * 4. Lowest motif start index (startDeltaIndex)
 */
export function detectRepeatingDeltaMotif(
  deltas: number[],
  positions: number[],
  minCycles = DELTA_MOTIF_MIN_CYCLES,
  minLen = DELTA_MOTIF_MIN_LENGTH,
  maxLen = DELTA_MOTIF_MAX_LENGTH
): DeltaMotifAnalysis | null {
  if (!deltas || deltas.length < minCycles * minLen) {
    return null;
  }

  interface CandidateMotifMatch {
    motifDeltas: number[];
    motifLength: number;
    cycleSpan: number;
    cycleCount: number;
    coveredDeltaCount: number;
    startDeltaIndex: number;
    endDeltaIndexExclusive: number;
  }

  const candidateMatches: CandidateMotifMatch[] = [];

  for (let len = minLen; len <= maxLen; len++) {
    for (let startIdx = 0; startIdx <= deltas.length - len * minCycles; startIdx++) {
      const candidateMotif = deltas.slice(startIdx, startIdx + len);

      let completeCycles = 0;
      while (startIdx + (completeCycles + 1) * len <= deltas.length) {
        let isMatch = true;
        for (let k = 0; k < len; k++) {
          if (deltas[startIdx + completeCycles * len + k] !== candidateMotif[k]) {
            isMatch = false;
            break;
          }
        }
        if (isMatch) {
          completeCycles++;
        } else {
          break;
        }
      }

      if (completeCycles >= minCycles) {
        const cycleSpan = candidateMotif.reduce((a, b) => a + b, 0);
        candidateMatches.push({
          motifDeltas: candidateMotif,
          motifLength: len,
          cycleSpan,
          cycleCount: completeCycles,
          coveredDeltaCount: completeCycles * len,
          startDeltaIndex: startIdx,
          endDeltaIndexExclusive: startIdx + completeCycles * len,
        });
      }
    }
  }

  if (candidateMatches.length === 0) {
    return null;
  }

  // Deterministic sorting (Section 22)
  candidateMatches.sort((a, b) => {
    // 1. Greatest number of deltas covered
    if (b.coveredDeltaCount !== a.coveredDeltaCount) {
      return b.coveredDeltaCount - a.coveredDeltaCount;
    }
    // 2. Greatest number of complete cycles
    if (b.cycleCount !== a.cycleCount) {
      return b.cycleCount - a.cycleCount;
    }
    // 3. Shortest motif length
    if (a.motifLength !== b.motifLength) {
      return a.motifLength - b.motifLength;
    }
    // 4. Lowest motif start index
    return a.startDeltaIndex - b.startDeltaIndex;
  });

  const best = candidateMatches[0];
  const coveragePercentage = Number(
    ((best.coveredDeltaCount / deltas.length) * 100).toFixed(2)
  );

  // Cycle anchors:
  // In positions, delta k connects positions[k] and positions[k+1].
  // So for cycle c = 0 .. cycleCount:
  // anchor c is at positions[best.startDeltaIndex + c * best.motifLength]
  const anchorPositions: number[] = [];
  const anchorPositionsHex: string[] = [];

  for (let c = 0; c <= best.cycleCount; c++) {
    const posIdx = best.startDeltaIndex + c * best.motifLength;
    if (posIdx < positions.length) {
      const pos = positions[posIdx];
      anchorPositions.push(pos);
      anchorPositionsHex.push(toHex32(pos));
    }
  }

  return {
    motifDeltas: best.motifDeltas,
    motifLength: best.motifLength,
    cycleSpan: best.cycleSpan,
    cycleCount: best.cycleCount,
    coveredDeltaCount: best.coveredDeltaCount,
    coveragePercentage,
    startDeltaIndex: best.startDeltaIndex,
    endDeltaIndexExclusive: best.endDeltaIndexExclusive,
    anchorPositions,
    anchorPositionsHex,
    isConstantStride: best.motifLength === 1,
  };
}

/**
 * Track C: Repeated-Block Comparison.
 * Compares consecutive complete cycle blocks of length `cycleSpan` at cycle anchor positions.
 */
export function compareRepeatedBlocks(
  exeBytes: Uint8Array,
  positions: number[],
  motif: DeltaMotifAnalysis | null,
  logicalAssociationsByPosition: Map<number, ExactValueOccurrence[]>,
  topologyRegions: MK1ExecutableRegion[] = [],
  maxBlockBytes = MAX_REPEATED_BLOCK_BYTES
): RepeatedBlockComparisonResult {
  if (!motif) {
    return {
      performed: false,
      notPerformedReason: 'no repeating delta motif detected',
      blockLength: 0,
      blockCount: 0,
      cycleAnchors: [],
      cycleAnchorsHex: [],
      consensus: null,
      rawBlockConsensus: null,
      contextOnlyConsensus: null,
      occurrenceRelativeOffsetsWithinCycle: [],
      cycleTargetAssociations: [],
      slotStability: [],
      blockCrossesRegionBoundary: false,
      regionsIntersected: [],
    };
  }

  const { cycleSpan, cycleCount, motifLength, startDeltaIndex, anchorPositions } = motif;

  if (cycleSpan <= 0) {
    return {
      performed: false,
      notPerformedReason: 'cycleSpan <= 0',
      blockLength: 0,
      blockCount: 0,
      cycleAnchors: [],
      cycleAnchorsHex: [],
      consensus: null,
      rawBlockConsensus: null,
      contextOnlyConsensus: null,
      occurrenceRelativeOffsetsWithinCycle: [],
      cycleTargetAssociations: [],
      slotStability: [],
      blockCrossesRegionBoundary: false,
      regionsIntersected: [],
    };
  }

  if (cycleSpan > maxBlockBytes) {
    return {
      performed: false,
      notPerformedReason: `cycleSpan (${cycleSpan} bytes) > ${maxBlockBytes} bytes (research safety cap)`,
      blockLength: cycleSpan,
      blockCount: cycleCount,
      cycleAnchors: anchorPositions.slice(0, cycleCount),
      cycleAnchorsHex: motif.anchorPositionsHex.slice(0, cycleCount),
      consensus: null,
      rawBlockConsensus: null,
      contextOnlyConsensus: null,
      occurrenceRelativeOffsetsWithinCycle: [],
      cycleTargetAssociations: [],
      slotStability: [],
      blockCrossesRegionBoundary: false,
      regionsIntersected: [],
    };
  }

  // Ensure there are at least cycleCount block anchors
  const blockAnchors = anchorPositions.slice(0, cycleCount);
  if (blockAnchors.length < cycleCount) {
    return {
      performed: false,
      notPerformedReason: 'insufficient cycle anchor positions in file',
      blockLength: cycleSpan,
      blockCount: blockAnchors.length,
      cycleAnchors: blockAnchors,
      cycleAnchorsHex: blockAnchors.map(toHex32),
      consensus: null,
      rawBlockConsensus: null,
      contextOnlyConsensus: null,
      occurrenceRelativeOffsetsWithinCycle: [],
      cycleTargetAssociations: [],
      slotStability: [],
      blockCrossesRegionBoundary: false,
      regionsIntersected: [],
    };
  }

  // Check file bounds
  for (let c = 0; c < cycleCount; c++) {
    const start = blockAnchors[c];
    if (start + cycleSpan > exeBytes.length) {
      return {
        performed: false,
        notPerformedReason: 'cycle block extends beyond executable file boundary',
        blockLength: cycleSpan,
        blockCount: cycleCount,
        cycleAnchors: blockAnchors,
        cycleAnchorsHex: blockAnchors.map(toHex32),
        consensus: null,
        rawBlockConsensus: null,
        contextOnlyConsensus: null,
        occurrenceRelativeOffsetsWithinCycle: [],
        cycleTargetAssociations: [],
        slotStability: [],
        blockCrossesRegionBoundary: false,
        regionsIntersected: [],
      };
    }
  }

  // Check topology region boundary crossing
  let blockCrossesRegionBoundary = false;
  const intersectedRegionsSet = new Set<string>();

  for (let c = 0; c < cycleCount; c++) {
    const start = blockAnchors[c];
    const end = start + cycleSpan;
    const regIds = findIntersectedRegionIds(start, end, topologyRegions);
    if (regIds.length > 1) {
      blockCrossesRegionBoundary = true;
    }
    for (const rid of regIds) {
      intersectedRegionsSet.add(rid);
    }
  }

  // Matched occurrence relative offsets within cycle (Section 28)
  // For slot s = 0..motifLength-1: offset is sum of motifDeltas[0..s-1]
  const occurrenceRelativeOffsetsWithinCycle: number[] = [];
  let runningDelta = 0;
  for (let s = 0; s < motifLength; s++) {
    occurrenceRelativeOffsetsWithinCycle.push(runningDelta);
    runningDelta += motif.motifDeltas[s];
  }

  // Raw byte-by-byte consensus across complete cycle blocks
  let identicalByteCount = 0;
  const consensusMask: boolean[] = [];

  for (let b = 0; b < cycleSpan; b++) {
    const val0 = exeBytes[blockAnchors[0] + b];
    let isAllIdentical = true;
    for (let c = 1; c < cycleCount; c++) {
      if (exeBytes[blockAnchors[c] + b] !== val0) {
        isAllIdentical = false;
        break;
      }
    }
    consensusMask.push(isAllIdentical);
    if (isAllIdentical) {
      identicalByteCount++;
    }
  }

  const variableByteCount = cycleSpan - identicalByteCount;
  const identicalBytePercentage = Number(
    ((identicalByteCount / cycleSpan) * 100).toFixed(2)
  );

  // Stable runs within raw cycle block
  const stableRuns: Array<{ length: number; startOffsetInBlock: number; endOffsetInBlock: number }> = [];
  let currentRunStart: number | null = null;

  for (let b = 0; b < cycleSpan; b++) {
    if (consensusMask[b]) {
      if (currentRunStart === null) {
        currentRunStart = b;
      }
    } else {
      if (currentRunStart !== null) {
        stableRuns.push({
          length: b - currentRunStart,
          startOffsetInBlock: currentRunStart,
          endOffsetInBlock: b - 1,
        });
        currentRunStart = null;
      }
    }
  }
  if (currentRunStart !== null) {
    stableRuns.push({
      length: cycleSpan - currentRunStart,
      startOffsetInBlock: currentRunStart,
      endOffsetInBlock: cycleSpan - 1,
    });
  }

  const blockConsensus: RepeatedBlockConsensus = {
    blockLength: cycleSpan,
    blockCount: cycleCount,
    identicalByteCount,
    variableByteCount,
    identicalBytePercentage,
    consensusMask,
    stableRuns,
  };

  // Context-Only Consensus (Sections 16-20)
  // Exclude bytes occupied by known B.1 4-byte matched occurrence slots within cycle: S..S+3
  const excludedMatchedByteSet = new Set<number>();
  for (const sOffset of occurrenceRelativeOffsetsWithinCycle) {
    for (let k = 0; k < MATCHED_FIELD_BYTES; k++) {
      const bOff = sOffset + k;
      if (bOff >= 0 && bOff < cycleSpan) {
        excludedMatchedByteSet.add(bOff);
      }
    }
  }
  const excludedMatchedByteOffsets = Array.from(excludedMatchedByteSet).sort((a, b) => a - b);
  const excludedMatchedByteCount = excludedMatchedByteOffsets.length;
  const comparableContextByteCount = cycleSpan - excludedMatchedByteCount;

  let contextOnlyConsensus: ContextOnlyRepeatedBlockConsensus;

  if (comparableContextByteCount === 0) {
    contextOnlyConsensus = {
      performed: false,
      status: 'not-applicable-no-context-bytes',
      blockLength: cycleSpan,
      blockCount: cycleCount,
      excludedMatchedByteOffsets,
      excludedMatchedByteCount,
      comparableContextByteCount: 0,
      identicalContextByteCount: 0,
      variableContextByteCount: 0,
      identicalContextBytePercentage: 0,
      consensusMask: new Array(cycleSpan).fill(false),
      stableRuns: [],
    };
  } else {
    let identicalContextByteCount = 0;
    const contextConsensusMask: boolean[] = [];

    for (let b = 0; b < cycleSpan; b++) {
      if (excludedMatchedByteSet.has(b)) {
        contextConsensusMask.push(false);
        continue;
      }
      const val0 = exeBytes[blockAnchors[0] + b];
      let isAllIdentical = true;
      for (let c = 1; c < cycleCount; c++) {
        if (exeBytes[blockAnchors[c] + b] !== val0) {
          isAllIdentical = false;
          break;
        }
      }
      contextConsensusMask.push(isAllIdentical);
      if (isAllIdentical) {
        identicalContextByteCount++;
      }
    }

    const variableContextByteCount = comparableContextByteCount - identicalContextByteCount;
    const identicalContextBytePercentage = Number(
      ((identicalContextByteCount / comparableContextByteCount) * 100).toFixed(2)
    );

    const contextStableRuns: Array<{ length: number; startOffsetInBlock: number; endOffsetInBlock: number }> = [];
    let curRunStart: number | null = null;

    for (let b = 0; b < cycleSpan; b++) {
      if (contextConsensusMask[b]) {
        if (curRunStart === null) curRunStart = b;
      } else {
        if (curRunStart !== null) {
          contextStableRuns.push({
            length: b - curRunStart,
            startOffsetInBlock: curRunStart,
            endOffsetInBlock: b - 1,
          });
          curRunStart = null;
        }
      }
    }
    if (curRunStart !== null) {
      contextStableRuns.push({
        length: cycleSpan - curRunStart,
        startOffsetInBlock: curRunStart,
        endOffsetInBlock: cycleSpan - 1,
      });
    }

    contextOnlyConsensus = {
      performed: true,
      status: 'performed',
      blockLength: cycleSpan,
      blockCount: cycleCount,
      excludedMatchedByteOffsets,
      excludedMatchedByteCount,
      comparableContextByteCount,
      identicalContextByteCount,
      variableContextByteCount,
      identicalContextBytePercentage,
      consensusMask: contextConsensusMask,
      stableRuns: contextStableRuns,
    };
  }

  // Target associations within each cycle block (Section 29)
  const cycleTargetAssociations: CycleOccurrenceSlotTargetAssociation[][] = [];

  for (let c = 0; c < cycleCount; c++) {
    const cycleSlots: CycleOccurrenceSlotTargetAssociation[] = [];

    for (let s = 0; s < motifLength; s++) {
      const posIdx = startDeltaIndex + c * motifLength + s;
      const physicalOffset = positions[posIdx];
      const logicals = logicalAssociationsByPosition.get(physicalOffset) ?? [];

      const candidateIds = Array.from(new Set(logicals.map((l) => l.targetCandidateId)));
      const representationKinds = Array.from(new Set(logicals.map((l) => l.representationKind)));
      const targetRegions = Array.from(new Set(logicals.map((l) => l.targetCandidateRegionId)));
      const targetObjects = Array.from(new Set(logicals.map((l) => l.targetObjectNumber)));
      const targetValuesHex = Array.from(new Set(logicals.map((l) => l.matchedUint32Hex)));

      cycleSlots.push({
        relativeOffsetInCycle: occurrenceRelativeOffsetsWithinCycle[s],
        slotIndex: s,
        physicalOffset,
        physicalOffsetHex: toHex32(physicalOffset),
        candidateIds,
        representationKinds,
        targetRegions,
        targetObjects,
        targetValuesHex,
      });
    }

    cycleTargetAssociations.push(cycleSlots);
  }

  // Cross-cycle target stability (Section 30)
  const slotStability: CycleSlotStability[] = [];

  for (let s = 0; s < motifLength; s++) {
    const allCandidateIdsInSlot = new Set<string>();
    const allRepKindsInSlot = new Set<PaletteRepresentationKind>();
    const allTargetValuesInSlot = new Set<string>();
    const allTargetRegionsInSlot = new Set<string>();

    for (let c = 0; c < cycleCount; c++) {
      const slot = cycleTargetAssociations[c][s];
      for (const cid of slot.candidateIds) allCandidateIdsInSlot.add(cid);
      for (const rk of slot.representationKinds) allRepKindsInSlot.add(rk);
      for (const tv of slot.targetValuesHex) allTargetValuesInSlot.add(tv);
      for (const tr of slot.targetRegions) allTargetRegionsInSlot.add(tr);
    }

    slotStability.push({
      relativeOffsetInCycle: occurrenceRelativeOffsetsWithinCycle[s],
      slotIndex: s,
      targetCandidateStable: allCandidateIdsInSlot.size === 1,
      representationKindStable: allRepKindsInSlot.size === 1,
      targetValueStable: allTargetValuesInSlot.size === 1,
      targetRegionStable: allTargetRegionsInSlot.size === 1,
      distinctCandidateIds: Array.from(allCandidateIdsInSlot),
      distinctRepresentationKinds: Array.from(allRepKindsInSlot),
      distinctTargetValuesHex: Array.from(allTargetValuesInSlot),
      distinctTargetRegions: Array.from(allTargetRegionsInSlot),
    });
  }

  return {
    performed: true,
    blockLength: cycleSpan,
    blockCount: cycleCount,
    cycleAnchors: blockAnchors,
    cycleAnchorsHex: blockAnchors.map(toHex32),
    consensus: blockConsensus,
    rawBlockConsensus: blockConsensus,
    contextOnlyConsensus,
    occurrenceRelativeOffsetsWithinCycle,
    cycleTargetAssociations,
    slotStability,
    blockCrossesRegionBoundary,
    regionsIntersected: Array.from(intersectedRegionsSet),
  };
}

/**
 * Assigns descriptive structural evidence flags strictly according to Section 32 & 1E.2B.3a.
 * NO semantic table or record claims.
 */
export function assignStructuralEvidenceFlags(
  motif: DeltaMotifAnalysis | null,
  contextConsensus: NormalizedContextConsensus,
  blockComparison: RepeatedBlockComparisonResult
): StructuralEvidenceFlag[] {
  const flags: StructuralEvidenceFlag[] = [];

  if (motif) {
    if (motif.isConstantStride) {
      flags.push('has-constant-delta-motif');
    }
    if (motif.motifLength >= 2) {
      flags.push('has-multi-delta-repeating-motif');
    }
  }

  if (contextConsensus.similarity.meanPairwiseSimilarity >= CONTEXT_SIMILARITY_THRESHOLD) {
    flags.push('has-high-context-consensus');
  }

  if (contextConsensus.stableBeforeRunLength >= 1) {
    flags.push('has-stable-before-context');
  }

  if (contextConsensus.stableAfterRunLength >= 1) {
    flags.push('has-stable-after-context');
  }

  if (blockComparison.performed) {
    flags.push('has-repeatable-cycle-block');

    if (
      blockComparison.contextOnlyConsensus &&
      blockComparison.contextOnlyConsensus.performed &&
      blockComparison.contextOnlyConsensus.comparableContextByteCount > 0
    ) {
      if (blockComparison.contextOnlyConsensus.identicalContextBytePercentage >= 50.0) {
        flags.push('has-context-only-cycle-consensus');
      }
      if (blockComparison.contextOnlyConsensus.identicalContextBytePercentage >= 75.0) {
        flags.push('has-high-context-only-cycle-consensus');
      }
    }

    const allSlotsStable = blockComparison.slotStability.every((s) => s.targetCandidateStable);
    if (allSlotsStable && blockComparison.slotStability.length > 0) {
      flags.push('same-target-repeated');
    } else if (blockComparison.slotStability.some((s) => !s.targetCandidateStable)) {
      flags.push('different-targets-same-relative-slot');
    }
  }

  return flags;
}

/**
 * Derives secondary population: Repeated-Target Groups (Section 10).
 * Groups by candidateId + representationKind + sourceRegionId with at least 3 occurrences.
 */
export function deriveRepeatedTargetGroups(
  b1DetailedOccurrences: ExactValueOccurrence[]
): Map<string, { candidateId: string; representationKind: PaletteRepresentationKind; sourceRegionId: string; sourceObjectNumber: number | null; positions: Set<number> }> {
  const groupMap = new Map<string, { candidateId: string; representationKind: PaletteRepresentationKind; sourceRegionId: string; sourceObjectNumber: number | null; positions: Set<number> }>();

  for (const occ of b1DetailedOccurrences) {
    const key = `${occ.targetCandidateId}|${occ.representationKind}|${occ.sourceRegionId}`;
    let item = groupMap.get(key);
    if (!item) {
      item = {
        candidateId: occ.targetCandidateId,
        representationKind: occ.representationKind,
        sourceRegionId: occ.sourceRegionId,
        sourceObjectNumber: occ.sourceObjectNumber,
        positions: new Set<number>(),
      };
      groupMap.set(key, item);
    }
    item.positions.add(occ.sourceFileOffset);
  }

  // Filter groups with at least REPEATED_TARGET_MINIMUM_OCCURRENCES (3)
  const eligibleGroups = new Map<string, { candidateId: string; representationKind: PaletteRepresentationKind; sourceRegionId: string; sourceObjectNumber: number | null; positions: Set<number> }>();
  for (const [key, item] of groupMap.entries()) {
    if (item.positions.size >= REPEATED_TARGET_MINIMUM_OCCURRENCES) {
      eligibleGroups.set(key, item);
    }
  }

  return eligibleGroups;
}

export type B3Stage =
  | 'START B.3'
  | 'fixture identity verified'
  | 'B.1 completeness verified'
  | 'B.2 reconciliation verified'
  | 'EXE context loaded'
  | 'B.1 cluster-position integrity verified'
  | 'clusters analyzed'
  | 'repeated-target groups analyzed'
  | 'group integrity verified'
  | 'controls analyzed'
  | 'negative control derived'
  | 'reconciliation complete'
  | 'export constructed';

/**
 * Derives negative control summary dynamically from live B.1 / B.2 evidence (Section 41, hardened in 1E.2B.3b).
 * Never manufactures zeroes. If upstream inputs are missing, reports null and unavailable-upstream-uninspected.
 */
export function deriveNegativeControlSummary(
  b1Result?: MK1PaletteReferenceReconResult,
  b2Result?: MK1PaletteOccurrenceContextResult
): NegativeControlRepeatedStructureSummary {
  let b1Count: number | null = null;
  let b2Count: number | null = null;

  if (b1Result && Array.isArray(b1Result.detailedOccurrences)) {
    b1Count = b1Result.detailedOccurrences.filter(
      (o) => o.targetCandidateId === NEGATIVE_CONTROL_CANDIDATE_ID
    ).length;
  }

  if (b2Result) {
    if (Array.isArray(b2Result.classifiedPositions)) {
      b2Count = b2Result.classifiedPositions.filter((c) =>
        c.associatedCandidates?.some((a) => a.candidateId === NEGATIVE_CONTROL_CANDIDATE_ID)
      ).length;
    } else if (
      b2Result.negativeControl &&
      b2Result.negativeControl.candidateId === NEGATIVE_CONTROL_CANDIDATE_ID &&
      typeof b2Result.negativeControl.actualOccurrencesB2 === 'number'
    ) {
      b2Count = b2Result.negativeControl.actualOccurrencesB2;
    } else if (Array.isArray(b2Result.candidateContextSummaries)) {
      const cand = b2Result.candidateContextSummaries.find(
        (c) => c.candidateId === NEGATIVE_CONTROL_CANDIDATE_ID
      );
      b2Count = cand ? cand.externalOccurrenceCount : 0;
    } else if (b2Result.negativeControl && typeof b2Result.negativeControl.actualOccurrencesB2 === 'number') {
      b2Count = b2Result.negativeControl.actualOccurrencesB2;
    }
  }

  const isContradiction = (b1Count !== null && b1Count > 0) || (b2Count !== null && b2Count > 0);
  if (isContradiction) {
    return {
      candidateId: NEGATIVE_CONTROL_CANDIDATE_ID,
      B1OccurrenceCount: b1Count,
      B2ContextCount: b2Count,
      B3RepeatedContextStatus: 'unexpected-occurrences-found',
      notes: `Contradiction detected: negative control candidate ${NEGATIVE_CONTROL_CANDIDATE_ID} yielded ${b1Count ?? 'uninspected'} B.1 occurrence(s) and ${b2Count ?? 'uninspected'} B.2 context(s), contradicting previous real-fixture negative baseline.`,
    };
  }

  if (b1Count === null || b2Count === null) {
    return {
      candidateId: NEGATIVE_CONTROL_CANDIDATE_ID,
      B1OccurrenceCount: b1Count,
      B2ContextCount: b2Count,
      B3RepeatedContextStatus: 'unavailable-upstream-uninspected',
      notes: 'Negative control upstream evidence could not be inspected due to early execution failure or absent inputs.',
    };
  }

  return {
    candidateId: NEGATIVE_CONTROL_CANDIDATE_ID,
    B1OccurrenceCount: b1Count,
    B2ContextCount: b2Count,
    B3RepeatedContextStatus: 'not-applicable-no-occurrences',
    notes: `Negative control candidate ${NEGATIVE_CONTROL_CANDIDATE_ID} yielded 0 B.1 occurrences and 0 B.2 contexts, confirming negative baseline.`,
  };
}

export function createFailedResult(
  operationId: string,
  startTimeOrB1: number | MK1PaletteReferenceReconResult | null | undefined,
  exePathOrB2?: string | MK1PaletteOccurrenceContextResult | null,
  exeSizeOrPath?: number | string,
  reasonOrSize?: string | number,
  b1ResultOrReason?: MK1PaletteReferenceReconResult | null | string,
  b2Result?: MK1PaletteOccurrenceContextResult | null,
  lastSuccessfulStage?: B3Stage,
  reconciliationPartial?: Partial<RepeatedStructureReconciliation>
): MK1PaletteRepeatedStructureResult {
  let startTime: number = Date.now();
  let exePath: string = 'MK1.EXE';
  let exeSize: number = 0;
  let reason: string = 'Execution failed';
  let b1Result: MK1PaletteReferenceReconResult | null | undefined = undefined;
  let b2ResultActual: MK1PaletteOccurrenceContextResult | null | undefined = undefined;
  let stage: B3Stage | undefined = lastSuccessfulStage;
  let reconPartial: Partial<RepeatedStructureReconciliation> | undefined = reconciliationPartial;

  if (typeof startTimeOrB1 === 'number') {
    startTime = startTimeOrB1;
    exePath = (exePathOrB2 as string) ?? 'MK1.EXE';
    exeSize = (exeSizeOrPath as number) ?? 0;
    reason = (reasonOrSize as string) ?? 'Execution failed';
    b1Result = b1ResultOrReason as MK1PaletteReferenceReconResult | null | undefined;
    b2ResultActual = b2Result;
    stage = lastSuccessfulStage;
    reconPartial = reconciliationPartial;
  } else {
    // Alternative signature: (operationId, b1Result, b2Result, exePath, exeSize, reason, lastSuccessfulStage, reconciliationPartial)
    b1Result = startTimeOrB1;
    b2ResultActual = exePathOrB2 as MK1PaletteOccurrenceContextResult | null | undefined;
    exePath = (exeSizeOrPath as string) ?? 'MK1.EXE';
    exeSize = (reasonOrSize as number) ?? 0;
    reason = (b1ResultOrReason as string) ?? 'Execution failed';
    stage = typeof b2Result === 'string' ? (b2Result as B3Stage) : lastSuccessfulStage;
    reconPartial = reconciliationPartial;
  }

  const fullReason = stage
    ? `${reason} (last successful stage: '${stage}')`
    : reason;

  return {
    status: 'FAILED',
    failureReason: fullReason,
    metadata: {
      operationId,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      milestone: '1E.2B.3',
    },
    fixture: {
      exePath,
      exeSize,
    },
    sourceB1Summary: {
      externalLogicalMatches: b1Result?.globalSummary?.totalExternalLogicalMatches ?? 0,
      uniquePhysicalPositions: b1Result?.globalSummary?.uniqueExternalPhysicalOccurrencePositions ?? 0,
      omittedTruncatedOccurrences: 0,
    },
    sourceB2Summary: {
      clustersCount: b2ResultActual?.trackB?.totalClustersIdentified ?? 0,
      clusteredPositions: b2ResultActual?.trackB?.clusteredPositionsCount ?? 0,
      unclusteredPositions: b2ResultActual?.trackB?.isolatedPositionsCount ?? 0,
      object1TrackAPositions: b2ResultActual?.trackA?.eligibleObject1Positions ?? 0,
    },
    scanConfiguration: getRepeatedStructureScanConfiguration(),
    reconciliation: {
      b2ClusterInputCount: 0,
      b3ClustersProcessed: 0,
      b3ClustersSkipped: 0,
      allClustersAccountedFor: false,
      b2ClusteredPhysicalPositions: 0,
      b3ClusteredPhysicalPositionsReferenced: 0,
      clusterPositionsReconcile: false,
      clusterPositionsWithB1Evidence: 0,
      clusterPositionsMissingB1Evidence: 0,
      allClusterPositionsResolveToB1: false,
      repeatedTargetEligibleGroupCount: 0,
      repeatedTargetGroupsProcessed: 0,
      repeatedTargetGroupsSkipped: 0,
      allRepeatedTargetGroupsAccountedFor: false,
      repeatedTargetGroupPositionsWithMatchingB1Evidence: 0,
      repeatedTargetGroupPositionsMissingMatchingB1Evidence: 0,
      invalidRepeatedTargetGroupPositions: [],
      invalidRepeatedTargetGroupPositionsHex: [],
      allRepeatedTargetGroupPositionsResolveToMatchingB1Evidence: false,
      repeatedTargetGroupPositionsWithB1Evidence: 0,
      allRepeatedTargetGroupPositionsResolveToB1: false,
      allReconciled: false,
      ...reconPartial,
    },
    globalStructuralSummary: {
      b2ClustersProcessed: 0,
      repeatedTargetGroupsDerived: 0,
      clustersWithRepeatingDeltaMotif: 0,
      clustersWithConstantDeltaMotif: 0,
      clustersWithMultiDeltaMotif: 0,
      clustersWithNoRepeatingMotif: 0,
      clustersWithHighContextConsensus: 0,
      repeatedCycleBlocksCompared: 0,
      repeatedTargetGroupsWithMotif: 0,
      repeatedTargetGroupsWithHighConsensus: 0,
    },
    clusterStructuralSummaries: [],
    repeatedTargetGroupSummaries: [],
    knownAnchorControlSummary: [],
    negativeControlSummary: deriveNegativeControlSummary(b1Result, b2ResultActual),
  };
}

/**
 * Main execution engine for Pass 1E.2B.3: Repeated Structural Context Reconnaissance.
 * Wrapped in a structured outer exception boundary (Pass 1E.2B.3b).
 */
export async function executePaletteRepeatedStructureReconnaissance(
  source: DirectorySource,
  b1Result: MK1PaletteReferenceReconResult,
  b2Result: MK1PaletteOccurrenceContextResult,
  topology?: MK1ExecutablePhysicalTopology | null,
  options?: PaletteRepeatedStructureOptions
): Promise<MK1PaletteRepeatedStructureResult> {
  const startTime = Date.now();
  const operationId = createOperationId('palette-repeat-struct');
  const exePath = options?.exePath ?? b1Result?.fixture?.exePath ?? 'MK1.EXE';
  const exeSize = options?.exeSize ?? b1Result?.fixture?.exeSize ?? 0;
  const stageTracker: { current: B3Stage } = { current: 'START B.3' };

  try {
    return await executePaletteRepeatedStructureReconnaissanceInternal(
      source,
      b1Result,
      b2Result,
      topology,
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
    logError('research', 'paletteRepeatedStructure', operationId, error, {
      milestone: '1E.2B.3',
      source: 'paletteRepeatedStructure',
      operation: 'executePaletteRepeatedStructureReconnaissance',
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
      stageTracker.current
    );
  }
}

async function executePaletteRepeatedStructureReconnaissanceInternal(
  source: DirectorySource,
  b1Result: MK1PaletteReferenceReconResult,
  b2Result: MK1PaletteOccurrenceContextResult,
  topology: MK1ExecutablePhysicalTopology | null | undefined,
  options: PaletteRepeatedStructureOptions | undefined,
  operationId: string,
  startTime: number,
  exePath: string,
  exeSize: number,
  stageTracker: { current: B3Stage }
): Promise<MK1PaletteRepeatedStructureResult> {
  logStageCheckpoint(operationId, 'research', 'paletteRepeatedStructure', 'START B.3', {
    exePath: b1Result.fixture.exePath,
    exeSize: b1Result.fixture.exeSize,
  });

  // 1. Fixture assertion
  if (
    b1Result.fixture.exePath !== b2Result.fixture.exePath ||
    b1Result.fixture.exeSize !== b2Result.fixture.exeSize ||
    (options?.exePath && options.exePath !== b1Result.fixture.exePath) ||
    (options?.exeSize && options.exeSize !== b1Result.fixture.exeSize)
  ) {
    const err = `FAILED — PREREQUISITE MISMATCH: Fixture identity mismatch between B.1 (${b1Result.fixture.exePath}, ${b1Result.fixture.exeSize}) and B.2 (${b2Result.fixture.exePath}, ${b2Result.fixture.exeSize}).`;
    logError('research', 'paletteRepeatedStructure', operationId, err);
    return createFailedResult(operationId, startTime, exePath, exeSize, err, b1Result, b2Result, stageTracker.current);
  }

  stageTracker.current = 'fixture identity verified';
  logStageCheckpoint(operationId, 'research', 'paletteRepeatedStructure', 'fixture identity verified');

  // 2. B.1 and B.2 completeness checks
  if (b1Result.status === 'FAILED') {
    const err = 'FAILED — INCOMPLETE B.1/B.2 EVIDENCE: Upstream B.1 status is FAILED.';
    logError('research', 'paletteRepeatedStructure', operationId, err);
    return createFailedResult(operationId, startTime, exePath, exeSize, err, b1Result, b2Result, stageTracker.current);
  }

  const b1TruncationOmitted = b1Result.truncationSummary?.totalOccurrencesOmitted ?? 0;

  if (b1TruncationOmitted !== 0) {
    const err = `FAILED — INCOMPLETE B.1/B.2 EVIDENCE: B.1 has ${b1TruncationOmitted} omitted truncated occurrences. Complete B.1 scan required.`;
    logError('research', 'paletteRepeatedStructure', operationId, err);
    return createFailedResult(operationId, startTime, exePath, exeSize, err, b1Result, b2Result, stageTracker.current);
  }

  stageTracker.current = 'B.1 completeness verified';
  logStageCheckpoint(operationId, 'research', 'paletteRepeatedStructure', 'B.1 completeness verified');

  if (b2Result.status !== 'SUCCESS' || !b2Result.reconciliation?.allReconciled) {
    const err = 'FAILED — INCOMPLETE B.1/B.2 EVIDENCE: B.2 status is not SUCCESS or B.2 reconciliation failed.';
    logError('research', 'paletteRepeatedStructure', operationId, err);
    return createFailedResult(operationId, startTime, exePath, exeSize, err, b1Result, b2Result, stageTracker.current);
  }

  stageTracker.current = 'B.2 reconciliation verified';
  logStageCheckpoint(operationId, 'research', 'paletteRepeatedStructure', 'B.2 reconciliation verified');

  // 3. Read executable binary once
  options?.onProgress?.('Loading MK1.EXE binary into memory...', 0.1);
  const exeBuffer = await source.readSlice(exePath, 0, exeSize);
  if (!exeBuffer || exeBuffer.byteLength !== exeSize) {
    const err = `FAILED — PREREQUISITE MISMATCH: Failed to read executable fixture: expected ${exeSize} bytes, got ${exeBuffer?.byteLength ?? 0}`;
    logError('research', 'paletteRepeatedStructure', operationId, err);
    return createFailedResult(operationId, startTime, exePath, exeSize, err, b1Result, b2Result, stageTracker.current);
  }

  const exeBytes = new Uint8Array(exeBuffer);
  stageTracker.current = 'EXE context loaded';
  logStageCheckpoint(operationId, 'research', 'paletteRepeatedStructure', 'EXE context loaded', { byteLength: exeBytes.length });

  // Map physical positions to B.1 logical occurrences
  const logicalAssociationsByPosition = new Map<number, ExactValueOccurrence[]>();
  for (const occ of b1Result.detailedOccurrences) {
    let list = logicalAssociationsByPosition.get(occ.sourceFileOffset);
    if (!list) {
      list = [];
      logicalAssociationsByPosition.set(occ.sourceFileOffset, list);
    }
    list.push(occ);
  }

  // Map physical positions to B.2 cluster IDs
  const clusterIdByPosition = new Map<number, string>();
  for (const cluster of b2Result.trackB.clusters) {
    for (const pos of cluster.positions) {
      clusterIdByPosition.set(pos, cluster.clusterId);
    }
  }

  // 3.1 B.1 Position Integrity Verification (Pass 1E.2B.3a)
  let clusterPositionsWithB1Evidence = 0;
  let clusterPositionsMissingB1Evidence = 0;
  const unresolvedClusterPositions: Array<{ clusterId: string; position: number; positionHex: string }> = [];

  for (const cluster of b2Result.trackB.clusters) {
    for (const pos of cluster.positions) {
      const associations = logicalAssociationsByPosition.get(pos);
      if (associations && associations.length > 0) {
        clusterPositionsWithB1Evidence++;
      } else {
        clusterPositionsMissingB1Evidence++;
        unresolvedClusterPositions.push({
          clusterId: cluster.clusterId,
          position: pos,
          positionHex: toHex32(pos),
        });
      }
    }
  }

  const allClusterPositionsResolveToB1 = clusterPositionsMissingB1Evidence === 0;

  if (!allClusterPositionsResolveToB1) {
    const offending = unresolvedClusterPositions[0];
    const err = `FAILED — B.1 POSITION INTEGRITY VIOLATION: ${clusterPositionsMissingB1Evidence} cluster position(s) do not resolve to B.1 occurrences (e.g. position ${offending.positionHex} in cluster ${offending.clusterId}).`;
    logError('research', 'paletteRepeatedStructure', operationId, err, {
      clusterPositionsMissingB1Evidence,
      sampleUnresolved: unresolvedClusterPositions.slice(0, 5),
    });
    return createFailedResult(operationId, startTime, exePath, exeSize, err, b1Result, b2Result, stageTracker.current);
  }

  stageTracker.current = 'B.1 cluster-position integrity verified';
  logStageCheckpoint(operationId, 'research', 'paletteRepeatedStructure', 'B.1 cluster-position integrity verified', {
    clusterPositionsWithB1Evidence,
  });

  const topologyRegions = topology?.regions ?? [];

  // 4. Primary Target Population: ALL B.2 Physical Clusters
  options?.onProgress?.('Analyzing B.2 physical clusters...', 0.2);
  const clusterStructuralSummaries: ClusterStructuralSummary[] = [];
  let clustersWithRepeatingDeltaMotif = 0;
  let clustersWithConstantDeltaMotif = 0;
  let clustersWithMultiDeltaMotif = 0;
  let clustersWithNoRepeatingMotif = 0;
  let clustersWithHighContextConsensus = 0;
  let repeatedCycleBlocksCompared = 0;
  let b3ClusteredPhysicalPositionsReferenced = 0;

  for (let cIdx = 0; cIdx < b2Result.trackB.clusters.length; cIdx++) {
    const cluster = b2Result.trackB.clusters[cIdx];
    const positions = cluster.positions;
    b3ClusteredPhysicalPositionsReferenced += positions.length;

    // Track B: Delays / Motifs
    const deltas =
      cluster.consecutiveDeltas && cluster.consecutiveDeltas.length === positions.length - 1
        ? cluster.consecutiveDeltas
        : positions.slice(0, -1).map((p, i) => positions[i + 1] - p);

    const primaryDeltaMotif = detectRepeatingDeltaMotif(deltas, positions);
    if (primaryDeltaMotif) {
      clustersWithRepeatingDeltaMotif++;
      if (primaryDeltaMotif.isConstantStride) {
        clustersWithConstantDeltaMotif++;
      } else {
        clustersWithMultiDeltaMotif++;
      }
    } else {
      clustersWithNoRepeatingMotif++;
    }

    // Track A: Relative-Context Byte Consensus
    const normalizedContextConsensus = computeNormalizedContextConsensus(
      exeBytes,
      positions,
      topologyRegions
    );
    if (
      normalizedContextConsensus.similarity.meanPairwiseSimilarity >=
      CONTEXT_SIMILARITY_THRESHOLD
    ) {
      clustersWithHighContextConsensus++;
    }

    // Track C: Repeated-Block Comparison
    const repeatedBlockComparison = compareRepeatedBlocks(
      exeBytes,
      positions,
      primaryDeltaMotif,
      logicalAssociationsByPosition,
      topologyRegions
    );
    if (repeatedBlockComparison.performed) {
      repeatedCycleBlocksCompared++;
    }

    // Structural evidence flags
    const structuralEvidenceFlags = assignStructuralEvidenceFlags(
      primaryDeltaMotif,
      normalizedContextConsensus,
      repeatedBlockComparison
    );

    clusterStructuralSummaries.push({
      clusterId: cluster.clusterId,
      sourceRegionId: cluster.sourceRegionId,
      sourceRegionClass: cluster.sourceRegionClass,
      sourceObjectNumber: cluster.sourceObjectNumber,
      startOffset: cluster.startOffset,
      startOffsetHex: cluster.startOffsetHex,
      endOffset: cluster.endOffset,
      endOffsetHex: cluster.endOffsetHex,
      positionCount: cluster.positionCount,
      logicalMatchCount: cluster.logicalMatchCount,
      positions: cluster.positions,
      positionsHex: cluster.positionsHex,
      candidateIds: cluster.candidateIds,
      representationKindHistogram: cluster.representationKindHistogram,
      targetRegionHistogram: cluster.targetRegionHistogram,
      deltaSequence: deltas,
      primaryDeltaMotif,
      normalizedContextConsensus,
      repeatedBlockComparison,
      structuralEvidenceFlags,
    });
  }

  stageTracker.current = 'clusters analyzed';
  logStageCheckpoint(operationId, 'research', 'paletteRepeatedStructure', 'clusters analyzed', {
    clustersCount: clusterStructuralSummaries.length,
  });

  // 5. Secondary Population: Repeated-Target Groups (Section 10 & 34)
  options?.onProgress?.('Deriving repeated-target groups...', 0.55);
  const eligibleGroupEntries =
    options?.overrideRepeatedTargetGroups ?? deriveRepeatedTargetGroups(b1Result.detailedOccurrences);
  logStageCheckpoint(operationId, 'research', 'paletteRepeatedStructure', 'repeated-target groups built', {
    eligibleGroupCount: eligibleGroupEntries.size,
  });

  const repeatedTargetGroupSummaries: RepeatedTargetGroupSummary[] = [];
  let repeatedTargetGroupsWithMotif = 0;
  let repeatedTargetGroupsWithHighConsensus = 0;

  for (const [key, item] of eligibleGroupEntries.entries()) {
    const sortedPositions = Array.from(item.positions).sort((a, b) => a - b);
    const sortedPositionsHex = sortedPositions.map(toHex32);

    const deltas = sortedPositions.slice(0, -1).map((p, i) => sortedPositions[i + 1] - p);
    const primaryDeltaMotif = detectRepeatingDeltaMotif(deltas, sortedPositions);
    if (primaryDeltaMotif) {
      repeatedTargetGroupsWithMotif++;
    }

    const normalizedContextConsensus = computeNormalizedContextConsensus(
      exeBytes,
      sortedPositions,
      topologyRegions
    );
    if (
      normalizedContextConsensus.similarity.meanPairwiseSimilarity >=
      CONTEXT_SIMILARITY_THRESHOLD
    ) {
      repeatedTargetGroupsWithHighConsensus++;
    }

    const clusterMemberships = Array.from(
      new Set(
        sortedPositions
          .map((p) => clusterIdByPosition.get(p))
          .filter((cid): cid is string => cid !== undefined)
      )
    );

    const repeatedBlockComparison = compareRepeatedBlocks(
      exeBytes,
      sortedPositions,
      primaryDeltaMotif,
      logicalAssociationsByPosition,
      topologyRegions
    );

    const structuralEvidenceFlags = assignStructuralEvidenceFlags(
      primaryDeltaMotif,
      normalizedContextConsensus,
      repeatedBlockComparison
    );

    repeatedTargetGroupSummaries.push({
      groupId: `RTG_${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      candidateId: item.candidateId,
      representationKind: item.representationKind,
      sourceRegionId: item.sourceRegionId,
      sourceObjectNumber: item.sourceObjectNumber,
      physicalOccurrenceCount: sortedPositions.length,
      positions: sortedPositions,
      positionsHex: sortedPositionsHex,
      deltaSequence: deltas,
      primaryDeltaMotif,
      normalizedContextConsensus,
      clusterMemberships,
      repeatedBlockComparison,
      structuralEvidenceFlags,
    });
  }

  stageTracker.current = 'repeated-target groups analyzed';
  logStageCheckpoint(operationId, 'research', 'paletteRepeatedStructure', 'repeated-target groups analyzed', {
    groupsCount: repeatedTargetGroupSummaries.length,
  });

  // Strict Repeated-Target Group Identity Validation (Pass 1E.2B.3b, Requirements 7, 8, 9)
  let repeatedTargetGroupPositionsWithMatchingB1Evidence = 0;
  let repeatedTargetGroupPositionsMissingMatchingB1Evidence = 0;
  const invalidGroupPositionsSet = new Set<number>();
  const invalidPositionDetails: Array<{
    groupId: string;
    position: number;
    positionHex: string;
    reason: string;
  }> = [];

  for (const group of repeatedTargetGroupSummaries) {
    for (const pos of group.positions) {
      const occurrencesAtPos = logicalAssociationsByPosition.get(pos) ?? [];
      const hasExactMatch = occurrencesAtPos.some(
        (occ) =>
          occ.targetCandidateId === group.candidateId &&
          occ.representationKind === group.representationKind &&
          occ.sourceRegionId === group.sourceRegionId
      );

      if (hasExactMatch) {
        repeatedTargetGroupPositionsWithMatchingB1Evidence++;
      } else {
        repeatedTargetGroupPositionsMissingMatchingB1Evidence++;
        invalidGroupPositionsSet.add(pos);
        invalidPositionDetails.push({
          groupId: group.groupId,
          position: pos,
          positionHex: toHex32(pos),
          reason: `No matching B.1 occurrence for candidate '${group.candidateId}', representation '${group.representationKind}', sourceRegion '${group.sourceRegionId}'`,
        });
      }
    }
  }

  const invalidRepeatedTargetGroupPositions = Array.from(invalidGroupPositionsSet).sort((a, b) => a - b);
  const invalidRepeatedTargetGroupPositionsHex = invalidRepeatedTargetGroupPositions.map(toHex32);
  const allRepeatedTargetGroupPositionsResolveToMatchingB1Evidence =
    repeatedTargetGroupPositionsMissingMatchingB1Evidence === 0;
  const repeatedTargetGroupPositionsWithB1Evidence =
    repeatedTargetGroupPositionsWithMatchingB1Evidence;
  const allRepeatedTargetGroupPositionsResolveToB1 =
    allRepeatedTargetGroupPositionsResolveToMatchingB1Evidence;

  if (!allRepeatedTargetGroupPositionsResolveToMatchingB1Evidence) {
    const firstInvalid = invalidPositionDetails[0];
    const err = `FAILED — B.1 GROUP POSITION INTEGRITY VIOLATION: ${repeatedTargetGroupPositionsMissingMatchingB1Evidence} position(s) in repeated-target groups do not resolve to matching B.1 evidence (e.g. position ${firstInvalid.positionHex} in group ${firstInvalid.groupId}: ${firstInvalid.reason}). Offending positions: [${invalidRepeatedTargetGroupPositionsHex.slice(0, 10).join(', ')}].`;
    logError('research', 'paletteRepeatedStructure', operationId, err, {
      repeatedTargetGroupPositionsMissingMatchingB1Evidence,
      invalidRepeatedTargetGroupPositionsHex,
      sampleMismatches: invalidPositionDetails.slice(0, 5),
    });
    return createFailedResult(
      operationId,
      startTime,
      exePath,
      exeSize,
      err,
      b1Result,
      b2Result,
      stageTracker.current,
      {
        invalidRepeatedTargetGroupPositions,
        invalidRepeatedTargetGroupPositionsHex,
        repeatedTargetGroupPositionsMissingMatchingB1Evidence,
        repeatedTargetGroupPositionsWithMatchingB1Evidence,
        allRepeatedTargetGroupPositionsResolveToMatchingB1Evidence: false,
      }
    );
  }

  stageTracker.current = 'group integrity verified';
  logStageCheckpoint(operationId, 'research', 'paletteRepeatedStructure', 'group integrity verified', {
    repeatedTargetGroupPositionsWithMatchingB1Evidence,
  });

  // 6. Controls Analysis (Section 40 & 41, hardened in 1E.2B.3b, Requirements 11 & 12)
  options?.onProgress?.('Evaluating control targets from B.1 and negative controls...', 0.8);
  const knownAnchorControlSummary: KnownAnchorRepeatedStructureSummary[] = [];
  const b1ControlTargets = b1Result.controlTargets ?? [];

  for (const controlTarget of b1ControlTargets) {
    const occurrencePositions = Array.from(
      new Set((controlTarget.occurrences ?? []).map((o) => o.sourceFileOffset))
    ).sort((a, b) => a - b);
    const occurrencePositionsHex = occurrencePositions.map(toHex32);

    const participatingClusterIds = Array.from(
      new Set(
        occurrencePositions
          .map((pos) => clusterIdByPosition.get(pos))
          .filter((cid): cid is string => cid !== undefined)
      )
    );

    const participatingGroupIds = Array.from(
      new Set(
        occurrencePositions.flatMap((pos) => {
          const groups: string[] = [];
          for (const group of repeatedTargetGroupSummaries) {
            if (group.positions.includes(pos)) {
              groups.push(group.groupId);
            }
          }
          return groups;
        })
      )
    );

    let repeatedStructuralAnalysisStatus: 'eligible-analyzed' | 'not-applicable-insufficient-occurrences' =
      'not-applicable-insufficient-occurrences';
    let repeatedStructuralResult: KnownAnchorRepeatedStructureSummary['repeatedStructuralResult'] = null;

    if (occurrencePositions.length >= REPEATED_TARGET_MINIMUM_OCCURRENCES) {
      const deltas = occurrencePositions.slice(0, -1).map((p, i) => occurrencePositions[i + 1] - p);
      const primaryDeltaMotif = detectRepeatingDeltaMotif(deltas, occurrencePositions);
      const normalizedContextConsensus = computeNormalizedContextConsensus(
        exeBytes,
        occurrencePositions,
        topologyRegions
      );
      const repeatedBlockComparison = compareRepeatedBlocks(
        exeBytes,
        occurrencePositions,
        primaryDeltaMotif,
        logicalAssociationsByPosition,
        topologyRegions
      );
      const structuralEvidenceFlags = assignStructuralEvidenceFlags(
        primaryDeltaMotif,
        normalizedContextConsensus,
        repeatedBlockComparison
      );
      repeatedStructuralAnalysisStatus = 'eligible-analyzed';
      repeatedStructuralResult = {
        deltaSequence: deltas,
        primaryDeltaMotif,
        normalizedContextConsensus,
        repeatedBlockComparison,
        structuralEvidenceFlags,
      };
    }

    knownAnchorControlSummary.push({
      name: controlTarget.name,
      physicalOffset: controlTarget.physicalOffset,
      physicalOffsetHex: controlTarget.physicalOffsetHex,
      representationsTested: (controlTarget.representationsTested ?? []).map((r) => ({
        name: r.name,
        value: r.value,
        valueHex: r.valueHex,
      })),
      B1TotalLogicalMatches: controlTarget.totalLogicalMatches,
      B1UniquePhysicalOccurrences: controlTarget.uniquePhysicalOccurrences,
      B1ExternalOccurrences: controlTarget.externalOccurrences,
      B1SourceRegionDistribution: { ...(controlTarget.sourceRegionDistribution ?? {}) },
      externalOccurrencePositions: occurrencePositions,
      externalOccurrencePositionsHex: occurrencePositionsHex,
      participatingPaletteClusterIds: participatingClusterIds,
      participatingRepeatedTargetGroupIds: participatingGroupIds,
      repeatedStructuralAnalysisStatus,
      repeatedStructuralResult,
      // backwards compatibility aliases
      controlName: controlTarget.name,
      targetOffset: controlTarget.physicalOffset,
      targetOffsetHex: controlTarget.physicalOffsetHex,
      occurrenceCount: occurrencePositions.length,
      occurrencePositions,
      occurrencePositionsHex,
      participatingClusterIds,
      participatingGroupIds,
      hasRepeatedStructuralContext:
        participatingClusterIds.length > 0 || participatingGroupIds.length > 0,
    });
  }

  stageTracker.current = 'controls analyzed';
  logStageCheckpoint(operationId, 'research', 'paletteRepeatedStructure', 'controls analyzed', {
    controlsCount: knownAnchorControlSummary.length,
  });

  // Dynamic negative control derivation (Section 05, 11, 12, hardened in 1E.2B.3b, Requirements 1, 2, 3)
  const negativeControlSummary = deriveNegativeControlSummary(b1Result, b2Result);
  if (negativeControlSummary.B3RepeatedContextStatus === 'unexpected-occurrences-found') {
    logWarning(
      'research',
      'paletteRepeatedStructure',
      operationId,
      `WARNING: Negative control contradiction: candidate ${NEGATIVE_CONTROL_CANDIDATE_ID} yielded unexpected occurrences (B.1: ${negativeControlSummary.B1OccurrenceCount}, B.2: ${negativeControlSummary.B2ContextCount}), contradicting previous real-fixture negative baseline.`
    );
  }

  stageTracker.current = 'negative control derived';
  logStageCheckpoint(operationId, 'research', 'paletteRepeatedStructure', 'negative control derived', {
    B1OccurrenceCount: negativeControlSummary.B1OccurrenceCount,
    B2ContextCount: negativeControlSummary.B2ContextCount,
    status: negativeControlSummary.B3RepeatedContextStatus,
  });

  // 7. Strict Reconciliation (Section 59, hardened in 1E.2B.3b, Requirements 8 & 9)
  options?.onProgress?.('Performing strict reconciliation...', 0.9);
  const b2ClusterInputCount = b2Result.trackB.clusters.length;
  const b3ClustersProcessed = clusterStructuralSummaries.length;
  const b3ClustersSkipped = 0;
  const allClustersAccountedFor =
    b3ClustersProcessed + b3ClustersSkipped === b2ClusterInputCount;

  const b2ClusteredPhysicalPositions = b2Result.reconciliation.clusteredPositions;
  const clusterPositionsReconcile =
    b2ClusteredPhysicalPositions === b3ClusteredPhysicalPositionsReferenced;

  const repeatedTargetEligibleGroupCount = eligibleGroupEntries.size;
  const repeatedTargetGroupsProcessed = repeatedTargetGroupSummaries.length;
  const repeatedTargetGroupsSkipped = 0;
  const allRepeatedTargetGroupsAccountedFor =
    repeatedTargetGroupsProcessed + repeatedTargetGroupsSkipped ===
    repeatedTargetEligibleGroupCount;

  const allReconciled =
    allClustersAccountedFor &&
    clusterPositionsReconcile &&
    allRepeatedTargetGroupsAccountedFor &&
    allClusterPositionsResolveToB1 &&
    allRepeatedTargetGroupPositionsResolveToMatchingB1Evidence;

  const reconciliation: RepeatedStructureReconciliation = {
    b2ClusterInputCount,
    b3ClustersProcessed,
    b3ClustersSkipped,
    allClustersAccountedFor,
    b2ClusteredPhysicalPositions,
    b3ClusteredPhysicalPositionsReferenced,
    clusterPositionsReconcile,
    clusterPositionsWithB1Evidence,
    clusterPositionsMissingB1Evidence,
    allClusterPositionsResolveToB1,
    repeatedTargetEligibleGroupCount,
    repeatedTargetGroupsProcessed,
    repeatedTargetGroupsSkipped,
    allRepeatedTargetGroupsAccountedFor,
    repeatedTargetGroupPositionsWithMatchingB1Evidence,
    repeatedTargetGroupPositionsMissingMatchingB1Evidence,
    invalidRepeatedTargetGroupPositions,
    invalidRepeatedTargetGroupPositionsHex,
    allRepeatedTargetGroupPositionsResolveToMatchingB1Evidence,
    repeatedTargetGroupPositionsWithB1Evidence,
    allRepeatedTargetGroupPositionsResolveToB1,
    allReconciled,
  };

  stageTracker.current = 'reconciliation complete';
  logStageCheckpoint(operationId, 'research', 'paletteRepeatedStructure', 'reconciliation complete', {
    allReconciled,
    b3ClustersProcessed,
    repeatedTargetGroupsProcessed,
  });

  const globalStructuralSummary: GlobalStructuralSummary = {
    b2ClustersProcessed: b3ClustersProcessed,
    repeatedTargetGroupsDerived: repeatedTargetGroupsProcessed,
    clustersWithRepeatingDeltaMotif,
    clustersWithConstantDeltaMotif,
    clustersWithMultiDeltaMotif,
    clustersWithNoRepeatingMotif,
    clustersWithHighContextConsensus,
    repeatedCycleBlocksCompared,
    repeatedTargetGroupsWithMotif,
    repeatedTargetGroupsWithHighConsensus,
  };

  const durationMs = Date.now() - startTime;
  const status = allReconciled ? 'SUCCESS' : 'PARTIAL';

  logInfo('research', 'paletteRepeatedStructure', operationId, `Milestone 1E.2B.3 complete with status ${status} in ${durationMs}ms`);

  stageTracker.current = 'export constructed';

  return {
    status,
    metadata: {
      operationId,
      timestamp: new Date().toISOString(),
      durationMs,
      milestone: '1E.2B.3',
    },
    fixture: {
      exePath,
      exeSize,
    },
    sourceB1Summary: {
      externalLogicalMatches: b1Result.globalSummary.totalExternalLogicalMatches,
      uniquePhysicalPositions: b1Result.globalSummary.uniqueExternalPhysicalOccurrencePositions,
      omittedTruncatedOccurrences: b1TruncationOmitted,
    },
    sourceB2Summary: {
      clustersCount: b2Result.trackB.totalClustersIdentified,
      clusteredPositions: b2Result.trackB.clusteredPositionsCount,
      unclusteredPositions: b2Result.trackB.isolatedPositionsCount,
      object1TrackAPositions: b2Result.trackA.eligibleObject1Positions,
    },
    scanConfiguration: getRepeatedStructureScanConfiguration(),
    reconciliation,
    globalStructuralSummary,
    clusterStructuralSummaries,
    repeatedTargetGroupSummaries,
    knownAnchorControlSummary,
    negativeControlSummary,
  };
}

/**
 * Creates compact export schema payload: mk1_palette_repeated_structure_recon_v1 (Section 56 & 57).
 */
export function createMK1CompactPaletteRepeatedStructureReconExport(
  result: MK1PaletteRepeatedStructureResult
): MK1CompactPaletteRepeatedStructureReconExport {
  return {
    format: 'mk1_palette_repeated_structure_recon_v1',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    metadata: {
      operationId: result.metadata.operationId,
      timestamp: result.metadata.timestamp,
      durationMs: result.metadata.durationMs,
      milestone: result.metadata.milestone,
    },
    fixture: {
      exePath: result.fixture.exePath,
      exeSize: result.fixture.exeSize,
    },
    sourceB1Summary: { ...result.sourceB1Summary },
    sourceB2Summary: { ...result.sourceB2Summary },
    scanConfiguration: { ...result.scanConfiguration },
    reconciliation: { ...result.reconciliation },
    globalStructuralSummary: { ...result.globalStructuralSummary },
    clusterStructuralSummaries: result.clusterStructuralSummaries,
    repeatedTargetGroupSummaries: result.repeatedTargetGroupSummaries,
    knownAnchorControlSummary: result.knownAnchorControlSummary,
    negativeControlSummary: { ...result.negativeControlSummary },
  };
}
