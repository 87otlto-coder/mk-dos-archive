#!/usr/bin/env node
// Independent verification of source SCC.BIN semantics and each generated Standard MIDI file.
// Reconstruct expected MIDI messages from ORIGINAL DOS score bytes, not the producer JSONL.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const [fixture,output] = process.argv.slice(2);
if(!fixture||!output){console.error('node verify-mk2-o109d-scc-standard-midi.mjs <mk2-folder> <SMF-folder>');process.exit(2)}
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let checks=0;const eq=(a,b,label)=>{checks++;if(a!==b)throw new Error(`${label}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`)};
const ok=(x,label)=>{checks++;if(!x)throw new Error(label)};
const argsize={0x90:1,0x91:0,0x92:1,0x93:1,0x94:0,0x95:1,0x96:1,0x97:1,0x98:0,0x99:0,0x9a:0,0x9b:1,0x9c:0,0x9d:2};
const driver=fs.readFileSync(path.join(fixture,'scc.bin'));
// Source-evidence anchors: SCC sends actual MIDI bytes, not hypothetical high-level events.
eq(driver.subarray(0x664,0x66a).toString('hex'),'ba4404b89063','PIT/minute numerator');
eq(driver.subarray(0x678,0x67f).toString('hex'),'a02102f6262202','pulse count times tempo');
eq(driver.subarray(0x9bc,0x9c2).toString('hex'),'807d080b7712','voice <=11 MIDI path');
for(const [offset,hex] of [[0x9c2,'8a45080c90'],[0xa40,'0c90'],[0xa55,'0c90'],[0xa9d,'0cc0'],[0xab2,'0ce0'],[0xac8,'0cb0'],[0xade,'0cb0'],[0xaef,'0cb0']]){
 const b=Buffer.from(hex,'hex');eq(driver.subarray(offset,offset+b.length).toString('hex'),hex,`native MIDI status ${offset.toString(16)}`);
}
function vlq(buffer,pos){let v=0,p=pos;for(let z=0;z<5;z++){if(p>=buffer.length)throw Error('bad VLQ');const b=buffer[p++];v=v*128+(b&127);if(b<128)return [v,p]};throw Error('too long VLQ')}
function midiChunks(buffer){ok(buffer.subarray(0,4).toString()==='MThd','SMF header');eq(buffer.readUInt32BE(4),6,'SMF header width');eq(buffer.readUInt16BE(8),1,'SMF type1');const n=buffer.readUInt16BE(10);eq(buffer.readUInt16BE(12),96,'native MIDI timebase');let p=14;const arr=[];for(let j=0;j<n;j++){eq(buffer.subarray(p,p+4).toString(),'MTrk',`MTrk ${j}`);let size=buffer.readUInt32BE(p+4);p+=8;arr.push(buffer.subarray(p,p+size));p+=size}eq(p,buffer.length,'SMF length');return arr}
function parseTrack(chunk){const out=[];let tick=0,p=0,running=0;while(p<chunk.length){let d;[d,p]=vlq(chunk,p);tick+=d;const status=chunk[p++];ok(status>=128,`no running status ${p}`);if(status===0xff){const type=chunk[p++];let l;[l,p]=vlq(chunk,p);ok(p+l<=chunk.length,'meta bounds');const data=chunk.subarray(p,p+l);p+=l;out.push([tick,`ff${type.toString(16).padStart(2,'0')}${data.toString('hex')}`]);continue};const top=status&0xf0;const count=(top===0xc0||top===0xd0)?1:2;ok(p+count<=chunk.length,'MIDI message bounds');const data=chunk.subarray(p,p+count);p+=count;ok([...data].every(v=>v<128),'7bit MIDI arguments');out.push([tick,Buffer.concat([Buffer.from([status]),data]).toString('hex')])};ok(out.at(-1)?.[1]==='ff2f','MIDI track closes');return out}
const round=Math.round;
const metadata=JSON.parse(fs.readFileSync(path.join(output,'ROLAND_SCC_SMF_CONVERSION_PROVENANCE.json'),'utf8'));
eq(metadata.total_native_to_smf,33,'33 Roland SMFs');
let totalNative=0,totalMusic=0,tempoChanges=0,notes=0,offs=0,loops=0;
for(const record of metadata.songs){
 const native=fs.readFileSync(path.join(fixture,'sound',record.native_source));eq(record.native_sha256,sha(native),`native hash ${record.native_source}`);const L=native.readUInt16LE(1), H=L+2, clock=native.readUInt16LE(H), n=native[H+2];eq(clock&255,96,'SCC 96 pulses');ok((clock>>8)>=80&&(clock>>8)<=135,'SCC BPM range');eq(H+3+2*n,native.length,'SCC stream directory');eq(native.readUInt16LE(L),H,'SCC header pointer');eq(record.tracks,n+1,'SCC track count');const starts=Array.from({length:n},(_,i)=>native.readUInt16LE(H+3+2*i));eq(starts[0],3,'first source stream');
 const candidate=fs.readFileSync(path.join(output,record.smf_file));eq(sha(candidate),record.smf_sha256,'SMF output provenance hash');const tracks=midiChunks(candidate);eq(tracks.length,n+1,'SMF track count');
 const bpm=clock>>8;const tempomap=[[0,'ff51'+round(60000000/bpm).toString(16).padStart(6,'0')]];
 const terminals=[];
 for(let i=0;i<n;i++){
  const end=i+1<n?starts[i+1]:L;let cursor=starts[i],tick=0,ch=null,last=null;const expected=[];let order=0;
  const add=(priority,bytes)=>expected.push({tick,priority,order:order++,bytes});
  while(cursor<end){
   // A separate native delay decoder: 7-bit big-endian continuation sequence.
   let delta=0,ended=false;
   for(let size=1;size<=5;size++){ok(cursor<end,'truncated native delay');const v=native[cursor++];delta=delta*128+(v&127);if(v<128){ended=true;break}}
   ok(ended,'invalid native delay encoding');tick+=delta;
   const opcode=native[cursor++];const count=opcode<128?1:opcode<144?0:argsize[opcode];ok(count!==undefined,'recognized SCC command');ok(cursor+count<=end,'SCC command within stream');const args=native.subarray(cursor,cursor+count);cursor+=count;totalNative++;
   if(opcode<128){ok(ch!==null,'voice selected before note');last=opcode;if(ch<=11){add(10,`9${ch.toString(16)}${opcode.toString(16).padStart(2,'0')}${args[0].toString(16).padStart(2,'0')}`);notes++}}
   else if(opcode<144){ch=opcode-128}
   else if(opcode===0x90){if(ch!==null&&ch<=11){add(10,Buffer.from([0x90+ch,args[0],0]).toString('hex'));offs++}}
   else if(opcode===0x99){if(last!==null&&ch!==null&&ch<=11){add(10,Buffer.from([0x90+ch,last,0]).toString('hex'));offs++}}
   else if(opcode===0x92){if(ch!==null&&ch<=11)add(5,Buffer.from([0xc0+ch,args[0]]).toString('hex'))}
   else if(opcode===0x93){ok(args[0]>0,'BPM nonzero');tempomap.push([tick,`ff51${round(60000000/args[0]).toString(16).padStart(6,'0')}`]);tempoChanges++}
   else if(opcode===0x95){if(ch!==null&&ch<=11)add(5,Buffer.from([0xe0+ch,0,args[0]]).toString('hex'))}
   else if(opcode===0x96){if(ch!==null&&ch<=11)add(5,Buffer.from([0xb0+ch,7,args[0]]).toString('hex'))}
   else if(opcode===0x9b){if(ch!==null&&ch<=11)add(5,Buffer.from([0xb0+ch,10,args[0]]).toString('hex'))}
   else if(opcode===0x9d){if(ch!==null&&ch<=11)add(5,Buffer.from([0xb0+ch,args[0],args[1]]).toString('hex'))}
   else if(opcode===0x91||opcode===0x98){eq(cursor,end,'native termination at exact stream boundary');if(opcode===0x98)loops++;if(ch!==null&&ch<=11)add(30,Buffer.from([0xb0+ch,123,0]).toString('hex'))}
  }
  eq(cursor,end,'entire original SCC stream parsed');terminals.push(tick);
  // Exporter's explicit boundary marker for final silent delay.
  if(expected.length===0||expected.at(-1).tick<tick)add(31,'ff01');
  expected.sort((a,b)=>a.tick-b.tick||a.priority-b.priority||a.order-b.order);
  const expectedMessages=expected.map(x=>[x.tick,x.bytes]);expectedMessages.push([expected.at(-1).tick,'ff2f']);
  eq(JSON.stringify(parseTrack(tracks[i+1])),JSON.stringify(expectedMessages),`independent MIDI replay ${record.native_source} channel ${i}`);
  totalMusic+=expected.length;
 }
 const endTime=Math.max(...terminals);tempomap.push([endTime,'ff01'],[endTime,'ff2f']);
 // Source tempo changes already in chronological order, all in one INTRO1 stream.
 eq(JSON.stringify(parseTrack(tracks[0])),JSON.stringify(tempomap),`independent tempo track ${record.native_source}`);
}
eq(tempoChanges,2,'intro1 tempo changes');eq(notes,15721,'authentic emitted note-ons');eq(offs,15721,'authentic emitted note-offs');eq(totalNative,37823,'all SCC source commands');
console.log(JSON.stringify({status:'PASS',checks,failed:0,standard_midis:metadata.songs.length,source_commands:totalNative,verified_notes:notes,verified_note_off:offs,tempo_changes:tempoChanges,loop_terminators:loops}));
