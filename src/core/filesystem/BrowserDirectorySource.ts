import {
  DirectorySource,
  SourceFileEntry,
  normalizePath,
  extractExtension,
} from './DirectorySource';
import { logError, createOperationId } from '../diagnostics/diagnosticLogger';

/**
 * Native Browser FileSystemDirectoryHandle implementation of DirectorySource.
 */
export class FileSystemAccessDirectorySource implements DirectorySource {
  readonly directoryName: string;
  readonly isSynthetic = false;
  private readonly rootHandle: FileSystemDirectoryHandle;
  private fileHandleMap: Map<string, FileSystemFileHandle> = new Map();

  constructor(directoryHandle: FileSystemDirectoryHandle) {
    this.rootHandle = directoryHandle;
    this.directoryName = directoryHandle.name || 'Selected Directory';
  }

  async listRecursive(): Promise<SourceFileEntry[]> {
    const nextHandleMap = new Map<string, FileSystemFileHandle>();
    const entries: SourceFileEntry[] = [];

    const traverse = async (
      dirHandle: FileSystemDirectoryHandle,
      currentPath: string,
    ) => {
      // @ts-expect-error FileSystemDirectoryHandle.values() is standard in modern browsers
      for await (const entry of dirHandle.values()) {
        const entryPath = currentPath
          ? `${currentPath}/${entry.name}`
          : entry.name;
        const normalized = normalizePath(entryPath);

        if (entry.kind === 'directory') {
          await traverse(entry as FileSystemDirectoryHandle, entryPath);
        } else if (entry.kind === 'file') {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          nextHandleMap.set(normalized, fileHandle);

          entries.push({
            path: normalized,
            name: entry.name,
            extension: extractExtension(entry.name),
            size: file.size,
          });
        }
      }
    };

    await traverse(this.rootHandle, '');
    this.fileHandleMap = nextHandleMap;
    return entries;
  }

  async readSlice(
    path: string,
    offset: number,
    length: number,
  ): Promise<Uint8Array> {
    const normalized = normalizePath(path);
    const handle = this.fileHandleMap.get(normalized);
    if (!handle) {
      const err = new Error(`File handle not found for path: ${normalized}`);
      logError('filesystem', 'readSlice', createOperationId('fs-read'), err, {
        requestedPath: path,
        normalizedPath: normalized,
        readOffset: offset,
        readLength: length,
        sourceImplementation: 'FileSystemAccessDirectorySource',
        availableHandlesCount: this.fileHandleMap.size,
      });
      throw err;
    }

    try {
      const file = await handle.getFile();
      const sliceBlob = file.slice(offset, offset + length);
      const arrayBuffer = await sliceBlob.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (err) {
      logError('filesystem', 'readSlice', createOperationId('fs-read'), err, {
        requestedPath: path,
        normalizedPath: normalized,
        readOffset: offset,
        readLength: length,
        sourceImplementation: 'FileSystemAccessDirectorySource',
      });
      throw err;
    }
  }
}

/**
 * Fallback implementation using HTML5 FileList (e.g. from <input type="file" webkitdirectory> or drag-and-drop).
 */
export class FileListDirectorySource implements DirectorySource {
  readonly directoryName: string;
  readonly isSynthetic = false;
  private readonly filesByPath: Map<string, File> = new Map();

  constructor(files: FileList | File[], directoryName?: string) {
    const fileArray = Array.from(files);
    const firstRelative = fileArray.find(file => file.webkitRelativePath)?.webkitRelativePath || '';
    const firstParts = firstRelative.split(/[\\/]/).filter(Boolean);
    const detectedRoot = directoryName || (firstParts.length > 1 ? firstParts[0] : '');

    for (const file of fileArray) {
      // webkitRelativePath contains the selected root folder, e.g. "MK2/MK2.EXE".
      // DirectorySource paths are always relative to that selected root, matching the
      // native File System Access implementation ("MK2.EXE", "GRAPHICS/…").
      const rawPath = normalizePath(file.webkitRelativePath || file.name);
      const prefix = detectedRoot ? `${normalizePath(detectedRoot)}/` : '';
      const normalized = prefix && rawPath.toUpperCase().startsWith(prefix.toUpperCase())
        ? rawPath.slice(prefix.length)
        : rawPath;
      if (!normalized) continue;
      if (this.filesByPath.has(normalized)) {
        throw new Error(`Duplicate selected path: ${normalized}`);
      }
      this.filesByPath.set(normalized, file);
    }

    this.directoryName = detectedRoot || 'Local Game Directory';
  }

  async listRecursive(): Promise<SourceFileEntry[]> {
    const entries: SourceFileEntry[] = [];
    for (const [path, file] of this.filesByPath.entries()) {
      entries.push({
        path,
        name: file.name,
        extension: extractExtension(file.name),
        size: file.size,
      });
    }
    return entries;
  }

  async readSlice(
    path: string,
    offset: number,
    length: number,
  ): Promise<Uint8Array> {
    const normalized = normalizePath(path);
    const file = this.filesByPath.get(normalized);
    if (!file) {
      const err = new Error(`File not found for path: ${normalized}`);
      logError('filesystem', 'readSlice', createOperationId('fs-read'), err, {
        requestedPath: path,
        normalizedPath: normalized,
        readOffset: offset,
        readLength: length,
        sourceImplementation: 'FileListDirectorySource',
      });
      throw err;
    }

    try {
      const sliceBlob = file.slice(offset, offset + length);
      const arrayBuffer = await sliceBlob.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (err) {
      logError('filesystem', 'readSlice', createOperationId('fs-read'), err, {
        requestedPath: path,
        normalizedPath: normalized,
        readOffset: offset,
        readLength: length,
        sourceImplementation: 'FileListDirectorySource',
      });
      throw err;
    }
  }
}

/**
 * In-memory directory source used for unit tests or synthetic datasets.
 */
export class InMemoryDirectorySource implements DirectorySource {
  readonly directoryName: string;
  readonly isSynthetic = true;
  private readonly files: Map<string, Uint8Array> = new Map();

  constructor(
    directoryName = 'Mock Directory',
    initialFiles?: Record<string, Uint8Array>,
  ) {
    this.directoryName = directoryName;
    if (initialFiles) {
      for (const [p, data] of Object.entries(initialFiles)) {
        this.addFile(p, data);
      }
    }
  }

  addFile(path: string, data: Uint8Array): void {
    const normalized = normalizePath(path);
    this.files.set(normalized, data);
  }

  async listRecursive(): Promise<SourceFileEntry[]> {
    const entries: SourceFileEntry[] = [];
    for (const [path, data] of this.files.entries()) {
      const name = path.split('/').pop() || path;
      entries.push({
        path,
        name,
        extension: extractExtension(name),
        size: data.byteLength,
      });
    }
    return entries;
  }

  async readSlice(
    path: string,
    offset: number,
    length: number,
  ): Promise<Uint8Array> {
    const normalized = normalizePath(path);
    const data = this.files.get(normalized);
    if (!data) {
      throw new Error(`File not found for path: ${normalized}`);
    }
    return data.subarray(offset, Math.min(data.byteLength, offset + length));
  }
}
