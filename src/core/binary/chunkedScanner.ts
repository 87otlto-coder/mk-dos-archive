import { DirectorySource } from '../filesystem/DirectorySource';

export interface ChunkedScanOptions {
  /** Size of slice to read per chunk in bytes (default 65536) */
  chunkSize?: number;
  /** Absolute file offset to begin scanning from (default 0) */
  startOffset?: number;
  /** Absolute file offset to end scanning at (optional, defaults to total file size) */
  endOffset?: number;
  /** Known file size to skip file listing lookup (optional) */
  fileSize?: number;
  /** Maximum number of match offsets to collect before terminating early (default Infinity) */
  maxMatches?: number;
  /** Progress notification callback */
  onProgress?: (bytesScanned: number, totalBytes: number) => void;
}

/**
 * Scans a file in a DirectorySource for occurrences of a 32-bit little-endian integer.
 * Memory-bounded: reads in chunks and handles values spanning chunk boundaries without full memory loading.
 *
 * @param source DirectorySource instance.
 * @param path Normalized relative path to the file.
 * @param targetValue 32-bit unsigned integer value to search for (e.g. 0x0000C0FA).
 * @param options Scan configuration options.
 * @returns Array of absolute file byte offsets where the 32-bit value occurs.
 */
export async function scanUint32LE(
  source: DirectorySource,
  path: string,
  targetValue: number,
  options: ChunkedScanOptions = {},
): Promise<number[]> {
  const targetUint32 = targetValue >>> 0;
  const rawChunkSize = options.chunkSize ?? 65536;
  const chunkSize = Math.max(4, rawChunkSize);
  const maxMatches = options.maxMatches ?? Infinity;

  // Determine total file size
  let totalFileSize = options.fileSize;
  if (totalFileSize === undefined) {
    const list = await source.listRecursive();
    const entry = list.find((e) => e.path.toUpperCase() === path.toUpperCase());
    if (!entry) {
      throw new Error(`File not found in directory source: ${path}`);
    }
    totalFileSize = entry.size;
  }

  const startOffset = Math.max(0, options.startOffset ?? 0);
  const endOffset = Math.min(
    totalFileSize,
    options.endOffset ?? totalFileSize,
  );

  if (endOffset - startOffset < 4) {
    options.onProgress?.(totalFileSize, totalFileSize);
    return [];
  }

  const matches: number[] = [];
  let currentOffset = startOffset;

  while (currentOffset + 4 <= endOffset && matches.length < maxMatches) {
    const bytesToRead = Math.min(chunkSize, endOffset - currentOffset);
    if (bytesToRead < 4) {
      break;
    }

    const chunk = await source.readSlice(path, currentOffset, bytesToRead);
    if (chunk.length < 4) {
      break;
    }

    const view = new DataView(
      chunk.buffer,
      chunk.byteOffset,
      chunk.byteLength,
    );

    const scanLimit = chunk.length - 4;
    for (let i = 0; i <= scanLimit; i++) {
      if (view.getUint32(i, true) === targetUint32) {
        const absoluteOffset = currentOffset + i;
        matches.push(absoluteOffset);
        if (matches.length >= maxMatches) {
          break;
        }
      }
    }

    options.onProgress?.(
      Math.min(totalFileSize, currentOffset + bytesToRead),
      totalFileSize,
    );

    // If the chunk reached the end of the scan region, we're done
    if (currentOffset + bytesToRead >= endOffset) {
      break;
    }

    // Advance with 3 bytes overlap to catch 4-byte values split across boundaries
    currentOffset += chunk.length - 3;
  }

  options.onProgress?.(totalFileSize, totalFileSize);
  return matches;
}

export interface AsciiScanOptions extends ChunkedScanOptions {
  caseInsensitive?: boolean;
}

/**
 * Scans a file in a DirectorySource for occurrences of an ASCII string pattern.
 * Memory-bounded chunked scanning with overlap equal to (patternLength - 1).
 *
 * @param source DirectorySource instance.
 * @param path Normalized relative path to the file.
 * @param pattern ASCII string to search for (e.g. "GRAPHICS\\JCATT.GRA\0").
 * @param options Scan options including case-insensitivity.
 * @returns Array of absolute file byte offsets where the string pattern occurs.
 */
export async function scanAsciiPattern(
  source: DirectorySource,
  path: string,
  pattern: string,
  options: AsciiScanOptions = {},
): Promise<number[]> {
  if (pattern.length === 0) return [];

  const rawChunkSize = options.chunkSize ?? 65536;
  const patternLength = pattern.length;
  const chunkSize = Math.max(patternLength * 2, rawChunkSize);
  const maxMatches = options.maxMatches ?? Infinity;
  const caseInsensitive = options.caseInsensitive ?? true;

  // Prepare pattern byte array
  const patternBytes = new Uint8Array(patternLength);
  for (let i = 0; i < patternLength; i++) {
    patternBytes[i] = pattern.charCodeAt(i) & 0xff;
  }

  // Determine total file size
  let totalFileSize = options.fileSize;
  if (totalFileSize === undefined) {
    const list = await source.listRecursive();
    const entry = list.find((e) => e.path.toUpperCase() === path.toUpperCase());
    if (!entry) {
      throw new Error(`File not found in directory source: ${path}`);
    }
    totalFileSize = entry.size;
  }

  const startOffset = Math.max(0, options.startOffset ?? 0);
  const endOffset = Math.min(totalFileSize, options.endOffset ?? totalFileSize);

  if (endOffset - startOffset < patternLength) {
    options.onProgress?.(totalFileSize, totalFileSize);
    return [];
  }

  const matches: number[] = [];
  let currentOffset = startOffset;
  const overlap = patternLength - 1;

  while (currentOffset + patternLength <= endOffset && matches.length < maxMatches) {
    const bytesToRead = Math.min(chunkSize, endOffset - currentOffset);
    if (bytesToRead < patternLength) {
      break;
    }

    const chunk = await source.readSlice(path, currentOffset, bytesToRead);
    if (chunk.length < patternLength) {
      break;
    }

    const scanLimit = chunk.length - patternLength;
    for (let i = 0; i <= scanLimit; i++) {
      let matched = true;
      for (let j = 0; j < patternLength; j++) {
        let b = chunk[i + j];
        let p = patternBytes[j];
        if (caseInsensitive) {
          // ASCII lowercase to uppercase mapping for A-Z
          if (b >= 0x61 && b <= 0x7a) b -= 0x20;
          if (p >= 0x61 && p <= 0x7a) p -= 0x20;
        }
        if (b !== p) {
          matched = false;
          break;
        }
      }

      if (matched) {
        const absoluteOffset = currentOffset + i;
        matches.push(absoluteOffset);
        if (matches.length >= maxMatches) {
          break;
        }
      }
    }

    options.onProgress?.(
      Math.min(totalFileSize, currentOffset + bytesToRead),
      totalFileSize,
    );

    if (currentOffset + bytesToRead >= endOffset) {
      break;
    }

    currentOffset += chunk.length - overlap;
  }

  options.onProgress?.(totalFileSize, totalFileSize);
  return matches;
}

/**
 * Reads a bounded NUL-terminated ASCII string from a given file offset.
 *
 * @param source DirectorySource instance.
 * @param path Normalized relative path to the file.
 * @param offset Byte offset in the file where the string starts.
 * @param maxLength Maximum length to read (default 260 bytes).
 * @returns The decoded ASCII string, or null if unreadable / non-ASCII.
 */
export async function readNullTerminatedAscii(
  source: DirectorySource,
  path: string,
  offset: number,
  maxLength = 260,
): Promise<string | null> {
  if (offset < 0) return null;

  try {
    const slice = await source.readSlice(path, offset, maxLength);
    if (slice.length === 0) return null;

    // Find null terminator
    let nullIndex = -1;
    for (let i = 0; i < slice.length; i++) {
      if (slice[i] === 0x00) {
        nullIndex = i;
        break;
      }
    }

    if (nullIndex === -1) {
      // Not NUL-terminated within safety bound
      return null;
    }

    if (nullIndex === 0) {
      // Empty string
      return '';
    }

    // Check that characters before NUL are printable ASCII (or valid path chars: 0x20..0x7E)
    let str = '';
    for (let i = 0; i < nullIndex; i++) {
      const code = slice[i];
      if (code < 0x20 || code > 0x7e) {
        // Non-printable or control character
        return null;
      }
      str += String.fromCharCode(code);
    }

    return str;
  } catch {
    return null;
  }
}

