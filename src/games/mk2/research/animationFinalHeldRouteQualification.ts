/** MK2 O95O: final 16 held selected-pointer routes, by original uncertainty class.
 * Fail-closed: only whole, preserved selected-pointer flow to an authenticated
 * consumer is promoted; conditional consumers are not included in strong totals.
 */
import { DirectorySource, SourceFileEntry } from '../../../core/filesystem/DirectorySource';
type Base={status:'SUCCESS'};
type O95H=Base & {consumerFamilies:Array<{category:string;callsites:Array<{family:'A'|'B';physical:number}>}>};
type O95J=Base & {routes:Array<{family:'A'|'B';lookupCallPhysical:number;subtype:string}>};
type O95L=Base & {routes:Array<{family:'A'|'B';lookupCallPhysical:number;qualification:string}>};
type O95M=Base & {routes:Array<{family:'A'|'B';lookupCallPhysical:number;qualification:string}>};
type O95N=Base & {routes:Array<{family:'A'|'B';lookupCallPhysical:number;qualification:string}>;summary:{strictTerminalQualifiedAfterO95N:number;consumerQualifiedRoutesAfterO95N:number;routesWithoutAnyStrongQualifiedConsumerAfterO95N:number}};
const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const A=0x918f1,B=0x91909,DYN=0x6435a;
type Family='A'|'B';type Q='TERMINAL_QUALIFIED'|'CONDITIONAL_CONSUMER_PATH'|'STRUCTURAL_ONLY';
type Class='O95H_CURSOR_TRANSFORM'|'O95J_CURSOR_REPLACED'|'O95L_STRUCTURAL'|'O95L_CONDITIONAL'|'O95M_RESELECT_OVERWRITE'|'O95N_STRUCTURAL';
type Row={family:Family;p:number;origin:Class;qualification:Q;subtype:string;consumer?:number;detail:string};
const R:Row[]=[
 {family:'A',p:0x69c3d,origin:'O95H_CURSOR_TRANSFORM',qualification:'TERMINAL_QUALIFIED',subtype:'PLUS_0X10_SELECTED_CURSOR_DYNAMIC_DISPATCH',consumer:DYN,detail:'The selected cursor is advanced by exactly 0x10 bytes, then passes a bounded read-only lookup helper and cadence setup to the authenticated dynamic consumer 0x6435A. +0x10 is only a byte displacement.'},
 {family:'B',p:0x67cac,origin:'O95J_CURSOR_REPLACED',qualification:'CONDITIONAL_CONSUMER_PATH',subtype:'PRE_OVERWRITE_DISPATCH_WITH_AUDIO_HELPER',consumer:DYN,detail:'After three authenticated segment skips and scheduler yield, control can reach 0x6435A at 0x67CFE before later overwrite 0x67D56. The intervening conditional audio helper is not universally proven cursor-preserving; do not add this to strong coverage.'},
 {family:'B',p:0x95b69,origin:'O95J_CURSOR_REPLACED',qualification:'TERMINAL_QUALIFIED',subtype:'TWO_SKIPS_YIELD_DYNAMIC_BEFORE_OVERWRITE',consumer:DYN,detail:'Two exact zero-terminated segment skips, bounded position comparison and cadence setup, and verified scheduler cursor save/restore lead to 0x6435A at 0x95BA7 before overwrite 0x95C13.'},
 {family:'B',p:0x961ed,origin:'O95J_CURSOR_REPLACED',qualification:'STRUCTURAL_ONLY',subtype:'CURSOR_OVERWRITTEN_AFTER_SKIP',detail:'The selected cursor undergoes one segment skip, then 0x961F7 writes a fresh selection index before any qualified consumer.'},
 {family:'A',p:0x63345,origin:'O95L_STRUCTURAL',qualification:'STRUCTURAL_ONLY',subtype:'ZERO_TERMINATED_SEGMENT_SKIP_ONLY',detail:'Entry reaches zero-terminated DWORD segment navigator 0x6334A and returns with no bounded semantic consumer in this routine.'},
 {family:'A',p:0x68eae,origin:'O95L_STRUCTURAL',qualification:'STRUCTURAL_ONLY',subtype:'NESTED_FIELD_READ_THEN_RESELECTION',detail:'The nested +0x0C field is read into EAX, then the cursor is overwritten at 0x68EBF and control transfers to a Family-B selection wrapper without a proven use of that EAX value.'},
 {family:'A',p:0x716e1,origin:'O95L_CONDITIONAL',qualification:'CONDITIONAL_CONSUMER_PATH',subtype:'INDIRECT_EXIT_BEFORE_DISPATCH',consumer:DYN,detail:'Authenticated dispatcher 0x6435A is downstream at 0x71704, but helper 0x70F30 executes first and may transfer control via a computed jump.'},
 {family:'A',p:0x721a4,origin:'O95L_CONDITIONAL',qualification:'CONDITIONAL_CONSUMER_PATH',subtype:'INDIRECT_EXIT_BEFORE_DISPATCH',consumer:DYN,detail:'Authenticated dispatcher 0x6435A is downstream at 0x721C7, but helper 0x70F30 executes first and may transfer control via a computed jump.'},
 {family:'A',p:0x7e629,origin:'O95L_STRUCTURAL',qualification:'STRUCTURAL_ONLY',subtype:'ZERO_TERMINATED_CURSOR_BACKTRACK_ONLY',detail:'Helper 0x7E62E scans to zero DWORD, backs cursor up eight bytes at 0x7E643 and returns. That is cursor navigation, not terminal semantic consumption.'},
 {family:'A',p:0x91d3d,origin:'O95L_STRUCTURAL',qualification:'CONDITIONAL_CONSUMER_PATH',subtype:'MULTIPLE_NONLOCAL_EXITS_BEFORE_DISPATCH',consumer:DYN,detail:'A selected cursor is saved and yielded, and one bounded returning path reaches 0x6435A at 0x91D64, but helpers 0x931C0, 0x632B8 and 0x91DC3 may redirect/exit before that call. No universal consumer qualification.'},
 {family:'A',p:0x699ea,origin:'O95M_RESELECT_OVERWRITE',qualification:'STRUCTURAL_ONLY',subtype:'PACKED_FAMILY_B_RESELECT_OVERWRITE',detail:'Original selected pointer is overwritten by packed 0x00040001 at 0x69A25 before Family-B wrapper entry at 0x69A39.'},
 {family:'A',p:0x63901,origin:'O95N_STRUCTURAL',qualification:'STRUCTURAL_ONLY',subtype:'GENERIC_SELECTOR_BRANCH_RETURN',detail:'Generic wrapper internal branch returns selected cursor; no selected-pointer semantic consumer is universally bound to this internal lookup.'},
 {family:'B',p:0x63910,origin:'O95N_STRUCTURAL',qualification:'STRUCTURAL_ONLY',subtype:'GENERIC_SELECTOR_BRANCH_RETURN',detail:'Generic wrapper internal branch returns selected cursor; no selected-pointer semantic consumer is universally bound to this internal lookup.'},
 {family:'A',p:0x71579,origin:'O95N_STRUCTURAL',qualification:'STRUCTURAL_ONLY',subtype:'ALTERNATE_BRANCH_JUMPS_PAST_SECOND_LOOKUP_TO_CALLBACK_WRAPPER',detail:'CORRECTION TO O95N: 0x71583 jumps to 0x715A8, bypassing later lookup 0x7159E. It instead tail-enters 0x6394C at 0x715D0; that branch skips explicit callback-global clearing, so the callback-mediated selected-pointer provenance is unqualified.'},
 {family:'A',p:0x73f8a,origin:'O95N_STRUCTURAL',qualification:'STRUCTURAL_ONLY',subtype:'ALTERNATE_BRANCH_JUMPS_PAST_SECOND_LOOKUP_TO_CALLBACK_WRAPPER',detail:'CORRECTION TO O95N: 0x73F94 jumps to 0x73FC5, bypassing later lookup 0x73FBB. It instead tail-enters 0x6394C at 0x73FED; that branch skips explicit callback-global clearing, so the callback-mediated selected-pointer provenance is unqualified.'},
 {family:'A',p:0x918dd,origin:'O95N_STRUCTURAL',qualification:'STRUCTURAL_ONLY',subtype:'SCALAR_CADENCE_SETUP_ONLY',detail:'The selected cursor is established, scalar helper 0x64ECA runs, then the routine tail-enters cadence setup 0x6433F, with no bounded selected-pointer semantic consumer.'},
];
function i32(b:Uint8Array,o:number){return new DataView(b.buffer,b.byteOffset+o,4).getInt32(0,true)};
function rel(b:Uint8Array,p:number){return p+5<=b.length&&(b[p]===0xe8||b[p]===0xe9)?p+5+i32(b,p+1):null}
function eq(b:Uint8Array,p:number,v:number[]){return v.every((x,i)=>b[p+i]===x)}
function shortJmp(b:Uint8Array,p:number){return b[p]===0xeb?p+2+(b[p+1]<<24>>24):null}
function hex(n:number){return `0x${n.toString(16).toUpperCase()}`}
async function sha(b:Uint8Array){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',b.slice().buffer))].map(x=>x.toString(16).padStart(2,'0')).join('')}
function find(es:SourceFileEntry[],n:string){const e=es.find(x=>x.path.toUpperCase()===n);if(!e)throw new Error(`Missing ${n}`);return e}
export async function executeMK2AnimationFinalHeldRouteQualification(source:DirectorySource,h:O95H,j:O95J,l:O95L,m:O95M,n:O95N){
 if(source.isSynthetic||[h,j,l,m,n].some(x=>x.status!=='SUCCESS'))throw new Error('O95O authentic prior reports required');
 const es=await source.listRecursive(),e=find(es,'MK2.EXE'),b=await source.readSlice(e.path,0,e.size);
 if(await sha(b)!==EXE_SHA)throw new Error('O95O authentic MK2.EXE SHA-256 mismatch');
 const checks:Array<{id:string;passed:boolean;detail:string}>=[];
 const ck=(id:string,ok:boolean,detail:string)=>{checks.push({id,passed:ok,detail});if(!ok)throw new Error(`O95O ${id}: ${detail}`)};
 const hroute=h.consumerFamilies.find(x=>x.category==='CURSOR_TRANSFORM_UNRESOLVED')?.callsites??[];
 const jroute=j.routes.filter(x=>x.subtype==='CURSOR_REPLACED_BEFORE_TERMINAL');
 const lroute=l.routes.filter(x=>x.qualification==='STRUCTURAL_ONLY'||x.qualification==='CONDITIONAL_CONSUMER_PATH');
 const mroute=m.routes.filter(x=>x.qualification==='STRUCTURAL_ONLY');
 const nroute=n.routes.filter(x=>x.qualification==='STRUCTURAL_ONLY');
 const groups:[Class,Array<{family:Family;physical:number}>][]=[
  ['O95H_CURSOR_TRANSFORM',hroute.map(x=>({family:x.family,physical:x.physical}))],
  ['O95J_CURSOR_REPLACED',jroute.map(x=>({family:x.family,physical:x.lookupCallPhysical}))],
  ['O95L_STRUCTURAL',lroute.filter(x=>x.qualification==='STRUCTURAL_ONLY').map(x=>({family:x.family,physical:x.lookupCallPhysical}))],
  ['O95L_CONDITIONAL',lroute.filter(x=>x.qualification==='CONDITIONAL_CONSUMER_PATH').map(x=>({family:x.family,physical:x.lookupCallPhysical}))],
  ['O95M_RESELECT_OVERWRITE',mroute.map(x=>({family:x.family,physical:x.lookupCallPhysical}))],
  ['O95N_STRUCTURAL',nroute.map(x=>({family:x.family,physical:x.lookupCallPhysical}))]
 ];
 const expected=[1,3,4,2,1,5];
 for(let i=0;i<groups.length;i++){
  const [cls,items]=groups[i],ours=R.filter(x=>x.origin===cls).map(x=>`${x.family}:${x.p}`).sort();
  ck(`origin_${cls}`,items.length===expected[i]&&JSON.stringify(items.map(x=>`${x.family}:${x.physical}`).sort())===JSON.stringify(ours),`${items.length}/${ours.length}`);
 }
 const identities=R.map(x=>`${x.family}:${x.p}`);ck('six_disjoint_classes_16_routes',R.length===16&&new Set(identities).size===16,String(R.length));
 for(const r of R)ck(`lookup_${hex(r.p)}`,rel(b,r.p)===(r.family==='A'?A:B),`${hex(r.p)} -> ${hex(rel(b,r.p)??0)}`);
 ck('baseline',n.summary.strictTerminalQualifiedAfterO95N===208&&n.summary.consumerQualifiedRoutesAfterO95N===237&&n.summary.routesWithoutAnyStrongQualifiedConsumerAfterO95N===16,JSON.stringify(n.summary));
 ck('known_dispatch_hash',await sha(b.slice(DYN,DYN+0x34))==='51be30b495b2193ae81758d17162fe22011a2edbd4808b84548de5f91b79a3a2',hex(DYN));
 // Newly terminal-qualified Family A selected-pointer +16 derivative.
 ck('transform_plus16',eq(b,0x69c42,[0x83,0x05,0x78,0x5a,0x07,0x00,0x10]),hex(0x69c42));
 ck('transform_helpers',rel(b,0x69c53)===0x67aef&&rel(b,0x69c5d)===0x6433f&&rel(b,0x69c62)===DYN,'0x67AEF/0x6433F/0x6435A');
 ck('transform_lookup_helper_exact',eq(b,0x67aef,[0xe8,0x0c,0xa0,0x01,0x00,0x89,0x46,0x20,0xc3])&&eq(b,0x81b00,[0x8b,0x5f,0x46,0xc1,0xe3,0x02,0xc1,0xe0,0x02,0x81,0xc3,0x9c,0x49,0x01,0x00,0x8b,0x1b,0x03,0xc3,0x8b,0x00,0xc3]),'bounded read-only table lookup');
 ck('cadence_helper_exact',eq(b,0x6433f,[0x98,0x3d,0xff,0x0f,0x00,0x00])&&b[0x64352]===0xc3&&b[0x64359]===0xc3,'no global cursor write');
 // Newly terminal-qualified Family B two skips and scheduler save/restore, before later overwrite.
 ck('two_segment_skips',rel(b,0x95b6e)===0x6334a&&rel(b,0x95b73)===0x6334a,'2 authenticated skips');
 ck('two_skip_helpers',rel(b,0x95b82)===0x643d6&&rel(b,0x95b98)===0x6433f&&rel(b,0x95ba2)===0x6710f&&rel(b,0x95ba7)===DYN,'state compare/cadence/yield/dynamic');
 ck('position_compare_bounded',eq(b,0x643d6,[0x52,0x8b,0x56,0x28,0x8b,0x52,0x18,0x8b,0x4f,0x18,0x3b,0xd1,0x5a,0x7f,0x02,0xf8,0xc3,0xf9,0xc3]),'comparison helper does not replace cursor');
 ck('j_reselect_after_consumer',eq(b,0x95c13,[0xc7,0x05,0x78,0x5a,0x07,0x00,0x01,0x00,0x00,0x00])&&0x95ba7<0x95c13,'later lookup not back-propagated');
 // Remaining conditional routes: bounded consumer branches exist but are not promoted.
 ck('j67_conditional',rel(b,0x67cfe)===DYN&&rel(b,0x67cf7)===0x8140e&&rel(b,0x67cd9)===0x6710f&&eq(b,0x67d56,[0xc7,0x05,0x78,0x5a,0x07,0x00,0x02]),'audio helper before known dynamic, later overwrite');
 ck('l91_conditional',rel(b,0x91d55)===0x931c0&&rel(b,0x91d5a)===0x632b8&&rel(b,0x91d5f)===0x91dc3&&rel(b,0x91d64)===DYN,'nonlocal helper exits remain');
 ck('l70f30_conditional',rel(b,0x716ff)===0x70f30&&rel(b,0x71704)===DYN&&rel(b,0x721c2)===0x70f30&&rel(b,0x721c7)===DYN&&eq(b,0x70ffb,[0xff,0xe3]),'computed jump can divert');
 // Explicit correction: later lookup is on a branch skipped by the O95N route.
 ck('n715_branch_correction',shortJmp(b,0x71583)===0x715a8&&rel(b,0x7159e)===A&&rel(b,0x715d0)===0x6394c,'0x71579 skips 0x7159E and tail-enters alternate wrapper');
 ck('n73f_branch_correction',shortJmp(b,0x73f94)===0x73fc5&&rel(b,0x73fbb)===A&&rel(b,0x73fed)===0x6394c,'0x73F8A skips 0x73FBB and tail-enters alternate wrapper');
 ck('n_wrapper_callback_unknown',eq(b,0x639e9,[0xf7,0x05,0x70,0x5a,0x07,0x00])&&eq(b,0x639fb,[0xff,0x15,0x70,0x5a,0x07,0x00])&&rel(b,0x63a07)===DYN,'callback global can redirect/modify state, no automatic provenance');
 // Preserved holds, grounded in explicit instruction boundaries.
 ck('j961_overwrite',eq(b,0x961f7,[0xc7,0x05,0x78,0x5a,0x07,0x00,0x3d]),hex(0x961f7));
 ck('l68_overwrite',eq(b,0x68ebf,[0xc7,0x05,0x78,0x5a,0x07,0x00,0x01,0x00,0x04,0x00]),hex(0x68ebf));
 ck('m699_overwrite',eq(b,0x69a25,[0xc7,0x05,0x78,0x5a,0x07,0x00,0x01,0x00,0x04,0x00]),hex(0x69a25));
 ck('l_segment_skip_and_return',rel(b,0x63345)===A&&b[0x6335f]===0xc3,'navigation only');
 ck('l_transform_and_return',rel(b,0x7e629)===A&&eq(b,0x7e643,[0x83,0x2d,0x78,0x5a,0x07,0x00,0x08])&&b[0x7e64a]===0xc3,'navigation only');
 ck('n_generic_selector_return',eq(b,0x63933,[0x5e,0x5f,0xc3]),'return without bounded semantic consumer');
 ck('n_setup_only',rel(b,0x918e7)===0x64eca&&rel(b,0x918ec)===0x6433f,'scalar/cadence only');
 const terminal=R.filter(x=>x.qualification==='TERMINAL_QUALIFIED').length,conditional=R.filter(x=>x.qualification==='CONDITIONAL_CONSUMER_PATH').length,structural=R.filter(x=>x.qualification==='STRUCTURAL_ONLY').length;
 ck('counts',terminal===2&&conditional===4&&structural===10,`${terminal}/${conditional}/${structural}`);
 return {format:'mk2_animation_final_held_route_qualification_o95o_v1',timestamp:new Date().toISOString(),status:'SUCCESS',provenance:{exeSha256:EXE_SHA,synthetic:false},methodology:{scope:'The exact 16 previously held calls from O95H/J/L/M/N. No cross-class inference.',qualificationRule:'TERMINAL requires authenticated preserved selected pointer (or bounded +byte derivative) to the known dispatcher; CONDITIONAL and STRUCTURAL do not contribute to strong coverage.',selectedCursorGlobal:'0x75A78',dynamicConsumer:'0x6435A'},routes:R.map(r=>({family:r.family,lookupCallPhysical:r.p,lookupCallPhysicalHex:hex(r.p),originClass:r.origin,qualification:r.qualification,subtype:r.subtype,consumerPhysical:r.consumer??null,consumerPhysicalHex:r.consumer?hex(r.consumer):null,detail:r.detail})),summary:{targetRoutes:16,newTerminalQualifiedRoutes:terminal,conditionalConsumerRoutes:conditional,structuralOnlyRoutes:structural,strictTerminalQualifiedAfterO95O:208+terminal,strongConsumerQualifiedAfterO95O:237+terminal,routesWithoutAnyStrongQualifiedConsumerAfterO95O:16-terminal,remainingWeakByOrigin:{O95H:0,O95J:2,O95L:6,O95M:1,O95N:5}},corrections:{o95nBranchOverwritesReinterpreted:['0x71579','0x73F8A'],nature:'These two lookups branch around, rather than execute, later alternate-path lookups. They remain held due to unqualified callback state in 0x6394C, not overwritten-by-later-lookup.',preOverwriteDispatchFound:['0x67CAC','0x95B69']},decision:{allSixteenHeldRoutesAccountedFor:true,twoNewStrictTerminalQualified:true,conditionalPathsNotPromoted:true,branchInterpretationsCorrected:true,moveNamesEstablished:false,fighterNamesEstablished:false,wallClockTimingEstablished:false,completeMK2AnimationCoverageEstablished:false,verdict:'MK2_O95O_16_HELD_ROUTES_REVIEWED_2_NEW_TERMINAL_4_CONDITIONAL_10_STRUCTURAL_14_WITHOUT_STRONG_CONSUMER'},validation:{allChecksPassed:true,checks}};
}
