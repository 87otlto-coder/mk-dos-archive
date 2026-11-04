/**
 * MK1 bounded heart-rip atomic topology + placement authoring — Pass 1E.3O.13.
 *
 * Purpose:
 *  - compose the verified O8 descriptor-local X/Y writer with the verified O12 fixed-capacity
 *    heart_2 topology writer in ONE semantic transaction against canonical MK1.EXE;
 *  - keep the topology allocation fixed at 16 bytes;
 *  - allow 1..4 unique qualified KHEART descriptors;
 *  - allow signed-int16 X/Y edits only for descriptors present in the requested heart_2 topology;
 *  - expose every existing animation occurrence affected by shared descriptor storage;
 *  - independently derive the complete expected whole-EXE diff and require exact reversal.
 *
 * Still blocked: duplicate descriptor pointers, arbitrary pointers, topology edits outside heart_2,
 * relocation/allocation, descriptor dimensions/packed refs, GRA pixels, palette, gameplay/collision.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { sha256Bytes } from './paletteRoundTripCodec';
import {
  HeartRipDescriptorSymbol,
  MK1HeartRipAnimationCanvasEditorReport,
} from './heartRipAnimationCanvasEditor';
import {
  MK1HeartRipFixedCapacityTopologyEditorReport,
} from './heartRipFixedCapacityTopologyEditor';
import {
  MK1BoundedAnimationIrRegion,
  MK1MultiPartFrameLosslessIrReport,
  serializeMK1BoundedAnimationIr,
} from './multiPartFrameLosslessIr';

const CANONICAL_SHA = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const TARGET_FRAME_KEY = 'heart_2';
const TARGET_RECORD_SIZE = 16;
const HEART2_PREVIEW_KEY = 'PRIMARY:2';

type ByteDiff = { physicalOffset:number; physicalOffsetHex:string; before:number; after:number };
type PlacementRequest = { symbol:HeartRipDescriptorSymbol; x:number; y:number };

function hx(v:number):string{return `0x${(v>>>0).toString(16).padStart(8,'0').toUpperCase()}`;}
function readU32(b:Uint8Array,o:number){if(o<0||o+4>b.length)throw new Error(`u32 OOB ${hx(o)}`);return (b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0;}
function readI16(b:Uint8Array,o:number){const v=b[o]|(b[o+1]<<8);return (v&0x8000)?v-0x10000:v;}
function u32Bytes(v:number):Uint8Array{return new Uint8Array([v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]);}
function i16Bytes(v:number):[number,number]{const n=v&0xffff;return[n&255,(n>>>8)&255];}
function ensureI16(v:number,label:string){if(!Number.isInteger(v)||v<-32768||v>32767)throw new Error(`${label} must be a signed int16 integer`);}
function cloneIr(ir:MK1MultiPartFrameLosslessIrReport['ir']):MK1MultiPartFrameLosslessIrReport['ir']{return JSON.parse(JSON.stringify(ir)) as MK1MultiPartFrameLosslessIrReport['ir'];}
function diff(a:Uint8Array,b:Uint8Array):ByteDiff[]{if(a.length!==b.length)throw new Error('Executable lengths differ');const out:ByteDiff[]=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])out.push({physicalOffset:i,physicalOffsetHex:hx(i),before:a[i],after:b[i]});return out;}
function sameDiff(a:ByteDiff[],b:ByteDiff[]):boolean{if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i].physicalOffset!==b[i].physicalOffset||a[i].before!==b[i].before||a[i].after!==b[i].after)return false;return true;}
function encodeFixedCapacity(refs:readonly number[]):Uint8Array{if(refs.length<1||refs.length>4)throw new Error('O13 topology must contain 1..4 descriptor pointers');const out=new Uint8Array(TARGET_RECORD_SIZE);refs.forEach((ref,i)=>out.set(u32Bytes(ref),i*4));return out;}
function parseFixedCapacity(bytes:Uint8Array,start:number,refToSymbol:Map<number,HeartRipDescriptorSymbol>):HeartRipDescriptorSymbol[]{const out:HeartRipDescriptorSymbol[]=[];for(let i=0;i<4;i++){const ref=readU32(bytes,start+i*4);if(ref===0){for(let j=i+1;j<4;j++)if(readU32(bytes,start+j*4)!==0)throw new Error('Non-zero dword after topology terminator');break;}const s=refToSymbol.get(ref);if(!s)throw new Error(`Unqualified descriptor ref ${hx(ref)}`);out.push(s);}if(out.length<1||out.length>4)throw new Error('Reparsed topology has invalid part count');return out;}
function sortedUniqueDiff(items:ByteDiff[]):ByteDiff[]{const byOffset=new Map<number,ByteDiff>();for(const d of items){const existing=byOffset.get(d.physicalOffset);if(existing&&(existing.before!==d.before||existing.after!==d.after))throw new Error(`Conflicting expected diff at ${d.physicalOffsetHex}`);byOffset.set(d.physicalOffset,d);}return [...byOffset.values()].sort((a,b)=>a.physicalOffset-b.physicalOffset);}

export interface MK1HeartRipAtomicCompositionEditorReport{
  format:'mk1_heart_rip_atomic_composition_editor_model_v1';timestamp:string;operationId:string;
  provenance:MK1HeartRipAnimationCanvasEditorReport['provenance'];fixture:MK1HeartRipAnimationCanvasEditorReport['fixture'];
  prerequisite:{
    o8:{pass:'1E.3O.8';operationId:string;verdict:'KANO_HEART_FULL_FIXED_LAYOUT_CANVAS_EDITOR_ESTABLISHED';validationPassed:true};
    o12:{pass:'1E.3O.12';operationId:string;verdict:'HEART2_FIXED_CAPACITY_1_TO_4_PART_TOPOLOGY_AUTHORING_ESTABLISHED';validationPassed:true};
  };
  target:{frameKey:'heart_2';previewKey:'PRIMARY:2';recordWatcomOffset:number;recordWatcomOffsetHex:string;physicalStart:number;physicalStartHex:string;allocationByteLength:16;baselineParts:HeartRipDescriptorSymbol[];minParts:1;maxParts:4};
  descriptors:Array<{
    symbol:HeartRipDescriptorSymbol;descriptorRef:number;descriptorRefHex:string;physicalStart:number;physicalStartHex:string;width:number;height:number;x:number;y:number;
    existingPreviewKeys:string[];aliasedAcrossExistingOccurrences:boolean;writableFields:['x','y'];
  }>;
  transaction:{topologyAndPlacementAtomic:true;topologyFixedCapacityOnly:true;placementOnlyForSelectedParts:true;aliasEffectsExplicit:true;duplicatesAllowed:false;relocationSupported:false;otherFramesTopologyWritable:false};
  noEditRoundTrip:{sourceSha256:string;rebuiltSha256:string;mismatchCount:number;exact:boolean;semanticRegionCount:number};
  decision:{atomicCompositionAuthoringEstablished:boolean;genericCompositionCompilerEstablished:false;verdict:'HEART2_ATOMIC_TOPOLOGY_AND_PLACEMENT_AUTHORING_ESTABLISHED'|'HEART2_ATOMIC_COMPOSITION_AUTHORING_FAILED';narrative:string};
  status:'SUCCESS'|'FAILED';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean}>};
  baselineIr:MK1MultiPartFrameLosslessIrReport['ir'];
}

export interface MK1HeartRipAtomicCompositionEditRequest{
  parts:HeartRipDescriptorSymbol[];
  placements:PlacementRequest[];
  note?:string;
}

export interface MK1HeartRipAtomicCompositionEditReport{
  format:'mk1_heart_rip_atomic_composition_edit_v1';timestamp:string;operationId:string;
  provenance:MK1HeartRipAtomicCompositionEditorReport['provenance'];fixture:MK1HeartRipAtomicCompositionEditorReport['fixture'];
  prerequisite:{pass:'1E.3O.13';operationId:string;verdict:'HEART2_ATOMIC_TOPOLOGY_AND_PLACEMENT_AUTHORING_ESTABLISHED';validationPassed:true};
  request:MK1HeartRipAtomicCompositionEditRequest;
  topology:{before:HeartRipDescriptorSymbol[];after:HeartRipDescriptorSymbol[];beforePartCount:number;afterPartCount:number;terminationAfter:'ZERO_DWORD'|'LINKED_OBJECT_CHAIN_EXHAUSTION';allocationByteLength:16};
  placements:Array<{symbol:HeartRipDescriptorSymbol;before:{x:number;y:number};after:{x:number;y:number};delta:{x:number;y:number};editedFields:Array<'x'|'y'>;affectedPreviewKeys:string[];aliasSideEffectOutsideHeart2:boolean}>;
  editedIr:MK1MultiPartFrameLosslessIrReport['ir'];
  evidence:{originalSha256:string;editedSha256:string;reversedSha256:string;changedByteCount:number;expectedChangedByteCount:number;changedBytes:ByteDiff[];expectedChangedBytes:ByteDiff[];unexpectedByteChanges:number;wholeExecutableDiffExactlyExpected:boolean;reparsedParts:HeartRipDescriptorSymbol[];topologyReparseMatches:boolean;placementReparseMatches:boolean;followingRecordPreserved:boolean;reverseRestoresOriginal:boolean};
  constraints:{targetTopologyFrameOnly:true;frameAllocationUnchanged:true;placementLimitedToSelectedParts:true;setupObjectCountUnchanged:true;sequencePointersUntouched:true;otherFrameTopologyUntouched:true;descriptorDimensionsUntouched:true;packedReferencesUntouched:true;graPixelsUntouched:true;paletteUntouched:true;relocationUnused:true;collisionAndGameplayUntouched:true;duplicatesBlocked:true};
  status:'STATIC_VALIDATION_PASSED';
}
export interface MK1HeartRipAtomicCompositionEditResult{report:MK1HeartRipAtomicCompositionEditReport;originalExe:Uint8Array;editedExe:Uint8Array;}

async function readCanonicalExe(source:DirectorySource,fixture:MK1HeartRipAtomicCompositionEditorReport['fixture']){
  if(source.isSynthetic!==false)throw new Error('1E.3O.13 requires authentic user-loaded source');
  const entries=await source.listRecursive(),entry=entries.find(e=>e.path===fixture.exePath);if(!entry||entry.size!==fixture.exeSize)throw new Error('MK1.EXE missing or size changed before O13 authoring');
  const bytes=await source.readSlice(entry.path,0,entry.size),hash=await sha256Bytes(bytes);if(hash!==CANONICAL_SHA)throw new Error(`1E.3O.13 requires canonical MK1.EXE; got ${hash}`);return{bytes,hash};
}

export async function executeHeartRipAtomicCompositionEditorModel(
  source:DirectorySource,
  o8:MK1HeartRipAnimationCanvasEditorReport,
  o12:MK1HeartRipFixedCapacityTopologyEditorReport,
):Promise<MK1HeartRipAtomicCompositionEditorReport>{
  if(o8.status!=='SUCCESS'||!o8.validation.allChecksPassed||o8.decision.verdict!=='KANO_HEART_FULL_FIXED_LAYOUT_CANVAS_EDITOR_ESTABLISHED'||o8.provenance.sha256!==CANONICAL_SHA)throw new Error('O13 requires successful canonical O8');
  if(o12.status!=='SUCCESS'||!o12.validation.allChecksPassed||o12.decision.verdict!=='HEART2_FIXED_CAPACITY_1_TO_4_PART_TOPOLOGY_AUTHORING_ESTABLISHED'||o12.provenance.sha256!==CANONICAL_SHA)throw new Error('O13 requires successful canonical O12');
  const {bytes,hash}=await readCanonicalExe(source,o12.fixture);
  const baseline=o8.baselineIr.frames.find(f=>f.frameKey===TARGET_FRAME_KEY);if(!baseline||baseline.parts.length!==3)throw new Error('O13 baseline heart_2 drifted');
  if(o12.target.physicalStart!==o8.coordinateModel.staticDataBase+baseline.recordOffset||o12.target.allocationByteLength!==16)throw new Error('O13 O8/O12 target identity mismatch');
  const descriptors=o8.descriptors.map(d=>({symbol:d.symbol,descriptorRef:d.watcomOffset,descriptorRefHex:d.watcomOffsetHex,physicalStart:d.physicalStart,physicalStartHex:d.physicalStartHex,width:d.width,height:d.height,x:d.x,y:d.y,existingPreviewKeys:d.usage.map(u=>u.previewKey),aliasedAcrossExistingOccurrences:d.usageCount>1,writableFields:['x','y'] as ['x','y']}));
  if(descriptors.length!==9)throw new Error('O13 expected nine qualified KHEART descriptors');
  const noEdit=bytes.slice();for(const r of serializeMK1BoundedAnimationIr(o8.baselineIr,o8.coordinateModel.staticDataBase))noEdit.set(r.encoded,r.physicalStart);
  const mismatchCount=diff(bytes,noEdit).length,rebuiltSha256=await sha256Bytes(noEdit);
  const checks=[
    {checkId:'CANONICAL_PROVENANCE',passed:hash===CANONICAL_SHA},
    {checkId:'O8_PLACEMENT_PREREQUISITE',passed:o8.serializer.signedInt16XY&&o8.serializer.aliasEffectsExplicit},
    {checkId:'O12_TOPOLOGY_PREREQUISITE',passed:o12.target.allocationByteLength===16&&o12.authoring.add&&o12.authoring.remove&&o12.authoring.reorder&&o12.authoring.replace},
    {checkId:'COMMON_HEART2_IDENTITY',passed:o12.target.recordWatcomOffset===baseline.recordOffset&&o12.target.baselineParts.join('|')===baseline.parts.map(p=>p.descriptorSymbol).join('|')},
    {checkId:'NINE_QUALIFIED_DESCRIPTORS',passed:descriptors.length===9},
    {checkId:'NO_EDIT_ROUND_TRIP',passed:mismatchCount===0&&rebuiltSha256===CANONICAL_SHA},
    {checkId:'FIXED_CAPACITY_AND_NO_RELOCATION',passed:o12.encoding.relocationUsed===false&&o12.encoding.sequencePointerRewriteUsed===false},
    {checkId:'ALIAS_METADATA_AVAILABLE',passed:descriptors.every(d=>d.existingPreviewKeys.length>0)},
  ];
  const all=checks.every(c=>c.passed),timestamp=new Date().toISOString(),operationId=createOperationId('heart-rip-atomic-composition-editor');
  return{
    format:'mk1_heart_rip_atomic_composition_editor_model_v1',timestamp,operationId,provenance:{...o8.provenance,timestamp,operationId},fixture:o8.fixture,
    prerequisite:{o8:{pass:'1E.3O.8',operationId:o8.operationId,verdict:'KANO_HEART_FULL_FIXED_LAYOUT_CANVAS_EDITOR_ESTABLISHED',validationPassed:true},o12:{pass:'1E.3O.12',operationId:o12.operationId,verdict:'HEART2_FIXED_CAPACITY_1_TO_4_PART_TOPOLOGY_AUTHORING_ESTABLISHED',validationPassed:true}},
    target:{frameKey:'heart_2',previewKey:HEART2_PREVIEW_KEY,recordWatcomOffset:baseline.recordOffset,recordWatcomOffsetHex:hx(baseline.recordOffset),physicalStart:o12.target.physicalStart,physicalStartHex:o12.target.physicalStartHex,allocationByteLength:16,baselineParts:baseline.parts.map(p=>p.descriptorSymbol as HeartRipDescriptorSymbol),minParts:1,maxParts:4},
    descriptors,transaction:{topologyAndPlacementAtomic:true,topologyFixedCapacityOnly:true,placementOnlyForSelectedParts:true,aliasEffectsExplicit:true,duplicatesAllowed:false,relocationSupported:false,otherFramesTopologyWritable:false},
    noEditRoundTrip:{sourceSha256:hash,rebuiltSha256,mismatchCount,exact:mismatchCount===0&&rebuiltSha256===CANONICAL_SHA,semanticRegionCount:o8.noEditRoundTrip.semanticRegionCount},
    decision:{atomicCompositionAuthoringEstablished:all,genericCompositionCompilerEstablished:false,verdict:all?'HEART2_ATOMIC_TOPOLOGY_AND_PLACEMENT_AUTHORING_ESTABLISHED':'HEART2_ATOMIC_COMPOSITION_AUTHORING_FAILED',narrative:all?'O13 composes the verified O8 descriptor-local placement writer and O12 fixed-capacity heart_2 topology writer into one fail-closed canonical transaction. Topology remains inside the existing 16-byte heart_2 allocation; X/Y edits are signed-int16 and allowed only for descriptors selected into the authored topology. Shared descriptor storage is reported explicitly because placement edits can affect existing occurrences elsewhere in the heart-rip animation.':'One or more O13 prerequisite/model checks failed; atomic composition authoring remains disabled.'},
    status:all?'SUCCESS':'FAILED',validation:{allChecksPassed:all,checks},baselineIr:o8.baselineIr,
  };
}

function validateRequest(model:MK1HeartRipAtomicCompositionEditorReport,request:MK1HeartRipAtomicCompositionEditRequest){
  if(model.status!=='SUCCESS'||!model.validation.allChecksPassed||model.decision.verdict!=='HEART2_ATOMIC_TOPOLOGY_AND_PLACEMENT_AUTHORING_ESTABLISHED')throw new Error('O13 edit requires successful model');
  if(!Array.isArray(request.parts)||request.parts.length<1||request.parts.length>4)throw new Error('O13 topology must contain 1..4 parts');
  const allowed=new Set(model.descriptors.map(d=>d.symbol));for(const s of request.parts)if(!allowed.has(s))throw new Error(`O13 unqualified topology descriptor: ${String(s)}`);
  if(new Set(request.parts).size!==request.parts.length)throw new Error('O13 duplicate descriptor pointers are not qualified');
  if(!Array.isArray(request.placements))throw new Error('O13 placements must be an array');
  const selected=new Set(request.parts),seen=new Set<string>();
  for(const p of request.placements){if(!allowed.has(p.symbol))throw new Error(`O13 unqualified placement descriptor: ${String(p.symbol)}`);if(!selected.has(p.symbol))throw new Error(`O13 placement ${p.symbol} is not selected into heart_2 topology`);if(seen.has(p.symbol))throw new Error(`O13 duplicate placement request for ${p.symbol}`);seen.add(p.symbol);ensureI16(p.x,`${p.symbol}.x`);ensureI16(p.y,`${p.symbol}.y`);}
  const topologyChanged=request.parts.join('|')!==model.target.baselineParts.join('|');
  const descriptorBySymbol=new Map(model.descriptors.map(d=>[d.symbol,d] as const));
  const placementChanged=request.placements.some(p=>{const d=descriptorBySymbol.get(p.symbol)!;return p.x!==d.x||p.y!==d.y;});
  if(!topologyChanged&&!placementChanged)throw new Error('O13 edit request is a semantic no-op');
}

export async function executeHeartRipAtomicCompositionEdit(
  source:DirectorySource,
  model:MK1HeartRipAtomicCompositionEditorReport,
  request:MK1HeartRipAtomicCompositionEditRequest,
):Promise<MK1HeartRipAtomicCompositionEditResult>{
  validateRequest(model,request);const {bytes:originalExe,hash:originalSha256}=await readCanonicalExe(source,model.fixture);
  const descriptorBySymbol=new Map(model.descriptors.map(d=>[d.symbol,d] as const)),refToSymbol=new Map(model.descriptors.map(d=>[d.descriptorRef,d.symbol] as const));
  const editedIr=cloneIr(model.baselineIr),frame=editedIr.frames.find(f=>f.frameKey===TARGET_FRAME_KEY);if(!frame)throw new Error('O13 edited IR missing heart_2');
  frame.parts=request.parts.map((symbol,structuralIndex)=>{const d=descriptorBySymbol.get(symbol)!;return{descriptorRef:d.descriptorRef,descriptorSymbol:symbol,structuralIndex};});
  const placementReports:MK1HeartRipAtomicCompositionEditReport['placements']=[];
  for(const p of request.placements){const d=descriptorBySymbol.get(p.symbol)!;const ir=editedIr.descriptors.find(x=>x.symbol===p.symbol);if(!ir)throw new Error(`O13 IR descriptor missing ${p.symbol}`);const editedFields:Array<'x'|'y'>=[];if(p.x!==d.x)editedFields.push('x');if(p.y!==d.y)editedFields.push('y');ir.x=p.x;ir.y=p.y;const affected=new Set(d.existingPreviewKeys);affected.add(HEART2_PREVIEW_KEY);placementReports.push({symbol:p.symbol,before:{x:d.x,y:d.y},after:{x:p.x,y:p.y},delta:{x:p.x-d.x,y:p.y-d.y},editedFields,affectedPreviewKeys:[...affected],aliasSideEffectOutsideHeart2:[...affected].some(k=>k!==HEART2_PREVIEW_KEY)});}

  // O2 remains authoritative for every semantic region other than heart_2's bounded topology encoding.
  const regions:MK1BoundedAnimationIrRegion[]=serializeMK1BoundedAnimationIr(editedIr,model.target.physicalStart-model.target.recordWatcomOffset).map(r=>({name:r.name,physicalStart:r.physicalStart,encoded:r.encoded.slice()}));
  if(regions.length!==model.noEditRoundTrip.semanticRegionCount)throw new Error('O13 semantic region count changed');
  const targetRegion=regions.find(r=>r.name===`FRAME_${hx(model.target.recordWatcomOffset)}`);if(!targetRegion)throw new Error('O13 target frame region missing');
  targetRegion.encoded=encodeFixedCapacity(request.parts.map(s=>descriptorBySymbol.get(s)!.descriptorRef));
  const editedExe=originalExe.slice();for(const r of regions)editedExe.set(r.encoded,r.physicalStart);

  // Independently derive expected topology bytes and descriptor X/Y byte changes from the semantic request.
  const expected:ByteDiff[]=[];const topoBytes=encodeFixedCapacity(request.parts.map(s=>descriptorBySymbol.get(s)!.descriptorRef));
  for(let i=0;i<TARGET_RECORD_SIZE;i++){const off=model.target.physicalStart+i;if(originalExe[off]!==topoBytes[i])expected.push({physicalOffset:off,physicalOffsetHex:hx(off),before:originalExe[off],after:topoBytes[i]});}
  for(const p of request.placements){const d=descriptorBySymbol.get(p.symbol)!;const fields:[number,number][]=[[d.physicalStart+4,p.x],[d.physicalStart+6,p.y]];for(const [off,value] of fields){const bytes=i16Bytes(value);for(let i=0;i<2;i++)if(originalExe[off+i]!==bytes[i])expected.push({physicalOffset:off+i,physicalOffsetHex:hx(off+i),before:originalExe[off+i],after:bytes[i]});}}
  const expectedChangedBytes=sortedUniqueDiff(expected),changedBytes=diff(originalExe,editedExe),wholeExecutableDiffExactlyExpected=sameDiff(changedBytes,expectedChangedBytes);if(!wholeExecutableDiffExactlyExpected)throw new Error('O13 whole-EXE diff escaped independently expected topology/placement bytes');

  const reparsedParts=parseFixedCapacity(editedExe,model.target.physicalStart,refToSymbol),topologyReparseMatches=reparsedParts.join('|')===request.parts.join('|');if(!topologyReparseMatches)throw new Error('O13 topology reparse mismatch');
  const placementReparseMatches=request.placements.every(p=>{const d=descriptorBySymbol.get(p.symbol)!;return readI16(editedExe,d.physicalStart+4)===p.x&&readI16(editedExe,d.physicalStart+6)===p.y;});if(!placementReparseMatches)throw new Error('O13 placement reparse mismatch');
  let followingRecordPreserved=true;for(let i=0;i<8;i++)if(editedExe[model.target.physicalStart+16+i]!==originalExe[model.target.physicalStart+16+i])followingRecordPreserved=false;if(!followingRecordPreserved)throw new Error('O13 modified following heart_3 record');
  const editedSha256=await sha256Bytes(editedExe),reversed=editedExe.slice();for(const d of changedBytes)reversed[d.physicalOffset]=d.before;const reversedSha256=await sha256Bytes(reversed),reverseRestoresOriginal=reversedSha256===CANONICAL_SHA&&diff(originalExe,reversed).length===0;if(!reverseRestoresOriginal)throw new Error('O13 reversal failed');
  const timestamp=new Date().toISOString(),operationId=createOperationId('heart-rip-atomic-composition-edit');
  const report:MK1HeartRipAtomicCompositionEditReport={
    format:'mk1_heart_rip_atomic_composition_edit_v1',timestamp,operationId,provenance:{...model.provenance,timestamp,operationId},fixture:model.fixture,prerequisite:{pass:'1E.3O.13',operationId:model.operationId,verdict:'HEART2_ATOMIC_TOPOLOGY_AND_PLACEMENT_AUTHORING_ESTABLISHED',validationPassed:true},request:{parts:[...request.parts],placements:request.placements.map(p=>({...p})),note:request.note},topology:{before:[...model.target.baselineParts],after:[...request.parts],beforePartCount:model.target.baselineParts.length,afterPartCount:request.parts.length,terminationAfter:request.parts.length===4?'LINKED_OBJECT_CHAIN_EXHAUSTION':'ZERO_DWORD',allocationByteLength:16},placements:placementReports,editedIr,
    evidence:{originalSha256,editedSha256,reversedSha256,changedByteCount:changedBytes.length,expectedChangedByteCount:expectedChangedBytes.length,changedBytes,expectedChangedBytes,unexpectedByteChanges:0,wholeExecutableDiffExactlyExpected,reparsedParts,topologyReparseMatches,placementReparseMatches,followingRecordPreserved,reverseRestoresOriginal},
    constraints:{targetTopologyFrameOnly:true,frameAllocationUnchanged:true,placementLimitedToSelectedParts:true,setupObjectCountUnchanged:true,sequencePointersUntouched:true,otherFrameTopologyUntouched:true,descriptorDimensionsUntouched:true,packedReferencesUntouched:true,graPixelsUntouched:true,paletteUntouched:true,relocationUnused:true,collisionAndGameplayUntouched:true,duplicatesBlocked:true},status:'STATIC_VALIDATION_PASSED',
  };
  return{report,originalExe,editedExe};
}

export function createMK1HeartRipAtomicCompositionEditorExport(model:MK1HeartRipAtomicCompositionEditorReport):MK1HeartRipAtomicCompositionEditorReport{if(model.status!=='SUCCESS'||!model.validation.allChecksPassed)throw new Error('Cannot export failed O13 model');return model;}
export function createMK1HeartRipAtomicCompositionEditExport(result:MK1HeartRipAtomicCompositionEditResult):MK1HeartRipAtomicCompositionEditReport{return result.report;}
export function buildHeartRipAtomicCompositionBundle(result:MK1HeartRipAtomicCompositionEditResult):Uint8Array{
  const reportBytes=new TextEncoder().encode(JSON.stringify(result.report,null,2));
  const readme=new TextEncoder().encode([
    'MK1 Pass 1E.3O.13 — atomic heart_2 topology + placement authoring test','',
    `Original SHA-256: ${result.report.evidence.originalSha256}`,
    `Edited SHA-256:   ${result.report.evidence.editedSha256}`,
    `Topology: [${result.report.topology.before.join(', ')}] -> [${result.report.topology.after.join(', ')}]`,
    `Placement edits: ${result.report.placements.length}`,
    `Changed bytes: ${result.report.evidence.changedByteCount}; unexpected: ${result.report.evidence.unexpectedByteChanges}`,'',
    'This bundle combines only the verified fixed-capacity heart_2 topology and signed-int16 KHEART X/Y placement mechanisms.',
    'Shared descriptor placement edits may also affect existing heart-rip occurrences listed in the JSON report.',
    'No relocation, arbitrary pointers, descriptor dimensions, GRA pixels, palette, collision or gameplay data are changed.',
    'Use only in a separate copy of the complete MK1 installation. Do not overwrite the canonical source installation.',
  ].join('\r\n'));
  return buildStoredZip([{name:'MK1.EXE',bytes:result.editedExe},{name:'mk1_heart_rip_atomic_composition_edit.json',bytes:reportBytes},{name:'READ_ME_FIRST.txt',bytes:readme}]);
}
