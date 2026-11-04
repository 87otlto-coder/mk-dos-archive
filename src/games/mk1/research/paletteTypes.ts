/**
 * MK1 DOS Executable Palette Research Types (Milestone 1E.1)
 *
 * Models candidate palette structures embedded in MK1.EXE based on ReWolf reverse-engineering
 * and DOS VGA palette architecture.
 *
 * STATUS: EXTERNAL LEAD / LEGACY DIAGNOSTIC — NOT INDEPENDENTLY VERIFIED
 *
 * Architecture Grounding & Epistemic Distinctions:
 * 1. Palette Structure (ReWolf external lead):
 *      struct Palette {
 *        uint16 length;
 *        uint16 colors[length];
 *      }
 * 2. Constraints (ReWolf Heuristic):
 *      - 2 <= length < 256
 *      - All colour words < 0x8000 (15-bit RGB in 16-bit word)
 *      - Unique colours >= 2/3 of length
 * 3. 1-Based Indexing & IRQSKYE (EXTERNAL LEAD / LEGACY DIAGNOSTIC — NOT INDEPENDENTLY VERIFIED):
 *      - Executable palette colors[0] corresponds to VGA palette index 1.
 *      - Palette index 0 is asserted by external lead to be supplied by IRQSKYE.
 *      - Symbol IRQSKYE exists as a Watcom symbol in data segment, but its runtime VGA color role is UNVERIFIED.
 *      - In this legacy diagnostic tool, index 0 is modeled as a diagnostic placeholder.
 * 4. Renderer Shifting (EXTERNAL LEAD / LEGACY DIAGNOSTIC — NOT INDEPENDENTLY VERIFIED):
 *      - Final VGA index = decoded sprite index + palette_shift
 *      - For Pass 1E.1 diagnostic previews, palette_shift is assumed to be 0 (labeled: ASSUMED SHIFT 0).
 */

export interface MK1RgbColor {
  r: number;
  g: number;
  b: number;
  hex: string;
}

export type PaletteCandidateTier = 'raw' | 'structural' | 'research';

export type MK1PaletteConfidence = 'candidate' | 'inferred' | 'verified';

export type MK1PaletteRelationshipConfidence =
  | 'unknown'
  | 'heuristic'
  | 'inferred'
  | 'exact';

export interface PaletteApplication {
  paletteCandidateId: string;
  paletteShift?: number;
  relationshipConfidence: MK1PaletteRelationshipConfidence;
}

export interface MK1PaletteCandidateValidation {
  lengthValid: boolean;
  colors15Bit: boolean;
  diversityValid: boolean;
}

export interface MK1OverlapRelationships {
  containedWithin?: string[];
  contains?: string[];
  sameStartDifferentLength?: string[];
  overlappingCount: number;
}

export interface MK1PaletteCandidate {
  /**
   * Deterministic identifier based on executable provenance:
   * e.g., "MK1.EXE:0x000A7464"
   */
  id: string;

  /** Physical byte offset within MK1.EXE where the uint16 length begins */
  exeOffset: number;
  exeOffsetHex: string;

  /** Start byte offset inclusive */
  byteStart: number;
  /** End byte offset exclusive (exeOffset + 2 + length * 2) */
  byteEnd: number;

  /** Number of 16-bit color entries declared in header (2 <= length < 256) */
  length: number;

  /**
   * Recovered raw 15-bit color words (little-endian uint16).
   * Legacy diagnostic interpretation only: colors15[0] is treated as VGA index 1.
   * EXTERNAL LEAD — not independently verified fixture semantics.
   */
  colors15: Uint16Array;

  /** Converted display RGB colors using exact MK VGA DAC conversion */
  rgbColors: MK1RgbColor[];

  /** Number of distinct 15-bit color values in colors15 */
  uniqueColorCount: number;

  /** uniqueColorCount / length */
  uniqueColorRatio: number;

  /** Content hash over raw 15-bit color values (for duplicate detection) */
  contentHash: string;

  /** If another candidate with the exact same colors was found earlier, references that candidate's id */
  duplicateContentOf?: string;

  /** Validation breakdown against ReWolf research heuristics */
  validation: MK1PaletteCandidateValidation;

  /** Research candidate classification tier */
  tier: PaletteCandidateTier;

  /** Non-destructive research ranking score */
  researchScore: number;

  /** Diagnostic ASCII / text-likeness score (0-100) */
  textLikeScore: number;

  /** Flag indicating high ASCII density in palette byte range (negative ranking signal) */
  containsLikelyAsciiData: boolean;

  /** Overlapping candidate relationships in byte range */
  overlapRelationships: MK1OverlapRelationships;

  /** Research confidence level */
  confidence: MK1PaletteConfidence;

  /**
   * ZERO-SHIFT COMPATIBILITY:
   * Legacy diagnostic only: indicates whether this palette's externally proposed 1-based length is >= the maximum opaque index
   * in the test sprite / aggregate character sprite set under an assumed palette_shift = 0.
   */
  zeroShiftKanoCompatible?: boolean;

  /** Potential or future palette relationships */
  relationships?: PaletteApplication[];
}

export interface KanoSpriteUsageInfo {
  exeOffset: number;
  exeOffsetHex: string;
  graOffset: number;
  graOffsetHex: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  minOpaqueIndex: number;
  maxOpaqueIndex: number;
  distinctOpaqueIndices: number;
  checksum: string;
}

export interface MK1SpriteColorUsageStats {
  minOpaqueIndex: number;
  maxOpaqueIndex: number;
  distinctOpaqueCount: number;
  sortedDistinctIndices: number[];
}

export interface MK1AggregateColorUsageStats {
  sampleCount: number;
  minSourceIndex: number;
  maxSourceIndex: number;
  distinctCount: number;
  unionIndices: number[];
  perSpriteUsage?: KanoSpriteUsageInfo[];
}

export interface MK1UniquePaletteContent {
  contentHash: string;
  length: number;
  sourceWordsHex: string[];
  uniqueColorCount: number;
  uniqueColorRatio: number;
  researchScore: number;
  tier: PaletteCandidateTier;
  zeroShiftKanoCompatible?: boolean;
  representativeOffset: number;
  representativeOffsetHex: string;
  duplicateLocationCount: number;
  physicalOffsets: number[];
  physicalOffsetsHex: string[];
  containsLikelyAsciiData: boolean;
  textLikeScore: number;
  rgbColors?: MK1RgbColor[];
}

export interface MK1PaletteScanCounts {
  /** Candidates with 2 <= uint16 length < 256 within file bounds */
  rawLengthCandidatesCount: number;

  /** Candidates whose length-words are all valid 15-bit colors (< 0x8000) */
  colors15BitValidCount: number;

  /** Candidates meeting the 2/3 colour diversity threshold */
  diversityValidCount: number;

  /** Structural candidates passing 15-bit validity and diversity */
  structuralCandidatesCount: number;

  /** Final palette candidates passing all configured structural filters */
  finalCandidatesCount: number;

  /** Scored shortlist candidates meeting research-tier criteria */
  researchCandidatesCount: number;

  /** Unique palette contents grouped by contentHash */
  uniqueContentsCount: number;

  /** Count of candidates identified as duplicate content of an earlier candidate */
  duplicateCount: number;
}

export interface MK1PaletteScanResult {
  exePath: string;
  exeSize: number;
  counts: MK1PaletteScanCounts;
  candidates: MK1PaletteCandidate[];
  uniqueContents: MK1UniquePaletteContent[];
  kanoAggregateStats?: MK1AggregateColorUsageStats;
}

export interface MK1CompactPhysicalLocation {
  exeOffset: number;
  exeOffsetHex: string;
  contentHash: string;
  tier: PaletteCandidateTier;
  score: number;
  overlapRelationships: {
    containedWithin?: string[];
    sameStartDifferentLength?: string[];
    overlappingCount: number;
  };
  textLikeScore: number;
  containsLikelyAsciiData: boolean;
}

export interface MK1CompactPaletteCatalogueExport {
  metadata: {
    exportTimestamp: string;
    toolName: string;
    toolVersion: string;
    milestone: string;
    exportType: 'compact_research';
  };
  fixture: {
    exePath: string;
    exeSize: number;
  };
  counts: MK1PaletteScanCounts;
  kanoColorUsage?: MK1AggregateColorUsageStats;
  uniquePaletteContents: Array<{
    contentHash: string;
    length: number;
    sourceWordsHex: string[];
    uniqueColorCount: number;
    rankingScore: number;
    tier: PaletteCandidateTier;
    zeroShiftKanoCompatible?: boolean;
    representativeOffsetHex: string;
    duplicateLocationCount: number;
    allLocationOffsetsHex: string[];
    textLikeScore: number;
    containsLikelyAsciiData: boolean;
  }>;
  physicalLocations: MK1CompactPhysicalLocation[];
}

export interface MK1PaletteExportCandidateItem {
  id: string;
  exeOffset: number;
  exeOffsetHex: string;
  length: number;
  sourceWordsHex: string[];
  sourceWordsDec: number[];
  rgbColors: MK1RgbColor[];
  uniqueColorCount: number;
  uniqueColorRatio: number;
  contentHash: string;
  duplicateContentOf?: string;
  zeroShiftKanoCompatible?: boolean;
  tier: PaletteCandidateTier;
  researchScore: number;
  textLikeScore: number;
  confidence: MK1PaletteConfidence;
  validation: MK1PaletteCandidateValidation;
}

export interface MK1PaletteCatalogueExportData {
  metadata: {
    exportTimestamp: string;
    toolName: string;
    toolVersion: string;
    milestone: string;
  };
  fixture: {
    exePath: string;
    exeSize: number;
  };
  counts: MK1PaletteScanCounts;
  kanoColorUsage?: MK1AggregateColorUsageStats;
  candidates: MK1PaletteExportCandidateItem[];
}
