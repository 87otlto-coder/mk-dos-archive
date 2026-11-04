#!/usr/bin/env node
/** Independent JavaScript verification of twelve Python-produced bounded executable contracts.
 * Original DOS executable is read anew; LE relocation index re-parsed independently.
 */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const [exePath,root,only]=process.argv.slice(2);if(!exePath||!root)throw Error('usage: node verifier EXE source-root [PASS]');
const bin=fs.readFileSync(exePath),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';const u=a=>bin.readUInt32LE(a),i32=a=>bin.readInt32LE(a),w=a=>bin.readUInt16LE(a),i16=a=>bin.readInt16LE(a);
if(hash(bin)!==SHA)throw Error('wrong DOS MK2 fixture');
// Independent expected windows and mandatory machine-site positions (not imported from Python producer).
const SPECS={
O98D:['alternate_actor_source_guard',0x84ae8,0x84b40,[0x84ae8,0x84aef,0x84af5,0x84afc,0x84b06,0x84b0d,0x84b13,0x84b1b,0x84b2f,0x84b3b]],
O98E:['bounded_scalar_script_22_through_30',0x84bfa,0x84c6e,[0x84bfa,0x84c05,0x84c2a,0x84c31,0x84c36,0x84c46,0x84c4c,0x84c55,0x84c25]],
O98F:['alternative_control_cursor_install',0x84c8b,0x84cc0,[0x84c8b,0x84c90,0x84c95,0x84ca6,0x84cbb]],
O98G:['control_helper_distinct_scalar_13',0x84dbc,0x84df6,[0x84dbc,0x84dc3,0x84dcd,0x84dda,0x84de4,0x84de9,0x84df0]],
O98H:['sentinel_selector_during_alternate_transition',0x84d01,0x84d4b,[0x84d03,0x84d08,0x84d0f,0x84d14,0x84d19,0x84d1e,0x84d23,0x84d2d,0x84d32]],
O98I:['third_executable_process_callback',0x84d5b,0x84db7,[0x84d5b,0x84d70,0x84d75,0x84d7b,0x84d8c,0x84d91,0x84da2]],
O98J:['saved_control_field_sentinel_restore',0x84df6,0x84e5d,[0x84df8,0x84dfd,0x84e05,0x84e0b,0x84e17,0x84e21,0x84e2b,0x84e35,0x84e44,0x84e4a,0x84e50]],
O98K:['temporary_selector_30_save_restore',0x84ed0,0x84f08,[0x84ed2,0x84ed7,0x84ee4,0x84eee]],
O98L:['mountain_setup_dispatch_prologue',0x85f9a,0x86015,[0x85f9a,0x85f9f,0x85fa4,0x85fae,0x85fb8,0x85fbd,0x85fc2,0x85fcd,0x85fd7,0x85fe5,0x85ff8,0x86000,0x86005,0x8600a,0x86010]],
O98M:['conditional_base_accumulator_initializer',0x860c1,0x860fd,[0x860d9,0x860e5,0x860f7]],
O98N:['mountain_portrait_loop_to_two_producers',0x86015,0x86086,[0x86038,0x86041,0x86046,0x8604b,0x86050,0x86055,0x8605a,0x8605f,0x8606b,0x86070,0x86077,0x86081]],
O98O:['three_independent_control_cursor_installers',0x98828,0x98a6a,[0x9882d,0x98832,0x98839,0x9883e,0x98848,0x98a4a,0x98a4f,0x98a54,0x84c90,0x84c95]],
};
let checks=0;const ok=(v,msg)=>{checks++;if(!v)throw Error('REJECTED '+msg)};
let relocMap=new Map(),relocN=0;
function relocations(){const le=0x28f0c,pgIdx=le+u(le+0x68),recs=le+u(le+0x6c);let cnt=0;
 ok(le===0x26654+u(0x26654+0x3c),'LE offset');ok(0x26654+u(le+0x80)===0x61c54,'LE Object1 base');
 for(let pg=0;pg<u(le+0x14);pg++){
 let a=recs+u(pgIdx+pg*4),end=recs+u(pgIdx+(pg+1)*4);
 while(a<end){const type=bin[a]&15, flags=bin[a+1],offset=i16(a+2);a+=4;let obj=flags&64?w(a):bin[a];a+=flags&64?2:1;let ptr=null;if(type!==2){ptr=flags&16?u(a):w(a);a+=flags&16?4:2;}if(flags&4)a+=flags&32?4:2;ok(a<=end,'relocation spans page');relocMap.set(0x61c54+pg*0x1000+offset,{type,flags,obj,ptr});cnt++;}
 ok(a===end,'relocation page boundary');
 }
 ok(cnt===27004,'relocation count');relocN=cnt;
}
relocations();
const typed=(at,obj,ptr)=>{let r=relocMap.get(at);ok(!!r&&r.type===7&&r.flags===16&&r.obj===obj&&r.ptr===ptr,'typed LE pointer at '+at.toString(16));ok(u(at)===ptr,'raw LE pointer');};
const findingPhrases={
 O98D:['conditional actor-state switch','+0x48'],O98E:['scalar 22','below 28'],O98F:['pointer 0x15D60','shared positive-token'],
 O98G:['0x75A78','adds 12'],O98H:['0xFFFF','0x82321'],O98I:['0x32835','EBX 256'],
 O98J:['0x7FFF','restores'],O98K:['selector 30','restores'],O98L:['writes 13','0x84358'],
 O98M:['0x842E8','0x1C2A8'],O98N:['negative token or 13','twice'],O98O:['Three distinct','0x15D60']};
let done=[];
for(let [pass,[slug,start,end,sites]] of Object.entries(SPECS)){
 if(only&&only!==pass)continue;
 const passStartChecks=checks;
 const obj=JSON.parse(fs.readFileSync(path.join(root,`mk2_${slug}_${pass.toLowerCase()}_2026-10-09.json`),'utf8'));
 ok(obj.pass===pass && obj.status==='PASS' && obj.schema==='mk2_o98d_o98o_conditional_executable_audit_v1','report identity '+pass);
 ok(obj.question===slug.replaceAll('_','-'),'report question '+pass);ok(obj.fixtureSha256===SHA,'fixture metadata '+pass);
 ok(obj.window.start===start && obj.window.end===end,'bounded source span '+pass);
 const slice=bin.subarray(start,end);ok(obj.window.sha256===hash(slice),'source witness SHA '+pass);ok(obj.window.hex===slice.toString('hex'),'source witness bytes '+pass);
 ok(obj.classification==='SUPPORTED_STATIC_CONDITIONAL','not a dynamic execution claim '+pass);
 for(const k of ['sharedRuntimeActivation','observedSceneIdentity','actualCameraUnits','measuredTiming'])ok(obj.hypotheses[k]==='UNPROVEN','no unfounded '+k+' '+pass);
 ok(findingPhrases[pass].every(s=>obj.finding.includes(s)),'bounded interpretation '+pass);
 ok(obj.facts.length===sites.length,'fact count '+pass);ok(JSON.stringify(obj.facts.map(f=>f.at))===JSON.stringify(sites),'all required machine locations '+pass);
 for(const fact of obj.facts){
  const {at,kind,operand,bytes}=fact;let decoded,len;
  switch(kind){
   case 'call':ok(bin[at]===0xe8,'opcode near call');decoded=at+5+i32(at+1);len=5;break;
   case 'store':ok(bin[at]===0xc7&&bin[at+1]===5,'immediate memory store');decoded=[u(at+2),u(at+6)];len=10;break;
   case 'inc':ok(bin[at]===0xff&&bin[at+1]===5,'global INC');decoded=u(at+2);len=6;break;
   case 'cmpimm':ok(bin[at]===0x83&&bin[at+1]===0x3d,'global CMP');decoded=[u(at+2),bin[at+6]];len=7;break;
   case 'addimm':ok(bin[at]===0x83&&bin[at+1]===5,'global ADD');decoded=[u(at+2),bin[at+6]];len=7;break;
   case 'read_any':
    if(bin[at]===0xa1){decoded=u(at+1);len=5;}
    else {ok(bin[at]===0x8b&&[0x15,0x1d,0x0d,0x3d,0x35].includes(bin[at+1]),'global read');decoded=u(at+2);len=6;}
    break;
   case 'read_reg':ok(bin[at]===0x8b&&bin[at+1]===0x0d,'ECX global load');decoded=u(at+2);len=6;break;
   case 'write_eax':ok(bin[at]===0xa3,'EAX global write');decoded=u(at+1);len=5;break;
   case 'write_reg':ok(bin[at]===0x89&&[0x15,0x3d].includes(bin[at+1]),'other register global write');decoded=u(at+2);len=6;break;
   case 'imm_eax':case 'imm_ebx':case 'imm_edx':
    ok(bin[at]===({imm_eax:0xb8,imm_ebx:0xbb,imm_edx:0xba})[kind],'register literal');decoded=u(at+1);len=5;break;
   default:throw Error('unsupported witness form '+kind);
  }
  ok(JSON.stringify(operand)===JSON.stringify(decoded),'operand decoded at '+at.toString(16));ok(bytes===bin.subarray(at,at+len).toString('hex'),'independent machine bytes '+at.toString(16));
 }
 // Semantic/structural invariants checked independently of producer facts.
 if(pass==='O98D'){
  ok(bin.subarray(0x84b01,0x84b06).toString('hex')==='83f8017414','actor selection conditional compare/branch');
  ok(bin.subarray(0x84b21,0x84b27).toString('hex')==='8b5248895648','object field +0x48 copy');
  ok(bin[0x84b06]===0x8b && bin[0x84b0d]===0x8b,'second source selected only under predicate');
 }
 if(pass==='O98E'){
  ok(bin.subarray(0x84c0b,0x84c0e).toString('hex')==='895640','actor field +0x40');
  ok(bin[0x84c53]===0x72&&0x84c55+bin.readInt8(0x84c54)===0x84c04,'unsigned below 28 loop');
  ok(bin[0x84c20]===0xbb&&u(0x84c21)===256,'constructor EBX value');typed(0x84c26,1,0x23107);
 }
 if(pass==='O98F'){
  ok(bin.subarray(0x84c9a,0x84ca6).toString('hex')==='33c0528bd08915e85c07005a','zero + register flow');
  typed(0x84c91,2,0x15d60);
 }
 if(pass==='O98G'){
  ok(bin.subarray(0x84dd2,0x84dda).toString('hex')==='b8265d070089473c','object +0x3C');
  ok(bin[0x84df5]===0xc3,'helper return');
 }
 if(pass==='O98H'){
  ok(bin[0x84d46]===0xe9&&0x84d4b+i32(0x84d47)===0x93df0,'alternate handoff');
  ok(bin[0x84d14]===0xa3&&u(0x84d15)===0x75ce8,'sentinel location');
 }
 if(pass==='O98I'){
  ok(bin[0x84d87]===0xbb&&u(0x84d88)===256,'constructor argument');typed(0x84d8d,1,0x32835);
  ok(bin.subarray(0x84d98,0x84da2).toString('hex')==='b830000700bb02000000','packed scalar / flag');
 }
 if(pass==='O98J'){
  ok(bin.subarray(0x84e49,0x84e5d).includes(0xff),'exit is not direct fallthrough');
  ok(bin[0x84e57]===0x8d&&bin[0x84e5a]===0xff,'return continuation');
 }
 if(pass==='O98K'){
  ok(bin.subarray(0x84ede,0x84ee4).toString('hex')==='ff35805a0700','save selector global on stack');
  ok(bin.subarray(0x84ef3,0x84ef9).toString('hex')==='8f05805a0700','restore selector global from stack');
 }
 if(pass==='O98L'){
  ok(bin[0x85fcb]===0x74&&0x85fcd+bin.readInt8(0x85fcc)===0x85fd2,'actor source fallback');
  ok(bin[0x85ff1]===0x75&&bin[0x85ff3]===0xba,'conditional packed argument');
 }
 if(pass==='O98M'){
  ok(bin[0x860cb]===0x74 && bin[0x860d7]===0x75 && bin[0x860e3]===0x74,'three early-return predicates');
  ok(bin.subarray(0x860ea,0x860f1).toString('hex')==='d1e005a8c20100','word-table index arithmetic');
  ok(bin.subarray(0x860f1,0x860f7).toString('hex')==='0fbf00c1e010','sign extend and 16-bit shift');
  const p=0xa0c54+0x1c2a8;
  const vals=Array.from({length:16},(_,i)=>bin.readInt16LE(p+i*2));
  ok(vals.slice(0,8).join(',')==='648,648,601,554,507,460,413,366','signed source table first eight');
 }
 if(pass==='O98N'){
  ok(bin[0x86020]===0x78&&bin[0x86025]===0x74,'negative and token-13 exits');
  ok(bin.subarray(0x86027,0x86036).toString('hex')==='0fbf1383c302c1e21081c2c5000000','packed coordinates from signed word');
  typed(0x8606c,1,0x1ff44);
 }
 if(pass==='O98O'){
  for(const op of [0x84c91,0x9882e,0x98a4b])typed(op,2,0x15d60);
  ok(bin.subarray(0x98837,0x98843).toString('hex')==='33c0a3e85c0700a3ee5c0700','clears two globals');
  ok(bin[0x98a54]===0xc7&&u(0x98a5a)===32,'other installer sets distinct secondary state');
 }
 done.push({pass,facts:obj.facts.length,independentChecks:checks-passStartChecks,result:'PASS'});
}
if(done.length!== (only?1:12))throw Error('missing pass(es)');
console.log(JSON.stringify({independent:'PASS',passes:done.length,checks,failures:0,relocations:relocN,passFacts:done}));
