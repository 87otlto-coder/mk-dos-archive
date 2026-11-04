#!/usr/bin/env python3
import sys,json,struct,hashlib
from pathlib import Path
if len(sys.argv)<4: raise SystemExit('Usage: verify-mk2-o95i-animation-nonstandard-consumer-grammar-expansion.py <MK2.EXE> <o69-json> <o95i-json>')
exe=Path(sys.argv[1]).read_bytes(); o69=json.loads(Path(sys.argv[2]).read_text()); rep=json.loads(Path(sys.argv[3]).read_text()); checks=[]
def ck(n,c,d=''):
 checks.append((n,bool(c),d))
 if not c: raise AssertionError(f'{n}: {d}')
def u16(o):return struct.unpack_from('<H',exe,o)[0]
def i16(o):return struct.unpack_from('<h',exe,o)[0]
def u32(o):return struct.unpack_from('<I',exe,o)[0]
def i32(o):return struct.unpack_from('<i',exe,o)[0]
def rel(p,op):return p+5+i32(p+1) if p+5<=len(exe) and exe[p]==op else None
def h(p,n):return hashlib.sha256(exe[p:p+n]).hexdigest()
def calls(t):return [p for p in range(len(exe)-5) if exe[p]==0xe8 and p+5+i32(p+1)==t]
ck('exe_sha',hashlib.sha256(exe).hexdigest()=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
# LE fixups independently reconstructed.
LE=0x28f0c; DATA=0x61c54; OBJ2_FILE=0xA0C54
ps=u32(LE+0x28); pages=u32(LE+0x14); ot=LE+u32(LE+0x40); oc=u32(LE+0x44); mp=LE+u32(LE+0x48); ft=LE+u32(LE+0x68); fr=LE+u32(LE+0x6c)
objs=[]
for i in range(oc):
 p=ot+i*24;objs.append((i+1,u32(p+12),u32(p+16)))
nums=[exe[mp+i*4]<<16|exe[mp+i*4+1]<<8|exe[mp+i*4+2] for i in range(pages)]
def pagephys(lp):return DATA+(nums[lp-1]-1)*ps
def objfor(lp):
 for idx,m,c in objs:
  if m<=lp<m+c:return idx,lp-m
 raise AssertionError('object page')
def objphys(obj,off):
 idx,m,c=objs[obj-1];pg=off//ps
 return None if pg>=c else pagephys(m+pg)+(off%ps)
po=[u32(ft+i*4) for i in range(pages+1)];by={}
for pg in range(pages):
 p=fr+po[pg];end=fr+po[pg+1]
 while p<end:
  src,flags=exe[p],exe[p+1];p+=2;st=src&15
  ck('no_source_list_'+str(pg),not(src&0x20))
  so=i16(p);p+=2;ck('internal_fixup_'+str(pg),(flags&3)==0)
  ob=2 if flags&0x40 else 1;to=u16(p) if ob==2 else exe[p];p+=ob;off=0
  if st!=2:
   if flags&0x10:off=u32(p);p+=4
   else:off=u16(p);p+=2
  if flags&4:p+=4 if flags&0x20 else 2
  obj,w=objfor(pg+1);by[(obj,w*ps+so)]=(to,off,objphys(to,off),st)
 ck('fix_page_end_'+str(pg),p==end)
# Authenticate slices.
for name,p,n,w in [
 ('walker',0x6334a,0x16,'ad0121136ffc0948d045970c95153542cc9d00f0a44d59fe00153a1a8732ac66'),
 ('reverse',0x8684e,0x60,'2b342abff03f67a3237dee644222d6928ec81a39d7e5fbdb72eada177902610c'),
 ('special',0x86cc5,0x8f,'5bb74d8fd65bbed5ce44290954fd6734a77b22d256fa005a34c9b04e2da616ab'),
 ('builder',0x640df,0xbd,'64dbc1105b4a7dd9039b75c90fb4621f410063c879e152423e6c9582fb57d3dd')]:ck('hash_'+name,h(p,n)==w,h(p,n))
# Reconstruct walker routes directly from lookup calls and immediate code bytes.
A=0x918f1;B=0x91909;W=0x6334a
walker=[]
for fam,t in [('A',A),('B',B)]:
 for p in calls(t):
  if rel(p+5,0xe8)==W: walker.append((fam,p))
ck('walker_routes',len(walker)==23,str(len(walker)));ck('walker_family_counts',sum(f=='A' for f,_ in walker)==1 and sum(f=='B' for f,_ in walker)==22,str(walker))
dist={};total=0
for fam,p in walker:
 q=p+5;n=0
 while rel(q,0xe8)==W:n+=1;q+=5
 dist[n]=dist.get(n,0)+1;total+=n
ck('walker_total_invocations',total==36,str(total));ck('walker_distribution',dist=={1:13,2:7,3:3},str(dist))
# Walker machine semantics: load cursor; load dword; cursor +=4; loop while dword nonzero; ret.
ck('walker_semantics',exe[W:W+5]==bytes.fromhex('a1785a0700') and exe[W+5:W+7]==bytes.fromhex('8b00') and exe[W+7:W+14]==bytes.fromhex('8305785a070004') and exe[0x63358:0x6335f]==bytes.fromhex('a9ffffffff75eb') and exe[0x6335f]==0xc3)
# Descriptor offsets from prerequisite O69 evidence.
desc=set()
for r in o69['qualifiedResources']+o69['partialOrAmbiguousResources']:
 for s in r['streams']:desc.add(s['descriptorPhysical']-OBJ2_FILE)
# Reconstruct Family A roots from raw root-table fixups, no O95B report import.
roots=[]
for slot in range(17):
 f=by.get((2,0x1d544+slot*4));ck('A_slot_root_'+str(slot),f is not None and f[0]==2,str(f));roots.append((slot,f[1]))
unique={}
for slot,root in roots:unique.setdefault(root,[]).append(slot)
ck('A_unique_roots',len(unique)==11,str(unique))
# Reverse route itself.
ck('reverse_route',u32(0x922d8)==5 and rel(0x922dc,0xe8)==A and exe[0x922e1:0x922e6]==bytes.fromhex('b802000000') and rel(0x922f7,0xe9)==0x8684e)
ck('reverse_field_scheduler',exe[0x8687e:0x86881]==bytes.fromhex('895f42') and rel(0x86884,0xe8)==0x6710f and exe[0x640e0:0x640e3]==bytes.fromhex('894742'))
payload_dist={};comp=0;raw=[]
for root,slots in unique.items():
 f=by.get((2,root+20));ck('index5_fix_'+hex(root),f is not None and f[0]==2,str(f));off=f[1];phys=f[2];ck('prezero_'+hex(root),u32(phys-4)==0,hex(u32(phys-4)))
 n=0
 while n<32:
  ff=by.get((2,off+n*4));v=u32(objphys(2,off+n*4))
  if ff is None and v==0:break
  if ff:
   ck('payload_obj2_'+hex(root)+'_'+str(n),ff[0]==2,str(ff));first=by.get((2,ff[1]));term=objphys(2,ff[1]+4);ck('payload_comp_'+hex(root)+'_'+str(n),first is not None and first[0]==2 and first[1] in desc and u32(term)==0,str((ff,first)));comp+=1
  else:raw.append((v,tuple(slots)))
  n+=1
 ck('trailing_zero_'+hex(root),n<32,str(n));payload_dist[n]=payload_dist.get(n,0)+1
ck('payload_distribution',payload_dist=={3:9,5:1,7:1},str(payload_dist));ck('composition_pointers',comp==37,str(comp));ck('raw_controls',sorted(raw)==[(5,(12,)),(5,(13,))],str(raw))
# Specialized route and token classes.
ck('special_route_index2',u32(0x68c9b)==2 and rel(0x68c9f,0xe8)==B and rel(0x68ce0,0xe9)==0x86c99)
ck('lookupB_edi_identity',exe[B:B+3]==bytes.fromhex('8b4746'))
ck('special_high_mask_renderer',exe[0x86cd4:0x86cda]==bytes.fromhex('f7c30000f0ff') and rel(0x86d26,0xe8)==0x9377c)
ck('special_2xxxx',exe[0x86cdc:0x86ce4]==bytes.fromhex('b800000200668bc3') and exe[0x86ce8:0x86cf5]==bytes.fromhex('8325685a0700ef81e3ffff0000'))
ck('special_token_0_1',exe[0x86d3b:0x86d43]==bytes.fromhex('83fb00741283fb01') and exe[0x86d45:0x86d4f]==bytes.fromhex('528b52048915785a0700'))
# Report reconciliation.
ck('format',rep['format']=='mk2_animation_nonstandard_consumer_grammar_expansion_o95i_v1');ck('verdict',rep['decision']['verdict']=='MK2_O95I_NONSTANDARD_CONSUMERS_REFINED_SEGMENT_SKIP_REVERSE_COMPOSITION_SEQUENCE_AND_SPECIALIZED_TOKEN_CLASSES')
ck('report_walker',rep['segmentSkipper']['lookupRoutes']==23 and rep['segmentSkipper']['immediateInvocationCount']==36 and rep['decision']['walkerReclassifiedAsSegmentNavigation'] is True)
ck('report_reverse',rep['reverseSequence']['uniqueQualifiedRootVariants']==11 and rep['reverseSequence']['relocationBackedCompositionPointers']==37 and rep['reverseSequence']['numericIdentityEstablished'] is False)
ck('report_special',rep['specializedConsumer']['secondRoute']['numericIdentityEstablished'] is False and rep['specializedConsumer']['universalIndex2StreamShapeClaim'] is False)
ck('open_bounds',rep['decision']['timingEstablished'] is False and rep['decision']['humanMoveNamesEstablished'] is False)
print(json.dumps({'status':'PASS','checks':len(checks),'failures':0,'walkerRoutes':23,'walkerInvocations':36,'skipDistribution':dist,'reverseRootVariants':11,'reverseCompositionPointers':37,'rawControlValues':raw,'specializedSecondRouteIdentity':'symbolic current EDI object +0x46'},indent=2))
