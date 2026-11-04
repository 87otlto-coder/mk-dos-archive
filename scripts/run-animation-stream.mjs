// Direct read-only smoke against a user-supplied installation; never executes or patches the game.
// Usage: node scripts/run-animation-stream.mjs /path/to/mk1 /path/to/output
import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = process.argv[2];
const destination = process.argv[3];
if (!fixture || !destination) throw new Error('Usage: node scripts/run-animation-stream.mjs MK1_DIRECTORY OUTPUT_DIRECTORY');
const fixtureRoot = resolve(fixture);
const outputRoot = resolve(destination);
const temp = await mkdtemp(join(tmpdir(), 'mk1-shang-morph-'));

try {
  const entry = `
    export * from './src/games/mk1/research/watcomDataImagePaletteGroundTruth';
    export * from './src/games/mk1/research/kanoPaletteSelectionReferenceGraph';
    export * from './src/games/mk1/research/kanoPaletteSelectionSemantics';
    export * from './src/games/mk1/research/paletteSetupTransferSemantics';
    export * from './src/games/mk1/research/paletteRoundTrip';
    export * from './src/games/mk1/research/fighterPaletteOwnership';
    export * from './src/games/mk1/research/opponentAccessHarness';
    export * from './src/games/mk1/research/shangMorphSelection';
    export * from './src/games/mk1/research/animationStreamGroundTruth';
  `;
  await build({ stdin: { contents: entry, resolveDir: root, loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', outfile: join(temp, 'research.mjs'), logLevel: 'warning' });
  const api = await import(pathToFileURL(join(temp, 'research.mjs')).href);
  const files = [];
  async function walk(relative = '') {
    for (const item of await readdir(join(fixtureRoot, relative), { withFileTypes: true })) {
      const path = relative ? `${relative}/${item.name}` : item.name;
      if (item.isDirectory()) await walk(path);
      else if (item.isFile()) files.push({ path, name: item.name, extension: item.name.split('.').pop().toUpperCase(), size: (await stat(join(fixtureRoot, path))).size });
    }
  }
  await walk();
  const buffers = new Map();
  const source = {
    directoryName: fixtureRoot, isSynthetic: false,
    async listRecursive() { return files; },
    async readSlice(path, offset, length) {
      if (!buffers.has(path)) buffers.set(path, await readFile(join(fixtureRoot, path)));
      const data = buffers.get(path);
      return new Uint8Array(data.subarray(offset, offset + length));
    },
  };

  console.log('Running authentic fixture chain through 1E.3O.1 animation stream / morph frame composition');
  const gt = await api.executeWatcomDataImagePaletteGroundTruth(source);
  const graph = await api.executeKanoPaletteSelectionReferenceGraph(source, { groundTruthReport: gt });
  const semantics = await api.executeKanoPaletteSelectionSemantics(source, { referenceGraphReport: graph });
  const transfer = await api.executePaletteSetupTransferSemantics(source, { selectionSemanticsReport: semantics });
  const roundTrip = await api.executePaletteRoundTrip(source, { groundTruthReport: gt, transferReport: transfer });
  const ownership = await api.executeFighterPaletteOwnershipQualification(source, { referenceGraphReport: graph, selectionSemanticsReport: semantics, roundTripReport: roundTrip });
  const access = await api.executeOpponentAccessHarnessQualification(source, { selectionSemanticsReport: semantics, roundTripReport: roundTrip });
  const morph = await api.executeShangMorphSelectionQualification(source, { ownershipReport: ownership, opponentAccessReport: access });
  const animation = await api.executeAnimationStreamGroundTruth(source, { shangMorphReport: morph });
  const artifact = await api.createMK1AnimationStreamGroundTruthExport(animation);

  assert.equal(morph.status, 'SUCCESS');
  assert.equal(animation.status, 'SUCCESS');
  assert.equal(animation.decision.verdict, 'MORPH_ANIMATION_STREAM_AND_FRAME_COMPOSITION_ESTABLISHED');
  assert.equal(animation.executor.commands.length, 7);
  assert.deepEqual(animation.executor.commands.map(command => command.opcode), [0,1,2,3,4,5,6]);
  assert.equal(animation.decision.mframewFrameDwellContractEstablished, true);
  assert.equal(animation.targets.length, 8);
  assert.equal(animation.targets.every(target => target.frames.length === 3 && target.frameRecords.length === 3), true);
  assert.equal(animation.targets.flatMap(target => target.frames).length, 24);
  assert.equal(animation.decision.all24SpritesDecodeAgainstEmpGra, true);
  assert.equal(animation.decision.all24SpritesFitTransitionPaletteWithoutIndex0Dependency, true);
  assert.equal(animation.decision.runtimePatchRequired, false);


  await mkdir(outputRoot, { recursive: true });
  await writeFile(join(outputRoot, 'mk1_animation_stream_ground_truth_direct.json'), JSON.stringify(artifact, null, 2));
  console.log(JSON.stringify({
    status: animation.status,
    checks: artifact.validation.checks.length,
    commands: animation.executor.commands.map(command => `${command.opcode}:${command.name}`),
    targets: animation.targets.map(target => `${target.targetName}:${target.frames.map(frame => frame.decode.checksum).join(',')}`),
    goroEvents: animation.targets.find(target => target.targetName === 'GORO')?.events.map(event => event.kind),
    output: outputRoot,
  }, null, 2));
} finally {
  await rm(temp, { recursive: true, force: true });
}
