import { DirectorySource, SourceFileEntry } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import type { MK2FixtureResourceExecutableTopologyReport } from './fixtureResourceExecutableTopology';
import type { MK2U8SampleStartCallerTraceReport } from './u8SampleStartCallerTrace';

const EXPECTED_GMI_SHA256 = '7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633';
const HEADER_BYTES = 32;
const EXPECTED_EXCEPTION_BASENAMES = new Set(['GONG.U8','LIU-KANG.U8','THUNDER.U8','THUNDSHT.U8']);
const OFFSETS = { sampleStartFieldCopy:0x0f2f, mixerThreshold:0x0cf8, completionThreshold:0x0e9c } as const;
const SIG = {
  sampleStartFieldCopy:'ad464603c3ab8cd8aba54646ad0bc0740203c3ab58',
  mixerThreshold:'8b1c3b5c0490720a8b5c06900bdb741d891c',
  completionThreshold:'8b1c3b5c049072128b5c06900bdb750ac74404000090c704ffffc3',
} as const;

function findEntry(entries: SourceFileEntry[], wanted: string): SourceFileEntry {
  const match=entries.find(e=>e.path.toUpperCase()===wanted.toUpperCase());
  if(!match) throw new Error(`Required MK2 file missing: ${wanted}`);
  return match;
}
function basename(path:string):string { return path.split('/').at(-1) ?? path; }
function u32(v:DataView,off:number):number { return v.getUint32(off,true); }
function fromHex(value:string):Uint8Array { const out=new Uint8Array(value.length/2); for(let i=0;i<out.length;i++)out[i]=Number.parseInt(value.slice(i*2,i*2+2),16); return out; }
function equalAt(bytes:Uint8Array,offset:number,expectedHex:string):boolean { const e=fromHex(expectedHex); return offset>=0&&offset+e.length<=bytes.length&&e.every((v,i)=>bytes[offset+i]===v); }
async function sha256(bytes:Uint8Array):Promise<string>{ const d=await globalThis.crypto.subtle.digest('SHA-256',bytes.slice().buffer); return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,'0')).join(''); }
async function readWhole(source:DirectorySource,entry:SourceFileEntry):Promise<Uint8Array>{ const b=await source.readSlice(entry.path,0,entry.size); if(b.length!==entry.size)throw new Error(`Short read: ${entry.path}`); return b; }

export interface MK2U8EndFieldObservation {
  path:string; fileBytes:number; dataStartField:number; endField:number; endHighWord:number;
  bytesAfterDeclaredInclusiveEnd:number; relation:'FILE_BYTES_MINUS_33'|'FILE_BYTES_MINUS_1'|'OTHER';
  trailingBlockSha256:string|null; trailingBlockAllZero:boolean;
}
export interface MK2U8EndFieldLifetimeReport {
  format:'mk2_u8_end_field_lifetime_o94b_v1'; timestamp:string; operationId:string;
  provenance:{sourceKind:'user-loaded-directory';directoryName:string;synthetic:false;gmiSha256:string;o94aVerdict:string};
  authenticatedCode:{
    sampleStartFieldCopy:{offset:number;observation:string};
    mixerThreshold:{offset:number;observation:string};
    completionThreshold:{offset:number;observation:string};
  };
  corpus:{
    fileCount:312; dataStartFieldAll32:true; endHighWordAllZero:true; maxEndField:number;
    relationCounts:{FILE_BYTES_MINUS_33:number;FILE_BYTES_MINUS_1:number;OTHER:number};
    bytesAfterDeclaredInclusiveEndCounts:Record<string,number>;
    thirtyTwoByteTailCount:number; thirtyTwoByteTailUniqueSha256:number; thirtyTwoByteTailAllZeroCount:number;
    zeroByteTailCount:number; exceptionalFiles:MK2U8EndFieldObservation[]; observations:MK2U8EndFieldObservation[];
  };
  fieldLifetime:{
    diskField:'+0x04_U32'; consumedPart:'LOW_16_BITS_ONLY'; highWordBehavior:'SKIPPED_BY_SAMPLE_START';
    runtimeChannelField:'+0x04_U16_END_THRESHOLD'; transformation:'IDENTITY_COPY_LOW16_NO_BASE_ADD';
    mixerComparison:'UNSIGNED_CURRENT_OFFSET_LT_END_THRESHOLD_TO_READ';
    completionComparison:'CURRENT_OFFSET_AT_OR_ABOVE_THRESHOLD_FINISHES_WHEN_NO_LOOP';
  };
  decision:{
    diskToRuntimeEndFieldTransformationEstablished:true; diskEndFieldBoundedMeaningEstablished:true;
    splitEncodedOnDiskEstablished:true; splitPurposeEstablished:false; exactActivePcmRangeEstablished:false; wavAdapterAuthorized:false;
    verdict:'O94B_U8_PLUS04_LOW16_IS_DIRECT_MIXER_END_THRESHOLD_SPLIT_IS_ON_DISK_PURPOSE_UNRESOLVED'; narrative:string;
  };
  status:'SUCCESS'; validation:{allChecksPassed:true;checks:Array<{id:string;passed:boolean;detail:string}>};
}

export async function executeMK2U8EndFieldLifetime(source:DirectorySource,o67:MK2FixtureResourceExecutableTopologyReport,o94a:MK2U8SampleStartCallerTraceReport):Promise<MK2U8EndFieldLifetimeReport>{
  if(source.isSynthetic)throw new Error('O94B requires an authentic user-loaded MK2 fixture');
  if(o67.status!=='SUCCESS'||!o67.validation.allChecksPassed||o67.provenance.synthetic)throw new Error('O94B requires verified authentic O67');
  if(o94a.status!=='SUCCESS'||!o94a.validation.allChecksPassed||o94a.provenance.synthetic||!o94a.decision.sampleStartCallerChainEstablished)throw new Error('O94B requires verified authentic O94A');
  if(o94a.decision.wavAdapterAuthorized||o94a.decision.activePcmRangeEstablished)throw new Error('O94A prerequisite must remain fail-closed');

  const timestamp=new Date().toISOString(),operationId=createOperationId('mk2_u8_o94b_end_field_lifetime');
  const entries=(await source.listRecursive()).slice().sort((a,b)=>a.path.localeCompare(b.path));
  const gmiEntry=findEntry(entries,'GMI.BIN'),gmi=await readWhole(source,gmiEntry),gmiSha256=await sha256(gmi);
  const u8Entries=entries.filter(e=>e.path.toUpperCase().startsWith('FX/')&&e.extension.toUpperCase()==='U8');
  const observations:MK2U8EndFieldObservation[]=[];
  for(const entry of u8Entries){
    if(entry.size<HEADER_BYTES)throw new Error(`Short U8 file: ${entry.path}`);
    const bytes=await readWhole(source,entry),v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    const dataStartField=u32(v,0),endField=u32(v,4),endHighWord=(endField>>>16)&0xffff;
    const bytesAfterDeclaredInclusiveEnd=endField<bytes.length?bytes.length-(endField+1):-1;
    let relation:MK2U8EndFieldObservation['relation']='OTHER';
    if(endField===entry.size-33)relation='FILE_BYTES_MINUS_33'; else if(endField===entry.size-1)relation='FILE_BYTES_MINUS_1';
    const trailing=bytesAfterDeclaredInclusiveEnd>=0?bytes.slice(endField+1):new Uint8Array(0);
    observations.push({path:entry.path,fileBytes:entry.size,dataStartField,endField,endHighWord,bytesAfterDeclaredInclusiveEnd,relation,
      trailingBlockSha256:trailing.length?await sha256(trailing):null,trailingBlockAllZero:trailing.length>0&&trailing.every(b=>b===0)});
  }
  const relationCounts={FILE_BYTES_MINUS_33:0,FILE_BYTES_MINUS_1:0,OTHER:0};
  const tailCounts:Record<string,number>={};
  for(const row of observations){ relationCounts[row.relation]++; tailCounts[String(row.bytesAfterDeclaredInclusiveEnd)]=(tailCounts[String(row.bytesAfterDeclaredInclusiveEnd)]??0)+1; }
  const tail32=observations.filter(r=>r.bytesAfterDeclaredInclusiveEnd===32),tail0=observations.filter(r=>r.bytesAfterDeclaredInclusiveEnd===0);
  const exceptionalFiles=observations.filter(r=>r.relation==='FILE_BYTES_MINUS_1');
  const exceptionNames=new Set(exceptionalFiles.map(r=>basename(r.path).toUpperCase()));
  const checks=[
    {id:'gmi_hash',passed:gmiSha256===EXPECTED_GMI_SHA256,detail:gmiSha256},
    {id:'sample_start_copy_signature',passed:equalAt(gmi,OFFSETS.sampleStartFieldCopy,SIG.sampleStartFieldCopy),detail:'GMI+0x0F2F'},
    {id:'mixer_threshold_signature',passed:equalAt(gmi,OFFSETS.mixerThreshold,SIG.mixerThreshold),detail:'GMI+0x0CF8'},
    {id:'completion_threshold_signature',passed:equalAt(gmi,OFFSETS.completionThreshold,SIG.completionThreshold),detail:'GMI+0x0E9C'},
    {id:'u8_count',passed:observations.length===312,detail:`${observations.length}`},
    {id:'data_start_32',passed:observations.every(r=>r.dataStartField===32),detail:'all +0 == 32'},
    {id:'end_high_word_zero',passed:observations.every(r=>r.endHighWord===0),detail:`max=${Math.max(...observations.map(r=>r.endField))}`},
    {id:'relation_partition',passed:relationCounts.FILE_BYTES_MINUS_33===308&&relationCounts.FILE_BYTES_MINUS_1===4&&relationCounts.OTHER===0,detail:JSON.stringify(relationCounts)},
    {id:'tail_partition',passed:tail32.length===308&&tail0.length===4,detail:JSON.stringify(tailCounts)},
    {id:'exception_identity',passed:exceptionNames.size===4&&[...EXPECTED_EXCEPTION_BASENAMES].every(n=>exceptionNames.has(n)),detail:[...exceptionNames].sort().join(', ')},
  ];
  const failed=checks.filter(c=>!c.passed); if(failed.length)throw new Error(`O94B validation failed: ${failed.map(c=>c.id).join(', ')}`);
  return {
    format:'mk2_u8_end_field_lifetime_o94b_v1',timestamp,operationId,
    provenance:{sourceKind:'user-loaded-directory',directoryName:source.directoryName,synthetic:false,gmiSha256,o94aVerdict:o94a.decision.verdict},
    authenticatedCode:{
      sampleStartFieldCopy:{offset:OFFSETS.sampleStartFieldCopy,observation:'At 0x0F2F the routine reads descriptor +0, skips its high word, then MOVSW copies descriptor +4 low word directly into channel-state +4; it then skips descriptor +6/+7. No arithmetic is applied to +4.'},
      mixerThreshold:{offset:OFFSETS.mixerThreshold,observation:'Mixer loads current offset from channel +0, compares unsigned against channel +4, and reads a sample only on the JB/current<end path; reaching the threshold selects loop handling or silence.'},
      completionThreshold:{offset:OFFSETS.completionThreshold,observation:'Completion repeats current-vs-end comparison and, with no loop, clears channel +4 and marks current offset 0xFFFF.'},
    },
    corpus:{fileCount:312,dataStartFieldAll32:true,endHighWordAllZero:true,maxEndField:Math.max(...observations.map(r=>r.endField)),relationCounts,bytesAfterDeclaredInclusiveEndCounts:tailCounts,
      thirtyTwoByteTailCount:tail32.length,thirtyTwoByteTailUniqueSha256:new Set(tail32.map(r=>r.trailingBlockSha256)).size,thirtyTwoByteTailAllZeroCount:tail32.filter(r=>r.trailingBlockAllZero).length,
      zeroByteTailCount:tail0.length,exceptionalFiles,observations},
    fieldLifetime:{diskField:'+0x04_U32',consumedPart:'LOW_16_BITS_ONLY',highWordBehavior:'SKIPPED_BY_SAMPLE_START',runtimeChannelField:'+0x04_U16_END_THRESHOLD',transformation:'IDENTITY_COPY_LOW16_NO_BASE_ADD',
      mixerComparison:'UNSIGNED_CURRENT_OFFSET_LT_END_THRESHOLD_TO_READ',completionComparison:'CURRENT_OFFSET_AT_OR_ABOVE_THRESHOLD_FINISHES_WHEN_NO_LOOP'},
    decision:{diskToRuntimeEndFieldTransformationEstablished:true,diskEndFieldBoundedMeaningEstablished:true,splitEncodedOnDiskEstablished:true,splitPurposeEstablished:false,exactActivePcmRangeEstablished:false,wavAdapterAuthorized:false,
      verdict:'O94B_U8_PLUS04_LOW16_IS_DIRECT_MIXER_END_THRESHOLD_SPLIT_IS_ON_DISK_PURPOSE_UNRESOLVED',
      narrative:'Authenticated SCC/GMI code copies the low 16 bits of disk header +0x04 directly into channel-state +0x04, with no base addition or normalization; the high 16 bits are skipped. The mixer and completion logic use that channel field as an unsigned current-offset threshold. In the canonical corpus all high words are zero. 308 files encode +0x04=fileBytes-33, leaving exactly 32 file bytes after the declared inclusive threshold; four files encode +0x04=fileBytes-1, leaving none. Therefore the 308/4 distinction is present on disk and survives unchanged into mixer state. O94B does not establish why the 32 trailing bytes exist or whether they are padding, guard material, or sample material, and it does not authorize a PCM/WAV range.'},
    status:'SUCCESS',validation:{allChecksPassed:true,checks:checks.map(c=>({...c,passed:true}))},
  };
}

export function createMK2U8EndFieldLifetimeExport(report:MK2U8EndFieldLifetimeReport):MK2U8EndFieldLifetimeReport{
  if(report.status!=='SUCCESS'||!report.validation.allChecksPassed||report.provenance.synthetic)throw new Error('Verified authentic O94B report required');
  if(report.decision.splitPurposeEstablished||report.decision.exactActivePcmRangeEstablished||report.decision.wavAdapterAuthorized)throw new Error('O94B must remain fail-closed beyond +0x04 lifetime');
  return report;
}
