/**
 * MK1 bounded ARENA animated-scene export fixture — Pass 1E.3O.32.
 *
 * Uses O31's exact plane/placement binding plus O30's six-state ARENA updater
 * to export deterministic correct-colour RGBA state sprites and a time-aware
 * instance manifest. It deliberately does not flatten the two target planes:
 * each plane contains exact-equal sort-key groups whose runtime order can change
 * with insertion/culling history, and the sprites overlap horizontally.
 */
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { sha256Bytes } from './paletteRoundTripCodec';
import { decodeUgraSprite } from '../graphics/ugraDecoder';
import { MK1StageBackgroundResourceGraphCensusReport } from './stageBackgroundResourceGraphCensus';
import { MK1BackgroundDynamicProcessAnimationCensusReport } from './backgroundDynamicProcessAnimationCensus';
import { MK1BackgroundTimeAwareSceneIrReport, MK1BackgroundScenePlacementInstance } from './backgroundTimeAwareSceneIr';

const CANONICAL_SHA='750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14';
const CODE_BASE=0x00050a54, STATIC_BASE=0x0008ca54;
function hx(v:number){return `0x${(v>>>0).toString(16).padStart(8,'0').toUpperCase()}`;}
function u16(b:Uint8Array,o:number){return (b[o]|(b[o+1]<<8))>>>0;}
function bytesEqualAt(hay:Uint8Array,physical:number,expected:number[]){if(physical<0||physical+expected.length>hay.length)return false;for(let i=0;i<expected.length;i++)if(hay[physical+i]!==expected[i])return false;return true;}
function norm(p:string){return p.replace(/\\/g,'/').toUpperCase();}
function rgbWord(w:number):[number,number,number]{return [Math.round(((w>>>10)&31)*255/31),Math.round(((w>>>5)&31)*255/31),Math.round((w&31)*255/31)];}
function fnvHex(bytes:Uint8Array){let h=0x811c9dc5;for(const b of bytes){h^=b;h=Math.imul(h,0x01000193);}return(h>>>0).toString(16).padStart(8,'0');}
function colorize(indices:Uint8Array,mask:Uint8Array,words:number[]){const rgba=new Uint8Array(indices.length*4);let out=0,opaque=0,max=0;for(let i=0;i<indices.length;i++){if(!mask[i])continue;opaque++;const idx=indices[i];max=Math.max(max,idx);if(idx<1||idx>words.length){out++;continue;}const [r,g,b]=rgbWord(words[idx-1]),p=i*4;rgba[p]=r;rgba[p+1]=g;rgba[p+2]=b;rgba[p+3]=255;}return{rgba,out,opaque,max};}

export interface MK1ArenaAnimatedFramePayload{key:string;width:number;height:number;rgba:Uint8Array;metadata:Record<string,unknown>}
interface ArenaObjectInstance {id:string;planeIndex:3|4;bmodSymbol:string;placementIndex:number;worldX:number;worldY:number;initialScreenX:number;initialScreenY:number;sortPrimary:number;sortSecondaryFixed1616:number;paletteSelector:number;paletteRecordRef:number;paletteRecordRefHex:string;}

export interface MK1ArenaAnimatedSceneExportFixtureReport{
 format:'mk1_arena_animated_scene_export_fixture_v1';timestamp:string;operationId:string;
 provenance:{sourceKind:'user-loaded-directory';fileName:string;byteLength:number;sha256:string;synthetic:false;artifactGeneratedByTest:false;timestamp:string;operationId:string};
 prerequisite:{o30OperationId:string;o30Verdict:string;o31OperationId:string;o31Verdict:string};
 fixture:{
  topLevelModuleSymbol:'ARENA_MOD';resourcePath:'GRAPHICS/FU2HDRS.GRA';fileId:24;targetPlanes:[3,4];objectCount:15;
  initialCamera:{allPlaneScrollX:292;sharedScrollY:31};
  updaterProof:{exactInstructionSignatures:Array<{meaning:string;watcomOffset:number;watcomOffsetHex:string;bytesHex:string;matched:true}>;targetObjectLists:[string,string];allObjectsInEachTargetListVisited:true;objectFrameStateField:'object +0x44';frameStateRange:'1..6 wrapping';delayTicks:8;absolutePhaseEstablished:false};
  paletteBinding:{selectors:[0,11];paletteTableSymbol:'FU2PALS';paletteRecordRef:number;paletteRecordRefHex:string;selectorsAliasSameRecord:true;colorCount:49;bindingBasis:string;paletteWords15:number[];paletteRgb:Array<[number,number,number]>};
  objects:ArenaObjectInstance[];
  tieOrdering:{plane3EqualSortKeyObjectCount:8;plane4EqualSortKeyObjectCount:7;exactWithinTieOrderEstablished:false;spriteBoundsOverlapWithinTies:true;canonicalFlattenedCompositeExported:false;reason:string};
  states:Array<{state:number;normalizedRelativeTick:number;descriptorWatcomOffset:number;descriptorWatcomOffsetHex:string;width:number;height:number;graOffset:number;graOffsetHex:string;maxOpaquePaletteIndex:number;opaquePixelCount:number;outOfPaletteRangeCount:number;rgbaChecksum:string;payloadKey:string}>;
 };
 summary:{targetObjectCount:number;targetPlaneCount:2;animationStateCount:6;delayTicks:8;rgbaPayloadCount:6;uniquePaletteRecordCount:1;allDecodesSuccessful:true;allPaletteIndicesInRange:boolean;canonicalCompositeBlockedByTieOrder:true};
 decision:{placementBoundArenaAnimationExportEstablished:true;correctColorRgbaStateExportEstablished:true;paletteBindingUsesRuntimeObjectStateNotCompatibilityGuess:true;normalizedSchedulerTickSequenceEstablished:true;wallClockTimingEstablished:false;absoluteAnimationPhaseEstablished:false;canonicalFlattenedCompositeEstablished:false;verdict:'MK1_ARENA_BOUNDED_ANIMATED_SCENE_EXPORT_FIXTURE_ESTABLISHED';narrative:string};
 status:'SUCCESS';validation:{allChecksPassed:boolean;checks:Array<{checkId:string;passed:boolean;detail?:string}>};
}
export interface MK1ArenaAnimatedSceneExportFixtureResult{report:MK1ArenaAnimatedSceneExportFixtureReport;framePayloads:Map<string,MK1ArenaAnimatedFramePayload>}

export async function executeArenaAnimatedSceneExportFixture(source:DirectorySource,o27:MK1StageBackgroundResourceGraphCensusReport,o30:MK1BackgroundDynamicProcessAnimationCensusReport,o31:MK1BackgroundTimeAwareSceneIrReport):Promise<MK1ArenaAnimatedSceneExportFixtureResult>{
 if(source.isSynthetic!==false)throw new Error('O32 requires authentic MK1 installation');
 if(o30.status!=='SUCCESS'||!o30.validation.allChecksPassed)throw new Error('O32 requires verified O30');
 if(o31.status!=='SUCCESS'||!o31.validation.allChecksPassed||o31.decision.verdict!=='MK1_TIME_AWARE_BACKGROUND_SCENE_IR_ESTABLISHED')throw new Error('O32 requires verified O31');
 const files=await source.listRecursive(),exeEntry=files.find(f=>f.name.toUpperCase()==='MK1.EXE');if(!exeEntry)throw new Error('O32 requires MK1.EXE');const exe=await source.readSlice(exeEntry.path,0,exeEntry.size),sha=await sha256Bytes(exe);if(sha!==CANONICAL_SHA||o31.provenance.sha256!==sha||o30.provenance.sha256!==sha)throw new Error('O32 canonical provenance mismatch');
 const sigs=[
  {meaning:'ARENA init spawns descriptor-cycle child 0x4CAB',off:0x4c9b,bytes:[0xbb,0x00,0x20,0x00,0x00,0xba,0xab,0x4c,0x00,0x00]},
  {meaning:'ARENA child selects active six-state table 0x0F0A',off:0x4cab,bytes:[0xc7,0x05,0x5c,0x4b,0x02,0x00,0x0a,0x0f,0x00,0x00]},
  {meaning:'ARENA updater traverses plane 3 object list',off:0x4cbf,bytes:[0x8b,0x3d,0xac,0x63,0x05,0x00]},
  {meaning:'ARENA updater traverses plane 4 object list',off:0x4cca,bytes:[0x8b,0x3d,0xa8,0x63,0x05,0x00]},
  {meaning:'ARENA updater yields eight scheduler ticks',off:0x4cd5,bytes:[0xb8,0x08,0x00,0x00,0x00]},
  {meaning:'ARENA frame state increments and wraps before seven',off:0x4cef,bytes:[0x40,0x83,0xf8,0x07,0x72,0x05]},
  {meaning:'ARENA state indexes active descriptor table',off:0x4cfd,bytes:[0x48,0xc1,0xe0,0x02,0x03,0x05,0x5c,0x4b,0x02,0x00]},
  {meaning:'ARENA descriptor swap leaves palette field untouched while replacing descriptor state',off:0x4d13,bytes:[0x8b,0x18,0x0f,0xb7,0x57,0x1c]},
 ];for(const s of sigs)if(!bytesEqualAt(exe,CODE_BASE+s.off,s.bytes))throw new Error(`O32 ARENA signature mismatch at ${hx(s.off)}`);
 const scene=o31.modules.find(m=>m.topLevelModuleSymbol==='ARENA_MOD');if(!scene||scene.resourcePath!=='GRAPHICS/FU2HDRS.GRA'||scene.fileId!==24)throw new Error('O32 ARENA_MOD scene missing');if(scene.initialCamera.allPlaneScrollX!==292||scene.initialCamera.sharedScrollY!==31)throw new Error('O32 ARENA camera fixture changed');
 const targets:MK1BackgroundScenePlacementInstance[]=[];for(const plane of [3,4])for(const slot of scene.planeSlots.filter(s=>s.planeIndex===plane&&s.entryKind==='BMOD_WITH_PACKED_I16_PAIR'))targets.push(...(slot.placements??[]));if(targets.length!==15)throw new Error(`O32 expected 15 ARENA targets, got ${targets.length}`);
 const objects:ArenaObjectInstance[]=targets.map(p=>{const parts=p.id.split('/');const plane=Number(parts[1].replace('plane_','')) as 3|4;return{id:p.id,planeIndex:plane,bmodSymbol:parts[2],placementIndex:p.placementIndex,worldX:p.worldX,worldY:p.worldY,initialScreenX:p.initialScreenX,initialScreenY:p.initialScreenY,sortPrimary:p.sortPrimary,sortSecondaryFixed1616:p.sortSecondaryFixed1616,paletteSelector:p.paletteSelector,paletteRecordRef:p.paletteRecordRef,paletteRecordRefHex:p.paletteRecordRefHex};});
 const p3=objects.filter(x=>x.planeIndex===3),p4=objects.filter(x=>x.planeIndex===4);if(p3.length!==8||p4.length!==7)throw new Error('O32 ARENA plane target counts changed');
 const selectors=[...new Set(objects.map(x=>x.paletteSelector))].sort((a,b)=>a-b);const refs=[...new Set(objects.map(x=>x.paletteRecordRef))];if(selectors.join(',')!=='0,11'||refs.length!==1||refs[0]!==0xf9e2)throw new Error('O32 ARENA palette alias binding changed');
 const ctx=o27.resourceContexts.find(c=>c.fileId===24&&c.paletteTableSymbol==='FU2PALS');if(!ctx||ctx.paletteRecordRefs[0]!==refs[0]||ctx.paletteRecordRefs[11]!==refs[0])throw new Error('O32 FU2 palette table alias missing');const pref=refs[0],pp=STATIC_BASE+pref,colorCount=u16(exe,pp);if(colorCount!==49)throw new Error(`O32 ARENA palette length changed ${colorCount}`);const words:number[]=[];for(let i=0;i<colorCount;i++)words.push(u16(exe,pp+2+i*2));
 const graEntry=files.find(f=>norm(f.path)==='GRAPHICS/FU2HDRS.GRA');if(!graEntry)throw new Error('O32 FU2HDRS.GRA missing');const gra=await source.readSlice(graEntry.path,0,graEntry.size);const cycle=o30.descriptorCycles.arena;if(cycle.slotCount!==6||cycle.delayTicks!==8||cycle.descriptors.length!==6)throw new Error('O32 ARENA cycle changed');
 const payloads=new Map<string,MK1ArenaAnimatedFramePayload>(),states:MK1ArenaAnimatedSceneExportFixtureReport['fixture']['states']=[];
 for(let i=0;i<6;i++){const d=cycle.descriptors[i];const dec=decodeUgraSprite(gra,d.graOffset,d.width,d.height);if(!dec.success)throw new Error(`O32 ARENA state ${i+1} decode failed: ${dec.failureReason??'unknown'}`);const col=colorize(dec.indices,dec.opaqueMask,words),key=`arena/state_${String(i+1).padStart(2,'0')}`,checksum=fnvHex(col.rgba);payloads.set(key,{key,width:d.width,height:d.height,rgba:col.rgba,metadata:{state:i+1,normalizedRelativeTick:i*8,descriptorWatcomOffset:d.watcomOffset,paletteRecordRef:pref,paletteSelectors:[0,11],absolutePhaseEstablished:false}});states.push({state:i+1,normalizedRelativeTick:i*8,descriptorWatcomOffset:d.watcomOffset,descriptorWatcomOffsetHex:d.watcomOffsetHex,width:d.width,height:d.height,graOffset:d.graOffset,graOffsetHex:d.graOffsetHex,maxOpaquePaletteIndex:col.max,opaquePixelCount:col.opaque,outOfPaletteRangeCount:col.out,rgbaChecksum:checksum,payloadKey:key});}
 const tie3=new Set(p3.map(x=>`${x.sortPrimary}:${x.worldY}`)),tie4=new Set(p4.map(x=>`${x.sortPrimary}:${x.worldY}`));const overlap=(a:ArenaObjectInstance,b:ArenaObjectInstance,w=82)=>Math.max(a.worldX,b.worldX)<Math.min(a.worldX+w,b.worldX+w);const overlap3=p3.some((a,i)=>p3.slice(i+1).some(b=>overlap(a,b))),overlap4=p4.some((a,i)=>p4.slice(i+1).some(b=>overlap(a,b)));const allRange=states.every(s=>s.outOfPaletteRangeCount===0&&s.maxOpaquePaletteIndex<=49);
 const checks=[
  {checkId:'CANONICAL_AUTHENTIC_SOURCE',passed:true},{checkId:'O30_O31_PREREQUISITES',passed:true},{checkId:'ARENA_UPDATER_SIGNATURES',passed:true,detail:`signatures=${sigs.length}`},
  {checkId:'ARENA_NORMAL_TARGET_OBJECTS',passed:objects.length===15&&p3.length===8&&p4.length===7,detail:`plane3=${p3.length}, plane4=${p4.length}`},{checkId:'ARENA_TARGET_PALETTE_RUNTIME_BINDING',passed:selectors.join(',')==='0,11'&&refs.length===1&&refs[0]===0xf9e2,detail:`selectors=${selectors.join(',')}, ref=${hx(refs[0])}`},
  {checkId:'ARENA_PALETTE_LENGTH_49',passed:colorCount===49},{checkId:'SIX_DYNAMIC_STATES_DECODED',passed:states.length===6&&payloads.size===6},{checkId:'DYNAMIC_INDICES_FIT_RUNTIME_PALETTE',passed:allRange,detail:`max=${Math.max(...states.map(s=>s.maxOpaquePaletteIndex))}`},
  {checkId:'NORMALIZED_EIGHT_TICK_CADENCE',passed:states.map(s=>s.normalizedRelativeTick).join(',')==='0,8,16,24,32,40'},{checkId:'ABSOLUTE_PHASE_NOT_OVERCLAIMED',passed:true},
  {checkId:'EQUAL_KEY_TIE_GROUPS_BLOCK_CANONICAL_COMPOSITE',passed:tie3.size===1&&tie4.size===1&&overlap3&&overlap4,detail:`plane3TieKeys=${tie3.size}, plane4TieKeys=${tie4.size}, overlap=${overlap3&&overlap4}`},{checkId:'NO_WRITE_PATH',passed:true},
 ];if(!checks.every(x=>x.passed))throw new Error(`O32 validation failed: ${checks.filter(x=>!x.passed).map(x=>x.checkId).join(', ')}`);
 const timestamp=new Date().toISOString(),operationId=createOperationId('arena_animated_scene_export_fixture');
 const report:MK1ArenaAnimatedSceneExportFixtureReport={format:'mk1_arena_animated_scene_export_fixture_v1',timestamp,operationId,provenance:{sourceKind:'user-loaded-directory',fileName:exeEntry.name,byteLength:exeEntry.size,sha256:sha,synthetic:false,artifactGeneratedByTest:false,timestamp,operationId},prerequisite:{o30OperationId:o30.operationId,o30Verdict:o30.decision.verdict,o31OperationId:o31.operationId,o31Verdict:o31.decision.verdict},fixture:{topLevelModuleSymbol:'ARENA_MOD',resourcePath:'GRAPHICS/FU2HDRS.GRA',fileId:24,targetPlanes:[3,4],objectCount:15,initialCamera:{allPlaneScrollX:292,sharedScrollY:31},updaterProof:{exactInstructionSignatures:sigs.map(s=>({meaning:s.meaning,watcomOffset:s.off,watcomOffsetHex:hx(s.off),bytesHex:s.bytes.map(x=>x.toString(16).padStart(2,'0').toUpperCase()).join(' '),matched:true})),targetObjectLists:[hx(0x563ac),hx(0x563a8)],allObjectsInEachTargetListVisited:true,objectFrameStateField:'object +0x44',frameStateRange:'1..6 wrapping',delayTicks:8,absolutePhaseEstablished:false},paletteBinding:{selectors:[0,11],paletteTableSymbol:'FU2PALS',paletteRecordRef:pref,paletteRecordRefHex:hx(pref),selectorsAliasSameRecord:true,colorCount:49,bindingBasis:'O31 maps ARENA3BMOD/ARENA4BMOD placements to planes 3/4; O28 establishes their BAKGND palette selectors; O30/O32 establish that the ARENA descriptor-swap updater preserves object +0x28.',paletteWords15:words,paletteRgb:words.map(rgbWord)},objects,tieOrdering:{plane3EqualSortKeyObjectCount:8,plane4EqualSortKeyObjectCount:7,exactWithinTieOrderEstablished:false,spriteBoundsOverlapWithinTies:true,canonicalFlattenedCompositeExported:false,reason:'All eight plane-3 objects share one primary+Y key and all seven plane-4 objects share another. Their ~69/70-pixel spacing is smaller than the ~81/82-pixel animated sprite widths, so draw order changes overlapping pixels. O29 intentionally leaves equal-key order runtime-history dependent.'},states},summary:{targetObjectCount:15,targetPlaneCount:2,animationStateCount:6,delayTicks:8,rgbaPayloadCount:6,uniquePaletteRecordCount:1,allDecodesSuccessful:true,allPaletteIndicesInRange:allRange,canonicalCompositeBlockedByTieOrder:true},decision:{placementBoundArenaAnimationExportEstablished:true,correctColorRgbaStateExportEstablished:true,paletteBindingUsesRuntimeObjectStateNotCompatibilityGuess:true,normalizedSchedulerTickSequenceEstablished:true,wallClockTimingEstablished:false,absoluteAnimationPhaseEstablished:false,canonicalFlattenedCompositeEstablished:false,verdict:'MK1_ARENA_BOUNDED_ANIMATED_SCENE_EXPORT_FIXTURE_ESTABLISHED',narrative:`O32 turns the O31 placement/process join into the first bounded animated background export fixture. ARENA_MOD places eight objects on plane 3 and seven on plane 4; the qualified ARENA updater traverses every object in those two lists and cycles six authentic FU2HDRS.GRA descriptors at an eight-scheduler-tick cadence. The placement objects carry palette selectors 11 and 0 respectively, and both selectors alias the same 49-colour FU2PALS record at ${hx(pref)}. Because BAKGND establishes those object palette states and the descriptor updater preserves object +0x28, all six dynamic descriptors can be rendered through affirmative runtime-state palette binding rather than filename or compatibility guessing. Every opaque index fits the 49-colour record and six deterministic RGBA payloads are exported. The manifest uses normalized relative ticks 0..40 in eight-tick steps; wall-clock duration and canonical absolute phase are not claimed. A flattened composite is deliberately withheld because each target plane is an exact-equal sort-key group and the 81/82-pixel sprites overlap at ~69/70-pixel spacing, making visible overlap order dependent on the unresolved runtime tie history.`},status:'SUCCESS',validation:{allChecksPassed:true,checks}};
 return{report,framePayloads:payloads};
}
export function createMK1ArenaAnimatedSceneExportFixtureExport(result:MK1ArenaAnimatedSceneExportFixtureResult){if(result.report.status!=='SUCCESS'||!result.report.validation.allChecksPassed)throw new Error('O32 export blocked');return result.report;}
