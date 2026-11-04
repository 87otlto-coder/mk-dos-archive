import { describe, it, expect } from 'vitest';
import {
  decodeUgraSprite,
  computeSpriteChecksum,
  generateDiagnosticRgba,
} from '../games/mk1/graphics/ugraDecoder';
import {
  detectDescriptorArrayRuns,
  parseCandidateSpriteDescriptor,
} from '../games/mk1/research/spriteDescriptorProbe';
import { MK1SpriteDescriptorCandidate } from '../games/mk1/research/spriteDescriptorTypes';

// Helpers to construct 32-bit LE uint32 commands
function cmdTransparentSkip(pixels: number): number {
  return ((pixels << 1) | 1) >>> 0;
}

function cmdRleColor(color: number, repeat: number): number {
  return ((repeat << 10) | ((color & 0xff) << 2) | 2) >>> 0;
}

function cmdLiteral(count: number): number {
  return (count << 2) >>> 0;
}

function writeUint32LE(buffer: Uint8Array, offset: number, value: number): void {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
  buffer[offset + 2] = (value >>> 16) & 0xff;
  buffer[offset + 3] = (value >>> 24) & 0xff;
}

describe('MK1 uGRA / WrtNonZero Pixel Stream Decoder', () => {
  it('1. Verifies transparent skip command behavior', () => {
    // 1 row of 6 pixels, all transparent skip
    const buffer = new Uint8Array(4);
    writeUint32LE(buffer, 0, cmdTransparentSkip(6));

    const result = decodeUgraSprite(buffer, 0, 6, 1);

    expect(result.success).toBe(true);
    expect(result.width).toBe(6);
    expect(result.height).toBe(1);
    expect(result.indices.length).toBe(6);
    expect(result.opaqueMask.length).toBe(6);
    expect(Array.from(result.opaqueMask)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(result.commandCount).toBe(1);
    expect(result.encodedBytesConsumed).toBe(4);
  });

  it('2. Verifies RLE color repetition', () => {
    // 1 row of 5 pixels of color index 0x2A (42)
    const buffer = new Uint8Array(4);
    writeUint32LE(buffer, 0, cmdRleColor(42, 5));

    const result = decodeUgraSprite(buffer, 0, 5, 1);

    expect(result.success).toBe(true);
    expect(result.width).toBe(5);
    expect(result.height).toBe(1);
    expect(Array.from(result.indices)).toEqual([42, 42, 42, 42, 42]);
    expect(Array.from(result.opaqueMask)).toEqual([1, 1, 1, 1, 1]);
    expect(result.commandCount).toBe(1);
    expect(result.encodedBytesConsumed).toBe(4);
  });

  it('3. Verifies literal pixel copying and 4-byte boundary padding', () => {
    // 1 row of 3 pixels literal [10, 20, 30]. Padded to 4 bytes (1 pad byte).
    // Total size: 4 bytes (command) + 4 bytes (literal + pad) = 8 bytes.
    const buffer = new Uint8Array(8);
    writeUint32LE(buffer, 0, cmdLiteral(3));
    buffer[4] = 10;
    buffer[5] = 20;
    buffer[6] = 30;
    buffer[7] = 0xee; // padding byte

    const result = decodeUgraSprite(buffer, 0, 3, 1);

    expect(result.success).toBe(true);
    expect(result.width).toBe(3);
    expect(result.height).toBe(1);
    expect(Array.from(result.indices)).toEqual([10, 20, 30]);
    expect(Array.from(result.opaqueMask)).toEqual([1, 1, 1]);
    expect(result.encodedBytesConsumed).toBe(8);

    // Test with count = 5: padded to 8 bytes (3 pad bytes) -> total 12 bytes
    const buffer5 = new Uint8Array(12);
    writeUint32LE(buffer5, 0, cmdLiteral(5));
    buffer5.set([1, 2, 3, 4, 5], 4);
    const result5 = decodeUgraSprite(buffer5, 0, 5, 1);
    expect(result5.success).toBe(true);
    expect(Array.from(result5.indices)).toEqual([1, 2, 3, 4, 5]);
    expect(result5.encodedBytesConsumed).toBe(12);
  });

  it('4. Detects row length mismatch / overflow', () => {
    // Expected row width 4, but command produces 5 pixels
    const buffer = new Uint8Array(4);
    writeUint32LE(buffer, 0, cmdTransparentSkip(5));

    const result = decodeUgraSprite(buffer, 0, 4, 1);

    expect(result.success).toBe(false);
    expect(result.failureReason).toContain('Row overflow');
  });

  it('5. Verifies multi-row decoding and row boundary completion', () => {
    // Width 4, Height 2 (8 pixels total)
    // Row 0: 2 transparent skip + 2 pixels of color 7 (4 bytes cmd1, 4 bytes cmd2)
    // Row 1: 4 literal pixels [100, 101, 102, 103] (4 bytes cmd + 4 bytes literal)
    // Total encoded bytes = 4 + 4 + 4 + 4 = 16 bytes.
    const buffer = new Uint8Array(16);
    writeUint32LE(buffer, 0, cmdTransparentSkip(2));
    writeUint32LE(buffer, 4, cmdRleColor(7, 2));
    writeUint32LE(buffer, 8, cmdLiteral(4));
    buffer[12] = 100;
    buffer[13] = 101;
    buffer[14] = 102;
    buffer[15] = 103;

    const result = decodeUgraSprite(buffer, 0, 4, 2);

    expect(result.success).toBe(true);
    expect(result.width).toBe(4);
    expect(result.height).toBe(2);
    expect(result.commandCount).toBe(3);
    expect(result.encodedBytesConsumed).toBe(16);

    // Row 0: 2 transparent, 2 of color 7
    expect(result.opaqueMask[0]).toBe(0);
    expect(result.opaqueMask[1]).toBe(0);
    expect(result.opaqueMask[2]).toBe(1);
    expect(result.indices[2]).toBe(7);
    expect(result.opaqueMask[3]).toBe(1);
    expect(result.indices[3]).toBe(7);

    // Row 1: all 4 opaque with literal values
    expect(Array.from(result.opaqueMask.slice(4, 8))).toEqual([1, 1, 1, 1]);
    expect(Array.from(result.indices.slice(4, 8))).toEqual([100, 101, 102, 103]);
  });

  it('6. Verifies deterministic checksum generation across decodes', () => {
    const buffer = new Uint8Array(8);
    writeUint32LE(buffer, 0, cmdRleColor(0x33, 4));
    writeUint32LE(buffer, 4, cmdTransparentSkip(4));

    const decodeA = decodeUgraSprite(buffer, 0, 4, 2);
    const decodeB = decodeUgraSprite(buffer, 0, 4, 2);

    expect(decodeA.success).toBe(true);
    expect(decodeB.success).toBe(true);
    expect(decodeA.checksum).toBeDefined();
    expect(decodeA.checksum).toBe(decodeB.checksum);

    const manualChecksum = computeSpriteChecksum(decodeA.indices, decodeA.opaqueMask);
    expect(decodeA.checksum).toBe(manualChecksum);
  });

  it('7. Enforces strict transparency model (index 0 is distinct from transparent)', () => {
    // RLE of color 0 is an OPAQUE black pixel (opaqueMask = 1)
    const buffer = new Uint8Array(8);
    writeUint32LE(buffer, 0, cmdRleColor(0, 2)); // 2 opaque pixels of color 0
    writeUint32LE(buffer, 4, cmdTransparentSkip(2)); // 2 transparent pixels

    const result = decodeUgraSprite(buffer, 0, 4, 1);

    expect(result.success).toBe(true);
    expect(result.indices[0]).toBe(0);
    expect(result.opaqueMask[0]).toBe(1); // OPAQUE
    expect(result.indices[1]).toBe(0);
    expect(result.opaqueMask[1]).toBe(1); // OPAQUE

    expect(result.opaqueMask[2]).toBe(0); // TRANSPARENT
    expect(result.opaqueMask[3]).toBe(0); // TRANSPARENT

    const rgba = generateDiagnosticRgba(result);
    // Pixel 0: R=0, G=0, B=0, A=255 (Opaque black)
    expect(rgba[0]).toBe(0);
    expect(rgba[3]).toBe(255);

    // Pixel 2: R=0, G=0, B=0, A=0 (Transparent)
    expect(rgba[8 + 3]).toBe(0);
  });

  it('8. Verifies array run detection with stride 12 and interruptions', () => {
    // Create 5 synthetic candidates at stride 12 with a gap of 24 (1 missing descriptor)
    const offsets = [0x1000, 0x100c, 0x1018, 0x1030, 0x103c]; // 0x1018 -> 0x1030 is 24 bytes gap
    const mockCandidates: MK1SpriteDescriptorCandidate[] = offsets.map((off) => ({
      exeOffset: off,
      exeOffsetHex: `0x${off.toString(16).toUpperCase()}`,
      kind: 'with-xy',
      width: 50,
      height: 50,
      x: 0,
      y: 0,
      packedFileReference: 0x100,
      packedFileReferenceHex: '0x00000100',
      fileId: 35,
      graOffset: 100,
      graOffsetHex: '0x00000064',
      targetGraPath: 'GRAPHICS/KANO.GRA',
      targetGraSize: 500000,
      validation: {
        widthValid: true,
        heightValid: true,
        xyValid: true,
        fileIdMatch: true,
        graOffsetValid: true,
        allRulesPassed: true,
        failedRules: [],
      },
      confidence: 'candidate',
      primaryCandidate: true,
    }));

    const runs = detectDescriptorArrayRuns(mockCandidates);

    expect(runs.length).toBe(1);
    expect(runs[0].kind).toBe('with-xy');
    expect(runs[0].stride).toBe(12);
    expect(runs[0].descriptorCount).toBe(5);
    expect(runs[0].interruptions.length).toBe(1);
    expect(runs[0].interruptions[0].gapBytes).toBe(24);
  });
});
