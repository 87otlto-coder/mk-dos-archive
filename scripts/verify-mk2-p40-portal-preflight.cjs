#!/usr/bin/env node
/** P40 preflight: P39 independently authenticated PORTAL effects fill P38's
 * exact outside-scope source interval. Evidence-only; not a full extraction test.
 * No original game bytes, colors, timing, or artwork are embedded.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'docs', 'validation', name), 'utf8'));
const old = read('P38_TOMB_EFFECT_COVERAGE_2026-11-07.json');
const evidence = read('P39_PORTAL_SOURCE_AUDIT_2026-11-07.json');
const portal = old.coverage.resources.find(r => r.name === 'PORTAL.GRA');
assert(portal && portal.status === 'VERIFIED_INTERVAL_ACCOUNTING');
assert.equal(portal.resourceBytes, 92756);
assert.equal(portal.qualifiedReferences, 14);
assert.equal(portal.outsideScopeBytes, 21004);
assert.deepEqual(portal.gaps, [{start: 35912, endExclusive: 56916}]);
assert.equal(evidence.status, 'PASS');
assert.equal(evidence.graSha256, portal.upstreamAuthenticatedSha256);
assert.equal(evidence.frames.length, 20);
assert.equal(evidence.coverageReportIntegrated, false);

function verify(frames) {
  assert.equal(frames.length, 20, 'exactly twenty authentic effects');
  assert.equal(new Set(frames.map(f => f.assetId)).size, 20, 'unique effect IDs');
  for (const f of frames) {
    const original = evidence.frames.find(o => o.assetId === f.assetId);
    assert(original, 'unknown effect ID');
    for (const key of ['start','endExclusive','width','height','indicesSha256','maskSha256',
                       'encodedSha256','sourcePointerObject2','descriptorObject2']) {
      assert.equal(f[key], original[key], 'changed ' + key + ': ' + f.assetId);
    }
    assert(f.start >= 0 && f.start < f.endExclusive && f.endExclusive <= portal.resourceBytes);
  }
  const sorted = [...portal.intervals,
    ...frames.map(f => ({assetId: f.assetId,start: f.start,endExclusive: f.endExclusive}))]
    .sort((a,b) => a.start-b.start || a.endExclusive-b.endExclusive);
  let cursor = 0;
  for (const i of sorted) {
    assert.equal(i.start, cursor, 'gap or overlap');
    cursor = i.endExclusive;
  }
  assert.equal(cursor, 92756, 'complete exact source-byte accounting');
  assert.equal(sorted.length, 34, 'no artificial new image representations');
  return {qualifiedReferences: 34,coveredBytes: cursor,outsideScopeBytes: 0,
    duplicateOrOverlappingReferenceBytes: 0,newRepresentations: 0};
}
const result = verify(evidence.frames);
const altered = (index, patch) => evidence.frames.map((f,i) => i === index ? {...f,...patch} : f);
const negatives = [
  ['missing frame', evidence.frames.slice(1)],
  ['duplicated ID', [...evidence.frames.slice(0,-1), evidence.frames[0]]],
  ['changed start', altered(0,{start:evidence.frames[0].start+4})],
  ['changed end', altered(0,{endExclusive:evidence.frames[0].endExclusive-4})],
  ['changed width', altered(0,{width:evidence.frames[0].width+1})],
  ['changed index plane', altered(0,{indicesSha256:'0'.repeat(64)})],
  ['changed opacity plane', altered(0,{maskSha256:'0'.repeat(64)})],
  ['changed encoded source', altered(0,{encodedSha256:'0'.repeat(64)})],
  ['changed pointer', altered(0,{sourcePointerObject2:evidence.frames[0].sourcePointerObject2+4})],
  ['changed descriptor', altered(0,{descriptorObject2:evidence.frames[0].descriptorObject2+12})]
];
for (const [name, frames] of negatives) assert.throws(() => verify(frames), undefined, name);
console.log(JSON.stringify({pass:'P40_SOURCE_PREFLIGHT',status:'PASS',...result,
  negativeControlsRejected: negatives.length,
  scope:'committed evidence only; original binary export/integration and full regression not run'}, null, 2));
