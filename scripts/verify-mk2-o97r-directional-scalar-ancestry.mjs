#!/usr/bin/env node
// Separate bounded byte/memory-address auditor for O97R; no producer imports.
import{readFileSync}from'node:fs';import{join}from'node:path';import{createHash}from'node:crypto';
const [fixture,root]=process.argv.slice(2),data=readFileSync(join(fixture,'mk2.exe')),report=JSON.parse(readFileSync(join(root,'mk2_mountain_profile_magnitude_scalar_ancestry_o97r_2026-10-09.json')));
const sha=x=>createHash('sha256').update(x).digest('hex');let checks=0;function ok(t,m){checks++;if(!t)throw Error(`FAIL ${m}`);}
ok(sha(data)==='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','fixture');
ok(report.priorO97qSha256===sha(readFileSync(join(root,'mk2_mountain_directional_threshold_dispatch_o97q_2026-10-09.json'))),'parent');
const start=0x755cf,end=0x7562b;ok(data.subarray(start,start+2).toString('hex')==='33c0','EAX zeroed');const store=[];
for(let off=start+2;off<end;off+=5){ok(data[off]===0xa3,'MOV [absolute],eax');let address=data.readUInt32LE(off+1);store.push(address);ok(report.initializer.zeroedGlobalAddresses.find(x=>x.physical===off)?.global===address,'reported write');}
ok(store.length===18,'total stores');ok(store.includes(0x75fda)&&store.includes(0x7615e),'input globals');ok(sha(data.subarray(start,end))===report.initializer.codeSha256,'init sha');
const c=data.subarray(0x633c9,0x63403);ok(c.toString('hex')==='bbda5f0700528b15c25f07008915645a07005a3b3d645a0700741cbb5e610700528b15466107008915645a07005a3b3d645a07007401c38903c3','selective zero code');ok(c.toString('hex')===report.singleActorClear.codeHex,'selective zero report');
const a=data.subarray(0x7cd08,0x7cd43);ok(a.toString('hex')==='b8da5f0700bb5e610700528b15c25f07008915645a07005a3b3d645a07007401938f05705a0700528b15705a070089105a528b15705a070089135a','dynamic assignment code');ok(a.toString('hex')===report.pairedActorAssignment.codeHex,'assignment report');
ok(data.subarray(0x821b9,0x821c6).toString('hex')==='8b15da5f0700528b155e610700','consumer reader');ok(report.hypotheses.inputsAreStaticallyKnownMountainScrollSpeeds==='UNPROVEN','no speed claims');
console.log(JSON.stringify({pass:'O97R',independent:'PASS',checks,failures:0,storedZeros:store.length}));
