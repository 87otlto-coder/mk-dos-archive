import { textAt, view } from '../../core/assets/model';

export interface MfilChunk { tag: string; name: string; offset: number; payloadOffset: number; size: number; checksum: number; bytes: Uint8Array }
/** Independently derived from the supplied DOS MFIL files; preserves header bytes. */
export function parseMfil(bytes: Uint8Array): MfilChunk[] {
  const v = view(bytes);
  if (bytes.length < 12 || textAt(bytes, 0, 4) !== 'MFIL') throw new Error('Not MFIL');
  const count = v.getUint16(4, true), directoryOffset = v.getUint32(8, true), chunks: MfilChunk[] = [];
  let p = 12;
  while (p < bytes.length) {
    if (p + 32 > bytes.length) throw new Error('Truncated MFIL header');
    const tag = textAt(bytes, p, 4), name = textAt(bytes, p + 6, 8).replace(/\0.*$/, '').trimEnd();
    const size = v.getUint32(p + 16, true), decodedSize = v.getUint32(p + 20, true), flags = v.getUint32(p + 24, true), checksum = v.getUint32(p + 28, true);
    if (!/^[A-Z]{4}$/.test(tag) || size > bytes.length - p - 32) throw new Error('Invalid MFIL chunk boundary');
    if (flags !== 0 || size !== decodedSize) throw new Error('Unsupported MFIL compression');
    const payload = bytes.subarray(p + 32, p + 32 + size);
    if ((payload.reduce((a, b) => a + b, 0) >>> 0) !== checksum) throw new Error(`MFIL checksum failed: ${name}`);
    chunks.push({ tag, name, offset: p, payloadOffset: p + 32, size, checksum, bytes: payload }); p += 32 + size;
  }
  const dir = chunks.at(-1);
  if (!dir || dir.tag !== 'CDIR' || dir.offset !== directoryOffset || chunks.length !== count + 1 || dir.size !== count * 32) throw new Error('MFIL directory/count mismatch');
  const dv = view(dir.bytes);
  for (let i = 0; i < count; i++) {
    const c = chunks[i], q = i * 32;
    if (textAt(dir.bytes, q, 4) !== c.tag || textAt(dir.bytes, q + 6, 8).replace(/\0.*$/, '').trimEnd() !== c.name || dv.getUint32(q + 16, true) !== c.offset || dv.getUint32(q + 20, true) !== c.size) throw new Error(`MFIL directory entry ${i} mismatch`);
  }
  return chunks;
}
