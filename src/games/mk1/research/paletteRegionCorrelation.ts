import {
  MK1PaletteCandidate,
  MK1PaletteScanResult,
} from './paletteTypes';
import {
  MK1ExecutablePhysicalTopology,
  MK1ExecutableRegion,
} from './executableRegionTopology';
import {
  LEObjectEntry,
} from '../../../core/executable/le/leTypes';
import {
  computePaletteObjectDistribution,
} from './executableLayoutProbe';
import {
  CandidateRegionClassification,
  MK1CompactPaletteRegionCorrelationExport,
  MK1CrossRegionSummary,
  MK1MultiRegionContentOccurrence,
  MK1MultiRegionContentSummary,
  MK1PaletteRegionCorrelationResult,
  MK1PaletteRegionDistributionRow,
  MK1PaletteRegionReconciliation,
  MK1UnclassifiedSummary,
  PaletteRegionCandidateAssignment,
} from './paletteRegionCorrelationTypes';
import {
  createOperationId,
  logError,
  logInfo,
  logStageCheckpoint,
  logWarning,
} from '../../../core/diagnostics/diagnosticLogger';

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase().trim();
}

export interface CorrelationOptions {
  exePath?: string;
  exeSize?: number;
  pageSize?: number;
  operationId?: string;
}

/**
 * Classifies a single palette candidate's full [byteStart, byteEnd) span against
 * the authoritative executable physical regions.
 */
export function classifyCandidateRange(
  candidate: MK1PaletteCandidate,
  regions: MK1ExecutableRegion[],
): {
  classification: CandidateRegionClassification;
  region: MK1ExecutableRegion | null;
  intersectedRegions: MK1ExecutableRegion[];
} {
  const start = candidate.byteStart;
  const end = candidate.byteEnd;

  // Intersect if max(start1, start2) < min(end1, end2)
  const intersected = regions.filter(
    (r) => Math.max(start, r.fileStart) < Math.min(end, r.fileEnd),
  );

  if (intersected.length === 0) {
    return {
      classification: 'unclassified',
      region: null,
      intersectedRegions: [],
    };
  }

  if (intersected.length === 1) {
    const reg = intersected[0];
    if (start >= reg.fileStart && end <= reg.fileEnd) {
      return {
        classification: 'contained',
        region: reg,
        intersectedRegions: [reg],
      };
    }
    // Intersects only one region but extends outside it (e.g. into an unmapped gap)
    return {
      classification: 'cross-region',
      region: null,
      intersectedRegions: [reg],
    };
  }

  // Intersects two or more regions
  return {
    classification: 'cross-region',
    region: null,
    intersectedRegions: intersected,
  };
}

/**
 * Correlates existing palette candidates with verified executable physical topology.
 * Operates purely in-memory on the provided candidate set without re-scanning.
 */
export function correlatePalettesWithExecutableRegions(
  paletteScanResult: MK1PaletteScanResult,
  topology: MK1ExecutablePhysicalTopology,
  objects: LEObjectEntry[],
  options: CorrelationOptions = {},
): MK1PaletteRegionCorrelationResult {
  const operationId = options.operationId || createOperationId('palette-region');
  const timestamp = new Date().toISOString();

  const topologyPath = options.exePath || paletteScanResult.exePath;
  const topologySize = options.exeSize ?? topology.totalFileSize;

  logStageCheckpoint(operationId, 'research-mk1', 'palette-region-correlation', 'start', {
    paletteExePath: paletteScanResult.exePath,
    paletteExeSize: paletteScanResult.exeSize,
    paletteCandidatesCount: paletteScanResult.candidates.length,
    topologyRegionsCount: topology.regions.length,
    topologySize,
  });

  // 1. Fixture Identity Validation
  const normPalettePath = normalizePath(paletteScanResult.exePath);
  const normTopologyPath = normalizePath(topologyPath);
  const paletteName = normPalettePath.split('/').pop() || '';
  const topologyName = normTopologyPath.split('/').pop() || '';

  const pathMatches =
    normPalettePath === normTopologyPath ||
    paletteName === topologyName ||
    paletteName.length === 0 ||
    topologyName.length === 0;

  const sizeMatches = paletteScanResult.exeSize === topologySize;

  if (!sizeMatches || !pathMatches) {
    const failureReason = `Fixture mismatch: palette catalogue (${paletteScanResult.exePath}, ${paletteScanResult.exeSize} bytes) is incompatible with executable topology (${topologyPath}, ${topologySize} bytes). Correlation refused.`;
    logError('research-mk1', 'palette-region-correlation', operationId, new Error(failureReason), {
      palettePath: paletteScanResult.exePath,
      paletteSize: paletteScanResult.exeSize,
      topologyPath,
      topologySize,
    });

    return {
      status: 'FAILED',
      failureReason,
      operationId,
      timestamp,
      sourceIdentity: {
        paletteExePath: paletteScanResult.exePath,
        paletteExeSize: paletteScanResult.exeSize,
        topologyExePath: topologyPath,
        topologyExeSize: topologySize,
      },
      reconciliation: {
        structuralInputCount: paletteScanResult.candidates.length,
        structuralAssignedCount: 0,
        structuralCrossRegionCount: 0,
        structuralUnclassifiedCount: 0,
        structuralReconciles: false,
        researchInputCount: paletteScanResult.candidates.filter((c) => c.tier === 'research').length,
        researchAssignedCount: 0,
        researchCrossRegionCount: 0,
        researchUnclassifiedCount: 0,
        researchReconciles: false,
        totalInputCount: paletteScanResult.candidates.length,
        totalClassifiedCount: 0,
        totalReconciles: false,
      },
      regionDistribution: [],
      crossRegionSummary: {
        totalCrossRegionCandidates: 0,
        structuralCrossRegionCount: 0,
        researchCrossRegionCount: 0,
        candidates: [],
      },
      unclassifiedSummary: {
        totalUnclassifiedCandidates: 0,
        structuralUnclassifiedCount: 0,
        researchUnclassifiedCount: 0,
        candidates: [],
      },
      multiRegionContentSummary: {
        uniqueContentsPresentInMultipleRegionsCount: 0,
        researchContentsPresentInMultipleRegionsCount: 0,
        multiRegionContents: [],
      },
      researchCandidateAssignments: [],
    };
  }

  logStageCheckpoint(operationId, 'research-mk1', 'palette-region-correlation', 'source-validation', {
    verifiedFixturePath: topologyPath,
    verifiedFixtureSize: topologySize,
  });

  // 2. Classify candidate ranges
  const allAssignments: PaletteRegionCandidateAssignment[] = [];
  const crossRegionAssignments: PaletteRegionCandidateAssignment[] = [];
  const unclassifiedAssignments: PaletteRegionCandidateAssignment[] = [];
  const containedAssignmentsByRegion = new Map<string, PaletteRegionCandidateAssignment[]>();

  for (const reg of topology.regions) {
    containedAssignmentsByRegion.set(reg.regionId, []);
  }

  for (const cand of paletteScanResult.candidates) {
    const { classification, region, intersectedRegions } = classifyCandidateRange(
      cand,
      topology.regions,
    );

    const assignment: PaletteRegionCandidateAssignment = {
      candidateId: cand.id,
      exeOffset: cand.exeOffset,
      exeOffsetHex: cand.exeOffsetHex,
      byteStart: cand.byteStart,
      byteStartHex: toHex32(cand.byteStart),
      byteEnd: cand.byteEnd,
      byteEndHex: toHex32(cand.byteEnd),
      length: cand.length,
      contentHash: cand.contentHash,
      tier: cand.tier,
      researchScore: cand.researchScore,
      zeroShiftKanoCompatible: !!cand.zeroShiftKanoCompatible,
      duplicateContentOf: cand.duplicateContentOf,
      classification,
      regionId: region ? region.regionId : null,
      regionClass: region ? region.regionClass : null,
      regionName: region ? region.name : null,
      objectNumber: region ? (region.objectNumber ?? null) : null,
      intersectedRegionIds: intersectedRegions.map((r) => r.regionId),
      intersectedRegionClasses: intersectedRegions.map((r) => r.regionClass),
    };

    allAssignments.push(assignment);

    if (classification === 'contained' && region) {
      containedAssignmentsByRegion.get(region.regionId)?.push(assignment);
    } else if (classification === 'cross-region') {
      crossRegionAssignments.push(assignment);
    } else {
      unclassifiedAssignments.push(assignment);
    }
  }

  logStageCheckpoint(operationId, 'research-mk1', 'palette-region-correlation', 'range-classification', {
    totalProcessed: allAssignments.length,
    crossRegionCount: crossRegionAssignments.length,
    unclassifiedCount: unclassifiedAssignments.length,
  });

  // 3. Build Region Distribution Rows
  const totalStructuralInput = paletteScanResult.candidates.length;
  const totalResearchInput = paletteScanResult.candidates.filter((c) => c.tier === 'research').length;

  const regionDistribution: MK1PaletteRegionDistributionRow[] = topology.regions.map((region) => {
    const contained = containedAssignmentsByRegion.get(region.regionId) || [];
    const structuralCount = contained.length;
    const researchCount = contained.filter((c) => c.tier === 'research').length;
    const uniqueContentHashes = new Set(contained.map((c) => c.contentHash));
    const duplicateCount = contained.filter((c) => c.duplicateContentOf !== undefined).length;
    const zeroShiftCompatibleCount = contained.filter((c) => c.zeroShiftKanoCompatible).length;

    const structuralPercentage = totalStructuralInput > 0
      ? Math.round((structuralCount / totalStructuralInput) * 10000) / 100
      : 0;

    const researchPercentage = totalResearchInput > 0
      ? Math.round((researchCount / totalResearchInput) * 10000) / 100
      : 0;

    return {
      regionId: region.regionId,
      regionClass: region.regionClass,
      regionName: region.name,
      objectNumber: region.objectNumber ?? null,
      fileStart: region.fileStart,
      fileStartHex: region.fileStartHex,
      fileEnd: region.fileEnd,
      fileEndHex: region.fileEndHex,
      byteLength: region.byteLength,
      structuralCandidateCount: structuralCount,
      researchCandidateCount: researchCount,
      uniqueContentCount: uniqueContentHashes.size,
      duplicateCandidateCount: duplicateCount,
      zeroShiftKanoCompatibleCount: zeroShiftCompatibleCount,
      structuralPercentageOfTotal: structuralPercentage,
      researchPercentageOfTotal: researchPercentage,
    };
  });

  logStageCheckpoint(operationId, 'research-mk1', 'palette-region-correlation', 'region-aggregation', {
    distributionRowsCount: regionDistribution.length,
  });

  // 4. Cross-Region & Unclassified Summaries
  const crossRegionSummary: MK1CrossRegionSummary = {
    totalCrossRegionCandidates: crossRegionAssignments.length,
    structuralCrossRegionCount: crossRegionAssignments.length,
    researchCrossRegionCount: crossRegionAssignments.filter((c) => c.tier === 'research').length,
    candidates: crossRegionAssignments,
  };

  const unclassifiedSummary: MK1UnclassifiedSummary = {
    totalUnclassifiedCandidates: unclassifiedAssignments.length,
    structuralUnclassifiedCount: unclassifiedAssignments.length,
    researchUnclassifiedCount: unclassifiedAssignments.filter((c) => c.tier === 'research').length,
    candidates: unclassifiedAssignments,
  };

  // 5. Multi-Region Unique Content Identification
  // Group all contained assignments by contentHash and collect their distinct regions
  const contentToRegionsMap = new Map<string, { regions: Set<string>; count: number; isResearch: boolean }>();
  for (const asgn of allAssignments) {
    if (asgn.classification === 'contained' && asgn.regionId) {
      let entry = contentToRegionsMap.get(asgn.contentHash);
      if (!entry) {
        entry = {
          regions: new Set<string>(),
          count: 0,
          isResearch: false,
        };
        contentToRegionsMap.set(asgn.contentHash, entry);
      }
      entry.regions.add(asgn.regionId);
      entry.count++;
      if (asgn.tier === 'research') {
        entry.isResearch = true;
      }
    }
  }

  const multiRegionContents: MK1MultiRegionContentOccurrence[] = [];
  let multiRegionUniqueCount = 0;
  let multiRegionResearchCount = 0;

  for (const [hash, entry] of contentToRegionsMap.entries()) {
    if (entry.regions.size > 1) {
      multiRegionUniqueCount++;
      if (entry.isResearch) {
        multiRegionResearchCount++;
      }
      multiRegionContents.push({
        contentHash: hash,
        regions: Array.from(entry.regions),
        occurrenceCount: entry.count,
        isResearchTier: entry.isResearch,
      });
    }
  }

  const multiRegionContentSummary: MK1MultiRegionContentSummary = {
    uniqueContentsPresentInMultipleRegionsCount: multiRegionUniqueCount,
    researchContentsPresentInMultipleRegionsCount: multiRegionResearchCount,
    multiRegionContents,
  };

  // 6. Reconciliation Invariants
  const structuralAssigned = regionDistribution.reduce((acc, r) => acc + r.structuralCandidateCount, 0);
  const structuralCross = crossRegionSummary.structuralCrossRegionCount;
  const structuralUnclass = unclassifiedSummary.structuralUnclassifiedCount;
  const structuralReconciles = (structuralAssigned + structuralCross + structuralUnclass) === totalStructuralInput;

  const researchAssigned = regionDistribution.reduce((acc, r) => acc + r.researchCandidateCount, 0);
  const researchCross = crossRegionSummary.researchCrossRegionCount;
  const researchUnclass = unclassifiedSummary.researchUnclassifiedCount;
  const researchReconciles = (researchAssigned + researchCross + researchUnclass) === totalResearchInput;

  const totalClassified = structuralAssigned + structuralCross + structuralUnclass;
  const totalReconciles = structuralReconciles && researchReconciles;

  const reconciliation: MK1PaletteRegionReconciliation = {
    structuralInputCount: totalStructuralInput,
    structuralAssignedCount: structuralAssigned,
    structuralCrossRegionCount: structuralCross,
    structuralUnclassifiedCount: structuralUnclass,
    structuralReconciles,

    researchInputCount: totalResearchInput,
    researchAssignedCount: researchAssigned,
    researchCrossRegionCount: researchCross,
    researchUnclassifiedCount: researchUnclass,
    researchReconciles,

    totalInputCount: totalStructuralInput,
    totalClassifiedCount: totalClassified,
    totalReconciles,
  };

  if (!totalReconciles) {
    logWarning(
      'research-mk1',
      'palette-region-correlation',
      operationId,
      'Palette region correlation counts did not perfectly reconcile with input candidate totals',
      { reconciliation },
    );
  } else {
    logStageCheckpoint(operationId, 'research-mk1', 'palette-region-correlation', 'reconciliation-complete', {
      reconciliation,
    });
  }

  // 7. Research-Tier Assignment Detail
  const researchCandidateAssignments = allAssignments.filter((c) => c.tier === 'research');

  // 8. Compute secondary LE Object Rollup for comparative reference
  let secondaryObjectRollup;
  try {
    secondaryObjectRollup = computePaletteObjectDistribution(
      paletteScanResult.candidates,
      objects,
      options.pageSize || 4096,
    );
  } catch (err: unknown) {
    logWarning(
      'research-mk1',
      'palette-region-correlation',
      operationId,
      'Failed to compute secondary object rollup',
      { error: String(err) },
    );
  }

  logInfo(
    'research-mk1',
    'palette-region-correlation',
    operationId,
    `Palette-region correlation completed: ${totalStructuralInput} candidates evaluated, ${structuralAssigned} contained in regions, ${structuralCross} cross-region, ${structuralUnclass} unclassified. Reconciled: ${totalReconciles}.`,
  );

  return {
    status: totalReconciles ? 'SUCCESS' : 'PARTIAL',
    operationId,
    timestamp,
    sourceIdentity: {
      paletteExePath: paletteScanResult.exePath,
      paletteExeSize: paletteScanResult.exeSize,
      topologyExePath: topologyPath,
      topologyExeSize: topologySize,
    },
    reconciliation,
    regionDistribution,
    crossRegionSummary,
    unclassifiedSummary,
    multiRegionContentSummary,
    researchCandidateAssignments,
    secondaryObjectRollup,
  };
}

/**
 * Creates the deterministic compact export payload for palette-to-region correlation.
 */
export function createMK1CompactPaletteRegionCorrelationExport(
  correlation: MK1PaletteRegionCorrelationResult,
  paletteScanResult: MK1PaletteScanResult,
  topology: MK1ExecutablePhysicalTopology,
  metadata: { name: string; version: string; milestone: string },
): MK1CompactPaletteRegionCorrelationExport {
  return {
    metadata: {
      name: metadata.name,
      version: metadata.version,
      milestone: metadata.milestone,
      formatVersion: 'mk1_palette_region_correlation_v1',
      generatedAt: correlation.timestamp,
    },
    fixture: {
      exePath: correlation.sourceIdentity.paletteExePath,
      exeSize: correlation.sourceIdentity.paletteExeSize,
      exeSizeHex: toHex32(correlation.sourceIdentity.paletteExeSize),
      totalTopologyRegions: topology.regions.length,
    },
    sourcePaletteCatalogueSummary: {
      rawLengthCandidatesCount: paletteScanResult.counts.rawLengthCandidatesCount,
      colors15BitValidCount: paletteScanResult.counts.colors15BitValidCount,
      structuralCandidatesCount: paletteScanResult.counts.structuralCandidatesCount,
      researchCandidatesCount: paletteScanResult.counts.researchCandidatesCount,
      uniqueContentsCount: paletteScanResult.counts.uniqueContentsCount,
      duplicateCount: paletteScanResult.counts.duplicateCount,
    },
    sourceExecutableTopologySummary: {
      boundaries: {
        highestFileBackedPageEndHex: topology.boundaries.highestFileBackedPageEndHex,
        headerDerivedPageDataEndHex: topology.boundaries.headerDerivedPageDataEndHex,
        discrepancyBytes: topology.boundaries.discrepancyBytes,
      },
      postModuleTail: {
        startOffsetHex: topology.postModuleTail.startOffsetHex,
        endOffsetHex: topology.postModuleTail.endOffsetHex,
        byteLength: topology.postModuleTail.byteLength,
        percentageOfTotalExecutable: topology.postModuleTail.percentageOfTotalExecutable,
      },
    },
    reconciliation: correlation.reconciliation,
    regionDistribution: correlation.regionDistribution,
    crossRegionSummary: correlation.crossRegionSummary,
    unclassifiedSummary: correlation.unclassifiedSummary,
    multiRegionContentSummary: correlation.multiRegionContentSummary,
    researchCandidateAssignments: correlation.researchCandidateAssignments,
  };
}
