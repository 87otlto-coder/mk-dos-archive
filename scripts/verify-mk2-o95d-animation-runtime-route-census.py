#!/usr/bin/env python3
import argparse,hashlib,json,struct,pathlib,sys
EXPECTED='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
LE=0x28f0c;DATA=0x61c54;LOOK_A=0x918f1;LOOK_B=0x91909;INTERP=0x63e79;TABLE_A=0x1d544;TABLE_B=0x1d588;WITNESS=0x950da

def main():
 ap=argparse.ArgumentParser();ap.add_argument('fixture');ap.add_argument('report');a=ap.parse_args();root=pathlib.Path(a.fixture);files={x.name.upper():x for x in root.iterdir() if x.is_file()};exe=files['MK2.EXE'].read_bytes();report=json.load(open(a.report));checks=[]
 def ck(i,v,d=''):
  if not v: raise AssertionError(f'{i}: {d}')
  checks.append(i)
 ck('exe_sha',hashlib.sha256(exe).hexdigest()==EXPECTED)
 u16=lambda o:struct.unpack_from('<H',exe,o)[0];i16=lambda o:struct.unpack_from('<h',exe,o)[0];u32=lambda o:struct.unpack_from('<I',exe,o)[0];i32=lambda o:struct.unpack_from('<i',exe,o)[0]
 page=u32(LE+0x28);pages=u32(LE+0x14);objtab=LE+u32(LE+0x40);objcount=u32(LE+0x44);mapo=LE+u32(LE+0x48);fpt=LE+u32(LE+0x68);frt=LE+u32(LE+0x6c)
 objs=[]
 for i in range(objcount):
  p=objtab+i*24;objs.append((i+1,u32(p+12),u32(p+16)))
 pnums=[]
 for i in range(pages):
  p=mapo+i*4;pnums.append(exe[p]<<16|exe[p+1]<<8|exe[p+2])
 def pagephys(lp):return DATA+(pnums[lp-1]-1)*page
 def objfor(lp):
  for x in objs:
   if x[1]<=lp<x[1]+x[2]:return x,lp-x[1]
  raise AssertionError('object page')
 po=[u32(fpt+i*4) for i in range(pages+1)];by={};fixcount=0
 for pg0 in range(pages):
  p=frt+po[pg0];end=frt+po[pg0+1]
  while p<end:
   src=exe[p];flags=exe[p+1];p+=2;st=src&15;ck(f'fix_src_list_{fixcount}',not(src&0x20));so=i16(p);p+=2;ck(f'fix_internal_{fixcount}',(flags&3)==0);ob=2 if flags&0x40 else 1;to=u16(p) if ob==2 else exe[p];p+=ob;off=0
   if st!=2:
    if flags&0x10:off=u32(p);p+=4
    else:off=u16(p);p+=2
   if flags&4:p+=4 if flags&0x20 else 2
   o,within=objfor(pg0+1);by[(o[0],within*page+so)]=(to,off,st);fixcount+=1
  ck(f'fix_page_end_{pg0}',p==end)
 def roots(table):
  arr=[]
  for slot in range(17):
   f=by.get((2,table+slot*4));ck(f'table_{table:x}_{slot}',f is not None and f[0]==2 and f[2]==7,str(f));arr.append(f[1])
  return arr
 ra,rb=roots(TABLE_A),roots(TABLE_B)
 def extent(root):
  n=0
  while True:
   f=by.get((2,root+n*4))
   if not f or f[0]!=2 or f[2]!=7:return n
   n+=1
 def target(p):return p+5+i32(p+1) if exe[p]==0xe8 else None
 def idx_before(p):
  if p>=10 and exe[p-10:p-4]==bytes([0xc7,0x05,0x78,0x5a,0x07,0x00]):return u32(p-4)
  if p>=10 and exe[p-10]==0xb8 and exe[p-5:p]==bytes([0xa3,0x78,0x5a,0x07,0x00]):return u32(p-9)
  return None
 def routes(lookup):
  return [p for p in range(len(exe)-10) if target(p)==lookup and target(p+5)==INTERP]
 aa,bb=routes(LOOK_A),routes(LOOK_B);ck('route_counts',len(aa)==11 and len(bb)==17,f'{len(aa)}/{len(bb)}')
 raw=[]
 for fam,sites,rr in [('A',aa,ra),('B',bb,rb)]:
  for p in sites:
   idx=idx_before(p);within=outside=None
   if idx is not None:
    within=[s for s,r in enumerate(rr) if idx<extent(r)];outside=[s for s,r in enumerate(rr) if idx>=extent(r)]
   raw.append((p,fam,idx,within,outside))
 raw.sort()
 ck('immediate_27',sum(x[2] is not None for x in raw)==27)
 ck('dynamic_1',sum(x[2] is None for x in raw)==1)
 ck('dynamic_site',[(hex(p),f) for p,f,i,_,_ in raw if i is None]==[(hex(0x63e54),'A')])
 ck('witness_bytes',exe[0x9509d]==0xb8 and u32(0x9509e)==12 and exe[0x950a2:0x950a5]==b'\x89\x47\x46')
 ck('witness_route',any(p==WITNESS and f=='A' and i==7 for p,f,i,_,_ in raw))
 rows=report['routes'];ck('report_format',report['format']=='mk2_animation_runtime_route_census_o95d_v1');ck('report_count',len(rows)==28)
 for (p,f,idx,within,outside),r in zip(raw,rows):
  ck(f'row_addr_{p:x}',r['lookupCallPhysical']==p);ck(f'row_family_{p:x}',r['family']==f);ck(f'row_idx_{p:x}',r['nestedIndex']['value']==idx);ck(f'row_within_{p:x}',r['slotsWithinQualifiedContiguousRootExtent']==within);ck(f'row_outside_{p:x}',r['slotsOutsideQualifiedContiguousRootExtent']==outside)
  if p==WITNESS:
   ck('row_witness_identity',r['identity']['kind']=='FIXED_CONSTANT' and r['identity']['slot']==12);ck('row_witness_stream',r['exactSelectedStreamObject2Offset']==0x130b8)
  else:ck(f'row_unresolved_{p:x}',r['identity']['kind']=='UNRESOLVED_AT_ROUTE' and r['identity']['slot'] is None)
 ck('summary',report['summary']=={'directLookupInterpreterRoutes':28,'familyARoutes':11,'familyBRoutes':17,'immediateIndexRoutes':27,'nonAdjacentOrDynamicIndexRoutes':1,'fixedNumericIdentityRoutes':1,'identityUnresolvedRoutes':27})
 ck('boundary',report['decision']['crossProductIdentityInstantiationPerformed'] is False and report['decision']['streamCorpusComplete'] is False and report['decision']['fixedIdentityCoverageComplete'] is False)
 print(json.dumps({'status':'PASS','checks':len(checks),'fixups':fixcount,'routes':28,'fixedNumericIdentityRoutes':1,'identityUnresolvedRoutes':27,'dynamicIndexRoutes':1},indent=2))
if __name__=='__main__':
 try:main()
 except Exception as e:print(json.dumps({'status':'FAIL','error':str(e)},indent=2));sys.exit(1)
