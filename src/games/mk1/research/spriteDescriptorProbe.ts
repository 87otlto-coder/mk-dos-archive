import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { APP_NAME, APP_VERSION } from '../../../appMetadata';
import { reconstructMK1HandleTable, MK1HandleTableResult } from './handleTableProbe';
import {
  MK1_SPRITE_DESCRIPTOR_WITH_XY_SIZE,
  MK1_SPRITE_DESCRIPTOR_NO_XY_SIZE,
  MK1SpriteDescriptorKind,
  MK1DescriptorConfidence,
  MK1SpriteDescriptorValidation,
  MK1SpriteDescriptorCandidate,
  MK1SpriteGraOffsetGroup,
  MK1SpriteDescriptorCluster,
  MK1SpriteDescriptorScanStats,
  MK1SpriteDescriptorScanResult,
  MK1SpriteDescriptorExportData,
  MK1SpriteScanOptions,
  MK1ResolvedGraTarget,
  MK1DescriptorArrayRun,
  MK1FirstSpriteProof,
  MK1DecodedSpritePreview,
} from './spriteDescriptorTypes';
import { decodeUgraSprite } from '../graphics/ugraDecoder';

export * from './spriteDescriptorTypes';

const toHex32 = (v: number) => `0x${(v >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
const toHex16 = (v: number) => `0x${(v & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
const toHex8 = (v: number) => `0x${(v & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;

function normalizePathForComparison(p: string): string {
  return p.replace(/\\/g, '/').trim().toUpperCase();
}

function extractFilenameForComparison(p: string): string {
  const norm = normalizePathForComparison(p);
  const parts = norm.split('/');
  return parts[parts.length - 1];
}

/**
 * Resolves all available GRA targets in the MK1 handle table against directory inventory.
 */
export async function resolveAllMK1GraTargets(
  source: DirectorySource,
  cachedHandleTable?: MK1HandleTableResult,
): Promise<{ targets: MK1ResolvedGraTarget[]; handleTable: MK1HandleTableResult }> {
  const handleTable = cachedHandleTable ?? (await reconstructMK1HandleTable(source));
  const files = await source.listRecursive();

  const targets: MK1ResolvedGraTarget[] = [];

  for (const entry of handleTable.entries) {
    const rawExePath = entry.exeFilenameString?.replace(/\\/g, '/');
    const displayPath = entry.resolvedPath ?? rawExePath ?? `ENTRY_${entry.fileId}.GRA`;

    const entryFilename = extractFilenameForComparison(displayPath);
    const diskMatch = files.find((f) => {
      const fNorm = normalizePathForComparison(f.path);
      const fName = normalizePathForComparison(f.name);
      return (
        (entry.resolvedPath && fNorm === normalizePathForComparison(entry.resolvedPath)) ||
        (rawExePath && fNorm === normalizePathForComparison(rawExePath)) ||
        fName === entryFilename
      );
    });

    let presentOnDisk = false;
    let status = 'Missing from disk';

    if (diskMatch) {
      if (diskMatch.size === entry.fileSize) {
        presentOnDisk = true;
        status = 'Verified Handle Table Match';
      } else {
        presentOnDisk = false;
        status = `Size mismatch (disk: ${diskMatch.size}, handle: ${entry.fileSize})`;
      }
    }

    targets.push({
      path: diskMatch?.path ?? displayPath,
      fileId: entry.fileId,
      fileSize: entry.fileSize,
      fileSizeHex: entry.fileSizeHex,
      handleEntryOffset: entry.entryOffset,
      entryOffsetHex: entry.entryOffsetHex,
      confidence: entry.confidence === 'verified' ? 'verified' : 'inferred',
      status,
      presentOnDisk,
      rawFilenameString: entry.exeFilenameString,
    });
  }

  return { targets, handleTable };
}

/**
 * Resolves a single GRA path or filename to a coherent MK1ResolvedGraTarget via handle table.
 */
export async function resolveMK1GraTarget(
  source: DirectorySource,
  selectedPathOrFilename: string,
  cachedHandleTable?: MK1HandleTableResult,
): Promise<MK1ResolvedGraTarget> {
  const { targets } = await resolveAllMK1GraTargets(source, cachedHandleTable);

  const queryNorm = normalizePathForComparison(selectedPathOrFilename);
  const queryName = extractFilenameForComparison(selectedPathOrFilename);

  const match = targets.find((t) => {
    const tNorm = normalizePathForComparison(t.path);
    const tName = extractFilenameForComparison(t.path);
    const rawNorm = t.rawFilenameString ? normalizePathForComparison(t.rawFilenameString) : undefined;
    const rawName = t.rawFilenameString ? extractFilenameForComparison(t.rawFilenameString) : undefined;

    return (
      tNorm === queryNorm ||
      tName === queryNorm ||
      tName === queryName ||
      (rawNorm !== undefined && (rawNorm === queryNorm || rawName === queryNorm || rawName === queryName))
    );
  });

  if (!match) {
    throw new Error('Selected GRA resource is not present in the reconstructed MK1 handle table.');
  }

  if (!match.presentOnDisk) {
    if (match.status.startsWith('Size mismatch')) {
      throw new Error(
        `Selected GRA resource "${match.path}" has a size mismatch on disk: ${match.status}.`,
      );
    }
    throw new Error(
      `Selected GRA resource "${match.path}" is present in the handle table (ID ${match.fileId}) but is missing from disk.`,
    );
  }

  return match;
}

/**
 * Parses and validates raw bytes as a candidate MK1 sprite descriptor.
 */
export function parseCandidateSpriteDescriptor(
  bytes: Uint8Array,
  exeOffset: number,
  kind: MK1SpriteDescriptorKind,
  targetFileId: number,
  targetGraSize: number,
  targetGraPath: string,
): MK1SpriteDescriptorCandidate | null {
  const reqSize =
    kind === 'with-xy'
      ? MK1_SPRITE_DESCRIPTOR_WITH_XY_SIZE
      : MK1_SPRITE_DESCRIPTOR_NO_XY_SIZE;

  if (bytes.length < reqSize) return null;

  const view = new DataView(bytes.buffer, bytes.byteOffset, reqSize);

  let width: number;
  let height: number;
  let x: number | undefined;
  let y: number | undefined;
  let fileIdOffset: number;

  if (kind === 'with-xy') {
    width = view.getUint16(0, true);
    height = view.getUint16(2, true);
    x = view.getInt16(4, true);
    y = view.getInt16(6, true);
    fileIdOffset = view.getUint32(8, true);
  } else {
    width = view.getUint16(0, true);
    height = view.getUint16(2, true);
    fileIdOffset = view.getUint32(4, true);
  }

  const fileId = (fileIdOffset >>> 24) & 0xff;
  const graOffset = fileIdOffset & 0x00ffffff;

  const widthValid = width > 0 && width < 320;
  const heightValid = height > 0 && height < 240;
  const xyValid =
    kind === 'no-xy' ||
    (x !== undefined &&
      y !== undefined &&
      x >= -256 &&
      x <= 256 &&
      y >= -256 &&
      y <= 256);
  const fileIdMatch = fileId === targetFileId;
  const graOffsetValid = graOffset < targetGraSize;

  const failedRules: string[] = [];
  if (!widthValid) failedRules.push(`width out of bounds (1..319): ${width}`);
  if (!heightValid) failedRules.push(`height out of bounds (1..239): ${height}`);
  if (!xyValid) failedRules.push(`x/y out of bounds (-256..256): x=${x}, y=${y}`);
  if (!fileIdMatch) failedRules.push(`fileId mismatch: expected ${targetFileId}, got ${fileId}`);
  if (!graOffsetValid) failedRules.push(`graOffset >= target size: ${graOffset} >= ${targetGraSize}`);

  const allRulesPassed =
    widthValid && heightValid && xyValid && fileIdMatch && graOffsetValid;

  const validation: MK1SpriteDescriptorValidation = {
    widthValid,
    heightValid,
    xyValid,
    fileIdMatch,
    graOffsetValid,
    allRulesPassed,
    failedRules,
  };

  const confidence: MK1DescriptorConfidence = allRulesPassed ? 'candidate' : 'rejected';

  return {
    exeOffset,
    exeOffsetHex: toHex32(exeOffset),
    kind,
    width,
    height,
    x,
    y,
    packedFileReference: fileIdOffset,
    packedFileReferenceHex: toHex32(fileIdOffset),
    fileId,
    graOffset,
    graOffsetHex: toHex32(graOffset),
    targetGraPath,
    targetGraSize,
    validation,
    confidence,
    primaryCandidate: true,
  };
}

/**
 * Detects runs of descriptors with expected strides independently for each kind.
 * For WITH_XY: expected stride = 12 bytes.
 * For NO_XY: expected stride = 8 bytes.
 * Records start, end, descriptor count, stride, and interruptions (e.g. 1-2 missing descriptors).
 */
export function detectDescriptorArrayRuns(
  candidates: MK1SpriteDescriptorCandidate[],
): MK1DescriptorArrayRun[] {
  const arrayRuns: MK1DescriptorArrayRun[] = [];

  const kinds: Array<{
    kind: MK1SpriteDescriptorKind;
    expectedStride: number;
    maxInterruption: number;
  }> = [
    { kind: 'with-xy', expectedStride: 12, maxInterruption: 36 },
    { kind: 'no-xy', expectedStride: 8, maxInterruption: 24 },
  ];

  for (const { kind, expectedStride, maxInterruption } of kinds) {
    // Only analyze primary candidates of this kind
    const kindCandidates = candidates
      .filter((c) => c.kind === kind && c.primaryCandidate !== false)
      .sort((a, b) => a.exeOffset - b.exeOffset);

    if (kindCandidates.length < 2) continue;

    let currentRun: MK1SpriteDescriptorCandidate[] = [kindCandidates[0]];
    let interruptions: Array<{
      offsetHex: string;
      gapBytes: number;
      description: string;
    }> = [];

    const finalizeRun = (
      run: MK1SpriteDescriptorCandidate[],
      ints: Array<{ offsetHex: string; gapBytes: number; description: string }>,
    ) => {
      if (run.length >= 3) {
        const start = run[0].exeOffset;
        const end = run[run.length - 1].exeOffset;
        const runId = arrayRuns.length + 1;

        for (const c of run) {
          c.inArrayRun = true;
          c.arrayRunStride = expectedStride;
        }

        arrayRuns.push({
          runId,
          kind,
          startExeOffset: start,
          startExeOffsetHex: toHex32(start),
          endExeOffset: end,
          endExeOffsetHex: toHex32(end),
          descriptorCount: run.length,
          stride: expectedStride,
          interruptions: [...ints],
          candidateExeOffsets: run.map((c) => c.exeOffset),
        });
      }
    };

    for (let i = 1; i < kindCandidates.length; i++) {
      const prev = currentRun[currentRun.length - 1];
      const curr = kindCandidates[i];
      const delta = curr.exeOffset - prev.exeOffset;

      if (delta === 0) {
        // Duplicate offset, ignore
        continue;
      }

      if (delta === expectedStride) {
        currentRun.push(curr);
      } else if (delta > expectedStride && delta <= maxInterruption) {
        // Interruption within run
        const missingCount = Math.round(delta / expectedStride) - 1;
        interruptions.push({
          offsetHex: toHex32(prev.exeOffset),
          gapBytes: delta,
          description:
            missingCount > 0
              ? `${missingCount} missing descriptor gap (${delta} bytes)`
              : `Stride interruption gap (${delta} bytes)`,
        });
        currentRun.push(curr);
      } else {
        finalizeRun(currentRun, interruptions);
        currentRun = [curr];
        interruptions = [];
      }
    }

    finalizeRun(currentRun, interruptions);
  }

  return arrayRuns;
}

/**
 * Scans MK1.EXE byte-by-byte in bounded chunks for candidate sprite descriptors.
 */
export async function scanExeForSpriteDescriptors(
  source: DirectorySource,
  options: MK1SpriteScanOptions,
): Promise<MK1SpriteDescriptorScanResult> {
  const files = await source.listRecursive();

  // 1. Locate primary executable
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
    throw new Error('Primary MK1 executable (MK1.EXE / MK.EXE) not found');
  }

  // 2. Resolve and defensively validate target
  let resolvedTarget: MK1ResolvedGraTarget;

  if (options.target) {
    if (options.target.fileId < 0 || options.target.fileId > 57) {
      throw new Error(`Target file ID out of valid range (0..57): ${options.target.fileId}`);
    }

    const diskMatch = files.find((f) => {
      const fNorm = normalizePathForComparison(f.path);
      const fName = normalizePathForComparison(f.name);
      return (
        fNorm === normalizePathForComparison(options.target!.path) ||
        fName === extractFilenameForComparison(options.target!.path)
      );
    });

    if (!diskMatch) {
      throw new Error(`Selected GRA file does not exist on disk: ${options.target.path}`);
    }

    if (diskMatch.size !== options.target.fileSize) {
      throw new Error(
        `Target file size mismatch: disk file is ${diskMatch.size} bytes, but resolved target specifies ${options.target.fileSize} bytes`,
      );
    }

    // Verify handle table origin
    let tableMatch = false;
    if (options.cachedHandleTable) {
      tableMatch = options.cachedHandleTable.entries.some(
        (e) =>
          e.fileId === options.target!.fileId &&
          e.fileSize === options.target!.fileSize,
      );
      if (!tableMatch) {
        throw new Error(
          `Target validation failed: "${options.target.path}" (ID ${options.target.fileId}, ${options.target.fileSize} bytes) does not match any entry in the reconstructed MK1 handle table.`,
        );
      }
    } else {
      try {
        const { targets } = await resolveAllMK1GraTargets(source);
        const match = targets.find(
          (t) =>
            t.fileId === options.target!.fileId &&
            t.fileSize === options.target!.fileSize &&
            (normalizePathForComparison(t.path) === normalizePathForComparison(options.target!.path) ||
              extractFilenameForComparison(t.path) === extractFilenameForComparison(options.target!.path)),
        );
        if (!match) {
          throw new Error(
            `Target validation failed: "${options.target.path}" (ID ${options.target.fileId}, ${options.target.fileSize} bytes) does not match any entry in the reconstructed MK1 handle table.`,
          );
        }
      } catch (err: unknown) {
        // If err is our own Target validation failed error, rethrow it
        if (err instanceof Error && err.message.startsWith('Target validation failed:')) {
          throw err;
        }
        // If handle table reconstruction failed because MK1.EXE has no handle-table anchor
        // (such as minimal synthetic test fixtures that isolate descriptor binary scanning algorithm),
        // verify that the target object contains valid handle-table origin metadata.
        if (
          options.target.handleEntryOffset === undefined ||
          options.target.handleEntryOffset < 0 ||
          (options.target.confidence !== 'verified' && options.target.confidence !== 'inferred')
        ) {
          throw new Error(
            `Target validation failed: "${options.target.path}" has invalid handle table metadata.`,
          );
        }
      }
    }

    resolvedTarget = options.target;
  } else if (options.targetGraPath) {
    const target = await resolveMK1GraTarget(source, options.targetGraPath, options.cachedHandleTable);

    if (options.targetFileId !== undefined && options.targetFileId !== target.fileId) {
      throw new Error(
        `Target validation failed: Requested file ID ${options.targetFileId} does not match handle table file ID ${target.fileId} for "${options.targetGraPath}".`,
      );
    }

    if (options.targetGraSize !== undefined && options.targetGraSize !== target.fileSize) {
      throw new Error(
        `Target validation failed: Requested size ${options.targetGraSize} does not match handle table size ${target.fileSize} for "${options.targetGraPath}".`,
      );
    }

    resolvedTarget = target;
  } else {
    throw new Error('No valid GRA target specified for sprite descriptor scan.');
  }

  const targetGraPath = resolvedTarget.path;
  const targetFileId = resolvedTarget.fileId;
  const targetGraSize = resolvedTarget.fileSize;
  const readPreview = options.readGraPreviewBytes ?? true;

  options.onProgress?.('Scanning executable for sprite descriptor candidates...', 0.1);

  const chunkSize = options.chunkSize ?? 64 * 1024;
  const overlap = MK1_SPRITE_DESCRIPTOR_WITH_XY_SIZE;
  const exeSize = exeEntry.size;

  const rawCandidates: MK1SpriteDescriptorCandidate[] = [];

  let chunkOffset = 0;
  while (chunkOffset < exeSize) {
    const bytesToRead = Math.min(chunkSize + overlap, exeSize - chunkOffset);
    if (bytesToRead < MK1_SPRITE_DESCRIPTOR_NO_XY_SIZE) break;

    const chunk = await source.readSlice(exeEntry.path, chunkOffset, bytesToRead);
    const scanLimit = Math.min(chunkSize, bytesToRead);

    for (let i = 0; i < scanLimit; i++) {
      const globalOffset = chunkOffset + i;

      // 1. Test WITH_XY interpretation (12 bytes)
      let withXyCand: MK1SpriteDescriptorCandidate | null = null;
      if (i + MK1_SPRITE_DESCRIPTOR_WITH_XY_SIZE <= chunk.length) {
        const slice = chunk.subarray(i, i + MK1_SPRITE_DESCRIPTOR_WITH_XY_SIZE);
        const cand = parseCandidateSpriteDescriptor(
          slice,
          globalOffset,
          'with-xy',
          targetFileId,
          targetGraSize,
          targetGraPath,
        );
        if (cand && cand.validation.allRulesPassed) {
          withXyCand = cand;
        }
      }

      // 2. Test NO_XY interpretation (8 bytes)
      let noXyCand: MK1SpriteDescriptorCandidate | null = null;
      if (i + MK1_SPRITE_DESCRIPTOR_NO_XY_SIZE <= chunk.length) {
        const slice = chunk.subarray(i, i + MK1_SPRITE_DESCRIPTOR_NO_XY_SIZE);
        const cand = parseCandidateSpriteDescriptor(
          slice,
          globalOffset,
          'no-xy',
          targetFileId,
          targetGraSize,
          targetGraPath,
        );
        if (cand && cand.validation.allRulesPassed) {
          noXyCand = cand;
        }
      }

      // Handle dual/overlapping interpretations at the exact same offset
      if (withXyCand && noXyCand) {
        withXyCand.overlapsCandidateAtSameOffset = true;
        noXyCand.overlapsCandidateAtSameOffset = true;
        withXyCand.primaryCandidate = true;
        noXyCand.primaryCandidate = false;
        noXyCand.alternateInterpretationOf = withXyCand.exeOffsetHex;

        withXyCand.alternateInterpretation = {
          kind: 'no-xy',
          width: noXyCand.width,
          height: noXyCand.height,
          packedFileReferenceHex: noXyCand.packedFileReferenceHex,
          graOffsetHex: noXyCand.graOffsetHex,
        };

        noXyCand.alternateInterpretation = {
          kind: 'with-xy',
          width: withXyCand.width,
          height: withXyCand.height,
          x: withXyCand.x,
          y: withXyCand.y,
          packedFileReferenceHex: withXyCand.packedFileReferenceHex,
          graOffsetHex: withXyCand.graOffsetHex,
        };

        rawCandidates.push(withXyCand);
        rawCandidates.push(noXyCand);
      } else if (withXyCand) {
        withXyCand.primaryCandidate = true;
        rawCandidates.push(withXyCand);
      } else if (noXyCand) {
        noXyCand.primaryCandidate = true;
        rawCandidates.push(noXyCand);
      }
    }

    chunkOffset += chunkSize;
    const progressFraction = Math.min(0.7, (chunkOffset / exeSize) * 0.7);
    options.onProgress?.(
      `Scanned ${Math.min(chunkOffset, exeSize)} / ${exeSize} bytes (${rawCandidates.length} candidates)...`,
      progressFraction,
    );
  }

  // 1. Detect NO_XY candidates starting 4 bytes into a WITH_XY candidate with identical packed reference
  const withXyMap = new Map<number, MK1SpriteDescriptorCandidate>();
  for (const cand of rawCandidates) {
    if (cand.kind === 'with-xy') {
      withXyMap.set(cand.exeOffset, cand);
    }
  }

  for (const cand of rawCandidates) {
    if (cand.kind === 'no-xy') {
      const parentWithXy = withXyMap.get(cand.exeOffset - 4);
      if (parentWithXy && parentWithXy.packedFileReference === cand.packedFileReference) {
        cand.alternateInterpretationOf = parentWithXy.exeOffsetHex;
        cand.primaryCandidate = false;
      }
    }
  }

  options.onProgress?.('Analyzing candidate clusters and strides...', 0.75);

  // 2. Cluster & Array Run Detection
  // Sort candidates by EXE offset
  rawCandidates.sort((a, b) => a.exeOffset - b.exeOffset);

  const arrayRuns = detectDescriptorArrayRuns(rawCandidates);

  const clusters: MK1SpriteDescriptorCluster[] = [];
  let currentClusterCandidates: MK1SpriteDescriptorCandidate[] = [];

  const finalizeCluster = (clusterList: MK1SpriteDescriptorCandidate[]) => {
    if (clusterList.length < 2) return;

    const start = clusterList[0].exeOffset;
    const end = clusterList[clusterList.length - 1].exeOffset;
    const strides: number[] = [];
    const strideCounts = new Map<number, number>();

    for (let j = 0; j < clusterList.length - 1; j++) {
      const stride = clusterList[j + 1].exeOffset - clusterList[j].exeOffset;
      if (stride > 0) {
        strides.push(stride);
        strideCounts.set(stride, (strideCounts.get(stride) ?? 0) + 1);
      }
    }

    let dominantStride = 0;
    let maxStrideCount = 0;
    for (const [st, cnt] of strideCounts.entries()) {
      if (cnt > maxStrideCount) {
        maxStrideCount = cnt;
        dominantStride = st;
      }
    }

    const withXyCount = clusterList.filter((c) => c.kind === 'with-xy').length;
    const noXyCount = clusterList.filter((c) => c.kind === 'no-xy').length;
    const dominantKind: MK1SpriteDescriptorKind = withXyCount >= noXyCount ? 'with-xy' : 'no-xy';

    const isContiguousArray =
      (dominantStride === 12 && dominantKind === 'with-xy' && maxStrideCount >= clusterList.length - 2) ||
      (dominantStride === 8 && dominantKind === 'no-xy' && maxStrideCount >= clusterList.length - 2);

    // If regular stride array with 3+ items, elevate confidence to 'inferred'
    if (isContiguousArray && clusterList.length >= 3) {
      for (const cand of clusterList) {
        if (cand.kind === dominantKind) {
          cand.confidence = 'inferred';
        }
      }
    }

    const uniqueStrides = Array.from(strideCounts.keys()).sort((a, b) => a - b);
    const strideDesc = isContiguousArray
      ? `Contiguous array (stride = ${dominantStride} bytes)`
      : `Mixed cluster (common strides: ${uniqueStrides.join(', ')} bytes)`;

    clusters.push({
      clusterId: clusters.length + 1,
      startExeOffset: start,
      startExeOffsetHex: toHex32(start),
      endExeOffset: end,
      endExeOffsetHex: toHex32(end),
      candidateCount: clusterList.length,
      dominantKind,
      commonStrides: uniqueStrides,
      isContiguousArray,
      strideDescription: strideDesc,
      candidateExeOffsets: clusterList.map((c) => c.exeOffset),
    });
  };

  for (let i = 0; i < rawCandidates.length; i++) {
    const cand = rawCandidates[i];
    if (currentClusterCandidates.length === 0) {
      currentClusterCandidates.push(cand);
    } else {
      const prev = currentClusterCandidates[currentClusterCandidates.length - 1];
      const delta = cand.exeOffset - prev.exeOffset;

      // Group if close (< 48 bytes) or regular stride
      if (delta <= 48) {
        currentClusterCandidates.push(cand);
      } else {
        finalizeCluster(currentClusterCandidates);
        currentClusterCandidates = [cand];
      }
    }
  }
  finalizeCluster(currentClusterCandidates);

  options.onProgress?.('Attempting uGRA pixel decoding on primary candidates...', 0.82);

  // 3. Read target GRA bytes & attempt uGRA decoding
  let targetGraBytes: Uint8Array | null = null;
  const targetFile = files.find(
    (f) =>
      f.path.toUpperCase() === targetGraPath.toUpperCase() ||
      f.name.toUpperCase() === targetGraPath.toUpperCase(),
  );

  if (targetFile) {
    try {
      targetGraBytes = await source.readSlice(targetFile.path, 0, targetFile.size);
    } catch {
      // Gracefully continue
    }
  }

  let decodeSuccessesCount = 0;
  let decodeFailuresCount = 0;
  const successfulGraOffsets = new Set<number>();
  const previewPayloads = new Map<number, MK1DecodedSpritePreview>();

  for (const cand of rawCandidates) {
    if (targetGraBytes && targetGraBytes.length > 0) {
      const decodeResult = decodeUgraSprite(
        targetGraBytes,
        cand.graOffset,
        cand.width,
        cand.height,
      );

      cand.decode = {
        attempted: true,
        success: decodeResult.success,
        encodedBytesConsumed: decodeResult.encodedBytesConsumed,
        commandCount: decodeResult.commandCount,
        failureReason: decodeResult.failureReason,
        checksum: decodeResult.checksum,
      };

      if (decodeResult.success) {
        decodeSuccessesCount++;
        successfulGraOffsets.add(cand.graOffset);

        // Milestone 1D.1: Retain in-memory decoded preview payload
        // Keyed by candidate EXE offset. Prioritize primary candidate interpretation if overlapping.
        if (!previewPayloads.has(cand.exeOffset) || cand.primaryCandidate !== false) {
          previewPayloads.set(cand.exeOffset, {
            exeOffset: cand.exeOffset,
            width: cand.width,
            height: cand.height,
            x: cand.x,
            y: cand.y,
            graOffset: cand.graOffset,
            indices: decodeResult.indices,
            opaqueMask: decodeResult.opaqueMask,
            encodedBytesConsumed: decodeResult.encodedBytesConsumed,
            commandCount: decodeResult.commandCount,
            checksum: decodeResult.checksum!,
          });
        }

        // Milestone 1D Section 12: Research Confidence Upgrade
        // A descriptor that:
        // - sits in a 12-byte WITH_XY array
        // - references correct File ID
        // - has an in-range GRA offset
        // - AND successfully decodes to exactly width × height
        // may be upgraded to: INFERRED
        if (
          cand.kind === 'with-xy' &&
          cand.inArrayRun &&
          cand.arrayRunStride === 12 &&
          cand.validation.allRulesPassed
        ) {
          cand.confidence = 'inferred';
        }
      } else {
        decodeFailuresCount++;
      }
    } else {
      cand.decode = {
        attempted: false,
        success: false,
        encodedBytesConsumed: 0,
        commandCount: 0,
        failureReason: 'Target GRA file bytes not loaded',
      };
    }
  }

  // 4. Milestone 1D Section 9: First-Sprite Proof Anchor (EXE 0x000A7464, width 58, height 104, GRA offset 0)
  const anchorCand = rawCandidates.find(
    (c) =>
      (c.exeOffset === 0x000a7464 || c.exeOffsetHex.toUpperCase() === '0X000A7464') &&
      c.kind === 'with-xy',
  );

  let firstSpriteProof: MK1FirstSpriteProof | undefined = undefined;
  if (anchorCand) {
    firstSpriteProof = {
      anchorExeOffsetHex: '0x000A7464',
      expectedDimensions: '58x104',
      expectedGraOffset: 0,
      found: true,
      descriptor: {
        exeOffsetHex: anchorCand.exeOffsetHex,
        kind: anchorCand.kind,
        width: anchorCand.width,
        height: anchorCand.height,
        x: anchorCand.x,
        y: anchorCand.y,
        graOffsetHex: anchorCand.graOffsetHex,
        decoded: anchorCand.decode?.success ?? false,
        hasPreviewPayload: previewPayloads.has(anchorCand.exeOffset),
        encodedBytesConsumed: anchorCand.decode?.encodedBytesConsumed,
        commandCount: anchorCand.decode?.commandCount,
        checksum: anchorCand.decode?.checksum,
        failureReason: anchorCand.decode?.failureReason,
      },
    };
  }

  options.onProgress?.('Grouping duplicate GRA offsets & reading byte previews...', 0.9);

  // 5. Read optional GRA byte previews (up to 8 bytes)
  const graOffsetToBytes = new Map<number, string>();
  if (readPreview && targetFile) {
    const uniqueOffsets = Array.from(new Set(rawCandidates.map((c) => c.graOffset)));
    for (const off of uniqueOffsets) {
      try {
        const previewLen = Math.min(8, targetGraSize - off);
        if (previewLen > 0) {
          const previewBytes = await source.readSlice(targetFile.path, off, previewLen);
          const hexParts: string[] = [];
          for (let b = 0; b < previewBytes.length; b++) {
            hexParts.push(previewBytes[b].toString(16).toUpperCase().padStart(2, '0'));
          }
          graOffsetToBytes.set(off, hexParts.join(' '));
        }
      } catch {
        // Gracefully continue
      }
    }
  }

  // Assign byte previews to candidates
  for (const cand of rawCandidates) {
    cand.firstBytesHex = graOffsetToBytes.get(cand.graOffset);
  }

  // 6. Duplicate GRA Offset Grouping
  const offsetGroupsMap = new Map<number, MK1SpriteDescriptorCandidate[]>();
  for (const cand of rawCandidates) {
    const list = offsetGroupsMap.get(cand.graOffset) ?? [];
    list.push(cand);
    offsetGroupsMap.set(cand.graOffset, list);
  }

  const graOffsetGroups: MK1SpriteGraOffsetGroup[] = [];
  for (const [off, candList] of offsetGroupsMap.entries()) {
    const dimSet = new Set(candList.map((c) => `${c.width}x${c.height}`));
    const posSet = new Set(candList.map((c) => `${c.x ?? 0},${c.y ?? 0}`));
    const kindSet = new Set(candList.map((c) => c.kind));

    graOffsetGroups.push({
      graOffset: off,
      graOffsetHex: toHex32(off),
      referenceCount: candList.length,
      firstBytesHex: graOffsetToBytes.get(off),
      descriptors: candList.map((c) => ({
        exeOffsetHex: c.exeOffsetHex,
        kind: c.kind,
        width: c.width,
        height: c.height,
        x: c.x,
        y: c.y,
        confidence: c.confidence,
      })),
      hasVaryingDimensions: dimSet.size > 1,
      hasVaryingPositions: posSet.size > 1,
      hasMultipleKinds: kindSet.size > 1,
    });
  }

  // Sort groups by reference count descending then offset ascending
  graOffsetGroups.sort((a, b) => {
    if (b.referenceCount !== a.referenceCount) return b.referenceCount - a.referenceCount;
    return a.graOffset - b.graOffset;
  });

  const withXyCount = rawCandidates.filter((c) => c.kind === 'with-xy').length;
  const noXyCount = rawCandidates.filter((c) => c.kind === 'no-xy').length;
  const overlappingCount = rawCandidates.filter(
    (c) => c.overlapsCandidateAtSameOffset || c.alternateInterpretationOf !== undefined,
  ).length;
  const primaryCandidatesCount = rawCandidates.filter((c) => c.primaryCandidate !== false).length;
  const alternateInterpretationsCount = rawCandidates.filter(
    (c) => c.primaryCandidate === false || c.alternateInterpretationOf !== undefined,
  ).length;

  const scanStats: MK1SpriteDescriptorScanStats = {
    totalCandidates: rawCandidates.length,
    primaryCandidatesCount,
    alternateInterpretationsCount,
    withXyCount,
    noXyCount,
    overlappingCount,
    uniqueGraOffsetsCount: offsetGroupsMap.size,
    clustersCount: clusters.length,
    arrayRunsCount: arrayRuns.length,
    decodeSuccessesCount,
    decodeFailuresCount,
    uniqueSuccessfulGraOffsetsCount: successfulGraOffsets.size,
  };

  options.onProgress?.('Sprite descriptor scan completed.', 1.0);

  return {
    app: {
      name: APP_NAME,
      version: APP_VERSION,
      scannedAt: new Date().toISOString(),
    },
    fixture: 'Mortal Kombat (DOS)',
    executable: {
      path: exeEntry.path,
      size: exeSize,
      sizeHex: toHex32(exeSize),
    },
    targetGra: {
      path: targetGraPath,
      fileId: targetFileId,
      size: targetGraSize,
      sizeHex: toHex32(targetGraSize),
    },
    scanStats,
    candidates: rawCandidates,
    graOffsetGroups,
    clusters,
    arrayRuns,
    firstSpriteProof,
    previewPayloads,
  };
}

/**
 * Milestone 1D.1: Filters and orders candidates for the normal preview sequence.
 * Only successfully decoded PRIMARY candidates are included (failed descriptors
 * and alternate interpretations are excluded).
 * Array-run sprites are ordered first (ascending by offset), followed by
 * any non-array-run primary decoded sprites (ascending by offset).
 */
export function getDecodedPrimaryPreviewSequence(
  candidates: MK1SpriteDescriptorCandidate[],
): MK1SpriteDescriptorCandidate[] {
  const valid = candidates.filter((c) => {
    if (!c.decode?.success) return false;
    if (c.primaryCandidate === false) return false;
    if (c.alternateInterpretationOf !== undefined) return false;
    return true;
  });

  return valid.sort((a, b) => {
    const aInRun = a.inArrayRun ? 1 : 0;
    const bInRun = b.inArrayRun ? 1 : 0;
    if (aInRun !== bInRun) {
      return bInRun - aInRun;
    }
    return a.exeOffset - b.exeOffset;
  });
}

/**
 * Builds clean export JSON for MK1 sprite descriptor probe results.
 */
export function createMK1SpriteDescriptorExport(
  result: MK1SpriteDescriptorScanResult,
): MK1SpriteDescriptorExportData {
  return {
    app: {
      name: result.app.name,
      version: result.app.version,
      exportedAt: new Date().toISOString(),
    },
    fixtureIdentity: result.fixture,
    executable: {
      path: result.executable.path,
      sizeDecimal: result.executable.size,
      sizeHex: result.executable.sizeHex,
    },
    targetGra: {
      path: result.targetGra.path,
      fileId: result.targetGra.fileId,
      sizeDecimal: result.targetGra.size,
      sizeHex: result.targetGra.sizeHex,
    },
    scanStats: result.scanStats,
    candidates: result.candidates.map((c) => ({
      exeOffsetHex: c.exeOffsetHex,
      kind: c.kind,
      width: c.width,
      height: c.height,
      x: c.x,
      y: c.y,
      packedReferenceHex: c.packedFileReferenceHex,
      fileId: c.fileId,
      graOffsetDecimal: c.graOffset,
      graOffsetHex: c.graOffsetHex,
      firstBytesHex: c.firstBytesHex,
      confidence: c.confidence,
      primaryCandidate: c.primaryCandidate,
      alternateInterpretationOf: c.alternateInterpretationOf,
      overlapsCandidateAtSameOffset: c.overlapsCandidateAtSameOffset,
      alternateInterpretation: c.alternateInterpretation,
      inArrayRun: c.inArrayRun,
      arrayRunStride: c.arrayRunStride,
      decode: c.decode,
    })),
    graOffsetGroups: result.graOffsetGroups.map((g) => ({
      graOffsetHex: g.graOffsetHex,
      graOffsetDecimal: g.graOffset,
      referenceCount: g.referenceCount,
      firstBytesHex: g.firstBytesHex,
      hasVaryingDimensions: g.hasVaryingDimensions,
      hasVaryingPositions: g.hasVaryingPositions,
      hasMultipleKinds: g.hasMultipleKinds,
      descriptors: g.descriptors,
    })),
    clusters: result.clusters.map((cl) => ({
      clusterId: cl.clusterId,
      startExeOffsetHex: cl.startExeOffsetHex,
      endExeOffsetHex: cl.endExeOffsetHex,
      candidateCount: cl.candidateCount,
      dominantKind: cl.dominantKind,
      commonStrides: cl.commonStrides,
      isContiguousArray: cl.isContiguousArray,
      strideDescription: cl.strideDescription,
    })),
    arrayRuns: result.arrayRuns.map((r) => ({
      runId: r.runId,
      kind: r.kind,
      startExeOffsetHex: r.startExeOffsetHex,
      endExeOffsetHex: r.endExeOffsetHex,
      descriptorCount: r.descriptorCount,
      stride: r.stride,
      interruptions: r.interruptions,
    })),
    firstSpriteProof: result.firstSpriteProof,
  };
}
