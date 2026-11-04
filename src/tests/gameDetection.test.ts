import { describe, it, expect } from 'vitest';
import { detectGameFromInventory } from '../core/discovery/gameDetection';
import {
  InventoryEntry,
  generateEntryId,
} from '../core/models/InventoryEntry';

function createMockEntry(
  path: string,
  classification: InventoryEntry['classification'],
  signatureKind: string,
  confidence: 'verified' | 'inferred' | 'hypothesis' | 'unknown' = 'inferred',
  size = 1000,
): InventoryEntry {
  const name = path.split('/').pop() || path;
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.substring(dot + 1).toUpperCase() : '';

  return {
    id: generateEntryId(path),
    path,
    name,
    extension: ext,
    size,
    classification,
    signature: {
      kind: signatureKind,
      confidence,
      details: 'Mock test signature',
    },
  };
}

describe('Game Detection Evidence Aggregation & Verified Signatures', () => {
  it('detects Mortal Kombat 1 with high confidence when primary executable and graphic cluster are present', () => {
    const entries: InventoryEntry[] = [
      createMockEntry(
        'MK1.EXE',
        'executable',
        'DOS MZ Executable',
        'verified',
        1157222,
      ),
      createMockEntry('GRAPHICS/ACT1HDRS.GRA', 'graphics_candidate', 'Unknown Binary', 'verified'),
      createMockEntry('GRAPHICS/KANO.GRA', 'graphics_candidate', 'Unknown Binary', 'verified'),
      createMockEntry('GRAPHICS/RAIDEN.GRA', 'graphics_candidate', 'Unknown Binary', 'verified'),
      createMockEntry('GRAPHICS/NINJA.GRA', 'graphics_candidate', 'Unknown Binary', 'verified'),
      createMockEntry('GRAPHICS/JCATT.GRA', 'graphics_candidate', 'Unknown Binary', 'verified'),
      createMockEntry('SAMPLES.DAT', 'data_candidate', 'Unknown Binary', 'verified'),
      createMockEntry('SFX/PUNCH.SND', 'audio_candidate', 'Unknown Binary', 'inferred'),
    ];

    const result = detectGameFromInventory(entries);

    expect(result.game).toBe('mk1');
    expect(result.gameName).toBe('Mortal Kombat');
    expect(result.confidence).toBe('high');
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it('classifies MK1.EXE alone as medium confidence (not high)', () => {
    const entries: InventoryEntry[] = [
      createMockEntry('MK1.EXE', 'executable', 'DOS MZ Executable', 'verified'),
    ];

    const result = detectGameFromInventory(entries);

    expect(result.game).toBe('mk1');
    expect(result.confidence).not.toBe('high');
    expect(result.confidence).toBe('medium');
  });

  it('detects Mortal Kombat II with high confidence when MK2.EXE (LE) and MK2 resource cluster exist', () => {
    const entries: InventoryEntry[] = [
      createMockEntry(
        'MK2.EXE',
        'executable',
        'DOS MZ / LE',
        'verified',
        861133,
      ),
      createMockEntry('ARENA.GRA', 'graphics_candidate', 'Unknown Binary', 'verified'),
      createMockEntry('ARMORY.GRA', 'graphics_candidate', 'Unknown Binary', 'verified'),
      createMockEntry('BLOOD.GRA', 'graphics_candidate', 'Unknown Binary', 'verified'),
      createMockEntry('FOREST.GRA', 'graphics_candidate', 'Unknown Binary', 'verified'),
      createMockEntry('MOUNTAIN.GRA', 'graphics_candidate', 'Unknown Binary', 'verified'),
      createMockEntry('PIT.GRA', 'graphics_candidate', 'Unknown Binary', 'verified'),
      createMockEntry('PORTAL.GRA', 'graphics_candidate', 'Unknown Binary', 'verified'),
      createMockEntry('FX/BOOM.U8', 'audio_candidate', 'Observed MK2 sound resource', 'verified'),
      createMockEntry('SOUND/PIT2.MID', 'audio_candidate', 'Standard MIDI File', 'verified'),
      createMockEntry('SOUND/PIT2.AWE', 'audio_candidate', 'Hardware Sound Bank', 'inferred'),
    ];

    const result = detectGameFromInventory(entries);

    expect(result.game).toBe('mk2');
    expect(result.gameName).toBe('Mortal Kombat II');
    expect(result.confidence).toBe('high');
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it('classifies MK2.EXE alone as medium confidence (not high)', () => {
    const entries: InventoryEntry[] = [
      createMockEntry('MK2.EXE', 'executable', 'DOS MZ / LE', 'verified'),
    ];

    const result = detectGameFromInventory(entries);

    expect(result.game).toBe('mk2');
    expect(result.confidence).not.toBe('high');
    expect(result.confidence).toBe('medium');
  });

  it('detects Mortal Kombat 3 with high confidence when MK3.EXE, DATA.MK3 (FORM), and FTR files (MFIL) exist', () => {
    const entries: InventoryEntry[] = [
      createMockEntry(
        'MK3.EXE',
        'executable',
        'DOS MZ / LE',
        'verified',
        1496497,
      ),
      createMockEntry('DATA.MK3', 'data_candidate', 'DATA.MK3 Container (FORM)', 'verified'),
      createMockEntry('BLADE.FTR', 'data_candidate', 'MK3 Fighter Container (MFIL)', 'verified'),
      createMockEntry('INDIAN.FTR', 'data_candidate', 'MK3 Fighter Container (MFIL)', 'verified'),
      createMockEntry('JAX.FTR', 'data_candidate', 'MK3 Fighter Container (MFIL)', 'verified'),
      createMockEntry('KAHN.FTR', 'data_candidate', 'MK3 Fighter Container (MFIL)', 'verified'),
      createMockEntry('ROBO.FTR', 'data_candidate', 'MK3 Fighter Container (MFIL)', 'verified'),
      createMockEntry('SHEEVA.FTR', 'data_candidate', 'MK3 Fighter Container (MFIL)', 'verified'),
    ];

    const result = detectGameFromInventory(entries);

    expect(result.game).toBe('mk3');
    expect(result.gameName).toBe('Mortal Kombat 3');
    expect(result.confidence).toBe('high');
  });

  it('does NOT require CD wrapper files (IMAGE/*.ogg, *.cue) to detect MK3 at high confidence', () => {
    // Exact game directory without distribution wrapper files
    const entries: InventoryEntry[] = [
      createMockEntry('MK3.EXE', 'executable', 'DOS MZ / LE', 'verified'),
      createMockEntry('DATA.MK3', 'data_candidate', 'DATA.MK3 Container (FORM)', 'verified'),
      createMockEntry('BLADE.FTR', 'data_candidate', 'MK3 Fighter Container (MFIL)', 'verified'),
      createMockEntry('KANG.FTR', 'data_candidate', 'MK3 Fighter Container (MFIL)', 'verified'),
      createMockEntry('LAO.FTR', 'data_candidate', 'MK3 Fighter Container (MFIL)', 'verified'),
    ];

    const result = detectGameFromInventory(entries);
    expect(result.game).toBe('mk3');
    expect(result.confidence).toBe('high');
  });

  it('classifies MK3.EXE alone as medium confidence (not high)', () => {
    const entries: InventoryEntry[] = [
      createMockEntry('MK3.EXE', 'executable', 'DOS MZ / LE', 'verified'),
    ];

    const result = detectGameFromInventory(entries);

    expect(result.game).toBe('mk3');
    expect(result.confidence).not.toBe('high');
    expect(result.confidence).toBe('medium');
  });

  it('detects ambiguous / mixed directories when multiple game executables are present', () => {
    const entries: InventoryEntry[] = [
      createMockEntry('MK1.EXE', 'executable', 'DOS MZ Executable', 'verified'),
      createMockEntry('MK2.EXE', 'executable', 'DOS MZ / LE', 'verified'),
      createMockEntry('KANO.GRA', 'graphics_candidate', 'Unknown Binary', 'inferred'),
      createMockEntry('BARAKA.GRA', 'graphics_candidate', 'Unknown Binary', 'inferred'),
    ];

    const result = detectGameFromInventory(entries);

    expect(result.game).toBe('unknown');
    expect(result.confidence).toBe('unknown');
    expect(result.gameName).toContain('Ambiguous / Mixed');
    expect(result.evidence.some((e) => e.description.includes('conflicting'))).toBe(true);
  });

  it('classifies non-MK directory as Unknown', () => {
    const entries: InventoryEntry[] = [
      createMockEntry('DOOM.EXE', 'executable', 'DOS MZ Executable', 'verified'),
      createMockEntry('DOOM.WAD', 'data_candidate', 'Unknown Binary', 'inferred'),
    ];

    const result = detectGameFromInventory(entries);

    expect(result.game).toBe('unknown');
    expect(result.confidence).toBe('unknown');
  });

  it('handles empty entries safely', () => {
    const result = detectGameFromInventory([]);
    expect(result.game).toBe('unknown');
    expect(result.confidence).toBe('unknown');
  });
});
