/** Preview the qualified odd-valued 6-bit DAC output on an 8-bit display. */
export function paletteWordToHex(word: number): string {
  return '#' + [10, 5, 0].map(shift => Math.round((((word >>> shift) & 31) * 2 + 1) * 255 / 63).toString(16).padStart(2, '0')).join('');
}

/** Quantize an HTML color choice to the nearest supported DAC level. */
export function hexColorToPaletteWord(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error('Invalid RGB color');
  return [1, 3, 5].reduce((word, offset) => (word << 5) | Math.max(0, Math.min(31,
    Math.round((parseInt(hex.slice(offset, offset + 2), 16) * 63 / 255 - 1) / 2))), 0);
}

export function parsePaletteWord(text: string): number | null {
  if (!/^(?:0x)?[0-9a-f]{1,4}$/i.test(text.trim())) return null;
  const value = parseInt(text.trim().replace(/^0x/i, ''), 16);
  return value <= 0x7fff ? value : null;
}
export function formatPaletteWord(word: number): string { return word.toString(16).toUpperCase().padStart(4, '0'); }
