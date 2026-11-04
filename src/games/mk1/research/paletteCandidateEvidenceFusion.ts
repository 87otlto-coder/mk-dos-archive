/**
 * MK1 Executable Palette Candidate Evidence Fusion (Milestone 1E.2B.6)
 *
 * Fuses candidate-generation heuristic evidence (1E.1a) with deterministic reference (1E.2B.1),
 * operand context (1E.2B.2), repeated structural motif (1E.2B.3), cycle layout (1E.2B.4),
 * and phase/harmonic divisor (1E.2B.5) evidence without assigning semantic ownership.
 */

import { MK1ExecutableLayoutReport } from './executableLayoutTypes';
import {
  MK1PaletteReferenceReconResult,
  PaletteRepresentationKind,
} from './paletteReferenceReconnaissanceTypes';
import {
  MK1PaletteOccurrenceContextResult,
  PhysicalPositionContextClassification,
  PhysicalOccurrenceCluster,
} from './paletteOccurrenceContextTypes';
import {
  MK1PaletteRepeatedStructureResult,
  RepeatedTargetGroupSummary,
  ClusterStructuralSummary,
} from './paletteRepeatedStructureTypes';
import {
  MK1PaletteCycleLayoutResult,
  PhysicalCyclePopulation,
  CrossPopulationCandidateGroup,
} from './paletteCycleLayoutTypes';
import {
  MK1PalettePhaseHarmonicResult,
  PhysicalPopulationPhaseAnalysis,
} from './palettePhaseHarmonicTypes';
import {
  logStageCheckpoint,
  logInfo,
  logWarning,
} from '../../../core/diagnostics/diagnosticLogger';
import { MK1PaletteCandidate } from './paletteTypes';
import {
  MK1PaletteCandidateEvidenceProfile,
  MK1PaletteCandidateEvidenceFusionResult,
  MK1PaletteEvidenceFusionReconciliation,
  CatalogueB1FieldMismatch,
  PaletteEvidenceFusionGlobalCohortSummary,
  PaletteEvidenceFusionLengthHistograms,
  LengthBucketKey,
  LengthBucketHistogram,
  TargetRegionPaletteEvidenceMatrixRow,
  RepresentationCandidatePropertyMatrixRow,
  StructureParticipationMatrixRow,
  PaletteEvidenceFusionControlsAudit,
  PaletteEvidenceFusionUpstreamAvailability,
  PaletteEvidenceFusionPredicateDefinitions,
  StructureDepthLevel,
  CandidateReferenceProfile,
  MK1CompactPaletteCandidateEvidenceFusionExport,
  MK1CompactCandidateEvidenceProfileExport,
} from './paletteCandidateEvidenceFusionTypes';

export interface PaletteCandidateEvidenceFusionOptions {
  exePath?: string;
  exeSize?: number;
}

const AUTHORITATIVE_KANO_MAX_SOURCE_INDEX = 23;

const LENGTH_BUCKET_KEYS: LengthBucketKey[] = [
  '2',
  '3',
  '4-7',
  '8-15',
  '16-23',
  '24-31',
  '32-63',
  '64+',
];

export function getLengthBucket(length: number): LengthBucketKey {
  if (length === 2) return '2';
  if (length === 3) return '3';
  if (length >= 4 && length <= 7) return '4-7';
  if (length >= 8 && length <= 15) return '8-15';
  if (length >= 16 && length <= 23) return '16-23';
  if (length >= 24 && length <= 31) return '24-31';
  if (length >= 32 && length <= 63) return '32-63';
  return '64+';
}

export function createEmptyLengthHistogram(): LengthBucketHistogram {
  return {
    bucketCounts: {
      '2': 0,
      '3': 0,
      '4-7': 0,
      '8-15': 0,
      '16-23': 0,
      '24-31': 0,
      '32-63': 0,
      '64+': 0,
    },
    totalCount: 0,
  };
}

export function addLengthToHistogram(
  histogram: LengthBucketHistogram,
  length: number
): void {
  const bucket = getLengthBucket(length);
  histogram.bucketCounts[bucket] = (histogram.bucketCounts[bucket] || 0) + 1;
  histogram.totalCount++;
}

export const CANONICAL_PREDICATE_DEFINITIONS: PaletteEvidenceFusionPredicateDefinitions = {
  weakForCurrentKanoPaletteHypothesis:
    'zeroShiftKanoCompatible == false OR isVeryShortCandidate == true',
  strongForCurrentKanoPaletteHypothesis:
    'zeroShiftKanoCompatible == true AND researchScore >= 50',
  structureDepthLevels: {
    none: 'No external exact references discovered under tested B.1 representations',
    'b1-external-reference':
      'At least one external exact reference in B.1, but no B.2 cluster/position participation',
    'b2-context':
      'Participates in B.2 operand shape classification or spatial cluster',
    'b3-repeated-structure':
      'Participates in B.3 repeated target groups or motif-bearing clusters',
    'b4-cycle-layout':
      'Participates in B.4 physical cycle populations or cross-population candidate groups',
    'b5-harmonic-structure':
      'Participates in B.5 phase-aligned subunit recurrence and harmonic divisor relationships',
  },
  tensionFlags: {
    referenceActiveIntrinsicWeak:
      'Candidate has external references but fails Kano compatibility or is very short (<=3)',
    referenceActiveKanoCompatible:
      'Candidate has external references and is Kano-compatible (length >= 23)',
    referenceInactiveKanoCompatible:
      'Candidate is Kano-compatible but exhibits zero external references under tested representations',
    shortCandidateAddressActive:
      'Candidate is very short (<=3) yet referenced by object-relative or linear loaded addresses',
    executableTargetAddressActive:
      'Candidate target offset resides in Object 1 (R-X code) yet has address-derived references',
    writableTargetKanoCompatible:
      'Candidate target offset resides in Object 2 (RW- data) and is Kano-compatible',
    strongCatalogueNoReference:
      'Kano-compatible candidate with research score >=50 and no external B.1 references',
    weakForCurrentKanoPaletteHypothesis:
      'zeroShiftKanoCompatible == false OR isVeryShortCandidate == true',
    strongForCurrentKanoPaletteHypothesis:
      'zeroShiftKanoCompatible == true AND researchScore >= 50',
  },
  mechanicalFlags: {
    hasExternalReferences: 'externalOccurrenceCount > 0',
    hasAddressDerivedReferences: 'addressDerivedReferenceCount > 0',
    hasPhysicalDerivedReferences: 'physicalDerivedReferenceCount > 0',
    hasStructuredReferenceEvidence:
      'Participated in structured downstream analysis (depth >= b2-context)',
    hasB5HarmonicEvidence: 'Participates in B.5 physical cycle population analysis',
    isVeryShortCandidate: 'length <= 3',
    zeroShiftKanoCompatible: 'length >= 23 (authoritative Kano max source index)',
    targetInExecutableObject:
      'Target candidate offset resides in executable Object (e.g. Object 1 R-X)',
    targetInWritableObject:
      'Target candidate offset resides in writable Object (e.g. Object 2 RW-)',
  },
};

export const CANONICAL_INTERPRETATION_CAVEATS: string[] = [
  'REFERENCE ACTIVITY != PALETTE VALIDITY: Exact address or value occurrences in executable or data sections demonstrate mechanical value coincidence under the tested representations; they do not prove semantic palette ownership.',
  'REPRESENTATION INDEPENDENCE: An unreferenced candidate under the six tested B.1 uint32 representations may be referenced by 16-bit segmented addresses, indexed table arithmetic, or uninspected dynamic logic (e.g. negative control candidate 0x0009C914).',
  'REWOLF CANDIDATE HEURISTIC: ReWolf-derived 15-bit color candidate generation is an MK1 research-tier classification tool, not a generic definition of DOS palette structures across other engines.',
  'TOPOLOGY IS NOT SEMANTICS: Location in Object 1 (R-X code) vs Object 2 (RW- data) reflects executable memory protection and section layout, not exclusive proof of instruction operands or data arrays.',
  'NO SINGLE COMPOSITE SCORE: Palette evidence dimensions (color diversity, Kano coverage, exact references, repeated cycles, harmonic divisors) are reported independently without collapsing into an arbitrary singular confidence metric.',
];

/**
 * Executes Milestone 1E.2B.6 Palette Candidate Evidence Fusion.
 */
export function executePaletteCandidateEvidenceFusion(
  report: MK1ExecutableLayoutReport,
  b1Result?: MK1PaletteReferenceReconResult | null,
  catalogueCandidates?: MK1PaletteCandidate[] | null,
  b2Result?: MK1PaletteOccurrenceContextResult | null,
  b3Result?: MK1PaletteRepeatedStructureResult | null,
  b4Result?: MK1PaletteCycleLayoutResult | null,
  b5Result?: MK1PalettePhaseHarmonicResult | null,
  options?: PaletteCandidateEvidenceFusionOptions
): MK1PaletteCandidateEvidenceFusionResult {
  const startTime = Date.now();
  const operationId = `fusion-${Date.now()}`;
  const exePath = options?.exePath ?? report.exePath ?? b1Result?.fixture?.exePath ?? 'MK1.EXE';
  const exeSize = options?.exeSize ?? report.exeSize ?? b1Result?.fixture?.exeSize ?? 0;

  // -------------------------------------------------------------------------
  // STAGE 1: Upstream Availability & Parameter Validation
  // -------------------------------------------------------------------------
  const catalogueAvailable = !!catalogueCandidates && catalogueCandidates.length > 0;
  const researchCandidates = catalogueCandidates
    ? catalogueCandidates.filter((c) => !c.tier || c.tier === 'research')
    : [];
  const catalogueResearchCandidatesCount = catalogueAvailable ? researchCandidates.length : null;

  const b1Available = !!b1Result && !!b1Result.candidateSummaries && b1Result.candidateSummaries.length > 0;
  const b1CandidateSummariesCount = b1Available && b1Result ? b1Result.candidateSummaries.length : null;
  const b2Available = !!b2Result;
  const b2ClustersCount = b2Result?.trackB?.clusters
    ? b2Result.trackB.clusters.length
    : (b2Result?.candidateContextSummaries ? b2Result.candidateContextSummaries.length : null);
  const b3Available = !!b3Result;
  const b3RepeatedGroupsCount = b3Result?.repeatedTargetGroupSummaries ? b3Result.repeatedTargetGroupSummaries.length : null;
  const b4Available = !!b4Result;
  const b4PhysicalPopulationsCount = b4Result?.physicalCyclePopulations ? b4Result.physicalCyclePopulations.length : null;
  const b5Available = !!b5Result;
  const b5PhysicalPopulationsCount = b5Result?.physicalPopulationPhaseAnalyses ? b5Result.physicalPopulationPhaseAnalyses.length : null;

  const upstreamAvailability: PaletteEvidenceFusionUpstreamAvailability = {
    catalogueAvailable,
    catalogueResearchCandidatesCount,
    b1Available,
    b1CandidateSummariesCount,
    b2Available,
    b2ClustersCount,
    b3Available,
    b3RepeatedGroupsCount,
    b4Available,
    b4PhysicalPopulationsCount,
    b5Available,
    b5PhysicalPopulationsCount,
  };

  logStageCheckpoint(
    operationId,
    'research',
    'paletteCandidateEvidenceFusion',
    'Stage 1: Upstream Availability & Parameter Validation',
    { upstreamAvailability }
  );

  // -------------------------------------------------------------------------
  // STAGE 2: Reconciliation & Identification Integrity Audit
  // -------------------------------------------------------------------------
  // Catalogue indexing & duplicates
  const catalogueMap = new Map<string, MK1PaletteCandidate>();
  const duplicateCatalogueCandidateIds: string[] = [];
  const catalogueSeen = new Set<string>();
  const contentHashCounts = new Map<string, number>();

  if (catalogueAvailable) {
    for (const c of researchCandidates) {
      if (catalogueSeen.has(c.id)) {
        duplicateCatalogueCandidateIds.push(c.id);
      }
      catalogueSeen.add(c.id);
      catalogueMap.set(c.id, c);
      if (c.contentHash) {
        contentHashCounts.set(c.contentHash, (contentHashCounts.get(c.contentHash) || 0) + 1);
      }
    }
  }

  // B.1 indexing & duplicates
  const b1CandidateIds = new Set<string>();
  const duplicateB1CandidateIds: string[] = [];
  const b1Summaries = b1Result?.candidateSummaries ?? [];
  for (const s of b1Summaries) {
    if (b1CandidateIds.has(s.candidateId)) {
      duplicateB1CandidateIds.push(s.candidateId);
    }
    b1CandidateIds.add(s.candidateId);
  }

  const duplicateCandidateIds = Array.from(
    new Set([...duplicateCatalogueCandidateIds, ...duplicateB1CandidateIds])
  );

  // Missing IDs
  const candidateProfilesMissingCatalogueEvidence: string[] = [];
  if (catalogueAvailable && b1Available) {
    for (const cid of b1CandidateIds) {
      if (!catalogueMap.has(cid)) {
        candidateProfilesMissingCatalogueEvidence.push(cid);
      }
    }
  }

  const candidateProfilesMissingB1Evidence: string[] = [];
  if (catalogueAvailable && b1Available) {
    for (const cid of catalogueSeen) {
      if (!b1CandidateIds.has(cid)) {
        candidateProfilesMissingB1Evidence.push(cid);
      }
    }
  }

  // Field consistency audit between catalogue and B.1
  const catalogueB1FieldMismatchIds: CatalogueB1FieldMismatch[] = [];
  if (catalogueAvailable && b1Available) {
    for (const b1Summary of b1Summaries) {
      const catCand = catalogueMap.get(b1Summary.candidateId);
      if (!catCand) continue;
      const mismatches: string[] = [];

      if (b1Summary.byteStart !== catCand.byteStart) mismatches.push('byteStart');
      if (b1Summary.byteEnd !== catCand.byteEnd) mismatches.push('byteEnd');
      if (b1Summary.length !== catCand.length) mismatches.push('length');
      if (
        b1Summary.contentHash &&
        catCand.contentHash &&
        b1Summary.contentHash !== catCand.contentHash
      ) {
        mismatches.push('contentHash');
      }
      if (
        b1Summary.researchScore !== undefined &&
        catCand.researchScore !== undefined &&
        b1Summary.researchScore !== catCand.researchScore
      ) {
        mismatches.push('researchScore');
      }
      if (
        b1Summary.zeroShiftKanoCompatible !== undefined &&
        catCand.zeroShiftKanoCompatible !== undefined &&
        b1Summary.zeroShiftKanoCompatible !== catCand.zeroShiftKanoCompatible
      ) {
        mismatches.push('zeroShiftKanoCompatible');
      }

      // Mandatory intrinsic fields audit - no fabrication allowed
      if (
        catCand.uniqueColorCount === undefined ||
        typeof catCand.uniqueColorCount !== 'number' ||
        catCand.uniqueColorRatio === undefined ||
        typeof catCand.uniqueColorRatio !== 'number' ||
        catCand.textLikeScore === undefined ||
        typeof catCand.textLikeScore !== 'number' ||
        catCand.containsLikelyAsciiData === undefined ||
        typeof catCand.containsLikelyAsciiData !== 'boolean'
      ) {
        mismatches.push('mandatoryCatalogueIntrinsicFields');
      }

      if (mismatches.length > 0) {
        catalogueB1FieldMismatchIds.push({
          candidateId: b1Summary.candidateId,
          mismatchedFields: mismatches,
        });
      }
    }
  }

  // Unexpected upstream candidate IDs
  const unexpectedUpstreamCandidateIds: string[] = [];
  const canonicalUniverseSet = new Set<string>(b1CandidateIds);

  function checkCandidateId(cid: string) {
    if (!canonicalUniverseSet.has(cid) && !unexpectedUpstreamCandidateIds.includes(cid)) {
      unexpectedUpstreamCandidateIds.push(cid);
    }
  }

  if (b2Result) {
    if (b2Result.classifiedPositions) {
      for (const pos of b2Result.classifiedPositions) {
        for (const assoc of pos.associatedCandidates || []) {
          checkCandidateId(assoc.candidateId);
        }
      }
    }
    if (b2Result.trackB?.clusters) {
      for (const cl of b2Result.trackB.clusters) {
        for (const cid of cl.candidateIds || []) {
          checkCandidateId(cid);
        }
      }
    }
  }

  if (b3Result) {
    if (b3Result.repeatedTargetGroupSummaries) {
      for (const g of b3Result.repeatedTargetGroupSummaries) {
        checkCandidateId(g.candidateId);
      }
    }
    if (b3Result.clusterStructuralSummaries) {
      for (const cs of b3Result.clusterStructuralSummaries) {
        for (const cid of cs.candidateIds || []) {
          checkCandidateId(cid);
        }
      }
    }
  }

  if (b4Result) {
    if (b4Result.physicalCyclePopulations) {
      for (const pop of b4Result.physicalCyclePopulations) {
        for (const cid of pop.candidateIds || []) {
          checkCandidateId(cid);
        }
      }
    }
    if (b4Result.crossPopulationCandidateGroups) {
      for (const g of b4Result.crossPopulationCandidateGroups) {
        checkCandidateId(g.candidateId);
      }
    }
  }

  if (b5Result) {
    if (b5Result.physicalPopulationPhaseAnalyses) {
      for (const pop of b5Result.physicalPopulationPhaseAnalyses) {
        for (const cid of pop.candidateIds || []) {
          checkCandidateId(cid);
        }
      }
    }
  }

  // Controls Audit
  const controlCandidateIdCollisions: string[] = [];
  const controlPhysicalOffsetCollisions: number[] = [];

  for (const control of b1Result.controlTargets) {
    if (b1CandidateIds.has(control.name)) {
      controlCandidateIdCollisions.push(control.name);
    }
    for (const b1Summary of b1Result.candidateSummaries) {
      if (
        control.physicalOffset >= b1Summary.byteStart &&
        control.physicalOffset < b1Summary.byteEnd
      ) {
        controlPhysicalOffsetCollisions.push(control.physicalOffset);
      }
    }
  }

  const controlsAudit: PaletteEvidenceFusionControlsAudit = {
    controlTargetsInputCount: b1Result.controlTargets.length,
    controlCandidateIdCollisions,
    controlPhysicalOffsetCollisions,
    controlsExcludedFromProfiles:
      controlCandidateIdCollisions.length === 0 &&
      controlPhysicalOffsetCollisions.length === 0,
    excludedControlNames: b1Result.controlTargets.map((c) => c.name),
  };

  logStageCheckpoint(
    operationId,
    'research',
    'paletteCandidateEvidenceFusion',
    'Stage 2: Reconciliation & Identification Integrity Audit',
    {
      duplicateCatalogueCandidateIdsCount: duplicateCatalogueCandidateIds.length,
      duplicateB1CandidateIdsCount: duplicateB1CandidateIds.length,
      missingCatalogueCount: candidateProfilesMissingCatalogueEvidence.length,
      missingB1Count: candidateProfilesMissingB1Evidence.length,
      fieldMismatchesCount: catalogueB1FieldMismatchIds.length,
      unexpectedUpstreamCount: unexpectedUpstreamCandidateIds.length,
      controlsAudit,
    }
  );

  // Upstream B.2 indexing
  const b2PositionsByCand = new Map<string, PhysicalPositionContextClassification[]>();
  const b2ClustersByCand = new Map<string, PhysicalOccurrenceCluster[]>();
  if (b2Result) {
    for (const pos of b2Result.classifiedPositions || []) {
      for (const assoc of pos.associatedCandidates || []) {
        let list = b2PositionsByCand.get(assoc.candidateId);
        if (!list) {
          list = [];
          b2PositionsByCand.set(assoc.candidateId, list);
        }
        list.push(pos);
      }
    }
    for (const cl of b2Result.trackB?.clusters || []) {
      for (const cid of cl.candidateIds || []) {
        let list = b2ClustersByCand.get(cid);
        if (!list) {
          list = [];
          b2ClustersByCand.set(cid, list);
        }
        list.push(cl);
      }
    }
  }

  // Upstream B.3 indexing
  const b3GroupsByCand = new Map<string, RepeatedTargetGroupSummary[]>();
  const b3ClustersByCand = new Map<string, ClusterStructuralSummary[]>();
  if (b3Result) {
    for (const g of b3Result.repeatedTargetGroupSummaries || []) {
      let list = b3GroupsByCand.get(g.candidateId);
      if (!list) {
        list = [];
        b3GroupsByCand.set(g.candidateId, list);
      }
      list.push(g);
    }
    for (const cs of b3Result.clusterStructuralSummaries || []) {
      for (const cid of cs.candidateIds || []) {
        let list = b3ClustersByCand.get(cid);
        if (!list) {
          list = [];
          b3ClustersByCand.set(cid, list);
        }
        list.push(cs);
      }
    }
  }

  // Upstream B.4 indexing
  const b4PopsByCand = new Map<string, PhysicalCyclePopulation[]>();
  const b4GroupsByCand = new Map<string, CrossPopulationCandidateGroup[]>();
  if (b4Result) {
    for (const pop of b4Result.physicalCyclePopulations || []) {
      for (const cid of pop.candidateIds || []) {
        let list = b4PopsByCand.get(cid);
        if (!list) {
          list = [];
          b4PopsByCand.set(cid, list);
        }
        list.push(pop);
      }
    }
    for (const g of b4Result.crossPopulationCandidateGroups || []) {
      let list = b4GroupsByCand.get(g.candidateId);
      if (!list) {
        list = [];
        b4GroupsByCand.set(g.candidateId, list);
      }
      list.push(g);
    }
  }

  // Upstream B.5 indexing
  const b5PopsByCand = new Map<string, PhysicalPopulationPhaseAnalysis[]>();
  if (b5Result) {
    for (const pop of b5Result.physicalPopulationPhaseAnalyses || []) {
      for (const cid of pop.candidateIds || []) {
        let list = b5PopsByCand.get(cid);
        if (!list) {
          list = [];
          b5PopsByCand.set(cid, list);
        }
        list.push(pop);
      }
    }
  }

  // -------------------------------------------------------------------------
  // STAGE 3: Candidate Evidence Fusion & Matrix Assembly
  // -------------------------------------------------------------------------
  // Build candidate profiles from B.1 summaries
  const candidateProfiles: MK1PaletteCandidateEvidenceProfile[] = [];

  for (const b1Summary of b1Result.candidateSummaries) {
    const candId = b1Summary.candidateId;
    const catCand = catalogueMap.get(candId);

    // Provenance
    const contentHash = b1Summary.contentHash || catCand?.contentHash || '';
    const sameContentResearchCandidateCount = contentHash
      ? contentHashCounts.get(contentHash) || 1
      : 1;
    const duplicateLocationCountWithinResearchUniverse = Math.max(
      0,
      sameContentResearchCandidateCount - 1
    );
    const isContentDuplicate = Boolean(catCand?.duplicateContentOf);

    const provenance = {
      contentHash,
      duplicateContentOf: catCand?.duplicateContentOf,
      duplicateCount: duplicateLocationCountWithinResearchUniverse,
      sameContentResearchCandidateCount,
      duplicateLocationCountWithinResearchUniverse,
      isContentDuplicate,
      tier: catCand?.tier || 'research',
      researchScore: b1Summary.researchScore ?? catCand?.researchScore ?? 0,
      sourceWordsHex: catCand?.colors15
        ? Array.from(catCand.colors15).map(
            (w) => '0x' + w.toString(16).toUpperCase().padStart(4, '0')
          )
        : undefined,
    };

    // Intrinsic
    const length = b1Summary.length;
    const isVeryShortCandidate = length <= 3;
    const zeroShiftKanoCompatible =
      b1Summary.zeroShiftKanoCompatible ??
      (catCand?.zeroShiftKanoCompatible ??
        length >= AUTHORITATIVE_KANO_MAX_SOURCE_INDEX);
    const zeroShiftCoverageMargin = length - AUTHORITATIVE_KANO_MAX_SOURCE_INDEX;

    const intrinsic = {
      byteStart: b1Summary.byteStart,
      byteStartHex: b1Summary.byteStartHex,
      byteEnd: b1Summary.byteEnd,
      byteEndHex: b1Summary.byteEndHex,
      length,
      structureByteLength: 2 + length * 2,
      payloadByteLength: length * 2,
      uniqueColorCount: catCand ? (catCand.uniqueColorCount !== undefined ? catCand.uniqueColorCount : null) : null,
      uniqueColorRatio: catCand ? (catCand.uniqueColorRatio !== undefined ? catCand.uniqueColorRatio : null) : null,
      textLikeScore: catCand ? (catCand.textLikeScore !== undefined ? catCand.textLikeScore : null) : null,
      containsLikelyAsciiData: catCand ? (catCand.containsLikelyAsciiData !== undefined ? catCand.containsLikelyAsciiData : null) : null,
      isVeryShortCandidate,
      zeroShiftKanoCompatible,
      zeroShiftCoverageMargin,
    };

    // Topology
    const targetObj = b1Summary.objectNumber
      ? report.objects.find((o) => o.objectNumber === b1Summary.objectNumber)
      : null;
    const regionObj = report.topology.regions.find(
      (r) => r.regionId === b1Summary.targetRegionId
    );
    const targetObjectReadable = targetObj ? targetObj.flags.readable : false;
    const targetObjectWritable = targetObj ? targetObj.flags.writable : false;
    const targetObjectExecutable = targetObj ? targetObj.flags.executable : false;
    const targetPhysicallyInFile = b1Summary.byteEnd <= exeSize;
    const targetInLEObjectFileBackedData = regionObj?.regionClass === 'le-object-file-backed';
    const targetInPhysicalPagePadding = regionObj?.regionClass === 'physical-page-padding';
    const targetInPostModuleTail = regionObj?.regionClass === 'post-module-tail';
    const targetFileBacked = targetInLEObjectFileBackedData && targetPhysicallyInFile;

    const topology = {
      targetRegionId: b1Summary.targetRegionId,
      targetRegionClass: regionObj?.regionClass ?? b1Summary.targetRegionClass,
      targetObjectNumber: b1Summary.objectNumber,
      targetObjectFlags: targetObj ? targetObj.capabilities : null,
      targetObjectReadable,
      targetObjectWritable,
      targetObjectExecutable,
      targetPhysicallyInFile,
      targetFileBacked,
      targetInLEObjectFileBackedData,
      targetInPhysicalPagePadding,
      targetInPostModuleTail,
      targetLoadedAddress:
        b1Summary.representations['linear-structure-address']?.value ?? null,
      targetLoadedAddressHex:
        b1Summary.representations['linear-structure-address']?.valueHex ?? null,
      targetLoadedPayloadAddress:
        b1Summary.representations['linear-payload-address']?.value ?? null,
      targetLoadedPayloadAddressHex:
        b1Summary.representations['linear-payload-address']?.valueHex ?? null,
      targetInExecutableObject: targetObjectExecutable,
      targetInWritableObject: targetObjectWritable,
    };

    // Exact Reference
    const extOccurrences = b1Summary.externalOccurrenceCount;
    const physicalDerivedReferenceCount =
      (b1Summary.externalByRepresentation['physical-structure-start'] || 0) +
      (b1Summary.externalByRepresentation['physical-payload-start'] || 0);
    const objectRelativeDerivedReferenceCount =
      (b1Summary.externalByRepresentation['object-relative-structure'] || 0) +
      (b1Summary.externalByRepresentation['object-relative-payload'] || 0);
    const linearAddressDerivedReferenceCount =
      (b1Summary.externalByRepresentation['linear-structure-address'] || 0) +
      (b1Summary.externalByRepresentation['linear-payload-address'] || 0);
    const addressDerivedReferenceCount =
      objectRelativeDerivedReferenceCount + linearAddressDerivedReferenceCount;

    let referenceProfile: CandidateReferenceProfile;
    if (extOccurrences === 0) {
      referenceProfile = 'no-external-reference';
    } else if (physicalDerivedReferenceCount > 0 && addressDerivedReferenceCount === 0) {
      referenceProfile = 'physical-derived-only';
    } else if (addressDerivedReferenceCount > 0 && physicalDerivedReferenceCount === 0) {
      referenceProfile = 'address-derived-only';
    } else {
      referenceProfile = 'mixed-physical-and-address-derived';
    }

    const addressDerivedReferenceFraction =
      extOccurrences > 0 ? addressDerivedReferenceCount / extOccurrences : null;
    const physicalDerivedReferenceFraction =
      extOccurrences > 0 ? physicalDerivedReferenceCount / extOccurrences : null;

    const exactReference = {
      totalLogicalMatches: b1Summary.totalLogicalMatches,
      totalUniquePhysicalOccurrences: b1Summary.totalUniquePhysicalOccurrences,
      selfOccurrenceCount: b1Summary.selfOccurrenceCount,
      externalOccurrenceCount: extOccurrences,
      externalByRepresentation: { ...b1Summary.externalByRepresentation },
      externalBySourceRegion: { ...b1Summary.externalBySourceRegion },
      firstOccurrenceOffset: b1Summary.firstOccurrenceOffsetHex
        ? parseInt(b1Summary.firstOccurrenceOffsetHex, 16)
        : null,
      firstOccurrenceOffsetHex: b1Summary.firstOccurrenceOffsetHex,
      lastOccurrenceOffset: b1Summary.lastOccurrenceOffsetHex
        ? parseInt(b1Summary.lastOccurrenceOffsetHex, 16)
        : null,
      lastOccurrenceOffsetHex: b1Summary.lastOccurrenceOffsetHex,
      detailsTruncated: b1Summary.detailsTruncated,
      physicalDerivedReferenceCount,
      objectRelativeDerivedReferenceCount,
      linearAddressDerivedReferenceCount,
      addressDerivedReferenceCount,
      referenceProfile,
      addressDerivedReferenceFraction,
      physicalDerivedReferenceFraction,
    };

    // B.2 Context
    let b2Context: MK1PaletteCandidateEvidenceProfile['b2Context'] = null;
    if (b2Result) {
      const positions = b2PositionsByCand.get(candId) || [];
      const clusters = b2ClustersByCand.get(candId) || [];
      const sourceRegionDistribution: Record<string, number> = {};
      for (const p of positions) {
        sourceRegionDistribution[p.sourceRegionId] =
          (sourceRegionDistribution[p.sourceRegionId] || 0) + 1;
      }
      b2Context = {
        participationCount: positions.length,
        clusterParticipationCount: clusters.length,
        clusterIds: clusters.map((c) => c.clusterId),
        sourceRegionDistribution,
        whitelistedObject1OperandShapeCount: positions.filter(
          (p) => p.trackA_x86Shape?.isWhitelistedShape
        ).length,
        negativeContextCount: positions.filter(
          (p) => p.trackA_x86Shape?.isNegativeContext
        ).length,
        unmatchedShapeCount: positions.filter(
          (p) => p.trackA_x86Shape?.shapeClass === 'unmatched-shape'
        ).length,
      };
    }

    // B.3 Structure
    let b3Structure: MK1PaletteCandidateEvidenceProfile['b3Structure'] = null;
    if (b3Result) {
      const groups = b3GroupsByCand.get(candId) || [];
      const clusters = b3ClustersByCand.get(candId) || [];
      const motifClusters = clusters.filter((c) => c.primaryDeltaMotif !== null);
      b3Structure = {
        repeatedTargetGroupParticipationCount: groups.length,
        repeatedTargetGroupIds: groups.map((g) => g.groupId),
        clusterParticipationCount: clusters.length,
        clusterIds: clusters.map((c) => c.clusterId),
        motifClusterParticipationCount: motifClusters.length,
        motifClusterIds: motifClusters.map((c) => c.clusterId),
        hasRepeatableCycleBlock: clusters.some((c) =>
          c.structuralEvidenceFlags.includes('has-repeatable-cycle-block')
        ),
        hasHighContextOnlyCycleConsensus: clusters.some((c) =>
          c.structuralEvidenceFlags.includes('has-high-context-only-cycle-consensus')
        ),
      };
    }

    // B.4 Cycle
    let b4Cycle: MK1PaletteCandidateEvidenceProfile['b4Cycle'] = null;
    if (b4Result) {
      const pops = b4PopsByCand.get(candId) || [];
      const groups = b4GroupsByCand.get(candId) || [];
      b4Cycle = {
        physicalPopulationParticipationCount: pops.length,
        physicalPopulationIds: pops.map((p) => p.populationId),
        cycleSpans: Array.from(new Set(pops.map((p) => p.cycleSpan))).sort((a, b) => a - b),
        cycleBlockCounts: Array.from(new Set(pops.map((p) => p.cycleBlockCount))).sort(
          (a, b) => a - b
        ),
        testedPeriodCounts: pops.map((p) => p.testedPeriods.length),
        notablePeriodCounts: pops.map(
          (p) => p.testedPeriods.filter((per) => per.hasNotableContextPeriodicity).length
        ),
        sourceRegions: Array.from(new Set(pops.map((p) => p.sourceRegionId))),
        crossPopulationGroupParticipationCount: groups.length,
        crossPopulationGroupIds: groups.map((g) => g.groupId),
      };
    }

    // B.5 Harmonic
    let b5Harmonic: MK1PaletteCandidateEvidenceProfile['b5Harmonic'] = null;
    if (b5Result) {
      const pops = b5PopsByCand.get(candId) || [];
      const relationships = pops.flatMap((p) => p.harmonicRelationships || []);
      const confirmedRecurrenceRelationshipsCount = relationships.filter(
        (r) => r.roleRecurrenceStatus === 'confirmed-recurrence'
      ).length;
      const reducedRecurrenceRelationshipsCount = relationships.filter(
        (r) => r.roleRecurrenceStatus === 'reduced-recurrence'
      ).length;
      const insufficientRelationshipsCount = relationships.filter(
        (r) => r.roleRecurrenceStatus === 'insufficient-cross-higher-evidence'
      ).length;
      const crossHigherPercentages = relationships
        .map((r) => r.crossHigherRoleDominantAgreementPercentage)
        .filter((v): v is number => v !== null);
      const maxCanonicalCrossHigherRecurrence =
        crossHigherPercentages.length > 0 ? Math.max(...crossHigherPercentages) : null;
      const stableComparableLanesCount = relationships.reduce(
        (sum, r) => sum + r.crossHigherRoleStableLaneCount,
        0
      );
      const comparableLanesCount = relationships.reduce(
        (sum, r) => sum + r.crossHigherRoleComparableLaneCount,
        0
      );
      const evidenceBearingMotifParticipation = pops.some((p) =>
        (p.periodPhaseAnalyses || []).some(
          (per) => per.evidenceBearingExactRepeatingPhaseSignatureMotif !== null
        )
      );

      b5Harmonic = {
        populationParticipationCount: pops.length,
        populationIds: pops.map((p) => p.populationId),
        harmonicRelationshipsCount: relationships.length,
        confirmedRecurrenceRelationshipsCount,
        reducedRecurrenceRelationshipsCount,
        insufficientRelationshipsCount,
        maxCanonicalCrossHigherRecurrence,
        stableComparableLanesCount,
        comparableLanesCount,
        evidenceBearingMotifParticipation,
      };
    }

    // Structure Depth
    let structureDepth: StructureDepthLevel = 'none';
    if (b5Harmonic && b5Harmonic.populationParticipationCount > 0) {
      structureDepth = 'b5-harmonic-structure';
    } else if (
      b4Cycle &&
      (b4Cycle.physicalPopulationParticipationCount > 0 ||
        b4Cycle.crossPopulationGroupParticipationCount > 0)
    ) {
      structureDepth = 'b4-cycle-layout';
    } else if (
      b3Structure &&
      (b3Structure.repeatedTargetGroupParticipationCount > 0 ||
        b3Structure.clusterParticipationCount > 0)
    ) {
      structureDepth = 'b3-repeated-structure';
    } else if (
      b2Context &&
      (b2Context.participationCount > 0 || b2Context.clusterParticipationCount > 0)
    ) {
      structureDepth = 'b2-context';
    } else if (extOccurrences > 0) {
      structureDepth = 'b1-external-reference';
    }

    // Mechanical Flags
    const hasExternalReferences = extOccurrences > 0;
    const hasAddressDerivedReferences = addressDerivedReferenceCount > 0;
    const hasPhysicalDerivedReferences = physicalDerivedReferenceCount > 0;
    const hasStructuredReferenceEvidence = [
      'b2-context',
      'b3-repeated-structure',
      'b4-cycle-layout',
      'b5-harmonic-structure',
    ].includes(structureDepth);
    const hasB5HarmonicEvidence =
      b5Harmonic !== null && b5Harmonic.populationParticipationCount > 0;

    const mechanicalFlags = {
      hasExternalReferences,
      hasAddressDerivedReferences,
      hasPhysicalDerivedReferences,
      hasStructuredReferenceEvidence,
      hasB5HarmonicEvidence,
      isVeryShortCandidate,
      zeroShiftKanoCompatible,
      targetInExecutableObject: topology.targetInExecutableObject,
      targetInWritableObject: topology.targetInWritableObject,
    };

    // Tension Flags
    const weakForCurrentKanoPaletteHypothesis =
      !zeroShiftKanoCompatible || isVeryShortCandidate;
    const strongForCurrentKanoPaletteHypothesis =
      zeroShiftKanoCompatible && provenance.researchScore >= 50;
    const referenceActiveIntrinsicWeak =
      hasExternalReferences && weakForCurrentKanoPaletteHypothesis;
    const referenceActiveKanoCompatible =
      hasExternalReferences && zeroShiftKanoCompatible;
    const referenceInactiveKanoCompatible =
      !hasExternalReferences && zeroShiftKanoCompatible;
    const shortCandidateAddressActive =
      isVeryShortCandidate && hasAddressDerivedReferences;
    const executableTargetAddressActive =
      topology.targetInExecutableObject && hasAddressDerivedReferences;
    const writableTargetKanoCompatible =
      topology.targetInWritableObject && zeroShiftKanoCompatible;
    const strongCatalogueNoReference =
      strongForCurrentKanoPaletteHypothesis && !hasExternalReferences;

    const tensionFlags = {
      referenceActiveIntrinsicWeak,
      referenceActiveKanoCompatible,
      referenceInactiveKanoCompatible,
      shortCandidateAddressActive,
      executableTargetAddressActive,
      writableTargetKanoCompatible,
      strongCatalogueNoReference,
      weakForCurrentKanoPaletteHypothesis,
      strongForCurrentKanoPaletteHypothesis,
    };

    candidateProfiles.push({
      candidateId: candId,
      provenance,
      intrinsic,
      topology,
      exactReference,
      b2Context,
      b3Structure,
      b4Cycle,
      b5Harmonic,
      structureDepth,
      mechanicalFlags,
      tensionFlags,
    });
  }

  // Reconciliation
  const researchCandidatesInput = catalogueResearchCandidatesCount ?? b1Result.candidateSummaries.length;
  const b1CandidateSummariesInput = b1Result.candidateSummaries.length;
  const candidateProfilesProduced = candidateProfiles.length;
  const allCandidatesAccountedFor =
    catalogueAvailable &&
    candidateProfilesProduced === b1CandidateSummariesInput &&
    candidateProfilesProduced === researchCandidatesInput &&
    duplicateCandidateIds.length === 0 &&
    candidateProfilesMissingCatalogueEvidence.length === 0 &&
    candidateProfilesMissingB1Evidence.length === 0 &&
    catalogueB1FieldMismatchIds.length === 0 &&
    unexpectedUpstreamCandidateIds.length === 0;

  const reconciliation: MK1PaletteEvidenceFusionReconciliation = {
    researchCandidatesInput,
    b1CandidateSummariesInput,
    candidateProfilesProduced,
    candidateProfilesMissingCatalogueEvidence,
    candidateProfilesMissingB1Evidence,
    duplicateCatalogueCandidateIds,
    duplicateB1CandidateIds,
    duplicateCandidateIds,
    catalogueB1FieldMismatchIds,
    unexpectedUpstreamCandidateIds,
    allCandidatesAccountedFor,
  };

  // Global Cohort Summary (Section 38)
  const globalCohortSummary: PaletteEvidenceFusionGlobalCohortSummary = {
    kanoCompatible_noExternalReference: 0,
    kanoCompatible_externalReference: 0,
    notKanoCompatible_noExternalReference: 0,
    notKanoCompatible_externalReference: 0,
    veryShort_externalReference: 0,
    veryShort_addressDerivedReference: 0,
    object1Target_externalReference: 0,
    object2Target_externalReference: 0,
    object1Target_kanoCompatible: 0,
    object2Target_kanoCompatible: 0,
    b5Participation_kanoCompatible: b5Available ? 0 : null,
    b5Participation_notKanoCompatible: b5Available ? 0 : null,
  };

  for (const p of candidateProfiles) {
    const kano = p.intrinsic.zeroShiftKanoCompatible;
    const ext = p.mechanicalFlags.hasExternalReferences;
    const vshort = p.mechanicalFlags.isVeryShortCandidate;
    const addr = p.mechanicalFlags.hasAddressDerivedReferences;
    const isObj1 = p.topology.targetObjectNumber === 1;
    const isObj2 = p.topology.targetObjectNumber === 2;
    const b5 = p.mechanicalFlags.hasB5HarmonicEvidence;

    if (kano && !ext) globalCohortSummary.kanoCompatible_noExternalReference++;
    if (kano && ext) globalCohortSummary.kanoCompatible_externalReference++;
    if (!kano && !ext) globalCohortSummary.notKanoCompatible_noExternalReference++;
    if (!kano && ext) globalCohortSummary.notKanoCompatible_externalReference++;

    if (vshort && ext) globalCohortSummary.veryShort_externalReference++;
    if (vshort && addr) globalCohortSummary.veryShort_addressDerivedReference++;

    if (isObj1 && ext) globalCohortSummary.object1Target_externalReference++;
    if (isObj2 && ext) globalCohortSummary.object2Target_externalReference++;

    if (isObj1 && kano) globalCohortSummary.object1Target_kanoCompatible++;
    if (isObj2 && kano) globalCohortSummary.object2Target_kanoCompatible++;

    if (b5Available && b5 && kano) {
      globalCohortSummary.b5Participation_kanoCompatible =
        (globalCohortSummary.b5Participation_kanoCompatible ?? 0) + 1;
    }
    if (b5Available && b5 && !kano) {
      globalCohortSummary.b5Participation_notKanoCompatible =
        (globalCohortSummary.b5Participation_notKanoCompatible ?? 0) + 1;
    }
  }

  // Length Histograms (Section 39)
  const lengthHistograms: PaletteEvidenceFusionLengthHistograms = {
    allCandidates: createEmptyLengthHistogram(),
    referenceActiveCandidates: createEmptyLengthHistogram(),
    noReferenceCandidates: createEmptyLengthHistogram(),
    addressDerivedActiveCandidates: createEmptyLengthHistogram(),
    kanoCompatibleCandidates: createEmptyLengthHistogram(),
  };

  for (const p of candidateProfiles) {
    const len = p.intrinsic.length;
    addLengthToHistogram(lengthHistograms.allCandidates, len);
    if (p.mechanicalFlags.hasExternalReferences) {
      addLengthToHistogram(lengthHistograms.referenceActiveCandidates, len);
    } else {
      addLengthToHistogram(lengthHistograms.noReferenceCandidates, len);
    }
    if (p.mechanicalFlags.hasAddressDerivedReferences) {
      addLengthToHistogram(lengthHistograms.addressDerivedActiveCandidates, len);
    }
    if (p.intrinsic.zeroShiftKanoCompatible) {
      addLengthToHistogram(lengthHistograms.kanoCompatibleCandidates, len);
    }
  }

  // Target Region x Palette Evidence Matrix (Section 40)
  const regionMap = new Map<string, TargetRegionPaletteEvidenceMatrixRow>();
  for (const p of candidateProfiles) {
    const rid = p.topology.targetRegionId;
    let row = regionMap.get(rid);
    if (!row) {
      row = {
        regionId: rid,
        regionClass: p.topology.targetRegionClass,
        candidateCount: 0,
        kanoCompatibleCount: 0,
        externalReferenceActiveCount: 0,
        addressDerivedActiveCount: 0,
        b5ParticipationCount: b5Available ? 0 : null,
        veryShortCount: 0,
      };
      regionMap.set(rid, row);
    }
    row.candidateCount++;
    if (p.intrinsic.zeroShiftKanoCompatible) row.kanoCompatibleCount++;
    if (p.mechanicalFlags.hasExternalReferences) row.externalReferenceActiveCount++;
    if (p.mechanicalFlags.hasAddressDerivedReferences) row.addressDerivedActiveCount++;
    if (b5Available && p.mechanicalFlags.hasB5HarmonicEvidence) {
      row.b5ParticipationCount = (row.b5ParticipationCount ?? 0) + 1;
    }
    if (p.mechanicalFlags.isVeryShortCandidate) row.veryShortCount++;
  }
  const targetRegionMatrix = Array.from(regionMap.values()).sort(
    (a, b) => b.candidateCount - a.candidateCount
  );

  // Representation Kind x Candidate Property Matrix (Section 41)
  const repKinds: PaletteRepresentationKind[] = [
    'physical-structure-start',
    'physical-payload-start',
    'object-relative-structure',
    'object-relative-payload',
    'linear-structure-address',
    'linear-payload-address',
  ];
  const representationMatrix: RepresentationCandidatePropertyMatrixRow[] = repKinds.map(
    (kind) => {
      let candidateTargetsHit = 0;
      let logicalMatches = 0;
      let kanoCompatibleTargetCount = 0;
      let veryShortTargetCount = 0;
      let object1TargetCount = 0;
      let object2TargetCount = 0;

      for (const p of candidateProfiles) {
        const count = p.exactReference.externalByRepresentation[kind] || 0;
        if (count > 0) {
          candidateTargetsHit++;
          logicalMatches += count;
          if (p.intrinsic.zeroShiftKanoCompatible) kanoCompatibleTargetCount++;
          if (p.mechanicalFlags.isVeryShortCandidate) veryShortTargetCount++;
          if (p.topology.targetObjectNumber === 1) object1TargetCount++;
          if (p.topology.targetObjectNumber === 2) object2TargetCount++;
        }
      }

      // Unique physical occurrences from B.1 summary if available
      const b1RepSummary = b1Result.representationSummaries.find(
        (rs) => rs.representationKind === kind
      );
      const uniquePhysicalOccurrences =
        b1RepSummary?.uniquePhysicalOccurrenceCount ?? candidateTargetsHit;

      return {
        representationKind: kind,
        candidateTargetsHit,
        logicalMatches,
        uniquePhysicalOccurrences,
        kanoCompatibleTargetCount,
        veryShortTargetCount,
        object1TargetCount,
        object2TargetCount,
      };
    }
  );

  // Structure Participation Matrix (Section 42)
  const depthLevels: Array<{ level: StructureDepthLevel; displayName: string }> = [
    { level: 'none', displayName: 'None (Zero External References)' },
    { level: 'b1-external-reference', displayName: 'B.1 Exact Reference' },
    { level: 'b2-context', displayName: 'B.2 Operand / Spatial Cluster' },
    { level: 'b3-repeated-structure', displayName: 'B.3 Repeated Structural Motif' },
    { level: 'b4-cycle-layout', displayName: 'B.4 Physical Cycle Population' },
    { level: 'b5-harmonic-structure', displayName: 'B.5 Harmonic Divisor Structure' },
  ];

  const depthRank: Record<StructureDepthLevel, number> = {
    none: 0,
    'b1-external-reference': 1,
    'b2-context': 2,
    'b3-repeated-structure': 3,
    'b4-cycle-layout': 4,
    'b5-harmonic-structure': 5,
  };

  const structureParticipationMatrix: StructureParticipationMatrixRow[] = depthLevels.map(
    ({ level, displayName }) => {
      const minRank = depthRank[level];
      let exactCount = 0;
      let cumulativeCount = 0;
      let kanoCompatibleCount = 0;
      let notKanoCompatibleCount = 0;
      let veryShortCount = 0;
      let notVeryShortCount = 0;
      let object1Count = 0;
      let object2Count = 0;

      for (const p of candidateProfiles) {
        const pRank = depthRank[p.structureDepth];
        if (p.structureDepth === level) {
          exactCount++;
        }
        if (pRank >= minRank) {
          cumulativeCount++;
          if (p.intrinsic.zeroShiftKanoCompatible) kanoCompatibleCount++;
          else notKanoCompatibleCount++;
          if (p.mechanicalFlags.isVeryShortCandidate) veryShortCount++;
          else notVeryShortCount++;
          if (p.topology.targetObjectNumber === 1) object1Count++;
          if (p.topology.targetObjectNumber === 2) object2Count++;
        }
      }

      return {
        depthLevel: level,
        displayName,
        exactCandidatesCount: exactCount,
        cumulativeCandidatesCount: cumulativeCount,
        kanoCompatibleCount,
        notKanoCompatibleCount,
        veryShortCount,
        notVeryShortCount,
        object1Count,
        object2Count,
      };
    }
  );

  // -------------------------------------------------------------------------
  // STAGE 4: Controls Exclusion & Cohort Partitioning
  // -------------------------------------------------------------------------
  logStageCheckpoint(
    operationId,
    'research',
    'paletteCandidateEvidenceFusion',
    'Stage 4: Controls Exclusion & Cohort Partitioning',
    { globalCohortSummary, controlsAudit }
  );

  // -------------------------------------------------------------------------
  // STAGE 5: Final Result Serialization & Export Preparation
  // -------------------------------------------------------------------------
  const hasReconciliationErrors =
    !catalogueAvailable ||
    !b1Available ||
    duplicateCatalogueCandidateIds.length > 0 ||
    duplicateB1CandidateIds.length > 0 ||
    candidateProfilesMissingCatalogueEvidence.length > 0 ||
    candidateProfilesMissingB1Evidence.length > 0 ||
    catalogueB1FieldMismatchIds.length > 0 ||
    unexpectedUpstreamCandidateIds.length > 0 ||
    !controlsAudit.controlsExcludedFromProfiles;

  let status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  let failureReason: string | undefined;

  if (hasReconciliationErrors) {
    status = 'FAILED';
    if (!catalogueAvailable) {
      failureReason =
        'Catalogue evidence is mandatory for palette candidate evidence fusion. Shared palette catalogue was not provided.';
    } else if (!b1Available) {
      failureReason =
        'B.1 Reference Reconnaissance evidence is mandatory for palette candidate evidence fusion.';
    } else {
      const errorDetails: string[] = [];
      if (duplicateCatalogueCandidateIds.length > 0) {
        errorDetails.push(`${duplicateCatalogueCandidateIds.length} duplicate catalogue IDs`);
      }
      if (duplicateB1CandidateIds.length > 0) {
        errorDetails.push(`${duplicateB1CandidateIds.length} duplicate B.1 IDs`);
      }
      if (candidateProfilesMissingCatalogueEvidence.length > 0) {
        errorDetails.push(
          `${candidateProfilesMissingCatalogueEvidence.length} candidate profiles missing catalogue evidence`
        );
      }
      if (candidateProfilesMissingB1Evidence.length > 0) {
        errorDetails.push(
          `${candidateProfilesMissingB1Evidence.length} catalogue candidates missing B.1 evidence`
        );
      }
      if (catalogueB1FieldMismatchIds.length > 0) {
        errorDetails.push(
          `${catalogueB1FieldMismatchIds.length} field mismatches between catalogue and B.1`
        );
      }
      if (unexpectedUpstreamCandidateIds.length > 0) {
        errorDetails.push(
          `${unexpectedUpstreamCandidateIds.length} unexpected upstream candidate IDs`
        );
      }
      if (!controlsAudit.controlsExcludedFromProfiles) {
        errorDetails.push('Controls collision detected in candidate profiles');
      }
      failureReason = `Reconciliation integrity audit failed: ${errorDetails.join(', ')}.`;
    }
  } else if (!b2Available || !b3Available || !b4Available || !b5Available) {
    status = 'PARTIAL';
  } else {
    status = 'SUCCESS';
  }

  logStageCheckpoint(
    operationId,
    'research',
    'paletteCandidateEvidenceFusion',
    'Stage 5: Final Result Serialization & Export Preparation',
    { status, failureReason }
  );

  return {
    status,
    failureReason,
    metadata: {
      operationId,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      milestone: '1E.2B.6b',
    },
    fixture: {
      exePath,
      exeSize,
    },
    upstreamAvailability,
    predicateDefinitions: CANONICAL_PREDICATE_DEFINITIONS,
    reconciliation,
    globalCohortSummary,
    lengthHistograms,
    targetRegionMatrix,
    representationMatrix,
    structureParticipationMatrix,
    candidateProfiles,
    controlsAudit,
    interpretationCaveats: CANONICAL_INTERPRETATION_CAVEATS,
  };
}

/**
 * Creates compact export schema: mk1_palette_candidate_evidence_fusion_v1 (Section 48).
 */
export function createMK1CompactCandidateEvidenceFusionExport(
  result: MK1PaletteCandidateEvidenceFusionResult
): MK1CompactPaletteCandidateEvidenceFusionExport {
  const compactProfiles: MK1CompactCandidateEvidenceProfileExport[] =
    result.candidateProfiles.map((p) => ({
      candidateId: p.candidateId,
      byteStartHex: p.intrinsic.byteStartHex,
      byteEndHex: p.intrinsic.byteEndHex,
      length: p.intrinsic.length,
      payloadByteLength: p.intrinsic.payloadByteLength,
      structureByteLength: p.intrinsic.structureByteLength,
      researchScore: p.provenance.researchScore,
      tier: p.provenance.tier,
      contentHash: p.provenance.contentHash,
      uniqueColorCount: p.intrinsic.uniqueColorCount,
      uniqueColorRatio: p.intrinsic.uniqueColorRatio,
      textLikeScore: p.intrinsic.textLikeScore,
      containsLikelyAsciiData: p.intrinsic.containsLikelyAsciiData,
      zeroShiftKanoCompatible: p.intrinsic.zeroShiftKanoCompatible,
      zeroShiftCoverageMargin: p.intrinsic.zeroShiftCoverageMargin,
      duplicateContentOf: p.provenance.duplicateContentOf,
      sameContentResearchCandidateCount: p.provenance.sameContentResearchCandidateCount,
      isContentDuplicate: p.provenance.isContentDuplicate,
      targetRegionId: p.topology.targetRegionId,
      targetRegionClass: p.topology.targetRegionClass,
      targetObjectNumber: p.topology.targetObjectNumber,
      targetObjectFlags: p.topology.targetObjectFlags,
      targetObjectReadable: p.topology.targetObjectReadable,
      targetObjectWritable: p.topology.targetObjectWritable,
      targetObjectExecutable: p.topology.targetObjectExecutable,
      targetInExecutableObject: p.topology.targetInExecutableObject,
      targetInWritableObject: p.topology.targetInWritableObject,
      targetFileBacked: p.topology.targetFileBacked,
      targetInLEObjectFileBackedData: p.topology.targetInLEObjectFileBackedData,
      targetInPhysicalPagePadding: p.topology.targetInPhysicalPagePadding,
      targetInPostModuleTail: p.topology.targetInPostModuleTail,
      targetLoadedAddressHex: p.topology.targetLoadedAddressHex,
      targetLoadedPayloadAddressHex: p.topology.targetLoadedPayloadAddressHex,
      isVeryShortCandidate: p.intrinsic.isVeryShortCandidate,
      externalOccurrenceCount: p.exactReference.externalOccurrenceCount,
      externalByRepresentation: { ...p.exactReference.externalByRepresentation },
      externalBySourceRegion: { ...p.exactReference.externalBySourceRegion },
      physicalDerivedReferenceCount: p.exactReference.physicalDerivedReferenceCount,
      objectRelativeDerivedReferenceCount: p.exactReference.objectRelativeDerivedReferenceCount,
      linearAddressDerivedReferenceCount: p.exactReference.linearAddressDerivedReferenceCount,
      addressDerivedReferenceCount: p.exactReference.addressDerivedReferenceCount,
      referenceProfile: p.exactReference.referenceProfile,
      addressDerivedReferenceFraction: p.exactReference.addressDerivedReferenceFraction,
      physicalDerivedReferenceFraction: p.exactReference.physicalDerivedReferenceFraction,
      b2ParticipationCount: p.b2Context?.participationCount ?? null,
      b2ClusterParticipationCount: p.b2Context?.clusterParticipationCount ?? null,
      b3RepeatedGroupCount: p.b3Structure?.repeatedTargetGroupParticipationCount ?? null,
      b3ClusterCount: p.b3Structure?.clusterParticipationCount ?? null,
      b4PopulationCount: p.b4Cycle?.physicalPopulationParticipationCount ?? null,
      b4TestedPeriodCount: p.b4Cycle?.testedPeriodCounts
        ? p.b4Cycle.testedPeriodCounts.reduce((a, b) => a + b, 0)
        : null,
      b4NotablePeriodCount: p.b4Cycle?.notablePeriodCounts
        ? p.b4Cycle.notablePeriodCounts.reduce((a, b) => a + b, 0)
        : null,
      b5PopulationCount: p.b5Harmonic?.populationParticipationCount ?? null,
      b5ConfirmedRecurrenceCount:
        p.b5Harmonic?.confirmedRecurrenceRelationshipsCount ?? null,
      maxCanonicalCrossHigherRecurrence:
        p.b5Harmonic?.maxCanonicalCrossHigherRecurrence ?? null,
      structureDepth: p.structureDepth,
      mechanicalFlags: { ...p.mechanicalFlags },
      tensionFlags: { ...p.tensionFlags },
    }));

  return {
    format: 'mk1_palette_candidate_evidence_fusion_v1',
    status: result.status,
    failureReason: result.failureReason,
    metadata: {
      exportTimestamp: new Date().toISOString(),
      application: 'MK DOS Archive',
      version: '0.1.0-dev',
      milestone: '1E.2B.6b',
      operationId: result.metadata.operationId,
    },
    fixture: {
      exePath: result.fixture.exePath,
      exeSize: result.fixture.exeSize,
      exeSizeHex: '0x' + result.fixture.exeSize.toString(16).toUpperCase(),
    },
    upstreamAvailability: result.upstreamAvailability,
    predicateDefinitions: result.predicateDefinitions,
    reconciliation: result.reconciliation,
    globalCohortSummary: result.globalCohortSummary,
    lengthHistograms: result.lengthHistograms,
    targetRegionMatrix: result.targetRegionMatrix,
    representationMatrix: result.representationMatrix,
    structureParticipationMatrix: result.structureParticipationMatrix,
    controlsAudit: result.controlsAudit,
    interpretationCaveats: result.interpretationCaveats,
    candidateProfiles: compactProfiles,
  };
}
