#!/usr/bin/env node
// Run with the original MK3 installation as the sole argument. All exports stay in memory.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}
}).outputText, file);
const {scanMK3} = require('../src/core/assets/mk3Collection.ts');
const {selectedZip, metadata} = require('../src/core/assets/export.ts');
const {parseAnimationStoreZip} = require('../src/games/mk1/research/browserAnimationExportBundleValidation.ts');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

async function verify(root) {
  assert(root, 'Provide the original MK3 installation folder');
  const files = new Map(), entries = [];
  function visit(dir, prefix) {
    for (const item of fs.readdirSync(dir, {withFileTypes: true})) {
      const name = prefix + item.name, full = path.join(dir, item.name);
      if (item.isDirectory()) visit(full, name + '/');
      else if (item.isFile()) {
        const bytes = fs.readFileSync(full);
        files.set(name, bytes);
        entries.push({path: name, name: item.name, size: bytes.length, extension: path.extname(name).slice(1).toUpperCase()});
      }
    }
  }
  visit(root, '');
  const inputs = [...files.keys()].filter(p => /\.(FTR|ASG)$/i.test(p)).sort();
  assert.equal(sha(inputs.map(p => p + ' ' + sha(files.get(p))).join('\n')),
    'a3b096d4fa6a84701fe36290595ca442152401676685a749b53afe2358c082d9', 'Original ASG/FTR fingerprint');
  const collection = await scanMK3({listRecursive: async () => entries,
    readSlice: async (p, start, n) => new Uint8Array(files.get(p).subarray(start, start + n))}, () => {});
  assert.equal(collection.assets.length, 9186);
  const audio = collection.assets.filter(a => a.kind === 'audio');
  const zip = parseAnimationStoreZip(selectedZip(audio));
  const rows = JSON.parse(Buffer.from(zip.get('manifest.json').bytes)).selectionOrder;
  assert.deepEqual(rows, audio.map(metadata));
  assert.equal(zip.size, 1025);
  const expected = new Map(), exact = new Map(), rates = {};
  // Use CDIR entries directly, independently of the extractor's forward chunk walk.
  for (const [p, bytes] of files) {
    const regions = [];
    if (p.endsWith('.ASG')) regions.push({regionTag: 'ASG', regionOffset: 0, regionLength: bytes.length, chunkName: null, chunkHeaderOffset: null});
    if (p.endsWith('.FTR')) {
      const directory = bytes.readUInt32LE(8) + 32;
      for (let i = 0; i < bytes.readUInt16LE(4); i++) {
        const q = directory + 32*i, tag = bytes.toString('ascii', q, q+4);
        if (!['SPEC','CLAS'].includes(tag)) continue;
        const header = bytes.readUInt32LE(q+16);
        regions.push({regionTag: tag, regionOffset: header+32, regionLength: bytes.readUInt32LE(q+20),
          chunkName: bytes.toString('ascii', q+6, q+14).split('\0')[0].trimEnd(), chunkHeaderOffset: header});
      }
    }
    for (const r of regions) { r.next = r.regionOffset; r.count = 0; }
    const parentHash = regions.length ? sha(bytes) : null;
    // Search every installed file for literal RIFF/WAVE headers, including outside known regions.
    for (let o = bytes.indexOf('RIFF'); o >= 0; o = bytes.indexOf('RIFF', o+1)) {
      if (bytes.toString('ascii', o+8, o+12) !== 'WAVE') continue;
      const owners = regions.filter(r => r.next === o && o < r.regionOffset + r.regionLength);
      assert.equal(owners.length, 1, 'Unaccounted WAVE ' + p + '@' + o);
      const r = owners[0], n = bytes.readUInt32LE(o+4)+8;
      r.next = o + n + n%2;
      assert(r.next <= r.regionOffset + r.regionLength);
      const wav = bytes.subarray(o,o+n), digest = sha(wav);
      if (exact.has(digest)) assert.deepEqual(wav, exact.get(digest));
      else exact.set(digest,wav);
      let fmt, dataLength, q = 12;
      while (q < n) {
        const tag = wav.toString('ascii',q,q+4), size = wav.readUInt32LE(q+4);
        if (tag === 'fmt ') {
          assert(!fmt && size >= 16);
          fmt = {encoding:wav.readUInt16LE(q+8),channels:wav.readUInt16LE(q+10),sampleRate:wav.readUInt32LE(q+12),
            byteRate:wav.readUInt32LE(q+16),blockAlign:wav.readUInt16LE(q+20),bits:wav.readUInt16LE(q+22)};
        }
        if (tag === 'data') { assert.equal(dataLength,undefined); dataLength = size; }
        q += 8 + size + size%2;
      }
      assert.equal(q,n); assert(fmt && dataLength > 0);
      assert.deepEqual([fmt.encoding,fmt.channels,fmt.bits,fmt.blockAlign,fmt.byteRate],[1,1,8,1,fmt.sampleRate]);
      rates[fmt.sampleRate] = (rates[fmt.sampleRate] || 0) + 1;
      const {next,count,...region} = r;
      expected.set(p+'@'+o,{wav,source:{path:p,offset:o,length:n,sha256:parentHash}, filename:p+'_'+o.toString(16)+'.wav',
        metadata:{...fmt,dataLength,duration:dataLength/fmt.byteRate,...region,recordIndex:r.count++,wavSha256:digest}});
    }
    for (const r of regions) assert.equal(r.next, r.regionOffset+r.regionLength);
  }
  assert.equal(expected.size,1024); assert.equal(exact.size,673);
  assert.deepEqual(rates,{6000:451,11025:573});
  for (const [i,row] of rows.entries()) {
    const e = expected.get(row.id);
    assert(e && expected.delete(row.id));
    assert.deepEqual(row.source,e.source); assert.deepEqual(row.metadata,e.metadata); assert.equal(row.filename,e.filename);
    assert.deepEqual(Buffer.from(zip.get('assets/'+String(i).padStart(5,'0')+'_'+e.filename).bytes),e.wav);
  }
  assert.equal(expected.size,0);
  console.log('PASS: 9186 assets, 1024 original intervals and selected WAVs, 673 distinct byte strings', rates);
}
verify(process.argv[2]).catch(e => { console.error(e); process.exitCode = 1; });
