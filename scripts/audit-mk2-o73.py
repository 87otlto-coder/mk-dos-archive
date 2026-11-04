#!/usr/bin/env python3
import sys,zipfile,hashlib,struct,json,os
if len(sys.argv)<4: raise SystemExit('usage: audit-mk2-o73.py <mk2.zip> <o73-report.json> <out.json>')
zip_path,report_path,out_path=sys.argv[1:4]
with zipfile.ZipFile(zip_path) as z:
    name=next(n for n in z.namelist() if n.lower().endswith('/mk2.exe') or n.lower()=='mk2.exe'); b=z.read(name)
r=json.load(open(report_path,'r',encoding='utf-8'))
checks=[]
def ck(i,p,d): checks.append({'id':i,'passed':bool(p),'detail':str(d)})
def u16(o): return struct.unpack_from('<H',b,o)[0]
def i16(o): return struct.unpack_from('<h',b,o)[0]
def u32(o): return struct.unpack_from('<I',b,o)[0]
sha=hashlib.sha256(b).hexdigest(); ck('exe_sha',sha=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',sha); ck('exe_size',len(b)==861133,len(b))
BASE=0x26654;LE=0x28f0c
ck('embedded_mz',b[BASE:BASE+2]==b'MZ',b[BASE:BASE+2]); ck('embedded_to_le',BASE+u32(BASE+0x3c)==LE,hex(BASE+u32(BASE+0x3c))); ck('le_sig',b[LE:LE+4]==b'LE\0\0',b[LE:LE+4])
page_size=u32(LE+0x28);last=u32(LE+0x2c);pages=u32(LE+0x14);DATA=BASE+u32(LE+0x80);ck('data_base',DATA==0x61c54,hex(DATA));ck('data_eof',DATA+(pages-1)*page_size+last==len(b),hex(DATA+(pages-1)*page_size+last))
objtab=LE+u32(LE+0x40);objs=[]
for i in range(u32(LE+0x44)):
 p=objtab+i*24;objs.append({'idx':i+1,'size':u32(p),'base':u32(p+4),'mapidx':u32(p+12),'pages':u32(p+16)})
ck('object_geometry',objs==[{'idx':1,'size':0x3ee98,'base':0x10000,'mapidx':1,'pages':63},{'idx':2,'size':0x86660,'base':0x50000,'mapidx':64,'pages':50}],objs)
mapoff=LE+u32(LE+0x48);mapents=[((b[mapoff+i*4]<<16)|(b[mapoff+i*4+1]<<8)|b[mapoff+i*4+2],b[mapoff+i*4+3]) for i in range(pages)]
def pagephys(lp): return DATA+(mapents[lp-1][0]-1)*page_size
def objforpage(lp):
 for o in objs:
  if o['mapidx']<=lp<o['mapidx']+o['pages']: return o,lp-o['mapidx']
 raise ValueError(lp)
def targetphys(obj,off):
 o=objs[obj-1];pg=off//page_size
 if pg>=o['pages']: return None
 return pagephys(o['mapidx']+pg)+(off%page_size)
fpt=LE+u32(LE+0x68);frt=LE+u32(LE+0x6c);po=[u32(fpt+i*4) for i in range(pages+1)]
recs=[]
for pg0 in range(pages):
 p=frt+po[pg0];end=frt+po[pg0+1]
 while p<end:
  rp=p;src=b[p];flags=b[p+1];p+=2;stype=src&15;so=i16(p);p+=2
  assert not(src&0x20) and (flags&3)==0
  osz=2 if flags&0x40 else 1;obj=int.from_bytes(b[p:p+osz],'little');p+=osz;toff=0
  if stype!=2:
   tsz=4 if flags&0x10 else 2;toff=int.from_bytes(b[p:p+tsz],'little');p+=tsz
  if flags&4:p+=4 if flags&0x20 else 2
  lp=pg0+1;o,opg=objforpage(lp);sp=pagephys(lp)+so
  rec={'rp':rp,'stype':stype,'sp':sp,'sobj':o['idx'],'soff':opg*page_size+so,'obj':obj,'toff':toff,'tp':targetphys(obj,toff)};recs.append(rec)
 assert p==end
ck('fixup_count',len(recs)==27004,len(recs)); ck('type7_count',sum(x['stype']==7 for x in recs)==26900,sum(x['stype']==7 for x in recs))
by_phys={x['sp']:x for x in recs}; by_obj={(x['sobj'],x['soff']):x for x in recs}
# identity lookup code: mov eax,[edi+46]; mov edx,[eax*4+1d588]
sig=bytes.fromhex('8b 47 46 8b 14 85 88 d5 01 00'); ck('identity_lookup_signature',b[0x91909:0x91909+len(sig)]==sig,b[0x91909:0x91909+len(sig)].hex())
# resource pool identity independent of O68/O69 report
start=b.find(b'PLAYSTA.GRA\x00'); names=[];cur=start
while cur>=0 and cur<len(b):
 z=b.find(b'\0',cur); names.append(b[cur:z].decode('ascii')); cur=z+1
 if names[-1].upper()=='RM.DRV': break
ck('resource_pool_start',start==0xa0ef1,hex(start));ck('resource_pool_count',len(names)==129,len(names));ck('jc0_pool_ordinal',len(names)>109 and names[109].upper()=='JC0.GRA',names[109] if len(names)>109 else None)
# Object2 physical helper
OBJ2_PHYS=0xa0c54 # object2 file start: DATA + 63*0x1000
ck('object2_file_start',targetphys(2,0)==OBJ2_PHYS,hex(targetphys(2,0)))
identity_phys=targetphys(2,0x1d588);ck('identity_table_physical',identity_phys==0xbe1dc,hex(identity_phys))
slot_roots=[]
for slot in range(17):
 f=by_phys.get(identity_phys+slot*4);good=f and f['stype']==7 and f['obj']==2
 ck(f'identity_slot_{slot:02d}_fixup',good, f"src={hex(identity_phys+slot*4)} target={hex(f['toff']) if f else None}")
 slot_roots.append(f['toff'] if f else None)
expected_roots=[0x3c94,0x5174,0xbc6c,0xe61c,0x2194,0x21b8,0x1184c,0xd188,0x9c54,0x9c68,0x9c88,0xfa78,0x12ed4,0x11038,0x9c88,0x9c88,0x208c]
ck('identity_roots_exact',slot_roots==expected_roots,[hex(x) for x in slot_roots])
# bounded witness chains into descriptors
specs=[
(0,'HH',[0x3cd4],'HH0.GRA'),(1,'LK',[0x51b4],'LK0.GRA'),(2,'JC',[0xbcac],'JC0.GRA'),(3,'BA',[0xe658],'BA0.GRA'),
(4,'FN',[0x21bc,0x239a,0x241a],'FN6.GRA'),(5,'FN',[0x21bc,0x239a,0x241a],'FN6.GRA'),(6,'ST',[0x118b0],'ST0.GRA'),(7,'RD',[0xd1d8],'RD0.GRA'),
(8,'NJ',[0x9cb4,0x9d7a],'NJ6.GRA'),(9,'NJ',[0x9cb4,0x9d7a],'NJ6.GRA'),(10,'NJ',[0x9cb4,0x9d7a],'NJ6.GRA'),(11,'JX',[0xfac0],'JX0.GRA'),
(12,'GO',[0x12f14],'GO.GRA'),(13,'SK',[0x1105c],'SK.GRA'),(14,'NJ',[0x9cb4,0x9d7a],'NJ6.GRA'),(15,'NJ',[0x9cb4,0x9d7a],'NJ6.GRA'),(16,'FN',[0x21bc,0x239a,0x241a],'FN6.GRA')]
rows=[]
for slot,fam,steps,expected_name in specs:
 current=slot_roots[slot]
 allgood=True
 for step in steps:
  f=by_obj.get((2,step));good=f and f['stype']==7 and f['obj']==2
  ck(f'slot_{slot:02d}_witness_{step:05x}',good,f"{hex(step)}->{hex(f['toff']) if f else None}");allgood &= bool(good)
  if good: current=f['toff']
 dp=targetphys(2,current) if current is not None else None
 ref=u32(dp+8) if dp is not None and dp+12<=len(b) else 0;rid=(ref>>24)&0xff;off=ref&0xffffff;name=names[rid] if rid<len(names) else None
 good=allgood and name and name.upper()==expected_name.upper()
 ck(f'slot_{slot:02d}_resource',good,f"family={fam} desc={hex(current) if current is not None else None} physical={hex(dp) if dp else None} rid={rid} name={name} graOff={hex(off)}")
 rows.append((fam,current,dp,name,off))
pattern=','.join(x[0] for x in rows);ck('resource_family_pattern',pattern=='HH,LK,JC,BA,FN,FN,ST,RD,NJ,NJ,NJ,JX,GO,SK,NJ,NJ,FN',pattern)
# decisive JC0 descriptor
jc=rows[2]; ck('jc0_exact_descriptor',jc[1]==0x24784 and jc[2]==0xc53d8 and jc[3]=='JC0.GRA' and jc[4]==0,(hex(jc[1]),hex(jc[2]),jc[3],hex(jc[4])))
ck('jc0_geometry',u16(0xc53d8)==47 and u16(0xc53da)==100 and i16(0xc53dc)==22 and i16(0xc53de)==-12,(u16(0xc53d8),u16(0xc53da),i16(0xc53dc),i16(0xc53de)))
ck('jc0_packed_ref',u32(0xc53e0)==0x6d000000,hex(u32(0xc53e0)))
# same object+46 palette caller + slot2 exact pointers
psig=bytes.fromhex('b8 b8 c1 01 00');ck('palette_selector_signature',b[0x85aa4:0x85aa9]==psig,b[0x85aa4:0x85aa9].hex())
for label,taboff,expect in [('A',0x1c1b8,0x2574a),('B',0x1c1fc,0x257ca)]:
 tp=targetphys(2,taboff);f=by_phys.get(tp+2*4);good=f and f['stype']==7 and f['obj']==1 and f['toff']==expect
 ck(f'palette_{label}_slot2_fixup',good,f"table={hex(tp)} target={hex(f['toff']) if f else None}")
 pp=targetphys(1,expect);ck(f'palette_{label}_slot2_count',pp is not None and u16(pp)==63,f"physical={hex(pp) if pp else None} count={u16(pp) if pp else None}")
# report policy and exact result
ck('report_verdict',r.get('decision',{}).get('verdict')=='MK2_JC0_RESOURCE_TO_PALETTE_SELECTOR_SLOT_JOIN_ESTABLISHED_HUMAN_SLOT_NAMES_PARTIAL',r.get('decision',{}).get('verdict'))
ck('report_slot',r.get('jc0Join',{}).get('identitySlot')==2 and r.get('jc0Join',{}).get('paletteSelectorSlot')==2,r.get('jc0Join',{}))
ck('report_palette_pair',r.get('jc0Join',{}).get('tableA',{}).get('paletteObject1Offset')==0x2574a and r.get('jc0Join',{}).get('tableB',{}).get('paletteObject1Offset')==0x257ca,r.get('jc0Join',{}))
ck('report_human_names_not_promoted',r.get('decision',{}).get('humanNameRosterMappingEstablished') is False and r.get('selectorIndexMechanism',{}).get('humanNameBySlotEstablished') is False,'human names remain partial/unresolved')
ck('report_no_rgba',r.get('decision',{}).get('correctColorRgbaEstablished') is False and r.get('jc0Join',{}).get('correctColorRgbaEstablished') is False,'no RGBA')
failed=[x for x in checks if not x['passed']]
out={'format':'mk2_o73_independent_audit_v1','source':'independent Python parse of authentic MK2.EXE; does not call TypeScript O73 implementation','checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'jc0ResourceToIdentitySlot2Established':not failed,'jc0IdentitySlot2ToPaletteSlot2Established':not failed,'humanNameRosterMappingEstablished':False,'correctColorRgbaEstablished':False,'verdict':'MK2_O73_INDEPENDENT_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
os.makedirs(os.path.dirname(out_path) or '.',exist_ok=True);json.dump(out,open(out_path,'w'),indent=2)
print(json.dumps({k:out[k] for k in ('checkCount','passedCount','failedCount','allChecksPassed')},indent=2))
if failed: print(json.dumps(failed,indent=2))
raise SystemExit(1 if failed else 0)
