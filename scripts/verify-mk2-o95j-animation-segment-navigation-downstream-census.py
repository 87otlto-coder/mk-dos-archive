#!/usr/bin/env python3
import sys,json,struct,hashlib,subprocess,re,shutil
from pathlib import Path
if len(sys.argv)<3: raise SystemExit('Usage: verify-mk2-o95j-animation-segment-navigation-downstream-census.py <MK2.EXE> <o95j-json>')
exe_path=Path(sys.argv[1]); rep=json.loads(Path(sys.argv[2]).read_text()); b=exe_path.read_bytes(); checks=[]
def ck(n,c,d=''):
 checks.append((n,bool(c),d))
 if not c: raise AssertionError(f'{n}: {d}')
def i32(o):return struct.unpack_from('<i',b,o)[0]
def u32(o):return struct.unpack_from('<I',b,o)[0]
def rel(p):return p+5+i32(p+1) if p+5<=len(b) and b[p] in (0xe8,0xe9) else None
def calls(t):return [p for p in range(len(b)-5) if b[p]==0xe8 and p+5+i32(p+1)==t]
def h(p,n):return hashlib.sha256(b[p:p+n]).hexdigest()
def eq(o,v):return b[o:o+len(v)]==bytes(v)
def movcur(p,v):return eq(p,[0xc7,0x05,0x78,0x5a,0x07,0x00]) and u32(p+6)==v
ck('exe_sha',hashlib.sha256(b).hexdigest()=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
ck('objdump',shutil.which('objdump') is not None,shutil.which('objdump') or '')
A=0x918f1;B=0x91909;W=0x6334a;I=0x63e79;STD=0x86825;DUAL=0x868ae;SCHED=0x6710f
# Reconstruct all lookup->walker routes independently.
routes=[]
for fam,t in [('A',A),('B',B)]:
 for p in calls(t):
  if rel(p+5)==W:
   q=p+5;n=0
   while rel(q)==W:n+=1;q+=5
   routes.append((fam,p,n,q))
routes.sort(key=lambda x:x[1])
ck('route_count',len(routes)==23,str(len(routes)))
ck('family_counts',sum(f=='A' for f,_,_,_ in routes)==1 and sum(f=='B' for f,_,_,_ in routes)==22,str(routes))
dist={}
for _,_,n,_ in routes:dist[n]=dist.get(n,0)+1
ck('skip_distribution',dist=={1:13,2:7,3:3},str(dist))
# Authenticate continuation helpers.
for name,p,n,want in [
 ('walker',W,0x16,'ad0121136ffc0948d045970c95153542cc9d00f0a44d59fe00153a1a8732ac66'),
 ('standard',STD,0x29,'2a1fefaa3d57d7d85efe17078e3fdc9225c91ce2ac1650f0c08492becfe66eba'),
 ('dual',DUAL,0x54,'8bdcc521ddbb8bdb4f48a09708ee9b683ef82fc0984f712230e73de493f618f0'),
 ('transform',0x7e62e,0x1d,'501629638aca917e16b3e8f6e5f2f614b79d5a76153af495241ed3fd51871c9e'),
 ('object_init',0x93b1c,9,'e2ec43278086f7ee8b7efa24d81f213aa40fbc6b1b333b091f4a8e7aa04c779d'),
 ('scheduler',SCHED,0x7a,'60209e25a96a3f93ff84ef4482e2665d32aca825337569d57290708870335c5f')]: ck('hash_'+name,h(p,n)==want,h(p,n))
# Expected direct endpoints are independently checked against machine relative targets.
direct={0x67778:(0x67796,STD),0x679bc:(0x679da,STD),0x68008:(0x68021,STD),0x68282:(0x68292,I),0x682a2:(0x682ac,I),0x68369:(0x68373,I),0x68754:(0x6876d,STD),0x691f9:(0x69203,I),0x7c6bc:(0x7c6d5,STD),0x9538a:(0x953a3,STD),0x9548e:(0x954a7,STD),0x95c1d:(0x95c3b,STD),0x97518:(0x97531,STD),0x979de:(0x979f7,STD),0x97ad8:(0x97aec,I)}
for p,(at,t) in direct.items():ck('direct_'+hex(p),rel(at)==t,hex(rel(at) or 0))
# One non-cursor helper route.
ck('helper_route_call',rel(0x693c7)==0x93b1c,hex(rel(0x693c7) or 0));ck('helper_route_terminal',rel(0x693db)==STD,hex(rel(0x693db) or 0))
ck('object_init_no_cursor_access',b[0x93b1c:0x93b25]==bytes.fromhex('33d2895710895714c3'))
# One same-cursor transform route. Authenticate exact transform semantics.
ck('transform_route_call',rel(0x7fdfe)==0x7e62e,hex(rel(0x7fdfe) or 0));ck('transform_route_terminal',rel(0x7fe03)==I,hex(rel(0x7fe03) or 0))
ck('transform_reads_cursor',eq(0x7e62e,[0xa1,0x78,0x5a,0x07,0x00]) and eq(0x7e635,[0x83,0x05,0x78,0x5a,0x07,0x00,0x04]))
ck('transform_backtracks_8',eq(0x7e643,[0x83,0x2d,0x78,0x5a,0x07,0x00,0x08]) and b[0x7e64a]==0xc3)
# Scheduler route: exact process-state save/restore of cursor, then interpreter.
ck('scheduler_route',rel(0x96293)==SCHED and rel(0x96298)==I,str((rel(0x96293),rel(0x96298))))
ck('scheduler_save_cursor',eq(0x67131,[0x8b,0x15,0x78,0x5a,0x07,0x00]) and eq(0x67137,[0x89,0x56,0x14]))
ck('scheduler_restore_cursor',eq(0x67178,[0x8b,0x56,0x14]) and eq(0x6717b,[0x89,0x15,0x78,0x5a,0x07,0x00]))
# Dual routes preserve selected post-skip pointer in 0x75A80 and consume it on second interpreter pass.
for tag,load,store,restore,terminal in [('67be2',0x67c01,0x67c07,0x67c0e,0x67c23),('95fac',0x95fbc,0x95fc2,0x95ff2,0x96007)]:
 ck('dual_copy_'+tag,eq(load,[0x8b,0x15,0x78,0x5a,0x07,0x00]) and eq(store,[0x89,0x15,0x80,0x5a,0x07,0x00]))
 ck('dual_restore_'+tag,eq(restore,[0x8f,0x05,0x78,0x5a,0x07,0x00]))
 ck('dual_terminal_'+tag,rel(terminal)==DUAL,hex(rel(terminal) or 0))
ck('dual_secondary_rebind',eq(0x868da,[0x8b,0x15,0x80,0x5a,0x07,0x00]) and eq(0x868e0,[0x89,0x15,0x78,0x5a,0x07,0x00]) and rel(0x868e7)==I)
# Three routes have no already-qualified terminal before explicit cursor replacement. Use instruction-boundary objdump to rule out known terminal targets in the bounded interval.
line_re=re.compile(r'^\s*([0-9a-f]+):\s+((?:[0-9a-f]{2}\s+)+)\s*([a-z][a-z0-9.]*)\s*(.*)$')
def dis(start,stop):
 out=subprocess.check_output(['objdump','-D','-b','binary','-m','i386','-M','intel',f'--start-address={start}',f'--stop-address={stop}',str(exe_path)],text=True,stderr=subprocess.DEVNULL)
 r=[]
 for line in out.splitlines():
  m=line_re.match(line)
  if m:r.append((int(m.group(1),16),m.group(3),m.group(4).strip()))
 return r
def target(op):
 m=re.search(r'0x([0-9a-f]+)',op);return int(m.group(1),16) if m else None
unresolved={0x67cac:(0x67d56,2),0x95b69:(0x95c13,1),0x961ed:(0x961f7,0x3d)}
route_map={p:(fam,n,q) for fam,p,n,q in routes}
known_terminal={I,STD,DUAL,0x86c99,0x8684e}
for p,(ow,val) in unresolved.items():
 fam,n,q=route_map[p];ins=dis(q,ow+10);terms=[(a,mn,target(op)) for a,mn,op in ins if mn in ('call','jmp') and target(op) in known_terminal and a<ow]
 ck('unresolved_no_qualified_terminal_'+hex(p),len(terms)==0,str(terms))
 ck('unresolved_overwrite_'+hex(p),movcur(ow,val),f'{hex(ow)}={hex(val)}')
# Reconcile report exact route subtype sets.
expected={
 'DIRECT_STANDARD_COMPOSITION':set(direct),
 'STANDARD_AFTER_NONCURSOR_HELPER':{0x693b3},
 'STANDARD_AFTER_CURSOR_TRANSFORM':{0x7fdef},
 'STANDARD_AFTER_SCHEDULER_PRESERVE':{0x96284},
 'DUAL_STANDARD_SECONDARY_CURSOR':{0x67be2,0x95fac},
 'CURSOR_REPLACED_BEFORE_TERMINAL':set(unresolved)}
ck('report_format',rep['format']=='mk2_animation_segment_navigation_downstream_census_o95j_v1')
for subtype,want in expected.items():
 got={r['lookupCallPhysical'] for r in rep['routes'] if r['subtype']==subtype};ck('report_'+subtype,got==want,f'{sorted(map(hex,got))} != {sorted(map(hex,want))}')
s=rep['summary'];ck('summary',s['navigationRoutes']==23 and s['terminalQualifiedRoutes']==20 and s['standardCompositionTerminalRoutes']==20 and s['cursorReplacedBeforeTerminalRoutes']==3 and s['terminalQualifiedAfterO95J']==161 and s['structuralHandoffOrUnresolvedAfterO95J']==92,str(s))
ck('open_bounds',rep['decision']['cursorTransformSemanticsNamed'] is False and rep['decision']['schedulerTicksMappedToWallClock'] is False and rep['decision']['humanMoveNamesEstablished'] is False)
print(json.dumps({'status':'PASS','checks':len(checks),'failures':0,'navigationRoutes':23,'resolvedStandardComposition':20,'unresolvedAfterCursorReplacement':3,'subtypes':{k:len(v) for k,v in expected.items()},'terminalQualifiedAfterO95J':161,'structuralHandoffOrUnresolvedAfterO95J':92},indent=2))
