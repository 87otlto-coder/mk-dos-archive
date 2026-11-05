/** P15: screenshot-witnessed MK2 Tomb/Portal original packed floor-only layers.
 * O115 source-index -> screenshot RGB is conditional to captured game settings.
 * O117 Tomb and O115B/O116 Portal independently match original gameplay pixels.
 * This is NOT original VGA DAC palette-bank ownership, a live camera, or full stage.
 * Original source indices are not changed by preview colour assignment.
 */
import type { DirectorySource, SourceFileEntry } from '../filesystem/DirectorySource';
import type { Asset } from './model';
import { hash, utf8 } from './model';
import { buildStoredZip } from '../research/researchArtifactDownloads';
import { encodeOriginalEffectRgbaPngO177 } from '../../games/mk2/research/stageSourcePngO177';
import { renderMK2ObservedStageFloorO116, O116_FLOOR_QUALIFICATION } from '../../games/mk2/research/observedStageFloorPreviewO116';

const MK2_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const STRIDE=896, WIDTH=320;
const STAGES=[
  {stage:'tomb',filename:'tomb.gra',left:291,offset:63776,rows:48,
   originalSHA:'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
   witness:'O115 Tomb index/RGB table and O117 unmodified Tomb control screenshot',
   evidenceMatches:12222,sourceResearch:['O115','O116','O117']},
  {stage:'portal',filename:'portal.gra',left:292,offset:56916,rows:40,
   originalSHA:'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82',
   witness:'O115 Portal index/RGB table and O115B/O116 unmodified Portal control screenshot',
   evidenceMatches:4420,sourceResearch:['O115','O115B','O116']},
] as const;
export const MK2_P15_OBSERVED_FLOOR_LIMITATION =
  'P15 320-column colour previews show ONLY the original packed floor slices of Kombat Tomb and The Portal. '+
  'Source-left 291/292 are conditional alignments fitted to particular captured DOSBox screenshots, NOT live game camera registers. '+
  'RGB maps source indices to colours observed in separately authenticated O115 test-game screenshots, and independent original unmodified '+
  'screenshots verified floor pixels in bounded unoccluded regions. This does NOT establish the native VGA DAC palette-bank owner, '+
  'other presentation contexts, full stage composition, other layers, animations or frame duration. '+
  'Exact original source indices and paint masks are exported; palette-known masks remain zero because native DAC allocation is UNKNOWN.';

type Status={resource:string;status:'VERIFIED'|'UNAVAILABLE';reason?:string;pixels?:number;sourceLeft?:number};
function requireSource(ok:boolean,why:string):asserts ok{if(!ok)throw Error('P15 observed MK2 floor: '+why);}
function only(entries:SourceFileEntry[],name:string):SourceFileEntry{
 const matches=entries.filter(e=>e.name.toLowerCase()===name);
 requireSource(matches.length===1,`exactly one ${name} required; found ${matches.length}`);
 return matches[0];
}
export interface P15ObservedFloorsResult{
 assets:Asset[];packages:{name:string;bytes:Uint8Array}[];
 status:{status:'VERIFIED'|'PARTIAL'|'UNAVAILABLE';count:number;rows:Status[];qualification:string};
}
export async function buildMK2ObservedFloorsP15(source:DirectorySource):Promise<P15ObservedFloorsResult>{
 const assets:Asset[]=[],packages:P15ObservedFloorsResult['packages']=[],rows:Status[]=[];
 const entries=await source.listRecursive();
 let reason='';
 try {
  requireSource(!source.isSynthetic,'a user-supplied original file directory is required');
  const exe=only(entries,'mk2.exe');
  const bytes=await source.readSlice(exe.path,0,exe.size);
  requireSource(bytes.length===exe.size && await hash(bytes)===MK2_SHA,'original canonical MK2.EXE checksum');
 }catch(e){reason=e instanceof Error?e.message:String(e);}
 if(reason)return {assets,packages,status:{status:'UNAVAILABLE',count:0,rows:STAGES.map(s=>({resource:s.filename,status:'UNAVAILABLE',reason})),qualification:MK2_P15_OBSERVED_FLOOR_LIMITATION}};
 const archiveFiles:{name:string;bytes:Uint8Array}[]=[],manifest:Record<string,unknown>[]=[];
 for(const s of STAGES){
  try{
   const e=only(entries,s.filename);
   requireSource(e.size===s.offset+STRIDE*s.rows,'canonical original source resource size '+s.filename);
   const resource=await source.readSlice(e.path,0,e.size);
   requireSource(resource.length===e.size && await hash(resource)===s.originalSHA,'canonical original SHA256 '+s.filename);
   // The existing O116 renderer pins all 128 observed source-index colours to
   // their O115 screenshot reports. P15 fixes O117's Tomb *control* x=291,
   // not O116's older different-capture suggestion x=290.
   const p=await renderMK2ObservedStageFloorO116(s.stage,resource,s.left);
   requireSource(p.width===WIDTH && p.height===s.rows && p.sourceLeft===s.left,'bounded original geometry '+s.filename);
   const indices=new Uint8Array(WIDTH*s.rows),mask=new Uint8Array(indices.length).fill(1),paletteKnownMask=new Uint8Array(indices.length);
   for(let y=0;y<s.rows;y++) {
    const from=s.offset+y*STRIDE+s.left;
    requireSource(from+WIDTH<=s.offset+(y+1)*STRIDE,'bounded source row '+s.filename);
    indices.set(resource.subarray(from,from+WIDTH),y*WIDTH);
   }
   const sourceIndicesSHA256=await hash(indices),observedRGBA_SHA256=await hash(p.rgba);
   const metadata={sourceFormat:'O115/O117 original 896-byte packed source floor',
    originalGRAOffset:s.offset,sourceStride:STRIDE,originalSourceRows:s.rows,
    sourceLeft:s.left,sourceFirstRow:0,sourceLeftQualification:'Screenshot-conditional source projection; NOT a live camera coordinate',
    sourcePixelSha256:sourceIndicesSHA256,observedRgbPreviewSha256:observedRGBA_SHA256,
    screenshotObservedRGB:true,sourceIndicesVerified:true,runtimeNativeDACBankKnown:false,
    runtimeCameraKnown:false,fullStageScene:false,originalAnimationTimingKnown:false,
    nativePaletteKnown:false,colourKnownDefinition:'O115 screenshot RGB per source index; native DAC palette-bank ownership remains UNKNOWN',
    originalScreenshotHeldOutExactMatches:s.evidenceMatches,originalScreenshotWitness:s.witness,
    originalScreenshotPaletteSourceSHA256:p.originalWitnessScreenshotSHA256,
    provenance:[...s.sourceResearch,O116_FLOOR_QUALIFICATION],
    indices,mask,paletteKnownMask};
   const asset:Asset={id:`mk2-witnessed-floor:${s.stage}:x${s.left}`,
    name:`${s.filename.toUpperCase()} · screenshot-witnessed floor-only RGB · 320×${s.rows}`,
    group:'MK2 stage floor · original screenshot-witnessed RGB (NOT native DAC ownership)',
    kind:'stage',format:'Original-indexed PNG with conditional observed RGB',
    confidence:'Original indices VERIFIED; screenshot-conditional RGB VERIFIED in bounded regions; native palette/camera UNKNOWN',
    source:{path:e.path,offset:s.offset,length:STRIDE*s.rows,sha256:s.originalSHA},
    metadata,width:WIDTH,height:s.rows,rgba:p.rgba,
    filename:`MK2_${s.stage}_floor_screenshot_witnessed_320x${s.rows}.png`};
   assets.push(asset);
   const base=s.stage;
   const paths={png:`preview/${base}_observed_floor_320x${s.rows}.png`,indices:`indexed/${base}.indices.bin`,mask:`indexed/${base}.mask.bin`,paletteKnownMask:`indexed/${base}.native-palette-known.bin`};
   archiveFiles.push({name:paths.png,bytes:encodeOriginalEffectRgbaPngO177(WIDTH,s.rows,p.rgba)},
    {name:paths.indices,bytes:indices},{name:paths.mask,bytes:mask},{name:paths.paletteKnownMask,bytes:paletteKnownMask});
   manifest.push({stage:s.stage,resource:s.filename,sourceOriginalSHA256:s.originalSHA,
    sourceGRAOffset:s.offset,sourceStride:STRIDE,sourceLeft:s.left,width:WIDTH,height:s.rows,
    sourceIndexSHA256:sourceIndicesSHA256,conditionalObservedRGBA_SHA256:observedRGBA_SHA256,
    originalScreenshotHeldOutExactMatches:s.evidenceMatches,witness:s.witness,
    nativePaletteBankKnown:false,liveCameraKnown:false,completeStage:false,paths});
   rows.push({resource:s.filename,status:'VERIFIED',pixels:indices.length,sourceLeft:s.left});
  }catch(e){rows.push({resource:s.filename,status:'UNAVAILABLE',reason:e instanceof Error?e.message:String(e)});}
 }
 if(archiveFiles.length){
  archiveFiles.push({name:'manifest.json',bytes:utf8.encode(JSON.stringify({schema:'mk2_p15_screenshot_conditional_original_floor_rgb_v1',
   sourceResearch:['O115','O116','O117'],completeStage:false,nativePaletteBankKnown:false,liveCameraKnown:false,
   limitations:MK2_P15_OBSERVED_FLOOR_LIMITATION,records:manifest},null,2)+'\n')});
  packages.push({name:'MK2_P15_TWO_SCREENSHOT_WITNESSED_STAGE_FLOORS.zip',bytes:buildStoredZip(archiveFiles)});
 }
 return {assets,packages,status:{status:rows.every(x=>x.status==='VERIFIED')?'VERIFIED':rows.some(x=>x.status==='VERIFIED')?'PARTIAL':'UNAVAILABLE',count:assets.length,rows,qualification:MK2_P15_OBSERVED_FLOOR_LIMITATION}};
}
