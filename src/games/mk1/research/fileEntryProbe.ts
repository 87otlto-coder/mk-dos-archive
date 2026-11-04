import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { scanUint32LE } from '../../../core/binary/chunkedScanner';
import { BinaryReader } from '../../../core/binary/BinaryReader';
import { APP_NAME, APP_VERSION } from '../../../appMetadata';

export const MK1_FILE_ENTRY_SIZE = 24; // 0x18 bytes
export const DEFAULT_TARGET_FLAGS = 0x12;

export interface MK1FileEntryRaw {
  entryOffset: number;
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
}

export interface MK1FileEntryValidation {
  fileSizeMatch: boolean;
  nonZeroFilenameOffset: boolean;
  flagsMatch: boolean;
  zeroPadding: boolean;
  zeroUnknown0: boolean;
  zeroBufferPtr: boolean;
  zeroUnknown1: boolean;
  allRulesPassed: boolean;
  passedRulesCount: number;
  totalRulesCount: number;
}

export interface MK1NeighborRecord {
  offset: number;
  offsetHex: string;
  indexDelta: number;
  rawFilenameOffset: number;
  rawFilenameOffsetHex: string;
  fileSize: number;
  fileSizeHex: string;
  flags: number;
  flagsHex: string;
  isValidCandidate: boolean;
  notes?: string;
}

export interface MK1NeighborSequence {
  sequenceStartOffset: number;
  sequenceStartOffsetHex: string;
  sequenceEndOffset: number;
  sequenceEndOffsetHex: string;
  consecutiveCount: number;
  backwardCount: number;
  forwardCount: number;
  provisionalIndex: number;
  provisionalIndexConfidence: 'hypothesis';
  neighbors: MK1NeighborRecord[];
}

export interface MK1FileEntryCandidate {
  entryOffset: number;
  entryOffsetHex: string;
  raw: MK1FileEntryRaw;
  validation: MK1FileEntryValidation;
  confidence: 'hypothesis' | 'inferred' | 'unknown';
  filenameResolution: 'UNRESOLVED' | string;
  neighborSequence?: MK1NeighborSequence;
}

export interface MK1ProbeResult {
  app: {
    name: string;
    version: string;
    probedAt: string;
  };
  gra: {
    path: string;
    size: number;
    sizeHex: string;
  };
  executable: {
    path: string;
    size: number;
  };
  sizeMatchOffsets: Array<{
    offset: number;
    offsetHex: string;
  }>;
  sizeMatchesCount: number;
  candidates: MK1FileEntryCandidate[];
  validCandidatesCount: number;
  summary: {
    primaryCandidateOffsetHex?: string;
    provisionalTableIndex?: number;
    consecutiveEntriesCount?: number;
    researchConclusion: string;
  };
}

export interface MK1ProbeExportData {
  app: {
    name: string;
    version: string;
    exportedAt: string;
  };
  gameFixture: string;
  targetGra: {
    path: string;
    size: number;
    sizeHex: string;
  };
  primaryExecutable: {
    path: string;
    size: number;
  };
  rawSizeMatches: {
    count: number;
    offsetsHex: string[];
  };
  candidateFileEntries: Array<{
    offsetHex: string;
    rawFilenameOffsetHex: string;
    fileSizeHex: string;
    fileSizeDecimal: number;
    flagsHex: string;
    paddingHex: string;
    unknown0Hex: string;
    bufferPointerHex: string;
    unknown1Hex: string;
    validation: MK1FileEntryValidation;
    confidence: string;
    filenameResolution: string;
    neighborSequence?: {
      sequenceStartOffsetHex: string;
      sequenceEndOffsetHex: string;
      consecutiveCount: number;
      provisionalIndex: number;
      provisionalIndexConfidence: string;
      sampledNeighbors: Array<{
        indexDelta: number;
        offsetHex: string;
        rawFilenameOffsetHex: string;
        fileSizeHex: string;
        flagsHex: string;
        isValid: boolean;
      }>;
    };
  }>;
  summary: {
    validCandidatesCount: number;
    researchConclusion: string;
  };
}

/**
 * Parses and evaluates a 24-byte buffer as an MK1 FileEntry candidate.
 */
export function parseCandidateFileEntry(
  buffer: Uint8Array,
  entryOffset: number,
  targetFileSize?: number,
): MK1FileEntryCandidate | null {
  if (buffer.byteLength < MK1_FILE_ENTRY_SIZE) {
    return null;
  }

  const reader = new BinaryReader(buffer, 0);
  const rawFilenameOffset = reader.readUint32LE();
  const fileSize = reader.readUint32LE();
  const flags = reader.readUint8();
  const pad0 = reader.readUint8();
  const pad1 = reader.readUint8();
  const pad2 = reader.readUint8();
  const unknown0 = reader.readUint32LE();
  const bufferPointer = reader.readUint32LE();
  const unknown1 = reader.readUint32LE();

  const toHex32 = (v: number) => `0x${(v >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
  const toHex8 = (v: number) => `0x${v.toString(16).toUpperCase().padStart(2, '0')}`;

  const fileSizeMatch =
    targetFileSize !== undefined ? fileSize === targetFileSize : fileSize > 0;
  const validFilenameOffset = rawFilenameOffset >= 0 && rawFilenameOffset < 0x01000000;
  const flagsMatch = flags === DEFAULT_TARGET_FLAGS;
  const zeroPadding = pad0 === 0 && pad1 === 0 && pad2 === 0;
  const zeroUnknown0 = unknown0 === 0;
  const zeroBufferPtr = bufferPointer === 0;
  const zeroUnknown1 = unknown1 === 0;

  const rules = [
    fileSizeMatch,
    validFilenameOffset,
    flagsMatch,
    zeroPadding,
    zeroUnknown0,
    zeroBufferPtr,
    zeroUnknown1,
  ];

  const passedRulesCount = rules.filter(Boolean).length;
  const totalRulesCount = rules.length;
  const allRulesPassed = passedRulesCount === totalRulesCount;

  // Determine structural confidence without overclaiming
  let confidence: 'hypothesis' | 'inferred' | 'unknown' = 'unknown';
  if (allRulesPassed) {
    confidence = 'hypothesis'; // Strong candidate conforming to all documented rules
  } else if (
    fileSizeMatch &&
    validFilenameOffset &&
    (flags === 0x12 || flags === 0x02 || flags === 0x10) &&
    [zeroUnknown0, zeroBufferPtr, zeroUnknown1].filter(Boolean).length >= 2
  ) {
    confidence = 'inferred';
  }

  const raw: MK1FileEntryRaw = {
    entryOffset,
    rawFilenameOffset,
    rawFilenameOffsetHex: toHex32(rawFilenameOffset),
    fileSize,
    fileSizeHex: toHex32(fileSize),
    flags,
    flagsHex: toHex8(flags),
    padding: [pad0, pad1, pad2],
    unknown0,
    bufferPointer,
    unknown1,
  };

  const validation: MK1FileEntryValidation = {
    fileSizeMatch,
    nonZeroFilenameOffset: validFilenameOffset,
    flagsMatch,
    zeroPadding,
    zeroUnknown0,
    zeroBufferPtr,
    zeroUnknown1,
    allRulesPassed,
    passedRulesCount,
    totalRulesCount,
  };

  return {
    entryOffset,
    entryOffsetHex: toHex32(entryOffset),
    raw,
    validation,
    confidence,
    filenameResolution: 'UNRESOLVED',
  };
}

/**
 * Checks if a 24-byte record satisfies plausible MK1 FileEntry characteristics.
 */
export function isPlausibleFileEntryRecord(buffer: Uint8Array): {
  isValid: boolean;
  rawFilenameOffset: number;
  fileSize: number;
  flags: number;
} {
  if (buffer.byteLength < MK1_FILE_ENTRY_SIZE) {
    return { isValid: false, rawFilenameOffset: 0, fileSize: 0, flags: 0 };
  }

  const reader = new BinaryReader(buffer, 0);
  const rawFilenameOffset = reader.readUint32LE();
  const fileSize = reader.readUint32LE();
  const flags = reader.readUint8();
  const pad0 = reader.readUint8();
  const pad1 = reader.readUint8();
  const pad2 = reader.readUint8();
  const unknown0 = reader.readUint32LE();
  const bufferPointer = reader.readUint32LE();
  const unknown1 = reader.readUint32LE();

  // Plausibility heuristic:
  // - valid raw filename offset (< 16 MB)
  // - non-zero reasonable file size (< 20 MB)
  // - flags standard (0x12) or typical DOS flag (0x02, 0x10)
  // - runtime fields (bufferPointer, unknown0, unknown1) generally zero in executable image on disk
  const isPlausible =
    rawFilenameOffset >= 0 &&
    rawFilenameOffset < 0x01000000 &&
    fileSize > 0 &&
    fileSize < 20_000_000 &&
    (flags === 0x12 || flags === 0x02 || flags === 0x10 || flags === 0x00) &&
    pad0 === 0 &&
    pad1 === 0 &&
    pad2 === 0 &&
    unknown0 === 0 &&
    bufferPointer === 0 &&
    unknown1 === 0;

  return {
    isValid: isPlausible,
    rawFilenameOffset,
    fileSize,
    flags,
  };
}

/**
 * Probes neighboring 24-byte records surrounding a candidate FileEntry to discover contiguous table sequence.
 */
export async function probeNeighborSequence(
  source: DirectorySource,
  exePath: string,
  candidateOffset: number,
  exeSize: number,
  maxRadius = 16,
): Promise<MK1NeighborSequence> {
  const toHex32 = (v: number) => `0x${(v >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
  const toHex8 = (v: number) => `0x${v.toString(16).toUpperCase().padStart(2, '0')}`;

  const neighbors: MK1NeighborRecord[] = [];

  // Probe backwards
  let backwardCount = 0;
  for (let step = 1; step <= maxRadius; step++) {
    const offset = candidateOffset - step * MK1_FILE_ENTRY_SIZE;
    if (offset < 0) {
      break;
    }

    try {
      const slice = await source.readSlice(exePath, offset, MK1_FILE_ENTRY_SIZE);
      const evalRecord = isPlausibleFileEntryRecord(slice);
      if (evalRecord.isValid) {
        backwardCount++;
        neighbors.unshift({
          offset,
          offsetHex: toHex32(offset),
          indexDelta: -step,
          rawFilenameOffset: evalRecord.rawFilenameOffset,
          rawFilenameOffsetHex: toHex32(evalRecord.rawFilenameOffset),
          fileSize: evalRecord.fileSize,
          fileSizeHex: toHex32(evalRecord.fileSize),
          flags: evalRecord.flags,
          flagsHex: toHex8(evalRecord.flags),
          isValidCandidate: true,
        });
      } else {
        // Record the boundary-breaking record for diagnostic transparency and stop
        neighbors.unshift({
          offset,
          offsetHex: toHex32(offset),
          indexDelta: -step,
          rawFilenameOffset: evalRecord.rawFilenameOffset,
          rawFilenameOffsetHex: toHex32(evalRecord.rawFilenameOffset),
          fileSize: evalRecord.fileSize,
          fileSizeHex: toHex32(evalRecord.fileSize),
          flags: evalRecord.flags,
          flagsHex: toHex8(evalRecord.flags),
          isValidCandidate: false,
          notes: 'Non-conforming record; sequence terminated',
        });
        break;
      }
    } catch {
      break;
    }
  }

  // Probe forwards
  let forwardCount = 0;
  for (let step = 1; step <= maxRadius; step++) {
    const offset = candidateOffset + step * MK1_FILE_ENTRY_SIZE;
    if (offset + MK1_FILE_ENTRY_SIZE > exeSize) {
      break;
    }

    try {
      const slice = await source.readSlice(exePath, offset, MK1_FILE_ENTRY_SIZE);
      const evalRecord = isPlausibleFileEntryRecord(slice);
      if (evalRecord.isValid) {
        forwardCount++;
        neighbors.push({
          offset,
          offsetHex: toHex32(offset),
          indexDelta: step,
          rawFilenameOffset: evalRecord.rawFilenameOffset,
          rawFilenameOffsetHex: toHex32(evalRecord.rawFilenameOffset),
          fileSize: evalRecord.fileSize,
          fileSizeHex: toHex32(evalRecord.fileSize),
          flags: evalRecord.flags,
          flagsHex: toHex8(evalRecord.flags),
          isValidCandidate: true,
        });
      } else {
        neighbors.push({
          offset,
          offsetHex: toHex32(offset),
          indexDelta: step,
          rawFilenameOffset: evalRecord.rawFilenameOffset,
          rawFilenameOffsetHex: toHex32(evalRecord.rawFilenameOffset),
          fileSize: evalRecord.fileSize,
          fileSizeHex: toHex32(evalRecord.fileSize),
          flags: evalRecord.flags,
          flagsHex: toHex8(evalRecord.flags),
          isValidCandidate: false,
          notes: 'Non-conforming record; sequence terminated',
        });
        break;
      }
    } catch {
      break;
    }
  }

  const sequenceStartOffset = candidateOffset - backwardCount * MK1_FILE_ENTRY_SIZE;
  const sequenceEndOffset =
    candidateOffset + (forwardCount + 1) * MK1_FILE_ENTRY_SIZE;
  const consecutiveCount = backwardCount + 1 + forwardCount;
  const provisionalIndex = backwardCount;

  return {
    sequenceStartOffset,
    sequenceStartOffsetHex: toHex32(sequenceStartOffset),
    sequenceEndOffset,
    sequenceEndOffsetHex: toHex32(sequenceEndOffset),
    consecutiveCount,
    backwardCount,
    forwardCount,
    provisionalIndex,
    provisionalIndexConfidence: 'hypothesis',
    neighbors,
  };
}

export interface MK1ProbeOptions {
  exePath?: string;
  neighborProbeRadius?: number;
  onProgress?: (bytesScanned: number, totalBytes: number) => void;
}

/**
 * Main forensic correlation probe: scans MK1.EXE for a specified GRA file's size,
 * parses candidate FileEntry structures, validates field rules, and probes contiguous table arrays.
 */
export async function probeMK1ExecutableForGRA(
  source: DirectorySource,
  graPath: string,
  options: MK1ProbeOptions = {},
): Promise<MK1ProbeResult> {
  const toHex32 = (v: number) => `0x${(v >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;

  const files = await source.listRecursive();

  // 1. Locate GRA file
  const normalizedGra = graPath.toUpperCase();
  const graEntry = files.find(
    (f) => f.path.toUpperCase() === normalizedGra || f.name.toUpperCase() === normalizedGra,
  );
  if (!graEntry) {
    throw new Error(`Target GRA resource not found in directory: ${graPath}`);
  }

  // 2. Locate Primary Executable
  let exeEntry = options.exePath
    ? files.find((f) => f.path.toUpperCase() === options.exePath?.toUpperCase())
    : undefined;

  if (!exeEntry) {
    exeEntry = files.find((f) => {
      const u = f.name.toUpperCase();
      return u === 'MK1.EXE' || u === 'MK.EXE';
    });
  }

  if (!exeEntry) {
    throw new Error(
      'Primary MK1 executable (MK1.EXE / MK.EXE) not found in directory source',
    );
  }

  const targetSize = graEntry.size;
  const targetSizeHex = toHex32(targetSize);

  // 3. Scan for target size uint32LE occurrences in the executable
  const matchOffsets = await scanUint32LE(
    source,
    exeEntry.path,
    targetSize,
    {
      fileSize: exeEntry.size,
      onProgress: options.onProgress,
    },
  );

  const candidates: MK1FileEntryCandidate[] = [];

  // 4. For each size occurrence, calculate candidate FileEntry start (fileSizeOffset - 4)
  for (const fileSizeOffset of matchOffsets) {
    const candidateOffset = fileSizeOffset - 4;
    if (candidateOffset < 0 || candidateOffset + MK1_FILE_ENTRY_SIZE > exeEntry.size) {
      continue;
    }

    try {
      const slice = await source.readSlice(
        exeEntry.path,
        candidateOffset,
        MK1_FILE_ENTRY_SIZE,
      );
      const candidate = parseCandidateFileEntry(slice, candidateOffset, targetSize);
      if (candidate) {
        // If candidate meets baseline rules, probe neighbor sequence
        if (candidate.confidence !== 'unknown') {
          const neighborSeq = await probeNeighborSequence(
            source,
            exeEntry.path,
            candidateOffset,
            exeEntry.size,
            options.neighborProbeRadius ?? 16,
          );
          candidate.neighborSequence = neighborSeq;
        }
        candidates.push(candidate);
      }
    } catch {
      // Gracefully ignore slice read errors for isolated candidate
    }
  }

  const validCandidates = candidates.filter((c) => c.confidence !== 'unknown');

  let primaryCandidate: MK1FileEntryCandidate | undefined;
  if (validCandidates.length > 0) {
    primaryCandidate = validCandidates[0];
  }

  let conclusion = `Found ${matchOffsets.length} raw uint32LE match(es) for size ${targetSizeHex} (${targetSize.toLocaleString()} bytes). `;
  if (validCandidates.length === 1 && primaryCandidate?.neighborSequence) {
    const seq = primaryCandidate.neighborSequence;
    conclusion += `Identified 1 strong FileEntry candidate at offset ${primaryCandidate.entryOffsetHex} embedded within a contiguous array of ${seq.consecutiveCount} plausible entries (provisional table index: ${seq.provisionalIndex}).`;
  } else if (validCandidates.length > 1) {
    conclusion += `Identified ${validCandidates.length} candidate structures matching FileEntry layout rules.`;
  } else {
    conclusion += `No raw size occurrences satisfied the full FileEntry layout rules.`;
  }

  return {
    app: {
      name: APP_NAME,
      version: APP_VERSION,
      probedAt: new Date().toISOString(),
    },
    gra: {
      path: graEntry.path,
      size: graEntry.size,
      sizeHex: targetSizeHex,
    },
    executable: {
      path: exeEntry.path,
      size: exeEntry.size,
    },
    sizeMatchOffsets: matchOffsets.map((offset) => ({
      offset,
      offsetHex: toHex32(offset),
    })),
    sizeMatchesCount: matchOffsets.length,
    candidates,
    validCandidatesCount: validCandidates.length,
    summary: {
      primaryCandidateOffsetHex: primaryCandidate?.entryOffsetHex,
      provisionalTableIndex: primaryCandidate?.neighborSequence?.provisionalIndex,
      consecutiveEntriesCount: primaryCandidate?.neighborSequence?.consecutiveCount,
      researchConclusion: conclusion,
    },
  };
}

/**
 * Builds clean export JSON without binary dumps.
 */
export function createMK1ProbeExport(result: MK1ProbeResult): MK1ProbeExportData {
  const toHex32 = (v: number) => `0x${(v >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
  const toHex8 = (v: number) => `0x${v.toString(16).toUpperCase().padStart(2, '0')}`;

  return {
    app: {
      name: result.app.name,
      version: result.app.version,
      exportedAt: new Date().toISOString(),
    },
    gameFixture: 'Mortal Kombat (DOS)',
    targetGra: {
      path: result.gra.path,
      size: result.gra.size,
      sizeHex: result.gra.sizeHex,
    },
    primaryExecutable: {
      path: result.executable.path,
      size: result.executable.size,
    },
    rawSizeMatches: {
      count: result.sizeMatchesCount,
      offsetsHex: result.sizeMatchOffsets.map((m) => m.offsetHex),
    },
    candidateFileEntries: result.candidates.map((c) => ({
      offsetHex: c.entryOffsetHex,
      rawFilenameOffsetHex: c.raw.rawFilenameOffsetHex,
      fileSizeHex: c.raw.fileSizeHex,
      fileSizeDecimal: c.raw.fileSize,
      flagsHex: c.raw.flagsHex,
      paddingHex: c.raw.padding.map(toHex8).join(' '),
      unknown0Hex: toHex32(c.raw.unknown0),
      bufferPointerHex: toHex32(c.raw.bufferPointer),
      unknown1Hex: toHex32(c.raw.unknown1),
      validation: c.validation,
      confidence: c.confidence,
      filenameResolution: c.filenameResolution,
      neighborSequence: c.neighborSequence
        ? {
            sequenceStartOffsetHex: c.neighborSequence.sequenceStartOffsetHex,
            sequenceEndOffsetHex: c.neighborSequence.sequenceEndOffsetHex,
            consecutiveCount: c.neighborSequence.consecutiveCount,
            provisionalIndex: c.neighborSequence.provisionalIndex,
            provisionalIndexConfidence: c.neighborSequence.provisionalIndexConfidence,
            sampledNeighbors: c.neighborSequence.neighbors.map((n) => ({
              indexDelta: n.indexDelta,
              offsetHex: n.offsetHex,
              rawFilenameOffsetHex: n.rawFilenameOffsetHex,
              fileSizeHex: n.fileSizeHex,
              flagsHex: n.flagsHex,
              isValid: n.isValidCandidate,
            })),
          }
        : undefined,
    })),
    summary: {
      validCandidatesCount: result.validCandidatesCount,
      researchConclusion: result.summary.researchConclusion,
    },
  };
}
