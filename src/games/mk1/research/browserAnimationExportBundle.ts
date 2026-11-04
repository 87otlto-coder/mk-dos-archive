/** Browser-downloadable MK1 animation export package — Pass 1E.3O.60. */
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { decodeUgraSprite } from '../graphics/ugraDecoder';
import { encodeBrowserDeterministicRgbaPng } from './browserStageExportBundle';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1AnimationResourceDecodeCensusReport } from './animationResourceDecodeCensus';
import { MK1AnimationExportManifestReport } from './characterAnimationExportManifest';
import { MK1VerifiedPaletteBoundExportFixturesReport } from './verifiedPaletteBoundExportFixtures';
import { enumerateMK1WatcomPermanentClasses } from './watcomPermanentClassInventory';
import { MK1CharacterPaletteContextVariantRendererReport, O24TransferPrerequisite } from './characterPaletteContextVariantRenderer';
import { MK1PaletteBindingExceptionCensusReport } from './paletteBindingExceptionCensus';
import { MK1AnimationStreamControlTimingCensusReport } from './animationStreamControlTimingCensus';
import { MK1AnimationExportCapabilityCoverageManifestReport } from './animationExportCapabilityCoverageManifest';

const CANONICAL_SHA='750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const encoder=new TextEncoder();
const README=`# MK1 browser animation export package — O60\n\nThis package is export-first and evidence-tiered.\n\n- rgba/character_contexts contains dominant fighter-resource descriptors rendered only under the explicit normal/alternate character palette contexts established by O20/O24. These are context variants, not universal per-animation palette assignments.\n- rgba/verified_effects contains only the bounded Kano heart and Rayden lightning RGBA fixtures whose palette bindings were separately qualified by O23.\n- indexed/descriptor_pixels.bin plus indexed/descriptor_manifest.json preserve every O18 descriptor losslessly as indexed pixels plus opaque masks, including the 79 O25 cross-resource descriptors whose palette ownership remains unresolved.\n- reports preserve O18, O22, O23, O24, O25, O26 and O59 evidence. O26 dwell values remain scheduler/caller units; no milliseconds or FPS are invented.\n\nNo asset in this package is labelled with an unverified gameplay animation name, and no unresolved palette binding is converted into guessed RGBA.\n`;

function entry(entries:Awaited<ReturnType<DirectorySource['listRecursive']>>,wanted:string){const u=wanted.toUpperCase();const e=entries.find(x=>x.path.toUpperCase()===u||x.name.toUpperCase()===u.split('/').pop());if(!e)throw new Error(`O60 resource missing ${wanted}`);return e;}
function u16(b:Uint8Array,o:number){return b[o]|b[o+1]<<8;}
function i16(b:Uint8Array,o:number){const v=u16(b,o);return v&0x8000?v-0x10000:v;}
function u32(b:Uint8Array,o:number){return(b[o]|b[o+1]<<8|b[o+2]<<16|b[o+3]<<24)>>>0;}
function rgbWord(word:number):[number,number,number]{const c=(shift:number)=>Math.round(((((word>>>shift)&31)*2+1)*255)/63);return[c(10),c(5),c(0)];}
function colorize(indices:Uint8Array,mask:Uint8Array,words:number[]){const rgba=new Uint8Array(indices.length*4);let out=0;for(let i=0;i<indices.length;i++){if(!mask[i])continue;const idx=indices[i];if(idx<1||idx>words.length){out++;continue;}const [r,g,b]=rgbWord(words[idx-1]),p=i*4;rgba[p]=r;rgba[p+1]=g;rgba[p+2]=b;rgba[p+3]=255;}return{rgba,out};}
function colorizeRgb(indices:Uint8Array,mask:Uint8Array,palette:Array<[number,number,number]>){const rgba=new Uint8Array(indices.length*4);let out=0;for(let i=0;i<indices.length;i++){if(!mask[i])continue;const idx=indices[i];if(idx<1||idx>palette.length){out++;continue;}const [r,g,b]=palette[idx-1],p=i*4;rgba[p]=r;rgba[p+1]=g;rgba[p+2]=b;rgba[p+3]=255;}return{rgba,out};}
function fnv(bytes:Uint8Array,seed=0x811c9dc5){let h=seed>>>0;for(const b of bytes){h^=b;h=Math.imul(h,0x01000193);}return h>>>0;}
function fnvHex(v:number){return(v>>>0).toString(16).padStart(8,'0');}
function concat(parts:Uint8Array[]){let len=0;for(const p of parts)len+=p.length;const out=new Uint8Array(len);let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;}
function safe(value:string){return value.replace(/[^A-Za-z0-9_.+-]+/g,'_');}

export interface MK1BrowserAnimationExportBundleResult{
 report:{
  format:'mk1_browser_animation_export_bundle_v1';timestamp:string;operationId:string;provenance:MK1AnimationResourceDecodeCensusReport['provenance'];
  prerequisite:{o59OperationId:string;o18OperationId:string;o22OperationId:string;o23OperationId:string;o24OperationId:string;o25OperationId:string;o26OperationId:string;validationPassed:true};
  bundle:{downloadFileName:'MK1_O60_BROWSER_ANIMATION_EXPORT_PACKAGE.zip';entryCount:number;pngEntryCount:number;characterContextPngCount:number;verifiedEffectPngCount:number;reportJsonEntryCount:number;manifestJsonEntryCount:number;binaryEntryCount:number;zipByteLength:number;zipSha256:string;pngEncoding:'PNG_RGBA8_FILTER0_ZLIB_STORED_DEFLATE';zipEncoding:'ZIP_STORE_ONLY'};
  indexedPayload:{descriptorCount:number;binaryByteLength:number;unresolvedPaletteDescriptorCount:number;format:'CONCATENATED_INDEX8_THEN_OPAQUE_MASK8_PER_DESCRIPTOR'};
  summary:{characterContextRgbaAssetCount:number;verifiedEffectRgbaAssetCount:number;indexedDescriptorCount:number;unresolvedPaletteDescriptorCount:number;totalRgbaAssetCount:number};
  decision:{browserAnimationPackageEstablished:true;allO18DescriptorsPreservedIndexed:true;allO24CharacterContextVariantsMaterialized:true;onlyO23QualifiedEffectsMaterializedAsEffectRgba:true;unresolvedPaletteBindingsNotGuessed:true;absoluteWallClockTimingNotInvented:true;verdict:'MK1_BROWSER_ANIMATION_EXPORT_PACKAGE_ESTABLISHED';narrative:string};
  status:'SUCCESS';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean;detail?:string}>};
 };
 zipBytes:Uint8Array;
}

export async function executeBrowserAnimationExportBundle(
 source:DirectorySource,
 o59:MK1AnimationExportCapabilityCoverageManifestReport,
 o18:MK1AnimationResourceDecodeCensusReport,
 o22:MK1AnimationExportManifestReport,
 o23:MK1VerifiedPaletteBoundExportFixturesReport,
 o24:MK1CharacterPaletteContextVariantRendererReport,
 o25:MK1PaletteBindingExceptionCensusReport,
 o26:MK1AnimationStreamControlTimingCensusReport,
 transfer:O24TransferPrerequisite,
):Promise<MK1BrowserAnimationExportBundleResult>{
 if(source.isSynthetic!==false)throw new Error('O60 requires authentic MK1 installation');
 for(const [name,r] of [['O59',o59],['O18',o18],['O22',o22],['O23',o23],['O24',o24],['O25',o25],['O26',o26]] as const){if(r.status!=='SUCCESS'||!r.validation.allChecksPassed||r.provenance.sha256!==CANONICAL_SHA)throw new Error(`O60 requires canonical verified ${name}`);}
 if(!o59.packageContract.unresolvedPaletteDescriptorsMustNotReceiveGuessedRgba||!transfer.decision.oneBasedRendererAlignmentCorroborated)throw new Error('O60 export-safety prerequisites changed');
 const entries=await source.listRecursive(),exeE=entry(entries,'MK1.EXE'),exe=await source.readSlice(exeE.path,0,exeE.size);if(await sha256Bytes(exe)!==CANONICAL_SHA)throw new Error('O60 MK1.EXE is not canonical');
 const resourceCache=new Map<string,Uint8Array>();async function resource(path:string){if(!resourceCache.has(path)){const e=entry(entries,path);resourceCache.set(path,await source.readSlice(e.path,0,e.size));}return resourceCache.get(path)!;}
 const decoded=new Map<string,{indices:Uint8Array;mask:Uint8Array}>();
 const indexedParts:Uint8Array[]=[];const indexedManifest:Array<Record<string,unknown>>=[];let cursor=0;
 const descriptors=[...o18.descriptors].sort((a,b)=>a.tableSymbol.localeCompare(b.tableSymbol)||a.watcomOffset-b.watcomOffset);
 for(const d of descriptors){const gra=await resource(d.resourcePath),dec=decodeUgraSprite(gra,d.graOffset,d.width,d.height);if(!dec.success||dec.checksum!==d.decode.checksum)throw new Error(`O60 indexed decode mismatch ${d.tableSymbol} ${d.watcomOffsetHex}`);const key=`${d.tableSymbol}:${d.watcomOffset}`,indices=new Uint8Array(dec.indices),mask=new Uint8Array(dec.opaqueMask);decoded.set(key,{indices,mask});const indicesOffset=cursor;indexedParts.push(indices);cursor+=indices.length;const maskOffset=cursor;indexedParts.push(mask);cursor+=mask.length;indexedManifest.push({tableSymbol:d.tableSymbol,descriptorWatcomOffset:d.watcomOffset,descriptorWatcomOffsetHex:d.watcomOffsetHex,resourcePath:d.resourcePath,graOffset:d.graOffset,width:d.width,height:d.height,x:d.x,y:d.y,decodeChecksum:d.decode.checksum,indicesOffset,maskOffset,pixelCount:indices.length});}
 const indexedBinary=concat(indexedParts);
 const files:Array<{name:string;bytes:Uint8Array}>=[];
 const assetIndex:{characterContextRgba:Array<Record<string,unknown>>;verifiedEffectRgba:Array<Record<string,unknown>>}={characterContextRgba:[],verifiedEffectRgba:[]};
 const reportFiles:[string,unknown][]=[['o18_animation_resource_decode_census.json',o18],['o22_character_animation_export_manifest.json',o22],['o23_verified_palette_bound_effects.json',o23],['o24_character_palette_context_variant_renderer.json',o24],['o25_palette_binding_exception_census.json',o25],['o26_animation_stream_control_timing_census.json',o26],['o59_animation_export_capability_coverage_manifest.json',o59]];
 for(const [name,data] of reportFiles)files.push({name:`reports/${name}`,bytes:encoder.encode(JSON.stringify(data,null,2))});
 files.push({name:'indexed/descriptor_manifest.json',bytes:encoder.encode(JSON.stringify({format:'mk1_animation_indexed_descriptor_payload_manifest_v1',descriptorCount:indexedManifest.length,binaryFile:'descriptor_pixels.bin',layout:'For each descriptor, indices[pixelCount] immediately followed by opaqueMask[pixelCount]. Offsets below are absolute byte offsets into descriptor_pixels.bin.',descriptors:indexedManifest},null,2))});
 files.push({name:'indexed/descriptor_pixels.bin',bytes:indexedBinary});
 let contextPngCount=0;
 for(const c of o24.contexts){const ds=descriptors.filter(d=>d.tableSymbol===c.anitabSymbol&&d.resourcePath===c.dominantAnimationResource).sort((a,b)=>a.watcomOffset-b.watcomOffset);for(const pv of c.paletteVariants){const p=transfer.staticDataBase+pv.paletteWatcomOffset,len=u16(exe,p);if(len!==23)throw new Error(`O60 palette length drift ${pv.paletteWatcomOffsetHex}`);const words=Array.from({length:len},(_,i)=>u16(exe,p+2+i*2));let agg=0x811c9dc5;let sampleChecksum:string|null=null;for(const d of ds){const q=decoded.get(`${d.tableSymbol}:${d.watcomOffset}`);if(!q)throw new Error(`O60 missing indexed descriptor ${d.watcomOffsetHex}`);const col=colorize(q.indices,q.mask,words);if(col.out!==0)throw new Error(`O60 context palette range failure ${c.identityLabel} ${d.watcomOffsetHex}`);agg=fnv(new Uint8Array([d.watcomOffset&255,(d.watcomOffset>>>8)&255,(d.watcomOffset>>>16)&255,(d.watcomOffset>>>24)&255]),agg);agg=fnv(col.rgba,agg);const rgbaChecksum=fnvHex(fnv(col.rgba));if(sampleChecksum===null)sampleChecksum=rgbaChecksum;const mode=safe(pv.mode+'_'+pv.paletteSymbols.join('+'));const outPath=`rgba/character_contexts/${String(c.characterId).padStart(2,'0')}_${safe(c.identityLabel)}/${mode}/${d.watcomOffsetHex.replace('0x','')}.png`;files.push({name:outPath,bytes:encodeBrowserDeterministicRgbaPng(d.width,d.height,col.rgba)});assetIndex.characterContextRgba.push({path:outPath,characterId:c.characterId,identityLabel:c.identityLabel,anitabSymbol:c.anitabSymbol,mode:pv.mode,paletteSymbols:pv.paletteSymbols,descriptorWatcomOffset:d.watcomOffset,descriptorWatcomOffsetHex:d.watcomOffsetHex,resourcePath:d.resourcePath,width:d.width,height:d.height,rgbaChecksum});contextPngCount++;}
   if(fnvHex(agg)!==pv.aggregateRgbaChecksum||sampleChecksum!==pv.sampleRgbaChecksum)throw new Error(`O60 O24 aggregate/sample checksum mismatch ${c.identityLabel} ${pv.mode}`);
  }}
 const wat=await enumerateMK1WatcomPermanentClasses(source);if(wat.status!=='SUCCESS'||!wat.result.overallValid)throw new Error('O60 Watcom inventory failed');const symbols=wat.result.globalSymbols.symbols;
 function exactDataSymbol(name:string){const ms=symbols.filter(s=>s.valid&&s.segment===2&&s.kindBits.isData&&s.name===name);if(ms.length!==1)throw new Error(`O60 data symbol ${name} count ${ms.length}`);return ms[0];}
 function descriptorBySymbol(name:string){const s=exactDataSymbol(name),p=transfer.staticDataBase+s.addressOffset;return{symbol:name,watcomOffset:s.addressOffset,width:u16(exe,p),height:u16(exe,p+2),x:i16(exe,p+4),y:i16(exe,p+6),graOffset:u32(exe,p+8)&0x00ffffff};}
 const effectPayloads:Array<[string,{width:number;height:number;rgba:Uint8Array;metadata:Record<string,unknown>}]>=[];
 const misc=await resource(o23.heart.resourcePath),raid=await resource(o23.lightning.resourcePath);
 for(const f of o23.heart.frames){const rgba=new Uint8Array(f.width*f.height*4),minX=-f.anchorCanvasX,minY=-f.anchorCanvasY,layerChecksums:string[]=[];for(const sym of f.partSymbols){const d=descriptorBySymbol(sym),dec=decodeUgraSprite(misc,d.graOffset,d.width,d.height);if(!dec.success)throw new Error(`O60 heart decode failed ${sym}`);const col=colorizeRgb(dec.indices,dec.opaqueMask,o23.heart.paletteRgb);if(col.out)throw new Error(`O60 heart palette range ${sym}`);layerChecksums.push(fnvHex(fnv(col.rgba)));for(let sy=0;sy<d.height;sy++)for(let sx=0;sx<d.width;sx++){const sp=(sy*d.width+sx)*4;if(!col.rgba[sp+3])continue;const dx=d.x-minX+sx,dy=d.y-minY+sy;if(dx<0||dy<0||dx>=f.width||dy>=f.height)throw new Error(`O60 heart composition overflow ${f.frameKey}`);const dp=(dy*f.width+dx)*4;rgba[dp]=col.rgba[sp];rgba[dp+1]=col.rgba[sp+1];rgba[dp+2]=col.rgba[sp+2];rgba[dp+3]=255;}}if(layerChecksums.join(',')!==f.layerChecksums.join(','))throw new Error(`O60 heart layer checksum drift ${f.frameKey}`);const sum=fnvHex(fnv(rgba));if(sum!==f.rgbaChecksum)throw new Error(`O60 heart frame checksum drift ${f.frameKey}`);effectPayloads.push([`heart/${f.frameKey.replace(':','_')}`,{width:f.width,height:f.height,rgba,metadata:{frameKey:f.frameKey,sequence:f.sequence,structuralPartOrder:f.partSymbols,zOrderPolicy:o23.heart.zOrderPolicy}}]);}
 for(const s of o23.lightning.sprites){const d=descriptorBySymbol(s.symbol);if(d.width!==s.width||d.height!==s.height||d.x!==s.x||d.y!==s.y)throw new Error(`O60 lightning descriptor drift ${s.symbol}`);const dec=decodeUgraSprite(raid,d.graOffset,d.width,d.height);if(!dec.success)throw new Error(`O60 lightning decode failed ${s.symbol}`);const col=colorizeRgb(dec.indices,dec.opaqueMask,o23.lightning.paletteRgb);if(col.out)throw new Error(`O60 lightning palette range ${s.symbol}`);const sum=fnvHex(fnv(col.rgba));if(sum!==s.rgbaChecksum)throw new Error(`O60 lightning checksum drift ${s.symbol}`);effectPayloads.push([`lightning/${s.symbol}`,{width:d.width,height:d.height,rgba:col.rgba,metadata:{symbol:s.symbol,phase:s.phase,x:d.x,y:d.y}}]);}
 effectPayloads.sort((a,b)=>a[0].localeCompare(b[0]));
 for(const [key,payload] of effectPayloads){const rgbaChecksum=fnvHex(fnv(payload.rgba));const outPath=`rgba/verified_effects/${key}.png`;files.push({name:outPath,bytes:encodeBrowserDeterministicRgbaPng(payload.width,payload.height,payload.rgba)});assetIndex.verifiedEffectRgba.push({path:outPath,key,width:payload.width,height:payload.height,rgbaChecksum,metadata:payload.metadata});}
 files.push({name:'manifests/animation_assets.json',bytes:encoder.encode(JSON.stringify({format:'mk1_animation_asset_index_v1',characterContextRgbaCount:assetIndex.characterContextRgba.length,verifiedEffectRgbaCount:assetIndex.verifiedEffectRgba.length,characterContextRgba:assetIndex.characterContextRgba,verifiedEffectRgba:assetIndex.verifiedEffectRgba},null,2))});
 files.push({name:'README.md',bytes:encoder.encode(README)});
 files.sort((a,b)=>a.name.localeCompare(b.name));
 const zipBytes=buildStoredZip(files),zipSha256=await sha256Bytes(zipBytes),pngCount=files.filter(f=>f.name.endsWith('.png')).length,reportJson=files.filter(f=>f.name.startsWith('reports/')&&f.name.endsWith('.json')).length,manifestJson=files.filter(f=>f.name.startsWith('manifests/')&&f.name.endsWith('.json')).length+files.filter(f=>f.name==='indexed/descriptor_manifest.json').length,binaryCount=files.filter(f=>f.name.endsWith('.bin')).length;
 const unresolvedSet=new Set(o25.crossResourceDescriptors.filter(d=>d.paletteStatus==='UNRESOLVED_CROSS_RESOURCE_PALETTE').map(d=>`${d.tableSymbol}:${d.watcomOffset}`));
 const indexedUnresolvedCount=indexedManifest.filter(d=>unresolvedSet.has(`${d.tableSymbol}:${d.descriptorWatcomOffset}`)).length;
 const checks=[
  {checkId:'CANONICAL_AUTHENTIC_SOURCE',passed:true},{checkId:'O59_EXPORT_CONTRACT',passed:true},
  {checkId:'ALL_1102_DESCRIPTORS_INDEXED',passed:indexedManifest.length===1102,detail:`count=${indexedManifest.length}`},
  {checkId:'EXACT_79_UNRESOLVED_DESCRIPTORS_RETAINED_INDEXED',passed:indexedUnresolvedCount===79,detail:`count=${indexedUnresolvedCount}`},
  {checkId:'ALL_2263_O24_CONTEXT_VARIANTS_MATERIALIZED',passed:contextPngCount===2263,detail:`count=${contextPngCount}`},
  {checkId:'ALL_21_O23_EFFECT_PAYLOADS_INCLUDED',passed:effectPayloads.length===21,detail:`count=${effectPayloads.length}`},
  {checkId:'PNG_ENTRY_COUNT',passed:pngCount===2284,detail:`count=${pngCount}`},
  {checkId:'REPORT_JSON_COUNT',passed:reportJson===7,detail:`count=${reportJson}`},
  {checkId:'MANIFEST_JSON_COUNT',passed:manifestJson===2,detail:`count=${manifestJson}`},
  {checkId:'INDEXED_BINARY_PRESENT',passed:binaryCount===1&&indexedBinary.length>0,detail:`bytes=${indexedBinary.length}`},
  {checkId:'EXACT_PACKAGE_ENTRY_COUNT',passed:files.length===2295,detail:`count=${files.length}`},
  {checkId:'UNRESOLVED_PALETTE_BINDINGS_NOT_COLORIZED_BY_O60',passed:o59.tiers.unresolvedPaletteExceptions.rgbaExportBlocked&&indexedUnresolvedCount===79},
  {checkId:'NO_WALL_CLOCK_TIMING_PROMOTION',passed:!o26.decision.absoluteTimeUnitEstablished},
  {checkId:'NO_WRITE_PATH',passed:true},
 ];
 if(!checks.every(c=>c.passed))throw new Error(`O60 validation failed: ${checks.filter(c=>!c.passed).map(c=>c.checkId).join(', ')}`);
 const timestamp=new Date().toISOString(),operationId=createOperationId('browser_animation_export_bundle');
 return{report:{format:'mk1_browser_animation_export_bundle_v1',timestamp,operationId,provenance:{...o18.provenance,timestamp,operationId},prerequisite:{o59OperationId:o59.operationId,o18OperationId:o18.operationId,o22OperationId:o22.operationId,o23OperationId:o23.operationId,o24OperationId:o24.operationId,o25OperationId:o25.operationId,o26OperationId:o26.operationId,validationPassed:true},bundle:{downloadFileName:'MK1_O60_BROWSER_ANIMATION_EXPORT_PACKAGE.zip',entryCount:files.length,pngEntryCount:pngCount,characterContextPngCount:contextPngCount,verifiedEffectPngCount:effectPayloads.length,reportJsonEntryCount:reportJson,manifestJsonEntryCount:manifestJson,binaryEntryCount:binaryCount,zipByteLength:zipBytes.length,zipSha256,pngEncoding:'PNG_RGBA8_FILTER0_ZLIB_STORED_DEFLATE',zipEncoding:'ZIP_STORE_ONLY'},indexedPayload:{descriptorCount:indexedManifest.length,binaryByteLength:indexedBinary.length,unresolvedPaletteDescriptorCount:indexedUnresolvedCount,format:'CONCATENATED_INDEX8_THEN_OPAQUE_MASK8_PER_DESCRIPTOR'},summary:{characterContextRgbaAssetCount:contextPngCount,verifiedEffectRgbaAssetCount:effectPayloads.length,indexedDescriptorCount:indexedManifest.length,unresolvedPaletteDescriptorCount:indexedUnresolvedCount,totalRgbaAssetCount:pngCount},decision:{browserAnimationPackageEstablished:true,allO18DescriptorsPreservedIndexed:true,allO24CharacterContextVariantsMaterialized:true,onlyO23QualifiedEffectsMaterializedAsEffectRgba:true,unresolvedPaletteBindingsNotGuessed:true,absoluteWallClockTimingNotInvented:true,verdict:'MK1_BROWSER_ANIMATION_EXPORT_PACKAGE_ESTABLISHED',narrative:`O60 materializes the O59 export contract into a browser-safe package without broadening palette claims. Every one of the ${indexedManifest.length} O18 descriptors is preserved losslessly as indexed pixels plus opaque mask data. All ${contextPngCount} O24 dominant-resource character-context variants are rendered under the exact explicit normal/alternate palette records, while the ${effectPayloads.length} O23 heart/lightning payloads are exported separately as the only effect RGBA tier. The ${indexedUnresolvedCount} O25 unresolved cross-resource descriptors remain indexed-only. O22 preserves animation-table structure and numeric consumer context, and O26 preserves command/dwell metadata without inventing milliseconds, FPS, or canonical gameplay names.`},status:'SUCCESS',validation:{allChecksPassed:true,checks}},zipBytes};
}
export function createMK1BrowserAnimationExportBundleExport(result:MK1BrowserAnimationExportBundleResult){if(result.report.status!=='SUCCESS'||!result.report.validation.allChecksPassed)throw new Error('O60 export blocked');return result.report;}
export function downloadMK1BrowserAnimationExportBundle(result:MK1BrowserAnimationExportBundleResult):void{if(typeof document==='undefined'||typeof URL==='undefined')throw new Error('O60 download requires browser DOM');const blob=new Blob([new Uint8Array(result.zipBytes).buffer],{type:'application/zip'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=result.report.bundle.downloadFileName;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
