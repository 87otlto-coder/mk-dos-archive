import { textAt,view } from './model';
export interface MidiEvent {tick:number;data:number[];track:number;offset:number}
/** Sound Images Gen2 sequence, independently traced through GMI.BIN 0x3BF/0x2FA. */
export function decodeMK2Music(bytes:Uint8Array) {
  const v=view(bytes);if(bytes.length<8||bytes[0]!==1||textAt(bytes,0,4)==='MThd')throw new Error('Expected one-song Sound Images sequence');
  const table=v.getUint16(1,true);if(table+2>bytes.length)throw new Error('Sequence table out of bounds');
  const song=v.getUint16(table,true);if(song+3>bytes.length)throw new Error('Sequence song header out of bounds');
  const ppqn=bytes[song],bpm=bytes[song+1],count=bytes[song+2];if(!ppqn||!bpm||!count||count>16||song+3+count*2>bytes.length)throw new Error('Invalid song header');
  const events:MidiEvent[]=[],tracks=[],tempos=[{tick:0,bpm,track:-1}];let maxTick=0;
  for(let track=0;track<count;track++){
    const start=v.getUint16(song+3+track*2,true);let p=start,tick=0,channel=0,lastNote=0,loop=start,ended=false,looped=false;
    const read=()=>{if(p>=table)throw new Error('Sequence crossed event pool boundary');return bytes[p++];};
    const delta=()=>{let n=0;for(let i=0;i<5;i++){const b=read();n=n*128+(b&127);if(!(b&128))return n;}throw new Error('Invalid sequence delta');};
    const emit=(data:number[],offset:number)=>{if(data.slice(1).some(n=>n>127))throw new Error('Invalid MIDI data');events.push({tick,data,track,offset});};
    tick=delta();
    for(let step=0;step<200000;step++){
      const offset=p,op=read();
      if(op<128){lastNote=op;const velocity=read();if(channel>11)throw new Error('Digital sample channel is not a MIDI instrument');emit([0x90|channel,op,velocity],offset);}
      else if(op>=0x80&&op<0x90)channel=op&15;
      else switch(op){
        case 0x90:emit([0x90|channel,read(),0],offset);break;
        case 0x91:emit([0xb0|channel,123,0],offset);ended=true;break;
        case 0x92:emit([0xc0|channel,read()],offset);break;
        case 0x93:{const tempo=read();if(!tempo)throw new Error('Zero tempo');tempos.push({tick,bpm:tempo,track});break;}
        case 0x94:break;
        case 0x95:emit([0xe0|channel,0,read()],offset);break;
        case 0x96:emit([0xb0|channel,7,read()],offset);break;
        case 0x97:read();break; // Driver per-track auxiliary byte; no MIDI output.
        case 0x98:looped=true;ended=true;break; // Export exactly one traversal, preserve loop point separately.
        case 0x99:emit([0x90|channel,lastNote,0],offset);break;
        case 0x9a:throw new Error('Driver-global sequence branch not yet resolved');
        case 0x9b:emit([0xb0|channel,10,read()],offset);break;
        case 0x9c:loop=p;break;
        case 0x9d:emit([0xb0|channel,read(),read()],offset);break;
        case 0xff:break;
        default:throw new Error(`Unsupported sequence command ${op.toString(16)}`);
      }
      if(ended)break;tick+=delta();if(tick>10000000)throw new Error('Sequence duration limit exceeded');
    }
    if(!ended)throw new Error('Sequence event limit exceeded');
    tracks.push({track,start,end:p,ticks:tick,looped,loopOffset:looped?loop:null});maxTick=Math.max(maxTick,tick);
  }
  tempos.sort((a,b)=>a.tick-b.tick||a.track-b.track);let durationSeconds=0,lastTick=0,lastBpm=bpm;
  for(const t of tempos){durationSeconds+=(t.tick-lastTick)/ppqn*60/lastBpm;lastTick=t.tick;lastBpm=t.bpm;}durationSeconds+=(maxTick-lastTick)/ppqn*60/lastBpm;
  return {ppqn,bpm,tempos,events:events.sort((a,b)=>a.tick-b.tick||a.track-b.track),tracks,maxTick,durationSeconds,scope:'One traversal; loop points retained as metadata; tempo from driver song header and tempo commands'};
}
export function writeMidi(sequence:ReturnType<typeof decodeMK2Music>) {
  const data:number[]=[],push=(...n:number[])=>data.push(...n),vlq=(n:number)=>{const a=[n&127];while(n>>=7)a.unshift((n&127)|128);push(...a);};
  const all=[...sequence.events,...sequence.tempos.map(t=>{const tempo=Math.round(60000000/t.bpm);return {tick:t.tick,track:t.track,data:[255,81,3,(tempo>>>16)&255,(tempo>>>8)&255,tempo&255]};})].sort((a,b)=>a.tick-b.tick||a.track-b.track);let tick=0;
  for(const e of all){vlq(e.tick-tick);push(...e.data);tick=e.tick;}
  vlq(sequence.maxTick-tick);push(255,47,0);
  const bytes=new Uint8Array(22+data.length),v=view(bytes);bytes.set([77,84,104,100]);v.setUint32(4,6);v.setUint16(8,0);v.setUint16(10,1);v.setUint16(12,sequence.ppqn);bytes.set([77,84,114,107],14);v.setUint32(18,data.length);bytes.set(data,22);return bytes;
}
