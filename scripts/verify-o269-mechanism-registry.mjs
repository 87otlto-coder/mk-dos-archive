#!/usr/bin/env node
/** O269: bounded MK1+MK2 research catalogue validation; no game mutations. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateMechanismRegistry, selectMechanisms, evidenceForMechanism } from '../src/core/research/mechanismEvidenceRegistry.ts';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryFile = path.join(root,'research_outputs','O269_MK_DOS_MECHANISM_REGISTRY.json');
const registry = validateMechanismRegistry(JSON.parse(fs.readFileSync(registryFile,'utf8')));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
let existenceChecks=0;
const sourceHashes = [];
for(const mech of registry.mechanisms) for(const ev of mech.evidence) {
  const f=path.resolve(root,ev.path);
  if(!f.startsWith(root+path.sep) || !fs.statSync(f,{throwIfNoEntry:false})?.isFile())throw Error(`unresolved evidence ${mech.id}: ${ev.path}`);
  existenceChecks++;
  sourceHashes.push({mechanism:mech.id,path:ev.path,sha256:digest(fs.readFileSync(f))});
}
const fixtureChecks=[];
const pathFromArg=process.argv.indexOf('--mk2-exe');
if(pathFromArg>=0){
  const bin=fs.readFileSync(process.argv[pathFromArg+1]);
  if(digest(bin)!==registry.fixtures.mk2.sha256)throw Error('MK2 fixture hash mismatch');
  const anchors={
    'pit_forced_transfer': [0x670ac,'e8 6f e3 ff ff'],
    'pit_video_transfer_mode': [0x65420,'83 3d 4c 01 03 00 03 75 70'],
    'pit_differential_copy': [0x65f50,'89 45 00'],
  };
  for(const [id,[offset,bytes]] of Object.entries(anchors)){
    const expected=Buffer.from(bytes.replaceAll(' ',''),'hex');
    if(!bin.subarray(offset,offset+expected.length).equals(expected))throw Error(`failed binary anchor: ${id}`);
    fixtureChecks.push({id,physicalOffset:'0x'+offset.toString(16).toUpperCase()});
  }
}
const negativeControls = [
  r => {r.mechanisms[0].game='mk2'},
  r => {r.mechanisms[0].id=r.mechanisms[1].id},
  r => {r.mechanisms[0].evidence=[]},
  r => {r.mechanisms[0].evidence[0].path='../MK1.EXE'},
  r => {r.mechanisms[0].limitations=[]},
  r => {r.mechanisms[8].confidence='LIVE_DEBUGGER_WITNESSED'; r.mechanisms[8].evidence=[{kind:'source',path:'README.md'}]},
  r => {r.mechanisms[0].addresses=[{space:'unknown',hex:'0x1234'}]},
  r => {r.crossGameCandidates[0].promotion='MK_DOS_FAMILY_VERIFIED'},
  r => {r.crossGameCandidates[0].mk2='mk2.does_not_exist'},
  r => {r.fixtures.mk3.sha256=r.fixtures.mk2.sha256},
  r => {r.fixtures.mk1.sha256='000'},
  r => {r.mechanisms[10].confidence='SOURCE_VERIFIED_RUNTIME_PENDING'; r.mechanisms[10].limitations=['Everything done.']},
];
for(const [i,mutate] of negativeControls.entries()){
  const copy=structuredClone(registry);mutate(copy);
  let rejected=false;try{validateMechanismRegistry(copy)}catch{rejected=true}
  if(!rejected)throw Error(`negative control ${i} accepted`);
}
if(selectMechanisms(registry,{game:'mk1'}).length!==5 || selectMechanisms(registry,{game:'mk2'}).length!==6)throw Error('cross-game selection regression');
if(evidenceForMechanism(registry,'mk2.palette_dac').length!==2)throw Error('evidence join regression');
const result={schema:'mk_dos_o269_mechanism_registry_verification_v1', sourceRegistrySha256:digest(fs.readFileSync(registryFile)),
  fixtureSha256:registry.fixtures, mechanismCount:registry.mechanisms.length,
  byGame:{mk1:5,mk2:6}, crossGameCandidateCount:registry.crossGameCandidates.length,
  crossGamePromotionsToFamily:0, evidenceFilesVerified:existenceChecks, negativeControlsRejected:negativeControls.length,
  executableAnchorsChecked:fixtureChecks, evidenceFileHashes:sourceHashes.sort((a,b)=>a.mechanism.localeCompare(b.mechanism)||a.path.localeCompare(b.path)),
  mk1CanonicalBinaryRetested:false, mk2CanonicalBinaryRetested:fixtureChecks.length>0,
  appFeatureModifications:0};
const outidx=process.argv.indexOf('--output');
if(outidx>=0)fs.writeFileSync(process.argv[outidx+1],JSON.stringify(result,null,2)+'\n');
console.log(`O269 PASS: ${result.mechanismCount} mechanisms, ${existenceChecks} evidence files, ${negativeControls.length} negative controls, ${fixtureChecks.length} live-binary anchors`);
