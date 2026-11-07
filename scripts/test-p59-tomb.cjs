const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (m, file) => m._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'),
  {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText, file);

const {projectTombSamples, buildTombWitnessPackage} = require('../src/core/assets/mk2TombWitnessP59.ts');
async function run() {
  // Odd capture edges, a negative source shift, a transparent hole and an opaque zero index.
  const indices = Uint8Array.of(0, 5, 6, 7);
  const mask = Uint8Array.of(1, 0, 1, 1);
  const rgba = Uint8Array.from([1,2,3,255, 0,0,0,0, 3,4,5,255, 4,5,6,255]);
  const regions = [[1,7,1,7],[2,4,2,4]];
  const p = projectTombSamples(2, 2, rgba, indices, mask, regions, -1, -1);
  assert.equal(p.count, 3);
  assert.deepEqual([...p.sampled.keys()].filter(i => p.sampled[i]), [320,639,640]);
  assert.equal(p.values[320], 0);
  assert.equal(p.values[640], 7);
  assert.deepEqual(p.pixels.slice(1280,1284), rgba.slice(0,4));
  assert.throws(() => projectTombSamples(3,2,rgba,indices,mask,regions,0,0), /geometry/);
  assert.throws(() => projectTombSamples(2,2,rgba,indices,mask,[[0,638,0,2]],0,0), /bounds/);
  const a = {id:'mk2-stage-setup:tomb:object2_1737C', width:850, height:224,
    source:{path:'tomb.gra',offset:0,length:106784,sha256:'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613'},
    metadata:{setupObject2Offset:0x1737c,runtimeScreenPlacementKnown:false,finalDrawOrderKnown:false,nativeAnimationTimingKnown:false}};
  await assert.rejects(buildTombWitnessPackage([]), /expected one/);
  await assert.rejects(buildTombWitnessPackage([a,a]), /expected one/);
  await assert.rejects(buildTombWitnessPackage([{...a,width:320}]), /geometry/);
  await assert.rejects(buildTombWitnessPackage([{...a,metadata:{...a.metadata,finalDrawOrderKnown:true}}]), /runtime qualification/);
  await assert.rejects(buildTombWitnessPackage([a]), /missing planes/);
  await assert.rejects(buildTombWitnessPackage([{...a,rgba,metadata:{...a.metadata,indices,mask}}]), /digests/);
  console.log('PASS P59 sample coordinates, transparency, overlap, source and runtime qualification controls');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
