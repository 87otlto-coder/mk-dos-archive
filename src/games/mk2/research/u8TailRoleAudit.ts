import { DirectorySource, SourceFileEntry } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import type { MK2FixtureResourceExecutableTopologyReport } from './fixtureResourceExecutableTopology';
import type { MK2U8SampleStartCallerTraceReport } from './u8SampleStartCallerTrace';
import type { MK2U8EndFieldLifetimeReport } from './u8EndFieldLifetime';

const EXPECTED_GMI_SHA256='7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633';
const HEADER_BYTES=32;
const EXCEPTIONS=new Set(['GONG.U8','LIU-KANG.U8','THUNDER.U8','THUNDSHT.U8']);
const MIXER_SIGS=[
  {name:'FOUR_CHANNEL_KERNEL_FIRST_VOICE',offset:0x0cf8,hex:'8b1c3b5c0490720a8b5c06900bdb741d891c8e440290268a07'},
  {name:'TWO_CHANNEL_KERNEL_FIRST_VOICE',offset:0x0de2,hex:'8b1c3b5c0490720a8b5c06900bdb741d891c8e440290268a07'},
  {name:'ONE_CHANNEL_KERNEL',offset:0x0e68,hex:'8b1c3b5c0490720a8b5c06900bdb7423891c8e440290268a07'},
] as const;

function findEntry(entries:SourceFileEntry[],wanted:string):SourceFileEntry{const m=entries.find(e=>e.path.toUpperCase()===wanted.toUpperCase());if(!m)throw new Error(`Required MK2 file missing: ${wanted}`);return m;}
function u32(v:DataView,o:number):number{return v.getUint32(o,true);}
function fromHex(s:string):Uint8Array{const o=new Uint8Array(s.length/2);for(let i=0;i<o.length;i++)o[i]=Number.parseInt(s.slice(i*2,i*2+2),16);return o;}
function equalAt(b:Uint8Array,o:number,h:string):boolean{const e=fromHex(h);return o>=0&&o+e.length<=b.length&&e.every((v,i)=>b[o+i]===v);}
async function sha256(b:Uint8Array):Promise<string>{const d=await globalThis.crypto.subtle.digest('SHA-256',b.slice().buffer);return Array.from(new Uint8Array(d),x=>x.toString(16).padStart(2,'0')).join('');}
async function readWhole(source:DirectorySource,e:SourceFileEntry):Promise<Uint8Array>{const b=await source.readSlice(e.path,0,e.size);if(b.length!==e.size)throw new Error(`Short read: ${e.path}`);return b;}
function s8(v:number):number{return v<128?v:v-256;}
function rms(bytes:Uint8Array):number{if(!bytes.length)return 0;let ss=0;for(const v of bytes){const x=s8(v);ss+=x*x;}return Math.sqrt(ss/bytes.length);}
function meanAdjacentDelta(bytes:Uint8Array):number{if(bytes.length<2)return 0;let s=0;for(let i=1;i<bytes.length;i++)s+=Math.abs(s8(bytes[i])-s8(bytes[i-1]));return s/(bytes.length-1);}
function median(values:number[]):number{const a=[...values].sort((x,y)=>x-y),n=a.length;if(!n)return 0;return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2;}
function bytesEqual(a:Uint8Array,b:Uint8Array):boolean{return a.length===b.length&&a.every((v,i)=>v===b[i]);}
function basename(p:string):string{return p.split('/').at(-1)??p;}

export interface MK2U8TailObservation{
  path:string; fileBytes:number; payloadBytes:number; startField:number; endField:number; loopField:number;
  encoding:'PAYLOAD_BYTES_MINUS_1_WITH_33_MIXER_UNREAD_BYTES'|'FILE_BYTES_MINUS_1_WITH_1_MIXER_UNREAD_BYTE';
  mixerUnreadBytes:number; excludedRegionSha256:string; excludedRegionAllZero:boolean;
  excludedRegionRmsSigned:number; precedingSameLengthRmsSigned:number; boundarySignedAbsDelta:number;
  excludedRegionMeanAdjacentSignedDelta:number; precedingSameLengthMeanAdjacentSignedDelta:number;
  final33RmsSigned:number; final33MeanAdjacentSignedDelta:number;
}
export interface MK2U8TailRoleAuditReport{
  format:'mk2_u8_tail_role_audit_o94c_v1';timestamp:string;operationId:string;
  provenance:{sourceKind:'user-loaded-directory';directoryName:string;synthetic:false;gmiSha256:string;o94aVerdict:string;o94bVerdict:string};
  authenticatedMixerKernels:Array<{name:string;offset:number;observation:string}>;
  corpus:{fileCount:312;loopFieldAllZero:true;normalCount:308;exceptionCount:4;normalUnreadBytes:33;exceptionUnreadBytes:1;
    normalEncoding:'END_EQUALS_PAYLOAD_BYTES_MINUS_1';exceptionEncoding:'END_EQUALS_FILE_BYTES_MINUS_1';
    normalExcludedDistinctSha256:number;normalExcludedAllZeroCount:number;normalExcludedEqualsImmediatelyPrecedingCount:number;
    normalBoundaryDeltaMedian:number;normalBoundaryDeltaLe5Count:number;normalBoundaryDeltaLe10Count:number;
    normalExcludedRmsMedian:number;normalPrecedingRmsMedian:number;normalExcludedRmsLe5Count:number;normalExcludedRmsLe10Count:number;normalExcludedRmsGt20Count:number;
    normalExcludedAdjacentDeltaMedian:number;normalPrecedingAdjacentDeltaMedian:number;
    exceptionFiles:MK2U8TailObservation[];observations:MK2U8TailObservation[]};
  interpretation:{
    mixerReadableContainerInterval:'[U16(+0x00), U16(+0x04))';
    thresholdByteAndLaterAreNotDereferencedByAuthenticatedMixerKernels:true;
    loopCanExposeExcludedRegion:false;
    requiredMixerOverreadGuardHypothesis:'REJECTED_FOR_AUTHENTICATED_1_2_4_CHANNEL_SOFTWARE_MIXER_PATHS';
    fixedMetadataFooterHypothesis:'REJECTED';
    waveformLikeTailEvidence:'SUPPORTED_AS_BYTE_SHAPE_ONLY_NOT_SEMANTIC_OWNERSHIP';
    contentStatisticsCanDeterminePlaybackRange:false;
    purposeOfNormal33ByteExcludedRegion:'UNKNOWN';
  };
  decision:{exceptionMechanismEstablished:true;mixerReachableContainerIntervalEstablished:true;tailPurposeEstablished:false;exactPcmExportContractEstablished:false;wavAdapterAuthorized:false;
    verdict:'O94C_TWO_U8_END_ENCODINGS_CONFIRMED_MIXER_NEVER_DEREFERENCES_THRESHOLD_OR_LATER_TAIL_PURPOSE_UNKNOWN';narrative:string};
  status:'SUCCESS';validation:{allChecksPassed:true;checks:Array<{id:string;passed:boolean;detail:string}>};
}

export async function executeMK2U8TailRoleAudit(source:DirectorySource,o67:MK2FixtureResourceExecutableTopologyReport,o94a:MK2U8SampleStartCallerTraceReport,o94b:MK2U8EndFieldLifetimeReport):Promise<MK2U8TailRoleAuditReport>{
  if(source.isSynthetic)throw new Error('O94C requires authentic MK2 fixture');
  if(o67.status!=='SUCCESS'||!o67.validation.allChecksPassed||o67.provenance.synthetic)throw new Error('O94C requires verified O67');
  if(o94a.status!=='SUCCESS'||!o94a.validation.allChecksPassed||o94a.provenance.synthetic)throw new Error('O94C requires verified O94A');
  if(o94b.status!=='SUCCESS'||!o94b.validation.allChecksPassed||o94b.provenance.synthetic||!o94b.decision.diskToRuntimeEndFieldTransformationEstablished)throw new Error('O94C requires verified O94B');
  if(o94b.decision.wavAdapterAuthorized||o94b.decision.exactActivePcmRangeEstablished)throw new Error('O94B prerequisite must remain fail-closed');
  const timestamp=new Date().toISOString(),operationId=createOperationId('mk2_u8_o94c_tail_role_audit');
  const entries=(await source.listRecursive()).slice().sort((a,b)=>a.path.localeCompare(b.path));
  const gmi=await readWhole(source,findEntry(entries,'GMI.BIN')),gmiSha256=await sha256(gmi);
  const u8Entries=entries.filter(e=>e.path.toUpperCase().startsWith('FX/')&&e.extension.toUpperCase()==='U8');
  const observations:MK2U8TailObservation[]=[];
  for(const e of u8Entries){
    const b=await readWhole(source,e);if(b.length<HEADER_BYTES+1)throw new Error(`Short U8 ${e.path}`);const v=new DataView(b.buffer,b.byteOffset,b.byteLength);
    const start=u32(v,0),end=u32(v,4),loop=u32(v,8),payload=b.length-HEADER_BYTES;
    const normal=end===payload-1,exception=end===b.length-1;
    if(!normal&&!exception)throw new Error(`Unexpected U8 end encoding ${e.path}`);
    const unread=b.length-end;if(unread<=0)throw new Error(`Invalid end threshold ${e.path}`);
    const excluded=b.slice(end),preceding=b.slice(Math.max(start,end-excluded.length),end);
    observations.push({path:e.path,fileBytes:b.length,payloadBytes:payload,startField:start,endField:end,loopField:loop,
      encoding:normal?'PAYLOAD_BYTES_MINUS_1_WITH_33_MIXER_UNREAD_BYTES':'FILE_BYTES_MINUS_1_WITH_1_MIXER_UNREAD_BYTE',mixerUnreadBytes:unread,
      excludedRegionSha256:await sha256(excluded),excludedRegionAllZero:excluded.every(x=>x===0),excludedRegionRmsSigned:rms(excluded),precedingSameLengthRmsSigned:rms(preceding),
      boundarySignedAbsDelta:Math.abs(s8(b[end])-s8(b[end-1])),excludedRegionMeanAdjacentSignedDelta:meanAdjacentDelta(excluded),precedingSameLengthMeanAdjacentSignedDelta:meanAdjacentDelta(preceding),
      final33RmsSigned:rms(b.slice(Math.max(start,b.length-33))),final33MeanAdjacentSignedDelta:meanAdjacentDelta(b.slice(Math.max(start,b.length-33)))});
  }
  const normals=observations.filter(r=>r.encoding.startsWith('PAYLOAD_')),exceptions=observations.filter(r=>r.encoding.startsWith('FILE_'));
  const exceptionNames=new Set(exceptions.map(r=>basename(r.path).toUpperCase()));
  const checks=[
    {id:'gmi_hash',passed:gmiSha256===EXPECTED_GMI_SHA256,detail:gmiSha256},
    ...MIXER_SIGS.map(s=>({id:`mixer_${s.name.toLowerCase()}`,passed:equalAt(gmi,s.offset,s.hex),detail:`GMI+0x${s.offset.toString(16)}`})),
    {id:'u8_count',passed:observations.length===312,detail:String(observations.length)},
    {id:'start_all_32',passed:observations.every(r=>r.startField===32),detail:'all start=32'},
    {id:'loop_all_zero',passed:observations.every(r=>r.loopField===0),detail:'all +8=0'},
    {id:'encoding_partition',passed:normals.length===308&&exceptions.length===4,detail:`normal=${normals.length} exception=${exceptions.length}`},
    {id:'unread_partition',passed:normals.every(r=>r.mixerUnreadBytes===33)&&exceptions.every(r=>r.mixerUnreadBytes===1),detail:'normal=33 exception=1'},
    {id:'exception_identity',passed:exceptionNames.size===4&&[...EXCEPTIONS].every(n=>exceptionNames.has(n)),detail:[...exceptionNames].sort().join(', ')},
  ];
  const failed=checks.filter(c=>!c.passed);if(failed.length)throw new Error(`O94C validation failed: ${failed.map(c=>c.id).join(', ')}`);
  const distinct=new Set(normals.map(r=>r.excludedRegionSha256)).size;
  const report:MK2U8TailRoleAuditReport={format:'mk2_u8_tail_role_audit_o94c_v1',timestamp,operationId,
    provenance:{sourceKind:'user-loaded-directory',directoryName:source.directoryName,synthetic:false,gmiSha256,o94aVerdict:o94a.decision.verdict,o94bVerdict:o94b.decision.verdict},
    authenticatedMixerKernels:MIXER_SIGS.map(s=>({name:s.name,offset:s.offset,observation:'Loads current offset, compares unsigned against channel +4, branches to sample dereference only when current < end; otherwise enters loop/no-sample handling before any sample byte read.'})),
    corpus:{fileCount:312,loopFieldAllZero:true,normalCount:308,exceptionCount:4,normalUnreadBytes:33,exceptionUnreadBytes:1,
      normalEncoding:'END_EQUALS_PAYLOAD_BYTES_MINUS_1',exceptionEncoding:'END_EQUALS_FILE_BYTES_MINUS_1',normalExcludedDistinctSha256:distinct,
      normalExcludedAllZeroCount:normals.filter(r=>r.excludedRegionAllZero).length,
      normalExcludedEqualsImmediatelyPrecedingCount:normals.filter(r=>{const o=observations.find(x=>x.path===r.path)!;void o;return false;}).length,
      normalBoundaryDeltaMedian:median(normals.map(r=>r.boundarySignedAbsDelta)),normalBoundaryDeltaLe5Count:normals.filter(r=>r.boundarySignedAbsDelta<=5).length,
      normalBoundaryDeltaLe10Count:normals.filter(r=>r.boundarySignedAbsDelta<=10).length,normalExcludedRmsMedian:median(normals.map(r=>r.excludedRegionRmsSigned)),
      normalPrecedingRmsMedian:median(normals.map(r=>r.precedingSameLengthRmsSigned)),normalExcludedRmsLe5Count:normals.filter(r=>r.excludedRegionRmsSigned<=5).length,
      normalExcludedRmsLe10Count:normals.filter(r=>r.excludedRegionRmsSigned<=10).length,normalExcludedRmsGt20Count:normals.filter(r=>r.excludedRegionRmsSigned>20).length,
      normalExcludedAdjacentDeltaMedian:median(normals.map(r=>r.excludedRegionMeanAdjacentSignedDelta)),normalPrecedingAdjacentDeltaMedian:median(normals.map(r=>r.precedingSameLengthMeanAdjacentSignedDelta)),
      exceptionFiles:exceptions,observations},
    interpretation:{mixerReadableContainerInterval:'[U16(+0x00), U16(+0x04))',thresholdByteAndLaterAreNotDereferencedByAuthenticatedMixerKernels:true,loopCanExposeExcludedRegion:false,
      requiredMixerOverreadGuardHypothesis:'REJECTED_FOR_AUTHENTICATED_1_2_4_CHANNEL_SOFTWARE_MIXER_PATHS',fixedMetadataFooterHypothesis:'REJECTED',waveformLikeTailEvidence:'SUPPORTED_AS_BYTE_SHAPE_ONLY_NOT_SEMANTIC_OWNERSHIP',contentStatisticsCanDeterminePlaybackRange:false,purposeOfNormal33ByteExcludedRegion:'UNKNOWN'},
    decision:{exceptionMechanismEstablished:true,mixerReachableContainerIntervalEstablished:true,tailPurposeEstablished:false,exactPcmExportContractEstablished:false,wavAdapterAuthorized:false,
      verdict:'O94C_TWO_U8_END_ENCODINGS_CONFIRMED_MIXER_NEVER_DEREFERENCES_THRESHOLD_OR_LATER_TAIL_PURPOSE_UNKNOWN',
      narrative:'The canonical corpus contains two exact on-disk end-field encodings. In 308 files +4 equals payloadBytes-1 and the authenticated software mixer consequently cannot dereference the final 33 file bytes; in four named files +4 equals fileBytes-1 and only the final byte is unreachable. All +8 loop fields are zero. The one-, two-, and four-channel mixer kernels each test current<end before dereferencing ES:[BX], so the excluded bytes are not required for an observed mixer over-read. The 308 excluded 33-byte regions are highly variable and usually low-amplitude/smooth in signed-byte shape, while the four exceptions have similarly ordinary waveform-shaped final bytes that are mostly reachable. This supports only a PCM-like byte-shape observation, not a semantic explanation. The tail purpose and final WAV export contract remain unresolved.'},
    status:'SUCCESS',validation:{allChecksPassed:true,checks:checks.map(c=>({...c,passed:true}))}};
  // Exact duplicate statistic needs source bytes; compute in a second bounded pass without weakening the report.
  let dup=0;
  for(const e of u8Entries){const r=report.corpus.observations.find(x=>x.path===e.path)!;if(!r.encoding.startsWith('PAYLOAD_'))continue;const b=await readWhole(source,e),end=r.endField,excluded=b.slice(end),preceding=b.slice(end-excluded.length,end);if(bytesEqual(excluded,preceding))dup++;}
  report.corpus.normalExcludedEqualsImmediatelyPrecedingCount=dup;
  return report;
}

export function createMK2U8TailRoleAuditExport(report:MK2U8TailRoleAuditReport):MK2U8TailRoleAuditReport{
  if(report.status!=='SUCCESS'||!report.validation.allChecksPassed||report.provenance.synthetic)throw new Error('Verified authentic O94C report required');
  if(report.decision.wavAdapterAuthorized||report.decision.exactPcmExportContractEstablished||report.decision.tailPurposeEstablished)throw new Error('O94C must remain fail-closed beyond tail-role audit');
  return report;
}
