#!/usr/bin/env node
// Independently parse original source and replay the lossless stream event export.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
const [fixture, output] = process.argv.slice(2);
if(!fixture||!output){console.error('Usage: node verify-mk2-o108z-o109b-driver-stream-decode.mjs <mk2-dir> <report-dir>');process.exit(2)}
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const fail=(text)=>{throw new Error(text)};
let checks=0;
function eq(a,b,label){checks++;if(a!==b)fail(`${label}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`)}
function ok(test,label){checks++;if(!test)fail(label)}
const report=JSON.parse(fs.readFileSync(path.join(output,'mk2_driver_score_stream_manifest_o109b_2026-10-09.json'),'utf8'));
const eventFile=fs.readFileSync(path.join(output,'mk2_lossless_channel_events_o109b_2026-10-09.jsonl.gz'));
const streams=zlib.gunzipSync(eventFile).toString('utf8').trimEnd().split('\n').map(x=>JSON.parse(x));
const byKey=new Map(streams.map(s=>[`${s.file}/${s.index}`,s]));
const families={mid:'scc.bin',lap:'lap.bin',gvs:'grv.bin',sbl:'sbl.bin',awe:'awe.bin'};
const lengthByOpcode=new Map([[0x90,1],[0x91,0],[0x92,1],[0x93,1],[0x94,0],[0x95,1],[0x96,1],[0x97,1],[0x98,0],[0x99,0],[0x9a,0],[0x9b,2],[0x9c,0],[0x9d,2]]);
const totals={files:0,streams:0,events:0,pitched_events:0};
const opcodeCounts={};const extCounts={};
for(const [ext,drvName] of Object.entries(families)){
 const drv=fs.readFileSync(path.join(fixture,drvName)); const d=report.drivers[ext];
 eq(d.sha256,digest(drv),`driver digest ${ext}`);eq(d.bytes,drv.length,`driver length ${ext}`);
 const anchor=Buffer.from([0x2c,0x90,0x73,0x03]);const found=drv.indexOf(anchor);
 eq(d.opcode_dispatch,found,`driver dispatch ${ext}`);ok(found>=0,`missing ${ext} opcode branch`);
 const jump=drv.indexOf(Buffer.from([0xff,0x97]),found);
 ok(jump>found&&jump<found+32,`invalid dispatch jump ${ext}`);
 const table=drv.readUInt16LE(jump+2);eq(d.opcode_table,table,`opcode table ${ext}`);
 for(let i=0;i<14;i++){const pos=drv.readUInt16LE(table+2*i);eq(d.opcode_targets[i],pos,`opcode ${ext} ${i}`);ok(pos>0&&pos<drv.length,`opcode bounds ${ext} ${i}`)}
 const delay=drv.indexOf(Buffer.from([0x33,0xd2,0x33,0xdb,0xac]));eq(d.delay_decoder,delay,`delta decoder ${ext}`);ok(delay>=0,`delta decoder exists ${ext}`);
 extCounts[ext]={streams:0,events:0};
 const songs=report.songs.filter(v=>v.family===ext);
 eq(songs.length,33,`song count ${ext}`);
 for(const song of songs){
  const original=fs.readFileSync(path.join(fixture,'sound',song.file));
  eq(song.sha256,digest(original),`music sha ${song.file}`);
  eq(song.bytes,original.length,`music size ${song.file}`);
  eq(song.song_count,original[0],`score count ${song.file}`);eq(original[0],1,`one score ${song.file}`);
  const directory=original.readUInt16LE(1);eq(song.directory_location,directory,`directory pos ${song.file}`);
  eq(song.score_header,directory+2,`score header ${song.file}`);
  eq(original.readUInt16LE(directory),directory+2,`directory points to header ${song.file}`);
  const header=directory+2;eq(song.clock_word,original.readUInt16LE(header),`clock word ${song.file}`);
  const n=original[header+2];eq(n,song.channel_count,`channel count ${song.file}`);eq(header+3+2*n,original.length,`footer length ${song.file}`);
  eq(song.original_header_hex,original.subarray(0,3).toString('hex'),`lossless prefix ${song.file}`);
  eq(song.original_footer_hex,original.subarray(directory).toString('hex'),`lossless footer ${song.file}`);
  let endPrevious=3;const allBytes=[Buffer.from(song.original_header_hex,'hex')];
  for(let i=0;i<n;i++){
   const s=byKey.get(`${song.file}/${i}`);ok(s!==undefined,`missing stream ${song.file} ${i}`);
   const metadata=song.streams[i];const start=original.readUInt16LE(header+3+2*i);
   const end=i===n-1?directory:original.readUInt16LE(header+3+2*(i+1));
   eq(start,endPrevious,`adjacent streams ${song.file}/${i}`);
   eq(s.start,start,`stream start ${song.file}/${i}`);eq(s.end,end,`stream end ${song.file}/${i}`);
   eq(metadata.start,start,`metadata start ${song.file}/${i}`);eq(metadata.end,end,`metadata end ${song.file}/${i}`);
   eq(s.sha256,digest(original.subarray(start,end)),`stream sha ${song.file}/${i}`);
   let cursor=start;let ticks=0;const built=[];let pitched=0;
   for(const rec of s.events){
    const [offset,deltaHex,delta,opcode,argHex,cumulative]=rec;
    eq(offset,cursor,`event pointer ${song.file}/${i} @${cursor}`);
    const dbytes=Buffer.from(deltaHex,'hex');ok(dbytes.length>0&&dbytes.length<=5,`delta width ${song.file}/${i}`);
    let counter=0;
    for(let j=0;j<dbytes.length;j++){
     const v=dbytes[j];counter=counter*128+(v&0x7f);
     ok((v>=128)===(j<dbytes.length-1),`delta continuation ${song.file}/${i}`)
    }
    eq(delta,counter,`delta units ${song.file}/${i}`);
    ticks+=counter;eq(cumulative,ticks,`running ticks ${song.file}/${i}`);
    let argN;
    if(opcode<128){argN=1;pitched++}
    else if(opcode<=0x8f){argN=0}
    else if(lengthByOpcode.has(opcode)){argN=lengthByOpcode.get(opcode)}
    else fail(`invalid command opcode ${opcode} ${song.file}/${i}`);
    const args=Buffer.from(argHex,'hex');eq(args.length,argN,`argument size ${song.file}/${i}`);
    const assembled=Buffer.concat([dbytes,Buffer.from([opcode]),args]);
    ok(assembled.equals(original.subarray(cursor,cursor+assembled.length)),`event bytes ${song.file}/${i}`);
    cursor+=assembled.length;built.push(assembled);
    const k=`0x${opcode.toString(16).toUpperCase().padStart(2,'0')}`;
    opcodeCounts[k]=(opcodeCounts[k]??0)+1;
    totals.events++;extCounts[ext].events++;
   }
   eq(cursor,end,`complete stream bytes ${song.file}/${i}`);
   const reconstructed=Buffer.concat(built);eq(digest(reconstructed),s.sha256,`reconstructed stream hash ${song.file}/${i}`);
   eq(metadata.events,s.events.length,`event count ${song.file}/${i}`);
   eq(metadata.pitched_events,pitched,`pitched count ${song.file}/${i}`);
   eq(metadata.ticks_to_end,ticks,`unscaled ticks ${song.file}/${i}`);
   const term=s.events.at(-1)[3];ok(term===0x91||term===0x98,`stream terminator ${song.file}/${i}`);
   eq(metadata.terminal_opcode,term,`terminal opcode ${song.file}/${i}`);
   allBytes.push(reconstructed);endPrevious=end;
   totals.streams++;totals.pitched_events+=pitched;extCounts[ext].streams++;
  }
  allBytes.push(Buffer.from(song.original_footer_hex,'hex'));
  const roundTrip=Buffer.concat(allBytes);
  eq(digest(roundTrip),digest(original),`entire binary reconstruction ${song.file}`);
  totals.files++;
 }
}
eq(streams.length,totals.streams,'streams length');
for(const [k,v] of Object.entries(report.totals))eq(v,totals[k],`total ${k}`);
for(const [k,v] of Object.entries(report.operations))eq(v,opcodeCounts[k],`opcode total ${k}`);
for(const ext of Object.keys(families))for(const [k,v] of Object.entries(report.families[ext]))eq(v,extCounts[ext][k],`family ${ext} ${k}`);
console.log(JSON.stringify({status:'PASS',checks,failed:0,files:totals.files,streams:totals.streams,events:totals.events,pitched_events:totals.pitched_events,native_driver_tables:5,lossless_binary_roundtrips:165}));
