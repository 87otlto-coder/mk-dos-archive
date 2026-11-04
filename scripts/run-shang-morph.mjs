// Direct read-only smoke against a user-supplied installation; never executes or patches the game.
// Usage: node scripts/run-shang-morph.mjs /path/to/mk1 /path/to/output
import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = process.argv[2];
const destination = process.argv[3];
if (!fixture || !destination) throw new Error('Usage: node scripts/run-shang-morph.mjs MK1_DIRECTORY OUTPUT_DIRECTORY');
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

  console.log('Running authentic fixture chain through 1E.3N.4 Shang morph selection');
  const gt = await api.executeWatcomDataImagePaletteGroundTruth(source);
  const graph = await api.executeKanoPaletteSelectionReferenceGraph(source, { groundTruthReport: gt });
  const semantics = await api.executeKanoPaletteSelectionSemantics(source, { referenceGraphReport: graph });
  const transfer = await api.executePaletteSetupTransferSemantics(source, { selectionSemanticsReport: semantics });
  const roundTrip = await api.executePaletteRoundTrip(source, { groundTruthReport: gt, transferReport: transfer });
  const ownership = await api.executeFighterPaletteOwnershipQualification(source, { referenceGraphReport: graph, selectionSemanticsReport: semantics, roundTripReport: roundTrip });
  const access = await api.executeOpponentAccessHarnessQualification(source, { selectionSemanticsReport: semantics, roundTripReport: roundTrip });
  const morph = await api.executeShangMorphSelectionQualification(source, { ownershipReport: ownership, opponentAccessReport: access });
  const artifact = await api.createMK1ShangMorphSelectionExport(morph);

  assert.equal(morph.status, 'SUCCESS');
  assert.deepEqual(morph.targetSelection.randomSansGoro.candidateCharacterIds, [0,1,2,3,4,5,6]);
  assert.equal(morph.targetSelection.directGoroMorph.supportedByEmpMorph, true);
  assert.equal(morph.targetSelection.empMorph.sequenceLookupBeforeIdentitySwap, true);
  assert.equal(morph.animationCommand6.handlerCallsNextDword, true);
  assert.equal(morph.paletteCallbacks.switchMorphPalette.jumpsToPlayerSwpal, true);
  assert.equal(morph.paletteCallbacks.restoreGenericFighterPalette.callsPlayerNormpal, true);
  assert.equal(morph.paletteCallbacks.restoreGenericFighterPalette.preservesA9, true);
  assert.deepEqual(morph.targets.map(target => target.targetName), ['CAGE','KANO','RAYDEN','LIU KANG','SCORPION','SUB-ZERO','SONYA','GORO']);
  assert.deepEqual(morph.targets.map(target => target.transitionPalette.symbol), ['VDMORPH_P','KMORPH_P','RDMORPH_P','HOMORPH_P','SCORPMO_P','SUBMO_P','LZMORPH_P','GOMORPH_P']);
  assert.equal(morph.targets.every(target => target.transitionPalette.declaredLength === 23 && target.transitionPalette.linkedFromMorph1Plus0C), true);
  assert.equal(morph.genericPaletteSelection.indexesByObjectIdentityField, true);
  assert.equal(morph.genericPaletteSelection.sameCharacterAlternateRuleRetained, true);
  assert.equal(morph.unmorph.restoresCharacterId, 8);
  assert.equal(morph.unmorph.slot8Aliases.includes('YANG_P') && morph.unmorph.slot8Aliases.includes('EMP_P'), true);
  assert.equal(morph.decision.runtimePatchRequired, false);

  await mkdir(outputRoot, { recursive: true });
  await writeFile(join(outputRoot, 'mk1_shang_morph_selection_direct.json'), JSON.stringify(artifact, null, 2));
  console.log(JSON.stringify({
    status: morph.status,
    checks: artifact.validation.checks.length,
    randomTargets: morph.targetSelection.randomSansGoro.candidateCharacterIds,
    directGoroPaths: morph.targetSelection.directGoroMorph.callSites.length,
    transitionPalettes: morph.targets.map(target => `${target.targetName}:${target.transitionPalette.symbol}`),
    unmorphAliases: morph.unmorph.slot8Aliases,
    output: outputRoot,
  }, null, 2));
} finally {
  await rm(temp, { recursive: true, force: true });
}
