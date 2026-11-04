#!/usr/bin/env node
/**
 * Extractor P1: real MK2 fixture smoke test without npm/Vite dependencies.
 * Compiles and exercises the actual AssetCollection integration, not just O94D.
 * Usage: node scripts/verify-extractor-mk2-audio.mjs <canonical-mk2-directory> [report.json]
 * Never writes to the supplied game directory.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const [fixtureArg, reportArg] = process.argv.slice(2);
if (!fixtureArg) {
  console.error('Usage: node scripts/verify-extractor-mk2-audio.mjs <canonical-mk2-directory> [report.json]');
  process.exit(2);
}
const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const fixtureRoot = path.resolve(fixtureArg);
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'mkdos-extractor-p1-'));
const emit = path.join(temporary, 'compiled');
const typeRoot = path.join(temporary, 'empty-types');
const nodeShim = path.join(temporary, 'node-shim.d.ts');
fs.mkdirSync(emit, { recursive: true });
fs.mkdirSync(typeRoot, { recursive: true });
fs.writeFileSync(nodeShim, 'declare const process: { platform:string;env?:Record<string,string|undefined> };\n');

function entriesAt(root, sub = '') {
  const result = [];
  for (const item of fs.readdirSync(path.join(root, sub), { withFileTypes: true })) {
    const relative = sub ? `${sub}/${item.name}` : item.name;
    if (item.isDirectory()) result.push(...entriesAt(root, relative));
    else if (item.isFile()) {
      const index = item.name.lastIndexOf('.');
      result.push({ path: relative, name: item.name, extension: index > 0 ? item.name.slice(index + 1).toUpperCase() : '', size: fs.statSync(path.join(root, relative)).size });
    }
  }
  return result;
}
function insist(condition, message) { if (!condition) throw new Error(message); }

try {
  execFileSync('tsc', [
    '--target', 'es2022', '--module', 'commonjs', '--moduleResolution', 'node',
    '--esModuleInterop', '--skipLibCheck', '--lib', 'es2022,dom,dom.iterable',
    '--typeRoots', typeRoot, '--outDir', emit, nodeShim,
    'src/core/assets/collection.ts', 'src/core/assets/export.ts',
  ], { cwd: projectRoot, stdio: 'inherit' });
  const { scanAssets } = require(path.join(emit, 'core/assets/collection.js'));
  const { selectedZip } = require(path.join(emit, 'core/assets/export.js'));
  const { parseAnimationStoreZip } = require(path.join(emit, 'games/mk1/research/browserAnimationExportBundleValidation.js'));
  const files = entriesAt(fixtureRoot);
  const source = {
    directoryName: path.basename(fixtureRoot), isSynthetic: false,
    async listRecursive() { return files; },
    async readSlice(relative, offset, length) {
      const fullPath = path.join(fixtureRoot, relative);
      const fileSize = fs.statSync(fullPath).size;
      if (offset >= fileSize) return new Uint8Array(0);
      const count = Math.min(length, fileSize - offset);
      const buffer = Buffer.alloc(count);
      const fd = fs.openSync(fullPath, 'r');
      try { return Uint8Array.from(buffer.subarray(0, fs.readSync(fd, buffer, 0, count, offset))); }
      finally { fs.closeSync(fd); }
    },
  };
  const started = Date.now();
  const collection = await scanAssets(source, 'mk2', () => {});
  const sounds = collection.assets.filter(a => a.group === 'MK2 original sound effects');
  const evidence = collection.reports.u8Audio;
  insist(evidence?.status === 'SUCCESS' && evidence?.decision?.sourceDomainWavAuthorized, 'O94D did not authorize WAV extraction');
  insist(sounds.length === 312, `Expected 312 sound assets, observed ${sounds.length}`);
  insist(sounds.every(a => a.kind === 'audio' && a.mime === 'audio/wav' && a.bytes?.length > 44), 'Invalid audio asset metadata');
  insist(collection.packages.some(p => p.name === 'MK2_O94D_U8_BOUNDED_PCM_WAV_PACKAGE.zip'), 'O94D preservation ZIP not attached');
  const sampleZip = parseAnimationStoreZip(selectedZip(sounds.slice(0, 3)));
  const exampleWavs = [...sampleZip.keys()].filter(k => k.endsWith('.wav'));
  insist(exampleWavs.length === 3 && sampleZip.has('manifest.json'), 'Selected WAV export ZIP was not structurally complete');
  const rateCounts = sounds.reduce((o, a) => { const rate = String(a.metadata.sourceSampleRate); o[rate] = (o[rate] ?? 0) + 1; return o; }, {});
  insist(rateCounts['11025'] === 190 && rateCounts['22050'] === 122, `Unexpected source rates: ${JSON.stringify(rateCounts)}`);
  const report = {
    format: 'mkdos_extractor_p1_mk2_audio_smoke_v1', status: 'PASS',
    fixture: path.basename(fixtureRoot), elapsedMilliseconds: Date.now() - started,
    game: collection.game, totalAssets: collection.assets.length, soundAssets: sounds.length,
    sourceRateCounts: rateCounts, o94dVerdict: evidence.decision.verdict,
    sourceDomainOnly: true, originalSamplePreservationPackage: 'MK2_O94D_U8_BOUNDED_PCM_WAV_PACKAGE.zip',
    selectedZipTest: { inputSounds: 3, wavFiles: exampleWavs.length, hasManifest: true },
    limitations: ['Does not test React UI or Vite build.', 'Does not claim runtime mixer output equivalence.', 'Original U8 tail purposes remain unknown.'],
  };
  if (reportArg) fs.writeFileSync(path.resolve(reportArg), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error('Extractor P1 smoke FAILED:', error.stack ?? String(error));
  process.exitCode = 1;
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
