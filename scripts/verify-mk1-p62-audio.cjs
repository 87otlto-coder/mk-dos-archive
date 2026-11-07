#!/usr/bin/env node
/** P62 current-source original MK1 acceptance. Original files stay outside Git.
 * node scripts/verify-mk1-p62-audio.cjs <original MK1 folder>
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const {scanAssets}=require('../src/core/assets/collection.ts');
const root=process.argv[2];assert(root,'Provide original MK1 folder');
const data=new Map();
function walk(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=prefix?prefix+'/'+e.name:e.name,full=path.join(dir,e.name);if(e.isDirectory())walk(full,p);else if(e.isFile())data.set(p,new Uint8Array(fs.readFileSync(full)));}}
walk(root);
const source={directoryName:'P62 original MK1',isSynthetic:false,
 async listRecursive(){return [...data].map(([p,b])=>({path:p,name:path.basename(p),extension:path.extname(p).slice(1).toUpperCase(),size:b.length}));},
 async readSlice(p,start,count){const b=data.get(p);if(!b)throw Error('Missing source '+p);return b.slice(start,start+count);}};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const { selectedZip } = require('../src/core/assets/export.ts');
const { parseAnimationStoreZip } = require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');

// Read the O63-qualified physical ranges directly from the original EXE.
function executableBindings(exe) {
  const base = 0x8ca54, bindings = new Map(), paths = new Set();
  function readPath(offset) {
    const end = exe.indexOf(0, offset);
    assert(end >= offset && end < base + 0x22beb);
    return exe.toString('ascii', offset, end).replaceAll('\\', '/').toUpperCase();
  }
  for (let p = base + 0x2202c; p < base + 0x22beb;) {
    const name = readPath(p);
    paths.add(name);
    p += name.length + 1;
  }
  for (let code = 0; code < 533; code++) {
    const record = base + 0x1ee34 + 24 * code;
    const pointer = exe.readUInt32LE(record);
    if (!pointer) continue;
    const name = readPath(base + pointer);
    assert(paths.has(name) && !bindings.has(name));
    let policy = 'ONE_SHOT';
    if (code < 32) policy = exe[base + 0x1ee14 + code] ? 'STOP_ALL_THEN_PLAY_FOREVER' : 'STOP_ALL_THEN_ONE_SHOT';
    bindings.set(name, { code, policy, length: exe.readUInt32LE(record + 4) });
  }
  assert.equal(paths.size, 244);
  assert.equal(bindings.size, 243);
  return { bindings, paths };
}

(async () => {
  const exe = Buffer.from(data.get('MK1.EXE'));
  assert.equal(sha(exe), '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14');
  const { bindings, paths } = executableBindings(exe);
  const collection = await scanAssets(source, 'mk1', () => {});
  assert.equal(collection.assets.length, 2656);
  const audio = collection.assets.filter(a => a.kind === 'audio');
  assert.equal(audio.length, 244);
  const zip = parseAnimationStoreZip(selectedZip(audio));
  const rows = JSON.parse(Buffer.from(zip.get('manifest.json').bytes)).selectionOrder;
  assert.equal(rows.length, 244);
  assert.equal(zip.size, 245);
  for (const [i, row] of rows.entries()) {
    const original = data.get(row.source.path);
    const key = row.source.path.toUpperCase();
    assert(paths.delete(key), 'unexpected or duplicate WAV ' + key);
    assert.deepEqual(row.source, { path: row.source.path, offset: 0, length: original.length, sha256: sha(original) });
    assert.equal(row.id, 'audio/wav/' + row.source.path);
    assert.equal(row.metadata.packagePath, row.id);
    assert.equal(row.name, path.basename(row.source.path));
    assert.equal(row.filename, row.id.replaceAll('/', '_'));
    const wav = zip.get('assets/' + String(i).padStart(5, '0') + '_' + row.filename).bytes;
    assert.deepEqual(Buffer.from(wav), Buffer.from(original));
    const rec = bindings.get(key);
    if (rec) assert.equal(rec.length, original.length);
    assert.equal(row.metadata.soundCode, rec?.code ?? null);
    assert.equal(row.metadata.soundCodeHex, rec ? '0x' + rec.code.toString(16).toUpperCase().padStart(3, '0') : null);
    assert.equal(row.metadata.playbackPolicy, rec?.policy ?? 'NO_RECORD_BINDING');
    assert.equal(row.metadata.tableBinding, rec ? 'RECORD_BOUND' : 'PATH_POOL_ONLY_UNBOUND');
    assert.equal(row.metadata.semanticNameStatus, 'CANONICAL_INSTALLATION_IDENTIFIER_ONLY_GAMEPLAY_MEANING_UNRESOLVED');
    const b = Buffer.from(original);
    const chunks = new Map();
    for (let p = 12; p + 8 <= b.length;) {
      const length = b.readUInt32LE(p + 4);
      assert(p + 8 + length <= b.length);
      chunks.set(b.toString('ascii', p, p + 4), b.subarray(p + 8, p + 8 + length));
      p += 8 + length + (length % 2);
    }
    const fmt = chunks.get('fmt ');
    assert.equal(row.metadata.sampleRate, fmt.readUInt32LE(4));
    assert.equal(row.metadata.channels, fmt.readUInt16LE(2));
    assert.equal(row.metadata.bitsPerSample, fmt.readUInt16LE(14));
    assert.equal(row.metadata.dataByteLength, chunks.get('data').length);
  }
  assert.equal(paths.size, 0);
  console.log('PASS 2656 MK1 assets, 244 original and selected-ZIP WAVs, 243 EXE bindings and one path-only WAV');
})().catch(error => { console.error(error); process.exitCode = 1; });
