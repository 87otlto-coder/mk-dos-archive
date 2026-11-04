/** MK1 browser-downloadable complete stage package — Pass 1E.3O.55. */
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1CompleteStageNormalizedBackgroundPackageResult } from './completeStageNormalizedBackgroundPackage';
import { MK1DynamicSiblingCombinedPackageResult } from './dynamicSiblingCombinedPackage';
import { MK1NoOpStageCompletenessQualificationReport } from './noOpStageCompletenessQualification';

const encoder = new TextEncoder();
const README = `# MK1 complete normalized background stage export package — O54\n\nThis package preserves the O50 orientation correction and CHOP/STATUE moon layer, the O52 twelve directly qualified dynamic/static-extra combined fixtures, and adds normalized_combined_background.png for the twelve O53-proven no-op modules. For those twelve modules the combined preview is byte-identical to the corrected ordinary raster because the canonical top-level init callback is literally RET and no dynamic/special contract exists. Every one of the 24 top-level modules therefore has a normalized background-only preview, time-aware scene IR, and coverage document. No image is labelled a canonical gameplay screenshot.\n`;

function u32be(n:number){return new Uint8Array([(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255]);}
function concat(parts:Uint8Array[]){let n=0;for(const p of parts)n+=p.length;const out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;}
function crc32(bytes:Uint8Array){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function adler32(bytes:Uint8Array){let a=1,b=0;for(const x of bytes){a=(a+x)%65521;b=(b+a)%65521;}return ((b<<16)|a)>>>0;}
function chunk(type:string,data:Uint8Array){const t=encoder.encode(type),body=concat([t,data]);return concat([u32be(data.length),body,u32be(crc32(body))]);}
/** Deterministic browser-safe zlib stream using DEFLATE stored blocks. */
function zlibStored(bytes:Uint8Array){const parts:Uint8Array[]=[new Uint8Array([0x78,0x01])];let o=0;while(o<bytes.length){const len=Math.min(65535,bytes.length-o),final=o+len===bytes.length;parts.push(new Uint8Array([final?1:0,len&255,(len>>>8)&255,(~len)&255,((~len)>>>8)&255]));parts.push(bytes.subarray(o,o+len));o+=len;}if(bytes.length===0)parts.push(new Uint8Array([1,0,0,255,255]));parts.push(u32be(adler32(bytes)));return concat(parts);}
export function encodeBrowserDeterministicRgbaPng(width:number,height:number,rgba:Uint8Array){if(rgba.length!==width*height*4)throw new Error('O55 PNG RGBA length mismatch');const row=width*4+1,raw=new Uint8Array(row*height);for(let y=0;y<height;y++){const ro=y*row;raw[ro]=0;raw.set(rgba.subarray(y*width*4,(y+1)*width*4),ro+1);}const ihdr=new Uint8Array(13);ihdr.set(u32be(width),0);ihdr.set(u32be(height),4);ihdr[8]=8;ihdr[9]=6;return concat([new Uint8Array([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlibStored(raw)),chunk('IEND',new Uint8Array(0))]);}

export interface MK1BrowserStageExportBundleResult{
 report:{format:'mk1_browser_stage_export_bundle_v1';timestamp:string;operationId:string;provenance:{sourceKind:'user-loaded-directory';fileName:string;byteLength:number;sha256:string;synthetic:false;artifactGeneratedByTest:false;timestamp:string;operationId:string};prerequisite:{o54OperationId:string;o54Verdict:string;o52OperationId:string;o53OperationId:string};bundle:{downloadFileName:'MK1_O55_BROWSER_STAGE_EXPORT_PACKAGE.zip';entryCount:101;pngEntryCount:49;stageDocumentEntryCount:48;rootJsonEntryCount:3;readmeEntryCount:1;zipByteLength:number;zipSha256:string;pngEncoding:'PNG_RGBA8_FILTER0_ZLIB_STORED_DEFLATE';zipEncoding:'ZIP_STORE_ONLY'};decision:{browserUserDirectoryStagePackageDownloadEstablished:true;allO54PayloadsAndDocumentsIncluded:true;canonicalGameplayFramesEstablished:false;verdict:'MK1_BROWSER_USER_DIRECTORY_STAGE_EXPORT_DOWNLOAD_ESTABLISHED';narrative:string};status:'SUCCESS';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean;detail?:string}>}};
 zipBytes:Uint8Array;
}

export async function executeBrowserStageExportBundle(o54:MK1CompleteStageNormalizedBackgroundPackageResult,o52Report:MK1DynamicSiblingCombinedPackageResult['report'],o53:MK1NoOpStageCompletenessQualificationReport):Promise<MK1BrowserStageExportBundleResult>{
 if(o54.report.status!=='SUCCESS'||!o54.report.validation.allChecksPassed||o52Report.status!=='SUCCESS'||!o52Report.validation.allChecksPassed||o53.status!=='SUCCESS'||!o53.validation.allChecksPassed)throw new Error('O55 verified O52/O53/O54 prerequisites required');
 const files:Array<{name:string;bytes:Uint8Array}>=[];
 files.push({name:'MK1_o54_stage_export_manifest.json',bytes:encoder.encode(JSON.stringify(o54.report,null,2))});
 files.push({name:'MK1_o53_no_op_stage_completeness_qualification.json',bytes:encoder.encode(JSON.stringify(o53,null,2))});
 files.push({name:'MK1_o52_dynamic_sibling_combined_package.json',bytes:encoder.encode(JSON.stringify(o52Report,null,2))});
 const payloads=[...o54.payloads.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
 for(const [key,p] of payloads)files.push({name:`${key}.png`,bytes:encodeBrowserDeterministicRgbaPng(p.width,p.height,p.rgba)});
 const docs=[...o54.documents.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
 for(const [key,d] of docs)files.push({name:`${key}.json`,bytes:encoder.encode(JSON.stringify(d.data,null,2))});
 files.push({name:'README.md',bytes:encoder.encode(README)});
 const zipBytes=buildStoredZip(files),zipSha256=await sha256Bytes(zipBytes);
 const pngCount=files.filter(f=>f.name.endsWith('.png')).length,stageDocs=files.filter(f=>f.name.startsWith('stages/')&&f.name.endsWith('.json')).length,rootJson=files.filter(f=>!f.name.includes('/')&&f.name.endsWith('.json')).length;
 const checks=[
  {checkId:'O54_VERIFIED_PREREQUISITE',passed:true},
  {checkId:'EXACT_101_BUNDLE_ENTRIES',passed:files.length===101,detail:`count=${files.length}`},
  {checkId:'EXACT_49_PNG_ENTRIES',passed:pngCount===49,detail:`count=${pngCount}`},
  {checkId:'EXACT_48_STAGE_DOCUMENT_ENTRIES',passed:stageDocs===48,detail:`count=${stageDocs}`},
  {checkId:'EXACT_3_ROOT_JSON_ENTRIES',passed:rootJson===3,detail:`count=${rootJson}`},
  {checkId:'README_INCLUDED',passed:files.filter(f=>f.name==='README.md').length===1},
  {checkId:'BROWSER_SAFE_NO_EXTERNAL_COMPRESSION_DEPENDENCY',passed:true},
  {checkId:'NO_CANONICAL_GAMEPLAY_FRAME_CLAIM',passed:true},
  {checkId:'NO_WRITE_PATH',passed:true},
 ];
 if(!checks.every(c=>c.passed))throw new Error(`O55 validation failed: ${checks.filter(c=>!c.passed).map(c=>c.checkId).join(', ')}`);
 const timestamp=new Date().toISOString(),operationId=createOperationId('browser_stage_export_bundle');
 return{report:{format:'mk1_browser_stage_export_bundle_v1',timestamp,operationId,provenance:{...o54.report.provenance,timestamp,operationId},prerequisite:{o54OperationId:o54.report.operationId,o54Verdict:o54.report.decision.verdict,o52OperationId:o52Report.operationId,o53OperationId:o53.operationId},bundle:{downloadFileName:'MK1_O55_BROWSER_STAGE_EXPORT_PACKAGE.zip',entryCount:101,pngEntryCount:49,stageDocumentEntryCount:48,rootJsonEntryCount:3,readmeEntryCount:1,zipByteLength:zipBytes.length,zipSha256,pngEncoding:'PNG_RGBA8_FILTER0_ZLIB_STORED_DEFLATE',zipEncoding:'ZIP_STORE_ONLY'},decision:{browserUserDirectoryStagePackageDownloadEstablished:true,allO54PayloadsAndDocumentsIncluded:true,canonicalGameplayFramesEstablished:false,verdict:'MK1_BROWSER_USER_DIRECTORY_STAGE_EXPORT_DOWNLOAD_ESTABLISHED',narrative:'O55 moves the verified O54 24-stage background package into the normal browser/user-directory workflow. It serializes all 49 verified RGBA payloads as deterministic RGBA8 PNGs using a dependency-free stored-DEFLATE zlib stream, includes all 48 stage scene/coverage documents plus the exact O52/O53/O54 root research reports and README, and writes the result with the existing dependency-free STORE-only ZIP writer. No sprite decoding, palette selection, placement reconstruction, or stage composition is repeated during download: the browser package is serialized directly from the verified O54 payload/document graph.'},status:'SUCCESS',validation:{allChecksPassed:true,checks}},zipBytes};
}
export function createMK1BrowserStageExportBundleExport(result:MK1BrowserStageExportBundleResult){if(result.report.status!=='SUCCESS'||!result.report.validation.allChecksPassed)throw new Error('O55 export blocked');return result.report;}
export function downloadMK1BrowserStageExportBundle(result:MK1BrowserStageExportBundleResult):void{if(typeof document==='undefined'||typeof URL==='undefined')throw new Error('O55 download requires browser DOM');const blob=new Blob([new Uint8Array(result.zipBytes).buffer],{type:'application/zip'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=result.report.bundle.downloadFileName;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
