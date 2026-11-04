/**
 * Generic source file entry representing a discovered file within a directory.
 */
export interface SourceFileEntry {
  /** Normalized path with forward slashes (e.g. "DATA/FIGHTERS/CAGE.GRA") */
  path: string;
  /** File name (e.g. "CAGE.GRA") */
  name: string;
  /** Uppercase file extension without leading dot (e.g. "GRA", "EXE", or empty string) */
  extension: string;
  /** File size in bytes */
  size: number;
}

/**
 * DirectorySource abstraction allowing recursive listing and targeted slice reading
 * without eager whole-file memory loading.
 */
export interface DirectorySource {
  /** The root display name of the selected directory */
  readonly directoryName: string;

  /**
   * Indicates whether this source is a synthetic test fixture or memory buffer.
   * Real browser sources (FileSystemAccessDirectorySource, FileListDirectorySource) are explicitly false.
   * Synthetic/test sources (MemoryDirectorySource) are explicitly true.
   */
  readonly isSynthetic: boolean;

  /**
   * Recursively enumerates all files within the directory source.
   */
  listRecursive(): Promise<SourceFileEntry[]>;

  /**
   * Reads a slice of bytes from a given file at the specified offset and length.
   * @param path Normalized relative path to the file.
   * @param offset Starting byte offset.
   * @param length Maximum number of bytes to read.
   */
  readSlice(path: string, offset: number, length: number): Promise<Uint8Array>;
}

/**
 * In-memory DirectorySource implementation for testing and fixtures.
 */
export class MemoryDirectorySource implements DirectorySource {
  readonly directoryName: string;
  readonly isSynthetic = true;
  private files = new Map<string, Uint8Array>();

  constructor(directoryName = 'MemorySource') {
    this.directoryName = directoryName;
  }

  setFile(path: string, bytes: Uint8Array) {
    this.files.set(normalizePath(path).toUpperCase(), bytes);
  }

  async listRecursive(): Promise<SourceFileEntry[]> {
    const entries: SourceFileEntry[] = [];
    for (const [p, b] of Array.from(this.files.entries())) {
      const parts = p.split('/');
      const name = parts[parts.length - 1];
      entries.push({
        path: p,
        name,
        extension: extractExtension(name),
        size: b.byteLength,
      });
    }
    return entries;
  }

  async readSlice(path: string, offset: number, length: number): Promise<Uint8Array> {
    const norm = normalizePath(path).toUpperCase();
    const bytes = this.files.get(norm);
    if (!bytes) {
      throw new Error(`File not found in MemoryDirectorySource: ${path}`);
    }
    if (offset >= bytes.byteLength) {
      return new Uint8Array(0);
    }
    const end = Math.min(offset + length, bytes.byteLength);
    return bytes.slice(offset, end);
  }
}

export function normalizePath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\//, '')
    .trim();
}

/**
 * Extracts normalized uppercase extension without leading dot.
 */
export function extractExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === filename.length - 1) {
    return '';
  }
  return filename.substring(lastDot + 1).toUpperCase();
}
