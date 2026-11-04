/**
 * MK1 DOS uGRA / WrtNonZero Indexed Pixel Stream Decoder
 *
 * Implements the documented WrtNonZero stream decompression semantics
 * for Mortal Kombat 1 (DOS) uGRA sprite assets.
 *
 * Stream format:
 * - Each row in the sprite begins with a sequence of 32-bit uint32 LE commands.
 * - Each command consumes pixels until the row length exactly matches descriptor width.
 * - Command types:
 *     1. Transparent skip: bit 0 is 1. (cmd >>> 1) pixels of transparent skip.
 *     2. RLE color: bit 0 is 0, bit 1 is 1. (cmd >>> 2) & 0xFF is color index, (cmd >>> 10) is repeat count.
 *     3. Literal pixels: bits 0 and 1 are 0. (cmd >>> 2) is byte count.
 *        Followed immediately by `count` bytes, padded to a 4-byte boundary.
 *
 * Distinct transparency model:
 * - Transparency is NOT modeled as index 0. Palette index 0 is a valid color.
 * - An explicit opaqueMask (1 = opaque, 0 = transparent) is maintained separately.
 */

export interface DecodedIndexedSprite {
  success: boolean;
  width: number;
  height: number;
  indices: Uint8Array;
  opaqueMask: Uint8Array;
  encodedBytesConsumed: number;
  commandCount: number;
  failureReason?: string;
  checksum?: string;
}

/**
 * Computes a deterministic 32-bit FNV-1a checksum over indices and opaqueMask.
 * Allows regression testing sprite outputs without storing copyrighted imagery.
 */
export function computeSpriteChecksum(
  indices: Uint8Array,
  opaqueMask: Uint8Array,
): string {
  let hash = 0x811c9dc5;
  const len = indices.length;
  for (let i = 0; i < len; i++) {
    hash ^= indices[i];
    hash = Math.imul(hash, 0x01000193);
    hash ^= opaqueMask[i];
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Decodes a uGRA compressed sprite stream into raw indexed pixels and an opaque mask.
 *
 * @param graBytes Entire GRA byte buffer or buffer slice containing the sprite
 * @param graOffset Starting byte offset of the sprite within graBytes
 * @param width Expected sprite width from descriptor
 * @param height Expected sprite height from descriptor
 */
export function decodeUgraSprite(
  graBytes: Uint8Array,
  graOffset: number,
  width: number,
  height: number,
): DecodedIndexedSprite {
  // Reject zero or negative dimensions
  if (width <= 0 || height <= 0 || !Number.isInteger(width) || !Number.isInteger(height)) {
    return {
      success: false,
      width,
      height,
      indices: new Uint8Array(0),
      opaqueMask: new Uint8Array(0),
      encodedBytesConsumed: 0,
      commandCount: 0,
      failureReason: `Invalid sprite dimensions (${width}x${height})`,
    };
  }

  // Reject out-of-range graOffset
  if (graOffset < 0 || graOffset >= graBytes.length) {
    return {
      success: false,
      width,
      height,
      indices: new Uint8Array(0),
      opaqueMask: new Uint8Array(0),
      encodedBytesConsumed: 0,
      commandCount: 0,
      failureReason: `Invalid GRA start offset (${graOffset} >= buffer length ${graBytes.length})`,
    };
  }

  const totalPixels = width * height;
  const indices = new Uint8Array(totalPixels);
  const opaqueMask = new Uint8Array(totalPixels);

  let inOffset = graOffset;
  let pixelIndex = 0;
  let commandCount = 0;

  for (let row = 0; row < height; row++) {
    let rowRemaining = width;

    while (rowRemaining > 0) {
      if (inOffset + 4 > graBytes.length) {
        return {
          success: false,
          width,
          height,
          indices: new Uint8Array(0),
          opaqueMask: new Uint8Array(0),
          encodedBytesConsumed: inOffset - graOffset,
          commandCount,
          failureReason: `Input exhaustion: truncated uint32 command at byte ${inOffset} (row ${row}, remaining ${rowRemaining})`,
        };
      }

      // Read uint32 little-endian
      const cmd =
        ((graBytes[inOffset]) |
          (graBytes[inOffset + 1] << 8) |
          (graBytes[inOffset + 2] << 16) |
          (graBytes[inOffset + 3] << 24)) >>>
        0;

      inOffset += 4;
      commandCount++;

      if ((cmd & 1) !== 0) {
        // Case 1: Transparent skip
        const count = cmd >>> 1;
        if (count === 0) {
          return {
            success: false,
            width,
            height,
            indices: new Uint8Array(0),
            opaqueMask: new Uint8Array(0),
            encodedBytesConsumed: inOffset - graOffset,
            commandCount,
            failureReason: `Pathological zero transparent skip command at byte ${inOffset - 4}`,
          };
        }

        if (count > rowRemaining) {
          return {
            success: false,
            width,
            height,
            indices: new Uint8Array(0),
            opaqueMask: new Uint8Array(0),
            encodedBytesConsumed: inOffset - graOffset,
            commandCount,
            failureReason: `Row overflow: transparent skip count ${count} exceeds row remaining ${rowRemaining} (row ${row})`,
          };
        }

        // Output transparent pixels: opaqueMask stays 0, indices default to 0
        pixelIndex += count;
        rowRemaining -= count;
      } else if ((cmd & 2) !== 0) {
        // Case 2: RLE color
        const color = (cmd >>> 2) & 0xff;
        const count = cmd >>> 10;

        if (count === 0) {
          return {
            success: false,
            width,
            height,
            indices: new Uint8Array(0),
            opaqueMask: new Uint8Array(0),
            encodedBytesConsumed: inOffset - graOffset,
            commandCount,
            failureReason: `Pathological zero RLE count command at byte ${inOffset - 4}`,
          };
        }

        if (count > rowRemaining) {
          return {
            success: false,
            width,
            height,
            indices: new Uint8Array(0),
            opaqueMask: new Uint8Array(0),
            encodedBytesConsumed: inOffset - graOffset,
            commandCount,
            failureReason: `Row overflow: RLE count ${count} exceeds row remaining ${rowRemaining} (row ${row})`,
          };
        }

        for (let k = 0; k < count; k++) {
          indices[pixelIndex] = color;
          opaqueMask[pixelIndex] = 1;
          pixelIndex++;
        }
        rowRemaining -= count;
      } else {
        // Case 3: Literal indexed pixels
        const count = cmd >>> 2;

        if (count === 0) {
          return {
            success: false,
            width,
            height,
            indices: new Uint8Array(0),
            opaqueMask: new Uint8Array(0),
            encodedBytesConsumed: inOffset - graOffset,
            commandCount,
            failureReason: `Pathological zero literal count command at byte ${inOffset - 4}`,
          };
        }

        if (count > rowRemaining) {
          return {
            success: false,
            width,
            height,
            indices: new Uint8Array(0),
            opaqueMask: new Uint8Array(0),
            encodedBytesConsumed: inOffset - graOffset,
            commandCount,
            failureReason: `Row overflow: literal count ${count} exceeds row remaining ${rowRemaining} (row ${row})`,
          };
        }

        // Literal input is padded/aligned to 4-byte boundary
        const paddedBytes = (count + 3) & ~3;
        if (inOffset + paddedBytes > graBytes.length) {
          return {
            success: false,
            width,
            height,
            indices: new Uint8Array(0),
            opaqueMask: new Uint8Array(0),
            encodedBytesConsumed: inOffset - graOffset,
            commandCount,
            failureReason: `Input exhaustion: truncated literal data (needed ${paddedBytes} padded bytes, available ${graBytes.length - inOffset})`,
          };
        }

        for (let k = 0; k < count; k++) {
          indices[pixelIndex] = graBytes[inOffset + k];
          opaqueMask[pixelIndex] = 1;
          pixelIndex++;
        }

        inOffset += paddedBytes;
        rowRemaining -= count;
      }
    }
  }

  if (pixelIndex !== totalPixels) {
    return {
      success: false,
      width,
      height,
      indices: new Uint8Array(0),
      opaqueMask: new Uint8Array(0),
      encodedBytesConsumed: inOffset - graOffset,
      commandCount,
      failureReason: `Output size mismatch: expected ${totalPixels} pixels, generated ${pixelIndex}`,
    };
  }

  const encodedBytesConsumed = inOffset - graOffset;
  const checksum = computeSpriteChecksum(indices, opaqueMask);

  return {
    success: true,
    width,
    height,
    indices,
    opaqueMask,
    encodedBytesConsumed,
    commandCount,
    checksum,
  };
}

/**
 * Generates an RGBA pixel buffer (Uint8ClampedArray) representing the decoded sprite
 * using a diagnostic grayscale intensity mapping:
 * - Opaque pixels: R=G=B=paletteIndex, A=255
 * - Transparent pixels: R=G=B=0, A=0
 *
 * NOTE: Palette is NOT applied at this milestone. This is for diagnostic verification only.
 */
export function generateDiagnosticRgba(
  sprite: Pick<DecodedIndexedSprite, 'width' | 'height' | 'indices' | 'opaqueMask'>,
): Uint8ClampedArray {
  const totalPixels = sprite.width * sprite.height;
  const rgba = new Uint8ClampedArray(totalPixels * 4);

  for (let i = 0; i < totalPixels; i++) {
    const rgbaIdx = i * 4;
    if (sprite.opaqueMask[i] === 1) {
      const val = sprite.indices[i];
      rgba[rgbaIdx] = val;
      rgba[rgbaIdx + 1] = val;
      rgba[rgbaIdx + 2] = val;
      rgba[rgbaIdx + 3] = 255;
    } else {
      rgba[rgbaIdx] = 0;
      rgba[rgbaIdx + 1] = 0;
      rgba[rgbaIdx + 2] = 0;
      rgba[rgbaIdx + 3] = 0;
    }
  }

  return rgba;
}

/**
 * Renders a decoded indexed sprite onto an HTML5 canvas at the specified integer scale
 * with nearest-neighbor interpolation.
 */
export function renderDiagnosticSpriteToCanvas(
  canvas: HTMLCanvasElement,
  sprite: Pick<DecodedIndexedSprite, 'width' | 'height' | 'indices' | 'opaqueMask'>,
  scale: number = 2,
): void {
  const { width, height } = sprite;
  if (width <= 0 || height <= 0) return;

  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return;

  const rgba = generateDiagnosticRgba(sprite);
  const imgData = new ImageData(rgba, width, height);
  offCtx.putImageData(imgData, 0, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
}

