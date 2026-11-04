import {
  MK1ExecutableLayoutReport,
} from './executableLayoutTypes';
import {
  MK1ExecutableRegionClass,
} from './executableRegionTopology';
import {
  classifyPhysicalByteInObjects,
  fileOffsetToLoadedAddress,
} from '../../../core/executable/le/leAddressMap';
import {
  MK1PaletteReferenceReconResult,
  PaletteRepresentationKind,
} from './paletteReferenceReconnaissanceTypes';
import {
  classifyX86OperandShape,
} from './paletteOccurrenceContext';
import {
  X86OperandShapeClass,
  X86ShapeMatchDetails,
  X86ShapeStatus,
  MK1PaletteOccurrenceContextResult,
} from './paletteOccurrenceContextTypes';
import { MK1PaletteRepeatedStructureResult } from './paletteRepeatedStructureTypes';
import { MK1PaletteCycleLayoutResult } from './paletteCycleLayoutTypes';
import { MK1PalettePhaseHarmonicResult } from './palettePhaseHarmonicTypes';
import {
  CandidateReferenceProfile,
  MK1PaletteCandidateEvidenceFusionResult,
  StructureDepthLevel,
} from './paletteCandidateEvidenceFusionTypes';
import {
  FirstHopCandidateTargetEvidence,
  MK1CandidateChainSummary,
  MK1CohortDirectVsIndirectEntry,
  MK1ControlChainSummary,
  MK1FirstHopSiteSummary,
  MK1FirstHopX86Role,
  MK1PaletteFirstHopReferenceSite,
  MK1PaletteReferenceChainExport,
  MK1PaletteReferenceChainReconResult,
  MK1ReferenceChainGlobalSummary,
  MK1ReferenceChainReconciliation,
  MK1ReferenceChainScanConfiguration,
  MK1ReferenceChainUpstreamSummary,
  MK1ReferrerConvergenceGroup,
  MK1RegionReferrerMatrixCell,
  MK1RepresentationKindSummary,
  MK1SecondOrderOccurrence,
  MK1SecondOrderPhysicalReferrer,
  MK1SecondOrderX86Role,
  MK1SecondOrderX86ShapeSummary,
  MK1TwoHopChainClass,
  MK1TwoHopChainPath,
  ReferrerBoundedContext,
  SiteRepresentationDescriptor,
  SiteRepresentationKind,
} from './paletteReferenceChainReconnaissanceTypes';

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

function bytesToHex(buf: Uint8Array, start: number, len: number): string {
  const parts: string[] = [];
  const end = Math.min(buf.length, start + len);
  for (let i = start; i < end; i++) {
    parts.push(buf[i].toString(16).padStart(2, '0').toUpperCase());
  }
  return parts.join(' ');
}

/**
 * Derives valid site representations for a first-hop reference site.
 * - Mapped addressable object byte: physical-site-offset, object-relative-site-offset, linear-site-address
 * - Tail or padding (unmapped/no object offset/no loaded address): physical-site-offset only
 */
export function deriveSiteRepresentationsForSite(site: {
  siteId: string;
  sourceFileOffset: number;
  sourceObjectOffset: number | null;
  sourceLoadedAddress: number | null;
  sourceObjectNumber: number | null;
  sourceRegionId: string;
}): SiteRepresentationDescriptor[] {
  const descriptors: SiteRepresentationDescriptor[] = [];
  const physVal = site.sourceFileOffset >>> 0;
  descriptors.push({
    descriptorId: `${site.siteId}_phys`,
    targetSiteId: site.siteId,
    sourceFileOffset: site.sourceFileOffset,
    sourceFileOffsetHex: toHex32(site.sourceFileOffset),
    representationKind: 'physical-site-offset',
    value: physVal,
    valueHex: toHex32(physVal),
    targetSiteObjectNumber: site.sourceObjectNumber,
    targetSiteRegionId: site.sourceRegionId,
  });

  if (site.sourceObjectOffset !== null) {
    const objVal = site.sourceObjectOffset >>> 0;
    descriptors.push({
      descriptorId: `${site.siteId}_obj`,
      targetSiteId: site.siteId,
      sourceFileOffset: site.sourceFileOffset,
      sourceFileOffsetHex: toHex32(site.sourceFileOffset),
      representationKind: 'object-relative-site-offset',
      value: objVal,
      valueHex: toHex32(objVal),
      targetSiteObjectNumber: site.sourceObjectNumber,
      targetSiteRegionId: site.sourceRegionId,
    });
  }

  if (site.sourceLoadedAddress !== null) {
    const linVal = site.sourceLoadedAddress >>> 0;
    descriptors.push({
      descriptorId: `${site.siteId}_lin`,
      targetSiteId: site.siteId,
      sourceFileOffset: site.sourceFileOffset,
      sourceFileOffsetHex: toHex32(site.sourceFileOffset),
      representationKind: 'linear-site-address',
      value: linVal,
      valueHex: toHex32(linVal),
      targetSiteObjectNumber: site.sourceObjectNumber,
      targetSiteRegionId: site.sourceRegionId,
    });
  }

  return descriptors;
}

/**
 * Classifies the spatial relationship between a second-order referrer and a first-hop site:
 * - isExactSelf: referrer offset == targetSiteStart
 * - isOverlappingTargetField: referrer begins inside [targetSiteStart, targetSiteStart + 4) and is not exact self
 * - isExternal: NOT isExactSelf AND NOT isOverlappingTargetField
 */
export function classifyOccurrenceSpatialRelationship(
  referrerOffset: number,
  targetSiteStart: number,
): { isExactSelf: boolean; isOverlappingTargetField: boolean; isExternal: boolean } {
  const isExactSelf = referrerOffset === targetSiteStart;
  const isOverlappingTargetField =
    referrerOffset > targetSiteStart && referrerOffset < targetSiteStart + 4;
  const isExternal = !isExactSelf && !isOverlappingTargetField;
  return { isExactSelf, isOverlappingTargetField, isExternal };
}

export interface PaletteReferenceChainOptions {
  detailCap?: number;
  onProgress?: (stage: string, progress: number) => void;
}

const DEFAULT_DETAIL_CAP = 1000;

export const INTERPRETATION_CAVEATS = [
  'TWO-HOP EXACT-VALUE CHAIN != DATA FLOW OR CONSUMER RELATIONSHIP.',
  'WHITELISTED X86 OPERAND SHAPE != VERIFIED POINTER.',
  'OBJECT 1 CODE-FACING EVIDENCE DOES NOT ESTABLISH PALETTE SEMANTICS.',
  'A first-hop site containing a candidate representation does not establish that the site is a palette pointer.',
  'A second-order occurrence targeting a first-hop site offset indicates an exact numerical match in the binary, not structural or functional consumption.',
];

/**
 * Authoritative predicate determining if a candidate is a true participant in B.5.
 * Supports:
 * 1. Direct candidate ID membership check against confirmed harmonic clusters from Phase 1E.2B.5.
 * 2. Cross-verification using candidate profile mechanicalFlags.hasB5HarmonicEvidence and b5Harmonic.populationParticipationCount.
 */
export interface HarmonicClusterLike {
  clusterId?: string;
  participatingCandidateIds?: string[];
  subunits?: Array<{ subunitId?: string; candidateIds?: string[] }>;
}

export interface ExtendedPhaseHarmonicResult extends Partial<MK1PalettePhaseHarmonicResult> {
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  confirmedHarmonicClusters?: HarmonicClusterLike[];
}

export function isCandidateB5Participant(
  candidateOrProf:
    | string
    | {
        candidateId?: string;
        mechanicalFlags?: { hasB5HarmonicEvidence?: boolean };
        b5Harmonic?: { populationParticipationCount?: number } | null;
      }
    | undefined
    | null,
  b5Result?: ExtendedPhaseHarmonicResult | MK1PalettePhaseHarmonicResult | null,
): boolean {
  if (!candidateOrProf) return false;

  // If candidate ID string is provided with B.5 result
  if (typeof candidateOrProf === 'string') {
    const candidateId = candidateOrProf;
    if (!b5Result || b5Result.status === 'FAILED') return false;
    const extB5 = b5Result as ExtendedPhaseHarmonicResult;
    if (Array.isArray(extB5.confirmedHarmonicClusters)) {
      for (const cluster of extB5.confirmedHarmonicClusters) {
        if (cluster.participatingCandidateIds && cluster.participatingCandidateIds.includes(candidateId)) {
          return true;
        }
        for (const subunit of cluster.subunits || []) {
          if (subunit.candidateIds && subunit.candidateIds.includes(candidateId)) {
            return true;
          }
        }
      }
    }
    if (Array.isArray(b5Result.physicalPopulationPhaseAnalyses)) {
      for (const pop of b5Result.physicalPopulationPhaseAnalyses) {
        if (pop.candidateIds && pop.candidateIds.includes(candidateId)) {
          return true;
        }
      }
    }
    return false;
  }

  // Fusion Profile check
  const hasFlag = candidateOrProf.mechanicalFlags?.hasB5HarmonicEvidence === true;
  const popCount = candidateOrProf.b5Harmonic?.populationParticipationCount;
  if (typeof popCount === 'number') {
    return hasFlag && popCount > 0;
  }
  return hasFlag;
}

export interface DetermineTwoHopChainClassParams {
  firstHopRole: MK1FirstHopX86Role | string;
  hasRepeatedStructureEvidence: boolean;
  hasSecondOrderReferrer: boolean;
  secondOrderRole?: MK1SecondOrderX86Role | string | null;
  secondOrderObjectNumber?: number | null;
  secondOrderShapeStatus?: string | null;
}

/**
 * Authoritative precedence hierarchy for two-hop chain class assignment.
 */
export function determineTwoHopChainClass(params: DetermineTwoHopChainClassParams): MK1TwoHopChainClass {
  if (!params.hasSecondOrderReferrer) {
    return params.firstHopRole === 'whitelisted-object1-operand-site'
      ? 'direct-whitelisted-object1-first-hop'
      : 'first-hop-reference-with-no-second-order-external-reference';
  }

  // 1. Negative Control Precedence
  if (
    params.firstHopRole === 'relative-control-negative-site' ||
    params.secondOrderRole === 'relative-control-negative-referrer'
  ) {
    return 'relative-control-negative-chain';
  }

  // 2. Ambiguous Precedence
  if (
    params.firstHopRole === 'object1-ambiguous-site' ||
    params.secondOrderRole === 'object1-ambiguous-referrer' ||
    params.secondOrderShapeStatus === 'ambiguous-prefix-context'
  ) {
    return 'ambiguous-chain';
  }

  // 3. Structured + Whitelisted Object 1 Referrer
  if (
    params.hasRepeatedStructureEvidence &&
    params.secondOrderRole === 'whitelisted-object1-operand-referrer'
  ) {
    return 'structured-first-hop-with-whitelisted-object1-referrer';
  }

  // 4. Unstructured + Whitelisted Object 1 Referrer
  if (
    !params.hasRepeatedStructureEvidence &&
    params.secondOrderRole === 'whitelisted-object1-operand-referrer'
  ) {
    return 'unstructured-first-hop-with-whitelisted-object1-referrer';
  }

  // 5. Structured + Other Object 1 Referrer
  if (
    params.hasRepeatedStructureEvidence &&
    params.secondOrderObjectNumber === 1
  ) {
    return 'structured-first-hop-with-other-object1-referrer';
  }

  // 6. Two-Hop Data-Only
  return 'two-hop-data-only';
}

/**
 * Executes Pass 1E.2B.7 Two-Hop Reverse-Reference Chain and Code-Facing Source-Site Reconnaissance.
 */
export function executePaletteReferenceChainReconnaissance(
  exeBuffer: Uint8Array,
  report: MK1ExecutableLayoutReport,
  b1Result: MK1PaletteReferenceReconResult,
  contextResult: MK1PaletteOccurrenceContextResult,
  repeatedStructureResult: MK1PaletteRepeatedStructureResult,
  cycleLayoutResult: MK1PaletteCycleLayoutResult,
  phaseHarmonicResult: MK1PalettePhaseHarmonicResult,
  fusionResult: MK1PaletteCandidateEvidenceFusionResult,
  options?: PaletteReferenceChainOptions,
): MK1PaletteReferenceChainReconResult {
  const detailCap = options?.detailCap ?? DEFAULT_DETAIL_CAP;
  const onProgress = options?.onProgress;
  const timestamp = new Date().toISOString();
  const exePath = report.exePath;
  const exeSize = exeBuffer.length;

  // 1. Stage: validate-inputs
  onProgress?.('validate-inputs', 5);

  const missingInputs: string[] = [];
  if (!b1Result || b1Result.globalSummary === undefined) missingInputs.push('B.1 reference reconnaissance');
  if (!contextResult || contextResult.trackB === undefined) missingInputs.push('B.2 occurrence context');
  if (!repeatedStructureResult || repeatedStructureResult.status === 'FAILED') missingInputs.push('B.3 repeated structure');
  if (!cycleLayoutResult || cycleLayoutResult.status === 'FAILED') missingInputs.push('B.4 cycle layout');
  if (!phaseHarmonicResult || phaseHarmonicResult.status === 'FAILED') missingInputs.push('B.5 phase harmonic');
  if (!fusionResult || fusionResult.status !== 'SUCCESS') missingInputs.push('B.6 candidate evidence fusion (must be SUCCESS)');

  if (missingInputs.length > 0) {
    return createFailedResult(
      `Mandatory upstream inputs missing or non-successful: ${missingInputs.join(', ')}`,
      timestamp,
      exePath,
      exeSize,
      detailCap,
    );
  }

  // 2. Stage: reconcile-b1-b2
  onProgress?.('reconcile-b1-b2', 10);

  const b1LogicalExternalMatchesInput = b1Result.globalSummary.totalExternalLogicalMatches;
  const b1UniquePhysicalSitesInput = b1Result.globalSummary.uniqueExternalPhysicalOccurrencePositions;

  const b2Positions = contextResult.classifiedPositions;
  const b2PhysicalSitesInput = b2Positions.length;
  const b2LogicalMatchesInput = b2Positions.reduce((acc, p) => acc + p.logicalMatchesCount, 0);

  const logicalFirstHopMatchesReconcile = b1LogicalExternalMatchesInput === b2LogicalMatchesInput;
  const physicalFirstHopSitesReconcile = b1UniquePhysicalSitesInput === b2PhysicalSitesInput;

  if (!logicalFirstHopMatchesReconcile || !physicalFirstHopSitesReconcile) {
    return createFailedResult(
      `B.1/B.2 first-hop reconciliation failure: logical (${b1LogicalExternalMatchesInput} vs ${b2LogicalMatchesInput}), physical (${b1UniquePhysicalSitesInput} vs ${b2PhysicalSitesInput})`,
      timestamp,
      exePath,
      exeSize,
      detailCap,
    );
  }

  // 3. Stage: build-first-hop-sites
  onProgress?.('build-first-hop-sites', 15);

  const pageSize = report.parsedHeader?.pageSize || 4096;
  const b6ProfileMap = new Map<string, typeof fusionResult.candidateProfiles[0]>();
  for (const prof of fusionResult.candidateProfiles) {
    b6ProfileMap.set(prof.candidateId, prof);
  }

  // Index B.3 cluster and repeated-target group positions
  const b3ClusterMap = new Map<number, string[]>();
  for (const cluster of repeatedStructureResult.clusterStructuralSummaries) {
    for (const pos of cluster.positions) {
      const existing = b3ClusterMap.get(pos) || [];
      existing.push(cluster.clusterId);
      b3ClusterMap.set(pos, existing);
    }
  }

  const b3GroupMap = new Map<number, string[]>();
  for (const grp of repeatedStructureResult.repeatedTargetGroupSummaries) {
    for (const pos of grp.positions) {
      const existing = b3GroupMap.get(pos) || [];
      existing.push(grp.groupId);
      b3GroupMap.set(pos, existing);
    }
  }

  const firstHopSites: MK1PaletteFirstHopReferenceSite[] = [];
  let firstHopObject1Sites = 0;
  let firstHopWhitelistedObject1Sites = 0;
  let firstHopNegativeRelativeControlSites = 0;
  let firstHopUnmatchedObject1Sites = 0;
  let firstHopStructuredB3Sites = 0;
  let firstHopSitesMissingCandidateAssociation = 0;
  let firstHopSitesWithUnknownRegion = 0;

  const firstHopOffsetSet = new Set<number>();

  for (const p of b2Positions) {
    firstHopOffsetSet.add(p.sourceFileOffset);
    const byteClass = classifyPhysicalByteInObjects(p.sourceFileOffset, report.objects, pageSize);
    const sourceObjectNumber = byteClass.objectNumber;
    const sourceObjectOffset = byteClass.objectOffset;
    const sourceObjectOffsetHex = byteClass.objectOffsetHex;
    const sourceLoadedAddress = byteClass.linearAddressCandidate;
    const sourceLoadedAddressHex = byteClass.linearAddressCandidateHex;

    const b3Clusters = b3ClusterMap.get(p.sourceFileOffset) || [];
    const b3Groups = b3GroupMap.get(p.sourceFileOffset) || [];
    const hasRepeatedStructureEvidence = b3Clusters.length > 0 || b3Groups.length > 0;
    if (hasRepeatedStructureEvidence) {
      firstHopStructuredB3Sites++;
    }

    // Determine non-semantic first-hop role
    let firstHopRole: MK1FirstHopX86Role;
    if (sourceObjectNumber !== 1) {
      firstHopRole = 'non-object1-reference-site';
    } else {
      firstHopObject1Sites++;
      if (
        p.shapeStatus === 'single-whitelisted-shape' ||
        p.shapeStatus === 'multiple-whitelisted-shapes'
      ) {
        firstHopRole = 'whitelisted-object1-operand-site';
        firstHopWhitelistedObject1Sites++;
      } else if (p.shapeStatus === 'relative-control-field-shape') {
        firstHopRole = 'relative-control-negative-site';
        firstHopNegativeRelativeControlSites++;
      } else if (p.shapeStatus === 'ambiguous-prefix-context') {
        firstHopRole = 'object1-ambiguous-site';
      } else {
        firstHopRole = 'object1-unmatched-site';
        firstHopUnmatchedObject1Sites++;
      }
    }

    if (!p.sourceRegionId || p.sourceRegionId === 'unknown') {
      firstHopSitesWithUnknownRegion++;
    }

    const associatedCandidateIds: string[] = [];
    const associatedCandidateRepresentationKinds: PaletteRepresentationKind[] = [];
    const associatedCandidateTargets: FirstHopCandidateTargetEvidence[] = [];

    for (const assoc of p.associatedCandidates) {
      associatedCandidateIds.push(assoc.candidateId);
      associatedCandidateRepresentationKinds.push(assoc.representationKind);

      const targetProf = b6ProfileMap.get(assoc.candidateId);
      if (targetProf) {
        associatedCandidateTargets.push({
          candidateId: assoc.candidateId,
          representationKind: assoc.representationKind,
          zeroShiftKanoCompatible: targetProf.intrinsic.zeroShiftKanoCompatible,
          researchScore: targetProf.provenance.researchScore,
          structureDepth: targetProf.structureDepth,
          targetRegion: String(targetProf.topology.targetRegionId),
          referenceProfile: targetProf.exactReference.referenceProfile,
          participatesInB5: isCandidateB5Participant(targetProf),
          tensionFlags: Object.entries(targetProf.tensionFlags).filter(([_, v]) => Boolean(v)).map(([k]) => k),
        });
      }
    }

    if (associatedCandidateIds.length === 0) {
      firstHopSitesMissingCandidateAssociation++;
    }

    firstHopSites.push({
      siteId: `site_${toHex32(p.sourceFileOffset)}`,
      sourceFileOffset: p.sourceFileOffset,
      sourceFileOffsetHex: p.sourceFileOffsetHex,
      sourceRegionId: p.sourceRegionId,
      sourceRegionClass: p.sourceRegionClass,
      sourceObjectNumber,
      sourceObjectOffset,
      sourceObjectOffsetHex,
      sourceLoadedAddress,
      sourceLoadedAddressHex,
      matchedUint32Value: p.matchedUint32Value,
      matchedUint32Hex: p.matchedUint32Hex,
      logicalMatchesCount: p.logicalMatchesCount,
      associatedCandidateIds,
      associatedCandidateRepresentationKinds,
      shapeStatus: p.shapeStatus,
      matchingShapes: p.matchingShapes || [],
      primaryTrackAShape: p.trackA_x86Shape,
      clusterId: p.clusterId,
      isB2Clustered: p.clusterId !== null,
      b3ClusterMemberships: b3Clusters,
      b3RepeatedTargetGroupMemberships: b3Groups,
      hasRepeatedStructureEvidence,
      firstHopRole,
      associatedCandidateTargets,
    });
  }

  // 4. Stage: derive-site-representations & build-value-multimap
  onProgress?.('derive-site-representations', 25);

  const siteDescriptors: SiteRepresentationDescriptor[] = [];
  const multimap = new Map<number, SiteRepresentationDescriptor[]>();

  for (const site of firstHopSites) {
    const descs = deriveSiteRepresentationsForSite(site);
    for (const desc of descs) {
      siteDescriptors.push(desc);
      const arr = multimap.get(desc.value) || [];
      arr.push(desc);
      multimap.set(desc.value, arr);
    }
  }

  // Handle Controls: String Area Base & zero-first-hop controls
  const controlSummaries: MK1ControlChainSummary[] = [];
  const controlMultimap = new Map<number, { controlName: string; sourceOffset: number; desc: SiteRepresentationDescriptor }[]>();

  if (b1Result.controlTargets) {
    for (const ctrl of b1Result.controlTargets) {
      const ctrlOccurrences = ctrl.occurrences || [];
      if (ctrlOccurrences.length === 0) {
        controlSummaries.push({
          controlName: ctrl.name,
          sourceFileOffset: ctrl.physicalOffset,
          sourceFileOffsetHex: ctrl.physicalOffsetHex,
          status: 'not-applicable-no-first-hop-reference',
          firstHopCount: 0,
          derivedRepresentations: [],
          secondOrderLogicalMatches: 0,
          secondOrderPhysicalReferrers: 0,
          secondOrderObject1Referrers: 0,
          secondOrderWhitelistedObject1Referrers: 0,
          occurrences: [],
        });
      } else {
        // Build descriptors for control's first-hop physical positions
        const ctrlDescs: SiteRepresentationDescriptor[] = [];
        for (const occ of ctrlOccurrences) {
          const occOffset = occ.sourceFileOffset;
          const byteClass = classifyPhysicalByteInObjects(occOffset, report.objects, pageSize);
          
          const pVal = occOffset >>> 0;
          const d1: SiteRepresentationDescriptor = {
            descriptorId: `ctrl_${ctrl.name}_phys_${toHex32(occOffset)}`,
            targetSiteId: `ctrl_${ctrl.name}`,
            sourceFileOffset: occOffset,
            sourceFileOffsetHex: toHex32(occOffset),
            representationKind: 'physical-site-offset',
            value: pVal,
            valueHex: toHex32(pVal),
            targetSiteObjectNumber: byteClass.objectNumber,
            targetSiteRegionId: occ.sourceRegionId,
          };
          ctrlDescs.push(d1);
          const a1 = controlMultimap.get(pVal) || [];
          a1.push({ controlName: ctrl.name, sourceOffset: occOffset, desc: d1 });
          controlMultimap.set(pVal, a1);

          if (byteClass.objectOffset !== null) {
            const oVal = byteClass.objectOffset >>> 0;
            const d2: SiteRepresentationDescriptor = {
              descriptorId: `ctrl_${ctrl.name}_obj_${toHex32(occOffset)}`,
              targetSiteId: `ctrl_${ctrl.name}`,
              sourceFileOffset: occOffset,
              sourceFileOffsetHex: toHex32(occOffset),
              representationKind: 'object-relative-site-offset',
              value: oVal,
              valueHex: toHex32(oVal),
              targetSiteObjectNumber: byteClass.objectNumber,
              targetSiteRegionId: occ.sourceRegionId,
            };
            ctrlDescs.push(d2);
            const a2 = controlMultimap.get(oVal) || [];
            a2.push({ controlName: ctrl.name, sourceOffset: occOffset, desc: d2 });
            controlMultimap.set(oVal, a2);
          }

          if (byteClass.linearAddressCandidate !== null) {
            const lVal = byteClass.linearAddressCandidate >>> 0;
            const d3: SiteRepresentationDescriptor = {
              descriptorId: `ctrl_${ctrl.name}_lin_${toHex32(occOffset)}`,
              targetSiteId: `ctrl_${ctrl.name}`,
              sourceFileOffset: occOffset,
              sourceFileOffsetHex: toHex32(occOffset),
              representationKind: 'linear-site-address',
              value: lVal,
              valueHex: toHex32(lVal),
              targetSiteObjectNumber: byteClass.objectNumber,
              targetSiteRegionId: occ.sourceRegionId,
            };
            ctrlDescs.push(d3);
            const a3 = controlMultimap.get(lVal) || [];
            a3.push({ controlName: ctrl.name, sourceOffset: occOffset, desc: d3 });
            controlMultimap.set(lVal, a3);
          }
        }

        controlSummaries.push({
          controlName: ctrl.name,
          sourceFileOffset: ctrl.physicalOffset,
          sourceFileOffsetHex: ctrl.physicalOffsetHex,
          status: 'evaluated',
          firstHopCount: ctrlOccurrences.length,
          derivedRepresentations: ctrlDescs,
          secondOrderLogicalMatches: 0,
          secondOrderPhysicalReferrers: 0,
          secondOrderObject1Referrers: 0,
          secondOrderWhitelistedObject1Referrers: 0,
          occurrences: [],
        });
      }
    }
  }

  // Value collision analysis
  const distinctSiteRepresentationValues = multimap.size;
  let representationValuesWithMultipleSiteTargets = 0;
  const sitesAffectedByCollisionsSet = new Set<string>();

  for (const descs of multimap.values()) {
    const siteIds = new Set(descs.map((d) => d.targetSiteId));
    if (siteIds.size > 1) {
      representationValuesWithMultipleSiteTargets++;
      for (const sId of siteIds) {
        sitesAffectedByCollisionsSet.add(sId);
      }
    }
  }

  // Helper to determine region of a file offset
  const getRegionForOffset = (offset: number) => {
    for (const r of report.topology.regions) {
      if (offset >= r.fileStart && offset < r.fileEnd) {
        return { regionId: r.regionId, regionClass: r.regionClass };
      }
    }
    return { regionId: 'unknown', regionClass: 'unmapped' as MK1ExecutableRegionClass };
  };

  // Helper to check if offset falls inside [anySite.offset, anySite.offset + 4)
  const isInsideAnyFirstHop = (offset: number) => {
    for (let delta = 0; delta < 4; delta++) {
      if (firstHopOffsetSet.has(offset - delta)) return true;
    }
    return false;
  };

  // 5. Stage: scan-second-order-values (EXACTLY ONE multi-target linear scan)
  onProgress?.('scan-second-order-values', 40);

  const secondOrderOccurrences: MK1SecondOrderOccurrence[] = [];
  const ctrlOccurrencesMap = new Map<string, MK1SecondOrderOccurrence[]>();
  let secondOrderSelfOccurrenceCount = 0;
  let secondOrderOverlapOccurrenceCount = 0;

  const scanLimit = exeBuffer.length - 4;
  for (let i = 0; i <= scanLimit; i++) {
    const uint32Val =
      (exeBuffer[i] |
        (exeBuffer[i + 1] << 8) |
        (exeBuffer[i + 2] << 16) |
        (exeBuffer[i + 3] << 24)) >>>
      0;

    const matchedDescs = multimap.get(uint32Val);
    if (matchedDescs) {
      const reg = getRegionForOffset(i);
      const byteClass = classifyPhysicalByteInObjects(i, report.objects, pageSize);
      const isInsideAny = isInsideAnyFirstHop(i);

      for (const desc of matchedDescs) {
        const rel = classifyOccurrenceSpatialRelationship(i, desc.sourceFileOffset);
        const isExactSelf = rel.isExactSelf;
        const isOverlapping = rel.isOverlappingTargetField;
        const isInsideTargetSiteField = isExactSelf || isOverlapping;
        const isExternal = rel.isExternal;
        if (isExactSelf) secondOrderSelfOccurrenceCount++;
        if (isOverlapping) secondOrderOverlapOccurrenceCount++;

        secondOrderOccurrences.push({
          occurrenceId: `sec_${toHex32(i)}_${desc.descriptorId}`,
          referrerFileOffset: i,
          referrerFileOffsetHex: toHex32(i),
          matchedUint32Value: uint32Val,
          matchedUint32Hex: toHex32(uint32Val),
          targetSiteId: desc.targetSiteId,
          targetSiteOffsetHex: desc.sourceFileOffsetHex,
          siteRepresentationKind: desc.representationKind,
          targetSiteObjectNumber: desc.targetSiteObjectNumber,
          referrerRegionId: reg.regionId,
          referrerRegionClass: reg.regionClass,
          referrerObjectNumber: byteClass.objectNumber,
          referrerObjectOffsetHex: byteClass.objectOffsetHex,
          referrerLoadedAddressHex: byteClass.linearAddressCandidateHex,
          alignmentMod4: i % 4 === 0,
          alignmentMod2: i % 2 === 0,
          isExactSelfOccurrence: isExactSelf,
          isInsideTargetSiteField,
          isInsideAnyFirstHopField: isInsideAny,
          isExternal,
          isOverlappingTargetField: isOverlapping,
        });
      }
    }

    // Also check control multimap
    const ctrlMatches = controlMultimap.get(uint32Val);
    if (ctrlMatches) {
      const reg = getRegionForOffset(i);
      const byteClass = classifyPhysicalByteInObjects(i, report.objects, pageSize);
      for (const m of ctrlMatches) {
        const isExactSelf = i === m.sourceOffset;
        const isOverlapping = i > m.sourceOffset && i < m.sourceOffset + 4;
        const isInsideTargetSiteField = isExactSelf || isOverlapping;
        const isExternal = !isExactSelf && !isOverlapping;
        const occList = ctrlOccurrencesMap.get(m.controlName) || [];
        occList.push({
          occurrenceId: `ctrl_sec_${toHex32(i)}_${m.desc.descriptorId}`,
          referrerFileOffset: i,
          referrerFileOffsetHex: toHex32(i),
          matchedUint32Value: uint32Val,
          matchedUint32Hex: toHex32(uint32Val),
          targetSiteId: m.controlName,
          targetSiteOffsetHex: toHex32(m.sourceOffset),
          siteRepresentationKind: m.desc.representationKind,
          targetSiteObjectNumber: m.desc.targetSiteObjectNumber,
          referrerRegionId: reg.regionId,
          referrerRegionClass: reg.regionClass,
          referrerObjectNumber: byteClass.objectNumber,
          referrerObjectOffsetHex: byteClass.objectOffsetHex,
          referrerLoadedAddressHex: byteClass.linearAddressCandidateHex,
          alignmentMod4: i % 4 === 0,
          alignmentMod2: i % 2 === 0,
          isExactSelfOccurrence: isExactSelf,
          isInsideTargetSiteField,
          isInsideAnyFirstHopField: false,
          isExternal,
          isOverlappingTargetField: isOverlapping,
        });
        ctrlOccurrencesMap.set(m.controlName, occList);
      }
    }
  }

  // 6. Stage: classify-second-order-sources
  onProgress?.('classify-second-order-sources', 55);

  // Group candidate second-order matches by unique referrerFileOffset
  const occurrencesByReferrerOffset = new Map<number, MK1SecondOrderOccurrence[]>();
  for (const occ of secondOrderOccurrences) {
    const list = occurrencesByReferrerOffset.get(occ.referrerFileOffset) || [];
    list.push(occ);
    occurrencesByReferrerOffset.set(occ.referrerFileOffset, list);
  }

  const uniquePhysicalReferrers: MK1SecondOrderPhysicalReferrer[] = [];
  const uniqueReferrerMap = new Map<number, MK1SecondOrderPhysicalReferrer>();

  let secondOrderObject1ReferrersCount = 0;
  let secondOrderWhitelistedObject1ReferrersCount = 0;
  let secondOrderNegativeRelativeControlReferrersCount = 0;
  let secondOrderUnmatchedObject1ReferrersCount = 0;

  const shapeClassCounts: Record<X86OperandShapeClass, number> = {
    'mov-r32-imm32': 0,
    'push-imm32': 0,
    'accumulator-imm32': 0,
    'moffs32-direct': 0,
    'disp32-absolute': 0,
    'negative-rel32': 0,
    'unmatched-shape': 0,
  };

  const shapeStatusCounts: Record<X86ShapeStatus, number> = {
    'single-whitelisted-shape': 0,
    'multiple-whitelisted-shapes': 0,
    'relative-control-field-shape': 0,
    'ambiguous-prefix-context': 0,
    'no-whitelisted-shape': 0,
  };

  for (const [offset, occs] of occurrencesByReferrerOffset.entries()) {
    const firstOcc = occs[0];
    const byteClass = classifyPhysicalByteInObjects(offset, report.objects, pageSize);
    const reg = getRegionForOffset(offset);

    // Context bytes window: 16 before, 4 matched, 16 after
    const beforeStart = Math.max(0, offset - 16);
    const afterEnd = Math.min(exeBuffer.length, offset + 4 + 16);
    const beforeHex = bytesToHex(exeBuffer, beforeStart, offset - beforeStart);
    const matchedHex = bytesToHex(exeBuffer, offset, 4);
    const afterHex = bytesToHex(exeBuffer, offset + 4, afterEnd - (offset + 4));
    const fullHex = bytesToHex(exeBuffer, beforeStart, afterEnd - beforeStart);

    const boundedContext: ReferrerBoundedContext = {
      beforeBytesHex: beforeHex,
      matchedBytesHex: matchedHex,
      afterBytesHex: afterHex,
      fullWindowHex: fullHex,
    };

    let secondOrderRole: MK1SecondOrderX86Role;
    let shapeStatus: X86ShapeStatus | null = null;
    let matchingShapes: X86ShapeMatchDetails[] = [];
    let primaryShape: X86ShapeMatchDetails | null = null;

    if (byteClass.objectNumber === 1) {
      secondOrderObject1ReferrersCount++;
      const x86Result = classifyX86OperandShape(exeBuffer, offset, firstOcc.matchedUint32Value);
      shapeStatus = x86Result.shapeStatus;
      matchingShapes = x86Result.matchingShapes;
      primaryShape = x86Result.primaryShape;

      shapeStatusCounts[shapeStatus] = (shapeStatusCounts[shapeStatus] || 0) + 1;
      if (primaryShape) {
        shapeClassCounts[primaryShape.shapeClass] = (shapeClassCounts[primaryShape.shapeClass] || 0) + 1;
        boundedContext.candidateEncodingStartHex = primaryShape.candidateEncodingStartHex;
        boundedContext.candidateEncodingLength = primaryShape.candidateEncodingLength;
      }

      if (
        shapeStatus === 'single-whitelisted-shape' ||
        shapeStatus === 'multiple-whitelisted-shapes'
      ) {
        secondOrderRole = 'whitelisted-object1-operand-referrer';
        secondOrderWhitelistedObject1ReferrersCount++;
      } else if (shapeStatus === 'relative-control-field-shape') {
        secondOrderRole = 'relative-control-negative-referrer';
        secondOrderNegativeRelativeControlReferrersCount++;
      } else if (shapeStatus === 'ambiguous-prefix-context') {
        secondOrderRole = 'object1-ambiguous-referrer';
      } else {
        secondOrderRole = 'object1-unmatched-referrer';
        secondOrderUnmatchedObject1ReferrersCount++;
      }
    } else {
      secondOrderRole = 'non-object1-referrer';
    }

    const targetSiteIds = Array.from(new Set(occs.map((o) => o.targetSiteId)));
    const isExactSelfForAnySite = occs.some((o) => o.isExactSelfOccurrence);
    const isInsideAnyFirstHopField = occs.some((o) => o.isInsideAnyFirstHopField);

    const refObj: MK1SecondOrderPhysicalReferrer = {
      referrerFileOffset: offset,
      referrerFileOffsetHex: toHex32(offset),
      matchedUint32Value: firstOcc.matchedUint32Value,
      matchedUint32Hex: toHex32(firstOcc.matchedUint32Value),
      referrerRegionId: reg.regionId,
      referrerRegionClass: reg.regionClass,
      referrerObjectNumber: byteClass.objectNumber,
      referrerObjectOffset: byteClass.objectOffset,
      referrerObjectOffsetHex: byteClass.objectOffsetHex,
      referrerLoadedAddress: byteClass.linearAddressCandidate,
      referrerLoadedAddressHex: byteClass.linearAddressCandidateHex,
      alignmentMod4: offset % 4 === 0,
      alignmentMod2: offset % 2 === 0,
      secondOrderRole,
      shapeStatus,
      matchingShapes,
      primaryShape,
      context: boundedContext,
      targetSiteIds,
      isExactSelfForAnySite,
      isInsideAnyFirstHopField,
    };

    uniquePhysicalReferrers.push(refObj);
    uniqueReferrerMap.set(offset, refObj);
  }

  // 7. Stage: build-site-summaries
  onProgress?.('build-site-summaries', 65);

  const siteOccurrencesMap = new Map<string, MK1SecondOrderOccurrence[]>();
  for (const occ of secondOrderOccurrences) {
    const list = siteOccurrencesMap.get(occ.targetSiteId) || [];
    list.push(occ);
    siteOccurrencesMap.set(occ.targetSiteId, list);
  }

  const firstHopSiteSummaries: MK1FirstHopSiteSummary[] = [];
  let firstHopSitesWithExternalSecondOrderReference = 0;
  let firstHopSitesWithWhitelistedObject1SecondOrderReferrer = 0;

  for (const site of firstHopSites) {
    const siteOccs = siteOccurrencesMap.get(site.siteId) || [];
    const totalLogical = siteOccs.length;
    const uniqueRefs = new Set(siteOccs.map((o) => o.referrerFileOffset));

    const extOccs = siteOccs.filter((o) => o.isExternal);
    const externalLogical = extOccs.length;
    const extPhysicalOffsets = Array.from(new Set(extOccs.map((o) => o.referrerFileOffset)));
    const externalUniquePhysical = extPhysicalOffsets.length;

    const selfCount = siteOccs.filter((o) => o.isExactSelfOccurrence).length;
    const overlapCount = siteOccs.filter((o) => o.isOverlappingTargetField).length;

    const byRepKind: Record<SiteRepresentationKind, number> = {
      'physical-site-offset': 0,
      'object-relative-site-offset': 0,
      'linear-site-address': 0,
    };
    const byRegion: Record<string, number> = {};

    let o1Count = 0;
    let whitelistedO1Count = 0;
    let negRelCount = 0;
    let unmatchedO1Count = 0;

    for (const off of extPhysicalOffsets) {
      const refInfo = uniqueReferrerMap.get(off);
      if (refInfo) {
        if (refInfo.referrerObjectNumber === 1) {
          o1Count++;
          if (refInfo.secondOrderRole === 'whitelisted-object1-operand-referrer') {
            whitelistedO1Count++;
          } else if (refInfo.secondOrderRole === 'relative-control-negative-referrer') {
            negRelCount++;
          } else {
            unmatchedO1Count++;
          }
        }
      }
    }

    for (const occ of extOccs) {
      byRepKind[occ.siteRepresentationKind] = (byRepKind[occ.siteRepresentationKind] || 0) + 1;
      byRegion[occ.referrerRegionId] = (byRegion[occ.referrerRegionId] || 0) + 1;
    }

    const hasExt = externalUniquePhysical > 0;
    const hasWhitelisted = whitelistedO1Count > 0;

    if (hasExt) firstHopSitesWithExternalSecondOrderReference++;
    if (hasWhitelisted) firstHopSitesWithWhitelistedObject1SecondOrderReferrer++;

    const derivedDescs = siteDescriptors.filter((d) => d.targetSiteId === site.siteId);

    firstHopSiteSummaries.push({
      siteId: site.siteId,
      sourceFileOffset: site.sourceFileOffset,
      sourceFileOffsetHex: site.sourceFileOffsetHex,
      sourceRegionId: site.sourceRegionId,
      sourceObjectNumber: site.sourceObjectNumber,
      firstHopRole: site.firstHopRole,
      hasRepeatedStructureEvidence: site.hasRepeatedStructureEvidence,
      associatedCandidateCount: site.associatedCandidateIds.length,
      associatedCandidateIds: site.associatedCandidateIds,
      derivedRepresentations: derivedDescs,
      totalSecondOrderLogicalMatches: totalLogical,
      uniqueSecondOrderPhysicalReferrers: uniqueRefs.size,
      externalSecondOrderLogicalMatches: externalLogical,
      externalSecondOrderUniquePhysicalReferrers: externalUniquePhysical,
      selfOccurrenceCount: selfCount,
      overlapOccurrenceCount: overlapCount,
      secondOrderByRepresentationKind: byRepKind,
      secondOrderByReferrerRegion: byRegion,
      secondOrderObject1ReferrerCount: o1Count,
      secondOrderWhitelistedObject1ReferrerCount: whitelistedO1Count,
      secondOrderNegativeRelativeControlCount: negRelCount,
      secondOrderUnmatchedObject1Count: unmatchedO1Count,
      hasExternalSecondOrderReference: hasExt,
      hasWhitelistedObject1SecondOrderReferrer: hasWhitelisted,
    });
  }

  // 8. Stage: build-candidate-chains
  onProgress?.('build-candidate-chains', 75);

  // Map first-hop sites by candidateId
  const candidateToSitesMap = new Map<string, MK1PaletteFirstHopReferenceSite[]>();
  for (const site of firstHopSites) {
    for (const cId of site.associatedCandidateIds) {
      const list = candidateToSitesMap.get(cId) || [];
      list.push(site);
      candidateToSitesMap.set(cId, list);
    }
  }

  const siteSummaryMap = new Map<string, MK1FirstHopSiteSummary>();
  for (const s of firstHopSiteSummaries) {
    siteSummaryMap.set(s.siteId, s);
  }

  const candidateChainSummaries: MK1CandidateChainSummary[] = [];
  let candidateCountWithAnyTwoHopChain = 0;
  let candidateCountWithCodeFacingTwoHopEvidence = 0;
  const allGeneratedChainPaths: MK1TwoHopChainPath[] = [];

  for (const prof of fusionResult.candidateProfiles) {
    const cId = prof.candidateId;
    const sites = candidateToSitesMap.get(cId) || [];

    if (sites.length === 0) {
      candidateChainSummaries.push({
        candidateId: cId,
        status: 'not-applicable-no-first-hop-reference',
        zeroShiftKanoCompatible: prof.intrinsic.zeroShiftKanoCompatible,
        researchScore: prof.provenance.researchScore,
        structureDepth: prof.structureDepth,
        referenceProfile: prof.exactReference.referenceProfile,
        firstHopLogicalMatchCount: 0,
        firstHopUniqueSiteCount: 0,
        directWhitelistedObject1FirstHopCount: 0,
        hasDirectWhitelistedObject1FirstHop: false,
        structuredFirstHopSiteCount: 0,
        firstHopSitesWithSecondOrderExternalReferences: 0,
        secondOrderExternalLogicalMatches: 0,
        secondOrderUniquePhysicalReferrers: 0,
        secondOrderObject1Referrers: 0,
        secondOrderWhitelistedObject1Referrers: 0,
        structuredSitesWithWhitelistedObject1Referrer: 0,
        chainClassHistogram: createEmptyChainClassHistogram(),
        hasAnyTwoHopChain: false,
        hasCodeFacingTwoHopEvidence: false,
        chainPaths: [],
      });
      continue;
    }

    let firstHopLogicalMatchCount = 0;
    let directWhitelistedObject1FirstHopCount = 0;
    let structuredFirstHopSiteCount = 0;
    let firstHopSitesWithSecondOrderExternalReferencesCount = 0;
    let secondOrderExternalLogicalMatches = 0;

    const allPhysicalReferrerOffsets = new Set<number>();
    const object1PhysicalReferrers = new Set<number>();
    const whitelistedObject1PhysicalReferrers = new Set<number>();
    let structuredSitesWithWhitelistedObject1Referrer = 0;

    const chainClassHistogram = createEmptyChainClassHistogram();
    const candidatePaths: MK1TwoHopChainPath[] = [];

    for (const s of sites) {
      const sSum = siteSummaryMap.get(s.siteId);
      if (!sSum) continue;

      // Count candidate's specific representation instances at this site
      const repIndices = s.associatedCandidateIds
        .map((id, idx) => (id === cId ? idx : -1))
        .filter((idx) => idx !== -1);
      firstHopLogicalMatchCount += repIndices.length;

      if (s.firstHopRole === 'whitelisted-object1-operand-site') {
        directWhitelistedObject1FirstHopCount++;
      }
      if (s.hasRepeatedStructureEvidence) {
        structuredFirstHopSiteCount++;
      }
      if (sSum.hasExternalSecondOrderReference) {
        firstHopSitesWithSecondOrderExternalReferencesCount++;
      }
      secondOrderExternalLogicalMatches += sSum.externalSecondOrderLogicalMatches;

      const extOccs = (siteOccurrencesMap.get(s.siteId) || []).filter((o) => o.isExternal);
      const siteUniqueReferrerOffsets = Array.from(new Set(extOccs.map((o) => o.referrerFileOffset)));

      let siteHasWhitelistedO1Ref = false;
      for (const off of siteUniqueReferrerOffsets) {
        allPhysicalReferrerOffsets.add(off);
        const refInfo = uniqueReferrerMap.get(off);
        if (refInfo?.referrerObjectNumber === 1) {
          object1PhysicalReferrers.add(off);
          if (refInfo.secondOrderRole === 'whitelisted-object1-operand-referrer') {
            whitelistedObject1PhysicalReferrers.add(off);
            siteHasWhitelistedO1Ref = true;
          }
        }
      }

      if (s.hasRepeatedStructureEvidence && siteHasWhitelistedO1Ref) {
        structuredSitesWithWhitelistedObject1Referrer++;
      }

      // Build chain paths for this site
      if (extOccs.length === 0) {
        // No external second-order reference
        const pathClass: MK1TwoHopChainClass = determineTwoHopChainClass({
          firstHopRole: s.firstHopRole,
          hasRepeatedStructureEvidence: s.hasRepeatedStructureEvidence,
          hasSecondOrderReferrer: false,
        });

        chainClassHistogram[pathClass]++;
        for (const repIdx of repIndices) {
          const path: MK1TwoHopChainPath = {
            pathId: `path_${cId}_${s.siteId}_noref_${repIdx}`,
            candidateId: cId,
            candidateRepresentationKind: s.associatedCandidateRepresentationKinds[repIdx],
            firstHopSiteId: s.siteId,
            firstHopSiteOffsetHex: s.sourceFileOffsetHex,
            firstHopRole: s.firstHopRole,
            firstHopB3StructureMembership: [...s.b3ClusterMemberships, ...s.b3RepeatedTargetGroupMemberships],
            secondOrderReferrerOffsetHex: null,
            siteRepresentationKindUsed: null,
            matchedSiteRepresentationValue: null,
            matchedSiteRepresentationValueHex: null,
            secondOrderReferrerRegion: null,
            secondOrderReferrerObject: null,
            secondOrderRole: null,
            secondOrderX86Shape: null,
            chainClass: pathClass,
          };
          candidatePaths.push(path);
          allGeneratedChainPaths.push(path);
        }
      } else {
        // Concrete two-hop paths through external referrers
        for (const repIdx of repIndices) {
          for (const occ of extOccs) {
            const refInfo = uniqueReferrerMap.get(occ.referrerFileOffset);
            const pathClass: MK1TwoHopChainClass = determineTwoHopChainClass({
              firstHopRole: s.firstHopRole,
              hasRepeatedStructureEvidence: s.hasRepeatedStructureEvidence,
              hasSecondOrderReferrer: true,
              secondOrderRole: refInfo?.secondOrderRole,
              secondOrderObjectNumber: refInfo?.referrerObjectNumber,
              secondOrderShapeStatus: refInfo?.shapeStatus,
            });

            chainClassHistogram[pathClass]++;
            const path: MK1TwoHopChainPath = {
              pathId: `path_${cId}_${s.siteId}_${occ.occurrenceId}`,
              candidateId: cId,
              candidateRepresentationKind: s.associatedCandidateRepresentationKinds[repIdx],
              firstHopSiteId: s.siteId,
              firstHopSiteOffsetHex: s.sourceFileOffsetHex,
              firstHopRole: s.firstHopRole,
              firstHopB3StructureMembership: [...s.b3ClusterMemberships, ...s.b3RepeatedTargetGroupMemberships],
              secondOrderReferrerOffsetHex: occ.referrerFileOffsetHex,
              siteRepresentationKindUsed: occ.siteRepresentationKind,
              matchedSiteRepresentationValue: occ.matchedUint32Value,
              matchedSiteRepresentationValueHex: occ.matchedUint32Hex,
              secondOrderReferrerRegion: occ.referrerRegionId,
              secondOrderReferrerObject: occ.referrerObjectNumber,
              secondOrderRole: refInfo?.secondOrderRole || null,
              secondOrderX86Shape: refInfo?.primaryShape?.shapeClass || null,
              chainClass: pathClass,
            };
            candidatePaths.push(path);
            allGeneratedChainPaths.push(path);
          }
        }
      }
    }

    const hasAnyTwoHop = allPhysicalReferrerOffsets.size > 0;
    const hasCodeFacingTwoHop = whitelistedObject1PhysicalReferrers.size > 0;

    if (hasAnyTwoHop) candidateCountWithAnyTwoHopChain++;
    if (hasCodeFacingTwoHop) candidateCountWithCodeFacingTwoHopEvidence++;

    candidateChainSummaries.push({
      candidateId: cId,
      status: 'evaluated',
      zeroShiftKanoCompatible: prof.intrinsic.zeroShiftKanoCompatible,
      researchScore: prof.provenance.researchScore,
      structureDepth: prof.structureDepth,
      referenceProfile: prof.exactReference.referenceProfile,
      firstHopLogicalMatchCount,
      firstHopUniqueSiteCount: sites.length,
      directWhitelistedObject1FirstHopCount,
      hasDirectWhitelistedObject1FirstHop: directWhitelistedObject1FirstHopCount > 0,
      structuredFirstHopSiteCount,
      firstHopSitesWithSecondOrderExternalReferences: firstHopSitesWithSecondOrderExternalReferencesCount,
      secondOrderExternalLogicalMatches,
      secondOrderUniquePhysicalReferrers: allPhysicalReferrerOffsets.size,
      secondOrderObject1Referrers: object1PhysicalReferrers.size,
      secondOrderWhitelistedObject1Referrers: whitelistedObject1PhysicalReferrers.size,
      structuredSitesWithWhitelistedObject1Referrer,
      chainClassHistogram,
      hasAnyTwoHopChain: hasAnyTwoHop,
      hasCodeFacingTwoHopEvidence: hasCodeFacingTwoHop,
      chainPaths: candidatePaths,
    });
  }

  // 9. Stage: build-convergence-groups
  onProgress?.('build-convergence-groups', 85);

  const convergenceGroups: MK1ReferrerConvergenceGroup[] = [];
  const b5CandidateIdSet = new Set(
    fusionResult.candidateProfiles
      .filter((c) => isCandidateB5Participant(c))
      .map((c) => c.candidateId),
  );

  for (const ref of uniquePhysicalReferrers) {
    const extOccs = (occurrencesByReferrerOffset.get(ref.referrerFileOffset) || []).filter(
      (o) => o.isExternal,
    );
    if (extOccs.length === 0) continue;

    const siteIdSet = new Set(extOccs.map((o) => o.targetSiteId));
    const repKindSet = new Set(extOccs.map((o) => o.siteRepresentationKind));

    const candidateIdSet = new Set<string>();
    for (const sId of siteIdSet) {
      const s = firstHopSites.find((item) => item.siteId === sId);
      if (s) {
        for (const cId of s.associatedCandidateIds) {
          candidateIdSet.add(cId);
        }
      }
    }

    if (siteIdSet.size > 1 || candidateIdSet.size > 1) {
      let kanoCount = 0;
      let nonKanoCount = 0;
      const b5List: string[] = [];

      for (const cId of candidateIdSet) {
        const prof = b6ProfileMap.get(cId);
        if (prof?.intrinsic.zeroShiftKanoCompatible) {
          kanoCount++;
        } else {
          nonKanoCount++;
        }
        if (b5CandidateIdSet.has(cId)) {
          b5List.push(cId);
        }
      }

      convergenceGroups.push({
        groupId: `conv_${ref.referrerFileOffsetHex}`,
        secondOrderReferrerOffset: ref.referrerFileOffset,
        secondOrderReferrerOffsetHex: ref.referrerFileOffsetHex,
        referrerRegionId: ref.referrerRegionId,
        referrerRegionClass: ref.referrerRegionClass,
        referrerObjectNumber: ref.referrerObjectNumber,
        referrerX86Role: ref.secondOrderRole,
        referrerX86Shape: ref.primaryShape?.shapeClass || null,
        siteIds: Array.from(siteIdSet),
        candidateIds: Array.from(candidateIdSet),
        siteRepresentationKinds: Array.from(repKindSet),
        candidateKanoCompatibilitySplit: {
          kanoCompatibleCount: kanoCount,
          nonCompatibleCount: nonKanoCount,
        },
        b5CandidateIds: b5List,
      });
    }
  }

  // 10. Update Control Summaries with Scan Occurrences
  for (const ctrl of controlSummaries) {
    if (ctrl.status === 'evaluated') {
      const occs = ctrlOccurrencesMap.get(ctrl.controlName) || [];
      const extOccs = occs.filter((o) => o.isExternal);
      const uniqueOffsets = Array.from(new Set(extOccs.map((o) => o.referrerFileOffset)));

      let o1Count = 0;
      let whitelistedO1 = 0;

      for (const off of uniqueOffsets) {
        const byteClass = classifyPhysicalByteInObjects(off, report.objects, pageSize);
        if (byteClass.objectNumber === 1) {
          o1Count++;
          const x86 = classifyX86OperandShape(exeBuffer, off, occs[0]?.matchedUint32Value || 0);
          if (
            x86.shapeStatus === 'single-whitelisted-shape' ||
            x86.shapeStatus === 'multiple-whitelisted-shapes'
          ) {
            whitelistedO1++;
          }
        }
      }

      ctrl.secondOrderLogicalMatches = extOccs.length;
      ctrl.secondOrderPhysicalReferrers = uniqueOffsets.length;
      ctrl.secondOrderObject1Referrers = o1Count;
      ctrl.secondOrderWhitelistedObject1Referrers = whitelistedO1;
      ctrl.occurrences = occs;
    }
  }

  // 11. Build Analytical Rollups (Representation Summary, Region Matrix, Cohort Comparisons)
  onProgress?.('validate-reconciliation', 95);

  // Representation summary
  const representationSummary: MK1RepresentationKindSummary[] = (
    ['physical-site-offset', 'object-relative-site-offset', 'linear-site-address'] as SiteRepresentationKind[]
  ).map((kind) => {
    const descsOfKind = siteDescriptors.filter((d) => d.representationKind === kind);
    const distinctVals = new Set(descsOfKind.map((d) => d.value)).size;
    const occsOfKind = secondOrderOccurrences.filter(
      (o) => o.isExternal && o.siteRepresentationKind === kind,
    );
    const uniquePhysical = new Set(occsOfKind.map((o) => o.referrerFileOffset));
    const sitesWithExt = new Set(occsOfKind.map((o) => o.targetSiteId)).size;

    let o1Count = 0;
    let whitelistedO1 = 0;
    for (const off of uniquePhysical) {
      const refInfo = uniqueReferrerMap.get(off);
      if (refInfo?.referrerObjectNumber === 1) {
        o1Count++;
        if (refInfo.secondOrderRole === 'whitelisted-object1-operand-referrer') {
          whitelistedO1++;
        }
      }
    }

    return {
      representationKind: kind,
      eligibleSiteCount: descsOfKind.length,
      distinctValues: distinctVals,
      sitesWithExternalSecondOrderReferences: sitesWithExt,
      externalLogicalMatches: occsOfKind.length,
      uniquePhysicalReferrerPositions: uniquePhysical.size,
      object1ReferrerCount: o1Count,
      whitelistedObject1ReferrerCount: whitelistedO1,
    };
  });

  // First-hop role summary
  const firstHopRoleSummary: Record<MK1FirstHopX86Role, number> = {
    'whitelisted-object1-operand-site': 0,
    'relative-control-negative-site': 0,
    'object1-unmatched-site': 0,
    'object1-ambiguous-site': 0,
    'non-object1-reference-site': 0,
  };
  for (const s of firstHopSites) {
    firstHopRoleSummary[s.firstHopRole]++;
  }

  // Second-order role summary
  const secondOrderRoleSummary: Record<MK1SecondOrderX86Role, number> = {
    'whitelisted-object1-operand-referrer': 0,
    'relative-control-negative-referrer': 0,
    'object1-unmatched-referrer': 0,
    'object1-ambiguous-referrer': 0,
    'non-object1-referrer': 0,
  };
  for (const r of uniquePhysicalReferrers) {
    secondOrderRoleSummary[r.secondOrderRole]++;
  }

  // Region matrix: First-hop region × Second-order referrer region
  const regionMatrixMap = new Map<string, {
    firstHopRegionId: string;
    referrerRegionId: string;
    logicalMatches: number;
    referrers: Set<number>;
    sites: Set<string>;
    candidates: Set<string>;
  }>();

  for (const occ of secondOrderOccurrences) {
    if (!occ.isExternal) continue;
    const targetSite = firstHopSites.find((s) => s.siteId === occ.targetSiteId);
    if (!targetSite) continue;

    const key = `${targetSite.sourceRegionId}__${occ.referrerRegionId}`;
    let cell = regionMatrixMap.get(key);
    if (!cell) {
      cell = {
        firstHopRegionId: targetSite.sourceRegionId,
        referrerRegionId: occ.referrerRegionId,
        logicalMatches: 0,
        referrers: new Set<number>(),
        sites: new Set<string>(),
        candidates: new Set<string>(),
      };
      regionMatrixMap.set(key, cell);
    }
    cell.logicalMatches++;
    cell.referrers.add(occ.referrerFileOffset);
    cell.sites.add(targetSite.siteId);
    for (const cId of targetSite.associatedCandidateIds) {
      cell.candidates.add(cId);
    }
  }

  const regionMatrix: MK1RegionReferrerMatrixCell[] = Array.from(regionMatrixMap.values()).map(
    (cell) => ({
      firstHopRegionId: cell.firstHopRegionId,
      referrerRegionId: cell.referrerRegionId,
      logicalChainMatchCount: cell.logicalMatches,
      uniquePhysicalReferrerCount: cell.referrers.size,
      distinctFirstHopSiteCount: cell.sites.size,
      distinctCandidateCount: cell.candidates.size,
    }),
  );

  // Second-order x86 shape summary
  const secondOrderX86ShapeSummary: MK1SecondOrderX86ShapeSummary = {
    shapeClassCounts,
    shapeStatusCounts,
    totalObject1Referrers: secondOrderObject1ReferrersCount,
    positiveWhitelistedCount: secondOrderWhitelistedObject1ReferrersCount,
    negativeRelativeControlCount: secondOrderNegativeRelativeControlReferrersCount,
    unmatchedCount: secondOrderUnmatchedObject1ReferrersCount,
    ambiguousCount: shapeStatusCounts['ambiguous-prefix-context'] || 0,
  };

  // Cohort comparisons (Section 48)
  const referencedCandidates = candidateChainSummaries.filter(
    (c) => c.status === 'evaluated',
  );

  const cohortComparison: MK1CohortDirectVsIndirectEntry[] = [
    buildCohortEntry(
      'Kano-compatible referenced',
      referencedCandidates.filter((c) => c.zeroShiftKanoCompatible),
    ),
    buildCohortEntry(
      'Non-compatible referenced',
      referencedCandidates.filter((c) => !c.zeroShiftKanoCompatible),
    ),
    buildCohortEntry(
      'B.5 Kano-compatible',
      referencedCandidates.filter(
        (c) => b5CandidateIdSet.has(c.candidateId) && c.zeroShiftKanoCompatible,
      ),
    ),
    buildCohortEntry(
      'B.5 non-compatible',
      referencedCandidates.filter(
        (c) => b5CandidateIdSet.has(c.candidateId) && !c.zeroShiftKanoCompatible,
      ),
    ),
    buildCohortEntry(
      'Very-short referenced (len <= 3)',
      referencedCandidates.filter((c) => {
        const prof = b6ProfileMap.get(c.candidateId);
        return prof ? prof.intrinsic.length <= 3 : false;
      }),
    ),
    buildCohortEntry(
      'Not-very-short referenced (len > 3)',
      referencedCandidates.filter((c) => {
        const prof = b6ProfileMap.get(c.candidateId);
        return prof ? prof.intrinsic.length > 3 : false;
      }),
    ),
  ];

  // Truncation of detailed arrays
  const secondOrderDetailsIncluded = Math.min(detailCap, secondOrderOccurrences.length);
  const secondOrderDetailsOmitted = Math.max(0, secondOrderOccurrences.length - detailCap);
  const boundedDetailedSecondOrderOccurrences = secondOrderOccurrences.slice(0, detailCap);

  const chainDetailsGenerated = allGeneratedChainPaths.length;
  const chainDetailsIncluded = Math.min(detailCap, allGeneratedChainPaths.length);
  const chainDetailsOmitted = Math.max(0, allGeneratedChainPaths.length - detailCap);
  const boundedDetailedChains = allGeneratedChainPaths.slice(0, detailCap);

  let sitesWithTruncatedDetails = 0;
  if (secondOrderDetailsOmitted > 0) {
    const includedTargetSiteIds = new Set(
      boundedDetailedSecondOrderOccurrences.map((o) => o.targetSiteId),
    );
    for (const site of firstHopSites) {
      const totalForSite = siteOccurrencesMap.get(site.siteId)?.length || 0;
      const includedForSite = boundedDetailedSecondOrderOccurrences.filter(
        (o) => o.targetSiteId === site.siteId,
      ).length;
      if (totalForSite > includedForSite) {
        sitesWithTruncatedDetails++;
      }
    }
  }

  // 12. Final Reconciliation Audit
  const secondOrderExternalLogicalMatches = secondOrderOccurrences.filter(
    (o) => o.isExternal,
  ).length;
  const secondOrderExternalUniquePhysicalReferrers = new Set(
    secondOrderOccurrences.filter((o) => o.isExternal).map((o) => o.referrerFileOffset),
  ).size;

  const totalSecondOrderLogicalMatchesSum = firstHopSiteSummaries.reduce(
    (acc, s) => acc + s.totalSecondOrderLogicalMatches,
    0,
  );
  const allSecondOrderMatchesAccountedFor =
    totalSecondOrderLogicalMatchesSum === secondOrderOccurrences.length;

  // Mechanical Control Exclusion Audit
  const controlFirstHopSiteOffsets: number[] = [];
  const controlCandidatePhysicalSiteCollisions: number[] = [];
  if (b1Result.controlTargets) {
    for (const ctrl of b1Result.controlTargets) {
      for (const occ of ctrl.occurrences || []) {
        controlFirstHopSiteOffsets.push(occ.sourceFileOffset);
        if (firstHopOffsetSet.has(occ.sourceFileOffset)) {
          controlCandidatePhysicalSiteCollisions.push(occ.sourceFileOffset);
        }
      }
    }
  }
  const controlFirstHopSiteOffsetsUnique = Array.from(new Set(controlFirstHopSiteOffsets));
  const controlFirstHopSiteOffsetsHex = controlFirstHopSiteOffsetsUnique.map(toHex32);
  const candidateFirstHopSiteOffsets = Array.from(firstHopOffsetSet);

  const candidateSummaryIds = new Set(candidateChainSummaries.map((c) => c.candidateId));
  const controlCandidateChainSummaryCollisions = (b1Result.controlTargets || [])
    .map((c) => c.name)
    .filter((name) => candidateSummaryIds.has(name) || candidateSummaryIds.has(`ctrl_${name}`));

  let controlsInjectedIntoCandidateCounts = 0;
  for (const ctrl of b1Result.controlTargets || []) {
    if (candidateSummaryIds.has(ctrl.name) || candidateSummaryIds.has(`ctrl_${ctrl.name}`)) {
      controlsInjectedIntoCandidateCounts++;
    }
  }
  if (candidateChainSummaries.length !== fusionResult.candidateProfiles.length) {
    controlsInjectedIntoCandidateCounts += Math.abs(
      candidateChainSummaries.length - fusionResult.candidateProfiles.length,
    );
  }

  const controlSitesExcludedFromCandidateCounts =
    controlsInjectedIntoCandidateCounts === 0 &&
    controlCandidateChainSummaryCollisions.length === 0 &&
    controlCandidatePhysicalSiteCollisions.length === 0;

  const allReconciled =
    logicalFirstHopMatchesReconcile &&
    physicalFirstHopSitesReconcile &&
    firstHopSitesMissingCandidateAssociation === 0 &&
    firstHopSitesWithUnknownRegion === 0 &&
    allSecondOrderMatchesAccountedFor &&
    controlSitesExcludedFromCandidateCounts;

  const scanConfiguration: MK1ReferenceChainScanConfiguration = {
    uintWidth: 32,
    endianness: 'little',
    alignment: 'byte-by-byte',
    scanStart: 0,
    scanEnd: exeBuffer.length - 4,
    wholeFileScanCount: 1,
    siteRepresentationKinds: [
      'physical-site-offset',
      'object-relative-site-offset',
      'linear-site-address',
    ],
  };

  const trueB5ParticipantCount = fusionResult.candidateProfiles.filter((c) =>
    isCandidateB5Participant(c),
  ).length;

  const upstreamSummary: MK1ReferenceChainUpstreamSummary = {
    b1Available: Boolean(b1Result),
    b1Status: b1Result.status || 'SUCCESS',
    b1LogicalMatches: b1Result.globalSummary.totalExternalLogicalMatches,
    b1UniquePhysicalSites: b1Result.globalSummary.uniqueExternalPhysicalOccurrencePositions,
    b2Available: Boolean(contextResult),
    b2Status: contextResult.status || 'SUCCESS',
    b2ClassifiedPositions: contextResult.classifiedPositions.length,
    b3Available: Boolean(repeatedStructureResult),
    b3Status: repeatedStructureResult.status,
    b4Available: Boolean(cycleLayoutResult),
    b4Status: cycleLayoutResult.status,
    b5Available: Boolean(phaseHarmonicResult),
    b5Status: phaseHarmonicResult.status,
    b6Available: Boolean(fusionResult),
    b6Status: fusionResult.status,
    b6CandidateCount: fusionResult.candidateProfiles.length,
    b6TrueB5ParticipantCount: trueB5ParticipantCount,
  };

  const globalSummary: MK1ReferenceChainGlobalSummary = {
    firstHopPhysicalSitesInput: b2PhysicalSitesInput,
    firstHopLogicalMatchesInput: b2LogicalMatchesInput,
    firstHopSitesProcessed: firstHopSites.length,
    firstHopSitesMissingB2Evidence: 0,
    firstHopObject1Sites,
    firstHopWhitelistedObject1Sites,
    firstHopNegativeRelativeControlSites,
    firstHopUnmatchedObject1Sites,
    firstHopStructuredB3Sites,
    siteRepresentationDescriptorsGenerated: siteDescriptors.length,
    distinctSiteRepresentationValues,
    representationValuesWithMultipleSiteTargets,
    secondOrderLogicalMatches: secondOrderOccurrences.length,
    secondOrderSelfOccurrenceCount,
    secondOrderOverlapOccurrenceCount,
    secondOrderExternalLogicalMatches,
    secondOrderUniquePhysicalReferrerPositions: uniquePhysicalReferrers.length,
    secondOrderExternalUniquePhysicalReferrers,
    secondOrderObject1Referrers: secondOrderObject1ReferrersCount,
    secondOrderWhitelistedObject1Referrers: secondOrderWhitelistedObject1ReferrersCount,
    secondOrderNegativeRelativeControlReferrers: secondOrderNegativeRelativeControlReferrersCount,
    firstHopSitesWithExternalSecondOrderReference,
    firstHopSitesWithWhitelistedObject1SecondOrderReferrer,
    candidateCountWithAnyTwoHopChain,
    candidateCountWithCodeFacingTwoHopEvidence,
  };

  const reconciliation: MK1ReferenceChainReconciliation = {
    b1LogicalExternalMatchesInput,
    b2LogicalMatchesInput,
    logicalFirstHopMatchesReconcile,
    b1UniquePhysicalSitesInput,
    b2PhysicalSitesInput,
    physicalFirstHopSitesReconcile,
    firstHopSitesProcessed: firstHopSites.length,
    firstHopSitesMissingCandidateAssociation,
    firstHopSitesWithUnknownRegion,
    siteRepresentationDescriptorsGenerated: siteDescriptors.length,
    secondOrderLogicalMatchesGenerated: secondOrderOccurrences.length,
    secondOrderLogicalMatchesSummarized: totalSecondOrderLogicalMatchesSum,
    secondOrderUniquePhysicalPositionsGenerated: uniquePhysicalReferrers.length,
    secondOrderUniquePhysicalPositionsSummarized: uniquePhysicalReferrers.length,
    allSecondOrderMatchesAccountedFor,
    controlFirstHopSitesInput: controlFirstHopSiteOffsets.length,
    controlFirstHopSiteOffsets: controlFirstHopSiteOffsetsUnique,
    controlFirstHopSiteOffsetsHex,
    candidateFirstHopSiteOffsets,
    controlCandidatePhysicalSiteCollisions,
    controlCandidateChainSummaryCollisions,
    controlsInjectedIntoCandidateCounts,
    controlSitesExcludedFromCandidateCounts,
    allReconciled,
  };

  onProgress?.('complete', 100);

  return {
    format: 'mk1_palette_reference_chain_recon_v1',
    milestone: '1E.2B.7a',
    status: allReconciled ? 'SUCCESS' : 'FAILED',
    failureReason: allReconciled ? undefined : 'Final reconciliation invariants failed',
    timestamp,
    exePath,
    exeSize,
    scanConfiguration,
    upstreamSummary,
    globalSummary,
    reconciliation,
    representationSummary,
    firstHopRoleSummary,
    secondOrderRoleSummary,
    regionMatrix,
    secondOrderX86ShapeSummary,
    cohortComparison,
    candidateChainSummaries,
    firstHopSiteSummaries,
    firstHopSites,
    uniquePhysicalReferrers,
    convergenceGroups,
    controls: controlSummaries,
    detailCap,
    secondOrderDetailsIncluded,
    secondOrderDetailsOmitted,
    chainDetailsGenerated,
    chainDetailsIncluded,
    chainDetailsOmitted,
    sitesWithTruncatedDetails,
    boundedDetailedSecondOrderOccurrences,
    boundedDetailedChains,
    interpretationCaveats: INTERPRETATION_CAVEATS,
  };
}

function createEmptyChainClassHistogram(): Record<MK1TwoHopChainClass, number> {
  return {
    'direct-whitelisted-object1-first-hop': 0,
    'structured-first-hop-with-whitelisted-object1-referrer': 0,
    'structured-first-hop-with-other-object1-referrer': 0,
    'unstructured-first-hop-with-whitelisted-object1-referrer': 0,
    'two-hop-data-only': 0,
    'first-hop-reference-with-no-second-order-external-reference': 0,
    'relative-control-negative-chain': 0,
    'ambiguous-chain': 0,
  };
}

function buildCohortEntry(
  cohortName: string,
  candidates: MK1CandidateChainSummary[],
): MK1CohortDirectVsIndirectEntry {
  let directOnly = 0;
  let twoHopOnly = 0;
  let both = 0;
  let neither = 0;

  for (const c of candidates) {
    const direct = c.hasDirectWhitelistedObject1FirstHop;
    const twoHop = c.hasCodeFacingTwoHopEvidence;
    if (direct && twoHop) {
      both++;
    } else if (direct && !twoHop) {
      directOnly++;
    } else if (!direct && twoHop) {
      twoHopOnly++;
    } else {
      neither++;
    }
  }

  return {
    cohortName,
    totalCandidates: candidates.length,
    directCodeFacingOnly: directOnly,
    twoHopCodeFacingOnly: twoHopOnly,
    both,
    neither,
  };
}

function createFailedResult(
  reason: string,
  timestamp: string,
  exePath: string,
  exeSize: number,
  detailCap: number,
): MK1PaletteReferenceChainReconResult {
  const emptyGlobal: MK1ReferenceChainGlobalSummary = {
    firstHopPhysicalSitesInput: 0,
    firstHopLogicalMatchesInput: 0,
    firstHopSitesProcessed: 0,
    firstHopSitesMissingB2Evidence: 0,
    firstHopObject1Sites: 0,
    firstHopWhitelistedObject1Sites: 0,
    firstHopNegativeRelativeControlSites: 0,
    firstHopUnmatchedObject1Sites: 0,
    firstHopStructuredB3Sites: 0,
    siteRepresentationDescriptorsGenerated: 0,
    distinctSiteRepresentationValues: 0,
    representationValuesWithMultipleSiteTargets: 0,
    secondOrderLogicalMatches: 0,
    secondOrderSelfOccurrenceCount: 0,
    secondOrderOverlapOccurrenceCount: 0,
    secondOrderExternalLogicalMatches: 0,
    secondOrderUniquePhysicalReferrerPositions: 0,
    secondOrderExternalUniquePhysicalReferrers: 0,
    secondOrderObject1Referrers: 0,
    secondOrderWhitelistedObject1Referrers: 0,
    secondOrderNegativeRelativeControlReferrers: 0,
    firstHopSitesWithExternalSecondOrderReference: 0,
    firstHopSitesWithWhitelistedObject1SecondOrderReferrer: 0,
    candidateCountWithAnyTwoHopChain: 0,
    candidateCountWithCodeFacingTwoHopEvidence: 0,
  };

  const emptyRecon: MK1ReferenceChainReconciliation = {
    b1LogicalExternalMatchesInput: 0,
    b2LogicalMatchesInput: 0,
    logicalFirstHopMatchesReconcile: false,
    b1UniquePhysicalSitesInput: 0,
    b2PhysicalSitesInput: 0,
    physicalFirstHopSitesReconcile: false,
    firstHopSitesProcessed: 0,
    firstHopSitesMissingCandidateAssociation: 0,
    firstHopSitesWithUnknownRegion: 0,
    siteRepresentationDescriptorsGenerated: 0,
    secondOrderLogicalMatchesGenerated: 0,
    secondOrderLogicalMatchesSummarized: 0,
    secondOrderUniquePhysicalPositionsGenerated: 0,
    secondOrderUniquePhysicalPositionsSummarized: 0,
    allSecondOrderMatchesAccountedFor: false,
    controlFirstHopSitesInput: 0,
    controlFirstHopSiteOffsets: [],
    controlFirstHopSiteOffsetsHex: [],
    candidateFirstHopSiteOffsets: [],
    controlCandidatePhysicalSiteCollisions: [],
    controlCandidateChainSummaryCollisions: [],
    controlsInjectedIntoCandidateCounts: 0,
    controlSitesExcludedFromCandidateCounts: true,
    allReconciled: false,
  };

  const emptyScanConfig: MK1ReferenceChainScanConfiguration = {
    uintWidth: 32,
    endianness: 'little',
    alignment: 'byte-by-byte',
    scanStart: 0,
    scanEnd: 0,
    wholeFileScanCount: 1,
    siteRepresentationKinds: [
      'physical-site-offset',
      'object-relative-site-offset',
      'linear-site-address',
    ],
  };

  const emptyUpstream: MK1ReferenceChainUpstreamSummary = {
    b1Available: false,
    b1Status: 'FAILED',
    b1LogicalMatches: 0,
    b1UniquePhysicalSites: 0,
    b2Available: false,
    b2Status: 'FAILED',
    b2ClassifiedPositions: 0,
    b3Available: false,
    b3Status: 'FAILED',
    b4Available: false,
    b4Status: 'FAILED',
    b5Available: false,
    b5Status: 'FAILED',
    b6Available: false,
    b6Status: 'FAILED',
    b6CandidateCount: 0,
    b6TrueB5ParticipantCount: 0,
  };

  return {
    format: 'mk1_palette_reference_chain_recon_v1',
    milestone: '1E.2B.7a',
    status: 'FAILED',
    failureReason: reason,
    timestamp,
    exePath,
    exeSize,
    scanConfiguration: emptyScanConfig,
    upstreamSummary: emptyUpstream,
    globalSummary: emptyGlobal,
    reconciliation: emptyRecon,
    representationSummary: [],
    firstHopRoleSummary: {
      'whitelisted-object1-operand-site': 0,
      'relative-control-negative-site': 0,
      'object1-unmatched-site': 0,
      'object1-ambiguous-site': 0,
      'non-object1-reference-site': 0,
    },
    secondOrderRoleSummary: {
      'whitelisted-object1-operand-referrer': 0,
      'relative-control-negative-referrer': 0,
      'object1-unmatched-referrer': 0,
      'object1-ambiguous-referrer': 0,
      'non-object1-referrer': 0,
    },
    regionMatrix: [],
    secondOrderX86ShapeSummary: {
      shapeClassCounts: {
        'mov-r32-imm32': 0,
        'push-imm32': 0,
        'accumulator-imm32': 0,
        'moffs32-direct': 0,
        'disp32-absolute': 0,
        'negative-rel32': 0,
        'unmatched-shape': 0,
      },
      shapeStatusCounts: {
        'single-whitelisted-shape': 0,
        'multiple-whitelisted-shapes': 0,
        'relative-control-field-shape': 0,
        'ambiguous-prefix-context': 0,
        'no-whitelisted-shape': 0,
      },
      totalObject1Referrers: 0,
      positiveWhitelistedCount: 0,
      negativeRelativeControlCount: 0,
      unmatchedCount: 0,
      ambiguousCount: 0,
    },
    cohortComparison: [],
    candidateChainSummaries: [],
    firstHopSiteSummaries: [],
    firstHopSites: [],
    uniquePhysicalReferrers: [],
    convergenceGroups: [],
    controls: [],
    detailCap,
    secondOrderDetailsIncluded: 0,
    secondOrderDetailsOmitted: 0,
    chainDetailsGenerated: 0,
    chainDetailsIncluded: 0,
    chainDetailsOmitted: 0,
    sitesWithTruncatedDetails: 0,
    boundedDetailedSecondOrderOccurrences: [],
    boundedDetailedChains: [],
    interpretationCaveats: INTERPRETATION_CAVEATS,
  };
}

/**
 * Creates the deterministic export payload for Pass 1E.2B.7a.
 */
export function createMK1PaletteReferenceChainExport(
  result: MK1PaletteReferenceChainReconResult,
): MK1PaletteReferenceChainExport {
  return {
    format: 'mk1_palette_reference_chain_recon_v1',
    milestone: '1E.2B.7a',
    status: result.status,
    failureReason: result.failureReason,
    timestamp: result.timestamp,
    exePath: result.exePath,
    exeSize: result.exeSize,
    scanConfiguration: result.scanConfiguration,
    upstreamSummary: result.upstreamSummary,
    globalSummary: result.globalSummary,
    reconciliation: result.reconciliation,
    representationSummary: result.representationSummary,
    firstHopRoleSummary: result.firstHopRoleSummary,
    secondOrderRoleSummary: result.secondOrderRoleSummary,
    regionMatrix: result.regionMatrix,
    secondOrderX86ShapeSummary: result.secondOrderX86ShapeSummary,
    cohortComparison: result.cohortComparison,
    candidateChainSummaries: result.candidateChainSummaries.map((c) => {
      const { chainPaths, ...rest } = c;
      return rest;
    }),
    firstHopSiteSummaries: result.firstHopSiteSummaries,
    convergenceGroups: result.convergenceGroups,
    controls: result.controls,
    detailCap: result.detailCap,
    secondOrderDetailsIncluded: result.secondOrderDetailsIncluded,
    secondOrderDetailsOmitted: result.secondOrderDetailsOmitted,
    chainDetailsGenerated: result.chainDetailsGenerated,
    chainDetailsIncluded: result.chainDetailsIncluded,
    chainDetailsOmitted: result.chainDetailsOmitted,
    sitesWithTruncatedDetails: result.sitesWithTruncatedDetails,
    boundedDetailedSecondOrderOccurrences: result.boundedDetailedSecondOrderOccurrences,
    boundedDetailedChains: result.boundedDetailedChains,
    interpretationCaveats: result.interpretationCaveats,
  };
}
