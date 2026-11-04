import { describe, it, expect } from 'vitest';
import { normalizePath, extractExtension } from '../core/filesystem/DirectorySource';
import { InMemoryDirectorySource } from '../core/filesystem/BrowserDirectorySource';
import {
  buildDirectoryInventory,
  createInventoryExport,
} from '../core/discovery/inventory';
import { generateEntryId } from '../core/models/InventoryEntry';
import { GameDetectionResult } from '../core/models/GameDetection';

describe('Path Normalization & Deterministic IDs', () => {
  it('normalizes paths across Windows and Unix separators', () => {
    expect(normalizePath('DATA\\FIGHTERS\\CAGE.GRA')).toBe('DATA/FIGHTERS/CAGE.GRA');
    expect(normalizePath('/DATA///FIGHTERS//CAGE.GRA')).toBe('DATA/FIGHTERS/CAGE.GRA');
    expect(normalizePath('MK2.EXE')).toBe('MK2.EXE');
  });

  it('extracts uppercase extensions without dots', () => {
    expect(extractExtension('CAGE.GRA')).toBe('GRA');
    expect(extractExtension('MK2.EXE')).toBe('EXE');
    expect(extractExtension('README')).toBe('');
    expect(extractExtension('ARCHIVE.TAR.GZ')).toBe('GZ');
  });

  it('produces deterministic entry IDs for the same path', () => {
    const id1 = generateEntryId('DATA/FIGHTERS/CAGE.GRA');
    const id2 = generateEntryId('DATA/FIGHTERS/CAGE.GRA');
    const id3 = generateEntryId('DATA/FIGHTERS/KANO.GRA');

    expect(id1).toBe(id2);
    expect(id1).not.toBe(id3);
    expect(id1).toContain('cage_gra');
  });
});

describe('Directory Inventory Builder', () => {
  it('builds deterministically sorted inventory from DirectorySource', async () => {
    const mockFiles: Record<string, Uint8Array> = {
      'SOUND/THEME.SND': new Uint8Array([0x01, 0x02]),
      'MK.EXE': new Uint8Array([0x4d, 0x5a, 0x00, 0x00]),
      'FIGHTERS/CAGE.GRA': new Uint8Array([0x10, 0x20, 0x30]),
      'FIGHTERS/GORO.GRA': new Uint8Array([0x40, 0x50]),
    };

    const source = new InMemoryDirectorySource('MK1_INSTALL', mockFiles);
    const progressUpdates: number[] = [];

    const inventory = await buildDirectoryInventory(source, {
      headerSliceSize: 64,
      concurrency: 2,
      onProgress: (scanned, total) => {
        progressUpdates.push(scanned);
        expect(total).toBe(4);
      },
    });

    expect(inventory).toHaveLength(4);
    // Verified deterministic sorting by path ascending:
    expect(inventory.map((e) => e.path)).toEqual([
      'FIGHTERS/CAGE.GRA',
      'FIGHTERS/GORO.GRA',
      'MK.EXE',
      'SOUND/THEME.SND',
    ]);

    expect(progressUpdates).toContain(4);
  });

  it('tolerates individual file read errors without aborting inventory', async () => {
    const source = new InMemoryDirectorySource('FAULTY_DIR', {
      'VALID.GRA': new Uint8Array([0x01, 0x02]),
    });

    // Mock readSlice error for another file
    const originalReadSlice = source.readSlice.bind(source);
    source.readSlice = async (path: string, offset: number, len: number) => {
      if (path === 'BROKEN.DAT') {
        throw new Error('Permission denied or I/O error');
      }
      return originalReadSlice(path, offset, len);
    };

    source.addFile('BROKEN.DAT', new Uint8Array([0xff]));

    const inventory = await buildDirectoryInventory(source);
    expect(inventory).toHaveLength(2);

    const broken = inventory.find((e) => e.path === 'BROKEN.DAT');
    expect(broken).toBeDefined();
    expect(broken?.classification).toBe('read_error');
    expect(broken?.error).toContain('Permission denied');

    const valid = inventory.find((e) => e.path === 'VALID.GRA');
    expect(valid).toBeDefined();
    expect(valid?.classification).toBe('graphics_candidate');
  });

  it('creates clean JSON export payload without byte dumps', () => {
    const mockDetection: GameDetectionResult = {
      game: 'mk1',
      gameName: 'Mortal Kombat',
      confidence: 'high',
      evidence: [
        { description: 'MK.EXE present', weight: 25, status: 'inferred' },
      ],
      score: 55,
    };

    const mockInventory = [
      {
        id: generateEntryId('MK.EXE'),
        path: 'MK.EXE',
        name: 'MK.EXE',
        extension: 'EXE',
        size: 102400,
        classification: 'executable' as const,
        signature: {
          kind: 'DOS MZ Executable',
          confidence: 'verified' as const,
          details: 'Standard DOS executable',
          headerHex: '4D 5A',
        },
      },
    ];

    const exportData = createInventoryExport(
      'MK1_DIR',
      mockInventory,
      mockDetection,
    );

    expect(exportData.app.name).toBe('MK DOS Archive');
    expect(exportData.directory.name).toBe('MK1_DIR');
    expect(exportData.directory.totalFiles).toBe(1);
    expect(exportData.inventory[0].path).toBe('MK.EXE');
    expect(exportData.inventory[0].signature.headerHex).toBe('4D 5A');
    // Ensure no massive buffer properties exist
    expect(JSON.stringify(exportData)).not.toContain('buffer');
  });
});
