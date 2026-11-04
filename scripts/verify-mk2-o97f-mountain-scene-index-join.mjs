#!/usr/bin/env node
/** Independently reconstruct O97F from authentic LE image, not the Python producer. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
const [fixture, reportPath] = process.argv.slice(2);
if (!fixture || !reportPath) throw Error('usage: verify fixture_dir report.json');
const binary=fs.readFileSync(path.join(fixture,'mk2.exe'));
const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
let checks=0;
function check(v,msg) { checks++; if(!v) throw Error('O97F REJECTED '+msg); }
const U=(x)=>binary.readUInt32LE(x);
const W=(x)=>binary.readUInt16LE(x);
const S=(x)=>binary.readInt16LE(x);
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const P=(o)=>0xa0c54+o;
check(sha(binary)==='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','fixture');
check(report.fixtureSha256===sha(binary),'reported fixture');
check(report.status==='PASS' && report.format==='mk2_o97f_mountain_scene_selector_13_provenance_v1','report format');
// Verify full LE records with separate byte-level parser and page ownership; no fixups reused from producer.
const le=0x26654+U(0x26654+0x3c);
const idx=le+U(le+0x68),records=le+U(le+0x6c),fileBase=0x26654+U(le+0x80),np=U(le+0x14);
check(le===0x28f0c && fileBase===0x61c54 && np===113,'LE topology');
let count=0;
const fix=new Map();
for(let pg=0;pg<np;pg++) {
 let a=records+U(idx+pg*4),end=records+U(idx+4*(pg+1));
 while (a<end){
  let kind=binary[a]&15, flags=binary[a+1],delta=S(a+2);a+=4;
  let obj=(flags&64)?W(a):binary[a];a+=(flags&64)?2:1;
  let dest=null;
  if(kind!==2) {dest=(flags&16)?U(a):W(a); a+=(flags&16)?4:2;}
  if(flags&4) a+=(flags&32)?4:2;
  let physical=fileBase+pg*4096+delta;
  check(a<=end,'fixup extends past page');
  // LE fixup records can repeat an exact physical source; match final effective record.
  fix.set(physical,{kind,flags,obj,dest});count++;
 }
 check(a===end,'fixup page exact end');
}
check(count===27004 && report.relocationCount===count,'relocation count');
function pointer(at,obj,dest){
 const f=fix.get(at);
 check(U(at)===dest,'raw pointer '+at.toString(16));
 check(!!f && f.kind===7 && f.flags===16 && f.obj===obj && f.dest===dest,'typed fixup '+at.toString(16));
}
function code(at,hex){check(binary.subarray(at,at+hex.length/2).toString('hex')===hex,'code '+at.toString(16));}
for(const [at,dest] of [[0x82330,0x15bec],[0x8233e,0x15c68],[0x8234c,0x15ce4]])pointer(at,2,dest);
code(0x82321,'a1805a0700a37f740700');
code(0x8232b,'52c1e002');
code(0x82350,'03c25a8b00a3805a0700');
code(0x8235a,'e853fbffff');
code(0x82361,'bb05000000ba44ff0100e8b24efeff');
code(0x85fa4,'c705805a07000d000000');
check(binary[0x85fae]===0xe8 && 0x85fb3+binary.readInt32LE(0x85faf)===0x82321,'literal13 caller');
const tables=[0x15bec,0x15c68,0x15ce4];
check(JSON.stringify(report.selection.selectorTableBases)===JSON.stringify(tables),'table bases');
check(report.selection.inputValue===13 && report.selection.literalInputWriter===0x85fa4 && report.selection.directCallAt===0x85fae && report.selection.target===0x82321,'caller report');
check(report.tables.length===3,'report tables');
for(let t=0;t<3;t++){
 const base=tables[t], rec=report.tables[t], observed=[];
 check(rec.base===base && rec.count===31,'table header');
 for(let i=0;i<31;i++) {
  const at=P(base+i*4),target=U(at);observed.push(target);
  check(rec.entries[i]===target,'table entry '+t+'/'+i);
  if (target) pointer(at,2,target);
  else check(!fix.has(at),'zero entry cannot have relocation');
 }
 check(observed[13]===0x1c2e6,'selector13 config pointer');
 check(observed.filter(x=>x===0x1c2e6).length===1,'unique selector13 in table');
 check(rec.index13===observed[13] && rec.index13SourceObject2===base+52 && rec.index13Physical===P(base+52),'index witness');
 check(rec.tableSha256===sha(binary.subarray(P(base),P(base)+124)),'full table digest');
}
const conf=report.configuration;
check(conf.offset===0x1c2e6 && conf.runtimeSlotSource===0x1c302 && conf.runtimeSlotAddress===0x77453,'config origin');
for (const [at,dest] of [[0x1c302,0x77453],[0x1c306,0x1c31e],[0x1c312,0x1c330]]) {
 pointer(P(at),2,dest);
 check(conf.setupPointerLinks.some(x=>x.source===at && x.object===2 && x.target===dest),'typed report link');
}
pointer(P(0x15b74),2,0x77453);
check(conf.producerTableFirstRowSlotPointerAt===0x15b74,'producer slot');
code(0x81bb6,'bb685b0100bf54430800');
code(0x81bd9,'8b0083f80174e0');
for(const [j,offset,height,n,ctrl] of [[0,0x1c31e,768,39,0x1c5dc],[1,0x1c330,200,10,0x1c716]]) {
 const r=conf.setups[j];
 check(r.offset===offset && r.width===320 && r.height===height && r.entries===n,'setup summary');
 check(W(P(offset))===320 && W(P(offset+2))===height && W(P(offset+4))===n,'source setup words');
 for(const [f,v] of [[6,ctrl],[10,0x1c344],[14,0x1c5bc]])pointer(P(offset+f),2,v);
}
for(const witness of report.machineWitnesses){
 check(witness.hex===binary.subarray(witness.at,witness.at+witness.hex.length/2).toString('hex'),'witness bytes '+witness.at);
}
check(report.hypotheses.selector13AcrossAllThreeTables==='SUPPORTED','proven index13');
for(const key of ['fatalityLabelForIndex13','jumpLabelForIndex13','mountainPaletteOrSetupActiveInSpecificGameplay','runtimeCoactivationTallArtAndPortraits'])check(report.hypotheses[key]==='UNPROVEN','no overclaim '+key);
console.log(JSON.stringify({status:'PASS',pass:'O97F',independent:'Node LE parser',checks,failures:0,relocations:count,tableValues:93,selector13Target:'0x1c2e6',setupCounts:[39,10]}));
