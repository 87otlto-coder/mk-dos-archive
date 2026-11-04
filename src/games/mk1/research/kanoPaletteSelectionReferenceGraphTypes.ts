import { FixtureProvenance } from '../../../core/executable/watcomDebug/watcomDebugTypes';

export type ReferenceOccurrenceClassification =
  | 'STATIC_DATA_SYMBOL_MEMBER'
  | 'X86_MOV_REG_IMM32'
  | 'X86_INDEXED_DWORD_TABLE_LOAD'
  | 'X86_ABSOLUTE_DWORD_OPERAND'
  | 'REL32_COINCIDENCE'
  | 'WATCOM_DEBUG_TAIL'
  | 'OTHER_EXACT_DWORD';

export interface PaletteTargetEvidence {
  symbolName: string;
  watcomOffset: number;
  watcomOffsetHex: string;
  physicalOffset: number;
  physicalOffsetHex: string;
  declaredLength: number;
  recordIndex: number;
}

export interface StaticDataSymbolInterval {
  moduleIndex: number;
  moduleName: string | null;
  symbolName: string;
  symbolGlobalIndex: number;
  segment: number;
  startOffset: number;
  startOffsetHex: string;
  endOffset: number;
  endOffsetHex: string;
  byteLength: number;
}

export interface ExactDwordReferenceOccurrence {
  targetLabel: string;
  targetValue: number;
  targetValueHex: string;
  physicalFileOffset: number;
  physicalFileOffsetHex: string;
  classification: ReferenceOccurrenceClassification;
  instructionStartPhysicalOffset: number | null;
  instructionStartPhysicalOffsetHex: string | null;
  instructionLoadedAddress: number | null;
  instructionLoadedAddressHex: string | null;
  decodedShape: string | null;
  indexRegister: string | null;
  mappedLeObjectNumber: number | null;
  mappedLeObjectCapabilities: string | null;
  executableRegionId: string | null;
  executableRegionClass: string | null;
  staticDataWatcomOffset: number | null;
  staticDataWatcomOffsetHex: string | null;
  containingStaticSymbol: StaticDataSymbolInterval | null;
  contextStart: number;
  contextStartHex: string;
  contextBytesHex: string;
}

export interface PaletteReferenceTableEntry {
  slotIndex: number;
  rawValue: number;
  rawValueHex: string;
  paletteRecordIndex: number | null;
  paletteSymbolNames: string[];
  isVerifiedPaletteStart: boolean;
}

export interface PaletteReferenceTable {
  symbol: StaticDataSymbolInterval;
  physicalStart: number;
  physicalStartHex: string;
  dwordCount: number;
  entries: PaletteReferenceTableEntry[];
  verifiedPaletteReferenceCount: number;
  allEntriesVerifiedPaletteStarts: boolean;
  kanoPSlots: number[];
  kano3PSlots: number[];
}

export interface PairedPaletteTableRelationship {
  tableA: string;
  tableB: string;
  tableAWatcomOffset: number;
  tableBWatcomOffset: number;
  sameDwordCount: boolean;
  dwordCount: number;
  kanoSlotAligned: boolean;
  kanoSlotIndex: number | null;
  allEntriesPaletteReferences: boolean;
  correspondingSlotPairs: Array<{
    slotIndex: number;
    tableASymbolNames: string[];
    tableBSymbolNames: string[];
  }>;
  classification: 'VERIFIED_PARALLEL_PALETTE_TABLES' | 'PARTIAL_RELATIONSHIP';
}

export interface TableCodeReferenceSite {
  tableSymbolName: string;
  tableWatcomOffset: number;
  tableWatcomOffsetHex: string;
  physicalFileOffset: number;
  physicalFileOffsetHex: string;
  classification: ReferenceOccurrenceClassification;
  instructionStartPhysicalOffset: number | null;
  instructionStartPhysicalOffsetHex: string | null;
  instructionLoadedAddress: number | null;
  instructionLoadedAddressHex: string | null;
  decodedShape: string | null;
  indexRegister: string | null;
  mappedLeObjectNumber: number | null;
  executableRegionId: string | null;
  executableRegionClass: string | null;
  contextBytesHex: string;
}

export interface IndexedTablePairCluster {
  firstTableSymbolName: string;
  secondTableSymbolName: string;
  firstSitePhysicalOffset: number;
  firstSitePhysicalOffsetHex: string;
  secondSitePhysicalOffset: number;
  secondSitePhysicalOffsetHex: string;
  physicalDistance: number;
  indexRegister: string;
  sameIndexRegister: boolean;
  bothIndexedDwordLoads: boolean;
  classification: 'VERIFIED_SHARED_INDEX_TABLE_CLUSTER' | 'PARTIAL_CLUSTER';
}

export interface MK1KanoPaletteSelectionReferenceGraphReport {
  format: 'mk1_kano_palette_selection_reference_graph_v1';
  timestamp: string;
  operationId: string;
  provenance: FixtureProvenance;
  fixture: {
    exePath: string;
    exeSize: number;
    exeSizeHex: string;
  };
  prerequisite: {
    pass: '1E.3D.1';
    groundTruthStatus: string;
    staticDataBaseEstablished: boolean;
    paletteModuleVerified: boolean;
    kanoPaletteIdentified: boolean;
    validationPassed: boolean;
  };
  paletteTargets: {
    kanoP: PaletteTargetEvidence;
    kano3P: PaletteTargetEvidence;
  };
  directPaletteValueOccurrences: ExactDwordReferenceOccurrence[];
  containingReferenceTables: PaletteReferenceTable[];
  pairedPaletteTableRelationship: PairedPaletteTableRelationship | null;
  tableCodeReferenceSites: TableCodeReferenceSite[];
  indexedTablePairClusters: IndexedTablePairCluster[];
  decision: {
    paletteSelectionTablesEstablished: boolean;
    kanoSlotRelationshipEstablished: boolean;
    sharedIndexedCodeUseEstablished: boolean;
    specificGameplayTriggerEstablished: false;
    verdict:
      | 'PALETTE_SELECTION_REFERENCE_GRAPH_ESTABLISHED'
      | 'PARTIAL_REFERENCE_GRAPH'
      | 'PREREQUISITE_FAILED';
    narrative: string;
  };
  status: 'SUCCESS' | 'PARTIAL' | 'PREREQUISITE_FAILED';
}

export interface MK1KanoPaletteSelectionReferenceGraphExport {
  metadata: {
    name: string;
    version: string;
    milestone: string;
    formatVersion: string;
    exportTimestamp: string;
  };
  provenance: FixtureProvenance;
  fixture: MK1KanoPaletteSelectionReferenceGraphReport['fixture'];
  prerequisite: MK1KanoPaletteSelectionReferenceGraphReport['prerequisite'];
  paletteTargets: MK1KanoPaletteSelectionReferenceGraphReport['paletteTargets'];
  directPaletteValueOccurrences: ExactDwordReferenceOccurrence[];
  containingReferenceTables: PaletteReferenceTable[];
  pairedPaletteTableRelationship: PairedPaletteTableRelationship | null;
  tableCodeReferenceSites: TableCodeReferenceSite[];
  indexedTablePairClusters: IndexedTablePairCluster[];
  decision: MK1KanoPaletteSelectionReferenceGraphReport['decision'];
  validation: {
    allChecksPassed: boolean;
    checks: Array<{
      checkId: string;
      name: string;
      passed: boolean;
      detail: string;
    }>;
  };
}
