#!/usr/bin/env node
// Independent O97P verifier: reconstruct LE relocation records, table keys and typed functions from fixture.
import{readFileSync}from'node:fs';import{join}from'node:path';import{createHash}from'node:crypto';
const [fixture,root]=process.argv.slice(2),exe=readFileSync(join(fixture,'mk2.exe'));
const h=x=>createHash('sha256').update(x).digest('hex'), u=(a)=>exe.readUInt32LE(a),w=a=>exe.readUInt16LE(a);
const report=JSON.parse(readFileSync(join(root,'mk2_mountain_directional_transform_threshold_tables_o97p_2026-10-09.json')));
if(h(exe)!=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')throw Error('fixture');
const reloc=new Map();let count=0,checks=0;const assert=(x,s)=>{checks++;if(!x)throw Error('FAIL '+s);};
const le=0x28f0c,idx=le+u(le+0x68),base=le+u(le+0x6c);
for(let pg=0;pg<u(le+0x14);pg++){
 let pos=base+u(idx+pg*4),end=base+u(idx+(pg+1)*4);
 while(pos<end){let kind=exe[pos]&15,flags=exe[pos+1],delta=exe.readInt16LE(pos+2);pos+=4;
  let obj=flags&64?w(pos):exe[pos];pos+=flags&64?2:1;
  let target=null;if(kind!==2){target=flags&16?u(pos):w(pos);pos+=flags&16?4:2;}
  if(flags&4)pos+=flags&32?4:2;
  let file=0x61c54+pg*4096+delta;
  assert(file>=0 && file<exe.length,'reloc position');reloc.set(file,{kind,flags,obj,target});count++;
 }
 assert(pos===end,'page end');
}
assert(count===27004,'record count');assert(report.relocationRecords===count,'report records');
const source=JSON.parse(readFileSync(join(root,'mk2_mountain_nine_value_transform_bank_o97n_2026-10-09.json')));
assert(report.priorO97nSha256===h(readFileSync(join(root,'mk2_mountain_nine_value_transform_bank_o97n_2026-10-09.json'))),'parent sha');
const profileEnds=new Map(source.profiles.map(x=>[x.entryPhysical,x]));
const targetAt=(pos,obj,target)=>{let r=reloc.get(pos);assert(!!r,'relocation at '+pos.toString(16));assert(r.kind===7 && r.flags===16 && r.obj===obj && r.target===target,'typed relocation '+pos.toString(16));assert(u(pos)===target,'fixture pointer bytes');};
for(let side=0;side<2;side++){
 const t=report.tables[side],start=side?0x15fdc:0x15f90,end=side?0x16024:0x15fd8,operand=side?0x821b0:0x8217e,baseAddr=0xa0c54+start;
 assert(t.direction===(side?'negative':'positive'),'direction');assert(t.tableObject2Start===start,'table addr');assert(t.sentinelObject2Offset===end,'sentinel');
 assert(t.codeRelocationOperand===operand,'operand address');targetAt(operand,2,start);
 assert(t.rows.length===9,'nine rows');const encountered=new Set();
 for(let i=0;i<9;i++){
  let r=t.rows[i],a=baseAddr+8*i,threshold=u(a),pointer=u(a+4),entry=0x61c54+pointer;
  assert(r.ordinal===i && r.threshold===threshold,'threshold record');assert(r.thresholdObject2Offset===start+8*i,'threshold field');
  assert(r.pointerFieldObject2Offset===start+8*i+4,'pointer offset');targetAt(a+4,1,pointer);
  assert(r.pointerObject1Offset===pointer && r.codePhysical===entry,'pointer mapping');
  let p=profileEnds.get(entry);assert(!!p,'profile entry');assert(p.index===r.profileIndex && p.operation===r.operation,'profile classify');
  assert(h(exe.subarray(entry,p.endPhysical))===p.instructionBytesSha256,'instruction hash');encountered.add(p.index);
 }
 assert(encountered.size===9,'unique table entries');
 assert(u(0xa0c54+end)===0&&!reloc.has(0xa0c54+end),'zero terminator');
 assert(h(exe.subarray(baseAddr,0xa0c54+end+4))===t.tableSha256,'table hash');
 assert(t.entryOrderMonotone===false,'mis-sorted status');
 assert(t.rows.at(-2).threshold===0xa0000&&t.rows.at(-1).threshold===0x80000,'unsorted tail');
 assert(t.defaultFunctionObject1Offset===(side?0x209a3:0x2086c),'zero fallback');
}
assert(exe.subarray(0x82182,0x82187).toString('hex')==='b96c080200','positive backup instruction');
assert(exe.subarray(0x821b4,0x821b9).toString('hex')==='b9a3090200','negative backup instruction');
assert(exe.subarray(0x8224b,0x8224d).toString('hex')==='ffd1','indirect call');
assert(report.hypotheses.tablesAreSortedAscending==='REJECTED','hypothesis status');
console.log(JSON.stringify({pass:'O97P',independent:'PASS',checks,failures:0,relocationRecords:count,tables:2,entries:18}));
