/** MK2 related-object selected-pointer consumer qualification — O95K. */
import { DirectorySource, SourceFileEntry } from '../../../core/filesystem/DirectorySource';

type O95H={status:'SUCCESS';consumerFamilies:Array<{category:string;callsites:Array<{family:'A'|'B';physical:number;physicalHex:string}>}>};
type O95J={status:'SUCCESS';summary:{terminalQualifiedAfterO95J:number;structuralHandoffOrUnresolvedAfterO95J:number}};

const EXPECTED_EXE_SHA256='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const LOOKUP_A=0x918f1,LOOKUP_B=0x91909;
const RELATED_HELPER=0x679f2,CURSOR_CONSTRUCTOR=0x64019,FRAME_SETUP=0x64069,COMPOSITION_BUILDER=0x640df,MANUAL_FRAME_INIT=0x64522;
const HASHES={
 related:['24d4713308700ea5916e4c61fafd5d5d6a3a12a55dcf15e493889aa946fc34d5',0x5f] as const,
 cursorConstructor:['21f8102a0cb28001ae4726f774ed70525aff8389d02ce7fda1de33cf2f3bf417',0x4c] as const,
 frameSetup:['1f91899dcf1866512f2e39b0f2a1afe4dac20b199772e1204aeab4fddbc5c5ee',0x3b] as const,
 compositionBuilder:['64dbc1105b4a7dd9039b75c90fb4621f410063c879e152423e6c9582fb57d3dd',0xbd] as const,
 manualFrameInit:['e9eb0f39085d3af99087c3df8538659c84c5f97eefc04c3a0dfeb4a4352db956',0x1f] as const,
 manualRoute:['2d1ff3c00cec5cdb730016db034676bc9545e4596be0315969e2aed06e15af70',0x6c] as const,
};
const HELPER_ROUTES=new Map<number,number>([
 [0x67481,0x67486],[0x6762c,0x67631],[0x67803,0x67808],[0x680b1,0x680b6],[0x685d4,0x685d9],[0x68673,0x68678],[0x688a3,0x688a8],[0x68d37,0x68d4a],[0x68f18,0x68f2b],[0x68fc4,0x68fd7],[0x690f0,0x690f5],[0x69496,0x694a9],[0x69627,0x6962c],[0x698cb,0x698d0],[0x69ac5,0x69aca],[0x69dea,0x69dfd],[0x7a4b8,0x7a4cb],[0x95af6,0x95afb],[0x95e51,0x95e64],[0x965c3,0x965d6],
]);
const DIRECT_CURSOR_ROUTE=0x835d2,DIRECT_CURSOR_CALL=0x835d7;
const MANUAL_ROUTE=0x69b43;

type Subtype='RELATED_HELPER_FIRST_COMPOSITION'|'DIRECT_CURSOR_CONSTRUCTOR_FIRST_COMPOSITION'|'MANUAL_FIRST_COMPOSITION_OBJECT_PATH';

function i32(b:Uint8Array,o:number){return new DataView(b.buffer,b.byteOffset+o,4).getInt32(0,true);}
function find(es:SourceFileEntry[],name:string){const e=es.find(x=>x.path.toUpperCase()===name);if(!e)throw new Error(`Missing ${name}`);return e;}
function rel(exe:Uint8Array,p:number){return p+5+i32(exe,p+1);}
function eq(exe:Uint8Array,p:number,v:number[]){return v.every((x,i)=>exe[p+i]===x);}
function hex(n:number){return `0x${n.toString(16).toUpperCase()}`;}
async function sha(b:Uint8Array){const d=await crypto.subtle.digest('SHA-256',b.slice().buffer);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');}

export interface MK2AnimationRelatedObjectConsumerQualificationReport{
 format:'mk2_animation_related_object_consumer_qualification_o95k_v1';timestamp:string;status:'SUCCESS';provenance:{exeSha256:string;synthetic:false};
 architecture:{selectedCursorGlobal:'0x75A78';secondaryCursorGlobal:'0x75A80';constructedObjectGlobal:'0x75A7C';relatedObjectField:'+0x34';identityField:'+0x46';relatedHelperPhysical:number;cursorConstructorPhysical:number;frameSetupPhysical:number;compositionBuilderPhysical:number;manualFrameInitPhysical:number;qualifiedBehavior:string;strictBoundary:string};
 routes:Array<{family:'A'|'B';lookupCallPhysical:number;lookupCallPhysicalHex:string;subtype:Subtype;consumerPhysical:number;consumerPhysicalHex:string;consumerQualified:true;selectedCursorUse:string;terminalQualified:false;boundary:string}>;
 summary:{relatedObjectStateRoutes:number;helperRoutes:number;directCursorConstructorRoutes:number;manualFirstCompositionRoutes:number;familyARoutes:number;familyBRoutes:number;strictTerminalQualifiedAfterO95J:number;consumerQualifiedRoutesAfterO95K:number;routesWithoutAnyQualifiedConsumerAfterO95K:number};
 decision:{allTwentyTwoRelatedObjectRoutesHaveQualifiedConsumer:true;firstDwordConsumedAsFrameCompositionPointer:true;relatedHelperCreatesRelatedObjectAndCopiesIdentity:true;manualRouteUsesDistinctConstructionPath:true;strictTerminalCountInflated:false;humanMoveNamesEstablished:false;timingEstablished:false;verdict:string};
 validation:{allChecksPassed:true;checks:Array<{id:string;passed:boolean;detail:string}>};
}

export async function executeMK2AnimationRelatedObjectConsumerQualification(source:DirectorySource,o95h:O95H,o95j:O95J):Promise<MK2AnimationRelatedObjectConsumerQualificationReport>{
 if(source.isSynthetic||o95h.status!=='SUCCESS'||o95j.status!=='SUCCESS')throw new Error('O95K requires authentic O95H/O95J');
 const es=await source.listRecursive(),e=find(es,'MK2.EXE'),exe=await source.readSlice(e.path,0,e.size);if(await sha(exe)!==EXPECTED_EXE_SHA256)throw new Error('MK2.EXE identity mismatch');
 const checks:Array<{id:string;passed:boolean;detail:string}>=[];const ck=(id:string,passed:boolean,detail:string)=>{checks.push({id,passed,detail});if(!passed)throw new Error(`O95K ${id}: ${detail}`);};
 for(const [name,[want,n],p] of [['related',HASHES.related,RELATED_HELPER],['cursorConstructor',HASHES.cursorConstructor,CURSOR_CONSTRUCTOR],['frameSetup',HASHES.frameSetup,FRAME_SETUP],['compositionBuilder',HASHES.compositionBuilder,COMPOSITION_BUILDER],['manualFrameInit',HASHES.manualFrameInit,MANUAL_FRAME_INIT],['manualRoute',HASHES.manualRoute,MANUAL_ROUTE]] as const){const got=await sha(exe.slice(p,p+n));ck(`hash_${name}`,got===want,got);}
 const fam=o95h.consumerFamilies.find(x=>x.category==='RELATED_OBJECT_STATE');if(!fam)throw new Error('Missing O95H RELATED_OBJECT_STATE family');
 const related=fam.callsites.slice().sort((a,b)=>a.physical-b.physical);ck('related_route_count',related.length===22,String(related.length));ck('family_counts',related.filter(x=>x.family==='A').length===9&&related.filter(x=>x.family==='B').length===13,`${related.filter(x=>x.family==='A').length}/${related.filter(x=>x.family==='B').length}`);
 const expected=new Set([...HELPER_ROUTES.keys(),DIRECT_CURSOR_ROUTE,MANUAL_ROUTE]);ck('route_partition',expected.size===22&&related.every(x=>expected.has(x.physical)),`${expected.size}/${related.length}`);
 // Authenticate the shared helper chain: selected cursor -> first DWORD -> standard composition builder.
 ck('related_calls_cursor_constructor',rel(exe,0x679f3)===CURSOR_CONSTRUCTOR,hex(rel(exe,0x679f3)));
 ck('cursor_constructor_reads_selected_cursor',eq(exe,0x64046,[0xa1,0x78,0x5a,0x07,0x00])&&eq(exe,0x6404b,[0x52,0x8b,0x10])&&eq(exe,0x6404e,[0x89,0x15,0x6c,0x5a,0x07,0x00]),hex(0x64046));
 ck('frame_setup_derefs_first_composition',eq(exe,0x64070,[0xa1,0x6c,0x5a,0x07,0x00])&&eq(exe,0x64075,[0x52,0x8b,0x10])&&eq(exe,0x64078,[0x89,0x15,0x6c,0x5a,0x07,0x00]),hex(0x64070));
 ck('frame_setup_tail_builder',eq(exe,0x640a1,[0x58,0xeb,0x3b]),hex(0x640a1));
 ck('builder_stores_composition_pointer',eq(exe,0x640df,[0x57,0x89,0x47,0x42]),hex(0x640df));
 ck('builder_zero_terminated_descriptor_loop',eq(exe,0x640ea,[0x52,0x8b,0x10])&&eq(exe,0x640f4,[0x83,0xc0,0x04])&&eq(exe,0x640f7,[0xf7,0x05,0x6c,0x5a,0x07,0x00,0xff,0xff,0xff,0xff])&&eq(exe,0x64101,[0x0f,0x84]),hex(0x640ea));
 ck('related_publishes_constructed_object',eq(exe,0x679f8,[0x89,0x3d,0x7c,0x5a,0x07,0x00]),hex(0x679f8));
 ck('related_copies_identity',eq(exe,0x67a08,[0x8b,0x1d,0x7c,0x5a,0x07,0x00])&&eq(exe,0x67a0e,[0x8b,0x4f,0x46])&&eq(exe,0x67a11,[0x89,0x4b,0x46]),hex(0x67a08));
 ck('related_links_object',eq(exe,0x67a14,[0x89,0x5e,0x34]),hex(0x67a14));
 // Route-specific immediate consumers.
 for(const [route,at] of HELPER_ROUTES){ck(`lookup_${hex(route)}`,rel(exe,route)===(related.find(x=>x.physical===route)?.family==='A'?LOOKUP_A:LOOKUP_B),hex(rel(exe,route)));ck(`helper_${hex(route)}`,rel(exe,at)===RELATED_HELPER,hex(rel(exe,at)));}
 ck('direct_lookup',rel(exe,DIRECT_CURSOR_ROUTE)===LOOKUP_B,hex(rel(exe,DIRECT_CURSOR_ROUTE)));ck('direct_cursor_constructor',rel(exe,DIRECT_CURSOR_CALL)===CURSOR_CONSTRUCTOR,hex(rel(exe,DIRECT_CURSOR_CALL)));
 // Manual route: mirror cursor, copy it to scratch, dereference first DWORD, then initialize a new object from that frame-composition pointer.
 ck('manual_lookup',rel(exe,MANUAL_ROUTE)===LOOKUP_B,hex(rel(exe,MANUAL_ROUTE)));
 ck('manual_mirror_cursor',eq(exe,0x69b49,[0x8b,0x15,0x78,0x5a,0x07,0x00])&&eq(exe,0x69b4f,[0x89,0x15,0x80,0x5a,0x07,0x00]),hex(0x69b49));
 ck('manual_copy_cursor_scratch',eq(exe,0x69b57,[0x8b,0x15,0x78,0x5a,0x07,0x00])&&eq(exe,0x69b5d,[0x89,0x15,0x6c,0x5a,0x07,0x00]),hex(0x69b57));
 ck('manual_deref_first_dword',eq(exe,0x69b65,[0xa1,0x6c,0x5a,0x07,0x00])&&eq(exe,0x69b6a,[0x52,0x8b,0x10])&&eq(exe,0x69b6d,[0x89,0x15,0x6c,0x5a,0x07,0x00]),hex(0x69b65));
 ck('manual_frame_init_call',rel(exe,0x69b75)===MANUAL_FRAME_INIT,hex(rel(exe,0x69b75)));
 ck('manual_frame_init_uses_composition_fields',eq(exe,0x64528,[0xa1,0x6c,0x5a,0x07,0x00])&&eq(exe,0x6452d,[0x89,0x47,0x3c])&&eq(exe,0x64531,[0x8b,0x50,0x08])&&eq(exe,0x64539,[0x8b,0x10]),hex(0x64528));
 const rows:MK2AnimationRelatedObjectConsumerQualificationReport['routes']=related.map(r=>{let subtype:Subtype,consumer:number,use:string,boundary:string;if(HELPER_ROUTES.has(r.physical)){subtype='RELATED_HELPER_FIRST_COMPOSITION';consumer=RELATED_HELPER;use='The selected cursor remains in 0x75A78. Helper 0x679F2 calls 0x64019, which dereferences the cursor first DWORD as a frame-composition pointer and routes that composition through the qualified 0x640DF builder while constructing a related object.';boundary='This qualifies first-composition consumption and related-object construction only. It does not prove that the selected stream ends here; several callers preserve/reuse cursor state later.';}else if(r.physical===DIRECT_CURSOR_ROUTE){subtype='DIRECT_CURSOR_CONSTRUCTOR_FIRST_COMPOSITION';consumer=CURSOR_CONSTRUCTOR;use='The selected cursor is passed directly to 0x64019, which consumes its first DWORD as the frame-composition pointer and constructs through the standard builder chain.';boundary='This qualifies the immediate first-composition consumer only; later repeated construction/state use remains separate.';}else{subtype='MANUAL_FIRST_COMPOSITION_OBJECT_PATH';consumer=MANUAL_FRAME_INIT;use='The selected cursor is mirrored to 0x75A80, copied to scratch, dereferenced once, and the resulting first-DWORD pointer is consumed by 0x64522 in a distinct object-initialization path.';boundary='The manual path does not use the standard 0x640DF composition loop in this bounded route. Its later state/render behavior is not generalized to the other 21 routes.';}return {family:r.family,lookupCallPhysical:r.physical,lookupCallPhysicalHex:hex(r.physical),subtype,consumerPhysical:consumer,consumerPhysicalHex:hex(consumer),consumerQualified:true,selectedCursorUse:use,terminalQualified:false,boundary};});
 const helper=rows.filter(r=>r.subtype==='RELATED_HELPER_FIRST_COMPOSITION').length,direct=rows.filter(r=>r.subtype==='DIRECT_CURSOR_CONSTRUCTOR_FIRST_COMPOSITION').length,manual=rows.filter(r=>r.subtype==='MANUAL_FIRST_COMPOSITION_OBJECT_PATH').length;ck('subtype_counts',helper===20&&direct===1&&manual===1,`${helper}/${direct}/${manual}`);
 ck('o95j_baseline',o95j.summary.terminalQualifiedAfterO95J===161&&o95j.summary.structuralHandoffOrUnresolvedAfterO95J===92,JSON.stringify(o95j.summary));
 return {format:'mk2_animation_related_object_consumer_qualification_o95k_v1',timestamp:new Date().toISOString(),status:'SUCCESS',provenance:{exeSha256:EXPECTED_EXE_SHA256,synthetic:false},architecture:{selectedCursorGlobal:'0x75A78',secondaryCursorGlobal:'0x75A80',constructedObjectGlobal:'0x75A7C',relatedObjectField:'+0x34',identityField:'+0x46',relatedHelperPhysical:RELATED_HELPER,cursorConstructorPhysical:CURSOR_CONSTRUCTOR,frameSetupPhysical:FRAME_SETUP,compositionBuilderPhysical:COMPOSITION_BUILDER,manualFrameInitPhysical:MANUAL_FRAME_INIT,qualifiedBehavior:'For the 22 O95H RELATED_OBJECT_STATE routes, the selected pointer has an authenticated immediate consumer. Twenty routes enter 0x679F2, one enters 0x64019 directly, and one manually dereferences the selected cursor first DWORD before 0x64522. The shared 0x679F2/0x64019 path consumes the selected stream first DWORD as a frame-composition pointer and constructs a related object through the already-qualified composition builder.',strictBoundary:'O95K qualifies at least one selected-pointer consumer for these routes, not a terminal/end-of-stream consumer. Cursor preservation, later dual-stream use, scheduler behavior and gameplay semantics remain route-specific.'},routes:rows,summary:{relatedObjectStateRoutes:22,helperRoutes:helper,directCursorConstructorRoutes:direct,manualFirstCompositionRoutes:manual,familyARoutes:9,familyBRoutes:13,strictTerminalQualifiedAfterO95J:161,consumerQualifiedRoutesAfterO95K:183,routesWithoutAnyQualifiedConsumerAfterO95K:70},decision:{allTwentyTwoRelatedObjectRoutesHaveQualifiedConsumer:true,firstDwordConsumedAsFrameCompositionPointer:true,relatedHelperCreatesRelatedObjectAndCopiesIdentity:true,manualRouteUsesDistinctConstructionPath:true,strictTerminalCountInflated:false,humanMoveNamesEstablished:false,timingEstablished:false,verdict:'MK2_O95K_ALL_22_RELATED_OBJECT_STATE_ROUTES_HAVE_AUTHENTICATED_FIRST_COMPOSITION_CONSUMERS_WITH_STRICT_TERMINAL_COUNT_UNCHANGED'},validation:{allChecksPassed:true,checks}};
}
