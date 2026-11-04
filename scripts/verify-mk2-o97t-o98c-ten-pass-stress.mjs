#!/usr/bin/env node
// Independent verifier of ten bounded MK2 static hypotheses. Does NOT import Python producer specs.
import {readFileSync} from 'node:fs';import{join}from'node:path';import{createHash}from'node:crypto';
const [exePath,root,only]=process.argv.slice(2);const bin=readFileSync(exePath);const hash=x=>createHash('sha256').update(x).digest('hex');const u=p=>bin.readUInt32LE(p);const s=p=>bin.readInt32LE(p);
const SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const definitions=[
 ['O97T','early_profile_constructor',0x64591,0x645c0],['O97U','late_dual_process_construction',0x84b40,0x84b86],
 ['O97V','secondary_callback_three_phases',0x84e5d,0x84eb7],['O97W','secondary_helper_scheduler_yield',0x84eb7,0x84ed0],
 ['O97X','late_setup_events_yields',0x84b86,0x84bf0],['O97Y','multiplexed_global_roles',0x84bfa,0x84c0f],
 ['O97Z','relocated_dual_callback_objects',0x84b60,0x84b86],['O98A','renderer_visibility_branches',0x931e4,0x93225],
 ['O98B','ten_accumulator_update_walk',0x93433,0x934a8],['O98C','distinct_global_selector_contexts',0x85fa4,0x85fb3],
];
const supportedConclusions={
 O97T:'The early setup routine makes two mode calls, clears the base accumulator, then creates one profile callback. No scene reachability asserted.',
 O97U:'The later setup routine calls an actor-state helper, then constructs two distinct process callbacks, not one.',
 O97V:'The second process callback loads three distinct literal global pairs and calls one shared helper for each.',
 O97W:'The shared helper calls two routines, reads a global, and tail-jumps to scheduler yield; its units remain unknown.',
 O97X:'The late process-setup continuation emits four event calls and several scheduler yields; delay units are not proven.',
 O97Y:'The late setup writes scalar 22 into global 0x75A80 and copies it to an object field; the second callback writes non-slot packed literals to that same global in a distinct path.',
 O97Z:'Two constructor calls have distinct typed LE Object-1 process entrypoints and share the verified constructor-to-scheduler entry field +0x1C.',
 O98A:'The object consumer has separate conditional offset adjustment and rendering-mode gate. Direct visibility is not guaranteed.',
 O98B:'The control update path adds ten source DWORDs into ten accumulator DWORDs, distinct from observed frame timing.',
 O98C:'Literal 13 selects the Mountain configuration in one routine, whereas literal 22 is stored in another scene path; sharing a global does not prove coactivation.'
};
function parseReloc(){const base=0x28f0c,ix=base+u(base+0x68),rec=base+u(base+0x6c),out=new Map();let n=0;for(let pg=0;pg<u(base+0x14);pg++){let at=rec+u(ix+pg*4),end=rec+u(ix+(pg+1)*4);while(at<end){let type=bin[at]&15,flags=bin[at+1],delta=bin.readInt16LE(at+2);at+=4;let object=flags&64?bin.readUInt16LE(at):bin[at];at+=flags&64?2:1;let target=null;if(type!==2){target=flags&16?u(at):bin.readUInt16LE(at);at+=flags&16?4:2;}if(flags&4)at+=flags&32?4:2;out.set(0x61c54+pg*4096+delta,{type,flags,object,target});n++;}if(at!==end)throw Error('relocation page bounds');}if(n!==27004)throw Error('relocation count');return out;}
let total=0;const run=(def)=>{let checks=0;const ok=(v,m)=>{checks++;if(!v)throw Error(`${def[0]} failed: ${m}`)};let [id,slug,start,end]=def;
let obj=JSON.parse(readFileSync(join(root,`mk2_${slug}_${id.toLowerCase()}_2026-10-09.json`),'utf8'));
ok(hash(bin)===SHA,'authentic MK2');ok(obj.status==='PASS'&&obj.pass===id&&obj.format==='mk2_ten_pass_stress_executable_contract_v1','identity');
ok(obj.sourceSlice.start===start && obj.sourceSlice.end===end,'expected window');const bytes=bin.subarray(start,end);ok(obj.sourceSlice.sha256===hash(bytes),'slice SHA');ok(obj.sourceSlice.hex===bytes.toString('hex'),'slice bytes');ok(obj.fixtureSha256===SHA,'reported fixture');
ok(obj.runtimeCoactivation==='UNPROVEN'&&obj.sceneIdentity==='UNPROVEN'&&obj.cameraUnits==='UNPROVEN'&&obj.frameTiming==='UNPROVEN','no runtime promotions');ok(obj.verdict==='SUPPORTED_CONDITIONALLY','classification');ok(obj.finding===supportedConclusions[id],'non-overclaimed supported finding');
let d=obj.observations;
const imm=(p,opcode)=>{ok(bin[p]===opcode,`imm ${p.toString(16)}`);return u(p+1)};
const call=(p,opcode=0xe8)=>{ok(bin[p]===opcode,`near ${p.toString(16)}`);return p+5+s(p+1)};
const store=(p)=>{ok(bin[p]===0xc7&&bin[p+1]===5,`store ${p.toString(16)}`);return [u(p+2),u(p+6)]};
const eq=(a,b,m)=>ok(JSON.stringify(a)===JSON.stringify(b),m);
if(id==='O97T'){
 eq(d.modeValues,[4,259],'two mode literals');eq(d.modeCalls,[0x86bbb,0x86bbb],'mode routine');
 eq([call(0x64596),call(0x645a0),call(0x645b8)],[0x86bbb,0x86bbb,0x67222],'near destinations');
 eq(d.accumulatorClearGlobal,u(0x645a8),'accumulator global');ok(bin.subarray(0x645a5,0x645ac).toString('hex')==='33c0a3e8420800','zero opcode');
 eq(d.constructorParameters,{EBX:4,EDXObject1:0x2038a},'process constructor args');ok(imm(0x645ae,0xbb)===4&&imm(0x645b3,0xba)===0x2038a,'arg opcodes');
 ok(bin[0x645bf]===0xc3&&d.tailOpcode===0xc3,'ret tail');ok(d.constructorTarget===0x67222,'reported constructor');
}
if(id==='O97U'){
 eq(d.leadingActorCall,call(0x84b40),'prelude actor helper');ok(d.leadingActorCall===0x7cf24,'prelude target');
 eq(d.modeValues,[4,259],'mode literals');eq(d.modeCalls,[call(0x84b4a),call(0x84b54)],'mode calls');
 ok(imm(0x84b45,0xb8)===4&&imm(0x84b4f,0xb8)===259,'mode opcode');eq(d.accumulatorClearGlobal,0x842e8,'base clear destination');
 eq(d.constructorParameters,[{EBX:4,EDXObject1:0x2038a,target:call(0x84b6c)},{EBX:256,EDXObject1:0x23209,target:call(0x84b7f)}],'two constructor tuples');
 ok(imm(0x84b62,0xbb)===4&&imm(0x84b67,0xba)===0x2038a,'first immediate types');ok(imm(0x84b75,0xbb)===256&&imm(0x84b7a,0xba)===0x23209,'second immediate types');
}
if(id==='O97V'){
 let sites=[[0x84e5d,0x84e67,0x84e71],[0x84e76,0x84e80,0x84e8a],[0x84e8f,0x84e99,0x84ea3]];
 eq(d.phases.map(x=>[x.packed.global,x.packed.value,x.second.global,x.second.value,x.helperTarget]),sites.map(([a,b,c])=>[...store(a),...store(b),call(c)]),'three phases');
 eq(d.phases.map(x=>x.packed.value),[0x30050,0x50050,0x70050],'packed values');eq(d.phases.map(x=>x.second.value),[0x30,0x40,0xf40],'second values');
 eq(d.phases.map(x=>x.helperTarget),[0x84eb7,0x84eb7,0x84eb7],'same helper');eq(d.tailMode,imm(0x84ea8,0xb8),'tail mode');eq(d.tailModeCall,call(0x84ead),'tail call');eq(d.finalTailJump,call(0x84eb2,0xe9),'exit tail');
}
if(id==='O97W'){
 ok(imm(0x84eb7,0xb8)===259&&d.modeLiteral===259,'literal');
 eq([d.modeCall,d.dataCall,d.schedulerTailJump],[call(0x84ebc),call(0x84ec1),call(0x84ecb,0xe9)],'helper targets');
 eq([d.modeCall,d.dataCall,d.schedulerTailJump],[0x86bbb,0x80d21,0x6710f],'expected routines');
 ok(bin[0x84ec6]===0xa1&&d.yieldSourceGlobal===u(0x84ec7)&&d.yieldSourceGlobal===0x75a7c,'scheduler parameter source');
}
if(id==='O97X'){
 eq(d.eventValues,[0xa3,0x3b,0x3c,0x3d],'four event parameters');eq(d.yieldValues,[0x30,0x28,0x28,0x78],'four yield parameters');
 let eventOffsets=[0x84b88,0x84ba0,0x84bb8,0x84bd0], waitOffsets=[0x84b94,0x84bac,0x84bc4,0x84bdc];
 for(let i=0;i<4;i++){ok(imm(eventOffsets[i],0xb8)===d.eventValues[i],'event opcode');ok(imm(waitOffsets[i],0xb8)===d.yieldValues[i],'wait opcode')}
 eq(d.eventCalls,[0x8140e,0x813c5,0x813c5,0x813c5],'event targets');eq(d.yieldCalls,[0x6710f,0x6710f,0x6710f,0x6710f],'yield targets');
 eq(d.eventCalls,[0x84b8d,0x84ba5,0x84bbd,0x84bd5].map(a=>call(a)),'event calls verified');eq(d.yieldCalls,[0x84b99,0x84bb1,0x84bc9,0x84be1].map(a=>call(a)),'yield calls verified');
 eq(d.followupCalls,[call(0x84be6),call(0x84beb)],'postamble calls');
}
if(id==='O97Y'){
 eq([d.lateScalarStore.global,d.lateScalarStore.value],store(0x84bfa),'scalar store');eq([d.lateScalarStore.global,d.lateScalarStore.value],[0x75a80,22],'scalar constant');
 ok(bin[0x84c05]===0x8b&&bin[0x84c06]===0x15,'mov load form');ok(d.copyFromGlobal===u(0x84c07),'global addr check');
 eq(d.copyFromGlobal,0x75a80,'same global');eq(d.copyToObjectCode,bin.subarray(0x84c0b,0x84c0e).toString('hex'),'field store');eq(d.copyToObjectCode,'895640','object +40');
 eq(d.separateSecondaryPackedStores.map(x=>[x.global,x.value]),[0x84e5d,0x84e76,0x84e8f].map(a=>store(a)),'separate writes');
}
if(id==='O97Z'){
 const r=parseReloc();ok(r.size>26000,'LE relocation coverage');const ptrs=[0x84b68,0x84b7b];
 eq(d.pointerOperandPhysical,ptrs,'relocation operand sites');for(let i=0;i<2;i++){const x=r.get(ptrs[i]);ok(!!x&&x.type===7&&x.flags===16&&x.object===1,'relocated executable callback');ok(x.target===[0x2038a,0x23209][i],'typed callback value')}
 eq(d.processCallbacks,[0x2038a,0x23209],'two distinct entries');eq(d.entryPhysicalTargets,[0x81fde,0x84e5d],'file physical targets');
 eq(d.constructorTargets,[call(0x84b6c),call(0x84b7f)],'construction direct calls');eq(d.constructorTargets,[0x67222,0x67222],'one constructor');eq(d.firstParam,[4,256],'distinct EBX params');
 eq(d.constructorFieldStore,bin.subarray(0x67248,0x6724b).toString('hex'),'save entrypoint');eq(d.schedulerIndirectJump,bin.subarray(0x67185,0x67188).toString('hex'),'jump via entrypoint');eq([d.constructorFieldStore,d.schedulerIndirectJump],['89501c','ff661c'],'same field +1c');
}
if(id==='O98A'){
 ok(bin.subarray(0x931e4,0x931e8).toString('hex')==='0fb74530','actor argument');eq(d.sourceFieldOffset,48,'field offset');eq(d.firstConditionalGlobal,u(0x931f8),'first branch global');eq(d.firstConditionalGlobal,0x75a88,'conditional global');
 ok(bin[0x93200]===0x75,'JNE');eq(d.firstConditionalBranchTarget,0x93202+bin.readInt8(0x93201),'first branch target');eq(d.firstConditionalBranchTarget,0x9320e,'first gate skip');
 eq(d.offsetWrites,[bin.subarray(0x93205,0x93208).toString('hex'),bin.subarray(0x9320b,0x9320e).toString('hex')],'offset additions');
 eq(d.offsetWrites,['015d18','015d1c'],'only conditional offsets');eq(d.gateGlobal,u(0x93210),'render flag location');eq(d.gateGlobal,0x562d4,'flag global');eq(d.gateImmediate,u(0x93214),'render bit');eq(d.gateImmediate,1,'bit 1');
 ok(bin[0x93218]===0x0f&&bin[0x93219]===0x84,'JE');eq(d.gateTarget,0x9321e+s(0x9321a),'render branch target');eq(d.gateTarget,0x93390,'consumer short-circuit path');
}
if(id==='O98B'){
 let at=0x93433,pairs=[];for(let i=0;i<10;i++){let src;if(bin[at]===0xa1){src=u(at+1);at+=5}else{ok(bin[at]===0x8b&&[0x1d,0x0d,0x15].includes(bin[at+1]),'indexed global load');src=u(at+2);at+=6;}ok(bin[at]===1&&[5,0x1d,0x0d,0x15].includes(bin[at+1]),'increment global opcode');let dst=u(at+2);at+=6;pairs.push([src,dst]);}ok(at===0x934a8,'exact ten increments');
 eq(d.updates.map(x=>[x.srcGlobal,x.dstGlobal]),pairs,'ten source/destination pairs');eq(pairs.map(x=>x[0]),[0x842e4,0x842ec,0x842f0,0x842f4,0x842f8,0x842fc,0x84300,0x84304,0x84308,0x8430c],'source ordering');eq(pairs.map(x=>x[1]),[0x842e8,0x84310,0x84314,0x84318,0x8431c,0x84320,0x84324,0x84328,0x8432c,0x84330],'dest ordering');
}
if(id==='O98C'){
 eq([d.mountainIndexStore.global,d.mountainIndexStore.value],store(0x85fa4),'mountain selector');eq(d.mountainIndexStore.value,13,'selector 13');eq(d.mountainIndexConsumer,call(0x85fae),'selector call');eq(d.mountainIndexConsumer,0x82321,'selector function');
 eq([d.otherScalarStore.global,d.otherScalarStore.value],store(0x84bfa),'other scalar');eq(d.otherScalarStore.value,22,'distinct scalar');
 ok(bin[0x84c05]===0x8b&&bin[0x84c06]===0x15,'global load');eq(d.objectScalarReadSource,u(0x84c07),'load address');eq(d.objectScalarReadSource,0x75a80,'same global');
 eq(d.objectFieldStore,bin.subarray(0x84c0b,0x84c0e).toString('hex'),'field store source');eq(d.objectFieldStore,'895640','object offset +40');eq([d.secondaryPackedSource.global,d.secondaryPackedSource.value],store(0x84e5d),'secondary callback');
 eq([d.mountainIndexStore.global,d.otherScalarStore.global,d.secondaryPackedSource.global],[0x75a80,0x75a80,0x75a80],'shared mutable global');
}
console.log(JSON.stringify({pass:id,independent:'PASS',checks,failures:0,conclusion:obj.finding}));return checks;};
for(const def of definitions){if(only&&def[0]!==only)continue;total+=run(def)}
console.log(JSON.stringify({stressTest:only||'O97T..O98C',independent:'PASS',totalChecks:total,failures:0}));
