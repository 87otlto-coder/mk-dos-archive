import { textAt, view } from './model';

/** Bounded IFF PBM/ILBM reader. Unsupported display modes fail explicitly. */
export function decodeIff(bytes: Uint8Array) {
  const v = view(bytes), type = textAt(bytes, 8, 4);
  if (textAt(bytes, 0, 4) !== 'FORM' || !['PBM ', 'ILBM'].includes(type) || bytes.length < 12) throw new Error('Not an IFF bitmap');
  const end = v.getUint32(4) + 8;
  if (end !== bytes.length) throw new Error('IFF FORM length mismatch');
  const chunks = new Map<string, Uint8Array>();
  for (let p = 12; p < end;) {
    if (p + 8 > end) throw new Error('Truncated IFF chunk');
    const n = v.getUint32(p + 4), tag = textAt(bytes, p, 4);
    if (p + 8 + n + (n & 1) > end) throw new Error('IFF chunk exceeds FORM');
    if (chunks.has(tag) && ['BMHD', 'CMAP', 'BODY'].includes(tag)) throw new Error('Duplicate IFF bitmap chunk');
    chunks.set(tag, bytes.subarray(p + 8, p + 8 + n)); p += 8 + n + (n & 1);
  }
  const header = chunks.get('BMHD'), palette = chunks.get('CMAP'), body = chunks.get('BODY');
  if (!header || header.length !== 20 || !palette || palette.length % 3 || palette.length > 768 || !body) throw new Error('Missing/invalid IFF bitmap chunks');
  const h = view(header), width = h.getUint16(0), height = h.getUint16(2), planes = header[8], masking = header[9], compression = header[10], transparent = h.getUint16(12);
  if (!width || !height || width * height > 16000000 || planes < 1 || planes > 8 || masking > 2 || compression > 1) throw new Error('Unsupported IFF dimensions/encoding');
  const camg = chunks.get('CAMG');
  if (camg && (view(camg).getUint32(0) & 0x880)) throw new Error('HAM/EHB IFF is not yet supported');
  if (type === 'PBM ' && masking === 1) throw new Error('PBM stencil not supported');
  // The supplied DOS PBMs store exactly width pixels per row, including odd widths.
  const annotation = chunks.get('ANNO');
  const byteAlignedGws = type === 'ILBM' && annotation && textAt(annotation, 0, 16) === 'GWS/Windows 1.1n';
  const stride = type === 'PBM ' ? width : byteAlignedGws ? Math.ceil(width / 8) : Math.ceil(width / 16) * 2;
  const rows = type === 'PBM ' ? 1 : planes + (masking === 1 ? 1 : 0);
  const indices = new Uint8Array(width * height), mask = new Uint8Array(width * height); let pos = 0;
  const readRow = () => {
    const out = new Uint8Array(stride); let x = 0;
    while (x < stride) {
      if (pos >= body.length) throw new Error('Truncated IFF BODY');
      if (!compression) { if (pos + stride > body.length) throw new Error('Truncated IFF row'); out.set(body.subarray(pos, pos + stride)); pos += stride; break; }
      const op = body[pos++]; if (op === 128) continue;
      const count = op < 128 ? op + 1 : 257 - op;
      if (x + count > stride) throw new Error('IFF ByteRun crosses row');
      if (op < 128) { if (pos + count > body.length) throw new Error('IFF literal truncated'); out.set(body.subarray(pos, pos + count), x); pos += count; }
      else { if (pos >= body.length) throw new Error('IFF repeat truncated'); out.fill(body[pos++], x, x + count); }
      x += count;
    }
    return out;
  };
  for (let y = 0; y < height; y++) {
    const row = Array.from({ length: rows }, readRow);
    for (let x = 0; x < width; x++) {
      const p = y * width + x; let color = 0;
      if (type === 'PBM ') color = row[0][x];
      else for (let plane = 0; plane < planes; plane++) color |= ((row[plane][x >> 3] >> (7 - (x & 7))) & 1) << plane;
      if (color * 3 + 2 >= palette.length) throw new Error('IFF pixel outside explicit CMAP');
      indices[p] = color; mask[p] = masking === 2 ? +(color !== transparent) : masking === 1 ? (row[planes][x >> 3] >> (7 - (x & 7))) & 1 : 1;
    }
  }
  // A trailing ByteRun no-op is legal; arbitrary bytes are not silently discarded.
  const trailingBodyBytes = body.slice(pos);
  if (trailingBodyBytes.some(x => x !== 128) && !(trailingBodyBytes.length === 1 && trailingBodyBytes[0] === 0)) throw new Error('Unconsumed IFF BODY bytes');
  const rgba = new Uint8Array(width * height * 4);
  for (let p = 0; p < indices.length; p++) { rgba.set(palette.subarray(indices[p] * 3, indices[p] * 3 + 3), p * 4); rgba[p * 4 + 3] = mask[p] * 255; }
  return { width, height, rgba, indices, mask, type, planes, masking, compression, rowLayout: type === 'PBM ' ? 'DOS_PBM_EXACT_WIDTH' : byteAlignedGws ? 'GWS_BYTE_ALIGNED_PLANES' : 'IFF_WORD_ALIGNED_PLANES', bodyConsumed: pos, trailingBodyBytes: [...trailingBodyBytes], palette: palette.slice() };
}
