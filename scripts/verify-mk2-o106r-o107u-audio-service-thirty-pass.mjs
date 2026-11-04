#!/usr/bin/env node
// Independent original-byte reproduction. No importer from Python producer.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const [exePath, root, out] = process.argv.slice(2);
const read=p=>fs.readFileSync(p);const hash=v=>crypto.createHash('sha256').update(v).digest('hex');let checks=0;
const ok=(a,b,msg='mismatch')=>{checks++;assert.deepEqual(a,b,msg)};
const yes=(v,msg='assertion failed')=>{checks++;assert.ok(v,msg)};
const exe=read(exePath);ok(hash(exe),'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65');
const rm=read(path.join(root,'rm.drv'));ok(rm.length,2522);
const meta=JSON.parse(read(path.join(out,'mk2_o107u_audio_service_thirty_pass_ledger_2026-10-09.json')));
ok(meta.sourceCount,30);ok(meta.noMusicEventGrammar,true);ok(meta.int80HandlerNotIdentified,true);ok(meta.noHardwareDriverBindingFromFilenameAlone,true);
const ids=Array.from('RSTUVWXYZ',c=>'O106'+c).concat(Array.from('ABCDEFGHIJKLMNOPQRSTU',c=>'O107'+c));ok(ids.length,30);
const intAt=[0x814c5,0x814cd,0x814d1,0x814d5,0x81517,0x815ba,0x8671f,0x86725,0x8672b,0x86731,0x8674e];
const ahs=[9,7,3,3,4,19,18,18,18,18,7],als=[null,null,null,null,1,0,0,1,2,3,null];
const driverNames=['scc.bin','lap.bin','grv.bin','sbl.bin','awe.bin'];
const exc=[...['mid','lap','gvs','sbl','awe'].map(x=>'pit2.'+x),'animb.lap'];
const musicFmt=['mid','lap','gvs','sbl','awe'];const branches=[0x8153c,0x8154a,0x81558,0x81566,0x81574],cmps=[0x81541,0x8154f,0x8155d,0x8156b,0x81579],sels=[1,2,4,8,16];
const seen=new Set();
for(let i=0;i<30;i++){
 const item=meta.reports[i];ok(item.pass,ids[i]);yes(!seen.has(item.filename));seen.add(item.filename);
 const buf=read(path.join(out,item.filename));ok(hash(buf),item.sha256);const r=JSON.parse(buf);
 ok(r.pass,ids[i]);ok(r.ordinal,i+1);ok(r.noMusicEventGrammar,true);ok(r.int80HandlerNotIdentified,true);ok(r.noHardwareDriverBindingFromFilenameAlone,true);ok(r.exeSha256,hash(exe));ok(item.kind,r.kind);
 if(i<11){const at=intAt[i];ok(r.kind,'PROTECTED_AUDIO_INT80_CALL');ok(r.interruptOffset,at);ok(r.ah,ahs[i]);ok(r.al,als[i]);ok(exe.subarray(at,at+2).toString('hex'),'cd80');ok(exe[als[i]===null?at-1:at-3],ahs[i]);ok(exe[als[i]===null?at-2:at-4],0xb4);if(als[i]!==null){ok(exe[at-2],0xb0);ok(exe[at-1],als[i]);}
 ok(r.contextHex,exe.subarray(at-18,at+8).toString('hex'));ok(r.qualifier,'INSTRUCTION_SITE_NOT_HANDLER_SEMANTICS');
 }else if(i<16){const file=driverNames[i-11];const b=read(path.join(root,file));ok(r.kind,'NATIVE_DRIVER_DUAL_ENTRY');ok(r.driver,file);ok(r.length,b.length);ok(r.driverSha256,hash(b));ok(r.first8Hex,b.subarray(0,8).toString('hex'));ok(b[0],0xe8);ok(b[3],0xcb);ok(b[4],0xe8);ok(b[7],0xcf);const a=3+b.readInt16LE(1);const c=7+b.readInt16LE(5);ok(a,c);yes(a>=0&&a+24<=b.length);ok(r.sharedCallTarget,a);ok(r.sharedTargetFirst24Hex,b.subarray(a,a+24).toString('hex'));
 }else if(i<22){const file=exc[i-16];const b=read(path.join(root,'sound',file)), L=b.readUInt16LE(1);ok(r.kind,'UNINDEXED_INTERIOR_MARKER');ok(r.filename,file);ok(r.fileLength,b.length);ok(r.storedLength,L);ok(r.sha256,hash(b));yes((b.length-L-7)%2===0&&b.length>=L+7);const offs=[];for(let k=L+7;k<b.length;k+=2)offs.push(b.readUInt16LE(k));ok(r.indexedOffsetsCount,offs.length);
 const others=[];for(let k=3;k<L;k++)if((b[k]===0x91||b[k]===0x98)&& k!==L-1&&!offs.includes(k+1))others.push(k);
 ok(others.length,1);const at=others[0];ok(r.interiorByteOffset,at);ok(r.opcode,b[at]);ok(r.nextByte,b[at+1]);ok(r.contextHex,b.subarray(Math.max(0,at-8),at+16).toString('hex'));ok(r.terminalMarker,b[L-1]);ok(r.qualifier,'EXCEPTION_NOT_AUTOMATIC_MUSIC_COMMAND');
 }else if(i<27){const j=i-22,at=branches[j],cp=cmps[j];ok(r.kind,'EXECUTABLE_MUSIC_FILENAME_BRANCH');ok(r.extension,musicFmt[j]);ok(r.hardwareSelector,sels[j]);ok(r.movOpcodeAt,at);ok(exe[at],0xb8);ok(r.movLiteralBytesHex,exe.subarray(at+1,at+5).toString('hex'));ok(r.compareAt,cp);ok(exe.subarray(cp,cp+6).toString('hex'),'833d38010300');ok(exe[cp+6],sels[j]);ok(exe[cp+7],0x74);let disp=exe.readInt8(cp+8);ok(r.conditionalJumpTarget,cp+9+disp);ok(cp+9+disp,0x81583);ok(r.globalAddress,0x30138);ok(r.qualifier,'MUSIC_SUFFIX_BRANCH_NOT_DRIVER_BINARY_SELECTION');
 }else{ok(r.rmSha256,hash(rm));ok(r.driver,'rm.drv');
 if(i===27){ok(r.kind,'REALMODE_PCM_SAMPLE_API_CALL');ok(r.beginOffset,0x962);ok(r.opcodesHex,rm.subarray(0x962,0x97d).toString('hex'));ok(r.requestAh,17);ok(r.farPointerOffset,0x14);ok(rm.subarray(0x975,0x97b).toString('hex'),'b411ff1e1400');}
 else if(i===28){ok(r.kind,'REALMODE_INT80_CHANNEL_QUERY');ok(r.beginOffset,0x9b4);ok(r.opcodesHex,rm.subarray(0x9b4,0x9c0).toString('hex'));ok(r.requestAh,19);ok(r.queryFailureSentinel,65535);ok(rm.subarray(0x9b4,0x9c0).toString('hex'),'6650b413cd8083fbff6658c3');}
 else{ok(r.kind,'REALMODE_PCM_VOLUME_HELPER');ok(r.beginOffset,0x9c0);ok(r.opcodesHex,rm.subarray(0x9c0,0x9da).toString('hex'));ok(r.volumeFieldOffset,0x32);ok(rm.subarray(0x9c0,0x9c4).toString('hex'),'8a0e3200');}
 }
}
// Independently reconstruct the global six-interior-exception claim, not merely the six reports.
let named=0, anomalies=[];let fileCount=0;
const stems=fs.readdirSync(path.join(root,'sound')).filter(x=>x.endsWith('.mid')).map(x=>x.slice(0,-4)).sort();ok(stems.length,33);
for(const stem of stems)for(const ext of musicFmt){const file=stem+'.'+ext,b=read(path.join(root,'sound',file));fileCount++;const L=b.readUInt16LE(1);yes(b[0]===1&&b.length>=L+7&&(b.length-L-7)%2===0);const indexed=[];for(let x=L+7;x<b.length;x+=2){const k=b.readUInt16LE(x);indexed.push(k);yes(k>0&&k<L);yes(b[k-1]===0x91||b[k-1]===0x98);}
 named+=indexed.length;const hits=new Set(indexed);for(let k=3;k<L;k++)if((b[k]===0x91||b[k]===0x98)&&k!==L-1&&!hits.has(k+1))anomalies.push(file+':'+k);
}
ok(fileCount,165);ok(named,931);ok(anomalies.sort(),exc.map(x=>x+':'+JSON.parse(read(path.join(out,meta.reports[16+exc.indexOf(x)].filename))).interiorByteOffset).sort());
// Raw byte search in EXE yields four other CD80 *matches* outside authenticated sound-control sites.
let occurrences=[];for(let i=0;i+1<exe.length;i++)if(exe[i]===0xcd&&exe[i+1]===0x80)occurrences.push(i);ok(occurrences.length,15);ok(intAt.every(x=>occurrences.includes(x)),true);
console.log(JSON.stringify({status:'PASS',checks,failures:0,reports:30,musicFiles:fileCount,namedIndexedOffsets:named,additionalInteriorMarkers:anomalies.length,driverDualEntrypoints:5,verifiedGameAudioInt80Sites:11},null,2));
