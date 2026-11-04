import { MK1HandleTableResult } from './handleTableTypes';

export const MK1_SPRITE_DESCRIPTOR_WITH_XY_SIZE = 12;
export const MK1_SPRITE_DESCRIPTOR_NO_XY_SIZE = 8;

export type MK1SpriteDescriptorKind = 'with-xy' | 'no-xy';

export type MK1DescriptorConfidence =
  | 'candidate'
  | 'inferred'
  | 'verified'
  | 'rejected';

export interface MK1SpriteDescriptorValidation {
  widthValid: boolean;
  heightValid: boolean;
  xyValid: boolean;
  fileIdMatch: boolean;
  graOffsetValid: boolean;
  allRulesPassed: boolean;
  failedRules: string[];
}

export interface MK1SpriteDescriptorCandidate {
  exeOffset: number;
  exeOffsetHex: string;
  kind: MK1SpriteDescriptorKind;
  width: number;
  height: number;
  x?: number;
  y?: number;
  packedFileReference: number;
  packedFileReferenceHex: string;
  fileId: number;
  graOffset: number;
  graOffsetHex: string;
  targetGraPath: string;
  targetGraSize: number;
  validation: MK1SpriteDescriptorValidation;
  confidence: MK1DescriptorConfidence;

  firstBytesHex?: string;
  overlapsCandidateAtSameOffset?: boolean;
  alternateInterpretation?: {
    kind: MK1SpriteDescriptorKind;
    width: number;
    height: number;
    x?: number;
    y?: number;
    packedFileReferenceHex: string;
    graOffsetHex: string;
  };

  /**
   * Pass 1D: Explicit primary candidate flag.
   * True for primary interpretations; false if candidate is an alternate parse (e.g. NO_XY at WITH_XY+4).
   */
  primaryCandidate?: boolean;

  /**
   * Pass 1D: Indicates this candidate is an alternate interpretation of another candidate at the given offset.
   */
  alternateInterpretationOf?: string;

  /**
   * Pass 1D: Array run membership flags
   */
  inArrayRun?: boolean;
  arrayRunStride?: number;

  /**
   * Pass 1D: uGRA index decoder execution details
   */
  decode?: {
    attempted: boolean;
    success: boolean;
    encodedBytesConsumed: number;
    commandCount: number;
    failureReason?: string;
    checksum?: string;
  };
}

export interface MK1DescriptorArrayRun {
  runId: number;
  kind: MK1SpriteDescriptorKind;
  startExeOffset: number;
  startExeOffsetHex: string;
  endExeOffset: number;
  endExeOffsetHex: string;
  descriptorCount: number;
  stride: number;
  interruptions: Array<{
    offsetHex: string;
    gapBytes: number;
    description: string;
  }>;
  candidateExeOffsets: number[];
}

export interface MK1SpriteGraOffsetGroup {
  graOffset: number;
  graOffsetHex: string;
  referenceCount: number;
  firstBytesHex?: string;
  descriptors: Array<{
    exeOffsetHex: string;
    kind: MK1SpriteDescriptorKind;
    width: number;
    height: number;
    x?: number;
    y?: number;
    confidence: MK1DescriptorConfidence;
  }>;
  hasVaryingDimensions: boolean;
  hasVaryingPositions: boolean;
  hasMultipleKinds: boolean;
}

export interface MK1SpriteDescriptorCluster {
  clusterId: number;
  startExeOffset: number;
  startExeOffsetHex: string;
  endExeOffset: number;
  endExeOffsetHex: string;
  candidateCount: number;
  dominantKind: MK1SpriteDescriptorKind;
  commonStrides: number[];
  isContiguousArray: boolean;
  strideDescription: string;
  candidateExeOffsets: number[];
}

export interface MK1SpriteDescriptorScanStats {
  totalCandidates: number;
  primaryCandidatesCount: number;
  alternateInterpretationsCount: number;
  withXyCount: number;
  noXyCount: number;
  overlappingCount: number;
  uniqueGraOffsetsCount: number;
  clustersCount: number;
  arrayRunsCount: number;
  decodeSuccessesCount: number;
  decodeFailuresCount: number;
  uniqueSuccessfulGraOffsetsCount: number;
}

export interface MK1DecodedSpritePreview {
  exeOffset: number;
  width: number;
  height: number;
  x?: number;
  y?: number;
  graOffset: number;
  indices: Uint8Array;
  opaqueMask: Uint8Array;
  encodedBytesConsumed: number;
  commandCount: number;
  checksum: string;
}

export interface MK1FirstSpriteProof {
  anchorExeOffsetHex: string;
  expectedDimensions: string;
  expectedGraOffset: number;
  found: boolean;
  descriptor?: {
    exeOffsetHex: string;
    kind: MK1SpriteDescriptorKind;
    width: number;
    height: number;
    x?: number;
    y?: number;
    graOffsetHex: string;
    decoded: boolean;
    hasPreviewPayload?: boolean;
    encodedBytesConsumed?: number;
    commandCount?: number;
    checksum?: string;
    failureReason?: string;
  };
}

export interface MK1SpriteDescriptorScanResult {
  app: {
    name: string;
    version: string;
    scannedAt: string;
  };
  fixture: string;
  executable: {
    path: string;
    size: number;
    sizeHex: string;
  };
  targetGra: {
    path: string;
    fileId: number;
    size: number;
    sizeHex: string;
  };
  scanStats: MK1SpriteDescriptorScanStats;
  candidates: MK1SpriteDescriptorCandidate[];
  graOffsetGroups: MK1SpriteGraOffsetGroup[];
  clusters: MK1SpriteDescriptorCluster[];
  arrayRuns: MK1DescriptorArrayRun[];
  firstSpriteProof?: MK1FirstSpriteProof;
  /**
   * Milestone 1D.1: Runtime in-memory decoded sprite previews.
   * Keyed by candidate EXE offset.
   * NOT serialized into JSON exports.
   */
  previewPayloads?: Map<number, MK1DecodedSpritePreview>;
}

export interface MK1SpriteDescriptorExportData {
  app: {
    name: string;
    version: string;
    exportedAt: string;
  };
  fixtureIdentity: string;
  executable: {
    path: string;
    sizeDecimal: number;
    sizeHex: string;
  };
  targetGra: {
    path: string;
    fileId: number;
    sizeDecimal: number;
    sizeHex: string;
  };
  scanStats: MK1SpriteDescriptorScanStats;
  candidates: Array<{
    exeOffsetHex: string;
    kind: MK1SpriteDescriptorKind;
    width: number;
    height: number;
    x?: number;
    y?: number;
    packedReferenceHex: string;
    fileId: number;
    graOffsetDecimal: number;
    graOffsetHex: string;
    firstBytesHex?: string;
    confidence: MK1DescriptorConfidence;
    primaryCandidate?: boolean;
    alternateInterpretationOf?: string;
    overlapsCandidateAtSameOffset?: boolean;
    alternateInterpretation?: MK1SpriteDescriptorCandidate['alternateInterpretation'];
    inArrayRun?: boolean;
    arrayRunStride?: number;
    decode?: {
      attempted: boolean;
      success: boolean;
      encodedBytesConsumed: number;
      commandCount: number;
      failureReason?: string;
      checksum?: string;
    };
  }>;
  graOffsetGroups: Array<{
    graOffsetHex: string;
    graOffsetDecimal: number;
    referenceCount: number;
    firstBytesHex?: string;
    hasVaryingDimensions: boolean;
    hasVaryingPositions: boolean;
    hasMultipleKinds: boolean;
    descriptors: MK1SpriteGraOffsetGroup['descriptors'];
  }>;
  clusters: Array<{
    clusterId: number;
    startExeOffsetHex: string;
    endExeOffsetHex: string;
    candidateCount: number;
    dominantKind: MK1SpriteDescriptorKind;
    commonStrides: number[];
    isContiguousArray: boolean;
    strideDescription: string;
  }>;
  arrayRuns: Array<{
    runId: number;
    kind: MK1SpriteDescriptorKind;
    startExeOffsetHex: string;
    endExeOffsetHex: string;
    descriptorCount: number;
    stride: number;
    interruptions: Array<{
      offsetHex: string;
      gapBytes: number;
      description: string;
    }>;
  }>;
  firstSpriteProof?: MK1FirstSpriteProof;
}

export interface MK1ResolvedGraTarget {
  path: string;
  fileId: number;
  fileSize: number;
  handleEntryOffset: number;
  confidence: 'verified' | 'inferred';
  status: string;
  presentOnDisk: boolean;
  rawFilenameString?: string;
  entryOffsetHex?: string;
  fileSizeHex?: string;
}

export interface MK1SpriteScanOptions {
  exePath?: string;
  target?: MK1ResolvedGraTarget;
  cachedHandleTable?: MK1HandleTableResult;
  /** @deprecated Use target.path or pass resolved target */
  targetGraPath?: string;
  /** @deprecated Use target.fileId or pass resolved target */
  targetFileId?: number;
  /** @deprecated Use target.fileSize or pass resolved target */
  targetGraSize?: number;
  chunkSize?: number;
  readGraPreviewBytes?: boolean;
  onProgress?: (message: string, progressFraction?: number) => void;
}
