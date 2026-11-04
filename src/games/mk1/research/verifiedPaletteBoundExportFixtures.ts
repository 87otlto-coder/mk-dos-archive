/**
 * MK1 verified palette-bound export fixtures — Pass 1E.3O.23.
 *
 * Read-only end-to-end export proof using only already-qualified palette bindings:
 *  - Kano heart rip -> BLOOD_P (O2)
 *  - Rayden normal lightning -> MORPH_P (O4)
 *
 * Produces deterministic RGBA payloads in-memory and a JSON-safe checksum report.
 * Multi-part heart composites use structural part order only as a preview layering
 * policy; final runtime z-order is deliberately not promoted.
 */
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { decodeUgraSprite } from '../graphics/ugraDecoder';
import { MK1MultiPartFrameLosslessIrReport } from './multiPartFrameLosslessIr';
import { MK1RaydenLightningPlacementReport } from './raydenLightningPlacementFixture';

function rgbWord(word:number):[number,number,number]{
  const c=(shift:number)=>Math.round(((((word>>>shift)&31)*2+1)*255)/63);
  return [c(10),c(5),c(0)];
}
function rgbaChecksum(bytes:Uint8Array):string{let h=0x811c9dc5;for(const b of bytes){h^=b;h=Math.imul(h,0x01000193);}return(h>>>0).toString(16).padStart(8,'0');}
function imageEntry(entries:Awaited<ReturnType<DirectorySource['listRecursive']>>,wanted:string){const u=wanted.toUpperCase();const e=entries.find(x=>x.path.toUpperCase()===u||x.name.toUpperCase()===u.split('/').pop());if(!e)throw new Error(`O23 resource missing ${wanted}`);return e;}
function colorize(indices:Uint8Array,mask:Uint8Array,words:number[]){const rgba=new Uint8Array(indices.length*4);let out=0,opaque=0;for(let i=0;i<indices.length;i++){if(!mask[i])continue;opaque++;const idx=indices[i];if(idx<1||idx>words.length){out++;continue;}const [r,g,b]=rgbWord(words[idx-1]),p=i*4;rgba[p]=r;rgba[p+1]=g;rgba[p+2]=b;rgba[p+3]=255;}return{rgba,outOfPaletteRange:out,opaquePixelCount:opaque};}

export interface MK1RgbaPreviewPayload {key:string;width:number;height:number;rgba:Uint8Array;metadata:Record<string,unknown>}
export interface MK1VerifiedPaletteBoundExportFixturesReport {
 format:'mk1_verified_palette_bound_export_fixtures_v1';timestamp:string;operationId:string;
 provenance:MK1MultiPartFrameLosslessIrReport['provenance'];
 prerequisite:{o2OperationId:string;o4OperationId:string;validationPassed:true};
 heart:{characterId:1;animationIndex:67;resourcePath:'GRAPHICS/MISC.GRA';paletteSymbol:'BLOOD_P';paletteLength:number;paletteRgb:Array<[number,number,number]>;zOrderPolicy:'STRUCTURAL_PART_ORDER_PREVIEW_ONLY';finalRuntimeZOrderEstablished:false;frames:Array<{frameKey:string;sequence:'PRIMARY'|'BEAT_LOOP';sequenceFrameIndex:number;recordWatcomOffset:number;partSymbols:string[];partCount:number;width:number;height:number;anchorCanvasX:number;anchorCanvasY:number;rgbaChecksum:string;opaquePixelCount:number;outOfPaletteRangeCount:number;layerChecksums:string[]}>};
 lightning:{characterId:2;setupAnimationIndex:60;travelAnimationIndex:34;resourcePath:'GRAPHICS/RAIDEN.GRA';paletteSymbol:'MORPH_P';paletteLength:number;paletteRgb:Array<[number,number,number]>;sprites:Array<{symbol:string;phase:'SETUP'|'INITIAL'|'CONTINUATION'|'PERSISTENT_LOOP';width:number;height:number;x:number;y:number;rgbaChecksum:string;opaquePixelCount:number;outOfPaletteRangeCount:number}>};
 summary:{heartSequenceOccurrenceCount:number;heartUniqueRecordCount:number;heartMultiPartFrameCount:number;lightningSpriteCount:number;rgbaPayloadCount:number;allPaletteIndicesInRange:boolean;allDecodesSuccessful:boolean};
 decision:{correctColorRgbaExportEstablishedForQualifiedFixtures:true;genericCorrectColorAnimationExportEstablished:false;multipartRuntimeZOrderEstablished:false;pngContainerEncodingEstablishedByCore:false;verdict:'MK1_QUALIFIED_PALETTE_BOUND_RGBA_EXPORT_FIXTURES_ESTABLISHED';narrative:string};
 status:'SUCCESS';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean;detail?:string}>};
}
export interface MK1VerifiedPaletteBoundExportFixturesResult{report:MK1VerifiedPaletteBoundExportFixturesReport;previewPayloads:Map<string,MK1RgbaPreviewPayload>}

export async function executeVerifiedPaletteBoundExportFixtures(source:DirectorySource,o2:MK1MultiPartFrameLosslessIrReport,o4:MK1RaydenLightningPlacementReport):Promise<MK1VerifiedPaletteBoundExportFixturesResult>{
 if(source.isSynthetic!==false)throw new Error('O23 requires authentic user-loaded MK1 source');
 if(o2.provenance.sha256!=='750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14')throw new Error('O23 requires canonical MK1.EXE provenance');
 if(o2.status!=='SUCCESS'||o2.decision.verdict!=='MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED'||!o2.roundTrip.wholeExecutableHashExact)throw new Error('O23 requires verified O2 heart IR');
 if(!o2.palette.linkedFromSetupDescriptor||o2.palette.symbol!=='BLOOD_P')throw new Error('O23 BLOOD_P heart binding missing');
 if(!o4.validation.allChecksPassed||o4.palette.symbol!=='MORPH_P'||!o4.palette.linkedFromSetupDescriptorPlus0C)throw new Error('O23 requires qualified O4 MORPH_P binding');
 const entries=await source.listRecursive();const miscE=imageEntry(entries,o2.resource.path),raidE=imageEntry(entries,'GRAPHICS/RAIDEN.GRA');const misc=await source.readSlice(miscE.path,0,miscE.size),raid=await source.readSlice(raidE.path,0,raidE.size);
 const payloads=new Map<string,MK1RgbaPreviewPayload>();
 const heartDecoded=new Map<string,{width:number;height:number;x:number;y:number;rgba:Uint8Array;opaque:number;out:number;checksum:string}>();
 for(const d of o2.descriptors){const dec=decodeUgraSprite(misc,d.graOffset,d.width,d.height);if(!dec.success)throw new Error(`O23 heart decode failed ${d.symbol}: ${dec.failureReason??'unknown'}`);const c=colorize(dec.indices,dec.opaqueMask,o2.palette.colorWords15);const checksum=rgbaChecksum(c.rgba);heartDecoded.set(d.symbol,{width:d.width,height:d.height,x:d.x,y:d.y,rgba:c.rgba,opaque:c.opaquePixelCount,out:c.outOfPaletteRange,checksum});}
 const heartFrames:MK1VerifiedPaletteBoundExportFixturesReport['heart']['frames']=[];
 for(const f of o2.compositionFrames){const record=o2.frameRecords.find(r=>r.watcomOffset===f.recordWatcomOffset);if(!record)throw new Error(`O23 heart frame record missing ${f.recordWatcomOffset}`);const rgba=new Uint8Array(f.bounds.width*f.bounds.height*4);let opaque=0,out=0;const layerChecksums:string[]=[];for(const sym of record.partDescriptorSymbols){const part=heartDecoded.get(sym);if(!part)throw new Error(`O23 heart descriptor missing ${sym}`);layerChecksums.push(part.checksum);out+=part.out;for(let sy=0;sy<part.height;sy++)for(let sx=0;sx<part.width;sx++){const sp=(sy*part.width+sx)*4;if(part.rgba[sp+3]===0)continue;const dx=part.x-f.bounds.minX+sx,dy=part.y-f.bounds.minY+sy;if(dx<0||dy<0||dx>=f.bounds.width||dy>=f.bounds.height)throw new Error(`O23 heart composition overflow ${f.frameKey}`);const dp=(dy*f.bounds.width+dx)*4;rgba[dp]=part.rgba[sp];rgba[dp+1]=part.rgba[sp+1];rgba[dp+2]=part.rgba[sp+2];rgba[dp+3]=255;}}
 for(let i=3;i<rgba.length;i+=4)if(rgba[i])opaque++;
 const key=`heart/${f.frameKey.replace(':','_')}`;payloads.set(key,{key,width:f.bounds.width,height:f.bounds.height,rgba,metadata:{frameKey:f.frameKey,sequence:f.sequence,structuralPartOrder:[...record.partDescriptorSymbols],zOrderPolicy:'STRUCTURAL_PART_ORDER_PREVIEW_ONLY'}});heartFrames.push({frameKey:f.frameKey,sequence:f.sequence,sequenceFrameIndex:f.sequenceFrameIndex,recordWatcomOffset:f.recordWatcomOffset,partSymbols:[...record.partDescriptorSymbols],partCount:record.partCount,width:f.bounds.width,height:f.bounds.height,anchorCanvasX:f.bounds.anchorCanvasX,anchorCanvasY:f.bounds.anchorCanvasY,rgbaChecksum:rgbaChecksum(rgba),opaquePixelCount:opaque,outOfPaletteRangeCount:out,layerChecksums});}
 const initial=new Set(['HANDBO4','HANDBO5','HANDBO8','HANDBO9']),loop=new Set(o4.route.loopDescriptors);const lightningSprites:MK1VerifiedPaletteBoundExportFixturesReport['lightning']['sprites']=[];
 for(const d of o4.descriptors){const dec=decodeUgraSprite(raid,d.graOffset,d.width,d.height);if(!dec.success)throw new Error(`O23 lightning decode failed ${d.symbol}: ${dec.failureReason??'unknown'}`);const c=colorize(dec.indices,dec.opaqueMask,o4.palette.colorWords15);const phase=d.symbol==='HANDBO22'?'SETUP':initial.has(d.symbol)?'INITIAL':loop.has(d.symbol)?'PERSISTENT_LOOP':'CONTINUATION';const checksum=rgbaChecksum(c.rgba),key=`lightning/${d.symbol}`;payloads.set(key,{key,width:d.width,height:d.height,rgba:c.rgba,metadata:{symbol:d.symbol,phase,x:d.x,y:d.y}});lightningSprites.push({symbol:d.symbol,phase,width:d.width,height:d.height,x:d.x,y:d.y,rgbaChecksum:checksum,opaquePixelCount:c.opaquePixelCount,outOfPaletteRangeCount:c.outOfPaletteRange});}
 const allRange=heartFrames.every(f=>f.outOfPaletteRangeCount===0)&&lightningSprites.every(s=>s.outOfPaletteRangeCount===0),heartUnique=new Set(heartFrames.map(f=>f.recordWatcomOffset)).size,heartMulti=heartFrames.filter(f=>f.partCount>1).length;
 const checks=[
  {checkId:'O2_HEART_PALETTE_BINDING',passed:o2.palette.symbol==='BLOOD_P'&&o2.palette.linkedFromSetupDescriptor},
  {checkId:'O4_LIGHTNING_PALETTE_BINDING',passed:o4.palette.symbol==='MORPH_P'&&o4.palette.linkedFromSetupDescriptorPlus0C},
  {checkId:'AUTHENTIC_RESOURCES_PRESENT',passed:misc.length===miscE.size&&raid.length===raidE.size},
  {checkId:'HEART_ALL_SEQUENCE_OCCURRENCES_RENDERED',passed:heartFrames.length===o2.compositionFrames.length,detail:`frames=${heartFrames.length}`},
  {checkId:'HEART_SHARED_RECORD_ALIAS_PRESERVED',passed:heartUnique===7&&heartFrames.length===8,detail:`uniqueRecords=${heartUnique}`},
  {checkId:'HEART_MULTIPART_FRAME_RENDERED',passed:heartMulti>=1,detail:`multiPartOccurrences=${heartMulti}`},
  {checkId:'LIGHTNING_ALL_QUALIFIED_DESCRIPTORS_RENDERED',passed:lightningSprites.length===13,detail:`sprites=${lightningSprites.length}`},
  {checkId:'PALETTE_INDEX_RANGE_VALID',passed:allRange},
  {checkId:'RUNTIME_Z_ORDER_NOT_PROMOTED',passed:true},
  {checkId:'NO_WRITE_PATH',passed:true},
 ];if(!checks.every(c=>c.passed))throw new Error(`O23 validation failed: ${checks.filter(c=>!c.passed).map(c=>c.checkId).join(', ')}`);
 const timestamp=new Date().toISOString(),operationId=createOperationId('verified_palette_bound_export_fixtures');const report:MK1VerifiedPaletteBoundExportFixturesReport={format:'mk1_verified_palette_bound_export_fixtures_v1',timestamp,operationId,provenance:{...o2.provenance,timestamp,operationId},prerequisite:{o2OperationId:o2.operationId,o4OperationId:o4.operationId,validationPassed:true},heart:{characterId:1,animationIndex:67,resourcePath:'GRAPHICS/MISC.GRA',paletteSymbol:'BLOOD_P',paletteLength:o2.palette.colorWords15.length,paletteRgb:o2.palette.colorWords15.map(rgbWord),zOrderPolicy:'STRUCTURAL_PART_ORDER_PREVIEW_ONLY',finalRuntimeZOrderEstablished:false,frames:heartFrames},lightning:{characterId:2,setupAnimationIndex:60,travelAnimationIndex:34,resourcePath:'GRAPHICS/RAIDEN.GRA',paletteSymbol:'MORPH_P',paletteLength:o4.palette.colorWords15.length,paletteRgb:o4.palette.colorWords15.map(rgbWord),sprites:lightningSprites},summary:{heartSequenceOccurrenceCount:heartFrames.length,heartUniqueRecordCount:heartUnique,heartMultiPartFrameCount:heartMulti,lightningSpriteCount:lightningSprites.length,rgbaPayloadCount:payloads.size,allPaletteIndicesInRange:allRange,allDecodesSuccessful:true},decision:{correctColorRgbaExportEstablishedForQualifiedFixtures:true,genericCorrectColorAnimationExportEstablished:false,multipartRuntimeZOrderEstablished:false,pngContainerEncodingEstablishedByCore:false,verdict:'MK1_QUALIFIED_PALETTE_BOUND_RGBA_EXPORT_FIXTURES_ESTABLISHED',narrative:`Authentic GRA bytes are decoded and mapped through already-qualified palette bindings into deterministic transparent RGBA payloads for two bounded fixtures: the Kano heart-rip context uses BLOOD_P and produces ${heartFrames.length} sequence-occurrence compositions (${heartUnique} unique frame records), while the Rayden normal-lightning context uses MORPH_P and produces ${lightningSprites.length} qualified setup/travel sprite payloads. All opaque source indices fit their bound palettes. Heart multi-part layering is exported with structural part order only as a preview policy; final runtime z-order is not claimed. This proves the correct-colour decode-to-RGBA pipeline for qualified contexts, not a generic palette binder for the remaining animation graph.`},status:'SUCCESS',validation:{allChecksPassed:true,checks}};return{report,previewPayloads:payloads};
}
export function createMK1VerifiedPaletteBoundExportFixturesExport(result:MK1VerifiedPaletteBoundExportFixturesResult){if(result.report.status!=='SUCCESS'||!result.report.validation.allChecksPassed)throw new Error('O23 export blocked');return result.report;}
