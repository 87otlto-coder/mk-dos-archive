#!/usr/bin/env python3
import sys,json,struct,hashlib
from pathlib import Path
if len(sys.argv)<3: raise SystemExit('Usage: verify-mk2-o95b-animation-root-graph.py <MK2.EXE> <o95b-json>')
exe=Path(sys.argv[1]).read_bytes(); report=json.loads(Path(sys.argv[2]).read_text());checks=[]
def ck(n,c,d=''):
 checks.append((n,bool(c),d))
 if not c: raise AssertionError(f'{n}: {d}')
ck('exe_sha',hashlib.sha256(exe).hexdigest()=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
LE=0x28f0c;DATA=0x61c54;U=lambda o:struct.unpack_from('<I',exe,o)[0];H=lambda o:struct.unpack_from('<H',exe,o)[0];I=lambda o:struct.unpack_from('<i',exe,o)[0]
ps=U(LE+0x28);pages=U(LE+0x14);objtab=LE+U(LE+0x40);objc=U(LE+0x44);mp=LE+U(LE+0x48);fpt=LE+U(LE+0x68);frt=LE+U(LE+0x6c);objs=[]
for i in range(objc):p=objtab+i*24;objs.append((i+1,U(p+12),U(p+16)))
pnums=[(exe[mp+i*4]<<16)|(exe[mp+i*4+1]<<8)|exe[mp+i*4+2] for i in range(pages)]
def pp(lp):return DATA+(pnums[lp-1]-1)*ps
def ofp(lp):
 for idx,mi,pc in objs:
  if mi<=lp<mi+pc:return idx,lp-mi
 raise AssertionError('page object')
def op(obj,off):
 _,mi,pc=objs[obj-1];pg=off//ps
 return None if pg>=pc else pp(mi+pg)+(off%ps)
po=[U(fpt+i*4) for i in range(pages+1)];by={}
for pg0 in range(pages):
 p=frt+po[pg0];end=frt+po[pg0+1]
 while p<end:
  src,flags=exe[p],exe[p+1];p+=2;st=src&15;so=struct.unpack_from('<h',exe,p)[0];p+=2;ck('no_source_list_'+hex(p),not(src&0x20));ck('internal_'+hex(p),(flags&3)==0)
  ob=2 if flags&0x40 else 1;tobj=H(p) if ob==2 else exe[p];p+=ob;toff=0
  if st!=2:
   if flags&0x10:toff=U(p);p+=4
   else:toff=H(p);p+=2
  if flags&4:p+=4 if flags&0x20 else 2
  oi,pw=ofp(pg0+1);by[(oi,pw*ps+so)]=(tobj,toff,op(tobj,toff),st)
 ck('page_end_'+str(pg0),p==end)
# exact lookup routines
sigA=bytes.fromhex('8b47468b148544d50100a1785a07008b0482a3785a0700c3');sigB=bytearray(sigA);sigB[6]=0x88
ck('lookup_A_signature',exe[0x918f1:0x918f1+len(sigA)]==sigA);ck('lookup_B_signature',exe[0x91909:0x91909+len(sigB)]==bytes(sigB))
expected_roots={
 'A':[0x3b8c,0x506c,0xbb64,0xe514,0x208c,0x208c,0x11744,0xd080,0x9b4c,0x9b4c,0x9b4c,0xf970,0x12e74,0x10fd0,0x9b4c,0x9b4c,0x208c],
 'B':[0x3c94,0x5174,0xbc6c,0xe61c,0x2194,0x21b8,0x1184c,0xd188,0x9c54,0x9c68,0x9c88,0xfa78,0x12ed4,0x11038,0x9c88,0x9c88,0x208c]}
expected_lengths={'A':{0x208c:64,0x3b8c:80,0x506c:71,0x9b4c:64,0xbb64:64,0xd080:64,0xe514:64,0xf970:64,0x10fd0:33,0x11744:64,0x12e74:38},'B':{0x208c:64,0x2194:19,0x21b8:10,0x3c94:14,0x5174:5,0x9c54:20,0x9c68:15,0x9c88:7,0xbc6c:14,0xd188:18,0xe61c:13,0xfa78:14,0x11038:7,0x1184c:21,0x12ed4:14}}
expected_calls={'A':(0x918f1,144,125,[0,1,3,5,6,7,8,10,11,12,13,15,16,17,18,19,20,22,23,24,25,27,30,31,35,36,37,38,39,40,41,54,55,57,60,61,63,65]),'B':(0x91909,109,103,[0,1,2,3,4,5,6,7,8,13])}
for label,table in [('A',0x1d544),('B',0x1d588)]:
 roots=[]
 for slot in range(17):
  f=by.get((2,table+slot*4));ck(f'{label}_slot_{slot}_fixup',f is not None and f[0]==2 and f[3]==7)
  roots.append(f[1])
 ck(label+'_roots_exact',roots==expected_roots[label],str([hex(x) for x in roots]))
 ck(label+'_unique_roots',len(set(roots))==(11 if label=='A' else 15))
 for r,nexp in expected_lengths[label].items():
  n=0
  while (2,r+n*4) in by and by[(2,r+n*4)][0]==2 and by[(2,r+n*4)][3]==7:n+=1
  ck(f'{label}_root_{r:x}_length',n==nexp,str(n))
 target,total,adj,inds=expected_calls[label];sites=[]
 for p in range(len(exe)-5):
  if exe[p]==0xe8 and p+5+I(p+1)==target:sites.append(p)
 ck(label+'_call_count',len(sites)==total,str(len(sites)))
 vals=[]
 for p in sites:
  if p>=10 and exe[p-10:p-4]==bytes.fromhex('c705785a0700'):vals.append(U(p-4))
  elif p>=10 and exe[p-10]==0xb8 and exe[p-5:p]==bytes.fromhex('a3785a0700'):vals.append(U(p-9))
 ck(label+'_adjacent_immediate_calls',len(vals)==adj,str(len(vals)));ck(label+'_indices',sorted(set(vals))==inds,str(sorted(set(vals))))
# reconcile headline report values
s=report['summary'];ck('report_A_roots',s['familyAUniqueRoots']==11);ck('report_B_roots',s['familyBUniqueRoots']==15);ck('report_A_entries',s['familyAUniqueRootEntries']==670);ck('report_B_entries',s['familyBUniqueRootEntries']==255);ck('report_calls',s['familyADirectCalls']==144 and s['familyBDirectCalls']==109);ck('report_boundary',report['decision']['animationCommandGrammarEstablished'] is False and report['decision']['timingEstablished'] is False)
print(json.dumps({'status':'PASS','checks':len(checks),'failures':0,'familyAUniqueRoots':11,'familyBUniqueRoots':15,'familyAEntries':670,'familyBEntries':255,'familyADirectCalls':144,'familyBDirectCalls':109},indent=2))
