import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeFrames, intro, sha, writeAsset } from './engine.mts';
import { mountain, decodeMountain, mountainRelationships } from './mountain.mts';

import { diagnostic } from './preview.mts';

test('native LZW frame preserves index zero', () => {
  const codes = Array.from({length: 64000}, (_, i) => [256, i % 256]).flat();
  codes.push(257);
  const packed = Buffer.alloc(Math.ceil(codes.length * 9 / 8));
  for (let i = 0; i < codes.length; i++) {
    const bit = i * 9;
    packed[bit >> 3] |= codes[i] << (bit % 8);
    packed[(bit >> 3) + 1] |= codes[i] >> (8 - bit % 8);
  }
  const blocks = [Buffer.from([64, 1, 200, 0, 8])];
  for (let i = 0; i < packed.length; i += 255) {
    const part = packed.subarray(i, i + 255);
    blocks.push(Buffer.from([part.length]), part);
  }
  const data = Buffer.concat([...blocks, Buffer.from([0])]);
  assert.deepEqual(decodeFrames(data, 0, 1, true)[0].index,
    Uint8Array.from({length: 64000}, (_, i) => i % 256));
  assert.throws(() => decodeFrames(data.subarray(0, -2), 0, 1, true), /truncated.*subblock/);
});

const root = process.env.MK2_DOS_FIXTURE;
test('original intro exports match independent hashes and boundaries', {skip: !root}, async () => {
  const reference = JSON.parse(await readFile(new URL('../scripts/fixtures/mk2-p12-intro-independent-parity.json', import.meta.url), 'utf8'));
  const output = await mkdtemp(join(tmpdir(), 'mk-headless-'));
  try {
    for (const resource of Object.keys(reference.resources)) {
      const expected = reference.frames.filter(frame => frame.resource === resource);
      const assets = await intro(root!, resource);
      assert.equal(assets.length, expected.length);
      for (const [i, asset] of assets.entries()) {
        const frame = expected[i];
        const source = asset.metadata.source;
        const rendered = diagnostic(asset);
        assert.equal(sha(rendered.rgba), frame.rgbaSha256);
        assert.equal(sha(rendered.mapped), frame.paletteKnownMaskSha256);
        assert.equal(sha(asset.indices), frame.indicesSha256);
        assert.equal(source.sourceFrameStart, frame.frameHeaderStart);
        assert.equal(source.compressedStart, frame.compressedStart);
        assert.equal(source.compressedEnd, frame.compressedEnd);
        assert.equal(source.terminatedByZeroSubblock, frame.terminatedByZeroSubblock);
        const path = join(output, resource + i);
        await writeAsset(path, asset, rendered);
        const pam = await readFile(join(path, 'preview.pam'));
        const headerEnd = pam.indexOf('ENDHDR\n') + 7;
        assert.ok(headerEnd > 7);
        assert.equal(sha(pam.subarray(headerEnd)), frame.rgbaSha256);
        assert.equal(sha(await readFile(join(path, 'diagnostic-palette-mapped.bin'))), frame.paletteKnownMaskSha256);
        assert.equal(sha(await readFile(join(path, 'indices.bin'))), frame.indicesSha256);
        assert.deepEqual(await readFile(join(path, 'opacity.bin')), Buffer.alloc(64000, 1));
        await assert.rejects(writeAsset(path, asset), {code: 'EEXIST'});
      }
    }
  } finally {
    await rm(output, {recursive: true});
  }
});

test('Mountain rejects malformed descriptor or resource evidence', () => {
  assert.throws(() => decodeMountain(new Uint8Array(861133), new Uint8Array()), /filename pool/);
});

test('original Mountain graphics match independent pixels, masks and extents', {skip: !root}, async () => {
  const reference = JSON.parse(await readFile(new URL('../scripts/fixtures/mk2-p13-mountain-independent-parity.json', import.meta.url), 'utf8'));
  const assets = await mountain(root!);
  assert.equal(assets.length, reference.records.length);
  for (const [i, asset] of assets.entries()) {
    const record = reference.records[i];
    assert.equal(sha(diagnostic(asset).rgba), record.diagnosticRgbaSHA256);
    assert.ok(diagnostic(asset).mapped.every(value => value === 0));
    assert.equal(sha(asset.indices), record.pixelSHA256);
    assert.equal(sha(asset.opacity), record.maskSHA256);
    assert.equal(asset.metadata.source.offset, record.offset);
    assert.equal(asset.metadata.source.endExclusive, record.endExclusive);
    assert.equal(asset.metadata.source.descriptorPhysical, record.descriptorPhysical);
    assert.equal(asset.metadata.selectedBySourceTable, record.selected);
    assert.deepEqual(asset.metadata.commandCounts, record.commands);
  }
});

test('Mountain relationships match independent conditional source orders', {skip: !root}, async () => {
  const reference = JSON.parse(await readFile(new URL('../scripts/fixtures/mk2-p13-mountain-independent-parity.json', import.meta.url), 'utf8'));
  const result = await mountainRelationships(root!);
  assert.deepEqual(result.variants.map(variant => variant.tokens), reference.conditionalVariants);
  for (const variant of result.variants) {
    assert.equal(variant.assetIds[variant.tokens.indexOf(14)], 'mk2:mountain:13');
    assert.ok(!variant.assetIds.includes(result.adjacentUnselectedAssetId));
  }
  assert.equal(result.runtimePlaybackOrder, 'UNKNOWN');
  assert.deepEqual(await mountainRelationships(root!), result);
});

const cli = fileURLToPath(new URL('./cli.mts', import.meta.url));
const run = (...args: string[]) => spawnSync(process.execPath, [cli, ...args], {encoding: 'utf8'});

test('CLI rejects unsupported commands and missing input', () => {
  assert.equal(run('bogus', '.', 'probe.gra').status, 1);
  assert.equal(run('identify', '.').status, 1);
  assert.equal(run('extract', '.', 'probe.gra', '-1', 'output').status, 1);
});

test('standalone CLI preserves canonical output across separate executions', {skip: !root}, async () => {
  const out = await mkdtemp(join(tmpdir(), 'mk-cli-'));
  try {
    const command = (...args: string[]) => {
      const result = run(args[0], root!, ...args.slice(1));
      assert.equal(result.status, 0, result.stderr);
      return result.stdout;
    };
    assert.equal(JSON.parse(command('identify')).game, 'MK2 DOS');
    assert.equal(JSON.parse(command('list', 'probe.gra')).length, 30);
    assert.equal(JSON.parse(command('relationships', 'mountain.gra')).variants.length, 6);
    const first = join(out, 'first'), second = join(out, 'second');
    command('preview', 'acclaim.gra', '0', first);
    command('preview', 'acclaim.gra', '0', second);
    for (const name of ['indices.bin', 'opacity.bin', 'preview.pam', 'diagnostic-palette-mapped.bin', 'metadata.json'])
      assert.deepEqual(await readFile(join(first, name)), await readFile(join(second, name)));
    command('extract', 'mountain.gra', '14', join(out, 'mountain'));
    assert.equal((await readFile(join(out, 'mountain', 'indices.bin'))).length, 1435);
    assert.equal(run('preview', root!, 'acclaim.gra', '0', first).status, 1);
    assert.equal(run('extract', root!, 'mountain.gra', '15', join(out, 'unknown')).status, 1);
  } finally {
    await rm(out, {recursive: true});
  }
});
