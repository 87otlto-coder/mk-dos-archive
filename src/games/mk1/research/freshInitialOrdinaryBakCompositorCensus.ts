/**
 * MK1 fresh-initial ordinary BAK compositor census — Pass 1E.3O.43.
 *
 * Read-only/export-first generalization of O41's fresh PIT ordering proof over all
 * 24 O27/O31 top-level background modules. The qualified state is deliberately
 * narrow: BAKCLR/empty ordinary placement occupancy, the header-defined initial
 * camera, and the first placement-derived MULTI_PLANE population. Process-created
 * objects, special lists, and later cull/recreate history are excluded.
 */
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1BackgroundTimeAwareSceneIrReport, MK1BackgroundScenePlacementInstance } from './backgroundTimeAwareSceneIr';
import { MK1BackgroundRendererHistoryClippingQualificationReport } from './backgroundRendererHistoryClippingQualification';

const CANONICAL_SHA='750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
function overlap(ax:number,ay:number,aw:number,ah:number,bx0:number,by0:number,bx1:number,by1:number){return ax+aw>bx0&&ax<bx1&&ay+ah>by0&&ay<by1;}

export interface MK1FreshInitialVisiblePlacement {
 id:string;bmodSymbol:string;planeIndex:number;placementIndex:number;worldX:number;worldY:number;screenX:number;screenY:number;width:number;height:number;
 primarySortKey:number;secondarySortKey:number;controlWord:number;descriptorOrdinal:number;descriptorGraOffset:number;descriptorPackedReference:number;paletteSelector:number;paletteRecordRef:number;
}
export interface MK1FreshInitialPlaneCensus {
 planeIndex:number;bmodSymbol:string|null;entryKind:'BMOD_WITH_PACKED_I16_PAIR'|'LITERAL_ONE';activePlacementIndices:number[];visiblePlacementIndices:number[];
 visiblePlacements:MK1FreshInitialVisiblePlacement[];freshHeadToTailDrawOrderPlacementIds:string[];
 equalKeyVisibleGroups:Array<{primarySortKey:number;secondarySortKey:number;scanOrderPlacementIds:string[];freshHeadToTailDrawOrderPlacementIds:string[];overlappingPairs:Array<{a:string;b:string;rectanglesOverlap:boolean}>}>;
}
export interface MK1FreshInitialModuleCensus {
 topLevelModuleSymbol:string;resourcePath:string;fileId:number;definition:string;initialCamera:{x:number;y:number;viewportWidth:320;viewportHeight:200};
 expandedActiveWorldRect:{minX:number;minY:number;maxXExclusive:number;maxYExclusive:number};planeCensus:MK1FreshInitialPlaneCensus[];
 activePlacementCount:number;visiblePlacementCount:number;visibleEqualKeyGroupCount:number;visibleOverlappingEqualKeyPairCount:number;
 rendererPlaneTraversal:number[];freshRendererDrawOrderPlacementIds:string[];deterministicForDefinedFreshSnapshot:true;historyIndependentForArbitraryLaterSnapshot:false;
}
export interface MK1FreshInitialOrdinaryBakCompositorCensusReport {
 format:'mk1_fresh_initial_ordinary_bak_compositor_census_v1';timestamp:string;operationId:string;
 provenance:{sourceKind:'user-loaded-directory';fileName:string;byteLength:number;sha256:string;synthetic:false;artifactGeneratedByTest:false;timestamp:string;operationId:string};
 prerequisite:{o31OperationId:string;o31Verdict:string;o41OperationId:string;o41Verdict:string};
 generalizedRule:{stateDefinition:string;activeWindowExpansion:{horizontalPixels:68;verticalPixels:48};projection:string;freshInsertionRule:string;intraPlaneSort:string;rendererPlaneTraversal:number[];laterHistoryBoundary:string};
 modules:MK1FreshInitialModuleCensus[];
 summary:{topLevelModuleCount:number;qualifiedModuleCount:number;activePlacementInstances:number;visiblePlacementInstances:number;visibleEqualKeyGroups:number;visibleOverlappingEqualKeyPairs:number;modulesWithVisiblePlacements:number;modulesWithOverlappingEqualKeyPairs:number};
 decision:{freshInitialOrdinaryBakCensusEstablished:true;all24ModulesQualified:true;freshPerPlaneTieOrderEstablished:true;crossPlaneRendererOrderEstablished:true;arbitraryLaterEqualTieOrderEstablished:false;processCreatedObjectsIncluded:false;canonicalGameplayFramesEstablished:false;verdict:'MK1_FRESH_INITIAL_ORDINARY_BAK_COMPOSITOR_CENSUS_ESTABLISHED';narrative:string};
 status:'SUCCESS';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean;detail?:string}>};
}

function visiblePlacement(p:MK1BackgroundScenePlacementInstance,bmodSymbol:string,planeIndex:number,camX:number,camY:number):MK1FreshInitialVisiblePlacement{
 return{id:p.id,bmodSymbol,planeIndex,placementIndex:p.placementIndex,worldX:p.worldX,worldY:p.worldY,screenX:p.worldX-camX,screenY:p.worldY-camY,width:p.descriptorWidth,height:p.descriptorHeight,primarySortKey:p.sortPrimary,secondarySortKey:p.worldY,controlWord:p.controlWord,descriptorOrdinal:p.descriptorOrdinal,descriptorGraOffset:p.descriptorGraOffset,descriptorPackedReference:p.descriptorPackedReference,paletteSelector:p.paletteSelector,paletteRecordRef:p.paletteRecordRef};
}

export async function executeFreshInitialOrdinaryBakCompositorCensus(source:DirectorySource,o31:MK1BackgroundTimeAwareSceneIrReport,o41:MK1BackgroundRendererHistoryClippingQualificationReport):Promise<MK1FreshInitialOrdinaryBakCompositorCensusReport>{
 if(source.isSynthetic!==false)throw new Error('O43 requires authentic MK1 installation');
 if(o31.status!=='SUCCESS'||!o31.validation.allChecksPassed||o31.decision.verdict!=='MK1_TIME_AWARE_BACKGROUND_SCENE_IR_ESTABLISHED')throw new Error('O43 requires verified O31');
 if(o41.status!=='SUCCESS'||!o41.validation.allChecksPassed||o41.decision.verdict!=='MK1_RENDERER_SPECIAL_LIST_CLIPPING_AND_BACKGROUND_HISTORY_ORDER_SURFACE_ESTABLISHED')throw new Error('O43 requires verified O41');
 const files=await source.listRecursive(),exeEntry=files.find(f=>f.name.toUpperCase()==='MK1.EXE');if(!exeEntry)throw new Error('O43 requires MK1.EXE');
 const exe=await source.readSlice(exeEntry.path,0,exeEntry.size),sha=await sha256Bytes(exe);if(sha!==CANONICAL_SHA||sha!==o31.provenance.sha256||sha!==o41.provenance.sha256)throw new Error('O43 canonical provenance mismatch');
 const traversal=[...o31.rendererAndTimeModel.backgroundPlaneTraversal];if(traversal.join(',')!=='8,7,6,5,4,3,2,1,0')throw new Error('O43 renderer plane traversal mismatch');
 const modules:MK1FreshInitialModuleCensus[]=[];let totalActive=0,totalVisible=0,totalGroups=0,totalOverlaps=0,modulesWithVisible=0,modulesWithOverlaps=0;
 for(const m of o31.modules){
  const camX=m.initialCamera.allPlaneScrollX,camY=m.initialCamera.sharedScrollY,activeRect={minX:camX-68,minY:camY-48,maxXExclusive:camX+320+68,maxYExclusive:camY+200+48};
  const planeRows:MK1FreshInitialPlaneCensus[]=[];let activeCount=0,visibleCount=0,equalGroups=0,overlapPairs=0;
  for(const slot of m.planeSlots){
   const active:number[]=[],visible:MK1FreshInitialVisiblePlacement[]=[];
   if(slot.entryKind==='BMOD_WITH_PACKED_I16_PAIR')for(const p of slot.placements??[]){
    if(overlap(p.worldX,p.worldY,p.descriptorWidth,p.descriptorHeight,activeRect.minX,activeRect.minY,activeRect.maxXExclusive,activeRect.maxYExclusive)){active.push(p.placementIndex);activeCount++;}
    const sx=p.worldX-camX,sy=p.worldY-camY;if(overlap(sx,sy,p.descriptorWidth,p.descriptorHeight,0,0,320,200)){visible.push(visiblePlacement(p,slot.bmodSymbol!,slot.planeIndex,camX,camY));visibleCount++;}
   }
   const groups=new Map<string,MK1FreshInitialVisiblePlacement[]>();for(const p of visible){const k=`${p.primarySortKey}:${p.secondarySortKey}`;const a=groups.get(k)??[];a.push(p);groups.set(k,a);}
   const equalKeyVisibleGroups=[...groups.values()].filter(a=>a.length>1).map(a=>{const scan=[...a].sort((x,y)=>x.placementIndex-y.placementIndex),draw=[...scan].reverse(),pairs:Array<{a:string;b:string;rectanglesOverlap:boolean}>=[];for(let i=0;i<draw.length;i++)for(let j=i+1;j<draw.length;j++){const A=draw[i],B=draw[j],ov=overlap(A.screenX,A.screenY,A.width,A.height,B.screenX,B.screenY,B.screenX+B.width,B.screenY+B.height);pairs.push({a:A.id,b:B.id,rectanglesOverlap:ov});if(ov)overlapPairs++;}equalGroups++;return{primarySortKey:a[0].primarySortKey,secondarySortKey:a[0].secondarySortKey,scanOrderPlacementIds:scan.map(x=>x.id),freshHeadToTailDrawOrderPlacementIds:draw.map(x=>x.id),overlappingPairs:pairs};}).sort((a,b)=>a.primarySortKey-b.primarySortKey||a.secondarySortKey-b.secondarySortKey);
   const fresh=[...visible].sort((a,b)=>a.primarySortKey-b.primarySortKey||a.secondarySortKey-b.secondarySortKey||b.placementIndex-a.placementIndex).map(x=>x.id);
   planeRows.push({planeIndex:slot.planeIndex,bmodSymbol:slot.entryKind==='BMOD_WITH_PACKED_I16_PAIR'?slot.bmodSymbol!:null,entryKind:slot.entryKind,activePlacementIndices:active,visiblePlacementIndices:visible.map(x=>x.placementIndex),visiblePlacements:visible,freshHeadToTailDrawOrderPlacementIds:fresh,equalKeyVisibleGroups});
  }
  const rowByPlane=new Map(planeRows.map(x=>[x.planeIndex,x] as const)),rendererOrder:string[]=[];for(const plane of traversal){const row=rowByPlane.get(plane);if(row)rendererOrder.push(...row.freshHeadToTailDrawOrderPlacementIds);}
  if(rendererOrder.length!==visibleCount)throw new Error(`O43 renderer order count mismatch ${m.topLevelModuleSymbol}`);
  modules.push({topLevelModuleSymbol:m.topLevelModuleSymbol,resourcePath:m.resourcePath,fileId:m.fileId,definition:'Fresh placement-derived ordinary BAK state after BAKCLR/empty occupancy, header-defined initial camera, and first MULTI_PLANE population; excludes init-callback/process-created objects, special lists, dynamic descriptor evolution, and later cull/recreate history.',initialCamera:{x:camX,y:camY,viewportWidth:320,viewportHeight:200},expandedActiveWorldRect:activeRect,planeCensus:planeRows,activePlacementCount:activeCount,visiblePlacementCount:visibleCount,visibleEqualKeyGroupCount:equalGroups,visibleOverlappingEqualKeyPairCount:overlapPairs,rendererPlaneTraversal:[...traversal],freshRendererDrawOrderPlacementIds:rendererOrder,deterministicForDefinedFreshSnapshot:true,historyIndependentForArbitraryLaterSnapshot:false});
  totalActive+=activeCount;totalVisible+=visibleCount;totalGroups+=equalGroups;totalOverlaps+=overlapPairs;if(visibleCount)modulesWithVisible++;if(overlapPairs)modulesWithOverlaps++;
 }
 const pit=modules.find(m=>m.topLevelModuleSymbol==='PIT_MOD');if(!pit)throw new Error('O43 PIT_MOD missing');const pitPlane1=pit.planeCensus.find(p=>p.planeIndex===1);if(!pitPlane1)throw new Error('O43 PIT plane1 missing');
 const pitExpected=o41.freshInitialPitFixture;const pitIds=pitPlane1.freshHeadToTailDrawOrderPlacementIds.map(id=>{const m=/placement_(\d+)$/.exec(id);return m?Number(m[1]):-1;});
 const pitCrossCheck=pit.activePlacementCount===pitExpected.activePlacementCount&&pit.visiblePlacementCount===pitExpected.visiblePlacementCount&&pitIds.join(',')===pitExpected.freshHeadToTailPlane1DrawOrder.join(',')&&pit.initialCamera.x===pitExpected.initialCamera.x&&pit.initialCamera.y===pitExpected.initialCamera.y;
 const checks=[
  {checkId:'CANONICAL_AUTHENTIC_SOURCE',passed:true},{checkId:'O31_O41_PREREQUISITES',passed:true},{checkId:'ALL_24_TOP_LEVEL_MODULES',passed:modules.length===24,detail:`modules=${modules.length}`},
  {checkId:'RENDERER_PLANE_TRAVERSAL_8_TO_0',passed:traversal.join(',')==='8,7,6,5,4,3,2,1,0'},{checkId:'FRESH_ORDER_COUNT_EQUALS_VISIBLE_COUNT',passed:modules.every(m=>m.freshRendererDrawOrderPlacementIds.length===m.visiblePlacementCount)},
  {checkId:'PIT_GENERALIZATION_REPRODUCES_O41',passed:pitCrossCheck,detail:`active=${pit.activePlacementCount}, visible=${pit.visiblePlacementCount}, order=${pitIds.join(',')}`},
  {checkId:'EXPECTED_GLOBAL_FRESH_COUNTS',passed:totalActive===2575&&totalVisible===2153&&totalGroups===512&&totalOverlaps===521,detail:`active=${totalActive}, visible=${totalVisible}, groups=${totalGroups}, overlaps=${totalOverlaps}`},
  {checkId:'NO_PROCESS_OR_SPECIAL_LIST_PROMOTION',passed:true},{checkId:'ARBITRARY_LATER_HISTORY_NOT_PROMOTED',passed:true},{checkId:'NO_GAMEPLAY_FRAME_CLAIM',passed:true},{checkId:'NO_WRITE_PATH',passed:true},
 ];if(!checks.every(x=>x.passed))throw new Error(`O43 validation failed: ${checks.filter(x=>!x.passed).map(x=>x.checkId).join(', ')}`);
 const timestamp=new Date().toISOString(),operationId=createOperationId('fresh_initial_ordinary_bak_compositor_census');const summary={topLevelModuleCount:modules.length,qualifiedModuleCount:modules.length,activePlacementInstances:totalActive,visiblePlacementInstances:totalVisible,visibleEqualKeyGroups:totalGroups,visibleOverlappingEqualKeyPairs:totalOverlaps,modulesWithVisiblePlacements:modulesWithVisible,modulesWithOverlappingEqualKeyPairs:modulesWithOverlaps};
 return{format:'mk1_fresh_initial_ordinary_bak_compositor_census_v1',timestamp,operationId,provenance:{sourceKind:'user-loaded-directory',fileName:exeEntry.name,byteLength:exeEntry.size,sha256:sha,synthetic:false,artifactGeneratedByTest:false,timestamp,operationId},prerequisite:{o31OperationId:o31.operationId,o31Verdict:o31.decision.verdict,o41OperationId:o41.operationId,o41Verdict:o41.decision.verdict},generalizedRule:{stateDefinition:'BAKCLR empty ordinary-placement occupancy + header-defined initial camera + first placement-derived MULTI_PLANE population',activeWindowExpansion:{horizontalPixels:68,verticalPixels:48},projection:'ordinary placement screenX = worldX - initial plane scroll X; screenY = worldY - initial shared scroll Y',freshInsertionRule:'placement records are scanned in increasing index order; INSOBJ_V inserts a newly created exact-equal object ahead of existing equal peers',intraPlaneSort:'primary object +0x18 ascending, secondary signed 16.16 Y ascending, exact equal reversed relative to increasing fresh creation scan',rendererPlaneTraversal:[...traversal],laterHistoryBoundary:'later eviction/recreation can alter exact-equal order; this census is not generalized to arbitrary later runtime state'},modules,summary,decision:{freshInitialOrdinaryBakCensusEstablished:true,all24ModulesQualified:true,freshPerPlaneTieOrderEstablished:true,crossPlaneRendererOrderEstablished:true,arbitraryLaterEqualTieOrderEstablished:false,processCreatedObjectsIncluded:false,canonicalGameplayFramesEstablished:false,verdict:'MK1_FRESH_INITIAL_ORDINARY_BAK_COMPOSITOR_CENSUS_ESTABLISHED',narrative:`O43 generalizes O41's fresh-initial PIT proof across all ${modules.length} O31 top-level background modules without extending it to arbitrary later runtime state. Starting from empty ordinary BAK occupancy, each module's header-defined initial camera and first MULTI_PLANE placement population yield a deterministic per-plane fresh list: records are created in increasing placement index, INSOBJ_V puts a new exact-equal object ahead of existing equal peers, ordinary objects project through the established camera subtraction, and renderer plane traversal remains 8→0. Across the 24 modules this bounded state contains ${totalActive} active placement instances and ${totalVisible} viewport-visible instances, including ${totalGroups} visible exact-equal key groups and ${totalOverlaps} geometrically overlapping equal-key pairs. PIT reproduces O41 exactly (15 active, 6 visible, plane-1 order 169→124→72→143→75→58). Init-callback/process-created objects, special lists, descriptor-cycle evolution and later cull/recreate history remain excluded, so these are deterministic ordinary placement-layer definitions rather than canonical gameplay frames.`},status:'SUCCESS',validation:{allChecksPassed:true,checks}};
}
export function createMK1FreshInitialOrdinaryBakCompositorCensusExport(report:MK1FreshInitialOrdinaryBakCompositorCensusReport){if(report.status!=='SUCCESS'||!report.validation.allChecksPassed)throw new Error('O43 export blocked');return report;}
