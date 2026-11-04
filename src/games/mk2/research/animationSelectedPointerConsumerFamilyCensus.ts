/** MK2 Family-A/B selected-pointer consumer-family census — O95H. */
import { DirectorySource, SourceFileEntry } from '../../../core/filesystem/DirectorySource';

type O95B={status:'SUCCESS';summary:{familyADirectCalls:number;familyBDirectCalls:number}};
type O95C={status:'SUCCESS';directConsumer:{familyADirectNextCallCount:number;familyBDirectNextCallCount:number}};
type O95D={status:'SUCCESS';summary:{directLookupInterpreterRoutes:number}};
type O95E={status:'SUCCESS'}; type O95F={status:'SUCCESS'};
type O95G={status:'SUCCESS';decision:{familyBUniversalStreamGrammarRejected:true};summary:{fixedNumericIdentityWitnessesTotal:number}};

const EXPECTED_EXE_SHA256='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const LOOKUP_A=0x918f1,LOOKUP_B=0x91909,INTERPRETER=0x63e79;
const STANDARD_WRAPPER=0x86825,REVERSE_CONSUMER=0x8684e,DUAL_WRAPPER=0x868ae,COUNTED_WRAPPER=0x63206,DWORD_WALKER=0x6334a,RELATED_HELPER=0x679f2,SPECIAL_LOOP=0x86c99,SPECIAL_CONSUMER=0x86cc5;
const PACKED_A=0x63b2d,PACKED_B=0x63b4b,DISPLACEMENT_WRAPPER=0x64ae5,OFFSET_WRAPPER=0x94b71,SCHEDULER_DISPATCH=0x63936;
const CODE_HASHES={
 interpreter:['6f0826bdac12e9f51ac2fc3af55bc915dea9fccfeedfd784ead73a41bea300cf',0x105] as const,
 standard:['2a1fefaa3d57d7d85efe17078e3fdc9225c91ce2ac1650f0c08492becfe66eba',0x29] as const,
 reverse:['2b342abff03f67a3237dee644222d6928ec81a39d7e5fbdb72eada177902610c',0x60] as const,
 dual:['8bdcc521ddbb8bdb4f48a09708ee9b683ef82fc0984f712230e73de493f618f0',0x54] as const,
 counted:['3a4314ad2eaa1c93c36811c73378f94a02b87c0e9effc177fa1c92b884e1f37f',0x61] as const,
 walker:['ad0121136ffc0948d045970c95153542cc9d00f0a44d59fe00153a1a8732ac66',0x16] as const,
 related:['24d4713308700ea5916e4c61fafd5d5d6a3a12a55dcf15e493889aa946fc34d5',0x5f] as const,
 specialLoop:['c99a2f1147f3731fa6cdcf6da328dd4c9d66eee4e12bc4d8ca83ef418fa363e6',0x2c] as const,
 specialConsumer:['5bb74d8fd65bbed5ce44290954fd6734a77b22d256fa005a34c9b04e2da616ab',0x8f] as const,
 packedA:['90baf7f99edb8045283578314580c5e7debbc09e8993425c47f3f41d39e619d4',0x1e] as const,
 packedB:['2fbd3704397295126d0a98b90a4df25227454b509de00cbca0c36d27a95bd132',0x1e] as const,
 displacement:['9250c863a839b56442a550e96c245f7590cf4137ac202ca895e5440e41a37bb5',0x23] as const,
 offset:['7c3ee14d95f0d4c92b100da1b89c2a1face6f75761573273036b0287a60d76cd',0x1a] as const,
 scheduler:['731422166421c17a527688d9ee686392e8c60f0fd50f0e81c0ac203b12635cc4',0x87] as const
};
const A_CURSOR_TRANSFORM_UNRESOLVED=[0x69c3d] as const;
const A_DWORD_WALKER=[0x7fdef] as const;
const A_LOCAL_CURSOR_DATA=[0x63345,0x68a70,0x68b5f,0x68eae,0x716e1,0x71d4c,0x721a4,0x7e3b1,0x7e629,0x83963,0x8458a,0x91829,0x91d3d,0x950af] as const;
const A_RELATED_OBJECT_STATE=[0x67481,0x688a3,0x68d37,0x68fc4,0x69496,0x69627,0x698cb,0x69ac5,0x69dea] as const;
const A_REVERSE_DWORD_SEQUENCE=[0x922dc] as const;
const A_SCHEDULER_OR_RESELECT=[0x69005,0x699ea,0x7159e,0x73ecb,0x73fbb,0x77d2b,0x7ba84,0x7bbeb,0x7bee8,0x7cde8,0x7ecfb,0x83b25,0x94ba9] as const;
const A_STANDARD_COMPOSITION=[0x63b40,0x63e54,0x63e74,0x64ade,0x677c2,0x68d00,0x68f44,0x6913b,0x69672,0x69e24,0x71dc5,0x71df0,0x71fb2,0x73400,0x73453,0x77c85,0x77ce8,0x7b81b,0x7bc7f,0x7bea8,0x7c851,0x7c9d4,0x7ca9c,0x7caf8,0x7cb25,0x7cc3d,0x7d020,0x7d06b,0x7d503,0x7e206,0x7e263,0x7f005,0x7f206,0x7f24d,0x7f275,0x7f398,0x7f50a,0x7f817,0x7fb30,0x7fb89,0x7fbbb,0x7fc36,0x8354e,0x835a4,0x838d0,0x83b63,0x83e50,0x84cd8,0x84de4,0x91d9a,0x91e09,0x9201d,0x92316,0x9233e,0x923f1,0x9277c,0x92a0f,0x92a32,0x92de1,0x930ea,0x94b6c,0x94bdd,0x950da,0x95152,0x951c1,0x9528f,0x953de,0x954ce,0x95daf,0x96489,0x96728,0x9835c,0x9857e,0x99121,0x99144,0x9bec2,0x9bf32,0x9c21d,0x9c393,0x9c6ce,0x9ca2a] as const;
const A_UNRESOLVED=[0x63901,0x6852f,0x688f5,0x68e1a,0x710f3,0x7114e,0x71579,0x71730,0x721e9,0x73f8a,0x7b5b6,0x7b9b0,0x7c771,0x7ddbb,0x7e6f0,0x7f487,0x83bb3,0x85000,0x918dd,0x92839,0x9520f,0x95d2f,0x9c415,0x9c644] as const;
const B_CURSOR_STACK_OR_STATE=[0x67dda,0x7c481,0x965a9] as const;
const B_DWORD_WALKER=[0x67778,0x679bc,0x67be2,0x67cac,0x68008,0x68282,0x682a2,0x68369,0x68754,0x691f9,0x693b3,0x7c6bc,0x9538a,0x9548e,0x95b69,0x95c1d,0x95fac,0x961ed,0x96284,0x97518,0x979de,0x97ad8] as const;
const B_LOCAL_CURSOR_DATA=[0x68bd8,0x69221,0x7a5dc] as const;
const B_RELATED_OBJECT_STATE=[0x6762c,0x67803,0x680b1,0x685d4,0x68673,0x68f18,0x690f0,0x69b43,0x7a4b8,0x835d2,0x95af6,0x95e51,0x965c3] as const;
const B_SCHEDULER_OR_RESELECT=[0x7ca42,0x9530f] as const;
const B_SPECIAL_DIRECT_DESCRIPTOR=[0x68c9f,0x7b05f] as const;
const B_STANDARD_COMPOSITION=[0x63b5e,0x64af7,0x675fb,0x67696,0x67877,0x67bb9,0x67c6e,0x67d60,0x6807a,0x6859c,0x6863c,0x68811,0x68a4d,0x7a389,0x7a413,0x7a4e4,0x7a58c,0x7a9ca,0x7aa0f,0x7ab51,0x7abf7,0x7ad44,0x7ad67,0x7ae09,0x7b177,0x7b60a,0x7c01d,0x7c083,0x7c0a8,0x7c68c,0x7cbb2,0x81026,0x810db,0x94b65,0x95009,0x95649,0x958a7,0x95906,0x95e28,0x95ef1,0x95f6f,0x9606c,0x9665f,0x967f7,0x96838,0x9689b,0x969d8,0x96b73,0x96e0f,0x972a6,0x9733b,0x973e3,0x97472,0x97678,0x9772b,0x97974,0x9d2d1] as const;
const B_UNRESOLVED=[0x63910,0x67f3b,0x686d6,0x7af49,0x7bf95,0x7c5d4,0x930dc] as const;

type ConsumerCategory='STANDARD_COMPOSITION'|'REVERSE_DWORD_SEQUENCE'|'SPECIAL_DIRECT_DESCRIPTOR'|'DWORD_WALKER'|'RELATED_OBJECT_STATE'|'LOCAL_CURSOR_DATA'|'SCHEDULER_OR_RESELECT'|'CURSOR_STACK_OR_STATE'|'CURSOR_TRANSFORM_UNRESOLVED'|'UNRESOLVED';
const CATEGORY_META:Record<ConsumerCategory,{confidence:'QUALIFIED_CONSUMER'|'STRUCTURAL_HANDOFF'|'UNRESOLVED';description:string}>= {
 STANDARD_COMPOSITION:{confidence:'QUALIFIED_CONSUMER',description:'Selected pointer reaches the O95C shared composition interpreter directly or through an authenticated wrapper/offset/count path that calls or tail-enters that interpreter.'},
 REVERSE_DWORD_SEQUENCE:{confidence:'QUALIFIED_CONSUMER',description:'Selected pointer reaches 0x8684E, which scans a zero-terminated DWORD sequence to its end and then walks backward with scheduler calls. It does not use the O95C token dispatcher in this bounded consumer.'},
 SPECIAL_DIRECT_DESCRIPTOR:{confidence:'QUALIFIED_CONSUMER',description:'Selected pointer reaches the O95G 0x86C99/0x86CC5 specialized consumer, where relocated/high-address tokens are direct 12-byte descriptor pointers.'},
 DWORD_WALKER:{confidence:'QUALIFIED_CONSUMER',description:'Selected pointer reaches 0x6334A, a zero-terminated DWORD walker that advances the shared cursor until a zero token. No render or animation-name semantics are assigned.'},
 RELATED_OBJECT_STATE:{confidence:'STRUCTURAL_HANDOFF',description:'Selected pointer is copied into secondary cursor/state or reaches the related-object helper path. This establishes a handoff, not a final animation grammar.'},
 LOCAL_CURSOR_DATA:{confidence:'STRUCTURAL_HANDOFF',description:'Selected pointer is locally loaded/dereferenced before a final qualified consumer can be established.'},
 SCHEDULER_OR_RESELECT:{confidence:'STRUCTURAL_HANDOFF',description:'The selected cursor enters scheduler/reselection machinery or is overwritten before a final qualified consumer is established.'},
 CURSOR_STACK_OR_STATE:{confidence:'STRUCTURAL_HANDOFF',description:'The selected cursor is saved/restored through stack/state machinery; final consumer remains open.'},
 CURSOR_TRANSFORM_UNRESOLVED:{confidence:'UNRESOLVED',description:'The selected cursor is transformed arithmetically but no qualified final consumer is established in the bounded continuation.'},
 UNRESOLVED:{confidence:'UNRESOLVED',description:'No qualified selected-pointer consumer is established within the bounded continuation used by O95H.'}
};

function i32(b:Uint8Array,o:number){return new DataView(b.buffer,b.byteOffset+o,4).getInt32(0,true);}
function find(es:SourceFileEntry[],name:string){const e=es.find(x=>x.path.toUpperCase()===name);if(!e)throw new Error(`Missing ${name}`);return e;}
function calls(exe:Uint8Array,target:number){const out:number[]=[];for(let p=0;p+5<=exe.length;p++)if(exe[p]===0xe8&&p+5+i32(exe,p+1)===target)out.push(p);return out;}
function hex(n:number){return `0x${n.toString(16).toUpperCase()}`;}
async function sha(b:Uint8Array){const d=await crypto.subtle.digest('SHA-256',b.slice().buffer);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function rel(exe:Uint8Array,p:number,op:number){return exe[p]===op?p+5+i32(exe,p+1):null;}
const TABLE:Record<'A'|'B',Record<ConsumerCategory,readonly number[]>>={A:{
 STANDARD_COMPOSITION:A_STANDARD_COMPOSITION,REVERSE_DWORD_SEQUENCE:A_REVERSE_DWORD_SEQUENCE,SPECIAL_DIRECT_DESCRIPTOR:[],DWORD_WALKER:A_DWORD_WALKER,RELATED_OBJECT_STATE:A_RELATED_OBJECT_STATE,LOCAL_CURSOR_DATA:A_LOCAL_CURSOR_DATA,SCHEDULER_OR_RESELECT:A_SCHEDULER_OR_RESELECT,CURSOR_STACK_OR_STATE:[],CURSOR_TRANSFORM_UNRESOLVED:A_CURSOR_TRANSFORM_UNRESOLVED,UNRESOLVED:A_UNRESOLVED
},B:{
 STANDARD_COMPOSITION:B_STANDARD_COMPOSITION,REVERSE_DWORD_SEQUENCE:[],SPECIAL_DIRECT_DESCRIPTOR:B_SPECIAL_DIRECT_DESCRIPTOR,DWORD_WALKER:B_DWORD_WALKER,RELATED_OBJECT_STATE:B_RELATED_OBJECT_STATE,LOCAL_CURSOR_DATA:B_LOCAL_CURSOR_DATA,SCHEDULER_OR_RESELECT:B_SCHEDULER_OR_RESELECT,CURSOR_STACK_OR_STATE:B_CURSOR_STACK_OR_STATE,CURSOR_TRANSFORM_UNRESOLVED:[],UNRESOLVED:B_UNRESOLVED
}};

export interface MK2AnimationSelectedPointerConsumerFamilyCensusReport{
 format:'mk2_animation_selected_pointer_consumer_family_census_o95h_v1';timestamp:string;status:'SUCCESS';provenance:{exeSha256:string;synthetic:false};
 lookupSurface:{familyACalls:number;familyBCalls:number;totalCalls:number;selectedPointerRegister:'EAX';selectedPointerMirrorGlobal:'0x75A78';classificationBoundary:string};
 consumerFamilies:Array<{category:ConsumerCategory;confidence:string;familyACalls:number;familyBCalls:number;totalCalls:number;description:string;callsites:Array<{family:'A'|'B';physical:number;physicalHex:string}>}>;
 architecture:{standardInterpreterPhysical:number;standardWrapperPhysical:number;reverseSequenceConsumerPhysical:number;dwordWalkerPhysical:number;specialDirectDescriptorLoopPhysical:number;specialDirectDescriptorConsumerPhysical:number;relatedObjectHelperPhysical:number;consumerDispatchRule:string};
 summary:{totalLookupCalls:number;standardCompositionCalls:number;reverseDwordSequenceCalls:number;specialDirectDescriptorCalls:number;dwordWalkerCalls:number;relatedObjectStateCalls:number;localCursorDataCalls:number;schedulerOrReselectCalls:number;cursorStackOrStateCalls:number;cursorTransformUnresolvedCalls:number;unresolvedCalls:number;qualifiedFinalConsumerCalls:number;structuralHandoffOrUnresolvedCalls:number};
 decision:{selectedPointerConsumerFamiliesCensused:true;standardCompositionDominantButNotUniversal:true;familyBUniversalGrammarRejected:true;reverseDwordSequenceConsumerEstablished:true;specialDirectDescriptorConsumerHasMultipleLookupRoutes:true;allLookupCallsSemanticallyResolved:false;timingEstablished:false;humanMoveNamesEstablished:false;verdict:string};
 validation:{allChecksPassed:true;checks:Array<{id:string;passed:boolean;detail:string}>};
}

export async function executeMK2AnimationSelectedPointerConsumerFamilyCensus(source:DirectorySource,o95b:O95B,o95c:O95C,o95d:O95D,o95e:O95E,o95f:O95F,o95g:O95G):Promise<MK2AnimationSelectedPointerConsumerFamilyCensusReport>{
 if(source.isSynthetic||[o95b.status,o95c.status,o95d.status,o95e.status,o95f.status,o95g.status].some(x=>x!=='SUCCESS'))throw new Error('O95H requires authentic O95B-O95G');
 const es=await source.listRecursive(),entry=find(es,'MK2.EXE'),exe=await source.readSlice(entry.path,0,entry.size);if(await sha(exe)!==EXPECTED_EXE_SHA256)throw new Error('MK2.EXE identity mismatch');
 const checks:Array<{id:string;passed:boolean;detail:string}>=[];const ck=(id:string,passed:boolean,detail:string)=>{checks.push({id,passed,detail});if(!passed)throw new Error(`O95H ${id}: ${detail}`);};
 const actualA=calls(exe,LOOKUP_A),actualB=calls(exe,LOOKUP_B);ck('lookup_counts',actualA.length===144&&actualB.length===109,`${actualA.length}/${actualB.length}`);ck('o95b_counts',o95b.summary.familyADirectCalls===144&&o95b.summary.familyBDirectCalls===109,`${o95b.summary.familyADirectCalls}/${o95b.summary.familyBDirectCalls}`);ck('o95d_direct_standard_subset',o95d.summary.directLookupInterpreterRoutes===28,String(o95d.summary.directLookupInterpreterRoutes));ck('o95g_heterogeneity',o95g.decision.familyBUniversalStreamGrammarRejected===true&&o95g.summary.fixedNumericIdentityWitnessesTotal===5,String(o95g.summary.fixedNumericIdentityWitnessesTotal));
 for(const [name,start] of [['interpreter',INTERPRETER],['standard',STANDARD_WRAPPER],['reverse',REVERSE_CONSUMER],['dual',DUAL_WRAPPER],['counted',COUNTED_WRAPPER],['walker',DWORD_WALKER],['related',RELATED_HELPER],['specialLoop',SPECIAL_LOOP],['specialConsumer',SPECIAL_CONSUMER],['packedA',PACKED_A],['packedB',PACKED_B],['displacement',DISPLACEMENT_WRAPPER],['offset',OFFSET_WRAPPER],['scheduler',SCHEDULER_DISPATCH]] as const){const [h,n]=CODE_HASHES[name];ck(`hash_${name}`,await sha(exe.slice(start,start+n))===h,h);}
 ck('standard_wrapper_calls_interpreter',rel(exe,0x8682d,0xe8)===INTERPRETER,hex(rel(exe,0x8682d,0xe8)??0));ck('counted_wrapper_calls_interpreter',rel(exe,0x63234,0xe8)===INTERPRETER,hex(rel(exe,0x63234,0xe8)??0));ck('dual_wrapper_first_interpreter',rel(exe,0x868c7,0xe8)===INTERPRETER,hex(rel(exe,0x868c7,0xe8)??0));ck('dual_wrapper_second_interpreter',rel(exe,0x868e7,0xe8)===INTERPRETER,hex(rel(exe,0x868e7,0xe8)??0));ck('displacement_wrapper_to_interpreter',rel(exe,0x64b03,0xe9)===INTERPRETER,hex(rel(exe,0x64b03,0xe9)??0));ck('offset_wrapper_to_interpreter',rel(exe,0x94b86,0xe9)===INTERPRETER,hex(rel(exe,0x94b86,0xe9)??0));
 ck('reverse_consumer_is_distinct',exe.slice(REVERSE_CONSUMER,DUAL_WRAPPER).every((_,i)=>!(exe[REVERSE_CONSUMER+i]===0xe8&&rel(exe,REVERSE_CONSUMER+i,0xe8)===INTERPRETER)),'no direct O95C interpreter call inside 0x8684E..0x868AD');
 ck('walker_shape',exe.slice(DWORD_WALKER,DWORD_WALKER+5).every((v,i)=>v===[0xa1,0x78,0x5a,0x07,0x00][i])&&exe.slice(0x6334f,0x63351).every((v,i)=>v===[0x8b,0x00][i])&&exe.slice(0x63351,0x63358).every((v,i)=>v===[0x83,0x05,0x78,0x5a,0x07,0x00,0x04][i]),hex(DWORD_WALKER));
 ck('special_two_lookup_routes',B_SPECIAL_DIRECT_DESCRIPTOR.length===2&&B_SPECIAL_DIRECT_DESCRIPTOR[0]===0x68c9f&&B_SPECIAL_DIRECT_DESCRIPTOR[1]===0x7b05f,B_SPECIAL_DIRECT_DESCRIPTOR.map(hex).join(','));ck('special_route_dynamic_jumps_loop',rel(exe,0x68ce0,0xe9)===SPECIAL_LOOP,hex(rel(exe,0x68ce0,0xe9)??0));ck('special_route_fixed_jumps_loop',rel(exe,0x7b073,0xe9)===SPECIAL_LOOP,hex(rel(exe,0x7b073,0xe9)??0));ck('reverse_route',A_REVERSE_DWORD_SEQUENCE.length===1&&A_REVERSE_DWORD_SEQUENCE[0]===0x922dc&&rel(exe,0x922f7,0xe9)===REVERSE_CONSUMER,hex(rel(exe,0x922f7,0xe9)??0));
 const categories=Object.keys(CATEGORY_META) as ConsumerCategory[];const families=[] as MK2AnimationSelectedPointerConsumerFamilyCensusReport['consumerFamilies'];const unionA:number[]=[],unionB:number[]=[];for(const cat of categories){const a=[...TABLE.A[cat]],b=[...TABLE.B[cat]];unionA.push(...a);unionB.push(...b);for(const p of a)ck(`A_${cat}_${hex(p)}`,rel(exe,p,0xe8)===LOOKUP_A,hex(p));for(const p of b)ck(`B_${cat}_${hex(p)}`,rel(exe,p,0xe8)===LOOKUP_B,hex(p));families.push({category:cat,confidence:CATEGORY_META[cat].confidence,familyACalls:a.length,familyBCalls:b.length,totalCalls:a.length+b.length,description:CATEGORY_META[cat].description,callsites:[...a.map(p=>({family:'A' as const,physical:p,physicalHex:hex(p)})),...b.map(p=>({family:'B' as const,physical:p,physicalHex:hex(p)}))].sort((x,y)=>x.physical-y.physical)});}
 const sorted=(xs:number[])=>[...xs].sort((a,b)=>a-b);ck('familyA_partition',JSON.stringify(sorted(unionA))===JSON.stringify(sorted(actualA)),`${unionA.length}/${actualA.length}`);ck('familyB_partition',JSON.stringify(sorted(unionB))===JSON.stringify(sorted(actualB)),`${unionB.length}/${actualB.length}`);ck('partition_no_duplicates',new Set(unionA).size===unionA.length&&new Set(unionB).size===unionB.length,`${new Set(unionA).size}/${unionA.length} ${new Set(unionB).size}/${unionB.length}`);
 const count=(c:ConsumerCategory)=>families.find(x=>x.category===c)!.totalCalls;const qualified=count('STANDARD_COMPOSITION')+count('REVERSE_DWORD_SEQUENCE')+count('SPECIAL_DIRECT_DESCRIPTOR')+count('DWORD_WALKER');const unresolved=253-qualified;
 ck('category_counts',count('STANDARD_COMPOSITION')===138&&count('REVERSE_DWORD_SEQUENCE')===1&&count('SPECIAL_DIRECT_DESCRIPTOR')===2&&count('DWORD_WALKER')===23&&count('RELATED_OBJECT_STATE')===22&&count('LOCAL_CURSOR_DATA')===17&&count('SCHEDULER_OR_RESELECT')===15&&count('CURSOR_STACK_OR_STATE')===3&&count('CURSOR_TRANSFORM_UNRESOLVED')===1&&count('UNRESOLVED')===31,families.map(x=>`${x.category}=${x.totalCalls}`).join(','));
 return {format:'mk2_animation_selected_pointer_consumer_family_census_o95h_v1',timestamp:new Date().toISOString(),status:'SUCCESS',provenance:{exeSha256:EXPECTED_EXE_SHA256,synthetic:false},lookupSurface:{familyACalls:actualA.length,familyBCalls:actualB.length,totalCalls:actualA.length+actualB.length,selectedPointerRegister:'EAX',selectedPointerMirrorGlobal:'0x75A78',classificationBoundary:'O95H partitions all 253 authenticated lookup callsites by the first qualified selected-pointer consumer or bounded structural handoff established from canonical instruction-boundary analysis. Unresolved categories remain explicit; this is not a claim that every callsite has complete downstream semantics.'},consumerFamilies:families,architecture:{standardInterpreterPhysical:INTERPRETER,standardWrapperPhysical:STANDARD_WRAPPER,reverseSequenceConsumerPhysical:REVERSE_CONSUMER,dwordWalkerPhysical:DWORD_WALKER,specialDirectDescriptorLoopPhysical:SPECIAL_LOOP,specialDirectDescriptorConsumerPhysical:SPECIAL_CONSUMER,relatedObjectHelperPhysical:RELATED_HELPER,consumerDispatchRule:'Selected-pointer table family alone is insufficient. Decode/interpret only under the authenticated downstream consumer family reached by the executable path.'},summary:{totalLookupCalls:253,standardCompositionCalls:count('STANDARD_COMPOSITION'),reverseDwordSequenceCalls:count('REVERSE_DWORD_SEQUENCE'),specialDirectDescriptorCalls:count('SPECIAL_DIRECT_DESCRIPTOR'),dwordWalkerCalls:count('DWORD_WALKER'),relatedObjectStateCalls:count('RELATED_OBJECT_STATE'),localCursorDataCalls:count('LOCAL_CURSOR_DATA'),schedulerOrReselectCalls:count('SCHEDULER_OR_RESELECT'),cursorStackOrStateCalls:count('CURSOR_STACK_OR_STATE'),cursorTransformUnresolvedCalls:count('CURSOR_TRANSFORM_UNRESOLVED'),unresolvedCalls:count('UNRESOLVED'),qualifiedFinalConsumerCalls:qualified,structuralHandoffOrUnresolvedCalls:unresolved},decision:{selectedPointerConsumerFamiliesCensused:true,standardCompositionDominantButNotUniversal:true,familyBUniversalGrammarRejected:true,reverseDwordSequenceConsumerEstablished:true,specialDirectDescriptorConsumerHasMultipleLookupRoutes:true,allLookupCallsSemanticallyResolved:false,timingEstablished:false,humanMoveNamesEstablished:false,verdict:'MK2_O95H_253_LOOKUP_CALLS_PARTITIONED_ACROSS_MULTIPLE_SELECTED_POINTER_CONSUMER_FAMILIES'},validation:{allChecksPassed:true,checks}};
}
