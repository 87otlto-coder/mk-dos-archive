/**
 * P80: opt-in original DATA.MK3 leading source interval.
 * Original verified P79: one 320x200 source index plane followed by 216
 * individually bounded records (six empty). Continuations are raw bytes,
 * NOT decoded frames, stage actors or a native animation timeline.
 *
 * The 768-byte neighboring RGB8 table has UNKNOWN native ownership.
 * Base index-map preview is grayscale and opaque FOR VISUALIZATION ONLY;
 * no original transparency/alpha, palette or compositor is asserted.
 */
import type { DirectorySource } from '../filesystem/DirectorySource';
import type { Asset } from './model';
import { hash, safeName, view } from './model';
import { MK3_P76_ORIGINAL_DATA_SHA } from './mk3NonIffRowMappedP76';

export const MK3_P80_LEADING_FORMAT = 'MK3_P80_ORIGINAL_LEADING_INDEX_AND_RAW_RECORDS_V1';
export const MK3_P80_BASE_GROUP = 'DATA.MK3 · leading base indexed (P80)';
export const MK3_P80_RAW_GROUP = 'DATA.MK3 · leading raw continuations (P80)';
export const MK3_P80_SOURCE_OFFSET = 667_866;
export const MK3_P80_SOURCE_LENGTH = 1_840_634;
export const MK3_P80_SOURCE_RECORDS = 216;

function requireSource(ok: unknown, reason: string): asserts ok {
  if (!ok) throw new Error('P80 MK3 original leading interval: '+reason);
}
function safe(n: number, min: number, max: number): boolean {
  return Number.isSafeInteger(n) && n >= min && n <= max;
}
export interface MK3P80RawRecord {
  ordinal: number;
  offset: number;
  length: number;
  payloadOffset: number;
  payloadLength: number;
  tag: number;
  fieldA: number;
  fieldB: number;
  bytes: Uint8Array;
}
export interface MK3P80LeadingDecoded {
  width:number;
  height:number;
  declaredRecords:number;
  baseIndices:Uint8Array;
  candidateRgb8:Uint8Array;
  grayscaleRgba:Uint8Array;
  records:MK3P80RawRecord[];
  emptyRecordOrdinals:number[];
  totalPayloadBytes:number;
  sourceEndOffset:number;
}

/** Bounded source-format parser; source identity is enforced by recovery. */
export function decodeMK3P80LeadingSpan(
  span:Uint8Array, sourceOffset:number, signal?:AbortSignal,
):MK3P80LeadingDecoded {
  signal?.throwIfAborted();
  requireSource(safe(sourceOffset,0,9_015_508) && span.length>=782 &&
    safe(span.length,782,1_840_634) && sourceOffset+span.length<=9_015_508,
    'unrecognized or truncated bounded original source interval');
  const v=view(span);
  const declaredRecords=v.getUint16(0,true);
  const width=v.getUint16(2,true),height=v.getUint16(4,true);
  const reserved=v.getUint32(774,true),baseLength=v.getUint32(778,true);
  requireSource(safe(declaredRecords,1,1000) && safe(width,1,2048) &&
    safe(height,1,1024) && width*height<=64_000 &&
    reserved===0 && baseLength===width*height && 782+baseLength<=span.length,
    'invalid source base image geometry, reserved bytes or index extent');
  const baseIndices=span.slice(782,782+baseLength);
  const candidateRgb8=span.slice(6,774);
  const grayscaleRgba=new Uint8Array(baseIndices.length*4);
  for (let i=0;i<baseIndices.length;i++){
    const gray=32+Math.round(baseIndices[i]*223/255),p=i*4;
    grayscaleRgba[p]=gray;grayscaleRgba[p+1]=gray;
    grayscaleRgba[p+2]=gray;grayscaleRgba[p+3]=255;
  }
  let cursor=782+baseLength,totalPayloadBytes=0;
  const records:MK3P80RawRecord[]=[],emptyRecordOrdinals:number[]=[];
  for(let ordinal=0;ordinal<declaredRecords;ordinal++){
    signal?.throwIfAborted();
    requireSource(cursor+14<=span.length,
      'truncated original continuation record header');
    const tag=v.getUint16(cursor,true);
    const fieldA=v.getUint32(cursor+2,true);
    const fieldB=v.getUint32(cursor+6,true);
    const payloadLength=v.getUint32(cursor+10,true);
    const end=cursor+14+payloadLength;
    requireSource(tag===3 && safe(payloadLength,0,span.length-cursor-14) &&
      end<=span.length, 'invalid original record tag or source payload bound');
    requireSource(payloadLength!==0 || (fieldA===0 && fieldB===0),
      'empty source record has nonzero auxiliary fields');
    if(payloadLength===0) emptyRecordOrdinals.push(ordinal);
    records.push({ordinal,offset:sourceOffset+cursor,length:end-cursor,
      payloadOffset:sourceOffset+cursor+14,payloadLength,
      tag,fieldA,fieldB,bytes:span.slice(cursor,end)});
    totalPayloadBytes+=payloadLength;
    cursor=end;
  }
  requireSource(cursor===span.length,
    'source records do not exactly cover original interval');
  return {width,height,declaredRecords,baseIndices,candidateRgb8,
    grayscaleRgba,records,emptyRecordOrdinals,totalPayloadBytes,
    sourceEndOffset:sourceOffset+cursor};
}
export interface MK3P80Recovery {
  assets:Asset[];
  report:{
    originalWholeSourceSha256:string;
    previouslyVisibleAssets:9402;
    addedBaseIndexedImages:1;
    addedOriginalRawRecords:216;
    newVisibleAssets:9619;
    originalRawLeadingSpanPreserved:true;
    verifiedContiguousSourceParts:220;
    originalBaseWidth:320;
    originalBaseHeight:200;
    originalBaseIndexedPositions:64000;
    originalOpaqueAlphaKnown:false;
    originalPaletteOwnershipVerified:false;
    continuationFrameDecodingVerified:false;
    nativeStageMembershipOrTimingVerified:false;
    originalEmptyRecordCount:6;
    exactOriginalLeadingSpanCovered:1840634;
  };
}
/** Does not replace or mutate accepted P76/P78 image assets or raw sources. */
export async function recoverMK3P80LeadingAssets(
  source:DirectorySource, existing:readonly Asset[],signal?:AbortSignal,
):Promise<MK3P80Recovery>{
  signal?.throwIfAborted();
  requireSource(existing.length===9402,
    'accepted 9,402-item original MK3 P76/P78 opt-in collection required');
  const raw=existing.filter(a=>a.kind==='raw' &&
    /(^|\/)DATA\.MK3$/i.test(a.source.path) && a.id.includes(':unknown:'))
    .sort((a,b)=>a.source.offset-b.source.offset);
  const forms=existing.filter(a=>a.kind==='image' &&
    /(^|\/)DATA\.MK3$/i.test(a.source.path) &&
    a.metadata.paletteFormat==='IFF_CMAP_RGB8');
  const p76=existing.filter(a=>a.kind==='image' &&
    a.metadata.sourceRowMapFormat==='MK3_P76_SOURCE_ROW_MAPPED_INDEXED_V1' &&
    !a.metadata.sourceRecordFormat);
  const p78=existing.filter(a=>a.kind==='image' &&
    a.metadata.sourceRecordFormat==='MK3_P78_ADDITIONAL_CHAINED_SOURCE_INDEXED_V1');
  requireSource(raw.length===20 && forms.length===416 && p76.length===19 &&
    p78.length===197, 'accepted original IFF/unknown/P76/P78 inventories missing');
  const originalRaw=raw[0],path=originalRaw.source.path;
  requireSource(originalRaw.source.offset===MK3_P80_SOURCE_OFFSET &&
    originalRaw.source.length===MK3_P80_SOURCE_LENGTH &&
    [...raw,...forms,...p76,...p78].every(a=>a.source.path===path &&
      a.source.sha256===MK3_P76_ORIGINAL_DATA_SHA),
    'original source SHA/leading extent/provenance mismatch');
  const spans=[...raw,...forms].map(a=>({
    start:a.source.offset,end:a.source.offset+a.source.length,
  })).sort((a,b)=>a.start-b.start);
  let end=0;
  for(const span of spans){
    requireSource(span.start===end && span.end>end && span.end<=9_015_508,
      'original DATA.MK3 IFF/raw source partition changed');
    end=span.end;
  }
  requireSource(end===9_015_508,'original complete source partition missing');
  const entries=await source.listRecursive();
  const matched=entries.filter(e=>e.path===path && e.name.toUpperCase()==='DATA.MK3'
    && e.size===9_015_508);
  requireSource(matched.length===1,'original complete DATA.MK3 not unique');
  const original=await source.readSlice(path,0,9_015_508);
  signal?.throwIfAborted();
  requireSource(original.length===9_015_508 &&
    await hash(original)===MK3_P76_ORIGINAL_DATA_SHA,
    'unrecognized original DOS DATA.MK3 whole-file fingerprint');
  const decoded=decodeMK3P80LeadingSpan(
    original.subarray(MK3_P80_SOURCE_OFFSET,
      MK3_P80_SOURCE_OFFSET+MK3_P80_SOURCE_LENGTH),
    MK3_P80_SOURCE_OFFSET,signal);
  requireSource(decoded.declaredRecords===MK3_P80_SOURCE_RECORDS &&
    decoded.width===320 && decoded.height===200 &&
    decoded.baseIndices.length===64_000 &&
    decoded.totalPayloadBytes===1_772_828 &&
    decoded.records.length===216 &&
    decoded.emptyRecordOrdinals.length===6 &&
    decoded.emptyRecordOrdinals.every((v,i)=>v===120+i) &&
    decoded.sourceEndOffset===2_508_500,
    'original leading-span source P79 census mismatch');
  const baseOffset=MK3_P80_SOURCE_OFFSET+782;
  const base:Asset={
    id:path+':p80:leading-base:'+baseOffset,
    name:'Leading source index plane · 320×200 (P80)',
    group:MK3_P80_BASE_GROUP,kind:'image',
    format:'Source indexed base plane; preview opaque only',
    confidence:'Original index bytes VERIFIED; native opacity/palette/stage UNKNOWN',
    source:{path,offset:baseOffset,length:64_000,
      sha256:MK3_P76_ORIGINAL_DATA_SHA},
    width:320,height:200,rgba:decoded.grayscaleRgba,
    metadata:{
      indices:decoded.baseIndices,
      palette:'UNKNOWN',visualization:'GRAYSCALE_INDEX_MAP',
      sourceAdjacentRgb8Candidate:decoded.candidateRgb8,
      sourceFormat:MK3_P80_LEADING_FORMAT,
      originalLeadingSpanOffset:MK3_P80_SOURCE_OFFSET,
      originalLeadingSpanLength:MK3_P80_SOURCE_LENGTH,
      originalSourceHeaderBytes:Array.from(original.subarray(
        MK3_P80_SOURCE_OFFSET,MK3_P80_SOURCE_OFFSET+6)),
      sourceBaseIndexOffset:baseOffset,
      originalStoredRecordCount:216,
      candidateColorsNotAppliedToPreview:true,
      previewOpaqueForDisplayOnly:true,
      originalOpacityVerified:false,
      nativePaletteOwnershipVerified:false,
      nativeStageMembershipVerified:false,
      continuationFramesDecoded:false,
      nativeAnimationTimingVerified:false,
    },
    filename:'MK3_DATA_LEADING_P80_BASE_INDEX_GRAYSCALE.png',
  };
  const continuationAssets=decoded.records.map(rec=>({
    id:path+':p80:stored-record:'+String(rec.ordinal).padStart(3,'0')+':'+rec.offset,
    name:'Leading source record '+String(rec.ordinal).padStart(3,'0')+
      ' · '+rec.payloadLength.toLocaleString('en-US')+' bytes (raw)',
    group:MK3_P80_RAW_GROUP,kind:'raw' as const,
    format:'Original 14-byte tag/fields + opaque stored payload',
    confidence:'Exact stored source extent VERIFIED; native frame/rendering UNKNOWN',
    source:{path,offset:rec.offset,length:rec.length,
      sha256:MK3_P76_ORIGINAL_DATA_SHA},
    bytes:rec.bytes,
    metadata:{
      sourceFormat:MK3_P80_LEADING_FORMAT,
      originalRecordOrdinal:rec.ordinal,
      originalRecordTag:rec.tag,
      originalAuxiliaryFieldA:rec.fieldA,
      originalAuxiliaryFieldB:rec.fieldB,
      originalPayloadOffset:rec.payloadOffset,
      originalPayloadLength:rec.payloadLength,
      originalRecordMayHaveEmptyPayload:rec.payloadLength===0,
      sourceRecordOrderIsNotNativeAnimationOrder:true,
      originalRecordIsNotDecodedFrame:true,
      nativePaletteOwnershipVerified:false,
      nativeStageMembershipVerified:false,
      nativeAnimationTimingVerified:false,
    },
    filename:safeName('MK3_DATA_LEADING_P80_RECORD_'+
      String(rec.ordinal).padStart(3,'0'))+'.bin',
    mime:'application/octet-stream',
  } satisfies Asset));
  const assets=[base,...continuationAssets];
  const existingIds=new Set(existing.map(a=>a.id));
  requireSource(assets.length===217 &&
    assets.every(a=>!existingIds.has(a.id)) &&
    new Set(assets.map(a=>a.id)).size===assets.length,
    'P80 original source IDs collide with existing assets');
  return {assets,report:{
    originalWholeSourceSha256:MK3_P76_ORIGINAL_DATA_SHA,
    previouslyVisibleAssets:9402,
    addedBaseIndexedImages:1,
    addedOriginalRawRecords:216,
    newVisibleAssets:9619,
    originalRawLeadingSpanPreserved:true,
    verifiedContiguousSourceParts:220,
    originalBaseWidth:320,
    originalBaseHeight:200,
    originalBaseIndexedPositions:64000,
    originalOpaqueAlphaKnown:false,
    originalPaletteOwnershipVerified:false,
    continuationFrameDecodingVerified:false,
    nativeStageMembershipOrTimingVerified:false,
    originalEmptyRecordCount:6,
    exactOriginalLeadingSpanCovered:1840634,
  }};
}
