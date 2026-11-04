#!/usr/bin/env node
/** O95U: bounded physical-window census, NOT interprocedural data-flow proof. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [fixture,out=repo]=process.argv.slice(2);if(!fixture)throw Error('usage: node scripts/run-mk2-o95u-copy-downstream-lookup.mjs <fixture> [output]');
const read=f=>fs.readFileSync(f),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),requireOk=(x,m)=>{if(!x)throw Error('O95U '+m)};
const b=read(path.join(path.resolve(fixture),'mk2.exe'));const canonical='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';requireOk(sha(b)===canonical,'canonical EXE');
const tbuf=read(path.join(repo,'mk2_animation_identity_copy_provenance_o95t_2026-10-08.json')),rbuf=read(path.join(repo,'mk2_animation_adjacent_index_extent_o95r_2026-10-08.json'));
const t=JSON.parse(tbuf),r=JSON.parse(rbuf),lookups=[...r.literalCallsites,...r.nonAdjacentCallsites];requireOk(t.sites.length===12&&lookups.length===253,'historical census');
const WINDOW=128;const rows=t.sites.map(s=>{
  const p=s.identityWriterPhysical,ins=b.subarray(p,p+3).toString('hex');requireOk(ins===s.writerInstructionHex,'writer bytes '+p.toString(16));
  const candidates=lookups.filter(l=>l.lookupCallPhysical>p&&l.lookupCallPhysical-p<=WINDOW).sort((a,z)=>a.lookupCallPhysical-z.lookupCallPhysical);
  const nearby=candidates.map(c=>{const a=c.lookupCallPhysical;requireOk(b[a]===0xe8,'direct call '+a.toString(16));const target=a+5+b.readInt32LE(a+1);requireOk(target===(c.family==='A'?0x918f1:0x91909),'family target '+a.toString(16));return {family:c.family,lookupPhysical:a,distanceBytes:a-p,index:c.index,callTargetPhysical:target,intervalSha256:sha(b.subarray(p,a+5)),sourceValueNumericallyKnown:false,copyValueReachesLookupProven:false};});
  return {writerPhysical:p,sourceKind:s.sourceKind,sourceBase:s.source,pointerBaseProvenance:s.pointerBaseProvenance,nearbyLookups:nearby};
});
const viable=rows.filter(x=>x.sourceKind==='OBJECT_FIELD_COPY'&&x.nearbyLookups.length);const counts={totalAudited:rows.length,objectFieldCopies:rows.filter(x=>x.sourceKind==='OBJECT_FIELD_COPY').length,globalScalarAssignments:rows.filter(x=>x.sourceKind==='GLOBAL_SCALAR_TO_IDENTITY').length,copySitesWithFollowingLookupWithin128Bytes:viable.length,copySitesWithoutFollowingLookupWithin128Bytes:10-viable.length,adjacentWindowEvidenceOnly:true};requireOk(viable.length===3,'three bounded proximity candidates');
const report={format:'mk2_animation_copy_identity_local_lookup_proximity_o95u_v1',status:'SUCCESS',source:{exeSha256:canonical,o95tSha256:sha(tbuf),o95rSha256:sha(rbuf)},windowBytes:WINDOW,sites:rows,counts,boundary:{codeAddressProximityNotExecutionReachability:true,objectIdentityNumericalValueNotProven:true,helperOrBranchProvenanceNotAssumed:true,noNewFixedIdentityWitness:true,witnessesStill7:true,terminalConsumersStill210:true,strongConsumersStill239:true,heldStill14:true,mk2ResearchClosed:false},next:'Pivot to palette selector table structural contracts and later resolve palette-handle selection at render time'};
fs.mkdirSync(out,{recursive:true});const fn=path.join(out,'mk2_animation_copy_identity_lookup_proximity_o95u_2026-10-08.json');fs.writeFileSync(fn,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:'PASS',copyCandidateSites:viable.map(x=>'0x'+x.writerPhysical.toString(16)),...counts,output:fn}));
