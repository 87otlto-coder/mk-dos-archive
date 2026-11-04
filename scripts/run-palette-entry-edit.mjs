// Direct smoke against a user-supplied installation; never executes the game.
// Usage: node scripts/run-palette-entry-edit.mjs /path/to/mk1 /path/to/output
import { build } from 'esbuild';
import { mkdtemp, readdir, readFile, stat, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = process.argv[2];
const destination = process.argv[3];
if (!fixture || !destination) throw new Error('Usage: node scripts/run-palette-entry-edit.mjs MK1_DIRECTORY OUTPUT_DIRECTORY');
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
    export * from './src/games/mk1/research/fighterPaletteOwnership';
    export * from './src/games/mk1/research/paletteEntryEdit';
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
  console.log('Running authentic fixture chain: 1E.3D.1 → 1E.3E → 1E.3F → 1E.3G → 1E.3H → 1E.3J/1E.3K → 1E.3L → 1E.3M → 1E.3N slot-7 qualification');
  const gt = await api.executeWatcomDataImagePaletteGroundTruth(source);
  const graph = await api.executeKanoPaletteSelectionReferenceGraph(source, { groundTruthReport: gt });
  const semantics = await api.executeKanoPaletteSelectionSemantics(source, { referenceGraphReport: graph });
  const transfer = await api.executePaletteSetupTransferSemantics(source, { selectionSemanticsReport: semantics });
  const report = await api.executePaletteRoundTrip(source, { groundTruthReport: gt, transferReport: transfer });
  const exported = await api.createMK1PaletteRoundTripExport(report);
  const ownership = await api.executeFighterPaletteOwnershipQualification(source, {
    referenceGraphReport: graph, selectionSemanticsReport: semantics, roundTripReport: report,
  });
  const ownershipArtifact = await api.createMK1FighterPaletteOwnershipExport(ownership);
  assert.equal(ownership.status, 'SUCCESS');
  assert.equal(ownership.slots.length, 9);
  assert.equal(ownership.slots[0].rosterName, 'CAGE');
  assert.ok(ownership.slots[0].normal.symbolNames.includes('GRIMM_P'));
  assert.equal(ownership.characterIdentityField.fieldOffset, 0x48);

  const kano = report.groundTruthRecords.find(record => record.symbolNames.includes('KANO_P'));
  const originalWords = report.ir.records[kano.recordIndex].rawColorWords;
  const words = [...originalWords];
  words[0] = 0x7c1f; words[7] = 0x03e0; words[22] = 0x001f;
  const edited = await api.executePaletteEntryEdit(source, report, words);
  const artifact = await api.createMK1PaletteEntryEditExport(edited);
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
    await assert.rejects(api.createMK1PaletteEntryEditExport(changed));
    negativeProbesPassed++;
  }
  const changedSource = { ...source, async readSlice(path, offset, length) {
    const bytes = await source.readSlice(path, offset, length);
    if (path === 'MK1.EXE' && offset === 0) bytes[0] ^= 1;
    return bytes;
  } };
  await assert.rejects(api.executePaletteEntryEdit(changedSource, report, words), /SHA-256/);
  negativeProbesPassed++;
  for (const invalid of [originalWords, words.slice(1), [...words.slice(0, 22), 0x8000], [...words.slice(0, 22), 1.5]]) {
    await assert.rejects(api.executePaletteEntryEdit(source, report, invalid)); negativeProbesPassed++;
  }
  const oneWord = [...originalWords]; oneWord[4] ^= 1;
  const single = await api.executePaletteEntryEdit(source, report, oneWord);
  assert.equal(single.report.evidence.changedByteCount, 1);
  await api.createMK1PaletteEntryEditExport(single);
  const bundle = await api.buildKanoEntryTestBundle(edited);

  const cage = report.groundTruthRecords.find(record => record.symbolNames.includes('GRIMM_P'));
  assert.ok(cage);
  const cageOriginalWords = report.ir.records[cage.recordIndex].rawColorWords;
  const cageWords = cageOriginalWords.map(() => 0x7c1f);
  const cageEdited = await api.executePaletteEntryEdit(source, report, cageWords, 'GRIMM_P');
  const cageArtifact = await api.createMK1PaletteEntryEditExport(cageEdited);
  assert.equal(cageArtifact.metadata.milestone, 'Pass 1E.3L');
  assert.equal(cageEdited.report.target.symbol, 'GRIMM_P');
  assert.equal(cageEdited.report.evidence.unexpectedByteChanges, 0);
  assert.equal(cageEdited.report.evidence.reversedExeSha256, cageEdited.report.evidence.originalExeSha256);
  const cageBundle = await api.buildPaletteEntryTestBundle(cageEdited);

  const rosterSymbols = [
    'GRIMM_P', 'GRIMM3_P', 'KANO_P', 'KANO3_P', 'RAIDEN_P', 'RAIDEN3_P',
    'LUKANG_P', 'LUKANG3_P', 'YNINJA_P', 'YNINJA3_P', 'BNINJA_P', 'BNINJA3_P',
    'LIZ_P', 'LIZRED_P',
  ];
  const rosterSmoke = [];
  let raydenBundle = null;
  for (const symbol of rosterSymbols) {
    const record = report.groundTruthRecords.find(item => item.symbolNames.includes(symbol));
    assert.ok(record, `missing ${symbol}`);
    assert.equal(record.declaredLength, 23);
    const sourceWords = report.ir.records[record.recordIndex].rawColorWords;
    const fill = sourceWords.every(word => word === 0x7c1f) ? 0x001f : 0x7c1f;
    const targetWords = sourceWords.map(() => fill);
    const result = await api.executePaletteEntryEdit(source, report, targetWords, symbol);
    const targetArtifact = await api.createMK1PaletteEntryEditExport(result);
    assert.equal(result.report.target.symbol, symbol);
    assert.equal(result.report.evidence.unexpectedByteChanges, 0);
    assert.equal(result.report.evidence.bytesChangedOutsideTargetWords, 0);
    assert.equal(result.report.evidence.reversedExeSha256, result.report.evidence.originalExeSha256);
    assert.equal(targetArtifact.validation.allChecksPassed, true);
    rosterSmoke.push({ symbol, recordIndex: record.recordIndex, pass: targetArtifact.metadata.milestone, changedBytes: result.report.evidence.changedByteCount });
    if (symbol === 'RAIDEN_P') raydenBundle = await api.buildPaletteEntryTestBundle(result);
  }
  assert.equal(rosterSmoke.length, 14);

  const unresolvedSlot7 = ownership.slots[7];
  assert.equal(unresolvedSlot7.rosterName, null);
  assert.equal(unresolvedSlot7.sameRecordForNormalAndAlternate, true);
  assert.equal(unresolvedSlot7.normal.recordIndex, unresolvedSlot7.alternate.recordIndex);
  assert.ok(unresolvedSlot7.normal.symbolNames.includes('GONGORO_P'));
  assert.ok(unresolvedSlot7.alternate.symbolNames.includes('GONGORO_P'));
  const gongoro = report.groundTruthRecords.find(record => record.symbolNames.includes('GONGORO_P'));
  assert.ok(gongoro);
  assert.equal(gongoro.recordIndex, unresolvedSlot7.normal.recordIndex);
  assert.equal(gongoro.declaredLength, 23);
  const gongoroOriginalWords = report.ir.records[gongoro.recordIndex].rawColorWords;
  const gongoroWords = gongoroOriginalWords.map(() => 0x7c1f);
  const gongoroEdited = await api.executePaletteEntryEdit(source, report, gongoroWords, 'GONGORO_P');
  const gongoroArtifact = await api.createMK1PaletteEntryEditExport(gongoroEdited);
  assert.equal(gongoroArtifact.metadata.milestone, 'Pass 1E.3N');
  assert.equal(gongoroEdited.report.target.symbol, 'GONGORO_P');
  assert.equal(gongoroEdited.report.target.recordIndex, unresolvedSlot7.normal.recordIndex);
  assert.equal(gongoroEdited.report.evidence.unexpectedByteChanges, 0);
  assert.equal(gongoroEdited.report.evidence.bytesChangedOutsideTargetWords, 0);
  assert.equal(gongoroEdited.report.evidence.reversedExeSha256, gongoroEdited.report.evidence.originalExeSha256);
  const gongoroBundle = await api.buildPaletteEntryTestBundle(gongoroEdited);

  await mkdir(outputRoot, { recursive: true });
  await writeFile(join(outputRoot, 'mk1_palette_entry_edit_direct.json'), JSON.stringify(artifact, null, 2));
  await writeFile(join(outputRoot, 'mk1_fighter_palette_ownership_direct.json'), JSON.stringify(ownershipArtifact, null, 2));
  await writeFile(join(outputRoot, 'mk1_palette_entry_edit_grimm_p_direct.json'), JSON.stringify(cageArtifact, null, 2));
  await writeFile(join(outputRoot, 'mk1-kano-three-colors-test-1E3J.zip'), bundle);
  await writeFile(join(outputRoot, 'mk1-cage-flat-test-1E3L.zip'), cageBundle);
  if (raydenBundle) await writeFile(join(outputRoot, 'mk1-rayden-flat-test-1E3M.zip'), raydenBundle);
  await writeFile(join(outputRoot, 'mk1_palette_entry_edit_gongoro_p_direct.json'), JSON.stringify(gongoroArtifact, null, 2));
  await writeFile(join(outputRoot, 'mk1-unresolved-slot-7-flat-test-1E3N.zip'), gongoroBundle);
  console.log(JSON.stringify({ status: edited.report.status, checks: artifact.validation.checks.length,
    ownershipStatus: ownership.status, ownershipChecks: ownershipArtifact.validation.checks.length,
    cageChangedBytes: cageEdited.report.evidence.changedByteCount,
    words: edited.report.evidence.editedWordCount, changedBytes: edited.report.evidence.changedByteCount,
    editedSha256: edited.report.evidence.editedExeSha256, reverseSha256: edited.report.evidence.reversedExeSha256,
    negativeProbesPassed, rosterSmoke, slot7: { symbol: 'GONGORO_P', recordIndex: gongoro.recordIndex, changedBytes: gongoroEdited.report.evidence.changedByteCount }, output: outputRoot }, null, 2));
} finally { await rm(temp, { recursive: true, force: true }); }
