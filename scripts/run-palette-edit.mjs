// Direct smoke against a user-supplied installation; never executes the game.
// Usage: node scripts/run-palette-edit.mjs /path/to/mk1 /path/to/output
import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = process.argv[2];
const destination = process.argv[3];
if (!fixture || !destination) throw new Error('Usage: node scripts/run-palette-edit.mjs MK1_DIRECTORY OUTPUT_DIRECTORY');
const fixtureRoot = resolve(fixture);
const outputRoot = resolve(destination);
const temp = await mkdtemp(join(tmpdir(), 'mk1-palette-edit-'));
try {
  const entry = `
    export * from './src/games/mk1/research/watcomDataImagePaletteGroundTruth';
    export * from './src/games/mk1/research/kanoPaletteSelectionReferenceGraph';
    export * from './src/games/mk1/research/kanoPaletteSelectionSemantics';
    export * from './src/games/mk1/research/paletteSetupTransferSemantics';
    export * from './src/games/mk1/research/paletteRoundTrip';
    export * from './src/games/mk1/research/paletteControlledEdit';
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
  console.log('Running authentic fixture chain: 1E.3D.1 → 1E.3E → 1E.3F → 1E.3G → 1E.3H → 1E.3I');
  const gt = await api.executeWatcomDataImagePaletteGroundTruth(source);
  const graph = await api.executeKanoPaletteSelectionReferenceGraph(source, { groundTruthReport: gt });
  const semantics = await api.executeKanoPaletteSelectionSemantics(source, { referenceGraphReport: graph });
  const transfer = await api.executePaletteSetupTransferSemantics(source, { selectionSemanticsReport: semantics });
  const report = await api.executePaletteRoundTrip(source, { groundTruthReport: gt, transferReport: transfer });
  const exported = await api.createMK1PaletteRoundTripExport(report);

  const edited = await api.executeControlledPaletteEdit(source, report);
  const artifact = await api.createMK1ControlledPaletteEditExport(edited);
  let negativeProbesPassed = 0;
  for (const mutate of [
    r => { r.report.edits[0].replacementWord ^= 1; },
    r => { r.report.target.aliases.push('unverified'); },
    r => { r.report.evidence.changedByteCount++; },
    r => { r.report.operationId = 'wrong-pass'; },
    r => { r.report.provenance.synthetic = true; },
    r => { r.report.prerequisite.fixtureSha256 = '0'.repeat(64); },
    r => { r.report.runtime.tested = true; },
    r => { r.editedExe[0] ^= 1; },
    r => { r.originalExe[0] ^= 1; },
  ]) {
    const changed = structuredClone(edited); mutate(changed);
    await assert.rejects(api.createMK1ControlledPaletteEditExport(changed));
    negativeProbesPassed++;
  }
  const changedSource = { ...source, async readSlice(path, offset, length) {
    const bytes = await source.readSlice(path, offset, length);
    if (path === 'MK1.EXE' && offset === 0) bytes[0] ^= 1;
    return bytes;
  } };
  await assert.rejects(api.executeControlledPaletteEdit(changedSource, report), /SHA-256/);
  negativeProbesPassed++;
  const bundle = await api.buildKanoTestBundle(edited);
  await mkdir(outputRoot, { recursive: true });
  await writeFile(join(outputRoot, 'mk1_palette_controlled_edit_direct.json'), JSON.stringify(artifact, null, 2));
  await writeFile(join(outputRoot, 'mk1-kano-magenta-test-1E3I.zip'), bundle);
  console.log(JSON.stringify({ status: edited.report.status, checks: artifact.validation.checks.length,
    words: edited.report.evidence.editedWordCount, changedBytes: edited.report.evidence.changedByteCount,
    editedSha256: edited.report.evidence.editedExeSha256, reverseSha256: edited.report.evidence.reversedExeSha256,
    negativeProbesPassed, output: outputRoot }, null, 2));
} finally { await rm(temp, { recursive: true, force: true }); }
