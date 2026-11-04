import { describe, it, expect } from 'vitest';
import {
  deriveTargetEntrySeedClass,
  deriveVerifiedCallerRecords,
  deriveCallerReturnRelations,
  captureRawTargetWindow,
  qualifyTargetBoundary,
  traceTargetEntryExecution,
  crossReferenceFinalBoundaryTargetWithB8,
  scanRawE8ExactTargetNullModel,
  compareCallerSiteLocalContext,
  executePaletteTargetEntryReconnaissance,
  createMK1PaletteTargetEntryExport,
} from '../games/mk1/research/paletteTargetEntryReconnaissance';
import {
  MK1PaletteOperandUseResult,
  MK1OperandInterpretationRecord,
  MK1OperandUseReconciliation,
  MK1CandidateOperandUseSummary,
} from '../games/mk1/research/paletteOperandUseReconnaissanceTypes';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import {
  LEHeader,
  LEObjectEntry,
  LEPageMapEntry,
} from '../core/executable/le/leTypes';

function createMockLayoutReport(): MK1ExecutableLayoutReport {
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
    modulePageCount: 80,
    entryObject: 1,
    entryEip: 0x1000,
    entryEipHex: '0x00001000',
    stackObject: 1,
    stackEsp: 0x8000,
    stackEspHex: '0x00008000',
    pageSize: 4096,
    bytesOnLastPage: 4096,
    fixupSectionSize: 0,
    loaderSectionSize: 0,
    objectTableRelativeOffset: 0,
    objectTableFileOffset: 0,
    objectCount: 1,
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
    dataPagesFileOffset: 0x10000,
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
        fileStart: 0x10000,
        fileEnd: 0x60000,
        byteLength: 0x50000,
        objectPageStart: 0,
        pageCount: 80,
      },
    ],
    mappedPageCount: 80,
    zeroFilledPageCount: 0,
  };

  const pageMap: LEPageMapEntry[] = Array.from({ length: 80 }, (_, i) => ({
    pageMapIndex: i + 1,
    physicalPageNumber: i + 1,
    rawBytes: [0, 0, 0],
    rawFlags: 0,
    pageType: 'valid',
    physicalFileStart: 0x10000 + i * 4096,
    physicalByteLength: 4096,
  }));

  return {
    timestamp: '2026-09-13T00:00:00.000Z',
    exePath: 'MK1.EXE',
    exeSize: 0x80000,
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
    objects: [obj1],
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
    ],
    pageMap,
    pageMapDiagnostics: {
      totalEntries: 80,
      validEntries: 80,
      mappedValidEntries: 80,
      iteratedEntries: 0,
      invalidEntries: 0,
      zeroFilledEntries: 0,
      rangeEntries: 0,
      unknownEntries: 0,
      minDecodedPhysicalPageNumber: 1,
      maxDecodedPhysicalPageNumber: 80,
      entries: [],
    },
    topology: {
      totalFileSize: 0x80000,
      totalFileSizeHex: '0x00080000',
      boundaries: {
        highestFileBackedPageEnd: 0x60000,
        highestFileBackedPageEndHex: '0x00060000',
        headerDerivedPageDataEnd: 0x60000,
        headerDerivedPageDataEndHex: '0x00060000',
        discrepancyBytes: 0,
        discrepancyExplanation: 'None',
      },
      postModuleTail: {
        startOffset: 0x60000,
        startOffsetHex: '0x00060000',
        endOffset: 0x80000,
        endOffsetHex: '0x00080000',
        byteLength: 0x20000,
        percentageOfTotalExecutable: 25,
        containedAnchorNames: [],
        purpose: 'UNKNOWN',
        notes: '',
      },
      regions: [
        {
          regionId: 'obj1',
          name: 'Object 1 Code',
          fileStart: 0x10000,
          fileStartHex: '0x00010000',
          fileEnd: 0x60000,
          fileEndHex: '0x00060000',
          byteLength: 0x50000,
          percentageOfFile: 62.5,
          regionClass: 'le-object-file-backed',
          objectNumber: 1,
          purpose: 'executable code',
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
  };
}

function createMockB8Result(): MK1PaletteOperandUseResult {
  const interp1: MK1OperandInterpretationRecord = {
    interpretationId: 'interp-1',
    sourceKind: 'direct-candidate-first-hop',
    siteFileOffset: 0x2c410,
    siteFileOffsetHex: '0x0002C410',
    siteObjectNumber: 1,
    siteObjectOffset: 0x1c410,
    siteObjectOffsetHex: '0x0001C410',
    siteLoadedAddress: 0x2c410,
    siteLoadedAddressHex: '0x0002C410',
    siteRegionId: 'obj1',
    shapeClass: 'mov-r32-imm32',
    mnemonicHint: 'MOV EAX, imm32',
    instructionFileOffset: 0x2c410,
    instructionFileOffsetHex: '0x0002C410',
    instructionLength: 5,
    opcodeBytesHex: 'B8',
    operandFieldOffset: 0x2c411,
    operandFieldOffsetHex: '0x0002C411',
    operandUint32Value: 0x00002012,
    operandUint32Hex: '0x00002012',
    destinationRegister: 'EAX',
    hasSegmentOverride: false,
    associatedCandidateId: 'MK1.EXE:0x0002C410',
    associatedRepresentationKind: 'object-relative-payload',
    targetCandidateLoadedStructureHex: '0x0002C410',
    targetCandidateLoadedPayloadHex: '0x00012012',
    targetCandidateObjectNumber: 1,
    semanticClass: 'register-immediate-seed',
    segmentOverridePrefixHex: null,
    dereferenceShapePresent: false,
    dereferencePerformed: false,
    memoryAccessEncodedByInterpretation: false,
    directLinearResolution: 'exact-associated-payload-linear',
    directLinearResolvedObjectNumber: 1,
    directLinearResolvedObjectOffset: 0x2012,
    directLinearResolvedObjectOffsetHex: '0x00002012',
    directLinearResolvedPhysicalOffset: 0x12012,
    directLinearResolvedPhysicalOffsetHex: '0x00012012',
    directLinearResolvedRegionId: 'obj1',
    directLinearMatchesAssociatedTarget: true,
    objectRelativeCompatibility: {
      isObjectRelativeOperand: true,
      operandUint32Value: 0x00002012,
      operandUint32Hex: '0x00002012',
      associatedRepresentationKind: 'object-relative-payload',
      targetCandidateObjectNumber: 1,
      targetObjectRelocationBase: 0x00010000,
      targetObjectRelocationBaseHex: '0x00010000',
      associatedTargetLoadedAddress: 0x00012012,
      associatedTargetLoadedAddressHex: '0x00012012',
      requiredBaseToReachTargetLoadedAddress: 0x00010000,
      requiredBaseHex: '0x00010000',
      requiredBaseEqualsTargetObjectRelocationBase: true,
      equalsAssociatedObjectRelativeStructure: false,
      equalsAssociatedObjectRelativePayload: true,
    },
    seedTraceStatus: 'seed-traced-to-call',
    seedTrace: {
      seedSiteOffset: 0x2c410,
      seedSiteOffsetHex: '0x0002C410',
      seedInstructionOffset: 0x2c410,
      seedInstructionOffsetHex: '0x0002C410',
      seedInstructionLength: 5,
      seedInstructionMnemonic: 'MOV EAX, 0x00002012',
      seedRegister: 'EAX',
      initialSeedValue: 0x00002012,
      initialSeedValueHex: '0x00002012',
      status: 'seed-traced-to-call',
      stopReason: 'call-boundary',
      boundaryType: 'call',
      seedLiveAtBoundary: true,
      traceStartOffset: 0x2c410,
      traceStartOffsetHex: '0x0002C410',
      traceEndOffset: 0x2c41a,
      traceEndOffsetHex: '0x0001C41A',
      totalBytesExamined: 10,
      totalInstructionsDecoded: 2,
      stopOffset: 0x2c415,
      stopOffsetHex: '0x0002C415',
      seedCopied: false,
      seedAffineAdjusted: false,
      seedRelocationBaseAdjusted: false,
      seedUsedAsMemoryBase: false,
      seedUsedAsMemoryIndex: false,
      seedPartialMemoryAddressUse: false,
      seedTargetCoordinateValueReached: false,
      seedTargetCompatibleMemoryAddressObserved: false,
      seedPushed: false,
      seedOverwritten: false,
      seedLiveAtCallBoundary: true,
      instructions: [],
      events: [],
      callBoundaryTargetRecon: {
        sourceInstructionPhysicalOffset: 0x2c415,
        sourceInstructionPhysicalOffsetHex: '0x0002C415',
        sourceObjectNumber: 1,
        sourceObjectOffset: 0x1c415,
        sourceObjectOffsetHex: '0x0001C415',
        sourceLoadedLinearCandidate: 0x2c415,
        sourceLoadedLinearCandidateHex: '0x0002C415',
        rel32Displacement: 0x13cac,
        rel32DisplacementHex: '+0x00013CAC',
        nextInstructionObjectOffset: 0x000300c7,
        nextInstructionObjectOffsetHex: '0x000300C7',
        targetObjectOffset: 0x000300c8,
        targetObjectOffsetHex: '0x000300C8',
        targetLoadedLinearCandidate: 0x000400c8,
        targetLoadedLinearCandidateHex: '0x000400C8',
        targetOffsetWithinSourceObjectVirtualRange: true,
        targetOffsetWithinSourceObjectFileBackedRange: true,
        targetLinearRegionId: 'obj1',
        targetLinearRegionClass: 'le-object-file-backed',
        targetLinearObjectNumber: 1,
        targetLinearObjectFlags: 0x2045,
        targetLinearObjectReadable: true,
        targetLinearObjectWritable: false,
        targetLinearObjectExecutable: true,
        targetLinearObjectOffset: 0x000300c8,
        targetLinearObjectOffsetHex: '0x000300C8',
        targetLinearPhysicalBackingOffset: 0x000400c8,
        targetLinearPhysicalBackingOffsetHex: '0x000400C8',
        physicalBackingAvailable: true,
        targetTopologyClassification: 'target-offset-within-source-object',
      },
    },
  };

  const interp2: MK1OperandInterpretationRecord = {
    interpretationId: 'interp-2',
    sourceKind: 'direct-candidate-first-hop',
    siteFileOffset: 0x2c420,
    siteFileOffsetHex: '0x0002C420',
    siteObjectNumber: 1,
    siteObjectOffset: 0x1c420,
    siteObjectOffsetHex: '0x0001C420',
    siteLoadedAddress: 0x2c420,
    siteLoadedAddressHex: '0x0002C420',
    siteRegionId: 'obj1',
    shapeClass: 'mov-r32-imm32',
    mnemonicHint: 'MOV EAX, imm32',
    instructionFileOffset: 0x2c420,
    instructionFileOffsetHex: '0x0002C420',
    instructionLength: 5,
    opcodeBytesHex: 'B8',
    operandFieldOffset: 0x2c421,
    operandFieldOffsetHex: '0x0002C421',
    operandUint32Value: 0x00002012,
    operandUint32Hex: '0x00002012',
    destinationRegister: 'EAX',
    hasSegmentOverride: false,
    associatedCandidateId: 'MK1.EXE:0x0002C410',
    associatedRepresentationKind: 'object-relative-payload',
    targetCandidateLoadedStructureHex: '0x0002C410',
    targetCandidateLoadedPayloadHex: '0x00012012',
    targetCandidateObjectNumber: 1,
    semanticClass: 'register-immediate-seed',
    segmentOverridePrefixHex: null,
    dereferenceShapePresent: false,
    dereferencePerformed: false,
    memoryAccessEncodedByInterpretation: false,
    directLinearResolution: 'exact-associated-payload-linear',
    directLinearResolvedObjectNumber: 1,
    directLinearResolvedObjectOffset: 0x2012,
    directLinearResolvedObjectOffsetHex: '0x00002012',
    directLinearResolvedPhysicalOffset: 0x12012,
    directLinearResolvedPhysicalOffsetHex: '0x00012012',
    directLinearResolvedRegionId: 'obj1',
    directLinearMatchesAssociatedTarget: true,
    objectRelativeCompatibility: {
      isObjectRelativeOperand: true,
      operandUint32Value: 0x00002012,
      operandUint32Hex: '0x00002012',
      associatedRepresentationKind: 'object-relative-payload',
      targetCandidateObjectNumber: 1,
      targetObjectRelocationBase: 0x00010000,
      targetObjectRelocationBaseHex: '0x00010000',
      associatedTargetLoadedAddress: 0x00012012,
      associatedTargetLoadedAddressHex: '0x00012012',
      requiredBaseToReachTargetLoadedAddress: 0x00010000,
      requiredBaseHex: '0x00010000',
      requiredBaseEqualsTargetObjectRelocationBase: true,
      equalsAssociatedObjectRelativeStructure: false,
      equalsAssociatedObjectRelativePayload: true,
    },
    seedTraceStatus: 'seed-traced-to-call',
    seedTrace: {
      seedSiteOffset: 0x2c420,
      seedSiteOffsetHex: '0x0002C420',
      seedInstructionOffset: 0x2c420,
      seedInstructionOffsetHex: '0x0002C420',
      seedInstructionLength: 5,
      seedInstructionMnemonic: 'MOV EAX, 0x00002012',
      seedRegister: 'EAX',
      initialSeedValue: 0x00002012,
      initialSeedValueHex: '0x00002012',
      status: 'seed-traced-to-call',
      stopReason: 'call-boundary',
      boundaryType: 'call',
      seedLiveAtBoundary: true,
      traceStartOffset: 0x2c420,
      traceStartOffsetHex: '0x0002C420',
      traceEndOffset: 0x2c42a,
      traceEndOffsetHex: '0x0001C42A',
      totalBytesExamined: 10,
      totalInstructionsDecoded: 2,
      stopOffset: 0x2c425,
      stopOffsetHex: '0x0002C425',
      seedCopied: false,
      seedAffineAdjusted: false,
      seedRelocationBaseAdjusted: false,
      seedUsedAsMemoryBase: false,
      seedUsedAsMemoryIndex: false,
      seedPartialMemoryAddressUse: false,
      seedTargetCoordinateValueReached: false,
      seedTargetCompatibleMemoryAddressObserved: false,
      seedPushed: false,
      seedOverwritten: false,
      seedLiveAtCallBoundary: true,
      instructions: [],
      events: [],
      callBoundaryTargetRecon: {
        sourceInstructionPhysicalOffset: 0x2c425,
        sourceInstructionPhysicalOffsetHex: '0x0002C425',
        sourceObjectNumber: 1,
        sourceObjectOffset: 0x1c425,
        sourceObjectOffsetHex: '0x0001C425',
        sourceLoadedLinearCandidate: 0x2c425,
        sourceLoadedLinearCandidateHex: '0x0002C425',
        rel32Displacement: 0x13c9c,
        rel32DisplacementHex: '+0x00013C9C',
        nextInstructionObjectOffset: 0x000300fe,
        nextInstructionObjectOffsetHex: '0x000300FE',
        targetObjectOffset: 0x000300c8,
        targetObjectOffsetHex: '0x000300C8',
        targetLoadedLinearCandidate: 0x000400c8,
        targetLoadedLinearCandidateHex: '0x000400C8',
        targetOffsetWithinSourceObjectVirtualRange: true,
        targetOffsetWithinSourceObjectFileBackedRange: true,
        targetLinearRegionId: 'obj1',
        targetLinearRegionClass: 'le-object-file-backed',
        targetLinearObjectNumber: 1,
        targetLinearObjectFlags: 0x2045,
        targetLinearObjectReadable: true,
        targetLinearObjectWritable: false,
        targetLinearObjectExecutable: true,
        targetLinearObjectOffset: 0x000300c8,
        targetLinearObjectOffsetHex: '0x000300C8',
        targetLinearPhysicalBackingOffset: 0x000400c8,
        targetLinearPhysicalBackingOffsetHex: '0x000400C8',
        physicalBackingAvailable: true,
        targetTopologyClassification: 'target-offset-within-source-object',
      },
    },
  };

  const candSummary: MK1CandidateOperandUseSummary = {
    candidateId: 'MK1.EXE:0x0002C410',
    targetPhysicalAddressHex: '0x0002C410',
    sourceClass: 'direct',
    physicalStructureOffsetHex: '0x0002C410',
    physicalPayloadOffsetHex: '0x0002C412',
    loadedLinearStructureCandidateHex: '0x0002C410',
    loadedLinearPayloadCandidateHex: '0x00012012',
    directSiteCount: 2,
    interpretationCount: 2,
    associatedDirectSiteCount: 2,
    associatedInterpretationCount: 2,
    associatedSeedCount: 2,
    associatedCallBoundaryCount: 2,
    relocationAdjustmentsObserved: 0,
    shapeHistogram: {},
    semanticHistogram: {},
    representationHistogram: {},
    directLinearOutcomes: {},
    objectRelativeBaseMatches: 2,
    seedCount: 2,
    traceStopReasons: {},
    memoryUseCounts: {
      memoryBase: 0,
      memoryIndex: 0,
      partialMemory: 0,
      targetCompatibleMemory: 0,
    },
    relocationAdjustmentCounts: 0,
    callBoundaryCount: 2,
    distinctCallBoundaryTargets: ['0x000400C8'],
    sourceObjectTargetRangeDistribution: {
      withinSourceObjectVirtualRange: 2,
      withinSourceObjectFileBackedRange: 2,
      outsideSourceObjectVirtualRange: 0,
    },
  };

  const reconciliation: MK1OperandUseReconciliation = {
    b2PositivePhysicalSitesInput: 2,
    b2PositiveShapeInterpretationsInput: 2,
    b8DirectPhysicalSitesProduced: 2,
    b8DirectInterpretationsProduced: 2,
    b7PositiveSecondOrderSitesInput: 0,
    b8TwoHopSitesProduced: 0,
    b8TwoHopInterpretationsProduced: 0,
    directSiteIdsMissing: [],
    unexpectedDirectSiteIds: [],
    shapeInterpretationsMissing: [],
    candidateAssociationsMissing: [],
    seedTraceEligibleInterpretations: 2,
    seedTraceResultsProduced: 2,
    callBoundaryTraces: 2,
    callBoundarySummariesProduced: 1,
    controlsInjectedIntoPositiveCounts: 0,
    allDirectSitesAccountedFor: true,
    allShapeInterpretationsAccountedFor: true,
    allSeedTracesAccountedFor: true,
    allCallBoundariesAccountedFor: true,
    candidateSummariesReconciled: true,
    candidateSummaryDirectSitesReconciled: true,
    candidateSummaryInterpretationsReconciled: true,
    candidateSummarySeedsReconciled: true,
    candidateSummaryCallsReconciled: true,
    physicalCandidateCoordinatesReconciled: true,
    decisionPatternTableReconciled: true,
    relocationObservationCountsReconciled: true,
    fixtureObservationsDerived: true,
    derivedEvidenceReconciled: true,
    allReconciled: true,
  };

  return {
    status: 'SUCCESS',
    metadata: {
      operationId: 'test-b8-op',
      timestamp: '2026-09-13T00:00:00.000Z',
      durationMs: 120,
      milestone: '1E.2B.8a',
    },
    fixture: {
      exePath: 'MK1.EXE',
      exeSize: 0x80000,
      exeSizeHex: '0x00080000',
    },
    traceConfiguration: {
      maxBytes: 48,
      maxInstructions: 12,
      straightLineOnly: true,
      followsCalls: false,
      followsBranches: false,
      microDecoder: true,
      stopOnUnsupported: true,
      addressMode: '32-bit',
      objectConstraint: 'Object 1',
    },
    upstreamSummary: {
      layoutAvailable: true,
      b2Status: 'SUCCESS',
      b2PositivePhysicalSites: 2,
      b2PositiveShapeInterpretations: 2,
      b6Status: 'SUCCESS',
      b6CandidateCount: 1,
      b7Status: 'SUCCESS',
      b7PositiveSecondHopReferrerCount: 0,
    },
    reconciliation,
    globalSummary: {
      totalUniquePhysicalSites: 2,
      directCandidateFirstHopSites: 2,
      twoHopCodeFacingSites: 0,
      totalPositiveInterpretations: 2,
      directPositiveInterpretations: 2,
      twoHopPositiveInterpretations: 0,
      semanticCounts: {
        'register-immediate-seed': 2,
        'push-immediate-value': 0,
        'accumulator-arithmetic-immediate': 0,
        'direct-memory-load-address': 0,
        'direct-memory-store-address': 0,
        'lea-address-computation': 0,
        'other-whitelisted-immediate': 0,
      },
      linearResolutionCounts: {
        'exact-associated-payload-linear': 2,
        'exact-associated-structure-linear': 0,
        'resolves-other-loaded-location': 0,
        'linear-address-unmapped': 0,
        'segment-override-unresolved': 0,
        'not-applicable-non-address-operand': 0,
      },
      directLinearMatchesTargetCount: 2,
      directLinearResolvesOtherCount: 0,
      directLinearUnmappedCount: 0,
      objectRelativeCount: 2,
      objectRelativeRelocationBaseMatchedCount: 2,
      seedTracesAttempted: 2,
      seedTracesReachingCall: 2,
      seedTracesReachingJump: 0,
      seedTracesReachingBranch: 0,
      seedTracesReachingReturn: 0,
      seedTracesReachingMemoryAccess: 0,
      seedTracesOverwrittenBeforeUse: 0,
      seedTracesUnsupportedOpcode: 0,
      seedTracesSizeOverride: 0,
      seedTracesMaxBytes: 0,
      seedTracesMaxInstructions: 0,
      seedTracesTargetCompatibleMemoryAddress: 0,
      seedTracesRelocationBaseAdjusted: 0,
    },
    addressSpaceMatrix: {
      rows: ['physical', 'object-relative', 'linear', 'site-physical'],
      columns: ['register-immediate', 'push-immediate', 'arithmetic-immediate', 'direct-load', 'direct-store', 'lea'],
      matrix: {},
    },
    shapeSummary: {},
    operandSemanticSummary: {
      'register-immediate-seed': 2,
      'push-immediate-value': 0,
      'accumulator-arithmetic-immediate': 0,
      'direct-memory-load-address': 0,
      'direct-memory-store-address': 0,
      'lea-address-computation': 0,
      'other-whitelisted-immediate': 0,
    },
    seedTraceEventSummary: {
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
      seedLiveAtCallBoundary: 2,
    },
    seedTraceStopReasonSummary: { 'call-boundary': 2 },
    callBoundarySummary: {
      callBoundaryCount: 2,
      distinctCallTargetCount: 1,
      callTargetsWithinSourceObjectVirtualRange: 2,
      callTargetsWithinSourceObjectFileBackedRange: 2,
      callTargetsOutsideSourceObjectVirtualRange: 0,
      numericTargetsResolvingSourceObject: 2,
      numericTargetsResolvingOtherObject: 0,
      numericTargetsUnmapped: 0,
    },
    callBoundaryTargetGroups: [],
    localSeedUseSignatureGroups: [],
    candidateSummaries: [candSummary],
    twoHopTargetSummaries: [],
    sites: [],
    interpretations: [interp1, interp2],
    boundedTraceDetails: [],
    controls: {
      b2NegativeRelativeControlsCount: 0,
      b7NegativeSecondOrderRelativeControlsCount: 0,
      control0x9C914Present: false,
      controlsExcludedFromPositiveCounts: true,
      details: [],
    },
    decisionPatternTable: [],
    interpretationCaveats: [],
    fixtureObservations: [],
  };
}

describe('Pass 1E.2B.9a — Target Entry Evidence Contract Hardening', () => {
  // Test 1: Derives exact seed class from authoritative B.8 result
  it('1. derives exact seed class from authoritative B.8 result without fallbacks', () => {
    const report = createMockLayoutReport();
    const b8Result = createMockB8Result();
    const seedClass = deriveTargetEntrySeedClass(b8Result, 'MK1.EXE:0x0002C410', report);

    expect(seedClass.candidateId).toBe('MK1.EXE:0x0002C410');
    expect(seedClass.seedRegister).toBe('EAX');
    expect(seedClass.seedValue).toBe(0x00002012);
    expect(seedClass.seedValueHex).toBe('0x00002012');
    expect(seedClass.targetLinear).toBe(0x000400c8);
    expect(seedClass.qualifyingCallerCount).toBe(2);
    expect(seedClass.callerSiteOffsets).toEqual([0x2c410, 0x2c420]);
    expect(seedClass.candidateLoadedStructure).toBe(0x0002c410);
    expect(seedClass.candidateLoadedPayload).toBe(0x00012012);
    expect(seedClass.relocationBase).toBe(0x00010000);
  });

  // Test 2: Fails if upstream B.8 status is not SUCCESS
  it('2. fails if upstream B.8 result status is not SUCCESS', () => {
    const report = createMockLayoutReport();
    const b8Result = createMockB8Result();
    b8Result.status = 'FAILED';

    expect(() => deriveTargetEntrySeedClass(b8Result, 'MK1.EXE:0x0002C410', report)).toThrow(
      /Upstream B\.8 result status is FAILED; expected SUCCESS/,
    );
  });

  // Test 3: Fails if upstream B.8 allReconciled is false
  it('3. fails if upstream B.8 reconciliation.allReconciled is false', () => {
    const report = createMockLayoutReport();
    const b8Result = createMockB8Result();
    b8Result.reconciliation.allReconciled = false;

    expect(() => deriveTargetEntrySeedClass(b8Result, 'MK1.EXE:0x0002C410', report)).toThrow(
      /reconciliation\.allReconciled is false/,
    );
  });

  // Test 4: Fails if upstream B.8 derivedEvidenceReconciled is false
  it('4. fails if upstream B.8 reconciliation.derivedEvidenceReconciled is false', () => {
    const report = createMockLayoutReport();
    const b8Result = createMockB8Result();
    b8Result.reconciliation.derivedEvidenceReconciled = false;

    expect(() => deriveTargetEntrySeedClass(b8Result, 'MK1.EXE:0x0002C410', report)).toThrow(
      /reconciliation\.derivedEvidenceReconciled is false/,
    );
  });

  // Test 5: Fails if candidate summary is missing from B.8
  it('5. fails if candidate summary is missing from B.8', () => {
    const report = createMockLayoutReport();
    const b8Result = createMockB8Result();
    b8Result.candidateSummaries = [];

    expect(() => deriveTargetEntrySeedClass(b8Result, 'MK1.EXE:0x0002C410', report)).toThrow(
      /Candidate summary not found in B\.8 for MK1\.EXE:0x0002C410/,
    );
  });

  // Test 6: Fails if Object 1 is missing or pageSize <= 0 in report
  it('6. fails if Object 1 or pageSize is missing or invalid in report', () => {
    const report = createMockLayoutReport();
    report.parsedHeader!.pageSize = 0;
    const b8Result = createMockB8Result();

    expect(() => deriveTargetEntrySeedClass(b8Result, 'MK1.EXE:0x0002C410', report)).toThrow(
      /Missing or invalid LE header pageSize/,
    );
  });

  // Test 7: Fails if target linear address has no physical file backing
  it('7. fails if target linear address has no physical file backing', () => {
    const report = createMockLayoutReport();
    const b8Result = createMockB8Result();
    b8Result.interpretations[0].seedTrace!.callBoundaryTargetRecon!.targetLinearPhysicalBackingOffset = null;

    expect(() => deriveTargetEntrySeedClass(b8Result, 'MK1.EXE:0x0002C410', report)).toThrow(
      /Target linear address has no physical file backing/,
    );
  });

  // Test 8: Derives verified caller records and return relations
  it('8. correctly derives verified caller records and return relations', () => {
    const report = createMockLayoutReport();
    const b8Result = createMockB8Result();
    const seedClass = deriveTargetEntrySeedClass(b8Result, 'MK1.EXE:0x0002C410', report);
    const callers = deriveVerifiedCallerRecords(b8Result, 'MK1.EXE:0x0002C410', seedClass);

    expect(callers.length).toBe(2);
    expect(callers[0].callerIndex).toBe(1);
    expect(callers[0].seedInstructionPhysicalOffset).toBe(0x2c410);
    expect(callers[1].callerIndex).toBe(2);
    expect(callers[1].seedInstructionPhysicalOffset).toBe(0x2c420);

    const buffer = new Uint8Array(0x80000);
    const relations = deriveCallerReturnRelations(buffer, callers, seedClass.targetLinear, report);
    expect(relations.length).toBe(2);
    expect(relations[0].callerIndex).toBe(1);
    expect(relations[0].targetMinusReturn).toBeDefined();
  });

  // Test 9: Qualifies target boundary coordinates, near-return RET ending cleanly, and raw target window
  it('9. qualifies target boundary coordinates, near-return RET ending cleanly at target, and raw window', () => {
    const report = createMockLayoutReport();
    const b8Result = createMockB8Result();
    const seedClass = deriveTargetEntrySeedClass(b8Result, 'MK1.EXE:0x0002C410', report);
    const callers = deriveVerifiedCallerRecords(b8Result, 'MK1.EXE:0x0002C410', seedClass);

    const buffer = new Uint8Array(0x80000);
    // Target physical offset: 0x400C8
    // Preceding byte at 0x400C7: C3 (RET)
    buffer[0x400c7] = 0xc3;
    // Instruction at target: E9 rel32 (JMP near 0x00053D33)
    buffer[0x400c8] = 0xe9;
    // rel32 = 0x00053D33 - (0x000400C8 + 5) = 0x00013C66
    const rel32 = 0x00013c66;
    buffer[0x400c9] = rel32 & 0xff;
    buffer[0x400ca] = (rel32 >> 8) & 0xff;
    buffer[0x400cb] = (rel32 >> 16) & 0xff;
    buffer[0x400cc] = (rel32 >> 24) & 0xff;

    const relations = deriveCallerReturnRelations(buffer, callers, seedClass.targetLinear, report);
    const boundary = qualifyTargetBoundary(buffer, seedClass, report, callers, relations);

    expect(boundary.targetLinearHex).toBe('0x000400C8');
    expect(boundary.objectOffsetHex).toBe('0x000300C8');
    expect(boundary.physicalOffset).toBe(0x400c8);
    expect(boundary.isAddressable).toBe(true);
    expect(boundary.isExecutable).toBe(true);
    expect(boundary.targetByteHex).toBe('0xE9');
    expect(boundary.nearReturnStartDecodes).toBe(true);
    expect(boundary.nearReturnInstruction).toBe('RET');
    expect(boundary.returnInstructionEndsAtTarget).toBe(true);
    expect(boundary.targetStartDecodes).toBe(true);
    expect(boundary.forwardFirstInstructionMnemonic).toBe('JMP 0x00053D33');
    expect(boundary.decodedRangesOverlap).toBe(false);
    expect(boundary.boundaryClassification).toBe('verified-instruction-boundary');

    const rawWindow = captureRawTargetWindow(buffer, boundary.physicalOffset);
    expect(rawWindow.targetByteHex).toBe('0xE9');
    expect(rawWindow.preBytesHex.length).toBeGreaterThan(0);
    expect(rawWindow.postBytesHex.length).toBeGreaterThan(0);
  });

  // Test 10: Micro-decoder straight line JMP stops at control boundary without following target
  it('10. straight line JMP stops at control boundary without following target', () => {
    const report = createMockLayoutReport();
    const buffer = new Uint8Array(0x80000);
    const startPhys = 0x400c8;

    // 0x400C8: E9 66 3C 01 00 (JMP 0x00053D33)
    buffer[startPhys] = 0xe9;
    const rel32 = 0x00013c66;
    buffer[startPhys + 1] = rel32 & 0xff;
    buffer[startPhys + 2] = (rel32 >> 8) & 0xff;
    buffer[startPhys + 3] = (rel32 >> 16) & 0xff;
    buffer[startPhys + 4] = (rel32 >> 24) & 0xff;

    const trace = traceTargetEntryExecution(
      buffer,
      startPhys,
      0x00002012,
      report,
      0x0002c410,
      0x00012012,
    );

    expect(trace.instructions.length).toBe(1);
    expect(trace.instructions[0].mnemonic).toBe('JMP near 0x00053D33');
    expect(trace.instructions[0].isBarrier).toBe(true);
    expect(trace.stopReason).toBe('unconditional-jump-boundary');
    expect(trace.disposition).toBe('preserved-to-control-boundary-without-read');
    expect(trace.seedEvents.seedLiveAtFinalBoundary).toBe(true);
    expect(trace.finalControlBoundary).not.toBeNull();
    expect(trace.finalControlBoundary!.boundaryType).toBe('jump');
    expect(trace.finalControlBoundary!.boundaryTargetLoadedAddressHex).toBe('0x00053D33');
  });

  // Test 11: Records DO NOT FOLLOW JMP 0x53D33 note and captures finalControlBoundary
  it('11. records DO NOT FOLLOW JMP 0x53D33 note in finalControlBoundary', () => {
    const report = createMockLayoutReport();
    const buffer = new Uint8Array(0x80000);
    const startPhys = 0x400c8;

    buffer[startPhys] = 0xe9;
    const rel32 = 0x00013c66;
    buffer[startPhys + 1] = rel32 & 0xff;
    buffer[startPhys + 2] = (rel32 >> 8) & 0xff;
    buffer[startPhys + 3] = (rel32 >> 16) & 0xff;
    buffer[startPhys + 4] = (rel32 >> 24) & 0xff;

    const trace = traceTargetEntryExecution(
      buffer,
      startPhys,
      0x00002012,
      report,
      0x0002c410,
      0x00012012,
    );

    expect(trace.finalControlBoundary?.notes).toContain(
      'DO NOT FOLLOW JMP 0x53D33. Control boundary recorded only. Destination body not decoded.',
    );
  });

  // Test 12: Cross-references final control boundary target with B.8 target groups
  it('12. cross references final control boundary target with B.8 target groups', () => {
    const b8Result = createMockB8Result();
    b8Result.callBoundaryTargetGroups = [
      {
        groupId: 'test-group-1',
        boundaryTargetLinear: 0x00053d33,
        boundaryTargetLinearHex: '0x00053D33',
        sourceKind: 'direct-candidate-first-hop',
        seedValue: 0x00001000,
        seedValueHex: '0x00001000',
        associatedTargetId: 'MK1.EXE:0x0002C410',
        destinationRegister: 'EAX',
        traceCount: 1,
        sourceSiteIds: ['site-1'],
        candidateIds: ['MK1.EXE:0x0002C410'],
        targetTopologyClassification: 'target-offset-within-source-object',
        targetLinearRegionId: 'obj1',
        targetLinearObjectNumber: 1,
        targetLinearPhysicalBackingOffsetHex: '0x00053D33',
        withinSourceObjectVirtualRange: true,
        withinSourceObjectFileBackedRange: true,
      },
    ];

    const crossRef = crossReferenceFinalBoundaryTargetWithB8(0x00053d33, b8Result);
    expect(crossRef.boundaryTargetAppearsInB8TargetGroups).toBe(true);
    expect(crossRef.matchingB8TargetGroupCount).toBe(1);
    expect(crossRef.matchingB8TargetGroups[0].targetAddressHex).toBe('0x00053D33');
    expect(crossRef.notes[1]).toContain('Pure coordinate equality only; does NOT imply shared functional purpose.');
  });

  // Test 13: Micro-decoder detects PUSH EAX as read-before-overwrite
  it('13. micro-decoder detects PUSH EAX as read-before-overwrite', () => {
    const report = createMockLayoutReport();
    const buffer = new Uint8Array(0x80000);
    const startPhys = 0x400c8;

    buffer[startPhys] = 0x50; // PUSH EAX
    buffer[startPhys + 1] = 0xc3; // RET

    const trace = traceTargetEntryExecution(
      buffer,
      startPhys,
      0x00002012,
      report,
      0x0002c410,
      0x00012012,
    );

    expect(trace.instructions.length).toBe(2);
    expect(trace.instructions[0].mnemonic).toBe('PUSH EAX');
    expect(trace.eaxReadBeforeOverwrite).toBe(true);
    expect(trace.eaxPushed).toBe(true);
    expect(trace.disposition).toBe('read-before-overwrite');
  });

  // Test 14: Micro-decoder detects memory base access [EAX + disp]
  it('14. micro-decoder detects memory base access [EAX + disp]', () => {
    const report = createMockLayoutReport();
    const buffer = new Uint8Array(0x80000);
    const startPhys = 0x400c8;

    buffer[startPhys] = 0x8b; // MOV EBX, [EAX + 4]
    buffer[startPhys + 1] = 0x58;
    buffer[startPhys + 2] = 0x04;
    buffer[startPhys + 3] = 0xc3; // RET

    const trace = traceTargetEntryExecution(
      buffer,
      startPhys,
      0x00002012,
      report,
      0x0002c410,
      0x00012012,
    );

    expect(trace.eaxReadBeforeOverwrite).toBe(true);
    expect(trace.eaxUsedAsMemoryBase).toBe(true);
    expect(trace.disposition).toBe('read-before-overwrite');
  });

  // Test 15: Micro-decoder tracks affine coordinate adjustment reaching candidate target
  it('15. micro-decoder tracks affine coordinate adjustment reaching candidate target', () => {
    const report = createMockLayoutReport();
    const buffer = new Uint8Array(0x80000);
    const startPhys = 0x400c8;

    // INC EAX
    buffer[startPhys] = 0x40;
    buffer[startPhys + 1] = 0xc3;

    const trace = traceTargetEntryExecution(
      buffer,
      startPhys,
      0x00012011, // incrementing reaches 0x00012012!
      report,
      0x0002c410,
      0x00012012,
    );

    expect(trace.eaxAffineAdjusted).toBe(true);
    expect(trace.eaxTargetCoordinateReached).toBe(true);
    expect(trace.instructions[0].registerStateAfter.EAX.exactValue).toBe(0x00012012);
  });

  // Test 16: Micro-decoder detects overwritten-before-read when EAX is overwritten first
  it('16. micro-decoder detects overwritten-before-read when EAX is overwritten first', () => {
    const report = createMockLayoutReport();
    const buffer = new Uint8Array(0x80000);
    const startPhys = 0x400c8;

    buffer[startPhys] = 0xb8; // MOV EAX, 0
    buffer[startPhys + 1] = 0x00;
    buffer[startPhys + 2] = 0x00;
    buffer[startPhys + 3] = 0x00;
    buffer[startPhys + 4] = 0x00;
    buffer[startPhys + 5] = 0xc3;

    const trace = traceTargetEntryExecution(
      buffer,
      startPhys,
      0x00002012,
      report,
      0x0002c410,
      0x00012012,
    );

    expect(trace.eaxOverwrittenBeforeRead).toBe(true);
    expect(trace.eaxReadBeforeOverwrite).toBe(false);
    expect(trace.disposition).toBe('overwritten-before-read');
  });

  // Test 17: Micro-decoder enforces max bytes (96) and max instructions (24) limits
  it('17. micro-decoder enforces max bytes (96) and max instructions (24) limits', () => {
    const report = createMockLayoutReport();
    const buffer = new Uint8Array(0x80000);
    const startPhys = 0x400c8;

    // Fill with 100 NOPs (0x90)
    for (let i = 0; i < 100; i++) {
      buffer[startPhys + i] = 0x90;
    }

    const trace = traceTargetEntryExecution(
      buffer,
      startPhys,
      0x00002012,
      report,
      0x0002c410,
      0x00012012,
      96,
      24,
    );

    expect(trace.instructions.length).toBe(24);
    expect(trace.stopReason).toBe('max-instructions-reached');
  });

  // Test 18: Scans raw E8 exact-target null model bounded to addressableFileBackedBytes and classifies matches
  it('18. scans raw E8 exact-target null model bounded to addressableFileBackedBytes and classifies matches', () => {
    const report = createMockLayoutReport();
    const buffer = new Uint8Array(0x80000);

    // Site 1: offset 0x20000 -> target 0x000400C8 (verified B.8 caller)
    buffer[0x20000] = 0xe8;
    const rel1 = 0x000200c3;
    buffer[0x20001] = rel1 & 0xff;
    buffer[0x20002] = (rel1 >> 8) & 0xff;
    buffer[0x20003] = (rel1 >> 16) & 0xff;
    buffer[0x20004] = (rel1 >> 24) & 0xff;

    // Site 2: offset 0x25000 -> target 0x000400C8 (raw only match)
    buffer[0x25000] = 0xe8;
    const rel2 = 0x0001b0c3;
    buffer[0x25001] = rel2 & 0xff;
    buffer[0x25002] = (rel2 >> 8) & 0xff;
    buffer[0x25003] = (rel2 >> 16) & 0xff;
    buffer[0x25004] = (rel2 >> 24) & 0xff;

    const nullModel = scanRawE8ExactTargetNullModel(buffer, 0x000400c8, report, [0x20000]);

    expect(nullModel.rawE8Rel32DecodableCount).toBe(2);
    expect(nullModel.rawExactTargetMatchCount).toBe(2);
    expect(nullModel.verifiedB8CallBoundaryMatchCount).toBe(1);
    expect(nullModel.rawOnlyExactTargetMatchCount).toBe(1);
    expect(nullModel.rawE8ExactTargetMatches[0].matchClassification).toBe('verified-b8-caller-boundary');
    expect(nullModel.rawE8ExactTargetMatches[1].matchClassification).toBe('raw-target-matching-e8-encoding');
    expect(nullModel.verifiedB8CallOffsetsExpected).toEqual(nullModel.verifiedB8CallOffsetsFound);
    expect(nullModel.verifiedB8CallOffsetsMissing.length).toBe(0);
  });

  // Test 19: Compares caller site local context windows with physical distances and verified core equality
  it('19. compares caller site local context windows with physical distances and verified core equality', () => {
    const report = createMockLayoutReport();
    const buffer = new Uint8Array(0x80000);

    buffer[0x2c410] = 0xb8;
    buffer[0x2c411] = 0x12;
    buffer[0x2c412] = 0x20;
    buffer[0x2c413] = 0x00;
    buffer[0x2c414] = 0x00;
    buffer[0x2c415] = 0xe8;
    const rel1 = 0x00013cae;
    buffer[0x2c416] = rel1 & 0xff;
    buffer[0x2c417] = (rel1 >> 8) & 0xff;
    buffer[0x2c418] = (rel1 >> 16) & 0xff;
    buffer[0x2c419] = (rel1 >> 24) & 0xff;

    buffer[0x2c420] = 0xb8;
    buffer[0x2c421] = 0x12;
    buffer[0x2c422] = 0x20;
    buffer[0x2c423] = 0x00;
    buffer[0x2c424] = 0x00;
    buffer[0x2c425] = 0xe8;
    const rel2 = 0x00013c9e;
    buffer[0x2c426] = rel2 & 0xff;
    buffer[0x2c427] = (rel2 >> 8) & 0xff;
    buffer[0x2c428] = (rel2 >> 16) & 0xff;
    buffer[0x2c429] = (rel2 >> 24) & 0xff;

    const b8Result = createMockB8Result();
    const seedClass = deriveTargetEntrySeedClass(b8Result, 'MK1.EXE:0x0002C410', report);
    const callers = deriveVerifiedCallerRecords(b8Result, 'MK1.EXE:0x0002C410', seedClass);

    const comp = compareCallerSiteLocalContext(buffer, callers, seedClass);

    expect(comp.verifiedCallerCount).toBe(2);
    expect(comp.seedInstructionPhysicalDistance).toBe(16);
    expect(comp.callInstructionPhysicalDistance).toBe(16);
    expect(comp.callerRecords.length).toBe(2);
    expect(comp.verifiedCoreSequenceEqual).toBe(true);
    expect((comp as unknown as Record<string, unknown>).similarity).toBeUndefined();
    expect((comp as unknown as Record<string, unknown>).caller1Sequence).toBeUndefined();
    expect((comp as unknown as Record<string, unknown>).caller2Sequence).toBeUndefined();
    expect((comp as unknown as Record<string, unknown>).normalizedSignature).toBeUndefined();
  });

  // Test 20: Executes full Pass 1E.2B.9a.3 pipeline with all 34 reconciled booleans and canonical export JSON
  it('20. executes full Pass 1E.2B.9a.3 pipeline with all 34 reconciled booleans and canonical export JSON', () => {
    const report = createMockLayoutReport();
    const b8Result = createMockB8Result();

    const buffer = new Uint8Array(0x80000);
    // Preceding byte: RET (0xC3)
    buffer[0x400c7] = 0xc3;
    // Target entry: JMP near 0x00053D33 (E9 66 3C 01 00)
    buffer[0x400c8] = 0xe9;
    const rel32 = 0x00013c66;
    buffer[0x400c9] = rel32 & 0xff;
    buffer[0x400ca] = (rel32 >> 8) & 0xff;
    buffer[0x400cb] = (rel32 >> 16) & 0xff;
    buffer[0x400cc] = (rel32 >> 24) & 0xff;

    // Callers in buffer
    buffer[0x2c410] = 0xb8;
    buffer[0x2c411] = 0x12;
    buffer[0x2c412] = 0x20;
    buffer[0x2c413] = 0x00;
    buffer[0x2c414] = 0x00;
    buffer[0x2c415] = 0xe8;
    // rel to 0x400C8:
    const relCall1 = 0x00013cae;
    buffer[0x2c416] = relCall1 & 0xff;
    buffer[0x2c417] = (relCall1 >> 8) & 0xff;
    buffer[0x2c418] = (relCall1 >> 16) & 0xff;
    buffer[0x2c419] = (relCall1 >> 24) & 0xff;

    buffer[0x2c420] = 0xb8;
    buffer[0x2c421] = 0x12;
    buffer[0x2c422] = 0x20;
    buffer[0x2c423] = 0x00;
    buffer[0x2c424] = 0x00;
    buffer[0x2c425] = 0xe8;
    const relCall2 = 0x00013c9e;
    buffer[0x2c426] = relCall2 & 0xff;
    buffer[0x2c427] = (relCall2 >> 8) & 0xff;
    buffer[0x2c428] = (relCall2 >> 16) & 0xff;
    buffer[0x2c429] = (relCall2 >> 24) & 0xff;

    const result = executePaletteTargetEntryReconnaissance(buffer, report, b8Result);

    expect(result.status).toBe('SUCCESS');
    expect(result.format).toBe('mk1_palette_target_entry_recon_v2');
    expect(result.reconciliation.allReconciled).toBe(true);

    // 34 reconciliation booleans check (+ allReconciled aggregate = 35 total)
    const reconciliationKeys = Object.keys(result.reconciliation).filter((k) => k !== 'allReconciled');
    expect(reconciliationKeys.length).toBe(34);
    expect(Object.values(result.reconciliation).every(Boolean)).toBe(true);

    expect(result.reconciliation.candidateObjectIdentityReconciled).toBe(true);
    expect(result.reconciliation.candidateCoordinatesReconciled).toBe(true);
    expect(result.reconciliation.callerMandatoryFieldsReconciled).toBe(true);
    expect(result.reconciliation.verifiedCallOpcodeBytesReconciled).toBe(true);
    expect(result.reconciliation.nearReturnSetDerivedFromVerifiedCallers).toBe(true);
    expect(result.reconciliation.nearReturnDecodeStatusesReconciled).toBe(true);
    expect(result.reconciliation.boundaryOverlapComputed).toBe(true);
    expect(result.reconciliation.authoritativeRegionReconciled).toBe(true);
    expect(result.reconciliation.verifiedB8CallOffsetSetReconciled).toBe(true);
    expect(result.reconciliation.verifiedCallerCoreSequencesReconciled).toBe(true);
    expect(result.fixtureObservations.length).toBeGreaterThan(0);

    const exportObj = createMK1PaletteTargetEntryExport(result);
    expect(exportObj.exportHeader.format).toBe('mk1_palette_target_entry_recon_v2');
    expect(exportObj.exportHeader.generator).toContain('Milestone 1 — Pass 1E.2B.9a.3');
    expect(exportObj.exportHeader.epistemicRules).toContain('CONTROL-TRANSFER TARGET RECORDED ONLY; TARGET BODY NOT FOLLOWED');
    expect(exportObj.exportHeader.epistemicRules.some((r) => r.includes('0x53D33'))).toBe(false);
  });

  // Test 21: Caller return relations derivation with near/distant classifications and decode statuses
  it('21. derives caller return relations with near return 0x000400C7 and distant return 0x000400FE', () => {
    const report = createMockLayoutReport();
    const b8Result = createMockB8Result();
    const seedClass = deriveTargetEntrySeedClass(b8Result, 'MK1.EXE:0x0002C410', report);
    const callers = deriveVerifiedCallerRecords(b8Result, 'MK1.EXE:0x0002C410', seedClass);

    const buffer = new Uint8Array(0x80000);
    // Near return RET (0xC3) at 0x400C7
    buffer[0x400c7] = 0xc3;

    const relations = deriveCallerReturnRelations(buffer, callers, seedClass.targetLinear, report);

    expect(relations.length).toBe(2);
    const nearRel = relations.find((r) => r.isNearReturn);
    const distantRel = relations.find((r) => !r.isNearReturn);

    expect(nearRel).toBeDefined();
    expect(nearRel?.returnLoadedAddress).toBe(0x000400c7);
    expect(nearRel?.returnDecodeStatus).toBe('valid-instruction-boundary');
    expect(nearRel?.returnInstructionMnemonic).toBe('RET');
    expect(nearRel?.returnInstructionLength).toBe(1);
    expect(nearRel?.isSafeNonFallThroughBoundary).toBe(true);

    expect(distantRel).toBeDefined();
    expect(distantRel?.returnLoadedAddress).toBe(0x000400fe);
    expect(distantRel?.returnDecodeStatus).toBe('not-examined-distant');
    expect(distantRel?.returnInstructionMnemonic).toBeNull();
  });

  // Test 22: Caller context verified core extraction validates seed opcode, register, immediate, CALL opcode, target
  it('22. caller context verified core extraction validates MOV EAX, 0x00002012 and CALL target 0x000400C8', () => {
    const report = createMockLayoutReport();
    const b8Result = createMockB8Result();
    const seedClass = deriveTargetEntrySeedClass(b8Result, 'MK1.EXE:0x0002C410', report);
    const callers = deriveVerifiedCallerRecords(b8Result, 'MK1.EXE:0x0002C410', seedClass);

    const buffer = new Uint8Array(0x80000);
    buffer[0x2c410] = 0xb8;
    buffer[0x2c411] = 0x12;
    buffer[0x2c412] = 0x20;
    buffer[0x2c413] = 0x00;
    buffer[0x2c414] = 0x00;
    buffer[0x2c415] = 0xe8;
    const rel1 = 0x00013cae;
    buffer[0x2c416] = rel1 & 0xff;
    buffer[0x2c417] = (rel1 >> 8) & 0xff;
    buffer[0x2c418] = (rel1 >> 16) & 0xff;
    buffer[0x2c419] = (rel1 >> 24) & 0xff;

    buffer[0x2c420] = 0xb8;
    buffer[0x2c421] = 0x12;
    buffer[0x2c422] = 0x20;
    buffer[0x2c423] = 0x00;
    buffer[0x2c424] = 0x00;
    buffer[0x2c425] = 0xe8;
    const rel2 = 0x00013c9e;
    buffer[0x2c426] = rel2 & 0xff;
    buffer[0x2c427] = (rel2 >> 8) & 0xff;
    buffer[0x2c428] = (rel2 >> 16) & 0xff;
    buffer[0x2c429] = (rel2 >> 24) & 0xff;

    const comp = compareCallerSiteLocalContext(buffer, callers, seedClass);
    expect(comp.callerRecords.length).toBe(2);

    const c1 = comp.callerRecords[0];
    expect(c1.verifiedCore.seedInstruction?.opcodeHex).toBe('0xB8');
    expect(c1.verifiedCore.seedInstruction?.destinationRegister).toBe('EAX');
    expect(c1.verifiedCore.seedImmediate).toBe(0x00002012);
    expect(c1.verifiedCore.seedImmediateHex).toBe('0x00002012');
    expect(c1.verifiedCore.callInstruction?.opcodeHex).toBe('0xE8');
    expect(c1.verifiedCore.actualTarget).toBe(0x000400c8);
    expect(c1.verifiedCore.actualTargetHex).toBe('0x000400C8');
    expect(c1.returnLoadedAddress).toBe(0x000400c7);

    const c2 = comp.callerRecords[1];
    expect(c2.verifiedCore.seedInstruction?.opcodeHex).toBe('0xB8');
    expect(c2.verifiedCore.seedInstruction?.destinationRegister).toBe('EAX');
    expect(c2.verifiedCore.seedImmediate).toBe(0x00002012);
    expect(c2.verifiedCore.callInstruction?.opcodeHex).toBe('0xE8');
    expect(c2.verifiedCore.actualTarget).toBe(0x000400c8);
    expect(c2.returnLoadedAddress).toBe(0x000400fe);
  });

  // Test 23: Full V2 schema round-trip validation confirming removal of legacy raw fields
  it('23. full V2 schema round-trip validation confirms all removed fields are undefined', () => {
    const report = createMockLayoutReport();
    const b8Result = createMockB8Result();

    const buffer = new Uint8Array(0x80000);
    buffer[0x400c7] = 0xc3;
    buffer[0x400c8] = 0xe9;
    const rel32 = 0x00013c66;
    buffer[0x400c9] = rel32 & 0xff;
    buffer[0x400ca] = (rel32 >> 8) & 0xff;
    buffer[0x400cb] = (rel32 >> 16) & 0xff;
    buffer[0x400cc] = (rel32 >> 24) & 0xff;

    buffer[0x2c410] = 0xb8;
    buffer[0x2c411] = 0x12;
    buffer[0x2c412] = 0x20;
    buffer[0x2c413] = 0x00;
    buffer[0x2c414] = 0x00;
    buffer[0x2c415] = 0xe8;
    const relCall1 = 0x00013cae;
    buffer[0x2c416] = relCall1 & 0xff;
    buffer[0x2c417] = (relCall1 >> 8) & 0xff;
    buffer[0x2c418] = (relCall1 >> 16) & 0xff;
    buffer[0x2c419] = (relCall1 >> 24) & 0xff;

    buffer[0x2c420] = 0xb8;
    buffer[0x2c421] = 0x12;
    buffer[0x2c422] = 0x20;
    buffer[0x2c423] = 0x00;
    buffer[0x2c424] = 0x00;
    buffer[0x2c425] = 0xe8;
    const relCall2 = 0x00013c9e;
    buffer[0x2c426] = relCall2 & 0xff;
    buffer[0x2c427] = (relCall2 >> 8) & 0xff;
    buffer[0x2c428] = (relCall2 >> 16) & 0xff;
    buffer[0x2c429] = (relCall2 >> 24) & 0xff;

    const result = executePaletteTargetEntryReconnaissance(buffer, report, b8Result);

    expect(result.status).toBe('SUCCESS');
    expect(result.format).toBe('mk1_palette_target_entry_recon_v2');

    // Confirm removed fields are undefined
    const nullModelAny = result.nullModel as unknown as Record<string, unknown>;
    expect(nullModelAny.verifiedB8CallerCount).toBeUndefined();
    expect(nullModelAny.rawOnlyMatchCount).toBeUndefined();
    expect(nullModelAny.candidateCallersAccountedFor).toBeUndefined();

    const compAny = result.callerComparison as unknown as Record<string, unknown>;
    expect(compAny.similarity).toBeUndefined();
    expect(compAny.caller1Sequence).toBeUndefined();
    expect(compAny.caller2Sequence).toBeUndefined();
    expect(compAny.caller1Offset).toBeUndefined();
    expect(compAny.caller2Offset).toBeUndefined();
    expect(compAny.details).toBeUndefined();

    for (const cr of result.callerComparison.callerRecords) {
      const crAny = cr as unknown as Record<string, unknown>;
      expect(crAny.sequence).toBeUndefined();
      expect(crAny.normalizedSignature).toBeUndefined();
    }
  });

  // Test 24: Caller site with wrong seed immediate fails verified core check
  it('24. caller site with wrong seed immediate fails verified core check', () => {
    const report = createMockLayoutReport();
    const b8Result = createMockB8Result();
    const seedClass = deriveTargetEntrySeedClass(b8Result, 'MK1.EXE:0x0002C410', report);
    const callers = deriveVerifiedCallerRecords(b8Result, 'MK1.EXE:0x0002C410', seedClass);

    const buffer = new Uint8Array(0x80000);
    // Caller 1 has wrong seed immediate: 0x00001234 instead of 0x00002012
    buffer[0x2c410] = 0xb8;
    buffer[0x2c411] = 0x34;
    buffer[0x2c412] = 0x12;
    buffer[0x2c413] = 0x00;
    buffer[0x2c414] = 0x00;
    buffer[0x2c415] = 0xe8;
    const relCall1 = 0x00013cae;
    buffer[0x2c416] = relCall1 & 0xff;
    buffer[0x2c417] = (relCall1 >> 8) & 0xff;
    buffer[0x2c418] = (relCall1 >> 16) & 0xff;
    buffer[0x2c419] = (relCall1 >> 24) & 0xff;

    expect(() => compareCallerSiteLocalContext(buffer, callers, seedClass)).toThrow(
      /Caller MOV EAX immediate \(0x1234\) does not match B\.8 seed value \(0x2012\)/,
    );
  });

  // Test 25: Caller site with wrong CALL target fails verified core check
  it('25. caller site with wrong CALL target fails verified core check', () => {
    const report = createMockLayoutReport();
    const b8Result = createMockB8Result();
    const seedClass = deriveTargetEntrySeedClass(b8Result, 'MK1.EXE:0x0002C410', report);
    const callers = deriveVerifiedCallerRecords(b8Result, 'MK1.EXE:0x0002C410', seedClass);

    const buffer = new Uint8Array(0x80000);
    // Caller 1 has CALL target pointing to 0x000400C9 instead of 0x000400C8
    buffer[0x2c410] = 0xb8;
    buffer[0x2c411] = 0x12;
    buffer[0x2c412] = 0x20;
    buffer[0x2c413] = 0x00;
    buffer[0x2c414] = 0x00;
    buffer[0x2c415] = 0xe8;
    const relCall1Wrong = 0x00013caf; // Target will be 0x000400C9
    buffer[0x2c416] = relCall1Wrong & 0xff;
    buffer[0x2c417] = (relCall1Wrong >> 8) & 0xff;
    buffer[0x2c418] = (relCall1Wrong >> 16) & 0xff;
    buffer[0x2c419] = (relCall1Wrong >> 24) & 0xff;

    expect(() => compareCallerSiteLocalContext(buffer, callers, seedClass)).toThrow(
      /Caller CALL target \(0x400C9\) does not match B\.8 target linear \(0x400C8\)/,
    );
  });

  // Test 26: Synthetic non-Object-1 candidate reconciles candidateObjectIdentity without hardcoded Object 1
  it('26. synthetic candidate with non-Object-1 identity reconciles candidateObjectIdentity from qualifying interpretations', () => {
    const report = createMockLayoutReport();
    // Add Object 2 to report
    const obj2 = {
      ...report.objects[0],
      objectNumber: 2,
      virtualSize: 0x40000,
      virtualSizeHex: '0x00040000',
      relocationBaseAddress: 0x00060000,
      relocationBaseAddressHex: '0x00060000',
    };
    report.objects.push(obj2);

    const b8Result = createMockB8Result();
    // Update candidate to be in Object 2
    b8Result.candidateSummaries[0].loadedLinearStructureCandidateHex = '0x0007C410';
    b8Result.candidateSummaries[0].loadedLinearPayloadCandidateHex = '0x00062012';

    b8Result.interpretations[0].targetCandidateObjectNumber = 2;
    b8Result.interpretations[0].objectRelativeCompatibility!.targetCandidateObjectNumber = 2;
    b8Result.interpretations[0].targetCandidateLoadedStructureHex = '0x0007C410';
    b8Result.interpretations[0].targetCandidateLoadedPayloadHex = '0x00062012';

    b8Result.interpretations[1].targetCandidateObjectNumber = 2;
    b8Result.interpretations[1].objectRelativeCompatibility!.targetCandidateObjectNumber = 2;
    b8Result.interpretations[1].targetCandidateLoadedStructureHex = '0x0007C410';
    b8Result.interpretations[1].targetCandidateLoadedPayloadHex = '0x00062012';

    const seedClass = deriveTargetEntrySeedClass(b8Result, 'MK1.EXE:0x0002C410', report);
    expect(seedClass.candidateObjectNumber).toBe(2);

    // Filter qualifying interpretations as coordinator does
    const qualifyingInterps = b8Result.interpretations.filter(
      (i) =>
        i.associatedCandidateId === 'MK1.EXE:0x0002C410' &&
        i.seedTrace !== null &&
        i.seedTrace.seedLiveAtBoundary &&
        i.seedTrace.boundaryType === 'call',
    );
    const candidateObjectIdentityReconciled =
      qualifyingInterps.length > 0 &&
      qualifyingInterps.every((item) => {
        const itemObj = item.targetCandidateObjectNumber ?? item.objectRelativeCompatibility?.targetCandidateObjectNumber;
        return itemObj === seedClass.candidateObjectNumber;
      }) &&
      typeof seedClass.candidateObjectNumber === 'number' &&
      seedClass.candidateObjectNumber > 0;

    expect(candidateObjectIdentityReconciled).toBe(true);

    // If interpretations disagree on object number, derivation throws
    b8Result.interpretations[1].targetCandidateObjectNumber = 3;
    expect(() => deriveTargetEntrySeedClass(b8Result, 'MK1.EXE:0x0002C410', report)).toThrow(
      /candidate object number mismatch/,
    );
  });
});
