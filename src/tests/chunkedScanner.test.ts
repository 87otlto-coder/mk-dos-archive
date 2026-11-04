import { describe, it, expect } from 'vitest';
import { scanUint32LE } from '../core/binary/chunkedScanner';
import { DirectorySource, SourceFileEntry } from '../core/filesystem/DirectorySource';

class MemoryDirectorySource implements DirectorySource {
  readonly directoryName = 'TestMemSource';
  readonly isSynthetic = true;
  private files = new Map<string, Uint8Array>();

  setFile(path: string, bytes: Uint8Array) {
    this.files.set(path.toUpperCase(), bytes);
  }

  async listRecursive(): Promise<SourceFileEntry[]> {
    const entries: SourceFileEntry[] = [];
    for (const [p, b] of this.files.entries()) {
      const parts = p.split('/');
      const name = parts[parts.length - 1];
      const ext = name.includes('.') ? name.split('.').pop()?.toUpperCase() || '' : '';
      entries.push({
        path: p,
        name,
        extension: ext,
        size: b.byteLength,
      });
    }
    return entries;
  }

  async readSlice(path: string, offset: number, length: number): Promise<Uint8Array> {
    const file = this.files.get(path.toUpperCase());
    if (!file) throw new Error(`File not found: ${path}`);
    if (offset >= file.byteLength) return new Uint8Array(0);
    const end = Math.min(file.byteLength, offset + length);
    return file.slice(offset, end);
  }
}

describe('Chunked Uint32 Scanner', () => {
  it('detects a 32-bit value positioned inside a single chunk', async () => {
    const mem = new MemoryDirectorySource();
    const data = new Uint8Array(100);
    // Write 0x0000C0FA at offset 16 (little-endian: 0xFA, 0xC0, 0x00, 0x00)
    data[16] = 0xfa;
    data[17] = 0xc0;
    data[18] = 0x00;
    data[19] = 0x00;

    mem.setFile('MK1.EXE', data);

    const matches = await scanUint32LE(mem, 'MK1.EXE', 0x0000c0fa, {
      chunkSize: 64,
    });
    expect(matches).toEqual([16]);
  });

  it('detects a 32-bit value spanning across chunk boundaries', async () => {
    const mem = new MemoryDirectorySource();
    const data = new Uint8Array(60);

    // If chunkSize = 16:
    // Chunk 0: bytes 0..15
    // Chunk 1: bytes 13..28 (with 3-byte overlap: 16 - 3 = 13)
    // Place target value at offset 15 (1 byte in chunk 0, 3 bytes in chunk 1)
    data[15] = 0xfa;
    data[16] = 0xc0;
    data[17] = 0x00;
    data[18] = 0x00;

    mem.setFile('MK1.EXE', data);

    const matches = await scanUint32LE(mem, 'MK1.EXE', 0x0000c0fa, {
      chunkSize: 16,
    });
    expect(matches).toEqual([15]);

    // Also test value split 2 bytes and 2 bytes (offset 14)
    const data2 = new Uint8Array(60);
    data2[14] = 0xfa;
    data2[15] = 0xc0;
    data2[16] = 0x00;
    data2[17] = 0x00;
    mem.setFile('SPLIT2.EXE', data2);

    const matches2 = await scanUint32LE(mem, 'SPLIT2.EXE', 0x0000c0fa, {
      chunkSize: 16,
    });
    expect(matches2).toEqual([14]);
  });

  it('detects multiple occurrences across multiple chunks without duplicates', async () => {
    const mem = new MemoryDirectorySource();
    const data = new Uint8Array(128);

    // Target at 4, 30, and 70
    const view = new DataView(data.buffer);
    view.setUint32(4, 0x0000c0fa, true);
    view.setUint32(30, 0x0000c0fa, true);
    view.setUint32(70, 0x0000c0fa, true);

    mem.setFile('MULTI.EXE', data);

    const matches = await scanUint32LE(mem, 'MULTI.EXE', 0x0000c0fa, {
      chunkSize: 32,
    });
    expect(matches).toEqual([4, 30, 70]);
  });

  it('returns empty array when target value does not occur or file is smaller than 4 bytes', async () => {
    const mem = new MemoryDirectorySource();
    mem.setFile('EMPTY.EXE', new Uint8Array(3));
    mem.setFile('OTHER.EXE', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));

    const matches1 = await scanUint32LE(mem, 'EMPTY.EXE', 0x0000c0fa);
    expect(matches1).toEqual([]);

    const matches2 = await scanUint32LE(mem, 'OTHER.EXE', 0x0000c0fa);
    expect(matches2).toEqual([]);
  });
});
