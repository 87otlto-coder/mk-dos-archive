import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decodeSprite, sourceSprites } from './source-sprites.mts';

test('encoded zero is opaque, skipped zero is transparent', () => {
  const encoded = Buffer.alloc(8);
  encoded.writeUInt32LE(3, 0);
  encoded.writeUInt32LE(1026, 4);
  const {indices, opacity} = decodeSprite(encoded, 2, 1);
  assert.deepEqual([...indices], [0, 0]);
  assert.deepEqual([...opacity], [0, 1]);
  assert.throws(() => decodeSprite(encoded, 1, 1), /Unexpected bytes/);
  assert.throws(() => decodeSprite(encoded.subarray(0, 7), 2, 1), /Truncated/);
  assert.throws(() => decodeSprite(encoded, 3, 1), /Truncated/);
  const literal = Buffer.from([4, 0, 0, 0, 42]);
  assert.throws(() => decodeSprite(literal, 1, 1), /literal extent/);
  assert.throws(() => decodeSprite(Buffer.from([5, 0, 0, 0]), 1, 1), /row extent/);
});

const root = process.env.MK2_DOS_FIXTURE;
for (const [name, count] of Object.entries({
  armory: 12, forest: 7, soul: 17, fireskel: 12, bang: 101, suck: 83, blood: 178
})) {
  test(`${name} original indexed and opacity reference parity`, {skip: !root}, async () => {
    const sprites = await sourceSprites(root!, `${name}.gra`);
    assert.equal(sprites.length, count);
    assert.equal(sprites.filter(sprite => sprite.metadata.paletteSourcePointer !== null).length,
      name === 'bang' ? 12 : name === 'blood' ? 22 : 0);
    assert.equal(new Set(sprites.map(x => x.metadata.id)).size, count);
    assert.equal(new Set(sprites.map(x => x.metadata.source.offset)).size, count);
  });
}
