/**
 * MK1 DOS Authoritative Kano Sprite Research Service (Pass 1E.1a)
 *
 * Provides the SINGLE authoritative pipeline for Kano sprite reconstruction and
 * color usage analysis. Reuses the verified sprite descriptor scan and array-run
 * analysis, completely eliminating redundant descriptor walks.
 *
 * Authoritative Filter Criteria:
 *   - fileId === 35 (KANO.GRA)
 *   - kind === 'with-xy'
 *   - primaryCandidate !== false (excludes alternate interpretations)
 *   - inArrayRun === true (must sit within contiguous array run)
 *   - decode?.success === true (excludes decode failures)
 *   - previewPayloads.has(exeOffset) (retains decoded in-memory pixel buffer)
 *
 * Real Fixture Verification:
 *   - Real MK1 fixture produces exactly 187 authoritative decoded sprites.
 *   - Anchor proof frame is 58x104 at GRA offset 0, checksum 09961980.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import {
  scanExeForSpriteDescriptors,
  resolveAllMK1GraTargets,
  MK1SpriteDescriptorCandidate,
  MK1SpriteDescriptorScanResult,
} from './spriteDescriptorProbe';
import { DecodedIndexedSprite } from '../graphics/ugraDecoder';
import {
  MK1AggregateColorUsageStats,
  KanoSpriteUsageInfo,
  calculateSpriteColorUsage,
} from './paletteProbe';

export interface AuthoritativeKanoResult {
  sampleCount: number;
  anchorSprite: DecodedIndexedSprite;
  aggregateStats: MK1AggregateColorUsageStats;
  authoritativeCandidates: MK1SpriteDescriptorCandidate[];
  isVerifiedRealFixture: boolean;
  scanResult: MK1SpriteDescriptorScanResult;
}

// Module-level in-memory cache to prevent redundant scans across views
const authoritativeKanoCache = new Map<string, AuthoritativeKanoResult>();

/**
 * Clears the in-memory cache (e.g. for testing or new directory selection).
 */
export function clearAuthoritativeKanoCache(): void {
  authoritativeKanoCache.clear();
}

/**
 * Retrieves the authoritative decoded Kano sprites and computes comprehensive
 * per-sprite and aggregate color usage statistics.
 */
export async function getAuthoritativeKanoSprites(
  source: DirectorySource,
  options?: {
    cachedScanResult?: MK1SpriteDescriptorScanResult;
    onProgress?: (message: string, fraction?: number) => void;
    forceRefresh?: boolean;
  },
): Promise<AuthoritativeKanoResult | null> {
  const cacheKey = source.directoryName;
  if (!options?.forceRefresh && authoritativeKanoCache.has(cacheKey)) {
    return authoritativeKanoCache.get(cacheKey)!;
  }

  let scanResult: MK1SpriteDescriptorScanResult;

  if (options?.cachedScanResult && options.cachedScanResult.targetGra?.fileId === 35) {
    scanResult = options.cachedScanResult;
  } else {
    options?.onProgress?.('Resolving handle table for KANO.GRA target...', 0.1);
    const { targets } = await resolveAllMK1GraTargets(source);
    const kanoTarget =
      targets.find((t) => (t.fileId === 35 || t.path.toUpperCase().includes('KANO.GRA')) && t.presentOnDisk) ??
      targets.find((t) => t.fileId === 35);

    if (!kanoTarget) {
      return null;
    }

    options?.onProgress?.('Scanning MK1.EXE for authoritative Kano sprite descriptors...', 0.3);
    scanResult = await scanExeForSpriteDescriptors(source, {
      targetGraPath: kanoTarget.path,
      targetFileId: 35,
      onProgress: options?.onProgress,
    });
  }

  // Authoritative Filter: successful primary with-xy array-run Kano descriptors
  const authoritativeCandidates = scanResult.candidates
    .filter(
      (c) =>
        c.fileId === 35 &&
        c.kind === 'with-xy' &&
        c.primaryCandidate !== false &&
        c.inArrayRun === true &&
        c.decode?.success === true &&
        scanResult.previewPayloads.has(c.exeOffset),
    )
    .sort((a, b) => a.exeOffset - b.exeOffset);

  if (authoritativeCandidates.length === 0) {
    return null;
  }

  // Real Fixture Verification Check
  const files = await source.listRecursive();
  const exeFile = files.find((f) => f.name.toUpperCase() === 'MK1.EXE');
  const graFile = files.find((f) => f.name.toUpperCase() === 'KANO.GRA');
  const isVerifiedRealFixture = exeFile?.size === 1157222 && graFile?.size === 595504;

  if (isVerifiedRealFixture && authoritativeCandidates.length !== 187) {
    throw new Error(
      `REAL FIXTURE ASSERTION FAILED: Expected 187 authoritative Kano descriptors, but pipeline found ${authoritativeCandidates.length}.`,
    );
  }

  // Compute per-sprite usage information and aggregate union statistics
  const perSpriteUsage: KanoSpriteUsageInfo[] = [];
  const globalUnion = new Set<number>();
  let minSource = 256;
  let maxSource = -1;

  for (const c of authoritativeCandidates) {
    const preview = scanResult.previewPayloads.get(c.exeOffset)!;
    const stats = calculateSpriteColorUsage(preview.indices, preview.opaqueMask);
    const minOpaque = stats?.minOpaqueIndex ?? 0;
    const maxOpaque = stats?.maxOpaqueIndex ?? 0;
    const distinctOpaque = stats?.distinctOpaqueCount ?? 0;

    if (stats && distinctOpaque > 0) {
      if (minOpaque < minSource) minSource = minOpaque;
      if (maxOpaque > maxSource) maxSource = maxOpaque;
      for (const idx of stats.sortedDistinctIndices) {
        globalUnion.add(idx);
      }
    }

    perSpriteUsage.push({
      exeOffset: c.exeOffset,
      exeOffsetHex: c.exeOffsetHex,
      graOffset: c.graOffset,
      graOffsetHex: c.graOffsetHex,
      width: c.width,
      height: c.height,
      x: c.x,
      y: c.y,
      minOpaqueIndex: minOpaque,
      maxOpaqueIndex: maxOpaque,
      distinctOpaqueIndices: distinctOpaque,
      checksum: preview.checksum,
    });
  }

  const unionIndices = Array.from(globalUnion).sort((a, b) => a - b);
  const aggregateStats: MK1AggregateColorUsageStats = {
    sampleCount: authoritativeCandidates.length,
    minSourceIndex: minSource <= maxSource ? minSource : 0,
    maxSourceIndex: minSource <= maxSource ? maxSource : 0,
    distinctCount: globalUnion.size,
    unionIndices,
    perSpriteUsage,
  };

  // Extract anchor proof sprite directly from the authoritative pipeline
  const firstCand = authoritativeCandidates[0];
  const firstPayload = scanResult.previewPayloads.get(firstCand.exeOffset)!;
  const anchorSprite: DecodedIndexedSprite = {
    success: true,
    width: firstPayload.width,
    height: firstPayload.height,
    indices: firstPayload.indices,
    opaqueMask: firstPayload.opaqueMask,
    encodedBytesConsumed: firstPayload.encodedBytesConsumed,
    commandCount: firstPayload.commandCount,
    checksum: firstPayload.checksum,
  };

  const result: AuthoritativeKanoResult = {
    sampleCount: authoritativeCandidates.length,
    anchorSprite,
    aggregateStats,
    authoritativeCandidates,
    isVerifiedRealFixture,
    scanResult,
  };

  authoritativeKanoCache.set(cacheKey, result);
  return result;
}
