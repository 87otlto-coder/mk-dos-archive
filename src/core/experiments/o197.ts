/** O197 — independent MK2 Forest setup-local indexed layers.
 * A verified decoder applied to original descriptor rows; candidate EXE colors are
 * deliberately NOT an assertion of runtime composition, order, camera or palette.
 */
import type {DirectorySource} from '../filesystem/DirectorySource';
import {hash,utf8} from '../assets/model';
import {download} from '../assets/export';
import {buildStoredZip} from '../research/researchArtifactDownloads';
import {encodeOriginalEffectRgbaPngO177} from '../../games/mk2/research/stageSourcePngO177';
import {runO196ForestFloor,type O196Setup,type O196ForestReport,O196_FOREST_SHA} from './o196';

const FOREST_FLOOR_START=198116,OBJECT2_PHYSICAL=0xa0c54;
function req(ok:boolean,message:string):asserts ok{if(!ok)throw new Error('O197 Forest setup layers: '+message);}
function dv32(b:Uint8Array,p:number){return (b[p]|(b[p+1]<<8)|(b[p+2]<<16)|(b[p+3]<<24))>>>0;}
export type O197Command={sourceOffset:number;row:number;x:number;kind:'skip'|'rle'|'literal';runLength:number;paletteIndex?:number;encodedEndExclusive:number;rawWord:number};
export type O197Stream={graOffset:number;width:number;height:number;graEndExclusive:number;encodedByteLength:number;encodedSHA256:string;
  indicesSHA256:string;opacitySHA256:string;opaquePixels:number;commands:O197Command[]};
export type O197Placement={ordinal:number;controlObject2:number;controlPhysical:number;descriptorObject2:number;descriptorPhysical:number;
  x:number;y:number;width:number;height:number;graOffset:number;graEndExclusive:number;paletteSlot:2;flags:number;painted:number;clipped:number;overwritten:number};
export type O197Layer={variant:number;setupObject2Offset:number;setupPhysical:number;width:number;height:number;placementCount:number;
  rgba:Uint8Array;indices:Uint8Array;opacity:Uint8Array;rgbaSHA256:string;indicesSHA256:string;opacitySHA256:string;
  opaquePixels:number;clippedOpaquePixels:number;overdrawOpaquePixels:number;placements:O197Placement[];streams:O197Stream[];
  qualification:'VERIFIED_INDEXED_SETUP_LOCAL_LAYER_CANDIDATE_PALETTE_NO_SCENE_PLACEMENT'};
export type O197Report={format:'mkdos_o197_forest_setup_layers_v1';status:'source-verified-indexed-setup-layers-candidate-colors';timestamp:string;
  original:O196ForestReport['original'];palette:{sourcePhysical:number;recordSHA256:string;runtimeSelectionVerified:false};
  sourceRenderer:{mode:'mk2_indexed_graphics_command_grammar';stageResource:'FOREST.GRA';stageResourceID:27;controlCount:60;setupCount:5;
   originalGRAFloorStart:number;sourcePaletteSlot:2;perLayerPlacementIsSetupLocal:true};
  layers:O197Layer[];limitations:string[]};

type Decoded={indices:Uint8Array;opacity:Uint8Array;stream:O197Stream};
async function decodeForestStream(gra:Uint8Array,start:number,width:number,height:number):Promise<Decoded>{
 req(Number.isInteger(start)&&start>=0&&start<FOREST_FLOOR_START,'invalid indexed-stream start');
 req(width>0&&height>0&&width*height<=250000,'invalid stream dimensions');
 const indices=new Uint8Array(width*height),opacity=new Uint8Array(width*height),commands:O197Command[]=[];
 let cursor=start,opaque=0;
 for(let row=0;row<height;row++){
  let x=0;
  while(x<width){
   req(cursor+4<=FOREST_FLOOR_START,'truncated indexed run or stream reached native floor');
   const sourceOffset=cursor,word=dv32(gra,cursor);cursor+=4;
   const kind:O197Command['kind']=(word&1)?'skip':(word&2)?'rle':'literal';
   const n=kind==='skip'?word>>>1:kind==='rle'?word>>>10:word>>>2;
   req(n>0&&n<=width-x,`invalid ${kind} length ${n} at 0x${sourceOffset.toString(16)} row ${row} x ${x}`);
   if(kind==='rle'){
    const color=(word>>>2)&255;req(color>=1&&color<=80,'opaque color outside source-linked palette');
    indices.fill(color,row*width+x,row*width+x+n);opacity.fill(1,row*width+x,row*width+x+n);opaque+=n;
   }else if(kind==='literal'){
    req(n<=64&&cursor+n<=FOREST_FLOOR_START,'invalid literal payload length or floor collision');
    for(let i=0;i<n;i++)req(gra[cursor+i]>=1&&gra[cursor+i]<=80,'opaque literal palette index outside source-linked palette');
    indices.set(gra.subarray(cursor,cursor+n),row*width+x);opacity.fill(1,row*width+x,row*width+x+n);opaque+=n;
    cursor+=(n+3)&~3;
    req(cursor<=FOREST_FLOOR_START,'literal alignment crosses native floor');
   }
   commands.push({sourceOffset,row,x,kind,runLength:n,...(kind==='rle'?{paletteIndex:(word>>>2)&255}:{}),encodedEndExclusive:cursor,rawWord:word});
   req(commands.length<=250000,'excessive command count');x+=n;
  }
 }
 const bytes=gra.subarray(start,cursor);
 return{indices,opacity,stream:{graOffset:start,width,height,graEndExclusive:cursor,encodedByteLength:cursor-start,
  encodedSHA256:await hash(bytes),indicesSHA256:await hash(indices),opacitySHA256:await hash(opacity),opaquePixels:opaque,commands}};
}
function maskPng(r:O197Layer){const rgba=new Uint8Array(r.opacity.length*4);for(let i=0;i<r.opacity.length;i++){
 const v=r.opacity[i]?255:0;rgba.set([v,v,v,255],i*4);}
 return encodeOriginalEffectRgbaPngO177(r.width,r.height,rgba);
}
function indicesPng(r:O197Layer){const rgba=new Uint8Array(r.opacity.length*4);for(let i=0;i<r.opacity.length;i++){
 const v=r.indices[i];rgba.set([v,v,v,r.opacity[i]?255:0],i*4);}
 return encodeOriginalEffectRgbaPngO177(r.width,r.height,rgba);
}
export function o197LayerPng(r:O197Layer,mode:'color'|'index'|'mask'='color'){
 return mode==='mask'?maskPng(r):mode==='index'?indicesPng(r):encodeOriginalEffectRgbaPngO177(r.width,r.height,r.rgba);
}
export async function runO197ForestLayers(source:DirectorySource):Promise<O197Report>{
 const o196=await runO196ForestFloor(source);
 const entries=(await source.listRecursive()).filter(f=>f.name.toUpperCase()==='FOREST.GRA');
 req(entries.length===1,'expected one canonical FOREST.GRA');
 const gra=await source.readSlice(entries[0].path,0,entries[0].size);
 req(gra.length===226788&&await hash(gra)===O196_FOREST_SHA,'Forest original SHA-256 mismatch');
 const palette=o196.palette.colors.map(c=>c.rgb8);
 const all:O197Layer[]=[];const cache=new Map<string,Decoded>();
 for(let si=0;si<o196.setups.length;si++){
  const setup:O196Setup=o196.setups[si];const {width,height}=setup;
  req(width*height<=250000,'setup canvas too large');
  const rgba=new Uint8Array(width*height*4),indices=new Uint8Array(width*height),opacity=new Uint8Array(width*height);
  const placements:O197Placement[]=[],streams:O197Stream[]=[];
  let overdraw=0,clipped=0;
  for(const p of setup.controls){
   req(p.paletteSlot===2&&p.resourceID===27,'non-Forest descriptor or unverified palette slot');
   const key=`${p.graOffset}/${p.width}/${p.height}`;
   let sprite=cache.get(key);
   if(!sprite){sprite=await decodeForestStream(gra,p.graOffset,p.width,p.height);cache.set(key,sprite);}
   if(!streams.some(x=>x.graOffset===sprite!.stream.graOffset&&x.width===sprite!.stream.width&&x.height===sprite!.stream.height))streams.push(sprite.stream);
   let pc=0,po=0,pp=0;
   for(let i=0;i<sprite.indices.length;i++){
    if(!sprite.opacity[i])continue;
    const x=p.sourceX+(i%p.width),y=p.sourceY+Math.floor(i/p.width);
    if(x<0||y<0||x>=width||y>=height){pc++;clipped++;continue;}
    const at=y*width+x,colorIndex=sprite.indices[i],rgb=palette[colorIndex-1];
    req(Boolean(rgb),'missing candidate RGB source for index');
    if(opacity[at]){po++;overdraw++;}
    indices[at]=colorIndex;opacity[at]=1;pp++;
    rgba.set([rgb[0],rgb[1],rgb[2],255],at*4);
   }
   placements.push({ordinal:p.ordinal,controlObject2:p.controlObject2,controlPhysical:OBJECT2_PHYSICAL+p.controlObject2,
    descriptorObject2:p.descriptorObject2,descriptorPhysical:OBJECT2_PHYSICAL+p.descriptorObject2,
    x:p.sourceX,y:p.sourceY,width:p.width,height:p.height,graOffset:p.graOffset,
    graEndExclusive:sprite.stream.graEndExclusive,paletteSlot:2,flags:p.flags,painted:pp,clipped:pc,overwritten:po});
  }
  all.push({variant:si+1,setupObject2Offset:setup.object2Offset,setupPhysical:setup.physical,width,height,
   placementCount:placements.length,rgba,indices,opacity,rgbaSHA256:await hash(rgba),indicesSHA256:await hash(indices),
   opacitySHA256:await hash(opacity),opaquePixels:opacity.reduce((s,v)=>s+v,0),clippedOpaquePixels:clipped,
   overdrawOpaquePixels:overdraw,placements,streams,
   qualification:'VERIFIED_INDEXED_SETUP_LOCAL_LAYER_CANDIDATE_PALETTE_NO_SCENE_PLACEMENT'});
 }
 req(all.length===5&&all.reduce((sum,layer)=>sum+layer.placementCount,0)===60,'five original Forest setups and 60 placement records');
 req(cache.size===43,'expected 43 unique source descriptor streams across five setups');
 return{format:'mkdos_o197_forest_setup_layers_v1',status:'source-verified-indexed-setup-layers-candidate-colors',timestamp:new Date().toISOString(),
  original:o196.original,palette:{sourcePhysical:o196.palette.sourcePhysical,recordSHA256:o196.palette.sourceRecordSHA256,runtimeSelectionVerified:false},
  sourceRenderer:{mode:'mk2_indexed_graphics_command_grammar',stageResource:'FOREST.GRA',stageResourceID:27,controlCount:60,setupCount:5,
   originalGRAFloorStart:FOREST_FLOOR_START,sourcePaletteSlot:2,perLayerPlacementIsSetupLocal:true},layers:all,
  limitations:['All 60 original Forest control placements decode as source-authenticated indexed streams into five setup-local canvases; canvas placement uses only original setup-local coordinates.',
   'The source-linked EXE palette is a candidate for displayed colors. Actual runtime palette bank/handle/DAC changes have not been observed.',
   'The five variants are independent canvases. No relative positions, parallax, final draw order, camera or activation sequence are established.',
   'Opaque color index 0 is disallowed for these original indexed streams; transparent skips are represented by an independent mask.',
   'Clipped sprite pixels are counted and never silently represented as visible content; zero RGBA alpha denotes skipped/unpainted areas.',
   'The original DOS files are read-only and never altered. PNGs show reconstructed source layers, not screenshots of gameplay.']};
}
const json=(v:unknown)=>utf8.encode(JSON.stringify(v,null,2));
export function buildO197ForestForensicZip(r:O197Report){
 const files:{name:string;bytes:Uint8Array}[]=[];
 const summary=`# O197 — MK2 Forest original setup-local indexed layers\n\n`+
  `Decoded ${r.layers.reduce((n,v)=>n+v.placementCount,0)} original placement records into ${r.layers.length} independent source-local layers.\n\n`+
  `All original GRA/EXE identities are guarded. Candidate RGB colors are sourced from the original Forest setup-linked 80-word palette, **not yet runtime verified**.\n`+
  `Layer order, shared origin, camera offsets, parallax and final scene assembly are unknown. Reproducing each original local canvas is not equivalent to restoring a complete scene.\n\n`+
  r.layers.map(v=>`- Variant ${v.variant}: canvas ${v.width}×${v.height}, ${v.placementCount} original placements, ${v.streams.length} unique encoded streams, ${v.opaquePixels} opaque output pixels, ${v.clippedOpaquePixels} clipped opaque writes, ${v.overdrawOpaquePixels} overlapping opaque writes.`).join('\n')+
  `\n\n## Research limits\n`+r.limitations.map(v=>'- '+v).join('\n')+'\n';
 files.push({name:'SUMMARY.md',bytes:utf8.encode(summary)});
 files.push({name:'MANIFEST.json',bytes:json({format:r.format,status:r.status,timestamp:r.timestamp,sourceGameFilesBundled:false,
  derivedOriginalPixelsIncluded:true,original:r.original,palette:r.palette,sourceRenderer:r.sourceRenderer,
  layerSummary:r.layers.map(({rgba,indices,opacity,placements,streams,...meta})=>({...meta,streamCount:streams.length,placementRecords:placements.length}))})});
 files.push({name:'evidence/limitations.json',bytes:json(r.limitations)});
 files.push({name:'reproduce/parameters.json',bytes:json({original:r.original,stageResource:'FOREST.GRA',stageID:27,
  setupObject2Offsets:r.layers.map(v=>v.setupObject2Offset),sourcePalettePhysical:r.palette.sourcePhysical,
  sourceFloorStart:FOREST_FLOOR_START,readOnly:true,sceneAssemblyVerified:false})});
 files.push({name:'reproduce/README.md',bytes:utf8.encode('Run O197 using original MK2.EXE and FOREST.GRA (SHA-256 in MANIFEST.json), or run python scripts/verify-o197-export.py <original MK2 game folder> <this ZIP>. Parse all five setup records via O196 verified Object-2 pointer chains. For every descriptor, decode each original GRA row with 32-bit LE command grammar: bit0 skip length=word>>1; otherwise bit1 RLE length=word>>10, palette-index=(word>>2)&255; otherwise literal length=word>>2 (maximum 64) followed by padded-to-dword raw indices. Treat skipped pixels as transparent. Paste each decoded sprite at the control record signed x/y onto its own setup-local canvas in original control order, clipping to canvas and counting out-of-bounds opaque writes. Color with original Forest EXE-linked 80-word candidate palette, mark the colors unverified. Do not combine independent setup variants into a final scene or infer camera placement. Export has each variant\'s original index plane, mask and candidate-color PNG, descriptor offsets and every graphics-command source byte offset.')});
 for(const layer of r.layers){
  const base=`variants/${layer.variant}_${layer.width}x${layer.height}`;
  files.push({name:`${base}/source_indices.bin`,bytes:layer.indices});
  files.push({name:`${base}/opacity_mask.bin`,bytes:layer.opacity});
  files.push({name:`${base}/candidate_color.png`,bytes:o197LayerPng(layer,'color')});
  files.push({name:`${base}/source_indices_preview.png`,bytes:o197LayerPng(layer,'index')});
  files.push({name:`${base}/opacity_mask_preview.png`,bytes:o197LayerPng(layer,'mask')});
  files.push({name:`${base}/descriptor_placements.json`,bytes:json(layer.placements)});
  files.push({name:`${base}/indexed_stream_command_trace.json`,bytes:json(layer.streams)});
 }
 return buildStoredZip(files);
}
export function exportO197ForestForensicZip(r:O197Report){download(buildO197ForestForensicZip(r),'MKDOS_O197_Forest_Five_Original_Layers_Forensic.zip','application/zip');}
