/** O196 — Forest's original complete indexed floor and its source-linked palette candidate.
 * No borrowed Portal palette; no runtime palette-handle, camera, or full-scene assertion.
 * Original commercial EXE/GRA must be selected by the user; operations are read-only.
 */
import type {DirectorySource,SourceFileEntry} from '../filesystem/DirectorySource';
import {hash,utf8} from '../assets/model';
import {download} from '../assets/export';
import {buildStoredZip} from '../research/researchArtifactDownloads';
import {encodeOriginalEffectRgbaPngO177} from '../../games/mk2/research/stageSourcePngO177';
import {runO195CrossStageFloor} from './o195';

export const O196_EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
export const O196_FOREST_SHA='8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9';
const FLOOR_OFFSET=198116,WIDTH=896,HEIGHT=32,PALETTE_AT=0x89324,OBJECT1=0x61c54,OBJECT2=0xa0c54,PALETTE_TABLE=0x171d0;
const SETUPS=[0x16f8c,0x16f9e,0x16fb0,0x16fc2,0x16fd4] as const;
function need(ok:boolean,msg:string):asserts ok {if(!ok)throw new Error('O196 Forest source: '+msg);}
function u16(v:DataView,p:number){return v.getUint16(p,true);}
function u32(v:DataView,p:number){return v.getUint32(p,true);}
function i16(n:number){return n>=32768?n-65536:n;}
function fileByName(files:SourceFileEntry[],name:string){const hits=files.filter(f=>f.name.toUpperCase()===name);need(hits.length===1,`expected one ${name}, got ${hits.length}`);return hits[0];}
async function read(source:DirectorySource,entry:SourceFileEntry){const data=await source.readSlice(entry.path,0,entry.size);need(data.length===entry.size,`truncated ${entry.path}`);return data;}
export type O196Setup={object2Offset:number;physical:number;width:number;height:number;controlCount:number;controlObject2:number;
 descriptorTableObject2:number;paletteTableObject2:number;resourceIDs:number[];controls:{ordinal:number;controlObject2:number;flags:number;
 sourceX:number;sourceY:number;paletteSlot:number;descriptorObject2:number;width:number;height:number;graOffset:number;resourceID:number;}[]};
export type O196ForestReport={format:'mkdos_o196_forest_native_floor_source_palette_v1';status:'source-verified-plus-candidate-colors';
 timestamp:string;original:{exePath:string;exeSHA256:string;forestPath:string;forestSHA256:string;forestByteLength:number};
 floor:{width:896;height:32;sourceGRAOffset:198116;sourceByteLength:number;indicesSHA256:string;indices:Uint8Array;rgba:Uint8Array;rgbaSHA256:string;histogram:{index:number;count:number}[]};
 palette:{sourcePhysical:number;recordCount:80;firstIndex:1;sourceRecordSHA256:string;pointerTableObject2:number;slot2PointerPhysical:number;
 colors:{index:number;wordPhysical:number;rawWord:number;dac6:number[];rgb8:number[]}[];runtimeSelectionVerified:false;};
 setups:O196Setup[];rendererEvidence:{stageIndex:4;resourceID:27;originalPackedCommandPhysical:number;rawDestinationY:172;requestedRows:32;
 packedSuffixStart:198116;cameraCropApplied:false;runtimeFloorActivationObserved:false;};
 limitations:string[]};
/** All table and setup fields are guarded with original EXE hash and explicit expected topology.
 * The previous O195/O131 check establishes the separate packed-plane source claim.
 * The stage palette association is static; its use for floor DAC output is still unobserved.
 */
export async function runO196ForestFloor(source:DirectorySource):Promise<O196ForestReport>{
 const list=await source.listRecursive();const ef=fileByName(list,'MK2.EXE'),gf=fileByName(list,'FOREST.GRA');
 const [exe,gra]=await Promise.all([read(source,ef),read(source,gf)]);
 need(exe.byteLength===861133&&await hash(exe)===O196_EXE_SHA,'original MK2.EXE identity mismatch');
 need(gra.byteLength===226788&&await hash(gra)===O196_FOREST_SHA,'original FOREST.GRA identity mismatch');
 const reference=await runO195CrossStageFloor(source);
 const row=reference.rows.find(r=>r.stage==='FOREST.GRA');
 need(!!row&&row.stageIndex===4&&row.sourceResourceID===27&&row.sourceResourceSuffix===FLOOR_OFFSET&&
 row.rawDestinationY===172&&row.requestedRows===32,'O195/O131 floor command source disagreement');
 need(FLOOR_OFFSET+WIDTH*HEIGHT===gra.length,'full 896x32 original suffix');
 const view=new DataView(exe.buffer,exe.byteOffset,exe.byteLength);
 need(u16(view,PALETTE_AT)===80,'original Forest palette record count');
 need(u32(view,OBJECT2+PALETTE_TABLE+8)===PALETTE_AT-OBJECT1,'Forest palette slot 2 pointer');
 for(let j=0;j<8;j++)need(u32(view,OBJECT2+PALETTE_TABLE+j*4)===PALETTE_AT-OBJECT1,`Forest palette pointer table entry ${j}`);
 const colors:O196ForestReport['palette']['colors']=[];
 for(let i=0;i<80;i++){
  const wordPhysical=PALETTE_AT+2+i*2,rawWord=u16(view,wordPhysical);
  const dac6=[((rawWord>>>9)&63)|1,((rawWord>>>4)&63)|1,((rawWord<<1)&63)|1];
  colors.push({index:i+1,wordPhysical,rawWord,dac6,rgb8:dac6.map(v=>(v<<2)|(v>>4))});
 }
 const setups:O196Setup[]=[];
 for(const setup of SETUPS){
  const physical=OBJECT2+setup,width=u16(view,physical),height=u16(view,physical+2),controlCount=u16(view,physical+4);
  const controlObject2=u32(view,physical+6),descriptorTableObject2=u32(view,physical+10),paletteTableObject2=u32(view,physical+14);
  need(width>0&&width<=1500&&height>0&&height<=1000&&controlCount>0&&controlCount<=60,'Forest setup dimensions or count');
  need(paletteTableObject2===PALETTE_TABLE,'Forest setup palette table mismatch');
  const controls:O196Setup['controls']=[];
  for(let ordinal=0;ordinal<controlCount;ordinal++){
   const controlObject2Offset=controlObject2+8*ordinal,at=OBJECT2+controlObject2Offset;
   need(at+8<=exe.length,'Forest control outside EXE');
   const flags=u16(view,at),x=u16(view,at+2),y=u16(view,at+4),pair=u16(view,at+6);
   const paletteSlot=(flags&15)|((pair&0xf000)>>>8),descriptorObject2=descriptorTableObject2+((pair&0xfff)*4),descriptorAt=OBJECT2+descriptorObject2;
   need(paletteSlot===2&&descriptorAt+8<=exe.length,'unqualified Forest control palette or descriptor');
   const dw=u16(view,descriptorAt),dh=u16(view,descriptorAt+2),packed=u32(view,descriptorAt+4);
   const resourceID=packed>>>24,graOffset=packed&0xffffff;
   need(dw>0&&dh>0&&resourceID===27&&graOffset<gra.length,'Forest descriptor resource ownership');
   controls.push({ordinal,controlObject2:controlObject2Offset,flags,sourceX:i16(x),sourceY:i16(y),paletteSlot,
    descriptorObject2,width:dw,height:dh,graOffset,resourceID});
  }
  setups.push({object2Offset:setup,physical,width,height,controlCount,controlObject2,descriptorTableObject2,
   paletteTableObject2,resourceIDs:[27],controls});
 }
 need(setups.reduce((n,s)=>n+s.controlCount,0)===60,'expected five source setup variants (60 control entries)');
 const indices=gra.slice(FLOOR_OFFSET),rgba=new Uint8Array(indices.length*4),counts=new Uint32Array(256);
 for(let p=0;p<indices.length;p++){
  const ix=indices[p];need(ix>=1&&ix<=80,`floor source index outside candidate counted palette: ${ix}`);
  counts[ix]++;
  const rgb=colors[ix-1].rgb8;rgba.set([rgb[0],rgb[1],rgb[2],255],p*4);
 }
 return {format:'mkdos_o196_forest_native_floor_source_palette_v1',status:'source-verified-plus-candidate-colors',timestamp:new Date().toISOString(),
  original:{exePath:ef.path,exeSHA256:O196_EXE_SHA,forestPath:gf.path,forestSHA256:O196_FOREST_SHA,forestByteLength:gra.length},
  floor:{width:WIDTH,height:HEIGHT,sourceGRAOffset:FLOOR_OFFSET,sourceByteLength:indices.length,indicesSHA256:await hash(indices),
   indices,rgba,rgbaSHA256:await hash(rgba),histogram:Array.from(counts,(count,index)=>({index,count})).filter(x=>x.count>0)},
  palette:{sourcePhysical:PALETTE_AT,recordCount:80,firstIndex:1,sourceRecordSHA256:await hash(exe.slice(PALETTE_AT,PALETTE_AT+162)),
   pointerTableObject2:PALETTE_TABLE,slot2PointerPhysical:OBJECT2+PALETTE_TABLE+8,colors,runtimeSelectionVerified:false},
  setups,rendererEvidence:{stageIndex:4,resourceID:27,originalPackedCommandPhysical:row.originalPackedCommandPhysical,
   rawDestinationY:172,requestedRows:32,packedSuffixStart:FLOOR_OFFSET,cameraCropApplied:false,runtimeFloorActivationObserved:false},
  limitations:['896×32 pixels and source indices are authentic GRA data; this is not a 320×200 screenshot or complete Forest scene.',
   'The 80-color record belongs to the Forest setup family by source pointer tables; use for packed-floor output and live DAC handle/bank is a candidate, NOT runtime-witnessed.',
   'Palette index zero is not present in this floor suffix and is not assigned a synthesized color.',
   'No original per-layer placement, runtime activation, camera state, scene timing or animation is reconstructed.',
   'The original graphic and executable are never written to or patched.']};
}
export function o196ColorPng(r:O196ForestReport){return encodeOriginalEffectRgbaPngO177(896,32,r.floor.rgba);}
export function o196IndexPreviewPng(r:O196ForestReport){const grey=new Uint8Array(r.floor.indices.length*4);
 for(let i=0;i<r.floor.indices.length;i++){grey.fill(r.floor.indices[i],4*i,4*i+3);grey[i*4+3]=255;}return encodeOriginalEffectRgbaPngO177(896,32,grey);}
const j=(v:unknown)=>utf8.encode(JSON.stringify(v,null,2));
export function buildO196ForestForensicZip(r:O196ForestReport){
 const {indices,rgba,...floorMetadata}=r.floor;
 const summary=`# O196 — original MK2 Forest packed floor and palette-source candidate\n\n`+
 `**Source-verified original plane:** FOREST.GRA bytes 0x${r.floor.sourceGRAOffset.toString(16)}–0x${(r.floor.sourceGRAOffset+r.floor.sourceByteLength).toString(16)} (exclusive), native 896 × 32; 28,672 original indices.\n\n`+
 `**Source-linked color candidate:** original MK2.EXE counted 80-color palette at physical 0x89324, reached from five Forest setup variants via palette table Object-2 0x171d0 (slot 2). No runtime palette/DAC witness.\n\n`+
 `The candidate-color PNG is a reproducible visualization, not proven in-game Forest coloring or a screenshot. The index binary is exact original source data.\n\n`+
 `## Limits\n${r.limitations.map(x=>'- '+x).join('\n')}\n`;
 return buildStoredZip([
  {name:'SUMMARY.md',bytes:utf8.encode(summary)},
  {name:'MANIFEST.json',bytes:j({format:r.format,status:r.status,timestamp:r.timestamp,sourceGameFilesBundled:false,
    derivedOriginalPixelsIncluded:true,original:r.original,outputFloor:floorMetadata,paletteSource:r.palette.sourcePhysical})},
  {name:'evidence/original_offsets_and_hashes.json',bytes:j({original:r.original,floor:floorMetadata,
    palette:{physical:r.palette.sourcePhysical,recordSHA256:r.palette.sourceRecordSHA256,pointerTableObject2:r.palette.pointerTableObject2,
     slot2PointerPhysical:r.palette.slot2PointerPhysical},rendererEvidence:r.rendererEvidence})},
  {name:'evidence/forest_setup_palette_descriptor_links.json',bytes:j(r.setups)},
  {name:'evidence/palette_80_original_words_and_candidate_rgb.json',bytes:j(r.palette)},
  {name:'results/source_index_histogram.json',bytes:j(r.floor.histogram)},
  {name:'results/forest_896x32_original_indices.bin',bytes:r.floor.indices},
  {name:'results/forest_896x32_candidate_rgba.png',bytes:o196ColorPng(r)},
  {name:'results/forest_896x32_index_preview.png',bytes:o196IndexPreviewPng(r)},
  {name:'diagnostics/limitations.json',bytes:j(r.limitations)},
  {name:'reproduce/parameters.json',bytes:j({requiredMK2EXE_SHA256:r.original.exeSHA256,requiredFORESTGRA_SHA256:r.original.forestSHA256,
    resourceID:27,packedSuffixStart:198116,stride:896,rows:32,palettePhysical:0x89324,firstIndex:1,
    sourcePaletteIsCandidate:true,setupObject2Offsets:[...SETUPS],slot2PointerTableObject2:PALETTE_TABLE})},
  {name:'reproduce/README.md',bytes:utf8.encode('In MK DOS Archive O196, choose original MK2.EXE and FOREST.GRA; open Laboratory > Compile & hypotheses > Forest source floor; run and export. Verify original file SHA-256s in MANIFEST.json. Extract FOREST.GRA[198116:] as exactly 896*32 indexed bytes. Resolve palette via counted 80-color original record EXE[0x89324], and authenticate the five setup Object-2 records referencing table 0x171d0. Apply original DOS packed word DAC6 mapping and 6-to-8 bit replication; do not infer runtime palette selection or stage placement. For independent verification run python scripts/verify-o196-export.py <original game dir> <this evidence zip>.')}
 ]);
}
export function exportO196ForestForensicZip(r:O196ForestReport){download(buildO196ForestForensicZip(r),'MKDOS_O196_Forest_Native_Floor_Forensic.zip','application/zip');}
