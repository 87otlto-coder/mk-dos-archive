import { SourceFileEntry } from '../../../core/filesystem/DirectorySource';
import { MK1FileEntryValidation } from './fileEntryProbe';

export const MAX_HANDLE_TABLE_ENTRIES = 256;

export interface KnownFixtureAnchor {
  expectedFileId: number;
  expectedFilename: string;
}

export const MK1_KNOWN_FIXTURE_ANCHORS: KnownFixtureAnchor[] = [
  { expectedFileId: 0, expectedFilename: 'STANCE.GRA' },
  { expectedFileId: 1, expectedFilename: 'FONTS.GRA' },
  { expectedFileId: 2, expectedFilename: 'MISC.GRA' },
  { expectedFileId: 3, expectedFilename: 'VICTORY.GRA' },
  { expectedFileId: 4, expectedFilename: 'JCATT.GRA' },
  { expectedFileId: 5, expectedFilename: 'KATT.GRA' },
  { expectedFileId: 6, expectedFilename: 'LKATT.GRA' },
  { expectedFileId: 7, expectedFilename: 'RDATT.GRA' },
  { expectedFileId: 11, expectedFilename: 'GORO1.GRA' },
  { expectedFileId: 12, expectedFilename: 'MKTITLE1.GRA' },
];

export type MK1PathResolutionMethod =
  | 'exact-string'
  | 'unique-size'
  | 'size-and-offset-delta'
  | 'ambiguous'
  | 'unresolved';

export type MK1EntryConfidence =
  | 'verified'
  | 'inferred'
  | 'hypothesis'
  | 'unknown';

export type MK1EntryPresence =
  | 'present'
  | 'missing'
  | 'ambiguous';

export interface MK1HandleTableEntry {
  fileId: number;
  entryOffset: number;
  entryOffsetHex: string;
  rawFilenameOffset: number;
  rawFilenameOffsetHex: string;
  fileSize: number;
  fileSizeHex: string;
  flags: number;
  flagsHex: string;
  padding: [number, number, number];
  unknown0: number;
  bufferPointer: number;
  unknown1: number;
  validation: MK1FileEntryValidation;

  candidatePaths: string[];
  resolvedPath?: string;
  exeFilenameString?: string;
  presence: MK1EntryPresence;
  pathResolution: MK1PathResolutionMethod;
  confidence: MK1EntryConfidence;

  filenameOffsetDelta?: number;
  filenameOffsetDeltaExpected?: number;
  filenameOffsetDeltaMatches?: boolean;

  /** @deprecated Kept for backwards compatibility */
  resolvedStringFromExe?: string;
}

export interface MK1TableComparison {
  totalEntries: number;
  installedMatches: number;
  missingFromDirectory: number;
  ambiguous: number;
}

export interface MK1DirectoryComparison {
  totalGraFiles: number;
  referenced: number;
  extra: number;
  extraPaths: string[];

  // Deprecated aliases for backwards compatibility
  totalGraInDirectory?: number;
  matchedCount?: number;
  unmatchedCount?: number;
  ambiguousCount?: number;
  unmatchedDirectoryGraPaths?: string[];
  extraDirectoryGraCount?: number;
}

export interface MK1HandleTableResult {
  app: {
    name: string;
    version: string;
    reconstructedAt: string;
  };
  gameFixture: string;
  executable: {
    path: string;
    size: number;
    sizeHex: string;
  };
  table: {
    startOffset: number;
    startOffsetHex: string;
    endOffset: number;
    endOffsetHex: string;
    entryCount: number;
    stride: number;
  };
  stringResolution: {
    attempted: boolean;
    baseOffset?: number;
    baseOffsetHex?: string;
    discoveredVia?: string;
    confidence: 'verified' | 'inferred' | 'hypothesis' | 'unresolved';
    resolvedCount: number;
    mismatchedCount: number;
    unresolvedCount: number;
    statusNarrative: string;
  };
  tableComparison: MK1TableComparison;
  directoryComparison: MK1DirectoryComparison;
  entries: MK1HandleTableEntry[];
  summary: {
    reconstructionStatus: 'VERIFIED_FIXTURE' | 'INFERRED' | 'FAILED';
    jcattFileId?: number;
    knownAnchorsValidated: boolean;
    narrative: string;
  };
}

export interface MK1HandleTableExportData {
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
  table: {
    startOffsetHex: string;
    endOffsetHex: string;
    entryCount: number;
    strideBytes: number;
  };
  stringResolution: {
    baseOffsetHex?: string;
    confidence: string;
    resolvedCount: number;
    statusNarrative: string;
  };
  tableComparison: MK1TableComparison;
  directoryComparison: {
    totalGraFiles: number;
    referenced: number;
    extra: number;
    extraPaths: string[];
  };
  entries: Array<{
    fileId: number;
    entryOffsetHex: string;
    rawFilenameOffsetHex: string;
    fileSizeDecimal: number;
    fileSizeHex: string;
    flagsHex: string;
    exeFilenameString?: string;
    directoryPath?: string;
    presence: string;
    candidatePaths: string[];
    resolvedPath?: string;
    pathResolution: string;
    confidence: string;
    filenameOffsetDelta?: number;
    filenameOffsetDeltaMatches?: boolean;
    resolvedStringFromExe?: string;
  }>;
  summary: {
    reconstructionStatus: string;
    jcattFileId?: number;
    knownAnchorsValidated: boolean;
    narrative: string;
  };
}

export interface MK1TableReconstructionOptions {
  exePath?: string;
  targetAnchorGraPath?: string;
  maxEntries?: number;
  onProgress?: (message: string, progressFraction?: number) => void;
}
