#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const [fixtureArg, outArg] = process.argv.slice(2);
if (!fixtureArg) {
  console.error('Usage: node scripts/run-audio-music-resource-graph-census.mjs <mk1-install-dir> [out.json]');
  process.exit(2);
}
const fixtureDir = path.resolve(fixtureArg);
const outPath = path.resolve(outArg ?? 'mk1_audio_music_resource_graph_census_direct.json');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mk1-o63-'));
const emit = path.join(tmp, 'emit');
const types = path.join(tmp, 'types');
fs.mkdirSync(emit, { recursive: true });
fs.mkdirSync(types, { recursive: true });
const shim = path.join(tmp, 'node-shim.d.ts');
fs.writeFileSync(shim, 'declare const process: any;\n');
execFileSync('tsc', [
  '--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck',
  '--lib','ES2022,DOM','--typeRoots',types,'--outDir',emit,shim,
  'src/games/mk1/research/audioMusicResourceGraphCensus.ts'
], { cwd: root, stdio: 'inherit' });
const api = require(path.join(emit, 'games/mk1/research/audioMusicResourceGraphCensus.js'));

function listFilesRecursive(base, rel = '') {
  const out = [];
  const abs = path.join(base, rel);
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    const childRel = rel ? `${rel}/${ent.name}` : ent.name;
    if (ent.isDirectory()) out.push(...listFilesRecursive(base, childRel));
    else if (ent.isFile()) {
      const st = fs.statSync(path.join(base, childRel));
      const dot = ent.name.lastIndexOf('.');
      out.push({ path: childRel.replace(/\\/g,'/'), name: ent.name, extension: dot > 0 ? ent.name.slice(dot + 1).toUpperCase() : '', size: st.size });
    }
  }
  return out;
}
const source = {
  directoryName: path.basename(fixtureDir),
  isSynthetic: false,
  async listRecursive() { return listFilesRecursive(fixtureDir); },
  async readSlice(relPath, offset, length) {
    const fd = fs.openSync(path.join(fixtureDir, relPath), 'r');
    try {
      const size = fs.statSync(path.join(fixtureDir, relPath)).size;
      if (offset >= size) return new Uint8Array(0);
      const actual = Math.min(length, size - offset);
      const buffer = Buffer.alloc(actual);
      fs.readSync(fd, buffer, 0, actual, offset);
      return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength).slice();
    } finally { fs.closeSync(fd); }
  }
};

const report = await api.executeAudioMusicResourceGraphCensus(source);
const exported = api.createMK1AudioMusicResourceGraphCensusExport(report);
fs.writeFileSync(outPath, JSON.stringify(exported, null, 2));
console.log(JSON.stringify({
  status: report.status,
  verdict: report.decision.verdict,
  summary: report.summary,
  wavPathCount: report.sfxModule.pathPool.pathCount,
  linkedSequenceSymbolCount: report.linkedSequenceMidiSurface.linkedSymbolsPresent.length,
  directApplicationSequenceCallCount: report.linkedSequenceMidiSurface.directApplicationSequenceCallCount,
  samplesDat: report.opaqueSamplesDat,
  outPath
}, null, 2));
