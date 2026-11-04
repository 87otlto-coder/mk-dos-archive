/**
 * MK1 stage/background resource graph census — Pass 1E.3O.27.
 *
 * Read-only export-first pass. It reconstructs the canonical BGND.ASM module
 * records consumed by INIT_BAKMODS, binds their packed GRA roots through the
 * verified handle table, resolves scene-list BMOD references into BGNDTBL.ASM,
 * binds each referenced BMOD to an exact BGNDPAL.ASM palette table, and proves
 * that the shared NO_XY descriptor prefixes decode against the authentic GRA
 * resources. It intentionally does not assign arcade stage names or infer the
 * semantics of unknown header/layout words.
 */
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { sha256Bytes } from './paletteRoundTripCodec';
import { enumerateMK1WatcomPermanentClasses } from './watcomPermanentClassInventory';
import { reconstructMK1HandleTable } from './handleTableProbe';
import { decodeUgraSprite } from '../graphics/ugraDecoder';

const CANONICAL_SHA='750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const STATIC_DATA_BASE=0x0008ca54;
function hx(v:number){return `0x${(v>>>0).toString(16).padStart(8,'0').toUpperCase()}`;}
function u16(b:Uint8Array,o:number){return (b[o]|(b[o+1]<<8))>>>0;}
function i16(b:Uint8Array,o:number){const v=u16(b,o);return v&0x8000?v-0x10000:v;}
function u32(b:Uint8Array,o:number){return ((b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0);}
function norm(p:string){return p.replace(/\\/g,'/').toUpperCase();}

type WSymbol=Awaited<ReturnType<typeof enumerateMK1WatcomPermanentClasses>>['result']['globalSymbols']['symbols'][number];

export interface MK1StageBackgroundResourceGraphCensusReport {
 format:'mk1_stage_background_resource_graph_census_v1';timestamp:string;operationId:string;
 provenance:{sourceKind:'user-loaded-directory';fileName:string;byteLength:number;sha256:string;synthetic:false;artifactGeneratedByTest:false;timestamp:string;operationId:string};
 coordinateModel:{watcomStaticDataPhysicalBase:number;watcomStaticDataPhysicalBaseHex:string};
 moduleGrammar:{
  initBakmodsSymbol:'INIT_BAKMODS';headerByteLength:28;sceneEntryKinds:['BMOD_WITH_PACKED_I16_PAIR','LITERAL_ONE'];sentinel:'0xFFFFFFFF';
  fields:Array<{offsetHex:string;classification:string;status:'STATICALLY_VERIFIED'|'RAW_PRESERVED'}>;
 };
 topLevelModules:Array<{
  symbol:string;watcomOffset:number;watcomOffsetHex:string;physicalStart:number;physicalStartHex:string;symbolSpan:number;
  packedResourceRoot:number;packedResourceRootHex:string;fileId:number;graOffset:number;resourcePath:string;resourceSize:number;
  headerWords:number[];initCallbackWatcomOffset:number;initCallbackWatcomOffsetHex:string;auxDataWatcomOffset:number;auxDataWatcomOffsetHex:string;
  destinationListWatcomOffset:number;destinationListWatcomOffsetHex:string;destinationListSymbol:string|null;
  sceneEntries:Array<{kind:'BMOD_WITH_PACKED_I16_PAIR';bmodWatcomOffset:number;bmodWatcomOffsetHex:string;bmodSymbol:string;packedArgument:number;packedArgumentHex:string;lowI16:number;highI16:number}|{kind:'LITERAL_ONE'}>;
  sentinelFound:true;trailingBytesAfterSentinel:number;
 }>;
 bmods:Array<{
  symbol:string;watcomOffset:number;watcomOffsetHex:string;physicalStart:number;physicalStartHex:string;
  rawHeaderWords:[number,number,number];placementRecordCount:number;placementTableWatcomOffset:number;placementTableWatcomOffsetHex:string;
  descriptorTableWatcomOffset:number;descriptorTableWatcomOffsetHex:string;paletteTableWatcomOffset:number;paletteTableWatcomOffsetHex:string;paletteTableSymbol:string;
  placementTerminatorVerified:boolean;resourceFileIds:number[];usedByTopLevelModules:string[];
 }>;
 resourceContexts:Array<{
  fileId:number;resourcePath:string;resourceSize:number;descriptorTableWatcomOffset:number;descriptorTableWatcomOffsetHex:string;
  paletteTableWatcomOffset:number;paletteTableWatcomOffsetHex:string;paletteTableSymbol:string;palettePointerCount:number;paletteRecordRefs:number[];paletteRecordRefsHex:string[];
  bmodSymbols:string[];topLevelModuleSymbols:string[];descriptorPrefixCount:number;descriptorDecodeSuccessCount:number;descriptorDecodeFailureCount:number;
  maxOpaquePaletteIndex:number;descriptorPrefixStopReason:string;
 }>;
 summary:{topLevelModuleCount:number;uniqueResourceContextCount:number;uniqueResourceFileCount:number;uniqueBmodCount:number;literalOneSceneEntryCount:number;sceneBmodEntryCount:number;descriptorPrefixCount:number;descriptorDecodeSuccessCount:number;descriptorDecodeFailureCount:number;paletteTableCount:number};
 decision:{backgroundModuleGrammarBounded:true;packedRootResourcesResolved:true;sceneBmodReferenceSurfaceEstablished:true;bmodPaletteTableBindingEstablished:true;stageDescriptorDecodeSurfaceEstablished:true;layoutRecordFieldSemanticsEstablished:false;arcadeStageNameMappingEstablished:false;fullScenePixelCompositionEstablished:false;verdict:'MK1_BACKGROUND_MODULE_RESOURCE_GRAPH_ESTABLISHED';narrative:string};
 status:'SUCCESS';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean;detail?:string}>};
}

export async function executeStageBackgroundResourceGraphCensus(source:DirectorySource):Promise<MK1StageBackgroundResourceGraphCensusReport>{
 if(source.isSynthetic!==false)throw new Error('O27 requires authentic MK1 installation');
 const files=await source.listRecursive();const exeEntry=files.find(f=>f.name.toUpperCase()==='MK1.EXE');if(!exeEntry)throw new Error('O27 requires MK1.EXE');
 const exe=await source.readSlice(exeEntry.path,0,exeEntry.size);const sha=await sha256Bytes(exe);if(sha!==CANONICAL_SHA)throw new Error('O27 MK1.EXE is not canonical');
 const wat=await enumerateMK1WatcomPermanentClasses(source);if(wat.status!=='SUCCESS'||!wat.result.overallValid)throw new Error('O27 Watcom inventory failed');
 const handles=await reconstructMK1HandleTable(source);if(handles.summary.reconstructionStatus!=='VERIFIED_FIXTURE'||!handles.summary.knownAnchorsValidated)throw new Error('O27 handle table prerequisite failed');
 const symbols=wat.result.globalSymbols.symbols.filter(s=>s.valid);const data2=symbols.filter(s=>s.segment===2&&s.kindBits.isData).sort((a,b)=>a.addressOffset-b.addressOffset);
 const byOffset=new Map<number,WSymbol[]>();for(const s of data2){const a=byOffset.get(s.addressOffset)??[];a.push(s);byOffset.set(s.addressOffset,a);}
 const bgnd=data2.filter(s=>s.resolvedModuleName==='BGND.ASM');const bgndTbl=data2.filter(s=>s.resolvedModuleName==='BGNDTBL.ASM');const bgndTblOffsets=new Set(bgndTbl.map(s=>s.addressOffset));
 const bgndPal=data2.filter(s=>s.resolvedModuleName==='BGNDPAL.ASM').sort((a,b)=>a.addressOffset-b.addressOffset);const bgndPalMap=new Map(bgndPal.map(s=>[s.addressOffset,s] as const));
 const handleById=new Map(handles.entries.map(e=>[e.fileId,e] as const));
 const moduleRanges=new Map<string,{start:number;end:number}>();for(const rec of wat.result.addressInfo.segmentRecords.filter(r=>r.segment===2)){let cur=rec.startAddressOffset;for(const e of rec.entries){moduleRanges.set(`${e.moduleIndex}:${e.resolvedModuleName}`,{start:cur,end:cur+e.size});cur+=e.size;}}
 const bgndRange=[...moduleRanges.entries()].find(([k])=>k.endsWith(':BGND.ASM'))?.[1];if(!bgndRange)throw new Error('O27 BGND.ASM address range missing');
 const candidates=bgnd.filter(s=>s.addressOffset+28<=bgndRange.end).sort((a,b)=>a.addressOffset-b.addressOffset);
 const top:MK1StageBackgroundResourceGraphCensusReport['topLevelModules']=[];const bmodUse=new Map<number,{modules:Set<string>;fileIds:Set<number>}>();let literalOne=0,sceneBmodEntries=0;
 for(let si=0;si<candidates.length;si++){
  const s=candidates[si];const next=candidates[si+1]?.addressOffset??bgndRange.end;const p=STATIC_DATA_BASE+s.addressOffset;if(p<0||p+28>exe.length)continue;
  const packed=u32(exe,p),fileId=packed>>>24,graOffset=packed&0xffffff,handle=handleById.get(fileId);if(!handle?.resolvedPath||graOffset!==0||!handle.resolvedPath.toUpperCase().includes('HDRS.GRA'))continue;
  let q=s.addressOffset+28;const entries:MK1StageBackgroundResourceGraphCensusReport['topLevelModules'][number]['sceneEntries']=[];let sentinel=false;
  while(q+4<=next){const v=u32(exe,STATIC_DATA_BASE+q);if(v===0xffffffff){q+=4;sentinel=true;break;}if(v===1){entries.push({kind:'LITERAL_ONE'});literalOne++;q+=4;continue;}if(q+8>next)break;const arg=u32(exe,STATIC_DATA_BASE+q+4),ss=byOffset.get(v)?.filter(x=>x.resolvedModuleName==='BGNDTBL.ASM')??[];if(ss.length!==1)break;entries.push({kind:'BMOD_WITH_PACKED_I16_PAIR',bmodWatcomOffset:v,bmodWatcomOffsetHex:hx(v),bmodSymbol:ss[0].name,packedArgument:arg,packedArgumentHex:hx(arg),lowI16:i16(exe,STATIC_DATA_BASE+q+4),highI16:i16(exe,STATIC_DATA_BASE+q+6)});sceneBmodEntries++;const bu=bmodUse.get(v)??{modules:new Set<string>(),fileIds:new Set<number>()};bu.modules.add(s.name);bu.fileIds.add(fileId);bmodUse.set(v,bu);q+=8;}
  if(!sentinel)continue;const dest=u32(exe,p+24),destSyms=byOffset.get(dest)??[];top.push({symbol:s.name,watcomOffset:s.addressOffset,watcomOffsetHex:hx(s.addressOffset),physicalStart:p,physicalStartHex:hx(p),symbolSpan:next-s.addressOffset,packedResourceRoot:packed,packedResourceRootHex:hx(packed),fileId,graOffset,resourcePath:norm(handle.resolvedPath),resourceSize:handle.fileSize,headerWords:[u16(exe,p+4),u16(exe,p+6),u16(exe,p+8),u16(exe,p+10),u16(exe,p+12),u16(exe,p+14)],initCallbackWatcomOffset:u32(exe,p+16),initCallbackWatcomOffsetHex:hx(u32(exe,p+16)),auxDataWatcomOffset:u32(exe,p+20),auxDataWatcomOffsetHex:hx(u32(exe,p+20)),destinationListWatcomOffset:dest,destinationListWatcomOffsetHex:hx(dest),destinationListSymbol:destSyms.length===1?destSyms[0].name:null,sceneEntries:entries,sentinelFound:true,trailingBytesAfterSentinel:next-q});
 }
 const bmods:MK1StageBackgroundResourceGraphCensusReport['bmods']=[];for(const [off,use] of [...bmodUse].sort((a,b)=>a[0]-b[0])){const s=(byOffset.get(off)??[]).find(x=>x.resolvedModuleName==='BGNDTBL.ASM');if(!s)throw new Error(`O27 missing BMOD symbol ${hx(off)}`);const p=STATIC_DATA_BASE+off;const count=u16(exe,p+4),layout=u32(exe,p+6),desc=u32(exe,p+10),pal=u32(exe,p+14),ps=bgndPalMap.get(pal);if(!ps)throw new Error(`O27 BMOD ${s.name} palette table not exact BGNDPAL symbol`);const term=STATIC_DATA_BASE+layout+count*8;bmods.push({symbol:s.name,watcomOffset:off,watcomOffsetHex:hx(off),physicalStart:p,physicalStartHex:hx(p),rawHeaderWords:[u16(exe,p),u16(exe,p+2),count],placementRecordCount:count,placementTableWatcomOffset:layout,placementTableWatcomOffsetHex:hx(layout),descriptorTableWatcomOffset:desc,descriptorTableWatcomOffsetHex:hx(desc),paletteTableWatcomOffset:pal,paletteTableWatcomOffsetHex:hx(pal),paletteTableSymbol:ps.name,placementTerminatorVerified:term+2<=exe.length&&u16(exe,term)===0xffff,resourceFileIds:[...use.fileIds].sort((a,b)=>a-b),usedByTopLevelModules:[...use.modules].sort()});}
 const graCache=new Map<string,Uint8Array>();async function gra(path:string){const key=norm(path);if(graCache.has(key))return graCache.get(key)!;const f=files.find(x=>norm(x.path)===key);if(!f)throw new Error(`O27 resource missing ${path}`);const d=await source.readSlice(f.path,0,f.size);graCache.set(key,d);return d;}
 const contextKeys=new Map<string,{fileId:number;resourcePath:string;resourceSize:number;desc:number;pal:number;bmods:Set<string>;modules:Set<string>}>();for(const bm of bmods){for(const fid of bm.resourceFileIds){const h=handleById.get(fid);if(!h?.resolvedPath)throw new Error(`O27 unresolved fileId ${fid}`);const key=`${fid}:${bm.descriptorTableWatcomOffset}:${bm.paletteTableWatcomOffset}`;const c=contextKeys.get(key)??{fileId:fid,resourcePath:norm(h.resolvedPath),resourceSize:h.fileSize,desc:bm.descriptorTableWatcomOffset,pal:bm.paletteTableWatcomOffset,bmods:new Set<string>(),modules:new Set<string>()};c.bmods.add(bm.symbol);for(const m of bm.usedByTopLevelModules)c.modules.add(m);contextKeys.set(key,c);}}
 const contexts:MK1StageBackgroundResourceGraphCensusReport['resourceContexts']=[];let totalDesc=0,totalOk=0,totalFail=0;
 for(const c of [...contextKeys.values()].sort((a,b)=>a.fileId-b.fileId||a.desc-b.desc)){const palSym=bgndPalMap.get(c.pal);if(!palSym)throw new Error('O27 palette table symbol missing');const pi=bgndPal.findIndex(x=>x.addressOffset===c.pal);const palEnd=bgndPal[pi+1]?.addressOffset??([...moduleRanges.entries()].find(([k])=>k.endsWith(':BGNDPAL.ASM'))?.[1].end??c.pal);const palBytes=palEnd-c.pal;if(palBytes<=0||palBytes%4!==0)throw new Error(`O27 invalid palette table span ${palSym.name}`);const paletteRefs:number[]=[];for(let z=0;z<palBytes;z+=4)paletteRefs.push(u32(exe,STATIC_DATA_BASE+c.pal+z));
  const g=await gra(c.resourcePath);let n=0,ok=0,fail=0,maxIdx=0,reason='FIRST_NON_MATCHING_DESCRIPTOR';while(true){const p=STATIC_DATA_BASE+c.desc+n*8;if(p+8>exe.length){reason='EXE_END';break;}const w=u16(exe,p),h=u16(exe,p+2),packed=u32(exe,p+4),fid=packed>>>24,go=packed&0xffffff;if(w===0||h===0||w>4096||h>4096||fid!==c.fileId||go>=c.resourceSize)break;const d=decodeUgraSprite(g,go,w,h);if(d.success){ok++;for(let k=0;k<d.indices.length;k++)if(d.opaqueMask[k]&&d.indices[k]>maxIdx)maxIdx=d.indices[k];}else fail++;n++;if(n>4096){reason='SAFETY_LIMIT';break;}}
  totalDesc+=n;totalOk+=ok;totalFail+=fail;contexts.push({fileId:c.fileId,resourcePath:c.resourcePath,resourceSize:c.resourceSize,descriptorTableWatcomOffset:c.desc,descriptorTableWatcomOffsetHex:hx(c.desc),paletteTableWatcomOffset:c.pal,paletteTableWatcomOffsetHex:hx(c.pal),paletteTableSymbol:palSym.name,palettePointerCount:paletteRefs.length,paletteRecordRefs:paletteRefs,paletteRecordRefsHex:paletteRefs.map(hx),bmodSymbols:[...c.bmods].sort(),topLevelModuleSymbols:[...c.modules].sort(),descriptorPrefixCount:n,descriptorDecodeSuccessCount:ok,descriptorDecodeFailureCount:fail,maxOpaquePaletteIndex:maxIdx,descriptorPrefixStopReason:reason});}
 const summary={topLevelModuleCount:top.length,uniqueResourceContextCount:contexts.length,uniqueResourceFileCount:new Set(contexts.map(c=>c.fileId)).size,uniqueBmodCount:bmods.length,literalOneSceneEntryCount:literalOne,sceneBmodEntryCount:sceneBmodEntries,descriptorPrefixCount:totalDesc,descriptorDecodeSuccessCount:totalOk,descriptorDecodeFailureCount:totalFail,paletteTableCount:new Set(contexts.map(c=>c.paletteTableWatcomOffset)).size};
 const checks=[
  {checkId:'CANONICAL_AUTHENTIC_SOURCE',passed:true},{checkId:'HANDLE_TABLE_VERIFIED',passed:true},{checkId:'WATCOM_PERMANENT_CLASSES_VALID',passed:true},
  {checkId:'BGND_MODULE_RECORD_COUNT',passed:summary.topLevelModuleCount===24,detail:`records=${summary.topLevelModuleCount}`},
  {checkId:'STAGE_RESOURCE_CONTEXT_COUNT',passed:summary.uniqueResourceContextCount===15&&summary.uniqueResourceFileCount===15,detail:`contexts=${summary.uniqueResourceContextCount}`},
  {checkId:'SCENE_BMOD_REFERENCE_COUNT',passed:summary.uniqueBmodCount===41&&summary.sceneBmodEntryCount===68,detail:`uniqueBmods=${summary.uniqueBmodCount}, entries=${summary.sceneBmodEntryCount}`},
  {checkId:'LITERAL_ONE_CONTROL_MARKERS',passed:summary.literalOneSceneEntryCount===4,detail:`literalOne=${summary.literalOneSceneEntryCount}`},{checkId:'BMOD_LAYOUT_TERMINATORS',passed:bmods.every(x=>x.placementTerminatorVerified),detail:`verified=${bmods.filter(x=>x.placementTerminatorVerified).length}/${bmods.length}`},
  {checkId:'BMOD_PALETTE_TABLES_EXACT',passed:bmods.every(x=>!!x.paletteTableSymbol)},{checkId:'DESCRIPTOR_PREFIX_COUNT',passed:summary.descriptorPrefixCount===548,detail:`descriptors=${summary.descriptorPrefixCount}`},
  {checkId:'AUTHENTIC_STAGE_UGRA_DECODE',passed:summary.descriptorDecodeSuccessCount===548&&summary.descriptorDecodeFailureCount===0,detail:`success=${summary.descriptorDecodeSuccessCount}, failure=${summary.descriptorDecodeFailureCount}`},
  {checkId:'NO_LAYOUT_FIELD_SEMANTIC_OVERCLAIM',passed:true},{checkId:'NO_ARCADE_STAGE_NAME_OVERCLAIM',passed:true},{checkId:'NO_WRITE_PATH',passed:true},
 ];if(!checks.every(x=>x.passed))throw new Error(`O27 validation failed: ${checks.filter(x=>!x.passed).map(x=>x.checkId).join(', ')}`);
 const timestamp=new Date().toISOString(),operationId=createOperationId('stage_background_resource_graph_census');
 return{format:'mk1_stage_background_resource_graph_census_v1',timestamp,operationId,provenance:{sourceKind:'user-loaded-directory',fileName:exeEntry.name,byteLength:exeEntry.size,sha256:sha,synthetic:false,artifactGeneratedByTest:false,timestamp,operationId},coordinateModel:{watcomStaticDataPhysicalBase:STATIC_DATA_BASE,watcomStaticDataPhysicalBaseHex:hx(STATIC_DATA_BASE)},moduleGrammar:{initBakmodsSymbol:'INIT_BAKMODS',headerByteLength:28,sceneEntryKinds:['BMOD_WITH_PACKED_I16_PAIR','LITERAL_ONE'],sentinel:'0xFFFFFFFF',fields:[{offsetHex:'0x00',classification:'packed GRA root reference consumed before INIT_BAKMODS body',status:'STATICALLY_VERIFIED'},{offsetHex:'0x04..0x0F',classification:'six 16-bit header words; individual semantics not promoted',status:'RAW_PRESERVED'},{offsetHex:'0x10',classification:'indirect initialization callback invoked by INIT_BAKMODS',status:'STATICALLY_VERIFIED'},{offsetHex:'0x14',classification:'auxiliary data pointer copied by INIT_BAKMODS; semantics not promoted',status:'RAW_PRESERVED'},{offsetHex:'0x18',classification:'destination background-module list pointer used by INIT_BAKMODS',status:'STATICALLY_VERIFIED'},{offsetHex:'0x1C+',classification:'variable scene-entry list: literal 1 or 8-byte BMOD-ref + packed signed-pair argument, terminated by -1',status:'STATICALLY_VERIFIED'}]},topLevelModules:top,bmods,resourceContexts:contexts,summary,decision:{backgroundModuleGrammarBounded:true,packedRootResourcesResolved:true,sceneBmodReferenceSurfaceEstablished:true,bmodPaletteTableBindingEstablished:true,stageDescriptorDecodeSurfaceEstablished:true,layoutRecordFieldSemanticsEstablished:false,arcadeStageNameMappingEstablished:false,fullScenePixelCompositionEstablished:false,verdict:'MK1_BACKGROUND_MODULE_RESOURCE_GRAPH_ESTABLISHED',narrative:`O27 reconstructs ${top.length} canonical BGND.ASM top-level background module records from the authentic installation. Their packed roots resolve to ${summary.uniqueResourceFileCount} HDRS.GRA resources; their INIT_BAKMODS scene lists contain ${sceneBmodEntries} BMOD references (${bmods.length} unique) plus ${literalOne} literal-one control marker(s). Every referenced BMOD has an exact BGNDPAL.ASM palette-table pointer and a count-bounded 8-byte layout table ending in 0xFFFF. The ${contexts.length} unique resource/descriptor/palette contexts expose ${totalDesc} contiguous NO_XY descriptor records, all ${totalOk} of which decode successfully against the authentic GRA payloads. O27 deliberately leaves the individual layout-record bitfields, arcade stage-name mapping, and final pixel placement/compositing semantics unresolved.`},status:'SUCCESS',validation:{allChecksPassed:true,checks}};
}
export function createMK1StageBackgroundResourceGraphCensusExport(report:MK1StageBackgroundResourceGraphCensusReport){if(report.status!=='SUCCESS'||!report.validation.allChecksPassed)throw new Error('O27 export blocked');return report;}
