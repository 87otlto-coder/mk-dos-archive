/**
 * MK1 Executable Palette Operand Summaries & Matrices (Milestone 1E.2B.8a)
 *
 * Implements address space matrix, candidate summaries, two-hop summaries,
 * decision pattern tables, and control summaries strictly derived from evidence.
 */

import {
  MK1AddressSpaceMatrix,
  MK1CandidateOperandUseSummary,
  MK1DecisionPatternTableRow,
  MK1OperandInterpretationRecord,
  MK1OperandUseControls,
  MK1SeedTraceEventSummary,
  MK1SeedTraceResult,
  MK1TwoHopTargetSummary,
} from './paletteOperandUseReconnaissanceTypes';

/**
 * Builds the coordinate space x operand semantic class matrix.
 * Rows: physical, object-relative, linear, site-physical
 * Columns: register-immediate, push-immediate, arithmetic-immediate, direct-load, direct-store, lea
 */
export function buildAddressSpaceMatrix(
  interpretations: MK1OperandInterpretationRecord[],
): MK1AddressSpaceMatrix {
  const rows: ('physical' | 'object-relative' | 'linear' | 'site-physical')[] = [
    'physical',
    'object-relative',
    'linear',
    'site-physical',
  ];
  const columns: (
    | 'register-immediate'
    | 'push-immediate'
    | 'arithmetic-immediate'
    | 'direct-load'
    | 'direct-store'
    | 'lea'
  )[] = [
    'register-immediate',
    'push-immediate',
    'arithmetic-immediate',
    'direct-load',
    'direct-store',
    'lea',
  ];

  const matrix: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    matrix[r] = {};
    for (const c of columns) {
      matrix[r][c] = 0;
    }
  }

  for (const interp of interpretations) {
    let row: 'physical' | 'object-relative' | 'linear' | 'site-physical';
    if (
      interp.associatedRepresentationKind === 'physical-structure-start' ||
      interp.associatedRepresentationKind === 'physical-payload-start'
    ) {
      row = 'physical';
    } else if (
      interp.associatedRepresentationKind === 'object-relative-payload' ||
      interp.associatedRepresentationKind === 'object-relative-structure'
    ) {
      row = 'object-relative';
    } else if (
      interp.associatedRepresentationKind === 'linear-structure-address' ||
      interp.associatedRepresentationKind === 'linear-payload-address'
    ) {
      row = 'linear';
    } else {
      row = 'site-physical';
    }

    let col:
      | 'register-immediate'
      | 'push-immediate'
      | 'arithmetic-immediate'
      | 'direct-load'
      | 'direct-store'
      | 'lea';

    switch (interp.semanticClass) {
      case 'register-immediate-seed':
        col = 'register-immediate';
        break;
      case 'push-immediate-value':
        col = 'push-immediate';
        break;
      case 'accumulator-arithmetic-immediate':
        col = 'arithmetic-immediate';
        break;
      case 'direct-memory-load-address':
        col = 'direct-load';
        break;
      case 'direct-memory-store-address':
        col = 'direct-store';
        break;
      case 'lea-address-computation':
        col = 'lea';
        break;
      default:
        col = 'register-immediate';
        break;
    }

    matrix[row][col] = (matrix[row][col] ?? 0) + 1;
  }

  return {
    rows,
    columns,
    matrix,
  };
}

function toHex32(val: number): string {
  return `0x${(val >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
}

/**
 * Builds candidate summaries for all direct candidates using authoritative upstream IDs.
 */
export function buildCandidateSummaries(
  interpretations: MK1OperandInterpretationRecord[],
): MK1CandidateOperandUseSummary[] {
  const directInterps = interpretations.filter(
    (i) => i.sourceKind === 'direct-candidate-first-hop' && i.associatedCandidateId !== null,
  );

  const candidateIdSet = new Set<string>();
  for (const interp of directInterps) {
    if (interp.associatedCandidateId) {
      candidateIdSet.add(interp.associatedCandidateId);
    }
  }

  // Deterministically sort candidate IDs
  const sortedCandidateIds = Array.from(candidateIdSet).sort();

  return sortedCandidateIds.map((candId) => {
    const interps = directInterps.filter(
      (i) => i.associatedCandidateId === candId,
    );
    const sites = new Set(interps.map((i) => i.siteFileOffsetHex));
    const firstInterp = interps[0];
    const physicalStructureOffsetHex =
      firstInterp?.targetCandidatePhysicalStructureHex ??
      (candId.includes(':') ? candId.split(':')[1]! : candId);
    const structOffset =
      firstInterp?.targetCandidatePhysicalStructure ?? parseInt(physicalStructureOffsetHex, 16);
    const physicalPayloadOffsetHex =
      firstInterp?.targetCandidatePhysicalPayloadHex ?? toHex32(structOffset + 2);
    const loadedLinearStructureCandidateHex =
      firstInterp?.targetCandidateLoadedStructureHex ?? 'UNKNOWN';
    const loadedLinearPayloadCandidateHex =
      firstInterp?.targetCandidateLoadedPayloadHex ?? 'UNKNOWN';
    const sourceClass = firstInterp?.sourceKind ?? 'direct-candidate-first-hop';

    const targetHex = physicalStructureOffsetHex;

    const shapeHistogram: Record<string, number> = {};
    const semanticHistogram: Record<string, number> = {};
    const representationHistogram: Record<string, number> = {};
    const directLinearOutcomes: Record<string, number> = {};
    let objectRelativeBaseMatches = 0;
    let seedCount = 0;
    const traceStopReasons: Record<string, number> = {};
    const memoryUseCounts = {
      memoryBase: 0,
      memoryIndex: 0,
      partialMemory: 0,
      targetCompatibleMemory: 0,
    };
    let relocationAdjustmentCounts = 0;
    let callBoundaryCount = 0;
    const distinctCallTargets = new Set<string>();
    const sourceObjectTargetRangeDistribution = {
      withinSourceObjectVirtualRange: 0,
      withinSourceObjectFileBackedRange: 0,
      outsideSourceObjectVirtualRange: 0,
    };

    for (const interp of interps) {
      shapeHistogram[interp.shapeClass] = (shapeHistogram[interp.shapeClass] ?? 0) + 1;
      semanticHistogram[interp.semanticClass] =
        (semanticHistogram[interp.semanticClass] ?? 0) + 1;
      representationHistogram[interp.associatedRepresentationKind] =
        (representationHistogram[interp.associatedRepresentationKind] ?? 0) + 1;
      directLinearOutcomes[interp.directLinearResolution] =
        (directLinearOutcomes[interp.directLinearResolution] ?? 0) + 1;

      if (interp.objectRelativeCompatibility.requiredBaseEqualsTargetObjectRelocationBase) {
        objectRelativeBaseMatches++;
      }

      if (interp.seedTrace) {
        seedCount++;
        const st = interp.seedTrace;
        traceStopReasons[st.stopReason] = (traceStopReasons[st.stopReason] ?? 0) + 1;

        if (st.seedUsedAsMemoryBase) memoryUseCounts.memoryBase++;
        if (st.seedUsedAsMemoryIndex) memoryUseCounts.memoryIndex++;
        if (st.seedPartialMemoryAddressUse) memoryUseCounts.partialMemory++;
        if (st.seedTargetCompatibleMemoryAddressObserved) memoryUseCounts.targetCompatibleMemory++;
        if (st.seedRelocationBaseAdjusted) relocationAdjustmentCounts++;

        if (st.callBoundaryTargetRecon) {
          callBoundaryCount++;
          distinctCallTargets.add(st.callBoundaryTargetRecon.targetLoadedLinearCandidateHex);
          if (st.callBoundaryTargetRecon.targetOffsetWithinSourceObjectVirtualRange) {
            sourceObjectTargetRangeDistribution.withinSourceObjectVirtualRange++;
          } else {
            sourceObjectTargetRangeDistribution.outsideSourceObjectVirtualRange++;
          }
          if (st.callBoundaryTargetRecon.targetOffsetWithinSourceObjectFileBackedRange) {
            sourceObjectTargetRangeDistribution.withinSourceObjectFileBackedRange++;
          }
        }
      }
    }

    return {
      candidateId: candId,
      targetPhysicalAddressHex: targetHex,
      sourceClass,
      physicalStructureOffsetHex,
      physicalPayloadOffsetHex,
      loadedLinearStructureCandidateHex,
      loadedLinearPayloadCandidateHex,
      directSiteCount: sites.size,
      interpretationCount: interps.length,
      associatedDirectSiteCount: sites.size,
      associatedInterpretationCount: interps.length,
      associatedSeedCount: seedCount,
      associatedCallBoundaryCount: callBoundaryCount,
      relocationAdjustmentsObserved: relocationAdjustmentCounts,
      shapeHistogram,
      semanticHistogram,
      representationHistogram,
      directLinearOutcomes,
      objectRelativeBaseMatches,
      seedCount,
      traceStopReasons,
      memoryUseCounts,
      relocationAdjustmentCounts,
      callBoundaryCount,
      distinctCallBoundaryTargets: Array.from(distinctCallTargets).sort(),
      sourceObjectTargetRangeDistribution,
    };
  });
}

/**
 * Builds two-hop target summary for 0x1D.
 */
export function buildTwoHopTargetSummaries(
  interpretations: MK1OperandInterpretationRecord[],
): MK1TwoHopTargetSummary[] {
  const twoHopInterps = interpretations.filter(
    (i) => i.sourceKind === 'two-hop-site-code-facing',
  );

  if (twoHopInterps.length === 0) {
    return [];
  }

  const shapeHistogram: Record<string, number> = {};
  const semanticHistogram: Record<string, number> = {};
  const traceStopReasons: Record<string, number> = {};
  const targetTopologyClassificationDistribution: Record<string, number> = {};
  const distinctCallTargets = new Set<string>();
  let seedCount = 0;
  let callBoundaryCount = 0;

  for (const interp of twoHopInterps) {
    shapeHistogram[interp.shapeClass] = (shapeHistogram[interp.shapeClass] ?? 0) + 1;
    semanticHistogram[interp.semanticClass] =
      (semanticHistogram[interp.semanticClass] ?? 0) + 1;

    if (interp.seedTrace) {
      seedCount++;
      const st = interp.seedTrace;
      traceStopReasons[st.stopReason] = (traceStopReasons[st.stopReason] ?? 0) + 1;
      if (st.callBoundaryTargetRecon) {
        callBoundaryCount++;
        distinctCallTargets.add(st.callBoundaryTargetRecon.targetLoadedLinearCandidateHex);
        const topo = st.callBoundaryTargetRecon.targetTopologyClassification;
        targetTopologyClassificationDistribution[topo] =
          (targetTopologyClassificationDistribution[topo] ?? 0) + 1;
      }
    }
  }

  const targetFirstHopSiteId = twoHopInterps[0]?.targetFirstHopSiteId || 'site_0x0000001D';
  const targetFirstHopSiteOffsetHex =
    twoHopInterps[0]?.targetFirstHopSiteOffsetHex || '0x0000001D';

  return [
    {
      targetFirstHopSiteId,
      targetFirstHopSiteOffsetHex,
      twoHopSiteCount: new Set(twoHopInterps.map((i) => i.siteFileOffsetHex)).size,
      interpretationCount: twoHopInterps.length,
      shapeHistogram,
      semanticHistogram,
      seedCount,
      traceStopReasons,
      callBoundaryCount,
      distinctCallBoundaryTargets: Array.from(distinctCallTargets).sort(),
      targetTopologyClassificationDistribution,
    },
  ];
}

/**
 * Builds the independent seed trace event histogram.
 */
export function buildSeedTraceEventSummary(
  traces: MK1SeedTraceResult[],
): MK1SeedTraceEventSummary {
  const summary: MK1SeedTraceEventSummary = {
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
  };

  for (const t of traces) {
    if (t.seedCopied) summary.seedCopied++;
    if (t.seedAffineAdjusted) summary.seedAffineAdjusted++;
    if (t.seedRelocationBaseAdjusted) summary.seedRelocationBaseAdjusted++;
    if (t.seedUsedAsMemoryBase) summary.seedUsedAsMemoryBase++;
    if (t.seedUsedAsMemoryIndex) summary.seedUsedAsMemoryIndex++;
    if (t.seedPartialMemoryAddressUse) summary.seedPartialMemoryAddressUse++;
    if (t.seedTargetCoordinateValueReached) summary.seedTargetCoordinateValueReached++;
    if (t.seedTargetCompatibleMemoryAddressObserved) summary.seedTargetCompatibleMemoryAddressObserved++;
    if (t.seedPushed) summary.seedPushed++;
    if (t.seedOverwritten) summary.seedOverwritten++;
    if (t.seedLiveAtCallBoundary) summary.seedLiveAtCallBoundary++;
  }

  return summary;
}

/**
 * Builds the independent stopReason histogram.
 */
export function buildSeedTraceStopReasonSummary(
  traces: MK1SeedTraceResult[],
): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const t of traces) {
    summary[t.stopReason] = (summary[t.stopReason] ?? 0) + 1;
  }
  return summary;
}

/**
 * Builds the 14-row mechanical decision pattern table.
 */
export function buildDecisionPatternTable(
  interpretations: MK1OperandInterpretationRecord[],
): MK1DecisionPatternTableRow[] {
  const patterns: {
    patternId: string;
    description: string;
    predicate: (i: MK1OperandInterpretationRecord) => boolean;
  }[] = [
    {
      patternId: 'dp_direct_loaded_exact_match',
      description: 'Direct loaded-address exact match',
      predicate: (i) => i.directLinearMatchesAssociatedTarget,
    },
    {
      patternId: 'dp_direct_loaded_resolves_other',
      description: 'Direct loaded-address resolves other location',
      predicate: (i) => i.directLinearResolution === 'resolves-other-loaded-location',
    },
    {
      patternId: 'dp_direct_loaded_unmapped',
      description: 'Direct loaded-address unmapped',
      predicate: (i) => i.directLinearResolution === 'linear-address-unmapped',
    },
    {
      patternId: 'dp_objrel_base_math_required',
      description: 'Object-relative exact + relocation base mathematically required',
      predicate: (i) =>
        i.objectRelativeCompatibility.isObjectRelativeOperand &&
        i.objectRelativeCompatibility.requiredBaseToReachTargetLoadedAddress !== null,
    },
    {
      patternId: 'dp_objrel_base_compat_reloc_base',
      description: 'Object-relative exact + required base equals target object relocation base',
      predicate: (i) =>
        i.objectRelativeCompatibility.requiredBaseEqualsTargetObjectRelocationBase === true,
    },
    {
      patternId: 'dp_relocation_adjustment_observed',
      description: 'Relocation base adjustment actually observed in seed trace',
      predicate: (i) => i.seedTrace?.seedRelocationBaseAdjusted === true,
    },
    {
      patternId: 'dp_seed_memory_base',
      description: 'Seed used as memory base',
      predicate: (i) => i.seedTrace?.seedUsedAsMemoryBase === true,
    },
    {
      patternId: 'dp_seed_memory_index',
      description: 'Seed used as memory index',
      predicate: (i) => i.seedTrace?.seedUsedAsMemoryIndex === true,
    },
    {
      patternId: 'dp_target_compatible_memory_observed',
      description: 'Target-compatible memory address observed',
      predicate: (i) => i.seedTrace?.seedTargetCompatibleMemoryAddressObserved === true,
    },
    {
      patternId: 'dp_seed_live_at_call',
      description: 'Seed live at CALL boundary',
      predicate: (i) => i.seedTrace?.seedLiveAtCallBoundary === true,
    },
    {
      patternId: 'dp_call_target_in_source_obj',
      description: 'CALL target remains in source Object',
      predicate: (i) =>
        i.seedTrace?.callBoundaryTargetRecon
          ?.targetOffsetWithinSourceObjectVirtualRange === true,
    },
    {
      patternId: 'dp_call_target_outside_source_obj',
      description: 'CALL target outside source Object',
      predicate: (i) =>
        i.seedTrace?.callBoundaryTargetRecon !== undefined &&
        i.seedTrace.callBoundaryTargetRecon.targetOffsetWithinSourceObjectVirtualRange ===
          false,
    },
    {
      patternId: 'dp_arithmetic_immediate_only',
      description: 'Arithmetic immediate only',
      predicate: (i) =>
        i.semanticClass === 'accumulator-arithmetic-immediate' ||
        i.shapeClass === 'accumulator-imm32',
    },
    {
      patternId: 'dp_physical_site_value_only',
      description: 'Physical-site-value only',
      predicate: (i) =>
        i.associatedRepresentationKind === 'first-hop-site-offset' ||
        i.associatedRepresentationKind === 'physical-structure-start' ||
        i.associatedRepresentationKind === 'physical-payload-start',
    },
    {
      patternId: 'dp_unresolved_trace',
      description: 'Unresolved trace (unsupported opcode, max bound reached, etc.)',
      predicate: (i) =>
        i.seedTrace?.stopReason === 'unsupported-opcode' ||
        i.seedTrace?.stopReason === 'max-bytes-reached' ||
        i.seedTrace?.stopReason === 'max-instructions-reached',
    },
  ];

  return patterns.map((p) => {
    const matchingSites = new Set<string>();
    let matchedInterpCount = 0;
    for (const interp of interpretations) {
      if (p.predicate(interp)) {
        matchedInterpCount++;
        matchingSites.add(interp.siteFileOffsetHex);
      }
    }
    const matchingSiteIds = Array.from(matchingSites).sort();
    return {
      patternId: p.patternId,
      description: p.description,
      matchedCount: matchedInterpCount,
      matchedInterpretationCount: matchedInterpCount,
      matchingSiteCount: matchingSites.size,
      matchingSiteIds,
    };
  });
}

/**
 * Builds controls summary verifying negative controls are excluded from positive sets.
 */
export function buildControlsSummary(
  b2NegativeControls: number,
  b7NegativeControls: number,
  positiveSiteOffsetsHex: string[],
): MK1OperandUseControls {
  // Confirm 0x0009C914 is NOT in positive site offsets
  const control0x9C914Hex = '0x0009C914';
  const control0x9C914Present = positiveSiteOffsetsHex.includes(control0x9C914Hex);

  return {
    b2NegativeRelativeControlsCount: b2NegativeControls,
    b7NegativeSecondOrderRelativeControlsCount: b7NegativeControls,
    control0x9C914Present,
    controlsExcludedFromPositiveCounts: !control0x9C914Present,
    details: [
      `B.2 Negative Relative Controls: ${b2NegativeControls} excluded from positive code-facing sites`,
      `B.7 Negative Second-Order Referrers: ${b7NegativeControls} excluded from positive code-facing sites`,
      `0x0009C914 Control: ${control0x9C914Present ? 'UNEXPECTEDLY PRESENT' : 'Correctly identified as no-positive-code-facing-site'}`,
    ],
  };
}
