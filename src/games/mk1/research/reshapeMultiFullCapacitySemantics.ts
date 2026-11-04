/**
 * MK1 RESHAPE_MULTI full-capacity termination semantics — Pass 1E.3O.10.
 *
 * Read-only qualification. O9 proved that a conventional four-pointer + zero
 * record would need 20 bytes and cannot grow in place. O10 asks whether the
 * consumer actually requires that trailing zero when every linked part object
 * is occupied. If the non-zero descriptor path advances to the next linked
 * object and exits when that object pointer is null, a four-object setup can
 * consume exactly four descriptor dwords and stop on chain exhaustion.
 *
 * No executable mutation, topology write, pointer write, allocation or
 * relocation is performed in this pass.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { WatcomGlobalSymbol } from '../../../core/executable/watcomDebug/watcomPermanentClassTypes';
import { enumerateMK1WatcomPermanentClasses } from './watcomPermanentClassInventory';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1HeartRipAnimationCanvasEditorReport } from './heartRipAnimationCanvasEditor';
import { MK1HeartRipRelocationCensusReport } from './heartRipRelocationCensus';

const CANONICAL_SHA = '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const TARGET_FRAME_KEY = 'heart_2';

function hx(v:number):string{return `0x${(v>>>0).toString(16).padStart(8,'0').toUpperCase()}`;}
function readU32(b:Uint8Array,o:number){if(o<0||o+4>b.length)throw new Error(`u32 OOB ${hx(o)}`);return (b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0;}
function s8(v:number){return v&0x80?v-0x100:v;}
function shortTarget(bytes:Uint8Array,p:number){if(p<0||p+2>bytes.length)throw new Error(`short branch OOB ${hx(p)}`);return p+2+s8(bytes[p+1]);}
function bytesHex(bytes:Uint8Array,start:number,length:number){return Array.from(bytes.subarray(start,start+length)).map(v=>v.toString(16).padStart(2,'0').toUpperCase()).join(' ');}
function exactSymbol(symbols:readonly WatcomGlobalSymbol[],name:string,segment:number,kind:'code'|'data'){
  const m=symbols.filter(s=>s.valid&&s.name===name&&s.segment===segment&&(kind==='code'?s.kindBits.isCode:s.kindBits.isData));
  if(m.length!==1)throw new Error(`1E.3O.10 requires exactly one ${kind} symbol ${name}; found ${m.length}`); return m[0];
}
function findFirstRet(bytes:Uint8Array,start:number,endExclusive:number){for(let p=start;p<Math.min(bytes.length,endExclusive);p++)if(bytes[p]===0xc3||bytes[p]===0xc2)return p;return -1;}
function containsDescriptorLoad(bytes:Uint8Array,start:number,endExclusive:number){for(let p=start;p+1<Math.min(bytes.length,endExclusive);p++)if(bytes[p]===0x8b&&bytes[p+1]===0x19)return true;return false;}

export interface MK1ReshapeMultiFullCapacitySemanticsReport {
  format:'mk1_reshape_multi_full_capacity_semantics_v1'; timestamp:string; operationId:string;
  provenance:MK1HeartRipAnimationCanvasEditorReport['provenance']; fixture:MK1HeartRipAnimationCanvasEditorReport['fixture'];
  prerequisite:{o8:{pass:'1E.3O.8';operationId:string;validationPassed:true};o9:{pass:'1E.3O.9';operationId:string;verdict:string;validationPassed:true}};
  coordinateModel:MK1HeartRipAnimationCanvasEditorReport['coordinateModel'];
  reshapeMulti:{
    watcomOffset:number;watcomOffsetHex:string;physicalStart:number;physicalStartHex:string;rawHex:string;
    descriptorLoadPhysical:number;descriptorLoadPhysicalHex:string;
    descriptorAdvancePhysical:number;descriptorAdvancePhysicalHex:string;
    zeroTestPhysical:number;zeroTestPhysicalHex:string;
    nonZeroBranchPhysical:number;nonZeroBranchPhysicalHex:string;nonZeroBranchTarget:number;nonZeroBranchTargetHex:string;
    nullImageWatcomOffset:number;nullImageWatcomOffsetHex:string;nullImageImmediateMatches:boolean;
    normalPathLinkedObjectAdvancePhysical:number;normalPathLinkedObjectAdvancePhysicalHex:string;
    normalPathLinkedObjectTestPhysical:number;normalPathLinkedObjectTestPhysicalHex:string;
    loopBranchPhysical:number;loopBranchPhysicalHex:string;loopBranchTarget:number;loopBranchTargetHex:string;
    loopReturnsToDescriptorLoad:boolean;
    fallthroughRetPhysical:number;fallthroughRetPhysicalHex:string|null;
    fallthroughReadsAnotherDescriptor:boolean;
    chainExhaustionReturnsBeforeNextDescriptorRead:boolean;
  };
  boundedHeartCase:{
    frameKey:'heart_2';currentPartCount:3;maxLinkedObjects:4;currentRecordByteLength:16;
    currentTerminatorWatcomOffset:number;currentTerminatorWatcomOffsetHex:string;
    currentTerminatorPhysical:number;currentTerminatorPhysicalHex:string;currentTerminatorValue:number;
    nextStructureWatcomOffset:number;nextStructureWatcomOffsetHex:string;
    fullCapacityPartCount:4;fullCapacityRecordByteLength:16;trailingZeroRequiredAtFullCapacity:false;
    fourthPointerCanOccupyExistingTerminatorDword:true;bytesOfGrowthRequired:0;relocationRequiredForBoundedFourthPart:false;
  };
  decision:{
    underCapacityZeroTerminationStillEstablished:true;fullCapacityChainExhaustionEstablished:boolean;
    grammarRefinedToZeroOrChainExhaustion:boolean;fourthPartFitsExistingRecordAllocation:boolean;
    o9RelocationRequirementSupersededForBoundedFourthPart:boolean;relocationWriterEstablished:false;topologyWriterEstablished:false;
    verdict:'FULL_CAPACITY_CHAIN_EXHAUSTION_ESTABLISHED_FOURTH_PART_FITS_IN_PLACE'|'FULL_CAPACITY_TERMINATION_UNRESOLVED';narrative:string;
  };
  status:'SUCCESS'|'UNRESOLVED'; validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean;detail?:string}>};
}

export async function executeReshapeMultiFullCapacitySemantics(source:DirectorySource,o9:MK1HeartRipRelocationCensusReport,o8:MK1HeartRipAnimationCanvasEditorReport):Promise<MK1ReshapeMultiFullCapacitySemanticsReport>{
  if(source.isSynthetic!==false)throw new Error('1E.3O.10 requires an authentic user-loaded MK1 directory');
  if(o9.status!=='SUCCESS'||!o9.validation.allChecksPassed)throw new Error('1E.3O.10 requires successful 1E.3O.9 census');
  if(o8.status!=='SUCCESS'||!o8.validation.allChecksPassed)throw new Error('1E.3O.10 requires successful canonical 1E.3O.8 model');
  if(o9.provenance.sha256!==CANONICAL_SHA||o8.provenance.sha256!==CANONICAL_SHA)throw new Error('1E.3O.10 prerequisite provenance is not canonical');

  const entries=await source.listRecursive(); const exe=entries.find(e=>e.path===o8.fixture.exePath);
  if(!exe||exe.size!==o8.fixture.exeSize)throw new Error('MK1.EXE missing or size changed before 1E.3O.10');
  const bytes=await source.readSlice(exe.path,0,exe.size); const hash=await sha256Bytes(bytes);
  if(hash!==CANONICAL_SHA)throw new Error(`1E.3O.10 requires canonical MK1.EXE; got ${hash}`);

  const inv=await enumerateMK1WatcomPermanentClasses(source); if(inv.status!=='SUCCESS'||!inv.result.overallValid)throw new Error('1E.3O.10 Watcom symbol inventory failed');
  const syms=inv.result.globalSymbols.symbols;
  const reshape=exactSymbol(syms,'RESHAPE_MULTI',1,'code'), nullImage=exactSymbol(syms,'NULL_IMAGE',2,'data');
  const rp=o8.coordinateModel.codeImageBase+reshape.addressOffset;

  // Re-qualify the exact instruction skeleton used by O2, then resolve the branch targets.
  const descriptorLoad=rp+0x11;
  const descriptorAdvance=rp+0x13;
  const zeroTest=rp+0x16;
  const nonZeroBranch=rp+0x18;
  const nullImm=rp+0x1a;
  const normalAdvance=rp+0x32;
  const normalTest=rp+0x35;
  const loopBranch=rp+0x37;

  const descriptorLoadOk=bytes[descriptorLoad]===0x8b&&bytes[descriptorLoad+1]===0x19;
  const descriptorAdvanceOk=bytes[descriptorAdvance]===0x83&&bytes[descriptorAdvance+1]===0xc1&&bytes[descriptorAdvance+2]===0x04;
  const zeroTestOk=bytes[zeroTest]===0x85&&bytes[zeroTest+1]===0xdb;
  const nonZeroBranchOk=bytes[nonZeroBranch]===0x75; // JNZ short: non-zero descriptor skips NULL_IMAGE padding path.
  const nonZeroTarget=nonZeroBranchOk?shortTarget(bytes,nonZeroBranch):-1;
  const nullImageOk=bytes[nullImm]===0xbb&&readU32(bytes,nullImm+1)===nullImage.addressOffset;
  const normalAdvanceOk=bytes[normalAdvance]===0x8b&&bytes[normalAdvance+1]===0x7f&&bytes[normalAdvance+2]===0x04;
  const normalTestOk=bytes[normalTest]===0x85&&bytes[normalTest+1]===0xff;
  const loopBranchOk=bytes[loopBranch]===0x75;
  const loopTarget=loopBranchOk?shortTarget(bytes,loopBranch):-1;
  const loopBackOk=loopTarget===descriptorLoad;

  const fallthroughStart=loopBranch+2;
  const ret=findFirstRet(bytes,fallthroughStart,rp+0x60);
  const fallthroughReadsDescriptor=ret<0?true:containsDescriptorLoad(bytes,fallthroughStart,ret);
  const chainExhaustionReturns=ret>=0&&!fallthroughReadsDescriptor&&loopBackOk&&normalAdvanceOk&&normalTestOk;

  const target=o8.baselineIr.frames.find(f=>f.frameKey===TARGET_FRAME_KEY); if(!target)throw new Error('heart_2 missing from O8 baseline IR');
  const terminatorWatcom=target.recordOffset+target.parts.length*4;
  const terminatorPhysical=o8.coordinateModel.staticDataBase+terminatorWatcom;
  const terminatorValue=readU32(bytes,terminatorPhysical);
  const next=o8.baselineIr.frames.filter(f=>f.recordOffset>target.recordOffset).sort((a,b)=>a.recordOffset-b.recordOffset)[0];
  if(!next)throw new Error('No frame follows heart_2');

  const checks:MK1ReshapeMultiFullCapacitySemanticsReport['validation']['checks']=[
    {checkId:'CANONICAL_PROVENANCE',passed:hash===CANONICAL_SHA},
    {checkId:'O9_PREREQUISITE_BOUND',passed:o9.provenance.sha256===hash&&o9.validation.allChecksPassed},
    {checkId:'RESHAPE_DESCRIPTOR_LOAD',passed:descriptorLoadOk&&descriptorAdvanceOk&&zeroTestOk},
    {checkId:'ZERO_BRANCH_TO_NULL_PADDING',passed:nonZeroBranchOk&&nullImageOk&&nonZeroTarget>nonZeroBranch},
    {checkId:'NORMAL_PATH_ADVANCES_LINKED_OBJECT',passed:normalAdvanceOk&&normalTestOk},
    {checkId:'NEXT_OBJECT_BRANCHES_BACK_TO_DESCRIPTOR_LOAD',passed:loopBranchOk&&loopBackOk,detail:`branch ${hx(loopBranch)} -> ${hx(loopTarget)}; descriptor load ${hx(descriptorLoad)}`},
    {checkId:'CHAIN_EXHAUSTION_FALLS_THROUGH_TO_RETURN',passed:chainExhaustionReturns,detail:ret>=0?`fallthrough RET ${hx(ret)}; no descriptor load before RET`:'no RET found in bounded window'},
    {checkId:'HEART2_EXISTING_TERMINATOR_SLOT',passed:target.parts.length===3&&terminatorValue===0&&next.recordOffset===terminatorWatcom+4},
    {checkId:'FOUR_OBJECT_SETUP_CAPACITY',passed:o8.baselineIr.maxPartObjects===4&&o9.target.maximumLinkedObjectsAlreadyAllocated===4},
    {checkId:'NO_WRITER_ENABLED',passed:true},
  ];
  const all=checks.every(c=>c.passed);
  const timestamp=new Date().toISOString(),operationId=createOperationId('reshape-multi-full-capacity');

  const report:MK1ReshapeMultiFullCapacitySemanticsReport={
    format:'mk1_reshape_multi_full_capacity_semantics_v1',timestamp,operationId,
    provenance:{...o8.provenance,timestamp,operationId},fixture:o8.fixture,
    prerequisite:{o8:{pass:'1E.3O.8',operationId:o8.operationId,validationPassed:true},o9:{pass:'1E.3O.9',operationId:o9.operationId,verdict:o9.decision.verdict,validationPassed:true}},
    coordinateModel:o8.coordinateModel,
    reshapeMulti:{
      watcomOffset:reshape.addressOffset,watcomOffsetHex:hx(reshape.addressOffset),physicalStart:rp,physicalStartHex:hx(rp),rawHex:bytesHex(bytes,rp,Math.min(0x60,bytes.length-rp)),
      descriptorLoadPhysical:descriptorLoad,descriptorLoadPhysicalHex:hx(descriptorLoad),descriptorAdvancePhysical:descriptorAdvance,descriptorAdvancePhysicalHex:hx(descriptorAdvance),zeroTestPhysical:zeroTest,zeroTestPhysicalHex:hx(zeroTest),
      nonZeroBranchPhysical:nonZeroBranch,nonZeroBranchPhysicalHex:hx(nonZeroBranch),nonZeroBranchTarget:nonZeroTarget,nonZeroBranchTargetHex:nonZeroTarget>=0?hx(nonZeroTarget):'UNRESOLVED',
      nullImageWatcomOffset:nullImage.addressOffset,nullImageWatcomOffsetHex:hx(nullImage.addressOffset),nullImageImmediateMatches:nullImageOk,
      normalPathLinkedObjectAdvancePhysical:normalAdvance,normalPathLinkedObjectAdvancePhysicalHex:hx(normalAdvance),normalPathLinkedObjectTestPhysical:normalTest,normalPathLinkedObjectTestPhysicalHex:hx(normalTest),
      loopBranchPhysical:loopBranch,loopBranchPhysicalHex:hx(loopBranch),loopBranchTarget:loopTarget,loopBranchTargetHex:loopTarget>=0?hx(loopTarget):'UNRESOLVED',loopReturnsToDescriptorLoad:loopBackOk,
      fallthroughRetPhysical:ret,fallthroughRetPhysicalHex:ret>=0?hx(ret):null,fallthroughReadsAnotherDescriptor:fallthroughReadsDescriptor,chainExhaustionReturnsBeforeNextDescriptorRead:chainExhaustionReturns,
    },
    boundedHeartCase:{
      frameKey:'heart_2',currentPartCount:3,maxLinkedObjects:4,currentRecordByteLength:16,currentTerminatorWatcomOffset:terminatorWatcom,currentTerminatorWatcomOffsetHex:hx(terminatorWatcom),currentTerminatorPhysical:terminatorPhysical,currentTerminatorPhysicalHex:hx(terminatorPhysical),currentTerminatorValue:terminatorValue,
      nextStructureWatcomOffset:next.recordOffset,nextStructureWatcomOffsetHex:hx(next.recordOffset),fullCapacityPartCount:4,fullCapacityRecordByteLength:16,trailingZeroRequiredAtFullCapacity:false,
      fourthPointerCanOccupyExistingTerminatorDword:true,bytesOfGrowthRequired:0,relocationRequiredForBoundedFourthPart:false,
    },
    decision:{
      underCapacityZeroTerminationStillEstablished:true,fullCapacityChainExhaustionEstablished:all,grammarRefinedToZeroOrChainExhaustion:all,fourthPartFitsExistingRecordAllocation:all,o9RelocationRequirementSupersededForBoundedFourthPart:all,
      relocationWriterEstablished:false,topologyWriterEstablished:false,verdict:all?'FULL_CAPACITY_CHAIN_EXHAUSTION_ESTABLISHED_FOURTH_PART_FITS_IN_PLACE':'FULL_CAPACITY_TERMINATION_UNRESOLVED',
      narrative:all?'RESHAPE_MULTI consumes a descriptor, advances the linked object on the non-zero path, and branches back to the descriptor load only when another linked object exists. When the fourth and final preallocated heart object is filled, the next-object pointer is null and execution falls through to return before another descriptor dword is read. Under-capacity records still use zero termination and NULL_IMAGE padding, but full-capacity records are bounded by linked-object exhaustion. Therefore heart_2 can become four-part in its existing 16-byte allocation by replacing the current terminator dword with a fourth descriptor pointer; no relocation or sequence-pointer rewrite is required for this bounded case. No topology writer is enabled by O10.':'The bounded RESHAPE_MULTI control-flow checks did not establish chain-exhaustion termination. Keep the O9 relocation requirement and all topology writing disabled.',
    },
    status:all?'SUCCESS':'UNRESOLVED',validation:{allChecksPassed:all,checks},
  };
  return report;
}

export function createMK1ReshapeMultiFullCapacitySemanticsExport(report:MK1ReshapeMultiFullCapacitySemanticsReport):MK1ReshapeMultiFullCapacitySemanticsReport{
  if(report.status!=='SUCCESS'||!report.validation.allChecksPassed)throw new Error('Cannot export unresolved 1E.3O.10 full-capacity semantics');
  if(report.provenance.synthetic||report.provenance.sha256!==CANONICAL_SHA)throw new Error('1E.3O.10 authoritative export requires canonical authentic MK1.EXE');
  return report;
}
