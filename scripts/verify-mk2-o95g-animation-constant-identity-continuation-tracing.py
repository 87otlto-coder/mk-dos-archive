#!/usr/bin/env python3
import sys,json,struct,hashlib
from pathlib import Path
if len(sys.argv)<4: raise SystemExit('Usage: verify-mk2-o95g-animation-constant-identity-continuation-tracing.py <MK2.EXE> <o69-json> <o95g-json>')
exe=Path(sys.argv[1]).read_bytes();o69=json.loads(Path(sys.argv[2]).read_text());report=json.loads(Path(sys.argv[3]).read_text());checks=[]
def ck(n,c,d=''):
 checks.append((n,bool(c),d))
 if not c: raise AssertionError(f'{n}: {d}')
U=lambda o:struct.unpack_from('<I',exe,o)[0];H=lambda o:struct.unpack_from('<H',exe,o)[0];I=lambda o:struct.unpack_from('<i',exe,o)[0];SH=lambda o:struct.unpack_from('<h',exe,o)[0]
def rel(p,opc):return p+5+I(p+1) if exe[p]==opc else None
ck('exe_sha',hashlib.sha256(exe).hexdigest()=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
LE=0x28f0c;DATA=0x61c54;OBJ2_FILE=0xA0C54
ps=U(LE+0x28);pages=U(LE+0x14);objtab=LE+U(LE+0x40);objc=U(LE+0x44);mp=LE+U(LE+0x48);fpt=LE+U(LE+0x68);frt=LE+U(LE+0x6c);objs=[]
for i in range(objc):
 p=objtab+i*24;objs.append((i+1,U(p+12),U(p+16)))
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
# O69 descriptor map.
o69map={}
for r in o69['qualifiedResources']+o69['partialOrAmbiguousResources']:
 for s in r['streams']:o69map[s['descriptorPhysical']]=(r['resourceName'],s)
# Slot-1 route into delayed Family-B standard interpreter.
ck('slot1_route_hash',hashlib.sha256(exe[0x68e9c:0x68ed8]).hexdigest()=='e2b96c928643f0dd5e2dcefe299b7c6de8241893058453920ab7a999a4ff7f2e')
ck('slot1_identity',exe[0x68e9c:0x68ea4]==bytes.fromhex('b801000000894746'))
ck('slot1_A_index39',exe[0x68ea4:0x68eae]==bytes.fromhex('c705785a070027000000') and rel(0x68eae,0xe8)==0x918f1)
ck('slot1_packed_B_input',exe[0x68ebf:0x68ec9]==bytes.fromhex('c705785a070001000400'))
ck('slot1_scheduler_jump',rel(0x68ed3,0xe9)==0x63b4b)
ck('scheduler_hash',hashlib.sha256(exe[0x63b4b:0x63b69]).hexdigest()=='2fbd3704397295126d0a98b90a4df25227454b509de00cbca0c36d27a95bd132')
ck('scheduler_B_lookup',rel(0x63b5e,0xe8)==0x91909)
ck('scheduler_standard_consumer',rel(0x63b64,0xe9)==0x86825)
ck('standard_consumer_hash',hashlib.sha256(exe[0x86825:0x8684e]).hexdigest()=='2a1fefaa3d57d7d85efe17078e3fdc9225c91ce2ac1650f0c08492becfe66eba')
ck('standard_consumer_interpreter',rel(0x8682d,0xe8)==0x63e79)
f=by.get((2,0x1d588+1*4));ck('slot1_B_root',f is not None and f[0]==2 and f[1]==0x5174 and f[3]==7,str(f))
f=by.get((2,0x5174+1*4));ck('slot1_B_index1',f is not None and f[0]==2 and f[1]==0x606c and f[3]==7,str(f))
sp=op(2,0x606c);ck('slot1_stream_phys',sp==0xa6cc0,hex(sp or 0));ck('slot1_stream_hash',hashlib.sha256(exe[sp:sp+0x4c]).hexdigest()=='90b278e844dbe3f6a18e582d42b3e32cfa5f717f934546e3c9061acc8dc9a8d1')
arrays=[0x6088,0x6090,0x6098,0x60a0,0x60a8,0x60b0];descs=[0x218f4,0x21900,0x2190c,0x21918,0x21924,0x21930]
expected=[(23,32,-75,-10,0),(37,49,-66,0,976),(39,51,-64,2,3224),(41,57,-65,6,5620),(44,60,-64,9,8200),(49,65,-62,11,10884)]
for i,(a,d,e) in enumerate(zip(arrays,descs,expected)):
 f=by.get((2,0x606c+i*4));ck(f'slot1_stream_ptr_{i}',f is not None and f[0]==2 and f[1]==a and f[3]==7,str(f))
 f=by.get((2,a));ck(f'slot1_comp_ptr_{i}',f is not None and f[0]==2 and f[1]==d and f[3]==7,str(f))
 p=op(2,a+4);ck(f'slot1_comp_zero_{i}',p is not None and U(p)==0,hex(p or 0))
 phys=OBJ2_FILE+d;w,h,x,y,ref=struct.unpack_from('<HHhhI',exe,phys);ck(f'slot1_descriptor_bytes_{i}',(w,h,x,y,ref&0xffffff)==e,str((w,h,x,y,ref&0xffffff)))
 rec=o69map.get(phys);ck(f'slot1_o69_{i}',rec is not None and rec[0]=='EXPLODE.GRA',str(rec[0] if rec else None))
 if rec:
  s=rec[1];ck(f'slot1_o69_fields_{i}',(s['width'],s['height'],s['x'],s['y'],s['graOffset'])==e,str((s['width'],s['height'],s['x'],s['y'],s['graOffset'])))
p=op(2,0x6084);ck('slot1_token0',p is not None and U(p)==0,hex(p or 0))
# Slot-0 direct-descriptor specialized consumer.
ck('slot0_route_hash',hashlib.sha256(exe[0x7b04d:0x7b078]).hexdigest()=='e87edcba64292b4e1674029768dca4b93768fb094539a83a32ad4a3c43a427fe')
ck('slot0_identity',exe[0x7b04d:0x7b055]==bytes.fromhex('b800000000894746'))
ck('slot0_index2',exe[0x7b055:0x7b05f]==bytes.fromhex('c705785a070002000000') and rel(0x7b05f,0xe8)==0x91909)
ck('slot0_consumer_jump',rel(0x7b073,0xe9)==0x86c99)
ck('special_loop_hash',hashlib.sha256(exe[0x86c99:0x86cc5]).hexdigest()=='c99a2f1147f3731fa6cdcf6da328dd4c9d66eee4e12bc4d8ca83ef418fa363e6')
ck('special_loop_call',rel(0x86ca1,0xe8)==0x86cc5)
ck('special_consumer_hash',hashlib.sha256(exe[0x86cc5:0x86d54]).hexdigest()=='5bb74d8fd65bbed5ce44290954fd6734a77b22d256fa005a34c9b04e2da616ab')
ck('special_renderer_call',rel(0x86d26,0xe8)==0x9377c)
ck('renderer_hash',hashlib.sha256(exe[0x9377c:0x93809]).hexdigest()=='805bf822d414cc532f39e0ac02c497433142693ac70eb5b870c6c017dbc17f64')
f=by.get((2,0x1d588));ck('slot0_B_root',f is not None and f[0]==2 and f[1]==0x3c94 and f[3]==7,str(f))
f=by.get((2,0x3c94+2*4));ck('slot0_B_index2',f is not None and f[0]==2 and f[1]==0x4f64 and f[3]==7,str(f))
descs2=[0x23594,0x235a0,0x235ac,0x235b8,0x235c4];exp2=[(32,110,30,-4,112484),(38,110,36,-4,114712),(35,110,39,-4,116700),(30,110,42,-4,118516),(26,110,44,-4,120304)]
for i,(d,e) in enumerate(zip(descs2,exp2)):
 f=by.get((2,0x4f64+i*4));ck(f'slot0_desc_ptr_{i}',f is not None and f[0]==2 and f[1]==d and f[3]==7,str(f))
 phys=OBJ2_FILE+d;w,h,x,y,ref=struct.unpack_from('<HHhhI',exe,phys);ck(f'slot0_descriptor_bytes_{i}',(w,h,x,y,ref&0xffffff)==e,str((w,h,x,y,ref&0xffffff)))
 rec=o69map.get(phys);ck(f'slot0_o69_{i}',rec is not None and rec[0]=='HH2.GRA',str(rec[0] if rec else None))
 if rec:
  s=rec[1];ck(f'slot0_o69_fields_{i}',(s['width'],s['height'],s['x'],s['y'],s['graOffset'])==e,str((s['width'],s['height'],s['x'],s['y'],s['graOffset'])))
p=op(2,0x4f78);ck('slot0_token0',p is not None and U(p)==0,hex(p or 0))
ck('special_cursor_read_advance',exe[0x86cc5:0x86cd4]==bytes.fromhex('8b15785a07008b1a8305785a070004'))
ck('special_token0_return',exe[0x86d3b:0x86d40]==bytes.fromhex('83fb007412') and exe[0x86d52:0x86d54]==bytes.fromhex('f9c3'))
ck('special_token1_redirect',exe[0x86d40:0x86d4f]==bytes.fromhex('83fb01750b528b52048915785a0700'))
ck('renderer_descriptor_geometry',exe[0x937ba:0x937bf]==bytes.fromhex('8b4b088b03') and exe[0x93848:0x9384b]==bytes.fromhex('8b4b04'))
# Report reconciliation.
ck('report_format',report['format']=='mk2_animation_constant_identity_continuation_tracing_o95g_v1')
ck('report_verdict',report['decision']['verdict']=='MK2_O95G_SLOT1_DELAYED_STANDARD_AND_SLOT0_SPECIALIZED_DIRECT_DESCRIPTOR_FIXED_IDENTITY_SEQUENCES_ESTABLISHED')
ck('report_summary',report['summary']=={'fixedNumericIdentityWitnessesBefore':3,'newFixedNumericIdentityWitnesses':2,'fixedNumericIdentityWitnessesTotal':5,'standardInterpreterNewWitnesses':1,'specializedConsumerNewWitnesses':1})
w=report['slot1DelayedStandardWitness'];ck('report_slot1',w['identitySlot']==1 and w['family']=='B' and w['derivedFamilyBIndex']==1 and w['rootObject2Offset']==0x5174 and w['streamObject2Offset']==0x606c and len(w['frames'])==6 and w['termination']['token']==0 and w['preSchedulerSelection']['promotedAsAnimation'] is False)
w=report['slot0SpecializedDirectDescriptorWitness'];ck('report_slot0',w['identitySlot']==0 and w['family']=='B' and w['nestedIndex']==2 and w['rootObject2Offset']==0x3c94 and w['streamObject2Offset']==0x4f64 and len(w['descriptorSteps'])==5 and w['termination']['token']==0 and w['consumerGrammar']['otherControlFormsFullyClassified'] is False)
ck('report_boundaries',report['decision']['familyBUniversalStreamGrammarRejected'] is True and report['decision']['allConstantIdentityRoutesResolved'] is False and report['decision']['specializedConsumerFullyGeneralized'] is False and report['decision']['timingEstablished'] is False and report['decision']['humanMoveNamesEstablished'] is False)
print(json.dumps({'status':'PASS','checks':len(checks),'failures':0,'fixups':fixcount,'newWitnesses':[{'identitySlot':1,'family':'B','index':1,'stream':'0x606C','steps':6,'resource':'EXPLODE.GRA','consumer':'O95C shared interpreter via delayed scheduler wrapper'},{'identitySlot':0,'family':'B','index':2,'stream':'0x4F64','steps':5,'resource':'HH2.GRA','consumer':'specialized direct-descriptor consumer 0x86CC5'}],'universalFamilyBGrammar':False},indent=2))
