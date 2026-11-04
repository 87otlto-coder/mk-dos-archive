#!/usr/bin/env python3
import sys,json,struct,hashlib
from pathlib import Path
if len(sys.argv)<4: raise SystemExit('Usage: verify-mk2-o95l-animation-local-cursor-state-continuation-qualification.py <MK2.EXE> <o95h-json> <o95l-json>')
exe_path=Path(sys.argv[1]);hrep=json.loads(Path(sys.argv[2]).read_text());rep=json.loads(Path(sys.argv[3]).read_text());b=exe_path.read_bytes();checks=[]
def ck(n,c,d=''):
 checks.append((n,bool(c),d))
 if not c: raise AssertionError(f'{n}: {d}')
def i32(o):return struct.unpack_from('<i',b,o)[0]
def u32(o):return struct.unpack_from('<I',b,o)[0]
def rel(p):return p+5+i32(p+1) if p+5<=len(b) and b[p] in (0xe8,0xe9) else None
def relj(p):return p+6+i32(p+2) if p+6<=len(b) and b[p]==0x0f and b[p+1] in range(0x80,0x90) else None
def eq(o,v):return b[o:o+len(v)]==bytes(v)
def h(p,n):return hashlib.sha256(b[p:p+n]).hexdigest()
def hx(n):return f'0x{n:X}'
ck('exe_sha',hashlib.sha256(b).hexdigest()=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
A=0x918f1;B=0x91909;I=0x63e79;W=0x6334a;SECOND=0x64823;DISP=0x6435a;RELHELP=0x679f2;FINIT=0x64522;NEST=0x74653;NESTI=0x746b7;DUAL=0x868ae;RENDER=0x9377c;TRANS=0x7e62e
for name,p,n,want in [
 ('walker',W,0x16,'ad0121136ffc0948d045970c95153542cc9d00f0a44d59fe00153a1a8732ac66'),
 ('secondary',SECOND,0x3c,'e5ab582bb5890441147ee98bd479c61a57b8b23216b5ef9878c59ed07ebb47fe'),
 ('dispatch',DISP,0x34,'51be30b495b2193ae81758d17162fe22011a2edbd4808b84548de5f91b79a3a2'),
 ('frame_init',FINIT,0x1f,'e9eb0f39085d3af99087c3df8538659c84c5f97eefc04c3a0dfeb4a4352db956'),
 ('nested',NEST,0x15,'694c88b3508a39f3e0590ee82d7640510386592e64725c0a97e5da61788b44e2'),
 ('nested_inner',NESTI,0x2d,'8ca962b7fb55287a577e0e211f9ea6c3a55473e74cd465e90cfcc1034b0af858'),
 ('interpreter',I,0x105,'6f0826bdac12e9f51ac2fc3af55bc915dea9fccfeedfd784ead73a41bea300cf'),
 ('dual',DUAL,0x54,'8bdcc521ddbb8bdb4f48a09708ee9b683ef82fc0984f712230e73de493f618f0'),
 ('transform',TRANS,0x1d,'501629638aca917e16b3e8f6e5f2f614b79d5a76153af495241ed3fd51871c9e'),
 ('renderer',RENDER,0x60,'511c9dcf0a44cc82fef3ac59e537c867ac4fd9aad528641a600744e5c17d5063')]: ck('hash_'+name,h(p,n)==want,h(p,n))
# Independently recover the O95H target set.
local=next(x for x in hrep['consumerFamilies'] if x['category']=='LOCAL_CURSOR_DATA')['callsites'];stack=next(x for x in hrep['consumerFamilies'] if x['category']=='CURSOR_STACK_OR_STATE')['callsites'];target={(x['family'],x['physical']) for x in local+stack}
ck('target_count',len(local)==17 and len(stack)==3 and len(target)==20,str((len(local),len(stack),len(target))))
expected={
 'SECONDARY_CURSOR_STANDARD_COMPOSITION':{('A',0x68a70),('A',0x68b5f)},
 'DIRECT_REPLAY_STANDARD_COMPOSITION':{('B',0x68bd8),('B',0x7a5dc)},
 'STACK_RESTORE_STANDARD_COMPOSITION':{('B',0x67dda),('B',0x965a9)},
 'DYNAMIC_KNOWN_CONSUMER_DISPATCH':{('A',0x71d4c),('A',0x7e3b1),('A',0x91829),('B',0x7c481)},
 'CONDITIONAL_DYNAMIC_KNOWN_CONSUMER_DISPATCH':{('A',0x716e1),('A',0x721a4)},
 'COUNTED_DIRECT_DESCRIPTOR_RENDER':{('B',0x69221)},
 'FIRST_DWORD_OBJECT_INIT':{('A',0x83963),('A',0x8458a)},
 'NESTED_RECORD_POINTER_INSTALL':{('A',0x950af)},
 'SEGMENT_NAVIGATION_ONLY':{('A',0x63345)},
 'CURSOR_TRANSFORM_ONLY':{('A',0x7e629)},
 'LOCAL_NESTED_READ_DISCARDED':{('A',0x68eae)},
 'CURSOR_BASELINE_STATE_ONLY':{('A',0x91d3d)},
}
union=set().union(*expected.values());ck('expected_partition',union==target,f'{len(union)}/{len(target)}')
for fam,p in sorted(target,key=lambda x:x[1]):ck('lookup_'+hx(p),rel(p)==(A if fam=='A' else B),hx(rel(p) or 0))
# Shared consumer mechanics.
ck('secondary_rebind',eq(0x64824,[0xff,0x35,0x78,0x5a,0x07,0x00]) and eq(0x64831,[0x8b,0x15,0x80,0x5a,0x07,0x00]) and eq(0x64837,[0x89,0x15,0x78,0x5a,0x07,0x00]) and rel(0x6483e)==I)
ck('secondary_restore',eq(0x6484a,[0x8b,0x15,0x78,0x5a,0x07,0x00]) and eq(0x64850,[0x89,0x15,0x80,0x5a,0x07,0x00]) and eq(0x64857,[0x8f,0x05,0x78,0x5a,0x07,0x00]))
ck('dispatch_token_read',eq(0x64367,[0x8b,0x1d,0x78,0x5a,0x07,0x00]) and eq(0x6436d,[0x8b,0x1b]))
ck('dispatch_known_endpoints',rel(0x64382)==0x86cc5 and rel(0x64388)==I,str((rel(0x64382),rel(0x64388))))
ck('nested_install_endpoint',rel(0x74658)==NESTI and eq(0x746c3,[0x89,0x04,0xdd,0x00,0x5b,0x07,0x00]) and eq(0x746ca,[0x0f,0xb7,0x18]))
# Strong terminal-qualified paths.
ck('68b5f_three_skips',rel(0x68b75)==W and rel(0x68b7a)==W and rel(0x68b7f)==W and rel(0x68b9c)==0x68c6c and rel(0x68c6c)==SECOND)
ck('68bd8_replay',rel(0x68c00)==I and rel(0x68c1d)==I and eq(0x68bf9,[0x83,0x05,0x78,0x5a,0x07,0x00,0x04]))
ck('7a5dc_replay',rel(0x7a5f6)==I and rel(0x7a613)==I and eq(0x7a5ef,[0x83,0x05,0x78,0x5a,0x07,0x00,0x04]))
ck('67dda_restore_to_dual_inner',eq(0x67ddf,[0xff,0x35,0x78,0x5a,0x07,0x00]) and eq(0x67e0c,[0x8f,0x05,0x78,0x5a,0x07,0x00]) and rel(0x67e20)==0x868c7 and rel(0x868c7)==I and rel(0x868e7)==I)
ck('965a9_immediate_and_dual',eq(0x965ae,[0xff,0x35,0x78,0x5a,0x07,0x00]) and rel(0x965b4)==I and eq(0x965e5,[0x8f,0x05,0x78,0x5a,0x07,0x00]) and rel(0x96604)==DUAL)
for route,at in [(0x71d4c,0x71d65),(0x7e3b1,0x7e3c5),(0x91829,0x91838),(0x7c481,0x7c4a0)]:ck('direct_dispatch_'+hx(route),rel(at)==DISP,hx(rel(at) or 0))
ck('69221_skips',rel(0x69234)==W and rel(0x69239)==W)
ck('69221_six_renderer',eq(0x69276,[0xc7,0x05,0x70,0x5a,0x07,0x00,0x06,0,0,0]) and eq(0x6928b,[0x8b,0x1d,0x78,0x5a,0x07,0x00]) and eq(0x69291,[0x8b,0x1b]) and eq(0x69293,[0x83,0x05,0x78,0x5a,0x07,0x00,0x04]) and rel(0x6929a)==RENDER and eq(0x69308,[0xff,0x0d,0x70,0x5a,0x07,0x00]) and relj(0x6930e)==0x69280)
# Strong nonterminal/support consumers.
ck('68a70_related_after_skips',rel(0x68a86)==W and rel(0x68a8b)==W and rel(0x68a9e)==RELHELP and rel(0x68af6)==SECOND)
for p,load,call in [(0x83963,0x83976,0x83987),(0x8458a,0x8458f,0x845a0)]:
 ck('object_first_'+hx(p),eq(load,[0x50,0xa1,0x78,0x5a,0x07,0x00]) and eq(load+6,[0x52,0x8b,0x10,0x89,0x15,0x6c,0x5a,0x07,0x00]) and rel(call)==0x64548)
ck('frame_init_scratch',eq(0x64528,[0xa1,0x6c,0x5a,0x07,0x00]) and eq(0x6452d,[0x89,0x47,0x3c]))
ck('950af_nested_install',eq(0x950b4,[0xa1,0x78,0x5a,0x07,0x00,0x8b,0x00,0x8b,0x00,0x8b,0x40,0x0c]) and rel(0x950c0)==NEST)
# Conditional known-consumer paths: 0x70F30 can tail-transfer via JMP EBX before the later dispatch.
ck('716e1_conditional',rel(0x716ff)==0x70f30 and rel(0x71704)==DISP)
ck('721a4_conditional',rel(0x721c2)==0x70f30 and rel(0x721c7)==DISP)
ck('70f30_tail_transfer',eq(0x70ffb,[0xff,0xe3]))
# Structural-only paths.
ck('63345_navigation_only',0x63345+5==W)
ck('7e629_transform_only',eq(0x7e62e,[0xa1,0x78,0x5a,0x07,0x00]) and eq(0x7e635,[0x83,0x05,0x78,0x5a,0x07,0x00,0x04]) and eq(0x7e643,[0x83,0x2d,0x78,0x5a,0x07,0x00,0x08]))
ck('68eae_discarded_read',eq(0x68eb3,[0xa1,0x78,0x5a,0x07,0x00,0x8b,0x00,0x8b,0x00,0x8b,0x40,0x0c]) and eq(0x68ebf,[0xc7,0x05,0x78,0x5a,0x07,0x00,0x01,0x00,0x04,0x00]) and eq(0x63b4b,[0xa1,0x78,0x5a,0x07,0x00]))
ck('91d3d_baseline_only',eq(0x91d42,[0x8b,0x0d,0x78,0x5a,0x07,0x00]) and eq(0x91d48,[0x89,0x4e,0x38]) and eq(0x91d70,[0x8b,0x46,0x38]) and eq(0x91d73,[0x2b,0x05,0x78,0x5a,0x07,0x00]))
# Report agreement.
ck('report_format',rep['format']=='mk2_animation_local_cursor_state_continuation_qualification_o95l_v1')
rr={(r['family'],r['lookupCallPhysical']):r for r in rep['routes']};ck('report_route_count',len(rr)==20,str(len(rr)))
for subtype,want in expected.items():
 got={k for k,r in rr.items() if r['subtype']==subtype};ck('report_'+subtype,got==want,f'{got}!={want}')
quals={q:sum(1 for r in rr.values() if r['qualification']==q) for q in ['TERMINAL_QUALIFIED','CONSUMER_QUALIFIED_NONTERMINAL','CONDITIONAL_CONSUMER_PATH','STRUCTURAL_ONLY']}
ck('qualification_counts',quals=={'TERMINAL_QUALIFIED':10,'CONSUMER_QUALIFIED_NONTERMINAL':4,'CONDITIONAL_CONSUMER_PATH':2,'STRUCTURAL_ONLY':4},str(quals))
s=rep['summary'];ck('summary',s['targetRoutes']==20 and s['newTerminalQualifiedRoutes']==10 and s['newStrongNonterminalConsumerRoutes']==4 and s['conditionalConsumerPathRoutes']==2 and s['structuralOnlyRoutes']==4 and s['strictTerminalQualifiedAfterO95L']==171 and s['consumerQualifiedRoutesAfterO95L']==197 and s['routesWithoutAnyStrongQualifiedConsumerAfterO95L']==56,str(s))
ck('open_bounds',rep['decision']['twoDynamicRoutesRemainConditional'] is True and rep['decision']['fourRoutesRemainStructuralOnly'] is True and rep['decision']['supportDataConsumerDoesNotImplyAnimationGrammar'] is True and rep['decision']['humanMoveNamesEstablished'] is False and rep['decision']['timingEstablished'] is False)
print(json.dumps({'status':'PASS','checks':len(checks),'failures':0,'routes':20,'terminalQualifiedNew':10,'nonterminalConsumerQualifiedNew':4,'conditionalConsumerPaths':2,'structuralOnly':4,'strictTerminalQualifiedAfterO95L':171,'consumerQualifiedAfterO95L':197,'routesWithoutStrongQualifiedConsumerAfterO95L':56},indent=2))
