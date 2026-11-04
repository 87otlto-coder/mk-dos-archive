import { describe, expect, it } from 'vitest';
import { MemoryDirectorySource } from '../core/filesystem/DirectorySource';
import { executePaletteRoundTrip } from '../games/mk1/research/paletteRoundTrip';
import { parsePaletteModule, serializePaletteModule, rebuildWithPaletteModule, compareBytes, bytesFromHex, bytesToHex, sha256Bytes } from '../games/mk1/research/paletteRoundTripCodec';

// Synthetic mechanics only. These bytes are deliberately not an MK1 fixture.
const twoRecords = Uint8Array.from([2, 0, 0x34, 0x12, 0xff, 0xff, 2, 0, 0x34, 0x12, 0xff, 0xff]);

describe('lossless palette codec', () => {
  it('preserves raw bits, little endian words, and duplicate records across JSON', () => {
    const ir = parsePaletteModule(twoRecords);
    expect(ir.records.map(r => r.relativeOffset)).toEqual([0, 6]);
    expect(ir.records.map(r => r.rawColorWords)).toEqual([[0x1234, 0xffff], [0x1234, 0xffff]]);
    expect(serializePaletteModule(JSON.parse(JSON.stringify(ir)))).toEqual(twoRecords);
  });

  it('parses a subarray using its byte offset', () => {
    const wrapped = Uint8Array.from([0xaa, ...twoRecords, 0xbb]);
    expect(serializePaletteModule(parsePaletteModule(wrapped.subarray(1, -1)))).toEqual(twoRecords);
  });

  it('regenerates from fields and exposes a deliberate word change as exactly one differing byte', () => {
    const ir = parsePaletteModule(twoRecords);
    ir.records[0].rawColorWords[0] = 0x1235;
    const changed = serializePaletteModule(ir);
    expect(compareBytes(twoRecords, changed)).toEqual({ equal: false, mismatchCount: 1, firstMismatch: 2 });
    expect(twoRecords[2]).toBe(0x34);
  });

  it.each(([
    [], [2], [0, 0], [1, 0, 0, 0], [0, 1], [2, 0, 0, 0], [...twoRecords, 1],
  ] as number[][]).map(bytes => ({ bytes })))('rejects incomplete or unqualified module bytes: $bytes', ({ bytes }) => {
    expect(() => parsePaletteModule(Uint8Array.from(bytes))).toThrow();
  });

  it.each([-1, 65536, 1.5, NaN])('rejects non-u16 word %s without masking it', value => {
    const ir = parsePaletteModule(twoRecords);
    ir.records[0].rawColorWords[0] = value;
    expect(() => serializePaletteModule(ir)).toThrow('raw color word');
  });

  it('rejects a changed header, gap, reordered ordinal, or removed record', () => {
    const header = parsePaletteModule(twoRecords); header.records[0].declaredLength++;
    const gap = parsePaletteModule(twoRecords); gap.records[1].relativeOffset++;
    const order = parsePaletteModule(twoRecords); order.records.reverse();
    const missing = parsePaletteModule(twoRecords); missing.records.pop();
    for (const ir of [header, gap, order, missing]) expect(() => serializePaletteModule(ir)).toThrow();
  });

  it('rebuilds only the bounded module and leaves its input untouched', () => {
    const original = Uint8Array.from([0xaa, ...twoRecords, 0xbb]);
    const replacement = twoRecords.slice(); replacement[2]++;
    const rebuilt = rebuildWithPaletteModule(original, 1, 13, replacement);
    expect(compareBytes(original, rebuilt)).toEqual({ equal: false, mismatchCount: 1, firstMismatch: 3 });
    expect(rebuilt[0]).toBe(0xaa); expect(rebuilt[13]).toBe(0xbb);
    expect(original[3]).toBe(0x34);
    expect(() => rebuildWithPaletteModule(original, 1, 12, replacement)).toThrow();
    expect(() => rebuildWithPaletteModule(original, -1, 11, replacement)).toThrow();
    expect(() => rebuildWithPaletteModule(original, 1, 99, replacement)).toThrow();
  });

  it('detects truncation as a byte mismatch', () => {
    expect(compareBytes(twoRecords, twoRecords.slice(0, -1))).toEqual({ equal: false, mismatchCount: 1, firstMismatch: 11 });
  });

  it('round trips evidence hex and rejects malformed hex', () => {
    expect(bytesFromHex(bytesToHex(twoRecords))).toEqual(twoRecords);
    for (const value of ['', '0', 'zz', '12 34']) expect(() => bytesFromHex(value)).toThrow();
  });

  it('hashes bytes with SHA-256', async () => {
    expect(await sha256Bytes(new TextEncoder().encode('abc'))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('rejects synthetic sources before prerequisite analysis', async () => {
    await expect(executePaletteRoundTrip(new MemoryDirectorySource(), {} as never)).rejects.toThrow('authentic user-loaded directory');
  });
});
