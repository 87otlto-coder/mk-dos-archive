#!/usr/bin/env python3
"""Independent authentic-byte O95O reviewer. Does not import TypeScript constants."""
import hashlib,json,struct,sys
from pathlib import Path
if len(sys.argv)!=8:
 raise SystemExit('Usage: verifier.py <MK2.EXE> <o95h.json> <o95j.json> <o95l.json> <o95m.json> <o95n.json> <o95o.json>')
exe,*prior_report_names,report_name=sys.argv[1:]
b=Path(exe).read_bytes()
h,j,l,m,n=(json.loads(Path(x).read_text()) for x in prior_report_names)
r=json.loads(Path(report_name).read_text())
checks=[]
def ck(label,truth,detail=''):
 checks.append(label)
 if not truth: raise AssertionError(f'{label}: {detail}')
def dword(p):return struct.unpack_from('<I',b,p)[0]
def signed(p):return struct.unpack_from('<i',b,p)[0]
def call(p):return p+5+signed(p+1) if b[p] in (0xe8,0xe9) else None
def shortjmp(p):return p+2+struct.unpack_from('b',b,p+1)[0] if b[p]==0xeb else None
def data(p,*expected):return b[p:p+len(expected)]==bytes(expected)
def hx(x):return '0x%X'%x
HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
ck('exe_identity',hashlib.sha256(b).hexdigest()==HASH)
ck('provenance',r['status']=='SUCCESS' and not r['provenance']['synthetic'] and r['provenance']['exeSha256']==HASH)
ck('format',r['format']=='mk2_animation_final_held_route_qualification_o95o_v1')
ck('five_prerequisites',[x['status'] for x in [h,j,l,m,n]]==['SUCCESS']*5)
expected={
 'O95H_CURSOR_TRANSFORM':{('A',0x69c3d)},
 'O95J_CURSOR_REPLACED':{('B',0x67cac),('B',0x95b69),('B',0x961ed)},
 'O95L_STRUCTURAL':{('A',0x63345),('A',0x68eae),('A',0x7e629),('A',0x91d3d)},
 'O95L_CONDITIONAL':{('A',0x716e1),('A',0x721a4)},
 'O95M_RESELECT_OVERWRITE':{('A',0x699ea)},
 'O95N_STRUCTURAL':{('A',0x63901),('B',0x63910),('A',0x71579),('A',0x73f8a),('A',0x918dd)}
}
from_report={k:set() for k in expected}
for x in r['routes']:
 ck('recognized_origin_%s'%hx(x['lookupCallPhysical']),x['originClass'] in from_report)
 from_report[x['originClass']].add((x['family'],x['lookupCallPhysical']))
 ck('reported_hex_%s'%hx(x['lookupCallPhysical']),x['lookupCallPhysicalHex']==hx(x['lookupCallPhysical']))
 ck('reported_call_%s'%hx(x['lookupCallPhysical']),call(x['lookupCallPhysical'])==(0x918f1 if x['family']=='A' else 0x91909))
for origin,expect in expected.items():ck('exact_class_'+origin,from_report[origin]==expect,str(from_report[origin]^expect))
ck('disjoint_exact_16',sum(map(len,from_report.values()))==16 and len({v for x in from_report.values() for v in x})==16)
# Independently recover the earlier route populations from each report, do not trust O95O's descriptions.
previous={
 'O95H_CURSOR_TRANSFORM':{(x['family'],x['physical']) for group in h['consumerFamilies'] if group['category']=='CURSOR_TRANSFORM_UNRESOLVED' for x in group['callsites']},
 'O95J_CURSOR_REPLACED':{(x['family'],x['lookupCallPhysical']) for x in j['routes'] if x['subtype']=='CURSOR_REPLACED_BEFORE_TERMINAL'},
 'O95L_STRUCTURAL':{(x['family'],x['lookupCallPhysical']) for x in l['routes'] if x['qualification']=='STRUCTURAL_ONLY'},
 'O95L_CONDITIONAL':{(x['family'],x['lookupCallPhysical']) for x in l['routes'] if x['qualification']=='CONDITIONAL_CONSUMER_PATH'},
 'O95M_RESELECT_OVERWRITE':{(x['family'],x['lookupCallPhysical']) for x in m['routes'] if x['qualification']=='STRUCTURAL_ONLY'},
 'O95N_STRUCTURAL':{(x['family'],x['lookupCallPhysical']) for x in n['routes'] if x['qualification']=='STRUCTURAL_ONLY'}
}
for k in expected:ck('source_census_'+k,previous[k]==expected[k])
QUAL={
 0x69c3d:'TERMINAL_QUALIFIED',0x95b69:'TERMINAL_QUALIFIED',
 0x67cac:'CONDITIONAL_CONSUMER_PATH',0x716e1:'CONDITIONAL_CONSUMER_PATH',0x721a4:'CONDITIONAL_CONSUMER_PATH',0x91d3d:'CONDITIONAL_CONSUMER_PATH'}
for route in r['routes']:
 p=route['lookupCallPhysical'];qual=QUAL.get(p,'STRUCTURAL_ONLY')
 ck('qualification_'+hx(p),route['qualification']==qual)
 ck('consumer_contract_'+hx(p),(route['consumerPhysical']==0x6435a)==(qual!='STRUCTURAL_ONLY'))
ck('verified_terminal_dispatcher',hashlib.sha256(b[0x6435a:0x6438e]).hexdigest()=='51be30b495b2193ae81758d17162fe22011a2edbd4808b84548de5f91b79a3a2')
# 0x69C3D: verify the byte displacement, both straight-line callees and their read-only bodies.
ck('A69_shift',data(0x69c42,0x83,0x05,0x78,0x5a,0x07,0,0x10))
for point,dest in [(0x69c3d,0x918f1),(0x69c53,0x67aef),(0x69c5d,0x6433f),(0x69c62,0x6435a),(0x67aef,0x81b00)]:
 ck('A69_edge_'+hx(point),call(point)==dest)
ck('A69_helper_only_read',data(0x67af4,0x89,0x46,0x20,0xc3) and data(0x81b00,0x8b,0x5f,0x46,0xc1,0xe3,0x02,0xc1,0xe0,0x02,0x81,0xc3,0x9c,0x49,0x01,0,0x8b,0x1b,0x03,0xc3,0x8b,0,0xc3))
ck('cadence_no_cursor_write',data(0x6433f,0x98,0x3d,0xff,0x0f,0,0) and data(0x6434a,0xb8,1,0,0,0) and data(0x64352,0xc3) and data(0x64359,0xc3))
# 0x95B69: two exact skip calls; no selected-pointer replacements in position comparison; O95M scheduler contract.
for point,dest in [(0x95b69,0x91909),(0x95b6e,0x6334a),(0x95b73,0x6334a),(0x95b82,0x643d6),(0x95b98,0x6433f),(0x95ba2,0x6710f),(0x95ba7,0x6435a)]:
 ck('B95_edge_'+hx(point),call(point)==dest)
ck('B95_compare_is_noncursor',data(0x643d6,0x52,0x8b,0x56,0x28,0x8b,0x52,0x18,0x8b,0x4f,0x18,0x3b,0xd1,0x5a,0x7f,0x02,0xf8,0xc3,0xf9,0xc3))
ck('B95_later_cursor_replaced',data(0x95c13,0xc7,5,0x78,0x5a,7,0,1,0,0,0) and 0x95ba7<0x95c13)
ck('B95_scheduler_preserves',m['architecture']['yieldPhysical']==0x6710f and m['architecture']['dynamicDispatchPhysical']==0x6435a)
# This third original O95J 'cursor-replaced' route has a possible earlier known consumer,
# but sound/event helper 0x8140E is not accepted as universally cursor-preserving.
for point,dest in [(0x67cb1,0x6334a),(0x67cb6,0x6334a),(0x67cbb,0x6334a),(0x67cc5,0x6433f),(0x67cd9,0x6710f),(0x67cf7,0x8140e),(0x67cfe,0x6435a)]:
 ck('B67_edge_'+hx(point),call(point)==dest)
ck('B67_bypass_sound_branch',data(0x67ce4,0x75,0x18) and 0x67ce6<0x67cfe)
ck('B67_later_overwrite',data(0x67d56,0xc7,5,0x78,0x5a,7,0,2,0,0,0))
# O95L conditional helpers, including a newly bounded returning path for 0x91D3D.
for point,dest in [(0x716ff,0x70f30),(0x71704,0x6435a),(0x721c2,0x70f30),(0x721c7,0x6435a),(0x91d55,0x931c0),(0x91d5a,0x632b8),(0x91d5f,0x91dc3),(0x91d64,0x6435a)]:
 ck('cond_edge_'+hx(point),call(point)==dest)
ck('indirect_jump_in_70f30',data(0x70ffb,0xff,0xe3))
ck('nonlocal_931c0',data(0x931e0,0xff,0xe0))
ck('nonlocal_632b8',data(0x632ce,0x58,0xe9) and data(0x632d4,0x58,0xe9))
ck('nonlocal_91dc3',data(0x91dca,0x58) and data(0x91dcb,0x8d,0x6d,0xfc))
# Important O95N correction: these are distinct path branches, not overwrites in their originating paths.
ck('N715_skips_second_lookup',shortjmp(0x71583)==0x715a8 and call(0x7159e)==0x918f1 and call(0x715d0)==0x6394c)
ck('N73F_skips_second_lookup',shortjmp(0x73f94)==0x73fc5 and call(0x73fbb)==0x918f1 and call(0x73fed)==0x6394c)
ck('N_alt_wrapper_unqualified_callback',data(0x639fb,0xff,0x15,0x70,0x5a,7,0) and call(0x63a07)==0x6435a)
ck('report_lists_branch_corrections',set(r['corrections']['o95nBranchOverwritesReinterpreted'])=={'0x71579','0x73F8A'})
# Nonpromoted cases: exact overwrite / returned-only checks.
for p,v in [(0x68ebf,0x40001),(0x69a25,0x40001),(0x961f7,0x3d)]:
 ck('explicit_overwrite_'+hx(p),data(p,0xc7,0x05,0x78,0x5a,0x07,0,*struct.pack('<I',v)))
ck('segment_navigator_return',call(0x63345)==0x918f1 and b[0x6335f]==0xc3)
ck('backtrack_return',data(0x7e643,0x83,0x2d,0x78,0x5a,0x07,0,8) and b[0x7e64a]==0xc3)
ck('generic_selector_return',data(0x63933,0x5e,0x5f,0xc3))
ck('setup_only',call(0x918e7)==0x64eca and call(0x918ec)==0x6433f)
S=r['summary']
ck('coverage_counts',(S['targetRoutes'],S['newTerminalQualifiedRoutes'],S['conditionalConsumerRoutes'],S['structuralOnlyRoutes'],S['strictTerminalQualifiedAfterO95O'],S['strongConsumerQualifiedAfterO95O'],S['routesWithoutAnyStrongQualifiedConsumerAfterO95O'])==(16,2,4,10,210,239,14))
ck('held_accounting',S['remainingWeakByOrigin']=={'O95H':0,'O95J':2,'O95L':6,'O95M':1,'O95N':5})
ck('not_overclaimed',all(r['decision'][k] is False for k in ['moveNamesEstablished','fighterNamesEstablished','wallClockTimingEstablished','completeMK2AnimationCoverageEstablished']))
ck('all_tests_report_passed',r['validation']['allChecksPassed'] and all(x['passed'] for x in r['validation']['checks']))
print(json.dumps({'status':'PASS','independentChecks':len(checks),'failures':0,'routes':16,'newTerminal':2,'conditional':4,'structuralOnly':10,'terminalCoverage':210,'strongConsumerCoverage':239,'withoutStrongConsumer':14,'o95nBranchErrorsCorrected':2},indent=2))
