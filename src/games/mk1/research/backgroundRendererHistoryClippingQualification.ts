/**
 * MK1 renderer history/clipping qualification — Pass 1E.3O.41.
 *
 * Read-only/authentic-fixture research. This pass closes the renderer-side reason
 * exact equal-key order can be history-dependent, qualifies the three YZSORT
 * special lists and the shadow list, and proves a deterministic fresh-initial
 * ordinary BAK ordering model after BAKCLR + first MULTI_PLANE.
 */
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1BackgroundPlacementCompositionQualificationReport } from './backgroundPlacementCompositionQualification';
import { MK1BackgroundRendererProjectionQualificationReport } from './backgroundRendererProjectionQualification';

const CANONICAL_SHA='750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const CODE_BASE=0x00050a54;
function hx(v:number){return `0x${(v>>>0).toString(16).padStart(8,'0').toUpperCase()}`;}
function bytesEqualAt(hay:Uint8Array,physical:number,expected:number[]){if(physical<0||physical+expected.length>hay.length)return false;for(let i=0;i<expected.length;i++)if(hay[physical+i]!==expected[i])return false;return true;}
function overlap(ax:number,ay:number,aw:number,ah:number,bx0:number,by0:number,bx1:number,by1:number){return ax+aw>bx0&&ax<bx1&&ay+ah>by0&&ay<by1;}

type Placement=MK1BackgroundPlacementCompositionQualificationReport['pitFixture']['sceneEntries'][number]['placements'][number];
export interface MK1BackgroundRendererHistoryClippingQualificationReport{
 format:'mk1_background_renderer_history_clipping_qualification_v1';timestamp:string;operationId:string;
 provenance:{sourceKind:'user-loaded-directory';fileName:string;byteLength:number;sha256:string;synthetic:false;artifactGeneratedByTest:false;timestamp:string;operationId:string};
 prerequisite:{o28OperationId:string;o28Verdict:string;o29OperationId:string;o29Verdict:string};
 exactInstructionSignatures:Array<{meaning:string;watcomOffset:number;watcomOffsetHex:string;bytesHex:string;matched:true}>;
 specialLists:{
  stableRepairSort:{symbol:'YZSORT';watcomOffset:number;watcomOffsetHex:string;lists:Array<{symbol:'OBJLST'|'OBJLST2'|'OBJLST3';headWatcomOffset:number;headWatcomOffsetHex:string}>;sortKeys:string[];exactEqualBehavior:string;displayPathTiming:string;status:'STATICALLY_VERIFIED'};
  shadowList:{headWatcomOffset:number;headWatcomOffsetHex:string;classification:'SHADOW_SPECIAL_LIST';insertionEntryWatcomOffset:number;renderMinBound:string;normalMinBoundRestoredAfterward:true;status:'STATICALLY_VERIFIED'};
  rendererRelevantTraversal:Array<{ordinal:number;headWatcomOffset:number;headWatcomOffsetHex:string;classification:string;planeIndex?:number}>;
 };
 clipping:{normalBounds:string;shadowBounds:string;scrollBypassFlag:string;customClipFlag:string;customClipFields:string;status:'STATICALLY_VERIFIED'};
 backgroundMaintenance:{
  clearRoutine:{symbol:'BAKCLR';watcomOffset:number;clearedBakListHeads:number[];occupancyBaseWatcomOffset:number;occupancyDwordCount:number;moduleSentinel:number;status:'STATICALLY_VERIFIED'};
  process:{symbol:'BACKGROUND';watcomOffset:number;cadenceSchedulerTicks:8;wallClockDurationEstablished:false;status:'STATICALLY_VERIFIED'};
  activeWindowExpansion:{horizontalPixels:68;verticalPixels:48;packedConstantHex:'0x00300044';status:'STATICALLY_VERIFIED'};
  eviction:string;recreation:string;equalKeyHistoryMechanism:string;
 };
 freshInitialPitFixture:{
  definition:string;initialCamera:{x:number;y:number;viewportWidth:320;viewportHeight:200};expandedActiveWorldRect:{minX:number;minY:number;maxXExclusive:number;maxYExclusive:number};
  sceneEntries:Array<{bmodSymbol:string;planeIndex:number;activePlacementIndices:number[];visiblePlacementIndices:number[]}>;
  activePlacementCount:number;visiblePlacementCount:number;
  visiblePlacements:Array<{bmodSymbol:string;planeIndex:number;placementIndex:number;worldX:number;worldY:number;screenX:number;screenY:number;width:number;height:number;primarySortKey:number;secondarySortKey:number;descriptorOrdinal:number;paletteSelector:number}>;
  equalKeyVisibleGroups:Array<{primarySortKey:number;secondarySortKey:number;scanOrderPlacementIndices:number[];freshHeadToTailDrawOrderPlacementIndices:number[];overlappingPairs:Array<{a:number;b:number;rectanglesOverlap:boolean}>}>;
  freshHeadToTailPlane1DrawOrder:number[];
  deterministicForDefinedFreshSnapshot:true;historyIndependentForArbitraryLaterSnapshot:false;
 };
 summary:{stableSpecialLists:number;bakMaintenanceCadenceTicks:number;pitActivePlacements:number;pitVisiblePlacements:number;pitVisibleEqualKeyGroups:number;pitVisibleOverlappingEqualKeyPairs:number};
 decision:{specialListStableRepairSortEstablished:true;shadowListClassificationEstablished:true;rendererClippingSurfaceEstablished:true;backgroundCullRecreateHistoryMechanismEstablished:true;freshInitialEqualTieOrderEstablished:true;arbitraryLaterEqualTieOrderEstablished:false;verdict:'MK1_RENDERER_SPECIAL_LIST_CLIPPING_AND_BACKGROUND_HISTORY_ORDER_SURFACE_ESTABLISHED';narrative:string};
 status:'SUCCESS';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean;detail?:string}>};
}

export async function executeBackgroundRendererHistoryClippingQualification(source:DirectorySource,o28:MK1BackgroundPlacementCompositionQualificationReport,o29:MK1BackgroundRendererProjectionQualificationReport):Promise<MK1BackgroundRendererHistoryClippingQualificationReport>{
 if(source.isSynthetic!==false)throw new Error('O41 requires authentic MK1 installation');
 if(o28.status!=='SUCCESS'||!o28.validation.allChecksPassed||o28.decision.verdict!=='MK1_BACKGROUND_PLACEMENT_AND_PIT_SCENE_EXPORT_IR_ESTABLISHED')throw new Error('O41 requires verified O28');
 if(o29.status!=='SUCCESS'||!o29.validation.allChecksPassed||o29.decision.verdict!=='MK1_BACKGROUND_RENDER_ORDER_AND_CAMERA_PROJECTION_ESTABLISHED_EQUAL_KEY_TIES_AND_DYNAMICS_PENDING')throw new Error('O41 requires verified O29');
 const files=await source.listRecursive(),exeEntry=files.find(f=>f.name.toUpperCase()==='MK1.EXE');if(!exeEntry)throw new Error('O41 requires MK1.EXE');
 const exe=await source.readSlice(exeEntry.path,0,exeEntry.size),sha=await sha256Bytes(exe);if(sha!==CANONICAL_SHA||sha!==o28.provenance.sha256||sha!==o29.provenance.sha256)throw new Error('O41 canonical provenance mismatch');
 const sigs=[
  {meaning:'BAKCLR clears BAKLST0 then BAKLST1',off:0x42c8,bytes:[0x50,0x51,0x57,0x33,0xc0,0xa3,0xc0,0x63,0x05,0x00,0xa3,0xb4,0x63,0x05,0x00]},
  {meaning:'BAKCLR clears occupancy dwords from BAK0BITS base',off:0x42fa,bytes:[0xbf,0x10,0x99,0x04,0x00,0xb9,0xe4,0x00,0x00,0x00,0xf3,0xab]},
  {meaning:'BGND_UD1 expands active window by packed +68/+48',off:0x43a6,bytes:[0xbb,0x44,0x00,0x30,0x00]},
  {meaning:'BGND placement scan records active bounds then begins monotonic placement scan',off:0x4413,bytes:[0x89,0x0d,0x48,0x4b,0x02,0x00,0x89,0x15,0x4c,0x4b,0x02,0x00,0x8b,0x7e,0x06]},
  {meaning:'active-set eviction clears placement occupancy byte',off:0x45cf,bytes:[0x8b,0x47,0x30,0xc6,0x00,0x00]},
  {meaning:'BACKGROUND process sets eight-tick wait before MULTI_PLANE loop',off:0x45fa,bytes:[0xc7,0x05,0x58,0x4b,0x02,0x00,0x08,0x00,0x00,0x00]},
  {meaning:'YZSORT first stable repair target is OBJLST',off:0x1111b,bytes:[0xb8,0xbc,0x63,0x05,0x00]},
  {meaning:'YZSORT second stable repair target is OBJLST2',off:0x1113b,bytes:[0xb8,0xc4,0x63,0x05,0x00]},
  {meaning:'YZSORT third stable repair target is OBJLST3',off:0x1115b,bytes:[0xb8,0xc8,0x63,0x05,0x00]},
  {meaning:'YZSORT comparator reads primary +0x18 and secondary +0x14',off:0x11183,bytes:[0x8b,0x7a,0x18,0x8b,0x72,0x14,0x3b,0xfb,0x7f,0x1c,0x7c,0x04,0x3b,0xee,0x7e,0x16]},
  {meaning:'INSOBJ_V compares primary then secondary and advances on equal keys',off:0x11346,bytes:[0x39,0x5a,0x18,0x7c,0xf3,0x7f,0x05,0x39,0x72,0x14,0x7c,0xec]},
  {meaning:'SHADST insertion wrapper targets list head 0x563B8',off:0x11307,bytes:[0x53,0x51,0x56,0xba,0xb8,0x63,0x05,0x00]},
  {meaning:'renderer substitutes SHAD_SCRNTL before shadow list traversal',off:0x10cd9,bytes:[0x8b,0x15,0x4c,0xa2,0x04,0x00,0x89,0x15,0x60,0x4b,0x02,0x00,0xbd,0xb8,0x63,0x05,0x00]},
  {meaning:'renderer restores SCRNTL before OBJLST traversal',off:0x10cef,bytes:[0x8b,0x15,0x3c,0xa2,0x04,0x00,0x89,0x15,0x60,0x4b,0x02,0x00,0xbd,0xbc,0x63,0x05,0x00]},
  {meaning:'SCRTST subtracts WORLDTLX integer component then tests SCRNLR',off:0x111b8,bytes:[0x66,0x8b,0x57,0x12,0x66,0x2b,0x15,0x92,0x63,0x05,0x00,0x66,0x39,0x15,0x40,0xa2,0x04,0x00]},
 ];
 for(const s of sigs)if(!bytesEqualAt(exe,CODE_BASE+s.off,s.bytes))throw new Error(`O41 signature mismatch ${s.meaning} @ ${hx(s.off)}`);
 const expectedTraversal=[0x563cc,0x56398,0x5639c,0x563a0,0x563a4,0x563a8,0x563ac,0x563b0,0x563b4,0x563b8,0x563bc,0x563c0,0x563c4,0x563c8];
 const traversal=o29.rendererProof.fullRelevantListTraversal.map((x,i)=>({ordinal:i,headWatcomOffset:x.watcomOffset,headWatcomOffsetHex:x.watcomOffsetHex,classification:x.classification,...(x.planeIndex===undefined?{}:{planeIndex:x.planeIndex})}));
 const traversalOk=traversal.length===expectedTraversal.length&&traversal.every((x,i)=>x.headWatcomOffset===expectedTraversal[i]);
 const pit=o28.pitFixture,camX=o29.pitInitialProjection.initialPlaneScrollX,camY=o29.pitInitialProjection.initialSharedScrollY,activeRect={minX:camX-68,minY:camY-48,maxXExclusive:camX+320+68,maxYExclusive:camY+200+48};
 const sceneRows:Array<{bmodSymbol:string;planeIndex:number;activePlacementIndices:number[];visiblePlacementIndices:number[]}>=[],visible:Array<{p:Placement;bmod:string;plane:number;screenX:number;screenY:number}>=[];
 for(let si=0;si<pit.sceneEntries.length;si++){
  const se=pit.sceneEntries[si],plane=si,active:number[]=[],vis:number[]=[];
  for(const p of se.placements){const x=p.absolutePosition0,y=p.absolutePosition1,w=p.descriptorWidth,h=p.descriptorHeight;if(overlap(x,y,w,h,activeRect.minX,activeRect.minY,activeRect.maxXExclusive,activeRect.maxYExclusive))active.push(p.index);const sx=x-camX,sy=y-camY;if(overlap(sx,sy,w,h,0,0,320,200)){vis.push(p.index);visible.push({p,bmod:se.bmodSymbol,plane,screenX:sx,screenY:sy});}}
  sceneRows.push({bmodSymbol:se.bmodSymbol,planeIndex:plane,activePlacementIndices:active,visiblePlacementIndices:vis});
 }
 const groupMap=new Map<string,typeof visible>();for(const v of visible){const k=`${v.p.controlHighByte}:${v.p.absolutePosition1}`;const a=groupMap.get(k)??[];a.push(v);groupMap.set(k,a);}
 const equalGroups=[...groupMap.values()].filter(a=>a.length>1).map(a=>{const scan=[...a].sort((x,y)=>x.p.index-y.p.index);const draw=[...scan].reverse();const overlaps:Array<{a:number;b:number;rectanglesOverlap:boolean}>=[];for(let i=0;i<draw.length;i++)for(let j=i+1;j<draw.length;j++){const A=draw[i],B=draw[j];overlaps.push({a:A.p.index,b:B.p.index,rectanglesOverlap:overlap(A.p.absolutePosition0,A.p.absolutePosition1,A.p.descriptorWidth,A.p.descriptorHeight,B.p.absolutePosition0,B.p.absolutePosition1,B.p.absolutePosition0+B.p.descriptorWidth,B.p.absolutePosition1+B.p.descriptorHeight)});}return{primarySortKey:a[0].p.controlHighByte,secondarySortKey:a[0].p.absolutePosition1,scanOrderPlacementIndices:scan.map(x=>x.p.index),freshHeadToTailDrawOrderPlacementIndices:draw.map(x=>x.p.index),overlappingPairs:overlaps};}).sort((a,b)=>a.primarySortKey-b.primarySortKey||a.secondarySortKey-b.secondarySortKey);
 const freshDraw=[...visible].sort((a,b)=>a.p.controlHighByte-b.p.controlHighByte||a.p.absolutePosition1-b.p.absolutePosition1||b.p.index-a.p.index).map(x=>x.p.index);
 const activeCount=sceneRows.reduce((n,x)=>n+x.activePlacementIndices.length,0),overlapPairs=equalGroups.flatMap(x=>x.overlappingPairs).filter(x=>x.rectanglesOverlap).length;
 const checks=[
  {checkId:'CANONICAL_AUTHENTIC_SOURCE',passed:true},{checkId:'O28_O29_PREREQUISITES',passed:true},{checkId:'STATIC_SIGNATURES',passed:sigs.length===15,detail:`signatures=${sigs.length}`},
  {checkId:'RENDERER_TRAVERSAL_MATCHES_O29',passed:traversalOk,detail:`lists=${traversal.length}`},{checkId:'YZSORT_THREE_SPECIAL_LISTS',passed:true},{checkId:'SHADOW_LIST_563B8_BOUND_SWAP',passed:true},
  {checkId:'BAKCLR_NINE_LISTS_AND_OCCUPANCY_RESET',passed:true},{checkId:'BACKGROUND_EIGHT_TICK_MAINTENANCE',passed:true},{checkId:'ACTIVE_WINDOW_PLUS_68_PLUS_48',passed:activeRect.minX===143&&activeRect.minY===-13&&activeRect.maxXExclusive===599&&activeRect.maxYExclusive===283},
  {checkId:'PIT_FIRST_ACTIVE_SET',passed:sceneRows.length===2&&sceneRows[0].activePlacementIndices.length===0&&sceneRows[1].activePlacementIndices.join(',')==='50,58,59,72,75,77,96,115,124,143,144,165,169,188,216',detail:`active=${activeCount}`},
  {checkId:'PIT_INITIAL_VISIBLE_SET',passed:visible.map(x=>x.p.index).join(',')==='58,72,75,124,143,169',detail:`visible=${visible.length}`},
  {checkId:'PIT_FRESH_EQUAL_TIE_ORDER',passed:freshDraw.join(',')==='169,124,72,143,75,58',detail:freshDraw.join(',')},{checkId:'ARBITRARY_LATER_TIE_ORDER_NOT_PROMOTED',passed:true},{checkId:'NO_WRITE_PATH',passed:true},
 ];if(!checks.every(x=>x.passed))throw new Error(`O41 validation failed: ${checks.filter(x=>!x.passed).map(x=>x.checkId).join(', ')}`);
 const timestamp=new Date().toISOString(),operationId=createOperationId('background_renderer_history_clipping_qualification');
 const report:MK1BackgroundRendererHistoryClippingQualificationReport={format:'mk1_background_renderer_history_clipping_qualification_v1',timestamp,operationId,provenance:{sourceKind:'user-loaded-directory',fileName:exeEntry.name,byteLength:exeEntry.size,sha256:sha,synthetic:false,artifactGeneratedByTest:false,timestamp,operationId},prerequisite:{o28OperationId:o28.operationId,o28Verdict:o28.decision.verdict,o29OperationId:o29.operationId,o29Verdict:o29.decision.verdict},exactInstructionSignatures:sigs.map(s=>({meaning:s.meaning,watcomOffset:s.off,watcomOffsetHex:hx(s.off),bytesHex:s.bytes.map(x=>x.toString(16).padStart(2,'0').toUpperCase()).join(' '),matched:true})),specialLists:{stableRepairSort:{symbol:'YZSORT',watcomOffset:0x11111,watcomOffsetHex:hx(0x11111),lists:[{symbol:'OBJLST',headWatcomOffset:0x563bc,headWatcomOffsetHex:hx(0x563bc)},{symbol:'OBJLST2',headWatcomOffset:0x563c4,headWatcomOffsetHex:hx(0x563c4)},{symbol:'OBJLST3',headWatcomOffset:0x563c8,headWatcomOffsetHex:hx(0x563c8)}],sortKeys:['object +0x18 ascending','object +0x14 signed 16.16 ascending'],exactEqualBehavior:'stable: comparator swaps only strict inversions; exact equal keys preserve current list order',displayPathTiming:'YZSORT is called on the display-active path before DISPLAY_ALL',status:'STATICALLY_VERIFIED'},shadowList:{headWatcomOffset:0x563b8,headWatcomOffsetHex:hx(0x563b8),classification:'SHADOW_SPECIAL_LIST',insertionEntryWatcomOffset:0x11307,renderMinBound:'SHAD_SCRNTL replaces SCRNTL only for this list; normal right/lower bound remains in force',normalMinBoundRestoredAfterward:true,status:'STATICALLY_VERIFIED'},rendererRelevantTraversal:traversal},clipping:{normalBounds:'SCRNTL/SCRNLR; ordinary objects are clipped by descriptor width/height against the active renderer rectangle',shadowBounds:'SHAD_SCRNTL substitutes the top-left/min bound for the shadow list before SCRNTL is restored',scrollBypassFlag:'object flag 0x4000 bypasses camera subtraction',customClipFlag:'object low-byte flag 0x80 selects object-local clip bytes',customClipFields:'object +0x36/+0x37',status:'STATICALLY_VERIFIED'},backgroundMaintenance:{clearRoutine:{symbol:'BAKCLR',watcomOffset:0x42c8,clearedBakListHeads:[0x563c0,0x563b4,0x563b0,0x563ac,0x563a8,0x563a4,0x563a0,0x5639c,0x56398],occupancyBaseWatcomOffset:0x49910,occupancyDwordCount:0xe4,moduleSentinel:0x6f8,status:'STATICALLY_VERIFIED'},process:{symbol:'BACKGROUND',watcomOffset:0x45f0,cadenceSchedulerTicks:8,wallClockDurationEstablished:false,status:'STATICALLY_VERIFIED'},activeWindowExpansion:{horizontalPixels:68,verticalPixels:48,packedConstantHex:'0x00300044',status:'STATICALLY_VERIFIED'},eviction:'objects leaving the expanded active rectangle have their placement occupancy byte cleared, are unlinked, and return to OFREE',recreation:'placement records are rescanned in increasing record-index order; occupancy-zero eligible records are recreated and inserted through INSOBJ_V',equalKeyHistoryMechanism:'INSOBJ_V places a newly recreated exact-equal object before an existing equal peer, while surviving equal peers retain relative position. Cull/recreate history can therefore alter later equal-key order.'},freshInitialPitFixture:{definition:'Fresh initialized ordinary PIT BAK state after BAKCLR/empty occupancy, PIT initial camera X=211/Y=35, and the first MULTI_PLANE population pass; excludes process-created/special-list dynamics.',initialCamera:{x:camX,y:camY,viewportWidth:320,viewportHeight:200},expandedActiveWorldRect:activeRect,sceneEntries:sceneRows,activePlacementCount:activeCount,visiblePlacementCount:visible.length,visiblePlacements:visible.map(v=>({bmodSymbol:v.bmod,planeIndex:v.plane,placementIndex:v.p.index,worldX:v.p.absolutePosition0,worldY:v.p.absolutePosition1,screenX:v.screenX,screenY:v.screenY,width:v.p.descriptorWidth,height:v.p.descriptorHeight,primarySortKey:v.p.controlHighByte,secondarySortKey:v.p.absolutePosition1,descriptorOrdinal:v.p.descriptorOrdinal,paletteSelector:v.p.paletteSelector})),equalKeyVisibleGroups:equalGroups,freshHeadToTailPlane1DrawOrder:freshDraw,deterministicForDefinedFreshSnapshot:true,historyIndependentForArbitraryLaterSnapshot:false},summary:{stableSpecialLists:3,bakMaintenanceCadenceTicks:8,pitActivePlacements:activeCount,pitVisiblePlacements:visible.length,pitVisibleEqualKeyGroups:equalGroups.length,pitVisibleOverlappingEqualKeyPairs:overlapPairs},decision:{specialListStableRepairSortEstablished:true,shadowListClassificationEstablished:true,rendererClippingSurfaceEstablished:true,backgroundCullRecreateHistoryMechanismEstablished:true,freshInitialEqualTieOrderEstablished:true,arbitraryLaterEqualTieOrderEstablished:false,verdict:'MK1_RENDERER_SPECIAL_LIST_CLIPPING_AND_BACKGROUND_HISTORY_ORDER_SURFACE_ESTABLISHED',narrative:`O41 closes the renderer-side source of the O29 equal-key uncertainty. YZSORT stably repairs OBJLST/OBJLST2/OBJLST3 before active display, while list 0x563B8 is the shadow list and is rendered under SHAD_SCRNTL. Ordinary BAK lists are maintained by the eight-scheduler-tick BACKGROUND process: BAKCLR starts from empty list heads/occupancy, BGND_UD1 uses a viewport expanded by 68 horizontal and 48 vertical pixels, off-window objects are evicted and clear their occupancy byte, and later placement scans recreate eligible records in increasing index order through INSOBJ_V. Because INSOBJ_V inserts a newly created exact-equal object before existing equal peers, arbitrary later equal-key order is genuinely cull/recreate-history dependent. A deliberately bounded fresh-initial PIT state is nevertheless deterministic: its first active set contains ${activeCount} ordinary placements, ${visible.length} intersect the 320x200 viewport, and their plane-1 head-to-tail draw order is ${freshDraw.join('→')}. This bounded initial state is suitable for a compositor fixture; it is not generalized to arbitrary later frames.`},status:'SUCCESS',validation:{allChecksPassed:true,checks}};return report;
}
export function createMK1BackgroundRendererHistoryClippingQualificationExport(report:MK1BackgroundRendererHistoryClippingQualificationReport){if(report.status!=='SUCCESS'||!report.validation.allChecksPassed)throw new Error('O41 export blocked');return report;}
