/** MK2 local-cursor/data + cursor-stack/state continuation qualification — O95L. */
import { DirectorySource, SourceFileEntry } from '../../../core/filesystem/DirectorySource';

type O95H={status:'SUCCESS';consumerFamilies:Array<{category:string;callsites:Array<{family:'A'|'B';physical:number;physicalHex:string}>}>};
type O95J={status:'SUCCESS';summary:{terminalQualifiedAfterO95J:number}};
type O95K={status:'SUCCESS';summary:{consumerQualifiedRoutesAfterO95K:number;routesWithoutAnyQualifiedConsumerAfterO95K:number}};

const EXPECTED_EXE_SHA256='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const LOOKUP_A=0x918f1,LOOKUP_B=0x91909,INTERPRETER=0x63e79;
const WALKER=0x6334a,SECONDARY_STANDARD=0x64823,DYNAMIC_DISPATCH=0x6435a,RELATED_HELPER=0x679f2,FRAME_INIT=0x64522,NESTED_INSTALL=0x74653,NESTED_INSTALL_INNER=0x746b7,DUAL_WRAPPER=0x868ae,DIRECT_RENDERER=0x9377c,CURSOR_TRANSFORM=0x7e62e;
const HASHES={
 walker:['ad0121136ffc0948d045970c95153542cc9d00f0a44d59fe00153a1a8732ac66',0x16] as const,
 secondaryStandard:['e5ab582bb5890441147ee98bd479c61a57b8b23216b5ef9878c59ed07ebb47fe',0x3c] as const,
 dynamicDispatch:['51be30b495b2193ae81758d17162fe22011a2edbd4808b84548de5f91b79a3a2',0x34] as const,
 frameInit:['e9eb0f39085d3af99087c3df8538659c84c5f97eefc04c3a0dfeb4a4352db956',0x1f] as const,
 nestedInstall:['694c88b3508a39f3e0590ee82d7640510386592e64725c0a97e5da61788b44e2',0x15] as const,
 nestedInstallInner:['8ca962b7fb55287a577e0e211f9ea6c3a55473e74cd465e90cfcc1034b0af858',0x2d] as const,
 interpreter:['6f0826bdac12e9f51ac2fc3af55bc915dea9fccfeedfd784ead73a41bea300cf',0x105] as const,
 dual:['8bdcc521ddbb8bdb4f48a09708ee9b683ef82fc0984f712230e73de493f618f0',0x54] as const,
 transform:['501629638aca917e16b3e8f6e5f2f614b79d5a76153af495241ed3fd51871c9e',0x1d] as const,
 directRenderer:['511c9dcf0a44cc82fef3ac59e537c867ac4fd9aad528641a600744e5c17d5063',0x60] as const,
};

type Subtype=
 |'SECONDARY_CURSOR_STANDARD_COMPOSITION'
 |'DIRECT_REPLAY_STANDARD_COMPOSITION'
 |'STACK_RESTORE_STANDARD_COMPOSITION'
 |'DYNAMIC_KNOWN_CONSUMER_DISPATCH'
 |'CONDITIONAL_DYNAMIC_KNOWN_CONSUMER_DISPATCH'
 |'COUNTED_DIRECT_DESCRIPTOR_RENDER'
 |'FIRST_DWORD_OBJECT_INIT'
 |'NESTED_RECORD_POINTER_INSTALL'
 |'SEGMENT_NAVIGATION_ONLY'
 |'CURSOR_TRANSFORM_ONLY'
 |'LOCAL_NESTED_READ_DISCARDED'
 |'CURSOR_BASELINE_STATE_ONLY';

type Qualification='TERMINAL_QUALIFIED'|'CONSUMER_QUALIFIED_NONTERMINAL'|'CONDITIONAL_CONSUMER_PATH'|'STRUCTURAL_ONLY';

const ROUTES:Array<{family:'A'|'B';physical:number;subtype:Subtype;qualification:Qualification;consumer?:number;detail:string}>=[
 {family:'A',physical:0x63345,subtype:'SEGMENT_NAVIGATION_ONLY',qualification:'STRUCTURAL_ONLY',consumer:WALKER,detail:'Family-A selection falls directly into 0x6334A, which advances 0x75A78 through one zero-terminated DWORD segment and returns. This is exact cursor navigation only.'},
 {family:'A',physical:0x68a70,subtype:'SECONDARY_CURSOR_STANDARD_COMPOSITION',qualification:'CONSUMER_QUALIFIED_NONTERMINAL',consumer:RELATED_HELPER,detail:'After two exact segment skips, the post-skip cursor is copied to 0x75A80 and is consumed first by the related-object helper. A later bounded path also feeds that secondary cursor through 0x64823 into the standard interpreter, but a branch can leave before that later consumption, so O95L does not call the route terminal-qualified.'},
 {family:'A',physical:0x68b5f,subtype:'SECONDARY_CURSOR_STANDARD_COMPOSITION',qualification:'TERMINAL_QUALIFIED',consumer:SECONDARY_STANDARD,detail:'After three exact segment skips, the post-skip cursor is copied to 0x75A80 and control reaches 0x64823, which temporarily rebinds 0x75A78 to the secondary cursor and calls the standard composition interpreter.'},
 {family:'A',physical:0x68eae,subtype:'LOCAL_NESTED_READ_DISCARDED',qualification:'STRUCTURAL_ONLY',detail:'The selected cursor is dereferenced through two pointer levels and field +0x0C is read, but 0x75A78 is then replaced and the packed Family-B wrapper overwrites EAX before that local value has a qualified downstream consumer.'},
 {family:'A',physical:0x716e1,subtype:'CONDITIONAL_DYNAMIC_KNOWN_CONSUMER_DISPATCH',qualification:'CONDITIONAL_CONSUMER_PATH',consumer:DYNAMIC_DISPATCH,detail:'The selected cursor can reach 0x6435A, whose two nonzero-token branches are already-qualified consumers (0x86CC5 or 0x63E79). However 0x70F30 runs first and can transfer control away, so this is not promoted to the strong consumer-qualified count.'},
 {family:'A',physical:0x71d4c,subtype:'DYNAMIC_KNOWN_CONSUMER_DISPATCH',qualification:'TERMINAL_QUALIFIED',consumer:DYNAMIC_DISPATCH,detail:'After scheduler resume, 0x6435A consumes the selected cursor through a runtime flag dispatch to either the qualified direct-descriptor consumer or the standard composition interpreter.'},
 {family:'A',physical:0x721a4,subtype:'CONDITIONAL_DYNAMIC_KNOWN_CONSUMER_DISPATCH',qualification:'CONDITIONAL_CONSUMER_PATH',consumer:DYNAMIC_DISPATCH,detail:'The selected cursor can reach 0x6435A after an identity-indexed cadence setup, but 0x70F30 executes first and can transfer control away. The consumer path is real but conditional.'},
 {family:'A',physical:0x7e3b1,subtype:'DYNAMIC_KNOWN_CONSUMER_DISPATCH',qualification:'TERMINAL_QUALIFIED',consumer:DYNAMIC_DISPATCH,detail:'The selected cursor reaches 0x6435A directly after bounded setup. The dispatcher routes nonzero tokens only to already-qualified consumers 0x86CC5 or 0x63E79.'},
 {family:'A',physical:0x7e629,subtype:'CURSOR_TRANSFORM_ONLY',qualification:'STRUCTURAL_ONLY',consumer:CURSOR_TRANSFORM,detail:'The selected cursor is scanned to a zero terminator and then backed up by eight bytes. This exactly transforms cursor position but does not itself establish a semantic frame/data consumer.'},
 {family:'A',physical:0x83963,subtype:'FIRST_DWORD_OBJECT_INIT',qualification:'CONSUMER_QUALIFIED_NONTERMINAL',consumer:FRAME_INIT,detail:'The selected cursor first DWORD is copied to scratch and consumed by the 0x64548 -> 0x64522 object-initialization path. The cursor is also retained separately, so this is not treated as terminal.'},
 {family:'A',physical:0x8458a,subtype:'FIRST_DWORD_OBJECT_INIT',qualification:'CONSUMER_QUALIFIED_NONTERMINAL',consumer:FRAME_INIT,detail:'The selected cursor first DWORD is copied to scratch and consumed by the 0x64548 -> 0x64522 object-initialization path. No whole-stream grammar is inferred.'},
 {family:'A',physical:0x91829,subtype:'DYNAMIC_KNOWN_CONSUMER_DISPATCH',qualification:'TERMINAL_QUALIFIED',consumer:DYNAMIC_DISPATCH,detail:'After scheduler resume, the selected cursor reaches 0x6435A. That helper only sends nonzero cursor tokens to the already-qualified direct-descriptor or standard-composition consumers.'},
 {family:'A',physical:0x91d3d,subtype:'CURSOR_BASELINE_STATE_ONLY',qualification:'STRUCTURAL_ONLY',detail:'The selected cursor address is saved to object +0x38 and later used as a pointer-distance baseline against 0x75A78. O95L does not establish a qualified consumer of the selected stream contents on this bounded route.'},
 {family:'A',physical:0x950af,subtype:'NESTED_RECORD_POINTER_INSTALL',qualification:'CONSUMER_QUALIFIED_NONTERMINAL',consumer:NESTED_INSTALL,detail:'The selected cursor is dereferenced twice, field +0x0C is loaded, and that resulting pointer is consumed by 0x74653/0x746B7, which stores it into an indexed runtime table and reads its leading word. The semantic resource type remains unknown.'},
 {family:'B',physical:0x68bd8,subtype:'DIRECT_REPLAY_STANDARD_COMPOSITION',qualification:'TERMINAL_QUALIFIED',consumer:INTERPRETER,detail:'The selected cursor is preserved, interpreted once from +4, restored to the original selection, and interpreted again by the standard composition interpreter.'},
 {family:'B',physical:0x69221,subtype:'COUNTED_DIRECT_DESCRIPTOR_RENDER',qualification:'TERMINAL_QUALIFIED',consumer:DIRECT_RENDERER,detail:'After two exact segment skips, the route reads six consecutive DWORD pointers from the post-skip cursor, advances by four bytes per entry, and sends each pointer to renderer 0x9377C. It is a fixed-count direct-descriptor path, not the standard interpreter grammar.'},
 {family:'B',physical:0x7a5dc,subtype:'DIRECT_REPLAY_STANDARD_COMPOSITION',qualification:'TERMINAL_QUALIFIED',consumer:INTERPRETER,detail:'The selected cursor is preserved, interpreted from +4, restored, and interpreted again by the standard composition interpreter with scheduler calls between the two passes.'},
 {family:'B',physical:0x67dda,subtype:'STACK_RESTORE_STANDARD_COMPOSITION',qualification:'TERMINAL_QUALIFIED',consumer:INTERPRETER,detail:'The original selected cursor is pushed, two segments are skipped for a secondary related-object path, then the original cursor is restored and 0x868C7 consumes both primary and secondary cursors through the standard interpreter.'},
 {family:'B',physical:0x7c481,subtype:'DYNAMIC_KNOWN_CONSUMER_DISPATCH',qualification:'TERMINAL_QUALIFIED',consumer:DYNAMIC_DISPATCH,detail:'The selected cursor reaches 0x6435A directly in the bounded loop. Nonzero cursor tokens are dispatched only to the already-qualified 0x86CC5 or 0x63E79 consumers.'},
 {family:'B',physical:0x965a9,subtype:'STACK_RESTORE_STANDARD_COMPOSITION',qualification:'TERMINAL_QUALIFIED',consumer:INTERPRETER,detail:'The selected cursor is pushed and immediately consumed by the standard interpreter. It is later restored after construction of a secondary related-object stream and subsequently enters the dual standard wrapper.'},
];

function i32(b:Uint8Array,o:number){return new DataView(b.buffer,b.byteOffset+o,4).getInt32(0,true);}
function find(es:SourceFileEntry[],name:string){const e=es.find(x=>x.path.toUpperCase()===name);if(!e)throw new Error(`Missing ${name}`);return e;}
function rel(exe:Uint8Array,p:number){return p+5+i32(exe,p+1);}
function relJcc(exe:Uint8Array,p:number){return p+6+i32(exe,p+2);}
function eq(exe:Uint8Array,p:number,v:number[]){return v.every((x,i)=>exe[p+i]===x);}
function hex(n:number){return `0x${n.toString(16).toUpperCase()}`;}
async function sha(b:Uint8Array){const d=await crypto.subtle.digest('SHA-256',b.slice().buffer);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');}

export interface MK2AnimationLocalCursorStateContinuationQualificationReport{
 format:'mk2_animation_local_cursor_state_continuation_qualification_o95l_v1';timestamp:string;status:'SUCCESS';provenance:{exeSha256:string;synthetic:false};
 architecture:{selectedCursorGlobal:'0x75A78';secondaryCursorGlobal:'0x75A80';scratchGlobal:'0x75A6C';walkerPhysical:number;secondaryStandardWrapperPhysical:number;dynamicDispatchPhysical:number;standardInterpreterPhysical:number;directDescriptorConsumerPhysical:'0x86CC5';directRendererPhysical:number;qualificationRule:string};
 routes:Array<{family:'A'|'B';lookupCallPhysical:number;lookupCallPhysicalHex:string;subtype:Subtype;qualification:Qualification;consumerPhysical:number|null;consumerPhysicalHex:string|null;detail:string}>;
 summary:{targetRoutes:number;localCursorDataRoutes:number;cursorStackStateRoutes:number;newTerminalQualifiedRoutes:number;newStrongNonterminalConsumerRoutes:number;conditionalConsumerPathRoutes:number;structuralOnlyRoutes:number;strictTerminalQualifiedAfterO95L:number;consumerQualifiedRoutesAfterO95L:number;routesWithoutAnyStrongQualifiedConsumerAfterO95L:number};
 decision:{allTwentyRoutesClassified:true;dynamicDispatchHasOnlyKnownConsumers:true;twoDynamicRoutesRemainConditional:true;fourRoutesRemainStructuralOnly:true;supportDataConsumerDoesNotImplyAnimationGrammar:true;humanMoveNamesEstablished:false;timingEstablished:false;verdict:string};
 validation:{allChecksPassed:true;checks:Array<{id:string;passed:boolean;detail:string}>};
}

export async function executeMK2AnimationLocalCursorStateContinuationQualification(source:DirectorySource,o95h:O95H,o95j:O95J,o95k:O95K):Promise<MK2AnimationLocalCursorStateContinuationQualificationReport>{
 if(source.isSynthetic||o95h.status!=='SUCCESS'||o95j.status!=='SUCCESS'||o95k.status!=='SUCCESS')throw new Error('O95L requires authentic O95H/O95J/O95K');
 const es=await source.listRecursive(),e=find(es,'MK2.EXE'),exe=await source.readSlice(e.path,0,e.size);if(await sha(exe)!==EXPECTED_EXE_SHA256)throw new Error('MK2.EXE identity mismatch');
 const checks:Array<{id:string;passed:boolean;detail:string}>=[];const ck=(id:string,passed:boolean,detail:string)=>{checks.push({id,passed,detail});if(!passed)throw new Error(`O95L ${id}: ${detail}`);};
 for(const [name,[want,n],p] of [['walker',HASHES.walker,WALKER],['secondaryStandard',HASHES.secondaryStandard,SECONDARY_STANDARD],['dynamicDispatch',HASHES.dynamicDispatch,DYNAMIC_DISPATCH],['frameInit',HASHES.frameInit,FRAME_INIT],['nestedInstall',HASHES.nestedInstall,NESTED_INSTALL],['nestedInstallInner',HASHES.nestedInstallInner,NESTED_INSTALL_INNER],['interpreter',HASHES.interpreter,INTERPRETER],['dual',HASHES.dual,DUAL_WRAPPER],['transform',HASHES.transform,CURSOR_TRANSFORM],['directRenderer',HASHES.directRenderer,DIRECT_RENDERER]] as const){const got=await sha(exe.slice(p,p+n));ck(`hash_${name}`,got===want,got);}
 const local=o95h.consumerFamilies.find(x=>x.category==='LOCAL_CURSOR_DATA'),stack=o95h.consumerFamilies.find(x=>x.category==='CURSOR_STACK_OR_STATE');if(!local||!stack)throw new Error('Missing O95H local/stack families');
 const target=[...local.callsites,...stack.callsites].sort((a,b)=>a.physical-b.physical);ck('target_counts',local.callsites.length===17&&stack.callsites.length===3&&target.length===20,`${local.callsites.length}/${stack.callsites.length}`);
 const want=new Map(ROUTES.map(r=>[r.physical,r]));ck('route_partition',want.size===20&&target.every(r=>want.get(r.physical)?.family===r.family),`${want.size}/${target.length}`);
 for(const r of ROUTES)ck(`lookup_${hex(r.physical)}`,rel(exe,r.physical)===(r.family==='A'?LOOKUP_A:LOOKUP_B),hex(rel(exe,r.physical)));
 // Shared helper mechanics.
 ck('walker_shape',eq(exe,0x6334a,[0xa1,0x78,0x5a,0x07,0x00])&&eq(exe,0x6334f,[0x8b,0x00])&&eq(exe,0x63351,[0x83,0x05,0x78,0x5a,0x07,0x00,0x04]),hex(WALKER));
 ck('secondary_wrapper_rebinds',eq(exe,0x64824,[0xff,0x35,0x78,0x5a,0x07,0x00])&&eq(exe,0x64831,[0x8b,0x15,0x80,0x5a,0x07,0x00])&&eq(exe,0x64837,[0x89,0x15,0x78,0x5a,0x07,0x00])&&rel(exe,0x6483e)===INTERPRETER,hex(SECONDARY_STANDARD));
 ck('secondary_wrapper_restores',eq(exe,0x64849,[0x52])&&eq(exe,0x6484a,[0x8b,0x15,0x78,0x5a,0x07,0x00])&&eq(exe,0x64850,[0x89,0x15,0x80,0x5a,0x07,0x00])&&eq(exe,0x64857,[0x8f,0x05,0x78,0x5a,0x07,0x00]),hex(0x64849));
 ck('dynamic_dispatch_cursor_test',eq(exe,0x64367,[0x8b,0x1d,0x78,0x5a,0x07,0x00])&&eq(exe,0x6436d,[0x8b,0x1b])&&eq(exe,0x6436f,[0xf7,0xc3,0xff,0xff,0xff,0xff]),hex(DYNAMIC_DISPATCH));
 ck('dynamic_dispatch_known_branches',rel(exe,0x64382)===0x86cc5&&rel(exe,0x64388)===INTERPRETER,`${hex(rel(exe,0x64382))}/${hex(rel(exe,0x64388))}`);
 ck('frame_init_uses_scratch',eq(exe,0x64528,[0xa1,0x6c,0x5a,0x07,0x00])&&eq(exe,0x6452d,[0x89,0x47,0x3c])&&eq(exe,0x64531,[0x8b,0x50,0x08])&&eq(exe,0x64539,[0x8b,0x10]),hex(FRAME_INIT));
 ck('nested_install_consumes_eax',eq(exe,0x74653,[0x53,0x0f,0xb7,0x5f,0x30])&&rel(exe,0x74658)===NESTED_INSTALL_INNER,hex(NESTED_INSTALL));
 ck('nested_install_inner_stores_pointer',eq(exe,0x746c3,[0x89,0x04,0xdd,0x00,0x5b,0x07,0x00])&&eq(exe,0x746ca,[0x0f,0xb7,0x18]),hex(NESTED_INSTALL_INNER));
 // Route-specific authenticated continuations.
 ck('63345_fallthrough_walker',0x63345+5===WALKER,hex(WALKER));
 ck('68a70_two_skips_related',rel(exe,0x68a86)===WALKER&&rel(exe,0x68a8b)===WALKER&&rel(exe,0x68a9e)===RELATED_HELPER&&rel(exe,0x68af6)===SECONDARY_STANDARD,`${hex(rel(exe,0x68a9e))}/${hex(rel(exe,0x68af6))}`);
 ck('68b5f_three_skips_secondary',rel(exe,0x68b75)===WALKER&&rel(exe,0x68b7a)===WALKER&&rel(exe,0x68b7f)===WALKER&&rel(exe,0x68b9c)===0x68c6c&&rel(exe,0x68c6c)===SECONDARY_STANDARD,hex(rel(exe,0x68c6c)));
 ck('68eae_nested_read_then_replace',eq(exe,0x68eb3,[0xa1,0x78,0x5a,0x07,0x00,0x8b,0x00,0x8b,0x00,0x8b,0x40,0x0c])&&eq(exe,0x68ebf,[0xc7,0x05,0x78,0x5a,0x07,0x00,0x01,0x00,0x04,0x00]),hex(0x68eb3));
 const dynCalls=[[0x716e1,0x71704],[0x71d4c,0x71d65],[0x721a4,0x721c7],[0x7e3b1,0x7e3c5],[0x91829,0x91838],[0x7c481,0x7c4a0]] as const;for(const [route,at] of dynCalls)ck(`dynamic_${hex(route)}`,rel(exe,at)===DYNAMIC_DISPATCH,hex(rel(exe,at)));
 ck('conditional_70f30_routes',rel(exe,0x716ff)===0x70f30&&rel(exe,0x721c2)===0x70f30,`${hex(rel(exe,0x716ff))}/${hex(rel(exe,0x721c2))}`);
 ck('70f30_can_transfer_control',eq(exe,0x70ffb,[0xff,0xe3]),hex(0x70ffb));
 ck('7e629_transform_shape',eq(exe,0x7e62e,[0xa1,0x78,0x5a,0x07,0x00])&&eq(exe,0x7e635,[0x83,0x05,0x78,0x5a,0x07,0x00,0x04])&&eq(exe,0x7e643,[0x83,0x2d,0x78,0x5a,0x07,0x00,0x08]),hex(CURSOR_TRANSFORM));
 for(const [route,load,call] of [[0x83963,0x83976,0x83987],[0x8458a,0x8458f,0x845a0]] as const){ck(`first_dword_${hex(route)}`,eq(exe,load,[0x50,0xa1,0x78,0x5a,0x07,0x00])&&eq(exe,load+6,[0x52,0x8b,0x10,0x89,0x15,0x6c,0x5a,0x07,0x00])&&rel(exe,call)===0x64548,hex(rel(exe,call)));}
 ck('91d3d_cursor_baseline',eq(exe,0x91d42,[0x8b,0x0d,0x78,0x5a,0x07,0x00])&&eq(exe,0x91d48,[0x89,0x4e,0x38])&&eq(exe,0x91d70,[0x8b,0x46,0x38])&&eq(exe,0x91d73,[0x2b,0x05,0x78,0x5a,0x07,0x00]),hex(0x91d42));
 ck('950af_nested_pointer_install',eq(exe,0x950b4,[0xa1,0x78,0x5a,0x07,0x00,0x8b,0x00,0x8b,0x00,0x8b,0x40,0x0c])&&rel(exe,0x950c0)===NESTED_INSTALL,hex(rel(exe,0x950c0)));
 ck('68bd8_replay_interpreters',eq(exe,0x68bf9,[0x83,0x05,0x78,0x5a,0x07,0x00,0x04])&&rel(exe,0x68c00)===INTERPRETER&&rel(exe,0x68c1d)===INTERPRETER,`${hex(rel(exe,0x68c00))}/${hex(rel(exe,0x68c1d))}`);
 ck('69221_two_skips',rel(exe,0x69234)===WALKER&&rel(exe,0x69239)===WALKER,`${hex(rel(exe,0x69234))}/${hex(rel(exe,0x69239))}`);
 ck('69221_counted_renderer',eq(exe,0x69276,[0xc7,0x05,0x70,0x5a,0x07,0x00,0x06,0x00,0x00,0x00])&&eq(exe,0x6928b,[0x8b,0x1d,0x78,0x5a,0x07,0x00])&&eq(exe,0x69291,[0x8b,0x1b])&&eq(exe,0x69293,[0x83,0x05,0x78,0x5a,0x07,0x00,0x04])&&rel(exe,0x6929a)===DIRECT_RENDERER&&eq(exe,0x69308,[0xff,0x0d,0x70,0x5a,0x07,0x00])&&relJcc(exe,0x6930e)===0x69280,hex(rel(exe,0x6929a)));
 ck('7a5dc_replay_interpreters',eq(exe,0x7a5ef,[0x83,0x05,0x78,0x5a,0x07,0x00,0x04])&&rel(exe,0x7a5f6)===INTERPRETER&&rel(exe,0x7a613)===INTERPRETER,`${hex(rel(exe,0x7a5f6))}/${hex(rel(exe,0x7a613))}`);
 ck('67dda_stack_restore_dual',eq(exe,0x67ddf,[0xff,0x35,0x78,0x5a,0x07,0x00])&&eq(exe,0x67e0c,[0x8f,0x05,0x78,0x5a,0x07,0x00])&&rel(exe,0x67e20)===0x868c7,hex(rel(exe,0x67e20)));
 ck('965a9_stack_immediate_interpreter',eq(exe,0x965ae,[0xff,0x35,0x78,0x5a,0x07,0x00])&&rel(exe,0x965b4)===INTERPRETER&&eq(exe,0x965e5,[0x8f,0x05,0x78,0x5a,0x07,0x00])&&rel(exe,0x96604)===DUAL_WRAPPER,`${hex(rel(exe,0x965b4))}/${hex(rel(exe,0x96604))}`);
 const rows=target.map(t=>{const r=want.get(t.physical)!;return {family:r.family,lookupCallPhysical:r.physical,lookupCallPhysicalHex:hex(r.physical),subtype:r.subtype,qualification:r.qualification,consumerPhysical:r.consumer??null,consumerPhysicalHex:r.consumer===undefined?null:hex(r.consumer),detail:r.detail};});
 const count=(q:Qualification)=>rows.filter(r=>r.qualification===q).length;const terminal=count('TERMINAL_QUALIFIED'),nonterminal=count('CONSUMER_QUALIFIED_NONTERMINAL'),conditional=count('CONDITIONAL_CONSUMER_PATH'),structural=count('STRUCTURAL_ONLY');ck('qualification_counts',terminal===10&&nonterminal===4&&conditional===2&&structural===4,`${terminal}/${nonterminal}/${conditional}/${structural}`);
 ck('o95_baselines',o95j.summary.terminalQualifiedAfterO95J===161&&o95k.summary.consumerQualifiedRoutesAfterO95K===183&&o95k.summary.routesWithoutAnyQualifiedConsumerAfterO95K===70,`${o95j.summary.terminalQualifiedAfterO95J}/${o95k.summary.consumerQualifiedRoutesAfterO95K}/${o95k.summary.routesWithoutAnyQualifiedConsumerAfterO95K}`);
 return {format:'mk2_animation_local_cursor_state_continuation_qualification_o95l_v1',timestamp:new Date().toISOString(),status:'SUCCESS',provenance:{exeSha256:EXPECTED_EXE_SHA256,synthetic:false},architecture:{selectedCursorGlobal:'0x75A78',secondaryCursorGlobal:'0x75A80',scratchGlobal:'0x75A6C',walkerPhysical:WALKER,secondaryStandardWrapperPhysical:SECONDARY_STANDARD,dynamicDispatchPhysical:DYNAMIC_DISPATCH,standardInterpreterPhysical:INTERPRETER,directDescriptorConsumerPhysical:'0x86CC5',directRendererPhysical:DIRECT_RENDERER,qualificationRule:'A route is added to the strong consumer-qualified count only when the selected pointer or a provenance-preserving derivative reaches an authenticated downstream consumer on the bounded route without relying on a branch that can transfer control away first. Cursor navigation, cursor arithmetic/state storage, and discarded local reads do not count as semantic consumers.'},routes:rows,summary:{targetRoutes:20,localCursorDataRoutes:17,cursorStackStateRoutes:3,newTerminalQualifiedRoutes:terminal,newStrongNonterminalConsumerRoutes:nonterminal,conditionalConsumerPathRoutes:conditional,structuralOnlyRoutes:structural,strictTerminalQualifiedAfterO95L:161+terminal,consumerQualifiedRoutesAfterO95L:183+terminal+nonterminal,routesWithoutAnyStrongQualifiedConsumerAfterO95L:70-terminal-nonterminal},decision:{allTwentyRoutesClassified:true,dynamicDispatchHasOnlyKnownConsumers:true,twoDynamicRoutesRemainConditional:true,fourRoutesRemainStructuralOnly:true,supportDataConsumerDoesNotImplyAnimationGrammar:true,humanMoveNamesEstablished:false,timingEstablished:false,verdict:'MK2_O95L_20_LOCAL_OR_STACK_STATE_ROUTES_CLASSIFIED_10_TERMINAL_4_NONTERMINAL_CONSUMERS_2_CONDITIONAL_4_STRUCTURAL_ONLY'},validation:{allChecksPassed:true,checks}};
}
