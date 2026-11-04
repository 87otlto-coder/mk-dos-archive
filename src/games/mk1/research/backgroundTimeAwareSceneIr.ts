/**
 * MK1 time-aware background scene IR — Pass 1E.3O.31.
 *
 * Read-only/export-first join pass over O27..O30. It closes the missing plane
 * assignment between top-level scene-entry arrays and the nine BAK planes,
 * expands every instantiated placement with its exact plane, world/screen
 * coordinates, descriptor and palette state, then binds the already-qualified
 * dynamic process families to the placement objects they actually traverse.
 *
 * Scheduler time remains ticks only. Exact order inside equal sort-key groups
 * remains runtime-history dependent. CAVE's special-process objects and the
 * unresolved STRIPPED child are preserved without being forced into placement IR.
 */
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1StageBackgroundResourceGraphCensusReport } from './stageBackgroundResourceGraphCensus';
import { MK1BackgroundPlacementCompositionQualificationReport } from './backgroundPlacementCompositionQualification';
import { MK1BackgroundRendererProjectionQualificationReport } from './backgroundRendererProjectionQualification';
import { MK1BackgroundDynamicProcessAnimationCensusReport } from './backgroundDynamicProcessAnimationCensus';

const CANONICAL_SHA='750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const CODE_BASE=0x00050a54, STATIC_BASE=0x0008ca54;
function hx(v:number){return `0x${(v>>>0).toString(16).padStart(8,'0').toUpperCase()}`;}
function u16(b:Uint8Array,o:number){return (b[o]|(b[o+1]<<8))>>>0;}
function u32(b:Uint8Array,o:number){return ((b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0);}
function i16v(v:number){return v&0x8000?v-0x10000:v;}
function addI16(a:number,b:number){return i16v((a+b)&0xffff);}
function bytesEqualAt(hay:Uint8Array,physical:number,expected:number[]){if(physical<0||physical+expected.length>hay.length)return false;for(let i=0;i<expected.length;i++)if(hay[physical+i]!==expected[i])return false;return true;}
function uniq<T>(a:T[]){return [...new Set(a)];}

export interface MK1BackgroundScenePlacementInstance {
 id:string;placementIndex:number;controlWord:number;controlWordHex:string;controlHighByte:number;selectorWord:number;selectorWordHex:string;
 localX:number;localY:number;worldX:number;worldY:number;initialScreenX:number;initialScreenY:number;
 sortPrimary:number;sortSecondaryFixed1616:number;descriptorOrdinal:number;descriptorWidth:number;descriptorHeight:number;
 descriptorPackedReference:number;descriptorPackedReferenceHex:string;descriptorGraOffset:number;descriptorGraOffsetHex:string;
 paletteSelector:number;paletteRecordRef:number;paletteRecordRefHex:string;paletteRecordAliasSelectors:number[];
 paletteStateSource:'BAKGND_SELECTED_OBJECT_PALETTE';
}
export interface MK1BackgroundScenePlaneSlot {
 slotIndex:number;planeIndex:number;bmodListSymbol:string;objectListWatcomOffset:number;objectListWatcomOffsetHex:string;rendererTraversalRank:number;
 entryKind:'BMOD_WITH_PACKED_I16_PAIR'|'LITERAL_ONE';
 bmodSymbol?:string;baseX?:number;baseY?:number;placementRecordCount?:number;placements?:MK1BackgroundScenePlacementInstance[];
}
export interface MK1BackgroundModuleSceneIr {
 topLevelModuleSymbol:string;resourcePath:string;fileId:number;startingPlaneIndex:number;startingBmodListSymbol:string;
 initialCamera:{allPlaneScrollX:number;sharedScrollY:number;source:'INIT_BAKMODS_HEADER_0A_AND_08';wallClockPhaseEstablished:false};
 initCallback:{watcomOffset:number;watcomOffsetHex:string;classification:string;childCallbacks:number[];childCallbacksHex:string[]};
 planeSlots:MK1BackgroundScenePlaneSlot[];instantiatedPlacementCount:number;equalSortKeyGroupCount:number;objectsInEqualSortKeyGroups:number;
}
interface DynamicTargetBinding {family:string;module:string;planeIndex:number;sortPrimaryFilter:number|null;objectCount:number;objectIds:string[];paletteSelectors:number[];paletteRecordRefs:number[];delayTicks:number;frameStateRange:string;palettePreservedAcrossDescriptorSwap:true;absolutePhaseEstablished:false;}

export interface MK1BackgroundTimeAwareSceneIrReport {
 format:'mk1_background_time_aware_scene_ir_v1';timestamp:string;operationId:string;
 provenance:{sourceKind:'user-loaded-directory';fileName:string;byteLength:number;sha256:string;synthetic:false;artifactGeneratedByTest:false;timestamp:string;operationId:string};
 prerequisite:{o27OperationId:string;o27Verdict:string;o28OperationId:string;o28Verdict:string;o29OperationId:string;o29Verdict:string;o30OperationId:string;o30Verdict:string};
 planeSlotJoinProof:{
  exactInstructionSignatures:Array<{meaning:string;watcomOffset:number;watcomOffsetHex:string;bytesHex:string;matched:true}>;
  bmodSlotBaseWatcomOffset:number;bmodSlotBaseWatcomOffsetHex:string;bmodSlotStride:4;planeCount:9;
  rule:string;literalOneMeaning:string;
 };
 rendererAndTimeModel:{backgroundPlaneTraversal:number[];fullRelevantListTraversal:MK1BackgroundRendererProjectionQualificationReport['rendererProof']['fullRelevantListTraversal'];projection:string;initialCameraSource:string;sortPrimary:string;sortSecondary:string;equalSortKeyOrderEstablished:false;schedulerUnit:'TICKS';wallClockDurationEstablished:false;canonicalAbsoluteDynamicPhaseEstablished:false;staticFlattenedStageCanonical:false};
 modules:MK1BackgroundModuleSceneIr[];
 dynamicBindings:{arena:DynamicTargetBinding[];pillar:DynamicTargetBinding[];cave:{modules:string[];target:string;placementObjectBindingEstablished:false;delayTicks:number;frameStateRange:string;absolutePhaseEstablished:false};motionProcesses:MK1BackgroundDynamicProcessAnimationCensusReport['motionAndDynamicProcesses'];strippedExternalChildResolved:false};
 paletteState:{creationPath:'BAKGND palette selector -> palette table -> object +0x28';descriptorCycleBehavior:'qualified descriptor-cycle helpers preserve object +0x28';arenaTargetPaletteAlias:{selectors:number[];recordRefs:number[];singleAliasedRecord:boolean};ownershipNote:string};
 summary:{topLevelModuleCount:number;sceneSlotCount:number;bmodSceneSlotCount:number;literalOneSceneSlotCount:number;instantiatedPlacementCount:number;underlyingUniqueBmodPlacementRecordCount:number;arenaPlacementObjectBindings:number;pillarPlacementObjectBindings:number;equalSortKeyGroupCount:number;modulesWithDynamicProcessSpawns:number};
 decision:{sceneEntryToPlaneMappingEstablished:true;allTopLevelModuleSceneSlotsMapped:true;placementPlaneAndProjectionIrEstablished:true;qualifiedDynamicPlacementBindingsEstablished:true;paletteStatePreservationIntegrated:true;schedulerTickStateIntegrated:true;wallClockTimingEstablished:false;canonicalAbsoluteDynamicPhaseEstablished:false;exactEqualKeyTieOrderEstablished:false;canonicalStaticFlattenedStageSufficient:false;verdict:'MK1_TIME_AWARE_BACKGROUND_SCENE_IR_ESTABLISHED';narrative:string};
 status:'SUCCESS';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean;detail?:string}>};
}

export async function executeBackgroundTimeAwareSceneIr(source:DirectorySource,o27:MK1StageBackgroundResourceGraphCensusReport,o28:MK1BackgroundPlacementCompositionQualificationReport,o29:MK1BackgroundRendererProjectionQualificationReport,o30:MK1BackgroundDynamicProcessAnimationCensusReport):Promise<MK1BackgroundTimeAwareSceneIrReport>{
 if(source.isSynthetic!==false)throw new Error('O31 requires authentic MK1 installation');
 if(o27.status!=='SUCCESS'||!o27.validation.allChecksPassed||o27.decision.verdict!=='MK1_BACKGROUND_MODULE_RESOURCE_GRAPH_ESTABLISHED')throw new Error('O31 requires verified O27');
 if(o28.status!=='SUCCESS'||!o28.validation.allChecksPassed||o28.decision.verdict!=='MK1_BACKGROUND_PLACEMENT_AND_PIT_SCENE_EXPORT_IR_ESTABLISHED')throw new Error('O31 requires verified O28');
 if(o29.status!=='SUCCESS'||!o29.validation.allChecksPassed||o29.decision.verdict!=='MK1_BACKGROUND_RENDER_ORDER_AND_CAMERA_PROJECTION_ESTABLISHED_EQUAL_KEY_TIES_AND_DYNAMICS_PENDING')throw new Error('O31 requires verified O29');
 if(o30.status!=='SUCCESS'||!o30.validation.allChecksPassed||o30.decision.verdict!=='MK1_BACKGROUND_DYNAMIC_PROCESS_AND_DESCRIPTOR_ANIMATION_SURFACE_ESTABLISHED')throw new Error('O31 requires verified O30');
 const files=await source.listRecursive(),exeEntry=files.find(f=>f.name.toUpperCase()==='MK1.EXE');if(!exeEntry)throw new Error('O31 requires MK1.EXE');
 const exe=await source.readSlice(exeEntry.path,0,exeEntry.size),sha=await sha256Bytes(exe);if(sha!==CANONICAL_SHA||[o27.provenance.sha256,o28.provenance.sha256,o29.provenance.sha256,o30.provenance.sha256].some(x=>x!==sha))throw new Error('O31 canonical provenance mismatch');
 const sigs=[
  {meaning:'INIT_BAKMODS loads destination BAK slot start from header +0x18',off:0x4db4,bytes:[0x8b,0x78,0x18]},
  {meaning:'INIT_BAKMODS starts scene-entry stream at header +0x1C',off:0x4db7,bytes:[0x8d,0x50,0x1c]},
  {meaning:'literal-one scene slot is written with STOSD and source advances four bytes',off:0x4dc1,bytes:[0xab,0x83,0xc2,0x04]},
  {meaning:'BMOD scene slot writes pointer to current eight-byte scene entry with STOSD',off:0x4dcc,bytes:[0x8b,0xc2,0xab,0x83,0xc2,0x08]},
  {meaning:'MULTI_PLANE reads each plane record BMOD-slot pointer at +0x10',off:0x461d,bytes:[0x8b,0x53,0x10]},
  {meaning:'MULTI_PLANE advances exactly one 20-byte plane record per BAK slot',off:0x4639,bytes:[0x83,0xc3,0x14]},
  {meaning:'MULTI_PLANE recognizes literal-one plane slot and skips object creation for it',off:0x4645,bytes:[0x8b,0x02,0x83,0xf8,0x01,0x74,0xed]},
 ];for(const s of sigs)if(!bytesEqualAt(exe,CODE_BASE+s.off,s.bytes))throw new Error(`O31 static scene-slot signature mismatch at ${hx(s.off)}`);
 const planeByBmodSlot=new Map(o29.planeModel.records.map(p=>[p.bmodListWatcomOffset,p] as const)),bmodBySymbol=new Map(o27.bmods.map(b=>[b.symbol,b] as const));
 type Ctx=MK1StageBackgroundResourceGraphCensusReport['resourceContexts'][number];const ctxByBmod=new Map<string,Ctx>();for(const c of o27.resourceContexts)for(const b of c.bmodSymbols)ctxByBmod.set(b,c);
 const aliasMapByCtx=new Map<number,Map<number,number[]>>();for(const c of o27.resourceContexts){const m=new Map<number,number[]>();c.paletteRecordRefs.forEach((ref,i)=>m.set(ref,[...(m.get(ref)??[]),i]));aliasMapByCtx.set(c.fileId,m);}
 const initClassByModule=new Map<string,MK1BackgroundDynamicProcessAnimationCensusReport['initCallbackCensus'][number]>();for(const c of o30.initCallbackCensus)for(const m of c.topLevelModules)initClassByModule.set(m,c);
 let sceneSlotCount=0,bmodSceneSlotCount=0,literalOneCount=0,instantiated=0,equalGroupsTotal=0,equalObjectsTotal=0;
 const modules:MK1BackgroundModuleSceneIr[]=[];
 for(const m of o27.topLevelModules){
  const startPlaneRec=planeByBmodSlot.get(m.destinationListWatcomOffset);if(!startPlaneRec)throw new Error(`O31 unmapped destination BAK slot ${m.symbol}`);const startPlane=startPlaneRec.planeIndex;
  const init=initClassByModule.get(m.symbol);if(!init)throw new Error(`O31 missing O30 init class ${m.symbol}`);
  const scrollY=i16v(m.headerWords[2]),scrollX=i16v(m.headerWords[3]);const slots:MK1BackgroundScenePlaneSlot[]=[];const tieCounts=new Map<string,number>();let moduleInstantiated=0;
  for(let slotIndex=0;slotIndex<m.sceneEntries.length;slotIndex++){
   const se=m.sceneEntries[slotIndex],planeIndex=startPlane+slotIndex;if(planeIndex<0||planeIndex>=9)throw new Error(`O31 ${m.symbol} scene slot ${slotIndex} maps outside nine planes`);const plane=o29.planeModel.records.find(p=>p.planeIndex===planeIndex);if(!plane)throw new Error(`O31 missing plane ${planeIndex}`);sceneSlotCount++;
   if(se.kind==='LITERAL_ONE'){literalOneCount++;slots.push({slotIndex,planeIndex,bmodListSymbol:plane.bmodListSymbol,objectListWatcomOffset:plane.objectListWatcomOffset,objectListWatcomOffsetHex:plane.objectListWatcomOffsetHex,rendererTraversalRank:plane.rendererTraversalRank,entryKind:'LITERAL_ONE'});continue;}
   bmodSceneSlotCount++;const b=bmodBySymbol.get(se.bmodSymbol),ctx=ctxByBmod.get(se.bmodSymbol);if(!b||!ctx)throw new Error(`O31 BMOD/context missing ${se.bmodSymbol}`);if(ctx.fileId!==m.fileId)throw new Error(`O31 context/module file mismatch ${m.symbol}/${se.bmodSymbol}`);
   const placements:MK1BackgroundScenePlacementInstance[]=[];
   for(let i=0;i<b.placementRecordCount;i++){
    const p=STATIC_BASE+b.placementTableWatcomOffset+i*8,w0=u16(exe,p),w1=u16(exe,p+2),w2=u16(exe,p+4),w3=u16(exe,p+6),dwordIndex=w3&0x0fff;if(dwordIndex&1)throw new Error(`O31 odd descriptor selector ${m.symbol}/${b.symbol}[${i}]`);const ord=dwordIndex>>>1,pal=((w3>>>8)&0xf0)|(w0&0x0f);if(ord>=ctx.descriptorPrefixCount||pal>=ctx.palettePointerCount)throw new Error(`O31 selector out of range ${m.symbol}/${b.symbol}[${i}]`);
    const dp=STATIC_BASE+ctx.descriptorTableWatcomOffset+ord*8,w=u16(exe,dp),h=u16(exe,dp+2),packed=u32(exe,dp+4);if((packed>>>24)!==ctx.fileId)throw new Error(`O31 descriptor file mismatch ${m.symbol}/${b.symbol}[${i}]`);const pref=ctx.paletteRecordRefs[pal],worldX=addI16(se.lowI16,i16v(w1)),worldY=addI16(se.highI16,i16v(w2)),controlHigh=w0>>>8,id=`${m.symbol}/plane_${planeIndex}/${b.symbol}/placement_${i}`;
    placements.push({id,placementIndex:i,controlWord:w0,controlWordHex:hx(w0),controlHighByte:controlHigh,selectorWord:w3,selectorWordHex:hx(w3),localX:i16v(w1),localY:i16v(w2),worldX,worldY,initialScreenX:worldX-scrollX,initialScreenY:worldY-scrollY,sortPrimary:controlHigh,sortSecondaryFixed1616:(worldY<<16)|0,descriptorOrdinal:ord,descriptorWidth:w,descriptorHeight:h,descriptorPackedReference:packed,descriptorPackedReferenceHex:hx(packed),descriptorGraOffset:packed&0xffffff,descriptorGraOffsetHex:hx(packed&0xffffff),paletteSelector:pal,paletteRecordRef:pref,paletteRecordRefHex:hx(pref),paletteRecordAliasSelectors:[...(aliasMapByCtx.get(ctx.fileId)?.get(pref)??[])],paletteStateSource:'BAKGND_SELECTED_OBJECT_PALETTE'});
    const tk=`${planeIndex}:${controlHigh}:${worldY}`;tieCounts.set(tk,(tieCounts.get(tk)??0)+1);moduleInstantiated++;instantiated++;
   }
   slots.push({slotIndex,planeIndex,bmodListSymbol:plane.bmodListSymbol,objectListWatcomOffset:plane.objectListWatcomOffset,objectListWatcomOffsetHex:plane.objectListWatcomOffsetHex,rendererTraversalRank:plane.rendererTraversalRank,entryKind:'BMOD_WITH_PACKED_I16_PAIR',bmodSymbol:b.symbol,baseX:se.lowI16,baseY:se.highI16,placementRecordCount:b.placementRecordCount,placements});
  }
  const tieGroups=[...tieCounts.values()].filter(x=>x>1);equalGroupsTotal+=tieGroups.length;equalObjectsTotal+=tieGroups.reduce((a,b)=>a+b,0);
  modules.push({topLevelModuleSymbol:m.symbol,resourcePath:m.resourcePath,fileId:m.fileId,startingPlaneIndex:startPlane,startingBmodListSymbol:startPlaneRec.bmodListSymbol,initialCamera:{allPlaneScrollX:scrollX,sharedScrollY:scrollY,source:'INIT_BAKMODS_HEADER_0A_AND_08',wallClockPhaseEstablished:false},initCallback:{watcomOffset:init.callbackWatcomOffset,watcomOffsetHex:init.callbackWatcomOffsetHex,classification:init.classification,childCallbacks:[...init.childCallbacks],childCallbacksHex:[...init.childCallbacksHex]},planeSlots:slots,instantiatedPlacementCount:moduleInstantiated,equalSortKeyGroupCount:tieGroups.length,objectsInEqualSortKeyGroups:tieGroups.reduce((a,b)=>a+b,0)});
 }
 const placementTargets=(moduleName:string,planeIndex:number,sortPrimaryFilter:number|null)=>{const m=modules.find(x=>x.topLevelModuleSymbol===moduleName);if(!m)throw new Error(`O31 target module missing ${moduleName}`);return m.planeSlots.filter(s=>s.planeIndex===planeIndex&&s.entryKind==='BMOD_WITH_PACKED_I16_PAIR').flatMap(s=>s.placements??[]).filter(p=>sortPrimaryFilter===null||p.sortPrimary===sortPrimaryFilter);};
 const arenaBindings:DynamicTargetBinding[]=[];for(const module of ['ARENA_MOD','ARENA_MOD386'])for(const planeIndex of [3,4]){const objs=placementTargets(module,planeIndex,null);arenaBindings.push({family:'ARENA_ACTIVE_DESCRIPTOR_CYCLE',module,planeIndex,sortPrimaryFilter:null,objectCount:objs.length,objectIds:objs.map(x=>x.id),paletteSelectors:uniq(objs.map(x=>x.paletteSelector)).sort((a,b)=>a-b),paletteRecordRefs:uniq(objs.map(x=>x.paletteRecordRef)).sort((a,b)=>a-b),delayTicks:o30.descriptorCycles.arena.delayTicks,frameStateRange:o30.descriptorCycles.arena.frameStateRange,palettePreservedAcrossDescriptorSwap:true,absolutePhaseEstablished:false});}
 const pillarBindings:DynamicTargetBinding[]=[];for(const [cycle,planeIndex,key] of [[o30.descriptorCycles.pillar[0],0,4],[o30.descriptorCycles.pillar[1],1,3],[o30.descriptorCycles.pillar[2],1,2]] as const){const objs=placementTargets('PILLAR_MOD',planeIndex,key);pillarBindings.push({family:cycle.name,module:'PILLAR_MOD',planeIndex,sortPrimaryFilter:key,objectCount:objs.length,objectIds:objs.map(x=>x.id),paletteSelectors:uniq(objs.map(x=>x.paletteSelector)).sort((a,b)=>a-b),paletteRecordRefs:uniq(objs.map(x=>x.paletteRecordRef)).sort((a,b)=>a-b),delayTicks:cycle.delayTicks,frameStateRange:cycle.frameStateRange,palettePreservedAcrossDescriptorSwap:true,absolutePhaseEstablished:false});}
 const arenaSelectors=uniq(arenaBindings.flatMap(x=>x.paletteSelectors)).sort((a,b)=>a-b),arenaRefs=uniq(arenaBindings.flatMap(x=>x.paletteRecordRefs)).sort((a,b)=>a-b);
 const checks=[
  {checkId:'CANONICAL_AUTHENTIC_SOURCE',passed:true},{checkId:'O27_TO_O30_PREREQUISITES',passed:true},{checkId:'INIT_BAKMODS_SEQUENTIAL_PLANE_SLOT_JOIN',passed:true,detail:`signatures=${sigs.length}`},
  {checkId:'ALL_24_MODULES_MAPPED',passed:modules.length===24,detail:`modules=${modules.length}`},{checkId:'ALL_72_SCENE_SLOTS_MAPPED',passed:sceneSlotCount===72&&bmodSceneSlotCount===68&&literalOneCount===4,detail:`slots=${sceneSlotCount}, bmod=${bmodSceneSlotCount}, literalOne=${literalOneCount}`},
  {checkId:'ALL_SCENE_SLOTS_WITHIN_NINE_PLANES',passed:modules.every(m=>m.planeSlots.every(s=>s.planeIndex>=0&&s.planeIndex<9))},{checkId:'INSTANTIATED_PLACEMENT_COUNT',passed:instantiated===4488,detail:`instances=${instantiated}`},
  {checkId:'UNDERLYING_BMOD_PLACEMENT_SURFACE_PRESERVED',passed:o28.allBmods.placementRecordCount===2550},{checkId:'ARENA_PLANES_3_4_BOUND_TO_PLACEMENTS',passed:arenaBindings.length===4&&arenaBindings.every((x,i)=>x.objectCount===(i%2===0?8:7)),detail:`counts=${arenaBindings.map(x=>x.objectCount).join(',')}`},
  {checkId:'ARENA_OBJECT_PALETTE_ALIAS_BOUND',passed:arenaSelectors.join(',')==='0,11'&&arenaRefs.length===1,detail:`selectors=${arenaSelectors.join(',')}, refs=${arenaRefs.map(hx).join(',')}`},{checkId:'PILLAR_CYCLE_TARGETS_BOUND_TO_PLACEMENTS',passed:pillarBindings.map(x=>x.objectCount).join(',')==='1,1,2',detail:`counts=${pillarBindings.map(x=>x.objectCount).join(',')}`},
  {checkId:'CAVE_SPECIAL_PROCESS_OBJECTS_NOT_FORCED_INTO_PLACEMENT_IR',passed:true},{checkId:'PALETTE_PRESERVATION_FROM_O30_INTEGRATED',passed:o30.palettePreservation.arenaDirectSwapHelperPreservesObjectPaletteField&&o30.palettePreservation.genericDescriptorSwapHelperPreservesObjectPaletteField},
  {checkId:'SCHEDULER_TICKS_NOT_WALL_CLOCK',passed:o30.schedulerProof.wallClockDurationEstablished===false},{checkId:'EQUAL_KEY_TIES_REMAIN_EXPLICIT',passed:equalGroupsTotal>0&&o29.decision.exactEqualKeyTieHistoryIndependentOrderEstablished===false,detail:`groups=${equalGroupsTotal}, objects=${equalObjectsTotal}`},{checkId:'NO_WRITE_PATH',passed:true},
 ];if(!checks.every(x=>x.passed))throw new Error(`O31 validation failed: ${checks.filter(x=>!x.passed).map(x=>x.checkId).join(', ')}`);
 const timestamp=new Date().toISOString(),operationId=createOperationId('background_time_aware_scene_ir');
 const report:MK1BackgroundTimeAwareSceneIrReport={format:'mk1_background_time_aware_scene_ir_v1',timestamp,operationId,provenance:{sourceKind:'user-loaded-directory',fileName:exeEntry.name,byteLength:exeEntry.size,sha256:sha,synthetic:false,artifactGeneratedByTest:false,timestamp,operationId},prerequisite:{o27OperationId:o27.operationId,o27Verdict:o27.decision.verdict,o28OperationId:o28.operationId,o28Verdict:o28.decision.verdict,o29OperationId:o29.operationId,o29Verdict:o29.decision.verdict,o30OperationId:o30.operationId,o30Verdict:o30.decision.verdict},planeSlotJoinProof:{exactInstructionSignatures:sigs.map(s=>({meaning:s.meaning,watcomOffset:s.off,watcomOffsetHex:hx(s.off),bytesHex:s.bytes.map(x=>x.toString(16).padStart(2,'0').toUpperCase()).join(' '),matched:true})),bmodSlotBaseWatcomOffset:0x49ca0,bmodSlotBaseWatcomOffsetHex:hx(0x49ca0),bmodSlotStride:4,planeCount:9,rule:'INIT_BAKMODS writes each top-level scene entry into consecutive BAKxMODS dword slots beginning at header +0x18; O29 binds those slots one-to-one to planes 0..8.',literalOneMeaning:'A literal-one slot is preserved as a deliberate per-plane skip marker because MULTI_PLANE detects value 1 and advances without creating background objects.'},rendererAndTimeModel:{backgroundPlaneTraversal:[...o29.rendererProof.backgroundPlaneTraversal],fullRelevantListTraversal:o29.rendererProof.fullRelevantListTraversal,projection:'screenX = worldX - currentPlaneScrollX; screenY = worldY - sharedScrollY for ordinary BAKGND placements',initialCameraSource:'INIT_BAKMODS header +0x0A initializes every plane X scroll; signed header +0x08 initializes shared Y scroll',sortPrimary:o29.rendererProof.intraListSort.primary,sortSecondary:o29.rendererProof.intraListSort.secondary,equalSortKeyOrderEstablished:false,schedulerUnit:'TICKS',wallClockDurationEstablished:false,canonicalAbsoluteDynamicPhaseEstablished:false,staticFlattenedStageCanonical:false},modules,dynamicBindings:{arena:arenaBindings,pillar:pillarBindings,cave:{modules:['CAVE_MOD','CAVE_MOD386'],target:o30.descriptorCycles.cave.target,placementObjectBindingEstablished:false,delayTicks:o30.descriptorCycles.cave.delayTicks,frameStateRange:o30.descriptorCycles.cave.frameStateRange,absolutePhaseEstablished:false},motionProcesses:o30.motionAndDynamicProcesses,strippedExternalChildResolved:false},paletteState:{creationPath:'BAKGND palette selector -> palette table -> object +0x28',descriptorCycleBehavior:'qualified descriptor-cycle helpers preserve object +0x28',arenaTargetPaletteAlias:{selectors:arenaSelectors,recordRefs:arenaRefs,singleAliasedRecord:arenaRefs.length===1},ownershipNote:'For placement-bound dynamic targets, palette state is not inferred from resource compatibility: O28 establishes the object palette selector at creation and O30 establishes that the descriptor-cycle update preserves that field. CAVE special-process objects remain outside this placement-derived ownership join.'},summary:{topLevelModuleCount:modules.length,sceneSlotCount,bmodSceneSlotCount,literalOneSceneSlotCount:literalOneCount,instantiatedPlacementCount:instantiated,underlyingUniqueBmodPlacementRecordCount:o28.allBmods.placementRecordCount,arenaPlacementObjectBindings:arenaBindings.reduce((a,b)=>a+b.objectCount,0),pillarPlacementObjectBindings:pillarBindings.reduce((a,b)=>a+b.objectCount,0),equalSortKeyGroupCount:equalGroupsTotal,modulesWithDynamicProcessSpawns:o30.summary.modulesUsingProcessSpawningCallbacks},decision:{sceneEntryToPlaneMappingEstablished:true,allTopLevelModuleSceneSlotsMapped:true,placementPlaneAndProjectionIrEstablished:true,qualifiedDynamicPlacementBindingsEstablished:true,paletteStatePreservationIntegrated:true,schedulerTickStateIntegrated:true,wallClockTimingEstablished:false,canonicalAbsoluteDynamicPhaseEstablished:false,exactEqualKeyTieOrderEstablished:false,canonicalStaticFlattenedStageSufficient:false,verdict:'MK1_TIME_AWARE_BACKGROUND_SCENE_IR_ESTABLISHED',narrative:`O31 joins O27's module/scene graph, O28's placement/palette grammar, O29's nine-plane renderer/camera model and O30's process/descriptor-cycle census into one time-aware scene IR. INIT_BAKMODS is now directly qualified to write top-level scene entries into consecutive BAK0MODS..BAK8MODS dword slots, so all ${sceneSlotCount} scene slots (${bmodSceneSlotCount} BMOD references plus ${literalOneCount} literal-one skip markers) have exact plane identities. Expanding those references yields ${instantiated} placement-object instances with exact world coordinates, initial camera projection, sort keys, descriptor ordinals and BAKGND-selected palette state. This resolves O30's placement-bound dynamic targets: ARENA's updater traverses the ${arenaBindings.reduce((a,b)=>a+b.objectCount,0)} plane-3/4 placement instances across the normal/386 module variants, while PILLAR's three cycle filters bind to ${pillarBindings.reduce((a,b)=>a+b.objectCount,0)} exact placement instances in the normal module. ARENA target selectors 0 and 11 alias the same palette record, and the qualified descriptor-swap path preserves that object palette state. CAVE remains a special-process-object cycle with random per-object phase and is not falsely forced into BAK placement IR. Scheduler timing remains ticks only, absolute dynamic phase is not invented, and exact equal-key tie ordering remains runtime-history dependent; therefore a static flattened image is still only a convenience snapshot, not the canonical scene representation.`},status:'SUCCESS',validation:{allChecksPassed:true,checks}};
 return report;
}
export function createMK1BackgroundTimeAwareSceneIrExport(report:MK1BackgroundTimeAwareSceneIrReport){if(report.status!=='SUCCESS'||!report.validation.allChecksPassed)throw new Error('O31 export blocked');return report;}
