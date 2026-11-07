#!/usr/bin/env node
/** P62 source-only WAV provenance controls, no original commercial data. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
if(!globalThis.crypto)globalThis.crypto=crypto.webcrypto;
const { mk1AudioAsset } = require('../src/core/assets/mk1AudioAsset.ts');
const bytes = Uint8Array.of(10, 20);
const sourcePath = 'SFX/FIXTURE.WAV';
const packagePath = 'audio/wav/' + sourcePath;
const row = { sourcePath, packagePath, byteLength: bytes.length, fileName: 'FIXTURE.WAV',
  sha256: crypto.createHash('sha256').update(bytes).digest('hex'), soundCode: null,
  tableBinding: 'PATH_POOL_ONLY_UNBOUND', playbackPolicy: 'NO_RECORD_BINDING' };
const asset = mk1AudioAsset(packagePath, bytes, row);
assert.deepEqual(asset.source, { path: sourcePath, offset: 0, length: 2, sha256: row.sha256 });
assert.equal(asset.metadata.soundCode, null);
assert.equal(asset.metadata.playbackPolicy, 'NO_RECORD_BINDING');
assert.equal(asset.bytes, bytes);
for (const invalid of [undefined, {...row, packagePath: sourcePath}, {...row, sourcePath: packagePath}, {...row, byteLength: 1}]) {
  assert.throws(() => mk1AudioAsset(packagePath, bytes, invalid), /O64 evidence/);
}
console.log('PASS MK1 WAV provenance and four invalid evidence joins');
