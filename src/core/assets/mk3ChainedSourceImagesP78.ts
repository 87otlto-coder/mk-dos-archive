/**
 * P78: additional original-source-chained MK3 indexed graphics AFTER the
 * separately accepted P76 first 19 row-mapped images. Strict opt-in; does
 * not modify the 9,186 baseline, 19 P76 entries or 20 original raw gaps.
 *
 * The repeated source row X/offset table geometry is source-constrained
 * INFERRED, not verified native DOS EXE renderer positioning. Adjacent RGB8
 * is an unlabeled source candidate, NEVER a verified runtime palette.
 * Source record encounter order is NOT gameplay animation order/timing.
 */
import type { DirectorySource } from '../filesystem/DirectorySource';
import type { Asset } from './model';
import { hash, safeName } from './model';
import {
  decodeMK3P76SourceRowRegion,
  MK3_P76_ORIGINAL_DATA_SHA,
  MK3_P76_ROW_MAP_FORMAT,
} from './mk3NonIffRowMappedP76';
import type { MK3P76RecoveredRegion } from './mk3NonIffRowMappedP76';

export const MK3_P78_SOURCE_CHAIN_FORMAT = 'MK3_P78_ADDITIONAL_CHAINED_SOURCE_INDEXED_V1';
export const MK3_P78_NEW_RECORDS = 197;
export const MK3_P78_ALL_ORIGINAL_SOURCE_RECORDS = 216;
export const MK3_P78_GROUP_COUNTS = [
  2,11,50,16,5,2,6,1,4,19,4,5,5,28,2,1,4,12,39,
] as const;
export const MK3_P78_ADDITIONAL_GROUP = 'DATA.MK3 · additional chained indexed (P78)';

function evidence(ok: unknown, why: string): asserts ok {
  if (!ok) throw new Error('P78 original MK3 chained indexed source: ' + why);
}
function planeEquals(a: unknown, b: Uint8Array): boolean {
  if (!(a instanceof Uint8Array) || a.length!==b.length) return false;
  for (let i=0;i<b.length;i++) if (a[i]!==b[i]) return false;
  return true;
}
export interface MK3P78ChainedGap {
  first: MK3P76RecoveredRegion;
  additional: MK3P76RecoveredRegion[];
  exactEnd: number;
}
/** Source-only, bounded reuse of the independently accepted P76 row decoder. */
export function decodeMK3P78ChainedGap(
  original: Uint8Array, start: number, length: number, signal?: AbortSignal,
): MK3P78ChainedGap {
  signal?.throwIfAborted();
  evidence(Number.isSafeInteger(start) && Number.isSafeInteger(length) &&
    start>=0 && length>=792 && start+length<=original.length,
    'invalid original source group bounds');
  const end=start+length;
  const first=decodeMK3P76SourceRowRegion(original,start,length);
  const additional:MK3P76RecoveredRegion[]=[];
  let at=first.afterTablesOffset;
  evidence(start<at && at<=end, 'first source record not bounded');
  while (at<end) {
    signal?.throwIfAborted();
    evidence(additional.length<999,'unexpectedly large source chain');
    const next=decodeMK3P76SourceRowRegion(original,at,end-at);
    evidence(next.afterTablesOffset>at && next.afterTablesOffset<=end,
      'source chain did not advance to original interval boundary');
    additional.push(next);
    at=next.afterTablesOffset;
  }
  evidence(at===end,'unparsed trailing source bytes between records');
  return {first,additional,exactEnd:at};
}
export interface MK3P78ChainedRecovery {
  assets:Asset[];
  report:{
    originalSourceWholeSha256:string;
    previousP76VisibleAssets:number;
    preservedP76FirstIndexedRecords:19;
    preservedRawOriginalRegions:20;
    newChainedIndexedImages:197;
    sourceTotalIndexedImageRecords:216;
    additionalIndexedPositionsPerPlane:number;
    additionalOriginalPaintedPixels:number;
    additionalSourceMinusOneRows:number;
    additionalDeclaredRows:number;
    originalP75PostTableBytesConsumed:number;
    originalFirstNonIffBytesStillUnresolved:1840634;
    visibleAfterExplicitOptIn:9402;
    sourceBytePartitionVerified:true;
    originalP76CatalogUnchanged:true;
    nativePaletteOwnershipVerified:false;
    nativeRendererOrStageOrTimingVerified:false;
  };
}
/** Requires the already accepted P76 opt-in 9,205-asset library. */
export async function recoverMK3P78AdditionalChainedAssets(
  source:DirectorySource, existing:readonly Asset[], signal?:AbortSignal,
):Promise<MK3P78ChainedRecovery> {
  signal?.throwIfAborted();
  evidence(existing.length===9205,'P76 9,205-item opt-in collection must already be loaded');
  const raw=existing.filter(a=>a.kind==='raw' &&
    /(^|\/)DATA\.MK3$/i.test(a.source.path) && a.id.includes(':unknown:'))
    .sort((a,b)=>a.source.offset-b.source.offset);
  const forms=existing.filter(a=>a.kind==='image' &&
    /(^|\/)DATA\.MK3$/i.test(a.source.path) &&
    a.metadata.paletteFormat==='IFF_CMAP_RGB8');
  const p76=existing.filter(a=>a.kind==='image' &&
    a.metadata.sourceRowMapFormat===MK3_P76_ROW_MAP_FORMAT);
  evidence(raw.length===20 && forms.length===416 && p76.length===19,
    'original IFF, unknown and accepted P76 first-image inventories incomplete');
  const path=raw[0].source.path;
  evidence(raw[0].source.length===1_840_634 &&
    [...raw,...forms,...p76].every(a=>a.source.path===path &&
      a.source.sha256===MK3_P76_ORIGINAL_DATA_SHA),
    'original DATA.MK3 source provenance does not match P76');
  evidence(new Set(p76.map(a=>a.metadata.originalNonIffRegionOrdinal)).size===19,
    'duplicated accepted P76 first-region identity');
  const entries=await source.listRecursive();
  const originals=entries.filter(e=>e.path===path &&
    e.name.toUpperCase()==='DATA.MK3' && e.size===9_015_508);
  evidence(originals.length===1,'original DOS DATA.MK3 not uniquely available');
  const bytes=await source.readSlice(path,0,9_015_508);
  signal?.throwIfAborted();
  evidence(bytes.length===9_015_508 &&
    await hash(bytes)===MK3_P76_ORIGINAL_DATA_SHA,
    'unrecognized complete original DOS DATA.MK3 bytes');
  const spans=[...raw,...forms].map(a=>({
    start:a.source.offset,end:a.source.offset+a.source.length,
  })).sort((a,b)=>a.start-b.start);
  let offset=0;
  for (const span of spans) {
    evidence(span.start===offset && span.end>offset &&
      span.end<=bytes.length,'original IFF/non-IFF source ranges not losslessly partitioned');
    offset=span.end;
  }
  evidence(offset===bytes.length,'original source partition incomplete');
  const assets:Asset[]=[];
  let pixels=0,painted=0,absent=0,rows=0,chainedBytes=0,totalRecords=0;
  for(let region=1;region<raw.length;region++) {
    signal?.throwIfAborted();
    const gap=raw[region];
    const first=p76.find(a=>a.metadata.originalNonIffRegionOrdinal===region);
    evidence(!!first && first.source.offset===gap.source.offset &&
      first.source.length===gap.source.length &&
      first.metadata.palette==='UNKNOWN' &&
      first.metadata.nativePaletteOwnershipVerified===false &&
      first.metadata.originalRendererPlacementVerified===false,
      'accepted P76 original first record or provenance is missing/modified');
    const chain=decodeMK3P78ChainedGap(
      bytes,gap.source.offset,gap.source.length,signal);
    evidence(planeEquals(first.metadata.indices,chain.first.indices) &&
      planeEquals(first.metadata.mask,chain.first.mask) &&
      planeEquals(first.metadata.firstStream,chain.first.firstStream) &&
      planeEquals(first.metadata.rowXTable,chain.first.rowXTable) &&
      planeEquals(first.metadata.rowPointerTable,chain.first.rowPointerTable) &&
      planeEquals(first.metadata.sourceAdjacentRgb8Candidate,chain.first.rgb8Candidate) &&
      first.metadata.sourceUnparsedRemainderOffset===chain.first.afterTablesOffset,
      'original P76 first-image source bytes/row geometry changed');
    evidence(chain.additional.length+1===MK3_P78_GROUP_COUNTS[region-1],
      'original source chained-record group count changed');
    chainedBytes+=gap.source.offset+gap.source.length-chain.first.afterTablesOffset;
    totalRecords+=chain.additional.length+1;
    for(const [ordinal,q] of chain.additional.entries()) {
      signal?.throwIfAborted();
      const recordNumber=ordinal+1;
      const index=String(region).padStart(2,'0');
      const num=String(recordNumber).padStart(3,'0');
      const stem='MK3_DATA_NONIFF_P78_'+index+'_'+num;
      const exactLength=q.afterTablesOffset-q.regionOffset;
      evidence(exactLength>=792 && exactLength<=gap.source.length,
        'invalid original chained source record extent');
      assets.push({
        id:path+':p78:source-chain:'+index+':'+num+':'+q.regionOffset,
        name:'Non-IFF chained image '+index+' / '+num+' · '+q.width+'×'+q.height,
        group:MK3_P78_ADDITIONAL_GROUP,
        kind:'image',format:'Original source-chained indexed RLE',
        confidence:'Original indexed rows/source chain verified; native geometry INFERRED; palette UNKNOWN',
        source:{path,offset:q.regionOffset,length:exactLength,
          sha256:MK3_P76_ORIGINAL_DATA_SHA},
        width:q.width,height:q.height,rgba:q.rgba,
        metadata:{
          indices:q.indices,mask:q.mask,
          palette:'UNKNOWN',visualization:'GRAYSCALE_INDEX_MAP',
          sourceRecordFormat:MK3_P78_SOURCE_CHAIN_FORMAT,
          sourceRowMapFormat:MK3_P76_ROW_MAP_FORMAT,
          originalNonIffRegionOrdinal:region,
          sourceRecordOrdinalWithinRegion:recordNumber,
          sourceFirstP76AssetId:first.id,
          sourceFirstP76Offset:first.source.offset,
          sourceRecordEndOffset:q.afterTablesOffset,
          sourceFirstStreamOffset:q.firstStreamOffset,
          sourceFirstStreamLength:q.firstStreamLength,
          sourceRowXTableOffset:q.rowXTableOffset,
          sourceRowPointerTableOffset:q.rowPointerTableOffset,
          sourceLaterChainedRecordBytes:gap.source.offset+gap.source.length-q.afterTablesOffset,
          sourceRowsWithPackedData:q.packedRows,
          sourceAbsentRows:q.absentRows,
          sourcePaintedPixels:q.paintedPixels,
          unexplainedFinalSourceByteHex:q.unexplainedFinalByteHex,
          firstStream:q.firstStream,rowXTable:q.rowXTable,
          rowPointerTable:q.rowPointerTable,
          sourceAdjacentRgb8Candidate:q.rgb8Candidate,
          candidateColorsNotAppliedToPreview:true,
          nativePaletteOwnershipVerified:false,
          originalRendererPlacementVerified:false,
          originalStageOrAnimationMembershipVerified:false,
          sourceRecordOrderIsNotNativeAnimationOrder:true,
        },
        filename:safeName(stem)+'_INDEX_GRAYSCALE.png',
      });
      pixels+=q.indices.length;
      painted+=q.paintedPixels;
      absent+=q.absentRows;
      rows+=q.height;
    }
  }
  evidence(totalRecords===MK3_P78_ALL_ORIGINAL_SOURCE_RECORDS &&
    assets.length===MK3_P78_NEW_RECORDS &&
    pixels===6_616_595 && painted===1_167_687 &&
    absent===8_475 && rows===21_796 && chainedBytes===1_611_110,
    'independently observed original 216-record source census mismatch');
  const ids=new Set(existing.map(a=>a.id));
  evidence(assets.every(a=>!ids.has(a.id)) &&
    new Set(assets.map(a=>a.id)).size===assets.length,
    'new source record IDs collide with existing P76 or raw assets');
  return {assets,report:{
    originalSourceWholeSha256:MK3_P76_ORIGINAL_DATA_SHA,
    previousP76VisibleAssets:existing.length,
    preservedP76FirstIndexedRecords:19,
    preservedRawOriginalRegions:20,
    newChainedIndexedImages:197,
    sourceTotalIndexedImageRecords:216,
    additionalIndexedPositionsPerPlane:pixels,
    additionalOriginalPaintedPixels:painted,
    additionalSourceMinusOneRows:absent,
    additionalDeclaredRows:rows,
    originalP75PostTableBytesConsumed:chainedBytes,
    originalFirstNonIffBytesStillUnresolved:1840634,
    visibleAfterExplicitOptIn:9402,
    sourceBytePartitionVerified:true,
    originalP76CatalogUnchanged:true,
    nativePaletteOwnershipVerified:false,
    nativeRendererOrStageOrTimingVerified:false,
  }};
}
