/** MK2 JC0 verified unnamed palette-context RGBA fixtures — Pass 1E.3O.74. */
import { DirectorySource, SourceFileEntry } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { MK2IndexedGraphicsPackage } from './indexedGraphicsDecodeFoundation';
import { MK2PaletteStorageSelectionReconnaissanceReport } from './paletteStorageSelectionReconnaissance';
import { MK2CharacterResourcePaletteSlotJoinReport } from './characterResourcePaletteSlotJoin';

const EXPECTED_EXE_SHA256='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const EXPECTED_JC0_SHA256='ef7b96d1725f45386f9503b252602db3ae22ab7ef638a3f1add91adb42079f1b';
const EXPECTED_PALETTE_A_SHA256='7adc8dc507fe4f8008179bb711de2f0c16e24bcbe989074f33352890080badec';
const EXPECTED_PALETTE_B_SHA256='f9d2bf2a5327d4dd0b761a948e2c883831ad654820869c214bea797e44a3130e';
const SLOT=2, LUT_OBJECT2=0x1084, LUT_PHYSICAL=0xa1cd8, RENDERER_START=0x659e7;
const encoder=new TextEncoder();
function hex(n:number){return `0x${n.toString(16).toUpperCase()}`;}
function u16(b:Uint8Array,o:number){return b[o]|(b[o+1]<<8);} function u32(b:Uint8Array,o:number){return new DataView(b.buffer,b.byteOffset+o,4).getUint32(0,true);}
function findEntry(es:SourceFileEntry[],n:string){const e=es.find(x=>x.path.toUpperCase()===n.toUpperCase());if(!e)throw new Error(`O74 missing ${n}`);return e;}
async function sha256(b:Uint8Array){const d=await crypto.subtle.digest('SHA-256',b.slice().buffer);return Array.from(new Uint8Array(d),x=>x.toString(16).padStart(2,'0')).join('');}
function rgb6(w:number):[number,number,number]{return [((w>>>9)&0x3f)|1,((w>>>4)&0x3f)|1,((w<<1)&0x3f)|1];}
function rgb8(w:number):[number,number,number]{return rgb6(w).map(v=>Math.round(v*255/63)) as [number,number,number];}
function colorize(indices:Uint8Array,mask:Uint8Array,words:number[]){const rgba=new Uint8Array(indices.length*4);for(let i=0;i<indices.length;i++){if(!mask[i])continue;const idx=indices[i];if(idx<1||idx>words.length)throw new Error(`O74 palette range ${idx}`);const [r,g,b]=rgb8(words[idx-1]),p=i*4;rgba[p]=r;rgba[p+1]=g;rgba[p+2]=b;rgba[p+3]=255;}return rgba;}
function u32be(n:number){return new Uint8Array([(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255]);}
function concat(ps:Uint8Array[]){let n=0;for(const p of ps)n+=p.length;const o=new Uint8Array(n);let x=0;for(const p of ps){o.set(p,x);x+=p.length;}return o;}
function crc32(b:Uint8Array){let c=0xffffffff;for(const x of b){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function adler32(b:Uint8Array){let a=1,c=0;for(const x of b){a=(a+x)%65521;c=(c+a)%65521;}return((c<<16)|a)>>>0;}
function chunk(t:string,d:Uint8Array){const tb=encoder.encode(t),body=concat([tb,d]);return concat([u32be(d.length),body,u32be(crc32(body))]);}
function zlibStored(b:Uint8Array){const ps=[new Uint8Array([0x78,0x01])] as Uint8Array[];let o=0;while(o<b.length){const n=Math.min(65535,b.length-o),f=o+n===b.length;ps.push(new Uint8Array([f?1:0,n&255,(n>>>8)&255,(~n)&255,((~n)>>>8)&255]),b.subarray(o,o+n));o+=n;}if(!b.length)ps.push(new Uint8Array([1,0,0,255,255]));ps.push(u32be(adler32(b)));return concat(ps);}
function png(w:number,h:number,rgba:Uint8Array){const row=w*4+1,raw=new Uint8Array(row*h);for(let y=0;y<h;y++){raw[y*row]=0;raw.set(rgba.subarray(y*w*4,(y+1)*w*4),y*row+1);}const ih=new Uint8Array(13);ih.set(u32be(w),0);ih.set(u32be(h),4);ih[8]=8;ih[9]=6;return concat([new Uint8Array([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlibStored(raw)),chunk('IEND',new Uint8Array(0))]);}

export interface MK2JC0PaletteContextRgbaFixturesReport{
 format:'mk2_jc0_palette_context_rgba_fixtures_v1';timestamp:string;operationId:string;
 provenance:{sourceKind:'user-loaded-directory';exeSha256:string;jc0Sha256:string;synthetic:false};
 prerequisite:{o68Verdict:string;o71Verdict:string;o73Verdict:string;validationPassed:true};
 pixelPaletteMapping:{paletteHandleDacStartField:'+0x06';rendererPhysical:number;replicatedByteLookupObject2Offset:number;replicatedByteLookupPhysical:number;lookupEntryCount:256;mapping:'opaque sprite index N (1..63) -> palette record colour N-1';established:true};
 paletteContexts:Array<{context:'selector_table_A_slot_02'|'selector_table_B_slot_02';semanticNameEstablished:false;recordObject1Offset:number;recordPhysical:number;colorCount:63;rawRecordSha256:string;dacRgb6:Array<[number,number,number]>;pngRgb8:Array<[number,number,number]>;rgb8ExpansionPolicy:'ROUND_DAC6_TIMES_255_OVER_63'}>;
 assets:Array<{context:'selector_table_A_slot_02'|'selector_table_B_slot_02';ordinal:number;descriptorPhysical:number;graOffset:number;width:number;height:number;pngPath:string;rgbaSha256:string}>;
 package:{downloadFileName:'MK2_O74_JC0_PALETTE_CONTEXT_RGBA_PACKAGE.zip';entryCount:75;pngEntryCount:70;paletteBinaryEntryCount:2;manifestEntryCount:2;readmeEntryCount:1;byteLength:number;sha256:string;zipEncoding:'ZIP_STORE_ONLY';pngEncoding:'PNG_RGBA8_FILTER0_ZLIB_STORED_DEFLATE'};
 decision:{jc0ResourceToPaletteSlotJoinInheritedFromO73:true;pixelIndexToPaletteEntryMappingEstablished:true;twoUnnamedPaletteContextRgbaSetsEstablished:true;humanCharacterNamePromoted:false;paletteContextNamesPromoted:false;broadResourcePaletteOwnershipPromoted:false;mk1AssumptionsImported:false;verdict:'MK2_JC0_TWO_UNNAMED_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED';narrative:string};
 status:'SUCCESS';validation:{allChecksPassed:true;checks:Array<{id:string;passed:boolean;detail:string}>};
}
export interface MK2JC0PaletteContextRgbaFixturesResult{report:MK2JC0PaletteContextRgbaFixturesReport;zipBytes:Uint8Array;}

export async function executeMK2JC0PaletteContextRgbaFixtures(source:DirectorySource,o68:MK2IndexedGraphicsPackage,o71:MK2PaletteStorageSelectionReconnaissanceReport,o73:MK2CharacterResourcePaletteSlotJoinReport):Promise<MK2JC0PaletteContextRgbaFixturesResult>{
 if(source.isSynthetic||o68.report.status!=='SUCCESS'||o71.status!=='SUCCESS'||o73.status!=='SUCCESS')throw new Error('O74 verified O68/O71/O73 prerequisites required');
 if(!o73.jc0Join.identitySlotEstablished||o73.jc0Join.identitySlot!==SLOT||o73.jc0Join.paletteSelectorSlot!==SLOT||!o73.jc0Join.sameIdentityFieldJoinEstablished)throw new Error('O74 O73 slot-2 join not established');
 const entries=await source.listRecursive(),ee=findEntry(entries,'MK2.EXE'),je=findEntry(entries,'JC0.GRA'),exe=await source.readSlice(ee.path,0,ee.size),jc0=await source.readSlice(je.path,0,je.size),exeSha=await sha256(exe),jcSha=await sha256(jc0);if(exeSha!==EXPECTED_EXE_SHA256||jcSha!==EXPECTED_JC0_SHA256)throw new Error('O74 authentic identity mismatch');
 const contexts=[
  {context:'selector_table_A_slot_02' as const,object1:o73.jc0Join.tableA.paletteObject1Offset,physical:o73.jc0Join.tableA.palettePhysical,expected:EXPECTED_PALETTE_A_SHA256},
  {context:'selector_table_B_slot_02' as const,object1:o73.jc0Join.tableB.paletteObject1Offset,physical:o73.jc0Join.tableB.palettePhysical,expected:EXPECTED_PALETTE_B_SHA256},
 ];
 const files:Array<{name:string;bytes:Uint8Array}>=[], wordsByContext=new Map<string,number[]>(),paletteContexts:MK2JC0PaletteContextRgbaFixturesReport['paletteContexts']=[];
 for(const c of contexts){if(u16(exe,c.physical)!==63)throw new Error(`O74 ${c.context} count`);const raw=exe.slice(c.physical,c.physical+128),rawSha=await sha256(raw);if(rawSha!==c.expected)throw new Error(`O74 ${c.context} raw SHA ${rawSha}`);const words=Array.from({length:63},(_,i)=>u16(exe,c.physical+2+i*2));wordsByContext.set(c.context,words);files.push({name:`palettes/${c.context}.palette_record.bin`,bytes:raw});paletteContexts.push({context:c.context,semanticNameEstablished:false,recordObject1Offset:c.object1,recordPhysical:c.physical,colorCount:63,rawRecordSha256:rawSha,dacRgb6:words.map(rgb6),pngRgb8:words.map(rgb8),rgb8ExpansionPolicy:'ROUND_DAC6_TIMES_255_OVER_63'});}
 const lutOk=Array.from({length:256},(_,i)=>u32(exe,LUT_PHYSICAL+i*4)===((i|(i<<8)|(i<<16)|(i<<24))>>>0)).every(Boolean);
 const rendererHandleSig=[0x8a,0x04,0xc5,0x06,0x5b,0x07,0x00,0x48,0x25,0xff,0x00,0x00,0x00,0x8b,0x14,0x85,0x84,0x10,0x00,0x00];
 const rendererAddSig=[0xad,0x03,0xc2,0xab];
 const assets:MK2JC0PaletteContextRgbaFixturesReport['assets']=[];
 for(const d of o68.report.descriptorCorpus.descriptors){const base=`jc0/indexed/${String(d.ordinal).padStart(2,'0')}_${d.graOffset.toString(16).padStart(6,'0')}`,indices=o68.assets.get(`${base}.indices.bin`),mask=o68.assets.get(`${base}.mask.bin`);if(!indices||!mask)throw new Error(`O74 missing O68 payload ${d.ordinal}`);for(const c of contexts){const rgba=colorize(indices,mask,wordsByContext.get(c.context)!);const path=`rgba/${c.context}/${String(d.ordinal).padStart(2,'0')}_${d.graOffset.toString(16).padStart(6,'0')}.png`;files.push({name:path,bytes:png(d.width,d.height,rgba)});assets.push({context:c.context,ordinal:d.ordinal,descriptorPhysical:d.descriptorPhysical,graOffset:d.graOffset,width:d.width,height:d.height,pngPath:path,rgbaSha256:await sha256(rgba)});}}
 const paletteManifest={format:'mk2_o74_jc0_palette_context_manifest_v1',resourceName:'JC0.GRA',resourceId:109,identitySlot:2,paletteSelectorSlot:2,semanticContextNamesEstablished:false,pixelMapping:'opaque sprite index N (1..63) -> palette record colour N-1',rgb8ExpansionPolicy:'ROUND_DAC6_TIMES_255_OVER_63',contexts:paletteContexts};
 const assetManifest={format:'mk2_o74_jc0_palette_context_rgba_assets_v1',resourceName:'JC0.GRA',descriptorCount:35,contextCount:2,pngCount:70,assets};
 files.push({name:'manifests/palettes.json',bytes:encoder.encode(JSON.stringify(paletteManifest,null,2))},{name:'manifests/assets.json',bytes:encoder.encode(JSON.stringify(assetManifest,null,2))},{name:'README.md',bytes:encoder.encode('# MK2 O74 JC0 unnamed palette-context RGBA package\n\nThis package contains all 35 O68 JC0 indexed sprites rendered under the two exact palette records that O73 mechanically joins to selector slot 2. The contexts are deliberately structural names (`selector_table_A_slot_02` and `selector_table_B_slot_02`); no normal/alternate, player-number, or other gameplay meaning is claimed. MK2 renderer evidence establishes source index N -> palette record colour N-1. PNG display channels are a deterministic expansion of the executable-proven 6-bit DAC components using round(component * 255 / 63).\n')});
 files.sort((a,b)=>a.name.localeCompare(b.name));const zipBytes=buildStoredZip(files),zipSha=await sha256(zipBytes);
 const checks:Array<{id:string;passed:boolean;detail:string}>=[];const ck=(id:string,passed:boolean,detail:string)=>checks.push({id,passed,detail});
 ck('authentic_identity',exeSha===EXPECTED_EXE_SHA256&&jcSha===EXPECTED_JC0_SHA256,`${exeSha} / ${jcSha}`);
 ck('o73_slot2_join',o73.jc0Join.identitySlot===2&&o73.jc0Join.paletteSelectorSlot===2&&o73.jc0Join.sameIdentityFieldJoinEstablished,'JC0 -> identity 2 -> palette slot 2');
 ck('palette_records',paletteContexts.length===2&&paletteContexts.every(x=>x.colorCount===63),paletteContexts.map(x=>`${hex(x.recordPhysical)}:${x.rawRecordSha256}`).join(','));
 ck('o71_dac_model',o71.paletteHandles.fields.dacStartIndex.offset===6&&o71.dacTransfer.packedColorBytes===2,'handle +0x06 / u16 packed colours');
 ck('renderer_handle_start_minus_one',rendererHandleSig.every((v,i)=>exe[0x659ea+i]===v),'read handle DAC start; decrement; LUT offset');
 ck('renderer_replicated_lut_pointer',u32(exe,0x659fa)===LUT_OBJECT2,`${hex(u32(exe,0x659fa))}`);
 ck('renderer_replicated_lut',lutOk,'256 entries n -> nnnn');
 ck('renderer_adds_offset_to_source_pixels',rendererAddSig.every((v,i)=>exe[0x65a14+i]===v),'lodsd; add edx; stosd');
 ck('o68_index_domain',o68.report.summary.opaqueIndexMin===1&&o68.report.summary.opaqueIndexMax===63,'1..63');
 ck('rgba_asset_count',assets.length===70,String(assets.length));
 ck('package_entry_count',files.length===75,String(files.length));
 ck('semantic_context_names_unresolved',paletteContexts.every(x=>!x.semanticNameEstablished),'structural selector names only');
 ck('scope_jc0_only',assets.every(x=>x.ordinal>=0&&x.ordinal<35),'no broader resource-family promotion');
 const failed=checks.filter(x=>!x.passed);if(failed.length)throw new Error(`O74 validation failed: ${failed.map(x=>x.id).join(', ')}`);
 const timestamp=new Date().toISOString(),operationId=createOperationId('mk2_jc0_palette_context_rgba_fixtures');
 const report:MK2JC0PaletteContextRgbaFixturesReport={format:'mk2_jc0_palette_context_rgba_fixtures_v1',timestamp,operationId,provenance:{sourceKind:'user-loaded-directory',exeSha256:exeSha,jc0Sha256:jcSha,synthetic:false},prerequisite:{o68Verdict:o68.report.decision.verdict,o71Verdict:o71.decision.verdict,o73Verdict:o73.decision.verdict,validationPassed:true},pixelPaletteMapping:{paletteHandleDacStartField:'+0x06',rendererPhysical:RENDERER_START,replicatedByteLookupObject2Offset:LUT_OBJECT2,replicatedByteLookupPhysical:LUT_PHYSICAL,lookupEntryCount:256,mapping:'opaque sprite index N (1..63) -> palette record colour N-1',established:true},paletteContexts,assets,package:{downloadFileName:'MK2_O74_JC0_PALETTE_CONTEXT_RGBA_PACKAGE.zip',entryCount:75,pngEntryCount:70,paletteBinaryEntryCount:2,manifestEntryCount:2,readmeEntryCount:1,byteLength:zipBytes.length,sha256:zipSha,zipEncoding:'ZIP_STORE_ONLY',pngEncoding:'PNG_RGBA8_FILTER0_ZLIB_STORED_DEFLATE'},decision:{jc0ResourceToPaletteSlotJoinInheritedFromO73:true,pixelIndexToPaletteEntryMappingEstablished:true,twoUnnamedPaletteContextRgbaSetsEstablished:true,humanCharacterNamePromoted:false,paletteContextNamesPromoted:false,broadResourcePaletteOwnershipPromoted:false,mk1AssumptionsImported:false,verdict:'MK2_JC0_TWO_UNNAMED_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED',narrative:'O73 mechanically joins JC0.GRA to identity/palette selector slot 2 and two exact counted 63-colour records. O74 independently closes the remaining pixel-to-palette relation in MK2 renderer code: the renderer reads palette-handle DAC start +0x06, subtracts one, resolves a 256-entry replicated-byte lookup offset, then adds that offset to packed source index bytes; O71 independently establishes that record colour 0 is transferred starting at the handle DAC start. Therefore opaque source index N maps to record colour N-1. All 35 O68 JC0 indexed sprites are rendered under both exact slot-2 records for 70 deterministic RGBA fixtures. The two contexts retain structural selector-table names only; human fighter naming, normal/alternate or player-number semantics, and palette ownership beyond JC0 are not promoted.'},status:'SUCCESS',validation:{allChecksPassed:true,checks}};
 return {report,zipBytes};
}
export function createMK2JC0PaletteContextRgbaFixturesExport(r:MK2JC0PaletteContextRgbaFixturesResult){if(r.report.status!=='SUCCESS'||!r.report.validation.allChecksPassed)throw new Error('O74 verified report required');return r.report;}
