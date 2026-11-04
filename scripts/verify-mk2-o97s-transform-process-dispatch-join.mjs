#!/usr/bin/env node
// Independent process callback proof from literal executable bytes and LE relocation records.
import{readFileSync}from'node:fs';import{join}from'node:path';import{createHash}from'node:crypto';
const [fixture,root]=process.argv.slice(2),exe=readFileSync(join(fixture,'mk2.exe'));
const hash=x=>createHash('sha256').update(x).digest('hex'),u=i=>exe.readUInt32LE(i),w=i=>exe.readUInt16LE(i);
const result=JSON.parse(readFileSync(join(root,'mk2_mountain_directional_transform_process_join_o97s_2026-10-09.json'))),parent=readFileSync(join(root,'mk2_mountain_directional_threshold_dispatch_o97q_2026-10-09.json'));
let checks=0;const ok=(v,label)=>{checks++;if(!v)throw Error(`FAIL ${label}`)};
ok(hash(exe)==='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','fixture');ok(result.priorO97qSha256===hash(parent),'parent');
const le=0x28f0c,ix=le+u(le+0x68),rec=le+u(le+0x6c),relo=new Map();let count=0;
for(let page=0;page<u(le+0x14);page++){
 let pos=rec+u(ix+page*4),end=rec+u(ix+(page+1)*4);
 while(pos<end){const type=exe[pos]&15,flags=exe[pos+1],off=exe.readInt16LE(pos+2);pos+=4;
  let obj=flags&64?w(pos):exe[pos];pos+=flags&64?2:1;let target=null;
  if(type!==2){target=flags&16?u(pos):w(pos);pos+=flags&16?4:2;}
  if(flags&4)pos+=flags&32?4:2;
  relo.set(0x61c54+page*4096+off,{type,flags,obj,target});count++;ok(pos<=end,'reloc bounds');
 }
 ok(pos===end,'page end');
}
ok(count===27004&&result.relocationRecords===count,'count');ok(result.constructorSites.length===2,'sites');
for(let i=0;i<2;i++){
 const start=[0x645ac,0x84b60][i],entry=result.constructorSites[i];
 ok(entry.entryPhysical===start,'position');ok(exe.subarray(start,start+12).toString('hex')==='5251bb04000000ba8a030200','pushes+params');
 const r=relo.get(start+8);ok(!!r&&r.type===7&&r.flags===16&&r.obj===1&&r.target===0x2038a,'code pointer reloc');
 ok(0x61c54+u(start+8)===0x81fde,'code pointer target');
 ok(exe[start+12]===0xe8,'direct call');ok(start+17+exe.readInt32LE(start+13)===0x67222,'constructor target');
 ok(entry.codeHex===exe.subarray(start,start+18).toString('hex'),'witness bytes');
}
ok(exe.subarray(0x67248,0x6724b).toString('hex')==='89501c','constructor field');ok(exe.subarray(0x67185,0x67188).toString('hex')==='ff661c','scheduler field');
ok(exe.subarray(0x81fde,0x81ff2).toString('hex')==='33c0a3e4420800a1165d0700c1e010a3e8420800','callback prolog');
ok(exe[0x81ff2]===0xe8 && 0x81ff7+exe.readInt32LE(0x81ff3)===0x82003,'callback loop call');
ok(exe.subarray(0x81ff7,0x82003).toString('hex')==='b801000000e80e51feffebef','yield loop');
ok(exe.subarray(0x82178,0x82182).toString('hex')==='c705645a0700905f0100','positive selector');
ok(exe.subarray(0x821aa,0x821b4).toString('hex')==='c705645a0700dc5f0100','negative selector');
ok(exe.subarray(0x8224b,0x8224d).toString('hex')==='ffd1','indirect call');
ok(result.hypotheses.mountainBattlePlanAlwaysRunsThisProcess==='UNPROVEN','runtime limit');
console.log(JSON.stringify({pass:'O97S',independent:'PASS',checks,failures:0,relocations:count,constructorSites:2}));
