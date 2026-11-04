#!/usr/bin/env python3
import sys,json,struct,hashlib
from pathlib import Path
if len(sys.argv)<4: raise SystemExit('Usage: verify-mk2-o95f-animation-fixed-identity-provenance-expansion.py <MK2.EXE> <o69-json> <o95f-json>')
exe=Path(sys.argv[1]).read_bytes();o69=json.loads(Path(sys.argv[2]).read_text());report=json.loads(Path(sys.argv[3]).read_text());checks=[]
def ck(n,c,d=''):
 checks.append((n,bool(c),d))
 if not c: raise AssertionError(f'{n}: {d}')
U=lambda o:struct.unpack_from('<I',exe,o)[0];H=lambda o:struct.unpack_from('<H',exe,o)[0];I=lambda o:struct.unpack_from('<i',exe,o)[0];SH=lambda o:struct.unpack_from('<h',exe,o)[0]
ck('exe_sha',hashlib.sha256(exe).hexdigest()=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
LE=0x28f0c;DATA=0x61c54;OBJ1_FILE=0x61c54;OBJ2_FILE=0xA0C54
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
po=[U(fpt+i*4) for i in range(pages+1)];by={};fixcount=0
for pg0 in range(pages):
 p=frt+po[pg0];end=frt+po[pg0+1]
 while p<end:
  src,flags=exe[p],exe[p+1];p+=2;st=src&15;so=SH(p);p+=2
  ck('no_source_list_'+str(fixcount),not(src&0x20));ck('internal_'+str(fixcount),(flags&3)==0)
  ob=2 if flags&0x40 else 1;tobj=H(p) if ob==2 else exe[p];p+=ob;toff=0
  if st!=2:
   if flags&0x10:toff=U(p);p+=4
   else:toff=H(p);p+=2
  if flags&4:p+=4 if flags&0x20 else 2
  oi,pw=ofp(pg0+1);by[(oi,pw*ps+so)]=(tobj,toff,op(tobj,toff),st,pp(pg0+1)+so);fixcount+=1
 ck('page_end_'+str(pg0),p==end)
def rel(p,opc):return p+5+I(p+1) if exe[p]==opc else None
def count46(b):
 n=0
 for p in range(len(b)-2):
  if b[p]==0x89:
   m=b[p+1];mod=m>>6;rm=m&7
   if mod==1 and rm!=4 and b[p+2]==0x46:n+=1
 return n
# Exact fixed route / helper slices.
ck('route_hash',hashlib.sha256(exe[0x83dbd:0x83dd9]).hexdigest()=='48b6ce27421dc8bb3c79c6d1eadcec42999543fbd4dae6d31c6539de61747635')
ck('identity6_write',exe[0x83dbd:0x83dc5]==bytes.fromhex('b806000000894746'))
ck('prelookup_helper_call',rel(0x83dc5,0xe8)==0x64e44)
ck('index0_write',exe[0x83dca:0x83dd4]==bytes.fromhex('c705785a070000000000'))
ck('combined_call',rel(0x83dd4,0xe8)==0x63e74)
ck('combined_lookup',rel(0x63e74,0xe8)==0x918f1 and 0x63e79==0x63e74+5)
ck('helper_hash',hashlib.sha256(exe[0x64e44:0x64e9b]).hexdigest()=='3f8232f85d4ec476c2cf70954f4bf965b487850bce72c0851e78dce71b0fb926')
ck('combined_hash',hashlib.sha256(exe[0x63e74:0x63e9f]).hexdigest()=='7742fa05924c79e8ed6da5004c97379683c71f0df54ec289739b03539ff25f22')
helper_ranges=[('identityIndexedDwordRead',0x64ed2,0x64ed9,'898a1279f65ea9b926b2933c239dfae4fce2ac0be29852f76b345728e2350cfd'),('paletteReferenceUpdateWrapper',0x645f6,0x64617,'9b0f8d2c96917303c21fbacf0a5a5fb84b6d143415f32f2546c8d16957de8c42'),('paletteReferenceRelease',0x7b3f8,0x7b404,'9297cab37fae675450b81087d3d7afb65993d3d129c0fb54008241fec9de46b5'),('paletteReferenceDecrement',0x7b505,0x7b536,'eabd1b6dd38c9a0824b6a8d20c611611327284533c41f59e2a5ac8f4b08ca6fb'),('paletteReferenceAcquire',0x7b439,0x7b505,'abdd7eba4bbda3a1fe136d46abd78469ccdfbb47b1849bda15329f93fb501b9c'),('paletteWriteQueue',0x7b2d0,0x7b30b,'447e55057c60a3cd2f915aa668a00e259676eb03b28ae673b23801da38576d69'),('fatalErrorTail',0x61df4,0x61e2b,'c3936f2577ef02b6f174ec4077db07cd004eb2c9d2cb2f16b879c78253e4e18f')]
ck('helper_no_direct46',count46(exe[0x64e44:0x64e9b])==0)
for n,s,e,h in helper_ranges:
 ck('helper_hash_'+n,hashlib.sha256(exe[s:e]).hexdigest()==h)
 ck('helper_no46_'+n,count46(exe[s:e])==0)
ck('fatal_tail_jump',rel(0x61e26,0xe9)==0x9e5cb)
# Family A slot6/index0.
f=by.get((2,0x1d544+6*4));ck('A_slot6_root',f is not None and f[0]==2 and f[1]==0x11744 and f[3]==7,str(f))
f=by.get((2,0x11744));ck('A_slot6_index0',f is not None and f[0]==2 and f[1]==0x11884 and f[3]==7,str(f))
sp=op(2,0x11884);ck('stream_phys',sp==0xb24d8,hex(sp or 0));ck('stream_hash',hashlib.sha256(exe[sp:sp+0x2c]).hexdigest()=='926f43a1181a2b6d375029dc77d851d6008490169b3a7aa1b62f1ff0ff33db85')
arrays=[0x118a8,0x118b0,0x118b8,0x118c0,0x118c8,0x118d0,0x118d8];descs=[0x25ee4,0x25e2c,0x25e38,0x25e44,0x25e50,0x25e5c,0x25e68]
expected=[(44,96,18,-9,27664),(44,97,18,-8,0),(44,99,18,-6,3512),(44,100,18,-5,7196),(44,98,18,-6,10868),(44,97,19,-8,14428),(44,96,19,-9,17832)]
o69map={}
for r in o69['qualifiedResources']+o69['partialOrAmbiguousResources']:
 for s in r['streams']:o69map[s['descriptorPhysical']]=(r['resourceName'],s)
for i,(a,d,e) in enumerate(zip(arrays,descs,expected)):
 f=by.get((2,0x11884+i*4));ck(f'stream_ptr_{i}',f is not None and f[0]==2 and f[1]==a and f[3]==7,str(f))
 f=by.get((2,a));ck(f'composition_ptr_{i}',f is not None and f[0]==2 and f[1]==d and f[3]==7,str(f))
 p=op(2,a+4);ck(f'composition_zero_{i}',p is not None and U(p)==0,hex(p or 0))
 dp=OBJ2_FILE+d;w,h,x,y,ref=struct.unpack_from('<HHhhI',exe,dp);ck(f'descriptor_bytes_{i}',(w,h,x,y,ref&0xffffff)==e,str((w,h,x,y,ref&0xffffff)))
 rec=o69map.get(dp);ck(f'o69_st0_{i}',rec is not None and rec[0]=='ST0.GRA',str(rec[0] if rec else None))
 if rec:
  s=rec[1];ck(f'o69_fields_{i}',(s['width'],s['height'],s['x'],s['y'],s['graOffset'])==e,str((s['width'],s['height'],s['x'],s['y'],s['graOffset'])))
p=op(2,0x118a0);ck('loop_token1',p is not None and U(p)==1,hex(p or 0))
f=by.get((2,0x118a4));ck('loop_target_stream_start',f is not None and f[0]==2 and f[1]==0x11884 and f[3]==7,str(f))
# Qualified object+0x46 write-site census.
writes=[]
for lo,hi in [(OBJ1_FILE,OBJ2_FILE),(OBJ2_FILE,len(exe))]:
 for p in range(lo,hi-2):
  if exe[p]==0x89:
   m=exe[p+1];mod=m>>6;rm=m&7
   if mod==1 and rm!=4 and exe[p+2]==0x46:writes.append(p)
known=[0x67a11,0x67f4d,0x68ea1,0x699dd,0x7b052,0x7b1aa,0x7bca5,0x8399b,0x83dc2,0x845ba,0x85c73,0x950a2,0x950e9,0x95145,0x9515c,0x951b4,0x951cb,0x95237,0x95d57,0x960a2,0x96228,0x971a8,0x97f2b,0xb4233]
ck('write_site_census',writes==known,str([hex(x) for x in writes]))
constants={0x67f4d:9,0x68ea1:1,0x699dd:1,0x7b052:0,0x83dc2:6,0x950a2:12,0x950e9:6,0x95145:12,0x9515c:6,0x951b4:12,0x951cb:6,0xb4233:7}
for p,v in constants.items():ck('const_write_'+hex(p),exe[p-5]==0xb8 and U(p-4)==v and exe[p:p+3] in (bytes.fromhex('894746'),bytes.fromhex('895746'),bytes.fromhex('895346'),bytes.fromhex('895046'),bytes.fromhex('894b46')),exe[p-5:p+3].hex())
ck('write_counts',len(writes)==24 and len(constants)==12)
# Report reconciliation and boundaries.
ck('report_format',report['format']=='mk2_animation_fixed_identity_provenance_expansion_o95f_v1')
ck('report_verdict',report['decision']['verdict']=='MK2_O95F_SLOT6_FAMILY_A_INDEX0_SEVEN_FRAME_ST0_STRUCTURAL_LOOP_AND_IDENTITY_WRITE_CENSUS_ESTABLISHED')
ck('report_summary',report['summary']=={'qualifiedIdentityWriteSites':24,'constantIdentityWrites':12,'copyOrDynamicIdentityWrites':12,'fixedNumericIdentityWitnessesBefore':2,'newFixedNumericIdentityWitnesses':1,'fixedNumericIdentityWitnessesTotal':3})
w=report['fixedWitness'];ck('report_witness',w['identitySlot']==6 and w['family']=='A' and w['nestedIndex']==0 and w['rootObject2Offset']==0x11744 and w['streamObject2Offset']==0x11884 and len(w['frames'])==7 and w['loop']['token']==1 and w['loop']['targetObject2Offset']==0x11884)
ck('report_boundaries',w['timingEstablished'] is False and w['semanticNameEstablished'] is False and w['runtimeObservationEstablished'] is False and report['decision']['allConstantIdentityWritesPromoted'] is False and report['decision']['copyDerivedIdentitiesPromoted'] is False and report['decision']['wholeAnimationCorpusEstablished'] is False)
print(json.dumps({'status':'PASS','checks':len(checks),'failures':0,'fixups':fixcount,'identityWrites':{'total':24,'constant':12,'copyOrDynamic':12},'fixedWitness':{'identitySlot':6,'family':'A','index':0,'streamObject2Offset':'0x11884','frames':7,'resource':'ST0.GRA','termination':'token 1 -> stream start structural loop'}},indent=2))
