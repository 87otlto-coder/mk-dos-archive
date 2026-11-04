/**
 * MK1 Palette Reference / Context Reconnaissance Engine (Milestone 1E.2B.1)
 *
 * Implements exact 32-bit little-endian value occurrence reconnaissance across MK1.EXE
 * for all research-tier palette candidates.
 *
 * Epistemic Rules:
 * - EXACT UINT32 OCCURRENCE != POINTER.
 * - Evidence of an exact value occurrence is recorded as an empirical fact.
 * - Absolutely no pointer interpretation, instruction decoding, x86 disassembly,
 *   or palette re-ranking.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import {
  AlignmentTag,
  CandidateReferenceSummary,
  ControlTargetSummary,
  ExactValueOccurrence,
  GlobalOccurrenceSummary,
  KnownAnchorControlRepresentation,
  MK1CompactPaletteReferenceReconExport,
  MK1PaletteReferenceReconResult,
  PaletteContentHashReferenceSummary,
  PaletteReferenceReconciliation,
  PaletteRepresentationDescriptor,
  PaletteRepresentationKind,
  ReconnaissanceTruncationSummary,
  RepresentationKindSummary,
  SourceTargetRegionMatrixCell,
  TargetRegionSummary,
} from './paletteReferenceReconnaissanceTypes';
import {
  MK1PaletteCandidate,
  MK1PaletteScanResult,
} from './paletteTypes';
import {
  MK1ExecutablePhysicalTopology,
  MK1ExecutableRegion,
} from './executableRegionTopology';
import {
  MK1PaletteRegionCorrelationResult,
} from './paletteRegionCorrelationTypes';
import {
  LEObjectEntry,
} from '../../../core/executable/le/leTypes';
import {
  classifyPhysicalByteInObjects,
  fileOffsetToLoadedAddress,
} from '../../../core/executable/le/leAddressMap';
import {
  createOperationId,
  logError,
  logInfo,
  logStageCheckpoint,
  logWarning,
} from '../../../core/diagnostics/diagnosticLogger';

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase().trim();
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join('');
}

export const ALL_PALETTE_REPRESENTATION_KINDS: PaletteRepresentationKind[] = [
  'physical-structure-start',
  'physical-payload-start',
  'object-relative-structure',
  'object-relative-payload',
  'linear-structure-address',
  'linear-payload-address',
];

export const MAX_DETAILED_OCCURRENCES_PER_REPRESENTATION = 128;

export interface ReconnaissanceOptions {
  exePath?: string;
  exeSize?: number;
  pageSize?: number;
  operationId?: string;
  chunkSize?: number;
  maxDetailedOccurrencesPerRepresentation?: number;
  onProgress?: (stage: string, progress: number) => void;
}

interface InternalTargetDescriptor {
  type: 'candidate' | 'control';
  id: string; // candidateId or control name
  representationKind: PaletteRepresentationKind | string;
  targetValue: number;
  targetValueHex: string;
  byteStart: number;
  byteEnd: number;
  targetRegionId: string;
  targetRegionClass: string;
  targetObjectNumber: number | null;
}

/**
 * Derives the exact representation hypotheses for a single research-tier palette candidate.
 */
export function deriveCandidateRepresentations(
  candidate: MK1PaletteCandidate,
  objects: LEObjectEntry[],
  pageSize: number,
): Record<PaletteRepresentationKind, PaletteRepresentationDescriptor> {
  const result: Record<PaletteRepresentationKind, PaletteRepresentationDescriptor> = {
    'physical-structure-start': {
      kind: 'physical-structure-start',
      status: 'generated',
      value: candidate.byteStart >>> 0,
      valueHex: toHex32(candidate.byteStart),
    },
    'physical-payload-start': {
      kind: 'physical-payload-start',
      status: 'generated',
      value: (candidate.byteStart + 2) >>> 0,
      valueHex: toHex32(candidate.byteStart + 2),
    },
    'object-relative-structure': {
      kind: 'object-relative-structure',
      status: 'not-applicable',
      value: null,
      valueHex: null,
    },
    'object-relative-payload': {
      kind: 'object-relative-payload',
      status: 'not-applicable',
      value: null,
      valueHex: null,
    },
    'linear-structure-address': {
      kind: 'linear-structure-address',
      status: 'not-applicable',
      value: null,
      valueHex: null,
    },
    'linear-payload-address': {
      kind: 'linear-payload-address',
      status: 'not-applicable',
      value: null,
      valueHex: null,
    },
  };

  // Object-relative structure
  const structByte = classifyPhysicalByteInObjects(candidate.byteStart, objects, pageSize);
  if (structByte.type === 'addressable-object-byte' && structByte.objectOffset !== null) {
    result['object-relative-structure'] = {
      kind: 'object-relative-structure',
      status: 'generated',
      value: structByte.objectOffset >>> 0,
      valueHex: toHex32(structByte.objectOffset),
    };
  } else {
    result['object-relative-structure'] = {
      kind: 'object-relative-structure',
      status: 'not-applicable',
      value: null,
      valueHex: null,
      reason: structByte.type === 'physical-page-padding' ? 'physical-page-padding' : 'unmapped-region',
    };
  }

  // Object-relative payload
  const payloadByte = classifyPhysicalByteInObjects(candidate.byteStart + 2, objects, pageSize);
  if (payloadByte.type === 'addressable-object-byte' && payloadByte.objectOffset !== null) {
    result['object-relative-payload'] = {
      kind: 'object-relative-payload',
      status: 'generated',
      value: payloadByte.objectOffset >>> 0,
      valueHex: toHex32(payloadByte.objectOffset),
    };
  } else {
    result['object-relative-payload'] = {
      kind: 'object-relative-payload',
      status: 'not-applicable',
      value: null,
      valueHex: null,
      reason: payloadByte.type === 'physical-page-padding' ? 'physical-page-padding' : 'unmapped-region',
    };
  }

  // Linear structure address
  const structLinear = fileOffsetToLoadedAddress(candidate.byteStart, objects, pageSize);
  if (structLinear.length > 0) {
    result['linear-structure-address'] = {
      kind: 'linear-structure-address',
      status: 'generated',
      value: structLinear[0].linearAddressCandidate >>> 0,
      valueHex: toHex32(structLinear[0].linearAddressCandidate),
    };
  } else {
    result['linear-structure-address'] = {
      kind: 'linear-structure-address',
      status: 'not-applicable',
      value: null,
      valueHex: null,
      reason: 'unmapped-or-padding',
    };
  }

  // Linear payload address
  const payloadLinear = fileOffsetToLoadedAddress(candidate.byteStart + 2, objects, pageSize);
  if (payloadLinear.length > 0) {
    result['linear-payload-address'] = {
      kind: 'linear-payload-address',
      status: 'generated',
      value: payloadLinear[0].linearAddressCandidate >>> 0,
      valueHex: toHex32(payloadLinear[0].linearAddressCandidate),
    };
  } else {
    result['linear-payload-address'] = {
      kind: 'linear-payload-address',
      status: 'not-applicable',
      value: null,
      valueHex: null,
      reason: 'unmapped-or-padding',
    };
  }

  return result;
}

/**
 * Finds the physical executable region that contains the specified file offset.
 */
export function findContainingRegion(
  fileOffset: number,
  regions: MK1ExecutableRegion[],
): MK1ExecutableRegion | null {
  for (const reg of regions) {
    if (fileOffset >= reg.fileStart && fileOffset < reg.fileEnd) {
      return reg;
    }
  }
  return null;
}

/**
 * Scans an in-memory buffer or chunked executable for occurrences of uint32 values.
 *
 * Guarantees:
 * - Every byte offset from 0 to fileSize - 4 is tested.
 * - Preserves 3 bytes of overlap between chunks so values spanning chunk boundaries are not missed.
 * - Zero double counting of occurrences.
 */
export function scanBytesForTargetValues(
  buffer: Uint8Array,
  targetLookup: Map<number, InternalTargetDescriptor[]>,
  bufferBaseOffset = 0,
): {
  sourceFileOffset: number;
  matchedUint32Value: number;
  descriptors: InternalTargetDescriptor[];
  contextStartOffset: number;
  contextBytes: Uint8Array;
  matchIndexWithinContext: number;
}[] {
  const matches: {
    sourceFileOffset: number;
    matchedUint32Value: number;
    descriptors: InternalTargetDescriptor[];
    contextStartOffset: number;
    contextBytes: Uint8Array;
    matchIndexWithinContext: number;
  }[] = [];

  const len = buffer.length;
  if (len < 4) return matches;

  for (let i = 0; i <= len - 4; i++) {
    // Read 32-bit little-endian value at byte offset i
    const val =
      (buffer[i] |
        (buffer[i + 1] << 8) |
        (buffer[i + 2] << 16) |
        (buffer[i + 3] << 24)) >>>
      0;

    const descs = targetLookup.get(val);
    if (descs && descs.length > 0) {
      const sourceFileOffset = bufferBaseOffset + i;
      const cStart = Math.max(0, i - 8);
      const cEnd = Math.min(len, i + 4 + 8);
      const contextBytes = buffer.subarray(cStart, cEnd);
      const matchIndexWithinContext = i - cStart;

      matches.push({
        sourceFileOffset,
        matchedUint32Value: val,
        descriptors: descs,
        contextStartOffset: bufferBaseOffset + cStart,
        contextBytes,
        matchIndexWithinContext,
      });
    }
  }

  return matches;
}

/**
 * Scans an executable through DirectorySource using sequential chunked reads
 * with 3-byte overlap to ensure no 4-byte values are missed or double counted.
 */
export async function scanExecutableChunks(
  source: DirectorySource,
  exePath: string,
  exeSize: number,
  targetLookup: Map<number, InternalTargetDescriptor[]>,
  chunkSize = 65536,
  onProgress?: (progress: number) => void,
): Promise<{
  sourceFileOffset: number;
  matchedUint32Value: number;
  descriptors: InternalTargetDescriptor[];
  contextStartOffset: number;
  contextBytes: Uint8Array;
  matchIndexWithinContext: number;
}[]> {
  const matches: {
    sourceFileOffset: number;
    matchedUint32Value: number;
    descriptors: InternalTargetDescriptor[];
    contextStartOffset: number;
    contextBytes: Uint8Array;
    matchIndexWithinContext: number;
  }[] = [];

  if (exeSize < 4) return matches;

  let currentOffset = 0;
  const effectiveChunkSize = Math.max(chunkSize, 16);

  while (currentOffset + 4 <= exeSize) {
    const toRead = Math.min(effectiveChunkSize, exeSize - currentOffset);
    const chunk = await source.readSlice(exePath, currentOffset, toRead);
    if (chunk.length < 4) break;

    // Determine how many starting offsets to test in this chunk
    // If this is the last chunk reaching EOF, test all positions up to chunk.length - 4.
    // If more chunks follow, test positions up to chunk.length - 4, and advance currentOffset by toRead - 3!
    const isLastChunk = currentOffset + toRead >= exeSize;
    const limit = chunk.length - 4;

    for (let i = 0; i <= limit; i++) {
      const val =
        (chunk[i] |
          (chunk[i + 1] << 8) |
          (chunk[i + 2] << 16) |
          (chunk[i + 3] << 24)) >>>
        0;

      const descs = targetLookup.get(val);
      if (descs && descs.length > 0) {
        const sourceFileOffset = currentOffset + i;
        const cStart = Math.max(0, i - 8);
        const cEnd = Math.min(chunk.length, i + 4 + 8);
        const contextBytes = chunk.subarray(cStart, cEnd);
        const matchIndexWithinContext = i - cStart;

        matches.push({
          sourceFileOffset,
          matchedUint32Value: val,
          descriptors: descs,
          contextStartOffset: currentOffset + cStart,
          contextBytes,
          matchIndexWithinContext,
        });
      }
    }

    if (isLastChunk) break;

    // Advance by (toRead - 3) so that the 3 trailing bytes are placed at index 0..2 of the next chunk.
    // Position (limit + 1) in this chunk corresponds to index 0 in the next chunk, so no offset is skipped or duplicated!
    currentOffset += toRead - 3;
    if (onProgress) {
      onProgress(Math.min(0.99, currentOffset / exeSize));
    }
  }

  return matches;
}

/**
 * Standard known-anchor control targets for MK1.
 */
export function getStandardMK1ControlTargets(
  objects: LEObjectEntry[],
  pageSize: number,
): {
  name: string;
  physicalOffset: number;
  representations: KnownAnchorControlRepresentation[];
}[] {
  return [
    {
      name: 'Filename/String Area Base',
      physicalOffset: 0x0008ca54,
      representations: [
        { name: 'physical-position', value: 0x0008ca54, valueHex: '0x0008CA54' },
        {
          name: 'object-relative-offset',
          value: (() => {
            const c = classifyPhysicalByteInObjects(0x0008ca54, objects, pageSize);
            return c.objectOffset ?? 0x00026654;
          })(),
          valueHex: (() => {
            const c = classifyPhysicalByteInObjects(0x0008ca54, objects, pageSize);
            return c.objectOffsetHex ?? '0x00026654';
          })(),
        },
        {
          name: 'linear-address',
          value: (() => {
            const a = fileOffsetToLoadedAddress(0x0008ca54, objects, pageSize);
            return a.length > 0 ? a[0].linearAddressCandidate : 0x00076654;
          })(),
          valueHex: (() => {
            const a = fileOffsetToLoadedAddress(0x0008ca54, objects, pageSize);
            return a.length > 0 ? a[0].linearAddressCandidateHex : '0x00076654';
          })(),
        },
      ],
    },
    {
      name: 'Kano First Descriptor',
      physicalOffset: 0x000a7464,
      representations: [
        { name: 'physical-position', value: 0x000a7464, valueHex: '0x000A7464' },
        {
          name: 'object-relative-offset',
          value: (() => {
            const c = classifyPhysicalByteInObjects(0x000a7464, objects, pageSize);
            return c.objectOffset ?? 0x00041064;
          })(),
          valueHex: (() => {
            const c = classifyPhysicalByteInObjects(0x000a7464, objects, pageSize);
            return c.objectOffsetHex ?? '0x00041064';
          })(),
        },
        {
          name: 'linear-address',
          value: (() => {
            const a = fileOffsetToLoadedAddress(0x000a7464, objects, pageSize);
            return a.length > 0 ? a[0].linearAddressCandidate : 0x00091064;
          })(),
          valueHex: (() => {
            const a = fileOffsetToLoadedAddress(0x000a7464, objects, pageSize);
            return a.length > 0 ? a[0].linearAddressCandidateHex : '0x00091064';
          })(),
        },
      ],
    },
    {
      name: 'Kano Last Run Start',
      physicalOffset: 0x000a7d20,
      representations: [
        { name: 'physical-position', value: 0x000a7d20, valueHex: '0x000A7D20' },
        {
          name: 'object-relative-offset',
          value: (() => {
            const c = classifyPhysicalByteInObjects(0x000a7d20, objects, pageSize);
            return c.objectOffset ?? 0x00041920;
          })(),
          valueHex: (() => {
            const c = classifyPhysicalByteInObjects(0x000a7d20, objects, pageSize);
            return c.objectOffsetHex ?? '0x00041920';
          })(),
        },
        {
          name: 'linear-address',
          value: (() => {
            const a = fileOffsetToLoadedAddress(0x000a7d20, objects, pageSize);
            return a.length > 0 ? a[0].linearAddressCandidate : 0x00091920;
          })(),
          valueHex: (() => {
            const a = fileOffsetToLoadedAddress(0x000a7d20, objects, pageSize);
            return a.length > 0 ? a[0].linearAddressCandidateHex : '0x00091920';
          })(),
        },
      ],
    },
    {
      name: 'Graphics Handle Table Start',
      physicalOffset: 0x000b0c5c,
      // Physical location is in the Post-Module Tail; do NOT invent loaded/object addresses!
      representations: [
        { name: 'physical-position', value: 0x000b0c5c, valueHex: '0x000B0C5C' },
      ],
    },
  ];
}

/**
 * Main Authoritative Entry Point: Correlates research-tier palette candidates with
 * exact uint32 address-representation occurrences across MK1.EXE.
 */
export async function performPaletteReferenceReconnaissance(
  source: DirectorySource | Uint8Array,
  scanResult: MK1PaletteScanResult,
  topology: MK1ExecutablePhysicalTopology,
  objects: LEObjectEntry[],
  correlationResult: MK1PaletteRegionCorrelationResult,
  options: ReconnaissanceOptions = {},
): Promise<MK1PaletteReferenceReconResult> {
  const startTime = Date.now();
  const operationId = options.operationId ?? createOperationId('palette-ref-recon');
  const maxDetailedCap = options.maxDetailedOccurrencesPerRepresentation ?? MAX_DETAILED_OCCURRENCES_PER_REPRESENTATION;

  logStageCheckpoint(operationId, 'research-mk1', 'palette-ref-recon', 'START reference reconnaissance');

  // Stage 1: Fixture Identity Validation
  const exePath = options.exePath ?? scanResult.exePath;
  const exeSize = options.exeSize ?? scanResult.exeSize;
  const pageSize = options.pageSize ?? 4096;

  const pathMismatch = normalizePath(scanResult.exePath) !== normalizePath(exePath);
  const sizeMismatch = scanResult.exeSize !== exeSize;
  const topoSizeMismatch = topology.totalFileSize !== exeSize;

  if (pathMismatch || sizeMismatch || topoSizeMismatch) {
    const errorMsg = `Fixture mismatch: scanResult path="${scanResult.exePath}" size=${scanResult.exeSize}, target path="${exePath}" size=${exeSize}, topology size=${topology.totalFileSize}`;
    logError(operationId, 'research-mk1', 'palette-ref-recon', errorMsg);

    return {
      status: 'FAILED',
      failureReason: `FAILED — FIXTURE MISMATCH: ${errorMsg}`,
      metadata: {
        operationId,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      },
      fixture: { exePath, exeSize },
      reconciliation: {
        researchTargetInputCount: 0,
        researchTargetsProcessed: 0,
        researchTargetsSkipped: 0,
        skipReasons: { error: errorMsg },
        allTargetsAccountedFor: false,
      },
      globalSummary: {
        totalResearchTargets: 0,
        targetsWithExternalExactOccurrences: 0,
        targetsWithNoExternalExactOccurrences: 0,
        percentageTargetsWithExternalOccurrences: 0,
        totalExternalLogicalMatches: 0,
        uniqueExternalPhysicalOccurrencePositions: 0,
        totalSelfOccurrences: 0,
        candidatesWith0ExternalOccurrences: 0,
        candidatesWith1ExternalOccurrence: 0,
        candidatesWith2To5ExternalOccurrences: 0,
        candidatesWith6To20ExternalOccurrences: 0,
        candidatesWithMoreThan20ExternalOccurrences: 0,
      },
      representationSummaries: [],
      targetRegionSummaries: [],
      sourceTargetMatrix: [],
      candidateSummaries: [],
      contentHashSummary: {
        contentsWithReferencesAtMultiplePhysicalCopies: 0,
        contentsWhereOnlyOneCopyHasExternalOccurrences: 0,
        contentsWhereMultipleCopiesHaveExternalOccurrences: 0,
        contentsWithZeroExternalOccurrences: 0,
      },
      controlTargets: [],
      detailedOccurrences: [],
      truncationSummary: {
        capPerRepresentation: maxDetailedCap,
        totalCandidatesTruncated: 0,
        totalOccurrencesOmitted: 0,
      },
    };
  }

  logStageCheckpoint(operationId, 'research-mk1', 'palette-ref-recon', 'fixture identity verified', {
    exePath,
    exeSize,
  });

  // Stage 2: Target Population Collection
  const researchCandidates = scanResult.candidates.filter((c) => c.tier === 'research');
  const researchTargetInputCount = researchCandidates.length;

  logStageCheckpoint(operationId, 'research-mk1', 'palette-ref-recon', 'research targets collected', {
    count: researchTargetInputCount,
  });

  // Build Target Lookup Index: Map<uint32Value, InternalTargetDescriptor[]>
  const targetLookup = new Map<number, InternalTargetDescriptor[]>();

  function addToTargetLookup(desc: InternalTargetDescriptor) {
    const existing = targetLookup.get(desc.targetValue);
    if (existing) {
      existing.push(desc);
    } else {
      targetLookup.set(desc.targetValue, [desc]);
    }
  }

  // Pre-derive representations for all research candidates
  const candidateRepresentationsMap = new Map<
    string,
    Record<PaletteRepresentationKind, PaletteRepresentationDescriptor>
  >();

  // Find candidate regions from correlation result or topology
  const candidateRegionMap = new Map<string, MK1ExecutableRegion | null>();
  for (const c of researchCandidates) {
    const reg = findContainingRegion(c.byteStart, topology.regions);
    candidateRegionMap.set(c.id, reg);

    const reps = deriveCandidateRepresentations(c, objects, pageSize);
    candidateRepresentationsMap.set(c.id, reps);

    for (const kind of ALL_PALETTE_REPRESENTATION_KINDS) {
      const desc = reps[kind];
      if (desc.status === 'generated' && desc.value !== null) {
        addToTargetLookup({
          type: 'candidate',
          id: c.id,
          representationKind: kind,
          targetValue: desc.value,
          targetValueHex: desc.valueHex ?? toHex32(desc.value),
          byteStart: c.byteStart,
          byteEnd: c.byteEnd,
          targetRegionId: reg?.regionId ?? 'unclassified',
          targetRegionClass: reg?.regionClass ?? 'unclassified',
          targetObjectNumber: reg?.objectNumber ?? null,
        });
      }
    }
  }

  logStageCheckpoint(operationId, 'research-mk1', 'palette-ref-recon', 'representations derived');

  // Stage 3: Known-Anchor Control Target Set Setup
  const standardControls = getStandardMK1ControlTargets(objects, pageSize);
  for (const ctrl of standardControls) {
    const ctrlRegion = findContainingRegion(ctrl.physicalOffset, topology.regions);
    for (const rep of ctrl.representations) {
      addToTargetLookup({
        type: 'control',
        id: ctrl.name,
        representationKind: rep.name,
        targetValue: rep.value,
        targetValueHex: rep.valueHex,
        byteStart: ctrl.physicalOffset,
        byteEnd: ctrl.physicalOffset + 4,
        targetRegionId: ctrlRegion?.regionId ?? 'unclassified',
        targetRegionClass: ctrlRegion?.regionClass ?? 'unclassified',
        targetObjectNumber: ctrlRegion?.objectNumber ?? null,
      });
    }
  }

  logStageCheckpoint(operationId, 'research-mk1', 'palette-ref-recon', 'target value index built', {
    uniqueTargetValues: targetLookup.size,
  });

  // Stage 4: Executable Scan
  logStageCheckpoint(operationId, 'research-mk1', 'palette-ref-recon', 'MK1.EXE scan started');
  options.onProgress?.('Scanning MK1.EXE for exact address representations...', 0.1);

  let rawMatches: {
    sourceFileOffset: number;
    matchedUint32Value: number;
    descriptors: InternalTargetDescriptor[];
    contextStartOffset: number;
    contextBytes: Uint8Array;
    matchIndexWithinContext: number;
  }[] = [];

  if (source instanceof Uint8Array) {
    rawMatches = scanBytesForTargetValues(source, targetLookup, 0);
  } else {
    // If the file is <= 2MB, we can read the entire binary in one slice for speed and consistency
    if (exeSize <= 2 * 1024 * 1024) {
      const fullBytes = await source.readSlice(exePath, 0, exeSize);
      rawMatches = scanBytesForTargetValues(fullBytes, targetLookup, 0);
    } else {
      rawMatches = await scanExecutableChunks(
        source,
        exePath,
        exeSize,
        targetLookup,
        options.chunkSize ?? 65536,
        (p) => options.onProgress?.('Scanning MK1.EXE...', 0.1 + p * 0.7),
      );
    }
  }

  logStageCheckpoint(operationId, 'research-mk1', 'palette-ref-recon', 'MK1.EXE scan complete', {
    rawMatchCount: rawMatches.length,
  });
  options.onProgress?.('Classifying occurrence source regions & addresses...', 0.85);

  // Stage 5: Classify source regions and addresses, and route to Candidate vs Control
  logStageCheckpoint(operationId, 'research-mk1', 'palette-ref-recon', 'source regions classified');

  // Candidate structures
  const candidateOccurrencesMap = new Map<string, ExactValueOccurrence[]>();
  // Control occurrences
  const controlOccurrencesMap = new Map<string, ExactValueOccurrence[]>();

  for (const m of rawMatches) {
    const sourceOffset = m.sourceFileOffset;
    const sourceRegion = findContainingRegion(sourceOffset, topology.regions);
    const sourceRegionId = sourceRegion?.regionId ?? 'source-region-unclassified';
    const sourceRegionClass = sourceRegion?.regionClass ?? 'source-region-unclassified';
    const sourceObjectNumber = sourceRegion?.objectNumber ?? null;

    let sourceLoadedAddressHex: string | null = null;
    let sourceObjectOffsetHex: string | null = null;

    if (sourceRegion?.regionClass === 'le-object-file-backed') {
      const loaded = fileOffsetToLoadedAddress(sourceOffset, objects, pageSize);
      if (loaded.length > 0) {
        sourceLoadedAddressHex = toHex32(loaded[0].linearAddressCandidate);
        sourceObjectOffsetHex = toHex32(loaded[0].objectOffset);
      }
    }

    const mod4 = sourceOffset % 4;
    const mod2 = sourceOffset % 2;
    const alignmentTag: AlignmentTag = mod4 === 0 ? 'aligned4' : mod2 === 0 ? 'aligned2' : 'unaligned';
    const contextHex = bytesToHex(m.contextBytes);

    for (const desc of m.descriptors) {
      const isInside = sourceOffset >= desc.byteStart && sourceOffset < desc.byteEnd;
      const isExactStart = sourceOffset === desc.byteStart;

      const occ: ExactValueOccurrence = {
        sourceFileOffset: sourceOffset,
        sourceFileOffsetHex: toHex32(sourceOffset),
        matchedUint32Value: m.matchedUint32Value,
        matchedUint32Hex: toHex32(m.matchedUint32Value),
        representationKind: desc.representationKind as PaletteRepresentationKind,
        targetCandidateId: desc.id,
        targetCandidateByteStart: desc.byteStart,
        targetCandidateByteStartHex: toHex32(desc.byteStart),
        targetCandidateRegionId: desc.targetRegionId,
        targetCandidateRegionClass: desc.targetRegionClass,
        targetObjectNumber: desc.targetObjectNumber,
        sourceRegionId,
        sourceRegionClass,
        sourceObjectNumber,
        sourceLoadedAddressHex,
        sourceObjectOffsetHex,
        alignmentMod4: mod4,
        alignmentMod2: mod2,
        alignmentTag,
        isInsideTargetCandidateRange: isInside,
        isExactAtTargetCandidateStart: isExactStart,
        contextStartOffsetHex: toHex32(m.contextStartOffset),
        contextBytesHex: contextHex,
        matchIndexWithinContext: m.matchIndexWithinContext,
      };

      if (desc.type === 'candidate') {
        const list = candidateOccurrencesMap.get(desc.id);
        if (list) list.push(occ);
        else candidateOccurrencesMap.set(desc.id, [occ]);
      } else {
        const list = controlOccurrencesMap.get(desc.id);
        if (list) list.push(occ);
        else controlOccurrencesMap.set(desc.id, [occ]);
      }
    }
  }

  // Stage 6: Candidate Aggregations
  logStageCheckpoint(operationId, 'research-mk1', 'palette-ref-recon', 'candidate aggregation complete');
  options.onProgress?.('Aggregating candidate statistics & export summaries...', 0.92);

  let totalCandidatesTruncated = 0;
  let totalOccurrencesOmitted = 0;
  const detailedOccurrences: ExactValueOccurrence[] = [];

  const candidateSummaries: CandidateReferenceSummary[] = [];

  for (const c of researchCandidates) {
    const reps = candidateRepresentationsMap.get(c.id)!;
    const targetReg = candidateRegionMap.get(c.id);
    const rawOccs = candidateOccurrencesMap.get(c.id) ?? [];

    const totalLogicalMatches = rawOccs.length;
    const uniquePhysicalOffsets = new Set<number>();
    let selfOccurrenceCount = 0;
    let externalOccurrenceCount = 0;

    const externalByRepresentation: Record<PaletteRepresentationKind, number> = {
      'physical-structure-start': 0,
      'physical-payload-start': 0,
      'object-relative-structure': 0,
      'object-relative-payload': 0,
      'linear-structure-address': 0,
      'linear-payload-address': 0,
    };

    const externalBySourceRegion: Record<string, number> = {};
    let externalInObject1 = 0;
    let externalInObject2 = 0;
    let externalInTail = 0;
    let externalInPreLE = 0;
    let externalInHeader = 0;

    let firstOffset: number | null = null;
    let lastOffset: number | null = null;

    // Detailed capping buckets per representation kind
    const retainedPerRep: Record<PaletteRepresentationKind, number> = {
      'physical-structure-start': 0,
      'physical-payload-start': 0,
      'object-relative-structure': 0,
      'object-relative-payload': 0,
      'linear-structure-address': 0,
      'linear-payload-address': 0,
    };
    let candTruncated = false;

    for (const occ of rawOccs) {
      uniquePhysicalOffsets.add(occ.sourceFileOffset);

      if (firstOffset === null || occ.sourceFileOffset < firstOffset) {
        firstOffset = occ.sourceFileOffset;
      }
      if (lastOffset === null || occ.sourceFileOffset > lastOffset) {
        lastOffset = occ.sourceFileOffset;
      }

      if (occ.isInsideTargetCandidateRange) {
        selfOccurrenceCount++;
      } else {
        externalOccurrenceCount++;
        externalByRepresentation[occ.representationKind] =
          (externalByRepresentation[occ.representationKind] ?? 0) + 1;
        externalBySourceRegion[occ.sourceRegionId] =
          (externalBySourceRegion[occ.sourceRegionId] ?? 0) + 1;

        if (occ.sourceRegionClass === 'le-object-file-backed') {
          if (occ.sourceObjectNumber === 1) externalInObject1++;
          else if (occ.sourceObjectNumber === 2) externalInObject2++;
        } else if (occ.sourceRegionClass === 'post-module-tail') {
          externalInTail++;
        } else if (occ.sourceRegionClass === 'pre-le-prefix') {
          externalInPreLE++;
        } else if (occ.sourceRegionClass === 'le-header-tables') {
          externalInHeader++;
        }
      }

      // Check detailed occurrence cap per representation
      const repCount = retainedPerRep[occ.representationKind];
      if (repCount < maxDetailedCap) {
        retainedPerRep[occ.representationKind]++;
        detailedOccurrences.push(occ);
      } else {
        candTruncated = true;
        totalOccurrencesOmitted++;
      }
    }

    if (candTruncated) {
      totalCandidatesTruncated++;
    }

    const repKindsTested: PaletteRepresentationKind[] = [];
    for (const k of ALL_PALETTE_REPRESENTATION_KINDS) {
      if (reps[k].status === 'generated') repKindsTested.push(k);
    }

    candidateSummaries.push({
      candidateId: c.id,
      byteStart: c.byteStart,
      byteStartHex: toHex32(c.byteStart),
      byteEnd: c.byteEnd,
      byteEndHex: toHex32(c.byteEnd),
      targetRegionId: targetReg?.regionId ?? 'unclassified',
      targetRegionClass: targetReg?.regionClass ?? 'unclassified',
      objectNumber: targetReg?.objectNumber ?? null,
      contentHash: c.contentHash,
      length: c.length,
      researchScore: c.researchScore,
      zeroShiftKanoCompatible: c.zeroShiftKanoCompatible,
      representationKindsTested: repKindsTested,
      representations: reps,
      totalLogicalMatches,
      totalUniquePhysicalOccurrences: uniquePhysicalOffsets.size,
      selfOccurrenceCount,
      externalOccurrenceCount,
      externalByRepresentation,
      externalBySourceRegion,
      externalInObject1,
      externalInObject2,
      externalInTail,
      externalInPreLE,
      externalInHeader,
      detailsTruncated: candTruncated,
      firstOccurrenceOffsetHex: firstOffset !== null ? toHex32(firstOffset) : null,
      lastOccurrenceOffsetHex: lastOffset !== null ? toHex32(lastOffset) : null,
    });
  }

  // Stage 7: Control Target Aggregations
  logStageCheckpoint(operationId, 'research-mk1', 'palette-ref-recon', 'control-target aggregation complete');
  const controlTargetSummaries: ControlTargetSummary[] = standardControls.map((ctrl) => {
    const rawOccs = controlOccurrencesMap.get(ctrl.name) ?? [];
    const uniqueOffsets = new Set<number>(rawOccs.map((o) => o.sourceFileOffset));
    const sourceDist: Record<string, number> = {};
    let extCount = 0;

    for (const occ of rawOccs) {
      sourceDist[occ.sourceRegionId] = (sourceDist[occ.sourceRegionId] ?? 0) + 1;
      if (!occ.isInsideTargetCandidateRange) {
        extCount++;
      }
    }

    return {
      name: ctrl.name,
      physicalOffset: ctrl.physicalOffset,
      physicalOffsetHex: toHex32(ctrl.physicalOffset),
      representationsTested: ctrl.representations,
      totalLogicalMatches: rawOccs.length,
      uniquePhysicalOccurrences: uniqueOffsets.size,
      externalOccurrences: extCount,
      sourceRegionDistribution: sourceDist,
      occurrences: rawOccs.slice(0, maxDetailedCap),
    };
  });

  // Stage 8: Global Distribution Metrics
  let targetsWithExternal = 0;
  let totalExternalLogicalMatches = 0;
  let totalSelfOccurrences = 0;
  const uniqueExternalPhysicalOffsets = new Set<number>();

  let count0 = 0;
  let count1 = 0;
  let count2to5 = 0;
  let count6to20 = 0;
  let countMoreThan20 = 0;

  for (const cs of candidateSummaries) {
    totalSelfOccurrences += cs.selfOccurrenceCount;
    totalExternalLogicalMatches += cs.externalOccurrenceCount;

    const ext = cs.externalOccurrenceCount;
    if (ext > 0) {
      targetsWithExternal++;
    }

    if (ext === 0) count0++;
    else if (ext === 1) count1++;
    else if (ext <= 5) count2to5++;
    else if (ext <= 20) count6to20++;
    else countMoreThan20++;
  }

  // Count unique external physical occurrence positions across all candidates
  for (const occ of detailedOccurrences) {
    if (!occ.isInsideTargetCandidateRange) {
      uniqueExternalPhysicalOffsets.add(occ.sourceFileOffset);
    }
  }

  const globalSummary: GlobalOccurrenceSummary = {
    totalResearchTargets: researchTargetInputCount,
    targetsWithExternalExactOccurrences: targetsWithExternal,
    targetsWithNoExternalExactOccurrences: researchTargetInputCount - targetsWithExternal,
    percentageTargetsWithExternalOccurrences:
      researchTargetInputCount > 0
        ? parseFloat(((targetsWithExternal / researchTargetInputCount) * 100).toFixed(2))
        : 0,
    totalExternalLogicalMatches,
    uniqueExternalPhysicalOccurrencePositions: uniqueExternalPhysicalOffsets.size,
    totalSelfOccurrences,
    candidatesWith0ExternalOccurrences: count0,
    candidatesWith1ExternalOccurrence: count1,
    candidatesWith2To5ExternalOccurrences: count2to5,
    candidatesWith6To20ExternalOccurrences: count6to20,
    candidatesWithMoreThan20ExternalOccurrences: countMoreThan20,
  };

  // Stage 9: Representation Kind Summaries
  const representationSummaries: RepresentationKindSummary[] = ALL_PALETTE_REPRESENTATION_KINDS.map((kind) => {
    let eligibleTargetCount = 0;
    let targetsWithExternalHit = 0;
    let totalLogical = 0;
    const uniqueOffsets = new Set<number>();
    const sourceHist: Record<string, number> = {};

    for (const cs of candidateSummaries) {
      const repDesc = cs.representations[kind];
      if (repDesc && repDesc.status === 'generated') {
        eligibleTargetCount++;
        const matches = cs.externalByRepresentation[kind] ?? 0;
        if (matches > 0) {
          targetsWithExternalHit++;
          totalLogical += matches;
        }
      }
    }

    for (const occ of detailedOccurrences) {
      if (occ.representationKind === kind && !occ.isInsideTargetCandidateRange) {
        uniqueOffsets.add(occ.sourceFileOffset);
        sourceHist[occ.sourceRegionId] = (sourceHist[occ.sourceRegionId] ?? 0) + 1;
      }
    }

    return {
      representationKind: kind,
      eligibleTargetCount,
      targetsWithAnyExternalOccurrence: targetsWithExternalHit,
      percentageWithAnyExternalOccurrence:
        eligibleTargetCount > 0
          ? parseFloat(((targetsWithExternalHit / eligibleTargetCount) * 100).toFixed(2))
          : 0,
      totalExternalLogicalMatches: totalLogical,
      uniquePhysicalOccurrenceCount: uniqueOffsets.size,
      sourceRegionHistogram: sourceHist,
    };
  });

  // Stage 10: Target Region Summaries
  const targetRegionSummaries: TargetRegionSummary[] = topology.regions.map((reg) => {
    const targetsInRegion = candidateSummaries.filter((cs) => cs.targetRegionId === reg.regionId);
    const candidateCount = targetsInRegion.length;
    let withExt = 0;
    let totalExt = 0;
    const sourceDist: Record<string, number> = {};

    for (const cs of targetsInRegion) {
      if (cs.externalOccurrenceCount > 0) {
        withExt++;
      }
      totalExt += cs.externalOccurrenceCount;
      for (const [sId, sCount] of Object.entries(cs.externalBySourceRegion)) {
        sourceDist[sId] = (sourceDist[sId] ?? 0) + sCount;
      }
    }

    return {
      regionId: reg.regionId,
      regionClass: reg.regionClass,
      candidateCount,
      candidatesWithAnyExternalOccurrence: withExt,
      percentageWithAnyExternalOccurrence:
        candidateCount > 0
          ? parseFloat(((withExt / candidateCount) * 100).toFixed(2))
          : 0,
      totalExternalOccurrenceCount: totalExt,
      sourceRegionDistribution: sourceDist,
    };
  });

  // Stage 11: Source × Target Region Matrix (External occurrences only)
  const sourceTargetMatrixMap = new Map<string, number>();
  for (const cs of candidateSummaries) {
    for (const [srcRegId, count] of Object.entries(cs.externalBySourceRegion)) {
      const key = `${cs.targetRegionId}::${srcRegId}`;
      sourceTargetMatrixMap.set(key, (sourceTargetMatrixMap.get(key) ?? 0) + count);
    }
  }

  const sourceTargetMatrix: SourceTargetRegionMatrixCell[] = [];
  for (const [key, count] of sourceTargetMatrixMap.entries()) {
    const [targetRegionId, sourceRegionId] = key.split('::');
    sourceTargetMatrix.push({
      targetRegionId,
      sourceRegionId,
      externalOccurrenceCount: count,
    });
  }

  // Stage 12: Content Hash Summary
  const contentMap = new Map<string, { totalCopies: number; copiesWithExternal: number }>();
  for (const cs of candidateSummaries) {
    const entry = contentMap.get(cs.contentHash) ?? { totalCopies: 0, copiesWithExternal: 0 };
    entry.totalCopies++;
    if (cs.externalOccurrenceCount > 0) {
      entry.copiesWithExternal++;
    }
    contentMap.set(cs.contentHash, entry);
  }

  let contentsWithReferencesAtMultipleCopies = 0;
  let contentsWhereOnlyOneCopyWithExt = 0;
  let contentsWhereMultipleCopyWithExt = 0;
  let contentsWithZeroExt = 0;

  for (const entry of contentMap.values()) {
    if (entry.copiesWithExternal === 0) {
      contentsWithZeroExt++;
    } else if (entry.copiesWithExternal === 1) {
      contentsWhereOnlyOneCopyWithExt++;
    } else {
      contentsWhereMultipleCopyWithExt++;
    }
    if (entry.totalCopies > 1 && entry.copiesWithExternal > 0) {
      contentsWithReferencesAtMultipleCopies++;
    }
  }

  const contentHashSummary: PaletteContentHashReferenceSummary = {
    contentsWithReferencesAtMultiplePhysicalCopies: contentsWithReferencesAtMultipleCopies,
    contentsWhereOnlyOneCopyHasExternalOccurrences: contentsWhereOnlyOneCopyWithExt,
    contentsWhereMultipleCopiesHaveExternalOccurrences: contentsWhereMultipleCopyWithExt,
    contentsWithZeroExternalOccurrences: contentsWithZeroExt,
  };

  const reconciliation: PaletteReferenceReconciliation = {
    researchTargetInputCount,
    researchTargetsProcessed: candidateSummaries.length,
    researchTargetsSkipped: 0,
    skipReasons: {},
    allTargetsAccountedFor: candidateSummaries.length === researchTargetInputCount,
  };

  const durationMs = Date.now() - startTime;
  logStageCheckpoint(operationId, 'research-mk1', 'palette-ref-recon', 'export constructed', {
    durationMs,
    targetsWithExternal,
    totalExternalLogicalMatches,
  });

  return {
    status: 'SUCCESS',
    metadata: {
      operationId,
      timestamp: new Date().toISOString(),
      durationMs,
    },
    fixture: {
      exePath,
      exeSize,
    },
    reconciliation,
    globalSummary,
    representationSummaries,
    targetRegionSummaries,
    sourceTargetMatrix,
    candidateSummaries,
    contentHashSummary,
    controlTargets: controlTargetSummaries,
    detailedOccurrences,
    truncationSummary: {
      capPerRepresentation: maxDetailedCap,
      totalCandidatesTruncated,
      totalOccurrencesOmitted,
    },
  };
}

/**
 * Creates a deterministic, compact JSON export payload following the
 * `mk1_palette_reference_recon_v1` schema.
 */
export function createMK1CompactPaletteReferenceReconExport(
  result: MK1PaletteReferenceReconResult,
  scanResult: MK1PaletteScanResult,
  topology: MK1ExecutablePhysicalTopology,
  correlationResult: MK1PaletteRegionCorrelationResult,
  appInfo = {
    name: 'MK DOS Archive',
    version: '0.1.0',
    milestone: '1E.2B.1' as const,
  },
): MK1CompactPaletteReferenceReconExport {
  return {
    metadata: {
      formatVersion: 'mk1_palette_reference_recon_v1',
      exportTimestamp: new Date().toISOString(),
      application: appInfo.name,
      version: appInfo.version,
      milestone: '1E.2B.1',
      operationId: result.metadata.operationId,
    },
    fixture: {
      exePath: result.fixture.exePath,
      exeSize: result.fixture.exeSize,
      exeSizeHex: toHex32(result.fixture.exeSize),
    },
    sourceSummaries: {
      paletteCandidateCount: scanResult.counts.finalCandidatesCount,
      researchCandidateCount: scanResult.counts.researchCandidatesCount,
      executableTopologyRegionCount: topology.regions.length,
      correlationStatus: correlationResult.status,
    },
    scanConfiguration: {
      exactByteOrder: 'uint32-le',
      alignmentRequirement: 'none-recorded',
      contextWindowBytes: '8 before, 4 match, 8 after',
      capPerRepresentation: result.truncationSummary.capPerRepresentation,
    },
    reconciliation: result.reconciliation,
    globalSummary: result.globalSummary,
    representationSummaries: result.representationSummaries,
    targetRegionSummaries: result.targetRegionSummaries,
    sourceTargetMatrix: result.sourceTargetMatrix,
    candidateSummaries: result.candidateSummaries,
    contentHashSummary: result.contentHashSummary,
    controlTargets: result.controlTargets,
    detailedOccurrences: result.detailedOccurrences,
    truncationSummary: result.truncationSummary,
  };
}
