import { MK1ExecutableRegionClass } from './executableRegionTopology';
import { PaletteRepresentationKind } from './paletteReferenceReconnaissanceTypes';
import {
  X86OperandShapeClass,
  X86ShapeMatchDetails,
  X86ShapeStatus,
} from './paletteOccurrenceContextTypes';
import {
  CandidateReferenceProfile,
  StructureDepthLevel,
} from './paletteCandidateEvidenceFusionTypes';

/**
 * Non-semantic role classification for first-hop reference sites.
 * Derived exclusively from sourceObjectNumber, B.2 shapeStatus, and matchingShapes.
 */
export type MK1FirstHopX86Role =
  | 'whitelisted-object1-operand-site'
  | 'relative-control-negative-site'
  | 'object1-unmatched-site'
  | 'object1-ambiguous-site'
  | 'non-object1-reference-site';

/**
 * Non-semantic role classification for second-order referrer positions.
 * Identifies code-facing structural evidence only. Does not establish consumption.
 */
export type MK1SecondOrderX86Role =
  | 'whitelisted-object1-operand-referrer'
  | 'relative-control-negative-referrer'
  | 'object1-unmatched-referrer'
  | 'object1-ambiguous-referrer'
  | 'non-object1-referrer';

/**
 * Descriptive mechanical chain classes for two-hop reverse-reference paths.
 */
export type MK1TwoHopChainClass =
  | 'direct-whitelisted-object1-first-hop'
  | 'structured-first-hop-with-whitelisted-object1-referrer'
  | 'structured-first-hop-with-other-object1-referrer'
  | 'unstructured-first-hop-with-whitelisted-object1-referrer'
  | 'two-hop-data-only'
  | 'first-hop-reference-with-no-second-order-external-reference'
  | 'relative-control-negative-chain'
  | 'ambiguous-chain';

/**
 * Permitted second-order target representation kinds of a first-hop site location.
 * (Note: payload+2 or structure+2 forms are strictly forbidden because a reference site is not a palette candidate structure).
 */
export type SiteRepresentationKind =
  | 'physical-site-offset'
  | 'object-relative-site-offset'
  | 'linear-site-address';

/**
 * Descriptor of a derived representation of a first-hop site location.
 */
export interface SiteRepresentationDescriptor {
  descriptorId: string;
  targetSiteId: string;
  sourceFileOffset: number;
  sourceFileOffsetHex: string;
  representationKind: SiteRepresentationKind;
  value: number;
  valueHex: string;
  targetSiteObjectNumber: number | null;
  targetSiteRegionId: string;
}

/**
 * B.6 candidate target evidence attached to a first-hop site.
 */
export interface FirstHopCandidateTargetEvidence {
  candidateId: string;
  representationKind: PaletteRepresentationKind;
  zeroShiftKanoCompatible: boolean;
  researchScore: number;
  structureDepth: StructureDepthLevel;
  targetRegion: string;
  referenceProfile: CandidateReferenceProfile;
  participatesInB5: boolean;
  tensionFlags: string[];
}

/**
 * Canonical model of a first-hop reference site (one per unique B.2 physical position).
 */
export interface MK1PaletteFirstHopReferenceSite {
  siteId: string;
  sourceFileOffset: number;
  sourceFileOffsetHex: string;
  sourceRegionId: string;
  sourceRegionClass: MK1ExecutableRegionClass | string;
  sourceObjectNumber: number | null;
  sourceObjectOffset: number | null;
  sourceObjectOffsetHex: string | null;
  sourceLoadedAddress: number | null;
  sourceLoadedAddressHex: string | null;
  matchedUint32Value: number;
  matchedUint32Hex: string;
  logicalMatchesCount: number;
  associatedCandidateIds: string[];
  associatedCandidateRepresentationKinds: PaletteRepresentationKind[];
  shapeStatus: X86ShapeStatus | null;
  matchingShapes: X86ShapeMatchDetails[];
  primaryTrackAShape: X86ShapeMatchDetails | null;
  clusterId: string | null;
  isB2Clustered: boolean;
  b3ClusterMemberships: string[];
  b3RepeatedTargetGroupMemberships: string[];
  hasRepeatedStructureEvidence: boolean;
  firstHopRole: MK1FirstHopX86Role;
  associatedCandidateTargets: FirstHopCandidateTargetEvidence[];
}

/**
 * Bounded raw context bytes surrounding a second-order referrer.
 */
export interface ReferrerBoundedContext {
  beforeBytesHex: string;
  matchedBytesHex: string;
  afterBytesHex: string;
  fullWindowHex: string;
  candidateEncodingStartHex?: string;
  candidateEncodingLength?: number;
}

/**
 * Unique physical referrer position discovered during second-order scan.
 */
export interface MK1SecondOrderPhysicalReferrer {
  referrerFileOffset: number;
  referrerFileOffsetHex: string;
  matchedUint32Value: number;
  matchedUint32Hex: string;
  referrerRegionId: string;
  referrerRegionClass: MK1ExecutableRegionClass | string;
  referrerObjectNumber: number | null;
  referrerObjectOffset: number | null;
  referrerObjectOffsetHex: string | null;
  referrerLoadedAddress: number | null;
  referrerLoadedAddressHex: string | null;
  alignmentMod4: boolean;
  alignmentMod2: boolean;
  secondOrderRole: MK1SecondOrderX86Role;
  shapeStatus: X86ShapeStatus | null;
  matchingShapes: X86ShapeMatchDetails[];
  primaryShape: X86ShapeMatchDetails | null;
  context: ReferrerBoundedContext;
  targetSiteIds: string[];
  isExactSelfForAnySite: boolean;
  isInsideAnyFirstHopField: boolean;
}

/**
 * Logical second-order occurrence record (one match between a physical referrer and a site representation).
 */
export interface MK1SecondOrderOccurrence {
  occurrenceId: string;
  referrerFileOffset: number;
  referrerFileOffsetHex: string;
  matchedUint32Value: number;
  matchedUint32Hex: string;
  targetSiteId: string;
  targetSiteOffsetHex: string;
  siteRepresentationKind: SiteRepresentationKind;
  targetSiteObjectNumber: number | null;
  referrerRegionId: string;
  referrerRegionClass: MK1ExecutableRegionClass | string;
  referrerObjectNumber: number | null;
  referrerObjectOffsetHex: string | null;
  referrerLoadedAddressHex: string | null;
  alignmentMod4: boolean;
  alignmentMod2: boolean;
  isExactSelfOccurrence: boolean;
  isInsideTargetSiteField: boolean;
  isInsideAnyFirstHopField: boolean;
  isExternal: boolean;
  isOverlappingTargetField: boolean;
}

/**
 * Concrete two-hop reverse-reference chain path.
 */
export interface MK1TwoHopChainPath {
  pathId: string;
  candidateId: string;
  candidateRepresentationKind: PaletteRepresentationKind;
  firstHopSiteId: string;
  firstHopSiteOffsetHex: string;
  firstHopRole: MK1FirstHopX86Role;
  firstHopB3StructureMembership: string[];
  secondOrderReferrerOffsetHex: string | null;
  siteRepresentationKindUsed: SiteRepresentationKind | null;
  matchedSiteRepresentationValue: number | null;
  matchedSiteRepresentationValueHex: string | null;
  secondOrderReferrerRegion: string | null;
  secondOrderReferrerObject: number | null;
  secondOrderRole: MK1SecondOrderX86Role | null;
  secondOrderX86Shape: X86OperandShapeClass | null;
  chainClass: MK1TwoHopChainClass;
}

/**
 * Two-hop reference chain summary for an individual palette candidate (1 per B.6 candidate).
 */
export interface MK1CandidateChainSummary {
  candidateId: string;
  status: 'evaluated' | 'not-applicable-no-first-hop-reference';
  zeroShiftKanoCompatible: boolean;
  researchScore: number;
  structureDepth: StructureDepthLevel;
  referenceProfile: CandidateReferenceProfile;
  firstHopLogicalMatchCount: number;
  firstHopUniqueSiteCount: number;
  directWhitelistedObject1FirstHopCount: number;
  hasDirectWhitelistedObject1FirstHop: boolean;
  structuredFirstHopSiteCount: number;
  firstHopSitesWithSecondOrderExternalReferences: number;
  secondOrderExternalLogicalMatches: number;
  secondOrderUniquePhysicalReferrers: number;
  secondOrderObject1Referrers: number;
  secondOrderWhitelistedObject1Referrers: number;
  structuredSitesWithWhitelistedObject1Referrer: number;
  chainClassHistogram: Record<MK1TwoHopChainClass, number>;
  hasAnyTwoHopChain: boolean;
  hasCodeFacingTwoHopEvidence: boolean;
  chainPaths: MK1TwoHopChainPath[];
}

/**
 * Summary for an individual first-hop reference site.
 */
export interface MK1FirstHopSiteSummary {
  siteId: string;
  sourceFileOffset: number;
  sourceFileOffsetHex: string;
  sourceRegionId: string;
  sourceObjectNumber: number | null;
  firstHopRole: MK1FirstHopX86Role;
  hasRepeatedStructureEvidence: boolean;
  associatedCandidateCount: number;
  associatedCandidateIds: string[];
  derivedRepresentations: SiteRepresentationDescriptor[];
  totalSecondOrderLogicalMatches: number;
  uniqueSecondOrderPhysicalReferrers: number;
  externalSecondOrderLogicalMatches: number;
  externalSecondOrderUniquePhysicalReferrers: number;
  selfOccurrenceCount: number;
  overlapOccurrenceCount: number;
  secondOrderByRepresentationKind: Record<SiteRepresentationKind, number>;
  secondOrderByReferrerRegion: Record<string, number>;
  secondOrderObject1ReferrerCount: number;
  secondOrderWhitelistedObject1ReferrerCount: number;
  secondOrderNegativeRelativeControlCount: number;
  secondOrderUnmatchedObject1Count: number;
  hasExternalSecondOrderReference: boolean;
  hasWhitelistedObject1SecondOrderReferrer: boolean;
}

/**
 * Referrer convergence group: multiple first-hop sites or candidates referenced by the same second-order physical referrer.
 */
export interface MK1ReferrerConvergenceGroup {
  groupId: string;
  secondOrderReferrerOffset: number;
  secondOrderReferrerOffsetHex: string;
  referrerRegionId: string;
  referrerRegionClass: string;
  referrerObjectNumber: number | null;
  referrerX86Role: MK1SecondOrderX86Role;
  referrerX86Shape: X86OperandShapeClass | null;
  siteIds: string[];
  candidateIds: string[];
  siteRepresentationKinds: SiteRepresentationKind[];
  candidateKanoCompatibilitySplit: {
    kanoCompatibleCount: number;
    nonCompatibleCount: number;
  };
  b5CandidateIds: string[];
}

/**
 * Representation kind analytical summary.
 */
export interface MK1RepresentationKindSummary {
  representationKind: SiteRepresentationKind;
  eligibleSiteCount: number;
  distinctValues: number;
  sitesWithExternalSecondOrderReferences: number;
  externalLogicalMatches: number;
  uniquePhysicalReferrerPositions: number;
  object1ReferrerCount: number;
  whitelistedObject1ReferrerCount: number;
}

/**
 * First-hop region × Second-order referrer region matrix cell.
 */
export interface MK1RegionReferrerMatrixCell {
  firstHopRegionId: string;
  referrerRegionId: string;
  logicalChainMatchCount: number;
  uniquePhysicalReferrerCount: number;
  distinctFirstHopSiteCount: number;
  distinctCandidateCount: number;
}

/**
 * Distribution across B.2 shape classes for second-order Object 1 referrers.
 */
export interface MK1SecondOrderX86ShapeSummary {
  shapeClassCounts: Record<X86OperandShapeClass, number>;
  shapeStatusCounts: Record<X86ShapeStatus, number>;
  totalObject1Referrers: number;
  positiveWhitelistedCount: number;
  negativeRelativeControlCount: number;
  unmatchedCount: number;
  ambiguousCount: number;
}

/**
 * Cohort direct vs indirect code-facing comparison entry.
 */
export interface MK1CohortDirectVsIndirectEntry {
  cohortName: string;
  totalCandidates: number;
  directCodeFacingOnly: number;
  twoHopCodeFacingOnly: number;
  both: number;
  neither: number;
}

/**
 * Global occurrence & reconciliation metrics.
 */
export interface MK1ReferenceChainGlobalSummary {
  firstHopPhysicalSitesInput: number;
  firstHopLogicalMatchesInput: number;
  firstHopSitesProcessed: number;
  firstHopSitesMissingB2Evidence: number;
  firstHopObject1Sites: number;
  firstHopWhitelistedObject1Sites: number;
  firstHopNegativeRelativeControlSites: number;
  firstHopUnmatchedObject1Sites: number;
  firstHopStructuredB3Sites: number;
  siteRepresentationDescriptorsGenerated: number;
  distinctSiteRepresentationValues: number;
  representationValuesWithMultipleSiteTargets: number;
  secondOrderLogicalMatches: number;
  secondOrderSelfOccurrenceCount: number;
  secondOrderOverlapOccurrenceCount: number;
  secondOrderExternalLogicalMatches: number;
  secondOrderUniquePhysicalReferrerPositions: number;
  secondOrderExternalUniquePhysicalReferrers: number;
  secondOrderObject1Referrers: number;
  secondOrderWhitelistedObject1Referrers: number;
  secondOrderNegativeRelativeControlReferrers: number;
  firstHopSitesWithExternalSecondOrderReference: number;
  firstHopSitesWithWhitelistedObject1SecondOrderReferrer: number;
  candidateCountWithAnyTwoHopChain: number;
  candidateCountWithCodeFacingTwoHopEvidence: number;
}

/**
 * Strict reconciliation audit result.
 */
export interface MK1ReferenceChainReconciliation {
  b1LogicalExternalMatchesInput: number;
  b2LogicalMatchesInput: number;
  logicalFirstHopMatchesReconcile: boolean;
  b1UniquePhysicalSitesInput: number;
  b2PhysicalSitesInput: number;
  physicalFirstHopSitesReconcile: boolean;
  firstHopSitesProcessed: number;
  firstHopSitesMissingCandidateAssociation: number;
  firstHopSitesWithUnknownRegion: number;
  siteRepresentationDescriptorsGenerated: number;
  secondOrderLogicalMatchesGenerated: number;
  secondOrderLogicalMatchesSummarized: number;
  secondOrderUniquePhysicalPositionsGenerated: number;
  secondOrderUniquePhysicalPositionsSummarized: number;
  allSecondOrderMatchesAccountedFor: boolean;
  controlFirstHopSitesInput: number;
  controlFirstHopSiteOffsets: number[];
  controlFirstHopSiteOffsetsHex: string[];
  candidateFirstHopSiteOffsets: number[];
  controlCandidatePhysicalSiteCollisions: number[];
  controlCandidateChainSummaryCollisions: string[];
  controlsInjectedIntoCandidateCounts: number;
  controlSitesExcludedFromCandidateCounts: boolean;
  allReconciled: boolean;
}

/**
 * Scan configuration details.
 */
export interface MK1ReferenceChainScanConfiguration {
  uintWidth: 32;
  endianness: 'little';
  alignment: 'byte-by-byte';
  scanStart: number;
  scanEnd: number;
  wholeFileScanCount: 1;
  siteRepresentationKinds: SiteRepresentationKind[];
}

/**
 * Compact summary of verified upstream passes.
 */
export interface MK1ReferenceChainUpstreamSummary {
  b1Available: boolean;
  b1Status: string;
  b1LogicalMatches: number;
  b1UniquePhysicalSites: number;
  b2Available: boolean;
  b2Status: string;
  b2ClassifiedPositions: number;
  b3Available: boolean;
  b3Status: string;
  b4Available: boolean;
  b4Status: string;
  b5Available: boolean;
  b5Status: string;
  b6Available: boolean;
  b6Status: string;
  b6CandidateCount: number;
  b6TrueB5ParticipantCount: number;
}

/**
 * Separate control chain summary for non-candidate controls (e.g. String Area Base).
 */
export interface MK1ControlChainSummary {
  controlName: string;
  sourceFileOffset: number;
  sourceFileOffsetHex: string;
  status: 'evaluated' | 'not-applicable-no-first-hop-reference';
  firstHopCount: number;
  derivedRepresentations: SiteRepresentationDescriptor[];
  secondOrderLogicalMatches: number;
  secondOrderPhysicalReferrers: number;
  secondOrderObject1Referrers: number;
  secondOrderWhitelistedObject1Referrers: number;
  occurrences: MK1SecondOrderOccurrence[];
}

/**
 * Master result object for Pass 1E.2B.7a.
 */
export interface MK1PaletteReferenceChainReconResult {
  format: 'mk1_palette_reference_chain_recon_v1';
  milestone: '1E.2B.7a';
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string;
  timestamp: string;
  exePath: string;
  exeSize: number;
  scanConfiguration: MK1ReferenceChainScanConfiguration;
  upstreamSummary: MK1ReferenceChainUpstreamSummary;
  globalSummary: MK1ReferenceChainGlobalSummary;
  reconciliation: MK1ReferenceChainReconciliation;
  representationSummary: MK1RepresentationKindSummary[];
  firstHopRoleSummary: Record<MK1FirstHopX86Role, number>;
  secondOrderRoleSummary: Record<MK1SecondOrderX86Role, number>;
  regionMatrix: MK1RegionReferrerMatrixCell[];
  secondOrderX86ShapeSummary: MK1SecondOrderX86ShapeSummary;
  cohortComparison: MK1CohortDirectVsIndirectEntry[];
  candidateChainSummaries: MK1CandidateChainSummary[];
  firstHopSiteSummaries: MK1FirstHopSiteSummary[];
  firstHopSites: MK1PaletteFirstHopReferenceSite[];
  uniquePhysicalReferrers: MK1SecondOrderPhysicalReferrer[];
  convergenceGroups: MK1ReferrerConvergenceGroup[];
  controls: MK1ControlChainSummary[];
  detailCap: number;
  secondOrderDetailsIncluded: number;
  secondOrderDetailsOmitted: number;
  chainDetailsGenerated: number;
  chainDetailsIncluded: number;
  chainDetailsOmitted: number;
  sitesWithTruncatedDetails: number;
  boundedDetailedSecondOrderOccurrences: MK1SecondOrderOccurrence[];
  boundedDetailedChains: MK1TwoHopChainPath[];
  interpretationCaveats: string[];
}

/**
 * Export envelope structure.
 */
export interface MK1PaletteReferenceChainExport {
  format: 'mk1_palette_reference_chain_recon_v1';
  milestone: '1E.2B.7a';
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string;
  timestamp: string;
  exePath: string;
  exeSize: number;
  scanConfiguration: MK1ReferenceChainScanConfiguration;
  upstreamSummary: MK1ReferenceChainUpstreamSummary;
  globalSummary: MK1ReferenceChainGlobalSummary;
  reconciliation: MK1ReferenceChainReconciliation;
  representationSummary: MK1RepresentationKindSummary[];
  firstHopRoleSummary: Record<MK1FirstHopX86Role, number>;
  secondOrderRoleSummary: Record<MK1SecondOrderX86Role, number>;
  regionMatrix: MK1RegionReferrerMatrixCell[];
  secondOrderX86ShapeSummary: MK1SecondOrderX86ShapeSummary;
  cohortComparison: MK1CohortDirectVsIndirectEntry[];
  candidateChainSummaries: Omit<MK1CandidateChainSummary, 'chainPaths'>[];
  firstHopSiteSummaries: MK1FirstHopSiteSummary[];
  convergenceGroups: MK1ReferrerConvergenceGroup[];
  controls: MK1ControlChainSummary[];
  detailCap: number;
  secondOrderDetailsIncluded: number;
  secondOrderDetailsOmitted: number;
  chainDetailsGenerated: number;
  chainDetailsIncluded: number;
  chainDetailsOmitted: number;
  sitesWithTruncatedDetails: number;
  boundedDetailedSecondOrderOccurrences: MK1SecondOrderOccurrence[];
  boundedDetailedChains: MK1TwoHopChainPath[];
  interpretationCaveats: string[];
}
