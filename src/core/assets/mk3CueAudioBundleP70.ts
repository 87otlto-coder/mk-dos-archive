/**
 * P70: source-faithful original GOG MK3 CD audio CUE and tracks 02–47.
 * Original CUE and all 46 Ogg streams are copied WITHOUT transcoding.
 *
 * The original installation's CUE says "MP3" even though the referenced
 * source files have OggS signatures. This mismatch is preserved/qualified,
 * not rewritten as a statement about DOS runtime decoding or game cues.
 *
 * Track 01 MK3.GOG MODE1/2048 is a separate binary data track and is NOT
 * part of this audio-only ZIP. No native gameplay track assignment claimed.
 */
import { Asset, hash, utf8 } from './model';
import { buildStoredZip } from '../research/researchArtifactDownloads';

export const MK3_P70_FORMAT='mk3_p70_gog_original_cue_audio_tracks_v1';
export const MK3_P70_ARCHIVE='MK3_P70_GOG_CUE_AUDIO_TRACKS_02-47.zip';
type AudioTrack={cueTrackNumber:number; cueReferencedFilename:string;
  cueFileDeclaredType:string; cueIndexStatement:string; };

function requireEvidence(ok:unknown,what:string):asserts ok{
  if(!ok)throw new Error('P70 MK3 CUE audio source: '+what);
}
function basename(p:string){return p.split('/').at(-1)??'';}
function sourceDir(p:string){const at=p.lastIndexOf('/');return at<0?'':p.slice(0,at+1);}
function exactFile(p:string):boolean{return !!p&&p.split('/').every(s=>!!s&&s!=='.'&&s!=='..')&&!p.includes('\\')&&!p.startsWith('/');}
function bytesEqual(a:Uint8Array,b:Uint8Array):boolean {
  return a.length===b.length&&a.every((v,i)=>v===b[i]);
}
function parseCue(source:Uint8Array):AudioTrack[]{
 const text=new TextDecoder('utf-8',{fatal:true}).decode(source);
 requireEvidence(!text.includes('\0'),'NUL bytes in original CUE');
 const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 requireEvidence(lines.length===47*3,'expected exactly 47 original CUE file/track/index triples');
 const tracks:AudioTrack[]=[];
 for(let ordinal=1;ordinal<=47;ordinal++){
  const pos=(ordinal-1)*3,file=lines[pos],track=lines[pos+1],index=lines[pos+2];
  const m=/^FILE "([^"\/]+)" (BINARY|MP3)$/.exec(file);
  requireEvidence(m,'invalid CUE FILE declaration for track '+ordinal);
  const t=/^TRACK ([0-9]{2}) (AUDIO|MODE1\/2048)$/.exec(track);
  requireEvidence(t&&Number(t[1])===ordinal,'noncanonical CUE track number/order '+ordinal);
  requireEvidence(index==='INDEX 0 00:00:00',
    'unverified CUE index or original track time for '+ordinal);
  if(ordinal===1){
   requireEvidence(m[1]==='MK3.GOG'&&m[2]==='BINARY'&&t[2]==='MODE1/2048',
     'missing original binary data track 01');
   continue;
  }
  requireEvidence(m[1]===`Track${String(ordinal).padStart(2,'0')}.ogg` &&
    m[2]==='MP3'&&t[2]==='AUDIO','original GOG Ogg audio CUE mismatch for track '+ordinal);
  tracks.push({cueTrackNumber:ordinal,cueReferencedFilename:m[1],
    cueFileDeclaredType:m[2],cueIndexStatement:index});
 }
 requireEvidence(tracks.length===46,'must preserve exactly 46 GOG audio tracks');
 return tracks;
}
function completeOriginal(a:Asset,sourcePath:string,label:string){
 requireEvidence(a.source.path===sourcePath && a.source.offset===0 &&
   a.bytes instanceof Uint8Array && a.bytes.length===a.source.length &&
   a.bytes.length>0 && !!a.source.sha256 && /^[0-9a-f]{64}$/.test(a.source.sha256),
   'incomplete original source asset '+label);
}
export interface MK3CueMusicBundleP70{
 name:typeof MK3_P70_ARCHIVE;bytes:Uint8Array;
 report:{status:'VERIFIED';originalCuePath:string;originalOggTracks:46;
   completeOriginalAudioBytes:number;sourceBytesPreserved:true;
   dataTrack01Included:false;nativeRuntimeSongAssociationsClaimed:false};
}
export async function buildMK3CueMusicBundleP70(assets:readonly Asset[],signal?:AbortSignal)
:Promise<MK3CueMusicBundleP70>{
 signal?.throwIfAborted();
 const cues=assets.filter(a=>a.kind==='raw'&&/(^|\/)MK3\.cue$/i.test(a.source.path));
 requireEvidence(cues.length===1,'one and only one original MK3.cue source asset');
 const cue=cues[0],cuePath=cue.source.path;
 requireEvidence(exactFile(cuePath)&&cue.format.toUpperCase()==='CUE',
   'unqualified original MK3 CUE file/path');
 completeOriginal(cue,cuePath,'MK3.cue');
 const cueSha=await hash(cue.bytes!);
 requireEvidence(cue.source.sha256===cueSha,'original CUE source SHA mismatch');
 const tracks=parseCue(cue.bytes!);
 const prefix=sourceDir(cuePath);
 const matched=new Set<string>();
 const payloads:Array<{name:string;bytes:Uint8Array}>=[
  {name:'MK3.cue',bytes:cue.bytes!}];
 const trackRecords:Array<Record<string,unknown>>=[];
 let total=0;
 for(const cueTrack of tracks){
  signal?.throwIfAborted();
  const sourcePath=prefix+cueTrack.cueReferencedFilename;
  const matches=assets.filter(a=>a.source.path===sourcePath&&a.kind==='music');
  requireEvidence(matches.length===1,'CUE audio has missing/duplicate source '+sourcePath);
  const audio=matches[0];
  requireEvidence(!matched.has(sourcePath),'duplicate original audio source');
  matched.add(sourcePath);
  requireEvidence(audio.format==='OGG'&&audio.mime==='audio/ogg'&&
    audio.filename===cueTrack.cueReferencedFilename,
    'unqualified referenced Ogg source '+sourcePath);
  completeOriginal(audio,sourcePath,sourcePath);
  requireEvidence(bytesEqual(audio.bytes!.subarray(0,4),utf8.encode('OggS')),
    'original referenced file is not an Ogg stream '+sourcePath);
  const originalHash=await hash(audio.bytes!);
  requireEvidence(originalHash===audio.source.sha256,
    'original CUE-referenced Ogg SHA-256 mismatch '+sourcePath);
  const archivePath=cueTrack.cueReferencedFilename; // original CUE relative name
  payloads.push({name:archivePath,bytes:audio.bytes!});
  total+=audio.bytes!.length;
  trackRecords.push({...cueTrack,originalAssetId:audio.id,
    originalSourcePath:sourcePath,originalSourceOffset:0,
    originalSourceByteLength:audio.bytes!.length,
    originalSourceSha256:originalHash,archiveMember:archivePath,
    originalAudioSignature:'OggS',cueDeclaresFileTypeMP3:true,
    nativeSoundHardwareDecodingVerified:false,
    gameplayStageCueVerified:false,originalLoopAndTimingVerified:false});
 }
 const manifest={
  format:MK3_P70_FORMAT,
  originalCuePath:cuePath,originalCueBytes:cue.bytes!.length,
  originalCueSha256:cueSha,
  originalCueArchiveMember:'MK3.cue',
  originalOggTracks:tracks.length,
  originalAudioSourceBytes:total,
  cueFileStatementsCopiedByteForByte:true,
  cueDeclaredAudioFileType:'MP3',
  actualAudioContainerSignature:'OggS',
  cueIndexStatementsAreLiteralNotRuntimeTimings:true,
  originalBinaryDataTrack01:{cueReferencedFilename:'MK3.GOG',
    cueDeclaredType:'BINARY',cueTrackMode:'MODE1/2048',
    cueIndexStatement:'INDEX 0 00:00:00',includedInAudioOnlyArchive:false},
  dataTrack01NotIncluded:true,
  completeReconstructedCdImageClaimed:false,
  nativeDosRuntimeSongAssociationsClaimed:false,
  nativeMusicLoopDurationsClaimed:false,
  trackRecords,
 };
 payloads.push({name:'manifest.json',bytes:utf8.encode(JSON.stringify(manifest,null,2)+'\n')});
 payloads.push({name:'README.txt',bytes:utf8.encode(
  'P70 ORIGINAL GOG MK3 AUDIO-TRACK EXPORT (TRACKS 02–47)\n\n'+
  'This package contains the original MK3.cue bytes and 46 original Ogg files; '+
  'it DOES NOT contain data track 01 MK3.GOG, so it is NOT a complete disc image.\n'+
  'The CUE file itself declares the .ogg files as MP3; this contradictory '+
  'source statement is preserved and explicitly recorded in manifest.json.\n'+
  'Do not interpret CUE order or INDEX 0 as DOS runtime song names, gameplay '+
  'events, stage music assignments, hardware timbre, loop length or timing.\n')});
 return {name:MK3_P70_ARCHIVE,bytes:buildStoredZip(payloads),
  report:{status:'VERIFIED',originalCuePath:cuePath,originalOggTracks:46,
   completeOriginalAudioBytes:total,sourceBytesPreserved:true,
   dataTrack01Included:false,nativeRuntimeSongAssociationsClaimed:false}};
}
