import {
  LEHeader,
  LEObjectBackingSummary,
  LEObjectEntry,
  LEPageMapEntry,
  LEPageType,
  LESignatureCandidate,
  LEValidationResult,
} from '../../../core/executable/le/leTypes';
import {
  MK1ExecutablePhysicalTopology,
  MK1ExecutableRegion,
  MK1ModuleBoundaryDerivation,
  MK1PostModuleTailSummary,
} from './executableRegionTopology';

export type ResearchStatus = 'VERIFIED' | 'INFERRED' | 'HYPOTHESIS' | 'UNKNOWN';

export interface MK1MzWrapperLayout {
  mzHeaderOffset: number;
  mzExtendedHeaderOffset: number | null; // e_lfanew
  mzExtendedHeaderOffsetHex: string | null;
  eLfanewDiscrepancy: boolean;
  eLfanewNote: string;
}

export interface MK1BoundExecutableLayout {
  mzWrapper: MK1MzWrapperLayout;
  rawLeOccurrencesCount: number;
  rawLeOccurrences: LESignatureCandidate[];
  selectedPayloadCandidate: LESignatureCandidate | null;
}

export interface MK1KnownAnchorMapping {
  name: string;
  description: string;
  physicalStartOffset: number;
  physicalStartOffsetHex: string;
  physicalEndOffset: number;
  physicalEndOffsetHex: string;
  byteLength: number;
  mappedObjectNumber: number | null;
  mappedObjectOffset: number | null;
  mappedObjectOffsetHex: string | null;
  linearAddressCandidate: number | null;
  linearAddressCandidateHex: string | null;
  objectCapabilities: string | null;
  objectRoleEvidence: string | null;
  isContainedInSingleSpan: boolean;
  physicalAnchorConfidence: 'verified' | 'inferred' | 'hypothesis' | 'unknown';
  leMappingStatus: 'mapped' | 'unmapped' | 'padding' | 'crosses-boundary';
  physicalRegion: string;
  containmentNote: string;
  status: ResearchStatus;
}

export interface MK1PaletteObjectDistributionItem {
  key: string; // "Object 1", "Object 2", "Outside Mapped Objects"
  objectNumber: number | null; // null for outside
  capabilities: string;
  roleEvidence: string;
  structuralCount: number;
  uniqueContentCount: number;
  researchShortlistCount: number;
  structuralPercentage: number;
}

export interface MK1PaletteObjectDistribution {
  totalStructuralCandidates: number;
  totalUniqueContents: number;
  totalResearchCandidates: number;
  distribution: MK1PaletteObjectDistributionItem[];
}

export interface MK1AddressOccurrence {
  fileOffset: number;
  fileOffsetHex: string;
  containingObjectNumber: number | null;
}

export interface MK1PaletteReferenceOccurrence {
  paletteId: string;
  paletteExeOffset: number;
  paletteExeOffsetHex: string;
  paletteLinearAddress: number;
  paletteLinearAddressHex: string;
  paletteLength: number;
  researchScore: number;
  occurrenceCount: number;
  occurrences: MK1AddressOccurrence[];
  terminologyNote: 'raw address-value occurrence (NOT verified pointer reference)';
}

export interface MK1DebugInfoSummary {
  debugInfoFileOffset: number;
  debugInfoFileOffsetHex: string;
  debugInfoLength: number;
  debugInfoPresent: boolean;
  notes: string;
  status: ResearchStatus;
}

export interface MK1PageMapDiagnosticEntry {
  pageMapIndex: number;
  rawBytesHex: string;
  rawFlagsHex: string;
  pageType: LEPageType;
  physicalPageNumber: number;
  physicalFileStartHex: string | null;
  physicalByteLength: number | null;
}

export interface MK1PageMapDiagnostics {
  totalEntries: number;
  validEntries: number;
  mappedValidEntries: number;
  iteratedEntries: number;
  invalidEntries: number;
  zeroFilledEntries: number;
  rangeEntries: number;
  unknownEntries: number;
  minDecodedPhysicalPageNumber: number | null;
  maxDecodedPhysicalPageNumber: number | null;
  entries: MK1PageMapDiagnosticEntry[];
}

export interface MK1ExecutableLayoutReport {
  timestamp: string;
  exePath: string;
  exeSize: number;
  boundLayout: MK1BoundExecutableLayout;
  parsedHeader: LEHeader | null;
  objects: LEObjectEntry[];
  objectBackingSummary: LEObjectBackingSummary[];
  pageMap: LEPageMapEntry[];
  pageMapDiagnostics: MK1PageMapDiagnostics;
  topology: MK1ExecutablePhysicalTopology;
  validation: LEValidationResult | null;
  debugInfo: MK1DebugInfoSummary;
  knownAnchors: MK1KnownAnchorMapping[];
  paletteDistribution?: MK1PaletteObjectDistribution;
  referenceReconnaissance?: MK1PaletteReferenceOccurrence[];
}

export interface MK1CompactExecutableLayoutExport {
  metadata: {
    name: string;
    version: string;
    milestone: string;
    formatVersion: 'mk1_compact_executable_layout_v3';
    exportTimestamp: string;
  };
  fixture: {
    exePath: string;
    exeSize: number;
  };
  mzWrapper: MK1MzWrapperLayout;
  leDiscovery: {
    rawOccurrencesCount: number;
    candidates: {
      fileOffset: number;
      fileOffsetHex: string;
      isValid: boolean;
      confidence: string;
      passedRuleCount: number;
      totalRuleCount: number;
    }[];
    selectedPayloadOffset: number | null;
    selectedPayloadOffsetHex: string | null;
  };
  headerSummary?: {
    signature: string;
    cpuType: string;
    targetOs: string;
    pageSize: number;
    modulePageCount: number;
    objectCount: number;
    dataPagesFileOffset: number;
    dataPagesFileOffsetHex: string;
    entryPoint: {
      object: number;
      eip: string;
    };
    stack: {
      object: number;
      esp: string;
    };
    debugInfo: {
      fileOffset: number;
      fileOffsetHex: string;
      length: number;
      present: boolean;
    };
  };
  objects: {
    objectNumber: number;
    virtualSize: number;
    virtualSizeHex: string;
    relocationBaseAddress: number;
    relocationBaseAddressHex: string;
    capabilities: string;
    roleEvidence: string;
    rawFlagsHex: string;
    pageMapIndex: number;
    pageMapEntryCount: number;
    mappedPageCount: number;
    zeroFilledPageCount: number;
    physicalSpans: {
      fileStart: number;
      fileStartHex: string;
      fileEnd: number;
      fileEndHex: string;
      byteLength: number;
      objectPageStart: number;
      pageCount: number;
    }[];
  }[];
  objectBackingSummary: LEObjectBackingSummary[];
  pageMapDiagnostics: MK1PageMapDiagnostics;
  moduleBoundaries: MK1ModuleBoundaryDerivation;
  postModuleTail: MK1PostModuleTailSummary;
  executableRegions: MK1ExecutableRegion[];
  knownAnchors: MK1KnownAnchorMapping[];
  paletteDistribution?: MK1PaletteObjectDistribution;
  referenceReconnaissance?: {
    paletteId: string;
    paletteExeOffsetHex: string;
    paletteLinearAddressHex: string;
    researchScore: number;
    occurrenceCount: number;
    occurrences: {
      fileOffsetHex: string;
      containingObjectNumber: number | null;
    }[];
  }[];
}
