import { describe, it, expect } from 'vitest';
import { FileSystemAccessDirectorySource } from '../core/filesystem/BrowserDirectorySource';

/**
 * Synthetic mock helpers for browser FileSystemAccess API.
 * Uses zero external dependencies or copyrighted assets.
 */
function createMockFileHandle(name: string, content: Uint8Array): FileSystemFileHandle {
  return {
    kind: 'file',
    name,
    getFile: async () => ({
      name,
      size: content.byteLength,
      slice: (start = 0, end = content.byteLength) => {
        const sliced = content.subarray(start, end);
        return {
          arrayBuffer: async () => {
            const copy = new Uint8Array(sliced.byteLength);
            copy.set(sliced);
            return copy.buffer;
          },
        };
      },
    }),
  } as unknown as FileSystemFileHandle;
}

interface MockDirectoryOptions {
  name?: string;
  entries: Array<FileSystemFileHandle | FileSystemDirectoryHandle>;
  onBeforeIterate?: () => Promise<void> | void;
  onEntryYield?: (entry: FileSystemFileHandle | FileSystemDirectoryHandle) => Promise<void> | void;
  throwDuringTraversal?: Error;
}

function createMockDirectoryHandle(options: MockDirectoryOptions): FileSystemDirectoryHandle {
  return {
    kind: 'directory',
    name: options.name || 'mock_root',
    values: async function* () {
      if (options.onBeforeIterate) {
        await options.onBeforeIterate();
      }
      for (const entry of options.entries) {
        if (options.throwDuringTraversal) {
          throw options.throwDuringTraversal;
        }
        if (options.onEntryYield) {
          await options.onEntryYield(entry);
        }
        yield entry;
      }
    },
  } as unknown as FileSystemDirectoryHandle;
}

describe('FileSystemAccessDirectorySource - Atomic Handle-Map Snapshot & Concurrency Protection', () => {
  const mk1ExeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
  const soundBinBytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);

  it('A — Normal list then read: successfully enumerates and reads file slice', async () => {
    const fileHandle = createMockFileHandle('MK1.EXE', mk1ExeBytes);
    const rootHandle = createMockDirectoryHandle({
      name: 'MK1_GAME',
      entries: [fileHandle],
    });

    const source = new FileSystemAccessDirectorySource(rootHandle);
    expect(source.directoryName).toBe('MK1_GAME');

    const entries = await source.listRecursive();
    expect(entries).toHaveLength(1);
    expect(entries[0].path).toBe('MK1.EXE');
    expect(entries[0].name).toBe('MK1.EXE');
    expect(entries[0].extension).toBe('EXE');
    expect(entries[0].size).toBe(mk1ExeBytes.byteLength);

    const slice = await source.readSlice('MK1.EXE', 0, 4);
    expect(Array.from(slice)).toEqual([0x4d, 0x5a, 0x90, 0x00]);
  });

  it('B — Critical Regression Test: readSlice succeeds during in-flight re-list (prevents handle clearing race)', async () => {
    const fileHandle = createMockFileHandle('MK1.EXE', mk1ExeBytes);

    let pauseTraversal = false;
    let resumeTraversal!: () => void;
    let notifyTraversalStarted!: () => void;

    const traversalStartedPromise = new Promise<void>((resolve) => {
      notifyTraversalStarted = resolve;
    });

    const rootHandle = createMockDirectoryHandle({
      name: 'MK1_GAME',
      entries: [fileHandle],
      onBeforeIterate: async () => {
        if (pauseTraversal) {
          notifyTraversalStarted();
          await new Promise<void>((resolve) => {
            resumeTraversal = resolve;
          });
        }
      },
    });

    const source = new FileSystemAccessDirectorySource(rootHandle);

    // 1. Initial list completes and establishes valid snapshot
    const initialList = await source.listRecursive();
    expect(initialList).toHaveLength(1);

    // 2. Initial read succeeds
    const initialSlice = await source.readSlice('MK1.EXE', 0, 2);
    expect(Array.from(initialSlice)).toEqual([0x4d, 0x5a]);

    // 3. Begin a second listRecursive() that pauses mid-traversal
    pauseTraversal = true;
    const secondListPromise = source.listRecursive();

    // Wait until the second traversal has started and entered onBeforeIterate
    await traversalStartedPromise;

    // 4. While the second traversal is in progress, attempt readSlice("MK1.EXE")
    // In the old buggy implementation, this would throw "File handle not found for path: MK1.EXE"
    // because this.fileHandleMap was wiped at the very start of listRecursive().
    // With atomic snapshot replacement, readSlice must succeed seamlessly using the previous snapshot!
    const sliceDuringRelist = await source.readSlice('MK1.EXE', 0, 4);
    expect(Array.from(sliceDuringRelist)).toEqual([0x4d, 0x5a, 0x90, 0x00]);

    // Resume and finish second traversal
    resumeTraversal();
    const secondListResult = await secondListPromise;
    expect(secondListResult).toHaveLength(1);

    // Subsequent read continues to work
    const sliceAfter = await source.readSlice('MK1.EXE', 2, 2);
    expect(Array.from(sliceAfter)).toEqual([0x90, 0x00]);
  });

  it('C — Successful atomic replacement: refreshed snapshot exposes newly enumerated files', async () => {
    const file1 = createMockFileHandle('MK1.EXE', mk1ExeBytes);
    const file2 = createMockFileHandle('SOUND.BIN', soundBinBytes);

    let entriesToYield = [file1];
    const rootHandle = createMockDirectoryHandle({
      name: 'MK1_GAME',
      entries: entriesToYield,
    });

    const source = new FileSystemAccessDirectorySource(rootHandle);

    // First list: only MK1.EXE exists
    const list1 = await source.listRecursive();
    expect(list1).toHaveLength(1);
    await expect(source.readSlice('SOUND.BIN', 0, 2)).rejects.toThrow(
      'File handle not found for path: SOUND.BIN',
    );

    // Update directory entries and refresh
    entriesToYield.push(file2);
    const list2 = await source.listRecursive();
    expect(list2).toHaveLength(2);

    // Now both files are addressable in the refreshed snapshot
    const slice1 = await source.readSlice('MK1.EXE', 0, 2);
    const slice2 = await source.readSlice('SOUND.BIN', 0, 2);
    expect(Array.from(slice1)).toEqual([0x4d, 0x5a]);
    expect(Array.from(slice2)).toEqual([0x01, 0x02]);
  });

  it('D — Failed refresh preserves previous snapshot: unhandled enumeration failure leaves previous map intact', async () => {
    const fileHandle = createMockFileHandle('MK1.EXE', mk1ExeBytes);

    let shouldFail = false;
    const rootHandle = createMockDirectoryHandle({
      name: 'MK1_GAME',
      entries: [fileHandle],
      onBeforeIterate: () => {
        if (shouldFail) {
          throw new Error('Simulated browser permission revoked mid-traversal');
        }
      },
    });

    const source = new FileSystemAccessDirectorySource(rootHandle);

    // 1. Initial successful list
    await source.listRecursive();
    const sliceBefore = await source.readSlice('MK1.EXE', 0, 2);
    expect(Array.from(sliceBefore)).toEqual([0x4d, 0x5a]);

    // 2. Trigger failed re-enumeration
    shouldFail = true;
    await expect(source.listRecursive()).rejects.toThrow(
      'Simulated browser permission revoked mid-traversal',
    );

    // 3. Confirm previous valid snapshot was NOT destroyed
    // In old code, this.fileHandleMap.clear() destroyed the map before the error was thrown.
    // In atomic snapshot code, this.fileHandleMap remains completely untouched.
    const sliceAfterFailure = await source.readSlice('MK1.EXE', 0, 4);
    expect(Array.from(sliceAfterFailure)).toEqual([0x4d, 0x5a, 0x90, 0x00]);
  });
});
