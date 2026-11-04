// O191 bounded synthetic-fixture browser test, no commercial files required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mkdos-o191-'));
const compiled = path.join(tmp, 'compiled');
fs.writeFileSync(path.join(tmp, 'node-shim.d.ts'), 'declare const process: { env: Record<string, string | undefined>; platform: string };\n');
try {
  execFileSync('tsc', [
    '--outDir', compiled, '--target', 'es2022', '--module', 'commonjs',
    '--moduleResolution', 'node', '--lib', 'dom,es2022', '--skipLibCheck',
    path.join(tmp, 'node-shim.d.ts'),
    path.join(root, 'src/core/assets/mk1ReadOnlyFallback.ts'),
    path.join(root, 'src/core/assets/collection.ts'),
    path.join(root, 'src/core/filesystem/DirectorySource.ts'),
  ], { cwd: root, stdio: 'pipe' });
  const { MemoryDirectorySource } = require(path.join(compiled, 'core/filesystem/DirectorySource.js'));
  const { scanAssets } = require(path.join(compiled, 'core/assets/collection.js'));
  const layout = require(path.join(root, 'tests/fixtures/mk1_o191_kano_descriptor_layout.json')).descriptors;
  const write16 = (b, p, v) => { b[p] = v & 255; b[p + 1] = v >>> 8 & 255; };
  const write32 = (b, p, v) => { b[p] = v & 255; b[p + 1] = v >>> 8 & 255; b[p + 2] = v >>> 16 & 255; b[p + 3] = v >>> 24 & 255; };
  const exe = new Uint8Array(1157222);
  exe.set([77, 90], 0);
  const gra = new Uint8Array(595504);
  for (const d of layout) {
    const p = d.exeOffset, off = d.graOffset;
    write16(exe, p, d.width); write16(exe, p + 2, d.height);
    write16(exe, p + 4, d.x); write16(exe, p + 6, d.y);
    write32(exe, p + 8, ((35 << 24) | off) >>> 0);
    // Synthetic all-transparent rows. This exercises the structural decoder
    // with no original GRA pixel content in the repository.
    for (let row = 0; row < d.height; row++) write32(gra, off + row * 4, d.width * 2 + 1);
  }
  async function run() {
    const source = new MemoryDirectorySource('edited-mk1-test');
    source.setFile('MK1.EXE', exe);
    source.setFile('GRAPHICS/KANO.GRA', gra);
    source.setFile('GRAPHICS/JCATT.GRA', new Uint8Array(49402));
    const result = await scanAssets(source, 'mk1', () => {});
    assert.equal(result.reports.mode, 'MK1_READ_ONLY_FALLBACK');
    assert.equal(result.reports.indexedKanoFrames, 187);
    assert.equal(result.assets.filter(a => a.kind === 'sprite').length, 187);
    assert.equal(result.assets.filter(a => a.kind === 'raw').length, 2);
    assert.equal(result.assets.find(a => a.name === 'KANO.GRA').bytes.length, gra.length);
    assert.equal(result.assets.find(a => a.name === 'KANO.GRA').bytes[0], gra[0]);
    assert.equal(result.assets.find(a => a.name === 'KANO.GRA').source.sha256.length, 64);
    assert.ok(result.limitations.some(v => /canonical/.test(v)));
    const edited = exe.slice(); edited[layout[2].exeOffset + 8] = 0x22; // invalid file ID
    const bad = new MemoryDirectorySource('mismatched-mk1');
    bad.setFile('MK1.EXE', edited); bad.setFile('GRAPHICS/KANO.GRA', gra);
    const downgraded = await scanAssets(bad, 'mk1', () => {});
    assert.equal(downgraded.reports.indexedKanoFrames, 0);
    assert.equal(downgraded.assets.filter(a => a.kind === 'raw').length, 1);
    const missing = new MemoryDirectorySource('empty');
    missing.setFile('MK1.EXE', exe);
    await assert.rejects(scanAssets(missing, 'mk1', () => {}), /No MK1 \.GRA/);
    console.log('O191 smoke: modified input browsable; 187 bounded previews; corruption downgraded; missing resources rejected; no writes. PASS');
  }
  run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => fs.rmSync(tmp, { recursive: true, force: true }));
} catch (error) {
  fs.rmSync(tmp, { recursive: true, force: true });
  throw error;
}
