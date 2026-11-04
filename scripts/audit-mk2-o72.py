#!/usr/bin/env python3
import sys,zipfile,hashlib,struct,json,os
if len(sys.argv)<4: raise SystemExit('usage: audit-mk2-o72.py <mk2.zip> <o72-report.json> <out.json>')
zip_path,report_path,out_path=sys.argv[1:4]
with zipfile.ZipFile(zip_path) as z:
 name=next(n for n in z.namelist() if n.lower().endswith('/mk2.exe') or n.lower()=='mk2.exe'); b=z.read(name)
r=json.load(open(report_path,'r',encoding='utf-8'))
checks=[]
def ck(i,p,d):checks.append({'id':i,'passed':bool(p),'detail':str(d)})
def u16(o):return struct.unpack_from('<H',b,o)[0]
def i16(o):return struct.unpack_from('<h',b,o)[0]
def u32(o):return struct.unpack_from('<I',b,o)[0]
sha=hashlib.sha256(b).hexdigest();ck('exe_sha',sha=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',sha);ck('exe_size',len(b)==861133,len(b))
BASE=0x26654;LE=0x28f0c;ck('embedded_mz',b[BASE:BASE+2]==b'MZ',b[BASE:BASE+2]);ck('embedded_e_lfanew',u32(BASE+0x3c)==0x28b8,hex(u32(BASE+0x3c)));ck('embedded_to_le',BASE+u32(BASE+0x3c)==LE,hex(BASE+u32(BASE+0x3c)));ck('le_sig',b[LE:LE+4]==b'LE\0\0',b[LE:LE+4])
page_size=u32(LE+0x28);last=u32(LE+0x2c);pages=u32(LE+0x14);page_rel=u32(LE+0x80);DATA=BASE+page_rel;ck('data_base',DATA==0x61c54,hex(DATA));ck('data_eof',DATA+(pages-1)*page_size+last==len(b),hex(DATA+(pages-1)*page_size+last))
objtab=LE+u32(LE+0x40);objs=[]
for i in range(u32(LE+0x44)):
 p=objtab+i*24;objs.append({'idx':i+1,'size':u32(p),'base':u32(p+4),'mapidx':u32(p+12),'pages':u32(p+16)})
ck('object_geometry',objs==[{'idx':1,'size':0x3ee98,'base':0x10000,'mapidx':1,'pages':63},{'idx':2,'size':0x86660,'base':0x50000,'mapidx':64,'pages':50}],objs)
mapoff=LE+u32(LE+0x48);mapents=[((b[mapoff+i*4]<<16)|(b[mapoff+i*4+1]<<8)|b[mapoff+i*4+2],b[mapoff+i*4+3]) for i in range(pages)];ck('page_map',all(x==(i+1,0) for i,x in enumerate(mapents)),'sequential 1..113 flags=0')
fpt=LE+u32(LE+0x68);frt=LE+u32(LE+0x6c);po=[u32(fpt+i*4) for i in range(pages+1)];ck('fixup_bounds',fpt==0x291cb and frt==0x29393 and frt+po[-1]==0x61af3,(hex(fpt),hex(frt),hex(frt+po[-1])))
def pagephys(lp):return DATA+(mapents[lp-1][0]-1)*page_size
def objforpage(lp):
 for o in objs:
  if o['mapidx']<=lp<o['mapidx']+o['pages']:return o,lp-o['mapidx']
 raise ValueError(lp)
def targetphys(obj,off):
 o=objs[obj-1]; pg=off//page_size
 if pg>=o['pages']:return None
 return pagephys(o['mapidx']+pg)+(off%page_size)
recs=[];type7match=0;type7bad=0;cross=0
for pg0 in range(pages):
 p=frt+po[pg0];end=frt+po[pg0+1]
 while p<end:
  rp=p;src=b[p];flags=b[p+1];p+=2;stype=src&15
  assert not(src&0x20)
  so=i16(p);p+=2;assert (flags&3)==0
  osz=2 if flags&0x40 else 1;obj=int.from_bytes(b[p:p+osz],'little');p+=osz
  toff=0
  if stype!=2:
   tsz=4 if flags&0x10 else 2;toff=int.from_bytes(b[p:p+tsz],'little');p+=tsz
  if flags&4:p+=4 if flags&0x20 else 2
  lp=pg0+1;o,opg=objforpage(lp);sp=pagephys(lp)+so
  raw=int.from_bytes((b[sp:sp+4]+b'\0\0\0\0')[:4],'little')
  rec={'rp':rp,'page':lp,'stype':stype,'flags':flags,'sp':sp,'sobj':o['idx'],'soff':opg*page_size+so,'obj':obj,'toff':toff,'tp':targetphys(obj,toff),'raw':raw};recs.append(rec)
  if stype==7:
   if raw==toff:type7match+=1
   else:type7bad+=1
   if sp+4>len(b):cross+=1
 assert p==end
ck('record_count',len(recs)==27004,len(recs));ck('type7_count',sum(x['stype']==7 for x in recs)==26900,sum(x['stype']==7 for x in recs));ck('type8_count',sum(x['stype']==8 for x in recs)==104,sum(x['stype']==8 for x in recs));ck('flag10_count',sum(x['flags']==0x10 for x in recs)==21118,sum(x['flags']==0x10 for x in recs));ck('flag00_count',sum(x['flags']==0 for x in recs)==5886,sum(x['flags']==0 for x in recs));ck('all_internal',all((x['flags']&3)==0 for x in recs),len(recs));ck('type7_raw_matches',type7match==26900 and type7bad==0,(type7match,type7bad));ck('last_page_cross',cross==1,cross)
by={x['sp']:x for x in recs};A=by.get(0x85aa5);B=by.get(0x85aac);ck('selector_A_immediate',A and A['obj']==2 and A['toff']==0x1c1b8,(A or {}));ck('selector_B_immediate',B and B['obj']==2 and B['toff']==0x1c1fc,(B or {}))
uniq=set();rows=[]
for mode,fx in [('A',A),('B',B)]:
 tp=fx['tp']; ck(f'table_{mode}_physical',tp in (0xbce0c,0xbce50),hex(tp));
 for slot in range(17):
  f=by.get(tp+slot*4);good=f is not None and f['obj']==1 and f['tp'] is not None and u16(f['tp'])==63
  ck(f'table_{mode}_slot_{slot:02d}',good, f"src={hex(tp+slot*4)} target={hex(f['tp']) if f and f['tp'] else None} count={u16(f['tp']) if f and f['tp'] else None}")
  if good:uniq.add(f['tp']);rows.append((mode,slot,f['tp']))
ck('selector_fixup_count',len(rows)==34,len(rows));ck('unique_palette_records',len(uniq)==29,len(uniq));ck('report_verdict',r.get('decision',{}).get('verdict')=='MK2_BOUND_LE_FIXUP_AND_PALETTE_POINTER_PROVENANCE_ESTABLISHED_JC0_SLOT_JOIN_UNRESOLVED',r.get('decision',{}).get('verdict'));ck('report_jc0_boundary',r.get('decision',{}).get('jc0PaletteOwnershipEstablished') is False and r.get('jc0Boundary',{}).get('correctColorRgbaEstablished') is False,'unresolved preserved');ck('report_fixup_counts',r.get('fixupMapping',{}).get('recordCount')==27004 and r.get('fixupMapping',{}).get('type7RawTargetOffsetMatches')==26900,r.get('fixupMapping',{}));ck('report_palette_counts',r.get('palettePointerSurface',{}).get('selectorPointerFixupCount')==34 and r.get('palettePointerSurface',{}).get('uniquePaletteRecordCount')==29,r.get('palettePointerSurface',{}).get('uniquePaletteRecordCount'))
failed=[x for x in checks if not x['passed']];out={'format':'mk2_o72_independent_audit_v1','source':'independent Python parser over authentic MK2.EXE; does not call TypeScript O72 implementation','checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks};json.dump(out,open(out_path,'w'),indent=2);print(json.dumps({k:out[k] for k in ('checkCount','passedCount','failedCount','allChecksPassed')},indent=2));raise SystemExit(1 if failed else 0)
