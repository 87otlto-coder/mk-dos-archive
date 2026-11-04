import { describe, expect, it } from 'vitest';
import {
  classifyOperandSemanticClass,
  evaluateDirectLinearResolution,
  evaluateObjectRelativeCompatibility,
  traceStraightLineSeedUse,
  executePaletteOperandUseReconnaissance,
  createMK1PaletteOperandUseExport,
} from '../games/mk1/research/paletteOperandUseReconnaissance';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import {
  LEHeader,
  LEObjectEntry,
  LEPageMapEntry,
} from '../core/executable/le/leTypes';
import {
  MK1PaletteOccurrenceContextResult,
  PhysicalPositionContextClassification,
  X86ShapeMatchDetails,
} from '../games/mk1/research/paletteOccurrenceContextTypes';
import {
  MK1PaletteCandidateEvidenceFusionResult,
  MK1PaletteCandidateEvidenceProfile,
} from '../games/mk1/research/paletteCandidateEvidenceFusionTypes';
import {
  MK1PaletteReferenceChainReconResult,
  MK1SecondOrderPhysicalReferrer,
} from '../games/mk1/research/paletteReferenceChainReconnaissanceTypes';

function toHex32(n: number): string {
  return '0x' + (n >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

function createMockReport(overrides?: Partial<MK1ExecutableLayoutReport>): MK1ExecutableLayoutReport {
  const parsedHeader: LEHeader = {
    signature: 'LE',
    byteOrder: 0,
    wordOrder: 0,
    formatLevel: 0,
    cpuType: 1,
    cpuTypeDescription: 'i386',
    targetOs: 1,
    targetOsDescription: 'DOS',
    moduleVersion: 0,
    moduleFlags: 0,
    modulePageCount: 112,
    entryObject: 1,
    entryEip: 0x1000,
    entryEipHex: '0x00001000',
    stackObject: 2,
    stackEsp: 0x8000,
    stackEspHex: '0x00008000',
    pageSize: 4096,
    bytesOnLastPage: 4096,
    fixupSectionSize: 0,
    loaderSectionSize: 0,
    objectTableRelativeOffset: 0,
    objectTableFileOffset: 0,
    objectCount: 2,
    objectPageMapRelativeOffset: 0,
    objectPageMapFileOffset: 0,
    residentNameTableRelativeOffset: 0,
    residentNameTableFileOffset: 0,
    entryTableRelativeOffset: 0,
    entryTableFileOffset: 0,
    fixupPageTableRelativeOffset: 0,
    fixupPageTableFileOffset: 0,
    fixupRecordTableRelativeOffset: 0,
    fixupRecordTableFileOffset: 0,
    importModuleTableRelativeOffset: 0,
    importModuleTableFileOffset: 0,
    importModuleCount: 0,
    importProcedureTableRelativeOffset: 0,
    importProcedureTableFileOffset: 0,
    dataPagesFileOffset: 0x1000,
    preloadPageCount: 0,
    nonResidentNameTableFileOffset: 0,
    nonResidentNameTableLength: 0,
    autoDataObject: 0,
    debugInfoFileOffset: 0,
    debugInfoLength: 0,
    heapSize: 0,
  };

  const obj1: LEObjectEntry = {
    objectNumber: 1,
    virtualSize: 0x50000,
    virtualSizeHex: '0x00050000',
    relocationBaseAddress: 0x00010000,
    relocationBaseAddressHex: '0x00010000',
    rawFlags: 0x2045,
    flags: {
      readable: true,
      writable: false,
      executable: true,
      resource: false,
      discardable: false,
      shared: false,
      preload: true,
      invalid: false,
      swappable: false,
      resident: true,
      big32Bit: true,
    },
    pageMapIndex: 1,
    pageMapEntryCount: 80,
    capabilities: 'R-X / 32-bit',
    roleEvidence: 'executable-code-like',
    physicalSpans: [
      {
        fileStart: 0x0,
        fileEnd: 0x50000,
        byteLength: 0x50000,
        objectPageStart: 0,
        pageCount: 80,
      },
    ],
    mappedPageCount: 80,
    zeroFilledPageCount: 0,
  };

  const obj2: LEObjectEntry = {
    objectNumber: 2,
    virtualSize: 0x20000,
    virtualSizeHex: '0x00020000',
    relocationBaseAddress: 0x00060000,
    relocationBaseAddressHex: '0x00060000',
    rawFlags: 0x2043,
    flags: {
      readable: true,
      writable: true,
      executable: false,
      resource: false,
      discardable: false,
      shared: false,
      preload: true,
      invalid: false,
      swappable: false,
      resident: true,
      big32Bit: true,
    },
    pageMapIndex: 81,
    pageMapEntryCount: 32,
    capabilities: 'RW- / 32-bit',
    roleEvidence: 'read-write-data-like',
    physicalSpans: [
      {
        fileStart: 0x50000,
        fileEnd: 0x70000,
        byteLength: 0x20000,
        objectPageStart: 0,
        pageCount: 32,
      },
    ],
    mappedPageCount: 32,
    zeroFilledPageCount: 0,
  };

  const pageMap: LEPageMapEntry[] = Array.from({ length: 112 }, (_, i) => ({
    pageMapIndex: i + 1,
    physicalPageNumber: i + 1,
    rawBytes: [0, 0, 0],
    rawFlags: 0,
    pageType: 'valid',
    physicalFileStart: 0x1000 + i * 4096,
    physicalByteLength: 4096,
  }));

  return {
    timestamp: '2026-09-10T00:00:00.000Z',
    exePath: 'MK1.EXE',
    exeSize: 1157222,
    boundLayout: {
      mzWrapper: {
        mzHeaderOffset: 0,
        mzExtendedHeaderOffset: 0x40,
        mzExtendedHeaderOffsetHex: '0x00000040',
        eLfanewDiscrepancy: false,
        eLfanewNote: 'Standard MZ wrapper',
      },
      rawLeOccurrencesCount: 1,
      rawLeOccurrences: [],
      selectedPayloadCandidate: null,
    },
    parsedHeader,
    objects: [obj1, obj2],
    objectBackingSummary: [
      {
        objectNumber: 1,
        virtualSize: 0x50000,
        virtualSizeHex: '0x00050000',
        pageMapEntryCount: 80,
        mappedPageCount: 80,
        explicitZeroFilledPageCount: 0,
        rawFileBackedPageBytes: 0x50000,
        rawFileBackedPageBytesHex: '0x00050000',
        addressableFileBackedBytes: 0x50000,
        addressableFileBackedBytesHex: '0x00050000',
        physicalPagePaddingBytes: 0,
        physicalPagePaddingBytesHex: '0x00000000',
        virtualBytesWithoutFileBacking: 0,
        virtualBytesWithoutFileBackingHex: '0x00000000',
      },
      {
        objectNumber: 2,
        virtualSize: 0x20000,
        virtualSizeHex: '0x00020000',
        pageMapEntryCount: 32,
        mappedPageCount: 32,
        explicitZeroFilledPageCount: 0,
        rawFileBackedPageBytes: 0x20000,
        rawFileBackedPageBytesHex: '0x00020000',
        addressableFileBackedBytes: 0x20000,
        addressableFileBackedBytesHex: '0x00020000',
        physicalPagePaddingBytes: 0,
        physicalPagePaddingBytesHex: '0x00000000',
        virtualBytesWithoutFileBacking: 0,
        virtualBytesWithoutFileBackingHex: '0x00000000',
      },
    ],
    pageMap,
    pageMapDiagnostics: {
      totalEntries: 112,
      validEntries: 112,
      mappedValidEntries: 112,
      iteratedEntries: 0,
      invalidEntries: 0,
      zeroFilledEntries: 0,
      rangeEntries: 0,
      unknownEntries: 0,
      minDecodedPhysicalPageNumber: 1,
      maxDecodedPhysicalPageNumber: 112,
      entries: [],
    },
    topology: {
      totalFileSize: 1157222,
      totalFileSizeHex: '0x0011A866',
      boundaries: {
        highestFileBackedPageEnd: 0x70000,
        highestFileBackedPageEndHex: '0x00070000',
        headerDerivedPageDataEnd: 0x70000,
        headerDerivedPageDataEndHex: '0x00070000',
        discrepancyBytes: 0,
        discrepancyExplanation: 'None',
      },
      postModuleTail: {
        startOffset: 0x70000,
        startOffsetHex: '0x00070000',
        endOffset: 1157222,
        endOffsetHex: '0x0011A866',
        byteLength: 1157222 - 0x70000,
        percentageOfTotalExecutable: 60,
        containedAnchorNames: [],
        purpose: 'UNKNOWN',
        notes: '',
      },
      regions: [
        {
          regionId: 'obj_1_code',
          regionClass: 'le-object-file-backed',
          name: 'Object 1 Code',
          fileStart: 0x0,
          fileStartHex: '0x00000000',
          fileEnd: 0x50000,
          fileEndHex: '0x00050000',
          byteLength: 0x50000,
          percentageOfFile: 30,
          objectNumber: 1,
          purpose: 'code',
          notes: '',
        },
        {
          regionId: 'obj_2_data',
          regionClass: 'le-object-file-backed',
          name: 'Object 2 Data',
          fileStart: 0x50000,
          fileStartHex: '0x00050000',
          fileEnd: 0x70000,
          fileEndHex: '0x00070000',
          byteLength: 0x20000,
          percentageOfFile: 10,
          objectNumber: 2,
          purpose: 'data',
          notes: '',
        },
      ],
      gapCount: 0,
      totalGapBytes: 0,
    },
    validation: null,
    debugInfo: {
      debugInfoFileOffset: 0,
      debugInfoFileOffsetHex: '0x00000000',
      debugInfoLength: 0,
      debugInfoPresent: false,
      notes: '',
      status: 'UNKNOWN',
    },
    knownAnchors: [],
    ...overrides,
  };
}

function createMockCandidateProfile(
  candidateId = 'cand-0',
  byteStart = 0x2000,
  targetObjectNumber = 1,
  targetLoadedAddress = 0x00012000,
  targetLoadedPayloadAddress = 0x00012002,
): MK1PaletteCandidateEvidenceProfile {
  return {
    candidateId,
    provenance: {
      contentHash: `hash_${candidateId}`,
      duplicateCount: 0,
      sameContentResearchCandidateCount: 0,
      duplicateLocationCountWithinResearchUniverse: 0,
      isContentDuplicate: false,
      tier: 'T1',
      researchScore: 100,
    },
    intrinsic: {
      byteStart,
      byteStartHex: toHex32(byteStart),
      byteEnd: byteStart + 32,
      byteEndHex: toHex32(byteStart + 32),
      length: 32,
      structureByteLength: 32,
      payloadByteLength: 32,
      uniqueColorCount: 16,
      uniqueColorRatio: 0.5,
      textLikeScore: 0,
      containsLikelyAsciiData: false,
      isVeryShortCandidate: false,
      zeroShiftKanoCompatible: true,
      zeroShiftCoverageMargin: 0,
    },
    topology: {
      targetRegionId: `object-${targetObjectNumber}`,
      targetRegionClass: 'LOADED_CODE',
      targetObjectNumber,
      targetObjectFlags: 'R-X',
      targetObjectReadable: true,
      targetObjectWritable: false,
      targetObjectExecutable: true,
      targetPhysicallyInFile: true,
      targetFileBacked: true,
      targetInLEObjectFileBackedData: true,
      targetInPhysicalPagePadding: false,
      targetInPostModuleTail: false,
      targetLoadedAddress,
      targetLoadedAddressHex: targetLoadedAddress !== null ? toHex32(targetLoadedAddress) : null,
      targetLoadedPayloadAddress,
      targetLoadedPayloadAddressHex: targetLoadedPayloadAddress !== null ? toHex32(targetLoadedPayloadAddress) : null,
      targetInExecutableObject: true,
      targetInWritableObject: false,
    },
    exactReference: {
      totalLogicalMatches: 1,
      totalUniquePhysicalOccurrences: 1,
      selfOccurrenceCount: 0,
      externalOccurrenceCount: 1,
      externalByRepresentation: {
        'physical-structure-start': 0,
        'physical-payload-start': 0,
        'object-relative-structure': 1,
        'object-relative-payload': 0,
        'linear-structure-address': 0,
        'linear-payload-address': 0,
      },
      externalBySourceRegion: {},
      firstOccurrenceOffset: 0x1000,
      firstOccurrenceOffsetHex: '0x00001000',
      lastOccurrenceOffset: 0x1000,
      lastOccurrenceOffsetHex: '0x00001000',
      detailsTruncated: false,
      physicalDerivedReferenceCount: 0,
      objectRelativeDerivedReferenceCount: 1,
      linearAddressDerivedReferenceCount: 0,
      addressDerivedReferenceCount: 1,
      referenceProfile: 'address-derived-only',
      addressDerivedReferenceFraction: 1,
      physicalDerivedReferenceFraction: 0,
    },
    b2Context: null,
    b3Structure: null,
    b4Cycle: null,
    b5Harmonic: null,
    structureDepth: 'b1-external-reference',
    mechanicalFlags: {
      hasExternalReferences: true,
      hasAddressDerivedReferences: true,
      hasPhysicalDerivedReferences: false,
      hasStructuredReferenceEvidence: false,
      hasB5HarmonicEvidence: false,
      isVeryShortCandidate: false,
      zeroShiftKanoCompatible: true,
      targetInExecutableObject: true,
      targetInWritableObject: false,
    },
    tensionFlags: {
      referenceActiveIntrinsicWeak: false,
      referenceActiveKanoCompatible: false,
      referenceInactiveKanoCompatible: false,
      shortCandidateAddressActive: false,
      executableTargetAddressActive: false,
      writableTargetKanoCompatible: false,
      strongCatalogueNoReference: false,
      weakForCurrentKanoPaletteHypothesis: false,
      strongForCurrentKanoPaletteHypothesis: false,
    },
  };
}

function createMockContextResult(
  classifiedPositions: PhysicalPositionContextClassification[] = [],
  status: 'SUCCESS' | 'FAILED' = 'SUCCESS',
): MK1PaletteOccurrenceContextResult {
  return {
    status,
    metadata: {
      operationId: 'test-context-op',
      timestamp: '2026-09-08T00:00:00.000Z',
      durationMs: 1,
      milestone: '1E.2B.2',
    },
    fixture: {
      exePath: 'MK1.EXE',
      exeSize: 1157222,
      exeSizeHex: '0x0011A866',
    },
    sourceReconSummary: {
      totalInputCandidates: 1,
      totalLogicalExternalMatches: classifiedPositions.length,
      uniqueExternalPhysicalPositions: classifiedPositions.length,
    },
    scanConfiguration: {
      trackASourceScope: 'object-1',
      candidateStartLookbehindBytes: 15,
      clusterMaxStartOffsetDelta: 64,
      clusterMinimumPositions: 3,
      positiveShapeWhitelist: ['mov-r32-imm32'],
      relativeNegativeShapes: [],
      SIBSupport: true,
    },
    reconciliation: {
      b1ExternalLogicalMatchInputCount: classifiedPositions.length,
      b2LogicalMatchesAccountedFor: classifiedPositions.length,
      logicalMatchesReconcile: true,
      b1UniquePhysicalPositionInputCount: classifiedPositions.length,
      b2UniquePhysicalPositionsAccountedFor: classifiedPositions.length,
      physicalPositionsReconcile: true,
      object1TrackAExpectedPositions: classifiedPositions.length,
      object1TrackAAnalyzedPositions: classifiedPositions.length,
      object1TrackAReconciles: true,
      trackBExpectedPositions: classifiedPositions.length,
      trackBAnalyzedPositions: classifiedPositions.length,
      trackBReconciles: true,
      clusteredPositions: 0,
      unclusteredPositions: classifiedPositions.length,
      clusterMembershipReconciles: true,
      allReconciled: true,
      truncationOmittedCount: 0,
    },
    trackA: {
      eligibleObject1Positions: classifiedPositions.length,
      eligibleObject1LogicalMatches: classifiedPositions.length,
      whitelistedShapePositions: classifiedPositions.length,
      negativeContextPositions: 0,
      unmatchedShapePositions: 0,
      ambiguousPrefixPositions: 0,
      singleWhitelistedShapePositions: classifiedPositions.length,
      multipleWhitelistedShapePositions: 0,
      percentageWhitelisted: 100,
      percentageNegativeContext: 0,
      percentageUnmatched: 0,
      shapeDistribution: [],
    },
    trackB: {
      totalPositionsAnalyzed: classifiedPositions.length,
      totalClustersIdentified: 0,
      clusteredPositionsCount: 0,
      isolatedPositionsCount: classifiedPositions.length,
      percentageClustered: 0,
      clusteringRule: 'max-delta-64',
      clusters: [],
      regularStrideClustersCount: 0,
      clustersByRegion: {},
    },
    candidateContextSummaries: [],
    knownAnchorControlContext: [],
    classifiedPositions,
    negativeControl: {
      candidateId: 'MK1.EXE:0x0009C914',
      expectedZeroOccurrences: true,
      actualOccurrencesB1: 0,
      actualOccurrencesB2: 0,
      status: 'CONFIRMED_ZERO_OCCURRENCES',
      notes: 'Confirmed negative control',
    },
  };
}

function createMockFusionResult(
  profiles: MK1PaletteCandidateEvidenceProfile[] = [],
  status: 'SUCCESS' | 'FAILED' = 'SUCCESS',
): MK1PaletteCandidateEvidenceFusionResult {
  return {
    status,
    metadata: {
      operationId: 'test-fusion-op',
      timestamp: '2026-09-08T00:00:00.000Z',
      durationMs: 1,
      milestone: '1E.2B.6b',
    },
    fixture: {
      exePath: 'MK1.EXE',
      exeSize: 1157222,
    },
    upstreamAvailability: {
      catalogueAvailable: true,
      catalogueResearchCandidatesCount: profiles.length,
      b1Available: true,
      b1CandidateSummariesCount: profiles.length,
      b2Available: true,
      b2ClustersCount: 0,
      b3Available: false,
      b3RepeatedGroupsCount: null,
      b4Available: false,
      b4PhysicalPopulationsCount: null,
      b5Available: false,
      b5PhysicalPopulationsCount: null,
    },
    predicateDefinitions: {
      weakForCurrentKanoPaletteHypothesis: '',
      strongForCurrentKanoPaletteHypothesis: '',
      structureDepthLevels: {
        none: '',
        'b1-external-reference': '',
        'b2-context': '',
        'b3-repeated-structure': '',
        'b4-cycle-layout': '',
        'b5-harmonic-structure': '',
      },
      tensionFlags: {
        referenceActiveIntrinsicWeak: '',
        referenceActiveKanoCompatible: '',
        referenceInactiveKanoCompatible: '',
        shortCandidateAddressActive: '',
        executableTargetAddressActive: '',
        writableTargetKanoCompatible: '',
        strongCatalogueNoReference: '',
        weakForCurrentKanoPaletteHypothesis: '',
        strongForCurrentKanoPaletteHypothesis: '',
      },
      mechanicalFlags: {
        hasExternalReferences: '',
        hasAddressDerivedReferences: '',
        hasPhysicalDerivedReferences: '',
        hasStructuredReferenceEvidence: '',
        hasB5HarmonicEvidence: '',
        isVeryShortCandidate: '',
        zeroShiftKanoCompatible: '',
        targetInExecutableObject: '',
        targetInWritableObject: '',
      },
    },
    reconciliation: {
      researchCandidatesInput: profiles.length,
      b1CandidateSummariesInput: profiles.length,
      candidateProfilesProduced: profiles.length,
      candidateProfilesMissingCatalogueEvidence: [],
      candidateProfilesMissingB1Evidence: [],
      duplicateCatalogueCandidateIds: [],
      duplicateB1CandidateIds: [],
      duplicateCandidateIds: [],
      catalogueB1FieldMismatchIds: [],
      unexpectedUpstreamCandidateIds: [],
      allCandidatesAccountedFor: true,
    },
    globalCohortSummary: {
      kanoCompatible_noExternalReference: 0,
      kanoCompatible_externalReference: profiles.length,
      notKanoCompatible_noExternalReference: 0,
      notKanoCompatible_externalReference: 0,
      veryShort_externalReference: 0,
      veryShort_addressDerivedReference: 0,
      object1Target_externalReference: profiles.length,
      object2Target_externalReference: 0,
      object1Target_kanoCompatible: profiles.length,
      object2Target_kanoCompatible: 0,
      b5Participation_kanoCompatible: null,
      b5Participation_notKanoCompatible: null,
    },
    lengthHistograms: {
      allCandidates: { bucketCounts: { '2': 0, '3': 0, '4-7': 0, '8-15': 0, '16-23': 0, '24-31': 0, '32-63': 0, '64+': 0 }, totalCount: 0 },
      referenceActiveCandidates: { bucketCounts: { '2': 0, '3': 0, '4-7': 0, '8-15': 0, '16-23': 0, '24-31': 0, '32-63': 0, '64+': 0 }, totalCount: 0 },
      noReferenceCandidates: { bucketCounts: { '2': 0, '3': 0, '4-7': 0, '8-15': 0, '16-23': 0, '24-31': 0, '32-63': 0, '64+': 0 }, totalCount: 0 },
      addressDerivedActiveCandidates: { bucketCounts: { '2': 0, '3': 0, '4-7': 0, '8-15': 0, '16-23': 0, '24-31': 0, '32-63': 0, '64+': 0 }, totalCount: 0 },
      kanoCompatibleCandidates: { bucketCounts: { '2': 0, '3': 0, '4-7': 0, '8-15': 0, '16-23': 0, '24-31': 0, '32-63': 0, '64+': 0 }, totalCount: 0 },
    },
    targetRegionMatrix: [],
    representationMatrix: [],
    structureParticipationMatrix: [],
    candidateProfiles: profiles,
    controlsAudit: {
      controlTargetsInputCount: 0,
      controlCandidateIdCollisions: [],
      controlPhysicalOffsetCollisions: [],
      controlsExcludedFromProfiles: true,
      excludedControlNames: [],
    },
    interpretationCaveats: [],
  };
}

function createMockChainResult(
  referrers: MK1SecondOrderPhysicalReferrer[] = [],
  status: 'SUCCESS' | 'FAILED' = 'SUCCESS',
): MK1PaletteReferenceChainReconResult {
  return {
    format: 'mk1_palette_reference_chain_recon_v1',
    milestone: '1E.2B.7a',
    status,
    timestamp: '2026-09-08T00:00:00.000Z',
    exePath: 'MK1.EXE',
    exeSize: 1157222,
    scanConfiguration: {
      uintWidth: 32,
      endianness: 'little',
      alignment: 'byte-by-byte',
      scanStart: 0,
      scanEnd: 1157222,
      wholeFileScanCount: 1,
      siteRepresentationKinds: ['linear-site-address', 'object-relative-site-offset', 'physical-site-offset'],
    },
    upstreamSummary: {
      b1Available: true,
      b1Status: 'SUCCESS',
      b1LogicalMatches: 1,
      b1UniquePhysicalSites: 1,
      b2Available: true,
      b2Status: 'SUCCESS',
      b2ClassifiedPositions: 1,
      b3Available: false,
      b3Status: 'NOT_RUN',
      b4Available: false,
      b4Status: 'NOT_RUN',
      b5Available: false,
      b5Status: 'NOT_RUN',
      b6Available: true,
      b6Status: 'SUCCESS',
      b6CandidateCount: 1,
      b6TrueB5ParticipantCount: 0,
    },
    globalSummary: {
      firstHopPhysicalSitesInput: 1,
      firstHopLogicalMatchesInput: 1,
      firstHopSitesProcessed: 1,
      firstHopSitesMissingB2Evidence: 0,
      firstHopObject1Sites: 1,
      firstHopWhitelistedObject1Sites: 1,
      firstHopNegativeRelativeControlSites: 0,
      firstHopUnmatchedObject1Sites: 0,
      firstHopStructuredB3Sites: 0,
      siteRepresentationDescriptorsGenerated: 1,
      distinctSiteRepresentationValues: 1,
      representationValuesWithMultipleSiteTargets: 0,
      secondOrderLogicalMatches: referrers.length,
      secondOrderSelfOccurrenceCount: 0,
      secondOrderOverlapOccurrenceCount: 0,
      secondOrderExternalLogicalMatches: referrers.length,
      secondOrderUniquePhysicalReferrerPositions: referrers.length,
      secondOrderExternalUniquePhysicalReferrers: referrers.length,
      secondOrderObject1Referrers: referrers.length,
      secondOrderWhitelistedObject1Referrers: referrers.length,
      secondOrderNegativeRelativeControlReferrers: 0,
      firstHopSitesWithExternalSecondOrderReference: referrers.length > 0 ? 1 : 0,
      firstHopSitesWithWhitelistedObject1SecondOrderReferrer: referrers.length > 0 ? 1 : 0,
      candidateCountWithAnyTwoHopChain: referrers.length > 0 ? 1 : 0,
      candidateCountWithCodeFacingTwoHopEvidence: referrers.length > 0 ? 1 : 0,
    },
    reconciliation: {
      b1LogicalExternalMatchesInput: 1,
      b2LogicalMatchesInput: 1,
      logicalFirstHopMatchesReconcile: true,
      b1UniquePhysicalSitesInput: 1,
      b2PhysicalSitesInput: 1,
      physicalFirstHopSitesReconcile: true,
      firstHopSitesProcessed: 1,
      firstHopSitesMissingCandidateAssociation: 0,
      firstHopSitesWithUnknownRegion: 0,
      siteRepresentationDescriptorsGenerated: 1,
      secondOrderLogicalMatchesGenerated: referrers.length,
      secondOrderLogicalMatchesSummarized: referrers.length,
      secondOrderUniquePhysicalPositionsGenerated: referrers.length,
      secondOrderUniquePhysicalPositionsSummarized: referrers.length,
      allSecondOrderMatchesAccountedFor: true,
      controlFirstHopSitesInput: 0,
      controlFirstHopSiteOffsets: [],
      controlFirstHopSiteOffsetsHex: [],
      candidateFirstHopSiteOffsets: [0x1000],
      controlCandidatePhysicalSiteCollisions: [],
      controlCandidateChainSummaryCollisions: [],
      controlsInjectedIntoCandidateCounts: 0,
      controlSitesExcludedFromCandidateCounts: true,
      allReconciled: true,
    },
    representationSummary: [],
    firstHopRoleSummary: {
      'whitelisted-object1-operand-site': 1,
      'relative-control-negative-site': 0,
      'object1-unmatched-site': 0,
      'object1-ambiguous-site': 0,
      'non-object1-reference-site': 0,
    },
    secondOrderRoleSummary: {
      'whitelisted-object1-operand-referrer': referrers.length,
      'relative-control-negative-referrer': 0,
      'object1-unmatched-referrer': 0,
      'object1-ambiguous-referrer': 0,
      'non-object1-referrer': 0,
    },
    regionMatrix: [],
    secondOrderX86ShapeSummary: {
      shapeClassCounts: {
        'mov-r32-imm32': referrers.length,
        'disp32-absolute': 0,
        'moffs32-direct': 0,
        'accumulator-imm32': 0,
        'push-imm32': 0,
        'negative-rel32': 0,
        'unmatched-shape': 0,
      },
      shapeStatusCounts: {
        'single-whitelisted-shape': referrers.length,
        'no-whitelisted-shape': 0,
        'multiple-whitelisted-shapes': 0,
        'relative-control-field-shape': 0,
        'ambiguous-prefix-context': 0,
      },
      totalObject1Referrers: referrers.length,
      positiveWhitelistedCount: referrers.length,
      negativeRelativeControlCount: 0,
      unmatchedCount: 0,
      ambiguousCount: 0,
    },
    cohortComparison: [],
    candidateChainSummaries: [],
    firstHopSiteSummaries: [],
    firstHopSites: [],
    uniquePhysicalReferrers: referrers,
    convergenceGroups: [],
    controls: [],
    detailCap: 500,
    secondOrderDetailsIncluded: referrers.length,
    secondOrderDetailsOmitted: 0,
    chainDetailsGenerated: referrers.length,
    chainDetailsIncluded: referrers.length,
    chainDetailsOmitted: 0,
    sitesWithTruncatedDetails: 0,
    boundedDetailedSecondOrderOccurrences: [],
    boundedDetailedChains: [],
    interpretationCaveats: [],
  };
}

describe('Milestone 1E.2B.8 - Operand Address-Space Compatibility & Bounded Straight-Line Seed-Use Reconnaissance', () => {
  const mockReport = createMockReport();

  describe('Operand Semantic Classification', () => {
    it('classifies MOV r32, imm32 as register-immediate-seed', () => {
      // 0xB8 = MOV EAX, imm32
      const buf = new Uint8Array([0xb8, 0x00, 0x20, 0x00, 0x00]);
      const res = classifyOperandSemanticClass('mov-r32-imm32', 'B8', 0, buf);
      expect(res.semanticClass).toBe('register-immediate-seed');
      expect(res.destinationRegister).toBe('EAX');
      expect(res.dereferenceShapePresent).toBe(false);
    });

    it('classifies PUSH imm32 as push-immediate-value', () => {
      const buf = new Uint8Array([0x68, 0x00, 0x20, 0x00, 0x00]);
      const res = classifyOperandSemanticClass('push-imm32', '68', 0, buf);
      expect(res.semanticClass).toBe('push-immediate-value');
      expect(res.destinationRegister).toBeNull();
      expect(res.dereferenceShapePresent).toBe(false);
    });

    it('classifies accumulator-imm32 as accumulator-arithmetic-immediate', () => {
      const buf = new Uint8Array([0x05, 0x00, 0x20, 0x00, 0x00]);
      const res = classifyOperandSemanticClass('accumulator-imm32', '05', 0, buf);
      expect(res.semanticClass).toBe('accumulator-arithmetic-immediate');
      expect(res.destinationRegister).toBe('EAX');
    });

    it('classifies moffs32 load as direct-memory-load-address', () => {
      const buf = new Uint8Array([0xa1, 0x00, 0x20, 0x00, 0x00]);
      const res = classifyOperandSemanticClass('moffs32-direct', 'A1', 0, buf);
      expect(res.semanticClass).toBe('direct-memory-load-address');
      expect(res.destinationRegister).toBe('EAX');
      expect(res.dereferenceShapePresent).toBe(true);
    });

    it('classifies moffs32 store as direct-memory-store-address', () => {
      const buf = new Uint8Array([0xa3, 0x00, 0x20, 0x00, 0x00]);
      const res = classifyOperandSemanticClass('moffs32-direct', 'A3', 0, buf);
      expect(res.semanticClass).toBe('direct-memory-store-address');
      expect(res.destinationRegister).toBeNull();
      expect(res.dereferenceShapePresent).toBe(true);
    });

    it('classifies LEA disp32 as lea-address-computation', () => {
      // 8D 05 [disp32] = LEA EAX, [disp32]
      const buf = new Uint8Array([0x8d, 0x05, 0x00, 0x20, 0x00, 0x00]);
      const res = classifyOperandSemanticClass('disp32-absolute', '8D05', 0, buf);
      expect(res.semanticClass).toBe('lea-address-computation');
      expect(res.destinationRegister).toBe('EAX');
    });
  });

  describe('Address-Space Compatibility', () => {
    it('evaluates direct linear resolution correctly for values inside loaded object ranges', () => {
      // 0x00012000 is inside Object 1 (relocBase 0x00010000..0x00060000)
      const res = evaluateDirectLinearResolution(
        0x00012000,
        'direct-memory-load-address',
        false,
        mockReport,
        undefined,
      );
      expect(res.resolutionClass).toBe('resolves-other-loaded-location');
      expect(res.resolvedObjectNumber).toBe(1);
      expect(res.resolvedObjectOffset).toBe(0x2000);
      expect(res.resolvedObjectOffsetHex).toBe('0x00002000');
    });

    it('returns not-applicable for non-address semantic operands', () => {
      const res = evaluateDirectLinearResolution(
        0x00012000,
        'register-immediate-seed',
        false,
        mockReport,
        undefined,
      );
      expect(res.resolutionClass).toBe('not-applicable-non-address-operand');
    });

    it('evaluates linear-address-unmapped for values outside all objects', () => {
      const res = evaluateDirectLinearResolution(
        0x00090000,
        'direct-memory-load-address',
        false,
        mockReport,
        undefined,
      );
      expect(res.resolutionClass).toBe('linear-address-unmapped');
    });

    it('evaluates object-relative compatibility and required base', () => {
      const candidateProfile = createMockCandidateProfile('cand-0', 0x2000, 1, 0x00012000, 0x00012002);

      const res = evaluateObjectRelativeCompatibility(
        0x00002000,
        'object-relative-structure',
        candidateProfile,
        mockReport,
      );
      expect(res.isObjectRelativeOperand).toBe(true);
      expect(res.targetObjectRelocationBase).toBe(0x00010000);
      expect(res.requiredBaseToReachTargetLoadedAddress).toBe(0x00010000);
      expect(res.requiredBaseEqualsTargetObjectRelocationBase).toBe(true);
      expect(res.equalsAssociatedObjectRelativeStructure).toBe(true);
    });
  });

  describe('Straight-Line Micro-Decoder & Tracer', () => {
    it('traces straight-line register copy, affine adjustment, and CALL boundary', () => {
      const buf = new Uint8Array([
        0xb8, 0x00, 0x20, 0x00, 0x00, // MOV EAX, 0x00002000
        0x8b, 0xd0,                   // MOV EDX, EAX
        0x42,                         // INC EDX
        0xe8, 0x10, 0x00, 0x00, 0x00, // CALL rel32
      ]);

      const trace = traceStraightLineSeedUse(
        buf,
        1,
        0,
        5,
        'MOV EAX, 0x00002000',
        'EAX',
        0x00002000,
        undefined,
        mockReport,
      );

      expect(trace.stopReason).toBe('call-boundary');
      expect(trace.seedLiveAtBoundary).toBe(true);
      expect(trace.boundaryType).toBe('call');
      expect(trace.status).toBe('seed-traced-to-call');
      expect(trace.totalInstructionsDecoded).toBe(3);

      const eventTypes = trace.events.map((e) => e.eventType);
      expect(eventTypes).toContain('seed-copied-to-register');
      expect(eventTypes).toContain('affine-adjustment');
      expect(eventTypes).toContain('seed-live-at-call');
    });

    it('terminates at short conditional branch (Jcc rel8)', () => {
      const buf = new Uint8Array([
        0xb8, 0x00, 0x20, 0x00, 0x00,
        0x74, 0x0a, // JZ +10
      ]);

      const trace = traceStraightLineSeedUse(
        buf,
        1,
        0,
        5,
        'MOV EAX, 0x00002000',
        'EAX',
        0x00002000,
        undefined,
        mockReport,
      );

      expect(trace.stopReason).toBe('conditional-branch-boundary');
      expect(trace.seedLiveAtBoundary).toBe(true);
      expect(trace.boundaryType).toBe('branch');
      expect(trace.status).toBe('seed-traced-to-branch');
    });

    it('terminates at RET (0xC3)', () => {
      const buf = new Uint8Array([
        0xb8, 0x00, 0x20, 0x00, 0x00,
        0xc3,
      ]);

      const trace = traceStraightLineSeedUse(
        buf,
        1,
        0,
        5,
        'MOV EAX, 0x00002000',
        'EAX',
        0x00002000,
        undefined,
        mockReport,
      );

      expect(trace.stopReason).toBe('return-boundary');
      expect(trace.seedLiveAtBoundary).toBe(true);
      expect(trace.boundaryType).toBe('return');
      expect(trace.status).toBe('seed-traced-to-return');
    });

    it('detects seed overwrite before use', () => {
      const buf = new Uint8Array([
        0xb8, 0x00, 0x20, 0x00, 0x00,
        0xb8, 0x00, 0x00, 0x00, 0x00,
        0xc3,
      ]);

      const trace = traceStraightLineSeedUse(
        buf,
        1,
        0,
        5,
        'MOV EAX, 0x00002000',
        'EAX',
        0x00002000,
        undefined,
        mockReport,
      );

      expect(trace.seedOverwritten).toBe(true);
      expect(trace.status).toBe('seed-overwritten-before-use');
    });

    it('detects memory access when seed is used as base register', () => {
      const buf = new Uint8Array([
        0xb8, 0x00, 0x20, 0x00, 0x00,
        0x8b, 0x10, // MOV EDX, [EAX]
        0xc3,
      ]);

      const trace = traceStraightLineSeedUse(
        buf,
        1,
        0,
        5,
        'MOV EAX, 0x00002000',
        'EAX',
        0x00002000,
        undefined,
        mockReport,
      );

      expect(trace.seedUsedInMemoryAccess).toBe(true);
      expect(trace.status).toBe('seed-traced-to-return');
      const memEvents = trace.events.filter((e) => e.eventType === 'seed-used-as-memory-base');
      expect(memEvents.length).toBeGreaterThan(0);
      expect(memEvents[0].sourceRegister).toBe('EAX');
    });

    it('terminates with unsupported-size-override on 0x66 prefix', () => {
      const buf = new Uint8Array([
        0xb8, 0x00, 0x20, 0x00, 0x00,
        0x66, 0x8b, 0x00,
      ]);

      const trace = traceStraightLineSeedUse(
        buf,
        1,
        0,
        5,
        'MOV EAX, 0x00002000',
        'EAX',
        0x00002000,
        undefined,
        mockReport,
      );

      expect(trace.stopReason).toBe('unsupported-size-override');
      expect(trace.status).toBe('seed-traced-to-size-override');
    });
  });

  describe('Full Pass Reconciliation & JSON Export', () => {
    it('executes reconciliation and generates valid export schema', () => {
      const shape1: X86ShapeMatchDetails = {
        shapeClass: 'mov-r32-imm32',
        isWhitelistedShape: true,
        mnemonicHint: 'MOV EAX, 0x00002000',
        opcodeBytesHex: 'B8',
        instructionLength: 5,
        candidateEncodingStart: 0x0fff,
        candidateEncodingStartHex: '0x00000FFF',
        candidateEncodingLength: 5,
        isNegativeContext: false,
        explanation: 'Valid MOV EAX imm32',
      };

      const pos1: PhysicalPositionContextClassification = {
        sourceFileOffset: 0x1000,
        sourceFileOffsetHex: '0x00001000',
        sourceObjectNumber: 1,
        sourceRegionId: 'object-1',
        sourceRegionClass: 'LOADED_CODE',
        sourceLoadedAddressHex: '0x00011000',
        matchedUint32Value: 0x00002000,
        matchedUint32Hex: '0x00002000',
        logicalMatchesCount: 1,
        associatedCandidates: [
          {
            candidateId: 'cand-0',
            representationKind: 'object-relative-structure',
            targetCandidateByteStartHex: '0x00002000',
            targetCandidateRegionId: 'object-1',
            targetObjectNumber: 1,
          },
        ],
        contextBytesHex: 'B800200000C3',
        trackA_x86Shape: shape1,
        shapeStatus: 'single-whitelisted-shape',
        matchingShapes: [shape1],
        clusterId: null,
        isClustered: false,
      };

      const mockContextResult = createMockContextResult([pos1]);
      const candidateProfile = createMockCandidateProfile('cand-0', 0x2000, 1, 0x00012000, 0x00012002);
      const mockFusionResult = createMockFusionResult([candidateProfile]);

      const shape2: X86ShapeMatchDetails = {
        shapeClass: 'mov-r32-imm32',
        isWhitelistedShape: true,
        mnemonicHint: 'MOV EDX, 0x0000001D',
        opcodeBytesHex: 'BA',
        instructionLength: 5,
        candidateEncodingStart: 0x14ff,
        candidateEncodingStartHex: '0x000014FF',
        candidateEncodingLength: 5,
        isNegativeContext: false,
        explanation: 'Valid MOV EDX imm32',
      };

      const referrer1: MK1SecondOrderPhysicalReferrer = {
        referrerFileOffset: 0x1500,
        referrerFileOffsetHex: '0x00001500',
        referrerObjectNumber: 1,
        referrerObjectOffset: 0x500,
        referrerObjectOffsetHex: '0x00000500',
        referrerLoadedAddress: 0x00010500,
        referrerLoadedAddressHex: '0x00010500',
        referrerRegionId: 'object-1',
        referrerRegionClass: 'LOADED_CODE',
        secondOrderRole: 'whitelisted-object1-operand-referrer',
        matchedUint32Value: 0x0000001d,
        matchedUint32Hex: '0x0000001D',
        alignmentMod4: true,
        alignmentMod2: true,
        shapeStatus: 'single-whitelisted-shape',
        matchingShapes: [shape2],
        primaryShape: shape2,
        context: {
          beforeBytesHex: '',
          matchedBytesHex: '1D000000',
          afterBytesHex: '',
          fullWindowHex: 'BA1D000000C3',
        },
        targetSiteIds: ['site_0x0000001D'],
        isExactSelfForAnySite: false,
        isInsideAnyFirstHopField: false,
      };

      const mockChainResult = createMockChainResult([referrer1]);

      const dummyBuf = new Uint8Array(0x10000);
      dummyBuf[0x0fff] = 0xb8;
      dummyBuf[0x1004] = 0xc3;
      dummyBuf[0x14ff] = 0xba;
      dummyBuf[0x1504] = 0xc3;

      const result = executePaletteOperandUseReconnaissance(
        dummyBuf,
        mockReport,
        mockContextResult,
        mockFusionResult,
        mockChainResult,
      );

      expect(result.status).toBe('SUCCESS');
      expect(result.reconciliation.allDirectSitesAccountedFor).toBe(true);
      expect(result.reconciliation.allShapeInterpretationsAccountedFor).toBe(true);
      expect(result.reconciliation.allReconciled).toBe(true);
      expect(result.sites.length).toBe(2);
      expect(result.interpretations.length).toBe(2);

      const exp = createMK1PaletteOperandUseExport(result);
      expect(exp.metadata.formatVersion).toBe('mk1_palette_operand_use_recon_v1');
      expect(exp.metadata.milestone).toBe('1E.2B.8a.2');
      expect(exp.sites.length).toBe(2);
      expect(exp.interpretations.length).toBe(2);
      expect(exp.interpretationCaveats.length).toBeGreaterThan(0);
      expect(result.callBoundarySummary).toBeDefined();
      expect(result.decisionPatternTable.length).toBeGreaterThan(0);
    });

    it('should classify CALL boundary targets with coordinates and topology without following execution', () => {
      const callBuf = new Uint8Array(0x10000);
      // At 0x1000: MOV EAX, 0x00002000 (B8 00 20 00 00)
      callBuf[0x1000] = 0xb8;
      callBuf[0x1001] = 0x00;
      callBuf[0x1002] = 0x20;
      callBuf[0x1003] = 0x00;
      callBuf[0x1004] = 0x00;
      // At 0x1005: CALL near rel32 (E8 displacement)
      // Displace by +0x1000. Next instr is at 0x100A, target is 0x100A + 0x1000 = 0x200A
      callBuf[0x1005] = 0xe8;
      callBuf[0x1006] = 0x00;
      callBuf[0x1007] = 0x10;
      callBuf[0x1008] = 0x00;
      callBuf[0x1009] = 0x00;

      const trace = traceStraightLineSeedUse(
        callBuf,
        0x1001,
        0x1000,
        5,
        'MOV EAX, 0x00002000',
        'EAX',
        0x2000,
        undefined,
        mockReport,
      );

      expect(trace.stopReason).toBe('call-boundary');
      expect(trace.boundaryTargetHex).toBeDefined();
      expect(trace.callBoundaryTargetRecon).toBeDefined();
      expect(trace.stopInstructionMnemonic).toContain('CALL');
      expect(trace.callBoundaryTargetRecon?.targetOffsetWithinSourceObjectVirtualRange).toBe(true);
      expect(trace.callBoundaryTargetRecon?.targetOffsetWithinSourceObjectFileBackedRange).toBe(true);
      expect(trace.callBoundaryTargetRecon?.targetLoadedLinearCandidateHex).toBe('0x0001200A');
    });
  });

  /* ========================================================================
   * B.8a CONTRACT HARDENING TESTS (Requirements 69 - 85)
   * ======================================================================== */

  describe('Contract Hardening - Upstream Failure Handling (Req 69)', () => {
    it('returns status FAILED when contextResult (B.2) status is FAILED', () => {
      const failedContext = createMockContextResult([], 'FAILED');
      const fusion = createMockFusionResult([]);
      const chain = createMockChainResult([]);
      const buf = new Uint8Array(0x1000);

      const res = executePaletteOperandUseReconnaissance(buf, mockReport, failedContext, fusion, chain);
      expect(res.status).toBe('FAILED');
      expect(res.failureReason).toContain('B.2');
    });

    it('returns status FAILED when fusionResult (B.6) status is FAILED', () => {
      const context = createMockContextResult([]);
      const failedFusion = createMockFusionResult([], 'FAILED');
      const chain = createMockChainResult([]);
      const buf = new Uint8Array(0x1000);

      const res = executePaletteOperandUseReconnaissance(buf, mockReport, context, failedFusion, chain);
      expect(res.status).toBe('FAILED');
      expect(res.failureReason).toContain('B.6');
    });

    it('returns status FAILED when chainResult (B.7) status is FAILED', () => {
      const context = createMockContextResult([]);
      const fusion = createMockFusionResult([]);
      const failedChain = createMockChainResult([], 'FAILED');
      const buf = new Uint8Array(0x1000);

      const res = executePaletteOperandUseReconnaissance(buf, mockReport, context, fusion, failedChain);
      expect(res.status).toBe('FAILED');
      expect(res.failureReason).toContain('B.7');
    });

    it('returns status FAILED when executable layout report has no objects', () => {
      const badReport = createMockReport({ objects: [] });
      const context = createMockContextResult([]);
      const fusion = createMockFusionResult([]);
      const chain = createMockChainResult([]);
      const buf = new Uint8Array(0x1000);

      const res = executePaletteOperandUseReconnaissance(buf, badReport, context, fusion, chain);
      expect(res.status).toBe('FAILED');
      expect(res.failureReason).toContain('layout');
    });
  });

  describe('Contract Hardening - Relocation & Zero Fabrication Invariants (Req 70, 71)', () => {
    it('fails deterministically when Object 1 is missing instead of substituting 0x10000 fallback (Req 70)', () => {
      // Remove Object 1 from objects list
      const badReport = createMockReport({
        objects: [
          {
            ...mockReport.objects[1],
            objectNumber: 2,
          },
        ],
      });
      const context = createMockContextResult([]);
      const fusion = createMockFusionResult([]);
      const chain = createMockChainResult([]);
      const buf = new Uint8Array(0x1000);

      const res = executePaletteOperandUseReconnaissance(buf, badReport, context, fusion, chain);
      expect(res.status).toBe('FAILED');
      expect(res.failureReason).toContain('Object 1 code descriptor missing');
    });

    it('never fabricates zero for missing Object 1 mapping (Req 71)', () => {
      // Object 1 with distinct relocationBaseAddress
      const distinctReport = createMockReport({
        objects: [
          {
            ...mockReport.objects[0],
            relocationBaseAddress: 0x00020000,
            relocationBaseAddressHex: '0x00020000',
          },
          mockReport.objects[1],
        ],
      });

      const cand = createMockCandidateProfile('cand-1', 0x4000, 1, 0x00024000, 0x00024002);
      const res = evaluateObjectRelativeCompatibility(0x00004000, 'object-relative-structure', cand, distinctReport);

      expect(res.targetObjectRelocationBase).toBe(0x00020000);
      expect(res.requiredBaseToReachTargetLoadedAddress).toBe(0x00020000);
      expect(res.requiredBaseEqualsTargetObjectRelocationBase).toBe(true);
      // Zero must not have been fabricated
      expect(res.targetObjectRelocationBase).not.toBe(0);
    });
  });

  describe('Contract Hardening - Multiple Candidate Associations Invariant (Req 72)', () => {
    it('preserves all candidate associations deterministically for synthetic B.2 site with multiple associations', () => {
      const shape: X86ShapeMatchDetails = {
        shapeClass: 'mov-r32-imm32',
        isWhitelistedShape: true,
        mnemonicHint: 'MOV EAX, 0x00002000',
        opcodeBytesHex: 'B8',
        instructionLength: 5,
        candidateEncodingStart: 0x0fff,
        candidateEncodingStartHex: '0x00000FFF',
        candidateEncodingLength: 5,
        isNegativeContext: false,
        explanation: 'MOV EAX imm32 with multiple associations',
      };

      const posMulti: PhysicalPositionContextClassification = {
        sourceFileOffset: 0x1000,
        sourceFileOffsetHex: '0x00001000',
        sourceObjectNumber: 1,
        sourceRegionId: 'object-1',
        sourceRegionClass: 'LOADED_CODE',
        sourceLoadedAddressHex: '0x00011000',
        matchedUint32Value: 0x00002000,
        matchedUint32Hex: '0x00002000',
        logicalMatchesCount: 2,
        associatedCandidates: [
          {
            candidateId: 'cand-A',
            representationKind: 'object-relative-structure',
            targetCandidateByteStartHex: '0x00002000',
            targetCandidateRegionId: 'object-1',
            targetObjectNumber: 1,
          },
          {
            candidateId: 'cand-B',
            representationKind: 'object-relative-payload',
            targetCandidateByteStartHex: '0x00001FFE',
            targetCandidateRegionId: 'object-1',
            targetObjectNumber: 1,
          },
        ],
        contextBytesHex: 'B800200000C3',
        trackA_x86Shape: shape,
        shapeStatus: 'single-whitelisted-shape',
        matchingShapes: [shape],
        clusterId: null,
        isClustered: false,
      };

      const candA = createMockCandidateProfile('cand-A', 0x2000, 1, 0x00012000, 0x00012002);
      const candB = createMockCandidateProfile('cand-B', 0x1ffe, 1, 0x00011ffe, 0x00012000);

      const contextResult = createMockContextResult([posMulti]);
      const fusionResult = createMockFusionResult([candA, candB]);
      const chainResult = createMockChainResult([]);

      const buf = new Uint8Array(0x10000);
      buf[0x0fff] = 0xb8;
      buf[0x1004] = 0xc3;

      const res = executePaletteOperandUseReconnaissance(buf, mockReport, contextResult, fusionResult, chainResult);
      // Invariant check: ambiguous multiple candidate associations on single site trigger deterministic invariant failure
      expect(res.status).toBe('FAILED');
      expect(res.reconciliation.candidateAssociationsMissing.length).toBe(1);
      expect(res.reconciliation.allReconciled).toBe(false);
    });
  });

  describe('Contract Hardening - 0x24B90 Resolution Invariant (Req 73)', () => {
    it('evaluates direct linear resolution for 0x24B90 landing in Object 1 but not matching pre-LE payload', () => {
      // In MK1, 0x24B90 direct linear address lands in Object 1 (relocBase 0x10000..0x60000)
      // Object 1 offset = 0x24B90 - 0x10000 = 0x14B90.
      // The associated candidate payload is at physical 0x24B90 (pre-LE header data, not mapped).
      const candidateProfile = createMockCandidateProfile('cand-24b90', 0x24b90, null, null, null);
      // Candidate is physically in pre-LE prefix, targetLoadedAddress is null

      const res = evaluateDirectLinearResolution(
        0x00024b90,
        'direct-memory-load-address',
        false,
        mockReport,
        candidateProfile,
      );

      expect(res.resolutionClass).toBe('resolves-other-loaded-location');
      expect(res.resolvedObjectNumber).toBe(1);
      expect(res.resolvedObjectOffset).toBe(0x14b90);
      expect(res.resolvedObjectOffsetHex).toBe('0x00014B90');
      // Must NOT claim exact match to associated target payload
      expect(res.matchesAssociatedTarget).toBe(false);
    });
  });

  describe('Contract Hardening - Ambiguity Preservation (Req 74)', () => {
    it('preserves both disp32 MOV and accumulator ADC for same physical operand field', () => {
      const movShape: X86ShapeMatchDetails = {
        shapeClass: 'disp32-absolute',
        isWhitelistedShape: true,
        mnemonicHint: 'MOV EAX, [0x00024B90]',
        opcodeBytesHex: '8B05',
        instructionLength: 6,
        candidateEncodingStart: 0x1ffe,
        candidateEncodingStartHex: '0x00001FFE',
        candidateEncodingLength: 6,
        isNegativeContext: false,
        explanation: 'disp32 load',
      };

      const adcShape: X86ShapeMatchDetails = {
        shapeClass: 'accumulator-imm32',
        isWhitelistedShape: true,
        mnemonicHint: 'ADC EAX, 0x00024B90',
        opcodeBytesHex: '15',
        instructionLength: 5,
        candidateEncodingStart: 0x1fff,
        candidateEncodingStartHex: '0x00001FFF',
        candidateEncodingLength: 5,
        isNegativeContext: false,
        explanation: 'ADC accumulator immediate',
      };

      const posAmbiguous: PhysicalPositionContextClassification = {
        sourceFileOffset: 0x2000,
        sourceFileOffsetHex: '0x00002000',
        sourceObjectNumber: 1,
        sourceRegionId: 'object-1',
        sourceRegionClass: 'LOADED_CODE',
        sourceLoadedAddressHex: '0x00012000',
        matchedUint32Value: 0x00024b90,
        matchedUint32Hex: '0x00024B90',
        logicalMatchesCount: 1,
        associatedCandidates: [
          {
            candidateId: 'cand-ambig',
            representationKind: 'linear-payload-address',
            targetCandidateByteStartHex: '0x00024B90',
            targetCandidateRegionId: 'pre-le-prefix',
            targetObjectNumber: null,
          },
        ],
        contextBytesHex: '8B05904B0200',
        trackA_x86Shape: movShape,
        shapeStatus: 'multiple-whitelisted-shapes',
        matchingShapes: [movShape, adcShape],
        clusterId: null,
        isClustered: false,
      };

      const cand = createMockCandidateProfile('cand-ambig', 0x24b90, null, null, null);
      const contextResult = createMockContextResult([posAmbiguous]);
      const fusionResult = createMockFusionResult([cand]);
      const chainResult = createMockChainResult([]);

      const buf = new Uint8Array(0x10000);
      buf[0x1ffe] = 0x8b;
      buf[0x1fff] = 0x05;
      buf[0x2004] = 0xc3;

      const res = executePaletteOperandUseReconnaissance(buf, mockReport, contextResult, fusionResult, chainResult);
      expect(res.status).toBe('SUCCESS');
      expect(res.sites.length).toBe(1);
      // Both interpretations must be retained!
      expect(res.interpretations.length).toBe(2);
      const shapes = res.interpretations.map((i) => i.shapeClass);
      expect(shapes).toContain('disp32-absolute');
      expect(shapes).toContain('accumulator-imm32');
    });
  });

  describe('Contract Hardening - Object-Relative Seed & Base Adjustment Invariants (Req 75)', () => {
    it('evaluates mathematical base relation without claiming observedRelocationBaseAdjustment if no ADD/LEA occurs', () => {
      // Seed 0x2000 + Object 1 base 0x10000 = 0x12000
      const cand = createMockCandidateProfile('cand-0', 0x2000, 1, 0x00012000, 0x00012002);
      const comp = evaluateObjectRelativeCompatibility(0x2000, 'object-relative-structure', cand, mockReport);
      expect(comp.requiredBaseEqualsTargetObjectRelocationBase).toBe(true);

      // In trace: MOV EAX, 0x2000; MOV EDX, EAX; RET
      const buf = new Uint8Array([
        0xb8, 0x00, 0x20, 0x00, 0x00,
        0x8b, 0xd0,
        0xc3,
      ]);

      const trace = traceStraightLineSeedUse(
        buf,
        1,
        0,
        5,
        'MOV EAX, 0x00002000',
        'EAX',
        0x2000,
        cand,
        mockReport,
      );

      // Without ADD/LEA, seedRelocationBaseAdjusted MUST remain false
      expect(trace.seedRelocationBaseAdjusted).toBe(false);
      expect(trace.stopReason).toBe('return-boundary');
    });
  });

  describe('Contract Hardening - Event vs Stop Reason Independence (Req 76)', () => {
    it('preserves memoryBaseObserved=true independently when trace stops at call-boundary', () => {
      // MOV EAX, 0x2000; MOV EDX, [EAX]; CALL rel32
      const buf = new Uint8Array([
        0xb8, 0x00, 0x20, 0x00, 0x00, // seed
        0x8b, 0x10,                   // MOV EDX, [EAX] (memory access with seed as base)
        0xe8, 0x10, 0x00, 0x00, 0x00, // CALL rel32
      ]);

      const trace = traceStraightLineSeedUse(
        buf,
        1,
        0,
        5,
        'MOV EAX, 0x00002000',
        'EAX',
        0x2000,
        undefined,
        mockReport,
      );

      // Both facts must be true independently!
      expect(trace.seedUsedAsMemoryBase).toBe(true);
      expect(trace.seedUsedInMemoryAccess).toBe(true);
      expect(trace.stopReason).toBe('call-boundary');
      expect(trace.status).toBe('seed-traced-to-call');
    });
  });

  describe('Contract Hardening - Target Value vs Memory Address Observation (Req 77)', () => {
    it('marks targetCoordinateValueReached when affine adjustment reaches target, but not targetCompatibleMemoryAddressObserved until dereferenced', () => {
      const cand = createMockCandidateProfile('cand-0', 0x2000, 1, 0x00012000, 0x00012002);

      // Trace 1: MOV EAX, 0x2000; ADD EAX, 0x10000; RET
      const buf1 = new Uint8Array([
        0xb8, 0x00, 0x20, 0x00, 0x00,             // seed in EAX (0x2000)
        0x81, 0xc0, 0x00, 0x00, 0x01, 0x00,       // ADD EAX, 0x10000 -> EAX = 0x12000
        0xc3,                                     // RET
      ]);

      const trace1 = traceStraightLineSeedUse(
        buf1,
        1,
        0,
        5,
        'MOV EAX, 0x00002000',
        'EAX',
        0x2000,
        cand,
        mockReport,
      );

      expect(trace1.seedTargetCoordinateValueReached).toBe(true);
      expect(trace1.seedTargetCompatibleMemoryAddressObserved).toBe(false);

      // Trace 2: MOV EAX, 0x2000; ADD EAX, 0x10000; MOV EDX, [EAX]; RET
      const buf2 = new Uint8Array([
        0xb8, 0x00, 0x20, 0x00, 0x00,             // seed in EAX
        0x81, 0xc0, 0x00, 0x00, 0x01, 0x00,       // ADD EAX, 0x10000 -> EAX = 0x12000
        0x8b, 0x10,                               // MOV EDX, [EAX] -> dereference target coordinate!
        0xc3,                                     // RET
      ]);

      const trace2 = traceStraightLineSeedUse(
        buf2,
        1,
        0,
        5,
        'MOV EAX, 0x00002000',
        'EAX',
        0x2000,
        cand,
        mockReport,
      );

      expect(trace2.seedTargetCoordinateValueReached).toBe(true);
      expect(trace2.seedTargetCompatibleMemoryAddressObserved).toBe(true);
    });
  });

  describe('Contract Hardening - Partial Memory Address Use (Req 78)', () => {
    it('classifies SIB base/index usage with unknown components as partial-memory-address-use without fabricating effective address', () => {
      // 8B 04 88 = MOV EAX, [EAX + ECX*4] (EAX is seed, ECX is unknown)
      const buf = new Uint8Array([
        0xb8, 0x00, 0x20, 0x00, 0x00,
        0x8b, 0x04, 0x88,
        0xc3,
      ]);

      const trace = traceStraightLineSeedUse(
        buf,
        1,
        0,
        5,
        'MOV EAX, 0x00002000',
        'EAX',
        0x2000,
        undefined,
        mockReport,
      );

      expect(trace.seedUsedInMemoryAccess).toBe(true);
      const partialEvents = trace.events.filter(
        (e) => e.eventType === 'seed-used-as-memory-base' || e.eventType === 'seed-used-as-memory-index',
      );
      expect(partialEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Contract Hardening - Instruction Object Boundary Invariant (Req 79)', () => {
    it('stops with buffer-exhausted-boundary or object-boundary when instruction exceeds addressable boundary', () => {
      // Truncated buffer ending mid-instruction
      const buf = new Uint8Array([
        0xb8, 0x00, 0x20, 0x00, 0x00, // seed
        0xe8, 0x10,                   // truncated CALL (needs 5 bytes, only 2 provided)
      ]);

      const trace = traceStraightLineSeedUse(
        buf,
        1,
        0,
        5,
        'MOV EAX, 0x00002000',
        'EAX',
        0x2000,
        undefined,
        mockReport,
      );

      expect(trace.stopReason).toBe('object-boundary-reached');
    });
  });

  describe('Contract Hardening - CALL Target Topography Classifications (Req 80, 81, 82, 83)', () => {
    it('classifies CALL target resolving inside source Object virtual range (Req 80)', () => {
      const callBuf = new Uint8Array(0x10000);
      // At 0x1000: seed (5 bytes)
      callBuf[0x1000] = 0xb8;
      // At 0x1005: CALL near rel32 displacement = +0x0500
      // Next instr at 0x100A, target = 0x100A + 0x0500 = 0x150A.
      // Source site is in Object 1 (offset 0x1000, reloc 0x10000). Target Object 1 offset = 0x150A < virtualSize 0x50000.
      callBuf[0x1005] = 0xe8;
      callBuf[0x1006] = 0x00;
      callBuf[0x1007] = 0x05;
      callBuf[0x1008] = 0x00;
      callBuf[0x1009] = 0x00;

      const trace = traceStraightLineSeedUse(
        callBuf,
        0x1001,
        0x1000,
        5,
        'MOV EAX, 0x00002000',
        'EAX',
        0x2000,
        undefined,
        mockReport,
      );

      expect(trace.stopReason).toBe('call-boundary');
      expect(trace.callBoundaryTargetRecon?.targetOffsetWithinSourceObjectVirtualRange).toBe(true);
      expect(trace.callBoundaryTargetRecon?.targetTopologyClassification).toBe('target-offset-within-source-object');
    });

    it('classifies CALL target whose numeric loaded-linear candidate lands in another object (Req 81)', () => {
      // Displace CALL so that loaded-linear lands in Object 2 (0x60000..0x80000)
      // Site in Object 1 offset 0x1000 -> linear 0x11005. Next instr at 0x1100A.
      // Target linear 0x65000 -> displacement = 0x65000 - 0x1100A = 0x53FF6.
      const disp = (0x65000 - 0x1100a) >>> 0;
      const callBuf = new Uint8Array(0x10000);
      callBuf[0x1000] = 0xb8;
      callBuf[0x1005] = 0xe8;
      callBuf[0x1006] = disp & 0xff;
      callBuf[0x1007] = (disp >> 8) & 0xff;
      callBuf[0x1008] = (disp >> 16) & 0xff;
      callBuf[0x1009] = (disp >> 24) & 0xff;

      const trace = traceStraightLineSeedUse(
        callBuf,
        0x1001,
        0x1000,
        5,
        'MOV EAX, 0x00002000',
        'EAX',
        0x2000,
        undefined,
        mockReport,
      );

      expect(trace.stopReason).toBe('call-boundary');
      expect(trace.callBoundaryTargetRecon?.targetLoadedLinearCandidateHex).toBe('0x00065000');
      expect(trace.callBoundaryTargetRecon?.targetTopologyClassification).toBe('numeric-linear-target-resolves-other-object');
    });

    it('classifies CALL target outside all objects as numeric-target-unmapped (Req 82)', () => {
      // Displace CALL to 0x90000 (outside Object 1 and Object 2)
      const disp = (0x90000 - 0x1100a) >>> 0;
      const callBuf = new Uint8Array(0x10000);
      callBuf[0x1000] = 0xb8;
      callBuf[0x1005] = 0xe8;
      callBuf[0x1006] = disp & 0xff;
      callBuf[0x1007] = (disp >> 8) & 0xff;
      callBuf[0x1008] = (disp >> 16) & 0xff;
      callBuf[0x1009] = (disp >> 24) & 0xff;

      const trace = traceStraightLineSeedUse(
        callBuf,
        0x1001,
        0x1000,
        5,
        'MOV EAX, 0x00002000',
        'EAX',
        0x2000,
        undefined,
        mockReport,
      );

      expect(trace.stopReason).toBe('call-boundary');
      expect(trace.callBoundaryTargetRecon?.targetTopologyClassification).toBe('numeric-linear-target-unmapped');
    });

    it('groups multiple traces by target address reproducing grouping mechanics (Req 83)', () => {
      // 2 traces sharing target 0x1200A
      const callBuf = new Uint8Array(0x10000);
      // Site 1: offset 0x1000
      callBuf[0x1000] = 0xb8; // MOV EAX, 0x2000
      callBuf[0x1005] = 0xe8; // CALL +0x1000 -> next 0x100A + 0x1000 = 0x200A (linear 0x1200A)
      callBuf[0x1006] = 0x00;
      callBuf[0x1007] = 0x10;
      callBuf[0x1008] = 0x00;
      callBuf[0x1009] = 0x00;

      // Site 2: offset 0x1100
      callBuf[0x1100] = 0xb8; // MOV EAX, 0x2000
      // Next instr at 0x110A. Target 0x200A -> disp = 0x200A - 0x110A = 0x0F00
      callBuf[0x1105] = 0xe8;
      callBuf[0x1106] = 0x00;
      callBuf[0x1107] = 0x0f;
      callBuf[0x1108] = 0x00;
      callBuf[0x1109] = 0x00;

      const shape1: X86ShapeMatchDetails = {
        shapeClass: 'mov-r32-imm32',
        isWhitelistedShape: true,
        mnemonicHint: 'MOV EAX, 0x00002000',
        opcodeBytesHex: 'B8',
        instructionLength: 5,
        candidateEncodingStart: 0x1000,
        candidateEncodingStartHex: '0x00001000',
        candidateEncodingLength: 5,
        isNegativeContext: false,
        explanation: 'Seed 1',
      };

      const shape2: X86ShapeMatchDetails = {
        shapeClass: 'mov-r32-imm32',
        isWhitelistedShape: true,
        mnemonicHint: 'MOV EAX, 0x00002000',
        opcodeBytesHex: 'B8',
        instructionLength: 5,
        candidateEncodingStart: 0x1100,
        candidateEncodingStartHex: '0x00001100',
        candidateEncodingLength: 5,
        isNegativeContext: false,
        explanation: 'Seed 2',
      };

      const pos1: PhysicalPositionContextClassification = {
        sourceFileOffset: 0x1001,
        sourceFileOffsetHex: '0x00001001',
        sourceObjectNumber: 1,
        sourceRegionId: 'object-1',
        sourceRegionClass: 'LOADED_CODE',
        sourceLoadedAddressHex: '0x00011001',
        matchedUint32Value: 0x00002000,
        matchedUint32Hex: '0x00002000',
        logicalMatchesCount: 1,
        associatedCandidates: [
          {
            candidateId: 'cand-0',
            representationKind: 'object-relative-structure',
            targetCandidateByteStartHex: '0x00002000',
            targetCandidateRegionId: 'object-1',
            targetObjectNumber: 1,
          },
        ],
        contextBytesHex: 'B800200000E8',
        trackA_x86Shape: shape1,
        shapeStatus: 'single-whitelisted-shape',
        matchingShapes: [shape1],
        clusterId: null,
        isClustered: false,
      };

      const pos2: PhysicalPositionContextClassification = {
        sourceFileOffset: 0x1101,
        sourceFileOffsetHex: '0x00001101',
        sourceObjectNumber: 1,
        sourceRegionId: 'object-1',
        sourceRegionClass: 'LOADED_CODE',
        sourceLoadedAddressHex: '0x00011101',
        matchedUint32Value: 0x00002000,
        matchedUint32Hex: '0x00002000',
        logicalMatchesCount: 1,
        associatedCandidates: [
          {
            candidateId: 'cand-0',
            representationKind: 'object-relative-structure',
            targetCandidateByteStartHex: '0x00002000',
            targetCandidateRegionId: 'object-1',
            targetObjectNumber: 1,
          },
        ],
        contextBytesHex: 'B800200000E8',
        trackA_x86Shape: shape2,
        shapeStatus: 'single-whitelisted-shape',
        matchingShapes: [shape2],
        clusterId: null,
        isClustered: false,
      };

      const cand = createMockCandidateProfile('cand-0', 0x2000, 1, 0x00012000, 0x00012002);
      const contextResult = createMockContextResult([pos1, pos2]);
      const fusionResult = createMockFusionResult([cand]);
      const chainResult = createMockChainResult([]);

      const res = executePaletteOperandUseReconnaissance(callBuf, mockReport, contextResult, fusionResult, chainResult);
      expect(res.status).toBe('SUCCESS');
      expect(res.callBoundaryTargetGroups.length).toBe(1);
      expect(res.callBoundaryTargetGroups[0].traceCount).toBe(2);
      expect(res.callBoundaryTargetGroups[0].boundaryTargetLinearHex).toBe('0x0001200A');
    });
  });

  describe('Contract Hardening - Export Contract & Non-Consumer Axioms (Req 84, 85)', () => {
    it('produces valid export schema matching mk1_palette_operand_use_recon_v1 (Req 84)', () => {
      const dummyBuf = new Uint8Array(0x1000);
      const res = executePaletteOperandUseReconnaissance(
        dummyBuf,
        mockReport,
        createMockContextResult([]),
        createMockFusionResult([]),
        createMockChainResult([]),
      );

      const exp = createMK1PaletteOperandUseExport(res);
      expect(exp.metadata.formatVersion).toBe('mk1_palette_operand_use_recon_v1');
      expect(exp.status).toBe('SUCCESS');
      expect(exp.traceConfiguration).toBeDefined();
      expect(exp.upstreamSummary).toBeDefined();
      expect(exp.reconciliation).toBeDefined();
      expect(exp.reconciliation.allReconciled).toBe(true);
      expect(exp.callBoundarySummary).toBeDefined();
      expect(exp.candidateSummaries).toBeDefined();
      expect(exp.controls).toBeDefined();
      expect(exp.decisionPatternTable).toBeDefined();
    });

    it('strictly forbids synthetic consumer, pointer, or probability scores (Req 85)', () => {
      const dummyBuf = new Uint8Array(0x1000);
      const res = executePaletteOperandUseReconnaissance(
        dummyBuf,
        mockReport,
        createMockContextResult([]),
        createMockFusionResult([]),
        createMockChainResult([]),
      );

      const exp = createMK1PaletteOperandUseExport(res);
      const expKeys = Object.keys(exp);
      const forbiddenScoreKeys = [
        'confidenceScore',
        'consumerScore',
        'pointerScore',
        'paletteScore',
        'rank',
        'probability',
      ];

      for (const key of forbiddenScoreKeys) {
        expect(expKeys).not.toContain(key);
      }
    });
  });

  describe('Milestone 1E.2B.8a.1 - Authoritative Evidence Consistency & UI Contract Closure', () => {
    it('uses authoritative MK1.EXE:0x... candidate IDs and populates all summary fields with payload at byteStart + 2', () => {
      const callBuf = new Uint8Array(0x3000);
      // MOV EAX, 0x00012000 (encoding at 0x1FFF, operand at 0x2000 in Object 1)
      callBuf[0x1FFF] = 0xB8;
      callBuf[0x2000] = 0x00;
      callBuf[0x2001] = 0x20;
      callBuf[0x2002] = 0x01;
      callBuf[0x2003] = 0x00;
      // CALL $+5 (rel32: 0x00000000 -> target 0x2009 file offset)
      callBuf[0x2004] = 0xE8;
      callBuf[0x2005] = 0x00;
      callBuf[0x2006] = 0x00;
      callBuf[0x2007] = 0x00;
      callBuf[0x2008] = 0x00;

      const shape: X86ShapeMatchDetails = {
        shapeClass: 'mov-r32-imm32',
        mnemonicHint: 'MOV',
        opcodeBytesHex: 'B8',
        candidateEncodingStart: 0x1FFF,
        candidateEncodingStartHex: '0x00001FFF',
        candidateEncodingLength: 5,
        instructionLength: 5,
        isWhitelistedShape: true,
        isNegativeContext: false,
        explanation: 'B8 mov reg imm32',
      };

      const candId = 'MK1.EXE:0x0002C3FE';
      const pos: PhysicalPositionContextClassification = {
        sourceFileOffset: 0x2000,
        sourceFileOffsetHex: '0x00002000',
        sourceRegionId: 'obj1',
        sourceRegionClass: 'LOADED_OBJECT_PAGE',
        sourceObjectNumber: 1,
        sourceLoadedAddressHex: '0x00012000',
        matchedUint32Value: 0x00012000,
        matchedUint32Hex: '0x00012000',
        logicalMatchesCount: 1,
        associatedCandidates: [
          {
            candidateId: candId,
            representationKind: 'object-relative-payload',
            targetCandidateByteStartHex: '0x0002C3FE',
            targetCandidateRegionId: 'obj1',
            targetObjectNumber: 1,
          },
        ],
        contextBytesHex: '00',
        trackA_x86Shape: shape,
        shapeStatus: 'single-whitelisted-shape',
        matchingShapes: [shape],
        clusterId: null,
        isClustered: false,
      };

      // Candidate at byteStart = 0x2C3FE, payload = 0x2C400 (byteStart + 2)
      const cand = createMockCandidateProfile(candId, 0x2C3FE, 1, 0x0003C3FE, 0x0003C400);
      const contextResult = createMockContextResult([pos]);
      const fusionResult = createMockFusionResult([cand]);
      const chainResult = createMockChainResult([]);

      const res = executePaletteOperandUseReconnaissance(callBuf, mockReport, contextResult, fusionResult, chainResult);
      expect(res.status).toBe('SUCCESS');
      expect(res.candidateSummaries.length).toBe(1);

      const summary = res.candidateSummaries[0];
      expect(summary.candidateId).toBe('MK1.EXE:0x0002C3FE');
      expect(summary.physicalStructureOffsetHex).toBe('0x0002C3FE');
      expect(summary.physicalPayloadOffsetHex).toBe('0x0002C400');
      expect(summary.directSiteCount).toBe(1);
      expect(summary.interpretationCount).toBe(1);
      expect(summary.associatedDirectSiteCount).toBe(1);
      expect(summary.associatedInterpretationCount).toBe(1);
      expect(summary.associatedSeedCount).toBe(1);
      expect(summary.associatedCallBoundaryCount).toBe(1);
      expect(summary.relocationAdjustmentsObserved).toBe(0);

      // Verify extended reconciliation flags
      expect(res.reconciliation.candidateSummariesReconciled).toBe(true);
      expect(res.reconciliation.candidateSummaryDirectSitesReconciled).toBe(true);
      expect(res.reconciliation.candidateSummaryInterpretationsReconciled).toBe(true);
      expect(res.reconciliation.candidateSummarySeedsReconciled).toBe(true);
      expect(res.reconciliation.candidateSummaryCallsReconciled).toBe(true);
      expect(res.reconciliation.physicalCandidateCoordinatesReconciled).toBe(true);
      expect(res.reconciliation.decisionPatternTableReconciled).toBe(true);
      expect(res.reconciliation.relocationObservationCountsReconciled).toBe(true);
      expect(res.reconciliation.fixtureObservationsDerived).toBe(true);
      expect(res.reconciliation.derivedEvidenceReconciled).toBe(true);
      expect(res.reconciliation.allReconciled).toBe(true);
    });

    it('fails reconciliation if a positive B.2 site has missing or ambiguous candidate association', () => {
      const callBuf = new Uint8Array(0x3000);
      callBuf[0x2000] = 0xB8;
      callBuf[0x2001] = 0x00;
      callBuf[0x2002] = 0x20;
      callBuf[0x2003] = 0x01;
      callBuf[0x2004] = 0x00;

      const shape: X86ShapeMatchDetails = {
        shapeClass: 'mov-r32-imm32',
        mnemonicHint: 'MOV',
        opcodeBytesHex: 'B8',
        candidateEncodingStart: 0x1FFF,
        candidateEncodingStartHex: '0x00001FFF',
        candidateEncodingLength: 5,
        instructionLength: 5,
        isWhitelistedShape: true,
        isNegativeContext: false,
        explanation: 'B8 mov reg imm32',
      };

      const pos: PhysicalPositionContextClassification = {
        sourceFileOffset: 0x2000,
        sourceFileOffsetHex: '0x00002000',
        sourceRegionId: 'obj1',
        sourceRegionClass: 'LOADED_OBJECT_PAGE',
        sourceObjectNumber: 1,
        sourceLoadedAddressHex: '0x00012000',
        matchedUint32Value: 0x00012000,
        matchedUint32Hex: '0x00012000',
        logicalMatchesCount: 0,
        shapeStatus: 'single-whitelisted-shape',
        matchingShapes: [shape],
        associatedCandidates: [], // Missing associated candidate!
        contextBytesHex: '00',
        trackA_x86Shape: shape,
        clusterId: null,
        isClustered: false,
      };

      const contextResult = createMockContextResult([pos]);
      const fusionResult = createMockFusionResult([]);
      const chainResult = createMockChainResult([]);

      const res = executePaletteOperandUseReconnaissance(callBuf, mockReport, contextResult, fusionResult, chainResult);
      expect(res.status).toBe('FAILED');
      expect(res.reconciliation.candidateAssociationsMissing).toContain('0x00002000');
      expect(res.reconciliation.allReconciled).toBe(false);
    });

    it('dynamically derives fixture observations without contradiction between mathematical base and observed adjustments', () => {
      const callBuf = new Uint8Array(0x3000);
      callBuf[0x1FFF] = 0xB8;
      callBuf[0x2000] = 0x00;
      callBuf[0x2001] = 0x20;
      callBuf[0x2002] = 0x01;
      callBuf[0x2003] = 0x00;
      callBuf[0x2004] = 0xC3; // RET

      const shape: X86ShapeMatchDetails = {
        shapeClass: 'mov-r32-imm32',
        mnemonicHint: 'MOV',
        opcodeBytesHex: 'B8',
        candidateEncodingStart: 0x1FFF,
        candidateEncodingStartHex: '0x00001FFF',
        candidateEncodingLength: 5,
        instructionLength: 5,
        isWhitelistedShape: true,
        isNegativeContext: false,
        explanation: 'B8 mov reg imm32',
      };

      const candId = 'MK1.EXE:0x0002C3FE';
      const pos: PhysicalPositionContextClassification = {
        sourceFileOffset: 0x2000,
        sourceFileOffsetHex: '0x00002000',
        sourceRegionId: 'obj1',
        sourceRegionClass: 'LOADED_OBJECT_PAGE',
        sourceObjectNumber: 1,
        sourceLoadedAddressHex: '0x00012000',
        matchedUint32Value: 0x00012000,
        matchedUint32Hex: '0x00012000',
        logicalMatchesCount: 1,
        associatedCandidates: [
          {
            candidateId: candId,
            representationKind: 'object-relative-payload',
            targetCandidateByteStartHex: '0x0002C3FE',
            targetCandidateRegionId: 'obj1',
            targetObjectNumber: 1,
          },
        ],
        contextBytesHex: '00',
        trackA_x86Shape: shape,
        shapeStatus: 'single-whitelisted-shape',
        matchingShapes: [shape],
        clusterId: null,
        isClustered: false,
      };

      const cand = createMockCandidateProfile(candId, 0x2C3FE, 1, 0x0003C3FE, 0x0003C400);
      const res = executePaletteOperandUseReconnaissance(
        callBuf,
        mockReport,
        createMockContextResult([pos]),
        createMockFusionResult([cand]),
        createMockChainResult([]),
      );

      expect(res.status).toBe('SUCCESS');
      const obs = res.fixtureObservations.join(' ');
      expect(obs).toContain('Mathematical compatibility');
      expect(obs).toContain('no relocation-base adjustment was observed');
      expect(obs).not.toContain('Addition of the Object 1 relocation base was observed in');
    });

    it('synthesizes and verifies a trace performing a supported relocation-base adjustment', () => {
      // Buffer with:
      // At 0x1FFF: MOV EAX, 0x00012000 (site at 0x2000)
      // At 0x2004: ADD EAX, 0x00010000 (Group 1 ALU 0x81 ModRM 0xC0 + imm32 = 0x00010000 = relocBase)
      // At 0x200A: RET (0xC3)
      const callBuf = new Uint8Array(0x4000);
      callBuf[0x1FFF] = 0xB8;
      callBuf[0x2000] = 0x00;
      callBuf[0x2001] = 0x20;
      callBuf[0x2002] = 0x01;
      callBuf[0x2003] = 0x00;

      // 0x81 /0 imm32 (ADD EAX, 0x00010000)
      callBuf[0x2004] = 0x81;
      callBuf[0x2005] = 0xC0;
      callBuf[0x2006] = 0x00;
      callBuf[0x2007] = 0x00;
      callBuf[0x2008] = 0x01;
      callBuf[0x2009] = 0x00;

      callBuf[0x200A] = 0xC3; // RET

      const candId = 'MK1.EXE:0x0002C3FE';
      const cand = createMockCandidateProfile(candId, 0x2C3FE, 1, 0x0003C3FE, 0x0003C400);

      // Verify microDecoder straightLineTrace directly
      const directTrace = traceStraightLineSeedUse(
        callBuf,
        0x2000,
        0x1FFF,
        5,
        'MOV EAX, 0x00012000',
        'EAX',
        0x00012000,
        cand,
        mockReport,
      );

      expect(directTrace.seedRelocationBaseAdjusted).toBe(true);
      expect(directTrace.seedAffineAdjusted).toBe(true);
      expect(directTrace.events.some((e) => e.eventType === 'relocation-base-adjustment')).toBe(true);

      const shape: X86ShapeMatchDetails = {
        shapeClass: 'mov-r32-imm32',
        mnemonicHint: 'MOV',
        opcodeBytesHex: 'B8',
        candidateEncodingStart: 0x1FFF,
        candidateEncodingStartHex: '0x00001FFF',
        candidateEncodingLength: 5,
        instructionLength: 5,
        isWhitelistedShape: true,
        isNegativeContext: false,
        explanation: 'B8 mov reg imm32',
      };

      const pos: PhysicalPositionContextClassification = {
        sourceFileOffset: 0x2000,
        sourceFileOffsetHex: '0x00002000',
        sourceRegionId: 'obj1',
        sourceRegionClass: 'LOADED_OBJECT_PAGE',
        sourceObjectNumber: 1,
        sourceLoadedAddressHex: '0x00012000',
        matchedUint32Value: 0x00012000,
        matchedUint32Hex: '0x00012000',
        logicalMatchesCount: 1,
        associatedCandidates: [
          {
            candidateId: candId,
            representationKind: 'object-relative-payload',
            targetCandidateByteStartHex: '0x0002C3FE',
            targetCandidateRegionId: 'obj1',
            targetObjectNumber: 1,
          },
        ],
        contextBytesHex: '00',
        trackA_x86Shape: shape,
        shapeStatus: 'single-whitelisted-shape',
        matchingShapes: [shape],
        clusterId: null,
        isClustered: false,
      };

      const res = executePaletteOperandUseReconnaissance(
        callBuf,
        mockReport,
        createMockContextResult([pos]),
        createMockFusionResult([cand]),
        createMockChainResult([]),
      );

      expect(res.status).toBe('SUCCESS');
      expect(res.globalSummary.seedTracesRelocationBaseAdjusted).toBe(1);
      expect(res.seedTraceEventSummary.seedRelocationBaseAdjusted).toBe(1);
      const obs = res.fixtureObservations.join(' ');
      expect(obs).toContain('Addition of the Object 1 relocation base was observed in 1 seed trace.');
    });

    it('fails deterministically on missing or zero pageSize in executable report', () => {
      const badReport = createMockReport({
        parsedHeader: {
          ...mockReport.parsedHeader,
          pageSize: 0,
        },
      });
      const res = executePaletteOperandUseReconnaissance(
        new Uint8Array(0x1000),
        badReport,
        createMockContextResult([]),
        createMockFusionResult([]),
        createMockChainResult([]),
      );
      expect(res.status).toBe('FAILED');
      expect(res.failedStage).toBe('upstream-validation');
      expect(res.failureReason).toContain('pageSize');
    });

    it('fails deterministically when upstream stage results are not SUCCESS', () => {
      const failedContext = {
        ...createMockContextResult([]),
        status: 'FAILED' as const,
      };
      const res = executePaletteOperandUseReconnaissance(
        new Uint8Array(0x1000),
        mockReport,
        failedContext,
        createMockFusionResult([]),
        createMockChainResult([]),
      );
      expect(res.status).toBe('FAILED');
      expect(res.failedStage).toBe('upstream-validation');
      expect(res.failureReason).toContain('B.2 Occurrence Context result missing or status not SUCCESS');
    });

    it('fails deterministically when site physical offset does not resolve to an authoritative topology region', () => {
      const shape: X86ShapeMatchDetails = {
        shapeClass: 'mov-r32-imm32',
        mnemonicHint: 'MOV',
        opcodeBytesHex: 'B8',
        candidateEncodingStart: 0x1FFF,
        candidateEncodingStartHex: '0x00001FFF',
        candidateEncodingLength: 5,
        instructionLength: 5,
        isWhitelistedShape: true,
        isNegativeContext: false,
        explanation: 'B8 mov reg imm32',
      };

      const unmappedPos: PhysicalPositionContextClassification = {
        sourceFileOffset: 0x2000,
        sourceFileOffsetHex: '0x00002000',
        sourceRegionId: 'obj1',
        sourceRegionClass: 'LOADED_OBJECT_PAGE',
        sourceObjectNumber: 1,
        sourceLoadedAddressHex: '0x00012000',
        matchedUint32Value: 0x00012000,
        matchedUint32Hex: '0x00012000',
        logicalMatchesCount: 1,
        associatedCandidates: [
          {
            candidateId: 'cand-0',
            representationKind: 'object-relative-payload',
            targetCandidateByteStartHex: '0x0002C3FE',
            targetCandidateRegionId: 'obj1',
            targetObjectNumber: 1,
          },
        ],
        contextBytesHex: '00',
        trackA_x86Shape: shape,
        shapeStatus: 'single-whitelisted-shape',
        matchingShapes: [shape],
        clusterId: null,
        isClustered: false,
      };

      const noRegionReport = createMockReport({
        topology: {
          ...mockReport.topology,
          regions: [], // No regions
        },
      });

      const res = executePaletteOperandUseReconnaissance(
        new Uint8Array(0x4000),
        noRegionReport,
        createMockContextResult([unmappedPos]),
        createMockFusionResult([createMockCandidateProfile('cand-0')]),
        createMockChainResult([]),
      );

      expect(res.status).toBe('FAILED');
      expect(res.failedStage).toBe('direct-site-processing');
      expect(res.failureReason).toContain('does not resolve to an authoritative topology region');
    });
  });
});
