import { FixtureProvenance } from '../../../core/executable/watcomDebug/watcomDebugTypes';
import { ResolvedWatcomCodeSymbol, ResolvedWatcomDataSymbol } from './kanoPaletteSelectionSemanticsTypes';

export interface WatcomModuleSpan {
  moduleIndex: number;
  moduleName: string | null;
  segment: number;
  startOffset: number;
  startOffsetHex: string;
  endOffset: number;
  endOffsetHex: string;
  byteLength: number;
}

export interface PaletteTransferQueueEvidence {
  palsetFunction: ResolvedWatcomCodeSymbol;
  dataModuleSpan: WatcomModuleSpan | null;
  queueStart: number;
  queueStartHex: string;
  queueEndExclusive: number;
  queueEndExclusiveHex: string;
  entryStride: number;
  capacity: number;
  consumerPointerAddress: number;
  consumerPointerAddressHex: string;
  producerPointerAddress: number;
  producerPointerAddressHex: string;
  changedFlagAddress: number;
  changedFlagAddressHex: string;
  changedFlagSymbol: ResolvedWatcomDataSymbol | null;
  entryFields: {
    colorsPointerOffset: number;
    startIndexOffset: number;
    colorCountOffset: number;
  };
  palsetStoresColorsPointer: boolean;
  palsetStoresStartIndex: boolean;
  palsetStoresColorCount: boolean;
  wrapsAtQueueEnd: boolean;
  moduleLayoutExact: boolean;
  physicalBytesHex: string;
  classification: 'VERIFIED_PALETTE_TRANSFER_RING' | 'PARTIAL_PALETTE_TRANSFER_RING';
}

export interface PaletteRamAllocatorEvidence {
  getPalFunction: ResolvedWatcomCodeSymbol;
  palRamBase: number;
  palRamBaseHex: string;
  palRamSymbol: ResolvedWatcomDataSymbol | null;
  palRamNextSymbol: ResolvedWatcomDataSymbol | null;
  entryStride: number;
  entryCount: number;
  entryByteLength: number;
  fields: {
    paletteRecordPointerOffset: number;
    referenceCountOffset: number;
    hardwareStartIndexOffset: number;
  };
  initialHardwareStartIndex: number;
  reservesIndexZero: boolean;
  exactSpanToNextSymbol: boolean;
  returnsSlotIndexAsHandle: boolean;
  callsPalset: boolean;
  classification: 'VERIFIED_PALETTE_HANDLE_ALLOCATOR' | 'PARTIAL_PALETTE_HANDLE_ALLOCATOR';
}

export interface DacChannelFormula {
  componentBits: string;
  expression: string;
  scaleDescription: string;
}

export interface PaletteTransferHardwareEvidence {
  transferFunction: ResolvedWatcomCodeSymbol;
  transferIsImmediateSuccessorOfPalset: boolean;
  irqColorStateAddress: number;
  irqColorStateAddressHex: string;
  irqColorStateSymbol: ResolvedWatcomDataSymbol | null;
  transferLatchMask: number;
  transferLatchMaskHex: string;
  colorPayloadMask: number;
  colorPayloadMaskHex: string;
  statusPort: number;
  statusPortHex: string;
  statusBitMask: number;
  statusBitMaskHex: string;
  dacIndexPort: number;
  dacIndexPortHex: string;
  dacDataPort: number;
  dacDataPortHex: string;
  specialIndexZeroWrite: boolean;
  specialIndexZeroSource: 'IRQ_COLOR_STATE_LOW15';
  setsTransferLatchAfterIndexZero: boolean;
  queueConsumerPointerAddress: number;
  queueConsumerPointerAddressHex: string;
  queueProducerPointerAddress: number;
  queueProducerPointerAddressHex: string;
  queueEntryStride: number;
  queueEntryFields: PaletteTransferQueueEvidence['entryFields'];
  queueWrapStart: number;
  queueWrapStartHex: string;
  queueWrapEndExclusive: number;
  queueWrapEndExclusiveHex: string;
  clampsRangeTo256Entries: boolean;
  clearsChangedFlag: boolean;
  changedFlagAddress: number;
  changedFlagAddressHex: string;
  colorWordConversion: {
    inputBits: 15;
    outputBitsPerChannel: 6;
    first: DacChannelFormula;
    second: DacChannelFormula;
    third: DacChannelFormula;
  };
  physicalBytesHex: string;
  classification: 'VERIFIED_VGA_DAC_PALETTE_TRANSFER' | 'PARTIAL_VGA_DAC_PALETTE_TRANSFER';
}

export interface ProcessDispatcherTransferEvidence {
  containingFunction: ResolvedWatcomCodeSymbol | null;
  directTransferCallSites: number[];
  directTransferCallSitesHex: string[];
  changedFlagTestSite: number | null;
  changedFlagTestSiteHex: string | null;
  changedFlagAddress: number;
  changedFlagAddressHex: string;
  changedFlagGatesTransfer: boolean;
  classification: 'VERIFIED_PROCESS_DISPATCH_TRANSFER_INTEGRATION' | 'PARTIAL_PROCESS_DISPATCH_TRANSFER_INTEGRATION';
}

export interface DispatchTableResolvedEntry {
  index: number;
  rawCodeOffset: number;
  rawCodeOffsetHex: string;
  resolvedSymbol: ResolvedWatcomCodeSymbol | null;
}

export interface RendererPaletteShiftBridgeEvidence {
  containingFunction: ResolvedWatcomCodeSymbol | null;
  physicalStart: number;
  physicalStartHex: string;
  paletteHandleSource: 'AX_LOW16';
  palRamHardwareStartAddress: number;
  palRamHardwareStartAddressHex: string;
  flagBitMask: number;
  flagBitMaskHex: string;
  unflaggedShiftFormula: string;
  shiftMaskedToByte: boolean;
  dispatchSelectorMask: number;
  dispatchSelectorMaskHex: string;
  dispatchTableOffset: number;
  dispatchTableOffsetHex: string;
  dispatchTablePhysical: number;
  dispatchTablePhysicalHex: string;
  dispatchEntryCount: number;
  dispatchEntriesResolved: number;
  wrtNonZeroEntries: DispatchTableResolvedEntry[];
  wrtNonZeroFunction: ResolvedWatcomCodeSymbol | null;
  tupleTableSymbol: ResolvedWatcomDataSymbol | null;
  tupleTableOffset: number | null;
  tupleTableOffsetHex: string | null;
  tupleTablePhysical: number | null;
  tupleTablePhysicalHex: string | null;
  tupleEntriesChecked: number;
  tupleEntriesMatchingRepeatedBytePattern: number;
  tuplePatternVerified: boolean;
  wrtNonZeroConsumesShiftThroughTupleTable: boolean;
  literalByteShiftAddObserved: boolean;
  oneBasedPaletteAlignmentConsistent: boolean;
  classification: 'VERIFIED_RENDERER_PALETTE_SHIFT_BRIDGE' | 'PARTIAL_RENDERER_PALETTE_SHIFT_BRIDGE';
}

export interface MK1PaletteSetupTransferSemanticsReport {
  format: 'mk1_palette_setup_transfer_semantics_v1';
  timestamp: string;
  operationId: string;
  provenance: FixtureProvenance;
  fixture: { exePath: string; exeSize: number; exeSizeHex: string };
  prerequisite: {
    pass: '1E.3F';
    status: string;
    selectionSemanticsEstablished: boolean;
    validationPassed: boolean;
  };
  codeImageBase: number;
  codeImageBaseHex: string;
  staticDataBase: number;
  staticDataBaseHex: string;
  paletteTransferQueue: PaletteTransferQueueEvidence | null;
  paletteRamAllocator: PaletteRamAllocatorEvidence | null;
  transferHardware: PaletteTransferHardwareEvidence | null;
  processDispatcherIntegration: ProcessDispatcherTransferEvidence | null;
  rendererPaletteShiftBridge: RendererPaletteShiftBridgeEvidence | null;
  decision: {
    transferQueueEstablished: boolean;
    dynamicPaletteIndexZeroReserved: boolean;
    irqColorIndexZeroEstablished: boolean;
    hardwareTransferEstablished: boolean;
    rendererPaletteShiftBridgeEstablished: boolean;
    oneBasedRendererAlignmentCorroborated: boolean;
    fullRasterizerSemanticsEstablished: false;
    verdict: 'PALETTE_SETUP_TRANSFER_PIPELINE_ESTABLISHED' | 'PARTIAL_PALETTE_TRANSFER_PIPELINE' | 'PREREQUISITE_FAILED';
    narrative: string;
  };
  status: 'SUCCESS' | 'PARTIAL' | 'PREREQUISITE_FAILED';
}

export interface MK1PaletteSetupTransferSemanticsExport {
  metadata: {
    name: string;
    version: string;
    milestone: string;
    formatVersion: string;
    exportTimestamp: string;
  };
  provenance: FixtureProvenance;
  fixture: MK1PaletteSetupTransferSemanticsReport['fixture'];
  prerequisite: MK1PaletteSetupTransferSemanticsReport['prerequisite'];
  codeImageBase: number;
  codeImageBaseHex: string;
  staticDataBase: number;
  staticDataBaseHex: string;
  paletteTransferQueue: PaletteTransferQueueEvidence | null;
  paletteRamAllocator: PaletteRamAllocatorEvidence | null;
  transferHardware: PaletteTransferHardwareEvidence | null;
  processDispatcherIntegration: ProcessDispatcherTransferEvidence | null;
  rendererPaletteShiftBridge: RendererPaletteShiftBridgeEvidence | null;
  decision: MK1PaletteSetupTransferSemanticsReport['decision'];
  validation: {
    allChecksPassed: boolean;
    checks: Array<{ checkId: string; name: string; passed: boolean; detail: string }>;
  };
}
