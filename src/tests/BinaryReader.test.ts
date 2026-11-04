import { describe, it, expect } from 'vitest';
import { BinaryReader } from '../core/binary/BinaryReader';

describe('BinaryReader', () => {
  it('reads uint8, uint16LE, uint32LE, ascii, and slice correctly', () => {
    // Construct buffer:
    // [0x4D, 0x5A] (MZ), [0x12, 0x34] (0x3412), [0x78, 0x56, 0x34, 0x12] (0x12345678), "TEST\0", [0xAA, 0xBB]
    const buffer = new Uint8Array([
      0x4d, 0x5a,
      0x12, 0x34,
      0x78, 0x56, 0x34, 0x12,
      0x54, 0x45, 0x53, 0x54, 0x00,
      0xaa, 0xbb,
    ]);

    const reader = new BinaryReader(buffer);

    expect(reader.length).toBe(15);
    expect(reader.position).toBe(0);
    expect(reader.canRead(2)).toBe(true);

    expect(reader.readUint8()).toBe(0x4d);
    expect(reader.readUint8()).toBe(0x5a);
    expect(reader.readUint16LE()).toBe(0x3412);
    expect(reader.readUint32LE()).toBe(0x12345678);
    expect(reader.readAscii(5)).toBe('TEST');

    const slice = reader.readSlice(2);
    expect(slice[0]).toBe(0xaa);
    expect(slice[1]).toBe(0xbb);
    expect(reader.position).toBe(15);
    expect(reader.remaining).toBe(0);
  });

  it('throws RangeError when reading out of bounds', () => {
    const buffer = new Uint8Array([0x01, 0x02]);
    const reader = new BinaryReader(buffer);

    expect(reader.readUint16LE()).toBe(0x0201);
    expect(() => reader.readUint8()).toThrow(RangeError);
  });

  it('throws RangeError on invalid seek', () => {
    const buffer = new Uint8Array([0x01, 0x02]);
    const reader = new BinaryReader(buffer);

    expect(() => reader.seek(-1)).toThrow(RangeError);
    expect(() => reader.seek(3)).toThrow(RangeError);
    reader.seek(2);
    expect(reader.tell()).toBe(2);
  });

  it('supports non-destructive peeking with bounds check', () => {
    const buffer = new Uint8Array([0x4d, 0x5a, 0x00, 0x00, 0x4c, 0x45]);
    const reader = new BinaryReader(buffer);

    expect(reader.peekUint8(0)).toBe(0x4d);
    expect(reader.peekUint16LE(0)).toBe(0x5a4d);
    expect(reader.peekAscii(4, 2)).toBe('LE');
    expect(reader.tell()).toBe(0); // Position did not change

    expect(() => reader.peekUint32LE(3)).toThrow(RangeError);
  });
});
