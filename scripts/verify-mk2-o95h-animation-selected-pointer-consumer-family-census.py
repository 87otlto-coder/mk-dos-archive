#!/usr/bin/env python3
import sys,json,struct,hashlib,subprocess,re,shutil,collections
from pathlib import Path
if len(sys.argv)<3:
    raise SystemExit('Usage: verify-mk2-o95h-animation-selected-pointer-consumer-family-census.py <MK2.EXE> <o95h-json>')
exe_path=Path(sys.argv[1]); report=json.loads(Path(sys.argv[2]).read_text()); b=exe_path.read_bytes(); checks=[]
def ck(name,cond,detail=''):
    checks.append((name,bool(cond),detail))
    if not cond: raise AssertionError(f'{name}: {detail}')
def i32(o): return struct.unpack_from('<i',b,o)[0]
def rel(p,opc): return p+5+i32(p+1) if p+5<=len(b) and b[p]==opc else None
def calls(t): return [p for p in range(len(b)-5) if b[p]==0xE8 and p+5+i32(p+1)==t]
def h(start,n): return hashlib.sha256(b[start:start+n]).hexdigest()
def hx(n): return f'0x{n:X}'
ck('exe_sha',hashlib.sha256(b).hexdigest()=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
ck('objdump_available',shutil.which('objdump') is not None,shutil.which('objdump') or '')
LOOKUP_A=0x918F1; LOOKUP_B=0x91909; INTERPRETER=0x63E79
actualA=calls(LOOKUP_A); actualB=calls(LOOKUP_B)
ck('lookup_A_count',len(actualA)==144,str(len(actualA))); ck('lookup_B_count',len(actualB)==109,str(len(actualB)))
# Authenticate the consumer slices independently of the TypeScript report implementation.
HASHES={
 'interpreter':(0x63E79,0x105,'6f0826bdac12e9f51ac2fc3af55bc915dea9fccfeedfd784ead73a41bea300cf'),
 'standard':(0x86825,0x29,'2a1fefaa3d57d7d85efe17078e3fdc9225c91ce2ac1650f0c08492becfe66eba'),
 'reverse':(0x8684E,0x60,'2b342abff03f67a3237dee644222d6928ec81a39d7e5fbdb72eada177902610c'),
 'dual':(0x868AE,0x54,'8bdcc521ddbb8bdb4f48a09708ee9b683ef82fc0984f712230e73de493f618f0'),
 'counted':(0x63206,0x61,'3a4314ad2eaa1c93c36811c73378f94a02b87c0e9effc177fa1c92b884e1f37f'),
 'walker':(0x6334A,0x16,'ad0121136ffc0948d045970c95153542cc9d00f0a44d59fe00153a1a8732ac66'),
 'related':(0x679F2,0x5F,'24d4713308700ea5916e4c61fafd5d5d6a3a12a55dcf15e493889aa946fc34d5'),
 'special_loop':(0x86C99,0x2C,'c99a2f1147f3731fa6cdcf6da328dd4c9d66eee4e12bc4d8ca83ef418fa363e6'),
 'special_consumer':(0x86CC5,0x8F,'5bb74d8fd65bbed5ce44290954fd6734a77b22d256fa005a34c9b04e2da616ab'),
 'packed_A':(0x63B2D,0x1E,'90baf7f99edb8045283578314580c5e7debbc09e8993425c47f3f41d39e619d4'),
 'packed_B':(0x63B4B,0x1E,'2fbd3704397295126d0a98b90a4df25227454b509de00cbca0c36d27a95bd132'),
 'displacement':(0x64AE5,0x23,'9250c863a839b56442a550e96c245f7590cf4137ac202ca895e5440e41a37bb5'),
 'offset':(0x94B71,0x1A,'7c3ee14d95f0d4c92b100da1b89c2a1face6f75761573273036b0287a60d76cd'),
 'scheduler':(0x63936,0x87,'731422166421c17a527688d9ee686392e8c60f0fd50f0e81c0ac203b12635cc4')}
for name,(s,n,want) in HASHES.items(): ck('hash_'+name,h(s,n)==want,h(s,n))
# Independently use instruction-boundary-aware objdump output to classify each lookup call by the first bounded consumer/handoff.
STD={0x63E79,0x86825,0x86822,0x868AE,0x63206,0x64AFC,0x94B71}
REV={0x8684E}; WALK={0x6334A}; STATE={0x679F2}; SPECIAL={0x86C99}; SCHED={0x63936,0x63940,0x6394C,0x63B4B}
line_re=re.compile(r'^\s*([0-9a-f]+):\s+((?:[0-9a-f]{2}\s+)+)\s*([a-z][a-z0-9.]*)\s*(.*)$')
def dis(p):
    out=subprocess.check_output(['objdump','-D','-b','binary','-m','i386','-M','intel',f'--start-address={p}',f'--stop-address={p+128}',str(exe_path)],text=True,stderr=subprocess.DEVNULL)
    ins=[]
    for line in out.splitlines():
        m=line_re.match(line)
        if m: ins.append((int(m.group(1),16),m.group(3),m.group(4).strip()))
    return ins
def target(op):
    m=re.search(r'0x([0-9a-f]+)',op); return int(m.group(1),16) if m else None
def classify(p):
    # Three previously authenticated combined/fallthrough forms need exact entry handling.
    if p==0x63E74: return 'STANDARD_COMPOSITION'
    if p==0x64AF7: return 'STANDARD_COMPOSITION'
    if p==0x68C9F: return 'SPECIAL_DIRECT_DESCRIPTOR'
    ins=dis(p); ck(f'objdump_entry_{hx(p)}',bool(ins) and ins[0][0]==p,str(ins[0] if ins else None))
    transformed=False
    for idx,(a,mn,op) in enumerate(ins[1:32],start=1):
        if mn in ('call','jmp'):
            t=target(op)
            if t in STD: return 'STANDARD_COMPOSITION'
            if t in REV: return 'REVERSE_DWORD_SEQUENCE'
            if t in WALK: return 'DWORD_WALKER'
            if t in STATE: return 'RELATED_OBJECT_STATE'
            if t in SPECIAL: return 'SPECIAL_DIRECT_DESCRIPTOR'
            if t in SCHED: return 'SCHEDULER_OR_RESELECT'
            if mn=='jmp': return 'UNRESOLVED'
        if '0x75a78' in op:
            if mn in ('add','sub','and','or'):
                transformed=True; continue
            if mn=='mov' and op.startswith('edx,'):
                nxt=ins[idx+1] if idx+1<len(ins) else None
                if nxt and nxt[1]=='mov' and '0x75a80' in nxt[2]: return 'RELATED_OBJECT_STATE'
                return 'LOCAL_CURSOR_DATA'
            if mn=='mov' and op.startswith('eax,'): return 'LOCAL_CURSOR_DATA'
            if mn in ('push','pop'): return 'CURSOR_STACK_OR_STATE'
            if mn=='mov' and op.startswith('DWORD PTR ds:0x75a78,'): return 'SCHEDULER_OR_RESELECT'
            return 'LOCAL_CURSOR_DATA'
        if mn=='ret': return 'UNRESOLVED'
    return 'CURSOR_TRANSFORM_UNRESOLVED' if transformed else 'UNRESOLVED'
ind={'A':collections.defaultdict(list),'B':collections.defaultdict(list)}
for fam,arr in [('A',actualA),('B',actualB)]:
    for p in arr: ind[fam][classify(p)].append(p)
# Compare exact category sets against the report, not just totals.
rep_sets={'A':collections.defaultdict(list),'B':collections.defaultdict(list)}
for family in report['consumerFamilies']:
    cat=family['category']
    for c in family['callsites']: rep_sets[c['family']][cat].append(c['physical'])
allcats=['STANDARD_COMPOSITION','REVERSE_DWORD_SEQUENCE','SPECIAL_DIRECT_DESCRIPTOR','DWORD_WALKER','RELATED_OBJECT_STATE','LOCAL_CURSOR_DATA','SCHEDULER_OR_RESELECT','CURSOR_STACK_OR_STATE','CURSOR_TRANSFORM_UNRESOLVED','UNRESOLVED']
for fam in ('A','B'):
    for cat in allcats:
        got=sorted(ind[fam].get(cat,[])); rep=sorted(rep_sets[fam].get(cat,[]))
        ck(f'partition_{fam}_{cat}',got==rep,f'objdump={len(got)} report={len(rep)}')
    union=sorted(x for cat in allcats for x in ind[fam].get(cat,[])); actual=sorted(actualA if fam=='A' else actualB)
    ck(f'partition_complete_{fam}',union==actual,f'{len(union)}/{len(actual)}')
# Exact final count matrix expected from independent disassembly classification.
expected={
 'A':{'STANDARD_COMPOSITION':81,'REVERSE_DWORD_SEQUENCE':1,'SPECIAL_DIRECT_DESCRIPTOR':0,'DWORD_WALKER':1,'RELATED_OBJECT_STATE':9,'LOCAL_CURSOR_DATA':14,'SCHEDULER_OR_RESELECT':13,'CURSOR_STACK_OR_STATE':0,'CURSOR_TRANSFORM_UNRESOLVED':1,'UNRESOLVED':24},
 'B':{'STANDARD_COMPOSITION':57,'REVERSE_DWORD_SEQUENCE':0,'SPECIAL_DIRECT_DESCRIPTOR':2,'DWORD_WALKER':22,'RELATED_OBJECT_STATE':13,'LOCAL_CURSOR_DATA':3,'SCHEDULER_OR_RESELECT':2,'CURSOR_STACK_OR_STATE':3,'CURSOR_TRANSFORM_UNRESOLVED':0,'UNRESOLVED':7}}
for fam in ('A','B'):
    for cat,n in expected[fam].items(): ck(f'count_{fam}_{cat}',len(ind[fam].get(cat,[]))==n,str(len(ind[fam].get(cat,[]))))
# Route-specific checks for the newly important nonstandard consumers.
ck('reverse_route_lookup',0x922DC in actualA and rel(0x922F7,0xE9)==0x8684E,hx(rel(0x922F7,0xE9) or 0))
ck('special_dynamic_lookup',0x68C9F in actualB and rel(0x68CE0,0xE9)==0x86C99,hx(rel(0x68CE0,0xE9) or 0))
ck('special_fixed_lookup',0x7B05F in actualB and rel(0x7B073,0xE9)==0x86C99,hx(rel(0x7B073,0xE9) or 0))
ck('standard_wrapper_interpreter',rel(0x8682D,0xE8)==INTERPRETER,hx(rel(0x8682D,0xE8) or 0))
ck('counted_wrapper_interpreter',rel(0x63234,0xE8)==INTERPRETER,hx(rel(0x63234,0xE8) or 0))
ck('dual_wrapper_first',rel(0x868C7,0xE8)==INTERPRETER,hx(rel(0x868C7,0xE8) or 0))
ck('dual_wrapper_second',rel(0x868E7,0xE8)==INTERPRETER,hx(rel(0x868E7,0xE8) or 0))
ck('displacement_wrapper_tail',rel(0x64B03,0xE9)==INTERPRETER,hx(rel(0x64B03,0xE9) or 0))
ck('offset_wrapper_tail',rel(0x94B86,0xE9)==INTERPRETER,hx(rel(0x94B86,0xE9) or 0))
# Report boundary reconciliation.
ck('report_format',report['format']=='mk2_animation_selected_pointer_consumer_family_census_o95h_v1')
ck('report_verdict',report['decision']['verdict']=='MK2_O95H_253_LOOKUP_CALLS_PARTITIONED_ACROSS_MULTIPLE_SELECTED_POINTER_CONSUMER_FAMILIES')
s=report['summary']
ck('report_summary_totals',s['totalLookupCalls']==253 and s['standardCompositionCalls']==138 and s['reverseDwordSequenceCalls']==1 and s['specialDirectDescriptorCalls']==2 and s['dwordWalkerCalls']==23 and s['qualifiedFinalConsumerCalls']==164 and s['structuralHandoffOrUnresolvedCalls']==89,str(s))
ck('report_open_boundaries',report['decision']['allLookupCallsSemanticallyResolved'] is False and report['decision']['timingEstablished'] is False and report['decision']['humanMoveNamesEstablished'] is False)
print(json.dumps({'status':'PASS','checks':len(checks),'failures':0,'lookupCalls':{'A':len(actualA),'B':len(actualB),'total':len(actualA)+len(actualB)},'categoryCounts':{cat:len(ind['A'].get(cat,[]))+len(ind['B'].get(cat,[])) for cat in allcats},'qualifiedFinalConsumerCalls':164,'structuralHandoffOrUnresolvedCalls':89},indent=2))
