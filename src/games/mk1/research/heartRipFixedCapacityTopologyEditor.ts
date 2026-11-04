/**
 * MK1 bounded heart-rip fixed-capacity topology editor — Pass 1E.3O.12.
 *
 * Scope:
 *  - author heart_2 only inside its already-qualified 16-byte allocation;
 *  - allow 1..4 unique pointers chosen from the nine O8-qualified KHEART descriptors;
 *  - encode 1..3 parts as pointer list + zero terminator, zero-filling unused slots;
 *  - encode 4 parts as four descriptor pointers, terminated by O10-qualified linked-object exhaustion;
 *  - preserve every byte outside the existing heart_2 allocation;
 *  - prove whole-EXE diff, semantic reparse and exact reversal for every edit.
 *
 * Still blocked: duplicate descriptor pointers, zero-part frames, >4 parts, other frame records,
 * relocation/allocation, descriptor bytes, GRA pixels, palettes and gameplay/collision data.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { sha256Bytes } from './paletteRoundTripCodec';
import {
  HEART_RIP_SYMBOLS,
  HeartRipDescriptorSymbol,
  MK1HeartRipAnimationCanvasEditorReport,
} from './heartRipAnimationCanvasEditor';
import {
  MK1BoundedAnimationIrRegion,
  MK1MultiPartFrameLosslessIrReport,
  serializeMK1BoundedAnimationIr,
} from './multiPartFrameLosslessIr';
import { MK1ReshapeMultiFullCapacitySemanticsReport } from './reshapeMultiFullCapacitySemantics';
import { MK1HeartRipFourthPartTopologyReport } from './heartRipFourthPartTopologyWriter';

const CANONICAL_SHA = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const TARGET_FRAME_KEY = 'heart_2';
const TARGET_RECORD_SIZE = 16;

function hx(v:number):string{return `0x${(v>>>0).toString(16).padStart(8,'0').toUpperCase()}`;}
function readU32(b:Uint8Array,o:number){if(o<0||o+4>b.length)throw new Error(`u32 OOB ${hx(o)}`);return (b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0;}
function u32Bytes(v:number):Uint8Array{return new Uint8Array([v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]);}
function cloneIr(ir:MK1MultiPartFrameLosslessIrReport['ir']):MK1MultiPartFrameLosslessIrReport['ir']{return JSON.parse(JSON.stringify(ir)) as MK1MultiPartFrameLosslessIrReport['ir'];}
function diff(a:Uint8Array,b:Uint8Array){if(a.length!==b.length)throw new Error('Executable lengths differ');const out:Array<{physicalOffset:number;physicalOffsetHex:string;before:number;after:number}>=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])out.push({physicalOffset:i,physicalOffsetHex:hx(i),before:a[i],after:b[i]});return out;}
function sameDiff(a:ReturnType<typeof diff>,b:ReturnType<typeof diff>){if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i].physicalOffset!==b[i].physicalOffset||a[i].before!==b[i].before||a[i].after!==b[i].after)return false;return true;}

function encodeFixedCapacity(refs:readonly number[]):Uint8Array{
  if(refs.length<1||refs.length>4)throw new Error('heart_2 topology must contain 1..4 descriptor pointers');
  const out=new Uint8Array(TARGET_RECORD_SIZE);
  refs.forEach((ref,i)=>out.set(u32Bytes(ref),i*4));
  // For under-capacity records the first unused dword is the zero terminator;
  // any later bytes are also normalized to zero inside the same qualified allocation.
  return out;
}

function parseFixedCapacity(bytes:Uint8Array,physicalStart:number,refToSymbol:Map<number,HeartRipDescriptorSymbol>):HeartRipDescriptorSymbol[]{
  const out:HeartRipDescriptorSymbol[]=[];
  for(let i=0;i<4;i++){
    const ref=readU32(bytes,physicalStart+i*4);
    if(ref===0){
      for(let j=i+1;j<4;j++)if(readU32(bytes,physicalStart+j*4)!==0)throw new Error('Non-zero dword exists after under-capacity zero terminator');
      break;
    }
    const symbol=refToSymbol.get(ref);if(!symbol)throw new Error(`Unqualified descriptor ref ${hx(ref)} in heart_2 topology`);
    out.push(symbol);
  }
  if(out.length<1||out.length>4)throw new Error('Reparsed heart_2 topology has invalid part count');
  return out;
}

export function serializeMK1HeartRipFixedCapacityTopologyIr(
  baselineIr:MK1MultiPartFrameLosslessIrReport['ir'],
  editedIr:MK1MultiPartFrameLosslessIrReport['ir'],
  staticDataBase:number,
):MK1BoundedAnimationIrRegion[]{
  const baseline=baselineIr.frames.find(f=>f.frameKey===TARGET_FRAME_KEY), target=editedIr.frames.find(f=>f.frameKey===TARGET_FRAME_KEY);
  if(!baseline||!target)throw new Error('O12 requires heart_2 in baseline and edited IR');
  if(baseline.parts.length!==3||baseline.recordOffset!==target.recordOffset)throw new Error('O12 baseline heart_2 identity drifted');
  if(target.parts.length<1||target.parts.length>4)throw new Error('O12 target topology must contain 1..4 parts');
  if(target.parts.some((p,i)=>p.structuralIndex!==i))throw new Error('O12 structural indices must be contiguous from zero');

  // Preserve O2 as authority for all non-target semantic regions. Baseline heart_2
  // already occupies the complete 16-byte allocation, so replace only that region.
  const regions=serializeMK1BoundedAnimationIr(baselineIr,staticDataBase).map(r=>({name:r.name,physicalStart:r.physicalStart,encoded:r.encoded.slice()}));
  const region=regions.find(r=>r.name===`FRAME_${hx(target.recordOffset)}`);if(!region)throw new Error('O12 target frame region missing');
  if(region.encoded.length!==TARGET_RECORD_SIZE)throw new Error('O12 heart_2 baseline allocation is not 16 bytes');
  region.encoded=encodeFixedCapacity(target.parts.map(p=>p.descriptorRef));
  return regions;
}

export interface MK1HeartRipFixedCapacityTopologyEditorReport{
  format:'mk1_heart_rip_fixed_capacity_topology_editor_model_v1';timestamp:string;operationId:string;
  provenance:MK1HeartRipAnimationCanvasEditorReport['provenance'];fixture:MK1HeartRipAnimationCanvasEditorReport['fixture'];
  prerequisite:{
    o8:{pass:'1E.3O.8';operationId:string;validationPassed:true};
    o10:{pass:'1E.3O.10';operationId:string;verdict:'FULL_CAPACITY_CHAIN_EXHAUSTION_ESTABLISHED_FOURTH_PART_FITS_IN_PLACE';validationPassed:true};
    o11:{pass:'1E.3O.11';operationId:string;verdict:'CONTROLLED_FOURTH_PART_IN_PLACE_TOPOLOGY_WRITE_ESTABLISHED';validationPassed:true};
  };
  target:{frameKey:'heart_2';recordWatcomOffset:number;recordWatcomOffsetHex:string;physicalStart:number;physicalStartHex:string;allocationByteLength:16;baselineParts:HeartRipDescriptorSymbol[];minParts:1;maxParts:4};
  availableDescriptors:Array<{symbol:HeartRipDescriptorSymbol;descriptorRef:number;descriptorRefHex:string;width:number;height:number;x:number;y:number;decodeQualified:true}>;
  encoding:{underCapacity:'POINTERS_THEN_ZERO_TERMINATOR';fullCapacity:'FOUR_POINTERS_CHAIN_EXHAUSTION';zeroFillAfterTerminator:true;relocationUsed:false;sequencePointerRewriteUsed:false};
  authoring:{add:true;remove:true;reorder:true;replace:true;duplicatesAllowed:false;otherFramesWritable:false;arbitraryPointersAllowed:false};
  noEditRoundTrip:{sourceSha256:string;rebuiltSha256:string;mismatchCount:number;exact:boolean;semanticRegionCount:number};
  decision:{boundedOneToFourPartAuthoringEstablished:boolean;fixedCapacityOnly:true;genericTopologyEditingEstablished:false;relocationAllocationEstablished:false;verdict:'HEART2_FIXED_CAPACITY_1_TO_4_PART_TOPOLOGY_AUTHORING_ESTABLISHED'|'HEART2_FIXED_CAPACITY_TOPOLOGY_AUTHORING_FAILED';narrative:string};
  status:'SUCCESS'|'FAILED';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean}>};
  baselineIr:MK1MultiPartFrameLosslessIrReport['ir'];
}

export interface MK1HeartRipFixedCapacityTopologyEditRequest{parts:HeartRipDescriptorSymbol[];note?:string;}
export interface MK1HeartRipFixedCapacityTopologyEditReport{
  format:'mk1_heart_rip_fixed_capacity_topology_edit_v1';timestamp:string;operationId:string;
  provenance:MK1HeartRipFixedCapacityTopologyEditorReport['provenance'];fixture:MK1HeartRipFixedCapacityTopologyEditorReport['fixture'];
  prerequisite:{pass:'1E.3O.12';operationId:string;verdict:'HEART2_FIXED_CAPACITY_1_TO_4_PART_TOPOLOGY_AUTHORING_ESTABLISHED';validationPassed:true};
  request:MK1HeartRipFixedCapacityTopologyEditRequest;
  topology:{before:HeartRipDescriptorSymbol[];after:HeartRipDescriptorSymbol[];beforePartCount:number;afterPartCount:number;terminationAfter:'ZERO_DWORD'|'LINKED_OBJECT_CHAIN_EXHAUSTION';allocationByteLength:16};
  editedIr:MK1MultiPartFrameLosslessIrReport['ir'];
  evidence:{originalSha256:string;editedSha256:string;reversedSha256:string;changedByteCount:number;expectedChangedByteCount:number;changedBytes:ReturnType<typeof diff>;expectedChangedBytes:ReturnType<typeof diff>;unexpectedByteChanges:number;wholeExecutableDiffExactlyExpected:boolean;reparsedParts:HeartRipDescriptorSymbol[];semanticReparseMatches:boolean;followingRecordPreserved:boolean;reverseRestoresOriginal:boolean};
  constraints:{targetFrameOnly:true;frameAllocationUnchanged:true;setupObjectCountUnchanged:true;sequencePointersUntouched:true;otherFrameRecordsUntouched:true;descriptorBytesUntouched:true;graPixelsUntouched:true;paletteUntouched:true;relocationUnused:true;collisionAndGameplayUntouched:true;duplicateDescriptorUseBlocked:true;genericOtherFrameTopologyStillBlocked:true};
  status:'STATIC_VALIDATION_PASSED';
}
export interface MK1HeartRipFixedCapacityTopologyEditResult{report:MK1HeartRipFixedCapacityTopologyEditReport;originalExe:Uint8Array;editedExe:Uint8Array;}

async function readCanonicalExe(source:DirectorySource,model:MK1HeartRipFixedCapacityTopologyEditorReport){
  if(source.isSynthetic!==false)throw new Error('1E.3O.12 requires an authentic user-loaded MK1 directory');
  const entries=await source.listRecursive(),entry=entries.find(e=>e.path===model.fixture.exePath);if(!entry||entry.size!==model.fixture.exeSize)throw new Error('MK1.EXE missing or size changed before O12 authoring');
  const bytes=await source.readSlice(entry.path,0,entry.size),hash=await sha256Bytes(bytes);if(hash!==CANONICAL_SHA)throw new Error(`1E.3O.12 requires canonical MK1.EXE; got ${hash}`);return{bytes,hash};
}

export async function executeHeartRipFixedCapacityTopologyEditorModel(
  source:DirectorySource,
  o8:MK1HeartRipAnimationCanvasEditorReport,
  o10:MK1ReshapeMultiFullCapacitySemanticsReport,
  o11:MK1HeartRipFourthPartTopologyReport,
):Promise<MK1HeartRipFixedCapacityTopologyEditorReport>{
  if(source.isSynthetic!==false)throw new Error('1E.3O.12 requires authentic user-loaded source');
  if(o8.status!=='SUCCESS'||!o8.validation.allChecksPassed||o8.provenance.sha256!==CANONICAL_SHA)throw new Error('O12 requires successful canonical O8');
  if(o10.status!=='SUCCESS'||!o10.validation.allChecksPassed||o10.decision.verdict!=='FULL_CAPACITY_CHAIN_EXHAUSTION_ESTABLISHED_FOURTH_PART_FITS_IN_PLACE')throw new Error('O12 requires qualified O10 full-capacity semantics');
  if(o11.status!=='STATIC_VALIDATION_PASSED_RUNTIME_PENDING'||!o11.validation.allChecksPassed||o11.decision.verdict!=='CONTROLLED_FOURTH_PART_IN_PLACE_TOPOLOGY_WRITE_ESTABLISHED')throw new Error('O12 requires successful controlled O11 topology write');
  const {bytes,hash}=await readCanonicalExe(source,{fixture:o8.fixture} as MK1HeartRipFixedCapacityTopologyEditorReport);
  const baseline=o8.baselineIr.frames.find(f=>f.frameKey===TARGET_FRAME_KEY);if(!baseline||baseline.parts.length!==3)throw new Error('O12 baseline heart_2 topology drifted');
  const qualified=new Set(HEART_RIP_SYMBOLS);
  const available=o8.descriptors.map(d=>({symbol:d.symbol,descriptorRef:d.watcomOffset,descriptorRefHex:d.watcomOffsetHex,width:d.width,height:d.height,x:d.x,y:d.y,decodeQualified:true as const}));
  if(available.length!==9||available.some(d=>!qualified.has(d.symbol)))throw new Error('O12 expected all nine KHEART descriptors');
  if(o8.descriptors.some(d=>!d.decode.success||d.decode.outOfPaletteRangeCount!==0))throw new Error('O12 requires all nine KHEART descriptors decode-qualified');
  const physicalStart=o8.coordinateModel.staticDataBase+baseline.recordOffset;
  if(physicalStart!==o10.boundedHeartCase.currentTerminatorPhysical-12)throw new Error('O12 target allocation identity drifted');
  const noEdit=bytes.slice();for(const r of serializeMK1BoundedAnimationIr(o8.baselineIr,o8.coordinateModel.staticDataBase))noEdit.set(r.encoded,r.physicalStart);
  const mismatchCount=diff(bytes,noEdit).length,rebuiltSha256=await sha256Bytes(noEdit);
  const checks=[
    {checkId:'CANONICAL_PROVENANCE',passed:hash===CANONICAL_SHA},
    {checkId:'O10_FULL_CAPACITY_SEMANTICS',passed:o10.boundedHeartCase.trailingZeroRequiredAtFullCapacity===false&&o10.boundedHeartCase.bytesOfGrowthRequired===0},
    {checkId:'O11_CONTROLLED_TOPOLOGY_WRITE',passed:o11.evidence.wholeExecutableDiffExactlyExpected&&o11.evidence.semanticReparseMatches&&o11.evidence.reverseRestoresOriginal},
    {checkId:'HEART2_BASELINE_ALLOCATION',passed:baseline.parts.length===3&&o10.boundedHeartCase.currentRecordByteLength===16},
    {checkId:'NINE_QUALIFIED_DESCRIPTORS',passed:available.length===9},
    {checkId:'NO_EDIT_ROUND_TRIP',passed:mismatchCount===0&&rebuiltSha256===CANONICAL_SHA},
    {checkId:'FIXED_CAPACITY_POLICY',passed:true},
    {checkId:'NO_RELOCATION_OR_OTHER_FRAME_WRITER',passed:true},
  ];
  const all=checks.every(c=>c.passed),timestamp=new Date().toISOString(),operationId=createOperationId('heart-rip-fixed-capacity-topology-editor');
  return{
    format:'mk1_heart_rip_fixed_capacity_topology_editor_model_v1',timestamp,operationId,provenance:{...o8.provenance,timestamp,operationId},fixture:o8.fixture,
    prerequisite:{o8:{pass:'1E.3O.8',operationId:o8.operationId,validationPassed:true},o10:{pass:'1E.3O.10',operationId:o10.operationId,verdict:'FULL_CAPACITY_CHAIN_EXHAUSTION_ESTABLISHED_FOURTH_PART_FITS_IN_PLACE',validationPassed:true},o11:{pass:'1E.3O.11',operationId:o11.operationId,verdict:'CONTROLLED_FOURTH_PART_IN_PLACE_TOPOLOGY_WRITE_ESTABLISHED',validationPassed:true}},
    target:{frameKey:'heart_2',recordWatcomOffset:baseline.recordOffset,recordWatcomOffsetHex:hx(baseline.recordOffset),physicalStart,physicalStartHex:hx(physicalStart),allocationByteLength:16,baselineParts:baseline.parts.map(p=>p.descriptorSymbol as HeartRipDescriptorSymbol),minParts:1,maxParts:4},
    availableDescriptors:available,
    encoding:{underCapacity:'POINTERS_THEN_ZERO_TERMINATOR',fullCapacity:'FOUR_POINTERS_CHAIN_EXHAUSTION',zeroFillAfterTerminator:true,relocationUsed:false,sequencePointerRewriteUsed:false},
    authoring:{add:true,remove:true,reorder:true,replace:true,duplicatesAllowed:false,otherFramesWritable:false,arbitraryPointersAllowed:false},
    noEditRoundTrip:{sourceSha256:hash,rebuiltSha256,mismatchCount,exact:mismatchCount===0&&rebuiltSha256===CANONICAL_SHA,semanticRegionCount:o8.noEditRoundTrip.semanticRegionCount},
    decision:{boundedOneToFourPartAuthoringEstablished:all,fixedCapacityOnly:true,genericTopologyEditingEstablished:false,relocationAllocationEstablished:false,verdict:all?'HEART2_FIXED_CAPACITY_1_TO_4_PART_TOPOLOGY_AUTHORING_ESTABLISHED':'HEART2_FIXED_CAPACITY_TOPOLOGY_AUTHORING_FAILED',narrative:all?'O12 promotes the O10/O11 bounded mechanism into authoring for heart_2 only. One through three unique qualified KHEART pointers use a zero terminator inside the existing 16-byte allocation; four pointers use linked-object chain exhaustion. Add, remove, replace and reorder operations are allowed only within this fixed allocation and only from the nine O8-qualified descriptors. Relocation, duplicate-pointer semantics, other frame records and arbitrary pointer input remain blocked.':'One or more O12 model checks failed; topology authoring remains disabled.'},
    status:all?'SUCCESS':'FAILED',validation:{allChecksPassed:all,checks},baselineIr:o8.baselineIr,
  };
}

function validateRequest(model:MK1HeartRipFixedCapacityTopologyEditorReport,request:MK1HeartRipFixedCapacityTopologyEditRequest){
  if(model.status!=='SUCCESS'||!model.validation.allChecksPassed||model.decision.verdict!=='HEART2_FIXED_CAPACITY_1_TO_4_PART_TOPOLOGY_AUTHORING_ESTABLISHED')throw new Error('O12 edit requires successful editor model');
  if(!Array.isArray(request.parts)||request.parts.length<1||request.parts.length>4)throw new Error('O12 topology must contain 1..4 parts');
  const allowed=new Set(model.availableDescriptors.map(d=>d.symbol));
  for(const symbol of request.parts)if(!allowed.has(symbol))throw new Error(`O12 unqualified descriptor symbol: ${String(symbol)}`);
  if(new Set(request.parts).size!==request.parts.length)throw new Error('O12 duplicate descriptor pointers are not qualified');
  if(request.parts.join('|')===model.target.baselineParts.join('|'))throw new Error('O12 edit request is a no-op');
}

export async function executeHeartRipFixedCapacityTopologyEdit(
  source:DirectorySource,
  model:MK1HeartRipFixedCapacityTopologyEditorReport,
  request:MK1HeartRipFixedCapacityTopologyEditRequest,
):Promise<MK1HeartRipFixedCapacityTopologyEditResult>{
  validateRequest(model,request);const {bytes:originalExe,hash:originalSha256}=await readCanonicalExe(source,model);
  const descriptorBySymbol=new Map(model.availableDescriptors.map(d=>[d.symbol,d] as const)),refToSymbol=new Map(model.availableDescriptors.map(d=>[d.descriptorRef,d.symbol] as const));
  const editedIr=cloneIr(model.baselineIr),target=editedIr.frames.find(f=>f.frameKey===TARGET_FRAME_KEY);if(!target)throw new Error('O12 edited IR missing heart_2');
  target.parts=request.parts.map((symbol,structuralIndex)=>{const d=descriptorBySymbol.get(symbol)!;return{descriptorRef:d.descriptorRef,descriptorSymbol:symbol,structuralIndex};});
  const regions=serializeMK1HeartRipFixedCapacityTopologyIr(model.baselineIr,editedIr,model.target.physicalStart-model.target.recordWatcomOffset);
  if(regions.length!==model.noEditRoundTrip.semanticRegionCount)throw new Error('O12 semantic region count changed');
  const editedExe=originalExe.slice();for(const r of regions)editedExe.set(r.encoded,r.physicalStart);
  const desired=encodeFixedCapacity(request.parts.map(s=>descriptorBySymbol.get(s)!.descriptorRef)),expectedChangedBytes:ReturnType<typeof diff>=[];
  for(let i=0;i<TARGET_RECORD_SIZE;i++)if(originalExe[model.target.physicalStart+i]!==desired[i])expectedChangedBytes.push({physicalOffset:model.target.physicalStart+i,physicalOffsetHex:hx(model.target.physicalStart+i),before:originalExe[model.target.physicalStart+i],after:desired[i]});
  const changedBytes=diff(originalExe,editedExe),wholeExecutableDiffExactlyExpected=sameDiff(changedBytes,expectedChangedBytes);if(!wholeExecutableDiffExactlyExpected)throw new Error('O12 whole-EXE diff escaped fixed heart_2 allocation');
  const reparsedParts=parseFixedCapacity(editedExe,model.target.physicalStart,refToSymbol),semanticReparseMatches=reparsedParts.join('|')===request.parts.join('|');if(!semanticReparseMatches)throw new Error('O12 semantic reparse did not match requested topology');
  let followingRecordPreserved=true;for(let i=0;i<8;i++)if(editedExe[model.target.physicalStart+16+i]!==originalExe[model.target.physicalStart+16+i])followingRecordPreserved=false;if(!followingRecordPreserved)throw new Error('O12 modified following heart_3 record');
  const editedSha256=await sha256Bytes(editedExe),reversed=editedExe.slice();for(const d of changedBytes)reversed[d.physicalOffset]=d.before;const reversedSha256=await sha256Bytes(reversed),reverseRestoresOriginal=reversedSha256===CANONICAL_SHA&&diff(originalExe,reversed).length===0;if(!reverseRestoresOriginal)throw new Error('O12 reversal failed');
  const timestamp=new Date().toISOString(),operationId=createOperationId('heart-rip-fixed-capacity-topology-edit');
  const report:MK1HeartRipFixedCapacityTopologyEditReport={
    format:'mk1_heart_rip_fixed_capacity_topology_edit_v1',timestamp,operationId,provenance:{...model.provenance,timestamp,operationId},fixture:model.fixture,prerequisite:{pass:'1E.3O.12',operationId:model.operationId,verdict:'HEART2_FIXED_CAPACITY_1_TO_4_PART_TOPOLOGY_AUTHORING_ESTABLISHED',validationPassed:true},request:{parts:[...request.parts],note:request.note},topology:{before:[...model.target.baselineParts],after:[...request.parts],beforePartCount:model.target.baselineParts.length,afterPartCount:request.parts.length,terminationAfter:request.parts.length===4?'LINKED_OBJECT_CHAIN_EXHAUSTION':'ZERO_DWORD',allocationByteLength:16},editedIr,
    evidence:{originalSha256,editedSha256,reversedSha256,changedByteCount:changedBytes.length,expectedChangedByteCount:expectedChangedBytes.length,changedBytes,expectedChangedBytes,unexpectedByteChanges:0,wholeExecutableDiffExactlyExpected,reparsedParts,semanticReparseMatches,followingRecordPreserved,reverseRestoresOriginal},
    constraints:{targetFrameOnly:true,frameAllocationUnchanged:true,setupObjectCountUnchanged:true,sequencePointersUntouched:true,otherFrameRecordsUntouched:true,descriptorBytesUntouched:true,graPixelsUntouched:true,paletteUntouched:true,relocationUnused:true,collisionAndGameplayUntouched:true,duplicateDescriptorUseBlocked:true,genericOtherFrameTopologyStillBlocked:true},status:'STATIC_VALIDATION_PASSED',
  };
  return{report,originalExe,editedExe};
}

export function createMK1HeartRipFixedCapacityTopologyEditorExport(model:MK1HeartRipFixedCapacityTopologyEditorReport):MK1HeartRipFixedCapacityTopologyEditorReport{
  if(model.status!=='SUCCESS'||!model.validation.allChecksPassed)throw new Error('Cannot export failed O12 model');
  const {baselineIr,...exportable}=model;return{...exportable,baselineIr} as MK1HeartRipFixedCapacityTopologyEditorReport;
}
export function createMK1HeartRipFixedCapacityTopologyEditExport(result:MK1HeartRipFixedCapacityTopologyEditResult):MK1HeartRipFixedCapacityTopologyEditReport{return result.report;}

export function buildHeartRipFixedCapacityTopologyBundle(result:MK1HeartRipFixedCapacityTopologyEditResult):Uint8Array{
  const reportBytes=new TextEncoder().encode(JSON.stringify(result.report,null,2));
  const readme=new TextEncoder().encode([
    'MK1 Pass 1E.3O.12 — fixed-capacity heart_2 topology authoring test','',
    `Original SHA-256: ${result.report.evidence.originalSha256}`,
    `Edited SHA-256:   ${result.report.evidence.editedSha256}`,
    `Topology: [${result.report.topology.before.join(', ')}] -> [${result.report.topology.after.join(', ')}]`,
    `Changed bytes: ${result.report.evidence.changedByteCount}; unexpected: ${result.report.evidence.unexpectedByteChanges}`,'',
    'Only the existing 16-byte heart_2 frame allocation is authored. No relocation, descriptor, palette, GRA pixel, collision or gameplay data is changed.',
    'Use only in a separate copy of the complete MK1 installation. Do not overwrite the canonical source installation.',
  ].join('\r\n'));
  return buildStoredZip([{name:'MK1.EXE',bytes:result.editedExe},{name:'mk1_heart_rip_fixed_capacity_topology_edit.json',bytes:reportBytes},{name:'READ_ME_FIRST.txt',bytes:readme}]);
}
