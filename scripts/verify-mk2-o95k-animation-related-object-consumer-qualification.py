#!/usr/bin/env python3
import sys,json,struct,hashlib,subprocess,re,shutil
from pathlib import Path
if len(sys.argv)<4: raise SystemExit('Usage: verify-mk2-o95k-animation-related-object-consumer-qualification.py <MK2.EXE> <o95h-json> <o95k-json>')
exe_path=Path(sys.argv[1]);hrep=json.loads(Path(sys.argv[2]).read_text());rep=json.loads(Path(sys.argv[3]).read_text());b=exe_path.read_bytes();checks=[]
def ck(n,c,d=''):
 checks.append((n,bool(c),d))
 if not c: raise AssertionError(f'{n}: {d}')
def i32(o):return struct.unpack_from('<i',b,o)[0]
def rel(p):return p+5+i32(p+1) if p+5<=len(b) and b[p] in (0xe8,0xe9) else None
def rel8(p):return p+2+struct.unpack_from('<b',b,p+1)[0] if p+2<=len(b) and b[p] in (0xeb,) else None
def eq(o,v):return b[o:o+len(v)]==bytes(v)
def h(p,n):return hashlib.sha256(b[p:p+n]).hexdigest()
def hx(n):return f'0x{n:X}'
ck('exe_sha',hashlib.sha256(b).hexdigest()=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
ck('objdump_available',shutil.which('objdump') is not None,shutil.which('objdump') or '')
# Independently authenticate bounded consumer/helper slices.
HASHES={
 'related':(0x679f2,0x5f,'24d4713308700ea5916e4c61fafd5d5d6a3a12a55dcf15e493889aa946fc34d5'),
 'cursor_constructor':(0x64019,0x4c,'21f8102a0cb28001ae4726f774ed70525aff8389d02ce7fda1de33cf2f3bf417'),
 'frame_setup':(0x64069,0x3b,'1f91899dcf1866512f2e39b0f2a1afe4dac20b199772e1204aeab4fddbc5c5ee'),
 'composition_builder':(0x640df,0xbd,'64dbc1105b4a7dd9039b75c90fb4621f410063c879e152423e6c9582fb57d3dd'),
 'manual_frame_init':(0x64522,0x1f,'e9eb0f39085d3af99087c3df8538659c84c5f97eefc04c3a0dfeb4a4352db956'),
 'manual_route':(0x69b43,0x6c,'2d1ff3c00cec5cdb730016db034676bc9545e4596be0315969e2aed06e15af70')}
for n,(p,l,w) in HASHES.items(): ck('hash_'+n,h(p,l)==w,h(p,l))
ck('related_calls_constructor',rel(0x679f3)==0x64019,hx(rel(0x679f3) or 0))
ck('constructor_reads_cursor',eq(0x64046,[0xa1,0x78,0x5a,0x07,0x00]) and eq(0x6404b,[0x52,0x8b,0x10]) and eq(0x6404e,[0x89,0x15,0x6c,0x5a,0x07,0x00]))
ck('frame_setup_deref',eq(0x64070,[0xa1,0x6c,0x5a,0x07,0x00]) and eq(0x64075,[0x52,0x8b,0x10]) and eq(0x64078,[0x89,0x15,0x6c,0x5a,0x07,0x00]))
ck('frame_setup_tail_builder',rel8(0x640a2)==0x640df,hx(rel8(0x640a2) or 0))
ck('builder_composition_store',eq(0x640df,[0x57,0x89,0x47,0x42]))
ck('builder_loop_shape',eq(0x640ea,[0x52,0x8b,0x10]) and eq(0x640f4,[0x83,0xc0,0x04]) and eq(0x640f7,[0xf7,0x05,0x6c,0x5a,0x07,0x00,0xff,0xff,0xff,0xff]))
ck('related_publish',eq(0x679f8,[0x89,0x3d,0x7c,0x5a,0x07,0x00]))
ck('related_identity_copy',eq(0x67a0e,[0x8b,0x4f,0x46]) and eq(0x67a11,[0x89,0x4b,0x46]))
ck('related_link',eq(0x67a14,[0x89,0x5e,0x34]))
# Reconstruct the O95H related route set from its report and independently classify immediate selected-pointer use.
fam=next(x for x in hrep['consumerFamilies'] if x['category']=='RELATED_OBJECT_STATE');routes=sorted((x['family'],x['physical']) for x in fam['callsites'])
ck('route_count',len(routes)==22,str(len(routes)));ck('family_counts',sum(f=='A' for f,_ in routes)==9 and sum(f=='B' for f,_ in routes)==13,str((sum(f=='A' for f,_ in routes),sum(f=='B' for f,_ in routes))))
line_re=re.compile(r'^\s*([0-9a-f]+):\s+((?:[0-9a-f]{2}\s+)+)\s*([a-z][a-z0-9.]*)\s*(.*)$')
def dis(p,stop):
 out=subprocess.check_output(['objdump','-D','-b','binary','-m','i386','-M','intel',f'--start-address={p}',f'--stop-address={stop}',str(exe_path)],text=True,stderr=subprocess.DEVNULL)
 ins=[]
 for line in out.splitlines():
  m=line_re.match(line)
  if m: ins.append((int(m.group(1),16),m.group(3),m.group(4).strip()))
 return ins
def target(op):
 m=re.search(r'0x([0-9a-f]+)',op);return int(m.group(1),16) if m else None
classified={}
for family,p in routes:
 ins=dis(p,p+64);ck('entry_'+hx(p),bool(ins) and ins[0][0]==p,str(ins[0] if ins else None))
 calls=[(a,target(op)) for a,mn,op in ins[:16] if mn=='call']
 if any(t==0x679f2 for _,t in calls): subtype='RELATED_HELPER_FIRST_COMPOSITION'
 elif any(t==0x64019 for _,t in calls): subtype='DIRECT_CURSOR_CONSTRUCTOR_FIRST_COMPOSITION'
 else: subtype='MANUAL_FIRST_COMPOSITION_OBJECT_PATH'
 classified[p]=subtype
 if subtype=='MANUAL_FIRST_COMPOSITION_OBJECT_PATH': ck('manual_only_'+hx(p),p==0x69b43,hx(p))
# Exact subtype distribution and unique special routes.
from collections import Counter
c=Counter(classified.values());ck('subtype_counts',c==Counter({'RELATED_HELPER_FIRST_COMPOSITION':20,'DIRECT_CURSOR_CONSTRUCTOR_FIRST_COMPOSITION':1,'MANUAL_FIRST_COMPOSITION_OBJECT_PATH':1}),str(c))
ck('direct_route',classified.get(0x835d2)=='DIRECT_CURSOR_CONSTRUCTOR_FIRST_COMPOSITION')
ck('manual_route_unique',classified.get(0x69b43)=='MANUAL_FIRST_COMPOSITION_OBJECT_PATH')
# Independently authenticate the manual first-DWORD path.
ck('manual_mirror',eq(0x69b49,[0x8b,0x15,0x78,0x5a,0x07,0x00]) and eq(0x69b4f,[0x89,0x15,0x80,0x5a,0x07,0x00]))
ck('manual_scratch',eq(0x69b57,[0x8b,0x15,0x78,0x5a,0x07,0x00]) and eq(0x69b5d,[0x89,0x15,0x6c,0x5a,0x07,0x00]))
ck('manual_first_deref',eq(0x69b65,[0xa1,0x6c,0x5a,0x07,0x00]) and eq(0x69b6a,[0x52,0x8b,0x10]) and eq(0x69b6d,[0x89,0x15,0x6c,0x5a,0x07,0x00]))
ck('manual_init_call',rel(0x69b75)==0x64522,hx(rel(0x69b75) or 0))
ck('manual_init_fields',eq(0x64528,[0xa1,0x6c,0x5a,0x07,0x00]) and eq(0x6452d,[0x89,0x47,0x3c]) and eq(0x64531,[0x8b,0x50,0x08]) and eq(0x64539,[0x8b,0x10]))
# Compare O95K report exact route classification and conservative metric boundary.
ck('report_format',rep['format']=='mk2_animation_related_object_consumer_qualification_o95k_v1')
rr={r['lookupCallPhysical']:r['subtype'] for r in rep['routes']};ck('report_routes_exact',rr==classified,f'{len(rr)}/{len(classified)}')
s=rep['summary'];ck('report_summary',s['relatedObjectStateRoutes']==22 and s['helperRoutes']==20 and s['directCursorConstructorRoutes']==1 and s['manualFirstCompositionRoutes']==1 and s['strictTerminalQualifiedAfterO95J']==161 and s['consumerQualifiedRoutesAfterO95K']==183 and s['routesWithoutAnyQualifiedConsumerAfterO95K']==70,str(s))
ck('strict_boundary',all(r['consumerQualified'] is True and r['terminalQualified'] is False for r in rep['routes']))
ck('open_semantics',rep['decision']['strictTerminalCountInflated'] is False and rep['decision']['humanMoveNamesEstablished'] is False and rep['decision']['timingEstablished'] is False)
print(json.dumps({'status':'PASS','checks':len(checks),'failures':0,'relatedRoutes':22,'subtypes':dict(c),'strictTerminalQualifiedAfterO95J':161,'consumerQualifiedAfterO95K':183,'routesWithoutAnyQualifiedConsumerAfterO95K':70},indent=2))
