/**
 * MK1 DOS Executable Palette Research Probe (Milestone 1E.1)
 *
 * Implements bounded scanning of MK1.EXE for candidate 15-bit palette structures
 * based on published ReWolf reverse engineering research and exact DOS VGA DAC conversion.
 *
 * STATUS: EXTERNAL LEAD / LEGACY DIAGNOSTIC — NOT INDEPENDENTLY VERIFIED
 *
 * Structural Reference:
 *   struct Palette {
 *     uint16 length;
 *     uint16 colors[length];
 *   }
 *
 * Rules & Epistemic Distinctions:
 *   - 2 <= length < 256
 *   - All colour words < 0x8000 (15-bit RGB in 16-bit word)
 *   - ReWolf heuristic: unique colours >= 2/3 of palette length
 *   - 1-based indexing (EXTERNAL LEAD / LEGACY DIAGNOSTIC — NOT INDEPENDENTLY VERIFIED):
 *     colors[0] corresponds to VGA index 1.
 *   - Index 0 is asserted by external lead to be supplied by IRQSKYE (EXTERNAL LEAD / LEGACY DIAGNOSTIC — NOT INDEPENDENTLY VERIFIED).
 *   - Final VGA index = decoded sprite index + palette_shift (assumed 0 for Pass 1E.1 diagnostic previews).
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { DecodedIndexedSprite, decodeUgraSprite } from '../graphics/ugraDecoder';
import {
  MK1PaletteCandidate,
  MK1PaletteScanResult,
  MK1PaletteScanCounts,
  MK1RgbColor,
  MK1SpriteColorUsageStats,
  MK1AggregateColorUsageStats,
  MK1PaletteCatalogueExportData,
  MK1PaletteExportCandidateItem,
  PaletteCandidateTier,
  MK1OverlapRelationships,
  MK1UniquePaletteContent,
  MK1CompactPaletteCatalogueExport,
  MK1CompactPhysicalLocation,
  KanoSpriteUsageInfo,
} from './paletteTypes';
import { getAuthoritativeKanoSprites } from './authoritativeKano';

export * from './paletteTypes';

const toHex32 = (v: number) => `0x${(v >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
const toHex16 = (v: number) => `0x${(v & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;

/**
 * Converts a 15-bit MK1 source color word into an 8-bit per channel RGB color
 * using the exact reverse-engineered formula:
 *
 * MULT = 255 / 63
 * r = round(((((value >> 9) & 0x3F) | 1) * MULT))
 * g = round(((((value >> 4) & 0x3F) | 1) * MULT))
 * b = round(((((value << 1) & 0x3F) | 1) * MULT))
 *
 * Clamped safely to [0..255].
 */
export function convert15BitColorToRgb(value: number): MK1RgbColor {
  const MULT = 255 / 63;
  const rRaw = (((value >> 9) & 0x3f) | 1) * MULT;
  const gRaw = (((value >> 4) & 0x3f) | 1) * MULT;
  const bRaw = (((value << 1) & 0x3f) | 1) * MULT;

  const r = Math.min(255, Math.max(0, Math.round(rRaw)));
  const g = Math.min(255, Math.max(0, Math.round(gRaw)));
  const b = Math.min(255, Math.max(0, Math.round(bRaw)));
  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();

  return { r, g, b, hex };
}

/**
 * Computes a deterministic 32-bit FNV-1a checksum over raw 15-bit color words.
 * Used to identify duplicate palette content across different executable offsets.
 */
export function computePaletteContentHash(colors15: Uint16Array): string {
  let hash = 0x811c9dc5;
  const len = colors15.length;
  // Mix in length to prevent different-length sub-arrays from colliding
  hash ^= len & 0xff;
  hash = Math.imul(hash, 0x01000193);
  hash ^= (len >>> 8) & 0xff;
  hash = Math.imul(hash, 0x01000193);

  for (let i = 0; i < len; i++) {
    const val = colors15[i];
    hash ^= val & 0xff;
    hash = Math.imul(hash, 0x01000193);
    hash ^= (val >>> 8) & 0xff;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Formats a deterministic palette candidate ID based on executable provenance:
 * e.g., "MK1.EXE:0x000A7464"
 */
export function formatPaletteCandidateId(exeOffset: number, exeName: string = 'MK1.EXE'): string {
  return `${exeName}:${toHex32(exeOffset)}`;
}

/**
 * Calculates opaque pixel color-usage statistics for a single decoded sprite.
 * Note: Transparent pixels (opaqueMask === 0) are strictly excluded.
 */
export function calculateSpriteColorUsage(
  indices: Uint8Array,
  opaqueMask: Uint8Array,
): MK1SpriteColorUsageStats | null {
  const len = Math.min(indices.length, opaqueMask.length);
  let min = 256;
  let max = -1;
  const seen = new Set<number>();

  for (let i = 0; i < len; i++) {
    if (opaqueMask[i] === 1) {
      const idx = indices[i];
      if (idx < min) min = idx;
      if (idx > max) max = idx;
      seen.add(idx);
    }
  }

  if (seen.size === 0) {
    return null;
  }

  const sortedDistinctIndices = Array.from(seen).sort((a, b) => a - b);
  return {
    minOpaqueIndex: min,
    maxOpaqueIndex: max,
    distinctOpaqueCount: seen.size,
    sortedDistinctIndices,
  };
}

/**
 * Calculates aggregate color-usage statistics across a set of decoded sprites
 * (e.g., all 187 successful Kano array-run sprites).
 */
export function calculateAggregateColorUsage(
  sprites: Array<{ indices: Uint8Array; opaqueMask: Uint8Array }>,
): MK1AggregateColorUsageStats {
  let min = 256;
  let max = -1;
  const allSeen = new Set<number>();
  let sampleCount = 0;

  for (const s of sprites) {
    const stats = calculateSpriteColorUsage(s.indices, s.opaqueMask);
    if (stats) {
      sampleCount++;
      if (stats.minOpaqueIndex < min) min = stats.minOpaqueIndex;
      if (stats.maxOpaqueIndex > max) max = stats.maxOpaqueIndex;
      for (const idx of stats.sortedDistinctIndices) {
        allSeen.add(idx);
      }
    }
  }

  if (allSeen.size === 0) {
    return {
      sampleCount: 0,
      minSourceIndex: 0,
      maxSourceIndex: 0,
      distinctCount: 0,
      unionIndices: [],
    };
  }

  return {
    sampleCount,
    minSourceIndex: min,
    maxSourceIndex: max,
    distinctCount: allSeen.size,
    unionIndices: Array.from(allSeen).sort((a, b) => a - b),
  };
}

/**
 * Determines whether a candidate palette directly covers a sprite's maximum source index
 * under zero shift (assumed palette_shift = 0).
 *
 * EXTERNAL LEAD / LEGACY DIAGNOSTIC ONLY: in the proposed 1-based model, a palette of `length` contains colors for indices 1..length.
 * Therefore, zero-shift compatibility requires length >= maxSourceIndex.
 * This helper preserves historical diagnostic behavior and is not independent evidence for index-0 semantics.
 */
export function isZeroShiftCompatible(paletteLength: number, maxSourceIndex: number): boolean {
  if (maxSourceIndex <= 0) return true;
  return paletteLength >= maxSourceIndex;
}

/**
 * Evaluates the underlying byte range of a candidate palette for printable ASCII character density.
 * Used as a diagnostic negative ranking signal to identify false positives decoding program text/strings.
 */
export function calculateAsciiDensity(
  bytes: Uint8Array,
  offset: number,
  lengthInWords: number,
): { textLikeScore: number; containsLikelyAsciiData: boolean } {
  const totalBytes = lengthInWords * 2;
  const start = offset + 2; // skip 2-byte length
  const end = Math.min(bytes.length, start + totalBytes);
  if (end <= start) {
    return { textLikeScore: 0, containsLikelyAsciiData: false };
  }

  let printableCount = 0;
  for (let i = start; i < end; i++) {
    const b = bytes[i];
    // Printable ASCII (32..126) or common whitespace (tab=9, LF=10, CR=13)
    if ((b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13) {
      printableCount++;
    }
  }

  const density = printableCount / (end - start);
  const textLikeScore = Math.min(100, Math.max(0, Math.round(density * 100)));
  const containsLikelyAsciiData = textLikeScore >= 70;

  return { textLikeScore, containsLikelyAsciiData };
}

/**
 * Analyzes candidate byte ranges to detect overlapping interpretations, containment,
 * and same-start different-length relationships without discarding provenance.
 */
export function calculateOverlapRelationships(candidates: MK1PaletteCandidate[]): void {
  candidates.sort((a, b) => a.exeOffset - b.exeOffset);
  const n = candidates.length;

  for (let i = 0; i < n; i++) {
    const a = candidates[i];
    const containedWithin: string[] = [];
    const contains: string[] = [];
    const sameStartDifferentLength: string[] = [];
    let overlappingCount = 0;

    // Look backward
    for (let j = i - 1; j >= 0; j--) {
      const b = candidates[j];
      if (a.exeOffset - b.exeOffset > 512) {
        break;
      }
      if (b.byteStart < a.byteEnd && b.byteEnd > a.byteStart) {
        overlappingCount++;
        if (b.byteStart === a.byteStart && b.length !== a.length) {
          sameStartDifferentLength.push(b.id);
        } else if (a.byteStart >= b.byteStart && a.byteEnd <= b.byteEnd) {
          containedWithin.push(b.id);
        } else if (b.byteStart >= a.byteStart && b.byteEnd <= a.byteEnd) {
          contains.push(b.id);
        }
      }
    }

    // Look forward
    for (let j = i + 1; j < n; j++) {
      const b = candidates[j];
      if (b.exeOffset >= a.byteEnd) {
        break;
      }
      if (b.byteStart < a.byteEnd && b.byteEnd > a.byteStart) {
        overlappingCount++;
        if (b.byteStart === a.byteStart && b.length !== a.length) {
          sameStartDifferentLength.push(b.id);
        } else if (a.byteStart >= b.byteStart && a.byteEnd <= b.byteEnd) {
          containedWithin.push(b.id);
        } else if (b.byteStart >= a.byteStart && b.byteEnd <= a.byteEnd) {
          contains.push(b.id);
        }
      }
    }

    a.overlapRelationships = {
      containedWithin: containedWithin.length > 0 ? containedWithin : undefined,
      contains: contains.length > 0 ? contains : undefined,
      sameStartDifferentLength: sameStartDifferentLength.length > 0 ? sameStartDifferentLength : undefined,
      overlappingCount,
    };
  }
}

/**
 * Computes a non-destructive research ranking score and assigns candidate tiers ('raw', 'structural', 'research').
 * Preserves all structural candidates while prioritizing human-manageable shortlist investigation.
 */
export function calculateResearchScore(
  candidate: MK1PaletteCandidate,
  context?: {
    kanoMaxIndex?: number;
  },
): { score: number; tier: PaletteCandidateTier } {
  let score = 0;

  // Signal 1: 2-byte boundary alignment (x86 DOS data structure alignment)
  if (candidate.exeOffset % 2 === 0) {
    score += 15;
  } else {
    score -= 15;
  }

  // Signal 2: Suitable length for observed Kano color range
  const kanoMax = context?.kanoMaxIndex ?? 23;
  if (candidate.length >= kanoMax) {
    score += 15;
    // Typical MK fighter palette length (23..64)
    if (candidate.length <= 64) {
      score += 10;
    }
  } else {
    score -= 10;
  }

  // Common palette sizes (e.g. 16, 24, 32, 48, 64, 128)
  if ([16, 24, 32, 48, 64, 128].includes(candidate.length)) {
    score += 5;
  }

  // Signal 3: Not a duplicate copy
  if (!candidate.duplicateContentOf) {
    score += 10;
  } else {
    score -= 10;
  }

  // Signal 4: Color ramp continuity / structured distribution
  let rampSteps = 0;
  let zeroCount = 0;
  const colors = candidate.colors15;
  for (let i = 0; i < colors.length; i++) {
    if (colors[i] === 0) zeroCount++;
    if (i < colors.length - 1) {
      const c1 = convert15BitColorToRgb(colors[i]);
      const c2 = convert15BitColorToRgb(colors[i + 1]);
      const delta = Math.abs(c1.r - c2.r) + Math.abs(c1.g - c2.g) + Math.abs(c1.b - c2.b);
      if (delta > 0 && delta <= 60) {
        rampSteps++;
      }
    }
  }
  const rampRatio = colors.length > 1 ? rampSteps / (colors.length - 1) : 0;
  if (rampRatio >= 0.35) {
    score += 15;
  }

  // Signal 5: Independent structure (not contained within an outer candidate)
  if (!candidate.overlapRelationships.containedWithin || candidate.overlapRelationships.containedWithin.length === 0) {
    score += 10;
  }

  // Negative Signal 1: ASCII / text-likeness
  if (candidate.containsLikelyAsciiData) {
    score -= 40;
  } else if (candidate.textLikeScore >= 50) {
    score -= 20;
  }

  // Negative Signal 2: Contained within another candidate
  if (candidate.overlapRelationships.containedWithin && candidate.overlapRelationships.containedWithin.length > 0) {
    score -= 25;
  }

  // Negative Signal 3: Extreme overlap (> 5 overlapping candidates)
  if (candidate.overlapRelationships.overlappingCount > 5) {
    score -= 10;
  }

  // Negative Signal 4: Heavy zero padding (> 15% zero words)
  if (colors.length > 0 && zeroCount / colors.length > 0.15) {
    score -= 15;
  }

  // Tier Assignment:
  // Upgraded to 'research' if score >= 35, not ASCII, and not strictly contained within another candidate
  const isResearchTier =
    score >= 35 &&
    !candidate.containsLikelyAsciiData &&
    (!candidate.overlapRelationships.containedWithin || candidate.overlapRelationships.containedWithin.length === 0);

  const tier: PaletteCandidateTier = isResearchTier ? 'research' : 'structural';
  return { score, tier };
}

/**
 * Groups candidate palettes by contentHash to eliminate duplicate browsing overhead in UI
 * while preserving complete physical offset provenance.
 */
export function groupUniquePaletteContents(candidates: MK1PaletteCandidate[]): MK1UniquePaletteContent[] {
  const map = new Map<string, MK1PaletteCandidate[]>();
  for (const c of candidates) {
    const list = map.get(c.contentHash) ?? [];
    list.push(c);
    map.set(c.contentHash, list);
  }

  const uniqueContents: MK1UniquePaletteContent[] = [];

  for (const [hash, group] of map.entries()) {
    // Select best representative: highest researchScore, 2-byte aligned, then lowest offset
    group.sort((a, b) => {
      if (b.researchScore !== a.researchScore) return b.researchScore - a.researchScore;
      const aAligned = a.exeOffset % 2 === 0 ? 1 : 0;
      const bAligned = b.exeOffset % 2 === 0 ? 1 : 0;
      if (bAligned !== aAligned) return bAligned - aAligned;
      return a.exeOffset - b.exeOffset;
    });

    const rep = group[0];
    const physicalOffsets = group.map((c) => c.exeOffset);
    const physicalOffsetsHex = group.map((c) => c.exeOffsetHex);

    const sourceWordsHex: string[] = [];
    for (let i = 0; i < rep.colors15.length; i++) {
      sourceWordsHex.push(toHex16(rep.colors15[i]));
    }

    const hasResearchTier = group.some((c) => c.tier === 'research');

    uniqueContents.push({
      contentHash: hash,
      length: rep.length,
      sourceWordsHex,
      uniqueColorCount: rep.uniqueColorCount,
      uniqueColorRatio: rep.uniqueColorRatio,
      researchScore: rep.researchScore,
      tier: hasResearchTier ? 'research' : 'structural',
      zeroShiftKanoCompatible: rep.zeroShiftKanoCompatible,
      representativeOffset: rep.exeOffset,
      representativeOffsetHex: rep.exeOffsetHex,
      duplicateLocationCount: group.length,
      physicalOffsets,
      physicalOffsetsHex,
      containsLikelyAsciiData: rep.containsLikelyAsciiData,
      textLikeScore: rep.textLikeScore,
      rgbColors: rep.rgbColors,
    });
  }

  // Sort unique contents by researchScore descending, then offset ascending
  uniqueContents.sort((a, b) => {
    if (b.researchScore !== a.researchScore) return b.researchScore - a.researchScore;
    return a.representativeOffset - b.representativeOffset;
  });

  return uniqueContents;
}

export interface ScanExeForPalettesOptions {
  exePath?: string;
  kanoMaxIndex?: number;
  kanoStats?: MK1AggregateColorUsageStats;
  chunkSize?: number;
  onProgress?: (message: string, fraction?: number) => void;
}

/**
 * Scans MK1.EXE byte-by-byte for candidate palette structures using bounded chunked reading.
 *
 * Records raw, 15-bit valid, diversity-valid, and final candidate counts separately
 * so the effectiveness of each filtering stage is visible without hiding noise.
 */
export async function scanExeForPalettes(
  source: DirectorySource,
  options: ScanExeForPalettesOptions = {},
): Promise<MK1PaletteScanResult> {
  const files = await source.listRecursive();
  const exeEntry = files.find((f) => {
    const up = f.name.toUpperCase();
    return up === 'MK1.EXE' || up.endsWith('/MK1.EXE') || up.endsWith('\\MK1.EXE');
  });

  if (!exeEntry) {
    throw new Error('MK1.EXE not found in directory inventory.');
  }

  const effectiveKanoMaxIndex = options.kanoMaxIndex ?? options.kanoStats?.maxSourceIndex;

  const exeSize = exeEntry.size;
  const exeName = exeEntry.name;

  const counts: MK1PaletteScanCounts = {
    rawLengthCandidatesCount: 0,
    colors15BitValidCount: 0,
    diversityValidCount: 0,
    structuralCandidatesCount: 0,
    finalCandidatesCount: 0,
    researchCandidatesCount: 0,
    uniqueContentsCount: 0,
    duplicateCount: 0,
  };

  const candidates: MK1PaletteCandidate[] = [];
  const seenHashes = new Map<string, string>(); // contentHash -> firstCandidateId

  // Max palette length is 255 words (510 bytes) + 2 bytes header = 512 bytes
  const MAX_PALETTE_BYTES = 2 + 255 * 2;
  const chunkSize = options.chunkSize ?? 65536;
  const overlap = MAX_PALETTE_BYTES;

  let chunkOffset = 0;
  options.onProgress?.(`Starting byte-by-byte palette scan of ${exeName}...`, 0.05);

  while (chunkOffset < exeSize) {
    const bytesToRead = Math.min(chunkSize + overlap, exeSize - chunkOffset);
    if (bytesToRead < 4) break;

    const chunk = await source.readSlice(exeEntry.path, chunkOffset, bytesToRead);
    const scanLimit = Math.min(chunkSize, bytesToRead);

    for (let i = 0; i < scanLimit; i++) {
      const globalOffset = chunkOffset + i;

      // 1. Read uint16LE length
      if (i + 2 > chunk.length) break;
      const length = chunk[i] | (chunk[i + 1] << 8);

      // ReWolf constraint: 2 <= length < 256
      if (length < 2 || length >= 256) {
        continue;
      }

      counts.rawLengthCandidatesCount++;

      const requiredBytes = 2 + length * 2;
      // Reject if palette extends beyond physical executable bounds
      if (globalOffset + requiredBytes > exeSize) {
        continue;
      }

      // Check if we have enough bytes in this chunk
      if (i + requiredBytes > chunk.length) {
        continue;
      }

      // 2. Read length x uint16LE colours & verify 15-bit (< 0x8000)
      const colors15 = new Uint16Array(length);
      let colors15Bit = true;
      const colorSet = new Set<number>();

      let byteCursor = i + 2;
      for (let c = 0; c < length; c++) {
        const colorWord = chunk[byteCursor] | (chunk[byteCursor + 1] << 8);
        byteCursor += 2;

        if (colorWord >= 0x8000) {
          colors15Bit = false;
          break;
        }

        colors15[c] = colorWord;
        colorSet.add(colorWord);
      }

      if (!colors15Bit) {
        continue;
      }

      counts.colors15BitValidCount++;

      // 3. Evaluate colour diversity heuristic (unique >= 2/3 length)
      const uniqueColorCount = colorSet.size;
      const uniqueColorRatio = uniqueColorCount / length;
      const diversityValid = uniqueColorCount >= Math.ceil((2 / 3) * length);

      if (!diversityValid) {
        continue;
      }

      counts.diversityValidCount++;

      // Exact MK VGA DAC conversion for in-memory viewing
      const rgbColors: MK1RgbColor[] = new Array(length);
      for (let c = 0; c < length; c++) {
        rgbColors[c] = convert15BitColorToRgb(colors15[c]);
      }

      const contentHash = computePaletteContentHash(colors15);
      const candId = formatPaletteCandidateId(globalOffset, exeName);

      let duplicateContentOf: string | undefined;
      const existingId = seenHashes.get(contentHash);
      if (existingId) {
        duplicateContentOf = existingId;
        counts.duplicateCount++;
      } else {
        seenHashes.set(contentHash, candId);
      }

      const zeroShiftKanoCompatible =
        effectiveKanoMaxIndex !== undefined
          ? isZeroShiftCompatible(length, effectiveKanoMaxIndex)
          : undefined;

      // ASCII / text-likeness diagnostic
      const { textLikeScore, containsLikelyAsciiData } = calculateAsciiDensity(chunk, i, length);

      const candidate: MK1PaletteCandidate = {
        id: candId,
        exeOffset: globalOffset,
        exeOffsetHex: toHex32(globalOffset),
        byteStart: globalOffset,
        byteEnd: globalOffset + requiredBytes,
        length,
        colors15,
        rgbColors,
        uniqueColorCount,
        uniqueColorRatio,
        contentHash,
        duplicateContentOf,
        validation: {
          lengthValid: true,
          colors15Bit: true,
          diversityValid: true,
        },
        tier: 'structural',
        researchScore: 0,
        textLikeScore,
        containsLikelyAsciiData,
        overlapRelationships: { overlappingCount: 0 },
        confidence: 'candidate',
        zeroShiftKanoCompatible,
        relationships: [],
      };

      candidates.push(candidate);
    }

    chunkOffset += chunkSize;
    const progressFraction = Math.min(0.85, 0.05 + (chunkOffset / exeSize) * 0.8);
    options.onProgress?.(
      `Scanned ${Math.min(chunkOffset, exeSize)} / ${exeSize} bytes (${candidates.length} structural candidates found)...`,
      progressFraction,
    );
  }

  // Post-processing 1: Calculate overlap relationships
  options.onProgress?.('Analyzing candidate overlaps and containment...', 0.88);
  calculateOverlapRelationships(candidates);

  // Post-processing 2: Compute research scores and tiers
  options.onProgress?.('Computing research scores and candidate tiers...', 0.93);
  let researchTierCount = 0;
  for (const c of candidates) {
    const { score, tier } = calculateResearchScore(c, {
      kanoMaxIndex: effectiveKanoMaxIndex,
    });
    c.researchScore = score;
    c.tier = tier;
    if (tier === 'research') {
      researchTierCount++;
    }
  }

  // Post-processing 3: Group unique contents
  options.onProgress?.('Grouping unique palette contents by hash...', 0.97);
  const uniqueContents = groupUniquePaletteContents(candidates);

  counts.structuralCandidatesCount = candidates.length;
  counts.finalCandidatesCount = candidates.length;
  counts.researchCandidatesCount = researchTierCount;
  counts.uniqueContentsCount = uniqueContents.length;

  options.onProgress?.(
    `Palette scan complete: ${candidates.length} structural candidates (${uniqueContents.length} unique, ${researchTierCount} research shortlist).`,
    1.0,
  );

  return {
    exePath: exeEntry.path,
    exeSize,
    counts,
    candidates,
    uniqueContents,
    kanoAggregateStats: options.kanoStats,
  };
}

/**
 * Diagnostic placeholder color for index 0 (asserted by external lead to be IRQSKYE).
 * EXTERNAL LEAD / LEGACY DIAGNOSTIC — NOT INDEPENDENTLY VERIFIED.
 * Clearly visible and distinct from standard character palette entries.
 */
export const UNRESOLVED_IRQSKYE_PLACEHOLDER_COLOR: MK1RgbColor = {
  r: 28,
  g: 25,
  b: 23, // #1C1917 (dark slate charcoal)
  hex: '#1C1917',
};

/**
 * Generates an RGBA pixel buffer applying a candidate palette to a decoded indexed sprite
 * using 1-based indexing and assumed shift 0 (legacy diagnostic preview).
 *
 * Mapping Rules (EXTERNAL LEAD / LEGACY DIAGNOSTIC — NOT INDEPENDENTLY VERIFIED):
 * - Transparent pixels (opaqueMask === 0): R=G=B=A=0
 * - Opaque index 0: mapped to unresolved IRQSKYE diagnostic placeholder
 * - Opaque index 1..palette.length: mapped to palette.rgbColors[index - 1]
 * - Opaque index > palette.length: mapped to diagnostic out-of-range indicator (#E11D48)
 */
export function generatePaletteAppliedRgba(
  sprite: Pick<DecodedIndexedSprite, 'width' | 'height' | 'indices' | 'opaqueMask'>,
  palette: MK1PaletteCandidate,
  options?: {
    paletteShift?: number;
    unresolvedIndex0Color?: MK1RgbColor;
  },
): {
  rgba: Uint8ClampedArray;
  outOfRangeCount: number;
  index0Count: number;
} {
  const totalPixels = sprite.width * sprite.height;
  const rgba = new Uint8ClampedArray(totalPixels * 4);
  const shift = options?.paletteShift ?? 0;
  const index0Color = options?.unresolvedIndex0Color ?? UNRESOLVED_IRQSKYE_PLACEHOLDER_COLOR;

  let outOfRangeCount = 0;
  let index0Count = 0;

  for (let i = 0; i < totalPixels; i++) {
    const rgbaIdx = i * 4;

    if (sprite.opaqueMask[i] === 0) {
      // Transparent pixel
      rgba[rgbaIdx] = 0;
      rgba[rgbaIdx + 1] = 0;
      rgba[rgbaIdx + 2] = 0;
      rgba[rgbaIdx + 3] = 0;
      continue;
    }

    // Source index from decoded sprite stream
    const sourceIndex = sprite.indices[i];
    const effectiveIndex = sourceIndex + shift;

    if (effectiveIndex === 0) {
      // Index 0: Unresolved global IRQSKYE
      index0Count++;
      rgba[rgbaIdx] = index0Color.r;
      rgba[rgbaIdx + 1] = index0Color.g;
      rgba[rgbaIdx + 2] = index0Color.b;
      rgba[rgbaIdx + 3] = 255;
    } else if (effectiveIndex >= 1 && effectiveIndex <= palette.length) {
      // 1-based palette mapping: effectiveIndex 1 -> palette entry 0
      const color = palette.rgbColors[effectiveIndex - 1];
      rgba[rgbaIdx] = color.r;
      rgba[rgbaIdx + 1] = color.g;
      rgba[rgbaIdx + 2] = color.b;
      rgba[rgbaIdx + 3] = 255;
    } else {
      // Out of range for this candidate palette at current shift
      outOfRangeCount++;
      // High-contrast warning magenta/crimson to make out-of-range pixels immediately visible
      rgba[rgbaIdx] = 225; // R
      rgba[rgbaIdx + 1] = 29; // G
      rgba[rgbaIdx + 2] = 72; // B
      rgba[rgbaIdx + 3] = 255; // A
    }
  }

  return { rgba, outOfRangeCount, index0Count };
}

/**
 * Renders a decoded indexed sprite onto an HTML5 canvas with a candidate palette applied.
 */
export function renderPaletteAppliedSpriteToCanvas(
  canvas: HTMLCanvasElement,
  sprite: Pick<DecodedIndexedSprite, 'width' | 'height' | 'indices' | 'opaqueMask'>,
  palette: MK1PaletteCandidate,
  scale: number = 2,
  options?: {
    paletteShift?: number;
    unresolvedIndex0Color?: MK1RgbColor;
  },
): { outOfRangeCount: number; index0Count: number } {
  const { width, height } = sprite;
  if (width <= 0 || height <= 0) return { outOfRangeCount: 0, index0Count: 0 };

  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return { outOfRangeCount: 0, index0Count: 0 };

  ctx.imageSmoothingEnabled = false;

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return { outOfRangeCount: 0, index0Count: 0 };

  const { rgba, outOfRangeCount, index0Count } = generatePaletteAppliedRgba(
    sprite,
    palette,
    options,
  );
  const imgData = new ImageData(rgba, width, height);
  offCtx.putImageData(imgData, 0, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);

  return { outOfRangeCount, index0Count };
}

export interface KanoFixtureSpritesResult {
  anchorSprite: DecodedIndexedSprite;
  anchorStats: MK1SpriteColorUsageStats;
  aggregateStats: MK1AggregateColorUsageStats;
  decodedArrayCount: number;
}

/**
 * Authoritative Kano Fixture Loader (Pass 1E.1a):
 * Uses the SINGLE authoritative sprite reconstruction pipeline via `getAuthoritativeKanoSprites`,
 * completely eliminating redundant descriptor array walking or fixed 12-byte stepping.
 */
export async function loadKanoFixtureSpritesAndStats(
  source: DirectorySource,
): Promise<KanoFixtureSpritesResult | null> {
  const auth = await getAuthoritativeKanoSprites(source);
  if (!auth) {
    return null;
  }

  const anchorStats = calculateSpriteColorUsage(
    auth.anchorSprite.indices,
    auth.anchorSprite.opaqueMask,
  );
  if (!anchorStats) {
    return null;
  }

  return {
    anchorSprite: auth.anchorSprite,
    anchorStats,
    aggregateStats: auth.aggregateStats,
    decodedArrayCount: auth.sampleCount,
  };
}

/**
 * Compact Research JSON Export (Primary / Default):
 * Generates an efficient, lightweight research catalogue export (~2MB instead of ~88MB).
 *
 * Rules:
 * - Omits heavy per-candidate RGB color arrays (reconstructible deterministically from sourceWordsHex)
 * - Stores 15-bit color words once per unique contentHash in uniquePaletteContents
 * - Records physical candidate locations compactly with tier, score, and overlap relationships
 */
export function createMK1CompactPaletteCatalogueExport(
  scanResult: MK1PaletteScanResult,
  toolInfo: { name: string; version: string; milestone: string },
): MK1CompactPaletteCatalogueExport {
  const uniqueContents = scanResult.uniqueContents.map((u) => ({
    contentHash: u.contentHash,
    length: u.length,
    sourceWordsHex: u.sourceWordsHex,
    uniqueColorCount: u.uniqueColorCount,
    rankingScore: u.researchScore,
    tier: u.tier,
    zeroShiftKanoCompatible: u.zeroShiftKanoCompatible,
    representativeOffsetHex: u.representativeOffsetHex,
    duplicateLocationCount: u.duplicateLocationCount,
    allLocationOffsetsHex: u.physicalOffsetsHex,
    textLikeScore: u.textLikeScore,
    containsLikelyAsciiData: u.containsLikelyAsciiData,
  }));

  const physicalLocations: MK1CompactPhysicalLocation[] = scanResult.candidates.map((c) => ({
    exeOffset: c.exeOffset,
    exeOffsetHex: c.exeOffsetHex,
    contentHash: c.contentHash,
    tier: c.tier,
    score: c.researchScore,
    overlapRelationships: {
      containedWithin: c.overlapRelationships.containedWithin,
      sameStartDifferentLength: c.overlapRelationships.sameStartDifferentLength,
      overlappingCount: c.overlapRelationships.overlappingCount,
    },
    textLikeScore: c.textLikeScore,
    containsLikelyAsciiData: c.containsLikelyAsciiData,
  }));

  return {
    metadata: {
      exportTimestamp: new Date().toISOString(),
      toolName: toolInfo.name,
      toolVersion: toolInfo.version,
      milestone: toolInfo.milestone,
      exportType: 'compact_research',
    },
    fixture: {
      exePath: scanResult.exePath,
      exeSize: scanResult.exeSize,
    },
    counts: scanResult.counts,
    kanoColorUsage: scanResult.kanoAggregateStats,
    uniquePaletteContents: uniqueContents,
    physicalLocations,
  };
}

/**
 * Full Diagnostic Export (Advanced research option only):
 * Retains complete expanded RGB objects for every candidate location.
 */
export function createMK1PaletteCatalogueExport(
  scanResult: MK1PaletteScanResult,
  toolInfo: { name: string; version: string; milestone: string },
): MK1PaletteCatalogueExportData {
  const exportCandidates: MK1PaletteExportCandidateItem[] = scanResult.candidates.map((c) => ({
    id: c.id,
    exeOffset: c.exeOffset,
    exeOffsetHex: c.exeOffsetHex,
    length: c.length,
    sourceWordsHex: Array.from(c.colors15).map(toHex16),
    sourceWordsDec: Array.from(c.colors15),
    rgbColors: c.rgbColors,
    uniqueColorCount: c.uniqueColorCount,
    uniqueColorRatio: Math.round(c.uniqueColorRatio * 1000) / 1000,
    contentHash: c.contentHash,
    duplicateContentOf: c.duplicateContentOf,
    zeroShiftKanoCompatible: c.zeroShiftKanoCompatible,
    tier: c.tier,
    researchScore: c.researchScore,
    textLikeScore: c.textLikeScore,
    confidence: c.confidence,
    validation: c.validation,
  }));

  return {
    metadata: {
      exportTimestamp: new Date().toISOString(),
      toolName: toolInfo.name,
      toolVersion: toolInfo.version,
      milestone: toolInfo.milestone,
    },
    fixture: {
      exePath: scanResult.exePath,
      exeSize: scanResult.exeSize,
    },
    counts: scanResult.counts,
    kanoColorUsage: scanResult.kanoAggregateStats,
    candidates: exportCandidates,
  };
}
