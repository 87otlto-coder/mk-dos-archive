/**
 * P76: opt-in, SOURCE-FINGERPRINTED indexed image recovery for original DOS MK3.
 * The existing 9,186-item MK3 catalogue and raw source ranges stay unchanged
 * until the user explicitly requests these 19 additional representations.
 *
 * Row-X interpretation is SOURCE-CONSTRAINED / INFERRED, not EXE-proven.
 * Adjacent RGB8 bytes are original, but do NOT authenticate native palette
 * ownership. No inferred palette is automatically applied to preview pixels.
 */
import type { DirectorySource } from '../filesystem/DirectorySource';
import type { Asset } from './model';
import { hash, safeName, view } from './model';

export const MK3_P76_ORIGINAL_DATA_SHA =
  '72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517';
export const MK3_P76_ROW_MAP_FORMAT = 'MK3_P76_SOURCE_ROW_MAPPED_INDEXED_V1';
export const MK3_P76_RECOVERED_COUNT = 19;

function requireSource(ok: unknown, reason: string): asserts ok {
  if (!ok) throw new Error('P76 MK3 indexed source rows: ' + reason);
}
function safe(n: number, min: number, max: number) {
  return Number.isSafeInteger(n) && n >= min && n <= max;
}
export interface MK3P76RecoveredRegion {
  width: number;
  height: number;
  indices: Uint8Array;
  mask: Uint8Array;
  rgba: Uint8Array;
  rgb8Candidate: Uint8Array;
  firstStream: Uint8Array;
  rowXTable: Uint8Array;
  rowPointerTable: Uint8Array;
  regionOffset: number;
  regionLength: number;
  firstStreamOffset: number;
  firstStreamLength: number;
  rowXTableOffset: number;
  rowPointerTableOffset: number;
  afterTablesOffset: number;
  afterTablesLength: number;
  absentRows: number;
  packedRows: number;
  paintedPixels: number;
  unexplainedFinalByteHex: string;
}
/** Decodes exactly one already bounded source region. NOT a general MK3 codec. */
export function decodeMK3P76SourceRowRegion(
  original: Uint8Array, regionOffset: number, regionLength: number,
): MK3P76RecoveredRegion {
  requireSource(safe(regionOffset, 0, original.length) &&
    safe(regionLength, 792, original.length-regionOffset),
    'invalid original non-IFF region extent');
  const v = view(original);
  const width = v.getUint16(regionOffset, true);
  const height = v.getUint16(regionOffset+2, true);
  requireSource(safe(width, 1, 2048) && safe(height, 1, 1024) &&
    width*height <= 1_000_000, 'invalid original row-mapped dimensions');
  const firstStreamLength = v.getUint32(regionOffset+20, true);
  const firstStreamOffset = regionOffset+792;
  const firstStreamEnd = firstStreamOffset+firstStreamLength;
  const rowXTableOffset = firstStreamEnd;
  const rowPointerTableOffset = rowXTableOffset+height*4;
  const afterTablesOffset = rowPointerTableOffset+height*4;
  requireSource(safe(firstStreamLength, 2, regionLength-792) &&
    afterTablesOffset <= regionOffset+regionLength,
    'source compressed stream or row arrays exceed original region');
  const rowX: number[] = [], rowPointers: number[] = [], active: number[] = [];
  for (let y=0; y<height; y++) {
    const x = v.getInt32(rowXTableOffset+y*4,true);
    const pointer = v.getUint32(rowPointerTableOffset+y*4,true);
    requireSource(x===-1 || safe(x,0,width-1),
      'unrecognized source row X or absent-row sentinel');
    requireSource(x!==-1 || pointer===0,
      'absent source row unexpectedly has compressed offset');
    rowX.push(x);
    rowPointers.push(pointer);
    if (x!==-1) active.push(y);
  }
  requireSource(active.length>0 && rowPointers[active[0]]===0,
    'first active original row must begin at packed stream zero');
  for (let i=0; i<active.length; i++) {
    const start = rowPointers[active[i]];
    const end = i+1<active.length ? rowPointers[active[i+1]] : firstStreamLength;
    requireSource(start < end && end <= firstStreamLength,
      'original active-row compressed pointers not strictly increasing');
  }
  const indices = new Uint8Array(width*height);
  const mask = new Uint8Array(indices.length);
  const rgba = new Uint8Array(indices.length*4);
  let paintedPixels=0, finalByte = '';
  for (let k=0;k<active.length;k++) {
    const y=active[k];
    let position = firstStreamOffset+rowPointers[y];
    const end = firstStreamOffset+(k+1<active.length
      ? rowPointers[active[k+1]] : firstStreamLength);
    let x=rowX[y];
    for (;;) {
      requireSource(position+2<=end, 'packed row lacks a bounded terminator');
      const command=v.getInt16(position,true);
      position+=2;
      if (command===0) break;
      if (command<0) {
        x-=command;
        requireSource(x<=width, 'source transparent run exceeds row');
      } else {
        requireSource(position+command<=end && x+command<=width,
          'source literal run exceeds row or compressed pointer boundary');
        for (let j=0; j<command; j++) {
          const at = y*width+x+j, index=original[position+j];
          indices[at]=index;
          mask[at]=1;
          const c=32+Math.round(index*223/255), pixel=at*4;
          rgba[pixel]=c;rgba[pixel+1]=c;rgba[pixel+2]=c;rgba[pixel+3]=255;
        }
        paintedPixels+=command;
        position+=command;
        x+=command;
      }
    }
    const remaining=end-position;
    requireSource(remaining===0 || (remaining===1 && k===active.length-1),
      'unexpected trailing bytes following source row terminator');
    if (remaining===1) finalByte=original[position].toString(16).padStart(2,'0');
  }
  return {
    width,height,indices,mask,rgba,
    rgb8Candidate: original.slice(regionOffset+24,regionOffset+792),
    firstStream:original.slice(firstStreamOffset,firstStreamEnd),
    rowXTable:original.slice(rowXTableOffset,rowPointerTableOffset),
    rowPointerTable:original.slice(rowPointerTableOffset,afterTablesOffset),
    regionOffset,regionLength,firstStreamOffset,firstStreamLength,
    rowXTableOffset,rowPointerTableOffset,afterTablesOffset,
    afterTablesLength:regionOffset+regionLength-afterTablesOffset,
    absentRows:height-active.length,packedRows:active.length,paintedPixels,
    unexplainedFinalByteHex:finalByte,
  };
}
export interface MK3P76Recovery {
  assets: Asset[];
  report: {
    sourceWholeFileSha256: string;
    originalBaselineAssets: number;
    addedSourceRowMappedImages: number;
    originalIffImages: number;
    rawUnresolvedRegionsRetained: number;
    sourceRows: number;
    absentRows: number;
    indexedPositionsPerPlane: number;
    paintedPixels: number;
    unexplainedBytesAfterRowTables: number;
    newCatalogueAssets: number;
    originalCatalogueUnchanged: true;
    nativePaletteOwnershipVerified: false;
    originalRendererPlacementVerified: false;
  };
}
/**
 * Intended for explicit Asset Library opt-in after a complete MK3 scan.
 * Does not change either the source directory or the original collection.
 */
export async function recoverMK3P76RowMappedAssets(
  source: DirectorySource, baseline: readonly Asset[], signal?: AbortSignal,
): Promise<MK3P76Recovery> {
  signal?.throwIfAborted();
  const raw = baseline.filter(a=>a.kind==='raw' &&
    /(^|\/)DATA\.MK3$/i.test(a.source.path) && a.id.includes(':unknown:'));
  const forms = baseline.filter(a=>a.kind==='image' && 
    /(^|\/)DATA\.MK3$/i.test(a.source.path) &&
    a.metadata.paletteFormat==='IFF_CMAP_RGB8');
  requireSource(raw.length===20 && forms.length===416 &&
    baseline.length===9186,'expected verified original 9,186-asset MK3 source inventory');
  const sorted=[...raw].sort((a,b)=>a.source.offset-b.source.offset);
  const path=sorted[0].source.path;
  requireSource(raw.every(a=>a.source.path===path &&
    a.source.sha256===MK3_P76_ORIGINAL_DATA_SHA &&
    safe(a.source.offset,0,9_015_508) &&
    safe(a.source.length,1,9_015_508-a.source.offset)) &&
    forms.every(a=>a.source.path===path &&
      a.source.sha256===MK3_P76_ORIGINAL_DATA_SHA),
    'original DATA.MK3 gap/FORM provenance mismatch');
  const entries=await source.listRecursive();
  const original=entries.filter(e=>e.path===path && e.name.toUpperCase()==='DATA.MK3');
  requireSource(original.length===1 && original[0].size===9_015_508,
    'original complete DATA.MK3 not uniquely available');
  const data=await source.readSlice(path,0,original[0].size);
  signal?.throwIfAborted();
  requireSource(data.length===original[0].size &&
    await hash(data)===MK3_P76_ORIGINAL_DATA_SHA,
    'unrecognized original MK3 DATA.MK3 source bytes');
  // Validate the source's original 416 FORM and 20 gap extents, rather than
  // trusting a plausible name, source hash metadata or candidate body alone.
  const spans=[...forms.map(a=>({start:a.source.offset,end:a.source.offset+a.source.length})),
    ...sorted.map(a=>({start:a.source.offset,end:a.source.offset+a.source.length}))]
    .sort((a,b)=>a.start-b.start);
  let cursor=0;
  for (const span of spans) {
    requireSource(span.start===cursor && span.end>span.start && span.end<=data.length,
      'original IFF/unknown source ranges do not form a lossless partition');
    cursor=span.end;
  }
  requireSource(cursor===data.length && sorted[0].source.length===1_840_634,
    'unresolved original source range census differs');
  const assets:Asset[]=[];
  let rows=0,absent=0,positions=0,painted=0,remaining=0;
  for (let i=1;i<sorted.length;i++) {
    signal?.throwIfAborted();
    const gap=sorted[i];
    const q=decodeMK3P76SourceRowRegion(data,gap.source.offset,gap.source.length);
    const index=String(i).padStart(2,'0');
    const stem='MK3_DATA_NONIFF_P76_'+index;
    assets.push({
      id:path+':p76:row-mapped:'+index+':'+q.regionOffset,
      name:'Non-IFF source-row image '+index+' · '+q.width+'×'+q.height,
      group:'DATA.MK3 · recovered indexed (P76)',
      kind:'image',format:'Source-row-mapped indexed RLE',
      confidence:'Original source-indexed rows validated; renderer placement INFERRED; native palette UNKNOWN',
      source:{path,offset:q.regionOffset,length:q.regionLength,sha256:MK3_P76_ORIGINAL_DATA_SHA},
      width:q.width,height:q.height,rgba:q.rgba,
      metadata:{
        indices:q.indices,mask:q.mask,
        palette:'UNKNOWN',visualization:'GRAYSCALE_INDEX_MAP',
        sourceRowMapFormat:MK3_P76_ROW_MAP_FORMAT,
        originalNonIffRegionOrdinal:i,
        sourceFirstStreamOffset:q.firstStreamOffset,
        sourceFirstStreamLength:q.firstStreamLength,
        sourceRowXTableOffset:q.rowXTableOffset,
        sourceRowPointerTableOffset:q.rowPointerTableOffset,
        sourceUnparsedRemainderOffset:q.afterTablesOffset,
        sourceUnparsedRemainderBytes:q.afterTablesLength,
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
      },
      filename:safeName(stem)+'_INDEX_GRAYSCALE.png',
    });
    rows+=q.height;absent+=q.absentRows;positions+=q.indices.length;
    painted+=q.paintedPixels;remaining+=q.afterTablesLength;
  }
  requireSource(assets.length===MK3_P76_RECOVERED_COUNT &&
    rows===3015 && absent===271 && positions===2_050_843 &&
    painted===996_697 && remaining===1_611_110 &&
    new Set(assets.map(a=>a.id)).size===assets.length &&
    assets.every(a=>!baseline.some(b=>b.id===a.id)),
    'P75 original indexed row-map census mismatch');
  return {assets,report:{
    sourceWholeFileSha256:MK3_P76_ORIGINAL_DATA_SHA,
    originalBaselineAssets:baseline.length,
    addedSourceRowMappedImages:assets.length,
    originalIffImages:forms.length,
    rawUnresolvedRegionsRetained:raw.length,
    sourceRows:rows,absentRows:absent,indexedPositionsPerPlane:positions,
    paintedPixels:painted,unexplainedBytesAfterRowTables:remaining,
    newCatalogueAssets:baseline.length+assets.length,
    originalCatalogueUnchanged:true,
    nativePaletteOwnershipVerified:false,
    originalRendererPlacementVerified:false,
  }};
}
