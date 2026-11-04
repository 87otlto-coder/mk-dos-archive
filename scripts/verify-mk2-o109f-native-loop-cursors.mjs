#!/usr/bin/env node
// Independent verifier for O109F. Reads original raw score bytes and checks
// opcode pointer table and channel cursor intervals without loading producer code.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const [root,reportPath]=process.argv.slice(2);if(!root||!reportPath)throw Error('fixture and report required');
const SHA=b=>crypto.createHash('sha256').update(b).digest('hex');const r=JSON.parse(fs.readFileSync(reportPath,'utf8'));
const families={mid:'scc.bin',lap:'lap.bin',gvs:'grv.bin',sbl:'sbl.bin',awe:'awe.bin'};
let checks=0;function ok(test,reason){checks++;if(!test)throw Error(`CHECK ${checks}: ${reason}`)};
let seen=new Set();let count=0;let zeros=0,ones=0,multi=0;let driverResults={};
const argc=Object.fromEntries([1,0,1,1,0,1,1,1,0,0,0,1,0,2].map((v,i)=>[144+i,v]));
for(const [fam,drv] of Object.entries(families)){
 const d=fs.readFileSync(path.join(root,drv));const signature=Buffer.from('2c907303','hex');const disp=d.indexOf(signature);ok(disp>=0&&d.indexOf(signature,disp+1)===-1,`${drv} opcode dispatch unique`);const call=d.indexOf(Buffer.from('ff97','hex'),disp);ok(call>disp&&call<disp+40,`${drv} indirect dispatch call`);const table=d.readUInt16LE(call+2);const jump=d.readUInt16LE(table+16);const save=d.readUInt16LE(table+24);const dr=r.drivers[fam];ok(dr.dispatch===disp&&dr.table===table,`${drv} opcode table source`);ok(dr.loop_target===jump&&dr.save_target===save,`${drv} branch pointers`);ok(d.subarray(jump,jump+4).toString('hex')==='8b7506c3',`${drv} replay stored cursor`);ok(d.subarray(save,save+4).toString('hex')==='897506c3',`${drv} saved cursor`);ok(dr.native_driver_sha256===SHA(d),`${drv} SHA`);driverResults[fam]={table,save,jump};
 const dir=path.join(root,'sound');const files=fs.readdirSync(dir).filter(x=>x.toLowerCase().endsWith('.'+fam)).sort();ok(files.length===33,`33 ${fam} files`);
 for(const filename of files){const f=fs.readFileSync(path.join(dir,filename));const L=f.readUInt16LE(1),hdr=L+2;const n=f[hdr+2];ok(hdr+3+2*n===f.length,`footer ${filename}`);const offsets=Array.from({length:n},(_,i)=>f.readUInt16LE(hdr+3+2*i));ok(offsets[0]===3,`first pointer ${filename}`);
 for(let j=0;j<n;j++){
  let p=offsets[j];const end=j+1<n?offsets[j+1]:L,lo=p;let t=0,events=[],last=null,saves=[];
  while(p<end){const start=p;let delta=0;let stop=false;for(let k=0;k<5;k++){ok(p<end,`delta truncation ${filename}`);let b=f[p++];delta=(delta<<7)|(b&127);if((b&128)===0){stop=true;break}}ok(stop,`delta encoding ${filename}`);ok(p<end,`opcode truncation ${filename}`);const op=f[p++];const args=op<128?1:op<144?0:argc[op];ok(args!==undefined&&p+args<=end,`args ${filename}`);p+=args;t+=delta;let e={start,p,op,t,delta};events.push(e);if(op===156){saves.push(e);last=e}}
  ok(p===end,`exact channel end ${filename}`);const term=events.at(-1);ok([145,152].includes(term.op),`channel terminator ${filename}`);
  if(term.op!==152)continue;
  const restart=last?last.p:lo;const fromT=last?last.t:0;const repeated=events.filter(e=>e.start>=restart);
  ok(repeated.length>0&&repeated[0].start===restart,`loop restart ${filename}`);
  const period=term.t-fromT;ok(repeated.reduce((s,e)=>s+e.delta,0)===period,`loop elapsed ticks ${filename}`);
  const rr=r.loops.find(x=>x.file===filename&&x.channel===j);ok(!!rr,`missing report loop ${filename} channel ${j}`);
  ok(rr.family===fam&&rr.start===lo&&rr.end===end,`bounds ${filename}`);
  ok(rr.initial_events===events.length&&rr.repeat_event_count===repeated.length,`counts ${filename}`);
  ok(rr.save_marker_count===saves.length&&JSON.stringify(rr.save_marker_offsets)===JSON.stringify(saves.map(e=>e.start)),`saves ${filename}`);
  ok(rr.saved_restart_byte_offset===restart&&rr.saved_restart_initial_tick===fromT&&rr.terminal_byte_offset===term.start,`cursor ${filename}`);
  ok(rr.first_cycle_end_tick===term.t&&rr.repeat_period_ticks===period,`timing ${filename}`);
  ok(rr.source_stream_sha256===SHA(f.subarray(lo,end))&&rr.repeat_payload_sha256===SHA(f.subarray(restart,end)),`hash ${filename}`);
  const key=`${filename}:${j}`;ok(!seen.has(key),`unique record ${key}`);seen.add(key);
  count++;if(saves.length===0)zeros++;else if(saves.length===1)ones++;else multi++;
 }
 }
}
ok(count===r.counts.looping_streams&&r.loops.length===count,`loop coverage ${count}`);
ok(r.counts.files===165&&zeros===r.counts.loop_without_save&&ones===r.counts.loop_with_one_save&&multi===r.counts.loop_with_multiple_saves,'summary counts');
ok(r.fixture_executable_sha256===SHA(fs.readFileSync(path.join(root,'mk2.exe'))),'fixture');
console.log(JSON.stringify({status:'PASS',checks,failures:0,loops:count,saveCounts:{noSave:zeros,oneSave:ones,multipleSaves:multi},drivers:driverResults}));
