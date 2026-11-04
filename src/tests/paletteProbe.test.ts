import { describe, it, expect } from 'vitest';
import { MemoryDirectorySource } from '../core/filesystem/DirectorySource';
import {
  convert15BitColorToRgb,
  computePaletteContentHash,
  calculateSpriteColorUsage,
  calculateAggregateColorUsage,
  calculateAsciiDensity,
  calculateOverlapRelationships,
  calculateResearchScore,
  groupUniquePaletteContents,
  isZeroShiftCompatible,
  scanExeForPalettes,
  generatePaletteAppliedRgba,
  createMK1PaletteCatalogueExport,
  createMK1CompactPaletteCatalogueExport,
  UNRESOLVED_IRQSKYE_PLACEHOLDER_COLOR,
} from '../games/mk1/research/paletteProbe';
import { getAuthoritativeKanoSprites } from '../games/mk1/research/authoritativeKano';

describe('MK1 Executable Palette Probe (Pass 1E.1)', () => {
  describe('VGA 15-bit to 24-bit RGB conversion', () => {
    it('converts exact black / zero word to base DAC pedestal level', () => {
      // value 0x0000:
      // r = round((((0 >> 9) & 0x3F) | 1) * (255 / 63)) = round(1 * 4.0476) = 4
      const color = convert15BitColorToRgb(0x0000);
      expect(color.r).toBe(4);
      expect(color.g).toBe(4);
      expect(color.b).toBe(4);
      expect(color.hex).toBe('#040404');
    });

    it('converts maximum 15-bit color 0x7FFF to full white #FFFFFF', () => {
      // 0x7FFF has all 15 bits set:
      // rRaw = (((0x7FFF >> 9) & 0x3F) | 1) * (255 / 63) = (63 | 1) * (255 / 63) = 63 * (255/63) = 255
      const color = convert15BitColorToRgb(0x7fff);
      expect(color.r).toBe(255);
      expect(color.g).toBe(255);
      expect(color.b).toBe(255);
      expect(color.hex).toBe('#FFFFFF');
    });

    it('converts pure 5-bit primary colors correctly', () => {
      // Pure Red: bits 14..10 set (0x7C00)
      const red = convert15BitColorToRgb(0x7c00);
      expect(red.r).toBe(255);
      expect(red.g).toBe(4);
      expect(red.b).toBe(4);
      expect(red.hex).toBe('#FF0404');

      // Pure Green: bits 9..5 set (0x03E0)
      const green = convert15BitColorToRgb(0x03e0);
      expect(green.r).toBe(4);
      expect(green.g).toBe(255);
      expect(green.b).toBe(4);
      expect(green.hex).toBe('#04FF04');

      // Pure Blue: bits 4..0 set (0x001F)
      const blue = convert15BitColorToRgb(0x001f);
      expect(blue.r).toBe(4);
      expect(blue.g).toBe(4);
      expect(blue.b).toBe(255);
      expect(blue.hex).toBe('#0404FF');
    });

    it('clamps channels cleanly between 0 and 255', () => {
      for (const val of [0, 1, 0x1234, 0x4567, 0x7fff]) {
        const c = convert15BitColorToRgb(val);
        expect(c.r).toBeGreaterThanOrEqual(0);
        expect(c.r).toBeLessThanOrEqual(255);
        expect(c.g).toBeGreaterThanOrEqual(0);
        expect(c.g).toBeLessThanOrEqual(255);
        expect(c.b).toBeGreaterThanOrEqual(0);
        expect(c.b).toBeLessThanOrEqual(255);
      }
    });
  });

  describe('Content Hash & Zero-Shift Compatibility', () => {
    it('produces identical hashes for identical colors', () => {
      const p1 = new Uint16Array([0x1000, 0x2000, 0x3000]);
      const p2 = new Uint16Array([0x1000, 0x2000, 0x3000]);
      const p3 = new Uint16Array([0x1000, 0x2000, 0x3001]);

      expect(computePaletteContentHash(p1)).toBe(computePaletteContentHash(p2));
      expect(computePaletteContentHash(p1)).not.toBe(computePaletteContentHash(p3));
    });

    it('evaluates zero-shift compatibility correctly against maximum source index', () => {
      // 1-based palette of length 64 directly covers indices 1..64
      expect(isZeroShiftCompatible(64, 64)).toBe(true);
      expect(isZeroShiftCompatible(65, 64)).toBe(true);
      expect(isZeroShiftCompatible(63, 64)).toBe(false);

      // Max source index 0 (unresolved IRQSKYE) is supported by any valid palette
      expect(isZeroShiftCompatible(10, 0)).toBe(true);
    });
  });

  describe('Sprite Color-Usage Statistics', () => {
    it('computes min, max, and distinct source indices excluding transparent pixels', () => {
      // 4 pixels:
      // pixel 0: index 10, opaque
      // pixel 1: index 99, transparent (MUST BE EXCLUDED)
      // pixel 2: index 5, opaque
      // pixel 3: index 25, opaque
      const indices = new Uint8Array([10, 99, 5, 25]);
      const opaqueMask = new Uint8Array([1, 0, 1, 1]);

      const stats = calculateSpriteColorUsage(indices, opaqueMask);
      expect(stats).not.toBeNull();
      expect(stats!.minOpaqueIndex).toBe(5);
      expect(stats!.maxOpaqueIndex).toBe(25);
      expect(stats!.distinctOpaqueCount).toBe(3);
      expect(stats!.sortedDistinctIndices).toEqual([5, 10, 25]);
    });

    it('returns null if sprite contains exclusively transparent pixels', () => {
      const indices = new Uint8Array([1, 2, 3]);
      const opaqueMask = new Uint8Array([0, 0, 0]);

      const stats = calculateSpriteColorUsage(indices, opaqueMask);
      expect(stats).toBeNull();
    });

    it('aggregates color usage across multiple sprites correctly', () => {
      const s1 = {
        indices: new Uint8Array([1, 10]),
        opaqueMask: new Uint8Array([1, 1]),
      };
      const s2 = {
        indices: new Uint8Array([5, 64, 99]),
        opaqueMask: new Uint8Array([1, 1, 0]), // 99 is transparent
      };

      const agg = calculateAggregateColorUsage([s1, s2]);
      expect(agg.sampleCount).toBe(2);
      expect(agg.minSourceIndex).toBe(1);
      expect(agg.maxSourceIndex).toBe(64);
      expect(agg.distinctCount).toBe(4);
      expect(agg.unionIndices).toEqual([1, 5, 10, 64]);
    });
  });

  describe('Synthetic MK1.EXE Palette Scanner', () => {
    it('discovers valid palette within length range', async () => {
      const exeBuffer = new Uint8Array(2048);
      const view = new DataView(exeBuffer.buffer);

      // Embed valid palette at offset 0x0100: length 16, 16 distinct 15-bit colors
      const offset = 0x0100;
      const length = 16;
      view.setUint16(offset, length, true);

      for (let i = 0; i < length; i++) {
        // Diverse 15-bit colors (e.g. 0x0100 * (i + 1) < 0x8000)
        view.setUint16(offset + 2 + i * 2, (i + 1) * 0x0400, true);
      }

      const source = new MemoryDirectorySource('synthetic');
      source.setFile('MK1.EXE', exeBuffer);

      const result = await scanExeForPalettes(source, { kanoMaxIndex: 16 });

      expect(result.counts.finalCandidatesCount).toBeGreaterThanOrEqual(1);
      const cand = result.candidates.find((c) => c.exeOffset === offset);
      expect(cand).toBeDefined();
      expect(cand!.length).toBe(16);
      expect(cand!.uniqueColorCount).toBe(16);
      expect(cand!.uniqueColorRatio).toBe(1.0);
      expect(cand!.zeroShiftKanoCompatible).toBe(true);
      expect(cand!.rgbColors.length).toBe(16);
    });

    it('rejects length < 2', async () => {
      const exeBuffer = new Uint8Array(512);
      const view = new DataView(exeBuffer.buffer);

      // length 0 at offset 0x10
      view.setUint16(0x10, 0, true);
      // length 1 at offset 0x20
      view.setUint16(0x20, 1, true);
      view.setUint16(0x22, 0x1234, true);

      const source = new MemoryDirectorySource('synthetic');
      source.setFile('MK1.EXE', exeBuffer);

      const result = await scanExeForPalettes(source);
      expect(result.candidates.some((c) => c.exeOffset === 0x10 || c.exeOffset === 0x20)).toBe(false);
    });

    it('rejects length >= 256', async () => {
      const exeBuffer = new Uint8Array(1024);
      const view = new DataView(exeBuffer.buffer);

      // length 256 at offset 0x40
      view.setUint16(0x40, 256, true);

      const source = new MemoryDirectorySource('synthetic');
      source.setFile('MK1.EXE', exeBuffer);

      const result = await scanExeForPalettes(source);
      expect(result.candidates.some((c) => c.exeOffset === 0x40)).toBe(false);
    });

    it('rejects palette containing color words with bit 15 set (>= 0x8000)', async () => {
      const exeBuffer = new Uint8Array(512);
      const view = new DataView(exeBuffer.buffer);

      const offset = 0x50;
      const length = 10;
      view.setUint16(offset, length, true);

      for (let i = 0; i < length; i++) {
        view.setUint16(offset + 2 + i * 2, i * 0x100, true);
      }
      // Corrupt one color word with bit 15 set
      view.setUint16(offset + 2 + 5 * 2, 0x8005, true);

      const source = new MemoryDirectorySource('synthetic');
      source.setFile('MK1.EXE', exeBuffer);

      const result = await scanExeForPalettes(source);
      expect(result.candidates.some((c) => c.exeOffset === offset)).toBe(false);
    });

    it('rejects palette that exceeds file bounds', async () => {
      const exeBuffer = new Uint8Array(100);
      const view = new DataView(exeBuffer.buffer);

      // Offset 90: claims length 50 (needs 102 bytes, but file only has 10 bytes left)
      view.setUint16(90, 50, true);

      const source = new MemoryDirectorySource('synthetic');
      source.setFile('MK1.EXE', exeBuffer);

      const result = await scanExeForPalettes(source);
      expect(result.candidates.some((c) => c.exeOffset === 90)).toBe(false);
    });

    it('enforces ReWolf color diversity heuristic (unique >= 2/3 length)', async () => {
      const exeBuffer = new Uint8Array(512);
      const view = new DataView(exeBuffer.buffer);

      const offset = 0x60;
      const length = 12; // 2/3 of 12 is 8 unique colors required
      view.setUint16(offset, length, true);

      // Only provide 4 distinct colors repeating
      for (let i = 0; i < length; i++) {
        view.setUint16(offset + 2 + i * 2, (i % 4) * 0x0100, true);
      }

      const source = new MemoryDirectorySource('synthetic');
      source.setFile('MK1.EXE', exeBuffer);

      const result = await scanExeForPalettes(source);
      expect(result.candidates.some((c) => c.exeOffset === offset)).toBe(false);
    });

    it('detects duplicate palette content and sets duplicateContentOf relationship', async () => {
      const exeBuffer = new Uint8Array(1024);
      const view = new DataView(exeBuffer.buffer);

      const length = 10;
      const colors = [0x0100, 0x0200, 0x0300, 0x0400, 0x0500, 0x0600, 0x0700, 0x0800, 0x0900, 0x0a00];

      // Palette 1 at offset 0x0100
      view.setUint16(0x0100, length, true);
      for (let i = 0; i < length; i++) {
        view.setUint16(0x0100 + 2 + i * 2, colors[i], true);
      }

      // Palette 2 at offset 0x0200 (identical content)
      view.setUint16(0x0200, length, true);
      for (let i = 0; i < length; i++) {
        view.setUint16(0x0200 + 2 + i * 2, colors[i], true);
      }

      const source = new MemoryDirectorySource('synthetic');
      source.setFile('MK1.EXE', exeBuffer);

      const result = await scanExeForPalettes(source);
      const cand1 = result.candidates.find((c) => c.exeOffset === 0x0100);
      const cand2 = result.candidates.find((c) => c.exeOffset === 0x0200);

      expect(cand1).toBeDefined();
      expect(cand2).toBeDefined();
      expect(cand1!.contentHash).toBe(cand2!.contentHash);
      expect(cand1!.duplicateContentOf).toBeUndefined();
      expect(cand2!.duplicateContentOf).toBe(cand1!.id);
      expect(result.counts.duplicateCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Palette Applied RGBA Rendering (EXTERNAL LEAD / LEGACY DIAGNOSTIC — NOT INDEPENDENTLY VERIFIED)', () => {
    it('applies legacy diagnostic 1-based indexing and external lead IRQSKYE placeholder for index 0 (EXTERNAL LEAD / LEGACY DIAGNOSTIC — NOT INDEPENDENTLY VERIFIED)', () => {
      const colors15 = new Uint16Array([0x7c00, 0x03e0]); // Index 1: Red, Index 2: Green
      const rgbColors = [convert15BitColorToRgb(0x7c00), convert15BitColorToRgb(0x03e0)];

      const candidatePalette = {
        id: 'MK1.EXE:0x00000000',
        exeOffset: 0,
        exeOffsetHex: '0x00000000',
        length: 2,
        colors15,
        rgbColors,
        uniqueColorCount: 2,
        uniqueColorRatio: 1.0,
        contentHash: '12345678',
        validation: { lengthValid: true, colors15Bit: true, diversityValid: true },
        confidence: 'candidate' as const,
      };

      // 4 pixels:
      // Pixel 0: transparent (opaqueMask = 0)
      // Pixel 1: index 0 (unresolved IRQSKYE per external lead)
      // Pixel 2: index 1 (palette entry 0 -> Red)
      // Pixel 3: index 5 (out of range > palette.length 2)
      const sprite = {
        width: 2,
        height: 2,
        indices: new Uint8Array([99, 0, 1, 5]),
        opaqueMask: new Uint8Array([0, 1, 1, 1]),
      };

      const { rgba, outOfRangeCount, index0Count } = generatePaletteAppliedRgba(
        sprite,
        candidatePalette as any,
      );

      expect(outOfRangeCount).toBe(1);
      expect(index0Count).toBe(1);

      // Pixel 0: transparent (A = 0)
      expect(rgba[3]).toBe(0);

      // Pixel 1: index 0 -> IRQSKYE placeholder
      expect(rgba[4]).toBe(UNRESOLVED_IRQSKYE_PLACEHOLDER_COLOR.r);
      expect(rgba[5]).toBe(UNRESOLVED_IRQSKYE_PLACEHOLDER_COLOR.g);
      expect(rgba[6]).toBe(UNRESOLVED_IRQSKYE_PLACEHOLDER_COLOR.b);
      expect(rgba[7]).toBe(255);

      // Pixel 2: index 1 -> red (#FF0404)
      expect(rgba[8]).toBe(255);
      expect(rgba[9]).toBe(4);
      expect(rgba[10]).toBe(4);
      expect(rgba[11]).toBe(255);

      // Pixel 3: out-of-range -> magenta warning #E11D48
      expect(rgba[12]).toBe(225);
      expect(rgba[13]).toBe(29);
      expect(rgba[14]).toBe(72);
      expect(rgba[15]).toBe(255);
    });
  });

  describe('Catalogue Export Integrity', () => {
    it('creates compliant export JSON structure without raw binary dumps', () => {
      const scanResult = {
        exePath: 'MK1.EXE',
        exeSize: 500000,
        counts: {
          rawLengthCandidatesCount: 100,
          colors15BitValidCount: 80,
          diversityValidCount: 20,
          finalCandidatesCount: 20,
          duplicateCount: 2,
        },
        candidates: [
          {
            id: 'MK1.EXE:0x00010000',
            exeOffset: 0x00010000,
            exeOffsetHex: '0x00010000',
            length: 4,
            colors15: new Uint16Array([0x0100, 0x0200, 0x0300, 0x0400]),
            rgbColors: [
              convert15BitColorToRgb(0x0100),
              convert15BitColorToRgb(0x0200),
              convert15BitColorToRgb(0x0300),
              convert15BitColorToRgb(0x0400),
            ],
            uniqueColorCount: 4,
            uniqueColorRatio: 1.0,
            contentHash: 'deadbeef',
            validation: { lengthValid: true, colors15Bit: true, diversityValid: true },
            confidence: 'candidate' as const,
            zeroShiftKanoCompatible: true,
          },
        ],
        kanoAggregateStats: {
          sampleCount: 187,
          minSourceIndex: 1,
          maxSourceIndex: 64,
          distinctCount: 60,
          unionIndices: [1, 2, 3, 64],
        },
      };

      const exported = createMK1PaletteCatalogueExport(scanResult as any, {
        name: 'MK DOS Archive',
        version: '0.1.0-dev',
        milestone: 'Milestone 1 — Pass 1E.1',
      });

      expect(exported.metadata.toolName).toBe('MK DOS Archive');
      expect(exported.metadata.milestone).toBe('Milestone 1 — Pass 1E.1');
      expect(exported.fixture.exePath).toBe('MK1.EXE');
      expect(exported.counts.finalCandidatesCount).toBe(20);
      expect(exported.kanoColorUsage?.maxSourceIndex).toBe(64);
      expect(exported.candidates.length).toBe(1);
      expect(exported.candidates[0].sourceWordsHex).toEqual(['0x0100', '0x0200', '0x0300', '0x0400']);

      // Ensure NO raw buffers or byte dumps exist in export
      const json = JSON.stringify(exported);
      expect(json).not.toContain('graBytes');
      expect(json).not.toContain('pixelArray');
    });
  });

  describe('Pass 1E.1a Data Quality & Research Shortlist', () => {
    it('computes ASCII density and flags text-like blocks correctly', () => {
      // Create a palette buffer that represents length header + ASCII characters 'Hello World!'
      const text = 'Hello World! A long string of text';
      const buffer = new Uint8Array(2 + text.length);
      const view = new DataView(buffer.buffer);
      view.setUint16(0, text.length / 2, true);
      for (let i = 0; i < text.length; i++) {
        buffer[2 + i] = text.charCodeAt(i);
      }

      const asciiResult = calculateAsciiDensity(buffer, 0, text.length / 2);
      expect(asciiResult.textLikeScore).toBe(100);
      expect(asciiResult.containsLikelyAsciiData).toBe(true);

      // Create a clean palette buffer of binary words that are not printable ASCII
      const cleanBuffer = new Uint8Array(2 + 12);
      cleanBuffer[0] = 6;
      cleanBuffer[1] = 0;
      // bytes with values 1, 2, 3... (non-printable control characters)
      for (let i = 2; i < cleanBuffer.length; i++) {
        cleanBuffer[i] = 1;
      }
      const cleanResult = calculateAsciiDensity(cleanBuffer, 0, 6);
      expect(cleanResult.textLikeScore).toBe(0);
      expect(cleanResult.containsLikelyAsciiData).toBe(false);
    });

    it('identifies overlap and containment relationships', () => {
      const candidates: any[] = [
        {
          id: 'c1',
          exeOffset: 100,
          byteStart: 100,
          byteEnd: 120, // range [100, 120)
          length: 10,
        },
        {
          id: 'c2',
          exeOffset: 104,
          byteStart: 104,
          byteEnd: 114, // range [104, 114) -> contained in c1
          length: 5,
        },
        {
          id: 'c3',
          exeOffset: 115,
          byteStart: 115,
          byteEnd: 130, // range [115, 130) -> overlaps c1
          length: 7,
        },
        {
          id: 'c4',
          exeOffset: 200,
          byteStart: 200,
          byteEnd: 210, // range [200, 210) -> completely isolated
          length: 5,
        },
      ];

      calculateOverlapRelationships(candidates);

      const relC1 = candidates.find((c) => c.id === 'c1')!.overlapRelationships;
      expect(relC1.containedWithin).toBeUndefined();
      expect(relC1.contains).toEqual(['c2']);
      expect(relC1.overlappingCount).toBe(2); // c2 and c3

      const relC2 = candidates.find((c) => c.id === 'c2')!.overlapRelationships;
      expect(relC2.containedWithin).toEqual(['c1']);

      const relC4 = candidates.find((c) => c.id === 'c4')!.overlapRelationships;
      expect(relC4.containedWithin).toBeUndefined();
      expect(relC4.overlappingCount).toBe(0);
    });

    it('calculates research score with bonuses and penalties', () => {
      // Clean candidate with good attributes
      const cleanCandidate: any = {
        exeOffset: 0x00010000, // 2-byte aligned
        length: 32,
        colors15: new Uint16Array([
          0x0100, 0x0120, 0x0140, 0x0160, 0x0180, 0x01a0, 0x01c0, 0x01e0,
          0x0200, 0x0220, 0x0240, 0x0260, 0x0280, 0x02a0, 0x02c0, 0x02e0,
          0x0300, 0x0320, 0x0340, 0x0360, 0x0380, 0x03a0, 0x03c0, 0x03e0,
          0x0400, 0x0420, 0x0440, 0x0460, 0x0480, 0x04a0, 0x04c0, 0x04e0,
        ]),
        textLikeScore: 0,
        containsLikelyAsciiData: false,
        overlapRelationships: {
          overlappingCount: 0,
        },
      };
      const cleanResult = calculateResearchScore(cleanCandidate, { kanoMaxIndex: 23 });
      expect(cleanResult.score).toBeGreaterThan(50);
      expect(cleanResult.tier).toBe('research');

      // Penalized candidate: unaligned, short, text-like, contained within another
      const penalizedCandidate: any = {
        exeOffset: 0x00010001, // unaligned
        length: 4,
        colors15: new Uint16Array([0x4142, 0x4344, 0x4546, 0x4748]), // ASCII ABCD...
        textLikeScore: 90,
        containsLikelyAsciiData: true,
        overlapRelationships: {
          containedWithin: ['parent_cand'],
          overlappingCount: 6,
        },
      };
      const penalizedResult = calculateResearchScore(penalizedCandidate, { kanoMaxIndex: 23 });
      expect(penalizedResult.score).toBeLessThan(cleanResult.score);
      expect(penalizedResult.tier).toBe('structural');
    });

    it('groups unique palette contents by contentHash', () => {
      const candidates: any[] = [
        {
          id: 'c1',
          exeOffset: 0x1000,
          exeOffsetHex: '0x00001000',
          length: 2,
          colors15: new Uint16Array([0x0100, 0x0200]),
          rgbColors: [{ r: 4, g: 4, b: 4, hex: '#040404' }, { r: 8, g: 8, b: 8, hex: '#080808' }],
          uniqueColorCount: 2,
          uniqueColorRatio: 1.0,
          contentHash: 'hashA',
          tier: 'research',
          researchScore: 75,
          zeroShiftKanoCompatible: true,
          containsLikelyAsciiData: false,
          textLikeScore: 0,
        },
        {
          id: 'c2',
          exeOffset: 0x2000,
          exeOffsetHex: '0x00002000',
          length: 2,
          colors15: new Uint16Array([0x0100, 0x0200]),
          rgbColors: [{ r: 4, g: 4, b: 4, hex: '#040404' }, { r: 8, g: 8, b: 8, hex: '#080808' }],
          uniqueColorCount: 2,
          uniqueColorRatio: 1.0,
          contentHash: 'hashA',
          duplicateContentOf: 'c1',
          tier: 'structural',
          researchScore: 55,
          zeroShiftKanoCompatible: true,
          containsLikelyAsciiData: false,
          textLikeScore: 0,
        },
        {
          id: 'c3',
          exeOffset: 0x3000,
          exeOffsetHex: '0x00003000',
          length: 2,
          colors15: new Uint16Array([0x0300, 0x0400]),
          rgbColors: [{ r: 12, g: 12, b: 12, hex: '#0C0C0C' }, { r: 16, g: 16, b: 16, hex: '#101010' }],
          uniqueColorCount: 2,
          uniqueColorRatio: 1.0,
          contentHash: 'hashB',
          tier: 'research',
          researchScore: 80,
          zeroShiftKanoCompatible: true,
          containsLikelyAsciiData: false,
          textLikeScore: 0,
        },
      ];

      const uniqueGroups = groupUniquePaletteContents(candidates);
      expect(uniqueGroups.length).toBe(2);

      const groupA = uniqueGroups.find((g) => g.contentHash === 'hashA')!;
      expect(groupA).toBeDefined();
      expect(groupA.representativeOffset).toBe(0x1000);
      expect(groupA.physicalOffsets).toEqual([0x1000, 0x2000]);
      expect(groupA.duplicateLocationCount).toBe(2);
      expect(groupA.tier).toBe('research');

      const groupB = uniqueGroups.find((g) => g.contentHash === 'hashB')!;
      expect(groupB.duplicateLocationCount).toBe(1);
    });

    it('creates Compact Research JSON export without per-candidate raw color arrays', () => {
      const scanResult: any = {
        exePath: 'MK1.EXE',
        exeSize: 1157222,
        counts: {
          rawLengthCandidatesCount: 1000,
          colors15BitValidCount: 500,
          diversityValidCount: 100,
          finalCandidatesCount: 100,
          structuralCandidatesCount: 100,
          researchCandidatesCount: 30,
          uniqueContentsCount: 25,
          duplicateCount: 75,
        },
        candidates: [
          {
            id: 'MK1.EXE:0x000A0000',
            exeOffset: 0x000a0000,
            exeOffsetHex: '0x000A0000',
            length: 32,
            colors15: new Uint16Array(32),
            rgbColors: new Array(32).fill({ r: 0, g: 0, b: 0, hex: '#000000' }),
            uniqueColorCount: 30,
            uniqueColorRatio: 0.9375,
            contentHash: 'abc12345',
            validation: { lengthValid: true, colors15Bit: true, diversityValid: true },
            confidence: 'candidate' as const,
            tier: 'research' as const,
            researchScore: 82,
            textLikeScore: 3,
            containsLikelyAsciiData: false,
            overlapRelationships: {
              overlappingCount: 0,
            },
            zeroShiftKanoCompatible: true,
          },
        ],
        uniqueContents: [
          {
            contentHash: 'abc12345',
            length: 32,
            sourceWordsHex: new Array(32).fill('0x0000'),
            uniqueColorCount: 30,
            uniqueColorRatio: 0.9375,
            representativeOffset: 0x000a0000,
            representativeOffsetHex: '0x000A0000',
            duplicateLocationCount: 1,
            physicalOffsets: [0x000a0000],
            physicalOffsetsHex: ['0x000A0000'],
            tier: 'research' as const,
            researchScore: 82,
            zeroShiftKanoCompatible: true,
            containsLikelyAsciiData: false,
            textLikeScore: 3,
            rgbColors: new Array(32).fill({ r: 0, g: 0, b: 0, hex: '#000000' }),
          },
        ],
        kanoAggregateStats: {
          sampleCount: 187,
          minSourceIndex: 1,
          maxSourceIndex: 23,
          distinctCount: 22,
          unionIndices: [1, 2, 3, 23],
        },
      };

      const compactExport = createMK1CompactPaletteCatalogueExport(scanResult, {
        name: 'MK DOS Archive',
        version: '0.1.0-dev',
        milestone: 'Milestone 1 — Pass 1E.1a',
      });

      expect(compactExport.metadata.exportType).toBe('compact_research');
      expect(compactExport.kanoColorUsage.sampleCount).toBe(187);
      expect(compactExport.counts.structuralCandidatesCount).toBe(100);
      expect(compactExport.counts.researchCandidatesCount).toBe(30);
      expect(compactExport.counts.uniqueContentsCount).toBe(25);

      // Verify compact candidates do not have heavy raw color arrays
      expect(compactExport.physicalLocations.length).toBe(1);
      const cand = compactExport.physicalLocations[0];
      expect(cand.tier).toBe('research');
      expect(cand.score).toBe(82);
      expect((cand as any).rgbColors).toBeUndefined();
      expect((cand as any).colors15).toBeUndefined();
      expect((cand as any).sourceWordsHex).toBeUndefined();
    });
  });
});
