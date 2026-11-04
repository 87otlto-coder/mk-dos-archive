/**
 * BinaryReader
 * Lightweight, strictly bounds-checked reader for binary byte buffers.
 */
export class BinaryReader {
  private readonly buffer: Uint8Array;
  private readonly dataView: DataView;
  private cursor: number;

  constructor(buffer: Uint8Array, offset = 0) {
    this.buffer = buffer;
    this.dataView = new DataView(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength,
    );
    if (offset < 0 || offset > buffer.byteLength) {
      throw new RangeError(
        `Initial offset ${offset} is outside buffer bounds [0, ${buffer.byteLength}]`,
      );
    }
    this.cursor = offset;
  }

  get length(): number {
    return this.buffer.byteLength;
  }

  get position(): number {
    return this.cursor;
  }

  get remaining(): number {
    return Math.max(0, this.buffer.byteLength - this.cursor);
  }

  tell(): number {
    return this.cursor;
  }

  seek(offset: number): void {
    if (offset < 0 || offset > this.buffer.byteLength) {
      throw new RangeError(
        `Seek offset ${offset} is outside buffer bounds [0, ${this.buffer.byteLength}]`,
      );
    }
    this.cursor = offset;
  }

  skip(count: number): void {
    this.seek(this.cursor + count);
  }

  canRead(bytes: number): boolean {
    return bytes >= 0 && this.cursor + bytes <= this.buffer.byteLength;
  }

  private assertCanRead(bytes: number, operation: string): void {
    if (!this.canRead(bytes)) {
      throw new RangeError(
        `Cannot ${operation}: requires ${bytes} byte(s) at offset ${this.cursor}, but only ${this.remaining} byte(s) remain (total ${this.buffer.byteLength})`,
      );
    }
  }

  readUint8(): number {
    this.assertCanRead(1, 'readUint8');
    const val = this.dataView.getUint8(this.cursor);
    this.cursor += 1;
    return val;
  }

  readUint16LE(): number {
    this.assertCanRead(2, 'readUint16LE');
    const val = this.dataView.getUint16(this.cursor, true);
    this.cursor += 2;
    return val;
  }

  readInt16LE(): number {
    this.assertCanRead(2, 'readInt16LE');
    const val = this.dataView.getInt16(this.cursor, true);
    this.cursor += 2;
    return val;
  }

  readUint32LE(): number {
    this.assertCanRead(4, 'readUint32LE');
    const val = this.dataView.getUint32(this.cursor, true);
    this.cursor += 4;
    return val;
  }

  readAscii(length: number): string {
    this.assertCanRead(length, 'readAscii');
    let str = '';
    for (let i = 0; i < length; i++) {
      const byte = this.buffer[this.cursor + i];
      if (byte === 0) break; // Null terminator
      str += String.fromCharCode(byte);
    }
    this.cursor += length;
    return str;
  }

  readSlice(length: number): Uint8Array {
    this.assertCanRead(length, 'readSlice');
    const slice = this.buffer.subarray(this.cursor, this.cursor + length);
    this.cursor += length;
    return slice;
  }

  peekUint8(offset = this.cursor): number {
    if (offset < 0 || offset + 1 > this.buffer.byteLength) {
      throw new RangeError(
        `Cannot peekUint8 at offset ${offset}: out of bounds [0, ${this.buffer.byteLength}]`,
      );
    }
    return this.dataView.getUint8(offset);
  }

  peekUint16LE(offset = this.cursor): number {
    if (offset < 0 || offset + 2 > this.buffer.byteLength) {
      throw new RangeError(
        `Cannot peekUint16LE at offset ${offset}: out of bounds [0, ${this.buffer.byteLength}]`,
      );
    }
    return this.dataView.getUint16(offset, true);
  }

  peekUint32LE(offset = this.cursor): number {
    if (offset < 0 || offset + 4 > this.buffer.byteLength) {
      throw new RangeError(
        `Cannot peekUint32LE at offset ${offset}: out of bounds [0, ${this.buffer.byteLength}]`,
      );
    }
    return this.dataView.getUint32(offset, true);
  }

  peekAscii(offset: number, length: number): string {
    if (offset < 0 || offset + length > this.buffer.byteLength) {
      throw new RangeError(
        `Cannot peekAscii at offset ${offset} (len ${length}): out of bounds [0, ${this.buffer.byteLength}]`,
      );
    }
    let str = '';
    for (let i = 0; i < length; i++) {
      const byte = this.buffer[offset + i];
      if (byte === 0) break;
      str += String.fromCharCode(byte);
    }
    return str;
  }
}
