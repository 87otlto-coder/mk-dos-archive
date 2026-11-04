/**
 * MK1 multi-part frame grammar + bounded lossless animation IR — Pass 1E.3O.2.
 *
 * Bounded purpose:
 *  - qualify INIT_MULTI / RESHAPE_MULTI / PRCDSP against the real executable;
 *  - use Kano's heart-rip animation as a genuine variable-part fixture;
 *  - prove zero-terminated descriptor-pointer frame records, including a 3-part frame;
 *  - decode the parts from GRAPHICS/MISC.GRA with BLOOD_P;
 *  - create and no-edit serialize a lossless IR for this bounded animation fixture.
 *
 * This pass does NOT yet encode uGRA pixels, relocate/resize binary regions, or claim a
 * generic writable compiler for every MK1 animation.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { WatcomGlobalSymbol } from '../../../core/executable/watcomDebug/watcomPermanentClassTypes';
import { enumerateMK1WatcomPermanentClasses } from './watcomPermanentClassInventory';
import { decodeUgraSprite } from '../graphics/ugraDecoder';
import { resolveMK1GraTarget } from './spriteDescriptorProbe';
import { createMK1AnimationStreamGroundTruthExport, MK1AnimationStreamGroundTruthReport } from './animationStreamGroundTruth';
import { sha256Bytes } from './paletteRoundTripCodec';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';

function hex(v: number): string { return `0x${(v >>> 0).toString(16).padStart(8, '0').toUpperCase()}`; }
function readU16(b: Uint8Array,o:number){ if(o<0||o+2>b.length)throw new Error(`u16 OOB ${hex(o)}`); return b[o]|(b[o+1]<<8); }
function readI16(b: Uint8Array,o:number){ const v=readU16(b,o); return v&0x8000?v-0x10000:v; }
function readU32(b: Uint8Array,o:number){ if(o<0||o+4>b.length)throw new Error(`u32 OOB ${hex(o)}`); return (b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0; }
function readI32(b: Uint8Array,o:number){ return readU32(b,o)|0; }
function rel32Target(b:Uint8Array,o:number){ if(b[o]!==0xe8&&b[o]!==0xe9)throw new Error(`rel32 expected ${hex(o)}`); return o+5+readI32(b,o+1); }
function bytesHex(b: Uint8Array): string { return Array.from(b).map(v=>v.toString(16).padStart(2,'0').toUpperCase()).join(' '); }
function writeU16(out:number[],v:number){ out.push(v&255,(v>>>8)&255); }
function writeI16(out:number[],v:number){ writeU16(out,v&0xffff); }
function writeU32(out:number[],v:number){ out.push(v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255); }
function exactSymbol(symbols:readonly WatcomGlobalSymbol[],name:string,segment:number,kind:'code'|'data'){
  const m=symbols.filter(s=>s.valid&&s.name===name&&s.segment===segment&&(kind==='code'?s.kindBits.isCode:s.kindBits.isData));
  if(m.length!==1)throw new Error(`1E.3O.2 requires exactly one ${kind} symbol ${name}; found ${m.length}`); return m[0];
}
function rgb15(value:number){ const mult=255/63; const r=Math.min(255,Math.max(0,Math.round(((((value>>9)&0x3f)|1)*mult)))); const g=Math.min(255,Math.max(0,Math.round(((((value>>4)&0x3f)|1)*mult)))); const b=Math.min(255,Math.max(0,Math.round(((((value<<1)&0x3f)|1)*mult)))); return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`.toUpperCase(); }
function parsePointerList(bytes:Uint8Array,physical:number,max=32){ const values:number[]=[]; let c=physical; for(let i=0;i<max;i++){ const v=readU32(bytes,c); c+=4; if(v===0)return {values,endPhysical:c,terminated:true}; values.push(v); } return {values,endPhysical:c,terminated:false}; }
function eqBytes(a:Uint8Array,b:Uint8Array){ if(a.length!==b.length)return false; for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false; return true; }

export interface MK1MultiPartPreviewPart { frameKey:string; partIndex:number; symbol:string; width:number;height:number;x:number;y:number;indices:Uint8Array;opaqueMask:Uint8Array; }
export interface MK1MultiPartFrameLosslessIrReport {
  format:'mk1_multi_part_frame_lossless_ir_v1'; timestamp:string; operationId:string;
  provenance: MK1AnimationStreamGroundTruthReport['provenance']; fixture: MK1AnimationStreamGroundTruthReport['fixture'];
  prerequisite:{pass:'1E.3O.1';operationId:string;verdict:'MORPH_ANIMATION_STREAM_AND_FRAME_COMPOSITION_ESTABLISHED';validationPassed:true};
  coordinateModel: MK1AnimationStreamGroundTruthReport['coordinateModel'];
  mechanics:{
    initMulti:{watcomOffset:number;physicalStart:number;a5WatcomOffset:number;zeroTerminatedSetupList:boolean;createsLinkedObjectPerDescriptor:boolean;firstDescriptorPaletteLinkAtPlus0C:boolean};
    reshapeMulti:{watcomOffset:number;physicalStart:number;readsFrameRecordFromObjectPlus40:boolean;mapsPointersByLinkedObjectIndex:boolean;zeroTerminatesRecord:boolean;padsRemainingObjectsWithNullImage:boolean;nullImageWatcomOffset:number};
    prcdsp:{watcomOffset:number;physicalStart:number;callsReshapeMultiForMasterList:boolean};
    insertMulti:{watcomOffset:number;physicalStart:number;callsInsobjPerLinkedObject:boolean;structuralRecordOrderIsObjectChainOrder:boolean;finalPixelZOrderNotPromoted:boolean};
  };
  fixtureRoute:{kanoDeathBlowPhysical:number;msuHeartWatcomOffset:number;maKheartWatcomOffset:number;kanoAnimationTableIndex:67;kanoAnimationTablePointerMatches:boolean;codeSetsA5ToMsuHeart:boolean;codeRequestsAnimationIndex67:boolean;codeUsesDoubleMframew:boolean;classification:'VERIFIED_KANO_HEART_MULTI_ANIMATION_ROUTE'};
  resource:{path:string;fileId:2;fileSize:number;fileSizeHex:string};
  palette:{symbol:'BLOOD_P';watcomOffset:number;declaredLength:number;colorWords15:number[];rgbHex:string[];linkedFromSetupDescriptor:boolean};
  setup:{symbol:'MSU_HEART';maxLinkedObjects:4;descriptorSymbols:string[];terminatorPresent:boolean;rawHex:string};
  sequences:Array<{name:'PRIMARY'|'BEAT_LOOP';watcomOffset:number;watcomOffsetHex:string;frameRecordOffsets:number[];frameRecordOffsetsHex:string[];terminatorPresent:boolean;rawHex:string}>;
  frameRecords:Array<{frameKey:string;watcomOffset:number;watcomOffsetHex:string;partDescriptorSymbols:string[];partDescriptorOffsets:number[];partDescriptorOffsetsHex:string[];partCount:number;terminatorPresent:boolean;rawHex:string;classification:'VERIFIED_MULTI_FRAME_RECORD'|'VERIFIED_SINGLE_PART_FRAME_RECORD'}>;
  descriptors:Array<{symbol:string;watcomOffset:number;watcomOffsetHex:string;width:number;height:number;x:number;y:number;packedReference:number;packedReferenceHex:string;fileId:number;graOffset:number;graOffsetHex:string;rawHex:string;decode:{success:boolean;checksum:string;encodedBytesConsumed:number;opaquePixelCount:number;minOpaqueIndex:number|null;maxOpaqueIndex:number|null;outOfPaletteRangeCount:number}}>;
  compositionFrames:Array<{frameKey:string;sequence:'PRIMARY'|'BEAT_LOOP';sequenceFrameIndex:number;recordWatcomOffset:number;partCount:number;bounds:{minX:number;minY:number;maxX:number;maxY:number;width:number;height:number;anchorCanvasX:number;anchorCanvasY:number}}>;
  ir:{
    format:'mk1_animation_ir_v1'; owner:'KANO'; semanticName:'HEART_RIP_MULTI'; sourceSha256:string; maxPartObjects:4;
    tableBinding:{tableSymbol:'KANO_ANITAB';tableWatcomOffset:number;index:67;targetSequenceRef:number;rawHex:string};
    setupList:{symbol:'MSU_HEART';offset:number;descriptorRefs:number[];terminator:0;rawHex:string};
    setupDescriptor:{symbol:'BIGBLD1';offset:number;width:number;height:number;x:number;y:number;packedReference:number;paletteRef:number;rawHex:string};
    sequences:Array<{name:'PRIMARY'|'BEAT_LOOP';offset:number;frameRecordRefs:number[];terminator:0;rawHex:string}>;
    frames:Array<{frameKey:string;recordOffset:number;parts:Array<{descriptorRef:number;descriptorSymbol:string;structuralIndex:number}>;terminator:0;rawHex:string}>;
    descriptors:Array<{symbol:string;offset:number;width:number;height:number;x:number;y:number;packedReference:number;rawHex:string}>;
    palette:{symbol:'BLOOD_P';offset:number;words15:number[];rawHex:string};
    preservation:{semanticRegionCount:number;unknownByteCount:0;rawProvenanceRetained:true;relocationSupported:false;ugraEncodingSupported:false};
  };
  roundTrip:{regions:Array<{name:string;physicalStart:number;byteLength:number;sourceHex:string;encodedHex:string;exactMatch:boolean}>;allRegionsExact:boolean;wholeExecutableMismatchCount:number;sourceSha256:string;rebuiltSha256:string;wholeExecutableHashExact:boolean};
  decision:{multiPartFrameGrammarEstablished:boolean;variablePartCountEstablished:boolean;nullPaddingBehaviorEstablished:boolean;boundedLosslessAnimationIrEstablished:boolean;boundedNoEditSerializerEstablished:boolean;genericWritableAnimationCompilerEstablished:false;ugraEncoderEstablished:false;verdict:'MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED'|'PARTIAL_MULTI_PART_MODEL';narrative:string};
  status:'SUCCESS'|'PARTIAL'; previewPayloads?:Map<string,MK1MultiPartPreviewPart[]>;
}

function encodePtrList(values:number[]){ const out:number[]=[]; values.forEach(v=>writeU32(out,v)); writeU32(out,0); return new Uint8Array(out); }
function encodeDescriptor(d:{width:number;height:number;x:number;y:number;packedReference:number}){ const o:number[]=[]; writeU16(o,d.width);writeU16(o,d.height);writeI16(o,d.x);writeI16(o,d.y);writeU32(o,d.packedReference);return new Uint8Array(o); }
function encodePalette(words:number[]){ const o:number[]=[];writeU16(o,words.length);words.forEach(v=>writeU16(o,v));return new Uint8Array(o); }
function encodePaletteLinkedDescriptor(d:{width:number;height:number;x:number;y:number;packedReference:number;paletteRef:number}){ const o=Array.from(encodeDescriptor(d));writeU32(o,d.paletteRef);return new Uint8Array(o); }

export interface MK1BoundedAnimationIrRegion { name:string; physicalStart:number; encoded:Uint8Array; }
export function serializeMK1BoundedAnimationIr(ir:MK1MultiPartFrameLosslessIrReport['ir'],staticDataBase:number):MK1BoundedAnimationIrRegion[]{
  const regions:MK1BoundedAnimationIrRegion[]=[];
  const add=(name:string,watcomOffset:number,encoded:Uint8Array)=>regions.push({name,physicalStart:staticDataBase+watcomOffset,encoded});
  const table:number[]=[]; writeU32(table,ir.tableBinding.targetSequenceRef);
  add(`KANO_ANITAB[${ir.tableBinding.index}]`,ir.tableBinding.tableWatcomOffset+ir.tableBinding.index*4,new Uint8Array(table));
  for(const sequence of ir.sequences)add(`MA_KHEART_${sequence.name}`,sequence.offset,encodePtrList(sequence.frameRecordRefs));
  for(const frame of ir.frames)add(`FRAME_${hex(frame.recordOffset)}`,frame.recordOffset,encodePtrList(frame.parts.map(p=>p.descriptorRef)));
  add(ir.setupList.symbol,ir.setupList.offset,encodePtrList(ir.setupList.descriptorRefs));
  add('BIGBLD1_SETUP_DESCRIPTOR',ir.setupDescriptor.offset,encodePaletteLinkedDescriptor(ir.setupDescriptor));
  for(const descriptor of ir.descriptors)add(`DESC_${descriptor.symbol}`,descriptor.offset,encodeDescriptor(descriptor));
  add(ir.palette.symbol,ir.palette.offset,encodePalette(ir.palette.words15));
  return regions;
}

export async function executeMultiPartFrameLosslessIr(source:DirectorySource,options:{animationReport:MK1AnimationStreamGroundTruthReport}):Promise<MK1MultiPartFrameLosslessIrReport>{
  if(source.isSynthetic!==false)throw new Error('1E.3O.2 requires an authentic user-loaded MK1 directory');
  const prior=options.animationReport; await createMK1AnimationStreamGroundTruthExport(prior);
  if(prior.status!=='SUCCESS'||prior.decision.verdict!=='MORPH_ANIMATION_STREAM_AND_FRAME_COMPOSITION_ESTABLISHED')throw new Error('1E.3O.2 requires verified 1E.3O.1');
  const entries=await source.listRecursive(); const exe=entries.find(e=>e.path===prior.fixture.exePath); if(!exe||exe.size!==prior.fixture.exeSize)throw new Error('MK1.EXE changed since 1E.3O.1');
  const bytes=await source.readSlice(exe.path,0,exe.size); const sourceHash=await sha256Bytes(bytes); if(sourceHash!==prior.provenance.sha256)throw new Error('MK1.EXE SHA-256 changed since 1E.3O.1');
  const inv=await enumerateMK1WatcomPermanentClasses(source); if(inv.status!=='SUCCESS'||!inv.result.overallValid)throw new Error('Watcom symbol inventory failed'); const syms=inv.result.globalSymbols.symbols;
  const cb=prior.coordinateModel.codeImageBase, db=prior.coordinateModel.staticDataBase;
  const init=exactSymbol(syms,'INIT_MULTI',1,'code'), reshape=exactSymbol(syms,'RESHAPE_MULTI',1,'code'), prcdsp=exactSymbol(syms,'PRCDSP',1,'code'), insert=exactSymbol(syms,'INSERT_MULTI',1,'code'), insobj=exactSymbol(syms,'INSOBJ',1,'code');
  const death=exactSymbol(syms,'KANO_DEATH_BLOW',1,'code'), getAni=exactSymbol(syms,'GET_CHAR_ANI_A11',1,'code'), doubleM=exactSymbol(syms,'DOUBLE_MFRAMEW',1,'code');
  const A5=exactSymbol(syms,'A5',2,'data'), A11=exactSymbol(syms,'A11',2,'data'), nullImage=exactSymbol(syms,'NULL_IMAGE',2,'data');
  const msu=exactSymbol(syms,'MSU_HEART',2,'data'), ma=exactSymbol(syms,'MA_KHEART',2,'data'), kanoTab=exactSymbol(syms,'KANO_ANITAB',2,'data'), bigbld=exactSymbol(syms,'BIGBLD1',2,'data'), blood=exactSymbol(syms,'BLOOD_P',2,'data');
  const descNames=['KHEART1','KHEART2','KHEART3A','KHEART3B','KHEART3C','KHEART4','KHEART5A','KHEART5B','KHEART5C'] as const;
  const descSyms=descNames.map(n=>exactSymbol(syms,n,2,'data'));
  const ip=cb+init.addressOffset, rp=cb+reshape.addressOffset, pp=cb+prcdsp.addressOffset, inp=cb+insert.addressOffset, dp=cb+death.addressOffset;
  const initLoadsA5=bytes[ip]===0x51&&bytes[ip+1]===0x55&&bytes[ip+2]===0x56&&bytes[ip+3]===0x8b&&bytes[ip+4]===0x35&&readU32(bytes,ip+5)===A5.addressOffset;
  const initZeroTerminatedList=bytes[ip+0x10]===0x8b&&bytes[ip+0x11]===0x1e&&bytes[ip+0x12]===0x83&&bytes[ip+0x13]===0xc6&&bytes[ip+0x14]===0x04&&bytes[ip+0x15]===0x85&&bytes[ip+0x16]===0xdb&&bytes[ip+0x17]===0x74;
  const firstCreateCall=ip+0x23, secondCreateCall=ip+0x38;
  const initCreatesLinkedObjects=bytes[firstCreateCall]===0xe8&&bytes[secondCreateCall]===0xe8&&rel32Target(bytes,firstCreateCall)===rel32Target(bytes,secondCreateCall)&&bytes[ip+0x28]===0x89&&bytes[ip+0x29]===0x7d&&bytes[ip+0x2a]===0x04&&bytes[ip+0x3d]===0x89&&bytes[ip+0x3e]===0x7d&&bytes[ip+0x3f]===0x04;
  const initOk=initLoadsA5&&initZeroTerminatedList&&initCreatesLinkedObjects;
  const reshapeReadsFrameRecord=bytes[rp]===0x8b&&bytes[rp+1]===0x4f&&bytes[rp+2]===0x40;
  const reshapeSequentialPointers=bytes[rp+0x11]===0x8b&&bytes[rp+0x12]===0x19&&bytes[rp+0x13]===0x83&&bytes[rp+0x14]===0xc1&&bytes[rp+0x15]===0x04&&bytes[rp+0x16]===0x85&&bytes[rp+0x17]===0xdb;
  const reshapeNullPadding=bytes[rp+0x1a]===0xbb&&readU32(bytes,rp+0x1b)===nullImage.addressOffset&&bytes[rp+0x24]===0x8b&&bytes[rp+0x25]===0x7f&&bytes[rp+0x26]===0x04;
  const reshapeWalksLinkedObjects=bytes[rp+0x32]===0x8b&&bytes[rp+0x33]===0x7f&&bytes[rp+0x34]===0x04&&bytes[rp+0x35]===0x85&&bytes[rp+0x36]===0xff&&bytes[rp+0x37]===0x75;
  const reshapeOk=reshapeReadsFrameRecord&&reshapeSequentialPointers&&reshapeNullPadding&&reshapeWalksLinkedObjects;
  let prcCall=false; for(let p=pp;p<pp+0x80;p++)if(bytes[p]===0xe8&&rel32Target(bytes,p)===rp){prcCall=true;break;}
  const insertCallsInsobj=bytes[inp-5]===0xbb&&readU32(bytes,inp-4)===insobj.addressOffset&&bytes[inp]===0x8b&&bytes[inp+1]===0xc7&&bytes[inp+2]===0xff&&bytes[inp+3]===0xd3;
  const insertWalksLinkedObjects=bytes[inp+4]===0x8b&&bytes[inp+5]===0x40&&bytes[inp+6]===0x04&&bytes[inp+7]===0x85&&bytes[inp+8]===0xc0&&bytes[inp+9]===0x75;
  const insertOk=insertCallsInsobj&&insertWalksLinkedObjects;
  let setsA5=false, req67=false, usesDouble=false;
  for(let p=dp;p<Math.min(bytes.length,dp+0x500);p++){
    if(bytes[p]===0xc7&&bytes[p+1]===0x05&&readU32(bytes,p+2)===A5.addressOffset&&readU32(bytes,p+6)===msu.addressOffset)setsA5=true;
    if(bytes[p]===0xc7&&bytes[p+1]===0x05&&readU32(bytes,p+2)===A11.addressOffset&&readU32(bytes,p+6)===67){ for(let q=p+10;q<Math.min(p+40,bytes.length);q++)if(bytes[q]===0xe8&&rel32Target(bytes,q)===cb+getAni.addressOffset)req67=true; }
    if(bytes[p]===0xe9&&rel32Target(bytes,p)===cb+doubleM.addressOffset)usesDouble=true;
  }
  const tabCell=db+kanoTab.addressOffset+67*4; const tabMatches=readU32(bytes,tabCell)===ma.addressOffset;
  const setup=parsePointerList(bytes,db+msu.addressOffset,8); const setupExpected=setup.terminated&&setup.values.length===4&&setup.values.every(v=>v===bigbld.addressOffset); if(!setupExpected)throw new Error('MSU_HEART setup list changed');
  const bigPhysical=db+bigbld.addressOffset;
  const bigWidth=readU16(bytes,bigPhysical), bigHeight=readU16(bytes,bigPhysical+2), bigX=readI16(bytes,bigPhysical+4), bigY=readI16(bytes,bigPhysical+6), bigPacked=readU32(bytes,bigPhysical+8);
  const paletteLink=readU32(bytes,bigPhysical+12); if(paletteLink!==blood.addressOffset)throw new Error('BIGBLD1 +0x0C no longer links BLOOD_P');
  const plen=readU16(bytes,db+blood.addressOffset); const pwords=Array.from({length:plen},(_,i)=>readU16(bytes,db+blood.addressOffset+2+i*2)); if(plen!==15||!pwords.every(v=>v<0x8000))throw new Error('BLOOD_P shape changed');
  const main=parsePointerList(bytes,db+ma.addressOffset,16); if(!main.terminated||main.values.length!==5)throw new Error('MA_KHEART primary stream changed');
  const secondaryStart=(main.endPhysical-db); const beat=parsePointerList(bytes,main.endPhysical,16); if(!beat.terminated||beat.values.length!==3)throw new Error('MA_KHEART beat loop changed');
  const allRecordOffsets=Array.from(new Set([...main.values,...beat.values]));
  const records=allRecordOffsets.map((off,index)=>{ const parsed=parsePointerList(bytes,db+off,8); if(!parsed.terminated||parsed.values.length<1)throw new Error(`frame record ${hex(off)} invalid`); const names=parsed.values.map(v=>{const s=descSyms.find(d=>d.addressOffset===v);if(!s)throw new Error(`unknown heart descriptor ${hex(v)}`);return s.name;}); return {frameKey:`heart_${index}`,watcomOffset:off,watcomOffsetHex:hex(off),partDescriptorSymbols:names,partDescriptorOffsets:parsed.values,partDescriptorOffsetsHex:parsed.values.map(hex),partCount:parsed.values.length,terminatorPresent:true,rawHex:bytesHex(bytes.slice(db+off,parsed.endPhysical)),classification:(parsed.values.length>1?'VERIFIED_MULTI_FRAME_RECORD':'VERIFIED_SINGLE_PART_FRAME_RECORD') as 'VERIFIED_MULTI_FRAME_RECORD'|'VERIFIED_SINGLE_PART_FRAME_RECORD'}; });
  const tri=records.find(r=>r.partDescriptorOffsets.length===3); if(!tri||tri.partDescriptorSymbols.join('|')!=='KHEART3A|KHEART3B|KHEART3C')throw new Error('Expected three-part KHEART3 record not found');
  const gra=await resolveMK1GraTarget(source,'GRAPHICS/MISC.GRA'); if(gra.fileId!==2)throw new Error(`Expected MISC.GRA file ID 2; got ${gra.fileId}`); const graBytes=await source.readSlice(gra.path,0,gra.fileSize);
  const descriptorReports:MK1MultiPartFrameLosslessIrReport['descriptors']=[]; const payloadByOffset=new Map<number,MK1MultiPartPreviewPart>();
  for(const s of descSyms){ const p=db+s.addressOffset,w=readU16(bytes,p),h=readU16(bytes,p+2),x=readI16(bytes,p+4),y=readI16(bytes,p+6),packed=readU32(bytes,p+8),fid=(packed>>>24)&255,go=packed&0xffffff; if(fid!==2)throw new Error(`${s.name} no longer targets MISC.GRA`); const dec=decodeUgraSprite(graBytes,go,w,h); if(!dec.success||!dec.checksum)throw new Error(`${s.name} uGRA decode failed`); let opaque=0,min:null|number=null,max:null|number=null,out=0; for(let i=0;i<dec.indices.length;i++){if(!dec.opaqueMask[i])continue;opaque++;const v=dec.indices[i];if(v<1||v>plen)out++;min=min===null?v:Math.min(min,v);max=max===null?v:Math.max(max,v);} descriptorReports.push({symbol:s.name,watcomOffset:s.addressOffset,watcomOffsetHex:hex(s.addressOffset),width:w,height:h,x,y,packedReference:packed,packedReferenceHex:hex(packed),fileId:fid,graOffset:go,graOffsetHex:hex(go),rawHex:bytesHex(bytes.slice(p,p+12)),decode:{success:true,checksum:dec.checksum,encodedBytesConsumed:dec.encodedBytesConsumed,opaquePixelCount:opaque,minOpaqueIndex:min,maxOpaqueIndex:max,outOfPaletteRangeCount:out}}); payloadByOffset.set(s.addressOffset,{frameKey:'',partIndex:0,symbol:s.name,width:w,height:h,x,y,indices:dec.indices,opaqueMask:dec.opaqueMask}); }
  if(descriptorReports.some(d=>d.decode.outOfPaletteRangeCount!==0))throw new Error('Heart sprite palette fit failed');
  const recMap=new Map(records.map(r=>[r.watcomOffset,r]));
  const seqDefs=[{name:'PRIMARY' as const,start:ma.addressOffset,parsed:main},{name:'BEAT_LOOP' as const,start:secondaryStart,parsed:beat}];
  const compositionFrames:MK1MultiPartFrameLosslessIrReport['compositionFrames']=[]; const previewPayloads=new Map<string,MK1MultiPartPreviewPart[]>();
  for(const seq of seqDefs){ seq.parsed.values.forEach((off,i)=>{ const rec=recMap.get(off)!; const parts=rec.partDescriptorOffsets.map((dOff,partIndex)=>{const src=payloadByOffset.get(dOff)!;return {...src,frameKey:`${seq.name}:${i}`,partIndex};}); const minX=Math.min(...parts.map(p=>p.x)),minY=Math.min(...parts.map(p=>p.y)),maxX=Math.max(...parts.map(p=>p.x+p.width)),maxY=Math.max(...parts.map(p=>p.y+p.height)); const key=`${seq.name}:${i}`; previewPayloads.set(key,parts); compositionFrames.push({frameKey:key,sequence:seq.name,sequenceFrameIndex:i,recordWatcomOffset:off,partCount:parts.length,bounds:{minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY,anchorCanvasX:-minX,anchorCanvasY:-minY}}); }); }
  const sequences=seqDefs.map(s=>({name:s.name,watcomOffset:s.start,watcomOffsetHex:hex(s.start),frameRecordOffsets:s.parsed.values,frameRecordOffsetsHex:s.parsed.values.map(hex),terminatorPresent:true,rawHex:bytesHex(bytes.slice(db+s.start,s.parsed.endPhysical))}));
  const ir:MK1MultiPartFrameLosslessIrReport['ir']={format:'mk1_animation_ir_v1',owner:'KANO',semanticName:'HEART_RIP_MULTI',sourceSha256:sourceHash,maxPartObjects:4,tableBinding:{tableSymbol:'KANO_ANITAB',tableWatcomOffset:kanoTab.addressOffset,index:67,targetSequenceRef:ma.addressOffset,rawHex:bytesHex(bytes.slice(tabCell,tabCell+4))},setupList:{symbol:'MSU_HEART',offset:msu.addressOffset,descriptorRefs:setup.values,terminator:0,rawHex:bytesHex(bytes.slice(db+msu.addressOffset,setup.endPhysical))},setupDescriptor:{symbol:'BIGBLD1',offset:bigbld.addressOffset,width:bigWidth,height:bigHeight,x:bigX,y:bigY,packedReference:bigPacked,paletteRef:paletteLink,rawHex:bytesHex(bytes.slice(bigPhysical,bigPhysical+16))},sequences:sequences.map(s=>({name:s.name,offset:s.watcomOffset,frameRecordRefs:s.frameRecordOffsets,terminator:0,rawHex:s.rawHex})),frames:records.map(r=>({frameKey:r.frameKey,recordOffset:r.watcomOffset,parts:r.partDescriptorOffsets.map((v,i)=>({descriptorRef:v,descriptorSymbol:r.partDescriptorSymbols[i],structuralIndex:i})),terminator:0,rawHex:r.rawHex})),descriptors:descriptorReports.map(d=>({symbol:d.symbol,offset:d.watcomOffset,width:d.width,height:d.height,x:d.x,y:d.y,packedReference:d.packedReference,rawHex:d.rawHex})),palette:{symbol:'BLOOD_P',offset:blood.addressOffset,words15:pwords,rawHex:bytesHex(bytes.slice(db+blood.addressOffset,db+blood.addressOffset+2+plen*2))},preservation:{semanticRegionCount:22,unknownByteCount:0,rawProvenanceRetained:true,relocationSupported:false,ugraEncodingSupported:false}};
  // Semantic no-edit encoding is generated from the IR itself, not copied from source bytes.
  const serialized=serializeMK1BoundedAnimationIr(ir,db);
  const regionDefs=serialized.map(r=>({name:r.name,physicalStart:r.physicalStart,source:bytes.slice(r.physicalStart,r.physicalStart+r.encoded.length),encoded:r.encoded}));
  const rebuilt=bytes.slice(); let mism=0; const roundRegions=regionDefs.map(r=>{rebuilt.set(r.encoded,r.physicalStart);const exact=eqBytes(r.source,r.encoded);return{name:r.name,physicalStart:r.physicalStart,byteLength:r.source.length,sourceHex:bytesHex(r.source),encodedHex:bytesHex(r.encoded),exactMatch:exact};}); for(let i=0;i<bytes.length;i++)if(bytes[i]!==rebuilt[i])mism++; const rebuiltHash=await sha256Bytes(rebuilt); const allExact=roundRegions.every(r=>r.exactMatch)&&mism===0&&rebuiltHash===sourceHash;
  const success=initOk&&reshapeOk&&prcCall&&insertOk&&setsA5&&req67&&usesDouble&&tabMatches&&records.some(r=>r.partCount===3)&&allExact;
  const timestamp=new Date().toISOString(),operationId=createOperationId('multi-part-frame-lossless-ir');
  return {format:'mk1_multi_part_frame_lossless_ir_v1',timestamp,operationId,provenance:{...prior.provenance,timestamp,operationId},fixture:prior.fixture,prerequisite:{pass:'1E.3O.1',operationId:prior.operationId,verdict:'MORPH_ANIMATION_STREAM_AND_FRAME_COMPOSITION_ESTABLISHED',validationPassed:true},coordinateModel:prior.coordinateModel,
    mechanics:{initMulti:{watcomOffset:init.addressOffset,physicalStart:ip,a5WatcomOffset:A5.addressOffset,zeroTerminatedSetupList:initZeroTerminatedList&&setupExpected,createsLinkedObjectPerDescriptor:initCreatesLinkedObjects&&setupExpected,firstDescriptorPaletteLinkAtPlus0C:paletteLink===blood.addressOffset},reshapeMulti:{watcomOffset:reshape.addressOffset,physicalStart:rp,readsFrameRecordFromObjectPlus40:reshapeReadsFrameRecord,mapsPointersByLinkedObjectIndex:reshapeSequentialPointers&&reshapeWalksLinkedObjects,zeroTerminatesRecord:reshapeSequentialPointers,padsRemainingObjectsWithNullImage:reshapeNullPadding&&reshapeWalksLinkedObjects,nullImageWatcomOffset:nullImage.addressOffset},prcdsp:{watcomOffset:prcdsp.addressOffset,physicalStart:pp,callsReshapeMultiForMasterList:prcCall},insertMulti:{watcomOffset:insert.addressOffset,physicalStart:inp,callsInsobjPerLinkedObject:insertCallsInsobj&&insertWalksLinkedObjects,structuralRecordOrderIsObjectChainOrder:insertWalksLinkedObjects,finalPixelZOrderNotPromoted:true}},
    fixtureRoute:{kanoDeathBlowPhysical:dp,msuHeartWatcomOffset:msu.addressOffset,maKheartWatcomOffset:ma.addressOffset,kanoAnimationTableIndex:67,kanoAnimationTablePointerMatches:tabMatches,codeSetsA5ToMsuHeart:setsA5,codeRequestsAnimationIndex67:req67,codeUsesDoubleMframew:usesDouble,classification:'VERIFIED_KANO_HEART_MULTI_ANIMATION_ROUTE'},resource:{path:gra.path,fileId:2,fileSize:gra.fileSize,fileSizeHex:gra.fileSizeHex},palette:{symbol:'BLOOD_P',watcomOffset:blood.addressOffset,declaredLength:plen,colorWords15:pwords,rgbHex:pwords.map(rgb15),linkedFromSetupDescriptor:paletteLink===blood.addressOffset},setup:{symbol:'MSU_HEART',maxLinkedObjects:4,descriptorSymbols:setup.values.map(()=>bigbld.name),terminatorPresent:true,rawHex:ir.setupList.rawHex},sequences,frameRecords:records,descriptors:descriptorReports,compositionFrames,ir,roundTrip:{regions:roundRegions,allRegionsExact:roundRegions.every(r=>r.exactMatch),wholeExecutableMismatchCount:mism,sourceSha256:sourceHash,rebuiltSha256:rebuiltHash,wholeExecutableHashExact:rebuiltHash===sourceHash},decision:{multiPartFrameGrammarEstablished:reshapeOk&&records.some(r=>r.partCount>1),variablePartCountEstablished:new Set(records.map(r=>r.partCount)).size>1,nullPaddingBehaviorEstablished:reshapeOk,boundedLosslessAnimationIrEstablished:allExact,boundedNoEditSerializerEstablished:allExact,genericWritableAnimationCompilerEstablished:false,ugraEncoderEstablished:false,verdict:success?'MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED':'PARTIAL_MULTI_PART_MODEL',narrative:success?'INIT_MULTI and RESHAPE_MULTI establish MK1 multi-object composition as zero-terminated descriptor-pointer vectors mapped positionally onto a linked object chain. Kano heart-rip provides a real variable-part animation: MSU_HEART allocates four part objects, MA_KHEART is selected through KANO_ANITAB[67], and its primary stream includes a three-part frame [KHEART3A,KHEART3B,KHEART3C,0]. RESHAPE_MULTI substitutes NULL_IMAGE for remaining objects after an early frame terminator. All heart descriptors decode from MISC.GRA with BLOOD_P. A bounded semantic IR re-encodes the animation table cell, streams, frame records, descriptors, setup list/descriptor and palette byte-exactly, and reinserting those bytes produces zero whole-executable differences and the original SHA-256. This establishes a lossless editable data model for the bounded fixture, not yet a relocating/uGRA-writing general compiler.':'One or more multi-part mechanics, Kano route, decode, palette-fit or bounded no-edit serialization checks failed; do not promote the model.'},status:success?'SUCCESS':'PARTIAL',previewPayloads};
}

export async function createMK1MultiPartFrameLosslessIrExport(report:MK1MultiPartFrameLosslessIrReport){
  const checks=[
    {checkId:'PROVENANCE_REAL_USER_LOADED',passed:report.provenance.sourceKind==='user-loaded-directory'&&report.provenance.synthetic===false&&report.provenance.artifactGeneratedByTest===false&&/^[0-9a-f]{64}$/.test(report.provenance.sha256)},
    {checkId:'O1_PREREQUISITE_BOUND',passed:report.prerequisite.pass==='1E.3O.1'&&report.prerequisite.validationPassed},
    {checkId:'MULTI_MECHANICS',passed:report.mechanics.initMulti.zeroTerminatedSetupList&&report.mechanics.reshapeMulti.mapsPointersByLinkedObjectIndex&&report.mechanics.reshapeMulti.padsRemainingObjectsWithNullImage&&report.mechanics.prcdsp.callsReshapeMultiForMasterList},
    {checkId:'KANO_HEART_ROUTE',passed:report.fixtureRoute.kanoAnimationTablePointerMatches&&report.fixtureRoute.codeSetsA5ToMsuHeart&&report.fixtureRoute.codeRequestsAnimationIndex67&&report.fixtureRoute.codeUsesDoubleMframew},
    {checkId:'VARIABLE_PART_RECORDS',passed:report.decision.multiPartFrameGrammarEstablished&&report.decision.variablePartCountEstablished&&report.frameRecords.some(r=>r.partCount===3)},
    {checkId:'MISC_GRA_DECODES',passed:report.resource.fileId===2&&report.descriptors.length===9&&report.descriptors.every(d=>d.decode.success&&d.decode.outOfPaletteRangeCount===0)},
    {checkId:'BOUNDED_LOSSLESS_IR',passed:report.decision.boundedLosslessAnimationIrEstablished&&report.ir.preservation.unknownByteCount===0&&report.ir.preservation.semanticRegionCount===report.roundTrip.regions.length&&report.ir.preservation.rawProvenanceRetained===true},
    {checkId:'NO_EDIT_SERIALIZER',passed:report.decision.boundedNoEditSerializerEstablished&&report.roundTrip.allRegionsExact&&report.roundTrip.wholeExecutableMismatchCount===0&&report.roundTrip.wholeExecutableHashExact},
    {checkId:'SCOPE_BOUNDARY',passed:report.decision.genericWritableAnimationCompilerEstablished===false&&report.decision.ugraEncoderEstablished===false&&report.mechanics.insertMulti.finalPixelZOrderNotPromoted===true},
  ];
  if(report.status!=='SUCCESS'||!checks.every(c=>c.passed))throw new Error(`1E.3O.2 export blocked: ${checks.filter(c=>!c.passed).map(c=>c.checkId).join(', ')||'partial status'}`);
  const {previewPayloads:_preview,...serializable}=report;
  return {metadata:{name:'MK1 Multi-Part Frame Grammar + Bounded Lossless Animation IR',milestone:'Pass 1E.3O.2',formatVersion:report.format,exportTimestamp:report.timestamp},...serializable,validation:{allChecksPassed:true,checks}};
}
