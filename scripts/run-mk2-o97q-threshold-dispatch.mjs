#!/usr/bin/env node
// O97Q: bounded code-selected table dispatch; deliberately model the anomalous tail.
import {readFileSync,writeFileSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';
const [fixture,root]=process.argv.slice(2),b=readFileSync(join(fixture,'mk2.exe'));const sha=x=>createHash('sha256').update(x).digest('hex');
if(sha(b)!=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')throw Error('fixture');
const prior=readFileSync(join(root,'mk2_mountain_directional_transform_threshold_tables_o97p_2026-10-09.json')), P=JSON.parse(prior);if(P.status!=='PASS'||P.tables.length!==2)throw Error('parent');
const at=(a,n)=>b.subarray(a,a+n).toString('hex');
// Each byte witness is in precisely the inspected direct code path, not an inferred instruction or data reference.
for(const [a,s] of [[0x82178,'c705645a0700905f0100'],[0x82182,'b96c080200'],[0x821aa,'c705645a0700dc5f0100'],[0x821b4,'b9a3090200'],[0x821b9,'8b15da5f0700'],[0x821c0,'8b155e610700'],[0x821cd,'f7c2ffffffff'],[0x821d5,'f7da'],[0x821e3,'f71d6c5a0700'],[0x821e9,'3b156c5a0700'],[0x821ef,'7306'],[0x821f7,'f7c2ffffffff'],[0x8220d,'8b0d6c5a0700'],[0x82213,'8b09'],[0x82215,'83056c5a070004'],[0x8221c,'f7c1ffffffff'],[0x82228,'3bca'],[0x8222a,'7309'],[0x8222c,'83056c5a070004'],[0x82235,'8b0d6c5a0700'],[0x8223b,'8b09'],[0x8224b,'ffd1'],[0x82317,'b80c00000033d2f7f2']]){if(at(a,s.length/2)!==s)throw Error(`opcode ${a.toString(16)} ${at(a,s.length/2)} != ${s}`);}
const probes=[0,1,0xffff,0x10000,0x10001,0x20000,0x20001,0x28000,0x28001,0x30000,0x30001,0x40000,0x40001,0x60000,0x60001,0x70000,0x70001,0x80000,0x80001,0x9ffff,0xa0000,0xa0001,0xffffffff];
const selections=[];
for(const T of P.tables){const fallback=T.direction==='positive'?2:11;
 for(const magnitude of probes){let winner=null;
  if(magnitude===0)winner={type:'zero-default',profileIndex:fallback};
  else {for(const r of T.rows){if(magnitude<=r.threshold){winner={type:'threshold',profileIndex:r.profileIndex,threshold:r.threshold,ordinal:r.ordinal};break;}}
       if(!winner)winner={type:'zero-sentinel',codePath:'0x82317 (zero divisor)',noSuccessfulProfile:true};}
  selections.push({direction:T.direction,magnitude,selection:winner});
 }
}
const reached=Object.fromEntries(P.tables.map(T=>[T.direction,[...new Set(selections.filter(x=>x.direction===T.direction && x.selection.profileIndex!==undefined).map(x=>x.selection.profileIndex))].sort((a,b)=>a-b)]));
if(reached.positive.includes(7)||reached.negative.includes(16))throw Error('nonmonotonic impossible');
const out={format:'mk2_o97q_conditional_threshold_walker_v1',status:'PASS',fixtureSha256:sha(b),priorO97pSha256:sha(prior),codeBounds:{tableSelector:0x82178,negativeSelector:0x821aa,absoluteMagnitudeBlock:[0x821b9,0x821f7],thresholdLoop:[0x8220d,0x8223d],indirectCall:0x8224b,zeroSentinelTrap:0x82317},scalars:{firstGlobal:0x75fda,secondGlobal:0x7615e,operation:'unsigned-maximum of separately absolute-valued 32-bit inputs; signed INT_MIN overflow special case not resolved'},probes,selections,demonstratedProfilesByProbes:reached,hypotheses:{twoDirectionSelectorBranches:'SUPPORTED_CONDITIONALLY',zeroMagnitudeCallsMiddleFallback:'SUPPORTED',firstThresholdGreaterOrEqualWins:'SUPPORTED',trailing0x80000EntryReachableThroughAscendingScan:'REJECTED',magnitudeAbove0xA0000HasSafeClampedFallback:'REJECTED',executesSpecificMountainTransform:'UNPROVEN',all18FunctionsReachableThroughThisWalker:'REJECTED',wallClockScrollSpeed:'UNPROVEN'},limits:'Simulation applies exact code selection to chosen test magnitudes, not observed runtime values. The table tail is deliberately nonmonotone (0xA0000 then 0x80000); the last entries (profile 7 and 16) have no successful first-ge case here. Magnitudes above 0xA0000 reach an explicit zero-sentinel divide-by-zero path if no external invariant constrains them. Special signed INT_MIN negation edge and antecedent branch reachability are not globally resolved.'};
writeFileSync(join(root,'mk2_mountain_directional_threshold_dispatch_o97q_2026-10-09.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({pass:'O97Q',status:'PASS',probeCount:selections.length,reached}));
