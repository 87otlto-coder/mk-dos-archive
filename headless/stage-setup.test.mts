import assert from 'node:assert/strict';
import {test} from 'node:test';
import {stageSetup} from './stage-setup.mts';
import cases from './stage-reference.json' with {type: 'json'};

const root = process.env.MK2_DOS_FIXTURE;
const fields = 'slotObject2 entryObject2 kind setupObject2 originSignedXY size controlCount objectListHeadObject2 horizontalAccumulatorObject2 verticalAccumulatorObject2 initialHorizontalInteger selectionMaskObject2'.split(' ');
test('stage parser rejects unsupported stage and mode', async () => {
  await assert.rejects(stageSetup('.', 'constructor', '2'), /Stage requires/);
  await assert.rejects(stageSetup('.', 'tomb', '3'), /Stage requires/);
});
test('nine stage selectors match independently replayed P90 initializer and draw records', {skip: !root}, async () => {
  for (const [name, mode, pointer, digest, header, entries, centers, draws] of cases) {
    const actual = await stageSetup(root!, name, mode);
    assert.equal(actual.rootObject2, pointer);
    assert.equal(actual.rootSpanSha256, digest);
    assert.deepEqual(actual.headerSignedWords, header);
    assert.deepEqual(actual.setupBindings.filter(b => b.kind !== 'untouched_default')
      .map(b => fields.map(key => b[key] ?? null)), entries);
    assert.deepEqual(actual.centerOverrides, centers);
    assert.deepEqual(actual.drawCommands, draws);
    assert.equal(actual.setupBindings.length, 8);
    assert.equal(actual.runtime.palette, 'UNKNOWN');
  }
  const portal = await stageSetup(root!, 'portal', '2');
  assert.equal(portal.setupBindings[0].kind, 'disabled_sentinel');
  assert.equal(portal.setupBindings[1].setupObject2, 0x16514);
  assert.equal(portal.setupBindings[1].paletteSourcePointers[2].recordPhysical, 0x891e0);
});
