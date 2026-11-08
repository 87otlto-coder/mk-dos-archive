const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod,file) => mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}
}).outputText,file);
const {scanMK3} = require('../src/core/assets/mk3Collection.ts');
const {wavePcm} = require('../src/core/assets/wave.ts');
function scan(bytes) {
  return scanMK3({listRecursive: async () => [{path:'TEST.ASG',name:'TEST.ASG',extension:'ASG',size:bytes.length}],
    readSlice: async () => bytes}, () => {});
}
async function test() {
  const wav = Buffer.from(wavePcm(Uint8Array.of(42), 6000));
  const repeated = (await scan(Buffer.concat([wav,wav]))).assets;
  assert.equal(repeated.length,2);
  assert.equal(repeated[1].source.offset,wav.length);
  assert.equal(repeated[0].metadata.wavSha256,repeated[1].metadata.wavSha256);
  assert.notEqual(repeated[0].id,repeated[1].id);
  await assert.rejects(scan(wav.subarray(0,-1)), /exceeds/);
  const inner = Buffer.from(wav);
  inner.writeUInt32LE(3,40);
  await assert.rejects(scan(inner), /outside RIFF/);
  const ambiguous = Buffer.concat([wav,wav.subarray(36)]);
  ambiguous.writeUInt32LE(ambiguous.length-8,4);
  await assert.rejects(scan(ambiguous), /Ambiguous/);
  const tail = Buffer.concat([wav,Buffer.from([0])]);
  await assert.rejects(scan(tail), /Truncated/);
  const nonPcm = Buffer.from(wav);
  nonPcm.writeUInt16LE(7,20);
  const [asset] = (await scan(nonPcm)).assets;
  assert.equal(asset.metadata.encoding,7);
  assert.doesNotMatch(asset.confidence,/PCM/);
  console.log('PASS: repeated records retain offsets, four malformed intervals refused, non-PCM header qualified');
}
test().catch(e => {console.error(e); process.exitCode = 1;});
