/**
 * MK1 Kano animation-table exportability census — Pass 1E.3O.16.
 *
 * Export-first, read-only research pass. It does not write the executable and does
 * not claim to enumerate every Kano animation substream in the game.
 *
 * Bounded questions:
 *  - What is the exact KANO_ANITAB storage span in the canonical MK1 executable?
 *  - Which table cells are compatible with the already-qualified DO_NEXT_A9_FRAME
 *    bytecode grammar, direct sprite descriptors, zeros, or small sentinels?
 *  - For grammar-compatible streams, can every frame target be resolved structurally
 *    to either a WITH_XY descriptor or a zero-terminated descriptor-pointer vector?
 *  - Which resources/descriptors/aliases are implicated, and which structures are
 *    already suitable for reconstruction/export without pretending that structural
 *    compatibility is the same as runtime consumer qualification?
 *
 * Important restraint:
 *  - KANO_ANITAB is not promoted to the complete Kano animation universe. O14 already
 *    proves an off-table BEAT_LOOP substream for the heart-rip fixture.
 *  - A repeated [descriptor...,0] shape is reported as structurally exportable and
 *    CORROBORATED, not as independently runtime-verified for every table index.
 *  - Small scalar values (including 1) are not guessed into semantics.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { WatcomGlobalSymbol } from '../../../core/executable/watcomDebug/watcomPermanentClassTypes';
import { enumerateMK1WatcomPermanentClasses } from './watcomPermanentClassInventory';
import { reconstructMK1HandleTable } from './handleTableProbe';
import { probeMK1ExecutableLayout } from './executableLayoutProbe';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1HeartRipFullFixedLayoutCompositionEditorReport } from './heartRipFullFixedLayoutCompositionEditor';

const CANONICAL_SHA='750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const CODE_BASE=0x00050A54;
const EXPECTED_STATIC_DATA_BASE=0x0008CA54;
const MAX_VECTOR_PART_PROBE=16;
const MAX_STREAM_INSTRUCTIONS=512;

function hx(v:number):string{return `0x${(v>>>0).toString(16).padStart(8,'0').toUpperCase()}`;}
function readU16(b:Uint8Array,p:number){if(p<0||p+2>b.length)throw new Error(`u16 out of range ${hx(p)}`);return b[p]|b[p+1]<<8;}
function readI16(b:Uint8Array,p:number){const v=readU16(b,p);return v&0x8000?v-0x10000:v;}
function readU32(b:Uint8Array,p:number){if(p<0||p+4>b.length)throw new Error(`u32 out of range ${hx(p)}`);return(b[p]|b[p+1]<<8|b[p+2]<<16|b[p+3]<<24)>>>0;}
function readI32(b:Uint8Array,p:number){return readU32(b,p)|0;}
function rel32Target(b:Uint8Array,p:number){return p+5+readI32(b,p+1);}
function shortTarget(b:Uint8Array,p:number){return p+2+(b[p+1]<<24>>24);}

function exactSymbol(symbols:readonly WatcomGlobalSymbol[],name:string,segment:number,kind:'code'|'data'){
  const m=symbols.filter(s=>s.valid&&s.name===name&&s.segment===segment&&(kind==='code'?s.kindBits.isCode:s.kindBits.isData));
  if(m.length!==1)throw new Error(`O16 requires exactly one ${kind} symbol ${name}; found ${m.length}`);
  return m[0];
}

export type O16Confidence='VERIFIED'|'CORROBORATED'|'INFERRED'|'UNKNOWN';
export type O16TableEntryClass=
  |'ANIMATION_STREAM_DESCRIPTOR_VECTOR'
  |'ANIMATION_STREAM_DIRECT_DESCRIPTOR'
  |'ANIMATION_STREAM_CONTROL_ONLY'
  |'DIRECT_DESCRIPTOR_TABLE_ENTRY'
  |'ZERO_OR_UNASSIGNED_SLOT'
  |'SMALL_SCALAR_SENTINEL_UNKNOWN'
  |'UNRESOLVED';

export type O16StreamEvent =
  |{kind:'frame';watcomOffset:number;watcomOffsetHex:string;frameTargetWatcomOffset:number;frameTargetWatcomOffsetHex:string;noSleep:false}
  |{kind:'frame';watcomOffset:number;watcomOffsetHex:string;frameTargetWatcomOffset:number;frameTargetWatcomOffsetHex:string;noSleep:true}
  |{kind:'jump';watcomOffset:number;watcomOffsetHex:string;targetWatcomOffset:number;targetWatcomOffsetHex:string}
  |{kind:'flip-multi';watcomOffset:number;watcomOffsetHex:string}
  |{kind:'adjust-x';watcomOffset:number;watcomOffsetHex:string;x:number}
  |{kind:'adjust-xy';watcomOffset:number;watcomOffsetHex:string;x:number;y:number}
  |{kind:'callback';watcomOffset:number;watcomOffsetHex:string;callbackWatcomOffset:number;callbackWatcomOffsetHex:string;exactCodeSymbol:string|null}
  |{kind:'end';watcomOffset:number;watcomOffsetHex:string};

export interface O16Descriptor {
  watcomOffset:number;watcomOffsetHex:string;physicalStart:number;physicalStartHex:string;
  width:number;height:number;x:number;y:number;packedReference:number;packedReferenceHex:string;
  fileId:number;graOffset:number;graOffsetHex:string;resourcePath:string;resourceSize:number;
  confidence:'CORROBORATED';
}

export interface O16FrameTarget {
  watcomOffset:number;watcomOffsetHex:string;physicalStart:number;physicalStartHex:string;
  mode:'ZERO_TERMINATED_DESCRIPTOR_VECTOR'|'DIRECT_WITH_XY_DESCRIPTOR';
  descriptorOffsets:number[];descriptorOffsetsHex:string[];partCount:number;
  zeroTerminated:boolean;resourcePaths:string[];crossResourceComposition:boolean;
  confidence:O16Confidence;knownFixture:string|null;
}

export interface O16Stream {
  watcomOffset:number;watcomOffsetHex:string;physicalStart:number;physicalStartHex:string;
  termination:'END'|'LOOP';loopTargetWatcomOffset:number|null;loopTargetWatcomOffsetHex:string|null;
  events:O16StreamEvent[];frameTargetOffsets:number[];frameTargetOffsetsHex:string[];
  frameTargetMode:'DESCRIPTOR_VECTOR'|'DIRECT_DESCRIPTOR'|'CONTROL_ONLY';
  resourcePaths:string[];confidence:O16Confidence;
}

export interface O16TableEntry {
  index:number;cellWatcomOffset:number;cellWatcomOffsetHex:string;cellPhysical:number;cellPhysicalHex:string;
  rawValue:number;rawValueHex:string;classification:O16TableEntryClass;confidence:O16Confidence;
  streamWatcomOffset:number|null;descriptorWatcomOffset:number|null;
  resourcePaths:string[];knownFixture:string|null;
}

export interface MK1KanoAnimationExportabilityCensusReport {
  format:'mk1_kano_animation_exportability_census_v1';timestamp:string;operationId:string;
  provenance:{sourceKind:'user-loaded-directory';fileName:string;byteLength:number;sha256:string;synthetic:false;artifactGeneratedByTest:false;timestamp:string;operationId:string};
  fixture:{exePath:string;exeSize:number;exeSizeHex:string};
  coordinateModel:{codeImageBase:number;codeImageBaseHex:string;staticDataBase:number;staticDataBaseHex:string;staticDataBaseDerivation:string;fileBackedStaticDataEndWatcomOffset:number;fileBackedStaticDataEndWatcomOffsetHex:string};
  commandGrammar:{verifiedAgainstCanonicalExecutable:boolean;commandTableWatcomOffset:number;commandTableWatcomOffsetHex:string;allSixHandlersVerified:boolean;directFrameRuleVerified:boolean;terminatorRuleVerified:boolean;callbackTargetsRequireCodeRange:true};
  table:{symbol:'KANO_ANITAB';moduleName:string;watcomStart:number;watcomStartHex:string;physicalStart:number;physicalStartHex:string;nextDataSymbol:string;nextDataSymbolWatcomOffset:number;nextDataSymbolWatcomOffsetHex:string;byteLength:number;entryCount:number;dwordAligned:true};
  tableEntries:O16TableEntry[];
  streams:O16Stream[];
  frameTargets:O16FrameTarget[];
  descriptors:O16Descriptor[];
  aliases:{tablePayloadAliases:Array<{rawValue:number;rawValueHex:string;indices:number[]}>;sharedFrameTargetCount:number;sharedDescriptorCount:number};
  resourceSummary:Array<{fileId:number;path:string;descriptorCount:number}>;
  multiPartCandidates:Array<{frameTargetWatcomOffset:number;frameTargetWatcomOffsetHex:string;partCount:number;tableIndices:number[];resourcePaths:string[];knownFixture:string|null;confidence:O16Confidence}>;
  knownOffTableSubstreams:Array<{name:string;watcomOffset:number;watcomOffsetHex:string;frameRecordRefs:number[];frameRecordRefsHex:string[];source:'O14_VERIFIED_FIXTURE';note:string}>;
  summary:{tableCellCount:number;fullyClassifiedCellCount:number;unresolvedCellCount:number;streamCellCount:number;uniqueStreamCount:number;vectorStreamCellCount:number;directDescriptorStreamCellCount:number;controlOnlyStreamCellCount:number;directDescriptorTableCellCount:number;zeroCellCount:number;smallScalarCellCount:number;uniqueFrameTargetCount:number;vectorFrameTargetCount:number;directDescriptorFrameTargetCount:number;uniqueDescriptorCount:number;onePartVectorTargetCount:number;twoPartVectorTargetCount:number;threePartVectorTargetCount:number;endTerminatedUniqueStreamCount:number;loopingUniqueStreamCount:number;crossResourceStreamCellIndices:number[]};
  decision:{kanoAnitabExtentEstablished:boolean;allTableCellsStructurallyClassified:boolean;knownAnimationCommandGrammarReproduced:boolean;allGrammarCompatibleFrameTargetsResolved:boolean;heartRipIndex67MatchesVerifiedFixture:boolean;kanoAnimationUniverseFullyEnumerated:false;assetExportPlannerFootholdEstablished:boolean;genericMK1AnimationGrammarEstablished:false;mk2Mk3GeneralizationEstablished:false;verdict:'KANO_ANITAB_EXPORTABILITY_CENSUS_ESTABLISHED';narrative:string};
  status:'SUCCESS';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean;detail?:string}>};
}

interface HandleInfo{fileId:number;path:string;size:number;}
interface ParsedDescriptor{descriptor:O16Descriptor;}
interface ParsedFrameTarget{target:O16FrameTarget;}
interface ParsedStream{stream:O16Stream;}

export async function executeKanoAnimationExportabilityCensus(
  source:DirectorySource,
  o14:MK1HeartRipFullFixedLayoutCompositionEditorReport,
):Promise<MK1KanoAnimationExportabilityCensusReport>{
  if(source.isSynthetic!==false)throw new Error('1E.3O.16 requires an authentic user-loaded MK1 directory source');
  const entries=await source.listRecursive();
  const exeEntry=entries.find(e=>e.path.toUpperCase()==='MK1.EXE'||e.name.toUpperCase()==='MK1.EXE');
  if(!exeEntry)throw new Error('MK1.EXE not found for O16');
  const bytes=await source.readSlice(exeEntry.path,0,exeEntry.size);
  if(bytes.length!==exeEntry.size)throw new Error('O16 could not read complete MK1.EXE');
  const hash=await sha256Bytes(bytes);if(hash!==CANONICAL_SHA)throw new Error(`O16 requires canonical MK1.EXE; got ${hash}`);

  const watcom=await enumerateMK1WatcomPermanentClasses(source,{exePath:exeEntry.path});
  if(watcom.status!=='SUCCESS'||!watcom.result.overallValid||watcom.provenance.sha256!==CANONICAL_SHA)throw new Error('O16 Watcom inventory failed');
  const symbols=watcom.result.globalSymbols.symbols;
  const kanoTab=exactSymbol(symbols,'KANO_ANITAB',2,'data');
  const handleSym=exactSymbol(symbols,'_handleTable',2,'data');

  const handles=await reconstructMK1HandleTable(source,{exePath:exeEntry.path});
  if(handles.entries.length!==58)throw new Error(`O16 requires the verified 58-entry MK1 handle table; got ${handles.entries.length}`);
  const dataBase=handles.table.startOffset-handleSym.addressOffset;
  if(dataBase!==EXPECTED_STATIC_DATA_BASE)throw new Error(`O16 static-data base mismatch: ${hx(dataBase)}`);
  const handleById=new Map<number,HandleInfo>();
  for(const h of handles.entries){handleById.set(h.fileId,{fileId:h.fileId,path:h.resolvedPath??h.exeFilenameString?.replace(/\\/g,'/')??`FILE_ID_${h.fileId}`,size:h.fileSize});}

  const layout=await probeMK1ExecutableLayout(source,{exePath:exeEntry.path});
  if(!layout.parsedHeader||!layout.validation?.isValid)throw new Error('O16 LE layout validation failed');
  const object2=layout.topology.regions.filter(r=>r.regionClass==='le-object-file-backed'&&r.objectNumber===2);
  if(!object2.length)throw new Error('O16 could not locate file-backed LE Object 2');
  const maxObject2End=Math.max(...object2.map(r=>r.fileEnd));
  const fileBackedEndWatcom=maxObject2End-dataBase;

  // Re-verify the already-qualified compact animation command grammar against the same canonical bytes.
  const doNext=exactSymbol(symbols,'DO_NEXT_A9_FRAME',1,'code');
  const flipMulti=exactSymbol(symbols,'FLIP_MULTI',1,'code');
  const multiAdjust=exactSymbol(symbols,'MULTI_ADJUST_XY',1,'code');
  const a9=exactSymbol(symbols,'A9',2,'data');
  const doP=CODE_BASE+doNext.addressOffset,flipP=CODE_BASE+flipMulti.addressOffset,adjustP=CODE_BASE+multiAdjust.addressOffset;
  if(!(bytes[doP]===0x8b&&bytes[doP+1]===0x15&&readU32(bytes,doP+2)===a9.addressOffset))throw new Error('O16 DO_NEXT_A9_FRAME anchor changed');
  let commandTable:number|null=null;for(let p=doP;p<doP+64;p++)if(bytes[p]===0xff&&bytes[p+1]===0x24&&bytes[p+2]===0x9d){commandTable=readU32(bytes,p+3);break;}
  if(commandTable===null)throw new Error('O16 animation command table not found');
  const tableP=dataBase+commandTable;const ho=Array.from({length:6},(_,i)=>readU32(bytes,tableP+i*4));const hp=ho.map(o=>CODE_BASE+o);const[h1,h2,h3,h4,h5,h6]=hp;
  const c1=bytes[h1]===0x8b&&bytes[h1+1]===0x15&&readU32(bytes,h1+2)===a9.addressOffset&&bytes[h1+6]===0x8b&&bytes[h1+7]===0x02&&bytes[h1+8]===0xa3&&readU32(bytes,h1+9)===a9.addressOffset&&bytes[h1+13]===0xeb&&shortTarget(bytes,h1+13)===doP;
  const c2=bytes[h2]===0xe8&&rel32Target(bytes,h2)===flipP&&bytes[h2+5]===0xeb&&shortTarget(bytes,h2+5)===doP;
  const c3=bytes[h3]===0x8b&&bytes[h3+1]===0x15&&readU32(bytes,h3+2)===a9.addressOffset&&bytes[h3+6]===0x0f&&bytes[h3+7]===0xbf&&bytes[h3+8]===0x02&&bytes[h3+9]===0x83&&bytes[h3+10]===0x05&&readU32(bytes,h3+11)===a9.addressOffset&&bytes[h3+15]===0x02&&bytes[h3+16]===0x33&&bytes[h3+17]===0xdb&&bytes[h3+18]===0xe8&&rel32Target(bytes,h3+18)===adjustP;
  const c4=bytes[h4]===0x8b&&bytes[h4+1]===0x15&&readU32(bytes,h4+2)===a9.addressOffset&&bytes[h4+6]===0x0f&&bytes[h4+7]===0xbf&&bytes[h4+8]===0x02&&bytes[h4+9]===0x0f&&bytes[h4+10]===0xbf&&bytes[h4+11]===0x5a&&bytes[h4+12]===0x02&&bytes[h4+13]===0x83&&bytes[h4+14]===0x05&&readU32(bytes,h4+15)===a9.addressOffset&&bytes[h4+19]===0x04&&bytes[h4+20]===0xe8&&rel32Target(bytes,h4+20)===adjustP;
  const c5=bytes[h5]===0x8b&&bytes[h5+1]===0x15&&readU32(bytes,h5+2)===a9.addressOffset&&bytes[h5+6]===0x8b&&bytes[h5+7]===0x1a&&bytes[h5+8]===0x83&&bytes[h5+9]===0x05&&readU32(bytes,h5+10)===a9.addressOffset&&bytes[h5+14]===0x04&&bytes[h5+15]===0x89&&bytes[h5+16]===0x5f&&bytes[h5+17]===0x40&&bytes[h5+18]===0xf9&&bytes[h5+19]===0xc3;
  const c6=bytes[h6]===0x8b&&bytes[h6+1]===0x15&&readU32(bytes,h6+2)===a9.addressOffset&&bytes[h6+6]===0x83&&bytes[h6+7]===0x05&&readU32(bytes,h6+8)===a9.addressOffset&&bytes[h6+12]===0x04&&bytes[h6+13]===0xff&&bytes[h6+14]===0x12&&bytes[h6+15]===0xeb&&shortTarget(bytes,h6+15)===doP;
  const directRule=bytes[doP+0x13]===0x83&&bytes[doP+0x14]===0xfb&&bytes[doP+0x15]===0x06&&bytes[doP+0x18]===0x89&&bytes[doP+0x19]===0x5f&&bytes[doP+0x1a]===0x40&&bytes[doP+0x1b]===0xf8;
  const termRule=bytes[doP+0x0f]===0x85&&bytes[doP+0x10]===0xdb&&bytes[doP+0x11]===0x74;
  const grammarOk=c1&&c2&&c3&&c4&&c5&&c6&&directRule&&termRule;
  if(!grammarOk)throw new Error('O16 animation command grammar no longer matches qualified canonical shapes');

  const sameModuleData=symbols.filter(s=>s.valid&&s.segment===2&&s.kindBits.isData&&s.moduleIndex===kanoTab.moduleIndex&&s.addressOffset>kanoTab.addressOffset).sort((a,b)=>a.addressOffset-b.addressOffset);
  if(!sameModuleData.length)throw new Error('O16 cannot bound KANO_ANITAB by the next same-module DATA symbol');
  const next=sameModuleData[0];const tableBytes=next.addressOffset-kanoTab.addressOffset;
  if(tableBytes<=0||tableBytes%4!==0)throw new Error('KANO_ANITAB symbol span is not positive dword-aligned');
  const tableCount=tableBytes/4;const kanoPhysical=dataBase+kanoTab.addressOffset;

  const codeSymbolByOffset=new Map<number,string>();for(const s of symbols)if(s.valid&&s.segment===1&&s.kindBits.isCode&&!codeSymbolByOffset.has(s.addressOffset))codeSymbolByOffset.set(s.addressOffset,s.name);
  const codeMax=0x0003B2D5;
  const inFileData=(off:number,n=1)=>off>=0&&off+n<=fileBackedEndWatcom&&dataBase+off+n<=bytes.length;
  const descriptorCache=new Map<number,O16Descriptor|null>();
  const descriptor=(off:number):O16Descriptor|null=>{
    if(descriptorCache.has(off))return descriptorCache.get(off)!;
    if(!inFileData(off,12)){descriptorCache.set(off,null);return null;}
    const p=dataBase+off,width=readU16(bytes,p),height=readU16(bytes,p+2),x=readI16(bytes,p+4),y=readI16(bytes,p+6),packed=readU32(bytes,p+8),fileId=(packed>>>24)&255,graOffset=packed&0xffffff,h=handleById.get(fileId);
    if(!(width>0&&width<320&&height>0&&height<240&&x>=-256&&x<=256&&y>=-256&&y<=256&&h&&graOffset<h.size)){descriptorCache.set(off,null);return null;}
    const d:O16Descriptor={watcomOffset:off,watcomOffsetHex:hx(off),physicalStart:p,physicalStartHex:hx(p),width,height,x,y,packedReference:packed,packedReferenceHex:hx(packed),fileId,graOffset,graOffsetHex:hx(graOffset),resourcePath:h.path,resourceSize:h.size,confidence:'CORROBORATED'};
    descriptorCache.set(off,d);return d;
  };

  if(o14.status!=='SUCCESS'||!o14.validation.allChecksPassed||o14.provenance.sha256!==CANONICAL_SHA||o14.decision.verdict!=='FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING_ESTABLISHED')throw new Error('O16 requires the canonical successful O14 prerequisite');
  const knownHeartFrames=new Map<number,string>();
  let heartIndexMatch=false;
  for(const f of o14.frames)knownHeartFrames.set(f.recordWatcomOffset,`O14_${f.frameKey.toUpperCase()}`);

  const frameCache=new Map<number,O16FrameTarget|null>();
  const frameTarget=(off:number):O16FrameTarget|null=>{
    if(frameCache.has(off))return frameCache.get(off)!;
    const direct=descriptor(off);
    if(direct){
      const known=knownHeartFrames.get(off)??null;
      const t:O16FrameTarget={watcomOffset:off,watcomOffsetHex:hx(off),physicalStart:dataBase+off,physicalStartHex:hx(dataBase+off),mode:'DIRECT_WITH_XY_DESCRIPTOR',descriptorOffsets:[off],descriptorOffsetsHex:[hx(off)],partCount:1,zeroTerminated:false,resourcePaths:[direct.resourcePath],crossResourceComposition:false,confidence:known?'VERIFIED':'CORROBORATED',knownFixture:known};frameCache.set(off,t);return t;
    }
    if(!inFileData(off,4)){frameCache.set(off,null);return null;}
    const ds:number[]=[];let zero=false;
    for(let i=0;i<MAX_VECTOR_PART_PROBE;i++){
      const q=off+i*4;if(!inFileData(q,4))break;const v=readU32(bytes,dataBase+q);if(v===0){zero=true;break;}if(!descriptor(v)){frameCache.set(off,null);return null;}ds.push(v);
    }
    if(!zero||ds.length===0){frameCache.set(off,null);return null;}
    const resources=[...new Set(ds.map(d=>descriptor(d)!.resourcePath))];const known=knownHeartFrames.get(off)??null;
    const t:O16FrameTarget={watcomOffset:off,watcomOffsetHex:hx(off),physicalStart:dataBase+off,physicalStartHex:hx(dataBase+off),mode:'ZERO_TERMINATED_DESCRIPTOR_VECTOR',descriptorOffsets:ds,descriptorOffsetsHex:ds.map(hx),partCount:ds.length,zeroTerminated:true,resourcePaths:resources,crossResourceComposition:resources.length>1,confidence:known?'VERIFIED':'CORROBORATED',knownFixture:known};frameCache.set(off,t);return t;
  };

  const streamCache=new Map<number,O16Stream|null>();
  const stream=(start:number):O16Stream|null=>{
    if(streamCache.has(start))return streamCache.get(start)!;
    if(!inFileData(start,4)){streamCache.set(start,null);return null;}
    let cur=start;const seen=new Map<number,number>();const occupied:Array<{a:number;b:number}>=[];const ev:O16StreamEvent[]=[];let termination:'END'|'LOOP'|null=null,loopTarget:number|null=null;
    for(let guard=0;guard<MAX_STREAM_INSTRUCTIONS;guard++){
      if(seen.has(cur)){termination='LOOP';loopTarget=cur;break;}
      if(occupied.some(r=>r.a<cur&&cur<r.b)){streamCache.set(start,null);return null;}
      if(!inFileData(cur,4)){streamCache.set(start,null);return null;}
      const ep=cur,op=readU32(bytes,dataBase+cur);seen.set(cur,ev.length);
      if(op===0){occupied.push({a:ep,b:ep+4});ev.push({kind:'end',watcomOffset:ep,watcomOffsetHex:hx(ep)});termination='END';break;}
      if(op>6){occupied.push({a:ep,b:ep+4});ev.push({kind:'frame',watcomOffset:ep,watcomOffsetHex:hx(ep),frameTargetWatcomOffset:op,frameTargetWatcomOffsetHex:hx(op),noSleep:false});cur+=4;continue;}
      if(op===1){if(!inFileData(cur+4,4)){streamCache.set(start,null);return null;}const t=readU32(bytes,dataBase+cur+4);occupied.push({a:ep,b:ep+8});ev.push({kind:'jump',watcomOffset:ep,watcomOffsetHex:hx(ep),targetWatcomOffset:t,targetWatcomOffsetHex:hx(t)});cur=t;continue;}
      if(op===2){occupied.push({a:ep,b:ep+4});ev.push({kind:'flip-multi',watcomOffset:ep,watcomOffsetHex:hx(ep)});cur+=4;continue;}
      if(op===3){if(!inFileData(cur+4,2)){streamCache.set(start,null);return null;}const x=readI16(bytes,dataBase+cur+4);occupied.push({a:ep,b:ep+6});ev.push({kind:'adjust-x',watcomOffset:ep,watcomOffsetHex:hx(ep),x});cur+=6;continue;}
      if(op===4){if(!inFileData(cur+4,4)){streamCache.set(start,null);return null;}const x=readI16(bytes,dataBase+cur+4),y=readI16(bytes,dataBase+cur+6);occupied.push({a:ep,b:ep+8});ev.push({kind:'adjust-xy',watcomOffset:ep,watcomOffsetHex:hx(ep),x,y});cur+=8;continue;}
      if(op===5){if(!inFileData(cur+4,4)){streamCache.set(start,null);return null;}const t=readU32(bytes,dataBase+cur+4);occupied.push({a:ep,b:ep+8});ev.push({kind:'frame',watcomOffset:ep,watcomOffsetHex:hx(ep),frameTargetWatcomOffset:t,frameTargetWatcomOffsetHex:hx(t),noSleep:true});cur+=8;continue;}
      if(op===6){if(!inFileData(cur+4,4)){streamCache.set(start,null);return null;}const cb=readU32(bytes,dataBase+cur+4);if(cb>=codeMax){streamCache.set(start,null);return null;}occupied.push({a:ep,b:ep+8});ev.push({kind:'callback',watcomOffset:ep,watcomOffsetHex:hx(ep),callbackWatcomOffset:cb,callbackWatcomOffsetHex:hx(cb),exactCodeSymbol:codeSymbolByOffset.get(cb)??null});cur+=8;continue;}
    }
    if(!termination){streamCache.set(start,null);return null;}
    const foffs=ev.filter((e):e is Extract<O16StreamEvent,{kind:'frame'}>=>e.kind==='frame').map(e=>e.frameTargetWatcomOffset);
    const resolved=foffs.map(frameTarget);if(resolved.some(x=>x===null)){streamCache.set(start,null);return null;}
    const modes=[...new Set(resolved.map(x=>x!.mode))];if(modes.length>1){streamCache.set(start,null);return null;}
    const mode:O16Stream['frameTargetMode']=resolved.length===0?'CONTROL_ONLY':modes[0]==='DIRECT_WITH_XY_DESCRIPTOR'?'DIRECT_DESCRIPTOR':'DESCRIPTOR_VECTOR';
    const resources=[...new Set(resolved.flatMap(x=>x!.resourcePaths))].sort();
    const s:O16Stream={watcomOffset:start,watcomOffsetHex:hx(start),physicalStart:dataBase+start,physicalStartHex:hx(dataBase+start),termination,loopTargetWatcomOffset:loopTarget,loopTargetWatcomOffsetHex:loopTarget===null?null:hx(loopTarget),events:ev,frameTargetOffsets:[...new Set(foffs)],frameTargetOffsetsHex:[...new Set(foffs)].map(hx),frameTargetMode:mode,resourcePaths:resources,confidence:'CORROBORATED'};
    streamCache.set(start,s);return s;
  };

  const tableEntries:O16TableEntry[]=[];
  for(let i=0;i<tableCount;i++){
    const cellW=kanoTab.addressOffset+i*4,cellP=dataBase+cellW,v=readU32(bytes,cellP);let classification:O16TableEntryClass,confidence:O16Confidence,streamOff:number|null=null,descOff:number|null=null,resources:string[]=[],known:string|null=null;
    if(v===0){classification='ZERO_OR_UNASSIGNED_SLOT';confidence='UNKNOWN';}
    else if(v<=6){classification='SMALL_SCALAR_SENTINEL_UNKNOWN';confidence='UNKNOWN';}
    else{
      const s=stream(v);
      if(s){streamOff=v;resources=s.resourcePaths;if(s.frameTargetMode==='DESCRIPTOR_VECTOR')classification='ANIMATION_STREAM_DESCRIPTOR_VECTOR';else if(s.frameTargetMode==='DIRECT_DESCRIPTOR')classification='ANIMATION_STREAM_DIRECT_DESCRIPTOR';else classification='ANIMATION_STREAM_CONTROL_ONLY';confidence='CORROBORATED';}
      else{
        const d=descriptor(v);if(d){classification='DIRECT_DESCRIPTOR_TABLE_ENTRY';confidence='INFERRED';descOff=v;resources=[d.resourcePath];}else{classification='UNRESOLVED';confidence='UNKNOWN';}
      }
    }
    if(i===67){const expected=o14.baselineIr.tableBinding.targetSequenceRef;heartIndexMatch=v===expected&&o14.baselineIr.tableBinding.index===67;known=heartIndexMatch?'O14_KANO_HEART_RIP_PRIMARY':null;if(known)confidence='VERIFIED';}
    tableEntries.push({index:i,cellWatcomOffset:cellW,cellWatcomOffsetHex:hx(cellW),cellPhysical:cellP,cellPhysicalHex:hx(cellP),rawValue:v,rawValueHex:hx(v),classification,confidence,streamWatcomOffset:streamOff,descriptorWatcomOffset:descOff,resourcePaths:resources,knownFixture:known});
  }

  const streams=[...streamCache.values()].filter((x):x is O16Stream=>!!x).sort((a,b)=>a.watcomOffset-b.watcomOffset);
  const usedStreamStarts=new Set(tableEntries.map(e=>e.streamWatcomOffset).filter((x):x is number=>x!==null));
  const usedStreams=streams.filter(s=>usedStreamStarts.has(s.watcomOffset));
  const usedFrameOffsets=new Set(usedStreams.flatMap(s=>s.frameTargetOffsets));
  const frameTargets=[...usedFrameOffsets].map(o=>frameTarget(o)).filter((x):x is O16FrameTarget=>!!x).sort((a,b)=>a.watcomOffset-b.watcomOffset);
  const usedDescriptorOffsets=new Set<number>();for(const f of frameTargets)for(const d of f.descriptorOffsets)usedDescriptorOffsets.add(d);for(const e of tableEntries)if(e.descriptorWatcomOffset!==null)usedDescriptorOffsets.add(e.descriptorWatcomOffset);
  const descriptors=[...usedDescriptorOffsets].map(o=>descriptor(o)).filter((x):x is O16Descriptor=>!!x).sort((a,b)=>a.watcomOffset-b.watcomOffset);

  const payloadGroups=new Map<number,number[]>();for(const e of tableEntries){const a=payloadGroups.get(e.rawValue)??[];a.push(e.index);payloadGroups.set(e.rawValue,a);}const aliases=[...payloadGroups.entries()].filter(([v,idx])=>v!==0&&idx.length>1).map(([rawValue,indices])=>({rawValue,rawValueHex:hx(rawValue),indices}));
  const frameUses=new Map<number,number>();for(const s of usedStreams)for(const f of s.frameTargetOffsets)frameUses.set(f,(frameUses.get(f)??0)+1);
  const descUses=new Map<number,number>();for(const f of frameTargets)for(const d of f.descriptorOffsets)descUses.set(d,(descUses.get(d)??0)+1);for(const e of tableEntries)if(e.descriptorWatcomOffset!==null)descUses.set(e.descriptorWatcomOffset,(descUses.get(e.descriptorWatcomOffset)??0)+1);

  const resourceCounts=new Map<number,{fileId:number;path:string;descriptorCount:number}>();for(const d of descriptors){const r=resourceCounts.get(d.fileId)??{fileId:d.fileId,path:d.resourcePath,descriptorCount:0};r.descriptorCount++;resourceCounts.set(d.fileId,r);}
  const frameToIndices=new Map<number,Set<number>>();for(const e of tableEntries){if(e.streamWatcomOffset===null)continue;const s=stream(e.streamWatcomOffset);if(!s)continue;for(const f of s.frameTargetOffsets){const set=frameToIndices.get(f)??new Set<number>();set.add(e.index);frameToIndices.set(f,set);}}
  const multi=frameTargets.filter(f=>f.mode==='ZERO_TERMINATED_DESCRIPTOR_VECTOR'&&f.partCount>1).map(f=>({frameTargetWatcomOffset:f.watcomOffset,frameTargetWatcomOffsetHex:f.watcomOffsetHex,partCount:f.partCount,tableIndices:[...(frameToIndices.get(f.watcomOffset)??new Set<number>())].sort((a,b)=>a-b),resourcePaths:f.resourcePaths,knownFixture:f.knownFixture,confidence:f.confidence}));

  const knownOff:MK1KanoAnimationExportabilityCensusReport['knownOffTableSubstreams']=[];
  {const beat=o14.baselineIr.sequences.find(s=>s.name==='BEAT_LOOP');if(beat)knownOff.push({name:'BEAT_LOOP',watcomOffset:beat.offset,watcomOffsetHex:hx(beat.offset),frameRecordRefs:beat.frameRecordRefs,frameRecordRefsHex:beat.frameRecordRefs.map(hx),source:'O14_VERIFIED_FIXTURE',note:'Verified heart-rip substream not reached by the KANO_ANITAB[67] PRIMARY stream itself; proves the table census is not the complete Kano animation universe.'});}

  const count=(c:O16TableEntryClass)=>tableEntries.filter(e=>e.classification===c).length;
  const vectorFrames=frameTargets.filter(f=>f.mode==='ZERO_TERMINATED_DESCRIPTOR_VECTOR');
  const crossIndices=tableEntries.filter(e=>e.streamWatcomOffset!==null&&e.resourcePaths.length>1).map(e=>e.index);
  const summary:MK1KanoAnimationExportabilityCensusReport['summary']={tableCellCount:tableCount,fullyClassifiedCellCount:tableEntries.filter(e=>e.classification!=='UNRESOLVED').length,unresolvedCellCount:count('UNRESOLVED'),streamCellCount:count('ANIMATION_STREAM_DESCRIPTOR_VECTOR')+count('ANIMATION_STREAM_DIRECT_DESCRIPTOR')+count('ANIMATION_STREAM_CONTROL_ONLY'),uniqueStreamCount:usedStreams.length,vectorStreamCellCount:count('ANIMATION_STREAM_DESCRIPTOR_VECTOR'),directDescriptorStreamCellCount:count('ANIMATION_STREAM_DIRECT_DESCRIPTOR'),controlOnlyStreamCellCount:count('ANIMATION_STREAM_CONTROL_ONLY'),directDescriptorTableCellCount:count('DIRECT_DESCRIPTOR_TABLE_ENTRY'),zeroCellCount:count('ZERO_OR_UNASSIGNED_SLOT'),smallScalarCellCount:count('SMALL_SCALAR_SENTINEL_UNKNOWN'),uniqueFrameTargetCount:frameTargets.length,vectorFrameTargetCount:vectorFrames.length,directDescriptorFrameTargetCount:frameTargets.filter(f=>f.mode==='DIRECT_WITH_XY_DESCRIPTOR').length,uniqueDescriptorCount:descriptors.length,onePartVectorTargetCount:vectorFrames.filter(f=>f.partCount===1).length,twoPartVectorTargetCount:vectorFrames.filter(f=>f.partCount===2).length,threePartVectorTargetCount:vectorFrames.filter(f=>f.partCount===3).length,endTerminatedUniqueStreamCount:usedStreams.filter(s=>s.termination==='END').length,loopingUniqueStreamCount:usedStreams.filter(s=>s.termination==='LOOP').length,crossResourceStreamCellIndices:crossIndices};

  const fullyClassified=summary.unresolvedCellCount===0;
  const allFrameResolved=usedStreams.every(s=>s.events.filter(e=>e.kind==='frame').every(e=>frameTarget((e as Extract<O16StreamEvent,{kind:'frame'}>).frameTargetWatcomOffset)!==null));
  const checks=[
    {checkId:'CANONICAL_PROVENANCE',passed:hash===CANONICAL_SHA},
    {checkId:'STATIC_DATA_BASE_REDERIVED',passed:dataBase===EXPECTED_STATIC_DATA_BASE,detail:`base=${hx(dataBase)}`},
    {checkId:'ANIMATION_COMMAND_GRAMMAR_REPRODUCED',passed:grammarOk},
    {checkId:'KANO_ANITAB_SYMBOL_BOUNDED',passed:kanoTab.name==='KANO_ANITAB'&&next.addressOffset>kanoTab.addressOffset&&tableBytes%4===0,detail:`next=${next.name}, bytes=${tableBytes}, entries=${tableCount}`},
    {checkId:'ALL_TABLE_CELLS_CLASSIFIED',passed:fullyClassified,detail:`classified=${summary.fullyClassifiedCellCount}/${tableCount}`},
    {checkId:'ALL_STREAM_FRAME_TARGETS_RESOLVED',passed:allFrameResolved,detail:`uniqueTargets=${summary.uniqueFrameTargetCount}`},
    {checkId:'REPEATED_DESCRIPTOR_VECTOR_EVIDENCE',passed:summary.vectorFrameTargetCount>100&&summary.onePartVectorTargetCount>100},
    {checkId:'MULTI_PART_CANDIDATES_PRESENT',passed:summary.twoPartVectorTargetCount>=1&&summary.threePartVectorTargetCount>=1},
    {checkId:'O14_HEART_INDEX67_MATCH',passed:heartIndexMatch,detail:`match=${heartIndexMatch}`},
    {checkId:'SCOPE_BOUNDARY_PRESERVED',passed:true,detail:'KANO_ANITAB census is explicitly not the complete Kano animation universe and is not generalized to MK1/MK2/MK3.'},
  ];
  if(!checks.every(c=>c.passed))throw new Error(`O16 validation failed: ${checks.filter(c=>!c.passed).map(c=>c.checkId).join(', ')}`);

  const timestamp=new Date().toISOString(),operationId=createOperationId('kano-animation-exportability-census');
  return{format:'mk1_kano_animation_exportability_census_v1',timestamp,operationId,provenance:{sourceKind:'user-loaded-directory',fileName:exeEntry.name,byteLength:exeEntry.size,sha256:hash,synthetic:false,artifactGeneratedByTest:false,timestamp,operationId},fixture:{exePath:exeEntry.path,exeSize:exeEntry.size,exeSizeHex:hx(exeEntry.size)},coordinateModel:{codeImageBase:CODE_BASE,codeImageBaseHex:hx(CODE_BASE),staticDataBase:dataBase,staticDataBaseHex:hx(dataBase),staticDataBaseDerivation:`handleTable physical ${hx(handles.table.startOffset)} - Watcom _handleTable ${hx(handleSym.addressOffset)}`,fileBackedStaticDataEndWatcomOffset:fileBackedEndWatcom,fileBackedStaticDataEndWatcomOffsetHex:hx(fileBackedEndWatcom)},commandGrammar:{verifiedAgainstCanonicalExecutable:grammarOk,commandTableWatcomOffset:commandTable,commandTableWatcomOffsetHex:hx(commandTable),allSixHandlersVerified:c1&&c2&&c3&&c4&&c5&&c6,directFrameRuleVerified:directRule,terminatorRuleVerified:termRule,callbackTargetsRequireCodeRange:true},table:{symbol:'KANO_ANITAB',moduleName:kanoTab.resolvedModuleName??'KANO.ASM',watcomStart:kanoTab.addressOffset,watcomStartHex:hx(kanoTab.addressOffset),physicalStart:kanoPhysical,physicalStartHex:hx(kanoPhysical),nextDataSymbol:next.name,nextDataSymbolWatcomOffset:next.addressOffset,nextDataSymbolWatcomOffsetHex:hx(next.addressOffset),byteLength:tableBytes,entryCount:tableCount,dwordAligned:true},tableEntries,streams:usedStreams,frameTargets,descriptors,aliases:{tablePayloadAliases:aliases,sharedFrameTargetCount:[...frameUses.values()].filter(n=>n>1).length,sharedDescriptorCount:[...descUses.values()].filter(n=>n>1).length},resourceSummary:[...resourceCounts.values()].sort((a,b)=>a.fileId-b.fileId),multiPartCandidates:multi,knownOffTableSubstreams:knownOff,summary,decision:{kanoAnitabExtentEstablished:true,allTableCellsStructurallyClassified:fullyClassified,knownAnimationCommandGrammarReproduced:grammarOk,allGrammarCompatibleFrameTargetsResolved:allFrameResolved,heartRipIndex67MatchesVerifiedFixture:heartIndexMatch,kanoAnimationUniverseFullyEnumerated:false,assetExportPlannerFootholdEstablished:fullyClassified&&allFrameResolved,genericMK1AnimationGrammarEstablished:false,mk2Mk3GeneralizationEstablished:false,verdict:'KANO_ANITAB_EXPORTABILITY_CENSUS_ESTABLISHED',narrative:`KANO_ANITAB is bounded by Watcom symbols from ${hx(kanoTab.addressOffset)} to ${hx(next.addressOffset)} (${tableCount} dword cells). Every cell is structurally classified without guessing small scalar semantics. ${summary.streamCellCount} cells reference streams compatible with the independently rechecked 0..6 animation bytecode grammar; ${summary.vectorStreamCellCount} use zero-terminated descriptor-vector frame targets, ${summary.directDescriptorStreamCellCount} use direct WITH_XY descriptor targets, and ${summary.controlOnlyStreamCellCount} contain no image frame events. Across unique reachable streams, ${summary.uniqueFrameTargetCount} frame targets resolve to ${summary.vectorFrameTargetCount} descriptor vectors and ${summary.directDescriptorFrameTargetCount} direct descriptors, covering ${summary.uniqueDescriptorCount} unique sprite descriptors. Repetition includes ${summary.twoPartVectorTargetCount} two-part and ${summary.threePartVectorTargetCount} three-part vector records; the O14 heart-rip table index 67 is explicitly matched when that verified fixture is supplied. This establishes a practical export-planning map for KANO_ANITAB, not the complete Kano animation universe: O14's verified off-table BEAT_LOOP is retained as explicit counterevidence to such a generalization.`},status:'SUCCESS',validation:{allChecksPassed:true,checks}};
}

export function createMK1KanoAnimationExportabilityCensusExport(report:MK1KanoAnimationExportabilityCensusReport){
  if(report.status!=='SUCCESS'||!report.validation.allChecksPassed)throw new Error('O16 export blocked by incomplete validation');
  return report;
}
