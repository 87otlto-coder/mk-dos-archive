#!/usr/bin/env node
/** Independently verify O97G installer with separate LE parse and bounded virtual machine. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const [fx,dir]=process.argv.slice(2);if(!dir)throw Error('usage fixture source_root');
const b=fs.readFileSync(path.join(fx,'mk2.exe'));
const g=JSON.parse(fs.readFileSync(path.join(dir,'mk2_mountain_runtime_setup_install_o97g_2026-10-09.json')));
const prior=fs.readFileSync(path.join(dir,'mk2_mountain_scene_selector_13_o97f_2026-10-09.json'));
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');const rd=x=>b.readUInt32LE(x),w=x=>b.readUInt16LE(x),si=x=>b.readInt16LE(x),P=x=>x+0xa0c54;let checks=0;
const eq=(truth,desc)=>{checks++;if(!truth)throw Error('O97G independent REJECTED '+desc)};
eq(sha(b)==='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','original EXE');
eq(g.fixtureSha256===sha(b)&&g.parentO97fSha256===sha(prior)&&g.status==='PASS','parent and fixture evidence');
eq(g.format==='mk2_o97g_mountain_conditional_runtime_slot_installer_v1','format');
const header=0x26654+rd(0x26654+0x3c), index=header+rd(header+0x68),tbl=header+rd(header+0x6c),pageTotal=rd(header+0x14),base=0x26654+rd(header+0x80);
eq(header===0x28f0c&&pageTotal===113&&base===0x61c54,'LE header');
let count=0;const fixups=new Map();
for(let pg=0;pg<pageTotal;pg++) {
 let curr=tbl+rd(index+4*pg),end=tbl+rd(index+4*(pg+1));
 while(curr<end) {
  const typ=b[curr]&15,flag=b[curr+1],where=si(curr+2);curr+=4;
  let ob=(flag&64)?w(curr):b[curr];curr+=(flag&64)?2:1;
  let val=null;
  if(typ!==2){val=(flag&16)?rd(curr):w(curr);curr+=(flag&16)?4:2;}
  if(flag&4)curr+=(flag&32)?4:2;
  eq(curr<=end,'relocation boundary');fixups.set(base+pg*4096+where,[typ,flag,ob,val]);count++;
 }
 eq(curr===end,'page relocation boundary exact');
}
eq(count===27004&&g.relocationCount===count,'all LE relocation entries');
const ptr=(offset,obj,dest)=>{const from=P(offset),fix=fixups.get(from);eq(rd(from)===dest, 'raw pointer '+offset);eq(fix!==undefined && fix[0]===7&&fix[1]===16&&fix[2]===obj&&fix[3]===dest, 'typed pointer '+offset)};
for(const [offset,obj,dest] of [[0x1c2f6,1,0x21227],[0x1c2fa,2,0x172dc],[0x1c2fe,2,0x15d60],[0x1c302,2,0x77453],[0x1c306,2,0x1c31e],[0x1c312,2,0x1c330]])ptr(offset,obj,dest);
// Qualify the parser instructions, including the actual short -1 sentinel comparison, not an imaginary DWORD-immediate instruction.
for(const item of g.machine)eq(b.subarray(item.physical,item.physical+item.hex.length/2).toString('hex')===item.hex,'machine witness '+item.name);
const required={
indirect_pre_callback:[0x81f41,'8b1883c00450ffd358'],
two_control_globals:[0x81f4a,'8b1883c004891d225d07008b1883c004891df65c0700'],
runtime_slot_loop_load:[0x81f60,'8b1883c004528b108915645a07005a'],
one_sentinel_branch:[0x81f6f,'833d645a0700017512'],
one_sentinel_store:[0x81f78,'528b15645a070089135a83c30483c004ebdb'],
terminal_minus1_check:[0x81f8a,'833d645a0700ff7413'],
normal_assignment:[0x81f9c,'890383c30483c008ebbf'],
return_sentinel:[0x81fa6,'5fc3'],
producer_selected_pointer:[0x81bd9,'8b0083f80174e0'],
producer_installer_indirect:[0x81c53,'8b308b5804891d645a0700']};
for(const [label,[loc,hex]]of Object.entries(required)){
 eq(g.machine.some(x=>x.name===label && x.physical===loc && x.hex===hex),'required code witness '+label);
 eq(b.subarray(loc,loc+hex.length/2).toString('hex')===hex,'required code bytes '+label);
}
const inst=g.installedGlobals;
eq(inst.length===2&&inst[0].destination===0x75d22&&inst[0].valueSource===0x1c2fa&&inst[0].selectedValue===0x172dc,'secondary stored pointer');
eq(inst[1].destination===0x75cf6&&inst[1].valueSource===0x1c2fe&&inst[1].selectedValue===0x15d60,'positive cursor stored pointer');
eq(g.indirectCallback.pointerSource===0x1c2f6&&g.indirectCallback.target===0x21227&&g.indirectCallback.callPhysical===0x81f47&&g.indirectCallback.returnUnobserved===true,'conditional callback');
// Independent trace from the raw serialized words: ++ptr2 for ordinary source references, ++ptr for marker 1, stop at -1.
const output=[];let current=rd(P(0x1c302)),cursor=0x1c306,stopAt=null;
for(let k=0;k<8;k++){
 let token=rd(P(cursor));
 if(token===0xffffffff){stopAt=cursor;break;}
 if(token===1){output.push([current,1,cursor]);cursor+=4;current+=4;}
 else if(token===0xfffffffe)throw Error('O97G independent unsupported -2 sentinel in this record');
 else {ptr(cursor,2,token);output.push([current,cursor,cursor]);cursor+=8;current+=4;}
}
eq(stopAt===0x1c31a && g.terminal.offset===stopAt && g.terminal.value===0xffffffff,'terminated at -1');
const expect=[[0x77453,0x1c306,0x1c306],[0x77457,1,0x1c30e],[0x7745b,0x1c312,0x1c312]];
eq(JSON.stringify(output)===JSON.stringify(expect),'independent symbolic writes');
eq(JSON.stringify(g.assignments.map(x=>[x.runtimeSlot,x.storedValue,x.sourceConfigOffset]))===JSON.stringify(output),'reported writes');
eq(rd(P(0x1c306))===0x1c31e && rd(P(0x1c312))===0x1c330,'setup dereference');
eq(g.resolvedSetups[0].count===39&&g.resolvedSetups[1].count===10,'report child setup count');
eq(w(P(0x1c31e+4))===39&&w(P(0x1c330+4))===10,'source child setup count');
for(let j=0;j<2;j++){
 const item=g.resolvedSetups[j],actual=j===0?[0x77453,0x1c306,0x1c31e,39]:[0x7745b,0x1c312,0x1c330,10];
 eq(item.slot===actual[0]&&item.indirectPointer===actual[1]&&item.setupOffset===actual[2]&&item.count===actual[3],'report setup '+j);
}
for(const key of ['installerConditionallyWritesBothSetupPointers','installerConditionallySetsPositiveCursor'])eq(g.hypotheses[key]==='SUPPORTED','supported '+key);
for(const key of ['sceneActivationObserved','gameDrawsBothSetupsSimultaneously','jumpOrFatalityMeaning','finalScreenCameraOrRgb'])eq(g.hypotheses[key]==='UNPROVEN','no semantic overclaim '+key);
console.log(JSON.stringify({status:'PASS',pass:'O97G',independentChecks:checks,failures:0,relocations:count,installedSlots:output.map(x=>x[0]),controlCursor:'0x15d60',termination:'0x1c31a'}));
