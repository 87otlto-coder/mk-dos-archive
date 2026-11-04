#!/usr/bin/env node
/** O95S - two bounded Family A selections that remain provenance-valid after object identity reassignment.
 * No general identity/index cross product; no frame-clock inference. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [fixtureDir,o69Arg,outArg]=process.argv.slice(2);
if(!fixtureDir||!o69Arg)throw Error('Usage: node scripts/run-mk2-o95s-reassigned-identity-streams.mjs <fixture-dir> <o69-report.json> [out-dir]');
const exe=fs.readFileSync(path.join(path.resolve(fixtureDir),'mk2.exe'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');const chk=(p,c)=>{if(!c)throw Error('O95S: '+p)};
const pin='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';chk('canonical original EXE',sha(exe)===pin);
const dataRefs={O95B:'mk2_animation_root_structural_graph_o95b_2026-10-07.json',O95Q:'mk2_animation_root_entry_provenance_o95q_2026-10-08.json',O95R:'mk2_animation_adjacent_index_extent_o95r_2026-10-08.json'};
const inputs=Object.fromEntries(Object.entries(dataRefs).map(([n,f])=>{const b=fs.readFileSync(path.join(repo,f));return[n,{hash:sha(b),data:JSON.parse(b)}]}));
const o69buf=fs.readFileSync(path.resolve(o69Arg)),o69=JSON.parse(o69buf);
chk('O69 resource contract',Array.isArray(o69.qualifiedResources)&&Array.isArray(o69.partialOrAmbiguousResources));
const o69map=new Map([...o69.qualifiedResources,...o69.partialOrAmbiguousResources].flatMap(r=>r.streams.map(s=>[s.descriptorPhysical,{resource:r.resourceName,descriptor:s,resourceTier:o69.qualifiedResources.includes(r)?'EXACT_FULL':'PARTIAL'}])));
const U=p=>exe.readUInt32LE(p),H=p=>exe.readUInt16LE(p),sh=p=>exe.readInt16LE(p),rel=p=>{chk('rel opcode '+p.toString(16),exe[p]===0xe8||exe[p]===0xe9);return p+5+exe.readInt32LE(p+1)};
const LE=0x28f0c,DATA=0x61c54,pgs=U(LE+0x14),size=U(LE+0x28),ot=LE+U(LE+0x40),mp=LE+U(LE+0x48),fpt=LE+U(LE+0x68),frt=LE+U(LE+0x6c);
chk('LE model',size===4096&&U(LE+0x44)===2);
const objs=Array.from({length:2},(_,i)=>({id:i+1,start:U(ot+i*24+12),count:U(ot+i*24+16)}));
const pn=Array.from({length:pgs},(_,i)=>(exe[mp+i*4]<<16)|(exe[mp+i*4+1]<<8)|exe[mp+i*4+2]);
const page=lp=>DATA+(pn[lp-1]-1)*size;
const physical=(obj,off)=>{const o=objs[obj-1],p=Math.floor(off/size);chk('object physical bound',p<o.count);return page(o.start+p)+off%size};
const po=Array.from({length:pgs+1},(_,i)=>U(fpt+i*4)),fix=new Map();let fixups=0;
for(let pg=0;pg<pgs;pg++){
  const owner=objs.find(o=>pg+1>=o.start&&pg+1<o.start+o.count);chk('owner',!!owner);
  let p=frt+po[pg],end=frt+po[pg+1];
  while(p<end){const type=exe[p++]&15,flags=exe[p++],off=sh(p);p+=2;
    chk('fixup scope',!(flags&3));const tObj=flags&0x40?H(p):exe[p];p+=flags&0x40?2:1;
    let target=0;if(type!==2){target=flags&0x10?U(p):H(p);p+=flags&0x10?4:2}
    if(flags&4)p+=flags&0x20?4:2;
    fix.set(`${owner.id}:${(pg+1-owner.start)*size+off}`,{type,tObj,target});fixups++;
  }
  chk('fixup end',p===end);
}
chk('relocation count',fixups===27004);
const get=(obj,off)=>fix.get(`${obj}:${off}`);
const allowed=inputs.O95B.data.families.find(f=>f.label==='A');chk('slot 12 root',allowed.slotRoots.find(s=>s.slot===12)?.rootObject2Offset===0x12e74);
const q=inputs.O95Q.data.entries;chk('prior witness count',inputs.O95Q.data.witnesses.length===5);
chk('standard wrapper call',rel(0x8682d)===0x63e79);
chk('wrapper retains cursor',exe.subarray(0x86825,0x8682d).equals(Buffer.from('528d6dfc8945005a','hex')));
const routes=[
  {id:'O95S_A_SLOT12_INDEX3_REASSIGN6',entry:0x95140,write:0x95145,setIndex:0x95148,lookup:0x95152,rewriteLoad:0x95157,rewrite:0x9515c,postLoad:0x9515f,continuation:0x95167,jump:0x9516e,codeEnd:0x95173,index:3,stream:0x1313c,frames:3},
  {id:'O95S_A_SLOT12_INDEX13_REASSIGN6',entry:0x951af,write:0x951b4,setIndex:0x951b7,lookup:0x951c1,rewriteLoad:0x951c6,rewrite:0x951cb,postLoad:0x951ce,continuation:0x951d6,jump:0x951dd,codeEnd:0x951e2,index:13,stream:0x1307c,frames:4},
];
const Hx=n=>'0x'+n.toString(16).toUpperCase();
const resultRoutes=routes.map(r=>{
  chk('initial identity immediate',exe[r.entry]===0xb8&&U(r.entry+1)===12&&exe.subarray(r.write,r.write+3).equals(Buffer.from('894746','hex')));
  chk('index immediate',exe.subarray(r.setIndex,r.setIndex+6).equals(Buffer.from('c705785a0700','hex'))&&U(r.setIndex+6)===r.index);
  chk('Family A call',rel(r.lookup)===0x918f1);
  chk('rewrite immediate',exe[r.rewriteLoad]===0xb8&&U(r.rewriteLoad+1)===6&&exe.subarray(r.rewrite,r.rewrite+3).equals(Buffer.from('894746','hex')));
  chk('wrapper argument',exe[r.postLoad]===0xb8&&U(r.postLoad+1)===3);
  chk('continuation setup',exe.subarray(r.continuation,r.continuation+3).equals(Buffer.from('c74500','hex')));
  chk('terminal wrapper jump',exe[r.jump]===0xe9&&rel(r.jump)===0x86825);
  chk('selection to consumer no cursor replacement',!exe.subarray(r.lookup+5,r.jump).includes(Buffer.from('a3785a0700'))&&!exe.subarray(r.lookup+5,r.jump).includes(Buffer.from('c705785a0700')));
  const entry=q.find(e=>e.family==='A'&&e.rootObject2Offset===0x12e74&&e.entryIndex===r.index);
  chk('exact O95Q root entry',entry?.targetObject2Offset===r.stream&&entry.authenticatedRuntimeSelection===false);
  const f=get(2,0x12e74+r.index*4);chk('authentic stream fixup',f?.type===7&&f.tObj===2&&f.target===r.stream);
  const frames=[];for(let i=0;i<r.frames;i++){
    const curr=r.stream+i*4,point=get(2,curr);chk('stream step fixup',point?.type===7&&point.tObj===2);
    const comp=point.target,descFix=get(2,comp);chk('composition descriptor fixup',descFix?.type===7&&descFix.tObj===2);
    chk('composition zero',!get(2,comp+4)&&U(physical(2,comp+4))===0);
    const dp=physical(2,descFix.target),[w,h,x,y]=[H(dp),H(dp+2),sh(dp+4),sh(dp+6)],packed=U(dp+8);
    const o=o69map.get(dp);chk('O69 proven graphics descriptor',!!o&&o.resource==='GO.GRA'&&o.resourceTier==='EXACT_FULL');
    chk('O69 fields',o.descriptor.width===w&&o.descriptor.height===h&&o.descriptor.x===x&&o.descriptor.y===y&&o.descriptor.graOffset===(packed&0xffffff));
    frames.push({index:i,compositionObject2Offset:comp,descriptorObject2Offset:descFix.target,descriptorPhysical:dp,resource:o.resource,resourceTier:o.resourceTier,graOffset:packed&0xffffff,packedResourceReference:Hx(packed),width:w,height:h,x,y});
  }
  chk('zero termination',!get(2,r.stream+4*r.frames)&&U(physical(2,r.stream+4*r.frames))===0);
  return {id:r.id,family:'A',selectorIdentityAtLookup:12,identityAfterLookupBeforeConsumer:6,nestedIndex:r.index,originalSelectedPointerPreserved:true,consumer:'STANDARD_COMPOSITION_WRAPPER_0x86825',terminal:'TOKEN_0',rootObject2Offset:0x12e74,streamObject2Offset:r.stream,streamObject2OffsetHex:Hx(r.stream),callerPhysicalStart:r.entry,callerPhysicalEndExclusive:r.codeEnd,callerSliceSha256:sha(exe.subarray(r.entry,r.codeEnd)),callsitePhysical:r.lookup,wrapperPhysical:0x86825,frames};
});
const output={format:'mk2_animation_reassigned_identity_stream_witnesses_o95s_v1',status:'SUCCESS',source:{fixtureExeSha256:pin,o69Sha256:sha(o69buf),o95bSha256:inputs.O95B.hash,o95qSha256:inputs.O95Q.hash,o95rSha256:inputs.O95R.hash},fixupRecordsReparsed:fixups,qualifiedRoutes:resultRoutes,counts:{fixedIdentityWitnessesBefore:5,newFixedIdentityWitnesses:2,fixedIdentityWitnessesAfter:7,newDescriptorSteps:7,priorStrongQualifiedLookupCalls:239,priorTerminalQualifiedLookupCalls:210,priorHeldLookupCalls:14},boundary:{identityMutationDoesNotRewriteSelectedPointerInTheseTwoCodeIntervals:true,doesNotAssertRuntimeGameObservation:true,doesNotAssignIdentity6ToOriginalSelection:true,doesNotAssignHumanMoveName:true,doesNotEstablishFPSorDwell:true,doesNotGeneralizeStandardGrammarToAllRoots:true,otherClosureBlockersRemainOpen:true},decision:{mk2ResearchClosed:false,nextPass:'O95T - separately investigate other bounded identity writers/consumer paths or pivot to MK2 animation closure blockers'} };
const outf=path.join(path.resolve(outArg??repo),'mk2_animation_reassigned_identity_stream_witnesses_o95s_2026-10-08.json');fs.writeFileSync(outf,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',newWitnesses:resultRoutes.map(r=>({id:r.id,stream:r.streamObject2OffsetHex,frames:r.frames.length,resource:'GO.GRA'})),fixedIdentityWitnessesAfter:7,fixups,output:outf},null,2));
