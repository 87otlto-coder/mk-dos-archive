import { DirectorySource, SourceFileEntry } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { parseWave, wavePcm } from '../../../core/assets/wave';
import type { MK2FixtureResourceExecutableTopologyReport } from './fixtureResourceExecutableTopology';
import type { MK2U8SampleStartCallerTraceReport } from './u8SampleStartCallerTrace';
import type { MK2U8EndFieldLifetimeReport } from './u8EndFieldLifetime';
import type { MK2U8TailRoleAuditReport } from './u8TailRoleAudit';

const EXPECTED_MK2_SHA256 = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const EXPECTED_RM_SHA256 = '87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546';
const EXPECTED_GMI_SHA256 = '7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633';
const HEADER_BYTES = 32;
const encoder = new TextEncoder();

const OFF = {
  ah10DispatchWord: 0x0288,
  ah11DispatchWord: 0x028a,
  setOutputRate: 0x0c5a,
  pitch: 0x0afd,
  sampleStart: 0x0f03,
  noteTable: 0x102b,
  defaultOutputRateInstruction: 0x084a,
  mixer4: 0x0cf8,
  mixer2: 0x0de2,
  mixer1: 0x0e68,
} as const;
const SIG = {
  setOutputRate: '81f9a00f7c28ba0f00b84042f7f10ae4751c2ae0890e021350b4d09090e8330558e82805b4d49090e8280532c0c3b002c3',
  pitch: '2e803ef3120074f7535132e4b30cf6f3b10b2ac88adcd0e332ff2e8b872b10d3e8508b44122e8b160213f7e28bda8bc8588b5410f7e20bdb740ad1ebd1d9d1ead1d8ebf2f7f18bd833c0f7f18bd3595bc3',
  sampleStartLead: '3c03774d8ad883e303d0e38b9f2013d0e980e13f7402fec11e06061f0e078bf78bfb8bdeb03ce8d1fb',
  mixer4: '8b1c3b5c0490720a8b5c06900bdb741d891c8e440290268a07f66c0e',
  mixer2: '8b1c3b5c0490720a8b5c06900bdb741d891c8e440290268a07f66c0e',
  mixer1: '8b1c3b5c0490720a8b5c06900bdb7423891c8e440290268a07f66c0e',
} as const;

function fromHex(s:string):Uint8Array { const out=new Uint8Array(s.length/2); for(let i=0;i<out.length;i++) out[i]=Number.parseInt(s.slice(i*2,i*2+2),16); return out; }
function eqAt(bytes:Uint8Array,off:number,hex:string):boolean { const e=fromHex(hex); return off>=0&&off+e.length<=bytes.length&&e.every((b,i)=>bytes[off+i]===b); }
function u16(bytes:Uint8Array,off:number):number { return new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint16(off,true); }
function u32(bytes:Uint8Array,off:number):number { return new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(off,true); }
async function sha256(bytes:Uint8Array):Promise<string>{const d=await crypto.subtle.digest('SHA-256',bytes.slice().buffer);return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');}
function find(entries:SourceFileEntry[],wanted:string):SourceFileEntry { const e=entries.find(x=>x.path.toUpperCase()===wanted.toUpperCase()); if(!e)throw new Error(`O94D required file missing: ${wanted}`); return e; }
function safe(path:string):string { return (path.split('/').at(-1)??path).replace(/[^A-Za-z0-9_.-]/g,'_'); }
function signedToWave(bytes:Uint8Array):Uint8Array { const out=new Uint8Array(bytes.length); for(let i=0;i<bytes.length;i++)out[i]=bytes[i]^0x80; return out; }

function driverPitchStep(sourceRate:number,referencePitch:number,outputRate:number,note=60,noteTable:number[]):number {
  const octave=Math.floor(note/12), semitone=note%12, shift=11-octave;
  const notePitch=noteTable[semitone]>>>shift;
  let den=(referencePitch*outputRate)>>>0, num=(notePitch*sourceRate)>>>0;
  let bx=(den>>>16)&0xffff, cx=den&0xffff, dx=(num>>>16)&0xffff, ax=num&0xffff;
  while(bx!==0){ const d=((bx<<16)>>>0|cx)>>>1; bx=(d>>>16)&0xffff;cx=d&0xffff;const n=((dx<<16)>>>0|ax)>>>1;dx=(n>>>16)&0xffff;ax=n&0xffff; }
  const n=((dx<<16)>>>0)|ax, q=Math.floor(n/cx), rem=n%cx; const frac=Math.floor((rem*65536)/cx)&0xffff;
  return (((q&0xffff)<<16)>>>0)|frac;
}

export interface MK2U8QualifiedWavAsset { path:string;fileBytes:number;sourceSha256:string;start:number;endExclusive:number;activeBytes:number;unreadBytes:number;sampleRate:number;referencePitch:number;activeSha256:string;wavSha256:string;wavBytes:number; }
export interface MK2U8PcmExportQualificationReport {
  format:'mk2_u8_pcm_export_qualification_o94d_v1';timestamp:string;operationId:string;
  provenance:{sourceKind:'user-loaded-directory';directoryName:string;synthetic:false;mk2ExeSha256:string;rmDrvSha256:string;gmiSha256:string};
  machineEvidence:{
    signedness:string;outputRebias:string;channelMeaning:string;
    rateFormula:string;directSampleNote:number;note60TableValue:number;referencePitchCorpusValue:number;sourceRateFieldOffset:16;referencePitchFieldOffset:18;
    configurableOutputRateState:string;defaultOutputRate:number;fixedPointStepExamples:Array<{sourceRate:number;outputRate:number;stepHex:string;effectiveSourceRate:number}>;
    exportBoundary:string;wavTransform:string;
  };
  corpus:{sampleCount:312;sourceRateCounts:Record<string,number>;unreadByteCounts:Record<string,number>;totalActiveBytes:number;assets:MK2U8QualifiedWavAsset[]};
  package:{fileName:'MK2_O94D_U8_BOUNDED_PCM_WAV_PACKAGE.zip';entryCount:number;originalEntries:312;wavEntries:312;metadataEntries:number;byteLength:number;sha256:string};
  decision:{signedPcmEstablished:true;monoSourceEstablished:true;sourceRateEstablishedForDirectSamplePath:true;runtimeActiveRangeEstablished:true;sourceDomainWavAuthorized:true;runtimeMixedOutputBitExactClaimed:false;unreadTailPurposeEstablished:false;verdict:'O94D_BOUNDED_SOURCE_DOMAIN_WAV_EXPORT_AUTHORIZED';narrative:string};
  status:'SUCCESS';validation:{allChecksPassed:true;checks:Array<{id:string;passed:boolean;detail:string}>};
}
export interface MK2U8PcmExportQualificationResult {report:MK2U8PcmExportQualificationReport;zipBytes:Uint8Array;wavAssets:Array<{sourcePath:string;filename:string;bytes:Uint8Array;sampleRate:number}>;}

export async function executeMK2U8PcmExportQualification(source:DirectorySource,o67:MK2FixtureResourceExecutableTopologyReport,o94a:MK2U8SampleStartCallerTraceReport,o94b:MK2U8EndFieldLifetimeReport,o94c:MK2U8TailRoleAuditReport):Promise<MK2U8PcmExportQualificationResult>{
  if(source.isSynthetic)throw new Error('O94D requires authentic MK2 fixture');
  if(o67.status!=='SUCCESS'||!o67.validation.allChecksPassed||o67.provenance.exeSha256!==EXPECTED_MK2_SHA256)throw new Error('O94D requires canonical O67');
  if(o94a.status!=='SUCCESS'||!o94a.validation.allChecksPassed||o94a.decision.wavAdapterAuthorized)throw new Error('O94D requires fail-closed O94A');
  if(o94b.status!=='SUCCESS'||!o94b.validation.allChecksPassed||o94b.decision.wavAdapterAuthorized)throw new Error('O94D requires fail-closed O94B');
  if(o94c.status!=='SUCCESS'||!o94c.validation.allChecksPassed||o94c.decision.wavAdapterAuthorized)throw new Error('O94D requires fail-closed O94C');
  const timestamp=new Date().toISOString(),operationId=createOperationId('mk2_u8_o94d_pcm_export_qualification');
  const entries=(await source.listRecursive()).slice().sort((a,b)=>a.path.localeCompare(b.path));
  const exeE=find(entries,'MK2.EXE'),rmE=find(entries,'RM.DRV'),gmiE=find(entries,'GMI.BIN');
  const [exe,rm,gmi]=await Promise.all([source.readSlice(exeE.path,0,exeE.size),source.readSlice(rmE.path,0,rmE.size),source.readSlice(gmiE.path,0,gmiE.size)]);
  const [mk2ExeSha256,rmDrvSha256,gmiSha256]=await Promise.all([sha256(exe),sha256(rm),sha256(gmi)]);
  const noteTable=Array.from({length:12},(_,i)=>u16(gmi,OFF.noteTable+i*2));
  const note60TableValue=noteTable[0]>>>6;
  const defaultOutputRate=u16(gmi,OFF.defaultOutputRateInstruction+4);
  const checks:Array<{id:string;passed:boolean;detail:string}>=[
    {id:'mk2_hash',passed:mk2ExeSha256===EXPECTED_MK2_SHA256,detail:mk2ExeSha256},{id:'rm_hash',passed:rmDrvSha256===EXPECTED_RM_SHA256,detail:rmDrvSha256},{id:'gmi_hash',passed:gmiSha256===EXPECTED_GMI_SHA256,detail:gmiSha256},
    {id:'ah10_dispatch',passed:u16(gmi,OFF.ah10DispatchWord)===OFF.setOutputRate,detail:`0x${u16(gmi,OFF.ah10DispatchWord).toString(16)}`},{id:'ah11_dispatch',passed:u16(gmi,OFF.ah11DispatchWord)===OFF.sampleStart,detail:`0x${u16(gmi,OFF.ah11DispatchWord).toString(16)}`},
    {id:'set_output_rate_signature',passed:eqAt(gmi,OFF.setOutputRate,SIG.setOutputRate),detail:'GMI+0x0C5A'},{id:'pitch_signature',passed:eqAt(gmi,OFF.pitch,SIG.pitch),detail:'GMI+0x0AFD'},
    {id:'sample_start_note60_call',passed:eqAt(gmi,OFF.sampleStart,SIG.sampleStartLead),detail:'GMI+0x0F03 loads AL=0x3C then calls 0x0AFD'},
    {id:'mixer4_signed_signature',passed:eqAt(gmi,OFF.mixer4,SIG.mixer4),detail:'GMI+0x0CF8'},{id:'mixer2_signed_signature',passed:eqAt(gmi,OFF.mixer2,SIG.mixer2),detail:'GMI+0x0DE2'},{id:'mixer1_signed_signature',passed:eqAt(gmi,OFF.mixer1,SIG.mixer1),detail:'GMI+0x0E68'},
    {id:'note60_value',passed:note60TableValue===262,detail:String(note60TableValue)},{id:'default_output_rate',passed:defaultOutputRate===16000,detail:String(defaultOutputRate)},
  ];
  if(checks.some(c=>!c.passed))throw new Error(`O94D machine validation failed: ${checks.filter(c=>!c.passed).map(c=>c.id).join(', ')}`);

  const u8=entries.filter(e=>e.path.toUpperCase().startsWith('FX/')&&e.extension.toUpperCase()==='U8');
  const assets:MK2U8QualifiedWavAsset[]=[],wavAssets:MK2U8PcmExportQualificationResult['wavAssets']=[],packageFiles:Array<{name:string;bytes:Uint8Array}>=[];
  const sourceRateCounts:Record<string,number>={},unreadByteCounts:Record<string,number>={};let totalActiveBytes=0;
  for(const e of u8){ const b=await source.readSlice(e.path,0,e.size);if(b.length!==e.size||b.length<HEADER_BYTES)throw new Error(`O94D short U8: ${e.path}`);
    const start=u32(b,0),end=u32(b,4),loop=u32(b,8),rate=u16(b,16),ref=u16(b,18);if((start>>>16)||(end>>>16)||(loop>>>16))throw new Error(`O94D high-word field unsupported: ${e.path}`);if(start!==32||loop!==0||end<=start||end>b.length)throw new Error(`O94D invalid range: ${e.path}`);if(rate!==11025&&rate!==22050)throw new Error(`O94D unsupported rate ${rate}: ${e.path}`);if(ref!==note60TableValue)throw new Error(`O94D reference pitch mismatch ${ref}: ${e.path}`);
    const active=b.subarray(start,end),wavData=signedToWave(active),wav=wavePcm(wavData,rate,1,8),parsed=parseWave(wav);if(parsed.encoding!==1||parsed.channels!==1||parsed.sampleRate!==rate||parsed.bits!==8||parsed.dataLength!==active.length)throw new Error(`O94D WAV parse mismatch: ${e.path}`);
    const wavPayload=wav.subarray(44,44+active.length);for(let i=0;i<active.length;i++)if((wavPayload[i]^0x80)!==active[i])throw new Error(`O94D WAV reverse mismatch: ${e.path} @${i}`);
    const [sourceSha256,activeSha256,wavSha256]=await Promise.all([sha256(b),sha256(active),sha256(wav)]),unread=b.length-end;
    const row:MK2U8QualifiedWavAsset={path:e.path,fileBytes:b.length,sourceSha256,start,endExclusive:end,activeBytes:active.length,unreadBytes:unread,sampleRate:rate,referencePitch:ref,activeSha256,wavSha256,wavBytes:wav.length};assets.push(row);wavAssets.push({sourcePath:e.path,filename:safe(e.path).replace(/\.u8$/i,'.wav'),bytes:wav,sampleRate:rate});
    const stem=safe(e.path).replace(/\.u8$/i,'');packageFiles.push({name:`samples/${stem}/original/${safe(e.path)}`,bytes:b},{name:`samples/${stem}/${stem}.wav`,bytes:wav});sourceRateCounts[String(rate)]=(sourceRateCounts[String(rate)]??0)+1;unreadByteCounts[String(unread)]=(unreadByteCounts[String(unread)]??0)+1;totalActiveBytes+=active.length;
  }
  assets.sort((a,b)=>a.path.localeCompare(b.path));wavAssets.sort((a,b)=>a.sourcePath.localeCompare(b.sourcePath));
  checks.push({id:'u8_count',passed:assets.length===312,detail:String(assets.length)},{id:'source_rate_distribution',passed:sourceRateCounts['11025']===190&&sourceRateCounts['22050']===122&&Object.keys(sourceRateCounts).length===2,detail:JSON.stringify(sourceRateCounts)},{id:'reference_pitch_all_262',passed:assets.every(a=>a.referencePitch===262),detail:'312/312'},{id:'unread_partition',passed:unreadByteCounts['33']===308&&unreadByteCounts['1']===4&&Object.keys(unreadByteCounts).length===2,detail:JSON.stringify(unreadByteCounts)},{id:'wav_roundtrip_all',passed:true,detail:'312/312 active byte spans reverse exactly via XOR 0x80'});
  const examples=[11025,22050].map(sourceRate=>{const step=driverPitchStep(sourceRate,262,16000,60,noteTable);return{sourceRate,outputRate:16000,stepHex:`0x${step.toString(16).toUpperCase().padStart(8,'0')}`,effectiveSourceRate:(step/65536)*16000};});
  const ratiosOk=examples.every(x=>Math.abs(x.effectiveSourceRate-x.sourceRate)<0.5);checks.push({id:'pitch_step_matches_source_rate',passed:ratiosOk,detail:JSON.stringify(examples)});
  if(checks.some(c=>!c.passed))throw new Error(`O94D validation failed: ${checks.filter(c=>!c.passed).map(c=>c.id).join(', ')}`);
  const manifest={format:'mk2_u8_o94d_bounded_pcm_wav_manifest_v1',pass:'1E.3O.94D',sourceIdentities:{mk2ExeSha256,rmDrvSha256,gmiSha256},contract:{activeInterval:'[u32+0,u32+4)',sourceEncoding:'signed 8-bit mono PCM',wavEncoding:'unsigned 8-bit mono PCM',byteTransform:'source XOR 0x80',sampleRateField:'+0x10',referencePitchField:'+0x12',referencePitchValue:262,directSampleNote:60,tailPurpose:'UNKNOWN / excluded from WAV'},assets};
  const readme=`# MK2 O94D bounded U8 PCM/WAV export\n\nThis package preserves all 312 authentic FX/*.U8 files and provides a source-domain mono 8-bit PCM WAVE for only the authenticated mixer-readable interval [disk +0, disk +4).\n\nQualified facts:\n- Sound Images one-, two-, and four-channel mixer kernels load one byte per source sample and use signed IMUL, establishing signed 8-bit source PCM.\n- Direct U8 sample start calls pitch routine 0x0AFD with note 60. The driver note-60 value is 262, equal to +0x12 in all 312 U8 headers.\n- +0x10 therefore supplies the source-rate term; the corpus contains only 11025 and 22050 Hz. The runtime's 16.16 resampler may quantize the exact mixed-output timing, so these WAVs represent the source-domain samples/rate, not a bit-exact capture of the runtime mixer output.\n- WAV 8-bit PCM is unsigned, so each active source byte is XORed with 0x80. Reversing that transform recovers the exact authenticated source span.\n\nBoundary:\nThe 33 unread bytes in 308 files and final unread byte in four files remain preserved only in original U8s. Their purpose is unknown and no semantic claim is made for them.\n`;
  packageFiles.push({name:'manifest.json',bytes:encoder.encode(JSON.stringify(manifest,null,2))},{name:'README.md',bytes:encoder.encode(readme)});packageFiles.sort((a,b)=>a.name.localeCompare(b.name));
  const zipBytes=buildStoredZip(packageFiles),zipSha=await sha256(zipBytes);const report:MK2U8PcmExportQualificationReport={format:'mk2_u8_pcm_export_qualification_o94d_v1',timestamp,operationId,provenance:{sourceKind:'user-loaded-directory',directoryName:source.directoryName,synthetic:false,mk2ExeSha256,rmDrvSha256,gmiSha256},machineEvidence:{signedness:'Authenticated 1/2/4-channel mixers load AL from sample memory then execute signed IMUL by volume.',outputRebias:'Runtime mixer converts mixed signed result to unsigned 8-bit output by adding 0x80; source WAV export performs the equivalent signed-to-unsigned byte rebias with XOR 0x80.',channelMeaning:'The four Sound Images mixer channels are simultaneous mono voices; each U8 descriptor supplies a single byte stream, not stereo interleaving.',rateFormula:'pitch 0x0AFD computes a 16.16 source-pointer step proportional to notePitch * U16(+0x10) / (U16(+0x12) * outputRate).',directSampleNote:60,note60TableValue,referencePitchCorpusValue:262,sourceRateFieldOffset:16,referencePitchFieldOffset:18,configurableOutputRateState:'GMI API AH=0x10 dispatches to 0x0C5A, which stores caller CX in state word 0x1302; initialization writes 16000. This denominator may vary without changing the identification of +0x10 as the source-rate term.',defaultOutputRate, fixedPointStepExamples:examples,exportBoundary:'O94C mixer-readable [start,end) only; unread tail bytes excluded.',wavTransform:'8-bit PCM WAVE is unsigned: wavByte = signedSourceByte XOR 0x80.'},corpus:{sampleCount:312,sourceRateCounts,unreadByteCounts,totalActiveBytes,assets},package:{fileName:'MK2_O94D_U8_BOUNDED_PCM_WAV_PACKAGE.zip',entryCount:packageFiles.length,originalEntries:312,wavEntries:312,metadataEntries:2,byteLength:zipBytes.length,sha256:zipSha},decision:{signedPcmEstablished:true,monoSourceEstablished:true,sourceRateEstablishedForDirectSamplePath:true,runtimeActiveRangeEstablished:true,sourceDomainWavAuthorized:true,runtimeMixedOutputBitExactClaimed:false,unreadTailPurposeEstablished:false,verdict:'O94D_BOUNDED_SOURCE_DOMAIN_WAV_EXPORT_AUTHORIZED',narrative:'O94D closes the bounded source-domain export contract without broadening the unresolved tail semantics. Authentic Sound Images mixer kernels consume one signed 8-bit sample byte per voice and the direct U8 path calls the pitch routine with note 60. The driver note-60 value is 262, exactly matching U8 +0x12 across all 312 files, so the pitch ratio collapses to U8 +0x10 divided by the configurable mixer output rate. This establishes +0x10 as the source sample rate for the qualified direct path. A mono 8-bit PCM WAV is therefore authorized for O94C\'s authenticated [start,end) source span at +0x10 Hz after signed-to-unsigned XOR 0x80. This is a source-domain reconstruction, not a bit-exact capture of the runtime resampler/mixer output, and bytes outside [start,end) remain semantically unknown.'},status:'SUCCESS',validation:{allChecksPassed:true,checks:checks.map(c=>({...c,passed:true}))}};
  return {report,zipBytes,wavAssets};
}

export function createMK2U8PcmExportQualificationExport(result:MK2U8PcmExportQualificationResult):MK2U8PcmExportQualificationReport { if(result.report.status!=='SUCCESS'||!result.report.validation.allChecksPassed||!result.report.decision.sourceDomainWavAuthorized)throw new Error('Verified O94D result required');return result.report; }
