// Direct smoke against a user-supplied installation; never executes the game.
// Usage: node scripts/run-palette-round-trip.mjs /path/to/mk1 /path/to/output
import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = process.argv[2];
const destination = process.argv[3];
if (!fixture || !destination) throw new Error('Usage: node scripts/run-palette-round-trip.mjs MK1_DIRECTORY OUTPUT_DIRECTORY');
const fixtureRoot = resolve(fixture);
const outputRoot = resolve(destination);
const temp = await mkdtemp(join(tmpdir(), 'mk1-round-trip-'));
try {
  const entry = `
    export * from './src/games/mk1/research/watcomDataImagePaletteGroundTruth';
    export * from './src/games/mk1/research/kanoPaletteSelectionReferenceGraph';
    export * from './src/games/mk1/research/kanoPaletteSelectionSemantics';
    export * from './src/games/mk1/research/paletteSetupTransferSemantics';
    export * from './src/games/mk1/research/paletteRoundTrip';
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
  console.log('Running authentic fixture chain: 1E.3D.1 → 1E.3E → 1E.3F → 1E.3G → 1E.3H');
  const gt = await api.executeWatcomDataImagePaletteGroundTruth(source);
  const graph = await api.executeKanoPaletteSelectionReferenceGraph(source, { groundTruthReport: gt });
  const semantics = await api.executeKanoPaletteSelectionSemantics(source, { referenceGraphReport: graph });
  const transfer = await api.executePaletteSetupTransferSemantics(source, { selectionSemanticsReport: semantics });
  const report = await api.executePaletteRoundTrip(source, { groundTruthReport: gt, transferReport: transfer });
  const exported = await api.createMK1PaletteRoundTripExport(report);

  // Fail-closed mutation probes reuse the real report but never export invalid data.
  for (const mutate of [
    r => { r.ir.records[0].rawColorWords[0] ^= 1; },
    r => { r.provenance.operationId = 'wrong-pass'; },
    r => { r.provenance.synthetic = true; },
    r => { r.prerequisite.transferSha256 = '0'.repeat(64); },
    r => { r.comparison.rebuiltExeSha256 = '0'.repeat(64); },
    r => { r.groundTruthRecords[0].physicalStart++; },
    r => { r.module.originalBytesHex = '00' + r.module.originalBytesHex.slice(2); },
  ]) {
    const changed = structuredClone(report); mutate(changed);
    await assert.rejects(api.createMK1PaletteRoundTripExport(changed));
  }
  const tampered = { ...source, async readSlice(path, offset, length) {
    const bytes = await source.readSlice(path, offset, length);
    if (path === 'MK1.EXE' && offset === 0) bytes[0] ^= 1;
    return bytes;
  } };
  await assert.rejects(api.executePaletteRoundTrip(tampered, { groundTruthReport: gt, transferReport: transfer }), /SHA-256 changed/);
  await mkdir(outputRoot, { recursive: true });
  const filename = 'mk1_palette_round_trip_direct.json';
  await writeFile(join(outputRoot, filename), JSON.stringify(exported, null, 2));
  await writeFile(join(outputRoot, 'mk1_palette_ground_truth_direct.json'), JSON.stringify(api.createMK1WatcomDataImagePaletteGroundTruthExport(gt), null, 2));
  await writeFile(join(outputRoot, 'mk1_palette_setup_transfer_direct.json'), JSON.stringify(api.createMK1PaletteSetupTransferSemanticsExport(transfer), null, 2));
  console.log(JSON.stringify({ status: report.status, checks: exported.validation.checks.length, records: report.comparison.recordsMatching,
    moduleBytes: report.module.byteLength, executableBytesChanged: report.comparison.wholeExecutable.mismatchCount,
    sha256: report.comparison.rebuiltExeSha256, negativeProbesPassed: 8, output: join(outputRoot, filename) }, null, 2));
} finally { await rm(temp, { recursive: true, force: true }); }
