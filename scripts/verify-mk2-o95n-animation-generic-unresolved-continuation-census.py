#!/usr/bin/env python3
import sys,json,struct,hashlib
from pathlib import Path
if len(sys.argv)<4: raise SystemExit('Usage: verify-mk2-o95n-animation-generic-unresolved-continuation-census.py <MK2.EXE> <o95h-json> <o95n-json>')
b=Path(sys.argv[1]).read_bytes();hrep=json.loads(Path(sys.argv[2]).read_text());rep=json.loads(Path(sys.argv[3]).read_text());checks=[]
def ck(n,c,d=''):
 checks.append((n,bool(c),d))
 if not c: raise AssertionError(f'{n}: {d}')
def i32(o): return struct.unpack_from('<i',b,o)[0]
def rel(p): return p+5+i32(p+1) if b[p] in (0xe8,0xe9) else None
def eq(o,v): return b[o:o+len(v)]==bytes(v)
def hx(x): return f'0x{x:X}'
A=0x918f1;B=0x91909;D=0x6435a;FIRST=0x64019;STD=0x86825;CUSTOM=0x83ecd
ck('exe_sha',hashlib.sha256(b).hexdigest()=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
target={(x['family'],x['physical']) for f in hrep['consumerFamilies'] if f['category']=='UNRESOLVED' for x in f['callsites']};ck('target31',len(target)==31,str(len(target)))
rr={(r['family'],r['lookupCallPhysical']):r for r in rep['routes']};ck('same31',set(rr)==target,str(len(rr)))
for fam,p in sorted(target,key=lambda x:x[1]): ck('lookup_'+hx(p),rel(p)==(A if fam=='A' else B),hx(rel(p) or 0))
for name,p,n,w in [('dynamic',D,0x34,'51be30b495b2193ae81758d17162fe22011a2edbd4808b84548de5f91b79a3a2'),('first',FIRST,0x44,'95edbe6c244da287cb595c03bc1ae0a0b9024984b5130dade30359ae1bee39d4'),('custom',CUSTOM,0x69,'2deedc63ab9adaee6e2275a1732c18276cad98659613c367d0b2b5cb3d8a1755'),('selector',0x638f9,0x3d,'2bdeea0e969a6c4536ed950227063bcc49e668508e0baaeb2e912393571766ba')]: ck('hash_'+name,hashlib.sha256(b[p:p+n]).hexdigest()==w)
# terminal dynamic direct
pairs=[(0x6852f,0x68552),(0x686d6,0x686e5),(0x688f5,0x68904),(0x68e1a,0x68e33),(0x710f3,0x71123),(0x7114e,0x71167),(0x71730,0x7175f),(0x7af49,0x7afc7),(0x7b9b0,0x7b9f0),(0x7bf95,0x7bfc6),(0x7c5d4,0x7c638),(0x7c771,0x7c7b2),(0x7e6f0,0x7e81f),(0x7f487,0x7f4aa),(0x83bb3,0x83bdb),(0x9c415,0x9c42f),(0x9c644,0x9c69c)]
for p,c in pairs: ck('dyn_'+hx(p),rel(c)==D,f'{hx(c)}->{hx(rel(c) or 0)}')
ck('via721',eq(0x721f3,[0xeb,0xbe]) and rel(0x721c7)==D)
ck('via7b5',rel(0x7b5d9)==0x71937 and rel(0x7194c)==D)
ck('via7dd',rel(0x7ddcf)==0x71659 and rel(0x7168b)==D)
# standard wrappers
ck('std928',rel(0x9288d)==STD,hx(rel(0x9288d) or 0));ck('std930',rel(0x930fb)==0x86822,hx(rel(0x930fb) or 0))
# first-dword constructor
ck('first67f',rel(0x67f40)==FIRST);ck('first952',rel(0x9521e)==0x63360 and rel(0x95223)==FIRST);ck('first95d',rel(0x95d3e)==0x63360 and rel(0x95d43)==FIRST)
# structural-only
ck('selector_returns',eq(0x63933,[0x5e,0x5f,0xc3]));ck('overwrite715',rel(0x7159e)==A);ck('overwrite73f',rel(0x73fbb)==A);ck('setup918',rel(0x918e7)==0x64eca and rel(0x918ec)==0x6433f)
# custom cursor walker
ck('custom_jump',rel(0x8500f)==CUSTOM);ck('custom_read',eq(0x83ed9,[0xa1,0x78,0x5a,0x07,0x00]) and eq(0x83ee0,[0x83,0x05,0x78,0x5a,0x07,0x00,0x04]) and b[0x83f35]==0xc3)
q={x:sum(1 for r in rep['routes'] if r['qualification']==x) for x in ['TERMINAL_QUALIFIED','STRONG_NONTERMINAL_CONSUMER','STRUCTURAL_ONLY']};ck('qual_counts',q=={'TERMINAL_QUALIFIED':23,'STRONG_NONTERMINAL_CONSUMER':3,'STRUCTURAL_ONLY':5},str(q))
s=rep['summary'];ck('summary',s['targetRoutes']==31 and s['newTerminalQualifiedRoutes']==23 and s['newStrongNonterminalConsumerRoutes']==3 and s['remainingStructuralOnlyRoutes']==5 and s['strictTerminalQualifiedAfterO95N']==208 and s['consumerQualifiedRoutesAfterO95N']==237 and s['routesWithoutAnyStrongQualifiedConsumerAfterO95N']==16,str(s))
ck('bounds',rep['decision']['humanMoveNamesEstablished'] is False and rep['decision']['timingEstablished'] is False)
print(json.dumps({'status':'PASS','checks':len(checks),'failures':0,'routes':31,'terminalQualifiedNew':23,'strongNonterminalNew':3,'structuralOnly':5,'strictTerminalQualifiedAfterO95N':208,'consumerQualifiedAfterO95N':237,'routesWithoutStrongQualifiedConsumerAfterO95N':16},indent=2))
