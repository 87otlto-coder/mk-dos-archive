#!/usr/bin/env python3
import sys,json,struct,hashlib
from pathlib import Path
if len(sys.argv)<4: raise SystemExit('Usage: verify-mk2-o95e-animation-identity-provenance-delayed-joins.py <MK2.EXE> <o69-json> <o95e-json>')
exe=Path(sys.argv[1]).read_bytes();o69=json.loads(Path(sys.argv[2]).read_text());report=json.loads(Path(sys.argv[3]).read_text());checks=[]
def ck(n,c,d=''):
 checks.append((n,bool(c),d))
 if not c: raise AssertionError(f'{n}: {d}')
U=lambda o:struct.unpack_from('<I',exe,o)[0];H=lambda o:struct.unpack_from('<H',exe,o)[0];I=lambda o:struct.unpack_from('<i',exe,o)[0];SH=lambda o:struct.unpack_from('<h',exe,o)[0]
ck('exe_sha',hashlib.sha256(exe).hexdigest()=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
LE=0x28f0c;DATA=0x61c54;OBJ2_FILE=0xA0C54
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
def short(p):
 if exe[p]!=0xeb:return None
 d=exe[p+1]-256 if exe[p+1]&0x80 else exe[p+1]
 return p+2+d
# Related-object direct wrapper at the sole O95D dynamic-index direct route.
ck('related_hash',hashlib.sha256(exe[0x63e45:0x63e74]).hexdigest()=='b4f8958545e915a3da4b9cae048e7a206ce19bca8a3acf0555ae49d3fb499a36')
ck('related_index_from_eax',exe[0x63e4c:0x63e51]==bytes.fromhex('a3785a0700'))
ck('related_identity_object',exe[0x63e51:0x63e54]==bytes.fromhex('8b7e28'))
ck('related_lookup',rel(0x63e54,0xe8)==0x918f1)
ck('related_interpreter',rel(0x63e59,0xe8)==0x63e79)
# Delayed wrapper mechanics.
ck('wrapper_hash',hashlib.sha256(exe[0x64acc:0x64b08]).hexdigest()=='c6f47aa4d99236180f2e7b272edb4baeb725145f36801ec38dc9da1a709bfe88')
ck('wrapper_a_lookup',rel(0x64ade,0xe8)==0x918f1)
ck('wrapper_b_lookup',rel(0x64af7,0xe8)==0x91909)
ck('wrapper_tail_interpreter',rel(0x64b03,0xe9)==0x63e79)
ck('raw_delayed_input',U(0x7c2b6)==0x30001 and rel(0x7c2ba,0xe8)==0x64ae5)
ck('raw_delayed_derived',((0x30001&0xffff),(0x30001>>14))==(1,12))
# Explicit case-13 path reaches relocation-backed Object-2 handler.
ck('case13_source',U(0x7987d)==13 and short(0x79881)==0x79826)
ck('case13_trampoline',rel(0x79826,0xe9)==0x7b588)
ck('dispatcher_hash',hashlib.sha256(exe[0x7b588:0x7b59d]).hexdigest()=='3d7fd926db5e93316b67aa47b587c2b0a8144f8c6430572d137565f9be299269')
f=by.get((1,0x19941));ck('dispatcher_table_fixup',f is not None and f[0]==2 and f[1]==0x134f8 and f[3]==7,str(f))
f=by.get((2,0x1352c));ck('case13_table_entry',f is not None and f[0]==2 and f[1]==0x1359a and f[2]==0xb41ee and f[3]==7,str(f))
ck('case13_prefix_hash',hashlib.sha256(exe[0xb41ee:0xb4245]).hexdigest()=='66e903a5ef9aa8c088ccf7c43764dd52164aec806111a06cba4704e08d3a569c')
ck('slot7_write',exe[0xb422e:0xb4236]==bytes.fromhex('b807000000894746'))
ck('index1_write',exe[0xb4236:0xb4240]==bytes.fromhex('c705785a070001000000'))
f=by.get((2,0x135ed));ck('case13_wrapper_fixup',f is not None and f[2]==0x64ae5 and f[3]==8 and f[4]==0xb4241,str(f))
# Family B slot7/index1 exact selected stream.
f=by.get((2,0x1d588+7*4));ck('B_slot7_root',f is not None and f[0]==2 and f[1]==0xd188 and f[3]==7,str(f))
f=by.get((2,0xd188+4));ck('B_slot7_index1',f is not None and f[0]==2 and f[1]==0xd5d8 and f[3]==7,str(f))
# Six bounded RD0 frame compositions.
arrays=[0xd640,0xd638,0xd630,0xd628,0xd620,0xd618];descs=[0x27b58,0x27b4c,0x27b40,0x27b34,0x27b28,0x27b18]
expected=[(51,107,18,-3,41788),(48,88,20,-21,38300),(49,77,20,-33,35180),(50,66,20,-43,32396),(47,50,18,-60,30708),(83,54,40,-76,28404)]
o69map={}
for r in o69['qualifiedResources']+o69['partialOrAmbiguousResources']:
 for s in r['streams']:o69map[s['descriptorPhysical']]=(r['resourceName'],s)
for i,(a,d,e) in enumerate(zip(arrays,descs,expected)):
 f=by.get((2,0xd5d8+i*4));ck(f'stream_ptr_{i}',f is not None and f[0]==2 and f[1]==a and f[3]==7,str(f))
 f=by.get((2,a));ck(f'composition_ptr_{i}',f is not None and f[0]==2 and f[1]==d and f[3]==7,str(f))
 p=op(2,a+4);ck(f'composition_zero_{i}',p is not None and U(p)==0,hex(p or 0))
 dp=OBJ2_FILE+d;w,h,x,y,ref=struct.unpack_from('<HHhhI',exe,dp);ck(f'descriptor_bytes_{i}',(w,h,x,y,ref&0xffffff)==e,str((w,h,x,y,ref&0xffffff)))
 rec=o69map.get(dp);ck(f'o69_rd0_{i}',rec is not None and rec[0]=='RD0.GRA',str(rec[0] if rec else None))
 if rec:
  s=rec[1];ck(f'o69_fields_{i}',(s['width'],s['height'],s['x'],s['y'],s['graOffset'])==e,str((s['width'],s['height'],s['x'],s['y'],s['graOffset'])))
p=op(2,0xd5d8+6*4);ck('stream_token0',p is not None and U(p)==0,hex(p or 0))
# Report reconciliation and hard boundaries.
ck('report_format',report['format']=='mk2_animation_identity_provenance_delayed_joins_o95e_v1')
ck('report_verdict',report['decision']['verdict']=='MK2_O95E_RELATED_OBJECT_IDENTITY_PROVENANCE_AND_FIXED_SLOT7_DELAYED_FAMILY_B_SIX_FRAME_SEQUENCE_ESTABLISHED')
ck('report_summary',report['summary']=={'o95dDirectRoutes':28,'o95dPreviouslyUnresolvedIdentityRoutes':27,'relatedObjectDerivedDirectRoutesPromoted':1,'newFixedNumericIdentityDelayedRoutes':1,'fixedNumericIdentityWitnessesTotal':2})
w=report['fixedDelayedWitness'];ck('report_witness',w['identitySlot']==7 and w['family']=='B' and w['nestedIndex']==1 and w['entryDisplacement']==0 and w['rootObject2Offset']==0xd188 and w['streamObject2Offset']==0xd5d8 and len(w['frames'])==6)
ck('report_boundaries',w['timingEstablished'] is False and w['semanticNameEstablished'] is False and w['runtimeObservationEstablished'] is False and report['decision']['allO95DIdentityRoutesResolved'] is False and report['decision']['crossProductIdentityInstantiationPerformed'] is False)
print(json.dumps({'status':'PASS','checks':len(checks),'failures':0,'fixups':fixcount,'relatedObjectDirectRoute':'A[relatedObject.identity][EAX]','delayedWrapperKnownCall':{'family':'B','input':'0x30001','index':1,'entryDisplacement':12},'fixedDelayedWitness':{'identitySlot':7,'family':'B','index':1,'streamObject2Offset':'0xD5D8','frames':6,'resource':'RD0.GRA','termination':'token 0'}},indent=2))
