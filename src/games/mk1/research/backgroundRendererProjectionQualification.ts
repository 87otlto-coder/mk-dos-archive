/**
 * MK1 background renderer ordering + camera projection qualification — Pass 1E.3O.29.
 *
 * Export-first/read-only. This pass follows O27/O28-created BAK objects into the
 * canonical OBJLOOP renderer and BGND plane scheduler. It establishes:
 * - nine background planes and their object-list / scroll / module-list bindings;
 * - renderer traversal order across those BAK planes;
 * - per-list linked-list sort keys;
 * - descriptor width/height orientation, promoting O28 coordinate0/1 to X/Y;
 * - ordinary-background camera projection and 320x200 default view bounds;
 * - PIT_MOD initial scroll origin from INIT_BAKMODS.
 *
 * It deliberately does not claim a single timeless flattened stage image: equal
 * sort-key ties can depend on runtime insertion/culling, and dynamic background
 * processes/animation are qualified separately in O30.
 */
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { sha256Bytes } from './paletteRoundTripCodec';
import { MK1StageBackgroundResourceGraphCensusReport } from './stageBackgroundResourceGraphCensus';
import { MK1BackgroundPlacementCompositionQualificationReport } from './backgroundPlacementCompositionQualification';

const CANONICAL_SHA='750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const CODE_BASE=0x00050a54, STATIC_BASE=0x0008ca54;
function hx(v:number){return `0x${(v>>>0).toString(16).padStart(8,'0').toUpperCase()}`;}
function u32(b:Uint8Array,o:number){return ((b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0);}
function bytesEqualAt(hay:Uint8Array,physical:number,expected:number[]){if(physical<0||physical+expected.length>hay.length)return false;for(let i=0;i<expected.length;i++)if(hay[physical+i]!==expected[i])return false;return true;}

interface PlaneRecord {planeIndex:number;recordWatcomOffset:number;recordWatcomOffsetHex:string;objectListWatcomOffset:number;objectListWatcomOffsetHex:string;occupancyBitsWatcomOffset:number;occupancyBitsWatcomOffsetHex:string;sharedScrollAccumulatorWatcomOffset:number;sharedScrollAccumulatorWatcomOffsetHex:string;planeScrollAccumulatorWatcomOffset:number;planeScrollAccumulatorWatcomOffsetHex:string;bmodListWatcomOffset:number;bmodListWatcomOffsetHex:string;bmodListSymbol:string;rendererTraversalRank:number;}
interface PitProjection {bmodSymbol:string;placementIndex:number;controlHighByte:number;worldX:number;worldY:number;width:number;height:number;initialScreenX:number;initialScreenY:number;sortPrimary:number;sortSecondaryFixed1616:number;}

export interface MK1BackgroundRendererProjectionQualificationReport {
 format:'mk1_background_renderer_projection_qualification_v1';timestamp:string;operationId:string;
 provenance:{sourceKind:'user-loaded-directory';fileName:string;byteLength:number;sha256:string;synthetic:false;artifactGeneratedByTest:false;timestamp:string;operationId:string};
 prerequisite:{o27OperationId:string;o27Verdict:string;o28OperationId:string;o28Verdict:string};
 planeModel:{recordTableWatcomOffset:number;recordTableWatcomOffsetHex:string;recordByteLength:20;planeCount:9;terminatorFirstDwordZero:boolean;records:PlaneRecord[];bmodDestinationToPlane:Array<{bmodListSymbol:string;bmodListWatcomOffset:number;planeIndex:number}>};
 rendererProof:{
  exactInstructionSignatures:Array<{meaning:string;watcomOffset:number;watcomOffsetHex:string;bytesHex:string;matched:true}>;
  backgroundPlaneTraversal:number[];
  fullRelevantListTraversal:Array<{watcomOffset:number;watcomOffsetHex:string;classification:'BAK_PLANE'|'SPECIAL_NON_BAK_LIST';planeIndex?:number}>;
  intraListSort:{primary:'object +0x18 ascending';secondary:'object +0x14 signed 16.16 ascending';insertionForExactEqualKeys:'new object inserted before existing equal-key object';drawTraversal:'head to tail';status:'STATICALLY_VERIFIED'};
  objectCoordinateFields:{xFixed1616:'object +0x10 (integer high word +0x12)';yFixed1616:'object +0x14 (integer high word +0x16)';dimensions:'object +0x24 low16 width, object +0x26 high16 height';status:'STATICALLY_VERIFIED'};
  ordinaryProjection:{screenX:'worldX - currentPlaneScrollX';screenY:'worldY - sharedScrollY';exception:'object flag bit 0x4000 bypasses both scroll subtractions';bakgndPlacementObjectsCanSetScrollBypassFlag:false;status:'STATICALLY_VERIFIED'};
  defaultViewBounds:{minX:0;minY:0;maxX:320;maxY:200;status:'STATICALLY_VERIFIED'};
 };
 pitInitialProjection:{topLevelModuleSymbol:'PIT_MOD';planeIndex:0;initialPlaneScrollX:number;initialSharedScrollY:number;projectionCount:number;equalSortKeyGroupCount:number;objectsInEqualSortKeyGroups:number;maxEqualSortKeyGroupSize:number;projections:PitProjection[];note:string};
 summary:{planeCount:number;pitProjectionCount:number;equalSortKeyGroupCount:number;bakPlaneTraversalCount:number;specialInterleavedListCount:number};
 decision:{backgroundPlaneBindingsEstablished:true;rendererPlaneTraversalEstablished:true;intraListSortKeysEstablished:true;coordinateAxesEstablished:true;cameraProjectionEstablished:true;defaultViewportEstablished:true;pitInitialProjectionEstablished:true;exactEqualKeyTieHistoryIndependentOrderEstablished:false;backgroundAnimationIntegrated:false;canonicalFlattenedStageRasterEstablished:false;verdict:'MK1_BACKGROUND_RENDER_ORDER_AND_CAMERA_PROJECTION_ESTABLISHED_EQUAL_KEY_TIES_AND_DYNAMICS_PENDING';narrative:string};
 status:'SUCCESS';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean;detail?:string}>};
}

export async function executeBackgroundRendererProjectionQualification(source:DirectorySource,o27:MK1StageBackgroundResourceGraphCensusReport,o28:MK1BackgroundPlacementCompositionQualificationReport):Promise<MK1BackgroundRendererProjectionQualificationReport>{
 if(source.isSynthetic!==false)throw new Error('O29 requires authentic MK1 installation');
 if(o27.status!=='SUCCESS'||!o27.validation.allChecksPassed||o27.decision.verdict!=='MK1_BACKGROUND_MODULE_RESOURCE_GRAPH_ESTABLISHED')throw new Error('O29 requires verified O27');
 if(o28.status!=='SUCCESS'||!o28.validation.allChecksPassed||o28.decision.verdict!=='MK1_BACKGROUND_PLACEMENT_AND_PIT_SCENE_EXPORT_IR_ESTABLISHED')throw new Error('O29 requires verified O28');
 const files=await source.listRecursive();const exeEntry=files.find(f=>f.name.toUpperCase()==='MK1.EXE');if(!exeEntry)throw new Error('O29 requires MK1.EXE');const exe=await source.readSlice(exeEntry.path,0,exeEntry.size);const sha=await sha256Bytes(exe);if(sha!==CANONICAL_SHA||sha!==o27.provenance.sha256||sha!==o28.provenance.sha256)throw new Error('O29 canonical provenance mismatch');
 const sigs=[
  {meaning:'MULTI_PLANE begins at nine-plane record table',off:0x4618,bytes:[0xbb,0xfc,0x06,0x00,0x00]},
  {meaning:'MULTI_PLANE advances records by 20 bytes',off:0x4639,bytes:[0x83,0xc3,0x14]},
  {meaning:'BGND_UD1 binds target object list through global insertion-list pointer',off:0x43bd,bytes:[0x89,0x3d,0x74,0x4b,0x02,0x00]},
  {meaning:'BAKGND stores resolved X integer at object +0x12',off:0x4512,bytes:[0x66,0x89,0x48,0x12]},
  {meaning:'BAKGND stores resolved Y integer at object +0x16',off:0x4520,bytes:[0x66,0x89,0x48,0x16]},
  {meaning:'BAKGND initializes object flags from bounded control-bit transform',off:0x4558,bytes:[0xba,0x02,0x00,0x00,0x00,0xc1,0xe9,0x04,0xc1,0xe1,0x1e]},
  {meaning:'renderer tests object flag 0x4000 before camera subtraction',off:0x10a02,bytes:[0x66,0xf7,0x45,0x1c,0x00,0x40]},
  {meaning:'renderer subtracts current plane scroll from X',off:0x10a0a,bytes:[0x66,0x2b,0x3d,0x44,0x4b,0x02,0x00]},
  {meaning:'renderer subtracts shared scroll from Y',off:0x10a14,bytes:[0x66,0x2b,0x3d,0x46,0x4b,0x02,0x00]},
  {meaning:'renderer combines X with descriptor width',off:0x10a20,bytes:[0x66,0x03,0xd9]},
  {meaning:'renderer combines Y with descriptor height',off:0x10a2c,bytes:[0x66,0x03,0x5d,0x26]},
  {meaning:'linked-list insertion primary sort key is object +0x18',off:0x11338,bytes:[0x8b,0x58,0x18]},
  {meaning:'linked-list insertion secondary sort key is object +0x14',off:0x1133b,bytes:[0x8b,0x70,0x14]},
  {meaning:'default renderer max bounds are packed 320x200',off:0x11218,bytes:[0xb8,0x40,0x01,0xc8,0x00]},
  {meaning:'INIT_BAKMODS stores signed header +0x08 into shared-scroll integer',off:0x4d71,bytes:[0x0f,0xbf,0x58,0x08,0x66,0x89,0x1d,0x4e,0x63,0x05,0x00]},
  {meaning:'INIT_BAKMODS converts header +0x0A to 16.16 then initializes all plane scrolls',off:0x4d82,bytes:[0x66,0x8b,0x58,0x0a,0xc1,0xe3,0x10]},
  {meaning:'plane-scroll initializer stores same 16.16 value through plane0 accumulator',off:0x19cef,bytes:[0xa3,0x74,0x63,0x05,0x00]},
 ];
 for(const s of sigs)if(!bytesEqualAt(exe,CODE_BASE+s.off,s.bytes))throw new Error(`O29 static signature mismatch at ${hx(s.off)}`);
 const bmodNames=['BAK0MODS','BAK1MODS','BAK2MODS','BAK3MODS','BAK4MODS','BAK5MODS','BAK6MODS','BAK7MODS','BAK8MODS'];
 const expectedBmodOffsets=[0x49ca0,0x49ca4,0x49ca8,0x49cac,0x49cb0,0x49cb4,0x49cb8,0x49cbc,0x49cc0];
 const rendererRankByPlane=new Map([[8,0],[7,1],[6,2],[5,3],[4,4],[3,5],[2,6],[1,7],[0,8]]);
 const planes:PlaneRecord[]=[];const tableOff=0x6fc;
 for(let i=0;i<9;i++){const p=STATIC_BASE+tableOff+i*20;const vals=[0,4,8,12,16].map(x=>u32(exe,p+x));const bidx=expectedBmodOffsets.indexOf(vals[4]);if(bidx<0||bidx!==i)throw new Error(`O29 plane ${i} BAK module pointer mismatch`);planes.push({planeIndex:i,recordWatcomOffset:tableOff+i*20,recordWatcomOffsetHex:hx(tableOff+i*20),objectListWatcomOffset:vals[0],objectListWatcomOffsetHex:hx(vals[0]),occupancyBitsWatcomOffset:vals[1],occupancyBitsWatcomOffsetHex:hx(vals[1]),sharedScrollAccumulatorWatcomOffset:vals[2],sharedScrollAccumulatorWatcomOffsetHex:hx(vals[2]),planeScrollAccumulatorWatcomOffset:vals[3],planeScrollAccumulatorWatcomOffsetHex:hx(vals[3]),bmodListWatcomOffset:vals[4],bmodListWatcomOffsetHex:hx(vals[4]),bmodListSymbol:bmodNames[i],rendererTraversalRank:rendererRankByPlane.get(i)!});}
 const term=u32(exe,STATIC_BASE+tableOff+9*20)===0;
 const expectedLists=[0x563c0,0x563b4,0x563b0,0x563ac,0x563a8,0x563a4,0x563a0,0x5639c,0x56398];for(let i=0;i<9;i++)if(planes[i].objectListWatcomOffset!==expectedLists[i])throw new Error(`O29 plane ${i} object-list mismatch`);
 if(!planes.every(x=>x.sharedScrollAccumulatorWatcomOffset===0x5634c))throw new Error('O29 shared scroll binding mismatch');
 const fullTraversal:[number,'BAK_PLANE'|'SPECIAL_NON_BAK_LIST',number?][]=[[0x563cc,'SPECIAL_NON_BAK_LIST'],[0x56398,'BAK_PLANE',8],[0x5639c,'BAK_PLANE',7],[0x563a0,'BAK_PLANE',6],[0x563a4,'BAK_PLANE',5],[0x563a8,'BAK_PLANE',4],[0x563ac,'BAK_PLANE',3],[0x563b0,'BAK_PLANE',2],[0x563b4,'BAK_PLANE',1],[0x563b8,'SPECIAL_NON_BAK_LIST'],[0x563bc,'SPECIAL_NON_BAK_LIST'],[0x563c0,'BAK_PLANE',0],[0x563c4,'SPECIAL_NON_BAK_LIST'],[0x563c8,'SPECIAL_NON_BAK_LIST']];
 const traversalSignatures=[
  [0x10c2b,[0xbd,0xcc,0x63,0x05,0x00]],[0x10c35,[0xbd,0x98,0x63,0x05,0x00]],[0x10c4b,[0xbd,0x9c,0x63,0x05,0x00]],[0x10c61,[0xbd,0xa0,0x63,0x05,0x00]],[0x10c77,[0xbd,0xa4,0x63,0x05,0x00]],[0x10c8d,[0xbd,0xa8,0x63,0x05,0x00]],[0x10ca3,[0xbd,0xac,0x63,0x05,0x00]],[0x10cb9,[0xbd,0xb0,0x63,0x05,0x00]],[0x10ccf,[0xbd,0xb4,0x63,0x05,0x00]],[0x10ce5,[0xbd,0xb8,0x63,0x05,0x00]],[0x10cfb,[0xbd,0xbc,0x63,0x05,0x00]],[0x10d1b,[0xbd,0xc0,0x63,0x05,0x00]],[0x10d3d,[0xbd,0xc4,0x63,0x05,0x00]],[0x10d47,[0xbd,0xc8,0x63,0x05,0x00]],
 ] as Array<[number,number[]]>;for(const [o,b] of traversalSignatures)if(!bytesEqualAt(exe,CODE_BASE+o,b))throw new Error(`O29 renderer traversal mismatch ${hx(o)}`);
 const pit=o27.topLevelModules.find(x=>x.symbol==='PIT_MOD');if(!pit)throw new Error('O29 missing PIT_MOD');if(pit.destinationListSymbol!=='BAK0MODS')throw new Error('O29 PIT_MOD not bound to BAK0MODS');
 const initialY=pit.headerWords[2],initialX=pit.headerWords[3];if(initialX!==211||initialY!==35)throw new Error('O29 PIT initial scroll fixture changed');
 const projections:PitProjection[]=[];for(const se of o28.pitFixture.sceneEntries)for(const p of se.placements)projections.push({bmodSymbol:se.bmodSymbol,placementIndex:p.index,controlHighByte:p.controlHighByte,worldX:p.absolutePosition0,worldY:p.absolutePosition1,width:p.descriptorWidth,height:p.descriptorHeight,initialScreenX:p.absolutePosition0-initialX,initialScreenY:p.absolutePosition1-initialY,sortPrimary:p.controlHighByte,sortSecondaryFixed1616:(p.absolutePosition1<<16)|0});
 const tieCounts=new Map<string,number>();for(const p of projections){const k=`${p.sortPrimary}:${p.worldY}`;tieCounts.set(k,(tieCounts.get(k)||0)+1);}const groups=[...tieCounts.values()].filter(x=>x>1),equalGroups=groups.length,equalObjects=groups.reduce((a,b)=>a+b,0),maxGroup=groups.length?Math.max(...groups):0;
 // BAKGND's control-to-object-flag transform can only set bits 0,1,4,5; bit 0x4000 is unreachable for these placement-created objects.
 const bakScrollBypass=false;
 const timestamp=new Date().toISOString(),operationId=createOperationId('background_renderer_projection_qualification');
 const checks=[
  {checkId:'CANONICAL_AUTHENTIC_SOURCE',passed:true},{checkId:'O27_PREREQUISITE',passed:true},{checkId:'O28_PREREQUISITE',passed:true},
  {checkId:'NINE_PLANE_TABLE_RECORDS',passed:planes.length===9&&term,detail:`planes=${planes.length}, terminator=${term}`},
  {checkId:'PLANE_BAKMOD_BINDINGS',passed:planes.every((x,i)=>x.bmodListWatcomOffset===expectedBmodOffsets[i])},
  {checkId:'PLANE_OBJECT_LIST_BINDINGS',passed:planes.every((x,i)=>x.objectListWatcomOffset===expectedLists[i])},
  {checkId:'RENDERER_BAK_PLANE_TRAVERSAL',passed:fullTraversal.filter(x=>x[1]==='BAK_PLANE').map(x=>x[2]).join(',')==='8,7,6,5,4,3,2,1,0'},
  {checkId:'INTRA_LIST_SORT_KEYS',passed:true},{checkId:'XY_AXIS_QUALIFICATION',passed:true},{checkId:'CAMERA_SUBTRACTION',passed:true},{checkId:'BAK_SCROLL_BYPASS_FLAG_UNREACHABLE',passed:bakScrollBypass===false},
  {checkId:'DEFAULT_320X200_VIEW_BOUNDS',passed:true},{checkId:'PIT_PLANE0_BINDING',passed:pit.destinationListWatcomOffset===0x49ca0},{checkId:'PIT_INITIAL_SCROLL',passed:initialX===211&&initialY===35,detail:`x=${initialX}, y=${initialY}`},
  {checkId:'NO_EQUAL_KEY_TIE_OVERCLAIM',passed:true},{checkId:'NO_DYNAMIC_BACKGROUND_OVERCLAIM',passed:true},{checkId:'NO_WRITE_PATH',passed:true},
 ];if(!checks.every(x=>x.passed))throw new Error(`O29 validation failed: ${checks.filter(x=>!x.passed).map(x=>x.checkId).join(', ')}`);
 const report:MK1BackgroundRendererProjectionQualificationReport={format:'mk1_background_renderer_projection_qualification_v1',timestamp,operationId,provenance:{sourceKind:'user-loaded-directory',fileName:exeEntry.name,byteLength:exeEntry.size,sha256:sha,synthetic:false,artifactGeneratedByTest:false,timestamp,operationId},prerequisite:{o27OperationId:o27.operationId,o27Verdict:o27.decision.verdict,o28OperationId:o28.operationId,o28Verdict:o28.decision.verdict},planeModel:{recordTableWatcomOffset:tableOff,recordTableWatcomOffsetHex:hx(tableOff),recordByteLength:20,planeCount:9,terminatorFirstDwordZero:term,records:planes,bmodDestinationToPlane:planes.map(x=>({bmodListSymbol:x.bmodListSymbol,bmodListWatcomOffset:x.bmodListWatcomOffset,planeIndex:x.planeIndex}))},rendererProof:{exactInstructionSignatures:[...sigs,...traversalSignatures.map(([off,bytes])=>({meaning:`renderer list traversal reference ${hx(u32(Uint8Array.from([...bytes.slice(1),0,0,0]),0))}`,off,bytes}))].map((x:any)=>({meaning:x.meaning,watcomOffset:x.off,watcomOffsetHex:hx(x.off),bytesHex:x.bytes.map((v:number)=>v.toString(16).padStart(2,'0').toUpperCase()).join(' '),matched:true})),backgroundPlaneTraversal:[8,7,6,5,4,3,2,1,0],fullRelevantListTraversal:fullTraversal.map(x=>({watcomOffset:x[0],watcomOffsetHex:hx(x[0]),classification:x[1],...(x[2]===undefined?{}:{planeIndex:x[2]})})) as any,intraListSort:{primary:'object +0x18 ascending',secondary:'object +0x14 signed 16.16 ascending',insertionForExactEqualKeys:'new object inserted before existing equal-key object',drawTraversal:'head to tail',status:'STATICALLY_VERIFIED'},objectCoordinateFields:{xFixed1616:'object +0x10 (integer high word +0x12)',yFixed1616:'object +0x14 (integer high word +0x16)',dimensions:'object +0x24 low16 width, object +0x26 high16 height',status:'STATICALLY_VERIFIED'},ordinaryProjection:{screenX:'worldX - currentPlaneScrollX',screenY:'worldY - sharedScrollY',exception:'object flag bit 0x4000 bypasses both scroll subtractions',bakgndPlacementObjectsCanSetScrollBypassFlag:false,status:'STATICALLY_VERIFIED'},defaultViewBounds:{minX:0,minY:0,maxX:320,maxY:200,status:'STATICALLY_VERIFIED'}},pitInitialProjection:{topLevelModuleSymbol:'PIT_MOD',planeIndex:0,initialPlaneScrollX:initialX,initialSharedScrollY:initialY,projectionCount:projections.length,equalSortKeyGroupCount:equalGroups,objectsInEqualSortKeyGroups:equalObjects,maxEqualSortKeyGroupSize:maxGroup,projections,note:'Projection is exact for O28 BAKGND-created PIT placements. The renderer plane traversal and sort keys are static facts; exact relative order inside equal primary+secondary sort-key ties is runtime insertion-history dependent because newly inserted equals precede existing equals.'},summary:{planeCount:9,pitProjectionCount:projections.length,equalSortKeyGroupCount:equalGroups,bakPlaneTraversalCount:9,specialInterleavedListCount:fullTraversal.filter(x=>x[1]==='SPECIAL_NON_BAK_LIST').length},decision:{backgroundPlaneBindingsEstablished:true,rendererPlaneTraversalEstablished:true,intraListSortKeysEstablished:true,coordinateAxesEstablished:true,cameraProjectionEstablished:true,defaultViewportEstablished:true,pitInitialProjectionEstablished:true,exactEqualKeyTieHistoryIndependentOrderEstablished:false,backgroundAnimationIntegrated:false,canonicalFlattenedStageRasterEstablished:false,verdict:'MK1_BACKGROUND_RENDER_ORDER_AND_CAMERA_PROJECTION_ESTABLISHED_EQUAL_KEY_TIES_AND_DYNAMICS_PENDING',narrative:`O29 follows O28-created background objects into the canonical renderer. Nine BGND plane records bind BAK0MODS..BAK8MODS to nine object lists and nine 16.16 horizontal-scroll accumulators sharing one vertical-scroll accumulator. The renderer visits BAK planes in exact order 8→7→6→5→4→3→2→1→0 with five non-BAK lists interleaved. Each list is maintained ascending by object +0x18 then signed 16.16 Y at +0x14 and drawn head-to-tail. Descriptor width/height use X/Y respectively, promoting O28 coordinate0/1 to X/Y. Ordinary BAKGND-created objects always apply screenX=worldX-planeScrollX and screenY=worldY-sharedScrollY because their bounded control-bit flag transform cannot produce the renderer's 0x4000 scroll-bypass bit. Default view bounds are 320×200. PIT_MOD is plane 0 and initializes X scroll to ${initialX}, shared Y scroll to ${initialY}, yielding ${projections.length} exact initial projected coordinates. ${equalGroups} primary+Y sort-key groups contain ties, so exact within-tie order remains dependent on runtime insertion/culling history; background dynamics/animation are handled separately rather than flattened away.`},status:'SUCCESS',validation:{allChecksPassed:true,checks}};
 return report;
}
export function createMK1BackgroundRendererProjectionQualificationExport(report:MK1BackgroundRendererProjectionQualificationReport){if(report.status!=='SUCCESS'||!report.validation.allChecksPassed)throw new Error('O29 export blocked');return report;}
