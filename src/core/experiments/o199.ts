/** O199 — Original MK2 Forest initializer and conditional background-task registration.
 * STATIC executable evidence only. This module does not execute game code, choose a live
 * mode, determine artwork placement, or infer behavior/frame timing from numeric operands.
 */
import type {DirectorySource} from '../filesystem/DirectorySource';
import {hash,utf8} from '../assets/model';
import {buildStoredZip} from '../research/researchArtifactDownloads';
import {download} from '../assets/export';

const SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const OBJ1=0x61c54,OBJ2=0xa0c54;
const ROOTS=[0x16b56,0x16bda,0x16c46] as const;
const TABLES=[0x15bec,0x15c68,0x15ce4] as const;
const REGISTRATIONS=[{name:'first',moveAt:0x82adb,fn:0x82b04,condition:'all modes'},
  {name:'second',moveAt:0x82af7,fn:0x82c44,condition:'mode != 0'}] as const;
function need(v:unknown,message:string):asserts v{if(!v)throw new Error('O199 Forest initializer source: '+message);}
function hex(b:Uint8Array,start:number,end:number){return Array.from(b.subarray(start,end),x=>x.toString(16).padStart(2,'0')).join('');}
function read32(b:DataView,at:number){need(at>=0&&at+4<=b.byteLength,'DWORD outside file');return b.getUint32(at,true);}
function signed32(b:DataView,at:number){need(at>=0&&at+4<=b.byteLength,'signed DWORD outside file');return b.getInt32(at,true);}
export type O199Registration={name:'first'|'second';condition:string;instructionPhysical:number;pointerOperandPhysical:number;
 pointerSourceObject1:number;targetObject1:number;targetPhysical:number;registrationCallPhysical:number;registrationHelperPhysical:0x67222;
 groupArgumentEBX:6;codeBytesHex:string;targetFunctionBytesHex:string;targetFunctionSHA256:string;
 liveObjectAllocated:false;functionExecutedDuringGameplay:false;};
export type O199Mode={modeValue:number;stageTableBranch:'mode_equals_2'|'mode_equals_1'|'mode_other';rootObject2:number;
 setupVariantsReferenced:number[];initializerPhysical:0x82ad4;initializerRegistrationsReached:string[];liveModeObserved:false;};
export type O199Report={format:'mkdos_o199_forest_mode_conditional_registration_v1';status:'verified-original-static-branch-and-registered-function-pointers';
 source:{exeSHA256:string;exeSize:number;initializerPhysical:0x82ad4;initializerObject1:number;modeGlobalObject2:0x3014c;
 registrationHelperPhysical:0x67222;freeListGlobalObject2:0x35b08;taskCallbackFieldOffset:0x1c;
 initializerModeComparePhysical:0x82ae7;secondRegistrationSkipPhysical:0x82b03;};
 registrations:O199Registration[];modes:O199Mode[];helperEvidence:{codeStartPhysical:number;codeBytesHex:string;
 allocPoolReadPhysical:0x67224;storedCallbackPointerPhysical:0x67248;storedGroupPhysical:0x67272;
 noFreeEntryBranchPhysical:0x6727f;interpretation:string;};
 functionObservations:{first:{branchAtPhysical:number;conditionVariableObject2:number;earlyComparisonValue:number;
 originalBoundedConstants:number[];observedObjectFieldWrites:{atPhysical:number;fieldOffset:number;sourceGlobalObject2:number}[]};
 second:{rawImmediateEdxValues:number[];subhelperPhysical:number;originalBoundedConstants:number[]}};
 limitations:string[]};
export async function runO199ForestInitializer(source:DirectorySource):Promise<O199Report>{
 const inventory=await source.listRecursive();const es=inventory.filter(f=>f.name.toUpperCase()==='MK2.EXE');
 need(es.length===1,'exactly one MK2.EXE is required');
 const exe=await source.readSlice(es[0].path,0,es[0].size);
 need(exe.length===861133&&await hash(exe)===SHA,'expected canonical, original unpatched MK2.EXE');
 const dv=new DataView(exe.buffer,exe.byteOffset,exe.byteLength);
 // The original O134 callback pointer is retained by every O198 Forest root.
 for(let i=0;i<3;i++){
  need(read32(dv,OBJ2+TABLES[i]+4*4)===ROOTS[i],'Forest conditional table entry '+i);
  need(read32(dv,OBJ2+ROOTS[i]+0x10)===0x20e80,'Forest initializer pointer '+i);
 }
 need(hex(exe,0x82ad4,0x82adb)==='5251bb06000000','unconditional registration entry and EBX argument');
 need(hex(exe,0x82ae5,0x82af0)==='595a833d4c010300007413','restore registers then mode-0 branch');
 need(hex(exe,0x82b01,0x82b04)==='595ac3','second registration return boundary');
 need(hex(exe,0x67222,0x6722d)==='5551a1085b030085c07452','registration allocator entry and no-free branch');
 need(hex(exe,0x67248,0x6724e)==='89501c896808','callback pointer store in pool object');
 need(hex(exe,0x67272,0x6727f)==='66895804c7404c000000005dc3','argument flag word and return');
 const registers:O199Registration[]=[];
 for(let i=0;i<REGISTRATIONS.length;i++){
  const spec=REGISTRATIONS[i],operand=spec.moveAt+1,call=spec.moveAt+5;
  need(exe[spec.moveAt]===0xba&&exe[call]===0xe8,'MOV EDX and CALL sequence '+spec.name);
  need(read32(dv,operand)===spec.fn-OBJ1,'function literal pointer '+spec.name);
  need(call+5+signed32(dv,call+1)===0x67222,'callback registration helper '+spec.name);
  const end=i===0?0x82c44:0x82cd7;
  registers.push({name:spec.name,condition:spec.condition,instructionPhysical:spec.moveAt,pointerOperandPhysical:operand,
   pointerSourceObject1:operand-OBJ1,targetObject1:spec.fn-OBJ1,targetPhysical:spec.fn,
   registrationCallPhysical:call,registrationHelperPhysical:0x67222,groupArgumentEBX:6,
   codeBytesHex:hex(exe,spec.moveAt,spec.moveAt+10),targetFunctionBytesHex:hex(exe,spec.fn,end),
   targetFunctionSHA256:await hash(exe.subarray(spec.fn,end)),liveObjectAllocated:false,functionExecutedDuringGameplay:false});
 }
 // These constants are original immediate operands at bounded function locations;
 // they must not be silently interpreted as frame rates, source sprites or time.
 need(hex(exe,0x82b04,0x82b12)==='a10a65070083f8010f847746feff','first callback function entry');
 need(hex(exe,0x82b12,0x82b1c)==='b864000000e86e0f0100','first callback fixed input + call');
 need(hex(exe,0x82bc0,0x82bca)==='b840010000e81b1afeff','first callback fixed input + call');
 need(hex(exe,0x82c44,0x82c4e)==='ba06016500e862000000','second callback first bounded operand');
 need(hex(exe,0x82c54,0x82c5e)==='ba32026500e852000000','second callback second bounded operand');
 need(hex(exe,0x82c64,0x82c6e)==='ba52036500e842000000','second callback third bounded operand');
 const modes:O199Mode[]=[0,1,2,3].map(modeValue=>{
  const branch=modeValue===2?0:modeValue===1?1:2;
  return{modeValue,stageTableBranch:(['mode_equals_2','mode_equals_1','mode_other'] as const)[branch],
   rootObject2:ROOTS[branch],setupVariantsReferenced:branch===0?[1,2,3,4,5]:[1,2,5],
   initializerPhysical:0x82ad4,initializerRegistrationsReached:modeValue===0?['first']:['first','second'],liveModeObserved:false};
 });
 return{format:'mkdos_o199_forest_mode_conditional_registration_v1',status:'verified-original-static-branch-and-registered-function-pointers',
  source:{exeSHA256:SHA,exeSize:exe.length,initializerPhysical:0x82ad4,initializerObject1:0x20e80,modeGlobalObject2:0x3014c,
   registrationHelperPhysical:0x67222,freeListGlobalObject2:0x35b08,taskCallbackFieldOffset:0x1c,
   initializerModeComparePhysical:0x82ae7,secondRegistrationSkipPhysical:0x82b03},registrations:registers,modes,
  helperEvidence:{codeStartPhysical:0x67222,codeBytesHex:hex(exe,0x67222,0x6728b),allocPoolReadPhysical:0x67224,
   storedCallbackPointerPhysical:0x67248,storedGroupPhysical:0x67272,noFreeEntryBranchPhysical:0x6727f,
   interpretation:'Original function stores EDX into an object +0x1C field and BX into its +0x04 word when a pool entry is available. It is registration-like; source reachability does not guarantee allocation or execution.'},
  functionObservations:{first:{branchAtPhysical:0x82b09,conditionVariableObject2:0x7650a,earlyComparisonValue:1,
   originalBoundedConstants:[100,80,84,320,12,64],observedObjectFieldWrites:[{atPhysical:0x82b90,fieldOffset:0x1e,sourceGlobalObject2:0x842ea},
    {atPhysical:0x82ba1,fieldOffset:0x1a,sourceGlobalObject2:0x8432e}]},
   second:{rawImmediateEdxValues:[0x650106,0x650232,0x650352],subhelperPhysical:0x82cb0,originalBoundedConstants:[192,128,182,5]}},
  limitations:['Mode selection is a static branch outcome; no DOSBox mode measurement is included.',
   'The initializer reaches registration helper call sites conditionally. The original helper allocates from a pool and has a no-free path; reaching a call site does not prove an object exists or its callback runs.',
   'The register-target function bytes and embedded constants are source-proven, but their visual meaning, sprite/frame identity, timings and camera behavior have NOT been established.',
   'Mode 1 and fallback Forest root payloads are byte-identical, but mode 0 takes a different initializer path than nonzero modes.',
   'This report does not change game files, execute original code, or render a completed Forest gameplay scene.']};
}
export function o199ForestSourceMatrixSvg(report:O199Report):Uint8Array{
 const labels=['Mode','Root Object 2','Setup layers','First callback','Second callback'];
 let x=`<svg xmlns="http://www.w3.org/2000/svg" width="980" height="340" viewBox="0 0 980 340"><rect width="100%" height="100%" fill="#121821"/><text x="18" y="33" fill="#f4f6fa" font-family="monospace" font-size="19">MK2 Forest — conditional source graph, NOT gameplay state</text>`;
 const cols=[18,150,345,540,745];
 labels.forEach((t,i)=>x+=`<text x="${cols[i]}" y="74" fill="#b8cedb" font-family="monospace" font-size="14">${t}</text>`);
 report.modes.forEach((m,i)=>{
  const y=102+i*48;
  x+=`<rect x="12" y="${y-22}" width="956" height="42" rx="5" fill="${i%2?'#202938':'#1a2430'}"/>`;
  [String(m.modeValue),`0x${m.rootObject2.toString(16).toUpperCase()}`,m.setupVariantsReferenced.join(', '),'reachable',m.initializerRegistrationsReached.length===2?'reachable':'SKIPPED'].forEach((t,k)=>x+=`<text x="${cols[k]}" y="${y+5}" fill="${k===4?(m.modeValue===0?'#e9bd77':'#86dfb5'):'#eff3f7'}" font-family="monospace" font-size="15">${t}</text>`);
 });
 x+=`<text x="18" y="317" fill="#edbf89" font-family="monospace" font-size="13">All rows are conditional control-flow predictions, not observed runtime allocation or execution.</text></svg>`;
 return utf8.encode(x);
}
const json=(x:unknown)=>utf8.encode(JSON.stringify(x,null,2)+'\n');
export function buildO199ForestEvidenceZip(report:O199Report):Uint8Array{
 const summary='# O199 — Forest mode-gated original initializer callbacks\n\nOriginal source and two relocation-backed callback pointers are independently testable. The MK2 stage mode branches influence both the referenced root group and the reachable Forest registration sites. Mode 0 skips the second; modes 1, 2 and 3 reach it. These are static instruction-flow outcomes, NOT measured fight activation.\n\nNo commercial EXE/GRA is bundled. Original byte windows only. Exact offsets, callback targets and limitations are in evidence/report.json.\n';
 return buildStoredZip([
  {name:'SUMMARY.md',bytes:utf8.encode(summary)},
  {name:'MANIFEST.json',bytes:json({format:report.format,status:report.status,originalExeSHA256:report.source.exeSHA256,
   sourceGameFilesBundled:false,liveModeObserved:false,verifiedByExternalEmulator:false})},
  {name:'evidence/report.json',bytes:json(report)},
  {name:'evidence/source_instruction_explanation.md',bytes:utf8.encode('# Instruction-level interpretation\n\nThe original stage root pointers at Object 2 +0x16B56/+0x16BDA/+0x16C46 carry a relocation-backed initializer pointer to Object 1 +0x20E80 (physical 0x82AD4). The initializer places the first callback target 0x82B04 into EDX and calls 0x67222. It then compares the mode global at Object 2 +0x3014C with zero. The JE instruction at 0x82AEE branches to the return at 0x82B03 when equal. Otherwise the initializer places callback target 0x82C44 into EDX and calls the same helper.\n\nThe helper stores the EDX callback pointer at [allocated-object+0x1C] when its pool list is nonempty, and also stores the BX argument 6 as a 16-bit word at +0x04. Its pool-empty branch is real. These are authenticated source instructions, not proof the callback executes or renders an object.\n\nMode 1 and fallback Forest root payloads are identical, but mode zero uniquely SKIPS the second registration. The attached byte-window records, signed call displacements, original source offsets and SHA-256 hashes make the test reproducible.\n')},
  {name:'evidence/conditional_mode_matrix.json',bytes:json(report.modes)},
  {name:'evidence/original_callback_instruction_windows.json',bytes:json({registrationSites:report.registrations.map(({targetFunctionBytesHex,...v})=>v),
   allocator:report.helperEvidence})},
  {name:'diagnostics/verification_limits.json',bytes:json(report.limitations)},
  {name:'results/forest_mode_callback_matrix.svg',bytes:o199ForestSourceMatrixSvg(report)},
  {name:'reproduce/README.md',bytes:utf8.encode('From the O199 source project run: node scripts/verify-o199-fixture.cjs <original-MK2-directory> and python scripts/verify-o199-export.py <original-MK2-directory> <exported-ZIP>. The Python verifier independently reparses original LE relocation records; the source has to match the canonical MK2.EXE SHA-256. No original MK2 files are bundled.\n')}
 ]);
}
export function exportO199ForestEvidence(report:O199Report){download(buildO199ForestEvidenceZip(report),'MKDOS_O199_Forest_Mode_Gated_Callback_Evidence.zip','application/zip');}
