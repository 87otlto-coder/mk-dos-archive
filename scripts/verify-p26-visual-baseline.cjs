#!/usr/bin/env node
/** Compare fresh MK1/MK3 decoded visual planes with the committed P21 record.
 * Whole MK1 evidence ZIP hashes are observations, not deterministic goldens:
 * research reports inside them contain per-run timestamps and operation IDs.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
assert.ok(process.argv[2],'Provide a fresh standard-suite or P26 report JSON');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const currentRecord=read(process.argv[2]),current=currentRecord.standardSuite||currentRecord;
const baseline=read(path.join(__dirname,'../docs/validation/P21_CHECKPOINT_REGRESSION_2026-11-06.json'));
assert.equal(current.status,'PASS','Fresh standard suite must pass');
const games=[];
for(const game of ['mk1','mk3']){
 const name=game+' compatibility',now=current.suites.find(s=>s.name===name),before=baseline.suites.find(s=>s.name===name);
 assert.ok(now&&before,'Both checkpoints must contain '+game);
 assert.equal(now.status,'PASS');assert.match(now.visualPlaneSha256,/^[0-9a-f]{64}$/);
 assert.equal(now.visualPlaneSha256,before.visualPlaneSha256,game+' original decoded visual planes changed');
 games.push({game,visualPlaneSha256:now.visualPlaneSha256,unchangedFromP21:true,
  wholeEvidenceArchiveHashesEqual:JSON.stringify(now.packageHashes)===JSON.stringify(before.packageHashes),
  wholeEvidenceArchiveCount:now.packageHashes.length});
}
console.log(JSON.stringify({status:'PASS',baselineCheckpoint:'P21',games,archiveByteIdentityRequired:false},null,2));
