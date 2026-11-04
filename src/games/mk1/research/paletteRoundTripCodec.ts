/** Pass 1E.3H: a bounded, lossless codec for the established NEWPALS grammar.
 * Color words are the serialization authority. Display RGB values never enter
 * this representation. No deduplication, relocation, or implicit bit masking.
 */
export interface PaletteRecordIR {
  ordinal: number;
  relativeOffset: number;
  declaredLength: number;
  rawColorWords: number[];
}

export interface PaletteModuleIR {
  format: 'mk1_newpals_ir_v1';
  byteOrder: 'little-endian';
  byteLength: number;
  records: PaletteRecordIR[];
}

function requireInteger(value: number, min: number, max: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`Invalid ${label}: ${value}`);
}

export function parsePaletteModule(bytes: Uint8Array): PaletteModuleIR {
  if (!bytes.length) throw new Error('Empty palette module');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const records: PaletteRecordIR[] = [];
  let cursor = 0;
  while (cursor < bytes.length) {
    if (cursor + 2 > bytes.length) throw new Error(`Truncated palette header at ${cursor}`);
    const declaredLength = view.getUint16(cursor, true);
    requireInteger(declaredLength, 2, 255, 'palette length (qualified grammar: 2..255)');
    const end = cursor + 2 + 2 * declaredLength;
    if (end > bytes.length) throw new Error(`Truncated palette payload at ${cursor}`);
    const rawColorWords: number[] = [];
    for (let p = cursor + 2; p < end; p += 2) rawColorWords.push(view.getUint16(p, true));
    records.push({ ordinal: records.length, relativeOffset: cursor, declaredLength, rawColorWords });
    cursor = end;
  }
  return { format: 'mk1_newpals_ir_v1', byteOrder: 'little-endian', byteLength: bytes.length, records };
}

/** Generates every header and word from typed fields; never copies source bytes. */
export function serializePaletteModule(ir: PaletteModuleIR): Uint8Array {
  if (ir.format !== 'mk1_newpals_ir_v1' || ir.byteOrder !== 'little-endian') throw new Error('Unsupported palette IR format');
  requireInteger(ir.byteLength, 1, 0x7fffffff, 'module byte length');
  if (!Array.isArray(ir.records) || !ir.records.length) throw new Error('Empty palette record list');
  let cursor = 0;
  ir.records.forEach((record, ordinal) => {
    if (record.ordinal !== ordinal || record.relativeOffset !== cursor) throw new Error('Palette records must retain contiguous source order');
    requireInteger(record.declaredLength, 2, 255, 'palette length');
    if (!Array.isArray(record.rawColorWords) || record.rawColorWords.length !== record.declaredLength) throw new Error('Palette header/payload length mismatch');
    for (const word of record.rawColorWords) requireInteger(word, 0, 0xffff, 'raw color word');
    cursor += 2 + 2 * record.declaredLength;
  });
  if (cursor !== ir.byteLength) throw new Error('Palette records do not exactly tile the declared module');
  const output = new Uint8Array(cursor);
  const view = new DataView(output.buffer);
  for (const record of ir.records) {
    view.setUint16(record.relativeOffset, record.declaredLength, true);
    record.rawColorWords.forEach((word, i) => view.setUint16(record.relativeOffset + 2 + 2 * i, word, true));
  }
  return output;
}

export function compareBytes(a: Uint8Array, b: Uint8Array): { equal: boolean; mismatchCount: number; firstMismatch: number | null } {
  let mismatchCount = 0;
  let firstMismatch: number | null = null;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) { mismatchCount++; if (firstMismatch === null) firstMismatch = i; }
  }
  return { equal: mismatchCount === 0, mismatchCount, firstMismatch };
}

/** Rebuild in memory, preserving every byte outside the exact module span. */
export function rebuildWithPaletteModule(original: Uint8Array, start: number, end: number, moduleBytes: Uint8Array): Uint8Array {
  requireInteger(start, 0, original.length, 'module start');
  requireInteger(end, start + 1, original.length, 'module end');
  if (moduleBytes.length !== end - start) throw new Error('Palette relocation/resizing is outside this pass');
  const rebuilt = original.slice();
  rebuilt.set(moduleBytes, start);
  return rebuilt;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
}

export function bytesFromHex(hex: string): Uint8Array {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) throw new Error('Invalid module evidence hex');
  return Uint8Array.from(hex.match(/../g)!, pair => parseInt(pair, 16));
}

export async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer)));
}
