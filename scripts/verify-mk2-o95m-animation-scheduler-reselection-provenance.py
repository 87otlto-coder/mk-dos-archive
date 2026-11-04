#!/usr/bin/env python3
import sys,json,struct,hashlib
from pathlib import Path
if len(sys.argv)<4: raise SystemExit('Usage: verify-mk2-o95m-animation-scheduler-reselection-provenance.py <MK2.EXE> <o95h-json> <o95m-json>')
exe_path=Path(sys.argv[1]);hrep=json.loads(Path(sys.argv[2]).read_text());rep=json.loads(Path(sys.argv[3]).read_text());b=exe_path.read_bytes();checks=[]
def ck(n,c,d=''):
 checks.append((n,bool(c),d))
 if not c: raise AssertionError(f'{n}: {d}')
def i32(o):return struct.unpack_from('<i',b,o)[0]
def rel(p):return p+5+i32(p+1) if p+5<=len(b) and b[p] in (0xe8,0xe9) else None
def eq(o,v):return b[o:o+len(v)]==bytes(v)
def h(p,n):return hashlib.sha256(b[p:p+n]).hexdigest()
def hx(n):return f'0x{n:X}'
def has_addr(a,z,addr=0x75a78):return struct.pack('<I',addr) in b[a:z]
A=0x918f1;B=0x91909;Y=0x6710f;D=0x6435a;SE=0x63936;SA=0x6394c;PB=0x63b4b
ck('exe_sha',hashlib.sha256(b).hexdigest()=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
for name,p,n,w in [
 ('yield',Y,0x7a,'60209e25a96a3f93ff84ef4482e2665d32aca825337569d57290708870335c5f'),
 ('dynamic',D,0x34,'51be30b495b2193ae81758d17162fe22011a2edbd4808b84548de5f91b79a3a2'),
 ('scheduler',SE,0xd6,'5078f7cd709dc90787c6103f49dbedaa146b925fcc334eda5d4b93bc633fa538'),
 ('helper63198',0x63198,0x21,'0d4c088b488f7205c8994fecf99fe77b4a1bfd2fe34be497901b9cd1b17f2016'),
 ('helper642c5',0x642c5,0x3d,'df987ddab5c2ab05fe2cad54c551a52d7308ba78b18bb5a2fef30d71036b885d'),
 ('helper63370',0x63370,0x18,'d0011e38b3e450a5a66109ab59764301d302548d4e9ccf2a8b4d713b339538fe')]: ck('hash_'+name,h(p,n)==w,h(p,n))
# Recover target set independently from O95H report.
fam=next(x for x in hrep['consumerFamilies'] if x['category']=='SCHEDULER_OR_RESELECT')['callsites'];target={(x['family'],x['physical']) for x in fam};ck('target_count',len(fam)==15 and len(target)==15,str(len(target)))
direct={('A',0x69005):(0x69019,0x6901e,0),('A',0x7ba84):(0x7bac6,0x7bacb,4),('A',0x7ecfb):(0x7ed19,0x7ed4e,0),('A',0x83b25):(0x83b2f,0x83b34,0),('A',0x94ba9):(0x94bb3,0x94bb8,0),('B',0x7ca42):(0x7ca6f,0x7ca74,0)}
wrap={('A',0x7159e):(0x715d0,SA,0),('A',0x73ecb):(0x73efd,SA,0),('A',0x73fbb):(0x73fed,SA,0),('A',0x77d2b):(0x77d66,SA,0),('A',0x7bbeb):(0x7bc1a,SE,4),('A',0x7bee8):(0x7bf17,SE,4),('A',0x7cde8):(0x7ce17,SE,4),('B',0x9530f):(0x95337,SE,0)}
unresolved={('A',0x699ea)}
ck('partition',set(direct)|set(wrap)|unresolved==target,str((len(direct),len(wrap),len(unresolved))))
for fam,p in sorted(target,key=lambda x:x[1]): ck('lookup_'+hx(p),rel(p)==(A if fam=='A' else B),hx(rel(p) or 0))
# Yield exact selected-cursor save/restore.
ck('yield_save',eq(0x67131,[0x8b,0x15,0x78,0x5a,0x07,0x00]) and eq(0x67137,[0x89,0x56,0x14]))
ck('yield_restore',eq(0x67178,[0x8b,0x56,0x14]) and eq(0x6717b,[0x89,0x15,0x78,0x5a,0x07,0x00]))
# Dynamic consumer branches.
ck('dynamic_read',eq(0x64367,[0x8b,0x1d,0x78,0x5a,0x07,0x00]) and eq(0x6436d,[0x8b,0x1b]))
ck('dynamic_targets',rel(0x64382)==0x86cc5 and rel(0x64388)==0x63e79,str((rel(0x64382),rel(0x64388))))
# Wrapper exact provenance mechanics.
ck('sched_entry_marks_and_zeros',eq(0x63936,[0x81,0x0d,0x78,0x5a,0x07,0x00,0,0,0,0x80]) and eq(0x63940,[0xc7,0x05,0x70,0x5a,0x07,0x00,0,0,0,0]))
ck('sched_alt_marks',eq(0x6394c,[0x81,0x0d,0x78,0x5a,0x07,0x00,0,0,0,0x80]))
ck('sched_skips_reselect',eq(0x6397d,[0xf7,0x05,0x78,0x5a,0x07,0x00,0xff,0xff,0xff,0xff]) and eq(0x63987,[0x78,0x21]))
ck('sched_clears_mark',eq(0x639ab,[0x81,0x25,0x78,0x5a,0x07,0x00,0xff,0xff,0xff,0x7f]))
ck('sched_yield_dispatch',rel(0x639d9)==Y and rel(0x63a07)==D,str((rel(0x639d9),rel(0x63a07))))
for route,zero in [(0x7159e,0x7158a),(0x73ecb,0x73ea6),(0x73fbb,0x73f96),(0x77d2b,0x77d06)]: ck('alt_zero_'+hx(route),eq(zero,[0xc7,0x05,0x70,0x5a,0x07,0x00,0,0,0,0]),hx(zero))
# Direct route mechanics.
for (fam,p),(y,d,delta) in direct.items():
 ck('direct_yield_'+hx(p),rel(y)==Y,hx(rel(y) or 0));ck('direct_dispatch_'+hx(p),rel(d)==D,hx(rel(d) or 0))
 if delta==4: ck('direct_add4_'+hx(p),eq(p+5,[0x83,0x05,0x78,0x5a,0x07,0x00,0x04]),hx(p+5))
# 7ECFB helper chain has no cursor-global reference in bounded helpers/build path.
ck('7ecfb_helpers',rel(0x7ed1e)==0x63198 and rel(0x7ed2d)==0x63370,str((rel(0x7ed1e),rel(0x7ed2d))))
ck('7ecfb_no_cursor_helper_refs',not has_addr(0x63198,0x631b9) and not has_addr(0x640df,0x642c5) and not has_addr(0x63370,0x63388))
# Wrapper route mechanics.
for (fam,p),(j,t,delta) in wrap.items():
 ck('wrap_'+hx(p),rel(j)==t,f'{hx(j)}->{hx(rel(j) or 0)}')
 if delta==4: ck('wrap_add4_'+hx(p),eq(p+5,[0x83,0x05,0x78,0x5a,0x07,0x00,0x04]),hx(p+5))
# Rejected route: helpers in the bounded interval are cursor-independent and cursor is explicitly replaced before packed-B reselection.
ck('699ea_helper_targets',rel(0x69a04)==0x67a65 and rel(0x69a0d)==0x63a45 and rel(0x69a20)==0x6441b,str((rel(0x69a04),rel(0x69a0d),rel(0x69a20))))
ck('699ea_helper_cursor_absence',not has_addr(0x67a65,0x67a76) and not has_addr(0x63a45,0x63a53) and not has_addr(0x6419c,0x642c5) and not has_addr(0x6441b,0x6443f))
ck('699ea_overwrite',eq(0x69a25,[0xc7,0x05,0x78,0x5a,0x07,0x00,0x01,0x00,0x04,0x00]))
ck('699ea_packed_b',rel(0x69a39)==PB,hx(rel(0x69a39) or 0))
# Report agreement.
ck('report_format',rep['format']=='mk2_animation_scheduler_reselection_provenance_o95m_v1')
rr={(r['family'],r['lookupCallPhysical']):r for r in rep['routes']};ck('report_routes',set(rr)==target,str(len(rr)))
ck('report_direct',{k for k,v in rr.items() if v['subtype']=='DIRECT_YIELD_THEN_DYNAMIC_DISPATCH'}==set(direct),str([hx(k[1]) for k,v in rr.items() if v['subtype']=='DIRECT_YIELD_THEN_DYNAMIC_DISPATCH']))
ck('report_wrap',{k for k,v in rr.items() if v['subtype']=='SCHEDULER_WRAPPER_DYNAMIC_DISPATCH'}==set(wrap),str([hx(k[1]) for k,v in rr.items() if v['subtype']=='SCHEDULER_WRAPPER_DYNAMIC_DISPATCH']))
ck('report_unresolved',{k for k,v in rr.items() if v['subtype']=='RESELECT_OVERWRITE_BEFORE_CONSUMER'}==unresolved,str([hx(k[1]) for k,v in rr.items() if v['subtype']=='RESELECT_OVERWRITE_BEFORE_CONSUMER']))
q={x:sum(1 for v in rr.values() if v['qualification']==x) for x in ['TERMINAL_QUALIFIED','STRUCTURAL_ONLY']};ck('qual_counts',q=={'TERMINAL_QUALIFIED':14,'STRUCTURAL_ONLY':1},str(q))
s=rep['summary'];ck('summary',s['targetRoutes']==15 and s['newTerminalQualifiedRoutes']==14 and s['reselectionOverwriteRoutes']==1 and s['strictTerminalQualifiedAfterO95M']==185 and s['consumerQualifiedRoutesAfterO95M']==211 and s['routesWithoutAnyStrongQualifiedConsumerAfterO95M']==42,str(s))
ck('bounds',rep['decision']['fourteenRoutesReachKnownDynamicConsumer'] is True and rep['decision']['oneRouteOverwrittenBeforeQualifiedConsumer'] is True and rep['decision']['humanMoveNamesEstablished'] is False and rep['decision']['timingEstablished'] is False)
print(json.dumps({'status':'PASS','checks':len(checks),'failures':0,'routes':15,'terminalQualifiedNew':14,'reselectOverwrite':1,'strictTerminalQualifiedAfterO95M':185,'consumerQualifiedAfterO95M':211,'routesWithoutStrongQualifiedConsumerAfterO95M':42},indent=2))
