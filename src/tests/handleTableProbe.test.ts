import { describe, it, expect } from 'vitest';
import {
  reconstructMK1HandleTable,
  createMK1HandleTableExport,
} from '../games/mk1/research/handleTableProbe';
import { MK1_FILE_ENTRY_SIZE } from '../games/mk1/research/fileEntryProbe';
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

function createSyntheticFileEntryBytes(params: {
  rawFilenameOffset?: number;
  fileSize?: number;
  flags?: number;
  pad0?: number;
  pad1?: number;
  pad2?: number;
  unknown0?: number;
  bufferPointer?: number;
  unknown1?: number;
}): Uint8Array {
  const buf = new Uint8Array(MK1_FILE_ENTRY_SIZE);
  const view = new DataView(buf.buffer);

  view.setUint32(0, params.rawFilenameOffset ?? 0x00021000, true);
  view.setUint32(4, params.fileSize ?? 0x0000c0fa, true);
  view.setUint8(8, params.flags ?? 0x12);
  view.setUint8(9, params.pad0 ?? 0);
  view.setUint8(10, params.pad1 ?? 0);
  view.setUint8(11, params.pad2 ?? 0);
  view.setUint32(12, params.unknown0 ?? 0, true);
  view.setUint32(16, params.bufferPointer ?? 0, true);
  view.setUint32(20, params.unknown1 ?? 0, true);

  return buf;
}

describe('Full MK1 Handle Table Reconstruction', () => {
  it('enumerates contiguous table starting before anchor and stopping at invalid boundary', async () => {
    const mem = new MemoryDirectorySource();

    // Directory fixtures
    mem.setFile('GRAPHICS/STANCE.GRA', new Uint8Array(0x2da78));
    mem.setFile('GRAPHICS/FONTS.GRA', new Uint8Array(0x1e5a8));
    mem.setFile('GRAPHICS/MISC.GRA', new Uint8Array(0x197fc));
    mem.setFile('GRAPHICS/VICTORY.GRA', new Uint8Array(0x06308));
    mem.setFile('GRAPHICS/JCATT.GRA', new Uint8Array(49402)); // 0xC0FA

    // Construct synthetic MK1.EXE table at offset 0x200
    const exe = new Uint8Array(2000);
    const tableOffset = 0x200;

    // Entry 0: STANCE.GRA
    exe.set(
      createSyntheticFileEntryBytes({ rawFilenameOffset: 0x00, fileSize: 0x2da78 }),
      tableOffset + 0 * 24,
    );
    // Entry 1: FONTS.GRA
    exe.set(
      createSyntheticFileEntryBytes({ rawFilenameOffset: 0x14, fileSize: 0x1e5a8 }),
      tableOffset + 1 * 24,
    );
    // Entry 2: MISC.GRA
    exe.set(
      createSyntheticFileEntryBytes({ rawFilenameOffset: 0x27, fileSize: 0x197fc }),
      tableOffset + 2 * 24,
    );
    // Entry 3: VICTORY.GRA
    exe.set(
      createSyntheticFileEntryBytes({ rawFilenameOffset: 0x39, fileSize: 0x06308 }),
      tableOffset + 3 * 24,
    );
    // Entry 4: JCATT.GRA (ANCHOR)
    exe.set(
      createSyntheticFileEntryBytes({ rawFilenameOffset: 0x4f, fileSize: 49402 }),
      tableOffset + 4 * 24,
    );

    // Entry 5 is zeros (invalid terminator)

    mem.setFile('MK1.EXE', exe);

    const result = await reconstructMK1HandleTable(mem);

    expect(result.table.startOffset).toBe(0x200);
    expect(result.table.entryCount).toBe(5);
    expect(result.entries[0].fileId).toBe(0);
    expect(result.entries[0].fileSizeHex).toBe('0x0002DA78');
    expect(result.entries[4].fileId).toBe(4);
    expect(result.entries[4].fileSize).toBe(49402);
    expect(result.entries[4].resolvedPath).toBe('GRAPHICS/JCATT.GRA');
  });

  it('disambiguates ambiguous file size matches using filename offset deltas', async () => {
    const mem = new MemoryDirectorySource();

    // Two files in directory with the same size (10,000 bytes) but different path string lengths:
    // Path A: GRAPHICS/LONGNAME1.GRA -> DOS string: GRAPHICS\LONGNAME1.GRA\0 (23 bytes)
    // Path B: GRAPHICS/SHRT.GRA      -> DOS string: GRAPHICS\SHRT.GRA\0      (17 bytes)
    mem.setFile('GRAPHICS/LONGNAME1.GRA', new Uint8Array(10000));
    mem.setFile('GRAPHICS/SHRT.GRA', new Uint8Array(10000));
    mem.setFile('GRAPHICS/JCATT.GRA', new Uint8Array(49402));

    const exe = new Uint8Array(1000);
    const tableOffset = 100;

    // Entry 0: JCATT.GRA (anchor)
    exe.set(
      createSyntheticFileEntryBytes({ rawFilenameOffset: 0, fileSize: 49402 }),
      tableOffset + 0 * 24,
    );
    // Entry 1: 10000 bytes, delta = 23 to next entry
    exe.set(
      createSyntheticFileEntryBytes({ rawFilenameOffset: 20, fileSize: 10000 }),
      tableOffset + 1 * 24,
    );
    // Entry 2: delta from 1 is 43 - 20 = 23 bytes
    exe.set(
      createSyntheticFileEntryBytes({ rawFilenameOffset: 43, fileSize: 49402 }),
      tableOffset + 2 * 24,
    );

    mem.setFile('MK1.EXE', exe);

    const result = await reconstructMK1HandleTable(mem);

    expect(result.entries[1].pathResolution).toBe('size-and-offset-delta');
    expect(result.entries[1].resolvedPath).toBe('GRAPHICS/LONGNAME1.GRA');
    expect(result.entries[1].filenameOffsetDelta).toBe(23);
    expect(result.entries[1].filenameOffsetDeltaMatches).toBe(true);
  });

  it('discovers ASCII string area in executable and resolves exact paths', async () => {
    const mem = new MemoryDirectorySource();

    mem.setFile('GRAPHICS/JCATT.GRA', new Uint8Array(49402));
    mem.setFile('GRAPHICS/STANCE.GRA', new Uint8Array(30000));

    const exe = new Uint8Array(3000);
    const tableOffset = 200;

    // Entry 0: STANCE.GRA at rawFilenameOffset 0
    exe.set(
      createSyntheticFileEntryBytes({ rawFilenameOffset: 0, fileSize: 30000 }),
      tableOffset + 0 * 24,
    );
    // Entry 1: JCATT.GRA at rawFilenameOffset 20
    exe.set(
      createSyntheticFileEntryBytes({ rawFilenameOffset: 20, fileSize: 49402 }),
      tableOffset + 1 * 24,
    );

    // Place ASCII string block at offset 1500
    // String 0: "GRAPHICS\\STANCE.GRA\0" (length 20)
    // String 1: "GRAPHICS\\JCATT.GRA\0" (length 19)
    const encoder = new TextEncoder();
    const str0 = encoder.encode('GRAPHICS\\STANCE.GRA\0');
    const str1 = encoder.encode('GRAPHICS\\JCATT.GRA\0');

    exe.set(str0, 1500 + 0);
    exe.set(str1, 1500 + 20);

    mem.setFile('MK1.EXE', exe);

    const result = await reconstructMK1HandleTable(mem);

    expect(result.stringResolution.baseOffset).toBe(1500);
    expect(result.stringResolution.confidence).toBe('inferred');
    expect(result.entries[0].resolvedStringFromExe).toBe('GRAPHICS\\STANCE.GRA');
    expect(result.entries[0].pathResolution).toBe('exact-string');
    expect(result.entries[1].resolvedStringFromExe).toBe('GRAPHICS\\JCATT.GRA');
    expect(result.entries[1].pathResolution).toBe('exact-string');

    const exportData = createMK1HandleTableExport(result);
    expect(exportData.table.entryCount).toBe(2);
    expect(exportData.entries[0].resolvedStringFromExe).toBe('GRAPHICS\\STANCE.GRA');
  });
});
