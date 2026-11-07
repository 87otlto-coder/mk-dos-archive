import { type Asset, hash, utf8 } from './model';
import { buildStoredZip } from '../research/researchArtifactDownloads';
import { encodeOriginalEffectRgbaPngO177 } from '../../games/mk2/research/stageSourcePngO177';

const tombSha = 'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613';
const screenshotSha256 = '5cd8f5ed5d75a4098df714b45a24ba2d7fe6ab43881add8e9c1043aa2b8e9ec9';
// O123 HOLD and SKY_HOLD, with exclusive right/bottom bounds in the 637 x 397 capture.
const layers = [
  { name: 'architecture', setup: 0x1737c, width: 850, height: 224, dx: 267, dy: 57, count: 2650,
    regions: [[0,115,85,158],[390,514,85,158],[125,237,85,158],[520,632,85,158],[0,115,160,199],[520,632,160,199]],
    rgba: '0df15cdc569fc9c56aaf2763fa339f9a75e5a21306ca03f8307eb1573d93a5ca',
    indices: '6824ba6ce49c6eae7a5552b518975876f3ee01b8eb1de52ff9fe4507b9f3a553',
    mask: '5fc74b83d16954f7abcc48a76120ba9495642a9c1a32bdfbf5a06eddba844dfa' },
  { name: 'sky', setup: 0x173b2, width: 320, height: 80, dx: 2, dy: -47, count: 823,
    regions: [[295,350,158,190],[350,395,155,190]],
    rgba: 'f2992d2ebef408ef600f50618685dbd45e1a5399b1b6c3e6466589f0d5b3edf7',
    indices: '7415b4c4456e9daa9e78c55b7e33cd0658e8e006fe165c8c308192c26c5d7de2',
    mask: '81f435abcb1ae9bfe8ee4b7499b726a2ea63fd0f28f1d13392d8c780c2d7fe2a' },
] as const;

function requireEvidence(ok: unknown, reason: string): asserts ok {
  if (!ok) throw new Error('P59 Tomb: ' + reason);
}

// Each output pixel (x,y) samples capture pixel (2x,2y). A zero mask means unsampled.
export function projectTombSamples(width: number, height: number, rgba: Uint8Array, indices: Uint8Array,
  mask: Uint8Array, regions: readonly (readonly number[])[], dx: number, dy: number) {
  requireEvidence(mask.length === width*height && indices.length === mask.length && rgba.length === mask.length*4, 'layer geometry');
  const sampled = new Uint8Array(319*199);
  const values = new Uint8Array(sampled.length);
  const pixels = new Uint8Array(sampled.length*4);
  let count = 0;
  for (const [left,right,top,bottom] of regions) {
    requireEvidence(left >= 0 && top >= 0 && right <= 637 && bottom <= 397 && left < right && top < bottom, 'capture bounds');
    for (let y = Math.ceil(top/2); y*2 < bottom; y++) {
      for (let x = Math.ceil(left/2); x*2 < right; x++) {
        const sx = x+dx, sy = y+dy;
        if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
        const src = sy*width+sx, dst = y*319+x;
        if (!mask[src] || sampled[dst]) continue;
        sampled[dst] = 1;
        values[dst] = indices[src];
        pixels.set(rgba.subarray(src*4,src*4+4),dst*4);
        count++;
      }
    }
  }
  return { sampled, values, pixels, count };
}

export async function buildTombWitnessPackage(assets: Asset[]) {
  const files = [];
  const records = [];
  for (const layer of layers) {
    const id = 'mk2-stage-setup:tomb:object2_' + layer.setup.toString(16).toUpperCase();
    const matches = assets.filter(a => a.id === id);
    requireEvidence(matches.length === 1, 'expected one ' + id);
    const [a] = matches;
    const { indices, mask } = a.metadata;
    requireEvidence(a.source.sha256 === tombSha && a.source.path === 'tomb.gra' && a.source.offset === 0 &&
      a.source.length === 106784 && a.metadata.setupObject2Offset === layer.setup &&
      a.width === layer.width && a.height === layer.height, 'source identity or geometry');
    requireEvidence(a.metadata.runtimeScreenPlacementKnown === false && a.metadata.finalDrawOrderKnown === false &&
      a.metadata.nativeAnimationTimingKnown === false, 'runtime qualification');
    requireEvidence(a.rgba && indices instanceof Uint8Array && mask instanceof Uint8Array, 'missing planes');
    requireEvidence(await hash(a.rgba) === layer.rgba && await hash(indices) === layer.indices &&
      await hash(mask) === layer.mask, 'independent O122 source plane digests');
    const p = projectTombSamples(a.width, a.height, a.rgba, indices, mask, layer.regions, layer.dx, layer.dy);
    requireEvidence(p.count === layer.count, 'O123 held-out sample count');
    files.push({name: layer.name+'.png', bytes: encodeOriginalEffectRgbaPngO177(319,199,p.pixels)},
      {name: layer.name+'.indices.bin', bytes: p.values}, {name: layer.name+'.mask.bin', bytes: p.sampled});
    records.push({ ...layer, sourceAssetId: id });
  }
  const manifest = { format: 'mk2-p59-tomb-heldout-v1', screenshotSha256, tombSha256: tombSha,
    exeSha256: 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',
    source: 'O121/O122 setup-local planes and O123 independent screenshot registration',
    coordinateModel: '319 x 199 row-major samples. Output (x,y) = capture (2x,2y), source (x+dx,y+dy). Regions [left,right,top,bottom) in capture pixels.',
    qualification: 'Mask 1 marks an opaque held-out sample. Other pixels are transparent. Camera, full draw order, timing and runtime DAC ownership remain unknown.',
    layers: records };
  files.push({ name: 'manifest.json', bytes: utf8.encode(JSON.stringify(manifest,null,2)) });
  return {name: 'MK2_P59_TOMB_SCREENSHOT_SAMPLES.zip', bytes: buildStoredZip(files)};
}
