#!/usr/bin/env node
/** O95V: exact, relocation-backed palette table provenance. No inferred rendered palette ownership. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const [fixture,o69Arg,out=repo]=process.argv.slice(2);if(!fixture||!o69Arg)throw Error('usage: node scripts/run-mk2-o95v-held-palette-table-provenance.mjs <fixture> <fresh-o69.json> [output]');
const read=f=>fs.readFileSync(f),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),chk=(v,m)=>{if(!v)throw Error('O95V: '+m)};
const exe=read(path.join(path.resolve(fixture),'mk2.exe')),canon='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';chk(sha(exe)===canon,'authentic fixture');
const o69b=read(path.resolve(o69Arg)),sbuf=read(path.join(repo,'mk2_animation_reassigned_identity_stream_witnesses_o95s_2026-10-08.json')),o69=JSON.parse(o69b),s=JSON.parse(sbuf);chk(o69.qualifiedResources.length===94&&s.qualifiedRoutes.length===2,'qualified inputs');
const U=p=>exe.readUInt32LE(p),H=p=>exe.readUInt16LE(p),SH=p=>exe.readInt16LE(p);const LE=0x28f0c,DATA=0x61c54,PS=U(LE+0x28),NP=U(LE+0x14),OT=LE+U(LE+0x40),MAP=LE+U(LE+0x48),PAGES=LE+U(LE+0x68),REC=LE+U(LE+0x6c);chk(PS===4096&&U(LE+0x44)===2,'LE model');
const objs=Array.from({length:2},(_,i)=>({id:i+1,first:U(OT+i*24+12),length:U(OT+i*24+16)})),pageNums=Array.from({length:NP},(_,i)=>(exe[MAP+i*4]<<16)|(exe[MAP+i*4+1]<<8)|exe[MAP+i*4+2]);
const physical=(obj,off)=>{const o=objs[obj-1],j=Math.floor(off/PS);chk(j<o.length,'object bound');return DATA+(pageNums[o.first+j-1]-1)*PS+(off%PS)};
const endPointers=Array.from({length:NP+1},(_,i)=>U(PAGES+i*4)),fixups=new Map();let fixN=0;
for(let page=0;page<NP;page++){
 const owner=objs.find(o=>o.first<=page+1&&o.first+o.length>page+1);chk(owner,'page owner');let p=REC+endPointers[page],end=REC+endPointers[page+1];
 while(p<end){const typ=exe[p++]&15,flag=exe[p++],offset=SH(p);p+=2;chk(!(flag&3),'internal fixup');const obj=flag&0x40?H(p):exe[p];p+=flag&0x40?2:1;let target=0;if(typ!==2){target=flag&0x10?U(p):H(p);p+=flag&0x10?4:2;}if(flag&4)p+=flag&0x20?4:2;fixups.set(`${owner.id}:${(page+1-owner.first)*PS+offset}`,{type:typ,obj,target});fixN++;}
 chk(p===end,'fixup page bound');
}chk(fixN===27004,'27004 fixups');
const families=['HH','LK','JC','BA','FN','FN','ST','RD','NJ','NJ','NJ','JX','GO','SK','NJ','NJ','FN'],qualified=[0,1,2,3,4,5,8,9,16],held=[6,7,10,11,12,13,14,15];
const paletteTables=[{name:'A',offset:0x1c1b8},{name:'B',offset:0x1c1fc}];const allSlots=[];
for(let slot=0;slot<17;slot++){
 const contexts=paletteTables.map(t=>{
  const entry=t.offset+4*slot,ref=fixups.get(`2:${entry}`);chk(ref?.type===7&&ref.obj===1,`palette ${t.name} slot ${slot} relocation`);
  const ptr=physical(1,ref.target),count=H(ptr);chk(count===63,`63 colors ${slot}`);const bytes=exe.subarray(ptr,ptr+2+count*2);chk(bytes.length===128,'full palette record');
  return {table:t.name,selectorEntryObject2Offset:entry,recordObject1Offset:ref.target,recordPhysical:ptr,colorCount:count,recordByteLength:bytes.length,recordSha256:sha(bytes),rawFirstWordHex:'0x'+H(ptr+2).toString(16).toUpperCase()};
 });const identicalTarget=contexts[0].recordObject1Offset===contexts[1].recordObject1Offset;allSlots.push({slot,resourceFamily:families[slot],previousCorrectColorContract:qualified.includes(slot),heldCorrectColorContract:held.includes(slot),contexts,tableATableBShareExactPointer:identicalTarget});
}
const go=o69.qualifiedResources.find(r=>r.resourceName==='GO.GRA');chk(go?.indexDomain?.min===1&&go?.indexDomain?.max===63&&go.qualification==='EXACT_FULL_RESOURCE_TILING','GO source range');
const descriptors=new Map(go.streams.map(x=>[x.descriptorPhysical,x]));const goWitnesses=s.qualifiedRoutes.map(r=>{chk(r.selectorIdentityAtLookup===12&&r.identityAfterLookupBeforeConsumer===6,'GO selector mutation');for(const f of r.frames){const d=descriptors.get(f.descriptorPhysical);chk(d&&d.graOffset===f.graOffset&&d.opaqueIndexMin>=1&&d.opaqueIndexMax<=63,'GO frame source indices');}return {routeId:r.id,selectorSlot:12,identityAfterSelection:6,streamObject2Offset:r.streamObject2Offset,frames:r.frames.length,sourceIndexRangeWithinPaletteRecord:true,paletteHandleAtConsumerEstablished:false};});
const heldRows=allSlots.filter(x=>x.heldCorrectColorContract);const counts={slots:17,paletteSelectorTableEntries:34,heldSlots:8,previouslyQualifiedCorrectColorSlots:9,heldSlotsWithSameAAndBPointer:heldRows.filter(x=>x.tableATableBShareExactPointer).length,heldSlotsWithDistinctAAndBPointer:heldRows.filter(x=>!x.tableATableBShareExactPointer).length,goQualifiedFrames:goWitnesses.reduce((a,x)=>a+x.frames,0),newCorrectColorContractPromotions:0};chk(counts.heldSlotsWithSameAAndBPointer===4&&counts.heldSlotsWithDistinctAAndBPointer===4&&counts.goQualifiedFrames===7,'held partition and GO steps');
const report={format:'mk2_palette_held_selector_exact_record_provenance_o95v_v1',status:'SUCCESS',source:{exeSha256:canon,regeneratedO69Sha256:sha(o69b),o95sSha256:sha(sbuf)},reparsedFixupRecords:fixN,tables:paletteTables,allSlots,unresolvedSlotIds:held,goSelectionWitnesses:goWitnesses,counts,boundary:{recordPointerQualificationDoesNotEqualRenderedPaletteOwnership:true,selectedAnimationPointerAndPaletteHandleMayHaveDistinctIdentityHistory:true,noNewAnimationSequences:true,noAdditionalSlotCorrectColorPromoted:true,dynamicGameplayTimingUnknown:true,mk2ResearchClosed:false},next:'Trace object palette-handle +0x30 initialization/update versus later identity mutation for GO slot 12, or pivot to stage reconstruction'};
fs.mkdirSync(out,{recursive:true});const fn=path.join(out,'mk2_palette_held_selector_exact_record_provenance_o95v_2026-10-08.json');fs.writeFileSync(fn,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:'PASS',counts,heldAliased:heldRows.filter(x=>x.tableATableBShareExactPointer).map(x=>x.slot),output:fn}));
