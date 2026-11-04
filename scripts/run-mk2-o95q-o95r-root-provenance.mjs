#!/usr/bin/env node
/** O95Q + O95R: independently bounded root entries and immediate-index geometry.
 * No identity/index cross-product is treated as an authenticated runtime selection. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [fixtureArg,outArg]=process.argv.slice(2);
if(!fixtureArg)throw Error('Usage: node scripts/run-mk2-o95q-o95r-root-provenance.mjs <mk2-fixture-dir> [output-dir]');
const fixture=path.resolve(fixtureArg), out=path.resolve(outArg??repo);
const exe=fs.readFileSync(path.join(fixture,'mk2.exe'));
const pin='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const need=(c,msg)=>{if(!c)throw Error(msg)};
need(sha(exe)===pin,'Noncanonical MK2 executable');
const files={O95B:'mk2_animation_root_structural_graph_o95b_2026-10-07.json',O95P:'mk2_animation_exportability_closure_ledger_o95p_2026-10-08.json'};
const src=Object.fromEntries(Object.entries(files).map(([k,v])=>{const b=fs.readFileSync(path.join(repo,v));return [k,{file:v,hash:sha(b),value:JSON.parse(b)}]}));
const B=src.O95B.value,P=src.O95P.value;
need(B.status==='SUCCESS'&&P.status==='SUCCESS'&&P.consumerCoverage.authenticatedDirectLookups===253,'Prerequisite invalid');
const U=p=>exe.readUInt32LE(p),H=p=>exe.readUInt16LE(p),I=p=>exe.readInt32LE(p);
const LE=0x28f0c,DATA=0x61c54;
const pageSize=U(LE+0x28),nPages=U(LE+0x14),objtab=LE+U(LE+0x40),objcount=U(LE+0x44),map=LE+U(LE+0x48),fpt=LE+U(LE+0x68),frt=LE+U(LE+0x6c);
need(pageSize===4096&&objcount===2,'Unexpected LE geometry');
const objects=Array.from({length:objcount},(_,i)=>({id:i+1,start:U(objtab+i*24+12),count:U(objtab+i*24+16)}));
const physPages=Array.from({length:nPages},(_,i)=>(exe[map+i*4]<<16)|(exe[map+i*4+1]<<8)|exe[map+i*4+2]);
const pagePhys=lp=>DATA+(physPages[lp-1]-1)*pageSize;
const objPhys=(obj,off)=>{const z=objects[obj-1],pg=Math.floor(off/pageSize);return pg<z.count?pagePhys(z.start+pg)+off%pageSize:null};
const pageOwner=lp=>objects.find(o=>lp>=o.start&&lp<o.start+o.count);
const po=Array.from({length:nPages+1},(_,i)=>U(fpt+i*4));
const fix=new Map();let allFix=0,duplicateFixupSources=0;
for(let pg=0;pg<nPages;pg++){
 let p=frt+po[pg],end=frt+po[pg+1],o=pageOwner(pg+1);need(!!o,'Missing page ownership');
 while(p<end){
  const stByte=exe[p++],flags=exe[p++],st=stByte&15;need(!(stByte&0x20),'Source-list fixup unhandled');
  const sourceOffset=exe.readInt16LE(p);p+=2;need((flags&3)===0,'Noninternal fixup');
  const width=flags&0x40?2:1, targetObj=width===2?H(p):exe[p];p+=width;
  let targetOff=0;if(st!==2){targetOff=(flags&0x10)?U(p):H(p);p+=(flags&0x10)?4:2;}
  if(flags&4)p+=(flags&0x20)?4:2;
  const sourceObjectOffset=(pg+1-o.start)*pageSize+sourceOffset,key=`${o.id}:${sourceObjectOffset}`;
  if(fix.has(key))duplicateFixupSources++;
  fix.set(key,{sourceObject:o.id,sourceOffset:sourceObjectOffset,sourcePhysical:pagePhys(pg+1)+sourceOffset,targetObj,targetOff,targetPhysical:objPhys(targetObj,targetOff),type:st});allFix++;
 }
 need(p===end,'Relocation page parse overrun');
}
const he=n=>'0x'+n.toString(16).toUpperCase();
const lookup={A:0x918f1,B:0x91909};
const roots=[],entries=[];
for(const fam of B.families){
 const rootLookup=new Map(fam.rootRows.map(r=>[r.rootObject2Offset,r]));
 need(fam.slotRoots.length===17,'Root slots missing');
 for(const root of fam.rootRows){
  const one=new Map(root.oneHopKnownDescriptors.map(x=>[x.entryIndex,x]));
  let n=0;
  for(let idx=0;idx<root.contiguousRelocatableEntryCount;idx++){
   const ent=fix.get(`2:${root.rootObject2Offset+4*idx}`);
   need(!!ent&&ent.type===7&&ent.targetObj===2,'Root entry not relocation-backed');
   const second=fix.get(`2:${ent.targetOff}`),w=one.get(idx);
   if(w)need(!!second&&second.type===7&&second.targetObj===2&&second.targetOff===w.descriptorObject2Offset,'Known one-hop descriptor disagrees with fixture');
   entries.push({family:fam.label,rootObject2Offset:root.rootObject2Offset,entryIndex:idx,entryObject2Offset:ent.sourceOffset,entryPhysical:ent.sourcePhysical,targetObject2Offset:ent.targetOff,targetPhysical:ent.targetPhysical,secondHopFixupPresent:!!second,secondHopTargetObject2Offset:second?.targetOff??null,knownDescriptorWitness:w?{descriptorObject2Offset:w.descriptorObject2Offset,resourceName:w.resourceName,graOffset:w.graOffset}:null,authenticatedRuntimeSelection:false,universalStreamGrammarAssigned:false});
   n++;
  }
  const next=fix.get(`2:${root.rootObject2Offset+4*n}`);
  need(!(next&&next.type===7&&next.targetObj===2),'Truncated root relocation run');
  roots.push({family:fam.label,rootObject2Offset:root.rootObject2Offset,aliases:root.slots,entryCount:n,oneHopKnownDescriptorCount:one.size});
 }
 for(const slot of fam.slotRoots){
  const f=fix.get(`2:${fam.tableObject2Offset+4*slot.slot}`);
  need(!!f&&f.targetOff===slot.rootObject2Offset&&f.type===7&&f.targetObj===2,'Identity table fixup mismatch');
  need(rootLookup.has(slot.rootObject2Offset),'Unknown root slot');
 }
}
need(entries.length===925&&roots.length===26,'Unexpected root entry geometry');
const known=entries.filter(x=>x.knownDescriptorWitness);
need(known.length===117,'O95B one-hop count mismatch');
const wids=P.boundedFixedIdentityWitnesses.witnesses;
const witnesses=wids.map(w=>{
 const fam=B.families.find(f=>f.label===w.family),slot=fam.slotRoots.find(s=>s.slot===w.identitySlot);
 need(!!slot&&Number.isInteger(w.nestedIndex),'Not a fixed numeric witness');
 const entry=entries.find(x=>x.family===w.family&&x.rootObject2Offset===slot.rootObject2Offset&&x.entryIndex===w.nestedIndex);
 const expected=parseInt(w.streamObject2OffsetHex,16);
 need(!!entry&&entry.targetObject2Offset===expected,`Fixture-selected pointer differs for ${w.id}`);
 return {...w,rootObject2Offset:slot.rootObject2Offset,entryObject2Offset:entry.entryObject2Offset,exactRootEntryTargetVerified:true};
});
for(const w of witnesses){const e=entries.find(x=>x.family===w.family&&x.rootObject2Offset===w.rootObject2Offset&&x.entryIndex===w.nestedIndex);need(!!e&&!e.authenticatedRuntimeSelection,'Duplicate witness promotion');e.authenticatedRuntimeSelection=true;e.fixedWitnessId=w.id;}
const uniqueEntryOffsets=new Set(entries.map(e=>e.entryObject2Offset));
const uniqueTargets=new Set(entries.map(e=>e.targetObject2Offset));
const uniqueOneHopOffsets=new Set(known.map(e=>e.entryObject2Offset));
const q={format:'mk2_o95q_root_entry_provenance_v1',status:'SUCCESS',source:{fixtureExeSha256:pin,o95b:src.O95B.hash,o95p:src.O95P.hash},boundary:{rebuildFixupsFromAuthenticExecutable:true,oneHopMatchesUseO95BQualifiedDescriptorEvidence:true,unknownStreamAndRuntimeIdentityRemainsUnknown:true},roots,entries,witnesses,counts:{familyAEntries:entries.filter(e=>e.family==='A').length,familyBEntries:entries.filter(e=>e.family==='B').length,familyRootEntries:entries.length,distinctObject2EntryOffsets:uniqueEntryOffsets.size,distinctTargetObject2Offsets:uniqueTargets.size,oneHopKnownDescriptorInstances:known.length,distinctKnownDescriptorEntryOffsets:uniqueOneHopOffsets.size,exactRuntimeFixedIdentityWitnesses:witnesses.length,entryInstancesWithoutFixedWitness:entries.length-witnesses.length},decision:{mk2AnimationExportClosed:false,all925EntriesExportable:false,timingEstablished:false,consumerSpecificGrammarRequired:true,nextPass:'O95R — static adjacent literal-index root extent compatibility; no runtime identity inference'}};
const calls={A:[],B:[]};
for(let p=0;p+5<=exe.length;p++)if(exe[p]===0xe8){let t=p+5+I(p+1);if(t===lookup.A)calls.A.push(p);else if(t===lookup.B)calls.B.push(p);}
need(calls.A.length===144&&calls.B.length===109,'Callsite census changed');
const byFamily=new Map(B.families.map(f=>[f.label,f]));
const literal=[],unresolved=[];
for(const [fam,cs] of Object.entries(calls)){
 const f=byFamily.get(fam);
 for(const p of cs){
  let index=null,kind=null;
  if(p>=10&&exe.subarray(p-10,p-4).equals(Buffer.from('c705785a0700','hex'))){index=U(p-4);kind='MOV_MEM_IMM32';}
  else if(p>=10&&exe[p-10]===0xb8&&exe.subarray(p-5,p).equals(Buffer.from('a3785a0700','hex'))){index=U(p-9);kind='MOV_EAX_IMM32_THEN_STORE';}
  if(index===null){unresolved.push({family:fam,lookupCallPhysical:p,lookupCallPhysicalHex:he(p),index:'UNQUALIFIED_NONADJACENT'});continue;}
  const inExtent=f.slotRoots.filter(s=>index<rootLookupDummy(f,s.rootObject2Offset)).map(s=>s.slot);
  const notInExtent=f.slotRoots.filter(s=>index>=rootLookupDummy(f,s.rootObject2Offset)).map(s=>s.slot);
  literal.push({family:fam,lookupCallPhysical:p,lookupCallPhysicalHex:he(p),index,operandKind:kind,compatibleSlotIdsUnderStaticExtentOnly:inExtent,incompatibleSlotIdsUnderStaticExtentOnly:notInExtent,actualObjectIdentityAtCall:'UNKNOWN',selectedStreamObject2Offset:'UNKNOWN',runtimeReachabilityFromExtentAlone:false});
 }
}
function rootLookupDummy(f,r){const row=f.rootRows.find(x=>x.rootObject2Offset===r);need(!!row,'Missing length');return row.contiguousRelocatableEntryCount;}
need(literal.length===228&&unresolved.length===25,'Literal caller geometry changed');
const r={format:'mk2_o95r_adjacent_literal_index_extent_v1',status:'SUCCESS',source:{fixtureExeSha256:pin,o95b:src.O95B.hash,o95qSha256:null},boundary:{eachCompatibilitySetIsStaticLengthOnly:true,runtimeIdentityNotEstablished:true,outOfExtentIsNotProofOfRuntimeOutOfBounds:true,noRuntimeSelectionsAdded:true},literalCallsites:literal,nonAdjacentCallsites:unresolved,counts:{totalAuthenticatedLookupCalls:253,adjacentLiteralCallsites:literal.length,nonAdjacentOrDynamicCallsites:unresolved.length,byFamily:{A:{total:calls.A.length,literal:literal.filter(x=>x.family==='A').length},B:{total:calls.B.length,literal:literal.filter(x=>x.family==='B').length}},allSlotsWithinExtent:literal.filter(x=>x.incompatibleSlotIdsUnderStaticExtentOnly.length===0).length,someSlotsOutsideExtent:literal.filter(x=>x.incompatibleSlotIdsUnderStaticExtentOnly.length>0&&x.compatibleSlotIdsUnderStaticExtentOnly.length>0).length,noSlotsWithinExtent:literal.filter(x=>x.compatibleSlotIdsUnderStaticExtentOnly.length===0).length},decision:{runtimeIdentityIndexJoinAdded:0,newBoundedFullStreamsAdded:0,mk2ResearchClosed:false,nextTarget:'Prove actual identity+index+consumer joins, not static root extent compatibility'}};
fs.mkdirSync(out,{recursive:true});
const qfile=path.join(out,'mk2_animation_root_entry_provenance_o95q_2026-10-08.json');fs.writeFileSync(qfile,JSON.stringify(q,null,2)+'\n');
r.source.o95qSha256=sha(fs.readFileSync(qfile));
const rfile=path.join(out,'mk2_animation_adjacent_index_extent_o95r_2026-10-08.json');fs.writeFileSync(rfile,JSON.stringify(r,null,2)+'\n');
console.log(JSON.stringify({status:'SUCCESS',fixupsParsed:allFix,duplicateFixupSources,o95q:q.counts,o95r:r.counts,files:[qfile,rfile]},null,2));
