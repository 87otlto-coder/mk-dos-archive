#!/usr/bin/env node
/** O96L/O96M: independently reproducible static process-construction and near-call census.
 * Static executable evidence only. No dynamic execution, stage or timing assumption. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),[fixture,out=root]=process.argv.slice(2);
if(!fixture)throw Error('usage: <mk2-dir> [output-dir]');
const b=fs.readFileSync(path.join(path.resolve(fixture),'mk2.exe'));
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const ck=(x,y)=>{if(!x)throw Error(`O96L/M ${y}`)},u=x=>b.readUInt32LE(x),w=x=>b.readUInt16LE(x),s=x=>b.readInt16LE(x),i32=x=>b.readInt32LE(x);
ck(digest(b)===EXE,'fixture hash');
const mz=0x26654,le=mz+u(mz+0x3c),base=mz+u(le+0x80),page=u(le+0x28),np=u(le+0x14),ot=le+u(le+0x40),ft=le+u(le+0x68),fr=le+u(le+0x6c),first=[u(ot+12),u(ot+36)],pages=[u(ot+16),u(ot+40)];
ck(le===0x28f0c&&base===0x61c54&&np===113&&page===4096,'LE');
let relocCount=0;const selected={};const watch=new Set([0x82367,0x8606c]);
for(let pg=0;pg<np;pg++){
 const obj=pg+1<first[1]?0:1;let q=fr+u(ft+4*pg),end=fr+u(ft+4*(pg+1));
 while(q<end){const typ=b[q++]&15,flags=b[q++],off=s(q);q+=2;ck((flags&3)===0,'LE flags');const to=flags&64?w(q):b[q];q+=flags&64?2:1;
 let val=null;if(typ!==2){val=flags&16?u(q):w(q);q+=flags&16?4:2;}if(flags&4)q+=flags&32?4:2;
 const physical=base+(pg+1-first[obj])*page+off;if(watch.has(physical))selected[physical]={type:typ,object:to,value:val};relocCount++;ck(q<=end,'reloc bounds');
 }ck(q===end,'reloc page end');
}
ck(relocCount===27004,'reloc count');
const patch=(at,hex)=>ck(b.subarray(at,at+hex.length/2).toString('hex')===hex,`bytes ${at.toString(16)}`);
const near=(at,target,opcode=0xe8)=>ck(b[at]===opcode&&at+5+i32(at+1)===target,`transfer ${at.toString(16)}`);
const loop=0x81b98,offset=loop-base,loaded=offset+0x10000;ck(offset===0x1ff44&&loaded===0x2ff44,'address coordinate conversion');
patch(0x81b98,'c7057c5a070008000000');near(0x81ba2,0x81bb3);patch(0x81ba7,'a17c5a0700');near(0x81bac,0x6710f);
ck(b[0x81bb1]===0xeb&&0x81bb3+b.readInt8(0x81bb2)===0x81ba2,'repeat edge');
patch(0x67222,'5551a1085b030085c07452');patch(0x67248,'89501c');patch(0x6724e,'52');
const instantiations=[];
for(const x of [{setup:0x82361,load:0x82366,call:0x8236b},{setup:0x86066,load:0x8606b,call:0x86070}]){
 patch(x.setup,'bb05000000');ck(b[x.load]===0xba&&u(x.load+1)===offset,'exact entry operand');near(x.call,0x67222);
 ck(JSON.stringify(selected[x.load+1])===JSON.stringify({type:7,object:1,value:offset}),'Object 1 code pointer relocation');
 instantiations.push({setup:x.setup,codePointerLoad:x.load,relocationOperand:x.load+1,call:x.call,callee:0x67222,relativeCodePointer:offset,codeEntry:loop,register:'EDX',ebxInput:5});
}
const L={format:'mk2_o96l_producer_loop_process_entry_provenance_v1',status:'SUCCESS',fixtureSha256:EXE,relocationCount:relocCount,object1:{codeFileBase:base,loadedBase:0x10000,entryPhysical:loop,relativeEntry:offset,loadedEntry:loaded},repeatLoop:{initialization:0x81b98,assignedGlobal:0x75a7c,initialValue:8,producerCall:0x81ba2,producer:0x81bb3,readGlobal:0x81ba7,schedulerCall:0x81bac,scheduler:0x6710f,backEdge:0x81bb1,backTarget:0x81ba2},processConstructor:{entry:0x67222,conditionalFreeListGate:0x67229,freeListAddress:0x35b08,storesCallbackAt:0x67248,objectFieldOffset:0x1c},instantiations,classification:{twoExecutableCodePointerAssignmentsAuthenticated:true,constructorStoresCodePointerInProcessState:true,repeatPathContainsProducerAndScheduler:true,bothProcessInstantiationsGuaranteedExecuted:false,producerGuaranteedRepeatedInGameplay:false,preciseTimeUnitsEstablished:false,stageOwnershipProven:false,mk2Closed:false}};
const targets=[{name:'eightRowProducer',address:0x81bb3},{name:'extraHead84358',address:0x665eb},{name:'extraHead84364',address:0x93709},{name:'extraHead84360',address:0x93722},{name:'runtimeSlotInitializer',address:0x81b18}];
const codeEnd=base+pages[0]*page;ck(codeEnd===0xa0c54,'code backed end');
const census=targets.map(t=>{
 const refs=[];for(let pos=base;pos<=codeEnd-5;pos++)if((b[pos]===0xe8||b[pos]===0xe9)&&pos+5+i32(pos+1)===t.address)refs.push({physical:pos,operation:b[pos]===0xe8?'near_call':'near_jump'});
 return {...t,refs,count:refs.length};
});
ck(JSON.stringify(census.map(x=>x.count))===JSON.stringify([18,38,1,5,7]),'direct near reference counts');
const direct=Object.fromEntries(census.map(x=>[x.name,x.refs.map(y=>y.physical)]));
ck(direct.eightRowProducer.includes(0x81ba2)&&direct.eightRowProducer.includes(0x70810)&&direct.eightRowProducer.includes(0x86041)&&direct.eightRowProducer.includes(0x8605f),'producer caller anchors');
ck(direct.runtimeSlotInitializer.includes(0x707eb),'initializer caller anchor');
// These are instruction-local sequential witnesses, not scene-execution claims.
patch(0x707eb,'e828130100');near(0x70810,0x81bb3);
patch(0x86041,'e86dbbffff');patch(0x8605f,'e84fbbffff');
patch(0x646a6,'8bc7');near(0x646a8,0x93709,0xe9);patch(0x646ad,'8bc7');near(0x646af,0x93722,0xe9);patch(0x646b4,'8bc7');near(0x646b6,0x665eb,0xe9);
const M={format:'mk2_o96m_list_producer_entry_reference_census_v1',status:'SUCCESS',fixtureSha256:EXE,priorO96LReportHash:null,codeRange:{start:base,endExclusive:codeEnd},targets:census,localSequentialWitnesses:[{initializerCall:0x707eb,producerCall:0x70810},{producerCall:0x86041,laterProducerCall:0x8605f,laterProcessSpawnCall:0x86070}],trampolineBranches:[{source:0x646a6,jump:0x646a8,target:0x93709},{source:0x646ad,jump:0x646af,target:0x93722},{source:0x646b4,jump:0x646b6,target:0x665eb}],classification:{directNearTransferBytesEnumerated:true,allRawMatchesGuaranteedInstructionBoundaries:false,localSequentialPathsQualifiedUnderNormalReturns:true,guaranteedFrameOrSceneCoexecution:false,palettesOrStageGeometryProven:false,mk2Closed:false}};
fs.mkdirSync(out,{recursive:true});const Lf='mk2_producer_process_entry_provenance_o96l_2026-10-08.json',Mf='mk2_object_list_entry_reference_census_o96m_2026-10-08.json';const Lbytes=JSON.stringify(L,null,2)+'\n';M.priorO96LReportHash=digest(Buffer.from(Lbytes));
fs.writeFileSync(path.join(out,Lf),Lbytes);fs.writeFileSync(path.join(out,Mf),JSON.stringify(M,null,2)+'\n');
console.log(JSON.stringify({passes:['O96L','O96M'],status:'PASS',fixtureSha256:EXE,relocations:relocCount,instantiationCount:instantiations.length,directReferenceCounts:census.map(c=>[c.name,c.count]),files:[path.join(out,Lf),path.join(out,Mf)]}));
