import { describe, expect, it } from 'vitest';
import { paletteWordToHex, hexColorToPaletteWord, parsePaletteWord } from '../games/mk1/research/paletteEntryColors';
import { getKanoPaletteEditorPass, getPaletteEntryEditorPass, getPaletteEntryTargetConfig } from '../games/mk1/research/paletteEntryEdit';

describe('Kano color entry controls', () => {
  it('previews the qualified odd DAC levels', () => {
    expect(paletteWordToHex(0)).toBe('#040404');
    expect(paletteWordToHex(0x7c1f)).toBe('#ff04ff');
    expect(paletteWordToHex(0x03e0)).toBe('#04ff04');
  });
  it('round trips every supported 15-bit color through its display swatch', () => {
    for (let word = 0; word <= 0x7fff; word++) expect(hexColorToPaletteWord(paletteWordToHex(word))).toBe(word);
  });
  it('accepts explicit hex and rejects invalid or out-of-range draft values', () => {
    expect(parsePaletteWord(' 0x7C1F ')).toBe(0x7c1f);
    expect(parsePaletteWord('0000')).toBe(0);
    for (const value of ['', '-1', '8000', 'FFFF', '1.5', '1junk', '0x', '12345']) expect(parsePaletteWord(value)).toBeNull();
    expect(() => hexColorToPaletteWord('#xyz123')).toThrow();
  });
  it('keeps palette-entry editors in separate bounded passes', () => {
    expect(getKanoPaletteEditorPass('KANO_P')).toBe('1E.3J');
    expect(getKanoPaletteEditorPass('KANO3_P')).toBe('1E.3K');
    expect(getPaletteEntryEditorPass('GRIMM_P')).toBe('1E.3L');
    expect(getPaletteEntryEditorPass('GRIMM3_P')).toBe('1E.3M');
    expect(getPaletteEntryEditorPass('RAIDEN_P')).toBe('1E.3M');
    expect(getPaletteEntryEditorPass('LIZRED_P')).toBe('1E.3M');
    expect(getPaletteEntryEditorPass('GONGORO_P')).toBe('1E.3N');
    expect(getPaletteEntryTargetConfig('GONGORO_P')).toMatchObject({ rosterName: 'GORO', variant: 'shared', counterpartSymbol: 'GONGORO_P', unresolvedSlotIndex: 7 });
    expect(getPaletteEntryEditorPass('YANG_P')).toBe('1E.3N.3');
    expect(getPaletteEntryTargetConfig('YANG_P')).toMatchObject({ rosterName: 'SHANG TSUNG', variant: 'shared', counterpartSymbol: 'YANG_P', unresolvedSlotIndex: 8 });
    expect(getPaletteEntryTargetConfig('YNINJA3_P')).toMatchObject({ rosterName: 'SCORPION', variant: 'alternate', counterpartSymbol: 'YNINJA_P' });
    expect(getPaletteEntryTargetConfig('BNINJA_P')).toMatchObject({ rosterName: 'SUB-ZERO', variant: 'normal', counterpartSymbol: 'BNINJA3_P' });
  });
});
