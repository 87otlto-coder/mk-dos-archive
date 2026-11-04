// Direct smoke against a user-supplied installation; never executes the game.
// Usage: node scripts/run-opponent-access.mjs /path/to/mk1 /path/to/output
import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = process.argv[2];
const destination = process.argv[3];
if (!fixture || !destination) throw new Error('Usage: node scripts/run-opponent-access.mjs MK1_DIRECTORY OUTPUT_DIRECTORY');
const fixtureRoot = resolve(fixture);
const outputRoot = resolve(destination);
const temp = await mkdtemp(join(tmpdir(), 'mk1-opponent-access-'));

try {
  const entry = `
    export * from './src/games/mk1/research/watcomDataImagePaletteGroundTruth';
    export * from './src/games/mk1/research/kanoPaletteSelectionReferenceGraph';
    export * from './src/games/mk1/research/kanoPaletteSelectionSemantics';
    export * from './src/games/mk1/research/paletteSetupTransferSemantics';
    export * from './src/games/mk1/research/paletteRoundTrip';
    export * from './src/games/mk1/research/opponentAccessHarness';
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

  console.log('Running authentic fixture chain through 1E.3N.1 opponent access harness');
  const gt = await api.executeWatcomDataImagePaletteGroundTruth(source);
  const graph = await api.executeKanoPaletteSelectionReferenceGraph(source, { groundTruthReport: gt });
  const semantics = await api.executeKanoPaletteSelectionSemantics(source, { referenceGraphReport: graph });
  const transfer = await api.executePaletteSetupTransferSemantics(source, { selectionSemanticsReport: semantics });
  const roundTrip = await api.executePaletteRoundTrip(source, { groundTruthReport: gt, transferReport: transfer });
  const qualification = await api.executeOpponentAccessHarnessQualification(source, {
    selectionSemanticsReport: semantics,
    roundTripReport: roundTrip,
  });
  const qualificationArtifact = await api.createMK1OpponentAccessHarnessExport(qualification);

  assert.equal(qualification.status, 'SUCCESS');
  assert.equal(qualification.ladderSelector.maps.length, 4);
  assert.deepEqual(qualification.decision.firstEncounterPatchOffsets, [0x96d24, 0x96d34, 0x96d44, 0x96d54]);
  assert.equal(qualification.offsetToOchar.tokenMappings[6].stableCharacterId, 7);
  assert.equal(qualification.offsetToOchar.tokenMappings[6].internalIdentity, 'GORO');
  assert.equal(qualification.offsetToOchar.tokenMappings[7].stableCharacterId, 8);
  assert.equal(qualification.offsetToOchar.tokenMappings[7].internalIdentity, 'EMP');
  assert.deepEqual(qualification.offsetToOchar.tokenMappings[8].characterIdsByPlayableCharacter, [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(qualification.secretGreenNinjaRoute?.accessPatchExposed, false);

  const token6 = await api.executeOpponentAccessEdit(source, qualification, 6);
  const token6Artifact = await api.createMK1OpponentAccessEditExport(token6);
  assert.equal(token6.report.evidence.changedByteCount, 4);
  assert.equal(token6.report.evidence.unexpectedByteChanges, 0);
  assert.equal(token6.report.evidence.reverseRestoresOriginal, true);
  const token6Bundle = await api.buildOpponentAccessTestBundle(token6);

  const token7 = await api.executeOpponentAccessEdit(source, qualification, 7);
  const token7Artifact = await api.createMK1OpponentAccessEditExport(token7);
  assert.equal(token7.report.evidence.changedByteCount, 4);
  assert.equal(token7.report.evidence.unexpectedByteChanges, 0);
  assert.equal(token7.report.evidence.reverseRestoresOriginal, true);
  const token7Bundle = await api.buildOpponentAccessTestBundle(token7);

  const composite = await api.buildGoroSlot7CompositeBundle(source, roundTrip, qualification);
  assert.equal(composite.report.layers.access.requestedToken, 6);
  assert.equal(composite.report.layers.palette.symbol, 'GONGORO_P');
  assert.equal(composite.report.evidence.changedByteCount, 50);
  assert.equal(composite.report.evidence.unexpectedByteChanges, 0);
  assert.equal(composite.report.evidence.reverseRestoresOriginal, true);

  const shangComposite = await api.buildShangSlot8CompositeBundle(source, roundTrip, qualification);
  assert.equal(shangComposite.report.layers.access.requestedToken, 7);
  assert.equal(shangComposite.report.layers.palette.symbol, 'YANG_P');
  assert.deepEqual(shangComposite.report.layers.palette.aliases.sort(), ['EMP_P', 'YANG_P']);
  assert.equal(shangComposite.report.evidence.changedByteCount, 50);
  assert.equal(shangComposite.report.evidence.unexpectedByteChanges, 0);
  assert.equal(shangComposite.report.evidence.reverseRestoresOriginal, true);

  await mkdir(outputRoot, { recursive: true });
  await writeFile(join(outputRoot, 'mk1_opponent_access_harness_direct.json'), JSON.stringify(qualificationArtifact, null, 2));
  await writeFile(join(outputRoot, 'mk1_opponent_access_token6_direct.json'), JSON.stringify(token6Artifact, null, 2));
  await writeFile(join(outputRoot, 'mk1_opponent_access_token7_direct.json'), JSON.stringify(token7Artifact, null, 2));
  await writeFile(join(outputRoot, 'mk1-opponent-access-token6-1E3N1.zip'), token6Bundle);
  await writeFile(join(outputRoot, 'mk1-opponent-access-token7-1E3N1.zip'), token7Bundle);
  await writeFile(join(outputRoot, 'mk1-slot7-goro-access-plus-gongoro-magenta-1E3N1.zip'), composite.zip);
  await writeFile(join(outputRoot, 'mk1-slot8-shang-access-plus-yang-emp-magenta-1E3N3.zip'), shangComposite.zip);

  console.log(JSON.stringify({
    status: qualification.status,
    checks: qualificationArtifact.validation.checks.length,
    mapOffsets: qualification.decision.firstEncounterPatchOffsetsHex,
    token6: { characterId: 7, changedBytes: token6.report.evidence.changedByteCount, sha256: token6.report.evidence.editedExeSha256 },
    token7: { characterId: 8, changedBytes: token7.report.evidence.changedByteCount, sha256: token7.report.evidence.editedExeSha256 },
    goroComposite: { changedBytes: composite.report.evidence.changedByteCount, sha256: composite.report.evidence.compositeExeSha256 },
    shangComposite: { changedBytes: shangComposite.report.evidence.changedByteCount, sha256: shangComposite.report.evidence.compositeExeSha256 },
    secretGreenNinja: qualification.secretGreenNinjaRoute ? 'qualified-evidence-access-deferred' : 'not-reproduced',
    output: outputRoot,
  }, null, 2));
} finally {
  await rm(temp, { recursive: true, force: true });
}
