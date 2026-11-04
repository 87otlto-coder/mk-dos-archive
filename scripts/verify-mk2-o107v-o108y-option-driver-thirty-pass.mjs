#!/usr/bin/env node
// Independent reparse. No import from Python producer, no trust in reported offsets/hashes.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const exe=fs.readFileSync(process.argv[2]), root=process.argv[3], folder=process.argv[4];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const ids=[...'VWXYZ'].map(x=>'O107'+x).concat([...'ABCDEFGHIJKLMNOPQRSTUVWXY'].map(x=>'O108'+x));
const ledger=JSON.parse(fs.readFileSync(path.join(folder,'mk2_o108y_options_audio_30pass_ledger_2026-10-09.json'),'utf8'));
let checks=0;function ok(c,m){checks++;if(!c)throw new Error(`ASSERTION_FAIL ${m}`)};
const eq=(a,b,k)=>ok(a===b,k+': '+String(a)+' != '+String(b));
const bhex=(at,n)=>exe.subarray(at,at+n).toString('hex');const u32=at=>exe.readUInt32LE(at);
const call=at=>{eq(exe[at],0xe8,'call opcode '+at.toString(16));return at+5+exe.readInt32LE(at+1)};
const s=[ [0x9a98f,0x9aa0e,0x30130,0x302ff],[0x9a999,0x9aa18,0x30134,0x30303],[0x9a9a3,0x9aa22,0x3012c,0x30307],[0x9a9ad,0x9aa82,0x30138,0x3030b],[0x9a9b7,0x9aa2c,0x3013c,0x30317] ];
const inits=[[1,0x62eb1,0x62eb6,0x62ebb,0x62f19,0x62f1e,0x39000000],[2,0x62f2b,0x62f31,0x62f36,0x62f94,0x62f99,0x3a000000],[4,0x62fa6,0x62fac,0x62fb1,0x6300f,0x63014,0x3b000000],[8,0x63021,0x63027,0x6302c,0x63084,0x63089,0x3c000000],[16,0x63096,0x6309c,0x630a1,0x63101,0x63106,0x3d000000]];
const ext=[[1,'.MID',0x8153c,0x81541],[2,'.LAP',0x8154a,0x8154f],[4,'.GVS',0x81558,0x8155d],[8,'.SBL',0x81566,0x8156b],[16,'.AWE',0x81574,0x81579]];
const names=['scc.bin','lap.bin','grv.bin','sbl.bin','awe.bin'];
const steps=[['SHADOW_READ',0x9aa82,'a10b030300'],['SHADOW_COMPARE',0x9aa87,'390538010300'],['UNCONDITIONAL_APPLY_JUMP',0x9aa8d,'eb15'],['LIVE_SELECTOR_STORE',0x9aaa4,'a338010300'],['INIT_AND_SUCCESS_GUARD',0x9aaa9,'e83683fcff84c075dd']];
const loader=[['MUSIC_FILENAME_CALL',0x814d8,'e84b000000'],['DOS_MUSIC_OPEN',0x814e4,'b43dcd21'],['DOS_MUSIC_READ',0x81505,'b43fcd21'],['DOS_MUSIC_CLOSE',0x8150d,'b43ecd21'],['SOUND_SERVICE_REQUEST',0x81513,'b404b001cd80']];
ok(sha(exe)==='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','original exe sha');eq(ledger.reports.length,30,'record count');eq(ledger.format,'mk2_o108y_options_audio_30pass_ledger_v1','ledger format');
for(let i=0;i<30;i++){
 const meta=ledger.reports[i], r=JSON.parse(fs.readFileSync(path.join(folder,meta.filename),'utf8'));const raw=fs.readFileSync(path.join(folder,meta.filename));
 eq(meta.pass,ids[i],'ledger pass');eq(meta.sha256,sha(raw),'ledger hash');eq(r.pass,ids[i],'report pass');eq(r.ordinal,i+1,'ordinal');eq(r.sourceExeSha256,sha(exe),'exe sha');
 eq(r.noDynamicGameplayClaim,true,'runtime hold');eq(r.noEstablishedInt80Handler,true,'service hold');eq(r.noEmulatorDiagnosis,true,'DOSBox hold');eq(r.kind,meta.kind,'kind');
 if(i<5){
  const [a,b,live,shadow]=s[i];eq(r.kind,'OPTIONS_SNAPSHOT_REAPPLY','kind');eq(r.live,live,'live');eq(r.shadow,shadow,'shadow');eq(r.snapshotOffset,a,'snapshot');eq(r.reapplyReadOffset,b,'apply');eq(exe[a],0xa1,'read opcode');eq(u32(a+1),live,'read source');eq(exe[a+5],0xa3,'snapshot store');eq(u32(a+6),shadow,'snapshot destination');eq(exe[b],0xa1,'apply read');eq(u32(b+1),shadow,'apply shadow');eq(r.snapshotHex,bhex(a,10),'snap evidence');eq(r.reapplyHex,bhex(b,i===3?11:10),'restore evidence');eq(r.soundSelectorSpecialCase,i===3,'selector special');
  if(i!==3){eq(exe[b+5],0xa3,'restore opcode');eq(u32(b+6),live,'restore destination')}else{eq(bhex(b+5,6),'390538010300','compare instead of direct restore')}
 }else if(i<10){
  const [bit,flag,alloc,allocCall,selector,setup,request]=inits[i-5];eq(r.kind,'HARDWARE_FLAG_INITIALIZER','kind');for(const [k,v] of Object.entries({bit,flagTestAt:flag,allocationImmediateAt:alloc,allocationRequest:request,allocationCallAt:allocCall,initializationSelectorAt:selector,setupCallAt:setup}))eq(r[k],v,k);
  eq(r.flagTestHex,bhex(flag,bit===1?3:4),'flag hex');if(bit===1)eq(bhex(flag,3),'f6c101','first bit via CL');else eq(bhex(flag,4),'f60424'+bit.toString(16).padStart(2,'0'),'stack bit');eq(exe[alloc],0xb8,'alloc opcode');eq(u32(alloc+1),request,'alloc literal');eq(r.allocationHex,bhex(alloc,5),'alloc hex');eq(r.selectorHex,bhex(selector,5),'select hex');eq(u32(selector+1),bit,'selector');eq(call(allocCall),0x62c74,'allocator callee');eq(call(setup),0x62c94,'setup callee');eq(r.allocatorTarget,0x62c74,'allocator target');eq(r.setupTarget,0x62c94,'setup target');
 }else if(i<15){
  const [bit,extension,immediate,compare]=ext[i-10];eq(r.kind,'MUSIC_EXTENSION_SELECTION','kind');eq(r.bit,bit,'bit');eq(r.extension,extension,'ext');eq(r.immediateAt,immediate,'imm');eq(r.comparisonAt,compare,'compare');eq(r.comparisonHex,bhex(compare,9),'cmp bytes');eq(r.immediateHex,bhex(immediate,5),'imm bytes');eq(exe[immediate],0xb8,'mov imm');eq(bhex(immediate+1,4),Buffer.from(extension).toString('hex'),'suffix literal');eq(bhex(compare,6),'833d38010300','selector compare form');eq(exe[compare+6],bit,'cmp mask');eq(exe[compare+7],0x74,'conditional jump');eq(compare+9+exe.readInt8(compare+8),0x81583,'suffix copy jump');eq(r.destination,0x81583,'end block');eq(r.selectorGlobal,0x30138,'selector owner');
 }else if(i<20){
  const driver=names[i-15],v=fs.readFileSync(path.join(root,driver));eq(r.kind,'NATIVE_DRIVER_TWO_ENTRY_STUBS','kind');eq(r.driver,driver,'driver name');eq(r.driverSha256,sha(v),'driver hash');eq(r.driverBytes,v.length,'driver size');eq(r.first8Hex,v.subarray(0,8).toString('hex'),'entry bytes');eq(v[0],0xe8,'call1');eq(v[4],0xe8,'call2');eq(v[3],0xcb,'retf');eq(v[7],0xcf,'iret');const a=3+v.readInt16LE(1),b=7+v.readInt16LE(5);eq(a,b,'shared inner entry');eq(r.sharedTarget,a,'entry target');ok(a>=8&&a+16<=v.length,'entry bounds');eq(r.sharedTarget16Hex,v.subarray(a,a+16).toString('hex'),'entry body');eq(r.fileBindingNotProven,true,'no driver binding');
 }else if(i<25){const [step,at,hex]=steps[i-20];eq(r.kind,'OPTIONS_APPLY_STEP','kind');eq(r.step,step,'step');eq(r.offset,at,'at');eq(r.opcodeHex,hex,'hex');eq(bhex(at,hex.length/2),hex,'step bytes');eq(r.globalSelector,0x30138,'global');eq(r.shadowSelector,0x3030b,'shadow');if(i===22){eq(at+2+exe.readInt8(at+1),0x9aaa4,'unconditional jump target');}
 }else{const [step,at,hex]=loader[i-25];eq(r.kind,'AUDIO_MUSIC_LOADER_STEP','kind');eq(r.step,step,'step');eq(r.offset,at,'offset');eq(r.opcodeHex,hex,'byte seq');eq(bhex(at,hex.length/2),hex,'direct file instruction');eq(r.requestNotServiceInterpretation,true,'handler unknown');if(i===25)eq(call(at),0x81528,'filename routine');}
}
console.log(JSON.stringify({verdict:'PASS',checks,passes:30,falsificationReady:true}));
