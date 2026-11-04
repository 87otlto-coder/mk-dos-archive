#!/usr/bin/env node
// Independent O109G original-score -> two-cycle MIDI verifier.
// No Python exporter imports and no reliance on compressed event file.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
let [root,output]=process.argv.slice(2);if(!root||!output)throw Error('fixture outputdir needed');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');const file=n=>fs.readFileSync(path.join(root,'sound',n));
const provenance=JSON.parse(fs.readFileSync(path.join(output,'O109G_TWO_CYCLE_MIDI_PROVENANCE.json'),'utf8'));
let count=0;function ok(a,s){count++;if(!a)throw Error(`CHECK ${count} ${s}`)}
const argn={144:1,145:0,146:1,147:1,148:0,149:1,150:1,151:1,152:0,153:0,154:0,155:1,156:0,157:2};
function vlq(v){ok(Number.isInteger(v)&&v>=0&&v<0x10000000,`vlq ${v}`);let x=[v&127];v>>>=7;while(v){x.unshift((v&127)|128);v>>>=7}return Buffer.from(x)}
function chunk(tag,b){const h=Buffer.alloc(8);h.write(tag,0,'ascii');h.writeUInt32BE(b.length,4);return Buffer.concat([h,b])}
function track(raw,end){let seq=raw.map((v,i)=>({...v,i})).sort((a,b)=>a.tick-b.tick||a.pri-b.pri||a.i-b.i);let prev=0;let bufs=[];for(let e of seq){ok(e.tick>=prev,`time backwards ${e.tick}`);bufs.push(vlq(e.tick-prev),Buffer.from(e.msg));prev=e.tick}ok(end>=prev,'end before message');bufs.push(vlq(end-prev),Buffer.from([255,47,0]));return chunk('MTrk',Buffer.concat(bufs))}
function readScore(b){const L=b.readUInt16LE(1);ok(b[0]===1,'song count');const o=L+2;let n=b[o+2];ok(b.readUInt16LE(L)===L+2,'directory pointer');ok(b.length===o+3+2*n,'footer');const starts=Array.from({length:n},(_,i)=>b.readUInt16LE(o+3+2*i));ok(starts[0]===3,'start');let streams=[];
 for(let j=0;j<n;j++){
  let q=starts[j],end=j+1<n?starts[j+1]:L,es=[],time=0;
  while(q<end){let st=q,dt=0,done=false;for(let k=0;k<5;k++){ok(q<end,'delta bounds');const z=b[q++];dt=dt*128+(z&127);if(!(z&128)){done=true;break}}ok(done,'delta encoding');ok(q<end,'op bounds');const op=b[q++];const argcount=op<128?1:op<144?0:argn[op];ok(argcount!==undefined,'supported op');ok(q+argcount<=end,'arg bounds');const args=Array.from(b.subarray(q,q+argcount));q+=argcount;time+=dt;es.push({st,after:q,dt,op,args,time})}
  ok(q===end&&[145,152].includes(es.at(-1).op),'stream end');streams.push(es)
 }
 return {clock:b.readUInt16LE(o),streams};
}
let checkedSongs=0,checkedLoops=0, totalOn=0,totalOff=0;
for(const rec of provenance.scores){const b=file(rec.native_file);ok(rec.native_sha256===hash(b),`song hash ${rec.native_file}`);const native=readScore(b);const clock=native.clock;const ppqn=clock&255,bpm=clock>>8;ok(ppqn===96,`ppqn ${rec.native_file}`);
 const tempo=[{tick:0,pri:0,msg:[255,81,3,...Buffer.from(Uint8Array.of(0,0,0))]}];tempo[0].msg=[255,81,3,...[(Math.round(60000000/bpm)>>16)&255,(Math.round(60000000/bpm)>>8)&255,Math.round(60000000/bpm)&255]];
 let chunks=[],prov=[],notecnt=0,offcnt=0;
 for(let j=0;j<native.streams.length;j++){
  const es=native.streams[j];let seq=[...es];let loop=es.at(-1).op===152,period=0,repeatedEvents=null;
  if(loop){const marks=es.map((e,i)=>e.op===156?i:-1).filter(i=>i>=0);let idx=marks.length?marks.at(-1)+1:0;let prev=marks.length?es[idx-1].time:0;const rest=es.slice(idx);period=es.at(-1).time-prev;ok(period>0,'positive loop period');let now=es.at(-1).time;for(const e of rest){now+=e.dt;seq.push({...e,time:now})}repeatedEvents=rest.length;checkedLoops++}
  let tick=0,voice=null,lastNote=null;let out=[];
  for(const e of seq){tick+=e.dt;ok(tick===e.time,'source repetition time');let op=e.op,v=e.args[0];
   if(op<128){ok(voice!==null,'pitch voice');lastNote=op;if(voice<=11){out.push({tick,pri:10,msg:[144+voice,op,v]});notecnt++}}
   else if(op<144)voice=op&15;
   else if(op===144){if(voice!==null&&voice<=11){out.push({tick,pri:10,msg:[144+voice,v,0]});offcnt++}}
   else if(op===153){if(lastNote!==null&&voice!==null&&voice<=11){out.push({tick,pri:10,msg:[144+voice,lastNote,0]});offcnt++}}
   else if(op===146){if(voice!==null&&voice<=11)out.push({tick,pri:5,msg:[192+voice,v]})}
   else if(op===147){ok(v>0,'tempo change');let us=Math.round(60000000/v);tempo.push({tick,pri:0,msg:[255,81,3,(us>>16)&255,(us>>8)&255,us&255]})}
   else if(op===149){if(voice!==null&&voice<=11)out.push({tick,pri:5,msg:[224+voice,0,v]})}
   else if(op===150){if(voice!==null&&voice<=11)out.push({tick,pri:5,msg:[176+voice,7,v]})}
   else if(op===155){if(voice!==null&&voice<=11)out.push({tick,pri:5,msg:[176+voice,10,v]})}
   else if(op===157){if(voice!==null&&voice<=11)out.push({tick,pri:5,msg:[176+voice,e.args[0],e.args[1]]})}
   else ok([145,148,151,152,154,156].includes(op),`unexpected op ${op}`)
  }
  if(voice!==null&&voice<=11)out.push({tick,pri:30,msg:[176+voice,123,0]});
  chunks.push(track(out,tick));
  prov.push({index:j,native_end_tick:es.at(-1).time,render_end_tick:tick,loop_period_ticks:period,repeated_segment_events:repeatedEvents,looping:loop});
  const reported=rec.source_channel_timelines[j];ok(JSON.stringify(prov[j])===JSON.stringify(reported),`timeline ${rec.native_file} stream ${j}`)
 }
 const maxEnd=Math.max(...prov.map(x=>x.render_end_tick));tempo.push({tick:maxEnd,pri:31,msg:[255,1,0]});
 const hd=Buffer.alloc(6);hd.writeUInt16BE(1);hd.writeUInt16BE(chunks.length+1,2);hd.writeUInt16BE(ppqn,4);
 const midi=Buffer.concat([chunk('MThd',hd),track(tempo,maxEnd),...chunks]);const outputFile=path.join(output,rec.smf_file),actual=fs.readFileSync(outputFile);
 ok(actual.equals(midi),`independent exact SMF reconstruction ${rec.native_file}`);
 ok(rec.smf_length===actual.length&&rec.smf_sha256===hash(actual),`output checksum ${rec.native_file}`);
 checkedSongs++;totalOn+=notecnt;totalOff+=offcnt;
}
ok(checkedSongs===66&&checkedLoops===157,`expected song/loop coverage ${checkedSongs}/${checkedLoops}`);
ok(totalOn===provenance.midi_events.note_on&&totalOff===provenance.midi_events.note_off,'note count');
console.log(JSON.stringify({status:'PASS',checks:count,failures:0,scores:checkedSongs,native_looping_channels:checkedLoops,note_on:totalOn,note_off:totalOff}));
