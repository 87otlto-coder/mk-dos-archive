// Direct smoke against a user-supplied installation; never executes the game.
// Usage: node scripts/run-ladder-grammar.mjs /path/to/mk1 /path/to/output
import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = process.argv[2];
const destination = process.argv[3];
if (!fixture || !destination) throw new Error('Usage: node scripts/run-ladder-grammar.mjs MK1_DIRECTORY OUTPUT_DIRECTORY');
const fixtureRoot = resolve(fixture);
const outputRoot = resolve(destination);
const temp = await mkdtemp(join(tmpdir(), 'mk1-ladder-grammar-'));

try {
  const entry = `
    export * from './src/games/mk1/research/watcomDataImagePaletteGroundTruth';
    export * from './src/games/mk1/research/kanoPaletteSelectionReferenceGraph';
    export * from './src/games/mk1/research/kanoPaletteSelectionSemantics';
    export * from './src/games/mk1/research/paletteSetupTransferSemantics';
    export * from './src/games/mk1/research/paletteRoundTrip';
    export * from './src/games/mk1/research/opponentAccessHarness';
    export * from './src/games/mk1/research/singlePlayerLadderGrammar';
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

  console.log('Running authentic fixture chain through 1E.3N.2 ladder grammar');
  const gt = await api.executeWatcomDataImagePaletteGroundTruth(source);
  const graph = await api.executeKanoPaletteSelectionReferenceGraph(source, { groundTruthReport: gt });
  const semantics = await api.executeKanoPaletteSelectionSemantics(source, { referenceGraphReport: graph });
  const transfer = await api.executePaletteSetupTransferSemantics(source, { selectionSemanticsReport: semantics });
  const roundTrip = await api.executePaletteRoundTrip(source, { groundTruthReport: gt, transferReport: transfer });
  const access = await api.executeOpponentAccessHarnessQualification(source, { selectionSemanticsReport: semantics, roundTripReport: roundTrip });
  const grammar = await api.executeSinglePlayerLadderGrammarQualification(source, { opponentAccessReport: access, roundTripReport: roundTrip });
  const artifact = await api.createMK1SinglePlayerLadderGrammarExport(grammar);

  assert.equal(grammar.status, 'SUCCESS');
  assert.equal(grammar.testYourMight.heading, 'TEST YOUR MIGHT');
  assert.deepEqual(grammar.endurance.stablePairPositionPatterns, [
    { token: 16, pattern: [0,1] }, { token: 17, pattern: [2,3] }, { token: 18, pattern: [4,5] },
    { token: 19, pattern: [0,3] }, { token: 20, pattern: [1,4] }, { token: 21, pattern: [2,5] },
  ]);
  assert.equal(grammar.grammar.allFourMapsMatchInvariantShape, true);
  assert.deepEqual(grammar.grammar.unusedTokensInRecoveredMaps, [9,10,11,12,13,14]);

  const token15 = await api.executeLadderGrammarAccessEdit(source, grammar, 15);
  const token15Artifact = await api.createMK1LadderGrammarAccessEditExport(token15);
  const token18 = await api.executeLadderGrammarAccessEdit(source, grammar, 18);
  const token18Artifact = await api.createMK1LadderGrammarAccessEditExport(token18);
  const token18Bundle = await api.buildLadderGrammarAccessBundle(token18);
  assert.equal(token15.report.evidence.unexpectedByteChanges, 0);
  assert.equal(token18.report.evidence.unexpectedByteChanges, 0);
  assert.equal(token18.report.evidence.reverseRestoresOriginal, true);
  assert.deepEqual(token18.report.predictedEndurancePairs.find(row => row.selectedPlayableCharacterId === 0)?.pairPositionPattern, [4,5]);

  await mkdir(outputRoot, { recursive: true });
  await writeFile(join(outputRoot, 'mk1_single_player_ladder_grammar_direct.json'), JSON.stringify(artifact, null, 2));
  await writeFile(join(outputRoot, 'mk1_ladder_token15_direct.json'), JSON.stringify(token15Artifact, null, 2));
  await writeFile(join(outputRoot, 'mk1_ladder_token18_direct.json'), JSON.stringify(token18Artifact, null, 2));
  await writeFile(join(outputRoot, 'mk1-ladder-token18-1E3N2.zip'), token18Bundle);
  console.log(JSON.stringify({
    status: grammar.status,
    checks: artifact.validation.checks.length,
    testYourMight: grammar.testYourMight.heading,
    enduranceTable: grammar.endurance.pairPointerTablePhysicalHex,
    pairPatterns: grammar.endurance.stablePairPositionPatterns,
    token18: { changedBytes: token18.report.evidence.changedByteCount, sha256: token18.report.evidence.editedExeSha256 },
    output: outputRoot,
  }, null, 2));
} finally {
  await rm(temp, { recursive: true, force: true });
}
