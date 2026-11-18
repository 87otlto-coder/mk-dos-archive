import { readFile } from 'node:fs/promises';
import index from './spelunk-index.json' with { type: 'json' };
import { identify, sha, verified } from './engine.mts';

export const spriteFamilies = Object.freeze(Object.keys(index));
const object2Physical = 0xa0c54;

export function decodeSprite(encoded: Buffer, width: number, height: number) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
      width > 320 || height > 320 || width * height > 64_000)
    throw new Error('Invalid native sprite dimensions');
  const indices = Buffer.alloc(width * height);
  const opacity = Buffer.alloc(indices.length);
  let cursor = 0;
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width;) {
      if (cursor + 4 > encoded.length) throw new Error('Truncated native sprite command');
      const command = encoded.readUInt32LE(cursor);
      cursor += 4;
      const skip = Boolean(command & 1);
      const repeat = !skip && Boolean(command & 2);
      const count = skip ? command >>> 1 : repeat ? command >>> 10 : command >>> 2;
      if (count === 0 || column + count > width) throw new Error('Invalid native sprite row extent');
      const at = row * width + column;
      if (repeat) {
        indices.fill((command >>> 2) & 255, at, at + count);
      } else if (!skip) {
        const padded = (count + 3) & ~3;
        if (count > 64 || cursor + padded > encoded.length) throw new Error('Invalid native sprite literal extent');
        encoded.copy(indices, at, cursor, cursor + count);
        cursor += padded;
      }
      if (!skip) opacity.fill(1, at, at + count);
      column += count;
    }
  }
  if (cursor !== encoded.length) throw new Error('Unexpected bytes after native sprite');
  return { indices, opacity };
}

export async function sourceSprites(root: string, name: string) {
  if (!spriteFamilies.includes(name)) throw new Error(`Unsupported source sprite resource: ${name}`);
  const family = index[name as keyof typeof index];
  const executable = await identify(root);
  const exe = await verified(root, executable.file, executable.bytes, executable.sha256);
  const resource = await verified(root, name, family.bytes, family.sha256);
  const resourceId = exe.toString('latin1', 0xa0ef1, 0xa13a7).split('\0').indexOf(name.toUpperCase());
  if (resourceId < 0) throw new Error('Resource registry mismatch');
  const anchors = new Map<number, { descriptorPointerSiteObject2: number; sourceRecordObject1: number }>();
  if (name === 'bang.gra' || name === 'blood.gra') {
    const program = JSON.parse(await readFile(new URL(`./${name.slice(0, -4)}-program.json`, import.meta.url), 'utf8'));
    for (const anchor of program.paletteSourceAnchors) {
      const site = anchor.typedSourcePointerObject2 ?? anchor.typedPalettePointerSiteObject2;
      const sourceRecord = anchor.sourceRecordObject1 ?? anchor.sourcePaletteRecordObject1;
      if (site !== anchor.anchorDescriptorObject2 + 12 || exe.readUInt32LE(object2Physical + site) !== sourceRecord)
        throw new Error('Source descriptor palette pointer mismatch');
      anchors.set(anchor.anchorDescriptorObject2, {descriptorPointerSiteObject2: site, sourceRecordObject1: sourceRecord});
    }
  }
  const assets = family.records.map(([offset, endExclusive, descriptorObject2, width, height, x, y], ordinal) => {
    const physical = object2Physical + descriptorObject2;
    const packed = exe.readUInt32LE(physical + 8);
    if (exe.readUInt16LE(physical) !== width || exe.readUInt16LE(physical + 2) !== height ||
        exe.readInt16LE(physical + 4) !== x || exe.readInt16LE(physical + 6) !== y ||
        packed >>> 24 !== resourceId || (packed & 0xffffff) !== offset ||
        endExclusive <= offset || endExclusive > resource.length)
      throw new Error(`Source descriptor mismatch at ${descriptorObject2}`);
    const encoded = resource.subarray(offset, endExclusive);
    return {
      ...decodeSprite(encoded, width, height),
      metadata: {
        schema: 1, id: `mk2:sprite:${name}:${descriptorObject2.toString(16)}`, ordinal, width, height,
        descriptorLocalXY: [x, y], paletteSourcePointer: anchors.get(descriptorObject2) ?? null,
        source: { name, offset, endExclusive, sha256: family.sha256, bytes: family.bytes,
          descriptorObject2, descriptorPhysical: physical, descriptorBaseBytes: 12, resourceId,
          encodedSha256: sha(encoded), executable },
        compression: 'native little-endian DWORD row commands',
        evidence: 'VERIFIED STATIC', runtimePalette: 'UNKNOWN', runtimeTiming: 'UNKNOWN'
      }
    };
  });
  for (const plane of ['indices', 'opacity'] as const) {
    const observed = sha(Buffer.concat(assets.map(asset => Buffer.from(sha(asset[plane]), 'hex'))));
    if (observed !== family[plane]) throw new Error(`Independent ${plane} parity failed for ${name}`);
  }
  return assets;
}
