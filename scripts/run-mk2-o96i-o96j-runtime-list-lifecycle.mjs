#!/usr/bin/env node
/** O96I/J: bounded serialized runtime-list producer table and conditional object-list lifecycle.
 * Authentic MK2.EXE only; no guarantee of runtime schedule or complete stage reconstruction. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const [fixture,out=root]=process.argv.slice(2);
if(!fixture)throw Error('usage: run-mk2-o96i-o96j-runtime-list-lifecycle <fixture-dir> [out-dir]');
const b=fs.readFileSync(path.join(path.resolve(fixture),'mk2.exe'));
const H=x=>crypto.createHash('sha256').update(x).digest('hex');const check=(v,m)=>{if(!v)throw Error('O96I/J '+m)};
const U=i=>b.readUInt32LE(i),S=i=>b.readInt16LE(i),W=i=>b.readUInt16LE(i),hex=(a,z)=>b.subarray(a,z).toString('hex');
const canonical='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';check(H(b)===canonical,'authentic fixture');
const prior=fs.readFileSync(path.join(root,'mk2_control_cursor_file_backed_positive_pointer_pair_lists_o96h_2026-10-08.json'));const h=JSON.parse(prior);check(h.status==='SUCCESS'&&h.exeSha256===canonical,'O96H');
const mz=0x26654,le=mz+U(mz+0x3c),base=mz+U(le+0x80),P=U(le+0x28),np=U(le+0x14),OT=le+U(le+0x40),FT=le+U(le+0x68),FR=le+U(le+0x6c);
const objs=[0,1].map(i=>({id:i+1,start:U(OT+24*i+12),pages:U(OT+24*i+16),size:U(OT+24*i)}));const O2=base+objs[0].pages*P;
check(le===0x28f0c&&base===0x61c54&&P===4096&&np===113&&O2===0xa0c54&&objs[1].pages===50&&objs[1].size===0x86660,'LE layout');
const fixups=new Map();let num=0;
for(let pg=0;pg<np;pg++){const obj=objs.find(o=>o.start<=pg+1&&pg+1<o.start+o.pages);check(obj,'fixup page owner');let q=FR+U(FT+pg*4),end=FR+U(FT+(pg+1)*4);while(q<end){const type=b[q++]&15,flags=b[q++],delta=S(q);q+=2;check(!(flags&3),'fixup flags');const to=flags&64?W(q):b[q];q+=flags&64?2:1;let val=null;if(type!==2){val=flags&16?U(q):W(q);q+=flags&16?4:2;}if(flags&4)q+=flags&32?4:2;fixups.set(`${obj.id}:${(pg+1-obj.start)*P+delta}`,{type,to,val});num++;}check(q===end,'fixup end');}check(num===27004,'fixup total');
const rel=(obj,off,val,to=2)=>{const v=fixups.get(`${obj}:${off}`);check(v&&v.type===7&&v.to===to&&v.val===val,`relocation ${obj} ${off.toString(16)}`);};
const code=(at,pattern,label)=>check(hex(at,at+pattern.length/2)===pattern,`${label} ${at.toString(16)}`);
code(0x81bb3,'565755bb685b0100bf54430800','producer-entry');rel(1,0x81bb7-base,0x15b68);rel(1,0x81bbc-base,0x84354);
code(0x81bc0,'8b2b8b53048b4b088b430c83c31083ef04','producer-row-loop');
code(0x81bd1,'81ff304308007415','producer-termination');rel(1,0x81bd3-base,0x84330);
code(0x81bd9,'8b0083f80174e03d400203007407','producer-sentinel-branches');
code(0x81bf2,'53578b098b12c1e91081e20000ffff0bca8bd1e803000000','producer-parameter-derefs');
code(0x81c48,'893d985a0700e8c3010000','bind-cursor-and-clean');
code(0x81caa,'8b7e06e8c6010000','conditional-lookup');
code(0x81d77,'5355e858190100','alloc-path');
code(0x81d84,'c6441d00ff8d4c1d00894808','flag-and-callback');
code(0x81e07,'8bc5e8c647feff','object-insertion-call');
code(0x665d4,'53ff35645a07005152ff356c5a07008b15985a0700eb14','global-slot-insertion-wrapper');
code(0x665ff,'8b5820528b501c89156c5a07005a8915645a07008b12','linked-list-insertion');
code(0x66631,'8910518b0d645a0700890159','link-two-pointers');
code(0x81e16,'50568bf78b3e85ff7455','conditional-removal-loop');
code(0x81e5a,'8b4708c600008b078906','removal-marker-and-chain');
const rows=[];
for(let i=0;i<8;i++){
 const off=0x15b68+i*16,vals=[0,4,8,12].map(d=>U(O2+off+d));
 vals.forEach((v,j)=>{rel(2,off+j*4,v);check(v>=objs[1].pages*P&&v<objs[1].size,'runtime address target');});
 check(vals[0]===0x767cf+i*0x190&&vals[1]===0x842e8&&vals[2]===0x8432c-i*4&&vals[3]===0x77453+i*4,'eight-row shape');
 rows.push({row:i,object2Offset:off,originalFilePhysical:O2+off,fields:vals,selectedRuntimeListHead:0x84350-i*4});
}
const headSet=new Set(rows.map(r=>r.selectedRuntimeListHead)),hSourceHeads=new Set(h.fileBackedRecords.flatMap(x=>x.pairs.map(p=>p.firstPointerRaw)));
const intersection=[...headSet].filter(x=>hSourceHeads.has(x)).sort((a,b)=>a-b);check(intersection.length>=4,'consumer intersect');
fs.mkdirSync(out,{recursive:true});const baseEvidence={fixtureSha256:canonical,priorO96hSha256:H(prior),boundLe:{object1Base:base,object2PhysicalBase:O2,object2VirtualSize:objs[1].size,object2BackedSize:objs[1].pages*P,verifiedRelocations:num}};
const reportI={format:'mk2_o96i_eight_row_runtime_list_producer_v1',status:'SUCCESS',...baseEvidence,sourceTable:{object2Offset:0x15b68,physical:O2+0x15b68,rows,bytes:128,sha256:H(b.subarray(O2+0x15b68,O2+0x15b68+128)),all32FieldsRelocationBacked:true,sourceIsFileBacked:true,destinationsAreUnbackedRuntimeState:true},producer:{entry:0x81bb3,endExclusive:0x81bf2,loopAt:0x81bc0,stopCompareAt:0x81bd1,stopAddress:0x84330,sentinelBranchAt:0x81bd9,parameterLoad:0x81bf2,cursorAssignment:0x81c48,conditionalObjectTestAt:0x81d77,insertPathAt:0x81e07,insertWrapperAt:0x665d4,listInsertAt:0x665ff},classification:{eightRowProducerTableQualified:true,runtimeListHeadBindingQualified:true,conditionalObjectAllocationAndInsertionPathQualified:true,eightListHeadsGuaranteedPopulated:false,verifiedDuringGameplay:false,stageIdentityKnown:false,mk2Closed:false}};
const reportJ={format:'mk2_o96j_positive_cursor_object_list_consumer_bridge_v1',status:'SUCCESS',...baseEvidence,listProducer:{source:0x15b68,headSequence:rows.map(r=>r.selectedRuntimeListHead),conditionalInsertCall:0x81e09,insertWrapper:0x665d4,sortKeys:[0x20,0x1c],listLinkHeadWrite:0x6663a,conditionalUnlink:0x81e16},listConsumer:{sourceO96hRecordOffsets:h.fileBackedRecords.map(x=>x.object2Offset),allPositiveCursorHeadPointers:[...hSourceHeads].sort((a,b)=>a-b),headsSharedWithProducer:intersection,consumerHeadDerefAt:0x93390,conditionalContinuationAt:0x93395,objectChainLoopBack:0x931e4,sorterEntry:0x93647,sorterHeads:[0x84358,0x84360,0x84364],sortComparisonFields:[0x20,0x1c],sortWrites:[0x93668,0x9366c,0x9366e]},classification:{sharedHeadAddressJoinVerified:true,positiveTokenConsumerUsesRuntimeLinkedObjects:true,conditionalInsertionUsesCompatibleRuntimeListRepresentation:true,everyPositiveHeadProducedByEightRowProcedure:false,guaranteedSameRuntimeExecutionOrFrame:false,serializedGraphicsPixelsInRuntimeSlots:false,mk2Closed:false}};
code(0x9358c,'8b3183c104668b36668935685a0700890d985a07008be8e8e8fdffff','positive-control');
code(0x93390,'8b6d0085ed0f8549feffffc3','linked-chain-consumer');
code(0x93647,'bb00000080bd000000808b1085d27501c3','sorter-entry');
code(0x93668,'89118b0a890889028bca','sorter-link-rewrite');
code(0x93686,'8b1085d275cc','sorter-loop');
for(const [name,obj] of [['I',reportI],['J',reportJ]]){
 const file=path.join(out,`mk2_runtime_linked_object_${name==='I'?'producer_o96i':'consumer_o96j'}_2026-10-08.json`);
 fs.writeFileSync(file,JSON.stringify(obj,null,2)+'\n');console.log(JSON.stringify({pass:`O96${name}`,status:'PASS',fixture:canonical,fixups:num,rows:rows.length,sharedHeads:intersection.length,output:file}));
}
