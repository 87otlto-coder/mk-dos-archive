/**
 * MK1 controlled heart-rip fourth-part topology writer — Pass 1E.3O.11.
 *
 * Bounded purpose:
 *  - use O10's full-capacity chain-exhaustion proof;
 *  - replace heart_2's existing zero dword with one already-qualified descriptor pointer;
 *  - keep the frame allocation exactly 16 bytes and avoid relocation;
 *  - prove exact whole-EXE diff, semantic reparse and exact reversal.
 *
 * This is NOT a generic add/remove-parts editor. The controlled fixture adds
 * KHEART5B as structural part 3 to heart_2 only. No descriptor bytes, pixels,
 * palettes, sequence pointers, allocation state or gameplay data are changed.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { sha256Bytes } from './paletteRoundTripCodec';
import {
  MK1BoundedAnimationIrRegion,
  MK1MultiPartFrameLosslessIrReport,
  serializeMK1BoundedAnimationIr,
} from './multiPartFrameLosslessIr';
import { MK1HeartRipAnimationCanvasEditorReport } from './heartRipAnimationCanvasEditor';
import { MK1ReshapeMultiFullCapacitySemanticsReport } from './reshapeMultiFullCapacitySemantics';

const CANONICAL_SHA = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const TARGET_FRAME_KEY = 'heart_2';
const CONTROLLED_FOURTH_SYMBOL = 'KHEART5B' as const;

function hx(v:number):string{return `0x${(v>>>0).toString(16).padStart(8,'0').toUpperCase()}`;}
function readU32(b:Uint8Array,o:number){if(o<0||o+4>b.length)throw new Error(`u32 OOB ${hx(o)}`);return (b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0;}
function u32Bytes(v:number):Uint8Array{return new Uint8Array([v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]);}
function cloneIr(ir:MK1MultiPartFrameLosslessIrReport['ir']):MK1MultiPartFrameLosslessIrReport['ir']{return JSON.parse(JSON.stringify(ir)) as MK1MultiPartFrameLosslessIrReport['ir'];}
function diff(a:Uint8Array,b:Uint8Array){if(a.length!==b.length)throw new Error('Executable lengths differ');const out:Array<{physicalOffset:number;physicalOffsetHex:string;before:number;after:number}>=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])out.push({physicalOffset:i,physicalOffsetHex:hx(i),before:a[i],after:b[i]});return out;}
function sameDiff(a:ReturnType<typeof diff>,b:ReturnType<typeof diff>){if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i].physicalOffset!==b[i].physicalOffset||a[i].before!==b[i].before||a[i].after!==b[i].after)return false;return true;}

function encodeFullCapacityFrame(parts:readonly {descriptorRef:number}[],maxPartObjects:number):Uint8Array{
  if(parts.length!==maxPartObjects)throw new Error(`Full-capacity frame requires exactly ${maxPartObjects} descriptor pointers`);
  const out=new Uint8Array(parts.length*4);
  parts.forEach((p,i)=>out.set(u32Bytes(p.descriptorRef),i*4));
  return out;
}

/**
 * Bounded serializer extension for O11.
 *
 * O2 remains unchanged: it serializes under-capacity records as pointer-list + 0.
 * For this single O10-qualified full-capacity frame, we reuse O2 for every other
 * semantic region and encode heart_2 as exactly four descriptor dwords, with
 * chain exhaustion providing termination at runtime.
 */
export function serializeMK1HeartRipFourthPartIr(
  ir:MK1MultiPartFrameLosslessIrReport['ir'],
  staticDataBase:number,
):MK1BoundedAnimationIrRegion[]{
  const target=ir.frames.find(f=>f.frameKey===TARGET_FRAME_KEY);
  if(!target)throw new Error('O11 edited IR is missing heart_2');
  if(ir.maxPartObjects!==4||target.parts.length!==4)throw new Error('O11 serializer requires heart_2 at exact four-object capacity');
  if(target.parts.some((p,i)=>p.structuralIndex!==i))throw new Error('O11 heart_2 structural indices must remain contiguous 0..3');

  // Keep O2's established serializer authoritative for every non-target region.
  // Feed it a three-part target so its legacy trailing-zero representation stays
  // exactly 16 bytes, then replace only that region with the O10-qualified
  // full-capacity four-dword representation derived from edited semantic IR.
  const legacyShape=cloneIr(ir);
  const legacyTarget=legacyShape.frames.find(f=>f.frameKey===TARGET_FRAME_KEY)!;
  legacyTarget.parts=legacyTarget.parts.slice(0,3);
  const regions=serializeMK1BoundedAnimationIr(legacyShape,staticDataBase).map(r=>({name:r.name,physicalStart:r.physicalStart,encoded:r.encoded.slice()}));
  const region=regions.find(r=>r.name===`FRAME_${hx(target.recordOffset)}`);
  if(!region)throw new Error('O11 target frame region missing from bounded serializer');
  const full=encodeFullCapacityFrame(target.parts,ir.maxPartObjects);
  if(region.encoded.length!==16||full.length!==16)throw new Error('O11 target frame allocation is not exactly 16 bytes');
  region.encoded=full;
  return regions;
}

export interface MK1HeartRipFourthPartTopologyReport {
  format:'mk1_heart_rip_fourth_part_topology_edit_v1';timestamp:string;operationId:string;
  provenance:MK1HeartRipAnimationCanvasEditorReport['provenance'];fixture:MK1HeartRipAnimationCanvasEditorReport['fixture'];
  prerequisite:{
    o8:{pass:'1E.3O.8';operationId:string;validationPassed:true};
    o10:{pass:'1E.3O.10';operationId:string;verdict:'FULL_CAPACITY_CHAIN_EXHAUSTION_ESTABLISHED_FOURTH_PART_FITS_IN_PLACE';validationPassed:true};
  };
  target:{
    frameKey:'heart_2';recordWatcomOffset:number;recordWatcomOffsetHex:string;physicalStart:number;physicalStartHex:string;
    slotWatcomOffset:number;slotWatcomOffsetHex:string;slotPhysical:number;slotPhysicalHex:string;
    allocationByteLength:16;beforePartCount:3;afterPartCount:4;terminationBefore:'ZERO_DWORD';terminationAfter:'LINKED_OBJECT_CHAIN_EXHAUSTION';
    relocationUsed:false;sequencePointerRewriteUsed:false;
  };
  insertion:{
    symbol:'KHEART5B';descriptorRef:number;descriptorRefHex:string;structuralIndex:3;
    beforeDword:number;beforeDwordHex:string;afterDword:number;afterDwordHex:string;
    beforeParts:string[];afterParts:string[];
  };
  editedIr:MK1MultiPartFrameLosslessIrReport['ir'];
  evidence:{
    originalSha256:string;editedSha256:string;reversedSha256:string;
    noEditMismatchCount:number;noEditHashExact:boolean;
    changedByteCount:number;expectedChangedByteCount:number;
    changedBytes:ReturnType<typeof diff>;expectedChangedBytes:ReturnType<typeof diff>;
    unexpectedByteChanges:number;wholeExecutableDiffExactlyExpected:boolean;
    reparsedFourthPointer:number;reparsedFourthPointerHex:string;semanticReparseMatches:boolean;
    followingRecordPreserved:boolean;reverseRestoresOriginal:boolean;
  };
  constraints:{
    onlyExistingTerminatorDwordReused:true;frameAllocationUnchanged:true;setupObjectCountUnchanged:true;
    sequencePointersUntouched:true;otherFrameRecordsUntouched:true;descriptorBytesUntouched:true;graPixelsUntouched:true;
    paletteUntouched:true;relocationUnused:true;collisionAndGameplayUntouched:true;genericTopologyEditingStillBlocked:true;
  };
  decision:{
    controlledFourthPartTopologyWriteEstablished:boolean;fullCapacityEncodingEstablished:boolean;inPlaceWithoutRelocationEstablished:boolean;
    genericAddRemovePartsEstablished:false;verdict:'CONTROLLED_FOURTH_PART_IN_PLACE_TOPOLOGY_WRITE_ESTABLISHED'|'CONTROLLED_FOURTH_PART_TOPOLOGY_WRITE_FAILED';narrative:string;
  };
  status:'STATIC_VALIDATION_PASSED_RUNTIME_PENDING'|'FAILED';
  runtime:{tested:false;result:'NOT_TESTED';expectedObservation:string};
  validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean;detail?:string}>};
}

export interface MK1HeartRipFourthPartTopologyResult{report:MK1HeartRipFourthPartTopologyReport;originalExe:Uint8Array;editedExe:Uint8Array;}

export async function executeHeartRipFourthPartTopologyWrite(
  source:DirectorySource,
  o10:MK1ReshapeMultiFullCapacitySemanticsReport,
  o8:MK1HeartRipAnimationCanvasEditorReport,
):Promise<MK1HeartRipFourthPartTopologyResult>{
  if(source.isSynthetic!==false)throw new Error('1E.3O.11 requires an authentic user-loaded MK1 directory');
  if(o8.status!=='SUCCESS'||!o8.validation.allChecksPassed||o8.provenance.sha256!==CANONICAL_SHA)throw new Error('1E.3O.11 requires canonical successful O8 model');
  if(o10.status!=='SUCCESS'||!o10.validation.allChecksPassed||o10.provenance.sha256!==CANONICAL_SHA)throw new Error('1E.3O.11 requires successful canonical O10 semantics');
  if(o10.decision.verdict!=='FULL_CAPACITY_CHAIN_EXHAUSTION_ESTABLISHED_FOURTH_PART_FITS_IN_PLACE'||!o10.boundedHeartCase.fourthPointerCanOccupyExistingTerminatorDword||o10.boundedHeartCase.bytesOfGrowthRequired!==0)throw new Error('O10 did not qualify in-place full-capacity encoding');

  const entries=await source.listRecursive();const exe=entries.find(e=>e.path===o8.fixture.exePath);
  if(!exe||exe.size!==o8.fixture.exeSize)throw new Error('MK1.EXE missing or size changed before O11');
  const originalExe=await source.readSlice(exe.path,0,exe.size);const originalHash=await sha256Bytes(originalExe);
  if(originalHash!==CANONICAL_SHA)throw new Error(`1E.3O.11 requires canonical MK1.EXE; got ${originalHash}`);

  // Fresh no-edit semantic round trip before topology authoring.
  const noEdit=originalExe.slice();
  const noEditRegions=serializeMK1BoundedAnimationIr(o8.baselineIr,o8.coordinateModel.staticDataBase);
  for(const r of noEditRegions)noEdit.set(r.encoded,r.physicalStart);
  const noEditMismatchCount=diff(originalExe,noEdit).length;const noEditHash=await sha256Bytes(noEdit);
  if(noEditMismatchCount!==0||noEditHash!==CANONICAL_SHA)throw new Error('O11 prerequisite no-edit semantic round trip is not canonical');

  const target=o8.baselineIr.frames.find(f=>f.frameKey===TARGET_FRAME_KEY);if(!target)throw new Error('heart_2 missing from O8 IR');
  if(target.parts.length!==3||target.parts.map(p=>p.descriptorSymbol).join('|')!=='KHEART3A|KHEART3B|KHEART3C')throw new Error('O11 heart_2 baseline topology drifted');
  const candidate=o8.baselineIr.descriptors.find(d=>d.symbol===CONTROLLED_FOURTH_SYMBOL);if(!candidate)throw new Error('KHEART5B missing from qualified O8 descriptors');
  const candidateModel=o8.descriptors.find(d=>d.symbol===CONTROLLED_FOURTH_SYMBOL);if(!candidateModel||!candidateModel.decode.success||candidateModel.decode.outOfPaletteRangeCount!==0)throw new Error('KHEART5B is not decode/palette-qualified for controlled insertion');

  const slotWatcom=target.recordOffset+12;const slotPhysical=o8.coordinateModel.staticDataBase+slotWatcom;
  if(slotWatcom!==o10.boundedHeartCase.currentTerminatorWatcomOffset||slotPhysical!==o10.boundedHeartCase.currentTerminatorPhysical)throw new Error('O10 terminator slot identity drifted');
  const beforeDword=readU32(originalExe,slotPhysical);if(beforeDword!==0)throw new Error(`O11 expected zero dword at fourth slot; got ${hx(beforeDword)}`);

  const editedIr=cloneIr(o8.baselineIr);const editedTarget=editedIr.frames.find(f=>f.frameKey===TARGET_FRAME_KEY)!;
  editedTarget.parts.push({descriptorRef:candidate.offset,descriptorSymbol:candidate.symbol,structuralIndex:3});
  if(editedTarget.parts.length!==4)throw new Error('O11 failed to construct four-part semantic IR');

  const serialized=serializeMK1HeartRipFourthPartIr(editedIr,o8.coordinateModel.staticDataBase);
  if(serialized.length!==o8.noEditRoundTrip.semanticRegionCount)throw new Error('O11 semantic region count changed');
  const editedExe=originalExe.slice();for(const r of serialized)editedExe.set(r.encoded,r.physicalStart);

  const afterBytes=u32Bytes(candidate.offset);const expectedChangedBytes:ReturnType<typeof diff>=[];
  for(let i=0;i<4;i++)if(originalExe[slotPhysical+i]!==afterBytes[i])expectedChangedBytes.push({physicalOffset:slotPhysical+i,physicalOffsetHex:hx(slotPhysical+i),before:originalExe[slotPhysical+i],after:afterBytes[i]});
  const actualChangedBytes=diff(originalExe,editedExe);const exact=sameDiff(actualChangedBytes,expectedChangedBytes);
  if(!exact)throw new Error(`O11 whole-EXE diff escaped fourth-pointer slot: expected ${expectedChangedBytes.length}, actual ${actualChangedBytes.length}`);

  const reparsedFourthPointer=readU32(editedExe,slotPhysical);
  const semanticReparseMatches=reparsedFourthPointer===candidate.offset;
  if(!semanticReparseMatches)throw new Error('O11 semantic reparse did not recover KHEART5B fourth pointer');
  const nextPhysical=o8.coordinateModel.staticDataBase+o10.boundedHeartCase.nextStructureWatcomOffset;
  let followingRecordPreserved=true;for(let i=0;i<8;i++)if(editedExe[nextPhysical+i]!==originalExe[nextPhysical+i])followingRecordPreserved=false;
  if(!followingRecordPreserved)throw new Error('O11 modified following heart_3 frame record');

  const editedSha256=await sha256Bytes(editedExe);
  const reversed=editedExe.slice();for(const d of actualChangedBytes)reversed[d.physicalOffset]=d.before;
  const reversedSha256=await sha256Bytes(reversed);const reverseRestoresOriginal=reversedSha256===CANONICAL_SHA&&diff(originalExe,reversed).length===0;
  if(!reverseRestoresOriginal)throw new Error('O11 reversal failed to restore canonical MK1.EXE');

  const checks:MK1HeartRipFourthPartTopologyReport['validation']['checks']=[
    {checkId:'CANONICAL_PROVENANCE',passed:originalHash===CANONICAL_SHA},
    {checkId:'O10_FULL_CAPACITY_PREREQUISITE',passed:o10.decision.fullCapacityChainExhaustionEstablished&&o10.boundedHeartCase.trailingZeroRequiredAtFullCapacity===false},
    {checkId:'NO_EDIT_ROUND_TRIP',passed:noEditMismatchCount===0&&noEditHash===CANONICAL_SHA},
    {checkId:'HEART2_BASELINE_THREE_PART',passed:target.parts.length===3},
    {checkId:'KHEART5B_QUALIFIED_EXISTING_DESCRIPTOR',passed:candidateModel.decode.success&&candidateModel.decode.outOfPaletteRangeCount===0},
    {checkId:'FOURTH_SLOT_IS_EXISTING_ZERO_DWORD',passed:beforeDword===0&&slotWatcom===45664},
    {checkId:'FULL_CAPACITY_REGION_STAYS_16_BYTES',passed:serializeMK1HeartRipFourthPartIr(editedIr,o8.coordinateModel.staticDataBase).find(r=>r.name===`FRAME_${hx(target.recordOffset)}`)?.encoded.length===16},
    {checkId:'WHOLE_EXE_DIFF_EXACT',passed:exact,detail:`${actualChangedBytes.length} changed bytes; ${expectedChangedBytes.length} expected`},
    {checkId:'SEMANTIC_REPARSE_FOURTH_POINTER',passed:semanticReparseMatches},
    {checkId:'FOLLOWING_FRAME_PRESERVED',passed:followingRecordPreserved},
    {checkId:'EXACT_REVERSAL',passed:reverseRestoresOriginal},
    {checkId:'NO_RELOCATION_OR_SEQUENCE_REWRITE',passed:true},
  ];
  const all=checks.every(c=>c.passed);
  const timestamp=new Date().toISOString(),operationId=createOperationId('heart-rip-fourth-part-topology');
  const beforeParts=target.parts.map(p=>p.descriptorSymbol),afterParts=editedTarget.parts.map(p=>p.descriptorSymbol);
  const report:MK1HeartRipFourthPartTopologyReport={
    format:'mk1_heart_rip_fourth_part_topology_edit_v1',timestamp,operationId,
    provenance:{...o8.provenance,timestamp,operationId},fixture:o8.fixture,
    prerequisite:{o8:{pass:'1E.3O.8',operationId:o8.operationId,validationPassed:true},o10:{pass:'1E.3O.10',operationId:o10.operationId,verdict:'FULL_CAPACITY_CHAIN_EXHAUSTION_ESTABLISHED_FOURTH_PART_FITS_IN_PLACE',validationPassed:true}},
    target:{frameKey:'heart_2',recordWatcomOffset:target.recordOffset,recordWatcomOffsetHex:hx(target.recordOffset),physicalStart:o8.coordinateModel.staticDataBase+target.recordOffset,physicalStartHex:hx(o8.coordinateModel.staticDataBase+target.recordOffset),slotWatcomOffset:slotWatcom,slotWatcomOffsetHex:hx(slotWatcom),slotPhysical,slotPhysicalHex:hx(slotPhysical),allocationByteLength:16,beforePartCount:3,afterPartCount:4,terminationBefore:'ZERO_DWORD',terminationAfter:'LINKED_OBJECT_CHAIN_EXHAUSTION',relocationUsed:false,sequencePointerRewriteUsed:false},
    insertion:{symbol:CONTROLLED_FOURTH_SYMBOL,descriptorRef:candidate.offset,descriptorRefHex:hx(candidate.offset),structuralIndex:3,beforeDword,beforeDwordHex:hx(beforeDword),afterDword:candidate.offset,afterDwordHex:hx(candidate.offset),beforeParts,afterParts},
    editedIr,
    evidence:{originalSha256:originalHash,editedSha256,reversedSha256,noEditMismatchCount,noEditHashExact:noEditHash===CANONICAL_SHA,changedByteCount:actualChangedBytes.length,expectedChangedByteCount:expectedChangedBytes.length,changedBytes:actualChangedBytes,expectedChangedBytes,unexpectedByteChanges:exact?0:Math.max(0,actualChangedBytes.length-expectedChangedBytes.length),wholeExecutableDiffExactlyExpected:exact,reparsedFourthPointer,reparsedFourthPointerHex:hx(reparsedFourthPointer),semanticReparseMatches,followingRecordPreserved,reverseRestoresOriginal},
    constraints:{onlyExistingTerminatorDwordReused:true,frameAllocationUnchanged:true,setupObjectCountUnchanged:true,sequencePointersUntouched:true,otherFrameRecordsUntouched:true,descriptorBytesUntouched:true,graPixelsUntouched:true,paletteUntouched:true,relocationUnused:true,collisionAndGameplayUntouched:true,genericTopologyEditingStillBlocked:true},
    decision:{controlledFourthPartTopologyWriteEstablished:all,fullCapacityEncodingEstablished:all,inPlaceWithoutRelocationEstablished:all,genericAddRemovePartsEstablished:false,verdict:all?'CONTROLLED_FOURTH_PART_IN_PLACE_TOPOLOGY_WRITE_ESTABLISHED':'CONTROLLED_FOURTH_PART_TOPOLOGY_WRITE_FAILED',narrative:all?'O10 establishes that the four-object heart setup terminates a full-capacity frame by linked-object chain exhaustion. O11 therefore replaces heart_2\'s existing fourth-slot zero dword with the already-qualified KHEART5B descriptor pointer. The frame remains exactly 16 bytes, the following heart_3 record and all sequence pointers remain unchanged, the whole-executable diff is exactly the independently expected pointer bytes, the edited pointer reparses semantically, and exact reversal restores canonical MK1.EXE. This proves one bounded 3->4 topology write without relocation; it does not yet establish generic add/remove-part authoring.':'One or more controlled topology-write checks failed; do not enable part addition.'},
    status:all?'STATIC_VALIDATION_PASSED_RUNTIME_PENDING':'FAILED',
    runtime:{tested:false,result:'NOT_TESTED',expectedObservation:'During the qualified three-part heart burst frame, a fourth linked heart object should display KHEART5B. The rest of the heart-rip sequence should remain structurally unchanged.'},
    validation:{allChecksPassed:all,checks},
  };
  if(!all)throw new Error('O11 controlled topology-write validation failed');
  return{report,originalExe,editedExe};
}

export function createMK1HeartRipFourthPartTopologyExport(result:MK1HeartRipFourthPartTopologyResult):MK1HeartRipFourthPartTopologyReport{
  if(result.report.status!=='STATIC_VALIDATION_PASSED_RUNTIME_PENDING'||!result.report.validation.allChecksPassed)throw new Error('Cannot export failed O11 topology result');
  if(result.report.provenance.synthetic||result.report.provenance.sha256!==CANONICAL_SHA)throw new Error('O11 authoritative export requires canonical authentic MK1.EXE');
  return result.report;
}

export function buildHeartRipFourthPartTopologyBundle(result:MK1HeartRipFourthPartTopologyResult):Uint8Array{
  const reportBytes=new TextEncoder().encode(JSON.stringify(result.report,null,2));
  const readme=new TextEncoder().encode([
    'MK1 Pass 1E.3O.11 — controlled fourth-part topology runtime test','',
    `Original SHA-256: ${result.report.evidence.originalSha256}`,
    `Edited SHA-256:   ${result.report.evidence.editedSha256}`,
    `Changed bytes: ${result.report.evidence.changedByteCount}`,
    `Unexpected bytes: ${result.report.evidence.unexpectedByteChanges}`,'',
    'Controlled change: heart_2 [KHEART3A,KHEART3B,KHEART3C,0] -> [KHEART3A,KHEART3B,KHEART3C,KHEART5B].',
    'The existing 16-byte allocation is retained. O10 proved runtime termination by linked-object chain exhaustion at four objects.','',
    'Use only in a separate copy of the complete MK1 installation. Do not overwrite the untouched source installation.',
    'Expected observation: during the three-part heart burst frame, a fourth KHEART5B sprite should appear. No collision/gameplay data is changed.',
  ].join('\r\n'));
  return buildStoredZip([
    {name:'MK1.EXE',bytes:result.editedExe},
    {name:'mk1_heart_rip_fourth_part_topology_edit.json',bytes:reportBytes},
    {name:'READ_ME_FIRST.txt',bytes:readme},
  ]);
}
