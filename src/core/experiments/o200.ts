/** O200 — Forest registered callback body; original-source conditional coordinate writes.
 * Read-only static evidence. Does not claim the callback ran, object identities, screen
 * positions, durations, or authentic gameplay palette.
 */
import type {DirectorySource} from '../filesystem/DirectorySource';
import {hash,utf8} from '../assets/model';
import {buildStoredZip} from '../research/researchArtifactDownloads';
import {download} from '../assets/export';
import {runO199ForestInitializer} from './o199';

const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const SITES=[0x82c44,0x82c54,0x82c64] as const;
function ensure(c:unknown,message:string):asserts c{if(!c)throw new Error('O200 static callback verification: '+message);}
function word(b:DataView,at:number){return b.getUint32(at,true);}
function signed(b:DataView,at:number){return b.getInt32(at,true);}
function hx(b:Uint8Array,start:number,end:number){return Array.from(b.subarray(start,end),v=>v.toString(16).padStart(2,'0')).join('');}
function target(dv:DataView,at:number){return at+5+signed(dv,at+1);}
function signed16(n:number){return(n<<16)>>16;}
function scaled(n:number){return n-(n>>2);}
export type O200Object={index:number;instructionPhysical:number;packedEdx:number;rawHighSigned16:number;rawLowSigned16:number;
 outputField1A:number;outputField1E:number;field1APhysicalStore:0x64a41;field1EPhysicalStore:0x64a2a;
 helperCallPhysical:number;helperPhysical:0x82cb0;pointerStoragePhysical:number|null;sourceMeaning:'unverified-object-identity';};
export type O200Report={format:'mkdos_o200_forest_callback_coordinates_v1';status:'verified-original-static-instruction-mapping';
 source:{exeSHA256:string;size:number;callback2Physical:0x82c44;coordinateHelperPhysical:0x64a19;objectSetupHelperPhysical:0x82cb0;
  recordSetupFunctionPhysical:0x64548;recordInsertFunctionPhysical:0x665d4;firstCallbackPhysical:0x82b04;};
 objects:O200Object[];
 firstCallback:{guardReadOperand:number;guardComparison:number;exitTargetPhysical:number;conditionalCallerPhysical:number;
  originalLoopCount:number;loopWritePhysical:number;repeatBranchPhysical:number;result:'conditionally-reachable-loop-not-observed-runtime';};
 secondCallback:{sourceDescriptorOperand:number;listOperand:number;coordinateWriteMeaning:string;helperCallChain:{at:number;target:number}[];
  originalBytes:{name:string;start:number;end:number;hex:string}[];};
 verifiedByGameplay:false;originalGameFilesBundled:false;limits:string[];};
export async function runO200ForestCallbackCoordinates(source:DirectorySource):Promise<O200Report>{
 // Reuse O199's strict checks for original Forest initializer and typed function pointers.
 const prior=await runO199ForestInitializer(source);
 ensure(prior.registrations[1].targetPhysical===0x82c44,'O199 registration provenance changed');
 const files=(await source.listRecursive()).filter(f=>f.name.toUpperCase()==='MK2.EXE');
 ensure(files.length===1,'exactly one MK2.EXE required');
 const exe=await source.readSlice(files[0].path,0,files[0].size);
 ensure(exe.length===861133&&await hash(exe)===EXE_SHA,'canonical unpatched executable required');
 const dv=new DataView(exe.buffer,exe.byteOffset,exe.byteLength);
 // Authenticate the coordinate conversion itself, not only the caller literals.
 ensure(hx(exe,0x64a19,0x64a2e)==='508915845a0700c1fa108bc2c1f8022bd06689571e',
  'signed high-half 3/4 conversion and +1E store');
 ensure(hx(exe,0x64a2e,0x64a47)==='8b15845a0700c1e210c1fa108bc2c1f8022bd06689571a58c3',
  'signed low-half 3/4 conversion and +1A store');
 ensure(hx(exe,0x82cb0,0x82cbb)==='52c7056c5a0700146f0100', 'object descriptor +0x16F14 setup');
 ensure(exe[0x82cbb]===0xe8 && target(dv,0x82cbb)===0x64548,'flag/setup helper call');
 ensure(exe[0x82cc1]===0xe8 && target(dv,0x82cc1)===0x64a19,'coordinate helper call');
 ensure(exe[0x82cd2]===0xe9 && 0x82cd2+5+signed(dv,0x82cd3)===0x665d4,'list insertion tail jump');
 const objects:O200Object[]=SITES.map((at,index)=>{
  ensure(exe[at]===0xba&&exe[at+5]===0xe8,'MOV EDX and CALL at '+at.toString(16));
  ensure(target(dv,at+5)===0x82cb0,'three calls must target setup helper');
  const packed=word(dv,at+1),hi=signed16(packed>>>16),lo=signed16(packed&65535);
  ensure(hi===101 && [262,562,850][index]===lo,'original distinct Forest coordinate operands');
  return {index:index+1,instructionPhysical:at,packedEdx:packed,rawHighSigned16:hi,rawLowSigned16:lo,
   outputField1A:scaled(lo),outputField1E:scaled(hi),field1APhysicalStore:0x64a41,field1EPhysicalStore:0x64a2a,
   helperCallPhysical:at+5,helperPhysical:0x82cb0,pointerStoragePhysical:index===0?0x82c4e:index===1?0x82c5e:null,
   sourceMeaning:'unverified-object-identity'};
 });
 ensure(JSON.stringify(objects.map(x=>[x.outputField1A,x.outputField1E]))==='[[197,76],[422,76],[638,76]]',
  'independent arithmetic result changed');
 // The first callback is guarded; its loop-count operand is 3, not a measured frame count.
 ensure(exe[0x82b04]===0xa1 && word(dv,0x82b05)===0x7650a,'first callback source state read');
 ensure(hx(exe,0x82b09,0x82b12)==='83f8010f847746feff','conditional exit guard');
 ensure(exe[0x82bb6]===0xc7 && word(dv,0x82bb8)===0x75a7c && word(dv,0x82bbc)===3,
  'first callback loop initializes counter to three');
 ensure(hx(exe,0x82c37,0x82c3f)==='ff0d7c5a07007581','first callback decrements loop counter and jumps back');
 ensure(exe[0x82c3f]===0xe9 && 0x82c3f+5+signed(dv,0x82c40)===0x67189,
  'first callback tail jumps to task cleanup');
 const sections=[
  {name:'first_callback',start:0x82b04,end:0x82c44},
  {name:'second_callback',start:0x82c44,end:0x82cd7},
  {name:'packed_coordinate_helper',start:0x64a19,end:0x64a47},
  {name:'object_setup_helper',start:0x82cb0,end:0x82cd7},
  {name:'list_insert_function',start:0x665d4,end:0x6664d},
  {name:'callback_scheduler_context',start:0x6710f,end:0x671b9},
 ];
 return {format:'mkdos_o200_forest_callback_coordinates_v1',status:'verified-original-static-instruction-mapping',
  source:{exeSHA256:EXE_SHA,size:exe.length,callback2Physical:0x82c44,coordinateHelperPhysical:0x64a19,
   objectSetupHelperPhysical:0x82cb0,recordSetupFunctionPhysical:0x64548,recordInsertFunctionPhysical:0x665d4,
   firstCallbackPhysical:0x82b04},objects,
  firstCallback:{guardReadOperand:0x7650a,guardComparison:1,exitTargetPhysical:0x67189,conditionalCallerPhysical:0x93a8a,
   originalLoopCount:3,loopWritePhysical:0x82bb6,repeatBranchPhysical:0x82c3d,
   result:'conditionally-reachable-loop-not-observed-runtime'},
  secondCallback:{sourceDescriptorOperand:0x16f14,listOperand:0x84350,
   coordinateWriteMeaning:'signed high16 -> field +0x1E and signed low16 -> field +0x1A; each half transformed by n-(n>>2). No screen-space or object identity asserted.',
   helperCallChain:[{at:0x82cbb,target:0x64548},{at:0x82cc1,target:0x64a19},{at:0x82cd2,target:0x665d4}],
   originalBytes:sections.map(s=>({...s,hex:hx(exe,s.start,s.end)}))},
  verifiedByGameplay:false,originalGameFilesBundled:false,
  limits:['All original bytes and arithmetic were authenticated against the canonical unpatched MK2.EXE, following O199 pointer checks.',
   'Numbers 197/422/638 and 76 are object-field write values, not verified game-screen positions or stage-layer coordinates.',
   'Callback registration and function reachability do not prove the callback was scheduled, that object allocation succeeded, or that graphical records were rendered.',
   'The first callback has a conditional gate and a source-coded loop counter of 3. That is not a measured animation duration or number of frames.',
   'The 0x16F14 and 0x84350 operands are source literals linked to object setup and list insertion; their full semantic roles remain under investigation.',
   'No original game resources are modified or bundled. This is independent of the DOSBox control-vs-NOP runtime witness.']};
}
const json=(v:unknown)=>utf8.encode(JSON.stringify(v,null,2)+'\n');
export function o200CoordinatesSvg(r:O200Report):Uint8Array{
 const x0=45,x1=930,w=980,h=240;
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="980" height="240" fill="#121821"/><text x="30" y="32" fill="#ffffff" font-family="monospace" font-size="18">Forest — original object-field values (NOT rendered coordinates)</text><line x1="${x0}" x2="${x1}" y1="120" y2="120" stroke="#677788" stroke-width="2"/>`;
 r.objects.forEach(o=>{const x=x0+o.outputField1A/700*(x1-x0);
  svg+=`<line x1="${x}" x2="${x}" y1="99" y2="140" stroke="#84d9b5" stroke-width="3"/><circle cx="${x}" cy="120" r="8" fill="#84d9b5"/><text x="${x}" y="87" text-anchor="middle" fill="#f2f4f6" font-family="monospace" font-size="14">${o.outputField1A}, ${o.outputField1E}</text><text x="${x}" y="164" text-anchor="middle" fill="#adbdc9" font-family="monospace" font-size="12">Object ${o.index}</text>`;});
 svg+='<text x="30" y="218" fill="#e8bc89" font-family="monospace" font-size="12">Scale and object identities remain unresolved; no camera, palette or sprite identity implied.</text></svg>';
 return utf8.encode(svg);
}
export function buildO200ForestEvidenceZip(r:O200Report):Uint8Array{
 return buildStoredZip([
  {name:'SUMMARY.md',bytes:utf8.encode('# O200 Forest callback coordinate field derivation\n\nThe canonical original MK2.EXE gives three packed EDX inputs which are transformed by the shared original helper at 0x64A19 and written to object fields +0x1A and +0x1E. These are source-calculated object field values, **not verified gameplay positions**. The first callback also has a conditional state gate and a three-iteration source loop.\n\nNo DOSBox run or graphics substitution was performed. The prior O199 test kit remains a separate runtime experiment.\n')},
  {name:'MANIFEST.json',bytes:json({format:r.format,status:r.status,originalExeSHA256:r.source.exeSHA256,originalFilesBundled:false,liveCallbackObserved:false})},
  {name:'evidence/report.json',bytes:json(r)},
  {name:'evidence/object_coordinates.json',bytes:json(r.objects)},
  {name:'evidence/callback_instruction_windows.json',bytes:json(r.secondCallback.originalBytes)},
  {name:'results/object_field_values.svg',bytes:o200CoordinatesSvg(r)},
  {name:'diagnostics/limits.json',bytes:json(r.limits)},
  {name:'reproduce/README.md',bytes:utf8.encode('From the O200 source tree run node scripts/verify-o200-fixture.cjs <canonical-MK2-directory> then python scripts/verify-o200-export.py <canonical-MK2-directory> <this-ZIP>. Both reread original bytes. The independent Python verifier calculates the packed halfword transformations without importing the browser implementation. No commercial EXE or GRA is bundled.\n')},
 ]);
}
export function exportO200ForestEvidence(r:O200Report){download(buildO200ForestEvidenceZip(r),'MKDOS_O200_Forest_Callback_Object_Field_Evidence.zip','application/zip');}
