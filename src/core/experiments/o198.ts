/** O198 — MK2 Forest: original mode-conditional stage-root to setup graph.
 * Source-verified structural references, not live stage activation or layer stacking.
 */
import type {DirectorySource,SourceFileEntry} from '../filesystem/DirectorySource';
import {hash,utf8} from '../assets/model';
import {buildStoredZip} from '../research/researchArtifactDownloads';
import {download} from '../assets/export';
import {readMK2ConditionalStageRootTablesO125} from '../../games/mk2/research/stageConfigDispatchO125';
import {runO197ForestLayers,o197LayerPng,type O197Report,type O197Layer} from './o197';
import {captureO195StreamTokens} from './o195';

const BASE=0xa0c54;
const ROOTS=[
 {mode:'mode_equals_2',root:0x16b56,end:0x16bda,staticAt:[0x28,0x30,0x3c,0x44,0x4c],dynamicAt:[0x58,0x60,0x68,0x70,0x78],separatorAt:0x54,terminatorAt:0x80,selected:[1,2,3,4,5]},
 {mode:'mode_equals_1',root:0x16bda,end:0x16c46,staticAt:[0x28,0x30,0x44],dynamicAt:[0x50,0x58,0x60],separatorAt:0x4c,terminatorAt:0x68,selected:[1,2,5]},
 {mode:'mode_other',root:0x16c46,end:0x16cb2,staticAt:[0x28,0x30,0x44],dynamicAt:[0x50,0x58,0x60],separatorAt:0x4c,terminatorAt:0x68,selected:[1,2,5]}
] as const;
const SETUPS=[0x16f8c,0x16f9e,0x16fb0,0x16fc2,0x16fd4] as const;
const FIXED=[0x40000,0x20000,0x300000,0x360000,0x480000] as const;
const ACC=[0x84324,0x84320,0x84318,0x84314,0x84310] as const;
function need(c:unknown,m:string):asserts c{if(!c)throw new Error('O198 Forest root provenance: '+m);}
function u32(d:DataView,o:number){need(BASE+o+4<=d.byteLength&&o>=0,'source DWORD bounds');return d.getUint32(BASE+o,true);}
function s32(d:DataView,o:number){need(BASE+o+4<=d.byteLength&&o>=0,'signed source DWORD bounds');return d.getInt32(BASE+o,true);}
export type O198Pair={setupVariant:number;setupObject2:number;setupPhysical:number;fieldObject2:number;fieldPhysical:number;
 operandFieldObject2:number;operandFieldPhysical:number;operand:number;operandRole:'raw-fixed-operand'|'accumulator-address';
 motionChannelIndex?:number;originalChannelInputRaw?:number;originalChannelInput16_16?:number;positiveStreamHighWordReferences?:number[];};
export type O198Mode={mode:'mode_equals_2'|'mode_equals_1'|'mode_other';rootObject2:number;rootPhysical:number;rootEndExclusive:number;
 rootByteSHA256:string;rootTableEntryObject2:number;rootTableEntryPhysical:number;sharedPointers:{inputObject2:number;streamObject2:number;stateObject2:number};
 staticPairs:O198Pair[];accumulatorPairs:O198Pair[];selectedVariants:number[];separatorObject2:number;terminatorObject2:number;
 runtimeSelected:false;};
export type O198Report={format:'mkdos_o198_forest_conditional_setup_graph_v1';status:'verified-static-mode-root-graph-not-runtime-composition';
 timestamp:string;original:O197Report['original'];paletteSourcePhysical:number;paletteRuntimeVerified:false;sourceReferences:{stageIndex:4;
 rootTableObject2:[number,number,number];rootLoaderPhysical:0x81eb2;modeGlobalObject2:0x3014c;motionWordsObject2:number;
 originalMotionWords:number[];motionUnit:'signed_16_16_source_inputs_not_verified_parallax';
 originalPositiveStreamChannelIndices:number[];rendererHighWordConsumerPhysical:0x9358c;runtimeModeObserved:false;};
 modes:O198Mode[];layers:O197Layer[];limitations:string[];};
export async function runO198ForestConditionalRoots(source:DirectorySource):Promise<O198Report>{
 const r=await runO197ForestLayers(source);
 const files=await source.listRecursive();const es=files.filter((f:SourceFileEntry)=>f.name.toUpperCase()==='MK2.EXE');need(es.length===1,'unique original executable');
 const exe=await source.readSlice(es[0].path,0,es[0].size);
 need(exe.length===861133&&await hash(exe)===r.original.exeSHA256,'EXE fingerprint disagreement');
 const d=new DataView(exe.buffer,exe.byteOffset,exe.byteLength),routing=await readMK2ConditionalStageRootTablesO125(exe);
 const modes:O198Mode[]=[];const tables=[0x15bec,0x15c68,0x15ce4] as const;
 const originalWords=Array.from({length:9},(_,i)=>s32(d,0x16cb2+i*4));
 const streamTokens=captureO195StreamTokens(exe,0x16cd8);
 const originalHighWords=streamTokens.filter(t=>t.kind==='positive-pair').map(t=>t.extraDwords[0]);
 need(originalHighWords.length===9,'original Forest positive control count');
 const streamChannels=originalHighWords.map(ptr=>{need(ptr>=0x84312&&ptr<=0x84332&&(ptr-0x84312)%4===0,'positive command high-word source range');return(ptr-0x84312)/4;});
 need(JSON.stringify(streamChannels)==='[0,1,2,3,4,5,7,7,7]','original Forest stage stream channel mapping');
 need(Array.from(exe.subarray(0x9358c,0x935a8),b=>b.toString(16).padStart(2,'0')).join('')==='8b3183c104668b36668935685a0700890d985a07008be8e8e8fdffff','O133 high-word consumer code changed');
 for(let mi=0;mi<ROOTS.length;mi++){
  const spec=ROOTS[mi],root=spec.root;
  need(routing.tables[spec.mode][4]===root&&u32(d,tables[mi]+4*4)===root,'stage-index 4 mode-root table mismatch');
  need(spec.end-root===spec.terminatorAt+4,'root bounded by next stage region');
  need(u32(d,root+0x14)===0x16cb2&&u32(d,root+0x18)===0x16cd8&&u32(d,root+0x1c)===0x77453,'shared source header pointers');
  need(s32(d,root+spec.separatorAt)===-2&&u32(d,root+spec.terminatorAt)===0,'separator/terminator signature');
  need(spec.staticAt.length===spec.dynamicAt.length&&spec.staticAt.length===spec.selected.length,'pair array sizing');
  function pairs(group:'static'|'accumulator'):O198Pair[]{
   return spec.selected.map((variant,i)=>{
    const at=root+(group==='static'?spec.staticAt[i]:spec.dynamicAt[i]);
    const setupObject2=u32(d,at),operand=u32(d,at+4),expected=group==='static'?FIXED[variant-1]:ACC[variant-1];
    need(setupObject2===SETUPS[variant-1]&&operand===expected,`${spec.mode} ${group} layer ${variant} linked operand`);
    need(r.layers[variant-1].setupObject2Offset===setupObject2,'O197 layer identity mismatch');
    const channel=group==='accumulator'?(operand-0x84310)/4:-1;
    if(group==='accumulator')need(Number.isInteger(channel)&&channel>=0&&channel<9&&originalHighWords.includes(operand+2),'source setup channel has no original positive-stream consumer');
    return{setupVariant:variant,setupObject2,setupPhysical:BASE+setupObject2,fieldObject2:at,fieldPhysical:BASE+at,
      operandFieldObject2:at+4,operandFieldPhysical:BASE+at+4,operand,
      operandRole:group==='static'?'raw-fixed-operand':'accumulator-address',
      ...(channel>=0?{motionChannelIndex:channel,originalChannelInputRaw:originalWords[channel],
       originalChannelInput16_16:originalWords[channel]/65536,positiveStreamHighWordReferences:streamTokens.filter(t=>t.kind==='positive-pair'&&t.extraDwords[0]===operand+2).map(t=>t.object2Offset)}:{})};
   });
  }
  modes.push({mode:spec.mode,rootObject2:root,rootPhysical:BASE+root,rootEndExclusive:BASE+spec.end,
   rootByteSHA256:await hash(exe.slice(BASE+root,BASE+spec.end)),rootTableEntryObject2:tables[mi]+16,
   rootTableEntryPhysical:BASE+tables[mi]+16,
   sharedPointers:{inputObject2:0x16cb2,streamObject2:0x16cd8,stateObject2:0x77453},
   staticPairs:pairs('static'),accumulatorPairs:pairs('accumulator'),selectedVariants:[...spec.selected],
   separatorObject2:root+spec.separatorAt,terminatorObject2:root+spec.terminatorAt,runtimeSelected:false});
 }
 need(JSON.stringify(modes.map(m=>m.selectedVariants))==='[[1,2,3,4,5],[1,2,5],[1,2,5]]','conditional layer census');
 need(modes[1].accumulatorPairs.every((p,i)=>p.operand===modes[2].accumulatorPairs[i].operand),'mode 1/fallback pointer mismatch');
 need(modes[1].rootByteSHA256===modes[2].rootByteSHA256,'mode 1 and fallback payloads differ');
 const words=originalWords;
 need(JSON.stringify(words)==='[0,49152,61440,73728,73728,98304,98304,98304,0]','nine Forest motion inputs source mismatch');
 return{format:'mkdos_o198_forest_conditional_setup_graph_v1',status:'verified-static-mode-root-graph-not-runtime-composition',
  timestamp:new Date().toISOString(),original:r.original,paletteSourcePhysical:r.palette.sourcePhysical,paletteRuntimeVerified:false,
  sourceReferences:{stageIndex:4,rootTableObject2:[...tables],rootLoaderPhysical:0x81eb2,modeGlobalObject2:0x3014c,
   motionWordsObject2:0x16cb2,originalMotionWords:words,motionUnit:'signed_16_16_source_inputs_not_verified_parallax',
   originalPositiveStreamChannelIndices:streamChannels,rendererHighWordConsumerPhysical:0x9358c,runtimeModeObserved:false},
  modes,layers:r.layers,limitations:[
   'The original conditional stage table entry at index 4 binds three distinct Forest root addresses; these source pointers are not live observed state.',
   'Mode 2 has two co-located pointer-pair groups containing all five Forest setups. Mode 1 and fallback retain only setups 1, 2 and 5 in each group, and their 108-byte root payloads are byte-identical despite distinct source addresses.',
   'Each pair is a typed relocation candidate validated independently against original EXE LE fixups; numeric source operands are reported exactly. Their scene-translation and activation semantics are not proven.',
   'The nine original 16.16 stage input words and paired accumulator-address operands are source-backed. All five setup-linked accumulator fields have high-word references in the original Forest stage-control stream. Active transformation, parallax ratios, screen position and draw order are not known.',
   'All PNGs preserve exact O197 setup-local canvas coordinates, not a stacked or finished stage. The O196 EXE-linked Forest color record remains candidate coloring.',
   'No original game files are changed. An experiment package includes derived original pixels but excludes complete commercial game files.'
  ]};
}
const j=(x:unknown)=>utf8.encode(JSON.stringify(x,null,2));
export function o198ModeSchematicSvg(r:O198Report):Uint8Array{
 const w=970,h=400;
 const y=(m:number,v:number)=>62+m*107+v*15;
 let parts=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#111825"/><text x="20" y="30" fill="#ffffff" font-family="monospace" font-size="21">MK2 Forest — verified source references by conditional mode</text>`;
 for(let i=0;i<r.modes.length;i++){
  const m=r.modes[i];parts+=`<text x="22" y="${62+i*107}" fill="#e4e7eb" font-size="17" font-family="monospace">${m.mode.replaceAll('_',' ')}</text>`;
  for(let k=0;k<5;k++){
   const present=m.selectedVariants.includes(k+1),x=22+k*186,yy=74+i*107;
   parts+=`<rect x="${x}" y="${yy}" width="172" height="38" rx="6" fill="${present?'#194938':'#292b32'}" stroke="${present?'#61c99e':'#616775'}"/><text x="${x+12}" y="${yy+24}" font-family="monospace" fill="${present?'#ccf4e3':'#abb0ba'}" font-size="13">Setup ${k+1}: ${present?'linked':'absent'}</text>`;
  }
 }
 parts+=`<text x="20" y="382" font-family="monospace" fill="#e4b984" font-size="12">Original pointers only. No runtime mode witness, stacking, parallax, palette bank or camera.</text></svg>`;
 return utf8.encode(parts);
}
export function buildO198ForestForensicZip(r:O198Report):Uint8Array{
 const output=[
  {name:'SUMMARY.md',bytes:utf8.encode(`# O198 — Forest conditional source-root graph\n\nOriginal MK2.EXE stage table index 4 references distinct configuration roots depending on mode. The mode-2 root references all five original Forest layer setups; mode 1 and fallback reference setups 1, 2, 5. Each setup appears twice inside its respective root, paired once with an original numeric operand and once with an original accumulator address. All pointers are statically grounded. **No live mode selection, layer composition, palette activation or camera transform is claimed.**\n\n${r.limitations.map(x=>'- '+x).join('\n')}\n`)},
  {name:'MANIFEST.json',bytes:j({format:r.format,status:r.status,original:r.original,sourceGameFilesBundled:false,derivedOriginalPixelsIncluded:true,layerCount:5,modeCount:3,exportReconstructionNotGameplay:true})},
  {name:'evidence/conditional_root_ownership.json',bytes:j({sourceReferences:r.sourceReferences,modes:r.modes})},
  {name:'evidence/original_motion_inputs_16_16.json',bytes:j({object2:r.sourceReferences.motionWordsObject2,raw:r.sourceReferences.originalMotionWords,
    values:r.sourceReferences.originalMotionWords.map(x=>x/65536),runtimeTransformVerified:false})},
  {name:'evidence/forest_source_layer_hashes.json',bytes:j(r.layers.map(({rgba,indices,opacity,streams,placements,...meta})=>({...meta,
    streams:streams.map(({commands,...s})=>({...s,commandCount:commands.length})),placements})))},
  {name:'results/conditional_mode_graph.svg',bytes:o198ModeSchematicSvg(r)},
  {name:'diagnostics/limitations.json',bytes:j(r.limitations)},
  {name:'reproduce/parameters.json',bytes:j({exeSHA256:r.original.exeSHA256,forestSHA256:r.original.forestSHA256,object2FileBase:BASE,stageIndex:4,
    rootTables:r.sourceReferences.rootTableObject2,modeRoots:r.modes.map(m=>m.rootObject2),setupOffsets:[...SETUPS],paletteCandidatePhysical:r.paletteSourcePhysical,liveMode:null})},
  {name:'reproduce/README.md',bytes:utf8.encode('Use the original MK2.EXE and FOREST.GRA with the hashes in MANIFEST.json, and run python scripts/verify-o198-export.py <MK2-folder> <forensic-zip> from O198 project source. The script reparses original LE typed relocations. O198 source files can be inspected at src/core/experiments/o198.ts. Compare O197 O196 for indexed decoding and source-linked candidate palette. The schematic is a conditional pointer graph, not a composited screen.')}];
 for(const l of r.layers){const folder=`results/forest_source_layers/variant_${l.variant}_${l.width}x${l.height}`;
  output.push({name:folder+'/indices.bin',bytes:l.indices},{name:folder+'/opacity_mask.bin',bytes:l.opacity},
   {name:folder+'/candidate_color.png',bytes:o197LayerPng(l,'color')});}
 return buildStoredZip(output);
}
export function exportO198ForestForensicZip(r:O198Report){download(buildO198ForestForensicZip(r),'MKDOS_O198_Forest_Conditional_Root_Graph_Forensic.zip','application/zip');}
