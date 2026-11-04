import {
  MK1PaletteCandidate,
  MK1PaletteScanResult,
  PaletteCandidateTier,
} from './paletteTypes';
import {
  MK1ExecutablePhysicalTopology,
  MK1ExecutableRegion,
  MK1ExecutableRegionClass,
} from './executableRegionTopology';
import {
  MK1PaletteObjectDistribution,
} from './executableLayoutTypes';

export type CandidateRegionClassification = 'contained' | 'cross-region' | 'unclassified';

export interface PaletteRegionCandidateAssignment {
  candidateId: string;
  exeOffset: number;
  exeOffsetHex: string;
  byteStart: number;
  byteStartHex: string;
  byteEnd: number;
  byteEndHex: string;
  length: number;
  contentHash: string;
  tier: PaletteCandidateTier;
  researchScore: number;
  zeroShiftKanoCompatible: boolean;
  duplicateContentOf?: string;
  classification: CandidateRegionClassification;
  regionId: string | null;
  regionClass: MK1ExecutableRegionClass | string | null;
  regionName: string | null;
  objectNumber: number | null;
  intersectedRegionIds: string[];
  intersectedRegionClasses: string[];
}

export interface MK1PaletteRegionDistributionRow {
  regionId: string;
  regionClass: MK1ExecutableRegionClass | string;
  regionName: string;
  objectNumber: number | null;
  fileStart: number;
  fileStartHex: string;
  fileEnd: number;
  fileEndHex: string;
  byteLength: number;
  structuralCandidateCount: number;
  researchCandidateCount: number;
  uniqueContentCount: number;
  duplicateCandidateCount: number;
  zeroShiftKanoCompatibleCount: number;
  structuralPercentageOfTotal: number;
  researchPercentageOfTotal: number;
}

export interface MK1CrossRegionSummary {
  totalCrossRegionCandidates: number;
  structuralCrossRegionCount: number;
  researchCrossRegionCount: number;
  candidates: PaletteRegionCandidateAssignment[];
}

export interface MK1UnclassifiedSummary {
  totalUnclassifiedCandidates: number;
  structuralUnclassifiedCount: number;
  researchUnclassifiedCount: number;
  candidates: PaletteRegionCandidateAssignment[];
}

export interface MK1MultiRegionContentOccurrence {
  contentHash: string;
  regions: string[];
  occurrenceCount: number;
  isResearchTier: boolean;
}

export interface MK1MultiRegionContentSummary {
  uniqueContentsPresentInMultipleRegionsCount: number;
  researchContentsPresentInMultipleRegionsCount: number;
  multiRegionContents: MK1MultiRegionContentOccurrence[];
}

export interface MK1PaletteRegionReconciliation {
  structuralInputCount: number;
  structuralAssignedCount: number;
  structuralCrossRegionCount: number;
  structuralUnclassifiedCount: number;
  structuralReconciles: boolean;

  researchInputCount: number;
  researchAssignedCount: number;
  researchCrossRegionCount: number;
  researchUnclassifiedCount: number;
  researchReconciles: boolean;

  totalInputCount: number;
  totalClassifiedCount: number;
  totalReconciles: boolean;
}

export interface MK1PaletteRegionCorrelationResult {
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  failureReason?: string;
  operationId: string;
  timestamp: string;
  sourceIdentity: {
    paletteExePath: string;
    paletteExeSize: number;
    topologyExePath: string;
    topologyExeSize: number;
  };
  reconciliation: MK1PaletteRegionReconciliation;
  regionDistribution: MK1PaletteRegionDistributionRow[];
  crossRegionSummary: MK1CrossRegionSummary;
  unclassifiedSummary: MK1UnclassifiedSummary;
  multiRegionContentSummary: MK1MultiRegionContentSummary;
  researchCandidateAssignments: PaletteRegionCandidateAssignment[];
  secondaryObjectRollup?: MK1PaletteObjectDistribution;
}

export interface MK1CompactPaletteRegionCorrelationExport {
  metadata: {
    name: string;
    version: string;
    milestone: string;
    formatVersion: 'mk1_palette_region_correlation_v1';
    generatedAt: string;
  };
  fixture: {
    exePath: string;
    exeSize: number;
    exeSizeHex: string;
    totalTopologyRegions: number;
  };
  sourcePaletteCatalogueSummary: {
    rawLengthCandidatesCount: number;
    colors15BitValidCount: number;
    structuralCandidatesCount: number;
    researchCandidatesCount: number;
    uniqueContentsCount: number;
    duplicateCount: number;
  };
  sourceExecutableTopologySummary: {
    boundaries: {
      highestFileBackedPageEndHex: string;
      headerDerivedPageDataEndHex: string;
      discrepancyBytes: number;
    };
    postModuleTail: {
      startOffsetHex: string;
      endOffsetHex: string;
      byteLength: number;
      percentageOfTotalExecutable: number;
    };
  };
  reconciliation: MK1PaletteRegionReconciliation;
  regionDistribution: MK1PaletteRegionDistributionRow[];
  crossRegionSummary: MK1CrossRegionSummary;
  unclassifiedSummary: MK1UnclassifiedSummary;
  multiRegionContentSummary: MK1MultiRegionContentSummary;
  researchCandidateAssignments: PaletteRegionCandidateAssignment[];
}
