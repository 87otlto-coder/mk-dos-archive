import { spawnSync } from 'node:child_process';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sourceProgram } from './source-program.mts';

const root = process.env.MK2_DOS_FIXTURE;
test('all original source programs retain reference and control semantics', {skip: !root}, async () => {
  const [armory, forest, soul, fire, bang, suck, blood] = await Promise.all(
    ['armory','forest','soul','fireskel','bang','suck','blood'].map(name => sourceProgram(root!, name + '.gra')));
  assert.equal(armory.programs[0].entries.length, 12);
  const order = forest.programs[0].entries.map(entry => entry.assetId);
  const unique = [...new Set(order)];
  assert.deepEqual(order.map(id => unique.indexOf(id)), [0,1,2,3,4,5,6,5,6,5,6,5,6,5,6,4,3,2,1,0]);
  assert.deepEqual(soul.programs.map(list => [list.entries.length, list.control.kind]), [[3,'rewind'],[14,'stop']]);
  assert.deepEqual(fire.programs.map(list => list.entries.length), [6,6]);
  assert.equal(bang.programs.length, 11);
  assert.deepEqual(bang.secondaryGroups.map(group => group.records.length), [6,1,8]);
  assert.equal(bang.paletteSourceAnchors.length, 12);
  assert.equal(new Set(suck.selectorSlots.map(slot => slot.sourceGroupObject2)).size, 9);
  assert.equal(suck.selectorSlots.length, 12);
  assert.equal(blood.programs.length, 18);
  assert.deepEqual(blood.programs.filter(list => list.control.targetOrdinal > 0)
    .map(list => [list.entries.length, list.control.targetOrdinal]), [[18,6],[14,7]]);
  assert.equal(blood.entrySelector.variantEntryIndices.length, 4);
  assert.equal(blood.paletteSourceAnchors.length, 22);
  assert.equal(blood.structuralOnlyLists.length, 5);
  assert.equal(blood.runtime.timing, 'UNKNOWN');
});
test('unsupported program refuses without opening a fixture', async () => {
  await assert.rejects(sourceProgram('.', '../blood.gra'), /Unsupported/);
});

test('new CLI relationships and sprite export are deterministic and refuse overwrite', {skip: !root}, async () => {
  const cli = fileURLToPath(new URL('./cli.mts', import.meta.url));
  const run = (...args: string[]) => spawnSync(process.execPath, [cli, args[0], root!, ...args.slice(1)], {encoding: 'utf8'});
  const directory = await mkdtemp(join(tmpdir(), 'mk-source-program-'));
  try {
    const report = run('relationships', 'blood.gra');
    assert.equal(report.status, 0, report.stderr);
    assert.equal(report.stdout, run('relationships', 'blood.gra').stdout);
    assert.equal(JSON.parse(report.stdout).programs.length, 18);
    const listings = run('list', 'forest.gra');
    assert.equal(listings.status, 0, listings.stderr);
    assert.equal(JSON.parse(listings.stdout).length, 7);
    for (const folder of ['first', 'second']) {
      const result = run('preview', 'blood.gra', '0', join(directory, folder));
      assert.equal(result.status, 0, result.stderr);
    }
    for (const name of ['indices.bin', 'opacity.bin', 'metadata.json', 'preview.pam', 'diagnostic-palette-mapped.bin'])
      assert.deepEqual(await readFile(join(directory, 'first', name)), await readFile(join(directory, 'second', name)));
    assert.equal(run('preview', 'blood.gra', '0', join(directory, 'first')).status, 1);
    assert.equal(run('extract', 'blood.gra', '178', join(directory, 'missing')).status, 1);
  } finally {
    await rm(directory, {recursive: true});
  }
});
