import { describe, it, expect } from 'vitest';
import {
  decodeB10MicroInstruction,
  performPaletteConvergentEntryReconnaissance,
  createMK1CompactPaletteConvergentEntryExport,
} from '../games/mk1/research/paletteConvergentEntryReconnaissance';
import {
  MK1PaletteConvergentEntryResult,
  B10_EPISTEMIC_RULES,
  B10_EXPORT_FORMAT_VERSION,
} from '../games/mk1/research/paletteConvergentEntryReconnaissanceTypes';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import {
  LEHeader,
  LEObjectEntry,
  LEPageMapEntry,
} from '../core/executable/le/leTypes';
import {
  MK1PaletteOperandUseResult,
  MK1OperandInterpretationRecord,
  X86Register32,
} from '../games/mk1/research/paletteOperandUseReconnaissanceTypes';
import {
  MK1PaletteTargetEntryReconResult,
  MK1RegisterEntryState,
} from '../games/mk1/research/paletteTargetEntryReconnaissanceTypes';
import { DirectorySource } from '../core/filesystem/DirectorySource';

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
    virtualSize: 0x60000,
    virtualSizeHex: '0x00060000',
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
        fileEnd: 0x70000,
        byteLength: 0x60000,
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
    timestamp: '2026-09-14T16:45:00.000Z',
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
        virtualSize: 0x60000,
        virtualSizeHex: '0x00060000',
        pageMapEntryCount: 80,
        mappedPageCount: 80,
        explicitZeroFilledPageCount: 0,
        rawFileBackedPageBytes: 0x60000,
        rawFileBackedPageBytesHex: '0x00060000',
        addressableFileBackedBytes: 0x60000,
        addressableFileBackedBytesHex: '0x00060000',
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
        highestFileBackedPageEnd: 0x70000,
        highestFileBackedPageEndHex: '0x00070000',
        headerDerivedPageDataEnd: 0x70000,
        headerDerivedPageDataEndHex: '0x00070000',
        discrepancyBytes: 0,
        discrepancyExplanation: 'Exact match',
      },
      postModuleTail: {
        startOffset: 0x70000,
        startOffsetHex: '0x00070000',
        endOffset: 0x80000,
        endOffsetHex: '0x00080000',
        byteLength: 0x10000,
        percentageOfTotalExecutable: 12.5,
        containedAnchorNames: [],
        purpose: 'UNKNOWN',
        notes: '',
      },
      regions: [
        {
          regionId: 'reg-obj-1',
          regionClass: 'le-object-file-backed',
          name: 'Object 1 Executable',
          fileStart: 0x10000,
          fileStartHex: '0x00010000',
          fileEnd: 0x70000,
          fileEndHex: '0x00070000',
          byteLength: 0x60000,
          percentageOfFile: 75,
          objectNumber: 1,
          purpose: 'Main Code',
          notes: 'Object 1',
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
  const interp: MK1OperandInterpretationRecord = {
    interpretationId: 'b8-interp-c3fe-call-53d33',
    sourceKind: 'direct-candidate-first-hop',
    siteFileOffset: 0x5a4a0,
    siteFileOffsetHex: '0x0005A4A0',
    siteObjectNumber: 1,
    siteObjectOffset: 0x4a4a0,
    siteObjectOffsetHex: '0x0004A4A0',
    siteLoadedAddress: 0x000400a0,
    siteLoadedAddressHex: '0x000400A0',
    siteRegionId: 'reg-obj-1',
    shapeClass: 'mov-r32-imm32',
    mnemonicHint: 'MOV EAX, 0x00002000',
    instructionFileOffset: 0x5a4a0,
    instructionFileOffsetHex: '0x0005A4A0',
    instructionLength: 5,
    opcodeBytesHex: 'B8',
    operandFieldOffset: 0x5a4a1,
    operandFieldOffsetHex: '0x0005A4A1',
    operandUint32Value: 0x00002000,
    operandUint32Hex: '0x00002000',
    destinationRegister: 'EAX',
    hasSegmentOverride: false,
    associatedCandidateId: 'MK1.EXE:0x0002C3FE',
    associatedRepresentationKind: 'object-relative-payload',
    targetCandidateLoadedStructureHex: '0x0002C3FE',
    targetCandidateLoadedPayloadHex: '0x00012000',
    targetCandidateObjectNumber: 1,
    semanticClass: 'register-immediate-seed',
    segmentOverridePrefixHex: null,
    dereferenceShapePresent: false,
    dereferencePerformed: false,
    memoryAccessEncodedByInterpretation: false,
    directLinearResolution: 'exact-associated-payload-linear',
    directLinearResolvedObjectNumber: 1,
    directLinearResolvedObjectOffset: 0x2000,
    directLinearResolvedObjectOffsetHex: '0x00002000',
    directLinearResolvedPhysicalOffset: 0x12000,
    directLinearResolvedPhysicalOffsetHex: '0x00012000',
    directLinearResolvedRegionId: 'reg-obj-1',
    directLinearMatchesAssociatedTarget: true,
    objectRelativeCompatibility: {
      isObjectRelativeOperand: true,
      operandUint32Value: 0x00002000,
      operandUint32Hex: '0x00002000',
      associatedRepresentationKind: 'object-relative-payload',
      targetCandidateObjectNumber: 1,
      targetObjectRelocationBase: 0x00010000,
      targetObjectRelocationBaseHex: '0x00010000',
      associatedTargetLoadedAddress: 0x00012000,
      associatedTargetLoadedAddressHex: '0x00012000',
      requiredBaseToReachTargetLoadedAddress: 0x00010000,
      requiredBaseHex: '0x00010000',
      requiredBaseEqualsTargetObjectRelocationBase: true,
      equalsAssociatedObjectRelativeStructure: false,
      equalsAssociatedObjectRelativePayload: true,
    },
    seedTraceStatus: 'seed-traced-to-call',
    seedTrace: {
      seedSiteOffset: 0x5a4a0,
      seedSiteOffsetHex: '0x0005A4A0',
      seedInstructionOffset: 0x5a4a0,
      seedInstructionOffsetHex: '0x0005A4A0',
      seedInstructionLength: 5,
      seedInstructionMnemonic: 'MOV EAX, 0x00002000',
      seedRegister: 'EAX',
      initialSeedValue: 0x00002000,
      initialSeedValueHex: '0x00002000',
      traceStartOffset: 0x5a4a0,
      traceStartOffsetHex: '0x0005A4A0',
      traceEndOffset: 0x5a4a5,
      traceEndOffsetHex: '0x0005A4A5',
      totalBytesExamined: 10,
      totalInstructionsDecoded: 2,
      stopReason: 'call-boundary',
      stopOffset: 0x5a4a0,
      stopOffsetHex: '0x0005A4A0',
      status: 'seed-traced-to-call',
      seedLiveAtBoundary: true,
      boundaryType: 'call',
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
        sourceInstructionPhysicalOffset: 0x5a4a0,
        sourceInstructionPhysicalOffsetHex: '0x0005A4A0',
        sourceObjectNumber: 1,
        sourceObjectOffset: 0x4a4a0,
        sourceObjectOffsetHex: '0x0004A4A0',
        sourceLoadedLinearCandidate: 0x000400a0,
        sourceLoadedLinearCandidateHex: '0x000400A0',
        rel32Displacement: 0x13c8e,
        rel32DisplacementHex: '+0x00013C8E',
        nextInstructionObjectOffset: 0x4a4a5,
        nextInstructionObjectOffsetHex: '0x0004A4A5',
        targetObjectOffset: 0x43d33,
        targetObjectOffsetHex: '0x00043D33',
        targetLoadedLinearCandidate: 0x00053d33,
        targetLoadedLinearCandidateHex: '0x00053D33',
        targetOffsetWithinSourceObjectVirtualRange: true,
        targetOffsetWithinSourceObjectFileBackedRange: true,
        targetLinearRegionId: 'reg-obj-1',
        targetLinearRegionClass: 'le-object-file-backed',
        targetLinearObjectNumber: 1,
        targetLinearObjectFlags: 0x2045,
        targetLinearObjectReadable: true,
        targetLinearObjectWritable: false,
        targetLinearObjectExecutable: true,
        targetLinearObjectOffset: 0x43d33,
        targetLinearObjectOffsetHex: '0x00043D33',
        targetLinearPhysicalBackingOffset: 0x53d33,
        targetLinearPhysicalBackingOffsetHex: '0x00053D33',
        physicalBackingAvailable: true,
        targetTopologyClassification: 'target-offset-within-source-object',
      },
    },
  };

  return {
    status: 'SUCCESS',
    metadata: {
      operationId: 'b8-test-op',
      timestamp: '2026-09-14T10:00:00.000Z',
      durationMs: 100,
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
      b2PositivePhysicalSites: 1,
      b2PositiveShapeInterpretations: 1,
      b6Status: 'SUCCESS',
      b6CandidateCount: 1,
      b7Status: 'SUCCESS',
      b7PositiveSecondHopReferrerCount: 0,
    },
    reconciliation: {
      b2PositivePhysicalSitesInput: 1,
      b2PositiveShapeInterpretationsInput: 1,
      b8DirectPhysicalSitesProduced: 1,
      b8DirectInterpretationsProduced: 1,
      b7PositiveSecondOrderSitesInput: 0,
      b8TwoHopSitesProduced: 0,
      b8TwoHopInterpretationsProduced: 0,
      directSiteIdsMissing: [],
      unexpectedDirectSiteIds: [],
      shapeInterpretationsMissing: [],
      candidateAssociationsMissing: [],
      seedTraceEligibleInterpretations: 1,
      seedTraceResultsProduced: 1,
      callBoundaryTraces: 1,
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
    },
    globalSummary: {
      totalUniquePhysicalSites: 1,
      directCandidateFirstHopSites: 1,
      twoHopCodeFacingSites: 0,
      totalPositiveInterpretations: 1,
      directPositiveInterpretations: 1,
      twoHopPositiveInterpretations: 0,
      semanticCounts: {
        'register-immediate-seed': 1,
        'push-immediate-value': 0,
        'accumulator-arithmetic-immediate': 0,
        'direct-memory-load-address': 0,
        'direct-memory-store-address': 0,
        'lea-address-computation': 0,
        'other-whitelisted-immediate': 0,
      },
      linearResolutionCounts: {
        'exact-associated-payload-linear': 1,
        'exact-associated-structure-linear': 0,
        'resolves-other-loaded-location': 0,
        'linear-address-unmapped': 0,
        'segment-override-unresolved': 0,
        'not-applicable-non-address-operand': 0,
      },
      directLinearMatchesTargetCount: 1,
      directLinearResolvesOtherCount: 0,
      directLinearUnmappedCount: 0,
      objectRelativeCount: 1,
      objectRelativeRelocationBaseMatchedCount: 1,
      seedTracesAttempted: 1,
      seedTracesReachingCall: 1,
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
      'register-immediate-seed': 1,
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
      seedLiveAtCallBoundary: 1,
    },
    seedTraceStopReasonSummary: { 'call-boundary': 1 },
    callBoundarySummary: {
      callBoundaryCount: 1,
      distinctCallTargetCount: 1,
      callTargetsWithinSourceObjectVirtualRange: 1,
      callTargetsWithinSourceObjectFileBackedRange: 1,
      callTargetsOutsideSourceObjectVirtualRange: 0,
      numericTargetsResolvingSourceObject: 1,
      numericTargetsResolvingOtherObject: 0,
      numericTargetsUnmapped: 0,
    },
    callBoundaryTargetGroups: [],
    localSeedUseSignatureGroups: [],
    candidateSummaries: [],
    twoHopTargetSummaries: [],
    sites: [],
    interpretations: [interp],
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

function createMockRegisterEntryState(): Record<X86Register32, MK1RegisterEntryState> {
  return {
    EAX: { register: 'EAX', isTrackingSeed: true, exactValueKnown: true, exactValue: 0x2012, exactValueHex: '0x00002012' },
    ECX: { register: 'ECX', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000' },
    EDX: { register: 'EDX', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000' },
    EBX: { register: 'EBX', isTrackingSeed: false, exactValueKnown: true, exactValue: 0xffff, exactValueHex: '0x0000FFFF' },
    ESP: { register: 'ESP', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000' },
    EBP: { register: 'EBP', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000' },
    ESI: { register: 'ESI', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000' },
    EDI: { register: 'EDI', isTrackingSeed: false, exactValueKnown: false, exactValue: 0, exactValueHex: '0x00000000' },
  };
}

function createMockB9Result(): MK1PaletteTargetEntryReconResult {
  return {
    format: 'mk1_palette_target_entry_recon_v2',
    status: 'SUCCESS',
    operationId: 'b9-test-op',
    timestamp: '2026-09-14T16:45:05.135Z',
    candidateId: 'MK1.EXE:0x0002C410',
    analysisConfiguration: {
      targetTraceMaxBytes: 128,
      targetTraceMaxInstructions: 32,
      rawTargetPreBytes: 16,
      rawTargetPostBytes: 96,
      straightLineOnly: true,
      followsCalls: false,
      followsJumps: false,
      followsBranches: false,
      rawE8ObjectScanCount: 1,
      targetSelector: '0x000400C8',
    },
    seedClass: {
      candidateId: 'MK1.EXE:0x0002C410',
      seedRegister: 'EAX',
      seedValue: 0x00002012,
      seedValueHex: '0x00002012',
      targetLinear: 0x000400c8,
      targetLinearHex: '0x000400C8',
      targetObjectOffset: 0x300c8,
      targetObjectOffsetHex: '0x000300C8',
      targetPhysicalOffset: 0x0005a4c8,
      targetPhysicalOffsetHex: '0x0005A4C8',
      qualifyingCallerCount: 2,
      callerSiteOffsets: [0x5a4c2, 0x5a4f9],
      callerSiteOffsetsHex: ['0x0005A4C2', '0x0005A4F9'],
      candidatePhysicalStructure: 0x2c400,
      candidatePhysicalStructureHex: '0x0002C400',
      candidatePhysicalPayload: 0x2c410,
      candidatePhysicalPayloadHex: '0x0002C410',
      candidateObjectNumber: 1,
      candidateObjectRelativeStructure: 0x1c400,
      candidateObjectRelativeStructureHex: '0x0001C400',
      candidateObjectRelativePayload: 0x1c410,
      candidateObjectRelativePayloadHex: '0x0001C410',
      candidateLoadedStructure: 0x0002c400,
      candidateLoadedStructureHex: '0x0002C400',
      candidateLoadedPayload: 0x0002c410,
      candidateLoadedPayloadHex: '0x0002C410',
      relocationBase: 0x00010000,
      relocationBaseHex: '0x00010000',
    },
    verifiedCallerRecords: [],
    callerReturnRelations: [],
    targetBoundary: {
      targetLinear: 0x000400c8,
      targetLinearHex: '0x000400C8',
      objectNumber: 1,
      objectOffset: 0x300c8,
      objectOffsetHex: '0x000300C8',
      physicalOffset: 0x0005a4c8,
      physicalOffsetHex: '0x0005A4C8',
      regionId: 'reg-obj-1',
      regionClass: 'le-object-file-backed',
      isAddressable: true,
      isFileBacked: true,
      isReadable: true,
      isWritable: false,
      isExecutable: true,
      targetByteHex: 'BB',
      precedingBytesHex: '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 C3',
      followingBytesHex: 'BB FF FF 00 00 E9 61 3C 01 00',
      precedingDecodesToBoundary: true,
      forwardDecodeValid: true,
      forwardFirstInstructionMnemonic: 'MOV EBX, 0x0000FFFF',
      forwardFirstInstructionLength: 5,
      boundaryClassification: 'verified-instruction-boundary',
      notes: [],
    },
    rawTargetWindow: {
      preBytesHex: '',
      postBytesHex: '',
      targetByteHex: 'BB',
    },
    targetTrace: {
      startLinear: 0x000400c8,
      startLinearHex: '0x000400C8',
      startPhysical: 0x0005a4c8,
      startPhysicalHex: '0x0005A4C8',
      incomingEAX: 0x00002012,
      incomingEAXHex: '0x00002012',
      instructions: [
        {
          index: 0,
          fileOffset: 0x5a4c8,
          fileOffsetHex: '0x0005A4C8',
          objectOffset: 0x300c8,
          objectOffsetHex: '0x000300C8',
          loadedAddress: 0x000400c8,
          loadedAddressHex: '0x000400C8',
          length: 5,
          rawBytesHex: 'BB FF FF 00 00',
          opcodeHex: '0xBB',
          mnemonic: 'MOV EBX, 0x0000FFFF',
          isBarrier: false,
          eaxEvents: [],
          registerStateAfter: createMockRegisterEntryState(),
        },
        {
          index: 1,
          fileOffset: 0x5a4cd,
          fileOffsetHex: '0x0005A4CD',
          objectOffset: 0x300cd,
          objectOffsetHex: '0x000300CD',
          loadedAddress: 0x000400cd,
          loadedAddressHex: '0x000400CD',
          length: 5,
          rawBytesHex: 'E9 61 3C 01 00',
          opcodeHex: '0xE9',
          mnemonic: 'JMP near 0x00053D33',
          isBarrier: true,
          barrierType: 'jump',
          eaxEvents: [],
          registerStateAfter: createMockRegisterEntryState(),
        },
      ],
      totalBytesDecoded: 10,
      stopReason: 'unconditional-jump-barrier',
      stopOpcodeHex: '0xE9',
      disposition: 'preserved-to-control-boundary-without-read',
      finalControlBoundary: {
        boundaryType: 'jump',
        boundaryInstructionOffset: 0x5a4cd,
        boundaryInstructionOffsetHex: '0x0005A4CD',
        boundaryInstructionLoadedAddress: 0x000400cd,
        boundaryInstructionLoadedAddressHex: '0x000400CD',
        boundaryInstructionMnemonic: 'JMP near 0x00053D33',
        boundaryTargetLoadedAddress: 0x00053d33,
        boundaryTargetLoadedAddressHex: '0x00053D33',
        seedLiveAtBoundary: true,
        seedDerivedRegistersLiveAtBoundary: ['EAX'],
        notes: [],
      },
      b8BoundaryTargetCrossReference: null,
      seedEvents: {
        incomingSeedEverRead: false,
        incomingSeedOverwrittenBeforeRead: false,
        incomingSeedCopied: false,
        incomingSeedAffineAdjusted: false,
        relocationBaseAdjustmentObserved: false,
        candidateLoadedStructureReached: false,
        candidateLoadedPayloadReached: false,
        seedUsedAsMemoryBase: false,
        seedUsedAsMemoryIndex: false,
        partialMemoryAddressObserved: false,
        candidateStructureMemoryAddressObserved: false,
        candidatePayloadMemoryAddressObserved: false,
        seedPushed: false,
        seedStored: false,
        seedCompared: false,
        seedTested: false,
        seedLiveAtFinalBoundary: true,
      },
      eaxReadBeforeOverwrite: false,
      eaxOverwrittenBeforeRead: false,
      eaxUsedAsMemoryBase: false,
      eaxUsedAsMemoryIndex: false,
      eaxCopied: false,
      eaxPushed: false,
      eaxAffineAdjusted: false,
      eaxTargetCoordinateReached: false,
      allEvents: [],
    },
    nullModel: {
      rawE8OpcodesSeen: 0,
      rawE8Rel32DecodableCount: 0,
      rawExactTargetMatchCount: 0,
      verifiedB8CallBoundaryMatchCount: 0,
      rawOnlyExactTargetMatchCount: 0,
      verifiedB8CallOffsetsExpected: [],
      verifiedB8CallOffsetsExpectedHex: [],
      verifiedB8CallOffsetsFound: [],
      verifiedB8CallOffsetsFoundHex: [],
      verifiedB8CallOffsetsMissing: [],
      verifiedB8CallOffsetsMissingHex: [],
      rawE8ExactTargetMatches: [],
      scanRangeStartPhysicalHex: '0x00000000',
      scanRangeEndPhysicalHex: '0x00000000',
      scanRangeBytes: 0,
    },
    callerComparison: {
      verifiedCallerCount: 0,
      seedInstructionPhysicalDistance: 0,
      callInstructionPhysicalDistance: 0,
      loadedDistance: 0,
      rawWindowsOverlap: false,
      verifiedCoreSequenceEqual: true,
      callerRecords: [],
    },
    reconciliation: {
      upstreamB8StatusVerified: true,
      upstreamB8AllReconciledVerified: true,
      upstreamB8DerivedEvidenceVerified: true,
      targetCandidateFound: true,
      exactOneSeedClassDerived: true,
      exactOneDerivedTarget: true,
      targetCoordinatesMatchB8: true,
      targetPhysicalBackingMatchesB8: true,
      targetRegionAuthoritative: true,
      targetExecutable: true,
      verifiedCallerCountInput: true,
      callerRecordsProduced: true,
      callerReturnRelationsProduced: true,
      targetStartDecodeReconciled: true,
      nearReturnDecodesReconciled: true,
      boundaryOverlapReconciled: true,
      targetTraceProduced: true,
      targetTraceEventsReconciled: true,
      rawScanRangeReconciled: true,
      rawExactMatchesReconciled: true,
      verifiedB8CallersFoundInRawScan: true,
      callerContextsReconciled: true,
      boundaryTargetRecorded: true,
      derivedSummariesReconciled: true,
      candidateObjectIdentityReconciled: true,
      candidateCoordinatesReconciled: true,
      callerMandatoryFieldsReconciled: true,
      verifiedCallOpcodeBytesReconciled: true,
      nearReturnSetDerivedFromVerifiedCallers: true,
      nearReturnDecodeStatusesReconciled: true,
      boundaryOverlapComputed: true,
      authoritativeRegionReconciled: true,
      verifiedB8CallOffsetSetReconciled: true,
      verifiedCallerCoreSequencesReconciled: true,
      allReconciled: true,
    },
    fixtureObservations: [],
    interpretationCaveats: [],
  };
}

function createMockSource(buffer: Uint8Array): DirectorySource {
  return {
    directoryName: 'MK1',
    listRecursive: async () => [{ path: 'MK1.EXE', size: buffer.length }],
    readSlice: async (_path: string, offset: number, length: number) => {
      return buffer.slice(offset, offset + length).buffer;
    },
    readFile: async (_path: string) => {
      return buffer.buffer;
    },
  } as unknown as DirectorySource;
}

describe('Pass 1E.2B.10 — Relative-Control Address-Space Qualification + Convergent Entry Reconnaissance', () => {
  // Unit tests: Micro-decoder (decodeB10MicroInstruction)
  describe('Micro-Decoder Instruction Verification', () => {
    it('1. decodes INC and DEC single-byte opcodes (0x40 - 0x4F)', () => {
      const bytes = new Uint8Array([0x40, 0x43, 0x48, 0x49]);
      // INC EAX
      const r0 = decodeB10MicroInstruction(bytes, 0, 0x1000, 0x5000);
      expect(r0.instruction).not.toBeNull();
      expect(r0.instruction?.mnemonic).toBe('INC EAX');
      expect(r0.instruction?.opcodeGroup).toBe('INC_DEC');
      expect(r0.length).toBe(1);

      // INC EBX
      const r1 = decodeB10MicroInstruction(bytes, 1, 0x1001, 0x5001);
      expect(r1.instruction?.mnemonic).toBe('INC EBX');

      // DEC EAX
      const r2 = decodeB10MicroInstruction(bytes, 2, 0x1002, 0x5002);
      expect(r2.instruction?.mnemonic).toBe('DEC EAX');

      // DEC ECX
      const r3 = decodeB10MicroInstruction(bytes, 3, 0x1003, 0x5003);
      expect(r3.instruction?.mnemonic).toBe('DEC ECX');
    });

    it('2. decodes PUSH and POP general 32-bit register opcodes (0x50 - 0x5F)', () => {
      const bytes = new Uint8Array([0x50, 0x53, 0x58, 0x5b]);
      // PUSH EAX
      const pushEax = decodeB10MicroInstruction(bytes, 0, 0x1000);
      expect(pushEax.instruction?.mnemonic).toBe('PUSH EAX');
      expect(pushEax.instruction?.writesMemory).toBe(true);

      // PUSH EBX
      const pushEbx = decodeB10MicroInstruction(bytes, 1, 0x1001);
      expect(pushEbx.instruction?.mnemonic).toBe('PUSH EBX');

      // POP EAX
      const popEax = decodeB10MicroInstruction(bytes, 2, 0x1002);
      expect(popEax.instruction?.mnemonic).toBe('POP EAX');
      expect(popEax.instruction?.readsMemory).toBe(true);

      // POP EBX
      const popEbx = decodeB10MicroInstruction(bytes, 3, 0x1003);
      expect(popEbx.instruction?.mnemonic).toBe('POP EBX');
    });

    it('3. decodes MOV immediate to 32-bit register (0xB8 - 0xBF)', () => {
      // MOV EBX, 0x0000FFFF (BB FF FF 00 00)
      const bytes = new Uint8Array([0xbb, 0xff, 0xff, 0x00, 0x00]);
      const res = decodeB10MicroInstruction(bytes, 0, 0x000400c8, 0x0005a4c8);
      expect(res.instruction).not.toBeNull();
      expect(res.instruction?.mnemonic).toBe('MOV EBX, 0x0000FFFF');
      expect(res.instruction?.opcodeGroup).toBe('MOV');
      expect(res.instruction?.modifiesRegisters).toEqual(['EBX']);
      expect(res.length).toBe(5);
    });

    it('4. decodes MOV reg/reg (0x89 ModR/M=0xC0..0xFF) and MOV reg/[disp32]', () => {
      // MOV ECX, EAX (89 C1 -> mod=3, reg=EAX, rm=ECX)
      const bytesReg = new Uint8Array([0x89, 0xc1]);
      const rReg = decodeB10MicroInstruction(bytesReg, 0, 0x1000);
      expect(rReg.instruction?.mnemonic).toBe('MOV ECX, EAX');
      expect(rReg.length).toBe(2);

      // MOV EAX, [0x00050000] (8B 05 00 00 05 00)
      const bytesMem = new Uint8Array([0x8b, 0x05, 0x00, 0x00, 0x05, 0x00]);
      const rMem = decodeB10MicroInstruction(bytesMem, 0, 0x1000);
      expect(rMem.instruction?.mnemonic).toBe('MOV EAX, [0x00050000]');
      expect(rMem.instruction?.readsMemory).toBe(true);
      expect(rMem.length).toBe(6);
    });

    it('5. decodes LEA reg32, [disp32] (0x8D ModR/M=0x05)', () => {
      // LEA EDX, [0x00020000] (8D 15 00 00 02 00)
      const bytes = new Uint8Array([0x8d, 0x15, 0x00, 0x00, 0x02, 0x00]);
      const res = decodeB10MicroInstruction(bytes, 0, 0x2000);
      expect(res.instruction?.mnemonic).toBe('LEA EDX, [0x00020000]');
      expect(res.instruction?.opcodeGroup).toBe('LEA');
      expect(res.instruction?.readsMemory).toBe(false);
      expect(res.length).toBe(6);
    });

    it('6. decodes RET near (0xC3) and RET imm16 (0xC2)', () => {
      const bytesRet = new Uint8Array([0xc3]);
      const rRet = decodeB10MicroInstruction(bytesRet, 0, 0x3000);
      expect(rRet.instruction?.mnemonic).toBe('RET');
      expect(rRet.instruction?.isControlTransfer).toBe(true);
      expect(rRet.instruction?.controlTransferType).toBe('return');
      expect(rRet.length).toBe(1);

      const bytesRetImm = new Uint8Array([0xc2, 0x08, 0x00]);
      const rRetImm = decodeB10MicroInstruction(bytesRetImm, 0, 0x3000);
      expect(rRetImm.instruction?.mnemonic).toBe('RET 0x0008');
      expect(rRetImm.length).toBe(3);
    });

    it('7. decodes CALL near rel32 (0xE8) and JMP near rel32 (0xE9)', () => {
      // JMP near rel32 (0xE9 61 3C 01 00) at 0x000400CD -> 0x00053D33
      const bytesJmp = new Uint8Array([0xe9, 0x61, 0x3c, 0x01, 0x00]);
      const rJmp = decodeB10MicroInstruction(bytesJmp, 0, 0x000400cd);
      expect(rJmp.instruction?.mnemonic).toBe('JMP near 0x00053D33');
      expect(rJmp.instruction?.isControlTransfer).toBe(true);
      expect(rJmp.instruction?.controlTransferType).toBe('jump');
      expect(rJmp.length).toBe(5);

      // CALL near rel32 (0xE8 00 10 00 00) at 0x1000 -> 0x1000 + 5 + 0x1000 = 0x2005
      const bytesCall = new Uint8Array([0xe8, 0x00, 0x10, 0x00, 0x00]);
      const rCall = decodeB10MicroInstruction(bytesCall, 0, 0x1000);
      expect(rCall.instruction?.mnemonic).toBe('CALL near 0x00002005');
      expect(rCall.instruction?.isControlTransfer).toBe(true);
      expect(rCall.instruction?.controlTransferType).toBe('call');
      expect(rCall.length).toBe(5);
    });

    it('8. decodes JMP short (0xEB) and Jcc conditional branches (0x70-0x7F)', () => {
      // JMP short +10 (EB 0A) at 0x1000 -> 0x1000 + 2 + 10 = 0x100C
      const bytesShort = new Uint8Array([0xeb, 0x0a]);
      const rShort = decodeB10MicroInstruction(bytesShort, 0, 0x1000);
      expect(rShort.instruction?.mnemonic).toBe('JMP short 0x0000100C');

      // JZ short +4 (74 04) at 0x1000 -> 0x1000 + 2 + 4 = 0x1006
      const bytesJz = new Uint8Array([0x74, 0x04]);
      const rJz = decodeB10MicroInstruction(bytesJz, 0, 0x1000);
      expect(rJz.instruction?.mnemonic).toBe('JZ 0x00001006');
      expect(rJz.instruction?.opcodeGroup).toBe('JCC');
    });

    it('9. decodes ALU operations: XOR EAX, EAX (0x31 0xC0) and ADD EAX, imm32 (0x05)', () => {
      const bytesXor = new Uint8Array([0x31, 0xc0]);
      const rXor = decodeB10MicroInstruction(bytesXor, 0, 0x1000);
      expect(rXor.instruction?.mnemonic).toBe('XOR EAX, EAX');
      expect(rXor.instruction?.opcodeGroup).toBe('ALU_ARITH');

      const bytesAdd = new Uint8Array([0x05, 0x12, 0x00, 0x00, 0x00]);
      const rAdd = decodeB10MicroInstruction(bytesAdd, 0, 0x1000);
      expect(rAdd.instruction?.mnemonic).toBe('ADD EAX, 0x00000012');
      expect(rAdd.length).toBe(5);
    });

    it('10. stops gracefully with bounded error on unknown or truncated opcodes', () => {
      // Out of bounds
      const empty = new Uint8Array([]);
      expect(decodeB10MicroInstruction(empty, 0, 0x1000).error).toBe('Offset out of bounds');

      // Truncated E9
      const truncJmp = new Uint8Array([0xe9, 0x10]);
      expect(decodeB10MicroInstruction(truncJmp, 0, 0x1000).error).toContain('Truncated');

      // Unknown opcode (e.g. 0x0F 0x0B UD2)
      const unknown = new Uint8Array([0x0f, 0x0b]); // UD2
      expect(decodeB10MicroInstruction(unknown, 0, 0x1000).error).toContain('Unsupported opcode');
    });

    it('10b. decodes ADD r8, r/m8 (0x02) and ADD r/m8, r8 (0x00)', () => {
      // ADD AL, [EBX] (02 03)
      const bytesMem = new Uint8Array([0x02, 0x03]);
      const rMem = decodeB10MicroInstruction(bytesMem, 0, 0x1000);
      expect(rMem.instruction).not.toBeNull();
      expect(rMem.instruction?.mnemonic).toBe('ADD AL, [EBX]');
      expect(rMem.instruction?.readsRegisters).toContain('EAX');
      expect(rMem.instruction?.readsRegisters).toContain('EBX');
      expect(rMem.instruction?.modifiesRegisters).toEqual(['EAX']);
      expect(rMem.instruction?.partiallyModifiesRegisters).toEqual(['EAX']);
      expect(rMem.instruction?.readsMemory).toBe(true);
      expect(rMem.length).toBe(2);

      // ADD AL, BL (02 C3)
      const bytesReg = new Uint8Array([0x02, 0xc3]);
      const rReg = decodeB10MicroInstruction(bytesReg, 0, 0x1000);
      expect(rReg.instruction?.mnemonic).toBe('ADD AL, BL');
      expect(rReg.instruction?.readsRegisters).toContain('EAX');
      expect(rReg.instruction?.readsRegisters).toContain('EBX');
      expect(rReg.instruction?.modifiesRegisters).toEqual(['EAX']);
      expect(rReg.instruction?.partiallyModifiesRegisters).toEqual(['EAX']);
      expect(rReg.instruction?.readsMemory).toBe(false);
      expect(rReg.length).toBe(2);

      // ADD BL, AL (00 C3)
      const bytesRm8 = new Uint8Array([0x00, 0xc3]);
      const rRm8 = decodeB10MicroInstruction(bytesRm8, 0, 0x1000);
      expect(rRm8.instruction?.mnemonic).toBe('ADD BL, AL');
      expect(rRm8.instruction?.readsRegisters).toContain('EBX');
      expect(rRm8.instruction?.readsRegisters).toContain('EAX');
      expect(rRm8.instruction?.modifiesRegisters).toEqual(['EBX']);
      expect(rRm8.instruction?.partiallyModifiesRegisters).toEqual(['EBX']);
    });

    it('10c. decodes MOVZX r32, r/m16 (0x0F 0xB7) and MOVZX r32, r/m8 (0x0F 0xB6)', () => {
      // MOVZX EAX, [EAX] (0F B7 00)
      const bytesMem16 = new Uint8Array([0x0f, 0xb7, 0x00]);
      const rMem16 = decodeB10MicroInstruction(bytesMem16, 0, 0x1000);
      expect(rMem16.instruction).not.toBeNull();
      expect(rMem16.instruction?.mnemonic).toBe('MOVZX EAX, [EAX]');
      expect(rMem16.instruction?.opcodeGroup).toBe('MOV_LOAD');
      expect(rMem16.instruction?.readsMemory).toBe(true);
      expect(rMem16.instruction?.readsRegisters).toEqual(['EAX']);
      expect(rMem16.instruction?.modifiesRegisters).toEqual(['EAX']);
      expect(rMem16.length).toBe(3);

      // MOVZX EDX, BX (0F B7 D3)
      const bytesReg16 = new Uint8Array([0x0f, 0xb7, 0xd3]);
      const rReg16 = decodeB10MicroInstruction(bytesReg16, 0, 0x1000);
      expect(rReg16.instruction?.mnemonic).toBe('MOVZX EDX, BX');
      expect(rReg16.instruction?.readsMemory).toBe(false);
      expect(rReg16.instruction?.readsRegisters).toEqual(['EBX']);
      expect(rReg16.instruction?.modifiesRegisters).toEqual(['EDX']);

      // MOVZX EAX, CL (0F B6 C1)
      const bytesReg8 = new Uint8Array([0x0f, 0xb6, 0xc1]);
      const rReg8 = decodeB10MicroInstruction(bytesReg8, 0, 0x1000);
      expect(rReg8.instruction?.mnemonic).toBe('MOVZX EAX, CL');
      expect(rReg8.instruction?.readsRegisters).toEqual(['ECX']);
      expect(rReg8.instruction?.modifiesRegisters).toEqual(['EAX']);
    });

    it('10d. decodes TEST r/m8, r8 (0x84)', () => {
      // TEST AL, AL (84 C0)
      const bytesReg = new Uint8Array([0x84, 0xc0]);
      const rReg = decodeB10MicroInstruction(bytesReg, 0, 0x1000);
      expect(rReg.instruction?.mnemonic).toBe('TEST AL, AL');
      expect(rReg.instruction?.readsRegisters).toEqual(['EAX']);
      expect(rReg.instruction?.modifiesRegisters).toEqual([]);

      // TEST [EBX], AL (84 03)
      const bytesMem = new Uint8Array([0x84, 0x03]);
      const rMem = decodeB10MicroInstruction(bytesMem, 0, 0x1000);
      expect(rMem.instruction?.mnemonic).toBe('TEST [EBX], AL');
      expect(rMem.instruction?.readsMemory).toBe(true);
      expect(rMem.instruction?.readsRegisters).toContain('EAX');
      expect(rMem.instruction?.readsRegisters).toContain('EBX');
    });
  });

  // Integration tests: performPaletteConvergentEntryReconnaissance
  describe('Pipeline Integration and Differential Analysis', () => {
    it('11. performs full convergent entry reconnaissance and confirms dual model equivalence', async () => {
      const report = createMockLayoutReport();
      const b8Result = createMockB8Result();
      const b9Result = createMockB9Result();

      // Synthesize buffer
      const buffer = new Uint8Array(0x80000);
      // B.9 JMP at physical offset 0x5A4CD: E9 61 3C 01 00 (targeting 0x53D33)
      buffer[0x5a4cd] = 0xe9;
      buffer[0x5a4ce] = 0x61;
      buffer[0x5a4cf] = 0x3c;
      buffer[0x5a4d0] = 0x01;
      buffer[0x5a4d1] = 0x00;

      // B.8 matching CALL at physical offset 0x5A4A0: E8 8E 3C 01 00
      buffer[0x5a4a0] = 0xe8;
      buffer[0x5a4a1] = 0x8e;
      buffer[0x5a4a2] = 0x3c;
      buffer[0x5a4a3] = 0x01;
      buffer[0x5a4a4] = 0x00;

      const source = createMockSource(buffer);

      const result: MK1PaletteConvergentEntryResult =
        await performPaletteConvergentEntryReconnaissance(source, report, b8Result, b9Result);

      expect(result.status).toBe('SUCCESS');
      expect(result.targetCandidateId).toBe('MK1.EXE:0x0002C410');
      expect(result.targetNumericAddressHex).toBe('0x00053D33');

      // Dual model convergence
      expect(result.dualModelRecon.modelsConvergeNumerically).toBe(true);
      expect(result.dualModelRecon.model1EipRelative.calculatedTargetObjectOffsetHex).toBe('0x00043D33');
      expect(result.dualModelRecon.model1EipRelative.derivedLoadedTargetHex).toBe('0x00053D33');
      expect(result.dualModelRecon.model2LoadedLinear.calculatedLinearTargetHex).toBe('0x00053D33');

      // Address space qualification
      expect(result.dualModelRecon.addressSpaceQualification.isInsideObject1Virtual).toBe(true);
      expect(result.dualModelRecon.addressSpaceQualification.containingObjectNumber).toBe(1);
      expect(result.dualModelRecon.addressSpaceQualification.physicalBackingAvailable).toBe(true);
      expect(result.dualModelRecon.addressSpaceQualification.runtimeDestinationVerified).toBe(false);

      // Byte validation
      expect(result.byteValidation.allCallersByteVerified).toBe(true);
      expect(result.byteValidation.b9JmpInstruction.bytesMatch).toBe(true);
      expect(result.byteValidation.b8MatchingCalls.length).toBe(1);
      expect(result.byteValidation.b8MatchingCalls[0].bytesMatch).toBe(true);

      // Class A vs Class B Differential
      expect(result.classAState.incomingEAXHex).toBe('0x00002012');
      expect(result.classAState.incomingEBXHex).toBe('0x0000FFFF');
      expect(result.classAState.ebxExplicitlyAssigned).toBe(true);

      expect(result.classBState.incomingEAXHex).toBe('0x00002000');
      expect(result.classBState.ebxExplicitlyAssigned).toBe(false);

      expect(result.differentialAnalysis.eaxDelta).toBe(0x12);
      expect(result.differentialAnalysis.eaxDeltaHex).toBe('0x00000012');
      expect(result.differentialAnalysis.candidatePayloadDelta).toBe(0x12);
      expect(result.differentialAnalysis.eaxDeltaMatchesCandidatePayloadDistance).toBe(true);
      expect(result.differentialAnalysis.registerDifferences.ebx).toContain('Class A holds 0x0000FFFF');

      // Mechanical dimensions
      expect(result.mechanicalDimensions.controlFlowConvergenceObserved).toBe(true);
      expect(result.mechanicalDimensions.eaxSeedDeltaHex).toBe('0x00000012');

      // All reconciliation invariants
      expect(result.reconciliation.upstreamB8Reconciled).toBe(true);
      expect(result.reconciliation.upstreamB9Reconciled).toBe(true);
      expect(result.reconciliation.dualModelsReconciled).toBe(true);
      expect(result.reconciliation.b9JmpByteVerified).toBe(true);
      expect(result.reconciliation.b8CallsByteVerified).toBe(true);
      expect(result.reconciliation.eaxDeltaReconciled).toBe(true);
      expect(result.reconciliation.affineTransformReconciled).toBe(true);
      expect(result.reconciliation.destinationBodyRemainsUnfollowed).toBe(true);
      expect(result.reconciliation.runtimeDestinationVerified).toBe(false);
      expect(result.reconciliation.noFunctionClaimsAsserted).toBe(true);
      expect(result.reconciliation.derivedEvidenceReconciled).toBe(true);
    });

    it('12. strictly enforces epistemic rules and export format integrity', async () => {
      const report = createMockLayoutReport();
      const b8Result = createMockB8Result();
      const b9Result = createMockB9Result();

      const buffer = new Uint8Array(0x80000);
      buffer[0x5a4cd] = 0xe9;
      buffer[0x5a4ce] = 0x61;
      buffer[0x5a4cf] = 0x3c;
      buffer[0x5a4d0] = 0x01;
      buffer[0x5a4d1] = 0x00;

      buffer[0x5a4a0] = 0xe8;
      buffer[0x5a4a1] = 0x8e;
      buffer[0x5a4a2] = 0x3c;
      buffer[0x5a4a3] = 0x01;
      buffer[0x5a4a4] = 0x00;

      const source = createMockSource(buffer);
      const result = await performPaletteConvergentEntryReconnaissance(source, report, b8Result, b9Result);

      // Epistemic rules check
      expect(result.epistemicRules).toEqual(B10_EPISTEMIC_RULES);
      expect(result.epistemicRules).toContain('DO NOT FOLLOW 0x53D33 — Destination body not decoded.');
      expect(result.epistemicRules).toContain('REL32 NUMERIC TARGET != VERIFIED RUNTIME LINEAR DESTINATION.');
      expect(result.dualModelRecon.addressSpaceQualification.runtimeDestinationVerified).toBe(false);

      // Export check
      const exportObj = createMK1CompactPaletteConvergentEntryExport(result, report);
      expect(exportObj.exportHeader.formatVersion).toBe(B10_EXPORT_FORMAT_VERSION);
      expect(exportObj.exportHeader.formatVersion).toBe('mk1_palette_convergent_entry_recon_v2');
      expect(exportObj.targetCandidateId).toBe('MK1.EXE:0x0002C410');
      expect(exportObj.targetNumericAddressHex).toBe('0x00053D33');
      expect(exportObj.reconciliation.derivedEvidenceReconciled).toBe(true);
    });

    it('13. rejects execution if B.8 result status is not SUCCESS', async () => {
      const report = createMockLayoutReport();
      const b8Result = { ...createMockB8Result(), status: 'FAILED' as const };
      const b9Result = createMockB9Result();
      const source = createMockSource(new Uint8Array(0x80000));

      await expect(
        performPaletteConvergentEntryReconnaissance(source, report, b8Result, b9Result),
      ).rejects.toThrow('Upstream B.8 result status is not SUCCESS');
    });

    it('14. rejects execution if B.9 final boundary type is not jump', async () => {
      const report = createMockLayoutReport();
      const b8Result = createMockB8Result();
      const b9Result = createMockB9Result();
      b9Result.targetTrace.finalControlBoundary!.boundaryType = 'call';
      const source = createMockSource(new Uint8Array(0x80000));

      await expect(
        performPaletteConvergentEntryReconnaissance(source, report, b8Result, b9Result),
      ).rejects.toThrow('is not jump');
    });

    it('15. rejects execution if B.9 seed is not live at final control boundary', async () => {
      const report = createMockLayoutReport();
      const b8Result = createMockB8Result();
      const b9Result = createMockB9Result();
      b9Result.targetTrace.finalControlBoundary!.seedLiveAtBoundary = false;
      const source = createMockSource(new Uint8Array(0x80000));

      await expect(
        performPaletteConvergentEntryReconnaissance(source, report, b8Result, b9Result),
      ).rejects.toThrow('seed register was not live');
    });

    it('16. qualifies basic block at loaded-linear candidate 0x53D33 and tracks incoming register usage', async () => {
      const report = createMockLayoutReport();
      const b8Result = createMockB8Result();
      const b9Result = createMockB9Result();

      const buffer = new Uint8Array(0x80000);
      // B.9 JMP at 0x5A4CD
      buffer[0x5a4cd] = 0xe9;
      buffer[0x5a4ce] = 0x61;
      buffer[0x5a4cf] = 0x3c;
      buffer[0x5a4d0] = 0x01;
      buffer[0x5a4d1] = 0x00;

      // B.8 CALL at 0x5A4A0
      buffer[0x5a4a0] = 0xe8;
      buffer[0x5a4a1] = 0x8e;
      buffer[0x5a4a2] = 0x3c;
      buffer[0x5a4a3] = 0x01;
      buffer[0x5a4a4] = 0x00;

      // Candidate destination code at physical offset 0x53D33:
      // Instruction 0: ADD AL, [EBX] (0x02, 0x03)
      // Instruction 1: MOVZX EAX, AX (0x0F, 0xB7, 0xC0)
      // Instruction 2: RET (0xC3)
      buffer[0x53d33] = 0x02;
      buffer[0x53d34] = 0x03;
      buffer[0x53d35] = 0x0f;
      buffer[0x53d36] = 0xb7;
      buffer[0x53d37] = 0xc0;
      buffer[0x53d38] = 0xc3;

      const source = createMockSource(buffer);
      const result = await performPaletteConvergentEntryReconnaissance(source, report, b8Result, b9Result);

      expect(result.status).toBe('SUCCESS');
      // Candidate Basic Block Qualification:
      expect(result.reconciliation.candidateBasicBlockQualified).toBe(true);
      expect(result.reconciliation.candidateBlockFormed).toBe(true);
      expect(result.reconciliation.controlBoundaryReached).toBe(true);
      expect(result.reconciliation.firstControlBarrierEncountered).toBe(true);
      expect(result.reconciliation.firstControlBarrierNotFollowed).toBe(true);
      expect(result.reconciliation.candidateTraceReconciled).toBe(true);
      expect(result.reconciliation.allReconciled).toBe(true);
      expect(result.reconciliation.runtimeDestinationVerified).toBe(false);

      // Decoded stream in candidateDestinationTrace
      const trace = result.candidateDestinationTrace;
      expect(trace).toBeDefined();
      expect(trace?.startQualification.exactStartDecodes).toBe(true);
      expect(trace?.instructions.length).toBe(3);
      expect(trace?.instructions[0].mnemonic).toBe('ADD AL, [EBX]');
      expect(trace?.instructions[1].mnemonic).toBe('MOVZX EAX, AX');
      expect(trace?.instructions[2].mnemonic).toBe('RET');
      expect(trace?.finalBoundary.boundaryReached).toBe(true);
      expect(trace?.finalBoundary.boundaryInstruction).toBe('RET');
      expect(trace?.candidateBasicBlockQualified).toBe(true);

      // Register usage evaluation
      expect(trace?.eaxUsage).toBeDefined();
      expect(trace?.eaxUsage?.read).toBe(true);
      expect(trace?.eaxUsage?.partialMod).toBe(true);
      expect(trace?.eaxUsage?.overwrite).toBe(true);
      expect(trace?.eaxUsage?.memoryUse).toBe(false);

      expect(trace?.ebxUsage).toBeDefined();
      expect(trace?.ebxUsage?.read).toBe(true);
      expect(trace?.ebxUsage?.memoryUse).toBe(true);
      expect(trace?.ebxUsage?.memoryBaseUse).toBe(true);
      expect(trace?.ebxUsage?.directMemoryUse).toBe(true);
      expect(trace?.ebxUsage?.overwrite).toBe(false);
    });

    it('17. decodes ALU 83/0, TEST 85/r, and stops at conditional branch without following target', async () => {
      const report = createMockLayoutReport();
      const b8Result = createMockB8Result();
      const b9Result = createMockB9Result();

      const buffer = new Uint8Array(0x80000);
      buffer[0x5a4cd] = 0xe9;
      buffer[0x5a4ce] = 0x61;
      buffer[0x5a4cf] = 0x3c;
      buffer[0x5a4d0] = 0x01;
      buffer[0x5a4d1] = 0x00;

      buffer[0x5a4a0] = 0xe8;
      buffer[0x5a4a1] = 0x8e;
      buffer[0x5a4a2] = 0x3c;
      buffer[0x5a4a3] = 0x01;
      buffer[0x5a4a4] = 0x00;

      // Candidate destination at 0x53D33:
      // 0: ADD AL, [EBX] (0x02, 0x03)
      // 1: MOVZX EAX, AX (0x0F, 0xB7, 0xC0)
      // 2: ADD EAX, 0x04 (0x83, 0xC0, 0x04)
      // 3: TEST EAX, EAX (0x85, 0xC0)
      // 4: JNZ +6 (0x75, 0x06)
      // 5: NOP (0x90) - should NOT be decoded because JNZ ends the basic block!
      buffer[0x53d33] = 0x02;
      buffer[0x53d34] = 0x03;
      buffer[0x53d35] = 0x0f;
      buffer[0x53d36] = 0xb7;
      buffer[0x53d37] = 0xc0;
      buffer[0x53d38] = 0x83;
      buffer[0x53d39] = 0xc0;
      buffer[0x53d3a] = 0x04;
      buffer[0x53d3b] = 0x85;
      buffer[0x53d3c] = 0xc0;
      buffer[0x53d3d] = 0x75;
      buffer[0x53d3e] = 0x06;
      buffer[0x53d3f] = 0x90; // Not decoded

      const source = createMockSource(buffer);
      const result = await performPaletteConvergentEntryReconnaissance(source, report, b8Result, b9Result);

      expect(result.status).toBe('SUCCESS');
      expect(result.reconciliation.candidateBasicBlockQualified).toBe(true);
      expect(result.reconciliation.controlBoundaryReached).toBe(true);
      expect(result.reconciliation.firstControlBarrierEncountered).toBe(true);
      expect(result.reconciliation.firstControlBarrierNotFollowed).toBe(true);
      expect(result.reconciliation.candidateTraceReconciled).toBe(true);
      expect(result.reconciliation.allReconciled).toBe(true);

      const trace = result.candidateDestinationTrace;
      expect(trace).toBeDefined();
      expect(trace?.instructions.length).toBe(5);
      expect(trace?.instructions[0].mnemonic).toBe('ADD AL, [EBX]');
      expect(trace?.instructions[1].mnemonic).toBe('MOVZX EAX, AX');
      expect(trace?.instructions[2].mnemonic).toBe('ADD EAX, 0x00000004');
      expect(trace?.instructions[3].mnemonic).toBe('TEST EAX, EAX');
      expect(trace?.instructions[4].mnemonic.startsWith('JNZ')).toBe(true);
      expect(trace?.finalBoundary.boundaryReached).toBe(true);
      expect(trace?.finalBoundary.boundaryNotFollowedConfirmation).toBe(true);
    });

    it('18. candidate reconciliation reflects failure when candidate start does not form basic block', async () => {
      const report = createMockLayoutReport();
      const b8Result = createMockB8Result();
      const b9Result = createMockB9Result();

      const buffer = new Uint8Array(0x80000);
      buffer[0x5a4cd] = 0xe9;
      buffer[0x5a4ce] = 0x61;
      buffer[0x5a4cf] = 0x3c;
      buffer[0x5a4d0] = 0x01;
      buffer[0x5a4d1] = 0x00;

      buffer[0x5a4a0] = 0xe8;
      buffer[0x5a4a1] = 0x8e;
      buffer[0x5a4a2] = 0x3c;
      buffer[0x5a4a3] = 0x01;
      buffer[0x5a4a4] = 0x00;

      // Fill candidate start with undefined opcode 0xFF 0xFF (not a valid single-instruction start in micro-decoder)
      buffer[0x53d33] = 0xff;
      buffer[0x53d34] = 0xff;

      const source = createMockSource(buffer);
      const result = await performPaletteConvergentEntryReconnaissance(source, report, b8Result, b9Result);

      // Pre-entry evidence still reconciles
      expect(result.reconciliation.derivedEvidenceReconciled).toBe(true);
      // But candidate trace fails reconciliation
      expect(result.reconciliation.candidateBasicBlockQualified).toBe(false);
      expect(result.reconciliation.candidateTraceReconciled).toBe(false);
      // And allReconciled is false!
      expect(result.reconciliation.allReconciled).toBe(false);
    });
  });
});
