/**
 * MK1 full heart-rip fixed-layout composition authoring — Pass 1E.3O.14.
 *
 * Extends the verified O13 atomic topology+placement transaction across all seven unique
 * Kano heart-rip frame records while preserving every existing record allocation.
 *
 * Writable topology:
 *  - heart_2: 1..4 unique qualified KHEART descriptor pointers inside its existing 16 bytes;
 *  - heart_0, heart_1, heart_3, heart_4, heart_5, heart_6: exactly one qualified KHEART
 *    descriptor pointer inside each existing 8-byte pointer+zero allocation.
 *
 * Writable placement:
 *  - signed-int16 X/Y for any qualified descriptor used by the authored animation;
 *  - descriptor storage remains shared, so all authored preview-key aliases are reported.
 *
 * Still blocked: record growth/relocation, sequence rewrites, setup-count changes, arbitrary
 * pointers, duplicate pointers within heart_2, descriptor dimensions/packed refs, pixels,
 * palette, collision/gameplay and any animation outside the qualified Kano heart-rip set.
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
import { MK1HeartRipAtomicCompositionEditorReport } from './heartRipAtomicCompositionEditor';
import {
  MK1BoundedAnimationIrRegion,
  MK1MultiPartFrameLosslessIrReport,
  serializeMK1BoundedAnimationIr,
} from './multiPartFrameLosslessIr';

const CANONICAL_SHA = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
export const HEART_RIP_FRAME_KEYS = ['heart_0','heart_1','heart_2','heart_3','heart_4','heart_5','heart_6'] as const;
export type HeartRipFrameKey = typeof HEART_RIP_FRAME_KEYS[number];
const VARIABLE_FRAME: HeartRipFrameKey = 'heart_2';

type ByteDiff = { physicalOffset:number; physicalOffsetHex:string; before:number; after:number };
type PlacementRequest = { symbol:HeartRipDescriptorSymbol; x:number; y:number };
export type HeartRipFullFrameRequest = { frameKey:HeartRipFrameKey; parts:HeartRipDescriptorSymbol[] };

function hx(v:number):string{return `0x${(v>>>0).toString(16).padStart(8,'0').toUpperCase()}`;}
function readU32(b:Uint8Array,o:number){if(o<0||o+4>b.length)throw new Error(`u32 OOB ${hx(o)}`);return (b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0;}
function readI16(b:Uint8Array,o:number){const v=b[o]|(b[o+1]<<8);return (v&0x8000)?v-0x10000:v;}
function u32Bytes(v:number):Uint8Array{return new Uint8Array([v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]);}
function i16Bytes(v:number):[number,number]{const n=v&0xffff;return[n&255,(n>>>8)&255];}
function ensureI16(v:number,label:string){if(!Number.isInteger(v)||v<-32768||v>32767)throw new Error(`${label} must be a signed int16 integer`);}
function cloneIr(ir:MK1MultiPartFrameLosslessIrReport['ir']):MK1MultiPartFrameLosslessIrReport['ir']{return JSON.parse(JSON.stringify(ir)) as MK1MultiPartFrameLosslessIrReport['ir'];}
function diff(a:Uint8Array,b:Uint8Array):ByteDiff[]{if(a.length!==b.length)throw new Error('Executable lengths differ');const out:ByteDiff[]=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])out.push({physicalOffset:i,physicalOffsetHex:hx(i),before:a[i],after:b[i]});return out;}
function sameDiff(a:ByteDiff[],b:ByteDiff[]):boolean{if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i].physicalOffset!==b[i].physicalOffset||a[i].before!==b[i].before||a[i].after!==b[i].after)return false;return true;}
function sortedUniqueDiff(items:ByteDiff[]):ByteDiff[]{const byOffset=new Map<number,ByteDiff>();for(const d of items){const old=byOffset.get(d.physicalOffset);if(old&&(old.before!==d.before||old.after!==d.after))throw new Error(`Conflicting expected diff at ${d.physicalOffsetHex}`);byOffset.set(d.physicalOffset,d);}return [...byOffset.values()].sort((a,b)=>a.physicalOffset-b.physicalOffset);}
function frameSize(k:HeartRipFrameKey){return k===VARIABLE_FRAME?16:8;}
function encodeFrame(k:HeartRipFrameKey,refs:readonly number[]):Uint8Array{
  const size=frameSize(k),out=new Uint8Array(size);
  if(k===VARIABLE_FRAME){if(refs.length<1||refs.length>4)throw new Error('heart_2 must contain 1..4 descriptor pointers');}
  else if(refs.length!==1)throw new Error(`${k} must remain exactly one part inside its 8-byte allocation`);
  refs.forEach((r,i)=>out.set(u32Bytes(r),i*4));
  return out;
}
function parseFrame(k:HeartRipFrameKey,bytes:Uint8Array,start:number,refToSymbol:Map<number,HeartRipDescriptorSymbol>):HeartRipDescriptorSymbol[]{
  if(k!==VARIABLE_FRAME){const ref=readU32(bytes,start),term=readU32(bytes,start+4);const s=refToSymbol.get(ref);if(!s)throw new Error(`${k} reparsed unqualified descriptor ref ${hx(ref)}`);if(term!==0)throw new Error(`${k} lost its zero terminator`);return[s];}
  const out:HeartRipDescriptorSymbol[]=[];let sawZero=false;for(let i=0;i<4;i++){const ref=readU32(bytes,start+i*4);if(ref===0){sawZero=true;for(let j=i+1;j<4;j++)if(readU32(bytes,start+j*4)!==0)throw new Error('heart_2 non-zero dword after terminator');break;}const s=refToSymbol.get(ref);if(!s)throw new Error(`heart_2 reparsed unqualified descriptor ref ${hx(ref)}`);out.push(s);}
  if(out.length<1||out.length>4)throw new Error('heart_2 reparsed invalid part count');
  if(out.length<4&&!sawZero)throw new Error('heart_2 under-capacity record lost zero termination');
  return out;
}

export interface MK1HeartRipFullFixedLayoutCompositionEditorReport{
  format:'mk1_heart_rip_full_fixed_layout_composition_editor_model_v1';timestamp:string;operationId:string;
  provenance:MK1HeartRipAnimationCanvasEditorReport['provenance'];fixture:MK1HeartRipAnimationCanvasEditorReport['fixture'];
  prerequisite:{
    o8:{pass:'1E.3O.8';operationId:string;verdict:'KANO_HEART_FULL_FIXED_LAYOUT_CANVAS_EDITOR_ESTABLISHED';validationPassed:true};
    o13:{pass:'1E.3O.13';operationId:string;verdict:'HEART2_ATOMIC_TOPOLOGY_AND_PLACEMENT_AUTHORING_ESTABLISHED';validationPassed:true};
  };
  frames:Array<{
    frameKey:HeartRipFrameKey;recordWatcomOffset:number;recordWatcomOffsetHex:string;physicalStart:number;physicalStartHex:string;allocationByteLength:8|16;
    baselineParts:HeartRipDescriptorSymbol[];previewKeys:string[];reusedAcrossOccurrences:boolean;minParts:number;maxParts:number;
    topologyMode:'SINGLE_PART_REPLACEMENT'|'ONE_TO_FOUR_FIXED_CAPACITY';
  }>;
  descriptors:Array<{symbol:HeartRipDescriptorSymbol;descriptorRef:number;descriptorRefHex:string;physicalStart:number;physicalStartHex:string;width:number;height:number;x:number;y:number;existingPreviewKeys:string[];writableFields:['x','y']}>;
  transaction:{allSevenFrameRecordsWritable:true;heart2VariablePartCount:true;otherFramesSinglePartReplacementOnly:true;placementForAuthoredDescriptors:true;descriptorReuseAcrossFrameRecordsAllowed:true;heart2DuplicatePointersAllowed:false;frameAllocationsFixed:true;relocationSupported:false;sequencePointersWritable:false};
  noEditRoundTrip:{sourceSha256:string;rebuiltSha256:string;mismatchCount:number;exact:boolean;semanticRegionCount:number};
  decision:{fullHeartRipFixedLayoutCompositionAuthoringEstablished:boolean;genericGrowthRelocationEstablished:false;verdict:'FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING_ESTABLISHED'|'FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING_FAILED';narrative:string};
  status:'SUCCESS'|'FAILED';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean}>};baselineIr:MK1MultiPartFrameLosslessIrReport['ir'];
}

export interface MK1HeartRipFullFixedLayoutCompositionEditRequest{
  frames:HeartRipFullFrameRequest[];
  placements:PlacementRequest[];
  note?:string;
}
export interface MK1HeartRipFullFixedLayoutCompositionEditReport{
  format:'mk1_heart_rip_full_fixed_layout_composition_edit_v1';timestamp:string;operationId:string;
  provenance:MK1HeartRipFullFixedLayoutCompositionEditorReport['provenance'];fixture:MK1HeartRipFullFixedLayoutCompositionEditorReport['fixture'];
  prerequisite:{pass:'1E.3O.14';operationId:string;verdict:'FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING_ESTABLISHED';validationPassed:true};
  request:MK1HeartRipFullFixedLayoutCompositionEditRequest;
  frames:Array<{frameKey:HeartRipFrameKey;previewKeys:string[];before:HeartRipDescriptorSymbol[];after:HeartRipDescriptorSymbol[];beforePartCount:number;afterPartCount:number;allocationByteLength:8|16;terminationAfter:'ZERO_DWORD'|'LINKED_OBJECT_CHAIN_EXHAUSTION';changed:boolean}>;
  placements:Array<{symbol:HeartRipDescriptorSymbol;before:{x:number;y:number};after:{x:number;y:number};delta:{x:number;y:number};editedFields:Array<'x'|'y'>;affectedPreviewKeysBefore:string[];affectedPreviewKeysAfter:string[];newlyIntroducedPreviewKeys:string[];affectsMultipleAuthoredOccurrences:boolean}>;
  aliasingAfter:Array<{symbol:HeartRipDescriptorSymbol;frameKeys:HeartRipFrameKey[];previewKeys:string[];frameReferenceCount:number;previewOccurrenceCount:number;sharedAcrossFrameRecords:boolean}>;
  editedIr:MK1MultiPartFrameLosslessIrReport['ir'];
  evidence:{originalSha256:string;editedSha256:string;reversedSha256:string;changedByteCount:number;expectedChangedByteCount:number;changedBytes:ByteDiff[];expectedChangedBytes:ByteDiff[];unexpectedByteChanges:number;wholeExecutableDiffExactlyExpected:boolean;reparsedFrames:Array<{frameKey:HeartRipFrameKey;parts:HeartRipDescriptorSymbol[]}>;compositionReparseMatches:boolean;placementReparseMatches:boolean;reverseRestoresOriginal:boolean};
  constraints:{sevenExistingFrameAllocationsOnly:true;frameAllocationsUnchanged:true;heart2MaxFourParts:true;otherFramesRemainSinglePart:true;setupObjectCountUnchanged:true;sequencePointersUntouched:true;descriptorDimensionsUntouched:true;packedReferencesUntouched:true;graPixelsUntouched:true;paletteUntouched:true;relocationUnused:true;collisionAndGameplayUntouched:true;heart2DuplicatePointersBlocked:true};
  status:'STATIC_VALIDATION_PASSED';
}
export interface MK1HeartRipFullFixedLayoutCompositionEditResult{report:MK1HeartRipFullFixedLayoutCompositionEditReport;originalExe:Uint8Array;editedExe:Uint8Array;}

async function readCanonicalExe(source:DirectorySource,fixture:MK1HeartRipFullFixedLayoutCompositionEditorReport['fixture']){
  if(source.isSynthetic!==false)throw new Error('1E.3O.14 requires authentic user-loaded source');
  const entries=await source.listRecursive(),entry=entries.find(e=>e.path===fixture.exePath);if(!entry||entry.size!==fixture.exeSize)throw new Error('MK1.EXE missing or size changed before O14 authoring');
  const bytes=await source.readSlice(entry.path,0,entry.size),hash=await sha256Bytes(bytes);if(hash!==CANONICAL_SHA)throw new Error(`1E.3O.14 requires canonical MK1.EXE; got ${hash}`);return{bytes,hash};
}

export async function executeHeartRipFullFixedLayoutCompositionEditorModel(
  source:DirectorySource,
  o8:MK1HeartRipAnimationCanvasEditorReport,
  o13:MK1HeartRipAtomicCompositionEditorReport,
):Promise<MK1HeartRipFullFixedLayoutCompositionEditorReport>{
  if(o8.status!=='SUCCESS'||!o8.validation.allChecksPassed||o8.decision.verdict!=='KANO_HEART_FULL_FIXED_LAYOUT_CANVAS_EDITOR_ESTABLISHED'||o8.provenance.sha256!==CANONICAL_SHA)throw new Error('O14 requires successful canonical O8');
  if(o13.status!=='SUCCESS'||!o13.validation.allChecksPassed||o13.decision.verdict!=='HEART2_ATOMIC_TOPOLOGY_AND_PLACEMENT_AUTHORING_ESTABLISHED'||o13.provenance.sha256!==CANONICAL_SHA)throw new Error('O14 requires successful canonical O13');
  const {bytes,hash}=await readCanonicalExe(source,o8.fixture),staticDataBase=o8.coordinateModel.staticDataBase;
  const frameByKey=new Map(o8.baselineIr.frames.map(f=>[f.frameKey,f] as const));
  const frames=HEART_RIP_FRAME_KEYS.map(frameKey=>{
    const f=frameByKey.get(frameKey);if(!f)throw new Error(`O14 baseline IR missing ${frameKey}`);
    const previewKeys=o8.occurrences.filter(o=>o.frameRecordKey===frameKey).map(o=>o.previewKey);if(!previewKeys.length)throw new Error(`${frameKey} has no qualified occurrence`);
    const baselineParts=f.parts.map(p=>p.descriptorSymbol as HeartRipDescriptorSymbol);if(!baselineParts.every(s=>(HEART_RIP_SYMBOLS as readonly string[]).includes(s)))throw new Error(`${frameKey} contains unqualified descriptor`);
    const physicalStart=staticDataBase+f.recordOffset,allocationByteLength=frameSize(frameKey) as 8|16;
    const raw=encodeFrame(frameKey,baselineParts.map(s=>o8.descriptors.find(d=>d.symbol===s)!.watcomOffset));
    // Above raw uses Watcom descriptor refs, not physical addresses. It must match canonical bytes exactly.
    for(let i=0;i<raw.length;i++)if(bytes[physicalStart+i]!==raw[i])throw new Error(`${frameKey} canonical fixed allocation drifted`);
    return{frameKey,recordWatcomOffset:f.recordOffset,recordWatcomOffsetHex:hx(f.recordOffset),physicalStart,physicalStartHex:hx(physicalStart),allocationByteLength,baselineParts,previewKeys,reusedAcrossOccurrences:previewKeys.length>1,minParts:1,maxParts:frameKey===VARIABLE_FRAME?4:1,topologyMode:(frameKey===VARIABLE_FRAME?'ONE_TO_FOUR_FIXED_CAPACITY':'SINGLE_PART_REPLACEMENT') as 'SINGLE_PART_REPLACEMENT'|'ONE_TO_FOUR_FIXED_CAPACITY'};
  });
  const descriptors=o13.descriptors.map(d=>({symbol:d.symbol,descriptorRef:d.descriptorRef,descriptorRefHex:d.descriptorRefHex,physicalStart:d.physicalStart,physicalStartHex:d.physicalStartHex,width:d.width,height:d.height,x:d.x,y:d.y,existingPreviewKeys:[...d.existingPreviewKeys],writableFields:['x','y'] as ['x','y']}));
  const rebuilt=bytes.slice(),serialized=serializeMK1BoundedAnimationIr(o8.baselineIr,staticDataBase);for(const r of serialized)rebuilt.set(r.encoded,r.physicalStart);const mismatchCount=diff(bytes,rebuilt).length,rebuiltSha256=await sha256Bytes(rebuilt);
  const checks=[
    {checkId:'CANONICAL_PROVENANCE',passed:hash===CANONICAL_SHA},
    {checkId:'O8_FULL_HEART_RIP_PREREQUISITE',passed:o8.animation.uniqueFrameRecordCount===7&&o8.animation.uniqueDescriptorCount===9},
    {checkId:'O13_ATOMIC_PREREQUISITE',passed:o13.decision.verdict==='HEART2_ATOMIC_TOPOLOGY_AND_PLACEMENT_AUTHORING_ESTABLISHED'},
    {checkId:'SEVEN_FIXED_FRAME_ALLOCATIONS',passed:frames.length===7&&frames.filter(f=>f.allocationByteLength===8).length===6&&frames.filter(f=>f.allocationByteLength===16).length===1},
    {checkId:'HEART2_VARIABLE_ONLY',passed:frames.find(f=>f.frameKey==='heart_2')?.maxParts===4&&frames.filter(f=>f.frameKey!=='heart_2').every(f=>f.maxParts===1)},
    {checkId:'HEART4_SEQUENCE_ALIAS_PRESERVED',passed:frames.find(f=>f.frameKey==='heart_4')?.previewKeys.sort().join('|')===['BEAT_LOOP:2','PRIMARY:4'].sort().join('|')},
    {checkId:'NINE_QUALIFIED_DESCRIPTORS',passed:descriptors.length===9},
    {checkId:'NO_EDIT_ROUND_TRIP',passed:mismatchCount===0&&rebuiltSha256===CANONICAL_SHA},
    {checkId:'NO_RELOCATION',passed:o8.serializer.relocationSupported===false},
  ];
  const all=checks.every(c=>c.passed),timestamp=new Date().toISOString(),operationId=createOperationId('heart-rip-full-fixed-layout-composition-editor');
  return{format:'mk1_heart_rip_full_fixed_layout_composition_editor_model_v1',timestamp,operationId,provenance:{...o8.provenance,timestamp,operationId},fixture:o8.fixture,prerequisite:{o8:{pass:'1E.3O.8',operationId:o8.operationId,verdict:'KANO_HEART_FULL_FIXED_LAYOUT_CANVAS_EDITOR_ESTABLISHED',validationPassed:true},o13:{pass:'1E.3O.13',operationId:o13.operationId,verdict:'HEART2_ATOMIC_TOPOLOGY_AND_PLACEMENT_AUTHORING_ESTABLISHED',validationPassed:true}},frames,descriptors,transaction:{allSevenFrameRecordsWritable:true,heart2VariablePartCount:true,otherFramesSinglePartReplacementOnly:true,placementForAuthoredDescriptors:true,descriptorReuseAcrossFrameRecordsAllowed:true,heart2DuplicatePointersAllowed:false,frameAllocationsFixed:true,relocationSupported:false,sequencePointersWritable:false},noEditRoundTrip:{sourceSha256:hash,rebuiltSha256,mismatchCount,exact:mismatchCount===0&&rebuiltSha256===CANONICAL_SHA,semanticRegionCount:serialized.length},decision:{fullHeartRipFixedLayoutCompositionAuthoringEstablished:all,genericGrowthRelocationEstablished:false,verdict:all?'FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING_ESTABLISHED':'FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING_FAILED',narrative:all?'O14 extends the verified O13 transaction across all seven unique Kano heart-rip frame records while preserving their existing binary allocations. heart_2 retains bounded 1..4-part fixed-capacity topology; the other six 8-byte records permit only single-pointer replacement. Signed-int16 descriptor placement remains shared-storage authoring with authored alias effects reported explicitly. Relocation and record growth remain blocked.':'One or more O14 model checks failed; full fixed-layout composition authoring remains disabled.'},status:all?'SUCCESS':'FAILED',validation:{allChecksPassed:all,checks},baselineIr:o8.baselineIr};
}

function normalizeFrames(model:MK1HeartRipFullFixedLayoutCompositionEditorReport,request:MK1HeartRipFullFixedLayoutCompositionEditRequest){
  if(!Array.isArray(request.frames)||request.frames.length!==HEART_RIP_FRAME_KEYS.length)throw new Error('O14 request must provide all seven unique frame records');
  const allowed=new Set(model.descriptors.map(d=>d.symbol)),seen=new Set<string>(),out=new Map<HeartRipFrameKey,HeartRipDescriptorSymbol[]>();
  for(const f of request.frames){if(!(HEART_RIP_FRAME_KEYS as readonly string[]).includes(f.frameKey))throw new Error(`O14 unknown frame key ${String(f.frameKey)}`);if(seen.has(f.frameKey))throw new Error(`O14 duplicate frame request ${f.frameKey}`);seen.add(f.frameKey);if(!Array.isArray(f.parts))throw new Error(`${f.frameKey}.parts must be an array`);if(f.frameKey===VARIABLE_FRAME){if(f.parts.length<1||f.parts.length>4)throw new Error('heart_2 must contain 1..4 parts');if(new Set(f.parts).size!==f.parts.length)throw new Error('O14 duplicate pointers within heart_2 are not qualified');}else if(f.parts.length!==1)throw new Error(`${f.frameKey} must remain exactly one part`);for(const s of f.parts)if(!allowed.has(s))throw new Error(`${f.frameKey} uses unqualified descriptor ${String(s)}`);out.set(f.frameKey,[...f.parts]);}
  for(const k of HEART_RIP_FRAME_KEYS)if(!out.has(k))throw new Error(`O14 missing frame ${k}`);return out;
}
function authoredUsage(model:MK1HeartRipFullFixedLayoutCompositionEditorReport,frames:Map<HeartRipFrameKey,HeartRipDescriptorSymbol[]>){
  const usage=new Map<HeartRipDescriptorSymbol,{frameKeys:Set<HeartRipFrameKey>;previewKeys:Set<string>;frameReferenceCount:number}>();
  for(const d of model.descriptors)usage.set(d.symbol,{frameKeys:new Set(),previewKeys:new Set(),frameReferenceCount:0});
  for(const f of model.frames){for(const s of frames.get(f.frameKey)!){const u=usage.get(s)!;u.frameKeys.add(f.frameKey);u.frameReferenceCount++;for(const p of f.previewKeys)u.previewKeys.add(p);}}
  return usage;
}
function validateRequest(model:MK1HeartRipFullFixedLayoutCompositionEditorReport,request:MK1HeartRipFullFixedLayoutCompositionEditRequest){
  if(model.status!=='SUCCESS'||!model.validation.allChecksPassed||model.decision.verdict!=='FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING_ESTABLISHED')throw new Error('O14 edit requires successful model');
  const frames=normalizeFrames(model,request),usage=authoredUsage(model,frames),allowed=new Set(model.descriptors.map(d=>d.symbol));
  if(!Array.isArray(request.placements))throw new Error('O14 placements must be an array');const seen=new Set<string>();for(const p of request.placements){if(!allowed.has(p.symbol))throw new Error(`O14 unqualified placement descriptor ${String(p.symbol)}`);if((usage.get(p.symbol)?.frameReferenceCount??0)<1)throw new Error(`O14 placement ${p.symbol} is not used by the authored animation`);if(seen.has(p.symbol))throw new Error(`O14 duplicate placement request for ${p.symbol}`);seen.add(p.symbol);ensureI16(p.x,`${p.symbol}.x`);ensureI16(p.y,`${p.symbol}.y`);}
  const baseline=new Map(model.frames.map(f=>[f.frameKey,f.baselineParts] as const)),compositionChanged=HEART_RIP_FRAME_KEYS.some(k=>frames.get(k)!.join('|')!==baseline.get(k)!.join('|')),descriptorBySymbol=new Map(model.descriptors.map(d=>[d.symbol,d] as const)),placementChanged=request.placements.some(p=>{const d=descriptorBySymbol.get(p.symbol)!;return p.x!==d.x||p.y!==d.y;});if(!compositionChanged&&!placementChanged)throw new Error('O14 edit request is a semantic no-op');return{frames,usage};
}

export async function executeHeartRipFullFixedLayoutCompositionEdit(
  source:DirectorySource,
  model:MK1HeartRipFullFixedLayoutCompositionEditorReport,
  request:MK1HeartRipFullFixedLayoutCompositionEditRequest,
):Promise<MK1HeartRipFullFixedLayoutCompositionEditResult>{
  const validated=validateRequest(model,request),{bytes:originalExe,hash:originalSha256}=await readCanonicalExe(source,model.fixture),descriptorBySymbol=new Map(model.descriptors.map(d=>[d.symbol,d] as const)),refToSymbol=new Map(model.descriptors.map(d=>[d.descriptorRef,d.symbol] as const));
  const editedIr=cloneIr(model.baselineIr);for(const k of HEART_RIP_FRAME_KEYS){const f=editedIr.frames.find(x=>x.frameKey===k);if(!f)throw new Error(`O14 edited IR missing ${k}`);f.parts=validated.frames.get(k)!.map((symbol,structuralIndex)=>{const d=descriptorBySymbol.get(symbol)!;return{descriptorRef:d.descriptorRef,descriptorSymbol:symbol,structuralIndex};});}
  const beforeUsage=new Map<HeartRipDescriptorSymbol,Set<string>>();for(const d of model.descriptors)beforeUsage.set(d.symbol,new Set(d.existingPreviewKeys));
  const placementReports:MK1HeartRipFullFixedLayoutCompositionEditReport['placements']=[];for(const p of request.placements){const d=descriptorBySymbol.get(p.symbol)!,ir=editedIr.descriptors.find(x=>x.symbol===p.symbol);if(!ir)throw new Error(`O14 IR descriptor missing ${p.symbol}`);const editedFields:Array<'x'|'y'>=[];if(p.x!==d.x)editedFields.push('x');if(p.y!==d.y)editedFields.push('y');ir.x=p.x;ir.y=p.y;const after=[...(validated.usage.get(p.symbol)?.previewKeys??new Set<string>())].sort(),before=[...(beforeUsage.get(p.symbol)??new Set<string>())].sort();placementReports.push({symbol:p.symbol,before:{x:d.x,y:d.y},after:{x:p.x,y:p.y},delta:{x:p.x-d.x,y:p.y-d.y},editedFields,affectedPreviewKeysBefore:before,affectedPreviewKeysAfter:after,newlyIntroducedPreviewKeys:after.filter(k=>!before.includes(k)),affectsMultipleAuthoredOccurrences:after.length>1});}
  const staticDataBase=model.frames[0].physicalStart-model.frames[0].recordWatcomOffset,regions:MK1BoundedAnimationIrRegion[]=serializeMK1BoundedAnimationIr(editedIr,staticDataBase).map(r=>({name:r.name,physicalStart:r.physicalStart,encoded:r.encoded.slice()}));if(regions.length!==model.noEditRoundTrip.semanticRegionCount)throw new Error('O14 semantic region count changed');
  for(const mf of model.frames){const region=regions.find(r=>r.name===`FRAME_${hx(mf.recordWatcomOffset)}`);if(!region)throw new Error(`O14 semantic region missing ${mf.frameKey}`);region.encoded=encodeFrame(mf.frameKey,validated.frames.get(mf.frameKey)!.map(s=>descriptorBySymbol.get(s)!.descriptorRef));}
  const editedExe=originalExe.slice();for(const r of regions)editedExe.set(r.encoded,r.physicalStart);
  const expected:ByteDiff[]=[];for(const mf of model.frames){const encoded=encodeFrame(mf.frameKey,validated.frames.get(mf.frameKey)!.map(s=>descriptorBySymbol.get(s)!.descriptorRef));for(let i=0;i<encoded.length;i++){const off=mf.physicalStart+i;if(originalExe[off]!==encoded[i])expected.push({physicalOffset:off,physicalOffsetHex:hx(off),before:originalExe[off],after:encoded[i]});}}
  for(const p of request.placements){const d=descriptorBySymbol.get(p.symbol)!;for(const [off,value] of [[d.physicalStart+4,p.x],[d.physicalStart+6,p.y]] as [number,number][]){const bs=i16Bytes(value);for(let i=0;i<2;i++)if(originalExe[off+i]!==bs[i])expected.push({physicalOffset:off+i,physicalOffsetHex:hx(off+i),before:originalExe[off+i],after:bs[i]});}}
  const expectedChangedBytes=sortedUniqueDiff(expected),changedBytes=diff(originalExe,editedExe),wholeExecutableDiffExactlyExpected=sameDiff(changedBytes,expectedChangedBytes);if(!wholeExecutableDiffExactlyExpected)throw new Error('O14 whole-EXE diff escaped independently expected frame/placement bytes');
  const reparsedFrames=model.frames.map(f=>({frameKey:f.frameKey,parts:parseFrame(f.frameKey,editedExe,f.physicalStart,refToSymbol)})),compositionReparseMatches=reparsedFrames.every(r=>r.parts.join('|')===validated.frames.get(r.frameKey)!.join('|'));if(!compositionReparseMatches)throw new Error('O14 composition reparse mismatch');
  const placementReparseMatches=request.placements.every(p=>{const d=descriptorBySymbol.get(p.symbol)!;return readI16(editedExe,d.physicalStart+4)===p.x&&readI16(editedExe,d.physicalStart+6)===p.y;});if(!placementReparseMatches)throw new Error('O14 placement reparse mismatch');
  const editedSha256=await sha256Bytes(editedExe),reversed=editedExe.slice();for(const d of changedBytes)reversed[d.physicalOffset]=d.before;const reversedSha256=await sha256Bytes(reversed),reverseRestoresOriginal=reversedSha256===CANONICAL_SHA&&diff(originalExe,reversed).length===0;if(!reverseRestoresOriginal)throw new Error('O14 reversal failed');
  const frameReports=model.frames.map(f=>{const after=validated.frames.get(f.frameKey)!;return{frameKey:f.frameKey,previewKeys:[...f.previewKeys],before:[...f.baselineParts],after:[...after],beforePartCount:f.baselineParts.length,afterPartCount:after.length,allocationByteLength:f.allocationByteLength,terminationAfter:(f.frameKey===VARIABLE_FRAME&&after.length===4?'LINKED_OBJECT_CHAIN_EXHAUSTION':'ZERO_DWORD') as 'ZERO_DWORD'|'LINKED_OBJECT_CHAIN_EXHAUSTION',changed:f.baselineParts.join('|')!==after.join('|')};});
  const aliasingAfter=model.descriptors.map(d=>{const u=validated.usage.get(d.symbol)!;return{symbol:d.symbol,frameKeys:[...u.frameKeys].sort() as HeartRipFrameKey[],previewKeys:[...u.previewKeys].sort(),frameReferenceCount:u.frameReferenceCount,previewOccurrenceCount:u.previewKeys.size,sharedAcrossFrameRecords:u.frameKeys.size>1};}).filter(a=>a.frameReferenceCount>0);
  const timestamp=new Date().toISOString(),operationId=createOperationId('heart-rip-full-fixed-layout-composition-edit');
  const report:MK1HeartRipFullFixedLayoutCompositionEditReport={format:'mk1_heart_rip_full_fixed_layout_composition_edit_v1',timestamp,operationId,provenance:{...model.provenance,timestamp,operationId},fixture:model.fixture,prerequisite:{pass:'1E.3O.14',operationId:model.operationId,verdict:'FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING_ESTABLISHED',validationPassed:true},request:{frames:request.frames.map(f=>({frameKey:f.frameKey,parts:[...f.parts]})),placements:request.placements.map(p=>({...p})),note:request.note},frames:frameReports,placements:placementReports,aliasingAfter,editedIr,evidence:{originalSha256,editedSha256,reversedSha256,changedByteCount:changedBytes.length,expectedChangedByteCount:expectedChangedBytes.length,changedBytes,expectedChangedBytes,unexpectedByteChanges:0,wholeExecutableDiffExactlyExpected,reparsedFrames,compositionReparseMatches,placementReparseMatches,reverseRestoresOriginal},constraints:{sevenExistingFrameAllocationsOnly:true,frameAllocationsUnchanged:true,heart2MaxFourParts:true,otherFramesRemainSinglePart:true,setupObjectCountUnchanged:true,sequencePointersUntouched:true,descriptorDimensionsUntouched:true,packedReferencesUntouched:true,graPixelsUntouched:true,paletteUntouched:true,relocationUnused:true,collisionAndGameplayUntouched:true,heart2DuplicatePointersBlocked:true},status:'STATIC_VALIDATION_PASSED'};
  return{report,originalExe,editedExe};
}

export function createMK1HeartRipFullFixedLayoutCompositionEditorExport(model:MK1HeartRipFullFixedLayoutCompositionEditorReport):MK1HeartRipFullFixedLayoutCompositionEditorReport{if(model.status!=='SUCCESS'||!model.validation.allChecksPassed)throw new Error('Cannot export failed O14 model');return model;}
export function createMK1HeartRipFullFixedLayoutCompositionEditExport(result:MK1HeartRipFullFixedLayoutCompositionEditResult):MK1HeartRipFullFixedLayoutCompositionEditReport{return result.report;}
export function buildHeartRipFullFixedLayoutCompositionBundle(result:MK1HeartRipFullFixedLayoutCompositionEditResult):Uint8Array{
  const reportBytes=new TextEncoder().encode(JSON.stringify(result.report,null,2)),changedFrames=result.report.frames.filter(f=>f.changed).map(f=>f.frameKey).join(', ')||'placement-only';
  const readme=new TextEncoder().encode(['MK1 Pass 1E.3O.14 — full heart-rip fixed-layout composition authoring test','',`Original SHA-256: ${result.report.evidence.originalSha256}`,`Edited SHA-256:   ${result.report.evidence.editedSha256}`,`Changed frame records: ${changedFrames}`,`Placement edits: ${result.report.placements.length}`,`Changed bytes: ${result.report.evidence.changedByteCount}; unexpected: ${result.report.evidence.unexpectedByteChanges}`,'','This bundle edits only the seven already-qualified Kano heart-rip frame allocations plus signed-int16 X/Y of qualified descriptors used by the authored animation.','heart_2 may contain 1..4 unique parts in its existing 16 bytes; all other heart frame records remain exactly one part in their existing 8 bytes.','No record growth, relocation, sequence rewrite, arbitrary pointers, pixels, palette, collision or gameplay data are changed.','Use only in a separate copy of the complete MK1 installation. Do not overwrite the canonical source installation.'].join('\r\n'));
  return buildStoredZip([{name:'MK1.EXE',bytes:result.editedExe},{name:'mk1_heart_rip_full_fixed_layout_composition_edit.json',bytes:reportBytes},{name:'READ_ME_FIRST.txt',bytes:readme}]);
}
