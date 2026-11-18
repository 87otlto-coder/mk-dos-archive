import type { Asset } from './engine.mts';

export function diagnostic(asset: Asset) {
  const { width, height } = asset.metadata;
  const palette = asset.metadata.palette as { dac6?: number[] } | undefined;
  const dac6 = palette?.dac6;
  const rgba = Buffer.alloc(asset.indices.length * 4);
  const mapped = Buffer.alloc(asset.indices.length);
  for (const [pixel, index] of asset.indices.entries()) {
    const at = pixel * 4;
    if (dac6 && index > 0 && index * 3 <= dac6.length) {
      for (let channel = 0; channel < 3; channel++)
        rgba[at + channel] = Math.floor(dac6[(index - 1) * 3 + channel] * 255 / 63);
      mapped[pixel] = 1;
    } else if (dac6) {
      rgba[at] = rgba[at + 2] = 255;
    } else {
      rgba.fill(Math.floor(index * 255 / 96), at, at + 3);
    }
    rgba[at + 3] = asset.opacity[pixel] ? 255 : 0;
  }
  const header = Buffer.from(`P7\nWIDTH ${width}\nHEIGHT ${height}\nDEPTH 4\nMAXVAL 255\nTUPLTYPE RGB_ALPHA\nENDHDR\n`);
  return {
    rgba, mapped, pam: Buffer.concat([header, rgba]),
    mode: dac6 ? 'conditional one-based source DAC6' : 'index intensity normalized by cohort maximum 96',
    runtimeFidelity: 'UNKNOWN'
  };
}
