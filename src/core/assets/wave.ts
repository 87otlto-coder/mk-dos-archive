import { textAt, view } from './model';
export function parseWave(bytes: Uint8Array) {
  const v = view(bytes);
  if (bytes.length < 12 || textAt(bytes, 0, 4) !== 'RIFF' || textAt(bytes, 8, 4) !== 'WAVE' || v.getUint32(4, true) + 8 !== bytes.length) throw new Error('Invalid RIFF/WAVE size');
  let fmt: Uint8Array | undefined, data: Uint8Array | undefined;
  for (let p = 12; p < bytes.length;) {
    if (p + 8 > bytes.length) throw new Error('Truncated WAVE chunk');
    const n = v.getUint32(p + 4, true), tag = textAt(bytes, p, 4), end = p + 8 + n;
    if (end > bytes.length) throw new Error('WAVE chunk outside RIFF');
    if (tag === 'fmt ') fmt = bytes.subarray(p + 8, end);
    if (tag === 'data') data = bytes.subarray(p + 8, end);
    p = end + (n & 1);
  }
  if (!fmt || fmt.length < 16 || !data) throw new Error('Missing WAVE fmt/data');
  const f = view(fmt), encoding = f.getUint16(0, true), channels = f.getUint16(2, true), sampleRate = f.getUint32(4, true), byteRate = f.getUint32(8, true), blockAlign = f.getUint16(12, true), bits = f.getUint16(14, true);
  if (!channels || channels > 8 || !sampleRate || !blockAlign || !byteRate) throw new Error('Invalid WAVE format');
  if (encoding === 1 && (blockAlign !== channels * bits / 8 || byteRate !== sampleRate * blockAlign || data.length % blockAlign)) throw new Error('PCM layout mismatch');
  return { encoding, channels, sampleRate, byteRate, blockAlign, bits, dataLength: data.length, duration: data.length / byteRate };
}
export function wavePcm(data: Uint8Array, sampleRate: number, channels = 1, bits = 8) {
  if (!Number.isInteger(sampleRate) || sampleRate < 1000 || sampleRate > 192000 || ![8,16].includes(bits) || ![1,2].includes(channels) || data.length % (channels * bits / 8)) throw new Error('Invalid PCM settings');
  const bytes = new Uint8Array(44 + data.length + (data.length & 1)), v = view(bytes), enc = new TextEncoder();
  bytes.set(enc.encode('RIFF'),0); v.setUint32(4,bytes.length-8,true); bytes.set(enc.encode('WAVEfmt '),8); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,channels,true); v.setUint32(24,sampleRate,true); v.setUint32(28,sampleRate*channels*bits/8,true); v.setUint16(32,channels*bits/8,true); v.setUint16(34,bits,true); bytes.set(enc.encode('data'),36); v.setUint32(40,data.length,true); bytes.set(data,44); return bytes;
}
